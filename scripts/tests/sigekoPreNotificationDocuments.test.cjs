"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { withSnapshots } = require("./sigekoPreNotificationSnapshot.test.cjs");
const { createPreNotificationDocumentService } = require("../../src/main/domain/sigeko/PreNotificationDocumentService");
const { SigekoDocumentsRepository } = require("../../src/main/db/sigekoDocumentsRepo");
const { validateSigekoDocumentRow, validateDocumentFile } = require("../../src/shared/sigeko/documents.cjs");
const { inspectDocumentFile } = require("../../src/main/domain/sigeko/preNotificationDocumentFiles");

const clone = value => structuredClone(value);
const digest = buffer => createHash("sha256").update(buffer).digest("hex");
const error = code => Object.assign(new Error(code), { code });

// SQLite, capture, draft/authority services, repository and filesystem are real.
// Only the Electron PDF renderer/open boundary is replaced: these tests assert
// persistence and races, not the visual or syntactic validity of rendered PDFs.
function withDocuments(check) {
  return withSnapshots(async ctx => {
    const documents = new SigekoDocumentsRepository({ dbProvider: ctx.database.initDatabase });
    const requests = [], opened = [], generated = [], directory = path.join(ctx.root, "projects");
    let serial = 0, time = Date.parse("2026-09-10T13:00:00.000Z"), licensed = true, storageSuffix = "";
    const storage = { resolve({ moduleId, projectId }) {
      assert.equal(moduleId, "sigeko");
      const projectFolder = `${projectId}${storageSuffix}`, moduleDir = path.join(directory, projectFolder, "SiGeKo");
      return { baseDir: directory, projectFolder, moduleDir, targets: { Unterlagen: path.join(moduleDir, "Unterlagen") } };
    } };
    const enforce = moduleId => { assert.equal(moduleId, "sigeko"); if (!licensed) throw error("FEATURE_NOT_ALLOWED:sigeko"); };
    const payload = (projectId = ctx.project.id) => ({ projectId, expectedRevision: projectId === ctx.project.id ? ctx.read().record?.revision || 0 : 0 });
    const identity = context => ({ moduleId: "sigeko", projectId: context.projectId, documentId: context.documentId });
    let service;
    const print = async (request, options) => {
      requests.push({ request: clone(request), options });
      assert.equal(options.exclusiveWrite, true); assert.equal(options.includeMetadata, true);
      const data = request.mode === "provider" ? service.resolveProviderDocument({ input: request.providerRequest.data,
        identity: { moduleId: "sigeko", projectId: request.projectId, documentId: request.documentId } }) : options.preparedData;
      const target = request.targetDir === "temp" ? path.join(ctx.root, "preview") : storage.resolve({ moduleId: "sigeko", projectId: request.projectId }).targets.Unterlagen;
      fs.mkdirSync(target, { recursive: true });
      const filePath = path.join(target, request.fileName);
      options.beforeWrite({ filePath });
      const buffer = Buffer.from(`%PDF-1.4\n${JSON.stringify(data)}\n%%EOF\n`);
      fs.writeFileSync(filePath, buffer, { flag: "wx" });
      const result = { filePath, byteSize: buffer.length, sha256: digest(buffer), pageCount: 1 };
      generated.push(result);
      return result;
    };
    const base = { repo: documents, projects: ctx.repo, captures: ctx.makeService(), authorities: ctx.assignments, storage, enforce, print,
      open: async value => { opened.push(clone(value)); }, uuid: () => `document-context-${++serial}`, now: () => time,
      clock: () => new Date(time++).toISOString(), firmsData: async () => assert.fail("Unknown firms mode must not load firms") };
    function makeService(options = {}) { service = createPreNotificationDocumentService({ ...base, ...options }); return service; }
    makeService();
    await check({ ...ctx, documents, requests, opened, generated, storage, payload, identity, print, base, makeService,
      get service() { return service; }, count: () => ctx.db.prepare("SELECT COUNT(*) AS n FROM sigeko_documents").get().n,
      setLicensed: value => { licensed = value; }, advance: ms => { time += ms; }, moveStorage: () => { storageSuffix = "-moved"; },
      rootFor: (projectId = ctx.project.id) => path.dirname(storage.resolve({ moduleId: "sigeko", projectId }).moduleDir) });
  });
}

