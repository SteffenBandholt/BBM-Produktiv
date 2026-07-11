import { getBbmUiElementRefStatus } from "./bbmUiElementRefs.js";
import { createBbmUiElementSelectionController } from "./bbmUiElementSelection.js";

function createNode(tag, className = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function asText(value, fallback = "—") {
  const text = String(value == null ? "" : value).trim();
  return text || fallback;
}

function yesNo(value) {
  return value ? "Ja" : "Nein";
}

function createInfoRow(label, value) {
  const row = createNode("div", "bbm-ui-editor-status-row");
  const labelNode = createNode("dt");
  labelNode.textContent = label;
  const valueNode = createNode("dd");
  valueNode.textContent = asText(value);
  row.append(labelNode, valueNode);
  return row;
}

function formatList(values) {
  return Array.isArray(values) && values.length > 0 ? values.join(", ") : "keine";
}

function setNeutralError(node, result) {
  const code = asText(result?.blockCode, "BBM_UI_EDITOR_STATUS_BLOCKED");
  node.textContent = `${code}: Der UI-Editor-Status konnte nicht geladen werden.`;
  node.hidden = false;
}

export class BbmUiEditorStatusPanel {
  constructor({ router } = {}) {
    this.router = router || null;
    this.root = null;
    this.statusNode = null;
    this.elementsNode = null;
    this.detailsNode = null;
    this.errorNode = null;
    this.status = null;
    this.refStatus = null;
    this.elements = [];
    this.selectedElement = null;
    this.selectionController = null;
    this.selectionMessage = "";
    this.selectionModeActive = false;
  }

  render() {
    const root = createNode("section", "bbm-ui-editor-panel");
    root.setAttribute("data-bbm-ui-editor-panel", "true");

    const header = createNode("div", "bbm-ui-editor-panel__header");
    const titleBox = createNode("div");
    const title = createNode("h1");
    title.textContent = "UI-Editor";
    const subtitle = createNode("p");
    subtitle.textContent = "Technische Editor-Ansicht fuer BBM. Layoutaenderungen folgen in einem spaeteren Paket.";
    titleBox.append(title, subtitle);

    const closeButton = createNode("button", "bbm-ui-editor-panel__close");
    closeButton.type = "button";
    closeButton.textContent = "Zurueck";
    closeButton.setAttribute("data-bbm-ui-editor-close", "true");
    closeButton.addEventListener("click", () => {
      this.close().catch(() => {});
    });
    header.append(titleBox, closeButton);

    this.errorNode = createNode("div", "bbm-ui-editor-panel__error");
    this.errorNode.hidden = true;

    const intro = createNode("div", "bbm-ui-editor-panel__notice");
    intro.textContent = "Aktuell koennen registrierte UI-Elemente geprueft und ausgewaehlt werden. Nicht registrierte BBM-Bereiche werden nicht bearbeitet.";

    const grid = createNode("div", "bbm-ui-editor-panel__grid");
    this.statusNode = createNode("section", "bbm-ui-editor-card");
    this.elementsNode = createNode("section", "bbm-ui-editor-card");
    this.detailsNode = createNode("section", "bbm-ui-editor-card");
    grid.append(this.statusNode, this.elementsNode, this.detailsNode);

    root.append(header, this.errorNode, intro, grid);
    this.root = root;
    this.selectionController = createBbmUiElementSelectionController({
      getPanelRoot: () => this.root,
      getElementMeta: (elementId) => this.getElementMeta(elementId),
      selectElement: ({ elementId }) => this.selectElement(elementId, { fromSelectionMode: true }),
      onSelection: ({ elementId, meta }) => {
        this.selectionMessage = `Ausgewaehlt: ${asText(meta?.label, elementId)}`;
        this.selectionModeActive = this.selectionController?.isActive?.() || false;
        this.renderAll();
      },
      onStateChange: (state) => {
        this.selectionModeActive = Boolean(state?.active);
        this.renderAll();
      },
    });
    this.refresh().catch((error) => this.showLoadError(error));
    return root;
  }

  async close() {
    this.stopSelectionMode();
    try {
      await window.bbmDb?.uiEditorClose?.();
    } catch (_e) {
      // ignore, navigation back is still safe
    }
    if (this.router?.activeSection && this.router.activeSection !== "uiEditor") {
      return;
    }
    await this.router?.showSettings?.();
  }

  async refresh() {
    const api = window.bbmDb || {};
    const status = typeof api.uiEditorOpen === "function" ? await api.uiEditorOpen() : { ok: false, blockCode: "BBM_UI_EDITOR_BRIDGE_MISSING" };
    if (!status?.ok) {
      this.status = status;
      this.elements = [];
      this.selectedElement = null;
      this.renderAll();
      return;
    }

    const elementsResult = typeof api.uiEditorGetElements === "function" ? await api.uiEditorGetElements() : { ok: false, elements: [] };
    const detailsResult = typeof api.uiEditorGetSelectedElementDetails === "function"
      ? await api.uiEditorGetSelectedElementDetails()
      : { ok: true, selectedElement: null };

    this.status = status;
    this.refStatus = getBbmUiElementRefStatus();
    this.elements = Array.isArray(elementsResult?.elements) ? elementsResult.elements : [];
    this.selectedElement = detailsResult?.selectedElement || null;
    this.renderAll();
  }

  showLoadError(error) {
    this.status = { ok: false, blockCode: "BBM_UI_EDITOR_RENDERER_STATUS_FAILED", message: error?.message || "" };
    this.refStatus = getBbmUiElementRefStatus();
    this.elements = [];
    this.selectedElement = null;
    this.renderAll();
  }

  renderAll() {
    this.renderStatus();
    this.renderElements();
    this.renderDetails();
  }

  renderStatus() {
    if (!this.statusNode) return;
    this.statusNode.innerHTML = "";
    const title = createNode("h2");
    title.textContent = "Status";
    const list = createNode("dl", "bbm-ui-editor-status-list");
    const status = this.status || {};

    if (!status.ok) {
      setNeutralError(this.errorNode, status);
    } else if (this.errorNode) {
      this.errorNode.hidden = true;
      this.errorNode.textContent = "";
    }

    const layout = status.layout || {};
    list.append(
      createInfoRow("Runtime gestartet", yesNo(status.runtimeStarted)),
      createInfoRow("Adapter gueltig", yesNo(status.adapterValid)),
      createInfoRow("Ziel-App", status.targetAppName || "BBM"),
      createInfoRow("targetAppId", status.targetAppId),
      createInfoRow("UI-Editor-kit", status.uiEditorKitVersion),
      createInfoRow("Aktiver UI-Scope", status.activeUiScope),
      createInfoRow("Aktiver Layout-Scope", status.activeLayoutScope),
      createInfoRow("Layoutprofil", status.activeLayoutProfileId),
      createInfoRow("Registrierte Elemente", status.registeredElementCount),
      createInfoRow("UI-Referenzen gebunden", this.refStatus ? `${this.refStatus.count}/${this.refStatus.expectedCount}` : "nicht verfuegbar"),
      createInfoRow("Fehlende Referenzen", this.refStatus ? formatList(this.refStatus.missingIds) : "nicht verfuegbar"),
      createInfoRow("Auswahlmodus", this.selectionModeActive ? "Aktiv" : "Inaktiv"),
      createInfoRow("Gebundene Ziele", this.refStatus ? String(this.getSelectableBoundCount()) : "nicht verfuegbar"),
      createInfoRow("Nicht verfuegbar", "bbm.main.actions"),
      createInfoRow("LayoutStore verfuegbar", yesNo(status.layoutStoreAvailable)),
      createInfoRow("Layoutzustand vorhanden", yesNo(layout.hasStateForScopeAndProfile)),
      createInfoRow("Load/Save/Reset technisch", `${yesNo(layout.canLoad)} / ${yesNo(layout.canSave)} / ${yesNo(layout.canReset)}`),
      createInfoRow("Blockcode", status.blockCode || "kein Block")
    );

    const reloadButton = createNode("button", "bbm-ui-editor-panel__secondary");
    reloadButton.type = "button";
    reloadButton.textContent = "Layoutstatus neu laden";
    reloadButton.addEventListener("click", () => this.refresh().catch((error) => this.showLoadError(error)));

    const resetSelection = createNode("button", "bbm-ui-editor-panel__secondary");
    resetSelection.type = "button";
    resetSelection.textContent = "Auswahl zuruecksetzen";
    resetSelection.addEventListener("click", () => this.selectElement("").catch((error) => this.showLoadError(error)));

    const startSelection = createNode("button", "bbm-ui-editor-panel__secondary");
    startSelection.type = "button";
    startSelection.textContent = "Auswahlmodus starten";
    startSelection.disabled = !this.canStartSelectionMode();
    startSelection.addEventListener("click", () => this.startSelectionMode());

    const stopSelection = createNode("button", "bbm-ui-editor-panel__secondary");
    stopSelection.type = "button";
    stopSelection.textContent = "Auswahlmodus beenden";
    stopSelection.disabled = !this.selectionModeActive;
    stopSelection.addEventListener("click", () => this.stopSelectionMode());

    const actions = createNode("div", "bbm-ui-editor-panel__actions");
    actions.append(reloadButton, resetSelection, startSelection, stopSelection);
    this.statusNode.append(title, list, actions);

    if (this.selectionModeActive) {
      const hint = createNode("p", "bbm-ui-editor-panel__notice");
      hint.textContent = "Maus ueber einen BBM-Bereich bewegen und anklicken. Esc beendet den Auswahlmodus.";
      this.statusNode.appendChild(hint);
    }
    if (this.selectionMessage) {
      const selected = createNode("p", "bbm-ui-editor-panel__notice");
      selected.textContent = this.selectionMessage;
      this.statusNode.appendChild(selected);
    }
  }

  renderElements() {
    if (!this.elementsNode) return;
    this.elementsNode.innerHTML = "";
    const title = createNode("h2");
    title.textContent = "Registrierte UI-Elemente";
    this.elementsNode.appendChild(title);

    if (!this.elements.length) {
      const empty = createNode("p", "bbm-ui-editor-panel__empty");
      empty.textContent = "Keine registrierten Elemente im aktiven Scope.";
      this.elementsNode.appendChild(empty);
      return;
    }

    const list = createNode("div", "bbm-ui-editor-elements");
    for (const element of this.elements) {
      const button = createNode("button", "bbm-ui-editor-element");
      button.type = "button";
      button.setAttribute("data-bbm-ui-editor-element-id", element.elementId);
      button.setAttribute("aria-pressed", element.selected ? "true" : "false");
      const label = createNode("strong");
      label.textContent = asText(element.label, element.elementId);
      const meta = createNode("span");
      meta.textContent = `${element.elementId} · ${asText(element.type)}`;
      const selected = createNode("em");
      selected.textContent = element.selected ? "ausgewaehlt" : "waehlen";
      button.append(label, meta, selected);
      button.addEventListener("click", () => this.selectElement(element.elementId).catch((error) => this.showLoadError(error)));
      list.appendChild(button);
    }
    this.elementsNode.appendChild(list);
  }

  renderDetails() {
    if (!this.detailsNode) return;
    this.detailsNode.innerHTML = "";
    const title = createNode("h2");
    title.textContent = "Elementdetails";
    this.detailsNode.appendChild(title);

    const element = this.selectedElement;
    if (!element) {
      const empty = createNode("p", "bbm-ui-editor-panel__empty");
      empty.textContent = "Noch kein registriertes Element ausgewaehlt.";
      this.detailsNode.appendChild(empty);
      return;
    }

    const list = createNode("dl", "bbm-ui-editor-status-list");
    list.append(
      createInfoRow("Element-ID", element.elementId),
      createInfoRow("Bezeichnung", element.label),
      createInfoRow("Typ", element.type),
      createInfoRow("Scope", element.scope),
      createInfoRow("Parent", element.parentId || "Root"),
      createInfoRow("Capabilities", formatList(element.capabilities)),
      createInfoRow("Erlaubte Aenderungen", formatList(element.allowedChanges))
    );
    this.detailsNode.appendChild(list);
  }

  getElementMeta(elementId) {
    return this.elements.find((element) => element.elementId === elementId) || null;
  }

  getSelectableBoundCount() {
    const ids = new Set(this.refStatus?.registeredIds || []);
    return ["bbm.main.navigation", "bbm.main.header", "bbm.main.content", "bbm.main.shell"].filter((elementId) => ids.has(elementId)).length;
  }

  canStartSelectionMode() {
    if (this.selectionModeActive) return false;
    if (!this.status?.runtimeStarted || !this.status?.adapterValid) return false;
    return this.getSelectableBoundCount() > 0;
  }

  startSelectionMode() {
    if (!this.canStartSelectionMode()) return;
    this.selectionMessage = "";
    this.selectionController?.start?.();
    this.selectionModeActive = this.selectionController?.isActive?.() || false;
    this.renderAll();
  }

  stopSelectionMode() {
    this.selectionController?.stop?.();
    this.selectionModeActive = false;
    this.renderAll();
  }

  destroy() {
    this.stopSelectionMode();
    this.root = null;
  }

  async selectElement(elementId, options = {}) {
    const api = window.bbmDb || {};
    if (typeof api.uiEditorSelectElement !== "function") {
      this.status = { ok: false, blockCode: "BBM_UI_EDITOR_BRIDGE_MISSING" };
      this.renderAll();
      return;
    }
    const result = await api.uiEditorSelectElement({ elementId });
    if (!result?.ok) {
      if (this.errorNode) setNeutralError(this.errorNode, result);
      return;
    }
    await this.refresh();
    if (options.fromSelectionMode) {
      const meta = this.getElementMeta(elementId);
      this.selectionMessage = `Ausgewaehlt: ${asText(meta?.label, elementId)}`;
      this.selectionModeActive = this.selectionController?.isActive?.() || false;
      this.renderAll();
    }
  }
}

export function createBbmUiEditorStatusPanel(options = {}) {
  return new BbmUiEditorStatusPanel(options);
}
