const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  ACCEPTANCE_SWITCH,
  DEVELOPMENT_BUILD_CHANNEL,
  DEVELOPMENT_BUILD_FLAVOR,
  DEVELOPMENT_LICENSE_PROVIDER_ID,
  configureUiEditorAcceptanceProfile,
} = require("../../src/main/startup/uiEditorAcceptanceProfile");
const {
  REMOVED_ENV_KEYS,
  createSanitizedEnvironment,
  createAcceptanceProfile,
  buildElectronArguments,
  hashFileOrMissing,
  removeAcceptanceProfile,
} = require("../runIsolatedUiEditorAcceptance.cjs");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex").toUpperCase();
}

async function runUiEditorAcceptanceIsolationTests(run) {
  await run("M82.7.3 Isolation: normaler Start aendert ohne expliziten Schalter keinen Electron-Pfad", () => {
    const calls = [];
    const result = configureUiEditorAcceptanceProfile({
      electronApp: { isPackaged: false, setPath: (...args) => calls.push(args) },
      argv: ["electron", "."],
    });
    assert.deepEqual(result, { enabled: false });
    assert.deepEqual(calls, []);
  });

  await run("M82.7.3 Isolation: Abnahme setzt userData und sessionData ausschliesslich auf das Temp-Profil", () => {
    const profile = createAcceptanceProfile();
    const calls = [];
    try {
      const result = configureUiEditorAcceptanceProfile({
        electronApp: { isPackaged: false, setPath: (...args) => calls.push(args) },
        argv: ["electron", ".", `${ACCEPTANCE_SWITCH}${profile.rootPath}`],
      });
      assert.equal(result.enabled, true);
      assert.deepEqual(calls, [
        ["userData", profile.userDataPath],
        ["sessionData", profile.sessionDataPath],
      ]);
      assert.equal(result.marker.buildChannel, DEVELOPMENT_BUILD_CHANNEL);
      assert.equal(result.marker.buildFlavor, DEVELOPMENT_BUILD_FLAVOR);
      assert.equal(result.marker.developmentLicenseProvider, DEVELOPMENT_LICENSE_PROVIDER_ID);
    } finally {
      removeAcceptanceProfile(profile.rootPath);
    }
  });

  await run("M82.7.3 Isolation: paketierter Release-Build lehnt den Abnahmeschalter ab", () => {
    const profile = createAcceptanceProfile();
    try {
      assert.throws(() => configureUiEditorAcceptanceProfile({
        electronApp: { isPackaged: true, setPath: () => assert.fail("setPath darf nicht laufen") },
        argv: ["BBM.exe", `${ACCEPTANCE_SWITCH}${profile.rootPath}`],
      }), /UI_EDITOR_ACCEPTANCE_REQUIRES_SOURCE_BUILD/);
    } finally {
      removeAcceptanceProfile(profile.rootPath);
    }
  });

  await run("M82.7.3 Isolation: freie Umgebungsvariablen werden nicht als Development-Unlock weitergereicht", () => {
    const source = Object.fromEntries(REMOVED_ENV_KEYS.map((key) => [key, "1"]));
    source.PATH = "sentinel";
    const sanitized = createSanitizedEnvironment(source);
    assert.equal(sanitized.PATH, "sentinel");
    for (const key of REMOVED_ENV_KEYS) assert.equal(Object.hasOwn(sanitized, key), false, key);
  });

  await run("M82.7.3 Isolation: Startargumente aktivieren Diagnose ohne vorzeitigen Editorstart", () => {
    const args = buildElectronArguments({ repoRoot: "C:\\repo", profileRoot: "C:\\temp\\profile" });
    assert.equal(args[0], "C:\\repo");
    assert.equal(args.includes("--bbm-electron-editor-diagnostic"), true);
    assert.equal(args.includes("--open-ui-editor"), false);
    assert.equal(args.some((arg) => arg === `${ACCEPTANCE_SWITCH}C:\\temp\\profile`), true);
  });

  await run("M82.7.3 Isolation: Sentinel-Benutzerdateien bleiben bei isoliertem DB-Schreiben bytegleich", () => {
    const sentinelRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-ui-editor-sentinel-"));
    const profile = createAcceptanceProfile();
    const realDbSentinel = path.join(sentinelRoot, "app.db");
    const realLicenseSentinel = path.join(sentinelRoot, "license.json");
    try {
      fs.writeFileSync(realDbSentinel, "REAL-DB-SENTINEL", "utf8");
      fs.writeFileSync(realLicenseSentinel, "REAL-LICENSE-SENTINEL", "utf8");
      const beforeDb = hashFileOrMissing(realDbSentinel);
      const beforeLicense = hashFileOrMissing(realLicenseSentinel);
      fs.writeFileSync(path.join(profile.userDataPath, "app.db"), "ISOLATED-TEST-DB", "utf8");
      assert.equal(hashFileOrMissing(realDbSentinel), beforeDb);
      assert.equal(hashFileOrMissing(realLicenseSentinel), beforeLicense);
      assert.equal(hashFileOrMissing(path.join(profile.userDataPath, "app.db")), sha256("ISOLATED-TEST-DB"));
    } finally {
      removeAcceptanceProfile(profile.rootPath);
      fs.rmSync(sentinelRoot, { recursive: true, force: true });
    }
  });

  await run("M82.7.3 Isolation: Main konfiguriert das Profil vor allen DB- und IPC-Imports", () => {
    const main = fs.readFileSync(path.join(process.cwd(), "src/main/main.js"), "utf8");
    const configureIndex = main.indexOf("configureUiEditorAcceptanceProfile({ electronApp: app })");
    const databaseImportIndex = main.indexOf('require("./db/database")');
    const firstIpcImportIndex = main.indexOf('require("./ipc/projectsIpc")');
    assert.equal(configureIndex > 0, true);
    assert.equal(configureIndex < databaseImportIndex, true);
    assert.equal(configureIndex < firstIpcImportIndex, true);
  });

  await run("M82.7.3 Isolation: package bietet einen eindeutigen zweifachen Abnahmestart", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    assert.equal(pkg.scripts["start:ui-editor:acceptance"], "npm run fix:electron-deps && npm run prepare:ui-editor && node scripts/runIsolatedUiEditorAcceptance.cjs");
    const runner = fs.readFileSync(path.join(process.cwd(), "scripts/runIsolatedUiEditorAcceptance.cjs"), "utf8");
    assert.match(runner, /async function runAcceptance\(\{ runs = 2 \}/);
    assert.match(runner, /UI_EDITOR_ACCEPTANCE_REQUIRES_TWO_RUNS/);
  });
}

module.exports = { runUiEditorAcceptanceIsolationTests };
