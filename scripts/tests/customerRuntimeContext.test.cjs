const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const policyPath = path.resolve(process.cwd(), "src/main/domain/customers/customerRuntimePolicy.js");
const corePath = path.resolve(process.cwd(), "src/customer-core");

async function runCustomerRuntimeContextTests(run) {
  const {
    CUSTOMER_CONTEXT_MODES,
    MANUFACTURER_DIRECTORY_NAME,
    resolveCustomerRuntimeContext,
    shouldExposeCustomerDirectory,
  } = require(policyPath);

  await run("Customer Context 01: DEV nutzt separaten Herstellerbestand ausserhalb BBM-userData", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-customer-context-"));
    try {
      const bbmUserData = path.join(root, "baubesprechungs-manager");
      const context = resolveCustomerRuntimeContext({
        isPackaged: false,
        userDataPath: bbmUserData,
        env: {},
      });
      assert.equal(context.mode, CUSTOMER_CONTEXT_MODES.MANUFACTURER);
      assert.equal(context.rootPath, path.join(root, MANUFACTURER_DIRECTORY_NAME));
      assert.notEqual(context.databasePath, path.join(bbmUserData, "customers.db"));
      assert.equal(context.sharedManufacturerData, true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  await run("Customer Context 02: Lizenzversion nutzt ausschliesslich lokalen Kundenbestand", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-customer-context-"));
    try {
      const licenseeUserData = path.join(root, "licensee");
      const context = resolveCustomerRuntimeContext({
        isPackaged: true,
        userDataPath: licenseeUserData,
        env: {},
      });
      assert.equal(context.mode, CUSTOMER_CONTEXT_MODES.LICENSEE);
      assert.equal(context.rootPath, path.resolve(licenseeUserData));
      assert.equal(context.databasePath, path.join(path.resolve(licenseeUserData), "customers.db"));
      assert.equal(context.sharedManufacturerData, false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  await run("Customer Context 03: expliziter Herstellerpfad ist fuer spaetere Lizenztool-Anbindung stabil", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-customer-context-"));
    try {
      const configured = path.join(root, "hersteller-zentral");
      const context = resolveCustomerRuntimeContext({
        isPackaged: true,
        userDataPath: path.join(root, "bbm"),
        mode: "MANUFACTURER",
        manufacturerDataPath: configured,
        env: {},
      });
      assert.equal(context.mode, CUSTOMER_CONTEXT_MODES.MANUFACTURER);
      assert.equal(context.rootPath, path.resolve(configured));
      assert.equal(context.databasePath, path.join(path.resolve(configured), "customers.db"));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  await run("Customer Context 04: Hersteller und Lizenznehmer haben trotz gleichem Namen getrennte IDs und Daten", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-customer-context-"));
    const { createCustomerCore } = require(corePath);
    const manufacturerContext = resolveCustomerRuntimeContext({
      isPackaged: false,
      userDataPath: path.join(root, "bbm-dev"),
      env: {},
    });
    const licenseeContext = resolveCustomerRuntimeContext({
      isPackaged: true,
      userDataPath: path.join(root, "krueger-rechnung"),
      env: {},
    });
    const manufacturer = createCustomerCore({ userDataPath: manufacturerContext.rootPath });
    const licensee = createCustomerCore({ userDataPath: licenseeContext.rootPath });
    try {
      const vendorCustomer = manufacturer.service.createCustomer({
        name1: "Tischler Krueger",
        countryCode: "DE",
      });
      const kruegerCustomer = licensee.service.createCustomer({
        name1: "Tischler Krueger",
        countryCode: "DE",
      });
      assert.notEqual(vendorCustomer.customerId, kruegerCustomer.customerId);
      assert.equal(manufacturer.service.listCustomers().length, 1);
      assert.equal(licensee.service.listCustomers().length, 1);
      assert.notEqual(manufacturer.databasePath, licensee.databasePath);
    } finally {
      manufacturer.close();
      licensee.close();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  await run("Customer Context 05: Standard-BBM ohne Rechnung exponiert keine Kundenverwaltung", () => {
    const moduleActive = (_status, moduleId) => moduleId === "rechnung";
    assert.equal(shouldExposeCustomerDirectory({
      isPackaged: false,
      licenseStatus: { valid: true },
      isModuleActive: () => false,
    }), true);
    assert.equal(shouldExposeCustomerDirectory({
      isPackaged: true,
      licenseStatus: { valid: true, license: { modules: ["protokoll"] } },
      isModuleActive: () => false,
    }), false);
    assert.equal(shouldExposeCustomerDirectory({
      isPackaged: true,
      licenseStatus: { valid: true, license: { modules: ["rechnung"] } },
      isModuleActive: moduleActive,
    }), true);
  });

  await run("Customer Context 06: Main registriert Customer-IPC nur nach Laufzeitpolicy", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/main/main.js"), "utf8");
    assert.match(source, /shouldExposeCustomerDirectory/);
    assert.match(source, /isModuleActive/);
    assert.match(source, /if \(shouldExposeCustomerDirectory\(/);
    assert.doesNotMatch(source, /registerFirmDirectoryIpc\(\);\s*registerCustomerDirectoryIpc\(\);/);
  });

  await run("Customer Context 07: Rechnung und BBM-Bridge nutzen den kontextabhaengigen Provider", () => {
    const invoiceSource = fs.readFileSync(
      path.join(process.cwd(), "src/main/domain/rechnung/InvoiceService.js"),
      "utf8"
    );
    const bridgeSource = fs.readFileSync(
      path.join(process.cwd(), "src/main/domain/customers/CustomerFirmBridgeService.js"),
      "utf8"
    );
    assert.match(invoiceSource, /getRuntimeCustomerCore/);
    assert.match(bridgeSource, /getRuntimeCustomerCore/);
    assert.doesNotMatch(invoiceSource, /getBbmCustomerCore/);
    assert.doesNotMatch(bridgeSource, /getBbmCustomerCore/);
  });
}

module.exports = { runCustomerRuntimeContextTests };
