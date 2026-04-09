import { mapLoadByMeetingResult, mapMutationResult } from "./TopsMapper.js";
import {
  createLoadByMeetingRequest,
  createSaveTopRequest,
  createCreateTopRequest,
  createMoveTopRequest,
  createDeleteTopRequest,
  toApiSaveTopPayload,
  toApiCreateTopPayload,
  toApiMoveTopPayload,
  toApiDeleteTopPayload,
  createRepositoryUnavailableResult,
} from "./TopsDtos.js";

// Fachmodul `Protokoll`:
// modulinterner Datenzugriff fuer TOP-/Protokolloperationen ueber die bestehende API-Bruecke.
export class TopsRepository {
  constructor({ api } = {}) {
    this.api = api || window.bbmDb || {};
  }

  async loadByMeeting(input) {
    const req = createLoadByMeetingRequest(input);
    if (typeof this.api.topsListByMeeting !== "function") {
      return createRepositoryUnavailableResult("topsListByMeeting unavailable", "load");
    }
    const res = await this.api.topsListByMeeting(req.meetingId);
    return mapLoadByMeetingResult(res);
  }

  async saveTop(input) {
    const req = createSaveTopRequest(input);
    if (typeof this.api.meetingTopsUpdate !== "function") {
      return createRepositoryUnavailableResult("meetingTopsUpdate unavailable", "mutation");
    }
    const res = await this.api.meetingTopsUpdate(toApiSaveTopPayload(req));
    return mapMutationResult(res);
  }

  async createTop(input) {
    const req = createCreateTopRequest(input);
    if (typeof this.api.topsCreate !== "function") {
      return createRepositoryUnavailableResult("topsCreate unavailable", "mutation");
    }
    const res = await this.api.topsCreate(toApiCreateTopPayload(req));
    return mapMutationResult(res);
  }

  async moveTop(input) {
    const req = createMoveTopRequest(input);
    if (typeof this.api.topsMove !== "function") {
      return createRepositoryUnavailableResult("topsMove unavailable", "mutation");
    }
    const res = await this.api.topsMove(toApiMoveTopPayload(req));
    return mapMutationResult(res);
  }

  async deleteTop(input) {
    const req = createDeleteTopRequest(input);
    if (typeof this.api.topsMarkTrashed !== "function") {
      return createRepositoryUnavailableResult("topsMarkTrashed unavailable", "mutation");
    }
    const res = await this.api.topsMarkTrashed(toApiDeleteTopPayload(req));
    return mapMutationResult(res);
  }

  canDeleteTop() {
    return typeof this.api.topsMarkTrashed === "function";
  }
}
