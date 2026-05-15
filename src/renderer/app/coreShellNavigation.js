export function createCoreShellNavigationRouteDefs(router) {
  return [
    { key: "home", label: "Start", onClick: () => router.showHome() },
    { key: "projects", label: "Projekte", onClick: () => router.showProjects() },
    { key: "firms", label: "Firmen", onClick: () => router.showFirms() },
    { key: "settings", label: "Einstellungen", onClick: () => router.showSettings() },
  ];
}
