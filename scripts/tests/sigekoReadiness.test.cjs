"use strict";
const assert = require("node:assert/strict");
const { fixture, load } = require("./plannedConstructionStart.test.cjs");
const { createSigekoProjectService } = require("../../src/main/domain/sigeko/SigekoProjectService");
const { createReadinessService } = require("../../src/main/domain/sigeko/ReadinessService");
const { createProjectAuthorityService } = require("../../src/main/domain/sigeko/ProjectAuthorityService");
const { createAuthorityService } = require("../../src/main/domain/sigeko/AuthorityService");
const { registerSigekoIpc } = require("../../src/main/ipc/sigekoIpc");
const { registerActiveModuleIpcs } = require("../../src/main/moduleIpcRegistry");

const address = { name: "Koordination", street: "Weg 1", zip: "12345", city: "Ort" };
const projectFields = { name: "Baustelle", street: "Bauweg 2", zip: "23456", city: "Bauort", geplanter_baubeginn: "2027-01-02", end_date: "2027-12-31" };
const free = (data = address) => ({ source: "free", data });
function withReadiness(fn) {
  return fixture(ctx => {
    const overrides = { "./database": ctx.database };
    const { SigekoProjectRepository } = load("src/main/db/sigekoProjectRepo.js", overrides);
    const roleRepo = new SigekoProjectRepository({ dbProvider: ctx.database.initDatabase });
    const projectService = createSigekoProjectService({ repo: roleRepo, projects: ctx.repo,
      persons: load("src/main/db/personsRepo.js", overrides), firms: load("src/main/db/firmsRepo.js", overrides),
      projectPersons: load("src/main/db/projectPersonsRepo.js", overrides), projectFirms: load("src/main/db/projectFirmsRepo.js", overrides) });
    const { SigekoAuthoritiesRepository } = load("src/main/db/sigekoAuthoritiesRepo.js", overrides);
    const { SigekoProjectAuthoritiesRepository } = load("src/main/db/sigekoProjectAuthoritiesRepo.js", overrides);
    const stock = new SigekoAuthoritiesRepository({ dbProvider: ctx.database.initDatabase });
    const assignmentRepo = new SigekoProjectAuthoritiesRepository({ dbProvider: ctx.database.initDatabase });
    const projectAuthorityService = createProjectAuthorityService({ repo: assignmentRepo, stock, projects: ctx.repo });
    const authorityService = createAuthorityService({ repo: stock });
    const service = createReadinessService({ projectService, projects: ctx.repo, projectAuthorityService });
    const a = ctx.repo.createProject(projectFields); const b = ctx.repo.createProject({ ...projectFields, name: "Zweites Projekt" });
    ctx.db.prepare("INSERT INTO firms (id,name,street,zip,city) VALUES ('builder','Bauherr','Weg 3','34567','Ort')").run();
    ctx.db.prepare("INSERT INTO firms (id,name,street,zip,city) VALUES ('office','Büro','Weg 4','45678','Ort')").run();
    ctx.db.prepare("INSERT INTO persons (id,firm_id,name) VALUES ('person','office','Zentrale Person')").run();
    for (const project of [a, b]) {
      ctx.db.prepare("INSERT INTO project_firms (id,project_id,name,street,zip,city) VALUES (?,?,?,?,?,?)")
        .run(`firm-${project.id}`, project.id, "Lokale Firma", "Lokal 5", "56789", "Ort");
      ctx.db.prepare("INSERT INTO project_persons (id,project_firm_id,name) VALUES (?,?,?)")
        .run(`person-${project.id}`, `firm-${project.id}`, "Lokale Person");
    }
    const ready = (project = a) => {
      ctx.repo.updateProject({ id: project.id, bauherr: { kind: "global_firm", id: "builder" } });
      projectService.saveProjectData({ projectId: project.id, planning: free() });
    };
    return fn({ ...ctx, roleRepo, projectService, projectAuthorityService, authorityService, service, a, b, ready, read: (project = a) => service.getReadiness({ projectId: project.id }) });
  }, { modules: ["sigeko"] });
}
function snapshot(db) {
  const schema = db.prepare("SELECT type,name,sql FROM sqlite_master ORDER BY type,name").all();
  const data = Object.fromEntries(schema.filter(row => row.type === "table")
    .map(row => [row.name, db.prepare(`SELECT * FROM "${row.name.replace(/"/g, '""')}"`).all()]));
  return { schema, data };
}

