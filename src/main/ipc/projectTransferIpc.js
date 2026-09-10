// src/main/ipc/projectTransferIpc.js
//
// Exportiert ein Projekt als ZIP und entfernt es anschließend lokal.
// Enthält nur Export – Import ist nicht Teil dieses Prompts.

const { ipcMain, app, shell } = require("electron");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const yauzl = require("yauzl");
const extract = require("extract-zip");
const { isDeepStrictEqual } = require("node:util");

const { initDatabase } = require("../db/database");
const { PROJECT_AUTHORITY_COLUMNS, validateProjectAuthorityRow } = require("../../shared/sigeko/projectAuthorities.cjs");
const { PRE_NOTIFICATION_COLUMNS, validatePreNotificationRow } = require("../../shared/sigeko/preNotifications.cjs");
const { SIGEKO_DOCUMENT_COLUMNS, validateSigekoDocumentRow, parseSigekoDocumentFiles } = require("../../shared/sigeko/documents.cjs");
const { SIGEKO_PRE_NOTIFICATION_WORKFLOW_COLUMNS, validatePreNotificationWorkflowRow, parseSignedReturnFile } = require("../../shared/sigeko/preNotificationWorkflows.cjs");
const { inspectDocumentFile } = require("../domain/sigeko/preNotificationDocumentFiles");
const { appSettingsGetMany } = require("../db/appSettingsRepo");
const projectsRepo = require("../db/projectsRepo");
const { buildStoragePreviewPaths, sanitizeDirName, resolveProjectFolderName } = require("./projectStoragePaths");

function _getExportRoot() {
  const settings = appSettingsGetMany(["pdf.protocolsDir"]) || {};
  const baseDir = String(settings["pdf.protocolsDir"] || "").trim() || app.getPath("downloads");
  return path.join(baseDir, "bbm", "export");
}

function _isPathInside(childPath, parentPath) {
  const absChild = path.resolve(String(childPath || ""));
  const absParent = path.resolve(String(parentPath || ""));
  return absChild == absParent || absChild.startsWith(absParent + path.sep);
}

function _sanitizeFilePart(value, fallback = "Projekt") {
  const clean = String(value || "").trim() || fallback;
  return sanitizeDirName(clean).replace(/\s+/g, "-");
}

function _buildProjectTransferManifest({ projectId, project, storage, data, exportedAt, filesCount }) {
  return {
    formatVersion: data.sigekoPreNotificationWorkflows?.length ? 9
      : data.sigekoDocuments?.length ? 8
      : data.sigekoPreNotifications?.length ? 7
      : data.sigekoProjectAuthorities?.length ? 6
      : project.bauherr_firm_kind != null || project.bauherr_firm_id != null ? 5
      : data.sigekoProjects?.length ? 4 : 3,
    firmLogicSchemaVersion: 1,
    exportDate: exportedAt,
    appVersion: app.getVersion ? app.getVersion() : "",
    projectId,
    projectNumber: project.project_number ?? project.projectNumber ?? null,
    projectShortName: project.short ?? null,
    projectName: project.name ?? null,
    projectFolder: {
      baseDir: storage.baseDir,
      folder: storage.projectFolder,
    },
    counts: {
      meetings: data.meetings.length,
      tops: data.tops.length,
      meetingTops: data.meetingTops.length,
      meetingParticipants: data.meetingParticipants.length,
      projectFirms: data.projectFirms.length,
      projectPersons: data.projectPersons.length,
      projectCandidates: data.projectCandidates.length,
      projectGlobalFirms: data.projectGlobalFirms.length,
      projectSettings: data.projectSettings.length,
      restarbeitenItems: data.restarbeitenItems.length,
      sigekoProjects: data.sigekoProjects?.length || 0,
      globalFirmDependencies: data.globalFirmDependencies.length,
      filesCount,
      ...(data.sigekoPreNotificationWorkflows?.length ? { sigekoPreNotificationWorkflows: data.sigekoPreNotificationWorkflows.length } : {}),
      ...(data.sigekoDocuments?.length ? { sigekoDocuments: data.sigekoDocuments.length } : {}),
      ...(data.sigekoPreNotifications?.length || data.sigekoDocuments?.length ? { sigekoPreNotifications: data.sigekoPreNotifications?.length || 0 } : {}),
      ...(data.sigekoProjectAuthorities?.length || data.sigekoPreNotifications?.length || data.sigekoDocuments?.length ? {
        sigekoProjectAuthorities: data.sigekoProjectAuthorities?.length || 0,
        restarbeitenAttachments: data.restarbeitenAttachments.length,
        restarbeitenNotes: data.restarbeitenNotes.length,
        globalPersonDependencies: data.globalPersonDependencies.length,
      } : {}),
    },
  };
}

function _buildProjectTransferPayloads({ project, data }) {
  return [
    { name: "data/project.json", data: { project } },
    ...(data.sigekoProjects?.length ? [{ name: "data/sigeko_projects.json", data: { sigeko_projects: data.sigekoProjects } }] : []),
    ...(data.sigekoPreNotificationWorkflows?.length ? [{ name: "data/sigeko_pre_notification_workflows.json", data: { sigeko_pre_notification_workflows: data.sigekoPreNotificationWorkflows } }] : []),
    ...(data.sigekoDocuments?.length ? [{ name: "data/sigeko_documents.json", data: { sigeko_documents: data.sigekoDocuments } }] : []),
    ...(data.sigekoPreNotifications?.length || data.sigekoDocuments?.length ? [{ name: "data/sigeko_pre_notifications.json", data: { sigeko_pre_notifications: data.sigekoPreNotifications || [] } }] : []),
    ...(data.sigekoProjectAuthorities?.length || data.sigekoPreNotifications?.length || data.sigekoDocuments?.length ? [{ name: "data/sigeko_project_authorities.json", data: { sigeko_project_authorities: data.sigekoProjectAuthorities || [] } }] : []),
    { name: "data/settings.json", data: { projectSettings: data.projectSettings || [] } },
    { name: "data/meetings.json", data: { meetings: data.meetings || [] } },
    { name: "data/tops.json", data: { tops: data.tops || [] } },
    { name: "data/meeting_tops.json", data: { meeting_tops: data.meetingTops || [] } },
    { name: "data/meeting_participants.json", data: { meeting_participants: data.meetingParticipants || [] } },
    { name: "data/project_firms.json", data: { project_firms: data.projectFirms || [] } },
    { name: "data/project_persons.json", data: { project_persons: data.projectPersons || [] } },
    { name: "data/project_candidates.json", data: { project_candidates: data.projectCandidates || [] } },
    { name: "data/project_global_firms.json", data: { project_global_firms: data.projectGlobalFirms || [] } },
    {
      name: "data/global_firm_dependencies.json",
      data: {
        firms: data.globalFirmDependencies || [],
        persons: data.globalPersonDependencies || [],
      },
    },
    { name: "data/restarbeiten_items.json", data: { restarbeiten_items: data.restarbeitenItems || [] } },
    { name: "data/restarbeiten_attachments.json", data: { restarbeiten_attachments: data.restarbeitenAttachments || [] } },
    { name: "data/restarbeiten_notes.json", data: { restarbeiten_notes: data.restarbeitenNotes || [] } },
  ];
}

