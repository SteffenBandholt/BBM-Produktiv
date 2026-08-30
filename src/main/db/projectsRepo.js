// src/main/db/projectsRepo.js
const { initDatabase } = require("./database");
const { randomUUID } = require("crypto");

let _ensuredProjectNumberColumn = false;
let _ensuredArchivedAtColumn = false;
const PROJECT_MODULE_IDS = new Set([
  "protokoll",
  "restarbeiten",
  "rechnung",
  "sigeko",
  "dev-ui-editor",
]);
const ARCHIVABLE_PROJECT_MODULE_IDS = new Set(["protokoll", "restarbeiten"]);

function _normText(v) {
  const s = v !== undefined && v !== null ? String(v).trim() : "";
  return s ? s : null;
}

function _normName(v) {
  const s = v !== undefined && v !== null ? String(v).trim() : "";
  return s ? s : "";
}

function _normModuleId(value) {
  const moduleId = String(value ?? "").trim().toLowerCase();
  if (!PROJECT_MODULE_IDS.has(moduleId)) throw new Error("moduleId invalid");
  return moduleId;
}

function _normArchivableModuleId(value) {
  const moduleId = _normModuleId(value);
  if (!ARCHIVABLE_PROJECT_MODULE_IDS.has(moduleId)) {
    throw new Error(`module archive not supported: ${moduleId}`);
  }
  return moduleId;
}

function _tableExists(db, tableName) {
  try {
    const row = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(tableName);
    return !!row;
  } catch (_e) {
    return false;
  }
}

function _ensureProjectNumber(db) {
  if (_ensuredProjectNumberColumn) return;

  try {
    const cols = db.prepare("PRAGMA table_info(projects)").all();
    const has = (cols || []).some((c) => String(c.name || "") === "project_number");

    if (!has) {
      db.exec("ALTER TABLE projects ADD COLUMN project_number TEXT");
    }
  } catch (_e) {
    // If something goes wrong, do not crash the app here.
    // We keep the repo working without project_number.
  } finally {
    _ensuredProjectNumberColumn = true;
  }
}

function _ensureArchivedAt(db) {
  if (_ensuredArchivedAtColumn) return;

  try {
    const cols = db.prepare("PRAGMA table_info(projects)").all();
    const has = (cols || []).some((c) => String(c.name || "") === "archived_at");

    if (!has) {
      db.exec("ALTER TABLE projects ADD COLUMN archived_at TEXT");
    }
  } catch (_e) {
    // keep repo working; caller will fallback to queries without archived_at
  } finally {
    _ensuredArchivedAtColumn = true;
  }
}

function _addCamelAlias(p) {
  if (!p || typeof p !== "object") return p;

  // keep snake_case as source of truth; add camelCase alias for renderer convenience
  if (p.projectNumber === undefined) p.projectNumber = p.project_number ?? null;
  if (p.project_number === undefined) p.project_number = p.projectNumber ?? null;

  if (p.archivedAt === undefined) p.archivedAt = p.archived_at ?? null;
  if (p.archived_at === undefined) p.archived_at = p.archivedAt ?? null;

  return p;
}

function _addModuleAliases(db, project) {
  if (!project || typeof project !== "object") return project;
  let rows = [];
  try {
    rows = db
      .prepare(`
        SELECT module_id, archived_at
        FROM project_modules
        WHERE project_id = ?
        ORDER BY module_id COLLATE NOCASE ASC
      `)
      .all(project.id);
  } catch (_e) {
    rows = db
      .prepare(`SELECT module_id, NULL AS archived_at FROM project_modules WHERE project_id = ? ORDER BY module_id COLLATE NOCASE ASC`)
      .all(project.id);
  }

  const activeModuleIds = rows
    .filter((row) => !row?.archived_at)
    .map((row) => String(row?.module_id || "").trim())
    .filter(Boolean);
  const archivedModuleIds = rows
    .filter((row) => !!row?.archived_at)
    .map((row) => String(row?.module_id || "").trim())
    .filter(Boolean);
  const allModuleIds = rows
    .map((row) => String(row?.module_id || "").trim())
    .filter(Boolean);

  project.module_ids = activeModuleIds;
  project.moduleIds = activeModuleIds;
  project.archived_module_ids = archivedModuleIds;
  project.archivedModuleIds = archivedModuleIds;
  project.all_module_ids = allModuleIds;
  project.allModuleIds = allModuleIds;
  return project;
}

function _decorateProject(db, project) {
  return _addModuleAliases(db, _addCamelAlias(project));
}

