const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

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
  assert.equal(doc.includes("listRestarbeitenByProject(projectId)"), true);
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

  const diffFiles = execFileSync("git", ["diff", "--name-only"], {
    cwd: path.join(__dirname, "../.."),
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  assert.equal(diffFiles.some((file) => file.startsWith("src/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/main/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/preload/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/restarbeiten/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/restarbeitenV2/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/protokoll/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);

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
