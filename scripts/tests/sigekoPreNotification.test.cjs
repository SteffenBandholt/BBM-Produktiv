"use strict";
const assert = require("node:assert/strict");
const { fixture, load } = require("./plannedConstructionStart.test.cjs");
const { createPreNotificationService } = require("../../src/main/domain/sigeko/PreNotificationService");
const { createSigekoProjectService } = require("../../src/main/domain/sigeko/SigekoProjectService");
const { registerSigekoIpc } = require("../../src/main/ipc/sigekoIpc");
const { registerActiveModuleIpcs } = require("../../src/main/moduleIpcRegistry");

const TABLE = "sigeko_pre_notifications";
const CONTACT_FIELDS = ["name", "street", "zip", "city", "phone", "email"];
const rows = (db, table = TABLE) => db.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
const code = (fn, expected = "INVALID_INPUT") => assert.throws(fn, { code: expected });
const contact = name => ({ name, street: "Kontaktweg 1", zip: "12345", city: "Testort", phone: "0123 456", email: "kontakt@example.test" });
const complete = () => ({ building_type_override: "Neubau Wohnhaus", duration_months: 9, max_workers: 35,
  employer_count: 7, self_employed_count: 2, firms_mode: "unknown" });
const centralTables = ["projects", "firms", "project_firms", "project_global_firms", "persons", "project_persons",
  "sigeko_projects", "sigeko_profiles", "sigeko_authority_records", "sigeko_project_authorities"];
const centralSnapshot = db => centralTables.map(table => db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all());

function withNotifications(fn, options = {}) {
  return fixture(ctx => {
    const overrides = { "./database": ctx.database };
    const { SigekoPreNotificationRepository } = load("src/main/db/sigekoPreNotificationRepo.js", overrides);
    const { SigekoProjectRepository } = load("src/main/db/sigekoProjectRepo.js", overrides);
    const notificationRepo = new SigekoPreNotificationRepository({ dbProvider: ctx.database.initDatabase });
    const roleRepo = new SigekoProjectRepository({ dbProvider: ctx.database.initDatabase });
    const projectFirms = load("src/main/db/projectFirmsRepo.js", overrides);
    const { FirmDirectoryService } = load("src/main/domain/firms/FirmDirectoryService.js");
    const directory = new FirmDirectoryService({ dbProvider: ctx.database.initDatabase, projectRepo: projectFirms,
      globalRepo: load("src/main/db/firmsRepo.js", overrides), usageRepo: load("src/main/db/firmUsagesRepo.js", overrides) });
    const projectService = createSigekoProjectService({ repo: roleRepo, projects: ctx.repo, projectFirms,
      persons: load("src/main/db/personsRepo.js", overrides), firms: load("src/main/db/firmsRepo.js", overrides),
      projectPersons: load("src/main/db/projectPersonsRepo.js", overrides) });
    const authorityByProject = new Map();
    const projectAuthorityService = { getProjectAuthorities: ({ projectId }) => ({ projectId, status: "red", categories: [
      authorityByProject.get(projectId) || { category: "LABOR_AUTHORITY", status: "red", assignment: null,
        issues: [{ code: "ASSIGNMENT_MISSING", message: "Arbeitsschutzbehörde fehlt." }] },
      { category: "EMERGENCY_112", status: "green", fixedPhone: "112", assignment: null, issues: [] },
    ] }) };
    let serial = 0, tick = 0;
    const service = createPreNotificationService({ repo: notificationRepo, projects: ctx.repo, projectService,
      projectAuthorityService, projectFirms: directory, uuid: () => `s51-${++serial}`,
      clock: () => new Date(Date.UTC(2026, 8, 10, 12, 0, tick++)).toISOString() });
    const a = ctx.repo.createProject({ name: "Baustelle A", street: "Bauweg 12", zip: "12345", city: "Testort",
      geplanter_baubeginn: "2027-03-04", end_date: "2031-09-30" });
    const b = ctx.repo.createProject({ name: "Baustelle B", street: "Anderer Weg 3", zip: "23456", city: "Anderer Ort" });
    const read = (project = a) => service.getPreNotification({ projectId: project.id });
    const create = (patch = {}, project = a) => service.savePreNotification({ projectId: project.id, expectedRevision: 0, patch });
    const update = (record, patch) => service.savePreNotification({ projectId: record.project_id, expectedRevision: record.revision, patch });
    return fn({ ...ctx, notificationRepo, projectService, projectFirms, directory, authorityByProject, service, a, b, read, create, update });
  }, { modules: ["sigeko"], ...options });
}

