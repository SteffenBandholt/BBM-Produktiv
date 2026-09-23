const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const repoRoot = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

function firmEntry({
  kind = "global_firm",
  id,
  projectId = null,
  label,
  customer = 1,
  participant = 0,
} = {}) {
  const ref = { kind, id, projectId: kind === "project_firm" ? projectId : null, label };
  return {
    id,
    kind,
    key: `${kind}:${id}`,
    label,
    project_id: ref.projectId,
    ref,
    uses: { customer, projectParticipant: participant },
  };
}

async function runRechnungenDesignModuleTests(run) {
  const modulePath = path.join(repoRoot, "src/renderer/modules/rechnungen/index.js");
  const designModule = await importEsmFromFile(modulePath);
  const customerModule = await importEsmFromFile(
    path.join(repoRoot, "src/renderer/modules/rechnungen/customerDirectory.js")
  );
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
    ].forEach((label) => assert.equal(source.includes(`"${label}"`), true, label));
    assert.equal(source.includes('data-invoice-design-screen'), true);
    assert.equal(source.includes('data-invoice-design-state'), true);
  });

  await run("Rechnungen-Design: lässt nur den Kundenbaustein produktiv und behält übrige Daten als Dummy", () => {
    const screenSource = read("src/renderer/modules/rechnungen/screens/RechnungenDesignScreen.js");
    const dataSource = read("src/renderer/modules/rechnungen/demoData.js");
    ["localStorage", "sessionStorage", "fetch(", "window.bbmDb", "ipcRenderer", "database", "INSERT INTO", "UPDATE "].forEach((needle) => {
      assert.equal(screenSource.includes(needle), false, needle);
      assert.equal(dataSource.includes(needle), false, needle);
    });
    assert.equal(screenSource.includes("INVOICE_DESIGN_ROWS"), true);
    assert.equal(screenSource.includes("keine Berechnung"), true);
    assert.equal(screenSource.includes("Keine Speicherung"), true);
    assert.equal(screenSource.includes("listInvoiceCustomers"), true);
    assert.equal(screenSource.includes("INVOICE_DESIGN_FORM.customer"), false);
  });

  await run("Rechnungs-Kunden 01: Picker liest aktive Customers aus Rechnung/Customer Core", async () => {
    const calls = [];
    const sourceCustomer = {
      customerId: "c1",
      customerNumber: "K-000001",
      name1: "Global GmbH",
      status: "ACTIVE",
    };
    const result = await customerModule.listInvoiceCustomers({
      api: {
        rechnungListCustomers: async () => {
          calls.push("rechnungListCustomers");
          return { ok: true, list: [sourceCustomer] };
        },
      },
    });
    assert.deepEqual(calls, ["rechnungListCustomers"]);
    assert.equal(result.ok, true);
    assert.deepEqual(result.list.map((entry) => entry.key), ["c1"]);
    assert.equal(result.list[0].ref.kind, "customer");
    assert.equal(result.list[0].optionLabel, "K-000001 · Global GmbH");
  });

  await run("Rechnungs-Kunden 02: Projektkontext veraendert den zentralen Customer-Bestand nicht", async () => {
    const result = await customerModule.listInvoiceCustomers({
      api: {
        rechnungListCustomers: async () => ({
          ok: true,
          list: [{ customerId: "c1", customerNumber: "K-000001", name1: "Kunde" }],
        }),
      },
      projectId: "p1",
    });
    assert.deepEqual(result.list.map((entry) => entry.key), ["c1"]);
  });

  await run("Rechnungs-Kunden 03: Firma ohne customerId ist keine Customer-Core-Identitaet", () => {
    assert.throws(
      () => customerModule.toInvoiceCustomer({ id: "", name1: "Nur Firma" }),
      /ungueltigen Rechnungskunden/
    );
  });

  await run("Rechnungs-Kunden 04: Customer wird ueber stabile customerId wiedergefunden", () => {
    const customer = customerModule.toInvoiceCustomer({
      customerId: "c1",
      customerNumber: "K-000001",
      name1: "Neu",
    });
    assert.equal(customerModule.resolveInvoiceCustomer([customer], "c1"), customer);
    assert.equal(customerModule.resolveInvoiceCustomer([customer], customer.ref), customer);
    assert.equal(customer.firm, null);
  });

  await run("Rechnungs-Kunden 05: fehlende Customer-Core-API liefert klaren Fehler", async () => {
    const result = await customerModule.listInvoiceCustomers({ api: {} });
    assert.equal(result.ok, false);
    assert.match(result.error, /Customer-Core-API/);
  });

  await run("Rechnungs-Kunden 06: Rechnungsmodul bleibt ohne Projektfachmodule lauffaehig", () => {
    const moduleRoot = path.join(repoRoot, "src/renderer/modules/rechnungen");
    const sources = fs.readdirSync(moduleRoot, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(?:js|css|md)$/.test(entry.name))
      .map((entry) => read(path.relative(repoRoot, path.join(entry.parentPath || entry.path, entry.name))))
      .join("\n");
    ["ProjectFirmsView", "modules/protokoll", "modules/restarbeiten", "firmsRepo", "projectFirmsRepo", "project_firms", "project_global_firms"].forEach((needle) => {
      assert.equal(sources.includes(needle), false, needle);
    });
  });

  await run("Rechnungs-Kunden 07: Demo-Kundennamen und FirmDirectory sind keine Pickerquelle", () => {
    const screenSource = read("src/renderer/modules/rechnungen/screens/RechnungenDesignScreen.js");
    const customerSource = read("src/renderer/modules/rechnungen/customerDirectory.js");
    assert.equal(screenSource.includes("listInvoiceCustomers({ api: this.api"), true);
    assert.equal(screenSource.includes("INVOICE_DESIGN_FORM.customer"), false);
    assert.equal(customerSource.includes("demoData"), false);
    assert.equal(customerSource.includes("firmDirectory"), false);
    assert.equal(customerSource.includes("rechnungListCustomers"), true);
  });

  await run("Rechnungs-Kunden 08: DEV-Design legt Kunden nicht mehr als BBM-Firma an", () => {
    const screenSource = read("src/renderer/modules/rechnungen/screens/RechnungenDesignScreen.js");
    assert.equal(screenSource.includes('"Rechnungskunde auswählen"'), true);
    assert.equal(screenSource.includes('button("Neuer Kunde", "quiet")'), true);
    assert.equal(screenSource.includes('button("Kunde bearbeiten", "quiet")'), true);
    assert.equal(screenSource.includes("openFirmEditor"), false);
    assert.equal(screenSource.includes('origin: "invoice"'), false);
    assert.equal(screenSource.includes("firm: customer.firm"), false);
    assert.equal(screenSource.includes("Kundenverwaltung des Rechnungsmoduls"), true);
  });

  await run("Rechnungen-Design: bezieht die freigegebenen Werte aus dem zentralen BBM-Standard", () => {
    const css = read("src/renderer/modules/rechnungen/styles/rechnungenDesign.css");
    const standardCss = read("src/renderer/ui/styles/popupFormStandard.css");
    const screen = read("src/renderer/modules/rechnungen/screens/RechnungenDesignScreen.js");
    assert.equal(css.includes(":root"), false);
    assert.equal(css.includes(":where(.bbm-invoice-design, .bbm-invoice-design-modal)"), true);
    [
      "--invoice-control-height: var(--bbm-popup-control-height)",
      "--invoice-button-height: var(--bbm-popup-button-height)",
      "--invoice-radius-control: var(--bbm-popup-control-radius)",
      "--invoice-radius-card: var(--bbm-popup-card-radius)",
      "--invoice-field-gap: var(--bbm-popup-label-field-gap)",
      "--invoice-group-gap: var(--bbm-popup-group-gap)",
      "--invoice-font-label: var(--bbm-popup-label-font-size)",
      "--invoice-color-primary: var(--bbm-popup-primary)",
      ":focus-visible",
      ":disabled",
      "::placeholder",
    ].forEach((token) => assert.equal(css.includes(token), true, token));
    assert.equal(standardCss.includes("--bbm-popup-control-height: 32px"), true);
    assert.equal(standardCss.includes(":not(.invoice-control)"), true);
    assert.equal(css.includes(".invoice-search .invoice-control { padding-left: 31px; }"), true);
    assert.equal(screen.includes("bbm-invoice-design bbm-popup-standard"), true);
    assert.equal(screen.includes("invoice-dialog bbm-popup-standard bbm-popup-dialog"), true);
  });

  await run("Rechnungen: Designreferenz bleibt tabellenfrei, echter Screen besitzt den expliziten UI-Editor-Vertrag", () => {
    const designScreen = read("src/renderer/modules/rechnungen/screens/RechnungenDesignScreen.js");
    const liveScreen = read("src/renderer/modules/rechnungen/screens/RechnungScreen.js");
    const contract = read("src/renderer/modules/rechnungen/RechnungScreen.uiEditorContract.js");
    const registry = read("src/renderer/ui-editor/m80Registry.js");
    const documentation = read("src/renderer/modules/rechnungen/README.md");
    assert.equal(designScreen.includes("data-ui-inspector-id"), false);
    assert.equal(designScreen.includes("tableLayouts"), false);
    assert.equal(liveScreen.includes("m80EditorAttributes"), true);
    assert.equal(contract.includes('RECHNUNG_SCOPE_ID = "rechnung.screen"'), true);
    assert.equal(registry.includes("rechnungUiEditorContract"), true);
    assert.equal(documentation.includes("87 explizite"), true);
    assert.equal(documentation.includes("editorEnabled: nein"), false);
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
