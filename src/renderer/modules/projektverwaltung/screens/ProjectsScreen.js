// src/renderer/modules/projektverwaltung/screens/ProjectsScreen.js
//
// TECH-CONTRACT (verbindlich): docs/UI-TECH-CONTRACT.md
// CONTRACT-VERSION: 1.0.1
//
// Projektlisten:
// - Klick auf eine Modulkontext-Zeile öffnet das zugeordnete Fachmodul.
// - Klick auf eine Zeile im Kontext Alle öffnet den zentralen Projektedit.
// - Archivieren bleibt eine getrennte Aktion innerhalb der Projektzeile.

import { applyPopupButtonStyle } from "../../../ui/popupButtonStyles.js";
import {
  cleanupPopupHandlers,
  createPopupOverlay,
  registerPopupCloseHandlers,
} from "../../../ui/popupCommon.js";

const LAST_PROJECT_KEY = "bbm.lastProjectId";
const CREATE_MEETING_EDIT_PARTICIPANTS_KEY = "bbm.createMeeting.editParticipants";
const PROJECT_CONTEXT_ALL = "all";
const PROJECT_MODULE_PRESENTATION = Object.freeze({
  protokoll: Object.freeze({ label: "Protokoll", color: "#37a447" }),
  restarbeiten: Object.freeze({ label: "Restarbeiten", color: "#ef7d00" }),
  rechnung: Object.freeze({ label: "Rechnungen", color: "#1769d2" }),
  sigeko: Object.freeze({ label: "SiGeKo", color: "#7b3fb3" }),
  "dev-ui-editor": Object.freeze({ label: "UI-Editor", color: "#d92d20" }),
});

function normalizeProjectContext(value) {
  const context = String(value || "").trim().toLowerCase();
  return ["protokoll", "restarbeiten"].includes(context) ? context : PROJECT_CONTEXT_ALL;
}

export default class ProjectsScreen {
  constructor({ router, moduleContext = PROJECT_CONTEXT_ALL }) {
    this.router = router;
    this.moduleContext = normalizeProjectContext(moduleContext);

    this.root = null;
    this.hostEl = null;
    this.msgEl = null;

    this.allProjects = [];
    this.projects = [];
    this.loading = false;
    this._startingProject = false;

    this._msgTimer = null;
    this._createMeetingModalEl = null;
    this._createMeetingModalResolve = null;
    this._projectFormModal = null;
    this._projectFormPrevProjectId = null;
    this._transferModalEl = null;
    this._addProjectModalEl = null;
    this._archiveModalEl = null;
  }

  _cleanupProjectFormModal() {
    this._projectFormModal = null;
    if (this._projectFormPrevProjectId !== null) {
      this.router.currentProjectId = this._projectFormPrevProjectId;
    }
    this._projectFormPrevProjectId = null;
    this._transferModalEl = null;
  }

