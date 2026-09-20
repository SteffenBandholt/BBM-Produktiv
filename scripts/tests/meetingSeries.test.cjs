"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { fixture, load } = require("./plannedConstructionStart.test.cjs");
const series = require("../../src/shared/meetingSeries.cjs");
const Database = require("better-sqlite3");

function services(f) {
  const meetings = load("src/main/db/meetingsRepo.js", { "./database": f.database });
  const tops = load("src/main/db/topsRepo.js", { "./database": f.database });
  const meetingTops = load("src/main/db/meetingTopsRepo.js", { "./database": f.database });
  const { createMeetingService } = require("../../src/main/domain/MeetingService");
  const { createTopService } = require("../../src/main/domain/TopService");
  return { meetings, tops, meetingTops, meetingService: createMeetingService({ meetingsRepo: meetings, meetingTopsRepo: meetingTops }),
    topService: createTopService({ meetingsRepo: meetings, topsRepo: tops, meetingTopsRepo: meetingTops }) };
}
function participantHandlers(f) {
  load("src/main/ipc/participantsIpc.js", { ...f.dependencies, electron: f.dependencies.electron }).registerParticipantsIpc();
}
const protocolFixture = (fn, options = {}) => fixture(f => fn({ ...f, ...services(f) }), { modules: ["protokoll"], ...options });

