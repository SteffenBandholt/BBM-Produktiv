import {
  DEMO_ELEMENT_ID,
  DEFAULT_DEMO_LAYOUT_VALUE,
  bbmUiEditorDemoLayoutStore,
  moveDemoLayoutValue,
} from "./bbmUiEditorDemoLayout.js";

const BUTTONS = Object.freeze([
  Object.freeze({ label: "Links", action: "left" }),
  Object.freeze({ label: "Rechts", action: "right" }),
  Object.freeze({ label: "Hoch", action: "up" }),
  Object.freeze({ label: "Runter", action: "down" }),
  Object.freeze({ label: "Zurücksetzen", action: "reset" }),
]);

function setText(node, value) {
  if (node) node.textContent = String(value);
}

function appendChildren(parent, children = []) {
  for (const child of children) {
    parent?.appendChild?.(child);
  }
  return parent;
}

function setAttrs(node, attrs = {}) {
  for (const [key, value] of Object.entries(attrs)) {
    node?.setAttribute?.(key, String(value));
  }
  return node;
}

function setStyle(node, styles = {}) {
  if (!node?.style) return node;
  for (const [key, value] of Object.entries(styles)) {
    node.style[key] = String(value);
  }
  return node;
}

function createNode(ui, tag, attrs = {}, text = "", styles = {}) {
  const node = ui.node(tag);
  setAttrs(node, attrs);
  setText(node, text);
  setStyle(node, styles);
  return node;
}

function renderPositionText(layoutValue) {
  return `x=${layoutValue.x} y=${layoutValue.y}`;
}

function applyCardPosition(cardNode, layoutValue) {
  if (!cardNode?.style) return;
  cardNode.style.transform = `translate(${layoutValue.x}px, ${layoutValue.y}px)`;
}

function renderDemoView({ ui, layoutEntry, onAction }) {
  const layoutValue = layoutEntry.layoutValue;
  const root = createNode(
    ui,
    "section",
    {
      class: "bbm-ui-editor-demo",
      "data-ui-editor-demo-scope": "bbm.demo.editorMove",
      "data-ui-inspector-id": "bbm.demo.root",
      "data-ui-editor-kind": "frame",
      "data-ui-editor-label": "BBM UI-Editor Demo",
      "data-ui-editor-editable": "false",
      "data-ui-editor-ops": "inspect",
    },
    "",
    {
      display: "grid",
      gap: "16px",
      padding: "24px",
    }
  );
  const title = createNode(ui, "h1", {}, "UI-Editor Demo");
  const hint = createNode(
    ui,
    "p",
    { class: "bbm-ui-editor-demo__hint" },
    "Isolierter Demo-Scope – keine bestehende BBM-UI wird ausgewertet."
  );
  const position = createNode(ui, "p", { class: "bbm-ui-editor-demo__position" }, renderPositionText(layoutValue));
  const surface = createNode(
    ui,
    "div",
    {
      class: "bbm-ui-editor-demo__surface",
      "data-ui-inspector-id": "bbm.demo.surface",
      "data-ui-editor-kind": "frame",
      "data-ui-editor-label": "Demo-Fläche",
      "data-ui-editor-parent": "bbm.demo.root",
      "data-ui-editor-editable": "false",
      "data-ui-editor-ops": "inspect",
    },
    "",
    {
      position: "relative",
      minHeight: "260px",
      overflow: "hidden",
      border: "1px solid #b8c0cc",
      background: "#f7f9fb",
    }
  );
  const card = createNode(
    ui,
    "div",
    {
      class: "bbm-ui-editor-demo__card",
      "data-ui-inspector-id": DEMO_ELEMENT_ID,
      "data-ui-editor-kind": "single",
      "data-ui-editor-label": "Verschiebbare Demo-Karte",
      "data-ui-editor-parent": "bbm.demo.surface",
      "data-ui-editor-editable": "true",
      "data-ui-editor-ops": "inspect,move",
    },
    "Verschiebbare Demo-Karte",
    {
      position: "absolute",
      inlineSize: "220px",
      minHeight: "86px",
      padding: "16px",
      border: "1px solid #43556f",
      background: "#ffffff",
      boxShadow: "0 8px 24px rgba(20, 35, 55, 0.16)",
    }
  );
  const controls = createNode(
    ui,
    "div",
    { class: "bbm-ui-editor-demo__controls" },
    "",
    {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    }
  );

  for (const buttonDef of BUTTONS) {
    const button = createNode(ui, "button", { type: "button" }, buttonDef.label);
    button?.addEventListener?.("click", () => onAction(buttonDef.action));
    controls?.appendChild?.(button);
  }

  applyCardPosition(card, layoutValue);
  appendChildren(surface, [card]);
  appendChildren(root, [title, hint, surface, position, controls]);

  return {
    root,
    card,
    position,
    sync(nextLayoutValue) {
      applyCardPosition(card, nextLayoutValue);
      setText(position, renderPositionText(nextLayoutValue));
    },
  };
}

class BbmUiEditorDemoScreen {
  constructor({ ui, layoutStore = bbmUiEditorDemoLayoutStore } = {}) {
    this.ui = ui || null;
    this.layoutStore = layoutStore;
    this.layoutEntry = this.layoutStore.load(DEMO_ELEMENT_ID);
    this.view = null;
  }

  render() {
    this.view = renderDemoView({
      ui: this.ui,
      layoutEntry: this.layoutEntry,
      onAction: (action) => this.applyAction(action),
    });
    return this.view.root;
  }

  applyAction(action) {
    if (action === "reset") {
      this.layoutEntry = this.layoutStore.reset();
    } else {
      this.layoutEntry = this.layoutStore.save({
        elementId: DEMO_ELEMENT_ID,
        layoutValue: moveDemoLayoutValue(this.layoutEntry.layoutValue, action),
      });
    }
    this.view?.sync?.(this.layoutEntry.layoutValue);
    return this.layoutEntry;
  }

  load() {
    this.layoutEntry = this.layoutStore.load(DEMO_ELEMENT_ID);
    this.view?.sync?.(this.layoutEntry.layoutValue);
    return this.layoutEntry;
  }
}

function createBbmUiEditorDemoScreen(options = {}) {
  return new BbmUiEditorDemoScreen(options);
}

export {
  BbmUiEditorDemoScreen,
  BUTTONS,
  DEFAULT_DEMO_LAYOUT_VALUE,
  createBbmUiEditorDemoScreen,
  renderDemoView,
  renderPositionText,
};
