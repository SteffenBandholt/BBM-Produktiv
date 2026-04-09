import {
  ResponsibleField,
  buildCompanyAssigneeOptions,
} from "../../core/responsible/index.js";

export class TopsResponsibleBridge {
  constructor({
    metaPanel,
    loadCompanies,
    loadEmployeesByCompany,
    onChange,
  } = {}) {
    this.metaPanel = metaPanel || null;
    this.loadCompanies = typeof loadCompanies === "function" ? loadCompanies : null;
    this.loadEmployeesByCompany =
      typeof loadEmployeesByCompany === "function" ? loadEmployeesByCompany : null;
    this.onChange = typeof onChange === "function" ? onChange : null;

    this.sources = { companies: [] };
    this.options = [];
    this.currentValue = "";

    this.field = new ResponsibleField({ label: "Verantwortlich" });
    this.root = this._buildRow();
    this._bindFieldEvents();
  }

  _buildRow() {
    const row = document.createElement("label");
    row.className = "bbm-tops-meta-field";
    row.classList.add("bbm-tops-meta-field-responsible-bridge");

    const title = document.createElement("span");
    title.textContent = "Verantwortlich";

    const slot = document.createElement("div");
    slot.className = "bbm-tops-responsible-slot";
    slot.appendChild(this.field.getElement());

    row.append(title, slot);
    return row;
  }

  _bindFieldEvents() {
    const el = this.field.getElement();
    el.addEventListener("change", () => this._syncFromField());
    el.addEventListener("input", () => this._syncFromField());
  }

  mount() {
    if (!this.metaPanel?.root) return;
    this.metaPanel.root.appendChild(this.root);
  }

  async initialize() {
    const companies = await this._loadCompaniesSafe();
    this.sources = { companies };
    this._refreshOptions();
  }

  async _loadCompaniesSafe() {
    if (!this.loadCompanies) return [];
    try {
      const list = await this.loadCompanies();
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  // Wiederverwendbares Kernfeld:
  // `ResponsibleField` bleibt generisch, die Bridge uebersetzt nur zur TOP-Meta-Struktur.
  _readMetaResponsibleLabel() {
    if (typeof this.metaPanel?.getValue !== "function") return "";
    return String(this.metaPanel.getValue()?.responsible_label || "").trim();
  }

  _writeMetaResponsibleLabel(label, { silent = false } = {}) {
    if (typeof this.metaPanel?.updatePartial !== "function") return;
    this.metaPanel.updatePartial(
      {
        responsible_label: String(label || "").trim(),
      },
      { silent }
    );
  }

  _refreshOptions() {
    this.options = buildCompanyAssigneeOptions(this.sources.companies || [], {
      valuePrefix: "company",
    });

    if (
      this.currentValue &&
      !this.options.some((item) => String(item?.value || "") === String(this.currentValue || ""))
    ) {
      const fallbackLabel = this._readMetaResponsibleLabel() || this.currentValue;
      this.options = [{ value: this.currentValue, label: fallbackLabel }, ...this.options];
    }

    this.field.setOptions(this.options);
    if (this.currentValue) this.field.setValue(this.currentValue);
  }

  _syncFromField() {
    this.currentValue = this.field.getValue();
    const selected = this.options.find((item) => item.value === this.currentValue);
    const label = selected?.label || "";

    this._writeMetaResponsibleLabel(label);
    if (this.onChange) this.onChange();
  }

  _findOptionByLabel(label) {
    const normalizedWanted = String(label || "").trim().toLowerCase();
    return this.options.find(
      (item) => String(item?.label || "").trim().toLowerCase() === normalizedWanted
    );
  }

  _prependLegacyOption(label) {
    const normalizedLabel = String(label || "").trim();
    const legacyValue = `legacy:${normalizedLabel}`;
    this.options = [{ value: legacyValue, label: normalizedLabel }, ...this.options];
    this.field.setOptions(this.options);
    return legacyValue;
  }

  applyDraftValue(label) {
    const wanted = String(label || "").trim();

    if (!wanted) {
      this.currentValue = "";
      this.field.setValue("");
      this._writeMetaResponsibleLabel("", { silent: true });
      return;
    }

    const match = this._findOptionByLabel(wanted);

    if (match) {
      this.currentValue = match.value;
      this.field.setValue(match.value);
      this._writeMetaResponsibleLabel(match.label, { silent: true });
      return;
    }

    const legacyValue = this._prependLegacyOption(wanted);
    this.field.setValue(legacyValue);
    this.currentValue = legacyValue;
    this._writeMetaResponsibleLabel(wanted, { silent: true });
  }

  setDisabled(disabled) {
    this.field.setDisabled(!!disabled);
  }
}
