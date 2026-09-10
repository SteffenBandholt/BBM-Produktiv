import { projectBuilderUiEditorContract, BUILDER_SCOPE } from "../modules/projektverwaltung/screens/ProjectBuilder.uiEditorContract.js";
import { projectPlannedStartUiEditorContract, PLANNED_START_SCOPE } from "../modules/projektverwaltung/screens/ProjectPlannedStart.uiEditorContract.js";
import { sigekoScreenUiEditorContract } from "../modules/sigeko/SigekoScreen.uiEditorContract.js";
import { sigekoPreNotificationUiEditorContract } from "../modules/sigeko/SigekoPreNotificationScreen.uiEditorContract.js";
import { restarbeitenFilterbarUiEditorContract } from "../modules/restarbeiten/RestarbeitenFilterbar.uiEditorContract.js";
import { restarbeitenQuicklaneUiEditorContract } from "../modules/restarbeiten/RestarbeitenQuicklane.uiEditorContract.js";
import { restarbeitenListUiEditorContract } from "../modules/restarbeiten/RestarbeitenList.uiEditorContract.js";
import { restarbeitenEditboxUiEditorContract } from "../modules/restarbeiten/RestarbeitenEditbox.uiEditorContract.js";
import { protokollQuicklaneUiEditorContract, protokollScreenUiEditorContract } from "../modules/protokoll/screens/TopsScreen.uiEditorContract.js";
import { protokollListColumnsUiEditorContract, protokollListUiEditorContract } from "../modules/protokoll/TopsList.uiEditorContract.js";
import { protokollEditUiEditorContract } from "../modules/protokoll/TopsWorkbench.uiEditorContract.js";
import { rechnungUiEditorContract } from "../modules/rechnungen/RechnungScreen.uiEditorContract.js";
import {
  sigekoMainHeaderLauncherUiEditorContract,
  sigekoPreNotificationMainHeaderLauncherUiEditorContract,
  protokollMainHeaderLauncherUiEditorContract,
  restarbeitenMainHeaderLauncherUiEditorContract,
} from "../ui/MainHeader.uiEditorContract.js";
import { aggregateBbmM83Components } from "./m83ComponentContract.js";

export const BBM_M80_REGISTRY_VERSION = 36;
export const BBM_M80_REGISTRY_STATUS = "incomplete";

export const BBM_M83_COMPONENT_CONTRACTS = Object.freeze([
  projectPlannedStartUiEditorContract,
  projectBuilderUiEditorContract,
  sigekoScreenUiEditorContract,
  sigekoMainHeaderLauncherUiEditorContract,
  sigekoPreNotificationUiEditorContract,
  sigekoPreNotificationMainHeaderLauncherUiEditorContract,
  restarbeitenFilterbarUiEditorContract,
  restarbeitenQuicklaneUiEditorContract,
  restarbeitenListUiEditorContract,
  restarbeitenEditboxUiEditorContract,
  restarbeitenMainHeaderLauncherUiEditorContract,
  protokollScreenUiEditorContract,
  protokollQuicklaneUiEditorContract,
  protokollMainHeaderLauncherUiEditorContract,
  protokollListUiEditorContract,
  protokollListColumnsUiEditorContract,
  protokollEditUiEditorContract,
  rechnungUiEditorContract,
]);

const aggregate = aggregateBbmM83Components(BBM_M83_COMPONENT_CONTRACTS);

function completeScope(scopeId) {
  const components = aggregate.components.filter((component) => component.scopeId === scopeId);
  const elements = aggregate.elements.filter((entry) => entry.scopeId === scopeId);
  return Object.freeze({
    scopeId,
    status: "complete",
    inventoryStatus: "componentContractComplete",
    componentIds: Object.freeze(components.map((component) => component.componentId)),
    expectedElementIds: Object.freeze(elements.map((entry) => entry.id)),
    elements: Object.freeze(elements),
  });
}

function blockedScope(scopeId, name, reason = "registration_inventory_pending") {
  return Object.freeze({ scopeId, name, status: "blocked", inventoryStatus: "notInventoried", componentIds: Object.freeze([]), expectedElementIds: Object.freeze([]), elements: Object.freeze([]), reason });
}

