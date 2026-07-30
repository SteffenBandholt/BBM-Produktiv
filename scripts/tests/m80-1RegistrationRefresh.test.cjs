"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { EventEmitter } = require("node:events");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const {
  createElectronTargetContract,
  createRegistryFingerprint,
  validateRegistrationSnapshot,
  LOCAL_TARGET_PROTOCOL_VERSION,
} = require("ui-editor-kit");

const ROOT = path.resolve(__dirname, "../..");
let runtimeRegistration;

class MockChild extends EventEmitter {
  constructor() { super(); this.exitCode = null; }
  kill() { if (this.exitCode === null) { this.exitCode = 0; this.emit("exit", 0); } return true; }
}

class MockClient extends EventEmitter {
  constructor(child, dirty = false) { super(); this.child = child; this.connected = false; this.dirty = dirty; this.events = []; }
  async connect() { this.connected = true; }
  async request(action) { return { action: `${action}Accepted`, isDirty: this.dirty, dirtyElementIds: this.dirty ? ["restarbeiten.edit.short.field"] : [] }; }
  sendEvent(action, payload = {}) { this.events.push({ action, ...payload }); if (action === "shutdownEditor") setImmediate(() => this.child.kill()); return true; }
  async close() { this.connected = false; }
  respond() { return true; }
}

function createFakeDocument() {
  const createNode = (tag, doc) => {
    const style = {
      setProperty(name, value) { this[name] = value; },
      getPropertyValue(name) { return this[name] || ""; },
    };
    const node = {
      tagName: String(tag || "").toUpperCase(), ownerDocument: doc, children: [], parentElement: null,
      style, dataset: {}, attributes: {}, className: "", textContent: "", disabled: false, value: "", type: "", hidden: false, isConnected: true,
      append(...nodes) { for (const child of nodes) this.appendChild(child); },
      appendChild(child) { if (child && typeof child === "object") child.parentElement = this; this.children.push(child); return child; },
      replaceChildren(...nodes) { this.children = []; this.append(...nodes); },
      remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this); },
      setAttribute(name, value) { this.attributes[name] = String(value); if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_m, c) => c.toUpperCase())] = String(value); },
      getAttribute(name) { return this.attributes[name] ?? null; },
      addEventListener(type, handler) { this.listeners ||= {}; this.listeners[type] ||= []; this.listeners[type].push(handler); },
      removeEventListener() {},
      getBoundingClientRect() { return { left: 0, top: 0, width: Number.parseFloat(style.width) || 900, height: Number.parseFloat(style.height) || (this.className.includes("workspace__list") ? 420 : this.className.includes("workspace__edit") ? 250 : 670) }; },
      querySelector(selector) { const match = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/); return match ? find(this, (entry) => entry.getAttribute?.(match[1]) !== null && (match[2] === null || entry.getAttribute(match[1]) === match[2])) : null; },
    };
    node.classList = {
      contains: (name) => node.className.split(/\s+/).includes(name),
      toggle: (name, enabled) => { const values = new Set(node.className.split(/\s+/).filter(Boolean)); if (enabled) values.add(name); else values.delete(name); node.className = [...values].join(" "); },
    };
    return node;
  };
  const doc = { createElement: (tag) => createNode(tag, doc), createElementNS: (_ns, tag) => createNode(tag, doc), addEventListener() {}, removeEventListener() {} };
  doc.body = createNode("body", doc); doc.head = createNode("head", doc); doc.querySelector = (selector) => doc.body.querySelector(selector);
  return doc;
}

function find(root, predicate) {
  if (!root) return null;
  if (predicate(root)) return root;
  for (const child of root.children || []) { const match = find(child, predicate); if (match) return match; }
  return null;
}

