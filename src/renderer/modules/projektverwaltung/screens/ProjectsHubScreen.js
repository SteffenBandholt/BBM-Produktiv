import LegacyProjectsScreen from "./ProjectsScreen.js";
import ProjectFormHubScreen from "./ProjectFormHubScreen.js";
import ProtokollStartScreen from "../../protokoll/screens/ProtokollStartScreen.js";

const START_TARGET_KEY = "bbm.startTargetModuleId";
const PROTOCOL_START_INTENT_KEY = "bbm.protokollStartIntent";

function readStorage(key) {
  try {
    return String(window.localStorage?.getItem?.(key) || "").trim();
  } catch (_e) {
    return "";
  }
}

function clearStorage(key) {
  try {
    window.localStorage?.removeItem?.(key);
  } catch (_e) {
    // ignore
  }
}

/**
 * Neutraler Projekteinstieg fuer die modulare BBM-Struktur.
 *
 * Normaler Projektklick: Projekt-Arbeitsbereich.
 * Einstieg aus der Protokoll-Kachel: zuerst Protokoll-Startsicht.
 */
export default class ProjectsHubScreen extends LegacyProjectsScreen {
  constructor(args = {}) {
    super(args);
    this.protocolStartScreen = null;
  }

  _startsFromProtocolTile() {
    return readStorage(START_TARGET_KEY) === "protokoll";
  }

  async _openProjectFormModal({ projectId } = {}) {
    if (this._projectFormModal) return;

    try {
      this._projectFormPrevProjectId = this.router.currentProjectId || null;
      this.router.currentProjectId = projectId || null;
      this.router.currentMeetingId = null;

      const view = new ProjectFormHubScreen({
        router: this.router,
        projectId: projectId || null,
        mode: "modal",
        onClose: () => this._cleanupProjectFormModal(),
        onSaved: async () => {
          await this.reloadProjects();
          this._cleanupProjectFormModal();
        },
      });

      this._projectFormModal = view;
      view.render();
      await view.load();
      view.openModal();
    } catch (err) {
      console.error("[ProjectsHubScreen] Project modal failed:", err);
      this._cleanupProjectFormModal();
    }
  }

  render() {
    if (this._startsFromProtocolTile()) {
      clearStorage(START_TARGET_KEY);
      this.protocolStartScreen = new ProtokollStartScreen({ router: this.router });
      return this.protocolStartScreen.render();
    }
    return super.render();
  }

  async load() {
    if (this.protocolStartScreen) {
      await this.protocolStartScreen.load?.();
      return;
    }
    await super.load();
  }

  async openProjectById(projectId) {
    if (this.loading) return false;

    const wanted = String(projectId ?? "").trim();
    if (!wanted) {
      this._flashMsg?.("Projekt kann nicht geöffnet werden: id fehlt.", 7000);
      return false;
    }

    let project = (this.projects || []).find((p) => String(p?.id ?? "") === wanted) || null;
    if (!project) {
      await this.reloadProjects?.();
      project = (this.projects || []).find((p) => String(p?.id ?? "") === wanted) || null;
    }

    if (!project?.id) {
      this._flashMsg?.("Projekt wurde nicht gefunden.", 7000);
      return false;
    }

    this._setProjectRuntimeContext?.(project.id, null);
    this._rememberLastProject?.(project.id);

    const protocolIntent = readStorage(PROTOCOL_START_INTENT_KEY);
    if (protocolIntent === "new") {
      clearStorage(PROTOCOL_START_INTENT_KEY);
      const result = await this.router?.openProjectModule?.(project.id, "protokoll", { project });
      return typeof result === "object" ? !!result?.ok : result !== false;
    }

    if (typeof this.router?.showProjectWorkspace !== "function") {
      this._flashMsg?.("Projekt-Arbeitsbereich ist nicht verfügbar.", 9000);
      return false;
    }

    await this.router.showProjectWorkspace(project.id, { project });
    return true;
  }
}
