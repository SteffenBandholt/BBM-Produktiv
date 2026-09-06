const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

async function runProtokollRevision272RegressionTests(run) {
  const groups = read("scripts/testGroups.cjs");

  await run("Protokoll #272 Regression: kanonischer Moduleinstieg bleibt produktiv", () => {
    const catalog = read("src/renderer/app/modules/moduleCatalog.js");
    const moduleIndex = read("src/renderer/modules/protokoll/index.js");
    assert.match(catalog, /modules\/protokoll\/index\.js/);
    assert.match(moduleIndex, /TopsScreenIntegrationView\.js/);
    assert.equal(catalog.includes("views/TopsScreen.js"), false);
  });

  await run("Protokoll #272 Regression: Settings bleiben Modulbesitz", () => {
    const settings = read("src/renderer/views/SettingsView.js");
    const project = read("src/renderer/modules/projektverwaltung/screens/ProjectFormScreen.js");
    assert.match(settings, /openGlobalProtocolSettings\(\{ host: this \}\)/);
    assert.match(project, /openProtocolSettingsModal\(\{ projectId: this\.projectId \}\)/);
    assert.equal(settings.includes("_createLegacyProtocolContent"), false);
    assert.equal(project.includes("_openLegacyProjectSettingsModal"), false);
    assert.match(read("src/main/modules/protokoll/registerIpc.js"), /registerProjectSettingsIpc/);
  });

  await run("Protokoll #272 Regression: PDF und Mail nutzen gemeinsame Dienstgrenzen", () => {
    const closeFlow = read("src/renderer/tops/domain/TopsCloseFlow.js");
    const mailFlow = read("src/renderer/modules/protokoll/mail/ProtokollMailFlow.js");
    assert.match(closeFlow, /PdfDocumentService/);
    assert.match(closeFlow, /ProtokollMailFlow/);
    assert.match(mailFlow, /ProtokollMailPayloadService/);
    assert.match(read("src/renderer/ui/MainHeader.js"), /MailTransportService/);
  });

  await run("Protokoll #272 Regression: Besprechungsteilnahme bleibt vom Core-Pool getrennt", () => {
    const main = read("src/main/main.js");
    const registrar = read("src/main/modules/protokoll/registerIpc.js");
    assert.match(main, /registerProjectParticipantsIpc\(\)/);
    assert.equal(main.includes("registerMeetingParticipantsIpc"), false);
    assert.match(registrar, /registerMeetingParticipantsIpc\(\{ ipcMain \}\)/);
  });

  await run("Protokoll #272 Regression: nur nachgewiesenes Legacy ist entfernt", () => {
    assert.equal(fs.existsSync(path.join(process.cwd(), "src/renderer/features/output/CloseMeetingOutputFlow.js")), false);
    assert.match(read("src/renderer/views/TopsScreen.js"), /modules\/protokoll\/screens\/TopsScreen/);
    assert.match(read("src/renderer/features/mail/MailFlow.js"), /ProtokollMailFlow as MailFlow/);
  });

  await run("Protokoll #272 Regression: Fachlogik-Nachweise bleiben im relevanten Lauf", () => {
    for (const suite of [
      "topsStore.test.cjs", "topsSelectors.test.cjs", "topsCommands.test.cjs",
      "topsCloseFlow.test.cjs", "topServiceHierarchy.test.cjs", "topsActionPolicy.test.cjs",
      "topsScreen.integration.test.cjs", "m86-2-2ProtokollAcceptanceSeeder.test.cjs",
    ]) assert.equal(groups.includes(suite), true, suite);
  });

  await run("Protokoll #272 Regression: alle Revisionspakete sind dauerhaft registriert", () => {
    for (const suite of [
      "protokollRevision272Path.test.cjs", "protokollSettingsOwnership.test.cjs",
      "protokollPdfServiceBoundary.test.cjs", "protokollMailTransportBoundary.test.cjs",
      "protokollMailPayloadOwnership.test.cjs", "protokollParticipantOwnership.test.cjs",
      "protokollLegacyProof.test.cjs",
    ]) assert.equal(groups.includes(suite), true, suite);
    assert.match(read("docs/PROTOKOLL_REVISION_272.md"), /Revision #272 ist damit erfuellt/);
  });
}

module.exports = { runProtokollRevision272RegressionTests };
