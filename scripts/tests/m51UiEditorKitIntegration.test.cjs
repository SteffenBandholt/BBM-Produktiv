const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.join(__dirname, "../..");
const packageJson = require("../../package.json");
const { getBbmUiEditorManifest } = require("../../src/ui-editor/bbm-ui-editor-manifest.cjs");
const { getBbmUiElementRegistry } = require("../../src/ui-editor/bbm-ui-element-registry.cjs");
const { createBbmHostAdapter, createMemoryLayoutStateStore } = require("../../src/ui-editor/bbm-host-adapter.cjs");
const { startBbmUiEditorRuntime, getBbmUiEditorIntegrationStatus } = require("../../src/ui-editor/start-bbm-ui-editor-runtime.cjs");
const {
  getTargetAppAdapterManifestRequiredFields,
  getTargetAppAdapterManifestAllowedModes,
  validateTargetAppAdapterManifest,
} = require("../../node_modules/ui-editor-kit/src/core/target-app-adapter-manifest.cjs");

function createContractRuntime({ hostAdapter, manifest, registry, layoutStore }) {
  return {
    ok: true,
    manifest,
    registry,
    layoutStore,
    viewModels: {
      statusViewModel: { adapterValid: true, runtimeStarted: true },
      scopeViewModel: {
        activeUiScope: manifest.defaultUiScope,
        activeLayoutScope: manifest.defaultLayoutScope,
        activeLayoutProfileId: manifest.defaultLayoutProfileId,
      },
      selectionViewModel: { selectElement: hostAdapter.selectElement },
      layoutControlViewModel: {
        load: hostAdapter.getCurrentLayoutState,
        save: hostAdapter.saveLayoutState,
        reset: hostAdapter.resetLayoutState,
      },
    },
  };
}