function _fetchProjectData(projectId, project) {
  const db = initDatabase();

  // Nicht aktivierte Fachmodule haben auf einer neuen Datenbank keine Tabellen.
  const projectRows = (table) => db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)
    ? db.prepare(`SELECT * FROM ${table} WHERE project_id = ?`).all(projectId) : [];
  const meetings = projectRows("meetings");
  const meetingIds = meetings.map((m) => m.id).filter(Boolean);

  const tops = projectRows("tops");

  const meetingTops =
    meetingIds.length === 0
      ? []
      : db
          .prepare(
            `SELECT * FROM meeting_tops WHERE meeting_id IN (${meetingIds.map(() => "?").join(",")})`
          )
          .all(...meetingIds);

  const meetingParticipants =
    meetingIds.length === 0
      ? []
      : db
          .prepare(
            `SELECT * FROM meeting_participants WHERE meeting_id IN (${meetingIds
              .map(() => "?")
              .join(",")})`
          )
          .all(...meetingIds);

  const projectFirms = db.prepare("SELECT * FROM project_firms WHERE project_id = ?").all(projectId);
  const projectFirmIds = projectFirms.map((f) => f.id).filter(Boolean);

  const projectPersons =
    projectFirmIds.length === 0
      ? []
      : db
          .prepare(
            `SELECT * FROM project_persons WHERE project_firm_id IN (${projectFirmIds
              .map(() => "?")
              .join(",")})`
          )
          .all(...projectFirmIds);

  const projectCandidates = db
    .prepare("SELECT * FROM project_candidates WHERE project_id = ?")
    .all(projectId);

  const projectGlobalFirms = db
    .prepare("SELECT * FROM project_global_firms WHERE project_id = ?")
    .all(projectId);

  const projectSettings = db
    .prepare("SELECT key, value FROM project_settings WHERE project_id = ?")
    .all(projectId);

  const restarbeitenItems = projectRows("restarbeiten_items");
  const restarbeitIds = restarbeitenItems.map((item) => item.id).filter(Boolean);
  const restarbeitenAttachments = restarbeitIds.length
    ? db
        .prepare(`SELECT * FROM restarbeiten_attachments WHERE restarbeit_id IN (${restarbeitIds.map(() => "?").join(",")})`)
        .all(...restarbeitIds)
    : [];
  const restarbeitenNotes = restarbeitIds.length
    ? db
        .prepare(`SELECT * FROM restarbeiten_notes WHERE restarbeit_id IN (${restarbeitIds.map(() => "?").join(",")})`)
        .all(...restarbeitIds)
    : [];

  const sigekoProjects = projectRows("sigeko_projects");
  const sigekoProjectAuthorities = projectRows("sigeko_project_authorities");
  _validateProjectAuthorities(sigekoProjectAuthorities, projectId);
  const sigekoPreNotifications = projectRows("sigeko_pre_notifications");
  _validatePreNotifications(sigekoPreNotifications, projectId);
  const sigekoDocuments = projectRows("sigeko_documents");
  _validateSigekoDocuments(sigekoDocuments, projectId);
  const sigekoPreNotificationWorkflows = projectRows("sigeko_pre_notification_workflows");
  _validateSigekoWorkflows(sigekoPreNotificationWorkflows, sigekoDocuments, projectId);
  const globalFirmIds = new Set(projectGlobalFirms.map((row) => String(row.firm_id || "")).filter(Boolean));
  if (project?.bauherr_firm_kind === "global_firm" && project.bauherr_firm_id) {
    globalFirmIds.add(project.bauherr_firm_id);
  }
  for (const row of meetingTops) {
    if (row.responsible_kind === "global_firm" && row.responsible_id) globalFirmIds.add(String(row.responsible_id));
  }
  for (const row of restarbeitenItems) {
    if (row.responsible_global_firm_id) globalFirmIds.add(String(row.responsible_global_firm_id));
  }
  const referencedGlobalPersonIds = new Set();
  for (const row of sigekoProjects) for (const role of ["planning", "execution"]) {
    if (row[`${role}_person_id`]) referencedGlobalPersonIds.add(row[`${role}_person_id`]);
  }
  for (const row of projectCandidates) {
    if (row.kind === "global_person" && row.person_id) referencedGlobalPersonIds.add(String(row.person_id));
  }
  for (const row of meetingParticipants) {
    if (row.kind === "global_person" && row.person_id) referencedGlobalPersonIds.add(String(row.person_id));
  }
  const referencedGlobalPersons = referencedGlobalPersonIds.size
    ? db
        .prepare(`SELECT * FROM persons WHERE id IN (${[...referencedGlobalPersonIds].map(() => "?").join(",")})`)
        .all(...referencedGlobalPersonIds)
    : [];
  for (const person of referencedGlobalPersons) {
    if (person.firm_id) globalFirmIds.add(String(person.firm_id));
  }
  const globalFirmDependencies = globalFirmIds.size
    ? db
        .prepare(`SELECT * FROM firms WHERE id IN (${[...globalFirmIds].map(() => "?").join(",")})`)
        .all(...globalFirmIds)
    : [];
  const globalPersonDependencies = globalFirmIds.size
    ? db
        .prepare(`SELECT * FROM persons WHERE firm_id IN (${[...globalFirmIds].map(() => "?").join(",")})`)
        .all(...globalFirmIds)
    : [];

  return {
    meetings,
    meetingTops,
    meetingParticipants,
    tops,
    projectFirms,
    projectPersons,
    projectCandidates,
    projectGlobalFirms,
    projectSettings,
    restarbeitenItems,
    restarbeitenAttachments,
    restarbeitenNotes,
    globalFirmDependencies,
    globalPersonDependencies,
    sigekoProjects,
    sigekoProjectAuthorities,
    sigekoPreNotifications,
    sigekoDocuments,
    sigekoPreNotificationWorkflows,
  };
}

// Keep the module's strict row contract at the shared transfer boundary, before
// any project data can be deleted on export or inserted on import.
function _validateProjectAuthorities(rows, projectId) {
  if (!Array.isArray(rows) || rows.length > 7) throw new Error("Ungültige SiGeKo-Behördenzuordnungen im Archiv.");
  const ids = new Set();
  const categories = new Set();
  for (const row of rows) {
    validateProjectAuthorityRow(row, projectId);
    if (ids.has(row.id) || categories.has(row.category)) throw new Error("Doppelte SiGeKo-Behördenzuordnung im Archiv.");
    ids.add(row.id);
    categories.add(row.category);
  }
}

