import {
  GROUP_LAYOUT,
  m83Component,
  m83DomainButton,
  m83Element,
  m83Slot,
} from "../../ui-editor/m83ComponentContract.js";

const scopeId = "restarbeiten.header.root";

const elements = [
  m83Element({ id: "restarbeiten.quicklane", name: "Restarbeiten-Quicklane", type: "area", role: "layout", parentId: scopeId, order: 80, allowedOps: GROUP_LAYOUT, componentKind: "toolbar", baseline: { width: null, height: null, minWidth: 40, maxWidth: 320, minHeight: 120, maxHeight: 1600 } }),
  m83Element({ id: "restarbeiten.quicklane.group.navigation", name: "Gruppe Navigation", type: "group", role: "layoutGroup", parentId: "restarbeiten.quicklane", order: 81, allowedOps: GROUP_LAYOUT, componentKind: "toolbarGroup" }),
  m83DomainButton({ id: "restarbeiten.quicklane.pin", name: "Fixieren", parentId: "restarbeiten.quicklane.group.navigation", order: 82, actionKind: "pinQuicklane" }),
  m83DomainButton({ id: "restarbeiten.quicklane.action.project", name: "Projekt", parentId: "restarbeiten.quicklane.group.navigation", order: 83, actionKind: "openProject" }),
  m83DomainButton({ id: "restarbeiten.quicklane.action.firms", name: "Firmen", parentId: "restarbeiten.quicklane.group.navigation", order: 84, actionKind: "openFirms" }),
  m83Element({ id: "restarbeiten.quicklane.group.visibility", name: "Gruppe Sichtbarkeit", type: "group", role: "layoutGroup", parentId: "restarbeiten.quicklane", order: 85, allowedOps: GROUP_LAYOUT, componentKind: "toolbarGroup" }),
  m83DomainButton({ id: "restarbeiten.quicklane.action.ampel", name: "Ampel", parentId: "restarbeiten.quicklane.group.visibility", order: 86, actionKind: "toggleAmpel" }),
  m83DomainButton({ id: "restarbeiten.quicklane.action.longtext", name: "Langtext", parentId: "restarbeiten.quicklane.group.visibility", order: 87, actionKind: "toggleLongtext" }),
  m83Element({ id: "restarbeiten.quicklane.group.output", name: "Gruppe Ausgabe", type: "group", role: "layoutGroup", parentId: "restarbeiten.quicklane", order: 88, allowedOps: GROUP_LAYOUT, componentKind: "toolbarGroup" }),
  m83DomainButton({ id: "restarbeiten.quicklane.action.pdfPreview", name: "Ausgabevorschau", parentId: "restarbeiten.quicklane.group.output", order: 89, actionKind: "openPreview" }),
  m83DomainButton({ id: "restarbeiten.quicklane.output.print", name: "Drucken", parentId: "restarbeiten.quicklane.group.output", order: 90, actionKind: "print" }),
  m83DomainButton({ id: "restarbeiten.quicklane.output.email", name: "E-Mail", parentId: "restarbeiten.quicklane.group.output", order: 91, actionKind: "email" }),
];

export const RESTARBEITEN_QUICKLANE_REQUIRED_SLOTS = Object.freeze(elements.map((entry) => entry.id));

export const restarbeitenQuicklaneUiEditorContract = m83Component({
  componentId: "bbm.restarbeiten.quicklane",
  scopeId,
  requiredSlots: RESTARBEITEN_QUICKLANE_REQUIRED_SLOTS,
  slots: elements.map((entry) => m83Slot(entry.id, entry, {
    requirements: {
      move: true,
      resizeWidth: true,
      resizeHeight: true,
      setVisibility: true,
      ...(entry.hasVisibleText ? { textResize: true } : {}),
    },
  })),
});
