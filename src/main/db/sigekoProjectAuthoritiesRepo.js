const { initDatabase } = require("./database");
const { PROJECT_AUTHORITY_COLUMNS, validateProjectAuthorityRow } = require("../../shared/sigeko/projectAuthorities.cjs");

class SigekoProjectAuthoritiesRepository {
  constructor({ dbProvider = initDatabase } = {}) { this.dbProvider = dbProvider; }
  transaction(fn) { return this.dbProvider().transaction(fn)(); }
  list(projectId) {
    return this.dbProvider().prepare("SELECT * FROM sigeko_project_authorities WHERE project_id = ? ORDER BY category, id").all(projectId);
  }
  get(projectId, category) {
    return this.dbProvider().prepare("SELECT * FROM sigeko_project_authorities WHERE project_id = ? AND category = ?").get(projectId, category) || null;
  }
  insert(row) {
    validateProjectAuthorityRow(row, row.project_id);
    const db = this.dbProvider();
    db.prepare(`INSERT INTO sigeko_project_authorities (${PROJECT_AUTHORITY_COLUMNS.join(",")})
      VALUES (${PROJECT_AUTHORITY_COLUMNS.map(key => `@${key}`).join(",")})`).run(row);
    return db.prepare("SELECT * FROM sigeko_project_authorities WHERE id = ?").get(row.id);
  }
  update(row, expectedRevision) {
    validateProjectAuthorityRow(row, row.project_id);
    const db = this.dbProvider();
    const columns = PROJECT_AUTHORITY_COLUMNS.filter(key => !["id", "project_id", "category", "created_at"].includes(key));
    const result = db.prepare(`UPDATE sigeko_project_authorities SET ${columns.map(key => `${key}=@${key}`).join(",")}
      WHERE id = @id AND project_id = @project_id AND category = @category AND revision = @expectedRevision`).run({ ...row, expectedRevision });
    if (result.changes !== 1) return null;
    return db.prepare("SELECT * FROM sigeko_project_authorities WHERE id = ?").get(row.id);
  }
}
module.exports = Object.freeze({ SigekoProjectAuthoritiesRepository });
