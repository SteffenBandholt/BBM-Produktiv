"use strict";

const { randomUUID } = require("crypto");
const { initDatabase } = require("./database");

const HEADER_COLUMNS = Object.freeze([
  "source_type", "document_type", "installment_number", "invoice_date",
  "service_period_type", "service_date", "service_period_start", "service_period_end",
  "customer_ref_kind", "customer_firm_id", "customer_project_id", "project_id",
  "source_order_id", "source_order_number", "source_order_date", "service_reference",
  "construction_project", "intro_text",
  "payment_term_days", "due_date",
]);

function parseRow(row, db = null) {
  if (!row) return null;
  const legacyCustomer =
    db && row.status === "DRAFT" && row.customer_ref_kind === "project_firm"
      ? db
          .prepare(`
            SELECT id, project_id, name, name2, street, zip, city, phone, email
            FROM project_firms
            WHERE id = ? AND project_id = ?
          `)
          .get(row.customer_firm_id, row.customer_project_id) || null
      : null;
  const finalPdfReference = db
    ? db.prepare(`
        SELECT *
        FROM commercial_document_files
        WHERE commercial_document_type = 'INVOICE'
          AND commercial_document_id = ?
          AND file_role = 'FINAL'
          AND file_type = 'PDF'
          AND is_active = 1
          AND is_final = 1
        ORDER BY version DESC
        LIMIT 1
      `).get(row.id) || null
    : null;
  return {
    ...row,
    customer_snapshot: row.customer_snapshot_json ? JSON.parse(row.customer_snapshot_json) : null,
    issuer_snapshot: row.issuer_snapshot_json ? JSON.parse(row.issuer_snapshot_json) : null,
    positions: row.positions_json ? JSON.parse(row.positions_json) : [],
    legacy_customer: legacyCustomer,
    final_pdf_reference: finalPdfReference,
  };
}

function headerParams(header) {
  return Object.fromEntries(HEADER_COLUMNS.map((column) => [column, header[column] ?? null]));
}

function formatInvoiceNumber(sequenceKey, value) {
  return `${sequenceKey}-${String(value).padStart(4, "0")}`;
}

class InvoiceRepository {
  constructor({ dbProvider = initDatabase, clock = () => new Date().toISOString() } = {}) {
    this.dbProvider = dbProvider;
    this.clock = clock;
  }

  _db() { return this.dbProvider(); }

  list() {
    const db = this._db();
    return db
      .prepare("SELECT * FROM invoices ORDER BY updated_at DESC, created_at DESC")
      .all()
      .map((row) => parseRow(row, db));
  }

  get(id) {
    const db = this._db();
    return parseRow(
      db.prepare("SELECT * FROM invoices WHERE id = ?").get(String(id || "")),
      db
    );
  }

  _assertDraftCustomer(db, header, current = null) {
    if (!header.customer_firm_id && !header.customer_ref_kind) return;
    if (header.customer_ref_kind === "global_firm" && header.customer_firm_id) {
      const available = db
        .prepare(`
          SELECT 1
          FROM firms f
          INNER JOIN firm_usages fu
            ON fu.firm_id = f.id AND fu.usage_code = 'invoice_customer'
          WHERE f.id = ?
            AND f.removed_at IS NULL
            AND COALESCE(f.is_trashed, 0) = 0
        `)
        .get(header.customer_firm_id);
      if (available) return;
      throw new Error("Der gewählte Rechnungskunde ist nicht mehr verfügbar.");
    }

    const preservesLegacyRef =
      current?.status === "DRAFT" &&
      current.customer_ref_kind === "project_firm" &&
      header.customer_ref_kind === "project_firm" &&
      current.customer_firm_id === header.customer_firm_id &&
      current.customer_project_id === header.customer_project_id;
    if (preservesLegacyRef) return;
    throw new Error(
      "Rechnungskunden müssen zentrale Firmen mit der Verwendung Rechnungskunde sein."
    );
  }

  createDraft(header) {
    const db = this._db();
    this._assertDraftCustomer(db, header);
    const id = randomUUID();
    const now = this.clock();
    const params = { id, status: "DRAFT", ...headerParams(header), positions_json: JSON.stringify(header.positions || []), created_at: now, updated_at: now };
    db.prepare(`
      INSERT INTO invoices (
        id, status, ${HEADER_COLUMNS.join(", ")}, positions_json, created_at, updated_at
      ) VALUES (
        @id, @status, ${HEADER_COLUMNS.map((column) => `@${column}`).join(", ")}, @positions_json, @created_at, @updated_at
      )
    `).run(params);
    return this.get(id);
  }

