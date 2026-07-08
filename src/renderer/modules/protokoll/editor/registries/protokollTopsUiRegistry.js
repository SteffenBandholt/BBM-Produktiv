const ROOT_OPS = Object.freeze(["move", "resize", "hide", "show", "spacing", "width", "height"]);
const TOOLBAR_OPS = Object.freeze(["move", "resize", "hide", "show", "spacing", "width", "height"]);
const GROUP_OPS = Object.freeze(["move", "resize", "hide", "show", "spacing"]);
const BUTTON_OPS = Object.freeze(["hide", "show"]);

function createRegistryEntry({ id, name, type, role, parentId, order, allowedOps, lockedOps = [] }) {
  const safeAllowedOps = [...allowedOps];
  const safeLockedOps = [...lockedOps];
  return Object.freeze({
    id,
    name,
    type,
    role,
    parentId,
    order,
    visible: true,
    editable: safeAllowedOps.length > 0,
    allowedOps: safeAllowedOps,
    lockedOps: safeLockedOps,
  });
}

const PROTOKOLL_TOPS_UI_REGISTRY = Object.freeze([
  createRegistryEntry({
    id: "protokoll.root",
    name: "Protokoll",
    type: "root",
    role: "system",
    parentId: null,
    order: 1,
    allowedOps: ROOT_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane",
    name: "TOPS Quicklane",
    type: "toolbar",
    role: "layout",
    parentId: "protokoll.root",
    order: 10,
    allowedOps: TOOLBAR_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.group.navigation",
    name: "Quicklane Navigation",
    type: "group",
    role: "navigation",
    parentId: "protokoll.topsScreen.quicklane",
    order: 10,
    allowedOps: GROUP_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.pin",
    name: "Fixieren",
    type: "button",
    role: "navigation",
    parentId: "protokoll.topsScreen.quicklane.group.navigation",
    order: 10,
    allowedOps: BUTTON_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.action.project",
    name: "Projekt",
    type: "button",
    role: "navigation",
    parentId: "protokoll.topsScreen.quicklane.group.navigation",
    order: 20,
    allowedOps: BUTTON_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.action.firms",
    name: "Firmen",
    type: "button",
    role: "navigation",
    parentId: "protokoll.topsScreen.quicklane.group.navigation",
    order: 30,
    allowedOps: BUTTON_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.action.participants",
    name: "Anwesende",
    type: "button",
    role: "navigation",
    parentId: "protokoll.topsScreen.quicklane.group.navigation",
    order: 40,
    allowedOps: BUTTON_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.group.visibility",
    name: "Quicklane Anzeige",
    type: "group",
    role: "visibility",
    parentId: "protokoll.topsScreen.quicklane",
    order: 20,
    allowedOps: GROUP_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.action.ampel",
    name: "Ampel",
    type: "button",
    role: "visibility",
    parentId: "protokoll.topsScreen.quicklane.group.visibility",
    order: 10,
    allowedOps: BUTTON_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.action.longtext",
    name: "Langtext",
    type: "button",
    role: "visibility",
    parentId: "protokoll.topsScreen.quicklane.group.visibility",
    order: 20,
    allowedOps: BUTTON_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.group.filter",
    name: "Quicklane Filter",
    type: "group",
    role: "visibility",
    parentId: "protokoll.topsScreen.quicklane",
    order: 30,
    allowedOps: GROUP_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.action.topFilter",
    name: "TOP-Filter",
    type: "button",
    role: "visibility",
    parentId: "protokoll.topsScreen.quicklane.group.filter",
    order: 10,
    allowedOps: BUTTON_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.group.output",
    name: "Quicklane Ausgabe",
    type: "group",
    role: "action",
    parentId: "protokoll.topsScreen.quicklane",
    order: 40,
    allowedOps: GROUP_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.action.preview",
    name: "PDF Voransicht",
    type: "button",
    role: "action",
    parentId: "protokoll.topsScreen.quicklane.group.output",
    order: 10,
    allowedOps: BUTTON_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.action.print",
    name: "Drucken",
    type: "button",
    role: "action",
    parentId: "protokoll.topsScreen.quicklane.group.output",
    order: 20,
    allowedOps: BUTTON_OPS,
  }),
  createRegistryEntry({
    id: "protokoll.topsScreen.quicklane.action.mail",
    name: "E-Mail",
    type: "button",
    role: "action",
    parentId: "protokoll.topsScreen.quicklane.group.output",
    order: 30,
    allowedOps: BUTTON_OPS,
  }),
]);

export function getProtokollTopsUiRegistry() {
  return PROTOKOLL_TOPS_UI_REGISTRY.map((entry) => ({
    ...entry,
    allowedOps: [...entry.allowedOps],
    lockedOps: [...entry.lockedOps],
  }));
}
