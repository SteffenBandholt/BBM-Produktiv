const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function runRestarbeitenV2ReadPathDecisionTests(run) {
  const docPath = path.join(__dirname, "../../docs/RESTARBEITEN_V2_LESEWEG_ENTSCHEIDUNG.md");
  const invPath = path.join(__dirname, "../../docs/RESTARBEITEN_V2_LESEWEGE_INVENTAR.md");
  const doc = fs.readFileSync(docPath, "utf8");
  const inv = fs.readFileSync(invPath, "utf8");

  assert.equal(doc.includes("Dieses Dokument entscheidet den spaeteren ReadOnly-Leseweg"), true);
  assert.equal(doc.includes("RestarbeitenV2Screen"), true);
  assert.equal(doc.includes("RestarbeitenV2ReadOnlyAdapter"), true);
  assert.equal(doc.includes("RestarbeitenV2LegacyReadBridge"), true);
  assert.equal(doc.includes("Mapper"), true);
  assert.equal(doc.includes("projectId"), true);
  assert.equal(doc.includes("M17.8"), true);
  assert.equal(doc.includes("M18.0"), true);
  assert.equal(doc.includes("M18.1"), true);
  assert.equal(doc.includes("listRestarbeitenByProject(projectId)"), true);
  assert.equal(doc.includes("Altpfad als Standard"), true);
  assert.equal(doc.includes("DEV-/Testfreigabe fuer den ReadOnly-Flow"), true);
  assert.equal(doc.includes("spaetere produktive ReadOnly-Freigabe"), true);
  assert.equal(doc.includes("Ohne Freigabe bleibt der alte Restarbeiten-Pfad Standard."), true);
  assert.equal(doc.includes("nicht gewaehlte Kandidaten"), true);
  assert.equal(doc.includes("Spaetere Zielkette"), true);
  assert.equal(doc.includes("RestarbeitenV2Screen` bleibt frei von IPC") || doc.includes("RestarbeitenV2Screen bleibt frei von IPC"), true);
  assert.equal(doc.includes("Kein Speichern in dieser Kette"), true);
  assert.equal(doc.includes("keine Schreibwege"), true);
  assert.equal(doc.includes("nur eine injizierte Lesefunktion"), true);
  assert.equal(doc.includes("Nicht freigegeben sind Speichern, Create, Update, Delete, Upload, Import, Autosave, neue IPC-Wege und die vollstaendige Ablösung der alten Restarbeiten-UI"), true);

  assert.equal(doc.includes("M18 beginnt nicht mit Schreiben"), true);
  assert.equal(doc.includes("kontrollierten ReadOnly-Produktivfreigabe oder ihrer fachlichen Vorbereitung"), true);
  assert.equal(doc.includes("Schreib-, Upload- und Autosave-Themen bleiben gesperrt"), true);
  assert.equal(inv.includes("listRestarbeitenByProject(projectId)"), true);
  assert.equal(doc.includes("M19.1a Abnahme-Checkliste"), true);
  assert.equal(doc.includes("Projektworkspace oeffnet Restarbeiten korrekt"), true);
  assert.equal(doc.includes("Altpfad bleibt ohne Freigabe Standard"), true);
  assert.equal(doc.includes("DEV-/Testfreigabe funktioniert weiterhin"), true);
  assert.equal(doc.includes("Simulierte Produktiv-ReadOnly-Freigabe oeffnet V2 ReadOnly"), true);
  assert.equal(doc.includes("projectId"), true);
  assert.equal(doc.includes("listRestarbeitenByProject(projectId)"), true);
  assert.equal(doc.includes("Vorhandene Legacy-Daten erscheinen im V2-Screen"), true);
  assert.equal(doc.includes("Alte Restarbeiten-UI bleibt als Fallback erhalten"), true);
  assert.equal(doc.includes("Produktiv-ReadOnly bleibt ohne spaeteren expliziten Schalter inaktiv"), true);
  assert.equal(doc.includes("Normale Restarbeiten-Lizenz allein reicht nicht"), true);
  assert.equal(doc.includes("Kein Speichern"), true);
  assert.equal(doc.includes("Kein Create"), true);
  assert.equal(doc.includes("Kein Update"), true);
  assert.equal(doc.includes("Kein Delete"), true);
  assert.equal(doc.includes("Kein Upload"), true);
  assert.equal(doc.includes("Kein Import"), true);
  assert.equal(doc.includes("Kein Autosave"), true);
  assert.equal(doc.includes("Kein neuer IPC"), true);

  if (run) {
    run("Restarbeiten V2 Leseweg-Entscheidung ist dokumentiert", () => undefined);
  }
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

  runRestarbeitenV2ReadPathDecisionTests(run).then(() => {
    if (!process.exitCode) console.log("restarbeitenV2ReadPathDecision.test.cjs passed");
  });
}

module.exports = { runRestarbeitenV2ReadPathDecisionTests };
