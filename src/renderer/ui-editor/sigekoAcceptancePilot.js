import { openNativeUiEditor } from "../app/coreShellNavigation.js";

export const SIGEKO_ACCEPTANCE_PROJECTS = Object.freeze([
  Object.freeze({ project_number: "S12-A", name: "SiGeKo Testprojekt A" }),
  Object.freeze({ project_number: "S12-B", name: "SiGeKo Testprojekt B" }),
]);

export async function seedSigekoAcceptanceProjects({ api, isolatedAcceptance = false } = {}) {
  // Nur der Main-Prozess bestaetigt das durch Marker und Temp-Pfad isolierte Profil.
  if (isolatedAcceptance !== true) throw new Error("SIGEKO_ACCEPTANCE_REQUIRES_ISOLATED_PROFILE");
  const result = await api.projectsList();
  if (!result?.ok || !Array.isArray(result.list)) throw new Error("SIGEKO_ACCEPTANCE_PROJECT_LIST_FAILED");
  const projects = [];
  for (const fixture of SIGEKO_ACCEPTANCE_PROJECTS) {
    let project = result.list.find((item) => item.project_number === fixture.project_number);
    if (!project) {
      const created = await api.projectsCreate({ ...fixture });
      if (!created?.ok) throw new Error("SIGEKO_ACCEPTANCE_PROJECT_CREATE_FAILED");
      project = created.project;
    }
    if (!project?.id) throw new Error("SIGEKO_ACCEPTANCE_PROJECT_ID_MISSING");
    projects.push(project);
  }
  return projects;
}

export async function installSigekoAcceptancePilot({ router, isolatedAcceptance = false } = {}) {
  const projects = await seedSigekoAcceptanceProjects({ api: window.bbmDb, isolatedAcceptance });
  // Bestehender Projektarbeitsbereich setzt den Projektkontext; kein Sonderrouter.
  await router.showProjectWorkspace(projects[0].id, { project: projects[0] });
  const opened = await router.openProjectModule(projects[0].id, "sigeko", { project: projects[0] });
  if (opened !== true) throw new Error("SIGEKO_ACCEPTANCE_ROUTE_FAILED");
  const result = await openNativeUiEditor({ scopeId: "sigeko.screen" });
  if (!result?.ok) throw new Error("SIGEKO_ACCEPTANCE_EDITOR_OPEN_FAILED");
  return router.currentView;
}
