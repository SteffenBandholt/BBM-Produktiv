function customerKey(value = {}) {
  return `${value.kind || value.ref?.kind}:${value.id || value.ref?.id}`;
}

export function buildCustomerRefresh(response, preferredKey = "") {
  if (!response?.ok) throw new Error(response?.error || "Rechnungskunden konnten nicht geladen werden.");
  const customers = Array.isArray(response.list) ? response.list : [];
  return Object.freeze({
    customers,
    selectedKey: customers.some((entry) => customerKey(entry) === preferredKey) ? preferredKey : "",
  });
}

export function formatCatalogVatRate(entry, defaultVatRatePercent) {
  const value = Number(entry?.vatRatePercent ?? defaultVatRatePercent);
  if (!Number.isInteger(value) || value < 0 || value > 100) throw new Error("Die zentrale Mehrwertsteuer-Vorgabe ist ungültig.");
  return `${value} %`;
}
