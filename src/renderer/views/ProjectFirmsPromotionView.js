import ProjectFirmsContactsView from "./ProjectFirmsContactsView.js";

function text(value) {
  return String(value == null ? "" : value).trim();
}

function normalized(value) {
  return text(value).toLocaleLowerCase("de-DE");
}

function button(label) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  Object.assign(btn.style, {
    border: "1px solid #2563eb",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#175cd3",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  });
  return btn;
}

export default class ProjectFirmsPromotionView extends ProjectFirmsContactsView {
  _renderDetails(container) {
    super._renderDetails(container);

    if (this.selectedEntry?.kind !== "project") return;
    const firm = this.selectedEntry?.firm || null;
    if (!firm) return;

    const card = container.querySelector("section");
    if (!card) return;
    const actions = card.lastElementChild || null;
    if (!actions) return;

    const promote = button("In Firmenstamm übernehmen");
    promote.addEventListener("click", () => this._promoteProjectFirm(firm, promote));
    actions.insertBefore(promote, actions.firstChild || null);
  }

  async _promoteProjectFirm(firm, triggerButton) {
    const api = window.bbmDb || {};
    const projectId = this.projectId || this.router?.currentProjectId || null;
    const projectFirmId = text(firm?.id);
    if (!projectId || !projectFirmId) return;

    const contacts = this.contactsByKey.get(`project:${projectFirmId}`) || [];
    const label = text(firm?.name) || text(firm?.short) || "Projektfirma";
    const extra = contacts.length
      ? `\n\n${contacts.length} Ansprechpartner werden ebenfalls in den Firmenstamm übernommen.`
      : "";

    if (!confirm(`„${label}“ in den Firmenstamm übernehmen?\n\nDie Firma bleibt dem aktuellen Projekt zugeordnet.${extra}`)) {
      return;
    }

    triggerButton.disabled = true;
    triggerButton.textContent = "Übernehme ...";

    try {
      const globalListRes = await api.firmsListGlobal?.();
      if (!globalListRes?.ok) {
        throw new Error(globalListRes?.error || "Firmenstamm konnte nicht geprüft werden.");
      }

      const targetName = normalized(firm?.name);
      const duplicate = (globalListRes.list || []).find((entry) => {
        if (!targetName) return false;
        return normalized(entry?.name) === targetName;
      });
      if (duplicate) {
        alert(`Im Firmenstamm gibt es bereits eine Firma mit dem Namen „${text(duplicate?.name) || label}“.\n\nBitte diese vorhandene Firma über „Aus Firmenstamm zuordnen“ verwenden.`);
        return;
      }

      const createFirmRes = await api.firmsCreateGlobal?.({
        short: text(firm?.short),
        name: text(firm?.name),
        name2: text(firm?.name2),
        street: text(firm?.street),
        zip: text(firm?.zip),
        city: text(firm?.city),
        phone: text(firm?.phone),
        email: text(firm?.email),
        gewerk: text(firm?.gewerk),
        role_code: text(firm?.role_code),
        notes: text(firm?.notes),
        usages: ["project_participant"],
      });
      if (!createFirmRes?.ok || !createFirmRes?.firm?.id) {
        throw new Error(createFirmRes?.error || "Firma konnte nicht in den Firmenstamm übernommen werden.");
      }

      const globalFirmId = createFirmRes.firm.id;
      let centralReady = false;
      try {
        for (const person of contacts) {
          const createPersonRes = await api.personsCreate?.({
            firmId: globalFirmId,
            firstName: text(person?.first_name),
            lastName: text(person?.last_name),
            funktion: text(person?.funktion),
            email: text(person?.email),
            phone: text(person?.phone),
            rolle: text(person?.rolle) || text(person?.funktion),
            notes: text(person?.notes),
          });
          if (!createPersonRes?.ok) {
            throw new Error(createPersonRes?.error || `Ansprechpartner ${text(person?.first_name)} ${text(person?.last_name)} konnte nicht übernommen werden.`);
          }
        }

        const assignRes = await api.projectFirmsAssignGlobalFirm?.({ projectId, firmId: globalFirmId });
        if (!assignRes?.ok) {
          throw new Error(assignRes?.error || "Die neue Stammfirma konnte dem Projekt nicht zugeordnet werden.");
        }
        centralReady = true;
      } catch (error) {
        if (!centralReady) {
          try {
            await api.firmsDeleteGlobal?.(globalFirmId);
          } catch (_rollbackError) {
            // Best-effort rollback. Die Fehlermeldung unten bleibt maßgeblich.
          }
        }
        throw error;
      }

      for (const person of contacts) {
        const deletePersonRes = await api.projectPersonsDelete?.(person?.id);
        if (!deletePersonRes?.ok) {
          throw new Error(deletePersonRes?.error || "Lokaler Ansprechpartner konnte nach der Übernahme nicht entfernt werden.");
        }
      }

      const deleteFirmRes = await api.projectFirmsDelete?.(projectFirmId);
      if (!deleteFirmRes?.ok) {
        throw new Error(deleteFirmRes?.error || "Die bisherige Projektfirma konnte nach der Übernahme nicht entfernt werden.");
      }

      this.selectedEntry = { kind: "global", firm: createFirmRes.firm };
      await this.reload();
    } catch (error) {
      console.error("[ProjectFirmsPromotionView] promote failed", error);
      alert(error?.message || "Übernahme in den Firmenstamm fehlgeschlagen.");
    } finally {
      triggerButton.disabled = false;
      triggerButton.textContent = "In Firmenstamm übernehmen";
    }
  }
}
