"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const Database = require("better-sqlite3");
const archiver = require("archiver");
const extract = require("extract-zip");

// Execute the production modules with only their host/path dependency replaced.
// SQLite, schema migration, repository SQL and IPC handlers remain real.
function load(relative, overrides = {}) {
  const filename = path.resolve(__dirname, "../..", relative);
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = instance.require.bind(instance);
  instance.require = (name) => Object.hasOwn(overrides, name) ? overrides[name] : originalRequire(name);
  instance._compile(fs.readFileSync(filename, "utf8"), filename);
  return instance.exports;
}

async function fixture(fn, { oldSql = "", modules = [] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-s21-"));
  const userData = path.join(root, "userData");
  fs.mkdirSync(userData);
  if (oldSql) { const old = new Database(path.join(userData, "app.db")); try { old.exec(oldSql); } finally { old.close(); } }
  const handlers = new Map();
  const electron = { app: { isPackaged: true, getVersion: () => "test", getPath: (key) => {
    if (key === "userData") return userData;
    if (["downloads", "temp"].includes(key)) return root;
    throw new Error(`Unexpected host path ${key}`);
  } }, ipcMain: { handle: (name, handler) => { assert.equal(handlers.has(name), false); handlers.set(name, handler); } }, shell: {} };
  const database = load("src/main/db/database.js", { electron });
  database.configureDatabaseMigrations({ valid: true, license: { modules } }, { allowLegacyImport: false });
  const repo = load("src/main/db/projectsRepo.js", { "./database": database });
  const dependencies = { electron, "../db/database": database, "../db/projectsRepo": repo,
    "../db/appSettingsRepo": { appSettingsGetMany: () => ({ "pdf.protocolsDir": root }) },
    "../licensing/featureGuard": { toLicenseErrorPayload: (err) => { throw err; } } };
  load("src/main/ipc/projectsIpc.js", dependencies).registerProjectsIpc();
  try { return await fn({ root, database, repo, dependencies, handlers,
    invoke: (name, payload) => handlers.get(name)({}, payload), db: database.initDatabase() }); }
  finally { database.closeDatabase(); fs.rmSync(root, { recursive: true, force: true }); }
}

async function writeZip(file, parts) {
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(file); const zip = archiver("zip");
    output.once("close", resolve); output.once("error", reject); zip.once("error", reject); zip.pipe(output);
    for (const [name, contents] of Object.entries(parts)) zip.append(contents, { name });
    zip.finalize();
  });
}

