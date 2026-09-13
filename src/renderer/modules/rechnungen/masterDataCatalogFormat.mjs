export function formatCatalogVatRate(entry, defaultVatRatePercent) {
  const value = Number(entry?.vatRatePercent ?? defaultVatRatePercent);
  if (!Number.isInteger(value) || value < 0 || value > 100) throw new Error("Die zentrale Mehrwertsteuer-Vorgabe ist ungültig.");
  return `${value} %`;
}
