const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function runRechnungStammdatenTests(run) {
  await run("Rechnung Stammdaten: user_profile bleibt einzige Rechnungsstellerquelle", () => {
    const database = fs.readFileSync(path.join(process.cwd(), "src/main/db/database.js"), "utf8");
    const repository = fs.readFileSync(path.join(process.cwd(), "src/main/db/userProfileRepo.js"), "utf8");
    const invoiceRepository = fs.readFileSync(path.join(process.cwd(), "src/main/db/invoiceRepository.js"), "utf8");
    for (const field of ["country", "phone", "email", "website", "tax_number", "vat_id", "iban", "bic", "bank_name", "commercial_register", "register_number", "managing_director", "legal_notice"]) {
      assert.equal(database.includes(`\"${field}\"`) || database.includes(`${field} TEXT`), true, field);
      assert.equal(repository.includes(`\"${field}\"`), true, field);
    }
    assert.equal(invoiceRepository.includes("FROM user_profile WHERE id = 1"), true);
    assert.equal(fs.existsSync(path.join(process.cwd(), "src/main/db/invoiceIssuerProfileRepo.js")), false);
  });
  await run("Rechnung Stammdaten: gemeinsamer Firmeneditor bietet Pflichtangaben", () => {
    const settings = fs.readFileSync(path.join(process.cwd(), "src/renderer/views/SettingsView.js"), "utf8");
    for (const label of ["Rechnungssteller", "Steuernummer", "USt-IdNr.", "IBAN", "Registergericht"]) assert.equal(settings.includes(label), true, label);
  });
}
module.exports = { runRechnungStammdatenTests };
