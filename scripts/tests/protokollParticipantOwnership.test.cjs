const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function withDatabase(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-272-participants-"));
  const db = new Database(path.join(directory, "app.db"));
  try {
    db.pragma("foreign_keys = ON");
    db.exec("CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)");
    return callback(db);
  } finally {
    db.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function hasTable(db, name) {
  return !!db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(name);
}

async function runProtokollParticipantOwnershipTests(run) {
  await run("#272 Teilnehmer: Core besitzt Stammdaten und Projektpool, aber keine Besprechungsteilnahme", () =>
    withDatabase((db) => {
      const { ensureSchema } = require(path.join(process.cwd(), "src/main/db/database.js"));
      ensureSchema(db, { moduleIds: [] });
      assert.equal(hasTable(db, "firms"), true);
      assert.equal(hasTable(db, "persons"), true);
      assert.equal(hasTable(db, "project_firms"), true);
      assert.equal(hasTable(db, "project_persons"), true);
      assert.equal(hasTable(db, "project_candidates"), true);
      assert.equal(hasTable(db, "meeting_participants"), false);
    })
  );

  await run("#272 Teilnehmer: Protokollmigration besitzt Teilnahme, Anwesenheit und Verteiler", () =>
    withDatabase((db) => {
      const { ensureSchema } = require(path.join(process.cwd(), "src/main/db/database.js"));
      ensureSchema(db, { moduleIds: ["protokoll"] });
      assert.equal(hasTable(db, "project_candidates"), true);
      assert.equal(hasTable(db, "meeting_participants"), true);
      const columns = new Set(
        db.prepare("PRAGMA table_info(meeting_participants)").all().map((column) => column.name)
      );
      for (const column of ["meeting_id", "kind", "person_id", "is_present", "is_in_distribution"]) {
        assert.equal(columns.has(column), true, column);
      }
    })
  );

  await run("#272 Teilnehmer: Meeting-IPC wird nur mit aktivem Protokoll registriert", () => {
    const { registerActiveModuleIpcs } = require(path.join(
      process.cwd(),
      "src/main/moduleIpcRegistry.js"
    ));
    const registrars = require(path.join(process.cwd(), "src/main/moduleIpcRegistrars.js"));
    const handlers = new Map();
    const ipcMain = { handle: (channel, listener) => handlers.set(channel, listener) };
    const activeStatus = { valid: true, license: { modules: ["protokoll"] } };
    registerActiveModuleIpcs({
      licenseStatus: activeStatus,
      getLicenseStatus: () => activeStatus,
      ipcMain,
      registrars,
    });
    for (const channel of ["meetingParticipants:list", "meetingParticipants:set"]) {
      assert.equal(handlers.has(channel), true, channel);
    }
    assert.equal(handlers.has("projectCandidates:list"), false);

    const inactiveHandlers = new Map();
    registerActiveModuleIpcs({
      licenseStatus: { valid: true, license: { modules: [] } },
      ipcMain: { handle: (channel, listener) => inactiveHandlers.set(channel, listener) },
      registrars,
    });
    assert.equal(inactiveHandlers.size, 0);
  });

  await run("#272 Teilnehmer: Projektpool bleibt als Core-Projektbeziehung verfügbar", () => {
    const { registerProjectParticipantsIpc } = require(path.join(
      process.cwd(),
      "src/main/ipc/participantsIpc.js"
    ));
    const handlers = new Map();
    registerProjectParticipantsIpc({
      ipcMain: { handle: (channel, listener) => handlers.set(channel, listener) },
    });
    assert.deepEqual([...handlers.keys()], [
      "projectParticipants:pool",
      "projectCandidates:list",
      "projectCandidates:set",
      "projectCandidates:setActive",
    ]);
    const source = read("src/main/ipc/participantsIpc.js");
    assert.match(source, /tableExists\(db, "meetings"\)/);
    assert.match(source, /tableExists\(db, "meeting_participants"\)/);
  });

  await run("#272 Teilnehmer: Main und Protokoll registrieren getrennte IPC-Anteile", () => {
    const main = read("src/main/main.js");
    const registrar = read("src/main/modules/protokoll/registerIpc.js");
    assert.match(main, /registerProjectParticipantsIpc\(\)/);
    assert.equal(main.includes("registerMeetingParticipantsIpc()"), false);
    assert.match(registrar, /registerMeetingParticipantsIpc\(\{ ipcMain \}\)/);
  });

  await run("#272 Teilnehmer: Preload bleibt kompatibel ohne ungeguardeten Handler", () => {
    const preload = read("src/main/preload.js");
    assert.match(preload, /meetingParticipantsList/);
    assert.match(preload, /meetingParticipantsSet/);
    assert.match(preload, /projectCandidatesList/);
    const registry = read("src/main/moduleIpcRegistry.js");
    assert.match(registry, /MODULE_NOT_ACTIVE/);
  });
}

module.exports = { runProtokollParticipantOwnershipTests };
