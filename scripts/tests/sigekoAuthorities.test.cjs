"use strict";
const assert = require("node:assert/strict");
const { fixture, load } = require("./plannedConstructionStart.test.cjs");
const { createAuthorityService } = require("../../src/main/domain/sigeko/AuthorityService");
const { registerSigekoIpc } = require("../../src/main/ipc/sigekoIpc");
const { registerActiveModuleIpcs } = require("../../src/main/moduleIpcRegistry");

const TABLE = "sigeko_authority_records";
const categories = ["LABOR_AUTHORITY", "HOSPITAL", "ACCIDENT_DOCTOR", "WATER", "ELECTRICITY", "GAS", "POLICE"];
const fields = ["organization", "street", "zip", "city", "phone", "email", "emergency_phone", "source",
  "scope_street", "scope_zip", "scope_city", "scope_district", "scope_area", "verification_note"];
const complete = (category = "LABOR_AUTHORITY") => ({ category, organization: "Zuständige Stelle", street: "Testweg 12",
  zip: "12345", city: "Testort", phone: "0123 456", email: "kontakt@example.test", emergency_phone: "0123 789",
  source: "Geprüfte Originalquelle", scope_street: "Bauweg", scope_zip: "12345", scope_city: "Testort",
  scope_district: "Testkreis", scope_area: "Dokumentiertes Zuständigkeitsgebiet", verification_note: "Zuständigkeit und geeigneten Kontakt geprüft" });
const rows = db => db.prepare(`SELECT * FROM ${TABLE} ORDER BY id`).all();
const expectCode = (fn, code) => assert.throws(fn, { code });

function withAuthorities(fn, options = {}) {
  return fixture(ctx => {
    const { SigekoAuthoritiesRepository } = load("src/main/db/sigekoAuthoritiesRepo.js", { "./database": ctx.database });
    const authorityRepo = new SigekoAuthoritiesRepository({ dbProvider: ctx.database.initDatabase });
    let tick = 0; let nextId = 0;
    const service = createAuthorityService({ repo: authorityRepo, clock: () => new Date(Date.UTC(2026, 8, 9, 12, 0, tick++)).toISOString(),
      uuid: () => `authority-${++nextId}` });
    const create = (patch = complete()) => service.saveAuthorityRecord({ patch });
    const confirm = row => service.confirmAuthorityRecord({ id: row.id, expectedRevision: row.revision });
    const update = (row, patch) => service.saveAuthorityRecord({ id: row.id, expectedRevision: row.revision, patch });
    return fn({ ...ctx, authorityRepo, service, create, confirm, update });
  }, { modules: ["sigeko"], ...options });
}

