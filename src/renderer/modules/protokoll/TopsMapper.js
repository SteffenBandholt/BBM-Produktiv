import { createLoadByMeetingResult, createMutationResult } from "./TopsDtos.js";

export function mapLoadByMeetingResult(res) {
  return createLoadByMeetingResult(res);
}

export function mapMutationResult(res) {
  return createMutationResult(res);
}
