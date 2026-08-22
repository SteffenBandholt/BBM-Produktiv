import {
  createM80RegistrationDescriptor,
  inspectM80ScopeRegistration,
  refreshM80StartupLayoutAfterRegistryMount,
} from "../ui-editor/m80HostAdapter.js";
import { beginM83ComponentBinding, completeM80PilotRender, registerM80Ref } from "../ui-editor/m80Refs.js";
import {
  PROTOKOLL_MAIN_HEADER_LAUNCHER,
  RESTARBEITEN_MAIN_HEADER_LAUNCHER,
  getMainHeaderLauncherContract,
} from "../ui/MainHeader.uiEditorContract.js";
import { getActiveGlobalModuleNavigation } from "./modules/moduleNavigation.js";
import { isModuleActive } from "./modules/moduleAccessState.js";

const REGISTRY_STATUS_SUCCESS_DURATION_MS = 2400;
const REGISTRY_STATUS_ERROR_DURATION_MS = 6000;
let registryStatusRemovalTimer = null;

function showRegistryRefreshStatus(message, state = "checking") {
  const doc = globalThis.document;
  if (!doc?.body || typeof doc.createElement !== "function") return;
  if (registryStatusRemovalTimer) {
    clearTimeout(registryStatusRemovalTimer);
    registryStatusRemovalTimer = null;
  }
  let status = doc.querySelector?.("[data-bbm-ui-editor-registry-status]");
  if (!status) {
    status = doc.createElement("div");
    status.setAttribute("data-bbm-ui-editor-registry-status", "true");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:2147482000;pointer-events:none;padding:9px 12px;border-radius:8px;background:#172033;color:#fff;box-shadow:0 8px 24px rgba(15,23,42,.24);font:600 12px/1.3 system-ui,sans-serif";
    doc.body.appendChild(status);
  }
  status.dataset.state = state;
  status.textContent = message;
  if (state !== "checking") {
    const duration = state === "blocked" ? REGISTRY_STATUS_ERROR_DURATION_MS : REGISTRY_STATUS_SUCCESS_DURATION_MS;
    registryStatusRemovalTimer = setTimeout(() => {
      status.remove?.();
      registryStatusRemovalTimer = null;
    }, duration);
  }
}

export const DEVELOPMENT_UI_EDITOR_BUTTON_LABEL = "UI-Editor öffnen";

const MAIN_HEADER_LAUNCHER_COMPONENT_IDS = Object.freeze([
  RESTARBEITEN_MAIN_HEADER_LAUNCHER.componentId,
  PROTOKOLL_MAIN_HEADER_LAUNCHER.componentId,
]);

function isRegisteredMainHeaderLauncher(scopeId) {
  const launcher = getMainHeaderLauncherContract(scopeId);
  return Boolean(launcher && MAIN_HEADER_LAUNCHER_COMPONENT_IDS.includes(launcher.componentId));
}

export function clearDevelopmentUiEditorOpenButtonRefs() {
  MAIN_HEADER_LAUNCHER_COMPONENT_IDS.forEach((componentId) => beginM83ComponentBinding(componentId));
}

export function bindDevelopmentUiEditorOpenButtonRef({ scopeId, button } = {}) {
  const launcher = getMainHeaderLauncherContract(scopeId);
  if (!launcher || !MAIN_HEADER_LAUNCHER_COMPONENT_IDS.includes(launcher.componentId) || !button || typeof button.setAttribute !== "function") return false;
  beginM83ComponentBinding(launcher.componentId);
  registerM80Ref(launcher.elementId, button);
  completeM80PilotRender();
  return true;
}

export async function isDevelopmentUiEditorBuild({ api = globalThis.window?.bbmDb } = {}) {
  if (typeof api?.appGetBuildChannel !== "function") return false;
  try {
    const result = await api.appGetBuildChannel();
    return result?.ok === true && String(result?.channel || "").trim().toUpperCase() === "DEV";
  } catch (_error) {
    return false;
  }
}

