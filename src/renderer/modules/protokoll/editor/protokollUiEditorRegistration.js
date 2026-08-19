import { createMainHeaderLauncherUiEditorRegistration } from "../../../ui/MainHeader.uiEditorContract.js";
import { protokollQuicklaneUiEditorContract, protokollScreenUiEditorContract } from "../screens/TopsScreen.uiEditorContract.js";
import { protokollListColumnsUiEditorContract, protokollListUiEditorContract } from "../TopsList.uiEditorContract.js";
import { protokollEditUiEditorContract } from "../TopsWorkbench.uiEditorContract.js";
import { getProtokollTopsUiRegistry, PROTOKOLL_TOPS_UI_SCOPE_ID } from "./protokollEditorScopes.js";
import { createProtokollTopsUiHostAdapter } from "./protokollTopsUiHostAdapter.js";

const launcher = createMainHeaderLauncherUiEditorRegistration({
  componentId: "bbm.protokoll.mainHeaderLauncher",
  scopeId: "protokoll.screen.root",
  elementId: "protokoll.header.action.openUiEditor",
  parentId: "protokoll.header.actions",
  order: 43,
});

export const PROTOKOLL_UI_EDITOR_REGISTRATION = Object.freeze({
  registryOrder: 20,
  scopeGroupId: "module-protokoll",
  layoutStorageKey: "module-protokoll",
  pdfDocumentTypeId: "protocol",
  registryVersion: 23,
  scopeIds: Object.freeze(["protokoll.screen.root", "protokoll.list.root", "protokoll.edit.root"]),
  componentContracts: Object.freeze([
    protokollScreenUiEditorContract,
    protokollQuicklaneUiEditorContract,
    launcher.componentContract,
    protokollListUiEditorContract,
    protokollListColumnsUiEditorContract,
    protokollEditUiEditorContract,
  ]),
  launchers: Object.freeze([launcher]),
  profileMigrations: Object.freeze([Object.freeze({
    kind: "additiveElement",
    scopeId: "protokoll.screen.root",
    fromFingerprint: "sha256:7251a69f8243bb21a4768170d75ea0d51a4a43a48db0cb4b06caaca565185029",
    toFingerprint: "sha256:8f7f5641264a4602fec6845bf98c2ba8fa14f2ecb60b95f97d9754e47f70a6ef",
    addedElementId: "protokoll.topsScreen.quicklane.filter.option.decision",
    expectedParentId: "protokoll.topsScreen.quicklane.filter.menu",
    archiveLabel: "add-decision-filter",
  })]),
});

export const PROTOKOLL_EDITOR_RUNTIME_SCOPE = Object.freeze({
  scopeId: PROTOKOLL_TOPS_UI_SCOPE_ID,
  scopeLabel: "Protokoll TOPS",
  kind: "ui",
  registry: getProtokollTopsUiRegistry(),
  createHostAdapter: createProtokollTopsUiHostAdapter,
  status: "ready",
});
