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

  _companyVisibleLabel(row) {
    return (
      this._asText(row?.short || row?.name1 || row?.name || row?.label || row?.firm || row?.company) ||
      "Firma"
    );
  }

  _companyStableId(row) {
    return this._asText(
      row?.id ?? row?.projectFirmId ?? row?.project_company_id ?? row?.companyId ?? row?.firmId ?? row?.firm_id
    );
  }

  _dedupeCompanies(list) {
    const out = [];
    const seenIds = new Set();
    const seenLabels = new Set();

    for (const row of Array.isArray(list) ? list : []) {
      const id = this._companyStableId(row);
      const label = this._companyVisibleLabel(row).toLowerCase();
      if (!id || !label) continue;
      if (seenIds.has(id) || seenLabels.has(label)) continue;
      seenIds.add(id);
      seenLabels.add(label);
      out.push({
        ...row,
        id,
        short: this._asText(row?.short || row?.label || row?.name1 || row?.name || row?.firm || ""),
        name1: this._asText(row?.name1 || row?.name || row?.short || row?.firm || row?.label || "Firma"),
        active: this._asBool(row?.active ?? row?.is_active ?? row?.isActive, true),
      });
    }

    return out;
  }

  _projectCompanyKey({ projectId, sourceType, baseId }) {
    return `${this._asText(projectId) || "-"}|${this._asText(sourceType) || "stamm"}|${this._asText(baseId) || "-"}`;
  }

  _sourceTypeFromKind(kind) {
    return this._asText(kind) === "global_person" ? "stamm" : "projektlokal";
  }

  // Uebergangsschicht an der Modulgrenze:
  // Protokollnahe Projektion gemeinsamer Firmenstammdaten.
  // Hier werden Stammdaten in die fuer Tops/Verantwortlich benoetigte
  // projektbezogene Lesesicht uebersetzt.
  _createSharedCompanyProjection(projectId, row) {
    const sourceType = "stamm";
    const baseId =
      this._asText(row?.firmId ?? row?.firm_id ?? row?.companyId ?? row?.company_id ?? row?.id) || "-";
    const projectCompanyId = this._projectCompanyKey({
      projectId,
      sourceType,
      baseId,
    });

    return {
      projectCompanyId,
      company: {
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
      },
    };
  }

  // Uebergangs-/Poolsicht:
  // Der Teilnehmerpool mischt heute stammbezogene und projektlokale Firmenpfade.
  _createPoolCompanyProjection(projectId, row) {
    const sourceType = this._sourceTypeFromKind(row?.kind);
    const baseId = this._asText(row?.firmId ?? row?.firm_id) || "-";
    const projectCompanyId = this._projectCompanyKey({
      projectId,
      sourceType,
      baseId,
    });

    return {
      projectCompanyId,
      company: {
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
      },
    };
  }

  _createActivePoolEmployee(projectCompanyId, row) {
    const personId = this._asText(row?.personId ?? row?.person_id ?? row?.id);
    if (!personId) return null;

    const isEmployeeActive = this._asBool(row?.is_active ?? row?.isActive, true);
    const isFirmActive = this._asBool(
      row?.firmIsActive ?? row?.firm_is_active ?? row?.is_firm_active,
      true
    );
    if (!isEmployeeActive || !isFirmActive) return null;

    return {
      id: personId,
      companyId: projectCompanyId,
      firstName: this._asText(row?.firstName ?? row?.vorname),
      lastName: this._asText(row?.lastName ?? row?.nachname),
      displayName: this._asText(row?.name),
      role: this._asText(row?.rolle ?? row?.role),
      email: this._asText(row?.email ?? row?.email_raw),
      phone: this._asText(row?.phone ?? row?.tel),
      active: true,
    };
  }

  async loadCompaniesByProject(projectId) {
    const id = String(projectId || "").trim();
    if (!id) return [];

    this._lastProjectId = id;
    this._employeesByProjectCompany = new Map();

    const candidateCompanies = [];

    if (typeof this.api.projectFirmsListFirmCandidatesByProject === "function") {
      try {
        const res = await this.api.projectFirmsListFirmCandidatesByProject(id);
        if (res?.ok !== false) {
          for (const row of this._pickRows(res)) {
            if (!this._asBool(row?.is_active ?? row?.isActive, true)) continue;
            candidateCompanies.push({
              id: this._companyStableId(row),
              short: this._asText(row?.short || row?.label || ""),
              name1: this._asText(row?.name || row?.name1 || row?.short || row?.label || ""),
              active: true,
            });
          }
        }
      } catch {
        // fallback below
      }
    }

    if (!candidateCompanies.length && typeof this.api.projectFirmsListByProject === "function") {
      try {
        const res = await this.api.projectFirmsListByProject(id);
        if (res?.ok !== false) {
          for (const row of this._pickRows(res)) {
            if (!this._asBool(row?.is_active ?? row?.isActive, true)) continue;
            candidateCompanies.push({
              id: this._companyStableId(row),
              short: this._asText(row?.short || row?.name1 || row?.name || ""),
              name1: this._asText(row?.name || row?.name1 || row?.short || ""),
              active: true,
            });
          }
        }
      } catch {
        // keep pool fallback
      }
    }

    if (typeof this.api.projectParticipantsPool === "function") {
      try {
        const poolRes = await this.api.projectParticipantsPool({ projectId: id });
        if (poolRes?.ok !== false) {
          for (const row of this._pickRows(poolRes)) {
            const companyId = this._asText(row?.firmId ?? row?.firm_id ?? row?.id);
            const employee = this._createActivePoolEmployee(companyId, row);
            if (!employee) continue;
            if (!companyId) continue;
            const employees = this._employeesByProjectCompany.get(companyId) || [];
            employees.push(employee);
            this._employeesByProjectCompany.set(companyId, employees);
          }
        }
      } catch {
        // keep firm-only fallback
      }
    }

    const companies = this._dedupeCompanies(candidateCompanies);
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
