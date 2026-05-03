const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function runSettingsPrintLayoutTests(run) {
  const { default: SettingsView } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/views/SettingsView.js")
  );
  const settingsSource = read("src/renderer/views/SettingsView.js");

  await run("SettingsView: Print-Layout-Felder sind numerisch konfiguriert", () => {
    assert.equal(settingsSource.includes('field.type === "number"'), true);
    assert.equal(settingsSource.includes('inputMode = "numeric"'), true);
    assert.equal(settingsSource.includes('inp.type = "number"'), true);
    assert.equal(settingsSource.includes('inp.min = String(limits.min);'), true);
    assert.equal(settingsSource.includes('inp.max = String(limits.max);'), true);
    assert.equal(settingsSource.includes('inp.step = String(limits.step);'), true);
    assert.equal(settingsSource.includes("print.v2.pagePadTopMm"), true);
    assert.equal(settingsSource.includes("print.v2.pagePadLeftMm"), true);
    assert.equal(settingsSource.includes("print.v2.pagePadRightMm"), true);
    assert.equal(settingsSource.includes("print.v2.pagePadBottomMm"), true);
    assert.equal(settingsSource.includes("print.v2.footerReserveMm"), true);
  });

  await run("SettingsView: Drucklayout zeigt einen sichtbaren Standardwerte-Reset", () => {
    assert.equal(settingsSource.includes("Standardwerte wiederherstellen"), true);
    assert.equal(settingsSource.includes("_resetPrintLayoutFields"), true);
  });

  await run("SettingsView: Print-Layout-Werte werden auf gueltige mm-Werte normalisiert", () => {
    const view = new SettingsView({});
    assert.equal(view._normalizePrintLayoutMmValue("3.7", "print.v2.pagePadTopMm"), "4");
    assert.equal(view._normalizePrintLayoutMmValue("999", "print.v2.pagePadLeftMm"), "30");
    assert.equal(view._normalizePrintLayoutMmValue("-5", "print.v2.pagePadBottomMm"), "0");
    assert.equal(view._normalizePrintLayoutMmValue("abc", "print.v2.footerReserveMm"), "12");
    assert.equal(view._normalizePrintLayoutMmValue("17", "print.v2.footerReserveMm"), "17");
    assert.equal(view._isPrintLayoutMmKey("print.v2.pagePadRightMm"), true);
    assert.equal(view._isPrintLayoutMmKey("pdf.protocolTitle"), false);
  });

  await run("SettingsView: Standardwerte setzen nur die Drucklayout-Felder", () => {
    const view = new SettingsView({});
    const inputs = new Map([
      ["print.v2.pagePadTopMm", { value: "9" }],
      ["print.v2.pagePadLeftMm", { value: "8" }],
      ["print.v2.pagePadRightMm", { value: "7" }],
      ["print.v2.pagePadBottomMm", { value: "6" }],
      ["print.v2.footerReserveMm", { value: "5" }],
      ["pdf.protocolTitle", { value: "Bleibt unveraendert" }],
    ]);
    view._settingsInputs = inputs;

    view._resetPrintLayoutFields();

    assert.deepEqual(
      {
        top: inputs.get("print.v2.pagePadTopMm").value,
        left: inputs.get("print.v2.pagePadLeftMm").value,
        right: inputs.get("print.v2.pagePadRightMm").value,
        bottom: inputs.get("print.v2.pagePadBottomMm").value,
        reserve: inputs.get("print.v2.footerReserveMm").value,
        title: inputs.get("pdf.protocolTitle").value,
      },
      {
        top: "2",
        left: "12",
        right: "12",
        bottom: "0",
        reserve: "12",
        title: "Bleibt unveraendert",
      }
    );
  });
}

module.exports = { runSettingsPrintLayoutTests };
