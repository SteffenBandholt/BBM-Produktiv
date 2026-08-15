const CUSTOMER_KINDS = new Set(["global_firm", "project_firm"]);

export function customerKey(ref) {
  const source = ref && typeof ref === "object" ? ref : {};
  const kind = String(source.kind || "").trim();
  const id = String(source.id || "").trim();
  if (!CUSTOMER_KINDS.has(kind) || !id) return "";
  return `${kind}:${id}`;
}

export function toInvoiceCustomer(directoryEntry, { projectId = null } = {}) {
  const source = directoryEntry && typeof directoryEntry === "object" ? directoryEntry : {};
  const sourceRef = source.ref && typeof source.ref === "object" ? source.ref : source;
  const kind = String(sourceRef.kind || source.kind || "").trim();
  const id = String(sourceRef.id || source.id || "").trim();
  const label = String(sourceRef.label || source.label || source.name || "").trim();
  const scopedProjectId =
    String(sourceRef.projectId || sourceRef.project_id || source.project_id || "").trim() || null;
  const requestedProjectId = String(projectId || "").trim() || null;

  if (!CUSTOMER_KINDS.has(kind) || !id || !label) {
    throw new Error("FirmDirectory lieferte eine ungültige Kundenreferenz.");
  }
  if (Number(source.uses?.customer ?? source.use_customer) !== 1) {
    throw new Error("FirmDirectory lieferte eine Firma ohne Kundennutzung.");
  }
  if (kind === "project_firm" && (!requestedProjectId || scopedProjectId !== requestedProjectId)) {
    throw new Error("FirmDirectory lieferte einen lokalen Kunden außerhalb des Projektkontexts.");
  }

  const ref = Object.freeze({
    kind,
    id,
    projectId: kind === "project_firm" ? scopedProjectId : null,
    label,
  });
  const scopeLabel = kind === "project_firm" ? "Dieses Projekt" : "Global";
  return Object.freeze({
    key: customerKey(ref),
    ref,
    firm: source,
    label,
    scopeLabel,
    optionLabel: `${label} · ${scopeLabel}`,
  });
}

export async function listInvoiceCustomers({ api, projectId = null } = {}) {
  if (typeof api?.firmDirectoryListCustomers !== "function") {
    return { ok: false, error: "Zentrale Kunden-API ist nicht verfügbar.", list: [] };
  }
  const requestedProjectId = String(projectId || "").trim() || null;
  const response = await api.firmDirectoryListCustomers(
    requestedProjectId ? { projectId: requestedProjectId } : {}
  );
  if (!response?.ok) {
    return { ok: false, error: response?.error || "Kunden konnten nicht geladen werden.", list: [] };
  }
  try {
    const list = (response.list || []).map((entry) =>
      toInvoiceCustomer(entry, { projectId: requestedProjectId })
    );
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
