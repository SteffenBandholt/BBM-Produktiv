function normalizeText(value) {
  return String(value ?? "").trim();
}

function firstProjectText(project, keys = []) {
  for (const key of keys) {
    const value = normalizeText(project?.[key]);
    if (value) return value;
  }
  return "";
}

function getProjectName(project) {
  return firstProjectText(project, ["name", "short", "project_name", "projectName", "title"]);
}

function collectDistinctTextValues(values = []) {
  const out = [];
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized && !out.includes(normalized)) out.push(normalized);
  }
  return out;
}

function readProjectArray(project, keys = []) {
  for (const key of keys) {
    const value = project?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function resolveBuildings(project) {
  const direct = readProjectArray(project, ["buildings", "gebaeude", "gebäude"]);
  if (direct.length) {
    return collectDistinctTextValues(direct.map((entry) => typeof entry === "object" ? entry.name || entry.label || entry.title || entry.id : entry));
  }
  return collectDistinctTextValues([
    project?.building,
    project?.gebaeude,
    project?.gebäude,
    project?.location_level_1,
  ]);
}

function resolveFloors(project) {
  const direct = readProjectArray(project, ["floors", "geschosse", "geschosseList"]);
  if (direct.length) {
    return collectDistinctTextValues(direct.map((entry) => typeof entry === "object" ? entry.name || entry.label || entry.title || entry.id : entry));
  }
  return collectDistinctTextValues([
    project?.floor,
    project?.geschoss,
    project?.location_level_2,
  ]);
}

function getProjectId(projectId, project) {
  return normalizeText(projectId) || normalizeText(project?.id);
}

function setUiEditorAttributes(el, { id, kind, label, parent = "", editable = "true", ops = "inspect,select" }) {
  el.setAttribute("data-ui-inspector-id", id);
  el.setAttribute("data-ui-editor-id", id);
  el.setAttribute("data-ui-editor-kind", kind);
  el.setAttribute("data-ui-editor-label", label);
  el.setAttribute("data-ui-editor-parent", parent);
  el.setAttribute("data-ui-editor-editable", editable);
  el.setAttribute("data-ui-editor-ops", ops);
  return el;
}

function createText(tag, text, options) {
  const el = document.createElement(tag);
  el.textContent = text;
  setUiEditorAttributes(el, options);
  return el;
}

function createMetric(label, value, uiId) {
  const row = document.createElement("div");
  row.className = "bbm-plaene-metric";
  setUiEditorAttributes(row, {
    id: uiId,
    kind: "field",
    label,
    parent: "plaene.m1.project-summary",
  });

  const labelEl = document.createElement("span");
  labelEl.className = "bbm-plaene-metric__label";
  labelEl.textContent = label;

  const valueEl = document.createElement("strong");
  valueEl.className = "bbm-plaene-metric__value";
  valueEl.textContent = normalizeText(value) || "-";

  row.append(labelEl, valueEl);
  return row;
}

export default class PlaeneScreen {
  constructor({ router, projectId, project, moduleId } = {}) {
    this.router = router || null;
    this.projectId = getProjectId(projectId, project);
    this.project = project || null;
    this.moduleId = moduleId || "plaene";
    this.root = null;
    this.projectFolder = "";
    this.storageError = "";
  }

  render() {
    this.root = document.createElement("section");
    this.root.className = "bbm-plaene-screen";
    this.root.setAttribute("data-bbm-plaene-screen", "m1");
    setUiEditorAttributes(this.root, {
      id: "plaene.m1.root",
      kind: "frame",
      label: "Pläne Modulbereich",
      parent: "",
    });
    this._renderShell();
    this.loadProjectFolder();
    return this.root;
  }


  async goBack() {
    if (this.projectId && typeof this.router?.showProjectWorkspace === "function") {
      await this.router.showProjectWorkspace(this.projectId, { project: this.project });
      return true;
    }
    if (typeof this.router?.showProjects === "function") {
      await this.router.showProjects();
      return true;
    }
    return false;
  }

  _renderBackButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bbm-plaene-back-button";
    button.textContent = "Zurück";
    button.addEventListener("click", () => {
      void this.goBack();
    });
    return button;
  }

  async loadProjectFolder() {
    if (!this.projectId || !this.project || typeof window === "undefined") return;
    const api = window.bbmDb || {};
    if (typeof api.projectsStoragePreview !== "function") return;
    try {
      const result = await api.projectsStoragePreview(this.project);
      if (result?.ok) {
        this.projectFolder = normalizeText(result.projectFolder || result.paths?.projectFolder);
        this.storageError = "";
      } else {
        this.storageError = normalizeText(result?.error);
      }
    } catch (error) {
      this.storageError = normalizeText(error?.message);
    }
    this._renderShell();
  }

  _renderShell() {
    if (!this.root) return;
    this.root.replaceChildren();
    if (!this.projectId) {
      this.root.append(this._renderBackButton(), this._renderNoProjectNotice());
      return;
    }
    this.root.append(this._renderProjectView());
  }

  _renderNoProjectNotice() {
    const notice = document.createElement("div");
    notice.className = "bbm-plaene-notice";
    setUiEditorAttributes(notice, {
      id: "plaene.m1.no-project-notice",
      kind: "frame",
      label: "Kein Projekt Hinweis",
      parent: "plaene.m1.root",
    });
    const line1 = document.createElement("p");
    line1.textContent = "Kein Projekt ausgewählt.";
    const line2 = document.createElement("p");
    line2.textContent = "Öffnen Sie zuerst ein Projekt, um dessen Pläne zu verwalten.";
    notice.append(line1, line2);
    return notice;
  }

  _renderProjectView() {
    const fragment = document.createDocumentFragment();
    const projectName = getProjectName(this.project) || "-";
    const buildings = resolveBuildings(this.project);
    const floors = resolveFloors(this.project);

    const header = document.createElement("header");
    header.className = "bbm-plaene-header";
    setUiEditorAttributes(header, {
      id: "plaene.m1.header",
      kind: "frame",
      label: "Pläne Kopfbereich",
      parent: "plaene.m1.root",
    });
    header.append(
      this._renderBackButton(),
      createText("h1", "Modul Pläne", {
        id: "plaene.m1.title",
        kind: "single",
        label: "Modul Pläne Titel",
        parent: "plaene.m1.header",
      }),
      createText("p", `Aktives Projekt: ${projectName}`, {
        id: "plaene.m1.active-project",
        kind: "single",
        label: "Aktives Projekt",
        parent: "plaene.m1.header",
      })
    );

    const summary = document.createElement("div");
    summary.className = "bbm-plaene-summary";
    setUiEditorAttributes(summary, {
      id: "plaene.m1.project-summary",
      kind: "frame",
      label: "Projektkontext Zusammenfassung",
      parent: "plaene.m1.root",
    });
    summary.append(
      createMetric("Projekt-ID", this.projectId, "plaene.m1.project-id"),
      createMetric("Projektordner", this.projectFolder || (this.storageError ? `Nicht verfügbar: ${this.storageError}` : "-"), "plaene.m1.project-folder"),
      createMetric("Anzahl vorhandener Gebäude", String(buildings.length), "plaene.m1.building-count"),
      createMetric("Anzahl vorhandener Geschosse", String(floors.length), "plaene.m1.floor-count")
    );

    const note = createText("p", "Die Planordner-Anbindung folgt in Meilenstein M2.", {
      id: "plaene.m1.next-step-note",
      kind: "single",
      label: "Hinweis Planordner M2",
      parent: "plaene.m1.root",
    });
    note.className = "bbm-plaene-next-step";

    fragment.append(header, summary, note);
    return fragment;
  }
}

export {
  getProjectName,
  resolveBuildings,
  resolveFloors,
};
