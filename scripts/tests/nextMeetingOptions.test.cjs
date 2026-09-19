"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

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
    assert.equal(resolve({ mode: "preview", meeting: { next_meeting_enabled: 0 }, settings: {
      "print.nextMeeting.enabled": "true",
    } }).enabled, false);
  });

  await test("Nächste Besprechung: Speicherung erhält Inhalte beim Abschalten", () => {
    const Database = require("better-sqlite3");
    const db = new Database(":memory:");
    try {
      db.exec(`CREATE TABLE meetings (
        id TEXT PRIMARY KEY, project_id TEXT, meeting_index INTEGER, title TEXT,
        is_closed INTEGER, pdf_show_ampel INTEGER, todo_snapshot_json TEXT,
        next_meeting_enabled INTEGER,
        next_meeting_option_a_enabled INTEGER NOT NULL DEFAULT 1,
        next_meeting_option_b_enabled INTEGER NOT NULL DEFAULT 0,
        next_meeting_option_b_text TEXT,
        next_meeting_date TEXT, next_meeting_time TEXT, next_meeting_place TEXT,
        next_meeting_extra TEXT, created_at TEXT, updated_at TEXT
      )`);
      db.prepare("INSERT INTO meetings (id,is_closed) VALUES (?,0)").run("meeting-1");
      const repo = loadMain("src/main/db/meetingsRepo.js", {
        "./database": { initDatabase: () => db },
      });
      repo.updateNextMeeting({ meetingId: "meeting-1", nextMeeting: {
        enabled: true,
        optionAEnabled: false,
        optionBEnabled: true,
        optionBText: "Zeile eins\nZeile zwei",
        date: "", time: "", place: "", extra: "",
      } });
      repo.updateNextMeeting({ meetingId: "meeting-1", nextMeeting: { enabled: false } });
      const saved = repo.getMeetingById("meeting-1");
      assert.equal(saved.next_meeting_enabled, 0);
      assert.equal(saved.next_meeting_option_a_enabled, 0);
      assert.equal(saved.next_meeting_option_b_enabled, 1);
      assert.equal(saved.next_meeting_option_b_text, "Zeile eins\nZeile zwei");
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

  if (failed) process.exitCode = 1;
}

void run();
