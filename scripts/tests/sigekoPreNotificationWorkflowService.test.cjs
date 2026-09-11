"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { withDocuments } = require("./sigekoPreNotificationDocuments.test.cjs");
const { createPreNotificationWorkflowService } = require("../../src/main/domain/sigeko/PreNotificationWorkflowService");
const { SigekoPreNotificationWorkflowsRepository } = require("../../src/main/db/sigekoPreNotificationWorkflowsRepo");
const { inspectDocumentFile } = require("../../src/main/domain/sigeko/preNotificationDocumentFiles");
const error = code => Object.assign(new Error(code), { code });
const opened = Object.freeze({ ok: true, outcome: "draft-opened", transport: "outlook" });

// Real SQLite, final snapshots, repositories and filesystem; only native dialog,
// preview and shared transport boundary are injected. This is not an Outlook COM proof.
function withWorkflow(check, { firms = false } = {}) {
  return withDocuments(async ctx => {
    const authoritySource = ctx.setupComplete();
    ctx.db.prepare("UPDATE firms SET email='kontakt@example.test' WHERE id='builder'").run();
    if (firms) {
      ctx.db.prepare("INSERT INTO project_firms (id,project_id,name,use_project_participant) VALUES ('workflow-firm',?,'Firma',1)").run(ctx.project.id);
      ctx.save({ firms_mode: "attachment" });
      ctx.makeService({ firmsData: async () => ({ mode: "firms", projectId: ctx.project.id, orientation: "portrait", firms: [{ name: "Historische Firma" }] }) });
    }
    const document = (await ctx.service.createPreNotificationPdf(ctx.payload())).document;
    const repo = new SigekoPreNotificationWorkflowsRepository({ dbProvider: ctx.database.initDatabase });
    const sourcePath = path.join(ctx.root, "signed-source.pdf"), signedBytes = Buffer.from("%PDF-1.4\nSigned return fixture\n%%EOF\n");
    fs.writeFileSync(sourcePath, signedBytes);
    const temp = path.join(ctx.root, "workflow-temp"); fs.mkdirSync(temp);
    const mails = [], previews = []; let serial = 0, time = Date.parse("2026-09-10T14:00:00.000Z"), choices = 0;
    const identity = { projectId: ctx.project.id, documentId: document.id };
    const read = () => repo.get(identity.projectId, identity.documentId);
    const payload = () => ({ ...identity, expectedRevision: read()?.revision ?? null });
    const mailPayload = (purpose = "signature") => ({ ...payload(), purpose, recipients: ["review@example.test"], subject: "Prüfen", body: "Bitte prüfen.", returnRequestedBy: null });
    const base = { repo, documents: ctx.documents, projects: ctx.repo, storage: ctx.storage, authorities: ctx.assignments, enforce: ctx.base.enforce,
      chooseFile: async () => { choices++; return { canceled: false, filePaths: [sourcePath] }; },
      tempDirectory: () => temp, uuid: () => `return-${++serial}`, clock: () => new Date(time++).toISOString(),
      open: async value => { previews.push(structuredClone(value)); },
      mail: async (event, value) => { assert.equal(event, null); mails.push({ payload: structuredClone(value), bytes: value.attachments.map(file => fs.readFileSync(file)) }); return opened; } };
    const makeService = options => createPreNotificationWorkflowService({ ...base, ...options });
    const service = makeService();
    await check({ ...ctx, document, authoritySource, workflows: repo, sourcePath, signedBytes, temp, mails, previews, identity,
      workflowRead: read, workflowPayload: payload, mailPayload, workflowBase: base, makeWorkflowService: makeService, workflowService: service,
      choiceCount: () => choices, workflowCount: () => ctx.db.prepare("SELECT count(*) AS n FROM sigeko_pre_notification_workflows").get().n,
      signedPath: () => inspectDocumentFile(ctx.rootFor(), JSON.parse(read().signed_file_json)),
      assertTempEmpty: () => assert.deepEqual(fs.readdirSync(temp), []) });
  });
}

