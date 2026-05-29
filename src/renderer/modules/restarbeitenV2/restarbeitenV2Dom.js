export function applyRestarbeitenV2Attributes(node, entry) {
  node.setAttribute("data-ui-v2-id", entry.id);
  node.setAttribute("data-ui-v2-kind", entry.kind);
  node.setAttribute("data-ui-v2-label", entry.label);
  node.setAttribute("data-ui-v2-editable", entry.editable ? "true" : "false");
  node.setAttribute("data-ui-v2-ops", Array.isArray(entry.ops) ? entry.ops.join(",") : "");
  if (entry.parentId) {
    node.setAttribute("data-ui-v2-parent", entry.parentId);
  }
  return node;
}

export function createRestarbeitenV2Node(doc, tagName, entry, textContent = "") {
  const node = applyRestarbeitenV2Attributes(doc.createElement(tagName), entry);
  if (textContent) node.textContent = textContent;
  return node;
}

export function createRestarbeitenV2TextBlock(doc, text, className = "") {
  const node = doc.createElement("div");
  if (className) node.className = className;
  node.textContent = text;
  return node;
}
