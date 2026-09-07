"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function fixture() {
  const scopeId = "pdf.fixture.overlay";
  const element = (suffix, kind, parentId, order) => ({
    id: suffix ? `${scopeId}.${suffix}` : scopeId,
    scopeId, name: kind, kind, parentId, order, role: "layout", pageArea: kind === "document" ? "document" : "body",
    visible: true, editable: kind === "value", capabilities: kind === "value" ? ["move"] : [], lockedOps: [],
    baseline: { x: 10, y: 10, width: 40, height: 12, visible: true },
    layoutBounds: { minX: 0, maxX: 594, minY: 0, maxY: 420, minWidth: 1, maxWidth: 594, minHeight: 1, maxHeight: 420 },
    refKey: `fixture.${suffix || "document"}`, rendererKey: `fixture.${suffix || "document"}`,
  });
  const registry = {
    applicationId: "bbm-produktiv", documentTypeId: "fixture-overlay", displayName: "Fixed layout fixture",
    scopeId, unit: "mm", registryVersion: 1, layoutModel: "fixed-layout",
    pageSettings: { format: "A2", orientation: "landscape", width: 594, height: 420, margins: { top: 0, right: 0, bottom: 0, left: 0 } },
    elements: [element("", "document", null, 0), element("page", "page", scopeId, 1), element("area", "area", `${scopeId}.page`, 2), element("value", "value", `${scopeId}.area`, 3)],
  };
  const registration = {
    documentTypeId: registry.documentTypeId, moduleId: "fixture", scopeId, profileStorageKey: "fixture-overlay",
    contractVersion: "1.0.0", descriptorVersion: 1, displayName: registry.displayName, candidateRegistry: registry,
  };
  return { registry, registration, element };
}