function _validatePreNotifications(rows, projectId) {
  if (!Array.isArray(rows) || rows.length > 1) throw new Error("Ungültige SiGeKo-Vorankündigungen im Archiv.");
  for (const row of rows) validatePreNotificationRow(row, projectId);
}

function _validateSigekoDocuments(rows, projectId) {
  if (!Array.isArray(rows)) throw new Error("Ungültige SiGeKo-Dokumente im Archiv.");
  const ids = new Set();
  const paths = new Set();
  for (const row of rows) {
    validateSigekoDocumentRow(row, projectId);
    if (ids.has(row.id)) throw new Error("Doppelte SiGeKo-Dokument-ID im Archiv.");
    ids.add(row.id);
    for (const file of parseSigekoDocumentFiles(row)) {
      // Archive must remain unambiguous on both Windows and Linux.
      const key = file.projectRelativePath.toLocaleLowerCase("en-US");
      if (paths.has(key)) throw new Error("Doppelte SiGeKo-Dokumentdatei im Archiv.");
      paths.add(key);
    }
  }
}

function _validateSigekoWorkflows(rows, documents, projectId) {
  if (!Array.isArray(rows)) throw new Error("Ungültige SiGeKo-Vorankündigungsabläufe im Archiv.");
  const documentIds = new Set(documents.map(row => row.id));
  const workflowIds = new Set();
  const paths = new Set(documents.flatMap(parseSigekoDocumentFiles).map(file => file.projectRelativePath.toLocaleLowerCase("en-US")));
  for (const row of rows) {
    validatePreNotificationWorkflowRow(row, projectId);
    if (!documentIds.has(row.document_id)) throw new Error("SiGeKo-Ablauf verweist auf keine Dokumentfassung dieses Projekts.");
    if (workflowIds.has(row.document_id)) throw new Error("Doppelter SiGeKo-Dokumentablauf im Archiv.");
    workflowIds.add(row.document_id);
    const file = parseSignedReturnFile(row);
    if (file) {
      const key = file.projectRelativePath.toLocaleLowerCase("en-US");
      if (paths.has(key)) throw new Error("Doppelte SiGeKo-Rücklaufdatei im Archiv.");
      paths.add(key);
    }
  }
}

function _validateSigekoDocumentFiles(projectRoot, rows, workflows = []) {
  for (const row of rows) for (const file of parseSigekoDocumentFiles(row)) {
    inspectDocumentFile(projectRoot, file);
  }
  for (const row of workflows) {
    const file = parseSignedReturnFile(row);
    if (file) inspectDocumentFile(projectRoot, file);
  }
}

async function _validateArchivedSigekoDocumentFiles(exportPath, rows, workflows = []) {
  const tempDir = await fs.promises.mkdtemp(path.join(app.getPath("temp"), "bbm-export-verify-"));
  try {
    await _extractZipToTemp(exportPath, tempDir);
    _validateSigekoDocumentFiles(path.join(tempDir, "project-folder"), rows, workflows);
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
}

function _validateGlobalDependencies(db, payload, { requireSnapshots = false } = {}) {
  const declared = Array.isArray(payload.globalFirmDependencies) ? payload.globalFirmDependencies : [];
  const requiredIds = new Set(
    (payload.projectGlobalFirms || []).map((row) => String(row?.firm_id || "")).filter(Boolean)
  );
  if (payload.project?.bauherr_firm_kind === "global_firm" && payload.project.bauherr_firm_id) {
    requiredIds.add(payload.project.bauherr_firm_id);
  }
  for (const row of payload.meetingTops || []) {
    if (row?.responsible_kind === "global_firm" && row?.responsible_id) requiredIds.add(String(row.responsible_id));
  }
  for (const row of payload.restarbeitenItems || []) {
    if (row?.responsible_global_firm_id) requiredIds.add(String(row.responsible_global_firm_id));
  }
  const declaredById = new Map(declared.map((row) => [String(row?.id || ""), row]));
  const diagnostics = [];
  if (payload.project?.bauherr_firm_kind === "global_firm" &&
      declared.filter(row => row?.id === payload.project.bauherr_firm_id).length > 1) {
    diagnostics.push(`Mehrdeutiger Snapshot der Bauherrfirma: ${payload.project.bauherr_firm_id}`);
  }
  for (const id of requiredIds) {
    const existing = db.prepare("SELECT id, name FROM firms WHERE id = ?").get(id);
    if (!existing) {
      diagnostics.push(`Globale Firmenabhängigkeit fehlt: ${id}`);
      continue;
    }
    const snapshot = declaredById.get(id);
    if (requireSnapshots && !snapshot) {
      diagnostics.push(`Snapshot der globalen Firmenabhängigkeit fehlt: ${id}`);
    } else if (snapshot && String(snapshot.name || "").trim() !== String(existing.name || "").trim()) {
      diagnostics.push(`Globale Firmenabhängigkeit kollidiert: ${id}`);
    }
  }
  const requiredPersonIds = new Set();
  for (const row of payload.sigekoProjects || []) for (const role of ["planning", "execution"]) {
    if (row[`${role}_person_id`]) requiredPersonIds.add(row[`${role}_person_id`]);
  }
  for (const row of payload.projectCandidates || []) {
    if (row?.kind === "global_person" && row?.person_id) requiredPersonIds.add(String(row.person_id));
  }
  for (const row of payload.meetingParticipants || []) {
    if (row?.kind === "global_person" && row?.person_id) requiredPersonIds.add(String(row.person_id));
  }
  const personSnapshots = new Map(
    (payload.globalPersonDependencies || []).map((row) => [String(row?.id || ""), row])
  );
  for (const id of requiredPersonIds) {
    const existing = db.prepare("SELECT id, firm_id, name FROM persons WHERE id = ?").get(id);
    if (!existing) {
      diagnostics.push(`Globale Personenabhängigkeit fehlt: ${id}`);
      continue;
    }
    const snapshot = personSnapshots.get(id);
    if (requireSnapshots && !snapshot) {
      diagnostics.push(`Snapshot der globalen Personenabhängigkeit fehlt: ${id}`);
    } else if (
      snapshot &&
      (String(snapshot.firm_id || "") !== String(existing.firm_id || "") ||
        String(snapshot.name || "").trim() !== String(existing.name || "").trim())
    ) {
      diagnostics.push(`Globale Personenabhängigkeit kollidiert: ${id}`);
    }
  }
  if (diagnostics.length) {
    const error = new Error(diagnostics.join("; "));
    error.code = "PROJECT_TRANSFER_GLOBAL_DEPENDENCY";
    throw error;
  }
}

// V5 prevents older importers from silently discarding the explicit central reference.
// A project firm travels in this project's snapshots; global firms retain the existing
// dependency policy (matching firm already present on the receiving installation).
function _validateProjectBuilderReference(payload, { formatVersion }) {
  const project = payload.project || {};
  const kind = project.bauherr_firm_kind ?? null;
  const id = project.bauherr_firm_id ?? null;
  if (kind === null && id === null) {
    if (formatVersion === 5) throw new Error("Bauherrreferenz fehlt im V5-Projektarchiv.");
    return null;
  }
  if (formatVersion < 5) throw new Error("Bauherrreferenz erfordert Projektarchiv-Version 5.");
  if (!["global_firm", "project_firm"].includes(kind) || typeof id !== "string" || !id.trim() || id !== id.trim()) {
    throw new Error("Ungültige Bauherrreferenz im Projektarchiv.");
  }
  if (kind === "project_firm") {
    const matches = (payload.projectFirms || []).filter(row => row?.id === id);
    if (matches.length !== 1 || matches[0].project_id !== project.id) {
      throw new Error("Bauherr-Projektfirma fehlt oder gehört nicht zum importierten Projekt.");
    }
  }
  return { kind, id };
}

async function _countFilesRecursive(dirPath) {
  let count = 0;
  const stack = [dirPath];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    let entries = [];
    try {
      entries = await fs.promises.readdir(current, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else count += 1;
    }
  }
  return count;
}

async function _createExportZip({ exportPath, projectDir, manifest, payloads }) {
  await fs.promises.mkdir(path.dirname(exportPath), { recursive: true });

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(exportPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);

    archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
    for (const part of payloads) {
      archive.append(JSON.stringify(part.data || {}, null, 2), { name: part.name });
    }

    if (projectDir && fs.existsSync(projectDir)) {
      archive.directory(projectDir, "project-folder");
    } else {
      // Stelle sicher, dass project-folder im ZIP existiert (auch leer)
      archive.append("", { name: "project-folder/" });
    }

    archive.finalize();
  });
}

