function normalizeText(value) {
  return String(value || "").trim();
}

export default class RestarbeitenScreen {
  constructor({ router, projectId, project, moduleId } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;
    this.moduleId = moduleId || "restarbeiten";
  }

  render() {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gap = "8px";

    const title = document.createElement("h2");
    title.textContent = "Restarbeiten";
    title.style.margin = "0";

    const context = document.createElement("div");
    const effectiveProjectId = normalizeText(this.projectId || this.project?.id || "");
    context.textContent = effectiveProjectId
      ? `Projektkontext: #${effectiveProjectId}`
      : "Projektkontext: nicht gesetzt";

    const hint = document.createElement("p");
    hint.style.margin = "0";
    hint.textContent =
      "Modul vorbereitet. Die fachliche Restarbeitenliste folgt in einem späteren Paket.";

    root.append(title, context, hint);
    return root;
  }
}
