import MainHeader from "../ui/MainHeader.js";
import { applyThemeForSettings } from "../theme/themes.js";
import { createQuitActionButton } from "./coreShellActions.js";
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
  prepareCoreShellBody,
} from "./coreShellLayout.js";
import { registerCoreShellHeaderBridge } from "./coreShellHeaderBridge.js";
import { registerCoreShellContextControls } from "./coreShellContextControls.js";
import { registerCoreShellKeyboardHandling } from "./coreShellKeyboard.js";
import { createCoreShellNavigationRuntime } from "./coreShellNavigationRuntime.js";
import {
  clearBbmUiElementRefs,
  getBbmUiElementRefStatus,
  registerBbmUiElementRef,
  unregisterBbmUiElementRef,
} from "../ui-editor/bbmUiElementRefs.js";

const CORE_SHELL_BOUND_UI_ELEMENT_IDS = Object.freeze([
  "bbm.main.shell",
  "bbm.main.navigation",
  "bbm.main.header",
  "bbm.main.content",
]);

export function bindCoreShellUiElementRefs({ host, sidebar, headerEl, content } = {}) {
  for (const elementId of CORE_SHELL_BOUND_UI_ELEMENT_IDS) {
    unregisterBbmUiElementRef(elementId);
  }

  registerBbmUiElementRef("bbm.main.shell", host);
  registerBbmUiElementRef("bbm.main.navigation", sidebar);
  registerBbmUiElementRef("bbm.main.header", headerEl);
  registerBbmUiElementRef("bbm.main.content", content);

  return getBbmUiElementRefStatus();
}

export default class CoreShell {
  constructor({ router, version } = {}) {
    this.router = router || null;
    this.version = version || "";
    this.header = null;
  }

  destroy() {
    clearBbmUiElementRefs();
    this.header = null;
  }

  start() {
    this._initShell();
  }

  setVersion(version) {
    const normalizedVersion = String(version || "").trim();
    if (!normalizedVersion) return;
    this.version = normalizedVersion;
    this.header?.setVersion?.(normalizedVersion);
  }

  _initShell() {
    injectCoreShellBaseStyles();
    prepareCoreShellBody();

    registerCoreShellKeyboardHandling();

    const router = this.router;
    const header = new MainHeader({
      router,
      version: this.version,
      sidebarWidth: CORE_SHELL_LAYOUT_SIDEBAR_WIDTH,
      padding: CORE_SHELL_LAYOUT_PADDING,
    });
    this.header = header;
    const headerEl = header.render();

    clearBbmUiElementRefs();
    const { host, contentRoot: content, topBox, bottomBox, sidebar, bodyRow } = createCoreShellLayout({ headerEl });
    const uiElementRefStatus = bindCoreShellUiElementRefs({ host, sidebar, headerEl, content });
    router.uiElementRefStatus = uiElementRefStatus;

    router.contentRoot = content;
    router.shellLayout = { sidebar, bodyRow };

    const applyThemeFromRouterContext = () => {
      applyThemeForSettings(router?.context?.settings || {});
    };

    registerCoreShellHeaderBridge({
      router,
      header,
      headerEl,
      applyThemeFromRouterContext,
    });

    let updateContextButtons = null;
    const { buttonsByKey, setActive, runNavSafe } = createCoreShellNavigationRuntime({
      header,
      getUpdateContextButtons: () => updateContextButtons,
    });

    router.onSectionChange = (section) => {
      setActive(section);
    };

    const shellNavigationRouteDefs = createCoreShellNavigationRouteDefs(router);

    const routeButtons = shellNavigationRouteDefs.map((def) =>
      createScreenRouteButton({ buttonsByKey, runNavSafe }, def)
    );
    const btnHelp = mkNavBtn({ buttonsByKey, runNavSafe }, "help", "Hilfe", () => router.openHelpModal());

    const coreNavigationButtons = [...routeButtons, btnHelp];

    appendButtonGroup(topBox, coreNavigationButtons);

    const btnQuit = createQuitActionButton();
    appendButtonGroup(bottomBox, [btnQuit]);

    updateContextButtons = registerCoreShellContextControls({
      router,
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