function _validateExportZip(exportPath) {
  return new Promise((resolve, _reject) => {
    try {
      const stat = fs.statSync(exportPath);
      if (!stat.isFile() || stat.size <= 0) return resolve({ ok: false, error: "Exportdatei leer." });
    } catch (err) {
      return resolve({ ok: false, error: err?.message || "Exportdatei fehlt." });
    }

    const expect = { manifest: false, projectFolder: false };

    yauzl.open(exportPath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) return resolve({ ok: false, error: err?.message || "ZIP konnte nicht geöffnet werden." });

      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        const name = entry.fileName || "";
        if (name === "manifest.json") expect.manifest = true;
        if (name.startsWith("project-folder/")) expect.projectFolder = true;
        zipfile.readEntry();
      });

      zipfile.on("error", (zipErr) => {
        resolve({ ok: false, error: zipErr?.message || "ZIP-Fehler." });
      });

      zipfile.on("end", () => {
        if (expect.manifest && expect.projectFolder) {
          resolve({ ok: true });
        } else {
          const missing = [];
          if (!expect.manifest) missing.push("manifest.json");
          if (!expect.projectFolder) missing.push("project-folder");
          resolve({ ok: false, error: `ZIP unvollständig: ${missing.join(", ")}` });
        }
      });
    });
  });
}

async function _readJsonSafe(filePath, label) {
  try {
    const raw = await fs.promises.readFile(filePath, "utf8");
    return { ok: true, data: JSON.parse(raw) };
  } catch (err) {
    return { ok: false, error: `${label || "JSON"} ungÃ¼ltig: ${err?.message || err}` };
  }
}

function _rowExists(db, table, id) {
  const row = db.prepare(`SELECT 1 AS one FROM ${table} WHERE id = ? LIMIT 1`).get(id);
  return !!row;
}

async function _extractZipToTemp(filePath, tempDir) {
  await fs.promises.mkdir(tempDir, { recursive: true });
  await extract(filePath, { dir: tempDir });
}

async function _readJsonIfExists(filePath, label) {
  try {
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) return { ok: true, data: null };
  } catch (_e) {
    return { ok: true, data: null };
  }
  return _readJsonSafe(filePath, label);
}

