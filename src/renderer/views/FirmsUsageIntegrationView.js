import FirmsUsageView from "./FirmsUsageView.js";

const PROJECT = "project_participant";

function codesFromFirm(firm) {
  const project = firm?.uses?.projectParticipant ?? firm?.use_project_participant ?? firm?.project_participant;
  return project === true || Number(project) === 1 ? [PROJECT] : [];
}

function usesPayload(codes = []) {
  return {
    projectParticipant: codes.includes(PROJECT) ? 1 : 0,
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
