// src/main/domain/FirmService.js

const firmUsagesRepo = require("../db/firmUsagesRepo");

function _usageCodesFromInput(input = {}) {
  if (Array.isArray(input.usages)) return input.usages;

  const codes = [];
  if (input.projectParticipant === true || input.project_participant === true) {
    codes.push(firmUsagesRepo.FIRM_USAGE_CODES.PROJECT_PARTICIPANT);
  }
  if (input.invoiceCustomer === true || input.invoice_customer === true) {
    codes.push(firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER);
  }
  return codes;
}

function _hasExplicitUsageInput(input = {}) {
  return (
    Array.isArray(input.usages) ||
    Object.prototype.hasOwnProperty.call(input, "projectParticipant") ||
    Object.prototype.hasOwnProperty.call(input, "project_participant") ||
    Object.prototype.hasOwnProperty.call(input, "invoiceCustomer") ||
    Object.prototype.hasOwnProperty.call(input, "invoice_customer")
  );
}

function _decorateFirm(firm) {
  if (!firm?.id) return firm;
  const usages = firmUsagesRepo.listCodesByFirm(firm.id);
  return {
    ...firm,
    usages,
    project_participant: usages.includes(firmUsagesRepo.FIRM_USAGE_CODES.PROJECT_PARTICIPANT),
    invoice_customer: usages.includes(firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER),
  };
}

class FirmService {
  constructor({ firmsRepo, personsRepo }) {
    if (!firmsRepo) throw new Error("FirmService: firmsRepo required");
    if (!personsRepo) throw new Error("FirmService: personsRepo required");

    this.firmsRepo = firmsRepo;
    this.personsRepo = personsRepo;
  }

  listGlobal() {
    firmUsagesRepo.ensureProjectParticipantUsageForAssignedFirms();
    return this.firmsRepo.listActive().map(_decorateFirm);
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

    if (_hasExplicitUsageInput(input)) {
      firmUsagesRepo.replaceUsages({
        firmId: firm.id,
        usageCodes: _usageCodesFromInput(input),
      });
    }

    return _decorateFirm(firm);
  }

  updateGlobal({ firmId, patch }) {
    if (!firmId) throw new Error("firmId required");
    if (!patch) throw new Error("patch required");

    const firm = this.firmsRepo.getFirmById(firmId);
    if (!firm || firm.removed_at) throw new Error("Firma nicht gefunden");

    const updated = this.firmsRepo.updateFirm({ firmId, patch });

    if (_hasExplicitUsageInput(patch)) {
      firmUsagesRepo.replaceUsages({
        firmId,
        usageCodes: _usageCodesFromInput(patch),
      });
    }

    return _decorateFirm(updated);
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
