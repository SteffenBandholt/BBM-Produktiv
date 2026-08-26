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
  const { defaultsForCreation, normalizeUses } = require(
    path.join(repoRoot, "src/main/domain/firms/firmReference.js")
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

  await run("Rechnungs-Kunden 01: Liste ohne Projekt fordert ausschließlich globale Kunden an", async () => {
    const calls = [];
    const global = firmEntry({ id: "g1", label: "Global GmbH" });
    const result = await customerModule.listInvoiceCustomers({
      api: {
        firmDirectoryListCustomers: async (payload) => {
          calls.push(payload);
          return { ok: true, list: [global] };
        },
      },
    });
    assert.deepEqual(calls, [{}]);
    assert.deepEqual(result.list.map((entry) => entry.ref), [global.ref]);
  });

  await run("Rechnungs-Kunden 02: Projektkontext ändert die zentrale Kundenliste nicht", async () => {
    const calls = [];
    const global = firmEntry({ id: "g1", label: "Global GmbH" });
    const result = await customerModule.listInvoiceCustomers({
      api: {
        firmDirectoryListCustomers: async (payload) => {
          calls.push(payload);
          return { ok: true, list: [global] };
        },
      },
      projectId: "p1",
    });
    assert.deepEqual(calls, [{}]);
    assert.deepEqual(result.list.map((entry) => entry.key), ["global_firm:g1"]);
  });

  await run("Rechnungs-Kunden 03: projektlokale Firma ist kein Rechnungskunde", async () => {
    const foreign = firmEntry({ kind: "project_firm", id: "l2", projectId: "p2", label: "Fremd" });
    const result = await customerModule.listInvoiceCustomers({
      api: { firmDirectoryListCustomers: async () => ({ ok: true, list: [foreign] }) },
      projectId: "p1",
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /ungültige Kundenreferenz/);
  });

  await run("Rechnungs-Kunden 04: globaler Kunde benötigt keine Projektzuordnung", async () => {
    const global = firmEntry({ id: "g1", label: "Global GmbH" });
    const result = await customerModule.listInvoiceCustomers({
      api: { firmDirectoryListCustomers: async () => ({ ok: true, list: [global] }) },
      projectId: "p1",
    });
    assert.equal(result.ok, true);
    assert.equal(result.list[0].ref.projectId, null);
  });

  await run("Rechnungs-Kunden 05: Teilnehmer-only ist kein zulässiger Picker-Eintrag", async () => {
    const participantOnly = firmEntry({ id: "g1", label: "Nur Teilnehmer", customer: 0, participant: 1 });
    const result = await customerModule.listInvoiceCustomers({
      api: { firmDirectoryListCustomers: async () => ({ ok: true, list: [participantOnly] }) },
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /ohne Kundennutzung/);
  });

  await run("Rechnungs-Kunden 06: Kunden-only ist im Picker zulässig", async () => {
    const customerOnly = firmEntry({ id: "g1", label: "Nur Kunde", customer: 1, participant: 0 });
    const result = await customerModule.listInvoiceCustomers({
      api: { firmDirectoryListCustomers: async () => ({ ok: true, list: [customerOnly] }) },
    });
    assert.equal(result.ok, true);
    assert.equal(result.list[0].label, "Nur Kunde");
  });

  await run("Rechnungs-Kunden 07: Projektzuordnung dupliziert die zentrale Firma nicht", async () => {
    const global = firmEntry({ id: "same", label: "Gleicher Name" });
    const result = await customerModule.listInvoiceCustomers({
      api: { firmDirectoryListCustomers: async () => ({ ok: true, list: [global] }) },
      projectId: "p1",
    });
    assert.deepEqual(result.list.map((entry) => entry.key), ["global_firm:same"]);
    assert.deepEqual(result.list.map((entry) => entry.optionLabel), ["Gleicher Name · Zentrale Firma"]);
  });

  await run("Rechnungs-Kunden 08: Anlage ohne Projekt wird globaler Kunde", () => {
    assert.deepEqual(defaultsForCreation({ origin: "invoice" }), {
      kind: "global_firm",
      uses: { projectParticipant: 0, customer: 1 },
    });
  });

  await run("Rechnungs-Kunden 09: Anlage mit Projekt bleibt eine zentrale Firma", () => {
    assert.deepEqual(defaultsForCreation({ origin: "invoice", projectId: "p1" }), {
      kind: "global_firm",
      uses: { projectParticipant: 0, customer: 1 },
    });
  });

  await run("Rechnungs-Kunden 10: projektlokale Anlage über Rechnung wird abgewiesen", () => {
    assert.throws(
      () => defaultsForCreation({ origin: "invoice", projectId: "p1", kind: "project_firm" }),
      /global firms only/
    );
  });

  await run("Rechnungs-Kunden 11: neu geladener Kunde wird über die typisierte Referenz ausgewählt", () => {
    const created = firmEntry({ kind: "global_firm", id: "g1", label: "Neu" });
    const customer = customerModule.toInvoiceCustomer(created);
    assert.equal(customerModule.resolveInvoiceCustomer([customer], created.ref), customer);
  });

  await run("Rechnungs-Kunden 12: Bearbeiten erhält den vollständigen FirmDirectory-Datensatz", () => {
    const firm = firmEntry({ id: "g1", label: "Bearbeiten" });
    const customer = customerModule.toInvoiceCustomer(firm);
    assert.equal(customer.firm, firm);
    assert.deepEqual(customer.ref, firm.ref);
  });

  await run("Rechnungs-Kunden 13: Projektteilnehmer kann zur Kundennutzung ergänzt werden", () => {
    assert.deepEqual(normalizeUses({ customer: 1, projectParticipant: 1 }), {
      projectParticipant: 1,
      customer: 1,
    });
  });

  await run("Rechnungs-Kunden 14: deaktivierter Kunde setzt die Auswahl nach Refresh zurück", () => {
    const previous = firmEntry({ id: "g1", label: "Entfernt" });
    assert.equal(customerModule.resolveInvoiceCustomer([], previous.ref), null);
  });

  await run("Rechnungs-Kunden 15: Modul bleibt ohne Projektfachmodule lauffähig", () => {
    const moduleRoot = path.join(repoRoot, "src/renderer/modules/rechnungen");
    const sources = fs.readdirSync(moduleRoot, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(?:js|css|md)$/.test(entry.name))
      .map((entry) => read(path.relative(repoRoot, path.join(entry.parentPath || entry.path, entry.name))))
      .join("\n");
    ["ProjectFirmsView", "modules/protokoll", "modules/restarbeiten", "firmsRepo", "projectFirmsRepo", "project_firms", "project_global_firms"].forEach((needle) => {
      assert.equal(sources.includes(needle), false, needle);
    });
  });

  await run("Rechnungs-Kunden 16: Demo-Kundennamen sind keine produktive Pickerquelle mehr", () => {
    const screenSource = read("src/renderer/modules/rechnungen/screens/RechnungenDesignScreen.js");
    const customerSource = read("src/renderer/modules/rechnungen/customerDirectory.js");
    assert.equal(screenSource.includes("listInvoiceCustomers({ api: this.api"), true);
    assert.equal(screenSource.includes("INVOICE_DESIGN_FORM.customer"), false);
    assert.equal(customerSource.includes("demoData"), false);
    assert.equal(customerSource.includes("firmDirectoryListCustomers"), true);
  });

  await run("Rechnungs-Kunden: Screen bietet Picker, Neu, Bearbeiten und sichtbare Auswahl", () => {
    const screenSource = read("src/renderer/modules/rechnungen/screens/RechnungenDesignScreen.js");
    [
      '"Rechnungskunde auswählen"',
      'button("Neuer Kunde", "quiet")',
      'button("Kunde bearbeiten", "quiet")',
      '"Kein Kunde ausgewählt"',
      'origin: "invoice"',
      "firm: customer.firm",
    ].forEach((needle) => assert.equal(screenSource.includes(needle), true, needle));
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
