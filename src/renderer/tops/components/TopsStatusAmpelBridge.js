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
    const options =
      typeof this.metaPanel?.getStatusOptions === "function"
        ? this.metaPanel.getStatusOptions()
        : [];
    this.field.setStatusOptions(options);
  }

  mount() {
    if (!this.metaPanel?.root) return;
    this.metaPanel.root.appendChild(this.root);
  }

  _syncToMetaPanel() {
    const value = this.field.getValue();

    if (typeof this.metaPanel?.updatePartial === "function") {
      this.metaPanel.updatePartial({
        due_date: value.dueDate || null,
        status: value.status || "-",
      });
    }

    if (this.onChange) this.onChange();
  }

  applyDraftValue(editor = {}) {
    this.field.setValue({
      status: editor?.status ?? "-",
      dueDate: editor?.due_date ?? "",
      trafficLight: toTrafficLight(
        editor?.trafficLight ?? editor?.traffic_light ?? editor?.ampel ?? "off"
      ),
    });

    if (typeof this.metaPanel?.updatePartial === "function") {
      this.metaPanel.updatePartial(
        {
          due_date: editor?.due_date || null,
          status: editor?.status || "-",
        },
        { silent: true }
      );
    }
  }

  setDisabled(disabled) {
    this.field.setDisabled(!!disabled);
  }
}