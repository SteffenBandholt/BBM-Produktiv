const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRechnungNavigationTests(run) {
  const root = process.cwd();
  const modules = await importEsmFromFile(path.join(root, "src/renderer/app/modules/index.js"));
  const rechnung = await importEsmFromFile(path.join(root, "src/renderer/modules/rechnungen/index.js"));
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
      screen.serviceFields = { SINGLE_DATE: {}, MONTH: {}, RANGE_START: {}, RANGE_END: {} }; screen.title = { textContent: "" }; screen.customerAddress = { textContent: "" }; screen.issuerAddress = { textContent: "" };
      screen._renderPositions = () => {}; screen._clearPositionEditor = () => {}; screen._setBooked = () => {};

      screen._renderList();
      screen.list.children[0].children[2].onclick();

      assert.equal(screen.overview.hidden, true);
      assert.equal(screen.editor.hidden, false);
      assert.equal(screen.invoiceDate.value, "2026-08-17");
      assert.equal(screen.paymentTerm.value, "14");
      assert.equal(screen.dueDate.value, "2026-08-31");
      assert.match(screen.issuerAddress.textContent, /Eigene Unternehmensdaten unvollst.ndig/);

      screen._close();
      assert.equal(screen.overview.hidden, false);
      assert.equal(screen.editor.hidden, true);
    } finally {
      global.document = previousDocument;
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
}

module.exports = { runRechnungNavigationTests };