async function runFixedLayoutPdfRegistryTests(run) {
  const { createPdfRegistryFingerprint } = require("ui-editor-kit");
  const { validateCandidate, analyzePdfDocumentType, createAcceptedRecord, createEffectiveRegistry, mergeAdditiveRegistry, createPdfDocumentTypeRegistryStore } = require("../../src/main/ui-editor/pdfDocumentTypeRegistry.cjs");
  const { createDeclarativePdfAdapter, persistedRegistryFingerprint } = require("../../src/main/ui-editor/declarativePdfAdapter.cjs");
  const adapterFor = (registry) => createDeclarativePdfAdapter({ documentTypeId: registry.documentTypeId, displayName: registry.displayName, registry });

  await run("Fixed-layout PDF: A2 candidate, accepted snapshot and active registry preserve model without tables", () => {
    const { registry, registration } = fixture();
    assert.deepEqual(validateCandidate(registration).validationErrors, []);
    assert.equal(analyzePdfDocumentType(registration).canRegister, true);
    const accepted = createAcceptedRecord(registration, registry);
    const analysis = analyzePdfDocumentType(registration, accepted);
    assert.equal(analysis.status, "available");
    assert.equal(analysis.effectiveRegistry.layoutModel, "fixed-layout");
    assert.equal(analysis.effectiveRegistry.registryFingerprint, createPdfRegistryFingerprint(registry));
    assert.equal(adapterFor(analysis.effectiveRegistry).getPdfRegistry().pageSettings.width, 594);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-fixed-registry-"));
    try {
      const store = createPdfDocumentTypeRegistryStore({ root });
      store.save(accepted);
      assert.deepEqual(createEffectiveRegistry(store.get(registry.documentTypeId)), analysis.effectiveRegistry);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  await run("Fixed-layout PDF: additive acceptance, deactivation and reactivation retain valid parent structure", () => {
    const { registry, registration, element } = fixture();
    const accepted = createAcceptedRecord(registration, registry);
    const added = element("second", "value", `${registry.scopeId}.area`, 4);
    const next = { ...registry, registryVersion: 2, elements: [...registry.elements, added] };
    const nextRegistration = { ...registration, descriptorVersion: 2, candidateRegistry: next };
    const analysis = analyzePdfDocumentType(nextRegistration, accepted);
    assert.deepEqual(analysis.newElementIds, [added.id]);
    assert.equal(analysis.canSynchronizeElements, true);
    const merged = mergeAdditiveRegistry(registry, next, analysis.newElementIds);
    const record = createAcceptedRecord(nextRegistration, merged, accepted, next.elements.map((entry) => entry.id));
    assert.equal(createEffectiveRegistry(record).elements.length, 5);
    const inactive = createAcceptedRecord(registration, merged, record, registry.elements.map((entry) => entry.id));
    assert.equal(createEffectiveRegistry(inactive).elements.length, 4);
    assert.deepEqual(analyzePdfDocumentType(nextRegistration, inactive).reactivatedElementIds, [added.id]);
    assert.equal(merged.layoutModel, "fixed-layout");
  });

  await run("Fixed-layout PDF: model and fixed page changes cannot silently replace accepted identity", () => {
    const { registry, registration } = fixture();
    const accepted = createAcceptedRecord(registration, registry);
    const variants = [
      [{ ...registry, layoutModel: "tabular" }, "layoutModel"],
      [{ ...registry, pageSettings: { ...registry.pageSettings, format: "A4", width: 297, height: 210 } }, "pageSettings"],
      [{ ...registry, pageSettings: { ...registry.pageSettings, margins: { ...registry.pageSettings.margins, left: 1 } } }, "pageSettings"],
    ];
    for (const [candidateRegistry, field] of variants) {
      const analysis = analyzePdfDocumentType({ ...registration, candidateRegistry }, accepted);
      assert.equal(analysis.status, "incompatible");
      assert.ok(analysis.identityErrors.includes(field));
      assert.equal(analysis.canSynchronizeElements, false);
      assert.throws(() => mergeAdditiveRegistry(registry, candidateRegistry, []), { code: "pdf_registry_sync_invalid" });
    }
  });

  await run("Fixed-layout PDF: candidate, projection and merge reject dangling parents", () => {
    const { registry, registration, element } = fixture();
    const invalid = { ...registry, elements: [...registry.elements, element("orphan", "value", "pdf.missing", 4)] };
    assert.equal(validateCandidate({ ...registration, candidateRegistry: invalid }).ok, false);
    assert.throws(() => mergeAdditiveRegistry(registry, invalid, [invalid.elements.at(-1).id]), { code: "pdf_registry_sync_invalid" });
    const record = createAcceptedRecord(registration, registry, null, registry.elements.filter((entry) => entry.kind !== "area").map((entry) => entry.id));
    assert.throws(() => createEffectiveRegistry(record), { code: "pdf_registry_active_projection_invalid" });
  });

  await run("Fixed-layout PDF: optional tables still require two direct columns at all acceptance stages", () => {
    const { registry, registration, element } = fixture();
    const table = element("table", "table", `${registry.scopeId}.area`, 4);
    const column = (suffix, order) => ({ ...element(suffix, "tableColumn", table.id, order), columnRole: "contentColumn" });
    const oneColumn = { ...registry, elements: [...registry.elements, table, column("column-one", 5)] };
    assert.equal(validateCandidate({ ...registration, candidateRegistry: oneColumn }).ok, false);
    assert.throws(() => mergeAdditiveRegistry(registry, oneColumn, [table.id, oneColumn.elements.at(-1).id]), { code: "pdf_registry_sync_invalid" });
    const twoColumns = { ...oneColumn, elements: [...oneColumn.elements, column("column-two", 6)] };
    assert.equal(validateCandidate({ ...registration, candidateRegistry: twoColumns }).ok, true);
    const record = createAcceptedRecord(registration, twoColumns, null, oneColumn.elements.map((entry) => entry.id));
    assert.throws(() => createEffectiveRegistry(record), { code: "pdf_registry_active_projection_invalid" });
  });

  await run("Fixed-layout PDF: omitted layout model keeps legacy tabular validation and fingerprints", () => {
    const { getBbmPdfRegistry } = require("../../src/main/ui-editor/bbmPdfAdapter.cjs");
    const registry = getBbmPdfRegistry();
    const explicit = { ...registry, layoutModel: "tabular" };
    assert.equal(createPdfRegistryFingerprint(explicit), createPdfRegistryFingerprint(registry));
    assert.equal(persistedRegistryFingerprint(explicit), persistedRegistryFingerprint(registry));
    const registration = { ...fixture().registration, documentTypeId: registry.documentTypeId, scopeId: registry.scopeId, candidateRegistry: explicit };
    assert.equal(analyzePdfDocumentType(registration, createAcceptedRecord(registration, registry)).status, "available");
    const fixed = fixture();
    delete fixed.registry.layoutModel;
    assert.equal(validateCandidate(fixed.registration).ok, false);
  });

  await run("Fixed-layout PDF: saved neutral state restores and additive profile migration retains positions", () => {
    const { registry, element } = fixture();
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-fixed-profile-"));
    try {
      const adapter = adapterFor(registry);
      const filePath = adapter.configureProfileRoot(root);
      const state = adapter.getCurrentPdfLayoutState();
      state.elements.find((entry) => entry.elementId.endsWith(".value")).x = 24;
      const document = { schemaVersion: 1, documentKind: "pdf-layout-profile", applicationId: registry.applicationId, documentType: registry.documentTypeId, profileId: "pdf-standard", scopeId: registry.scopeId, registryFingerprint: persistedRegistryFingerprint(registry), layoutState: state };
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const legacyModelFingerprint = persistedRegistryFingerprint({ ...registry, layoutModel: "tabular" });
      assert.notEqual(document.registryFingerprint, legacyModelFingerprint);
      fs.writeFileSync(filePath, JSON.stringify({ ...document, registryFingerprint: legacyModelFingerprint }));
      assert.throws(() => adapter.getPersistedPdfLayoutState(), { code: "pdf_layout_incompatible" });
      fs.writeFileSync(filePath, JSON.stringify(document));
      assert.equal(adapter.getPersistedPdfLayoutState().elements.at(-1).x, 24);
      const next = { ...registry, registryVersion: 2, elements: [...registry.elements, element("added", "value", `${registry.scopeId}.area`, 4)] };
      const nextAdapter = adapterFor(next);
      nextAdapter.configureProfileRoot(root);
      assert.equal(nextAdapter.reconcilePersistedProfile(registry).migrated, true);
      assert.equal(nextAdapter.getPersistedPdfLayoutState().elements.find((entry) => entry.elementId.endsWith(".value")).x, 24);
      const changedPage = { ...next, pageSettings: { ...next.pageSettings, format: "A4", width: 297, height: 210 } };
      const incompatible = adapterFor(changedPage);
      incompatible.configureProfileRoot(root);
      const before = fs.readFileSync(filePath, "utf8");
      assert.notEqual(persistedRegistryFingerprint(changedPage), persistedRegistryFingerprint(next));
      assert.throws(() => incompatible.getPersistedPdfLayoutState(), { code: "pdf_layout_incompatible" });
      assert.throws(() => incompatible.reconcilePersistedProfile(next), { code: "pdf_layout_incompatible" });
      assert.throws(() => nextAdapter.reconcilePersistedProfile({ ...next, layoutModel: "tabular" }), { code: "pdf_layout_incompatible" });
      assert.equal(fs.readFileSync(filePath, "utf8"), before);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
}

module.exports = { runFixedLayoutPdfRegistryTests };
