const PLACEHOLDER_TEXT = "Restarbeitenliste wird neu aufgebaut.";

export default class RestarbeitenScreen {
  constructor({ router, projectId, project, moduleId } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;
    this.moduleId = moduleId || "restarbeiten";
  }

  render() {
    const doc = globalThis.document;
    const host = doc.createElement("section");
    host.setAttribute("data-bbm-restarbeiten-rebuild-placeholder", "true");
    host.style.display = "grid";
    host.style.placeItems = "center";
    host.style.minHeight = "240px";
    host.style.padding = "24px";

    const message = doc.createElement("p");
    message.textContent = PLACEHOLDER_TEXT;
    message.style.margin = "0";
    message.style.fontSize = "16px";
    message.style.fontWeight = "600";
    message.style.color = "#334155";

    host.append(message);
    return host;
  }
}
