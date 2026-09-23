const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function runCustomerBbmCleanupTests(run) {
  await run("Customer Cleanup 01: aktive FirmDirectory-API kennt keine Kundenliste mehr", () => {
    const serviceSource = fs.readFileSync(
      path.join(process.cwd(), "src/main/domain/firms/FirmDirectoryService.js"),
      "utf8"
    );
    const ipcSource = fs.readFileSync(
      path.join(process.cwd(), "src/main/ipc/firmDirectoryIpc.js"),
      "utf8"
    );
    const preloadSource = fs.readFileSync(path.join(process.cwd(), "src/main/preload.js"), "utf8");
    assert.doesNotMatch(serviceSource, /\blistCustomers\s*\(/);
    assert.doesNotMatch(ipcSource, /firmDirectory:listCustomers/);
    assert.doesNotMatch(preloadSource, /firmDirectoryListCustomers/);
  });

  await run("Customer Cleanup 02: Firmen-DTO blendet Legacy-Kundenrolle fachlich aus", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/main/domain/firms/FirmDirectoryService.js"),
      "utf8"
    );
    assert.match(source, /customer:\s*0/);
    assert.match(source, /legacyCustomerUse/);
    assert.doesNotMatch(source, /customerImpactProvider/);
  });

  await run("Customer Cleanup 03: invoice_customer ist nur noch read-only Legacy", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/main/db/firmUsagesRepo.js"),
      "utf8"
    );
    assert.match(source, /FIRM_USAGE_LEGACY_READ_ONLY/);
    assert.match(source, /invoice_customer bleibt absichtlich unangetastet/);
  });

  await run("Customer Cleanup 04: Firmenoberflaechen bieten keine Rechnungskundenrolle mehr an", () => {
    const files = [
      "src/renderer/views/FirmsUsageView.js",
      "src/renderer/views/FirmsUsageIntegrationView.js",
      "src/renderer/views/FirmsUsageCompactView.js",
      "src/renderer/views/ProjectFirmsUsageView.js",
      "src/renderer/features/firms/openFirmEditor.js",
    ];
    for (const relative of files) {
      const source = fs.readFileSync(path.join(process.cwd(), relative), "utf8");
      assert.doesNotMatch(source, /Rechnungskunde/);
      assert.doesNotMatch(source, /invoice_customer/);
      assert.doesNotMatch(source, /usageInvoiceCustomer/);
    }
  });

  await run("Customer Cleanup 05: Rechnung bezieht Kunden weiterhin ausschließlich aus Customer Core", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/main/domain/rechnung/InvoiceService.js"),
      "utf8"
    );
    const ipcSource = fs.readFileSync(
      path.join(process.cwd(), "src/main/ipc/rechnungIpc.js"),
      "utf8"
    );
    assert.match(source, /getRuntimeCustomerCore/);
    assert.match(source, /listCustomers\(\{ status: "ACTIVE" \}\)/);
    assert.doesNotMatch(source, /FirmDirectoryService/);
    assert.match(ipcSource, /service\.listCustomers\(\)/);
  });

  await run("Customer Cleanup 06: CustomerLink bleibt die einzige bewusste BBM-Customer-Verknuepfung", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/main/domain/customers/CustomerFirmBridgeService.js"),
      "utf8"
    );
    assert.match(source, /createLink/);
    assert.match(source, /systemCode:\s*SYSTEM_CODE/);
    assert.doesNotMatch(source, /INVOICE_CUSTOMER/);
  });
}

module.exports = { runCustomerBbmCleanupTests };
