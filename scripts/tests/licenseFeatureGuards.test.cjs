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

  await run("License-Guard: PDF-IPC prüft PDF-Feature", () => {
    assert.equal(printIpc.includes("_enforceFeature(LICENSE_FEATURES.PDF);"), true);
  });

  await run("License-Guard: Audio-IPC prüft Audio-Feature", () => {
    assert.equal(audioIpc.includes("enforceLicensedFeature(LICENSE_FEATURES.AUDIO);"), true);
  });

  await run("License-Guard: Mail-IPC prüft Mail-Feature", () => {
    assert.equal(mainSource.includes("enforceLicensedFeature(LICENSE_FEATURES.MAIL);"), true);
  });

  await run("License-Guard: Projektzugriff prüft App-Feature", () => {
    assert.equal(projectsIpc.includes("enforceLicensedFeature(LICENSE_FEATURES.APP);"), true);
  });

  await run("License-Guard: Lizenzfehler werden payload-freundlich gemappt", () => {
    assert.equal(printIpc.includes("return toLicenseErrorPayload(err);"), true);
    assert.equal(mainSource.includes("return toLicenseErrorPayload(err);"), true);
    assert.equal(audioIpc.includes("return toLicenseErrorPayload(err);"), true);
  });
}

module.exports = { runLicenseFeatureGuardTests };
