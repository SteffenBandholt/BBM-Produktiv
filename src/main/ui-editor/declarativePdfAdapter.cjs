"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  PDF_TARGET_CONTRACT_VERSION,
  PDF_TARGET_OPERATIONS,
  createPdfRegistryFingerprint,
  validatePdfRegistry,
  validatePdfTargetContract,
} = require("ui-editor-kit");

function clone(value) { return value == null ? value : structuredClone(value); }

function persistedRegistryFingerprint(registry) {
  const kindNames = { document: "Document", page: "Page", area: "Area", group: "Group", text: "Text", label: "Label", value: "Value", image: "Image", table: "Table", tableColumn: "TableColumn", repeatingArea: "RepeatingArea", header: "Header", footer: "Footer" };
  const roleNames = { layout: "Layout", content: "Content", meta: "Meta", structure: "Structure", date: "Date", fieldLabel: "FieldLabel", heading: "Heading", columnHeader: "ColumnHeader" };
  const pageAreaNames = { document: "Document", header: "Header", body: "Body", footer: "Footer" };
  const capabilityNames = [["move", "Position"], ["resizeWidth", "Width"], ["resizeHeight", "Height"], ["textMove", "TextPosition"], ["textResize", "FontSize"], ["setTextAlignment", "TextAlignment"], ["setLineSpacing", "LineSpacing"], ["setVisibility", "Visibility"], ["setPageMargins", "PageMargins"]];
  const canonical = [...registry.elements].sort((a, b) => a.id.localeCompare(b.id)).map((entry) => {
    const operations = new Set(entry.capabilities || entry.allowedOps || []);
    if (operations.has("resize")) { operations.add("resizeWidth"); operations.add("resizeHeight"); }
    return [entry.id, entry.scopeId, entry.parentId || "", kindNames[entry.kind], roleNames[entry.role] || "Content", capabilityNames.filter(([operation]) => operations.has(operation)).map(([, name]) => name).join(","), pageAreaNames[entry.pageArea] || "Body", String(entry.order), entry.boundaryResizePolicy || ""].join("|");
  }).join("\n");
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

function persistedFields(definition) {
  const capabilities = new Set(definition.capabilities || definition.allowedOps || []);
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
}

function profileState(registry) {
  return {
    scopeId: registry.scopeId,
    capturedAt: new Date().toISOString(),
    elements: registry.elements.map((entry) => ({ elementId: entry.id, scopeId: registry.scopeId, ...clone(entry.baseline) })),
  };
}

function profileFileName(applicationId, documentTypeId) {
  return `${applicationId}.${documentTypeId}.pdf-standard.pdf-layout.json`;
}

function profileHistoryFileName(applicationId, documentTypeId) {
  return `${applicationId}.${documentTypeId}.pdf-standard.pdf-layout-history.json`;
}

function createDeclarativePdfAdapter({ applicationId = "bbm-produktiv", documentTypeId, displayName, registry, documentIdentityFields = ["projectId"] } = {}) {
  const normalizedRegistry = { ...clone(registry), registryFingerprint: registry?.registryFingerprint || createPdfRegistryFingerprint(registry) };
  const validation = validatePdfRegistry(normalizedRegistry);
  if (!validation.ok) throw Object.assign(new TypeError("Deklarative PDF-Registry ist ungueltig."), { code: "pdf_registry_invalid", validationErrors: validation.errors });
  if (normalizedRegistry.documentTypeId !== documentTypeId) throw new TypeError("PDF-Descriptor und Dokumenttyp stimmen nicht ueberein.");
  const definitions = new Map(normalizedRegistry.elements.map((entry) => [entry.id, entry]));
  let working = profileState(normalizedRegistry);
  let profileRoot = null;
  let context = null;
  let regenerateHandler = null;
  let preview = { state: "missing", stale: true, generation: 0, pageCount: 0, generatedAt: null, activeDocumentId: "", controlledOutputPath: null, renderBounds: [] };

  function getPdfProfilePath() {
    return profileRoot ? path.join(profileRoot, "pdf-layouts", profileFileName(applicationId, documentTypeId)) : null;
  }

  function getPdfProfileHistoryPath() {
    return profileRoot ? path.join(profileRoot, "pdf-layouts", profileHistoryFileName(applicationId, documentTypeId)) : null;
  }

  function readHistoricalProfileStates() {
    const historyPath = getPdfProfileHistoryPath();
    if (!historyPath || !fs.existsSync(historyPath)) return new Map();
    let document;
    try { document = JSON.parse(fs.readFileSync(historyPath, "utf8")); }
    catch (cause) { throw Object.assign(new Error("PDF-Layoutprofilhistorie konnte nicht gelesen werden."), { code: "pdf_profile_history_invalid", cause }); }
    if (document?.schemaVersion !== 1 || document?.documentKind !== "pdf-layout-profile-history" || document?.applicationId !== applicationId ||
        document?.documentType !== documentTypeId || document?.profileId !== "pdf-standard" || document?.scopeId !== normalizedRegistry.scopeId ||
        document?.layoutState?.scopeId !== normalizedRegistry.scopeId || !Array.isArray(document?.layoutState?.elements)) {
      throw Object.assign(new Error("PDF-Layoutprofilhistorie ist inkompatibel."), { code: "pdf_profile_history_invalid" });
    }
    return new Map(document.layoutState.elements.map((entry) => [entry.elementId, clone(entry)]));
  }

  function writeHistoricalProfileStates(states) {
    const historyPath = getPdfProfileHistoryPath();
    if (!historyPath || states.size === 0) return;
    const now = new Date().toISOString();
    const document = {
      schemaVersion: 1,
      documentKind: "pdf-layout-profile-history",
      applicationId,
      documentType: documentTypeId,
      profileId: "pdf-standard",
      scopeId: normalizedRegistry.scopeId,
      savedAt: now,
      layoutState: {
        scopeId: normalizedRegistry.scopeId,
        capturedAt: now,
        elements: [...states.values()].sort((left, right) => String(left.elementId).localeCompare(String(right.elementId))),
      },
    };
    fs.mkdirSync(path.dirname(historyPath), { recursive: true });
    const temporaryPath = `${historyPath}.tmp-${process.pid}-${Date.now()}`;
    try { fs.writeFileSync(temporaryPath, JSON.stringify(document), "utf8"); fs.renameSync(temporaryPath, historyPath); }
    finally { if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true }); }
  }

  function normalizePersistedState(document) {
    if (document?.schemaVersion !== 1 || document?.documentKind !== "pdf-layout-profile" || document?.applicationId !== applicationId ||
        document?.documentType !== documentTypeId || document?.profileId !== "pdf-standard" || document?.scopeId !== normalizedRegistry.scopeId ||
        ![normalizedRegistry.registryFingerprint, persistedRegistryFingerprint(normalizedRegistry)].includes(document?.registryFingerprint)) {
      throw Object.assign(new Error("PDF-Layoutprofil ist mit dem akzeptierten Descriptor nicht kompatibel."), { code: "pdf_layout_incompatible" });
    }
    const states = new Map((document.layoutState?.elements || []).map((entry) => [entry.elementId, entry]));
    if (states.size !== definitions.size) throw Object.assign(new Error("PDF-Layoutprofil ist unvollstaendig."), { code: "pdf_profile_invalid" });
    const normalized = {
      scopeId: normalizedRegistry.scopeId,
      capturedAt: document.layoutState.capturedAt,
      elements: normalizedRegistry.elements.map((definition) => {
        const stored = states.get(definition.id);
        if (!stored || stored.scopeId !== normalizedRegistry.scopeId) throw Object.assign(new Error(`PDF-Layout-Element fehlt: ${definition.id}`), { code: "pdf_profile_invalid" });
        const values = Object.fromEntries(persistedFields(definition).map((field) => [field, stored[field]]));
        return { elementId: definition.id, scopeId: normalizedRegistry.scopeId, ...clone(definition.baseline), ...values };
      }),
    };
    validateTableColumnGeometry(normalized, "pdf_profile_invalid");
    return normalized;
  }

  function getPersistedPdfLayoutState() {
    const filePath = getPdfProfilePath();
    if (!filePath) throw Object.assign(new Error("PDF-Profilwurzel fehlt."), { code: "pdf_profile_unavailable" });
    if (!fs.existsSync(filePath)) return profileState(normalizedRegistry);
    try { return normalizePersistedState(JSON.parse(fs.readFileSync(filePath, "utf8"))); }
    catch (error) {
      if (error?.code) throw error;
      throw Object.assign(new Error("PDF-Layoutprofil konnte nicht gelesen werden."), { code: "pdf_profile_invalid", cause: error });
    }
  }

  function readPersistedPdfLayoutState() {
    const filePath = getPdfProfilePath();
    if (!filePath || !fs.existsSync(filePath)) return null;
    return clone(getPersistedPdfLayoutState());
  }

  function reconcilePersistedProfile(previousRegistry) {
    const filePath = getPdfProfilePath();
    if (!filePath || !fs.existsSync(filePath)) return { migrated: false, addedElementIds: [] };
    const document = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const previousFingerprints = [previousRegistry.registryFingerprint || createPdfRegistryFingerprint(previousRegistry), persistedRegistryFingerprint(previousRegistry)];
    if (!previousFingerprints.includes(document?.registryFingerprint)) {
      throw Object.assign(new Error("Bestehendes PDF-Profil passt nicht zum zuvor akzeptierten Descriptor."), { code: "pdf_layout_incompatible" });
    }
    const oldStates = new Map((document.layoutState?.elements || []).map((entry) => [entry.elementId, entry]));
    const historicalStates = readHistoricalProfileStates();
    for (const [elementId, state] of oldStates) historicalStates.set(elementId, clone(state));
    const addedElementIds = normalizedRegistry.elements.filter((entry) => !oldStates.has(entry.id) && !historicalStates.has(entry.id)).map((entry) => entry.id);
    const activeIds = new Set(normalizedRegistry.elements.map((entry) => entry.id));
    const deactivatedElementIds = [...oldStates.keys()].filter((id) => !activeIds.has(id));
    const nextElements = normalizedRegistry.elements.map((definition) => {
      const previous = oldStates.get(definition.id) || historicalStates.get(definition.id) || {};
      return Object.fromEntries(["elementId", "scopeId", ...persistedFields(definition)].map((field) => {
        if (field === "elementId") return [field, definition.id];
        if (field === "scopeId") return [field, normalizedRegistry.scopeId];
        return [field, Object.hasOwn(previous, field) ? previous[field] : definition.baseline[field]];
      }));
    });
    const migrated = {
      ...document,
      savedAt: new Date().toISOString(),
      registryFingerprint: persistedRegistryFingerprint(normalizedRegistry),
      layoutState: { scopeId: normalizedRegistry.scopeId, capturedAt: new Date().toISOString(), elements: nextElements },
    };
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copyFileSync(filePath, `${filePath}.archive-${stamp}`);
    writeHistoricalProfileStates(historicalStates);
    const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
    try { fs.writeFileSync(temporaryPath, JSON.stringify(migrated), "utf8"); fs.renameSync(temporaryPath, filePath); }
    finally { if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true }); }
    working = normalizePersistedState(migrated);
    return { migrated: true, addedElementIds, deactivatedElementIds };
  }

  function activeDocumentId() {
    if (!context) return "";
    const values = documentIdentityFields.map((field) => String(context[field] || "").trim());
    if (values.some((value) => !value)) return "";
    return `${applicationId}-${documentTypeId}-${crypto.createHash("sha256").update(values.join("\0"), "utf8").digest("hex").slice(0, 24)}`;
  }

  function tableColumns(tableId) {
    return normalizedRegistry.elements.filter((entry) => entry.kind === "tableColumn" && entry.parentId === tableId).sort((a, b) => a.order - b.order);
  }

  function validateTableColumnGeometry(state, errorCode = "pdf_invalid_column_width") {
    const states = new Map((state?.elements || []).map((entry) => [entry.elementId, entry]));
    const pageWidth = Number(normalizedRegistry.pageSettings?.width);
    const rightMargin = Number(normalizedRegistry.pageSettings?.margins?.right || 0);
    const rightBoundary = pageWidth - rightMargin;
    for (const tableDefinition of normalizedRegistry.elements.filter((entry) => entry.kind === "table")) {
      const table = states.get(tableDefinition.id);
      const columns = tableColumns(tableDefinition.id);
      const widths = columns.map((column) => Number(states.get(column.id)?.width));
      const tableX = Number(table?.x ?? tableDefinition.baseline?.x);
      if (!table || widths.some((width) => !Number.isFinite(width) || width < 0)) {
        throw Object.assign(new Error("PDF-Spaltenbreiten muessen endlich und mindestens 0 mm sein."), { code: errorCode });
      }
      if (!Number.isFinite(tableX) || !Number.isFinite(rightBoundary) || tableX + widths.reduce((sum, width) => sum + width, 0) > rightBoundary + 0.000001) {
        throw Object.assign(new Error("PDF-Spaltensumme ueberschreitet die rechte Arbeitsbereichsgrenze."), { code: "pdf_out_of_page_bounds" });
      }
    }
  }

  function submitPdfChangeRequest(request = {}) {
    const definition = definitions.get(String(request.elementId || ""));
    const previous = working.elements.find((entry) => entry.elementId === definition?.id) || null;
    const failure = (code, message) => ({ success: false, changeId: String(request.changeId || ""), elementId: String(request.elementId || ""), operation: String(request.operation || ""), errorCode: code, message, previousState: clone(previous), newState: clone(previous), rollbackSucceeded: true });
    if (!definition) return failure("pdf_unknown_element", "PDF-Element ist nicht registriert.");
    if (request.scopeId !== normalizedRegistry.scopeId) return failure("pdf_layout_incompatible", "PDF-Scope passt nicht.");
    if (!(definition.allowedOps || definition.capabilities || []).includes(request.operation)) return failure((definition.lockedOps || []).includes(request.operation) ? "pdf_operation_locked" : "pdf_operation_not_allowed", "PDF-Operation ist nicht freigegeben.");
    try {
      const states = new Map(working.elements.map((entry) => [entry.elementId, entry]));
      const affected = [];
      if (request.operation === "resizeColumnBoundary") {
        const table = request.payload?.table;
        const columns = tableColumns(definition.id);
        const leftIndex = columns.findIndex((entry) => entry.id === table?.leftColumnId);
        const rightIndex = columns.findIndex((entry) => entry.id === table?.rightColumnId);
        const delta = Number(table?.delta);
        if (definition.kind !== "table" || definition.boundaryResizePolicy !== "adjacentPreserveTotal" || rightIndex !== leftIndex + 1 || leftIndex < 0 || !Number.isFinite(delta) || Math.abs(delta) < 0.000001) {
          return failure("pdf_invalid_table_boundary", "PDF-Spaltengrenze ist ungueltig.");
        }
        for (const [index, sign] of [[leftIndex, 1], [rightIndex, -1]]) {
          const column = columns[index];
          const current = states.get(column.id);
          const width = Number(current.width) + sign * delta;
          if (width < Number(column.layoutBounds.minWidth) || width > Number(column.layoutBounds.maxWidth)) return failure("pdf_invalid_column_width", "PDF-Spaltenbreite liegt ausserhalb der registrierten Grenzen.");
          const next = { ...current, width };
          states.set(column.id, next);
          affected.push(clone(next));
        }
      } else if (request.operation === "resizeWidth" && definition.kind === "table") {
        const width = Number(request.payload?.width);
        const columns = tableColumns(definition.id);
        const lastColumn = columns.at(-1);
        const currentTable = states.get(definition.id);
        const currentLastColumn = lastColumn ? states.get(lastColumn.id) : null;
        const delta = width - Number(currentTable?.width);
        const lastWidth = Number(currentLastColumn?.width) + delta;
        if (!Number.isFinite(width) || !lastColumn || !currentLastColumn || width < Number(definition.layoutBounds.minWidth) || width > Number(definition.layoutBounds.maxWidth) ||
            lastWidth < Number(lastColumn.layoutBounds.minWidth) || lastWidth > Number(lastColumn.layoutBounds.maxWidth)) {
          return failure("pdf_invalid_table_width", "PDF-Tabellenbreite liegt ausserhalb der registrierten Grenzen.");
        }
        const nextTable = { ...currentTable, width };
        const nextLastColumn = { ...currentLastColumn, width: lastWidth };
        states.set(definition.id, nextTable);
        states.set(lastColumn.id, nextLastColumn);
        affected.push(clone(nextLastColumn));
      } else if (request.operation === "resizeWidth" && definition.kind === "tableColumn") {
        const rawWidth = request.payload?.width;
        const width = typeof rawWidth === "number" ? rawWidth : Number.NaN;
        if (!Number.isFinite(width) || width < 0) return failure("pdf_invalid_column_width", "PDF-Spaltenbreite muss endlich und mindestens 0 mm sein.");
        states.set(definition.id, { ...previous, width });
        const table = states.get(definition.parentId);
        const tableDefinition = definitions.get(definition.parentId);
        const total = tableColumns(definition.parentId).reduce((sum, column) => sum + Number(states.get(column.id)?.width || 0), 0);
        const pageWidth = Number(normalizedRegistry.pageSettings?.width);
        const rightMargin = Number(normalizedRegistry.pageSettings?.margins?.right || 0);
        const tableX = Number(table?.x ?? tableDefinition?.baseline?.x);
        const rightBoundary = pageWidth - rightMargin;
        if (!table || !tableDefinition || !Number.isFinite(tableX) || !Number.isFinite(rightBoundary) || tableX + total > rightBoundary + 0.000001) {
          return failure("pdf_out_of_page_bounds", `Die resultierende PDF-Tabelle endet bei ${tableX + total} mm und ueberschreitet die rechte Arbeitsbereichsgrenze ${rightBoundary} mm.`);
        }
        affected.push(clone(states.get(definition.id)));
        const minimum = Number(definition.layoutBounds?.minWidth);
        const maximum = Number(definition.layoutBounds?.maxWidth);
        const outsideRecommendation = (Number.isFinite(minimum) && width < minimum) || (Number.isFinite(maximum) && width > maximum);
        working = { scopeId: normalizedRegistry.scopeId, capturedAt: new Date().toISOString(), elements: [...states.values()] };
        preview = { ...preview, state: preview.controlledOutputPath ? "stale" : "missing", stale: true };
        return { success: true, changeId: request.changeId, elementId: definition.id, operation: request.operation, errorCode: null,
          message: outsideRecommendation
            ? "PDF-Spaltenbreite wurde unabhaengig angewandt; der Wert liegt ausserhalb der registrierten Empfehlung."
            : "PDF-Spaltenbreite wurde unabhaengig angewandt und zurueckgelesen.",
          previousState: clone(previous), newState: clone(states.get(definition.id)), affectedStates: affected, rollbackSucceeded: true };
      } else if (request.operation === "setVisibility") {
        if (typeof request.payload?.visible !== "boolean") return failure("pdf_invalid_payload", "PDF-Sichtbarkeit ist ungueltig.");
        const next = { ...previous, visible: request.payload.visible };
        states.set(definition.id, next);
        affected.push(clone(next));
      } else return failure("pdf_operation_not_allowed", "PDF-Operation ist nicht freigegeben.");
      working = { scopeId: normalizedRegistry.scopeId, capturedAt: new Date().toISOString(), elements: [...states.values()] };
      preview = { ...preview, state: preview.controlledOutputPath ? "stale" : "missing", stale: true };
      return { success: true, changeId: request.changeId, elementId: definition.id, operation: request.operation, errorCode: null, message: "PDF-Layoutaenderung angewandt und zurueckgelesen.", previousState: clone(previous), newState: clone(states.get(definition.id)), affectedStates: affected, rollbackSucceeded: true };
    } catch (_error) { return failure("pdf_change_apply_failed", "PDF-Layoutaenderung wurde sicher abgewiesen."); }
  }

  return Object.freeze({
    getPdfRegistry: () => clone(normalizedRegistry),
    getCurrentPdfLayoutState: () => clone({ ...working, capturedAt: new Date().toISOString() }),
    getPersistedPdfLayoutState,
    readPersistedPdfLayoutState,
    getPdfProfilePath,
    getPdfProfileHistoryPath,
    configureProfileRoot(value) { profileRoot = path.resolve(value); return getPdfProfilePath(); },
    configureRegenerate(handler) { if (typeof handler !== "function") throw new TypeError("PDF-Regenerationshandler fehlt."); regenerateHandler = handler; },
    reconcilePersistedProfile,
    preparePdfEditorSessionBaseline() {
      const previousLayoutState = clone(working);
      working = profileState(normalizedRegistry);
      preview = { ...preview, state: preview.controlledOutputPath ? "stale" : "missing", stale: true };
      return { previousLayoutState };
    },
    rollbackPdfEditorSessionPreparation(receipt) {
      if (!receipt?.previousLayoutState) return false;
      this.replaceCurrentPdfLayoutState(receipt.previousLayoutState);
      return true;
    },
    setActiveDocumentContext(value = {}) {
      context = clone(value);
      const id = activeDocumentId();
      if (!id) { context = null; return { ok: false, activeDocumentId: "", pdfRegistryStatus: "incomplete" }; }
      const persisted = readPersistedPdfLayoutState();
      working = persisted || profileState(normalizedRegistry);
      if (preview.activeDocumentId !== id) preview = { state: "missing", stale: true, generation: 0, pageCount: 0, generatedAt: null, activeDocumentId: id, controlledOutputPath: null, renderBounds: [] };
      return { ok: true, activeDocumentId: id, pdfRegistryStatus: "available" };
    },
    getPdfContract() {
      const id = activeDocumentId();
      if (!id) return null;
      const contract = { applicationId, documentTypeId, displayName, contractVersion: PDF_TARGET_CONTRACT_VERSION, registryVersion: normalizedRegistry.registryVersion, registryFingerprint: normalizedRegistry.registryFingerprint, profileScope: normalizedRegistry.scopeId, supportedOperations: [...PDF_TARGET_OPERATIONS], pageSettingsCapability: "none", previewCapability: "nativePdf", regenerateCapability: "explicit", activeDocumentId: id, pdfRegistryStatus: "available" };
      const result = validatePdfTargetContract(contract);
      if (!result.ok) throw Object.assign(new Error("PDF-Zielvertrag ist ungueltig."), { code: "pdf_contract_invalid", validationErrors: result.errors });
      return contract;
    },
    submitPdfChangeRequest,
    replaceCurrentPdfLayoutState(state) {
      const requested = new Map((state?.elements || []).map((entry) => [entry.elementId, entry]));
      if (state?.scopeId !== normalizedRegistry.scopeId || requested.size !== definitions.size) throw Object.assign(new Error("PDF-LayoutState ist ungueltig."), { code: "pdf_layout_incompatible" });
      const next = { scopeId: normalizedRegistry.scopeId, capturedAt: new Date().toISOString(), elements: normalizedRegistry.elements.map((definition) => ({ elementId: definition.id, scopeId: normalizedRegistry.scopeId, ...clone(definition.baseline), ...clone(requested.get(definition.id)) })) };
      validateTableColumnGeometry(next, "pdf_layout_incompatible");
      working = next;
      return clone(working);
    },
    async regeneratePdfPreview() {
      if (!context || typeof regenerateHandler !== "function") throw Object.assign(new Error("PDF-Regeneration ist nicht angebunden."), { code: "pdf_regenerate_unavailable" });
      const result = await regenerateHandler({ ...clone(context), activeDocumentId: activeDocumentId(), layoutState: clone(working) });
      preview = { state: "current", stale: false, generation: preview.generation + 1, pageCount: Number(result?.pageCount || 0), generatedAt: result?.generatedAt || new Date().toISOString(), activeDocumentId: activeDocumentId(), controlledOutputPath: String(result?.controlledOutputPath || ""), renderBounds: clone(result?.renderBounds || []) };
      return clone(preview);
    },
    getPreviewMetadata: () => clone(preview),
  });
}

module.exports = Object.freeze({ createDeclarativePdfAdapter, persistedRegistryFingerprint });