  updateDraft(id, header) {
    const db = this._db();
    const currentRow = db.prepare("SELECT * FROM invoices WHERE id = ?").get(String(id || ""));
    this._assertDraftCustomer(db, header, currentRow);
    const now = this.clock();
    const params = { id: String(id || ""), ...headerParams(header), positions_json: JSON.stringify(header.positions || []), updated_at: now };
    const result = db.prepare(`
      UPDATE invoices SET
        ${HEADER_COLUMNS.map((column) => `${column} = @${column}`).join(", ")},
        positions_json = @positions_json,
        updated_at = @updated_at
      WHERE id = @id AND status = 'DRAFT'
    `).run(params);
    if (result.changes !== 1) {
      const current = this.get(id);
      if (!current) throw new Error("Rechnung wurde nicht gefunden.");
      throw new Error("Gebuchte Rechnungen können nicht geändert werden.");
    }
    return this.get(id);
  }

  deleteDraft(id) {
    const result = this._db().prepare("DELETE FROM invoices WHERE id = ? AND status = 'DRAFT'").run(String(id || ""));
    if (result.changes !== 1) {
      const current = this.get(id);
      if (!current) throw new Error("Rechnung wurde nicht gefunden.");
      throw new Error("Gebuchte Rechnungen können nicht gelöscht werden.");
    }
    return true;
  }

  _customerSnapshot(db, header) {
    const kind = header.customer_ref_kind;
    if (kind !== "global_firm") {
      throw new Error("Rechnungskunden müssen zentrale Firmen sein.");
    }
    const row = db
      .prepare(`
        SELECT f.*
        FROM firms f
        INNER JOIN firm_usages fu
          ON fu.firm_id = f.id AND fu.usage_code = 'invoice_customer'
        WHERE f.id = ?
          AND f.removed_at IS NULL
          AND COALESCE(f.is_trashed, 0) = 0
      `)
      .get(header.customer_firm_id);
    if (!row) throw new Error("Der gewählte Rechnungskunde ist nicht mehr verfügbar.");
    return {
      source: { kind, id: row.id, projectId: null },
      companyName: row.name || null,
      companyName2: row.name2 || null,
      street: row.street || null,
      zip: row.zip || null,
      city: row.city || null,
      country: row.country || null,
      phone: row.phone || null,
      email: row.email || null,
    };
  }

  _issuerSnapshot(db) {
    const row = db.prepare("SELECT * FROM user_profile WHERE id = 1").get();
    if (!row || !String(row.name1 || "").trim() || !String(row.street || "").trim() || !String(row.zip || "").trim() || !String(row.city || "").trim()) {
      throw new Error("Eigene Unternehmensdaten sind für die Buchung unvollständig.");
    }
    return {
      companyName: row.name1 || null,
      companyName2: row.name2 || null,
      street: row.street || null,
      zip: row.zip || null,
      city: row.city || null,
      country: row.country || null,
      phone: row.phone || null,
      email: row.email || null,
      taxNumber: row.tax_number || null,
      vatId: row.vat_id || null,
      iban: row.iban || null,
      bic: row.bic || null,
      bankName: row.bank_name || null,
    };
  }

  buildPreviewSnapshots(header) {
    const db = this._db();
    return {
      customer_snapshot: this._customerSnapshot(db, header),
      issuer_snapshot: this._issuerSnapshot(db),
    };
  }

  bookDraft(id, header) {
    const db = this._db();
    const transaction = db.transaction(() => {
      const current = db.prepare("SELECT * FROM invoices WHERE id = ?").get(String(id || ""));
      if (!current) throw new Error("Rechnung wurde nicht gefunden.");
      if (current.status !== "DRAFT") throw new Error("Nur Entwürfe können gebucht werden.");
      if (header.project_id && !db.prepare("SELECT 1 FROM projects WHERE id = ?").get(header.project_id)) throw new Error("Das gewählte Projekt wurde nicht gefunden.");
      const customerSnapshot = this._customerSnapshot(db, header);
      const issuerSnapshot = this._issuerSnapshot(db);
      const bookedAt = this.clock();
      const sequenceKey = String(header.invoice_date).slice(0, 4);
      const sequence = db.prepare(`
        INSERT INTO invoice_number_sequences (sequence_key, last_value, updated_at)
        VALUES (?, 1, ?)
        ON CONFLICT(sequence_key) DO UPDATE SET last_value = last_value + 1, updated_at = excluded.updated_at
        RETURNING last_value
      `).get(sequenceKey, bookedAt);
      const invoiceNumber = formatInvoiceNumber(sequenceKey, sequence.last_value);
      const params = {
        id: String(id), ...headerParams(header), invoice_number: invoiceNumber, booked_at: bookedAt,
        positions_json: JSON.stringify(header.positions || []), customer_snapshot_json: JSON.stringify(customerSnapshot), issuer_snapshot_json: JSON.stringify(issuerSnapshot), updated_at: bookedAt,
      };
      const result = db.prepare(`
        UPDATE invoices SET
          ${HEADER_COLUMNS.map((column) => `${column} = @${column}`).join(", ")},
          positions_json = @positions_json,
          status = 'BOOKED', invoice_number = @invoice_number, booked_at = @booked_at,
          pdf_finalization_status = 'PENDING', pdf_finalization_error = NULL,
          customer_snapshot_json = @customer_snapshot_json, issuer_snapshot_json = @issuer_snapshot_json,
          updated_at = @updated_at
        WHERE id = @id AND status = 'DRAFT'
      `).run(params);
      if (result.changes !== 1) throw new Error("Die Rechnung konnte nicht atomar gebucht werden.");
      return parseRow(db.prepare("SELECT * FROM invoices WHERE id = ?").get(String(id)), db);
    });
    return transaction.immediate();
  }

