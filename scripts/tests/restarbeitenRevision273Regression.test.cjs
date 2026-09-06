const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

async function runRestarbeitenRevision273RegressionTests(run) {
  const screen = read("src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js");
  const groups = read("scripts/testGroups.cjs");

  await run("Restarbeiten #273 Regression: Foto-UI nutzt bestehende Attachment-API", () => {
    for (const api of [
      "listRestarbeitAttachments",
      "importRestarbeitAttachments",
      "setPrimaryRestarbeitAttachment",
      "deleteRestarbeitAttachment",
    ]) assert.equal(screen.includes(`${api}(`), true, api);
    assert.equal(screen.includes("Fotos folgen in einem späteren Paket."), false);
  });

  await run("Restarbeiten #273 Regression: Haupt-Ladefehler ist sichtbar und abgeschlossen", () => {
    const load = screen.slice(screen.indexOf("  async load("), screen.indexOf("\n  _bindTextLimitSettings()"));
    assert.match(load, /catch \(error\)[\s\S]*Restarbeiten konnten nicht geladen werden/);
    assert.match(load, /finally[\s\S]*this\.isLoading = false;[\s\S]*this\._renderShell\(\)/);
  });

  await run("Restarbeiten #273 Regression: nur gemeinsamer Preview-Weg bleibt", () => {
    assert.equal(screen.includes("outputPreviewOpen"), false);
    assert.equal(screen.includes("data-output-preview"), false);
    assert.equal(screen.includes("printPdfAndPreviewInternal(this._buildRestarbeitenPdfPayload())"), true);
    assert.equal(fs.existsSync(path.join(process.cwd(), "src/renderer/modules/restarbeiten/RestarbeitenOutputPreview.js")), false);
  });

  await run("Restarbeiten #273 Regression: Notizdruck wird nicht vorgetäuscht", () => {
    assert.equal(screen.includes('mode: "restarbeit-note-history"'), false);
    assert.equal(screen.includes("Druck vorbereitet."), false);
    assert.equal(screen.includes("Notizdruck ist derzeit nicht verfügbar."), true);
  });

  await run("Restarbeiten #273 Regression: V2 bleibt inaktiv und testgestützt erhalten", () => {
    const assessment = read("docs/RESTARBEITEN_V2_REVISION_273_BEWERTUNG.md");
    assert.equal(assessment.includes("produktiv aktiv: **nein**"), true);
    assert.equal(assessment.includes("isoliert importierbar und getestet: **ja**"), true);
    assert.equal(assessment.includes("in Revision #273 zu löschen: **nein**"), true);
  });

  await run("Restarbeiten #273 Regression: alle Paketnachweise bleiben registriert", () => {
    for (const suite of [
      "restarbeitenPhotoUi.test.cjs",
      "restarbeitenLoadError.test.cjs",
      "restarbeitenPreviewState.test.cjs",
      "restarbeitenPreviewArtifact.test.cjs",
      "restarbeitenNotePrint.test.cjs",
      "restarbeitenV2Revision273.test.cjs",
    ]) assert.equal(groups.includes(suite), true, suite);
  });
}

module.exports = { runRestarbeitenRevision273RegressionTests };
