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
    assert.equal(registry.elements.length, 35);
    assert.deepEqual(registry.pageSettings, {
      format: "A4", orientation: "portrait", width: 210, height: 297,
      margins: { top: 5, right: 12, bottom: 0, left: 12 },
    });
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
      ["Spalte Name", "Spalte Funktion", "Spalte Firma", "Spalte Telefon / E-Mail", "Spalte Anwesend / Verteiler",
        "Spalte TOP", "Spalte Gegenstand", "Spalte Status / Fertig bis / verantw"]);
    const participants = byId.get(`${SCOPE_ID}.participants`);
    assert.equal(participants.kind, "table");
    assert.equal(participants.boundaryResizePolicy, "adjacentPreserveTotal");
    assert.deepEqual(["name", "function", "company", "contact", "attendance"].map((suffix) => {
      const column = byId.get(`${SCOPE_ID}.participants.column.${suffix}`);
      return [column.parentId, column.columnRole, column.baseline.x, column.baseline.width];
    }), [
      [participants.id, "contentColumn", 12, 34],
      [participants.id, "contentColumn", 46, 32],
      [participants.id, "contentColumn", 78, 30],
      [participants.id, "contentColumn", 108, 72],
      [participants.id, "metaColumn", 180, 18],
    ]);
    assert.equal(byId.get(`${SCOPE_ID}.participants.heading.attendance`).parentId, `${SCOPE_ID}.participants.column.attendance`);
    assert.equal(byId.get(`${SCOPE_ID}.tops`).boundaryResizePolicy, "adjacentPreserveTotal");
    assert.ok(byId.get(`${SCOPE_ID}.tops`).capabilities.includes("resizeColumnBoundary"));
    for (const suffix of ["number", "text", "meta"]) {
      const column = byId.get(`${SCOPE_ID}.tops.column.${suffix}`);
      const heading = byId.get(`${SCOPE_ID}.tops.heading.${suffix}`);
      assert.deepEqual(column.capabilities, ["resizeWidth", "setVisibility"]);
      assert.equal(heading.parentId, column.id);
      assert.deepEqual(heading.capabilities, ["textMove", "textResize", "setTextAlignment", "setVisibility"]);
    }
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
    assert.equal(submit("page-invalid", "move", { x: 160, y: 15 }).errorCode, "pdf_out_of_usable_width");
    assert.equal(submit("page-font", "textResize", { text: { fontSize: 11 } }).newState.fontSize, 11);
    assert.equal(submit("page-hide", "setVisibility", { visible: false }).newState.visible, false);
    const current = adapter.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === elementId);
    assert.deepEqual({ x: current.x, y: current.y, fontSize: current.fontSize, visible: current.visible },
      { x: 158, y: 15, fontSize: 11, visible: false });
  });

  await run("M81 Ausrichtung, Sichtbarkeit, Zeilenabstand, Rand und Spaltenbedienung sind capability-gesteuert", () => {
    const adapter = createBbmPdfAdapter();
    const submit = (elementId, operation, payload) => adapter.submitPdfChangeRequest({ changeId: `${operation}-1`, scopeId: SCOPE_ID, elementId, operation, payload });
    assert.equal(submit(`${SCOPE_ID}.header.title`, "setTextAlignment", { textAlignment: "center" }).newState.textAlignment, "center");
    assert.equal(submit(`${SCOPE_ID}.header.title`, "setLineSpacing", { lineSpacing: 1.4 }).newState.lineSpacing, 1.4);
    assert.equal(submit(`${SCOPE_ID}.closing`, "setVisibility", { visible: false }).newState.visible, false);
    assert.equal(submit(`${SCOPE_ID}.page-template`, "setPageMargins", { marginTop: 5, marginRight: 12, marginBottom: 7, marginLeft: 12 }).newState.marginTop, 5);
    assert.equal(submit(`${SCOPE_ID}.tops.column.text`, "move", { x: 37.18, y: 91 }).errorCode, "pdf_operation_locked");
    assert.equal(submit(`${SCOPE_ID}.tops.column.text`, "setVisibility", { visible: false }).newState.visible, false);
    assert.equal(submit(`${SCOPE_ID}.tops.heading.text`, "textMove", { text: { offsetX: 1, offsetY: 0.5 } }).newState.textOffsetX, 1);
  });

  await run("M81 innere PDF-Spaltengrenze aendert genau zwei Nachbarn atomar bei fester Gesamtsumme", () => {
    const adapter = createBbmPdfAdapter();
    const tableId = `${SCOPE_ID}.tops`;
    const textId = `${SCOPE_ID}.tops.column.text`;
    const metaId = `${SCOPE_ID}.tops.column.meta`;
    const request = (changeId, delta, leftColumnId = textId, rightColumnId = metaId) => adapter.submitPdfChangeRequest({
      changeId, scopeId: SCOPE_ID, elementId: tableId, operation: "resizeColumnBoundary",
      payload: { table: { leftColumnId, rightColumnId, delta } },
    });
    const before = adapter.getCurrentPdfLayoutState();
    const beforeById = new Map(before.elements.map((entry) => [entry.elementId, entry]));
    const right = request("boundary-right", 1);
    assert.equal(right.success, true, right.message);
    assert.deepEqual(right.affectedStates.map((entry) => [entry.elementId, entry.width]), [[textId, 121.9], [metaId, 39.92]]);
    let current = new Map(adapter.getCurrentPdfLayoutState().elements.map((entry) => [entry.elementId, entry]));
    assert.equal(current.get(textId).width + current.get(metaId).width, beforeById.get(textId).width + beforeById.get(metaId).width);
    assert.equal([`${SCOPE_ID}.tops.column.number`, textId, metaId].reduce((sum, id) => sum + current.get(id).width, 0), current.get(tableId).width);

    const left = request("boundary-left", -1);
    assert.equal(left.success, true, left.message);
    current = new Map(adapter.getCurrentPdfLayoutState().elements.map((entry) => [entry.elementId, entry]));
    assert.equal(current.get(textId).width, beforeById.get(textId).width);
    assert.equal(current.get(metaId).width, beforeById.get(metaId).width);
    assert.equal(request("not-adjacent", 1, `${SCOPE_ID}.tops.column.number`, metaId).errorCode, "pdf_invalid_table_boundary");
    assert.equal(request("below-minimum", 40).errorCode, "pdf_invalid_column_width");
  });

  await run("M81 Nutzflaeche und Teilnehmertracks werden generisch und atomar geschuetzt", () => {
    const adapter = createBbmPdfAdapter();
    const tableId = `${SCOPE_ID}.participants`;
    const contactId = `${tableId}.column.contact`;
    const attendanceId = `${tableId}.column.attendance`;
    const submit = (changeId, elementId, operation, payload) => adapter.submitPdfChangeRequest({
      changeId, scopeId: SCOPE_ID, elementId, operation, payload,
    });
    const initial = adapter.getCurrentPdfLayoutState();
    const horizontalMessage = "Maximale Seitenbreite erreicht. Bitte zuerst in den PDF-Einstellungen den linken oder rechten Seitenrand verkleinern.";
    const verticalMessage = "Maximale Seitenhöhe erreicht. Bitte zuerst in den PDF-Einstellungen den oberen oder unteren Seitenrand verkleinern.";

    const tooWide = submit("participants-too-wide", tableId, "resizeWidth", { width: 187 });
    assert.deepEqual([tooWide.success, tooWide.errorCode, tooWide.message], [false, "pdf_out_of_usable_width", horizontalMessage]);
    assert.deepEqual(adapter.getCurrentPdfLayoutState().elements, initial.elements);
    const movedIntoMargin = submit("participants-move-right", tableId, "move", { x: 13, y: 56 });
    assert.deepEqual([movedIntoMargin.success, movedIntoMargin.errorCode, movedIntoMargin.message], [false, "pdf_out_of_usable_width", horizontalMessage]);
    assert.deepEqual(adapter.getCurrentPdfLayoutState().elements, initial.elements);

    const shrink = submit("participants-shrink", tableId, "resizeWidth", { width: 185 });
    assert.equal(shrink.success, true, shrink.message);
    assert.deepEqual(shrink.affectedStates.map((entry) => [entry.elementId, entry.width]), [[tableId, 185], [attendanceId, 17]]);
    const growToEdge = submit("participants-grow-to-edge", tableId, "resizeWidth", { width: 186 });
    assert.equal(growToEdge.success, true, growToEdge.message);
    assert.deepEqual(growToEdge.affectedStates.map((entry) => [entry.elementId, entry.width]), [[tableId, 186], [attendanceId, 18]]);

    const boundary = (changeId, delta) => submit(changeId, tableId, "resizeColumnBoundary", {
      table: { leftColumnId: contactId, rightColumnId: attendanceId, delta },
    });
    assert.deepEqual(boundary("participants-boundary-right", 1).affectedStates.map((entry) => [entry.elementId, entry.width]),
      [[contactId, 73], [attendanceId, 17]]);
    assert.deepEqual(boundary("participants-boundary-left", -1).affectedStates.map((entry) => [entry.elementId, entry.width]),
      [[contactId, 72], [attendanceId, 18]]);
    const states = new Map(adapter.getCurrentPdfLayoutState().elements.map((entry) => [entry.elementId, entry]));
    const participantTotal = ["name", "function", "company", "contact", "attendance"]
      .reduce((sum, suffix) => sum + states.get(`${tableId}.column.${suffix}`).width, 0);
    assert.equal(participantTotal, states.get(tableId).width);

    const directColumnResize = submit("participants-direct-column", attendanceId, "resizeWidth", { width: 17 });
    assert.equal(directColumnResize.errorCode, "pdf_invalid_table_width");
    assert.equal(new Map(adapter.getCurrentPdfLayoutState().elements.map((entry) => [entry.elementId, entry])).get(attendanceId).width, 18);
    const tableBeforeHeading = states.get(tableId);
    assert.equal(submit("participants-heading", `${tableId}.heading.attendance`, "textMove", { text: { offsetX: 1, offsetY: 0 } }).success, true);
    assert.deepEqual(new Map(adapter.getCurrentPdfLayoutState().elements.map((entry) => [entry.elementId, entry])).get(tableId), tableBeforeHeading);

    const rightMargin = submit("participants-right-margin", `${SCOPE_ID}.page-template`, "setPageMargins",
      { marginTop: 5, marginRight: 13, marginBottom: 0, marginLeft: 12 });
    assert.deepEqual([rightMargin.errorCode, rightMargin.message], ["pdf_out_of_usable_width", horizontalMessage]);
    const topMargin = submit("participants-top-margin", `${SCOPE_ID}.page-template`, "setPageMargins",
      { marginTop: 6, marginRight: 12, marginBottom: 0, marginLeft: 12 });
    assert.deepEqual([topMargin.errorCode, topMargin.message], ["pdf_out_of_usable_height", verticalMessage]);
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
      assert.equal(adapter.readPersistedPdfLayoutState(), null);

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
    assert.match(printIpc, /p\.pdfEditorPreview === true[\s\S]*getCurrentPdfLayoutState\(\)[\s\S]*readPersistedPdfLayoutState\(\)/);
    assert.match(printIpc, /catch \(error\)[\s\S]*Editorprofil wird beim Produktdruck ignoriert/);
    assert.match(renderer, /pdf\.bbm\.protocol/);
    assert.doesNotMatch([printIpc, renderer, nativeEditor].join("\n"), /ReferenceOrderFactory/);
    assert.doesNotMatch([printIpc, renderer].join("\n"), /https?:|WebSocket|fetch\s*\(/i);
  });
}

module.exports = { runM81BbmPdfAdapterTests };
