import MainHeader from "../ui/MainHeader.js";
import { applyThemeForSettings } from "../theme/themes.js";
import { createParticipantsActionButton, createQuitActionButton } from "./coreShellActions.js";
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
import { registerCoreShellContextControls } from "./coreShellContextControls.js";
import { registerCoreShellKeyboardHandling } from "./coreShellKeyboard.js";

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

  _initShell() {
    injectCoreShellBaseStyles();
    this._prepareBody();

    registerCoreShellKeyboardHandling();

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
          if (typeof updateContextButtons === "function") {
            updateContextButtons();
          }
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

    const btnQuit = createQuitActionButton();
    appendButtonGroup(bottomBox, [btnQuit]);

    const updateContextButtons = registerCoreShellContextControls({
      router,
      btnParticipants,
      setBtnEnabled,
    });

    router.showHome();
    header.refresh();
    if (typeof updateContextButtons === "function") {
      updateContextButtons();
    }
    // Start-Popup "Initialisiere ..." deaktiviert
    // Start-Popup "Was ist neu/geändert" ist deaktiviert.
  }
}
