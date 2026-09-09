"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { fixture, load } = require("./plannedConstructionStart.test.cjs");
const { createProjectStorageAccess } = require("../../src/main/ipc/projectStoragePaths");
const { getModuleDefinition } = require("../../src/main/moduleRegistry");
const { createSharedFirmsPrintAccess, isSharedFirmsPrintRequest } = require("../../src/main/print/sharedFirmsPrintAccess");

const request = (projectId, extra = {}) => ({ mode: "firms", moduleId: "sigeko", projectId, storage: { target: "Unterlagen" }, ...extra });
const code = (fn, expected) => assert.throws(fn, { code: expected });

function withAccess(fn) {
  return fixture(ctx => {
    const project = ctx.repo.createProject({ name: "Zentrale Baustelle", project_number: "53", short: "Büro West" });
    let license = { valid: true, license: { modules: ["sigeko"] } };
    const service = load("src/main/licensing/licenseService.js", {
      "./licenseStorage": { loadLicense: () => null }, "./licenseVerifier": { verifyLicense: () => license },
      "./developmentLicenseLoader": { loadDevelopmentLicenseStatus: () => null },
    });
    const guard = load("src/main/licensing/featureGuard.js", { electron: { app: { isPackaged: true, getVersion: () => "test" } }, "./licenseService": service });
    const calls = { guards: [], projects: [], definitions: [] };
    const storage = createProjectStorageAccess({ getProject: id => { calls.projects.push(id); return ctx.repo.getById(id); },
      getBaseDir: () => path.join(ctx.root, "Druckablage") });
    const access = createSharedFirmsPrintAccess({ storage, enforce: moduleId => { calls.guards.push(moduleId); return guard.enforceLicensedFeature(moduleId); },
      getModuleDefinition: moduleId => { calls.definitions.push(moduleId); return getModuleDefinition(moduleId); } });
    return fn({ ...ctx, project, access, storage, calls, setLicense: value => { license = value; }, guard });
  }, { modules: ["sigeko"] });
}

function withContext(fn) {
  return fixture(ctx => {
    const overrides = { "./database": ctx.database };
    const settings = load("src/main/db/appSettingsRepo.js", overrides);
    const projectSettings = load("src/main/db/projectSettingsRepo.js", overrides);
    const profiles = load("src/main/db/userProfileRepo.js", overrides);
    const project = ctx.repo.createProject({ name: "Kontextprojekt", project_number: "53", street: "Bauweg 1", zip: "12345", city: "Testort" });
    const calls = { firms: 0, tops: 0, invoices: 0, meetings: 0, layouts: 0 };
    const forbidden = name => () => { calls[name]++; assert.fail(`Unexpected document content read: ${name}`); };
    const print = load("src/main/print/printData.js", {
      "../db/database": ctx.database, "../db/projectsRepo": ctx.repo, "../db/projectSettingsRepo": projectSettings,
      "../db/appSettingsRepo": settings, "../db/userProfileRepo": profiles,
      "../db/meetingsRepo": { getMeetingById: forbidden("meetings") },
      "../db/meetingTopsRepo": { listJoinedByMeeting: forbidden("tops"), listLatestByProject: forbidden("tops") },
      "../db/invoiceRepository": { InvoiceRepository: class { constructor() { forbidden("invoices")(); } } },
      "../domain/rechnung/InvoiceService": { InvoiceService: class { constructor() { forbidden("invoices")(); } } },
      "../db/tableLayoutsRepo": { getResolvedTableLayout: forbidden("layouts") },
      "../domain/firms/FirmDirectoryService": { getFirmDirectoryService: () => ({ listProjectParticipants: ({ projectId }) => {
        assert.equal(projectId, project.id); calls.firms++; return [];
      } }) },
      "../licensing/licenseService": { getStatus: () => ({ valid: true, license: { modules: ["sigeko"], customerName: "Testkunde" } }) },
    });
    settings.appSettingsSetManyWithDb(ctx.db, { "pdf.protocolTitle": "Globaler Titel", "pdf.footerUseUserData": "true",
      "print.logo1.enabled": "true", "print.logo1.pngDataUrl": "data:image/png;base64,fixture", "print.logo1.size": "small",
      "print.logo1.align": "left", "print.logo1.vAlign": "top", "print.v2.pagePadLeftMm": "13" });
    projectSettings.setMany(project.id, { "pdf.protocolTitle": "Projekttitel" });
    profiles.upsertUserProfile({ name1: "Gemeinsames Büro", street: "Büroweg 2", zip: "23456", city: "Büroort" });
    return fn({ ...ctx, project, print, calls, settings, projectSettings, profiles });
  }, { modules: ["sigeko"] });
}

