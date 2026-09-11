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
  const { app, BrowserWindow, dialog, ipcMain } = require("electron");
  let profile;
  const s54 = process.argv.includes("--s54"), s55 = process.argv.includes("--s55");
  const preparationOnly = s55 && process.argv.includes("--prepare-only");
  const report = { package: s55 ? "S5.5" : s54 ? "S5.4" : "S1.5", ok: false, checks: {}, actualSendObserved: false, cryptographicLicenseVerified: false };
  try {
    if (!preparationOnly) assert.equal(process.platform, "win32", "Abnahme erfordert Windows mit installiertem klassischem Outlook (COM).");
    app.setAppPath(ROOT);
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
    if (s55) {
      await require("./helpers/sigekoSimpleWorkflowOutlookAcceptance.cjs").runSimpleWorkflowOutlookAcceptance({ app, BrowserWindow, dialog, ipcMain, profile, fixture, caller, report, preparationOnly });
      return;
    }
    if (s54) {
      await require("./helpers/sigekoWorkflowOutlookAcceptance.cjs").runWorkflowOutlookAcceptance({ app, BrowserWindow, dialog, ipcMain, profile, fixture, caller, report });
      return;
    }
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
  if (process.platform !== "win32" && !(process.argv.includes("--s55") && process.argv.includes("--prepare-only"))) throw new Error("Diese praktische Abnahme benötigt Windows und klassisches Outlook (COM).");
  const profile = createAcceptanceProfile();
  console.log(`Abnahmebericht: ${path.join(profile.rootPath, "mail-acceptance-result.json")}`);
  const child = spawn(require("electron"), [__filename, "--worker", `${ACCEPTANCE_SWITCH}${profile.rootPath}`, ...process.argv.filter(arg => ["--s54", "--s55", "--prepare-only"].includes(arg))],
    { cwd: ROOT, env: createSanitizedEnvironment(), stdio: "inherit" });
  process.exitCode = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", (code) => resolve(code ?? 1)); });
}
if (process.versions.electron && process.argv.includes("--worker")) void runWorker();
else if (require.main === module) {
  if (process.argv.includes("--help")) console.log("Windows mit klassischem Outlook:\n  npm run test:sigeko:s1.5:outlook — ein isolierter Entwurf mit zwei Textanlagen.\n  npm run test:sigeko:s5.4:outlook — zwei echte Entwürfe mit Vorankündigung/Rücklauf und Firmen-PDF; nativen Rücklaufdialog bedienen.\n  npm run test:sigeko:s5.5:outlook — vereinfachter VA-Ablauf: zwei Entwürfe verwerfen, Erinnerung einmal Nein/einmal Ja; Testaufgabe prüfen und löschen.\nJeden Entwurf prüfen und verwerfen. Kein Versand; keine Produktivdaten.");
  else launch().catch((err) => { console.error(err.message); process.exitCode = 1; });
}
