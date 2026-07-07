import * as installedLauncherButtonArtifactModule from "../../../uiEditor/uiEditorLauncherButton.js";
import * as installedTargetSelectionArtifactModule from "../../../uiEditor/targetSelection.js";

void installedLauncherButtonArtifactModule;
void installedTargetSelectionArtifactModule;

const INSTALLED_LAUNCHER_SCRIPT_PATH = "../../uiEditor/uiEditorLauncherButton.js";
const INSTALLED_LAUNCHER_CSS_PATH = "../../uiEditor/uiEditorLauncherButton.css";
const LAUNCHER_HOST_ATTRIBUTE = "data-ui-editor-launcher-host";
const LAUNCHER_CSS_ATTRIBUTE = "data-ui-editor-launcher-css";
const LAUNCHER_STATUS_ATTRIBUTE = "data-ui-editor-launcher-status";
const UI_EDITOR_ACTIVE_ATTRIBUTE = "data-ui-editor-active";
const UI_EDITOR_SELECTED_ATTRIBUTE = "data-ui-editor-selected";

let installedLauncherCssNode = null;
let launcherHostNode = null;
let launcherStatusNode = null;
let launcherStatusContentNode = null;
let launcherStatusReopenNode = null;
let launcherDocumentClickHandler = null;
let launcherDocumentClickDocument = null;
let launcherRuntimeState = null;

function getDocument(explicitDocument = null) {
  return explicitDocument || (typeof document === "object" ? document : null);
}

function getWindow(explicitWindow = null) {
  return explicitWindow || (typeof window === "object" ? window : null);
}

function getInstalledLauncherArtifact(explicitWindow = null) {
  const win = getWindow(explicitWindow);
  return win?.uiEditorLauncherButtonArtifact?.uiEditorLauncherButton || null;
}

function getInstalledTargetSelectionArtifact(explicitWindow = null) {
  const win = getWindow(explicitWindow);
  return win?.uiEditorTargetSelectionArtifact || globalThis?.uiEditorTargetSelectionArtifact || null;
}

function getLauncherHost(doc, host = null) {
  if (host) return host;
  return doc?.body || null;
}

function normalizeReadonlyRegisteredElements(registeredElements = null) {
  if (!Array.isArray(registeredElements)) return [];

  return registeredElements
    .map((element) => {
      if (!element || typeof element !== "object") return null;
      const id = String(element.id == null ? "" : element.id).trim();
      if (!id) return null;
      const label = String(element.label ?? element.name ?? "").trim();
      const area = String(element.area ?? "").trim();
      return { id, label, area };
    })
    .filter(Boolean);
}

function normalizeReadonlyRegistryElements(registeredElements = null) {
  if (!Array.isArray(registeredElements)) return [];

  return registeredElements
    .map((element) => {
      if (!element || typeof element !== "object") return null;
      const id = String(element.id == null ? "" : element.id).trim();
      if (!id) return null;
      const name = String(element.name ?? element.label ?? "").trim();
      const area = String(element.area ?? "").trim();
      const type = String(element.type ?? "").trim();
      const role = String(element.role ?? "").trim();
      const parentId = element.parentId == null ? null : String(element.parentId).trim();
      const allowedOps = Array.isArray(element.allowedOps) ? element.allowedOps.map((entry) => String(entry)).filter(Boolean) : [];
      const lockedOps = Array.isArray(element.lockedOps) ? element.lockedOps.map((entry) => String(entry)).filter(Boolean) : [];
      return { id, name, area, type, role, parentId, allowedOps, lockedOps };
    })
    .filter(Boolean);
}

function normalizeAvailableUiScopes(availableUiScopes = null) {
  if (!Array.isArray(availableUiScopes)) return [];

  return availableUiScopes
    .map((scope) => {
      if (!scope || typeof scope !== "object") return null;
      const uiScope = String(scope.uiScope == null ? "" : scope.uiScope).trim();
      if (!uiScope) return null;
      const moduleId = String(scope.moduleId ?? "").trim();
      const label = String(scope.label ?? "").trim();
      const status = String(scope.status ?? "").trim();
      return { uiScope, moduleId, label, status };
    })
    .filter(Boolean);
}

function normalizeReadonlyRegistry(registry = null) {
  if (!registry || typeof registry !== "object") {
    return { uiScope: "", moduleId: "", elements: [], ok: false, reason: "" };
  }

  return {
    uiScope: String(registry.uiScope ?? "").trim(),
    moduleId: String(registry.moduleId ?? "").trim(),
    elements: normalizeReadonlyRegistryElements(registry.elements),
    ok: registry.ok === false ? false : true,
    reason: String(registry.reason ?? "").trim(),
  };
}

