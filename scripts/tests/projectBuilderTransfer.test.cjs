"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const extract = require("extract-zip");
const { fixture, load, writeZip } = require("./plannedConstructionStart.test.cjs");

const projectRow = (id = "imported") => ({ id, name: "Bauherrarchiv", bauherr_firm_kind: "global_firm", bauherr_firm_id: "builder" });
function register(ctx) {
  load("src/main/ipc/projectTransferIpc.js", ctx.dependencies).registerProjectTransferIpc();
  return { exportProject: id => ctx.invoke("projectTransfer:export", { id }),
    importProject: filePath => ctx.invoke("projectTransfer:import", { filePath }) };
}
function globalFirm(db) {
  db.prepare("INSERT INTO firms (id,name,street,zip,city) VALUES ('builder','Bauherr GmbH','Weg 1','12345','Ort')").run();
}
async function archive(ctx, { project = projectRow(), version = 5, firms = [{ id: "builder", name: "Bauherr GmbH" }], projectFirms = [], extra = {}, sigekoCount = 0 } = {}) {
  const file = path.join(ctx.root, "candidate.zip");
  await writeZip(file, { "manifest.json": JSON.stringify({ formatVersion: version, counts: { sigekoProjects: sigekoCount } }),
    "project-folder/": "", "data/project.json": JSON.stringify({ project }),
    "data/global_firm_dependencies.json": JSON.stringify({ firms, persons: [] }),
    "data/project_firms.json": JSON.stringify({ project_firms: projectFirms }), ...extra });
  return file;
}
function unchanged(ctx, before) {
  assert.deepEqual(ctx.db.prepare("SELECT * FROM projects ORDER BY id").all(), before);
  assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM project_firms").get().n, 0);
}

