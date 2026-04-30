import MainHeader from "../ui/MainHeader.js";
import { applyThemeForSettings } from "../theme/themes.js";

export default class CoreShell {
  constructor({
    router,
    version,
    readUseNewCompanyWorkflowFlag,
    writeUseNewCompanyWorkflowFlag,
  } = {}) {
    this.router = router || null;
    this.version = version || "";
    this.readUseNewCompanyWorkflowFlag =
      typeof readUseNewCompanyWorkflowFlag === "function"
        ? readUseNewCompanyWorkflowFlag
        : () => false;
    this.writeUseNewCompanyWorkflowFlag =
      typeof writeUseNewCompanyWorkflowFlag === "function"
        ? writeUseNewCompanyWorkflowFlag
        : () => {};
  }

  start({ uiMode = "old" } = {}) {
    if (uiMode === "new") {
      this._initUiNew();
      return;
    }

    this._initUiOld();
  }

  _injectBaseStyles() {
    const existing = document.querySelector('style[data-bbm-core-shell-styles="true"]');
    if (existing) return;

    const themeStyle = document.createElement("style");
    themeStyle.setAttribute("data-bbm-core-shell-styles", "true");
    themeStyle.textContent = `
    :root {
      --header-bg: #D6ECFF;
      --header-text: #0F172A;
      --sidebar-bg: #0F172A;
      --sidebar-hover-bg: #172554;
      --sidebar-active-bg: #1D4ED8;
      --sidebar-active-indicator: #93C5FD;
      --sidebar-text: #E2E8F0;
      --main-bg: #F8FAFC;
      --card-bg: #FFFFFF;
      --card-border: #E2E8F0;
      --text-main: #0F172A;
      --btn-radius: 8px;
      --btn-outline-color: #1565c0;
      --btn-outline-bg: #ffffff;
      --btn-outline-hover-bg: #f1f6ff;
      --btn-primary-bg: #1976d2;
      --btn-primary-text: #ffffff;
      --btn-danger-bg: #c62828;
      --btn-danger-text: #ffffff;
      --btn-warn-bg: #f59e0b;
      --btn-warn-text: #ffffff;
      --btn-focus-ring: rgba(25, 118, 210, 0.35);
    }
    button {
      padding: 6px 10px;
      border-radius: var(--btn-radius);
      border: 1px solid var(--btn-outline-color);
      background: var(--btn-outline-bg);
      color: var(--btn-outline-color);
      font-weight: 600;
      min-height: 30px;
      cursor: pointer;
      transition: background 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
    }
    button:hover:not(:disabled) {
      background: var(--btn-outline-hover-bg);
      box-shadow: 0 1px 0 rgba(0,0,0,0.08);
    }
    button:active:not(:disabled) {
      box-shadow: inset 0 1px 0 rgba(0,0,0,0.12);
    }
    button:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px var(--btn-focus-ring);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    button[data-variant="primary"] {
      background: var(--btn-primary-bg);
      border-color: var(--btn-primary-bg);
      color: var(--btn-primary-text);
    }
    button[data-variant="primary"]:hover:not(:disabled) {
      filter: brightness(0.95);
    }
    button[data-variant="danger"] {
      background: var(--btn-danger-bg);
      border-color: var(--btn-danger-bg);
      color: var(--btn-danger-text);
    }
    button[data-variant="danger"]:hover:not(:disabled) {
      filter: brightness(0.95);
    }
    button[data-variant="warn"] {
      background: var(--btn-warn-bg);
      border-color: var(--btn-warn-bg);
      color: var(--btn-warn-text);
    }
    button[data-variant="warn"]:hover:not(:disabled) {
      filter: brightness(0.95);
    }
  `;
    document.head.appendChild(themeStyle);
  }

  _prepareBody() {
    document.body.style.margin = "0";
    document.body.style.height = "100vh";
    document.body.style.background = "var(--main-bg)";
    document.body.style.color = "var(--text-main)";
  }

  _getHost() {
    const host = document.getElementById("content");
    if (!host) {
      throw new Error("Root-Container #content nicht gefunden");
    }
    return host;
  }

  _attachGlobalKeyHandling() {
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== "Escape") return;

      const overlays = Array.from(document.querySelectorAll("div")).filter((el) => {
        if (!el || !el.style) return false;
        if (el.style.display === "none") return false;
        if (el.style.position !== "fixed") return false;
        const z = Number(el.style.zIndex || 0);
        return Number.isFinite(z) && z >= 9999;
      });