async function runM801RegistrationRefreshTests(run) {
  await run("M80.1 BBM: führende Registry, vollständige Restarbeiten-Refs und gesperrte Restscopes", async () => {
    const previous = { document: global.document, window: global.window, Element: global.Element };
    const document = createFakeDocument();
    global.document = document;
    global.Element = Object;
    global.window = {
      getComputedStyle: (element) => ({ width: element.style.width || "900px", height: element.style.height || "24px", paddingLeft: element.style.paddingLeft || "0px", paddingTop: element.style.paddingTop || "0px", fontSize: element.style.fontSize || "12px" }),
      dispatchEvent() {}, addEventListener() {}, uiEditor: { sendTargetEvent: async () => ({ ok: true }) },
    };
    try {
      const harness = await importEsmFromFile(path.join(ROOT, "scripts/tests/m80-1RuntimeHarness.mjs"));
      const rendered = harness.renderRestarbeitenRegistration();
      document.body.appendChild(rendered.root);
      const registration = rendered.registration;
      runtimeRegistration = structuredClone(registration);
      assert.equal(registration.registryVersion, 9);
      assert.equal(registration.registryStatus, "incomplete");
      assert.deepEqual(registration.activeScopes, ["restarbeiten.header.root", "restarbeiten.list.root", "restarbeiten.edit.root"]);
      const complete = registration.registryScopes.filter((scope) => scope.status === "complete");
      const blocked = registration.registryScopes.filter((scope) => scope.status === "blocked");
      assert.equal(complete.length, 3);
      assert.ok(blocked.some((scope) => scope.scopeId === "protokoll.screen.root" && scope.reason === "registry_reference_not_mounted" && scope.elements.length === 0));
      assert.ok(blocked.some((scope) => scope.scopeId === "restarbeiten.layout.root" && scope.reason === "M80_2_split_removed"));
      for (const scope of complete) {
        assert.equal(scope.expectedElementIds.length, scope.elements.length, scope.scopeId);
        assert.ok(scope.elements.every((entry) => entry.referenceResolved && rendered.getRef(entry.id)), scope.scopeId);
      }

      const edit = complete.find((scope) => scope.scopeId === "restarbeiten.edit.root");
      assert.equal(edit.elements.length, 53, "alle 49 Altziele und vier explizite Layoutzonen/Iconziele sind vorhanden");
      const ids = new Set(edit.elements.map((entry) => entry.id));
      for (const id of [
        "restarbeiten.edit.header.current", "restarbeiten.edit.short.label", "restarbeiten.edit.short.field",
        "restarbeiten.edit.short.remaining", "restarbeiten.edit.short.dictation", "restarbeiten.edit.class.label",
        "restarbeiten.edit.class.control", "restarbeiten.edit.class.rest", "restarbeiten.edit.class.defect",
        "restarbeiten.edit.action.new", "restarbeiten.edit.action.delete", "restarbeiten.edit.long.label",
        "restarbeiten.edit.long.field", "restarbeiten.edit.location.1.label", "restarbeiten.edit.location.1.field",
        "restarbeiten.edit.location.4.label", "restarbeiten.edit.location.4.field", "restarbeiten.edit.meta.status.label",
        "restarbeiten.edit.meta.status.field", "restarbeiten.edit.meta.due.label", "restarbeiten.edit.meta.due.field",
        "restarbeiten.edit.meta.ampel", "restarbeiten.edit.meta.responsible.label", "restarbeiten.edit.meta.responsible.field",
        "restarbeiten.edit.validation", "restarbeiten.edit.action.note",
      ]) assert.ok(ids.has(id), id);
      for (const button of edit.elements.filter((entry) => entry.type === "button")) {
        assert.ok(button.lockedOps.includes("executeTargetAction"), button.id);
        assert.ok(button.lockedOps.includes("modifyDomainData"), button.id);
      }
      const columns = complete.find((scope) => scope.scopeId === "restarbeiten.list.root").elements.filter((entry) => entry.type === "tableColumn");
      assert.deepEqual(columns.map((entry) => entry.name), [
        "Nr. / Datum / Klasse / Fotos",
        "Gegenstand – Verortung / Kurztext / Langtext",
        "Fertig bis / Ampel / Status / Verantwortlich",
      ]);

      const fingerprint = createRegistryFingerprint(registration.registryScopes);
      const contract = createElectronTargetContract({
        applicationId: registration.applicationId, displayName: registration.displayName, appVersion: "1.5.0",
        registryVersion: registration.registryVersion, registryFingerprint: fingerprint, registryStatus: registration.registryStatus,
        activeScopes: registration.activeScopes, profileRoot: "C:\\m80-1-profile", supportedOperations: registration.supportedOperations,
        transportProtocolVersion: LOCAL_TARGET_PROTOCOL_VERSION, sessionId: "m80-1-session", processId: process.pid,
      });
      const validation = validateRegistrationSnapshot({ contract, registryScopes: registration.registryScopes });
      assert.equal(validation.ok, true, JSON.stringify(validation.errors));

      const currentFingerprint = createRegistryFingerprint(registration.registryScopes);
      rendered.setDiagnosticRegistryRevision(1);
      const changedRegistration = rendered.registrationDescriptor();
      assert.equal(changedRegistration.registryVersion, registration.registryVersion + 1);
      assert.notEqual(createRegistryFingerprint(changedRegistration.registryScopes), currentFingerprint);
      rendered.setDiagnosticRegistryRevision(0);

      const header = complete.find((scope) => scope.scopeId === "restarbeiten.header.root");
      assert.equal(header.elements.length, 31, "sichtbarer Filter-Header ist vollständig inventarisiert");
      assert.ok(header.elements.every((entry) => entry.referenceResolved));
      assert.equal(header.elements.some((entry) => entry.id === "restarbeiten.layout.split"), false);
      const split = rendered.request({ action: "submitChange", scopeId: "restarbeiten.layout.root", changeRequest: { changeId: "split", elementId: "restarbeiten.layout.split", operation: "resizeHeight", payload: { height: 300 } } }).changeResult;
      assert.equal(split.success, false);
      assert.equal(split.errorCode, "electron_element_not_found", "alte Verhältnisoperation wird nicht mehr angeboten");

      const resizeHeader = rendered.request({ action: "submitChange", scopeId: "restarbeiten.header.root", changeRequest: { changeId: "header-height", elementId: "restarbeiten.header.root", operation: "resizeHeight", payload: { height: 110 } } }).changeResult;
      assert.equal(resizeHeader.success, true);
      assert.equal(resizeHeader.newState.height, 110);
      const editWidth = rendered.request({ action: "submitChange", scopeId: "restarbeiten.edit.root", changeRequest: { changeId: "edit-width", elementId: "restarbeiten.edit.root", operation: "resizeWidth", payload: { width: 760 } } }).changeResult;
      const editHeight = rendered.request({ action: "submitChange", scopeId: "restarbeiten.edit.root", changeRequest: { changeId: "edit-height", elementId: "restarbeiten.edit.root", operation: "resizeHeight", payload: { height: 300 } } }).changeResult;
      assert.equal(editWidth.errorCode, "electron_operation_not_allowed", "Editboxbreite bleibt im flexiblen BBM-Layout verankert");
      assert.equal(editHeight.newState.height, 300);
      const editMinimum = rendered.request({ action: "submitChange", scopeId: "restarbeiten.edit.root", changeRequest: { changeId: "edit-min", elementId: "restarbeiten.edit.root", operation: "resizeHeight", payload: { height: 1 } } }).changeResult;
      assert.equal(editMinimum.newState.height, 190, "Editbox-Mindesthöhe wird eingehalten");

      const shortInput = rendered.getRef("restarbeiten.edit.short.field").element;
      const fachwert = shortInput.value;
      const defectButton = rendered.getRef("restarbeiten.edit.class.defect").element;
      const resizeDefect = rendered.request({ action: "submitChange", scopeId: "restarbeiten.edit.root", changeRequest: { changeId: "resize-defect", elementId: "restarbeiten.edit.class.defect", operation: "resizeWidth", payload: { width: 44 } } }).changeResult;
      assert.equal(resizeDefect.success, true);
      assert.equal(defectButton.style.boxSizing || "", "", "HostAdapter erzwingt kein fremdes Boxmodell");
      assert.equal(defectButton.style.flexShrink || "", "", "HostAdapter friert den bestehenden Flexvertrag nicht ein");
      assert.equal(resizeDefect.newState.width, 44);
      const hideLabel = rendered.request({ action: "submitChange", scopeId: "restarbeiten.edit.root", changeRequest: { changeId: "hide-label", elementId: "restarbeiten.edit.short.label", operation: "setVisibility", payload: { visible: false } } }).changeResult;
      assert.equal(hideLabel.success, true);
      assert.equal(rendered.getRef("restarbeiten.edit.short.label").element.classList.contains("bbm-ui-editor-hidden"), true);
      assert.equal(shortInput.classList.contains("bbm-ui-editor-hidden"), false);
      assert.equal(shortInput.value, fachwert, "Fachwert bleibt unverändert");
    } finally {
      global.document = previous.document; global.window = previous.window; global.Element = previous.Element;
    }
  });

  await run("M80.1 BBM: Refresh-Bridge, Runtimeereignisse und Schutzpfade sind verdrahtet", () => {
    const session = fs.readFileSync(path.join(ROOT, "src/main/ui-editor/electronUiEditorSession.js"), "utf8");
    const preload = fs.readFileSync(path.join(ROOT, "src/main/preload.js"), "utf8");
    const navigation = fs.readFileSync(path.join(ROOT, "src/renderer/app/coreShellNavigation.js"), "utf8");
    for (const action of ["registryChanged", "registryStatusChanged", "scopeAdded", "scopeChanged", "scopeRemoved"]) {
      assert.match(session, new RegExp(action));
      assert.match(preload, new RegExp(action));
    }
    assert.match(session, /prepareRegistryRefresh/);
    assert.match(session, /compareRegistrySnapshots/);
    assert.match(session, /validateRegistrationSnapshot/);
    assert.match(navigation, /UI-Registry wird geprüft/);
    assert.doesNotMatch(session + preload + navigation, /WebSocket|https?:\/\//i);
  });

  await run("M80.1 BBM: jeder Öffnungsweg refresht, Änderung lädt neu und Dirty-Konflikt schützt", async () => {
    assert.ok(runtimeRegistration);
    const { ElectronUiEditorSessionController } = require("../../src/main/ui-editor/electronUiEditorSession.js");
    const children = [];
    const clients = [];
    const controller = new ElectronUiEditorSessionController({
      app: { isPackaged: false, getPath: () => "C:\\m80-1-user", getVersion: () => "1.5.0" },
      ipcMain: { handle() {} }, getMainWindow: () => ({ isDestroyed: () => false, webContents: { send() {} } }),
      spawnProcess: () => { const child = children.at(-1); return child; },
      clientFactory: () => { const client = new MockClient(children.at(-1)); clients.push(client); return client; },
      executableResolver: () => "C:\\trusted\\UiEditorManager.exe",
      runtimeRootResolver: () => "C:\\trusted\\editor-runtime",
      sessionIdentifiersFactory: () => ({ pipeName: `ui-editor-kit-m80-${children.length}`, sessionNonce: "x".repeat(48), sessionId: `session-${children.length}` }),
      profileRootResolver: () => "C:\\trusted\\profiles", ensureDirectory: () => {},
    });
    const start = async (registration) => { children.push(new MockChild()); return controller.open(registration); };
    const first = await start(runtimeRegistration);
    assert.equal(first.started, true);
    const second = await controller.open(runtimeRegistration);
    assert.equal(second.focused, true);
    assert.ok(clients[0].events.some((event) => event.action === "activateEditor"));

    const changed = structuredClone(runtimeRegistration);
    const scope = changed.registryScopes.find((entry) => entry.scopeId === "restarbeiten.edit.root");
    const source = scope.elements.find((entry) => entry.id === "restarbeiten.edit.validation");
    scope.elements.push({ ...source, id: "restarbeiten.edit.runtimeHint", name: "Runtime-Hinweis", semanticKey: "restarbeiten.edit.runtimeHint", refKey: "restarbeiten.edit.runtimeHint", order: 103 });
    scope.expectedElementIds.push("restarbeiten.edit.runtimeHint");
    children.push(new MockChild());
    const refreshed = await controller.open(changed);
    assert.equal(refreshed.ok, true);
    assert.equal(refreshed.registryRefreshStatus, "changed");
    assert.deepEqual(refreshed.addedElementIds, ["restarbeiten.edit.runtimeHint"]);
    assert.equal(children[0].exitCode, 0, "alte Instanz beendet");
    assert.equal(children[1].exitCode, null, "genau eine neue Instanz aktiv");

    clients.at(-1).dirty = true;
    const changedAgain = structuredClone(changed);
    changedAgain.registryVersion += 1;
    const conflict = await controller.open(changedAgain);
    assert.equal(conflict.ok, false);
    assert.equal(conflict.errorCode, "registry_profile_conflict");
    assert.equal(children[1].exitCode, null, "gültiger laufender Stand bleibt erhalten");
    await controller.shutdown();
  });
}

module.exports = { runM801RegistrationRefreshTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runM801RegistrationRefreshTests(run).then(() => {
    if (failed) process.exitCode = 1;
  }).catch((error) => {
    process.exitCode = 1;
    console.error(error?.stack || error);
  });
}
