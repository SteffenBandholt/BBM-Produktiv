"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const electronBinary = require("electron");

const ROOT = path.resolve(__dirname, "../..");
const RUNNER = path.join(__dirname, "m86-20ModuleStartupRestoreRunner.cjs");

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

async function runM8620ModuleStartupRestoreTests(run) {
  let report;
  await run("M86.20: alle registrierten Komponenten erzeugen automatisch aktive Modul-Persistenzgruppen", () => {
    report = runM8620Renderer();
    assert.equal(report.registryAutomatic?.scopesAutomatic, true,
      "Aktive Scopes muessen vollstaendig aus den Komponentenvertraegen entstehen.");
    assert.equal(report.registryAutomatic?.groupsAutomatic, true,
      "Neue Module oder neue Modul-Scopes muessen ohne Handliste automatisch eine Persistenzgruppe erhalten.");
  });

  await run("M86.20: produktive Neustart-Fixtures wenden ihr gespeichertes Layout beim normalen Modulstart genau einmal an", () => {
    report ||= runM8620Renderer();
    for (const moduleId of ["restarbeiten", "protokoll", "rechnung"]) {
      assert.deepEqual(report[moduleId] && {
        loadWithoutEditor: report[moduleId].loadWithoutEditor,
        noSecondApply: report[moduleId].noSecondApply,
      }, { loadWithoutEditor: true, noSecondApply: true }, moduleId);
    }
    assert.equal(report.restarbeiten.rerender, true);
    assert.equal(report.restarbeiten.projectChange, true);
    assert.equal(report.rechnung.height, 23, "Rechnung muss die gespeicherte LeistungsEditbox-Höhe 23 wiederherstellen.");
    assert.equal(report.separateModuleProfiles, true);
    assert.equal(report.loads.length, 3, "Jedes gemountete Fixture-Modulprofil wird genau einmal geladen.");
  });
  await run("M86.25: bestätigte Restarbeiten-Geometrie wird beim Neustart ohne interaktiven Risikodialog wiederhergestellt", () => {
    assert.ok(report?.restarbeiten?.width > 0);
    assert.equal(report.restarbeiten.remainingX, -190);
    assert.equal(report.restarbeiten.loadWithoutEditor, true);
    assert.equal(report.restarbeiten.rerender, true);
    assert.equal(report.restarbeiten.projectChange, true);
  });
  await run("M86.20 Rechnung: gespeicherte LeistungsEditbox-Höhe bleibt nach normalem Modulstart und Editoröffnung erhalten", () => {
    assert.equal(report?.rechnung?.height, 23);
    assert.equal(report.rechnung.loadWithoutEditor, true);
    assert.equal(report.rechnung.noSecondApply, true);
  });
}

module.exports = { runM8620ModuleStartupRestoreTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM8620ModuleStartupRestoreTests(run).then(() => { if (failed) process.exitCode = 1; });
}
