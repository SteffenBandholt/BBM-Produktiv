import {
  m83Component,
  m83DomainButton,
  m83Slot,
} from "../ui-editor/m83ComponentContract.js";

function launcherComponent({ componentId, scopeId, elementId, parentId, order }) {
  const element = m83DomainButton({
    id: elementId,
    name: "UI-Editor öffnen",
    parentId,
    order,
    actionKind: "openUiEditor",
    componentKind: "developmentLauncher",
    baseline: { width: null, height: null, minWidth: 40, maxWidth: 480, minHeight: 24, maxHeight: 160, minFontSize: 6, maxFontSize: 32 },
  });
  return m83Component({
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
}

export const RESTARBEITEN_MAIN_HEADER_LAUNCHER = Object.freeze({
  componentId: "bbm.restarbeiten.mainHeaderLauncher",
  scopeId: "restarbeiten.header.root",
  elementId: "restarbeiten.header.action.openUiEditor",
});

export const PROTOKOLL_MAIN_HEADER_LAUNCHER = Object.freeze({
  componentId: "bbm.protokoll.mainHeaderLauncher",
  scopeId: "protokoll.screen.root",
  elementId: "protokoll.header.action.openUiEditor",
});

export const RECHNUNG_MAIN_HEADER_LAUNCHER = Object.freeze({
  componentId: "bbm.rechnung.mainHeaderLauncher",
  scopeId: "rechnung.screen",
  elementId: "rechnung.header.action.openUiEditor",
});

export const restarbeitenMainHeaderLauncherUiEditorContract = launcherComponent({
  ...RESTARBEITEN_MAIN_HEADER_LAUNCHER,
  parentId: "restarbeiten.header.root",
  order: 79,
});

export const protokollMainHeaderLauncherUiEditorContract = launcherComponent({
  ...PROTOKOLL_MAIN_HEADER_LAUNCHER,
  parentId: "protokoll.header.actions",
  order: 43,
});

export const rechnungMainHeaderLauncherUiEditorContract = launcherComponent({
  ...RECHNUNG_MAIN_HEADER_LAUNCHER,
  parentId: "rechnung.screen",
  order: 9,
});

export function getMainHeaderLauncherContract(scopeId) {
  return [RESTARBEITEN_MAIN_HEADER_LAUNCHER, PROTOKOLL_MAIN_HEADER_LAUNCHER, RECHNUNG_MAIN_HEADER_LAUNCHER]
    .find((entry) => entry.scopeId === String(scopeId || "").trim()) || null;
}
