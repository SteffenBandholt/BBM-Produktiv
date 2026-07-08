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
import { installBbmUiEditorRuntimeLauncher } from "../uiEditor/BbmUiEditorRuntimeLauncher.js";
import { getActiveUiScope, getAvailableUiScopes, getBbmUiEditorRegistry } from "../uiEditor/bbmUiEditorRegistry.js";
import { createEditorScopeInspector } from "../editorRuntime/inspector/editorScopeInspector.js";

const HOST_UI_SCOPE_BY_SECTION = Object.freeze({
  restarbeiten: "restarbeiten.screen",
});

const LAYOUT_SCOPE_BY_UI_SCOPE = Object.freeze({
  "protokoll.topsScreen": "protokoll.topsScreen",
  "restarbeiten.screen": "restarbeiten.ui.main",
});

function resolveActiveHostUiScope(router) {
  const sectionScope = HOST_UI_SCOPE_BY_SECTION[String(router?.activeSection || "").trim()];
  if (sectionScope) return sectionScope;

  if (router?.context?.ui?.isTopsView) {
    return "protokoll.topsScreen";
  }

  return getActiveUiScope();
}

function resolveLayoutScopeForUiScope(uiScope) {
  return LAYOUT_SCOPE_BY_UI_SCOPE[String(uiScope || "").trim()] || null;
}

export default class CoreShell {
  constructor({ router, version } = {}) {
    this.router = router || null;
    this.version = version || "";
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

    const { contentRoot: content, topBox, bottomBox, sidebar, bodyRow } = createCoreShellLayout({ headerEl });

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

    let uiEditorRuntimeRefreshToken = 0;
    const uiEditorLayoutInspector = createEditorScopeInspector();
    const refreshUiEditorRuntimeLauncher = () => {
      const activeUiScope = resolveActiveHostUiScope(router);
      const uiEditorRegistry = getBbmUiEditorRegistry(activeUiScope);
      const refreshToken = ++uiEditorRuntimeRefreshToken;
      Promise.resolve(
        installBbmUiEditorRuntimeLauncher({
          header,
          devEnabled: true,
          activeScopeId: activeUiScope,
          activeUiScope,
          registeredElements: uiEditorRegistry?.elements,
          availableUiScopes: getAvailableUiScopes(),
          registryResolver: getBbmUiEditorRegistry,
          layoutInspector: uiEditorLayoutInspector,
          layoutScopeResolver: resolveLayoutScopeForUiScope,
        })
      ).catch((error) => {
        if (refreshToken === uiEditorRuntimeRefreshToken) {
          console.warn("[CoreShell] UI-Editor Runtime-Launcher konnte nicht aktualisiert werden:", error);
        }
      });
    };

    router.onSectionChange = (section) => {
      setActive(section);
      refreshUiEditorRuntimeLauncher();
    };

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
    refreshUiEditorRuntimeLauncher();
    if (typeof updateContextButtons === "function") {
      updateContextButtons();
    }
    // Start-Popup "Initialisiere ..." deaktiviert
    // Start-Popup "Was ist neu/geändert" ist deaktiviert.
  }
}