function createLauncherState({
  activeUiScope = null,
  registeredElements = null,
  availableUiScopes = null,
  registryResolver = null,
  layoutInspector = null,
  layoutScopeResolver = null,
} = {}) {
  const normalizedScope = String(activeUiScope == null ? "" : activeUiScope).trim();
  const resolver = typeof registryResolver === "function" ? registryResolver : null;
  const selectedRegistry = resolver && normalizedScope
    ? normalizeReadonlyRegistry(resolver(normalizedScope))
    : normalizeReadonlyRegistry({ uiScope: normalizedScope, elements: registeredElements });

  return {
    uiEditorLauncherActive: false,
    activeUiScope: normalizedScope,
    selectedRegistry,
    selectedElement: null,
    selectedTargetNode: null,
    selectedTargetPreviousStyle: null,
    hoverElement: null,
    hoverTargetNode: null,
    selectionMessage: "",
    hoverMessage: "",
    targetSelectionController: null,
    targetSelectionPanelController: null,
    win: null,
    availableUiScopes: normalizeAvailableUiScopes(availableUiScopes),
    registryResolver: resolver,
    layoutInspector: layoutInspector && typeof layoutInspector === "object" ? layoutInspector : null,
    layoutScopeResolver: typeof layoutScopeResolver === "function" ? layoutScopeResolver : null,
    layoutOperation: "move",
    layoutX: 0,
    layoutY: 0,
    layoutWidth: 320,
    layoutHeight: 80,
    layoutGap: 8,
    layoutStatus: null,
  };
}

function ensureInstalledLauncherCss(doc = getDocument()) {
  if (!doc?.createElement) return null;
  if (
    installedLauncherCssNode?.ownerDocument === doc &&
    (installedLauncherCssNode.parentElement || installedLauncherCssNode.parentNode)
  ) {
    return installedLauncherCssNode;
  }

  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = INSTALLED_LAUNCHER_CSS_PATH;
  link.setAttribute(LAUNCHER_CSS_ATTRIBUTE, "true");
  link.setAttribute("data-ui-editor-installed-css", INSTALLED_LAUNCHER_CSS_PATH);
  const target = doc.head || doc.body || doc.documentElement;
  target?.appendChild?.(link);
  installedLauncherCssNode = link;
  return link;
}

function loadInstalledLauncherButton({ doc = getDocument(), win = getWindow() } = {}) {
  const existing = getInstalledLauncherArtifact(win);
  if (existing) return Promise.resolve(existing);
  if (!doc?.createElement) return Promise.resolve(null);

  return new Promise((resolve) => {
    const script = doc.createElement("script");
    script.src = INSTALLED_LAUNCHER_SCRIPT_PATH;
    script.async = true;
    script.setAttribute("data-ui-editor-installed-script", INSTALLED_LAUNCHER_SCRIPT_PATH);
    script.onload = () => resolve(getInstalledLauncherArtifact(win));
    script.onerror = () => resolve(null);
    const target = doc.body || doc.head || doc.documentElement;
    target?.appendChild?.(script);
  });
}

function removeNode(node) {
  if (node?.parentElement?.removeChild) {
    node.parentElement.removeChild(node);
  } else if (node?.remove) {
    node.remove();
  }
}

function removeExistingLauncherStatus(doc = getDocument()) {
  launcherStatusNode?._uiEditorPanelController?.uninstall?.();
  removeNode(launcherStatusNode);
  removeNode(launcherStatusReopenNode);
  launcherStatusNode = null;
  launcherStatusContentNode = null;
  launcherStatusReopenNode = null;
}

function clearUiEditorTargetSelection(state = {}) {
  const target = state.selectedTargetNode || null;
  if (target?.setAttribute) {
    target.setAttribute(UI_EDITOR_SELECTED_ATTRIBUTE, "false");
    target.style.outline = state.selectedTargetPreviousStyle?.outline || "";
    target.style.boxShadow = state.selectedTargetPreviousStyle?.boxShadow || "";
  }
  state.selectedTargetNode = null;
  state.selectedElement = null;
  state.selectedTargetPreviousStyle = null;
  state.selectionMessage = "";
}

function clearUiEditorHoverSelection(state = {}) {
  state.hoverTargetNode = null;
  state.hoverElement = null;
  state.hoverMessage = "";
}

