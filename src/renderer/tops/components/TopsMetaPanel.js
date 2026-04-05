export class TopsMetaPanel {
  constructor({ onChange } = {}) {
    this.onChange = typeof onChange === "function" ? onChange : null;
    this.root = document.createElement("div");
    this.root.className = "bbm-tops-meta-panel";
    this.root.dataset.disabled = "false";

    this.inpDueDate = document.createElement("input");
    this.inpDueDate.type = "date";
    this.selStatus = document.createElement("select");
    for (const value of ["-", "todo", "inprogress", "done"]) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = value === "-" ? "-" : value;
      this.selStatus.appendChild(opt);
    }
    this.inpResponsible = document.createElement("input");
    this.inpResponsible.type = "text";
    this.inpResponsible.placeholder = "verantwortlich";

    this.chkImportant = this._mkCheckbox("wichtig");
    this.chkHidden = this._mkCheckbox("TOP ausblenden");
    this.chkDecision = this._mkCheckbox("Entscheidung");

    this._appendField("Fertig bis", this.inpDueDate);
    this._appendField("Status", this.selStatus);
    this._appendField("Verantwortlich", this.inpResponsible);
    this.root.append(this.chkImportant.wrap, this.chkHidden.wrap, this.chkDecision.wrap);

    for (const el of [
      this.inpDueDate,
      this.selStatus,
      this.inpResponsible,
      this.chkImportant.input,
      this.chkHidden.input,
      this.chkDecision.input,
    ]) {
      el.addEventListener("change", () => this._emitChange());
      el.addEventListener("input", () => this._emitChange());
    }
  }

  _mkCheckbox(label) {
    const wrap = document.createElement("label");
    wrap.className = "bbm-tops-meta-checkbox";
    const input = document.createElement("input");
    input.type = "checkbox";
    const text = document.createElement("span");
    text.textContent = label;
    wrap.append(input, text);
    return { wrap, input };
  }

  _appendField(label, control) {
    const row = document.createElement("label");
    row.className = "bbm-tops-meta-field";
    const t = document.createElement("span");
    t.textContent = label;
    control.classList.add("bbm-tops-input");
    row.append(t, control);
    this.root.appendChild(row);
  }

  _emitChange() {
    if (this.onChange) this.onChange(this.getValue());
  }

  getValue() {
    return {
      due_date: (this.inpDueDate.value || "").trim() || null,
      status: (this.selStatus.value || "").trim() || "-",
      responsible_label: (this.inpResponsible.value || "").trim() || "",
      is_important: this.chkImportant.input.checked ? 1 : 0,
      is_hidden: this.chkHidden.input.checked ? 1 : 0,
      is_decision: this.chkDecision.input.checked ? 1 : 0,
    };
  }

  setValue(value = {}) {
    this.inpDueDate.value = value?.due_date || "";
    this.selStatus.value = value?.status || "-";
    this.inpResponsible.value = value?.responsible_label || "";
    this.chkImportant.input.checked = Number(value?.is_important) === 1;
    this.chkHidden.input.checked = Number(value?.is_hidden) === 1;
    this.chkDecision.input.checked = Number(value?.is_decision) === 1;
  }

  setDisabled(disabled) {
    const dis = !!disabled;
    this.root.dataset.disabled = dis ? "true" : "false";
    for (const el of [
      this.inpDueDate,
      this.selStatus,
      this.inpResponsible,
      this.chkImportant.input,
      this.chkHidden.input,
      this.chkDecision.input,
    ]) {
      el.disabled = dis;
    }
  }
}
