import ProjectFirmsPromotionView from "./ProjectFirmsPromotionView.js";

function text(value) {
  return String(value == null ? "" : value).trim();
}

function parseActive(value) {
  return value === true || value === 1 || value === "1" ? 1 : 0;
}

function candidateKindForFirmKind(kind) {
  return kind === "project" ? "project_person" : "global_person";
}

function candidateKey(kind, personId) {
  return `${text(kind)}::${text(personId)}`;
}

function style(el, values = {}) {
  Object.assign(el.style, values);
  return el;
}

export default class ProjectFirmsParticipantsView extends ProjectFirmsPromotionView {
  constructor(args = {}) {
    super(args);
    this.projectParticipantState = new Map();
  }

  render() {
    const root = super.render();
    const back = Array.from(root?.querySelectorAll?.("button") || []).find(
      (btn) => text(btn?.textContent) === "← Projekt"
    );
    if (back) back.textContent = "← Zurück";
    return root;
  }

  async _backToProject() {
    const router = this.router || null;
    const ctx = this.returnContext && typeof this.returnContext === "object"
      ? this.returnContext
      : null;
    const projectId = ctx?.projectId || this.projectId || router?.currentProjectId || null;
    const meetingId = ctx?.meetingId || null;

    if (
      router &&
      (ctx?.section === "tops" || (ctx?.section === "meetings" && meetingId)) &&
      meetingId &&
      typeof router.showTops === "function"
    ) {
      await router.showTops(meetingId, projectId, {
        returnContext: ctx?.topsReturnContext || null,
      });
      return;
    }

    if (
      router &&
      ctx?.section === "restarbeiten" &&
      typeof router.openProjectModule === "function"
    ) {
      await router.openProjectModule(projectId, "restarbeiten", {
        project: ctx?.project || null,
      });
      return;
    }

    if (router && ctx?.section === "meetings" && typeof router.showMeetings === "function") {
      await router.showMeetings(projectId);
      return;
    }

    if (router && ctx?.section === "projects" && typeof router.showProjects === "function") {
      await router.showProjects();
      return;
    }

    await super._backToProject();
  }

  async _loadData() {
    await super._loadData();

    const api = window.bbmDb || {};
    this.projectParticipantState = new Map();
    if (!this.projectId || typeof api.projectCandidatesList !== "function") return;

    try {
      const res = await api.projectCandidatesList({ projectId: this.projectId });
      const items = res?.ok
        ? Array.isArray(res.items)
          ? res.items
          : Array.isArray(res.list)
            ? res.list
            : []
        : [];

      for (const item of items) {
        const kind = text(item?.kind);
        const personId = text(item?.personId ?? item?.person_id);
        if (!kind || !personId) continue;
        this.projectParticipantState.set(
          candidateKey(kind, personId),
          parseActive(item?.is_active ?? item?.isActive)
        );
      }
    } catch (error) {
      console.warn("[ProjectFirmsParticipantsView] candidate state load failed", error);
    }
  }

  _isProjectParticipant(firmKind, person) {
    const kind = candidateKindForFirmKind(firmKind);
    const personId = text(person?.id ?? person?.personId ?? person?.person_id);
    const key = candidateKey(kind, personId);
    if (this.projectParticipantState.has(key)) {
      return this.projectParticipantState.get(key) === 1;
    }

    // Historische BBM-Logik: lokale Projekt-Ansprechpartner gehoeren standardmaessig
    // zum Projekt; zentrale Firmenkontakte werden bewusst zugeschaltet.
    return firmKind === "project";
  }

