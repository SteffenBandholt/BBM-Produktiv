import {
  buildCompanyAssigneeOptions,
  buildEmployeeAssigneeOptions,
} from "../core/responsible/ResponsibleOptionsAdapter.js";
import {
  normalizeCompanyList,
  findCompanyById,
  getCompanyDisplayLabel,
} from "../stamm/firmen/index.js";
import {
  normalizeEmployeeList,
  findEmployeeById,
  filterEmployeesByCompany,
  getEmployeeDisplayName,
} from "../stamm/mitarbeiter/index.js";

function mkEl(doc, tag, className, text) {
  const el = doc.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function asText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function asId(value) {
  const text = asText(value);
  return text || null;
}

function normalizeValue(value = {}) {
  const raw = value && typeof value === "object" ? value : {};
  return {
    companyId: asId(raw.companyId),
    companyLabel: asText(raw.companyLabel),
    employeeId: asId(raw.employeeId),
    employeeLabel: asText(raw.employeeLabel),
  };
}

function optionLabelByValue(options, value) {
  const wanted = asText(value);
  if (!wanted) return "";
  const hit = options.find((option) => asText(option?.value) === wanted);
  return hit ? asText(hit.label) : "";
}

function ensureFallbackOption(options, id, label) {
  const wantedId = asText(id);
  if (!wantedId) return options;
  if (options.some((option) => asText(option?.value) === wantedId)) return options;

  const fallbackLabel = asText(label) || wantedId;
  return [{ value: wantedId, label: fallbackLabel }, ...options];
}

function normalizeOptions(rawOptions) {
  if (!Array.isArray(rawOptions)) return [];
  return rawOptions
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const value = asText(item.value);
      if (!value) return null;
      return {
        value,
        label: asText(item.label) || value,
        disabled: Boolean(item.disabled),
      };
    })
    .filter(Boolean);
}

export class CompanyEmployeeField {
  constructor({
    documentRef,
    companyLabel = "Firma",
    employeeLabel = "Mitarbeiter",
    onChange,
  } = {}) {
    this.documentRef = documentRef || window.document;
    this._onChange = typeof onChange === "function" ? onChange : null;
    this._disabled = false;
    this._readOnly = false;

    this._companies = [];
    this._employees = [];
    this._value = normalizeValue();

    this._build(companyLabel, employeeLabel);
    this._renderAll({ emit: false });
  }

  _build(companyLabel, employeeLabel) {
    const doc = this.documentRef;

    this.root = mkEl(doc, "section", "company-employee-field");
    this.root.setAttribute("data-component", "company-employee-field");

    this.companyWrap = mkEl(doc, "label", "company-employee-field-label");
    this.companyLabelEl = mkEl(doc, "span", "company-employee-field-label-text", companyLabel);
    this.companySelect = mkEl(doc, "select", "company-employee-field-select");
    this.companySelect.autocomplete = "off";
    this.companyWrap.append(this.companyLabelEl, this.companySelect);

    this.employeeWrap = mkEl(doc, "label", "company-employee-field-label");
    this.employeeLabelEl = mkEl(doc, "span", "company-employee-field-label-text", employeeLabel);
    this.employeeSelect = mkEl(doc, "select", "company-employee-field-select");
    this.employeeSelect.autocomplete = "off";
    this.employeeWrap.append(this.employeeLabelEl, this.employeeSelect);

    this.root.append(this.companyWrap, this.employeeWrap);

    this.companySelect.addEventListener("change", () => {
      this._syncCompanyFromSelect();
      this._renderEmployeeOptions();
      this._emitChange();
    });

    this.employeeSelect.addEventListener("change", () => {
      this._syncEmployeeFromSelect();
      this._emitChange();
    });
  }

  getElement() {
    return this.root;
  }

  mount(container) {
    if (!container) return;
    container.appendChild(this.root);
  }

  onChange(callback) {
    this._onChange = typeof callback === "function" ? callback : null;
  }

  setDisabled(disabled) {
    this._disabled = Boolean(disabled);
    this._applyControlState();
    this.root.classList.toggle("is-disabled", this._disabled);
  }

  setReadOnly(readOnly) {
    this._readOnly = Boolean(readOnly);
    this._applyControlState();
    this.root.classList.toggle("is-read-only", this._readOnly);
  }

  setCompanies(companies) {
    this._companies = normalizeCompanyList(companies);
    this._renderCompanyOptions();
    this._renderEmployeeOptions();
  }

  setEmployees(employees) {
    this._employees = normalizeEmployeeList(employees);
    this._renderEmployeeOptions();
  }

