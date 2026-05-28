function getModeLabel(mode) {
  const value = String(mode || "").trim();
  if (value === "field") return "Feld";
  if (value === "control") return "Control";
  return "Rahmen";
}

function scheduleRefresh(refresh) {
  if (typeof refresh !== "function") return;
  if (typeof queueMicrotask === "function") {
    queueMicrotask(refresh);
    return;
  }
  Promise.resolve().then(refresh);
}

function createButton(doc, label, onClick) {
  const button = doc.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (typeof onClick === "function") {
    button.addEventListener("click", onClick);
  }
  return button;
}

export function createEditorV2Panel(options = {}) {
  const core = options.core || null;
  let rootNode = null;
  let doc = null;
  let refreshHandler = null;
  let mountedHost = null;
  const nodes = {};

  function getCoreValue(methodName, fallback = "") {
    if (!core || typeof core[methodName] !== "function") return fallback;
    const value = core[methodName]();
    return value == null || value === "" ? fallback : String(value);
  }

  function refresh() {
    if (!rootNode) return false;
    nodes.modeValue.textContent = getModeLabel(getCoreValue("getMode", "frame"));
    nodes.hoverValue.textContent = getCoreValue("getHoverTargetId", "kein Ziel");
    nodes.selectedValue.textContent = getCoreValue("getSelectedTargetId", "kein Ziel");
    for (const [mode, button] of Object.entries(nodes.modeButtons)) {
      button.setAttribute("aria-pressed", getCoreValue("getMode", "frame") === mode ? "true" : "false");
    }
    return true;
  }

  function runCore(methodName, ...args) {
    if (!core || typeof core[methodName] !== "function") return false;
    const result = core[methodName](...args);
    refresh();
    return result;
  }

  function buildPanelStructure(panelDoc) {
    const panel = panelDoc.createElement("aside");
    panel.setAttribute("data-ui-v2-id", "editorv2.panel");
    panel.setAttribute("data-ui-v2-kind", "frame");
    panel.setAttribute("data-ui-v2-label", "Editor V2");
    panel.setAttribute("data-ui-v2-editable", "false");
    panel.setAttribute("data-ui-v2-ops", "");
    panel.style.display = "grid";
    panel.style.gap = "10px";
    panel.style.padding = "12px";
    panel.style.border = "1px solid rgba(0,0,0,0.14)";
    panel.style.borderRadius = "8px";
    panel.style.background = "rgba(255,255,255,0.96)";

    const title = panelDoc.createElement("div");
    title.textContent = "Editor V2";

    const modeBlock = panelDoc.createElement("div");
    const modeLabel = panelDoc.createElement("div");
    modeLabel.textContent = "Modus";
    nodes.modeValue = panelDoc.createElement("strong");
    const modeValueWrap = panelDoc.createElement("div");
    modeValueWrap.append(nodes.modeValue);

    const modeButtonsWrap = panelDoc.createElement("div");
    modeButtonsWrap.style.display = "flex";
    modeButtonsWrap.style.gap = "6px";
    nodes.modeButtons = {
      frame: createButton(panelDoc, "Rahmen", () => runCore("setMode", "frame")),
      field: createButton(panelDoc, "Feld", () => runCore("setMode", "field")),
      control: createButton(panelDoc, "Control", () => runCore("setMode", "control")),
    };
    modeButtonsWrap.append(nodes.modeButtons.frame, nodes.modeButtons.field, nodes.modeButtons.control);
    modeBlock.append(modeLabel, modeValueWrap, modeButtonsWrap);

    const hoverBlock = panelDoc.createElement("div");
    const hoverLabel = panelDoc.createElement("div");
    hoverLabel.textContent = "Hover-Ziel";
    nodes.hoverValue = panelDoc.createElement("div");
    hoverBlock.append(hoverLabel, nodes.hoverValue);

    const selectedBlock = panelDoc.createElement("div");
    const selectedLabel = panelDoc.createElement("div");
    selectedLabel.textContent = "Ausgewähltes Ziel";
    nodes.selectedValue = panelDoc.createElement("div");
    selectedBlock.append(selectedLabel, nodes.selectedValue);

    const moveBlock = panelDoc.createElement("div");
    const moveTitle = panelDoc.createElement("div");
    moveTitle.textContent = "Verschieben";
    const moveRow = panelDoc.createElement("div");
    moveRow.style.display = "flex";
    moveRow.style.gap = "6px";
    moveRow.append(
      createButton(panelDoc, "←", () => runCore("moveSelected", -2, 0)),
      createButton(panelDoc, "→", () => runCore("moveSelected", 2, 0)),
      createButton(panelDoc, "↑", () => runCore("moveSelected", 0, -2)),
      createButton(panelDoc, "↓", () => runCore("moveSelected", 0, 2))
    );
    moveBlock.append(moveTitle, moveRow);

    const resizeBlock = panelDoc.createElement("div");
    const resizeTitle = panelDoc.createElement("div");
    resizeTitle.textContent = "Größe";
    const resizeRow = panelDoc.createElement("div");
    resizeRow.style.display = "flex";
    resizeRow.style.gap = "6px";
    resizeRow.append(
      createButton(panelDoc, "Breite -", () => runCore("resizeSelected", -2, 0)),
      createButton(panelDoc, "Breite +", () => runCore("resizeSelected", 2, 0)),
      createButton(panelDoc, "Höhe -", () => runCore("resizeSelected", 0, -2)),
      createButton(panelDoc, "Höhe +", () => runCore("resizeSelected", 0, 2))
    );
    resizeBlock.append(resizeTitle, resizeRow);

    const resetBlock = panelDoc.createElement("div");
    const resetTitle = panelDoc.createElement("div");
    resetTitle.textContent = "Reset";
    const resetRow = panelDoc.createElement("div");
    resetRow.style.display = "flex";
    resetRow.style.gap = "6px";
    resetRow.append(
      createButton(panelDoc, "Auswahl zurücksetzen", () => runCore("resetSelectedPreview")),
      createButton(panelDoc, "Alles zurücksetzen", () => runCore("resetAllPreview"))
    );
    resetBlock.append(resetTitle, resetRow);

    panel.append(title, modeBlock, hoverBlock, selectedBlock, moveBlock, resizeBlock, resetBlock);
    return panel;
  }

  function render(target) {
    doc = target?.ownerDocument || globalThis.document;
    if (!doc || typeof doc.createElement !== "function") return null;
    rootNode = buildPanelStructure(doc);
    mountedHost = target || doc.body || null;
    if (mountedHost && typeof mountedHost.append === "function") {
      mountedHost.append(rootNode);
    }
    if (!refreshHandler && typeof doc.addEventListener === "function") {
      refreshHandler = () => scheduleRefresh(refresh);
      doc.addEventListener("pointermove", refreshHandler, true);
      doc.addEventListener("pointerdown", refreshHandler, true);
      doc.addEventListener("click", refreshHandler, true);
    }
    refresh();
    return rootNode;
  }

  function unmount() {
    if (doc && refreshHandler && typeof doc.removeEventListener === "function") {
      doc.removeEventListener("pointermove", refreshHandler, true);
      doc.removeEventListener("pointerdown", refreshHandler, true);
      doc.removeEventListener("click", refreshHandler, true);
    }
    if (rootNode?.parentElement?.removeChild) {
      rootNode.parentElement.removeChild(rootNode);
    }
    refreshHandler = null;
    rootNode = null;
    mountedHost = null;
    doc = null;
    return true;
  }

  return {
    render,
    refresh,
    unmount,
    getRootNode: () => rootNode,
  };
}
