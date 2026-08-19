import { createMainHeaderLauncherUiEditorRegistration } from "../../../ui/MainHeader.uiEditorContract.js";
import { restarbeitenFilterbarUiEditorContract } from "../RestarbeitenFilterbar.uiEditorContract.js";
import { restarbeitenQuicklaneUiEditorContract } from "../RestarbeitenQuicklane.uiEditorContract.js";
import { restarbeitenListUiEditorContract } from "../RestarbeitenList.uiEditorContract.js";
import { restarbeitenEditboxUiEditorContract } from "../RestarbeitenEditbox.uiEditorContract.js";
import { getRestarbeitenMainUiRegistry, RESTARBEITEN_MAIN_UI_SCOPE_ID } from "./restarbeitenEditorScopes.js";
import { createRestarbeitenMainUiHostAdapter } from "./restarbeitenMainUiHostAdapter.js";

const launcher = createMainHeaderLauncherUiEditorRegistration({
  componentId: "bbm.restarbeiten.mainHeaderLauncher",
  scopeId: "restarbeiten.header.root",
  elementId: "restarbeiten.header.action.openUiEditor",
  parentId: "restarbeiten.header.root",
  order: 79,
});

export const RESTARBEITEN_UI_EDITOR_REGISTRATION = Object.freeze({
  registryOrder: 10,
  scopeGroupId: "module-restarbeiten",
  layoutStorageKey: "module-restarbeiten",
  registryVersion: 23,
  scopeIds: Object.freeze(["restarbeiten.header.root", "restarbeiten.list.root", "restarbeiten.edit.root"]),
  componentContracts: Object.freeze([
    restarbeitenFilterbarUiEditorContract,
    restarbeitenQuicklaneUiEditorContract,
    restarbeitenListUiEditorContract,
    restarbeitenEditboxUiEditorContract,
    launcher.componentContract,
  ]),
  launchers: Object.freeze([launcher]),
  blockedScopes: Object.freeze([
    Object.freeze({ scopeId: "restarbeiten.layout.root", name: "Restarbeiten · technischer Alt-Layoutcontainer", reason: "M80_2_split_removed" }),
    Object.freeze({ scopeId: "restarbeiten.notes", name: "Restarbeiten · Notizdialog", reason: "registration_inventory_pending" }),
    Object.freeze({ scopeId: "restarbeiten.output-preview", name: "Restarbeiten · Ausgabevorschau", reason: "M81_pdf_excluded" }),
  ]),
});

export const RESTARBEITEN_EDITOR_RUNTIME_SCOPE = Object.freeze({
  scopeId: RESTARBEITEN_MAIN_UI_SCOPE_ID,
  scopeLabel: "Restarbeiten Hauptansicht",
  kind: "ui",
  registry: getRestarbeitenMainUiRegistry(),
  createHostAdapter: createRestarbeitenMainUiHostAdapter,
  status: "ready",
});
