import FirmsView from "./FirmsLegacyView.js";

const PROJECT = "project_participant";
const INVOICE = "invoice_customer";
const INVOICE_MODULE_IDS = new Set(["rechnung", "rechnungen"]);
const PROJECT_MODULE_IDS = new Set(["protokoll", "restarbeiten", "sigeko"]);

function usageCodes(firm) {
  if (Array.isArray(firm?.usages)) return firm.usages.map((value) => String(value || "").trim());
  const result = [];
  if (firm?.project_participant === true) result.push(PROJECT);
  if (firm?.invoice_customer === true) result.push(INVOICE);
  return result;
}

function usageLabels(firm, { invoiceLicensed = false } = {}) {
  const codes = new Set(usageCodes(firm));
  const labels = [];
  if (codes.has(PROJECT)) labels.push("Projektteilnehmer");
  if (invoiceLicensed && codes.has(INVOICE)) labels.push("Rechnungskunde");
  return labels;
}

function makeUsageBadge(label) {
  const badge = document.createElement("span");
  badge.textContent = label;
  Object.assign(badge.style, {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "22px",
    padding: "0 7px",
    borderRadius: "999px",
    background: label === "Rechnungskunde" ? "#eef4ff" : "#edf8ef",
    color: label === "Rechnungskunde" ? "#175cd3" : "#287a38",
    fontSize: "10px",
    fontWeight: "750",
    whiteSpace: "nowrap",
  });
  return badge;
}

function makeUsageCheckbox(label, checked = false) {
  const wrap = document.createElement("label");
  Object.assign(wrap.style, {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    minHeight: "38px",
    padding: "0 12px",
    border: "1px solid #d5dce7",
    borderRadius: "8px",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "650",
    color: "#344054",
    boxSizing: "border-box",
    transition: "background .12s ease, border-color .12s ease, color .12s ease",
  });

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = !!checked;
  Object.assign(input.style, {
    position: "absolute",
    opacity: "0",
    width: "1px",
    height: "1px",
    pointerEvents: "none",
  });

  const indicator = document.createElement("span");
  indicator.setAttribute("aria-hidden", "true");
  Object.assign(indicator.style, {
    width: "14px",
    height: "14px",
    border: "1px solid #aeb8c7",
    borderRadius: "4px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    flex: "0 0 auto",
    fontSize: "10px",
    lineHeight: "1",
    fontWeight: "500",
    color: "transparent",
    background: "#ffffff",
    transition: "background .12s ease, border-color .12s ease, color .12s ease",
  });
  indicator.textContent = "✓";

  const text = document.createElement("span");
  text.textContent = label;

  const sync = () => {
    const active = input.checked;
    wrap.style.background = active ? "#f3f7ff" : "#ffffff";
    wrap.style.borderColor = active ? "#a8c0ef" : "#d5dce7";
    wrap.style.color = active ? "#2459a9" : "#344054";
    indicator.style.background = active ? "#3d6fc4" : "#ffffff";
    indicator.style.borderColor = active ? "#3d6fc4" : "#aeb8c7";
    indicator.style.color = active ? "#ffffff" : "transparent";
  };
  input.addEventListener("change", sync);
  sync();

  wrap.append(input, indicator, text);
  return { wrap, input, sync };
}

export default class FirmsUsageView extends FirmsView {
  constructor(args = {}) {
    super(args);
    this.usageProjectParticipantEl = null;
    this.usageInvoiceCustomerEl = null;
    this.usageProjectParticipantSync = null;
    this.usageInvoiceCustomerSync = null;
    this.invoiceModuleLicensed = false;
    this.projectModuleLicensed = true;
  }

  render() {
    const root = super.render();

    const listTitle = Array.from(root.querySelectorAll("div")).find(
      (el) => String(el.textContent || "").trim() === "Firmenliste"
    );
    const listHead = listTitle?.parentElement || null;
    const listWrap = listHead?.parentElement || null;

    if (listHead && listWrap && !listWrap.querySelector("[data-bbm-firm-list-hint]")) {
      const hint = document.createElement("div");
      hint.setAttribute("data-bbm-firm-list-hint", "true");
      hint.textContent = "Firma anklicken zum Auswählen · Doppelklick zum Bearbeiten";
      Object.assign(hint.style, {
        fontSize: "12px",
        color: "#667085",
        margin: "-2px 0 8px 0",
        lineHeight: "1.35",
      });
      listHead.insertAdjacentElement("afterend", hint);
    }

    return root;
  }

