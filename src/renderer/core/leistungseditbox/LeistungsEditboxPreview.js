import { LeistungsEditboxFrame } from "./LeistungsEditboxFrame.js";

const PREVIEW_ROOT_ID = "leistungseditbox.preview";
const PREVIEW_SURFACE_ID = "leistungseditbox.preview.surface";
const PREVIEW_FRAME_ID = "leistungseditbox.preview.frame";

function setInspectorAttributes(node, { id, label, parentId = "", editable = false, ops = "inspect" }) {
  node.setAttribute("data-ui-inspector-id", id);
  node.setAttribute("data-ui-editor-kind", "frame");
  node.setAttribute("data-ui-editor-label", label);
  if (parentId) node.setAttribute("data-ui-editor-parent", parentId);
  node.setAttribute("data-ui-editor-editable", editable ? "true" : "false");
  node.setAttribute("data-ui-editor-ops", ops);
}

export function createLeistungsEditboxPreview({ documentRef = globalThis.document, parentId = "bbm.demo.root" } = {}) {
  const doc = documentRef;
  if (!doc?.createElement) throw new Error("LeistungsEditboxPreview benötigt ein Document.");

  const root = doc.createElement("section");
  root.className = "bbm-leistungseditbox-preview";
  setInspectorAttributes(root, {
    id: PREVIEW_ROOT_ID,
    label: "LeistungsEditbox Preview",
    parentId,
    editable: false,
  });
  Object.assign(root.style, {
    display: "grid",
    gap: "10px",
  });

  const heading = doc.createElement("h2");
  heading.textContent = "LeistungsEditbox – Baustein A";
  heading.style.margin = "0";

  const hint = doc.createElement("p");
  hint.textContent = "Nur Rahmen und Geometrie. Keine Fachfelder, keine Fachlogik.";
  Object.assign(hint.style, {
    margin: "0",
    color: "#5f6877",
  });

  const surface = doc.createElement("div");
  surface.className = "bbm-leistungseditbox-preview__surface";
  setInspectorAttributes(surface, {
    id: PREVIEW_SURFACE_ID,
    label: "LeistungsEditbox Testfläche",
    parentId: PREVIEW_ROOT_ID,
    editable: false,
  });
  Object.assign(surface.style, {
    position: "relative",
    height: "320px",
    overflow: "visible",
    border: "1px dashed #aeb8c7",
    background: "#f7f9fb",
  });

  const frame = new LeistungsEditboxFrame({
    documentRef: doc,
    id: PREVIEW_FRAME_ID,
    label: "LeistungsEditbox Rahmen",
    parentId: PREVIEW_SURFACE_ID,
  });
  const frameRoot = frame.getElement();
  Object.assign(frameRoot.style, {
    position: "absolute",
    left: "36px",
    top: "42px",
    width: "520px",
    height: "180px",
  });

  const marker = doc.createElement("div");
  marker.textContent = "Baustein A – Testfläche";
  Object.assign(marker.style, {
    display: "grid",
    placeItems: "center",
    width: "100%",
    height: "100%",
    color: "#536172",
    fontSize: "13px",
    pointerEvents: "none",
    userSelect: "none",
  });
  frame.replaceContent(marker);

  surface.appendChild(frameRoot);
  root.append(heading, hint, surface);

  return {
    root,
    surface,
    frame,
    frameRoot,
    measure() {
      const rect = frameRoot.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      };
    },
  };
}

export {
  PREVIEW_ROOT_ID,
  PREVIEW_SURFACE_ID,
  PREVIEW_FRAME_ID,
};
