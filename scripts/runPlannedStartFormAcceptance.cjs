#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { createAcceptanceProfile, createSanitizedEnvironment } = require("./runIsolatedUiEditorAcceptance.cjs");
const { ACCEPTANCE_SWITCH, configureUiEditorAcceptanceProfile } = require("../src/main/startup/uiEditorAcceptanceProfile");
const ROOT = path.resolve(__dirname, "..");
const SCOPE = "projektverwaltung.plannedStart";

async function worker() {
  const { app, BrowserWindow, ipcMain, dialog } = require("electron");
  let profile, database, editor;
  const report = { package: "S2.2", ok: false, manualConfirmed: false, checks: [] };
  try {
    app.setAppPath(ROOT);
    profile = configureUiEditorAcceptanceProfile({ electronApp: app }); assert.equal(profile.enabled, true);
    await app.whenReady();
    database = require("../src/main/db/database");
    database.configureDatabaseMigrations({ valid: true, license: { modules: [] } }, { allowLegacyImport: false });
    const db = database.initDatabase();
    require("../src/main/db/appSettingsRepo").appSettingsSetMany({ "pdf.protocolsDir": path.join(profile.rootPath, "output") });
    require("../src/main/ipc/projectsIpc").registerProjectsIpc();
    ipcMain.handle("app:isPackaged", () => ({ ok: true, isPackaged: false }));
    ipcMain.handle("app:getBuildChannel", () => ({ ok: true, channel: "DEV" }));
    const repo = require("../src/main/db/projectsRepo");
    const old = repo.createProject({ name: "S2.2 Altprojekt", project_number: "S22-ALT", short: "Alt", street: "Testweg 1", zip: "12345", city: "Testort", project_lead: "Testleitung", project_lead_phone: "0123", start_date: "2001-02-03", end_date: "2030-04-05", notes: "Unveränderte Projektdaten" });
    const win = new BrowserWindow({ width: 1200, height: 850, show: true, webPreferences: { preload: path.join(ROOT, "src/main/preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: false } });
    const { ElectronUiEditorSessionController } = require("../src/main/ui-editor/electronUiEditorSession");
    editor = new ElectronUiEditorSessionController({ app, ipcMain, getMainWindow: () => win });
    editor.registerIpc();
    const evaluate = code => win.webContents.executeJavaScript(code, true);
    const waitFor = async (code, timeout = 10000) => {
      const start = Date.now();
      while (!await evaluate(code)) { if (Date.now() - start > timeout) throw new Error(`TIMEOUT: ${code}`); await new Promise(resolve => setTimeout(resolve, 50)); }
    };
    const open = async id => { await evaluate(`s22.open(${JSON.stringify(id)})`); await waitFor(`!!s22.form.plannedStartEditorRefs['.editor']`); };
    const click = async key => {
      const rect = await evaluate(`s22.bounds(${JSON.stringify(key)})`);
      const point = { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
      win.webContents.sendInputEvent({ type: "mouseDown", button: "left", clickCount: 1, ...point });
      win.webContents.sendInputEvent({ type: "mouseUp", button: "left", clickCount: 1, ...point });
    };
    await win.loadFile(path.join(__dirname, "tests/plannedStartFormAcceptance.html"));
    await waitFor("!!window.s22");
    await open(old.id);
    assert.equal(await evaluate("s22.form.inpPlannedStart.value"), "");
    assert.equal(await evaluate("s22.form.inpStart.value"), old.start_date);
    await evaluate(`s22.fill({ inpPlannedStart: '2026-10-11' })`);
    await click("btnSave"); await waitFor("!s22.form.overlayEl");
    assert.equal(repo.getById(old.id).geplanter_baubeginn, "2026-10-11");
    for (const key of ["name", "project_number", "short", "street", "zip", "city", "project_lead", "project_lead_phone", "start_date", "end_date", "notes"]) assert.equal(repo.getById(old.id)[key], old[key], key);
    report.checks.push("actual mouse save through production preload/IPC/SQLite; all previous fields preserved");
    database.closeDatabase(); database.initDatabase();
    await open(old.id); assert.equal(await evaluate("s22.form.inpPlannedStart.value"), "2026-10-11");
    const descriptor = await evaluate("s22.descriptor()"); assert.deepEqual(descriptor.activeScopes, [SCOPE]);
    assert.equal(await evaluate(`s22.refs.validateM83ComponentReferences(['bbm.projektverwaltung.plannedStart']).ok`), true);
    const geometry = await evaluate(`(() => { const f=s22.form; const a=f.inpPlannedStart.getBoundingClientRect(), b=f.inpEnd.getBoundingClientRect(), c=f.taNotes.getBoundingClientRect(), m=f.modalEl.getBoundingClientRect(); return {width:a.width,height:a.height,noOverlap:a.top>=b.bottom && a.bottom<=c.top,inModal:a.left>=m.left && a.right<=m.right,label:f.plannedStartEditorRefs['.label'].textContent}; })()`);
    assert.ok(geometry.width > 60 && geometry.height > 15 && geometry.noOverlap && geometry.inModal, JSON.stringify(geometry)); report.geometry = geometry;
    const output = process.env.BBM_S22_OUTPUT ? path.resolve(process.env.BBM_S22_OUTPUT) : profile.rootPath; fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, "planned-start-form.png"), (await win.webContents.capturePage()).toPNG());
    await evaluate(`s22.refs.applyM80State('${SCOPE}.input', {fontSize:15}, 'textResize')`);
    assert.equal(await evaluate("getComputedStyle(s22.form.inpPlannedStart).fontSize"), "15px");
    assert.equal(await evaluate("s22.form.inpPlannedStart.value"), "2026-10-11");
    report.checks.push("five explicit refs, active editor scope, non-overlapping geometry and real CSS font change without date change");
    await evaluate("s22.fill({inpPlannedStart:''})"); await click("btnSave"); await waitFor("!s22.form.overlayEl");
    await open(old.id); assert.equal(await evaluate("s22.form.inpPlannedStart.value"), ""); assert.equal(repo.getById(old.id).geplanter_baubeginn, null);
    await evaluate("s22.fill({inpPlannedStart:'2029-01-01'})"); await click("btnModalCancel"); await waitFor("!s22.form.overlayEl");
    assert.equal(repo.getById(old.id).geplanter_baubeginn, null); assert.equal(await evaluate(`s22.refs.getM80Ref('${SCOPE}') === null`), true);
    report.checks.push("clear persists NULL; cancel discards edit and clears only component refs");
    await open(null); await evaluate("s22.fill({inpName:'S2.2 Neuanlage',inpStart:'2026-09-01',inpPlannedStart:'2026-10-01',inpEnd:'2027-01-01'})");
    await click("btnSave"); await waitFor("!s22.form.overlayEl");
    const created = repo.listAll().find(p => p.name === "S2.2 Neuanlage"); assert.equal(created.geplanter_baubeginn, "2026-10-01"); assert.equal(created.start_date, "2026-09-01");
    report.checks.push("new project uses same productive form and independent dates");
    if (process.argv.includes("--manual")) {
      await open(old.id);
      await dialog.showMessageBox(win, { type: "info", title: "BBM S2.2 – manuelle Formularabnahme", message: "Bitte im geöffneten Altprojekt zwei unterschiedliche Beginndaten eingeben und Speichern klicken.", detail: "Startdatum: 01.09.2026\nGeplanter Baubeginn: 01.10.2026\nDas Formular wird danach automatisch erneut geöffnet. Alle Daten liegen in einem isolierten Testprofil." });
      await waitFor("!s22.form.overlayEl", 600000);
      await open(old.id); assert.equal(await evaluate("s22.form.inpStart.value"), "2026-09-01"); assert.equal(await evaluate("s22.form.inpPlannedStart.value"), "2026-10-01");
      const answer = await dialog.showMessageBox(win, { type: "question", title: "BBM S2.2 – Wiederöffnen prüfen", message: "Sind beide gespeicherten Beginndaten korrekt sichtbar und die Formularfelder gut bedienbar?", buttons: ["Nicht bestanden", "Geprüft – bestanden"], defaultId: 0, cancelId: 0 });
      assert.equal(answer.response, 1); report.manualConfirmed = true;
    }
    report.ok = true;
  } catch (error) { report.error = { message: error.message, stack: error.stack }; }
  finally {
    await editor?.close();
    database?.closeDatabase();
    for (const win of BrowserWindow.getAllWindows()) win.destroy();
    const output = process.env.BBM_S22_OUTPUT ? path.resolve(process.env.BBM_S22_OUTPUT) : profile?.rootPath;
    if (output) { fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(path.join(output, "planned-start-result.json"), JSON.stringify(report, null, 2)); console.log(`${report.ok ? "PASS" : "FAIL"}: ${path.join(output, "planned-start-result.json")}`); }
    if (report.error) console.error(report.error.stack);
    app.exit(report.ok ? 0 : 1);
  }
}
async function launch() {
  const profile = createAcceptanceProfile();
  const child = spawn(require("electron"), [__filename, "--worker", `${ACCEPTANCE_SWITCH}${profile.rootPath}`, ...(process.argv.includes("--manual") ? ["--manual"] : [])], { cwd: ROOT, env: createSanitizedEnvironment(), stdio: "inherit" });
  process.exitCode = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", code => resolve(code ?? 1)); });
}
if (process.versions.electron && process.argv.includes("--worker")) void worker();
else if (require.main === module) launch().catch(error => { console.error(error); process.exitCode = 1; });
