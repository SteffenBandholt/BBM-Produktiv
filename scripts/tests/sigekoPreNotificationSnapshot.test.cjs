"use strict";
const assert = require("node:assert/strict");
const { fixture, load } = require("./plannedConstructionStart.test.cjs");
const { createPreNotificationService } = require("../../src/main/domain/sigeko/PreNotificationService");
const { createSigekoProjectService } = require("../../src/main/domain/sigeko/SigekoProjectService");
const { createAuthorityService } = require("../../src/main/domain/sigeko/AuthorityService");
const { createProjectAuthorityService } = require("../../src/main/domain/sigeko/ProjectAuthorityService");
const { createPreNotificationSnapshotService } = require("../../src/main/domain/sigeko/PreNotificationSnapshotService");
const { buildPreNotificationSnapshot, validatePreNotificationSnapshot } = require("../../src/shared/sigeko/preNotificationSnapshots.cjs");
const { PROJECT_AUTHORITY_COLUMNS } = require("../../src/shared/sigeko/projectAuthorities.cjs");
const { AUTHORITY_COLUMNS } = require("../../src/shared/sigeko/authorities.cjs");

const clone = value => JSON.parse(JSON.stringify(value));
const address = { street: "Bauweg 12", zip: "12345", city: "Testort" };
const contact = name => ({ name, street: "Kontaktweg 3", zip: "23456", city: "Kontaktort", phone: "0123 456", email: "kontakt@example.test" });
const complete = { building_type_override: "Neubau Wohnhaus", duration_months: 9, max_workers: 35, employer_count: 7, self_employed_count: 2 };
const errorCode = (fn, code = "PRE_NOTIFICATION_SNAPSHOT_INVALID") => assert.throws(fn, { code });

