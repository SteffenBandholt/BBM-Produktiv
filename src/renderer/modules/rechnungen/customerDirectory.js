export function customerKey(ref) {
  if (typeof ref === "string") return String(ref || "").trim();
  const source = ref && typeof ref === "object" ? ref : {};
  return String(source.customerId || source.id || "").trim();
}

export function toInvoiceCustomer(entry) {
  const source = entry && typeof entry === "object" ? entry : {};
  const id = String(source.customerId || source.id || "").trim();
  const label = String(source.name1 || source.companyName || source.label || "").trim();
  if (!id || !label) throw new Error("Customer Core lieferte einen ungueltigen Rechnungskunden.");

  const ref = Object.freeze({
    kind: "customer",
    id,
    customerId: id,
    label,
  });
  const number = String(source.customerNumber || "").trim();
  return Object.freeze({
    key: id,
    ref,
    customer: source,
    firm: null,
    label,
    scopeLabel: number || "Customer Core",
    optionLabel: [number, label].filter(Boolean).join(" · "),
  });
}

export async function listInvoiceCustomers({ api } = {}) {
  if (typeof api?.rechnungListCustomers !== "function") {
    return { ok: false, error: "Zentrale Customer-Core-API ist nicht verfuegbar.", list: [] };
  }
  const response = await api.rechnungListCustomers();
  if (!response?.ok) {
    return { ok: false, error: response?.error || "Kunden konnten nicht geladen werden.", list: [] };
  }
  try {
    return { ok: true, list: (response.list || []).map((entry) => toInvoiceCustomer(entry)) };
  } catch (error) {
    return { ok: false, error: error?.message || String(error), list: [] };
  }
}

export function resolveInvoiceCustomer(customers, refOrKey) {
  const key = customerKey(refOrKey);
  if (!key) return null;
  return (customers || []).find((customer) => customer.key === key) || null;
}
