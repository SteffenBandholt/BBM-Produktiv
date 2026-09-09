const { initDatabase } = require("./database");
const { AUTHORITY_COLUMNS } = require("../../shared/sigeko/authorities.cjs");

class SigekoAuthoritiesRepository {
  constructor({ dbProvider = initDatabase } = {}) { this.dbProvider = dbProvider; }
  transaction(fn) { return this.dbProvider().transaction(fn)(); }
  getById(id) {
    return this.dbProvider().prepare("SELECT * FROM sigeko_authority_records WHERE id = ?").get(id) || null;
  }
  list({ category = null } = {}) {
    const db = this.dbProvider();
    const order = "ORDER BY category, organization, id";
    return category === null
      ? db.prepare(`SELECT * FROM sigeko_authority_records ${order}`).all()
      : db.prepare(`SELECT * FROM sigeko_authority_records WHERE category = ? ${order}`).all(category);
  }
  insert(row) {
    const db = this.dbProvider();
    db.prepare(`INSERT INTO sigeko_authority_records (${AUTHORITY_COLUMNS.join(",")})
      VALUES (${AUTHORITY_COLUMNS.map(key => `@${key}`).join(",")})`).run(row);
    return db.prepare("SELECT * FROM sigeko_authority_records WHERE id = ?").get(row.id);
  }
  update(row, expectedRevision) {
    const db = this.dbProvider();
    const columns = AUTHORITY_COLUMNS.filter(key => !["id", "category", "created_at"].includes(key));
    const result = db.prepare(`UPDATE sigeko_authority_records SET ${columns.map(key => `${key}=@${key}`).join(",")}
      WHERE id = @id AND revision = @expectedRevision`).run({ ...row, expectedRevision });
    if (result.changes !== 1) return null;
    return db.prepare("SELECT * FROM sigeko_authority_records WHERE id = ?").get(row.id);
  }
}
module.exports = Object.freeze({ SigekoAuthoritiesRepository });
