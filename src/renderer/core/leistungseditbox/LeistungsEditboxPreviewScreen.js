import { installDevelopmentUiEditorOpenButton } from "../../app/coreShellNavigation.js";
import { beginM83ComponentBinding, completeM80PilotRender, registerM80Ref } from "../../ui-editor/m80Refs.js";
import { m80EditorAttributes } from "../../ui-editor/m80Registry.js";
import { LeistungsEditboxFrame } from "./LeistungsEditboxFrame.js";
import {
  LEISTUNGSEDITBOX_PREVIEW_COMPONENT_ID,
  LEISTUNGSEDITBOX_PREVIEW_FRAME_ID,
  LEISTUNGSEDITBOX_PREVIEW_SCOPE_ID,
} from "./LeistungsEditboxPreview.uiEditorContract.js";

function applyAttributes(element, attributes) {
  for (const [name, value] of Object.entries(attributes || {})) {
    element.setAttribute(name, String(value));
  }
  return element;
}

function register(element, id) {
  applyAttributes(element, m80EditorAttributes(id));
  registerM80Ref(id, element);
  return element;
}

function createText(doc, tag, className, text) {
  const element = doc.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

export class LeistungsEditboxPreviewScreen {
  constructor({ documentRef = globalThis.document } = {}) {
    this.documentRef = documentRef;
    this.root = null;
    this.frame = null;
  }

  render() {
    const doc = this.documentRef;
    beginM83ComponentBinding(LEISTUNGSEDITBOX_PREVIEW_COMPONENT_ID);

    const root = register(doc.createElement("section"), LEISTUNGSEDITBOX_PREVIEW_SCOPE_ID);
    root.className = "bbm-leistungseditbox-preview";
    root.style.cssText = "display:grid;grid-template-rows:auto 1fr;gap:12px;height:100%;min-height:0;padding:12px;box-sizing:border-box;overflow:auto;background:#f6f8fc;";

    const toolbar = doc.createElement("div");
    toolbar.style.cssText = "display:flex;align-items:center;gap:12px;min-height:32px;";
    toolbar.append(
      createText(doc, "strong", "", "LeistungsEditbox · Baustein A"),
      createText(doc, "span", "", "Nur Rahmen/Geometrie – noch keine Fachfelder")
    );

    const editorButtonHost = doc.createElement("div");
    editorButtonHost.style.marginLeft = "auto";
    toolbar.appendChild(editorButtonHost);

    const surface = doc.createElement("div");
    surface.className = "bbm-leistungseditbox-preview__surface";
    surface.style.cssText = "position:relative;min-height:520px;overflow:visible;border:1px dashed #b7c3d4;background:#fff;";

    const frame = new LeistungsEditboxFrame({
      documentRef: doc,
      id: LEISTUNGSEDITBOX_PREVIEW_FRAME_ID,
      label: "LeistungsEditbox",
      parentId: LEISTUNGSEDITBOX_PREVIEW_SCOPE_ID,
    });
    const frameRoot = register(frame.getElement(), LEISTUNGSEDITBOX_PREVIEW_FRAME_ID);
    frameRoot.style.width = "640px";
    frameRoot.style.height = "220px";
    frameRoot.style.margin = "28px 0 0 28px";

    const content = doc.createElement("div");
    content.style.cssText = "display:grid;place-items:center;width:100%;height:100%;box-sizing:border-box;overflow:hidden;font:600 14px/1.3 system-ui,sans-serif;color:#344255;";
    content.textContent = "Baustein A – Testfläche";
    frame.replaceContent(content);

    surface.appendChild(frameRoot);
    root.append(toolbar, surface);

    this.root = root;
    this.frame = frame;

    completeM80PilotRender();
    void installDevelopmentUiEditorOpenButton({
      host: editorButtonHost,
      scopeId: LEISTUNGSEDITBOX_PREVIEW_SCOPE_ID,
      doc,
    });

    return root;
  }

  destroy() {
    this.root = null;
    this.frame = null;
  }
}

export function createLeistungsEditboxPreviewScreen(options = {}) {
  return new LeistungsEditboxPreviewScreen(options);
}
