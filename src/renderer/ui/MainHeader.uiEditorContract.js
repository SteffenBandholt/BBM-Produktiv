import {
  m83Component,
  m83DomainButton,
  m83Slot,
} from "../ui-editor/m83ComponentContract.js";

export function createMainHeaderLauncherUiEditorRegistration({ componentId, scopeId, elementId, parentId, order }) {
  const element = m83DomainButton({
    id: elementId,
    name: "UI-Editor öffnen",
    parentId,
    order,
    actionKind: "openUiEditor",
    componentKind: "developmentLauncher",
    baseline: { width: null, height: null, minWidth: 40, maxWidth: 480, minHeight: 24, maxHeight: 160, minFontSize: 6, maxFontSize: 32 },
  });
  const componentContract = m83Component({
    componentId,
    scopeId,
    requiredSlots: [],
    slots: [m83Slot(element.id, element, {
      required: false,
      referenceKind: "single",
      presence: "whenVisibleInstances",
      requirements: { move: true, resizeWidth: true, resizeHeight: true, setVisibility: true, textResize: true },
    })],
  });
  return Object.freeze({ componentId, scopeId, elementId, componentContract });
}
