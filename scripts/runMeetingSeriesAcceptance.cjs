#!/usr/bin/env node
"use strict";
// Test only. All writes are confined to a marker-validated temporary profile.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { pathToFileURL } = require("node:url");
const { spawn, spawnSync } = require("node:child_process");
const { createAcceptanceProfile, createSanitizedEnvironment, removeAcceptanceProfile } = require("./runIsolatedUiEditorAcceptance.cjs");
const { ACCEPTANCE_SWITCH, configureUiEditorAcceptanceProfile, isPathInside } = require("../src/main/startup/uiEditorAcceptanceProfile");
const ROOT = path.resolve(__dirname, "..");
const SERIES = ["construction", "owner", "planning"];
const LABELS = { construction: "Baubesprech", owner: "Bauherrenbesprech", planning: "Planungsbesprech" };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const json = value => JSON.stringify(value);

function productionIndexStyles() {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer/index.html"), "utf8");
  const blocks = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]);
  assert.ok(blocks.length > 0, "Actual production index styles are required");
  return blocks.join("\n");
}

async function inspectPdf(file) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-");
  const { getDocument } = await import(pathToFileURL(require.resolve("pdfjs-dist/legacy/build/pdf.mjs")).href);
  const document = await getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, disableFontFace: true }).promise;
  try {
    const text = [];
    const positions = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      text.push(content.items.map(item => item.str || "").join(" "));
      if (pageNumber === 1) {
        for (const item of content.items) if (String(item.str || "").trim() && Array.isArray(item.transform)) {
          positions.push({ x: Number(item.transform[4]), y: Number(item.transform[5]) });
        }
      }
    }
    return { pageCount: document.numPages, text: text.join(" ").replace(/\s+/g, " ").trim(),
      textBounds: positions.length ? { minX: Math.min(...positions.map(item => item.x)), maxY: Math.max(...positions.map(item => item.y)) } : null };
  } finally { await document.destroy(); }
}

