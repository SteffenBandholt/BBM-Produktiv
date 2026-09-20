"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const extract = require("extract-zip");
const { fixture, load, writeZip } = require("./plannedConstructionStart.test.cjs");
const { buildStoragePreviewPaths } = require("../../src/main/ipc/projectStoragePaths.js");

function register(ctx) {
  load("src/main/ipc/projectTransferIpc.js", ctx.dependencies).registerProjectTransferIpc();
  return {
    exportProject: id => ctx.invoke("projectTransfer:export", { id }),
    importProject: filePath => ctx.invoke("projectTransfer:import", { filePath }),
  };
}
function snapshot(db) {
  const order = { projects: "id", meetings: "id", tops: "id", meeting_tops: "meeting_id, top_id",
    meeting_participants: "meeting_id, kind, person_id", app_settings: "key" };
  return Object.fromEntries(["projects", "meetings", "tops", "meeting_tops", "meeting_participants", "app_settings"]
    .map(table => [table, db.prepare(`SELECT * FROM ${table} ORDER BY ${order[table]}`).all()]));
}
function candidate() {
  return {
    project: { id: "incoming", name: "Reihenarchiv", meeting_series_mask: 7 },
    meetings: [{ id: "m", project_id: "incoming", series_key: "owner", meeting_index: 1, is_closed: 0, title: "Erhalten" }],
    tops: [{ id: "t", project_id: "incoming", series_key: "owner", parent_top_id: null, level: 1, number: 1, title: "TOP erhalten" }],
    meetingTops: [{ meeting_id: "m", top_id: "t", status: "offen", longtext: "Inhalt erhalten" }],
    meetingParticipants: [],
  };
}
async function archive(ctx, payload, marker = 1) {
  const manifest = { formatVersion: 3, projectId: payload.project.id };
  if (marker !== "legacy") manifest.meetingSeriesSchemaVersion = marker;
  const file = path.join(ctx.root, "candidate.zip");
  await writeZip(file, {
    "manifest.json": JSON.stringify(manifest), "project-folder/": "",
    "data/project.json": JSON.stringify({ project: payload.project }),
    "data/meetings.json": JSON.stringify({ meetings: payload.meetings }),
    "data/tops.json": JSON.stringify({ tops: payload.tops }),
    "data/meeting_tops.json": JSON.stringify({ meeting_tops: payload.meetingTops }),
    "data/meeting_participants.json": JSON.stringify({ meeting_participants: payload.meetingParticipants }),
    "data/settings.json": JSON.stringify({ projectSettings: [] }),
    "data/project_firms.json": JSON.stringify({ project_firms: [] }),
    "data/project_persons.json": JSON.stringify({ project_persons: [] }),
    "data/project_candidates.json": JSON.stringify({ project_candidates: [] }),
    "data/project_global_firms.json": JSON.stringify({ project_global_firms: [] }),
    "data/global_firm_dependencies.json": JSON.stringify({ firms: [], persons: [] }),
    "data/restarbeiten_items.json": JSON.stringify({ restarbeiten_items: [] }),
    "data/restarbeiten_attachments.json": JSON.stringify({ restarbeiten_attachments: [] }),
    "data/restarbeiten_notes.json": JSON.stringify({ restarbeiten_notes: [] }),
    "project-folder/Protokolle/historisch.pdf": "historische gespeicherte PDF-Datei",
  });
  return file;
}

