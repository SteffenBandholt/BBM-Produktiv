"use strict";

const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const Database = require("better-sqlite3");

const ROOT = path.resolve(__dirname, "../..");
const databaseModulePath = path.join(ROOT, "src/main/db/database.js");
const meetingTopsRepoPath = path.join(ROOT, "src/main/db/meetingTopsRepo.js");

function loadMeetingTopsRepoWithDatabase(db) {
  const originalLoad = Module._load;
  delete require.cache[meetingTopsRepoPath];
  Module._load = function patchedLoad(request, parent, isMain) {
    if (parent?.filename === meetingTopsRepoPath && request === "./database") {
      return { initDatabase: () => db };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    return require(meetingTopsRepoPath);
  } finally {
    Module._load = originalLoad;
  }
}

function createSchema(db) {
  db.exec(`
    CREATE TABLE meetings (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      series_key TEXT NOT NULL,
      meeting_index INTEGER NOT NULL
    );
    CREATE TABLE tops (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      series_key TEXT NOT NULL,
      parent_top_id TEXT,
      level INTEGER NOT NULL,
      number INTEGER NOT NULL,
      title TEXT NOT NULL,
      special_type TEXT,
      is_hidden INTEGER NOT NULL DEFAULT 0,
      is_trashed INTEGER NOT NULL DEFAULT 0,
      removed_at TEXT,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE meeting_tops (
      meeting_id TEXT NOT NULL,
      top_id TEXT NOT NULL,
      status TEXT,
      due_date TEXT,
      longtext TEXT,
      is_carried_over INTEGER NOT NULL DEFAULT 0,
      is_important INTEGER NOT NULL DEFAULT 0,
      is_touched INTEGER NOT NULL DEFAULT 0,
      is_task INTEGER NOT NULL DEFAULT 0,
      is_decision INTEGER NOT NULL DEFAULT 0,
      completed_in_meeting_id TEXT,
      responsible_kind TEXT,
      responsible_id TEXT,
      responsible_label TEXT,
      contact_kind TEXT,
      contact_person_id TEXT,
      contact_label TEXT,
      created_at TEXT,
      updated_at TEXT,
      PRIMARY KEY (meeting_id, top_id)
    );
  `);
}

function main() {
  const db = new Database(":memory:");
  try {
    createSchema(db);
    db.prepare("INSERT INTO meetings (id, project_id, series_key, meeting_index) VALUES (?, ?, ?, ?)")
      .run("old", "p-1", "construction", 1);
    db.prepare("INSERT INTO meetings (id, project_id, series_key, meeting_index) VALUES (?, ?, ?, ?)")
      .run("new", "p-1", "construction", 2);
    const insertTop = db.prepare(`
      INSERT INTO tops (id, project_id, series_key, parent_top_id, level, number, title, special_type)
      VALUES (?, 'p-1', 'construction', ?, ?, ?, ?, ?)
    `);
    insertTop.run("normal", null, 1, 1, "Normal", null);
    insertTop.run("import", null, 1, 0, "Import", "audio_import");
    insertTop.run("under-import", "import", 2, 1, "Nur Entwurf", null);
    insertTop.run("moved", "normal", 2, 1, "Verschoben", null);
    const attach = db.prepare(`
      INSERT INTO meeting_tops (meeting_id, top_id, status, longtext, created_at, updated_at)
      VALUES ('old', ?, 'offen', ?, '2026-09-20T00:00:00Z', '2026-09-20T00:00:00Z')
    `);
    attach.run("normal", null);
    attach.run("import", null);
    attach.run("under-import", "Nicht fortführen");
    attach.run("moved", "Regulär fortführen");

    const repo = loadMeetingTopsRepoWithDatabase(db);
    const before = repo.listJoinedByMeeting("old");
    assert.equal(before.find((row) => row.id === "import").special_type, "audio_import");
    const result = repo.carryOverFromMeeting({ fromMeetingId: "old", toMeetingId: "new" });
    assert.equal(result.inserted, 2);
    const carried = db.prepare("SELECT top_id FROM meeting_tops WHERE meeting_id='new' ORDER BY top_id").all()
      .map((row) => row.top_id);
    assert.deepEqual(carried, ["moved", "normal"]);
    console.log("ok - Audioimport Neu D: reale SQLite-Fortführung schließt Import-Unterbaum aus und erhält verschobenen Punkt");
  } finally {
    db.close();
    delete require.cache[meetingTopsRepoPath];
    delete require.cache[databaseModulePath];
  }
}

main();
