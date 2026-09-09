"use strict";
const assert = require("node:assert/strict");
const { fixture, load } = require("./plannedConstructionStart.test.cjs");

function firms(db, projectId, otherProjectId) {
  db.prepare("INSERT INTO firms (id,name,street,zip,city,role_code) VALUES (?,?,?,?,?,?)")
    .run("global", "Bauherr GmbH", "Weg 10", "12345", "Ort", 60);
  db.prepare("INSERT INTO firms (id,name,role_code) VALUES (?,?,?)").run("category", "Kategorie allein", 10);
  db.prepare("INSERT INTO project_firms (id,project_id,name,role_code) VALUES (?,?,?,?)")
    .run("local", projectId, "Lokaler Bauherr", 60);
  db.prepare("INSERT INTO project_firms (id,project_id,name) VALUES (?,?,?)")
    .run("foreign", otherProjectId, "Fremdes Projekt");
}
const globalRef = { kind: "global_firm", id: "global" };
const localRef = { kind: "project_firm", id: "local" };
function seeded(fn, options) {
  return fixture((context) => {
    const first = context.repo.createProject({ name: "Erstes Projekt" });
    const second = context.repo.createProject({ name: "Zweites Projekt" });
    firms(context.db, first.id, second.id);
    return fn({ ...context, first, second });
  }, options);
}

