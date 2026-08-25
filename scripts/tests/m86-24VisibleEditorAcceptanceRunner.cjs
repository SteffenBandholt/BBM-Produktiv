"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow, ipcMain } = require("electron");
const { ElectronUiEditorSessionController } = require("../../src/main/ui-editor/electronUiEditorSession.js");

const root = path.resolve(__dirname, "../..");
const resultPath = path.resolve(process.env.BBM_M8624_RESULT_PATH || "m86-24-missing-result.json");
const profileRoot = path.resolve(process.env.BBM_M8624_PROFILE_ROOT || path.join(path.dirname(resultPath), "profiles"));
const action = process.env.BBM_M8624_ACTION || "Dump";
const moduleId = process.env.BBM_M8624_MODULE || "protokoll";
const harnessUrl = pathToFileURL(path.join(__dirname, "m86-24VisibleEditorAcceptanceHarness.mjs")).href;
const editorTrace = [];
const originalConsoleInfo = console.info.bind(console);
console.info = (...values) => {
  const message = values.map((value) => typeof value === "string" ? value : JSON.stringify(value)).join(" ");
  if (message.includes("[ui-editor]")) editorTrace.push({ at: new Date().toISOString(), message });
  originalConsoleInfo(...values);
};

function startPowerShell(processId, requestedAction = action, count = 1) {
  const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(__dirname, "m86-24UiAutomation.ps1"), "-ProcessId", String(processId), "-Action", requestedAction, "-Count", String(count)], { cwd: root, windowsHide: true });
  const completed = new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve(JSON.parse(stdout)) : reject(new Error(stderr || stdout || `UI Automation exit ${code}`)));
  });
  return { child, completed };
}

function runPowerShell(processId, requestedAction = action, count = 1) { return startPowerShell(processId, requestedAction, count).completed; }

async function selectVisibleEditorTarget(window, processId, targetConfig) {
  const selectionActivation = await runPowerShell(processId, "SelectTarget");
  const selectionProbe = await window.webContents.executeJavaScript(`window.__m8624.selectVisibleAcceptanceTargetInApp(${JSON.stringify(targetConfig.elementId)})`, true);
  await new Promise((resolve) => setTimeout(resolve, 750));
  const editorSelection = await runPowerShell(processId, "ReadSelection");
  const selectionPrefix = targetConfig.elementId.includes("positionQuantityDecimals") ? "Nachkommastellen" : targetConfig.displayName;
  if (!editorSelection.matching?.some((value) => value.startsWith(selectionPrefix))) {
    throw new Error(`Sichtbare Button-Auswahl wurde nicht synchronisiert: ${JSON.stringify({ targetConfig, selectionProbe, editorSelection })}`);
  }
  return { selectionActivation, selectionProbe, editorSelection, initial: await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true) };
}

async function exerciseVisibleInvoiceButton(window, processId, targetConfig) {
  const selected = await selectVisibleEditorTarget(window, processId, targetConfig);
  const widthMinus = await runPowerShell(processId, "ClickWidthMinus", 3);
  const afterWidthMinus = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
  const heightMinus = await runPowerShell(processId, "ClickHeightMinus", 3);
  const afterShrink = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
  const widthPlus = await runPowerShell(processId, "ClickWidthPlus");
  const heightPlus = await runPowerShell(processId, "ClickHeightPlus");
  const afterGrow = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
  const widthMinusFinal = await runPowerShell(processId, "ClickWidthMinus");
  const heightMinusFinal = await runPowerShell(processId, "ClickHeightMinus");
  const final = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
  return { targetConfig, selected, widthMinus, afterWidthMinus, heightMinus, afterShrink, widthPlus, heightPlus, afterGrow, widthMinusFinal, heightMinusFinal, final };
}

