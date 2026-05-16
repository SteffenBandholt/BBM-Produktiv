const crypto = require("node:crypto");
const { initDatabase } = require("./database");

const ALLOWED_STATUS = new Set([
  "offen",
  "in_arbeit",
  "erledigt_gemeldet",
  "geprueft_erledigt",
  "zurueckgewiesen",
]);
const ALLOWED_ITEM_CLASSES = new Set(["rest", "mangel"]);

function toText(value) {
  if (value == null) return null;
  const out = String(value).trim();
  return out || null;
}

function reqText(value, name) {
  const out = toText(value);
  if (!out) throw new Error(`${name} required`);
  return out;
}

function normalizeStatus(value) {
  const clean = toText(value);
  if (!clean) return "offen";
  return ALLOWED_STATUS.has(clean) ? clean : "offen";
}

function normalizeRestarbeitItemClass(value) {
  const clean = toText(value);
  if (!clean) return "rest";
  const normalized = clean.toLowerCase();
  return ALLOWED_ITEM_CLASSES.has(normalized) ? normalized : "rest";
}

function ensureRestarbeitProjectSettings(projectId) {
  const db = initDatabase();
  const pid = reqText(projectId, "projectId");
  db.prepare(`
    INSERT INTO restarbeiten_project_settings (project_id)
    VALUES (?)
    ON CONFLICT(project_id) DO NOTHING
  `).run(pid);
}

function getRestarbeitProjectSettings(projectId) {
  const db = initDatabase();
  const pid = reqText(projectId, "projectId");
  ensureRestarbeitProjectSettings(pid);
  return db.prepare(`SELECT * FROM restarbeiten_project_settings WHERE project_id = ?`).get(pid);
}

function createRestarbeitItem(payload = {}) {
  const db = initDatabase();
  const pid = reqText(payload.project_id, "project_id");
  const now = new Date().toISOString();
  const nextRunning = db
    .prepare(`SELECT COALESCE(MAX(running_number), 0) + 1 AS next_no FROM restarbeiten_items WHERE project_id = ?`)
    .get(pid)?.next_no;
  const runningNumber = Number.isInteger(payload.running_number) && payload.running_number > 0
    ? payload.running_number
    : nextRunning;

  const id = toText(payload.id) || crypto.randomUUID();
  const sortOrder = Number.isFinite(Number(payload.sort_order)) ? Number(payload.sort_order) : 0;
  const data = {
    id,
    project_id: pid,
    running_number: runningNumber,
    sort_order: sortOrder,
    location_level_1: toText(payload.location_level_1),
    location_level_2: toText(payload.location_level_2),
    location_level_3: toText(payload.location_level_3),
    location_level_4: toText(payload.location_level_4),
    short_text: toText(payload.short_text) || "",
    long_text: toText(payload.long_text) || "",
    item_class: normalizeRestarbeitItemClass(payload.item_class),
    status: normalizeStatus(payload.status),
    due_date: toText(payload.due_date),
    responsible_project_firm_id: toText(payload.responsible_project_firm_id),
    responsible_label: toText(payload.responsible_label),
    source: toText(payload.source) || "desktop",
    import_batch_id: toText(payload.import_batch_id),
    archived_at: toText(payload.archived_at),
    completed_at: toText(payload.completed_at),
    verified_at: toText(payload.verified_at),
    created_at: now,
    updated_at: now,
  };

  db.prepare(`
    INSERT INTO restarbeiten_items (
      id, project_id, running_number, sort_order,
      location_level_1, location_level_2, location_level_3, location_level_4,
      short_text, long_text, item_class, status, due_date,
      responsible_project_firm_id, responsible_label, source, import_batch_id,
      archived_at, completed_at, verified_at, created_at, updated_at
    ) VALUES (
      @id, @project_id, @running_number, @sort_order,
      @location_level_1, @location_level_2, @location_level_3, @location_level_4,
      @short_text, @long_text, @item_class, @status, @due_date,
      @responsible_project_firm_id, @responsible_label, @source, @import_batch_id,
      @archived_at, @completed_at, @verified_at, @created_at, @updated_at
    )
  `).run(data);
  return db.prepare(`SELECT * FROM restarbeiten_items WHERE id = ?`).get(id);
}

