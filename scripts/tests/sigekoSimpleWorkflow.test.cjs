"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { withWorkflow } = require("./sigekoPreNotificationWorkflowService.test.cjs");
const { ensureSigekoSchema } = require("../../src/main/db/sigekoSchema");
const { VA_RECIPIENTS_KEY } = require("../../src/shared/sigeko/preNotificationRecipients.cjs");
const due = "2030-05-17";
const completion = (ctx, patch = {}) => ({ ...ctx.workflowPayload(), returnRequestedBy: due, returnedOn: null, authoritySentOn: null, ...patch });
const mail = ctx => ({ ...ctx.workflowPayload(), returnRequestedBy: due });
const recipients = ctx => ctx.workflowService.savePreNotificationRecipients({ projectId: ctx.project.id, expectedRevision: 0, recipients: ["owner@example.test", "architect@example.test"] });
async function runSigekoSimpleWorkflowTests(run) {
  await run("S5.5: manual check dates persist without importing files or changing historical handoffs", () => withWorkflow(async ctx => {
    const result = ctx.workflowService.savePreNotificationCompletion(completion(ctx, { returnedOn: "2026-09-11", authoritySentOn: "2026-09-12" }));
    assert.equal(result.returnedOn, "2026-09-11"); assert.equal(result.authoritySentOn, "2026-09-12");
    const row = ctx.workflowRead(); assert.equal(row.signed_file_json, null); assert.equal(row.signature_opened_at, null); assert.equal(row.authority_opened_at, null);
    ctx.database.closeDatabase(); ctx.database.initDatabase();
    assert.deepEqual(ctx.workflowService.getPreNotificationCompletion(ctx.identity), result);
    const cleared = ctx.workflowService.savePreNotificationCompletion(completion(ctx)); assert.equal(cleared.returnedOn, null); assert.equal(cleared.authoritySentOn, null);
  }));
  await run("S5.5: additive migration preserves historical signed files and never infers manual dates", () => withWorkflow(async ctx => {
    await ctx.workflowService.importPreNotificationSignedReturn(ctx.workflowPayload());
    const before = ctx.workflowRead(), bytes = fs.readFileSync(ctx.signedPath());
    ctx.db.exec("ALTER TABLE sigeko_pre_notification_workflows DROP COLUMN returned_on; ALTER TABLE sigeko_pre_notification_workflows DROP COLUMN authority_sent_on;");
    ensureSigekoSchema(ctx.db); ensureSigekoSchema(ctx.db);
    assert.deepEqual(ctx.workflowRead(), before); assert.deepEqual(fs.readFileSync(ctx.signedPath()), bytes);
    assert.equal(ctx.workflowService.getPreNotificationCompletion(ctx.identity).returnedOn, null);
  }));
  await run("S5.5: completion rejects bad dates, stale revision, archived and foreign projects", () => withWorkflow(async ctx => {
    for (const value of ["2030-02-30", "0000-01-01", "2030-5-17", "", true]) assert.throws(() => ctx.workflowService.savePreNotificationCompletion(completion(ctx, { returnedOn: value })), { code: "INVALID_INPUT" });
    const first = completion(ctx); ctx.workflowService.savePreNotificationCompletion(first);
    assert.throws(() => ctx.workflowService.savePreNotificationCompletion(first), { code: "PRE_NOTIFICATION_WORKFLOW_CONFLICT" });
    assert.throws(() => ctx.workflowService.savePreNotificationCompletion({ ...completion(ctx), projectId: "absent" }), { code: "PROJECT_NOT_FOUND" });
    ctx.db.prepare("UPDATE projects SET archived_at=? WHERE id=?").run("2026-09-11",ctx.project.id);
    assert.throws(() => ctx.workflowService.savePreNotificationCompletion(completion(ctx)), { code: "PROJECT_ARCHIVED" });
  }));
  await run("S5.5: project recipients accept free addresses, deduplicate, clear, reopen and reject stale changes", () => withWorkflow(async ctx => {
    assert.deepEqual(ctx.workflowService.getPreNotificationRecipients({ projectId: ctx.project.id }), { projectId: ctx.project.id, revision: 0, recipients: [] });
    const saved = ctx.workflowService.savePreNotificationRecipients({ projectId: ctx.project.id, expectedRevision: 0, recipients: ["Owner@example.test", "owner@example.test", "other@example.test"] });
    assert.deepEqual(saved.recipients, ["owner@example.test", "other@example.test"]);
    ctx.database.closeDatabase(); ctx.database.initDatabase();
    assert.deepEqual(ctx.workflowService.getPreNotificationRecipients({ projectId: ctx.project.id }), saved);
    assert.throws(() => recipients(ctx), { code: "PRE_NOTIFICATION_WORKFLOW_CONFLICT" });
    for (const bad of [["invalid"], ["x@example.test\nBcc:y@example.test"], "x@example.test"]) assert.throws(() => ctx.workflowService.savePreNotificationRecipients({ projectId: ctx.project.id, expectedRevision: 1, recipients: bad }), { code: "INVALID_INPUT" });
    assert.deepEqual(ctx.workflowService.savePreNotificationRecipients({ projectId: ctx.project.id, expectedRevision: 1, recipients: [] }).recipients, []);
    assert.equal(ctx.database.initDatabase().prepare("SELECT count(*) n FROM project_settings WHERE key=?").get(VA_RECIPIENTS_KEY).n, 1);
  }));
  await run("S5.5: direct mail uses persisted recipients and original PDFs, closed draft never marks completion", () => withWorkflow(async ctx => {
    recipients(ctx); let called = 0;
    const before = ctx.documents.get(ctx.project.id, ctx.document.id);
    const service = ctx.makeWorkflowService({ reminderMail: async (_event, payload) => {
      called++; assert.deepEqual(payload.to, ["owner@example.test", "architect@example.test"]);
      assert.equal(payload.returnRequestedBy, due); assert.equal(payload.reminder.subject, "VA schon zurück");
      assert.match(payload.body, /17\.05\.2030/); assert.match(payload.body, /\{\{BBM_RETURN_ADDRESS\}\}/);
      assert.equal(payload.attachments.length, 2); for (const file of payload.attachments) assert.equal(fs.readFileSync(file).subarray(0,5).toString(), "%PDF-");
      return { ok: true, outcome: "draft-closed", transport: "outlook", reminder: "declined" };
    } });
    const result = await service.openSimplePreNotificationMail(mail(ctx));
    assert.equal(called, 1); assert.equal(result.reminder, "declined"); assert.equal(result.completion.returnedOn, null); assert.equal(result.completion.authoritySentOn, null);
    assert.equal(ctx.workflowRead().signature_opened_at, null); assert.equal(ctx.workflowRead().authority_opened_at, null);
    assert.deepEqual(ctx.documents.get(ctx.project.id, ctx.document.id), before); ctx.assertTempEmpty();
  }, { firms: true }));
  await run("S5.5: no recipients or return date cannot open Outlook; failures retain manual dates", () => withWorkflow(async ctx => {
    let called=0; const service=ctx.makeWorkflowService({reminderMail:async()=>{called++;return {ok:false,error:"Outlook fehlt"};}});
    await assert.rejects(service.openSimplePreNotificationMail(mail(ctx)), {code:"INVALID_INPUT"}); recipients(ctx);
    await assert.rejects(service.openSimplePreNotificationMail({...mail(ctx),returnRequestedBy:null}),{code:"INVALID_INPUT"});
    ctx.workflowService.savePreNotificationCompletion(completion(ctx,{returnedOn:"2026-09-11"}));
    await assert.rejects(service.openSimplePreNotificationMail(mail(ctx)),/Outlook fehlt/);assert.equal(called,1);
    assert.equal(ctx.workflowRead().returned_on,"2026-09-11");assert.equal(ctx.workflowRead().authority_sent_on,null);ctx.assertTempEmpty();
  }));
  await run("S5.5: confirmed external result survives project deletion while Outlook is open", () => withWorkflow(async ctx => {
    recipients(ctx);
    const service=ctx.makeWorkflowService({reminderMail:async()=>{ctx.db.prepare("DELETE FROM projects WHERE id=?").run(ctx.project.id);return {ok:true,outcome:"draft-closed",transport:"outlook",reminder:"created"};}});
    const result=await service.openSimplePreNotificationMail(mail(ctx));assert.equal(result.reminder,"created");assert.equal(result.completion,null);assert.match(result.refreshError,/Projekt/);ctx.assertTempEmpty();
  }));
}
module.exports = { runSigekoSimpleWorkflowTests };
if (require.main === module) runSigekoSimpleWorkflowTests(async (name, check) => { await check(); console.log("PASS", name); }).catch(error => { console.error(error); process.exitCode=1; });
