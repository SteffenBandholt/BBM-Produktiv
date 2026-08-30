// src/renderer/modules/projektverwaltung/screens/ArchiveScreen.js
//
// Archivierte Projekte und Projektmodule:
// - gemeinsame kompakte Zeilenliste mit sichtbarem Archivumfang
// - Wiederherstellen erhält Projekt-ID und Fachdaten
// - endgültiges Löschen wirkt nur auf den gewählten Archivdatensatz

import { applyPopupButtonStyle } from "../../../ui/popupButtonStyles.js";

const ARCHIVE_MODULE_PRESENTATION = Object.freeze({
  protokoll: Object.freeze({ label: "Protokoll", color: "#37a447" }),
  restarbeiten: Object.freeze({ label: "Restarbeiten", color: "#ef7d00" }),
  rechnung: Object.freeze({ label: "Rechnungen", color: "#1769d2" }),
  sigeko: Object.freeze({ label: "SiGeKo", color: "#7b3fb3" }),
  "dev-ui-editor": Object.freeze({ label: "UI-Editor", color: "#d92d20" }),
});

export default class ArchiveScreen {
  constructor({ router } = {}) {
    this.router = router || null;

    this.root = null;
    this.hostEl = null;
    this.msgEl = null;

    this.loading = false;
    this.busyArchiveKey = null;

    this.projects = [];
    this._msgTimer = null;
  }

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

  _labelForTile(p) {
    if (!p) return "(ohne Name)";
    const short = String(p.short || "").trim();
    const name = String(p.name || "").trim();
    return short || name || "(ohne Name)";
  }

  _archiveType(entry) {
    return String(entry?.archive_type ?? entry?.archiveType ?? "project").trim().toLowerCase() === "module"
      ? "module"
      : "project";
  }

  _moduleId(entry) {
    return String(entry?.module_id ?? entry?.moduleId ?? "").trim().toLowerCase();
  }

  _archiveKey(entry) {
    const projectId = String(entry?.project_id ?? entry?.projectId ?? entry?.id ?? "").trim();
    return `${this._archiveType(entry)}:${projectId}:${this._moduleId(entry)}`;
  }

  _scopeLabel(entry) {
    const explicit = String(entry?.archive_scope_label ?? entry?.archiveScopeLabel ?? "").trim();
    if (explicit) return explicit;
    if (this._archiveType(entry) === "project") return "Gesamtes Projekt";
    return ARCHIVE_MODULE_PRESENTATION[this._moduleId(entry)]?.label || this._moduleId(entry);
  }

