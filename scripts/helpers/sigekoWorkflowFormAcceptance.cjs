"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");

// TEST ONLY: production workflow/SQLite/storage/IPC remain intact. These two
// OS boundaries are controlled in unattended Windows/Linux form acceptance.
// A successful callback below is explicitly NOT evidence of installed Outlook.
function createWorkflowFormBoundary() {
  const choices = [], calls = [];
  let rejectNext = false;
  return {
    choices, calls,
    rejectNext() { rejectNext = true; },
    options: {
      chooseFile: async () => { assert.ok(choices.length, "S5.4 picker must have an explicit fixture answer"); return choices.shift(); },
      mail: async (_event, payload) => {
        const attachments = payload.attachments.map(file => { const bytes = fs.readFileSync(file);
          assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-");
          return { name: path.basename(file), sha256: hash(bytes), byteSize: bytes.length, temporaryPath: file }; });
        calls.push({ moduleId: payload.moduleId, recipients: payload.to, subject: payload.subject, body: payload.body, attachments });
        if (rejectNext) { rejectNext = false; return { ok: false, code: "ACCEPTANCE_TRANSPORT_REJECTED", error: "Kontrollierter Transportfehler der Formularabnahme." }; }
        return { ok: true, outcome: "draft-opened", transport: "outlook" };
      },
    },
  };
}