function withSnapshots(fn) {
  return fixture(ctx => {
    const overrides = { "./database": ctx.database };
    const makeRepo = (file, name) => new (load(`src/main/db/${file}.js`, overrides)[name])({ dbProvider: ctx.database.initDatabase });
    const draftRepo = makeRepo("sigekoPreNotificationRepo", "SigekoPreNotificationRepository");
    const roleRepo = makeRepo("sigekoProjectRepo", "SigekoProjectRepository");
    const stock = makeRepo("sigekoAuthoritiesRepo", "SigekoAuthoritiesRepository");
    const assignmentRepo = makeRepo("sigekoProjectAuthoritiesRepo", "SigekoProjectAuthoritiesRepository");
    const projectFirms = load("src/main/db/projectFirmsRepo.js", overrides);
    const firms = load("src/main/db/firmsRepo.js", overrides);
    const { FirmDirectoryService } = load("src/main/domain/firms/FirmDirectoryService.js");
    const directory = new FirmDirectoryService({ dbProvider: ctx.database.initDatabase, projectRepo: projectFirms,
      globalRepo: firms, usageRepo: load("src/main/db/firmUsagesRepo.js", overrides) });
    const roles = createSigekoProjectService({ repo: roleRepo, projects: ctx.repo, projectFirms, firms,
      persons: load("src/main/db/personsRepo.js", overrides), projectPersons: load("src/main/db/projectPersonsRepo.js", overrides) });
    let serial = 0;
    const fixed = { uuid: () => `snapshot-fixture-${++serial}`, clock: () => "2026-09-10T12:00:00.000Z" };
    const authorities = createAuthorityService({ repo: stock, ...fixed });
    const assignments = createProjectAuthorityService({ repo: assignmentRepo, stock, projects: ctx.repo, ...fixed });
    const drafts = createPreNotificationService({ repo: draftRepo, projects: ctx.repo, projectService: roles,
      projectAuthorityService: assignments, projectFirms: directory, ...fixed });
    const project = ctx.repo.createProject({ name: "Snapshotprojekt", ...address, geplanter_baubeginn: "2027-03-04" });
    const other = ctx.repo.createProject({ name: "Anderes Projekt", ...address });
    let license = { valid: true, license: { modules: ["sigeko"] } };
    const licenseService = load("src/main/licensing/licenseService.js", {
      "./licenseStorage": { loadLicense: () => null }, "./licenseVerifier": { verifyLicense: () => license },
      "./developmentLicenseLoader": { loadDevelopmentLicenseStatus: () => null },
    });
    const guard = load("src/main/licensing/featureGuard.js", { electron: ctx.dependencies.electron, "./licenseService": licenseService });
    const runtimeRequests = [];
    const runtime = async request => {
      runtimeRequests.push(clone(request));
      return { project: ctx.repo.getById(request.projectId), orientation: "portrait", settings: { title: "Gemeinsamer Kopf" },
        logos: [{ dataUrl: "data:image/png;base64,fixture" }], userData: contact("Büro"), printProfile: { title: "Dokument" } };
    };
    const makeService = (options = {}) => createPreNotificationSnapshotService({ drafts, runtime,
      enforce: guard.enforceLicensedFeature, ...fixed, ...options });
    const service = makeService();
    const read = () => drafts.getPreNotification({ projectId: project.id });
    const save = patch => drafts.savePreNotification({ projectId: project.id, expectedRevision: read().record?.revision || 0, patch });
    const capture = () => service.capture({ projectId: project.id, expectedRevision: read().record?.revision || 0 });
    const setupComplete = () => {
      ctx.db.prepare("INSERT INTO firms (id,name,street,zip,city) VALUES ('builder','Bauherr','Bauherrenweg 1','12345','Testort')").run();
      ctx.repo.updateProject({ id: project.id, bauherr: { kind: "global_firm", id: "builder" } });
      roles.saveProjectData({ projectId: project.id, planning: { source: "free", data: contact("Planung") },
        executionSameAsPlanning: false, execution: { source: "free", data: contact("Ausführung") } });
      let source = authorities.saveAuthorityRecord({ patch: { category: "LABOR_AUTHORITY", organization: "Geprüfte Arbeitsschutzstelle",
        street: "Behördenweg 4", zip: "34567", city: "Behördenort", phone: "01234 5678", email: "behoerde@example.test",
        source: "Originalseite geprüft", verification_note: "Kontakte überprüft", scope_street: address.street, scope_zip: address.zip, scope_city: address.city } });
      source = authorities.confirmAuthorityRecord({ id: source.id, expectedRevision: source.revision });
      assignments.assignProjectAuthority({ projectId: project.id, category: source.category, sourceId: source.id, sourceRevision: source.revision,
        expectedRevision: 0, expectedAddress: address, status: "confirmed", note: "Für diese Baustelle geprüft" });
      save(complete);
      return source;
    };
    return fn({ ...ctx, project, other, drafts, draftRepo, roles, authorities, assignments, stock, directory,
      read, save, capture, makeService, runtime, runtimeRequests, setupComplete, setLicense: value => { license = value; } });
  }, { modules: ["sigeko"] });
}

