"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const extract = require("extract-zip");
const archiver = require("archiver");
const { fixture, load, writeZip } = require("./plannedConstructionStart.test.cjs");
const { SIGEKO_DOCUMENT_COLUMNS, validateSigekoDocumentRow } = require("../../src/shared/sigeko/documents.cjs");
const { SIGEKO_PRE_NOTIFICATION_WORKFLOW_COLUMNS, validatePreNotificationWorkflowRow } = require("../../src/shared/sigeko/preNotificationWorkflows.cjs");
const { buildStoragePreviewPaths, resolveProjectFolderName } = require("../../src/main/ipc/projectStoragePaths");
const stamp = "2026-09-10T12:00:00.000Z";
const pdf = kind => `%PDF-1.4\n${kind} signed workflow test\n%%EOF\n`;
function file(id, kind) {
  return { kind, projectRelativePath: `SiGeKo/Unterlagen/${id}-${kind}.pdf`,
    sha256: createHash("sha256").update(pdf(kind)).digest("hex"), byteSize: Buffer.byteLength(pdf(kind)) };
}
function document(projectId = "imported", id = "document", firms = false) {
  const snapshot = { schemaVersion: 1, documentTypeId: "sigeko-vorankuendigung", projectId, documentId: id, createdAt: stamp,
    source: { draftId: null, draftRevision: 0 },
    form: { address: { street: null, zip: null, city: null }, builder: null, buildingType: null, thirdParty: null,
      planning: null, execution: null, plannedStart: null, durationMonths: null, maxWorkers: null, employerCount: null,
      selfEmployedCount: null, firmsMode: firms ? "attachment" : "unknown", authority: null, authorityEvidence: null, authorityStatus: "red" },
    printRuntimeContext: { project: { id: projectId }, orientation: "portrait" },
    readiness: { status: "red", issues: [{ code: "MISSING", field: "builder", message: "Nicht gesetzt", action: "Prüfen", status: "red" }] } };
  const row = { id, project_id: projectId, document_type: snapshot.documentTypeId, snapshot_json: JSON.stringify(snapshot),
    files_json: JSON.stringify((firms ? ["main", "firms"] : ["main"]).map(kind => file(id, kind))), created_at: stamp };
  validateSigekoDocumentRow(row, projectId); return row;
}
function workflow(projectId = "imported", documentId = "document", signed = true) {
  const row = { document_id: documentId, project_id: projectId, signed_file_json: signed ? JSON.stringify(file(documentId, "signed")) : null,
    signed_received_at: signed ? stamp : null, signature_opened_at: stamp, authority_opened_at: signed ? stamp : null,
    return_requested_by: null, revision: 1, created_at: stamp, updated_at: stamp };
  validatePreNotificationWorkflowRow(row, projectId); return row;
}
function register(ctx, overrides = {}) {
  load("src/main/ipc/projectTransferIpc.js", { ...ctx.dependencies, ...overrides }).registerProjectTransferIpc();
  return { exportProject: id => ctx.invoke("projectTransfer:export", { id }),
    importProject: filePath => ctx.invoke("projectTransfer:import", { filePath }) };
}
function insert(ctx, doc, flow) {
  for (const [table, columns, row] of [["sigeko_documents", SIGEKO_DOCUMENT_COLUMNS, doc],
    ["sigeko_pre_notification_workflows", SIGEKO_PRE_NOTIFICATION_WORKFLOW_COLUMNS, flow]]) {
    if (row) ctx.db.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`).run(columns.map(key => row[key]));
  }
}
function folder(ctx, project) { return path.dirname(buildStoragePreviewPaths({ baseDir: ctx.root, project }).previewDir); }
function filesAt(root, doc, flow) {
  const files = [...JSON.parse(doc.files_json), ...(flow?.signed_file_json ? [JSON.parse(flow.signed_file_json)] : [])];
  for (const entry of files) {
    const target = path.join(root, entry.projectRelativePath); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, pdf(entry.kind));
  }
}
function parts(documents = [document()], workflows = [workflow()]) {
  const data = { meetings: [], tops: [], meetingTops: [], meetingParticipants: [], projectFirms: [], projectPersons: [],
    projectCandidates: [], projectGlobalFirms: [], projectSettings: [], restarbeitenItems: [], restarbeitenAttachments: [],
    restarbeitenNotes: [], globalFirmDependencies: [], globalPersonDependencies: [], sigekoProjects: [],
    sigekoProjectAuthorities: [], sigekoPreNotifications: [], sigekoDocuments: documents,
    ...(workflows.length ? { sigekoPreNotificationWorkflows: workflows } : {}) };
  const names = { projectSettings: ["settings", "projectSettings"], meetings: ["meetings", "meetings"], tops: ["tops", "tops"],
    meetingTops: ["meeting_tops", "meeting_tops"], meetingParticipants: ["meeting_participants", "meeting_participants"],
    projectFirms: ["project_firms", "project_firms"], projectPersons: ["project_persons", "project_persons"],
    projectCandidates: ["project_candidates", "project_candidates"], projectGlobalFirms: ["project_global_firms", "project_global_firms"],
    restarbeitenItems: ["restarbeiten_items", "restarbeiten_items"], restarbeitenAttachments: ["restarbeiten_attachments", "restarbeiten_attachments"],
    restarbeitenNotes: ["restarbeiten_notes", "restarbeiten_notes"], sigekoProjectAuthorities: ["sigeko_project_authorities", "sigeko_project_authorities"],
    sigekoPreNotifications: ["sigeko_pre_notifications", "sigeko_pre_notifications"], sigekoDocuments: ["sigeko_documents", "sigeko_documents"],
    ...(workflows.length ? { sigekoPreNotificationWorkflows: ["sigeko_pre_notification_workflows", "sigeko_pre_notification_workflows"] } : {}) };
  const result = { "data/project.json": { project: { id: "imported", name: "Workflow-Archiv" } },
    "data/global_firm_dependencies.json": { firms: [], persons: [] }, "project-folder/": "" };
  for (const [key, [name, field]] of Object.entries(names)) result[`data/${name}.json`] = { [field]: data[key] };
  for (const row of documents) for (const entry of JSON.parse(row.files_json)) result[`project-folder/${entry.projectRelativePath}`] = pdf(entry.kind);
  for (const row of workflows) if (row.signed_file_json) result[`project-folder/${JSON.parse(row.signed_file_json).projectRelativePath}`] = pdf("signed");
  const counts = Object.fromEntries(Object.entries(data).map(([key, values]) => [key, values.length]));
  counts.filesCount = Object.keys(result).filter(name => name.startsWith("project-folder/") && !name.endsWith("/")).length;
  result["manifest.json"] = { formatVersion: workflows.length ? 9 : 8, projectId: "imported", counts }; return result;
}
async function archive(ctx, candidate) {
  const target = path.join(ctx.root, "candidate.zip");
  await writeZip(target, Object.fromEntries(Object.entries(candidate).map(([name, value]) => [name, typeof value === "string" ? value : JSON.stringify(value)])));
  return target;
}
function domainRows(ctx) {
  return Object.fromEntries(ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()
    .map(({ name }) => [name, ctx.db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all()]));
}
function target(ctx) { return path.join(ctx.root, "bbm", resolveProjectFolderName({ name: "Workflow-Archiv" })); }
async function rejected(ctx, transfer, candidate, pattern) {
  const before = domainRows(ctx); const result = await transfer.importProject(await archive(ctx, candidate));
  assert.equal(result.ok, false, JSON.stringify(result)); if (pattern) assert.match(result.error, pattern);
  assert.deepEqual(domainRows(ctx), before); assert.equal(fs.existsSync(target(ctx)), false); return result;
}
const flowPayload = "data/sigeko_pre_notification_workflows.json";
const signedPath = "project-folder/SiGeKo/Unterlagen/document-signed.pdf";
async function runSigekoWorkflowTransferTests(run) {
  await run("S5.4-Transfer: V9 ZIP preserves per-version workflow, original PDFs, signed return and unrelated project", () => fixture(async ctx => {
    const project = ctx.repo.createProject({ name: "Workflow export" });
    const first = document(project.id, "document", true), firstFlow = workflow(project.id);
    const second = document(project.id, "previous"), secondFlow = workflow(project.id, "previous", false);
    const other = ctx.repo.createProject({ name: "Unberührt" }); const otherDoc = document(other.id, "other"), otherFlow = workflow(other.id, "other");
    insert(ctx, first, firstFlow); insert(ctx, second, secondFlow); insert(ctx, otherDoc, otherFlow);
    filesAt(folder(ctx, project), first, firstFlow); filesAt(folder(ctx, project), second, secondFlow);
    const transfer = register(ctx); const exported = await transfer.exportProject(project.id); assert.equal(exported.ok, true, exported.error);
    assert.equal(ctx.repo.getById(project.id), undefined); assert.equal(fs.existsSync(folder(ctx, project)), false);
    assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_pre_notification_workflows").all(), [otherFlow]);
    const unpacked = path.join(ctx.root, "inspect"); await extract(exported.exportPath, { dir: unpacked });
    const manifest = JSON.parse(fs.readFileSync(path.join(unpacked, "manifest.json")));
    assert.equal(manifest.formatVersion, 9); assert.equal(manifest.counts.sigekoPreNotificationWorkflows, 2); assert.equal(manifest.counts.filesCount, 4);
    assert.equal(manifest.counts.sigekoPreNotifications, 0);
    const imported = await transfer.importProject(exported.exportPath); assert.equal(imported.ok, true, imported.error);
    assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_documents WHERE project_id=? ORDER BY id").all(project.id), [first, second]);
    assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_pre_notification_workflows WHERE project_id=? ORDER BY document_id").all(project.id), [firstFlow, secondFlow]);
    for (const entry of [...JSON.parse(first.files_json), JSON.parse(firstFlow.signed_file_json), ...JSON.parse(second.files_json)]) {
      assert.equal(fs.readFileSync(path.join(folder(ctx, project), entry.projectRelativePath), "utf8"), pdf(entry.kind));
    }
    ctx.database.closeDatabase(); const reopened = ctx.database.initDatabase();
    assert.deepEqual(reopened.prepare("SELECT * FROM sigeko_pre_notification_workflows WHERE document_id=?").get(first.id), firstFlow);
    assert.equal(reopened.pragma("integrity_check", { simple: true }), "ok"); assert.deepEqual(reopened.pragma("foreign_key_check"), []);
  }, { modules: ["sigeko"] }));
  await run("S5.4-Transfer: document-only export remains exact V8 without workflow payload or count", () => fixture(async ctx => {
    const project = ctx.repo.createProject({ name: "Legacy V8" }); const doc = document(project.id); insert(ctx, doc); filesAt(folder(ctx, project), doc);
    const transfer = register(ctx); const exported = await transfer.exportProject(project.id); assert.equal(exported.ok, true, exported.error);
    const unpacked = path.join(ctx.root, "inspect"); await extract(exported.exportPath, { dir: unpacked });
    const manifest = JSON.parse(fs.readFileSync(path.join(unpacked, "manifest.json")));
    assert.equal(manifest.formatVersion, 8); assert.equal(Object.hasOwn(manifest.counts, "sigekoPreNotificationWorkflows"), false);
    assert.equal(fs.existsSync(path.join(unpacked, flowPayload)), false);
    assert.equal((await transfer.importProject(exported.exportPath)).ok, true);
    assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_pre_notification_workflows").all(), []);
  }, { modules: ["sigeko"] }));
  await run("S5.4-Transfer: missing, corrupt, extra, empty, downgraded and future V9 payloads reject atomically", () => fixture(async ctx => {
    const mutations = [p => { delete p[flowPayload]; }, p => { p[flowPayload] = "{"; },
      p => { p[flowPayload].sigeko_pre_notification_workflows = []; }, p => { p[flowPayload].sigeko_pre_notification_workflows = {}; },
      p => { p[flowPayload].extra = true; }, p => { delete p["data/sigeko_documents.json"]; }, p => { p["data/future.json"] = {}; },
      ...[1, 2, 3, 4, 5, 6, 7, 8, 10, "9"].map(version => p => { p["manifest.json"].formatVersion = version; })];
    const transfer = register(ctx); for (const mutate of mutations) { const candidate = parts(); mutate(candidate); await rejected(ctx, transfer, candidate); }
  }, { modules: ["sigeko"] }));
  await run("S5.4-Transfer: workflow identity, row shape, chronology and signed pairing reject before writes", () => fixture(async ctx => {
    const mutations = [row => { row.project_id = "foreign"; }, row => { row.document_id = "absent"; }, row => { row.extra = true; },
      row => { row.revision = -1; }, row => { row.signed_file_json = "{}"; }, row => { row.signed_received_at = null; },
      row => { row.signed_file_json = null; row.signed_received_at = null; }, row => { row.updated_at = "invalid"; },
      row => { row.updated_at = "2025-01-01T00:00:00.000Z"; },
      row => { row.signed_received_at = "2026-09-10T12:01:00.000Z"; row.updated_at = "2026-09-10T12:02:00.000Z"; },
      row => { delete row.return_requested_by; }];
    const transfer = register(ctx); for (const mutate of mutations) { const candidate = parts(); mutate(candidate[flowPayload].sigeko_pre_notification_workflows[0]); await rejected(ctx, transfer, candidate); }
    await rejected(ctx, transfer, parts([document()], [workflow(), workflow()]), /Doppelter/);
  }, { modules: ["sigeko"] }));
  await run("S5.4-Transfer: signed paths cannot collide with originals or another return on Windows or Linux", () => fixture(async ctx => {
    const transfer = register(ctx);
    for (const upper of [false, true]) {
      const candidate = parts(); const row = candidate[flowPayload].sigeko_pre_notification_workflows[0];
      const entry = JSON.parse(row.signed_file_json); entry.projectRelativePath = `SiGeKo/Unterlagen/${upper ? "DOCUMENT-MAIN" : "document-main"}.pdf`; row.signed_file_json = JSON.stringify(entry);
      await rejected(ctx, transfer, candidate, /Doppelte/);
      const first = workflow(), second = workflow("imported", "second");
      const duplicate = JSON.parse(first.signed_file_json); if (upper) duplicate.projectRelativePath = duplicate.projectRelativePath.replace("document-signed", "DOCUMENT-SIGNED");
      second.signed_file_json = JSON.stringify(duplicate);
      await rejected(ctx, transfer, parts([document(), document("imported", "second")], [first, second]), /Doppelte/);
    }
  }, { modules: ["sigeko"] }));
  await run("S5.4-Transfer: V9 requires every exact count and manifest project identity", () => fixture(async ctx => {
    const transfer = register(ctx);
    for (const key of Object.keys(parts()["manifest.json"].counts)) for (const value of [undefined, -1, "0", 999]) {
      const candidate = parts(); candidate["manifest.json"].counts[key] = value; await rejected(ctx, transfer, candidate, /V9-Manifest/);
    }
    for (const mutate of [p => { p["manifest.json"].projectId = "foreign"; }, p => { p["manifest.json"].counts.extra = 0; }]) {
      const candidate = parts(); mutate(candidate); await rejected(ctx, transfer, candidate, /V9-Manifest/);
    }
  }, { modules: ["sigeko"] }));
  await run("S5.4-Transfer: missing, changed and non-PDF signed archive bytes preserve database", () => fixture(async ctx => {
    const transfer = register(ctx);
    for (const value of [undefined, "%PDF-1.4 changed", "not a PDF"]) {
      const candidate = parts(); if (value === undefined) delete candidate[signedPath]; else candidate[signedPath] = value;
      await rejected(ctx, transfer, candidate, /PDF/);
    }
    const candidate = parts(); candidate[signedPath] = "not a PDF";
    candidate[flowPayload].sigeko_pre_notification_workflows[0].signed_file_json = JSON.stringify({ ...file("document", "signed"),
      sha256: createHash("sha256").update("not a PDF").digest("hex"), byteSize: 9 });
    await rejected(ctx, transfer, candidate, /PDF/);
  }, { modules: ["sigeko"] }));
  await run("S5.4-Transfer: absent or incompatible workflow schema and existing document IDs reject before reservation", async () => {
    await fixture(async ctx => { await rejected(ctx, register(ctx), parts(), /aktiviert und initialisiert/); });
    await fixture(async ctx => {
      ctx.db.exec("ALTER TABLE sigeko_pre_notification_workflows ADD COLUMN future TEXT");
      await rejected(ctx, register(ctx), parts(), /aktiviert und initialisiert/);
    }, { modules: ["sigeko"] });
    await fixture(async ctx => {
      const other = ctx.repo.createProject({ name: "Other" }); insert(ctx, document(other.id), workflow(other.id));
      await rejected(ctx, register(ctx), parts(), /existiert bereits/);
    }, { modules: ["sigeko"] });
  });
  await run("S5.4-Transfer: copy failure and copied signed-byte damage remove only reserved target and commit no rows", async () => {
    for (const damage of [false, true]) await fixture(async ctx => {
      let copied = false; const transfer = register(ctx, { fs: { ...fs, promises: { ...fs.promises, cp: async (source, destination, options) => {
        assert.equal(ctx.repo.getById("imported"), undefined); await fs.promises.cp(source, destination, options); copied = true;
        if (damage) fs.writeFileSync(path.join(destination, "SiGeKo/Unterlagen/document-signed.pdf"), "damaged");
        else throw new Error("injected copy failure");
      } } } });
      await rejected(ctx, transfer, parts(), damage ? /PDF/ : /injected copy failure/); assert.equal(copied, true);
    }, { modules: ["sigeko"] });
  });
  await run("S5.4-Transfer: downstream DB failure rolls back inserted workflow and removes owned copies", () => fixture(async ctx => {
    const candidate = parts(); candidate["data/project_candidates.json"].project_candidates = [{ impossible_column: true }];
    candidate["manifest.json"].counts.projectCandidates = 1;
    await rejected(ctx, register(ctx), candidate, /impossible_column/);
  }, { modules: ["sigeko"] }));
  await run("S5.4-Transfer: late storage change during import retains new storage and rolls back reservation", () => fixture(async ctx => {
    const newBase = path.join(ctx.root, "new-storage"); fs.mkdirSync(newBase); fs.writeFileSync(path.join(newBase, "keep.txt"), "Other");
    let settingsRoot = ctx.root; const transfer = register(ctx, {
      "../db/appSettingsRepo": { appSettingsGetMany: () => ({ "pdf.protocolsDir": settingsRoot }) },
      fs: { ...fs, promises: { ...fs.promises, cp: async (...args) => { await fs.promises.cp(...args); settingsRoot = newBase; } } },
    });
    await rejected(ctx, transfer, parts(), /Projektablage.*geändert/);
    assert.deepEqual(fs.readdirSync(newBase), ["keep.txt"]); assert.equal(fs.readFileSync(path.join(newBase, "keep.txt"), "utf8"), "Other");
  }, { modules: ["sigeko"] }));
  await run("S5.4-Transfer: signed source missing, changed or symlinked prevents destructive export", async () => {
    for (const mode of ["changed", "missing", "linked"]) await fixture(async ctx => {
      const project = ctx.repo.createProject({ name: "Keep workflow" }); const doc = document(project.id), flow = workflow(project.id);
      insert(ctx, doc, flow); filesAt(folder(ctx, project), doc, flow);
      const signed = path.join(folder(ctx, project), JSON.parse(flow.signed_file_json).projectRelativePath);
      if (mode === "changed") fs.writeFileSync(signed, "changed"); else fs.unlinkSync(signed);
      if (mode === "linked") { const external = path.join(ctx.root, "external.pdf"); fs.writeFileSync(external, pdf("signed")); fs.symlinkSync(external, signed); }
      const before = domainRows(ctx); const result = await register(ctx).exportProject(project.id);
      assert.equal(result.ok, false); assert.match(result.error, /PDF|Dateiverweis/); assert.deepEqual(domainRows(ctx), before); assert.ok(ctx.repo.getById(project.id));
    }, { modules: ["sigeko"] });
  });
  await run("S5.4-Transfer: corrupt signed ZIP bytes prevent source deletion despite correct source PDFs", () => fixture(async ctx => {
    const project = ctx.repo.createProject({ name: "Keep workflow" }); const doc = document(project.id), flow = workflow(project.id);
    insert(ctx, doc, flow); filesAt(folder(ctx, project), doc, flow);
    const corruptArchiver = (...args) => { const zip = archiver(...args); zip.directory = () => {
      zip.append(pdf("main"), { name: "project-folder/SiGeKo/Unterlagen/document-main.pdf" });
      zip.append("%PDF-1.4 corrupt signed archive", { name: signedPath }); return zip;
    }; return zip; };
    const before = domainRows(ctx); const result = await register(ctx, { archiver: corruptArchiver }).exportProject(project.id);
    assert.equal(result.ok, false); assert.match(result.error, /PDF/); assert.deepEqual(domainRows(ctx), before);
    assert.equal(fs.readFileSync(path.join(folder(ctx, project), "SiGeKo/Unterlagen/document-signed.pdf"), "utf8"), pdf("signed"));
  }, { modules: ["sigeko"] }));
  await run("S5.4-Transfer: workflow or signed-file changes during archive validation prevent source deletion", async () => {
    for (const mutation of ["workflow", "signed-file"]) await fixture(async ctx => {
      const project = ctx.repo.createProject({ name: "Keep workflow" }); const doc = document(project.id), flow = workflow(project.id);
      insert(ctx, doc, flow); filesAt(folder(ctx, project), doc, flow);
      const transfer = register(ctx, { "extract-zip": async (...args) => {
        await extract(...args);
        if (mutation === "workflow") ctx.db.prepare("UPDATE sigeko_pre_notification_workflows SET revision=revision+1 WHERE document_id=?").run(doc.id);
        if (mutation === "signed-file") fs.writeFileSync(path.join(folder(ctx, project), "SiGeKo/Unterlagen/document-signed.pdf"), "changed later");
      } });
      const result = await transfer.exportProject(project.id); assert.equal(result.ok, false, mutation);
      assert.ok(ctx.repo.getById(project.id)); assert.ok(ctx.db.prepare("SELECT * FROM sigeko_pre_notification_workflows WHERE document_id=?").get(doc.id));
      assert.equal(fs.existsSync(folder(ctx, project)), true);
    }, { modules: ["sigeko"] });
  });
}
module.exports = { runSigekoWorkflowTransferTests };
if (require.main === module) runSigekoWorkflowTransferTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
