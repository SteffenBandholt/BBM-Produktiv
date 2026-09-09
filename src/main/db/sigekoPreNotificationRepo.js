const { initDatabase } = require("./database");
const { PRE_NOTIFICATION_COLUMNS, validatePreNotificationRow } = require("../../shared/sigeko/preNotifications.cjs");

class SigekoPreNotificationRepository {
  constructor({ dbProvider = initDatabase } = {}) { this.dbProvider = dbProvider; }
  transaction(fn) { return this.dbProvider().transaction(fn)(); }
  get(projectId) {
    return this.dbProvider().prepare("SELECT * FROM sigeko_pre_notifications WHERE project_id = ?").get(projectId) || null;
  }
  insert(row) {
    validatePreNotificationRow(row, row.project_id);
    const db = this.dbProvider();
    db.prepare(`INSERT INTO sigeko_pre_notifications (${PRE_NOTIFICATION_COLUMNS.join(",")})
      VALUES (${PRE_NOTIFICATION_COLUMNS.map(key => `@${key}`).join(",")})`).run(row);
    return this.get(row.project_id);
  }
  update(row, expectedRevision) {
    validatePreNotificationRow(row, row.project_id);
    const db = this.dbProvider();
    const columns = PRE_NOTIFICATION_COLUMNS.filter(key => !["id", "project_id", "created_at"].includes(key));
    const result = db.prepare(`UPDATE sigeko_pre_notifications SET ${columns.map(key => `${key}=@${key}`).join(",")}
      WHERE id = @id AND project_id = @project_id AND revision = @expectedRevision`).run({ ...row, expectedRevision });
    return result.changes === 1 ? this.get(row.project_id) : null;
  }
}
module.exports = Object.freeze({ SigekoPreNotificationRepository });
