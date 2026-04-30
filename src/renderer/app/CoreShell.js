import MainHeader from "../ui/MainHeader.js";
import { applyThemeForSettings } from "../theme/themes.js";
import { createParticipantsActionButton } from "./coreShellActions.js";
import {
  appendButtonGroup,
  createScreenRouteButton,
  mkActionBtn,
  mkNavBtn,
  setBtnEnabled,
} from "./coreShellButtons.js";
import { injectCoreShellBaseStyles } from "./coreShellStyles.js";
import { createCoreShellNavigationRouteDefs } from "./coreShellNavigation.js";

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

  start() {
    this._initShell();
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

  _initShell() {
    injectCoreShellBaseStyles();
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

    const shellNavigationRouteDefs = createCoreShellNavigationRouteDefs(router);

    const [btnHome, btnProjects, btnFirms, btnSettings] = shellNavigationRouteDefs.map((def) =>
      createScreenRouteButton({ buttonsByKey, runNavSafe }, def)
    );
    const btnHelp = mkNavBtn({ buttonsByKey, runNavSafe }, "help", "Hilfe", () => router.openHelpModal());

    const btnParticipants = createParticipantsActionButton({ router, mkActionBtn, runNavSafe });

    const coreNavigationButtons = [btnHome, btnProjects, btnFirms, btnSettings, btnHelp];
    const actionButtons = [btnParticipants];

    appendButtonGroup(topBox, coreNavigationButtons);
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
}
