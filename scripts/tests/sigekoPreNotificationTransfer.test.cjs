"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const extract = require("extract-zip");
const { fixture, load, writeZip } = require("./plannedConstructionStart.test.cjs");
const { PRE_NOTIFICATION_COLUMNS } = require("../../src/shared/sigeko/preNotifications.cjs");
const { AUTHORITY_COLUMNS } = require("../../src/shared/sigeko/authorities.cjs");
const { PROJECT_AUTHORITY_COLUMNS } = require("../../src/shared/sigeko/projectAuthorities.cjs");

function register(ctx) {
  load("src/main/ipc/projectTransferIpc.js", ctx.dependencies).registerProjectTransferIpc();
  return { exportProject: id => ctx.invoke("projectTransfer:export", { id }),
    importProject: filePath => ctx.invoke("projectTransfer:import", { filePath }) };
}
function draft(projectId = "imported") {
  return { ...Object.fromEntries(PRE_NOTIFICATION_COLUMNS.map(key => [key, null])), id: "va-draft", project_id: projectId,
    building_type_override: "Umbau mit Teilbetrieb", planned_start_override: "2028-02-29", duration_months: 17,
    max_workers: 21, employer_count: 4, self_employed_count: 0, firms_mode: "unknown", third_party_mode: "free",
    third_party_name: "Beauftragter Dritter", third_party_street: "Bauweg 1", third_party_zip: "12345", third_party_city: "Ort",
    third_party_phone: "040123", third_party_email: "dritter@example.invalid", revision: 5,
    created_at: "2026-09-09T12:00:00.000Z", updated_at: "2026-09-10T12:00:00.000Z" };
}
function assignment(projectId) {
  const source = { ...Object.fromEntries(AUTHORITY_COLUMNS.map(key => [key, null])), id: "authority", category: "LABOR_AUTHORITY",
    organization: "Baustellenamt", verification_status: "unverified", revision: 1,
    created_at: "2026-09-09T12:00:00.000Z", updated_at: "2026-09-09T12:00:00.000Z" };
  return { id: "assignment", project_id: projectId, category: source.category, source_id: source.id, source_revision: 1,
    snapshot_json: JSON.stringify(source, null, 2), address_street: "Bauweg 1", address_zip: "12345", address_city: "Ort",
    assessment_status: "uncertain", assessment_method: "manual", assessment_note: "Noch prüfen", match_context_hash: "b".repeat(64),
    revision: 2, created_at: source.created_at, updated_at: source.updated_at };
}
function insert(db, table, columns, row) {
  db.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`).run(columns.map(key => row[key]));
}
function parts(rows = [draft()]) {
  const collections = {
    "settings.json": ["projectSettings", "projectSettings"], "meetings.json": ["meetings", "meetings"],
    "tops.json": ["tops", "tops"], "meeting_tops.json": ["meeting_tops", "meetingTops"],
    "meeting_participants.json": ["meeting_participants", "meetingParticipants"],
    "project_firms.json": ["project_firms", "projectFirms"], "project_persons.json": ["project_persons", "projectPersons"],
    "project_candidates.json": ["project_candidates", "projectCandidates"],
    "project_global_firms.json": ["project_global_firms", "projectGlobalFirms"],
    "restarbeiten_items.json": ["restarbeiten_items", "restarbeitenItems"],
    "restarbeiten_attachments.json": ["restarbeiten_attachments", "restarbeitenAttachments"],
    "restarbeiten_notes.json": ["restarbeiten_notes", "restarbeitenNotes"],
    "sigeko_project_authorities.json": ["sigeko_project_authorities", "sigekoProjectAuthorities"],
  };
  const result = { "project-folder/": "", "data/project.json": { project: { id: "imported", name: "Vorankündigungsarchiv" } },
    "data/global_firm_dependencies.json": { firms: [], persons: [] },
    "data/sigeko_pre_notifications.json": { sigeko_pre_notifications: rows } };
  const counts = { sigekoProjects: 0, sigekoPreNotifications: rows.length, globalFirmDependencies: 0, globalPersonDependencies: 0, filesCount: 0 };
  for (const [file, [key, count]] of Object.entries(collections)) { result[`data/${file}`] = { [key]: [] }; counts[count] = 0; }
  result["manifest.json"] = { formatVersion: 7, projectId: "imported", counts };
  return result;
}
async function archive(ctx, candidate) {
  const file = path.join(ctx.root, "candidate.zip");
  await writeZip(file, Object.fromEntries(Object.entries(candidate).map(([name, value]) => [name, typeof value === "string" ? value : JSON.stringify(value)])));
  return file;
}
function domainRows(ctx) {
  const tables = ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  return Object.fromEntries(tables.map(({ name }) => [name, ctx.db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all()]));
}
async function rejected(ctx, transfer, candidate, pattern) {
  const before = domainRows(ctx);
  const result = await transfer.importProject(await archive(ctx, candidate));
  assert.equal(result.ok, false, JSON.stringify(result));
  if (pattern) assert.match(result.error, pattern);
  assert.deepEqual(domainRows(ctx), before);
}
async function runSigekoPreNotificationTransferTests(run) {
  for (const authorities of [false, true]) for (const rolesAndBuilder of [false, true]) {
    await run(`S5.1-Transfer: V7 roundtrip preserves draft with authorities=${authorities}, roles/builder=${rolesAndBuilder}`, () => fixture(async ctx => {
      const transfer = register(ctx); const p = ctx.repo.createProject({ name: "Vorankündigung" });
      if (rolesAndBuilder) {
        ctx.db.prepare("INSERT INTO project_firms (id,project_id,name) VALUES ('builder',?,'Bauherr')").run(p.id);
        ctx.repo.updateProject({ id: p.id, patch: { bauherr: { kind: "project_firm", id: "builder" } } });
        ctx.db.prepare("INSERT INTO sigeko_projects (id,project_id,planning_source,execution_same_as_planning,created_at,updated_at) VALUES ('roles',?,'module',1,'2026-09-09','2026-09-09')").run(p.id);
      }
      const row = draft(p.id); insert(ctx.db, "sigeko_pre_notifications", PRE_NOTIFICATION_COLUMNS, row);
      const authority = assignment(p.id);
      if (authorities) insert(ctx.db, "sigeko_project_authorities", PROJECT_AUTHORITY_COLUMNS, authority);
      const other = ctx.repo.createProject({ name: "Anderes Projekt" });
      const otherDraft = { ...draft(other.id), id: "other-va", duration_months: 3 }; insert(ctx.db, "sigeko_pre_notifications", PRE_NOTIFICATION_COLUMNS, otherDraft);
      const exported = await transfer.exportProject(p.id); assert.equal(exported.ok, true, exported.error);
      assert.equal(ctx.repo.getById(p.id), undefined);
      assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_pre_notifications").all(), [otherDraft]);
      const unpacked = path.join(ctx.root, "inspect"); await extract(exported.exportPath, { dir: unpacked });
      const manifest = JSON.parse(fs.readFileSync(path.join(unpacked, "manifest.json")));
      assert.equal(manifest.formatVersion, 7); assert.equal(manifest.counts.sigekoPreNotifications, 1);
      assert.equal(manifest.counts.sigekoProjectAuthorities, authorities ? 1 : 0);
      assert.equal(manifest.counts.sigekoProjects, rolesAndBuilder ? 1 : 0);
      assert.deepEqual(JSON.parse(fs.readFileSync(path.join(unpacked, "data/sigeko_pre_notifications.json"))), { sigeko_pre_notifications: [row] });
      assert.equal(fs.existsSync(path.join(unpacked, "data/sigeko_authority_records.json")), false);
      const imported = await transfer.importProject(exported.exportPath); assert.equal(imported.ok, true, imported.error);
      assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_pre_notifications WHERE project_id=?").get(p.id), row);
      assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_pre_notifications WHERE project_id=?").get(other.id), otherDraft);
      assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_project_authorities").all(), authorities ? [authority] : []);
      assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM sigeko_authority_records").get().n, 0);
      assert.equal(ctx.repo.getById(p.id).bauherr_firm_id, rolesAndBuilder ? "builder" : null);
      ctx.database.closeDatabase(); const db = ctx.database.initDatabase();
      assert.deepEqual(db.prepare("SELECT * FROM sigeko_pre_notifications WHERE project_id=?").get(p.id), row);
      assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
    }, { modules: ["sigeko"] }));
  }
  await run("S5.1-Transfer: empty draft remains empty and can exist without roles or authority assignments", () => fixture(async ctx => {
    const row = { ...Object.fromEntries(PRE_NOTIFICATION_COLUMNS.map(key => [key, null])), id: "va-draft", project_id: "imported",
      firms_mode: "unknown", third_party_mode: "none", revision: 1, created_at: "2026-09-09T12:00:00.000Z", updated_at: "2026-09-09T12:00:00.000Z" };
    const result = await register(ctx).importProject(await archive(ctx, parts([row]))); assert.equal(result.ok, true, result.error);
    assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_pre_notifications").get(), row);
    assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM sigeko_projects").get().n, 0);
  }, { modules: ["sigeko"] }));
  await run("S5.1-Transfer: malformed draft fields, unknown columns and foreign project references reject without writes", () => fixture(async ctx => {
    const transfer = register(ctx);
    const mutations = [row => { delete row.duration_months; }, row => { row.injected = true; }, row => { row.id = ""; },
      row => { row.project_id = "foreign"; }, row => { row.revision = 0; }, row => { row.duration_months = 1.5; },
      row => { row.duration_months = 0; }, row => { row.max_workers = -1; }, row => { row.employer_count = "4"; },
      row => { row.self_employed_count = Number.MAX_SAFE_INTEGER + 1; }, row => { row.planned_start_override = "2027-02-29"; },
      row => { row.third_party_mode = "unknown"; }, row => { row.third_party_mode = "none"; }, row => { row.firms_mode = "auto"; }];
    for (const mutate of mutations) { const candidate = parts(); mutate(candidate["data/sigeko_pre_notifications.json"].sigeko_pre_notifications[0]); await rejected(ctx, transfer, candidate); }
  }, { modules: ["sigeko"] }));
  await run("S5.1-Transfer: duplicate and excessive drafts reject atomically", () => fixture(async ctx => {
    const transfer = register(ctx);
    for (const rows of [[draft(), draft()], [draft(), { ...draft(), id: "second" }]]) await rejected(ctx, transfer, parts(rows));
  }, { modules: ["sigeko"] }));
  await run("S5.1-Transfer: missing, corrupt, unknown, downgraded and future payloads never silently disappear", () => fixture(async ctx => {
    const transfer = register(ctx);
    const mutations = [p => { delete p["data/sigeko_pre_notifications.json"]; }, p => { p["data/sigeko_pre_notifications.json"] = "{"; },
      p => { p["data/sigeko_pre_notifications.json"] = {}; }, p => { p["data/sigeko_pre_notifications.json"].extra = []; },
      p => { p["data/sigeko_pre_notifications.json"].sigeko_pre_notifications = null; }, p => { p["data/sigeko_pre_notifications.json"].sigeko_pre_notifications = []; },
      p => { delete p["data/sigeko_project_authorities.json"]; }, p => { delete p["data/settings.json"]; },
      p => { p["data/meetings.json"] = "{"; }, p => { p["data/sigeko_future.json"] = { future: [] }; },
      p => { p["data/sigeko_pre_notifications/child.json"] = {}; },
      ...[1, 2, 3, 4, 5, 6, 8, "7"].map(version => p => { p["manifest.json"].formatVersion = version; })];
    for (const mutate of mutations) { const candidate = parts(); mutate(candidate); await rejected(ctx, transfer, candidate); }
  }, { modules: ["sigeko"] }));
  await run("S5.1-Transfer: every V7 count and manifest project identity is checked before mutation", () => fixture(async ctx => {
    const transfer = register(ctx);
    for (const key of Object.keys(parts()["manifest.json"].counts)) for (const value of [undefined, -1, "0", 999]) {
      const candidate = parts(); candidate["manifest.json"].counts[key] = value; await rejected(ctx, transfer, candidate, /V7-Manifest/);
    }
    for (const mutate of [p => { p["manifest.json"].projectId = "foreign"; }, p => { p["manifest.json"].counts.extra = 0; },
      p => { p["project-folder/unlisted.txt"] = "Ungezählte Datei"; }]) {
      const candidate = parts(); mutate(candidate); await rejected(ctx, transfer, candidate, /V7-Manifest/);
    }
  }, { modules: ["sigeko"] }));
  await run("S5.1-Transfer: absent and incompatible draft schema fail clearly before import writes", async () => {
    for (const incompatible of [false, true]) await fixture(async ctx => {
      if (incompatible) ctx.db.exec("ALTER TABLE sigeko_pre_notifications DROP COLUMN building_type_override");
      const transfer = register(ctx); await rejected(ctx, transfer, parts(), /aktiviert und initialisiert/);
    }, { modules: incompatible ? ["sigeko"] : [] });
  });
  await run("S5.1-Transfer: project and draft ID collisions preserve existing data", () => fixture(async ctx => {
    const transfer = register(ctx);
    ctx.db.prepare("INSERT INTO projects (id,name) VALUES ('imported','Bestehendes Projekt')").run();
    await rejected(ctx, transfer, parts(), /existiert bereits/); ctx.repo.deleteForever("imported");
    const other = ctx.repo.createProject({ name: "Anderes Projekt" }); insert(ctx.db, "sigeko_pre_notifications", PRE_NOTIFICATION_COLUMNS, draft(other.id));
    await rejected(ctx, transfer, parts(), /Vorankündigung existiert bereits/);
  }, { modules: ["sigeko"] }));
  await run("S5.1-Transfer: downstream insertion failure rolls back the project and draft together", () => fixture(async ctx => {
    const candidate = parts(); candidate["data/project_candidates.json"].project_candidates = [{ impossible_column: true }];
    candidate["manifest.json"].counts.projectCandidates = 1;
    await rejected(ctx, register(ctx), candidate, /impossible_column/);
  }, { modules: ["sigeko"] }));
  await run("S5.1-Transfer: invalid stored draft prevents destructive export and retains files", () => fixture(async ctx => {
    const p = ctx.repo.createProject({ name: "Projekt behalten" }); insert(ctx.db, "sigeko_pre_notifications", PRE_NOTIFICATION_COLUMNS, draft(p.id));
    ctx.db.exec("PRAGMA ignore_check_constraints=ON");
    ctx.db.prepare("UPDATE sigeko_pre_notifications SET planned_start_override='2027-02-29'").run();
    ctx.db.exec("PRAGMA ignore_check_constraints=OFF");
    const before = domainRows(ctx);
    const storage = require("../../src/main/ipc/projectStoragePaths.js").buildStoragePreviewPaths({ baseDir: ctx.root, project: p });
    const folder = path.dirname(storage.previewDir); fs.mkdirSync(folder, { recursive: true }); fs.writeFileSync(path.join(folder, "keep.txt"), "Behalten");
    const result = await register(ctx).exportProject(p.id); assert.equal(result.ok, false);
    assert.deepEqual(domainRows(ctx), before); assert.equal(fs.readFileSync(path.join(folder, "keep.txt"), "utf8"), "Behalten");
    assert.equal(fs.existsSync(path.join(ctx.root, "bbm/export")), false);
  }, { modules: ["sigeko"] }));
  await run("S5.1-Transfer: exports without a draft retain V3 through V6 selection", async () => {
    for (const version of [3, 4, 5, 6]) await fixture(async ctx => {
      const p = ctx.repo.createProject({ name: `Historische Version ${version}` });
      if (version === 4) ctx.db.prepare("INSERT INTO sigeko_projects (id,project_id,planning_source,execution_same_as_planning,created_at,updated_at) VALUES ('roles',?,'module',1,'2026-09-09','2026-09-09')").run(p.id);
      if (version === 5) {
        ctx.db.prepare("INSERT INTO project_firms (id,project_id,name) VALUES ('builder',?,'Bauherr')").run(p.id);
        ctx.repo.updateProject({ id: p.id, patch: { bauherr: { kind: "project_firm", id: "builder" } } });
      }
      if (version === 6) insert(ctx.db, "sigeko_project_authorities", PROJECT_AUTHORITY_COLUMNS, assignment(p.id));
      const transfer = register(ctx); const result = await transfer.exportProject(p.id); assert.equal(result.ok, true, result.error);
      const target = path.join(ctx.root, "inspect"); await extract(result.exportPath, { dir: target });
      const manifest = JSON.parse(fs.readFileSync(path.join(target, "manifest.json"))); assert.equal(manifest.formatVersion, version);
      assert.equal(Object.hasOwn(manifest.counts, "sigekoPreNotifications"), false);
      assert.equal(fs.existsSync(path.join(target, "data/sigeko_pre_notifications.json")), false);
      const imported = await transfer.importProject(result.exportPath); assert.equal(imported.ok, true, imported.error);
    }, { modules: ["sigeko"] });
  });
}
module.exports = { runSigekoPreNotificationTransferTests };
if (require.main === module) runSigekoPreNotificationTransferTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
