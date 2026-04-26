import {
  LicenseAdminScreen,
  createCustomerEditorSection,
  createLicenseEditorSection,
  LIZENZVERWALTUNG_WORK_SCREEN_ID,
} from "./screens/index.js";

export const LIZENZVERWALTUNG_MODULE_ID = "lizenzverwaltung";
export const LIZENZVERWALTUNG_MODULE_LABEL = "Lizenzverwaltung";

function buildLizenzverwaltungScreens() {
  return Object.freeze({
    [LIZENZVERWALTUNG_WORK_SCREEN_ID]: LicenseAdminScreen,
  });
}

export function getLizenzverwaltungModuleEntry() {
  return Object.freeze({
    moduleId: LIZENZVERWALTUNG_MODULE_ID,
    moduleLabel: LIZENZVERWALTUNG_MODULE_LABEL,
    workScreenId: LIZENZVERWALTUNG_WORK_SCREEN_ID,
    screens: buildLizenzverwaltungScreens(),
  });
}

export {
  LicenseAdminScreen,
  createCustomerEditorSection,
  createLicenseEditorSection,
  LIZENZVERWALTUNG_WORK_SCREEN_ID,
};
export * from "./screens/index.js";
export * from "./productScope.js";
export * from "./licenseRecords.js";
