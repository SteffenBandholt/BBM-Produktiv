export function getNodeUiEditorId(node = null) {
  return String(node?.getAttribute?.("data-ui-editor-id") || "").trim();
}

export function findAncestorUiEditorElementById(targetNode = null, elementId = "") {
  const normalizedElementId = String(elementId || "").trim();
  if (!targetNode || !normalizedElementId) return null;
  let current = targetNode.parentElement || null;
  while (current) {
    if (getNodeUiEditorId(current) === normalizedElementId) return current;
    current = current.parentElement || null;
  }
  return null;
}

export function normalizePreviewTargetMode(value = null) {
  if (typeof value === "string") return value.trim().toLowerCase();
  if (value && typeof value === "object" && typeof value.mode === "string") {
    return value.mode.trim().toLowerCase();
  }
  return "";
}

export function getPreviewTargetMode(registryElement = null) {
  const explicitMode = normalizePreviewTargetMode(registryElement?.previewTargetMode)
    || normalizePreviewTargetMode(registryElement?.previewTarget)
    || normalizePreviewTargetMode(registryElement?.affectsContainer)
    || normalizePreviewTargetMode(registryElement?.editGranularity);
  if (["self", "element", "selected"].includes(explicitMode)) return "self";
  if (["parent", "container", "layoutcontainer", "layout-container"].includes(explicitMode)) return "parent";
  return "auto";
}

export function resolvePreviewTargetElement({
  selectionElement = null,
  selectedId = "",
  targetNode = null,
  getRegisteredElementById = null,
} = {}) {
  const normalizedSelectedId = String(selectedId || selectionElement?.id || "").trim();
  const selectedElement = normalizedSelectedId && typeof getRegisteredElementById === "function"
    ? getRegisteredElementById(normalizedSelectedId) || selectionElement
    : selectionElement;
  if (!targetNode) return null;
  const previewTargetMode = getPreviewTargetMode(selectedElement);
  if (previewTargetMode !== "parent") return targetNode;

  const parentTarget = findAncestorUiEditorElementById(targetNode, selectedElement?.parentId);
  return parentTarget || targetNode;
}

export function getPreviewTargetElement(state = {}) {
  return state.selectedPreviewTargetNode || state.selectedTargetNode || null;
}

export function getPreviewTargetElementId(state = {}, targetNode = null) {
  return getNodeUiEditorId(targetNode) || String(state?.selectedElement?.id || "").trim();
}