function _safeGetById(db, projectId) {
  try {
    const p = db
      .prepare(
        `
        SELECT
          id,
          project_number,
          name,
          short,
          street,
          zip,
          city,
          project_lead,
          project_lead_phone,
          start_date,
          end_date,
          notes,
          archived_at
        FROM projects
        WHERE id = ?
      `
      )
      .get(projectId);

    return _decorateProject(db, p);
  } catch (_e) {
    // fallback without archived_at/project_number (very old dbs)
    try {
      const p = db
        .prepare(
          `
          SELECT
            id,
            project_number,
            name,
            short,
            street,
            zip,
            city,
            project_lead,
            project_lead_phone,
            start_date,
            end_date,
            notes
          FROM projects
          WHERE id = ?
        `
        )
        .get(projectId);

      if (p && typeof p === "object") p.archived_at = null;
      return _decorateProject(db, p);
    } catch (_e2) {
      const p = db
        .prepare(
          `
          SELECT
            id,
            name,
            short,
            street,
            zip,
            city,
            project_lead,
            project_lead_phone,
            start_date,
            end_date,
            notes
          FROM projects
          WHERE id = ?
        `
        )
        .get(projectId);

      if (p && typeof p === "object") {
        p.project_number = null;
        p.archived_at = null;
      }
      return _decorateProject(db, p);
    }
  }
}

function getById(projectId) {
  const db = initDatabase();
  if (!projectId) throw new Error("projectId required");

  _ensureProjectNumber(db);
  _ensureArchivedAt(db);
  return _safeGetById(db, projectId);
}

function _orderByProjectNumberAndNameSql() {
  return `
    ORDER BY
      CASE
        WHEN project_number IS NULL OR TRIM(project_number) = '' THEN 1
        ELSE 0
      END ASC,
      project_number COLLATE NOCASE ASC,
      name COLLATE NOCASE ASC
  `;
}

function listAll() {
  const db = initDatabase();

  _ensureProjectNumber(db);
  _ensureArchivedAt(db);

  // Active only: archived_at IS NULL
  try {
    const list = db
      .prepare(
        `
        SELECT
          id,
          project_number,
          name,
          short,
          street,
          zip,
          city,
          project_lead,
          project_lead_phone,
          start_date,
          end_date,
          notes,
          archived_at
        FROM projects
        WHERE archived_at IS NULL
        ${_orderByProjectNumberAndNameSql()}
      `
      )
      .all();

    return (list || []).map((x) => _decorateProject(db, x));
  } catch (_e) {
    // fallback: if archived_at not present, behave like old behavior (all projects are active)
    try {
      const list = db
        .prepare(
          `
          SELECT
            id,
            project_number,
            name,
            short,
            street,
            zip,
            city,
            project_lead,
            project_lead_phone,
            start_date,
            end_date,
            notes
          FROM projects
          ${_orderByProjectNumberAndNameSql()}
        `
        )
        .all();

      return (list || []).map((x) => _decorateProject(db, { ...x, archived_at: null }));
    } catch (_e2) {
      const list = db
        .prepare(
          `
          SELECT
            id,
            name,
            short,
            street,
            zip,
            city,
            project_lead,
            project_lead_phone,
            start_date,
            end_date,
            notes
          FROM projects
          ORDER BY name COLLATE NOCASE ASC
        `
        )
        .all();

      return (list || []).map((x) => _decorateProject(db, { ...x, project_number: null, archived_at: null }));
    }
  }
}

function listArchived() {
  const db = initDatabase();

  _ensureProjectNumber(db);
  _ensureArchivedAt(db);

  // Archived only: archived_at IS NOT NULL
  try {
    const list = db
      .prepare(
        `
        SELECT
          id,
          project_number,
          name,
          short,
          street,
          zip,
          city,
          project_lead,
          project_lead_phone,
          start_date,
          end_date,
          notes,
          archived_at
        FROM projects
        WHERE archived_at IS NOT NULL
        ORDER BY archived_at DESC, name COLLATE NOCASE ASC
      `
      )
      .all();

    return (list || []).map((x) => _decorateProject(db, x));
  } catch (_e) {
    // if archived_at missing, nothing is archived
    return [];
  }
}

