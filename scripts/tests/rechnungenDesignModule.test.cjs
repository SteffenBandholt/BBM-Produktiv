const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const repoRoot = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

async function runRechnungenDesignModuleTests(run) {
  const modulePath = path.join(repoRoot, "src/renderer/modules/rechnungen/index.js");
  const designModule = await importEsmFromFile(modulePath);

  await run("Rechnungen-Design: bleibt strikt auf DEV begrenzt", async () => {
    assert.equal(await designModule.isRechnungenDesignAvailable({
      api: { appGetBuildChannel: async () => ({ ok: true, channel: "DEV" }) },
    }), true);
    assert.equal(await designModule.isRechnungenDesignAvailable({
      api: { appGetBuildChannel: async () => ({ ok: true, channel: "STABLE" }) },
    }), false);
    assert.equal(await designModule.isRechnungenDesignAvailable({ api: {} }), false);
  });

  await run("Rechnungen-Design: enthält beide geforderten visuellen Zustände", () => {
    const source = read("src/renderer/modules/rechnungen/screens/RechnungenDesignScreen.js");
    [
      "Rechnungsübersicht",
      "Rechnung bearbeiten",
      "Rechnungsnummer",
      "Leistungszeitraum von",
      "Zahlungsziel",
      "Positionen",
      "Summen",
      "Abbrechen",
      "Speichern",
      "PDF",
    ].forEach((label) => assert.equal(source.includes(`\"${label}\"`), true, label));
    assert.equal(source.includes('data-invoice-design-screen'), true);
    assert.equal(source.includes('data-invoice-design-state'), true);
  });

  await run("Rechnungen-Design: verwendet nur lokale Dummy-Daten ohne Fachpersistenz", () => {
    const screenSource = read("src/renderer/modules/rechnungen/screens/RechnungenDesignScreen.js");
    const dataSource = read("src/renderer/modules/rechnungen/demoData.js");
    ["localStorage", "sessionStorage", "fetch(", "window.bbmDb", "ipcRenderer", "database", "INSERT INTO", "UPDATE "].forEach((needle) => {
      assert.equal(screenSource.includes(needle), false, needle);
      assert.equal(dataSource.includes(needle), false, needle);
    });
    assert.equal(screenSource.includes("INVOICE_DESIGN_ROWS"), true);
    assert.equal(screenSource.includes("keine Berechnung"), true);
    assert.equal(screenSource.includes("Keine Speicherung"), true);
  });

  await run("Rechnungen-Design: hält Design-Tokens lokal und vollständig", () => {
    const css = read("src/renderer/modules/rechnungen/styles/rechnungenDesign.css");
    assert.equal(css.includes(":root"), false);
    assert.equal(css.includes(":where(.bbm-invoice-design, .bbm-invoice-design-modal)"), true);
    [
      "--invoice-control-height: 32px",
      "--invoice-button-height: 30px",
      "--invoice-radius-control: 8px",
      "--invoice-radius-card: 12px",
      "--invoice-field-gap: 4px",
      "--invoice-group-gap: 10px",
      "--invoice-font-label: 11.5px",
      "--invoice-color-primary: #235a9f",
      ":focus-visible",
      ":disabled",
      "::placeholder",
    ].forEach((token) => assert.equal(css.includes(token), true, token));
  });

  await run("Rechnungen-Design: bleibt außerhalb von UI-Editor und Tabellenregistry", () => {
    const moduleRoot = path.join(repoRoot, "src/renderer/modules/rechnungen");
    const files = fs.readdirSync(moduleRoot, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => read(path.relative(repoRoot, path.join(entry.parentPath || entry.path, entry.name))));
    const joined = files.join("\n");
    assert.equal(joined.includes("data-ui-inspector-id"), false);
    assert.equal(joined.includes("data-ui-editor-kind"), false);
    assert.equal(joined.includes("tableLayouts"), false);
    assert.equal(joined.includes("editorEnabled: nein"), true);
  });

  await run("Rechnungen-Design: DEV-Einstieg reserviert außerhalb von DEV keinen Platz", () => {
    const settings = read("src/renderer/views/SettingsView.js");
    const router = read("src/renderer/app/Router.js");
    assert.equal(settings.includes('tileInvoicesDesign.style.display = "none";'), true);
    assert.equal(settings.includes('tileInvoicesDesign.style.display = available ? "flex" : "none";'), true);
    assert.equal(settings.includes('data-settings-dev-entry", "rechnungen-design"'), true);
    assert.equal(router.includes("async showRechnungenDesign()"), true);
    assert.equal(router.includes('reason: "DEV_ONLY"'), true);
    assert.equal(router.includes('section: "rechnungenDesign"'), true);
  });
}

module.exports = { runRechnungenDesignModuleTests };
