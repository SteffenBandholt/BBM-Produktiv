export class TopsAssigneeDataSource {
  constructor({ api } = {}) {
    this.api = api || window.bbmDb || {};
    this._lastProjectId = "";
    this._employeesByProjectCompany = new Map();
  }

  _asText(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  }

  _asBool(value, fallback = true) {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "boolean") return value;
    const text = this._asText(value).toLowerCase();
    if (!text) return fallback;
    if (["0", "false", "no", "nein", "inactive"].includes(text)) return false;
    if (["1", "true", "yes", "ja", "active"].includes(text)) return true;
    return fallback;
  }

  _pickRows(res) {
    if (Array.isArray(res?.rows)) return res.rows;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.list)) return res.list;
    return [];
  }

  _projectCompanyKey({ projectId, sourceType, baseId }) {
    return `${this._asText(projectId) || "-"}|${this._asText(sourceType) || "stamm"}|${this._asText(baseId) || "-"}`;
  }

  _sourceTypeFromKind(kind) {
    return this._asText(kind) === "global_person" ? "stamm" : "projektlokal";
  }

  async loadCompaniesByProject(projectId) {
    const id = String(projectId || "").trim();
    if (!id) return [];

    this._lastProjectId = id;
    this._employeesByProjectCompany = new Map();

    const companiesById = new Map();

    if (typeof this.api.projectFirmsListByProject === "function") {
      try {
        const res = await this.api.projectFirmsListByProject(id);
        if (res?.ok !== false) {
          for (const row of this._pickRows(res)) {
            const sourceType = "stamm";
            const baseId =
              this._asText(row?.firmId ?? row?.firm_id ?? row?.companyId ?? row?.company_id ?? row?.id) || "-";
            const projectCompanyId = this._projectCompanyKey({
              projectId: id,
              sourceType,
              baseId,
            });
            if (!companiesById.has(projectCompanyId)) {
              companiesById.set(projectCompanyId, {
                id: projectCompanyId,
                projectCompanyId,
                companyId: baseId,
                sourceType,
                name1:
                  this._asText(row?.name1 ?? row?.Name1 ?? row?.name ?? row?.firm_name ?? row?.firmName) ||
                  "Firma",
                short:
                  this._asText(row?.short ?? row?.kurz ?? row?.label ?? row?.name1 ?? row?.Name1) ||
                  this._asText(row?.name1 ?? row?.Name1 ?? row?.name) ||
                  "Firma",
                active: this._asBool(row?.active ?? row?.is_active ?? row?.isActive, true),
              });
            }
          }
        }
      } catch {
        // robust fallback: continue with project pool
      }
    }

    if (typeof this.api.projectParticipantsPool === "function") {
      try {
        const poolRes = await this.api.projectParticipantsPool({ projectId: id });
        if (poolRes?.ok !== false) {
          for (const row of this._pickRows(poolRes)) {
            const sourceType = this._sourceTypeFromKind(row?.kind);
            const baseId = this._asText(row?.firmId ?? row?.firm_id) || "-";
            const projectCompanyId = this._projectCompanyKey({
              projectId: id,
              sourceType,
              baseId,
            });

            if (!companiesById.has(projectCompanyId)) {
              companiesById.set(projectCompanyId, {
                id: projectCompanyId,
                projectCompanyId,
                companyId: sourceType === "stamm" ? baseId : null,
                localCompanyId: sourceType === "projektlokal" ? baseId : "",
                sourceType,
                name1: this._asText(row?.firm || row?.firm_name || row?.firmName) || "Firma",
                short: this._asText(row?.firm || row?.firm_name || row?.firmName) || "Firma",
                active: this._asBool(
                  row?.firmIsActive ?? row?.firm_is_active ?? row?.is_firm_active,
                  true
                ),
              });
            }

            const personId = this._asText(row?.personId ?? row?.person_id ?? row?.id);
            if (!personId) continue;
            const isEmployeeActive = this._asBool(row?.is_active ?? row?.isActive, true);
            const isFirmActive = this._asBool(
              row?.firmIsActive ?? row?.firm_is_active ?? row?.is_firm_active,
              true
            );
            if (!isEmployeeActive || !isFirmActive) continue;

            const employees = this._employeesByProjectCompany.get(projectCompanyId) || [];
            employees.push({
              id: personId,
              companyId: projectCompanyId,
              firstName: this._asText(row?.firstName ?? row?.vorname),
              lastName: this._asText(row?.lastName ?? row?.nachname),
              displayName: this._asText(row?.name),
              role: this._asText(row?.rolle ?? row?.role),
              email: this._asText(row?.email ?? row?.email_raw),
              phone: this._asText(row?.phone ?? row?.tel),
              active: true,
            });
            this._employeesByProjectCompany.set(projectCompanyId, employees);
          }
        }
      } catch {
        // keep project-firm-only fallback
      }
    }

    const companies = [...companiesById.values()];
    companies.sort((a, b) => {
      const an = this._asText(a?.short || a?.name1).toLowerCase();
      const bn = this._asText(b?.short || b?.name1).toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });
    return companies;
  }

  async loadEmployeesByCompany(companyId) {
    const id = String(companyId || "").trim();
    if (!id) return [];
    return [...(this._employeesByProjectCompany.get(id) || [])];
  }
}