function removeLauncherTargetSelectionController(state = {}) {
  state.targetSelectionController?.uninstall?.();
  state.targetSelectionController = null;
  clearUiEditorTargetSelection(state);
  clearUiEditorHoverSelection(state);
}

function removeLauncherDocumentClickHandler() {
  if (launcherDocumentClickDocument?.removeEventListener && launcherDocumentClickHandler) {
    launcherDocumentClickDocument.removeEventListener("click", launcherDocumentClickHandler, true);
  }
  launcherDocumentClickDocument = null;
  launcherDocumentClickHandler = null;
}

function removeExistingLauncher(doc = getDocument()) {
  removeLauncherDocumentClickHandler();
  removeLauncherTargetSelectionController(launcherRuntimeState || {});
  launcherRuntimeState = null;
  removeNode(launcherHostNode);
  launcherHostNode = null;
  removeExistingLauncherStatus(doc);
  doc?.body?.setAttribute?.(UI_EDITOR_ACTIVE_ATTRIBUTE, "false");
}

function getStatusScopeLabel(activeUiScope = null) {
  const normalizedScope = String(activeUiScope == null ? "" : activeUiScope).trim();
  return normalizedScope || "nicht erkannt";
}

function getReadonlyRegisteredElementsText(registeredElements = null) {
  const elements = normalizeReadonlyRegisteredElements(registeredElements);
  if (elements.length < 1) return "Registrierte Elemente:\nnicht verfügbar";

  const lines = elements.map((element) => {
    const details = [element.label, element.area].filter(Boolean).join(" · ");
    return details ? `* ${element.id} (${details})` : `* ${element.id}`;
  });
  return ["Registrierte Elemente:", "", ...lines].join("\n");
}

function getLauncherStatusText({ activeUiScope = null, registeredElements = null } = {}) {
  return [
    "UI-Editor aktiv",
    `Scope: ${getStatusScopeLabel(activeUiScope)}`,
    "",
    getReadonlyRegisteredElementsText(registeredElements),
  ].join("\n");
}

function getReadonlyRegistryElementsText(registeredElements = null) {
  const elements = Array.isArray(registeredElements)
    ? registeredElements
    : normalizeReadonlyRegisteredElements(registeredElements);
  if (elements.length < 1) return "Registrierte Elemente:\nnicht verfuegbar";

  const lines = elements.map((element) => {
    const parent = element.parentId == null ? "null" : element.parentId;
    const allowedOps = Array.isArray(element.allowedOps) ? element.allowedOps.join(",") : "";
    const lockedOps = Array.isArray(element.lockedOps) ? element.lockedOps.join(",") : "";
    const details = [element.name, element.area].filter(Boolean).join(" · ");
    const title = details ? `* ${element.id} (${details})` : `* ${element.id}`;
    return [
      title,
      `  name: ${element.name || ""}`,
      `  type: ${element.type || ""}`,
      `  role: ${element.role || ""}`,
      `  parentId: ${parent}`,
      `  allowedOps: ${allowedOps}`,
      `  lockedOps: ${lockedOps}`,
    ].join("\n");
  });
  return ["Registrierte Elemente:", "", ...lines].join("\n");
}

function getAvailableUiScopesText(availableUiScopes = null) {
  const scopes = normalizeAvailableUiScopes(availableUiScopes);
  if (scopes.length < 1) return "Verfuegbare Scopes:\nnicht verfuegbar";

  return [
    "Verfuegbare Scopes:",
    "",
    ...scopes.map((scope) => {
      const details = [scope.moduleId, scope.status].filter(Boolean).join(" / ");
      return details ? `* ${scope.uiScope} (${details})` : `* ${scope.uiScope}`;
    }),
  ].join("\n");
}

function getSelectedRegistryFromState(state = {}) {
  return normalizeReadonlyRegistry(state.selectedRegistry || {
    uiScope: state.activeUiScope,
    elements: state.registeredElements,
  });
}

