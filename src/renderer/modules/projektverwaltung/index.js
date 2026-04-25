import ProjectsScreen from "./screens/ProjectsScreen.js";
import ProjectFormScreen from "./screens/ProjectFormScreen.js";
import ArchiveScreen from "./screens/ArchiveScreen.js";
import ProjectWorkspaceScreen from "./screens/ProjectWorkspaceScreen.js";

export const PROJEKTVERWALTUNG_MODULE_ID = "projektverwaltung";
export const PROJEKTVERWALTUNG_MODULE_LABEL = "Projektverwaltung";

function buildProjektverwaltungScreens() {
  return Object.freeze({
    projects: ProjectsScreen,
    projectForm: ProjectFormScreen,
    archive: ArchiveScreen,
    projectWorkspace: ProjectWorkspaceScreen,
  });
}

export function getProjektverwaltungModuleEntry() {
  return Object.freeze({
    moduleId: PROJEKTVERWALTUNG_MODULE_ID,
    moduleLabel: PROJEKTVERWALTUNG_MODULE_LABEL,
    workScreenId: "projects",
    screens: buildProjektverwaltungScreens(),
  });
}

export { ProjectsScreen, ProjectFormScreen, ArchiveScreen, ProjectWorkspaceScreen };
export * from "./screens/index.js";
