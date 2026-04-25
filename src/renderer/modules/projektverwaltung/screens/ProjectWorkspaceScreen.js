import { applyPopupButtonStyle } from "../../../ui/popupButtonStyles.js";

const PROJECT_MODULES = Object.freeze([
  Object.freeze({
    moduleId: "protokoll",
    label: "Protokoll öffnen",
    description: "Das Protokoll im aktuellen Projektkontext öffnen.",
  }),
]);

function normalizeText(value) {
  return String(value || "").trim();
}

function getProjectNumber(project) {
  const raw = project?.project_number ?? project?.projectNumber ?? "";
  return normalizeText(raw);
}

function getProjectTitle(project, fallbackProjectId = null) {
  const number = getProjectNumber(project);
  const short = normalizeText(project?.short);
  const name = normalizeText(project?.name);

  if (number && short) return `${number} - ${short}`;
  if (number) return number;
  if (short) return short;
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
  }

  getAvailableProjectModules() {
    return PROJECT_MODULES;
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
        this.project =
          res.list.find((item) => String(item?.id ?? "") === String(effectiveProjectId)) ||
          { id: effectiveProjectId };
      } else {
        this.project = { id: effectiveProjectId };
      }
    } catch (_err) {
      this.project = { id: effectiveProjectId };
    }

    return this.project;
  }

  async openProjectModule(moduleId) {
    const normalizedModuleId = normalizeText(moduleId);
    if (normalizedModuleId !== "protokoll") return false;

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

    const number = getProjectNumber(project);
    if (number) {
      const numberLine = document.createElement("div");
      numberLine.textContent = `Projektnummer: ${number}`;
      numberLine.style.fontSize = "12px";
      numberLine.style.opacity = "0.85";
      container.appendChild(numberLine);
    }

    const name = normalizeText(project?.name);
    const short = normalizeText(project?.short);
    const extraLine = document.createElement("div");
    extraLine.textContent = name && short && name !== short ? name : short || name || "";
    extraLine.style.fontSize = "12px";
    extraLine.style.opacity = "0.85";
    if (extraLine.textContent) {
      container.appendChild(title);
      container.appendChild(extraLine);
    } else {
      container.appendChild(title);
    }
  }

  _renderContent() {
    if (!this.hostEl) return;

    this.hostEl.innerHTML = "";

    const info = document.createElement("div");
    info.style.marginBottom = "16px";
    this._renderProjectInfo(info);

    const sectionTitle = document.createElement("h3");
    sectionTitle.textContent = "Verfügbare Projektmodule";
    sectionTitle.style.margin = "0 0 10px";

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(240px, 1fr))";
    grid.style.gap = "12px";

    this._renderModuleTiles(grid);

    this.hostEl.append(info, sectionTitle, grid);
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

    const msg = document.createElement("div");
    msg.style.marginLeft = "auto";
    msg.style.fontSize = "12px";
    msg.style.opacity = "0.85";

    head.append(h, msg);

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
