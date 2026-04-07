import {
  deriveMeetingParticipantOptionsFromActiveProjectEmployees,
  groupMeetingParticipantOptionsByCompany,
} from "../meetingParticipantDerivation.js";
import { mkEl, toText } from "./dom.js";

export class MeetingParticipantSelector {
  constructor({
    documentRef,
    onAdd,
    meetingId = "",
    projectId = "",
  } = {}) {
    this.documentRef = documentRef || window.document;
    this._onAdd = typeof onAdd === "function" ? onAdd : null;
    this._meetingId = toText(meetingId);
    this._projectId = toText(projectId);
    this._options = [];
    this._disabled = false;
    this._build();
  }

  _build() {
    const doc = this.documentRef;
    this.root = mkEl(doc, "section", "meeting-participant-selector");
    this.root.setAttribute("data-component", "meeting-participant-selector");

    const title = mkEl(doc, "div", "meeting-participant-selector-title", "Aktive Projekt-Mitarbeiter");
    const controls = mkEl(doc, "div", "meeting-participant-selector-controls");
    controls.style.display = "flex";
    controls.style.gap = "8px";
    controls.style.alignItems = "center";

    this.select = mkEl(doc, "select", "meeting-participant-selector-select");
    this.select.style.minWidth = "280px";
    this.select.addEventListener("change", () => this._applyButtonState());

    this.addBtn = mkEl(
      doc,
      "button",
      "meeting-participant-selector-btn meeting-participant-selector-btn-add",
      "Als Teilnehmer hinzufügen"
    );
    this.addBtn.type = "button";
    this.addBtn.addEventListener("click", () => {
      if (this._disabled) return;
      const value = toText(this.select.value);
      if (!value) return;
      const selected = this._options.find((option) => option.value === value) || null;
      if (!selected) return;
      if (this._onAdd) this._onAdd(selected);
    });

    controls.append(this.select, this.addBtn);
    this.root.append(title, controls);

    this._renderOptions();
    this.setDisabled(this._disabled);
  }

  _renderOptions() {
    const preferred = toText(this.select?.value);
    this.select.innerHTML = "";

    const empty = this.documentRef.createElement("option");
    empty.value = "";
    empty.textContent = "-";
    this.select.appendChild(empty);

    const groups = groupMeetingParticipantOptionsByCompany(this._options);
    for (const group of groups) {
      const optGroup = this.documentRef.createElement("optgroup");
      optGroup.label = group.companyLabel || "-";
      for (const option of group.options) {
        const opt = this.documentRef.createElement("option");
        opt.value = option.value;
        const roleSuffix = option.subLabel ? ` (${option.subLabel})` : "";
        opt.textContent = `${option.label}${roleSuffix}`;
        optGroup.appendChild(opt);
      }
      this.select.appendChild(optGroup);
    }

    if (preferred && this._options.some((option) => option.value === preferred)) {
      this.select.value = preferred;
    }
    this._applyButtonState();
  }

  _applyButtonState() {
    const hasSelection = Boolean(toText(this.select.value));
    this.addBtn.disabled = this._disabled || !hasSelection;
    this.addBtn.style.opacity = this.addBtn.disabled ? "0.55" : "1";
  }

  getElement() {
    return this.root;
  }

  mount(container) {
    if (!container) return;
    container.appendChild(this.root);
  }

  onAdd(callback) {
    this._onAdd = typeof callback === "function" ? callback : null;
  }

  setDisabled(disabled) {
    this._disabled = Boolean(disabled);
    this.select.disabled = this._disabled;
    this._applyButtonState();
  }

  setContext({ meetingId, projectId } = {}) {
    this._meetingId = toText(meetingId);
    this._projectId = toText(projectId);
  }

  setOptions(options) {
    this._options = Array.isArray(options) ? options.slice() : [];
    this._renderOptions();
  }

  setSourceData({ projectCompanies, projectCompanyEmployees } = {}) {
    this.setOptions(
      deriveMeetingParticipantOptionsFromActiveProjectEmployees({
        meetingId: this._meetingId,
        projectId: this._projectId,
        projectCompanies,
        projectCompanyEmployees,
      })
    );
  }
}

