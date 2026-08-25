"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../..");
const UI_AUTOMATION = path.join(__dirname, "m86-24UiAutomation.ps1");
const TARGETS = Object.freeze([
  Object.freeze({ id: "rechnung.editor.positionQuantityDecimals.increase", selectionPrefix: "Nachkommastellen erh" }),
  Object.freeze({ id: "rechnung.editor.positionCreateTitle", selectionPrefix: "+Titel" }),
  Object.freeze({ id: "rechnung.editor.positionCreate", selectionPrefix: "+Position" }),
  Object.freeze({ id: "rechnung.editor.positionMove", selectionPrefix: "Schieben" }),
  Object.freeze({ id: "rechnung.editor.positionDelete", selectionMatch: "schen" }),
  Object.freeze({ id: "rechnung.editor.preview", selectionPrefix: "Proberechnung" }),
  Object.freeze({ id: "rechnung.editor.headToggle", selectionPrefix: "Kopf" }),
]);

function delay(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }

function runPowerShell(processId, action, count = 1) {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", UI_AUTOMATION, "-ProcessId", String(processId), "-Action", action, "-Count", String(count)], { cwd: ROOT, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code !== 0) return reject(new Error(stderr || stdout || `UI Automation exit ${code}`));
      try { resolve(JSON.parse(stdout)); } catch (error) { reject(new Error(`UI Automation lieferte kein JSON: ${stdout}\n${error.message}`)); }
    });
  });
}

async function renderer(mainWindow, expression) {
  return await mainWindow.webContents.executeJavaScript(expression, true);
}

async function waitForProductPath(mainWindow, controller) {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const ready = await renderer(mainWindow, "Boolean(globalThis.__bbmRechnungAcceptance?.ready)").catch(() => false);
    if (ready && controller?.child?.pid) return controller.child.pid;
    await delay(100);
  }
  throw new Error("RECHNUNG_PRODUCT_ACCEPTANCE_NOT_READY");
}

async function measure(mainWindow, elementId) {
  return await renderer(mainWindow, `globalThis.__bbmRechnungAcceptance.measure(${JSON.stringify(elementId)})`);
}

async function selectTarget(mainWindow, processId, target) {
  const selectionActivations = [];
  let interaction = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    selectionActivations.push(await runPowerShell(processId, "SelectTarget"));
    interaction = await renderer(mainWindow, "globalThis.__bbmRechnungAcceptance.interaction()");
    if (interaction.selectionMode === true) break;
  }
  if (interaction?.selectionMode !== true) throw new Error(`RECHNUNG_PRODUCT_SELECTION_MODE_NOT_ACTIVE:${target.id}:${JSON.stringify({ selectionActivations, interaction })}`);
  const activated = await renderer(mainWindow, `globalThis.__bbmRechnungAcceptance.activate(${JSON.stringify(target.id)})`);
  const domSelection = await renderer(mainWindow, `globalThis.__bbmRechnungAcceptance.select(${JSON.stringify(target.id)})`);
  if (domSelection?.ok !== true) throw new Error(`RECHNUNG_PRODUCT_DOM_SELECTION_FAILED:${target.id}:${JSON.stringify({ activated, domSelection })}`);
  await delay(650);
  const afterClick = await renderer(mainWindow, "globalThis.__bbmRechnungAcceptance.interaction()");
  if (afterClick.selectedId !== target.id) throw new Error(`RECHNUNG_PRODUCT_TARGET_CLICK_FAILED:${target.id}:${JSON.stringify({ activated, domSelection, afterClick })}`);
  const editorSelection = await runPowerShell(processId, "ReadSelection");
  const selectionMatches = editorSelection.matching?.some((value) => target.selectionMatch ? value.includes(target.selectionMatch) : value.startsWith(target.selectionPrefix));
  if (!selectionMatches) {
    throw new Error(`RECHNUNG_PRODUCT_TARGET_SELECTION_FAILED:${target.id}:${JSON.stringify({ activated, domSelection, afterClick, editorSelection })}`);
  }
  return { selectionActivations, activated, domSelection, afterClick, editorSelection };
}

function dimensionActions(dimension) {
  return dimension === "width"
    ? { minus: "ClickWidthMinus", plus: "ClickWidthPlus" }
    : { minus: "ClickHeightMinus", plus: "ClickHeightPlus" };
}