async function runMeetingSeriesTests(run) {
  await run("Besprechungsreihen: conflicting raw legacy rolls back all feature columns and indexes", () => {
    const db = new Database(":memory:");
    try {
      db.exec(fs.readFileSync(path.resolve(__dirname, "../../src/main/db/schema.sql"), "utf8"));
      db.exec("INSERT INTO projects(id,name) VALUES('raw','Bestand'); INSERT INTO meetings(id,project_id,meeting_index,is_closed) VALUES('a','raw',1,0),('b','raw',2,0)");
      const before = db.prepare("SELECT * FROM meetings ORDER BY id").all();
      assert.throws(() => require("../../src/main/db/meetingSeriesMigration").ensureMeetingSeries(db), /Mehrere offene/);
      assert.deepEqual(db.prepare("SELECT * FROM meetings ORDER BY id").all(), before);
      for (const table of ["meetings", "tops"]) assert.ok(!db.pragma("table_info(" + table + ")").some(column => column.name === "series_key"));
      assert.ok(!db.pragma("table_info(projects)").some(column => column.name === "meeting_series_mask"));
      assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='idx_meetings_one_open_per_series'").get(), undefined);
    } finally { db.close(); }
  });
  await run("Besprechungsreihen: real project create IPC retains activation and rejects invalid masks", () => protocolFixture(f => {
    const result = f.invoke("projects:create", { name: "IPC Reihen", meeting_series_mask: 7 });
    assert.equal(result.ok, true); assert.equal(result.project.meeting_series_mask, 7);
    assert.equal(f.invoke("projects:list").list.find(row => row.id === result.project.id).meeting_series_mask, 7);
    assert.equal(f.invoke("projects:create", { name: "Ungültig", meeting_series_mask: 8 }).ok, false);
  }));
  await run("Besprechungsreihen: meeting IPC and preload carry the series selector", () => protocolFixture(f => {
    load("src/main/ipc/meetingsIpc.js", { ...f.dependencies, "../db/meetingsRepo": f.meetings,
      "../db/meetingTopsRepo": f.meetingTops }).registerMeetingsIpc({ ipcMain: f.dependencies.electron.ipcMain });
    const project = f.repo.createProject({ name: "IPC Auswahl", meeting_series_mask: 7 });
    const created = f.invoke("meetings:create", { projectId: project.id, seriesKey: "owner" });
    assert.equal(created.ok, true); assert.equal(created.meeting.series_key, "owner");
    assert.deepEqual(f.invoke("meetings:listByProject", { projectId: project.id, seriesKey: "owner" }).list.map(row => row.id), [created.meeting.id]);
    assert.equal(f.invoke("meetings:listByProject", { projectId: project.id, seriesKey: "planning" }).list.length, 0);
    assert.equal(f.invoke("meetings:getById", created.meeting.id).meeting.series_key, "owner");

    const exposed = {};
    const calls = [];
    load("src/main/preload.js", { electron: {
      contextBridge: { exposeInMainWorld: (name, api) => { exposed[name] = api; } },
      ipcRenderer: { invoke: (...args) => { calls.push(args); return args; }, on() {}, removeListener() {} },
    } });
    exposed.bbmDb.meetingsListByProject({ projectId: project.id, seriesKey: "owner" });
    exposed.bbmDb.meetingsGetById(created.meeting.id);
    assert.deepEqual(calls.slice(-2), [
      ["meetings:listByProject", { projectId: project.id, seriesKey: "owner" }],
      ["meetings:getById", created.meeting.id],
    ]);
  }));
  await run("Besprechungsreihen: Browser/Main definitions agree and invalid keys/masks fail", async () => {
    const browser = await import(pathToFileURL(path.resolve(__dirname, "../../src/shared/meetingSeries.mjs")));
    assert.deepEqual(browser.MEETING_SERIES, series.MEETING_SERIES);
    for (const invalid of ["", "Baubesprechungen", "client", 1, {}]) assert.throws(() => series.normalizeSeriesKey(invalid));
    for (const invalid of [null, "7", -1, 8, 1.5]) assert.throws(() => series.normalizeSeriesMask(invalid));
  });
  const legacy = fs.readFileSync(path.resolve(__dirname, "../../src/main/db/schema.sql"), "utf8") + `
    INSERT INTO projects(id,name) VALUES('legacy','Bestand');
    INSERT INTO meetings(id,project_id,meeting_index,title,is_closed) VALUES('old','legacy',7,'Altes Protokoll',1);
    INSERT INTO tops(id,project_id,level,number,title) VALUES('t','legacy',1,4,'Unverändert');
    INSERT INTO meeting_tops(meeting_id,top_id,status,longtext) VALUES('old','t','erledigt','Historischer Inhalt');
    CREATE TABLE meeting_participants(meeting_id TEXT,kind TEXT,person_id TEXT,is_present INTEGER,is_in_distribution INTEGER,created_at TEXT,updated_at TEXT,PRIMARY KEY(meeting_id,kind,person_id));
    INSERT INTO meeting_participants VALUES('old','global_person','historic-person',1,1,'2001-01-01','2001-01-02');`;
  await run("Besprechungsreihen: legacy IDs, numbers, contents, flags and PDFs survive migration/reopen", () => protocolFixture(f => {
    const snapshot = () => ({ project: f.repo.getById("legacy"), meeting: f.meetings.getMeetingById("old"),
      top: f.tops.getTopById("t"), link: f.meetingTops.getMeetingTop("old", "t"),
      participants: f.database.initDatabase().prepare("SELECT * FROM meeting_participants WHERE meeting_id='old'").all() });
    const before = snapshot();
    assert.equal(before.meeting.series_key, "construction"); assert.equal(before.top.series_key, "construction");
    assert.equal(before.meeting.meeting_index, 7); assert.equal(before.top.number, 4); assert.equal(before.link.longtext, "Historischer Inhalt");
    assert.deepEqual(before.participants[0], { meeting_id: "old", kind: "global_person", person_id: "historic-person", is_present: 1, is_in_distribution: 1, created_at: "2001-01-01", updated_at: "2001-01-02" });
    const pdf = path.join(f.root, "historical.pdf"); fs.writeFileSync(pdf, "stored historical bytes");
    f.database.ensureSchema(f.db, { moduleIds: ["protokoll"] }); f.database.closeDatabase(); f.database.initDatabase();
    assert.deepEqual(snapshot(), before); assert.equal(fs.readFileSync(pdf, "utf8"), "stored historical bytes");
  }, { oldSql: legacy }));
  await run("Besprechungsreihen: migration rolls back duplicate-open legacy without closing records", () => protocolFixture(f => {
    const db = f.db;
    db.exec("DROP INDEX idx_meetings_one_open_per_series; INSERT INTO projects(id,name) VALUES('duplicates','Konflikt'); INSERT INTO meetings(id,project_id,meeting_index,is_closed) VALUES('a','duplicates',1,0),('b','duplicates',2,0)");
    const before = db.prepare("SELECT * FROM meetings WHERE project_id='duplicates' ORDER BY id").all();
    assert.throws(() => f.database.ensureSchema(db, { moduleIds: ["protokoll"] }), /Mehrere offene/);
    assert.deepEqual(db.prepare("SELECT * FROM meetings WHERE project_id='duplicates' ORDER BY id").all(), before);
  }));
  await run("Besprechungsreihen: three simultaneous number-one meetings and independent TOP trees survive restart", () => protocolFixture(f => {
    const p = f.repo.createProject({ name: "Drei Reihen", meeting_series_mask: 7 });
    const created = series.MEETING_SERIES.map(({ key }) => {
      const m = f.meetingService.createMeeting({ projectId: p.id, seriesKey: key });
      assert.equal(m.meeting_index, 1); assert.equal(m.series_key, key);
      assert.equal(f.meetingService.createMeeting({ projectId: p.id, seriesKey: key }).id, m.id);
      const top = f.topService.createTop({ projectId: p.id, meetingId: m.id, level: 1, title: key });
      const child = f.topService.createTop({ projectId: p.id, meetingId: m.id, parentTopId: top.id, level: 2, title: key + " Kind" });
      assert.equal(f.meetingService._buildTodoSnapshot(m).series_key, key);
      assert.equal(top.number, 1); assert.equal(child.number, 1); return { m, top, child };
    });
    assert.throws(() => f.topService.createTop({ projectId: p.id, meetingId: created[1].m.id, parentTopId: created[0].top.id, level: 2 }), /Besprechungsreihe/);
    assert.throws(() => f.meetingTops.attachTopToMeeting({ meetingId: created[1].m.id, topId: created[0].top.id }), /Besprechungsreihe/);
    assert.throws(() => f.meetingTops.carryOverFromMeeting(created[0].m.id, created[1].m.id), /Besprechungsreihe/);
    assert.throws(() => f.topService.moveTop({ topId: created[1].child.id, targetParentId: created[0].top.id }), /Besprechungsreihe/);
    assert.throws(() => f.topService.updateMeetingFields({ meetingId: created[0].m.id, topId: created[0].top.id,
      patch: { title: "Darf nicht geschrieben werden", completed_in_meeting_id: created[1].m.id } }), /Besprechungsreihe/);
    assert.equal(f.tops.getTopById(created[0].top.id).title, "construction");
    assert.throws(() => f.db.prepare("UPDATE meeting_tops SET completed_in_meeting_id=? WHERE meeting_id=? AND top_id=?")
      .run(created[1].m.id, created[0].m.id, created[0].top.id), /Besprechungsreihe/);
    for (const { m, child } of created) assert.equal(f.topService.listByMeeting(m.id).find(row => row.id === child.id).series_key, m.series_key);
    f.database.closeDatabase(); f.database.initDatabase();
    assert.equal(f.meetings.listByProject(p.id).filter(m => !m.is_closed).length, 3);
    for (const row of created) assert.equal(f.meetings.getMeetingById(row.m.id).is_closed, 0);
    assert.equal(f.database.initDatabase().pragma("integrity_check", { simple: true }), "ok");
  }));
  await run("Besprechungsreihen: completion carries once within its own series", () => protocolFixture(f => {
    const p = f.repo.createProject({ name: "Fortführung", meeting_series_mask: 7 });
    for (const { key } of series.MEETING_SERIES) {
      const m1 = f.meetingService.createMeeting({ projectId: p.id, seriesKey: key });
      const t = f.topService.createTop({ projectId: p.id, meetingId: m1.id, level: 1, title: key });
      f.topService.updateMeetingFields({ meetingId: m1.id, topId: t.id, patch: { status: "erledigt" } });
      f.meetings.closeMeeting(m1.id);
      const m2 = f.meetingService.createMeeting({ projectId: p.id, seriesKey: key });
      assert.equal(m2.meeting_index, 2); assert.equal(f.meetingTops.listJoinedByMeeting(m2.id).length, 1);
      assert.equal(f.meetingTops.getMeetingTop(m2.id, t.id).completed_in_meeting_id, m1.id);
      f.meetings.closeMeeting(m2.id); const m3 = f.meetingService.createMeeting({ projectId: p.id, seriesKey: key });
      assert.equal(f.meetingTops.listJoinedByMeeting(m3.id).length, 0);
    }
    const tasks = f.meetingTops.listLatestByProject(p.id); assert.equal(tasks.length, 3);
    assert.deepEqual(new Set(tasks.map(t => t.series_key)), new Set(["construction", "owner", "planning"]));
  }));
  await run("Besprechungsreihen: first extra series is empty, participants/distribution carry only own predecessor", () => protocolFixture(f => {
    participantHandlers(f);
    const p = f.repo.createProject({ name: "Teilnehmer", meeting_series_mask: 7 });
    for (const { key } of series.MEETING_SERIES) {
      const m1 = f.meetingService.createMeeting({ projectId: p.id, seriesKey: key });
      assert.equal(f.invoke("meetingParticipants:list", { meetingId: m1.id }).items.length, 0);
      // Raw neutral identities exercise real copy SQL; no production people needed.
      f.db.prepare("INSERT INTO meeting_participants(meeting_id,kind,person_id,is_present,is_in_distribution) VALUES(?,?,?,?,?)").run(m1.id, "global_person", key, 1, key === "owner" ? 0 : 1);
      f.meetings.closeMeeting(m1.id);
      const m2 = f.meetingService.createMeeting({ projectId: p.id, seriesKey: key });
      f.invoke("meetingParticipants:list", { meetingId: m2.id });
      const rows = f.db.prepare("SELECT person_id,is_present,is_in_distribution FROM meeting_participants WHERE meeting_id=?").all(m2.id);
      assert.deepEqual(rows, [{ person_id: key, is_present: 1, is_in_distribution: key === "owner" ? 0 : 1 }]);
      assert.equal(f.invoke("meetingParticipants:set", { meetingId: m2.id, items: [] }).ok, true);
      f.invoke("meetingParticipants:list", { meetingId: m2.id });
      assert.equal(f.db.prepare("SELECT COUNT(*) n FROM meeting_participants WHERE meeting_id=?").get(m2.id).n, 0);
    }
  }));
  await run("Besprechungsreihen: activation preserves history and optional builder remains NULL", () => protocolFixture(f => {
    const p = f.repo.createProject({ name: "Ohne Bauherr" }); assert.equal(p.bauherr_firm_id, null); assert.equal(p.meeting_series_mask, 1);
    assert.throws(() => f.meetingService.createMeeting({ projectId: p.id, seriesKey: "owner" }), /aktiviert/);
    f.repo.updateProject({ id: p.id, patch: { meeting_series_mask: 7 } });
    const m = f.meetingService.createMeeting({ projectId: p.id, seriesKey: "owner" });
    const t = f.topService.createTop({ projectId: p.id, meetingId: m.id, level: 1, title: "Bleibt" });
    f.repo.updateProject({ id: p.id, patch: { meeting_series_mask: 1, bauherr: null } });
    assert.throws(() => f.topService.updateMeetingFields({ meetingId: m.id, topId: t.id, patch: { status: "erledigt" } }), /aktiviert/);
    assert.equal(f.meetings.getMeetingById(m.id).is_closed, 0); assert.equal(f.tops.getTopById(t.id).title, "Bleibt");
    f.repo.updateProject({ id: p.id, patch: { meeting_series_mask: 7 } });
    assert.equal(f.meetingService.createMeeting({ projectId: p.id, seriesKey: "owner" }).id, m.id);
    assert.equal(f.repo.getById(p.id).bauherr_firm_id, null);
  }));
}
if (require.main === module) runMeetingSeriesTests(async (name, fn) => { await fn(); console.log("PASS " + name); }).catch(err => { console.error(err); process.exitCode = 1; });
module.exports = { runMeetingSeriesTests, protocolFixture, services };
