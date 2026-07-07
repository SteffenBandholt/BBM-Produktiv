const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const INSPECTOR_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/inspector/editorScopeInspector.js"
);
const CATALOG_PATH = path.join(__dirname, "../../src/renderer/editorRuntime/catalog/bbmEditorCatalog.js");
const HOST_FACTORY_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/host/bbmEditorHostAdapterFactory.js"
);
const DETAILS_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/inspector/editorElementDetails.js"
);

async function runEditorScopeInspectorTests(run) {
  const [inspectorModule, catalogModule, hostFactoryModule, detailsModule] = await Promise.all([
    importEsmFromFile(INSPECTOR_PATH),
    importEsmFromFile(CATALOG_PATH),
    importEsmFromFile(HOST_FACTORY_PATH),
    importEsmFromFile(DETAILS_PATH),
  ]);

  const inspector = inspectorModule.createEditorScopeInspector({
    catalog: catalogModule.BBM_EDITOR_CATALOG,
    hostAdapterFactory: hostFactoryModule.createBbmEditorHostAdapter,
  });

  await run("EditorScopeInspector: listet Modul restarbeiten", () => {
    const modules = inspector.getAvailableModules();
    assert.ok(modules.some((module) => module.moduleId === "restarbeiten"));
  });

  await run("EditorScopeInspector: listet Scope restarbeiten.ui.main", () => {
    const scopes = inspector.getAvailableScopes();
    assert.ok(scopes.some((scope) => scope.scopeId === "restarbeiten.ui.main"));
  });

  const result = inspector.inspectScope("restarbeiten.ui.main");

  await run("EditorScopeInspector: inspectScope ist ok", () => {
    assert.equal(result.ok, true);
    assert.ok(result.scope);
    assert.equal(result.scope.scopeId, "restarbeiten.ui.main");
  });

  await run("EditorScopeInspector: Registry ist nicht leer", () => {
    assert.equal(Array.isArray(result.registry), true);
    assert.ok(result.registry.length > 0);
  });

  await run("EditorScopeInspector: Registry-Validation ist ok", () => {
    assert.equal(result.registryValidation.ok, true);
    assert.deepEqual(result.registryValidation.errors, []);
  });

  await run("EditorScopeInspector: Baum hat root restarbeiten.root", () => {
    assert.ok(result.treeResult.tree);
    assert.equal(result.treeResult.tree.id, "restarbeiten.root");
  });

  await run("EditorScopeInspector: Elementdetails fuer Kurztext sind verfuegbar", () => {
    const detailsResult = detailsModule.getEditorElementDetails(result.registry, "restarbeiten.editbox.text.short");
    assert.equal(detailsResult.ok, true);
    assert.ok(detailsResult.details);
    assert.equal(detailsResult.details.id, "restarbeiten.editbox.text.short");
    assert.equal(detailsResult.details.type, "field");
    assert.equal(detailsResult.details.role, "content");
  });

  await run("EditorScopeInspector: effectiveOps enthalten nur erlaubte und nicht gesperrte Operationen", () => {
    const detailsResult = detailsModule.getEditorElementDetails(result.registry, "restarbeiten.editbox.text.short");
    const operationsResult = detailsModule.listEditorElementOperations(
      result.registry,
      "restarbeiten.editbox.text.short"
    );
    assert.equal(operationsResult.ok, true);
    assert.ok(detailsResult.details.effectiveOps.includes("move"));
    assert.ok(!detailsResult.details.effectiveOps.includes("save"));
    assert.deepEqual(operationsResult.operations.effectiveOps, detailsResult.details.effectiveOps);
  });

  await run("EditorScopeInspector: Layout-Control-Panel bietet Save/Load/Reset fuer registriertes Element", () => {
    const panel = inspector.getLayoutControlPanel("restarbeiten.ui.main", "restarbeiten.editbox.text.short");
    assert.equal(panel.ok, true);
    assert.equal(panel.status.kind, "ready");
    assert.equal(panel.selectedElement.id, "restarbeiten.editbox.text.short");
    assert.ok(panel.controls.some((control) => control.id === "editor.layout.applySave" && control.enabled));
    assert.ok(panel.controls.some((control) => control.id === "editor.layout.loadSaved" && control.enabled));
    assert.ok(panel.controls.some((control) => control.id === "editor.layout.resetDefault" && control.enabled));
    const saveControl = panel.controls.find((control) => control.id === "editor.layout.applySave");
    assert.ok(saveControl.allowedOps.includes("move"));
    assert.equal(saveControl.allowedOps.includes("label"), false);
  });

  await run("EditorScopeInspector: Layout-Aenderung wird angewendet und sichtbar bestaetigt", () => {
    const applyResult = inspector.applyLayoutChange("restarbeiten.ui.main", {
      elementId: "restarbeiten.editbox.text.short",
      operation: "move",
      payload: { x: 14, y: 28 },
    });
    assert.equal(applyResult.ok, true);
    assert.equal(applyResult.blocked, false);
    assert.equal(applyResult.status.kind, "success");
    assert.equal(applyResult.status.message.includes("angewendet"), true);
    assert.deepEqual(applyResult.layoutEntry.layoutValue, { x: 14, y: 28 });
  });

  await run("EditorScopeInspector: gespeicherter Layoutzustand wird geladen und gemeldet", () => {
    const loadResult = inspector.loadLayoutState("restarbeiten.ui.main", {
      elementId: "restarbeiten.editbox.text.short",
    });
    assert.equal(loadResult.ok, true);
    assert.equal(loadResult.status.kind, "success");
    assert.equal(loadResult.currentLayoutEntry.elementId, "restarbeiten.editbox.text.short");
    assert.deepEqual(loadResult.currentLayoutEntry.layoutValue, { x: 14, y: 28 });
  });

  await run("EditorScopeInspector: Reset stellt den Standardzustand nachvollziehbar wieder her", () => {
    const resetResult = inspector.resetLayoutState("restarbeiten.ui.main", {
      elementId: "restarbeiten.editbox.text.short",
    });
    assert.equal(resetResult.ok, true);
    assert.equal(resetResult.status.kind, "success");
    assert.deepEqual(resetResult.layoutState, []);

    const loadResult = inspector.loadLayoutState("restarbeiten.ui.main", {
      elementId: "restarbeiten.editbox.text.short",
    });
    assert.equal(loadResult.ok, true);
    assert.equal(loadResult.currentLayoutEntry, null);
    assert.equal(loadResult.status.message.includes("Standardzustand"), true);
  });

  await run("EditorScopeInspector: unbekanntes Element blockiert sichtbare Bedienaktionen", () => {
    const panel = inspector.getLayoutControlPanel("restarbeiten.ui.main", "restarbeiten.editbox.unknown");
    assert.equal(panel.ok, false);
    assert.equal(panel.status.kind, "blocked");
    assert.equal(panel.status.reason, "ELEMENT_UNKNOWN");
    assert.equal(panel.controls.every((control) => control.enabled === false), true);
  });

  await run("EditorScopeInspector: nicht layoutneutrale Operation wird sichtbar blockiert", () => {
    const result = inspector.applyLayoutChange("restarbeiten.ui.main", {
      elementId: "restarbeiten.editbox.text.short.label",
      operation: "label",
      payload: { label: "Kurztext" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "OPERATION_NOT_LAYOUT_CONTROL_SAFE");
    assert.equal(result.status.kind, "blocked");
  });

  await run("EditorScopeInspector: Fach-, DOM- und Datenbankpayloads werden nicht gespeichert", () => {
    const forbiddenPayloads = [
      { projectId: "p-1" },
      { domNode: { id: "x" } },
      { database: "app.db" },
    ];

    for (const payload of forbiddenPayloads) {
      const result = inspector.applyLayoutChange("restarbeiten.ui.main", {
        elementId: "restarbeiten.editbox.text.short",
        operation: "move",
        payload,
      });
      assert.equal(result.ok, false);
      assert.equal(result.blocked, true);
      assert.equal(result.status.kind, "blocked");
    }

    const loadResult = inspector.loadLayoutState("restarbeiten.ui.main", {
      elementId: "restarbeiten.editbox.text.short",
    });
    assert.equal(loadResult.currentLayoutEntry, null);
  });

  await run("EditorScopeInspector: unbekannter Scope wird sauber behandelt", () => {
    const unknown = inspector.inspectScope("does.not.exist");
    assert.equal(unknown.ok, false);
    assert.ok(unknown.errors.length > 0);
  });

  await run("EditorScopeInspector: kein DOM oder window erforderlich", () => {
    assert.equal(typeof globalThis.window, "undefined");
    assert.equal(typeof globalThis.document, "undefined");
  });

  if (!process.exitCode) console.log("editorScopeInspector.test.cjs passed");
}

module.exports = { runEditorScopeInspectorTests };
