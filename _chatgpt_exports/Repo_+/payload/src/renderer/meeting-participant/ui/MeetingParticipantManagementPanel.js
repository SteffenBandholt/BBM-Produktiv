import { MeetingParticipantSelector } from "./MeetingParticipantSelector.js";
import { MeetingParticipantList } from "./MeetingParticipantList.js";
import { normalizeMeetingParticipantList } from "../meetingParticipantModel.js";
import { mkEl } from "./dom.js";

export class MeetingParticipantManagementPanel {
  constructor({
    documentRef,
    meetingId,
    projectId,
    onParticipantsChange,
  } = {}) {
    this.documentRef = documentRef || window.document;
    this.meetingId = meetingId || "";
    this.projectId = projectId || "";
    this._onParticipantsChange =
      typeof onParticipantsChange === "function" ? onParticipantsChange : null;

    this._participants = [];
    this._projectCompanies = [];
    this._projectCompanyEmployees = [];
    this._readOnly = false;

    this._build();
  }

  _build() {
    const doc = this.documentRef;
    this.root = mkEl(doc, "section", "meeting-participant-management-panel");
    this.root.setAttribute("data-component", "meeting-participant-management-panel");

    this.root.style.display = "grid";
    this.root.style.gap = "10px";

    this.selector = new MeetingParticipantSelector({
      documentRef: doc,
      onAdd: (participant) => this._addParticipant(participant),
    });

    this.list = new MeetingParticipantList({
      documentRef: doc,
      onRemove: (participant) => this._removeParticipant(participant),
      onToggleActive: (participant, nextValue) => this._toggleActive(participant, nextValue),
      onToggleInvited: (participant, nextValue) => this._toggleInvited(participant, nextValue),
    });

    this.root.append(this.selector.getElement(), this.list.getElement());
    this._syncChildren();
  }

  _emitChange() {
    if (this._onParticipantsChange) {
      this._onParticipantsChange(normalizeMeetingParticipantList(this._participants));
    }
  }

  _syncChildren() {
    this.selector.setContext({ meetingId: this.meetingId, projectId: this.projectId });
    this.selector.setProjectData({
      projectCompanies: this._projectCompanies,
      projectCompanyEmployees: this._projectCompanyEmployees,
    });
    this.selector.setCurrentParticipants(this._participants);
    this.selector.setReadOnly(this._readOnly);

    this.list.setReadOnly(this._readOnly);
    this.list.setParticipants(this._participants);
  }

  _addParticipant(participant) {
    if (this._readOnly) return;
    const next = normalizeMeetingParticipantList([...this._participants, participant]);
    this._participants = next;
    this._syncChildren();
    this._emitChange();
  }

  _removeParticipant(participant) {
    if (this._readOnly) return;
    const pid = participant?.id;
    this._participants = normalizeMeetingParticipantList(this._participants).filter((item) => item.id !== pid);
    this._syncChildren();
    this._emitChange();
  }

  _toggleActive(participant, nextValue) {
    if (this._readOnly) return;
    const pid = participant?.id;
    this._participants = normalizeMeetingParticipantList(this._participants).map((item) => {
      if (item.id !== pid) return item;
      return { ...item, active: Boolean(nextValue) };
    });
    this._syncChildren();
    this._emitChange();
  }

  _toggleInvited(participant, nextValue) {
    if (this._readOnly) return;
    const pid = participant?.id;
    this._participants = normalizeMeetingParticipantList(this._participants).map((item) => {
      if (item.id !== pid) return item;
      return { ...item, invited: Boolean(nextValue) };
    });
    this._syncChildren();
    this._emitChange();
  }

  getElement() {
    return this.root;
  }

  mount(container) {
    if (!container) return;
    container.appendChild(this.root);
  }

  setContext({ meetingId, projectId } = {}) {
    this.meetingId = meetingId || this.meetingId;
    this.projectId = projectId || this.projectId;
    this._syncChildren();
  }

  setProjectData({ projectCompanies, projectCompanyEmployees } = {}) {
    this._projectCompanies = Array.isArray(projectCompanies) ? projectCompanies : [];
    this._projectCompanyEmployees = Array.isArray(projectCompanyEmployees)
      ? projectCompanyEmployees
      : [];
    this._syncChildren();
  }

  setParticipants(participants) {
    this._participants = normalizeMeetingParticipantList(participants);
    this._syncChildren();
  }

  getParticipants() {
    return normalizeMeetingParticipantList(this._participants);
  }

  setReadOnly(readOnly) {
    this._readOnly = Boolean(readOnly);
    this._syncChildren();
  }

  onParticipantsChange(callback) {
    this._onParticipantsChange = typeof callback === "function" ? callback : null;
  }
}
