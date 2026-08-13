"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

async function runM81BbmPdfAdapterTests(run) {
  const { createBbmPdfAdapter, getBbmPdfRegistry, SCOPE_ID, REGISTRY_FINGERPRINT } = require("../../src/main/ui-editor/bbmPdfAdapter.cjs");
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
  });

  await run("M81 Labels, Werte, Tabellenkopf, Inhalt und drei echte TOP-Spalten sind getrennt", () => {
    assert.notEqual(byId.get(`${SCOPE_ID}.header.project.label`).id, byId.get(`${SCOPE_ID}.header.project.value`).id);
    assert.notEqual(byId.get(`${SCOPE_ID}.footer.label`).id, byId.get(`${SCOPE_ID}.footer.value`).id);
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

  await run("K17 BBM-PDF verschiebt eine echte Spaltengrenze atomar bei fester Gesamtbreite", () => {
    const table = byId.get(`${SCOPE_ID}.tops`);
    assert.equal(table.boundaryResizePolicy, "adjacentPreserveTotal");
    assert.ok(table.capabilities.includes("resizeColumnBoundary"));
    const adapter = createBbmPdfAdapter();
    const before = new Map(adapter.getCurrentPdfLayoutState().elements.map((entry) => [entry.elementId, entry]));
    const result = adapter.submitPdfChangeRequest({
      changeId: "boundary-text-meta", scopeId: SCOPE_ID, elementId: table.id, operation: "resizeColumnBoundary",
      payload: { table: { leftColumnId: `${SCOPE_ID}.tops.column.text`, rightColumnId: `${SCOPE_ID}.tops.column.meta`, delta: 5 } },
    });
    assert.equal(result.success, true, result.message);
    assert.deepEqual(result.affectedStates.map((entry) => entry.elementId), [`${SCOPE_ID}.tops.column.text`, `${SCOPE_ID}.tops.column.meta`]);
    const after = new Map(adapter.getCurrentPdfLayoutState().elements.map((entry) => [entry.elementId, entry]));
    assert.equal(after.get(`${SCOPE_ID}.tops.column.number`).width, before.get(`${SCOPE_ID}.tops.column.number`).width);
    assert.equal(after.get(`${SCOPE_ID}.tops.column.text`).width, 125.9);
    assert.equal(after.get(`${SCOPE_ID}.tops.column.meta`).width, 35.92);
    assert.equal(["number", "text", "meta"].reduce((sum, key) => sum + after.get(`${SCOPE_ID}.tops.column.${key}`).width, 0), 186);
  });

  await run("K17 BBM-PDF weist Mindestbreitenverletzung ohne Teilzustand ab", () => {
    const adapter = createBbmPdfAdapter();
    const baseline = adapter.getCurrentPdfLayoutState();
    const result = adapter.submitPdfChangeRequest({
      changeId: "boundary-too-far", scopeId: SCOPE_ID, elementId: `${SCOPE_ID}.tops`, operation: "resizeColumnBoundary",
      payload: { table: { leftColumnId: `${SCOPE_ID}.tops.column.text`, rightColumnId: `${SCOPE_ID}.tops.column.meta`, delta: 11 } },
    });
    assert.equal(result.success, false);
    assert.equal(result.errorCode, "pdf_out_of_page_bounds");
    assert.deepEqual(adapter.getCurrentPdfLayoutState().elements, baseline.elements);
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
    adapter.submitPdfChangeRequest({ changeId: "x", scopeId: SCOPE_ID, elementId: `${SCOPE_ID}.footer`, operation: "resizeWidth", payload: { width: 180 } });
    const changed = adapter.getCurrentPdfLayoutState();
    adapter.replaceCurrentPdfLayoutState(baseline);
    assert.equal(adapter.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === `${SCOPE_ID}.footer`).width, 186);
    adapter.replaceCurrentPdfLayoutState(changed);
    assert.equal(adapter.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === `${SCOPE_ID}.footer`).width, 180);
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
    assert.match(renderer, /pdf\.bbm\.protocol/);
    assert.doesNotMatch([printIpc, renderer, nativeEditor].join("\n"), /ReferenceOrderFactory/);
    assert.doesNotMatch([printIpc, renderer].join("\n"), /https?:|WebSocket|fetch\s*\(/i);
  });
}

module.exports = { runM81BbmPdfAdapterTests };
