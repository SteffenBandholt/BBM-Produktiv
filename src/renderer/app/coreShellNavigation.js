import {
  createM80RegistrationDescriptor,
  inspectM80ScopeRegistration,
  refreshM80StartupLayoutAfterRegistryMount,
} from "../ui-editor/m80HostAdapter.js";
import { beginM83ComponentBinding, completeM80PilotRender, registerM80Ref } from "../ui-editor/m80Refs.js";
import { getM80LauncherRegistration, getM80ScopeGroupRegistration, listM83ComponentContracts } from "../ui-editor/m80Registry.js";

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

export function clearDevelopmentUiEditorOpenButtonRefs() {
  listM83ComponentContracts()
    .filter((component) => component.slots?.some((slot) => slot.element?.componentKind === "developmentLauncher"))
    .forEach((component) => beginM83ComponentBinding(component.componentId));
}

export function bindDevelopmentUiEditorOpenButtonRef({ scopeId, button } = {}) {
  const launcher = getM80LauncherRegistration(scopeId);
  if (!launcher || !button || typeof button.setAttribute !== "function") return false;
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

export function showPdfDocumentTypeRegistrationDialog(status, { doc = globalThis.document } = {}) {
  if (!doc?.body || typeof doc.createElement !== "function") return Promise.resolve("cancel");
  return new Promise((resolve) => {
    const backdrop = doc.createElement("div");
    backdrop.setAttribute("data-bbm-pdf-registration-dialog", "true");
    backdrop.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:rgba(15,23,42,.42);padding:24px";
    const panel = doc.createElement("section");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "PDF-Typ registrieren");
    panel.style.cssText = "box-sizing:border-box;width:min(520px,100%);padding:22px;border:1px solid #d7e0ea;border-radius:12px;background:#fff;color:#172033;box-shadow:0 18px 50px rgba(15,23,42,.28);font:14px/1.45 system-ui,sans-serif";
    const title = doc.createElement("h2");
    title.textContent = status?.pdfRegistryStatus === "unregistered" ? "Dieser PDF-Typ ist noch nicht für den Editor registriert." : "PDF-Descriptor hat sich geändert.";
    title.style.cssText = "margin:0 0 10px;font-size:18px";
    const details = doc.createElement("p");
    const parts = [
      status?.newElementIds?.length ? `${status.newElementIds.length} neue Elemente` : "",
      status?.missingElementIds?.length ? `${status.missingElementIds.length} derzeit fehlende Elemente` : "",
      status?.incompatibleElementIds?.length ? `${status.incompatibleElementIds.length} inkompatible Elemente` : "",
      status?.incompleteElementIds?.length ? `${status.incompleteElementIds.length} unvollständige Elemente` : "",
    ].filter(Boolean);
    details.textContent = parts.join(" · ") || String(status?.displayName || status?.documentTypeId || "PDF-Dokumenttyp");
    details.style.cssText = "margin:0 0 18px;color:#536377";
    const actions = doc.createElement("div");
    actions.style.cssText = "display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap";
    const close = (value) => { backdrop.remove?.(); resolve(value); };
    const cancel = doc.createElement("button");
    cancel.type = "button";
    cancel.textContent = status?.editorAvailable ? "Mit bestehendem Vertrag fortfahren" : "Abbrechen";
    cancel.style.cssText = "padding:8px 12px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#334155;cursor:pointer";
    cancel.addEventListener("click", () => close(status?.editorAvailable ? "continue" : "cancel"));
    actions.appendChild(cancel);
    if (status?.canRegister || status?.canSynchronizeElements || status?.canAcceptNewElements) {
      const register = doc.createElement("button");
      register.type = "button";
      register.textContent = status?.canRegister ? "PDF-Typ registrieren" : "PDF-Elementstruktur übernehmen";
      register.style.cssText = "padding:8px 12px;border:1px solid #1d4ed8;border-radius:7px;background:#2563eb;color:#fff;font-weight:650;cursor:pointer";
      register.addEventListener("click", () => close("register"));
      actions.appendChild(register);
      queueMicrotask(() => register.focus?.());
    } else queueMicrotask(() => cancel.focus?.());
    panel.append(title, details, actions);
    backdrop.appendChild(panel);
    doc.body.appendChild(backdrop);
  });
}

