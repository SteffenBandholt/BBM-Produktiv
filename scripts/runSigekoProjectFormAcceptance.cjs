#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { createAcceptanceProfile, createSanitizedEnvironment } = require("./runIsolatedUiEditorAcceptance.cjs");
const { ACCEPTANCE_SWITCH, configureUiEditorAcceptanceProfile } = require("../src/main/startup/uiEditorAcceptanceProfile");
const ROOT = path.resolve(__dirname, "..");

async function worker() {
  const { app, BrowserWindow, ipcMain, dialog } = require("electron");
  let profile, database, editor;
  const report = { package: "S2.4", ok: false, manualConfirmed: false, checks: [], rendererErrors: [] };
  try {
    app.setAppPath(ROOT);
    profile = configureUiEditorAcceptanceProfile({ electronApp: app }); assert.equal(profile.enabled, true);
    await app.whenReady();
    let license = { valid: true, license: { modules: ["sigeko"] } };
    database = require("../src/main/db/database");
    database.configureDatabaseMigrations(license, { allowLegacyImport: false });
    database.initDatabase();
    const repo = require("../src/main/db/projectsRepo");
    const projects = ["A", "B"].map(letter => repo.createProject({ name: `S2.4 Projekt ${letter}`, project_number: `S24-${letter}`, street: "Testweg 1", zip: "12345", city: "Testort" }));
    const db = database.initDatabase();
    db.prepare("INSERT INTO firms (id,name,street,zip,city) VALUES ('s24-firm','Testbüro','Kontaktweg 3','12345','Testort')").run();
    db.prepare("INSERT INTO persons (id,firm_id,name,phone) VALUES ('s24-person','s24-firm','Zentraler Koordinator','123')").run();
    for (const project of projects) {
      db.prepare("INSERT INTO project_firms (id,project_id,name,street) VALUES (?,?,?,?)").run(`s24-firm-${project.id}`, project.id, "Projektbüro", "Projektweg 2");
      db.prepare("INSERT INTO project_persons (id,project_firm_id,first_name,last_name,name) VALUES (?,?,?,?,?)").run(`s24-person-${project.id}`, `s24-firm-${project.id}`, "Projekt", "Koordinator", "Projekt Koordinator");
    }
    require("../src/main/ipc/projectsIpc").registerProjectsIpc();
    require("../src/main/moduleIpcRegistry").registerActiveModuleIpcs({ licenseStatus: license, getLicenseStatus: () => license, ipcMain,
      registrars: { sigeko: require("../src/main/ipc/sigekoIpc").registerSigekoIpc } });
    require("../src/main/ipc/firmDirectoryIpc").registerFirmDirectoryIpc();
    report.contactReadBoundary = "Unmodified shared firmDirectory IPC, service and SQLite resolve global and project contacts with a SiGeKo-only license; no Protokoll registrar or replacement read adapters. SiGeKo writes use unmodified productive IPC, service and current license guard.";
    ipcMain.handle("app:isPackaged", () => ({ ok: true, isPackaged: false }));
    ipcMain.handle("app:getBuildChannel", () => ({ ok: true, channel: "DEV" }));
    const win = new BrowserWindow({ width: 1280, height: 950, show: true, webPreferences: { preload: path.join(ROOT, "src/main/preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: false } });
    win.webContents.on("console-message", (_event, level, message) => { if (level >= 3 && !message.includes("Electron Security Warning")) report.rendererErrors.push(message); });
    const { ElectronUiEditorSessionController } = require("../src/main/ui-editor/electronUiEditorSession");
    editor = new ElectronUiEditorSessionController({ app, ipcMain, getMainWindow: () => win }); editor.registerIpc();
    const evaluate = code => win.webContents.executeJavaScript(code, true);
    const waitFor = async (code, timeout = 10000) => {
      const start = Date.now();
      while (!await evaluate(code)) { if (Date.now() - start > timeout) throw new Error(`TIMEOUT: ${code}`); await new Promise(resolve => setTimeout(resolve, 50)); }
    };
    const open = id => evaluate(`s24.open(${JSON.stringify(id)})`);
    const fill = values => evaluate(`s24.fill(${JSON.stringify(values)})`);
    const value = key => evaluate(`s24.element(${JSON.stringify(key)}).value`);
    const click = async key => {
      const rect = await evaluate(`s24.bounds(${JSON.stringify(key)})`);
      assert.ok(rect.width > 0 && rect.height > 0, key);
      const point = { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
      win.webContents.sendInputEvent({ type: "mouseDown", button: "left", clickCount: 1, ...point });
      win.webContents.sendInputEvent({ type: "mouseUp", button: "left", clickCount: 1, ...point });
    };
    const save = async group => {
      await evaluate(`s24.element('${group}.status').textContent = ''`);
      await click(`${group}.save`);
      await waitFor(`s24.element('${group}.status').textContent === '${group === "profile" ? "Profil gespeichert." : "Projektrollen gespeichert."}'`);
    };
    const readProject = id => evaluate(`window.bbmDb.sigekoGetProjectData({projectId:${JSON.stringify(id)}})`);
    const snapshot = () => JSON.stringify(["sigeko_profiles", "sigeko_projects", "projects", "firms", "persons", "project_firms", "project_persons"].map(table => [table, database.initDatabase().prepare(`SELECT * FROM ${table} ORDER BY id`).all()]));
    const output = process.env.BBM_S24_OUTPUT ? path.resolve(process.env.BBM_S24_OUTPUT) : profile.rootPath; fs.mkdirSync(output, { recursive: true });
    await win.loadFile(path.join(__dirname, "tests/sigekoProjectFormAcceptance.html")); await waitFor("!!window.s24");
    await open(projects[0].id);
    await fill({ "profile.name.input": "S2.4 Eigenes Büro", "profile.street.input": "Profilweg 7", "profile.email.input": "sigeko@example.invalid" });
    await save("profile");
    await fill({ "planning.source.input": "free", "planning.free.name.input": "Andere Planung", "execution.same.input": false, "execution.source.input": "module" });
    await save("roles");
    let saved = (await readProject(projects[0].id)).data;
    assert.equal(saved.planning.values.name, "Andere Planung"); assert.equal(saved.execution.values.name, "S2.4 Eigenes Büro");
    assert.equal(saved.execution.inheritedFromPlanning, false);
    report.checks.push("actual mouse save through production preload/IPC/SQLite; separate free planning and module execution");
    await open(projects[1].id); assert.equal(await value("profile.name.input"), "S2.4 Eigenes Büro");
    await save("roles"); saved = (await readProject(projects[1].id)).data;
    assert.equal(saved.planning.values.name, "S2.4 Eigenes Büro"); assert.equal(saved.execution.inheritedFromPlanning, true);
    assert.equal((await readProject(projects[0].id)).data.planning.values.name, "Andere Planung");
    report.checks.push("one module profile shared across two projects; project assignments remain independent");
    await open(projects[0].id);
    await fill({ "planning.source.input": "person", "planning.contact.input": "s24-person" }); await save("roles");
    assert.equal((await readProject(projects[0].id)).data.planning.values.name, "Zentraler Koordinator");
    await fill({ "planning.source.input": "project_person", "planning.contact.input": `s24-person-${projects[0].id}` }); await save("roles");
    assert.equal((await readProject(projects[0].id)).data.planning.values.name, "Projekt Koordinator");
    assert.equal(await evaluate(`Array.from(s24.element('planning.contact.input').options).some(o=>o.value===${JSON.stringify(`s24-person-${projects[1].id}`)})`), false);
    await fill({ "planning.source.input": "free", "planning.free.name.input": "Andere Planung", "execution.same.input": true }); await save("roles");
    saved = (await readProject(projects[0].id)).data; assert.equal(saved.execution.values.name, "Andere Planung"); assert.equal(saved.execution.inheritedFromPlanning, true);
    database.closeDatabase(); database.initDatabase(); await open(projects[0].id);
    assert.equal(await value("planning.free.name.input"), "Andere Planung");
    assert.equal(await evaluate("s24.element('execution.same.input').checked"), true);
    report.checks.push("global/project contacts resolved with project boundary; like-planning persists through SQLite restart and screen reopen");
    assert.equal(await evaluate("s24.refs.validateM83ComponentReferences(['bbm.sigeko.screen']).ok"), true);
    assert.deepEqual((await evaluate("s24.descriptor()")).activeScopes, ["sigeko.screen"]);
    report.geometry = {};
    for (const [size, width] of [["wide", 1280], ["narrow", 560]]) {
      win.setSize(width, 950); await waitFor(`innerWidth <= ${width} && innerWidth >= ${width - 80}`);
      const geometry = await evaluate("s24.geometry()"); report.geometry[size] = geometry;
      for (const field of geometry) assert.ok(field.width > 60 && field.height > 15 && field.inViewportWidth && field.inParent && field.labelAbove, JSON.stringify(field));
      for (const [part, key] of [["profile", "profile.title"], ["roles", "planning.title"]]) {
        await evaluate(`s24.element('${key}').scrollIntoView({block:'start'}); new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
        fs.writeFileSync(path.join(output, `sigeko-project-form-${size}-${part}.png`), (await win.webContents.capturePage()).toPNG());
      }
    }
    const beforeLayout = snapshot();
    await evaluate("s24.refs.applyM80State('sigeko.screen.profile.name.input', {fontSize:15}, 'textResize')");
    assert.equal(await evaluate("getComputedStyle(s24.element('profile.name.input')).fontSize"), "15px");
    assert.equal(await value("profile.name.input"), "S2.4 Eigenes Büro"); assert.equal(snapshot(), beforeLayout);
    report.checks.push("complete component refs and active scope; wide/narrow field geometry; real editor CSS operation leaves all domain tables unchanged");
    win.setSize(1280, 950); await open(projects[0].id);
    repo.archiveProject(projects[0].id);
    const beforeArchiveSave = snapshot();
    await fill({ "planning.free.name.input": "Darf nicht gespeichert werden" });
    await evaluate("s24.element('roles.status').textContent = ''"); await click("roles.save");
    await waitFor("/archiv/i.test(s24.element('roles.status').textContent)"); assert.equal(snapshot(), beforeArchiveSave);
    const blocked = await evaluate(`window.bbmDb.sigekoSaveProjectData({projectId:${JSON.stringify(projects[0].id)},planning:{source:'module'}})`);
    assert.equal(blocked.code, "PROJECT_ARCHIVED");
    repo.unarchiveProject(projects[0].id); await open(projects[0].id);
    license = { valid: true, license: { modules: [] } };
    assert.equal(await evaluate("window.bbmDb.sigekoSaveCoordinatorProfile({patch:{name:'Verboten'}}).then(()=>false,e=>String(e).includes('MODULE_NOT_ACTIVE'))"), true);
    license = { valid: true, license: { modules: ["sigeko"] } };
    report.checks.push("already-open archived project rejects mouse save atomically; production IPC enforces archive and current module license");
    if (process.argv.includes("--manual")) {
      await open(projects[0].id); await evaluate("s24.element('profile.title').scrollIntoView({block:'start'})");
      await dialog.showMessageBox(win, { type: "info", title: "BBM S2.4 – manuelle Grunddatenabnahme", message: "Bitte Profil und beide Projektrollen selbst eingeben und jeweils speichern.", detail: "1. Eigenes SiGeKo-Profil: Name = Manueller SiGeKo; Profil speichern.\n2. Planung: Freie Angabe wählen, Name = Manuelle Planung.\n3. Ausführung wie Planung ausschalten; Ausführung = Eigenes SiGeKo-Profil.\n4. Projektrollen speichern.\nDanach öffnet sich das Projekt automatisch erneut. Alle Daten liegen in einem isolierten Testprofil." });
      await waitFor(`(async()=>{const p=await bbmDb.sigekoGetCoordinatorProfile();const r=await bbmDb.sigekoGetProjectData({projectId:${JSON.stringify(projects[0].id)}});return p.data?.name==='Manueller SiGeKo' && r.data?.planning?.values?.name==='Manuelle Planung' && r.data?.execution?.assignment?.source==='module' && r.data?.execution?.inheritedFromPlanning===false;})()`, 600000);
      database.closeDatabase(); database.initDatabase(); await open(projects[0].id);
      await dialog.showMessageBox(win, { type: "info", title: "BBM S2.4 – gespeichert und erneut geöffnet", message: "Bitte prüfen: Eigenes Profil Manueller SiGeKo; Planung Manuelle Planung; Ausführung Eigenes SiGeKo-Profil.", detail: "Nach OK können Sie das Formular ansehen und scrollen. Klicken Sie danach nochmals Projektrollen speichern, um die abschließende Bestätigung zu öffnen." });
      await evaluate("s24.element('roles.status').textContent = ''"); await waitFor("s24.element('roles.status').textContent === 'Projektrollen gespeichert.'", 600000);
      const answer = await dialog.showMessageBox(win, { type: "question", title: "BBM S2.4 – manuelle Abnahme", message: "Sind Profil, getrennte Rollen und gespeicherte Werte korrekt sichtbar und gut bedienbar?", buttons: ["Nicht bestanden", "Geprüft – bestanden"], defaultId: 0, cancelId: 0 });
      assert.equal(answer.response, 1); report.manualConfirmed = true;
    }
    // Expected license rejection is returned by IPC, not a renderer execution failure.
    assert.deepEqual(report.rendererErrors, []); report.ok = true;
  } catch (error) { report.error = { message: error.message, stack: error.stack }; }
  finally {
    await editor?.close(); database?.closeDatabase(); for (const win of BrowserWindow.getAllWindows()) win.destroy();
    const output = process.env.BBM_S24_OUTPUT ? path.resolve(process.env.BBM_S24_OUTPUT) : profile?.rootPath;
    if (output) { fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(path.join(output, "sigeko-project-form-result.json"), JSON.stringify(report, null, 2)); console.log(`${report.ok ? "PASS" : "FAIL"}: ${path.join(output, "sigeko-project-form-result.json")}`); }
    if (report.error) console.error(report.error.stack); app.exit(report.ok ? 0 : 1);
  }
}
async function launch() {
  const profile = createAcceptanceProfile();
  const child = spawn(require("electron"), [__filename, "--worker", `${ACCEPTANCE_SWITCH}${profile.rootPath}`, ...(process.argv.includes("--manual") ? ["--manual"] : [])], { cwd: ROOT, env: createSanitizedEnvironment(), stdio: "inherit" });
  process.exitCode = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", code => resolve(code ?? 1)); });
}
if (process.versions.electron && process.argv.includes("--worker")) void worker();
else if (require.main === module) launch().catch(error => { console.error(error); process.exitCode = 1; });
