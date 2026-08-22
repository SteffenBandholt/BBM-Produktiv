import FirmsUsageView from "./FirmsUsageView.js";

const PROJECT = "project_participant";
const INVOICE = "invoice_customer";

function codesFromFirm(firm) {
  if (Array.isArray(firm?.usages)) return firm.usages.map((value) => String(value || "").trim());
  const codes = [];
  const project = firm?.uses?.projectParticipant ?? firm?.use_project_participant ?? firm?.project_participant;
  const customer = firm?.uses?.customer ?? firm?.use_customer ?? firm?.invoice_customer;
  if (project === true || Number(project) === 1) codes.push(PROJECT);
  if (customer === true || Number(customer) === 1) codes.push(INVOICE);
  return codes;
}

function usesPayload(codes = []) {
  const set = new Set(codes.map((value) => String(value || "").trim()));
  return {
    projectParticipant: set.has(PROJECT) ? 1 : 0,
    customer: set.has(INVOICE) ? 1 : 0,
  };
}

export default class FirmsUsageIntegrationView extends FirmsUsageView {
  _decorateFirmUsages() {
    this.firms = (this.firms || []).map((firm) => ({ ...firm, usages: codesFromFirm(firm) }));
    if (this.selectedFirmId) {
      this.selectedFirm =
        this.firms.find((firm) => this._sameId?.(firm?.id, this.selectedFirmId)) || this.selectedFirm || null;
    }
  }

  async reloadFirms() {
    await super.reloadFirms();
    this._decorateFirmUsages();
    this._renderFirmsOnly();
    this._renderFirmDetails();
  }

  async _saveFirm() {
    if (this.savingFirm) return;

    const data = this._getFirmFormData();
    if (!data.name) {
      alert("Name 1 ist Pflicht.");
      return;
    }
    if (this.firmMode === "create" && this._createUsageMode() === "both" && !data.usages.length) {
      alert("Bitte festlegen, ob die Firma Projektteilnehmer, Rechnungskunde oder beides ist.");
      return;
    }

    this.savingFirm = true;
    this._setMsg("Speichere…");
    this._applyFirmFormState();
    this._applyPersonFormState();

    try {
      let res = null;
      if (this.firmMode === "create") {
        res = await window.bbmDb.firmsCreateGlobal({ ...data });
        if (!res?.ok) {
          alert(res?.error || "Fehler beim Anlegen");
          return;
        }
        this.selectedFirmId = res?.firm?.id || null;
      } else if (this.firmMode === "edit" && this.selectedFirmId) {
        res = await window.bbmDb.firmsUpdateGlobal({
          firmId: this.selectedFirmId,
          patch: { ...data },
        });
        if (!res?.ok) {
          alert(res?.error || "Fehler beim Speichern");
          return;
        }
      } else {
        return;
      }

      if (this.selectedFirmId && typeof window.bbmDb?.firmDirectorySetUses === "function") {
        const useRes = await window.bbmDb.firmDirectorySetUses({
          ref: { kind: "global_firm", id: this.selectedFirmId },
          uses: usesPayload(data.usages),
        });
        if (!useRes?.ok) {
          alert(useRes?.error || "Firmen-Verwendung konnte nicht gespeichert werden.");
          return;
        }
      }

      this._closeFirmEditor();
      await this.reloadFirms();
    } finally {
      this.savingFirm = false;
      this._setMsg("");
      this._applyFirmFormState();
      this._applyPersonFormState();
      this._updateVisibility();
    }
  }
}
