const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.join(__dirname, "../..");
const DOC_PATH = path.join(REPO_ROOT, "docs/M63A_EDITOR_BESTAND_UND_INTEGRATIONSPLAN.md");
const STATUS_PANEL_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
const STATUS_PATH = path.join(REPO_ROOT, "STATUS.md");
const AUFGABENHEFT_PATH = path.join(REPO_ROOT, "docs/UI_INSPEKTOR_AUFGABENHEFT.md");

function read(relativeOrAbsolutePath) {
  return fs.readFileSync(relativeOrAbsolutePath, "utf8");
}

async function runM63aEditorIntegrationAuditTests(run) {
  const doc = read(DOC_PATH);
  const statusPanel = read(STATUS_PANEL_PATH);
  const status = read(STATUS_PATH);
  const aufgabenheft = read(AUFGABENHEFT_PATH);

  await run("M63A Audit: Dokument enthaelt alle Pflichtkapitel", () => {
    [
      "## 1. Aktueller M51–M62-Stand",
      "## 2. Vorhandener EditorRuntime-Bestand",
      "## 3. Registry-Vergleich",
      "## 4. Auswahlvertrag",
      "## 5. Vorhandene Layoutoperationen",
      "## 6. Save/Load/Reset/Persistenz",
      "## 7. Alte UI-Wege und Abgrenzung",
      "## 8. Bewertete Integrationsvarianten",
      "## 9. Empfohlene Architektur",
      "## 10. Exakter Scope für M63B",
      "## 11. Risiken und offene Punkte",
      "## 12. Dateiliste: verwenden / adaptieren / nicht verwenden",
    ].forEach((heading) => assert.equal(doc.includes(heading), true, heading));
  });

  await run("M63A Audit: empfiehlt keine zweite Registry und keine zweite Auswahlhaltung", () => {
    assert.equal(doc.includes("Es darf keine zweite Registry entstehen."), true);
    assert.equal(doc.includes("M52/Kit-Host"), true);
    assert.equal(doc.includes("Eigentümer der Auswahl bleibt M52/Kit-Host"), true);
    assert.equal(doc.includes("Führend bleibt die M51/Kit-Ziel-App-Registry"), true);
  });

  await run("M63A Audit: haelt M63B auf Bridge statt produktiver Direktintegration begrenzt", () => {
    assert.equal(doc.includes("Empfohlen wird Variante B."), true);
    assert.equal(doc.includes("bbmEditorRuntimeInspectorBridge.js"), true);
    assert.equal(doc.includes("read-only"), true);
    assert.equal(doc.includes("Keine Operation sichtbar ausführen"), true);
  });

  await run("M63A Audit: legt keinen neuen Persistenzweg nahe", () => {
    assert.equal(doc.includes("M63B darf keinen neuen Persistenzweg anlegen."), true);
    assert.equal(doc.includes("kein `localStorage`"), true);
    assert.equal(doc.includes("keine DB"), true);
  });

  await run("M63A Audit: alter EditorLab-/V2-Einstieg bleibt abgegrenzt", () => {
    assert.equal(doc.includes("EditorLab"), true);
    assert.equal(doc.includes("nicht parallel aktiviert"), true);
    assert.equal(statusPanel.includes("showEditorLabV2"), false);
    assert.equal(statusPanel.includes("EditorLab V2"), false);
  });

  await run("M63A Audit: Status und Aufgabenheft enthalten Analysebefund", () => {
    assert.equal(status.includes("M63A – Editor-Bestand und Integrationsplan"), true);
    assert.equal(aufgabenheft.includes("M63A Analysebefund"), true);
    assert.equal(aufgabenheft.includes("keine zweite Registry"), true);
    assert.equal(aufgabenheft.includes("keine zweite Auswahlhaltung"), true);
  });
}

if (require.main === module) {
  const run = async (name, fn) => {
    try {
      const out = fn();
      if (out && typeof out.then === "function") await out;
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
      process.exitCode = 1;
    }
  };

  runM63aEditorIntegrationAuditTests(run).then(() => {
    if (!process.exitCode) console.log("m63aEditorIntegrationAudit.test.cjs passed");
  });
}

module.exports = { runM63aEditorIntegrationAuditTests };
