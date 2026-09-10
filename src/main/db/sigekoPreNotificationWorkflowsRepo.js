"use strict";
const { initDatabase } = require("./database");
const { SIGEKO_PRE_NOTIFICATION_WORKFLOW_COLUMNS: COLUMNS, validatePreNotificationWorkflowRow } = require("../../shared/sigeko/preNotificationWorkflows.cjs");
function conflict() {
  throw Object.assign(new Error("Der Vorankündigungsablauf wurde zwischenzeitlich geändert. Bitte neu laden."), { code: "PRE_NOTIFICATION_WORKFLOW_CONFLICT" });
}
class SigekoPreNotificationWorkflowsRepository {
  constructor({ dbProvider = initDatabase } = {}) { this.dbProvider = dbProvider; }
  transaction(fn) { return this.dbProvider().transaction(fn)(); }
  get(projectId, documentId) {
    const row = this.dbProvider().prepare("SELECT * FROM sigeko_pre_notification_workflows WHERE project_id=? AND document_id=?").get(projectId, documentId);
    return row ? validatePreNotificationWorkflowRow(row, projectId) : null;
  }
  save(row, expectedRevision) {
    validatePreNotificationWorkflowRow(row, row.project_id);
    if (expectedRevision !== null && (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1)) conflict();
    if (row.revision !== (expectedRevision === null ? 1 : expectedRevision + 1)) conflict();
    return this.transaction(() => {
      const db = this.dbProvider();
      if (expectedRevision === null) {
        const result = db.prepare(`INSERT INTO sigeko_pre_notification_workflows (${COLUMNS.join(",")})
          VALUES (${COLUMNS.map(key => `@${key}`).join(",")}) ON CONFLICT(document_id) DO NOTHING`).run(row);
        if (result.changes !== 1) conflict();
      } else {
        const current = this.get(row.project_id, row.document_id);
        if (!current || current.revision !== expectedRevision) conflict();
        if (row.created_at !== current.created_at || row.updated_at < current.updated_at) {
          throw Object.assign(new Error("Zeitangaben des Vorankündigungsablaufs sind widersprüchlich."), { code: "PRE_NOTIFICATION_WORKFLOW_INVALID" });
        }
        const fields = COLUMNS.filter(key => !["document_id", "project_id", "created_at"].includes(key));
        const result = db.prepare(`UPDATE sigeko_pre_notification_workflows SET ${fields.map(key => `${key}=@${key}`).join(",")}
          WHERE document_id=@document_id AND project_id=@project_id AND revision=@expectedRevision`).run({ ...row, expectedRevision });
        if (result.changes !== 1) conflict();
      }
      return this.get(row.project_id, row.document_id);
    });
  }
}
module.exports = Object.freeze({ SigekoPreNotificationWorkflowsRepository });