function listArchiveEntries() {
  const db = initDatabase();
  _ensureProjectNumber(db);
  _ensureArchivedAt(db);

  const projectEntries = listArchived().map((project) => ({
    ...project,
    project_id: project.id,
    projectId: project.id,
    archive_type: "project",
    archiveType: "project",
    archive_scope_label: "Gesamtes Projekt",
    archiveScopeLabel: "Gesamtes Projekt",
    module_id: null,
    moduleId: null,
    module_ids: [...(project.all_module_ids || project.module_ids || [])],
    moduleIds: [...(project.all_module_ids || project.module_ids || [])],
  }));

  const moduleRows = db
    .prepare(
      `
        SELECT
          p.id,
          p.project_number,
          p.name,
          p.short,
          p.street,
          p.zip,
          p.city,
          p.project_lead,
          p.project_lead_phone,
          p.start_date,
          p.end_date,
          p.notes,
          p.archived_at,
          pm.module_id,
          pm.archived_at AS module_archived_at
        FROM project_modules pm
        JOIN projects p ON p.id = pm.project_id
        WHERE p.archived_at IS NULL
          AND pm.archived_at IS NOT NULL
          AND pm.module_id IN ('protokoll', 'restarbeiten')
        ORDER BY pm.archived_at DESC, p.name COLLATE NOCASE ASC, pm.module_id COLLATE NOCASE ASC
      `
    )
    .all();

  const moduleEntries = moduleRows.map((row) => {
    const project = _decorateProject(db, { ...row, archived_at: null });
    const moduleId = String(row?.module_id || "").trim();
    const moduleLabel = moduleId === "protokoll" ? "Protokoll" : "Restarbeiten";
    return {
      ...project,
      project_id: project.id,
      projectId: project.id,
      archive_type: "module",
      archiveType: "module",
      archive_scope_label: moduleLabel,
      archiveScopeLabel: moduleLabel,
      archived_at: row.module_archived_at,
      archivedAt: row.module_archived_at,
      module_id: moduleId,
      moduleId,
      active_module_ids: [...(project.module_ids || [])],
      activeModuleIds: [...(project.module_ids || [])],
      module_ids: moduleId ? [moduleId] : [],
      moduleIds: moduleId ? [moduleId] : [],
    };
  });

  return [...projectEntries, ...moduleEntries].sort((left, right) => {
    const byDate = String(right?.archived_at || "").localeCompare(String(left?.archived_at || ""));
    if (byDate !== 0) return byDate;
    return String(left?.name || "").localeCompare(String(right?.name || ""), "de");
  });
}

/**
 * Backwards compatible:
 * - minimal: { name }
 * - extended fields optional (NULL if empty)
 * Accepts snake_case and camelCase for newer fields.
 */