async function runSharedFirmsPrintAccessTests(run) {
  await run("S5.3a: explicit module identity selects shared firms access without claiming legacy requests", () => {
    assert.equal(isSharedFirmsPrintRequest({ mode: "firms" }), false);
    assert.equal(isSharedFirmsPrintRequest({ mode: "protocol" }), false);
    assert.equal(isSharedFirmsPrintRequest(request("p")), true);
    for (const moduleId of [undefined, null, "", false, "unknown"]) assert.equal(isSharedFirmsPrintRequest({ mode: "firms", moduleId }), true);
  });
  await run("S5.3a: SiGeKo-only license resolves the canonical central project storage without creating files", () => withAccess(({ project, access, storage, calls, db }) => {
    const before = db.prepare("SELECT * FROM projects").all(); const result = access.resolve(request(project.id));
    assert.equal(result.moduleId, "sigeko"); assert.equal(result.projectId, project.id);
    assert.equal(result.directory, storage.resolve({ moduleId: "sigeko", projectId: project.id }).targets.Unterlagen);
    assert.deepEqual(result.storage, { target: "Unterlagen" }); assert.deepEqual(calls.guards, ["sigeko"]);
    assert.equal(calls.definitions[0], "sigeko"); assert.equal(fs.existsSync(result.directory), false);
    assert.deepEqual(db.prepare("SELECT * FROM projects").all(), before);
  }));
  await run("S5.3a: current license revocation is checked on every resolution before any project lookup", () => withAccess(({ project, access, calls, setLicense }) => {
    const payload = request(project.id); access.resolve(payload); const count = calls.projects.length;
    for (const status of [{ valid: true, license: { modules: ["protokoll"] } }, { valid: true, license: { modules: [] } },
      { valid: false, reason: "LICENSE_EXPIRED", license: { modules: ["sigeko"] } }]) {
      setLicense(status); assert.throws(() => access.resolve(payload), /FEATURE_NOT_ALLOWED:sigeko|LICENSE_INVALID:LICENSE_EXPIRED/);
      assert.equal(calls.projects.length, count);
    }
    setLicense({ valid: true, license: { modules: ["sigeko"] } }); assert.equal(access.resolve(payload).moduleId, "sigeko");
  }));
  await run("S5.3a: malformed explicit identities and foreign modes never fall back to Protokoll", () => withAccess(({ project, access, calls }) => {
    for (const moduleId of [undefined, null, "", "SiGeKo", " sigeko ", "constructor", "unknown", true, {}, []]) {
      code(() => access.resolve(request(project.id, { moduleId })), "PDF_SHARED_REQUEST_INVALID");
    }
    for (const mode of [undefined, null, "", "protocol", "invoice", "todo", "topsAll", "provider", "FIRMS", " firms "]) {
      code(() => access.resolve(request(project.id, { mode })), "PDF_SHARED_REQUEST_INVALID");
    }
    assert.deepEqual(calls.projects, []); assert.deepEqual(calls.guards, []);
  }));
  await run("S5.3a: module PDF capability is required before licensing or storage access", () => {
    let effects = 0;
    const access = createSharedFirmsPrintAccess({ getModuleDefinition: moduleId => ({ id: moduleId, requiredCapabilities: ["mail"] }),
      enforce: () => effects++, storage: { resolve: () => { effects++; } } });
    code(() => access.resolve(request("p")), "PDF_CAPABILITY_MISSING"); assert.equal(effects, 0);
  });
  await run("S5.3a: missing central project and invalid target fail without creating storage", () => withAccess(({ project, access, root }) => {
    code(() => access.resolve(request("missing")), "PROJECT_NOT_FOUND");
    for (const projectId of [undefined, null, "", "  ", 17, {}, []]) code(() => access.resolve(request(projectId)), "PDF_SHARED_REQUEST_INVALID");
    for (const storage of [undefined, null, {}]) code(() => access.resolve(request(project.id, { storage })), "PDF_STORAGE_TARGET_REQUIRED");
    for (const target of ["", "../Unterlagen", "constructor", "toString", "Protokolle", 7, {}, []]) {
      code(() => access.resolve(request(project.id, { storage: { target } })), "PDF_STORAGE_TARGET_INVALID");
    }
    assert.equal(fs.existsSync(path.join(root, "Druckablage")), false);
  }));
  await run("S5.3a: renderer project copies foreign document context and direct path bypasses are rejected", () => withAccess(({ project, access, calls }) => {
    for (const extra of [{ project: { ...project, name: "Forged" } }, { meetingId: "meeting" }, { invoiceId: "invoice" }, { documentId: "document" },
      { providerRequest: {} }, { documentTypeId: "provider" }, { invoicePreview: true }, { pdfEditorPreview: true }, { devLayoutPreview: true }, { baseDir: "/tmp/escape" }, { baseDir: null },
      { overwrite: false }, { overwrite: null }, { targetDir: "/tmp/escape" }, { targetDir: "relative" }]) {
      code(() => access.resolve(request(project.id, extra)), "PDF_SHARED_REQUEST_INVALID");
    }
    code(() => access.resolve(request(project.id, { storage: { target: "Unterlagen", directory: "/tmp/escape" } })), "PDF_STORAGE_TARGET_INVALID");
    assert.deepEqual(calls.projects, []);
  }));
  await run("S5.3a: temp preview and explicit nested base directory retain the same verified module target", () => withAccess(({ project, access, root }) => {
    const baseDir = path.join(root, "Ausdrückliche Ablage");
    const result = access.resolve(request(project.id, { targetDir: "temp", storage: { target: "Unterlagen", baseDir } }));
    assert.equal(result.moduleId, "sigeko"); assert.ok(result.directory.startsWith(baseDir + path.sep));
    assert.equal(path.basename(result.directory), "Unterlagen"); assert.equal(fs.existsSync(baseDir), false);
    assert.deepEqual(result.storage, { target: "Unterlagen", baseDir });
    code(() => access.resolve(request(project.id, { storage: { target: "Unterlagen", baseDir: "relative" } })), "INVALID_STORAGE_PATH");
    assert.equal(access.resolve(request(project.id, { targetDir: null, meetingId: null, invoiceId: null, invoicePreview: false })).projectId, project.id);
  }));
  await run("S5.3a: shared print runtime context equals the existing firms output common header data", () => withContext(async ({ project, print, calls }) => {
    const payload = { mode: "firms", projectId: project.id, orientation: "landscape", settingsOverride: { "print.v2.pagePadLeftMm": "17", "pdf.footerName2": "Manueller Zusatz" } };
    const context = await print.getPrintRuntimeContext(payload); assert.deepEqual(calls, { firms: 0, tops: 0, invoices: 0, meetings: 0, layouts: 0 });
    const existing = await print.getPrintData(payload);
    for (const key of Object.keys(context)) assert.deepEqual(context[key], existing[key], key);
    assert.equal(context.project.id, project.id); assert.equal(context.orientation, "landscape");
    assert.equal(context.v2Layout.pagePadLeftMm, 17); assert.equal(context.userData.name1, "Gemeinsames Büro");
    assert.equal(context.userData.name2, "Manueller Zusatz"); assert.equal(context.logos[0].dataUrl, "data:image/png;base64,fixture");
    assert.equal(context.protocolTitle, "Projekttitel");
    assert.equal(context.logos[0].size, "small"); assert.equal(calls.firms, 1);
    for (const key of ["participants", "tops", "firms", "todoRows", "invoice", "restarbeitenItems", "tableLayouts"]) assert.equal(Object.hasOwn(context, key), false);
  }));
  await run("S5.3a: runtime-only context reads no TOP invoice or participant content for any known document family", () => withContext(async ({ project, print, calls }) => {
    for (const mode of ["protocol", "preview", "firms", "topsAll", "todo", "restarbeiten", "invoice"]) {
      const context = await print.getPrintRuntimeContext({ mode, projectId: project.id, orientation: "portrait" });
      assert.equal(context.project.id, project.id); assert.equal(context.orientation, "portrait"); assert.ok(context.printProfile);
    }
    assert.deepEqual(calls, { firms: 0, tops: 0, invoices: 0, meetings: 0, layouts: 0 });
    await assert.rejects(print.getPrintRuntimeContext({ mode: "unknown", projectId: project.id }), /Unbekannter Druckmodus/);
  }));
  await run("S5.3a: runtime context refreshes shared project settings and profile without mutating persisted records", () => withContext(async ({ project, print, db, profiles, projectSettings, settings }) => {
    const tables = ["projects", "project_settings", "app_settings", "user_profile"];
    const dump = () => tables.map(table => db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all());
    const before = dump(); const first = await print.getPrintRuntimeContext({ mode: "firms", projectId: project.id });
    assert.deepEqual(dump(), before); profiles.upsertUserProfile({ name1: "Aktuelles Büro" });
    projectSettings.setMany(project.id, { "pdf.protocolTitle": "Aktueller Projekttitel" });
    settings.appSettingsSetManyWithDb(db, { "print.logo1.pngDataUrl": "data:image/png;base64,current" }); const changed = dump();
    const second = await print.getPrintRuntimeContext({ mode: "firms", projectId: project.id });
    assert.equal(first.userData.name1, "Gemeinsames Büro"); assert.equal(second.userData.name1, "Aktuelles Büro");
    assert.equal(second.logos[0].dataUrl, "data:image/png;base64,current"); assert.equal(second.protocolTitle, "Aktueller Projekttitel"); assert.deepEqual(dump(), changed);
  }));
}

module.exports = { runSharedFirmsPrintAccessTests };
if (require.main === module) runSharedFirmsPrintAccessTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