async function runSigekoPreNotificationTests(run) {
  await run("S5.1: core-only initialization does not create pre-notification storage", () => fixture(({ db }) => {
    assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name=?").get(TABLE), undefined);
  }));

  await run("S5.1: historical project migration is additive and initializes no pre-notification drafts", () => withNotifications(({ db, repo, service }) => {
    assert.equal(repo.getById("old").name, "Historisches Projekt");
    assert.equal(service.getPreNotification({ projectId: "old" }).record, null);
    assert.deepEqual(rows(db), []); assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
  }, { oldSql: "CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL); INSERT INTO projects VALUES ('old','Historisches Projekt');" }));

  await run("S5.1: repeated migration and database reopening retain draft identity and every field", () => withNotifications(({ database, db, create, read }) => {
    const created = create({ ...complete(), planned_start_override: "2028-02-29", third_party_mode: "free",
      ...Object.fromEntries(CONTACT_FIELDS.map(field => [`third_party_${field}`, contact("Dritter")[field]])) });
    const before = rows(db), central = centralSnapshot(db);
    database.ensureSchema(db, { moduleIds: ["sigeko"] }); database.ensureSchema(db, { moduleIds: ["sigeko"] });
    assert.deepEqual(rows(db), before); assert.deepEqual(centralSnapshot(db), central);
    database.closeDatabase(); assert.deepEqual(read().record, created.record);
  }));

  await run("S5.1: repeated reads resolve central sources without implicitly creating any records", () => withNotifications(({ read, db }) => {
    const before = centralSnapshot(db), schema = db.prepare("SELECT name,sql FROM sqlite_master ORDER BY name").all();
    for (let i = 0; i < 3; i++) {
      const result = read(); assert.equal(result.record, null); assert.equal(result.effective.planned_start, "2027-03-04");
      assert.equal(result.effective.duration_months, null); assert.equal(result.effective.building_type, null);
      assert.equal(result.effective.third_party, null); assert.equal(result.effective.firms_mode, "unknown");
      assert.notEqual(result.readiness.status, "green"); assert.ok(result.readiness.issues.length > 0);
    }
    assert.deepEqual(rows(db), []); assert.deepEqual(centralSnapshot(db), before);
    assert.deepEqual(db.prepare("SELECT name,sql FROM sqlite_master ORDER BY name").all(), schema);
  }));

  await run("S5.1: incomplete drafts save explicitly with server identity and warning readiness", () => withNotifications(({ create, read, db }) => {
    const result = create(); const record = result.record;
    assert.equal(record.id, "s51-1"); assert.equal(record.revision, 1);
    assert.equal(record.created_at, record.updated_at); assert.match(record.created_at, /^2026-09-10T/);
    assert.equal(record.duration_months, null); assert.equal(record.third_party_mode, "none");
    assert.equal(record.firms_mode, "unknown"); assert.notEqual(result.readiness.status, "green");
    assert.deepEqual(read().record, record); assert.equal(rows(db).length, 1);
  }));

  await run("S5.1: local overrides preserve central project fields and clearing restores live fallback", () => withNotifications(({ create, update, read, repo, a, db }) => {
    const central = centralSnapshot(db);
    let result = create({ building_type_override: "  Umbau  ", planned_start_override: "2028-02-29" });
    assert.equal(result.effective.building_type, "Umbau"); assert.equal(result.effective.planned_start, "2028-02-29");
    assert.equal(result.central.planned_start, "2027-03-04"); assert.deepEqual(centralSnapshot(db), central);
    repo.updateProject({ id: a.id, geplanter_baubeginn: "2029-05-06", name: "Geänderter Projektname" });
    assert.equal(read().effective.planned_start, "2028-02-29");
    result = update(result.record, { planned_start_override: null, building_type_override: "  " });
    assert.equal(result.effective.planned_start, "2029-05-06"); assert.equal(result.effective.building_type, null);
    assert.equal(result.record.planned_start_override, null); assert.equal(result.record.building_type_override, null);
  }));

  await run("S5.1: whole manual months are independent of dates and both point-eight counts remain distinct", () => withNotifications(({ create, update, repo, a, read }) => {
    let result = create({ duration_months: 5, max_workers: 42, employer_count: 11, self_employed_count: 3 });
    assert.equal(result.effective.duration_months, 5); assert.equal(result.effective.max_workers, 42);
    assert.equal(result.effective.employer_count, 11); assert.equal(result.effective.self_employed_count, 3);
    repo.updateProject({ id: a.id, geplanter_baubeginn: "2032-01-01", end_date: "2032-01-02" });
    assert.equal(read().effective.duration_months, 5);
    result = update(result.record, { duration_months: null, employer_count: 0, self_employed_count: 0, max_workers: 0 });
    assert.equal(result.effective.duration_months, null); assert.equal(result.effective.employer_count, 0);
    assert.equal(result.effective.self_employed_count, 0); assert.equal(result.effective.max_workers, 0);
  }));

  await run("S5.1: builder and SiGeKo roles resolve live and local saves cannot write central contacts", () => withNotifications(({ db, repo, a, projectService, create, update, read }) => {
    db.prepare("INSERT INTO firms (id,name,street,zip,city) VALUES ('builder','Bauherr','Bauherrenweg 1','12345','Testort')").run();
    repo.updateProject({ id: a.id, bauherr: { kind: "global_firm", id: "builder" } });
    projectService.saveCoordinatorProfile({ patch: contact("Koordinator") }); projectService.saveProjectData({ projectId: a.id });
    read(); // Existing shared directory migration normalizes historical usage flags.
    const before = centralSnapshot(db); let result = create(complete());
    assert.equal(result.effective.builder.name, "Bauherr"); assert.equal(result.effective.planning.name, "Koordinator");
    assert.equal(result.effective.execution.name, "Koordinator"); assert.deepEqual(centralSnapshot(db), before);
    result = update(result.record, { building_type_override: "Dokumentkorrektur" }); assert.deepEqual(centralSnapshot(db), before);
    projectService.saveCoordinatorProfile({ patch: { name: "Aktueller Koordinator" } });
    db.prepare("UPDATE firms SET name='Aktueller Bauherr' WHERE id='builder'").run();
    assert.equal(read().effective.builder.name, "Aktueller Bauherr"); assert.equal(read().effective.execution.name, "Aktueller Koordinator");
    assert.equal(read().record.revision, result.record.revision);
  }));

  await run("S5.1: free third-party data stays document-local and returning to none clears all six values", () => withNotifications(({ create, update, db }) => {
    const before = centralSnapshot(db); const values = contact("Beauftragter Dritter");
    let result = create({ third_party_mode: "free", ...Object.fromEntries(CONTACT_FIELDS.map(field => [`third_party_${field}`, ` ${values[field]} `])) });
    for (const field of CONTACT_FIELDS) assert.equal(result.effective.third_party[field], values[field]);
    assert.deepEqual(centralSnapshot(db), before);
    result = update(result.record, { third_party_mode: "none" }); assert.equal(result.effective.third_party, null);
    for (const field of CONTACT_FIELDS) assert.equal(result.record[`third_party_${field}`], null);
    result = update(result.record, { third_party_mode: "free" });
    for (const field of CONTACT_FIELDS) assert.equal(result.record[`third_party_${field}`], null);
  }));

  await run("S5.1: hidden third-party values and unsupported sources fail atomically", () => withNotifications(({ create, update, db }) => {
    const record = create().record; const before = rows(db);
    for (const field of CONTACT_FIELDS) code(() => update(record, { [`third_party_${field}`]: "Hidden" }));
    for (const mode of [null, "module", "person", "global_firm", true]) code(() => update(record, { third_party_mode: mode }));
    code(() => update(record, { third_party_mode: "none", third_party_name: "Hidden" }));
    assert.deepEqual(rows(db), before);
  }));

  await run("S5.1: attachment requires actual current project participants rather than unrelated stock", () => withNotifications(({ db, a, b, create, projectFirms, directory, read }) => {
    const global = directory.create({ kind: "global_firm", origin: "firms", data: { name: "Globale Firma" }, uses: { projectParticipant: 1, customer: 0 } });
    db.prepare("INSERT INTO project_firms (id,project_id,name,use_project_participant) VALUES ('foreign',?,'Fremdfirma',1)").run(b.id);
    code(() => create({ firms_mode: "attachment" }), "FIRMS_ATTACHMENT_EMPTY"); assert.deepEqual(rows(db), []);
    projectFirms.assignGlobalFirmToProject({ projectId: a.id, firmId: global.id });
    const result = create({ firms_mode: "attachment" });
    assert.deepEqual(result.effective.firms.map(firm => firm.id), [global.id]);
    assert.equal(read(b).record, null); assert.equal(result.record.firms_mode, "attachment");
    projectFirms.unassignGlobalFirmFromProject({ projectId: a.id, firmId: global.id });
    const after = read(); assert.deepEqual(after.effective.firms, []); assert.notEqual(after.readiness.status, "green");
    assert.equal(after.record.firms_mode, "attachment"); assert.equal(after.record.revision, result.record.revision);
  }));

  await run("S5.1: inactive removed and nonparticipant firms cannot substantiate an attachment", () => withNotifications(({ db, a, create }) => {
    db.prepare("INSERT INTO project_firms (id,project_id,name,is_active,use_project_participant) VALUES ('inactive',?,'Inaktiv',0,1)").run(a.id);
    db.prepare("INSERT INTO project_firms (id,project_id,name,removed_at,use_project_participant) VALUES ('removed',?,'Entfernt','removed',1)").run(a.id);
    db.prepare("INSERT INTO project_firms (id,project_id,name,use_project_participant) VALUES ('contact',?,'Nur Kontakt',0)").run(a.id);
    code(() => create({ firms_mode: "attachment" }), "FIRMS_ATTACHMENT_EMPTY"); assert.deepEqual(rows(db), []);
    db.prepare("INSERT INTO project_firms (id,project_id,name,use_project_participant) VALUES ('active',?,'Aktiv',1)").run(a.id);
    assert.deepEqual(create({ firms_mode: "attachment" }).effective.firms.map(firm => firm.id), ["active"]);
  }));

  await run("S5.1: latest authority assessment remains live and is never promoted by saving a draft", () => withNotifications(({ authorityByProject, a, create, read, db }) => {
    const authority = { category: "LABOR_AUTHORITY", status: "orange", assignment: { snapshot: { organization: "Zu prüfen" } },
      issues: [{ code: "SOURCE_CHANGED", message: "Quelle geändert." }] };
    authorityByProject.set(a.id, authority); const before = centralSnapshot(db);
    const result = create(complete()); assert.deepEqual(result.effective.authority, authority);
    assert.notEqual(result.readiness.status, "green"); assert.deepEqual(centralSnapshot(db), before);
    authorityByProject.set(a.id, { ...authority, status: "red", assignment: null });
    assert.equal(read().effective.authority.status, "red"); assert.equal(read().record.revision, result.record.revision);
  }));

  await run("S5.1: project isolation archive guard and cascading deletion retain the other draft", () => withNotifications(({ create, update, read, a, b, repo, invoke, db }) => {
    const first = create({ duration_months: 4 }).record; const second = create({ duration_months: 17 }, b).record;
    assert.equal(read().effective.duration_months, 4); assert.equal(read(b).effective.duration_months, 17);
    repo.archiveProject(a.id); const before = rows(db);
    assert.equal(read().record.id, first.id); code(() => update(first, { duration_months: 8 }), "PROJECT_ARCHIVED");
    assert.deepEqual(rows(db), before); assert.equal(invoke("projects:deleteForever", { id: a.id }).ok, true);
    assert.deepEqual(rows(db), [second]); assert.equal(read(b).record.id, second.id);
  }));

  await run("S5.1: duplicate first save and stale revision cannot overwrite a newer draft", () => withNotifications(({ create, update, db }) => {
    const original = create({ duration_months: 4 }).record; const newer = update(original, { duration_months: 6 }).record;
    assert.equal(newer.revision, original.revision + 1); assert.equal(newer.id, original.id);
    assert.equal(newer.created_at, original.created_at); assert.notEqual(newer.updated_at, original.updated_at);
    const before = rows(db); code(() => create({ duration_months: 8 }), "PRE_NOTIFICATION_CONFLICT");
    code(() => update(original, { duration_months: 8 }), "PRE_NOTIFICATION_CONFLICT");
    code(() => update(original, {}), "PRE_NOTIFICATION_CONFLICT"); assert.deepEqual(rows(db), before);
  }));

  await run("S5.1: whitespace-normalized no-op saves retain revision and creation metadata", () => withNotifications(({ create, update, db }) => {
    const result = create({ building_type_override: "Umbau" }); const before = rows(db);
    assert.deepEqual(update(result.record, {}).record, result.record);
    assert.deepEqual(update(result.record, { building_type_override: "  Umbau \n" }).record, result.record);
    assert.deepEqual(rows(db), before);
  }));

  await run("S5.1: strict envelopes reject forged identity snapshots central data and invalid project references", () => withNotifications(({ service, create, update, a, db }) => {
    const record = create().record; const before = rows(db);
    for (const value of [undefined, null, [], 4, "project"]) {
      code(() => service.getPreNotification(value)); code(() => service.savePreNotification(value));
    }
    for (const projectId of [undefined, null, "", "  ", 4, {}, []]) code(() => service.getPreNotification({ projectId }));
    code(() => service.getPreNotification({ projectId: "missing" }), "PROJECT_NOT_FOUND");
    code(() => service.savePreNotification({ projectId: "missing", expectedRevision: 0, patch: {} }), "PROJECT_NOT_FOUND");
    for (const key of ["id", "project_id", "revision", "created_at", "updated_at", "snapshot", "snapshot_json", "effective", "central", "builder", "planning", "authority", "firms"]) {
      code(() => update(record, { [key]: "forged" }));
      code(() => service.savePreNotification({ projectId: a.id, expectedRevision: record.revision, patch: {}, [key]: "forged" }));
    }
    code(() => service.getPreNotification({ projectId: a.id, revision: 1 }));
    for (const patch of [undefined, null, [], 4, "value"]) code(() => service.savePreNotification({ projectId: a.id, expectedRevision: record.revision, patch }));
    for (const expectedRevision of [undefined, null, -1, 1.5, "1", true, Number.MAX_SAFE_INTEGER + 1]) {
      code(() => service.savePreNotification({ projectId: a.id, expectedRevision, patch: {} }));
    }
    assert.deepEqual(rows(db), before);
  }));

  await run("S5.1: integer and calendar validation rejects coercion impossible dates and hidden extras", () => withNotifications(({ create, update, db }) => {
    let record = create().record;
    for (const field of ["duration_months", "max_workers", "employer_count", "self_employed_count"]) {
      for (const value of ["3", true, false, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, [], {}]) code(() => update(record, { [field]: value }));
    }
    code(() => update(record, { duration_months: 0 }));
    for (const date of ["2027-02-29", "2028-02-30", "2027-04-31", "0000-01-01", "10000-01-01", "2027-13-01", "2027-01-00", "2027-1-1", "2027-01-01T00:00:00Z", 20270101, {}, []]) {
      code(() => update(record, { planned_start_override: date }));
    }
    for (const date of ["0001-01-01", "2028-02-29", "9999-12-31"]) {
      record = update(record, { planned_start_override: date }).record; assert.equal(record.planned_start_override, date);
    }
    for (const field of ["building_type_override", ...CONTACT_FIELDS.map(field => `third_party_${field}`)]) {
      for (const value of [4, true, [], {}, "x".repeat(4097)]) code(() => update(record, { third_party_mode: "free", [field]: value }));
    }
    for (const firms_mode of [null, true, "yes", "none", "list"]) code(() => update(record, { firms_mode }));
    assert.equal(rows(db).length, 1);
  }));

  await run("S5.1: SQL constraints reject duplicate drafts invalid enums and fractional counts", () => withNotifications(({ create, db }) => {
    const record = create().record; const before = rows(db); const columns = Object.keys(record);
    const insert = db.prepare(`INSERT INTO ${TABLE} (${columns.join(",")}) VALUES (${columns.map(key => `@${key}`).join(",")})`);
    assert.throws(() => insert.run({ ...record, id: "duplicate" }), /UNIQUE constraint failed/);
    assert.throws(() => insert.run({ ...record, id: "orphan", project_id: "missing" }), /FOREIGN KEY constraint failed/);
    for (const sql of ["revision=0", "duration_months=0", "duration_months=1.5", "max_workers=-1", "employer_count=1.5",
      "self_employed_count=-1", "third_party_mode='person'", "firms_mode='invented'", "third_party_name='hidden'"]) {
      assert.throws(() => db.prepare(`UPDATE ${TABLE} SET ${sql} WHERE id=?`).run(record.id), /CHECK constraint failed/, sql);
    }
    assert.deepEqual(rows(db), before);
  }));

  await run("S5.1: repository compare-and-swap cannot change project identity or overwrite a stale row", () => withNotifications(({ notificationRepo, create, a, b, db }) => {
    const record = create().record;
    const next = { ...record, duration_months: 12, revision: record.revision + 1, updated_at: "2026-09-11T10:00:00.000Z" };
    notificationRepo.update(next, record.revision); assert.equal(notificationRepo.get(a.id).duration_months, 12);
    const before = rows(db);
    assert.equal(notificationRepo.update({ ...next, duration_months: 4 }, record.revision), null);
    for (const patch of [{ id: "forged" }, { project_id: b.id }]) {
      assert.equal(notificationRepo.update({ ...next, ...patch }, next.revision), null);
    }
    notificationRepo.update({ ...next, created_at: "forged" }, next.revision);
    assert.deepEqual(rows(db), before); assert.equal(notificationRepo.get(b.id), null);
  }));

  await run("S5.1: failed inserts and updates roll back the entire draft and retain the previous revision", () => withNotifications(({ create, update, db }) => {
    db.exec(`CREATE TRIGGER reject_va_insert AFTER INSERT ON ${TABLE} BEGIN SELECT RAISE(ABORT, 'va-insert-failed'); END`);
    assert.throws(() => create(), /va-insert-failed/); assert.deepEqual(rows(db), []);
    db.exec("DROP TRIGGER reject_va_insert"); const record = create({ duration_months: 4 }).record; const before = rows(db);
    db.exec(`CREATE TRIGGER reject_va_update AFTER UPDATE ON ${TABLE} BEGIN SELECT RAISE(ABORT, 'va-update-failed'); END`);
    assert.throws(() => update(record, { duration_months: 8 }), /va-update-failed/); assert.deepEqual(rows(db), before);
    db.exec("DROP TRIGGER reject_va_update"); assert.equal(update(record, { duration_months: 8 }).effective.duration_months, 8);
  }));

  await run("S5.1: malformed persisted rows remain errors rather than becoming a successful draft", () => withNotifications(({ create, read, db }) => {
    const record = create().record;
    db.pragma("ignore_check_constraints = ON"); db.prepare(`UPDATE ${TABLE} SET duration_months=-1 WHERE id=?`).run(record.id);
    assert.throws(() => read());
  }));

  await run("S5.1: callers cannot mutate stored drafts by changing payload or returned values", () => withNotifications(({ create, read }) => {
    const patch = complete(); const result = create(patch); const stored = { ...result.record };
    patch.duration_months = 99; result.record.duration_months = 88; result.effective.duration_months = 77;
    result.central.project.name = "Not a central write";
    assert.deepEqual(read().record, stored); assert.equal(read().central.project.name, "Baustelle A");
  }));

  await run("S5.1: real preload and live module licensing guard protect both pre-notification endpoints", () => withNotifications(async ({ service, a, db }) => {
    const handlers = new Map(); const status = modules => ({ valid: true, license: { modules } }); let license = status(["sigeko"]);
    registerActiveModuleIpcs({ licenseStatus: license, getLicenseStatus: () => license, ipcMain: { handle: (name, fn) => handlers.set(name, fn) },
      registrars: { sigeko: ({ ipcMain }) => registerSigekoIpc({ ipcMain, preNotificationService: service }) } });
    let api;
    load("src/main/preload.js", { electron: { contextBridge: { exposeInMainWorld: (name, value) => { if (name === "bbmDb") api = value; } },
      ipcRenderer: { invoke: async (name, value) => handlers.get(name)({}, value) } } });
    const preview = await api.sigekoGetPreNotification({ projectId: a.id }); assert.equal(preview.ok, true, preview.error);
    assert.equal(preview.data.record, null);
    const saved = await api.sigekoSavePreNotification({ projectId: a.id, expectedRevision: 0, patch: { duration_months: 4 } });
    assert.equal(saved.ok, true, saved.error); assert.equal(saved.data.record.duration_months, 4); const before = rows(db);
    for (const revoked of [status([]), status(["protokoll"]), { ...status(["sigeko"]), valid: false }, null]) {
      license = revoked;
      await assert.rejects(api.sigekoGetPreNotification({ projectId: a.id }), { code: "MODULE_NOT_ACTIVE" });
      await assert.rejects(api.sigekoSavePreNotification({ projectId: a.id, expectedRevision: 1, patch: {} }), { code: "MODULE_NOT_ACTIVE" });
      assert.deepEqual(rows(db), before);
    }
    license = status(["sigeko"]);
    assert.equal((await api.sigekoGetPreNotification({ projectId: "missing" })).code, "PROJECT_NOT_FOUND");
    assert.equal((await api.sigekoSavePreNotification({ projectId: a.id, expectedRevision: 0, patch: {} })).code, "PRE_NOTIFICATION_CONFLICT");
    db.exec(`DROP TABLE ${TABLE}`); const failed = await api.sigekoGetPreNotification({ projectId: a.id });
    assert.equal(failed.ok, false); assert.equal(failed.code, "SQLITE_ERROR"); assert.match(failed.error, /no such table/);
  }));

  await run("S5.1: initially inactive module registration does not expose pre-notification handlers", () => {
    for (const modules of [[], ["protokoll"]]) {
      const handlers = new Map(); let sigekoCalls = 0;
      registerActiveModuleIpcs({ licenseStatus: { valid: true, license: { modules } }, ipcMain: { handle: (name, fn) => handlers.set(name, fn) },
        registrars: { protokoll: () => {}, sigeko: ({ ipcMain }) => { sigekoCalls++; registerSigekoIpc({ ipcMain }); } } });
      assert.equal(sigekoCalls, 0); assert.equal(handlers.has("sigeko:getPreNotification"), false);
      assert.equal(handlers.has("sigeko:savePreNotification"), false);
    }
  });
}

module.exports = { runSigekoPreNotificationTests };
if (require.main === module) runSigekoPreNotificationTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
