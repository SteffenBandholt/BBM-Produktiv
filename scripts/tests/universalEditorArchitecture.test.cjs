"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { EventEmitter } = require("node:events");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const {
  PDF_TARGET_OPERATIONS,
  createPdfRegistryFingerprint,
  createRegistryFingerprint,
  createUiScopeFingerprint,
  loadTargetStartupLayout,
  validatePdfRegistry,
} = require("ui-editor-kit");

const ROOT = path.resolve(__dirname, "../..");

function neutralColumnRegistry() {
  const scopeId = "pdf.test.independent-columns";
  const pageBounds = { minX: 0, maxX: 297, minY: 0, maxY: 210, minWidth: 0, maxWidth: 297, minHeight: 1, maxHeight: 210 };
  const element = ({ suffix, kind, parentSuffix, order, role = "layout", baseline, allowedOps = [], columnRole, layoutBounds = pageBounds, boundaryResizePolicy }) => ({
    id: `${scopeId}${suffix}`, name: suffix ? suffix.slice(1) : "neutral-document", scopeId,
    parentId: parentSuffix == null ? null : `${scopeId}${parentSuffix}`, kind, role,
    pageArea: ["document", "page"].includes(kind) ? "document" : kind === "header" ? "header" : kind === "footer" ? "footer" : "body",
    order, visible: true, editable: allowedOps.length > 0, capabilities: allowedOps.filter((operation) => operation !== "resizeColumnBoundary"),
    allowedOps, lockedOps: PDF_TARGET_OPERATIONS.filter((operation) => !allowedOps.includes(operation)), baseline, layoutBounds,
    refKey: `neutral${suffix || ".document"}`, rendererKey: `[data-neutral="${suffix || "document"}"]`,
    ...(columnRole ? { columnRole } : {}), ...(boundaryResizePolicy ? { boundaryResizePolicy } : {}),
  });
  const box = (x, y, width, height) => ({ x, y, width, height, visible: true });
  const elements = [
    element({ suffix: "", kind: "document", parentSuffix: null, order: 0, baseline: box(0, 0, 297, 210) }),
    element({ suffix: ".page", kind: "page", parentSuffix: "", order: 10, baseline: box(0, 0, 297, 210) }),
    element({ suffix: ".header", kind: "header", parentSuffix: ".page", order: 20, baseline: box(12, 5, 273, 30) }),
    element({ suffix: ".header.group", kind: "group", parentSuffix: ".header", order: 21, baseline: box(12, 5, 80, 20) }),
    element({ suffix: ".header.label", kind: "label", parentSuffix: ".header.group", order: 22, role: "fieldLabel", baseline: box(12, 5, 20, 6) }),
    element({ suffix: ".header.value", kind: "value", parentSuffix: ".header.group", order: 23, role: "content", baseline: box(32, 5, 60, 6) }),
    element({ suffix: ".body", kind: "area", parentSuffix: ".page", order: 30, baseline: box(12, 35, 273, 150) }),
    element({ suffix: ".table", kind: "table", parentSuffix: ".body", order: 40, role: "content", baseline: box(12, 40, 90, 100), allowedOps: ["resizeWidth", "resizeColumnBoundary"], boundaryResizePolicy: "adjacentPreserveTotal" }),
    element({ suffix: ".table.rows", kind: "repeatingArea", parentSuffix: ".table", order: 50, role: "content", baseline: box(12, 48, 90, 92) }),
    element({ suffix: ".table.column.a", kind: "tableColumn", parentSuffix: ".table", order: 60, role: "content", baseline: box(12, 40, 20, 100), allowedOps: ["resizeWidth"], columnRole: "contentColumn", layoutBounds: { ...pageBounds, minWidth: 15, maxWidth: 25 } }),
    element({ suffix: ".table.column.b", kind: "tableColumn", parentSuffix: ".table", order: 61, role: "content", baseline: box(32, 40, 30, 100), allowedOps: ["resizeWidth"], columnRole: "contentColumn", layoutBounds: { ...pageBounds, minWidth: 25, maxWidth: 35 } }),
    element({ suffix: ".table.column.c", kind: "tableColumn", parentSuffix: ".table", order: 62, role: "content", baseline: box(62, 40, 40, 100), allowedOps: ["resizeWidth"], columnRole: "contentColumn", layoutBounds: { ...pageBounds, minWidth: 30, maxWidth: 45 } }),
    element({ suffix: ".footer", kind: "footer", parentSuffix: ".page", order: 200, baseline: box(12, 198, 273, 12) }),
  ];
  const base = { applicationId: "bbm-produktiv", documentTypeId: "neutral-independent-columns", displayName: "neutral-columns", scopeId, unit: "mm",
    pageSettings: { format: "A4", orientation: "landscape", width: 297, height: 210, margins: { top: 5, right: 12, bottom: 0, left: 12 } }, elements };
  return { ...base, registryVersion: 1, registryFingerprint: createPdfRegistryFingerprint(base) };
}

