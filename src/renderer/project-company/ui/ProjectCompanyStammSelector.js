import { getCompanyDisplayLabel, normalizeCompanyList } from "../../stamm/firmen/index.js";
import { mkEl, toText } from "./dom.js";

export class ProjectCompanyStammSelector {
  constructor({ documentRef, onAdd } = {}) {
    this.documentRef = documentRef || window.document;
    this._onAdd = typeof onAdd === "function" ? onAdd : null;
    this._companies = [];
    this._disabled = false;
    this._build();
  }

  _build() {
    const doc = this.documentRef;
    this.root = mkEl(doc, "section", "project-company-stamm-selector");
    this.root.setAttribute("data-component", "project-company-stamm-selector");

    const label = mkEl(doc, "label", "project-company-stamm-selector-label", "Firma aus Stamm");
    this.select = mkEl(doc, "select", "project-company-stamm-selector-select");
    label.appendChild(this.select);

    this.addBtn = mkEl(
      doc,
      "button",
      "project-company-stamm-selector-btn project-company-stamm-selector-btn-add",
      "Zum Projekt hinzufügen"
    );
    this.addBtn.type = "button";
    this.addBtn.addEventListener("click", () => {
      const selectedId = toText(this.select.value);
      if (!selectedId) return;
      const selected = this._companies.find((company) => company.id === selectedId) || null;
      if (!selected) return;
      if (this._onAdd) this._onAdd(selected);
    });

    this.root.append(label, this.addBtn);
    this._renderOptions();
    this.setDisabled(this._disabled);
  }

  _renderOptions(preferredValue = "") {
    const selected = toText(preferredValue || this.select?.value);
    this.select.innerHTML = "";
    const empty = this.documentRef.createElement("option");
    empty.value = "";
    empty.textContent = "-";
    this.select.appendChild(empty);

    for (const company of this._companies) {
      const option = this.documentRef.createElement("option");
      option.value = company.id;
      option.textContent = getCompanyDisplayLabel(company);
      this.select.appendChild(option);
    }

    if (selected && this._companies.some((company) => company.id === selected)) {
      this.select.value = selected;
    }
  }

  getElement() {
    return this.root;
  }

  mount(container) {
    if (!container) return;
    container.appendChild(this.root);
  }

  setDisabled(disabled) {
    this._disabled = Boolean(disabled);
    this.select.disabled = this._disabled;
    this.addBtn.disabled = this._disabled;
    this.addBtn.style.opacity = this._disabled ? "0.55" : "1";
  }

  setCompanies(stammCompanies) {
    this._companies = normalizeCompanyList(stammCompanies);
    this._renderOptions();
  }

  onAdd(callback) {
    this._onAdd = typeof callback === "function" ? callback : null;
  }
}

