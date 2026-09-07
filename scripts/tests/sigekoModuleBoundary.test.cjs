const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Database = require("better-sqlite3");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const root = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const status = (modules, valid = true) => ({ valid, license: { modules } });

function register(initialStatus) {
  const { registerActiveModuleIpcs } = require("../../src/main/moduleIpcRegistry");
  const handlers = new Map();
  let current = initialStatus;
  const result = registerActiveModuleIpcs({
    licenseStatus: current,
    getLicenseStatus: () => current,
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    registrars: require("../../src/main/moduleIpcRegistrars"),
  });
  return { result, handlers, setStatus: (next) => { current = next; } };
}

async function runSigekoModuleBoundaryTests(run) {
  await run("S1.1: Main und Renderer deklarieren denselben kanonischen Projektmodulvertrag", async () => {
    const registry = require("../../src/main/moduleRegistry");
    const { getSigekoModuleEntry } = await importEsmFromFile(path.join(root, "src/renderer/modules/sigeko/index.js"));
    const main = registry.getModuleDefinition("sigeko");
    const renderer = getSigekoModuleEntry();
    assert.equal(main.kind, "project");
    assert.equal(renderer.moduleId, "sigeko");
    assert.equal(renderer.moduleLabel, "SiGeKo");
    assert.equal(renderer.moduleType, main.kind);
    for (const key of ["licenseKey", "ipcRegistrar", "migrationRegistrar", "requiredCapabilities"]) {
      assert.deepEqual(renderer[key], main[key]);
    }
    assert.equal(main.licenseKey, "module:sigeko");
    for (const capability of main.requiredCapabilities) {
      assert.equal(registry.getCapabilityLicenseKey(capability), `service:${capability}`);
    }
    assert.ok(Object.isFrozen(renderer));
    assert.equal(typeof renderer.screens.sigeko, "function");
    assert.deepEqual(renderer.routes.project, [{ screenId: "sigeko" }]);
    assert.equal(renderer.navigation.project[0].moduleId, "sigeko");
  });

  await run("S1.1: Katalog kennt SiGeKo mit S1.2-Einstieg ohne neue Routerroute", async () => {
    const catalog = read("src/renderer/app/modules/moduleCatalog.js");
    assert.match(catalog, /getSigekoModuleEntry[\s\S]*from "\.\.\/\.\.\/modules\/sigeko\/index.js"/);
    assert.match(catalog, /moduleId: SIGEKO_MODULE_ID,\s*entry: getSigekoModuleEntry\(\)/);
    const defaults = catalog.split("const DEFAULT_ACTIVE_MODULE_IDS = Object.freeze([")[1].split("]);", 1)[0];
    assert.match(defaults, /SIGEKO_MODULE_ID/);
    const { getSigekoModuleEntry } = await importEsmFromFile(path.join(root, "src/renderer/modules/sigeko/index.js"));
    const runtime = await importEsmFromFile(path.join(root, "src/renderer/app/modules/moduleRouteRuntime.js"));
    assert.equal(await runtime.openModuleEntry({ moduleEntry: getSigekoModuleEntry(), scope: "project", projectId: "p", show(view) { assert.equal(view.projectId, "p"); } }), true);
  });

  await run("S1.1: produktiver IPC-Registrar erreicht SiGeKo-Service ohne Protokoll", () => {
    const harness = register(status(["sigeko"]));
    assert.deepEqual(harness.result.registeredModuleIds, ["sigeko"]);
    assert.deepEqual([...harness.handlers.keys()], ["sigeko:getStoragePaths", "sigeko:ensureStorageDirectories", "sigeko:openStorageDirectory", "sigeko:getModuleInfo"]);
    assert.deepEqual(harness.handlers.get("sigeko:getModuleInfo")({}), {
      ok: true, module: { moduleId: "sigeko", moduleType: "project" },
    });
  });

  await run("S1.1: IPC delegiert ausschliesslich die technische Operation an den Service", () => {
    const { registerSigekoIpc } = require("../../src/main/ipc/sigekoIpc");
    let calls = 0;
    let handler;
    registerSigekoIpc({
      ipcMain: { handle: (_channel, fn) => { handler = fn; } },
      service: { getModuleInfo() { calls += 1; return { marker: "service" }; } },
    });
    assert.deepEqual(handler({}, { operation: "createProject", sql: "ignored" }), { ok: true, module: { marker: "service" } });
    assert.equal(calls, 1);
  });

  await run("S1.1: Core-only, ungueltige Lizenz und fehlende Modulfreigabe registrieren keinen SiGeKo-IPC", () => {
    for (const license of [status([]), status(["sigeko"], false), null, status(["unknown"])]) {
      const harness = register(license);
      assert.deepEqual(harness.result.registeredModuleIds, []);
      assert.equal(harness.handlers.size, 0);
    }
  });

  await run("S1.1: Freigabeentzug und Lizenzverlust sperren bereits registrierten Handler", () => {
    const harness = register(status(["sigeko"]));
    const call = () => harness.handlers.get("sigeko:getModuleInfo")({});
    assert.equal(call().ok, true);
    for (const revoked of [status([]), status(["protokoll"]), status(["sigeko"], false), null]) {
      harness.setStatus(revoked);
      assert.throws(call, { code: "MODULE_NOT_ACTIVE", message: "MODULE_NOT_ACTIVE:sigeko" });
    }
    harness.setStatus(status(["sigeko"]));
    assert.equal(call().ok, true);
  });

  await run("S1.1: echter Preload-Aufruf durchlaeuft modularen Guard und Service", async () => {
    const harness = register(status(["sigeko"]));
    const exposed = {};
    vm.runInNewContext(read("src/main/preload.js"), {
      require(name) {
        assert.equal(name, "electron");
        return {
          contextBridge: { exposeInMainWorld: (name, api) => { exposed[name] = api; } },
          ipcRenderer: { invoke: async (channel, ...args) => harness.handlers.get(channel)({}, ...args) },
        };
      },
    });
    assert.deepEqual(Object.keys(exposed.bbmDb).filter((key) => key.startsWith("sigeko")), ["sigekoGetStoragePaths", "sigekoEnsureStorageDirectories", "sigekoOpenStorageDirectory", "sigekoGetModuleInfo"]);
    assert.deepEqual(await exposed.bbmDb.sigekoGetModuleInfo(), { ok: true, module: { moduleId: "sigeko", moduleType: "project" } });
    harness.setStatus(status([]));
    await assert.rejects(exposed.bbmDb.sigekoGetModuleInfo(), { code: "MODULE_NOT_ACTIVE" });
  });

  await run("S1.1: Migrationsregistrar ist auf Bestands-DB strikt schema- und daten-neutral", () => {
    const db = new Database(":memory:");
    try {
      db.exec("CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL); INSERT INTO projects VALUES ('p1', 'Bestand');");
      const { ensureSchema } = require("../../src/main/db/database");
      ensureSchema(db, { moduleIds: [] });
      const schema = () => db.prepare("SELECT type, name, sql FROM sqlite_master ORDER BY type, name").all();
      const before = schema();
      assert.deepEqual(ensureSchema(db, { moduleIds: ["sigeko"] }), ["sigeko"]);
      assert.deepEqual(ensureSchema(db, { moduleIds: ["sigeko", "sigeko"] }), ["sigeko"]);
      assert.deepEqual(schema(), before);
      assert.equal(db.prepare("SELECT name FROM projects WHERE id = 'p1'").get().name, "Bestand");
      for (const table of ["meetings", "tops", "invoices", "restarbeiten_items", "sigeko_projects"]) {
        assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name = ?").get(table), undefined);
      }
    } finally { db.close(); }
  });

  await run("S1.1: gemeinsame Migration bleibt mit SiGeKo und Restarbeiten ohne Protokoll nutzbar", () => {
    const db = new Database(":memory:");
    try {
      db.exec("CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL)");
      const { ensureSchema } = require("../../src/main/db/database");
      assert.deepEqual(ensureSchema(db, { moduleIds: ["sigeko", "restarbeiten"] }), ["sigeko", "restarbeiten"]);
      assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name = 'restarbeiten_items'").get());
      assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name = 'meetings'").get(), undefined);
    } finally { db.close(); }
  });

  await run("S1.1: technische Grenze enthaelt weder Fachdaten noch fremde Fachimporte", () => {
    for (const file of [
      "src/main/domain/sigeko/SigekoService.js",
      "src/main/ipc/sigekoIpc.js",
      "src/main/modules/sigeko/registerIpc.js",
      "src/main/modules/sigeko/registerMigrations.js",
      "src/renderer/modules/sigeko/index.js",
    ]) {
      assert.doesNotMatch(read(file), /(?:require\(|from\s*)["'][^"']*(?:protokoll|\/tops|rechnung|restarbeiten|\/db\/|sqlite)/i);
      assert.doesNotMatch(read(file), /CREATE TABLE|ALTER TABLE|requireFeature|enforceLicensedFeature|new Database/);
    }
    const { createSigekoService } = require("../../src/main/domain/sigeko/SigekoService");
    const service = createSigekoService();
    assert.deepEqual(Object.keys(service), ["getStoragePaths", "ensureStorageDirectories", "openStorageDirectory", "getModuleInfo"]);
    assert.ok(Object.isFrozen(service));
    assert.ok(Object.isFrozen(service.getModuleInfo()));
  });
}

module.exports = { runSigekoModuleBoundaryTests };
