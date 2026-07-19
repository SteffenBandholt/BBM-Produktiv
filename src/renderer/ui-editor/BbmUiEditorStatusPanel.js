import { getBbmUiElementRefStatus, registerBbmUiElementRef, unregisterBbmUiElementRef } from "./bbmUiElementRefs.js";
import { createBbmKitSelectionHost } from "./bbmKitSelectionHost.js";
import { createBbmEditorRuntimeInspectorBridge } from "./bbmEditorRuntimeInspectorBridge.js";

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
    this.panelRoot = null;
    this.statusNode = null;
    this.elementsNode = null;
    this.detailsNode = null;
    this.testSurfaceNode = null;
    this.errorNode = null;
    this.status = null;
    this.refStatus = null;
    this.elements = [];
    this.selectedElement = null;
    this.kitSelectionController = null;
    this.kitSelectionHost = null;
    this.hoverTargetLabel = "keines";
    this.runtimeError = "";
    this.selectionMessage = "";
    this.selectionModeActive = false;
    this.activeLayoutControlMode = "move";
    this.lastRenderedLayoutControlElementId = "";
    this.editorActive = true;
    this.layoutSessionStatus = { ok: true, active: false, changedElementIds: [], changedCount: 0, changedByElementId: {} };
    this.layoutPersistenceStatus = "Noch nicht gespeichert";
    this.savedLayoutLoadedForSession = false;
    this.inspectorBridge = createBbmEditorRuntimeInspectorBridge({
      getRegistryElements: () => this.elements,
      getSelectedElement: () => this.selectedElement,
    });
  }

  render() {
    const root = createNode("section", "bbm-ui-editor-workspace bbm-ui-editor-panel");
    root.setAttribute("data-bbm-ui-editor-panel", "true");
    root.setAttribute("data-bbm-ui-editor-workspace", "true");

    const technicalPanel = createNode("section", "bbm-ui-editor-panel__top");
    technicalPanel.setAttribute("data-bbm-ui-editor-panel", "true");

    const testLayout = createNode("section", "bbm-ui-editor-test-layout");
    testLayout.setAttribute("data-bbm-ui-editor-test-layout", "true");

    const panelRoot = createNode("aside", "bbm-ui-editor-test-control-panel");
    panelRoot.setAttribute("data-bbm-ui-editor-panel-root", "true");
    this.panelRoot = panelRoot;

    const header = createNode("div", "bbm-ui-editor-panel__header");
    const titleBox = createNode("div");
    const title = createNode("h1");
    title.textContent = "UI-Editor";
    const subtitle = createNode("p");
    subtitle.textContent = "Technische Editor-Ansicht fuer BBM. Freigegebene Layoutaenderungen laufen in kleinen Schritten.";
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
    this.detailsNode = createNode("section", "bbm-ui-editor-card bbm-ui-editor-card--details");
    grid.append(this.statusNode, this.elementsNode);

    this.testSurfaceNode = createNode("section", "bbm-ui-editor-test-surface");
    this.renderTestSurface();

    panelRoot.appendChild(this.detailsNode);
    testLayout.append(this.testSurfaceNode, panelRoot);
    technicalPanel.append(header, this.errorNode, intro, grid);
    root.append(technicalPanel, testLayout);
    this.root = root;
    this.refresh().catch((error) => this.showLoadError(error));
    return root;
  }

  async close() {
    this.editorActive = false;
    this.stopSelectionMode();
    this.destroyKitController();
    this.inspectorBridge?.endLayoutSession?.();
    this.savedLayoutLoadedForSession = false;
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
    if (!this.savedLayoutLoadedForSession) {
      const loadResult = this.inspectorBridge?.loadSavedLayout?.();
      this.layoutSessionStatus = loadResult?.status || this.layoutSessionStatus;
      this.layoutPersistenceStatus = loadResult?.ok
        ? (loadResult.savedLayoutFound ? "Gespeichertes Layout geladen" : "Noch kein Layout gespeichert")
        : "Gespeichertes Layout konnte nicht geladen werden.";
      this.savedLayoutLoadedForSession = true;
      if (loadResult?.ok && loadResult.savedLayoutFound) {
        this.layoutSessionStatus = loadResult?.status || this.layoutSessionStatus;
      } else {
        this.beginLayoutSession();
      }
    } else {
      this.refreshLayoutSessionStatus();
    }
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

  createEditorTargetNode(tagName, className, elementId, label, kind, parentId, editable, ops) {
    const node = createNode(tagName, className);
    node.setAttribute("data-ui-inspector-id", elementId);
    node.setAttribute("data-ui-editor-id", elementId);
    node.setAttribute("data-ui-editor-kind", kind);
    node.setAttribute("data-ui-editor-label", label);
    node.setAttribute("data-ui-editor-parent", parentId || "");
    node.setAttribute("data-ui-editor-editable", editable ? "true" : "false");
    node.setAttribute("data-ui-editor-ops", Array.isArray(ops) ? ops.join(",") : "");
    return node;
  }

  bindTestSurfaceElementRef(elementId, element) {
    try {
      unregisterBbmUiElementRef(elementId);
      registerBbmUiElementRef(elementId, element);
    } catch (error) {
      this.runtimeError = error?.message || String(error || "");
    }
  }

  renderTestSurface() {
    if (!this.testSurfaceNode) return;
    const testElementIds = [
      "bbm.uiEditorTest.workspace",
      "bbm.uiEditorTest.card",
      "bbm.uiEditorTest.card.title",
      "bbm.uiEditorTest.card.text",
      "bbm.uiEditorTest.card.button",
      "bbm.uiEditorTest.card.input",
      "bbm.uiEditorTest.card.select",
      "bbm.uiEditorTest.table",
    ];
    for (const elementId of testElementIds) {
      try { unregisterBbmUiElementRef(elementId); } catch (_error) {}
    }
    this.testSurfaceNode.innerHTML = "";

    const workspace = this.createEditorTargetNode(
      "section",
      "bbm-ui-editor-test-workspace",
      "bbm.uiEditorTest.workspace",
      "UI-Editor-Testfläche",
      "container",
      "bbm.main.content",
      false,
      []
    );
    const title = createNode("h2");
    title.textContent = "Testfläche";
    const hint = createNode("p", "bbm-ui-editor-test-surface__hint");
    hint.textContent = "Freie Entwicklungsfläche fuer M64. Alle Testelemente sind explizit registrierte Ziele; Bedienelemente fuehren keine Fachaktionen aus.";

    const card = this.createEditorTargetNode(
      "article",
      "bbm-ui-editor-test-card",
      "bbm.uiEditorTest.card",
      "Testkarte",
      "container",
      "bbm.uiEditorTest.workspace",
      true,
      ["move", "resize"]
    );
    const cardTitle = this.createEditorTargetNode(
      "h3",
      "bbm-ui-editor-test-card__title",
      "bbm.uiEditorTest.card.title",
      "Überschrift",
      "text",
      "bbm.uiEditorTest.card",
      true,
      ["move", "resize"]
    );
    cardTitle.textContent = "Überschrift";
    const text = this.createEditorTargetNode(
      "p",
      "bbm-ui-editor-test-card__text",
      "bbm.uiEditorTest.card.text",
      "Beispieltext",
      "text",
      "bbm.uiEditorTest.card",
      true,
      ["move", "resize"]
    );
    text.textContent = "Neutraler Beispieltext fuer Auswahl, Markierung und Layoutschritte.";
    const buttonShell = this.createEditorTargetNode(
      "div",
      "bbm-ui-editor-test-card__button-shell",
      "bbm.uiEditorTest.card.button",
      "Beispielbutton",
      "action",
      "bbm.uiEditorTest.card",
      true,
      ["move", "resize"]
    );
    buttonShell.textContent = "Beispielbutton ohne Fachaktion";
    buttonShell.setAttribute("role", "button");
    buttonShell.setAttribute("aria-disabled", "true");
    const inputShell = this.createEditorTargetNode(
      "div",
      "bbm-ui-editor-test-card__field-shell",
      "bbm.uiEditorTest.card.input",
      "Eingabefeld",
      "field",
      "bbm.uiEditorTest.card",
      true,
      ["move", "resize"]
    );
    inputShell.textContent = "Eingabefeld-Hülle (keine Dateneingabe)";
    const selectShell = this.createEditorTargetNode(
      "div",
      "bbm-ui-editor-test-card__field-shell",
      "bbm.uiEditorTest.card.select",
      "Auswahlfeld",
      "field",
      "bbm.uiEditorTest.card",
      true,
      ["move", "resize"]
    );
    selectShell.textContent = "Auswahlfeld-Hülle (keine Datenänderung)";
    card.append(cardTitle, text, buttonShell, inputShell, selectShell);

    const table = this.createEditorTargetNode(
      "table",
      "bbm-ui-editor-test-table",
      "bbm.uiEditorTest.table",
      "Beispieltabelle",
      "table",
      "bbm.uiEditorTest.workspace",
      true,
      ["move", "resize"]
    );
    const tbody = createNode("tbody");
    for (const row of [["Alpha", "Beispiel", "neutral"], ["Beta", "Demo", "neutral"]]) {
      const tr = createNode("tr");
      for (const value of row) {
        const td = createNode("td");
        td.textContent = value;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    workspace.append(title, hint, card, table);
    this.testSurfaceNode.appendChild(workspace);
    this.bindTestSurfaceElementRef("bbm.uiEditorTest.workspace", workspace);
    this.bindTestSurfaceElementRef("bbm.uiEditorTest.card", card);
    this.bindTestSurfaceElementRef("bbm.uiEditorTest.card.title", cardTitle);
    this.bindTestSurfaceElementRef("bbm.uiEditorTest.card.text", text);
    this.bindTestSurfaceElementRef("bbm.uiEditorTest.card.button", buttonShell);
    this.bindTestSurfaceElementRef("bbm.uiEditorTest.card.input", inputShell);
    this.bindTestSurfaceElementRef("bbm.uiEditorTest.card.select", selectShell);
    this.bindTestSurfaceElementRef("bbm.uiEditorTest.table", table);
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

  beginLayoutSession() {
    const result = this.inspectorBridge?.beginLayoutSession?.();
    this.layoutSessionStatus = result?.status || this.inspectorBridge?.getLayoutSessionStatus?.()?.status || this.layoutSessionStatus;
  }

  refreshLayoutSessionStatus() {
    const result = this.inspectorBridge?.getLayoutSessionStatus?.();
    this.layoutSessionStatus = result?.status || result || this.layoutSessionStatus;
  }

  hasSessionChange(elementId) {
    this.refreshLayoutSessionStatus();
    return Boolean(this.layoutSessionStatus?.changedByElementId?.[String(elementId || "")]);
  }

  getOpenChangeCount() {
    this.refreshLayoutSessionStatus();
    return Number(this.layoutSessionStatus?.changedCount || 0);
  }

  renderEditorSessionControls() {
    const box = createNode("section", "bbm-ui-editor-session-controls");
    const changeCount = this.getOpenChangeCount();
    const status = createNode("p", "bbm-ui-editor-panel__empty");
    status.textContent = changeCount > 0 ? `Änderungen offen: ${changeCount}` : "Keine offenen Änderungen";
    const persistence = createNode("p", "bbm-ui-editor-panel__empty");
    persistence.textContent = this.layoutPersistenceStatus || "Noch nicht gespeichert";
    const save = createNode("button", "bbm-ui-editor-panel__secondary");
    save.type = "button";
    save.textContent = "Änderungen speichern";
    const persistenceAvailable = this.layoutSessionStatus?.persistenceAvailable !== false;
    const persistencePersistent = this.layoutSessionStatus?.persistencePersistent !== false;
    save.disabled = !this.editorActive || changeCount === 0 || !persistenceAvailable || !persistencePersistent;
    save.addEventListener("click", () => this.saveLayoutSession());
    const toggle = createNode("button", "bbm-ui-editor-panel__secondary");
    toggle.type = "button";
    toggle.textContent = this.editorActive ? "Editor ausschalten" : "Editor einschalten";
    toggle.addEventListener("click", () => this.setEditorActive(!this.editorActive));
    const discardAll = createNode("button", "bbm-ui-editor-panel__secondary bbm-ui-editor-panel__secondary--danger");
    discardAll.type = "button";
    discardAll.textContent = "Alle Änderungen verwerfen";
    discardAll.disabled = changeCount === 0;
    discardAll.addEventListener("click", () => this.discardAllSessionChanges());
    box.append(status, persistence, save, toggle, discardAll);
    this.detailsNode.appendChild(box);
  }

  renderDetails() {
    if (!this.detailsNode) return;
    this.detailsNode.innerHTML = "";
    const title = createNode("h2");
    title.textContent = "Elementdetails";
    this.detailsNode.appendChild(title);
    this.renderEditorSessionControls();

    const element = this.selectedElement;
    if (!element) {
      const empty = createNode("p", "bbm-ui-editor-panel__empty");
      empty.textContent = this.editorActive ? "Noch kein registriertes Element ausgewaehlt." : "Editor ausgeschaltet.";
      this.detailsNode.appendChild(empty);
      return;
    }

    this.renderReadonlyLayoutControls(element);
  }

  renderReadonlyLayoutControls(element) {
    if (!this.detailsNode || !element) return;
    const elementId = String(element.elementId || element.id || "").trim();
    if (elementId !== this.lastRenderedLayoutControlElementId) {
      this.activeLayoutControlMode = "move";
      this.lastRenderedLayoutControlElementId = elementId;
    }

    const section = createNode("section", "bbm-ui-editor-layout-controls");

    const name = createNode("p", "bbm-ui-editor-panel__selected-name");
    name.textContent = asText(element.label || element.name, element.elementId);
    section.appendChild(name);

    const result = this.inspectorBridge?.inspectSelectedElement?.() || { ok: false, allowedOps: [] };
    const consoleNode = createNode("div", "bbm-ui-editor-layout-console");
    const allowedOps = Array.isArray(result.allowedOps) ? result.allowedOps : [];
    const modes = createNode("div", "bbm-ui-editor-layout-console__modes");
    for (const mode of ["move", "width", "height"]) {
      const button = createNode("button", "bbm-ui-editor-layout-console__mode");
      const requiredOperation = mode === "move" ? "move" : "resize";
      const enabled = Boolean(this.editorActive && result?.ok && allowedOps.includes(requiredOperation));
      button.type = "button";
      button.textContent = mode === "move" ? "Move" : mode === "width" ? "Breite" : "Höhe";
      button.disabled = !enabled;
      button.setAttribute("aria-pressed", this.activeLayoutControlMode === mode ? "true" : "false");
      button.addEventListener("click", () => {
        if (enabled) this.setLayoutControlMode(mode);
      });
      modes.appendChild(button);
    }

    const pad = createNode("div", "bbm-ui-editor-layout-console__pad");
    const up = this.createControlPadButton("up", "▲", result);
    const left = this.createControlPadButton("left", "◀", result);
    const center = this.createControlPadButton("center", "●", result);
    const right = this.createControlPadButton("right", "▶", result);
    const down = this.createControlPadButton("down", "▼", result);
    pad.append(up, left, center, right, down);

    consoleNode.append(modes, pad);
    section.appendChild(consoleNode);
    if (this.selectionMessage) {
      const selected = createNode("p", "bbm-ui-editor-panel__notice");
      selected.textContent = this.selectionMessage;
      section.appendChild(selected);
    }
    this.detailsNode.appendChild(section);
  }

  setLayoutControlMode(mode) {
    if (!["move", "width", "height"].includes(mode)) return;
    this.activeLayoutControlMode = mode;
    this.renderAll();
  }

  resolveLayoutPadAction(direction) {
    const mode = this.activeLayoutControlMode || "move";
    if (mode === "move") {
      return { left: "left", right: "right", up: "up", down: "down" }[direction] || null;
    }
    if (mode === "width") {
      return { left: "widthLeft", right: "widthRight" }[direction] || null;
    }
    if (mode === "height") {
      return { up: "heightUp", down: "heightDown" }[direction] || null;
    }
    return null;
  }

  createControlPadButton(direction, label, result) {
    const button = createNode("button", `bbm-ui-editor-layout-console__pad-button bbm-ui-editor-layout-console__pad-button--${direction}`);
    button.type = "button";
    button.textContent = label;
    const action = this.resolveLayoutPadAction(direction);
    const elementId = String(this.selectedElement?.elementId || this.selectedElement?.id || "").trim();
    if (direction === "center") {
      const allowed = Boolean(this.editorActive && elementId && this.selectedElement?.editable && this.hasSessionChange(elementId));
      button.textContent = "↶";
      button.disabled = !allowed;
      button.setAttribute("aria-label", "Änderungen dieses Elements verwerfen");
      button.title = "Änderungen dieses Elements verwerfen";
      button.addEventListener("click", () => this.discardSelectedElementChanges());
      return button;
    }
    const operation = action?.startsWith("width") || action?.startsWith("height") ? "resize" : action ? "move" : null;
    const allowed = Boolean(this.editorActive && result?.ok && operation && Array.isArray(result.allowedOps) && result.allowedOps.includes(operation));
    button.disabled = !allowed;
    button.setAttribute("aria-label", label);
    if (action) {
      button.addEventListener("click", () => this.applyLayoutAction(action));
    }
    return button;
  }

  applyLayoutAction(action) {
    if (!this.editorActive) return;
    const result = this.inspectorBridge?.applySelectedElementLayoutAction?.(action);
    this.selectionMessage = result?.ok ? "Layoutschritt angewendet." : "Layoutschritt blockiert.";
    this.renderAll();
  }

  saveLayoutSession() {
    if (!this.editorActive || this.getOpenChangeCount() === 0) return;
    const result = this.inspectorBridge?.saveLayoutSession?.();
    this.layoutSessionStatus = result?.status || this.layoutSessionStatus;
    this.layoutPersistenceStatus = result?.ok ? "Layout gespeichert" : "Layout konnte nicht dauerhaft gespeichert werden.";
    this.selectionMessage = result?.ok ? "Layout gespeichert." : "Layout konnte nicht dauerhaft gespeichert werden.";
    this.renderAll();
    this.syncActiveSelectionRuntime();
  }

  discardSelectedElementChanges() {
    const elementId = String(this.selectedElement?.elementId || this.selectedElement?.id || "").trim();
    if (!elementId || !this.selectedElement?.editable || !this.hasSessionChange(elementId)) return;
    const result = this.inspectorBridge?.discardSelectedElementChanges?.(elementId);
    this.layoutSessionStatus = result?.status || this.layoutSessionStatus;
    const label = asText(this.selectedElement?.label || this.selectedElement?.name, elementId);
    this.selectionMessage = result?.ok ? `Änderungen für ${label} verworfen.` : "Änderungen konnten nicht verworfen werden.";
    if (!result?.ok) this.layoutPersistenceStatus = "Speichern fehlgeschlagen";
    this.renderAll();
    this.syncActiveSelectionRuntime();
  }

  discardAllSessionChanges() {
    if (this.getOpenChangeCount() === 0) return;
    const result = this.inspectorBridge?.discardAllSessionChanges?.();
    this.layoutSessionStatus = result?.status || this.layoutSessionStatus;
    this.selectionMessage = result?.ok ? "Alle Änderungen dieser Sitzung wurden verworfen." : "Änderungen konnten nicht verworfen werden.";
    if (!result?.ok) this.layoutPersistenceStatus = "Speichern fehlgeschlagen";
    this.renderAll();
    this.syncActiveSelectionRuntime();
  }

  setEditorActive(active) {
    this.editorActive = Boolean(active);
    if (!this.editorActive) {
      this.kitSelectionController?.stop?.();
      this.selectionModeActive = false;
      this.hoverTargetLabel = "keines";
      this.selectedElement = null;
      this.selectionMessage = "Editor ausgeschaltet.";
      try { window.bbmDb?.uiEditorSelectElement?.({ elementId: "" }); } catch (_error) {}
      this.renderAll();
      this.syncActiveSelectionRuntime();
      return;
    }
    this.selectionMessage = "Editor eingeschaltet.";
    this.renderAll();
  }

  getElementMeta(elementId) {
    return this.elements.find((element) => element.elementId === elementId) || null;
  }

  getSelectableBoundCount() {
    const ids = new Set(this.refStatus?.registeredIds || []);
    return ["bbm.main.navigation", "bbm.main.header", "bbm.main.content", "bbm.main.shell", "bbm.uiEditorTest.workspace", "bbm.uiEditorTest.card", "bbm.uiEditorTest.card.title", "bbm.uiEditorTest.card.text", "bbm.uiEditorTest.card.button", "bbm.uiEditorTest.card.input", "bbm.uiEditorTest.card.select", "bbm.uiEditorTest.table"].filter((elementId) => ids.has(elementId)).length;
  }

  canStartSelectionMode() {
    if (!this.editorActive) return false;
    if (this.selectionModeActive) return false;
    if (!this.status?.runtimeStarted || !this.status?.adapterValid) return false;
    if (!this.kitSelectionController) return false;
    return this.getSelectableBoundCount() > 0;
  }

  startSelectionMode() {
    if (!this.editorActive || !this.canStartSelectionMode()) return;
    this.selectionMessage = "";
    this.kitSelectionController?.start?.();
    this.selectionModeActive = this.kitSelectionController?.isActive?.() || false;
    this.renderAll();
  }

  stopSelectionMode() {
    this.kitSelectionController?.stop?.();
    this.selectionModeActive = false;
    this.hoverTargetLabel = "keines";
    this.renderAll();
    this.syncActiveSelectionRuntime();
  }

  destroy() {
    this.editorActive = false;
    this.destroyKitController();
    this.inspectorBridge?.endLayoutSession?.();
    this.savedLayoutLoadedForSession = false;
    this.selectionModeActive = false;
    for (const elementId of ["bbm.uiEditorTest.workspace", "bbm.uiEditorTest.card", "bbm.uiEditorTest.card.title", "bbm.uiEditorTest.card.text", "bbm.uiEditorTest.card.button", "bbm.uiEditorTest.card.input", "bbm.uiEditorTest.card.select", "bbm.uiEditorTest.table"]) { try { unregisterBbmUiElementRef(elementId); } catch (_error) {} }
    this.panelRoot = null;
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
      this.selectionModeActive = this.kitSelectionController?.isActive?.() || false;
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

  syncActiveSelectionRuntime() {
    this.kitSelectionController?.syncWithSelection?.();
  }

  selectionRuntimeLabel() {
    return "UI-Editor-kit";
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
      getPanelRoot: () => this.panelRoot,
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
      this.selectionModeActive = false;
      this.hoverTargetLabel = "keines";
      this.syncActiveSelectionRuntime();
      this.renderAll();
      return;
    }
    try {
      await this.ensureKitController();
      this.runtimeError = "";
      this.syncActiveSelectionRuntime();
    } catch (error) {
      this.destroyKitController();
      this.runtimeError = error?.message || "Kit-Runtime konnte nicht gestartet werden.";
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

  handleKitRuntimeError(error) {
    this.runtimeError = error?.message || String(error || "Kit-Runtime-Fehler");
    this.destroyKitController();
    this.inspectorBridge?.endLayoutSession?.();
    this.savedLayoutLoadedForSession = false;
    this.selectionModeActive = false;
    this.hoverTargetLabel = "keines";
    this.renderAll();
  }
}

export function createBbmUiEditorStatusPanel(options = {}) {
  return new BbmUiEditorStatusPanel(options);
}