function getReadonlyLauncherStatusText(state = {}) {
  const registry = getSelectedRegistryFromState(state);
  const scopes = normalizeAvailableUiScopes(state.availableUiScopes);
  const selectedElement = state.selectedElement || null;
  const hoverElement = state.hoverElement || null;
  if (scopes.length < 1 && !registry.moduleId && registry.elements.length < 1) {
    return getLauncherStatusText({ activeUiScope: state.activeUiScope, registeredElements: [] });
  }
  return [
    "UI-Editor aktiv",
    getAvailableUiScopesText(scopes),
    "",
    `Scope: ${getStatusScopeLabel(registry.uiScope || state.activeUiScope)}`,
    `Modul: ${registry.moduleId || "nicht verfuegbar"}`,
    `Elemente: ${registry.elements.length}`,
    registry.ok === false && registry.reason ? `Hinweis: ${registry.reason}` : "",
    hoverElement ? `Hover: ${hoverElement.id}` : "Hover: keine",
    state.hoverMessage ? `Hover-Hinweis: ${state.hoverMessage}` : "",
    selectedElement ? `Auswahl: ${selectedElement.id}` : "Auswahl: keine",
    state.selectionMessage ? `Auswahl-Hinweis: ${state.selectionMessage}` : "",
    selectedElement ? `Name: ${selectedElement.name || selectedElement.label || ""}` : "",
    state.layoutStatus?.message ? `Layout: ${state.layoutStatus.message}` : "",
    state.layoutStatus?.reason ? `Layout-Grund: ${state.layoutStatus.reason}` : "",
    "",
    getReadonlyRegistryElementsText(registry.elements),
  ].filter((line) => line !== "").join("\n");
}

function getLauncherStatusContentNode(status) {
  return status?._uiEditorStatusContent || launcherStatusContentNode || status;
}

function ensureLauncherStatusHint(doc, host, state = {}) {
  if (
    launcherStatusNode?.ownerDocument === doc &&
    (launcherStatusNode.parentElement || launcherStatusNode.parentNode)
  ) {
    return launcherStatusNode;
  }
  if (!doc?.createElement || !host?.appendChild) return null;

  const status = doc.createElement("div");
  status.className = "ui-editor-launcher-status";
  status.setAttribute(LAUNCHER_STATUS_ATTRIBUTE, "true");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const header = doc.createElement("div");
  header.className = "ui-editor-launcher-status__header";
  header.setAttribute("data-ui-editor-status-header", "true");
  const title = doc.createElement("span");
  title.textContent = "UI-Editor · Erkennung";
  const actions = doc.createElement("span");
  actions.className = "ui-editor-launcher-status__actions";
  const collapseButton = doc.createElement("button");
  collapseButton.type = "button";
  collapseButton.className = "ui-editor-launcher-status__action";
  collapseButton.textContent = "–";
  collapseButton.title = "Einklappen";
  collapseButton.setAttribute("data-ui-editor-status-collapse", "true");
  const hideButton = doc.createElement("button");
  hideButton.type = "button";
  hideButton.className = "ui-editor-launcher-status__action";
  hideButton.textContent = "×";
  hideButton.title = "Ausblenden";
  hideButton.setAttribute("data-ui-editor-status-hide", "true");
  actions.append(collapseButton, hideButton);
  header.append(title, actions);

  const content = doc.createElement("div");
  content.className = "ui-editor-launcher-status__content";
  content.setAttribute("data-ui-editor-status-content", "true");
  content.textContent = getReadonlyLauncherStatusText(state);
  status._uiEditorStatusContent = content;
  status.append(header, content);

  const reopen = doc.createElement("button");
  reopen.type = "button";
  reopen.className = "ui-editor-launcher-status-reopen";
  reopen.textContent = "UI";
  reopen.title = "UI-Editor-Erkennung einblenden";
  reopen.setAttribute("data-ui-editor-status-reopen", "true");
  reopen.style.display = "none";

  host.appendChild(status);
  host.appendChild(reopen);
  launcherStatusNode = status;
  launcherStatusContentNode = content;
  launcherStatusReopenNode = reopen;

  const panelController = getInstalledTargetSelectionArtifact()?.createTargetSelectionPanelController?.({
    document: doc,
    window: state.win || getWindow(),
    panelElement: status,
    headerElement: header,
    contentElement: content,
    collapseButton,
    hideButton,
    reopenButton: reopen,
  });
  panelController?.install?.();
  status._uiEditorPanelController = panelController || null;
  state.targetSelectionPanelController = panelController || null;
  return status;
}

function updateLauncherStatusHint(doc, host, state = {}) {
  const status = ensureLauncherStatusHint(doc, host, state);
  const content = getLauncherStatusContentNode(status);
  if (content) {
    while (content.firstChild && typeof content.removeChild === "function") {
      content.removeChild(content.firstChild);
    }
    if (Array.isArray(content.children)) content.children = [];
    content.textContent = getReadonlyLauncherStatusText(state);
  }
  return status;
}

function getLayoutScopeForState(state = {}) {
  if (typeof state.layoutScopeResolver !== "function") return null;
  const registry = getSelectedRegistryFromState(state);
  const scope = state.layoutScopeResolver(registry.uiScope || state.activeUiScope);
  const normalizedScope = String(scope == null ? "" : scope).trim();
  return normalizedScope || null;
}