async function runProjectBuilderTests(run) {
  await run("Bauherr: nullable core migration keeps old projects and never infers firm categories", () => fixture(({ db, database, repo }) => {
    for (const name of ["bauherr_firm_kind", "bauherr_firm_id"]) {
      const column = db.prepare("PRAGMA table_info(projects)").all().find((c) => c.name === name);
      assert.equal(column.type, "TEXT"); assert.equal(column.notnull, 0); assert.equal(column.dflt_value, null);
    }
    db.prepare("INSERT INTO firms (id,name,role_code) VALUES ('builder','Altbauherr',10)").run();
    database.ensureSchema(db, { moduleIds: [] }); database.ensureSchema(db, { moduleIds: [] });
    const old = repo.getById("old");
    assert.equal(old.name, "Bestand"); assert.equal(old.bauherr_firm_kind, null); assert.equal(old.bauherr_firm_id, null);
    assert.deepEqual(repo.getBuilder("old"), { ref: null, firm: null, sourceMissing: false });
    assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='sigeko_projects'").get(), undefined);
    assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
  }, { oldSql: "CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL); INSERT INTO projects VALUES ('old','Bestand');" }));

  for (const modules of [[], ["sigeko"], ["protokoll"]]) {
    await run(`Bauherr: core create/read IPC works with modules ${modules.join(",") || "none"}`, () => seeded(({ invoke, repo, db }) => {
      const beforeFirms = db.prepare("SELECT COUNT(*) n FROM firms").get().n;
      const result = invoke("projects:create", { name: "Zentral", bauherr: globalRef });
      assert.equal(result.ok, true, result.error); assert.equal(result.project.bauherr_firm_kind, "global_firm");
      assert.equal(result.project.bauherr_firm_id, "global");
      const resolved = invoke("projects:getBuilder", { projectId: result.project.id });
      assert.equal(resolved.ok, true); assert.deepEqual(resolved.data.ref, { ...globalRef, projectId: null });
      assert.equal(resolved.data.firm.street, "Weg 10"); assert.equal(resolved.data.sourceMissing, false);
      assert.equal(db.prepare("SELECT COUNT(*) n FROM firms").get().n, beforeFirms);
      assert.equal(repo.listAll().find((p) => p.id === result.project.id).bauherr_firm_id, "global");
      assert.equal(repo.createProject({ name: "Legacy API" }).bauherr_firm_id, null);
    }, { modules }));
  }

  await run("Bauherr: all update envelopes preserve omission and accept explicit change or clear", () => seeded(({ invoke, repo, first }) => {
    for (const idKey of ["projectId", "project_id", "id"]) for (const nested of [true, false]) {
      const update = (patch) => invoke("projects:update", nested ? { [idKey]: first.id, patch } : { [idKey]: first.id, ...patch });
      assert.equal(update({ bauherr: localRef }).ok, true);
      assert.deepEqual(repo.getBuilder(first.id).ref, { ...localRef, projectId: first.id });
      assert.equal(update({ notes: "Erhalten" }).project.bauherr_firm_id, "local");
      assert.equal(update({ bauherr: undefined }).project.bauherr_firm_id, "local");
      assert.equal(update({ bauherr: globalRef }).project.bauherr_firm_id, "global");
      assert.equal(update({ bauherr: null }).project.bauherr_firm_id, null);
      assert.deepEqual(repo.getBuilder(first.id), { ref: null, firm: null, sourceMissing: false });
    }
  }));

  await run("Bauherr: invalid or foreign selection fails before any project write", () => seeded(({ invoke, repo, db, first }) => {
    repo.updateProject({ id: first.id, bauherr: globalRef });
    const before = repo.getById(first.id);
    const invalid = [false, "global", [], {}, { kind: "person", id: "global" }, { kind: "global_firm", id: "" },
      { kind: "global_firm", id: 123 }, { kind: "global_firm", id: "missing" },
      { kind: "project_firm", id: "foreign" }, { ...localRef, projectId: first.id }, { ...globalRef, name: "Kopie" }];
    for (const bauherr of invalid) {
      const result = invoke("projects:update", { id: first.id, patch: { name: "Must not change", bauherr } });
      assert.equal(result.ok, false, JSON.stringify(bauherr)); assert.deepEqual(repo.getById(first.id), before);
      const count = db.prepare("SELECT COUNT(*) n FROM projects").get().n;
      assert.equal(invoke("projects:create", { name: "Must not exist", bauherr }).ok, false);
      assert.equal(db.prepare("SELECT COUNT(*) n FROM projects").get().n, count);
    }
    assert.equal(invoke("projects:getBuilder", {}).ok, false);
    assert.equal(invoke("projects:getBuilder", { projectId: "missing" }).ok, false);
    assert.equal(invoke("projects:update", { id: "missing", bauherr: globalRef }).ok, false);
  }));

  await run("Bauherr: raw database columns cannot bypass validated reference input", () => seeded(({ repo, first }) => {
    const p = repo.createProject({ name: "Raw", bauherr_firm_kind: "global_firm", bauherr_firm_id: "global" });
    assert.equal(p.bauherr_firm_id, null);
    repo.updateProject({ id: first.id, bauherr: globalRef });
    repo.updateProject({ id: first.id, bauherr_firm_kind: "project_firm", bauherr_firm_id: "foreign" });
    assert.equal(repo.getById(first.id).bauherr_firm_id, "global");
  }));

  await run("Bauherr: archive retains readable reference and rejects assignment changes atomically", () => seeded(({ repo, invoke, first }) => {
    repo.updateProject({ id: first.id, bauherr: globalRef }); repo.archiveProject(first.id);
    const before = repo.getById(first.id);
    assert.equal(repo.listArchived()[0].bauherr_firm_id, "global"); assert.equal(repo.getBuilder(first.id).firm.name, "Bauherr GmbH");
    for (const bauherr of [null, localRef, globalRef]) {
      assert.equal(invoke("projects:update", { id: first.id, name: "Must not change", bauherr }).ok, false);
      assert.deepEqual(repo.getById(first.id), before);
    }
    repo.unarchiveProject(first.id); assert.equal(repo.updateProject({ id: first.id, bauherr: localRef }).bauherr_firm_id, "local");
  }));

  await run("Bauherr: address and category changes resolve live without changing the project choice", () => seeded(({ repo, db, first }) => {
    repo.updateProject({ id: first.id, bauherr: globalRef });
    db.prepare("UPDATE firms SET name='Neuer Name', street='Neu 20', role_code=99 WHERE id='global'").run();
    const result = repo.getBuilder(first.id);
    assert.equal(result.firm.name, "Neuer Name"); assert.equal(result.firm.street, "Neu 20"); assert.equal(result.firm.role_code, 99);
    assert.deepEqual(result.ref, { ...globalRef, projectId: null }); assert.equal(result.sourceMissing, false);
  }));

  for (const state of ["inactive", "removed", "trashed", "deleted"]) {
    await run(`Bauherr: ${state} source remains explicit and cannot be reassigned silently`, () => seeded(({ repo, invoke, db, first }) => {
      const ref = state === "inactive" ? localRef : globalRef;
      repo.updateProject({ id: first.id, bauherr: ref });
      if (state === "inactive") db.prepare("UPDATE project_firms SET is_active=0 WHERE id='local'").run();
      if (state === "removed") db.prepare("UPDATE firms SET removed_at='2026-09-09' WHERE id='global'").run();
      if (state === "trashed") db.prepare("UPDATE firms SET is_trashed=1 WHERE id='global'").run();
      if (state === "deleted") db.prepare("DELETE FROM firms WHERE id='global'").run();
      const result = repo.getBuilder(first.id);
      assert.equal(result.ref.id, ref.id); assert.equal(result.firm, null); assert.equal(result.sourceMissing, true);
      assert.equal(repo.updateProject({ id: first.id, notes: "Andere Änderung" }).bauherr_firm_id, ref.id);
      assert.equal(invoke("projects:update", { id: first.id, bauherr: ref }).ok, false);
      assert.equal(repo.getById(first.id).bauherr_firm_id, ref.id);
      assert.equal(repo.updateProject({ id: first.id, bauherr: null }).bauherr_firm_id, null);
    }));
  }

  await run("Bauherr: reopening keeps references and later explicit clearing", () => seeded(({ repo, database, first }) => {
    repo.updateProject({ id: first.id, bauherr: localRef }); database.closeDatabase();
    assert.equal(repo.getBuilder(first.id).firm.name, "Lokaler Bauherr");
    repo.updateProject({ id: first.id, bauherr: null }); database.closeDatabase();
    assert.deepEqual(repo.getBuilder(first.id), { ref: null, firm: null, sourceMissing: false });
  }));

  for (const dropped of [["archived_at"], ["archived_at", "project_number"]]) {
    await run(`Bauherr: historical SQL fallback without ${dropped.join("/")} retains reference`, () => seeded(({ repo, db }) => {
      for (const column of dropped) db.exec(`ALTER TABLE projects DROP COLUMN ${column}`);
      const p = repo.createProject({ name: "Fallback", bauherr: globalRef });
      assert.equal(p.bauherr_firm_id, "global"); assert.equal(repo.getBuilder(p.id).firm.name, "Bauherr GmbH");
      assert.equal(repo.listAll().find((row) => row.id === p.id).bauherr_firm_id, "global");
      assert.equal(repo.updateProject({ id: p.id, bauherr: null }).bauherr_firm_id, null);
    }));
  }

  await run("Bauherr: missing new schema column cannot silently discard assignment", () => seeded(({ db, invoke }) => {
    db.exec("ALTER TABLE projects DROP COLUMN bauherr_firm_id");
    const count = db.prepare("SELECT COUNT(*) n FROM projects").get().n;
    assert.equal(invoke("projects:create", { name: "Must fail", bauherr: globalRef }).ok, false);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM projects").get().n, count);
  }));

  await run("Bauherr: real preload forwards the new core read without a module API", async () => {
    let api; const calls = [];
    load("src/main/preload.js", { electron: { contextBridge: { exposeInMainWorld: (key, value) => { if (key === "bbmDb") api = value; } },
      ipcRenderer: { invoke: (...args) => { calls.push(args); return Promise.resolve({ ok: true }); }, on: () => {}, removeListener: () => {} } } });
    await api.projectsGetBuilder({ projectId: "project" });
    assert.deepEqual(calls, [["projects:getBuilder", { projectId: "project" }]]);
  });
}
module.exports = { runProjectBuilderTests };
if (require.main === module) runProjectBuilderTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch((error) => { console.error(error); process.exitCode = 1; });
