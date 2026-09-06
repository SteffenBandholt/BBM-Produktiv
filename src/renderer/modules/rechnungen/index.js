import RechnungenDesignScreen from "./screens/RechnungenDesignScreen.js";
import RechnungScreen from "./screens/RechnungScreen.js";
import { RECHNUNG_WORK_SCREEN_ID } from "./screens/index.js";
import { RECHNUNG_SCOPE_ID } from "./RechnungScreen.uiEditorContract.js";
import { createModuleDescriptor } from "../../app/modules/moduleDescriptorContract.js";

export const RECHNUNG_MODULE_ID = "rechnung";
export const RECHNUNG_MODULE_LABEL = "Rechnungen";
export const RECHNUNG_NAV_ENTRY_KEY = "rechnungen";

class RechnungEditorScreen extends RechnungScreen {
  constructor(args = {}) {
    super(args);
    this.uiEditorScopeId = RECHNUNG_SCOPE_ID;
  }
}

function buildRechnungNavigationEntry() {
  return Object.freeze({
    key: RECHNUNG_NAV_ENTRY_KEY,
    label: RECHNUNG_MODULE_LABEL,
    moduleId: RECHNUNG_MODULE_ID,
    workScreenId: RECHNUNG_WORK_SCREEN_ID,
    section: "rechnungen",
  });
}

export function getRechnungModuleEntry() {
  return createModuleDescriptor({
    moduleId: RECHNUNG_MODULE_ID,
    moduleLabel: RECHNUNG_MODULE_LABEL,
    moduleType: "hybrid",
    licenseKey: "module:rechnung",
    workScreenId: RECHNUNG_WORK_SCREEN_ID,
    screens: Object.freeze({
      [RECHNUNG_WORK_SCREEN_ID]: RechnungEditorScreen,
    }),
    routes: Object.freeze({
      global: Object.freeze([
        Object.freeze({ screenId: RECHNUNG_WORK_SCREEN_ID }),
      ]),
      project: Object.freeze([
        Object.freeze({ screenId: RECHNUNG_WORK_SCREEN_ID }),
      ]),
    }),
    navigation: Object.freeze({
      global: Object.freeze([buildRechnungNavigationEntry()]),
      project: Object.freeze([buildRechnungNavigationEntry()]),
    }),
    ipcRegistrar: "rechnung",
    migrationRegistrar: "rechnung",
    requiredCapabilities: Object.freeze([
      "pdf",
      "mail",
      "export",
      "file-storage",
      "ui-editor",
    ]),
    presentation: Object.freeze({
      start: Object.freeze({ mode: "global" }),
    }),
    shell: Object.freeze({ hideSidebar: false }),
  });
}

export async function isRechnungenDesignAvailable({ api = globalThis.window?.bbmDb } = {}) {
  if (typeof api?.appGetBuildChannel !== "function") return false;
  try {
    const result = await api.appGetBuildChannel();
    return result?.ok === true && String(result?.channel || "").trim().toUpperCase() === "DEV";
  } catch (_error) {
    return false;
  }
}

export { RechnungScreen, RechnungenDesignScreen, RECHNUNG_WORK_SCREEN_ID };
