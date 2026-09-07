import { createModuleDescriptor } from "../../app/modules/moduleDescriptorContract.js";
import SigekoScreen from "./SigekoScreen.js";

export const SIGEKO_MODULE_ID = "sigeko";
export const SIGEKO_MODULE_LABEL = "SiGeKo";

export function getSigekoModuleEntry() {
  return createModuleDescriptor({
    moduleId: SIGEKO_MODULE_ID,
    moduleLabel: SIGEKO_MODULE_LABEL,
    moduleType: "project",
    licenseKey: "module:sigeko",
    workScreenId: "sigeko",
    screens: Object.freeze({ sigeko: SigekoScreen }),
    routes: Object.freeze({ project: Object.freeze([{ screenId: "sigeko" }]) }),
    navigation: Object.freeze({ project: Object.freeze([{
      key: "sigeko", label: "SiGeKo", moduleId: SIGEKO_MODULE_ID,
      workScreenId: "sigeko", section: "sigeko",
      description: "SiGeKo-Arbeitsbereich öffnen. Fachbereiche noch nicht umgesetzt.",
    }]) }),
    presentation: Object.freeze({
      color: "#2563eb", icon: "sigeko",
      description: "SiGeKo-Moduleinstieg; Fachbereiche noch nicht umgesetzt.",
      start: Object.freeze({ mode: "project", label: "Projekt auswählen" }),
    }),
    shell: Object.freeze({ hideSidebar: true }),
    ipcRegistrar: "sigeko",
    migrationRegistrar: "sigeko",
    requiredCapabilities: Object.freeze(["pdf", "mail", "file-storage", "ui-editor"]),
  });
}
