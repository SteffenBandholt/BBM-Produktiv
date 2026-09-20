"use strict";

function hasColumn(db, table, name) { return db.prepare(`PRAGMA table_info(${table})`).all().some(column => column.name === name); }
function ensureProjectMeetingSeries(db) {
  if (!hasColumn(db, "projects", "meeting_series_mask")) {
    db.exec("ALTER TABLE projects ADD COLUMN meeting_series_mask INTEGER NOT NULL DEFAULT 1 CHECK(meeting_series_mask BETWEEN 0 AND 7)");
  }
}
function ensureMeetingSeries(db) {
  db.transaction(() => {
    ensureProjectMeetingSeries(db);
    for (const table of ["meetings", "tops"]) {
      if (!hasColumn(db, table, "series_key")) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN series_key TEXT NOT NULL DEFAULT 'construction' CHECK(series_key IN ('construction','owner','planning'))`);
      }
    }
    const duplicate = db.prepare("SELECT project_id, series_key FROM meetings WHERE COALESCE(is_closed,0)=0 GROUP BY project_id, series_key HAVING COUNT(*)>1 LIMIT 1").get();
    if (duplicate) throw new Error(`Mehrere offene Protokolle in derselben Besprechungsreihe: ${duplicate.project_id}/${duplicate.series_key}. Migration ohne Datenänderung abgebrochen.`);
    db.exec(`
      DROP INDEX IF EXISTS idx_meetings_one_open_per_project;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_meetings_one_open_per_series ON meetings(project_id,series_key) WHERE is_closed=0;
      CREATE INDEX IF NOT EXISTS idx_meetings_project_series_index ON meetings(project_id,series_key,meeting_index);
      CREATE INDEX IF NOT EXISTS idx_tops_project_series_parent ON tops(project_id,series_key,parent_top_id,number);
      CREATE TRIGGER IF NOT EXISTS tops_series_parent_insert BEFORE INSERT ON tops
      WHEN NEW.parent_top_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tops p WHERE p.id=NEW.parent_top_id AND p.project_id=NEW.project_id AND p.series_key=NEW.series_key)
      BEGIN SELECT RAISE(ABORT,'Parent gehört zu einer anderen Besprechungsreihe'); END;
      CREATE TRIGGER IF NOT EXISTS tops_series_parent_update BEFORE UPDATE OF parent_top_id,project_id,series_key ON tops
      WHEN NEW.parent_top_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tops p WHERE p.id=NEW.parent_top_id AND p.project_id=NEW.project_id AND p.series_key=NEW.series_key)
      BEGIN SELECT RAISE(ABORT,'Parent gehört zu einer anderen Besprechungsreihe'); END;
      CREATE TRIGGER IF NOT EXISTS meeting_tops_series_insert BEFORE INSERT ON meeting_tops
      WHEN NOT EXISTS (SELECT 1 FROM meetings m JOIN tops t ON t.id=NEW.top_id WHERE m.id=NEW.meeting_id AND m.project_id=t.project_id AND m.series_key=t.series_key)
      BEGIN SELECT RAISE(ABORT,'TOP gehört zu einer anderen Besprechungsreihe'); END;
      CREATE TRIGGER IF NOT EXISTS meeting_tops_completion_series_insert BEFORE INSERT ON meeting_tops
      WHEN NEW.completed_in_meeting_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM meetings current JOIN meetings completed ON completed.id=NEW.completed_in_meeting_id
        WHERE current.id=NEW.meeting_id AND completed.project_id=current.project_id AND completed.series_key=current.series_key
          AND completed.meeting_index<=current.meeting_index
          AND (completed.id=current.id OR EXISTS (SELECT 1 FROM meeting_tops previous WHERE previous.meeting_id=completed.id AND previous.top_id=NEW.top_id)))
      BEGIN SELECT RAISE(ABORT,'Erledigungsreferenz gehört nicht zur TOP-Besprechungsreihe'); END;
      CREATE TRIGGER IF NOT EXISTS meeting_tops_completion_series_update BEFORE UPDATE OF completed_in_meeting_id,meeting_id,top_id ON meeting_tops
      WHEN NEW.completed_in_meeting_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM meetings current JOIN meetings completed ON completed.id=NEW.completed_in_meeting_id
        WHERE current.id=NEW.meeting_id AND completed.project_id=current.project_id AND completed.series_key=current.series_key
          AND completed.meeting_index<=current.meeting_index
          AND (completed.id=current.id OR EXISTS (SELECT 1 FROM meeting_tops previous WHERE previous.meeting_id=completed.id AND previous.top_id=NEW.top_id)))
      BEGIN SELECT RAISE(ABORT,'Erledigungsreferenz gehört nicht zur TOP-Besprechungsreihe'); END;
      CREATE TRIGGER IF NOT EXISTS meeting_tops_series_update BEFORE UPDATE OF meeting_id,top_id ON meeting_tops
      WHEN NOT EXISTS (SELECT 1 FROM meetings m JOIN tops t ON t.id=NEW.top_id WHERE m.id=NEW.meeting_id AND m.project_id=t.project_id AND m.series_key=t.series_key)
      BEGIN SELECT RAISE(ABORT,'TOP gehört zu einer anderen Besprechungsreihe'); END;
    `);
  })();
}
module.exports = { ensureProjectMeetingSeries, ensureMeetingSeries };
