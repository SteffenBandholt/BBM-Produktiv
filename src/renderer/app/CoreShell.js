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
import {
  CORE_SHELL_LAYOUT_PADDING,
  CORE_SHELL_LAYOUT_SIDEBAR_WIDTH,
  createCoreShellLayout,
} from "./coreShellLayout.js";
import { registerCoreShellHeaderBridge } from "./coreShellHeaderBridge.js";

export default class CoreShell {
  constructor({ router, version } = {}) {
    this.router = router || null;
    this.version = version || "";
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

    this._attachGlobalKeyHandling();

    const router = this.router;
    const header = new MainHeader({
      router,
      version: this.version,
      sidebarWidth: CORE_SHELL_LAYOUT_SIDEBAR_WIDTH,
      padding: CORE_SHELL_LAYOUT_PADDING,
    });
    const headerEl = header.render();

    const { contentRoot: content, topBox, bottomBox } = createCoreShellLayout({ headerEl });

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

    router.contentRoot = content;
    router.onSectionChange = (section) => setActive(section);

    const applyThemeFromRouterContext = () => {
      applyThemeForSettings(router?.context?.settings || {});
    };

    registerCoreShellHeaderBridge({
      router,
      header,
      headerEl,
      applyThemeFromRouterContext,
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
