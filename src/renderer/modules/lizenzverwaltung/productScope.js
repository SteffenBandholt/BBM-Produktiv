export const BBM_PRODUCT_ADAPTER = Object.freeze({
  key: "bbm",
  label: "BBM",
  licenseExtension: "bbmlic",
  editions: Object.freeze([
    Object.freeze({ key: "test", label: "Test" }),
    Object.freeze({ key: "full", label: "Vollversion" }),
  ]),
  bindings: Object.freeze([
    Object.freeze({ key: "none", label: "Nein" }),
    Object.freeze({ key: "machine", label: "Ja" }),
  ]),
  modules: Object.freeze([
    Object.freeze({ key: "protokoll", label: "Protokoll" }),
    Object.freeze({ key: "restarbeiten", label: "Restarbeiten" }),
    Object.freeze({ key: "rechnung", label: "Rechnung", aliases: ["rechnungen"] }),
  ]),
  features: Object.freeze([
    Object.freeze({ key: "diktat", label: "Diktat", aliases: ["audio", "dictate"] }),
  ]),
});

export const PRODUCT_ADAPTERS = Object.freeze({
  [BBM_PRODUCT_ADAPTER.key]: BBM_PRODUCT_ADAPTER,
});

export function getProductAdapter(productKey = "bbm") {
  const normalized = String(productKey || "").trim().toLowerCase();
  return PRODUCT_ADAPTERS[normalized] || null;
}

// Kompatibilitaetsstruktur fuer bestehende Renderer-Bausteine.
// Der fachliche Umfang kommt jetzt aus dem BBM-Adapter und ist nicht mehr
// separat in der Lizenzmaske hart verdrahtet.
export const PRODUCT_SCOPE = Object.freeze({
  standardumfang: Object.freeze({
    title: "Grundumfang",
    note: "Technischer Grundumfang wird automatisch gesetzt und nicht manuell gepflegt.",
    entries: Object.freeze([]),
  }),
  zusatzfunktionen: Object.freeze({
    title: "Zusatzfunktionen",
    entries: BBM_PRODUCT_ADAPTER.features.map((entry) =>
      Object.freeze({ ...entry, defaultEnabled: false })
    ),
  }),
  module: Object.freeze({
    title: "Module",
    note: "Nur die hier gewaehlten Fachmodule werden freigeschaltet.",
    entries: BBM_PRODUCT_ADAPTER.modules,
  }),
});

export function normalizeProductScopeFeatureKey(feature) {
  const normalized = String(feature || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "audio" || normalized === "dictate") return "diktat";
  if (normalized === "rechnungen") return "rechnung";
  return normalized;
}

export function formatProductScopeFeatureLabel(feature) {
  const normalizedFeature = normalizeProductScopeFeatureKey(feature);
  const moduleEntry = BBM_PRODUCT_ADAPTER.modules.find((entry) => entry.key === normalizedFeature);
  if (moduleEntry) return moduleEntry.label;
  const featureEntry = BBM_PRODUCT_ADAPTER.features.find((entry) => entry.key === normalizedFeature);
  if (featureEntry) return featureEntry.label;
  return normalizedFeature;
}
