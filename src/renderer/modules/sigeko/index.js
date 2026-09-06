import { createModuleDescriptor } from "../../app/modules/moduleDescriptorContract.js";

export const SIGEKO_MODULE_ID = "sigeko";
export const SIGEKO_MODULE_LABEL = "SiGeKo";

export function getSigekoModuleEntry() {
  return createModuleDescriptor({
    moduleId: SIGEKO_MODULE_ID,
    moduleLabel: SIGEKO_MODULE_LABEL,
    moduleType: "project",
    licenseKey: "module:sigeko",
    // Screens, Navigation und sichtbarer Einstieg folgen in S1.2.
    screens: Object.freeze({}),
    routes: Object.freeze({}),
    navigation: Object.freeze({}),
    ipcRegistrar: "sigeko",
    migrationRegistrar: "sigeko",
    requiredCapabilities: Object.freeze(["pdf", "mail", "file-storage", "ui-editor"]),
  });
}
