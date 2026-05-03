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

export default class CoreShell {
  constructor({ router, version } = {}) {
    this.router = router || null;
    this.version = version || "";
  }

  start() {
    this._initShell();
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
    const headerEl = header.render();

    const { contentRoot: content, topBox, bottomBox } = createCoreShellLayout({ headerEl });

    router.contentRoot = content;

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

    router.onSectionChange = (section) => setActive(section);

    const shellNavigationRouteDefs = createCoreShellNavigationRouteDefs(router);

    const [btnHome, btnProjects, btnFirms, btnSettings] = shellNavigationRouteDefs.map((def) =>
      createScreenRouteButton({ buttonsByKey, runNavSafe }, def)
    );
    const btnHelp = mkNavBtn({ buttonsByKey, runNavSafe }, "help", "Hilfe", () => router.openHelpModal());

    const coreNavigationButtons = [btnHome, btnProjects, btnFirms, btnSettings, btnHelp];

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
