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

  // Wiederverwendbares Kernfeld:
  // `StatusAmpelField` bleibt generisch, die Bridge koppelt nur an TOP-Meta-Draft und TOP-Ampelregel.
  _readMetaDraftValue() {
    return typeof this.metaPanel?.getValue === "function" ? this.metaPanel.getValue() : {};
  }

  _writeMetaDraftValue(partial, { silent = false } = {}) {
    if (typeof this.metaPanel?.updatePartial !== "function") return;
    this.metaPanel.updatePartial(partial, { silent });
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
    this.field.setTrafficLight(
      deriveTrafficLight({
        status: value.status || "-",
        due_date: value.dueDate || null,
      })
    );

    this._writeMetaDraftValue({
      due_date: value.dueDate || null,
      status: value.status || "-",
    });

    if (this.onChange) this.onChange();
  }

  applyDraftValue(metaDraft = {}) {
    const currentMetaDraft = {
      ...this._readMetaDraftValue(),
      ...(metaDraft || {}),
    };
    const trafficLight = deriveTrafficLight({
      status: currentMetaDraft?.status ?? "-",
      due_date: currentMetaDraft?.due_date ?? null,
    });

    this.field.setValue({
      status: currentMetaDraft?.status ?? "-",
      dueDate: currentMetaDraft?.due_date ?? "",
      trafficLight,
    });

    this._writeMetaDraftValue(
      {
        due_date: currentMetaDraft?.due_date || null,
        status: currentMetaDraft?.status || "-",
      },
      { silent: true }
    );
  }

  setDisabled(disabled) {
    this.field.setDisabled(!!disabled);
  }
}
