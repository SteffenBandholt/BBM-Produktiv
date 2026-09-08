const { initDatabase } = require("./database");
const { PROFILE_FIELDS, PROJECT_COLUMNS } = require("../../shared/sigeko/projectRoles.cjs");

class SigekoProjectRepository {
  constructor({ dbProvider = initDatabase } = {}) { this.dbProvider = dbProvider; }
  transaction(fn) { return this.dbProvider().transaction(fn)(); }
  getProject(projectId) {
    return this.dbProvider().prepare("SELECT * FROM sigeko_projects WHERE project_id = ?").get(projectId) || null;
  }
  saveProject(row) {
    this.dbProvider().prepare(`INSERT INTO sigeko_projects (${PROJECT_COLUMNS.join(",")})
      VALUES (${PROJECT_COLUMNS.map(key => `@${key}`).join(",")})
      ON CONFLICT(project_id) DO UPDATE SET ${PROJECT_COLUMNS.filter(key => !["id", "project_id", "created_at"].includes(key))
        .map(key => `${key}=excluded.${key}`).join(",")}`).run(row);
    return this.getProject(row.project_id);
  }
  getProfile() {
    return this.dbProvider().prepare("SELECT * FROM sigeko_profiles WHERE id = 'standard'").get() || null;
  }
  saveProfile(row) {
    const columns = ["id", ...PROFILE_FIELDS, "created_at", "updated_at"];
    this.dbProvider().prepare(`INSERT INTO sigeko_profiles (${columns.join(",")}) VALUES (${columns.map(key => `@${key}`).join(",")})
      ON CONFLICT(id) DO UPDATE SET ${[...PROFILE_FIELDS, "updated_at"].map(key => `${key}=excluded.${key}`).join(",")}`).run(row);
    return this.getProfile();
  }
}
module.exports = Object.freeze({ SigekoProjectRepository });
