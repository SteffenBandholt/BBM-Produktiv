import { createModuleDescriptor } from "../../app/modules/moduleDescriptorContract.js";
import SigekoScreen from "./SigekoScreen.js";
import SigekoPreNotificationScreen from "./SigekoPreNotificationScreen.js";

export const SIGEKO_MODULE_ID = "sigeko";
export const SIGEKO_MODULE_LABEL = "SiGeKo";

// The shared router remains the view host and license gate. This adapter only
// selects known SiGeKo screens and guards the real pre-notification entry.
const routeSequences = new WeakMap();
async function openSigekoProject({ router, projectId, project, options = {} }) {
  if (!router || typeof router.show !== "function" || !projectId) return false;
  const sequence = (routeSequences.get(router) || 0) + 1;
  routeSequences.set(router, sequence);
  const screen = options.screen === undefined || options.screen === "" ? "sigeko" : options.screen;
  if (!["sigeko", "preNotification"].includes(screen)) return false;
  const previousView = router.currentView, previousProjectId = router.currentProjectId;
  const current = () => routeSequences.get(router) === sequence && router.currentView === previousView && router.currentProjectId === previousProjectId;
  if (screen === "preNotification") {
    try {
      const result = await window.bbmDb.sigekoGetReadiness({ projectId });
      if (!current()) return false;
      const data = result?.data;
      if (!result?.ok) throw new Error(result?.error || "Projektbereitschaft konnte nicht geprüft werden.");
      if (String(data?.projectId) !== String(projectId) || !["red", "green"].includes(data?.projectData?.status)
        || !["red", "orange", "green"].includes(data?.authorities?.status)
        || !Array.isArray(data.projectData.issues) || !Array.isArray(data.authorities.issues)) throw new Error("Projektbereitschaft konnte nicht sicher zugeordnet werden.");
      if (data.projectData.status !== "green" || data.authorities.status !== "green") {
        const issues = [...data.projectData.issues, ...data.authorities.issues].map(issue => issue.message).join("\n");
        if (!window.confirm("Für dieses Projekt fehlen Angaben oder sie müssen geprüft werden.\n\n" + issues + "\n\nVorankündigung trotzdem öffnen und bearbeiten?")) return false;
      }
      if (!current()) return false;
    } catch (error) {
      if (current()) window.alert("Vorankündigung wurde nicht geöffnet: " + error.message + " Bitte den Einstieg erneut versuchen.");
      return false;
    }
  }
  const View = screen === "preNotification" ? SigekoPreNotificationScreen : SigekoScreen;
  await router.show(new View({ router, projectId, project, focusSection: options.focusSection }), {
    section: "sigeko", isTopsView: false, hideSidebar: true,
    pageTitle: screen === "preNotification" ? "Vorankündigung" : "SiGeKo", activeModuleLabel: "SiGeKo",
  });
  return true;
}

export function getSigekoModuleEntry() {
  return createModuleDescriptor({
    moduleId: SIGEKO_MODULE_ID,
    moduleLabel: SIGEKO_MODULE_LABEL,
    moduleType: "project",
    licenseKey: "module:sigeko",
    workScreenId: "sigeko",
    screens: Object.freeze({ sigeko: SigekoScreen, preNotification: SigekoPreNotificationScreen }),
    routes: Object.freeze({ project: Object.freeze([{ screenId: "sigeko" }, { screenId: "preNotification" }]) }),
    routing: Object.freeze({ project: openSigekoProject }),
    navigation: Object.freeze({ project: Object.freeze([{
      key: "sigeko", label: "SiGeKo", moduleId: SIGEKO_MODULE_ID,
      workScreenId: "sigeko", section: "sigeko",
      description: "SiGeKo-Grunddaten, Behörden und Vorankündigung öffnen.",
    }]) }),
    presentation: Object.freeze({
      color: "#2563eb", icon: "sigeko",
      description: "SiGeKo-Grunddaten, Behörden und Vorankündigung.",
      start: Object.freeze({ mode: "project", label: "Projekt auswählen" }),
    }),
    shell: Object.freeze({ hideSidebar: true }),
    ipcRegistrar: "sigeko",
    migrationRegistrar: "sigeko",
    requiredCapabilities: Object.freeze(["pdf", "mail", "file-storage", "ui-editor"]),
  });
}
