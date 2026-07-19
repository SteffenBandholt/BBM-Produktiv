function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeId(value) {
  return String(value ?? "").trim();
}

function compareEntries(left, right) {
  const leftOrder = Number.isFinite(Number(left?.order)) ? Number(left.order) : Number.MAX_SAFE_INTEGER;
  const rightOrder = Number.isFinite(Number(right?.order)) ? Number(right.order) : Number.MAX_SAFE_INTEGER;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  const leftName = normalizeId(left?.name);
  const rightName = normalizeId(right?.name);
  if (leftName !== rightName) return leftName.localeCompare(rightName, "de");
  return normalizeId(left?.id).localeCompare(normalizeId(right?.id), "de");
}

function cloneNode(entry, extra = {}) {
  return {
    id: entry.id,
    name: entry.name,
    type: entry.type,
    role: entry.role,
    parentId: entry.parentId,
    order: entry.order,
    visible: entry.visible,
    editable: entry.editable,
    allowedOps: Array.isArray(entry.allowedOps) ? [...entry.allowedOps] : [],
    lockedOps: Array.isArray(entry.lockedOps) ? [...entry.lockedOps] : [],
    children: [],
    ...extra,
  };
}

function attachChildren(node, byParentId, lookup, warnings, ancestry = new Set()) {
  const childEntries = (byParentId.get(node.id) || []).slice().sort(compareEntries);
  for (const entry of childEntries) {
    const childId = normalizeId(entry.id);
    if (!childId) {
      warnings.push({
        code: "TREE_ENTRY_WITHOUT_ID",
        message: "tree entry without id ignored",
      });
      continue;
    }
    if (ancestry.has(childId)) {
      warnings.push({
        code: "TREE_CYCLE_DETECTED",
        message: `cycle detected for entry: ${childId}`,
        id: childId,
      });
      continue;
    }

    const childNode = cloneNode(entry);
    node.children.push(childNode);
    const nextAncestry = new Set(ancestry);
    nextAncestry.add(node.id);
    attachChildren(childNode, byParentId, lookup, warnings, nextAncestry);
  }
}

export function buildEditorRegistryTree(registry) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(registry)) {
    return {
      ok: false,
      tree: null,
      warnings,
      errors: [
        {
          code: "REGISTRY_NOT_ARRAY",
          message: "registry must be an array",
        },
      ],
    };
  }

  const entries = [];
  const lookup = new Map();

  for (const [index, entry] of registry.entries()) {
    if (!isPlainObject(entry)) {
      warnings.push({
        code: "TREE_ENTRY_NOT_OBJECT",
        message: "registry entry ignored because it is not an object",
        index,
      });
      continue;
    }
    const id = normalizeId(entry.id);
    if (!id) {
      warnings.push({
        code: "TREE_ENTRY_WITHOUT_ID",
        message: "registry entry ignored because id is missing",
        index,
      });
      continue;
    }
    const node = cloneNode(entry);
    entries.push(node);
    lookup.set(id, node);
  }

  const rootEntries = entries.filter((entry) => normalizeId(entry.parentId) === "");
  if (rootEntries.length !== 1) {
    errors.push({
      code: "ROOT_COUNT_INVALID",
      message: "registry must contain exactly one root element",
    });
    return {
      ok: false,
      tree: null,
      warnings,
      errors,
    };
  }

  const root = cloneNode(rootEntries[0], { children: [] });
  const byParentId = new Map();
  for (const entry of entries) {
    const parentId = normalizeId(entry.parentId);
    if (!byParentId.has(parentId)) byParentId.set(parentId, []);
    byParentId.get(parentId).push(entry);
  }

  const orphanEntries = [];
  for (const entry of entries) {
    const parentId = normalizeId(entry.parentId);
    if (!parentId) continue;
    if (!lookup.has(parentId)) {
      warnings.push({
        code: "TREE_ORPHAN_ENTRY",
        message: `orphan entry attached to root because parent is missing: ${entry.id}`,
        id: entry.id,
        parentId,
      });
      orphanEntries.push(entry);
    }
  }

  attachChildren(root, byParentId, lookup, warnings);

  const attachedIds = new Set();
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    attachedIds.add(node.id);
    for (const child of node.children || []) {
      stack.push(child);
    }
  }

  for (const orphan of orphanEntries.sort(compareEntries)) {
    if (attachedIds.has(orphan.id)) continue;
    root.children.push(cloneNode(orphan, { orphan: true, originalParentId: normalizeId(orphan.parentId) }));
  }

  root.children.sort(compareEntries);

  return {
    ok: errors.length === 0,
    tree: root,
    warnings,
    errors,
  };
}

export function flattenEditorRegistryTree(tree) {
  const out = [];
  if (!tree) return out;

  const visit = (node, depth = 0) => {
    const { children = [], ...rest } = node || {};
    out.push({
      ...rest,
      depth,
    });
    for (const child of children) {
      visit(child, depth + 1);
    }
  };

  visit(tree, 0);
  return out;
}
