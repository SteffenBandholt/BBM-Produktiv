const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function runRestarbeitenV2DataContractTests(run) {
  const docPath = path.join(__dirname, "../../docs/RESTARBEITEN_V2_DATENVERTRAG.md");
  const doc = fs.readFileSync(docPath, "utf8");

  assert.equal(doc.includes("Restarbeiten V2 Datenvertrag"), true);
  assert.equal(doc.includes("RestarbeitenV2Screen"), true);
  assert.equal(doc.includes("kaputte sichtbare `RestarbeitenV2Screen`-UI ist entfernt"), true);
  assert.equal(doc.includes("nur Daten-/Mapper-/Adaptergrenzen"), true);
  assert.equal(doc.includes("Editor V2 bleibt fachneutral"), true);
  assert.equal(doc.includes("Restarbeiten-Fachcode"), true);
  assert.equal(doc.includes("Editor V2"), true);
  assert.equal(doc.includes("Pflichtfelder"), true);
  assert.equal(doc.includes("Optionale Felder"), true);
  assert.equal(doc.includes("id"), true);
  assert.equal(doc.includes("nummer"), true);
  assert.equal(doc.includes("kurztext"), true);
  assert.equal(doc.includes("status"), true);
  assert.equal(doc.includes("verortung"), true);
  assert.equal(doc.includes("langtext"), true);
  assert.equal(doc.includes("meta"), true);
  assert.equal(doc.includes("notiz"), true);
  assert.equal(doc.includes("fotos"), true);
  assert.equal(doc.includes("responsibleFirmId"), true);
  assert.equal(doc.includes("responsibleFirmName"), true);
  assert.equal(doc.includes("dueDate"), true);
  assert.equal(doc.includes("createdAt"), true);
  assert.equal(doc.includes("updatedAt"), true);
  assert.equal(doc.includes("completedAt"), true);
  assert.equal(doc.includes("status: \"offen\" | \"erledigt\""), true);
  assert.equal(doc.includes("Liste braucht mindestens"), true);
  assert.equal(doc.includes("Workbench braucht"), true);
  assert.equal(doc.includes("Fotos bleiben optional"), true);
  assert.equal(doc.includes("restarbeitenV2DataSource.js"), true);
  assert.equal(doc.includes("restarbeitenV2Mapper.js"), true);
  assert.equal(doc.includes("restarbeitenV2RepositoryBridge.js"), true);
  assert.equal(doc.includes("listRestarbeitenV2(projectId)"), true);
  assert.equal(doc.includes("createRestarbeitV2(projectId, draft)"), true);
  assert.equal(doc.includes("updateRestarbeitV2(id, patch)"), true);
  assert.equal(doc.includes("deleteRestarbeitV2(id)"), true);
  assert.equal(doc.includes("listRestarbeitV2Attachments(id)"), true);
  assert.equal(doc.includes("src/renderer/modules/restarbeiten/**"), true);
  assert.equal(doc.includes("spaetere neue V2-UI"), true);
  assert.equal(doc.includes("projectId"), true);
  assert.equal(doc.includes("Keine IPC-Anbindung"), true);
  assert.equal(doc.includes("Keine DB-Anbindung"), true);

  if (run) {
    run("Restarbeiten V2 Datenvertrag ist dokumentiert", () => undefined);
  }
}

if (require.main === module) {
  try {
    runRestarbeitenV2DataContractTests((name, fn) => {
      const result = fn();
      if (result && typeof result.then === "function") {
        return result.then(() => console.log(`ok - ${name}`));
      }
      console.log(`ok - ${name}`);
      return result;
    });
    console.log("restarbeitenV2DataContract.test.cjs passed");
  } catch (err) {
    console.error("not ok - restarbeitenV2DataContract.test.cjs");
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  }
}

module.exports = { runRestarbeitenV2DataContractTests };
