export const PRODUCT_SCOPE = {
  standardumfang: {
    title: "Standardumfang",
    note: "Immer enthalten, nicht abwaehlbar.",
    entries: [
      { key: "app", label: "app", alwaysIncluded: true },
      { key: "pdf", label: "pdf", alwaysIncluded: true },
      { key: "export", label: "export", alwaysIncluded: true },
    ],
  },
  zusatzfunktionen: {
    title: "Zusatzfunktionen",
    entries: [
      { key: "mail", label: "mail", defaultEnabled: true },
      { key: "audio", label: "Dictate", defaultEnabled: false, aliases: ["dictate"] },
    ],
  },
  module: {
    title: "Module",
    note: "Vorbereitet, noch nicht aktiv angebunden.",
    entries: [
      { key: "protokoll", label: "Protokoll", preparedOnly: true },
      { key: "dummy", label: "Dummy", preparedOnly: true },
    ],
  },
};

export function normalizeProductScopeFeatureKey(feature) {
  const normalized = String(feature || "").trim().toLowerCase();
  if (normalized === "dictate") return "audio";
  return normalized;
}

export function formatProductScopeFeatureLabel(feature) {
  const normalizedFeature = normalizeProductScopeFeatureKey(feature);
  return normalizedFeature === "audio" ? "Dictate" : normalizedFeature;
}
