const CUSTOMER_KINDS = new Set(["global_firm"]);

export function customerKey(ref) {
  const source = ref && typeof ref === "object" ? ref : {};
  const kind = String(source.kind || "").trim();
  const id = String(source.id || "").trim();
  if (!CUSTOMER_KINDS.has(kind) || !id) return "";
  return `${kind}:${id}`;
}

export function toInvoiceCustomer(directoryEntry) {
  const source = directoryEntry && typeof directoryEntry === "object" ? directoryEntry : {};
  const sourceRef = source.ref && typeof source.ref === "object" ? source.ref : source;
  const kind = String(sourceRef.kind || source.kind || "").trim();
  const id = String(sourceRef.id || source.id || "").trim();
  const label = String(sourceRef.label || source.label || source.name || "").trim();
  if (!CUSTOMER_KINDS.has(kind) || !id || !label) {
    throw new Error("FirmDirectory lieferte eine ungültige Kundenreferenz.");
  }
  if (Number(source.uses?.customer ?? source.use_customer) !== 1) {
    throw new Error("FirmDirectory lieferte eine Firma ohne Kundennutzung.");
  }
  const ref = Object.freeze({
    kind,
    id,
    projectId: null,
    label,
  });
  const scopeLabel = "Zentrale Firma";
  return Object.freeze({
    key: customerKey(ref),
    ref,
    firm: source,
    label,
    scopeLabel,
    optionLabel: `${label} · ${scopeLabel}`,
  });
}

export async function listInvoiceCustomers({ api } = {}) {
  if (typeof api?.firmDirectoryListCustomers !== "function") {
    return { ok: false, error: "Zentrale Kunden-API ist nicht verfügbar.", list: [] };
  }
  const response = await api.firmDirectoryListCustomers({});
  if (!response?.ok) {
    return { ok: false, error: response?.error || "Kunden konnten nicht geladen werden.", list: [] };
  }
  try {
    const list = (response.list || []).map((entry) => toInvoiceCustomer(entry));
    return { ok: true, list };
  } catch (error) {
    return { ok: false, error: error?.message || String(error), list: [] };
  }
}

export function resolveInvoiceCustomer(customers, refOrKey) {
  const key = typeof refOrKey === "string" ? refOrKey : customerKey(refOrKey);
  if (!key) return null;
  return (customers || []).find((customer) => customer.key === key) || null;
}
