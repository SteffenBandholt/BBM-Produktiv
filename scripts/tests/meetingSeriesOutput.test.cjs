"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const series = require("../../src/shared/meetingSeries.cjs");

// Product functions with explicit repositories: no productive database is
// initialized, and every filesystem write belongs to one temporary directory.
function loadMain(relativePath, mocks, extraExports = "") {
  const absolute = path.resolve(relativePath);
  const instance = new Module(absolute, module);
  instance.filename = absolute;
  instance.paths = Module._nodeModulePaths(path.dirname(absolute));
  const ordinaryRequire = instance.require.bind(instance);
  instance.require = (request) => Object.hasOwn(mocks, request) ? mocks[request] : ordinaryRequire(request);
  instance._compile(fs.readFileSync(absolute, "utf8") + extraExports, absolute);
  return instance.exports;
}

function loadPrintIpc(meetings, project, root, repository = null) {
  return loadMain("src/main/ipc/printIpc.js", {
    electron: { ipcMain: { handle() {} }, app: { getPath: () => root }, shell: {}, BrowserWindow: class {} },
    "../db/meetingsRepo": repository || { getMeetingById: (id) => meetings.find((meeting) => meeting.id === id) || null },
    "../db/projectsRepo": { getById: (id) => id === project.id ? project : null },
    "../print/printWindow": {}, "../print/printData": {}, "../licensing/featureGuard": {}, "../buildIdentity": {},
    "../ui-editor/bbmPdfAdapter.cjs": {}, "../ui-editor/restarbeitenPdfAdapter.cjs": {},
    "../ui-editor/invoicePdfAdapter.cjs": {}, "../ui-editor/pdfAdapterRegistry.cjs": {},
    "../ui-editor/technicalPdfAdapter.cjs": {}, "../ui-editor/sigekoPreNotificationPdfAdapter.cjs": {},
    "../print/pdfProviderBridge": {}, "../modulePdfProviders": {}, "../print/sharedFirmsPrintAccess": {},
  });
}

function loadPrintData(rows) {
  return loadMain("src/main/print/printData.js", {
    "../db/database": { initDatabase() { throw new Error("No productive DB in output regression"); } },
    "../db/projectsRepo": {}, "../db/meetingsRepo": {}, "../db/projectSettingsRepo": {},
    "../db/meetingTopsRepo": { listLatestByProject: () => structuredClone(rows), listJoinedByMeeting: () => [] },
    "../domain/firms/FirmDirectoryService": {}, "../db/appSettingsRepo": {}, "../db/tableLayoutsRepo": {},
    "../db/userProfileRepo": {}, "../licensing/licenseService": {}, "../licensing/featureGuard": {},
    "../licensing/licenseFeatures": {}, "../db/invoiceRepository": {}, "../domain/rechnung/InvoiceService": {},
  }, "\nmodule.exports.seriesTest = { _resolveNextMeetingForPrint, _loadPrintDocumentContent };\n").seriesTest;
}

