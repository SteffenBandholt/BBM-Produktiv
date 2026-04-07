export {
  MEETING_PARTICIPANT_SOURCE_LOCAL,
  MEETING_PARTICIPANT_SOURCE_STAMM,
  MEETING_PARTICIPANT_SOURCES,
} from "./constants.js";

export {
  buildMeetingParticipantKey,
  filterActiveMeetingParticipants,
  filterMeetingParticipants,
  filterMeetingParticipantsByMeeting,
  filterMeetingParticipantsByProject,
  findMeetingParticipantById,
  findMeetingParticipantByReference,
  getMeetingParticipantDisplayLabel,
  normalizeMeetingParticipant,
  normalizeMeetingParticipantList,
} from "./meetingParticipantModel.js";

export {
  deriveMeetingParticipantFromProjectEmployee,
  deriveMeetingParticipantOptionsFromActiveProjectEmployees,
  ensureMeetingParticipantFromProjectEmployee,
  groupMeetingParticipantOptionsByCompany,
  removeMeetingParticipantById,
  setMeetingParticipantActive,
  setMeetingParticipantInvited,
} from "./meetingParticipantDerivation.js";

export { MeetingParticipantRegistry } from "./MeetingParticipantRegistry.js";

export {
  MeetingParticipantDialog,
  MeetingParticipantForm,
  MeetingParticipantList,
  MeetingParticipantManagementPanel,
  MeetingParticipantSelector,
} from "./ui/index.js";

