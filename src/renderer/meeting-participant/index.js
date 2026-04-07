export {
  normalizeMeetingParticipant,
  normalizeMeetingParticipantList,
  findMeetingParticipantByReference,
  getMeetingParticipantDisplayLabel,
} from "./meetingParticipantModel.js";

export {
  deriveActiveProjectCompanyEmployees,
  buildMeetingParticipantCandidateOptions,
} from "./meetingParticipantDerivation.js";

export { MeetingParticipantRegistry } from "./MeetingParticipantRegistry.js";
export { MeetingParticipantRepository } from "./MeetingParticipantRepository.js";

export {
  mkEl,
  MeetingParticipantSelector,
  MeetingParticipantList,
  MeetingParticipantManagementPanel,
} from "./ui/index.js";