async function worker() {
  const { app, BrowserWindow, ipcMain } = require("electron");
  let database, win, editor;
  const manual = process.argv.includes("--manual");
  const report = { package: "project-meeting-series", ok: false, manualConfirmed: false,
    nativeComputerUse: false, inputMethod: "Electron BrowserWindow.webContents.sendInputEvent",
    checks: [], screenshots: [], rendererErrors: [], limitations: [
      "Technical Chromium/source-build acceptance; no native Computer Use or customer-license signature verification.",
      "No Outlook draft or email is sent. Mail payload and stored-PDF lookup are checked.",
      "Golden pagination contracts and historical migration fixtures run in their dedicated suites.",
    ] };
  const output = path.resolve(process.env.BBM_MEETING_SERIES_OUTPUT || "");
  assert.ok(output && process.env.BBM_MEETING_SERIES_OUTPUT, "Output directory required");
  fs.mkdirSync(output, { recursive: true });
  const resultFile = path.join(output, "meeting-series-result.json");
  const checkpoint = () => fs.writeFileSync(resultFile, JSON.stringify(report, null, 2), "utf8");
  try {
    app.setAppPath(ROOT);
    const profile = configureUiEditorAcceptanceProfile({ electronApp: app });
    assert.equal(profile.enabled, true);
    report.isolatedRoot = profile.rootPath;
    report.databasePath = path.join(profile.userDataPath, "app.db");
    assert.equal(isPathInside(profile.rootPath, report.databasePath), true);
    // The real print entry takes baseDir from its caller; redirect fallbacks too.
    for (const hostPath of ["downloads", "temp"]) {
      const isolatedHostPath = path.join(profile.rootPath, "host-" + hostPath);
      fs.mkdirSync(isolatedHostPath, { recursive: true });
      app.setPath(hostPath, isolatedHostPath);
    }
    await app.whenReady();
    // Use the unmodified source-development provider and normal license service.
    const licenseService = require("../src/main/licensing/licenseService");
    const status = licenseService.getStatus({ fresh: true });
    assert.equal(status.valid, true, json(status));
    assert.equal(status.developmentLicense, true);
    assert.ok(status.license.modules.includes("protokoll"));
    report.license = { source: status.licenseSource, developmentLicense: true,
      provider: profile.marker.developmentLicenseProvider, customerSignatureVerified: false };
    const protocolStatus = { ...status, license: { ...status.license, modules: ["protokoll"] } };
    database = require("../src/main/db/database");
    database.configureDatabaseMigrations(protocolStatus, { allowLegacyImport: false });
    database.initDatabase();
    const settings = require("../src/main/db/appSettingsRepo");
    settings.appSettingsSetMany({
      "pdf.protocolsDir": path.join(profile.rootPath, "Ablage"),
      "pdf.protocolTitle": "Baubesprechung",
      email_subject: "{projectNumber} | {protocolTitle} #{meetingIndex}",
      email_body: "Isolierte technische Abnahme.",
    });
    require("../src/main/ipc/projectsIpc").registerProjectsIpc();
    require("../src/main/core/projectFirmsCore").registerCoreProjectFirmsIpc();
    require("../src/main/ipc/firmDirectoryIpc").registerFirmDirectoryIpc();
    require("../src/main/ipc/participantsIpc").registerProjectParticipantsIpc();
    require("../src/main/ipc/settingsIpc").registerSettingsIpc();
    require("../src/main/ipc/licenseIpc").registerLicenseIpc();
    require("../src/main/ipc/tableLayoutsIpc").registerTableLayoutsIpc();
    require("../src/main/ipc/projectTransferIpc").registerProjectTransferIpc();
    require("../src/main/ipc/printIpc").registerPrintIpc();
    require("../src/main/moduleIpcRegistry").registerActiveModuleIpcs({
      licenseStatus: protocolStatus, getLicenseStatus: () => protocolStatus, ipcMain,
      registrars: require("../src/main/moduleIpcRegistrars"),
    });
    ipcMain.handle("app:isPackaged", () => ({ ok: true, isPackaged: app.isPackaged }));
    ipcMain.handle("app:isWindows", () => ({ ok: true, isWindows: process.platform === "win32" }));
    ipcMain.handle("app:getVersion", () => ({ ok: true, version: app.getVersion() }));
    ipcMain.handle("app:getBuildChannel", () => ({ ok: true, channel: "DEV" }));
    ipcMain.handle("app:getBundledIconPath", () => ({ ok: true, path: path.join(ROOT, "build/bbm-icon.ico") }));
    ipcMain.handle("app:get-customer-setup", () => ({ ok: true, setup: require("../src/main/licensing/licenseStorage").loadCustomerSetup() }));
    ipcMain.handle("dev:audioSuggestionsEnabled", () => ({ ok: true,
      enabled: !!require("../src/main/licensing/featureGuard").isDevAudioSuggestionsEnabled() }));
    win = new BrowserWindow({ width: 1400, height: 950, show: true,
      title: "BBM – isolierte Besprechungsreihen-Abnahme",
      webPreferences: { preload: path.join(ROOT, "src/main/preload.js"),
        contextIsolation: true, nodeIntegration: false, sandbox: false, backgroundThrottling: false } });
    win.webContents.on("console-message", (_event, level, message) => {
      if (level >= 3 && !message.includes("Electron Security Warning")) report.rendererErrors.push(message);
    });
    editor = require("../src/main/ipc/uiEditorIpc").registerUiEditorIpc({ app, ipcMain, getMainWindow: () => win });
    const evaluate = code => win.webContents.executeJavaScript(code, true);
    const waitFor = async (code, timeout = 15000) => {
      const deadline = Date.now() + timeout;
      while (!await evaluate(code)) { if (Date.now() > deadline) throw new Error("TIMEOUT: " + code); await sleep(50); }
    };
    const invoke = (method, payload) => evaluate("window." + method + "(" + json(payload) + ")");
    const clickBox = async box => {
      assert.ok(box.width > 0 && box.height > 0 && !box.disabled, json(box));
      const point = { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
      const viewport = await evaluate("({width:innerWidth,height:innerHeight})");
      assert.ok(point.x >= 0 && point.x < viewport.width && point.y >= 0 && point.y < viewport.height, json({ point, viewport }));
      report.lastClick = { point, hit: await evaluate("(function(){const e=document.elementFromPoint(" +
        point.x + "," + point.y + ");return e?{tag:e.tagName,id:e.id,editorId:e.getAttribute('data-ui-inspector-id'),text:e.textContent.slice(0,120)}:null})()") };
      win.focus(); win.webContents.focus();
      await sleep(50);
      win.webContents.sendInputEvent({ type: "mouseMove", ...point });
      win.webContents.sendInputEvent({ type: "mouseDown", button: "left", clickCount: 1, ...point });
      win.webContents.sendInputEvent({ type: "mouseUp", button: "left", clickCount: 1, ...point });
      await sleep(100);
    };
    const click = async key => clickBox(await evaluate("msAcceptance.bounds(" + json(key) + ")"));
    const cardClick = async (id, action, key = "") => clickBox(await evaluate("msAcceptance.cardBounds(" + [id, action, key].map(json).join(",") + ")"));
    const fill = (key, value) => evaluate("msAcceptance.fill(" + json(key) + "," + json(value) + ")");
    const form = id => evaluate("msAcceptance.formPage(" + json(id || null) + ")");
    const projects = () => evaluate("msAcceptance.projects()");
    const readProject = async id => {
      const response = await invoke("bbmDb.projectsList");
      assert.equal(response.ok, true, json(response));
      return response.list.find(project => project.id === id);
    };
    const save = async () => { await click("save"); await waitFor("!msAcceptance.currentForm() || !msAcceptance.currentForm().busy"); };
    const checkRefs = async (ids, name) => {
      const state = await evaluate("msAcceptance.contractState(" + json(ids) + ")");
      assert.equal(state.references.ok, true, name + ": " + json(state.references));
      report.checks.push(name);
      return state;
    };
    const screenshot = async name => {
      const file = path.join(output, name + ".png");
      fs.writeFileSync(file, (await win.webContents.capturePage()).toPNG());
      report.screenshots.push(file);
    };
    await win.loadFile(path.join(__dirname, "tests/meetingSeriesAcceptance.html"));
    await waitFor("!!window.msAcceptance");
    await evaluate("msAcceptance.boot(" + json(productionIndexStyles()) + ")");
    assert.equal(await evaluate("!!document.querySelector('style[data-meeting-series-production-index-styles]')"), true);
    report.checks.push("Production Router/CoreShell and exact app-entry styles mounted with productive preload/IPC.");

    await form();
    const initial = await evaluate("msAcceptance.formState()");
    assert.deepEqual(initial.series, { construction: true, owner: false, planning: false });
    assert.equal(initial.builderDefault, "nicht angegeben");
    assert.equal(initial.builderRefresh, "Firmenauswahl aktualisieren");
    await fill("name", "Isoliertes Drei-Reihen-Projekt");
    await fill("street", "Abnahmeweg 12"); await fill("zip", "12345"); await fill("city", "Abnahmeort");
    await click("series.owner"); await click("series.planning");
    report.afterInitialCheckboxClicks = await evaluate("msAcceptance.formState()");
    assert.deepEqual(report.afterInitialCheckboxClicks.series, { construction: true, owner: true, planning: true }, json(report.lastClick));
    await checkRefs(["bbm.projektverwaltung.meetingSeries", "bbm.projektverwaltung.builder"], "Actual new-project checkbox and builder mounted refs valid.");
    await save();
    await waitFor("msAcceptance.router.currentView?.projects");
    const listed = await invoke("bbmDb.projectsList");
    const created = listed.list.find(project => project.name === "Isoliertes Drei-Reihen-Projekt");
    assert.ok(created, "Actual mouse save created project without a builder");
    const projectId = created.id;
    assert.equal(created.meeting_series_mask, 7);
    assert.equal(created.bauherr_firm_id, null);
    await projects();
    report.cardEntryContext = { license: await invoke("bbmDb.licenseGetStatus"),
      modules: await evaluate("msAcceptance.router._getProjectWorkspaceModules()"),
      buttons: await evaluate("msAcceptance.cardButtons(" + json(projectId) + ")") };
    assert.equal(await evaluate("document.querySelectorAll('[data-project-card=\"true\"]').length"), 1);
    assert.deepEqual((await evaluate("msAcceptance.cardButtons(" + json(projectId) + ")")).filter(button => !button.historyOnly).map(button => button.seriesKey).sort(), [...SERIES].sort());
    const initialSeriesPresentation = await evaluate(`(function(){return [...msAcceptance.card(${json(projectId)}).querySelectorAll('button[data-series-key]')].map(button=>{const style=getComputedStyle(button);return{key:button.dataset.seriesKey,selected:button.dataset.projectSeriesSelected,fontSize:style.fontSize,border:style.borderTopWidth,background:style.backgroundColor,padding:[style.paddingTop,style.paddingRight,style.paddingBottom,style.paddingLeft],tabIndex:button.tabIndex}})})()`);
    assert.ok(initialSeriesPresentation.every(button => button.selected === "false"), json(initialSeriesPresentation));
    assert.ok(initialSeriesPresentation.every(button => button.fontSize === "12px" && button.border === "0px" && button.background === "rgba(0, 0, 0, 0)" && button.padding.every(value => value === "0px") && button.tabIndex === 0), json(initialSeriesPresentation));
    await checkRefs(["bbm.projektverwaltung.meetingSeriesEntry"], "Three direct series card buttons have valid mounted multi-refs.");
    report.checks.push("New project defaults and actual mouse save without builder; one card immediately has all three enabled entries.");

    const meetings = {};
    for (const key of SERIES) {
      const result = await invoke("bbmDb.meetingsCreate", { projectId, seriesKey: key, title: "Abnahme " + key });
      assert.equal(result.ok, true, json(result));
      assert.equal(result.meeting.series_key, key);
      assert.equal(result.meeting.meeting_index, 1);
      meetings[key] = result.meeting;
      const title = await invoke("bbmDb.topsCreate", { projectId, meetingId: result.meeting.id, level: 1, title: "Titel " + key });
      assert.equal(title.ok, true, json(title)); assert.equal(title.top.number, 1);
      const child = await invoke("bbmDb.topsCreate", { projectId, meetingId: result.meeting.id, parentTopId: title.top.id, level: 2, title: "Unterpunkt " + key });
      assert.equal(child.ok, true, json(child)); assert.equal(child.top.number, 1);
      const participants = await invoke("bbmDb.meetingParticipantsList", { meetingId: result.meeting.id });
      assert.equal(participants.ok, true, json(participants)); assert.equal(participants.items.length, 0);
    }
    const all = await invoke("bbmDb.meetingsListByProject", projectId);
    assert.equal(all.ok, true); assert.equal(all.list.length, 3);
    assert.equal(all.list.filter(meeting => Number(meeting.is_closed) === 0).length, 3);
    for (const key of SERIES) {
      const specific = await invoke("bbmDb.meetingsListByProject", { projectId, seriesKey: key });
      assert.equal(specific.ok, true); assert.equal(specific.list.length, 1);
      assert.equal(specific.list[0].id, meetings[key].id);
      await projects();
      if (key === "construction") {
        assert.equal(await evaluate(`(function(){const button=[...msAcceptance.card(${json(projectId)}).querySelectorAll('button[data-series-key]')].find(item=>item.dataset.seriesKey==='construction');button?.focus();return document.activeElement===button})()`), true);
        win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Space" });
        win.webContents.sendInputEvent({ type: "keyUp", keyCode: "Space" });
      } else {
        await cardClick(projectId, "series", key);
      }
      await waitFor("msAcceptance.router.currentMeetingId === " + json(meetings[key].id) + " && !!msAcceptance.router.currentView?.store");
      assert.equal(await evaluate("msAcceptance.router.currentView.meetingId"), meetings[key].id);
    }
    report.checks.push("Three actual IPC series each have open Nr. 1, own TOP 1/1.1 and empty initial participants; direct card clicks open their actual TopsScreen.");
    const editableTopBox = await evaluate(`(function(){const e=document.querySelector('.bbm-tops-list-row[data-top-level="2"]');if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,disabled:false}})()`);
    await clickBox(editableTopBox);
    await waitFor("!!document.querySelector('.bbm-iso-week-value') && !document.querySelector('.status-ampel-date')?.disabled");
    await evaluate(`(function(){const input=document.querySelector('.status-ampel-date'); if(!input)return false; input.value='2021-01-01'; input.dispatchEvent(new Event('input',{bubbles:true})); return true})()`);
    await waitFor("document.querySelector('.bbm-iso-week-value')?.textContent === 'KW 53'");
    await waitFor("!!document.querySelector('.status-ampel-date') && !document.querySelector('.status-ampel-date').disabled");
    const dueDateBox = await evaluate(`(function(){const e=document.querySelector('.status-ampel-date');if(!e||e.disabled)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,disabled:false}})()`);
    await clickBox(dueDateBox);
    await waitFor("[...document.querySelectorAll('.bbm-iso-week-popover')].some(e=>e.style.display === 'block')");
    const weekEvidence = await evaluate(`(function(){
      const p=[...document.querySelectorAll('.bbm-iso-week-popover')].find(e=>e.style.display==='block');
      const indicator=document.querySelector('.bbm-iso-week-value');
      const statusLabel=[...document.querySelectorAll('.status-ampel-label')].find(e=>e.textContent.trim()==='Status');
      const field=document.querySelector('.bbm-tops-meta-due-with-ampel');
      const traffic=field?.querySelector('.status-ampel-traffic');
      const style=getComputedStyle(indicator); const referenceStyle=getComputedStyle(statusLabel);
      const bounds=element=>{const r=element?.getBoundingClientRect();return r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null};
      return{indicator:indicator?.textContent,tag:indicator?.tagName,role:indicator?.getAttribute('role'),tabIndex:indicator?.tabIndex,
        style:{fontSize:style.fontSize,borderTopWidth:style.borderTopWidth,backgroundColor:style.backgroundColor,paddingTop:style.paddingTop,paddingRight:style.paddingRight,paddingBottom:style.paddingBottom,paddingLeft:style.paddingLeft},
        statusLabelFontSize:referenceStyle.fontSize,fieldBounds:bounds(field),trafficBounds:bounds(traffic),days:p?.querySelectorAll('[data-date]').length,weeks:[...p.querySelectorAll('[title^="ISO-Kalenderwoche"]')].map(e=>e.textContent),text:p?.textContent};
    })()`);
    assert.equal(weekEvidence.indicator, "KW 53");
    assert.equal(weekEvidence.tag, "SPAN");
    assert.equal(weekEvidence.role, null);
    assert.equal(weekEvidence.tabIndex, -1);
    assert.equal(weekEvidence.style.fontSize, weekEvidence.statusLabelFontSize);
    assert.equal(weekEvidence.style.borderTopWidth, "0px");
    assert.equal(weekEvidence.style.backgroundColor, "rgba(0, 0, 0, 0)");
    assert.deepEqual([weekEvidence.style.paddingTop, weekEvidence.style.paddingRight, weekEvidence.style.paddingBottom, weekEvidence.style.paddingLeft], ["0px", "0px", "0px", "0px"]);
    assert.ok(weekEvidence.trafficBounds.right <= weekEvidence.fieldBounds.right + 1, json(weekEvidence));
    assert.equal(weekEvidence.days, 42);
    assert.equal(weekEvidence.weeks[0], "53");
    assert.match(weekEvidence.text, /KWMoDiMiDoFrSaSo/);
    await screenshot("protocol-iso-week-calendar");
    win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Escape" });
    win.webContents.sendInputEvent({ type: "keyUp", keyCode: "Escape" });
    await waitFor("![...document.querySelectorAll('.bbm-iso-week-popover')].some(e=>e.style.display === 'block')");
    report.isoWeekEvidence = weekEvidence;
    report.checks.push("Actual TOP date control opens a Monday-first 42-day calendar with ISO week 53 at the 2020/2021 boundary and remains keyboard closable.");
    const poolDb = database.initDatabase();
    poolDb.prepare("INSERT INTO firms (id,name,use_project_participant) VALUES ('ms-pool-global','Globale Poolfirma',1)").run();
    poolDb.prepare("INSERT INTO persons (id,firm_id,name,email) VALUES ('ms-pool-global-person','ms-pool-global','Globaler Poolkontakt','global@example.invalid')").run();
    poolDb.prepare("INSERT INTO project_global_firms (project_id,firm_id,is_active) VALUES (?,'ms-pool-global',1)").run(projectId);
    poolDb.prepare("INSERT INTO project_firms (id,project_id,name,use_project_participant) VALUES ('ms-pool-local',?,'Lokale Poolfirma',1)").run(projectId);
    poolDb.prepare("INSERT INTO project_persons (id,project_firm_id,name,email) VALUES ('ms-pool-local-person','ms-pool-local','Lokaler Poolkontakt','local@example.invalid')").run();
    const candidates = await invoke("bbmDb.projectCandidatesSet", { projectId,
      items: [{ kind: "global_person", personId: "ms-pool-global-person" }, { kind: "project_person", personId: "ms-pool-local-person" }] });
    assert.equal(candidates.ok, true, json(candidates));
    const pool = await invoke("bbmDb.projectParticipantsPool", { projectId });
    assert.equal(pool.ok, true, json(pool)); assert.equal(pool.items.length, 2);
    const expectedPoolKeys = ["global_person::ms-pool-global-person", "project_person::ms-pool-local-person"];
    report.participantPoolEvidence = [];
    for (const key of SERIES) {
      const evidence = await evaluate("msAcceptance.participantEvidence(" + json(projectId) + "," + json(meetings[key].id) + ")");
      assert.equal(evidence.meetingId, meetings[key].id);
      assert.deepEqual(evidence.pool.map(person => person.kind + "::" + person.personId).sort(), expectedPoolKeys);
      assert.match(evidence.visibleText, /Globaler Poolkontakt/); assert.match(evidence.visibleText, /Lokaler Poolkontakt/);
      report.participantPoolEvidence.push({ seriesKey: key, meetingId: evidence.meetingId, pool: evidence.pool });
      await clickBox(await evaluate("msAcceptance.participantCancelBounds()"));
      await waitFor("!msAcceptance.router._participantsModals.isOpen");
    }
    report.checks.push("Actual participant dialogs for all three protocols offer the same global/project contacts; cancel clicks leave initial participants empty.");

    // The actual existing edit action opens ProjectFormScreen's production modal.
    await projects(); await cardClick(projectId, "edit");
    await waitFor("!!msAcceptance.projectsScreen?._projectFormModal?.meetingSeriesField && msAcceptance.projectsScreen._projectFormModal.builderField.ready");
    await click("series.owner"); await save();
    await waitFor("!msAcceptance.projectsScreen._projectFormModal");
    assert.equal((await readProject(projectId)).meeting_series_mask, 5);
    const disabledButtons = await evaluate("msAcceptance.cardButtons(" + json(projectId) + ")");
    assert.equal(disabledButtons.some(button => button.seriesKey === "owner" && !button.historyOnly), false);
    assert.equal(disabledButtons.some(button => button.historyOnly), false);
    const dbBeforeHistory = json(database.initDatabase().prepare("SELECT * FROM meetings ORDER BY id").all());
    await cardClick(projectId, "edit");
    await waitFor("!!msAcceptance.currentForm()?.meetingSeriesField.historyButtons.get('owner')");
    await click("history.owner");
    await waitFor("msAcceptance.router.currentProjectId === " + json(projectId) +
      " && msAcceptance.router.currentSeriesKey === 'owner' && msAcceptance.router.currentView?.historyOnly === true");
    assert.equal(await evaluate("!msAcceptance.router.currentView.btnCreateProtocol?.getClientRects().length"), true);
    assert.equal(json(database.initDatabase().prepare("SELECT * FROM meetings ORDER BY id").all()), dbBeforeHistory);
    for (let clickIndex = 0; clickIndex < 2; clickIndex++) {
      await clickBox(await evaluate("msAcceptance.historyRowBounds(" + json(meetings.owner.id) + ")"));
    }
    await waitFor("msAcceptance.router.currentMeetingId === " + json(meetings.owner.id) +
      " && msAcceptance.router.currentView?.store?.getState().isReadOnly === true");
    assert.equal(await evaluate("msAcceptance.router.currentView.header.btnEndMeeting.disabled"), true);
    assert.equal(await evaluate("msAcceptance.router.currentView.quicklane.root.querySelector('[data-ui-editor-id=\"protokoll.topsScreen.quicklane.action.mail\"]').disabled"), true);
    assert.equal(json(database.initDatabase().prepare("SELECT * FROM meetings ORDER BY id").all()), dbBeforeHistory);
    const historyParticipantEvidence = await evaluate("msAcceptance.participantEvidence(" + json(projectId) + "," + json(meetings.owner.id) + ")");
    assert.equal(historyParticipantEvidence.meetingId, meetings.owner.id);
    assert.equal(await evaluate("msAcceptance.router.currentMeetingId"), meetings.owner.id);
    assert.equal(await evaluate("msAcceptance.router.currentSeriesKey"), "owner");
    await clickBox(await evaluate("msAcceptance.participantCancelBounds()"));
    await waitFor("!msAcceptance.router._participantsModals.isOpen");
    await projects(); await cardClick(projectId, "edit");
    await waitFor("!!msAcceptance.projectsScreen?._projectFormModal?.meetingSeriesField && msAcceptance.projectsScreen._projectFormModal.builderField.ready");
    await click("series.owner"); await save();
    await waitFor("!msAcceptance.projectsScreen._projectFormModal");
    assert.equal((await readProject(projectId)).meeting_series_mask, 7);
    await cardClick(projectId, "series", "owner");
    await waitFor("msAcceptance.router.currentMeetingId === " + json(meetings.owner.id));
    report.checks.push("Actual modal edit saves disabling/re-enabling; disabled history access preserves all meetings and reactivation opens the same protocol.");

    // A real stored reference is selected, preserved by an unrelated save and cleared.
    database.initDatabase().prepare("INSERT INTO firms (id,name,street,zip,city) VALUES ('ms-builder','Abnahme Bauherr','Kontaktweg 2','12345','Testort')").run();
    await form(projectId);
    await fill("builder", json(["global_firm", "ms-builder"])); await save();
    assert.equal((await readProject(projectId)).bauherr_firm_id, "ms-builder");
    await form(projectId); await fill("name", "Isoliertes Drei-Reihen-Projekt"); await save();
    assert.equal((await readProject(projectId)).bauherr_firm_id, "ms-builder");
    await form(projectId); await fill("builder", ""); await save();
    assert.equal((await readProject(projectId)).bauherr_firm_id, null);
    report.checks.push("Production builder selection persists, unrelated edit retains it, explicit empty selection clears it.");

    const domainSnapshot = () => json(["projects", "meetings", "tops", "meeting_tops"].map(table =>
      [table, database.initDatabase().prepare("SELECT * FROM " + table + " ORDER BY rowid").all()]));
    await form(projectId);
    const beforeLayout = domainSnapshot();
    const checkboxLayout = await evaluate("msAcceptance.refs.applyM80State('projektverwaltung.meetingSeries.owner.label',{fontSize:15},'textResize')");
    assert.equal(checkboxLayout.fontSize, 15, "Actual checkbox label layout readback");
    assert.equal(domainSnapshot(), beforeLayout);
    await checkRefs(["bbm.projektverwaltung.meetingSeries"], "Checkbox layout change leaves actual domain tables unchanged.");
    await projects();
    await checkRefs(["bbm.projektverwaltung.meetingSeriesEntry"], "Card refs remain valid after repeated actual screen/modal reopen.");
    const beforeEntryLayout = domainSnapshot();
    const entryLayout = await evaluate("msAcceptance.refs.applyM80State('projektverwaltung.meetingSeriesEntry.owner',{fontSize:14},'textResize')");
    assert.equal(entryLayout.fontSize, 14, "Actual repeated series entry layout readback");
    assert.equal(domainSnapshot(), beforeEntryLayout);
    report.layoutReadbacks = { checkboxLabel: checkboxLayout, repeatedEntry: entryLayout };
    report.windowGeometry = [];

    for (const [name, width, height] of [["wide", 1400, 950], ["narrow", 760, 800], ["low", 760, 360]]) {
      win.setSize(width, height); await sleep(150); await form(projectId);
      const geometry = await evaluate("msAcceptance.geometry()");
      report.windowGeometry.push({ name, width, height, form: geometry });
      for (const entry of geometry) {
        assert.equal(entry.visible, true, name + ": " + json(entry));
        assert.equal(entry.withinWidth, true, name + ": " + json(entry));
        assert.equal(entry.reachableVertically, true, name + ": " + json(entry));
      }
      await evaluate("msAcceptance.bounds('series.owner')");
      await screenshot("meeting-series-form-" + name);
      await projects();
      const cardGeometry = await evaluate("msAcceptance.geometry()");
      report.windowGeometry.at(-1).cards = cardGeometry;
      for (const entry of cardGeometry) assert.equal(entry.withinWidth, true, name + ": " + json(entry));
      await evaluate("msAcceptance.cardBounds(" + [projectId, "series", "owner"].map(json).join(",") + ")");
      await screenshot("meeting-series-cards-" + name);
      report.checks.push("Real " + width + "x" + height + " window: form fields/save reachable by scrolling; three card buttons within viewport width.");
    }
    win.setSize(1400, 950);
    const beforeRestart = domainSnapshot();
    database.closeDatabase(); database.initDatabase();
    assert.equal(domainSnapshot(), beforeRestart);
    await projects();
    assert.equal((await readProject(projectId)).meeting_series_mask, 7);
    assert.equal(database.initDatabase().prepare("SELECT COUNT(*) n FROM meetings WHERE is_closed=0").get().n, 3);
    report.checks.push("Actual SQLite close/reopen preserves masks, builder clear, TOPs and all three simultaneous open protocols.");

    const baselinePreview = await invoke("bbmPrint.printPdf", { mode: "preview", projectId, meetingId: meetings.planning.id,
      silent: true, baseDir: path.join(profile.rootPath, "Ablage") });
    assert.equal(baselinePreview.ok, true, json(baselinePreview));
    const baselineInspection = await inspectPdf(baselinePreview.filePath);
    const savedMargins = await invoke("bbmDb.protocolPdfSetPageMargins", {
      marginTop: 15, marginRight: 18, marginBottom: 8, marginLeft: 18,
    });
    assert.equal(savedMargins.ok, true, json(savedMargins));
    database.closeDatabase();
    database.initDatabase();
    const reloadedMargins = await invoke("bbmDb.protocolPdfGetPageMargins");
    assert.deepEqual(reloadedMargins.margins, { marginTop: 15, marginRight: 18, marginBottom: 8, marginLeft: 18 });
    assert.equal(reloadedMargins.source, "pdf-profile");
    const customPreview = await invoke("bbmPrint.printPdf", { mode: "preview", projectId, meetingId: meetings.planning.id,
      silent: true, baseDir: path.join(profile.rootPath, "Ablage") });
    assert.equal(customPreview.ok, true, json(customPreview));
    const customInspection = await inspectPdf(customPreview.filePath);
    assert.ok(customInspection.textBounds.maxY < baselineInspection.textBounds.maxY - 10,
      json({ baseline: baselineInspection.textBounds, custom: customInspection.textBounds }));
    assert.equal(customInspection.pageCount, baselineInspection.pageCount);
    report.pageMarginEvidence = { requested: reloadedMargins.margins, baseline: baselineInspection.textBounds,
      custom: customInspection.textBounds, baselinePages: baselineInspection.pageCount, customPages: customInspection.pageCount };
    report.checks.push("Existing PDF profile persists four customer page margins across SQLite close/reopen; actual preview output moves down while page count and productive renderer stay stable.");

    const pdfs = {};
    report.pdfArtifacts = [];
    for (const key of SERIES) {
      const pdf = key === "planning"
        ? await evaluate("msAcceptance.openProtocolPreview(" + json(projectId) + "," + json(meetings[key].id) + ")")
        : await invoke("bbmPrint.printPdf", { mode: "protocol", projectId, meetingId: meetings[key].id, silent: true,
          baseDir: path.join(profile.rootPath, "Ablage") });
      assert.equal(pdf.ok, true, json(pdf));
      assert.equal(isPathInside(profile.rootPath, pdf.filePath), true, "PDF path must remain isolated");
      assert.ok(fs.statSync(pdf.filePath).size > 1000);
      pdfs[key] = pdf.filePath;
      const artifact = path.join(output, "meeting-series-" + key + "-nr1.pdf");
      const bytes = fs.readFileSync(pdf.filePath);
      fs.writeFileSync(artifact, bytes);
      const inspection = await inspectPdf(artifact);
      assert.match(inspection.text, new RegExp(LABELS[key], "i"), inspection.text);
      assert.match(inspection.text, /Abnahmeweg 12/); assert.match(inspection.text, /12345 Abnahmeort/);
      assert.match(inspection.text, new RegExp("Titel " + key));
      for (const other of SERIES.filter(other => other !== key)) assert.doesNotMatch(inspection.text, new RegExp("Titel " + other));
      report.pdfArtifacts.push({ seriesKey: key, originalPath: pdf.filePath, artifactPath: artifact,
        byteSize: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), ...inspection });
      if (key === "planning") {
        const previews = BrowserWindow.getAllWindows().filter(candidate => candidate !== win && !candidate.isDestroyed());
        assert.equal(previews.length, 1, "Actual internal PDF preview window");
        assert.equal(previews[0].isMovable(), true);
        assert.equal(previews[0].isResizable(), true);
        const beforeMove = previews[0].getBounds();
        previews[0].setPosition(beforeMove.x + 24, beforeMove.y + 18);
        const afterMove = previews[0].getBounds();
        assert.notDeepEqual({ x: afterMove.x, y: afterMove.y }, { x: beforeMove.x, y: beforeMove.y });
        assert.ok(Math.abs(afterMove.x - beforeMove.x) >= 20 && Math.abs(afterMove.y - beforeMove.y) >= 14);
        report.previewWindowEvidence = { movable: previews[0].isMovable(), resizable: previews[0].isResizable(), beforeMove, afterMove };
        report.checks.push("Actual internal PDF preview is a framed movable/resizable native window and remains operable after repositioning.");
        await sleep(400);
        const file = path.join(output, "meeting-series-planning-internal-preview.png");
        fs.writeFileSync(file, (await previews[0].webContents.capturePage()).toPNG());
        report.screenshots.push(file);
        previews[0].destroy();
      }
      const evidence = await evaluate("msAcceptance.mailEvidence(" + json(projectId) + "," + json(meetings[key]) + ")");
      assert.match(evidence.draft.subject, new RegExp(LABELS[key], "i"), json(evidence));
      assert.equal(evidence.stored?.ok, true, json(evidence));
      assert.equal(path.resolve(evidence.stored.filePath), path.resolve(pdf.filePath), json(evidence));
      report.checks.push(key + " Nr. 1: actual PDF and productive mail lookup resolve only its own stored attachment.");
    }
    assert.equal(new Set(Object.values(pdfs)).size, 3);
    report.pdfs = pdfs;
    assert.equal(await evaluate("msAcceptance.alerts.length"), 0, await evaluate("JSON.stringify(msAcceptance.alerts)"));
    assert.deepEqual(report.rendererErrors, [], "Production renderer console errors");
    assert.equal(database.initDatabase().pragma("integrity_check", { simple: true }), "ok");
    await require("./tests/projectOverviewAcceptance.cjs")({
      evaluate, waitFor, click, cardClick, fill, invoke, projects, readProject,
      database, win, report, output, projectId, meetings, checkRefs,
    });
    await projects();
    assert.equal(await evaluate(`(function(){const button=[...msAcceptance.card(${json(projectId)}).querySelectorAll('button[data-series-key]')].find(item=>item.dataset.seriesKey==='owner');button?.focus();return document.activeElement===button})()`), true);
    win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Space" });
    win.webContents.sendInputEvent({ type: "keyUp", keyCode: "Space" });
    await waitFor("msAcceptance.router.currentMeetingId === " + json(meetings.owner.id) + " && !!msAcceptance.router.currentView?.store");
    await projects();
    assert.equal(await evaluate(`(function(){const card=msAcceptance.card(${json(projectId)});const buttons=[...card.querySelectorAll('button[data-series-key]')];const selected=buttons.filter(button=>button.dataset.projectSeriesSelected==='true');return selected.length===1&&selected[0].dataset.seriesKey==='owner'})()`), true);
    assert.equal(await evaluate(`(function(){const button=[...msAcceptance.card(${json(projectId)}).querySelectorAll('button[data-series-key]')].find(item=>item.dataset.seriesKey==='owner');button?.focus();return document.activeElement===button})()`), true);
    win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Tab" });
    win.webContents.sendInputEvent({ type: "keyUp", keyCode: "Tab" });
    await waitFor(`document.activeElement?.dataset?.seriesKey === 'planning'`);
    const keyboardFocusEvidence = await evaluate(`(function(){const button=document.activeElement;const style=getComputedStyle(button);return{key:button.dataset.seriesKey,focusVisible:button.matches(':focus-visible'),outline:style.outline,boxShadow:style.boxShadow}})()`);
    assert.equal(keyboardFocusEvidence.focusVisible, true, json(keyboardFocusEvidence));
    assert.ok(keyboardFocusEvidence.outline !== "none" || keyboardFocusEvidence.boxShadow !== "none", json(keyboardFocusEvidence));
    await win.webContents.session.flushStorageData();
    await win.loadFile(path.join(__dirname, "tests/meetingSeriesAcceptance.html"));
    await waitFor("!!window.msAcceptance");
    await evaluate("msAcceptance.boot(" + json(productionIndexStyles()) + ")");
    await projects();
    const restoredSeriesSelection = await evaluate(`(function(){const card=msAcceptance.card(${json(projectId)});return [...card.querySelectorAll('button[data-series-key]')].map(button=>({key:button.dataset.seriesKey,selected:button.dataset.projectSeriesSelected,color:getComputedStyle(button).color}))})()`);
    assert.deepEqual(restoredSeriesSelection.filter(button => button.selected === "true").map(button => button.key), ["owner"]);
    assert.notEqual(restoredSeriesSelection.find(button => button.key === "owner").color,
      restoredSeriesSelection.find(button => button.key === "construction").color);
    await screenshot("project-overview-series-selection-restored");
    report.seriesSelectionEvidence = { initial: initialSeriesPresentation, keyboardFocus: keyboardFocusEvidence, restored: restoredSeriesSelection };
    report.checks.push("Direct series actions are plain 12px keyboard-focusable text; successful mouse/keyboard navigation stores one project-specific selected series and restores it after renderer restart.");
    if (manual) {
      // Windows' hidden process startup can suppress the first native ShowWindow.
      // Hand the completed fixture to the user as a visible, focusable window.
      if (win.isMinimized()) win.restore();
      win.setSkipTaskbar(false);
      win.show(); win.focus(); win.webContents.focus();
      assert.equal(win.isDestroyed(), false, "Manual BBM window must remain alive");
      assert.equal(win.isVisible(), true, "Manual BBM window must be visible");
      assert.equal(win.isMinimized(), false, "Manual BBM window must be restored");
      const nativeHandle = win.getNativeWindowHandle();
      report.manualWindow = { pid: process.pid, windowId: win.id,
        nativeWindowHandle: (nativeHandle.length === 8 ? nativeHandle.readBigUInt64LE() : nativeHandle.readUInt32LE()).toString(),
        visible: win.isVisible(), minimized: win.isMinimized(), focused: win.isFocused(),
        bounds: win.getBounds(), readyAt: new Date().toISOString(), closedAt: null };
    }
    report.ok = true;
    checkpoint();
    console.log("[meeting-series-acceptance] PASS " + resultFile);
    if (manual) {
      console.log("[meeting-series-acceptance] Manual window remains open in the isolated profile. Close its X to finish; manualConfirmed stays false.");
      console.log("[meeting-series-acceptance] Check project edit checkbox/save; all direct entries; disable/history/reactivate; blank builder; same-number PDF title/attachment; native UI/PDF editor.");
      await new Promise(resolve => win.once("closed", resolve));
      report.manualWindow.closedAt = new Date().toISOString();
      checkpoint();
    }
  } catch (error) {
    if (win && !win.isDestroyed()) {
      try {
        const failScreenshot = path.join(output, "meeting-series-failure.png");
        fs.writeFileSync(failScreenshot, (await win.webContents.capturePage()).toPNG());
        report.screenshots.push(failScreenshot);
      } catch { /* failure evidence best effort */ }
    }
    report.error = error?.stack || String(error); checkpoint();
    console.error("[meeting-series-acceptance] FAIL", report.error);
    process.exitCode = 1;
  } finally {
    try { await editor?.shutdown?.(); } catch { /* isolated worker cleanup */ }
    database?.closeDatabase();
    for (const window of BrowserWindow.getAllWindows()) window.destroy();
    app.exit(report.ok ? 0 : 1);
  }
}

