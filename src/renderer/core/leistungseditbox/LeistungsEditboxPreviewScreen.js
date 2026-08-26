import { installDevelopmentUiEditorOpenButton } from "../../app/coreShellNavigation.js";
import { beginM83ComponentBinding, completeM80PilotRender, registerM80Ref } from "../../ui-editor/m80Refs.js";
import { m80EditorAttributes } from "../../ui-editor/m80Registry.js";
import { LeistungspositionEditboxAdapter } from "../../shared/leistungsposition/LeistungspositionEditboxAdapter.js";
import { LeistungspositionEditboxHeaderAdapter } from "../../shared/leistungsposition/LeistungspositionEditboxHeaderAdapter.js";
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

function createText(doc, tag, text) {
  const element = doc.createElement(tag);
  element.textContent = text;
  return element;
}

const PREVIEW_POSITIONS = Object.freeze([
  {
    label: "Pos. 21",
    values: {
      basePositionNumber: "21",
      shortText: "Untergrund vorbereiten",
      longText: "Flächen reinigen, lose Bestandteile entfernen und für die weitere Bearbeitung vorbereiten.",
      type: "standard",
      quantity: "12,00",
      quantityDecimalPlaces: 2,
      unit: "m²",
      unitPrice: "18,50",
      gross: false,
      nep: false,
    },
  },
  {
    label: "Pos. 21a",
    values: {
      basePositionNumber: "21",
      alternativeSuffix: "a",
      shortText: "Alternative Untergrundvorbereitung",
      longText: "Alternative Ausführung zur fest vorgegebenen Position 21.",
      type: "alternative",
      quantity: "8,500",
      quantityDecimalPlaces: 3,
      unit: "m²",
      unitPrice: "22,75",
      gross: false,
      nep: true,
    },
  },
  {
    label: "Hinweis",
    values: {
      basePositionNumber: "22",
      shortText: "Hinweis zur Ausführung",
      longText: "Dieser Eintrag ist ein Hinweis ohne Mengen- und Preiszeile.",
      type: "hint",
      quantity: "",
      quantityDecimalPlaces: 2,
      unit: "",
      unitPrice: "",
      gross: false,
      nep: false,
    },
  },
]);

export class LeistungsEditboxPreviewScreen {
  constructor({ documentRef = globalThis.document } = {}) {
    this.documentRef = documentRef;
    this.root = null;
    this.overlay = null;
    this.frame = null;
    this.adapter = null;
    this.headerAdapter = null;
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
    root.style.cssText = "position:fixed;inset:0;z-index:2147480000;display:grid;grid-template-rows:auto auto 1fr;gap:10px;padding:18px;box-sizing:border-box;overflow:auto;background:#eef2f7;color:#172033;font-family:system-ui,sans-serif;";

    const toolbar = doc.createElement("div");
    toolbar.style.cssText = "display:flex;align-items:center;gap:12px;min-height:36px;padding:0 2px;";
    toolbar.append(
      createText(doc, "strong", "LeistungsEditbox · Baustein O"),
      createText(doc, "span", "Eine Editbox kann nacheinander unterschiedliche Positionen laden")
    );

    const actionStatus = createText(doc, "span", "Noch keine Kopfaktion ausgelöst");
    actionStatus.style.cssText = "font-size:12px;color:#64748b;";
    toolbar.appendChild(actionStatus);

    const editorButtonHost = doc.createElement("div");
    editorButtonHost.style.marginLeft = "auto";
    toolbar.appendChild(editorButtonHost);

    const positionSwitch = doc.createElement("div");
    positionSwitch.style.cssText = "display:flex;align-items:center;gap:8px;padding:0 2px;";
    positionSwitch.appendChild(createText(doc, "span", "Testposition laden:"));

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
    frameRoot.style.width = "1040px";
    frameRoot.style.height = "430px";
    frameRoot.style.margin = "0";
    frameRoot.style.border = "2px solid #4d6480";
    frameRoot.style.boxShadow = "0 8px 20px rgba(34,48,68,.16)";
    frameRoot.style.background = "#fff";

    const markAction = (label) => {
      actionStatus.textContent = `Kopfaktion: ${label}`;
    };
    const headerAdapter = new LeistungspositionEditboxHeaderAdapter({
      documentRef: doc,
      title: "Leistungsposition bearbeiten",
      onAddTitle: () => markAction("+ Titel"),
      onAddPosition: () => markAction("+ Position"),
      onMove: () => markAction("Schieben"),
      onDelete: () => markAction("Löschen"),
    });

    const adapter = new LeistungspositionEditboxAdapter({
      documentRef: doc,
      showGross: true,
      showNep: true,
      showPositionAmount: true,
      values: PREVIEW_POSITIONS[0].values,
    });
    adapter.getElement().style.cssText += "height:100%;padding:12px;";

    for (const position of PREVIEW_POSITIONS) {
      const button = doc.createElement("button");
      button.type = "button";
      button.textContent = position.label;
      button.style.cssText = "padding:4px 9px;border:1px solid #c5cfdb;border-radius:4px;background:#fff;color:#25364c;cursor:pointer;";
      button.addEventListener("click", () => {
        adapter.setValues(position.values);
        actionStatus.textContent = `Geladen: ${position.label}`;
      });
      positionSwitch.appendChild(button);
    }

    frame.replaceHeader(headerAdapter.getElement());
    frame.replaceContent(adapter.getElement());

    surface.appendChild(frameRoot);
    root.append(toolbar, positionSwitch, surface);
    doc.body.appendChild(root);

    this.root = placeholder;
    this.overlay = root;
    this.frame = frame;
    this.adapter = adapter;
    this.headerAdapter = headerAdapter;

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
