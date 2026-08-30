// src/renderer/views/HomeView.js

import { getCachedActiveModuleCatalog } from "../app/modules/moduleAccessState.js";

const COLORS = Object.freeze({
  invoice: "#1769d2",
  protocol: "#37a447",
  restarbeiten: "#ef7d00",
  sigeko: "#7b3fb3",
  editor: "#d92d20",
  navy: "#0b2d53",
  text: "#172033",
  muted: "#667085",
  border: "#dfe5ec",
  canvas: "#f5f7fa",
});

const ICONS = Object.freeze({
  invoice: `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M13 6h18l7 7v29H13V6Z" fill="currentColor" opacity=".12"/>
      <path d="M13 6h18l7 7v29H13V6Z" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linejoin="round"/>
      <path d="M31 6v8h7" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linejoin="round"/>
      <text x="24" y="33" text-anchor="middle" font-size="19" font-family="Arial,sans-serif" font-weight="700" fill="currentColor">€</text>
    </svg>`,
  protocol: `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M12 7h24v34H12z" fill="currentColor" opacity=".10"/>
      <rect x="12" y="7" width="24" height="34" rx="3.5" fill="none" stroke="currentColor" stroke-width="2.7"/>
      <path d="M18 17h12M18 23h12M18 29h8" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/>
      <circle cx="18" cy="35" r="1.7" fill="currentColor"/>
      <path d="M22 35h8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
  restarbeiten: `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M12 8h24v32H12z" fill="currentColor" opacity=".10"/>
      <rect x="12" y="8" width="24" height="32" rx="3.5" fill="none" stroke="currentColor" stroke-width="2.7"/>
      <path d="m18 23 4 4 8-9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M17 34h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`,
  sigeko: `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M10 30c1-9 6-16 14-16s13 7 14 16" fill="currentColor" opacity=".11"/>
      <path d="M10 30c1-9 6-16 14-16s13 7 14 16" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/>
      <path d="M18 14v9M30 14v9M8 31h32M16 36h16" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/>
    </svg>`,
  editor: `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="7" y="9" width="34" height="28" rx="4" fill="currentColor" opacity=".10"/>
      <rect x="7" y="9" width="34" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="2.7"/>
      <path d="M13 16h22M13 23h15M13 30h11" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/>
      <path d="m28 29 8 8" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/>
    </svg>`,
  project: `
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5h7l2 2h9v10.5H3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  firm: `
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V6h10v14M14 10h6v10M7 9h1M10 9h1M7 13h1M10 13h1M7 17h1M10 17h1M17 13h1M17 17h1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  settings: `
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8 3.5-2.1-.8-.5-1.2.9-2-2.3-2.3-2 .9-1.2-.5L12 4H9l-.8 2.1-1.2.5-2-.9L2.7 8l.9 2-.5 1.2L1 12v3l2.1.8.5 1.2-.9 2L5 21.3l2-.9 1.2.5L9 23h3l.8-2.1 1.2-.5 2 .9 2.3-2.3-.9-2 .5-1.2L20 15v-3Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  shield: `
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v5c0 5-3.2 8.4-8 10-4.8-1.6-8-5-8-10V6l8-3Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m8.5 12 2.2 2.2 4.8-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
});

function styles(el, values) {
  Object.assign(el.style, values || {});
  return el;
}

function svgIcon(name, size = 24) {
  const wrap = document.createElement("span");
  wrap.innerHTML = ICONS[name] || ICONS.protocol;
  const svg = wrap.querySelector("svg");
  if (svg) {
    svg.style.width = `${size}px`;
    svg.style.height = `${size}px`;
    svg.style.display = "block";
  }
  return wrap;
}

export default class HomeView {
  constructor({ router } = {}) {
    this.router = router || null;
    this.moduleCatalog = [];
    this.devBuild = false;
    this.lastProjectTileEl = null;
    this.lastProjectSubEl = null;
    this.lastProjectId = null;
    this.licenseHintEl = null;
    this.versionEl = null;
  }

  async _isDevBuild() {
    const api = window.bbmDb || {};
    if (typeof api.appGetBuildChannel !== "function") return false;
    try {
      const res = await api.appGetBuildChannel();
      return res?.ok === true && String(res?.channel || "").trim().toUpperCase() === "DEV";
    } catch (_e) {
      return false;
    }
  }