function createProject(data) {
  const db = initDatabase();
  _ensureProjectNumber(db);
  _ensureArchivedAt(db);

  const d = data && typeof data === "object" ? data : {};

  const name = _normName(d.name ?? d.bezeichnung);
  if (!name) throw new Error("name required");

  const id = randomUUID();

  const project_number = _normText(d.project_number ?? d.projectNumber);

  const short = _normText(d.short);
  const street = _normText(d.street);
  const zip = _normText(d.zip);
  const city = _normText(d.city);

  const project_lead = _normText(d.project_lead ?? d.projectLead);
  const project_lead_phone = _normText(d.project_lead_phone ?? d.projectLeadPhone);

  const start_date = _normText(d.start_date ?? d.startDate);
  const end_date = _normText(d.end_date ?? d.endDate);

  const notes = _normText(d.notes);

  // archived_at always NULL on create
  const archived_at = null;

  // Try with archived_at + project_number; fallback if columns still not available.
  try {
    db.prepare(
      `
      INSERT INTO projects (
        id,
        project_number,
        name,
        short,
        street,
        zip,
        city,
        project_lead,
        project_lead_phone,
        start_date,
        end_date,
        notes,
        archived_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      project_number,
      name,
      short,
      street,
      zip,
      city,
      project_lead,
      project_lead_phone,
      start_date,
      end_date,
      notes,
      archived_at
    );
  } catch (_e) {
    try {
      db.prepare(
        `
        INSERT INTO projects (
          id,
          project_number,
          name,
          short,
          street,
          zip,
          city,
          project_lead,
          project_lead_phone,
          start_date,
          end_date,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        id,
        project_number,
        name,
        short,
        street,
        zip,
        city,
        project_lead,
        project_lead_phone,
        start_date,
        end_date,
        notes
      );
    } catch (_e2) {
      db.prepare(
        `
        INSERT INTO projects (
          id,
          name,
          short,
          street,
          zip,
          city,
          project_lead,
          project_lead_phone,
          start_date,
          end_date,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        id,
        name,
        short,
        street,
        zip,
        city,
        project_lead,
        project_lead_phone,
        start_date,
        end_date,
        notes
      );
    }
  }

  return _safeGetById(db, id);
}

/**
 * Update:
 * Expects { projectId|id, patch } or { projectId|id, ...patchFields }
 * Patch fields can be camelCase or snake_case.
 */
function updateProject(data) {
  const db = initDatabase();
  _ensureProjectNumber(db);
  _ensureArchivedAt(db);

  const d = data && typeof data === "object" ? data : {};

  const projectId = d.projectId ?? d.project_id ?? d.id ?? null;
  if (!projectId) throw new Error("projectId required");

  const rawPatch = d.patch && typeof d.patch === "object" ? d.patch : d;

  const patch = {
    project_number: rawPatch.project_number ?? rawPatch.projectNumber,

    name: rawPatch.name ?? rawPatch.bezeichnung,
    short: rawPatch.short,

    street: rawPatch.street,
    zip: rawPatch.zip,
    city: rawPatch.city,

    project_lead: rawPatch.project_lead ?? rawPatch.projectLead,
    project_lead_phone: rawPatch.project_lead_phone ?? rawPatch.projectLeadPhone,

    start_date: rawPatch.start_date ?? rawPatch.startDate,
    end_date: rawPatch.end_date ?? rawPatch.endDate,

    notes: rawPatch.notes,
  };

  const allowed = new Set([
    "project_number",
    "name",
    "short",
    "street",
    "zip",
    "city",
    "project_lead",
    "project_lead_phone",
    "start_date",
    "end_date",
    "notes",
  ]);

  const keys = Object.keys(patch).filter((k) => allowed.has(k) && patch[k] !== undefined);
  if (keys.length === 0) return _safeGetById(db, projectId);

  const sets = [];
  const vals = [];

  for (const k of keys) {
    if (k === "name") {
      const n = _normName(patch.name);
      if (!n) throw new Error("name required");
      sets.push("name = ?");
      vals.push(n);
      continue;
    }
    sets.push(`${k} = ?`);
    vals.push(_normText(patch[k]));
  }

  vals.push(projectId);

  db.prepare(
    `
    UPDATE projects
    SET ${sets.join(", ")}
    WHERE id = ?
  `
  ).run(...vals);

  return _safeGetById(db, projectId);
}

function archiveProject(projectId) {
  const db = initDatabase();
  if (!projectId) throw new Error("projectId required");

  _ensureArchivedAt(db);

  const now = new Date().toISOString();

  try {
    db.prepare(`UPDATE projects SET archived_at = ? WHERE id = ?`).run(now, projectId);
  } catch (_e) {
    // if archived_at is missing, ensure again and retry once
    _ensuredArchivedAtColumn = false;
    _ensureArchivedAt(db);
    db.prepare(`UPDATE projects SET archived_at = ? WHERE id = ?`).run(now, projectId);
  }

  return _safeGetById(db, projectId);
}

function unarchiveProject(projectId) {
  const db = initDatabase();
  if (!projectId) throw new Error("projectId required");

  _ensureArchivedAt(db);

  try {
    db.prepare(`UPDATE projects SET archived_at = NULL WHERE id = ?`).run(projectId);
  } catch (_e) {
    _ensuredArchivedAtColumn = false;
    _ensureArchivedAt(db);
    db.prepare(`UPDATE projects SET archived_at = NULL WHERE id = ?`).run(projectId);
  }

  return _safeGetById(db, projectId);
}

function archiveModule(projectId, moduleId) {
  const db = initDatabase();
  const pid = String(projectId ?? "").trim();
  if (!pid) throw new Error("projectId required");
  const normalizedModuleId = _normArchivableModuleId(moduleId);
  const project = _safeGetById(db, pid);
  if (!project) throw new Error("project not found");
  if (project.archived_at) throw new Error("project is archived");

  const assignment = db
    .prepare(`SELECT archived_at FROM project_modules WHERE project_id = ? AND module_id = ?`)
    .get(pid, normalizedModuleId);
  if (!assignment) throw new Error("project module not assigned");
  if (assignment.archived_at) throw new Error("project module already archived");

  db.prepare(`
    UPDATE project_modules
    SET archived_at = ?
    WHERE project_id = ? AND module_id = ?
  `).run(new Date().toISOString(), pid, normalizedModuleId);

  return _safeGetById(db, pid);
}

function unarchiveModule(projectId, moduleId) {
  const db = initDatabase();
  const pid = String(projectId ?? "").trim();
  if (!pid) throw new Error("projectId required");
  const normalizedModuleId = _normArchivableModuleId(moduleId);
  const project = _safeGetById(db, pid);
  if (!project) throw new Error("project not found");
  if (project.archived_at) throw new Error("restore whole project first");

  const assignment = db
    .prepare(`SELECT archived_at FROM project_modules WHERE project_id = ? AND module_id = ?`)
    .get(pid, normalizedModuleId);
  if (!assignment) throw new Error("archived project module not found");
  if (!assignment.archived_at) throw new Error("project module is not archived");

  db.prepare(`
    UPDATE project_modules
    SET archived_at = NULL
    WHERE project_id = ? AND module_id = ?
  `).run(pid, normalizedModuleId);

  return _safeGetById(db, pid);
}

function assignModule(projectId, moduleId) {
  const db = initDatabase();
  const pid = String(projectId ?? "").trim();
  if (!pid) throw new Error("projectId required");
  const normalizedModuleId = _normModuleId(moduleId);
  const project = _safeGetById(db, pid);
  if (!project) throw new Error("project not found");

  db.prepare(`
    INSERT OR IGNORE INTO project_modules (project_id, module_id)
    VALUES (?, ?)
  `).run(pid, normalizedModuleId);

  return _safeGetById(db, pid);
}

function _listRestarbeitenFilePaths(db, projectId) {
  if (!_tableExists(db, "restarbeiten_attachments")) return [];
  const paths = db
    .prepare(`SELECT file_path, thumbnail_path FROM restarbeiten_attachments WHERE project_id = ?`)
    .all(projectId)
    .flatMap((row) => [row?.file_path, row?.thumbnail_path])
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return [...new Set(paths)];
}

function _deleteProtokollData(db, projectId) {
  if (_tableExists(db, "audio_imports")) {
    const audioImportIds = db
      .prepare(`SELECT id FROM audio_imports WHERE project_id = ?`)
      .all(projectId)
      .map((row) => row?.id)
      .filter(Boolean);

    if (audioImportIds.length && _tableExists(db, "transcripts")) {
      const deleteTranscript = db.prepare(`DELETE FROM transcripts WHERE audio_import_id = ?`);
      for (const audioImportId of audioImportIds) deleteTranscript.run(audioImportId);
    }
    if (_tableExists(db, "audio_suggestions")) {
      db.prepare(`DELETE FROM audio_suggestions WHERE project_id = ?`).run(projectId);
    }
    db.prepare(`DELETE FROM audio_imports WHERE project_id = ?`).run(projectId);
  }

  if (_tableExists(db, "meetings")) {
    const meetingIds = db
      .prepare(`SELECT id FROM meetings WHERE project_id = ?`)
      .all(projectId)
      .map((row) => row?.id)
      .filter(Boolean);

    if (meetingIds.length && _tableExists(db, "meeting_participants")) {
      const deleteParticipants = db.prepare(`DELETE FROM meeting_participants WHERE meeting_id = ?`);
      for (const meetingId of meetingIds) deleteParticipants.run(meetingId);
    }
    if (meetingIds.length && _tableExists(db, "meeting_tops")) {
      const deleteMeetingTops = db.prepare(`DELETE FROM meeting_tops WHERE meeting_id = ?`);
      for (const meetingId of meetingIds) deleteMeetingTops.run(meetingId);
    }
    db.prepare(`DELETE FROM meetings WHERE project_id = ?`).run(projectId);
  }

  if (_tableExists(db, "tops")) {
    const topIds = db
      .prepare(`SELECT id FROM tops WHERE project_id = ?`)
      .all(projectId)
      .map((row) => row?.id)
      .filter(Boolean);
    if (topIds.length && _tableExists(db, "meeting_tops")) {
      const deleteMeetingTops = db.prepare(`DELETE FROM meeting_tops WHERE top_id = ?`);
      for (const topId of topIds) deleteMeetingTops.run(topId);
    }
    db.prepare(`DELETE FROM tops WHERE project_id = ?`).run(projectId);
  }
}

function _deleteRestarbeitenData(db, projectId) {
  if (_tableExists(db, "restarbeiten_items")) {
    const itemIds = db
      .prepare(`SELECT id FROM restarbeiten_items WHERE project_id = ?`)
      .all(projectId)
      .map((row) => row?.id)
      .filter(Boolean);

    if (itemIds.length && _tableExists(db, "restarbeiten_notes")) {
      const deleteNotes = db.prepare(`DELETE FROM restarbeiten_notes WHERE restarbeit_id = ?`);
      for (const itemId of itemIds) deleteNotes.run(itemId);
    }
    if (_tableExists(db, "restarbeiten_attachments")) {
      db.prepare(`DELETE FROM restarbeiten_attachments WHERE project_id = ?`).run(projectId);
    }
    db.prepare(`DELETE FROM restarbeiten_items WHERE project_id = ?`).run(projectId);
  }
  if (_tableExists(db, "restarbeiten_project_settings")) {
    db.prepare(`DELETE FROM restarbeiten_project_settings WHERE project_id = ?`).run(projectId);
  }
}

function deleteArchivedModule(projectId, moduleId) {
  const db = initDatabase();
  const pid = String(projectId ?? "").trim();
  if (!pid) throw new Error("projectId required");
  const normalizedModuleId = _normArchivableModuleId(moduleId);
  const deletedFilePaths = normalizedModuleId === "restarbeiten"
    ? _listRestarbeitenFilePaths(db, pid)
    : [];

  const tx = db.transaction(() => {
    const project = _safeGetById(db, pid);
    if (!project) throw new Error("project not found");
    if (project.archived_at) throw new Error("delete the whole archived project instead");

    const assignment = db
      .prepare(`SELECT archived_at FROM project_modules WHERE project_id = ? AND module_id = ?`)
      .get(pid, normalizedModuleId);
    if (!assignment?.archived_at) throw new Error("project module is not archived");

    if (normalizedModuleId === "protokoll") {
      _deleteProtokollData(db, pid);
    } else {
      _deleteRestarbeitenData(db, pid);
    }

    db.prepare(`DELETE FROM project_modules WHERE project_id = ? AND module_id = ?`)
      .run(pid, normalizedModuleId);
  });

  tx();
  return { ok: true, deletedFilePaths };
}

function deleteForever(projectId) {
  const db = initDatabase();
  const pid = String(projectId ?? "").trim();
  if (!pid) throw new Error("projectId required");
  const deletedFilePaths = _listRestarbeitenFilePaths(db, pid);

  const tx = db.transaction(() => {
    let firmIds = [];
    if (_tableExists(db, "project_firms")) {
      firmIds = (db.prepare(`SELECT id FROM project_firms WHERE project_id = ?`).all(pid) || [])
        .map((row) => row.id)
        .filter(Boolean);
    }

    if (firmIds.length && _tableExists(db, "project_persons")) {
      const deleteProjectPersons = db.prepare(`DELETE FROM project_persons WHERE project_firm_id = ?`);
      for (const firmId of firmIds) deleteProjectPersons.run(firmId);
    }

    _deleteProtokollData(db, pid);
    _deleteRestarbeitenData(db, pid);

    if (_tableExists(db, "project_firms")) {
      db.prepare(`DELETE FROM project_firms WHERE project_id = ?`).run(pid);
    }
    if (_tableExists(db, "project_candidates")) {
      db.prepare(`DELETE FROM project_candidates WHERE project_id = ?`).run(pid);
    }
    if (_tableExists(db, "project_global_firms")) {
      db.prepare(`DELETE FROM project_global_firms WHERE project_id = ?`).run(pid);
    }

    db.prepare(`DELETE FROM projects WHERE id = ?`).run(pid);
  });

  tx();
  return { ok: true, deletedFilePaths };
}

function deleteArchivedProject(projectId) {
  const db = initDatabase();
  const pid = String(projectId ?? "").trim();
  if (!pid) throw new Error("projectId required");
  const project = _safeGetById(db, pid);
  if (!project) throw new Error("project not found");
  if (!project.archived_at) throw new Error("project is not archived");

  if (_tableExists(db, "invoices")) {
    const invoiceCount = Number(
      db.prepare(`SELECT COUNT(*) AS count FROM invoices WHERE project_id = ?`).get(pid)?.count || 0
    );
    if (invoiceCount > 0) {
      throw new Error("Projekt kann nicht endgültig gelöscht werden, solange Rechnungen darauf verweisen.");
    }
  }

  return deleteForever(pid);
}

module.exports = {
  getById,
  listAll,
  listArchived,
  listArchiveEntries,
  createProject,
  updateProject,
  archiveProject,
  unarchiveProject,
  archiveModule,
  unarchiveModule,
  assignModule,
  deleteArchivedModule,
  deleteArchivedProject,
  deleteForever,
};