  async _openProjectFormModal({ projectId } = {}) {
    if (this._projectFormModal) return;

    try {
      this._projectFormPrevProjectId = this.router.currentProjectId || null;
      const mod = await import("./ProjectFormScreen.js");
      const ProjectFormScreen = mod.default;

      this.router.currentProjectId = projectId || null;
      this.router.currentMeetingId = null;

      const view = new ProjectFormScreen({
        router: this.router,
        projectId: projectId || null,
        mode: "modal",
        onClose: () => this._cleanupProjectFormModal(),
        onSaved: async () => {
          const savedProjectId = projectId || this.router.currentProjectId || null;
          if (!projectId && this.moduleContext !== PROJECT_CONTEXT_ALL && savedProjectId) {
            await this._assignProjectToCurrentModule(savedProjectId);
          }
          await this.reloadProjects();
          this._cleanupProjectFormModal();
        },
      });

      this._projectFormModal = view;
      view.render();
      await view.load();
      view.openModal();
    } catch (err) {
      console.error("[ProjectsScreen] Project modal failed:", err);
      this._cleanupProjectFormModal();
    }
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  _setMsg(t) {
    if (!this.msgEl) return;
    this.msgEl.textContent = t || "";
  }

  _flashMsg(text, ms = 3500) {
    const t = String(text || "").trim();
    if (!t) return;

    if (this._msgTimer) {
      clearTimeout(this._msgTimer);
      this._msgTimer = null;
    }

    this._setMsg(t);

    this._msgTimer = setTimeout(() => {
      if (this.msgEl && this.msgEl.textContent === t) this._setMsg("");
      this._msgTimer = null;
    }, Math.max(600, Number(ms || 0)));
  }

  _getProjectNumber(p) {
    if (!p) return "";
    const v = p.project_number ?? p.projectNumber ?? "";
    const s = v === null || v === undefined ? "" : String(v).trim();
    return s;
  }

  // UI-nahe Projektkontext-Nutzung:
  // ProjectsScreen startet und bearbeitet Projekte, haelt den laufenden
  // Projektkontext aber nur fuer anschliessende Router-/Protokollpfade.
  _setProjectRuntimeContext(projectId, meetingId = null) {
    this.router.currentProjectId = projectId || null;
    this.router.currentMeetingId = meetingId || null;
  }

  _labelForTile(p) {
    if (!p) return "(ohne Name)";
    const short = String(p.short || "").trim();
    const name = String(p.name || "").trim();
    return short || name || "(ohne Name)";
  }

  _labelFull(p) {
    if (!p) return "(ohne Name)";
    const short = String(p.short || "").trim();
    const name = String(p.name || "").trim();
    if (short && name) return `${short} - ${name}`;
    return name || short || "(ohne Name)";
  }

  _moduleIdsForProject(project) {
    const raw = project?.module_ids ?? project?.moduleIds ?? [];
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.map((value) => String(value || "").trim().toLowerCase()).filter(Boolean))];
  }

  _allModuleIdsForProject(project) {
    const raw = project?.all_module_ids ?? project?.allModuleIds ?? project?.module_ids ?? project?.moduleIds ?? [];
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.map((value) => String(value || "").trim().toLowerCase()).filter(Boolean))];
  }

  _projectsForCurrentContext(projects = this.allProjects) {
    const list = Array.isArray(projects) ? projects : [];
    if (this.moduleContext === PROJECT_CONTEXT_ALL) return [...list];
    return list.filter((project) => this._moduleIdsForProject(project).includes(this.moduleContext));
  }

  _projectsAvailableToAdd() {
    if (this.moduleContext === PROJECT_CONTEXT_ALL) return [];
    return (this.allProjects || []).filter(
      (project) => !this._allModuleIdsForProject(project).includes(this.moduleContext)
    );
  }

  _contextPresentation() {
    return PROJECT_MODULE_PRESENTATION[this.moduleContext] || Object.freeze({ label: "Projekte", color: "#667085" });
  }

  _createModuleBadges(project) {
    const row = document.createElement("div");
    row.dataset.projectModuleBadges = "true";
    row.style.display = "flex";
    row.style.flexWrap = "wrap";
    row.style.gap = "4px";

    for (const moduleId of this._moduleIdsForProject(project)) {
      const presentation = PROJECT_MODULE_PRESENTATION[moduleId];
      if (!presentation) continue;
      const badge = document.createElement("span");
      badge.dataset.projectModuleBadge = moduleId;
      badge.textContent = presentation.label;
      badge.style.display = "inline-flex";
      badge.style.alignItems = "center";
      badge.style.minHeight = "18px";
      badge.style.padding = "1px 7px";
      badge.style.borderRadius = "999px";
      badge.style.background = presentation.color;
      badge.style.color = "#fff";
      badge.style.fontSize = "10px";
      badge.style.fontWeight = "750";
      row.appendChild(badge);
    }

    return row;
  }

  async _assignProjectToCurrentModule(projectId) {
    if (this.moduleContext === PROJECT_CONTEXT_ALL) return false;
    const pid = String(projectId || "").trim();
    const api = window.bbmDb || {};
    if (!pid || typeof api.projectsAssignModule !== "function") {
      this._flashMsg("Projektzuordnung ist nicht verfügbar.", 9000);
      return false;
    }
    try {
      const result = await api.projectsAssignModule({
        projectId: pid,
        moduleId: this.moduleContext,
      });
      if (!result?.ok) {
        this._flashMsg(result?.error || "Projekt konnte nicht hinzugefügt werden.", 9000);
        return false;
      }
      return true;
    } catch (error) {
      this._flashMsg(error?.message || "Projekt konnte nicht hinzugefügt werden.", 9000);
      return false;
    }
  }

  _readUiMode() {
    try {
      const raw = String(window.localStorage?.getItem?.("bbm.uiMode") || "").trim().toLowerCase();
      return raw === "new" ? "new" : "old";
    } catch (_e) {
      return "old";
    }
  }

  _isNewUiMode() {
    return this._readUiMode() === "new";
  }

  _todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  _addDaysISO(iso, days) {
    const s = String(iso || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const d = new Date(`${s}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + Number(days || 0));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  _isoToDDMMYYYY(iso) {
    const s = String(iso || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
    const y = s.slice(0, 4);
    const m = s.slice(5, 7);
    const d = s.slice(8, 10);
    return `${d}.${m}.${y}`;
  }

  _extractDateISOFromMeeting(m) {
    if (!m) return null;

    const raw =
      m.meeting_date || m.meetingDate || m.date || m.created_at || m.createdAt || null;

    if (raw) {
      const s = String(raw).slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    }

    const title = m.title ? String(m.title) : "";

    const hitIso = title.match(/(\d{4}-\d{2}-\d{2})/);
    if (hitIso && hitIso[1]) return hitIso[1];

    const hitDE = title.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (hitDE) {
      const dd = hitDE[1];
      const mm = hitDE[2];
      const yyyy = hitDE[3];
      return `${yyyy}-${mm}-${dd}`;
    }

    const hitDE2 = title.match(/(\d{2})\.(\d{2})\.(\d{2})/);
    if (hitDE2) {
      const dd = hitDE2[1];
      const mm = hitDE2[2];
      const yy = Number(hitDE2[3]);
      const yyyy = yy <= 69 ? 2000 + yy : 1900 + yy;
      return `${String(yyyy).padStart(4, "0")}-${mm}-${dd}`;
    }

    return null;
  }

  _closeCreateMeetingModal(result) {
    if (this._createMeetingModalEl) {
      try {
        cleanupPopupHandlers(this._createMeetingModalEl);
        this._createMeetingModalEl.remove();
      } catch (_) {}
    }
    this._createMeetingModalEl = null;

    if (this._createMeetingModalResolve) {
      const resolve = this._createMeetingModalResolve;
      this._createMeetingModalResolve = null;
      resolve(result || null);
    }
  }

  _openCreateMeetingModal({ dateISO }) {
    if (this._createMeetingModalEl) {
      this._closeCreateMeetingModal(null);
    }

    return new Promise((resolve) => {
      this._createMeetingModalResolve = resolve;

      const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.35)", zIndex: 9999 });
      overlay.style.display = "flex";

      const box = document.createElement("div");
      box.className = "bbm-popup-standard bbm-popup-dialog";
      box.style.width = "min(560px, calc(100vw - 32px))";
      box.style.maxHeight = "100%";
      box.style.display = "flex";
      box.style.flexDirection = "column";
      box.style.overflow = "hidden";
      box.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";

      const header = document.createElement("div");
      header.className = "bbm-popup-header";
      header.style.display = "flex";
      header.style.alignItems = "center";
      header.style.gap = "10px";

      const title = document.createElement("div");
      title.textContent = "Protokoll anlegen";
      title.style.fontWeight = "800";

      const btnClose = document.createElement("button");
      btnClose.type = "button";
      btnClose.textContent = "X";
      applyPopupButtonStyle(btnClose);
      btnClose.style.marginLeft = "auto";
      btnClose.onclick = () => this._closeCreateMeetingModal(null);

      header.append(title, btnClose);

      const body = document.createElement("div");
      body.className = "bbm-popup-body bbm-form-content";
      body.style.flex = "1 1 auto";
      body.style.minHeight = "0";
      body.style.overflow = "auto";
      body.style.display = "flex";
      body.style.flexDirection = "column";

      const dateField = document.createElement("div");
      dateField.className = "bbm-form-field";
      dateField.style.display = "flex";
      dateField.style.flexDirection = "column";

      const labDate = document.createElement("label");
      labDate.className = "bbm-form-label";
      labDate.textContent = "Datum";

      const inpDate = document.createElement("input");
      inpDate.type = "date";
      inpDate.value = /^\d{4}-\d{2}-\d{2}$/.test(String(dateISO || "")) ? dateISO : "";
      inpDate.style.width = "100%";
      inpDate.style.boxSizing = "border-box";
      dateField.append(labDate, inpDate);

      const keywordField = document.createElement("div");
      keywordField.className = "bbm-form-field";
      keywordField.style.display = "flex";
      keywordField.style.flexDirection = "column";

      const labKeyword = document.createElement("label");
      labKeyword.className = "bbm-form-label";
      labKeyword.textContent = "Schlagwort (optional)";

      const inpKeyword = document.createElement("input");
      inpKeyword.type = "text";
      inpKeyword.value = "";
      inpKeyword.style.width = "100%";
      inpKeyword.style.boxSizing = "border-box";
      keywordField.append(labKeyword, inpKeyword);

      const participantsOptionRow = document.createElement("label");
      participantsOptionRow.style.display = "flex";
      participantsOptionRow.style.alignItems = "center";
      participantsOptionRow.style.gap = "8px";
      participantsOptionRow.style.cursor = "pointer";

      const chkEditParticipants = document.createElement("input");
      chkEditParticipants.type = "checkbox";
      chkEditParticipants.checked = this._readCreateMeetingEditParticipantsDefault();
      chkEditParticipants.style.margin = "0";

      const participantsOptionText = document.createElement("span");
      participantsOptionText.textContent = "Teilnehmerliste bearbeiten";

      participantsOptionRow.append(chkEditParticipants, participantsOptionText);

      const btnRow = document.createElement("div");
      btnRow.className = "bbm-popup-footer";
      btnRow.style.display = "flex";
      btnRow.style.justifyContent = "flex-end";
      btnRow.style.gap = "8px";

      const btnCancel = document.createElement("button");
      btnCancel.type = "button";
      btnCancel.textContent = "Abbrechen";
      applyPopupButtonStyle(btnCancel);

      const btnCreate = document.createElement("button");
      btnCreate.type = "button";
      btnCreate.textContent = "Anlegen";
      applyPopupButtonStyle(btnCreate, { variant: "primary" });

      btnCancel.onclick = () => this._closeCreateMeetingModal(null);
      btnCreate.onclick = () =>
        this._closeCreateMeetingModal({
          dateISO: String(inpDate.value || "").trim(),
          keyword: String(inpKeyword.value || "").trim(),
          editParticipants: chkEditParticipants.checked,
        });

      const submitCreate = () =>
        this._closeCreateMeetingModal({
          dateISO: String(inpDate.value || "").trim(),
          keyword: String(inpKeyword.value || "").trim(),
          editParticipants: chkEditParticipants.checked,
        });

      inpDate.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        submitCreate();
      });
      inpKeyword.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        submitCreate();
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) this._closeCreateMeetingModal(null);
      });

      overlay.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          this._closeCreateMeetingModal(null);
        }
      });

      btnRow.append(btnCancel, btnCreate);
      body.append(dateField, keywordField, participantsOptionRow);
      box.append(header, body, btnRow);
      overlay.appendChild(box);

      document.body.appendChild(overlay);
      this._createMeetingModalEl = overlay;
      try {
        overlay.focus();
      } catch (_e) {
        // ignore
      }

      try {
        inpDate.focus();
      } catch (_) {}
    });
  }

  _closeProjectTransferModal() {
    if (this._transferModalEl) {
      try {
        cleanupPopupHandlers(this._transferModalEl);
        this._transferModalEl.remove();
      } catch (_) {}
    }
    this._transferModalEl = null;
  }

  _showProjectTransferPlaceholder() {
    window.alert?.("Under construction");
  }

  _closeAddProjectModal() {
    if (this._addProjectModalEl) {
      try {
        cleanupPopupHandlers(this._addProjectModalEl);
        this._addProjectModalEl.remove();
      } catch (_) {}
    }
    this._addProjectModalEl = null;
  }

  _closeArchiveModal() {
    if (this._archiveModalEl) {
      try {
        cleanupPopupHandlers(this._archiveModalEl);
        this._archiveModalEl.remove();
      } catch (_) {}
    }
    this._archiveModalEl = null;
  }

  _archivableModuleIdsForProject(project) {
    return this._moduleIdsForProject(project).filter((moduleId) =>
      ["protokoll", "restarbeiten"].includes(moduleId)
    );
  }

  async _archiveSelection(project, moduleId = null) {
    const projectId = String(project?.id || "").trim();
    if (!projectId) return false;
    const api = window.bbmDb || {};

    try {
      const result = moduleId
        ? await api.projectsArchiveModule?.({ projectId, moduleId })
        : await api.projectsArchive?.(projectId);
      if (!result?.ok) {
        this._flashMsg(result?.error || "Archivieren fehlgeschlagen.", 9000);
        return false;
      }
      this._closeArchiveModal();
      await this.reloadProjects();
      return true;
    } catch (error) {
      this._flashMsg(error?.message || "Archivieren fehlgeschlagen.", 9000);
      return false;
    }
  }

  _openArchiveSelectionModal(project) {
    if (this.moduleContext !== PROJECT_CONTEXT_ALL || this._archiveModalEl) return false;
    const projectId = String(project?.id || "").trim();
    if (!projectId) return false;

    const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.35)", zIndex: 9999 });
    overlay.style.display = "flex";
    registerPopupCloseHandlers(overlay, () => this._closeArchiveModal());

    const box = document.createElement("div");
    box.className = "bbm-popup-standard bbm-popup-dialog";
    box.style.width = "min(620px, calc(100vw - 32px))";
    box.style.maxHeight = "min(720px, calc(100vh - 32px))";
    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.overflow = "hidden";

    const header = document.createElement("div");
    header.className = "bbm-popup-header";
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "10px";

    const title = document.createElement("div");
    title.textContent = `${this._labelFull(project)} archivieren`;
    title.style.fontWeight = "800";

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Schließen";
    applyPopupButtonStyle(close);
    close.style.marginLeft = "auto";
    close.addEventListener("click", () => this._closeArchiveModal());
    header.append(title, close);

    const list = document.createElement("div");
    list.dataset.projectArchiveSelectionList = "true";
    list.setAttribute("role", "list");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "0";

    const appendChoice = ({ label, moduleId = null }) => {
      const row = document.createElement("div");
      row.dataset.projectArchiveChoice = moduleId || "project";
      row.setAttribute("role", "listitem");
      row.tabIndex = 0;
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.minHeight = "42px";
      row.style.padding = "8px 16px";
      row.style.borderBottom = "1px solid var(--card-border)";
      row.style.cursor = "pointer";
      row.style.fontWeight = "700";
      row.textContent = label;

      const activate = async () => {
        if (row.dataset.busy === "true") return;
        row.dataset.busy = "true";
        const archived = await this._archiveSelection(project, moduleId);
        if (!archived) row.dataset.busy = "false";
      };
      row.addEventListener("click", activate);
      row.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate();
      });
      list.appendChild(row);
    };

    appendChoice({ label: "Gesamtes Projekt archivieren" });
    for (const moduleId of this._archivableModuleIdsForProject(project)) {
      const moduleLabel = PROJECT_MODULE_PRESENTATION[moduleId]?.label || moduleId;
      appendChoice({ label: `Nur ${moduleLabel} archivieren`, moduleId });
    }

    box.append(header, list);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    this._archiveModalEl = overlay;
    return true;
  }

  _openProjectSelectionModal() {
    if (this.moduleContext === PROJECT_CONTEXT_ALL || this._addProjectModalEl) return false;

    const presentation = this._contextPresentation();
    const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.35)", zIndex: 9999 });
    overlay.style.display = "flex";
    registerPopupCloseHandlers(overlay, () => this._closeAddProjectModal());

    const box = document.createElement("div");
    box.className = "bbm-popup-standard bbm-popup-dialog";
    box.style.width = "min(620px, calc(100vw - 32px))";
    box.style.maxHeight = "min(720px, calc(100vh - 32px))";
    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.overflow = "hidden";

    const header = document.createElement("div");
    header.className = "bbm-popup-header";
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "10px";

    const title = document.createElement("div");
    title.textContent = `${presentation.label}: Projekt auswählen`;
    title.style.fontWeight = "800";

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Schließen";
    applyPopupButtonStyle(close);
    close.style.marginLeft = "auto";
    close.addEventListener("click", () => this._closeAddProjectModal());
    header.append(title, close);

    const body = document.createElement("div");
    body.className = "bbm-popup-body";
    body.style.overflow = "auto";
    body.style.padding = "0";

    const list = document.createElement("div");
    list.dataset.projectSelectionList = "true";
    list.setAttribute("role", "list");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "0";
    list.style.margin = "0";
    list.style.padding = "0";
    list.style.background = "transparent";

    const createListItem = ({ label, dataKey, onClick, badges = null }) => {
      const item = document.createElement("div");
      item.dataset[dataKey] = "true";
      item.dataset.projectSelectionRow = "true";
      item.setAttribute("role", "listitem");
      item.tabIndex = 0;
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.width = "100%";
      item.style.gap = "10px";
      item.style.minHeight = "40px";
      item.style.margin = "0";
      item.style.padding = "8px 16px";
      item.style.border = "0";
      item.style.borderBottom = "1px solid #dfe5ec";
      item.style.borderRadius = "0";
      item.style.boxShadow = "none";
      item.style.background = "transparent";
      item.style.cursor = "pointer";

      const text = document.createElement("span");
      text.textContent = label;
      text.style.fontWeight = "700";
      item.appendChild(text);

      if (badges) {
        badges.style.marginLeft = "auto";
        badges.style.justifyContent = "flex-end";
        item.appendChild(badges);
      }

      const activate = async () => {
        if (item.dataset.busy === "true") return;
        item.dataset.busy = "true";
        await onClick();
      };
      item.addEventListener("click", activate);
      item.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate();
      });
      return item;
    };

    list.appendChild(createListItem({
      label: "Neues Projekt",
      dataKey: "projectCreateOption",
      onClick: async () => {
        this._closeAddProjectModal();
        await this.openCreateProject();
      },
    }));

    const available = this._projectsAvailableToAdd();
    if (!available.length) {
      const empty = document.createElement("div");
      empty.textContent = `Keine weiteren Projekte für ${presentation.label} verfügbar.`;
      empty.style.fontSize = "12px";
      empty.style.color = "#667085";
      empty.style.padding = "10px 2px 2px";
      list.appendChild(empty);
    }

    for (const project of available) {
      const projectNumber = this._getProjectNumber(project);
      const label = projectNumber
        ? `${projectNumber} - ${this._labelForTile(project)}`
        : this._labelForTile(project);
      const item = createListItem({
        label,
        dataKey: "projectAddCandidate",
        badges: this._createModuleBadges(project),
        onClick: async () => {
          const assigned = await this._assignProjectToCurrentModule(project?.id);
          if (!assigned) {
            item.dataset.busy = "false";
            return;
          }
          await this.reloadProjects();
          this._closeAddProjectModal();
        },
      });
      item.dataset.projectId = String(project?.id || "");
      list.appendChild(item);
    }

    body.appendChild(list);
    box.append(header, body);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    this._addProjectModalEl = overlay;
    return true;
  }

  _formatBytes(value) {
    const n = Number(value || 0);
    if (!Number.isFinite(n) || n <= 0) return "0 B";
    if (n < 1024) return `${n} B`;
    const kb = n / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  _formatDateTime(ms) {
    const d = new Date(Number(ms || 0));
    if (Number.isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
  }

  // UI-nahe Nutzung des Export-Addons:
  // ProjectsScreen oeffnet nur den Import-/Export-Dialog und ruft die
  // technische Transfer-Schnittstelle an.
  _getProjectTransferAddonApi() {
    return window.bbmProjectTransfer || {};
  }

  async _openProjectTransferModal() {
    if (this._transferModalEl) return;

    const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.35)", zIndex: 9999 });
    overlay.style.display = "flex";
    registerPopupCloseHandlers(overlay, () => this._closeProjectTransferModal());

    const box = document.createElement("div");
    box.className = "bbm-popup-standard bbm-popup-dialog";
    box.style.width = "min(720px, calc(100vw - 32px))";
    box.style.maxHeight = "100%";
    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.overflow = "hidden";
    box.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "10px";
    header.className = "bbm-popup-header";

    const title = document.createElement("div");
    title.textContent = "Projekt Import / Export";
    title.style.fontWeight = "800";

    const btnClose = document.createElement("button");
    btnClose.type = "button";
    btnClose.textContent = "X";
    applyPopupButtonStyle(btnClose);
    btnClose.style.marginLeft = "auto";
    btnClose.onclick = () => this._closeProjectTransferModal();

    header.append(title, btnClose);

    const body = document.createElement("div");
    body.style.flex = "1 1 auto";
    body.style.minHeight = "0";
    body.style.overflow = "auto";
    body.className = "bbm-popup-body bbm-form-content";
    body.style.display = "flex";
    body.style.flexDirection = "column";

    const status = document.createElement("div");
    status.style.fontSize = "12px";
    status.style.opacity = "0.8";
    status.textContent = "";

    const exportBox = document.createElement("div");
    exportBox.className = "bbm-form-card bbm-form-group";
    exportBox.style.display = "flex";
    exportBox.style.flexDirection = "column";

    const exportTitle = document.createElement("div");
    exportTitle.textContent = "Projekt exportieren";
    exportTitle.style.fontWeight = "700";

    const exportHint = document.createElement("div");
    exportHint.textContent = "W?hlt ein Projekt und erstellt ein ZIP im Export-Ordner.";
    exportHint.style.fontSize = "12px";
    exportHint.style.opacity = "0.75";

    const exportSelect = document.createElement("select");
    exportSelect.style.width = "100%";
    exportSelect.style.boxSizing = "border-box";

    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.textContent = "Export starten";
    applyPopupButtonStyle(exportBtn, { variant: "primary" });
    exportBtn.style.alignSelf = "flex-start";

    const fillExportOptions = () => {
      exportSelect.innerHTML = "";
      const list = Array.isArray(this.projects) ? this.projects : [];
      if (!list.length) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Keine Projekte vorhanden";
        exportSelect.appendChild(opt);
        exportSelect.disabled = true;
        exportBtn.disabled = true;
        return;
      }
      exportSelect.disabled = false;
      exportBtn.disabled = false;
      for (const p of list) {
        const opt = document.createElement("option");
        opt.value = String(p?.id || "");
        const pn = this._getProjectNumber(p);
        opt.textContent = pn ? `${pn} - ${this._labelForTile(p)}` : this._labelForTile(p);
        exportSelect.appendChild(opt);
      }
    };
    fillExportOptions();

    exportBtn.onclick = async () => {
      const projectId = String(exportSelect.value || "").trim();
      if (!projectId) {
        status.textContent = "Bitte ein Projekt w?hlen.";
        return;
      }
      try {
        status.textContent = "Exportiere Projekt...";
        const api = this._getProjectTransferAddonApi();
        if (typeof api.exportProject !== "function") {
          status.textContent = "Export ist nicht verf?gbar (Preload/IPC fehlt).";
          return;
        }
        const res = await api.exportProject({ projectId });
        if (!res?.ok) {
          status.textContent = res?.error || "Export fehlgeschlagen.";
          return;
        }
        status.textContent = "Export abgeschlossen.";
        await this.reloadProjects();
        fillExportOptions();
      } catch (err) {
        status.textContent = err?.message || "Export fehlgeschlagen.";
      }
    };

    exportBox.append(exportTitle, exportHint, exportSelect, exportBtn);

    const importBox = document.createElement("div");
    importBox.className = "bbm-form-card bbm-form-group";
    importBox.style.display = "flex";
    importBox.style.flexDirection = "column";

    const importTitle = document.createElement("div");
    importTitle.textContent = "Projekt importieren";
    importTitle.style.fontWeight = "700";

    const importHint = document.createElement("div");
    importHint.textContent = "Imports aus dem Export-Ordner der App.";
    importHint.style.fontSize = "12px";
    importHint.style.opacity = "0.75";

    const exportDirHint = document.createElement("div");
    exportDirHint.textContent = "Export-Ordner: -";
    exportDirHint.style.fontSize = "12px";
    exportDirHint.style.opacity = "0.7";

    const exportDirActions = document.createElement("div");
    exportDirActions.style.display = "flex";
    exportDirActions.style.justifyContent = "flex-start";

    const btnOpenExportDir = document.createElement("button");
    btnOpenExportDir.type = "button";
    btnOpenExportDir.textContent = "Ordner ?ffnen";
    applyPopupButtonStyle(btnOpenExportDir);

    exportDirActions.append(btnOpenExportDir);

    const importActions = document.createElement("div");
    importActions.style.display = "flex";
    importActions.style.gap = "8px";

    const importAllBtn = document.createElement("button");
    importAllBtn.type = "button";
    importAllBtn.textContent = "Alle importieren";
    applyPopupButtonStyle(importAllBtn);

    const refreshBtn = document.createElement("button");
    refreshBtn.type = "button";
    refreshBtn.textContent = "Liste aktualisieren";
    applyPopupButtonStyle(refreshBtn);

    importActions.append(importAllBtn, refreshBtn);

    const importList = document.createElement("div");
    importList.style.display = "flex";
    importList.style.flexDirection = "column";
    importList.style.gap = "6px";

    const api = this._getProjectTransferAddonApi();

    btnOpenExportDir.onclick = async () => {
      if (typeof api.openExportFolder !== "function") {
        status.textContent = "Export-Ordner ?ffnen ist nicht verf?gbar (Preload/IPC fehlt).";
        return;
      }
      const res = await api.openExportFolder();
      if (!res?.ok) {
        status.textContent = res?.error || "Export-Ordner konnte nicht ge?ffnet werden.";
        return;
      }
      if (res?.exportRoot) exportDirHint.textContent = `Export-Ordner: ${res.exportRoot}`;
    };

    const loadExportList = async () => {
      importList.innerHTML = "";
      if (typeof api.listExports !== "function") {
        importList.textContent = "Export-Liste nicht verf?gbar (Preload/IPC fehlt).";
        importAllBtn.disabled = true;
        return [];
      }
      const res = await api.listExports();
      if (res?.exportRoot) exportDirHint.textContent = `Export-Ordner: ${res.exportRoot}`;
      if (!res?.ok) {
        importList.textContent = res?.error || "Export-Ordner konnte nicht gelesen werden.";
        importAllBtn.disabled = true;
        return [];
      }
      const list = Array.isArray(res.list) ? res.list : [];
      if (!list.length) {
        importList.textContent = "Keine Exportdateien gefunden.";
        importAllBtn.disabled = true;
        return [];
      }
      importAllBtn.disabled = false;
      for (const item of list) {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "8px";
        row.style.border = "1px solid #eee";
        row.style.borderRadius = "var(--bbm-popup-control-radius)";
        row.style.padding = "6px 8px";

        const label = document.createElement("div");
        label.style.flex = "1 1 auto";
        label.style.fontSize = "12px";
        const meta = `${this._formatDateTime(item.mtimeMs)} ? ${this._formatBytes(item.size)}`;
        label.textContent = `${item.fileName} (${meta})`;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "Import";
        applyPopupButtonStyle(btn, { variant: "primary" });
        btn.onclick = async () => {
          btn.disabled = true;
          status.textContent = `Importiere ${item.fileName}...`;
          const resImport = await api.importFromExport({ filePath: item.filePath });
          if (!resImport?.ok) {
            status.textContent = resImport?.error || "Import fehlgeschlagen.";
            btn.disabled = false;
            return;
          }
          status.textContent = `Import abgeschlossen: ${item.fileName}`;
          await this.reloadProjects();
          await loadExportList();
        };

        row.append(label, btn);
        importList.appendChild(row);
      }
      return list;
    };

    importAllBtn.onclick = async () => {
      importAllBtn.disabled = true;
      refreshBtn.disabled = true;
      status.textContent = "Importiere alle Exportdateien...";
      const list = await loadExportList();
      let okCount = 0;
      for (const item of list) {
        const resImport = await api.importFromExport({ filePath: item.filePath });
        if (resImport?.ok) okCount += 1;
      }
      await this.reloadProjects();
      await loadExportList();
      status.textContent = `Import abgeschlossen: ${okCount} Datei(en) erfolgreich.`;
      importAllBtn.disabled = false;
      refreshBtn.disabled = false;
    };

    refreshBtn.onclick = async () => {
      await loadExportList();
    };

    await loadExportList();

    importBox.append(importTitle, importHint, exportDirHint, exportDirActions, importActions, importList);

    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.justifyContent = "flex-end";
    footer.className = "bbm-popup-footer";
    footer.style.gap = "var(--bbm-popup-footer-gap)";

    const btnCloseBottom = document.createElement("button");
    btnCloseBottom.type = "button";
    btnCloseBottom.textContent = "Schlie?en";
    applyPopupButtonStyle(btnCloseBottom);
    btnCloseBottom.onclick = () => this._closeProjectTransferModal();

    footer.append(btnCloseBottom);

    body.append(status, exportBox, importBox);
    box.append(header, body, footer);
    overlay.appendChild(box);

    document.body.appendChild(overlay);
    this._transferModalEl = overlay;
    try {
      overlay.focus();
    } catch (_e) {
      // ignore
    }
  }

  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------
  render() {
    const root = document.createElement("div");

    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.alignItems = "center";
    head.style.gap = "10px";
    head.style.marginBottom = "10px";

    const h = document.createElement("h2");
    h.textContent = this.moduleContext === PROJECT_CONTEXT_ALL
      ? "Projekte / Alle"
      : this._contextPresentation().label;
    h.style.margin = "0";

    const msg = document.createElement("div");
    msg.style.marginLeft = "auto";
    msg.style.fontSize = "12px";
    msg.style.opacity = "0.85";

    head.append(h, msg);

    const host = document.createElement("div");

    root.append(head, host);

    this.root = root;
    this.hostEl = host;
    this.msgEl = msg;

    this._renderGrid();

    return root;
  }

  async load() {
    await this.reloadProjects();
  }

  async openCreateProject() {
    this.router.currentProjectId = null;
    this.router.currentMeetingId = null;

    await this._openProjectFormModal({ projectId: null });
    return true;
  }

  async openProjectById(projectId) {
    if (this.loading) return false;
    if (this._startingProject) {
      // Safety net: falls der Start-Flag hängengeblieben ist, freigeben und neu versuchen.
      this._startingProject = false;
    }

    const wanted = String(projectId ?? "").trim();
    if (!wanted) {
      this._flashMsg("Projekt kann nicht geöffnet werden: id fehlt.", 7000);
      return false;
    }

    let project = (this.projects || []).find((p) => String(p?.id ?? "") === wanted) || null;
    if (!project) {
      await this.reloadProjects();
      project = (this.projects || []).find((p) => String(p?.id ?? "") === wanted) || null;
    }

    if (!project || !project.id) {
      this._flashMsg("Projekt wurde nicht gefunden.", 7000);
      return false;
    }

    this._setProjectRuntimeContext(project.id, null);
    this._rememberLastProject(project.id);

    if (this.moduleContext === PROJECT_CONTEXT_ALL) {
      await this._openProjectFormModal({ projectId: project.id });
      return true;
    }

    if (typeof this.router?.openProjectModule !== "function") {
      this._flashMsg(`${this._contextPresentation().label} ist nicht verfügbar.`, 9000);
      return false;
    }

    const result = await this.router.openProjectModule(project.id, this.moduleContext, {
      project,
      navigationKey: this.moduleContext,
    });
    if (typeof result === "object") {
      if (result?.blocked) {
        this._flashMsg(`${this._contextPresentation().label} ist für diese Lizenz nicht freigeschaltet.`, 9000);
      }
      return !!result?.ok;
    }
    return result !== false;
  }

  _rememberLastProject(projectId) {
    const id = String(projectId ?? "").trim();
    if (!id) return;
    try {
      window.localStorage?.setItem?.(LAST_PROJECT_KEY, id);
    } catch (_e) {
      // ignore
    }
  }

  _readCreateMeetingEditParticipantsDefault() {
    try {
      const raw = String(
        window.localStorage?.getItem?.(CREATE_MEETING_EDIT_PARTICIPANTS_KEY) || ""
      ).trim().toLowerCase();
      if (raw === "0" || raw === "false") return false;
      if (raw === "1" || raw === "true") return true;
    } catch (_e) {
      // ignore
    }
    return true;
  }

  _writeCreateMeetingEditParticipants(value) {
    try {
      window.localStorage?.setItem?.(
        CREATE_MEETING_EDIT_PARTICIPANTS_KEY,
        value ? "1" : "0"
      );
    } catch (_e) {
      // ignore
    }
  }

  async reloadProjects() {
    this.loading = true;
    this._setMsg("Lade...");

    try {
      const api = window.bbmDb || {};
      if (typeof api.projectsList !== "function") {
        this.allProjects = [];
        this.projects = [];
        this._flashMsg("projectsList ist nicht verfügbar (Preload/IPC fehlt).", 9000);
        return;
      }

      const res = await api.projectsList();
      if (!res?.ok) {
        this.allProjects = [];
        this.projects = [];
        this._flashMsg(res?.error || "Fehler beim Laden", 9000);
        return;
      }

      this.allProjects = Array.isArray(res.list) ? res.list : [];
      this.projects = this._projectsForCurrentContext(this.allProjects);
      this._setMsg("");
    } finally {
      this.loading = false;
      this._renderGrid();
    }
  }

  _renderModuleContextList() {
    const list = document.createElement("div");
    list.dataset.projectContextList = "true";
    list.setAttribute("role", "list");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "0";
    list.style.margin = "0";
    list.style.padding = "0";
    list.style.background = "transparent";

    const createRow = ({ label, detail = "", dataKey, projectId = "", onActivate }) => {
      const row = document.createElement("div");
      row.dataset.projectContextRow = "true";
      row.dataset[dataKey] = "true";
      if (projectId) row.dataset.projectId = String(projectId);
      row.setAttribute("role", "listitem");
      row.tabIndex = 0;
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.width = "100%";
      row.style.minHeight = "42px";
      row.style.gap = "10px";
      row.style.margin = "0";
      row.style.padding = "8px 12px";
      row.style.border = "0";
      row.style.borderBottom = "1px solid var(--card-border)";
      row.style.borderRadius = "0";
      row.style.boxShadow = "none";
      row.style.background = "transparent";
      row.style.color = "var(--text-main)";
      row.style.cursor = "pointer";
      row.style.userSelect = "none";

      const text = document.createElement("div");
      text.textContent = label;
      text.style.minWidth = "0";
      text.style.fontWeight = "750";
      text.style.fontSize = "14px";
      text.style.overflow = "hidden";
      text.style.textOverflow = "ellipsis";
      text.style.whiteSpace = "nowrap";
      row.appendChild(text);

      if (detail) {
        const right = document.createElement("div");
        right.dataset.projectContextDetail = "true";
        right.textContent = detail;
        right.style.marginLeft = "auto";
        right.style.flex = "0 0 auto";
        right.style.color = "var(--text-muted)";
        right.style.fontSize = "12px";
        right.style.whiteSpace = "nowrap";
        row.appendChild(right);
      }

      const activate = async () => {
        if (this.loading || this._startingProject || row.dataset.busy === "true") return;
        row.dataset.busy = "true";
        await onActivate?.();
      };
      row.addEventListener("click", activate);
      row.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate();
      });
      return row;
    };

    list.appendChild(createRow({
      label: "Projekt neu / hinzufÃ¼gen",
      dataKey: "projectContextCreate",
      onActivate: () => this._openProjectSelectionModal(),
    }));

    for (const project of this.projects || []) {
      const projectId = String(project?.id || "");
      const number = this._getProjectNumber(project);
      const label = number
        ? `${number} - ${this._labelForTile(project)}`
        : this._labelForTile(project);
      const keyword = String(project?.keyword ?? project?.project_keyword ?? project?.schlagwort ?? "").trim();
      const createdAt = String(project?.created_at ?? project?.createdAt ?? "").trim();
      const detail = keyword || this._isoToDDMMYYYY(createdAt);

      list.appendChild(createRow({
        label,
        detail,
        dataKey: "projectContextProject",
        projectId,
        onActivate: () => this.openProjectById(projectId),
      }));
    }

    this.hostEl.appendChild(list);

    if (this.loading) {
      const hint = document.createElement("div");
      hint.textContent = "Lade Projekte...";
      hint.style.opacity = "0.8";
      hint.style.marginTop = "10px";
      this.hostEl.appendChild(hint);
    }
  }

  _renderAllProjectsList() {
    const list = document.createElement("div");
    list.dataset.projectsAllList = "true";
    list.setAttribute("role", "list");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "0";
    list.style.margin = "0";
    list.style.padding = "0";

    const createRow = ({ dataKey, onActivate }) => {
      const row = document.createElement("div");
      row.dataset.projectsAllRow = "true";
      row.dataset[dataKey] = "true";
      row.setAttribute("role", "listitem");
      row.tabIndex = 0;
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.width = "100%";
      row.style.minHeight = "44px";
      row.style.gap = "12px";
      row.style.padding = "8px 12px";
      row.style.border = "0";
      row.style.borderBottom = "1px solid var(--card-border)";
      row.style.borderRadius = "0";
      row.style.boxShadow = "none";
      row.style.background = "transparent";
      row.style.color = "var(--text-main)";
      row.style.cursor = "pointer";

      const activate = async () => {
        if (this.loading || row.dataset.busy === "true") return;
        row.dataset.busy = "true";
        try {
          await onActivate?.();
        } finally {
          row.dataset.busy = "false";
        }
      };
      row.addEventListener("click", activate);
      row.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate();
      });
      return row;
    };

    const createProjectRow = createRow({
      dataKey: "projectCreateRow",
      onActivate: () => this.openCreateProject(),
    });
    const createProjectText = document.createElement("span");
    createProjectText.textContent = "+ Projekt anlegen";
    createProjectText.style.fontWeight = "800";
    createProjectRow.appendChild(createProjectText);
    list.appendChild(createProjectRow);

    const transferRow = createRow({
      dataKey: "projectTransferRow",
      onActivate: () => this._showProjectTransferPlaceholder(),
    });
    const transferTitle = document.createElement("span");
    transferTitle.textContent = "Import / Export";
    transferTitle.style.fontWeight = "800";
    const transferHint = document.createElement("span");
    transferHint.textContent = "Under construction";
    transferHint.style.marginLeft = "auto";
    transferHint.style.fontSize = "12px";
    transferHint.style.color = "var(--text-muted)";
    transferRow.append(transferTitle, transferHint);
    list.appendChild(transferRow);

    for (const project of this.projects || []) {
      const projectId = String(project?.id || "");
      const row = createRow({
        dataKey: "projectAllProjectRow",
        onActivate: () => this.openProjectById(projectId),
      });
      row.dataset.projectId = projectId;

      const labelWrap = document.createElement("div");
      labelWrap.style.display = "flex";
      labelWrap.style.flexDirection = "column";
      labelWrap.style.minWidth = "0";
      labelWrap.style.flex = "1 1 auto";

      const projectNumber = this._getProjectNumber(project);
      const label = document.createElement("span");
      label.textContent = projectNumber
        ? `${projectNumber} - ${this._labelForTile(project)}`
        : this._labelForTile(project);
      label.style.fontWeight = "750";
      label.style.overflow = "hidden";
      label.style.textOverflow = "ellipsis";
      label.style.whiteSpace = "nowrap";
      labelWrap.appendChild(label);

      const keyword = String(project?.keyword ?? project?.project_keyword ?? project?.schlagwort ?? "").trim();
      const createdAt = String(project?.created_at ?? project?.createdAt ?? "").trim();
      const detailText = keyword || this._isoToDDMMYYYY(createdAt);
      if (detailText) {
        const detail = document.createElement("span");
        detail.dataset.projectAllDetail = "true";
        detail.textContent = detailText;
        detail.style.fontSize = "12px";
        detail.style.color = "var(--text-muted)";
        labelWrap.appendChild(detail);
      }

      const badges = this._createModuleBadges(project);
      badges.style.marginLeft = "auto";
      badges.style.justifyContent = "flex-end";

      const archiveButton = document.createElement("button");
      archiveButton.type = "button";
      archiveButton.textContent = "Archivieren";
      archiveButton.dataset.projectAction = "archive";
      applyPopupButtonStyle(archiveButton, { variant: "neutral" });
      archiveButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._openArchiveSelectionModal(project);
      });

      row.append(labelWrap, badges, archiveButton);
      list.appendChild(row);
    }

    this.hostEl.appendChild(list);
  }

  // ------------------------------------------------------------
  // Projekte / Alle: kompakte Zeilenliste
  // ------------------------------------------------------------
  _renderGrid() {
    if (!this.hostEl) return;

    this.hostEl.innerHTML = "";

    if (this.moduleContext !== PROJECT_CONTEXT_ALL) {
      this._renderModuleContextList();
      return;
    }

    this._renderAllProjectsList();
  }

  // ------------------------------------------------------------
  // Project click flow: Protokoll-Startpunkt fuer den Projektkontext
  // ------------------------------------------------------------
  async _openProjectInNewMode(projectId, projectObj) {
    if (typeof this.router?.openProjectModule === "function") {
      const result = await this.router.openProjectModule(projectId, "protokoll", {
        project: projectObj || null,
      });
      return typeof result === "object" ? !!result?.ok : result !== false;
    }

    if (typeof this.router?.openProjectProtocol === "function") {
      const result = await this.router.openProjectProtocol(projectId, {
        project: projectObj || null,
      });
      return typeof result === "object" ? !!result?.ok : result !== false;
    }

    const openedExisting = await this._openExistingMeetingIfAvailable(projectId);
    if (openedExisting) return true;

    if (typeof this.router?.showMeetings === "function") {
      await this.router.showMeetings(projectId, {
        startMode: true,
        startReason: "protocol-start-unavailable",
        integrityError: false,
      });
      return true;
    }

    return false;
  }

  async _openExistingMeetingIfAvailable(projectId) {
    if (this._startingProject) return false;

    const api = window.bbmDb || {};
    if (typeof api.meetingsListByProject !== "function") return false;

    this._startingProject = true;
    this._setMsg("Öffne Projekt...");

    try {
      const res = await api.meetingsListByProject(projectId);
      if (!res?.ok) return false;
      const list = Array.isArray(res.list) ? res.list : [];
      const openMeetings = list.filter((m) => Number(m?.is_closed) !== 1);
      if (openMeetings.length !== 1) {
        return false;
      }

      const meeting = openMeetings[0] || null;
      if (!meeting?.id) return false;

      this._setProjectRuntimeContext(projectId, meeting.id);
      const opened = await this.router.showTops(meeting.id, projectId);
      if (opened === false || opened?.blocked) return false;
      this._rememberLastProject(projectId);
      return true;
    } catch (err) {
      console.warn("[ProjectsScreen] _openExistingMeetingIfAvailable failed:", err);
      return false;
    } finally {
      this._startingProject = false;
      this._setMsg("");
    }
  }

  async _createMeetingAndOpenTops(projectId, projectObj) {
    if (this._startingProject) return false;

    let result = false;
    this._startingProject = true;
    this._setMsg("Öffne Projekt...");

    try {
      this._setProjectRuntimeContext(projectId, null);

      const api = window.bbmDb || {};
      if (typeof api.meetingsCreate !== "function") {
        this._flashMsg("meetingsCreate ist nicht verfügbar (Preload/IPC fehlt).", 9000);
        if (typeof this.router?.showMeetings === "function") {
          await this.router.showMeetings(projectId, {
            startMode: true,
            startReason: "meetings-create-unavailable",
            integrityError: false,
          });
        }
        this._rememberLastProject(projectId);
        return true;
      }

      // Dialog zum Anlegen des Protokolls (Datum/Schlagwort/Teilnehmer-Option)
      const modalRes = await this._openCreateMeetingModal({ dateISO: this._todayISO() });
      if (!modalRes) return false; // abgebrochen

      let dateISO = String(modalRes.dateISO || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) dateISO = this._todayISO();
      const keyword = String(modalRes.keyword || "").trim();
      const editParticipants = modalRes.editParticipants !== false;
      this._writeCreateMeetingEditParticipants(editParticipants);

      // nächsten Index ermitteln
      let nextIndex = 1;
      if (typeof api.meetingsListByProject === "function") {
        try {
          const res = await api.meetingsListByProject(projectId);
          if (res?.ok) {
            const list = res.list || [];
            const maxIdx = list.reduce((mx, x) => Math.max(mx, Number(x.meeting_index || 0)), 0);
            nextIndex = (maxIdx || 0) + 1;
          }
        } catch (errList) {
          console.warn("[ProjectsScreen] meetingsListByProject failed:", errList);
        }
      }

      const dd = this._isoToDDMMYYYY(dateISO);
      const idx = `#${nextIndex}`;
      const title = keyword ? `${idx} ${dd} - ${keyword}` : `${idx} ${dd}`;

      this._setMsg("Protokoll wird angelegt...");
      let meetingId = null;
      try {
        const createRes = await api.meetingsCreate({ projectId, title });
        if (!createRes?.ok || !createRes.meeting?.id) {
          this._flashMsg(createRes?.error || "Besprechung konnte nicht angelegt werden.", 9000);
        } else {
          meetingId = createRes.meeting.id;
        }
      } catch (errCreate) {
        console.error("[ProjectsScreen] meetingsCreate threw", errCreate);
        this._flashMsg(errCreate?.message || String(errCreate), 9000);
      }

      // Wenn Anlage fehlgeschlagen: TopsView trotzdem im Idle-State öffnen
      if (!meetingId) {
        this._setMsg("Öffne Protokoll...");
        if (typeof this.router?.showMeetings === "function") {
          await this.router.showMeetings(projectId, {
            startMode: true,
            startReason: "meeting-create-failed",
            integrityError: false,
          });
        }
        this._rememberLastProject(projectId);
        return false;
      }

      this._setProjectRuntimeContext(projectId, meetingId);

      this._setMsg("Öffne Protokoll...");

      const opened = await this.router.showTops(meetingId, projectId);
      if (opened === false || opened?.blocked) {
        return false;
      }

      this._rememberLastProject(projectId);
      result = true;

      // optional Teilnehmer direkt öffnen
      if (editParticipants && typeof this.router.openParticipantsModal === "function") {
        try {
          await this.router.openParticipantsModal({ projectId, meetingId });
        } catch (errParticipants) {
          console.warn("[ProjectsScreen] openParticipantsModal failed:", errParticipants);
        }
      }
    } catch (err) {
      console.error("[ProjectsScreen] _createMeetingAndOpenTops failed:", err);
      this._flashMsg(err?.message || String(err), 9000);
      result = false;
    } finally {
      this._startingProject = false;
      this._setMsg("");
    }

    return result;
  }

  _pickLatestOpenMeeting(openMeetings) {
    const list = Array.isArray(openMeetings) ? openMeetings : [];
    if (!list.length) return null;

    return list.reduce((best, cur) => {
      const bestIdx = Number(best?.meeting_index ?? best?.meetingIndex ?? 0);
      const curIdx = Number(cur?.meeting_index ?? cur?.meetingIndex ?? 0);
      if (curIdx > bestIdx) return cur;
      if (curIdx === bestIdx) {
        const bestId = Number(best?.id ?? 0);
        const curId = Number(cur?.id ?? 0);
        return curId > bestId ? cur : best;
      }
      return best;
    }, list[0]);
  }

  destroy() {
    if (this._msgTimer) {
      clearTimeout(this._msgTimer);
      this._msgTimer = null;
    }

    this._closeCreateMeetingModal(null);
    this._closeAddProjectModal();
    this._closeArchiveModal();

    if (this._projectFormModal) {
      try {
        if (typeof this._projectFormModal.destroy === "function") {
          this._projectFormModal.destroy();
        } else if (typeof this._projectFormModal._closeModal === "function") {
          this._projectFormModal._closeModal();
        }
      } catch (_e) {
        // ignore
      }
    }

    this._cleanupProjectFormModal();
  }
}
