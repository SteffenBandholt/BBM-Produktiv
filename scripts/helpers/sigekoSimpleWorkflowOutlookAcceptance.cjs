"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createWorkflowOutlookFixture } = require("./sigekoWorkflowOutlookAcceptance.cjs");

// User-run Windows acceptance. Real Outlook COM, real PDF generation and IPC.
// No automatic sending; only explicit Yes creates a real Outlook task.
async function runSimpleWorkflowOutlookAcceptance({ BrowserWindow, dialog, ipcMain, profile, fixture, caller, report }) {
  const database = require("../../src/main/db/database");
  database.configureDatabaseMigrations(fixture.getStatus({ fresh: true }), { allowLegacyImport: false });
  database.initDatabase();
  try {
    require("../../src/main/db/appSettingsRepo").appSettingsSetMany({ "pdf.protocolsDir": path.join(profile.rootPath, "S55-Ablage") });
    const { project, draft } = createWorkflowOutlookFixture();
    require("../../src/main/ipc/printIpc").registerPrintIpc();
    require("../../src/main/moduleIpcRegistry").registerActiveModuleIpcs({ licenseStatus: fixture.getStatus({ fresh: true }), getLicenseStatus: () => fixture.getStatus({ fresh: true }), ipcMain });
    const invoke = async (method, payload) => {
      const result = await caller.webContents.executeJavaScript(`window.bbmDb[${JSON.stringify(method)}](${JSON.stringify(payload)})`);
      assert.equal(result?.ok, true, `${method}: ${JSON.stringify(result)}`); return result.data;
    };
    const recipients = ["bbm-va-abnahme@example.invalid"];
    await invoke("sigekoSavePreNotificationRecipients", { projectId: project.id, expectedRevision: 0, recipients });
    const generated = await invoke("sigekoCreatePreNotificationPdf", { projectId: project.id, expectedRevision: draft.record.revision });
    assert.equal(generated.document.files.length, 2);
    const identity = { projectId: project.id, documentId: generated.document.id };
    const db = database.initDatabase();
    const storedBefore = db.prepare("SELECT * FROM sigeko_documents WHERE id=?").get(identity.documentId);
    const root = path.dirname(require("../../src/main/ipc/projectStoragePaths").createProjectStorageAccess().resolve({ moduleId: "sigeko", projectId: project.id }).moduleDir);
    const originalBytes = JSON.parse(storedBefore.files_json).map(file => fs.readFileSync(path.join(root, file.projectRelativePath)));
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    const due = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,"0")}-${String(tomorrow.getDate()).padStart(2,"0")}`;
    const intro = await dialog.showMessageBox({ type: "question", title: "S5.5 – Outlook-Abnahme",
      message: "Zwei Testentwürfe prüfen und verwerfen.",
      detail: `Es werden nur isolierte BBM-Testdaten verwendet. Die Test-PDF übernimmt die vorhandene S5.4-Testvorlage.\n\nPrüfen: Empfänger ${recipients[0]}, beide PDF-Anlagen lassen sich öffnen, Rückgabedatum ${due}, eigene Outlook-Absenderadresse im Body.\n\nErster Entwurf: schließen/verwerfen, danach Erinnerung NEIN.\nZweiter Entwurf: schließen/verwerfen, danach Erinnerung JA. Das erzeugt eine echte Testaufgabe „VA schon zurück“ in Outlook für ${due}, 09:00 Uhr. Diese anschließend nach der Prüfung selbst löschen.\n\nKeine Testmail versenden.`,
      buttons: ["Abbrechen", "Prüfung starten"], defaultId: 0, cancelId: 0 });
    assert.equal(intro.response, 1, "Abnahme abgebrochen.");
    report.checks.s55Outlook = [];
    for (const expected of ["declined", "created"]) {
      if (expected === "created") await dialog.showMessageBox({ type: "info", message: "Zweiter Durchlauf: Entwurf prüfen und verwerfen. Bei „Erinnerung erstellen?“ diesmal Ja wählen.", buttons: ["Weiter"] });
      const state = await invoke("sigekoGetPreNotificationCompletion", identity);
      const result = await invoke("sigekoOpenSimplePreNotificationMail", { ...identity, expectedRevision: state.revision, returnRequestedBy: due });
      assert.equal(result.ok, true, result.error); assert.equal(result.outcome, "draft-closed"); assert.equal(result.reminder, expected);
      const after = await invoke("sigekoGetPreNotificationCompletion", identity);
      assert.equal(after.returnedOn, null); assert.equal(after.authoritySentOn, null);
      report.checks.s55Outlook.push({ expected, outcome: result.outcome, reminder: result.reminder });
    }
    const state = await invoke("sigekoGetPreNotificationCompletion", identity);
    const saved = await invoke("sigekoSavePreNotificationCompletion", { ...identity, expectedRevision: state.revision, returnRequestedBy: due, returnedOn: due, authoritySentOn: due });
    const row = db.prepare("SELECT * FROM sigeko_pre_notification_workflows WHERE document_id=?").get(identity.documentId);
    assert.equal(row.signature_opened_at, null); assert.equal(row.authority_opened_at, null); assert.equal(row.signed_file_json, null);
    assert.deepEqual(db.prepare("SELECT * FROM sigeko_documents WHERE id=?").get(identity.documentId), storedBefore);
    JSON.parse(storedBefore.files_json).forEach((file, index) => assert.deepEqual(fs.readFileSync(path.join(root, file.projectRelativePath)), originalBytes[index]));
    database.closeDatabase(); database.initDatabase();
    assert.deepEqual(await invoke("sigekoGetPreNotificationCompletion", identity), saved);
    const answer = await dialog.showMessageBox({ type: "question", title: "S5.5 – Prüfergebnis",
      message: "Outlook-Entwürfe und Aufgabe tatsächlich geprüft?",
      detail: `Empfänger, Rückgabedatum und eigene Absenderadresse im Body waren richtig. Beide PDF-Anlagen ließen sich öffnen. Beide Entwürfe wurden verworfen. Nach Nein entstand keine Aufgabe, nach Ja genau eine Aufgabe „VA schon zurück“, fällig ${due}, Erinnerung 09:00 Uhr.\n\nBitte die Testaufgabe in Outlook jetzt löschen und erst danach bestätigen.`,
      buttons: ["Nicht bestanden", "Geprüft, Testaufgabe gelöscht"], defaultId: 0, cancelId: 0 });
    report.checks.manualOutlookReview = { confirmed: answer.response === 1, source: "user-confirmation", due };
    assert.equal(answer.response, 1, "Praktische Outlook-Abnahme nicht bestätigt.");
    report.manualConfirmed = true; report.ok = true;
  } finally { database.closeDatabase(); }
}
module.exports = { runSimpleWorkflowOutlookAcceptance };
