import TopsScreen from "./screens/TopsScreenIntegrationView.js";
import ProtokollStartScreen from "./screens/ProtokollStartScreen.js";
import { PROTOKOLL_WORK_SCREEN_ID } from "./screens/index.js";
import * as protokollViewModels from "./viewmodel/index.js";
import { createModuleDescriptor } from "../../app/modules/moduleDescriptorContract.js";

export const PROTOKOLL_MODULE_ID = "protokoll";
export const PROTOKOLL_MODULE_LABEL = "Protokoll";
export const PROTOKOLL_NAV_ENTRY_KEY = "protokoll";
export const PROTOKOLL_START_SCREEN_ID = "protokoll.start";

function buildProtokollModuleScreens() {
  return Object.freeze({
    [PROTOKOLL_START_SCREEN_ID]: ProtokollStartScreen,
    [PROTOKOLL_WORK_SCREEN_ID]: TopsScreen,
  });
}

function buildMovedProtocolModuleParts() {
  return Object.freeze({
    viewmodel: protokollViewModels,
  });
}

function buildProtokollModuleNavigation() {
  return Object.freeze({
    project: Object.freeze([
      Object.freeze({
        key: PROTOKOLL_NAV_ENTRY_KEY,
        label: "Protokoll",
        moduleId: PROTOKOLL_MODULE_ID,
        workScreenId: PROTOKOLL_WORK_SCREEN_ID,
        section: "meetings",
      }),
    ]),
  });
}

function buildProtokollModulePresentation() {
  return Object.freeze({
    color: "#22c55e",
    icon: "protocol",
    description: "Besprechungen dokumentieren und Protokolle fortschreiben.",
    start: Object.freeze({
      mode: "project",
      screenId: PROTOKOLL_START_SCREEN_ID,
      label: "Öffnen",
    }),
  });
}

function buildProtokollRoutingAdapter() {
  return Object.freeze({
    project: async ({ router, projectId, options }) => {
      if (!router || typeof router.openProjectProtocol !== "function") return false;
      return await router.openProjectProtocol(projectId, options || {});
    },
  });
}

export function getProtokollModuleEntry() {
  return createModuleDescriptor({
    moduleId: PROTOKOLL_MODULE_ID,
    moduleLabel: PROTOKOLL_MODULE_LABEL,
    moduleType: "project",
    licenseKey: "module:protokoll",
    startScreenId: PROTOKOLL_START_SCREEN_ID,
    workScreenId: PROTOKOLL_WORK_SCREEN_ID,
    screens: buildProtokollModuleScreens(),
    routes: Object.freeze({
      project: Object.freeze([
        Object.freeze({ screenId: PROTOKOLL_START_SCREEN_ID }),
        Object.freeze({ screenId: PROTOKOLL_WORK_SCREEN_ID }),
      ]),
    }),
    navigation: buildProtokollModuleNavigation(),
    routing: buildProtokollRoutingAdapter(),
    ipcRegistrar: "protokoll",
    migrationRegistrar: "protokoll",
    requiredCapabilities: Object.freeze([
      "pdf",
      "mail",
      "export",
      "file-storage",
      "audio",
      "ui-editor",
    ]),
    presentation: buildProtokollModulePresentation(),
    movedParts: buildMovedProtocolModuleParts(),
  });
}

export { ProtokollStartScreen, TopsScreen, PROTOKOLL_WORK_SCREEN_ID };
export * from "./screens/index.js";
export * from "./viewmodel/index.js";
