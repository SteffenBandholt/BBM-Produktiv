import { findProjectCompanyById } from "../../project-company/index.js";
import {
  ensureMeetingParticipantFromProjectEmployee,
  setMeetingParticipantActive,
  setMeetingParticipantInvited,
  removeMeetingParticipantById,
} from "../meetingParticipantDerivation.js";
import { normalizeMeetingParticipantList } from "../meetingParticipantModel.js";
import { MeetingParticipantList } from "./MeetingParticipantList.js";
import { MeetingParticipantSelector } from "./MeetingParticipantSelector.js";
import { mkEl, toText } from "./dom.js";

export class MeetingParticipantManagementPanel {
  constructor({
    documentRef,
    meetingId = "",
    projectId = "",
    onParticipantsChange,
  } = {}) {
    this.documentRef = documentRef || window.document;
    this._meetingId = toText(meetingId);
    this._projectId = toText(projectId);
    this._participants = [];
    this._projectCompanies = [];
    this._projectCompanyEmployees = [];
    this._onParticipantsChange =
      typeof onParticipantsChange === "function" ? onParticipantsChange : null;
    this._readOnly = false;
    this._build();
  }

  _build() {
    const doc = this.documentRef;
    this.root = mkEl(doc, "section", "meeting-participant-management-panel");
    this.root.setAttribute("data-component", "meeting-participant-management-panel");
    this.root.style.display = "flex";
    this.root.style.flexDirection = "column";
    this.root.style.gap = "12px";

    this.selector = new MeetingParticipantSelector({
      documentRef: doc,
      meetingId: this._meetingId,
      projectId: this._projectId,
      onAdd: (selectedOption) => {
        this._handleAddOption(selectedOption);
      },
    });

    this.list = new MeetingParticipantList({
      documentRef: doc,
      onRemove: (participant) => this._handleRemove(participant),
      onToggleActive: (participant, active) => this._handleToggleActive(participant, active),
      onToggleInvited: (participant, invited) => this._handleToggleInvited(participant, invited),
    });

    this.root.append(this.selector.getElement(), this.list.getElement());
    this._refreshUi();
  }

  _notifyChange() {
    if (this._onParticipantsChange) {
      this._onParticipantsChange(this.getParticipants());
    }
  }

  _handleAddOption(selectedOption) {
    if (this._readOnly) return;
    const participant = selectedOption?.participant || null;
    if (!participant) return;

    const projectEmployee = this._projectCompanyEmployees.find(
      (entry) => entry.id === selectedOption?.projectEmployeeId
    );

    const fallbackProjectEmployee = this._projectCompanyEmployees.find((entry) => {
      const sourceMatches = toText(entry.sourceType) === toText(participant.sourceType);
      const companyMatches = toText(entry.projectCompanyId) === toText(participant.projectCompanyId);
      if (!sourceMatches || !companyMatches) return false;
      if (participant.employeeId) return toText(entry.employeeId) === toText(participant.employeeId);
      return toText(entry.localEmployeeId) === toText(participant.localEmployeeId);
    });

    const resolvedProjectEmployee = projectEmployee || fallbackProjectEmployee;
    if (!resolvedProjectEmployee || !resolvedProjectEmployee.active) return;

    const projectCompany = findProjectCompanyById(
      this._projectCompanies,
      resolvedProjectEmployee.projectCompanyId
    );
    const result = ensureMeetingParticipantFromProjectEmployee({
      participants: this._participants,
      meetingId: this._meetingId,
      projectId: this._projectId,
      projectEmployee: resolvedProjectEmployee,
      projectCompany,
    });
    this._participants = result.participants;
    this._refreshUi();
    this._notifyChange();
  }

  _handleRemove(participant) {
    if (this._readOnly) return;
    this._participants = removeMeetingParticipantById(this._participants, participant?.id);
    this._refreshUi();
    this._notifyChange();
  }

  _handleToggleActive(participant, active) {
    if (this._readOnly) return;
    this._participants = setMeetingParticipantActive(this._participants, participant?.id, active);
    this._refreshUi();
    this._notifyChange();
  }

  _handleToggleInvited(participant, invited) {
    if (this._readOnly) return;
    this._participants = setMeetingParticipantInvited(this._participants, participant?.id, invited);
    this._refreshUi();
    this._notifyChange();
  }

  _refreshUi() {
    this.selector.setContext({ meetingId: this._meetingId, projectId: this._projectId });
    this.selector.setSourceData({
      projectCompanies: this._projectCompanies,
      projectCompanyEmployees: this._projectCompanyEmployees,
    });
    this.selector.setDisabled(this._readOnly);
    this.list.setParticipants(this._participants);
    this.list.setReadOnly(this._readOnly);
  }

  getElement() {
    return this.root;
  }

  mount(container) {
    if (!container) return;
    container.appendChild(this.root);
  }

  onParticipantsChange(callback) {
    this._onParticipantsChange = typeof callback === "function" ? callback : null;
  }

  setContext({ meetingId, projectId } = {}) {
    this._meetingId = toText(meetingId);
    this._projectId = toText(projectId);
    this._refreshUi();
  }

  setReadOnly(readOnly) {
    this._readOnly = Boolean(readOnly);
    this._refreshUi();
  }

  setProjectData({ projectCompanies = [], projectCompanyEmployees = [] } = {}) {
    this._projectCompanies = Array.isArray(projectCompanies) ? projectCompanies.slice() : [];
    this._projectCompanyEmployees = Array.isArray(projectCompanyEmployees)
      ? projectCompanyEmployees.slice()
      : [];
    this._refreshUi();
  }

  setParticipants(participants) {
    this._participants = normalizeMeetingParticipantList(participants);
    this._refreshUi();
  }

  getParticipants() {
    return normalizeMeetingParticipantList(this._participants);
  }
}
