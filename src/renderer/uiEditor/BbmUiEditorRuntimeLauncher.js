import * as installedLauncherButtonArtifactModule from "../../../uiEditor/uiEditorLauncherButton.js";

void installedLauncherButtonArtifactModule;

const INSTALLED_LAUNCHER_SCRIPT_PATH = "../../uiEditor/uiEditorLauncherButton.js";
const INSTALLED_LAUNCHER_CSS_PATH = "../../uiEditor/uiEditorLauncherButton.css";
const LAUNCHER_HOST_ATTRIBUTE = "data-ui-editor-launcher-host";
const LAUNCHER_CSS_ATTRIBUTE = "data-ui-editor-launcher-css";
const LAUNCHER_STATUS_ATTRIBUTE = "data-ui-editor-launcher-status";
const UI_EDITOR_ACTIVE_ATTRIBUTE = "data-ui-editor-active";

let installedLauncherCssNode = null;
let launcherHostNode = null;
let launcherStatusNode = null;

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

function createLauncherState({ activeUiScope = null, registeredElements = null, availableUiScopes = null, registryResolver = null } = {}) {
  const normalizedScope = String(activeUiScope == null ? "" : activeUiScope).trim();
  const resolver = typeof registryResolver === "function" ? registryResolver : null;
  const selectedRegistry = resolver && normalizedScope
    ? normalizeReadonlyRegistry(resolver(normalizedScope))
    : normalizeReadonlyRegistry({ uiScope: normalizedScope, elements: registeredElements });

  return {
    uiEditorLauncherActive: false,
    activeUiScope: normalizedScope,
    selectedRegistry,
    availableUiScopes: normalizeAvailableUiScopes(availableUiScopes),
    registryResolver: resolver,
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
  removeNode(launcherStatusNode);
  launcherStatusNode = null;
}

function removeExistingLauncher(doc = getDocument()) {
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
    "",
    getReadonlyRegistryElementsText(registry.elements),
  ].filter((line) => line !== "").join("\n");
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
  status.textContent = getReadonlyLauncherStatusText(state);
  status.setAttribute(LAUNCHER_STATUS_ATTRIBUTE, "true");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  host.appendChild(status);
  launcherStatusNode = status;
  return status;
}

function updateLauncherStatusHint(doc, host, state = {}) {
  const status = ensureLauncherStatusHint(doc, host, state);
  if (status) status.textContent = getReadonlyLauncherStatusText(state);
  return status;
}

function setActiveScopeInState(state, nextScope) {
  const normalizedScope = String(nextScope == null ? "" : nextScope).trim();
  state.activeUiScope = normalizedScope;
  state.selectedRegistry = state.registryResolver
    ? normalizeReadonlyRegistry(state.registryResolver(normalizedScope))
    : normalizeReadonlyRegistry({ uiScope: normalizedScope, elements: [] });
}

function renderReadonlyScopeButtons(doc, status, state) {
  const scopes = normalizeAvailableUiScopes(state.availableUiScopes);
  if (!doc?.createElement || !status?.appendChild || scopes.length < 1) return;

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
      const updatedStatus = updateLauncherStatusHint(doc, status.parentElement, state);
      renderReadonlyScopeButtons(doc, updatedStatus, state);
    });
    scopeList.appendChild(button);
  }

  status.appendChild(scopeList);
}

function syncLauncherButtonState(button, state, { doc = getDocument(), host = null } = {}) {
  const active = !!state?.uiEditorLauncherActive;
  button.dataset.uiEditorLauncherActive = active ? "true" : "false";
  button.setAttribute("data-ui-editor-launcher-active", active ? "true" : "false");
  button.setAttribute("aria-pressed", active ? "true" : "false");
  doc?.body?.setAttribute?.(UI_EDITOR_ACTIVE_ATTRIBUTE, active ? "true" : "false");

  if (active) {
    const status = updateLauncherStatusHint(doc, host || button.parentElement, state);
    renderReadonlyScopeButtons(doc, status, state);
  } else {
    removeExistingLauncherStatus(doc);
  }
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
  const state = createLauncherState({ activeUiScope, registeredElements, availableUiScopes, registryResolver });
  return renderLauncherButton({ artifact, doc, host: launcherHost, state, onToggle });
}

export {
  INSTALLED_LAUNCHER_SCRIPT_PATH,
  INSTALLED_LAUNCHER_CSS_PATH,
  createLauncherState,
  ensureInstalledLauncherCss,
  getInstalledLauncherArtifact,
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
  renderLauncherButton,
};
