import FirmsView from "./FirmsLegacyView.js";

const PROJECT = "project_participant";
const INVOICE = "invoice_customer";

function usageCodes(firm) {
  if (Array.isArray(firm?.usages)) return firm.usages.map((value) => String(value || "").trim());
  const result = [];
  if (firm?.project_participant === true) result.push(PROJECT);
  if (firm?.invoice_customer === true) result.push(INVOICE);
  return result;
}

function usageLabels(firm) {
  const codes = new Set(usageCodes(firm));
  const labels = [];
  if (codes.has(PROJECT)) labels.push("Projektteilnehmer");
  if (codes.has(INVOICE)) labels.push("Rechnungskunde");
  return labels;
}

function makeUsageCheckbox(label, checked = false) {
  const wrap = document.createElement("label");
  Object.assign(wrap.style, {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    minHeight: "34px",
    padding: "0 10px",
    border: "1px solid #d7dee8",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "650",
    color: "#344054",
  });
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = !!checked;
  input.style.accentColor = "#2563eb";
  const text = document.createElement("span");
  text.textContent = label;
  wrap.append(input, text);
  return { wrap, input };
}

export default class FirmsUsageView extends FirmsView {
  constructor(args = {}) {
    super(args);
    this.usageProjectParticipantEl = null;
    this.usageInvoiceCustomerEl = null;
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

  _injectUsageControls(options = {}) {
    const host = this.editWrapEl || this.firmPopupBodyEl || null;
    if (!host) return;

    let box = host.querySelector?.("[data-bbm-firm-usages]") || null;
    if (!box) {
      box = document.createElement("div");
      box.setAttribute("data-bbm-firm-usages", "true");
      Object.assign(box.style, {
        border: "1px solid #dfe5ec",
        borderRadius: "10px",
        background: "#f8fafc",
        padding: "11px 12px",
        display: "grid",
        gap: "8px",
        marginTop: "10px",
        width: "100%",
        boxSizing: "border-box",
      });

      const title = document.createElement("div");
      title.textContent = "Verwendung in BBM";
      Object.assign(title.style, {
        fontSize: "12px",
        fontWeight: "800",
        color: "#172033",
      });

      const hint = document.createElement("div");
      hint.textContent = "Eine Firma kann mehrere Verwendungen gleichzeitig haben.";
      Object.assign(hint.style, {
        fontSize: "11px",
        color: "#667085",
      });

      const choices = document.createElement("div");
      Object.assign(choices.style, {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
      });

      const project = makeUsageCheckbox("Projektteilnehmer");
      const invoice = makeUsageCheckbox("Rechnungskunde");
      this.usageProjectParticipantEl = project.input;
      this.usageInvoiceCustomerEl = invoice.input;
      choices.append(project.wrap, invoice.wrap);
      box.append(title, hint, choices);
      host.append(box);
    } else {
      const inputs = box.querySelectorAll?.('input[type="checkbox"]') || [];
      this.usageProjectParticipantEl = inputs[0] || null;
      this.usageInvoiceCustomerEl = inputs[1] || null;
    }

    const firm = this._usageFirmForEditor(options);
    const codes = new Set(usageCodes(firm));
    if (this.usageProjectParticipantEl) this.usageProjectParticipantEl.checked = codes.has(PROJECT);
    if (this.usageInvoiceCustomerEl) this.usageInvoiceCustomerEl.checked = codes.has(INVOICE);
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
    if (this.usageInvoiceCustomerEl?.checked) usages.push(INVOICE);
    return { ...data, usages };
  }

  async _saveFirm() {
    if (this.savingFirm) return;

    const data = this._getFirmFormData();
    if (!data.name) {
      alert("Name 1 ist Pflicht.");
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

    const labels = usageLabels(this.selectedFirm);
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
      for (const label of labels) {
        const badge = document.createElement("span");
        badge.textContent = label;
        Object.assign(badge.style, {
          display: "inline-flex",
          alignItems: "center",
          minHeight: "24px",
          padding: "0 8px",
          borderRadius: "999px",
          background: label === "Rechnungskunde" ? "#eef4ff" : "#edf8ef",
          color: label === "Rechnungskunde" ? "#175cd3" : "#287a38",
          fontSize: "10.5px",
          fontWeight: "750",
        });
        row.append(badge);
      }
    }

    const actions = Array.from(this.detailBodyEl.children || []).find(
      (el) => el?.querySelector?.("button")
    );
    if (actions) this.detailBodyEl.insertBefore(row, actions);
    else this.detailBodyEl.append(row);
  }
}
