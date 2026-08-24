const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRechnungNavigationTests(run) {
  const root = process.cwd();
  const modules = await importEsmFromFile(path.join(root, "src/renderer/app/modules/index.js"));
  const rechnung = await importEsmFromFile(path.join(root, "src/renderer/modules/rechnungen/index.js"));
  const rechnungScreen = await importEsmFromFile(path.join(root, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"));
  const rechnungContract = await importEsmFromFile(path.join(root, "src/renderer/modules/rechnungen/RechnungScreen.uiEditorContract.js"));
  const access = await importEsmFromFile(path.join(root, "src/renderer/app/modules/moduleAccessState.js"));
  const shellNavigation = await importEsmFromFile(path.join(root, "src/renderer/app/coreShellNavigation.js"));
  const routerModule = await importEsmFromFile(path.join(root, "src/renderer/app/Router.js"));

  await run("Rechnung Navigation: kanonischer globaler Moduldeskriptor loest den echten Screen auf", () => {
    const entry = rechnung.getRechnungModuleEntry();
    assert.equal(entry.moduleId, "rechnung");
    assert.equal(entry.navigation.global[0].label, "Rechnungen");
    assert.equal(entry.navigation.global[0].workScreenId, rechnung.RECHNUNG_WORK_SCREEN_ID);
    assert.equal(modules.findActiveModuleEntry("rechnung")?.moduleId, "rechnung");
    assert.strictEqual(modules.resolveActiveModuleScreen("rechnung", rechnung.RECHNUNG_WORK_SCREEN_ID), rechnung.RechnungScreen);
  });

  await run("Rechnung Navigation: normale Entwicklungsumgebung schaltet Rechnung sichtbar frei", async () => {
    const previousWindow = global.window;
    try {
      global.window = { bbmDb: { appIsPackaged: async () => ({ ok: true, isPackaged: false }) } };
      await access.refreshCachedActiveModuleAccess({ force: true });
      assert.equal(access.isModuleActive("rechnung"), true);
      let opened = null;
      const routes = shellNavigation.createCoreShellNavigationRouteDefs({
        showHome() {}, showProjects() {}, showFirms() {}, showSettings() {},
        openGlobalModule(moduleId, options) { opened = { moduleId, options }; },
      });
      const route = routes.find((entry) => entry.label === "Rechnungen");
      assert.ok(route);
      route.onClick();
      assert.deepEqual(opened, { moduleId: "rechnung", options: { navigationKey: "rechnungen" } });
    } finally { global.window = previousWindow; }
  });

  await run("Rechnung Navigation: Klickpfad instanziiert den aktuellen RechnungScreen", async () => {
    let shown = null;
    const fakeRouter = {
      ensureActiveModuleAccess: async () => ["rechnung"],
      _isModuleActive: (moduleId) => moduleId === "rechnung",
      show: async (view, options) => { shown = { view, options }; },
    };
    const opened = await routerModule.default.prototype.openGlobalModule.call(fakeRouter, "rechnung", { navigationKey: "rechnungen" });
    assert.equal(opened, true);
    assert.ok(shown.view instanceof rechnung.RechnungScreen);
    assert.equal(shown.options.section, "rechnungen");
    assert.equal(shown.options.pageTitle, "Rechnungen");
  });

  await run("Rechnung Navigation: Übersicht und Editor respektieren hidden trotz Grid-Layout", () => {
    const css = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/styles/rechnungenDesign.css"), "utf8");
    assert.match(css, /\.rechnung-live-overview\[hidden\],\s*\.rechnung-live-editor\[hidden\]\s*\{\s*display:\s*none;\s*\}/);
    assert.match(css, /\.rechnung-live-preview\[hidden\]\s*\{\s*display:\s*none;\s*\}/);
  });

  await run("Rechnung Navigation: vorhandener DRAFT oeffnet und schliesst ohne Profil", () => {
    const previousDocument = global.document;
    const createElement = (tagName) => {
      const element = {
        tagName: String(tagName).toUpperCase(), children: [], hidden: false, style: {}, value: "", textContent: "",
        append(...children) { children.forEach((child) => { child.parentElement = this; this.children.push(child); }); },
        replaceChildren(...children) { this.children = []; this.append(...children); },
      };
      Object.defineProperty(element, "options", { get() { return this.children; } });
      return element;
    };
    global.document = { createElement };
    try {
      const screen = new rechnung.RechnungScreen();
      const control = () => ({ value: "", hidden: false, textContent: "", replaceChildren() {}, append() {}, closest() { return { hidden: false }; } });
      const draft = { id: "draft-1", status: "DRAFT", invoice_date: "2026-08-17", service_date: "2026-08-17", payment_term_days: 14, due_date: "2026-08-31", positions: [] };
      screen.invoices = [draft]; screen.list = createElement("div");
      screen.overview = { hidden: false }; screen.editor = { hidden: true }; screen.preview = { hidden: true }; screen.message = { textContent: "" };
      screen.source = control(); screen.documentType = control(); screen.installmentNumber = control(); screen.invoiceNumber = control(); screen.invoiceDate = control();
      screen.serviceType = control(); screen.serviceDate = control(); screen.serviceMonth = control(); screen.serviceStart = control(); screen.serviceEnd = control();
      screen.reference = control(); screen.constructionProject = control(); screen.paymentTerm = control(); screen.dueDate = control();
      screen.customer = createElement("select"); screen.project = createElement("select"); screen.customers = []; screen.projects = []; screen.profile = null;
      screen.serviceFields = { SINGLE_DATE: {}, MONTH: {}, RANGE_START: {}, RANGE_END: {} }; screen.title = { textContent: "" }; screen.customerAddress = { textContent: "" }; screen.issuerBlock = {}; screen.issuerName1 = { textContent: "" }; screen.issuerName2 = { textContent: "" }; screen.issuerStreet = { textContent: "" }; screen.issuerCity = { textContent: "" };
      screen._renderPositions = () => {}; screen._clearPositionEditor = () => {}; screen._setBooked = () => {};

      screen._renderList();
      screen.list.children[0].children[2].onclick();

      assert.equal(screen.overview.hidden, true);
      assert.equal(screen.editor.hidden, false);
      assert.equal(screen.invoiceDate.value, "2026-08-17");
      assert.equal(screen.paymentTerm.value, "14");
      assert.equal(screen.dueDate.value, "2026-08-31");
      assert.match(screen.issuerName1.textContent, /Eigene Unternehmensdaten unvollst.ndig/);

      screen._close();
      assert.equal(screen.overview.hidden, false);
      assert.equal(screen.editor.hidden, true);
    } finally {
      global.document = previousDocument;
    }
  });

  await run("Rechnung Navigation: Entwürfe sind über vorhandene Merkmale eindeutig auffindbar", () => {
    const previousDocument = global.document;
    const createElement = (tagName) => {
      const element = {
        tagName: String(tagName).toUpperCase(), children: [], hidden: false, style: {}, value: "", textContent: "",
        append(...children) { children.forEach((child) => { child.parentElement = this; this.children.push(child); }); },
        replaceChildren(...children) { this.children = []; this.append(...children); },
      };
      Object.defineProperty(element, "options", { get() { return this.children; } });
      return element;
    };
    global.document = { createElement };
    try {
      const screen = new rechnung.RechnungScreen();
      screen.customers = [{ kind: "global_firm", id: "customer-1", label: "Müller GmbH" }];
      screen.invoices = [
        { id: "draft-full", status: "DRAFT", customer_ref_kind: "global_firm", customer_firm_id: "customer-1", construction_project: "Fensterarbeiten", invoice_date: "2026-08-18", positions: [] },
        { id: "draft-no-customer", status: "DRAFT", service_reference: "Fensterarbeiten", invoice_date: "2026-08-18", positions: [] },
        { id: "draft-no-context", status: "DRAFT", customer_ref_kind: "global_firm", customer_firm_id: "customer-1", invoice_date: "2026-08-18", positions: [] },
        { id: "draft-empty", status: "DRAFT", invoice_date: "2026-08-18", positions: [] },
        { id: "draft-duplicate-one", status: "DRAFT", customer_ref_kind: "global_firm", customer_firm_id: "customer-1", construction_project: "Dachausbau", invoice_date: "2026-08-19", positions: [{ short_text: "Ausbau Fenster" }] },
        { id: "draft-duplicate-two", status: "DRAFT", customer_ref_kind: "global_firm", customer_firm_id: "customer-1", construction_project: "Dachausbau", invoice_date: "2026-08-19", positions: [{ short_text: "Einbau Fenster" }] },
        { id: "booked", status: "BOOKED", invoice_number: "RG-2026-0001", service_reference: "Fensterarbeiten", invoice_date: "2026-08-18", due_date: "2026-09-01", positions: [] },
      ];
      screen.list = createElement("div");

      screen._renderList();
      const bodyTexts = (index) => screen.list.children[index].children[1].children.map((entry) => entry.textContent);

      assert.deepEqual(bodyTexts(0), ["Entwurf", "Müller GmbH", "Fensterarbeiten · 18.08.2026"]);
      assert.deepEqual(bodyTexts(1), ["Entwurf", "Fensterarbeiten · 18.08.2026"]);
      assert.deepEqual(bodyTexts(2), ["Entwurf", "Müller GmbH", "18.08.2026"]);
      assert.deepEqual(bodyTexts(3), ["Entwurf vom 18.08.2026"]);
      assert.deepEqual(bodyTexts(4), ["Entwurf", "Müller GmbH", "Dachausbau · 19.08.2026", "1. Pos.: Ausbau Fenster"]);
      assert.deepEqual(bodyTexts(5), ["Entwurf", "Müller GmbH", "Dachausbau · 19.08.2026", "1. Pos.: Einbau Fenster"]);
      assert.deepEqual(bodyTexts(6), ["RG-2026-0001", "Fensterarbeiten · 2026-08-18 · 2026-09-01"]);
    } finally {
      global.document = previousDocument;
    }
  });

  await run("Rechnung Navigation: DRAFT-Eingaben speichern seriell ohne Positionsverlust", async () => {
    const previousWindow = global.window;
    const updates = [];
    global.window = {
      bbmDb: {
        rechnungUpdateDraft: async (id, payload) => {
          updates.push({ id, payload });
          return { ok: true, data: { id, status: "DRAFT", ...payload } };
        },
      },
    };
    try {
      const screen = new rechnung.RechnungScreen();
      const control = (value = "") => ({ value, checked: false, hidden: false, textContent: "", focus() {} });
      const first = { id: "position-1", type: "service", is_title: false, parent_id: null, short_text: "Alt", long_text: "", quantity: "1", unit: "St", unit_price_cents: 1000, is_nep: false };
      const second = { id: "position-2", type: "service", is_title: false, parent_id: null, short_text: "Zweite", long_text: "", quantity: "1", unit: "St", unit_price_cents: 2000, is_nep: false };
      screen.current = { id: "draft-1", status: "DRAFT" }; screen.positions = [first, second]; screen.selectedPositionId = first.id; screen.source = control("FREE"); screen.documentType = control("INVOICE"); screen.installmentNumber = control(); screen.invoiceDate = control("2026-08-19"); screen.serviceType = control("SINGLE_DATE"); screen.serviceDate = control("2026-08-19"); screen.serviceMonth = control(); screen.serviceStart = control(); screen.serviceEnd = control(); screen.customer = control("global_firm:customer-1"); screen.project = control(); screen.reference = control("Fensterarbeiten"); screen.constructionProject = control("Musterhaus"); screen.introText = control("Einleitung"); screen.paymentTerm = control("8"); screen.positionType = control("service"); screen.positionShort = control("Ausbau Fenster"); screen.positionLong = control("Langtext bleibt erhalten"); screen.positionQuantity = control("2"); screen.positionUnit = control("St"); screen.positionPrice = control("125.50"); screen.positionVatRate = control("7"); screen.positionPriceGross = control(); screen.positionNep = control(); screen.positionTypeField = {}; screen.positionQuantityField = {}; screen.positionUnitField = {}; screen.positionPriceField = {}; screen.positionVatRateField = {}; screen.positionPriceGrossField = {}; screen.positionNepField = {}; screen.positionsList = { classList: { toggle() {} } }; screen.customers = [{ kind: "global_firm", id: "customer-1", label: "Müller GmbH" }]; screen._renderPositions = () => {};

      screen._syncSelectedPositionFromEditor();
      screen._selectPosition(second);
      screen._createPosition();
      screen.reference.value = "Fensterarbeiten Nordseite";
      screen._queueDraftSave();
      await screen.draftSaveChain;

      assert.equal(updates.length, 3);
      assert.deepEqual(updates[0].payload.positions.find((entry) => entry.id === first.id), { ...first, short_text: "Ausbau Fenster", long_text: "Langtext bleibt erhalten", quantity: "2", unit_price_cents: 12550, total_cents: 25100, vat_rate_percent: 19, price_input_mode: "NET", price_input_cents: null, position_number: "01" });
      assert.equal(updates[1].payload.positions.some((entry) => entry.id === first.id && entry.short_text === "Ausbau Fenster"), true);
      assert.equal(updates[1].payload.positions.length, 3);
      assert.equal(updates[2].payload.service_reference, "Fensterarbeiten Nordseite");
      assert.equal(Object.hasOwn(updates[2].payload, "invoice_number"), false);
    } finally {
      global.window = previousWindow;
    }
  });

  await run("Rechnung Editbox: Inhalt wird nur beim Fokuswechsel vollstaendig markiert", () => {
    const listeners = new Map();
    const field = { selections: 0, addEventListener(type, listener) { listeners.set(type, listener); }, select() { this.selections += 1; } };
    rechnungScreen.selectContentOnFocus(field);
    assert.equal(listeners.size, 1);
    assert.equal(listeners.has("focus"), true);
    listeners.get("focus")();
    assert.equal(field.selections, 1);
    const source = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    for (const fieldName of ["positionShort", "positionLong", "positionQuantity", "positionUnit", "positionPrice"]) assert.equal(source.includes(fieldName), true, fieldName);
    assert.equal(source.includes("[this.positionShort, this.positionLong, this.positionQuantity, this.positionUnit, this.positionPrice].forEach(selectContentOnFocus)"), true);
    assert.equal(source.includes("positionVatRate].forEach(selectContentOnFocus)"), false);
    const listenerBinding = source.lastIndexOf(".forEach(selectContentOnFocus)");
    for (const fieldName of ["positionShort", "positionLong", "positionQuantity", "positionUnit", "positionPrice"]) assert.ok(source.lastIndexOf(`this.${fieldName} = control`, listenerBinding) >= 0, `${fieldName} wird vor dem Fokuslistener erzeugt`);
  });

  await run("Rechnung Editbox: Menge bleibt dezimalfaehig, rechtsbuendig und wird durch den 0-bis-4-Stepper begrenzt", () => {
    const iconPaths = [
      path.join(root, "src/renderer/modules/rechnungen/assets/icons/decimal-decrease.svg"),
      path.join(root, "src/renderer/modules/rechnungen/assets/icons/decimal-increase.svg"),
    ];
    for (const iconPath of iconPaths) {
      assert.equal(fs.existsSync(iconPath), true, iconPath);
      const svg = fs.readFileSync(iconPath, "utf8");
      assert.match(svg, /<svg[^>]*width="18"[^>]*height="16"/);
      assert.match(svg, />\.0(?:0)?</);
      assert.match(svg, /<path[^>]*stroke="#3a6fb0"[^>]*stroke-width="0\.9"/);
    }
    const source = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    assert.match(source, /new URL\("\.\.\/assets\/icons\/decimal-decrease\.svg", import\.meta\.url\)\.href/);
    assert.match(source, /new URL\("\.\.\/assets\/icons\/decimal-increase\.svg", import\.meta\.url\)\.href/);
    assert.match(source, /setAttribute\("title", "Nachkommastellen verringern"\)/);
    assert.match(source, /setAttribute\("title", "Nachkommastellen erhöhen"\)/);
    assert.match(source, /formatQuantityForDisplay\(entry\.quantity, this\.quantityDecimalPlaces\)/);
    assert.match(source, /formatEuroCents\(entry\.unit_price_cents\)/);
    assert.doesNotMatch(source, /this\.positionVatRate\.textContent = `MwSt\./);

    assert.deepEqual(rechnungScreen.QUANTITY_DECIMAL_PLACES, [0, 1, 2, 3, 4]);
    assert.equal(rechnungScreen.DEFAULT_QUANTITY_DECIMAL_PLACES, 2);
    assert.equal(rechnungScreen.isQuantityInputAllowed("2,3456", 4), true);
    assert.equal(rechnungScreen.isQuantityInputAllowed("2.3456", 4), true);
    assert.equal(rechnungScreen.isQuantityInputAllowed("2,34567", 4), false);
    assert.equal(rechnungScreen.isQuantityInputAllowed("2,3", 0), false);
    assert.equal(rechnungScreen.formatQuantityForInput("2.5000", 4), "2,5000");
    assert.equal(rechnungScreen.formatQuantityForInput("2.55", 1), "2,5");
    assert.deepEqual([0, 1, 2, 3, 4].map((places) => rechnungScreen.formatQuantityForInput("12,3456", places)), ["12", "12,3", "12,35", "12,346", "12,3456"]);
    assert.equal(rechnungScreen.formatQuantityForDisplay("1234.5", 2), "1.234,50");

    const screen = new rechnung.RechnungScreen();
    assert.equal(screen.quantityDecimalPlaces, 2);
    const control = (value = "") => ({ value, checked: false, disabled: false, hidden: false, textContent: "", setAttribute() {} });
    const fieldNode = () => ({ hidden: false });
    screen.current = { status: "DRAFT" }; screen.source = { value: "FREE" }; screen.message = { textContent: "", dataset: {} };
    screen.positions = [{ id: "service", type: "service", is_title: false, parent_id: null, short_text: "Leistung", long_text: "", quantity: "2.3456", unit: "m", unit_price_cents: 10000, vat_rate_percent: 19 }]; screen.selectedPositionId = "service";
    screen.positionType = control("service"); screen.positionShort = control("Leistung"); screen.positionLong = control(); screen.positionQuantity = control("2,3456"); screen.positionUnit = control("m"); screen.positionPrice = control("100.00"); screen.positionPriceGross = control(); screen.positionNep = control();
    screen.positionTypeField = fieldNode(); screen.positionQuantityBlock = fieldNode(); screen.positionUnitField = fieldNode(); screen.positionPriceField = fieldNode(); screen.positionVatRateField = fieldNode(); screen.positionPriceGrossField = fieldNode(); screen.positionNepField = fieldNode(); screen.positionPriceLabel = { textContent: "" }; screen.positionsList = { classList: { toggle() {} } }; screen._renderPositions = () => {};
    screen.positionQuantityDecimalsValue = { textContent: "" }; screen.positionQuantityDecimalsDecrease = { disabled: false }; screen.positionQuantityDecimalsIncrease = { disabled: false }; screen._lastValidQuantityInput = "2,3456"; screen._quantityInputSourceValue = "12,3456"; screen.positionQuantity.value = "12,3456";

    for (const [places, visibleQuantity] of [[3, "12,346"], [2, "12,35"], [1, "12,3"], [0, "12"], [1, "12,3"], [2, "12,35"], [3, "12,346"], [4, "12,3456"]]) {
      screen._setQuantityDecimalPlaces(places);
      assert.equal(screen.quantityDecimalPlaces, places);
      assert.equal(screen.positionQuantityDecimalsValue.textContent, String(places));
      assert.equal(screen.positionQuantity.value, visibleQuantity);
      assert.equal(screen.positionQuantityDecimalsDecrease.disabled, places === 0);
      assert.equal(screen.positionQuantityDecimalsIncrease.disabled, places === 4);
    }
    screen.positionQuantity.value = "2,3456"; screen._lastValidQuantityInput = "2,3456"; screen._handlePositionQuantityInput();
    assert.equal(screen.positions[0].quantity, "2.3456");
    screen.positionQuantity.value = "2,34567"; screen._handlePositionQuantityInput();
    assert.equal(screen.positionQuantity.value, "2,3456");
    assert.equal(screen.positions[0].quantity, "2.3456");
    screen._setQuantityDecimalPlaces(2);
    assert.equal(screen.positionQuantity.value, "2,35");
    assert.equal(screen.positions[0].quantity, "2.35");
    screen.positionQuantity.value = "7.25"; screen._handlePositionQuantityInput(); screen._commitPositionQuantityInput();
    assert.equal(screen.positionQuantity.value, "7,25");
    assert.equal(screen.positions[0].quantity, "7.25");

    const css = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/styles/rechnungenDesign.css"), "utf8");
    assert.match(css, /\.rechnung-live-position-editor__quantity \{ text-align: right !important;/);
    assert.match(css, /\.rechnung-live-position-editor__decimal-stepper \{ display: grid;/);
    assert.match(css, /\.rechnung-live-position-editor \{ grid-template-columns: minmax\(0, \.65fr\) minmax\(0, 2fr\) repeat\(3, minmax\(0, 1fr\)\); gap: 5px 8px; \}/);
    assert.match(css, /\.rechnung-live-position-editor > \.rechnung-sheet__position-title \{ grid-column: 1; grid-row: 1; align-self: center; \}/);
    assert.match(css, /\.rechnung-live-position-editor__actions \{ grid-column: 2 \/ -1; grid-row: 1;/);
    assert.doesNotMatch(css, /minmax\(148px, \.8fr\)/);
    assert.match(css, /\.rechnung-live-position-editor__nep-field \{ grid-column: 3; grid-row: 4; align-self: start; \}/);
    assert.match(css, /\.rechnung-live-position-editor__totals \{ grid-column: 4 \/ span 2; grid-row: 3 \/ span 2;/);
    const elements = new Map(rechnungContract.rechnungUiEditorContract.slots.map((slot) => [slot.slotId, slot.element]));
    assert.equal(elements.get("rechnung.editor.positionQuantity").parentId, "rechnung.editor.positionQuantityBlock");
    assert.equal(elements.get("rechnung.editor.positionQuantityDecimals.decrease").lockedOps.includes("executeTargetAction"), true);
    assert.equal(elements.get("rechnung.editor.positionQuantityDecimals.increase").lockedOps.includes("modifyDomainData"), true);
  });

  await run("Rechnung Editbox: Gesamtbetrag nutzt die vorhandenen Rechnungssummen dynamisch und formatiert Euro", () => {
    assert.deepEqual(
      [1082500, 205675, 1288175, 33456, -1082500].map(rechnungScreen.formatEuroCents),
      ["10.825,00 €", "2.056,75 €", "12.881,75 €", "334,56 €", "-10.825,00 €"]
    );
    const previousDocument = global.document;
    global.document = { createElement: (tagName) => ({ tagName: String(tagName).toUpperCase(), className: "", children: [], textContent: "", append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = [...children]; } }) };
    try {
      const screen = new rechnung.RechnungScreen();
      screen.positions = [
        { id: "a", type: "service", is_title: false, parent_id: null, short_text: "A", long_text: "", quantity: "1", unit: "St", unit_price_cents: 1082500, vat_rate_percent: 19, price_input_mode: "NET", is_nep: false },
      ];
      screen.positionsList = { replaceChildren() {}, append() {} };
      screen.positionsTotal = { textContent: "" }; screen.invoiceVatLabel = { textContent: "" }; screen.invoiceVat = { textContent: "" }; screen.invoiceTotal = { textContent: "" };
      screen.editboxNetTotal = { textContent: "" }; screen.editboxVatLabel = { textContent: "" }; screen.editboxVatTotal = { textContent: "" }; screen.editboxGrossTotal = { textContent: "" };
      screen._renderLvPositions();
      assert.deepEqual([screen.editboxNetTotal.textContent, screen.editboxVatLabel.textContent, screen.editboxVatTotal.textContent, screen.editboxGrossTotal.textContent], ["10.825,00 €", "19 % MwSt.", "2.056,75 €", "12.881,75 €"]);

      screen.positions[0].vat_rate_percent = 7;
      screen._renderLvPositions();
      assert.deepEqual([screen.editboxNetTotal.textContent, screen.editboxVatLabel.textContent, screen.editboxVatTotal.textContent, screen.editboxGrossTotal.textContent], ["10.825,00 €", "7 % MwSt.", "757,75 €", "11.582,75 €"]);

      screen.positions[0].vat_rate_percent = 19;
      screen.positions.push({ id: "b", type: "service", is_title: false, parent_id: null, short_text: "B", long_text: "", quantity: "1", unit: "St", unit_price_cents: 10000, vat_rate_percent: 7, price_input_mode: "NET", is_nep: false });
      screen._renderLvPositions();
      assert.equal(screen.editboxVatLabel.textContent, "MwSt.");
      assert.deepEqual([screen.editboxNetTotal.textContent, screen.editboxVatTotal.textContent, screen.editboxGrossTotal.textContent], ["10.925,00 €", "2.063,75 €", "12.988,75 €"]);
    } finally { global.document = previousDocument; }

    const source = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    const css = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/styles/rechnungenDesign.css"), "utf8");
    for (const token of ["Gesamtbetrag", "Netto", "Brutto", "formatEuroCents(totals.net_cents)", "formatEuroCents(totals.vat_cents)", "formatEuroCents(totals.gross_cents)", "new Intl.NumberFormat(\"de-DE\""]) assert.equal(source.includes(token), true, token);
    assert.match(css, /\.rechnung-live-position-editor__totals \{[^}]*border: 1px solid/);
    assert.match(css, /\.rechnung-live-position-editor__totals-value \{[^}]*text-align: right;/);
  });

  await run("Rechnung Preisbedienung: Brutto-Haken rechnet den sichtbaren EP wirtschaftlich gleich um", () => {
    const screen = new rechnung.RechnungScreen();
    const control = (value = "") => ({ value, checked: false, disabled: false, hidden: false, textContent: "" });
    const field = () => ({ hidden: false });
    screen.current = { status: "DRAFT" }; screen.source = { value: "FREE" }; screen.message = { textContent: "", dataset: {} }; screen.positions = [{ id: "service", type: "service", is_title: false, parent_id: null, short_text: "Leistung", long_text: "", quantity: "1", unit: "St", unit_price_cents: 10000, vat_rate_percent: 19 }]; screen.selectedPositionId = "service";
    screen.positionType = control("service"); screen.positionShort = control("Leistung"); screen.positionLong = control(); screen.positionQuantity = control("1"); screen.positionUnit = control("St"); screen.positionPrice = control("100.00"); screen.positionVatRate = control(); screen.positionPriceGross = control(); screen.positionNep = control(); screen.positionTypeField = field(); screen.positionQuantityField = field(); screen.positionUnitField = field(); screen.positionPriceField = field(); screen.positionVatRateField = field(); screen.positionPriceGrossField = field(); screen.positionNepField = field(); screen.positionPriceLabel = { textContent: "" }; screen.positionsList = { classList: { toggle() {} } }; screen._renderPositions = () => {};
    screen.positionPriceGross.checked = true; screen._togglePositionPriceInputMode();
    assert.equal(screen.positionPrice.value, "119.00");
    assert.deepEqual(screen.positions.map((entry) => [entry.unit_price_cents, entry.price_input_mode, entry.price_input_cents]), [[10000, "GROSS", 11900]]);
    assert.equal(screen.positionPriceLabel.textContent, "Einzelpreis brutto");
    screen.positionPriceGross.checked = false; screen._togglePositionPriceInputMode();
    assert.equal(screen.positionPrice.value, "100.00");
    assert.deepEqual(screen.positions.map((entry) => [entry.unit_price_cents, entry.price_input_mode, entry.price_input_cents]), [[10000, "NET", null]]);
    assert.equal(screen.positionPriceLabel.textContent, "Einzelpreis netto");
    screen.positionType.value = "note";
    screen._syncPositionEditorFields();
    assert.equal(screen.positionPriceField.hidden, true);
    assert.equal(screen.positionVatRateField.hidden, true);
    assert.equal(screen.positionPriceGrossField.hidden, true);
  });

  await run("Rechnung Briefkopf: Ausstellerdaten bleiben im Kopf schlank, Finanzdaten stehen im Blattfuß", () => {
    const information = rechnungScreen.issuerInformation({ name: "Planungsbüro", name2: "Steffen Bandholt", street: "Rissener Straße 2", zip: "22880", city: "Wedel", iban: "DE78", bic: "COBADE", bank_name: "Privatbank", vat_id: "DE123", tax_number: "31/003/60469", commercial_register: "Registergericht Hamburg", register_number: "HRB 12345", managing_director: "Max Mustermann" });
    assert.deepEqual(information.nameLines, ["Planungsbüro", "Steffen Bandholt"]);
    assert.deepEqual(information.addressLines, ["Rissener Straße 2", "22880 Wedel"]);
    assert.deepEqual(information.taxRow, { label: "USt-IdNr.", value: "DE123" });
    assert.deepEqual(information.bankRows, [{ label: "IBAN", value: "DE78" }, { label: "BIC", value: "COBADE" }]);
    assert.equal(JSON.stringify(information).includes("Privatbank"), false);
    assert.deepEqual(information.footerLines, ["Planungsbüro · Steffen Bandholt · Rissener Straße 2 · 22880 Wedel", "USt-IdNr. DE123 · Steuernr. 31/003/60469 · IBAN DE78 · BIC COBADE", "Registergericht Hamburg · Registernr. HRB 12345 · Geschäftsführer Max Mustermann"]);
    const css = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/styles/rechnungenDesign.css"), "utf8");
    assert.match(css, /\.rechnung-live-position-editor \.invoice-control\[type="checkbox"\] \{[^}]*width: 14px;[^}]*height: 14px;/);
    assert.match(css, /grid-template-columns: 102px 8px minmax\(0, 1fr\)/);
    assert.match(css, /rechnung-sheet__issuer-column > \.rechnung-sheet__facts\[hidden\]/);
    assert.match(css, /rechnung-sheet__issuer-footer/);
    const screenSource = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    assert.equal(screenSource.includes("issuer.append(this.issuerBlock, this.invoiceMetaBlock)"), true, "Ausstelleranschrift und Metadaten sind zwei direkte Teilblöcke des rechten Kopfbereichs.");
    assert.equal(screenSource.includes("rechnung.editor.issuerAddress"), false, "Der alte grobe Aussteller-Ref wird nicht parallel gemountet.");
    assert.equal(screenSource.includes("rechnung.editor.issuerMeta"), false, "Der alte grobe Rechnungsdaten-Ref wird nicht parallel gemountet.");
    const headElements = new Map(rechnungContract.rechnungUiEditorContract.slots.map((slot) => [slot.slotId, slot.element]));
    assert.deepEqual([...headElements.keys()].filter((id) => ["rechnung.editor.issuerBlock", "rechnung.editor.issuerName1", "rechnung.editor.issuerName2", "rechnung.editor.issuerStreet", "rechnung.editor.issuerCity", "rechnung.editor.invoiceMetaBlock", "rechnung.editor.invoiceDateDisplay", "rechnung.editor.servicePeriodDisplay"].includes(id)).sort(), ["rechnung.editor.invoiceDateDisplay", "rechnung.editor.invoiceMetaBlock", "rechnung.editor.issuerBlock", "rechnung.editor.issuerCity", "rechnung.editor.issuerName1", "rechnung.editor.issuerName2", "rechnung.editor.issuerStreet", "rechnung.editor.servicePeriodDisplay"]);
    assert.deepEqual([headElements.get("rechnung.editor.issuerName1").parentId, headElements.get("rechnung.editor.issuerName2").parentId, headElements.get("rechnung.editor.issuerStreet").parentId, headElements.get("rechnung.editor.issuerCity").parentId], ["rechnung.editor.issuerBlock", "rechnung.editor.issuerBlock", "rechnung.editor.issuerBlock", "rechnung.editor.issuerBlock"]);
    assert.deepEqual([headElements.get("rechnung.editor.invoiceDateDisplay").parentId, headElements.get("rechnung.editor.servicePeriodDisplay").parentId], ["rechnung.editor.invoiceMetaBlock", "rechnung.editor.invoiceMetaBlock"]);
    const headGrid = css.match(/\.rechnung-sheet__letterhead \{ grid-template-columns: minmax\(0, 1fr\) 360px; column-gap: 58px; \}/);
    assert.ok(headGrid, "Der äußere rechte Kopfbereich ist eine feste, am Innenrand endende 360-px-Grid-Spalte.");
    assert.match(css, /\.rechnung-sheet__issuer-address \{ width: fit-content; min-width: 210px; max-width: 100%; justify-self: end; text-align: left; \}/);
    assert.match(css, /\.rechnung-sheet__issuer-meta \{ width: fit-content; min-width: 270px; max-width: 100%; justify-self: end; \}/);
    assert.match(css, /\.rechnung-sheet__letterhead, \.rechnung-sheet__positions, \.rechnung-lv-list \{ inline-size: 100%; box-sizing: border-box; \}/);
    const sheetWidth = 940; const horizontalPadding = 42; const gridGap = 58; const rightColumnWidth = 360;
    const innerWidth = sheetWidth - (horizontalPadding * 2); const recipientWidth = innerWidth - gridGap - rightColumnWidth;
    const rightColumnStart = horizontalPadding + recipientWidth + gridGap; const rightColumnEnd = rightColumnStart + rightColumnWidth;
    const lvRightEdge = horizontalPadding + innerWidth; const headRightEdge = rightColumnEnd;
    assert.deepEqual({ recipientWidth, rightColumnStart, lvRightEdge, headRightEdge, deviation: Math.abs(lvRightEdge - headRightEdge), rightInset: sheetWidth - headRightEdge }, { recipientWidth: 438, rightColumnStart: 538, lvRightEdge: 898, headRightEdge: 898, deviation: 0, rightInset: 42 });
    assert.equal(css.lastIndexOf("grid-template-columns: minmax(0, 1fr) 360px") > css.lastIndexOf("grid-template-columns: minmax(0, 1fr) 310px"), true, "Kein späterer Container begrenzt den äußeren rechten Kopfbereich wieder auf 310 px.");
    assert.match(css, /\.rechnung-sheet__issuer-names__line \{ font-weight: 600; \}/);
    assert.match(css, /\.rechnung-sheet__issuer-address, \.rechnung-sheet__issuer-meta-label, \.rechnung-sheet__issuer-meta-colon, \.rechnung-sheet__issuer-meta-value \{ font-weight: 500; \}/);
    assert.equal(rechnungScreen.issuerInformation({ name: "Planungsbüro" }).nameLines.includes("Rechnungssteller"), false);
  });

  await run("Rechnung Textlimits: nutzt zentrale Protokoll-Limits, Counter und Settings-Aktualisierung", async () => {
    let onLimitsChanged = null;
    let unsubscribed = false;
    const service = {
      async load() { return { shortText: 12, longText: 30 }; },
      subscribe(handler) { onLimitsChanged = handler; return () => { unsubscribed = true; }; },
    };
    const screen = new rechnung.RechnungScreen({ textLimitSettingsService: service });
    screen.positionShort = { value: "Fenster" }; screen.positionLong = { value: "Ausbau Fenster Nordseite" };
    screen.positionShortRemaining = { textContent: "", dataset: {} }; screen.positionLongRemaining = { textContent: "", dataset: {} };
    await screen._loadTextLimits();
    assert.deepEqual(screen.textLimits, { shortText: 12, longText: 30 });
    assert.equal(screen.positionShort.maxLength, 12);
    assert.equal(screen.positionLong.maxLength, 30);
    assert.equal(screen.positionShortRemaining.textContent, "5");
    assert.equal(screen.positionLongRemaining.textContent, "6");
    screen.positionShort.value = "Fensterbau"; screen.positionLong.value = "Ausbau"; screen._updatePositionTextCounters();
    assert.equal(screen.positionShortRemaining.textContent, "2");
    assert.equal(screen.positionLongRemaining.textContent, "24");
    screen._bindTextLimitSettings(); onLimitsChanged({ shortText: 100, longText: 500 });
    assert.equal(screen.positionShort.maxLength, 100);
    assert.equal(screen.positionLong.maxLength, 500);
    assert.equal(screen.positionShortRemaining.textContent, "90");
    assert.equal(screen.positionLongRemaining.textContent, "494");
    screen.destroy(); assert.equal(unsubscribed, true);

    const fallbackScreen = new rechnung.RechnungScreen({ textLimitSettingsService: { async load() { return {}; }, subscribe() { return () => {}; } } });
    fallbackScreen.positionShort = { value: "" }; fallbackScreen.positionLong = { value: "" };
    fallbackScreen.positionShortRemaining = { textContent: "", dataset: {} }; fallbackScreen.positionLongRemaining = { textContent: "", dataset: {} };
    await fallbackScreen._loadTextLimits();
    assert.deepEqual(fallbackScreen.textLimits, { shortText: 100, longText: 500 });
    assert.deepEqual([fallbackScreen.positionShortRemaining.textContent, fallbackScreen.positionLongRemaining.textContent], ["100", "500"]);
  });

  await run("Rechnung UI: vertikale Rahmen- und Grenzabstaende sind null", () => {
    const css = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/styles/rechnungenDesign.css"), "utf8");
    assert.match(css, /\.bbm-rechnung-live \{ display: flex; flex-direction: column; gap: 0;[^}]*padding-block: 0;/);
    assert.match(css, /\.rechnung-screen__sheet-area \{ flex: 1 1 auto; min-height: 0; overflow: auto;/);
    assert.match(css, /\.rechnung-screen__sheet-canvas \{ min-height: 0; display: flex; flex-direction: column; \}/);
    assert.match(css, /\.rechnung-live-editor__body\.rechnung-sheet \{ flex: 0 0 auto; min-height: 0;/);
    assert.match(css, /\.rechnung-screen__edit-area \{ flex: 0 0 auto; overflow: visible; border-top: 0;[^}]*padding: 0 10px; \}/);
    assert.match(css, /\.rechnung-screen__edit-canvas \{ overflow: visible; \}/);
    assert.match(css, /\.rechnung-live-position-editor \{ padding: 0; border: 0; box-shadow: none; \}/);
    assert.match(css, /\.rechnung-live-editor__body\.rechnung-sheet \{ padding: 0 42px; \}/);
    assert.match(css, /\.rechnung-sheet__head-content\[hidden\] \+ \.rechnung-sheet__positions \{ margin-top: 0; padding-top: 0; border-top: 0; \}/);
    assert.match(css, /\.rechnung-live-message \{ flex: 0 0 auto; min-height: 0;/);
    assert.match(css, /\.rechnung-live-message:empty \{ display: none; padding-block: 0; \}/);
    assert.doesNotMatch(css, /\.rechnung-screen__edit-(?:area|canvas)\s*\{[^}]*max-height:/);
    assert.doesNotMatch(css, /\.rechnung-(?:screen__sheet-canvas|live-editor__body\.rechnung-sheet)\s*\{[^}]*min-height:\s*100%/);
  });

  await run("Rechnung Proberechnung: DRAFT-Kennung ist stabil, unterscheidbar und keine Rechnungsnummer", () => {
    assert.equal(rechnungScreen.draftPreviewIdentifier("draft-8f3a2c"), "PR-8F3A2C");
    assert.equal(rechnungScreen.draftPreviewIdentifier("draft-8f3a2c"), rechnungScreen.draftPreviewIdentifier("draft-8f3a2c"));
    assert.notEqual(rechnungScreen.draftPreviewIdentifier("draft-8f3a2c"), rechnungScreen.draftPreviewIdentifier("draft-1b2c3d"));
    const source = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    for (const text of ["invoice.preview_identifier || draftPreviewIdentifier(invoice.id)", "Diese Kennung ist keine Rechnungsnummer.", "Rechnungs-Nr.: wird erst bei Buchung vergeben"]) assert.equal(source.includes(text), true, text);
    assert.equal(source.includes("vorgemerkte Rechnungsnummer"), false);
  });

  await run("Rechnung Proberechnung: DRAFT zeigt Kennung und nur den Buchungshinweis zur Rechnungsnummer", async () => {
    const previousWindow = global.window;
    let printPayload = null;
    global.window = {
      bbmDb: { rechnungPreviewDraft: async () => ({ ok: true, data: { id: "draft-8f3a2c", status: "DRAFT", preview: true, preview_identifier: "PR-8F3A2C", invoice_number: null, document_type: "INVOICE", service_reference: "Fensterarbeiten", invoice_date: "2026-08-19", due_date: "2026-08-27" } }) },
      bbmPrint: { printPdfAndPreviewInternal: async (payload) => { printPayload = payload; return { ok: true, filePath: "preview.pdf" }; } },
    };
    try {
      const screen = new rechnung.RechnungScreen();
      screen.current = { id: "draft-8f3a2c", status: "DRAFT" }; screen.draftSaveChain = Promise.resolve(true); screen.previewBody = { textContent: "" }; screen.preview = { hidden: true }; screen.message = { textContent: "" }; screen._payload = () => ({}); screen._error = (message) => { throw new Error(message); };
      await screen._showPreview();
      assert.match(screen.previewBody.textContent, /^PROBERECHNUNG · ENTWURF/m);
      assert.match(screen.previewBody.textContent, /Kennung: PR-8F3A2C/);
      assert.match(screen.previewBody.textContent, /Diese Kennung ist keine Rechnungsnummer\./);
      assert.match(screen.previewBody.textContent, /Rechnungs-Nr\.: wird erst bei Buchung vergeben/);
      assert.equal(screen.preview.hidden, false);
      assert.deepEqual([printPayload.mode, printPayload.documentTypeId, printPayload.invoiceId, printPayload.invoicePreview, printPayload.targetDir], ["invoice", "invoice", "draft-8f3a2c", true, "temp"]);
    } finally {
      global.window = previousWindow;
    }
  });

  await run("Rechnung Navigation: produktive Sichtbarkeit folgt weiterhin der Lizenzmodulliste", async () => {
    const previousWindow = global.window;
    try {
      global.window = { bbmDb: { appIsPackaged: async () => ({ ok: true, isPackaged: true }), licenseGetStatus: async () => ({ valid: true, modules: ["rechnung"] }) } };
      await access.refreshCachedActiveModuleAccess({ force: true });
      assert.equal(access.isModuleActive("rechnung"), true);
      global.window.bbmDb.licenseGetStatus = async () => ({ valid: true, modules: ["protokoll"] });
      await access.refreshCachedActiveModuleAccess({ force: true });
      assert.equal(access.isModuleActive("rechnung"), false);
    } finally { global.window = previousWindow; }
  });

  await run("Rechnung Navigation: normaler Start wartet auf Modulzugriff und nutzt keinen DEV-Pfad", () => {
    const main = fs.readFileSync(path.join(root, "src/renderer/main.js"), "utf8");
    const router = fs.readFileSync(path.join(root, "src/renderer/app/Router.js"), "utf8");
    const navigation = fs.readFileSync(path.join(root, "src/renderer/app/coreShellNavigation.js"), "utf8");
    assert.equal(main.includes("await router.ensureActiveModuleAccess({ force: true })"), true);
    assert.equal(router.includes("async openGlobalModule(moduleId, options = {})"), true);
    assert.equal(router.includes("resolveActiveModuleScreen(normalizedModuleId, navEntry.workScreenId)"), true);
    assert.equal(navigation.includes("isRechnungenDesignAvailable"), false);
    assert.equal(navigation.includes("showRechnungenDesign"), false);
  });
  await run("Rechnung Hierarchie-UI: Anlegekontext, Tiefensperre, Schieben und FROM_ORDER-Sperre folgen dem Protokollprinzip", () => {
    const screen = new rechnung.RechnungScreen();
    const control = () => ({ value: "", checked: false, disabled: false, hidden: false, textContent: "", focus() {} });
    const field = () => ({ hidden: false });
    screen.current = { status: "DRAFT" }; screen.source = { value: "FREE" }; screen.message = { textContent: "", dataset: {} };
    screen.positionType = control(); screen.positionShort = control(); screen.positionLong = control(); screen.positionQuantity = control(); screen.positionUnit = control(); screen.positionPrice = control(); screen.positionVatRate = control("19"); screen.positionPriceGross = control(); screen.positionNep = control();
    screen.positionDeleteButton = control(); screen.positionCreateTitleButton = control(); screen.positionCreateButton = control(); screen.positionMoveButton = control(); screen.positionMoveRootButton = control();
    screen.positionTypeField = field(); screen.positionQuantityField = field(); screen.positionUnitField = field(); screen.positionPriceField = field(); screen.positionVatRateField = field(); screen.positionPriceGrossField = field(); screen.positionNepField = field();
    screen.positionsList = { classList: { toggle() {} } }; screen._renderPositions = () => {};

    screen._createPosition(); screen._createPosition(); screen._createPosition();
    assert.deepEqual(screen.positions.map((entry) => [entry.type, entry.parent_id, entry.position_number]), [["service", null, "01"], ["service", null, "02"], ["service", null, "03"]]);
    screen._createTitle(); const title = screen._getSelectedPosition();
    assert.deepEqual([title.type, title.is_title, title.position_number], ["heading", true, "1"]);
    screen.positionShort.value = "Fensterarbeiten"; screen.positionLong.value = ""; screen._syncSelectedPositionFromEditor();
    const savedTitle = screen._getSelectedPosition(); assert.deepEqual([savedTitle.id, savedTitle.parent_id, savedTitle.is_title, savedTitle.short_text], [title.id, null, true, "Fensterarbeiten"]);
    screen._selectPosition(savedTitle); screen._createPosition(); const childOne = screen._getSelectedPosition();
    screen.positionShort.value = "Ausbau Fenster"; screen.positionLong.value = "Vorhandenes Fenster fachgerecht ausbauen und entsorgen."; screen.positionQuantity.value = "1"; screen.positionUnit.value = "St"; screen.positionPrice.value = "125.00"; screen.positionNep.checked = false; screen._syncSelectedPositionFromEditor();
    const savedChildOne = screen._getSelectedPosition();
    assert.deepEqual([savedChildOne.id, savedChildOne.parent_id, savedChildOne.type, savedChildOne.is_title, savedChildOne.short_text, savedChildOne.long_text, savedChildOne.quantity, savedChildOne.unit, savedChildOne.unit_price_cents, savedChildOne.is_nep], [childOne.id, savedTitle.id, "service", false, "Ausbau Fenster", "Vorhandenes Fenster fachgerecht ausbauen und entsorgen.", "1", "St", 12500, false]);
    screen._selectPosition(savedTitle); screen._createPosition(); const childTwo = screen._getSelectedPosition();
    screen.positionShort.value = "Lieferung Fenster"; screen.positionQuantity.value = "1"; screen.positionUnit.value = "St"; screen.positionPrice.value = "750.00"; screen._syncSelectedPositionFromEditor();
    assert.equal(screen.positions.find((entry) => entry.id === childOne.id).short_text, "Ausbau Fenster");
    assert.deepEqual([childOne.parent_id, childOne.position_number, childTwo.parent_id, childTwo.position_number], [title.id, "1.01", title.id, "1.02"]);
    assert.deepEqual(screen._orderedPositions().slice(-3).map((entry) => entry.id), [title.id, childOne.id, childTwo.id]);
    screen._selectPosition(savedChildOne); screen.positionShort.value = "Ausbau Bestandsfenster"; screen.positionLong.value = "Bestandsfenster fachgerecht ausbauen und entsorgen."; screen._syncSelectedPositionFromEditor();
    assert.deepEqual(screen.positions.find((entry) => entry.id === childOne.id).short_text, "Ausbau Bestandsfenster");
    screen._selectPosition(screen.positions.find((entry) => entry.id === childOne.id)); const beforeBlockedCreate = screen.positions.length; screen._createPosition();
    assert.equal(screen.positions.length, beforeBlockedCreate);
    assert.match(screen.message.textContent, /Meilenstein 3/);

    const idsBeforeMove = screen.positions.map((entry) => entry.id).sort();
    const rootPosition = screen.positions.find((entry) => entry.position_number === "01");
    screen._selectPosition(rootPosition); screen._togglePositionMove(); screen._moveSelectedPositionTo(title);
    assert.equal(screen.positions.find((entry) => entry.id === rootPosition.id).parent_id, title.id);
    const movedChild = screen.positions.find((entry) => entry.id === rootPosition.id);
    screen._selectPosition(movedChild); screen._togglePositionMove(); screen._moveSelectedPositionToRoot();
    assert.equal(screen.positions.find((entry) => entry.id === rootPosition.id).parent_id, null);
    assert.deepEqual(screen.positions.map((entry) => entry.id).sort(), idsBeforeMove);

    screen.source.value = "FROM_ORDER"; const beforeFromOrder = screen.positions.length; screen._createTitle(); screen._createPosition(); screen._togglePositionMove();
    assert.equal(screen.positions.length, beforeFromOrder);
    assert.equal(screen.isPositionMoveMode, false);
  });
  await run("Rechnung Navigation: normaler Arbeitsweg rendert das Rechnungsblatt mit Bau-LV und getrennten Anwendungsaktionen", () => {
    const screen = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    const css = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/styles/rechnungenDesign.css"), "utf8");
    for (const token of ["return this._sheetEditor()", "Rechnungsempfänger", "Bauvorhaben / Leistungsbezug", "rechnung-lv-list", "rechnung-lv-position", "Summe Netto", "19 % MwSt.", "Summe Brutto", "calculateInvoiceTotalsCents", "rechnung-sheet__letterhead", "rechnung-sheet__issuer-column", "Bitte überweisen Sie den Rechnungsbetrag", "rechnung-action-rail"]) assert.equal(screen.includes(token) || css.includes(token), true, token);
    assert.equal(screen.includes("rechnung.editor.servicePeriodToggle"), true);
    for (const token of ["rechnung.editor.positionCreateTitle", "rechnung.editor.positionCreate", "rechnung.editor.positionMove", "positionCreateParentId", "isPositionMoveMode"]) assert.equal(screen.includes(token), true, token);
    assert.equal(screen.includes("Position anklicken, um sie direkt auf dem Rechnungsblatt zu bearbeiten."), false);
    assert.equal(screen.includes("_sheetEditor()"), true);
    for (const token of ["rechnung-lv-list__pricing-head", "Pos. / Gegenstand", "Menge / Einheit", "money(entry.unit_price_cents)"]) assert.equal(screen.includes(token), true, token);
    assert.equal(screen.includes("is-tone-"), false);
    assert.equal(screen.includes("`EP ${money(entry.unit_price_cents)}`"), false);
    assert.equal(screen.includes("`GP ${money(amount)}`"), false);
    for (const token of ["grid-template-columns: 42px minmax(0, 1.4fr) minmax(0, .9fr) 122px 136px", "border-top: 5px solid #f5f7fa", ".rechnung-lv-position.is-selected", "white-space: pre-line"]) assert.equal(css.includes(token), true, token);
    assert.match(css, /\.rechnung-lv-position \{[^}]*background: transparent; \}/);
    assert.doesNotMatch(css, /\.rechnung-lv-position \{[^}]*background:\s*#(?:fff|f8fafc)/);
    assert.equal(css.includes("is-tone-"), false);
    for (const token of ["Rechnungsblatt: endloser, zusammenhaengender Papierbereich", ".rechnung-screen__sheet-area { padding: 0; background: #fff; }", ".rechnung-screen__sheet-canvas { min-height: 0; background: #fff; }", "border-radius: 0; background: transparent; box-shadow: none;"]) assert.equal(css.includes(token), true, token);
  });
}

module.exports = { runRechnungNavigationTests };
