const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function runLicenseFeatureGuardTests(run) {
  const printIpc = read("src/main/ipc/printIpc.js");
  const audioIpc = read("src/main/ipc/audioIpc.js");
  const mainSource = read("src/main/main.js");
  const projectsIpc = read("src/main/ipc/projectsIpc.js");

  await run("License-Guard: PDF-IPC prüft Protokoll-Modul", () => {
    assert.equal(printIpc.includes('_enforceFeature("protokoll");'), true);
  });

  await run("License-Guard: Audio-IPC prüft Diktat-Feature", () => {
    assert.equal(audioIpc.includes("enforceLicensedFeature(LICENSE_FEATURES.DIKTAT);"), true);
  });

  await run("License-Guard: Mail-IPC prüft Protokoll-Modul", () => {
    assert.equal(mainSource.includes('enforceLicensedFeature("protokoll");'), true);
  });

  await run("License-Guard: Projektzugriff prüft Protokoll-Modul", () => {
    assert.equal(projectsIpc.includes('enforceLicensedFeature("protokoll");'), true);
  });

  await run("License-Guard: Projektzugriff mappt Lizenzfehler als Payload", () => {
    assert.equal(projectsIpc.includes("toLicenseErrorPayload"), true);
    assert.equal(projectsIpc.includes("return toLicenseErrorPayload(err);"), true);
    assert.equal(projectsIpc.includes("_runProjectTask"), true);
  });

  await run("License-Guard: Lizenzfehler werden payload-freundlich gemappt", () => {
    assert.equal(printIpc.includes("return toLicenseErrorPayload(err);"), true);
    assert.equal(mainSource.includes("return toLicenseErrorPayload(err);"), true);
    assert.equal(audioIpc.includes("return toLicenseErrorPayload(err);"), true);
  });
}

module.exports = { runLicenseFeatureGuardTests };
