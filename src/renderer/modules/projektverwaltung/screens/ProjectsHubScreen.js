import LegacyProjectsScreen from "./ProjectsScreen.js";

/**
 * Neutraler Projekteinstieg fuer die modulare BBM-Struktur.
 *
 * Die bestehende Projektliste, Bearbeitung sowie Import/Export bleiben erhalten.
 * Geaendert wird bewusst nur die Bedeutung eines normalen Projektklicks:
 * Ein Projekt oeffnet zuerst den Projekt-Arbeitsbereich und startet kein
 * Fachmodul automatisch.
 */
export default class ProjectsHubScreen extends LegacyProjectsScreen {
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

    if (typeof this.router?.showProjectWorkspace !== "function") {
      this._flashMsg?.("Projekt-Arbeitsbereich ist nicht verfügbar.", 9000);
      return false;
    }

    await this.router.showProjectWorkspace(project.id, { project });
    return true;
  }
}
