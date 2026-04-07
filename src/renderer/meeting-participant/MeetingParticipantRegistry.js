import {
  deriveMeetingParticipantOptionsFromActiveProjectEmployees,
  ensureMeetingParticipantFromProjectEmployee,
  removeMeetingParticipantById,
  setMeetingParticipantActive,
  setMeetingParticipantInvited,
} from "./meetingParticipantDerivation.js";
import { normalizeMeetingParticipantList } from "./meetingParticipantModel.js";

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export class MeetingParticipantRegistry {
  constructor({ meetingId, projectId, participants = [] } = {}) {
    this.meetingId = toText(meetingId);
    this.projectId = toText(projectId);
    this._participants = normalizeMeetingParticipantList(participants);
  }

  setContext({ meetingId, projectId } = {}) {
    this.meetingId = toText(meetingId);
    this.projectId = toText(projectId);
  }

  setParticipants(participants) {
    this._participants = normalizeMeetingParticipantList(participants);
  }

  getParticipants() {
    return normalizeMeetingParticipantList(this._participants);
  }

  getSelectableOptions({ projectCompanies, projectCompanyEmployees } = {}) {
    return deriveMeetingParticipantOptionsFromActiveProjectEmployees({
      meetingId: this.meetingId,
      projectId: this.projectId,
      projectCompanies,
      projectCompanyEmployees,
    });
  }

  addFromProjectEmployee({ projectEmployee, projectCompany } = {}) {
    const result = ensureMeetingParticipantFromProjectEmployee({
      participants: this._participants,
      meetingId: this.meetingId,
      projectId: this.projectId,
      projectEmployee,
      projectCompany,
    });
    this._participants = result.participants;
    return result;
  }

  removeParticipant(participantId) {
    this._participants = removeMeetingParticipantById(this._participants, participantId);
    return this.getParticipants();
  }

  setParticipantActive(participantId, active) {
    this._participants = setMeetingParticipantActive(this._participants, participantId, active);
    return this.getParticipants();
  }

  setParticipantInvited(participantId, invited) {
    this._participants = setMeetingParticipantInvited(this._participants, participantId, invited);
    return this.getParticipants();
  }

  snapshot() {
    return {
      meetingId: this.meetingId,
      projectId: this.projectId,
      participants: this.getParticipants(),
    };
  }
}