async function runSigekoReadinessTests(run) {
  await run("S3/S4: minimal saved project is green independently of missing authority assignments", () => withReadiness(({ ready, read, a }) => {
    ready(); const result = read();
    assert.equal(result.projectId, a.id); assert.deepEqual(result.projectData, { status: "green", issues: [] });
    assert.equal(result.authorities.status, "red"); assert.equal(result.authorities.available, true);
    assert.equal(result.authorities.categories.length, 8); assert.equal(result.authorities.issues.length, 7);
    assert.ok(result.authorities.issues.every(issue => issue.code === "ASSIGNMENT_MISSING" && issue.action === "authorities"));
    assert.deepEqual(result.authorities.categories.find(item => item.category === "EMERGENCY_112"), { category: "EMERGENCY_112", status: "green" });
    assert.deepEqual(Object.keys(result), ["projectId", "projectData", "authorities"]);
  }));

  await run("S3: every required project field reports its concrete central remedy", () => withReadiness(({ db, a, ready, read }) => {
    ready();
    for (const [field, value] of Object.entries(projectFields)) {
      db.prepare(`UPDATE projects SET ${field}=? WHERE id=?`).run(" \t ", a.id);
      const result = read(); assert.equal(result.projectData.status, "red");
      assert.equal(result.projectData.issues.length, 1, field);
      assert.deepEqual({ ...result.projectData.issues[0], message: undefined },
        { code: "FIELD_MISSING", field: `project.${field}`, message: undefined, action: "project" });
      assert.match(result.projectData.issues[0].message, /Projekt: .+ fehlt\./);
      db.prepare(`UPDATE projects SET ${field}=? WHERE id=?`).run(value, a.id);
    }
    assert.equal(read().projectData.status, "green");
  }));

  await run("S3: every required builder field reports the central builder remedy", () => withReadiness(({ db, ready, read }) => {
    ready();
    for (const field of Object.keys(address)) {
      const before = db.prepare(`SELECT ${field} value FROM firms WHERE id='builder'`).get().value;
      db.prepare(`UPDATE firms SET ${field}='   ' WHERE id='builder'`).run();
      assert.deepEqual(read().projectData.issues.map(({ code, field, action }) => ({ code, field, action })),
        [{ code: "FIELD_MISSING", field: `builder.${field}`, action: "project" }]);
      db.prepare(`UPDATE firms SET ${field}=? WHERE id='builder'`).run(before);
    }
  }));

  await run("S3: both independent roles check every address field without inventing optional requirements", () => withReadiness(({ projectService, a, ready, read }) => {
    ready();
    for (const role of ["planning", "execution"]) for (const field of Object.keys(address)) {
      projectService.saveProjectData({ projectId: a.id, planning: free(), executionSameAsPlanning: false, execution: free(),
        [role]: free({ ...address, [field]: " \n " }) });
      const issues = read().projectData.issues;
      assert.equal(issues.length, 1, `${role}.${field}`);
      assert.equal(issues[0].field, `${role}.${field}`); assert.equal(issues[0].action, "roles");
    }
    projectService.saveProjectData({ projectId: a.id, planning: free(), execution: free() });
    assert.equal(read().projectData.status, "green");
  }));

  await run("S3: missing extension stays unassigned even when a complete module profile exists", () => withReadiness(({ projectService, db, read }) => {
    projectService.saveCoordinatorProfile({ patch: address });
    const before = snapshot(db); const result = read();
    assert.deepEqual(result.projectData.issues.map(({ code, field, action }) => ({ code, field, action })), [
      { code: "BUILDER_NOT_ASSIGNED", field: "builder", action: "project" },
      { code: "ROLE_NOT_ASSIGNED", field: "planning", action: "roles" },
      { code: "ROLE_NOT_ASSIGNED", field: "execution", action: "roles" },
    ]);
    assert.deepEqual(snapshot(db), before);
  }));

  await run("S3: own profile is live and inherited execution follows planning completeness", () => withReadiness(({ projectService, a, ready, read }) => {
    ready(); projectService.saveCoordinatorProfile({ patch: address });
    projectService.saveProjectData({ projectId: a.id, planning: { source: "module" } });
    assert.equal(read().projectData.status, "green");
    projectService.saveCoordinatorProfile({ patch: { city: null } });
    assert.deepEqual(read().projectData.issues.map(({ field, action }) => ({ field, action })), [
      { field: "planning.city", action: "profile" }, { field: "execution.city", action: "profile" },
    ]);
    projectService.saveCoordinatorProfile({ patch: { city: "Wieder da" } });
    assert.equal(read().projectData.status, "green");
  }));

  await run("S3: central and project contacts resolve live through their existing role service", () => withReadiness(({ db, projectService, a, ready, read }) => {
    ready(); projectService.saveProjectData({ projectId: a.id, planning: { source: "person", personId: "person" },
      executionSameAsPlanning: false, execution: { source: "project_person", personId: `person-${a.id}` } });
    assert.equal(read().projectData.status, "green");
    db.prepare("UPDATE firms SET street=NULL WHERE id='office'").run();
    db.prepare("UPDATE project_firms SET zip=NULL WHERE id=?").run(`firm-${a.id}`);
    assert.deepEqual(read().projectData.issues.map(issue => issue.field), ["planning.street", "execution.zip"]);
    assert.ok(read().projectData.issues.every(issue => issue.action === "roles"));
  }));

  await run("S3: project-local builder is resolved without global category inference", () => withReadiness(({ repo, db, a, b, ready, read }) => {
    ready(); repo.updateProject({ id: a.id, bauherr: { kind: "project_firm", id: `firm-${a.id}` } });
    assert.equal(read().projectData.status, "green");
    db.prepare("UPDATE project_firms SET city=NULL WHERE id=?").run(`firm-${a.id}`);
    assert.deepEqual(read().projectData.issues.map(issue => issue.field), ["builder.city"]);
    assert.equal(read(b).projectData.issues[0].code, "BUILDER_NOT_ASSIGNED");
  }));

  await run("S3: deleted and unavailable builder sources stay explicit without fallback", () => withReadiness(({ db, repo, a, ready, read }) => {
    ready();
    for (const change of ["removed_at='2026-09-09'", "is_trashed=1"]) {
      db.prepare(`UPDATE firms SET ${change} WHERE id='builder'`).run();
      assert.equal(read().projectData.issues[0].code, "BUILDER_SOURCE_MISSING");
      assert.equal(repo.getById(a.id).bauherr_firm_id, "builder");
      db.prepare("UPDATE firms SET removed_at=NULL,is_trashed=0 WHERE id='builder'").run();
    }
    db.prepare("DELETE FROM firms WHERE id='builder'").run();
    assert.equal(read().projectData.issues[0].code, "BUILDER_SOURCE_MISSING");
    repo.updateProject({ id: a.id, bauherr: { kind: "project_firm", id: `firm-${a.id}` } });
    db.prepare("UPDATE project_firms SET is_active=0 WHERE id=?").run(`firm-${a.id}`);
    assert.equal(read().projectData.issues[0].code, "BUILDER_SOURCE_MISSING");
  }));

  await run("S3: deleted profile and removed external person remain different actionable problems", () => withReadiness(({ db, projectService, a, ready, read }) => {
    ready(); projectService.saveCoordinatorProfile({ patch: address });
    projectService.saveProjectData({ projectId: a.id, planning: { source: "module" }, executionSameAsPlanning: false,
      execution: { source: "person", personId: "person" } });
    db.prepare("DELETE FROM sigeko_profiles").run(); db.prepare("UPDATE persons SET removed_at='2026-09-09' WHERE id='person'").run();
    assert.deepEqual(read().projectData.issues.map(({ code, action }) => ({ code, action })), [
      { code: "PROFILE_MISSING", action: "profile" }, { code: "ROLE_SOURCE_MISSING", action: "roles" },
    ]);
    db.prepare("DELETE FROM persons WHERE id='person'").run();
    assert.equal(read().projectData.issues[1].code, "ROLE_SOURCE_MISSING");
  }));

  await run("S3: readiness isolates project assignments and never writes schema or domain data", () => withReadiness(({ db, a, b, projectService, ready, read }) => {
    ready(a); ready(b);
    projectService.saveProjectData({ projectId: b.id, planning: free({ ...address, name: "" }) });
    const before = snapshot(db);
    for (let index = 0; index < 3; ++index) {
      assert.equal(read(a).projectData.status, "green"); assert.equal(read(b).projectData.status, "red");
    }
    assert.deepEqual(snapshot(db), before);
    assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='sigeko_authorities'").get(), undefined);
  }));

  await run("S3: archived projects remain readable and readiness does not change archive authorization", () => withReadiness(({ repo, db, a, projectService, ready, read }) => {
    ready(); repo.archiveProject(a.id); const before = snapshot(db);
    assert.equal(read().projectData.status, "green");
    assert.throws(() => projectService.saveProjectData({ projectId: a.id }), { code: "PROJECT_ARCHIVED" });
    assert.deepEqual(snapshot(db), before);
  }));

  await run("S3: read payload validation rejects malformed unknown and attempted write fields", () => withReadiness(({ a, service, db }) => {
    const before = snapshot(db);
    for (const payload of [undefined, null, [], "id", {}, { projectId: 4 }, { projectId: "" },
      { projectId: a.id, status: "green" }, { projectId: a.id, patch: {} }]) {
      assert.throws(() => service.getReadiness(payload), { code: "INVALID_INPUT" });
    }
    assert.throws(() => service.getReadiness({ projectId: "missing" }), { code: "PROJECT_NOT_FOUND" });
    assert.equal(service.getReadiness({ projectId: ` ${a.id} ` }).projectId, a.id);
    assert.deepEqual(snapshot(db), before);
  }));

  await run("S3: completeness does not invent syntax checks or derive duration from dates", () => withReadiness(({ db, a, ready, read }) => {
    ready(); db.prepare("UPDATE projects SET geplanter_baubeginn='Bestandsangabe',end_date='Ungeprüft',zip='X' WHERE id=?").run(a.id);
    assert.deepEqual(read().projectData, { status: "green", issues: [] });
    assert.equal(Object.hasOwn(read(), "duration"), false);
  }));

  await run("S3: genuine database failures propagate instead of masquerading as incomplete data", () => withReadiness(({ db, service, ready, a }) => {
    ready(); db.exec("DROP TABLE sigeko_projects");
    assert.throws(() => service.getReadiness({ projectId: a.id }), /no such table: sigeko_projects/);
  }));

  await run("S3: real preload and guarded IPC require the current SiGeKo license for each read", () => withReadiness(async ({ a, ready, service, projectService }) => {
    ready(); const handlers = new Map(); const status = modules => ({ valid: true, license: { modules } }); let license = status(["sigeko"]);
    registerActiveModuleIpcs({ licenseStatus: license, getLicenseStatus: () => license, ipcMain: { handle: (key, fn) => handlers.set(key, fn) },
      registrars: { sigeko: ({ ipcMain }) => registerSigekoIpc({ ipcMain, projectService, readinessService: service }) } });
    let api;
    load("src/main/preload.js", { electron: { contextBridge: { exposeInMainWorld: (key, value) => { if (key === "bbmDb") api = value; } },
      ipcRenderer: { invoke: async (key, payload) => handlers.get(key)({}, payload) } } });
    assert.deepEqual((await api.sigekoGetReadiness({ projectId: a.id })), { ok: true, data: service.getReadiness({ projectId: a.id }) });
    for (const revoked of [status([]), status(["protokoll"]), { ...status(["sigeko"]), valid: false }, null]) {
      license = revoked; await assert.rejects(api.sigekoGetReadiness({ projectId: a.id }), { code: "MODULE_NOT_ACTIVE" });
    }
    license = status(["sigeko"]); assert.equal((await api.sigekoGetReadiness({ projectId: "missing" })).code, "PROJECT_NOT_FOUND");
  }));

  await run("S4.3: readiness aggregates live saved authorities without changing snapshots or project completeness", () => withReadiness(({ ready, read, a, b, db, authorityService, projectAuthorityService }) => {
    ready();
    let first;
    for (const category of ["LABOR_AUTHORITY", "HOSPITAL", "ACCIDENT_DOCTOR", "WATER", "ELECTRICITY", "GAS", "POLICE"]) {
      let source = authorityService.saveAuthorityRecord({ patch: { category, organization: category, street: "Kontaktweg 1", zip: "23456", city: "Bauort",
        phone: "12345", emergency_phone: "54321", source: "Originalquelle geprüft", verification_note: "Kontakt und Eignung geprüft",
        scope_street: a.street, scope_zip: a.zip, scope_city: a.city } });
      source = authorityService.confirmAuthorityRecord({ id: source.id, expectedRevision: source.revision });
      if (!first) first = source;
      projectAuthorityService.assignProjectAuthority({ projectId: a.id, category, sourceId: source.id, sourceRevision: source.revision,
        expectedRevision: 0, expectedAddress: { street: a.street, zip: a.zip, city: a.city }, status: "confirmed", note: "Zuständigkeit bzw. Nähe und Eignung zur Baustelle geprüft" });
    }
    let before = snapshot(db);
    assert.equal(read().authorities.status, "green"); assert.deepEqual(read().authorities.issues, []);
    assert.equal(read(b).authorities.status, "orange"); // Known stock is visible, but another project has no assignments.
    assert.deepEqual(snapshot(db), before);
    authorityService.saveAuthorityRecord({ id: first.id, expectedRevision: first.revision, patch: { phone: "Neue Telefonnummer" } });
    before = snapshot(db);
    const changed = read(); assert.equal(changed.authorities.status, "orange"); assert.equal(changed.projectData.status, "green");
    assert.ok(changed.authorities.issues.some(issue => issue.code === "SOURCE_CHANGED" && issue.category === "LABOR_AUTHORITY" && issue.action === "authorities"));
    assert.match(changed.authorities.issues[0].message, /^Arbeitsschutzbehörde:/);
    assert.deepEqual(snapshot(db), before);
    db.prepare("DELETE FROM sigeko_project_authorities WHERE project_id=? AND category='POLICE'").run(a.id);
    db.prepare("DELETE FROM sigeko_authority_records WHERE category='POLICE'").run();
    assert.equal(read().authorities.status, "red"); assert.equal(read().projectData.status, "green");
  }));

  await run("S4.3: authority storage errors remain technical failures through readiness IPC", () => withReadiness(async ({ ready, a, db, service, projectService, projectAuthorityService }) => {
    ready(); const handlers = new Map();
    registerSigekoIpc({ ipcMain: { handle: (key, fn) => handlers.set(key, fn) }, projectService, projectAuthorityService, readinessService: service });
    assert.deepEqual(await handlers.get("sigeko:getReadiness")({}, { projectId: a.id }), { ok: true, data: service.getReadiness({ projectId: a.id }) });
    db.exec("DROP TABLE sigeko_project_authorities");
    const result = await handlers.get("sigeko:getReadiness")({}, { projectId: a.id });
    assert.equal(result.ok, false); assert.equal(result.code, "SQLITE_ERROR"); assert.match(result.error, /sigeko_project_authorities/);
  }));

  await run("S3: default IPC readiness uses the same project service and preserves technical error codes", async () => {
    const handlers = new Map(); const failure = Object.assign(new Error("Lesen fehlgeschlagen"), { code: "SQLITE_BUSY" });
    const projectService = { getProjectData() { throw failure; } };
    registerSigekoIpc({ ipcMain: { handle: (key, fn) => handlers.set(key, fn) }, projectService });
    assert.deepEqual(await handlers.get("sigeko:getReadiness")({}, { projectId: "id" }),
      { ok: false, error: "Lesen fehlgeschlagen", code: "SQLITE_BUSY" });
    const service = createReadinessService({ projectService: { getProjectData: () => ({ project: { id: "id" } }) },
      projects: { getBuilder() { throw failure; } } });
    assert.throws(() => service.getReadiness({ projectId: "id" }), error => error === failure);
  });
}

module.exports = { runSigekoReadinessTests };
if (require.main === module) runSigekoReadinessTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
