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

  _usageFirmForEditor({ mode = "edit", firmId = null } = {}) {
    if (mode !== "edit") return null;
    const id = String(firmId || this.selectedFirmId || "").trim();
    if (!id) return this.selectedFirm || null;
    return (this.firms || []).find((firm) => String(firm?.id || "") === id) || this.selectedFirm || null;
  }

  _injectUsageControls(options = {}) {
    const host = this.firmPopupBodyEl || this.editWrapEl || null;
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
    if (this.usageProjectParticipantEl) {
      this.usageProjectParticipantEl.checked = codes.has(PROJECT);
    }
    if (this.usageInvoiceCustomerEl) {
      this.usageInvoiceCustomerEl.checked = codes.has(INVOICE);
    }
  }

  async _openFirmEditor(options = {}) {
    const result = await super._openFirmEditor(options);
    queueMicrotask(() => this._injectUsageControls(options));
    return result;
  }

  _getFirmFormData() {
    const data = super._getFirmFormData();
    const usages = [];
    if (this.usageProjectParticipantEl?.checked) usages.push(PROJECT);
    if (this.usageInvoiceCustomerEl?.checked) usages.push(INVOICE);
    return { ...data, usages };
  }
}
