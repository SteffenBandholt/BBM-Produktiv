const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const MODEL_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/layout/editorLayoutOverrideModel.js"
);

async function runEditorLayoutOverrideModelTests(run) {
  const model = await importEsmFromFile(MODEL_PATH);

  const validOverride = {
    targetAppId: "bbm",
    moduleId: "restarbeiten",
    scopeId: "restarbeiten.ui.main",
    elementId: "example.field",
    overrides: {
      visible: false,
    },
    createdAt: "2026-06-12T10:00:00.000Z",
    updatedAt: "2026-06-12T10:00:00.000Z",
  };

  await run("EditorLayoutOverrideModel: gueltiger Visibility-Override wird normalisiert", () => {
    const normalized = model.normalizeEditorLayoutOverride({
      ...validOverride,
      targetAppId: " bbm ",
      elementId: " example.field ",
    });

    assert.deepEqual(normalized, {
      targetAppId: "bbm",
      moduleId: "restarbeiten",
      scopeId: "restarbeiten.ui.main",
      elementId: "example.field",
      overrides: {
        visible: false,
      },
      source: "ui-editor",
      createdAt: "2026-06-12T10:00:00.000Z",
      updatedAt: "2026-06-12T10:00:00.000Z",
    });

    const validation = model.validateEditorLayoutOverride(normalized, {
      registry: [{ id: "example.field" }],
      allowedScopes: ["restarbeiten.ui.main"],
    });
    assert.equal(validation.ok, true);
    assert.deepEqual(validation.errors, []);
  });

  await run("EditorLayoutOverrideModel: fehlende Pflichtfelder werden abgelehnt", () => {
    const validation = model.validateEditorLayoutOverride({
      targetAppId: "bbm",
      moduleId: "restarbeiten",
      scopeId: "",
      elementId: "",
      overrides: {
        visible: false,
      },
    });

    assert.equal(validation.ok, false);
    assert.ok(validation.errors.some((error) => error.code === "REQUIRED_FIELD_EMPTY" && error.field === "scopeId"));
    assert.ok(validation.errors.some((error) => error.code === "REQUIRED_FIELD_EMPTY" && error.field === "elementId"));
    assert.ok(validation.errors.some((error) => error.code === "ELEMENT_ID_NOT_PERSISTABLE"));
  });

  await run("EditorLayoutOverrideModel: visible akzeptiert nur Boolean", () => {
    const validation = model.validateEditorLayoutOverride({
      ...validOverride,
      overrides: {
        visible: "false",
      },
    });

    assert.equal(validation.ok, false);
    assert.ok(validation.errors.some((error) => error.code === "VISIBLE_NOT_BOOLEAN"));
  });

  await run("EditorLayoutOverrideModel: unbekannte und unkontrollierte Element-IDs werden blockiert", () => {
    const unknown = model.validateEditorLayoutOverride(validOverride, {
      registry: [{ id: "other.field" }],
    });
    assert.equal(unknown.ok, false);
    assert.ok(unknown.errors.some((error) => error.code === "ELEMENT_ID_UNKNOWN"));

    const instance = model.validateEditorLayoutOverride({
      ...validOverride,
      elementId: "example.template::42",
    });
    assert.equal(instance.ok, false);
    assert.ok(instance.errors.some((error) => error.code === "ELEMENT_ID_NOT_PERSISTABLE"));
  });

  await run("EditorLayoutOverrideModel: nur sichtbarkeitsbezogene Overrides sind zulaessig", () => {
    const validation = model.validateEditorLayoutOverride({
      ...validOverride,
      overrides: {
        visible: true,
        className: "hidden",
      },
    });

    assert.equal(validation.ok, false);
    assert.ok(validation.errors.some((error) => error.code === "OVERRIDE_KEY_UNSUPPORTED" && error.key === "className"));
  });

  await run("EditorLayoutOverrideModel: Visibility-ChangeRequest wird in Override-Payload uebersetzt", () => {
    const override = model.buildVisibilityOverrideFromChangeRequest({
      changeId: "chg-visibility-1",
      targetAppId: "bbm",
      moduleId: "restarbeiten",
      scopeId: "restarbeiten.ui.main",
      elementId: "example.field",
      operation: "visibility",
      payload: {
        visible: true,
      },
      source: "preview",
      persistent: true,
      createdAt: "2026-06-12T11:00:00.000Z",
    });

    assert.deepEqual(override, {
      targetAppId: "bbm",
      moduleId: "restarbeiten",
      scopeId: "restarbeiten.ui.main",
      elementId: "example.field",
      overrides: {
        visible: true,
      },
      source: "ui-editor",
      createdAt: "2026-06-12T11:00:00.000Z",
      updatedAt: "2026-06-12T11:00:00.000Z",
    });
  });

  await run("EditorLayoutOverrideModel: Persistierbarkeit bleibt standardmaessig gesperrt", () => {
    const persistentFalse = {
      ...validOverride,
      operation: "visibility",
      payload: { visible: false },
      persistent: false,
    };
    assert.equal(model.isVisibilityOverridePersistable(persistentFalse, {
      persistence: true,
      canPersistVisibility: true,
      dryRunOnly: false,
    }), false);

    const persistentTrueBlocked = {
      ...persistentFalse,
      persistent: true,
    };
    assert.equal(model.isVisibilityOverridePersistable(persistentTrueBlocked, {
      persistence: false,
      canPersistVisibility: false,
      dryRunOnly: true,
    }), false);

    assert.equal(model.isVisibilityOverridePersistable(persistentTrueBlocked, {
      persistence: true,
      canPersistVisibility: true,
      dryRunOnly: false,
    }), true);
  });

  await run("EditorLayoutOverrideModel: bleibt ohne Speicher-, DB-, IPC- und Fachpfade", () => {
    const source = fs.readFileSync(MODEL_PATH, "utf8");
    for (const forbidden of [
      "localStorage",
      "sessionStorage",
      "writeFile",
      "ipcRenderer",
      "ipcMain",
      "better-sqlite3",
      ".prepare(",
      ".run(",
      "querySelector",
      "DOMParser",
      "innerHTML",
      "Kurztext",
      "Editbox",
      "Filterleiste",
    ]) {
      assert.equal(source.includes(forbidden), false, forbidden);
    }
  });
}

if (require.main === module) {
  const run = async (name, fn) => {
    try {
      const out = fn();
      if (out && typeof out.then === "function") await out;
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
      process.exitCode = 1;
    }
  };

  runEditorLayoutOverrideModelTests(run).then(() => {
    if (!process.exitCode) console.log("editorLayoutOverrideModel.test.cjs passed");
  });
}

module.exports = { runEditorLayoutOverrideModelTests };