async function runM51UiEditorKitIntegrationTests(run) {
  await run("M51/M59 Abhaengigkeit: UI-Editor-kit ist fest auf M59-Kit-Merge-Commit gepinnt", () => {
    assert.equal(packageJson.dependencies["ui-editor-kit"], "github:SteffenBandholt/UI-Editor-kit#af1fbabd0b875a4ab382ed84c5cd986c3c7acb14");
    assert.equal(/#main|#master|latest/.test(packageJson.dependencies["ui-editor-kit"]), false);
  });

  await run("M51 Manifest: BBM-Ziel-App-Vertrag ist eindeutig", () => {
    const manifest = getBbmUiEditorManifest();
    assert.equal(manifest.targetAppId, "bbm-produktiv");
    assert.equal(manifest.adapterName, "BBM UI-Editor Adapter");
    assert.equal(manifest.uiScope, "bbm.main");
    assert.equal(manifest.layoutScope, "bbm.main-layout");
    assert.equal(manifest.layoutProfileId, "default");
    assert.deepEqual(manifest.uiScopes, ["bbm.main"]);
    assert.deepEqual(manifest.layoutScopes, ["bbm.main-layout"]);
    assert.equal(manifest.defaultLayoutProfileId, "default");
    assert.equal(manifest.contractVersion, "ui-editor-kit@v0.2.0");
    for (const field of getTargetAppAdapterManifestRequiredFields()) {
      assert.equal(Object.prototype.hasOwnProperty.call(manifest, field), true, `${field} missing`);
    }
    assert.deepEqual(manifest.supportedElementTypes, ["frame", "navigation", "header", "content", "actions"]);
    assert.deepEqual(manifest.supportedOperations, ["layout.read", "layout.save", "layout.reset", "element.select", "registry.read", "scope.validate", "status.read"]);
    assert.equal(manifest.persistenceMode, "memory-only");
    assert.equal(manifest.executionMode, "test-host");
    assert.equal(manifest.riskClass, "low");
    assert.equal(validateTargetAppAdapterManifest(manifest).ok, true);
    const allowedModes = getTargetAppAdapterManifestAllowedModes();
    assert.equal(allowedModes.persistenceModes.includes(manifest.persistenceMode), true);
    assert.equal(allowedModes.executionModes.includes(manifest.executionMode), true);
    assert.equal(allowedModes.riskClasses.includes(manifest.riskClass), true);
  });

  await run("M51 Registry: explizite BBM-Elemente mit eindeutigen IDs und Parent-Struktur", () => {
    const registry = getBbmUiElementRegistry("bbm.main");
    assert.equal(registry.ok, true);
    assert.equal(registry.registryMode, "explicit");
    assert.equal(registry.autoDiscovery, false);
    assert.ok(registry.elements.length >= 1);
    const ids = new Set(registry.elements.map((element) => element.elementId));
    assert.equal(ids.size, registry.elements.length);
    for (const element of registry.elements) {
      if (element.parentId) assert.equal(ids.has(element.parentId), true, `${element.elementId} parent missing`);
      assert.equal(element.scope, "bbm.main");
      assert.equal(element.layoutScope, "bbm.main-layout");
    }
    assert.deepEqual([...new Set(registry.elements.map((element) => element.type))], getBbmUiEditorManifest().supportedElementTypes);
    const kitElements = registry.listElements();
    assert.equal(kitElements.length, registry.elements.length);
    assert.deepEqual(kitElements.map((element) => element.id), registry.elements.map((element) => element.elementId));
  });

  await run("M51 HostAdapter: Scopes und unbekannte Elemente werden blockiert", () => {
    const adapter = createBbmHostAdapter();
    assert.equal(adapter.validateScope("bbm.main", "bbm.main-layout").ok, true);
    assert.equal(adapter.validateScope("bbm.unknown", "bbm.main-layout").blockCode, "BBM_UI_SCOPE_UNKNOWN");
    assert.equal(adapter.selectElement("bbm.main.content").ok, true);
    assert.equal(adapter.selectElement("bbm.main.unknown").blockCode, "BBM_UI_ELEMENT_UNKNOWN");
  });

  await run("M51 Runtime: public API Bootstrap liefert ViewModels und Layout Save/Load/Reset", () => {
    const layoutStore = createMemoryLayoutStateStore();
    const result = startBbmUiEditorRuntime({
      layoutStore,
      coreApi: { createTargetAppAdapterRuntime: createContractRuntime },
    });
    assert.equal(result.ok, true);
    assert.equal(Boolean(result.viewModels.statusViewModel), true);
    assert.equal(Boolean(result.viewModels.scopeViewModel), true);
    assert.equal(Boolean(result.viewModels.selectionViewModel), true);
    assert.equal(Boolean(result.viewModels.layoutControlViewModel), true);
    assert.equal(result.hostAdapter.selectElement("bbm.main.content").ok, true);
    assert.equal(result.hostAdapter.saveLayoutState({ elementId: "bbm.main.content", layoutValue: { width: "wide" } }).ok, true);
    assert.deepEqual(result.hostAdapter.getCurrentLayoutState().entries.map((entry) => entry.layoutValue), [{ width: "wide" }]);
    assert.equal(result.hostAdapter.resetLayoutState({ elementId: "bbm.main.content" }).ok, true);
    assert.deepEqual(result.hostAdapter.getCurrentLayoutState().entries, []);
    assert.equal(result.runtime.ok, true);
    const status = getBbmUiEditorIntegrationStatus(result);
    assert.equal(status.runtimeStarted, true);
    assert.equal(status.adapterValid, true);
    assert.equal(status.activeScope, "bbm.main");
    assert.equal(status.activeLayoutScope, "bbm.main-layout");
    assert.equal(status.activeLayoutProfileId, "default");
    assert.equal(status.registeredElementCount, 5);
  });

  await run("M51 Runtime Fehlerfall: ungueltiges Manifest bleibt blockiert und meldet echten Blockcode", () => {
    const invalidManifest = { ...getBbmUiEditorManifest() };
    delete invalidManifest.uiScope;
    const result = startBbmUiEditorRuntime({ manifest: invalidManifest });
    assert.equal(result.ok, false);
    assert.equal(result.blockCode, "invalid_adapter_manifest");
    assert.equal(result.viewModels.statusViewModel.runtimeStarted, false);
    assert.equal(result.viewModels.statusViewModel.adapterValid, false);
    const status = getBbmUiEditorIntegrationStatus(result);
    assert.equal(status.runtimeStarted, false);
    assert.equal(status.adapterValid, false);
    assert.equal(status.blockCode, "invalid_adapter_manifest");
  });

  await run("M51 Sicherheit: keine Core-Kopie, keine automatische Erkennung und keine Fach-/Maschinenraumfunktionen", () => {
    const files = [
      "src/ui-editor/bbm-ui-editor-manifest.cjs",
      "src/ui-editor/bbm-ui-element-registry.cjs",
      "src/ui-editor/bbm-host-adapter.cjs",
      "src/ui-editor/start-bbm-ui-editor-runtime.cjs",
    ];
    const combined = files.map((file) => fs.readFileSync(path.join(REPO_ROOT, file), "utf8")).join("\n");
    assert.equal(/querySelector|getElementsBy|MutationObserver|DOMParser|autoDiscovery:\s*true/i.test(combined), false);
    assert.equal(/migration|better-sqlite3|pdf|druck|mail|audio|fachdaten/i.test(combined), false);
    assert.equal(combined.includes("createTargetAppAdapterRuntime"), true);
    assert.equal(combined.includes("require(\"ui-editor-kit\")"), true);
  });
}

module.exports = { runM51UiEditorKitIntegrationTests };
