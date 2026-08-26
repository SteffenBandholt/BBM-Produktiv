import { installDevelopmentUiEditorOpenButton } from "../../app/coreShellNavigation.js";
import { beginM83ComponentBinding, completeM80PilotRender, registerM80Ref } from "../../ui-editor/m80Refs.js";
import { m80EditorAttributes } from "../../ui-editor/m80Registry.js";
import { LeistungspositionEditboxAdapter } from "../../shared/leistungsposition/LeistungspositionEditboxAdapter.js";
import { LeistungsEditboxAction } from "./LeistungsEditboxAction.js";
import { LeistungsEditboxFrame } from "./LeistungsEditboxFrame.js";
import { LeistungsEditboxHeader } from "./LeistungsEditboxHeader.js";
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

function createText(doc, tag, text) {
  const element = doc.createElement(tag);
  element.textContent = text;
  return element;
}

export class LeistungsEditboxPreviewScreen {
  constructor({ documentRef = globalThis.document } = {}) {
    this.documentRef = documentRef;
    this.root = null;
    this.overlay = null;
    this.frame = null;
    this.adapter = null;
  }

  render() {
    const doc = this.documentRef;
    beginM83ComponentBinding(LEISTUNGSEDITBOX_PREVIEW_COMPONENT_ID);

    const placeholder = doc.createElement("div");
    placeholder.setAttribute("data-leistungseditbox-preview-placeholder", "true");

    const previousOverlay = doc.querySelector?.('[data-leistungseditbox-preview-overlay="true"]');
    previousOverlay?.remove?.();

    const root = register(doc.createElement("section"), LEISTUNGSEDITBOX_PREVIEW_SCOPE_ID);
    root.setAttribute("data-leistungseditbox-preview-overlay", "true");
    root.className = "bbm-leistungseditbox-preview";
    root.style.cssText = "position:fixed;inset:0;z-index:2147480000;display:grid;grid-template-rows:auto 1fr;gap:14px;padding:18px;box-sizing:border-box;overflow:auto;background:#eef2f7;color:#172033;font-family:system-ui,sans-serif;";

    const toolbar = doc.createElement("div");
    toolbar.style.cssText = "display:flex;align-items:center;gap:12px;min-height:36px;padding:0 2px;";
    toolbar.append(
      createText(doc, "strong", "LeistungsEditbox · Baustein I"),
      createText(doc, "span", "Mengenformat direkt als 0,00 steuerbar")
    );

    const editorButtonHost = doc.createElement("div");
    editorButtonHost.style.marginLeft = "auto";
    toolbar.appendChild(editorButtonHost);

    const surface = doc.createElement("div");
    surface.className = "bbm-leistungseditbox-preview__surface";
    surface.style.cssText = "position:relative;min-height:560px;overflow:visible;border:1px dashed #9ba9bb;background:#fff;";

    const frame = new LeistungsEditboxFrame({
      documentRef: doc,
      id: LEISTUNGSEDITBOX_PREVIEW_FRAME_ID,
      label: "LeistungsEditbox",
      parentId: LEISTUNGSEDITBOX_PREVIEW_SCOPE_ID,
    });
    const frameRoot = register(frame.getElement(), LEISTUNGSEDITBOX_PREVIEW_FRAME_ID);
    frameRoot.style.position = "absolute";
    frameRoot.style.left = "36px";
    frameRoot.style.top = "42px";
    frameRoot.style.width = "940px";
    frameRoot.style.height = "430px";
    frameRoot.style.margin = "0";
    frameRoot.style.border = "2px solid #4d6480";
    frameRoot.style.boxShadow = "0 8px 20px rgba(34,48,68,.16)";
    frameRoot.style.background = "#fff";

    const leftAction = new LeistungsEditboxAction({ documentRef: doc, label: "Aktion links" });
    const centerAction = new LeistungsEditboxAction({ documentRef: doc, label: "Aktion mitte" });
    const rightAction = new LeistungsEditboxAction({ documentRef: doc, label: "Aktion rechts" });
    const header = new LeistungsEditboxHeader({
      documentRef: doc,
      title: "Leistungsposition bearbeiten",
      left: [leftAction.getElement()],
      center: [centerAction.getElement()],
      right: [rightAction.getElement()],
    });

    const adapter = new LeistungspositionEditboxAdapter({
      documentRef: doc,
      showGross: true,
      showNep: true,
      values: {
        basePositionNumber: "21",
        alternativeSuffix: "a",
        shortText: "Untergrund vorbereiten – Alternative",
        longText: "Alternative Ausführung zur fest vorgegebenen Position 21. Die Hauptnummer bleibt unverändert erhalten.",
        type: "alternative",
        quantity: "12,00",
        quantityDecimalPlaces: 2,
        unit: "m²",
        unitPrice: "18,50",
        gross: false,
        nep: true,
      },
    });
    adapter.getElement().style.cssText += "height:100%;padding:12px;";

    frame.replaceHeader(header.getElement());
    frame.replaceContent(adapter.getElement());

    surface.appendChild(frameRoot);
    root.append(toolbar, surface);
    doc.body.appendChild(root);

    this.root = placeholder;
    this.overlay = root;
    this.frame = frame;
    this.adapter = adapter;

    completeM80PilotRender();
    void installDevelopmentUiEditorOpenButton({
      host: editorButtonHost,
      scopeId: LEISTUNGSEDITBOX_PREVIEW_SCOPE_ID,
      doc,
    });

    return placeholder;
  }

  destroy() {
    // Entwicklungs-Preview absichtlich nicht beim Wechsel eines anderen BBM-Screens
    // entfernen: Diagnostik-/Startpfade duerfen die Abnahmeflaeche nicht ueberdecken.
  }
}

export function createLeistungsEditboxPreviewScreen(options = {}) {
  return new LeistungsEditboxPreviewScreen(options);
}
