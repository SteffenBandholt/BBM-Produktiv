const TOPS_META_DEFAULT_VALUE = Object.freeze({
  due_date: null,
  status: "-",
  responsible_label: "",
});

const TOPS_META_STATUS_OPTIONS = Object.freeze([
  { value: "-", label: "-", disabled: false },
  { value: "offen", label: "offen", disabled: false },
  { value: "in arbeit", label: "in arbeit", disabled: false },
  { value: "erledigt", label: "erledigt", disabled: false },
  { value: "blockiert", label: "blockiert", disabled: false },
  { value: "verzug", label: "verzug", disabled: false },
]);

export class TopsMetaPanel {
  constructor({ onChange } = {}) {
    this.onChange = typeof onChange === "function" ? onChange : null;

    this.root = document.createElement("div");
    this.root.className = "bbm-tops-meta-panel";
    this.root.dataset.disabled = "false";

    this._disabled = false;
    // Protokollspezifische Workbench-Huelle:
    // haelt den TOP-Draft fuer Meta-Felder, ist aber kein gemeinsamer generischer Kernbaustein.
    this._value = { ...TOPS_META_DEFAULT_VALUE };
    this._statusOptions = TOPS_META_STATUS_OPTIONS.map((item) => ({ ...item }));
  }

  _normalizeValue(value = {}) {
    return {
      due_date: (value?.due_date || "").trim() || null,
      status: (value?.status || "").trim() || "-",
      responsible_label: (value?.responsible_label || "").trim() || "",
    };
  }

  _emitChange() {
    if (this.onChange) this.onChange(this.getValue());
  }

  getValue() {
    return { ...this._value };
  }

  setValue(value = {}, { silent = true } = {}) {
    this._value = this._normalizeValue(value);
    if (!silent) this._emitChange();
  }

  updatePartial(partial = {}, { silent = false } = {}) {
    this._value = this._normalizeValue({
      ...this._value,
      ...(partial || {}),
    });
    if (!silent) this._emitChange();
  }

  setDisabled(disabled) {
    this._disabled = !!disabled;
    this.root.dataset.disabled = this._disabled ? "true" : "false";
  }

  isDisabled() {
    return this._disabled;
  }

  getStatusOptions() {
    return this._statusOptions.map((item) => ({ ...item }));
  }

  setStatusOptions(options = []) {
    const normalized = Array.isArray(options)
      ? options.map((item) => ({
          value: String(item?.value || ""),
          label: String(item?.label || item?.value || ""),
          disabled: !!item?.disabled,
        }))
      : [];

    if (!normalized.length) return;
    this._statusOptions = normalized;
  }
}
