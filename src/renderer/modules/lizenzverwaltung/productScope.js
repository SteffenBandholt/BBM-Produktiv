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
    note: "Fachmodule werden je Lizenz einzeln freigeschaltet.",
    entries: [
      { key: "protokoll", label: "Protokoll", preparedOnly: true },
      { key: "rechnung", label: "Rechnung", preparedOnly: true, aliases: ["rechnungen"] },
      { key: "dummy", label: "Dummy", preparedOnly: true },
    ],
  },
};

export function normalizeProductScopeFeatureKey(feature) {
  const normalized = String(feature || "").trim().toLowerCase();
  if (normalized === "dictate") return "audio";
  if (normalized === "rechnungen") return "rechnung";
  return normalized;
}

export function formatProductScopeFeatureLabel(feature) {
  const normalizedFeature = normalizeProductScopeFeatureKey(feature);
  if (normalizedFeature === "audio") return "Dictate";
  if (normalizedFeature === "rechnung") return "Rechnung";
  return normalizedFeature;
}
