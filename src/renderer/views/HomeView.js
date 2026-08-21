// src/renderer/views/HomeView.js

import { getCachedActiveModuleCatalog } from "../app/modules/moduleAccessState.js";

const DASHBOARD_ICON_SVGS = Object.freeze({
  protocol: `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="10" y="7" width="28" height="34" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M17 17h14M17 24h14M17 31h9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  restarbeiten: `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 7 42 39H6L24 7Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
      <path d="M24 18v10M24 34h.01" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  invoice: `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M13 6h18l6 6v30H13V6Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
      <path d="M31 6v8h7M18 21h14M18 28h14M18 35h9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  editor: `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="6" y="8" width="36" height="30" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M13 16h22M13 23h14M13 30h18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <path d="m31 30 8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  module: `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="7" y="7" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>
      <rect x="27" y="7" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>
      <rect x="7" y="27" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>
      <rect x="27" y="27" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>
    </svg>`,
});

function iconSvg(iconId) {
  return DASHBOARD_ICON_SVGS[String(iconId || "").trim()] || DASHBOARD_ICON_SVGS.module;
}

function setStyles(el, styles = {}) {
  Object.assign(el.style, styles);
  return el;
}

export default class HomeView {
  constructor({ router } = {}) {
    this.router = router || null;
    this.root = null;
    this.footerEl = null;
    this.devEditorEnabled = false;
    this.moduleCatalog = [];
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
      const raw = String(window.localStorage?.getItem?.("bbm.lastProjectId") || "").trim();
      return raw || null;
    } catch (_e) {
      return null;
    }
  }

  async _openLastProject() {
    const lastId = this._readLastProjectId();
    if (!lastId) {
      await this.router?.showProjects?.();
      return;
    }

    await this.router?.showProjects?.();
    const view = this.router?.currentView || null;
    if (!view || typeof view.openProjectById !== "function") return;
    await view.openProjectById(lastId);
  }

  async _openModule(entry) {
    const mode = String(entry?.presentation?.start?.mode || "project").trim().toLowerCase();

    if (mode === "project") {
      try {
        window.localStorage?.setItem?.("bbm.startTargetModuleId", String(entry?.moduleId || ""));
      } catch (_e) {
        // ignore
      }
      await this.router?.showProjects?.();
      return;
    }

    if (typeof this.router?.openStartModule === "function") {
      const opened = await this.router.openStartModule(entry?.moduleId, { source: "home" });
      if (opened) return;
    }

    alert(`${entry?.moduleLabel || "Dieses Modul"} ist für den direkten Start noch nicht angebunden.`);
  }

  _createModuleCard(entry) {
    const color = String(entry?.presentation?.color || "#2563eb");
    const title = String(entry?.moduleLabel || entry?.moduleId || "Modul");
    const description = String(entry?.presentation?.description || "Arbeitsbereich öffnen.");
    const startLabel = String(entry?.presentation?.start?.label || "Öffnen");
    const icon = String(entry?.presentation?.icon || "module");

    const card = setStyles(document.createElement("button"), {
      appearance: "none",
      border: "0",
      borderRadius: "18px",
      padding: "0",
      background: "#ffffff",
      boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
      overflow: "hidden",
      textAlign: "left",
      cursor: "pointer",
      minHeight: "230px",
      display: "flex",
      flexDirection: "column",
      transition: "transform 140ms ease, box-shadow 140ms ease",
    });
    card.type = "button";
    card.setAttribute("data-bbm-home-module", String(entry?.moduleId || ""));

    const colorBand = setStyles(document.createElement("div"), {
      height: "8px",
      background: color,
      width: "100%",
    });

    const body = setStyles(document.createElement("div"), {
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      flex: "1",
      width: "100%",
      boxSizing: "border-box",
    });

    const iconWrap = setStyles(document.createElement("div"), {
      width: "58px",
      height: "58px",
      borderRadius: "16px",
      display: "grid",
      placeItems: "center",
      background: `${color}18`,
      color,
    });
    iconWrap.innerHTML = iconSvg(icon);
    const svg = iconWrap.querySelector("svg");
    if (svg) {
      svg.style.width = "34px";
      svg.style.height = "34px";
    }

    const heading = setStyles(document.createElement("div"), {
      fontSize: "22px",
      fontWeight: "800",
      color: "#172033",
      letterSpacing: "-0.3px",
    });
    heading.textContent = title;

    const desc = setStyles(document.createElement("div"), {
      fontSize: "13px",
      lineHeight: "1.45",
      color: "#667085",
      flex: "1",
    });
    desc.textContent = description;

    const action = setStyles(document.createElement("div"), {
      fontSize: "12px",
      fontWeight: "750",
      color,
      display: "flex",
      alignItems: "center",
      gap: "6px",
    });
    action.textContent = `${startLabel}  →`;

    body.append(iconWrap, heading, desc, action);
    card.append(colorBand, body);

    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-2px)";
      card.style.boxShadow = "0 16px 38px rgba(15,23,42,0.13)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
      card.style.boxShadow = "0 10px 30px rgba(15,23,42,0.08)";
    });
    card.addEventListener("click", async () => this._openModule(entry));

    return card;
  }

  _createDevEditorCard() {
    const entry = Object.freeze({
      moduleId: "dev-ui-editor",
      moduleLabel: "UI-Editor",
      presentation: Object.freeze({
        color: "#dc2626",
        icon: "editor",
        description: "Entwicklungswerkzeug. Erst Zielbereich auswählen, dann Editor im geladenen Bereich öffnen.",
        start: Object.freeze({ label: "Zielbereich wählen" }),
      }),
    });

    const card = this._createModuleCard(entry);
    card.setAttribute("data-bbm-dev-editor-card", "true");
    card.onclick = null;
    card.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      this._openEditorChooser();
    }, true);
    return card;
  }

  _openEditorChooser() {
    const existing = document.querySelector('[data-bbm-editor-start-chooser="true"]');
    existing?.remove?.();

    const overlay = setStyles(document.createElement("div"), {
      position: "fixed",
      inset: "0",
      zIndex: "12000",
      background: "rgba(15,23,42,0.34)",
      display: "grid",
      placeItems: "center",
      padding: "24px",
    });
    overlay.setAttribute("data-bbm-editor-start-chooser", "true");

    const panel = setStyles(document.createElement("div"), {
      width: "min(520px, 92vw)",
      background: "#ffffff",
      borderRadius: "18px",
      boxShadow: "0 24px 70px rgba(15,23,42,0.28)",
      padding: "22px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
    });

    const title = setStyles(document.createElement("div"), {
      fontSize: "19px",
      fontWeight: "800",
      color: "#172033",
    });
    title.textContent = "UI-Editor – Zielbereich";

    const text = setStyles(document.createElement("div"), {
      color: "#667085",
      fontSize: "13px",
      lineHeight: "1.5",
    });
    text.textContent = "Der Editor wird nicht ohne Zielbereich gestartet. Wähle zuerst den Bereich; BBM führt dich in den passenden Arbeitskontext.";

    const list = setStyles(document.createElement("div"), {
      display: "grid",
      gap: "8px",
    });

    for (const entry of this.moduleCatalog) {
      const btn = setStyles(document.createElement("button"), {
        appearance: "none",
        border: "1px solid #d7dee8",
        borderRadius: "10px",
        background: "#f8fafc",
        color: "#172033",
        padding: "11px 12px",
        textAlign: "left",
        cursor: "pointer",
        fontWeight: "700",
      });
      btn.type = "button";
      btn.textContent = entry?.moduleLabel || entry?.moduleId || "Modul";
      btn.addEventListener("click", async () => {
        try {
          window.localStorage?.setItem?.("bbm.devEditorTargetModuleId", String(entry?.moduleId || ""));
        } catch (_e) {
          // ignore
        }
        overlay.remove();
        await this._openModule(entry);
      });
      list.append(btn);
    }

    const close = setStyles(document.createElement("button"), {
      alignSelf: "flex-end",
      appearance: "none",
      border: "0",
      background: "transparent",
      color: "#667085",
      cursor: "pointer",
      fontWeight: "700",
      padding: "8px 4px 0",
    });
    close.type = "button";
    close.textContent = "Abbrechen";
    close.addEventListener("click", () => overlay.remove());

    panel.append(title, text, list, close);
    overlay.append(panel);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.remove();
    });
    document.body.append(overlay);
  }

  _createQuickAction({ label, sub, onClick }) {
    const button = setStyles(document.createElement("button"), {
      appearance: "none",
      border: "1px solid #e3e8ef",
      borderRadius: "12px",
      background: "#ffffff",
      padding: "14px 16px",
      textAlign: "left",
      cursor: "pointer",
      minHeight: "72px",
    });
    button.type = "button";

    const title = setStyles(document.createElement("div"), {
      color: "#172033",
      fontWeight: "800",
      fontSize: "13px",
    });
    title.textContent = label;

    const description = setStyles(document.createElement("div"), {
      marginTop: "5px",
      color: "#7a8596",
      fontSize: "11.5px",
    });
    description.textContent = sub;

    button.append(title, description);
    button.addEventListener("click", async () => onClick?.());
    return button;
  }

  render() {
    this.moduleCatalog = Array.from(getCachedActiveModuleCatalog() || []);

    const root = setStyles(document.createElement("div"), {
      minHeight: "100%",
      boxSizing: "border-box",
      background: "#f4f6f9",
      padding: "30px clamp(22px, 4vw, 54px) 18px",
      overflow: "auto",
      color: "#172033",
    });
    root.setAttribute("data-bbm-home-dashboard", "true");

    const wrap = setStyles(document.createElement("div"), {
      width: "min(1180px, 100%)",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
    });

    const heading = setStyles(document.createElement("div"), {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: "18px",
      flexWrap: "wrap",
    });

    const headingText = document.createElement("div");
    const h1 = setStyles(document.createElement("h1"), {
      margin: "0",
      fontSize: "28px",
      lineHeight: "1.15",
      letterSpacing: "-0.5px",
    });
    h1.textContent = "Guten Tag";
    const sub = setStyles(document.createElement("div"), {
      marginTop: "7px",
      color: "#667085",
      fontSize: "13px",
    });
    sub.textContent = "Womit möchtest du heute arbeiten?";
    headingText.append(h1, sub);

    const moduleCount = setStyles(document.createElement("div"), {
      color: "#8a94a5",
      fontSize: "12px",
      fontWeight: "650",
    });
    moduleCount.textContent = `${this.moduleCatalog.length} aktive${this.moduleCatalog.length === 1 ? "s Modul" : " Module"}`;
    heading.append(headingText, moduleCount);

    const moduleGrid = setStyles(document.createElement("div"), {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
      gap: "18px",
    });

    for (const entry of this.moduleCatalog) {
      moduleGrid.append(this._createModuleCard(entry));
    }

    if (this.moduleCatalog.length === 0) {
      const empty = setStyles(document.createElement("div"), {
        gridColumn: "1 / -1",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        background: "#ffffff",
        padding: "28px",
        color: "#667085",
      });
      empty.textContent = "Für diese Installation ist derzeit kein Fachmodul freigeschaltet.";
      moduleGrid.append(empty);
    }

    const lowerGrid = setStyles(document.createElement("div"), {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.45fr) minmax(260px, .75fr)",
      gap: "18px",
    });

    const recentCard = setStyles(document.createElement("div"), {
      background: "#ffffff",
      borderRadius: "16px",
      border: "1px solid #e5e9f0",
      padding: "18px",
    });
    const recentTitle = setStyles(document.createElement("div"), {
      fontSize: "15px",
      fontWeight: "800",
      marginBottom: "12px",
    });
    recentTitle.textContent = "Zuletzt verwendet";
    const recentAction = this._createQuickAction({
      label: "Letztes Projekt öffnen",
      sub: this._readLastProjectId() ? "Zum zuletzt verwendeten Projekt zurückkehren." : "Projektübersicht öffnen.",
      onClick: async () => this._openLastProject(),
    });
    recentCard.append(recentTitle, recentAction);

    const quickCard = setStyles(document.createElement("div"), {
      background: "#ffffff",
      borderRadius: "16px",
      border: "1px solid #e5e9f0",
      padding: "18px",
    });
    const quickTitle = setStyles(document.createElement("div"), {
      fontSize: "15px",
      fontWeight: "800",
      marginBottom: "12px",
    });
    quickTitle.textContent = "Schnellzugriff";

    const quickGrid = setStyles(document.createElement("div"), {
      display: "grid",
      gap: "8px",
    });
    quickGrid.append(
      this._createQuickAction({ label: "Projekte", sub: "Projektübersicht öffnen", onClick: () => this.router?.showProjects?.() }),
      this._createQuickAction({ label: "Firmen / Kunden", sub: "Gemeinsame Stammdaten", onClick: () => this.router?.showFirms?.() }),
      this._createQuickAction({ label: "Einstellungen", sub: "BBM konfigurieren", onClick: () => this.router?.showSettings?.() })
    );
    quickCard.append(quickTitle, quickGrid);

    lowerGrid.append(recentCard, quickCard);

    const devSlot = setStyles(document.createElement("div"), {
      display: "none",
    });
    devSlot.setAttribute("data-bbm-dev-dashboard-slot", "true");

    const footerWrap = setStyles(document.createElement("div"), {
      marginTop: "6px",
      paddingTop: "12px",
      borderTop: "1px solid #e5e9f0",
      color: "#8a94a5",
      fontSize: "11px",
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
    });
    const credit = document.createElement("div");
    credit.textContent = "BBM · gemeinsame Module, Stammdaten und Dokumente";
    const footer = document.createElement("div");
    footer.textContent = `© ${new Date().getFullYear()} BBM`;
    this.footerEl = footer;
    footerWrap.append(credit, footer);

    wrap.append(heading, moduleGrid, devSlot, lowerGrid, footerWrap);
    root.append(wrap);
    this.root = root;
    return root;
  }

  async load() {
    this.devEditorEnabled = await this._isDevBuild();

    if (this.devEditorEnabled && this.root) {
      const slot = this.root.querySelector('[data-bbm-dev-dashboard-slot="true"]');
      if (slot) {
        slot.style.display = "block";

        const title = setStyles(document.createElement("div"), {
          fontSize: "12px",
          fontWeight: "800",
          color: "#9f1239",
          textTransform: "uppercase",
          letterSpacing: ".7px",
          marginBottom: "8px",
        });
        title.textContent = "Entwicklung";

        const grid = setStyles(document.createElement("div"), {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "18px",
        });
        grid.append(this._createDevEditorCard());
        slot.append(title, grid);
      }
    }

    try {
      const res = await window.bbmDb?.appGetVersion?.();
      const year = new Date().getFullYear();
      const version = res?.ok && res?.version ? ` v${res.version}` : "";
      if (this.footerEl) this.footerEl.textContent = `© ${year} BBM${version}`;
    } catch (_e) {
      // keep default footer
    }
  }
}