  preparePdfFinalization(id) {
    const db = this._db();
    const invoiceId = String(id || "");
    const result = db.prepare(`
      UPDATE invoices
      SET pdf_finalization_status = 'PENDING',
          pdf_finalization_error = NULL,
          updated_at = @updated_at
      WHERE id = @id
        AND status = 'BOOKED'
        AND pdf_finalization_status IN ('NONE', 'PENDING', 'FAILED', 'LEGACY_MISSING')
    `).run({ id: invoiceId, updated_at: this.clock() });
    const invoice = this.get(invoiceId);
    if (!invoice) throw new Error("Rechnung wurde nicht gefunden.");
    if (invoice.status !== "BOOKED") {
      throw new Error("Nur gebuchte Rechnungen können finalisiert werden.");
    }
    if (!result.changes && invoice.pdf_finalization_status !== "READY") {
      throw new Error("PDF-Finalisierung konnte nicht vorbereitet werden.");
    }
    return invoice;
  }

  markPdfFinalizationFailed(id, error) {
    const invoiceId = String(id || "");
    this._db().prepare(`
      UPDATE invoices
      SET pdf_finalization_status = 'FAILED',
          pdf_finalization_error = ?,
          updated_at = ?
      WHERE id = ?
        AND status = 'BOOKED'
        AND pdf_finalization_status != 'READY'
    `).run(
      String(error?.message || error || "PDF-Erzeugung fehlgeschlagen.").slice(0, 1000),
      this.clock(),
      invoiceId
    );
    return this.get(invoiceId);
  }

  completePdfFinalization(id, reference) {
    const db = this._db();
    const invoiceId = String(id || "");
    const transaction = db.transaction(() => {
      const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(invoiceId);
      if (!invoice || invoice.status !== "BOOKED") {
        throw new Error("Nur gebuchte Rechnungen können finalisiert werden.");
      }
      const existing = db.prepare(`
        SELECT *
        FROM commercial_document_files
        WHERE commercial_document_type = 'INVOICE'
          AND commercial_document_id = ?
          AND file_role = 'FINAL'
          AND file_type = 'PDF'
          AND is_active = 1
          AND is_final = 1
      `).get(invoiceId);
      if (existing) {
        const sameReference =
          existing.file_name === reference.file_name &&
          existing.local_path === reference.local_path &&
          existing.size_bytes === reference.size_bytes &&
          existing.sha256 === reference.sha256;
        if (!sameReference) {
          throw new Error("Für die Rechnung existiert bereits eine andere finale PDF-Referenz.");
        }
      } else {
        db.prepare(`
          INSERT INTO commercial_document_files (
            id,
            commercial_document_type,
            commercial_document_id,
            file_role,
            file_type,
            file_name,
            local_path,
            version,
            size_bytes,
            sha256,
            is_active,
            is_final,
            created_at
          ) VALUES (
            @id,
            'INVOICE',
            @commercial_document_id,
            'FINAL',
            'PDF',
            @file_name,
            @local_path,
            1,
            @size_bytes,
            @sha256,
            1,
            1,
            @created_at
          )
        `).run(reference);
      }
      db.prepare(`
        UPDATE invoices
        SET pdf_finalization_status = 'READY',
            pdf_finalization_error = NULL,
            updated_at = ?
        WHERE id = ?
          AND status = 'BOOKED'
      `).run(this.clock(), invoiceId);
    });
    transaction.immediate();
    return this.get(invoiceId);
  }
}

module.exports = { InvoiceRepository, formatInvoiceNumber };
