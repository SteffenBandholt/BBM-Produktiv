"use strict";
const { DOCUMENT_TYPE, validatePreNotificationSnapshot } = require("./preNotificationSnapshots.cjs");
const SIGEKO_DOCUMENT_COLUMNS = Object.freeze(["id", "project_id", "document_type", "snapshot_json", "files_json", "created_at"]);
function fail() { throw Object.assign(new Error("Ungültige gespeicherte SiGeKo-Dokumentfassung."), { code: "SIGEKO_DOCUMENT_INVALID" }); }
function exact(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value)) ||
      Reflect.ownKeys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) fail();
}
function validateDocumentFile(file) {
  exact(file, ["kind", "projectRelativePath", "sha256", "byteSize"]);
  if (!["main", "firms"].includes(file.kind) || typeof file.projectRelativePath !== "string" ||
      !/^SiGeKo\/Unterlagen\/[^/\\]+\.pdf$/.test(file.projectRelativePath) ||
      /[<>:"|?*\u0000-\u001f]/.test(file.projectRelativePath) ||
      /^(?:CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])(?:\.|$)/i.test(file.projectRelativePath.split("/").at(-1)) ||
      /[. ]\.pdf$/.test(file.projectRelativePath) ||
      typeof file.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(file.sha256) ||
      !Number.isSafeInteger(file.byteSize) || file.byteSize <= 0) fail();
  return file;
}
function parseSigekoDocumentFiles(row) {
  let files;
  try { files = JSON.parse(row.files_json); } catch (_) { fail(); }
  if (!Array.isArray(files) || ![1, 2].includes(files.length)) fail();
  files.forEach(validateDocumentFile);
  if (files[0].kind !== "main" || (files.length === 2 &&
      (files[1].kind !== "firms" || files[0].projectRelativePath.toLowerCase() === files[1].projectRelativePath.toLowerCase()))) fail();
  return files;
}
function validateSigekoDocumentRow(row, projectId) {
  exact(row, SIGEKO_DOCUMENT_COLUMNS);
  if (typeof row.id !== "string" || !row.id.trim() || row.id !== row.id.trim() ||
      typeof row.project_id !== "string" || !row.project_id.trim() || row.project_id !== projectId ||
      row.document_type !== DOCUMENT_TYPE || typeof row.snapshot_json !== "string" || typeof row.files_json !== "string" ||
      typeof row.created_at !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(row.created_at) ||
      !Number.isFinite(Date.parse(row.created_at)) || new Date(row.created_at).toISOString() !== row.created_at) fail();
  let snapshot;
  try { snapshot = JSON.parse(row.snapshot_json); validatePreNotificationSnapshot(snapshot, projectId, row.id); } catch (_) { fail(); }
  const files = parseSigekoDocumentFiles(row);
  if (files.length !== (snapshot.form.firmsMode === "attachment" ? 2 : 1) || row.created_at < snapshot.createdAt) fail();
  return row;
}
module.exports = Object.freeze({ SIGEKO_DOCUMENT_COLUMNS, validateDocumentFile, validateSigekoDocumentRow, parseSigekoDocumentFiles });
