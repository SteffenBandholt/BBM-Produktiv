const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

const REPO_ROOT = process.cwd();

function read(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function withPatchedLicenseIpc(stubs, fn) {
  const originalLoad = Module._load;
  Module._load = function patched(request, parent) {
    const fromLicenseIpc = String(parent?.filename || "").endsWith(path.join("ipc", "licenseIpc.js"));
    if (fromLicenseIpc && request === "electron") return stubs.electron;
    if (fromLicenseIpc && request === "../licensing/licenseStorage") return stubs.licenseStorage;
    if (fromLicenseIpc && request === "../licensing/deviceIdentity") return stubs.deviceIdentity;
    if (fromLicenseIpc && request === "../licensing/licenseVerifier") return stubs.licenseVerifier;
    if (fromLicenseIpc && request === "../licensing/licenseService") return stubs.licenseService;
    if (fromLicenseIpc && request === "../licensing/licenseAdminService") return stubs.licenseAdminService;
    return originalLoad.apply(this, arguments);
  };
  try {
    const modPath = path.join(REPO_ROOT, "src/main/ipc/licenseIpc.js");
    delete require.cache[require.resolve(modPath)];
    const mod = require(modPath);
    return fn(mod);
  } finally {
    Module._load = originalLoad;
  }
}

function defaultIpcStubs() {
  return {
    electron: {
      app: { getVersion: () => "1.5.0" },
      BrowserWindow: { fromWebContents: () => null },
      dialog: { showOpenDialog: async () => ({ canceled: true, filePaths: [] }) },
      ipcMain: { handle: () => {} },
      shell: { openPath: async () => "" },
    },
    licenseStorage: { saveLicense: (value) => value, loadLicense: () => null, deleteLicense: () => true },
    deviceIdentity: { getMachineId: () => "MID-DOUBLECLICK-1" },
    licenseVerifier: { verifyLicense: () => ({ valid: true }) },
    licenseService: { refreshStatus: () => ({ valid: true, reason: "", machineId: "MID-DOUBLECLICK-1" }) },
    licenseAdminService: {
      listCustomers: () => [],
      saveCustomer: (v) => v,
      listLicenses: () => [],
      listLicensesByCustomer: () => [],
      saveLicense: (v) => v,
      deleteLicenseRecord: () => ({ ok: true }),
      listHistory: () => [],
      addHistoryEntry: (v) => v,
    },
  };
}

async function runLicenseDoubleClickImportTests(run) {
  await run("Build-Konfiguration: fileAssociations fuer .bbmlic ist vorhanden", () => {
    const pkg = JSON.parse(read("package.json"));
    const win = pkg?.build?.win || {};
    const assoc = Array.isArray(win.fileAssociations) ? win.fileAssociations : [];
    const bbmlic = assoc.find((entry) => String(entry?.ext || "").trim().toLowerCase() === "bbmlic");
    assert.equal(!!bbmlic, true);
    assert.equal(bbmlic.name, "BBM Lizenzdatei");
    assert.equal(bbmlic.description, "BBM Lizenzdatei");
  });

  await run("Main-Prozess: erkennt .bbmlic-Startargument", () => {
    const mainSource = read("src/main/main.js");
    assert.equal(mainSource.includes("function _findLicenseFileArg"), true);
    assert.equal(mainSource.includes("endsWith(LICENSE_FILE_EXTENSION)"), true);
    assert.equal(mainSource.includes("const startupLicenseFile = _findLicenseFileArg(process.argv);"), true);
  });

  await run("Main-Prozess: behandelt zweiten App-Start mit .bbmlic", () => {
    const mainSource = read("src/main/main.js");
    assert.equal(mainSource.includes("app.requestSingleInstanceLock()"), true);
    assert.equal(mainSource.includes("app.on(\"second-instance\""), true);
    assert.equal(mainSource.includes("const secondInstanceLicenseFile = _findLicenseFileArg(argv);"), true);
    assert.equal(mainSource.includes("queueLicenseImportPath(secondInstanceLicenseFile);"), true);
  });

  await run("Lizenzimport: nutzt bestehende Importlogik zentral ueber importLicenseFromFilePath", () => {
    const mainSource = read("src/main/main.js");
    const ipcSource = read("src/main/ipc/licenseIpc.js");
    assert.equal(ipcSource.includes("function importLicenseFromFilePath(filePath)"), true);
    assert.equal(ipcSource.includes("return importLicenseFromFilePath(filePath);"), true);
    assert.equal(mainSource.includes("importLicenseFromFilePath(filePath)"), true);
  });

  await run("licenseVerifier.js bleibt unveraendert im bestehenden Verifizierungsfluss", () => {
    const ipcSource = read("src/main/ipc/licenseIpc.js");
    const verifierSource = read("src/main/licensing/licenseVerifier.js");
    assert.equal(ipcSource.includes('const { verifyLicense } = require("../licensing/licenseVerifier");'), true);
    assert.equal(verifierSource.includes("EXPECTED_PRODUCT"), true);
    assert.equal(verifierSource.includes("machineId"), true);
  });

  await run("Lizenzfenster: Hinweis auf Doppelklick ist vorhanden", () => {
    const settingsSource = read("src/renderer/views/SettingsView.js");
    assert.equal(
      settingsSource.includes("Sie können eine erhaltene .bbmlic-Datei auch direkt per Doppelklick öffnen."),
      true
    );
    assert.equal(settingsSource.includes("Lizenz wurde erfolgreich importiert."), true);
    assert.equal(settingsSource.includes("Lizenzdatei konnte nicht importiert werden."), true);
  });

  await run("Testversionen bleiben unveraendert abgesichert", () => {
    const testRunnerSource = read("scripts/test.cjs");
    const trialRuntimeSource = read("scripts/tests/licenseTrialRuntime.test.cjs");
    assert.equal(testRunnerSource.includes("runLicenseTrialRuntimeTests"), true);
    assert.equal(trialRuntimeSource.includes("trialDurationDays"), true);
    assert.equal(trialRuntimeSource.includes("licenseStorage"), true);
  });

  await run("Lizenzimport-Helfer verarbeitet gueltige .bbmlic-Datei ueber bestehenden Flow", async () => {
    const tmp = path.join(REPO_ROOT, "tmp-license-import-helper.bbmlic");
    try {
      fs.writeFileSync(
        tmp,
        JSON.stringify({
          license: { product: "bbm-protokoll", licenseId: "LIC-DC-1" },
          signature: "sig",
        }),
        "utf8"
      );
      const stubs = defaultIpcStubs();
      stubs.licenseVerifier.verifyLicense = () => ({ valid: true, reason: "", license: { customerName: "Muster" } });
      stubs.licenseService.refreshStatus = () => ({
        valid: true,
        reason: "",
        license: { customerName: "Muster", licenseId: "LIC-DC-1" },
      });
      await withPatchedLicenseIpc(stubs, async (mod) => {
        const res = mod.importLicenseFromFilePath(tmp);
        assert.equal(res.ok, true);
        assert.equal(res.filePath, tmp);
        assert.equal(res.valid, true);
      });
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  });
}

module.exports = { runLicenseDoubleClickImportTests };
