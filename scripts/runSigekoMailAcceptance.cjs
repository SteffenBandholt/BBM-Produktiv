#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { createAcceptanceProfile, createSanitizedEnvironment } = require("./runIsolatedUiEditorAcceptance.cjs");
const { ACCEPTANCE_SWITCH, configureUiEditorAcceptanceProfile } = require("../src/main/startup/uiEditorAcceptanceProfile");
const ROOT = path.resolve(__dirname, "..");

async function runWorker() {
  const { app, BrowserWindow, dialog } = require("electron");
  let profile;
  const report = { package: "S1.5", ok: false, checks: {}, actualSendObserved: false, cryptographicLicenseVerified: false };
  try {
    assert.equal(process.platform, "win32", "Abnahme erfordert Windows mit installiertem klassischem Outlook (COM).");
    profile = configureUiEditorAcceptanceProfile({ electronApp: app });
    assert.equal(profile.enabled, true);
    // Reuse the existing isolated status fixture; no product license bypass.
    const { createPdfAcceptanceLicense } = require("./helpers/pdfAcceptanceLicense.cjs");
    const fixture = createPdfAcceptanceLicense({ electronApp: app, profile, modules: ["sigeko"] });
    await app.whenReady();
    const { registerMailIpc } = require("../src/main/ipc/mailIpc");
    registerMailIpc();
    const caller = new BrowserWindow({ show: false, webPreferences: { preload: path.join(ROOT, "src/main/preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: false } });
    await caller.loadURL("about:blank");
    const invoke = (payload) => caller.webContents.executeJavaScript(`window.bbmMail.createOutlookDraft(${JSON.stringify(payload)})`);
    const to = ["bbm-abnahme@example.invalid"];
    const subject = "BBM S1.5 – technischer Entwurf, bitte verwerfen";
    const body = "Technische Prüfung der gemeinsamen Mailgrenze.\nDiesen Entwurf nach der Prüfung verwerfen.";
    const attachments = ["Anlage-1.txt", "Anlage-2.txt"].map((name, i) => {
      const file = path.join(profile.rootPath, name); fs.writeFileSync(file, `BBM S1.5 Testanlage ${i + 1}`, "utf8"); return file;
    });
    const payload = { moduleId: "sigeko", to, subject, body, attachments };
    report.checks.protokollDenied = await invoke({ ...payload, moduleId: "protokoll" });
    assert.equal(report.checks.protokollDenied.licenseError, true);
    fixture.setModules([]);
    report.checks.sigekoDenied = await invoke(payload);
    assert.equal(report.checks.sigekoDenied.licenseError, true);
    fixture.setModules(["sigeko"]);
    report.checks.missingAttachment = await invoke({ ...payload, attachments: [path.join(profile.rootPath, "missing.txt")] });
    assert.equal(report.checks.missingAttachment.ok, false);
    report.checks.openDraft = await invoke(payload);
    assert.deepEqual(report.checks.openDraft, { ok: true, outcome: "draft-opened", transport: "outlook" });
    const answer = await dialog.showMessageBox({ type: "question", title: "BBM S1.5 Outlook-Abnahme",
      message: "Bitte den geöffneten Outlook-Entwurf prüfen und anschließend verwerfen.",
      detail: `Empfänger: ${to.join("; ")}\nBetreff: ${subject}\n\nMailtext:\n${body}\n\nAnhänge: Anlage-1.txt und Anlage-2.txt (beide öffnen und Inhalt prüfen).\n\nErst nach dem Verwerfen bestätigen. Diese Bestätigung ist eine manuelle Abnahme, keine Versandbeobachtung.`,
      buttons: ["Nicht bestanden / Abbrechen", "Geprüft und verworfen"], defaultId: 0, cancelId: 0 });
    report.checks.manualOutlookReview = { confirmed: answer.response === 1, source: "user-confirmation", checks: ["recipient", "subject", "body", "two-openable-attachments", "discarded"] };
    assert.equal(answer.response, 1, "Praktische Outlook-Abnahme wurde nicht bestätigt.");
    report.checks.freshLicenseReads = fixture.getStatusReadCount();
    report.ok = true;
  } catch (err) { report.error = { message: err.message, stack: err.stack }; }
  finally {
    for (const win of BrowserWindow.getAllWindows()) win.destroy();
    if (profile) {
      const destination = path.join(profile.rootPath, "mail-acceptance-result.json");
      fs.writeFileSync(destination, JSON.stringify(report, null, 2));
      console.log(`${report.ok ? "PASS" : "FAIL"}: ${destination}`);
    }
    if (report.error) console.error(report.error.message);
    app.exit(report.ok ? 0 : 1);
  }
}

async function launch() {
  if (process.platform !== "win32") throw new Error("Diese praktische Abnahme benötigt Windows und klassisches Outlook (COM).");
  const profile = createAcceptanceProfile();
  console.log(`Abnahmebericht: ${path.join(profile.rootPath, "mail-acceptance-result.json")}`);
  const child = spawn(require("electron"), [__filename, "--worker", `${ACCEPTANCE_SWITCH}${profile.rootPath}`],
    { cwd: ROOT, env: createSanitizedEnvironment(), stdio: "inherit" });
  process.exitCode = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", (code) => resolve(code ?? 1)); });
}
if (process.versions.electron && process.argv.includes("--worker")) void runWorker();
else if (require.main === module) {
  if (process.argv.includes("--help")) console.log("Windows mit klassischem Outlook: npm run test:sigeko:s1.5:outlook\nÖffnet einen isolierten Testentwurf mit zwei Textanlagen. Bitte prüfen und verwerfen. Kein Versand.");
  else launch().catch((err) => { console.error(err.message); process.exitCode = 1; });
}
