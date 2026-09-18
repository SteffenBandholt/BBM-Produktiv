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
    const ResolvedRechnungScreen = modules.resolveActiveModuleScreen("rechnung", rechnung.RECHNUNG_WORK_SCREEN_ID);
    assert.equal(ResolvedRechnungScreen.prototype instanceof rechnung.RechnungScreen, true);
    const resolvedScreen = new ResolvedRechnungScreen();
    assert.equal(resolvedScreen instanceof rechnung.RechnungScreen, true);
    assert.equal(resolvedScreen.uiEditorScopeId, "rechnung.screen");
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
    assert.match(css, /\.rechnung-live-overview\[hidden\],\s*\.rechnung-live-editor\[hidden\],\s*\.rechnung-catalog\[hidden\]\s*\{\s*display:\s*none;\s*\}/);
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

      screen._updateSelectedPositionFromDetails();
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

  await run("Rechnung Positionsdetails: aktuelle Felder sind integriert und die alte Editbox bleibt entfernt", () => {
    const source = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    for (const id of ["rechnung.editor.positionShort", "rechnung.editor.positionLong", "rechnung.editor.positionQuantity", "rechnung.editor.positionUnit", "rechnung.editor.positionPrice", "rechnung.editor.positionVatRate", "rechnung.editor.positionNep"]) assert.equal(source.includes(id), true, id);
    assert.equal(source.includes('bind(node("section", "rechnung-position-details"), "rechnung.editor.positionDetails")'), true);
    assert.equal(source.includes("const updatePosition = () => this._updateSelectedPositionFromDetails()"), true);
    for (const forbidden of ["rechnung-live-position-editor", "selectContentOnFocus", "_syncSelectedPositionFromEditor", "positionPriceGross", "positionMoveRootButton"]) assert.equal(source.includes(forbidden), false, forbidden);
    const elements = new Map(rechnungContract.rechnungUiEditorContract.slots.map((slot) => [slot.slotId, slot.element]));
    for (const id of ["rechnung.editor.positionShort", "rechnung.editor.positionLong", "rechnung.editor.positionQuantity", "rechnung.editor.positionUnit", "rechnung.editor.positionPrice", "rechnung.editor.positionVatRate", "rechnung.editor.positionNep"]) assert.equal(elements.get(id)?.parentId, "rechnung.editor.positionDetails", id);
  });

  await run("Rechnung Positionsdetails: Menge akzeptiert bis zu vier Nachkommastellen ohne alten Stepper", () => {
    assert.deepEqual(rechnungScreen.QUANTITY_DECIMAL_PLACES, [0, 1, 2, 3, 4]);
    assert.equal(rechnungScreen.DEFAULT_QUANTITY_DECIMAL_PLACES, 2);
    assert.equal(rechnungScreen.isQuantityInputAllowed("2,3456", 4), true);
    assert.equal(rechnungScreen.isQuantityInputAllowed("2,34567", 4), false);
    assert.equal(rechnungScreen.parseInvoiceQuantityInput("2,3456"), "2.3456");
    assert.throws(() => rechnungScreen.parseInvoiceQuantityInput("2,34567"), /maximal vier Nachkommastellen/);
    assert.equal(rechnungScreen.formatQuantityForInput("2.5000", 4), "2,5000");
    assert.equal(rechnungScreen.formatQuantityForDisplay("1234.5", 2), "1.234,50");

    const screen = new rechnung.RechnungScreen();
    const control = (value = "") => ({ value, checked: false, disabled: false });
    screen.current = { status: "DRAFT" };
    screen.source = { value: "FREE" };
    screen.message = { textContent: "", dataset: {} };
    screen.positions = [{ id: "service", type: "service", is_title: false, parent_id: null, short_text: "Leistung", long_text: "", quantity: "1", unit: "m", unit_price_cents: 10000, vat_rate_percent: 19, price_input_mode: "NET", is_nep: false }];
    screen.selectedPositionId = "service";
    screen.positionShort = control("Leistung");
    screen.positionLong = control("");
    screen.positionQuantity = control("2,3456");
    screen.positionUnit = control("m");
    screen.positionPrice = control("100,00");
    screen.positionNep = control();
    screen._renderPositions = () => {};
    screen._queueDraftSave = () => Promise.resolve(true);

    screen._updateSelectedPositionFromDetails();
    assert.equal(screen.positions[0].quantity, "2.3456");
    screen.positionQuantity.value = "2,34567";
    screen._updateSelectedPositionFromDetails();
    assert.equal(screen.positions[0].quantity, "2.3456");
    assert.match(screen.message.textContent, /maximal vier Nachkommastellen/);

    const elements = new Map(rechnungContract.rechnungUiEditorContract.slots.map((slot) => [slot.slotId, slot.element]));
    assert.equal(elements.get("rechnung.editor.positionQuantity").fieldKind, "decimal");
    assert.equal(elements.get("rechnung.editor.positionVatRate").fieldKind, "readOnlyText");
    assert.equal(elements.has("rechnung.editor.positionQuantityDecimals.decrease"), false);
    assert.equal(elements.has("rechnung.editor.positionQuantityDecimals.increase"), false);
  });

  await run("Rechnung Positionsliste: Summen reagieren wiederholt korrekt auf NEP und Umsatzsteuer", () => {
    assert.deepEqual(
      [1082500, 205675, 1288175, 33456, -1082500].map(rechnungScreen.formatEuroCents),
      ["10.825,00 €", "2.056,75 €", "12.881,75 €", "334,56 €", "-10.825,00 €"]
    );
    const previousDocument = global.document;
    global.document = { createElement: (tagName) => ({ tagName: String(tagName).toUpperCase(), className: "", children: [], textContent: "", append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = [...children]; } }) };
    try {
      const screen = new rechnung.RechnungScreen();
      screen.positions = [{ id: "a", type: "service", is_title: false, parent_id: null, short_text: "A", long_text: "", quantity: "1", unit: "St", unit_price_cents: 1082500, vat_rate_percent: 19, price_input_mode: "NET", is_nep: false }];
      screen.positionsList = { replaceChildren() {}, append() {} };
      screen.positionsTotal = { textContent: "" };
      screen.invoiceVatLabel = { textContent: "" };
      screen.invoiceVat = { textContent: "" };
      screen.invoiceTotal = { textContent: "" };

      screen._renderLvPositions();
      assert.deepEqual([screen.positionsTotal.textContent, screen.invoiceVatLabel.textContent, screen.invoiceVat.textContent, screen.invoiceTotal.textContent], ["10825,00 EUR", "19 % MwSt.", "2056,75 EUR", "12881,75 EUR"]);
      screen.positions[0].is_nep = true;
      screen._renderLvPositions();
      assert.deepEqual([screen.positionsTotal.textContent, screen.invoiceVat.textContent, screen.invoiceTotal.textContent], ["0,00 EUR", "0,00 EUR", "0,00 EUR"]);
      assert.deepEqual([screen.positions[0].quantity, screen.positions[0].unit_price_cents], ["1", 1082500]);
      screen.positions[0].is_nep = false;
      screen._renderLvPositions();
      assert.deepEqual([screen.positionsTotal.textContent, screen.invoiceVat.textContent, screen.invoiceTotal.textContent], ["10825,00 EUR", "2056,75 EUR", "12881,75 EUR"]);

      screen.positions.push({ id: "b", type: "service", is_title: false, parent_id: null, short_text: "B", long_text: "", quantity: "1", unit: "St", unit_price_cents: 10000, vat_rate_percent: 7, price_input_mode: "NET", is_nep: false });
      screen._renderLvPositions();
      assert.equal(screen.invoiceVatLabel.textContent, "MwSt.");
      assert.deepEqual([screen.positionsTotal.textContent, screen.invoiceVat.textContent, screen.invoiceTotal.textContent], ["10925,00 EUR", "2063,75 EUR", "12988,75 EUR"]);
    } finally {
      global.document = previousDocument;
    }

    const source = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    for (const token of ["this.positionsTotal.textContent", "this.invoiceVatLabel.textContent", "this.invoiceVat.textContent", "this.invoiceTotal.textContent"]) assert.equal(source.includes(token), true, token);
    for (const forbidden of ["editboxNetTotal", "editboxVatTotal", "editboxGrossTotal"]) assert.equal(source.includes(forbidden), false, forbidden);
  });

  await run("Rechnung Preisbedienung: Einzelpreis bleibt direkt editierbar und vorhandene Bruttodaten werden korrekt normalisiert", () => {
    const screen = new rechnung.RechnungScreen();
    const control = (value = "") => ({ value, checked: false, disabled: false });
    screen.current = { status: "DRAFT" };
    screen.source = { value: "FREE" };
    screen.message = { textContent: "", dataset: {} };
    screen.positions = [{ id: "service", type: "service", is_title: false, parent_id: null, short_text: "Leistung", long_text: "", quantity: "1", unit: "St", unit_price_cents: 10000, vat_rate_percent: 19, price_input_mode: "NET", price_input_cents: null, is_nep: false }];
    screen.selectedPositionId = "service";
    screen.positionShort = control("Leistung");
    screen.positionLong = control("");
    screen.positionQuantity = control("1");
    screen.positionUnit = control("St");
    screen.positionPrice = control("125,50");
    screen.positionNep = control();
    screen._renderPositions = () => {};
    screen._queueDraftSave = () => Promise.resolve(true);

    screen._updateSelectedPositionFromDetails();
    assert.deepEqual([screen.positions[0].unit_price_cents, screen.positions[0].price_input_mode, screen.positions[0].price_input_cents], [12550, "NET", null]);

    screen.positions = [{ ...screen.positions[0], unit_price_cents: 10000, price_input_mode: "GROSS", price_input_cents: 11900 }];
    screen.positionPrice.value = "238,00";
    screen._updateSelectedPositionFromDetails();
    assert.deepEqual([screen.positions[0].unit_price_cents, screen.positions[0].price_input_mode, screen.positions[0].price_input_cents], [20000, "GROSS", 23800]);

    const source = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    assert.equal(source.includes("positionPriceGross"), false);
    assert.equal(source.includes("_togglePositionPriceInputMode"), false);
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
    assert.match(css, /\.rechnung-position-details__nep \.invoice-control \{ justify-self: start; \}/);
    assert.match(css, /grid-template-columns: minmax\(0, \.7fr\) auto minmax\(0, 1fr\)/);
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
    assert.match(css, /@media \(min-width: 781px\) \{\s*\.rechnung-sheet__letterhead \{ grid-template-columns: minmax\(0, 1fr\) minmax\(0, \.65fr\); column-gap: 58px; \}/);
    assert.match(css, /\.rechnung-sheet__issuer-address \{ width: fit-content; justify-self: end; text-align: left; \}/);
    assert.match(css, /\.rechnung-sheet__issuer-meta \{ width: fit-content; justify-self: end; \}/);
    assert.match(css, /\.rechnung-sheet__letterhead, \.rechnung-sheet__positions, \.rechnung-lv-list \{ inline-size: 100%; box-sizing: border-box; \}/);
    assert.match(css, /\.rechnung-sheet__issuer-names__line \{ font-weight: 600; \}/);
    assert.match(css, /\.rechnung-sheet__issuer-address, \.rechnung-sheet__issuer-meta-label, \.rechnung-sheet__issuer-meta-colon, \.rechnung-sheet__issuer-meta-value \{ font-weight: 500; \}/);
    assert.equal(rechnungScreen.issuerInformation({ name: "Planungsbüro" }).nameLines.includes("Rechnungssteller"), false);
  });

  await run("Rechnung Positionsdetails: Kurz- und Langtext bleiben direkt am ausgewählten Eintrag bearbeitbar", () => {
    const screen = new rechnung.RechnungScreen();
    const control = (value = "") => ({ value, checked: false, disabled: false });
    screen.current = { status: "DRAFT" };
    screen.source = { value: "FREE" };
    screen.message = { textContent: "", dataset: {} };
    screen.positions = [{ id: "service", type: "service", is_title: false, parent_id: null, short_text: "Fenster", long_text: "Bestand ausbauen", quantity: "1", unit: "St", unit_price_cents: 10000, vat_rate_percent: 19, price_input_mode: "NET", is_nep: false }];
    screen.selectedPositionId = "service";
    screen.positionShort = control("Fenster Nordseite");
    screen.positionLong = control("Bestandsfenster fachgerecht ausbauen.");
    screen.positionQuantity = control("1");
    screen.positionUnit = control("St");
    screen.positionPrice = control("100,00");
    screen.positionNep = control();
    screen._renderPositions = () => {};
    screen._queueDraftSave = () => Promise.resolve(true);

    screen._updateSelectedPositionFromDetails();
    assert.deepEqual([screen.positions[0].short_text, screen.positions[0].long_text], ["Fenster Nordseite", "Bestandsfenster fachgerecht ausbauen."]);
    screen._toggleSelectedLongText();
    assert.equal(screen.hiddenLongTextPositionIds.has("service"), true);
    screen._toggleSelectedLongText();
    assert.equal(screen.hiddenLongTextPositionIds.has("service"), false);
    assert.equal(screen.positions[0].long_text, "Bestandsfenster fachgerecht ausbauen.");
  });

  await run("Rechnung UI: integrierte Positionsdetails bleiben im Rechnungsblattfluss ohne alte Editbox", () => {
    const css = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/styles/rechnungenDesign.css"), "utf8");
    assert.match(css, /\.rechnung-live-editor__body\.rechnung-sheet \{ flex: 1 1 0;[^}]*min-height: 0;/);
    assert.match(css, /\.rechnung-position-toolbar \{ display: flex; flex-wrap: wrap;/);
    assert.match(css, /\.rechnung-position-details \{ display: grid; gap: 10px;/);
    assert.match(css, /\.rechnung-position-details__grid \{ display: grid; grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/);
    assert.match(css, /\.rechnung-position-details\[hidden\] \{ display: none; \}/);
    assert.match(css, /\.rechnung-live-message:empty \{ display: none; padding-block: 0; \}/);
    for (const forbidden of ["rechnung-live-position-editor", "rechnung-screen__edit-area", "rechnung-screen__edit-canvas"]) assert.equal(css.includes(forbidden), false, forbidden);
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
    assert.equal(router.includes("return await openModuleEntry({"), true);
    assert.equal(router.includes('scope: "global"'), true);
    assert.equal(navigation.includes("isRechnungenDesignAvailable"), false);
    assert.equal(navigation.includes("showRechnungenDesign"), false);
  });
  await run("Rechnung Positionshierarchie: Titel, freie Positionen, Verschieben und FROM_ORDER-Sperre folgen dem aktuellen Bedienweg", () => {
    const screen = new rechnung.RechnungScreen();
    const control = (value = "") => ({ value, checked: false, disabled: false });
    screen.current = { status: "DRAFT" };
    screen.source = { value: "FREE" };
    screen.message = { textContent: "", dataset: {} };
    screen.positionShort = control();
    screen.positionLong = control();
    screen.positionQuantity = control("1");
    screen.positionUnit = control("St");
    screen.positionPrice = control("0,00");
    screen.positionNep = control();
    screen._renderPositions = () => {};
    screen._queueDraftSave = () => Promise.resolve(true);

    screen._createTitle();
    const titleId = screen.selectedPositionId;
    screen.positionShort.value = "Fensterarbeiten";
    screen._updateSelectedPositionFromDetails();
    const title = screen.positions.find((entry) => entry.id === titleId);
    assert.deepEqual([title.type, title.is_title, title.parent_id, title.position_number, title.short_text], ["heading", true, null, "1", "Fensterarbeiten"]);

    screen._createPosition();
    const childOneId = screen.selectedPositionId;
    screen.positionShort.value = "Ausbau Fenster";
    screen.positionLong.value = "Bestandsfenster fachgerecht ausbauen.";
    screen.positionQuantity.value = "1";
    screen.positionUnit.value = "St";
    screen.positionPrice.value = "125,00";
    screen._updateSelectedPositionFromDetails();

    screen._createPosition();
    const childTwoId = screen.selectedPositionId;
    screen.positionShort.value = "Lieferung Fenster";
    screen.positionLong.value = "";
    screen.positionQuantity.value = "2";
    screen.positionUnit.value = "St";
    screen.positionPrice.value = "750,00";
    screen._updateSelectedPositionFromDetails();

    const childOne = screen.positions.find((entry) => entry.id === childOneId);
    const childTwo = screen.positions.find((entry) => entry.id === childTwoId);
    assert.deepEqual([childOne.parent_id, childOne.position_number, childTwo.parent_id, childTwo.position_number], [titleId, "1.01", titleId, "1.02"]);
    screen._selectPosition(childTwo);
    screen._togglePositionMove();
    screen._moveSelectedPositionTo(childOne);
    assert.deepEqual(screen._orderedPositions().map((entry) => entry.id), [titleId, childTwoId, childOneId]);
    assert.deepEqual(screen._orderedPositions().map((entry) => entry.position_number), ["1", "1.01", "1.02"]);

    const rootScreen = new rechnung.RechnungScreen();
    rootScreen.current = { status: "DRAFT" };
    rootScreen.source = { value: "FREE" };
    rootScreen.message = { textContent: "", dataset: {} };
    rootScreen._renderPositions = () => {};
    rootScreen._queueDraftSave = () => Promise.resolve(true);
    rootScreen._createPosition();
    rootScreen._createPosition();
    rootScreen._createPosition();
    const rootIds = rootScreen.positions.map((entry) => entry.id);
    rootScreen._createTitle();
    assert.deepEqual(rootScreen.positions.map((entry) => entry.id), rootIds);
    assert.match(rootScreen.message.textContent, /Leistungen ohne Titel/);

    screen.source.value = "FROM_ORDER";
    const beforeFromOrder = screen.positions.map((entry) => entry.id);
    screen._createTitle();
    screen._createPosition();
    screen._togglePositionMove();
    assert.deepEqual(screen.positions.map((entry) => entry.id), beforeFromOrder);
    assert.equal(screen.isPositionMoveMode, false);
  });

  await run("Rechnung Navigation: normaler Arbeitsweg rendert Bauvorhaben, Betreff und integrierte Positionsbedienung", () => {
    const screen = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    const css = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/styles/rechnungenDesign.css"), "utf8");
    for (const token of ["return this._sheetEditor()", "Rechnungsempfänger wählen", 'field("Bauvorhaben"', 'field("Betreff"', "rechnung-lv-list", "rechnung-lv-position", "Summe Netto", "19 % MwSt.", "Summe Brutto", "calculateInvoiceTotalsCents", "rechnung-sheet__letterhead", "rechnung-sheet__issuer-column", "Bitte überweisen Sie den Rechnungsbetrag", "rechnung-action-rail"]) assert.equal(screen.includes(token) || css.includes(token), true, token);
    for (const token of ["rechnung.editor.servicePeriodToggle", "rechnung.editor.positionCreateTitle", "rechnung.editor.positionCreateFree", "rechnung.editor.positionCatalogOpen", "rechnung.editor.positionMove", "rechnung.editor.positionDelete", "rechnung.editor.positionLongToggle", "rechnung.editor.positionDetails"]) assert.equal(screen.includes(token), true, token);
    for (const forbidden of ["rechnung.editor.positionCreate\"", "positionMoveRootButton", "positionQuantityDecimals", "rechnung-live-position-editor"]) assert.equal(screen.includes(forbidden) || css.includes(forbidden), false, forbidden);
    for (const token of ["rechnung-lv-list__pricing-head", "Pos. / Gegenstand", "Menge / Einheit", "formatEuroCents(entry.unit_price_cents)", "rechnung-position-toolbar", "rechnung-position-details", "rechnung-catalog-picker"]) assert.equal(screen.includes(token) || css.includes(token), true, token);
    assert.equal(screen.includes("is-tone-"), false);
    assert.equal(screen.includes("`EP ${money(entry.unit_price_cents)}`"), false);
    assert.equal(screen.includes("`GP ${money(amount)}`"), false);
    assert.match(css, /\.rechnung-lv-position \{[^}]*background: transparent; \}/);
    assert.doesNotMatch(css, /\.rechnung-lv-position \{[^}]*background:\s*#(?:fff|f8fafc)/);
    assert.equal(css.includes("is-tone-"), false);
  });
}

module.exports = { runRechnungNavigationTests };