export async function openNativeUiEditor(context = {}) {
  const api = context?.api || window.uiEditor;
  if (!api || typeof api.open !== "function") {
    alert("Der separate UI-Editor ist nicht installiert oder die sichere BBM-Brücke ist nicht verfügbar.");
    return { ok: false, errorCode: "electron_editor_not_installed" };
  }
  if (typeof api.preparePdfContext === "function" && context?.projectId && context?.meetingId) {
    await api.preparePdfContext({ projectId: context?.projectId || null, meetingId: context?.meetingId || null });
  }
  const activeScopeId = String(context?.scopeId || "").trim();
  if (activeScopeId && context?.launcherButton && isRegisteredMainHeaderLauncher(activeScopeId)) {
    bindDevelopmentUiEditorOpenButtonRef({ scopeId: activeScopeId, button: context.launcherButton });
  }
  let registration = createM80RegistrationDescriptor();
  if (activeScopeId && !registration.activeScopes.includes(activeScopeId)) {
    console.info("[ui-editor] scope registration before refresh", inspectM80ScopeRegistration(activeScopeId));
    await refreshM80StartupLayoutAfterRegistryMount();
    registration = createM80RegistrationDescriptor();
  }
  if (activeScopeId) console.info("[ui-editor] scope registration before open", inspectM80ScopeRegistration(activeScopeId));
  if (activeScopeId && !registration.activeScopes.includes(activeScopeId)) {
    const message = "Der UI-Editor kann für den aktuellen Entwicklungsbereich nicht geöffnet werden, weil der erwartete Scope nicht vollständig registriert ist.";
    showRegistryRefreshStatus(message, "blocked");
    alert(message);
    return { ok: false, errorCode: "electron_editor_scope_not_active" };
  }

  showRegistryRefreshStatus("UI-Registry wird geprüft …", "checking");
  const result = await api.open(registration);
  if (result?.ok) {
    showRegistryRefreshStatus(result.registryRefreshStatus === "changed" ? "UI-Registry aktualisiert." : "UI-Registry ist aktuell.", result.registryRefreshStatus || "current");
  } else {
    showRegistryRefreshStatus(result?.message || "UI-Registry konnte nicht freigegeben werden.", "blocked");
  }
  if (!result?.ok && result?.errorCode !== "electron_profile_user_cancelled") {
    alert(result?.message || "Der separate UI-Editor konnte nicht gestartet werden.");
  }

  if (result?.ok && activeScopeId) {
    const scopeResult = typeof api.sendTargetEvent === "function"
      ? await api.sendTargetEvent({ action: "scopeChanged", scopeId: activeScopeId, registration })
      : { ok: false, errorCode: "electron_editor_scope_activation_unavailable" };
    if (!scopeResult?.ok) {
      const message = "Der UI-Editor wurde geöffnet, aber der aktuelle Entwicklungsbereich konnte nicht aktiviert werden.";
      showRegistryRefreshStatus(message, "blocked");
      alert(message);
      return { ok: false, errorCode: scopeResult?.errorCode || "electron_editor_scope_activation_failed" };
    }
  }

  return result;
}

export async function installDevelopmentUiEditorOpenButton({
  host,
  scopeId,
  doc = globalThis.document,
  buildApi = globalThis.window?.bbmDb,
  uiEditorApi = globalThis.window?.uiEditor,
} = {}) {
  if (!host || !doc?.createElement || !await isDevelopmentUiEditorBuild({ api: buildApi })) return null;
  if (host.querySelector?.('[data-bbm-development-ui-editor-open="true"]')) return null;

  const registeredLauncher = isRegisteredMainHeaderLauncher(scopeId);
  const button = doc.createElement("button");
  button.type = "button";
  button.className = "bbm-development-ui-editor-open-button";
  button.textContent = DEVELOPMENT_UI_EDITOR_BUTTON_LABEL;
  button.setAttribute("data-bbm-development-ui-editor-open", "true");
  button.style.cssText = "display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;height:18px;min-height:18px;padding:1px 8px;border:1px solid #d3dfec;border-radius:7px;background:#f5f8fc;color:#1f344a;font:600 8.5pt/1.2 var(--bbm-font-ui,system-ui,sans-serif);white-space:nowrap;cursor:pointer;";
  button.addEventListener("click", async () => {
    if (button.disabled) return;
    button.disabled = true;
    try {
      await openNativeUiEditor({ scopeId, api: uiEditorApi, ...(registeredLauncher ? { launcherButton: button } : {}) });
    } catch (error) {
      const code = String(error?.code || error?.name || "ui_editor_open_error");
      const message = String(error?.message || error || "Unbekannter Fehler beim Öffnen des UI-Editors.");
      console.error("[ui-editor] open button failed", error);
      showRegistryRefreshStatus(`${code}: ${message}`, "blocked");
      alert(`${code}\n${message}`);
    } finally {
      button.disabled = false;
    }
  });
  host.appendChild(button);
  if (registeredLauncher) {
    clearDevelopmentUiEditorOpenButtonRefs();
    bindDevelopmentUiEditorOpenButtonRef({ scopeId, button });
  }
  return button;
}

export function createCoreShellNavigationRouteDefs(router) {
  const moduleRoutes = getActiveGlobalModuleNavigation()
    .filter((entry) => isModuleActive(entry.moduleId))
    .map((entry) => ({
      key: entry.key,
      label: entry.label,
      onClick: () => router.openGlobalModule(entry.moduleId, { navigationKey: entry.key }),
    }));
  return [
    { key: "home", label: "Start", onClick: () => router.showHome() },
    { key: "projects", label: "Projekte", onClick: () => router.showProjects() },
    ...moduleRoutes,
    { key: "firms", label: "Firmen", onClick: () => router.showFirms() },
    { key: "settings", label: "Einstellungen", onClick: () => router.showSettings() },
  ];
}