function listRestarbeitItems(projectId, { includeArchived = false } = {}) {
  const db = initDatabase();
  const pid = reqText(projectId, "projectId");
  const where = includeArchived ? "" : "AND archived_at IS NULL";
  return db.prepare(`
    SELECT * FROM restarbeiten_items
    WHERE project_id = ? ${where}
    ORDER BY sort_order ASC, running_number ASC, created_at ASC
  `).all(pid);
}

function addRestarbeitAttachment(payload = {}) {
  const db = initDatabase();
  const restarbeitId = reqText(payload.restarbeit_id, "restarbeit_id");
  const projectId = reqText(payload.project_id, "project_id");
  const filePath = reqText(payload.file_path, "file_path");

  const count = db.prepare(`SELECT COUNT(*) AS c FROM restarbeiten_attachments WHERE restarbeit_id = ?`).get(restarbeitId)?.c || 0;
  if (count >= 3) throw new Error("max 3 attachments per restarbeit");

  const hasPrimary = db.prepare(`SELECT 1 FROM restarbeiten_attachments WHERE restarbeit_id = ? AND is_primary = 1 LIMIT 1`).get(restarbeitId);
  const shouldPrimary = count === 0 ? 1 : (payload.is_primary ? 1 : 0);
  const id = toText(payload.id) || crypto.randomUUID();
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    if (shouldPrimary || !hasPrimary) {
      db.prepare(`UPDATE restarbeiten_attachments SET is_primary = 0, updated_at = ? WHERE restarbeit_id = ?`).run(now, restarbeitId);
    }
    db.prepare(`
      INSERT INTO restarbeiten_attachments (
        id, restarbeit_id, project_id, file_path, thumbnail_path, file_name,
        original_file_name, mime_type, caption, sort_order, is_primary, source, created_at, updated_at
      ) VALUES (
        @id, @restarbeit_id, @project_id, @file_path, @thumbnail_path, @file_name,
        @original_file_name, @mime_type, @caption, @sort_order, @is_primary, @source, @created_at, @updated_at
      )
    `).run({
      id,
      restarbeit_id: restarbeitId,
      project_id: projectId,
      file_path: filePath,
      thumbnail_path: toText(payload.thumbnail_path),
      file_name: toText(payload.file_name),
      original_file_name: toText(payload.original_file_name),
      mime_type: toText(payload.mime_type),
      caption: toText(payload.caption),
      sort_order: Number.isFinite(Number(payload.sort_order)) ? Number(payload.sort_order) : 1,
      is_primary: shouldPrimary,
      source: toText(payload.source) || "desktop",
      created_at: now,
      updated_at: now,
    });
  });

  tx();
  return db.prepare(`SELECT * FROM restarbeiten_attachments WHERE id = ?`).get(id);
}

function setPrimaryRestarbeitAttachment(restarbeitId, attachmentId) {
  const db = initDatabase();
  const rid = reqText(restarbeitId, "restarbeitId");
  const aid = reqText(attachmentId, "attachmentId");
  const now = new Date().toISOString();
  const found = db.prepare(`SELECT id FROM restarbeiten_attachments WHERE id = ? AND restarbeit_id = ?`).get(aid, rid);
  if (!found) throw new Error("attachment not found");

  const tx = db.transaction(() => {
    db.prepare(`UPDATE restarbeiten_attachments SET is_primary = 0, updated_at = ? WHERE restarbeit_id = ?`).run(now, rid);
    db.prepare(`UPDATE restarbeiten_attachments SET is_primary = 1, updated_at = ? WHERE id = ?`).run(now, aid);
  });
  tx();
}

function listRestarbeitAttachments(restarbeitId) {
  const db = initDatabase();
  const rid = reqText(restarbeitId, "restarbeitId");
  return db.prepare(`
    SELECT * FROM restarbeiten_attachments
    WHERE restarbeit_id = ?
    ORDER BY is_primary DESC, sort_order ASC, created_at ASC
  `).all(rid);
}

module.exports = {
  ensureRestarbeitProjectSettings,
  getRestarbeitProjectSettings,
  createRestarbeitItem,
  listRestarbeitItems,
  addRestarbeitAttachment,
  setPrimaryRestarbeitAttachment,
  listRestarbeitAttachments,
};