async function runSigekoPreNotificationDocumentTests(run) {
  await run("S5.3b2: preview and editor capture warnings without creating drafts or final records", () => withDocuments(async ctx => {
    const context = (await ctx.service.preparePreNotificationPdfEditor(ctx.payload())).context;
    const rendered = ctx.service.resolveProviderDocument({ input: context.providerRequest.data, identity: ctx.identity(context) });
    assert.equal(rendered.snapshot.readiness.status, "red");
    assert.equal(rendered.printRuntimeContext.printProfile.documentLabel, "Vorankündigung");
    assert.equal(rendered.printRuntimeContext.printProfile.header.titleMode, "documentLabel");
    assert.deepEqual(await ctx.service.previewPreNotificationPdf(ctx.payload()), { opened: true });
    assert.equal(ctx.opened.length, 1); assert.equal(ctx.requests[0].request.targetDir, "temp");
    assert.equal(ctx.count(), 0); assert.equal(ctx.read().record, null);
    const expired = ctx.requests[0].request;
    assert.throws(() => ctx.service.resolveProviderDocument({ input: expired.providerRequest.data,
      identity: { moduleId: "sigeko", projectId: expired.projectId, documentId: expired.documentId } }), { code: "SIGEKO_DOCUMENT_CONTEXT_EXPIRED" });
  }));
  await run("S5.3b2: two final versions keep distinct immutable snapshots files and deterministic listing", () => withDocuments(async ctx => {
    ctx.setupComplete(); const first = (await ctx.service.createPreNotificationPdf(ctx.payload())).document;
    const firstRow = ctx.documents.get(ctx.project.id, first.id), firstFile = inspectDocumentFile(ctx.rootFor(), first.files[0]);
    const firstBytes = fs.readFileSync(firstFile);
    ctx.save({ duration_months: 12 });
    const second = (await ctx.service.createPreNotificationPdf(ctx.payload())).document;
    assert.notEqual(first.id, second.id); assert.notEqual(first.files[0].projectRelativePath, second.files[0].projectRelativePath);
    assert.deepEqual(ctx.documents.get(ctx.project.id, first.id), firstRow); assert.deepEqual(fs.readFileSync(firstFile), firstBytes);
    assert.equal(JSON.parse(firstRow.snapshot_json).form.durationMonths, 9);
    assert.equal(JSON.parse(ctx.documents.get(ctx.project.id, second.id).snapshot_json).form.durationMonths, 12);
    assert.deepEqual(ctx.service.listPreNotificationDocuments({ projectId: ctx.project.id }).documents.map(row => row.id), [second.id, first.id]);
    assert.deepEqual(ctx.service.listPreNotificationDocuments({ projectId: ctx.other.id }), { documents: [] });
    assert.throws(() => ctx.db.prepare("UPDATE sigeko_documents SET created_at=? WHERE id=?").run(second.createdAt, first.id), /immutable|unveränderlich/i);
    assert.equal(ctx.db.pragma("integrity_check", { simple: true }), "ok");
  }));
  await run("S5.3b2: final requires current confirmed labor authority but other readiness remains a warning", () => withDocuments(async ctx => {
    await assert.rejects(ctx.service.createPreNotificationPdf(ctx.payload()), { code: "AUTHORITY_NOT_READY" });
    assert.equal(ctx.requests.length, 0); assert.equal(ctx.count(), 0);
    const source = ctx.setupComplete(); ctx.save({ duration_months: null });
    assert.notEqual(ctx.read().readiness.status, "green");
    await ctx.service.createPreNotificationPdf(ctx.payload()); assert.equal(ctx.count(), 1);
    ctx.authorities.saveAuthorityRecord({ id: source.id, expectedRevision: source.revision, patch: { email: "changed@example.test" } });
    await assert.rejects(ctx.service.createPreNotificationPdf(ctx.payload()), { code: "AUTHORITY_NOT_READY" }); assert.equal(ctx.count(), 1);
  }));
  await run("S5.3b2: license and archived projects block all new jobs while archived historical files remain readable", () => withDocuments(async ctx => {
    ctx.setupComplete(); const doc = (await ctx.service.createPreNotificationPdf(ctx.payload())).document;
    ctx.db.prepare("UPDATE projects SET archived_at=? WHERE id=?").run("2026-09-10", ctx.project.id);
    for (const method of ["previewPreNotificationPdf", "createPreNotificationPdf", "preparePreNotificationPdfEditor"]) {
      await assert.rejects(ctx.service[method](ctx.payload()), { code: "PROJECT_ARCHIVED" });
    }
    assert.equal(ctx.service.listPreNotificationDocuments({ projectId: ctx.project.id }).documents.length, 1);
    await ctx.service.openPreNotificationDocumentFile({ projectId: ctx.project.id, documentId: doc.id, kind: "main" }); assert.equal(ctx.opened.length, 1);
    ctx.setLicensed(false);
    assert.throws(() => ctx.service.listPreNotificationDocuments({ projectId: ctx.project.id }), { code: "FEATURE_NOT_ALLOWED:sigeko" });
    await assert.rejects(ctx.service.openPreNotificationDocumentFile({ projectId: ctx.project.id, documentId: doc.id, kind: "main" }), { code: "FEATURE_NOT_ALLOWED:sigeko" });
    assert.equal(ctx.count(), 1);
  }));
  await run("S5.3b2: stale drafts and client controlled fields never start a PDF job", () => withDocuments(async ctx => {
    ctx.setupComplete(); const payload = ctx.payload();
    for (const method of ["previewPreNotificationPdf", "createPreNotificationPdf", "preparePreNotificationPdfEditor"]) {
      for (const extra of [{ filePath: "/tmp/client.pdf" }, { snapshot: {} }, { documentId: "client" }, { baseDir: "/tmp" }]) {
        await assert.rejects(ctx.service[method]({ ...payload, ...extra }), { code: "INVALID_INPUT" });
      }
      await assert.rejects(ctx.service[method]({ ...payload, expectedRevision: 0 }), { code: "PRE_NOTIFICATION_CONFLICT" });
    }
    assert.equal(ctx.requests.length, 0); assert.equal(ctx.count(), 0);
  }));
  await run("S5.3b2: simultaneous jobs for one project are rejected and the lock releases after failure", () => withDocuments(async ctx => {
    ctx.setupComplete(); let release, entered;
    const ready = new Promise(resolve => { entered = resolve; }); const paused = new Promise(resolve => { release = resolve; });
    const service = ctx.makeService({ print: async () => { entered(); await paused; throw error("RENDER_FAILED"); } });
    const pending = service.createPreNotificationPdf(ctx.payload()); await ready;
    await assert.rejects(service.previewPreNotificationPdf(ctx.payload()), { code: "SIGEKO_DOCUMENT_BUSY" });
    await assert.rejects(service.preparePreNotificationPdfEditor(ctx.payload()), { code: "SIGEKO_DOCUMENT_BUSY" });
    release(); await assert.rejects(pending, { code: "RENDER_FAILED" });
    await service.preparePreNotificationPdfEditor(ctx.payload()); assert.equal(ctx.count(), 0);
  }));
  for (const change of ["license", "archive", "storage", "project", "authority"]) {
    await run(`S5.3b2: ${change} change during rendering prevents writing a final PDF`, () => withDocuments(async ctx => {
      const source = ctx.setupComplete();
      const service = ctx.makeService({ print: async (request, options) => {
        if (change === "license") ctx.setLicensed(false);
        if (change === "archive") ctx.db.prepare("UPDATE projects SET archived_at=? WHERE id=?").run("2026-09-10", ctx.project.id);
        if (change === "storage") ctx.moveStorage();
        if (change === "project") ctx.repo.updateProject({ id: ctx.project.id, name: "Umbenannt" });
        if (change === "authority") ctx.authorities.saveAuthorityRecord({ id: source.id, expectedRevision: source.revision, patch: { email: "changed@example.test" } });
        return ctx.print(request, options);
      } });
      const code = ({ license: "FEATURE_NOT_ALLOWED:sigeko", archive: "PROJECT_ARCHIVED", storage: "PRE_NOTIFICATION_SOURCE_CHANGED",
        project: "PRE_NOTIFICATION_SOURCE_CHANGED", authority: "AUTHORITY_NOT_READY" })[change];
      await assert.rejects(service.createPreNotificationPdf(ctx.payload()), { code });
      assert.equal(ctx.count(), 0); assert.equal(ctx.generated.length, 0);
    }));
  }
  await run("S5.3b2: authority revoked after the PDF write prevents final insertion and removes owned bytes", () => withDocuments(async ctx => {
    const source = ctx.setupComplete();
    const service = ctx.makeService({ print: async (...args) => {
      const result = await ctx.print(...args);
      ctx.authorities.saveAuthorityRecord({ id: source.id, expectedRevision: source.revision, patch: { organization: "Neue Stelle" } });
      return result;
    } });
    await assert.rejects(service.createPreNotificationPdf(ctx.payload()), { code: "AUTHORITY_NOT_READY" });
    assert.equal(ctx.count(), 0); assert.equal(fs.existsSync(ctx.generated[0].filePath), false);
  }));
  await run("S5.3b2: firms attachment uses one prepared common data set and both actual file hashes", () => withDocuments(async ctx => {
    ctx.setupComplete(); ctx.db.prepare("INSERT INTO project_firms (id,project_id,name,use_project_participant) VALUES ('attachment-firm',?,'Firma',1)").run(ctx.project.id); ctx.save({ firms_mode: "attachment" }); let reads = 0;
    const data = { mode: "firms", projectId: ctx.project.id, orientation: "portrait", firms: [{ id: "one", name: "Erfasste Firma" }] };
    const service = ctx.makeService({ firmsData: async request => { reads++; assert.deepEqual(request,
      { mode: "firms", projectId: ctx.project.id, orientation: "portrait" }); return data; } });
    const doc = (await service.createPreNotificationPdf(ctx.payload())).document;
    assert.equal(reads, 1); assert.deepEqual(ctx.requests.map(value => value.request.mode), ["firms", "provider"]);
    assert.strictEqual(ctx.requests[0].options.preparedData, data);
    assert.deepEqual(doc.files.map(file => file.kind), ["main", "firms"]);
    for (const file of doc.files) assert.equal(digest(fs.readFileSync(inspectDocumentFile(ctx.rootFor(), file))), file.sha256);
    data.firms[0].name = "Spätere Firma";
    const attachment = fs.readFileSync(inspectDocumentFile(ctx.rootFor(), doc.files[1]), "utf8");
    assert.ok(attachment.includes("Erfasste Firma")); assert.ok(!attachment.includes("Spätere Firma"));
  }));
  await run("S5.3b2: empty prepared firm data refuses attachment output without a final record", () => withDocuments(async ctx => {
    ctx.setupComplete(); ctx.db.prepare("INSERT INTO project_firms (id,project_id,name,use_project_participant) VALUES ('attachment-firm',?,'Firma',1)").run(ctx.project.id); ctx.save({ firms_mode: "attachment" });
    const service = ctx.makeService({ firmsData: async () => ({ mode: "firms", projectId: ctx.project.id, firms: [] }) });
    await assert.rejects(service.createPreNotificationPdf(ctx.payload()), { code: "FIRMS_ATTACHMENT_EMPTY" });
    assert.equal(ctx.requests.length, 0); assert.equal(ctx.count(), 0);
  }));
  for (const replaced of [false, true]) {
    await run(`S5.3b2: main render failure ${replaced ? "preserves externally changed" : "removes only owned"} attachment bytes`, () => withDocuments(async ctx => {
      ctx.setupComplete(); ctx.db.prepare("INSERT INTO project_firms (id,project_id,name,use_project_participant) VALUES ('attachment-firm',?,'Firma',1)").run(ctx.project.id); ctx.save({ firms_mode: "attachment" });
      const foreign = Buffer.from("%PDF-1.4\nExternally replaced document\n%%EOF");
      const service = ctx.makeService({ firmsData: async () => ({ mode: "firms", projectId: ctx.project.id, orientation: "portrait", firms: [{ name: "Firma" }] }),
        print: async (request, options) => {
          if (request.mode === "firms") return ctx.print(request, options);
          if (replaced) fs.writeFileSync(ctx.generated[0].filePath, foreign);
          throw error("RENDER_FAILED");
        } });
      await assert.rejects(service.createPreNotificationPdf(ctx.payload()), { code: "RENDER_FAILED" });
      assert.equal(ctx.count(), 0); const filePath = ctx.generated[0].filePath;
      if (replaced) assert.deepEqual(fs.readFileSync(filePath), foreign); else assert.equal(fs.existsSync(filePath), false);
    }));
  }
  await run("S5.3b2: insertion failure rolls back SQLite and cleans only the newly produced file", () => withDocuments(async ctx => {
    ctx.setupComplete(); const prior = (await ctx.service.createPreNotificationPdf(ctx.payload())).document;
    const previousFile = inspectDocumentFile(ctx.rootFor(), prior.files[0]); const previousBytes = fs.readFileSync(previousFile);
    const service = ctx.makeService({ repo: { transaction: fn => ctx.documents.transaction(fn),
      insert: row => { ctx.documents.insert(row); throw error("INSERT_FAILED"); } } });
    await assert.rejects(service.createPreNotificationPdf(ctx.payload()), { code: "INSERT_FAILED" });
    assert.equal(ctx.count(), 1); assert.deepEqual(fs.readFileSync(previousFile), previousBytes);
    assert.equal(fs.existsSync(ctx.generated.at(-1).filePath), false);
  }));
  await run("S5.3b2: concurrent filename collision preserves the foreign file and rejects final insertion", () => withDocuments(async ctx => {
    ctx.setupComplete(); let foreignPath;
    const service = ctx.makeService({ print: async (request, options) => {
      const target = ctx.storage.resolve({ moduleId: "sigeko", projectId: ctx.project.id }).targets.Unterlagen;
      fs.mkdirSync(target, { recursive: true }); foreignPath = path.join(target, request.fileName); fs.writeFileSync(foreignPath, "foreign");
      return ctx.print(request, options);
    } });
    await assert.rejects(service.createPreNotificationPdf(ctx.payload()), { code: "EEXIST" });
    assert.equal(ctx.count(), 0); assert.equal(fs.readFileSync(foreignPath, "utf8"), "foreign");
  }));
  await run("S5.3b2: corrupt actual output is rejected and cannot become a successful document", () => withDocuments(async ctx => {
    ctx.setupComplete();
    const service = ctx.makeService({ print: async (...args) => { const result = await ctx.print(...args); fs.appendFileSync(result.filePath, "tampered"); return result; } });
    await assert.rejects(service.createPreNotificationPdf(ctx.payload()), { code: "SIGEKO_DOCUMENT_FILE_INVALID" });
    assert.equal(ctx.count(), 0); assert.ok(fs.readFileSync(ctx.generated[0].filePath, "utf8").endsWith("tampered"));
  }));
  await run("S5.3b2: provider contexts reject foreign identity and client snapshots and return isolated copies", () => withDocuments(async ctx => {
    const context = (await ctx.service.preparePreNotificationPdfEditor(ctx.payload())).context;
    const input = context.providerRequest.data, identity = ctx.identity(context);
    for (const changed of [{ ...identity, moduleId: "rechnung" }, { ...identity, projectId: ctx.other.id }, { ...identity, documentId: "foreign" }]) {
      assert.throws(() => ctx.service.resolveProviderDocument({ input, identity: changed }), { code: "PDF_PROVIDER_DATA_INVALID" });
    }
    assert.throws(() => ctx.service.resolveProviderDocument({ input: { ...input, snapshot: {} }, identity }), { code: "INVALID_INPUT" });
    const first = ctx.service.resolveProviderDocument({ input, identity }); first.snapshot.form.address.city = "Manipuliert";
    first.printRuntimeContext.settings.title = "Manipuliert";
    const second = ctx.service.resolveProviderDocument({ input, identity });
    assert.equal(second.snapshot.form.address.city, "Testort"); assert.equal(second.printRuntimeContext.settings.title, "Gemeinsamer Kopf");
  }));
  await run("S5.3b2: editor retains four contexts for at most 24 hours with no live fallback", () => withDocuments(async ctx => {
    const contexts = [];
    for (let index = 0; index < 5; index++) contexts.push((await ctx.service.preparePreNotificationPdfEditor(ctx.payload())).context);
    const resolve = context => ctx.service.resolveProviderDocument({ input: context.providerRequest.data, identity: ctx.identity(context) });
    assert.throws(() => resolve(contexts[0]), { code: "SIGEKO_DOCUMENT_CONTEXT_EXPIRED" });
    contexts.slice(1).forEach(context => assert.equal(resolve(context).snapshot.documentId, context.documentId));
    ctx.advance(24 * 60 * 60 * 1000);
    contexts.slice(1).forEach(context => assert.throws(() => resolve(context), { code: "SIGEKO_DOCUMENT_CONTEXT_EXPIRED" }));
    assert.equal(ctx.count(), 0); assert.equal(ctx.read().record, null);
  }));
  await run("S5.3b2: historical provider resolves stored snapshot after draft changes and rejects project substitution", () => withDocuments(async ctx => {
    ctx.setupComplete(); const doc = (await ctx.service.createPreNotificationPdf(ctx.payload())).document; ctx.save({ duration_months: 22 });
    const identity = { moduleId: "sigeko", projectId: ctx.project.id, documentId: doc.id };
    assert.equal(ctx.service.resolveProviderDocument({ input: {}, identity }).snapshot.form.durationMonths, 9);
    assert.throws(() => ctx.service.resolveProviderDocument({ input: {}, identity: { ...identity, projectId: ctx.other.id } }), { code: "SIGEKO_DOCUMENT_NOT_FOUND" });
    assert.throws(() => ctx.service.resolveProviderDocument({ input: { snapshot: {} }, identity }), { code: "INVALID_INPUT" });
  }));
  await run("S5.3b2: open validates project file kind current path size and hash before opening", () => withDocuments(async ctx => {
    ctx.setupComplete(); const doc = (await ctx.service.createPreNotificationPdf(ctx.payload())).document;
    const payload = { projectId: ctx.project.id, documentId: doc.id, kind: "main" };
    await assert.rejects(ctx.service.openPreNotificationDocumentFile({ ...payload, projectId: ctx.other.id }), { code: "SIGEKO_DOCUMENT_NOT_FOUND" });
    await assert.rejects(ctx.service.openPreNotificationDocumentFile({ ...payload, kind: "firms" }), { code: "SIGEKO_DOCUMENT_FILE_NOT_FOUND" });
    await assert.rejects(ctx.service.openPreNotificationDocumentFile({ ...payload, filePath: "/tmp/foreign.pdf" }), { code: "INVALID_INPUT" });
    await ctx.service.openPreNotificationDocumentFile(payload); assert.equal(ctx.opened.length, 1);
    const filePath = inspectDocumentFile(ctx.rootFor(), doc.files[0]); const original = fs.readFileSync(filePath);
    const corrupt = Buffer.from(original); corrupt[corrupt.length - 4] ^= 1; fs.writeFileSync(filePath, corrupt);
    await assert.rejects(ctx.service.openPreNotificationDocumentFile(payload), { code: "SIGEKO_DOCUMENT_FILE_INVALID" });
    fs.writeFileSync(filePath, original); ctx.moveStorage();
    await assert.rejects(ctx.service.openPreNotificationDocumentFile(payload), { code: "SIGEKO_DOCUMENT_FILE_INVALID" });
    assert.equal(ctx.opened.length, 1); assert.equal(ctx.count(), 1);
  }));
  await run("S5.3b2: row contract rejects identity traversal unsafe filenames and missing attachment references", () => withDocuments(async ctx => {
    ctx.setupComplete(); const doc = (await ctx.service.createPreNotificationPdf(ctx.payload())).document;
    const row = ctx.documents.get(ctx.project.id, doc.id);
    for (const patch of [{ id: "foreign" }, { project_id: ctx.other.id }, { document_type: "invoice" }, { snapshot_json: "{}" },
      { files_json: "[]" }, { created_at: "2026-02-30T13:00:00.000Z" }, { created_at: "2026-09-10T11:00:00.000Z" }]) {
      assert.throws(() => validateSigekoDocumentRow({ ...row, ...patch }, ctx.project.id), { code: "SIGEKO_DOCUMENT_INVALID" });
    }
    for (const name of ["../outside.pdf", "/tmp/outside.pdf", "SiGeKo/Unterlagen/../outside.pdf", "SiGeKo/Unterlagen/CON.pdf", "SiGeKo/Unterlagen/A?.pdf", "SiGeKo/Unterlagen/A .pdf"]) {
      assert.throws(() => validateDocumentFile({ ...doc.files[0], projectRelativePath: name }), { code: "SIGEKO_DOCUMENT_INVALID" });
    }
    const snapshot = JSON.parse(row.snapshot_json); snapshot.form.firmsMode = "attachment";
    assert.throws(() => validateSigekoDocumentRow({ ...row, snapshot_json: JSON.stringify(snapshot) }, ctx.project.id), { code: "SIGEKO_DOCUMENT_INVALID" });
    const buffer = Buffer.from("Not a PDF"); const filePath = path.join(ctx.rootFor(), "SiGeKo", "Unterlagen", "invalid.pdf"); fs.writeFileSync(filePath, buffer);
    assert.throws(() => inspectDocumentFile(ctx.rootFor(), { kind: "main", projectRelativePath: "SiGeKo/Unterlagen/invalid.pdf", sha256: digest(buffer), byteSize: buffer.length }), { code: "SIGEKO_DOCUMENT_FILE_INVALID" });
  }));
  await run("S5.3b2: final transaction rechecks the recorded bytes before inserting and preserves changed files", () => withDocuments(async ctx => {
    ctx.setupComplete();
    const service = ctx.makeService({ repo: {
      transaction: fn => { fs.appendFileSync(ctx.generated.at(-1).filePath, "changed-before-commit"); return ctx.documents.transaction(fn); },
      insert: row => ctx.documents.insert(row),
    } });
    await assert.rejects(service.createPreNotificationPdf(ctx.payload()), { code: "SIGEKO_DOCUMENT_FILE_INVALID" });
    assert.equal(ctx.count(), 0); assert.ok(fs.readFileSync(ctx.generated[0].filePath, "utf8").endsWith("changed-before-commit"));
  }));
  await run("S5.3b2: final transaction rechecks license after successful rendering and removes owned bytes", () => withDocuments(async ctx => {
    ctx.setupComplete();
    const service = ctx.makeService({ repo: {
      transaction: fn => { ctx.setLicensed(false); return ctx.documents.transaction(fn); }, insert: row => ctx.documents.insert(row),
    } });
    await assert.rejects(service.createPreNotificationPdf(ctx.payload()), { code: "FEATURE_NOT_ALLOWED:sigeko" });
    assert.equal(ctx.count(), 0); assert.equal(fs.existsSync(ctx.generated[0].filePath), false);
  }));
  await run("S5.3b2: project directory links cannot substitute identical historical PDF bytes", () => withDocuments(async ctx => {
    ctx.setupComplete(); const doc = (await ctx.service.createPreNotificationPdf(ctx.payload())).document;
    const root = ctx.rootFor(), target = path.join(root, "SiGeKo", "Unterlagen"), relocated = path.join(ctx.root, "relocated-documents");
    fs.renameSync(target, relocated); fs.symlinkSync(relocated, target, process.platform === "win32" ? "junction" : "dir");
    try {
      await assert.rejects(ctx.service.openPreNotificationDocumentFile({ projectId: ctx.project.id, documentId: doc.id, kind: "main" }), { code: "SIGEKO_DOCUMENT_FILE_INVALID" });
      await assert.rejects(ctx.service.createPreNotificationPdf(ctx.payload()), { code: "SIGEKO_DOCUMENT_FILE_INVALID" });
      assert.equal(ctx.opened.length, 0); assert.equal(ctx.count(), 1); assert.equal(fs.readdirSync(relocated).length, 1);
    } finally { fs.unlinkSync(target); fs.renameSync(relocated, target); }
  }));
  await run("S5.3b2: SQLite enforces unique document identity and cascades only the owning project", () => withDocuments(async ctx => {
    ctx.setupComplete(); const doc = (await ctx.service.createPreNotificationPdf(ctx.payload())).document;
    const row = ctx.documents.get(ctx.project.id, doc.id);
    assert.throws(() => ctx.documents.insert(row), /UNIQUE/);
    assert.equal(ctx.count(), 1); ctx.db.prepare("DELETE FROM projects WHERE id=?").run(ctx.other.id); assert.equal(ctx.count(), 1);
    ctx.db.prepare("DELETE FROM projects WHERE id=?").run(ctx.project.id); assert.equal(ctx.count(), 0);
    assert.deepEqual(ctx.db.pragma("foreign_key_check"), []);
  }));
}

module.exports = { runSigekoPreNotificationDocumentTests };
if (require.main === module) runSigekoPreNotificationDocumentTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
