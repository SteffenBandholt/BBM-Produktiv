"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const extract = require("extract-zip");
const archiver = require("archiver");
const { fixture, load, writeZip } = require("./plannedConstructionStart.test.cjs");
const { SIGEKO_DOCUMENT_COLUMNS, validateSigekoDocumentRow } = require("../../src/shared/sigeko/documents.cjs");
const { buildStoragePreviewPaths, resolveProjectFolderName } = require("../../src/main/ipc/projectStoragePaths");
const stamp = "2026-09-10T12:00:00.000Z";
const pdf = kind => `%PDF-1.4\n${kind} – unveränderlicher Teststand\n%%EOF\n`;
function document(projectId = "imported", id = "document", firms = false) {
  const snapshot = { schemaVersion: 1, documentTypeId: "sigeko-vorankuendigung", projectId, documentId: id, createdAt: stamp,
    source: { draftId: null, draftRevision: 0 },
    form: { address: { street: null, zip: null, city: null }, builder: null, buildingType: null, thirdParty: null,
      planning: null, execution: null, plannedStart: null, durationMonths: null, maxWorkers: null, employerCount: null,
      selfEmployedCount: null, firmsMode: firms ? "attachment" : "unknown", authority: null, authorityEvidence: null, authorityStatus: "red" },
    printRuntimeContext: { project: { id: projectId }, orientation: "portrait" },
    readiness: { status: "red", issues: [{ code: "MISSING", field: "builder", message: "Nicht gesetzt", action: "Prüfen", status: "red" }] } };
  const files = (firms ? ["main", "firms"] : ["main"]).map(kind => ({ kind,
    projectRelativePath: `SiGeKo/Unterlagen/${id}-${kind}.pdf`, sha256: createHash("sha256").update(pdf(kind)).digest("hex"),
    byteSize: Buffer.byteLength(pdf(kind)) }));
  const row = { id, project_id: projectId, document_type: snapshot.documentTypeId, snapshot_json: JSON.stringify(snapshot),
    files_json: JSON.stringify(files), created_at: stamp };
  validateSigekoDocumentRow(row, projectId); return row;
}
function register(ctx, overrides = {}) {
  load("src/main/ipc/projectTransferIpc.js", { ...ctx.dependencies, ...overrides }).registerProjectTransferIpc();
  return { exportProject: id => ctx.invoke("projectTransfer:export", { id }),
    importProject: filePath => ctx.invoke("projectTransfer:import", { filePath }) };
}
function insert(ctx, row) {
  ctx.db.prepare(`INSERT INTO sigeko_documents (${SIGEKO_DOCUMENT_COLUMNS.join(",")}) VALUES (${SIGEKO_DOCUMENT_COLUMNS.map(() => "?").join(",")})`)
    .run(SIGEKO_DOCUMENT_COLUMNS.map(key => row[key]));
}
function folder(ctx, project) { return path.dirname(buildStoragePreviewPaths({ baseDir: ctx.root, project }).previewDir); }
function filesAt(root, row) {
  for (const file of JSON.parse(row.files_json)) {
    const target = path.join(root, file.projectRelativePath); fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, pdf(file.kind));
  }
}
function parts(rows = [document()]) {
  const data = { meetings: [], tops: [], meetingTops: [], meetingParticipants: [], projectFirms: [], projectPersons: [],
    projectCandidates: [], projectGlobalFirms: [], projectSettings: [], restarbeitenItems: [], restarbeitenAttachments: [],
    restarbeitenNotes: [], globalFirmDependencies: [], globalPersonDependencies: [], sigekoProjects: [],
    sigekoProjectAuthorities: [], sigekoPreNotifications: [], sigekoDocuments: rows };
  const names = { projectSettings: ["settings", "projectSettings"], meetings: ["meetings", "meetings"], tops: ["tops", "tops"],
    meetingTops: ["meeting_tops", "meeting_tops"], meetingParticipants: ["meeting_participants", "meeting_participants"],
    projectFirms: ["project_firms", "project_firms"], projectPersons: ["project_persons", "project_persons"],
    projectCandidates: ["project_candidates", "project_candidates"], projectGlobalFirms: ["project_global_firms", "project_global_firms"],
    restarbeitenItems: ["restarbeiten_items", "restarbeiten_items"], restarbeitenAttachments: ["restarbeiten_attachments", "restarbeiten_attachments"],
    restarbeitenNotes: ["restarbeiten_notes", "restarbeiten_notes"], sigekoProjectAuthorities: ["sigeko_project_authorities", "sigeko_project_authorities"],
    sigekoPreNotifications: ["sigeko_pre_notifications", "sigeko_pre_notifications"], sigekoDocuments: ["sigeko_documents", "sigeko_documents"] };
  const result = { "data/project.json": { project: { id: "imported", name: "PDF-Archiv" } },
    "data/global_firm_dependencies.json": { firms: [], persons: [] }, "project-folder/": "" };
  for (const [key, [name, field]] of Object.entries(names)) result[`data/${name}.json`] = { [field]: data[key] };
  for (const row of rows) for (const file of JSON.parse(row.files_json)) result[`project-folder/${file.projectRelativePath}`] = pdf(file.kind);
  const counts = Object.fromEntries(Object.entries(data).map(([key, values]) => [key, values.length]));
  counts.filesCount = Object.keys(result).filter(name => name.startsWith("project-folder/") && !name.endsWith("/")).length;
  result["manifest.json"] = { formatVersion: 8, projectId: "imported", counts }; return result;
}
async function archive(ctx, candidate) {
  const file = path.join(ctx.root, "candidate.zip");
  await writeZip(file, Object.fromEntries(Object.entries(candidate).map(([name, value]) => [name, typeof value === "string" ? value : JSON.stringify(value)])));
  return file;
}
function domainRows(ctx) {
  return Object.fromEntries(ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()
    .map(({ name }) => [name, ctx.db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all()]));
}
async function rejected(ctx, transfer, candidate, pattern) {
  const before = domainRows(ctx); const result = await transfer.importProject(await archive(ctx, candidate));
  assert.equal(result.ok, false, JSON.stringify(result)); if (pattern) assert.match(result.error, pattern);
  assert.deepEqual(domainRows(ctx), before); return result;
}
async function runSigekoDocumentTransferTests(run) {
  for (const firms of [false, true]) await run(`S5.3b2-Transfer: V8 real ZIP roundtrip retains immutable PDFs and snapshots, firms=${firms}`, () => fixture(async ctx => {
    const project = ctx.repo.createProject({ name: "Finale Vorankündigung" });
    const row = document(project.id, "document", firms); const second = document(project.id, "previous", firms);
    insert(ctx, row); insert(ctx, second); filesAt(folder(ctx, project), row); filesAt(folder(ctx, project), second);
    const other = ctx.repo.createProject({ name: "Unberührt" }); const otherRow = document(other.id, "other"); insert(ctx, otherRow);
    const transfer = register(ctx); const exported = await transfer.exportProject(project.id); assert.equal(exported.ok, true, exported.error);
    assert.equal(ctx.repo.getById(project.id), undefined); assert.equal(fs.existsSync(folder(ctx, project)), false);
    assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_documents").all(), [otherRow]);
    const unpacked = path.join(ctx.root, "inspect"); await extract(exported.exportPath, { dir: unpacked });
    const manifest = JSON.parse(fs.readFileSync(path.join(unpacked, "manifest.json"))); assert.equal(manifest.formatVersion, 8);
    assert.equal(manifest.counts.sigekoDocuments, 2); assert.equal(manifest.counts.sigekoPreNotifications, 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(unpacked, "data/sigeko_pre_notifications.json"))), { sigeko_pre_notifications: [] });
    const imported = await transfer.importProject(exported.exportPath); assert.equal(imported.ok, true, imported.error);
    assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_documents WHERE project_id=? ORDER BY id").all(project.id), [row, second]);
    for (const entry of [row, second]) for (const file of JSON.parse(entry.files_json)) {
      assert.equal(fs.readFileSync(path.join(folder(ctx, project), file.projectRelativePath), "utf8"), pdf(file.kind));
    }
    ctx.database.closeDatabase(); assert.deepEqual(ctx.database.initDatabase().prepare("SELECT * FROM sigeko_documents WHERE id=?").get(row.id), row);
    assert.equal(ctx.database.initDatabase().pragma("integrity_check", { simple: true }), "ok");
  }, { modules: ["sigeko"] }));
  await run("S5.3b2-Transfer: V8 missing, corrupt, extra, downgraded and future payloads reject before writes", () => fixture(async ctx => {
    const transfer = register(ctx);
    const mutations = [p => { delete p["data/sigeko_documents.json"]; }, p => { p["data/sigeko_documents.json"] = "{"; },
      p => { p["data/sigeko_documents.json"].sigeko_documents = []; }, p => { p["data/sigeko_documents.json"].extra = []; },
      p => { p["data/sigeko_documents.json"].sigeko_documents = {}; }, p => { delete p["data/sigeko_pre_notifications.json"]; },
      p => { delete p["data/sigeko_project_authorities.json"]; }, p => { p["data/future.json"] = {}; },
      ...[1, 2, 3, 4, 5, 6, 7, 9, "8"].map(version => p => { p["manifest.json"].formatVersion = version; })];
    for (const mutate of mutations) { const candidate = parts(); mutate(candidate); await rejected(ctx, transfer, candidate); }
  }, { modules: ["sigeko"] }));
  await run("S5.3b2-Transfer: V8 strict identities, rows, snapshots, paths and duplicate references reject atomically", () => fixture(async ctx => {
    const transfer = register(ctx);
    const mutations = [row => { row.project_id = "other"; }, row => { row.id = "different"; }, row => { row.extra = true; },
      row => { row.document_type = "invoice"; }, row => { row.snapshot_json = "{}"; },
      row => { row.files_json = JSON.stringify([{ ...JSON.parse(row.files_json)[0], projectRelativePath: "../outside.pdf" }]); },
      row => { row.files_json = JSON.stringify([{ ...JSON.parse(row.files_json)[0], sha256: "x" }]); }];
    for (const mutate of mutations) { const candidate = parts(); mutate(candidate["data/sigeko_documents.json"].sigeko_documents[0]); await rejected(ctx, transfer, candidate); }
    await rejected(ctx, transfer, parts([document(), document()]), /Doppelte/);
    const first = document(); const second = document("imported", "second"); second.files_json = first.files_json;
    await rejected(ctx, transfer, parts([first, second]), /Doppelte/);
    second.files_json = JSON.stringify(JSON.parse(first.files_json).map(file => ({ ...file, projectRelativePath: file.projectRelativePath.replace("document", "DOCUMENT") })));
    await rejected(ctx, transfer, parts([first, second]), /Doppelte/);
  }, { modules: ["sigeko"] }));
  await run("S5.3b2-Transfer: every V8 manifest count and project identity is mandatory", () => fixture(async ctx => {
    const transfer = register(ctx);
    for (const key of Object.keys(parts()["manifest.json"].counts)) for (const value of [undefined, -1, "0", 999]) {
      const candidate = parts(); candidate["manifest.json"].counts[key] = value; await rejected(ctx, transfer, candidate, /V8-Manifest/);
    }
    for (const mutate of [p => { p["manifest.json"].projectId = "foreign"; }, p => { p["manifest.json"].counts.extra = 0; }]) {
      const candidate = parts(); mutate(candidate); await rejected(ctx, transfer, candidate, /V8-Manifest/);
    }
  }, { modules: ["sigeko"] }));
  await run("S5.3b2-Transfer: missing, modified and non-PDF archive bytes preserve all database rows", () => fixture(async ctx => {
    const transfer = register(ctx);
    for (const value of [undefined, "%PDF-1.4 changed", "not a PDF"]) {
      const candidate = parts(); const name = "project-folder/SiGeKo/Unterlagen/document-main.pdf";
      if (value === undefined) delete candidate[name]; else candidate[name] = value;
      await rejected(ctx, transfer, candidate, /PDF/);
    }
    const candidate = parts(); candidate["project-folder/SiGeKo/Unterlagen/document-main.pdf"] = "not a PDF";
    candidate["data/sigeko_documents.json"].sigeko_documents[0].files_json = JSON.stringify([{ kind: "main",
      projectRelativePath: "SiGeKo/Unterlagen/document-main.pdf", sha256: createHash("sha256").update("not a PDF").digest("hex"), byteSize: 9 }]);
    await rejected(ctx, transfer, candidate, /PDF/);
  }, { modules: ["sigeko"] }));
  await run("S5.3b2-Transfer: document schema and global ID collisions reject before target reservation", async () => {
    await fixture(async ctx => { await rejected(ctx, register(ctx), parts(), /aktiviert und initialisiert/); });
    await fixture(async ctx => {
      const other = ctx.repo.createProject({ name: "Other" }); insert(ctx, document(other.id));
      await rejected(ctx, register(ctx), parts(), /Dokument existiert bereits/);
    }, { modules: ["sigeko"] });
  });
  await run("S5.3b2-Transfer: copy failure removes only the exclusively reserved folder and writes no project", () => fixture(async ctx => {
    const target = path.join(ctx.root, "bbm", resolveProjectFolderName({ name: "PDF-Archiv" }));
    let copied = false;
    const transfer = register(ctx, { fs: { ...fs, promises: { ...fs.promises, cp: async (source, destination, options) => {
      assert.equal(fs.statSync(destination).isDirectory(), true); assert.equal(ctx.repo.getById("imported"), undefined);
      await fs.promises.cp(source, destination, options); copied = true; throw new Error("injected copy failure");
    } } } });
    await rejected(ctx, transfer, parts(), /injected copy failure/); assert.equal(copied, true); assert.equal(fs.existsSync(target), false);
  }, { modules: ["sigeko"] }));
  await run("S5.3b2-Transfer: post-copy byte validation prevents committing a damaged imported PDF", () => fixture(async ctx => {
    const target = path.join(ctx.root, "bbm", resolveProjectFolderName({ name: "PDF-Archiv" }));
    const transfer = register(ctx, { fs: { ...fs, promises: { ...fs.promises, cp: async (source, destination, options) => {
      await fs.promises.cp(source, destination, options); fs.writeFileSync(path.join(destination, "SiGeKo/Unterlagen/document-main.pdf"), "damaged");
    } } } });
    await rejected(ctx, transfer, parts(), /PDF/); assert.equal(fs.existsSync(target), false);
  }, { modules: ["sigeko"] }));
  await run("S5.3b2-Transfer: storage change during copying refuses import and cleans only the reserved old folder", () => fixture(async ctx => {
    const target = path.join(ctx.root, "bbm", resolveProjectFolderName({ name: "PDF-Archiv" }));
    const newBase = path.join(ctx.root, "new-storage"); fs.mkdirSync(newBase); fs.writeFileSync(path.join(newBase, "keep.txt"), "Other");
    let settingsRoot = ctx.root, copied = false;
    const transfer = register(ctx, {
      "../db/appSettingsRepo": { appSettingsGetMany: () => ({ "pdf.protocolsDir": settingsRoot }) },
      fs: { ...fs, promises: { ...fs.promises, cp: async (source, destination, options) => {
        await fs.promises.cp(source, destination, options); copied = true; settingsRoot = newBase;
      } } },
    });
    await rejected(ctx, transfer, parts(), /Projektablage.*geändert/);
    assert.equal(copied, true); assert.equal(fs.existsSync(target), false); assert.equal(ctx.repo.getById("imported"), undefined);
    assert.deepEqual(fs.readdirSync(newBase), ["keep.txt"]); assert.equal(fs.readFileSync(path.join(newBase, "keep.txt"), "utf8"), "Other");
  }, { modules: ["sigeko"] }));
  await run("S5.3b2-Transfer: downstream DB failure rolls back rows and removes copied owned folder", () => fixture(async ctx => {
    const candidate = parts(); candidate["data/project_candidates.json"].project_candidates = [{ impossible_column: true }];
    candidate["manifest.json"].counts.projectCandidates = 1;
    await rejected(ctx, register(ctx), candidate, /impossible_column/);
    assert.equal(fs.existsSync(path.join(ctx.root, "bbm", resolveProjectFolderName({ name: "PDF-Archiv" }))), false);
  }, { modules: ["sigeko"] }));
  await run("S5.3b2-Transfer: preexisting and concurrently reserved target folders remain untouched", async () => {
    for (const concurrent of [false, true]) await fixture(async ctx => {
      const target = path.join(ctx.root, "bbm", resolveProjectFolderName({ name: "PDF-Archiv" }));
      const createOther = () => { fs.mkdirSync(target, { recursive: true }); fs.writeFileSync(path.join(target, "keep.txt"), "Other"); };
      if (!concurrent) createOther();
      const overrides = concurrent ? { fs: { ...fs, promises: { ...fs.promises, mkdir: async (dir, options) => {
        if (dir === target && !options) createOther(); return fs.promises.mkdir(dir, options);
      } } } } : {};
      await rejected(ctx, register(ctx, overrides), parts()); assert.equal(fs.readFileSync(path.join(target, "keep.txt"), "utf8"), "Other");
    }, { modules: ["sigeko"] });
  });
  await run("S5.3b2-Transfer: changed, missing and linked source PDFs prevent destructive export", async () => {
    for (const failure of ["changed", "missing", "linked"]) await fixture(async ctx => {
      const project = ctx.repo.createProject({ name: "Keep source" }); const row = document(project.id); insert(ctx, row); filesAt(folder(ctx, project), row);
      const file = path.join(folder(ctx, project), "SiGeKo/Unterlagen/document-main.pdf");
      if (failure === "changed") fs.writeFileSync(file, "changed"); else fs.unlinkSync(file);
      if (failure === "linked") { const external = path.join(ctx.root, "outside.pdf"); fs.writeFileSync(external, pdf("main")); fs.symlinkSync(external, file); }
      const before = domainRows(ctx); const result = await register(ctx).exportProject(project.id); assert.equal(result.ok, false);
      assert.deepEqual(domainRows(ctx), before); assert.equal(fs.existsSync(folder(ctx, project)), true);
    }, { modules: ["sigeko"] });
  });
  await run("S5.3b2-Transfer: actual ZIP hash validation prevents deletion even when source files remain correct", () => fixture(async ctx => {
    const project = ctx.repo.createProject({ name: "Keep source" }); const row = document(project.id); insert(ctx, row); filesAt(folder(ctx, project), row);
    const corruptArchiver = (...args) => { const zip = archiver(...args); zip.directory = () => {
      zip.append("%PDF-1.4 corrupt archive only", { name: "project-folder/SiGeKo/Unterlagen/document-main.pdf" }); return zip;
    }; return zip; };
    const before = domainRows(ctx); const result = await register(ctx, { archiver: corruptArchiver }).exportProject(project.id);
    assert.equal(result.ok, false); assert.match(result.error, /PDF/); assert.deepEqual(domainRows(ctx), before);
    assert.equal(fs.readFileSync(path.join(folder(ctx, project), "SiGeKo/Unterlagen/document-main.pdf"), "utf8"), pdf("main"));
  }, { modules: ["sigeko"] }));
  await run("S5.3b2-Transfer: project, new document and other project data changes during export block deletion", async () => {
    for (const mutation of ["project", "document", "settings", "source-file", "storage"]) await fixture(async ctx => {
      const project = ctx.repo.createProject({ name: "Keep source" }); const row = document(project.id); insert(ctx, row); filesAt(folder(ctx, project), row);
      let settingsRoot = ctx.root;
      const transfer = register(ctx, { "../db/appSettingsRepo": { appSettingsGetMany: () => ({ "pdf.protocolsDir": settingsRoot }) },
        "extract-zip": async (...args) => {
          await extract(...args);
          if (mutation === "project") ctx.repo.updateProject({ id: project.id, patch: { notes: "later" } });
          if (mutation === "document") { const added = document(project.id, "later"); insert(ctx, added); filesAt(folder(ctx, project), added); }
          if (mutation === "settings") ctx.db.prepare("INSERT INTO project_settings (project_id,key,value) VALUES (?, 'later', 'changed')").run(project.id);
          if (mutation === "source-file") fs.writeFileSync(path.join(folder(ctx, project), "SiGeKo/Unterlagen/document-main.pdf"), "changed later");
          if (mutation === "storage") settingsRoot = path.join(ctx.root, "other-storage");
        } });
      const result = await transfer.exportProject(project.id); assert.equal(result.ok, false, mutation);
      assert.ok(ctx.repo.getById(project.id)); assert.ok(ctx.db.prepare("SELECT id FROM sigeko_documents WHERE id=?").get(row.id));
      assert.equal(fs.existsSync(folder(ctx, project)), true);
      if (mutation === "document") assert.ok(ctx.db.prepare("SELECT id FROM sigeko_documents WHERE id='later'").get());
    }, { modules: ["sigeko"] });
  });
}
module.exports = { runSigekoDocumentTransferTests };
if (require.main === module) runSigekoDocumentTransferTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