async function runPlannedConstructionStartTests(run) {
  await run("S2.1: fresh core database has nullable planned start without a SiGeKo module", () => fixture(({ db, repo }) => {
    const col = db.prepare("PRAGMA table_info(projects)").all().find(x => x.name === "geplanter_baubeginn");
    assert.equal(col.type, "TEXT"); assert.equal(col.notnull, 0); assert.equal(col.dflt_value, null);
    const created = repo.createProject({ name: "Minimal" }); assert.equal(created.geplanter_baubeginn, null);
    assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='sigeko_projects'").get(), undefined);
  }));
  await run("S2.1: old project data remains unchanged and planned start is never inferred", () => fixture(({ db, database, repo }) => {
    const old = { id: "old", name: "Älteres Projekt", start_date: "2001-02-03", end_date: "2002-04-05", notes: "bleibt", archived_at: "2026-01-01" };
    const row = db.prepare("SELECT * FROM projects WHERE id='old'").get();
    for (const [key, value] of Object.entries(old)) assert.equal(row[key], value);
    assert.equal(row.geplanter_baubeginn, null);
    repo.updateProject({ id: "old", patch: { geplanter_baubeginn: "2027-03-04" } });
    database.ensureSchema(db, { moduleIds: [] }); database.ensureSchema(db, { moduleIds: [] });
    const after = db.prepare("SELECT * FROM projects WHERE id='old'").get();
    for (const [key, value] of Object.entries(old)) assert.equal(after[key], value);
    assert.equal(after.geplanter_baubeginn, "2027-03-04");
    assert.equal(db.prepare("PRAGMA table_info(projects)").all().filter(x => x.name === "geplanter_baubeginn").length, 1);
    assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
  }, { oldSql: "CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, start_date TEXT, end_date TEXT, notes TEXT, archived_at TEXT); INSERT INTO projects VALUES ('old','Älteres Projekt','2001-02-03','2002-04-05','bleibt','2026-01-01');" }));
  await run("S2.1: minimal historical project schema migrates through normal initialization", () => fixture(({ repo }) => {
    assert.equal(repo.getById("old").geplanter_baubeginn, null);
    assert.equal(repo.updateProject({ id: "old", geplanter_baubeginn: "2028-02-29" }).geplanter_baubeginn, "2028-02-29");
  }, { oldSql: "CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL); INSERT INTO projects VALUES ('old','Bestand');" }));
  await run("S2.1: create IPC preserves planned date independently of existing date fields", () => fixture(({ invoke, repo }) => {
    const r = invoke("projects:create", { name: "Datum", startDate: "2025-01-01", end_date: "2029-12-31", geplanter_baubeginn: " 2027-06-15 " });
    assert.equal(r.ok, true); assert.equal(r.project.geplanter_baubeginn, "2027-06-15");
    assert.equal(r.project.start_date, "2025-01-01"); assert.equal(r.project.end_date, "2029-12-31");
    assert.equal(repo.getById(r.project.id).geplanter_baubeginn, "2027-06-15");
    assert.equal(invoke("projects:list").list[0].geplanter_baubeginn, "2027-06-15");
  }));
  await run("S2.1: all historical IPC update envelopes preserve omitted field and accept explicit clearing", () => fixture(({ invoke, repo }) => {
    const p = repo.createProject({ name: "Update", geplanter_baubeginn: "2027-06-15", start_date: "2020-01-02", end_date: "2030-03-04" });
    for (const idKey of ["projectId", "project_id", "id"]) for (const nested of [true, false]) {
      const update = (patch) => invoke("projects:update", nested ? { [idKey]: p.id, patch } : { [idKey]: p.id, ...patch });
      assert.equal(update({ geplanter_baubeginn: "2028-02-29" }).project.geplanter_baubeginn, "2028-02-29");
      assert.equal(update({ notes: "andere Änderung" }).project.geplanter_baubeginn, "2028-02-29");
      assert.equal(update({ geplanter_baubeginn: undefined }).project.geplanter_baubeginn, "2028-02-29");
      for (const empty of [null, "", "   "]) {
        update({ geplanter_baubeginn: "2028-02-29" });
        const r = update({ geplanter_baubeginn: empty });
        assert.equal(r.ok, true); assert.equal(r.project.geplanter_baubeginn, null);
        assert.equal(r.project.start_date, "2020-01-02"); assert.equal(r.project.end_date, "2030-03-04");
      }
    }
  }));
  await run("S2.1: archive, listArchived and unarchive retain the planned date", () => fixture(({ invoke, repo }) => {
    const p = repo.createProject({ name: "Archiv", geplanter_baubeginn: "2027-06-15" });
    assert.equal(invoke("projects:archive", { projectId: p.id }).project.geplanter_baubeginn, "2027-06-15");
    assert.equal(invoke("projects:list").list.length, 0);
    assert.equal(invoke("projects:listArchived").list[0].geplanter_baubeginn, "2027-06-15");
    assert.equal(invoke("projects:unarchive", { id: p.id }).project.geplanter_baubeginn, "2027-06-15");
    assert.equal(invoke("projects:list").list[0].geplanter_baubeginn, "2027-06-15");
  }));
  await run("S2.1: reopening the file database preserves both populated and cleared dates", () => fixture(({ database, repo }) => {
    const p = repo.createProject({ name: "Neustart", geplanter_baubeginn: "2027-06-15" });
    database.closeDatabase(); assert.equal(repo.getById(p.id).geplanter_baubeginn, "2027-06-15");
    repo.updateProject({ id: p.id, patch: { geplanter_baubeginn: null } });
    database.closeDatabase(); assert.equal(repo.getById(p.id).geplanter_baubeginn, null);
  }));
  for (const dropped of [["archived_at"], ["archived_at", "project_number"]]) {
    await run(`S2.1: SQL fallback without ${dropped.join("/")} retains planned start`, () => fixture(({ db, repo }) => {
      repo.listAll(); // initialize only the existing compatibility column guards
      for (const col of dropped) db.exec(`ALTER TABLE projects DROP COLUMN ${col}`);
      const p = repo.createProject({ name: "Fallback", geplanter_baubeginn: "2027-06-15" });
      assert.equal(p.geplanter_baubeginn, "2027-06-15");
      assert.equal(repo.getById(p.id).geplanter_baubeginn, "2027-06-15");
      assert.equal(repo.listAll()[0].geplanter_baubeginn, "2027-06-15");
      assert.equal(repo.updateProject({ id: p.id, geplanter_baubeginn: null }).geplanter_baubeginn, null);
    }));
  }
  await run("S2.1: missing new column cannot produce a successful create with discarded date", () => fixture(({ db, invoke }) => {
    db.exec("ALTER TABLE projects DROP COLUMN geplanter_baubeginn");
    const result = invoke("projects:create", { name: "Must fail", geplanter_baubeginn: "2027-06-15" });
    assert.equal(result.ok, false); assert.equal(db.prepare("SELECT COUNT(*) n FROM projects").get().n, 0);
  }));
  await run("S2.1: deleteForever removes the project without changing another planned date", () => fixture(({ repo, invoke }) => {
    const a = repo.createProject({ name: "Löschen", geplanter_baubeginn: "2027-06-15" });
    const b = repo.createProject({ name: "Bleibt", geplanter_baubeginn: "2029-10-11" });
    assert.equal(invoke("projects:deleteForever", { id: a.id }).ok, true);
    assert.equal(repo.getById(a.id), undefined); assert.equal(repo.getById(b.id).geplanter_baubeginn, "2029-10-11");
  }));
  await run("S2.1: real project ZIP export and import preserve the new date", () => fixture(async ({ root, repo, dependencies, handlers }) => {
    load("src/main/ipc/projectTransferIpc.js", dependencies).registerProjectTransferIpc();
    const p = repo.createProject({ name: "ZIP", geplanter_baubeginn: "2027-06-15", start_date: "2020-01-02" });
    const exported = await handlers.get("projectTransfer:export")({}, { id: p.id });
    assert.equal(exported.ok, true, exported.error); assert.equal(repo.getById(p.id), undefined);
    const output = path.join(root, "zip-inspection"); await extract(exported.exportPath, { dir: output });
    const entry = JSON.parse(fs.readFileSync(path.join(output, "data/project.json"), "utf8")).project;
    assert.equal(entry.geplanter_baubeginn, "2027-06-15");
    const imported = await handlers.get("projectTransfer:import")({}, { filePath: exported.exportPath });
    assert.equal(imported.ok, true, imported.error);
    assert.equal(repo.getById(p.id).geplanter_baubeginn, "2027-06-15"); assert.equal(repo.getById(p.id).start_date, "2020-01-02");
  }, { modules: ["protokoll", "restarbeiten"] }));
  await run("S2.1: historical ZIP import without new field leaves planned start empty", () => fixture(async ({ root, repo, dependencies, handlers }) => {
    load("src/main/ipc/projectTransferIpc.js", dependencies).registerProjectTransferIpc();
    const file = path.join(root, "old.zip");
    await writeZip(file, { "manifest.json": JSON.stringify({ formatVersion: 1 }), "project-folder/": "",
      "data/project.json": JSON.stringify({ project: { id: "oldzip", name: "Altarchiv", start_date: "2000-01-01" } }) });
    const result = await handlers.get("projectTransfer:import")({}, { filePath: file });
    assert.equal(result.ok, true, result.error); assert.equal(repo.getById("oldzip").geplanter_baubeginn, null);
    assert.equal(repo.getById("oldzip").start_date, "2000-01-01");
  }));
}
module.exports = { runPlannedConstructionStartTests };

if (require.main === module) {
  runPlannedConstructionStartTests(async (name, check) => { await check(); console.log("PASS", name); })
    .catch((error) => { console.error(error); process.exitCode = 1; });
}