function _insertRow(db, table, row) {
  if (!row || typeof row !== "object") return;
  const cols = Object.keys(row);
  if (!cols.length) return;
  const placeholders = cols.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`;
  db.prepare(sql).run(cols.map((k) => row[k] ?? null));
}

function _insertRows(db, table, rows = []) {
  for (const r of rows) _insertRow(db, table, r);
}

function _withLegacyFirmUseDefaults(rows = []) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    ...(row || {}),
    use_project_participant:
      row?.use_project_participant === undefined ? 1 : Number(row.use_project_participant) === 1 ? 1 : 0,
    use_customer: row?.use_customer === undefined ? 0 : Number(row.use_customer) === 1 ? 1 : 0,
  }));
}

function _sanitizeProjectRow(project) {
  if (!project || typeof project !== "object") return null;
  const map = {
    id: project.id,
    project_number: project.project_number ?? project.projectNumber ?? project.number ?? null,
    name: project.name ?? null,
    short: project.short ?? project.projectShortName ?? null,
    street: project.street ?? null,
    zip: project.zip ?? null,
    city: project.city ?? null,
    project_lead: project.project_lead ?? project.projectLead ?? null,
    project_lead_phone: project.project_lead_phone ?? project.projectLeadPhone ?? null,
    start_date: project.start_date ?? project.startDate ?? null,
    geplanter_baubeginn: project.geplanter_baubeginn ?? null,
    end_date: project.end_date ?? project.endDate ?? null,
    notes: project.notes ?? null,
    archived_at: project.archived_at ?? project.archivedAt ?? null,
  };
  // Entferne undefined, damit INSERT nur vorhandene Spalten schreibt
  const cleaned = {};
  Object.entries(map).forEach(([k, v]) => {
    if (v !== undefined) cleaned[k] = v === null ? null : v;
  });
  return cleaned;
}

async function _importProjectZip(filePath) {
  if (!filePath) return { ok: false, error: "filePath required" };

  const absPath = path.resolve(String(filePath));
  try {
    const stat = await fs.promises.stat(absPath);
    if (!stat.isFile()) return { ok: false, error: "Datei nicht gefunden." };
  } catch (err) {
    return { ok: false, error: err?.message || "Datei nicht lesbar." };
  }

  const basicValidation = await _validateExportZip(absPath);
  if (!basicValidation.ok) return basicValidation;

  const tempDir = path.join(app.getPath("temp"), `bbm-import-${Date.now()}-${process.pid}`);
  let reservedTargetDir = null;
  try {
    await _extractZipToTemp(absPath, tempDir);

    const manifestPath = path.join(tempDir, "manifest.json");
    const dataDir = path.join(tempDir, "data");

    const manifestRes = await _readJsonSafe(manifestPath, "manifest");
    if (!manifestRes.ok) return { ok: false, error: manifestRes.error };
    const manifest = manifestRes.data || {};
    const formatVersion = Number(manifest.formatVersion || 1);
    if (!Number.isInteger(formatVersion) || formatVersion < 1 || formatVersion > 9) {
      return { ok: false, error: `Nicht unterstützte Projektarchiv-Version: ${manifest.formatVersion}` };
    }
    if (Number(manifest.firmLogicSchemaVersion || 0) > 1) {
      return { ok: false, error: "Projektarchiv verwendet eine neuere Firmenlogik-Version." };
    }

    // V6 and later are written only by the complete exporter. Do not interpret a
    // corrupt/missing payload as an empty collection and silently drop it.
    const completePayloadKeys = {
      "project.json": ["project"], "settings.json": ["projectSettings"],
      "meetings.json": ["meetings"], "tops.json": ["tops"],
      "meeting_tops.json": ["meeting_tops"], "meeting_participants.json": ["meeting_participants"],
      "project_firms.json": ["project_firms"], "project_persons.json": ["project_persons"],
      "project_candidates.json": ["project_candidates"], "project_global_firms.json": ["project_global_firms"],
      "global_firm_dependencies.json": ["firms", "persons"], "restarbeiten_items.json": ["restarbeiten_items"],
      "restarbeiten_attachments.json": ["restarbeiten_attachments"], "restarbeiten_notes.json": ["restarbeiten_notes"],
      "sigeko_project_authorities.json": ["sigeko_project_authorities"],
    };
    if (formatVersion >= 7) {
      if (manifest.formatVersion !== formatVersion) return { ok: false, error: `Ungültige V${formatVersion}-Archivversion.` };
      completePayloadKeys["sigeko_pre_notifications.json"] = ["sigeko_pre_notifications"];
      if (formatVersion >= 8) completePayloadKeys["sigeko_documents.json"] = ["sigeko_documents"];
      if (formatVersion >= 9) completePayloadKeys["sigeko_pre_notification_workflows.json"] = ["sigeko_pre_notification_workflows"];
      const allowed = new Set([...Object.keys(completePayloadKeys), "sigeko_projects.json"]);
      const entries = await fs.promises.readdir(dataDir, { withFileTypes: true });
      if (entries.some(entry => !entry.isFile() || !allowed.has(entry.name))) {
        return { ok: false, error: `Unbekannte V${formatVersion}-Projektdaten im Archiv.` };
      }
    }
    const readPayload = async (file, label) => {
      const result = await _readJsonIfExists(file, label);
      if (formatVersion >= 6) {
        if (!result.ok) throw new Error(result.error);
        const keys = completePayloadKeys[label] ||
          (label === "sigeko_projects.json" && fs.existsSync(file) ? ["sigeko_projects"] : null);
        if (keys && (!result.data || typeof result.data !== "object" || Array.isArray(result.data) ||
            Object.keys(result.data).length !== keys.length || keys.some(key => !Object.hasOwn(result.data, key)) ||
            keys.some(key => key === "project"
              ? !result.data[key] || typeof result.data[key] !== "object" || Array.isArray(result.data[key])
              : !Array.isArray(result.data[key])))) {
          throw new Error(`Ungültige oder fehlende V${formatVersion}-Daten: ${label}`);
        }
      }
      return result;
    };

    // Neue Exportstruktur: getrennte JSON-Dateien unter data/
    const payload = {};
    const projectJson = await readPayload(path.join(dataDir, "project.json"), "project.json");
    if (projectJson.ok && projectJson.data?.project) {
      payload.project = projectJson.data.project;
    }
    const settingsJson = await readPayload(path.join(dataDir, "settings.json"), "settings.json");
    if (settingsJson.ok) payload.projectSettings = settingsJson.data?.projectSettings || [];
    const meetingsJson = await readPayload(path.join(dataDir, "meetings.json"), "meetings.json");
    if (meetingsJson.ok) payload.meetings = meetingsJson.data?.meetings || [];
    const topsJson = await readPayload(path.join(dataDir, "tops.json"), "tops.json");
    if (topsJson.ok) payload.tops = topsJson.data?.tops || [];
    const mtJson = await readPayload(path.join(dataDir, "meeting_tops.json"), "meeting_tops.json");
    if (mtJson.ok) payload.meetingTops = mtJson.data?.meeting_tops || [];
    const mpJson = await readPayload(path.join(dataDir, "meeting_participants.json"), "meeting_participants.json");
    if (mpJson.ok) payload.meetingParticipants = mpJson.data?.meeting_participants || [];
    const pfJson = await readPayload(path.join(dataDir, "project_firms.json"), "project_firms.json");
    if (pfJson.ok) payload.projectFirms = pfJson.data?.project_firms || [];
    const ppJson = await readPayload(path.join(dataDir, "project_persons.json"), "project_persons.json");
    if (ppJson.ok) payload.projectPersons = ppJson.data?.project_persons || [];
    const pcJson = await readPayload(path.join(dataDir, "project_candidates.json"), "project_candidates.json");
    if (pcJson.ok) payload.projectCandidates = pcJson.data?.project_candidates || [];
    const pgfJson = await readPayload(path.join(dataDir, "project_global_firms.json"), "project_global_firms.json");
    if (pgfJson.ok) payload.projectGlobalFirms = pgfJson.data?.project_global_firms || [];
    const dependencyJson = await readPayload(
      path.join(dataDir, "global_firm_dependencies.json"),
      "global_firm_dependencies.json"
    );
    if (dependencyJson.ok) {
      payload.globalFirmDependencies = dependencyJson.data?.firms || [];
      payload.globalPersonDependencies = dependencyJson.data?.persons || [];
    }
    const restJson = await readPayload(path.join(dataDir, "restarbeiten_items.json"), "restarbeiten_items.json");
    if (restJson.ok) payload.restarbeitenItems = restJson.data?.restarbeiten_items || [];
    const restAttachmentsJson = await readPayload(
      path.join(dataDir, "restarbeiten_attachments.json"),
      "restarbeiten_attachments.json"
    );
    if (restAttachmentsJson.ok) payload.restarbeitenAttachments = restAttachmentsJson.data?.restarbeiten_attachments || [];
    const restNotesJson = await readPayload(path.join(dataDir, "restarbeiten_notes.json"), "restarbeiten_notes.json");
    if (restNotesJson.ok) payload.restarbeitenNotes = restNotesJson.data?.restarbeiten_notes || [];

    const sigekoJson = await readPayload(path.join(dataDir, "sigeko_projects.json"), "sigeko_projects.json");
    if (!sigekoJson.ok) return { ok: false, error: sigekoJson.error };
    if (formatVersion === 4 && !sigekoJson.data) return { ok: false, error: "SiGeKo-Projektdaten fehlen im Archiv." };
    payload.sigekoProjects = sigekoJson.data?.sigeko_projects ?? [];
    if (!Array.isArray(payload.sigekoProjects) || payload.sigekoProjects.length > 1 ||
        (formatVersion === 4 && payload.sigekoProjects.length !== 1)) {
      return { ok: false, error: "Ungültige SiGeKo-Projektzuordnung im Archiv." };
    }

    if (formatVersion === 5 && (manifest.counts?.sigekoProjects ?? 0) !== payload.sigekoProjects.length) {
      return { ok: false, error: "SiGeKo-Projektanzahl stimmt nicht mit dem V5-Manifest überein." };
    }

    const authorityJson = await readPayload(path.join(dataDir, "sigeko_project_authorities.json"), "sigeko_project_authorities.json");
    if (!authorityJson.ok) return { ok: false, error: authorityJson.error };
    if (formatVersion < 6 && fs.existsSync(path.join(dataDir, "sigeko_project_authorities.json"))) {
      return { ok: false, error: "SiGeKo-Behördenzuordnungen erfordern Projektarchiv-Version 6." };
    }
    payload.sigekoProjectAuthorities = authorityJson.data?.sigeko_project_authorities ?? [];
    if (formatVersion === 6 && !payload.sigekoProjectAuthorities.length) {
      return { ok: false, error: "SiGeKo-Behördenzuordnungen fehlen im V6-Archiv." };
    }

    const preNotificationPath = path.join(dataDir, "sigeko_pre_notifications.json");
    if (formatVersion < 7 && fs.existsSync(preNotificationPath)) {
      return { ok: false, error: "SiGeKo-Vorankündigungen erfordern Projektarchiv-Version 7." };
    }
    if (formatVersion >= 7) {
      const draftJson = await readPayload(preNotificationPath, "sigeko_pre_notifications.json");
      payload.sigekoPreNotifications = draftJson.data.sigeko_pre_notifications;
      if (formatVersion === 7 && payload.sigekoPreNotifications.length !== 1) return { ok: false, error: "SiGeKo-Vorankündigung fehlt im V7-Archiv." };
    }

    const documentPath = path.join(dataDir, "sigeko_documents.json");
    if (formatVersion < 8 && fs.existsSync(documentPath)) {
      return { ok: false, error: "SiGeKo-Dokumente erfordern Projektarchiv-Version 8." };
    }
    if (formatVersion >= 8) {
      const documentJson = await readPayload(documentPath, "sigeko_documents.json");
      payload.sigekoDocuments = documentJson.data.sigeko_documents;
      if (!payload.sigekoDocuments.length) return { ok: false, error: "SiGeKo-Dokumente fehlen im Dokumentarchiv." };
    }

    const workflowPath = path.join(dataDir, "sigeko_pre_notification_workflows.json");
    if (formatVersion < 9 && fs.existsSync(workflowPath)) {
      return { ok: false, error: "SiGeKo-Vorankündigungsabläufe erfordern Projektarchiv-Version 9." };
    }
    if (formatVersion >= 9) {
      const workflowJson = await readPayload(workflowPath, "sigeko_pre_notification_workflows.json");
      payload.sigekoPreNotificationWorkflows = workflowJson.data.sigeko_pre_notification_workflows;
      if (!payload.sigekoPreNotificationWorkflows.length) return { ok: false, error: "SiGeKo-Vorankündigungsabläufe fehlen im V9-Archiv." };
    }

    const project = payload.project;
    if (!project?.id) return { ok: false, error: "Projekt-ID fehlt im Export." };

    _validateProjectAuthorities(payload.sigekoProjectAuthorities, project.id);
    _validatePreNotifications(payload.sigekoPreNotifications || [], project.id);
    _validateSigekoDocuments(payload.sigekoDocuments || [], project.id);
    _validateSigekoWorkflows(payload.sigekoPreNotificationWorkflows || [], payload.sigekoDocuments || [], project.id);
    if (formatVersion >= 8) _validateSigekoDocumentFiles(path.join(tempDir, "project-folder"), payload.sigekoDocuments, payload.sigekoPreNotificationWorkflows);
    if (formatVersion >= 6) {
      if (manifest.projectId !== project.id) return { ok: false, error: `Fremder Projektbezug im V${formatVersion}-Manifest.` };
      const expectedCounts = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "project")
        .map(([key, rows]) => [key, Array.isArray(rows) ? rows.length : -1]));
      expectedCounts.filesCount = await _countFilesRecursive(path.join(tempDir, "project-folder"));
      const counts = manifest.counts;
      if (!counts || typeof counts !== "object" || Array.isArray(counts) ||
          Object.keys(counts).length !== Object.keys(expectedCounts).length ||
          Object.entries(expectedCounts).some(([key, count]) => !Number.isSafeInteger(counts[key]) || counts[key] !== count)) {
        return { ok: false, error: `Projektanzahlen stimmen nicht mit dem vollständigen V${formatVersion}-Manifest überein.` };
      }
    }

    const builder = _validateProjectBuilderReference(payload, { formatVersion });

    const projectNumber = project.project_number ?? project.projectNumber ?? manifest.projectNumber ?? null;
    const projectShortName = project.short ?? project.projectShortName ?? manifest.projectShortName ?? null;

    const db = initDatabase();
    if (payload.sigekoPreNotificationWorkflows?.length) {
      const columns = db.prepare("PRAGMA table_info(sigeko_pre_notification_workflows)").all().map(row => row.name);
      if (columns.length !== SIGEKO_PRE_NOTIFICATION_WORKFLOW_COLUMNS.length || SIGEKO_PRE_NOTIFICATION_WORKFLOW_COLUMNS.some(key => !columns.includes(key))) {
        return { ok: false, error: "SiGeKo muss vor diesem Import aktiviert und initialisiert sein (Vorankündigungsabläufe)." };
      }
      const exists = db.prepare("SELECT 1 FROM sigeko_pre_notification_workflows WHERE document_id = ? LIMIT 1");
      if (payload.sigekoPreNotificationWorkflows.some(row => exists.get(row.document_id))) {
        return { ok: false, error: "SiGeKo-Vorankündigungsablauf existiert bereits (Dokument-ID)." };
      }
    }
    if (payload.sigekoDocuments?.length) {
      const columns = db.prepare("PRAGMA table_info(sigeko_documents)").all().map(row => row.name);
      if (columns.length !== SIGEKO_DOCUMENT_COLUMNS.length || SIGEKO_DOCUMENT_COLUMNS.some(key => !columns.includes(key))) {
        return { ok: false, error: "SiGeKo muss vor diesem Import aktiviert und initialisiert sein (Dokumente)." };
      }
      if (payload.sigekoDocuments.some(row => _rowExists(db, "sigeko_documents", row.id))) {
        return { ok: false, error: "SiGeKo-Dokument existiert bereits (ID)." };
      }
    }
    if (payload.sigekoPreNotifications?.length) {
      const columns = db.prepare("PRAGMA table_info(sigeko_pre_notifications)").all().map(row => row.name);
      if (columns.length !== PRE_NOTIFICATION_COLUMNS.length || PRE_NOTIFICATION_COLUMNS.some(key => !columns.includes(key))) {
        return { ok: false, error: "SiGeKo muss vor diesem Import aktiviert und initialisiert sein (Vorankündigung)." };
      }
      if (_rowExists(db, "sigeko_pre_notifications", payload.sigekoPreNotifications[0].id)) {
        return { ok: false, error: "SiGeKo-Vorankündigung existiert bereits (ID)." };
      }
    }
    if (payload.sigekoProjectAuthorities.length) {
      const columns = db.prepare("PRAGMA table_info(sigeko_project_authorities)").all().map(row => row.name);
      if (columns.length !== PROJECT_AUTHORITY_COLUMNS.length || PROJECT_AUTHORITY_COLUMNS.some(key => !columns.includes(key))) {
        return { ok: false, error: "SiGeKo muss vor diesem Import aktiviert und initialisiert sein." };
      }
    }
    if (payload.sigekoProjects.length) {
      const columns = db.prepare("PRAGMA table_info(sigeko_projects)").all().map(row => row.name);
      if (!columns.length) return { ok: false, error: "SiGeKo muss vor diesem Import aktiviert und initialisiert sein." };
      const row = payload.sigekoProjects[0];
      if (!row || row.project_id !== project.id || columns.some(key => !Object.hasOwn(row, key)) ||
          Object.keys(row).some(key => !columns.includes(key))) {
        return { ok: false, error: "Ungültiges SiGeKo-Schema oder fremder Projektbezug im Archiv." };
      }
      for (const role of ["planning", "execution"]) if (row[`${role}_project_person_id`]) {
        const person = (payload.projectPersons || []).find(p => p.id === row[`${role}_project_person_id`]);
        const firm = person && (payload.projectFirms || []).find(f => f.id === person.project_firm_id);
        if (!firm || firm.project_id !== project.id) return { ok: false, error: "SiGeKo-Projektperson gehört nicht zum importierten Projekt." };
      }
    }
    if (_rowExists(db, "projects", project.id)) {
      return { ok: false, error: "Projekt existiert bereits (ID)." };
    }
    if (projectNumber) {
      const dup = db.prepare("SELECT id FROM projects WHERE project_number = ? LIMIT 1").get(projectNumber);
      if (dup) return { ok: false, error: "Projekt mit gleicher Projektnummer existiert bereits." };
    }
    try {
      _validateGlobalDependencies(db, payload, { requireSnapshots: formatVersion >= 3 });
    } catch (error) {
      return { ok: false, error: error?.message || String(error), code: error?.code || null };
    }

    const projectFolderSource = path.join(tempDir, "project-folder");
    try {
      const s = await fs.promises.stat(projectFolderSource);
      if (!s.isDirectory()) throw new Error("project-folder fehlt.");
    } catch (err) {
      return { ok: false, error: "project-folder fehlt im Export." };
    }

    const settings = appSettingsGetMany(["pdf.protocolsDir"]) || {};
    const baseDir = String(settings["pdf.protocolsDir"] || "").trim() || app.getPath("downloads");
    const projectFolderName = resolveProjectFolderName({
      project_number: projectNumber,
      short: projectShortName,
      name: project.name,
    });
    const targetDir = path.join(baseDir, "bbm", projectFolderName);
    if (fs.existsSync(targetDir)) {
      return { ok: false, error: "Projektordner existiert bereits." };
    }

    const tx = db.transaction(() => {
      const sanitizedProject = _sanitizeProjectRow(project);
      if (!sanitizedProject?.id) throw new Error("Projektdaten unvollst?ndig (id fehlt).");
      _insertRow(db, "projects", sanitizedProject);
      const pid = sanitizedProject.id;
      const withPid = (rows = []) => rows.map((r) => ({ ...(r || {}), project_id: pid }));

      _insertRows(db, "project_settings", withPid(payload.projectSettings || []));
      const projectFirmRows = _withLegacyFirmUseDefaults(payload.projectFirms || []);
      _insertRows(db, "project_firms", withPid(projectFirmRows));
      if (builder) {
        // All referenced project firms now exist; never run selection validation
        // before inserting them or bind an ID from a different project.
        _validateGlobalDependencies(db, payload, { requireSnapshots: true });
        db.prepare("UPDATE projects SET bauherr_firm_kind = ?, bauherr_firm_id = ? WHERE id = ?")
          .run(builder.kind, builder.id, pid);
      }
      _insertRows(db, "project_persons", payload.projectPersons || []);
      _insertRows(db, "sigeko_projects", payload.sigekoProjects);
      _insertRows(db, "sigeko_project_authorities", payload.sigekoProjectAuthorities);
      _insertRows(db, "sigeko_pre_notifications", payload.sigekoPreNotifications || []);
      _insertRows(db, "sigeko_documents", payload.sigekoDocuments || []);
      _insertRows(db, "sigeko_pre_notification_workflows", payload.sigekoPreNotificationWorkflows || []);
      _insertRows(db, "project_candidates", withPid(payload.projectCandidates || []));
      _insertRows(db, "project_global_firms", withPid(payload.projectGlobalFirms || []));
      _insertRows(db, "meetings", withPid(payload.meetings || []));
      _insertRows(db, "tops", withPid(payload.tops || []));
      _insertRows(db, "meeting_tops", payload.meetingTops || []);
      _insertRows(db, "meeting_participants", payload.meetingParticipants || []);
      _insertRows(db, "restarbeiten_items", withPid(payload.restarbeitenItems || []));
      _insertRows(db, "restarbeiten_attachments", withPid(payload.restarbeitenAttachments || []));
      _insertRows(db, "restarbeiten_notes", payload.restarbeitenNotes || []);
    });

    if (formatVersion >= 8) {
      await fs.promises.mkdir(path.dirname(targetDir), { recursive: true });
      await fs.promises.mkdir(targetDir); // Exclusive reservation; never remove an existing folder.
      reservedTargetDir = targetDir;
      await fs.promises.cp(projectFolderSource, targetDir, { recursive: true, force: false, errorOnExist: true });
      _validateSigekoDocumentFiles(targetDir, payload.sigekoDocuments, payload.sigekoPreNotificationWorkflows);
      const currentSettings = appSettingsGetMany(["pdf.protocolsDir"]) || {};
      const currentBaseDir = String(currentSettings["pdf.protocolsDir"] || "").trim() || app.getPath("downloads");
      if (path.resolve(currentBaseDir) !== path.resolve(baseDir)) {
        throw new Error("Projektablage wurde während des Imports geändert. Bitte erneut importieren.");
      }
      tx();
      reservedTargetDir = null; // Files and database now form a successfully imported project.
    } else {
      tx();
      await fs.promises.mkdir(path.dirname(targetDir), { recursive: true });
      await fs.promises.cp(projectFolderSource, targetDir, { recursive: true });
    }

    return {
      ok: true,
      projectId: project.id,
      projectNumber,
      projectShortName,
    };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  } finally {
    if (reservedTargetDir) {
      try { await fs.promises.rm(reservedTargetDir, { recursive: true, force: true }); }
      catch (_e) { /* An unreferenced folder may remain; no successful import is reported. */ }
    }
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (_e) {
      // ignore cleanup errors
    }
  }
}

function registerProjectTransferIpc() {
  // Gemeinsamer technischer Export-/Import-Dienst:
  // Archiv, Dateisystem und Validierung bleiben hier in der technischen Schicht.
  ipcMain.handle("projectTransfer:export", async (_evt, raw) => {
    const projectId = raw?.projectId ?? raw?.project_id ?? raw?.id ?? null;
    if (!projectId) return { ok: false, error: "projectId required" };

    try {
      const project = projectsRepo.getById(projectId);
      if (!project) throw new Error("Projekt nicht gefunden.");

      const exportRoot = _getExportRoot();
      const baseDir = path.dirname(path.dirname(exportRoot)); // <baseDir>/bbm/export -> <baseDir>
      const storage = buildStoragePreviewPaths({ baseDir, project });
      const projectDir = path.dirname(storage.previewDir); // .../bbm/<Projektordner>

      const fileNumber = _sanitizeFilePart(
        project.project_number ?? project.projectNumber ?? project.number ?? project.id
      );
      const fileShort = _sanitizeFilePart(project.short ?? project.name ?? "Projekt");
      const exportName = `${fileNumber}-${fileShort}-export.zip`;
      const exportPath = path.join(exportRoot, exportName);

      const data = _fetchProjectData(projectId, project);
      if (data.sigekoDocuments.length) _validateSigekoDocumentFiles(projectDir, data.sigekoDocuments, data.sigekoPreNotificationWorkflows);
      const builderVersion = project.bauherr_firm_kind != null || project.bauherr_firm_id != null ? 5 : 3;
      const builder = _validateProjectBuilderReference({ project, projectFirms: data.projectFirms }, { formatVersion: builderVersion });
      if (builder?.kind === "global_firm") {
        _validateGlobalDependencies(initDatabase(), { project, globalFirmDependencies: data.globalFirmDependencies }, { requireSnapshots: true });
      }
      const exportedAt = new Date().toISOString();
      const filesCount = projectDir && fs.existsSync(projectDir) ? await _countFilesRecursive(projectDir) : 0;
      const manifest = _buildProjectTransferManifest({
        projectId,
        project,
        storage,
        data,
        exportedAt,
        filesCount,
      });
      const payloads = _buildProjectTransferPayloads({ project, data });

      await _createExportZip({
        exportPath,
        projectDir,
        manifest,
        payloads,
      });

      const validation = await _validateExportZip(exportPath);
      if (!validation.ok) {
        return { ok: false, error: validation.error || "Exportvalidierung fehlgeschlagen." };
      }

      // V8 and later validate the actual archive bytes and prevent deleting changes made
      // while archiver/extraction awaited. Existing V1–V7 ordering is unchanged.
      if (manifest.formatVersion >= 8) {
        await _validateArchivedSigekoDocumentFiles(exportPath, data.sigekoDocuments, data.sigekoPreNotificationWorkflows);
        initDatabase().transaction(() => {
          const currentProject = projectsRepo.getById(projectId);
          if (!isDeepStrictEqual(currentProject, project) ||
              !isDeepStrictEqual(_fetchProjectData(projectId, currentProject), data)) {
            throw new Error("Projekt wurde während des Exports geändert. Bitte erneut exportieren.");
          }
          const currentSettings = appSettingsGetMany(["pdf.protocolsDir"]) || {};
          const currentBaseDir = String(currentSettings["pdf.protocolsDir"] || "").trim() || app.getPath("downloads");
          if (path.resolve(currentBaseDir) !== path.resolve(baseDir)) {
            throw new Error("Projektablage wurde während des Exports geändert. Bitte erneut exportieren.");
          }
          _validateSigekoDocumentFiles(projectDir, data.sigekoDocuments, data.sigekoPreNotificationWorkflows);
          projectsRepo.deleteForever(projectId);
        })();
      } else {
        projectsRepo.deleteForever(projectId);
      }
      if (projectDir && fs.existsSync(projectDir)) {
        await fs.promises.rm(projectDir, { recursive: true, force: true });
      }

      return {
        ok: true,
        exportPath,
        projectId,
        projectNumber: project.project_number ?? project.projectNumber ?? null,
        projectShortName: project.short ?? null,
      };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle("projectTransfer:import", async (_evt, raw) => {
    const filePath = typeof raw === "string" ? raw : raw?.filePath || raw?.path || null;
    return _importProjectZip(filePath);
  });

  // Technische Exportablage und Dateizugriffe
  ipcMain.handle("projectTransfer:listExports", async () => {
    const exportRoot = _getExportRoot();
    try {
      await fs.promises.mkdir(exportRoot, { recursive: true });
      const entries = await fs.promises.readdir(exportRoot, { withFileTypes: true });
      const list = [];
      for (const ent of entries) {
        if (!ent.isFile()) continue;
        if (!String(ent.name || "").toLowerCase().endsWith(".zip")) continue;
        const fullPath = path.join(exportRoot, ent.name);
        try {
          const stat = await fs.promises.stat(fullPath);
          if (!stat.isFile()) continue;
          list.push({
            fileName: ent.name,
            filePath: fullPath,
            size: stat.size || 0,
            mtimeMs: stat.mtimeMs || 0,
          });
        } catch (_e) {
          // ignore unreadable entries
        }
      }
      list.sort((a, b) => (b.mtimeMs || 0) - (a.mtimeMs || 0));
      return { ok: true, exportRoot, list };
    } catch (err) {
      return { ok: false, error: err?.message || "Export-Ordner konnte nicht gelesen werden." };
    }
  });


  ipcMain.handle("projectTransfer:openExportFolder", async () => {
    const exportRoot = _getExportRoot();
    try {
      await fs.promises.mkdir(exportRoot, { recursive: true });
      const errorText = await shell.openPath(exportRoot);
      if (errorText) return { ok: false, error: errorText };
      return { ok: true, exportRoot };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle("projectTransfer:importFromExport", async (_evt, raw) => {
    const exportRoot = _getExportRoot();
    const filePath = raw?.filePath || (raw?.fileName ? path.join(exportRoot, raw.fileName) : null);
    if (!filePath) return { ok: false, error: "filePath required" };
    if (!_isPathInside(filePath, exportRoot)) {
      return { ok: false, error: "Dateipfad liegt nicht im Export-Ordner." };
    }

    const res = await _importProjectZip(filePath);
    if (!res?.ok) return res;

    try {
      await fs.promises.rm(filePath, { force: true });
    } catch (err) {
      return { ok: false, error: err?.message || "Import ok, aber Exportdatei konnte nicht gel?scht werden." };
    }

    return { ...res, deleted: true };
  });
}

module.exports = {
  registerProjectTransferIpc,
  _buildProjectTransferPayloads,
  _validateGlobalDependencies,
  _withLegacyFirmUseDefaults,
};
