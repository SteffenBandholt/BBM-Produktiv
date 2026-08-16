"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

async function runM81BbmPdfAdapterTests(run) {
  const { createBbmPdfAdapter, getBbmPdfRegistry, SCOPE_ID, REGISTRY_FINGERPRINT, PERSISTED_REGISTRY_FINGERPRINT } = require("../../src/main/ui-editor/bbmPdfAdapter.cjs");
  const registry = getBbmPdfRegistry();
  const byId = new Map(registry.elements.map((entry) => [entry.id, entry]));

  await run("M81 BBM-PDF-Registry ist explizit, vollstaendig und deterministisch", () => {
    assert.equal(registry.scopeId, "pdf.bbm.protocol");
    assert.equal(registry.elements.length, 28);
    assert.equal(new Set(registry.elements.map((entry) => entry.id)).size, registry.elements.length);
    registry.elements.filter((entry) => entry.parentId).forEach((entry) => assert.ok(byId.has(entry.parentId), entry.id));
    for (const kind of ["document", "page", "area", "header", "footer", "group", "label", "value", "table", "tableColumn", "repeatingArea"])
      assert.ok(registry.elements.some((entry) => entry.kind === kind), kind);
    assert.equal(registry.registryFingerprint, REGISTRY_FINGERPRINT);
    assert.match(REGISTRY_FINGERPRINT, /^sha256:[a-f0-9]{64}$/);
    assert.match(PERSISTED_REGISTRY_FINGERPRINT, /^[a-f0-9]{64}$/);
  });

  await run("M81 Labels, Werte, Tabellenkopf, Inhalt und drei echte TOP-Spalten sind getrennt", () => {
    assert.notEqual(byId.get(`${SCOPE_ID}.header.project.label`).id, byId.get(`${SCOPE_ID}.header.project.value`).id);
    assert.notEqual(byId.get(`${SCOPE_ID}.footer.label`).id, byId.get(`${SCOPE_ID}.footer.value`).id);
    assert.notEqual(byId.get(`${SCOPE_ID}.header.meta.page-label`).id, byId.get(`${SCOPE_ID}.header.meta.page-value`).id);
    assert.equal(byId.get(`${SCOPE_ID}.header.meta.page-label`).rendererKey, ".v2MiniPageLabel");
    assert.equal(byId.get(`${SCOPE_ID}.header.meta.page-value`).rendererKey, ".v2MiniPageValue");
    assert.ok(byId.has(`${SCOPE_ID}.tops.header`));
    assert.ok(byId.has(`${SCOPE_ID}.tops.rows`));
    assert.deepEqual(registry.elements.filter((entry) => entry.kind === "tableColumn").map((entry) => entry.name),
      ["Spalte TOP", "Spalte Gegenstand", "Spalte Status / Fertig bis / verantw"]);
  });

  await run("M81 Registry und Vertrag enthalten keine Fachwerte oder freie Ausgabepfade", () => {
    const serialized = JSON.stringify(registry);
    for (const key of ["projectData", "meetingData", "rows", "records", "statusValue", "responsibleValue", "dueDate", "filePath", "outputPath"])
      assert.equal(serialized.includes(`"${key}"`), false, key);
    registry.elements.forEach((entry) => {
      for (const operation of ["changeText", "changeValue", "modifyDomainData", "changeStatus", "changeDueDate", "changeResponsible"])
        assert.ok(entry.lockedOps.includes(operation), `${entry.id}:${operation}`);
    });
  });

  await run("M81 Adapter wendet Layout an, liest zurueck und markiert Vorschau veraltet", () => {
    const adapter = createBbmPdfAdapter();
    adapter.setActiveDocumentContext({ projectId: "p1", meetingId: "m1" });
    const request = { changeId: "c1", scopeId: SCOPE_ID, elementId: `${SCOPE_ID}.header.title`, operation: "textResize", payload: { text: { fontSize: 15 } } };
    const result = adapter.submitPdfChangeRequest(request);
    assert.equal(result.success, true);
    assert.equal(result.newState.fontSize, 15);
    assert.equal(adapter.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === request.elementId).fontSize, 15);
    assert.equal(adapter.getPreviewMetadata().stale, true);
  });

  await run("M81 Seitenwert ist eigenstaendig verschiebbar, skalierbar und ausblendbar", () => {
    const adapter = createBbmPdfAdapter();
    const elementId = `${SCOPE_ID}.header.meta.page-value`;
    const submit = (changeId, operation, payload) => adapter.submitPdfChangeRequest({ changeId, scopeId: SCOPE_ID, elementId, operation, payload });
    assert.equal(submit("page-move", "move", { x: 158, y: 15 }).newState.x, 158);
    assert.equal(submit("page-invalid", "move", { x: 160, y: 15 }).errorCode, "pdf_invalid_page_zone");
    assert.equal(submit("page-font", "textResize", { text: { fontSize: 11 } }).newState.fontSize, 11);
    assert.equal(submit("page-hide", "setVisibility", { visible: false }).newState.visible, false);
    const current = adapter.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === elementId);
    assert.deepEqual({ x: current.x, y: current.y, fontSize: current.fontSize, visible: current.visible },
      { x: 158, y: 15, fontSize: 11, visible: false });
  });

  await run("M81 Ausrichtung, Sichtbarkeit, Zeilenabstand, Rand und Spaltenbreite sind capability-gesteuert", () => {
    const adapter = createBbmPdfAdapter();
    const submit = (elementId, operation, payload) => adapter.submitPdfChangeRequest({ changeId: `${operation}-1`, scopeId: SCOPE_ID, elementId, operation, payload });
    assert.equal(submit(`${SCOPE_ID}.header.title`, "setTextAlignment", { textAlignment: "center" }).newState.textAlignment, "center");
    assert.equal(submit(`${SCOPE_ID}.header.title`, "setLineSpacing", { lineSpacing: 1.4 }).newState.lineSpacing, 1.4);
    assert.equal(submit(`${SCOPE_ID}.closing`, "setVisibility", { visible: false }).newState.visible, false);
    assert.equal(submit(`${SCOPE_ID}.page-template`, "setPageMargins", { marginTop: 5, marginRight: 12, marginBottom: 8, marginLeft: 12 }).newState.marginTop, 5);
    assert.equal(submit(`${SCOPE_ID}.tops.column.text`, "resizeWidth", { width: 120 }).newState.width, 120);
    assert.equal(submit(`${SCOPE_ID}.tops.column.text`, "setVisibility", { visible: false }).errorCode, "pdf_operation_locked");
  });

  await run("M81 Applyfehler laesst vorherigen Zustand als erfolgreichen Rollback stehen", () => {
    const adapter = createBbmPdfAdapter();
    const before = adapter.getCurrentPdfLayoutState();
    adapter.failNextApply();
    const result = adapter.submitPdfChangeRequest({ changeId: "fail", scopeId: SCOPE_ID, elementId: `${SCOPE_ID}.header.title`, operation: "textResize", payload: { text: { fontSize: 18 } } });
    assert.equal(result.success, false);
    assert.equal(result.rollbackSucceeded, true);
    assert.deepEqual(adapter.getCurrentPdfLayoutState().elements, before.elements);
  });

  await run("M81 Reset, Discard und Restore nutzen denselben neutralen LayoutState", () => {
    const adapter = createBbmPdfAdapter();
    const baseline = adapter.getCurrentPdfLayoutState();
    adapter.submitPdfChangeRequest({ changeId: "x", scopeId: SCOPE_ID, elementId: `${SCOPE_ID}.header.title`, operation: "textResize", payload: { text: { fontSize: 15 } } });
    const changed = adapter.getCurrentPdfLayoutState();
    adapter.replaceCurrentPdfLayoutState(baseline);
    assert.equal(adapter.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === `${SCOPE_ID}.header.title`).fontSize, 12.5);
    adapter.replaceCurrentPdfLayoutState(changed);
    assert.equal(adapter.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === `${SCOPE_ID}.header.title`).fontSize, 15);
  });

  await run("M81 normaler Produktweg liest ausschliesslich das gespeicherte PDF-Profil", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-pdf-product-profile-"));
    try {
      const adapter = createBbmPdfAdapter();
      const profilePath = adapter.configureProfileRoot(root);
      assert.equal(adapter.getPersistedPdfLayoutState().elements.find((entry) => entry.elementId === `${SCOPE_ID}.header.meta.page-value`).visible, true);

      const pageValueId = `${SCOPE_ID}.header.meta.page-value`;
      const submit = (changeId, operation, payload) => adapter.submitPdfChangeRequest({ changeId, scopeId: SCOPE_ID, elementId: pageValueId, operation, payload });
      assert.equal(submit("saved-move", "move", { x: 158, y: 14 }).success, true);
      assert.equal(submit("saved-font", "textResize", { text: { fontSize: 11 } }).success, true);
      assert.equal(submit("saved-hide", "setVisibility", { visible: false }).success, true);
      const savedState = adapter.getCurrentPdfLayoutState();
      const persistedFields = (definition) => {
        const capabilities = new Set(definition.capabilities || []);
        return [
          ...(capabilities.has("move") ? ["x", "y"] : []),
          ...(capabilities.has("resize") || capabilities.has("resizeWidth") ? ["width"] : []),
          ...(capabilities.has("resize") || capabilities.has("resizeHeight") ? ["height"] : []),
          ...(capabilities.has("textMove") ? ["textOffsetX", "textOffsetY"] : []),
          ...(capabilities.has("textResize") ? ["fontSize"] : []),
          ...(capabilities.has("setTextAlignment") ? ["textAlignment"] : []),
          ...(capabilities.has("setLineSpacing") ? ["lineSpacing"] : []),
          ...(capabilities.has("setVisibility") ? ["visible"] : []),
          ...(capabilities.has("setPageMargins") ? ["marginTop", "marginRight", "marginBottom", "marginLeft"] : []),
        ];
      };
      const persistedState = {
        ...savedState,
        elements: savedState.elements.map((entry) => {
          const definition = byId.get(entry.elementId);
          return Object.fromEntries(["elementId", "scopeId", ...persistedFields(definition)].map((field) => [field, entry[field]]));
        }),
      };
      const document = {
        schemaVersion: 1,
        documentKind: "pdf-layout-profile",
        applicationId: "bbm-produktiv",
        documentType: "protocol",
        profileId: "pdf-standard",
        scopeId: SCOPE_ID,
        savedAt: "2026-08-16T12:00:00.000Z",
        registryFingerprint: PERSISTED_REGISTRY_FINGERPRINT,
        layoutState: persistedState,
      };
      fs.mkdirSync(path.dirname(profilePath), { recursive: true });
      fs.writeFileSync(profilePath, JSON.stringify(document), "utf8");

      adapter.replaceCurrentPdfLayoutState({
        ...savedState,
        elements: savedState.elements.map((entry) => entry.elementId === pageValueId ? { ...entry, x: 159, fontSize: 9, visible: true } : entry),
      });
      const persisted = adapter.getPersistedPdfLayoutState().elements.find((entry) => entry.elementId === pageValueId);
      assert.deepEqual({ x: persisted.x, y: persisted.y, fontSize: persisted.fontSize, visible: persisted.visible },
        { x: 158, y: 14, fontSize: 11, visible: false });
      const working = adapter.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === pageValueId);
      assert.deepEqual({ x: working.x, fontSize: working.fontSize, visible: working.visible }, { x: 159, fontSize: 9, visible: true });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  await run("M81 inkompatibles gespeichertes PDF-Profil wird nicht stillschweigend gedruckt", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-pdf-invalid-profile-"));
    try {
      const adapter = createBbmPdfAdapter();
      const profilePath = adapter.configureProfileRoot(root);
      const layoutState = { ...adapter.getCurrentPdfLayoutState(), elements: registry.elements.map((definition) => ({
        elementId: definition.id,
        scopeId: SCOPE_ID,
        ...Object.fromEntries((definition.capabilities || []).flatMap((capability) => ({
          move: ["x", "y"], resize: ["width", "height"], resizeWidth: ["width"], resizeHeight: ["height"],
          textMove: ["textOffsetX", "textOffsetY"], textResize: ["fontSize"], setTextAlignment: ["textAlignment"],
          setLineSpacing: ["lineSpacing"], setVisibility: ["visible"],
          setPageMargins: ["marginTop", "marginRight", "marginBottom", "marginLeft"],
        }[capability] || [])).map((field) => [field, definition.baseline[field]])),
      })) };
      fs.mkdirSync(path.dirname(profilePath), { recursive: true });
      fs.writeFileSync(profilePath, JSON.stringify({
        schemaVersion: 1, documentKind: "pdf-layout-profile", applicationId: "bbm-produktiv", documentType: "protocol",
        profileId: "pdf-standard", scopeId: SCOPE_ID, savedAt: "2026-08-16T12:00:00.000Z",
        registryFingerprint: "sha256:incompatible", layoutState,
      }), "utf8");
      assert.throws(() => adapter.getPersistedPdfLayoutState(), (error) => error?.code === "pdf_layout_incompatible");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  await run("M81 explizite Neuerzeugung aktualisiert Seitenzahl und nur BBM-kontrollierten Pfad", async () => {
    const adapter = createBbmPdfAdapter({ regenerate: async () => ({ pageCount: 3, controlledOutputPath: path.join(ROOT, ".m81-controlled-preview.pdf"), generatedAt: "2026-01-01T00:00:00.000Z", renderBounds: [] }) });
    assert.equal(adapter.getPdfContract(), null);
    const context = adapter.setActiveDocumentContext({ projectId: "projekt", meetingId: "protokoll" });
    assert.equal(context.pdfRegistryStatus, "available");
    const contract = adapter.getPdfContract();
    assert.equal(contract.pdfRegistryStatus, "available");
    assert.equal(contract.activeDocumentId.includes("projekt"), false);
    const preview = await adapter.regeneratePdfPreview();
    assert.equal(preview.stale, false);
    assert.equal(preview.pageCount, 3);
    assert.equal(preview.generation, 1);
  });

  await run("M81 nutzt echten BBM-printToPDF-Pfad und kein ReferenceOrder-Modell", () => {
    const printIpc = read("src/main/ipc/printIpc.js");
    const renderer = read("src/renderer/print/pdfEditorLayout.js");
    const nativeEditor = read("../UI-Editor-kit/reference-target-app/src/ReferenceTargetApp.Wpf/UI/Editor/ElectronTargetEditor.cs");
    assert.match(printIpc, /generatePdfForUiEditor/);
    assert.match(printIpc, /printToPDF/);
    assert.match(printIpc, /data\.mode === "protocol"/);
    assert.match(printIpc, /p\.pdfEditorPreview === true[\s\S]*getCurrentPdfLayoutState\(\)[\s\S]*getPersistedPdfLayoutState\(\)/);
    assert.match(renderer, /pdf\.bbm\.protocol/);
    assert.doesNotMatch([printIpc, renderer, nativeEditor].join("\n"), /ReferenceOrderFactory/);
    assert.doesNotMatch([printIpc, renderer].join("\n"), /https?:|WebSocket|fetch\s*\(/i);
  });
}

module.exports = { runM81BbmPdfAdapterTests };
