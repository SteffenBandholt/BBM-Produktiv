import { applyPopupButtonStyle } from "../../../ui/popupButtonStyles.js";
import {
  getActiveProjectModuleNavigation,
  PROTOKOLL_MODULE_ID,
} from "../../../app/modules/index.js";

function getProjectModuleEntries() {
  return getActiveProjectModuleNavigation().map((entry) =>
    Object.freeze({
      moduleId: String(entry?.moduleId || "").trim(),
      label: String(entry?.label || "Arbeitsbereich öffnen").trim(),
      description: String(
        entry?.description || "Arbeitsbereich im aktuellen Projektkontext öffnen."
      ).trim(),
    })
  );
}

function normalizeText(value) {
  return String(value || "").trim();
}

function getProjectNumber(project) {
  const raw =
    project?.project_number ??
    project?.projectNumber ??
    project?.nummer ??
    project?.number ??
    "";
  return normalizeText(raw);
}

function getProjectName(project) {
  const short = normalizeText(project?.short);
  const name = normalizeText(project?.name ?? project?.project_name ?? project?.title);
  return short || name;
}

function getProjectTitle(project, fallbackProjectId = null) {
  const number = getProjectNumber(project);
  const name = getProjectName(project);

  if (number && name) return `${number} - ${name}`;
  if (number) return number;
  if (name) return name;
  if (fallbackProjectId) return `#${fallbackProjectId}`;
  return "Projekt";
}

export default class ProjectWorkspaceScreen {
  constructor({ router, projectId, project } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;

    this.root = null;
    this.hostEl = null;
    this.msgEl = null;

    this.loading = false;
    this.projectMissing = false;
  }

  getAvailableProjectModules() {
    return getProjectModuleEntries();
  }

  getProjectDisplayText() {
    return getProjectTitle(this.project, this.projectId || this.router?.currentProjectId || null);
  }

  _setMsg(text) {
    if (!this.msgEl) return;
    this.msgEl.textContent = String(text || "");
  }

  async _loadProject() {
    if (this.project) return this.project;

    const effectiveProjectId = this.projectId || this.router?.currentProjectId || null;
    if (!effectiveProjectId) return null;

    const api = window.bbmDb || {};
    if (typeof api.projectsList !== "function") {
      this.project = { id: effectiveProjectId };
      return this.project;
    }

    try {
      const res = await api.projectsList();
      if (res?.ok && Array.isArray(res.list)) {
        const foundProject = res.list.find(
          (item) => String(item?.id ?? "") === String(effectiveProjectId)
        );
        this.project = foundProject || null;
        this.projectMissing = !foundProject;
      } else {
        this.project = { id: effectiveProjectId };
        this.projectMissing = false;
      }
    } catch (_err) {
      this.project = { id: effectiveProjectId };
      this.projectMissing = false;
    }

    return this.project;
  }

  async showProjectsList() {
    if (typeof this.router?.showProjects !== "function") return false;
    await this.router.showProjects();
    return true;
  }

  async openProjectModule(moduleId) {
    const normalizedModuleId = normalizeText(moduleId);
    if (normalizedModuleId !== PROTOKOLL_MODULE_ID) return false;

    const projectId = this.projectId || this.router?.currentProjectId || null;
    if (!projectId || typeof this.router?.showTops !== "function") return false;

    await this.router.showTops(null, projectId);
    return true;
  }

  _renderModuleTiles(container) {
    container.innerHTML = "";

    for (const moduleItem of this.getAvailableProjectModules()) {
      const tile = document.createElement("div");
      tile.style.border = "1px solid var(--card-border)";
      tile.style.borderRadius = "10px";
      tile.style.padding = "12px";
      tile.style.background = "var(--card-bg)";
      tile.style.display = "flex";
      tile.style.flexDirection = "column";
      tile.style.gap = "8px";

      const title = document.createElement("div");
      title.textContent = moduleItem.label;
      title.style.fontWeight = "800";
      title.style.fontSize = "16px";

      const description = document.createElement("div");
      description.textContent = moduleItem.description;
      description.style.fontSize = "12px";
      description.style.opacity = "0.8";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = moduleItem.label;
      applyPopupButtonStyle(btn, { variant: "primary" });
      btn.onclick = async () => {
        await this.openProjectModule(moduleItem.moduleId);
      };

      tile.append(title, description, btn);
      container.appendChild(tile);
    }
  }

