export const EDITOR_CHANGE_REQUEST_REQUIRED_FIELDS = Object.freeze([
  "changeId",
  "targetAppId",
  "moduleId",
  "scopeId",
  "elementId",
  "operation",
  "payload",
  "createdAt",
  "source",
]);

export const EDITOR_FORBIDDEN_CHANGE_REQUEST_TERMS = Object.freeze([
  "save",
  "delete",
  "submit",
  "send",
  "upload",
  "database",
  "sql",
  "tableName",
  "recordId",
  "entity",
  "businessData",
]);
