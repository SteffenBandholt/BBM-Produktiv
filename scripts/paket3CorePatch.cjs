const fs = require("node:fs");
const path = require("node:path");

function patchFile(relPath, patches) {
  const filePath = path.join(process.cwd(), relPath);
  let source = fs.readFileSync(filePath, "utf8");
  for (const [before, after, label] of patches) {
    if (!source.includes(before)) {
      throw new Error(`${relPath}: Patch-Muster fehlt: ${label}`);
    }
    source = source.replace(before, after);
  }
  fs.writeFileSync(filePath, source, "utf8");
}

patchFile("src/main/main.js", [
  [
    'const { registerProjectFirmsIpc } = require("./ipc/projectFirmsIpc");',
    'const { registerCoreProjectFirmsIpc } = require("./core/projectFirmsCore");',
    "Core-Import",
  ],
  ["  registerProjectFirmsIpc();", "  registerCoreProjectFirmsIpc();", "Core-Registrierung"],
]);

patchFile("src/renderer/app/Router.js", [
  [
`    return [
      ...activeModules,
      Object.freeze({
        moduleId: "projectFirms",
        navigationKey: "projectFirms",
        label: "Firmen im Projekt",
        description: "Projektbezogene Firmen und Mitarbeiter im aktuellen Projekt öffnen.",
      }),
    ];`,
`    return activeModules;`,
    "Pseudo-Modul aus Router entfernen",
  ],
]);