  _renderProjectInfo(container) {
    container.innerHTML = "";

    const project = this.project || null;
    const title = document.createElement("div");
    title.textContent = this.getProjectDisplayText();
    title.style.fontWeight = "900";
    title.style.fontSize = "20px";
    title.style.marginBottom = "6px";

    const numberLine = document.createElement("div");
    numberLine.textContent = `Projektnummer: ${getProjectNumber(project) || "-"}`;
    numberLine.style.fontSize = "12px";
    numberLine.style.opacity = "0.85";

    const nameLine = document.createElement("div");
    nameLine.textContent = `Projektname: ${getProjectName(project) || "-"}`;
    nameLine.style.fontSize = "12px";
    nameLine.style.opacity = "0.85";

    container.append(title, numberLine, nameLine);
  }

  _renderContent() {
    if (!this.hostEl) return;

    this.hostEl.innerHTML = "";

    const info = document.createElement("div");
    info.style.marginBottom = "16px";
    this._renderProjectInfo(info);

    const availableModules = this.getAvailableProjectModules();

    const sectionTitle = document.createElement("h3");
    sectionTitle.textContent = "Arbeitsbereiche im Projekt";
    sectionTitle.style.margin = "0 0 10px";

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "1fr";
    grid.style.gap = "8px";

    if (availableModules.length > 0) {
      this._renderModuleTiles(grid);
    } else {
      const empty = document.createElement("div");
      empty.textContent = "Für dieses Projekt sind keine Arbeitsmodule freigeschaltet.";
      empty.style.border = "1px solid var(--card-border)";
      empty.style.borderRadius = "8px";
      empty.style.padding = "10px 12px";
      empty.style.background = "var(--card-bg)";
      empty.style.fontSize = "13px";
      empty.style.opacity = "0.85";
      grid.appendChild(empty);
    }

    this.hostEl.append(info);

    if (this.projectMissing) {
      const missing = document.createElement("div");
      missing.textContent = "Projekt konnte nicht gefunden werden.";
      missing.style.fontSize = "14px";
      missing.style.fontWeight = "700";
      missing.style.color = "var(--danger-text, #a40000)";
      this.hostEl.appendChild(missing);
      return;
    }

    this.hostEl.append(sectionTitle, grid);
  }

  render() {
    const root = document.createElement("div");

    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.alignItems = "center";
    head.style.gap = "10px";
    head.style.marginBottom = "10px";

    const h = document.createElement("h2");
    h.textContent = "Projekt-Arbeitsbereich";
    h.style.margin = "0";

    const navBtn = document.createElement("button");
    navBtn.type = "button";
    navBtn.textContent = "Zur Projektliste";
    applyPopupButtonStyle(navBtn, { variant: "secondary" });
    navBtn.onclick = async () => {
      await this.showProjectsList();
    };

    const msg = document.createElement("div");
    msg.style.marginLeft = "auto";
    msg.style.fontSize = "12px";
    msg.style.opacity = "0.85";

    head.append(h, navBtn, msg);

    const host = document.createElement("div");
    root.append(head, host);

    this.root = root;
    this.hostEl = host;
    this.msgEl = msg;

    this._renderContent();

    return root;
  }

  async load() {
    this.loading = true;
    this._setMsg("Lade...");
    try {
      await this._loadProject();
      this._renderContent();
    } finally {
      this.loading = false;
      this._setMsg("");
    }
  }
}
