import RechnungenDesignScreen from "./screens/RechnungenDesignScreen.js";
import RechnungScreen from "./screens/RechnungScreen.js";
import { RECHNUNG_WORK_SCREEN_ID } from "./screens/index.js";
import { RECHNUNG_SCOPE_ID } from "./RechnungScreen.uiEditorContract.js";
import { RechnungLeistungsEditboxBinding } from "./RechnungLeistungsEditboxBinding.js";

export const RECHNUNG_MODULE_ID = "rechnung";
export const RECHNUNG_MODULE_LABEL = "Rechnungen";
export const RECHNUNG_NAV_ENTRY_KEY = "rechnungen";

class RechnungEditorScreen extends RechnungScreen {
  constructor(args = {}) {
    super(args);
    this.uiEditorScopeId = RECHNUNG_SCOPE_ID;
    this.leistungsEditboxBinding = null;
  }

  render() {
    const root = super.render();
    this._installLeistungsEditboxBinding();
    return root;
  }

  _installLeistungsEditboxBinding() {
    if (!this.sheetArea || this.leistungsEditboxBinding) return;
    this.leistungsEditboxBinding = new RechnungLeistungsEditboxBinding({
      documentRef: globalThis.document,
      onAddTitle: () => this._createTitle(),
      onAddPosition: () => this._createPosition(),
      onMove: () => this._togglePositionMove(),
      onDelete: () => this._deletePosition(),
    });
    this.sheetArea.append(this.leistungsEditboxBinding.getElement());
  }

  _clearPositionSelection() {
    super._clearPositionSelection();
    this.leistungsEditboxBinding?.hide();
  }

  _handlePositionRowClick(entry) {
    super._handlePositionRowClick(entry);
    if (this.isPositionMoveMode) return;
    this.leistungsEditboxBinding?.showPosition(entry, {
      quantityDecimalPlaces: this.quantityDecimalPlaces,
    });
  }
}

export function getRechnungModuleEntry() {
  return Object.freeze({
    moduleId: RECHNUNG_MODULE_ID,
    moduleLabel: RECHNUNG_MODULE_LABEL,
    workScreenId: RECHNUNG_WORK_SCREEN_ID,
    screens: Object.freeze({
      [RECHNUNG_WORK_SCREEN_ID]: RechnungEditorScreen,
    }),
    navigation: Object.freeze({
      global: Object.freeze([
        Object.freeze({
          key: RECHNUNG_NAV_ENTRY_KEY,
          label: RECHNUNG_MODULE_LABEL,
          moduleId: RECHNUNG_MODULE_ID,
          workScreenId: RECHNUNG_WORK_SCREEN_ID,
          section: "rechnungen",
        }),
      ]),
    }),
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