  setValue(value) {
    this._value = normalizeValue(value);

    const company = findCompanyById(this._companies, this._value.companyId);
    if (company) {
      this._value.companyLabel = getCompanyDisplayLabel(company);
    }

    const employee = findEmployeeById(this._employees, this._value.employeeId);
    if (employee) {
      this._value.employeeLabel = getEmployeeDisplayName(employee);
      if (!this._value.companyId && employee.companyId) {
        this._value.companyId = employee.companyId;
      }
    }

    this._renderAll({ emit: false });
  }

  getValue() {
    return {
      companyId: this._value.companyId,
      companyLabel: this._value.companyLabel,
      employeeId: this._value.employeeId,
      employeeLabel: this._value.employeeLabel,
    };
  }

  _renderAll({ emit = false } = {}) {
    this._renderCompanyOptions();
    this._renderEmployeeOptions();
    this._applyControlState();
    if (emit) this._emitChange();
  }

  _renderCompanyOptions() {
    let options = normalizeOptions(
      buildCompanyAssigneeOptions(this._companies, { valuePrefix: "" })
    );

    options = ensureFallbackOption(options, this._value.companyId, this._value.companyLabel);
    this._applyOptions(this.companySelect, options, this._value.companyId);

    const selectedId = asId(this.companySelect.value);
    this._value.companyId = selectedId;
    this._value.companyLabel = optionLabelByValue(options, selectedId) || this._value.companyLabel;
  }

  _renderEmployeeOptions() {
    const companyId = this._value.companyId;
    const filteredEmployees = companyId
      ? filterEmployeesByCompany(this._employees, companyId)
      : this._employees;

    let options = normalizeOptions(
      buildEmployeeAssigneeOptions(filteredEmployees, {
        companyId: null,
        valuePrefix: "",
      })
    );

    const employeeKnown = this._value.employeeId
      ? findEmployeeById(filteredEmployees, this._value.employeeId)
      : null;

    if (!employeeKnown && this._value.employeeId && companyId) {
      this._value.employeeId = null;
      this._value.employeeLabel = "";
    }

    options = ensureFallbackOption(options, this._value.employeeId, this._value.employeeLabel);
    this._applyOptions(this.employeeSelect, options, this._value.employeeId);

    const selectedId = asId(this.employeeSelect.value);
    this._value.employeeId = selectedId;
    this._value.employeeLabel = optionLabelByValue(options, selectedId) || this._value.employeeLabel;
  }

  _applyOptions(selectEl, options, preferredValue) {
    const wanted = asText(preferredValue);
    selectEl.innerHTML = "";

    const empty = this.documentRef.createElement("option");
    empty.value = "";
    empty.textContent = "-";
    selectEl.appendChild(empty);

    options.forEach((option) => {
      const el = this.documentRef.createElement("option");
      el.value = option.value;
      el.textContent = option.label;
      el.disabled = Boolean(option.disabled);
      selectEl.appendChild(el);
    });

    if (wanted && options.some((option) => option.value === wanted)) {
      selectEl.value = wanted;
    } else {
      selectEl.value = "";
    }
  }

  _syncCompanyFromSelect() {
    const companyId = asId(this.companySelect.value);
    this._value.companyId = companyId;
    this._value.companyLabel = "";

    if (companyId) {
      const company = findCompanyById(this._companies, companyId);
      this._value.companyLabel = company ? getCompanyDisplayLabel(company) : optionLabelByValue(
        normalizeOptions(buildCompanyAssigneeOptions(this._companies, { valuePrefix: "" })),
        companyId
      );
    }

    const employeeInCompany = this._value.employeeId
      ? findEmployeeById(filterEmployeesByCompany(this._employees, companyId), this._value.employeeId)
      : null;

    if (!employeeInCompany) {
      this._value.employeeId = null;
      this._value.employeeLabel = "";
    }
  }

  _syncEmployeeFromSelect() {
    const employeeId = asId(this.employeeSelect.value);
    this._value.employeeId = employeeId;
    this._value.employeeLabel = "";

    if (!employeeId) return;

    const employee = findEmployeeById(this._employees, employeeId);
    if (employee) {
      this._value.employeeLabel = employee.displayName || employee.name;
      if (!this._value.companyId && employee.companyId) {
        this._value.companyId = employee.companyId;
        const company = findCompanyById(this._companies, employee.companyId);
        this._value.companyLabel = company ? getCompanyDisplayLabel(company) : this._value.companyLabel;
        this._renderCompanyOptions();
      }
      return;
    }

    this._value.employeeLabel = optionLabelByValue(
      normalizeOptions(
        buildEmployeeAssigneeOptions(this._employees, {
          valuePrefix: "",
        })
      ),
      employeeId
    );
  }

  _emitChange() {
    if (!this._onChange) return;
    this._onChange(this.getValue());
  }

  _applyControlState() {
    const disabled = this._disabled || this._readOnly;
    this.companySelect.disabled = disabled;
    this.employeeSelect.disabled = disabled;
  }
}
