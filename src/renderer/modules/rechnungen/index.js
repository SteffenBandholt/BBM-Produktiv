import { POSITION_TYPES } from "../../../shared/rechnung/rechnungPositions.mjs";
import { m80EditorAttributes } from "../../ui-editor/m80Registry.js";
import { registerM80Ref } from "../../ui-editor/m80Refs.js";
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

function bindRuntimeEditorElement(element, id) {
  for (const [name, value] of Object.entries(m80EditorAttributes(id))) element.setAttribute(name, value);
  registerM80Ref(id, element);
  return element;
}

class RechnungEditorScreen extends RechnungScreen {
  constructor(args = {}) {
    super(args);
    this.uiEditorScopeId = RECHNUNG_SCOPE_ID;
    this.leistungsEditboxBinding = null;
    this.leistungsEditboxEnabled = true;
    this.leistungsEditboxToggleButton = null;
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

    const frameElement = this.leistungsEditboxBinding.getFrameElement();
    bindRuntimeEditorElement(frameElement, "rechnung.editor.leistungsEditbox");
    this.editor.append(this.leistungsEditboxBinding.getElement());

    const header = this.editor.querySelector?.(".rechnung-live-editor__header");
    if (header) {
      const toggle = globalThis.document.createElement("button");
      toggle.type = "button";
      toggle.className = "invoice-button invoice-button--secondary";
      toggle.onclick = () => this._toggleLeistungsEditbox();
      bindRuntimeEditorElement(toggle, "rechnung.editor.leistungsEditboxToggle");
      const spacer = header.querySelector?.(".rechnung-live-footer-spacer");
      if (spacer) header.insertBefore(toggle, spacer);
      else header.append(toggle);
      this.leistungsEditboxToggleButton = toggle;
      this._syncLeistungsEditboxToggle();
    }
  }

  _toggleLeistungsEditbox() {
    this.leistungsEditboxEnabled = !this.leistungsEditboxEnabled;
    if (this.leistungsEditboxEnabled) this._showSelectedPositionInLeistungsEditbox();
    else this.leistungsEditboxBinding?.hide();
    this._syncLeistungsEditboxToggle();
  }

  _syncLeistungsEditboxToggle() {
    if (!this.leistungsEditboxToggleButton) return;
    this.leistungsEditboxToggleButton.textContent = this.leistungsEditboxEnabled ? "Editbox aus" : "Editbox an";
    this.leistungsEditboxToggleButton.setAttribute("aria-pressed", String(this.leistungsEditboxEnabled));
  }

  _alternativeBasePositionNumber(position) {
    if (!position?.alternative_of) return "";
    return this.positions.find((entry) => entry.id === position.alternative_of)?.position_number || "";
  }

  _showSelectedPositionInLeistungsEditbox() {
    if (!this.leistungsEditboxEnabled) {
      this.leistungsEditboxBinding?.hide();
      return;
    }
    const selected = this._getSelectedPosition();
    this.leistungsEditboxBinding?.showPosition(selected, {
      quantityDecimalPlaces: this.quantityDecimalPlaces,
      alternativeBasePositionNumber: this._alternativeBasePositionNumber(selected),
    });
  }

  _nextAlternativeSuffix(motherId) {
    const used = new Set(
      this.positions
        .filter((entry) => entry.alternative_of === motherId)
        .map((entry) => String(entry.alternative_suffix || "").trim().toLowerCase())
        .filter(Boolean)
    );
    for (let code = 97; code <= 122; code += 1) {
      const suffix = String.fromCharCode(code);
      if (!used.has(suffix)) return suffix;
    }
    return null;
  }

  _createAlternativeFromPosition(mother) {
    if (this.current?.status !== "DRAFT") return;
    if (!mother || mother.type !== POSITION_TYPES.SERVICE || mother.alternative_of) return;

    const suffix = this._nextAlternativeSuffix(mother.id);
    if (!suffix) return this._error("Für diese Position sind keine weiteren Alternativen verfügbar.");

    const id = this._nextPositionId();
    const alternative = {
      ...mother,
      id,
      position_number: null,
      alternative_of: mother.id,
      alternative_suffix: suffix,
      is_nep: true,
      total_cents: null,
    };

    const motherIndex = this.positions.findIndex((entry) => entry.id === mother.id);
    let insertIndex = motherIndex + 1;
    while (insertIndex < this.positions.length && this.positions[insertIndex]?.alternative_of === mother.id) {
      insertIndex += 1;
    }
    this.positions.splice(insertIndex, 0, alternative);
    this._normalizePositions();

    const created = this.positions.find((entry) => entry.id === id) || null;
    this._selectPosition(created, { setCreateContext: false });
    this._renderPositions();
    this._syncDerived();
    this._showSelectedPositionInLeistungsEditbox();
    void this._queueDraftSave();
  }

  _activateAlternativeGroupMember(positionId) {
    const active = this.positions.find((entry) => entry.id === positionId) || null;
    if (!active || active.type !== POSITION_TYPES.SERVICE) return;

    const motherId = active.alternative_of || active.id;
    const isGroupMember = (entry) => entry.id === motherId || entry.alternative_of === motherId;
    this.positions = this.positions.map((entry) => {
      if (!isGroupMember(entry) || entry.type !== POSITION_TYPES.SERVICE) return entry;
      return {
        ...entry,
        is_nep: entry.id !== active.id,
        total_cents: null,
      };
    });
  }

  _applyLeistungsEditboxChange(positionId, values = {}) {
    if (this.current?.status !== "DRAFT") return;
    const index = this.positions.findIndex((entry) => entry.id === positionId);
    if (index < 0) return;

    const current = this.positions[index];
    if (
      current.type === POSITION_TYPES.SERVICE &&
      !current.alternative_of &&
      values.type === "alternative"
    ) {
      this._createAlternativeFromPosition(current);
      return;
    }

    const shortText = String(values.shortText ?? "");
    const next = {
      ...current,
      short_text: shortText,
      long_text: String(values.longText ?? ""),
    };

    if (current.type === POSITION_TYPES.SERVICE) {
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

    if (current.type === POSITION_TYPES.SERVICE && next.is_nep === false) {
      this._activateAlternativeGroupMember(positionId);
    }

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
    this._showSelectedPositionInLeistungsEditbox();
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
