const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

async function runProtokollSettingsOwnershipTests(run) {
  const rendererContract = await importEsmFromFile(
    path.join(
      process.cwd(),
      "src/renderer/modules/protokoll/settings/ProtokollSettingsContract.js"
    )
  );
  const mainContract = require(path.join(
    process.cwd(),
    "src/main/modules/protokoll/settingsKeys.js"
  ));
  const { openGlobalProtocolSettings } = await importEsmFromFile(
    path.join(
      process.cwd(),
      "src/renderer/modules/protokoll/settings/openGlobalProtocolSettings.js"
    )
  );

  await run("Protokoll #272 Settings: Renderer und Main besitzen denselben Schluesselvertrag", () => {
    assert.deepEqual(
      rendererContract.PROTOKOLL_GLOBAL_SETTING_KEYS,
      mainContract.PROTOKOLL_GLOBAL_SETTING_KEYS
    );
    assert.deepEqual(
      rendererContract.PROTOKOLL_PROJECT_SETTING_KEYS,
      mainContract.PROTOKOLL_PROJECT_SETTING_KEYS
    );
    for (const key of [
      "pdf.protocolTitle",
      "pdf.preRemarks",
      "pdf.footerRecorder",
      "pdf.trafficLightAllEnabled",
      "tops.ampelEnabled",
      "tops.showLongtextInList",
      "email_subject",
      "firm_role_order",
    ]) {
      assert.equal(rendererContract.PROTOKOLL_GLOBAL_SETTING_KEYS.includes(key), true, key);
    }
  });

  await run("Protokoll #272 Settings: Core-Router hostet den Modulvertrag ohne eigene Fachliste", () => {
    const router = read("src/renderer/app/Router.js");
    assert.equal(router.includes("PROTOKOLL_GLOBAL_SETTING_KEYS"), true);
    for (const key of rendererContract.PROTOKOLL_GLOBAL_SETTING_KEYS) {
      assert.equal(router.includes(`\"${key}\"`), false, key);
    }
  });

  await run("Protokoll #272 Settings: globale und projektbezogene UI delegieren an das Fachmodul", () => {
    const settingsView = read("src/renderer/views/SettingsView.js");
    const projectForm = read(
      "src/renderer/modules/projektverwaltung/screens/ProjectFormScreen.js"
    );
    assert.equal(settingsView.includes("openGlobalProtocolSettings({ host: this })"), true);
    assert.equal(projectForm.includes("openProtocolSettingsModal({ projectId: this.projectId })"), true);
    assert.equal(settingsView.includes("this._createLegacyProtocolContent()"), false);
    assert.equal(projectForm.includes("this._openLegacyProjectSettingsModal()"), false);
    assert.equal(settingsView.includes("_createLegacyProtocolContent()"), false);
    assert.equal(projectForm.includes("_openLegacyProjectSettingsModal()"), false);
  });

  await run("Protokoll #272 Settings: Projektsettings-IPC wird nur modular registriert", () => {
    const main = read("src/main/main.js");
    const registrar = read("src/main/modules/protokoll/registerIpc.js");
    const settingsIpc = read("src/main/ipc/settingsIpc.js");
    assert.equal(main.includes("registerProjectSettingsIpc"), false);
    assert.equal(registrar.includes("registerProjectSettingsIpc({ ipcMain })"), true);
    assert.equal(settingsIpc.includes("PROTOKOLL_GLOBAL_SETTING_KEYS"), true);
  });

  await run("Protokoll #272 Settings: ausgelagerter globaler Bereich laedt und speichert", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    const previousAlert = global.alert;
    const saved = [];
    let modalConfig = null;

    function element(tagName) {
      return {
        tagName: String(tagName || "div").toUpperCase(),
        style: {},
        classList: { add() {} },
        children: [],
        append(...nodes) { this.children.push(...nodes); },
        appendChild(node) { this.children.push(node); return node; },
        textContent: "",
        type: "",
        value: "",
        checked: false,
      };
    }

    global.document = {
      createElement: element,
      createTextNode: (value) => ({ textContent: String(value || "") }),
    };
    global.alert = () => {};
    global.window = {
      bbmDb: {
        async appSettingsGetMany(keys) {
          assert.deepEqual(keys, [
            "pdf.protocolTitle",
            "pdf.preRemarks",
            "print.preRemarks.enabled",
          ]);
          return {
            ok: true,
            data: {
              "pdf.protocolTitle": "Baubesprechung",
              "pdf.preRemarks": "Bestand",
              "print.preRemarks.enabled": "true",
            },
          };
        },
        async appSettingsSetMany(payload) {
          saved.push(payload);
          return { ok: true };
        },
      },
    };

    const host = {
      router: { context: { settings: {} } },
      _parseBool: (value) => value === true || String(value) === "true",
      _normalizePdfPreRemarks: (value) => String(value || "").trim(),
      _normalizeUserText: (value) => String(value || "").trim(),
      _buildTouchedPayloadFromValues: () => ({}),
      _buildTouchedPayloadForKeys: () => ({}),
      _openSettingsModal(config) { modalConfig = config; },
      _setMsg() {},
    };

    try {
      assert.equal(await openGlobalProtocolSettings({ host }), true);
      assert.equal(host.inpPdfProtocolTitle.value, "Baubesprechung");
      assert.equal(host._settingsInputs.get("pdf.preRemarks").value, "Bestand");
      assert.equal(host._settingsInputs.get("print.preRemarks.enabled").checked, true);

      host.inpPdfProtocolTitle.value = "Neuer Titel";
      host._settingsInputs.get("pdf.preRemarks").value = "Neue Vorbemerkung";
      host._settingsInputs.get("print.preRemarks.enabled").checked = false;
      assert.equal(await modalConfig.saveFn(), true);
      assert.deepEqual(saved, [{
        "pdf.protocolTitle": "Neuer Titel",
        "pdf.preRemarks": "Neue Vorbemerkung",
        "print.preRemarks.enabled": "false",
      }]);
      assert.equal(host.router.context.settings["pdf.protocolTitle"], "Neuer Titel");
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
      global.alert = previousAlert;
    }
  });
}

module.exports = { runProtokollSettingsOwnershipTests };
