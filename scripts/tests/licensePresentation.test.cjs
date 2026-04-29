const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function runLicensePresentationTests(run) {
  const featureGuard = require(path.join(process.cwd(), "src/main/licensing/featureGuard.js"));

  await run("Lizenztext: customerName wird bevorzugt", () => {
    const out = featureGuard.buildLicensedToText({ valid: true, license: { customerName: "Musterbau GmbH", licenseId: "LIC-1" } });
    assert.equal(out, "Lizenziert für Musterbau GmbH");
  });

  await run("Lizenztext: fallback auf licenseId", () => {
    const out = featureGuard.buildLicensedToText({ valid: true, license: { licenseId: "LIC-1" } });
    assert.equal(out, "Lizenziert für Lizenz LIC-1");
  });

  await run("Lizenztext: ungueltig => Nicht lizenziert", () => {
    const out = featureGuard.buildLicensedToText({ valid: false, license: { customerName: "X" } });
    assert.equal(out, "Nicht lizenziert");
  });

  await run("license:get-status liefert licensedToText", () => {
    const src = read("src/main/ipc/licenseIpc.js");
    assert.equal(src.includes("licensedToText: buildLicensedToText(status)"), true);
  });

  await run("Print-Daten enthalten license.licensedToText", () => {
    const src = read("src/main/print/printData.js");
    assert.equal(src.includes("license:"), true);
    assert.equal(src.includes("licensedToText: buildLicensedToText(status)"), true);
  });

  await run("Print-Template zeigt licensedToText einmal auf Seite 1", () => {
    const src = read("src/renderer/print/layout/PrintShell.js");
    assert.equal(src.includes("function _buildLicensedToNote"), true);
    assert.equal(src.includes("pageNo === 1"), true);
  });

  await run("Keine Rueckkehr von license-admin IPCs im preload", () => {
    const preload = read("src/main/preload.js");
    assert.equal(preload.includes("licenseAdmin"), false);
    assert.equal(preload.includes("generator"), false);
  });
}

module.exports = { runLicensePresentationTests };
