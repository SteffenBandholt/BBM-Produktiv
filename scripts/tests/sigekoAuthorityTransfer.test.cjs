"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const extract = require("extract-zip");
const { fixture, load, writeZip } = require("./plannedConstructionStart.test.cjs");
const { AUTHORITY_COLUMNS } = require("../../src/shared/sigeko/authorities.cjs");
const { PROJECT_AUTHORITY_COLUMNS } = require("../../src/shared/sigeko/projectAuthorities.cjs");

function register(ctx) {
  load("src/main/ipc/projectTransferIpc.js", ctx.dependencies).registerProjectTransferIpc();
  return { exportProject: id => ctx.invoke("projectTransfer:export", { id }),
    importProject: filePath => ctx.invoke("projectTransfer:import", { filePath }) };
}
function source(category = "LABOR_AUTHORITY") {
  return { ...Object.fromEntries(AUTHORITY_COLUMNS.map(key => [key, null])), id: `source-${category}`, category,
    organization: "Geprüfte Stelle", street: "Behördenweg 2", zip: "12345", city: "Ort", phone: "040123", emergency_phone: "040456",
    source: "https://example.invalid/amt", scope_street: "Bauweg 1", scope_zip: "12345", scope_city: "Ort",
    verification_note: "Zuständigkeit für konkrete Baustellenadresse geprüft", verification_status: "confirmed",
    verified_at: "2026-09-09T12:00:00.000Z", verification_method: "manual", revision: 3,
    created_at: "2026-09-01T12:00:00.000Z", updated_at: "2026-09-09T12:00:00.000Z" };
}
function assignment(projectId = "imported", category = "LABOR_AUTHORITY") {
  const record = source(category);
  return { id: `assignment-${category}`, project_id: projectId, category, source_id: record.id, source_revision: record.revision,
    snapshot_json: JSON.stringify(record, null, 2), address_street: "Bauweg 1", address_zip: "12345", address_city: "Ort",
    match_context_hash: "a".repeat(64), assessment_status: "confirmed", assessment_method: "manual", assessment_note: "Konkrete Baustelle fachlich geprüft",
    revision: 2, created_at: "2026-09-09T12:00:00.000Z", updated_at: "2026-09-09T12:00:00.000Z" };
}
function insertAssignment(db, row) {
  db.prepare(`INSERT INTO sigeko_project_authorities (${PROJECT_AUTHORITY_COLUMNS.join(",")}) VALUES (${PROJECT_AUTHORITY_COLUMNS.map(() => "?").join(",")})`)
    .run(PROJECT_AUTHORITY_COLUMNS.map(key => row[key]));
}
function parts(rows = [assignment()]) {
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
  };
  const result = { "project-folder/": "", "data/project.json": { project: { id: "imported", name: "Behördenarchiv" } },
    "data/global_firm_dependencies.json": { firms: [], persons: [] },
    "data/sigeko_project_authorities.json": { sigeko_project_authorities: rows } };
  const counts = { sigekoProjects: 0, sigekoProjectAuthorities: rows.length, globalFirmDependencies: 0, globalPersonDependencies: 0, filesCount: 0 };
  for (const [file, [key, count]] of Object.entries(collections)) { result[`data/${file}`] = { [key]: [] }; counts[count] = 0; }
  result["manifest.json"] = { formatVersion: 6, projectId: "imported", counts };
  return result;
}
async function archive(ctx, candidate) {
  const file = path.join(ctx.root, "candidate.zip");
  await writeZip(file, Object.fromEntries(Object.entries(candidate).map(([name, value]) => [name, typeof value === "string" ? value : JSON.stringify(value)])));
  return file;
}
function domainRows(ctx) {
  return Object.fromEntries(["projects", "project_firms", "project_persons", "sigeko_projects", "sigeko_project_authorities", "sigeko_authority_records"]
    .map(table => [table, ctx.db.prepare(`SELECT * FROM ${table} ORDER BY id`).all()]));
}
async function rejected(ctx, transfer, candidate, pattern) {
  const before = domainRows(ctx);
  const result = await transfer.importProject(await archive(ctx, candidate));
  assert.equal(result.ok, false, JSON.stringify(result));
  if (pattern) assert.match(result.error, pattern);
  assert.deepEqual(domainRows(ctx), before);
}
async function runSigekoAuthorityTransferTests(run) {
  for (const builder of [false, true]) for (const roles of [false, true]) {
    await run(`S4.2-Transfer: V6 roundtrip preserves snapshots with builder=${builder}, roles=${roles}`, () => fixture(async ctx => {
      const transfer = register(ctx); const p = ctx.repo.createProject({ name: "Snapshotprojekt" });
      if (builder) {
        ctx.db.prepare("INSERT INTO project_firms (id,project_id,name) VALUES ('builder',?,'Projektbauherr')").run(p.id);
        ctx.repo.updateProject({ id: p.id, patch: { bauherr: { kind: "project_firm", id: "builder" } } });
      }
      if (roles) ctx.db.prepare("INSERT INTO sigeko_projects (id,project_id,planning_source,execution_same_as_planning,created_at,updated_at) VALUES ('roles',?,'module',1,'2026-09-09','2026-09-09')").run(p.id);
      const row = assignment(p.id); insertAssignment(ctx.db, row);
      const record = source();
      ctx.db.prepare(`INSERT INTO sigeko_authority_records (${AUTHORITY_COLUMNS.join(",")}) VALUES (${AUTHORITY_COLUMNS.map(() => "?").join(",")})`).run(AUTHORITY_COLUMNS.map(key => record[key]));
      const exported = await transfer.exportProject(p.id); assert.equal(exported.ok, true, exported.error);
      assert.equal(ctx.repo.getById(p.id), undefined);
      assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM sigeko_project_authorities").get().n, 0);
      assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_authority_records").get(), record);
      const unpacked = path.join(ctx.root, "inspect"); await extract(exported.exportPath, { dir: unpacked });
      const manifest = JSON.parse(fs.readFileSync(path.join(unpacked, "manifest.json")));
      assert.equal(manifest.formatVersion, 6); assert.equal(manifest.counts.sigekoProjectAuthorities, 1);
      assert.equal(manifest.counts.sigekoProjects, roles ? 1 : 0);
      assert.equal(fs.existsSync(path.join(unpacked, "data/sigeko_authority_records.json")), false);
      assert.equal(JSON.parse(fs.readFileSync(path.join(unpacked, "data/sigeko_project_authorities.json"))).sigeko_project_authorities[0].snapshot_json, row.snapshot_json);
      // A recipient without the reusable stock must retain the historical copy.
      ctx.db.prepare("DELETE FROM sigeko_authority_records").run();
      const imported = await transfer.importProject(exported.exportPath); assert.equal(imported.ok, true, imported.error);
      assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_project_authorities").get(), row);
      assert.equal(ctx.repo.getById(p.id).bauherr_firm_id, builder ? "builder" : null);
      assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM sigeko_projects").get().n, roles ? 1 : 0);
      assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM sigeko_authority_records").get().n, 0);
      ctx.database.closeDatabase(); const reopened = ctx.database.initDatabase();
      assert.equal(reopened.prepare("SELECT snapshot_json FROM sigeko_project_authorities").get().snapshot_json, row.snapshot_json);
      assert.equal(reopened.pragma("integrity_check", { simple: true }), "ok");
    }, { modules: ["sigeko"] }));
  }
  await run("S4.2-Transfer: all seven categories retain uncertain assessment and explicit snapshot bytes", () => fixture(async ctx => {
    const transfer = register(ctx);
    const categories = ["LABOR_AUTHORITY", "HOSPITAL", "ACCIDENT_DOCTOR", "WATER", "ELECTRICITY", "GAS", "POLICE"];
    const rows = categories.map(category => ({ ...assignment("imported", category), assessment_status: "uncertain", assessment_note: "Lokale Zuständigkeit noch prüfen" }));
    const result = await transfer.importProject(await archive(ctx, parts(rows))); assert.equal(result.ok, true, result.error);
    assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_project_authorities ORDER BY category").all(), rows.sort((a, b) => a.category.localeCompare(b.category)));
  }, { modules: ["sigeko"] }));
  await run("S4.2-Transfer: malformed schemas, IDs, project references and snapshot identities reject before writes", () => fixture(async ctx => {
    const transfer = register(ctx);
    const mutations = [row => { delete row.assessment_note; }, row => { row.unexpected = "unsafe"; }, row => { row.project_id = "foreign"; },
      row => { row.category = "EMERGENCY_112"; }, row => { row.id = ""; }, row => { row.source_revision = 0; },
      row => { row.revision = 1.5; }, row => { row.match_context_hash = "invalid"; },
      row => { row.match_context_hash = null; }, row => { row.assessment_status = "green"; }, row => { row.assessment_method = "ai"; },
      row => { row.assessment_note = " "; }, row => { row.snapshot_json = "{"; },
      row => { row.snapshot_json = JSON.stringify({ ...source(), id: "different" }); },
      row => { row.snapshot_json = JSON.stringify({ ...source(), category: "POLICE" }); },
      row => { row.snapshot_json = JSON.stringify({ ...source(), revision: 4 }); },
      row => { row.snapshot_json = JSON.stringify({ ...source(), injected: true }); }];
    for (const mutate of mutations) { const candidate = parts(); mutate(candidate["data/sigeko_project_authorities.json"].sigeko_project_authorities[0]); await rejected(ctx, transfer, candidate); }
  }, { modules: ["sigeko"] }));
  await run("S4.2-Transfer: duplicate IDs, duplicate categories and excessive assignments reject atomically", () => fixture(async ctx => {
    const transfer = register(ctx); const a = assignment();
    for (const rows of [[a, { ...assignment("imported", "POLICE"), id: a.id }], [a, { ...a, id: "second" }], Array.from({ length: 8 }, () => ({ ...a }))]) {
      await rejected(ctx, transfer, parts(rows), /Doppelte|Ungültige/);
    }
  }, { modules: ["sigeko"] }));
  await run("S4.2-Transfer: missing, malformed, downgraded and future authority payloads never disappear silently", () => fixture(async ctx => {
    const transfer = register(ctx);
    for (const mutate of [p => { delete p["data/sigeko_project_authorities.json"]; }, p => { p["data/sigeko_project_authorities.json"] = "{"; },
      p => { p["data/sigeko_project_authorities.json"] = {}; }, p => { p["data/sigeko_project_authorities.json"].sigeko_project_authorities = []; },
      ...[1, 2, 3, 4, 5, 7].map(version => p => { p["manifest.json"].formatVersion = version; }),
      p => { p["data/meetings.json"] = "{"; }, p => { delete p["data/settings.json"]; },
      p => { p["data/project_persons.json"] = { unexpected: [] }; }]) {
      const candidate = parts(); mutate(candidate); await rejected(ctx, transfer, candidate);
    }
  }, { modules: ["sigeko"] }));
  await run("S4.2-Transfer: every V6 count and manifest project identity is checked before mutation", () => fixture(async ctx => {
    const transfer = register(ctx);
    for (const key of Object.keys(parts()["manifest.json"].counts)) {
      for (const value of [undefined, -1, "0", 999]) {
        const candidate = parts(); candidate["manifest.json"].counts[key] = value; await rejected(ctx, transfer, candidate, /V6-Manifest/);
      }
    }
    for (const mutate of [p => { p["manifest.json"].projectId = "foreign"; }, p => { p["manifest.json"].counts.extra = 0; },
      p => { p["project-folder/unlisted.txt"] = "Missing in count"; }]) {
      const candidate = parts(); mutate(candidate); await rejected(ctx, transfer, candidate, /V6-Manifest/);
    }
  }, { modules: ["sigeko"] }));
  await run("S4.2-Transfer: module initialization is required before importing project assignments", () => fixture(async ctx => {
    const result = await register(ctx).importProject(await archive(ctx, parts()));
    assert.equal(result.ok, false); assert.match(result.error, /aktiviert und initialisiert/);
    assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM projects").get().n, 0);
    assert.equal(ctx.db.prepare("SELECT name FROM sqlite_master WHERE name='sigeko_project_authorities'").get(), undefined);
  }));
  await run("S4.2-Transfer: existing project and assignment ID collisions preserve all existing state", () => fixture(async ctx => {
    const transfer = register(ctx);
    ctx.db.prepare("INSERT INTO projects (id,name) VALUES ('imported','Bestehendes Projekt')").run();
    await rejected(ctx, transfer, parts(), /existiert bereits/);
    ctx.repo.deleteForever("imported");
    const other = ctx.repo.createProject({ name: "Anderes Projekt" }); insertAssignment(ctx.db, assignment(other.id));
    await rejected(ctx, transfer, parts(), /UNIQUE/);
  }, { modules: ["sigeko"] }));
  await run("S4.2-Transfer: failure after assignment insertion rolls back project, roles, builder and snapshots", () => fixture(async ctx => {
    const transfer = register(ctx); const candidate = parts();
    candidate["data/project.json"].project = { id: "imported", name: "Rollback", bauherr_firm_kind: "project_firm", bauherr_firm_id: "local" };
    candidate["data/project_firms.json"].project_firms = [{ id: "local", project_id: "imported", name: "Bauherr" }];
    candidate["manifest.json"].counts.projectFirms = 1;
    candidate["data/project_candidates.json"].project_candidates = [{ impossible_column: true }];
    candidate["manifest.json"].counts.projectCandidates = 1;
    const p = ctx.repo.createProject({ name: "Schemafixture" });
    ctx.db.prepare("INSERT INTO sigeko_projects (id,project_id,planning_source,execution_same_as_planning,created_at,updated_at) VALUES ('roles',?,'module',1,'2026-09-09','2026-09-09')").run(p.id);
    const roles = ctx.db.prepare("SELECT * FROM sigeko_projects WHERE project_id=?").get(p.id); ctx.repo.deleteForever(p.id);
    candidate["data/sigeko_projects.json"] = { sigeko_projects: [{ ...roles, project_id: "imported" }] };
    candidate["manifest.json"].counts.sigekoProjects = 1;
    await rejected(ctx, transfer, candidate, /impossible_column/);
  }, { modules: ["sigeko"] }));
  await run("S4.2-Transfer: invalid stored snapshots cannot cause destructive export", () => fixture(async ctx => {
    const transfer = register(ctx); const p = ctx.repo.createProject({ name: "Projekt behalten" });
    const row = assignment(p.id); insertAssignment(ctx.db, row);
    ctx.db.prepare("UPDATE sigeko_project_authorities SET snapshot_json=? WHERE id=?").run(JSON.stringify({ ...source(), unexpected: true }), row.id);
    const before = domainRows(ctx);
    const storage = require("../../src/main/ipc/projectStoragePaths.js").buildStoragePreviewPaths({ baseDir: ctx.root, project: p });
    const projectDir = path.dirname(storage.previewDir); fs.mkdirSync(projectDir, { recursive: true });
    const document = path.join(projectDir, "keep.txt"); fs.writeFileSync(document, "Projektdatei behalten");
    const result = await transfer.exportProject(p.id); assert.equal(result.ok, false);
    assert.deepEqual(domainRows(ctx), before); assert.equal(fs.readFileSync(document, "utf8"), "Projektdatei behalten");
    assert.equal(fs.existsSync(path.join(ctx.root, "bbm/export")), false);
  }, { modules: ["sigeko"] }));
  await run("S4.2-Transfer: injected global stock payload is never imported or allowed to replace target stock", () => fixture(async ctx => {
    const transfer = register(ctx); const existing = { ...source(), organization: "Unabhängiger Zielbestand" };
    ctx.db.prepare(`INSERT INTO sigeko_authority_records (${AUTHORITY_COLUMNS.join(",")}) VALUES (${AUTHORITY_COLUMNS.map(() => "?").join(",")})`).run(AUTHORITY_COLUMNS.map(key => existing[key]));
    const candidate = parts(); candidate["data/sigeko_authority_records.json"] = { sigeko_authority_records: [source()] };
    const result = await transfer.importProject(await archive(ctx, candidate)); assert.equal(result.ok, true, result.error);
    assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_authority_records").all(), [existing]);
    assert.equal(ctx.db.prepare("SELECT snapshot_json FROM sigeko_project_authorities").get().snapshot_json, assignment().snapshot_json);
  }, { modules: ["sigeko"] }));
}
module.exports = { runSigekoAuthorityTransferTests };
if (require.main === module) runSigekoAuthorityTransferTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
