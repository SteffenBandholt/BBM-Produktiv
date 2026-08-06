"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const electronBinary = require("electron");

const ROOT = path.resolve(__dirname, "../..");
const RUNNER = path.join(__dirname, "m86-21RestarbeitenViewportRunner.cjs");

function runM8621Renderer() {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-m8621-"));
  const resultFile = path.join(temporaryRoot, "result.json");
  const host = path.join(temporaryRoot, "host");
  try {
    fs.mkdirSync(host);
    fs.writeFileSync(path.join(host, "package.json"), JSON.stringify({ main: "main.cjs" }), "utf8");
    fs.writeFileSync(path.join(host, "main.cjs"), `require(${JSON.stringify(RUNNER)});\n`, "utf8");
    const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "ELECTRON_RUN_AS_NODE")), BBM_M8621_RESULT_PATH: resultFile };
    const child = spawnSync(electronBinary, [host], { cwd: ROOT, env, encoding: "utf8", timeout: 180000, windowsHide: true });
    const report = fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile, "utf8")) : null;
    assert.equal(child.status, 0, `M86.21 Chromium-Lauf fehlgeschlagen:\n${child.stderr || child.stdout || JSON.stringify(report) || "ohne Ausgabe"}`);
    assert.ok(report?.ok, JSON.stringify(report, null, 2));
    return report;
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

async function runM8621RestarbeitenViewportTests(run) {
  await run("M86.21: Restarbeiten bleibt im Hauptviewport ohne horizontale Ueberbreite", () => {
    const report = runM8621Renderer();
    assert.deepEqual(report.horizontalOverflow, [], JSON.stringify(report, null, 2));
    assert.deepEqual(report.overflowingRegistryBounds, [], JSON.stringify(report, null, 2));
    assert.deepEqual(report.parentOverflow, [], JSON.stringify(report, null, 2));
    assert.ok(report.registryTargetCount > 0, "Die vorhandenen sichtbaren Registry-Ziele wurden nicht gemessen.");
    assert.equal(report.verticalScrollOwner.overflowY, "auto", "Der Listencontainer muss weiter den vertikalen Scrollbesitz haben.");
    assert.ok(report.verticalScrollOwner.scrollHeight > report.verticalScrollOwner.clientHeight, "Die Liste muss vertikal scrollbaren Inhalt behalten.");
  });
}

module.exports = { runM8621RestarbeitenViewportTests, runM8621Renderer };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM8621RestarbeitenViewportTests(run).then(() => { if (failed) process.exitCode = 1; });
}
