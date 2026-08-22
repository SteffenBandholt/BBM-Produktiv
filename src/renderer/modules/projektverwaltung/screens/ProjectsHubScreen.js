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
 * Einstieg aus einer projektbezogenen Modulkachel: Projekt waehlen und danach
 * direkt im zuvor gewaehlten Fachmodul weiterarbeiten.
 * Die Projektkachel selbst ist bewusst keine Modulnavigation mehr.
 */
export default class ProjectsHubScreen extends LegacyProjectsScreen {
  constructor(args = {}) {
    super(args);
    this.protocolStartScreen = null;
  }

  _startsFromProtocolTile() {
    return readStorage(START_TARGET_KEY) === "protokoll";
  }

  _pendingStartTargetModuleId() {
    const target = readStorage(START_TARGET_KEY);
    return target && target !== "protokoll" ? target : "";
  }

  // Module gehoeren in den Projekt-Arbeitsbereich und nicht als Mini-Menue
  // direkt in jede Projektkachel.
  _getProjectTileModuleActions() {
    return [];
  }

  _polishNeutralProjectCards() {
    const host = this.hostEl || null;
    if (!host?.querySelectorAll) return;

    for (const card of host.querySelectorAll('[data-project-card="true"]')) {
      card.style.minHeight = "150px";
      card.style.padding = "16px";
      card.style.borderRadius = "12px";
      card.style.boxShadow = "0 3px 10px rgba(15,23,42,.035)";
      card.style.gap = "10px";

      const rail = card.querySelector('[data-project-action-rail="true"]');
      if (rail) {
        rail.style.flex = "0 0 auto";
        rail.style.minWidth = "0";
        rail.style.paddingLeft = "8px";
        rail.style.borderLeft = "none";
        rail.style.alignSelf = "flex-start";
      }

      const edit = card.querySelector('[data-project-action="edit"]');
      if (edit) {
        edit.textContent = "Bearbeiten";
        edit.style.border = "1px solid #d8dee8";
        edit.style.borderRadius = "7px";
        edit.style.background = "#ffffff";
        edit.style.color = "#475467";
        edit.style.padding = "6px 9px";
        edit.style.fontSize = "11px";
        edit.style.fontWeight = "700";
        edit.style.textDecoration = "none";
      }

      card.title = this._pendingStartTargetModuleId()
        ? "Projekt auswählen und im gewählten Modul öffnen"
        : "Projekt öffnen";
    }
  }

  _renderGrid() {
    super._renderGrid();
    this._polishNeutralProjectCards();
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

    const startTargetModuleId = this._pendingStartTargetModuleId();
    if (startTargetModuleId) {
      clearStorage(START_TARGET_KEY);
      const result = await this.router?.openProjectModule?.(project.id, startTargetModuleId, {
        project,
        source: "home-project-selection",
      });
      const opened = typeof result === "object" ? !!result?.ok : result !== false;
      if (opened) return true;
      this._flashMsg?.("Der gewählte Arbeitsbereich konnte nicht direkt geöffnet werden.", 7000);
    }

    if (typeof this.router?.showProjectWorkspace !== "function") {
      this._flashMsg?.("Projekt-Arbeitsbereich ist nicht verfügbar.", 9000);
      return false;
    }

    await this.router.showProjectWorkspace(project.id, { project });
    return true;
  }
}