      if (!overlays.length) return;
      const top = overlays[overlays.length - 1];
      const buttons = Array.from(top.querySelectorAll("button"));
      if (!buttons.length) return;

      const isEscape = e.key === "Escape";
      const preferred = isEscape
        ? ["abbrechen", "schließen", "close", "cancel", "×", "✕"]
        : ["speichern", "löschen", "ok", "übernehmen", "zuordnen"];

      const findBtn = () => {
        for (const label of preferred) {
          const btn = buttons.find((b) =>
            (b.textContent || "").toLowerCase().includes(label)
          );
          if (btn) return btn;
        }
        return null;
      };

      const btn = findBtn();
      if (!btn || btn.disabled) return;

      e.preventDefault();
      btn.click();
    });
  }

  _initUiOld() {
    this._injectBaseStyles();
    this._prepareBody();

    const host = this._getHost();
    this._attachGlobalKeyHandling();

    host.innerHTML = "";
    host.style.height = "100vh";
    host.style.display = "flex";
    host.style.flexDirection = "column";
    host.style.alignItems = "stretch";
    host.style.boxSizing = "border-box";
    host.style.fontFamily = "Calibri, Arial, sans-serif";
    host.style.color = "var(--text-main)";
    host.style.background = "var(--main-bg)";

    const SIDEBAR_WIDTH = 190;
    const PAD = 12;

    const bodyRow = document.createElement("div");
    bodyRow.style.flex = "1";
    bodyRow.style.display = "flex";
    bodyRow.style.alignItems = "stretch";
    bodyRow.style.boxSizing = "border-box";
    bodyRow.style.overflow = "hidden";

    const sidebar = document.createElement("div");
    sidebar.setAttribute("data-bbm-sidebar", "true");
    sidebar.style.width = `${SIDEBAR_WIDTH}px`;
    sidebar.style.minWidth = `${SIDEBAR_WIDTH}px`;
    sidebar.style.maxWidth = `${SIDEBAR_WIDTH}px`;
    sidebar.style.flex = `0 0 ${SIDEBAR_WIDTH}px`;
    sidebar.style.borderRight = "1px solid #1e293b";
    sidebar.style.padding = `${PAD}px`;
    sidebar.style.boxSizing = "border-box";
    sidebar.style.display = "flex";
    sidebar.style.flexDirection = "column";
    sidebar.style.overflowY = "auto";
    sidebar.style.overflowX = "visible";
    sidebar.style.background = "var(--sidebar-bg)";
    sidebar.style.color = "var(--sidebar-text)";

    const content = document.createElement("div");
    content.style.flex = "1";
    content.style.padding = `${PAD}px`;
    content.style.boxSizing = "border-box";
    content.style.overflow = "auto";
    content.style.background = "var(--main-bg)";
    content.style.color = "var(--text-main)";

    router.contentRoot = content;
    router.onSectionChange = (section) => setActive(section);

    bodyRow.append(sidebar, content);

    const topBox = document.createElement("div");
    topBox.style.width = "100%";
    topBox.style.boxSizing = "border-box";
    topBox.style.padding = "0";
    topBox.style.display = "flex";
    topBox.style.flexDirection = "column";
    topBox.style.gap = "8px";

    const bottomBox = document.createElement("div");
    bottomBox.style.width = "100%";
    bottomBox.style.boxSizing = "border-box";
    bottomBox.style.padding = "0";
    bottomBox.style.marginTop = "auto";
    bottomBox.style.display = "flex";
    bottomBox.style.flexDirection = "column";
    bottomBox.style.gap = "8px";

    sidebar.append(topBox, bottomBox);

    const buttonsByKey = new Map();

    const setActive = (key) => {
      for (const [k, btn] of buttonsByKey.entries()) {
        const active = k === key;
        btn.dataset.active = active ? "true" : "false";
        btn.style.background = active ? "var(--sidebar-active-bg)" : "transparent";
        btn.style.border = active
          ? "1px solid var(--sidebar-active-bg)"
          : "1px solid rgba(226, 232, 240, 0.28)";
        btn.style.boxShadow = "none";
        btn.style.color = "var(--sidebar-text)";
        btn.style.fontWeight = active ? "700" : "400";
      }
    };

    const router = this.router;
    const header = new MainHeader({
      router,
      version: this.version,
      sidebarWidth: SIDEBAR_WIDTH,
      padding: PAD,
    });
    const headerEl = header.render();

    router.openOutputMail = async () => {
      await header._openMailFileFlow();
    };
    router.openOutputPrint = async () => {
      await header._openPrintFileFlow();
    };
    router.openClosedProtocolSelector = async ({ mode } = {}) => {
      await header._openClosedProtocolSelectorFlow(mode || "view");
    };

    const featureToggleWrap = document.createElement("div");
    featureToggleWrap.style.gridColumn = "3";
    featureToggleWrap.style.gridRow = "3";
    featureToggleWrap.style.justifySelf = "end";
    featureToggleWrap.style.alignSelf = "end";
    featureToggleWrap.style.display = "inline-flex";
    featureToggleWrap.style.alignItems = "center";
    featureToggleWrap.style.gap = "8px";

    const featureToggleLabel = document.createElement("span");
    featureToggleLabel.textContent = "Beta: Firmen/Mitarbeiter v2";
    featureToggleLabel.style.fontSize = "12px";
    featureToggleLabel.style.opacity = "0.85";
    featureToggleLabel.style.userSelect = "none";

    const featureToggleBtn = document.createElement("button");
    featureToggleBtn.type = "button";
    featureToggleBtn.style.padding = "4px 8px";
    featureToggleBtn.style.minHeight = "24px";
    featureToggleBtn.style.borderRadius = "999px";
    featureToggleBtn.style.fontSize = "11px";
    featureToggleBtn.style.fontWeight = "700";
    featureToggleBtn.style.lineHeight = "1";
    featureToggleBtn.style.cursor = "pointer";

    const applyFeatureToggleUi = () => {
      const on = !!router?.featureFlags?.useNewCompanyWorkflow;
      featureToggleBtn.textContent = on ? "AN" : "AUS";
      featureToggleBtn.style.border = on ? "1px solid #7aa7ff" : "1px solid #ddd";
      featureToggleBtn.style.background = on ? "#eaf3ff" : "#fff";
      featureToggleBtn.style.color = on ? "#0b4db4" : "#555";
    };

    featureToggleBtn.onclick = () => {
      const next = !router?.featureFlags?.useNewCompanyWorkflow;
      if (router?.featureFlags) {
        router.featureFlags.useNewCompanyWorkflow = next;
      }
      this.writeUseNewCompanyWorkflowFlag(next);
      applyFeatureToggleUi();
      try {
        window.dispatchEvent(
          new CustomEvent("bbm:sticky-notice", {
            detail: {
              message: `Beta Firmen/Mitarbeiter v2: ${
                next ? "AN" : "AUS"
              } (wirksam ab naechstem Oeffnen der entsprechenden Ansicht)`,
            },
          })
        );
      } catch (_e) {
        // ignore
      }
    };

    applyFeatureToggleUi();
    featureToggleWrap.append(featureToggleLabel, featureToggleBtn);
    featureToggleWrap.style.display = "none";

    const applyThemeFromRouterContext = () => {
      applyThemeForSettings(router?.context?.settings || {});
    };

    router.refreshHeader = () => {
      applyThemeFromRouterContext();
      const isTopsView = !!router?.context?.ui?.isTopsView;
      headerEl.style.display = isTopsView ? "none" : "";
      header.refresh();
    };
    window.addEventListener("bbm:header-refresh", () => {
      applyThemeFromRouterContext();
      header.refresh();
    });
    window.addEventListener("bbm:theme-refresh", () => {
      applyThemeFromRouterContext();
      header.refresh();
    });

    host.append(headerEl, bodyRow);

    window.addEventListener("bbm:sticky-notice", (e) => {
      const msg = e?.detail?.message || "";
      router.context = router.context || {};
      router.context.ui = router.context.ui || {};
      router.context.ui.stickyNotice = msg;
      header.refresh();
    });

    const runNavSafe = (fn) => {
      return async () => {
        try {
          await fn();
        } catch (e) {
          console.error("[nav] failed:", e);
          alert(e?.message || String(e) || "Navigation fehlgeschlagen");
        } finally {
          header.refresh();
          updateContextButtons();
        }
      };
    };

    const mkNavBtn = (key, label, onClick) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.style.display = "flex";
      b.style.alignItems = "center";
      b.style.width = "100%";
      b.style.boxSizing = "border-box";
      b.style.padding = "10px 10px";
      b.style.borderRadius = "8px";
      b.style.cursor = "pointer";
      b.style.background = "transparent";
      b.style.border = "1px solid rgba(226, 232, 240, 0.28)";
      b.style.boxShadow = "none";
      b.style.appearance = "none";
      b.style.color = "var(--sidebar-text)";
      b.style.textAlign = "left";
      b.style.transition = "background 120ms ease, border-color 120ms ease";
      b.onmouseenter = () => {
        if (b.disabled || b.dataset.active === "true") return;
        b.style.background = "var(--sidebar-hover-bg)";
      };
      b.onmouseleave = () => {
        if (b.disabled || b.dataset.active === "true") return;
        b.style.background = "transparent";
      };
      b.onclick = runNavSafe(onClick);

      buttonsByKey.set(key, b);
      return b;
    };

    const mkActionBtn = (label, onClick) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.style.display = "flex";
      b.style.alignItems = "center";
      b.style.width = "100%";
      b.style.boxSizing = "border-box";
      b.style.padding = "10px 10px";
      b.style.borderRadius = "8px";
      b.style.cursor = "pointer";
      b.style.background = "transparent";
      b.style.border = "1px solid rgba(226, 232, 240, 0.28)";
      b.style.boxShadow = "none";
      b.style.appearance = "none";
      b.style.color = "var(--sidebar-text)";
      b.style.textAlign = "left";
      b.style.transition = "background 120ms ease, border-color 120ms ease";
      b.onmouseenter = () => {
        if (b.disabled) return;
        b.style.background = "var(--sidebar-hover-bg)";
      };
      b.onmouseleave = () => {
        if (b.disabled) return;
        b.style.background = "transparent";
      };
      b.onclick = runNavSafe(onClick);
      return b;
    };

    const setBtnEnabled = (btn, enabled, titleWhenDisabled) => {
      if (!btn) return;
      const isEnabled = !!enabled;
      btn.disabled = !isEnabled;
      btn.style.opacity = isEnabled ? "1" : "0.55";
      btn.style.cursor = isEnabled ? "pointer" : "not-allowed";
      btn.title = isEnabled ? "" : (titleWhenDisabled || "");
    };

    const appendButtonGroup = (container, buttons) => {
      if (!container || !Array.isArray(buttons) || buttons.length === 0) return;
      container.append(...buttons.filter(Boolean));
    };

    const createScreenRouteButton = ({ key, label, onClick, getPayload, onMissingContext } = {}) =>
      mkNavBtn(key, label, async () => {
        const payload = typeof getPayload === "function" ? (getPayload() || {}) : {};
        if (payload.missingContext) {
          if (typeof onMissingContext === "function") {
            await onMissingContext();
          }
          return;
        }
        if (typeof onClick === "function") {
          await onClick(payload);
        }
      });

    const shellNavigationRouteDefs = [
      { key: "home", label: "Start", onClick: () => router.showHome() },
      { key: "projects", label: "Projekte", onClick: () => router.showProjects() },
      { key: "firms", label: "Firmen", onClick: () => router.showFirms() },
      { key: "settings", label: "Einstellungen", onClick: () => router.showSettings() },
    ];

    const contextualNavigationRouteDefs = [
      // Projekt- und Modul-Arbeitsbereiche werden im Projekt-Arbeitsbereich angezeigt.
      // Die Core-Sidebar bleibt frei von Fachmodulen.
    ];

    const [btnHome, btnProjects, btnFirms, btnSettings] = shellNavigationRouteDefs.map((def) =>
      createScreenRouteButton(def)
    );
    const btnHelp = mkNavBtn("help", "Hilfe", () => router.openHelpModal());

    const projectNavigationButtons = contextualNavigationRouteDefs.map((def) =>
      createScreenRouteButton(def)
    );

    const btnParticipants = mkActionBtn("Teilnehmer", async () => {
      if (!router.currentProjectId) {
        alert("Bitte zuerst ein Projekt auswählen.");
        return;
      }
      if (!router.currentMeetingId) {
        alert("Bitte zuerst eine Besprechung öffnen.");
        return;
      }
      await router.openParticipantsModal({
        projectId: router.currentProjectId,
        meetingId: router.currentMeetingId,
      });
    });

    const coreNavigationButtons = [btnHome, btnProjects, btnFirms, btnSettings, btnHelp];
    const actionButtons = [btnParticipants];

    appendButtonGroup(topBox, coreNavigationButtons);
    appendButtonGroup(topBox, projectNavigationButtons);
    appendButtonGroup(topBox, actionButtons);

    const btnQuit = document.createElement("button");
    btnQuit.textContent = "Beenden";
    btnQuit.dataset.variant = "danger";
    btnQuit.style.width = "100%";
    btnQuit.style.padding = "10px 10px";
    btnQuit.style.borderRadius = "8px";
    btnQuit.style.cursor = "pointer";
    btnQuit.style.border = "1px solid #b71c1c";
    btnQuit.style.background = "#c62828";
    btnQuit.style.color = "white";
    btnQuit.style.fontWeight = "700";

    btnQuit.onclick = async () => {
      try {
        if (!window.bbmDb || typeof window.bbmDb.appQuit !== "function") {
          alert("appQuit ist nicht verfügbar (Preload/IPC fehlt).");
          return;
        }

        if (typeof window.bbmDb.topsPurgeTrashedGlobal === "function") {
          try {
            const purgeRes = await Promise.race([
              window.bbmDb.topsPurgeTrashedGlobal(),
              new Promise((resolve) => setTimeout(() => resolve({ ok: false, timeout: true }), 1000)),
            ]);
            if (purgeRes?.timeout) {
              console.warn("[app] topsPurgeTrashedGlobal timeout before quit");
            } else if (purgeRes?.ok === false) {
              console.warn("[app] topsPurgeTrashedGlobal failed before quit:", purgeRes.error);
            }
          } catch (err) {
            console.warn("[app] topsPurgeTrashedGlobal error before quit:", err);
          }
        }

        await window.bbmDb.appQuit();
      } catch (e) {
        alert(e?.message || "Beenden fehlgeschlagen");
      }
    };

    appendButtonGroup(bottomBox, [btnQuit]);

    const updateContextButtons = () => {
      const hasProject = !!router.currentProjectId;
      const hasMeeting = !!router.currentMeetingId;

      for (const btn of projectNavigationButtons) {
        setBtnEnabled(btn, hasProject, "Bitte zuerst ein Projekt auswählen.");
      }

      if (!hasProject) {
        setBtnEnabled(btnParticipants, false, "Bitte zuerst ein Projekt auswählen.");
      } else if (!hasMeeting) {
        setBtnEnabled(btnParticipants, false, "Bitte zuerst eine Besprechung öffnen.");
      } else {
        setBtnEnabled(btnParticipants, true, "");
      }
    };

    window.addEventListener("bbm:router-context", () => {
      updateContextButtons();
    });

    router.showHome();
    header.refresh();
    updateContextButtons();
    // Start-Popup "Initialisiere ..." deaktiviert
    // Start-Popup "Was ist neu/geändert" ist deaktiviert.
  }

  _initUiNew() {
    this._initUiOld();

    const sidebar = document.querySelector('[data-bbm-sidebar="true"]');
    if (!sidebar) return;

    const normalize = (value) => String(value || "").trim().toLowerCase();
    const getButton = (labels) => {
      const targets = Array.isArray(labels) ? labels : [labels];
      return Array.from(sidebar.querySelectorAll("button")).find((btn) => {
        const t = normalize(btn.textContent);
        return targets.some((label) => normalize(label) === t);
      }) || null;
    };

    const btnStart = getButton(["home", "start"]);
    const btnProjects = getButton("projekte");
    const btnFirmsBase = getButton(["firmen", "firmen (stamm)", "firmenstamm", "firmen (extern)"]);
    const btnSettings = getButton("einstellungen");
    const btnHelp = getButton("hilfe");
    const btnQuit = getButton("beenden");

    if (!btnStart || !btnProjects || !btnFirmsBase || !btnSettings || !btnHelp || !btnQuit) return;

    btnStart.textContent = "Start";
    btnProjects.textContent = "Projekte";
    btnFirmsBase.textContent = "Firmen";
    btnSettings.textContent = "Einstellungen";
    btnHelp.textContent = "Hilfe";
    btnQuit.textContent = "Beenden";

    const sidebarSections = Array.from(sidebar.children);
    const topSection = sidebarSections[0] || null;
    const bottomSection = sidebarSections[1] || null;
    if (!topSection || !bottomSection) return;

    topSection.replaceChildren(btnStart, btnProjects, btnFirmsBase, btnSettings, btnHelp);
    bottomSection.replaceChildren(btnQuit);
  }
}