async function runWorkflowFormAcceptance({ boundary, database, projectId, firstDocument, secondDocument, rootPath,
  profile, output, report, win, evaluate, waitFor, vaClick, vaOpen, closePreview }) {
  const prefix = "pdf.workflow.";
  const element = suffix => `s24.vaElement(${JSON.stringify(prefix + suffix)})`;
  const text = suffix => evaluate(`${element(suffix)}.textContent`);
  const fill = values => evaluate(`(()=>{for(const [key,value] of Object.entries(${JSON.stringify(values)})){const e=s24.vaElement('pdf.workflow.'+key);e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}})()`);
  const rows = () => database.initDatabase().prepare("SELECT * FROM sigeko_pre_notification_workflows WHERE project_id=? ORDER BY document_id").all(projectId);
  const read = documentId => evaluate(`bbmDb.sigekoGetPreNotificationWorkflow(${JSON.stringify({ projectId, documentId })})`);
  const selected = async (documentId, color) => {
    await evaluate(`s24.screen.documentSelection.value=${JSON.stringify(documentId)};s24.screen.documentSelection.dispatchEvent(new Event('change',{bubbles:true}))`);
    await waitFor(`${element("state")}.textContent.startsWith(${JSON.stringify(color)}) && !${element("actions.signature")}.disabled`);
  };
  const prepare = async purpose => {
    await vaClick(prefix + "actions." + purpose);
    await waitFor(`!${element("mail.subject.input")}.disabled && !!${element("mail.subject.input")}.value`);
  };
  const openMail = async color => {
    await vaClick(prefix + "mail.open");
    await waitFor(`${element("state")}.textContent.startsWith(${JSON.stringify(color)}) && !${element("actions.signature")}.disabled`);
  };
  report.workflow = { transport: "controlled Main callback; no actual Outlook COM", filePicker: "controlled native-dialog answer",
    actualOutlookVerified: false, processStorage: "production preload, guarded module IPC, Main service, SQLite and project files", geometry: {} };
  await selected(secondDocument.id, "Rot");
  assert.equal((await read(secondDocument.id)).data.revision, null);
  assert.deepEqual(rows(), []);
  const domainBefore = database.initDatabase().prepare("SELECT * FROM sigeko_pre_notifications WHERE project_id=?").get(projectId);
  await fill({ "return.due.input": "2030-05-17" });
  await prepare("signature");
  assert.equal(await evaluate("s24.screen.isDirty()"), false);
  assert.deepEqual(rows(), [], "mail preparation and optional due date do not save process state");
  await fill({ "mail.recipients.input": "s54-signature@example.invalid", "mail.subject.input": "S5.4 Formularabnahme Unterschrift", "mail.body.input": "Geprüfter Formulartext. Bitte Rücklauf bis 2030-05-17." });
  assert.match(await text("mail.attachments"), /Vorankuendigung/);
  assert.match(await text("mail.attachments"), /Firmenliste/);
  boundary.rejectNext(); await vaClick(prefix + "mail.open");
  await waitFor(`${element("status")}.textContent.includes('Kontrollierter Transportfehler')`);
  assert.equal((await read(secondDocument.id)).data.status, "red"); assert.deepEqual(rows(), []);
  await openMail("Orange");
  const signature = (await read(secondDocument.id)).data;
  assert.equal(signature.returnRequestedBy, "2030-05-17"); assert.ok(signature.signatureOpenedAt); assert.equal(signature.signedFile, null);
  assert.equal(boundary.calls.length, 2);
  assert.deepEqual(boundary.calls[1].attachments.map(file => file.sha256), JSON.parse(secondDocument.files_json).map(file => file.sha256));
  assert.deepEqual(boundary.calls[1].recipients, ["s54-signature@example.invalid"]);
  assert.equal(boundary.calls[1].subject, "S5.4 Formularabnahme Unterschrift");
  assert.equal(boundary.calls[1].body, "Geprüfter Formulartext. Bitte Rücklauf bis 2030-05-17.");
  const beforeCancel = rows(); boundary.choices.push({ canceled: true, filePaths: [] });
  await vaClick(prefix + "return.import");
  await waitFor(`!${element("return.import")}.disabled`); assert.deepEqual(rows(), beforeCancel);
  const signedSource = path.join(profile.rootPath, "S54-Technischer-Ruecklauf.pdf");
  const original = fs.readFileSync(path.join(rootPath, JSON.parse(secondDocument.files_json)[0].projectRelativePath));
  const signedBytes = Buffer.concat([original, Buffer.from("\n% S5.4 technical return fixture; no genuine signature asserted\n")]);
  fs.writeFileSync(signedSource, signedBytes); boundary.choices.push({ canceled: false, filePaths: [signedSource] });
  await vaClick(prefix + "return.import"); await waitFor(`!${element("return.open")}.disabled`);
  const imported = (await read(secondDocument.id)).data;
  assert.equal(imported.status, "orange"); assert.equal(imported.signedFile.sha256, hash(signedBytes));
  assert.deepEqual(fs.readFileSync(path.join(rootPath, imported.signedFile.projectRelativePath)), signedBytes);
  await vaClick(prefix + "return.open"); await waitFor(`!${element("return.open")}.disabled`); await closePreview();
  await prepare("authority");
  await fill({ "mail.recipients.input": "s54-authority@example.invalid", "mail.subject.input": "S5.4 Formularabnahme Behörde", "mail.body.input": "Zugeteilter technischer Rücklauf und unveränderte Firmenanlage." });
  await openMail("Grün");
  const completed = (await read(secondDocument.id)).data;
  assert.equal(completed.status, "green"); assert.ok(completed.authorityOpenedAt); assert.equal(completed.returnRequestedBy, "2030-05-17");
  assert.equal(boundary.calls.length, 3);
  assert.deepEqual(boundary.calls[2].attachments.map(file => file.sha256), [hash(signedBytes), JSON.parse(secondDocument.files_json)[1].sha256]);
  assert.deepEqual(boundary.calls[2].recipients, ["s54-authority@example.invalid"]);
  assert.equal(boundary.calls[2].subject, "S5.4 Formularabnahme Behörde");
  assert.equal(boundary.calls[2].body, "Zugeteilter technischer Rücklauf und unveränderte Firmenanlage.");
  for (const call of boundary.calls) for (const file of call.attachments) assert.equal(fs.existsSync(file.temporaryPath), false, "owned mail staging removed after result");
  assert.deepEqual(database.initDatabase().prepare("SELECT * FROM sigeko_pre_notifications WHERE project_id=?").get(projectId), domainBefore);
  assert.deepEqual(database.initDatabase().prepare("SELECT * FROM sigeko_documents WHERE id=?").get(secondDocument.id), secondDocument);
  await selected(firstDocument.id, "Rot"); assert.equal((await read(firstDocument.id)).data.revision, null);
  assert.equal(await evaluate(`${element("mail.open")}.disabled`), true, "changing immutable version clears prepared mail");
  database.closeDatabase(); database.initDatabase(); await vaOpen(projectId);
  await selected(secondDocument.id, "Grün"); assert.deepEqual((await read(secondDocument.id)).data, completed);
  report.checks.push("S5.4: actual form mouse/preload/Main/SQLite/file flow keeps preparation and controlled transport failure red, stores signature handoff orange and optional due date only after exact callback success, handles picker cancel, imports/opens the verified return and stores authority handoff green; callback is a stub, not Outlook COM evidence");
  report.checks.push("S5.4: Main-derived attachments match immutable original/firms versus signed/firms hashes; temporary copies are removed; independent version starts red, selection clears prepared mail and SQLite reopen retains completed state without changing the form draft or final document");

  // Inspect actual declared refs rather than discovering a substitute registry.
  const metadata = await evaluate(`(async()=>{const {sigekoPreNotificationUiEditorContract:c}=await import('../../src/renderer/modules/sigeko/SigekoPreNotificationScreen.uiEditorContract.js');return {count:c.requiredSlots.length,targets:c.slots.filter(x=>x.slotId.includes('.pdf.workflow')).map(x=>{const e=s24.refs.getM80Ref(x.slotId).element;return {id:x.slotId,attributes:['data-ui-inspector-id','data-ui-editor-kind','data-ui-editor-label','data-ui-editor-parent','data-ui-editor-editable','data-ui-editor-ops'].map(a=>e.getAttribute(a)),parentMatches:s24.refs.getM80Ref(e.getAttribute('data-ui-editor-parent')).element.contains(e)};})};})()`);
  assert.equal(metadata.count, 143); assert.equal(metadata.targets.length, 32);
  for (const entry of metadata.targets) { assert.equal(entry.attributes[0], entry.id); assert.ok(entry.attributes.every(value => typeof value === "string" && value.length)); assert.equal(entry.attributes[4], "true"); assert.equal(entry.parentMatches, true); }
  assert.equal(await evaluate("s24.refs.validateM83ComponentReferences(['bbm.sigeko.preNotification']).ok"), true);
  report.workflow.mountedReferences = metadata.count; report.workflow.newTargets = metadata.targets;
  await prepare("authority"); // Show real proposals and fixed attachment names in all viewport captures.
  for (const [size, width, height] of [["wide", 1280, 950], ["narrow", 560, 950], ["low", 560, 480]]) {
    win.setSize(width, height); await waitFor(`innerWidth <= ${width} && innerWidth >= ${width - 80} && innerHeight <= ${height}`);
    const geometry = [];
    for (const key of ["return.import", "return.open", "return.due.input", "actions.signature", "actions.authority", "mail.choice.input", "mail.addRecipient", "mail.recipients.input", "mail.subject.input", "mail.body.input", "mail.open"]) {
      const rect = await evaluate(`s24.vaBounds(${JSON.stringify(prefix + key)})`);
      const viewport = await evaluate("({width:innerWidth,height:innerHeight})");
      assert.ok(rect.width > 0 && rect.height > 0 && rect.x >= -1 && rect.y >= -1 && rect.x + rect.width <= viewport.width + 1 && rect.y + rect.height <= viewport.height + 1, JSON.stringify({ size, key, rect, viewport }));
      geometry.push({ key, ...rect });
    }
    for (const key of ["actions.save", "actions.saveBack", "actions.back", "actions.reload", "actions.pdfPreview", "actions.pdfCreate", "actions.pdfLayout"]) {
      const rect = await evaluate(`(()=>{const {x,y,width,height}=s24.vaElement(${JSON.stringify(key)}).getBoundingClientRect();return {x,y,width,height};})()`);
      const viewport = await evaluate("({width:innerWidth,height:innerHeight})");
      assert.ok(rect.x >= -1 && rect.y >= -1 && rect.x + rect.width <= viewport.width + 1 && rect.y + rect.height <= viewport.height + 1, JSON.stringify({ size, key, rect, viewport }));
    }
    report.workflow.geometry[size] = geometry;
    fs.writeFileSync(path.join(output, `sigeko-workflow-${size}.png`), (await win.webContents.capturePage()).toPNG());
  }
  report.checks.push("S5.4: 143 declared component refs and all six attributes/parent containment of 32 new targets are mounted; actual wide/narrow/560x480 scrolling reaches workflow controls and keeps the seven existing toolbar actions visible");
  // Preserve the earlier harness's selected first-version/native-editor setup.
  win.setSize(1280, 950); await selected(firstDocument.id, "Rot");
}
module.exports = { createWorkflowFormBoundary, runWorkflowFormAcceptance };
