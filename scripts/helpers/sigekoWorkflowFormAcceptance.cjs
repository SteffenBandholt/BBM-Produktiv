"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");

// TEST ONLY: real renderer/preload/Main/SQLite/PDF storage, controlled OS transport.
// This callback is not evidence of installed Outlook or an actual Outlook task.
function createWorkflowFormBoundary() {
  const calls = []; let rejectNext = false;
  return { calls, rejectNext() { rejectNext = true; }, options: {
    reminderMail: async (_event, payload) => {
      const attachments = payload.attachments.map(file => {
        const bytes = fs.readFileSync(file); assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-");
        return { name: path.basename(file), sha256: hash(bytes), temporaryPath: file };
      });
      calls.push({ recipients: payload.to, subject: payload.subject, body: payload.body, attachments, reminder: payload.reminder });
      if (rejectNext) { rejectNext = false; return { ok: false, error: "Kontrollierter Transportfehler der Formularabnahme." }; }
      return { ok: true, outcome: "draft-closed", transport: "outlook", reminder: "declined" };
    },
  } };
}
async function runWorkflowFormAcceptance({ boundary, database, projectId, firstDocument, secondDocument,
  output, report, win, evaluate, waitFor, vaClick, vaOpen }) {
  const prefix = "pdf.workflow.";
  const element = suffix => `s24.vaElement(${JSON.stringify(prefix + suffix)})`;
  const fill = values => evaluate(`(()=>{for(const [key,value] of Object.entries(${JSON.stringify(values)})){const e=s24.vaElement('pdf.workflow.'+key+'.input');if(e.type==='checkbox')e.checked=value;else e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}})()`);
  const read = documentId => evaluate(`bbmDb.sigekoGetPreNotificationCompletion(${JSON.stringify({ projectId, documentId })})`);
  const selected = async documentId => {
    await evaluate(`s24.screen.documentSelection.value=${JSON.stringify(documentId)};s24.screen.documentSelection.dispatchEvent(new Event('change',{bubbles:true}))`);
    await waitFor(`!s24.screen.workflowLoading && s24.screen.workflow?.documentId===${JSON.stringify(documentId)}`);
  };
  report.workflow = { transport: "controlled Main callback, not Outlook COM", actualOutlookVerified: false, geometry: {} };
  await selected(secondDocument.id);
  assert.equal((await read(secondDocument.id)).data.revision, null);
  const domainBefore = database.initDatabase().prepare("SELECT * FROM sigeko_pre_notifications WHERE project_id=?").get(projectId);
  await fill({ due: "2030-05-17" });
  boundary.rejectNext(); await vaClick(prefix + "open");
  await waitFor(`!s24.screen.busy && ${element("status")}.textContent.includes('Kontrollierter Transportfehler')`);
  assert.equal((await read(secondDocument.id)).data.returnedOn, null);
  await vaClick(prefix + "open");
  await waitFor(`!s24.screen.busy && ${element("status")}.textContent.includes('Keine Erinnerung')`);
  assert.equal(boundary.calls.length, 2);
  assert.deepEqual(boundary.calls[1].recipients, ["s55-owner@example.invalid"]);
  assert.deepEqual(boundary.calls[1].attachments.map(file => file.sha256), JSON.parse(secondDocument.files_json).map(file => file.sha256));
  assert.match(boundary.calls[1].body, /17\.05\.2030/); assert.match(boundary.calls[1].body, /\{\{BBM_RETURN_ADDRESS\}\}/);
  assert.equal(boundary.calls[1].reminder.subject, "VA schon zurück");
  await fill({ returned: true, returnedOn: "2026-09-11", authoritySent: true, authoritySentOn: "2026-09-12" });
  await vaClick(prefix + "save"); await waitFor(`!s24.screen.busy && ${element("status")}.textContent.includes('Angaben gespeichert')`);
  const completed = (await read(secondDocument.id)).data;
  assert.equal(completed.returnedOn, "2026-09-11"); assert.equal(completed.authoritySentOn, "2026-09-12");
  const row = database.initDatabase().prepare("SELECT * FROM sigeko_pre_notification_workflows WHERE document_id=?").get(secondDocument.id);
  assert.equal(row.signed_file_json, null); assert.equal(row.signature_opened_at, null); assert.equal(row.authority_opened_at, null);
  for (const call of boundary.calls) for (const file of call.attachments) assert.equal(fs.existsSync(file.temporaryPath), false);
  assert.deepEqual(database.initDatabase().prepare("SELECT * FROM sigeko_pre_notifications WHERE project_id=?").get(projectId), domainBefore);
  assert.deepEqual(database.initDatabase().prepare("SELECT * FROM sigeko_documents WHERE id=?").get(secondDocument.id), secondDocument);
  await selected(firstDocument.id); assert.equal((await read(firstDocument.id)).data.revision, null);
  database.closeDatabase(); database.initDatabase(); await vaOpen(projectId); await selected(secondDocument.id);
  assert.deepEqual((await read(secondDocument.id)).data, completed);
  report.checks.push("S5.5: actual form/preload/Main/SQLite flow opens a controlled draft with stored recipients and immutable PDF hashes; failure preserves data, closed draft changes no completion, manual dates need no return file and survive independent version selection plus database reopen");
  const metadata = await evaluate(`(async()=>{const {sigekoPreNotificationUiEditorContract:c}=await import('../../src/renderer/modules/sigeko/SigekoPreNotificationScreen.uiEditorContract.js');return {count:c.requiredSlots.length,targets:c.slots.filter(x=>x.slotId.includes('.pdf.workflow')).map(x=>{const e=s24.refs.getM80Ref(x.slotId).element;return {id:x.slotId,attributes:['data-ui-inspector-id','data-ui-editor-kind','data-ui-editor-label','data-ui-editor-parent','data-ui-editor-editable','data-ui-editor-ops'].map(a=>e.getAttribute(a)),parentMatches:s24.refs.getM80Ref(e.getAttribute('data-ui-editor-parent')).element.contains(e)};})};})()`);
  assert.equal(metadata.count, 133); assert.equal(metadata.targets.length, 22);
  for (const entry of metadata.targets) { assert.equal(entry.attributes[0], entry.id); assert.ok(entry.attributes.every(value => typeof value === "string" && value.length)); assert.equal(entry.attributes[4], "true"); assert.equal(entry.parentMatches, true); }
  assert.equal(await evaluate("s24.refs.validateM83ComponentReferences(['bbm.sigeko.preNotification']).ok"), true);
  report.workflow.mountedReferences = metadata.count; report.workflow.newTargets = metadata.targets;
  for (const [size, width, height] of [["wide", 1280, 950], ["narrow", 560, 950], ["low", 560, 480]]) {
    win.setSize(width, height); await waitFor(`innerWidth <= ${width} && innerWidth >= ${width - 80} && innerHeight <= ${height}`);
    const geometry = [];
    for (const key of ["editRecipients", "due.input", "open", "returned.input", "returnedOn.input", "authoritySent.input", "authoritySentOn.input", "save"]) {
      const rect = await evaluate(`s24.vaBounds(${JSON.stringify(prefix + key)})`);
      const viewport = await evaluate("({width:innerWidth,height:innerHeight})");
      assert.ok(rect.width > 0 && rect.height > 0 && rect.x >= -1 && rect.y >= -1 && rect.x + rect.width <= viewport.width + 1 && rect.y + rect.height <= viewport.height + 1, JSON.stringify({ size, key, rect, viewport }));
      geometry.push({ key, ...rect });
    }
    report.workflow.geometry[size] = geometry;
    fs.writeFileSync(path.join(output, `sigeko-workflow-${size}.png`), (await win.webContents.capturePage()).toPNG());
  }
  report.checks.push("S5.5: 133 component refs plus launcher, 22 workflow targets with exact metadata, real scrolling/geometry at 1280x950, 560x950 and 560x480");
  win.setSize(1280, 950); await selected(firstDocument.id);
}
module.exports = { createWorkflowFormBoundary, runWorkflowFormAcceptance };
