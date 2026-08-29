export { default as LicenseAdminScreen } from "./LicenseAdminScreenV2.js";

// Bestehender Export bleibt für Altpfäde/Tests erhalten; die sichtbare
// Oberfläche verwendet ab jetzt LicenseAdminScreenV2.
export { buildCustomerSetupPayload } from "./LicenseAdminScreen.js";

export const LIZENZVERWALTUNG_WORK_SCREEN_ID = "licenseAdmin";