async function runProjectBuilderTransferTests(run) {
  await run("Bauherr-Transfer: global selection outside project participants roundtrips in V5 without SiGeKo", () => fixture(async ctx => {
    globalFirm(ctx.db); const transfer = register(ctx);
    const p = ctx.repo.createProject({ name: "Global", bauherr: { kind: "global_firm", id: "builder" } });
    assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM project_global_firms").get().n, 0);
    const exported = await transfer.exportProject(p.id); assert.equal(exported.ok, true, exported.error);
    assert.equal(ctx.repo.getById(p.id), undefined);
    const unpacked = path.join(ctx.root, "inspect"); await extract(exported.exportPath, { dir: unpacked });
    const manifest = JSON.parse(fs.readFileSync(path.join(unpacked, "manifest.json")));
    assert.equal(manifest.formatVersion, 5); assert.equal(manifest.counts.sigekoProjects, 0);
    assert.equal(fs.existsSync(path.join(unpacked, "data/sigeko_projects.json")), false);
    const dependencies = JSON.parse(fs.readFileSync(path.join(unpacked, "data/global_firm_dependencies.json")));
    assert.equal(dependencies.firms.length, 1); assert.equal(dependencies.firms[0].id, "builder");
    const result = await transfer.importProject(exported.exportPath); assert.equal(result.ok, true, result.error);
    assert.equal(ctx.repo.getById(p.id).bauherr_firm_kind, "global_firm");
    assert.equal(ctx.repo.getById(p.id).bauherr_firm_id, "builder");
    assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM project_global_firms").get().n, 0);
    assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM firms").get().n, 1);
  }));
  await run("Bauherr-Transfer: own project firm is restored before reference and survives restart", () => fixture(async ctx => {
    const transfer = register(ctx); const p = ctx.repo.createProject({ name: "Lokal" });
    ctx.db.prepare("INSERT INTO project_firms (id,project_id,name,street) VALUES ('local',?,'Lokaler Bauherr','Lokal 2')").run(p.id);
    ctx.repo.updateProject({ id: p.id, patch: { bauherr: { kind: "project_firm", id: "local" } } });
    // Historical assignment remains the same if the chosen firm is deactivated later.
    ctx.db.prepare("UPDATE project_firms SET is_active=0 WHERE id='local'").run();
    const exported = await transfer.exportProject(p.id); assert.equal(exported.ok, true, exported.error);
    assert.equal(ctx.db.prepare("SELECT id FROM project_firms WHERE id='local'").get(), undefined);
    const imported = await transfer.importProject(exported.exportPath); assert.equal(imported.ok, true, imported.error);
    assert.equal(ctx.repo.getById(p.id).bauherr_firm_kind, "project_firm");
    assert.equal(ctx.repo.getById(p.id).bauherr_firm_id, "local");
    assert.equal(ctx.db.prepare("SELECT project_id FROM project_firms WHERE id='local'").get().project_id, p.id);
    assert.equal(ctx.db.prepare("SELECT is_active FROM project_firms WHERE id='local'").get().is_active, 0);
    ctx.database.closeDatabase(); assert.equal(ctx.repo.getById(p.id).bauherr_firm_id, "local");
    assert.equal(ctx.database.initDatabase().pragma("integrity_check", { simple: true }), "ok");
  }));
  await run("Bauherr-Transfer: V5 preserves optional SiGeKo extension alongside builder", () => fixture(async ctx => {
    globalFirm(ctx.db); const transfer = register(ctx);
    const p = ctx.repo.createProject({ name: "Beide", bauherr: { kind: "global_firm", id: "builder" } });
    ctx.db.prepare("INSERT INTO sigeko_projects (id,project_id,planning_source,execution_same_as_planning,created_at,updated_at) VALUES ('s',?,'module',1,'2026-01-01','2026-01-01')").run(p.id);
    const before = ctx.db.prepare("SELECT * FROM sigeko_projects").get();
    const exported = await transfer.exportProject(p.id); assert.equal(exported.ok, true, exported.error);
    const imported = await transfer.importProject(exported.exportPath); assert.equal(imported.ok, true, imported.error);
    assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_projects").get(), before);
    assert.equal(ctx.repo.getById(p.id).bauherr_firm_id, "builder");
  }, { modules: ["sigeko"] }));
  await run("Bauherr-Transfer: unassigned projects keep V3 and SiGeKo-only projects keep V4", () => fixture(async ctx => {
    const transfer = register(ctx);
    for (const sigeko of [false, true]) {
      const p = ctx.repo.createProject({ name: sigeko ? "Mit SiGeKo" : "Ohne SiGeKo" });
      if (sigeko) ctx.db.prepare("INSERT INTO sigeko_projects (id,project_id,planning_source,execution_same_as_planning,created_at,updated_at) VALUES ('s',?,'module',1,'2026-01-01','2026-01-01')").run(p.id);
      const exported = await transfer.exportProject(p.id); assert.equal(exported.ok, true, exported.error);
      const folder = path.join(ctx.root, `inspect-${sigeko}`); await extract(exported.exportPath, { dir: folder });
      assert.equal(JSON.parse(fs.readFileSync(path.join(folder, "manifest.json"))).formatVersion, sigeko ? 4 : 3);
      const imported = await transfer.importProject(exported.exportPath); assert.equal(imported.ok, true, imported.error);
      assert.equal(ctx.repo.getById(p.id).bauherr_firm_kind, null); assert.equal(ctx.repo.getById(p.id).bauherr_firm_id, null);
    }
  }, { modules: ["sigeko"] }));
  await run("Bauherr-Transfer: missing global snapshot, dependency or identity collision rejects before writes", () => fixture(async ctx => {
    globalFirm(ctx.db); const transfer = register(ctx);
    const before = ctx.db.prepare("SELECT * FROM projects ORDER BY id").all();
    for (const candidate of [{ firms: [] }, { firms: [{ id: "builder", name: "Bauherr GmbH" }, { id: "builder", name: "Bauherr GmbH" }] }, { firms: [{ id: "builder", name: "Andere Firma" }] },
      { project: { ...projectRow(), bauherr_firm_id: "missing" }, firms: [{ id: "missing", name: "Bauherr GmbH" }] }]) {
      const result = await transfer.importProject(await archive(ctx, candidate));
      assert.equal(result.ok, false); assert.equal(result.code, "PROJECT_TRANSFER_GLOBAL_DEPENDENCY"); unchanged(ctx, before);
    }
  }));
  await run("Bauherr-Transfer: malformed, incomplete and downgraded references never silently disappear", () => fixture(async ctx => {
    globalFirm(ctx.db); const transfer = register(ctx); const before = ctx.db.prepare("SELECT * FROM projects ORDER BY id").all();
    for (const options of [{ project: { id: "imported", name: "Ohne Referenz" } },
      { project: { ...projectRow(), bauherr_firm_kind: null } }, { project: { ...projectRow(), bauherr_firm_id: null } },
      { project: { ...projectRow(), bauherr_firm_kind: "person" } }, { project: { ...projectRow(), bauherr_firm_id: " builder " } },
      { project: { ...projectRow(), bauherr_firm_id: 42 } }, { version: 3 },
      { sigekoCount: 1 }]) {
      const result = await transfer.importProject(await archive(ctx, options)); assert.equal(result.ok, false); unchanged(ctx, before);
    }
  }));
  await run("Bauherr-Transfer: missing, duplicate and foreign project-firm snapshots reject without rebinding", () => fixture(async ctx => {
    const transfer = register(ctx); const before = ctx.db.prepare("SELECT * FROM projects ORDER BY id").all();
    const local = { id: "local", project_id: "imported", name: "Bauherr" };
    for (const projectFirms of [[], [{ ...local, project_id: "foreign" }], [local, local]]) {
      const result = await transfer.importProject(await archive(ctx, { project: { ...projectRow(), bauherr_firm_kind: "project_firm", bauherr_firm_id: "local" }, projectFirms }));
      assert.equal(result.ok, false); assert.match(result.error, /Bauherr-Projektfirma/); unchanged(ctx, before);
    }
  }));
  await run("Bauherr-Transfer: project-firm ID collision cannot bind another project's firm", () => fixture(async ctx => {
    const transfer = register(ctx); const other = ctx.repo.createProject({ name: "Anderes Projekt" });
    ctx.db.prepare("INSERT INTO project_firms (id,project_id,name) VALUES ('local',?,'Bestehende Firma')").run(other.id);
    const beforeProjects = ctx.db.prepare("SELECT * FROM projects ORDER BY id").all();
    const beforeFirms = ctx.db.prepare("SELECT * FROM project_firms ORDER BY id").all();
    const result = await transfer.importProject(await archive(ctx, {
      project: { ...projectRow(), bauherr_firm_kind: "project_firm", bauherr_firm_id: "local" },
      projectFirms: [{ id: "local", project_id: "imported", name: "Archivfirma" }]
    }));
    assert.equal(result.ok, false);
    assert.deepEqual(ctx.db.prepare("SELECT * FROM projects ORDER BY id").all(), beforeProjects);
    assert.deepEqual(ctx.db.prepare("SELECT * FROM project_firms ORDER BY id").all(), beforeFirms);
  }));
  await run("Bauherr-Transfer: later insert failure rolls back project, imported firm and assigned builder together", () => fixture(async ctx => {
    const transfer = register(ctx); const before = ctx.db.prepare("SELECT * FROM projects ORDER BY id").all();
    const result = await transfer.importProject(await archive(ctx, {
      project: { ...projectRow(), bauherr_firm_kind: "project_firm", bauherr_firm_id: "local" },
      projectFirms: [{ id: "local", project_id: "imported", name: "Lokaler Bauherr" }],
      extra: { "data/project_persons.json": JSON.stringify({ project_persons: [{ id: "bad", project_firm_id: "missing", name: "Ungültig" }] }) }
    }));
    assert.equal(result.ok, false); unchanged(ctx, before);
    assert.equal(ctx.db.prepare("SELECT COUNT(*) n FROM project_persons").get().n, 0);
  }));
  await run("Bauherr-Transfer: dangling export references fail before local project or files are removed", () => fixture(async ctx => {
    const transfer = register(ctx); const p = ctx.repo.createProject({ name: "Behalten" });
    const storage = require("../../src/main/ipc/projectStoragePaths.js").buildStoragePreviewPaths({ baseDir: ctx.root, project: p });
    const projectDir = path.dirname(storage.previewDir); fs.mkdirSync(projectDir, { recursive: true });
    const document = path.join(projectDir, "keep.txt"); fs.writeFileSync(document, "Bestehende Projektdatei");
    for (const kind of ["global_firm", "project_firm"]) {
      ctx.db.prepare("UPDATE projects SET bauherr_firm_kind=?,bauherr_firm_id='missing' WHERE id=?").run(kind, p.id);
      const result = await transfer.exportProject(p.id); assert.equal(result.ok, false);
      assert.equal(ctx.repo.getById(p.id).bauherr_firm_id, "missing");
      assert.equal(fs.readFileSync(document, "utf8"), "Bestehende Projektdatei");
      assert.equal(fs.existsSync(path.join(ctx.root, "bbm/export")), false);
    }
  }));
}
module.exports = { runProjectBuilderTransferTests };
if (require.main === module) runProjectBuilderTransferTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
