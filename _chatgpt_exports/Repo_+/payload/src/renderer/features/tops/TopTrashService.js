import { TopsRepository } from "../../tops/data/TopsRepository.js";

export class TopTrashService {
  constructor({ repository } = {}) {
    this.repository = repository || new TopsRepository();
  }

  async markTrashed(topId) {
    return this.repository.deleteTop(topId);
  }

  canMarkTrashed() {
    return this.repository.canDeleteTop();
  }
}
