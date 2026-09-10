"use strict";
const { initDatabase } = require("./database");
const { SIGEKO_DOCUMENT_COLUMNS, validateSigekoDocumentRow } = require("../../shared/sigeko/documents.cjs");
const { DOCUMENT_TYPE } = require("../../shared/sigeko/preNotificationSnapshots.cjs");
class SigekoDocumentsRepository {
  constructor({ dbProvider = initDatabase } = {}) { this.dbProvider = dbProvider; }
  transaction(fn) { return this.dbProvider().transaction(fn)(); }
  get(projectId, documentId) {
    const row = this.dbProvider().prepare("SELECT * FROM sigeko_documents WHERE project_id=? AND id=? AND document_type=?")
      .get(projectId, documentId, DOCUMENT_TYPE);
    return row ? validateSigekoDocumentRow(row, projectId) : null;
  }
  list(projectId) {
    return this.dbProvider().prepare("SELECT * FROM sigeko_documents WHERE project_id=? AND document_type=? ORDER BY created_at DESC, id DESC")
      .all(projectId, DOCUMENT_TYPE).map(row => validateSigekoDocumentRow(row, projectId));
  }
  insert(row) {
    validateSigekoDocumentRow(row, row.project_id);
    this.dbProvider().prepare(`INSERT INTO sigeko_documents (${SIGEKO_DOCUMENT_COLUMNS.join(",")})
      VALUES (${SIGEKO_DOCUMENT_COLUMNS.map(key => `@${key}`).join(",")})`).run(row);
    return this.get(row.project_id, row.id);
  }
}
module.exports = Object.freeze({ SigekoDocumentsRepository });
