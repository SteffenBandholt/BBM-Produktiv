"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const extract = require("extract-zip");
const { fixture, load, writeZip } = require("./plannedConstructionStart.test.cjs");
const { registerSigekoIpc } = require("../../src/main/ipc/sigekoIpc");
const { registerActiveModuleIpcs } = require("../../src/main/moduleIpcRegistry");
const status = modules => ({ valid: true, license: { modules } });

function withSigeko(fn, options = {}) {
  return fixture(ctx => {
    const overrides = { "./database": ctx.database };
    const { SigekoProjectRepository } = load("src/main/db/sigekoProjectRepo.js", overrides);
    const roleRepo = new SigekoProjectRepository({ dbProvider: ctx.database.initDatabase });
    const { createSigekoProjectService } = load("src/main/domain/sigeko/SigekoProjectService.js");
    let tick = 0;
    const service = createSigekoProjectService({ repo: roleRepo, projects: ctx.repo,
      persons: load("src/main/db/personsRepo.js", overrides), firms: load("src/main/db/firmsRepo.js", overrides),
      projectPersons: load("src/main/db/projectPersonsRepo.js", overrides), projectFirms: load("src/main/db/projectFirmsRepo.js", overrides),
      clock: () => `2026-09-08T20:00:${String(tick++).padStart(2, "0")}.000Z` });
    return fn({ ...ctx, roleRepo, service });
  }, { modules: ["sigeko"], ...options });
}
function contacts(db, a, b) {
  db.prepare("INSERT INTO firms (id,name,street,zip,city) VALUES ('f','Büro','Weg 3','12345','Ort')").run();
  db.prepare("INSERT INTO persons (id,firm_id,name,phone) VALUES ('person','f','Planung Extern','123')").run();
  for (const p of [a, b]) {
    db.prepare("INSERT INTO project_firms (id,project_id,name,street) VALUES (?,?,?,?)").run(`firm-${p.id}`, p.id, "Projektbüro", "Lokal 2");
    db.prepare("INSERT INTO project_persons (id,project_firm_id,first_name,last_name,name) VALUES (?,?,?,?,?)").run(`person-${p.id}`, `firm-${p.id}`, "Lokaler", "Koordinator", "Lokaler Koordinator");
  }
}
const free = name => ({ source: "free", data: { name, street: "Freiweg 4" } });
const moduleRole = { source: "module" };
const dump = (db, table) => db.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
function transfer(ctx) {
  load("src/main/ipc/projectTransferIpc.js", ctx.dependencies).registerProjectTransferIpc();
  return { export: id => ctx.handlers.get("projectTransfer:export")({}, { id }),
    import: filePath => ctx.handlers.get("projectTransfer:import")({}, { filePath }) };
}
async function archiveFile(ctx, row, { version = 4, extra = {}, include = true } = {}) {
  const file = path.join(ctx.root, `fixture-${Math.random()}.zip`);
  await writeZip(file, { "manifest.json": JSON.stringify({ formatVersion: version }), "project-folder/": "",
    "data/project.json": JSON.stringify({ project: { id: row.project_id, name: "Import" } }),
    ...(include ? { "data/sigeko_projects.json": JSON.stringify({ sigeko_projects: [row] }) } : {}), ...extra });
  return file;
}
async function runSigekoProjectRolesTests(run) {
  await run("S2.3: real legacy migration is additive idempotent and module scoped", () => withSigeko(({ db, database, service }) => {
    const before = dump(db, "projects");
    assert.equal(service.getProjectData({ projectId: "old" }).sigekoProject, null);
    assert.equal(service.getCoordinatorProfile(), null);
    const schema = db.prepare("SELECT type,name,sql FROM sqlite_master ORDER BY type,name").all();
    database.ensureSchema(db, { moduleIds: ["sigeko", "sigeko"] });
    assert.deepEqual(db.prepare("SELECT type,name,sql FROM sqlite_master ORDER BY type,name").all(), schema);
    assert.deepEqual(dump(db, "projects"), before);
    for (const name of ["meetings", "invoices", "restarbeiten_items", "sigeko_inspections", "sigeko_authorities"]) {
      assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name=?").get(name), undefined);
    }
    database.closeDatabase();
    database.configureDatabaseMigrations(status([]), { allowLegacyImport: false });
    assert.equal(database.initDatabase().prepare("SELECT COUNT(*) n FROM sigeko_projects").get().n, 0);
  }, { oldSql: "CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL); INSERT INTO projects VALUES ('old','Bestand');" }));

  await run("S2.3: one stable extension per existing BBM project and no implicit creation on read", () => withSigeko(({ db, repo, service }) => {
    const p = repo.createProject({ name: "A" }); const before = dump(db, "projects");
    assert.equal(service.getProjectData({ projectId: p.id }).sigekoProject, null);
    assert.equal(dump(db, "sigeko_projects").length, 0);
    const a = service.saveProjectData({ projectId: p.id }); const b = service.saveProjectData({ projectId: p.id });
    assert.equal(a.sigekoProject.id, b.sigekoProject.id); assert.equal(a.sigekoProject.createdAt, b.sigekoProject.createdAt);
    assert.notEqual(a.sigekoProject.updatedAt, b.sigekoProject.updatedAt);
    assert.equal(b.planning.assignment.source, "module"); assert.equal(b.planning.sourceMissing, true);
    assert.equal(b.execution.inheritedFromPlanning, true); assert.equal(dump(db, "sigeko_projects").length, 1);
    assert.deepEqual(dump(db, "projects"), before);
    assert.throws(() => service.saveProjectData({ projectId: "missing" }), { code: "PROJECT_NOT_FOUND" });
  }));

  await run("S2.3: module identity stays single and live across projects without profile copies", () => withSigeko(({ db, repo, service }) => {
    const a = repo.createProject({ name: "A" }); const b = repo.createProject({ name: "B" });
    service.saveCoordinatorProfile({ patch: { name: "Eigener SiGeKo", street: "Eigenweg 1", logo_path: "C:\\Logo.png" } });
    service.saveProjectData({ projectId: a.id }); service.saveProjectData({ projectId: b.id });
    const stored = dump(db, "sigeko_projects"); const oldResult = service.getProjectData({ projectId: a.id });
    const created = service.getCoordinatorProfile().created_at;
    service.saveCoordinatorProfile({ patch: { name: "Neuer Modulname" } });
    assert.equal(service.getCoordinatorProfile().created_at, created);
    for (const p of [a, b]) {
      const result = service.getProjectData({ projectId: p.id });
      assert.equal(result.planning.values.name, "Neuer Modulname"); assert.equal(result.execution.values.logo_path, "C:\\Logo.png");
    }
    assert.equal(oldResult.planning.values.name, "Eigener SiGeKo");
    assert.deepEqual(dump(db, "sigeko_projects"), stored);
    assert.equal(dump(db, "sigeko_profiles").length, 1);
    service.saveCoordinatorProfile({ patch: { name: undefined, logo_path: null, street: " " } });
    assert.equal(service.getCoordinatorProfile().name, "Neuer Modulname"); assert.equal(service.getCoordinatorProfile().street, null);
    assert.equal(service.getCoordinatorProfile().logo_path, null);
  }));

  await run("S2.3: external planning and own execution are independent without central writes", () => withSigeko(({ db, repo, service }) => {
    const a = repo.createProject({ name: "A", street: "Baustelle" }); const b = repo.createProject({ name: "B" });
    service.saveCoordinatorProfile({ patch: { name: "Steffen" } });
    const before = [dump(db, "projects"), dump(db, "firms"), dump(db, "persons")];
    let r = service.saveProjectData({ projectId: a.id, planning: free("Planer Extern"), executionSameAsPlanning: false, execution: moduleRole });
    assert.equal(r.planning.values.name, "Planer Extern"); assert.equal(r.execution.values.name, "Steffen");
    assert.equal(service.getProjectData({ projectId: b.id }).sigekoProject, null);
    assert.equal(service.getCoordinatorProfile().name, "Steffen");
    r = service.saveProjectData({ projectId: a.id, planning: moduleRole, execution: free("Ausführung Extern") });
    assert.equal(r.planning.values.name, "Steffen"); assert.equal(r.execution.values.name, "Ausführung Extern");
    assert.deepEqual([dump(db, "projects"), dump(db, "firms"), dump(db, "persons")], before);
  }));

  await run("S2.3: like planning follows changes and clears obsolete execution overrides", () => withSigeko(({ db, repo, service }) => {
    const p = repo.createProject({ name: "A" });
    service.saveCoordinatorProfile({ patch: { name: "Standard" } });
    service.saveProjectData({ projectId: p.id, planning: free("P"), executionSameAsPlanning: false, execution: free("X") });
    service.saveProjectData({ projectId: p.id, executionSameAsPlanning: true });
    const changed = service.saveProjectData({ projectId: p.id, planning: free("P2") });
    assert.equal(changed.execution.values.name, "P2"); assert.equal(changed.sigekoProject.execution, null);
    assert.equal(dump(db, "sigeko_projects")[0].execution_free_name, null);
    const reset = service.saveProjectData({ projectId: p.id, executionSameAsPlanning: false });
    assert.equal(reset.execution.values.name, "Standard"); assert.equal(reset.execution.inheritedFromPlanning, false);
  }));

  await run("S2.3: central and project people resolve through existing contacts with project isolation", () => withSigeko(({ db, repo, service }) => {
    const a = repo.createProject({ name: "A" }); const b = repo.createProject({ name: "B" }); contacts(db, a, b);
    const before = [dump(db, "firms"), dump(db, "persons"), dump(db, "project_firms"), dump(db, "project_persons")];
    const result = service.saveProjectData({ projectId: a.id, planning: { source: "person", personId: "person" },
      executionSameAsPlanning: false, execution: { source: "project_person", personId: `person-${a.id}` } });
    assert.equal(result.planning.values.name, "Planung Extern"); assert.equal(result.planning.values.street, "Weg 3");
    assert.equal(result.execution.values.name, "Lokaler Koordinator"); assert.equal(result.execution.values.street, "Lokal 2");
    assert.throws(() => service.saveProjectData({ projectId: b.id, planning: { source: "project_person", personId: `person-${a.id}` } }), { code: "PERSON_NOT_AVAILABLE" });
    assert.deepEqual([dump(db, "firms"), dump(db, "persons"), dump(db, "project_firms"), dump(db, "project_persons")], before);
    db.prepare("UPDATE persons SET name='Aktuell' WHERE id='person'").run();
    assert.equal(service.getProjectData({ projectId: a.id }).planning.values.name, "Aktuell");
  }));

  await run("S2.3: removed and deleted sources stay visibly unresolved and never fall back to self", () => withSigeko(({ db, repo, service }) => {
    const a = repo.createProject({ name: "A" }); const b = repo.createProject({ name: "B" }); contacts(db, a, b);
    service.saveCoordinatorProfile({ patch: { name: "Nicht als Ersatz" } });
    service.saveProjectData({ projectId: a.id, planning: { source: "person", personId: "person" }, executionSameAsPlanning: false,
      execution: { source: "project_person", personId: `person-${a.id}` } });
    db.prepare("UPDATE firms SET removed_at='2026' WHERE id='f'").run();
    assert.equal(service.getProjectData({ projectId: a.id }).planning.values, null);
    assert.throws(() => service.saveProjectData({ projectId: b.id, planning: { source: "person", personId: "person" } }), { code: "PERSON_NOT_AVAILABLE" });
    db.prepare("DELETE FROM persons WHERE id='person'").run();
    db.prepare("DELETE FROM project_persons WHERE id=?").run(`person-${a.id}`);
    const result = service.getProjectData({ projectId: a.id });
    assert.equal(result.planning.assignment.source, "person"); assert.equal(result.planning.assignment.personId, null);
    assert.equal(result.planning.sourceMissing, true); assert.equal(result.execution.sourceMissing, true);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
  }));

  await run("S2.3: invalid payloads cannot alter central data or partially save a role", () => withSigeko(({ db, repo, service }) => {
    const p = repo.createProject({ name: "A" }); service.saveProjectData({ projectId: p.id, planning: free("Bestand") });
    const before = dump(db, "sigeko_projects");
    for (const payload of [null, [], { projectId: p.id, name: "Fremd" }, { projectId: p.id, executionSameAsPlanning: "false" },
      { projectId: p.id, planning: { source: "unknown" } }, { projectId: p.id, planning: { source: "module", data: { name: "Kopie" } } },
      { projectId: p.id, planning: { source: "free", data: { logo_path: "X" } } },
      { projectId: p.id, planning: free("Teiländerung"), execution: free("Konflikt") },
      { projectId: p.id, planning: free("Teiländerung"), executionSameAsPlanning: false, execution: { source: "person", personId: "missing" } }]) {
      assert.throws(() => service.saveProjectData(payload)); assert.deepEqual(dump(db, "sigeko_projects"), before);
    }
    assert.throws(() => service.saveCoordinatorProfile({ patch: { licensee: "x" } }), { code: "INVALID_INPUT" });
    assert.throws(() => service.saveCoordinatorProfile({ patch: { name: {} } }), { code: "INVALID_INPUT" });
    assert.equal(service.getCoordinatorProfile(), null); assert.equal(repo.getById(p.id).name, "A");
  }));

  await run("S2.3: SQLite constraints prevent orphan duplicate and inconsistent assignments", () => withSigeko(({ db, repo, service }) => {
    const p = repo.createProject({ name: "A" }); service.saveProjectData({ projectId: p.id });
    const current = dump(db, "sigeko_projects")[0];
    for (const sql of ["UPDATE sigeko_projects SET project_id='missing'", "UPDATE sigeko_projects SET planning_source='bad'",
      "UPDATE sigeko_projects SET execution_same_as_planning=2", "UPDATE sigeko_projects SET planning_free_name='hidden'",
      "UPDATE sigeko_projects SET execution_source='free'"]) assert.throws(() => db.exec(sql));
    const columns = Object.keys(current); const copy = { ...current, id: "duplicate" };
    assert.throws(() => db.prepare(`INSERT INTO sigeko_projects (${columns.join(',')}) VALUES (${columns.map(k => '@'+k).join(',')})`).run(copy));
    assert.deepEqual(dump(db, "sigeko_projects"), [current]); assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
  }));

  await run("S2.3: file reopening archive restore and project deletion preserve ownership", () => withSigeko(({ db, database, repo, service }) => {
    const a = repo.createProject({ name: "A" }); const b = repo.createProject({ name: "B" });
    service.saveCoordinatorProfile({ patch: { name: "Profil" } });
    const first = service.saveProjectData({ projectId: a.id, planning: free("Alt") }); service.saveProjectData({ projectId: b.id });
    database.closeDatabase(); assert.equal(service.getProjectData({ projectId: a.id }).sigekoProject.id, first.sigekoProject.id);
    repo.archiveProject(a.id); assert.equal(service.getProjectData({ projectId: a.id }).planning.values.name, "Alt");
    assert.throws(() => service.saveProjectData({ projectId: a.id }), { code: "PROJECT_ARCHIVED" });
    repo.unarchiveProject(a.id); service.saveProjectData({ projectId: a.id, planning: free("Neu") });
    repo.deleteForever(a.id); assert.equal(service.getCoordinatorProfile().name, "Profil");
    assert.equal(service.getProjectData({ projectId: b.id }).planning.values.name, "Profil");
    assert.equal(database.initDatabase().prepare("SELECT COUNT(*) n FROM sigeko_projects").get().n, 1);
    assert.deepEqual(database.initDatabase().pragma("foreign_key_check"), []);
  }));

  await run("S2.3: real preload IPC uses current module license and atomic SQLite service", () => withSigeko(async ({ db, repo, service }) => {
    const p = repo.createProject({ name: "A" }); const handlers = new Map(); let license = status(["sigeko"]);
    registerActiveModuleIpcs({ licenseStatus: license, getLicenseStatus: () => license,
      ipcMain: { handle: (key, fn) => handlers.set(key, fn) },
      registrars: { sigeko: ({ ipcMain }) => registerSigekoIpc({ ipcMain, projectService: service }) } });
    const exposed = {};
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, "../../src/main/preload.js"), "utf8"), {
      require: () => ({ contextBridge: { exposeInMainWorld: (key, api) => { exposed[key] = api; } },
        ipcRenderer: { invoke: async (key, payload) => handlers.get(key)({}, payload) } }) });
    const api = exposed.bbmDb;
    assert.equal((await api.sigekoSaveCoordinatorProfile({ patch: { name: "IPC" } })).data.name, "IPC");
    assert.equal((await api.sigekoSaveProjectData({ projectId: p.id })).data.execution.values.name, "IPC");
    assert.equal((await api.sigekoGetProjectData({ projectId: p.id })).data.project.name, "A");
    assert.equal((await api.sigekoGetCoordinatorProfile()).data.name, "IPC");
    const calls = [() => api.sigekoGetCoordinatorProfile(), () => api.sigekoSaveCoordinatorProfile({ patch: { name: "Verboten" } }),
      () => api.sigekoGetProjectData({ projectId: p.id }), () => api.sigekoSaveProjectData({ projectId: p.id })];
    for (const revoked of [status([]), status(["protokoll"]), { ...status(["sigeko"]), valid: false }, null]) {
      license = revoked; for (const call of calls) await assert.rejects(call(), { code: "MODULE_NOT_ACTIVE" });
    }
    assert.equal(service.getCoordinatorProfile().name, "IPC"); license = status(["sigeko"]);
    const failure = await api.sigekoSaveProjectData({ projectId: p.id, planning: { source: "bad" } });
    assert.equal(failure.ok, false); assert.equal(failure.code, "INVALID_ROLE");
    assert.equal(dump(db, "sigeko_projects").length, 1);
  }));

  await run("S2.3: real ZIP roundtrip preserves local roles IDs and module reference", () => withSigeko(async ctx => {
    const { db, repo, service } = ctx; const a = repo.createProject({ name: "A" }); const b = repo.createProject({ name: "B" }); contacts(db, a, b);
    service.saveCoordinatorProfile({ patch: { name: "Modulprofil", logo_path: "C:\\Logo.png" } });
    service.saveProjectData({ projectId: a.id, planning: { source: "project_person", personId: `person-${a.id}` }, executionSameAsPlanning: false, execution: moduleRole });
    const before = service.getProjectData({ projectId: a.id }); const profile = service.getCoordinatorProfile(); const io = transfer(ctx);
    const out = await io.export(a.id); assert.equal(out.ok, true, out.error); assert.equal(repo.getById(a.id), undefined);
    const folder = path.join(ctx.root, "inspect"); await extract(out.exportPath, { dir: folder });
    assert.equal(JSON.parse(fs.readFileSync(path.join(folder, "manifest.json"))).formatVersion, 4);
    assert.equal(fs.existsSync(path.join(folder, "data/sigeko_profiles.json")), false);
    const payload = JSON.parse(fs.readFileSync(path.join(folder, "data/sigeko_projects.json")));
    assert.equal(payload.sigeko_projects[0].id, before.sigekoProject.id);
    const back = await io.import(out.exportPath); assert.equal(back.ok, true, back.error);
    assert.deepEqual(service.getProjectData({ projectId: a.id }).sigekoProject, before.sigekoProject);
    assert.deepEqual(service.getProjectData({ projectId: a.id }).planning, before.planning);
    assert.deepEqual(service.getCoordinatorProfile(), profile);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
  }, { modules: ["sigeko", "protokoll", "restarbeiten"] }));

  await run("S2.3: SiGeKo-only ZIP works without foreign module tables and retains free planning", () => withSigeko(async ctx => {
    const { db, repo, service } = ctx; const p = repo.createProject({ name: "Nur SiGeKo" });
    service.saveProjectData({ projectId: p.id, planning: free("Extern") });
    const io = transfer(ctx); const out = await io.export(p.id); assert.equal(out.ok, true, out.error);
    assert.equal(repo.getById(p.id), undefined);
    const result = await io.import(out.exportPath); assert.equal(result.ok, true, result.error);
    assert.equal(service.getProjectData({ projectId: p.id }).execution.values.name, "Extern");
    for (const name of ["meetings", "tops", "restarbeiten_items"]) {
      assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name=?").get(name), undefined);
    }
  }));

  await run("S2.3: ZIP retains free data and validates global coordinator dependencies", () => withSigeko(async ctx => {
    const { db, repo, service } = ctx; const a = repo.createProject({ name: "A" }); const b = repo.createProject({ name: "B" }); contacts(db, a, b);
    service.saveProjectData({ projectId: a.id, planning: { source: "person", personId: "person" }, executionSameAsPlanning: false, execution: free("Frei") });
    const before = service.getProjectData({ projectId: a.id }); const io = transfer(ctx); const out = await io.export(a.id);
    assert.equal(out.ok, true, out.error);
    db.prepare("UPDATE persons SET name='Kollision' WHERE id='person'").run();
    const fail = await io.import(out.exportPath); assert.equal(fail.ok, false); assert.equal(fail.code, "PROJECT_TRANSFER_GLOBAL_DEPENDENCY");
    assert.equal(repo.getById(a.id), undefined);
    db.prepare("UPDATE persons SET name='Planung Extern' WHERE id='person'").run();
    assert.equal((await io.import(out.exportPath)).ok, true);
    assert.deepEqual(service.getProjectData({ projectId: a.id }).sigekoProject, before.sigekoProject);
    assert.equal(service.getProjectData({ projectId: a.id }).execution.values.name, "Frei");
  }, { modules: ["sigeko", "protokoll", "restarbeiten"] }));

  await run("S2.3: malformed missing and foreign-project ZIP roles fail without partial import", () => withSigeko(async ctx => {
    const { db, repo, service } = ctx; const a = repo.createProject({ name: "A" }); const b = repo.createProject({ name: "B" }); contacts(db, a, b);
    service.saveProjectData({ projectId: a.id }); const row = dump(db, "sigeko_projects")[0]; repo.deleteForever(a.id);
    const io = transfer(ctx);
    for (const options of [{ include: false }, { extra: { "data/sigeko_projects.json": "{" } },
      { extra: { "data/sigeko_projects.json": JSON.stringify({ sigeko_projects: [{ ...row, project_id: b.id }] }) } },
      { extra: { "data/sigeko_projects.json": JSON.stringify({ sigeko_projects: [{ ...row, planning_source: "bad" }] }) } },
      { extra: { "data/sigeko_projects.json": JSON.stringify({ sigeko_projects: [{ ...row, planning_source: "project_person", planning_project_person_id: `person-${b.id}` }] }) } }]) {
      const result = await io.import(await archiveFile(ctx, row, options)); assert.equal(result.ok, false, JSON.stringify(options));
      assert.equal(repo.getById(a.id), undefined); assert.equal(dump(db, "sigeko_projects").length, 0);
    }
    const validFile = await archiveFile(ctx, row); db.exec("DROP TABLE sigeko_projects");
    const unavailable = await io.import(validFile); assert.equal(unavailable.ok, false); assert.match(unavailable.error, /aktiviert/);
    assert.equal(repo.getById(a.id), undefined);
  }, { modules: ["sigeko", "protokoll", "restarbeiten"] }));
}
module.exports = { runSigekoProjectRolesTests };
if (require.main === module) runSigekoProjectRolesTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
