"use strict";
const path = require("node:path");
const fs = require("node:fs");
const { randomUUID, createHash } = require("node:crypto");
const { isDeepStrictEqual } = require("node:util");
const projectsRepo = require("../../db/projectsRepo");
const { enforceLicensedFeature } = require("../../licensing/featureGuard");
const { createProjectStorageAccess } = require("../../ipc/projectStoragePaths");
const { getPrintData } = require("../../print/printData");
const { createPreNotificationSnapshotService } = require("./PreNotificationSnapshotService");
const { createProjectAuthorityService } = require("./ProjectAuthorityService");
const { SigekoDocumentsRepository } = require("../../db/sigekoDocumentsRepo");
const { DOCUMENT_TYPE } = require("../../../shared/sigeko/preNotificationSnapshots.cjs");
const { PROJECT_AUTHORITY_COLUMNS } = require("../../../shared/sigeko/projectAuthorities.cjs");
const { validateSigekoDocumentRow, parseSigekoDocumentFiles } = require("../../../shared/sigeko/documents.cjs");
const { inspectDocumentFile } = require("./preNotificationDocumentFiles");

function fail(code, message) { throw Object.assign(new Error(message), { code }); }
function request(payload, keys) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      Reflect.ownKeys(payload).length !== keys.length || keys.some(key => !Object.hasOwn(payload, key))) fail("INVALID_INPUT", "Ungültiger Dokumentauftrag.");
  for (const key of keys.filter(key => key !== "expectedRevision")) {
    if (typeof payload[key] !== "string" || !payload[key].trim() || payload[key] !== payload[key].trim()) fail("INVALID_INPUT", "Eindeutige Dokumentidentität erforderlich.");
  }
}
function metadata(row) {
  return { id: row.id, projectId: row.project_id, createdAt: row.created_at, files: parseSigekoDocumentFiles(row) };
}
function createPreNotificationDocumentService({ repo = new SigekoDocumentsRepository(), projects = projectsRepo,
  captures = createPreNotificationSnapshotService(), authorities = createProjectAuthorityService(),
  storage = createProjectStorageAccess(), enforce = enforceLicensedFeature, firmsData = getPrintData,
  print = (...args) => require("../../ipc/printIpc").printToPdf(...args),
  open = payload => require("../../ipc/printIpc").openInternalPdfPreview(payload),
  uuid = randomUUID, now = Date.now, clock = () => new Date().toISOString() } = {}) {
  const jobs = new Set(), contexts = new Map();
  const ttl = 24 * 60 * 60 * 1000;
  function projectFor(projectId, writing = false) {
    enforce("sigeko");
    const project = projects.getById(projectId);
    if (!project) fail("PROJECT_NOT_FOUND", "Projekt nicht gefunden.");
    if (writing && project.archived_at) fail("PROJECT_ARCHIVED", "Archiviertes Projekt zuerst wiederherstellen.");
    return project;
  }
  function pathsFor(projectId) { return storage.resolve({ moduleId: "sigeko", projectId }); }
  function prune() { for (const [id, ctx] of contexts) if (ctx.editor && now() - ctx.startedAt >= ttl) contexts.delete(id); }
  function remember(snapshot, editor = false) {
    prune();
    if (editor) {
      const existing = [...contexts].filter(([, ctx]) => ctx.editor);
      while (existing.length >= 4) contexts.delete(existing.shift()[0]);
    }
    const contextId = uuid();
    contexts.set(contextId, { snapshot, editor, startedAt: now() });
    return contextId;
  }
  function providerRequest(snapshot, contextId) {
    return { moduleId: "sigeko", providerId: DOCUMENT_TYPE, projectId: snapshot.projectId,
      documentId: snapshot.documentId, storage: { target: "Unterlagen" }, data: { contextId } };
  }
  function printRequest(snapshot, contextId, temporary) {
    return { mode: "provider", documentTypeId: DOCUMENT_TYPE, projectId: snapshot.projectId, documentId: snapshot.documentId,
      providerRequest: providerRequest(snapshot, contextId), ...(temporary ? { targetDir: "temp" } : {}),
      fileName: `Vorankuendigung-${snapshot.documentId}.pdf`, silent: true };
  }
  function guard(snapshot, initialPaths, final) {
    const project = projectFor(snapshot.projectId, true);
    if (!isDeepStrictEqual(project, snapshot.printRuntimeContext.project) ||
        !isDeepStrictEqual(pathsFor(snapshot.projectId), initialPaths)) {
      fail("PRE_NOTIFICATION_SOURCE_CHANGED", "Projekt oder Ablage wurde während der PDF-Erstellung geändert. Bitte erneut laden.");
    }
    if (final) {
      const current = authorities.getProjectAuthorities({ projectId: snapshot.projectId }).categories.find(entry => entry.category === "LABOR_AUTHORITY");
      const evidence = current?.assignment && Object.fromEntries(PROJECT_AUTHORITY_COLUMNS.map(key => [key, current.assignment[key]]));
      if (current?.status !== "green" || snapshot.form.authorityStatus !== "green" ||
          !isDeepStrictEqual(evidence, snapshot.form.authorityEvidence)) {
        fail("AUTHORITY_NOT_READY", "Die aktuell zuständige Arbeitsschutzbehörde muss für diese Baustelle bestätigt sein. Bitte erneut prüfen.");
      }
    }
  }
  function cleanup(generated) {
    for (const result of generated) try {
      if (fs.lstatSync(result.filePath).isFile()) {
        const buffer = fs.readFileSync(result.filePath);
        if (buffer.length === result.byteSize && createHash("sha256").update(buffer).digest("hex") === result.sha256) fs.unlinkSync(result.filePath);
      }
    } catch (_) { /* A failed cleanup must not hide the original output error. */ }
  }
  function beforeFinalWrite(snapshot, paths, output) {
    guard(snapshot, paths, true);
    if (path.dirname(output.filePath) !== paths.targets.Unterlagen) fail("SIGEKO_DOCUMENT_FILE_INVALID", "PDF liegt außerhalb der vorgesehenen Projektablage.");
    for (const directory of [path.dirname(paths.moduleDir), paths.moduleDir, paths.targets.Unterlagen]) {
      if (!fs.lstatSync(directory).isDirectory()) fail("SIGEKO_DOCUMENT_FILE_INVALID", "Projektablage enthält einen unzulässigen Verweis.");
    }
  }
  function recordedFile(result, root, kind) {
    if (!result || typeof result.filePath !== "string") fail("SIGEKO_DOCUMENT_FILE_INVALID", "Druckauftrag hat keine überprüfbare PDF geliefert.");
    const file = { kind, projectRelativePath: path.relative(root, result.filePath).split(path.sep).join("/"),
      sha256: result.sha256, byteSize: result.byteSize };
    inspectDocumentFile(root, file);
    return file;
  }
  async function withCapture(payload, action) {
    request(payload, ["projectId", "expectedRevision"]);
    projectFor(payload.projectId, true);
    if (jobs.has(payload.projectId)) fail("SIGEKO_DOCUMENT_BUSY", "Für dieses Projekt läuft bereits ein PDF-Auftrag.");
    jobs.add(payload.projectId);
    try { return await action(await captures.capture(payload)); }
    finally { jobs.delete(payload.projectId); }
  }
  return Object.freeze({
    async previewPreNotificationPdf(payload) {
      return withCapture(payload, async snapshot => {
        const paths = pathsFor(snapshot.projectId), contextId = remember(snapshot), generated = [];
        try {
          guard(snapshot, paths, false);
          const result = await print(printRequest(snapshot, contextId, true), {
            beforeWrite: () => guard(snapshot, paths, false), exclusiveWrite: true, includeMetadata: true });
          generated.push(result);
          guard(snapshot, paths, false);
          await open({ filePath: result.filePath, title: "Vorankündigung – Vorschau" });
          return { opened: true };
        } catch (error) { cleanup(generated); throw error; }
        finally { contexts.delete(contextId); }
      });
    },
    async createPreNotificationPdf(payload) {
      return withCapture(payload, async snapshot => {
        const paths = pathsFor(snapshot.projectId), root = path.dirname(paths.moduleDir), contextId = remember(snapshot), generated = [];
        try {
          guard(snapshot, paths, true);
          let attachment = null;
          if (snapshot.form.firmsMode === "attachment") {
            const preparedData = await firmsData({ mode: "firms", projectId: snapshot.projectId, orientation: "portrait" });
            guard(snapshot, paths, true);
            if (!Array.isArray(preparedData?.firms) || !preparedData.firms.length) fail("FIRMS_ATTACHMENT_EMPTY", "Für die Anlage sind keine aktiven Projektfirmen vorhanden.");
            const result = await print({ mode: "firms", moduleId: "sigeko", projectId: snapshot.projectId,
              storage: { target: "Unterlagen" }, orientation: "portrait", silent: true,
              fileName: `Firmenliste-Vorankuendigung-${snapshot.documentId}.pdf` },
            { preparedData, beforeWrite: output => beforeFinalWrite(snapshot, paths, output), exclusiveWrite: true, includeMetadata: true });
            generated.push(result); attachment = recordedFile(result, root, "firms");
          }
          const result = await print(printRequest(snapshot, contextId, false), {
            beforeWrite: output => beforeFinalWrite(snapshot, paths, output), exclusiveWrite: true, includeMetadata: true });
          generated.push(result);
          const files = [recordedFile(result, root, "main"), ...(attachment ? [attachment] : [])];
          const row = { id: snapshot.documentId, project_id: snapshot.projectId, document_type: DOCUMENT_TYPE,
            snapshot_json: JSON.stringify(snapshot), files_json: JSON.stringify(files), created_at: clock() };
          validateSigekoDocumentRow(row, snapshot.projectId);
          const saved = repo.transaction(() => {
            guard(snapshot, paths, true);
            files.forEach(file => inspectDocumentFile(root, file));
            return repo.insert(row);
          });
          return { document: metadata(saved) };
        } catch (error) { cleanup(generated); throw error; }
        finally { contexts.delete(contextId); }
      });
    },
    async preparePreNotificationPdfEditor(payload) {
      return withCapture(payload, async snapshot => {
        const paths = pathsFor(snapshot.projectId); guard(snapshot, paths, false);
        const contextId = remember(snapshot, true);
        return { context: { documentTypeId: DOCUMENT_TYPE, projectId: snapshot.projectId, documentId: snapshot.documentId,
          providerRequest: providerRequest(snapshot, contextId) } };
      });
    },
    listPreNotificationDocuments(payload) {
      request(payload, ["projectId"]); projectFor(payload.projectId);
      return { documents: repo.list(payload.projectId).map(metadata) };
    },
    async openPreNotificationDocumentFile(payload) {
      request(payload, ["projectId", "documentId", "kind"]); projectFor(payload.projectId);
      const row = repo.get(payload.projectId, payload.documentId);
      if (!row) fail("SIGEKO_DOCUMENT_NOT_FOUND", "Dokumentfassung gehört nicht zu diesem Projekt oder fehlt.");
      const file = parseSigekoDocumentFiles(row).find(entry => entry.kind === payload.kind);
      if (!file) fail("SIGEKO_DOCUMENT_FILE_NOT_FOUND", "Diese Fassung enthält die ausgewählte Datei nicht.");
      const filePath = inspectDocumentFile(path.dirname(pathsFor(payload.projectId).moduleDir), file);
      await open({ filePath, title: payload.kind === "firms" ? "Vorankündigung – Firmenanlage" : "Vorankündigung" });
      return { opened: true };
    },
    resolveProviderDocument({ input, identity }) {
      if (identity?.moduleId !== "sigeko") fail("PDF_PROVIDER_DATA_INVALID", "Falsches Dokumentmodul.");
      projectFor(identity.projectId);
      prune();
      let snapshot;
      if (input && Object.hasOwn(input, "contextId")) {
        request(input, ["contextId"]);
        snapshot = contexts.get(input.contextId)?.snapshot;
        if (!snapshot) fail("SIGEKO_DOCUMENT_CONTEXT_EXPIRED", "PDF-Kontext ist abgelaufen. Bitte im Formular erneut vorbereiten.");
        projectFor(identity.projectId, true);
      } else {
        request(input, []);
        const row = repo.get(identity.projectId, identity.documentId);
        if (!row) fail("SIGEKO_DOCUMENT_NOT_FOUND", "Gespeicherte Dokumentfassung fehlt.");
        snapshot = JSON.parse(row.snapshot_json);
      }
      if (snapshot.projectId !== identity.projectId || snapshot.documentId !== identity.documentId) fail("PDF_PROVIDER_DATA_INVALID", "PDF-Kontext gehört nicht zu diesem Dokument und Projekt.");
      const printRuntimeContext = structuredClone(snapshot.printRuntimeContext);
      printRuntimeContext.printProfile = { ...printRuntimeContext.printProfile, documentLabel: "Vorankündigung",
        header: { ...printRuntimeContext.printProfile?.header, titleMode: "documentLabel" } };
      return { kind: DOCUMENT_TYPE, snapshot: structuredClone(snapshot), printRuntimeContext };
    },
  });
}
let singleton;
function getPreNotificationDocumentService() { return singleton ||= createPreNotificationDocumentService(); }
module.exports = Object.freeze({ createPreNotificationDocumentService, getPreNotificationDocumentService });
