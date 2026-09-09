"use strict";
const assert = require("node:assert/strict");
const { fixture, load } = require("./plannedConstructionStart.test.cjs");
const { createAuthorityService } = require("../../src/main/domain/sigeko/AuthorityService");
const { createProjectAuthorityService } = require("../../src/main/domain/sigeko/ProjectAuthorityService");
const { registerSigekoIpc } = require("../../src/main/ipc/sigekoIpc");
const { registerActiveModuleIpcs } = require("../../src/main/moduleIpcRegistry");
const { AUTHORITY_CATEGORIES, MUTABLE_AUTHORITY_CATEGORIES, AUTHORITY_COLUMNS } = require("../../src/shared/sigeko/authorities.cjs");
const address = { street: "Bauweg 12", zip: "12345", city: "Testort" };
const table = "sigeko_project_authorities";
const rows = db => db.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
const code = (fn, expected) => assert.throws(fn, { code: expected });
const item = (result, category = "LABOR_AUTHORITY") => result.categories.find(entry => entry.category === category);
const issues = entry => entry.issues.map(issue => issue.code);

function withAssignments(fn) {
  return fixture(ctx => {
    const overrides = { "./database": ctx.database };
    const { SigekoAuthoritiesRepository } = load("src/main/db/sigekoAuthoritiesRepo.js", overrides);
    const { SigekoProjectAuthoritiesRepository } = load("src/main/db/sigekoProjectAuthoritiesRepo.js", overrides);
    const stock = new SigekoAuthoritiesRepository({ dbProvider: ctx.database.initDatabase });
    const assignmentRepo = new SigekoProjectAuthoritiesRepository({ dbProvider: ctx.database.initDatabase });
    let serial = 0, tick = 0;
    const dependencies = { clock: () => new Date(Date.UTC(2026, 8, 10, 12, 0, tick++)).toISOString(), uuid: () => `s42-${++serial}` };
    const authorities = createAuthorityService({ repo: stock, ...dependencies });
    const service = createProjectAuthorityService({ repo: assignmentRepo, stock, projects: ctx.repo, ...dependencies });
    const a = ctx.repo.createProject({ name: "Baustelle A", ...address });
    const b = ctx.repo.createProject({ name: "Baustelle B", street: "Andere Straße 3", zip: "23456", city: "Anderer Ort" });
    const create = (category = "LABOR_AUTHORITY", patch = {}, confirmed = true) => {
      const row = authorities.saveAuthorityRecord({ patch: { category, organization: `Stelle ${category}`, street: "Kontaktweg 1", zip: "98765", city: "Kontaktort",
        phone: "0123 456", email: "kontakt@example.test", emergency_phone: "0123 789", source: "Originalquelle geprüft", verification_note: "Betreiber und Kontakt geprüft",
        scope_street: address.street, scope_zip: address.zip, scope_city: address.city, ...patch } });
      return confirmed ? authorities.confirmAuthorityRecord({ id: row.id, expectedRevision: row.revision }) : row;
    };
    const read = (project = a) => service.getProjectAuthorities({ projectId: project.id });
    const payload = (source, extra = {}) => ({ projectId: a.id, category: source.category, sourceId: source.id, sourceRevision: source.revision,
      expectedRevision: 0, expectedAddress: { ...address }, status: "confirmed", note: "Zuständigkeit sowie Nähe und Eignung für diese Baustelle geprüft", ...extra });
    const assign = (source, extra) => service.assignProjectAuthority(payload(source, extra));
    const apply = selections => service.applyKnownProjectAuthorities({ projectId: a.id, expectedAddress: { ...address }, selections });
    return fn({ ...ctx, stock, assignmentRepo, authorities, service, a, b, create, read, payload, assign, apply });
  }, { modules: ["sigeko"] });
}