patchFile("src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js", [
  [
`const MODULE_STYLE = Object.freeze({
  protokoll: { color: "#22c55e", icon: "protocol" },
  restarbeiten: { color: "#f59e0b", icon: "rest" },
  projectFirms: { color: "#475569", icon: "firms" },
});`,
`const MODULE_STYLE = Object.freeze({
  protokoll: { color: "#22c55e", icon: "protocol" },
  restarbeiten: { color: "#f59e0b", icon: "rest" },
});

const CORE_ACTION_STYLE = Object.freeze({ color: "#475569", icon: "firms" });
const DEFAULT_CORE_PROJECT_ACTIONS = Object.freeze([
  Object.freeze({
    coreActionId: "projectFirms",
    label: "Firmen im Projekt",
    description: "Projektbezogene Firmen und Mitarbeiter im aktuellen Projekt öffnen.",
  }),
]);`,
    "Core-Aktionsdefinition",
  ],
  [
`    if (moduleId === "projectFirms") {
      groups.push({
        moduleId,
        label: "Firmen im Projekt",
        description: item?.description || "Projektbeteiligte und Firmen verwalten.",
        entries: [item],
      });
      continue;
    }

`,
"",
    "Pseudo-Modul-Gruppierung entfernen",
  ],
  [
`  constructor({ router, projectId, project, projectModules } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;
    this.projectModules = Array.isArray(projectModules) ? projectModules : [];`,
`  constructor({ router, projectId, project, projectModules, coreProjectActions } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;
    this.projectModules = Array.isArray(projectModules) ? projectModules : [];
    this.coreProjectActions = Array.isArray(coreProjectActions)
      ? coreProjectActions
      : DEFAULT_CORE_PROJECT_ACTIONS;`,
    "Core-Aktionen im Workspace",
  ],
  [
`  getAvailableProjectModules() {
    return this.projectModules;
  }
`,
`  getAvailableProjectModules() {
    return this.projectModules;
  }

  getAvailableCoreProjectActions() {
    return this.coreProjectActions;
  }
`,
    "Core-Aktionszugriff",
  ],
  [
`  async openProjectModule(moduleId, navigationKey = "") {
    const normalizedModuleId = normalizeText(moduleId);
    const normalizedNavigationKey = normalizeText(navigationKey);
    const projectId = this.projectId || this.router?.currentProjectId || null;
    if (!projectId) return false;

    if (normalizedModuleId === "projectFirms") {
      if (typeof this.router?.showProjectFirms !== "function") return false;
      await this.router.showProjectFirms(projectId);
      return true;
    }`,
`  async openCoreProjectAction(coreActionId) {
    const normalizedActionId = normalizeText(coreActionId);
    const projectId = this.projectId || this.router?.currentProjectId || null;
    if (!projectId) return false;

    if (normalizedActionId === "projectFirms") {
      if (typeof this.router?.showProjectFirms !== "function") return false;
      await this.router.showProjectFirms(projectId);
      return true;
    }
    return false;
  }

  async openProjectModule(moduleId, navigationKey = "") {
    const normalizedModuleId = normalizeText(moduleId);
    const normalizedNavigationKey = normalizeText(navigationKey);
    const projectId = this.projectId || this.router?.currentProjectId || null;
    if (!projectId) return false;`,
    "Core-Aktion statt Pseudo-Modul",
  ],
  [
`  _createModuleCard(group) {`,
`  _createCoreActionCard(action) {
    const style = CORE_ACTION_STYLE;
    const card = setStyles(document.createElement("div"), {
      background: "#ffffff",
      border: "1px solid #e3e8ef",
      borderRadius: "14px",
      padding: "16px",
      minHeight: "176px",
      boxShadow: "0 5px 18px rgba(15,23,42,0.045)",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    });
    const iconWrap = setStyles(document.createElement("div"), {
      width: "46px",
      height: "46px",
      borderRadius: "12px",
      display: "grid",
      placeItems: "center",
      background: style.color + "16",
      color: style.color,
    });
    iconWrap.innerHTML = ICONS[style.icon] || ICONS.firms;
    const title = setStyles(document.createElement("div"), {
      fontWeight: "800",
      fontSize: "17px",
      color: "#172033",
    });
    title.textContent = normalizeText(action?.label) || "Core-Funktion";
    const description = setStyles(document.createElement("div"), {
      fontSize: "12px",
      lineHeight: "1.45",
      color: "#667085",
      flex: "1",
    });
    description.textContent = normalizeText(action?.description);
    const button = setStyles(document.createElement("button"), {
      border: "0",
      borderRadius: "8px",
      background: style.color,
      color: "#ffffff",
      padding: "7px 11px",
      fontSize: "11.5px",
      fontWeight: "750",
      cursor: "pointer",
      alignSelf: "flex-start",
    });
    button.type = "button";
    button.textContent = "Öffnen";
    button.addEventListener("click", async () => {
      await this.openCoreProjectAction(action?.coreActionId);
    });
    card.append(iconWrap, title, description, button);
    return card;
  }

  _createModuleCard(group) {`,
    "Core-Aktionskarte",
  ],
  [
`    const groups = groupProjectModules(this.getAvailableProjectModules());
    if (!groups.length) {`,
`    const coreActions = this.getAvailableCoreProjectActions();
    const groups = groupProjectModules(this.getAvailableProjectModules());
    if (!coreActions.length && !groups.length) {`,
    "Core-Aktionen in Leerzustand",
  ],
  [
`    } else {
      groups.forEach((group) => grid.appendChild(this._createModuleCard(group)));
    }
`,
`    } else {
      coreActions.forEach((action) => grid.appendChild(this._createCoreActionCard(action)));
      groups.forEach((group) => grid.appendChild(this._createModuleCard(group)));
    }
`,
    "Core-Aktionskarten rendern",
  ],
]);

patchFile("scripts/testGroups.cjs", [
  [
`      ["projectFirmsActiveFlow.test.cjs", "runProjectFirmsActiveFlowTests"],`,
`      ["projectFirmsActiveFlow.test.cjs", "runProjectFirmsActiveFlowTests"],
      ["projectFirmsCoreOwnership.test.cjs", "runProjectFirmsCoreOwnershipTests"],`,
    "Core-Ownership-Test registrieren",
  ],
]);

console.log("Paket 3 Core-Patches angewendet.");
