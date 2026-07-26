export async function openNativeUiEditor() {
  const api = window.uiEditor;
  if (!api || typeof api.open !== "function") {
    alert("Der separate UI-Editor ist nicht installiert oder die sichere BBM-Brücke ist nicht verfügbar.");
    return { ok: false, errorCode: "electron_editor_not_installed" };
  }
  const result = await api.open();
  if (!result?.ok) alert(result?.message || "Der separate UI-Editor konnte nicht gestartet werden.");
  return result;
}

export function createCoreShellNavigationRouteDefs(router) {
  return [
    { key: "home", label: "Start", onClick: () => router.showHome() },
    { key: "projects", label: "Projekte", onClick: () => router.showProjects() },
    { key: "firms", label: "Firmen", onClick: () => router.showFirms() },
    { key: "settings", label: "Einstellungen", onClick: () => router.showSettings() },
    { key: "uiEditor", kind: "action", label: "UI-Editor öffnen", onClick: () => openNativeUiEditor() },
  ];
}
