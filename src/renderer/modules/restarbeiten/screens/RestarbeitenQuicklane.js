function createQuicklaneSection(doc, title) {
  const section = doc.createElement("section");
  section.className = "restarbeiten-quicklane__section";
  const heading = doc.createElement("h3");
  heading.className = "restarbeiten-quicklane__sectionTitle";
  heading.textContent = title;
  section.append(heading);
  return section;
}

export default class RestarbeitenQuicklane {
  constructor({ onPrint = null } = {}) {
    this.onPrint = typeof onPrint === "function" ? onPrint : null;
    this.root = null;
  }

  render(documentRef = globalThis.document) {
    const doc = documentRef;
    const root = doc.createElement("aside");
    root.className = "restarbeiten-quicklane";
    root.setAttribute("data-bbm-restarbeiten-quicklane", "true");

    const outputSection = createQuicklaneSection(doc, "Ausgabe");
    const printBtn = doc.createElement("button");
    printBtn.type = "button";
    printBtn.className = "restarbeiten-quicklane__button";
    printBtn.textContent = "Drucken";
    printBtn.onclick = () => this.onPrint?.();
    outputSection.append(printBtn);

    root.append(outputSection);
    this.root = root;
    return root;
  }
}
