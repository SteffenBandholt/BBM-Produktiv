const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

async function runRechnungRevision275InventoryTests(run) {
  await run("Rechnung #275 R2: geborgene Fachbasis ist auf main vollständig vorhanden", () => {
    const requiredFiles = [
      "src/main/db/invoiceMigrations.js",
      "src/main/db/invoiceRepository.js",
      "src/main/domain/rechnung/InvoiceService.js",
      "src/main/domain/rechnung/InvoicePdfFinalizer.js",
      "src/main/ipc/rechnungIpc.js",
      "src/main/modules/rechnung/registerIpc.js",
      "src/main/modules/rechnung/registerMigrations.js",
      "src/renderer/modules/rechnungen/screens/RechnungScreen.js",
      "src/renderer/modules/rechnungen/print/InvoicePrintContent.js",
      "src/shared/rechnung/invoiceHeaderRules.mjs",
      "src/shared/rechnung/rechnungPositions.mjs",
    ];
    requiredFiles.forEach((relativePath) => {
      assert.equal(fs.existsSync(path.join(root, relativePath)), true, relativePath);
    });
  });

  await run("Rechnung #275 R2: Modul nutzt kanonische Registrare und gemeinsame Dienste", () => {
    const moduleEntry = read("src/renderer/modules/rechnungen/index.js");
    assert.match(moduleEntry, /RECHNUNG_MODULE_ID = "rechnung"/);
    assert.match(moduleEntry, /moduleType: "hybrid"/);
    assert.match(moduleEntry, /ipcRegistrar: "rechnung"/);
    assert.match(moduleEntry, /migrationRegistrar: "rechnung"/);
    for (const capability of ["pdf", "mail", "export", "file-storage", "ui-editor"]) {
      assert.equal(moduleEntry.includes(`"${capability}"`), true, capability);
    }
  });

  await run("Rechnung #275 R2: keine zweite Rechnungsdatenbank wird eingeführt", () => {
    const sourceFiles = [
      "src/main/db/invoiceMigrations.js",
      "src/main/db/invoiceRepository.js",
      "src/main/domain/rechnung/InvoiceService.js",
      "src/main/ipc/rechnungIpc.js",
    ];
    const combined = sourceFiles.map(read).join("\n");
    assert.doesNotMatch(combined, /rechnung\.db|invoice\.db/i);
    assert.match(read("src/main/modules/rechnung/registerMigrations.js"), /migrations\.ensureInvoiceSchema\(db\)/);
  });

  await run("Rechnung #275 R2: nächste Identitätslücke ist ehrlich dokumentiert", () => {
    const report = read("docs/RECHNUNG_REVISION_275.md");
    assert.match(report, /`main` bleibt die einzige Integrationsbasis/);
    assert.match(report, /Nicht übernehmen/);
    assert.match(report, /eigenständige[s\n ]+`InvoiceIssuerProfile`/);
    assert.match(read("src/main/db/invoiceRepository.js"), /invoice_issuer_profiles/);
  });
}

module.exports = { runRechnungRevision275InventoryTests };

if (require.main === module) {
  let failures = 0;
  runRechnungRevision275InventoryTests(async (name, test) => {
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
  });
}
