"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { validateDocumentFile } = require("../../../shared/sigeko/documents.cjs");
function fail(message) { throw Object.assign(new Error(message), { code: "SIGEKO_DOCUMENT_FILE_INVALID" }); }
// Both normal opening and project transfer verify the recorded bytes. All path
// segments below the selected project root must be real directories/files.
function inspectDocumentFile(projectRoot, file) {
  validateDocumentFile(file);
  const root = path.resolve(projectRoot);
  let current = root;
  try {
    if (!fs.lstatSync(root).isDirectory()) fail("Projektordner fehlt oder ist kein normaler Ordner.");
    const segments = file.projectRelativePath.split("/");
    for (let i = 0; i < segments.length; i++) {
      current = path.join(current, segments[i]);
      const stat = fs.lstatSync(current);
      if (i === segments.length - 1 ? !stat.isFile() : !stat.isDirectory()) fail("Dokumentpfad enthält einen unzulässigen Dateiverweis.");
    }
    const buffer = fs.readFileSync(current);
    if (buffer.length !== file.byteSize || buffer.subarray(0, 5).toString("ascii") !== "%PDF-" ||
        createHash("sha256").update(buffer).digest("hex") !== file.sha256) fail("Gespeicherte PDF fehlt oder wurde verändert.");
    return current;
  } catch (error) {
    if (error.code === "SIGEKO_DOCUMENT_FILE_INVALID") throw error;
    fail("Gespeicherte PDF konnte am Projektpfad nicht unverändert gelesen werden.");
  }
}
module.exports = Object.freeze({ inspectDocumentFile });
