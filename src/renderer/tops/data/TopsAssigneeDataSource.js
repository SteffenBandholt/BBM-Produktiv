export class TopsAssigneeDataSource {
  constructor({ api } = {}) {
    this.api = api || window.bbmDb || {};
  }

  async loadCompaniesByProject(projectId) {
    if (typeof this.api.projectFirmsListByProject !== "function") return [];
    const id = String(projectId || "").trim();
    if (!id) return [];

    const res = await this.api.projectFirmsListByProject(id);
    if (res?.ok === false) return [];
    return Array.isArray(res?.rows) ? res.rows : [];
  }

  async loadEmployeesByCompany(companyId) {
    if (typeof this.api.personsListByFirm !== "function") return [];
    const id = String(companyId || "").trim();
    if (!id) return [];

    const res = await this.api.personsListByFirm(id);
    if (res?.ok === false) return [];
    return Array.isArray(res?.rows) ? res.rows : [];
  }
}