async function runSigekoProjectAuthoritiesTests(run) {
  await run("S4.2: core-only initialization does not create project authority storage", () => fixture(({ db }) => {
    assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name=?").get(table), undefined);
  }));

  await run("S4.2: empty projects expose all eight categories and fixed emergency numbers without writes", () => withAssignments(({ read, db }) => {
    const before = rows(db), schema = db.prepare("SELECT * FROM sqlite_master ORDER BY name").all();
    const result = read(); assert.equal(result.status, "red"); assert.deepEqual(result.address, address);
    assert.deepEqual(result.categories.map(entry => entry.category), AUTHORITY_CATEGORIES);
    const emergency = item(result, "EMERGENCY_112"); assert.equal(emergency.fixedPhone, "112"); assert.equal(emergency.status, "green");
    assert.equal(emergency.assignment, null); assert.equal(item(result, "POLICE").fixedPhone, "110");
    for (const category of MUTABLE_AUTHORITY_CATEGORIES) {
      const entry = item(result, category); assert.equal(entry.status, "red"); assert.equal(entry.assignment, null);
      assert.ok(issues(entry).includes("ASSIGNMENT_MISSING")); assert.equal(entry.proposal, null);
    }
    read(); assert.deepEqual(rows(db), before); assert.deepEqual(db.prepare("SELECT * FROM sqlite_master ORDER BY name").all(), schema);
  }));

  await run("S4.2: additive migration retains S4.1 records and existing project assignments on repetition", () => withAssignments(({ create, assign, db, database }) => {
    const source = create(); const stockBefore = db.prepare("SELECT * FROM sigeko_authority_records ORDER BY id").all();
    db.exec(`DROP TABLE ${table}`); database.ensureSchema(db, { moduleIds: ["sigeko"] });
    assign(source); const before = rows(db);
    database.ensureSchema(db, { moduleIds: ["sigeko"] }); database.ensureSchema(db, { moduleIds: ["sigeko"] });
    assert.deepEqual(rows(db), before); assert.deepEqual(db.prepare("SELECT * FROM sigeko_authority_records ORDER BY id").all(), stockBefore);
    assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
  }));

  await run("S4.2: exact confirmed non-medical sources propose a write-free atomic takeover", () => withAssignments(({ create, read, apply, db }) => {
    for (const category of ["LABOR_AUTHORITY", "WATER", "ELECTRICITY", "GAS", "POLICE"]) create(category);
    const before = rows(db); const preview = read(); const proposals = preview.categories.flatMap(entry => entry.proposal ? [entry.proposal] : []);
    assert.equal(proposals.length, 5); assert.deepEqual(rows(db), before);
    const applied = apply(proposals);
    for (const proposal of proposals) {
      const entry = item(applied, proposal.category); assert.equal(entry.status, "green"); assert.deepEqual(entry.issues, []);
      assert.equal(entry.proposal, null); assert.equal(entry.assignment.assessment_method, "known_stock");
      assert.equal(entry.assignment.assessment_status, "confirmed"); assert.equal(entry.assignment.revision, 1);
    }
    assert.equal(rows(db).length, 5);
  }));

  await run("S4.2: medical proximity and suitability require an explicit project assessment", () => withAssignments(({ create, read, assign, apply }) => {
    for (const category of ["HOSPITAL", "ACCIDENT_DOCTOR"]) {
      const source = create(category); const candidate = item(read(), category);
      assert.equal(candidate.proposal, null); assert.equal(candidate.status, "orange"); assert.ok(issues(candidate).includes("MEDICAL_REVIEW_REQUIRED"));
      code(() => apply([{ category, sourceId: source.id, sourceRevision: source.revision, expectedRevision: 0 }]), "MATCH_UNCERTAIN");
      const assessed = item(assign(source), category); assert.equal(assessed.status, "green"); assert.equal(assessed.assignment.assessment_method, "manual");
      assert.match(assessed.assignment.assessment_note, /Nähe und Eignung/);
    }
  }));

  await run("S4.2: explicit complete project assessments make the full set green", () => withAssignments(({ create, assign, read }) => {
    for (const category of MUTABLE_AUTHORITY_CATEGORIES) assign(create(category));
    const result = read(); assert.equal(result.status, "green"); assert.ok(result.categories.every(entry => entry.status === "green"));
  }));

  await run("S4.2: only conservative Unicode case and whitespace normalization permit exact matching", () => withAssignments(({ create, read, repo, a }) => {
    repo.updateProject({ id: a.id, street: "Bauwég 12", city: " TESTORT " });
    create("LABOR_AUTHORITY", { scope_street: "  BAUWÉG   12  ", scope_city: "testort" });
    assert.ok(item(read()).proposal);
    create("WATER", { scope_street: "Bauwég Nr. 12" }); assert.equal(item(read(), "WATER").proposal, null);
    create("GAS", { scope_street: "Bauwég 14" }); assert.equal(item(read(), "GAS").proposal, null);
  }));

  await run("S4.2: postcode city and free-text area alone cannot imply green project jurisdiction", () => withAssignments(({ create, read, db }) => {
    create("LABOR_AUTHORITY", { scope_street: null });
    create("WATER", { scope_street: null, scope_zip: null, scope_area: "Testort und Umgebung" });
    create("GAS", { scope_street: null, scope_zip: null, scope_city: null, scope_area: "Bauweg 12, 12345 Testort" });
    for (const category of ["LABOR_AUTHORITY", "WATER", "GAS"]) {
      const entry = item(read(), category); assert.equal(entry.proposal, null); assert.notEqual(entry.status, "green");
    }
    assert.deepEqual(rows(db), []);
  }));

  await run("S4.2: conflicting exact candidates including unconfirmed records block automatic uniqueness", () => withAssignments(({ create, read, authorities, apply }) => {
    const original = create(); const proposal = item(read()).proposal; assert.ok(proposal);
    const contradictory = create("LABOR_AUTHORITY", { organization: "Weiterer möglicher Zuständiger" }, false);
    const entry = item(read()); assert.equal(entry.proposal, null); assert.ok(issues(entry).includes("MULTIPLE_MATCHES"));
    code(() => apply([proposal]), "MATCH_UNCERTAIN");
    authorities.saveAuthorityRecord({ id: contradictory.id, expectedRevision: contradictory.revision, patch: { scope_street: null } });
    assert.equal(item(read()).proposal.sourceId, original.id);
  }));

  await run("S4.2: manual snapshots retain every source value and survive source edits and deletion", () => withAssignments(({ create, assign, read, authorities, db }) => {
    const source = create(); const assigned = item(assign(source)).assignment; const original = rows(db);
    assert.deepEqual(assigned.snapshot, Object.fromEntries(AUTHORITY_COLUMNS.map(key => [key, source[key]])));
    assert.equal(assigned.source_id, source.id); assert.equal(assigned.source_revision, source.revision);
    authorities.saveAuthorityRecord({ id: source.id, expectedRevision: source.revision, patch: { organization: "Neue Dienststelle" } });
    const changed = item(read()); assert.equal(changed.status, "orange"); assert.ok(issues(changed).includes("SOURCE_CHANGED"));
    assert.equal(changed.assignment.snapshot.organization, source.organization); assert.deepEqual(rows(db), original);
    db.prepare("DELETE FROM sigeko_authority_records WHERE id=?").run(source.id);
    const missing = item(read()); assert.equal(missing.status, "orange"); assert.ok(issues(missing).includes("SOURCE_MISSING"));
    assert.deepEqual(missing.assignment.snapshot, assigned.snapshot); assert.deepEqual(rows(db), original);
  }));

  await run("S4.2: matching source IDs and revisions cannot hide changed snapshot content", () => withAssignments(({ create, assign, read, db }) => {
    const source = create(); assign(source);
    db.prepare("UPDATE sigeko_authority_records SET phone='Different imported contact' WHERE id=?").run(source.id);
    const result = item(read()); assert.equal(result.status, "orange"); assert.ok(issues(result).includes("SOURCE_CHANGED"));
    assert.equal(result.assignment.snapshot.phone, source.phone);
  }));

  await run("S4.2: changed or incomplete construction addresses invalidate previous assessment", () => withAssignments(({ create, assign, read, repo, a, db }) => {
    assign(create()); const before = rows(db);
    repo.updateProject({ id: a.id, street: "Andere Baustelle 2" });
    assert.equal(item(read()).status, "orange"); assert.ok(issues(item(read())).includes("ADDRESS_CHANGED"));
    repo.updateProject({ id: a.id, street: null });
    assert.ok(issues(item(read())).includes("ADDRESS_INCOMPLETE")); assert.deepEqual(rows(db), before);
  }));

  await run("S4.2: manual uncertainty and unconfirmed source cannot be promoted to green", () => withAssignments(({ create, assign, read }) => {
    const source = create(); const result = item(assign(source, { status: "uncertain", note: " Zuständigkeit noch offen " }));
    assert.equal(result.status, "orange"); assert.equal(result.assignment.assessment_note, "Zuständigkeit noch offen");
    assert.ok(issues(result).includes("ASSIGNMENT_UNCERTAIN"));
    const draft = create("WATER", { emergency_phone: null }, false); assign(draft);
    const water = item(read(), "WATER"); assert.equal(water.status, "orange"); assert.ok(issues(water).includes("SOURCE_UNCONFIRMED"));
  }));

  await run("S4.2: new contradictory exact records invalidate an earlier automatic match", () => withAssignments(({ create, read, apply, db }) => {
    create(); apply([item(read()).proposal]); const before = rows(db);
    create("LABOR_AUTHORITY", { organization: "Zweiter exakter Kandidat" }, false);
    const result = item(read()); assert.equal(result.status, "orange"); assert.ok(issues(result).includes("MATCH_UNCERTAIN"));
    assert.deepEqual(rows(db), before);
  }));

  await run("S4.2: new or changed exact contradictions require renewed explicit manual assessment", () => withAssignments(({ create, assign, read, authorities }) => {
    const source = create(); assign(source); assert.equal(item(read()).status, "green");
    const contradictory = create("LABOR_AUTHORITY", { organization: "Neue widersprechende Quelle" });
    assert.equal(item(read()).status, "orange"); assert.ok(issues(item(read())).includes("MATCH_CHANGED"));
    assign(source, { expectedRevision: 1, note: "Neue widersprechende Quelle berücksichtigt und Zuständigkeit erneut geprüft" });
    assert.equal(item(read()).status, "green");
    authorities.saveAuthorityRecord({ id: contradictory.id, expectedRevision: contradictory.revision, patch: { organization: "Erneut veränderte Gegenquelle" } });
    assert.equal(item(read()).status, "orange"); assert.ok(issues(item(read())).includes("MATCH_CHANGED"));
  }));

  await run("S4.2: a single new exact source challenges a previously assessed regional contact", () => withAssignments(({ create, assign, read }) => {
    const regional = create("LABOR_AUTHORITY", { scope_street: null }); assign(regional); assert.equal(item(read()).status, "green");
    create("LABOR_AUTHORITY", { organization: "Einziger neuer exakter Kandidat" });
    assert.equal(item(read()).status, "orange"); assert.ok(issues(item(read())).includes("MATCH_CHANGED"));
    assign(regional, { expectedRevision: 1, note: "Exakten Gegenkandidaten geprüft, regionale Stelle ausdrücklich bestätigt" });
    assert.equal(item(read()).status, "green");
  }));

  await run("S4.2: explicit reassignment preserves identity but advances revision and replaces the current snapshot", () => withAssignments(({ create, assign, read }) => {
    const first = item(assign(create())).assignment; const secondSource = create("LABOR_AUTHORITY", { organization: "Neue ausdrückliche Auswahl" });
    const second = item(assign(secondSource, { expectedRevision: first.revision })).assignment;
    assert.equal(second.id, first.id); assert.equal(second.created_at, first.created_at); assert.equal(second.revision, first.revision + 1);
    assert.notEqual(second.updated_at, first.updated_at); assert.equal(second.snapshot.organization, secondSource.organization);
    assert.equal(item(read()).status, "green");
  }));

  await run("S4.2: stale assignment source and address revisions reject writes without changing rows", () => withAssignments(({ create, assign, payload, service, authorities, repo, a, db }) => {
    const source = create(); assign(source); let before = rows(db);
    code(() => assign(source), "ASSIGNMENT_CONFLICT"); assert.deepEqual(rows(db), before);
    authorities.saveAuthorityRecord({ id: source.id, expectedRevision: source.revision, patch: { city: "Neue Kontaktstadt" } });
    code(() => assign(source, { expectedRevision: 1 }), "AUTHORITY_CONFLICT"); assert.deepEqual(rows(db), before);
    repo.updateProject({ id: a.id, street: "Veränderte Baustelle" });
    code(() => service.assignProjectAuthority(payload(source, { expectedRevision: 1 })), "PROJECT_ADDRESS_CONFLICT"); assert.deepEqual(rows(db), before);
  }));

  await run("S4.2: batch failure on a later selection rolls back every preceding assignment", () => withAssignments(({ create, read, apply, db }) => {
    create("LABOR_AUTHORITY"); create("WATER");
    const selections = [item(read()).proposal, { ...item(read(), "WATER").proposal, sourceRevision: 999 }];
    code(() => apply(selections), "AUTHORITY_CONFLICT"); assert.deepEqual(rows(db), []);
    selections[1] = item(read(), "WATER").proposal;
    db.exec(`CREATE TRIGGER reject_second_assignment AFTER INSERT ON ${table} WHEN NEW.category='WATER' BEGIN SELECT RAISE(ABORT, 'second-assignment-failed'); END`);
    assert.throws(() => apply(selections), /second-assignment-failed/); assert.deepEqual(rows(db), []);
    db.exec("DROP TRIGGER reject_second_assignment"); apply(selections); assert.equal(rows(db).length, 2);
  }));

  await run("S4.2: archive guards preserve readable assignments and never alter reusable stock", () => withAssignments(({ create, assign, read, apply, repo, a, db }) => {
    const source = create(); assign(source); create("WATER"); const proposal = item(read(), "WATER").proposal;
    const before = rows(db), stockBefore = db.prepare("SELECT * FROM sigeko_authority_records ORDER BY id").all();
    repo.archiveProject(a.id); assert.equal(item(read()).status, "green");
    code(() => assign(source, { expectedRevision: 1 }), "PROJECT_ARCHIVED"); code(() => apply([proposal]), "PROJECT_ARCHIVED");
    assert.deepEqual(rows(db), before); assert.deepEqual(db.prepare("SELECT * FROM sigeko_authority_records ORDER BY id").all(), stockBefore);
  }));

  await run("S4.2: project isolation reopening and cascading deletion preserve other snapshots and global stock", () => withAssignments(({ create, assign, read, a, b, database, invoke, db }) => {
    const source = create(); assign(source); assert.equal(item(read(b)).assignment, null);
    assign(source, { projectId: b.id, expectedAddress: { street: b.street, zip: b.zip, city: b.city } });
    const before = rows(db); database.closeDatabase(); assert.equal(item(read()).assignment.snapshot.id, source.id);
    assert.equal(invoke("projects:deleteForever", { id: a.id }).ok, true);
    const freshDb = database.initDatabase(); assert.deepEqual(rows(freshDb), before.filter(row => row.project_id === b.id));
    assert.equal(freshDb.prepare("SELECT id FROM sigeko_authority_records WHERE id=?").get(source.id).id, source.id);
  }));

  await run("S4.2: strict assignment payloads reject forged snapshots statuses metadata and invalid references", () => withAssignments(({ create, service, payload, assign, db }) => {
    const source = create(); const base = payload(source); const before = rows(db);
    for (const value of [undefined, null, [], 4, "project"]) {
      for (const method of ["getProjectAuthorities", "assignProjectAuthority", "applyKnownProjectAuthorities"]) code(() => service[method](value), "INVALID_INPUT");
    }
    for (const key of ["snapshot", "snapshot_json", "assignment", "id", "revision", "assessment_method", "match_context_hash", "verified_at", "created_at", "updated_at", "fixedPhone"]) {
      code(() => service.assignProjectAuthority({ ...base, [key]: "forged" }), "INVALID_INPUT");
    }
    for (const note of [undefined, null, "  ", 4]) code(() => assign(source, { note }), "INVALID_INPUT");
    for (const status of [null, "green", "manual", true]) code(() => assign(source, { status }), "INVALID_INPUT");
    for (const revision of [undefined, null, -1, 1.5, "0"]) code(() => assign(source, { expectedRevision: revision }), "INVALID_INPUT");
    for (const sourceRevision of [undefined, null, 0, -1, 1.5, "1"]) code(() => assign(source, { sourceRevision }), "INVALID_INPUT");
    for (const expectedAddress of [undefined, null, [], {}, { street: address.street }, { ...address, projectId: "injected" }]) code(() => assign(source, { expectedAddress }), "INVALID_INPUT");
    code(() => assign(source, { category: "EMERGENCY_112" }), "INVALID_CATEGORY");
    code(() => assign(source, { category: "POLICE" }), "INVALID_CATEGORY");
    code(() => assign(source, { sourceId: "missing" }), "AUTHORITY_NOT_FOUND");
    code(() => assign(source, { projectId: "missing" }), "PROJECT_NOT_FOUND");
    code(() => service.getProjectAuthorities({ projectId: "missing" }), "PROJECT_NOT_FOUND");
    code(() => service.getProjectAuthorities({ projectId: base.projectId, status: "green" }), "INVALID_INPUT");
    assert.deepEqual(rows(db), before);
  }));

  await run("S4.2: batch validation rejects duplicates forged proposals and replacing existing assignments", () => withAssignments(({ create, read, apply, assign, service, a, db }) => {
    const source = create(); const proposal = item(read()).proposal;
    for (const selections of [undefined, null, {}, [], Array(8).fill(proposal), [proposal, proposal], [{ ...proposal, status: "green" }]]) {
      code(() => apply(selections), "INVALID_INPUT"); assert.deepEqual(rows(db), []);
    }
    code(() => service.applyKnownProjectAuthorities({ projectId: a.id, expectedAddress: address, selections: [proposal], note: "forged" }), "INVALID_INPUT");
    assign(source); const before = rows(db);
    code(() => apply([proposal]), "ASSIGNMENT_CONFLICT");
    code(() => apply([{ ...proposal, expectedRevision: 1 }]), "MATCH_UNCERTAIN"); assert.deepEqual(rows(db), before);
  }));

  await run("S4.2: SQLite rejects duplicate project categories and forged structural values", () => withAssignments(({ create, assign, db }) => {
    assign(create()); const before = rows(db), row = before[0];
    const columns = Object.keys(row); const duplicate = db.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(key => `@${key}`).join(",")})`);
    assert.throws(() => duplicate.run({ ...row, id: "duplicate" }), /UNIQUE constraint failed/);
    for (const sql of ["category='EMERGENCY_112'", "assessment_status='green'", "assessment_method='ai'", "revision=0", "source_revision=0"]) {
      assert.throws(() => db.prepare(`UPDATE ${table} SET ${sql} WHERE id=?`).run(row.id), /CHECK constraint failed/);
    }
    assert.deepEqual(rows(db), before);
  }));

  await run("S4.2: real preload and current module guard protect all project authority endpoints", () => withAssignments(async ({ service, create, a, payload, db }) => {
    const handlers = new Map(); const status = modules => ({ valid: true, license: { modules } }); let license = status(["sigeko"]);
    registerActiveModuleIpcs({ licenseStatus: license, getLicenseStatus: () => license, ipcMain: { handle: (name, fn) => handlers.set(name, fn) },
      registrars: { sigeko: ({ ipcMain }) => registerSigekoIpc({ ipcMain, projectAuthorityService: service }) } });
    let api;
    load("src/main/preload.js", { electron: { contextBridge: { exposeInMainWorld: (name, value) => { if (name === "bbmDb") api = value; } },
      ipcRenderer: { invoke: async (name, value) => handlers.get(name)({}, value) } } });
    const source = create(); const preview = await api.sigekoGetProjectAuthorities({ projectId: a.id }); assert.equal(preview.ok, true, preview.error);
    const known = { projectId: a.id, expectedAddress: address, selections: [item(preview.data).proposal] };
    const applied = await api.sigekoApplyKnownProjectAuthorities(known); assert.equal(applied.ok, true, applied.error);
    assert.equal(item(applied.data).status, "green");
    const assigned = await api.sigekoAssignProjectAuthority(payload(source, { expectedRevision: 1, status: "uncertain", note: "Unklar" }));
    assert.equal(assigned.ok, true, assigned.error); assert.equal(item(assigned.data).status, "orange");
    const before = rows(db);
    for (const revoked of [status([]), status(["protokoll"]), { ...status(["sigeko"]), valid: false }, null]) {
      license = revoked;
      for (const [method, value] of [["sigekoGetProjectAuthorities", { projectId: a.id }], ["sigekoAssignProjectAuthority", payload(source)], ["sigekoApplyKnownProjectAuthorities", known]]) {
        await assert.rejects(api[method](value), { code: "MODULE_NOT_ACTIVE" });
      }
      assert.deepEqual(rows(db), before);
    }
    license = status(["sigeko"]); assert.equal((await api.sigekoGetProjectAuthorities({ projectId: "missing" })).code, "PROJECT_NOT_FOUND");
    assert.equal((await api.sigekoAssignProjectAuthority(payload(source))).code, "ASSIGNMENT_CONFLICT");
    db.exec(`DROP TABLE ${table}`); const failed = await api.sigekoGetProjectAuthorities({ projectId: a.id });
    assert.equal(failed.ok, false); assert.equal(failed.code, "SQLITE_ERROR");
  }));
}

module.exports = { runSigekoProjectAuthoritiesTests };
if (require.main === module) runSigekoProjectAuthoritiesTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
