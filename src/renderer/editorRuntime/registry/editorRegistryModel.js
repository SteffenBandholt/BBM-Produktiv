export const EDITOR_ELEMENT_TYPES = Object.freeze([
  "root",
  "area",
  "group",
  "subgroup",
  "component",
  "componentPart",
  "table",
  "tableColumn",
  "list",
  "card",
  "dialog",
  "toolbar",
  "button",
  "field",
  "label",
  "statusIndicator",
]);

export const EDITOR_ELEMENT_ROLES = Object.freeze([
  "layout",
  "content",
  "meta",
  "structure",
  "status",
  "date",
  "responsible",
  "visibility",
  "action",
  "navigation",
  "system",
]);

export const EDITOR_ALLOWED_OPERATIONS = Object.freeze([
  "inspect",
  "move",
  "resize",
  "resizeWidth",
  "resizeHeight",
  "hide",
  "show",
  "rename",
  "label",
  "spacing",
  "width",
  "height",
  "fontSize",
  "fontWeight",
  "margin",
  "pageBreak",
  "columnWidth",
  "logoSize",
  "footerPosition",
]);

export function isEditorElementType(value) {
  return EDITOR_ELEMENT_TYPES.includes(String(value || ""));
}

export function isEditorElementRole(value) {
  return EDITOR_ELEMENT_ROLES.includes(String(value || ""));
}

export function isEditorOperation(value) {
  return EDITOR_ALLOWED_OPERATIONS.includes(String(value || ""));
}
