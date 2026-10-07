import { createModuleDescriptor } from "../../app/modules/moduleDescriptorContract.js";
import AzlHostScreen from "./AzlHostScreen.js";

export const AZL_MODULE_ID = "azl";
export const AZL_MODULE_LABEL = "azL";
export const AZL_WORK_SCREEN_ID = "azl";

export function getAzlModuleEntry() {
  return createModuleDescriptor({
    moduleId: AZL_MODULE_ID,
    moduleLabel: AZL_MODULE_LABEL,
    moduleType: "project",
    licenseKey: "module:azl",
    workScreenId: AZL_WORK_SCREEN_ID,
    screens: Object.freeze({
      [AZL_WORK_SCREEN_ID]: AzlHostScreen,
    }),
    routes: Object.freeze({
      project: Object.freeze([
        Object.freeze({ screenId: AZL_WORK_SCREEN_ID }),
      ]),
    }),
    navigation: Object.freeze({
      project: Object.freeze([
        Object.freeze({
          key: "azl",
          label: "azL",
          moduleId: AZL_MODULE_ID,
          workScreenId: AZL_WORK_SCREEN_ID,
          section: "azl",
          description: "Zusätzlich auszuführende Leistungen verwalten.",
        }),
      ]),
    }),
    presentation: Object.freeze({
      color: "#64748b",
      icon: "azl",
      description: "Zusätzlich auszuführende Leistungen projektbezogen erfassen und auswerten.",
      start: Object.freeze({
        mode: "project",
        label: "Projekt auswählen",
      }),
    }),
    shell: Object.freeze({
      hideSidebar: true,
    }),
    ipcRegistrar: "azl",
    migrationRegistrar: "azl",
    requiredCapabilities: Object.freeze([
      "pdf",
      "export",
      "file-storage",
      "ui-editor",
    ]),
  });
}

export { AzlHostScreen };
