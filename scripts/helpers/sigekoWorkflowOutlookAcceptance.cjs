"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");

// The exact live fixture is also callable with existing real-SQLite test services,
// so preparation can be verified without claiming an Outlook or display pass.
function createWorkflowOutlookFixture({ database = require("../../src/main/db/database"),
  projects = require("../../src/main/db/projectsRepo"),
  roles = require("../../src/main/domain/sigeko/SigekoProjectService").createSigekoProjectService(),
  authorities = require("../../src/main/domain/sigeko/AuthorityService").createAuthorityService(),
  assignments = require("../../src/main/domain/sigeko/ProjectAuthorityService").createProjectAuthorityService(),
  drafts = require("../../src/main/domain/sigeko/PreNotificationService").createPreNotificationService() } = {}) {
  const address = { street: "Abnahmeweg 54", zip: "12345", city: "Testort" };
  const project = projects.createProject({ name: "S5.4 isolierte Outlook-Abnahme", project_number: "S54-OUTLOOK", ...address, geplanter_baubeginn: "2030-04-15" });
  const db = database.initDatabase();
  db.prepare("INSERT INTO firms (id,name,street,zip,city,email) VALUES ('s54-builder','S5.4 Testbauherr','Bauherrenweg 2','12345','Testort','s54-bauherr@example.invalid')").run();
  projects.updateProject({ id: project.id, patch: { bauherr: { kind: "global_firm", id: "s54-builder" } } });
  db.prepare("INSERT INTO project_firms (id,project_id,name,street,zip,city,use_project_participant,is_active) VALUES ('s54-contractor',?,'S5.4 Testfirmenanlage','Gewerkweg 4','12345','Testort',1,1)").run(project.id);
  roles.saveProjectData({ projectId: project.id, planning: { source: "free", data: {
    name: "S5.4 Testkoordinator", street: "Koordinatorweg 3", zip: "12345", city: "Testort", phone: "0123 456", email: "s54-koordinator@example.invalid",
  } }, executionSameAsPlanning: true });
  let authority = authorities.saveAuthorityRecord({ patch: { category: "LABOR_AUTHORITY", organization: "S5.4 fiktive Testbehörde",
    street: "Behördenweg 5", zip: "12345", city: "Testort", phone: "0123 789", email: "s54-behoerde@example.invalid",
    source: "Technische Abnahmefixture; keine echte Behörde", verification_note: "Nur isolierte Testdaten, keine Recherche oder Übernahme realer Zuständigkeit",
    scope_street: address.street, scope_zip: address.zip, scope_city: address.city } });
  authority = authorities.confirmAuthorityRecord({ id: authority.id, expectedRevision: authority.revision });
  assignments.assignProjectAuthority({
    projectId: project.id, category: authority.category, sourceId: authority.id, sourceRevision: authority.revision, expectedRevision: 0,
    expectedAddress: address, status: "confirmed", note: "Technische Fixture, keine reale Zuständigkeit" });
  const draft = drafts.savePreNotification({ projectId: project.id, expectedRevision: 0, patch: {
    building_type_override: "S5.4 technischer Testneubau", duration_months: 8, max_workers: 12, employer_count: 1, self_employed_count: 0, firms_mode: "attachment",
  } });
  assert.equal(draft.readiness.status, "green", JSON.stringify(draft.readiness));
  return { project, draft };
}

