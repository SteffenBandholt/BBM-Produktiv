export const BBM_MODULE_IDS = Object.freeze({
  PROTOKOLL: "protokoll",
  RESTARBEITEN: "restarbeiten",
  RECHNUNG: "rechnung",
});

export const BBM_PRODUCT_MODULE_IDS = Object.freeze(Object.values(BBM_MODULE_IDS));

export const BBM_SHARED_SERVICE_IDS = Object.freeze({
  PDF: "pdf",
  MAIL: "mail",
  EXPORT: "export",
  FILE_STORAGE: "file-storage",
  UI_EDITOR: "ui-editor",
  AUDIO: "audio",
});

export function normalizeBbmModuleId(value) {
  return String(value || "").trim().toLowerCase();
}

export function isKnownBbmProductModuleId(value) {
  return BBM_PRODUCT_MODULE_IDS.includes(normalizeBbmModuleId(value));
}

export * from "./moduleCatalog.js";
export * from "./moduleEntryScreenResolver.js";
export * from "./moduleNavigation.js";
export * from "./moduleScreenResolver.js";