async function runMeetingSeriesTransferTests(run) {
  await run("Besprechungsreihen-Transfer: echter ZIP-Rundlauf erhält drei offene Nr. 1, TOPs, Teilnehmer und Dateien", () => fixture(async ctx => {
    const transfer = register(ctx);
    const project = ctx.repo.createProject({ name: "Drei Reihen", meeting_series_mask: 7 });
    ctx.db.prepare("INSERT INTO project_firms (id,project_id,name) VALUES ('local',?,'Projektfirma')").run(project.id);
    ctx.db.prepare("INSERT INTO project_persons (id,project_firm_id,name) VALUES ('person','local','Ansprechpartner')").run();
    const projectDir = path.dirname(buildStoragePreviewPaths({ baseDir: ctx.root, project }).previewDir);
    fs.mkdirSync(path.join(projectDir, "Protokolle"), { recursive: true });
    for (const key of ["construction", "owner", "planning"]) {
      ctx.db.prepare("INSERT INTO meetings (id,project_id,series_key,meeting_index,title,is_closed) VALUES (?,?,?,1,?,0)")
        .run(`m-${key}`, project.id, key, `Historie ${key}`);
      ctx.db.prepare("INSERT INTO tops (id,project_id,series_key,level,number,title) VALUES (?,?,?,1,1,?)")
        .run(`t-${key}`, project.id, key, `TOP ${key}`);
      ctx.db.prepare("INSERT INTO tops (id,project_id,series_key,parent_top_id,level,number,title) VALUES (?,?,?,?,2,1,?)")
        .run(`child-${key}`, project.id, key, `t-${key}`, `Kind ${key}`);
      for (const topId of [`t-${key}`, `child-${key}`]) {
        ctx.db.prepare("INSERT INTO meeting_tops (meeting_id,top_id,status,longtext,is_task,is_decision) VALUES (?,?,'offen',?,1,1)")
          .run(`m-${key}`, topId, `Inhalt ${topId}`);
      }
      if (key !== "planning") {
        ctx.db.prepare("INSERT INTO meeting_participants (meeting_id,kind,person_id,is_present,is_in_distribution) VALUES (?,'project_person','person',?,?)")
          .run(`m-${key}`, key === "construction" ? 1 : 0, key === "owner" ? 1 : 0);
      }
      fs.writeFileSync(path.join(projectDir, "Protokolle", `${key}-Nr1.pdf`), `gespeicherte PDF ${key}`);
    }
    const before = snapshot(ctx.db);
    const exported = await transfer.exportProject(project.id);
    assert.equal(exported.ok, true, exported.error);
    assert.equal(ctx.repo.getById(project.id), undefined);
    const unpacked = path.join(ctx.root, "inspect"); await extract(exported.exportPath, { dir: unpacked });
    const manifest = JSON.parse(fs.readFileSync(path.join(unpacked, "manifest.json"), "utf8"));
    assert.equal(manifest.formatVersion, 3);
    assert.equal(manifest.meetingSeriesSchemaVersion, 1);
    assert.equal(fs.existsSync(path.join(unpacked, "data/sigeko_projects.json")), false);
    assert.equal(JSON.parse(fs.readFileSync(path.join(unpacked, "data/project.json"), "utf8")).project.meeting_series_mask, 7);
    const imported = await transfer.importProject(exported.exportPath); assert.equal(imported.ok, true, imported.error);
    const after = snapshot(ctx.db);
    for (const table of ["projects", "meetings", "tops", "meeting_tops", "meeting_participants"]) {
      assert.deepEqual(after[table], before[table], table);
    }
    assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM meetings WHERE is_closed=0").get().n, 3);
    assert.equal(ctx.db.prepare("SELECT value FROM app_settings WHERE key='meetingParticipants.initialized.m-planning'").get().value, "1");
    for (const key of ["construction", "owner", "planning"]) {
      assert.equal(fs.readFileSync(path.join(projectDir, "Protokolle", `${key}-Nr1.pdf`), "utf8"), `gespeicherte PDF ${key}`);
    }
    ctx.database.closeDatabase();
    const reopened = ctx.database.initDatabase();
    assert.equal(reopened.prepare("SELECT COUNT(*) n FROM meetings WHERE is_closed=0").get().n, 3);
    assert.equal(reopened.pragma("integrity_check", { simple: true }), "ok");
  }, { modules: ["protokoll"] }));

  await run("Besprechungsreihen-Transfer: Altarchiv wird ohne Nummern-/Inhaltsverlust construction zugeordnet", () => fixture(async ctx => {
    const transfer = register(ctx); const payload = candidate();
    delete payload.project.meeting_series_mask;
    for (const row of [...payload.meetings, ...payload.tops]) delete row.series_key;
    payload.meetings[0].meeting_index = 8; payload.tops[0].number = 4;
    const result = await transfer.importProject(await archive(ctx, payload, "legacy")); assert.equal(result.ok, true, result.error);
    assert.equal(ctx.repo.getById("incoming").meeting_series_mask, 1);
    const meeting = ctx.db.prepare("SELECT * FROM meetings WHERE id='m'").get();
    assert.equal(meeting.series_key, "construction"); assert.equal(meeting.meeting_index, 8); assert.equal(meeting.title, "Erhalten");
    const top = ctx.db.prepare("SELECT * FROM tops WHERE id='t'").get();
    assert.equal(top.series_key, "construction"); assert.equal(top.number, 4); assert.equal(top.title, "TOP erhalten");
    assert.equal(ctx.db.prepare("SELECT longtext FROM meeting_tops WHERE top_id='t'").get().longtext, "Inhalt erhalten");
    assert.equal(ctx.db.prepare("SELECT value FROM app_settings WHERE key='meetingParticipants.initialized.m'").get().value, "1");
    assert.equal(fs.readFileSync(path.join(ctx.root, "bbm", "Reihenarchiv", "Protokolle", "historisch.pdf"), "utf8"), "historische gespeicherte PDF-Datei");
    ctx.database.closeDatabase(); assert.equal(ctx.database.initDatabase().prepare("SELECT meeting_index FROM meetings WHERE id='m'").get().meeting_index, 8);
  }, { modules: ["protokoll"] }));

  await run("Besprechungsreihen-Transfer: beschädigte Keys/Parents/Zuordnungen und doppelte offene Protokolle stoppen vor Writes", () => fixture(async ctx => {
    const transfer = register(ctx); const before = snapshot(ctx.db);
    const mutations = [
      p => { delete p.project.meeting_series_mask; }, p => { p.project.meeting_series_mask = "7"; },
      p => { p.project.meeting_series_mask = 8; }, p => { p.meetings[0].series_key = null; },
      p => { delete p.tops[0].series_key; }, p => { p.meetings[0].series_key = "client"; },
      p => { p.meetings[0].project_id = "foreign"; }, p => { p.tops[0].project_id = "foreign"; },
      p => { p.tops[0].series_key = "construction"; }, p => { p.tops[0].parent_top_id = "missing"; },
      p => { p.tops[0].parent_top_id = "t"; },
      p => { p.tops.push({ ...p.tops[0], id: "parent", series_key: "planning" }); p.tops[0].parent_top_id = "parent"; },
      p => { p.meetings.push({ ...p.meetings[0], id: "m2", meeting_index: 2 }); },
      p => { p.meetings.push({ ...p.meetings[0], id: "m2", is_closed: 1 }); },
      p => { p.meetingTops[0].meeting_id = "foreign"; }, p => { p.meetingTops[0].top_id = "foreign"; },
      p => { p.meetingTops[0].completed_in_meeting_id = "foreign"; },
      p => { p.meetingParticipants.push({ meeting_id: "foreign", kind: "project_person", person_id: "person" }); },
      p => { p.tops.push({ ...p.tops[0] }); }, p => { p.meetingTops.push({ ...p.meetingTops[0] }); },
    ];
    for (const mutate of mutations) {
      const payload = candidate(); mutate(payload);
      const result = await transfer.importProject(await archive(ctx, payload)); assert.equal(result.ok, false, JSON.stringify(payload));
      assert.deepEqual(snapshot(ctx.db), before);
      assert.equal(fs.existsSync(path.join(ctx.root, "bbm", "Reihenarchiv")), false);
    }
    for (const marker of [0, 2, "1", null]) {
      assert.equal((await transfer.importProject(await archive(ctx, candidate(), marker))).ok, false);
      assert.deepEqual(snapshot(ctx.db), before);
    }
  }, { modules: ["protokoll"] }));

  await run("Besprechungsreihen-Transfer: markerlose neue Reihenfelder werden nicht still als Altbestand umgedeutet", () => fixture(async ctx => {
    const transfer = register(ctx); const before = snapshot(ctx.db);
    for (const mutate of [p => {}, p => { p.project.meeting_series_mask = 1; },
      p => { p.project.meeting_series_mask = 1; p.meetings[0].series_key = "construction"; },
      p => { p.project.meeting_series_mask = "1"; }]) {
      const payload = candidate(); mutate(payload);
      const result = await transfer.importProject(await archive(ctx, payload, "legacy")); assert.equal(result.ok, false);
      assert.deepEqual(snapshot(ctx.db), before);
    }
  }, { modules: ["protokoll"] }));

  await run("Besprechungsreihen-Transfer: bestehende Meeting-/TOP-IDs bleiben bei kollidierendem Import unverändert", () => fixture(async ctx => {
    const transfer = register(ctx); const project = ctx.repo.createProject({ name: "Bestehend" });
    ctx.db.prepare("INSERT INTO meetings (id,project_id,meeting_index) VALUES ('m',?,1)").run(project.id);
    const before = snapshot(ctx.db);
    assert.equal((await transfer.importProject(await archive(ctx, candidate()))).ok, false);
    assert.deepEqual(snapshot(ctx.db), before);
    assert.equal(fs.existsSync(path.join(ctx.root, "bbm", "Reihenarchiv")), false);
  }, { modules: ["protokoll"] }));

  await run("Besprechungsreihen-Transfer: bewusst leere aktuelle Teilnehmer bleiben nach ZIP-Import trotz Vorgänger leer", () => fixture(async ctx => {
    const transfer = register(ctx); const project = ctx.repo.createProject({ name: "Leere Teilnehmer", meeting_series_mask: 2 });
    ctx.db.prepare("INSERT INTO project_firms (id,project_id,name) VALUES ('local',?,'Projektfirma')").run(project.id);
    ctx.db.prepare("INSERT INTO project_persons (id,project_firm_id,name) VALUES ('person','local','Teilnehmer')").run();
    ctx.db.prepare("INSERT INTO meetings (id,project_id,series_key,meeting_index,is_closed) VALUES ('previous',?,'owner',1,1),('current',?,'owner',2,0)")
      .run(project.id, project.id);
    ctx.db.prepare("INSERT INTO meeting_participants (meeting_id,kind,person_id,is_present,is_in_distribution) VALUES ('previous','project_person','person',1,1)").run();
    const exported = await transfer.exportProject(project.id); assert.equal(exported.ok, true, exported.error);
    const imported = await transfer.importProject(exported.exportPath); assert.equal(imported.ok, true, imported.error);
    load("src/main/ipc/participantsIpc.js", ctx.dependencies).registerParticipantsIpc({ ipcMain: ctx.dependencies.electron.ipcMain, includeProject: false });
    for (let i = 0; i < 2; i += 1) {
      const participants = ctx.invoke("meetingParticipants:list", { meetingId: "current" });
      assert.equal(participants.ok, true, participants.error); assert.deepEqual(participants.items, []);
    }
    assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM meeting_participants WHERE meeting_id='previous'").get().n, 1);
  }, { modules: ["protokoll"] }));
}

module.exports = { runMeetingSeriesTransferTests };
if (require.main === module) runMeetingSeriesTransferTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