function getLayoutPanelForState(state = {}) {
  const layoutScope = getLayoutScopeForState(state);
  const elementId = String(state.selectedElement?.id || "").trim();
  if (!state.layoutInspector || !layoutScope || !elementId) return null;
  if (typeof state.layoutInspector.getLayoutControlPanel !== "function") return null;
  return state.layoutInspector.getLayoutControlPanel(layoutScope, elementId);
}

function getSafeLayoutOperations(panel = null) {
  const applyControl = Array.isArray(panel?.controls)
    ? panel.controls.find((control) => control.id === "editor.layout.applySave")
    : null;
  return Array.isArray(applyControl?.allowedOps) ? applyControl.allowedOps : [];
}

function ensureLayoutOperation(state = {}, operations = []) {
  if (operations.includes(state.layoutOperation)) return state.layoutOperation;
  state.layoutOperation = operations[0] || "move";
  return state.layoutOperation;
}

function createNeutralLayoutPayload(state = {}) {
  const operation = String(state.layoutOperation || "").trim();
  if (operation === "move") {
    return {
      x: Number(state.layoutX) || 0,
      y: Number(state.layoutY) || 0,
    };
  }
  if (operation === "resize") {
    return {
      width: Number(state.layoutWidth) || 320,
      height: Number(state.layoutHeight) || 80,
    };
  }
  if (operation === "width") return { width: Number(state.layoutWidth) || 320 };
  if (operation === "height") return { height: Number(state.layoutHeight) || 80 };
  if (operation === "spacing") return { gap: Number(state.layoutGap) || 8 };
  return {};
}

function appendLayoutNumberInput(doc, container, { label, value, onInput }) {
  const wrapper = doc.createElement("label");
  wrapper.className = "ui-editor-layout-control__field";
  const labelNode = doc.createElement("span");
  labelNode.textContent = label;
  const input = doc.createElement("input");
  input.type = "number";
  input.value = String(value);
  input.setAttribute("data-ui-editor-layout-input", label);
  input.addEventListener("input", () => onInput(input.value));
  wrapper.append(labelNode, input);
  container.appendChild(wrapper);
  return input;
}

function renderLayoutPayloadInputs(doc, container, state = {}) {
  const operation = String(state.layoutOperation || "").trim();
  if (operation === "move") {
    appendLayoutNumberInput(doc, container, {
      label: "x",
      value: state.layoutX,
      onInput: (nextValue) => {
        state.layoutX = nextValue;
      },
    });
    appendLayoutNumberInput(doc, container, {
      label: "y",
      value: state.layoutY,
      onInput: (nextValue) => {
        state.layoutY = nextValue;
      },
    });
  } else if (operation === "resize") {
    appendLayoutNumberInput(doc, container, {
      label: "width",
      value: state.layoutWidth,
      onInput: (nextValue) => {
        state.layoutWidth = nextValue;
      },
    });
    appendLayoutNumberInput(doc, container, {
      label: "height",
      value: state.layoutHeight,
      onInput: (nextValue) => {
        state.layoutHeight = nextValue;
      },
    });
  } else if (operation === "width") {
    appendLayoutNumberInput(doc, container, {
      label: "width",
      value: state.layoutWidth,
      onInput: (nextValue) => {
        state.layoutWidth = nextValue;
      },
    });
  } else if (operation === "height") {
    appendLayoutNumberInput(doc, container, {
      label: "height",
      value: state.layoutHeight,
      onInput: (nextValue) => {
        state.layoutHeight = nextValue;
      },
    });
  } else if (operation === "spacing") {
    appendLayoutNumberInput(doc, container, {
      label: "gap",
      value: state.layoutGap,
      onInput: (nextValue) => {
        state.layoutGap = nextValue;
      },
    });
  }
}

function refreshLauncherPanel(doc, host, state = {}) {
  const status = updateLauncherStatusHint(doc, host, state);
  renderReadonlyScopeButtons(doc, status, state);
  renderLayoutControls(doc, status, state);
  return status;
}