function source(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function fakePdfAdapter(documentTypeId, scopeId) {
  const layoutBounds = { minX: 0, maxX: 297, minY: 0, maxY: 210, minWidth: 1, maxWidth: 297, minHeight: 1, maxHeight: 210 };
  const pdfElement = (suffix, kind, parentSuffix, order, role = "layout", capabilities = []) => ({
    id: `${scopeId}${suffix}`, name: `${documentTypeId}${suffix}`, scopeId, parentId: parentSuffix == null ? null : `${scopeId}${parentSuffix}`,
    kind, role, pageArea: ["document", "page"].includes(kind) ? "document" : kind === "header" ? "header" : kind === "footer" ? "footer" : "body",
    order, visible: true, editable: capabilities.length > 0, capabilities, allowedOps: capabilities, lockedOps: ["setPageBreakRule"],
    baseline: { x: 0, y: 0, width: kind === "tableColumn" ? 40 : 80, height: 12, visible: true }, layoutBounds,
    refKey: `${documentTypeId}${suffix}`, rendererKey: `.test-${kind}`,
    ...(kind === "tableColumn" ? { columnRole: "contentColumn" } : {}),
  });
  const registryBase = {
    applicationId: "bbm-produktiv", documentTypeId, displayName: documentTypeId, scopeId, unit: "mm",
    pageSettings: { format: "A4", orientation: "landscape", width: 297, height: 210, margins: { top: 5, right: 12, bottom: 0, left: 12 } },
    elements: [
      pdfElement("", "document", null, 0), pdfElement(".page", "page", "", 10), pdfElement(".header", "header", ".page", 20),
      pdfElement(".header.group", "group", ".header", 21), pdfElement(".header.label", "label", ".header.group", 22, "fieldLabel"),
      pdfElement(".body.text", "value", ".header.group", 23, "content", ["resizeWidth"]), pdfElement(".body", "area", ".page", 30),
      { ...pdfElement(".table", "table", ".body", 40, "content", ["resizeColumnBoundary"]), boundaryResizePolicy: "adjacentPreserveTotal" },
      pdfElement(".rows", "repeatingArea", ".table", 50, "content"), pdfElement(".column.a", "tableColumn", ".table", 60, "content", ["resizeWidth"]),
      pdfElement(".column.b", "tableColumn", ".table", 61, "content", ["resizeWidth"]), pdfElement(".footer", "footer", ".page", 200),
    ],
  };
  const pdfRegistry = { ...registryBase, registryVersion: 1, registryFingerprint: createPdfRegistryFingerprint(registryBase) };
  let profileRoot = "";
  let context = null;
  let state = { scopeId, elements: [{ elementId: `${scopeId}.body.text`, scopeId, x: 0, y: 0, width: 80, height: 12, fontSize: 10, visible: true }] };
  let regenerate = null;
  return {
    configureProfileRoot(value) { profileRoot = value; },
    configureRegenerate(handler) { regenerate = handler; },
    getProfileRoot() { return profileRoot; },
    getPdfContract() {
      if (!context) return null;
      return {
        applicationId: "bbm-produktiv", documentTypeId, displayName: documentTypeId,
        contractVersion: "1.0", registryVersion: 1, registryFingerprint: `sha256:${"1".repeat(64)}`,
        profileScope: scopeId, supportedOperations: ["resizeWidth"], pageSettingsCapability: "none",
        previewCapability: "nativePdf", regenerateCapability: "explicit",
        activeDocumentId: `${documentTypeId}-active`, pdfRegistryStatus: "available",
      };
    },
    getPdfRegistry() { return structuredClone(pdfRegistry); },
    getCurrentPdfLayoutState() { return JSON.parse(JSON.stringify(state)); },
    setActiveDocumentContext(value) { context = { ...value }; return { ok: true, pdfRegistryStatus: "available", activeDocumentId: `${documentTypeId}-active` }; },
    submitPdfChangeRequest(request) { state.elements[0] = { ...state.elements[0], ...(request.payload || {}) }; return { success: true, newState: this.getCurrentPdfLayoutState() }; },
    async regeneratePdfPreview() { return regenerate({ ...context, activeDocumentId: `${documentTypeId}-active` }); },
    getPreviewMetadata() { return { documentTypeId, activeDocumentId: `${documentTypeId}-active` }; },
  };
}

async function runUniversalEditorArchitectureTests(run) {
  const fixture = await importEsmFromFile(path.join(ROOT, "scripts/tests/fixtures/testEditorModule.mjs"));
  const modelModule = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/uiEditorRegistrationModel.js"));
  const model = modelModule.createUiEditorRegistrationModel([fixture.testEditorModuleRegistration]);

  await run("Universal UI 01: neutrales Modul wird ausschliesslich aus seiner Registrierung aufgebaut", () => {
    assert.deepEqual(model.activeScopes, ["test-editor.header.root", "test-editor.list.root", "test-editor.edit.root"]);
    assert.equal(model.getScopeGroup("test-editor.list.root").layoutStorageKey, "module-test-editor");
    assert.equal(model.aggregate.elements.length, 7);
    assert.equal(model.getLauncher("test-editor.header.root").elementId, "test-editor.edit.action");
  });

  await run("Universal UI 02: Parent-, Auswahl- und universeller Operationsvertrag ist vollstaendig", () => {
    const byId = new Map(model.aggregate.elements.map((entry) => [entry.id, entry]));
    for (const entry of byId.values()) {
      if (entry.parentId) assert.ok(byId.has(entry.parentId), `${entry.id}: Parent fehlt`);
      for (const operation of ["move", "resizeWidth", "resizeHeight", "setVisibility"]) assert.ok(entry.allowedOps.includes(operation), `${entry.id}/${operation}`);
      if (entry.hasVisibleText) assert.ok(entry.allowedOps.includes("textResize"), `${entry.id}/textResize`);
    }
    assert.notEqual(model.getScopeGroup("test-editor.header.root").layoutStorageKey, "module-protokoll");
  });

  await run("Universal UI 03: neutrales Element nutzt dieselbe Move-, Resize-, TextResize- und Visibility-Engine", async () => {
    const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
    const entry = model.getEntry("test-editor.edit.field");
    let state = { elementId: entry.id, scopeId: entry.scopeId, x: 0, y: 0, width: 100, height: 30, fontSize: 12, visible: true, spacing: {} };
    state = host.applyM80RegisteredLayoutOperation(state, entry, "move", { x: 17, y: 9 });
    state = host.applyM80RegisteredLayoutOperation(state, entry, "resizeWidth", { width: 140 });
    state = host.applyM80RegisteredLayoutOperation(state, entry, "resizeHeight", { height: 44 });
    state = host.applyM80RegisteredLayoutOperation(state, entry, "textResize", { text: { fontSize: 16 } }, { requestedFontSize: 16 });
    state = host.applyM80RegisteredLayoutOperation(state, entry, "setVisibility", { visible: false });
    assert.deepEqual({ x: state.x, y: state.y, width: state.width, height: state.height, fontSize: state.fontSize, visible: state.visible },
      { x: 17, y: 9, width: 140, height: 44, fontSize: 16, visible: false });
  });

  await run("Universal UI 04: generische Electron-Session oeffnet, zeigt Registry und vermittelt Selection in beide Richtungen", async () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-universal-ui-"));
    try {
      const registryScopes = model.scopes.map((scope) => ({
        ...scope,
        elements: scope.elements.map((entry) => ({
          ...entry,
          referenceResolved: true,
          targetCount: entry.referenceKind === "multi" ? 2 : 1,
          capturedBaseline: { width: Number(entry.baseline?.width) || 100, height: Number(entry.baseline?.height) || 30 },
        })),
      }));
      const activeScopes = [...model.activeScopes];
      const registration = {
        applicationId: "bbm-produktiv", displayName: "BBM", framework: "electron",
        registryVersion: model.registryVersion, registryStatus: "complete", activeScopes,
        scopeGroupId: "module-test-editor", layoutStorageKey: "module-test-editor",
        supportedOperations: ["move", "resizeWidth", "resizeHeight", "textResize", "setVisibility"],
        uiCapability: "layout", pdfCapability: "unavailable", labelFieldSeparation: true, visibilityCapability: true,
        registryScopes,
      };
      fs.writeFileSync(path.join(temp, "ui-editor-target.json"), JSON.stringify({
        schemaVersion: 2, applicationId: "bbm-produktiv", framework: "electron",
        contractVersion: 2, adapterVersion: 2, registryVersion: model.registryVersion,
        registryFingerprint: createRegistryFingerprint(registryScopes), activeScopes,
      }));
      const rendererEvents = [];
      class FakeClient extends EventEmitter {
        constructor() { super(); this.connected = true; this.events = []; }
        async connect() { this.connected = true; }
        async request() { return { isDirty: false }; }
        sendEvent(action, payload) { this.events.push({ action, payload }); return true; }
        async close() { this.connected = false; }
      }
      const child = new EventEmitter(); child.exitCode = null; child.kill = () => { child.exitCode = 0; };
      const mainWindow = { isDestroyed: () => false, focus() {}, webContents: { send(channel, payload) { rendererEvents.push({ channel, payload }); } } };
      const { ElectronUiEditorSessionController } = require(path.join(ROOT, "src/main/ui-editor/electronUiEditorSession.js"));
      const controller = new ElectronUiEditorSessionController({
        app: { getVersion: () => "1.0.0", getAppPath: () => temp }, ipcMain: { handle() {} }, getMainWindow: () => mainWindow,
        spawnProcess: () => child, clientFactory: () => new FakeClient(), executableResolver: () => path.join(temp, "editor.exe"),
        runtimeRootResolver: () => temp, profileRootResolver: () => path.join(temp, "profiles"),
        sessionIdentifiersFactory: () => ({ sessionId: "test-session", pipeName: "test-pipe", sessionNonce: "a".repeat(32) }),
      });
      const opened = await controller.open(registration);
      assert.equal(opened.ok, true, JSON.stringify(opened));
      assert.equal(controller.currentRegistration.registryScopes.flatMap((scope) => scope.elements).length, 7);
      const targetSelection = await controller.forwardTargetEvent({ action: "targetSelectionChanged", scopeId: "test-editor.edit.root", elementId: "test-editor.edit.field", selectionKind: "field" });
      assert.equal(targetSelection.ok, true);
      assert.equal(controller.client.events.at(-1).payload.elementId, "test-editor.edit.field");
      controller.client.emit("message", { messageType: "event", payload: { action: "highlightElement", scopeId: "test-editor.edit.root", elementId: "test-editor.edit.field" } });
      assert.equal(rendererEvents.at(-1).payload.elementId, "test-editor.edit.field");
      const switched = await controller.forwardTargetEvent({ action: "scopeChanged", scopeId: "test-editor.edit.root", registration });
      assert.equal(switched.ok, true);
      await controller.shutdown();
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  });

  await run("Universal UI 05: neutrales Profil speichert, laedt und resettet getrennt von Produktprofilen", () => {
    const { resolveBbmModuleLayoutProfileRoot } = require(path.join(ROOT, "src/main/ui-editor/electronUiEditorSession.js"));
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-universal-profile-"));
    try {
      const neutralRegistration = { scopeGroupId: "module-test-editor", layoutStorageKey: "module-test-editor", registryVersion: model.registryVersion, activeScopes: [...model.activeScopes], registryScopes: model.scopes };
      const neutralRoot = resolveBbmModuleLayoutProfileRoot(temp, neutralRegistration).profileRoot;
      const protocolFile = path.join(temp, "module-protokoll", "standard.layout-profile.json");
      const remainingFile = path.join(temp, "module-restarbeiten", "standard.layout-profile.json");
      fs.mkdirSync(path.dirname(protocolFile), { recursive: true });
      fs.mkdirSync(path.dirname(remainingFile), { recursive: true });
      fs.writeFileSync(protocolFile, "protocol-profile-sentinel", "utf8");
      fs.writeFileSync(remainingFile, "remaining-profile-sentinel", "utf8");

      const savedScopes = model.scopes.map((scope) => ({
        scopeId: scope.scopeId,
        registryFingerprint: createUiScopeFingerprint(scope),
        layoutState: { elements: scope.elements.map((entry) => {
          const state = { elementId: entry.id, scopeId: scope.scopeId };
          if (entry.allowedOps.includes("move")) Object.assign(state, { x: entry.id === "test-editor.edit.field" ? 17 : 0, y: 0 });
          if (entry.allowedOps.includes("resizeWidth")) state.width = entry.id === "test-editor.edit.field" ? 140 : 100;
          if (entry.allowedOps.includes("resizeHeight")) state.height = entry.id === "test-editor.edit.field" ? 44 : 30;
          if (entry.allowedOps.includes("textResize")) state.fontSize = entry.id === "test-editor.edit.field" ? 16 : 12;
          if (entry.allowedOps.includes("setVisibility")) state.visible = entry.id !== "test-editor.edit.field";
          return state;
        }) },
      }));
      const profile = { schemaVersion: 2, applicationId: "bbm-produktiv", profileId: "standard", savedAt: "2026-08-18T12:00:00.000Z", scopes: savedScopes };
      fs.mkdirSync(neutralRoot, { recursive: true });
      const neutralFile = path.join(neutralRoot, "standard.layout-profile.json");
      fs.writeFileSync(neutralFile, JSON.stringify(profile), "utf8");
      const loaded = loadTargetStartupLayout({ profileRoot: neutralRoot, applicationId: "bbm-produktiv", activeScopes: [...model.activeScopes], registryScopes: model.scopes });
      assert.equal(loaded.ok, true, JSON.stringify(loaded.errors || []));
      assert.equal(loaded.scopes.find((scope) => scope.scopeId === "test-editor.edit.root").elements.find((entry) => entry.elementId === "test-editor.edit.field").x, 17);
      const savedBytes = fs.readFileSync(neutralFile);
      fs.rmSync(neutralFile);
      assert.equal(loadTargetStartupLayout({ profileRoot: neutralRoot, applicationId: "bbm-produktiv", activeScopes: [...model.activeScopes], registryScopes: model.scopes }).found, false);
      fs.writeFileSync(neutralFile, savedBytes);
      assert.equal(loadTargetStartupLayout({ profileRoot: neutralRoot, applicationId: "bbm-produktiv", activeScopes: [...model.activeScopes], registryScopes: model.scopes }).scopes[2].elements[1].x, 17);
      assert.equal(fs.readFileSync(protocolFile, "utf8"), "protocol-profile-sentinel");
      assert.equal(fs.readFileSync(remainingFile, "utf8"), "remaining-profile-sentinel");
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  });

  await run("Universal PDF 01: zweiter Dokumenttyp oeffnet ueber Registry, speichert getrennt und wechselt zurueck", async () => {
    const registry = require(path.join(ROOT, "src/main/ui-editor/pdfAdapterRegistry.cjs"));
    const originalRegistrations = registry.listPdfEditorAdapterRegistrations();
    registry.resetPdfEditorAdapterRegistrationsForTest();
    const protocolAdapter = fakePdfAdapter("protocol", "pdf.bbm.protocol");
    const testAdapter = fakePdfAdapter("test-document", "pdf.bbm.test-document");
    const generated = [];
    registry.registerPdfEditorAdapter({ documentTypeId: "protocol", layoutStorageKey: "module-protokoll", adapter: protocolAdapter, default: true, buildRegenerationRequest: (context) => ({ mode: "protocol", ...context }) });
    registry.registerPdfEditorAdapter({ documentTypeId: "test-document", layoutStorageKey: "module-test-document", adapter: testAdapter, regenerate: async (context) => { generated.push({ mode: "test-document", ...context }); return { pageCount: 1, mode: "test-document" }; } });
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-universal-pdf-"));
    try {
      const resolver = registry.createPdfEditorAdapterResolver({ profileBaseRoot: temp, registrationRoot: temp, regeneratePdf: async (request) => { generated.push(request); return { pageCount: 1, mode: request.mode }; } });
      resolver.activateAcceptedDocumentType("test-document");
      resolver.setActiveDocumentContext({ documentTypeId: "test-document", projectId: 1, meetingId: 1 });
      assert.equal(resolver.getPdfContract().documentTypeId, "test-document");
      assert.equal(resolver.submitPdfChangeRequest({ payload: { width: 72 } }).success, true);
      assert.equal(resolver.getCurrentPdfLayoutState().elements[0].width, 72);
      assert.equal((await resolver.regeneratePdfPreview()).mode, "test-document");

      const testProfileFile = path.join(testAdapter.getProfileRoot(), "pdf-layouts", "test-document.layout-profile.json");
      const protocolProfileFile = path.join(temp, "module-protokoll", "pdf-layouts", "protocol.layout-profile.json");
      fs.mkdirSync(path.dirname(testProfileFile), { recursive: true });
      fs.mkdirSync(path.dirname(protocolProfileFile), { recursive: true });
      fs.writeFileSync(testProfileFile, JSON.stringify(resolver.getCurrentPdfLayoutState()), "utf8");
      fs.writeFileSync(protocolProfileFile, "protocol-pdf-profile-sentinel", "utf8");
      assert.equal(JSON.parse(fs.readFileSync(testProfileFile, "utf8")).elements[0].width, 72);

      const registryScopes = model.scopes.map((scope) => ({
        ...scope,
        elements: scope.elements.map((entry) => ({ ...entry, referenceResolved: true, targetCount: 1, capturedBaseline: { width: 100, height: 30 } })),
      }));
      const registration = {
        applicationId: "bbm-produktiv", displayName: "BBM", framework: "electron",
        registryVersion: model.registryVersion, registryStatus: "complete", activeScopes: [...model.activeScopes],
        scopeGroupId: "module-test-editor", layoutStorageKey: "module-test-editor",
        supportedOperations: ["move", "resizeWidth", "resizeHeight", "textResize", "setVisibility"],
        uiCapability: "layout", pdfCapability: "available", labelFieldSeparation: true, visibilityCapability: true,
        registryScopes,
      };
      fs.writeFileSync(path.join(temp, "ui-editor-target.json"), JSON.stringify({
        schemaVersion: 2, applicationId: "bbm-produktiv", framework: "electron", contractVersion: 2, adapterVersion: 2,
        registryVersion: model.registryVersion, registryFingerprint: createRegistryFingerprint(registryScopes), activeScopes: [...model.activeScopes],
      }));
      class PdfClient extends EventEmitter {
        constructor() { super(); this.connected = true; this.responses = []; }
        async connect() { this.connected = true; }
        async request() { return { isDirty: false }; }
        sendEvent() { return true; }
        respond(message, payload, error) { this.responses.push({ message, payload, error }); }
        async close() { this.connected = false; }
      }
      const { ElectronUiEditorSessionController } = require(path.join(ROOT, "src/main/ui-editor/electronUiEditorSession.js"));
      const controller = new ElectronUiEditorSessionController({
        app: { getVersion: () => "1.0.0", getAppPath: () => temp }, ipcMain: { handle() {} }, getMainWindow: () => null,
        pdfAdapter: resolver,
        spawnProcess: () => { const child = new EventEmitter(); child.exitCode = null; child.kill = () => { child.exitCode = 0; }; return child; },
        clientFactory: () => new PdfClient(), executableResolver: () => path.join(temp, "editor.exe"), runtimeRootResolver: () => temp,
        profileRootResolver: () => path.join(temp, "ui-profiles"), ensureDirectory: (directory) => fs.mkdirSync(directory, { recursive: true }),
        sessionIdentifiersFactory: (() => { let id = 0; return () => ({ sessionId: `pdf-session-${++id}`, pipeName: `pdf-pipe-${id}`, sessionNonce: "b".repeat(32) }); })(),
      });
      assert.equal(controller.preparePdfContext({ documentTypeId: "test-document", projectId: 1, meetingId: 1 }).documentTypeId, "test-document");
      const pdfOpened = await controller.open(registration);
      assert.equal(pdfOpened.ok, true, JSON.stringify(pdfOpened));
      assert.equal(controller.currentRegistration.contract.pdfContract.documentTypeId, "test-document");
      controller.client.emit("message", { messageType: "request", messageId: "pdf-registry", payload: { action: "getPdfRegistry" } });
      controller.client.emit("message", { messageType: "request", messageId: "pdf-change", payload: { action: "submitPdfChangeRequest", changeRequest: { payload: { width: 68 } } } });
      controller.client.emit("message", { messageType: "request", messageId: "pdf-preview", payload: { action: "regeneratePdfPreview" } });
      await new Promise((resolve) => setImmediate(resolve));
      assert.deepEqual(controller.client.responses.map((entry) => entry.payload?.action).sort(), ["getPdfRegistryAccepted", "regeneratePdfPreviewAccepted", "submitPdfChangeRequestAccepted"]);

      assert.equal(controller.preparePdfContext({ documentTypeId: "protocol", projectId: 1, meetingId: 1 }).documentTypeId, "protocol");
      assert.equal((await controller.open(registration, "pdfContextChanged")).ok, true);
      assert.equal(controller.currentRegistration.contract.pdfContract.documentTypeId, "protocol");
      assert.equal(resolver.getCurrentPdfLayoutState().elements[0].width, 80);
      assert.notEqual(protocolAdapter.getProfileRoot(), testAdapter.getProfileRoot());
      assert.equal(fs.readFileSync(protocolProfileFile, "utf8"), "protocol-pdf-profile-sentinel");
      assert.deepEqual(generated.map((entry) => entry.mode), ["test-document", "test-document"]);
      await controller.shutdown();
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
      registry.resetPdfEditorAdapterRegistrationsForTest();
      for (const registration of originalRegistrations) registry.registerPdfEditorAdapter(registration);
    }
  });

  await run("Universal PDF 02: neutrale A-B-C-Spalten skalieren einzeln, akzeptieren 0 und laden 0 aus isoliertem Profil", () => {
    const { createDeclarativePdfAdapter } = require(path.join(ROOT, "src/main/ui-editor/declarativePdfAdapter.cjs"));
    const registry = neutralColumnRegistry();
    assert.equal(validatePdfRegistry(registry).ok, true, JSON.stringify(validatePdfRegistry(registry).errors));
    const ids = {
      table: `${registry.scopeId}.table`,
      a: `${registry.scopeId}.table.column.a`,
      b: `${registry.scopeId}.table.column.b`,
      c: `${registry.scopeId}.table.column.c`,
    };
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-independent-columns-"));
    const request = (adapter, elementId, width) => adapter.submitPdfChangeRequest({
      changeId: `width-${elementId}-${width}`, elementId, scopeId: registry.scopeId,
      operation: "resizeWidth", payload: { width }, source: "universal-column-test",
    });
    const widths = (adapter) => Object.fromEntries(adapter.getCurrentPdfLayoutState().elements
      .filter((entry) => [ids.a, ids.b, ids.c].includes(entry.elementId))
      .map((entry) => [entry.elementId, entry.width]));
    try {
      const adapter = createDeclarativePdfAdapter({ documentTypeId: registry.documentTypeId, displayName: registry.displayName, registry });
      adapter.configureProfileRoot(temp);
      assert.equal(adapter.setActiveDocumentContext({ projectId: 17 }).ok, true);

      let result = request(adapter, ids.a, 10);
      assert.equal(result.success, true, result.message);
      assert.deepEqual(widths(adapter), { [ids.a]: 10, [ids.b]: 30, [ids.c]: 40 });
      assert.deepEqual(result.affectedStates.map((entry) => entry.elementId), [ids.a]);

      assert.equal(request(adapter, ids.a, 20).success, true);
      result = request(adapter, ids.b, 50);
      assert.equal(result.success, true, result.message);
      assert.deepEqual(widths(adapter), { [ids.a]: 20, [ids.b]: 50, [ids.c]: 40 });
      assert.match(result.message, /Empfehlung/);

      assert.equal(request(adapter, ids.b, 30).success, true);
      result = adapter.submitPdfChangeRequest({
        changeId: "boundary-a-b", elementId: ids.table, scopeId: registry.scopeId,
        operation: "resizeColumnBoundary", payload: { table: { leftColumnId: ids.a, rightColumnId: ids.b, delta: 5 } },
        source: "universal-column-test",
      });
      assert.equal(result.success, true, result.message);
      assert.deepEqual(widths(adapter), { [ids.a]: 25, [ids.b]: 25, [ids.c]: 40 });

      assert.equal(request(adapter, ids.a, 20).success, true);
      assert.equal(request(adapter, ids.b, 0).success, true);
      assert.deepEqual(widths(adapter), { [ids.a]: 20, [ids.b]: 0, [ids.c]: 40 });
      assert.ok(adapter.getPdfRegistry().elements.some((entry) => entry.id === ids.b));
      assert.equal(request(adapter, ids.b, -1).success, false);
      assert.equal(request(adapter, ids.c, 260).errorCode, "pdf_out_of_page_bounds");

      const stateAtZero = adapter.getCurrentPdfLayoutState();
      const document = {
        schemaVersion: 1, documentKind: "pdf-layout-profile", applicationId: "bbm-produktiv",
        documentType: registry.documentTypeId, profileId: "pdf-standard", scopeId: registry.scopeId,
        savedAt: new Date().toISOString(), registryFingerprint: registry.registryFingerprint, layoutState: stateAtZero,
      };
      fs.mkdirSync(path.dirname(adapter.getPdfProfilePath()), { recursive: true });
      fs.writeFileSync(adapter.getPdfProfilePath(), JSON.stringify(document), "utf8");

      const restarted = createDeclarativePdfAdapter({ documentTypeId: registry.documentTypeId, displayName: registry.displayName, registry });
      restarted.configureProfileRoot(temp);
      assert.equal(restarted.setActiveDocumentContext({ projectId: 17 }).ok, true);
      assert.deepEqual(widths(restarted), { [ids.a]: 20, [ids.b]: 0, [ids.c]: 40 });
      for (const value of [9, 5, 3.5, 20, 0]) assert.equal(request(restarted, ids.b, value).success, true, String(value));
      assert.equal(request(restarted, ids.b, 25).success, true);
      assert.deepEqual(widths(restarted), { [ids.a]: 20, [ids.b]: 25, [ids.c]: 40 });
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  });

  await run("Universal PDF 03: 0-mm-Spalte entfernt Track, Kopf, Daten und Luecke und ist reversibel", async () => {
    const { applyBbmPdfEditorLayout, collectBbmPdfPreviewMetadata } = await importEsmFromFile(path.join(ROOT, "src/renderer/print/pdfEditorLayout.js"));
    const registry = neutralColumnRegistry();
    const tableEntry = registry.elements.find((entry) => entry.kind === "table");
    const columns = registry.elements.filter((entry) => entry.kind === "tableColumn").sort((left, right) => left.order - right.order);
    const pageRect = { left: 100, top: 50, width: 297, height: 210 };
    const page = { getBoundingClientRect: () => pageRect };
    const tableNode = {
      tagName: "TABLE", style: {}, setAttribute() {}, closest: (selector) => selector === ".page" ? page : null,
      getBoundingClientRect: () => ({ left: pageRect.left + 12, top: pageRect.top + 40, width: 60, height: 100 }),
    };
    const nodes = new Map();
    const columnX = [12, 32, 32];
    for (const [index, column] of columns.entries()) {
      const createNode = (tagName, part, y, height) => ({
        tagName, style: {}, setAttribute() {},
        getBoundingClientRect() {
          return { left: pageRect.left + columnX[index], top: pageRect.top + y,
            width: Number.parseFloat(this.style.width) || column.baseline.width, height };
        },
        closest(selector) {
          if (selector === ".page") return page;
          if (selector === "thead") return part === "header" ? {} : null;
          if (selector === "tbody") return part === "data" ? {} : null;
          return null;
        },
      });
      nodes.set(column.rendererKey, [createNode("COL", "track", 40, 100), createNode("TH", "header", 40, 8), createNode("TD", "data", 48, 12)]);
    }
    const root = {
      style: { setProperty() {} }, setAttribute() {},
      getBoundingClientRect: () => pageRect,
      querySelectorAll(selector) {
        if (selector === ".page") return [page];
        if (selector === tableEntry.rendererKey) return [tableNode];
        return nodes.get(selector) || [];
      },
    };
    const states = registry.elements.map((entry) => ({ elementId: entry.id, scopeId: registry.scopeId, ...entry.baseline }));
    const bState = states.find((entry) => entry.elementId === columns[1].id);
    bState.width = 0;
    const data = { orientation: "landscape", pdfEditorRegistry: registry, pdfEditorLayoutState: { scopeId: registry.scopeId, elements: states } };
    applyBbmPdfEditorLayout(root, data);
    assert.equal(tableNode.style.width, "60mm");
    assert.equal(tableNode.style.maxWidth, "60mm");
    assert.equal(nodes.get(columns[1].rendererKey).every((node) => node.style.display === "none"), true);
    assert.equal(nodes.get(columns[0].rendererKey).every((node) => node.style.display === ""), true);
    assert.equal(nodes.get(columns[2].rendererKey).every((node) => node.style.display === ""), true);
    const metadata = collectBbmPdfPreviewMetadata(root, data);
    assert.equal(metadata.renderBounds.some((entry) => entry.elementId === columns[1].id), false);
    assert.equal(metadata.renderBounds.filter((entry) => entry.elementId === columns[2].id).every((entry) => entry.box.x === 32), true);

    bState.width = 25;
    applyBbmPdfEditorLayout(root, data);
    assert.equal(tableNode.style.width, "85mm");
    assert.equal(nodes.get(columns[1].rendererKey).every((node) => node.style.display === "" && node.style.width === "25mm"), true);
  });

  await run("Universal PDF 04: neutrale TableColumn-ID adressiert exakt Track, Kopf und Datenzelle", async () => {
    const { collectBbmPdfPreviewMetadata } = await importEsmFromFile(path.join(ROOT, "src/renderer/print/pdfEditorLayout.js"));
    const pageRect = { left: 100, top: 50, width: 297, height: 210 };
    const page = { getBoundingClientRect: () => pageRect };
    const definitions = [
      { key: "A", x: 12, width: 17 },
      { key: "B", x: 29, width: 23 },
      { key: "C", x: 52, width: 41 },
    ];
    const nodesBySelector = new Map(definitions.map((definition) => {
      const createNode = (tagName, part, y, height) => ({
        tagName,
        style: {},
        scrollWidth: definition.width,
        getBoundingClientRect: () => ({ left: pageRect.left + definition.x, top: pageRect.top + y, width: definition.width, height }),
        closest(selector) {
          if (selector === ".page") return page;
          if (selector === "thead") return part === "header" ? {} : null;
          if (selector === "tbody") return part === "data" ? {} : null;
          return null;
        },
      });
      return [`[data-column="${definition.key}"]`, [
        createNode("COL", "track", 40, 100),
        createNode("TH", "header", 40, 8),
        createNode("TD", "data", 48, 12),
      ]];
    }));
    const root = {
      querySelectorAll(selector) {
        if (selector === ".page") return [page];
        return nodesBySelector.get(selector) || [];
      },
    };
    const scopeId = "pdf.test.geometry";
    const elements = definitions.map((definition, index) => ({
      id: `${scopeId}.table.column.${definition.key}`,
      scopeId,
      parentId: `${scopeId}.table`,
      kind: "tableColumn",
      capabilities: ["resizeWidth"],
      rendererKey: `[data-column="${definition.key}"]`,
      baseline: { x: definition.x, y: 40, width: definition.width, height: 100 },
      order: index + 1,
    }));
    const data = {
      orientation: "landscape",
      pdfEditorRegistry: { elements },
      pdfEditorLayoutState: { scopeId, elements: elements.map((entry) => ({ elementId: entry.id, scopeId, ...entry.baseline })) },
    };
    const metadata = collectBbmPdfPreviewMetadata(root, data);
    for (const definition of definitions) {
      const elementId = `${scopeId}.table.column.${definition.key}`;
      const bounds = metadata.renderBounds.filter((entry) => entry.elementId === elementId);
      assert.deepEqual(bounds.map((entry) => entry.part), ["track", "header", "data"], `${elementId}: Teile`);
      assert.equal(bounds.every((entry) => entry.box.x === definition.x && entry.box.width === definition.width), true, `${elementId}: Geometrie`);
    }
  });

  await run("Universal PDF 05: neutrale Sichtbarkeitsoption schaltet eine deklarative Renderklasse und bleibt im Profil", async () => {
    const { createDeclarativePdfAdapter } = require(path.join(ROOT, "src/main/ui-editor/declarativePdfAdapter.cjs"));
    const { applyBbmPdfEditorLayout } = await importEsmFromFile(path.join(ROOT, "src/renderer/print/pdfEditorLayout.js"));
    const original = neutralColumnRegistry();
    const table = original.elements.find((entry) => entry.kind === "table");
    const option = {
      id: `${original.scopeId}.table.option`, name: "neutral-option", scopeId: original.scopeId,
      parentId: table.id, kind: "group", role: "structure", pageArea: "body", order: 41,
      visible: true, editable: true, capabilities: ["setVisibility"], allowedOps: ["setVisibility"],
      lockedOps: PDF_TARGET_OPERATIONS.filter((operation) => operation !== "setVisibility"),
      baseline: { x: 12, y: 40, width: 90, height: 100, visible: true },
      layoutBounds: structuredClone(table.layoutBounds), refKey: "neutral.table.option", rendererKey: table.rendererKey,
      layoutBinding: { type: "visibilityClass", className: "neutral-option-enabled" },
    };
    const registryBase = { ...structuredClone(original), registryVersion: 2, elements: [...structuredClone(original.elements), option] };
    delete registryBase.registryFingerprint;
    const registry = { ...registryBase, registryFingerprint: createPdfRegistryFingerprint(registryBase) };
    assert.equal(validatePdfRegistry(registry).ok, true, JSON.stringify(validatePdfRegistry(registry).errors));

    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-neutral-pdf-visibility-"));
    try {
      const adapter = createDeclarativePdfAdapter({ documentTypeId: registry.documentTypeId, displayName: registry.displayName, registry });
      adapter.configureProfileRoot(temp);
      adapter.setActiveDocumentContext({ projectId: 23 });
      const initial = adapter.getCurrentPdfLayoutState();
      assert.equal(initial.elements.find((entry) => entry.elementId === option.id).visible, true);
      const invalid = adapter.submitPdfChangeRequest({ changeId: "neutral-invalid", scopeId: registry.scopeId,
        elementId: option.id, operation: "setVisibility", payload: { visible: 0 } });
      assert.deepEqual([invalid.success, invalid.errorCode], [false, "pdf_invalid_payload"]);
      const disabled = adapter.submitPdfChangeRequest({ changeId: "neutral-off", scopeId: registry.scopeId,
        elementId: option.id, operation: "setVisibility", payload: { visible: false } });
      assert.equal(disabled.success, true, disabled.message);
      assert.deepEqual(disabled.affectedStates.map((entry) => entry.elementId), [option.id]);

      const falseState = adapter.getCurrentPdfLayoutState();
      const profilePath = adapter.getPdfProfilePath();
      fs.mkdirSync(path.dirname(profilePath), { recursive: true });
      fs.writeFileSync(profilePath, JSON.stringify({
        schemaVersion: 1, documentKind: "pdf-layout-profile", applicationId: "bbm-produktiv",
        documentType: registry.documentTypeId, profileId: "pdf-standard", scopeId: registry.scopeId,
        savedAt: new Date().toISOString(), registryFingerprint: registry.registryFingerprint, layoutState: falseState,
      }), "utf8");

      const restarted = createDeclarativePdfAdapter({ documentTypeId: registry.documentTypeId, displayName: registry.displayName, registry });
      restarted.configureProfileRoot(temp);
      restarted.setActiveDocumentContext({ projectId: 23 });
      assert.equal(restarted.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === option.id).visible, false);

      const preparation = restarted.preparePdfEditorSessionBaseline();
      assert.equal(restarted.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === option.id).visible, true,
        "native Session erhaelt die deklarierte Baseline und kann danach das Profil selbst laden");
      assert.equal(restarted.rollbackPdfEditorSessionPreparation(preparation), true);
      assert.equal(restarted.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === option.id).visible, false,
        "fehlgeschlagener Sessionstart stellt den vorherigen Profilzustand wieder her");

      const classes = new Set();
      const tableNode = {
        tagName: "TABLE", style: {}, setAttribute() {},
        classList: {
          toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
          contains(name) { return classes.has(name); },
        },
      };
      const root = {
        style: { setProperty() {} }, setAttribute() {},
        querySelectorAll(selector) { return selector === table.rendererKey ? [tableNode] : []; },
      };
      const data = { pdfEditorRegistry: registry, pdfEditorLayoutState: restarted.getCurrentPdfLayoutState() };
      applyBbmPdfEditorLayout(root, data);
      assert.equal(tableNode.classList.contains("neutral-option-enabled"), false);
      assert.notEqual(tableNode.style.display, "none", "deaktivierte Style-Option blendet ihr Renderziel nicht aus");

      restarted.replaceCurrentPdfLayoutState(initial);
      data.pdfEditorLayoutState = restarted.getCurrentPdfLayoutState();
      applyBbmPdfEditorLayout(root, data);
      assert.equal(tableNode.classList.contains("neutral-option-enabled"), true, "Baseline aktiviert die neutrale Renderklasse");
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  });

  await run("Universal 04: generische Infrastruktur enthaelt keine Fachentscheidungen", () => {
    const files = [
      "src/renderer/ui-editor/m80Registry.js", "src/renderer/ui-editor/m80HostAdapter.js", "src/renderer/ui-editor/m80Refs.js",
      "src/renderer/ui-editor/uiEditorRegistrationModel.js", "src/renderer/app/coreShellNavigation.js",
      "src/renderer/editorRuntime/catalog/bbmEditorCatalog.js", "src/main/ui-editor/electronUiEditorSession.js",
      "src/renderer/editorRuntime/host/bbmEditorHostAdapterFactory.js",
      "src/main/ui-editor/pdfAdapterRegistry.cjs", "src/main/ipc/uiEditorIpc.js",
      "src/main/ui-editor/declarativePdfAdapter.cjs", "src/renderer/print/pdfEditorLayout.js",
    ];
    const forbiddenDecision = /(modules[\\/](?:protokoll|restarbeiten|rechnung|firmen|projektverwaltung)|module-(?:protokoll|restarbeiten|rechnung|firmen|projektverwaltung)|pdf\.bbm\.protocol|bbm\.(?:firms|projects|project-firms)|===\s*["'](?:protocol|protokoll|restarbeiten|rechnung|firmen|projektverwaltung|test-document)["'])/i;
    for (const file of files) assert.doesNotMatch(source(file), forbiddenDecision, file);
  });
}

if (require.main === module) {
  runUniversalEditorArchitectureTests(async (name, fn) => {
    try { await fn(); console.log(`ok - ${name}`); }
    catch (error) { console.error(`not ok - ${name}`); throw error; }
  }).catch((error) => { console.error(error?.stack || error); process.exitCode = 1; });
}

module.exports = { runUniversalEditorArchitectureTests };
