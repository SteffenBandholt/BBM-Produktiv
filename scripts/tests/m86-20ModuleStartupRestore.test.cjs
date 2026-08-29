"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { spawnSync } = require("node:child_process");
const electronBinary = require("electron");

const ROOT = path.resolve(__dirname, "../..");
const RUNNER = path.join(__dirname, "m86-20ModuleStartupRestoreRunner.cjs");
const REGISTRY = path.join(ROOT, "src", "renderer", "ui-editor", "m80Registry.js");

function runM8620Renderer() {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-m8620-"));
  const resultFile = path.join(temporaryRoot, "result.json");
  const host = path.join(temporaryRoot, "host");
  try {
    fs.mkdirSync(host);
    fs.writeFileSync(path.join(host, "package.json"), JSON.stringify({ main: "main.cjs" }), "utf8");
    fs.writeFileSync(path.join(host, "main.cjs"), `require(${JSON.stringify(RUNNER)});\n`, "utf8");
    const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "ELECTRON_RUN_AS_NODE")), BBM_M8620_RESULT_PATH: resultFile };
    const child = spawnSync(electronBinary, [host], { cwd: ROOT, env, encoding: "utf8", timeout: 180000, windowsHide: true });
    const report = fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile, "utf8")) : null;
    assert.equal(child.status, 0, `M86.20 Chromium-Lauf fehlgeschlagen:\n${child.stderr || child.stdout || "ohne Ausgabe"}`);
    assert.ok(report?.ok, report?.error || "M86.20-Bericht fehlt.");
    return report;
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function moduleIdFromScope(scopeId) {
  return String(scopeId || "").trim().split(".", 1)[0];
}

async function assertRegistryGroupsAreAutomatic() {
  const registry = await import(`${pathToFileURL(REGISTRY).href}?m8620=${Date.now()}`);
  const componentScopes = [...new Set(
    registry.listM83ComponentContracts()
      .map((component) => String(component?.scopeId || "").trim())
      .filter(Boolean)
  )];
  assert.deepEqual(registry.BBM_M80_ACTIVE_SCOPES, componentScopes,
    "Aktive Scopes muessen vollstaendig aus den Komponentenvertraegen entstehen.");

  const expectedGroups = new Map();
  for (const scopeId of componentScopes) {
    const moduleId = moduleIdFromScope(scopeId);
    const group = expectedGroups.get(moduleId) || [];
    group.push(scopeId);
    expectedGroups.set(moduleId, group);
  }
  assert.deepEqual(
    registry.BBM_M80_ACTIVE_SCOPE_GROUPS.map((group) => [...group]),
    [...expectedGroups.values()],
    "Neue Module oder neue Modul-Scopes muessen ohne Handliste automatisch eine Persistenzgruppe erhalten."
  );
}

async function runM8620ModuleStartupRestoreTests(run) {
  await run("M86.20: alle registrierten Komponenten erzeugen automatisch aktive Modul-Persistenzgruppen", async () => {
    await assertRegistryGroupsAreAutomatic();
  });

  let report;
  await run("M86.20: produktive Neustart-Fixtures wenden ihr gespeichertes Layout beim normalen Modulstart genau einmal an", () => {
    report = runM8620Renderer();
    for (const moduleId of ["restarbeiten", "protokoll"]) {
      assert.deepEqual(report[moduleId] && {
        loadWithoutEditor: report[moduleId].loadWithoutEditor,
        noSecondApply: report[moduleId].noSecondApply,
      }, { loadWithoutEditor: true, noSecondApply: true }, moduleId);
    }
    assert.equal(report.restarbeiten.rerender, true);
    assert.equal(report.restarbeiten.projectChange, true);
    assert.equal(report.separateModuleProfiles, true);
    assert.equal(report.loads.length, 2, "Jedes gemountete Fixture-Modulprofil wird genau einmal geladen.");
  });
  await run("M86.25: bestätigte Restarbeiten-Geometrie wird beim Neustart ohne interaktiven Risikodialog wiederhergestellt", () => {
    assert.ok(report?.restarbeiten?.width > 0);
    assert.equal(report.restarbeiten.remainingX, -190);
    assert.equal(report.restarbeiten.loadWithoutEditor, true);
    assert.equal(report.restarbeiten.rerender, true);
    assert.equal(report.restarbeiten.projectChange, true);
  });
}

module.exports = { runM8620ModuleStartupRestoreTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM8620ModuleStartupRestoreTests(run).then(() => { if (failed) process.exitCode = 1; });
}