function renderLayoutControls(doc, status, state = {}) {
  const content = getLauncherStatusContentNode(status);
  if (!doc?.createElement || !content) return null;

  const layoutScope = getLayoutScopeForState(state);
  const panel = getLayoutPanelForState(state);
  const selectedElement = state.selectedElement || null;
  const section = doc.createElement("div");
  section.className = "ui-editor-layout-control";
  section.setAttribute("data-ui-editor-layout-controls", "true");

  const title = doc.createElement("strong");
  title.textContent = "Layout";
  section.appendChild(title);

  const selected = doc.createElement("div");
  selected.setAttribute("data-ui-editor-layout-selected", "true");
  selected.textContent = selectedElement
    ? `Ausgewaehltes Element: ${selectedElement.id}`
    : "Ausgewaehltes Element: keine registrierte Auswahl";
  section.appendChild(selected);

  const scopeLine = doc.createElement("div");
  scopeLine.textContent = layoutScope ? `Layout-Scope: ${layoutScope}` : "Layout-Scope: nicht verfuegbar";
  section.appendChild(scopeLine);

  if (!selectedElement || !layoutScope || !state.layoutInspector) {
    const empty = doc.createElement("div");
    empty.setAttribute("data-ui-editor-layout-message", "true");
    empty.textContent = "Layoutbedienung wartet auf eine registrierte Auswahl.";
    section.appendChild(empty);
    content.appendChild(section);
    return section;
  }

  if (!panel?.ok) {
    const blocked = doc.createElement("div");
    blocked.setAttribute("data-ui-editor-layout-message", "true");
    blocked.textContent = panel?.status?.message || "Layoutbedienung blockiert.";
    section.appendChild(blocked);
    content.appendChild(section);
    return section;
  }

  const operations = getSafeLayoutOperations(panel);
  const operation = ensureLayoutOperation(state, operations);
  const controlsRow = doc.createElement("div");
  controlsRow.className = "ui-editor-layout-control__row";

  const operationLabel = doc.createElement("label");
  operationLabel.className = "ui-editor-layout-control__field";
  const operationLabelText = doc.createElement("span");
  operationLabelText.textContent = "Operation";
  const operationSelect = doc.createElement("select");
  operationSelect.setAttribute("data-ui-editor-layout-operation", "true");
  for (const safeOperation of operations) {
    const option = doc.createElement("option");
    option.value = safeOperation;
    option.textContent = safeOperation;
    if (safeOperation === operation) option.selected = true;
    operationSelect.appendChild(option);
  }
  operationSelect.addEventListener("change", () => {
    state.layoutOperation = operationSelect.value;
    refreshLauncherPanel(doc, status.parentElement, state);
  });
  operationLabel.append(operationLabelText, operationSelect);
  controlsRow.appendChild(operationLabel);
  renderLayoutPayloadInputs(doc, controlsRow, state);
  section.appendChild(controlsRow);

  const buttonRow = doc.createElement("div");
  buttonRow.className = "ui-editor-layout-control__buttons";

  const saveButton = doc.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "Anwenden/Speichern";
  saveButton.setAttribute("data-ui-editor-layout-action", "applySave");
  saveButton.disabled = operations.length < 1;
  saveButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = state.layoutInspector.applyLayoutChange(layoutScope, {
      elementId: selectedElement.id,
      operation: state.layoutOperation,
      payload: createNeutralLayoutPayload(state),
    });
    state.layoutStatus = result.status || null;
    refreshLauncherPanel(doc, status.parentElement, state);
  });

  const loadButton = doc.createElement("button");
  loadButton.type = "button";
  loadButton.textContent = "Laden";
  loadButton.setAttribute("data-ui-editor-layout-action", "loadSaved");
  loadButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = state.layoutInspector.loadLayoutState(layoutScope, {
      elementId: selectedElement.id,
    });
    state.layoutStatus = result.status || null;
    refreshLauncherPanel(doc, status.parentElement, state);
  });

  const resetButton = doc.createElement("button");
  resetButton.type = "button";
  resetButton.textContent = "Reset";
  resetButton.setAttribute("data-ui-editor-layout-action", "resetDefault");
  resetButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = state.layoutInspector.resetLayoutState(layoutScope, {
      elementId: selectedElement.id,
    });
    state.layoutStatus = result.status || null;
    refreshLauncherPanel(doc, status.parentElement, state);
  });

  buttonRow.append(saveButton, loadButton, resetButton);
  section.appendChild(buttonRow);

  const stateLine = doc.createElement("div");
  stateLine.setAttribute("data-ui-editor-layout-state", "true");
  stateLine.textContent = panel.currentLayoutEntry
    ? `Gespeichert: ${panel.currentLayoutEntry.operation}`
    : panel.status.message;
  section.appendChild(stateLine);

  content.appendChild(section);
  return section;
}