async function runSigekoPreNotificationWorkflowServiceTests(run) {
  await run("S5.4 service: existing final PDF remains red and preparation changes neither workflow nor immutable final row", () => withWorkflow(async ctx => {
    const before = ctx.documents.get(ctx.project.id, ctx.document.id);
    assert.deepEqual(ctx.workflowService.getPreNotificationWorkflow(ctx.identity), { ...ctx.identity, revision: null, status: "red", signedFile: null,
      signedReceivedAt: null, signatureOpenedAt: null, authorityOpenedAt: null, returnRequestedBy: null, canWrite: true });
    const prepared = ctx.workflowService.preparePreNotificationMail({ ...ctx.identity, purpose: "signature", returnRequestedBy: "2028-02-29" });
    assert.deepEqual(prepared.recipients, ["kontakt@example.test"]); assert.match(prepared.subject, /Bauweg 12/); assert.match(prepared.body, /2028-02-29/);
    assert.deepEqual(prepared.attachments, ctx.document.files.map(file => ({ name: path.basename(file.projectRelativePath), byteSize: file.byteSize })));
    assert.equal(ctx.workflowCount(), 0); assert.equal(ctx.mails.length, 0); assert.deepEqual(ctx.documents.get(ctx.project.id, ctx.document.id), before);
    assert.throws(() => ctx.workflowService.preparePreNotificationMail({ ...ctx.identity, purpose: "authority", returnRequestedBy: null }), { code: "SIGEKO_SIGNED_RETURN_REQUIRED" });
  }));
  await run("S5.4 service: red orange green follow confirmed draft openings and preserve final-version bytes", () => withWorkflow(async ctx => {
    const documentBefore = ctx.documents.get(ctx.project.id, ctx.document.id);
    const first = await ctx.workflowService.openPreNotificationMailDraft({ ...ctx.mailPayload(), returnRequestedBy: "2027-03-04" });
    assert.equal(first.workflow.status, "orange"); assert.equal(first.workflow.revision, 1); assert.equal(first.workflow.returnRequestedBy, "2027-03-04");
    const imported = await ctx.workflowService.importPreNotificationSignedReturn(ctx.workflowPayload());
    assert.equal(imported.workflow.status, "orange"); assert.equal(imported.workflow.revision, 2); assert.deepEqual(fs.readFileSync(ctx.signedPath()), ctx.signedBytes);
    const authority = ctx.workflowService.preparePreNotificationMail({ ...ctx.identity, purpose: "authority", returnRequestedBy: null });
    assert.deepEqual(authority.recipients, ["behoerde@example.test"]); assert.equal(authority.returnRequestedBy, "2027-03-04");
    const second = await ctx.workflowService.openPreNotificationMailDraft(ctx.mailPayload("authority"));
    assert.equal(second.workflow.status, "green"); assert.equal(second.workflow.revision, 3); assert.ok(second.workflow.signatureOpenedAt); assert.ok(second.workflow.authorityOpenedAt);
    assert.equal(ctx.mails.length, 2); assert.deepEqual(ctx.documents.get(ctx.project.id, ctx.document.id), documentBefore); ctx.assertTempEmpty();
  }));
  await run("S5.4 service: direct signed return remains red until authority draft and replacement clears green without deleting old bytes", () => withWorkflow(async ctx => {
    const first = await ctx.workflowService.importPreNotificationSignedReturn(ctx.workflowPayload());
    assert.equal(first.workflow.status, "red"); assert.equal(first.workflow.signatureOpenedAt, null);
    const oldPath = ctx.signedPath(), oldBytes = fs.readFileSync(oldPath);
    await ctx.workflowService.openPreNotificationMailDraft(ctx.mailPayload("authority"));
    fs.writeFileSync(ctx.sourcePath, "%PDF-1.4\nReplacement return\n%%EOF");
    const replaced = await ctx.workflowService.importPreNotificationSignedReturn(ctx.workflowPayload());
    assert.equal(replaced.workflow.status, "red"); assert.equal(replaced.workflow.authorityOpenedAt, null); assert.notEqual(ctx.signedPath(), oldPath);
    assert.deepEqual(fs.readFileSync(oldPath), oldBytes); assert.deepEqual(fs.readFileSync(ctx.signedPath()), fs.readFileSync(ctx.sourcePath));
  }));
  await run("S5.4 service: new final version has independent red workflow and cannot receive another version's signed file", () => withWorkflow(async ctx => {
    await ctx.workflowService.importPreNotificationSignedReturn(ctx.workflowPayload());
    await ctx.workflowService.openPreNotificationMailDraft(ctx.mailPayload("authority"));
    ctx.save({ duration_months: 18 }); const second = (await ctx.service.createPreNotificationPdf(ctx.payload())).document;
    const identity = { ...ctx.identity, documentId: second.id };
    assert.equal(ctx.workflowService.getPreNotificationWorkflow(identity).status, "red");
    await assert.rejects(ctx.workflowService.openPreNotificationMailDraft({ ...ctx.mailPayload("authority"), ...identity, expectedRevision: null }), { code: "SIGEKO_SIGNED_RETURN_REQUIRED" });
    assert.equal(ctx.workflowCount(), 1); assert.equal(ctx.workflowService.getPreNotificationWorkflow(ctx.identity).status, "green");
  }));
  await run("S5.4 service: mail stages exact historical original or signed PDF plus the unchanged firms attachment", () => withWorkflow(async ctx => {
    const originals = ctx.document.files.map(file => fs.readFileSync(inspectDocumentFile(ctx.rootFor(), file)));
    ctx.db.prepare("UPDATE project_firms SET name='Changed after final' WHERE id='workflow-firm'").run();
    await ctx.workflowService.openPreNotificationMailDraft({ ...ctx.mailPayload(), recipients: ["EDIT@example.test", "edit@example.test", "other@example.test"], subject: "  Geprüfter Betreff  ", body: "Freier Text\nZweite Zeile" });
    await ctx.workflowService.importPreNotificationSignedReturn(ctx.workflowPayload());
    await ctx.workflowService.openPreNotificationMailDraft(ctx.mailPayload("authority"));
    assert.deepEqual(ctx.mails[0].bytes, originals); assert.deepEqual(ctx.mails[1].bytes, [ctx.signedBytes, originals[1]]);
    assert.deepEqual(ctx.mails[0].payload.to, ["edit@example.test", "other@example.test"]); assert.equal(ctx.mails[0].payload.subject, "Geprüfter Betreff");
    assert.equal(ctx.mails[0].payload.body, "Freier Text\nZweite Zeile");
    for (const call of ctx.mails) { assert.equal(call.payload.moduleId, "sigeko"); assert.equal(call.payload.attachments.length, 2);
      for (const file of call.payload.attachments) { assert.ok(file.startsWith(ctx.temp + path.sep)); assert.equal(fs.existsSync(file), false); } }
    ctx.assertTempEmpty();
  }, { firms: true }));
  await run("S5.4 service: canceled native import is a true no-op including existing return", () => withWorkflow(async ctx => {
    await ctx.workflowService.importPreNotificationSignedReturn(ctx.workflowPayload()); const before = ctx.workflowRead(), oldPath = ctx.signedPath();
    const service = ctx.makeWorkflowService({ chooseFile: async () => ({ canceled: true, filePaths: [] }) });
    assert.deepEqual(await service.importPreNotificationSignedReturn(ctx.workflowPayload()), { canceled: true });
    assert.deepEqual(ctx.workflowRead(), before); assert.deepEqual(fs.readFileSync(oldPath), ctx.signedBytes);
  }));
  for (const invalid of ["extension", "header", "directory", "multiple", "relative", "symlink"]) {
    await run(`S5.4 service: ${invalid} native selection cannot create a signed-return record`, () => withWorkflow(async ctx => {
      let selected = ctx.sourcePath;
      if (invalid === "extension") { selected = path.join(ctx.root, "source.txt"); fs.writeFileSync(selected, ctx.signedBytes); }
      if (invalid === "header") fs.writeFileSync(selected, "not a PDF");
      if (invalid === "directory") { selected = path.join(ctx.root, "directory.pdf"); fs.mkdirSync(selected); }
      if (invalid === "relative") selected = "relative.pdf";
      if (invalid === "symlink") { selected = path.join(ctx.root, "link.pdf"); fs.symlinkSync(ctx.sourcePath, selected, "file"); }
      const service = ctx.makeWorkflowService({ chooseFile: async () => ({ canceled: false, filePaths: invalid === "multiple" ? [selected, selected] : [selected] }) });
      await assert.rejects(service.importPreNotificationSignedReturn(ctx.workflowPayload()), { code: "SIGEKO_DOCUMENT_FILE_INVALID" });
      assert.equal(ctx.workflowCount(), 0); assert.equal(fs.readdirSync(path.join(ctx.rootFor(), "SiGeKo", "Unterlagen")).length, 1);
    }));
  }
  await run("S5.4 service: filename collision never overwrites a foreign file", () => withWorkflow(async ctx => {
    const foreignPath = path.join(ctx.rootFor(), "SiGeKo", "Unterlagen", "Vorankuendigung-Ruecklauf-collision.pdf"); fs.writeFileSync(foreignPath, "foreign");
    const service = ctx.makeWorkflowService({ uuid: () => "collision" });
    await assert.rejects(service.importPreNotificationSignedReturn(ctx.workflowPayload()), { code: "EEXIST" });
    assert.equal(fs.readFileSync(foreignPath, "utf8"), "foreign"); assert.equal(ctx.workflowCount(), 0);
  }));
  for (const replaced of [false, true]) {
    await run(`S5.4 service: failed import transaction ${replaced ? "preserves externally replaced" : "removes owned"} return bytes and rolls back SQL`, () => withWorkflow(async ctx => {
      let target;
      const service = ctx.makeWorkflowService({ repo: { get: (...args) => ctx.workflows.get(...args), transaction: fn => ctx.workflows.transaction(fn), save: (...args) => {
        const result = ctx.workflows.save(...args); target = path.join(ctx.rootFor(), JSON.parse(result.signed_file_json).projectRelativePath);
        if (replaced) fs.writeFileSync(target, "%PDF-1.4\nForeign replacement\n%%EOF"); throw error("SAVE_FAILED");
      } } });
      await assert.rejects(service.importPreNotificationSignedReturn(ctx.workflowPayload()), { code: "SAVE_FAILED" });
      assert.equal(ctx.workflowCount(), 0); assert.equal(fs.existsSync(target), replaced); if (replaced) assert.match(fs.readFileSync(target, "utf8"), /Foreign replacement/);
    }));
  }
  await run("S5.4 service: a substituted project documents directory cannot redirect import writes", () => withWorkflow(async ctx => {
    const target = path.join(ctx.rootFor(), "SiGeKo", "Unterlagen"), moved = path.join(ctx.root, "moved-underlagen");
    fs.renameSync(target, moved); fs.symlinkSync(moved, target, process.platform === "win32" ? "junction" : "dir");
    try { await assert.rejects(ctx.workflowService.importPreNotificationSignedReturn(ctx.workflowPayload()), { code: "SIGEKO_DOCUMENT_FILE_INVALID" });
      assert.equal(ctx.workflowCount(), 0); assert.equal(fs.readdirSync(moved).length, 1);
    } finally { fs.unlinkSync(target); fs.renameSync(moved, target); }
  }));
  await run("S5.4 service: signed opening verifies hash and ownership and archived records stay readable but cannot be changed", () => withWorkflow(async ctx => {
    await ctx.workflowService.importPreNotificationSignedReturn(ctx.workflowPayload());
    await assert.rejects(ctx.workflowService.openPreNotificationSignedReturn({ ...ctx.identity, projectId: ctx.other.id }), { code: "SIGEKO_DOCUMENT_NOT_FOUND" });
    ctx.db.prepare("UPDATE projects SET archived_at=? WHERE id=?").run("2026-09-10", ctx.project.id);
    assert.equal(ctx.workflowService.getPreNotificationWorkflow(ctx.identity).canWrite, false);
    await ctx.workflowService.openPreNotificationSignedReturn(ctx.identity); assert.equal(ctx.previews.length, 1);
    for (const [method, payload] of [["importPreNotificationSignedReturn", ctx.workflowPayload()], ["openPreNotificationMailDraft", ctx.mailPayload()]]) {
      await assert.rejects(ctx.workflowService[method](payload), { code: "PROJECT_ARCHIVED" });
    }
    assert.throws(() => ctx.workflowService.preparePreNotificationMail({ ...ctx.identity, purpose: "signature", returnRequestedBy: null }), { code: "PROJECT_ARCHIVED" });
    const filePath = ctx.signedPath(); const bytes = fs.readFileSync(filePath); bytes[bytes.length - 2] ^= 1; fs.writeFileSync(filePath, bytes);
    await assert.rejects(ctx.workflowService.openPreNotificationSignedReturn(ctx.identity), { code: "SIGEKO_DOCUMENT_FILE_INVALID" }); assert.equal(ctx.previews.length, 1);
  }));
  await run("S5.4 service: revoked license blocks reads dialog mail preparation preview and draft opening", () => withWorkflow(async ctx => {
    await ctx.workflowService.importPreNotificationSignedReturn(ctx.workflowPayload()); ctx.setLicensed(false);
    assert.throws(() => ctx.workflowService.getPreNotificationWorkflow(ctx.identity), { code: "FEATURE_NOT_ALLOWED:sigeko" });
    assert.throws(() => ctx.workflowService.preparePreNotificationMail({ ...ctx.identity, purpose: "signature", returnRequestedBy: null }), { code: "FEATURE_NOT_ALLOWED:sigeko" });
    for (const [method, payload] of [["importPreNotificationSignedReturn", ctx.workflowPayload()], ["openPreNotificationSignedReturn", ctx.identity], ["openPreNotificationMailDraft", ctx.mailPayload()]]) {
      await assert.rejects(ctx.workflowService[method](payload), { code: "FEATURE_NOT_ALLOWED:sigeko" });
    }
    assert.equal(ctx.choiceCount(), 1); assert.equal(ctx.mails.length, 0); assert.equal(ctx.previews.length, 0);
  }));
  await run("S5.4 service: exact request contracts reject renderer file paths attachments forged status and malformed mail fields", () => withWorkflow(async ctx => {
    for (const extra of [{ filePath: ctx.sourcePath }, { attachments: [ctx.sourcePath] }, { snapshot: {} }, { outcome: "draft-opened" }, { status: "green" }]) {
      await assert.rejects(ctx.workflowService.openPreNotificationMailDraft({ ...ctx.mailPayload(), ...extra }), { code: "INVALID_INPUT" });
      await assert.rejects(ctx.workflowService.importPreNotificationSignedReturn({ ...ctx.workflowPayload(), ...extra }), { code: "INVALID_INPUT" });
      assert.throws(() => ctx.workflowService.getPreNotificationWorkflow({ ...ctx.identity, ...extra }), { code: "INVALID_INPUT" });
    }
    for (const patch of [{ recipients: [] }, { recipients: ["bad"] }, { recipients: ["a@example.test;other@example.test"] }, { subject: "x\nBcc: a@example.test" },
      { subject: " " }, { body: "x\0" }, { purpose: "send" }, { returnRequestedBy: "2027-02-29" }, { expectedRevision: 0 }]) {
      await assert.rejects(ctx.workflowService.openPreNotificationMailDraft({ ...ctx.mailPayload(), ...patch }), { code: "INVALID_INPUT" });
    }
    assert.equal(ctx.workflowCount(), 0); assert.equal(ctx.choiceCount(), 0); assert.equal(ctx.mails.length, 0); ctx.assertTempEmpty();
  }));
  await run("S5.4 service: stale requests cannot start a dialog or external draft", () => withWorkflow(async ctx => {
    const stale = ctx.workflowPayload(), staleMail = ctx.mailPayload(); await ctx.workflowService.importPreNotificationSignedReturn(stale);
    await assert.rejects(ctx.workflowService.importPreNotificationSignedReturn(stale), { code: "PRE_NOTIFICATION_WORKFLOW_CONFLICT" });
    await assert.rejects(ctx.workflowService.openPreNotificationMailDraft(staleMail), { code: "PRE_NOTIFICATION_WORKFLOW_CONFLICT" });
    assert.equal(ctx.choiceCount(), 1); assert.equal(ctx.mails.length, 0);
  }));
  for (const change of ["license", "archive", "project", "storage", "revision"]) {
    await run(`S5.4 service: ${change} change while native dialog is open prevents file and state creation`, () => withWorkflow(async ctx => {
      const service = ctx.makeWorkflowService({ chooseFile: async () => {
        if (change === "license") ctx.setLicensed(false);
        if (change === "archive") ctx.db.prepare("UPDATE projects SET archived_at=? WHERE id=?").run("2026-09-10", ctx.project.id);
        if (change === "project") ctx.repo.updateProject({ id: ctx.project.id, name: "Changed" });
        if (change === "storage") ctx.moveStorage();
        if (change === "revision") await ctx.workflowService.openPreNotificationMailDraft(ctx.mailPayload());
        return { canceled: false, filePaths: [ctx.sourcePath] };
      } });
      const code = ({ license: "FEATURE_NOT_ALLOWED:sigeko", archive: "PROJECT_ARCHIVED", project: "PRE_NOTIFICATION_SOURCE_CHANGED", storage: "PRE_NOTIFICATION_SOURCE_CHANGED", revision: "PRE_NOTIFICATION_WORKFLOW_CONFLICT" })[change];
      await assert.rejects(service.importPreNotificationSignedReturn(ctx.workflowPayload()), { code });
      assert.equal(ctx.workflowRead()?.signed_file_json ?? null, null); ctx.assertTempEmpty();
    }));
  }
  for (const result of [null, { ok: true }, { ok: true, outcome: "sent", transport: "outlook" }, { ok: true, outcome: "draft-opened", transport: "mailto" }, { ok: false, code: "OUTLOOK_UNAVAILABLE", error: "Outlook unavailable" }]) {
    await run(`S5.4 service: unconfirmed transport ${JSON.stringify(result)} never changes workflow`, () => withWorkflow(async ctx => {
      const service = ctx.makeWorkflowService({ mail: async () => result });
      await assert.rejects(service.openPreNotificationMailDraft(ctx.mailPayload()), { code: result?.code || "MAIL_DRAFT_NOT_CONFIRMED" });
      assert.equal(ctx.workflowCount(), 0); ctx.assertTempEmpty();
    }));
  }
  await run("S5.4 service: transport rejection preserves prior workflow and removes only temporary copies", () => withWorkflow(async ctx => {
    await ctx.workflowService.importPreNotificationSignedReturn(ctx.workflowPayload()); const before = ctx.workflowRead();
    const service = ctx.makeWorkflowService({ mail: async () => { throw error("OUTLOOK_FAILED"); } });
    await assert.rejects(service.openPreNotificationMailDraft(ctx.mailPayload("authority")), { code: "OUTLOOK_FAILED" });
    assert.deepEqual(ctx.workflowRead(), before); assert.deepEqual(fs.readFileSync(ctx.signedPath()), ctx.signedBytes); ctx.assertTempEmpty();
  }));
  await run("S5.4 service: tampered original and revoked authority stop before Outlook is called", () => withWorkflow(async ctx => {
    await ctx.workflowService.importPreNotificationSignedReturn(ctx.workflowPayload());
    const originalPath = inspectDocumentFile(ctx.rootFor(), ctx.document.files[0]), bytes = fs.readFileSync(originalPath);
    fs.appendFileSync(originalPath, "changed");
    await assert.rejects(ctx.workflowService.openPreNotificationMailDraft(ctx.mailPayload()), { code: "SIGEKO_DOCUMENT_FILE_INVALID" });
    fs.writeFileSync(originalPath, bytes);
    ctx.authorities.saveAuthorityRecord({ id: ctx.authoritySource.id, expectedRevision: ctx.authoritySource.revision, patch: { email: "new@example.test" } });
    await assert.rejects(ctx.workflowService.openPreNotificationMailDraft(ctx.mailPayload("authority")), { code: "AUTHORITY_NOT_READY" });
    assert.equal(ctx.mails.length, 0); assert.equal(ctx.workflowRead().authority_opened_at, null); ctx.assertTempEmpty();
  }));
  await run("S5.4 service: project changed during staging is rejected before the external draft opens", () => withWorkflow(async ctx => {
    const service = ctx.makeWorkflowService({ tempDirectory: () => {
      ctx.repo.updateProject({ id: ctx.project.id, name: "Changed before Outlook" }); return ctx.temp;
    } });
    await assert.rejects(service.openPreNotificationMailDraft(ctx.mailPayload()), { code: "PRE_NOTIFICATION_SOURCE_CHANGED" });
    assert.equal(ctx.mails.length, 0); assert.equal(ctx.workflowCount(), 0); ctx.assertTempEmpty();
  }));
  await run("S5.4 service: revoked license at import commit removes newly copied bytes and retains the immutable original", () => withWorkflow(async ctx => {
    const target = path.join(ctx.rootFor(), "SiGeKo", "Unterlagen"), filesBefore = fs.readdirSync(target);
    const service = ctx.makeWorkflowService({ repo: { get: (...args) => ctx.workflows.get(...args), save: (...args) => ctx.workflows.save(...args),
      transaction: fn => { ctx.setLicensed(false); return ctx.workflows.transaction(fn); } } });
    await assert.rejects(service.importPreNotificationSignedReturn(ctx.workflowPayload()), { code: "FEATURE_NOT_ALLOWED:sigeko" });
    assert.equal(ctx.workflowCount(), 0); assert.deepEqual(fs.readdirSync(target), filesBefore);
    inspectDocumentFile(ctx.rootFor(), ctx.document.files[0]);
  }));
  for (const change of ["license", "archive", "project", "storage", "authority", "original", "temporary", "revision", "save"]) {
    await run(`S5.4 service: ${change} change after confirmed external opening reports unsaved state explicitly`, () => withWorkflow(async ctx => {
      await ctx.workflowService.importPreNotificationSignedReturn(ctx.workflowPayload()); const before = ctx.workflowRead();
      const service = ctx.makeWorkflowService({ mail: async (_event, payload) => {
        if (change === "license") ctx.setLicensed(false);
        if (change === "archive") ctx.db.prepare("UPDATE projects SET archived_at=? WHERE id=?").run("2026-09-10", ctx.project.id);
        if (change === "project") ctx.repo.updateProject({ id: ctx.project.id, name: "Changed during Outlook" });
        if (change === "storage") ctx.moveStorage();
        if (change === "authority") ctx.authorities.saveAuthorityRecord({ id: ctx.authoritySource.id, expectedRevision: ctx.authoritySource.revision, patch: { organization: "Other authority" } });
        if (change === "original") fs.appendFileSync(ctx.signedPath(), "changed");
        if (change === "temporary") fs.appendFileSync(payload.attachments[0], "changed");
        if (change === "revision") await ctx.workflowService.openPreNotificationMailDraft(ctx.mailPayload());
        return opened;
      }, ...(change === "save" ? { repo: { get: (...args) => ctx.workflows.get(...args), transaction: fn => ctx.workflows.transaction(fn), save: (...args) => { ctx.workflows.save(...args); throw error("SAVE_FAILED"); } } } : {}) });
      await assert.rejects(service.openPreNotificationMailDraft(ctx.mailPayload("authority")), { code: "SIGEKO_MAIL_OPENED_STATE_UNSAVED" });
      assert.equal(ctx.workflowRead().authority_opened_at, null);
      if (change !== "revision") assert.deepEqual(ctx.workflowRead(), before); else assert.equal(ctx.workflowRead().revision, before.revision + 1);
      ctx.assertTempEmpty();
    }));
  }
  await run("S5.4 service: pending native dialog serializes all project writes and releases the lock after failure", () => withWorkflow(async ctx => {
    let release, entered; const ready = new Promise(resolve => { entered = resolve; }), paused = new Promise(resolve => { release = resolve; });
    const service = ctx.makeWorkflowService({ chooseFile: async () => { entered(); await paused; throw error("DIALOG_FAILED"); } });
    const pending = service.importPreNotificationSignedReturn(ctx.workflowPayload()); await ready;
    await assert.rejects(service.importPreNotificationSignedReturn(ctx.workflowPayload()), { code: "SIGEKO_WORKFLOW_BUSY" });
    await assert.rejects(service.openPreNotificationMailDraft(ctx.mailPayload()), { code: "SIGEKO_WORKFLOW_BUSY" });
    release(); await assert.rejects(pending, { code: "DIALOG_FAILED" });
    const result = await service.openPreNotificationMailDraft(ctx.mailPayload()); assert.equal(result.workflow.status, "orange"); ctx.assertTempEmpty();
  }));
}
module.exports = { runSigekoPreNotificationWorkflowServiceTests, withWorkflow };
if (require.main === module) runSigekoPreNotificationWorkflowServiceTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
