const ALLOWED_KINDS = new Set(["frame", "field", "control"]);
const ALLOWED_OPS = new Set(["move", "resize", "hide"]);

function toText(value) {
  return String(value ?? "").trim();
}

function isAllowedKind(kind) {
  return ALLOWED_KINDS.has(toText(kind));
}

function parseOps(ops) {
  if (Array.isArray(ops)) return ops.map((op) => toText(op)).filter(Boolean);
  if (typeof ops === "string") {
    return ops
      .split(",")
      .map((op) => toText(op))
      .filter(Boolean);
  }
  return [];
}

function isAllowedOperation(entry, op) {
  const normalizedOp = toText(op);
  if (!ALLOWED_OPS.has(normalizedOp)) return false;
  const ops = parseOps(entry?.ops);
  return ops.includes(normalizedOp);
}

function normalizeRegistryEntry(entry, index = 0) {
  if (!entry || typeof entry !== "object") return null;
  const rawOps = parseOps(entry.ops);
  const normalized = {
    ...entry,
    id: toText(entry.id),
    label: toText(entry.label),
    kind: toText(entry.kind),
    editable: entry.editable === true,
    ops: rawOps.filter((op) => ALLOWED_OPS.has(op)),
  };
  normalized._rawEditable = entry.editable;
  normalized._hasSelector = Boolean(toText(entry.selector));
  normalized._hasElementRef = Boolean(entry.elementRef);
  normalized._rawOps = rawOps;
  if (!normalized.parentId) {
    delete normalized.parentId;
  } else {
    normalized.parentId = toText(normalized.parentId);
  }
  if (entry.selector != null) normalized.selector = toText(entry.selector);
  if (entry.elementRef != null) normalized.elementRef = entry.elementRef;
  normalized._index = index;
  return normalized;
}

function normalizeEditorV2Registry(registry) {
  return Array.isArray(registry) ? registry.map((entry, index) => normalizeRegistryEntry(entry, index)).filter(Boolean) : [];
}

function findRegistryEntryById(registry, id) {
  const targetId = toText(id);
  if (!targetId) return null;
  return normalizeEditorV2Registry(registry).find((entry) => entry.id === targetId) || null;
}

function getRegistryEntriesByKind(registry, kind) {
  const normalizedKind = toText(kind);
  if (!isAllowedKind(normalizedKind)) return [];
  return normalizeEditorV2Registry(registry).filter((entry) => entry.kind === normalizedKind);
}

function getParentEntry(registry, entry) {
  if (!entry || !entry.parentId) return null;
  return findRegistryEntryById(registry, entry.parentId);
}

function getChildEntries(registry, parentId) {
  const targetParentId = toText(parentId);
  if (!targetParentId) return [];
  return normalizeEditorV2Registry(registry).filter((entry) => entry.parentId === targetParentId);
}

function resolveElementReference(elementRef) {
  if (!elementRef) return null;
  if (typeof elementRef === "function") {
    try {
      return resolveElementReference(elementRef());
    } catch {
      return null;
    }
  }
  if (typeof elementRef === "object") return elementRef;
  return null;
}

function resolveRegistryElement(rootElement, entry) {
  if (!entry || !rootElement) return null;
  const directRef = resolveElementReference(entry.elementRef);
  if (directRef && typeof directRef.getAttribute === "function") return directRef;

  const selector = toText(entry.selector);
  if (!selector) return null;
  const root = rootElement;
  if (typeof root.querySelector === "function") {
    return root.querySelector(selector) || null;
  }
  if (typeof root.querySelectorAll === "function") {
    const nodes = root.querySelectorAll(selector) || [];
    return nodes[0] || null;
  }
  return null;
}

function resolveRegistryElements(rootElement, registry) {
  const entries = normalizeEditorV2Registry(registry);
  return entries.map((entry) => {
    const element = resolveRegistryElement(rootElement, entry);
    return {
      entry,
      element,
      found: Boolean(element),
    };
  });
}

function checkAcyclic(registry, entry, seen = new Set()) {
  if (!entry?.parentId) return null;
  if (seen.has(entry.id)) return { code: "CYCLE", entryId: entry.id };
  seen.add(entry.id);
  const parent = getParentEntry(registry, entry);
  if (!parent) return { code: "MISSING_PARENT", entryId: entry.id, parentId: entry.parentId };
  if (seen.size >= 4) {
    return { code: "DEPTH_TOO_DEEP", entryId: entry.id };
  }
  return checkAcyclic(registry, parent, seen);
}

function validateEditorV2Registry(registry) {
  const entries = normalizeEditorV2Registry(registry);
  const errors = [];
  const ids = new Set();
  const firstRootId = entries.find((entry) => !entry.parentId)?.id || null;

  for (const entry of entries) {
    if (!entry.id) errors.push({ code: "MISSING_ID", entry });
    if (!entry.label) errors.push({ code: "MISSING_LABEL", entry });
    if (!isAllowedKind(entry.kind)) errors.push({ code: "INVALID_KIND", entry });
    if (entry._rawEditable !== true && entry._rawEditable !== false) {
      errors.push({ code: "MISSING_EDITABLE", entry });
    }
    if (entry.id) {
      if (ids.has(entry.id)) errors.push({ code: "DUPLICATE_ID", entry });
      ids.add(entry.id);
    }
    if (!entry.parentId && entry.id !== firstRootId) {
      errors.push({ code: "MISSING_PARENT_ID", entry });
    }
    if (entry.parentId && !findRegistryEntryById(entries, entry.parentId)) {
      errors.push({ code: "MISSING_PARENT", entry, parentId: entry.parentId });
    }
    if (!entry._hasSelector && !entry._hasElementRef) {
      errors.push({ code: "MISSING_SELECTOR_OR_ELEMENTREF", entry });
    }
    const rawOps = Array.isArray(entry._rawOps) ? entry._rawOps : parseOps(entry.ops);
    if (rawOps.length === 0) {
      errors.push({ code: "MISSING_OPS", entry });
    }
    for (const op of rawOps) {
      if (!ALLOWED_OPS.has(op)) errors.push({ code: "INVALID_OP", entry, op });
    }
    if (!Array.isArray(entry.ops)) errors.push({ code: "INVALID_OPS", entry });
  }

  for (const entry of entries) {
    const chainError = checkAcyclic(entries, entry, new Set());
    if (chainError) errors.push(chainError);
    const depth = getDepth(entries, entry);
    if (depth > 4) {
      errors.push({ code: "DEPTH_TOO_DEEP", entryId: entry.id, depth });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    entries,
  };
}

function getDepth(registry, entry) {
  let depth = 1;
  let current = entry;
  const visited = new Set([entry?.id]);
  while (current?.parentId) {
    const parent = getParentEntry(registry, current);
    if (!parent) break;
    if (visited.has(parent.id)) return Number.POSITIVE_INFINITY;
    visited.add(parent.id);
    depth += 1;
    current = parent;
  }
  return depth;
}

export {
  ALLOWED_KINDS,
  ALLOWED_OPS,
  findRegistryEntryById,
  getChildEntries,
  getParentEntry,
  getRegistryEntriesByKind,
  isAllowedKind,
  isAllowedOperation,
  normalizeEditorV2Registry,
  resolveRegistryElement,
  resolveRegistryElements,
  validateEditorV2Registry,
};
