const BBM_UI_EDITOR_DEMO_SCOPE = "bbm.demo.editorMove";

const BBM_UI_EDITOR_DEMO_ELEMENTS = Object.freeze([
  Object.freeze({
    id: "bbm.demo.root",
    name: "BBM UI-Editor Demo",
    type: "root",
    role: "layout",
    parentId: null,
    order: 0,
    visible: true,
    editable: false,
    allowedOps: Object.freeze(["inspect"]),
    lockedOps: Object.freeze([]),
  }),
  Object.freeze({
    id: "bbm.demo.surface",
    name: "Demo-Fläche",
    type: "area",
    role: "layout",
    parentId: "bbm.demo.root",
    order: 10,
    visible: true,
    editable: false,
    allowedOps: Object.freeze(["inspect"]),
    lockedOps: Object.freeze([]),
  }),
  Object.freeze({
    id: "bbm.demo.card.moveable",
    name: "Verschiebbare Demo-Karte",
    type: "card",
    role: "content",
    parentId: "bbm.demo.surface",
    order: 20,
    visible: true,
    editable: true,
    allowedOps: Object.freeze(["inspect", "move"]),
    lockedOps: Object.freeze([]),
  }),
]);

function cloneDemoElement(element) {
  return {
    ...element,
    allowedOps: [...element.allowedOps],
    lockedOps: [...element.lockedOps],
  };
}

export function getBbmUiEditorDemoElements() {
  return BBM_UI_EDITOR_DEMO_ELEMENTS.map(cloneDemoElement);
}

export { BBM_UI_EDITOR_DEMO_SCOPE };