async function runSigekoPreNotificationSnapshotTests(run) {
  await run("S5.3b1: untouched project captures warning data without creating a draft or claiming a final document", () => withSnapshots(async ctx => {
    const tables = ["sigeko_pre_notifications", "sigeko_projects", "sigeko_profiles", "sigeko_project_authorities"];
    const dump = () => tables.map(table => ctx.db.prepare(`SELECT * FROM ${table}`).all());
    const before = dump(); const result = await ctx.capture();
    assert.equal(result.schemaVersion, 1); assert.equal(result.documentTypeId, "sigeko-vorankuendigung");
    assert.deepEqual(result.source, { draftId: null, draftRevision: 0 });
    assert.equal(result.readiness.status, "red"); assert.ok(result.readiness.issues.length > 0);
    assert.equal(result.form.builder, null); assert.equal(result.form.durationMonths, null);
    assert.equal(result.form.authority, null); assert.equal(result.form.authorityEvidence, null);
    for (const key of ["final", "filePath", "sent", "signed", "status", "signatureDate"]) assert.equal(Object.hasOwn(result, key), false);
    assert.deepEqual(dump(), before); assert.deepEqual(ctx.runtimeRequests, [{ mode: "provider", projectId: ctx.project.id, orientation: "portrait" }]);
  }));
  await run("S5.3b1: complete snapshot retains separate contacts point-eight numbers and manual whole months", () => withSnapshots(async ctx => {
    ctx.setupComplete(); ctx.save({ third_party_mode: "free", ...Object.fromEntries(Object.entries(contact("Dritter")).map(([key, value]) => [`third_party_${key}`, value])) });
    const result = await ctx.capture();
    assert.equal(result.readiness.status, "green"); assert.deepEqual(result.readiness.issues, []);
    assert.equal(result.form.builder.name, "Bauherr"); assert.equal(result.form.planning.name, "Planung");
    assert.equal(result.form.execution.name, "Ausführung"); assert.equal(result.form.thirdParty.name, "Dritter");
    assert.equal(result.form.plannedStart, "2027-03-04"); assert.equal(result.form.durationMonths, 9);
    assert.equal(result.form.maxWorkers, 35); assert.equal(result.form.employerCount, 7); assert.equal(result.form.selfEmployedCount, 2);
    assert.equal(result.form.buildingType, "Neubau Wohnhaus"); assert.equal(result.source.draftRevision, 2);
  }));
  await run("S5.3b1: snapshot distinguishes unknown counts from explicit zero and local start from central start", () => withSnapshots(async ctx => {
    ctx.save({ planned_start_override: "2028-02-29", duration_months: null, employer_count: 0, self_employed_count: 0, max_workers: 0 });
    const result = await ctx.capture();
    assert.equal(result.form.plannedStart, "2028-02-29"); assert.equal(result.printRuntimeContext.project.geplanter_baubeginn, "2027-03-04");
    assert.equal(result.form.durationMonths, null);
    for (const key of ["maxWorkers", "employerCount", "selfEmployedCount"]) assert.equal(result.form[key], 0);
    assert.equal(result.readiness.status, "red");
  }));
  await run("S5.3b1: authority evidence captures every validated assignment column and exact confirmed source", () => withSnapshots(async ctx => {
    const source = ctx.setupComplete(); const live = ctx.read().effective.authority;
    const result = await ctx.capture();
    assert.equal(result.form.authorityStatus, "green");
    assert.deepEqual(result.form.authorityEvidence, Object.fromEntries(PROJECT_AUTHORITY_COLUMNS.map(key => [key, live.assignment[key]])));
    assert.deepEqual(JSON.parse(result.form.authorityEvidence.snapshot_json), Object.fromEntries(AUTHORITY_COLUMNS.map(key => [key, source[key]])));
    assert.equal(result.form.authority.organization, source.organization); assert.equal(result.form.authority.email, source.email);
    assert.equal(result.form.authorityEvidence.source_revision, source.revision);
  }));
  await run("S5.3b1: changed authority stock stays an orange warning with the original project evidence", () => withSnapshots(async ctx => {
    const source = ctx.setupComplete(); const before = await ctx.capture();
    ctx.authorities.saveAuthorityRecord({ id: source.id, expectedRevision: source.revision, patch: { organization: "Neu zu prüfende Stelle" } });
    const result = await ctx.capture();
    assert.equal(result.form.authorityStatus, "orange"); assert.notEqual(result.readiness.status, "green");
    assert.deepEqual(result.form.authorityEvidence, before.form.authorityEvidence);
    assert.equal(result.form.authority.organization, source.organization);
    assert.ok(result.readiness.issues.some(issue => issue.field === "authority"));
  }));
  await run("S5.3b1: conservative equivalent address spelling retains the existing green authority assessment", () => withSnapshots(async ctx => {
    ctx.setupComplete(); ctx.repo.updateProject({ id: ctx.project.id, city: "TESTORT" });
    assert.equal(ctx.read().effective.authority.status, "green");
    const result = await ctx.capture(); assert.equal(result.form.authorityStatus, "green"); assert.equal(result.form.address.city, "TESTORT");
    assert.equal(result.form.authorityEvidence.address_city, "Testort");
  }));
  await run("S5.3b1: captured document is recursively immutable and survives lossless JSON roundtrip after source changes", () => withSnapshots(async ctx => {
    const source = ctx.setupComplete(); let runtimeSource;
    const service = ctx.makeService({ runtime: async request => { runtimeSource = await ctx.runtime(request); return runtimeSource; } });
    const result = await service.capture({ projectId: ctx.project.id, expectedRevision: ctx.read().record.revision }); const json = JSON.stringify(result);
    function frozen(value) { if (value && typeof value === "object") { assert.ok(Object.isFrozen(value)); Object.values(value).forEach(frozen); } }
    frozen(result); assert.throws(() => { result.form.planning.name = "Manipuliert"; }, TypeError);
    assert.throws(() => { result.printRuntimeContext.logos.push({}); }, TypeError);
    runtimeSource.logos[0].dataUrl = "data:image/png;base64,changed"; runtimeSource.userData.name = "Anderes Büro";
    ctx.repo.updateProject({ id: ctx.project.id, street: "Neuer Bauweg", geplanter_baubeginn: "2030-01-01" });
    ctx.db.prepare("UPDATE firms SET name='Geänderter Bauherr' WHERE id='builder'").run();
    ctx.roles.saveProjectData({ projectId: ctx.project.id, planning: { source: "free", data: contact("Neue Planung") } });
    ctx.save({ duration_months: 12 });
    ctx.authorities.saveAuthorityRecord({ id: source.id, expectedRevision: source.revision, patch: { email: "neu@example.test" } });
    assert.equal(JSON.stringify(result), json); const restored = JSON.parse(json);
    assert.deepEqual(validatePreNotificationSnapshot(restored, ctx.project.id, result.documentId), result);
    const latest = await ctx.capture(); assert.equal(latest.form.planning.name, "Neue Planung"); assert.equal(latest.form.durationMonths, 12);
    assert.notEqual(latest.documentId, result.documentId); assert.equal(result.form.address.street, address.street);
  }));
  await run("S5.3b1: Main assigns document identity and rejects extra payload keys client snapshots and stale revisions", () => withSnapshots(async ctx => {
    ctx.save(complete); const service = ctx.makeService(); const valid = { projectId: ctx.project.id, expectedRevision: 1 };
    for (const payload of [null, [], {}, { ...valid, snapshot: {} }, { ...valid, documentId: "client" }, { ...valid, createdAt: "client" },
      { ...valid, expectedRevision: 1.5 }, { ...valid, expectedRevision: -1 }, { ...valid, projectId: ` ${ctx.project.id}` }]) {
      await assert.rejects(service.capture(payload), { code: "INVALID_INPUT" });
    }
    await assert.rejects(service.capture({ ...valid, expectedRevision: 0 }), { code: "PRE_NOTIFICATION_CONFLICT" });
    await assert.rejects(service.capture({ ...valid, projectId: "missing" }), { code: "PROJECT_NOT_FOUND" });
    assert.deepEqual(ctx.runtimeRequests, []);
    const result = await service.capture(valid); assert.match(result.documentId, /^snapshot-fixture-/); assert.equal(result.createdAt, "2026-09-10T12:00:00.000Z");
  }));
  await run("S5.3b1: license revocation during awaited runtime prevents snapshot creation", () => withSnapshots(async ctx => {
    let entered; const ready = new Promise(resolve => { entered = resolve; }); let release;
    const pause = new Promise(resolve => { release = resolve; }); let identities = 0;
    const service = ctx.makeService({ runtime: async request => { const value = await ctx.runtime(request); entered(); await pause; return value; }, uuid: () => { identities++; return "should-not-exist"; } });
    const pending = service.capture({ projectId: ctx.project.id, expectedRevision: 0 }); await ready;
    ctx.setLicense({ valid: true, license: { modules: ["protokoll"] } }); release();
    await assert.rejects(pending, /FEATURE_NOT_ALLOWED:sigeko/); assert.equal(identities, 0); assert.equal(ctx.read().record, null);
  }));
  await run("S5.3b1: draft revision change during awaited runtime is rejected before allocating document identity", () => withSnapshots(async ctx => {
    ctx.save(complete); let identities = 0;
    const service = ctx.makeService({ runtime: async request => { const result = await ctx.runtime(request); ctx.save({ duration_months: 10 }); return result; },
      uuid: () => { identities++; return "should-not-exist"; } });
    await assert.rejects(service.capture({ projectId: ctx.project.id, expectedRevision: 1 }), { code: "PRE_NOTIFICATION_CONFLICT" }); assert.equal(identities, 0);
  }));
  await run("S5.3b1: replacing a draft with the same revision during runtime cannot reuse its original document identity", () => withSnapshots(async ctx => {
    const original = ctx.save(complete).record;
    const service = ctx.makeService({ runtime: async request => {
      const result = await ctx.runtime(request);
      ctx.db.prepare("DELETE FROM sigeko_pre_notifications WHERE project_id=?").run(ctx.project.id);
      const replacement = ctx.save(complete).record;
      assert.notEqual(replacement.id, original.id); assert.equal(replacement.revision, original.revision);
      return result;
    } });
    await assert.rejects(service.capture({ projectId: ctx.project.id, expectedRevision: original.revision }), { code: "PRE_NOTIFICATION_CONFLICT" });
  }));
  await run("S5.3b1: project source change or foreign runtime project during capture is rejected", () => withSnapshots(async ctx => {
    const service = ctx.makeService({ runtime: async request => { const result = await ctx.runtime(request); ctx.repo.updateProject({ id: ctx.project.id, street: "Geänderte Adresse" }); return result; } });
    await assert.rejects(service.capture({ projectId: ctx.project.id, expectedRevision: 0 }), { code: "PRE_NOTIFICATION_SOURCE_CHANGED" });
    const wrong = ctx.makeService({ runtime: async () => ({ project: ctx.repo.getById(ctx.other.id), orientation: "portrait" }) });
    await assert.rejects(wrong.capture({ projectId: ctx.project.id, expectedRevision: 0 }), { code: "PRE_NOTIFICATION_SOURCE_CHANGED" });
  }));
  await run("S5.3b1: snapshot schema rejects unknown fields identity tampering and inconsistent draft references", () => withSnapshots(async ctx => {
    const result = await ctx.capture();
    for (const change of [v => { v.schemaVersion = 2; }, v => { v.documentTypeId = "invoice"; }, v => { v.extra = 1; },
      v => { delete v.form; }, v => { v.form.extra = 1; }, v => { v.source.draftId = "unknown"; },
      v => { v.source.draftRevision = 1; }, v => { v.createdAt = "2026-02-30T12:00:00.000Z"; },
      v => { v.printRuntimeContext.orientation = "landscape"; }, v => { v.printRuntimeContext.project.id = "foreign"; }]) {
      const value = clone(result); change(value); errorCode(() => validatePreNotificationSnapshot(value));
    }
    errorCode(() => validatePreNotificationSnapshot(result, "foreign", result.documentId));
    errorCode(() => validatePreNotificationSnapshot(result, ctx.project.id, "foreign"));
  }));
  await run("S5.3b1: snapshot schema rejects invalid dates fractional months malformed contacts and misleading readiness", () => withSnapshots(async ctx => {
    const result = await ctx.capture();
    for (const change of [v => { v.form.plannedStart = "2027-02-29"; }, v => { v.form.durationMonths = 0; }, v => { v.form.durationMonths = 1.5; },
      v => { v.form.maxWorkers = -1; }, v => { v.form.employerCount = "0"; }, v => { v.form.selfEmployedCount = Number.MAX_SAFE_INTEGER + 1; },
      v => { v.form.builder = { name: "Unvollständig" }; }, v => { v.form.firmsMode = "invented"; },
      v => { v.form.authorityStatus = "green"; }, v => { v.readiness.status = "green"; }, v => { v.readiness.issues[0].status = "green"; }]) {
      const value = clone(result); change(value); errorCode(() => validatePreNotificationSnapshot(value));
    }
  }));
  await run("S5.3b1: authority address evidence and category cannot be independently substituted", () => withSnapshots(async ctx => {
    ctx.setupComplete(); const result = await ctx.capture();
    for (const change of [v => { v.form.authority.email = "foreign@example.test"; }, v => { v.form.authorityEvidence.project_id = ctx.other.id; },
      v => { v.form.authorityEvidence.source_revision++; }, v => { v.form.authorityEvidence.category = "WATER"; },
      v => { v.form.authorityEvidence.snapshot_json = "invalid"; }, v => { v.form.authorityEvidence.assessment_status = "uncertain"; },
      v => { v.form.address.street = "Bauweg 12a"; }]) {
      const value = clone(result); change(value); assert.throws(() => validatePreNotificationSnapshot(value));
    }
  }));
  await run("S5.3b1: non-JSON runtime values are rejected before immutable capture", () => withSnapshots(async ctx => {
    const data = ctx.read();
    for (const value of [undefined, NaN, Infinity, new Date(), new Map(), () => 1, Symbol("test")]) {
      const runtimeContext = await ctx.runtime({ projectId: ctx.project.id }); runtimeContext.bad = value;
      errorCode(() => buildPreNotificationSnapshot({ data, runtimeContext, documentId: "server-document", createdAt: "2026-09-10T12:00:00.000Z" }));
    }
    const runtimeContext = await ctx.runtime({ projectId: ctx.project.id }); runtimeContext.self = runtimeContext;
    errorCode(() => buildPreNotificationSnapshot({ data, runtimeContext, documentId: "server-document", createdAt: "2026-09-10T12:00:00.000Z" }));
    for (const descriptor of [{ value: "hidden", enumerable: false }, { get: () => "computed", enumerable: true }]) {
      const context = await ctx.runtime({ projectId: ctx.project.id }); Object.defineProperty(context, "nonJson", descriptor);
      errorCode(() => buildPreNotificationSnapshot({ data, runtimeContext: context, documentId: "server-document", createdAt: "2026-09-10T12:00:00.000Z" }));
    }
  }));
  await run("S5.3b1: real shared runtime captures the existing project settings and user profile without loading document content", () => withSnapshots(async ctx => {
    const overrides = { "./database": ctx.database };
    const settings = load("src/main/db/appSettingsRepo.js", overrides);
    const projectSettings = load("src/main/db/projectSettingsRepo.js", overrides);
    const profiles = load("src/main/db/userProfileRepo.js", overrides);
    profiles.upsertUserProfile({ name1: "Gemeinsames Büro" });
    settings.appSettingsSetManyWithDb(ctx.db, { "pdf.footerUseUserData": "true", "pdf.protocolTitle": "Globaler Titel" });
    projectSettings.setMany(ctx.project.id, { "pdf.protocolTitle": "Projektkopf" });
    const forbidden = () => assert.fail("Snapshot runtime must not load document content");
    const print = load("src/main/print/printData.js", { "../db/database": ctx.database, "../db/projectsRepo": ctx.repo,
      "../db/appSettingsRepo": settings, "../db/projectSettingsRepo": projectSettings, "../db/userProfileRepo": profiles,
      "../db/meetingTopsRepo": { listJoinedByMeeting: forbidden, listLatestByProject: forbidden },
      "../domain/firms/FirmDirectoryService": { getFirmDirectoryService: forbidden },
      "../licensing/licenseService": { getStatus: () => ({ valid: true, license: { modules: ["sigeko"] } }) } });
    const service = ctx.makeService({ runtime: print.getPrintRuntimeContext });
    const snapshot = await service.capture({ projectId: ctx.project.id, expectedRevision: 0 });
    assert.equal(snapshot.printRuntimeContext.protocolTitle, "Projektkopf"); assert.equal(snapshot.printRuntimeContext.userData.name1, "Gemeinsames Büro");
    assert.equal(snapshot.printRuntimeContext.orientation, "portrait"); assert.deepEqual(snapshot.printRuntimeContext.project, ctx.repo.getById(ctx.project.id));
    assert.deepEqual(validatePreNotificationSnapshot(clone(snapshot)), snapshot);
  }));
}

module.exports = { runSigekoPreNotificationSnapshotTests, withSnapshots };
if (require.main === module) runSigekoPreNotificationSnapshotTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