async function runSigekoAuthoritiesTests(run) {
  await run("S4.1: core-only initialization does not create authority storage", () => fixture(({ db }) => {
    assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name=?").get(TABLE), undefined);
  }));

  await run("S4.1: historical core migrates additively with an empty reusable authority stock", () => withAuthorities(({ db, repo, service }) => {
    assert.equal(repo.getById("old").name, "Historisches Projekt");
    assert.equal(repo.getById("old").geplanter_baubeginn, null);
    assert.deepEqual(service.listAuthorityRecords(), []);
    assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
  }, { oldSql: "CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL); INSERT INTO projects VALUES ('old','Historisches Projekt');" }));

  await run("S4.1: additive migration preserves existing S3 projects roles and profiles and is idempotent", () => withAuthorities(({ db, database, repo, create }) => {
    const project = repo.createProject({ name: "S3 Bestand", geplanter_baubeginn: "2027-05-06" });
    db.prepare("INSERT INTO sigeko_profiles (id,name,created_at,updated_at) VALUES ('standard','Bestandsprofil','alt','alt')").run();
    db.prepare("INSERT INTO sigeko_projects (id,project_id,created_at,updated_at) VALUES ('role',?,'alt','alt')").run(project.id);
    const before = ["projects", "sigeko_profiles", "sigeko_projects"].map(name => db.prepare(`SELECT * FROM ${name}`).all());
    db.exec(`DROP TABLE ${TABLE}`);
    database.ensureSchema(db, { moduleIds: ["sigeko"] });
    const record = create(); const saved = rows(db);
    database.ensureSchema(db, { moduleIds: ["sigeko"] }); database.ensureSchema(db, { moduleIds: ["sigeko"] });
    assert.deepEqual(["projects", "sigeko_profiles", "sigeko_projects"].map(name => db.prepare(`SELECT * FROM ${name}`).all()), before);
    assert.deepEqual(rows(db), saved); assert.equal(saved[0].id, record.id);
    assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
  }));

  await run("S4.1: partial drafts receive stable IDs and server metadata without being confirmed", () => withAuthorities(({ create, service, db }) => {
    const record = create({ category: "HOSPITAL", organization: "  Klinik  " });
    assert.equal(record.id, "authority-1"); assert.equal(record.organization, "Klinik");
    assert.equal(record.revision, 1); assert.equal(record.verification_status, "unverified");
    assert.equal(record.verified_at, null); assert.equal(record.verification_method, null); assert.equal(record.uncertainty_reason, null);
    assert.equal(record.created_at, record.updated_at); assert.match(record.created_at, /^2026-09-09T/);
    assert.ok(record.confirmationIssues.some(issue => issue.field === "street" && issue.message));
    assert.deepEqual(service.getAuthorityRecord({ id: ` ${record.id} ` }), record);
    assert.equal(Object.hasOwn(rows(db)[0], "confirmationIssues"), false);
  }));

  await run("S4.1: seven editable categories are distinct while system emergency numbers have no rows", () => withAuthorities(({ create, service, confirm }) => {
    const shared = require("../../src/shared/sigeko/authorities.cjs");
    assert.deepEqual(shared.AUTHORITY_CATEGORIES, [...categories.slice(0, 6), "EMERGENCY_112", "POLICE"]);
    assert.deepEqual(shared.EMERGENCY_NUMBERS, { EMERGENCY_112: "112", POLICE: "110" });
    assert.equal(Object.isFrozen(shared.AUTHORITY_CATEGORIES), true); assert.equal(Object.isFrozen(shared.EMERGENCY_NUMBERS), true);
    assert.throws(() => { shared.EMERGENCY_NUMBERS.POLICE = "999"; }, TypeError);
    for (const category of categories) { const row = confirm(create(complete(category))); assert.equal(row.category, category); }
    assert.equal(service.listAuthorityRecords().length, 7);
    for (const category of categories) assert.deepEqual(service.listAuthorityRecords({ category }).map(row => row.category), [category]);
    assert.deepEqual(service.listAuthorityRecords({ category: "EMERGENCY_112" }), []);
    expectCode(() => create(complete("EMERGENCY_112")), "INVALID_CATEGORY");
    expectCode(() => create(complete("FIRE_BRIGADE")), "INVALID_CATEGORY");
    assert.equal(service.listAuthorityRecords().length, 7);
  }));

  await run("S4.1: explicit confirmation stamps manual verification without modifying domain values", () => withAuthorities(({ create, confirm, db }) => {
    const draft = create(); const result = confirm(draft);
    for (const field of fields) assert.equal(result[field], draft[field]);
    assert.equal(result.verification_status, "confirmed"); assert.equal(result.verification_method, "manual");
    assert.ok(result.verified_at <= result.updated_at); assert.notEqual(result.verified_at, draft.updated_at);
    assert.equal(result.created_at, draft.created_at); assert.equal(result.revision, draft.revision + 1);
    assert.deepEqual(result.confirmationIssues, []);
    const before = rows(db); assert.deepEqual(confirm(result), result); assert.deepEqual(rows(db), before);
  }));

  await run("S4.1: each mandatory confirmation value reports its own missing proof and leaves the draft untouched", () => withAuthorities(({ create, confirm, db }) => {
    for (const field of ["street", "zip", "city", "source", "verification_note", "phone"]) {
      const draft = create({ ...complete("HOSPITAL"), [field]: "  " }); const before = rows(db);
      assert.ok(draft.confirmationIssues.some(issue => issue.field === field && issue.message), field);
      expectCode(() => confirm(draft), "AUTHORITY_INCOMPLETE"); assert.deepEqual(rows(db), before);
    }
  }));

  await run("S4.1: a documented area or both locality fields suffice but a lone postcode does not", () => withAuthorities(({ create, confirm }) => {
    assert.equal(confirm(create({ ...complete(), scope_zip: null, scope_city: null })).verification_status, "confirmed");
    assert.equal(confirm(create({ ...complete(), scope_area: null })).verification_status, "confirmed");
    for (const field of ["scope_zip", "scope_city"]) {
      const draft = create({ ...complete(), scope_area: null, [field]: null });
      assert.ok(draft.confirmationIssues.length > 0); expectCode(() => confirm(draft), "AUTHORITY_INCOMPLETE");
    }
  }));

  await run("S4.1: utilities require the verified emergency contact rather than a general switchboard", () => withAuthorities(({ create, confirm }) => {
    for (const category of ["WATER", "ELECTRICITY", "GAS"]) {
      const draft = create({ ...complete(category), emergency_phone: null });
      assert.ok(draft.confirmationIssues.some(issue => issue.field === "emergency_phone"));
      expectCode(() => confirm(draft), "AUTHORITY_INCOMPLETE");
      assert.equal(confirm(create({ ...complete(category), phone: null })).verification_status, "confirmed");
    }
    for (const category of ["HOSPITAL", "ACCIDENT_DOCTOR", "POLICE"]) {
      expectCode(() => confirm(create({ ...complete(category), phone: null })), "AUTHORITY_INCOMPLETE");
      assert.equal(confirm(create({ ...complete(category), emergency_phone: null, email: null })).verification_status, "confirmed");
    }
    assert.equal(confirm(create({ ...complete(), phone: null })).verification_status, "confirmed");
    assert.equal(confirm(create({ ...complete(), email: null })).verification_status, "confirmed");
    const noContact = create({ ...complete(), phone: null, email: null });
    assert.ok(noContact.confirmationIssues.some(issue => issue.field === "contact"));
    expectCode(() => confirm(noContact), "AUTHORITY_INCOMPLETE");
  }));

  await run("S4.1: every substantive domain field edit invalidates previous confirmation", () => withAuthorities(({ create, confirm, update }) => {
    for (const field of fields) {
      const verified = confirm(create()); const changed = update(verified, { [field]: `${verified[field]} geändert` });
      assert.equal(changed[field], `${verified[field]} geändert`, field); assert.equal(changed.id, verified.id);
      assert.equal(changed.verification_status, "unverified", field); assert.equal(changed.verified_at, null, field);
      assert.equal(changed.verification_method, null); assert.equal(changed.uncertainty_reason, null);
      assert.equal(changed.revision, verified.revision + 1); assert.equal(changed.created_at, verified.created_at);
      assert.notEqual(changed.updated_at, verified.updated_at);
    }
  }));

  await run("S4.1: empty and whitespace-normalized no-op updates preserve verification and revision", () => withAuthorities(({ create, confirm, update, db }) => {
    const verified = confirm(create()); const before = rows(db);
    assert.deepEqual(update(verified, {}), verified);
    assert.deepEqual(update(verified, { organization: `  ${verified.organization} \n`, source: `\t${verified.source} ` }), verified);
    assert.deepEqual(update(verified, { category: verified.category }), verified);
    assert.deepEqual(rows(db), before);
  }));

  await run("S4.1: optional values can be cleared and stay null after normalized no-op", () => withAuthorities(({ create, update }) => {
    const original = create(); const cleared = update(original, { email: "  ", scope_district: null });
    assert.equal(cleared.email, null); assert.equal(cleared.scope_district, null); assert.equal(cleared.organization, original.organization);
    assert.deepEqual(update(cleared, { email: null, scope_district: "" }), cleared);
  }));

  await run("S4.1: uncertainty requires a concrete reason and retains prior verification as history", () => withAuthorities(({ service, create, confirm, update, db }) => {
    const verified = confirm(create());
    for (const reason of [null, "", " \n ", 42]) expectCode(() => service.markAuthorityUncertain({ id: verified.id, expectedRevision: verified.revision, reason }), "INVALID_INPUT");
    const result = service.markAuthorityUncertain({ id: verified.id, expectedRevision: verified.revision, reason: "  Betreiberzuordnung unklar  " });
    assert.equal(result.verification_status, "uncertain"); assert.equal(result.uncertainty_reason, "Betreiberzuordnung unklar");
    assert.equal(result.verified_at, verified.verified_at); assert.equal(result.verification_method, "manual");
    assert.equal(result.revision, verified.revision + 1); assert.notEqual(result.updated_at, verified.updated_at);
    const before = rows(db); assert.deepEqual(update(result, {}), result); assert.deepEqual(rows(db), before);
    const reconfirmed = confirm(result); assert.equal(reconfirmed.verification_status, "confirmed"); assert.equal(reconfirmed.uncertainty_reason, null);
    assert.notEqual(reconfirmed.verified_at, verified.verified_at);
  }));

  await run("S4.1: uncertain drafts never acquire an invented historical verification", () => withAuthorities(({ service, create, update }) => {
    const draft = create({ category: "GAS", organization: "Betreiber" });
    const uncertain = service.markAuthorityUncertain({ id: draft.id, expectedRevision: draft.revision, reason: "Havarienummer fehlt" });
    assert.equal(uncertain.verified_at, null); assert.equal(uncertain.verification_method, null);
    const changed = update(uncertain, { source: "Neue Quelle" }); assert.equal(changed.verification_status, "unverified");
    assert.equal(changed.uncertainty_reason, null);
  }));

  await run("S4.1: stale writes confirmations and uncertainty changes cannot overwrite newer records", () => withAuthorities(({ service, create, update, db }) => {
    const old = create(); update(old, { organization: "Neue Organisation" }); const before = rows(db);
    for (const attempt of [() => update(old, { city: "Veraltet" }), () => update(old, {}),
      () => service.confirmAuthorityRecord({ id: old.id, expectedRevision: old.revision }),
      () => service.markAuthorityUncertain({ id: old.id, expectedRevision: old.revision, reason: "Veraltete Prüfung" })]) {
      expectCode(attempt, "AUTHORITY_CONFLICT"); assert.deepEqual(rows(db), before);
    }
  }));

  await run("S4.1: malformed envelopes and unknown fields fail without modifying the stock", () => withAuthorities(({ service, create, db }) => {
    const record = create(); const before = rows(db);
    for (const payload of [null, [], "id", 7]) for (const method of ["listAuthorityRecords", "getAuthorityRecord", "saveAuthorityRecord", "confirmAuthorityRecord", "markAuthorityUncertain"]) {
      expectCode(() => service[method](payload), "INVALID_INPUT");
    }
    for (const payload of [{}, { patch: [] }, { patch: null }, { patch: { category: "HOSPITAL" } },
      { patch: { category: "HOSPITAL", organization: " " } }, { patch: { ...complete(), extra: "injected" } },
      { patch: complete(), verified_at: "2020-01-01" }]) expectCode(() => service.saveAuthorityRecord(payload), "INVALID_INPUT");
    for (const field of fields) expectCode(() => service.saveAuthorityRecord({ patch: { ...complete(), [field]: 4 } }), "INVALID_INPUT");
    for (const method of ["getAuthorityRecord", "confirmAuthorityRecord", "markAuthorityUncertain"]) {
      expectCode(() => service[method]({ id: record.id, unexpected: true }), "INVALID_INPUT");
    }
    expectCode(() => service.listAuthorityRecords({ projectId: "not-a-project-endpoint" }), "INVALID_INPUT");
    expectCode(() => service.listAuthorityRecords({ category: "OTHER" }), "INVALID_CATEGORY");
    assert.deepEqual(rows(db), before);
  }));

  await run("S4.1: identity category and verification metadata cannot be forged through patches", () => withAuthorities(({ service, create, update, db }) => {
    const record = create(); const before = rows(db);
    for (const key of ["id", "revision", "verified_at", "verification_method", "verification_status", "uncertainty_reason", "created_at", "updated_at", "confirmationIssues", "project_id"]) {
      expectCode(() => update(record, { [key]: "forged" }), "INVALID_INPUT");
    }
    expectCode(() => update(record, { category: "POLICE" }), "INVALID_CATEGORY");
    for (const expectedRevision of [undefined, null, 0, -1, 1.5, "1", true]) {
      expectCode(() => service.saveAuthorityRecord({ id: record.id, expectedRevision, patch: { city: "Changed" } }), "INVALID_INPUT");
      expectCode(() => service.confirmAuthorityRecord({ id: record.id, expectedRevision }), "INVALID_INPUT");
      expectCode(() => service.markAuthorityUncertain({ id: record.id, expectedRevision, reason: "Unklar" }), "INVALID_INPUT");
    }
    for (const method of ["getAuthorityRecord", "saveAuthorityRecord", "confirmAuthorityRecord", "markAuthorityUncertain"]) {
      const payload = { id: "missing" };
      if (method !== "getAuthorityRecord") payload.expectedRevision = 1;
      if (method === "saveAuthorityRecord") payload.patch = {};
      if (method === "markAuthorityUncertain") payload.reason = "Unklar";
      expectCode(() => service[method](payload), "AUTHORITY_NOT_FOUND");
    }
    assert.deepEqual(rows(db), before);
  }));

  await run("S4.1: SQLite independently rejects invalid persisted categories status and revisions", () => withAuthorities(({ create, db }) => {
    const record = create(); const before = rows(db);
    for (const sql of ["category='EMERGENCY_112'", "category='UNKNOWN'", "verification_status='green'", "revision=0", "revision=-2"]) {
      assert.throws(() => db.prepare(`UPDATE ${TABLE} SET ${sql} WHERE id=?`).run(record.id), /CHECK constraint failed/);
      assert.deepEqual(rows(db), before);
    }
  }));

  await run("S4.1: failed SQL update rolls back values verification metadata and revision", () => withAuthorities(({ create, confirm, update, db }) => {
    const verified = confirm(create()); const before = rows(db);
    db.exec(`CREATE TRIGGER reject_authority_update AFTER UPDATE ON ${TABLE} BEGIN SELECT RAISE(ABORT, 'authority-write-failed'); END`);
    assert.throws(() => update(verified, { organization: "Must not persist" }), /authority-write-failed/);
    assert.deepEqual(rows(db), before);
    db.exec("DROP TRIGGER reject_authority_update");
    assert.equal(update(verified, { organization: "Retry succeeds" }).verification_status, "unverified");
  }));

  await run("S4.1: failed insertion rolls back the entire new authority record", () => withAuthorities(({ create, db }) => {
    db.exec(`CREATE TRIGGER reject_authority_insert AFTER INSERT ON ${TABLE} BEGIN SELECT RAISE(ABORT, 'authority-insert-failed'); END`);
    assert.throws(() => create(), /authority-insert-failed/); assert.deepEqual(rows(db), []);
    db.exec("DROP TRIGGER reject_authority_insert"); assert.equal(create().verification_status, "unverified");
  }));

  await run("S4.1: reopening SQLite retains confirmed records and uncertainty provenance", () => withAuthorities(({ database, service, create, confirm }) => {
    const verified = confirm(create()); const draft = create({ category: "GAS", organization: "Weiterer Betreiber" });
    const uncertain = service.markAuthorityUncertain({ id: draft.id, expectedRevision: draft.revision, reason: "Kontakt offen" });
    database.closeDatabase();
    assert.deepEqual(service.getAuthorityRecord({ id: verified.id }), verified);
    assert.deepEqual(service.getAuthorityRecord({ id: uncertain.id }), uncertain);
  }));

  await run("S4.1: reusable stock survives project archival and permanent deletion", () => withAuthorities(({ repo, create, confirm, invoke, db }) => {
    const project = repo.createProject({ name: "Entbehrliches Projekt" }); confirm(create()); const before = rows(db);
    repo.archiveProject(project.id); assert.deepEqual(rows(db), before);
    assert.equal(invoke("projects:deleteForever", { id: project.id }).ok, true); assert.deepEqual(rows(db), before);
    assert.equal(repo.getById(project.id), undefined);
  }));

  await run("S4.1: callers cannot mutate saved state by changing input or returned values", () => withAuthorities(({ service, create, update }) => {
    const input = complete(); const created = create(input); const originalId = created.id;
    input.organization = "Mutated input"; created.organization = "Mutated output"; created.confirmationIssues.push({ field: "fake", message: "fake" });
    const read = service.getAuthorityRecord({ id: originalId }); assert.equal(read.organization, "Zuständige Stelle"); assert.deepEqual(read.confirmationIssues, []);
    const patch = { city: "Änderung" }; const changed = update(read, patch); patch.city = "Spätere Mutation";
    changed.city = "Mutierter Rückgabewert"; assert.equal(service.getAuthorityRecord({ id: originalId }).city, "Änderung");
  }));

  await run("S4.1: real preload dispatches all authority endpoints through current module authorization", () => withAuthorities(async ({ service, db }) => {
    const handlers = new Map(); const status = modules => ({ valid: true, license: { modules } }); let license = status(["sigeko"]);
    registerActiveModuleIpcs({ licenseStatus: license, getLicenseStatus: () => license, ipcMain: { handle: (name, fn) => handlers.set(name, fn) },
      registrars: { sigeko: ({ ipcMain }) => registerSigekoIpc({ ipcMain, authorityService: service }) } });
    let api;
    load("src/main/preload.js", { electron: { contextBridge: { exposeInMainWorld: (name, value) => { if (name === "bbmDb") api = value; } },
      ipcRenderer: { invoke: async (name, payload) => handlers.get(name)({}, payload) } } });
    const saved = await api.sigekoSaveAuthorityRecord({ patch: complete() }); assert.equal(saved.ok, true, saved.error);
    const confirmed = await api.sigekoConfirmAuthorityRecord({ id: saved.data.id, expectedRevision: saved.data.revision }); assert.equal(confirmed.ok, true, confirmed.error);
    assert.deepEqual(await api.sigekoGetAuthorityRecord({ id: saved.data.id }), confirmed);
    assert.deepEqual(await api.sigekoListAuthorityRecords({ category: "LABOR_AUTHORITY" }), { ok: true, data: [confirmed.data] });
    const uncertain = await api.sigekoMarkAuthorityUncertain({ id: saved.data.id, expectedRevision: confirmed.data.revision, reason: "Neue Zuständigkeit klären" });
    assert.equal(uncertain.ok, true, uncertain.error); assert.equal(uncertain.data.verification_status, "uncertain");
    const before = rows(db);
    for (const revoked of [status([]), status(["protokoll"]), { ...status(["sigeko"]), valid: false }, null]) {
      license = revoked;
      for (const [method, payload] of [["sigekoListAuthorityRecords", {}], ["sigekoGetAuthorityRecord", { id: saved.data.id }],
        ["sigekoSaveAuthorityRecord", { patch: complete() }], ["sigekoConfirmAuthorityRecord", { id: saved.data.id, expectedRevision: uncertain.data.revision }],
        ["sigekoMarkAuthorityUncertain", { id: saved.data.id, expectedRevision: uncertain.data.revision, reason: "Unberechtigt" }]]) {
        await assert.rejects(api[method](payload), { code: "MODULE_NOT_ACTIVE" });
      }
      assert.deepEqual(rows(db), before);
    }
    license = status(["sigeko"]);
    assert.equal((await api.sigekoGetAuthorityRecord({ id: "missing" })).code, "AUTHORITY_NOT_FOUND");
    assert.equal((await api.sigekoConfirmAuthorityRecord({ id: saved.data.id, expectedRevision: saved.data.revision })).code, "AUTHORITY_CONFLICT");
    const partial = await api.sigekoSaveAuthorityRecord({ patch: { category: "HOSPITAL", organization: "Entwurf" } });
    assert.equal((await api.sigekoConfirmAuthorityRecord({ id: partial.data.id, expectedRevision: partial.data.revision })).code, "AUTHORITY_INCOMPLETE");
  }));

  await run("S4.1: genuine storage failures retain technical error codes across IPC", () => withAuthorities(async ({ db, service }) => {
    const handlers = new Map(); registerSigekoIpc({ ipcMain: { handle: (name, fn) => handlers.set(name, fn) }, authorityService: service });
    db.exec(`DROP TABLE ${TABLE}`);
    assert.throws(() => service.listAuthorityRecords(), /no such table/);
    const failed = await handlers.get("sigeko:listAuthorityRecords")({}, {});
    assert.equal(failed.ok, false); assert.equal(failed.code, "SQLITE_ERROR"); assert.match(failed.error, /no such table/);
  }));
}

module.exports = { runSigekoAuthoritiesTests };
if (require.main === module) runSigekoAuthoritiesTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