export const BBM_M80_ACTIVE_SCOPES = Object.freeze([
  "restarbeiten.header.root", "restarbeiten.list.root", "restarbeiten.edit.root",
  "protokoll.screen.root", "protokoll.list.root", "protokoll.edit.root",
  "rechnung.screen", "sigeko.screen", "sigeko.preNotification", PLANNED_START_SCOPE, BUILDER_SCOPE,
]);

export const BBM_M80_ACTIVE_SCOPE_GROUPS = Object.freeze([
  Object.freeze([PLANNED_START_SCOPE, BUILDER_SCOPE]),
  Object.freeze(["restarbeiten.header.root", "restarbeiten.list.root", "restarbeiten.edit.root"]),
  Object.freeze(["protokoll.screen.root", "protokoll.list.root", "protokoll.edit.root"]),
  Object.freeze(["rechnung.screen"]),
  Object.freeze(["sigeko.screen"]),
  Object.freeze(["sigeko.preNotification"]),
]);

// Mutually exclusive views can select a distinct profile using the existing
// store's declared key. Undeclared groups retain their established module key.
const LAYOUT_STORAGE_GROUPS = Object.freeze([
  Object.freeze({ scopes: Object.freeze(["sigeko.preNotification"]), key: "module-sigeko-prenotification" }),
]);

export function getM80LayoutStorageKey(activeScopes = []) {
  return LAYOUT_STORAGE_GROUPS.find(group => group.scopes.length === activeScopes.length &&
    group.scopes.every(scopeId => activeScopes.includes(scopeId)))?.key || null;
}

export const BBM_M80_REGISTRY_SCOPES = Object.freeze([
  ...BBM_M80_ACTIVE_SCOPES.map(completeScope),
  blockedScope("bbm.shell", "Shell und Hauptnavigation"),
  blockedScope("bbm.home", "Start"),
  blockedScope("bbm.projects", "Projektverwaltung"),
  blockedScope("bbm.project-workspace", "Projektarbeitsplatz"),
  blockedScope("bbm.firms", "Firmen und Personen"),
  blockedScope("bbm.project-firms", "Projektfirmen und Projektpersonen"),
  blockedScope("bbm.settings", "Einstellungen"),
  blockedScope("bbm.help", "Hilfe"),
  blockedScope("bbm.dialogs", "Produktive Dialoge"),
  blockedScope("restarbeiten.layout.root", "Restarbeiten · technischer Alt-Layoutcontainer", "M80_2_split_removed"),
  blockedScope("restarbeiten.notes", "Restarbeiten · Notizdialog"),
  blockedScope("restarbeiten.output-preview", "Restarbeiten · Ausgabevorschau", "M81_pdf_excluded"),
]);

const entries = new Map(aggregate.elements.map((entry) => [entry.id, entry]));
const components = new Map(aggregate.components.map((component) => [component.componentId, component]));

export function getM80RegistryEntry(id) {
  return entries.get(String(id || "")) || null;
}

export function getM83ComponentContract(componentId) {
  return components.get(String(componentId || "")) || null;
}

export function listM83ComponentContracts() {
  return [...aggregate.components];
}

export function listM80RegistryScopes() {
  return BBM_M80_REGISTRY_SCOPES.map((scope) => ({
    ...scope,
    componentIds: [...(scope.componentIds || [])],
    expectedElementIds: [...scope.expectedElementIds],
    elements: scope.elements.map((entry) => ({
      ...entry,
      baseline: { ...entry.baseline, spacing: { ...(entry.baseline?.spacing || {}) } },
      spacingTargets: [...(entry.spacingTargets || [])],
      allowedOps: [...entry.allowedOps],
      lockedOps: [...entry.lockedOps],
    })),
  }));
}

export function m80EditorAttributes(id) {
  const entry = getM80RegistryEntry(id);
  if (!entry) throw new Error(`Nicht registrierte M80-ID: ${id}`);
  return Object.freeze({
    "data-ui-inspector-id": entry.id,
    "data-ui-editor-kind": entry.type,
    "data-ui-editor-label": entry.name,
    "data-ui-editor-parent": entry.parentId || "",
    "data-ui-editor-editable": String(entry.editable),
    "data-ui-editor-ops": entry.allowedOps.join(","),
  });
}
