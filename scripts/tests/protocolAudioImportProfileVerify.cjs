"use strict";

const assert = require("node:assert/strict");
const Database = require("better-sqlite3");

const dbPath = String(process.env.BBM_AUDIO_IMPORT_PROFILE_DB || "").trim();
if (!dbPath) throw new Error("BBM_AUDIO_IMPORT_PROFILE_DB fehlt");

const db = new Database(dbPath, { readonly: true, fileMustExist: true });
try {
  const columns = new Set(db.prepare("PRAGMA table_info(tops)").all().map((row) => row.name));
  assert.equal(columns.has("special_type"), true);
  const root = db.prepare(`
    SELECT id, project_id, series_key, parent_top_id, level, number, title, special_type
    FROM tops
    WHERE special_type = 'audio_import' AND removed_at IS NULL AND COALESCE(is_trashed, 0) = 0
    ORDER BY created_at DESC
    LIMIT 1
  `).get();
  assert.ok(root);
  assert.equal(root.title, "Import");
  assert.equal(root.number, 0);
  const children = db.prepare(`
    SELECT t.id, t.title, mt.longtext
    FROM tops t
    JOIN meeting_tops mt ON mt.top_id = t.id
    WHERE t.parent_top_id = ?
    ORDER BY t.number
  `).all(root.id);
  assert.ok(children.length >= 1);
  const audio = db.prepare(`
    SELECT ai.status, tr.full_text
    FROM audio_imports ai
    JOIN transcripts tr ON tr.audio_import_id = ai.id
    WHERE ai.processing_mode = 'protocol_import'
    ORDER BY ai.created_at DESC
    LIMIT 1
  `).get();
  assert.equal(audio.status, "transcribed");
  assert.ok(String(audio.full_text || "").trim());
  console.log(JSON.stringify({
    ok: true,
    dbPath,
    schemaHasSpecialType: true,
    importRoot: root,
    childCount: children.length,
    children,
    transcriptLength: audio.full_text.length,
  }));
} finally {
  db.close();
}