async function runMeetingSeriesOutputTests(run) {
  const naming = await importEsmFromFile(path.resolve("src/renderer/utils/protocolPdfNaming.js"));
  const { ProtokollMailPayloadService } = await importEsmFromFile(path.resolve("src/renderer/modules/protokoll/mail/ProtokollMailPayloadService.js"));
  const { default: PrintModal } = await importEsmFromFile(path.resolve("src/renderer/modules/ausgabe/PrintModal.js"));
  const { default: MainHeader } = await importEsmFromFile(path.resolve("src/renderer/ui/MainHeader.js"));
  const project = { id: "series-project", project_number: "4711", name: "Prüfprojekt", short: "Nord" };
  const meetings = series.MEETING_SERIES.map((definition) => ({
    id: `meeting-${definition.key}`, project_id: project.id, series_key: definition.key,
    meeting_index: 1, title: "15.09.2026", created_at: "2026-09-15T08:00:00Z", is_closed: 0, next_meeting_enabled: null,
  }));

  await run("Besprechungsreihen Ausgabe: gleiche Nummer und Datum besitzen stabile eindeutige Dateinamen", () => {
    const names = meetings.map((meeting) => naming.buildProtocolPdfFileName({
      projectNumber: "4711", projectShortName: "Nord", protocolTitle: "Jour fixe",
      meetingIndex: 1, meetingDate: "2026-09-15", seriesKey: meeting.series_key, meetingId: meeting.id,
    }));
    assert.equal(new Set(names).size, 3);
    for (let index = 0; index < names.length; index += 1) {
      assert.ok(names[index].startsWith(`${meetings[index].series_key}--${meetings[index].id}__`));
    }
    assert.ok(names[0].includes("Jour fixe"));
    assert.ok(names[1].includes("Bauherrenbesprechung"));
    assert.ok(names[2].includes("Planungsbesprechung"));
  });

  await run("Besprechungsreihen Ausgabe: Main-Identität überschreibt fremdes Präfix und bleibt bei langem Titel erhalten", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-series-output-"));
    try {
      const ipc = loadPrintIpc(meetings, project, root);
      const names = meetings.map((meeting) => ipc.meetingPdfFileName("owner--foreign__" + "Langer Titel ".repeat(40) + ".pdf", meeting));
      assert.equal(new Set(names).size, 3);
      for (let index = 0; index < names.length; index += 1) {
        assert.deepEqual(ipc.readMeetingPdfIdentity(names[index]), { seriesKey: meetings[index].series_key, meetingId: meetings[index].id });
      }
      const imported = { id: "id__mit/%_Zeichen", series_key: "planning" };
      const rendererName = naming.withMeetingPdfIdentity("Dokument.pdf", { seriesKey: imported.series_key, meetingId: imported.id });
      assert.equal(ipc.meetingPdfFileName("Dokument.pdf", imported), rendererName);
      assert.equal(ipc.readMeetingPdfIdentity(rendererName).meetingId, imported.id);
      const windowsNames = ["Meeting-A", "meeting-a"].map((id) => ipc.meetingPdfFileName("Dokument.pdf", { id, series_key: "owner" }).toLowerCase());
      assert.equal(new Set(windowsNames).size, 2);
      assert.throws(() => ipc.meetingPdfFileName("Dokument.pdf", { id: "x".repeat(200), series_key: "owner" }), /zu lang/);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  await run("Besprechungsreihen Ausgabe: PDF-Suche verwendet DB-Reihe und niemals fremde oder #10-Legacydatei", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-series-output-"));
    try {
      const ipc = loadPrintIpc(meetings, project, root);
      const { resolveProjectFolderName } = require("../../src/main/ipc/projectStoragePaths");
      const dir = path.join(root, "bbm", resolveProjectFolderName(project), "Protokolle");
      fs.mkdirSync(dir, { recursive: true });
      const legacy = "4711_Nord_Alter Titel_#1 - 15.09.2026.pdf";
      fs.writeFileSync(path.join(dir, legacy), "legacy fixture");
      fs.writeFileSync(path.join(dir, "4711_#10 - 15.09.2026.pdf"), "wrong number fixture");
      const find = (meeting, additions = {}) => ipc.findStoredProtocolPdf({ baseDir: root, projectId: project.id,
        meetingId: meeting.id, expectedFileNames: [legacy], ...additions });
      assert.equal(path.basename(find(meetings[0]).filePath), legacy);
      assert.equal(find(meetings[1], { seriesKey: "construction", meetingIndex: 1 }).ok, false);
      assert.equal(find(meetings[2]).ok, false);
      assert.equal(find(meetings[0], { projectId: "wrong-project" }).ok, false);
      fs.writeFileSync(path.join(dir, "4711_Nord_Andere Bezeichnung_#1 - 15.09.2026.pdf"), "ambiguous fixture");
      assert.match(find(meetings[0]).error, /Mehrere historische/);
      const own = ipc.meetingPdfFileName("Titel_#1 - 15.09.2026.pdf", meetings[1]);
      fs.writeFileSync(path.join(dir, own), "owner fixture");
      assert.equal(path.basename(find(meetings[1]).filePath), own);
      assert.equal(find(meetings[2]).ok, false);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  await run("Besprechungsreihen Ausgabe: Mailbetreff, Anhanglabel und Dateisuche tragen dieselbe Reihe", async () => {
    const previous = global.window;
    global.window = { bbmDb: {
      projectsList: async () => ({ ok: true, list: [project] }),
      projectSettingsGetMany: async () => ({ ok: true, data: { "pdf.protocolTitle": "Jour fixe" } }),
      appSettingsGetMany: async () => ({ ok: true, data: { "pdf.protocolsDir": "C:/isolated", "pdf.protocolTitle": "Globaler Titel",
        email_subject: "{projectNumber}: #{meetingIndex}", email_body: "Bitte beachten." } }),
      meetingParticipantsList: async () => ({ ok: true, list: [] }),
    } };
    try {
      const service = new ProtokollMailPayloadService({ router: { currentProjectId: project.id } });
      assert.equal(await service.resolveProtocolTitle(project.id, "construction"), "Jour fixe");
      for (const meeting of meetings.slice(1)) {
        const title = series.getSeriesDefinition(meeting.series_key).title;
        const draft = await service.buildDraft({ projectId: project.id, meeting });
        assert.ok(draft.subject.includes(title));
        const lookup = await service.buildProtocolPdfLookupPayload(meeting, project.id);
        assert.equal(lookup.meetingId, meeting.id);
        assert.equal(lookup.projectId, project.id);
        assert.equal(lookup.seriesKey, meeting.series_key);
        assert.ok(lookup.expectedFileNames.every((name) => name.startsWith(`${meeting.series_key}--${meeting.id}__`)));
        assert.equal(service.buildAttachmentEntries({}, meeting)[0].label, `${title} #1`);
        assert.deepEqual(service.buildInitialRecipientSelection(await service.getMeetingRecipientOptions(meeting.id)), []);
      }
    } finally { global.window = previous; }
  });

  await run("Besprechungsreihen Ausgabe: produktiver PrintModal-Aufruf trennt Protokoll und alle Listenanhänge gleicher Nummer", async () => {
    const previous = global.window;
    const previousAlert = global.alert;
    const calls = [];
    const closed = meetings.map((meeting) => ({ ...meeting, is_closed: 1, next_meeting_enabled: 0 }));
    global.alert = (message) => { throw new Error(message); };
    global.window = { bbmDb: {
      topsListByMeeting: async (id) => ({ ok: true, meeting: closed.find((meeting) => meeting.id === id), list: [] }),
      meetingParticipantsList: async () => ({ ok: true, list: [] }),
      projectsList: async () => ({ ok: true, list: [project] }),
      appSettingsGetMany: async () => ({ ok: true, data: {} }),
      projectSettingsGetMany: async () => ({ ok: true, data: { "pdf.protocolTitle": "Jour fixe" } }),
    }, bbmPrint: { printPdf: async (payload) => { calls.push(payload); return { ok: true, filePath: `C:/isolated/${payload.fileName}` }; } } };
    try {
      const modal = new PrintModal({ router: { currentProjectId: project.id, context: { settings: { "pdf.protocolsDir": "C:/isolated" } } } });
      for (const meeting of closed) {
        for (const operation of ["printClosedMeetingDirect", "printFirmsDirect", "printTodoDirect", "printTopListAllDirect"]) {
          const result = await modal[operation]({ projectId: project.id, meetingId: meeting.id });
          assert.equal(result.ok, true);
        }
      }
      assert.equal(calls.length, 12);
      assert.equal(new Set(calls.map((payload) => payload.fileName)).size, 12);
      for (const payload of calls) {
        const meeting = closed.find((item) => item.id === payload.meetingId);
        assert.ok(payload.fileName.startsWith(`${meeting.series_key}--${meeting.id}__`));
        assert.equal(payload.overwrite, true);
      }
    } finally { global.window = previous; global.alert = previousAlert; }
  });

  await run("Besprechungsreihen Ausgabe: Folgetermin liest nur unveränderte Baureihen-Draftvorgaben und schreibt Meeting-ID", async () => {
    const previous = global.window;
    let reads = 0;
    let saved = null;
    global.window = { bbmDb: {
      appSettingsGetMany: async () => { reads += 1; return { ok: true, data: { "print.nextMeeting.enabled": "true", "print.nextMeeting.place": "Baureihe" } }; },
      appSettingsSetMany: async () => { throw new Error("No global next-meeting save"); },
      meetingsUpdateNextMeeting: async (payload) => { saved = payload; return { ok: true }; },
    } };
    try {
      const modal = new PrintModal();
      const constructionDefaults = (await modal._getNextMeetingValues({ meeting: meetings[0] })).values;
      assert.equal(constructionDefaults.place, "Baureihe");
      assert.equal(constructionDefaults.optionAEnabled, true);
      assert.equal(constructionDefaults.optionBEnabled, false);
      assert.equal(reads, 1);
      for (const meeting of meetings.slice(1)) assert.equal((await modal._getNextMeetingValues({ meeting })).values.place, "");
      assert.equal(reads, 1);
      const disabled = { ...meetings[0], next_meeting_enabled: 0 };
      assert.equal((await modal._getNextMeetingValues({ meeting: disabled })).values.enabled, false);
      assert.equal(reads, 1);
      modal.meetings = [{ ...meetings[1], is_closed: 1, next_meeting_enabled: 1, next_meeting_place: "Historischer Ort" }];
      modal.selectedMeetingId = meetings[1].id;
      for (const key of ["Enabled", "Date", "Time", "Place", "Extra"]) modal[`nextMeeting${key}`] = { value: "", disabled: false };
      await modal._loadNextMeetingSettings();
      assert.equal(modal.nextMeetingPlace.value, "Historischer Ort");
      assert.equal(modal.nextMeetingEnabled.disabled, true);
      await modal._saveNextMeetingSettings();
      assert.equal(saved, null);
      modal.nextMeetingEnabled.disabled = false;
      modal.nextMeetingEnabled.checked = false;
      await modal._saveNextMeetingSettings();
      assert.equal(saved.meetingId, meetings[1].id);
      assert.equal(saved.nextMeeting.enabled, false);
      assert.equal(saved.nextMeeting.place, "Historischer Ort");
    } finally { global.window = previous; }
  });

  await run("Besprechungsreihen Ausgabe: Druckmenü und Cache wählen das offene Protokoll der aktuellen Reihe", async () => {
    const previous = global.window;
    const calls = [];
    global.window = { bbmDb: { meetingsListByProject: async (payload) => {
      calls.push(payload);
      return { ok: true, list: meetings.filter((meeting) => meeting.series_key === payload.seriesKey) };
    } } };
    try {
      const header = Object.create(MainHeader.prototype);
      header.router = { currentProjectId: project.id, currentSeriesKey: "construction", currentMeetingId: meetings[0].id, context: { ui: { isTopsView: true } } };
      header._printMenuState = await header._resolvePrintMenuState();
      assert.equal(header._printMenuState.canPreviewProtocol, true);
      header.router.currentSeriesKey = "owner";
      header.router.currentMeetingId = meetings[1].id;
      const owner = await header._resolvePrintMenuState();
      assert.equal(owner.openMeetingId, meetings[1].id);
      assert.equal(owner.canPreviewProtocol, true);
      assert.deepEqual(calls.map((call) => call.seriesKey), ["construction", "owner"]);
      assert.ok(header._formatMeetingListEntry(meetings[1]).includes("Bauherrenbesprechungen"));
      const label = header._formatStoredProjectPdfListEntry({ fileName: "owner--meeting-owner__#1 - 15.09.2026.pdf", meetingId: meetings[1].id, seriesKey: "owner" }, "protocol", meetings);
      assert.ok(label.includes("Bauherrenbesprechungen"));
      assert.ok(!label.includes("Baubesprechungen"));
    } finally { global.window = previous; }
  });

  await run("Besprechungsreihen Ausgabe: Main-Folgetermine ignorieren andere Reihen und explizites Ausblenden", () => {
    const data = loadPrintData([]);
    const settings = { "print.nextMeeting.enabled": "true", "print.nextMeeting.place": "Globale Baureihe" };
    assert.equal(data._resolveNextMeetingForPrint({ mode: "preview", meeting: meetings[0], settings }).place, "Globale Baureihe");
    assert.equal(data._resolveNextMeetingForPrint({ mode: "preview", meeting: meetings[0], settings }).optionAEnabled, true);
    assert.equal(data._resolveNextMeetingForPrint({ mode: "preview", meeting: meetings[0], settings }).optionBEnabled, false);
    assert.equal(data._resolveNextMeetingForPrint({ mode: "preview", meeting: meetings[1], settings }).place, "");
    assert.equal(data._resolveNextMeetingForPrint({ mode: "preview", meeting: { ...meetings[0], next_meeting_enabled: 0 }, settings }).enabled, false);
    assert.equal(data._resolveNextMeetingForPrint({ mode: "protocol", meeting: { ...meetings[0], is_closed: 1 }, settings }).enabled, false);
  });

  await run("Nächste Besprechung: Vorschau und endgültiges Protokoll verwenden dieselbe gespeicherte Auswahl", () => {
    const data = loadPrintData([]);
    const storedMeeting = {
      ...meetings[0],
      next_meeting_enabled: 1,
      next_meeting_option_a_enabled: 0,
      next_meeting_option_b_enabled: 1,
      next_meeting_option_b_text: "Nur B\nmit Zeilenumbruch",
      next_meeting_date: "",
      next_meeting_time: "",
      next_meeting_place: "",
      next_meeting_extra: "",
    };
    const preview = data._resolveNextMeetingForPrint({ mode: "preview", meeting: storedMeeting, settings: {} });
    const protocol = data._resolveNextMeetingForPrint({ mode: "protocol", meeting: storedMeeting, settings: {} });
    assert.deepEqual(preview, protocol);
  });

  await run("Besprechungsreihen Ausgabe: projektweite TOP- und Aufgaben-PDFs behalten Reihe bei identischen Hierarchien", () => {
    const rows = series.MEETING_SERIES.flatMap((definition) => [
      { id: `${definition.key}-root`, series_key: definition.key, number: 1, level: 1, title: "Abschnitt" },
      { id: `${definition.key}-task`, series_key: definition.key, number: 1, level: 2, parent_top_id: `${definition.key}-root`, title: "Aufgabe", is_task: 1, status: "offen" },
    ]);
    const data = loadPrintData(rows);
    const tops = data._loadPrintDocumentContent({ db: {}, mode: "topsAll", projectId: project.id }).tops;
    assert.equal(tops.length, 6);
    assert.deepEqual(tops.map((row) => row.id), rows.map((row) => row.id));
    for (const definition of series.MEETING_SERIES) {
      const task = tops.find((row) => row.id === `${definition.key}-task`);
      assert.equal(task.display_number, "1.1");
      assert.equal(task.topNumberText, `${definition.title} 1.1`);
      assert.equal(task.series_key, definition.key);
    }
    const todos = data._loadPrintDocumentContent({ db: {}, mode: "todo", projectId: project.id }).todoRows;
    assert.equal(todos.length, 3);
    for (const definition of series.MEETING_SERIES) assert.equal(todos.find((row) => row.series_key === definition.key).position, `${definition.title} 1.1`);
  });
}

async function runMeetingSeriesOutputRepoDtoTests(run) {
  await run("Besprechungsreihen Ausgabe: reale Repo-DTOs finden Legacy-PDFs anhand Titel und Anlagezeit ohne meeting_date", () => {
    const Database = require("better-sqlite3");
    const db = new Database(":memory:");
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-series-repo-output-"));
    try {
      db.exec(`CREATE TABLE projects (id TEXT PRIMARY KEY, archived_at TEXT, meeting_series_mask INTEGER);
        CREATE TABLE meetings (id TEXT, project_id TEXT, series_key TEXT, meeting_index INTEGER,
        title TEXT, is_closed INTEGER, pdf_show_ampel INTEGER, todo_snapshot_json TEXT,
        next_meeting_enabled INTEGER,
        next_meeting_option_a_enabled INTEGER NOT NULL DEFAULT 1,
        next_meeting_option_b_enabled INTEGER NOT NULL DEFAULT 0,
        next_meeting_option_b_text TEXT,
        next_meeting_date TEXT, next_meeting_time TEXT,
        next_meeting_place TEXT, next_meeting_extra TEXT, created_at TEXT, updated_at TEXT)`);
      const project = { id: "repo-project", project_number: "4711", name: "Prüfprojekt" };
      db.prepare("INSERT INTO projects (id, meeting_series_mask) VALUES (?, ?)").run(project.id, 1);
      const insert = db.prepare("INSERT INTO meetings (id,project_id,series_key,meeting_index,title,is_closed,created_at) VALUES (?,?,?,?,?,?,?)");
      insert.run("title-date", project.id, "construction", 1, "#1 - 15.09.2026 - Auftakt", 1, "2026-09-10T08:00:00Z");
      insert.run("creation-date", project.id, "construction", 2, "Freier Titel", 1, "2026-09-14T08:00:00Z");
      insert.run("owner-date", project.id, "owner", 1, "15.09.2026", 1, "2026-09-10T08:00:00Z");
      insert.run("next-meeting-open", project.id, "construction", 3, "Offen", 0, "2026-09-15T08:00:00Z");
      const repo = loadMain("src/main/db/meetingsRepo.js", { "./database": { initDatabase: () => db } });
      const dto = repo.getMeetingById("title-date");
      assert.equal(Object.hasOwn(dto, "meeting_date"), false);
      assert.equal(dto.title, "#1 - 15.09.2026 - Auftakt");
      const ipc = loadPrintIpc([], project, root, repo);
      const { resolveProjectFolderName } = require("../../src/main/ipc/projectStoragePaths");
      const dir = path.join(root, "bbm", resolveProjectFolderName(project), "Protokolle");
      fs.mkdirSync(dir, { recursive: true });
      const titleName = "4711_Alter Titel_#1 - 15.09.2026.pdf";
      const creationName = "4711_Alter Titel_#2-2026-09-14.pdf";
      fs.writeFileSync(path.join(dir, titleName), "title fixture");
      fs.writeFileSync(path.join(dir, creationName), "creation fixture");
      fs.writeFileSync(path.join(dir, "4711_Alter Titel_#10 - 15.09.2026.pdf"), "wrong number fixture");
      const find = (meetingId) => ipc.findStoredProtocolPdf({ baseDir: root, projectId: project.id, meetingId });
      assert.equal(path.basename(find("title-date").filePath), titleName);
      assert.equal(path.basename(find("creation-date").filePath), creationName);
      assert.equal(find("owner-date").ok, false);
      fs.writeFileSync(path.join(dir, "4711_Alter Titel_#1 - 10.09.2026.pdf"), "competing creation fixture");
      assert.match(find("title-date").error, /Mehrere historische/);

      const legacyOptions = repo.getMeetingById("next-meeting-open");
      assert.equal(legacyOptions.next_meeting_option_a_enabled, 1);
      assert.equal(legacyOptions.next_meeting_option_b_enabled, 0);
      repo.updateNextMeeting({ meetingId: "next-meeting-open", nextMeeting: {
        enabled: true,
        optionAEnabled: false,
        optionBEnabled: true,
        optionBText: "Zeile eins\nZeile zwei",
        date: "",
        time: "",
        place: "",
        extra: "",
      } });
      repo.updateNextMeeting({ meetingId: "next-meeting-open", nextMeeting: { enabled: false, place: "Inhalt bleibt" } });
      const saved = repo.getMeetingById("next-meeting-open");
      assert.equal(saved.next_meeting_enabled, 0);
      assert.equal(saved.next_meeting_option_a_enabled, 0);
      assert.equal(saved.next_meeting_option_b_enabled, 1);
      assert.equal(saved.next_meeting_option_b_text, "Zeile eins\nZeile zwei");
      assert.equal(saved.next_meeting_place, "Inhalt bleibt");
    } finally { db.close(); fs.rmSync(root, { recursive: true, force: true }); }
  });

  await run("Besprechungsreihen Ausgabe: reale Bestandsmigration setzt A an, B aus und lässt Drucken unverändert", () => {
    const Database = require("better-sqlite3");
    const db = new Database(":memory:");
    try {
      db.exec(`CREATE TABLE meetings (
        id TEXT PRIMARY KEY,
        next_meeting_enabled INTEGER,
        next_meeting_date TEXT,
        next_meeting_time TEXT,
        next_meeting_place TEXT,
        next_meeting_extra TEXT
      );`);
      db.prepare("INSERT INTO meetings (id, next_meeting_enabled, next_meeting_place) VALUES (?, ?, ?)")
        .run("legacy-next-meeting", 0, "Bestandsort");
      const database = loadMain("src/main/db/database.js", {
        "better-sqlite3": Database,
        electron: { app: { getPath: () => os.tmpdir() } },
        "./invoiceMigrations": { ensureInvoiceSchema() {} },
        "./firmUsagesRepo": { ensureFirmUsagesSchema() {} },
        "../moduleRegistry": { getModuleIds: () => [], resolveActiveModuleIds: () => [] },
        "../moduleMigrationRegistrars": [],
        "../moduleMigrationRegistry": { runModuleMigrations() {} },
      }, "\nmodule.exports.__ensureMeetingsNextMeetingColumns = ensureMeetingsNextMeetingColumns;\n");
      database.__ensureMeetingsNextMeetingColumns(db);
      const migrated = db.prepare("SELECT * FROM meetings WHERE id=?").get("legacy-next-meeting");
      assert.equal(migrated.next_meeting_enabled, 0);
      assert.equal(migrated.next_meeting_option_a_enabled, 1);
      assert.equal(migrated.next_meeting_option_b_enabled, 0);
      assert.equal(migrated.next_meeting_option_b_text, null);
      assert.equal(migrated.next_meeting_place, "Bestandsort");
    } finally { db.close(); }
  });
}

if (require.main === module) {
  let failed = false;
  const suite = process.argv.includes("--repo-dto") ? runMeetingSeriesOutputRepoDtoTests : runMeetingSeriesOutputTests;
  suite(async (name, task) => {
    try { await task(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}\n${error.stack || error}`); }
  }).then(() => { if (failed) process.exitCode = 1; }).catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
}
module.exports = { runMeetingSeriesOutputTests, runMeetingSeriesOutputRepoDtoTests };