async function ensurePdfDocumentTypeReady({ api, documentTypeId, buildApi, doc = globalThis.document } = {}) {
  if (!documentTypeId || typeof api?.getPdfDocumentTypeStatus !== "function") return { ok: true, pdfRegistryStatus: "unavailable" };
  let status = await api.getPdfDocumentTypeStatus({ documentTypeId });
  if (status?.pdfRegistryStatus === "available") return status;
  const isDev = await isDevelopmentUiEditorBuild({ api: buildApi });
  if (!isDev) return status;
  if (!["unregistered", "changed", "incomplete", "incompatible"].includes(status?.pdfRegistryStatus)) return status;
  const choice = await showPdfDocumentTypeRegistrationDialog(status, { doc });
  if (choice === "register" && typeof api.registerPdfDocumentType === "function") {
    const accepted = await api.registerPdfDocumentType({ documentTypeId });
    if (!accepted?.ok) return accepted;
    status = await api.getPdfDocumentTypeStatus({ documentTypeId });
  } else if (choice !== "continue") {
    return { ...status, ok: false, errorCode: "pdf_document_registration_cancelled" };
  }
  return status;
}

export async function openNativeUiEditor(context = {}) {
  const api = context?.api || window.uiEditor;
  if (!api || typeof api.open !== "function") {
    alert("Der separate UI-Editor ist nicht installiert oder die sichere BBM-Brücke ist nicht verfügbar.");
    return { ok: false, errorCode: "electron_editor_not_installed" };
  }
  const activeScopeId = String(context?.scopeId || "").trim();
  const scopeGroup = activeScopeId ? getM80ScopeGroupRegistration(activeScopeId) : null;
  if (typeof api.preparePdfContext === "function" && scopeGroup?.pdfDocumentTypeId && context?.projectId && context?.meetingId) {
    await api.preparePdfContext({ documentTypeId: scopeGroup.pdfDocumentTypeId, projectId: context.projectId, meetingId: context.meetingId });
  }
  if (scopeGroup?.pdfDocumentTypeId) {
    const pdfStatus = await ensurePdfDocumentTypeReady({ api, documentTypeId: scopeGroup.pdfDocumentTypeId, buildApi: context?.buildApi || globalThis.window?.bbmDb, doc: context?.doc || globalThis.document });
    if (pdfStatus?.editorAvailable !== true && pdfStatus?.pdfRegistryStatus !== "available") {
      const message = pdfStatus?.message || "Dieser PDF-Typ ist noch nicht für den Editor registriert.";
      showRegistryRefreshStatus(message, "blocked");
      if (pdfStatus?.errorCode !== "pdf_document_registration_cancelled") alert(message);
      return { ok: false, errorCode: pdfStatus?.errorCode || "pdf_document_type_unavailable", message };
    }
  }
  if (activeScopeId && context?.launcherButton) {
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
      await openNativeUiEditor({ scopeId, api: uiEditorApi, launcherButton: button });
    } finally {
      button.disabled = false;
    }
  });
  host.appendChild(button);
  clearDevelopmentUiEditorOpenButtonRefs();
  bindDevelopmentUiEditorOpenButtonRef({ scopeId, button });
  return button;
}

export function createCoreShellNavigationRouteDefs(router) {
  return [
    { key: "home", label: "Start", onClick: () => router.showHome() },
    { key: "projects", label: "Projekte", onClick: () => router.showProjects() },
    { key: "firms", label: "Firmen", onClick: () => router.showFirms() },
    { key: "settings", label: "Einstellungen", onClick: () => router.showSettings() },
  ];
}
