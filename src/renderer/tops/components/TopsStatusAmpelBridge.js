import { StatusAmpelField } from "../../core/status-ampel/index.js";

function toTrafficLight(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "red" || raw === "yellow" || raw === "green") return raw;
  return "off";
}

export class TopsStatusAmpelBridge {
  constructor({ metaPanel, onChange } = {}) {
    this.metaPanel = metaPanel || null;
    this.onChange = typeof onChange === "function" ? onChange : null;

    this.field = new StatusAmpelField({
      labels: {
        status: "Status",
        dueDate: "Fertig bis",
        trafficLight: "Ampel",
      },
    });
    this.root = this._buildRow();
    this._bindEvents();
    this._syncStatusOptionsFromMetaPanel();
  }

  _buildRow() {
    const row = document.createElement("label");
    row.className = "bbm-tops-meta-field";
    row.classList.add("bbm-tops-meta-field-status-ampel-bridge");

    const title = document.createElement("span");
    title.textContent = "Status / Fertig bis";

    const slot = document.createElement("div");
    slot.className = "bbm-tops-status-ampel-slot";
    slot.appendChild(this.field.getElement());

    row.append(title, slot);
    return row;
  }

  _bindEvents() {
    const el = this.field.getElement();
    el.addEventListener("change", () => this._syncToMetaPanel());
    el.addEventListener("input", () => this._syncToMetaPanel());
  }

  _syncStatusOptionsFromMetaPanel() {
    const options = Array.from(this.metaPanel?.selStatus?.options || []).map((option) => ({
      value: String(option.value || ""),
      label: String(option.textContent || option.value || ""),
      disabled: !!option.disabled,
    }));
    this.field.setStatusOptions(options);
  }

  mount() {
    if (!this.metaPanel?.root) return;
    this.metaPanel.root.appendChild(this.root);

    this.legacyDueRow = this.metaPanel.inpDueDate?.closest(".bbm-tops-meta-field");
    this.legacyStatusRow = this.metaPanel.selStatus?.closest(".bbm-tops-meta-field");
    if (this.legacyDueRow) this.legacyDueRow.style.display = "none";
    if (this.legacyStatusRow) this.legacyStatusRow.style.display = "none";
  }

  _syncToMetaPanel() {
    const value = this.field.getValue();
    if (this.metaPanel?.inpDueDate) this.metaPanel.inpDueDate.value = value.dueDate || "";
    if (this.metaPanel?.selStatus) this.metaPanel.selStatus.value = value.status || "-";
    if (this.onChange) this.onChange();
  }

  applyDraftValue(editor = {}) {
    this.field.setValue({
      status: editor?.status ?? "-",
      dueDate: editor?.due_date ?? "",
      trafficLight: toTrafficLight(editor?.trafficLight ?? editor?.traffic_light ?? editor?.ampel ?? "off"),
    });

    if (this.metaPanel?.inpDueDate) this.metaPanel.inpDueDate.value = editor?.due_date || "";
    if (this.metaPanel?.selStatus) this.metaPanel.selStatus.value = editor?.status || "-";
  }

  setDisabled(disabled) {
    this.field.setDisabled(!!disabled);
  }
}