app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.whenReady().then(async () => {
  let window;
  let controller;
  try {
    window = new BrowserWindow({ show: true, width: 1600, height: 1000, webPreferences: { preload: path.join(root, "src", "main", "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: false, backgroundThrottling: false } });
    const targetApp = { isPackaged: false, getPath: app.getPath.bind(app), getAppPath: () => root, getVersion: app.getVersion.bind(app) };
    controller = new ElectronUiEditorSessionController({ app: targetApp, ipcMain, getMainWindow: () => window, profileRootResolver: () => profileRoot });
    controller.registerIpc();
    await window.loadFile(path.join(__dirname, "m86-24VisibleEditorAcceptance.html"));
    const preload = await window.webContents.executeJavaScript("({ title: document.title, url: location.href, uiEditorKeys: Object.keys(window.uiEditor || {}) })", true);
    fs.writeFileSync(resultPath, JSON.stringify({ ok: false, stage: "renderer-loaded", preload }, null, 2), "utf8");
    if (action === "RestoreOnly") {
      const restarted = await window.webContents.executeJavaScript(`import(${JSON.stringify(harnessUrl)}).then((module) => { window.__m8624 = module; return module.remountForRestart(${JSON.stringify(moduleId)}); })`, true);
      const renderer = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
      fs.writeFileSync(resultPath, JSON.stringify({ ok: true, restartOnly: true, restarted, renderer, editorTrace }, null, 2), "utf8");
      return;
    }
    const started = await Promise.race([
      window.webContents.executeJavaScript(`import(${JSON.stringify(harnessUrl)}).then((module) => { window.__m8624 = module; return module.startVisibleAcceptance(${JSON.stringify(moduleId)}); })`, true),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Sichtbarer Editorstart lief in ein Zeitlimit.")), 30_000)),
    ]);
    if (!started?.opened?.ok || !controller.child?.pid) throw new Error(started?.opened?.message || "Sichtbarer UI-Editor wurde nicht gestartet.");
    let automation;
    if (["ProtokollSave", "RestarbeitenSave", "RechnungSave"].includes(action)) {
      fs.writeFileSync(resultPath, JSON.stringify({ ok: false, stage: "before-selection", started }, null, 2), "utf8");
      const selection = await runPowerShell(controller.child.pid, "SelectTarget");
      fs.writeFileSync(resultPath, JSON.stringify({ ok: false, stage: "selection-active", started, selection }, null, 2), "utf8");
      const targetConfig = moduleId === "rechnung"
        ? { scopeId: "rechnung.screen", elementId: "rechnung.editor.positionShort", displayName: "Kurztext", parentId: "rechnung.editor.positionEditor" }
        : moduleId === "restarbeiten"
        ? { scopeId: "restarbeiten.edit.root", elementId: "restarbeiten.edit.short.label", displayName: "Kurztext · Feldbezeichnung", parentId: "restarbeiten.edit.short.group" }
        : { scopeId: "protokoll.list.root", elementId: "protokoll.list.row.due", displayName: "Fertig bis · Listeneinträge", parentId: "protokoll.list.column.meta.cells" };
      const targetBounds = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState().target.targets[0].bounds", true);
      const point = { x: Math.round(targetBounds.x + targetBounds.width / 2), y: Math.round(targetBounds.y + targetBounds.height / 2) };
      window.show();
      window.focus();
      window.webContents.sendInputEvent({ type: "mouseMove", ...point });
      await new Promise((resolve) => setTimeout(resolve, 300));
      const selectionEvent = await window.webContents.executeJavaScript(`window.uiEditor.sendTargetEvent(${JSON.stringify({ action: "targetSelectionChanged", ...targetConfig, elementType: "label", selectionKind: "element", selectionLevel: "element", childCount: 0 })})`, true);
      await new Promise((resolve) => setTimeout(resolve, 750));
      const selectedTarget = { id: targetConfig.elementId, selected: "protocol-event", forwarded: selectionEvent?.ok === true };
      const editorSelection = await runPowerShell(controller.child.pid, "ReadSelection");
      const expectedSelectionPrefix = ["restarbeiten", "rechnung"].includes(moduleId) ? "Kurztext" : "Fertig bis";
      if (!editorSelection.matching?.some((value) => value.startsWith(expectedSelectionPrefix))) throw new Error(`Sichtbare Editor-Auswahl wurde nicht synchronisiert: ${JSON.stringify(editorSelection)}`);
      fs.writeFileSync(resultPath, JSON.stringify({ ok: false, stage: "target-clicked", started, selection, point, selectedTarget }, null, 2), "utf8");
      const beforeMinus = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
      const minusSteps = [];
      for (let index = 0; index < 3; index += 1) {
        const click = await runPowerShell(controller.child.pid, "ClickWidthMinus");
        const measured = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
        minusSteps.push({ click, measured });
      }
      let invoiceRange = null;
      if (moduleId === "rechnung") {
        const shrinkClick = await runPowerShell(controller.child.pid, "ClickWidthMinus", 120);
        const afterShrink = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
        const growClick = await runPowerShell(controller.child.pid, "ClickWidthPlus", 140);
        const afterGrow = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
        invoiceRange = { shrinkClick, afterShrink, growClick, afterGrow };
      }
      const plusClick = await runPowerShell(controller.child.pid, "ClickWidthPlus");
      const afterPlus = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
      const symmetryMinusClick = moduleId === "rechnung" ? null : await runPowerShell(controller.child.pid, "ClickWidthMinus");
      const afterSymmetryMinus = moduleId === "rechnung" ? afterPlus : await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
      const symmetry = { plusClick, afterPlus, minusClick: symmetryMinusClick, afterMinus: afterSymmetryMinus };
      let invoiceButtons = null;
      if (moduleId === "rechnung") {
        const targets = [
          { scopeId: "rechnung.screen", elementId: "rechnung.editor.positionQuantityDecimals.increase", displayName: "Nachkommastellen erhöhen", parentId: "rechnung.editor.positionQuantityDecimals" },
          { scopeId: "rechnung.screen", elementId: "rechnung.editor.positionCreate", displayName: "+Position", parentId: "rechnung.editor.positionActions" },
          { scopeId: "rechnung.screen", elementId: "rechnung.editor.preview", displayName: "Proberechnung", parentId: "rechnung.editor.header" },
        ];
        invoiceButtons = [];
        for (const buttonTarget of targets) invoiceButtons.push(await exerciseVisibleInvoiceButton(window, controller.child.pid, buttonTarget));
        await window.webContents.executeJavaScript(`window.__m8624.setVisibleAcceptanceTarget(${JSON.stringify(targetConfig.elementId)})`, true);
      }
      const beforeClose = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
      const afterMinusEditorState = await runPowerShell(controller.child.pid, "ReadSelection");
      fs.writeFileSync(resultPath, JSON.stringify({ ok: false, stage: "before-visible-close", started, selection, point, selectedTarget, editorSelection, beforeMinus, minusSteps, invoiceRange, symmetry, invoiceButtons, beforeClose, afterMinusEditorState }, null, 2), "utf8");
      const profileFile = path.join(profileRoot, `module-${moduleId}`, "standard.layout-profile.json");
      let closeAndSave;
      if (moduleId === "rechnung") {
        const visibleSave = await runPowerShell(controller.child.pid, "ClickSave");
        for (let attempt = 0; attempt < 100 && !fs.existsSync(profileFile); attempt += 1) await new Promise((resolve) => setTimeout(resolve, 100));
        const savedEditorState = await runPowerShell(controller.child.pid, "ReadSelection");
        const closeInvocation = await runPowerShell(controller.child.pid, "BeginClose");
        closeAndSave = { visibleSave, savedEditorState, closeInvocation };
      } else {
        const beginClose = startPowerShell(controller.child.pid, "BeginClose");
        await new Promise((resolve) => setTimeout(resolve, 500));
        const saveDialog = await runPowerShell(controller.child.pid, "ClickSaveDialog");
        if (!saveDialog.dialogFound) {
          beginClose.child.kill();
          throw new Error(`Sichtbarer Close-Dialog fehlt nach Aenderung: ${JSON.stringify({ afterMinusEditorState, saveDialog })}`);
        }
        const closeInvocation = await Promise.race([
          beginClose.completed,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Close-Aufruf endete nach dem Dialog-Save nicht.")), 15_000)),
        ]);
        closeAndSave = { closeInvocation, saveDialog };
      }
      for (let attempt = 0; attempt < 100 && controller.status().running; attempt += 1) await new Promise((resolve) => setTimeout(resolve, 100));
      const afterClose = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
      const afterCloseButtonTargets = moduleId === "rechnung"
        ? await window.webContents.executeJavaScript("window.__m8624.measureVisibleAcceptanceTargets()", true)
        : null;
      const afterCloseLayout = await window.webContents.executeJavaScript("window.__m8624.currentLayoutPayload()", true);
      const afterCloseEditorState = controller.status().running ? await runPowerShell(controller.child.pid, "ReadSelection") : null;
      const persisted = fs.existsSync(profileFile) ? JSON.parse(fs.readFileSync(profileFile, "utf8")) : null;
      const afterRestart = await window.webContents.executeJavaScript(`window.__m8624.remountForRestart(${JSON.stringify(moduleId)})`, true);
      automation = { selection, point, selectedTarget, editorSelection, beforeMinus, minusSteps, invoiceRange, symmetry, invoiceButtons, beforeClose, closeAndSave, editorRunningAfterClose: controller.status().running, afterClose, afterCloseButtonTargets, afterCloseLayout, afterCloseEditorState, profileFile, persisted, afterRestart };
    } else automation = await runPowerShell(controller.child.pid);
    const renderer = await window.webContents.executeJavaScript("window.__m8624.currentVisibleAcceptanceState()", true);
    fs.writeFileSync(resultPath, JSON.stringify({ ok: true, started, automation, renderer, editorTrace }, null, 2), "utf8");
  } catch (error) {
    let prior = null;
    try { prior = fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath, "utf8")) : null; } catch { }
    fs.writeFileSync(resultPath, JSON.stringify({ ok: false, error: error?.stack || String(error), prior, editorTrace }, null, 2), "utf8");
    process.exitCode = 1;
  } finally {
    try { await controller?.shutdown(); } catch { }
    if (window && !window.isDestroyed()) window.destroy();
    app.quit();
  }
});
