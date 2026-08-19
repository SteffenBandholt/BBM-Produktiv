"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { EventEmitter } = require("node:events");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const {
  createRegistryFingerprint,
  createUiScopeFingerprint,
  loadTargetStartupLayout,
} = require("ui-editor-kit");

const ROOT = path.resolve(__dirname, "../..");

function source(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function fakePdfAdapter(documentTypeId, scopeId) {
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
    getPdfRegistry() { return { documentTypeId, scopeId, elements: state.elements.map((entry) => ({ id: entry.elementId })) }; },
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
      const resolver = registry.createPdfEditorAdapterResolver({ profileBaseRoot: temp, regeneratePdf: async (request) => { generated.push(request); return { pageCount: 1, mode: request.mode }; } });
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

  await run("Universal 04: generische Infrastruktur enthaelt keine Fachentscheidungen", () => {
    const files = [
      "src/renderer/ui-editor/m80Registry.js", "src/renderer/ui-editor/m80HostAdapter.js", "src/renderer/ui-editor/m80Refs.js",
      "src/renderer/ui-editor/uiEditorRegistrationModel.js", "src/renderer/app/coreShellNavigation.js",
      "src/renderer/editorRuntime/catalog/bbmEditorCatalog.js", "src/main/ui-editor/electronUiEditorSession.js",
      "src/renderer/editorRuntime/host/bbmEditorHostAdapterFactory.js",
      "src/main/ui-editor/pdfAdapterRegistry.cjs", "src/main/ipc/uiEditorIpc.js",
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