function setActiveScopeInState(state, nextScope) {
  const normalizedScope = String(nextScope == null ? "" : nextScope).trim();
  removeLauncherTargetSelectionController(state);
  state.activeUiScope = normalizedScope;
  state.selectedRegistry = state.registryResolver
    ? normalizeReadonlyRegistry(state.registryResolver(normalizedScope))
    : normalizeReadonlyRegistry({ uiScope: normalizedScope, elements: [] });
  state.layoutStatus = null;
}

function installLauncherTargetSelectionController(doc, host, state) {
  if (!state?.uiEditorLauncherActive || !doc?.addEventListener) return null;
  removeLauncherTargetSelectionController(state);
  const targetSelectionArtifact = getInstalledTargetSelectionArtifact();
  const registry = getSelectedRegistryFromState(state);
  const controller = targetSelectionArtifact?.createTargetSelectionController?.({
    document: doc,
    root: doc,
    activeScopeId: registry.uiScope || state.activeUiScope,
    registry,
    onHoverChange(selection) {
      state.hoverElement = selection.element;
      state.hoverTargetNode = selection.targetElement;
      state.hoverMessage = selection.message || "";
      refreshLauncherPanel(doc, host, state);
    },
    onSelectionChange(selection) {
      state.selectedElement = selection.element;
      state.selectedTargetNode = selection.targetElement;
      state.selectionMessage = selection.message || "";
      state.layoutStatus = null;
      refreshLauncherPanel(doc, host, state);
    },
  });
  controller?.install?.();
  state.targetSelectionController = controller || null;
  return controller || null;
}

function renderReadonlyScopeButtons(doc, status, state) {
  const scopes = normalizeAvailableUiScopes(state.availableUiScopes);
  if (!doc?.createElement || !status || scopes.length < 1) return;

  const scopeList = doc.createElement("div");
  scopeList.setAttribute("data-ui-editor-scope-list", "true");
  scopeList.setAttribute("aria-label", "UI-Editor Scopes");

  for (const scope of scopes) {
    const button = doc.createElement("button");
    button.type = "button";
    button.textContent = scope.uiScope;
    button.setAttribute("data-ui-editor-scope-option", scope.uiScope);
    button.setAttribute("aria-pressed", scope.uiScope === state.activeUiScope ? "true" : "false");
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setActiveScopeInState(state, scope.uiScope);
      const updatedStatus = refreshLauncherPanel(doc, status.parentElement, state);
      installLauncherTargetSelectionController(doc, status.parentElement, state);
    });
    scopeList.appendChild(button);
  }

  getLauncherStatusContentNode(status)?.appendChild(scopeList);
}

function syncLauncherButtonState(button, state, { doc = getDocument(), host = null } = {}) {
  const active = !!state?.uiEditorLauncherActive;
  button.dataset.uiEditorLauncherActive = active ? "true" : "false";
  button.setAttribute("data-ui-editor-launcher-active", active ? "true" : "false");
  button.setAttribute("aria-pressed", active ? "true" : "false");
  doc?.body?.setAttribute?.(UI_EDITOR_ACTIVE_ATTRIBUTE, active ? "true" : "false");

  if (active) {
    const status = refreshLauncherPanel(doc, host || button.parentElement, state);
    installLauncherTargetSelectionController(doc, host || button.parentElement, state);
  } else {
    removeLauncherTargetSelectionController(state);
    removeExistingLauncherStatus(doc);
  }
}

function findClickedUiEditorTarget(event) {
  const target = event?.target || null;
  return typeof target?.closest === "function" ? target.closest("[data-ui-editor-id]") : null;
}

function getRegisteredElementById(state = {}, uiEditorId = "") {
  const normalizedId = String(uiEditorId || "").trim();
  if (!normalizedId) return null;
  const registry = getSelectedRegistryFromState(state);
  return registry.elements.find((element) => element.id === normalizedId) || null;
}

function markUiEditorTargetSelection(state, targetNode, registryElement) {
  clearUiEditorTargetSelection(state);
  state.selectedTargetNode = targetNode;
  state.selectedElement = registryElement;
  state.selectedTargetPreviousStyle = {
    outline: targetNode.style.outline || "",
    boxShadow: targetNode.style.boxShadow || "",
  };
  targetNode.setAttribute(UI_EDITOR_SELECTED_ATTRIBUTE, "true");
  targetNode.style.outline = "2px solid #2563eb";
  targetNode.style.boxShadow = "0 0 0 4px rgb(37 99 235 / 18%)";
}

