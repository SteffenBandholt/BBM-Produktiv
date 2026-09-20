"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const { importEsmFromFile } = require("./_esmLoader.cjs");

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

function loadPrintResolver() {
  return loadMain("src/main/print/printData.js", {
    "../db/database": {},
    "../db/projectsRepo": {},
    "../db/meetingsRepo": {},
    "../db/projectSettingsRepo": {},
    "../db/meetingTopsRepo": {},
    "../domain/firms/FirmDirectoryService": {},
    "../db/appSettingsRepo": {},
    "../db/tableLayoutsRepo": {},
    "../db/userProfileRepo": {},
    "../licensing/licenseService": {},
    "../licensing/featureGuard": {},
    "../licensing/licenseFeatures": {},
    "../db/invoiceRepository": {},
    "../domain/rechnung/InvoiceService": {},
  }, "\nmodule.exports.__resolveNextMeetingForPrint = _resolveNextMeetingForPrint;\n")
    .__resolveNextMeetingForPrint;
}

async function run() {
  let failed = false;
  const test = async (name, task) => {
    try {
      await task();
      console.log(`ok - ${name}`);
    } catch (error) {
      failed = true;
      console.error(`not ok - ${name}\n${error.stack || error}`);
    }
  };

  await test("Nächste Besprechung: Vorschau und endgültiges PDF verwenden dieselbe gespeicherte Auswahl", () => {
    const resolve = loadPrintResolver();
    const meeting = {
      series_key: "construction",
      is_closed: 0,
      next_meeting_enabled: 1,
      next_meeting_option_a_enabled: 0,
      next_meeting_option_b_enabled: 1,
      next_meeting_option_b_text: "Nur B\nmit Zeilenumbruch",
      next_meeting_date: "",
      next_meeting_time: "",
      next_meeting_place: "",
      next_meeting_extra: "",
    };
    assert.deepEqual(
      resolve({ mode: "preview", meeting, settings: {} }),
      resolve({ mode: "protocol", meeting, settings: {} })
    );
    assert.equal(resolve({
      mode: "preview",
      meeting: { ...meeting, next_meeting_enabled: 0 },
      settings: { "print.nextMeeting.enabled": "true" },
    }).enabled, false);
    assert.equal(resolve({
      mode: "preview",
      meeting: { ...meeting, series_key: "owner", next_meeting_enabled: null },
      settings: { "print.nextMeeting.enabled": "true", "print.nextMeeting.place": "Fremde Reihe" },
    }).place, "");
  });

  await test("Nächste Besprechung: Speicherung erhält A/B-Inhalte beim Abschalten und bleibt reihengebunden", () => {
    const Database = require("better-sqlite3");
    const db = new Database(":memory:");
    try {
      db.exec(`CREATE TABLE projects (
        id TEXT PRIMARY KEY, archived_at TEXT, meeting_series_mask INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE meetings (
        id TEXT PRIMARY KEY, project_id TEXT, series_key TEXT, meeting_index INTEGER, title TEXT,
        is_closed INTEGER, pdf_show_ampel INTEGER, todo_snapshot_json TEXT,
        next_meeting_enabled INTEGER,
        next_meeting_option_a_enabled INTEGER NOT NULL DEFAULT 1,
        next_meeting_option_b_enabled INTEGER NOT NULL DEFAULT 0,
        next_meeting_option_b_text TEXT,
        next_meeting_date TEXT, next_meeting_time TEXT, next_meeting_place TEXT,
        next_meeting_extra TEXT, created_at TEXT, updated_at TEXT
      )`);
      db.prepare("INSERT INTO projects (id, meeting_series_mask) VALUES (?, ?)").run("project-1", 7);
      db.prepare("INSERT INTO meetings (id,project_id,series_key,is_closed) VALUES (?,?,?,0)")
        .run("meeting-1", "project-1", "owner");
      const repo = loadMain("src/main/db/meetingsRepo.js", {
        "./database": { initDatabase: () => db },
      });
      repo.updateNextMeeting({ meetingId: "meeting-1", nextMeeting: {
        enabled: true,
        optionAEnabled: false,
        optionBEnabled: true,
        optionBText: "Zeile eins\nZeile zwei",
        date: "", time: "", place: "Baubüro", extra: "",
      } });
      repo.updateNextMeeting({ meetingId: "meeting-1", nextMeeting: { enabled: false } });
      const saved = repo.getMeetingById("meeting-1");
      assert.equal(saved.series_key, "owner");
      assert.equal(saved.next_meeting_enabled, 0);
      assert.equal(saved.next_meeting_option_a_enabled, 0);
      assert.equal(saved.next_meeting_option_b_enabled, 1);
      assert.equal(saved.next_meeting_option_b_text, "Zeile eins\nZeile zwei");
      assert.equal(saved.next_meeting_place, "Baubüro");

      db.prepare("UPDATE projects SET meeting_series_mask=1 WHERE id=?").run("project-1");
      assert.throws(
        () => repo.updateNextMeeting({ meetingId: "meeting-1", nextMeeting: { enabled: true } }),
        /Reihe ist nicht für neue Arbeit aktiviert/
      );
    } finally {
      db.close();
    }
  });

  await test("Nächste Besprechung: Bestandsmigration setzt A an, B aus und lässt Drucken unverändert", () => {
    const Database = require("better-sqlite3");
    const db = new Database(":memory:");
    try {
      db.exec(`CREATE TABLE meetings (
        id TEXT PRIMARY KEY, next_meeting_enabled INTEGER,
        next_meeting_date TEXT, next_meeting_time TEXT,
        next_meeting_place TEXT, next_meeting_extra TEXT
      )`);
      db.prepare("INSERT INTO meetings (id,next_meeting_enabled,next_meeting_place) VALUES (?,?,?)")
        .run("legacy", 0, "Bestandsort");
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
      const migrated = db.prepare("SELECT * FROM meetings WHERE id=?").get("legacy");
      assert.equal(migrated.next_meeting_enabled, 0);
      assert.equal(migrated.next_meeting_option_a_enabled, 1);
      assert.equal(migrated.next_meeting_option_b_enabled, 0);
      assert.equal(migrated.next_meeting_option_b_text, null);
      assert.equal(migrated.next_meeting_place, "Bestandsort");
    } finally {
      db.close();
    }
  });

  await test("Nächste Besprechung: Dialog liest globale Vorgaben nur für unberührte Baubesprechung", async () => {
    const previousWindow = global.window;
    let reads = 0;
    global.window = { bbmDb: {
      appSettingsGetMany: async () => {
        reads += 1;
        return { ok: true, data: {
          "print.nextMeeting.enabled": "true",
          "print.nextMeeting.optionAEnabled": "false",
          "print.nextMeeting.optionBEnabled": "true",
          "print.nextMeeting.optionBText": "Globaler B-Text",
          "print.nextMeeting.place": "Baureihe",
        } };
      },
    } };
    try {
      const { default: PrintModal } = await importEsmFromFile(
        path.resolve("src/renderer/modules/ausgabe/PrintModal.js")
      );
      const modal = new PrintModal();
      const base = { id: "construction-1", series_key: "construction", is_closed: 0, next_meeting_enabled: null };
      const construction = (await modal._getNextMeetingValues({ meeting: base })).values;
      assert.equal(construction.place, "Baureihe");
      assert.equal(construction.optionAEnabled, false);
      assert.equal(construction.optionBEnabled, true);
      assert.equal(construction.optionBText, "Globaler B-Text");
      assert.equal(reads, 1);

      const owner = (await modal._getNextMeetingValues({
        meeting: { ...base, id: "owner-1", series_key: "owner" },
      })).values;
      assert.equal(owner.place, "");
      assert.equal(owner.optionAEnabled, true);
      assert.equal(owner.optionBEnabled, false);
      assert.equal(reads, 1);
    } finally {
      global.window = previousWindow;
    }
  });

  await test("Nächste Besprechung: IPC und Preload führen den gespeicherten Meeting-Pfad", () => {
    const handlers = new Map();
    const repoCalls = [];
    const ipc = loadMain("src/main/ipc/meetingsIpc.js", {
      electron: { ipcMain: { handle: (name, fn) => handlers.set(name, fn) } },
      "../db/meetingsRepo": {
        updateNextMeeting: (payload) => { repoCalls.push(payload); return { id: payload.meetingId }; },
      },
      "../db/meetingTopsRepo": {},
      "../domain/MeetingService": { createMeetingService: () => ({}) },
    });
    ipc.registerMeetingsIpc({ ipcMain: { handle: (name, fn) => handlers.set(name, fn) } });
    const result = handlers.get("meetings:updateNextMeeting")(null, {
      meetingId: "meeting-1",
      nextMeeting: { optionBText: "Mehrzeilig\nbleibt" },
    });
    assert.equal(result.ok, true);
    assert.equal(repoCalls[0].meetingId, "meeting-1");
    assert.match(
      fs.readFileSync(path.resolve("src/main/preload.js"), "utf8"),
      /meetingsUpdateNextMeeting:\s*\(data\)\s*=>\s*ipcRenderer\.invoke\("meetings:updateNextMeeting", data\)/
    );
  });

  await test("Nächste Besprechung: MeetingService reicht Hauptschalter, A, B und Freitext vollständig weiter", () => {
    const extract = loadMain("src/main/domain/MeetingService.js", {
      "./AmpelService": { createAmpelService: () => ({}) },
    }, "\nmodule.exports.__extractNextMeeting = _extractNextMeeting;\n").__extractNextMeeting;
    assert.deepEqual(extract({ nextMeeting: {
      enabled: "1",
      optionAEnabled: "0",
      optionBEnabled: "1",
      optionBText: "Zeile eins\nZeile zwei",
      date: "2026-10-01",
      time: "09:00",
      place: "Baubüro",
      extra: "Unterlagen mitbringen",
    } }), {
      enabled: "1",
      optionAEnabled: "0",
      optionBEnabled: "1",
      optionBText: "Zeile eins\nZeile zwei",
      date: "2026-10-01",
      time: "09:00",
      place: "Baubüro",
      extra: "Unterlagen mitbringen",
    });
  });

  if (failed) process.exitCode = 1;
}

void run();
