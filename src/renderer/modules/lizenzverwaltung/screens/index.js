export { default as LicenseAdminScreen } from "./LicenseAdminScreenV3.js";

// Bestehender Export bleibt für Altpfäde/Tests erhalten; die sichtbare
// Oberfläche verwendet die kaufmännische Lizenzverwaltung mit DEV-Bootstrap.
export { buildCustomerSetupPayload } from "./LicenseAdminScreen.js";

export const LIZENZVERWALTUNG_WORK_SCREEN_ID = "licenseAdmin";