async function shrinkDimensionToSix(mainWindow, processId, elementId, dimension) {
  const actions = dimensionActions(dimension);
  const before = await measure(mainWindow, elementId);
  await runPowerShell(processId, "SelectStep10");
  const tenStepCount = Math.max(0, Math.floor((before.bounds[dimension] - 16) / 10));
  const tenStep = tenStepCount > 0 ? await runPowerShell(processId, actions.minus, tenStepCount) : null;
  await runPowerShell(processId, "SelectStep1");
  const beforeCalibration = await measure(mainWindow, elementId);
  let first = null;
  let remaining = null;
  let remainingCount = 0;
  let measuredStep = 1;
  if (beforeCalibration.bounds[dimension] > 6.2) {
    first = await runPowerShell(processId, actions.minus);
    const afterFirst = await measure(mainWindow, elementId);
    measuredStep = Math.max(0.1, beforeCalibration.bounds[dimension] - afterFirst.bounds[dimension]);
    remainingCount = Math.max(0, Math.round((afterFirst.bounds[dimension] - 6) / measuredStep));
    remaining = remainingCount > 0 ? await runPowerShell(processId, actions.minus, remainingCount) : null;
  } else if (beforeCalibration.bounds[dimension] < 5.8) {
    first = await runPowerShell(processId, actions.plus);
  }
  const after = await measure(mainWindow, elementId);
  return { dimension, requested: 6, before, tenStepCount, tenStep, beforeCalibration, first, measuredStep, remainingCount, remaining, after };
}

async function exerciseTarget(mainWindow, processId, target) {
  const selection = await selectTarget(mainWindow, processId, target);
  const initial = await measure(mainWindow, target.id);
  const widthSmall = await shrinkDimensionToSix(mainWindow, processId, target.id, "width");
  const afterWidthSmall = await measure(mainWindow, target.id);
  const heightSmall = await shrinkDimensionToSix(mainWindow, processId, target.id, "height");
  const afterBothSmall = await measure(mainWindow, target.id);
  await runPowerShell(processId, "SelectStep10");
  const widthGrow = await runPowerShell(processId, "ClickWidthPlus", 12);
  const afterWidthGrow = await measure(mainWindow, target.id);
  const heightGrow = await runPowerShell(processId, "ClickHeightPlus", 8);
  const afterBothGrow = await measure(mainWindow, target.id);
  const widthSmallFinal = await shrinkDimensionToSix(mainWindow, processId, target.id, "width");
  const afterWidthSmallFinal = await measure(mainWindow, target.id);
  const heightSmallFinal = await shrinkDimensionToSix(mainWindow, processId, target.id, "height");
  const final = await measure(mainWindow, target.id);
  return { target, selection, initial, widthSmall, afterWidthSmall, heightSmall, afterBothSmall, widthGrow, afterWidthGrow, heightGrow, afterBothGrow, widthSmallFinal, afterWidthSmallFinal, heightSmallFinal, final };
}

async function closeEditor(controller) {
  if (!controller?.child?.pid) return { alreadyClosed: true };
  const processId = controller.child.pid;
  const close = await runPowerShell(processId, "BeginClose");
  for (let attempt = 0; attempt < 100 && controller.status().running; attempt += 1) await delay(100);
  return { close, runningAfterClose: controller.status().running };
}

async function runRechnungButtonProductAcceptance({ mainWindow, controller, acceptanceRoot, action = "Run" }) {
  const resultPath = path.join(acceptanceRoot, `rechnung-button-product-${action}.json`);
  const profileFile = path.join(acceptanceRoot, "userData", "ui-editor", "profiles", "module-rechnung", "standard.layout-profile.json");
  try {
    const processId = await waitForProductPath(mainWindow, controller);
    const route = await renderer(mainWindow, "globalThis.__bbmRechnungAcceptance.route");
    const startupRestore = await renderer(mainWindow, "globalThis.__bbmRechnungAcceptance.startupRestore");
    const before = await renderer(mainWindow, "globalThis.__bbmRechnungAcceptance.measureAll()");
    if (action === "RestoreOnly") {
      const restored = await renderer(mainWindow, "globalThis.__bbmRechnungAcceptance.measureAll()");
      const editorClose = await closeEditor(controller);
      const report = { ok: true, action, route, startupRestore, before, restored, editorClose, profileFile };
      fs.writeFileSync(resultPath, JSON.stringify(report, null, 2), "utf8");
      return report;
    }
    const exercises = [];
    for (const target of TARGETS) exercises.push(await exerciseTarget(mainWindow, processId, target));
    const visibleSave = await runPowerShell(processId, "ClickSave");
    for (let attempt = 0; attempt < 100 && !fs.existsSync(profileFile); attempt += 1) await delay(100);
    const savedSelection = await runPowerShell(processId, "ReadSelection");
    const editorClose = await closeEditor(controller);
    const afterEditorClose = await renderer(mainWindow, "globalThis.__bbmRechnungAcceptance.measureAll()");
    const afterInvoiceReopen = await renderer(mainWindow, "globalThis.__bbmRechnungAcceptance.reopenInvoice()");
    const persisted = fs.existsSync(profileFile) ? JSON.parse(fs.readFileSync(profileFile, "utf8")) : null;
    const report = { ok: true, action, route, startupRestore, before, exercises, visibleSave, savedSelection, editorClose, afterEditorClose, afterInvoiceReopen, profileFile, persisted };
    fs.writeFileSync(resultPath, JSON.stringify(report, null, 2), "utf8");
    return report;
  } catch (error) {
    const report = { ok: false, action, error: error?.stack || String(error) };
    fs.writeFileSync(resultPath, JSON.stringify(report, null, 2), "utf8");
    throw error;
  }
}

module.exports = { runRechnungButtonProductAcceptance };
