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
  const { app, BrowserWindow, ipcMain, dialog, screen } = require("electron");
  let profile, database, editor;
  const report = { package: "S2.4 / S3 / S4 / S5.2", ok: false, manualConfirmed: false, checks: [], rendererErrors: [] };
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
      await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
    };
    const save = async group => {
      await evaluate(`s24.element('${group}.status').textContent = ''`);
      await click(`${group}.save`);
      await waitFor(`!s24.screen.${group}Busy && !s24.screen.readinessBusy && s24.element('${group}.status').textContent === '${group === "profile" ? "Profil gespeichert." : "Projektrollen gespeichert."}'`);
    };
    const readProject = id => evaluate(`window.bbmDb.sigekoGetProjectData({projectId:${JSON.stringify(id)}})`);
    const readiness = async (id, status) => {
      await waitFor(`!s24.screen.readinessBusy && s24.screen.readinessData?.projectId === ${JSON.stringify(id)} && s24.screen.readinessData.projectData.status === ${JSON.stringify(status)}`);
      const result = await evaluate("s24.screen.readinessData");
      assert.equal(await evaluate("s24.element('readiness.project.status').textContent"), status === "green" ? "Grün – Angaben vollständig." : "Rot – Angaben fehlen.");
      assert.equal(result.authorities.status, "red"); assert.equal(result.authorities.available, true);
      assert.match(await evaluate("s24.element('readiness.authorities.status').textContent"), /Rot/);
      assert.match(await evaluate("s24.element('readiness.authorities.issues').textContent"), /zugeordnet|Projektkontakt/);
      return result;
    };
    const snapshot = () => JSON.stringify(["sigeko_profiles", "sigeko_projects", "projects", "firms", "persons", "project_firms", "project_persons", "sigeko_authority_records", "sigeko_project_authorities"].map(table => [table, database.initDatabase().prepare(`SELECT * FROM ${table} ORDER BY id`).all()]));
    const output = process.env.BBM_S24_OUTPUT ? path.resolve(process.env.BBM_S24_OUTPUT) : profile.rootPath; fs.mkdirSync(output, { recursive: true });
    await win.loadFile(path.join(__dirname, "tests/sigekoProjectFormAcceptance.html")); await waitFor("!!window.s24");
    await open(projects[0].id);
    const initialReadiness = await readiness(projects[0].id, "red");
    assert.ok(initialReadiness.projectData.issues.length > 0);
    assert.match(await evaluate("s24.element('readiness.project.issues').textContent"), /Bauherr/);
    assert.equal(await evaluate("s24.element('profile.save').disabled || s24.element('roles.save').disabled"), false);
    report.checks.push("S3: incomplete project reports concrete missing builder data and actual missing S4 project-contact status; profile and role saves remain enabled");
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
    // S3 uses the same real IPC, database and screen as S2.4. Complete fixtures through
    // the central project repository, then operate the existing screen with real clicks.
    repo.updateProject({ id: projects[0].id, geplanter_baubeginn: "2026-10-01", end_date: "2026-12-31", bauherr: { kind: "global_firm", id: "s24-firm" } });
    await fill({ "planning.free.street.input": "Planungsweg 8", "planning.free.zip.input": "12345", "planning.free.city.input": "Testort" });
    await save("roles");
    assert.deepEqual((await readiness(projects[0].id, "green")).projectData.issues, []);
    report.checks.push("S3: saving complete planning and inherited execution automatically refreshes project readiness to green without mandatory phone, email or logo");
    await fill({ "planning.free.name.input": "Ungespeicherter Rollenentwurf", "profile.name.input": "Ungespeicherter Profilentwurf" });
    const beforeRefresh = snapshot();
    await click("readiness.refresh"); await readiness(projects[0].id, "green");
    assert.equal(snapshot(), beforeRefresh);
    assert.equal(await value("planning.free.name.input"), "Ungespeicherter Rollenentwurf");
    assert.equal(await value("profile.name.input"), "Ungespeicherter Profilentwurf");
    assert.equal((await readProject(projects[0].id)).data.planning.values.name, "Andere Planung");
    report.checks.push("S3: real refresh reads persisted data only, preserves both unsaved drafts and leaves all nine domain tables unchanged");
    await open(projects[0].id);
    repo.updateProject({ id: projects[0].id, bauherr: null });
    await click("readiness.refresh"); await readiness(projects[0].id, "red");
    assert.match(await evaluate("s24.element('readiness.project.issues').textContent"), /Bauherr/);
    repo.updateProject({ id: projects[0].id, bauherr: { kind: "global_firm", id: "s24-firm" } });
    await click("readiness.refresh"); await readiness(projects[0].id, "green");
    // A vanished central source must invalidate an existing assignment without writing it.
    database.initDatabase().prepare("UPDATE firms SET removed_at='2026-09-09' WHERE id='s24-firm'").run();
    const beforeMissingSourceRead = snapshot();
    await click("readiness.refresh"); await readiness(projects[0].id, "red");
    assert.equal(snapshot(), beforeMissingSourceRead);
    assert.match(await evaluate("s24.element('readiness.project.issues').textContent"), /Bauherr/);
    database.initDatabase().prepare("UPDATE firms SET removed_at=NULL WHERE id='s24-firm'").run();
    await click("readiness.refresh"); await readiness(projects[0].id, "green");
    await click("readiness.editProject");
    await waitFor(`s24.projectFormRequest?.projectId === ${JSON.stringify(projects[0].id)}`);
    await click("readiness.editRoles");
    assert.equal(await evaluate("s24.element('profile.save').disabled || s24.element('roles.save').disabled"), false);
    report.checks.push("S3: real refresh changes green/red/green for cleared and missing builder sources; central edit action routes the current project and local editing remains reachable");
    await open(projects[1].id); await readiness(projects[1].id, "red");
    repo.updateProject({ id: projects[1].id, geplanter_baubeginn: "2026-10-02", end_date: "2026-12-31", bauherr: { kind: "global_firm", id: "s24-firm" } });
    await fill({ "profile.zip.input": "12345", "profile.city.input": "Testort" }); await save("profile");
    await readiness(projects[1].id, "green");
    await fill({ "profile.city.input": "" }); await save("profile");
    await readiness(projects[1].id, "red");
    await open(projects[0].id); await readiness(projects[0].id, "green");
    assert.equal(await value("planning.free.name.input"), "Andere Planung");
    report.checks.push("S3: profile saves automatically update the module-based project's readiness; switching to independently assigned free roles yields that project's own green state");
    // S4 remains on the same real screen, preload and isolated SQLite database.
    const panelIdle = "!s24.screen.authoritiesPanel.loading && !s24.screen.authoritiesPanel.busy && s24.screen.authoritiesPanel.ready";
    const authorityReady = async id => {
      await waitFor(`${panelIdle} && s24.screen.authoritiesPanel.projectData?.projectId === ${JSON.stringify(id)}`);
      return evaluate("s24.screen.authoritiesPanel.projectData");
    };
    const authorityAction = async (key, condition) => {
      await click(key);
      await waitFor(`${panelIdle} && (${condition})`);
      await waitFor("!s24.screen.readinessBusy");
    };
    const projectContact = async category => (await authorityReady(projects[0].id)).categories.find(row => row.category === category);
    const selectCategory = async category => {
      await fill({ "authorities.record.reason.input": "", "authorities.assignment.note.input": "", "authorities.category.input": category });
      assert.equal(await value("authorities.category.input"), category);
      if (sourceIds[category]) {
        await fill({ "authorities.contact.input": sourceIds[category] });
        assert.equal(await evaluate("s24.screen.authoritiesPanel.selectedRecord?.id"), sourceIds[category]);
      }
    };
    const sourceIds = {};
    const createConfirmedContact = async category => {
      await selectCategory(category); await click("authorities.new");
      await waitFor("s24.screen.authoritiesPanel.selectedRecord === null");
      await fill(Object.fromEntries(Object.entries({ organization: `S4 ${category}`, street: "Kontaktweg 9", zip: "12345", city: "Testort",
        phone: "040123456", email: "kontakt@example.invalid", emergency_phone: "040987654",
        source: "https://example.invalid/gepruefter-kontakt", scope_street: "Testweg 1", scope_zip: "12345", scope_city: "Testort",
        scope_area: "Dokumentierter Bereich Testweg 1, 12345 Testort", verification_note: category === "HOSPITAL"
          ? "ZNA und Eignung nachgewiesen; Entfernung zur Baustelle fachlich geprüft"
          : category === "ACCIDENT_DOCTOR" ? "D-Arzt-Zulassung und Eignung nachgewiesen; Entfernung zur Baustelle fachlich geprüft"
          : "Zuständigkeit und erreichbarer Kontakt anhand der Quelle geprüft" }).map(([key, entry]) => [`authorities.record.${key}.input`, entry])));
      assert.equal(await evaluate("s24.element('authorities.record.confirm').disabled"), true);
      await authorityAction("authorities.record.save", `s24.screen.authoritiesPanel.selectedRecord?.organization === ${JSON.stringify(`S4 ${category}`)}`);
      const record = await evaluate("s24.screen.authoritiesPanel.selectedRecord"); sourceIds[category] = record.id;
      assert.equal(record.verification_status, "unverified");
      assert.equal(database.initDatabase().prepare("SELECT COUNT(*) n FROM sigeko_project_authorities WHERE project_id=? AND category=?").get(projects[0].id, category).n, 0);
      await authorityAction("authorities.record.confirm", "s24.screen.authoritiesPanel.selectedRecord?.verification_status === 'confirmed'");
      assert.equal(database.initDatabase().prepare("SELECT COUNT(*) n FROM sigeko_project_authorities WHERE project_id=? AND category=?").get(projects[0].id, category).n, 0);
    };
    const assignSelected = async (category, note, status = "green") => {
      const before = (await projectContact(category)).assignment?.revision || 0;
      await fill({ "authorities.assignment.note.input": note });
      await authorityAction("authorities.assignment.confirm", `s24.screen.authoritiesPanel.projectData.categories.find(row=>row.category===${JSON.stringify(category)}).assignment?.revision > ${before}`);
      assert.equal((await projectContact(category)).status, status);
    };
    await authorityReady(projects[0].id);
    assert.equal(await evaluate("Array.from(s24.element('authorities.category.input').options).some(option=>option.value==='EMERGENCY_112')"), false);
    assert.match(await evaluate("s24.element('authorities.overview.emergency').textContent"), /112/);
    assert.match(await evaluate("s24.element('authorities.overview.police').textContent"), /110/);
    await click("readiness.editAuthorities");
    await createConfirmedContact("LABOR_AUTHORITY");
    await assignSelected("LABOR_AUTHORITY", "Staatliche Arbeitsschutzbehörde für Testweg 1 anhand Zuständigkeitsnachweis bestätigt");
    for (const category of ["HOSPITAL", "ACCIDENT_DOCTOR"]) {
      await createConfirmedContact(category);
      assert.equal((await projectContact(category)).proposal, null);
      assert.match(await evaluate("s24.element('authorities.assignment.hint').textContent"), /Nähe|Eignung/);
      await assignSelected(category, "Nächstgelegene geeignete Stelle für diese Baustelle; Entfernung und ZNA beziehungsweise D-Arzt-Zulassung geprüft");
    }
    for (const category of ["WATER", "ELECTRICITY", "GAS", "POLICE"]) await createConfirmedContact(category);
    await authorityAction("authorities.apply", "s24.screen.authoritiesPanel.projectData.status === 'green'");
    let contacts = await authorityReady(projects[0].id);
    assert.equal(contacts.categories.length, 8); assert.ok(contacts.categories.every(row => row.status === "green"));
    assert.equal(contacts.categories.filter(row => row.assignment?.assessment_method === "known_stock").length, 4);
    await waitFor("s24.screen.readinessData?.authorities.status === 'green'");
    assert.equal(await evaluate("s24.element('authorities.apply').disabled"), true);
    report.checks.push("S4: seven contacts saved and explicitly verified through real mouse/preload/IPC/SQLite without implicit project assignments; separate labor and medical suitability decisions plus one batch action yield eight green categories and fixed 112/110");
    const aAssignments = JSON.stringify(database.initDatabase().prepare("SELECT * FROM sigeko_project_authorities WHERE project_id=? ORDER BY category").all(projects[0].id));
    await open(projects[1].id); contacts = await authorityReady(projects[1].id);
    assert.equal(contacts.categories.filter(row => row.assignment).length, 0);
    assert.equal(contacts.categories.filter(row => row.proposal).length, 5);
    await authorityAction("authorities.apply", "s24.screen.authoritiesPanel.projectData.categories.filter(row=>row.assignment).length === 5");
    assert.equal(JSON.stringify(database.initDatabase().prepare("SELECT * FROM sigeko_project_authorities WHERE project_id=? ORDER BY category").all(projects[0].id)), aAssignments);
    database.closeDatabase(); database.initDatabase(); await open(projects[0].id); await authorityReady(projects[0].id);
    assert.equal(JSON.stringify(database.initDatabase().prepare("SELECT * FROM sigeko_project_authorities WHERE project_id=? ORDER BY category").all(projects[0].id)), aAssignments);
    report.checks.push("S4: second project reuses all five exact nonmedical verified contacts without repeat individual confirmation, while medical decisions stay pending; first project snapshots remain independent across project switch and SQLite reopen");
    await selectCategory("LABOR_AUTHORITY");
    await fill({ "planning.free.name.input": "Ungespeicherter Rollenentwurf", "profile.name.input": "Ungespeicherter Profilentwurf",
      "authorities.record.organization.input": "Ungespeicherter Behördenentwurf", "authorities.record.reason.input": "Offene Rückfrage",
      "authorities.assignment.note.input": "Noch ungespeicherte Projektprüfung" });
    const beforeAuthorityRefresh = snapshot();
    assert.equal(await evaluate("s24.element('authorities.record.confirm').disabled && s24.element('authorities.assignment.confirm').disabled && s24.element('authorities.record.uncertain').disabled"), true);
    await click("authorities.refresh"); await authorityReady(projects[0].id); await click("readiness.refresh");
    await waitFor("!s24.screen.readinessBusy");
    for (const [key, expected] of Object.entries({ "planning.free.name.input": "Ungespeicherter Rollenentwurf", "profile.name.input": "Ungespeicherter Profilentwurf",
      "authorities.record.organization.input": "Ungespeicherter Behördenentwurf", "authorities.record.reason.input": "Offene Rückfrage", "authorities.assignment.note.input": "Noch ungespeicherte Projektprüfung" })) assert.equal(await value(key), expected);
    assert.equal(snapshot(), beforeAuthorityRefresh);
    report.checks.push("S4: authority and readiness refresh preserve profile, role, stock and both note drafts without changing any of nine domain tables; dirty stock blocks confirmation and project assignment");
    await open(projects[0].id); await authorityReady(projects[0].id); await selectCategory("LABOR_AUTHORITY");
    const originalContact = (await projectContact("LABOR_AUTHORITY")).assignment;
    await fill({ "authorities.record.phone.input": "040777777" });
    await authorityAction("authorities.record.save", "s24.screen.authoritiesPanel.selectedRecord?.phone === '040777777'");
    assert.equal((await projectContact("LABOR_AUTHORITY")).assignment.snapshot_json, originalContact.snapshot_json);
    assert.equal((await projectContact("LABOR_AUTHORITY")).status, "orange");
    await assignSelected("LABOR_AUTHORITY", "Projektbezogene Zuständigkeit bestätigt; Quellenprüfung steht noch aus", "orange");
    const unverifiedSnapshot = (await projectContact("LABOR_AUTHORITY")).assignment.snapshot_json;
    assert.equal(JSON.parse(unverifiedSnapshot).verification_status, "unverified");
    await authorityAction("authorities.record.confirm", "s24.screen.authoritiesPanel.selectedRecord?.verification_status === 'confirmed'");
    assert.equal((await projectContact("LABOR_AUTHORITY")).assignment.snapshot_json, unverifiedSnapshot);
    assert.equal((await projectContact("LABOR_AUTHORITY")).status, "orange");
    await assignSelected("LABOR_AUTHORITY", "Aktuellen bestätigten Kontakt und Zuständigkeit erneut geprüft");
    await fill({ "authorities.record.reason.input": "Erreichbarkeit muss erneut geprüft werden" });
    await authorityAction("authorities.record.uncertain", "s24.screen.authoritiesPanel.selectedRecord?.verification_status === 'uncertain'");
    assert.equal((await projectContact("LABOR_AUTHORITY")).status, "orange");
    await fill({ "authorities.record.reason.input": "" });
    await authorityAction("authorities.record.confirm", "s24.screen.authoritiesPanel.selectedRecord?.verification_status === 'confirmed'");
    await fill({ "authorities.assignment.note.input": "Projektzuständigkeit nach Rückfrage noch klären" });
    await authorityAction("authorities.assignment.uncertain", "s24.screen.authoritiesPanel.projectData.categories.find(row=>row.category==='LABOR_AUTHORITY').assignment?.assessment_status === 'uncertain'");
    assert.equal((await projectContact("LABOR_AUTHORITY")).status, "orange");
    await assignSelected("LABOR_AUTHORITY", "Rückfrage geklärt; aktuelle Quelle und Baustellenzuständigkeit erneut geprüft");
    report.checks.push("S4: source editing and source/project uncertainty retain the saved project contact and turn status orange; a manual project decision cannot turn an unverified source green; only fresh source verification and explicit reassignment restore green");
    await selectCategory("HOSPITAL");
    const missingHospital = (await projectContact("HOSPITAL")).assignment;
    database.initDatabase().prepare("DELETE FROM sigeko_authority_records WHERE id=?").run(sourceIds.HOSPITAL);
    await authorityAction("authorities.refresh", "s24.screen.authoritiesPanel.projectData.categories.find(row=>row.category==='HOSPITAL').issues.some(issue=>issue.code==='SOURCE_MISSING')");
    assert.equal((await projectContact("HOSPITAL")).assignment.snapshot_json, missingHospital.snapshot_json);
    assert.equal((await projectContact("HOSPITAL")).status, "orange");
    const hospitalText = await evaluate("s24.element('authorities.assignment.snapshot').textContent");
    for (const field of ["organization", "street", "zip", "city", "phone", "source"]) assert.ok(hospitalText.includes(missingHospital.snapshot[field]), field);
    report.checks.push("S4: a vanished reusable source leaves the complete saved project contact visible with explicit orange missing-source status");
    assert.equal(await evaluate("s24.refs.validateM83ComponentReferences(['bbm.sigeko.screen']).ok"), true);
    assert.deepEqual((await evaluate("s24.descriptor()")).activeScopes, ["sigeko.screen"]);
    report.geometry = {};
    report.readinessGeometry = {};
    report.authoritiesGeometry = {};
    for (const [size, width] of [["wide", 1280], ["narrow", 560]]) {
      win.setSize(width, 950); await waitFor(`innerWidth <= ${width} && innerWidth >= ${width - 80}`);
      const geometry = await evaluate("s24.geometry()"); report.geometry[size] = geometry;
      for (const field of geometry) assert.ok(field.width > 60 && field.height > 15 && field.inViewportWidth && field.inParent && field.labelAbove, JSON.stringify(field));
      const panelGeometry = await evaluate("s24.readinessGeometry()"); report.readinessGeometry[size] = panelGeometry;
      for (const element of panelGeometry) assert.ok(element.width > 15 && element.height > 10 && element.inViewportWidth && element.inParent, JSON.stringify(element));
      for (const key of ["readiness.refresh", "readiness.editProject", "readiness.editRoles", "readiness.editAuthorities", "authorities.refresh", "authorities.apply", "authorities.new", "authorities.record.save", "authorities.record.confirm", "authorities.record.uncertain", "authorities.assignment.confirm", "authorities.assignment.uncertain"]) {
        const rect = await evaluate(`s24.bounds(${JSON.stringify(key)})`);
        const viewport = await evaluate("({width:innerWidth,height:innerHeight})");
        assert.ok(rect.x >= -1 && rect.y >= -1 && rect.x + rect.width <= viewport.width + 1 && rect.y + rect.height <= viewport.height + 1, JSON.stringify({ key, rect, viewport }));
      }
      const authorityGeometry = await evaluate("s24.authoritiesGeometry()"); report.authoritiesGeometry[size] = authorityGeometry;
      for (const element of authorityGeometry) assert.ok(element.width > 15 && element.height > 10 && element.inViewportWidth && element.inParent && element.labelAbove, JSON.stringify(element));
      for (const [part, key] of [["overview", "authorities.title"], ["record", "authorities.record.title"], ["assignment", "authorities.assignment.title"]]) {
        await evaluate(`s24.element('${key}').scrollIntoView({block:'start'}); new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
        fs.writeFileSync(path.join(output, `sigeko-authorities-${size}-${part}.png`), (await win.webContents.capturePage()).toPNG());
      }
      await evaluate("s24.element('readiness.title').scrollIntoView({block:'start'}); new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
      fs.writeFileSync(path.join(output, `sigeko-readiness-${size}.png`), (await win.webContents.capturePage()).toPNG());
      for (const [part, key] of [["profile", "profile.title"], ["roles", "planning.title"]]) {
        await evaluate(`s24.element('${key}').scrollIntoView({block:'start'}); new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
        fs.writeFileSync(path.join(output, `sigeko-project-form-${size}-${part}.png`), (await win.webContents.capturePage()).toPNG());
      }
    }
    const beforeLayout = snapshot();
    await evaluate("s24.refs.applyM80State('sigeko.screen.profile.name.input', {fontSize:15}, 'textResize')");
    assert.equal(await evaluate("getComputedStyle(s24.element('profile.name.input')).fontSize"), "15px");
    assert.equal(await value("profile.name.input"), "S2.4 Eigenes Büro"); assert.equal(snapshot(), beforeLayout);
    await evaluate("s24.refs.applyM80State('sigeko.screen.authorities.record.organization.input', {fontSize:15}, 'textResize')");
    assert.equal(await evaluate("getComputedStyle(s24.element('authorities.record.organization.input')).fontSize"), "15px");
    assert.equal(snapshot(), beforeLayout);
    report.checks.push("complete component refs and active scope; wide/narrow field and readiness panel geometry and authority forms with all actions reachable by scrolling; real editor CSS operation leaves all domain tables unchanged");
    win.setSize(1280, 950); await open(projects[0].id); await authorityReady(projects[0].id); await selectCategory("LABOR_AUTHORITY");
    repo.archiveProject(projects[0].id);
    const beforeArchiveSave = snapshot();
    await fill({ "planning.free.name.input": "Darf nicht gespeichert werden" });
    await evaluate("s24.element('roles.status').textContent = ''"); await click("roles.save");
    await waitFor("/archiv/i.test(s24.element('roles.status').textContent)"); assert.equal(snapshot(), beforeArchiveSave);
    const blocked = await evaluate(`window.bbmDb.sigekoSaveProjectData({projectId:${JSON.stringify(projects[0].id)},planning:{source:'module'}})`);
    assert.equal(blocked.code, "PROJECT_ARCHIVED");
    await fill({ "authorities.assignment.note.input": "Archiviertes Projekt darf keine neue Zuordnung erhalten" });
    await click("authorities.assignment.confirm");
    await waitFor("!s24.screen.authoritiesPanel.busy && /archiv/i.test(s24.element('authorities.status').textContent)");
    assert.equal(snapshot(), beforeArchiveSave);
    await open(projects[0].id); await authorityReady(projects[0].id);
    for (const key of ["authorities.new", "authorities.record.save", "authorities.record.confirm", "authorities.record.uncertain", "authorities.assignment.confirm", "authorities.assignment.uncertain", "authorities.apply"]) {
      assert.equal(await evaluate(`s24.element(${JSON.stringify(key)}).disabled`), true, key);
    }
    repo.unarchiveProject(projects[0].id); await open(projects[0].id);
    license = { valid: true, license: { modules: [] } };
    assert.equal(await evaluate("window.bbmDb.sigekoSaveCoordinatorProfile({patch:{name:'Verboten'}}).then(()=>false,e=>String(e).includes('MODULE_NOT_ACTIVE'))"), true);
    assert.equal(await evaluate(`window.bbmDb.sigekoGetReadiness({projectId:${JSON.stringify(projects[0].id)}}).then(()=>false,e=>String(e).includes('MODULE_NOT_ACTIVE'))`), true);
    assert.equal(await evaluate("window.bbmDb.sigekoSaveAuthorityRecord({patch:{category:'GAS',organization:'Verboten'}}).then(()=>false,e=>String(e).includes('MODULE_NOT_ACTIVE'))"), true);
    assert.equal(await evaluate(`window.bbmDb.sigekoGetProjectAuthorities({projectId:${JSON.stringify(projects[0].id)}}).then(()=>false,e=>String(e).includes('MODULE_NOT_ACTIVE'))`), true);
    license = { valid: true, license: { modules: ["sigeko"] } };
    report.checks.push("already-open archived project rejects role and authority assignment mouse saves atomically; reopened authority form is read-only; production IPC enforces archive and current module license for profile, readiness, stock and project contacts");
    // S5.2 uses the real module descriptor/route adapter and the actual form;
    // only the surrounding router host and user confirmation answers are isolated.
    const vaSnapshot = () => JSON.stringify([snapshot(), database.initDatabase().prepare("SELECT * FROM sigeko_pre_notifications ORDER BY id").all()]);
    const vaRecord = id => database.initDatabase().prepare("SELECT * FROM sigeko_pre_notifications WHERE project_id=?").get(id);
    const vaFill = values => evaluate(`s24.vaFill(${JSON.stringify(values)})`);
    const vaValue = field => evaluate(`s24.screen.inputs[${JSON.stringify(field)}].value`);
    const vaReady = () => waitFor("s24.screen.inputs?.duration_months && s24.screen.ready && !s24.screen.loading && !s24.screen.busy");
    const vaClick = async key => {
      const rect = await evaluate(`s24.vaBounds(${JSON.stringify(key)})`);
      const viewport = await evaluate("({width:innerWidth,height:innerHeight})");
      assert.ok(rect.width > 0 && rect.height > 0 && rect.x >= 0 && rect.y >= 0 &&
        rect.x + rect.width <= viewport.width + 1 && rect.y + rect.height <= viewport.height + 1, JSON.stringify({ key, rect, viewport }));
      const point = { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
      win.webContents.sendInputEvent({ type: "mouseDown", button: "left", clickCount: 1, ...point });
      win.webContents.sendInputEvent({ type: "mouseUp", button: "left", clickCount: 1, ...point });
      await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
    };
    const vaOpen = async id => {
      await evaluate("s24.confirmWith(true)");
      assert.equal(await evaluate(`s24.openVa(${JSON.stringify(id)})`), true); await vaReady();
    };
    const vaSave = async () => {
      await evaluate("s24.vaElement('status').textContent = ''");
      await vaClick("actions.save");
      try {
        await waitFor("!s24.screen.busy && !s24.screen.isDirty() && s24.vaElement('status').textContent === 'Vorankündigung gespeichert.'");
      } catch (error) {
        const state = await evaluate("({status:s24.vaElement('status').textContent, ready:s24.screen.ready, loading:s24.screen.loading, busy:s24.screen.busy, dirty:s24.screen.isDirty(), saveDisabled:s24.screen.saveButton.disabled, revision:s24.screen.data?.record?.revision, firms:s24.screen.data?.effective?.firms?.length, draft:Object.fromEntries(Object.entries(s24.screen.inputs).map(([key,input])=>[key,input.value]))})");
        error.message += "\nActual Vorankündigung save state: " + JSON.stringify(state);
        throw error;
      }
    };
    // The earlier contact fixtures deliberately have no project-participant use.
    // A firms-list attachment requires an explicitly active project participant.
    database.initDatabase().prepare("INSERT INTO project_firms (id,project_id,name,street,zip,city,use_project_participant,is_active) VALUES ('s52-contractor',?,'S5.2 Nachunternehmer','Gewerkweg 4','12345','Testort',1,1)").run(projects[0].id);
    assert.ok(require("../src/main/domain/firms/FirmDirectoryService").getFirmDirectoryService()
      .listProjectParticipants({ projectId: projects[0].id, includeInactive: false }).some(firm => firm.id === "s52-contractor"));
    repo.updateProject({ id: projects[0].id, patch: { geplanter_baubeginn: null, end_date: "2030-12-31" } });
    await open(projects[0].id); await waitFor("!s24.screen.readinessBusy");
    const beforeVaEntry = vaSnapshot();
    await evaluate("s24.confirmWith(false)"); await click("preNotification");
    await waitFor("s24.confirmations.length === 1");
    assert.equal(await evaluate("!!s24.screen.inputs?.duration_months"), false); assert.equal(vaSnapshot(), beforeVaEntry);
    await evaluate("s24.confirmWith(true)"); await click("preNotification"); await vaReady();
    assert.equal(await evaluate("s24.confirmations.length"), 1);
    assert.match(await evaluate("s24.confirmations[0]"), /fehl|prüf|unvollständig/i);
    assert.deepEqual(await evaluate("s24.pendingVaRead"), { loading: true, ready: false,
      saveDisabled: true, backDisabled: true, saveBackDisabled: true, reloadDisabled: true });
    assert.equal(await evaluate("s24.router.currentView === s24.screen"), true);
    assert.equal(await evaluate("s24.router.currentProjectId"), projects[0].id);
    assert.equal(vaRecord(projects[0].id), undefined);
    assert.equal(await vaValue("planned_start_override"), ""); assert.equal(await vaValue("duration_months"), "");
    assert.equal(await evaluate("s24.screen.saveButton.disabled"), false);
    await vaSave(); assert.equal(vaRecord(projects[0].id).duration_months, null);
    assert.equal(vaRecord(projects[0].id).planned_start_override, null);
    report.checks.push("S5.2: actual module route checks readiness, cancellation preserves the overview and database, confirmation opens the document form with save and back actions disabled while the first actual IPC read is pending; incomplete draft saves without inventing start or duration");

    const centralBeforeVa = snapshot();
    const attachmentData = await evaluate(`window.bbmDb.sigekoGetPreNotification({projectId:${JSON.stringify(projects[0].id)}})`);
    assert.equal(attachmentData.ok, true); assert.ok(attachmentData.data.effective.firms.some(firm => firm.id === "s52-contractor"));
    for (const key of ["p1.value", "p2.value", "p5.planning.value", "p5.execution.value", "authority.value"]) {
      assert.equal(await evaluate(`s24.vaElement(${JSON.stringify(key)}).matches('input,select,textarea')`), false, key);
    }
    await vaFill({ building_type_override: "Umbau – nur in dieser Vorankündigung", planned_start_override: "2028-02-29", duration_months: "17",
      max_workers: "0", employer_count: "2", self_employed_count: "0", firms_mode: "attachment", third_party_mode: "free",
      third_party_name: "Beauftragter Dritter", third_party_street: "Drittweg 8", third_party_zip: "54321", third_party_city: "Drittort",
      third_party_phone: "040777", third_party_email: "dritter@example.invalid" });
    assert.deepEqual(await evaluate("Array.from(s24.screen.inputs.firms_mode.options, option => option.value)"), ["unknown", "attachment"]);
    await vaSave();
    const fullVa = vaRecord(projects[0].id);
    assert.equal(fullVa.duration_months, 17); assert.equal(fullVa.max_workers, 0); assert.equal(fullVa.self_employed_count, 0);
    assert.equal(fullVa.firms_mode, "attachment"); assert.equal(fullVa.third_party_name, "Beauftragter Dritter");
    assert.equal(fullVa.planned_start_override, "2028-02-29"); assert.equal(snapshot(), centralBeforeVa);
    await vaFill({ employer_count: "3" }); await vaClick("actions.saveBack");
    await waitFor("!s24.screen.inputs?.duration_months && !s24.screen.rolesBusy && s24.screen.rolesReady");
    assert.equal(vaRecord(projects[0].id).employer_count, 3);
    await vaOpen(projects[0].id); assert.equal(await vaValue("employer_count"), "3");
    report.checks.push("S5.2: real mouse saves local overrides, explicit whole months, zero counts, a free third party and the two-choice firms mode through production IPC/SQLite; save-and-back reopens persisted values without changing central sources");

    await vaClick("p3.reset"); await vaClick("p6.reset"); await vaFill({ third_party_mode: "none", firms_mode: "unknown" }); await vaSave();
    assert.equal(vaRecord(projects[0].id).building_type_override, null); assert.equal(vaRecord(projects[0].id).planned_start_override, null);
    for (const field of ["name", "street", "zip", "city", "phone", "email"]) assert.equal(vaRecord(projects[0].id)[`third_party_${field}`], null);
    assert.equal(vaRecord(projects[0].id).duration_months, 17);
    repo.updateProject({ id: projects[0].id, patch: { geplanter_baubeginn: "2027-06-15" } });
    await vaOpen(projects[0].id); assert.equal(await vaValue("planned_start_override"), "2027-06-15");
    assert.equal(vaRecord(projects[0].id).planned_start_override, null);
    const firstVa = vaRecord(projects[0].id);
    await vaOpen(projects[1].id); await vaFill({ duration_months: "5", max_workers: "4" }); await vaSave();
    assert.deepEqual(vaRecord(projects[0].id), firstVa);
    database.closeDatabase(); database.initDatabase();
    await vaOpen(projects[0].id); assert.equal(await vaValue("duration_months"), "17");
    assert.equal(await vaValue("planned_start_override"), "2027-06-15");
    assert.equal(vaRecord(projects[1].id).duration_months, 5);
    report.checks.push("S5.2: resetting overrides restores null/inherited project start, third-party none clears only local contact fields, manual duration survives date changes, and two independent projects retain their drafts after SQLite reopen");

    await vaFill({ building_type_override: "Ungespeicherter Entwurf" });
    const beforeDirtyGuard = vaSnapshot();
    for (const action of ["actions.back", "actions.reload"]) {
      await evaluate("s24.confirmWith(false)"); await vaClick(action); await waitFor("s24.confirmations.length === 1");
      assert.equal(await vaValue("building_type_override"), "Ungespeicherter Entwurf"); assert.equal(vaSnapshot(), beforeDirtyGuard);
    }
    await evaluate("s24.confirmWith(true)"); await vaClick("actions.reload"); await vaReady();
    assert.equal(await vaValue("building_type_override"), ""); assert.equal(vaSnapshot(), beforeDirtyGuard);
    await vaFill({ duration_months: "1.5" }); await evaluate("s24.vaElement('status').textContent = ''");
    await vaClick("actions.saveBack"); await waitFor("!s24.screen.busy && !!s24.vaElement('status').textContent");
    assert.equal(await vaValue("duration_months"), "1.5"); assert.equal(vaSnapshot(), beforeDirtyGuard);
    await vaFill({ duration_months: "18" });
    const staleRecord = vaRecord(projects[0].id);
    const concurrent = await evaluate(`window.bbmDb.sigekoSavePreNotification({projectId:${JSON.stringify(projects[0].id)},expectedRevision:${staleRecord.revision},patch:{duration_months:19}})`);
    assert.equal(concurrent.ok, true);
    const beforeConflict = vaSnapshot(); await evaluate("s24.vaElement('status').textContent = ''"); await vaClick("actions.saveBack");
    await waitFor("!s24.screen.busy && /geändert|erneut laden/i.test(s24.vaElement('status').textContent)");
    assert.equal(await vaValue("duration_months"), "18"); assert.equal(vaSnapshot(), beforeConflict);
    await evaluate("s24.confirmWith(true)"); await vaClick("actions.reload"); await vaReady(); assert.equal(await vaValue("duration_months"), "19");
    report.checks.push("S5.2: cancelled back/reload retain dirty inputs; invalid fractional months and a real concurrent revision conflict keep save-and-back on the form without overwriting data, and explicit reload recovers the current revision");

    await vaFill({ third_party_mode: "free", third_party_name: "Beauftragter Dritter für das gesamte Bauvorhaben", third_party_street: "Langer Baustellenweg 123",
      third_party_zip: "54321", third_party_city: "Drittort", third_party_phone: "040777", third_party_email: "dritter@example.invalid" }); await vaSave();
    assert.equal(await evaluate("s24.refs.validateM83ComponentReferences(['bbm.sigeko.preNotification']).ok"), true);
    assert.deepEqual((await evaluate("s24.descriptor()")).activeScopes, ["sigeko.preNotification"]);
    report.preNotificationGeometry = {};
    for (const [size, width, height] of [["wide", 1280, 950], ["narrow", 560, 950], ["low", 560, 480]]) {
      win.setSize(width, height); await waitFor(`innerWidth <= ${width} && innerWidth >= ${width - 80} && innerHeight <= ${height}`);
      await evaluate("s24.vaElement('document.title').scrollIntoView({block:'start'}); new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
      fs.writeFileSync(path.join(output, `sigeko-prenotification-${size}-top.png`), (await win.webContents.capturePage()).toPNG());
      const geometry = await evaluate("s24.vaGeometry()"); report.preNotificationGeometry[size] = geometry;
      for (const field of geometry) assert.ok(field.width > 40 && field.height > 15 && field.inViewportWidth && field.inParent && field.labelAbove, JSON.stringify(field));
      await evaluate("s24.vaElement('signature.signer').scrollIntoView({block:'end'}); new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
      for (const key of ["actions.save", "actions.saveBack", "actions.back", "actions.reload"]) {
        const rect = await evaluate(`(()=>{const {x,y,width,height}=s24.vaElement(${JSON.stringify(key)}).getBoundingClientRect();return {x,y,width,height};})()`);
        const viewport = await evaluate("({width:innerWidth,height:innerHeight})");
        assert.ok(rect.y >= -1 && rect.x >= -1 && rect.x + rect.width <= viewport.width + 1 && rect.y + rect.height <= viewport.height + 1, JSON.stringify({ size, key, rect, viewport }));
      }
      await evaluate("s24.vaElement('signature.signer').scrollIntoView({block:'end'}); new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
      fs.writeFileSync(path.join(output, `sigeko-prenotification-${size}-bottom.png`), (await win.webContents.capturePage()).toPNG());
    }
    const beforeVaEditor = vaSnapshot();
    await evaluate("s24.refs.applyM80State('sigeko.preNotification.p4.contact.name.input', {fontSize:15}, 'textResize')");
    assert.equal(await evaluate("getComputedStyle(s24.vaElement('p4.contact.name.input')).fontSize"), "15px");
    assert.equal(vaSnapshot(), beforeVaEditor);
    report.checks.push("S5.2: all component references and the dedicated editor scope are valid; wide, narrow and low windows keep labelled fields within width and all save/navigation actions reachable after deep scrolling; a real editor style change leaves all ten domain tables unchanged");

    win.setSize(1280, 950); await vaOpen(projects[0].id);
    repo.archiveProject(projects[0].id); const beforeVaArchive = vaSnapshot();
    await vaFill({ duration_months: "20" }); await vaClick("actions.saveBack");
    await waitFor("!s24.screen.busy && /archiv/i.test(s24.vaElement('status').textContent)");
    assert.equal(await vaValue("duration_months"), "20"); assert.equal(vaSnapshot(), beforeVaArchive);
    await vaOpen(projects[0].id); assert.equal(await evaluate("s24.screen.saveButton.disabled && s24.screen.saveBackButton.disabled"), true);
    assert.equal(await evaluate("Object.values(s24.screen.inputs).every(input => input.disabled)"), true);
    repo.unarchiveProject(projects[0].id); await vaOpen(projects[0].id);
    const beforeVaLicense = vaSnapshot(); license = { valid: true, license: { modules: [] } };
    assert.equal(await evaluate(`window.bbmDb.sigekoGetPreNotification({projectId:${JSON.stringify(projects[0].id)}}).then(()=>false,e=>String(e).includes('MODULE_NOT_ACTIVE'))`), true);
    assert.equal(await evaluate(`window.bbmDb.sigekoSavePreNotification({projectId:${JSON.stringify(projects[0].id)},expectedRevision:${vaRecord(projects[0].id).revision},patch:{duration_months:99}}).then(()=>false,e=>String(e).includes('MODULE_NOT_ACTIVE'))`), true);
    assert.equal(vaSnapshot(), beforeVaLicense); license = { valid: true, license: { modules: ["sigeko"] } };
    await open(projects[0].id);
    report.checks.push("S5.2: an already-open archived project rejects save-and-back atomically and preserves its dirty draft; reopened form is read-only, while production IPC enforces current module licensing for draft reads and writes");

    // Native test-window controls: fit the usable monitor, and X requests review only.
    const fitToWorkArea = () => {
      const area = screen.getDisplayMatching(win.getBounds()).workArea;
      const width = Math.min(1280, area.width), height = Math.min(950, area.height);
      win.setBounds({ x: area.x + Math.floor((area.width - width) / 2), y: area.y + Math.floor((area.height - height) / 2), width, height });
      return area;
    };
    let finishReview = null;
    const onReviewClose = event => { event.preventDefault(); finishReview?.(); };
    const reviewCloseRequested = () => new Promise(resolve => { finishReview = resolve; win.on("close", onReviewClose); });
    const stopReviewClose = () => { win.removeListener("close", onReviewClose); finishReview = null; };
    const area = fitToWorkArea();
    const bounds = win.getBounds();
    assert.ok(bounds.x >= area.x && bounds.y >= area.y && bounds.x + bounds.width <= area.x + area.width && bounds.y + bounds.height <= area.y + area.height, JSON.stringify({ bounds, area }));
    const beforeClose = snapshot(), closeProbe = reviewCloseRequested();
    win.close(); await closeProbe;
    assert.equal(win.isDestroyed(), false); assert.equal(snapshot(), beforeClose); assert.equal(report.manualConfirmed, false);
    stopReviewClose();
    report.checks.push("test window fits monitor work area; native X requests review without closing, saving or confirming PASS");
    report.manualWindow = { bounds, workArea: area };
    if (process.argv.includes("--manual")) {
      fitToWorkArea(); await open(projects[0].id); await evaluate("s24.element('profile.title').scrollIntoView({block:'start'})");
      await dialog.showMessageBox(win, { type: "info", title: "BBM S2.4 – manuelle Grunddatenabnahme", message: "Bitte Profil und beide Projektrollen selbst eingeben und jeweils speichern.", detail: "1. Eigenes SiGeKo-Profil: Name = Manueller SiGeKo; Profil speichern.\n2. Planung: Freie Angabe wählen, Name = Manuelle Planung.\n3. Ausführung wie Planung ausschalten; Ausführung = Eigenes SiGeKo-Profil.\n4. Nach unten scrollen: Unter Planung/Ausführung auf Projektrollen speichern klicken.\nDanach öffnet sich das Projekt automatisch erneut. Alle Daten liegen in einem isolierten Testprofil." });
      await waitFor(`(async()=>{const p=await bbmDb.sigekoGetCoordinatorProfile();const r=await bbmDb.sigekoGetProjectData({projectId:${JSON.stringify(projects[0].id)}});return p.data?.name==='Manueller SiGeKo' && r.data?.planning?.values?.name==='Manuelle Planung' && r.data?.execution?.assignment?.source==='module' && r.data?.execution?.inheritedFromPlanning===false;})()`, 600000);
      database.closeDatabase(); database.initDatabase(); await open(projects[0].id);
      await evaluate("s24.element('profile.title').scrollIntoView({block:'start'})");
      const reviewFinished = reviewCloseRequested();
      await dialog.showMessageBox(win, { type: "info", title: "BBM S2.4 – gespeichert und erneut geöffnet", message: "Bitte prüfen: Eigenes Profil Manueller SiGeKo; Planung Manuelle Planung; Ausführung Eigenes SiGeKo-Profil.", detail: "Nach OK können Sie das Formular ansehen und nach unten scrollen. Wenn Sie fertig sind, schließen Sie dieses Testfenster oben rechts mit X. Dann erscheint die Frage, ob die Abnahme bestanden ist. Erneutes Speichern ist nicht erforderlich." });
      await reviewFinished;
      stopReviewClose();
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
