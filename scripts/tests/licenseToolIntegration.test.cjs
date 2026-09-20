const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = process.cwd();
const {
  SOURCE_ROLE,
  CONTRACT_VERSION,
  SOURCE_SETTING_KEYS,
  START_CONTEXT_SWITCH,
  createLicenseToolIntegration,
} = require(path.join(ROOT, "src/main/integrations/licenseToolIntegration.js"));
const { registerLicenseToolIntegrationIpc } = require(path.join(ROOT, "src/main/ipc/licenseToolIntegrationIpc.js"));

function decodeStartContext(argument) {
  assert.equal(argument.startsWith(START_CONTEXT_SWITCH), true);
  return JSON.parse(Buffer.from(argument.slice(START_CONTEXT_SWITCH.length), "base64url").toString("utf8"));
}

function makeFixture({ allowed = true, acceptance = false, distributionId = "full", toolReady = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-license-tool-integration-"));
  const databasePath = path.join(root, "development.db");
  const toolRoot = path.join(root, "license-tool");
  const executableName = process.platform === "win32" ? "electron.exe" : "electron";
  const electronPath = path.join(toolRoot, "node_modules", "electron", "dist", executableName);
  fs.writeFileSync(databasePath, "isolated test database", "utf8");
  if (toolReady) {
    fs.mkdirSync(path.dirname(electronPath), { recursive: true });
    fs.writeFileSync(path.join(toolRoot, "package.json"), JSON.stringify({ name: "bbm-license-tool" }), "utf8");
    fs.writeFileSync(path.join(toolRoot, "main.js"), "// fixture", "utf8");
    fs.writeFileSync(electronPath, "fixture", "utf8");
  }

  const settings = new Map();
  const settingsWrites = [];
  const launches = [];
  const spawnProcess = (file, args, options) => {
    launches.push({ file, args, options });
    const child = new EventEmitter();
    child.unref = () => { child.unrefCalled = true; };
    queueMicrotask(() => child.emit("spawn"));
    return child;
  };
  const integration = createLicenseToolIntegration({
    electronApp: { isPackaged: !allowed },
    distributionPolicy: { id: distributionId },
    acceptanceProfile: { enabled: acceptance },
    buildIdentityResolver: () => ({ source: "development-source" }),
    dbPathsProvider: () => ({ activeDbPath: databasePath }),
    dbProvider: () => ({ fixture: true }),
    settingsGetMany: (_db, keys) => Object.fromEntries(keys.map((key) => [key, settings.get(key) || ""])),
    settingsSetMany: (_db, patch) => {
      settingsWrites.push({ ...patch });
      for (const [key, value] of Object.entries(patch)) settings.set(key, value);
    },
    firmDirectory: { listCustomers: () => [{ id: "customer-a" }, { id: "customer-b" }] },
    spawnProcess,
    environment: { SAFE_VALUE: "kept", ELECTRON_RUN_AS_NODE: "1", BBM_UI_EDITOR_ACCEPTANCE_MODE: "1" },
    licenseToolRoot: toolRoot,
  });
  return { root, databasePath, toolRoot, electronPath, settings, settingsWrites, launches, integration };
}

async function runLicenseToolIntegrationTests(run) {
  await run("Lizenztool-Anbindung: Status prüft den Quellstand ohne Datenbankregistrierung", () => {
    const fixture = makeFixture();
    try {
      assert.deepEqual(fixture.integration.status(), { ok: true, allowed: true, sourceReady: true, sourcePath: fs.realpathSync.native(fixture.toolRoot) });
      assert.equal(fixture.settingsWrites.length, 0);
    } finally { fs.rmSync(fixture.root, { recursive: true, force: true }); }
  });

  await run("Lizenztool-Anbindung: fehlende Quellabhängigkeiten liefern konkreten Einrichtungsschritt", () => {
    const fixture = makeFixture({ toolReady: false });
    try {
      const status = fixture.integration.status();
      assert.equal(status.allowed, true);
      assert.equal(status.sourceReady, false);
      assert.match(status.message, /npm install/);
    } finally { fs.rmSync(fixture.root, { recursive: true, force: true }); }
  });

  await run("Lizenztool-Anbindung: DEV-Start nutzt Electron aus dem aktuellen Quellstand und übergibt nur validierten Kontext", async () => {
    const fixture = makeFixture();
    try {
      const first = await fixture.integration.launch({ customerId: "customer-b" });
      assert.equal(first.ok, true);
      assert.equal(fixture.launches.length, 1);
      const launched = fixture.launches[0];
      assert.equal(launched.file, fs.realpathSync.native(fixture.electronPath));
      assert.equal(launched.args[0], fs.realpathSync.native(fixture.toolRoot));
      assert.equal(launched.options.cwd, fs.realpathSync.native(fixture.toolRoot));
      assert.equal(launched.options.shell, false);
      assert.equal(launched.options.detached, true);
      assert.equal(launched.options.env.SAFE_VALUE, "kept");
      assert.equal(launched.options.env.ELECTRON_RUN_AS_NODE, undefined);
      assert.equal(path.basename(launched.options.env.BBM_LICENSE_TOOL_BBM_ROOT), "BBM-Produktiv");

      const context = decodeStartContext(launched.args[1]);
      assert.deepEqual(Object.keys(context).sort(), ["contractVersion", "customerId", "databasePath", "sourceId", "sourceRole"]);
      assert.equal(context.customerId, "customer-b");
      assert.equal(context.sourceRole, SOURCE_ROLE);
      assert.equal(context.contractVersion, CONTRACT_VERSION);
      assert.equal(fixture.settingsWrites.length, 1);

      await fixture.integration.launch({ customerId: "not-a-customer" });
      const second = decodeStartContext(fixture.launches[1].args[1]);
      assert.equal(second.sourceId, context.sourceId);
      assert.equal(second.customerId, "");
      assert.equal(fixture.settingsWrites.length, 1);
    } finally { fs.rmSync(fixture.root, { recursive: true, force: true }); }
  });

  await run("Lizenztool-Anbindung: fremde Quellenrolle wird nicht überschrieben", () => {
    const fixture = makeFixture();
    try {
      fixture.settings.set(SOURCE_SETTING_KEYS.sourceId, "d6be729b-7e7d-4955-a7d2-adb53bef44c8");
      fixture.settings.set(SOURCE_SETTING_KEYS.sourceRole, "customer-installation");
      fixture.settings.set(SOURCE_SETTING_KEYS.contractVersion, String(CONTRACT_VERSION));
      assert.throws(() => fixture.integration.ensureSourceRegistration(), (error) => error.code === "SOURCE_ROLE_CONFLICT");
      assert.equal(fixture.settingsWrites.length, 0);
    } finally { fs.rmSync(fixture.root, { recursive: true, force: true }); }
  });

  await run("Lizenztool-Anbindung: Paket-, Annahme- und Kundendistribution bleiben gesperrt", () => {
    const fixtures = [makeFixture({ allowed: false }), makeFixture({ acceptance: true }), makeFixture({ distributionId: "customer" })];
    try {
      for (const fixture of fixtures) {
        assert.deepEqual(fixture.integration.status(), { ok: true, allowed: false, sourceReady: false });
        assert.throws(() => fixture.integration.ensureSourceRegistration(), (error) => error.code === "LICENSE_TOOL_DEV_ONLY");
      }
    } finally { for (const fixture of fixtures) fs.rmSync(fixture.root, { recursive: true, force: true }); }
  });

  await run("Lizenztool-Anbindung: IPC bietet nur Status und Quellstart", async () => {
    const handlers = new Map();
    const launches = [];
    const ipcMain = { handle: (channel, handler) => handlers.set(channel, handler) };
    const integration = { status: () => ({ ok: true, allowed: true }), launch: async (payload) => { launches.push(payload); return { ok: true }; } };
    registerLicenseToolIntegrationIpc({ ipcMain, integration });
    assert.deepEqual([...handlers.keys()].sort(), ["dev:licenseToolLaunch", "dev:licenseToolStatus"]);
    await handlers.get("dev:licenseToolLaunch")(null, { customerId: " customer-a ", executablePath: "C:/injected.exe" });
    assert.deepEqual(launches, [{ customerId: "customer-a" }]);
  });

  await run("Lizenztool-Anbindung: sichtbarer Einstieg liegt ausschließlich in Einstellungen", () => {
    const settingsView = fs.readFileSync(path.join(ROOT, "src/renderer/views/SettingsView.js"), "utf8");
    const firmsView = fs.readFileSync(path.join(ROOT, "src/renderer/views/FirmsUsageCompactView.js"), "utf8");
    const preload = fs.readFileSync(path.join(ROOT, "src/main/preload.js"), "utf8");
    assert.match(settingsView, /titleText: "Lizenztool"/);
    assert.match(settingsView, /Tool starten/);
    assert.match(settingsView, /status\?\.allowed/);
    assert.doesNotMatch(firmsView, /Lizenztool öffnen/);
    assert.doesNotMatch(settingsView, /data-ui-inspector-id|data-ui-editor-kind/);
    assert.match(preload, /devLicenseToolLaunch/);
    assert.doesNotMatch(preload, /devLicenseToolConfigureExecutable/);
  });
}

module.exports = { runLicenseToolIntegrationTests };
