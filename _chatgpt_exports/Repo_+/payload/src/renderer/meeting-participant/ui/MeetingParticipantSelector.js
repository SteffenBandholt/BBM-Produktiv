import { buildMeetingParticipantCandidateOptions } from "../meetingParticipantDerivation.js";
import { mkEl } from "./dom.js";

export class MeetingParticipantSelector {
  constructor({ documentRef, onAdd } = {}) {
    this.documentRef = documentRef || window.document;
    this._onAdd = typeof onAdd === "function" ? onAdd : null;
    this._readOnly = false;
    this._meetingId = "";
    this._projectId = "";
    this._projectCompanies = [];
    this._projectCompanyEmployees = [];
    this._currentParticipants = [];
    this._options = [];
    this._build();
  }

  _build() {
    const doc = this.documentRef;
    this.root = mkEl(doc, "section", "meeting-participant-selector");
    this.root.setAttribute("data-component", "meeting-participant-selector");

    const title = mkEl(doc, "div", "meeting-participant-selector-title", "Aktive Projekt-Mitarbeiter");

    this.row = mkEl(doc, "div", "meeting-participant-selector-row");
    this.row.style.display = "grid";
    this.row.style.gridTemplateColumns = "1fr auto";
    this.row.style.gap = "8px";

    this.selectEl = mkEl(doc, "select", "meeting-participant-selector-select");
    this.selectEl.style.minWidth = "240px";

    this.addButton = mkEl(doc, "button", "meeting-participant-selector-add", "Hinzufuegen");
    this.addButton.type = "button";
    this.addButton.addEventListener("click", () => this._handleAdd());

    this.row.append(this.selectEl, this.addButton);
    this.root.append(title, this.row);
    this._render();
  }

  _computeOptions() {
    return buildMeetingParticipantCandidateOptions({
      meetingId: this._meetingId,
      projectId: this._projectId,
      projectCompanies: this._projectCompanies,
      projectCompanyEmployees: this._projectCompanyEmployees,
      currentParticipants: this._currentParticipants,
    });
  }

  _render() {
    this._options = this._computeOptions();
    this.selectEl.innerHTML = "";

    const placeholder = this.documentRef.createElement("option");
    placeholder.value = "";
    placeholder.textContent = this._options.length
      ? "Bitte Mitarbeiter waehlen"
      : "Keine aktiven Mitarbeiter verfuegbar";
    this.selectEl.appendChild(placeholder);

    for (const option of this._options) {
      const opt = this.documentRef.createElement("option");
      opt.value = option.value;
      const company = option.companyLabel ? ` (${option.companyLabel})` : "";
      const role = option.role ? ` - ${option.role}` : "";
      opt.textContent = `${option.label}${company}${role}`;
      opt.disabled = Boolean(option.disabled);
      this.selectEl.appendChild(opt);
    }

    const disabled = this._readOnly || this._options.length === 0;
    this.selectEl.disabled = disabled;
    this.addButton.disabled = disabled;
    this.addButton.style.opacity = disabled ? "0.55" : "1";
  }

  _handleAdd() {
    if (this._readOnly) return;
    const selectedValue = this.selectEl.value;
    if (!selectedValue) return;
    const selected = this._options.find((entry) => entry.value === selectedValue);
    if (!selected || selected.disabled) return;
    if (this._onAdd) this._onAdd(selected.participant);
  }

  setContext({ meetingId, projectId } = {}) {
    this._meetingId = meetingId || "";
    this._projectId = projectId || "";
    this._render();
  }

  setProjectData({ projectCompanies, projectCompanyEmployees } = {}) {
    this._projectCompanies = Array.isArray(projectCompanies) ? projectCompanies : [];
    this._projectCompanyEmployees = Array.isArray(projectCompanyEmployees)
      ? projectCompanyEmployees
      : [];
    this._render();
  }

  setCurrentParticipants(participants) {
    this._currentParticipants = Array.isArray(participants) ? participants : [];
    this._render();
  }

  setReadOnly(readOnly) {
    this._readOnly = Boolean(readOnly);
    this._render();
  }

  onAdd(callback) {
    this._onAdd = typeof callback === "function" ? callback : null;
  }

  getElement() {
    return this.root;
  }

  mount(container) {
    if (!container) return;
    container.appendChild(this.root);
  }
}
