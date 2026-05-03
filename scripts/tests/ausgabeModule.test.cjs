const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function runAusgabeModuleTests(run) {
  const [{ PrintModal, sendMailPayload }] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/ausgabe/index.js")),
  ]);

  const moduleIndexSource = read("src/renderer/modules/ausgabe/index.js");
  const moduleReadmeSource = read("src/renderer/modules/ausgabe/README.md");
  const printModalSource = read("src/renderer/modules/ausgabe/PrintModal.js");
  const printAppSource = read("src/renderer/print/printApp.js");
  const sendMailSource = read("src/renderer/modules/ausgabe/sendMailPayload.js");
  const legacyPrintModalSource = read("src/renderer/ui/PrintModal.js");
  const legacySendMailSource = read("src/renderer/services/mail/sendMailPayload.js");
  const moduleCatalogSource = read("src/renderer/app/modules/moduleCatalog.js");

  await run("Ausgabe: Modul exportiert PrintModal und sendMailPayload", () => {
    assert.equal(typeof PrintModal, "function");
    assert.equal(typeof sendMailPayload, "function");
    assert.equal(moduleIndexSource.includes('export { default as PrintModal } from "./PrintModal.js";'), true);
    assert.equal(moduleIndexSource.includes('export { sendMailPayload } from "./sendMailPayload.js";'), true);
  });

  await run("Ausgabe: neue Renderer-Dateien enthalten die Implementierung", () => {
    assert.equal(printModalSource.includes("export default class PrintModal"), true);
    assert.equal(sendMailSource.includes("export function sendMailPayload"), true);
  });

  await run("Ausgabe: alte Pfade bleiben nur als Compatibility-Re-Exports", () => {
    assert.equal(
      legacyPrintModalSource.trim(),
      'export { default } from "../modules/ausgabe/PrintModal.js";'
    );
    assert.equal(
      legacySendMailSource.trim(),
      'export { sendMailPayload } from "../../modules/ausgabe/sendMailPayload.js";'
    );
  });

  await run("Ausgabe: kein Sidebar- oder Modulkatalog-Eintrag", () => {
    assert.equal(moduleCatalogSource.includes("getAusgabeModuleEntry"), false);
    assert.equal(moduleCatalogSource.includes("AUSGABE_MODULE_ID"), false);
    assert.equal(moduleCatalogSource.includes("ausgabe"), false);
  });

  await run("Ausgabe: Doku beschreibt das Renderer-Modul", () => {
    assert.equal(moduleReadmeSource.includes("Ausgabe / Drucken / E-Mail"), true);
    assert.equal(moduleReadmeSource.includes("Main-Prozess"), true);
    assert.equal(moduleReadmeSource.includes("kein Sidebar-Modul"), true);
  });

  await run("Ausgabe: Print-Dialog nutzt klare Nutzertexte", () => {
    assert.equal(printModalSource.includes("Protokoll drucken"), true);
    assert.equal(printModalSource.includes("PDF-Vorschau"), true);
    assert.equal(
      printModalSource.includes("Nur abgeschlossene Besprechungen"),
      true
    );
    assert.equal(printModalSource.includes("PDF-Ablageordner:"), true);
    assert.equal(
      printModalSource.includes("abgeschlossene Besprechung"),
      true
    );
  });

  await run("Ausgabe: PDF zeigt das TOP-Anlagedatum nicht auf Level 1", () => {
    assert.equal(printAppSource.includes("const createdDate = level === 1"), true);
    assert.equal(printAppSource.includes('? ""'), true);
    assert.equal(printAppSource.includes("_formatDateIso("), true);
    assert.equal(
      printModalSource.includes('const createdDate = isLevel1 ? "" : this._fmtDateYYYYMMDD(createdAtRaw);'),
      true
    );
  });
}

module.exports = { runAusgabeModuleTests };