// Real classic Outlook COM gate, reusing the S1.5 isolated Electron worker.
// The product workflow invokes the unchanged shared mail handler. No transport
// callback, renderer success acknowledgement, send call or customer DB is used.
async function runWorkflowOutlookAcceptance({ app, BrowserWindow, dialog, ipcMain, profile, fixture, caller, report }) {
  const database = require("../../src/main/db/database");
  database.configureDatabaseMigrations(fixture.getStatus({ fresh: true }), { allowLegacyImport: false });
  database.initDatabase();
  try {
    require("../../src/main/db/appSettingsRepo").appSettingsSetMany({ "pdf.protocolsDir": path.join(profile.rootPath, "S54-Ablage") });
    const { project, draft } = createWorkflowOutlookFixture();
    const db = database.initDatabase();
    const signedSource = path.join(profile.rootPath, "S54-Ruecklauf-Testdatei.pdf");
    require("../../src/main/ipc/printIpc").registerPrintIpc();
    require("../../src/main/moduleIpcRegistry").registerActiveModuleIpcs({ licenseStatus: fixture.getStatus({ fresh: true }),
      getLicenseStatus: () => fixture.getStatus({ fresh: true }), ipcMain,
      registrars: { sigeko: options => require("../../src/main/ipc/sigekoIpc").registerSigekoIpc({ ...options,
        workflowService: require("../../src/main/domain/sigeko/PreNotificationWorkflowService").createPreNotificationWorkflowService({
          // Actual native dialog with a convenient isolated default; no injected answer.
          chooseFile: () => dialog.showOpenDialog({ title: "S5.4 – technische Rücklaufdatei zuordnen", defaultPath: signedSource,
            properties: ["openFile"], filters: [{ name: "PDF", extensions: ["pdf"] }] }),
        }),
      }) },
    });
    const invoke = async (method, payload) => {
      const result = await caller.webContents.executeJavaScript(`window.bbmDb[${JSON.stringify(method)}](${JSON.stringify(payload)})`);
      assert.equal(result?.ok, true, `${method}: ${JSON.stringify(result)}`); return result.data;
    };
    const generated = await invoke("sigekoCreatePreNotificationPdf", { projectId: project.id, expectedRevision: draft.record.revision });
    assert.equal(generated.document.files.length, 2);
    const identity = { projectId: project.id, documentId: generated.document.id };
    const storedDocument = db.prepare("SELECT * FROM sigeko_documents WHERE id=?").get(identity.documentId);
    const storedFiles = JSON.parse(storedDocument.files_json);
    const root = path.dirname(require("../../src/main/ipc/projectStoragePaths").createProjectStorageAccess().resolve({ moduleId: "sigeko", projectId: project.id }).moduleDir);
    const originals = storedFiles.map(file => fs.readFileSync(path.join(root, file.projectRelativePath)));
    const returnWindow = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
    try {
      await returnWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent("<!doctype html><html lang='de'><meta charset='utf-8'><body style='font:18px sans-serif;padding:40px'><h1>S5.4 – technischer Rücklauf</h1><p>Isolierte Outlook-Abnahme / S54-OUTLOOK</p><p>Diese Datei stellt für die technische Zuordnung einen unterschriebenen Rücklauf dar. Sie enthält keine echte Unterschrift.</p><p>Erwartet als erste Anlage der Behördenmail, zusammen mit der unveränderten Firmenanlage.</p><p>Bitte nicht versenden. Beide Testentwürfe nach der Prüfung verwerfen.</p></body></html>"));
      fs.writeFileSync(signedSource, await returnWindow.webContents.printToPDF({ printBackground: true, pageSize: "A4" }));
    } finally { returnWindow.destroy(); }
    const signedBytes = fs.readFileSync(signedSource);
    report.checks.s54Fixture = { isolated: true, projectId: project.id, documentId: identity.documentId,
      actualChromiumFinalPdf: true, originalFiles: storedFiles, signedFixtureSha256: hash(signedBytes), signedFixtureIsGenuineSignature: false,
      license: fixture.source, transport: "unmodified shared Outlook COM handler", picker: "actual native PDF dialog" };
    let state = await invoke("sigekoGetPreNotificationWorkflow", identity);
    assert.equal(state.status, "red"); assert.equal(state.revision, null);
    const due = "2030-05-17";
    async function openAndReview(purpose, expectedStatus, expectedAttachments) {
      const prepared = await invoke("sigekoPreparePreNotificationMail", { ...identity, purpose, returnRequestedBy: due });
      assert.equal(prepared.attachments.length, 2);
      assert.deepEqual((await invoke("sigekoGetPreNotificationWorkflow", identity)), state, "preparation cannot save or advance state");
      const subject = `BBM S5.4 – ${purpose === "signature" ? "Unterschrift" : "Behörde"} – bitte verwerfen`;
      const body = `S5.4 Testtext ${purpose === "signature" ? "zur Unterschrift" : "an die Behörde"}.\nRücklauf erbeten bis ${due}.\nBitte beide PDF-Anhänge prüfen und den Testentwurf verwerfen. Nicht versenden.`;
      const recipients = [purpose === "signature" ? "s54-bauherr@example.invalid" : "s54-behoerde@example.invalid"];
      const opened = await invoke("sigekoOpenPreNotificationMailDraft", { ...identity, expectedRevision: state.revision,
        purpose, recipients, subject, body, returnRequestedBy: due });
      assert.equal(opened.outcome, "draft-opened"); assert.equal(opened.transport, "outlook"); assert.equal(opened.workflow.status, expectedStatus);
      state = opened.workflow;
      report.checks[purpose + "Draft"] = { outcome: opened.outcome, transport: opened.transport, workflow: state,
        recipients, subject, body, attachments: prepared.attachments, expectedAttachmentHashes: expectedAttachments.map(hash), actualSendObserved: false };
      const review = await dialog.showMessageBox({ type: "question", title: `BBM S5.4 – ${purpose === "signature" ? "Unterschriftsentwurf" : "Behördenentwurf"} prüfen`,
        message: "Bitte den tatsächlich geöffneten Outlook-Entwurf prüfen und anschließend verwerfen.",
        detail: `Empfänger: ${recipients.join("; ")}\nBetreff: ${subject}\n\nNachricht:\n${body}\n\nAnlagen:\n${prepared.attachments.map(file => file.name).join("\n")}\n\n${purpose === "signature" ? "Die erste Anlage ist die Vorankündigung für S54-OUTLOOK. Die zweite Anlage enthält S5.4 Testfirmenanlage." : "Die erste Anlage trägt die Überschrift S5.4 – technischer Rücklauf. Die zweite Anlage ist dieselbe Firmenliste wie zuvor."}\n\nBeide PDF-Anhänge öffnen und den genannten Inhalt prüfen. Erst nach dem Verwerfen bestätigen. Kein Versandnachweis.`,
        buttons: ["Nicht bestanden / Abbrechen", "Geprüft und verworfen"], defaultId: 0, cancelId: 0 });
      report.checks[purpose + "ManualReview"] = { confirmed: review.response === 1, source: "user-confirmation", checks: ["recipient", "subject", "body", "two-openable-pdfs-with-expected-content", "discarded"] };
      assert.equal(review.response, 1, `Praktische ${purpose}-Outlook-Abnahme wurde nicht bestätigt.`);
    }
    await openAndReview("signature", "orange", originals);
    assert.equal(state.returnRequestedBy, due);
    await dialog.showMessageBox({ type: "info", title: "BBM S5.4 – Rücklauf zuordnen",
      message: "Im folgenden PDF-Dateidialog bitte die vorbereitete technische Rücklaufdatei auswählen.",
      detail: `${signedSource}\n\nDie Datei ist eine isolierte Test-PDF ohne echte Unterschrift. Die Zuordnung wird über die produktive Main-Grenze in die Projektablage übernommen.` });
    const imported = await invoke("sigekoImportPreNotificationSignedReturn", { ...identity, expectedRevision: state.revision });
    assert.equal(imported.canceled, false, "Rücklaufzuordnung wurde abgebrochen."); state = imported.workflow;
    assert.equal(state.status, "orange"); assert.equal(state.signedFile.sha256, hash(signedBytes), "Select the prescribed isolated return fixture");
    assert.deepEqual(fs.readFileSync(path.join(root, state.signedFile.projectRelativePath)), signedBytes);
    report.checks.signedReturn = { selectedThroughNativeDialog: true, sha256: state.signedFile.sha256, workflow: state };
    await openAndReview("authority", "green", [signedBytes, originals[1]]);
    const beforeReopen = state;
    database.closeDatabase(); database.initDatabase();
    state = await invoke("sigekoGetPreNotificationWorkflow", identity);
    assert.deepEqual(state, beforeReopen); assert.equal(state.status, "green");
    assert.deepEqual(database.initDatabase().prepare("SELECT * FROM sigeko_documents WHERE id=?").get(identity.documentId), storedDocument);
    assert.equal(database.initDatabase().prepare("SELECT COUNT(*) n FROM sigeko_pre_notification_workflows WHERE project_id=?").get(project.id).n, 1);
    for (const [index, file] of storedFiles.entries()) assert.deepEqual(fs.readFileSync(path.join(root, file.projectRelativePath)), originals[index]);
    const another = await invoke("sigekoCreatePreNotificationPdf", { projectId: project.id, expectedRevision: draft.record.revision });
    const independent = await invoke("sigekoGetPreNotificationWorkflow", { projectId: project.id, documentId: another.document.id });
    assert.equal(independent.status, "red"); assert.equal(independent.revision, null);
    report.checks.sqliteReopenAndIndependentVersion = { persistedGreen: true, originalDocumentAndBytesUnchanged: true, newVersionRed: true };
    report.checks.freshLicenseReads = fixture.getStatusReadCount();
    report.manualConfirmed = true;
    report.ok = true;
  } finally { database.closeDatabase(); }
}
module.exports = { createWorkflowOutlookFixture, runWorkflowOutlookAcceptance };
