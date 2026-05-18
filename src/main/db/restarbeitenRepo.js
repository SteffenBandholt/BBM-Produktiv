const crypto = require("node:crypto");
const { initDatabase } = require("./database");

const ALLOWED_STATUS = new Set([
  "offen",
  "in arbeit",
  "erledigt",
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
  if (ALLOWED_STATUS.has(clean)) return clean;
  if (clean === "in_arbeit") return "in arbeit";
  if (clean === "erledigt_gemeldet" || clean === "geprueft_erledigt") return "erledigt";
  return "offen";
}

function normalizeRestarbeitItemClass(value) {
  const clean = toText(value);
  if (!clean) return "rest";
  const normalized = clean.toLowerCase();
  return ALLOWED_ITEM_CLASSES.has(normalized) ? normalized : "rest";
}

function buildRestarbeitUpdatePatch(patch = {}) {
  const out = {};

  if (patch.location_level_1 !== undefined) out.location_level_1 = toText(patch.location_level_1);
  if (patch.location_level_2 !== undefined) out.location_level_2 = toText(patch.location_level_2);
  if (patch.location_level_3 !== undefined) out.location_level_3 = toText(patch.location_level_3);
  if (patch.location_level_4 !== undefined) out.location_level_4 = toText(patch.location_level_4);
  if (patch.short_text !== undefined) out.short_text = toText(patch.short_text) || "";
  if (patch.long_text !== undefined) out.long_text = toText(patch.long_text) || "";
  if (patch.item_class !== undefined) out.item_class = normalizeRestarbeitItemClass(patch.item_class);
  if (patch.status !== undefined) out.status = normalizeStatus(patch.status);
  if (patch.due_date !== undefined) out.due_date = toText(patch.due_date);
  if (patch.responsible_project_firm_id !== undefined) {
    out.responsible_project_firm_id = toText(patch.responsible_project_firm_id);
  }
  if (patch.responsible_label !== undefined) out.responsible_label = toText(patch.responsible_label);
  if (patch.completed_at !== undefined) out.completed_at = toText(patch.completed_at);
  if (patch.completion_note !== undefined) out.completion_note = toText(patch.completion_note) || "";

  return out;
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

function createRestarbeitItem(projectIdOrPayload = {}, payload = {}) {
  const db = initDatabase();
  const sourcePayload =
    projectIdOrPayload && typeof projectIdOrPayload === "object" && !Array.isArray(projectIdOrPayload)
      ? projectIdOrPayload
      : payload;
  const pidCandidate =
    typeof projectIdOrPayload === "string" || typeof projectIdOrPayload === "number"
      ? projectIdOrPayload
      : sourcePayload.project_id ?? sourcePayload.projectId;
  const pid = reqText(pidCandidate, "project_id");
  const now = new Date().toISOString();
  const nextRunning = db
    .prepare(`SELECT COALESCE(MAX(running_number), 0) + 1 AS next_no FROM restarbeiten_items WHERE project_id = ?`)
    .get(pid)?.next_no;
  const runningNumber = nextRunning;

  const id = toText(sourcePayload.id) || crypto.randomUUID();
  const sortOrder = Number.isFinite(Number(sourcePayload.sort_order)) ? Number(sourcePayload.sort_order) : 0;
  const data = {
    id,
    project_id: pid,
    running_number: runningNumber,
    sort_order: sortOrder,
    location_level_1: toText(sourcePayload.location_level_1),
    location_level_2: toText(sourcePayload.location_level_2),
    location_level_3: toText(sourcePayload.location_level_3),
    location_level_4: toText(sourcePayload.location_level_4),
    short_text: toText(sourcePayload.short_text) || "",
    long_text: toText(sourcePayload.long_text) || "",
    item_class: normalizeRestarbeitItemClass(sourcePayload.item_class),
    status: normalizeStatus(sourcePayload.status),
    due_date: toText(sourcePayload.due_date),
    responsible_project_firm_id: toText(sourcePayload.responsible_project_firm_id),
    responsible_label: toText(sourcePayload.responsible_label),
    source: toText(sourcePayload.source) || "desktop",
    import_batch_id: toText(sourcePayload.import_batch_id),
    archived_at: toText(sourcePayload.archived_at),
    completed_at: toText(sourcePayload.completed_at),
    completion_note: toText(sourcePayload.completion_note) || "",
    deleted_at: null,
    verified_at: toText(sourcePayload.verified_at),
    created_at: now,
    updated_at: now,
  };

  db.prepare(`
    INSERT INTO restarbeiten_items (
      id, project_id, running_number, sort_order,
      location_level_1, location_level_2, location_level_3, location_level_4,
      short_text, long_text, item_class, status, due_date,
      responsible_project_firm_id, responsible_label, source, import_batch_id,
      archived_at, completed_at, completion_note, deleted_at, verified_at, created_at, updated_at
    ) VALUES (
      @id, @project_id, @running_number, @sort_order,
      @location_level_1, @location_level_2, @location_level_3, @location_level_4,
      @short_text, @long_text, @item_class, @status, @due_date,
      @responsible_project_firm_id, @responsible_label, @source, @import_batch_id,
      @archived_at, @completed_at, @completion_note, @deleted_at, @verified_at, @created_at, @updated_at
    )
  `).run(data);
  return db.prepare(`SELECT * FROM restarbeiten_items WHERE id = ?`).get(id);
}

function updateRestarbeitItem(id, patch = {}) {
  const db = initDatabase();
  const rid = reqText(id, "id");
  const existing = db.prepare(`SELECT * FROM restarbeiten_items WHERE id = ?`).get(rid);
  if (!existing) throw new Error("restarbeit not found");

  const data = buildRestarbeitUpdatePatch(patch);
  const keys = Object.keys(data);
  if (!keys.length) {
    return existing;
  }

  const setClause = keys.map((key) => `${key} = @${key}`).join(", ");
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE restarbeiten_items
    SET ${setClause},
        updated_at = @updated_at
    WHERE id = @id
  `).run({
    id: rid,
    updated_at: now,
    ...data,
  });

  if (!result || Number(result.changes || 0) < 1) {
    throw new Error("restarbeit not found");
  }

  const updated = db.prepare(`SELECT * FROM restarbeiten_items WHERE id = ?`).get(rid);
  if (!updated) throw new Error("restarbeit not found");
  return updated;
}

function listRestarbeitItems(projectId, { includeArchived = false, includeDeleted = false } = {}) {
  const db = initDatabase();
  const pid = reqText(projectId, "projectId");
  const archivedWhere = includeArchived ? "" : "AND archived_at IS NULL";
  const deletedWhere = includeDeleted ? "" : "AND deleted_at IS NULL";
  return db.prepare(`
    SELECT * FROM restarbeiten_items
    WHERE project_id = ? ${archivedWhere} ${deletedWhere}
    ORDER BY sort_order ASC, running_number ASC, created_at ASC
  `).all(pid);
}


function softDeleteRestarbeitItem(id) {
  const db = initDatabase();
  const rid = reqText(id, "id");
  const existing = db.prepare(`SELECT * FROM restarbeiten_items WHERE id = ?`).get(rid);
  if (!existing) throw new Error("restarbeit not found");
  if (toText(existing.deleted_at)) return existing;
  const now = new Date().toISOString();
  db.prepare(`UPDATE restarbeiten_items SET deleted_at = ?, updated_at = ? WHERE id = ?`).run(now, now, rid);
  return db.prepare(`SELECT * FROM restarbeiten_items WHERE id = ?`).get(rid);
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


function deleteRestarbeitAttachment(restarbeitId, attachmentId) {
  const db = initDatabase();
  const rid = reqText(restarbeitId, "restarbeitId");
  const aid = reqText(attachmentId, "attachmentId");

  const attachment = db.prepare(`
    SELECT * FROM restarbeiten_attachments
    WHERE id = ? AND restarbeit_id = ?
  `).get(aid, rid);
  if (!attachment) throw new Error("attachment not found");

  const filePath = toText(attachment.file_path);
  const thumbnailPath = toText(attachment.thumbnail_path);
  const wasPrimary = Number(attachment.is_primary) === 1 || attachment.is_primary === true;
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM restarbeiten_attachments WHERE id = ? AND restarbeit_id = ?`).run(aid, rid);

    if (wasPrimary) {
      const next = db.prepare(`
        SELECT id FROM restarbeiten_attachments
        WHERE restarbeit_id = ?
        ORDER BY sort_order ASC, created_at ASC
        LIMIT 1
      `).get(rid);

      if (next?.id) {
        db.prepare(`UPDATE restarbeiten_attachments SET is_primary = 1, updated_at = ? WHERE id = ?`).run(now, next.id);
      }
    }
  });

  tx();

  return {
    deleted: true,
    attachment,
    file_path: filePath,
    thumbnail_path: thumbnailPath,
  };
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
  updateRestarbeitItem,
  listRestarbeitItems,
  addRestarbeitAttachment,
  setPrimaryRestarbeitAttachment,
  listRestarbeitAttachments,
  deleteRestarbeitAttachment,
  softDeleteRestarbeitItem,
};
