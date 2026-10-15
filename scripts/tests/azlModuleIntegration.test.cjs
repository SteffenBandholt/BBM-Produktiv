const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");

test("azL ist als kanonisches Projektmodul registriert", () => {
  const registry = JSON.parse(
    fs.readFileSync(path.join(ROOT, "src", "main", "module-registry.json"), "utf8")
  );

  assert.ok(registry.canonicalModuleIds.includes("azl"));
  assert.equal(registry.modules.azl.kind, "project");
  assert.equal(registry.modules.azl.licenseKey, "module:azl");
  assert.equal(registry.modules.azl.ipcRegistrar, "azl");
  assert.equal(registry.modules.azl.migrationRegistrar, "azl");
  assert.deepEqual(
    registry.modules.azl.requiredCapabilities,
    ["pdf", "export", "file-storage", "ui-editor"]
  );
});

test("BBM bindet BBM-azL als Schwesterpaket ein", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  assert.equal(pkg.dependencies["bbm-azl"], "file:../BBM-azL");
});

test("azL Hostadapter und Rendereradapter sind vorhanden", () => {
  for (const relative of [
    "src/main/modules/azl/registerIpc.js",
    "src/main/modules/azl/registerMigrations.js",
    "src/main/ipc/azlIpc.js",
    "src/renderer/modules/azl/index.js",
    "src/renderer/modules/azl/AzlHostScreen.js",
  ]) {
    assert.equal(fs.existsSync(path.join(ROOT, relative)), true, relative);
  }
});

test("Modulkatalog enthält azL", () => {
  const source = fs.readFileSync(
    path.join(ROOT, "src", "renderer", "app", "modules", "moduleCatalog.js"),
    "utf8"
  );
  assert.match(source, /getAzlModuleEntry/);
  assert.match(source, /AZL_MODULE_ID/);
});
