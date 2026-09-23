import FirmsView from "./FirmsLegacyView.js";

const PROJECT = "project_participant";

function usageCodes(firm) {
  if (Array.isArray(firm?.usages)) {
    return firm.usages
      .map((value) => String(value || "").trim())
      .filter((value) => value === PROJECT);
  }
  const project = firm?.uses?.projectParticipant ?? firm?.use_project_participant ?? firm?.project_participant;
  return project === true || Number(project) === 1 ? [PROJECT] : [];
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
    background: "#edf8ef",
    color: "#287a38",
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
  });
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = !!checked;
  const text = document.createElement("span");
  text.textContent = label;
  const sync = () => {
    const active = input.checked;
    wrap.style.background = active ? "#f3f7ff" : "#ffffff";
    wrap.style.borderColor = active ? "#a8c0ef" : "#d5dce7";
  };
  input.addEventListener("change", sync);
  sync();
  wrap.append(input, text);
  return { wrap, input, sync };
}

export default class FirmsUsageView extends FirmsView {
  constructor(args = {}) {
    super(args);
    this.usageProjectParticipantEl = null;
    this.usageProjectParticipantSync = null;
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
    const host = this.firmGridEl || null;
    if (!host) return;
    host.querySelector?.("[data-bbm-firm-usages-label]")?.remove();
    host.querySelector?.("[data-bbm-firm-usages]")?.remove();

    const label = document.createElement("div");
    label.className = "bbm-form-label";
    label.setAttribute("data-bbm-firm-usages-label", "true");
    label.textContent = "Verwendung in BBM";

    const panel = document.createElement("div");
    panel.setAttribute("data-bbm-firm-usages", "true");
    const firm = this._usageFirmForEditor(options);
    const isCreate = options?.mode === "create";
    const project = makeUsageCheckbox(
      "Projektteilnehmer",
      isCreate ? true : new Set(usageCodes(firm)).has(PROJECT)
    );
    this.usageProjectParticipantEl = project.input;
    this.usageProjectParticipantSync = project.sync;
    panel.append(project.wrap);
    host.append(label, panel);
  }

  async _openFirmEditor(options = {}) {
    const result = await super._openFirmEditor(options);
    this._injectUsageControls(options);
    return result;
  }

  _getFirmFormData() {
    const data = super._getFirmFormData();
    const usages = this.usageProjectParticipantEl?.checked ? [PROJECT] : [];
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
        width: "150px",
      });
      headRow.append(usageHead);
    }

    Array.from(this.tableBodyEl.children || []).forEach((row, index) => {
      row.querySelector?.("[data-bbm-usage-cell]")?.remove();
      const firm = this.firms[index];
      if (!firm) return;
      const cell = document.createElement("td");
      cell.setAttribute("data-bbm-usage-cell", "true");
      Object.assign(cell.style, { padding: "6px", borderBottom: "1px solid #eee" });
      if (new Set(usageCodes(firm)).has(PROJECT)) {
        cell.append(makeUsageBadge("Projektteilnehmer"));
      } else {
        const none = document.createElement("span");
        none.textContent = "–";
        none.style.color = "#98a2b3";
        cell.append(none);
      }
      row.append(cell);
    });
  }

  _renderFirmDetails() {
    super._renderFirmDetails();
    if (!this.selectedFirm || !this.detailBodyEl) return;
    const row = document.createElement("div");
    row.setAttribute("data-bbm-firm-usage-badges", "true");
    Object.assign(row.style, { display: "flex", gap: "6px", margin: "2px 0" });
    if (new Set(usageCodes(this.selectedFirm)).has(PROJECT)) {
      row.append(makeUsageBadge("Projektteilnehmer"));
    } else {
      const none = document.createElement("span");
      none.textContent = "Keine Projektverwendung festgelegt";
      Object.assign(none.style, { fontSize: "11px", color: "#8a94a5" });
      row.append(none);
    }
    const actions = Array.from(this.detailBodyEl.children || []).find((el) => el?.querySelector?.("button"));
    if (actions) this.detailBodyEl.insertBefore(row, actions);
    else this.detailBodyEl.append(row);
  }
}