async function launcher() {
  const { switchNativeAbi } = require("./nativeDepsAbi.cjs");
  // Avoid reinstalling a DLL that another Electron-based suite already uses.
  const probeAbi = () => spawnSync(require("electron"), ["-e",
    "const Sqlite=require('better-sqlite3');const db=new Sqlite(':memory:');db.prepare('SELECT 1').get();db.close()"],
    { cwd: ROOT, env: { ...createSanitizedEnvironment(), ELECTRON_RUN_AS_NODE: "1" },
      stdio: "pipe", windowsHide: true });
  if (probeAbi().status !== 0) {
    assert.equal(switchNativeAbi("electron"), 0, "Electron native ABI must be ready");
    const probe = probeAbi();
    assert.equal(probe.status, 0, String(probe.stderr || "Electron in-memory native ABI probe failed"));
  }
  const profile = createAcceptanceProfile();
  const output = path.resolve(process.env.BBM_MEETING_SERIES_OUTPUT ||
    fs.mkdtempSync(path.join(os.tmpdir(), "bbm-meeting-series-results-")));
  const env = { ...createSanitizedEnvironment(), BBM_MEETING_SERIES_OUTPUT: output };
  const args = [__filename, "--worker", ACCEPTANCE_SWITCH + profile.rootPath];
  if (process.argv.includes("--manual")) args.push("--manual");
  console.log("[meeting-series-acceptance] isolated root: " + profile.rootPath);
  console.log("[meeting-series-acceptance] output: " + output);
  try {
    const code = await new Promise((resolve, reject) => {
      const child = spawn(require("electron"), args, { cwd: ROOT, env, stdio: "inherit", windowsHide: !process.argv.includes("--manual") });
      const timeout = process.argv.includes("--manual") ? null : setTimeout(() => {
        console.error("[meeting-series-acceptance] Worker timeout"); child.kill();
      }, 180000);
      const done = code => { if (timeout) clearTimeout(timeout); resolve(Number(code ?? 1)); };
      child.once("error", error => { if (timeout) clearTimeout(timeout); reject(error); });
      child.once("close", done);
    });
    process.exitCode = code;
  } finally {
    removeAcceptanceProfile(profile.rootPath);
    console.log("[meeting-series-acceptance] isolated profile removed; screenshots/report retained at " + output);
  }
}

if (process.versions.electron && process.argv.includes("--worker")) {
  worker().catch(error => { console.error(error?.stack || String(error)); require("electron").app.exit(1); });
} else if (require.main === module) {
  launcher().catch(error => {
    console.error(error?.stack || String(error)); process.exitCode = 1;
  });
}
module.exports = { productionIndexStyles };
