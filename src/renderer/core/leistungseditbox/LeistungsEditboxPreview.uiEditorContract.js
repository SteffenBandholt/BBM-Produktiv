import { m83Component, m83Element, m83Slot } from "../../ui-editor/m83ComponentContract.js";

export const LEISTUNGSEDITBOX_PREVIEW_SCOPE_ID = "leistungseditbox.preview";
export const LEISTUNGSEDITBOX_PREVIEW_COMPONENT_ID = "bbm.leistungseditbox.preview";
export const LEISTUNGSEDITBOX_PREVIEW_FRAME_ID = "leistungseditbox.preview.frame";

const elements = Object.freeze([
  m83Element({
    id: LEISTUNGSEDITBOX_PREVIEW_SCOPE_ID,
    name: "LeistungsEditbox Testfläche",
    type: "root",
    role: "scopeRoot",
    parentId: null,
    order: 0,
    allowedOps: [],
    componentKind: "developmentPreview",
  }),
  m83Element({
    id: LEISTUNGSEDITBOX_PREVIEW_FRAME_ID,
    name: "LeistungsEditbox",
    type: "frame",
    role: "layout",
    parentId: LEISTUNGSEDITBOX_PREVIEW_SCOPE_ID,
    order: 10,
    allowedOps: ["move", "resizeWidth", "resizeHeight"],
    componentKind: "leistungsEditboxFrame",
    unboundedGeometry: true,
    baseline: { width: 640, height: 220 },
  }),
]);

export const leistungsEditboxPreviewUiEditorContract = m83Component({
  componentId: LEISTUNGSEDITBOX_PREVIEW_COMPONENT_ID,
  scopeId: LEISTUNGSEDITBOX_PREVIEW_SCOPE_ID,
  requiredSlots: Object.freeze(elements.map((entry) => entry.id)),
  slots: elements.map((entry) => m83Slot(entry.id, entry)),
});
