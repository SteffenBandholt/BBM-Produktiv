export const EDITOR_SCOPE_KINDS = Object.freeze(["ui", "pdf"]);

export function isEditorScopeKind(value) {
  return EDITOR_SCOPE_KINDS.includes(String(value || ""));
}
