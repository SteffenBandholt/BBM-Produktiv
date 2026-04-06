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

    this._appendField("Fertig bis", this.inpDueDate, { rowClass: "bbm-tops-meta-field-date" });
    this._appendField("Status", this.selStatus);
    this._appendField("Verantwortlich", this.inpResponsible);

    for (const el of [this.inpDueDate, this.selStatus, this.inpResponsible]) {
      el.addEventListener("change", () => this._emitChange());
      el.addEventListener("input", () => this._emitChange());
    }
  }

  _appendField(label, control, { rowClass = "" } = {}) {
    const row = document.createElement("label");
    row.className = "bbm-tops-meta-field";
    if (rowClass) row.classList.add(rowClass);
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
    };
  }

  setValue(value = {}) {
    this.inpDueDate.value = value?.due_date || "";
    this.selStatus.value = value?.status || "-";
    this.inpResponsible.value = value?.responsible_label || "";
  }

  setDisabled(disabled) {
    const dis = !!disabled;
    this.root.dataset.disabled = dis ? "true" : "false";
    for (const el of [this.inpDueDate, this.selStatus, this.inpResponsible]) {
      el.disabled = dis;
    }
  }
}
