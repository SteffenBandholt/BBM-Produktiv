import * as installedLauncherButtonArtifactModule from "../../../uiEditor/uiEditorLauncherButton.js";

void installedLauncherButtonArtifactModule;

const INSTALLED_LAUNCHER_SCRIPT_PATH = "../../uiEditor/uiEditorLauncherButton.js";
const INSTALLED_LAUNCHER_CSS_PATH = "../../uiEditor/uiEditorLauncherButton.css";
const LAUNCHER_HOST_ATTRIBUTE = "data-ui-editor-launcher-host";
const LAUNCHER_CSS_ATTRIBUTE = "data-ui-editor-launcher-css";
const LAUNCHER_STATUS_ATTRIBUTE = "data-ui-editor-launcher-status";
const UI_EDITOR_ACTIVE_ATTRIBUTE = "data-ui-editor-active";

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

function createLauncherState({ activeUiScope = null } = {}) {
  return {
    uiEditorLauncherActive: false,
    activeUiScope,
  };
}

function ensureInstalledLauncherCss(doc = getDocument()) {
  if (!doc?.createElement) return null;
  const existing = doc.querySelector?.(`link[${LAUNCHER_CSS_ATTRIBUTE}="true"]`);
  if (existing) return existing;

  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = INSTALLED_LAUNCHER_CSS_PATH;
  link.setAttribute(LAUNCHER_CSS_ATTRIBUTE, "true");
  link.setAttribute("data-ui-editor-installed-css", INSTALLED_LAUNCHER_CSS_PATH);
  const target = doc.head || doc.body || doc.documentElement;
  target?.appendChild?.(link);
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
  const existing = doc?.querySelector?.(`[${LAUNCHER_STATUS_ATTRIBUTE}="true"]`);
  removeNode(existing);
}

function removeExistingLauncher(doc = getDocument()) {
  const existing = doc?.querySelector?.(`[${LAUNCHER_HOST_ATTRIBUTE}="true"]`);
  removeNode(existing);
  removeExistingLauncherStatus(doc);
  doc?.body?.setAttribute?.(UI_EDITOR_ACTIVE_ATTRIBUTE, "false");
}

function ensureLauncherStatusHint(doc, host) {
  const existing = doc?.querySelector?.(`[${LAUNCHER_STATUS_ATTRIBUTE}="true"]`);
  if (existing) return existing;
  if (!doc?.createElement || !host?.appendChild) return null;

  const status = doc.createElement("div");
  status.className = "ui-editor-launcher-status";
  status.textContent = "UI-Editor aktiv";
  status.setAttribute(LAUNCHER_STATUS_ATTRIBUTE, "true");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  host.appendChild(status);
  return status;
}

function syncLauncherButtonState(button, state, { doc = getDocument(), host = null } = {}) {
  const active = !!state?.uiEditorLauncherActive;
  button.dataset.uiEditorLauncherActive = active ? "true" : "false";
  button.setAttribute("data-ui-editor-launcher-active", active ? "true" : "false");
  button.setAttribute("aria-pressed", active ? "true" : "false");
  doc?.body?.setAttribute?.(UI_EDITOR_ACTIVE_ATTRIBUTE, active ? "true" : "false");

  if (active) {
    ensureLauncherStatusHint(doc, host || button.parentElement);
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
        activeUiScope: state.activeUiScope,
        launcherId: artifact.id,
      });
    }
  });

  host.appendChild(button);
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
  const state = createLauncherState({ activeUiScope });
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
  ensureLauncherStatusHint,
  renderLauncherButton,
};
