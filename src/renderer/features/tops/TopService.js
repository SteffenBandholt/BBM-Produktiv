import { TopsRepository } from "../../tops/data/TopsRepository.js";

export class TopService {
  constructor({ repository } = {}) {
    this.repository = repository || new TopsRepository();
  }

  async createTop(payload) {
    return this.repository.createTop(payload);
  }

  async moveTop(payload) {
    return this.repository.moveTop(payload);
  }

  async listByMeeting(meetingId) {
    return this.repository.loadByMeeting(meetingId);
  }

  async updateTop(payload) {
    return this.repository.saveTop(payload);
  }
}
