import { normalizeMeetingParticipantList } from "./meetingParticipantModel.js";

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function buildMeetingKey({ meetingId, projectId } = {}) {
  return `${toText(projectId) || "-"}::${toText(meetingId) || "-"}`;
}

export class MeetingParticipantRegistry {
  constructor() {
    this._byMeeting = new Map();
  }

  clear() {
    this._byMeeting.clear();
  }

  listByMeeting({ meetingId, projectId } = {}) {
    const key = buildMeetingKey({ meetingId, projectId });
    const list = this._byMeeting.get(key) || [];
    return normalizeMeetingParticipantList(list);
  }

  replaceByMeeting({ meetingId, projectId, participants } = {}) {
    const key = buildMeetingKey({ meetingId, projectId });
    const normalized = normalizeMeetingParticipantList(participants);
    this._byMeeting.set(key, normalized);
    return normalized;
  }
}
