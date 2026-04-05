import { mapLoadByMeetingResult, mapMutationResult } from "./TopsMapper.js";

export class TopsRepository {
  constructor({ api } = {}) {
    this.api = api || window.bbmDb || {};
  }

  async loadByMeeting(meetingId) {
    if (typeof this.api.topsListByMeeting !== "function") {
      return { ok: false, meeting: null, list: [], error: "topsListByMeeting unavailable" };
    }
    const res = await this.api.topsListByMeeting(meetingId);
    return mapLoadByMeetingResult(res);
  }

  async saveTop(draft) {
    if (typeof this.api.meetingTopsUpdate !== "function") {
      return { ok: false, error: "meetingTopsUpdate unavailable" };
    }
    const res = await this.api.meetingTopsUpdate(draft);
    return mapMutationResult(res);
  }

  async createTop(draft) {
    if (typeof this.api.topsCreate !== "function") {
      return { ok: false, error: "topsCreate unavailable" };
    }
    const res = await this.api.topsCreate(draft);
    return mapMutationResult(res);
  }

  async moveTop(draft) {
    if (typeof this.api.topsMove !== "function") {
      return { ok: false, error: "topsMove unavailable" };
    }
    const res = await this.api.topsMove(draft);
    return mapMutationResult(res);
  }

  async deleteTop(topId) {
    if (typeof this.api.topsMarkTrashed !== "function") {
      return { ok: false, error: "topsMarkTrashed unavailable" };
    }
    const res = await this.api.topsMarkTrashed({ topId });
    return mapMutationResult(res);
  }

  canDeleteTop() {
    return typeof this.api.topsMarkTrashed === "function";
  }
}