  _readLastProjectId() {
    try {
      return String(window.localStorage?.getItem?.("bbm.lastProjectId") || "").trim() || null;
    } catch (_e) {
      return null;
    }
  }

  _projectLabel(p) {
    if (!p) return "";
    const numberRaw = p.project_number ?? p.projectNumber ?? "";
    const number = String(numberRaw || "").trim();
    const short = String(p.short || "").trim();
    const name = String(p.name || "").trim();
    const base = short || name || "(ohne Name)";
    if (number && base) return `${number} - ${base}`;
    return number || base;
  }

  _setLastProjectTileState({ text, disabled, projectId } = {}) {
    this.lastProjectId = projectId || null;
    if (this.lastProjectSubEl) {
      this.lastProjectSubEl.textContent = text || "";
    }
    if (this.lastProjectTileEl) {
      const isDisabled = !!disabled;
      this.lastProjectTileEl.disabled = isDisabled;
      this.lastProjectTileEl.dataset.disabled = isDisabled ? "1" : "0";
      this.lastProjectTileEl.style.opacity = isDisabled ? "0.65" : "1";
      this.lastProjectTileEl.style.cursor = isDisabled ? "default" : "pointer";
      this.lastProjectTileEl.tabIndex = isDisabled ? -1 : 0;
    }
  }

  async _loadLastProjectTile() {
    if (!this.lastProjectTileEl || !this.lastProjectSubEl) return;

    const lastId = this._readLastProjectId();
    if (!lastId) {
      this._setLastProjectTileState({
        text: "Kein letztes Projekt",
        disabled: true,
        projectId: null,
      });
      return;
    }

    const api = window.bbmDb || {};
    if (typeof api.projectsList !== "function") {
      this._setLastProjectTileState({
        text: "Projektliste nicht verfügbar",
        disabled: true,
        projectId: null,
      });
      return;
    }

    try {
      const res = await api.projectsList();
      if (!res?.ok) {
        this._setLastProjectTileState({
          text: "Projektliste konnte nicht geladen werden",
          disabled: true,
          projectId: null,
        });
        return;
      }
      const list = Array.isArray(res.list) ? res.list : [];
      const project = list.find((p) => String(p?.id ?? "") === String(lastId)) || null;
      if (!project || !project.id) {
        this._setLastProjectTileState({
          text: "Zuletzt geöffnetes Projekt nicht gefunden",
          disabled: true,
          projectId: null,
        });
        return;
      }

      this._setLastProjectTileState({
        text: this._projectLabel(project),
        disabled: false,
        projectId: project.id,
      });
    } catch (_e) {
      this._setLastProjectTileState({
        text: "Projektliste konnte nicht geladen werden",
        disabled: true,
        projectId: null,
      });
    }
  }

  async _openLastProject() {
    if (!this.lastProjectId) return;

    await this.router?.ensureActiveModuleAccess?.({ force: true });
    await this.router?.showProjects?.();
    const view = this.router?.currentView || null;
    if (!view || typeof view.openProjectById !== "function") return;

    const ok = await view.openProjectById(this.lastProjectId);
    if (!ok) {
      await this._loadLastProjectTile();
    }
  }

  _underConstruction() {
    window.alert?.("under construktion");
  }

  async _openModule(entry) {
    if (entry?.placeholder === true) {
      this._underConstruction();
      return;
    }

    const globalNavigation = Array.isArray(entry?.navigation?.global)
      ? entry.navigation.global[0]
      : entry?.navigation?.global || null;
    const globalNavigationKey = String(globalNavigation?.key || "").trim();
    const moduleId = String(entry?.moduleId || "").trim();
    if (globalNavigationKey && moduleId && typeof this.router?.openGlobalModule === "function") {
      const opened = await this.router.openGlobalModule(moduleId, {
        navigationKey: globalNavigationKey,
        source: "home",
      });
      if (opened) return;
    }

    const mode = String(entry?.presentation?.start?.mode || "project").trim().toLowerCase();
    if (mode === "project") {
      await this.router?.ensureActiveModuleAccess?.({ force: true });
      await this.router?.showProjects?.({ moduleContext: moduleId, source: "home" });
      return;
    }

    this._underConstruction();
  }

