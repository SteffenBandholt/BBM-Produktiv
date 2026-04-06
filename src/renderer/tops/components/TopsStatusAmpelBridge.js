import { StatusAmpelField } from "../../core/status-ampel/index.js";
import { computeAmpelColorForTop } from "../../../shared/ampel/pdfAmpelRule.js";

function toTrafficLight(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "blue" || raw === "red" || raw === "orange" || raw === "green") return raw;
  return "none";
}

function deriveTrafficLight({ status, due_date }) {
  const color = computeAmpelColorForTop({
    top: { status, due_date },
    childrenColors: [],
    now: new Date(),
  });
  return toTrafficLight(color);
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
    const row = document.createElement("div");
    row.className = "bbm-tops-meta-field";
    row.classList.add("bbm-tops-meta-field-status-ampel-bridge");

    const slot = document.createElement("div");
    slot.className = "bbm-tops-status-ampel-slot";
    slot.appendChild(this.field.getElement());

    row.appendChild(slot);
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
    const trafficLight = deriveTrafficLight({
      status: value.status || "-",
      due_date: value.dueDate || null,
    });
    this.field.setTrafficLight(trafficLight);

    if (typeof this.metaPanel?.updatePartial === "function") {
      this.metaPanel.updatePartial({
        due_date: value.dueDate || null,
        status: value.status || "-",
      });
    }

    if (this.onChange) this.onChange();
  }

  applyDraftValue(editor = {}) {
    const trafficLight = deriveTrafficLight({
      status: editor?.status ?? "-",
      due_date: editor?.due_date ?? null,
    });

    this.field.setValue({
      status: editor?.status ?? "-",
      dueDate: editor?.due_date ?? "",
      trafficLight,
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
