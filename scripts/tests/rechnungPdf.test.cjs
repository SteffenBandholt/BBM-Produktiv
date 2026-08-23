"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");

const ROOT = path.resolve(__dirname, "../..");
const { ensureInvoiceSchema } = require("../../src/main/db/invoiceMigrations.js");
const { InvoiceRepository } = require("../../src/main/db/invoiceRepository.js");
const { InvoiceService } = require("../../src/main/domain/rechnung/InvoiceService.js");
const {
  InvoicePdfFinalizer,
  invoicePdfFileName,
  validatePdfFile,
} = require("../../src/main/domain/rechnung/InvoicePdfFinalizer.js");
const firmUsagesRepo = require("../../src/main/db/firmUsagesRepo.js");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-invoice-pdf-"));
  const db = new Database(path.join(root, "test.db"));
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE firms (
      id TEXT PRIMARY KEY,
      name TEXT,
      name2 TEXT,
      street TEXT,
      zip TEXT,
      city TEXT,
      country TEXT,
      phone TEXT,
      email TEXT,
      removed_at TEXT,
      is_trashed INTEGER DEFAULT 0
    );
    CREATE TABLE project_firms (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      name TEXT,
      name2 TEXT,
      street TEXT,
      zip TEXT,
      city TEXT,
      country TEXT,
      phone TEXT,
      email TEXT,
      removed_at TEXT,
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE user_profile (
      id INTEGER PRIMARY KEY,
      name1 TEXT,
      name2 TEXT,
      street TEXT,
      zip TEXT,
      city TEXT,
      country TEXT,
      phone TEXT,
      email TEXT,
      tax_number TEXT,
      vat_id TEXT,
      iban TEXT,
      bic TEXT,
      bank_name TEXT
    );
    INSERT INTO projects (id, name) VALUES ('project-1', 'Projekt Eins');
    INSERT INTO firms (id, name, street, zip, city, country)
      VALUES ('customer-1', 'Snapshot Kunde', 'Kundenweg 1', '12345', 'Kundenstadt', 'DE');
    INSERT INTO user_profile (id, name1, street, zip, city, country, tax_number, iban)
      VALUES (1, 'Snapshot Aussteller', 'Ausstellerweg 2', '54321', 'Ausstellerstadt', 'DE', '12/345/67890', 'DE001');
  `);
  ensureInvoiceSchema(db);
  firmUsagesRepo.setUsage({
    firmId: "customer-1",
    usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER,
    enabled: true,
    dbConn: db,
  });
  let tick = 0;
  const repository = new InvoiceRepository({
    dbProvider: () => db,
    clock: () => `2026-08-23T10:00:${String(tick++).padStart(2, "0")}.000Z`,
  });
  const service = new InvoiceService({
    repository,
    settingsGetMany: () => ({ "invoice.paymentTermDays": "8" }),
    today: () => "2026-08-23",
  });
  return {
    root,
    db,
    repository,
    service,
    close() {
      db.close();
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function invoiceInput(overrides = {}) {
  return {
    source_type: "FREE",
    document_type: "INVOICE",
    invoice_date: "2026-08-23",
    service_period_type: "RANGE",
    service_period_start: "2026-08-01",
    service_period_end: "2026-08-20",
    customer_ref_kind: "global_firm",
    customer_firm_id: "customer-1",
    project_id: "project-1",
    service_reference: "Leistungsbezug",
    construction_project: "Bauvorhaben",
    intro_text: "Für die ausgeführten Leistungen berechnen wir:",
    positions: [
      { id: "title-1", type: "heading", is_title: true, short_text: "Rohbau" },
      { id: "position-1", parent_id: "title-1", type: "service", short_text: "Leistung", long_text: "Mehrzeilige Leistungsbeschreibung", quantity: "2", unit: "St", unit_price_cents: 5000, vat_rate_percent: 19 },
      { id: "position-2", parent_id: "title-1", type: "service", short_text: "Ermäßigte Leistung", quantity: "1", unit: "St", unit_price_cents: 1000, vat_rate_percent: 7 },
      { id: "nep-1", parent_id: "title-1", type: "service", short_text: "Bedarfsposition", quantity: "3", unit: "h", unit_price_cents: 2000, vat_rate_percent: 19, is_nep: true },
      { id: "text-1", type: "heading", is_title: false, short_text: "Freier Rechnungstext", long_text: "Ohne Präfix Text" },
      { id: "note-1", type: "note", short_text: "Nur nach Freigabe", long_text: "Sichtbarer Hinweis" },
    ],
    payment_term_days: 8,
    ...overrides,
  };
}

function pdfRenderer(calls, { fail = false, root = os.tmpdir() } = {}) {
  return async (payload) => {
    calls.push(structuredClone(payload));
    if (fail) throw new Error("simulierter PDF-Fehler");
    const target = path.join(root, `render-${calls.length}-${Date.now()}.pdf`);
    fs.writeFileSync(target, Buffer.from("%PDF-1.7\nR2-I2 fixture\n%%EOF\n"));
    return target;
  };
}

async function seedVisualInvoice(dbPath, variant = "basic") {
  const db = new Database(path.resolve(String(dbPath || "")));
  try {
    ensureInvoiceSchema(db);
    db.prepare(`
      INSERT INTO projects (id, project_number, name, short, street, zip, city)
      VALUES ('r2i2-visual-project', 'R2-I2', 'R2-I2 PDF-Abnahme', 'R2-I2', 'Musterweg 1', '10115', 'Berlin')
      ON CONFLICT(id) DO UPDATE SET name = excluded.name
    `).run();
    db.prepare(`
      INSERT INTO firms (id, short, name, name2, street, zip, city, phone, email, use_customer, is_trashed)
      VALUES ('r2i2-visual-customer', 'VIS', 'Musterkunde Bau GmbH', 'Rechnungsempfang', 'Kundenstra\u00dfe 7', '10117', 'Berlin', '+49 30 123456', 'rechnung@example.test', 1, 0)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, name2 = excluded.name2, street = excluded.street,
        zip = excluded.zip, city = excluded.city, phone = excluded.phone,
        email = excluded.email, use_customer = 1, is_trashed = 0, removed_at = NULL
    `).run();
    firmUsagesRepo.setUsage({
      firmId: "r2i2-visual-customer",
      usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER,
      enabled: true,
      dbConn: db,
    });
    db.prepare(`
      INSERT INTO user_profile (
        id, name1, name2, street, zip, city, country, phone, email,
        tax_number, vat_id, iban, bic, bank_name, managing_director
      ) VALUES (
        1, 'BBM Musterbau GmbH', 'Bau und Projektmanagement', 'Ausstellerallee 12',
        '10115', 'Berlin', 'Deutschland', '+49 30 7654321', 'info@bbm.example',
        '12/345/67890', 'DE123456789', 'DE02120300000000202051', 'BYLADEM1001',
        'Musterbank', 'Erika Beispiel'
      )
      ON CONFLICT(id) DO UPDATE SET
        name1 = excluded.name1, name2 = excluded.name2, street = excluded.street,
        zip = excluded.zip, city = excluded.city, country = excluded.country,
        phone = excluded.phone, email = excluded.email, tax_number = excluded.tax_number,
        vat_id = excluded.vat_id, iban = excluded.iban, bic = excluded.bic,
        bank_name = excluded.bank_name, managing_director = excluded.managing_director
    `).run();
    const repository = new InvoiceRepository({ dbProvider: () => db });
    const service = new InvoiceService({
      repository,
      settingsGetMany: () => ({ "invoice.paymentTermDays": "8" }),
      today: () => "2026-08-23",
    });
    const normalizedVariant = String(variant || "basic").trim().toLowerCase();
    const visualOverrides = normalizedVariant === "no-project"
      ? {
          project_id: null,
          construction_project: "",
          service_reference: "Freie Rechnung ohne Projekt",
          intro_text: "Diese Rechnung ist keinem Projekt zugeordnet.",
          positions: [
            { id: "free-position", type: "service", short_text: "Freie Beratungsleistung", long_text: "Leistung ohne Projektbezug", quantity: "1.5", unit: "h", unit_price_cents: 8000, vat_rate_percent: 19 },
          ],
        }
      : normalizedVariant === "multipage"
        ? {
            project_id: "r2i2-visual-project",
            construction_project: "Mehrseitiger Neubau Verwaltungsgeb\u00e4ude, Berlin",
            service_reference: "Rohbauarbeiten mit Fortsetzungsseiten",
            intro_text: "F\u00fcr die nachfolgend aufgef\u00fchrten Leistungen stellen wir die vereinbarten Einheitspreise in Rechnung:",
            positions: [
              { id: "long-title", type: "heading", is_title: true, short_text: "Ausf\u00fchrliche Rohbauleistungen" },
              ...Array.from({ length: 42 }, (_entry, index) => ({
                id: `long-position-${index + 1}`,
                parent_id: "long-title",
                type: "service",
                short_text: `Leistungsposition ${String(index + 1).padStart(2, "0")}`,
                long_text: `Ausf\u00fchrliche Beschreibung der Bauleistung ${index + 1} mit Material, Lieferung, Montage und allen erforderlichen Nebenarbeiten.`,
                quantity: String((index % 5) + 1),
                unit: index % 2 ? "m\u00b2" : "St",
                unit_price_cents: 1250 + index * 25,
                vat_rate_percent: index % 7 === 0 ? 7 : 19,
              })),
              { id: "long-text", type: "heading", is_title: false, short_text: "Zus\u00e4tzliche Vertragsinformation", long_text: "Diese Textposition erscheint ohne vorangestelltes Wort Text." },
              { id: "long-note", type: "note", short_text: "Pr\u00fcfhinweis", long_text: "Die Schlusspr\u00fcfung erfolgt anhand des gemeinsamen Aufma\u00dfes." },
              { id: "long-nep", parent_id: "long-title", type: "service", short_text: "Bedarfsposition Baustelleneinrichtung", long_text: "Nur nach ausdr\u00fccklicher Freigabe ausf\u00fchren.", quantity: "2", unit: "Tag", unit_price_cents: 25000, vat_rate_percent: 19, is_nep: true },
            ],
          }
        : {
            project_id: "r2i2-visual-project",
            construction_project: "Neubau Verwaltungsgeb\u00e4ude, Berlin",
            service_reference: "Rohbauarbeiten gem\u00e4\u00df LV 01",
          };
    const draft = await service.createDraft(invoiceInput({
      customer_firm_id: "r2i2-visual-customer",
      ...visualOverrides,
    }));
    const booked = await service.bookDraft(draft.id);
    console.log(JSON.stringify({ variant: normalizedVariant, id: booked.id, invoice_number: booked.invoice_number }));
  } finally {
    db.close();
  }
}

function inspectVisualInvoices(dbPath) {
  const db = new Database(path.resolve(String(dbPath || "")), { readonly: true });
  try {
    return db.prepare(`
      SELECT
        i.id,
        i.invoice_number,
        i.status,
        i.project_id,
        i.pdf_finalization_status,
        i.pdf_finalization_error,
        f.id AS file_id,
        f.local_path,
        f.size_bytes,
        f.sha256,
        (
          SELECT COUNT(*)
          FROM commercial_document_files active_file
          WHERE active_file.commercial_document_type = 'INVOICE'
            AND active_file.commercial_document_id = i.id
            AND active_file.file_role = 'FINAL'
            AND active_file.file_type = 'PDF'
            AND active_file.is_active = 1
            AND active_file.is_final = 1
        ) AS active_final_count
      FROM invoices i
      LEFT JOIN commercial_document_files f
        ON f.commercial_document_type = 'INVOICE'
       AND f.commercial_document_id = i.id
       AND f.file_role = 'FINAL'
       AND f.file_type = 'PDF'
       AND f.is_active = 1
       AND f.is_final = 1
      WHERE i.invoice_number IS NOT NULL
      ORDER BY i.invoice_number
    `).all().map((row) => {
      const validation = row.local_path ? validatePdfFile(row.local_path) : null;
      return {
        ...row,
        actual_size_bytes: validation?.size_bytes || null,
        actual_sha256: validation?.sha256 || null,
        reference_matches_file: !!validation
          && Number(row.size_bytes) === Number(validation.size_bytes)
          && String(row.sha256 || "").toLowerCase() === String(validation.sha256 || "").toLowerCase(),
      };
    });
  } finally {
    db.close();
  }
}

async function runRechnungPdfTests(run) {
  await run("R2-I2 Registry: Invoice besitzt eigenen Scope, Profil, sechs explizite Spalten und gültige Parents", () => {
    require("../../src/main/ui-editor/bbmPdfAdapter.cjs");
    require("../../src/main/ui-editor/restarbeitenPdfAdapter.cjs");
    const invoiceAdapter = require("../../src/main/ui-editor/invoicePdfAdapter.cjs");
    const adapterRegistry = require("../../src/main/ui-editor/pdfAdapterRegistry.cjs");
    const registrations = new Map(adapterRegistry.listPdfEditorAdapterRegistrations().map((entry) => [entry.documentTypeId, entry]));
    assert.equal(registrations.has("protocol"), true);
    assert.equal(registrations.has("restarbeiten"), true);
    assert.deepEqual(
      [registrations.get("invoice").scopeId, registrations.get("invoice").profileStorageKey, registrations.get("invoice").printModes],
      ["pdf.bbm.invoice", "module-rechnungen", ["invoice"]]
    );
    const registry = invoiceAdapter.REGISTRY;
    const ids = new Set(registry.elements.map((element) => element.id));
    assert.equal(registry.elements.filter((element) => element.kind === "tableColumn").length, 6);
    for (const element of registry.elements) {
      if (element.parentId) assert.equal(ids.has(element.parentId), true, `${element.id}:parent`);
      for (const forbidden of ["changeText", "modifyDomainData", "createRecord", "deleteRecord", "saveDomainData", "setPageBreakRule"]) {
        assert.equal(element.allowedOps.includes(forbidden), false, `${element.id}:${forbidden}`);
        assert.equal(element.lockedOps.includes(forbidden), true, `${element.id}:${forbidden}`);
      }
    }
  });

  await run("R2-I2 Migration: Status und generische Dateireferenz sind additiv, eindeutig und ohne Cascade", async () => {
    const env = fixture();
    try {
      const invoiceColumns = env.db.prepare("PRAGMA table_info(invoices)").all().map((entry) => entry.name);
      assert.equal(invoiceColumns.includes("pdf_finalization_status"), true);
      assert.equal(invoiceColumns.includes("pdf_finalization_error"), true);
      const fileColumns = env.db.prepare("PRAGMA table_info(commercial_document_files)").all().map((entry) => entry.name);
      for (const required of ["id", "commercial_document_type", "commercial_document_id", "file_role", "file_type", "file_name", "local_path", "version", "size_bytes", "sha256", "is_active", "is_final", "created_at"]) {
        assert.equal(fileColumns.includes(required), true, required);
      }
      assert.deepEqual(env.db.prepare("PRAGMA foreign_key_list(commercial_document_files)").all(), []);
      const uniqueIndex = env.db.prepare("PRAGMA index_list(commercial_document_files)").all().find((entry) => entry.name === "idx_commercial_document_files_active_final");
      assert.equal(uniqueIndex?.unique, 1);
      const draft = await env.service.createDraft(invoiceInput());
      assert.equal(draft.pdf_finalization_status, "NONE");
      assert.equal(draft.final_pdf_reference, null);
      const booked = await env.service.bookDraft(draft.id);
      env.db.prepare("UPDATE invoices SET pdf_finalization_status = 'NONE' WHERE id = ?").run(booked.id);
      ensureInvoiceSchema(env.db);
      assert.equal(env.service.get(booked.id).pdf_finalization_status, "LEGACY_MISSING");
    } finally {
      env.close();
    }
  });

  await run("R2-I2 Finalisierung: BOOKED erhält genau eine validierte projektbezogene Finaldatei", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(invoiceInput());
      const booked = await env.service.bookDraft(draft.id);
      assert.equal(booked.pdf_finalization_status, "PENDING");
      const calls = [];
      const finalizer = new InvoicePdfFinalizer({
        repository: env.repository,
        renderPdf: pdfRenderer(calls, { root: env.root }),
        storageRoot: path.join(env.root, "commercial-documents"),
        idFactory: () => "file-1",
        clock: () => "2026-08-23T11:00:00.000Z",
      });
      const [left, right] = await Promise.all([
        finalizer.finalize(booked.id),
        finalizer.finalize(booked.id),
      ]);
      assert.equal(calls.length, 1);
      assert.deepEqual(
        [calls[0].mode, calls[0].documentTypeId, calls[0].invoiceId, calls[0].orientation],
        ["invoice", "invoice", booked.id, "portrait"]
      );
      assert.equal(left.pdf_finalization_status, "READY");
      assert.equal(right.final_pdf_reference.id, "file-1");
      const reference = left.final_pdf_reference;
      assert.equal(reference.file_name, invoicePdfFileName(booked.invoice_number));
      assert.equal(reference.local_path.includes(path.join("Rechnungen", "Projekt-project-1", booked.id)), true);
      assert.equal(fs.existsSync(reference.local_path), true);
      assert.deepEqual(validatePdfFile(reference.local_path).size_bytes, reference.size_bytes);
      assert.match(reference.sha256, /^[a-f0-9]{64}$/);
      assert.equal(env.db.prepare("SELECT COUNT(*) AS count FROM commercial_document_files WHERE commercial_document_id = ?").get(booked.id).count, 1);
      await finalizer.finalize(booked.id);
      assert.equal(calls.length, 1, "READY darf nie neu gerendert werden");
    } finally {
      env.close();
    }
  });

  await run("R2-I2 Snapshots: Stammdatenänderungen verändern den gebuchten PDF-Datensatz nicht", async () => {
    const env = fixture();
    try {
      const booked = await env.service.bookDraft((await env.service.createDraft(invoiceInput())).id);
      env.db.prepare("UPDATE firms SET name = 'Neuer Kunde', street = 'Neuer Weg 9' WHERE id = 'customer-1'").run();
      env.db.prepare("UPDATE user_profile SET name1 = 'Neuer Aussteller', iban = 'DE999' WHERE id = 1").run();
      const restored = env.service.get(booked.id);
      assert.equal(restored.customer_snapshot.companyName, "Snapshot Kunde");
      assert.equal(restored.customer_snapshot.street, "Kundenweg 1");
      assert.equal(restored.issuer_snapshot.companyName, "Snapshot Aussteller");
      assert.equal(restored.issuer_snapshot.iban, "DE001");
      assert.deepEqual(restored.positions, booked.positions);
    } finally {
      env.close();
    }
  });

  await run("R2-I2 Recovery: Fehler und Prozesslücke behalten Rechnung und Nummer; Retry erzeugt keinen zweiten Beleg", async () => {
    const env = fixture();
    try {
      const booked = await env.service.bookDraft((await env.service.createDraft(invoiceInput({ project_id: null }))).id);
      const failed = new InvoicePdfFinalizer({
        repository: env.repository,
        renderPdf: pdfRenderer([], { fail: true, root: env.root }),
        storageRoot: path.join(env.root, "commercial-documents"),
      });
      await assert.rejects(() => failed.finalize(booked.id), /simulierter PDF-Fehler/);
      const afterFailure = env.service.get(booked.id);
      assert.equal(afterFailure.status, "BOOKED");
      assert.equal(afterFailure.invoice_number, booked.invoice_number);
      assert.equal(afterFailure.pdf_finalization_status, "FAILED");
      assert.match(afterFailure.pdf_finalization_error, /simulierter PDF-Fehler/);

      const calls = [];
      const retry = new InvoicePdfFinalizer({
        repository: env.repository,
        renderPdf: pdfRenderer(calls, { root: env.root }),
        storageRoot: path.join(env.root, "commercial-documents"),
        idFactory: () => "retry-file",
      });
      const completed = await retry.finalize(booked.id);
      assert.equal(completed.invoice_number, booked.invoice_number);
      assert.equal(completed.final_pdf_reference.local_path.includes(path.join("Rechnungen", "Ohne-Projekt", booked.id)), true);
      assert.equal(env.db.prepare("SELECT last_value FROM invoice_number_sequences WHERE sequence_key = '2026'").get().last_value, 1);
      assert.equal(env.db.prepare("SELECT COUNT(*) AS count FROM commercial_document_files WHERE commercial_document_id = ?").get(booked.id).count, 1);
    } finally {
      env.close();
    }
  });

  await run("R2-I2 Recovery: nach atomarem Move vor DB-Abschluss wird die vorhandene Finaldatei referenziert statt überschrieben", async () => {
    const env = fixture();
    try {
      const booked = await env.service.bookDraft((await env.service.createDraft(invoiceInput())).id);
      const calls = [];
      let failCompletion = true;
      const repository = Object.create(env.repository);
      repository.completePdfFinalization = (...args) => {
        if (failCompletion) {
          failCompletion = false;
          throw new Error("simulierter DB-Abschlussfehler");
        }
        return env.repository.completePdfFinalization(...args);
      };
      const first = new InvoicePdfFinalizer({
        repository,
        renderPdf: pdfRenderer(calls, { root: env.root }),
        storageRoot: path.join(env.root, "commercial-documents"),
      });
      await assert.rejects(() => first.finalize(booked.id), /DB-Abschlussfehler/);
      assert.equal(calls.length, 1);
      const finalPath = first.finalPath(booked);
      assert.equal(fs.existsSync(finalPath), true);
      const retry = new InvoicePdfFinalizer({
        repository: env.repository,
        renderPdf: async () => { throw new Error("Vorhandene Finaldatei darf nicht neu gerendert werden"); },
        storageRoot: path.join(env.root, "commercial-documents"),
        idFactory: () => "recovered-file",
      });
      const recovered = await retry.finalize(booked.id);
      assert.equal(recovered.pdf_finalization_status, "READY");
      assert.equal(recovered.final_pdf_reference.id, "recovered-file");
    } finally {
      env.close();
    }
  });

  await run("R2-I2 Öffnen: Hash und Größe werden geprüft; Öffnen rendert niemals neu", async () => {
    const env = fixture();
    try {
      const booked = await env.service.bookDraft((await env.service.createDraft(invoiceInput())).id);
      let renderCalls = 0;
      const finalizer = new InvoicePdfFinalizer({
        repository: env.repository,
        renderPdf: async (payload) => {
          renderCalls += 1;
          return pdfRenderer([], { root: env.root })(payload);
        },
        storageRoot: path.join(env.root, "commercial-documents"),
        idFactory: () => "open-file",
      });
      const ready = await finalizer.finalize(booked.id);
      const handlers = new Map();
      const opened = [];
      const { registerRechnungIpc } = require("../../src/main/ipc/rechnungIpc.js");
      registerRechnungIpc({
        ipcMain: { handle(channel, handler) { handlers.set(channel, handler); } },
        service: env.service,
        firmDirectory: { listCustomers: () => [] },
        projectRepository: { listAll: () => [] },
        app: { getPath: () => env.root },
        shell: { openPath: async (filePath) => { opened.push(filePath); return ""; } },
        pdfFinalizer: finalizer,
      });
      const openedResult = await handlers.get("rechnung:openPdf")({}, { id: ready.id });
      assert.equal(openedResult.ok, true);
      assert.deepEqual(opened, [ready.final_pdf_reference.local_path]);
      assert.equal(renderCalls, 1);
      fs.appendFileSync(ready.final_pdf_reference.local_path, "verändert");
      const rejected = await handlers.get("rechnung:openPdf")({}, { id: ready.id });
      assert.equal(rejected.ok, false);
      assert.match(rejected.error, /beschädigt oder verändert/);
      assert.equal(renderCalls, 1);
    } finally {
      env.close();
    }
  });

  await run("R2-I2 Satzvertrag: Bau-LV, Text, Hinweis, NEP, Mehrfach-MwSt. und Pagination sind explizit", () => {
    const shell = read("src/renderer/print/layout/PrintShell.js");
    const app = read("src/renderer/print/printApp.js");
    const data = read("src/main/print/printData.js");
    const css = read("src/renderer/print/v2/v2.css");
    for (const token of ["INVOICE_PDF_COLUMNS", '"invoicePdfNoteRow", "Hinweis"', 'row.kind === "invoiceText"', 'row.kind === "invoiceNote"', 'position.is_nep ? "NEP"', "vat_totals_display", "invoiceFirst", "invoiceLast", "buildInvoiceTableHead", "buildInvoiceTail", "invoicePdfLetterhead", 'normalizedMode !== "invoice"']) {
      assert.equal(`${shell}\n${app}`.includes(token), true, token);
    }
    for (const token of [".invoicePdfPositionRow .invoicePdfCol--description", "translateY(4.5mm)", ".invoicePdfFooterAddress"]) {
      assert.equal(css.includes(token), true, token);
    }
    assert.match(data, /status !== "BOOKED"/);
    assert.match(data, /customer_snapshot/);
    assert.match(data, /issuer_snapshot/);
    assert.match(data, /vatGroups/);
    assert.doesNotMatch(shell, />Text</);
  });

  await run("R2-I2 Architektur und UI-Vertrag: ein Renderer, ein printToPDF-Pfad und unveränderter Rechnungs-UI-Vertrag", () => {
    const printIpc = read("src/main/ipc/printIpc.js");
    const printApp = read("src/renderer/print/printApp.js");
    const shell = read("src/renderer/print/layout/PrintShell.js");
    const preload = read("src/main/preload.js");
    const screen = read("src/renderer/modules/rechnungen/screens/RechnungScreen.js");
    assert.equal((printIpc.match(/webContents\.printToPDF\(/g) || []).length, 1);
    assert.equal((printApp.match(/function _paginateGeneric\(/g) || []).length, 1);
    assert.equal((shell.match(/export function renderPrint\(/g) || []).length, 1);
    for (const token of ["rechnungFinalizePdf", "rechnungOpenPdf"]) assert.equal(preload.includes(token), true, token);
    for (const token of ["PDF öffnen", "PDF erneut erzeugen", "rechnungFinalizePdf", "rechnungOpenPdf"]) assert.equal(screen.includes(token), true, token);
    const contractHash = crypto.createHash("sha256").update(read("src/renderer/modules/rechnungen/RechnungScreen.uiEditorContract.js")).digest("hex");
    assert.equal(contractHash, "68e3576a6eebc32d40276845e5b22efe465f9d3e594d6052a18e52bfcb144922");
  });
}

module.exports = { runRechnungPdfTests, seedVisualInvoice, inspectVisualInvoices };

if (require.main === module) {
  const inspectIndex = process.argv.indexOf("--inspect-visual-db");
  if (inspectIndex >= 0) {
    try {
      console.log(JSON.stringify(inspectVisualInvoices(process.argv[inspectIndex + 1]), null, 2));
    } catch (error) {
      console.error(error?.stack || error);
      process.exitCode = 1;
    }
    return;
  }
  const seedIndex = process.argv.indexOf("--seed-visual-db");
  if (seedIndex >= 0) {
    seedVisualInvoice(process.argv[seedIndex + 1], process.argv[seedIndex + 2] || "basic").catch((error) => {
      console.error(error?.stack || error);
      process.exitCode = 1;
    });
    return;
  }
  let failures = 0;
  runRechnungPdfTests(async (name, test) => {
    try {
      await test();
      console.log(`ok - ${name}`);
    } catch (error) {
      failures += 1;
      console.error(`not ok - ${name}`);
      console.error(error?.stack || error);
    }
  }).then(() => {
    process.exitCode = failures ? 1 : 0;
  }).catch((error) => {
    console.error(error?.stack || error);
    process.exitCode = 1;
  });
}
