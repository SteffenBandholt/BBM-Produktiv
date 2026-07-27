import { createM80RegistrationDescriptor } from "../ui-editor/m80HostAdapter.js";

function showRegistryRefreshStatus(message, state = "checking") {
  const doc = globalThis.document;
  if (!doc?.body || typeof doc.createElement !== "function") return;
  let status = doc.querySelector?.("[data-bbm-ui-editor-registry-status]");
  if (!status) {
    status = doc.createElement("div");
    status.setAttribute("data-bbm-ui-editor-registry-status", "true");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:2147482000;padding:9px 12px;border-radius:8px;background:#172033;color:#fff;box-shadow:0 8px 24px rgba(15,23,42,.24);font:600 12px/1.3 system-ui,sans-serif";
    doc.body.appendChild(status);
  }
  status.dataset.state = state;
  status.textContent = message;
}

export async function openNativeUiEditor(context = {}) {
  const api = window.uiEditor;
  if (!api || typeof api.open !== "function") {
    alert("Der separate UI-Editor ist nicht installiert oder die sichere BBM-Brücke ist nicht verfügbar.");
    return { ok: false, errorCode: "electron_editor_not_installed" };
  }
  if (typeof api.preparePdfContext === "function" && context?.projectId && context?.meetingId) {
    await api.preparePdfContext({ projectId: context?.projectId || null, meetingId: context?.meetingId || null });
  }
  showRegistryRefreshStatus("UI-Registry wird geprüft …", "checking");
  const result = await api.open(createM80RegistrationDescriptor());
  if (result?.ok) {
    showRegistryRefreshStatus(result.registryRefreshStatus === "changed" ? "UI-Registry aktualisiert." : "UI-Registry ist aktuell.", result.registryRefreshStatus || "current");
  } else {
    showRegistryRefreshStatus(result?.message || "UI-Registry konnte nicht freigegeben werden.", "blocked");
  }
  if (!result?.ok) alert(result?.message || "Der separate UI-Editor konnte nicht gestartet werden.");
  return result;
}

export function createCoreShellNavigationRouteDefs(router) {
  return [
    { key: "home", label: "Start", onClick: () => router.showHome() },
    { key: "projects", label: "Projekte", onClick: () => router.showProjects() },
    { key: "firms", label: "Firmen", onClick: () => router.showFirms() },
    { key: "settings", label: "Einstellungen", onClick: () => router.showSettings() },
    { key: "uiEditor", kind: "action", label: "UI-Editor öffnen", onClick: () => openNativeUiEditor({
      projectId: router.currentProjectId,
      meetingId: router.currentMeetingId || router.lastTopsMeetingId,
    }) },
  ];
}