  _moduleIds(entry) {
    const raw = entry?.module_ids ?? entry?.moduleIds ?? [];
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.map((value) => String(value || "").trim().toLowerCase()).filter(Boolean))];
  }

  _createModuleBadges(entry) {
    const badges = document.createElement("div");
    badges.dataset.archiveModuleBadges = "true";
    badges.style.display = "flex";
    badges.style.flexWrap = "wrap";
    badges.style.justifyContent = "flex-end";
    badges.style.gap = "4px";

    for (const moduleId of this._moduleIds(entry)) {
      const presentation = ARCHIVE_MODULE_PRESENTATION[moduleId];
      if (!presentation) continue;
      const badge = document.createElement("span");
      badge.dataset.archiveModuleBadge = moduleId;
      badge.textContent = presentation.label;
      badge.style.display = "inline-flex";
      badge.style.alignItems = "center";
      badge.style.padding = "1px 7px";
      badge.style.borderRadius = "999px";
      badge.style.background = presentation.color;
      badge.style.color = "#fff";
      badge.style.fontSize = "10px";
      badge.style.fontWeight = "750";
      badges.appendChild(badge);
    }
    return badges;
  }

  _formatArchivedAt(p) {
    const raw = p?.archived_at ?? p?.archivedAt ?? null;
    if (!raw) return "";
    const s = String(raw);
    const iso = s.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const y = iso.slice(0, 4);
      const m = iso.slice(5, 7);
      const d = iso.slice(8, 10);
      return `${d}.${m}.${y}`;
    }
    return s;
  }

  render() {
    const root = document.createElement("div");

    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.alignItems = "center";
    head.style.gap = "10px";
    head.style.marginBottom = "10px";

    const h = document.createElement("h2");
    h.textContent = "Archiviert";
    h.style.margin = "0";

    const hasActiveProject = !!(this.router?.currentProjectId || this.router?.lastTopsProjectId);
    const btnBackToProject = document.createElement("button");
    btnBackToProject.type = "button";
    btnBackToProject.textContent = "Zurück zum Protokoll";
    btnBackToProject.disabled = !hasActiveProject;
    applyPopupButtonStyle(btnBackToProject, { variant: "neutral" });
    btnBackToProject.onclick = async () => {
      const projectId =
        this.router?.currentProjectId || this.router?.lastTopsProjectId || null;
      const meetingId =
        this.router?.currentMeetingId || this.router?.lastTopsMeetingId || null;
      if (!projectId) return;
      if (meetingId && typeof this.router?.showTops === "function") {
        await this.router.showTops(meetingId, projectId);
        return;
      }
      if (typeof this.router?.showMeetings === "function") {
        await this.router.showMeetings(projectId);
      }
    };

    const msg = document.createElement("div");
    msg.style.marginLeft = "auto";
    msg.style.fontSize = "12px";
    msg.style.opacity = "0.85";

    head.append(h, btnBackToProject, msg);

    const host = document.createElement("div");

    root.append(head, host);

    this.root = root;
    this.hostEl = host;
    this.msgEl = msg;

    this._renderGrid();

    return root;
  }

  async load() {
    await this.reload();
  }

  async reload() {
    this.loading = true;
    this._setMsg("Lade...");

    try {
      const api = window.bbmDb || {};
      if (typeof api.projectsListArchiveEntries !== "function") {
        this.projects = [];
        this._flashMsg("projectsListArchiveEntries ist nicht verfügbar (Preload/IPC fehlt).", 9000);
        return;
      }

      const res = await api.projectsListArchiveEntries();
      if (!res?.ok) {
        this.projects = [];
        this._flashMsg(res?.error || "Fehler beim Laden", 9000);
        return;
      }

      this.projects = res.list || [];
      this._setMsg("");
    } finally {
      this.loading = false;
      this.busyArchiveKey = null;
      this._renderGrid();
    }
  }

  _renderGrid() {
    this._renderArchiveList();
  }

  _renderArchiveList() {
    if (!this.hostEl) return;
    this.hostEl.innerHTML = "";

    if (!this.loading && (!this.projects || this.projects.length === 0)) {
      const empty = document.createElement("div");
      empty.style.opacity = "0.75";
      empty.textContent = "Keine archivierten Projekte oder Module.";
      this.hostEl.appendChild(empty);
      return;
    }

    const list = document.createElement("div");
    list.dataset.projectArchiveList = "true";
    list.setAttribute("role", "list");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "0";

    for (const entry of this.projects || []) {
      const projectId = String(entry?.project_id ?? entry?.projectId ?? entry?.id ?? "").trim();
      const archiveType = this._archiveType(entry);
      const moduleId = this._moduleId(entry);
      const archiveKey = this._archiveKey(entry);
      const scopeLabel = this._scopeLabel(entry);
      const projectNumber = this._getProjectNumber(entry);
      const projectLabel = projectNumber
        ? `${projectNumber} - ${this._labelForTile(entry)}`
        : this._labelForTile(entry);

      const row = document.createElement("div");
      row.dataset.projectArchiveRow = "true";
      row.dataset.archiveType = archiveType;
      row.dataset.projectId = projectId;
      if (moduleId) row.dataset.moduleId = moduleId;
      row.setAttribute("role", "listitem");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.width = "100%";
      row.style.minHeight = "50px";
      row.style.gap = "12px";
      row.style.padding = "8px 12px";
      row.style.border = "0";
      row.style.borderBottom = "1px solid var(--card-border)";
      row.style.borderRadius = "0";
      row.style.boxShadow = "none";
      row.style.background = "transparent";

      const labelWrap = document.createElement("div");
      labelWrap.style.display = "flex";
      labelWrap.style.flexDirection = "column";
      labelWrap.style.flex = "1 1 auto";
      labelWrap.style.minWidth = "0";

      const title = document.createElement("div");
      title.dataset.archiveName = "true";
      title.textContent = `${projectLabel} – ${scopeLabel}`;
      title.style.fontWeight = "800";
      title.style.overflow = "hidden";
      title.style.textOverflow = "ellipsis";
      title.style.whiteSpace = "nowrap";

      const date = document.createElement("div");
      date.dataset.archiveDate = "true";
      const archivedAt = this._formatArchivedAt(entry);
      date.textContent = archivedAt ? `Archiviert am: ${archivedAt}` : "Archiviert";
      date.style.fontSize = "12px";
      date.style.color = "var(--text-muted)";
      labelWrap.append(title, date);

      const badges = this._createModuleBadges(entry);

      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = "8px";
      actions.style.flex = "0 0 auto";

      const restore = document.createElement("button");
      restore.type = "button";
      restore.textContent = "Wiederherstellen";
      restore.dataset.archiveAction = "restore";
      applyPopupButtonStyle(restore, { variant: "primary" });

      const deleteForever = document.createElement("button");
      deleteForever.type = "button";
      deleteForever.textContent = "Endgültig löschen";
      deleteForever.dataset.archiveAction = "delete";
      applyPopupButtonStyle(deleteForever, { variant: "danger" });

      const isBusy = this.busyArchiveKey === archiveKey;
      restore.disabled = this.loading || isBusy;
      deleteForever.disabled = this.loading || isBusy;

      restore.addEventListener("click", async () => {
        if (!projectId || this.loading || this.busyArchiveKey) return;
        const api = window.bbmDb || {};
        if (typeof api.projectsRestoreArchive !== "function") {
          alert("projectsRestoreArchive ist nicht verfügbar (Preload/IPC fehlt).");
          return;
        }

        this.busyArchiveKey = archiveKey;
        this._setMsg("Stelle wieder her...");
        this._renderGrid();
        try {
          const result = await api.projectsRestoreArchive({
            archiveType,
            projectId,
            ...(moduleId ? { moduleId } : {}),
          });
          if (!result?.ok) {
            alert(result?.error || "Wiederherstellen fehlgeschlagen");
            return;
          }
          await this.reload();
        } finally {
          this._setMsg("");
          this.busyArchiveKey = null;
          this._renderGrid();
        }
      });

      deleteForever.addEventListener("click", async () => {
        if (!projectId || this.loading || this.busyArchiveKey) return;
        const ok = confirm(
          `Archiv endgültig löschen?\n\n${projectLabel} – ${scopeLabel}\n\nDer Inhalt dieses gewählten Archivs wird unwiderruflich gelöscht.`
        );
        if (!ok) return;

        const api = window.bbmDb || {};
        if (typeof api.projectsDeleteArchiveForever !== "function") {
          alert("projectsDeleteArchiveForever ist nicht verfügbar (Preload/IPC fehlt).");
          return;
        }

        this.busyArchiveKey = archiveKey;
        this._setMsg("Lösche Archiv...");
        this._renderGrid();
        try {
          const result = await api.projectsDeleteArchiveForever({
            archiveType,
            projectId,
            ...(moduleId ? { moduleId } : {}),
          });
          if (!result?.ok) {
            alert(result?.error || "Endgültiges Löschen fehlgeschlagen");
            return;
          }
          if (result?.warning) alert(result.warning);
          await this.reload();
        } finally {
          this._setMsg("");
          this.busyArchiveKey = null;
          this._renderGrid();
        }
      });

      actions.append(restore, deleteForever);
      row.append(labelWrap, badges, actions);
      list.appendChild(row);
    }

    this.hostEl.appendChild(list);

    if (this.loading) {
      const hint = document.createElement("div");
      hint.textContent = "Lade Archiv...";
      hint.style.opacity = "0.8";
      hint.style.marginTop = "10px";
      this.hostEl.appendChild(hint);
    }
  }

}