  async _loadInvoiceLicenseState() {
    this.invoiceModuleLicensed = false;
    this.projectModuleLicensed = true;
    const api = window.bbmDb || {};
    if (typeof api.licenseGetStatus !== "function") return;

    try {
      const status = await api.licenseGetStatus();
      if (!status || status.valid === false) return;
      const moduleIds = (Array.isArray(status.modules) ? status.modules : [])
        .map((moduleId) => String(moduleId || "").trim().toLowerCase())
        .filter(Boolean);
      this.invoiceModuleLicensed = moduleIds.some((moduleId) => INVOICE_MODULE_IDS.has(moduleId));
      this.projectModuleLicensed = moduleIds.some((moduleId) => PROJECT_MODULE_IDS.has(moduleId));
    } catch (_error) {
      this.invoiceModuleLicensed = false;
      this.projectModuleLicensed = true;
    }
  }

  async load() {
    await this._loadInvoiceLicenseState();
    await super.load();
  }

  async _openEditorWindow(payload, onSaved, onDeleted) {
    if (payload?.kind === "firm") return false;
    return await super._openEditorWindow(payload, onSaved, onDeleted);
  }

  _usageFirmForEditor({ mode = "edit", firmId = null } = {}) {
    if (mode !== "edit") return null;
    const id = String(firmId || this.selectedFirmId || "").trim();
    if (!id) return this.selectedFirm || null;
    return (this.firms || []).find((firm) => String(firm?.id || "") === id) || this.selectedFirm || null;
  }

  _createUsageMode() {
    if (!this.invoiceModuleLicensed) return "project_only";
    if (!this.projectModuleLicensed) return "invoice_only";
    return "both";
  }

  _injectUsageControls(options = {}) {
    const host = this.firmGridEl || null;
    if (!host) return;

    const oldLabel = host.querySelector?.("[data-bbm-firm-usages-label]") || null;
    const oldPanel = host.querySelector?.("[data-bbm-firm-usages]") || null;
    oldLabel?.remove();
    oldPanel?.remove();

    const label = document.createElement("div");
    label.className = "bbm-form-label";
    label.setAttribute("data-bbm-firm-usages-label", "true");
    label.textContent = "Verwendung in BBM";

    const panel = document.createElement("div");
    panel.setAttribute("data-bbm-firm-usages", "true");
    Object.assign(panel.style, {
      display: "grid",
      gap: "6px",
      minWidth: "0",
    });

    const choices = document.createElement("div");
    Object.assign(choices.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap",
    });

    const isCreate = options?.mode === "create";
    const createMode = this._createUsageMode();
    const showProject = !isCreate || createMode !== "invoice_only";
    const showInvoice = this.invoiceModuleLicensed && (!isCreate || createMode !== "project_only");

    this.usageProjectParticipantEl = null;
    this.usageProjectParticipantSync = null;
    if (showProject) {
      const project = makeUsageCheckbox("Projektteilnehmer", isCreate && createMode === "project_only");
      this.usageProjectParticipantEl = project.input;
      this.usageProjectParticipantSync = project.sync;
      choices.append(project.wrap);
    }

    this.usageInvoiceCustomerEl = null;
    this.usageInvoiceCustomerSync = null;
    if (showInvoice) {
      const invoice = makeUsageCheckbox("Rechnungskunde", isCreate && createMode === "invoice_only");
      this.usageInvoiceCustomerEl = invoice.input;
      this.usageInvoiceCustomerSync = invoice.sync;
      choices.append(invoice.wrap);
    }

    panel.append(choices);

    const hint = document.createElement("div");
    Object.assign(hint.style, {
      fontSize: "10.5px",
      color: "#8a94a5",
      lineHeight: "1.2",
    });
    if (isCreate && createMode === "both") {
      hint.textContent = "Bitte Verwendung wählen · Mehrfachauswahl möglich";
      panel.append(hint);
    } else if (!isCreate && this.invoiceModuleLicensed) {
      hint.textContent = "Mehrfachauswahl möglich";
      panel.append(hint);
    }

    host.append(label, panel);

