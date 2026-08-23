"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function safeSegment(value, fallback = "Rechnung") {
  const normalized = String(value || "")
    .trim()
    .split("")
    .map((character) => character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character) ? "_" : character)
    .join("")
    .replace(/[. ]+$/g, "")
    .slice(0, 100);
  return normalized || fallback;
}

function invoicePdfFileName(invoiceNumber) {
  return `${safeSegment(invoiceNumber, "Rechnung")}.pdf`;
}

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  const descriptor = fs.openSync(filePath, "r");
  try {
    const buffer = Buffer.allocUnsafe(64 * 1024);
    let bytesRead = 0;
    let position = 0;
    do {
      bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, position);
      if (bytesRead > 0) {
        hash.update(buffer.subarray(0, bytesRead));
        position += bytesRead;
      }
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(descriptor);
  }
  return hash.digest("hex");
}

function validatePdfFile(filePath) {
  const resolvedPath = path.resolve(String(filePath || ""));
  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile() || stat.size < 11) {
    throw new Error("Finale Rechnungs-PDF ist leer oder nicht lesbar.");
  }
  const descriptor = fs.openSync(resolvedPath, "r");
  try {
    const signature = Buffer.alloc(5);
    fs.readSync(descriptor, signature, 0, signature.length, 0);
    if (signature.toString("ascii") !== "%PDF-") {
      throw new Error("Finale Rechnungsdatei besitzt keine gültige PDF-Signatur.");
    }
    const trailerLength = Math.min(stat.size, 1024);
    const trailer = Buffer.alloc(trailerLength);
    fs.readSync(descriptor, trailer, 0, trailerLength, stat.size - trailerLength);
    if (!trailer.toString("latin1").includes("%%EOF")) {
      throw new Error("Finale Rechnungsdatei besitzt keinen vollständigen PDF-Abschluss.");
    }
  } finally {
    fs.closeSync(descriptor);
  }
  return Object.freeze({
    file_path: resolvedPath,
    size_bytes: stat.size,
    sha256: sha256File(resolvedPath),
  });
}

function isPathInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

class InvoicePdfFinalizer {
  constructor({
    repository,
    renderPdf,
    storageRoot,
    clock = () => new Date().toISOString(),
    idFactory = () => crypto.randomUUID(),
  } = {}) {
    if (!repository || typeof renderPdf !== "function" || !storageRoot) {
      throw new TypeError("InvoicePdfFinalizer ist unvollständig konfiguriert.");
    }
    this.repository = repository;
    this.renderPdf = renderPdf;
    this.storageRoot = path.resolve(storageRoot);
    this.clock = clock;
    this.idFactory = idFactory;
    this.inFlight = new Map();
  }

  finalPath(invoice) {
    const projectSegment = invoice.project_id
      ? `Projekt-${safeSegment(invoice.project_id, "Projekt")}`
      : "Ohne-Projekt";
    const target = path.join(
      this.storageRoot,
      "Rechnungen",
      projectSegment,
      safeSegment(invoice.id, "Beleg"),
      invoicePdfFileName(invoice.invoice_number)
    );
    if (!isPathInside(this.storageRoot, target)) {
      throw new Error("Zielpfad der Rechnungs-PDF liegt außerhalb der festen Ablage.");
    }
    return target;
  }

  verifyStored(invoiceOrId) {
    const invoice = typeof invoiceOrId === "object" && invoiceOrId
      ? invoiceOrId
      : this.repository.get(String(invoiceOrId || ""));
    const reference = invoice?.final_pdf_reference;
    if (
      !invoice ||
      invoice.status !== "BOOKED" ||
      invoice.pdf_finalization_status !== "READY" ||
      !reference
    ) {
      throw new Error("Finale Rechnungs-PDF ist nicht verfügbar.");
    }
    if (!isPathInside(this.storageRoot, reference.local_path)) {
      throw new Error("Finale Rechnungs-PDF liegt außerhalb der festen Ablage.");
    }
    const verified = validatePdfFile(reference.local_path);
    if (
      verified.size_bytes !== reference.size_bytes ||
      verified.sha256 !== reference.sha256
    ) {
      throw new Error("Finale Rechnungs-PDF ist beschädigt oder verändert.");
    }
    return Object.freeze({ invoice, reference, verified });
  }

  async finalize(invoiceId) {
    const key = String(invoiceId || "").trim();
    if (!key) throw new Error("Rechnungs-ID fehlt.");
    if (this.inFlight.has(key)) return this.inFlight.get(key);
    const operation = this._finalize(key).finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, operation);
    return operation;
  }

  async _finalize(invoiceId) {
    let invoice = this.repository.get(invoiceId);
    if (!invoice) throw new Error("Rechnung wurde nicht gefunden.");
    if (invoice.status !== "BOOKED" || !invoice.invoice_number) {
      throw new Error("Nur gebuchte Rechnungen können ein finales PDF erhalten.");
    }
    if (invoice.pdf_finalization_status === "READY" && invoice.final_pdf_reference) {
      this.verifyStored(invoice);
      return invoice;
    }

    invoice = this.repository.preparePdfFinalization(invoiceId);
    const finalPath = this.finalPath(invoice);
    const finalDirectory = path.dirname(finalPath);
    let renderedPath = null;
    let pendingPath = null;
    try {
      fs.mkdirSync(finalDirectory, { recursive: true });
      if (!fs.existsSync(finalPath)) {
        const rendered = await this.renderPdf({
          mode: "invoice",
          documentTypeId: "invoice",
          invoiceId: invoice.id,
          orientation: "portrait",
          targetDir: "temp",
          fileName: `BBM-Rechnung-${safeSegment(invoice.invoice_number)}-${safeSegment(invoice.id)}.pdf`,
          overwrite: true,
          silent: true,
        });
        renderedPath = path.resolve(String(rendered?.filePath || rendered || ""));
        validatePdfFile(renderedPath);

        pendingPath = `${finalPath}.pending-${process.pid}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
        fs.copyFileSync(renderedPath, pendingPath, fs.constants.COPYFILE_EXCL);
        validatePdfFile(pendingPath);
        const pendingDescriptor = fs.openSync(pendingPath, "r");
        try {
          try {
            fs.fsyncSync(pendingDescriptor);
          } catch (error) {
            if (!["EPERM", "EINVAL", "ENOTSUP"].includes(error?.code)) throw error;
          }
        } finally {
          fs.closeSync(pendingDescriptor);
        }
        fs.renameSync(pendingPath, finalPath);
        pendingPath = null;
      }

      const verified = validatePdfFile(finalPath);
      return this.repository.completePdfFinalization(invoice.id, {
        id: this.idFactory(),
        commercial_document_id: invoice.id,
        file_name: path.basename(finalPath),
        local_path: finalPath,
        size_bytes: verified.size_bytes,
        sha256: verified.sha256,
        created_at: this.clock(),
      });
    } catch (error) {
      this.repository.markPdfFinalizationFailed(invoice.id, error);
      throw error;
    } finally {
      for (const candidate of [pendingPath, renderedPath]) {
        if (!candidate || path.resolve(candidate) === path.resolve(finalPath)) continue;
        try {
          fs.rmSync(candidate, { force: true });
        } catch (_error) {
          // Temporäre Dateien werden bestmöglich entfernt; der finale Pfad bleibt unberührt.
        }
      }
    }
  }
}

module.exports = Object.freeze({
  InvoicePdfFinalizer,
  invoicePdfFileName,
  isPathInside,
  safeSegment,
  sha256File,
  validatePdfFile,
});