  _presentation(entry) {
    const moduleId = String(entry?.moduleId || "").toLowerCase();
    const p = entry?.presentation || {};
    const presets = {
      protokoll: {
        color: COLORS.protocol,
        icon: "protocol",
        description: "Baustellenprotokolle erstellen und verwalten.",
      },
      restarbeiten: {
        color: COLORS.restarbeiten,
        icon: "restarbeiten",
        description: "Restarbeiten erfassen, verfolgen und abschließen.",
      },
      rechnung: {
        color: COLORS.invoice,
        icon: "invoice",
        description: "Angebote, Aufträge und Rechnungen erstellen und verwalten.",
      },
      sigeko: {
        color: COLORS.sigeko,
        icon: "sigeko",
        description: "SiGeKo-Projekte, Berichte und Dokumentation.",
      },
    };
    const fallback = presets[moduleId] || {};
    return {
      color: String(p.color || fallback.color || "#2563eb"),
      icon: String(p.icon || fallback.icon || "protocol"),
      description: String(p.description || fallback.description || "Arbeitsbereich öffnen."),
      label: String(entry?.moduleLabel || entry?.moduleId || "Modul"),
      startMode: String(p.start?.mode || "project"),
    };
  }

  _createModuleCard(entry) {
    const p = this._presentation(entry);
    const card = styles(document.createElement("article"), {
      border: `1px solid ${COLORS.border}`,
      borderRadius: "12px",
      background: "#ffffff",
      minHeight: "286px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      padding: "22px 18px 16px",
      boxSizing: "border-box",
      boxShadow: "0 3px 10px rgba(15,23,42,.045)",
      transition: "transform .14s ease, box-shadow .14s ease, border-color .14s ease",
    });
    card.setAttribute("data-bbm-home-module", String(entry?.moduleId || ""));

    const iconBox = styles(document.createElement("div"), {
      width: "58px",
      height: "58px",
      borderRadius: "10px",
      display: "grid",
      placeItems: "center",
      color: "#ffffff",
      background: p.color,
      boxShadow: `0 8px 18px ${p.color}2b`,
      marginBottom: "14px",
    });
    iconBox.append(svgIcon(p.icon, 38));

    const title = styles(document.createElement("div"), {
      fontSize: "16px",
      fontWeight: "800",
      color: COLORS.text,
      marginBottom: "10px",
    });
    title.textContent = p.label;

    const desc = styles(document.createElement("div"), {
      maxWidth: "165px",
      minHeight: "58px",
      fontSize: "11.5px",
      lineHeight: "1.48",
      color: COLORS.muted,
      marginBottom: "16px",
    });
    desc.textContent = p.description;

    const open = styles(document.createElement("button"), {
      width: "88px",
      height: "30px",
      border: "0",
      borderRadius: "4px",
      background: p.color,
      color: "#fff",
      fontSize: "11px",
      fontWeight: "750",
      cursor: "pointer",
      boxShadow: `0 3px 8px ${p.color}25`,
    });
    open.type = "button";
    open.textContent = "Öffnen";
    open.addEventListener("click", async () => this._openModule(entry));

    const quick = styles(document.createElement("button"), {
      border: "0",
      background: "transparent",
      color: p.color,
      fontSize: "10px",
      fontWeight: "700",
      padding: "10px 3px 0",
      cursor: "pointer",
    });
    quick.type = "button";
    quick.textContent = entry?.placeholder === true ? "under construktion" : "Schnellstart →";
    quick.addEventListener("click", async () => this._openModule(entry));

    card.append(iconBox, title, desc, open, quick);
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-2px)";
      card.style.boxShadow = "0 10px 24px rgba(15,23,42,.09)";
      card.style.borderColor = `${p.color}55`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
      card.style.boxShadow = "0 3px 10px rgba(15,23,42,.045)";
      card.style.borderColor = COLORS.border;
    });
    return card;
  }

  _createEditorCard() {
    const entry = {
      moduleId: "dev-ui-editor",
      moduleLabel: "UI-Editor",
      presentation: {
        color: COLORS.editor,
        icon: "editor",
        description: "Entwicklungswerkzeug für die aktuell geladenen BBM-Oberflächen.",
        start: { mode: "dev" },
      },
    };
    const card = this._createModuleCard(entry);
    const buttons = card.querySelectorAll("button");
    buttons.forEach((button) => {
      const replacement = button.cloneNode(true);
      button.replaceWith(replacement);
      replacement.addEventListener("click", () => this._openEditorChooser());
    });
    return card;
  }

  _openEditorChooser() {
    document.querySelector('[data-bbm-editor-start-chooser="true"]')?.remove?.();

    const overlay = styles(document.createElement("div"), {
      position: "fixed",
      inset: "0",
      zIndex: "12000",
      background: "rgba(15,23,42,.32)",
      display: "grid",
      placeItems: "center",
      padding: "20px",
    });
    overlay.setAttribute("data-bbm-editor-start-chooser", "true");

    const panel = styles(document.createElement("div"), {
      width: "min(470px, 92vw)",
      borderRadius: "12px",
      background: "#fff",
      boxShadow: "0 24px 60px rgba(15,23,42,.24)",
      padding: "20px",
    });

    const title = styles(document.createElement("h3"), {
      margin: "0 0 6px",
      color: COLORS.text,
      fontSize: "17px",
    });
    title.textContent = "UI-Editor – Zielbereich wählen";

    const hint = styles(document.createElement("div"), {
      color: COLORS.muted,
      fontSize: "12px",
      lineHeight: "1.45",
      marginBottom: "14px",
    });
    hint.textContent = "BBM lädt zuerst den Zielbereich. Der Editor wird nicht ohne aktiven Bereich gestartet.";

    const list = styles(document.createElement("div"), {
      display: "grid",
      gap: "8px",
    });

    for (const entry of this.moduleCatalog) {
      const p = this._presentation(entry);
      const btn = styles(document.createElement("button"), {
        border: "1px solid #dce3eb",
        borderRadius: "8px",
        background: "#f8fafc",
        minHeight: "40px",
        padding: "8px 10px",
        textAlign: "left",
        color: COLORS.text,
        cursor: "pointer",
        fontWeight: "700",
      });
      btn.type = "button";
      btn.textContent = p.label;
      btn.addEventListener("click", async () => {
        overlay.remove();
        await this._openModule(entry);
      });
      list.append(btn);
    }

    const close = styles(document.createElement("button"), {
      border: "0",
      background: "transparent",
      color: COLORS.muted,
      float: "right",
      marginTop: "12px",
      cursor: "pointer",
      fontWeight: "700",
    });
    close.type = "button";
    close.textContent = "Abbrechen";
    close.addEventListener("click", () => overlay.remove());

    panel.append(title, hint, list, close);
    overlay.append(panel);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.remove();
    });
    document.body.append(overlay);
  }

  _createInfoPanel(titleText) {
    const panel = styles(document.createElement("section"), {
      border: `1px solid ${COLORS.border}`,
      borderRadius: "10px",
      background: "#fff",
      minHeight: "162px",
      padding: "14px 16px",
      boxSizing: "border-box",
    });
    const title = styles(document.createElement("div"), {
      fontSize: "12px",
      fontWeight: "800",
      color: COLORS.text,
      marginBottom: "10px",
    });
    title.textContent = titleText;
    panel.append(title);
    return panel;
  }

  _createRow({ icon, label, meta, badge, badgeColor = COLORS.protocol, onClick }) {
    const row = styles(document.createElement(onClick ? "button" : "div"), {
      width: "100%",
      minHeight: "31px",
      border: "0",
      borderBottom: "1px solid #edf0f4",
      background: "transparent",
      padding: "6px 0",
      display: "grid",
      gridTemplateColumns: "20px minmax(0,1fr) auto auto",
      alignItems: "center",
      gap: "7px",
      textAlign: "left",
      color: COLORS.text,
      cursor: onClick ? "pointer" : "default",
      fontSize: "10.5px",
    });
    if (onClick) row.type = "button";

    const iconWrap = styles(document.createElement("span"), { color: badgeColor });
    iconWrap.append(svgIcon(icon || "project", 15));
    const text = document.createElement("span");
    text.setAttribute("data-bbm-home-row-label", "true");
    text.textContent = label;
    text.style.overflow = "hidden";
    text.style.textOverflow = "ellipsis";
    text.style.whiteSpace = "nowrap";

    const badgeEl = document.createElement("span");
    if (badge) {
      badgeEl.textContent = badge;
      Object.assign(badgeEl.style, {
        borderRadius: "5px",
        padding: "2px 5px",
        background: `${badgeColor}18`,
        color: badgeColor,
        fontSize: "9px",
        fontWeight: "700",
      });
    }

    const metaEl = styles(document.createElement("span"), {
      color: "#98a2b3",
      fontSize: "9.5px",
      whiteSpace: "nowrap",
    });
    metaEl.textContent = meta || "";

    row.append(iconWrap, text, badgeEl, metaEl);
    if (onClick) row.addEventListener("click", onClick);
    return row;
  }

  async _newProject() {
    await this.router?.showProjects?.();
    const view = this.router?.currentView || null;
    if (typeof view?.openCreateProject === "function") await view.openCreateProject();
  }

  async _newFirm() {
    await this.router?.showFirms?.();
    const view = this.router?.currentView || null;
    if (view?.btnNewFirm?.click) view.btnNewFirm.click();
  }

  render() {
    this.moduleCatalog = Array.from(getCachedActiveModuleCatalog() || []);

    const root = styles(document.createElement("div"), {
      minHeight: "100%",
      background: COLORS.canvas,
      padding: "22px clamp(18px, 2.5vw, 34px) 20px",
      boxSizing: "border-box",
      overflow: "auto",
      fontFamily: "var(--bbm-font-ui, system-ui, sans-serif)",
    });
    root.setAttribute("data-bbm-home-dashboard", "true");

    const content = styles(document.createElement("div"), {
      width: "min(1120px, 100%)",
      margin: "0 auto",
    });

    const headline = styles(document.createElement("div"), {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: "16px",
      marginBottom: "18px",
    });
    const left = document.createElement("div");
    const h1 = styles(document.createElement("h1"), {
      margin: "0",
      fontSize: "24px",
      lineHeight: "1.1",
      color: COLORS.text,
      letterSpacing: "-.35px",
    });
    h1.textContent = "Willkommen bei BBM";
    const sub = styles(document.createElement("div"), {
      marginTop: "5px",
      fontSize: "11.5px",
      color: COLORS.muted,
    });
    sub.textContent = "Wählen Sie einen Bereich, um zu starten.";
    left.append(h1, sub);

    const license = styles(document.createElement("div"), {
      color: "#7c8798",
      fontSize: "10.5px",
      fontWeight: "650",
    });
    license.textContent = `${this.moduleCatalog.length} aktive${this.moduleCatalog.length === 1 ? "s Modul" : " Module"}`;
    headline.append(left, license);

    const moduleGrid = styles(document.createElement("div"), {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
      gap: "14px",
      alignItems: "stretch",
    });
    moduleGrid.setAttribute("data-bbm-home-module-grid", "true");

    for (const entry of this.moduleCatalog) moduleGrid.append(this._createModuleCard(entry));

    const devExtraHost = styles(document.createElement("div"), { display: "contents" });
    devExtraHost.setAttribute("data-bbm-home-dev-extra", "true");
    moduleGrid.append(devExtraHost);

    const lower = styles(document.createElement("div"), {
      display: "grid",
      gridTemplateColumns: "1.45fr .9fr .65fr",
      gap: "14px",
      marginTop: "16px",
    });

    const recent = this._createInfoPanel("Zuletzt verwendet");
    const lastProjectRow = this._createRow({
      icon: "project",
      label: "Zuletzt geöffnetes Projekt wird geladen …",
      meta: "zuletzt",
      badge: "Projekt",
      badgeColor: COLORS.protocol,
      onClick: async () => this._openLastProject(),
    });
    this.lastProjectTileEl = lastProjectRow;
    this.lastProjectSubEl = lastProjectRow.querySelector('[data-bbm-home-row-label="true"]');
    this.lastProjectId = null;
    recent.append(lastProjectRow);
    if (this.moduleCatalog.some((x) => String(x?.moduleId || "") === "protokoll")) {
      recent.append(this._createRow({ icon: "project", label: "Protokolle", badge: "Protokoll", badgeColor: COLORS.protocol, meta: "Arbeitsbereich" }));
    }
    if (this.moduleCatalog.some((x) => String(x?.moduleId || "") === "restarbeiten")) {
      recent.append(this._createRow({ icon: "project", label: "Restarbeiten", badge: "Restarbeiten", badgeColor: COLORS.restarbeiten, meta: "Arbeitsbereich" }));
    }

    const quick = this._createInfoPanel("Schnellaktionen");
    quick.append(
      this._createRow({ icon: "project", label: "Neues Projekt anlegen", meta: "→", onClick: async () => this._newProject() }),
      this._createRow({ icon: "firm", label: "Neue Firma / Kunde anlegen", meta: "→", onClick: async () => this._newFirm() }),
      this._createRow({ icon: "settings", label: "Einstellungen öffnen", meta: "→", onClick: async () => this.router?.showSettings?.() })
    );

    const hints = this._createInfoPanel("Hinweise");
    const status = styles(document.createElement("div"), {
      display: "grid",
      gridTemplateColumns: "28px 1fr",
      gap: "8px",
      alignItems: "start",
      color: COLORS.text,
      fontSize: "10.5px",
      lineHeight: "1.45",
    });
    const shield = styles(document.createElement("span"), {
      width: "26px",
      height: "26px",
      display: "grid",
      placeItems: "center",
      borderRadius: "50%",
      background: "#eaf7ee",
      color: COLORS.protocol,
    });
    shield.append(svgIcon("shield", 16));
    this.licenseHintEl = document.createElement("div");
    this.licenseHintEl.textContent = "Lizenzstatus wird geprüft …";
    status.append(shield, this.licenseHintEl);

    this.versionEl = styles(document.createElement("div"), {
      marginTop: "12px",
      color: "#98a2b3",
      fontSize: "9.5px",
    });
    this.versionEl.textContent = "BBM";
    hints.append(status, this.versionEl);

    lower.append(recent, quick, hints);
    content.append(headline, moduleGrid, lower);
    root.append(content);

    Promise.resolve().then(async () => {
      this.devBuild = await this._isDevBuild();
      if (!this.devBuild || !devExtraHost.isConnected) return;

      const existingIds = new Set(this.moduleCatalog.map((x) => String(x?.moduleId || "").toLowerCase()));
      if (!existingIds.has("rechnung")) {
        devExtraHost.append(this._createModuleCard({
          moduleId: "rechnung",
          moduleLabel: "Rechnungen",
          placeholder: true,
          presentation: { color: COLORS.invoice, icon: "invoice", description: "Angebote, Aufträge und Rechnungen erstellen und verwalten.", start: { mode: "free" } },
        }));
      }
      if (!existingIds.has("sigeko")) {
        devExtraHost.append(this._createModuleCard({
          moduleId: "sigeko",
          moduleLabel: "SiGeKo",
          placeholder: true,
          presentation: { color: COLORS.sigeko, icon: "sigeko", description: "SiGeKo-Projekte, Berichte und Dokumentation.", start: { mode: "project" } },
        }));
      }
      devExtraHost.append(this._createEditorCard());
    });

    return root;
  }

  async load() {
    await this._loadLastProjectTile();
    try {
      const status = await window.bbmDb?.licenseGetStatus?.();
      if (this.licenseHintEl) {
        if (status?.valid === false) {
          this.licenseHintEl.textContent = "Lizenz derzeit nicht gültig.";
        } else if (status && typeof status === "object") {
          const modules = Array.isArray(status.modules) ? status.modules.length : this.moduleCatalog.length;
          this.licenseHintEl.textContent = `Lizenz aktiv · ${modules} Modul${modules === 1 ? "" : "e"} freigeschaltet.`;
        } else {
          this.licenseHintEl.textContent = "Lizenz aktiv.";
        }
      }
    } catch (_e) {
      if (this.licenseHintEl) this.licenseHintEl.textContent = "Lizenzstatus verfügbar.";
    }

    try {
      const res = await window.bbmDb?.appGetVersion?.();
      const version = String(res?.version || "").trim();
      if (this.versionEl) this.versionEl.textContent = version ? `BBM ${version}` : "BBM";
    } catch (_e) {
      // ignore
    }
  }
}
