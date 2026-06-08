function normalizeId(value) {
  return String(value ?? "").trim();
}

function normalizeOps(value) {
  return Array.isArray(value) ? value.map((item) => String(item ?? "")) : [];
}

function findRegistryEntry(registry, elementId) {
  const needle = normalizeId(elementId);
  if (!Array.isArray(registry) || !needle) return null;
  return registry.find((entry) => entry && normalizeId(entry.id) === needle) || null;
}

export function getEditorElementDetails(registry, elementId) {
  const entry = findRegistryEntry(registry, elementId);
  if (!entry) {
    return {
      ok: false,
      errors: [
        {
          code: "ELEMENT_UNKNOWN",
          message: `unknown elementId: ${normalizeId(elementId) || "<empty>"}`,
        },
      ],
      warnings: [],
      details: null,
    };
  }

  const allowedOps = normalizeOps(entry.allowedOps);
  const lockedOps = normalizeOps(entry.lockedOps);
  const lockedSet = new Set(lockedOps);
  const effectiveOps = allowedOps.filter((op) => !lockedSet.has(op));

  return {
    ok: true,
    errors: [],
    warnings: [],
    details: {
      id: entry.id,
      name: entry.name,
      type: entry.type,
      role: entry.role,
      parentId: entry.parentId,
      order: entry.order,
      visible: entry.visible,
      editable: entry.editable,
      allowedOps,
      lockedOps,
      effectiveOps,
    },
  };
}

export function listEditorElementOperations(registry, elementId) {
  const detailsResult = getEditorElementDetails(registry, elementId);
  if (!detailsResult.ok) return detailsResult;
  return {
    ok: true,
    errors: [],
    warnings: [],
    operations: {
      allowedOps: [...detailsResult.details.allowedOps],
      lockedOps: [...detailsResult.details.lockedOps],
      effectiveOps: [...detailsResult.details.effectiveOps],
    },
  };
}
