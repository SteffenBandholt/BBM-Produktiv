import { getBbmUiElementRefStatus } from "./bbmUiElementRefs.js";
import { createBbmUiElementSelectionController } from "./bbmUiElementSelection.js";
import { createBbmUiSelectedOverlay } from "./bbmUiSelectedOverlay.js";
import { createBbmKitSelectionHost } from "./bbmKitSelectionHost.js";

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
    this.bbmSelectionController = null;
    this.kitSelectionController = null;
    this.kitSelectionHost = null;
    this.selectionController = null;
    this.selectionRuntime = "kit";
    this.hoverTargetLabel = "keines";
    this.runtimeError = "";
    this.selectionMessage = "";
    this.selectionModeActive = false;
    this.selectedOverlay = createBbmUiSelectedOverlay();
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
    this.bbmSelectionController = createBbmUiElementSelectionController({
      getPanelRoot: () => this.root,
      getElementMeta: (elementId) => this.getElementMeta(elementId),
      isElementSelected: (elementId) => this.selectedElement?.elementId === elementId,
      selectElement: ({ elementId }) => this.selectElement(elementId, { fromSelectionMode: true }),
      onSelection: ({ elementId, meta }) => {
        this.selectionMessage = `Ausgewaehlt: ${asText(meta?.label, elementId)}`;
        this.selectionModeActive = this.getActiveController()?.isActive?.() || false;
        this.renderAll();
      },
      onStateChange: (state) => {
        this.selectionModeActive = Boolean(state?.active);
        this.hoverTargetLabel = this.formatElementLabel(state?.hoveredElementId);
        this.renderAll();
      },
    });
    this.refresh().catch((error) => this.showLoadError(error));
    return root;
  }

  async close() {
    this.stopSelectionMode();
    this.destroyKitController();
    this.bbmSelectionController?.destroy?.();
    this.selectedOverlay?.destroy?.();
    this.selectionRuntime = "kit";
    this.selectionController = null;
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
      this.syncActiveSelectionRuntime();
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
    await this.initializeDefaultSelectionRuntime();
  }

  showLoadError(error) {
    this.status = { ok: false, blockCode: "BBM_UI_EDITOR_RENDERER_STATUS_FAILED", message: error?.message || "" };
    this.refStatus = getBbmUiElementRefStatus();
    this.elements = [];
    this.selectedElement = null;
    this.renderAll();
    this.syncActiveSelectionRuntime();
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
      createInfoRow("Auswahl-Laufzeit", this.selectionRuntimeLabel()),
      createInfoRow("Auswahlmodus", this.selectionModeActive ? "Aktiv" : "Inaktiv"),
      createInfoRow("Visuell markiert", this.getVisualSelectionLabel()),
      createInfoRow("Hover-Ziel", this.hoverTargetLabel || "keines"),
      createInfoRow("Gebundene Ziele", this.refStatus ? String(this.getSelectableBoundCount()) : "nicht verfuegbar"),
      createInfoRow("Nicht verfuegbar", "bbm.main.actions"),
      createInfoRow("Letzter Runtime-Fehler", this.runtimeError || "keiner"),
      createInfoRow("LayoutStore verfuegbar", yesNo(status.layoutStoreAvailable)),
      createInfoRow("Layoutzustand vorhanden", yesNo(layout.hasStateForScopeAndProfile)),
      createInfoRow("Load/Save/Reset technisch", `${yesNo(layout.canLoad)} / ${yesNo(layout.canSave)} / ${yesNo(layout.canReset)}`),
      createInfoRow("Blockcode", status.blockCode || "kein Block")
    );


    const runtimeLabel = createNode("label", "bbm-ui-editor-panel__runtime");
    const runtimeText = createNode("span");
    runtimeText.textContent = "Auswahl-Laufzeit:";
    const runtimeSelect = createNode("select");
    const bbmOption = createNode("option");
    bbmOption.value = "bbm";
    bbmOption.textContent = "BBM";
    const kitOption = createNode("option");
    kitOption.value = "kit";
    kitOption.textContent = "UI-Editor-kit";
    runtimeSelect.append(bbmOption, kitOption);
    runtimeSelect.value = this.selectionRuntime;
    runtimeSelect.addEventListener("change", () => {
      this.switchSelectionRuntime(runtimeSelect.value).catch((error) => this.handleKitRuntimeError(error));
    });
    runtimeLabel.append(runtimeText, runtimeSelect);

    const reloadButton = createNode("button", "bbm-ui-editor-panel__secondary");
    reloadButton.type = "button";
    reloadButton.textContent = "Layoutstatus neu laden";
    reloadButton.addEventListener("click", () => this.refresh().catch((error) => this.showLoadError(error)));

    const resetSelection = createNode("button", "bbm-ui-editor-panel__secondary");
    resetSelection.type = "button";
    resetSelection.textContent = "Auswahl zuruecksetzen";
    resetSelection.addEventListener("click", () => this.resetSelection().catch((error) => this.showLoadError(error)));

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
    this.statusNode.append(title, list, runtimeLabel, actions);

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
    this.getActiveController()?.start?.();
    this.selectionModeActive = this.getActiveController()?.isActive?.() || false;
    this.renderAll();
  }

  stopSelectionMode() {
    this.getActiveController()?.stop?.();
    this.selectionModeActive = false;
    this.hoverTargetLabel = "keines";
    this.renderAll();
    this.syncActiveSelectionRuntime();
  }

  destroy() {
    this.destroyKitController();
    this.bbmSelectionController?.destroy?.();
    this.selectedOverlay?.destroy?.();
    this.selectionModeActive = false;
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
    this.syncActiveSelectionRuntime();
    if (options.fromSelectionMode) {
      const meta = this.getElementMeta(elementId);
      this.selectionMessage = `Ausgewaehlt: ${asText(meta?.label, elementId)}`;
      this.selectionModeActive = this.getActiveController()?.isActive?.() || false;
      this.renderAll();
      this.syncActiveSelectionRuntime();
    }
  }

  async resetSelection() {
    await this.selectElement("");
    this.selectedElement = null;
    this.syncActiveSelectionRuntime();
  }

  getVisualSelectionLabel() {
    return this.selectedElement ? asText(this.selectedElement.label, this.selectedElement.elementId) : "keine Auswahl";
  }

  syncSelectedOverlay() {
    if (this.selectionRuntime === "kit") return false;
    if (!this.selectedElement) {
      this.selectedOverlay?.clear?.();
      return false;
    }
    try {
      return this.selectedOverlay?.sync?.(this.selectedElement) || false;
    } catch (_error) {
      this.selectedOverlay?.clear?.();
      return false;
    }
  }


  syncActiveSelectionRuntime() {
    if (this.selectionRuntime === "kit") {
      this.selectedOverlay?.clear?.();
      this.kitSelectionController?.syncWithSelection?.();
      return;
    }
    this.syncSelectedOverlay();
    this.bbmSelectionController?.syncHoverWithSelection?.();
  }

  selectionRuntimeLabel() {
    return this.selectionRuntime === "kit" ? "UI-Editor-kit" : "BBM";
  }

  getActiveController() {
    return this.selectionRuntime === "kit" ? this.kitSelectionController : this.bbmSelectionController;
  }

  formatElementLabel(elementId) {
    const normalized = String(elementId || "").trim();
    if (!normalized) return "keines";
    const meta = this.getElementMeta(normalized);
    return asText(meta?.label, normalized);
  }

  createKitHost() {
    this.kitSelectionHost = createBbmKitSelectionHost({
      getRegistryElements: () => this.elements,
      getSelectedElement: () => this.selectedElement,
      selectElement: (elementId) => this.selectElement(elementId, { fromSelectionMode: true }),
      getPanelRoot: () => this.root,
      onStateChange: (state) => {
        this.selectionModeActive = Boolean(state?.active);
        this.hoverTargetLabel = this.formatElementLabel(state?.hoveredElementId || state?.hoverTargetId);
        this.renderAll();
      },
      onSelection: (selection) => {
        const elementId = selection?.elementId || selection?.selectedElementId || selection?.target?.elementId;
        this.selectionMessage = `Ausgewaehlt: ${this.formatElementLabel(elementId)}`;
        this.renderAll();
      },
      onError: (error) => this.handleKitRuntimeError(error),
    });
    return this.kitSelectionHost;
  }

  async ensureKitController() {
    if (this.kitSelectionController) return this.kitSelectionController;
    const uiEditorKit = await import("../../../node_modules/ui-editor-kit/dist/selection-runtime.browser.mjs");
    const createSelectionController = uiEditorKit?.createSelectionController || uiEditorKit?.default?.createSelectionController;
    if (typeof createSelectionController !== "function") {
      throw new Error("UI-Editor-kit Selection-Runtime ist nicht verfuegbar.");
    }
    const host = this.createKitHost();
    this.kitSelectionController = createSelectionController({
      host,
      document,
      window,
      overlayOptions: {
        hover: { zIndex: 2147483190 },
        selected: { zIndex: 2147483191 },
      },
    });
    return this.kitSelectionController;
  }

  async initializeDefaultSelectionRuntime() {
    if (!this.status?.ok || !this.status?.runtimeStarted || !this.status?.adapterValid) {
      this.destroyKitController();
      this.selectionRuntime = "bbm";
      this.selectionController = this.bbmSelectionController;
      this.syncActiveSelectionRuntime();
      this.renderAll();
      return;
    }
    if (this.selectionRuntime !== "kit") {
      this.syncActiveSelectionRuntime();
      return;
    }
    this.bbmSelectionController?.stop?.();
    this.selectedOverlay?.clear?.();
    try {
      await this.ensureKitController();
      this.selectionRuntime = "kit";
      this.selectionController = this.kitSelectionController;
      this.runtimeError = "";
      this.syncActiveSelectionRuntime();
    } catch (error) {
      this.destroyKitController();
      this.selectionRuntime = "bbm";
      this.selectionController = this.bbmSelectionController;
      this.runtimeError = error?.message || "Kit-Runtime konnte nicht gestartet werden.";
      this.syncActiveSelectionRuntime();
    }
    this.selectionModeActive = false;
    this.hoverTargetLabel = "keines";
    this.renderAll();
  }

  destroyKitController() {
    this.kitSelectionController?.stop?.();
    this.kitSelectionController?.destroy?.();
    this.kitSelectionController = null;
    this.kitSelectionHost = null;
  }

  async switchSelectionRuntime(nextRuntime) {
    const normalized = nextRuntime === "kit" ? "kit" : "bbm";
    if (normalized === this.selectionRuntime) return;
    this.stopSelectionMode();
    if (normalized === "kit") {
      this.bbmSelectionController?.stop?.();
      this.selectedOverlay?.clear?.();
      try {
        await this.ensureKitController();
        this.selectionRuntime = "kit";
        this.selectionController = this.kitSelectionController;
        this.runtimeError = "";
        this.syncActiveSelectionRuntime();
      } catch (error) {
        this.destroyKitController();
        this.selectionRuntime = "bbm";
        this.selectionController = this.bbmSelectionController;
        this.runtimeError = error?.message || "Kit-Runtime konnte nicht gestartet werden.";
      }
    } else {
      this.destroyKitController();
      this.selectionRuntime = "bbm";
      this.selectionController = this.bbmSelectionController;
      this.runtimeError = "";
      this.syncActiveSelectionRuntime();
    }
    this.selectionModeActive = false;
    this.hoverTargetLabel = "keines";
    this.renderAll();
  }

  handleKitRuntimeError(error) {
    this.runtimeError = error?.message || String(error || "Kit-Runtime-Fehler");
    this.destroyKitController();
    this.selectionModeActive = false;
    this.hoverTargetLabel = "keines";
    if (this.selectionRuntime === "kit") {
      this.selectionRuntime = "bbm";
      this.selectionController = this.bbmSelectionController;
      this.syncActiveSelectionRuntime();
    }
    this.renderAll();
  }
}

export function createBbmUiEditorStatusPanel(options = {}) {
  return new BbmUiEditorStatusPanel(options);
}
