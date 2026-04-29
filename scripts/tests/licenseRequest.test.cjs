const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const REPO_ROOT = process.cwd();

function withPatchedLicenseIpc(stubs, fn) {
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
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

function read(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function createDefaultStubs({
  saveResult,
  openResult,
  machineId = "MID-REQ-1",
  appVersion = "9.9.9",
  loadLicenseResult = null,
}) {
  const handlers = new Map();
  const electron = {
    app: { isPackaged: false, getVersion: () => appVersion },
    BrowserWindow: { fromWebContents: () => null },
    dialog: {
      showSaveDialog: async () => saveResult || { canceled: true },
      showOpenDialog: async () => openResult || { canceled: true, filePaths: [] },
    },
    ipcMain: {
      handle: (channel, handler) => handlers.set(channel, handler),
    },
    shell: { openPath: async () => "" },
  };
  return {
    handlers,
    stubs: {
      electron,
      licenseStorage: { saveLicense: () => ({}), loadLicense: () => loadLicenseResult, deleteLicense: () => true },
      deviceIdentity: { getMachineId: () => machineId },
      licenseVerifier: { verifyLicense: () => ({ valid: false, reason: "NO_LICENSE" }) },
      licenseService: { refreshStatus: () => ({ valid: false, reason: "NO_LICENSE" }) },
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
    },
  };
}

async function runLicenseRequestTests(run) {
  await run("Lizenzanforderung: Payload hat Pflichtfelder und feste Kennungen", () => {
    const { handlers, stubs } = createDefaultStubs({});
    return withPatchedLicenseIpc(stubs, (mod) => {
      const payload = mod._buildLicenseRequestPayload({
        machineId: "MID-REQ-ABC",
        appVersion: "1.2.3",
      });
      assert.equal(payload.schemaVersion, 1);
      assert.equal(payload.requestType, "machine-license-request");
      assert.equal(payload.product, "bbm-protokoll");
      assert.equal(payload.machineId, "MID-REQ-ABC");
      assert.equal(payload.appVersion, "1.2.3");
      assert.equal(typeof payload.createdAt, "string");
      assert.equal(payload.createdAt.length > 10, true);
      assert.equal(payload.appName, "BBM");
      assert.equal(payload.notes, "");
      assert.equal("customerName" in payload, false);
      assert.equal("licenseId" in payload, false);
      assert.equal(handlers.size >= 0, true);
    });
  });

  await run("Lizenzanforderung: IPC license:create-request wird registriert", () => {
    const { handlers, stubs } = createDefaultStubs({});
    return withPatchedLicenseIpc(stubs, (mod) => {
      mod.registerLicenseIpc();
      assert.equal(handlers.has("license:create-request"), true);
    });
  });

  await run("Lizenzanforderung: Save-Dialog schreibt JSON-Datei", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-license-request-"));
    try {
      const target = path.join(tmp, "bbm-license-request.json");
      const { handlers, stubs } = createDefaultStubs({
        saveResult: { canceled: false, filePath: target },
        machineId: "MID-SAVE-1",
        appVersion: "1.5.0",
        loadLicenseResult: { license: { customerName: "Muster GmbH", licenseId: "LIC-77" } },
      });
      await withPatchedLicenseIpc(stubs, async (mod) => {
        mod.registerLicenseIpc();
        const handler = handlers.get("license:create-request");
        const res = await handler({ sender: {} }, {});
        assert.equal(res.ok, true);
        assert.equal(res.filePath, target);
      });
      const parsed = JSON.parse(fs.readFileSync(target, "utf8"));
      assert.equal(parsed.requestType, "machine-license-request");
      assert.equal(parsed.product, "bbm-protokoll");
      assert.equal(parsed.machineId, "MID-SAVE-1");
      assert.equal(parsed.appVersion, "1.5.0");
      assert.equal(parsed.schemaVersion, 1);
      assert.equal(parsed.customerName, "Muster GmbH");
      assert.equal(parsed.licenseId, "LIC-77");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  await run("Lizenzanforderung: Abbruch im Save-Dialog liefert canceled ohne Datei", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-license-request-cancel-"));
    try {
      const target = path.join(tmp, "bbm-license-request.json");
      const { handlers, stubs } = createDefaultStubs({
        saveResult: { canceled: true, filePath: target },
      });
      await withPatchedLicenseIpc(stubs, async (mod) => {
        mod.registerLicenseIpc();
        const res = await handlers.get("license:create-request")({ sender: {} }, {});
        assert.equal(res.ok, false);
        assert.equal(res.canceled, true);
      });
      assert.equal(fs.existsSync(target), false);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  await run("Lizenzanforderung: Schreibfehler liefert ok false mit Fehlercode", async () => {
    const { handlers, stubs } = createDefaultStubs({
      saveResult: { canceled: false, filePath: "/" },
    });
    await withPatchedLicenseIpc(stubs, async (mod) => {
      mod.registerLicenseIpc();
      const res = await handlers.get("license:create-request")({ sender: {} }, {});
      assert.equal(res.ok, false);
      assert.equal(typeof res.error, "string");
      assert.equal(res.error.length > 0, true);
    });
  });

  await run("Preload: window.bbmDb.licenseCreateRequest ist vorhanden", () => {
    const preloadSource = read("src/main/preload.js");
    assert.equal(preloadSource.includes("licenseCreateRequest"), true);
    assert.equal(preloadSource.includes('ipcRenderer.invoke("license:create-request"'), true);
    assert.equal(preloadSource.includes('ipcRenderer.invoke("app:get-customer-setup"'), true);
  });

  await run("Preload: window.bbmDb.licenseAdminImportLicenseRequest ist entfernt", () => {
    const preloadSource = read("src/main/preload.js");
    assert.equal(preloadSource.includes("licenseAdminImportLicenseRequest"), false);
    assert.equal(preloadSource.includes('ipcRenderer.invoke("license-admin:import-license-request"'), false);
  });

  await run("Preload: window.bbmDb.licenseAdminSendResponseLicenseMail ist entfernt", () => {
    const preloadSource = read("src/main/preload.js");
    assert.equal(preloadSource.includes("licenseAdminSendResponseLicenseMail"), false);
    assert.equal(preloadSource.includes('ipcRenderer.invoke("license-admin:send-response-license-mail"'), false);
  });

  await run("Renderer/UI: Texte fuer Lizenzanforderung sind vorhanden", () => {
    const settingsSource = read("src/renderer/views/SettingsView.js");
    const mainSource = read("src/renderer/main.js");
                    assert.equal(settingsSource.includes("license-tool"), false);
    assert.equal(settingsSource.includes("generate-license.cjs"), false);
    assert.equal(settingsSource.includes("private_key.pem"), false);
    assert.equal(mainSource.includes("Lizenz erforderlich"), true);
    assert.equal(mainSource.includes("Diese Installation ist für eine gerätegebundene Vollversion vorbereitet."), true);
    assert.equal(mainSource.includes("Lizenz per E-Mail anfordern"), true);
    assert.equal(mainSource.includes("Antwortlizenz importieren"), true);
    assert.equal(mainSource.includes("info@bandholt.de"), true);
    assert.equal(mainSource.includes("BBM Lizenzanforderung"), true);
    assert.equal(mainSource.includes("Machine-ID:"), true);
    assert.equal(mainSource.includes("App-Version:"), true);
    assert.equal(mainSource.includes("Kunde:"), true);
    assert.equal(mainSource.includes("Kundennummer:"), true);
    assert.equal(mainSource.includes("setup.customerNumber || setup.customer_number || \"\""), true);
    assert.equal(mainSource.includes("setup.licenseId || setup.license_id || licenseStatus?.licenseId || \"\""), true);
    assert.equal(mainSource.includes("Daten kopieren"), true);
    assert.equal(mainSource.includes("E-Mail konnte nicht automatisch geöffnet werden."), true);
  });

  await run("Main/IPC: app:get-customer-setup ist registriert", () => {
    const mainSource = read("src/main/main.js");
    assert.equal(mainSource.includes('ipcMain.handle("app:get-customer-setup"'), true);
    assert.equal(mainSource.includes("loadCustomerSetup"), true);
  });

  await run("Main/IPC: keine license-admin/generator Handler registriert", () => {
    const { handlers, stubs } = createDefaultStubs({});
    return withPatchedLicenseIpc(stubs, (mod) => {
      mod.registerLicenseIpc();
      assert.equal(handlers.has("license-admin:import-license-request"), false);
      assert.equal(handlers.has("license-admin:create-customer-setup"), false);
      assert.equal(handlers.has("license:generate"), false);
      assert.equal(handlers.has("license:load-request-for-generate"), false);
      assert.equal(handlers.has("license:create-request"), true);
    });
  });

  await run("Grenzen: EXPECTED_PRODUCT bleibt unveraendert", () => {
    const verifierSource = read("src/main/licensing/licenseVerifier.js");
    assert.equal(verifierSource.includes('const EXPECTED_PRODUCT = "bbm-protokoll";'), true);
  });

  await run("Grenzen: keine Kunden-Setup-Builder-/private-key-Reste in BBM runtime", () => {
    const ipcSource = read("src/main/ipc/licenseIpc.js");
    assert.equal(ipcSource.includes("BBM_CUSTOMER_LICENSE_FILE"), false);
    assert.equal(fs.existsSync(path.join(REPO_ROOT, "bbm-license-request.json")), false);
    assert.equal(fs.existsSync(path.join(REPO_ROOT, "private_key.pem")), false);
  });
}

module.exports = { runLicenseRequestTests };
