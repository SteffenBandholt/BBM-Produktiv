import { beginM83ComponentBinding, completeM80PilotRender, registerM80Ref } from "../../ui-editor/m80Refs.js";
import { SIGEKO_COMPONENT_ID, SIGEKO_SCOPE_ID } from "./SigekoScreen.uiEditorContract.js";

function node(tag, id, text = "") {
  const el = document.createElement(tag);
  el.textContent = text;
  registerM80Ref(id, el);
  return el;
}

export default class SigekoScreen {
  constructor({ router, projectId, project = null } = {}) {
    this.router = router;
    this.projectId = projectId || null;
    this.project = project && String(project.id) === String(this.projectId) ? project : null;
    this.uiEditorScopeId = SIGEKO_SCOPE_ID;
    this.router?._setProjectRuntimeContext?.({ projectId: this.projectId, meetingId: null });
  }

  getProjectDisplayText() {
    const project = this.project;
    return project
      ? [project.project_number || project.projectNumber, project.name || project.short].filter(Boolean).join(" – ")
      : `Projekt ${this.projectId || "nicht ausgewählt"}`;
  }

  render() {
    beginM83ComponentBinding(SIGEKO_COMPONENT_ID);
    const root = node("section", SIGEKO_SCOPE_ID);
    root.style.cssText = "box-sizing:border-box;min-width:0;max-width:100%;padding:16px;display:flex;flex-direction:column;gap:16px;overflow-wrap:anywhere;font-family:var(--bbm-font-ui,system-ui,sans-serif);color:var(--bbm-text,#1f344a)";
    const header = node("header", "sigeko.screen.header");
    const title = node("h1", "sigeko.screen.title", "SiGeKo");
    title.style.cssText = "margin:0 0 8px;font-size:20px";
    this.projectLabel = node("p", "sigeko.screen.project", `Aktives Projekt: ${this.getProjectDisplayText()}`);
    header.append(title, this.projectLabel);
    const nav = node("nav", "sigeko.screen.navigation");
    nav.setAttribute("aria-label", "SiGeKo-Navigation");
    nav.style.cssText = "display:flex;flex-wrap:wrap;gap:8px";
    const workspace = node("button", "sigeko.screen.workspace", "Projektarbeitsbereich");
    const projects = node("button", "sigeko.screen.projects", "Projekt wechseln");
    workspace.type = projects.type = "button";
    workspace.className = projects.className = "bbm-btn";
    workspace.onclick = () => this.router.showProjectWorkspace(this.projectId, { project: this.project });
    projects.onclick = () => this.router.showProjects();
    nav.append(workspace, projects);
    this.notice = node("p", "sigeko.screen.notice", "Der Moduleinstieg ist verfügbar. Die SiGeKo-Fachbereiche sind noch nicht umgesetzt.");
    this.notice.setAttribute("role", "status");
    const planned = node("section", "sigeko.screen.planned");
    planned.style.cssText = "padding:12px;border:1px solid #d3dfec;border-radius:8px;background:#f5f8fc";
    const plannedTitle = node("h2", "sigeko.screen.planned.title", "Geplante Bereiche – noch nicht umgesetzt");
    plannedTitle.style.fontSize = "16px";
    planned.append(plannedTitle, node("p", "sigeko.screen.planned.text", "Grunddaten · Übersicht / Readiness · Behörden / Notfall / Versorger · Vorankündigung · SiGePlan · Begehungen · Übergabe an Restarbeiten"));
    root.append(header, nav, this.notice, planned);
    this.root = root;
    completeM80PilotRender();
    return root;
  }

  async load() {
    if (!this.project) {
      try {
        const result = await window.bbmDb.projectsList();
        if (!result?.ok || !Array.isArray(result.list)) throw new Error("PROJECT_LIST_FAILED");
        this.project = result.list.find((item) => String(item.id) === String(this.projectId)) || null;
        if (!this.project) throw new Error("PROJECT_NOT_FOUND");
      } catch (_error) {
        this.notice.textContent = "Das aktive Projekt konnte nicht geladen werden. Bitte über die Projektauswahl erneut öffnen.";
      }
    }
    this.projectLabel.textContent = `Aktives Projekt: ${this.getProjectDisplayText()}`;
    completeM80PilotRender();
  }

  destroy() {
    beginM83ComponentBinding(SIGEKO_COMPONENT_ID);
  }
}