  async _setProjectParticipant(firmKind, person, isActive) {
    const api = window.bbmDb || {};
    const kind = candidateKindForFirmKind(firmKind);
    const personId = text(person?.id ?? person?.personId ?? person?.person_id);
    if (!this.projectId || !personId) return false;

    const next = !!isActive;

    if (typeof api.projectCandidatesSetActive === "function") {
      const res = await api.projectCandidatesSetActive({
        projectId: this.projectId,
        kind,
        personId,
        isActive: next,
      });
      if (!res?.ok) {
        alert(res?.error || "Teilnehmerzuordnung konnte nicht gespeichert werden.");
        return false;
      }
      this.projectParticipantState.set(candidateKey(kind, personId), next ? 1 : 0);
      this._notifyParticipantPoolChanged();
      return true;
    }

    if (
      typeof api.projectCandidatesList !== "function" ||
      typeof api.projectCandidatesSet !== "function"
    ) {
      alert("Teilnehmerzuordnung ist nicht verfügbar.");
      return false;
    }

    const currentRes = await api.projectCandidatesList({ projectId: this.projectId });
    if (!currentRes?.ok) {
      alert(currentRes?.error || "Teilnehmerzuordnung konnte nicht geladen werden.");
      return false;
    }

    const currentItems = Array.isArray(currentRes.items)
      ? currentRes.items
      : Array.isArray(currentRes.list)
        ? currentRes.list
        : [];
    const merged = new Map();

    for (const item of currentItems) {
      const itemKind = text(item?.kind);
      const itemPersonId = text(item?.personId ?? item?.person_id);
      if (!itemKind || !itemPersonId) continue;
      merged.set(candidateKey(itemKind, itemPersonId), {
        kind: itemKind,
        personId: itemPersonId,
        isActive: parseActive(item?.is_active ?? item?.isActive) === 1,
      });
    }

    merged.set(candidateKey(kind, personId), {
      kind,
      personId,
      isActive: next,
    });

    const setRes = await api.projectCandidatesSet({
      projectId: this.projectId,
      items: [...merged.values()],
    });
    if (!setRes?.ok) {
      alert(setRes?.error || "Teilnehmerzuordnung konnte nicht gespeichert werden.");
      return false;
    }

    this.projectParticipantState.set(candidateKey(kind, personId), next ? 1 : 0);
    this._notifyParticipantPoolChanged();
    return true;
  }

  _notifyParticipantPoolChanged() {
    try {
      window.dispatchEvent(
        new CustomEvent("bbm:pool-data-changed", {
          detail: {
            projectId: this.projectId || null,
            reason: "project-participant-changed",
            source: "ProjectFirmsParticipantsView",
          },
        })
      );
    } catch (_error) {
      // UI-Neuladen bleibt der sichere Fallback.
    }
  }

  _renderDetails(container) {
    super._renderDetails(container);

    const entry = this.selectedEntry || null;
    const firmKind = entry?.kind || null;
    const firm = entry?.firm || null;
    if (!firm || !["project", "global"].includes(firmKind)) return;

    const contacts = this.contactsByKey.get(`${firmKind}:${text(firm?.id)}`) || [];
    if (!contacts.length) return;

    const card = container.querySelector("section");
    if (!card) return;
    const actions = card.lastElementChild || null;

    const contactList = Array.from(card.children || []).find((el) => {
      if (!el || el === actions) return false;
      const rows = Array.from(el.children || []);
      return rows.length === contacts.length && rows.every((row) => row?.tagName === "DIV");
    });
    if (!contactList) return;

    const rows = Array.from(contactList.children || []);
    rows.forEach((row, index) => {
      const person = contacts[index];
      if (!person || row.dataset.bbmParticipantControl === "true") return;
      row.dataset.bbmParticipantControl = "true";

      const existingEdit = Array.from(row.children || []).find((child) => child?.tagName === "BUTTON") || null;
      let content = null;

      if (firmKind === "project" && existingEdit) {
        content = Array.from(row.children || []).find((child) => child?.tagName === "DIV") || null;
      }

      if (!content) {
        content = document.createElement("div");
        const children = Array.from(row.childNodes || []);
        for (const child of children) {
          if (child === existingEdit) continue;
          content.append(child);
        }
      }

      const controls = style(document.createElement("div"), {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "8px",
        flexWrap: "wrap",
      });

      const participantLabel = style(document.createElement("label"), {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "10.5px",
        fontWeight: "700",
        color: "#475467",
        cursor: "pointer",
        whiteSpace: "nowrap",
      });
      participantLabel.title = "Als Teilnehmer dieses Projekts verwenden";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = this._isProjectParticipant(firmKind, person);
      checkbox.style.margin = "0";
      participantLabel.append(checkbox, document.createTextNode("Teilnehmer"));

      checkbox.addEventListener("change", async () => {
        const wanted = checkbox.checked;
        checkbox.disabled = true;
        const ok = await this._setProjectParticipant(firmKind, person, wanted);
        if (!ok) checkbox.checked = !wanted;
        checkbox.disabled = false;
      });

      controls.append(participantLabel);
      if (existingEdit) controls.append(existingEdit);

      row.innerHTML = "";
      row.append(content, controls);
      row.style.gridTemplateColumns = "minmax(0, 1fr) auto";
      row.style.alignItems = "center";
      row.style.columnGap = "10px";
    });
  }
}
