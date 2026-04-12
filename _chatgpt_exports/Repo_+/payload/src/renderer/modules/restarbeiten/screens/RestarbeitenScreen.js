import { RestarbeitenWorkbench } from "../components/RestarbeitenWorkbench.js";

export default class RestarbeitenScreen {
  constructor({ router } = {}) {
    this.router = router || null;
    this.root = null;
    this.workbench = null;
  }

  render() {
    if (this.root) return this.root;

    this.root = document.createElement("section");
    this.root.setAttribute("data-screen", "restarbeiten");
    this.root.style.display = "flex";
    this.root.style.flexDirection = "column";
    this.root.style.gap = "16px";
    this.root.style.padding = "12px";

    const intro = document.createElement("div");
    intro.style.display = "flex";
    intro.style.flexDirection = "column";
    intro.style.gap = "6px";

    const title = document.createElement("h1");
    title.textContent = "Restarbeiten";
    title.style.margin = "0";
    title.style.fontSize = "24px";

    const text = document.createElement("p");
    text.textContent =
      "Erster eigenstaendiger Arbeitsanker fuer offene Arbeiten. Noch ohne Router-Anbindung und ohne produktiven Datenfluss.";
    text.style.margin = "0";
    text.style.color = "#526277";

    intro.append(title, text);

    this.workbench = new RestarbeitenWorkbench();
    this.root.append(intro, this.workbench.getElement());
    return this.root;
  }

  async load() {
    return undefined;
  }
}
