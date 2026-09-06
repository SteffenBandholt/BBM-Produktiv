const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function withDatabase(callback) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-gate-b-"));
  const db = new Database(path.join(dir, "app.db"));
  try {
    db.pragma("foreign_keys = ON");
    db.exec("CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)");
    return callback(db);
  } finally {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function runGateBRegressionTests(run) {
  const moduleRegistry = require(path.join(process.cwd(), "src/main/moduleRegistry.js"));

  await run("Paket 8 / Gate B: Module sind ohne Core-Sonderfall vollstaendig registrierbar", () => {
    for (const moduleId of moduleRegistry.getModuleIds()) {
      const definition = moduleRegistry.getModuleDefinition(moduleId);
      for (const key of ["kind", "licenseKey", "ipcRegistrar", "migrationRegistrar", "requiredCapabilities"]) {
        assert.ok(definition[key], `${moduleId}.${key}`);
      }
    }
    for (const source of [read("src/renderer/app/Router.js"), read("src/main/main.js")]) {
      assert.doesNotMatch(source, /if\s*\(\s*moduleId\s*===\s*["'](?:rechnung|protokoll|restarbeiten)["']/);
    }
  });

  await run("Paket 8 / Gate B: globale und projektbezogene Module sind generisch oeffnbar", () => {
    const routeRuntime = read("src/renderer/app/modules/moduleRouteRuntime.js");
    assert.match(routeRuntime, /moduleType === "global" \|\| moduleType === "hybrid"/);
    assert.match(routeRuntime, /moduleType === "project" \|\| moduleType === "hybrid"/);
    assert.match(routeRuntime, /normalizedScope === "project" && !projectId/);
    assert.equal(moduleRegistry.getModuleDefinition("rechnung").kind, "hybrid");
    assert.equal(moduleRegistry.getModuleDefinition("protokoll").kind, "project");
  });

  await run("Paket 8 / Gate B: Modulnavigation folgt ausschliesslich dem aktiven Modulset", () => {
    const status = { valid: true, license: { modules: ["rechnung", "not-installed"] } };
    assert.deepEqual(moduleRegistry.resolveActiveModuleIds(status), ["rechnung"]);
    assert.deepEqual(moduleRegistry.resolveActiveModuleIds({ valid: false, license: { modules: ["rechnung"] } }), []);
    const navigation = read("src/renderer/app/modules/moduleNavigation.js");
    assert.match(navigation, /getCachedActiveModuleCatalog/);
    assert.match(navigation, /deriveModuleNavigationByScope/);
  });

  await run("Paket 8 / Gate B: Modulrechte und Service-Capabilities bleiben kanonisch getrennt", () => {
    for (const moduleId of moduleRegistry.getModuleIds()) {
      assert.match(moduleRegistry.getModuleLicenseKey(moduleId), /^module:/);
      for (const capability of moduleRegistry.getModuleDefinition(moduleId).requiredCapabilities) {
        assert.match(moduleRegistry.getCapabilityLicenseKey(capability), /^service:/);
      }
    }
    assert.equal(moduleRegistry.getCapabilityLicenseKey("pdf"), "service:pdf");
    assert.notEqual(moduleRegistry.getCapabilityLicenseKey("pdf"), moduleRegistry.getModuleLicenseKey("protokoll"));
  });

  await run("Paket 8 / Gate B: nur aktive Fachmodule registrieren Fach-IPCs", () => {
    const { registerActiveModuleIpcs } = require(path.join(process.cwd(), "src/main/moduleIpcRegistry.js"));
    const calls = [];
    const registrar = ({ moduleId }) => calls.push(moduleId);
    const registrars = { protokoll: registrar, restarbeiten: registrar, rechnung: registrar };
    const registered = registerActiveModuleIpcs({
      licenseStatus: { valid: true, license: { modules: ["restarbeiten"] } },
      getLicenseStatus: () => ({ valid: true, license: { modules: ["restarbeiten"] } }),
      ipcMain: { handle() {} },
      registrars,
    });
    assert.deepEqual(registered, {
      activeModuleIds: ["restarbeiten"],
      registeredModuleIds: ["restarbeiten"],
    });
    assert.deepEqual(calls, ["restarbeiten"]);
  });

  await run("Paket 8 / Gate B: Fachmigrationen laufen modular in einer Bestands-DB", () => withDatabase((db) => {
    db.prepare("INSERT INTO projects (id, name) VALUES ('existing', 'Bestand')").run();
    const { ensureSchema } = require(path.join(process.cwd(), "src/main/db/database.js"));
    assert.deepEqual(ensureSchema(db, { moduleIds: ["rechnung"] }), ["rechnung"]);
    assert.ok(db.prepare("SELECT name FROM projects WHERE id = 'existing'").get());
    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'").get());
    assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='meetings'").get(), undefined);
  }));

  await run("Paket 8 / Gate B: Core-DB funktioniert ohne Protokolltabellen und Fachlogik", () => withDatabase((db) => {
    const { ensureSchema } = require(path.join(process.cwd(), "src/main/db/database.js"));
    assert.deepEqual(ensureSchema(db, { moduleIds: [] }), []);
    for (const table of ["meetings", "tops", "meeting_tops", "restarbeiten_items", "invoices"]) {
      assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table), undefined, table);
    }
    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='firms'").get());
  }));

  await run("Paket 8 / Gate B: PDF, Mail und Export sind fuer mehrere Module fachneutral anschliessbar", () => {
    const { PROVIDER_KINDS, PdfDocumentProvider, MailPayloadProvider, ExportProvider, createModuleServiceProviderRegistry } = require(path.join(process.cwd(), "src/main/moduleServiceProviders.js"));
    const registry = createModuleServiceProviderRegistry();
    registry.register(PdfDocumentProvider({ moduleId: "protokoll", type: "protocol", provide: ({ input }) => input }));
    registry.register(PdfDocumentProvider({ moduleId: "rechnung", type: "invoice", provide: ({ input }) => input }));
    registry.register(MailPayloadProvider({ moduleId: "rechnung", type: "invoice", provide: ({ input }) => input }));
    registry.register(ExportProvider({ moduleId: "restarbeiten", type: "list", provide: ({ input }) => input }));
    assert.equal(registry.list({ kind: PROVIDER_KINDS.PDF_DOCUMENT }).length, 2);
    assert.deepEqual(registry.provide({ kind: PROVIDER_KINDS.PDF_DOCUMENT, moduleId: "rechnung", type: "invoice", input: { invoiceId: "i1" } }), { invoiceId: "i1" });
  });

  await run("Paket 8 / Gate B: OwnOrganization bleibt vom LicenseSubject getrennt", () => {
    const { createOwnOrganization } = require(path.join(process.cwd(), "src/shared/identity/ownOrganization.cjs"));
    const own = createOwnOrganization({ legalName: "Eigene GmbH", customerName: "Lizenzkunde AG", licenseId: "LIC-8" });
    assert.equal(own.legalName, "Eigene GmbH");
    assert.equal(Object.hasOwn(own, "customerName"), false);
    assert.equal(Object.hasOwn(own, "licenseId"), false);
  });
}

module.exports = { runGateBRegressionTests };
