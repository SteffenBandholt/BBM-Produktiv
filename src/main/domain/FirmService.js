// src/main/domain/FirmService.js

const defaultFirmUsagesRepo = require("../db/firmUsagesRepo");

class FirmService {
  constructor({ firmsRepo, personsRepo, firmUsagesRepo = defaultFirmUsagesRepo }) {
    if (!firmsRepo) throw new Error("FirmService: firmsRepo required");
    if (!personsRepo) throw new Error("FirmService: personsRepo required");

    this.firmsRepo = firmsRepo;
    this.personsRepo = personsRepo;
    this.firmUsagesRepo = firmUsagesRepo;
  }

  _decorate(firm) {
    if (!firm || !this.firmUsagesRepo) return firm;
    return { ...firm, usage_codes: this.firmUsagesRepo.listCodesByFirm(firm.id) };
  }

  listGlobal() {
    return this.firmsRepo.listActive().map((firm) => this._decorate(firm));
  }

  createGlobal(input) {
    if (!input) throw new Error("input required");

    const firm = this.firmsRepo.createFirm({
      short: input.short,
      name: input.name,
      name2: input.name2,
      street: input.street,
      zip: input.zip,
      city: input.city,
      phone: input.phone,
      email: input.email,
      gewerk: input.gewerk,
      notes: input.notes,
    });
    if (this.firmUsagesRepo && Array.isArray(input.usage_codes)) {
      this.firmUsagesRepo.replaceUsages({ firmId: firm.id, usageCodes: input.usage_codes });
    }
    return this._decorate(firm);
  }

  updateGlobal({ firmId, patch }) {
    if (!firmId) throw new Error("firmId required");
    if (!patch) throw new Error("patch required");

    const firm = this.firmsRepo.getFirmById(firmId);
    if (!firm || firm.removed_at) throw new Error("Firma nicht gefunden");

    const updated = this.firmsRepo.updateFirm({ firmId, patch });
    if (this.firmUsagesRepo && Array.isArray(patch.usage_codes)) {
      this.firmUsagesRepo.replaceUsages({ firmId, usageCodes: patch.usage_codes });
    }
    return this._decorate(updated);
  }

  deleteGlobal({ firmId }) {
    if (!firmId) throw new Error("firmId required");

    const firm = this.firmsRepo.getFirmById(firmId);
    if (!firm || firm.removed_at) throw new Error("Firma nicht gefunden");

    const activeCount = this.firmsRepo.countActivePersonsByFirm(firmId);
    if (activeCount > 0) {
      throw new Error("Firma kann nicht gelöscht werden: Es sind noch aktive Mitarbeiter vorhanden.");
    }

    return this.firmsRepo.softDeleteFirm(firmId);
  }
}

function createFirmService(deps) {
  return new FirmService(deps);
}

module.exports = {
  FirmService,
  createFirmService,
};
