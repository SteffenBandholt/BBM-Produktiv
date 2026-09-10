"use strict";
const { validateDocumentFile } = require("./documents.cjs");
const SIGEKO_PRE_NOTIFICATION_WORKFLOW_COLUMNS = Object.freeze([
  "document_id", "project_id", "signed_file_json", "signed_received_at", "signature_opened_at",
  "authority_opened_at", "return_requested_by", "revision", "created_at", "updated_at",
]);
function invalid() {
  throw Object.assign(new Error("Ungültiger gespeicherter Vorankündigungsablauf."), { code: "PRE_NOTIFICATION_WORKFLOW_INVALID" });
}
function timestamp(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    value.slice(0, 4) !== "0000" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
function identifier(value) { return typeof value === "string" && value.length > 0 && value === value.trim() && !/[\u0000-\u001f]/.test(value); }
function parseSignedReturnFile(row) {
  if (row.signed_file_json === null) return null;
  if (typeof row.signed_file_json !== "string") invalid();
  let file;
  try { file = JSON.parse(row.signed_file_json); validateDocumentFile(file); } catch (_) { invalid(); }
  if (file.kind !== "signed") invalid();
  return file;
}
function validatePreNotificationWorkflowRow(row, projectId) {
  if (!row || typeof row !== "object" || Array.isArray(row) || ![Object.prototype, null].includes(Object.getPrototypeOf(row)) ||
      Reflect.ownKeys(row).length !== SIGEKO_PRE_NOTIFICATION_WORKFLOW_COLUMNS.length ||
      SIGEKO_PRE_NOTIFICATION_WORKFLOW_COLUMNS.some(key => !Object.hasOwn(row, key) || !Object.hasOwn(Object.getOwnPropertyDescriptor(row, key), "value"))) invalid();
  if (!identifier(row.document_id) || !identifier(row.project_id) || row.project_id !== projectId ||
      !Number.isSafeInteger(row.revision) || row.revision < 1 || !timestamp(row.created_at) || !timestamp(row.updated_at) ||
      row.updated_at < row.created_at) invalid();
  for (const key of ["signed_received_at", "signature_opened_at", "authority_opened_at"]) {
    if (row[key] !== null && (!timestamp(row[key]) || row[key] < row.created_at || row[key] > row.updated_at)) invalid();
  }
  if (row.return_requested_by !== null && (typeof row.return_requested_by !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.return_requested_by) || !timestamp(row.return_requested_by + "T00:00:00.000Z"))) invalid();
  const file = parseSignedReturnFile(row);
  if ((file === null) !== (row.signed_received_at === null) || (row.authority_opened_at !== null && file === null)) invalid();
  if (row.authority_opened_at !== null && row.authority_opened_at < row.signed_received_at) invalid();
  return row;
}
function workflowStatus(row) {
  if (row == null) return "red";
  validatePreNotificationWorkflowRow(row, row.project_id);
  return row.authority_opened_at !== null ? "green" : row.signature_opened_at !== null ? "orange" : "red";
}
module.exports = Object.freeze({ SIGEKO_PRE_NOTIFICATION_WORKFLOW_COLUMNS, validatePreNotificationWorkflowRow, parseSignedReturnFile, workflowStatus });
