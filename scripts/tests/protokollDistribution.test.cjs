"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const Module = require("node:module");
const cp = require("node:child_process");

async function runProtokollDistributionTests(run) {
  const root = path.resolve(__dirname, "../..");
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-protokoll-distribution-test-"));
  const handlers = new Map();
  const fakeApp = { isPackaged: true, getAppPath: () => scratch, getPath: (key) => key === "appData" ? scratch : path.join(scratch, "BBM-Protokoll-Abnahme"), setPath: () => {} };
  fs.writeFileSync(path.join(scratch, "package.json"), JSON.stringify({ distributionId: "protokoll-acceptance", buildChannel: "STABLE", buildFlavor: "release" }));
  const originalLoad = Module._load;
  const replaced = ["src/main/distributionPolicy.js", "src/main/buildIdentity.js", "src/main/moduleRegistry.js", "src/main/ipc/tableLayoutsIpc.js", "src/main/db/tableLayoutsRepo.js", "src/main/db/database.js", "src/main/ui-editor/electronUiEditorSession.js"].map((file) => path.join(root, file));
  const previous = replaced.map((file) => [file, require.cache[file]]);
  replaced.forEach((file) => delete require.cache[file]);
  Module._load = function(request, parent, isMain) { if (request === "electron") return { app: fakeApp, ipcMain: { handle: (channel, listener) => handlers.set(channel, listener) } }; return originalLoad.call(this, request, parent, isMain); };
  try {
    const policyApi = require(path.join(root, "src/main/distributionPolicy"));
    const policy = policyApi.resolveDistributionPolicy({ electronApp: fakeApp });
    await run("Protokoll: trusted packaged scope never widens a license", () => {
      const registry = require(path.join(root, "src/main/moduleRegistry"));
      assert.deepEqual(registry.getModuleIds(), ["protokoll"]);
      assert.deepEqual(registry.resolveActiveModuleIds({ valid: true, license: { modules: ["protokoll", "rechnung", "sigeko", "restarbeiten"] } }), ["protokoll"]);
      assert.deepEqual(registry.resolveActiveModuleIds({ valid: false, license: { modules: ["protokoll"] } }), []);
      assert.deepEqual(registry.resolveActiveModuleIds({ valid: true, license: { modules: ["rechnung"] } }), []);
      assert.equal(registry.getModuleDefinition("rechnung"), null);
      assert.equal(registry.getModuleDefinition("sigeko"), null);
      assert.equal(policy.allowLegacyImport, false);
    });
    await run("Protokoll: source development and ordinary distributions keep existing behavior", () => {
      assert.equal(policyApi.resolveDistributionPolicy({ electronApp: { isPackaged: false }, metadata: { distributionId: policy.id } }).uiEditorEnabled, true);
      assert.equal(policyApi.resolveDistributionPolicy({ electronApp: fakeApp, metadata: {} }).moduleIds, null);
    });
    await run("Kunde: eigenes leeres Profil bleibt bei Updates erhalten und getrennt von DEV/Abnahme", () => {
      const customerProfileId = "c-0123456789abcdef01234567";
      const customerPolicy = policyApi.resolveDistributionPolicy({
        electronApp: fakeApp,
        metadata: { distributionId: "customer", customerProfileId },
      });
      assert.equal(customerPolicy.id, "customer");
      assert.equal(customerPolicy.moduleIds, null);
      assert.equal(customerPolicy.uiEditorEnabled, false);
      assert.equal(customerPolicy.allowLegacyImport, false);
      assert.notEqual(customerPolicy.userDataDirectory, policyApi.PROTOKOLL_USER_DATA_DIRECTORY);
      const configured = new Map();
      const customerApp = { ...fakeApp, setPath: (key, value) => configured.set(key, value) };
      policyApi.configureDistributionProfile({ electronApp: customerApp, policy: customerPolicy });
      const customerRoot = path.join(scratch, "BBM-Kunden", customerProfileId);
      assert.equal(configured.get("userData"), customerRoot);
      assert.equal(fs.existsSync(path.join(customerRoot, "app.db")), false);
      assert.equal(fs.existsSync(path.join(customerRoot, "license.json")), false);
      fs.writeFileSync(path.join(customerRoot, "app.db"), "existing customer database");
      fs.writeFileSync(path.join(customerRoot, "license.json"), "existing customer license");
      policyApi.configureDistributionProfile({ electronApp: customerApp, policy: customerPolicy });
      assert.equal(fs.readFileSync(path.join(customerRoot, "app.db"), "utf8"), "existing customer database");
      assert.equal(fs.readFileSync(path.join(customerRoot, "license.json"), "utf8"), "existing customer license");
      assert.throws(
        () => policyApi.resolveDistributionPolicy({ electronApp: fakeApp, metadata: { distributionId: "customer", customerProfileId: "../../shared" } }),
        /Invalid customer distribution profile metadata/
      );
    });
    await run("Kunde mit Protokolllizenz: vier Seitenraender bleiben ohne UI-Editor in Ausgabe und Druck erreichbar", () => {
      const settingsSource = fs.readFileSync(path.join(root, "src/renderer/views/SettingsView.js"), "utf8");
      const preloadSource = fs.readFileSync(path.join(root, "src/main/preload.js"), "utf8");
      assert.match(settingsSource, /tiles: \[tileOutputPrint, tileFirmRoles, tileArchive\]/);
      assert.match(settingsSource, /const layoutFields = \[[\s\S]*pagePadTopMm[\s\S]*pagePadLeftMm[\s\S]*pagePadRightMm[\s\S]*pagePadBottomMm[\s\S]*\];/);
      assert.match(settingsSource, /const layoutValues = isStructuralEditingEnabled\(\) \? \{[\s\S]*footerReserveMm[\s\S]*\} : \{\};/);
      assert.match(settingsSource, /protocolPdfGetPageMargins/);
      assert.match(settingsSource, /protocolPdfSetPageMargins\(pageMargins\)/);
      assert.match(preloadSource, /protocolPdfGetPageMargins/);
      assert.match(preloadSource, /protocolPdfSetPageMargins/);
    });
    await run("Protokoll: distinct app/session paths and reproducible whitelisted layouts", () => {
      const configured = new Map();
      policyApi.configureDistributionProfile({ electronApp: { ...fakeApp, setPath: (key, value) => configured.set(key, value) }, policy });
      assert.equal(configured.get("userData"), path.join(scratch, "BBM-Protokoll-Abnahme"));
      assert.equal(configured.get("sessionData"), path.join(scratch, "BBM-Protokoll-Abnahme/session-data"));
      const result = policyApi.seedDistributionLayouts({ electronApp: fakeApp, policy, resourcesPath: path.join(root, "resources") });
      assert.equal(result.seeded.length, 2);
      const file = path.join(fakeApp.getPath("userData"), "ui-editor/profiles/module-protokoll/standard.layout-profile.json");
      assert.deepEqual(fs.readFileSync(file), fs.readFileSync(path.join(root, "resources/protokoll-layouts/module-protokoll/standard.layout-profile.json")));
      fs.writeFileSync(file, "existing own-profile data");
      assert.equal(policyApi.seedDistributionLayouts({ electronApp: fakeApp, policy, resourcesPath: path.join(root, "resources") }).seeded.length, 0);
      assert.equal(fs.readFileSync(file, "utf8"), "existing own-profile data");
    });
    await run("Protokoll: delivery corruption cannot partially seed profiles", () => {
      const resources = path.join(scratch, "corrupt-resources");
      fs.cpSync(path.join(root, "resources/protokoll-layouts"), path.join(resources, "protokoll-layouts"), { recursive: true });
      fs.appendFileSync(path.join(resources, "protokoll-layouts/render-defaults.json"), " ");
      const target = path.join(scratch, "corrupt-target");
      assert.throws(() => policyApi.seedDistributionLayouts({ electronApp: { getPath: () => target }, policy, resourcesPath: resources }), /Invalid delivery layout hash/);
      assert.equal(fs.existsSync(target), false);
    });
    await run("Protokoll: reviewed table/print defaults seed once through existing validation", async () => {
      const database = require(path.join(root, "src/main/db/database"));
      database.configureDatabaseMigrations({ valid: true, license: { modules: ["protokoll"] } }, { allowLegacyImport: false });
      const first = await policyApi.seedDistributionRenderDefaults({ electronApp: fakeApp, policy, resourcesPath: path.join(root, "resources") });
      assert.equal(first.seededTables.length, 4);
      const db = database.initDatabase();
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM projects").get().count, 0);
      const defaults = JSON.parse(fs.readFileSync(path.join(root, "resources/protokoll-layouts/render-defaults.json"), "utf8"));
      for (const [key, value] of Object.entries(defaults.printLayoutSettings)) assert.equal(db.prepare("SELECT value FROM app_settings WHERE key=?").get(key).value, value);
      const rowsBefore = db.prepare("SELECT * FROM table_layouts ORDER BY table_key,orientation").all();
      assert.equal((await policyApi.seedDistributionRenderDefaults({ electronApp: fakeApp, policy, resourcesPath: path.join(root, "resources") })).seededTables.length, 0);
      assert.deepEqual(db.prepare("SELECT * FROM table_layouts ORDER BY table_key,orientation").all(), rowsBefore);
      db.close();
    });
    await run("Protokoll: native and PDF editor IPC denied; noninteractive startup restore retained", async () => {
      const { ElectronUiEditorSessionController } = require(path.join(root, "src/main/ui-editor/electronUiEditorSession"));
      const controller = new ElectronUiEditorSessionController({ app: fakeApp, ipcMain: { handle: (channel, listener) => handlers.set(channel, listener) }, getMainWindow: () => null, editingEnabled: false, spawnProcess: () => { throw Error("Must never launch an editor"); } });
      controller.registerIpc();
      for (const channel of ["uiEditor:open", "uiEditor:close", "uiEditor:getStatus", "uiEditor:respond", "uiEditor:targetEvent", "uiEditor:preparePdfContext", "uiEditor:getPdfDocumentTypeStatus", "uiEditor:registerPdfDocumentType"]) assert.equal((await handlers.get(channel)(null, {})).code, "UI_EDITOR_DISABLED_IN_DISTRIBUTION");
      assert.equal((await controller.open({})).code, "UI_EDITOR_DISABLED_IN_DISTRIBUTION");
      const restore = handlers.get("uiEditor:loadStartupLayout")(null, {});
      assert.notEqual(restore.code, "UI_EDITOR_DISABLED_IN_DISTRIBUTION");
      assert.equal(restore.editorProcessRequired, false);
      assert.equal(typeof handlers.get("uiEditor:completeStartupLayout"), "function");
      require(path.join(root, "src/main/ipc/tableLayoutsIpc")).registerTableLayoutsIpc();
      for (const channel of ["tableLayouts:save", "tableLayouts:reset"]) assert.equal((await handlers.get(channel)(null, {})).code, "UI_EDITOR_DISABLED_IN_DISTRIBUTION");
      assert.equal(typeof handlers.get("tableLayouts:getOne"), "function");
    });
    await run("Protokoll: renderer catalog cannot activate excluded routes", async () => {
      const oldWindow = globalThis.window;
      globalThis.window = { bbmDistribution: { moduleIds: ["protokoll"], uiEditorEnabled: false } };
      try {
        const catalog = await require("./_esmLoader.cjs").importEsmFromFile(path.join(root, "src/renderer/app/modules/moduleCatalog.js"));
        assert.deepEqual(catalog.getActiveModuleIds(), ["protokoll"]);
        assert.deepEqual(catalog.getDerivedActiveModuleIds(["protokoll", "rechnung", "sigeko", "restarbeiten"]), ["protokoll"]);
        assert.equal(catalog.findActiveModuleEntry("rechnung"), null);
        assert.equal(catalog.findActiveModuleEntry("sigeko"), null);
        const router = await require("./_esmLoader.cjs").importEsmFromFile(path.join(root, "src/renderer/app/Router.js"));
        const forbidden = { show() { throw new Error("A structural editor screen must never be built"); } };
        assert.equal((await router.default.prototype.showUiEditor.call(forbidden)).reason, "UI_EDITOR_DISABLED_IN_DISTRIBUTION");
        assert.equal((await router.default.prototype.showBbmUiEditorDemo.call(forbidden)).reason, "UI_EDITOR_DISABLED_IN_DISTRIBUTION");
      } finally { globalThis.window = oldWindow; }
    });
  } finally {
    Module._load = originalLoad;
    for (const [file, entry] of previous) { if (entry) require.cache[file] = entry; else delete require.cache[file]; }
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

if (require.main === module) {
  if (!process.versions.electron) process.exitCode = cp.spawnSync(require("electron"), [__filename], { env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }, stdio: "inherit", windowsHide: true }).status ?? 1;
  else {
    let failures = 0, count = 0;
    runProtokollDistributionTests(async (name, test) => { count++; try { await test(); console.log(`PASS ${name}`); } catch (error) { failures++; console.error(`FAIL ${name}\n${error.stack}`); } }).then(() => { console.log(`${count - failures}/${count} passed`); process.exitCode = failures ? 1 : 0; }).catch((error) => { console.error(error); process.exitCode = 1; });
  }
}
module.exports = { runProtokollDistributionTests };
