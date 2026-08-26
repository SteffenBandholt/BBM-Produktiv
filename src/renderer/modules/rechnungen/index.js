import RechnungenDesignScreen from "./screens/RechnungenDesignScreen.js";
import RechnungScreen from "./screens/RechnungScreen.js";
import { RECHNUNG_WORK_SCREEN_ID } from "./screens/index.js";
import { RECHNUNG_SCOPE_ID } from "./RechnungScreen.uiEditorContract.js";
import { RechnungLeistungsEditboxBinding } from "./RechnungLeistungsEditboxBinding.js";

export const RECHNUNG_MODULE_ID = "rechnung";
export const RECHNUNG_MODULE_LABEL = "Rechnungen";
export const RECHNUNG_NAV_ENTRY_KEY = "rechnungen";

function parseLocalizedNumber(value) {
  const source = String(value ?? "").trim().replace(/\s+/g, "");
  if (!source) return 0;
  const normalized = source.includes(",")
    ? source.replace(/\./g, "").replace(",", ".")
    : source;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
}

function localizedMoneyToCents(value) {
  return Math.round(parseLocalizedNumber(value) * 100);
}

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
    if (!this.editor || this.leistungsEditboxBinding) return;
    this.leistungsEditboxBinding = new RechnungLeistungsEditboxBinding({
      documentRef: globalThis.document,
      onAddTitle: () => this._createTitle(),
      onAddPosition: () => this._createPosition(),
      onMove: () => this._togglePositionMove(),
      onDelete: () => this._deletePosition(),
      onChange: (positionId, values) => this._applyLeistungsEditboxChange(positionId, values),
    });
    this.editor.append(this.leistungsEditboxBinding.getElement());
  }

  _applyLeistungsEditboxChange(positionId, values = {}) {
    if (this.current?.status !== "DRAFT") return;
    const index = this.positions.findIndex((entry) => entry.id === positionId);
    if (index < 0) return;

    const current = this.positions[index];
    const shortText = String(values.shortText ?? "");
    const next = {
      ...current,
      short_text: shortText,
      long_text: String(values.longText ?? ""),
    };

    if (current.type === "service") {
      const inputCents = localizedMoneyToCents(values.unitPrice);
      const gross = values.gross === true;
      next.quantity = String(parseLocalizedNumber(values.quantity));
      next.unit = String(values.unit ?? "").trim();
      next.is_nep = values.nep === true;
      next.price_input_mode = gross ? "GROSS" : "NET";
      next.price_input_cents = gross ? inputCents : null;
      if (!gross) next.unit_price_cents = inputCents;
    }

    this.positions[index] = next;
    this.quantityDecimalPlaces = Number.isInteger(Number(values.quantityDecimalPlaces))
      ? Number(values.quantityDecimalPlaces)
      : this.quantityDecimalPlaces;

    // Während der Eingabe darf der Kurztext vorübergehend leer sein. Die
    // fachliche Normalisierung läuft wieder, sobald ein speicherbarer Kurztext da ist.
    if (shortText.trim()) {
      try {
        this._normalizePositions();
      } catch (_error) {
        // Der aktuelle Eingabestand bleibt in der Editbox; kein stilles Verwerfen.
      }
    }

    this._renderPositions();
    this._syncDerived();
    if (shortText.trim()) void this._queueDraftSave();
  }

  _clearPositionSelection() {
    super._clearPositionSelection();
    this.leistungsEditboxBinding?.hide();
  }

  _handlePositionRowClick(entry) {
    super._handlePositionRowClick(entry);
    if (this.isPositionMoveMode) return;
    this.leistungsEditboxBinding?.showPosition(this._getSelectedPosition(), {
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