function handleUiEditorDocumentClick(event, { state, doc, host }) {
  if (!state?.uiEditorLauncherActive) return;
  const targetNode = findClickedUiEditorTarget(event);
  const uiEditorId = String(targetNode?.getAttribute?.("data-ui-editor-id") || "").trim();
  const registryElement = getRegisteredElementById(state, uiEditorId);
  if (!targetNode || !registryElement) return;

  event?.preventDefault?.();
  event?.stopPropagation?.();
  markUiEditorTargetSelection(state, targetNode, registryElement);
  state.layoutStatus = null;
  refreshLauncherPanel(doc, host, state);
}

function installLauncherDocumentClickHandler(doc, host, state) {
  removeLauncherDocumentClickHandler();
  if (!doc?.addEventListener) return;
  launcherDocumentClickHandler = (event) => handleUiEditorDocumentClick(event, { state, doc, host });
  launcherDocumentClickDocument = doc;
  doc.addEventListener("click", launcherDocumentClickHandler, true);
}

function renderLauncherButton({ artifact, doc, host, state, onToggle = null }) {
  if (!artifact?.id || !doc?.createElement || !host?.appendChild) return null;

  removeExistingLauncher(doc);

  const button = doc.createElement("button");
  button.type = "button";
  button.id = artifact.id;
  button.className = "ui-editor-launcher-button";
  button.textContent = "UI-Editor";
  button.title = "UI-Editor";
  button.setAttribute(LAUNCHER_HOST_ATTRIBUTE, "true");
  button.setAttribute("data-ui-editor-installed-artifact", "uiEditor/uiEditorLauncherButton.js");
  button.setAttribute("data-ui-editor-launcher-id", artifact.id);
  button.setAttribute("data-ui-editor-launcher-role", artifact.role || "editor-launcher");
  button.setAttribute("data-ui-editor-active-ui-scope", state.activeUiScope == null ? "" : String(state.activeUiScope));
  button.setAttribute("aria-label", "UI-Editor");
  syncLauncherButtonState(button, state, { doc, host });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    state.uiEditorLauncherActive = !state.uiEditorLauncherActive;
    syncLauncherButtonState(button, state, { doc, host });
    if (typeof onToggle === "function") {
      onToggle({
        uiEditorLauncherActive: state.uiEditorLauncherActive,
        activeUiScope: state.activeUiScope || null,
        launcherId: artifact.id,
      });
    }
  });

  host.appendChild(button);
  launcherHostNode = button;
  launcherRuntimeState = state;
  return button;
}

function isRuntimeLauncherDevEnabled({ header = null, devEnabled = null } = {}) {
  if (typeof devEnabled === "boolean") return devEnabled;
  if (typeof header?._isUiEditorEnabled === "function") return header._isUiEditorEnabled() === true;
  return false;
}

export async function installBbmUiEditorRuntimeLauncher({
  header = null,
  devEnabled = null,
  activeUiScope = null,
  registeredElements = null,
  availableUiScopes = null,
  registryResolver = null,
  layoutInspector = null,
  layoutScopeResolver = null,
  doc = getDocument(),
  win = getWindow(),
  host = null,
  onToggle = null,
} = {}) {
  if (!isRuntimeLauncherDevEnabled({ header, devEnabled })) {
    removeExistingLauncher(doc);
    return null;
  }

  ensureInstalledLauncherCss(doc);
  const artifact = await loadInstalledLauncherButton({ doc, win });
  const launcherHost = getLauncherHost(doc, host);
  const state = createLauncherState({
    activeUiScope,
    registeredElements,
    availableUiScopes,
    registryResolver,
    layoutInspector,
    layoutScopeResolver,
  });
  state.win = win || null;
  return renderLauncherButton({ artifact, doc, host: launcherHost, state, onToggle });
}

export {
  INSTALLED_LAUNCHER_SCRIPT_PATH,
  INSTALLED_LAUNCHER_CSS_PATH,
  createLauncherState,
  ensureInstalledLauncherCss,
  getInstalledLauncherArtifact,
  getInstalledTargetSelectionArtifact,
  isRuntimeLauncherDevEnabled,
  loadInstalledLauncherButton,
  getStatusScopeLabel,
  getReadonlyRegisteredElementsText,
  getReadonlyRegistryElementsText,
  getAvailableUiScopesText,
  getLauncherStatusText,
  getReadonlyLauncherStatusText,
  normalizeReadonlyRegisteredElements,
  normalizeAvailableUiScopes,
  ensureLauncherStatusHint,
  findClickedUiEditorTarget,
  getRegisteredElementById,
  handleUiEditorDocumentClick,
  renderLauncherButton,
};