    if (!isCreate) {
      const firm = this._usageFirmForEditor(options);
      const codes = new Set(usageCodes(firm));
      if (this.usageProjectParticipantEl) this.usageProjectParticipantEl.checked = codes.has(PROJECT);
      if (this.usageInvoiceCustomerEl) this.usageInvoiceCustomerEl.checked = codes.has(INVOICE);
    }
    this.usageProjectParticipantSync?.();
    this.usageInvoiceCustomerSync?.();
  }

  async _openFirmEditor(options = {}) {
    const result = await super._openFirmEditor(options);
    this._injectUsageControls(options);
    return result;
  }

  _getFirmFormData() {
    const data = super._getFirmFormData();
    const usages = [];
    if (this.usageProjectParticipantEl?.checked) usages.push(PROJECT);

    if (this.invoiceModuleLicensed) {
      if (this.usageInvoiceCustomerEl?.checked) usages.push(INVOICE);
    } else {
      const existingCodes = new Set(usageCodes(this.selectedFirm));
      if (existingCodes.has(INVOICE)) usages.push(INVOICE);
    }

    return { ...data, usages };
  }

  _renderFirmsOnly() {
    super._renderFirmsOnly();
    const table = this.tableBodyEl?.parentElement || null;
    const headRow = table?.querySelector?.("thead tr") || null;
    if (!headRow || !this.tableBodyEl) return;

    let usageHead = headRow.querySelector?.("[data-bbm-usage-head]") || null;
    if (!usageHead) {
      usageHead = document.createElement("th");
      usageHead.setAttribute("data-bbm-usage-head", "true");
      usageHead.textContent = "Verwendung";
      Object.assign(usageHead.style, {
        textAlign: "left",
        padding: "6px",
        borderBottom: "1px solid #ddd",
        width: this.invoiceModuleLicensed ? "230px" : "150px",
      });
      headRow.append(usageHead);
    }

    const rows = Array.from(this.tableBodyEl.children || []);
    rows.forEach((row, index) => {
      row.querySelector?.("[data-bbm-usage-cell]")?.remove();
      const firm = this.firms[index];
      if (!firm) return;

      const cell = document.createElement("td");
      cell.setAttribute("data-bbm-usage-cell", "true");
      Object.assign(cell.style, {
        padding: "6px",
        borderBottom: "1px solid #eee",
      });

      const labels = usageLabels(firm, { invoiceLicensed: this.invoiceModuleLicensed });
      const badges = document.createElement("div");
      Object.assign(badges.style, {
        display: "flex",
        gap: "5px",
        flexWrap: "wrap",
      });
      for (const usageLabel of labels) badges.append(makeUsageBadge(usageLabel));
      if (!labels.length) {
        const none = document.createElement("span");
        none.textContent = "–";
        none.style.color = "#98a2b3";
        badges.append(none);
      }
      cell.append(badges);
      row.append(cell);
    });
  }

  async _saveFirm() {
    if (this.savingFirm) return;

    const data = this._getFirmFormData();
    if (!data.name) {
      alert("Name 1 ist Pflicht.");
      return;
    }
    if (this.firmMode === "create" && this._createUsageMode() === "both" && !data.usages.length) {
      alert("Bitte festlegen, ob die Firma Projektteilnehmer, Rechnungskunde oder beides ist.");
      return;
    }

    this.savingFirm = true;
    this._setMsg("Speichere…");
    this._applyFirmFormState();
    this._applyPersonFormState();

    try {
      let res = null;
      if (this.firmMode === "create") {
        res = await window.bbmDb.firmsCreateGlobal({ ...data });
        if (!res?.ok) {
          alert(res?.error || "Fehler beim Anlegen");
          return;
        }
        this.selectedFirmId = res?.firm?.id || null;
      } else if (this.firmMode === "edit" && this.selectedFirmId) {
        res = await window.bbmDb.firmsUpdateGlobal({
          firmId: this.selectedFirmId,
          patch: { ...data },
        });
        if (!res?.ok) {
          alert(res?.error || "Fehler beim Speichern");
          return;
        }
      } else {
        return;
      }

      this._closeFirmEditor();
      await this.reloadFirms();
      if (this.selectedFirmId) {
        this.selectedFirm =
          (this.firms || []).find((firm) => this._sameId(firm?.id, this.selectedFirmId)) || null;
      }
      this._renderFirmsOnly();
      this._renderFirmDetails();
    } finally {
      this.savingFirm = false;
      this._setMsg("");
      this._applyFirmFormState();
      this._applyPersonFormState();
      this._updateVisibility();
    }
  }

  _renderFirmDetails() {
    super._renderFirmDetails();
    if (!this.selectedFirm || !this.detailBodyEl) return;

    const labels = usageLabels(this.selectedFirm, { invoiceLicensed: this.invoiceModuleLicensed });
    const row = document.createElement("div");
    row.setAttribute("data-bbm-firm-usage-badges", "true");
    Object.assign(row.style, {
      display: "flex",
      gap: "6px",
      flexWrap: "wrap",
      marginTop: "2px",
      marginBottom: "2px",
    });

    if (!labels.length) {
      const none = document.createElement("span");
      none.textContent = "Keine Verwendung festgelegt";
      Object.assign(none.style, { fontSize: "11px", color: "#8a94a5" });
      row.append(none);
    } else {
      for (const usageLabel of labels) row.append(makeUsageBadge(usageLabel));
    }

    const actions = Array.from(this.detailBodyEl.children || []).find(
      (el) => el?.querySelector?.("button")
    );
    if (actions) this.detailBodyEl.insertBefore(row, actions);
    else this.detailBodyEl.append(row);
  }
}
