"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { EventEmitter } = require("node:events");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

class FakeElement {
  constructor(tag = "div") {
    this.tagName = tag.toUpperCase(); this.children = []; this.parentElement = null; this.attributes = {}; this.dataset = {}; this.className = "";
    this.style = { setProperty(name, value) { this[name] = value; }, getPropertyValue(name) { return this[name] || ""; } };
    this.value = "Fachwert bleibt"; this._rect = { left: 10, top: 20, width: 200, height: 40 };
    this.classList = { contains: (name) => this.className.split(/\s+/).includes(name), toggle: (name, active) => { const set = new Set(this.className.split(/\s+/).filter(Boolean)); if (active) set.add(name); else set.delete(name); this.className = [...set].join(" "); } };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this); }
  getBoundingClientRect() { return { ...this._rect, width: parseFloat(this.style.width) || this._rect.width, height: parseFloat(this.style.height) || this._rect.height }; }
}

function fakeDom() {
  const listeners = new Map();
  const body = new FakeElement("body");
  const all = () => { const result = []; const visit = (node) => { result.push(node); node.children.forEach(visit); }; visit(body); return result; };
  const document = {
    body,
    createElement: (tag) => new FakeElement(tag),
    querySelector(selector) { if (selector === "[data-bbm-ui-editor-overlay]") return all().find((node) => node.getAttribute("data-bbm-ui-editor-overlay") !== null) || null; return null; },
    addEventListener(type, handler) { listeners.set(type, handler); },
    removeEventListener(type, handler) { if (listeners.get(type) === handler) listeners.delete(type); },
    async click(target) {
      const event = { target, prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; }, stopImmediatePropagation() { this.stopped = true; } };
      await listeners.get("click")?.(event);
      return event;
    },
  };
  return { document, listeners };
}

class MockChild extends EventEmitter {
  constructor() { super(); this.exitCode = null; }
  exit(code = 0) { if (this.exitCode !== null) return; this.exitCode = code; this.emit("exit", code); }
  kill() { this.exit(0); return true; }
}
class MockClient extends EventEmitter {
  constructor() { super(); this.connected = false; this.handshaken = false; this.events = []; this.requests = []; this.child = null; }
  async connect() { this.connected = true; this.handshaken = true; return { action: "handshakeAccepted" }; }
  sendEvent(action, payload = {}) { this.events.push({ action, ...payload }); if (action === "shutdownEditor") setImmediate(() => this.child?.exit()); return this.connected; }
  request(action) { this.requests.push(action); return Promise.resolve({ action: `${action}Accepted` }); }
  respond(message, payload, error) { this.response = { message, payload, error }; return true; }
  async close() { this.connected = false; this.handshaken = false; }
}

async function runM80ElectronUiEditorTests(run) {
  const registryModule = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const scopes = registryModule.listM80RegistryScopes();
  const entries = scopes.flatMap((scope) => scope.elements);
  const registrationScopes = scopes.map((scope) => scope.status === "complete" ? {
    ...scope,
    elements: scope.elements.map((entry) => ({ ...entry, referenceResolved: true })),
  } : scope);
  const registration = {
    applicationId: "bbm-produktiv", displayName: "BBM", framework: "electron",
    registryVersion: registryModule.BBM_M80_REGISTRY_VERSION, registryStatus: "incomplete",
    activeScopes: [...registryModule.BBM_M80_ACTIVE_SCOPES],
    supportedOperations: ["move", "resize", "resizeWidth", "resizeHeight", "textMove", "textResize", "setVisibility"],
    uiCapability: "layout", pdfCapability: "unavailable", labelFieldSeparation: true, visibilityCapability: true,
    registryScopes: registrationScopes,
  };

  await run("M80 Sidebar: echte Aktion UI-Editor öffnen ist keine Screenroute", () => {
    const navigation = read("src/renderer/app/coreShellNavigation.js");
    assert.match(navigation, /kind:\s*"action"/);
    assert.match(navigation, /label:\s*"UI-Editor öffnen"/);
    assert.doesNotMatch(navigation, /UI-Editor Status/);
    assert.doesNotMatch(navigation, /router\.showUiEditor\(\)/);
  });

  await run("M80 Preload: API ist eng, größenbegrenzt und nicht generisch", () => {
    const preload = read("src/main/preload.js");
    assert.match(preload, /exposeInMainWorld\("uiEditor"/);
    for (const method of ["getDiagnosticMode", "open", "close", "getStatus", "respond", "sendTargetEvent", "onRequest", "onEvent"]) assert.match(preload, new RegExp(`${method}:`));
    assert.doesNotMatch(preload, /uiEditor.*send:\s*\(|uiEditor.*invoke:\s*\(/s);
    assert.match(preload, /UI_EDITOR_MAX_MESSAGE_BYTES\s*=\s*1024\s*\*\s*1024/);
    assert.doesNotMatch(preload, /uiEditorOpen|uiEditorSelectElement/);
  });

  await run("M80 Diagnose: echter Restarbeiten-Pilot bleibt ohne Fachdatenpersistenz", () => {
    const diagnostic = read("src/renderer/ui-editor/m80Diagnostic.js");
    assert.match(diagnostic, /RestarbeitenScreen/);
    assert.match(diagnostic, /projectId:\s*null/);
    assert.match(diagnostic, /data-bbm-m80-diagnostic/);
    assert.match(diagnostic, /event\.ctrlKey\s*&&\s*event\.shiftKey/);
    assert.match(diagnostic, /uiEditorFailNextApply\s*=\s*"true"/);
    assert.doesNotMatch(diagnostic, /bbmDb|createRestarbeitItem|updateRestarbeitItem|localStorage/);
  });

  await run("M80 Electron-Sicherheit: BrowserWindow-Härtung bleibt aktiv", () => {
    const main = read("src/main/main.js");
    assert.match(main, /contextIsolation:\s*true/); assert.match(main, /nodeIntegration:\s*false/);
    assert.match(main, /sandbox:\s*true/); assert.match(main, /webSecurity:\s*true/);
    assert.match(main, /uiEditor:getDiagnosticMode/);
    assert.match(main, /BBM_M80_EDITOR_DIAGNOSTIC/);
  });

  await run("M80 Registry: drei aktive Restarbeiten-Scopes und explizit gesperrte Restbereiche", () => {
    assert.deepEqual(scopes.filter((scope) => scope.status === "complete").map((scope) => scope.scopeId), ["restarbeiten.header.root", "restarbeiten.list.root", "restarbeiten.edit.root"]);
    assert.ok(scopes.some((scope) => scope.scopeId === "bbm.protokoll" && scope.status === "blocked"));
    assert.ok(scopes.some((scope) => scope.scopeId === "restarbeiten.layout.root" && scope.status === "blocked"));
    assert.equal(entries.some((entry) => entry.id === "restarbeiten.layout.split"), false);
    assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
    const ids = new Set(entries.map((entry) => entry.id));
    entries.filter((entry) => entry.parentId).forEach((entry) => assert.ok(ids.has(entry.parentId), entry.id));
    assert.equal(entries.some((entry) => /protokoll|projektverwaltung|firma/i.test(entry.id)), false);
  });

  await run("M80 Registry: Label und Feld sind getrennte Geschwister", () => {
    for (const prefix of ["restarbeiten.filterbar.location.level1", "restarbeiten.filterbar.meta.status", "restarbeiten.edit.short", "restarbeiten.edit.long"]) {
      const label = entries.find((entry) => entry.id === `${prefix}.label`);
      const field = entries.find((entry) => entry.id === `${prefix}.field`);
      assert.equal(label.parentId, prefix); assert.equal(field.parentId, prefix); assert.notEqual(label.id, field.id);
    }
  });

  await run("M80 Registry: bestätigte Hauptliste besitzt exakt drei Spaltengruppen", () => {
    const columns = entries.filter((entry) => entry.parentId === "restarbeiten.list.table" && entry.type === "tableColumn");
    assert.deepEqual(columns.map((entry) => entry.name), [
      "Nr. / Datum / Klasse / Fotos",
      "Gegenstand – Verortung / Kurztext / Langtext",
      "Status-Metaspalte – Fertig bis / Ampel / Status / Verantwortlich",
    ]);
    assert.equal(columns[2].columnRole, "metaColumn");
  });

  await run("M80 Registry: Fachbutton ist nur Layoutobjekt und Fachoperationen sind gesperrt", () => {
    const button = entries.find((entry) => entry.id === "restarbeiten.edit.action.new");
    assert.equal(button.actionKind, "domainCreate");
    assert.ok(button.lockedOps.includes("executeTargetAction")); assert.ok(button.lockedOps.includes("createRecord"));
    assert.ok(button.allowedOps.includes("move")); assert.ok(button.allowedOps.includes("setVisibility"));
  });

  await run("M80 DOM-Vertrag: jedes Pilotelement erhält alle sechs Pflichtattribute", () => {
    const contractCheck = require(path.resolve(ROOT, "..", "UI-Editor-kit", "scripts", "ui-editor-contract-check.cjs"));
    for (const entry of entries) {
      const attrs = registryModule.m80EditorAttributes(entry.id);
      assert.deepEqual(Object.keys(attrs), ["data-ui-inspector-id", "data-ui-editor-kind", "data-ui-editor-label", "data-ui-editor-parent", "data-ui-editor-editable", "data-ui-editor-ops"]);
      assert.equal(attrs["data-ui-inspector-id"], entry.id);
    }
    for (const scope of scopes) {
      const html = scope.elements.map((entry) => {
        const attrs = registryModule.m80EditorAttributes(entry.id);
        return `<div ${Object.entries(attrs).map(([name, value]) => `${name}="${String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;")}"`).join(" ")}></div>`;
      }).join("\n");
      const checked = contractCheck.validateText(html, `BBM:${scope.scopeId}`);
      assert.equal(checked.valid, true, JSON.stringify(checked.errors));
    }
  });

  await run("M80 führender Pfad: neue Bridge ist produktführend, alte Runtime nicht", () => {
    assert.match(read("src/renderer/main.js"), /installBbmM80EditorBridge\(\)/);
    assert.match(read("src/main/ipc/uiEditorIpc.js"), /ElectronUiEditorSessionController/);
    assert.match(read("src/main/ui-editor/electronUiEditorSession.js"), /requestAction}Accepted/);
    assert.doesNotMatch(read("src/renderer/app/coreShellNavigation.js"), /showUiEditor/);
  });

  await run("M80 Prozesspfad: Renderer kann keinen Programmpfad und keine Shell-Zeichenkette liefern", () => {
    const source = read("src/main/ui-editor/electronUiEditorSession.js");
    assert.match(source, /resolveTrustedEditorExecutable/); assert.match(source, /shell:\s*false/);
    assert.doesNotMatch(source, /message\.(executable|path|command)|payload\.(executable|path|command)/);
    assert.match(source, /--electron-target-editor/);
  });

  await run("M80 Produktion: Packdefinition enthält Manager, Preload und Renderer-Bridge", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.equal(pkg.dependencies["ui-editor-kit"], "file:../UI-Editor-kit");
    assert.ok(pkg.build.extraResources.some((entry) => entry.to === "ui-editor"));
    assert.ok(pkg.build.files.includes("src/**/*"));
  });

  await run("M80 Lifecycle: erster Start, zweiter Fokus und genau ein Prozess", async () => {
    const { ElectronUiEditorSessionController } = require("../../src/main/ui-editor/electronUiEditorSession.js");
    const handlers = new Map(); const client = new MockClient(); const child = new MockChild(); client.child = child; let spawns = 0;
    const sent = []; const mainWindow = { isDestroyed: () => false, focus() {}, webContents: { send: (...args) => sent.push(args) } };
    const controller = new ElectronUiEditorSessionController({
      app: { isPackaged: false, getPath: () => path.join(ROOT, ".m80-test-profile"), getVersion: () => "1.5.0" },
      ipcMain: { handle: (name, fn) => handlers.set(name, fn) }, getMainWindow: () => mainWindow,
      spawnProcess: () => { spawns += 1; return child; }, clientFactory: () => client,
      executableResolver: () => "C:\\trusted\\UiEditorManager.exe", runtimeRootResolver: () => "C:\\trusted\\editor-runtime",
      sessionIdentifiersFactory: () => ({ pipeName: "ui-editor-kit-m80-test", sessionNonce: "x".repeat(48), sessionId: "session-test" }),
      profileRootResolver: () => "C:\\trusted\\profiles", ensureDirectory: () => {},
    });
    controller.registerIpc();
    const first = await handlers.get("uiEditor:open")(null, registration); const second = await handlers.get("uiEditor:open")(null, registration);
    assert.equal(first.started, true); assert.equal(second.focused, true); assert.equal(spawns, 1);
    assert.equal(client.events.filter((event) => event.action === "activateEditor").length, 1);

    client.emit("message", { messageType: "request", messageId: "request-0001", payload: { action: "getRegistry" } });
    assert.equal(sent.at(-1)[0], "uiEditor:request");
    await handlers.get("uiEditor:respond")(null, { requestId: "request-0001", ok: true, payload: { registryScopes: registrationScopes } });
    assert.equal(client.response.payload.registryScopes.length, registrationScopes.length);
    assert.match(client.response.payload.registryFingerprint, /^sha256:[a-f0-9]{64}$/);
    await controller.shutdown();
    assert.equal(child.exitCode, 0); assert.equal(controller.status().running, false);
  });

  await run("M80 Fehlerweg: fehlender Editor liefert gefilterten Installationshinweis", () => {
    const session = require("../../src/main/ui-editor/electronUiEditorSession.js");
    assert.throws(() => session.resolveTrustedEditorExecutable({ app: { isPackaged: true }, resourcesPath: "Z:\\missing", localAppData: "Z:\\missing" }), (error) => error.code === "electron_editor_not_installed");
    assert.match(session.publicError({ code: "electron_editor_not_installed" }).message, /nicht installiert/);
  });

  await run("M80 HostAdapter: Move, Breite, Höhe, Textposition, Schriftgröße und Sichtbarkeit", async () => {
    const dom = fakeDom(); const old = { document: global.document, window: global.window, Element: global.Element };
    const targetEvents = [];
    global.document = dom.document; global.Element = FakeElement;
    global.window = { getComputedStyle: (element) => ({ width: element.style.width || "200px", height: element.style.height || "40px", paddingLeft: element.style.paddingLeft || "0px", paddingTop: element.style.paddingTop || "0px", fontSize: element.style.fontSize || "12px" }), uiEditor: { sendTargetEvent: async (event) => targetEvents.push(event) } };
    try {
      const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
      host.resetM80PilotWorkingStatesForDiagnostic();
      const detachedRoot = new FakeElement(); detachedRoot.isConnected = false; detachedRoot._rect.width = 1;
      host.beginM80PilotRender(); host.registerM80Ref("restarbeiten.list.root", detachedRoot); host.completeM80PilotRender();
      host.beginM80PilotRender();
      const refs = new Map();
      for (const entry of entries) { const element = new FakeElement(entry.type === "field" ? "input" : entry.type === "button" ? "button" : "div"); element.isConnected = true; refs.set(entry.id, element); host.registerM80Ref(entry.id, element); }
      host.completeM80PilotRender();
      assert.equal(host.getM80InteractionStatus().scopeStates.flatMap((scope) => scope.elements).find((state) => state.elementId === "restarbeiten.list.root").width, 200, "Getrenntes Vorab-Rendern darf keine 1-DIP-Baseline einfrieren");
      const submit = (elementId, operation, payload, changeId = `${elementId}-${operation}`) => host.handleM80EditorRequest({
        action: "submitChange",
        scopeId: elementId.startsWith("restarbeiten.header") || elementId.startsWith("restarbeiten.filterbar")
          ? "restarbeiten.header.root"
          : elementId.startsWith("restarbeiten.list") ? "restarbeiten.list.root" : "restarbeiten.edit.root",
        changeRequest: { changeId, elementId, operation, payload },
      }).changeResult;
      const fieldId = "restarbeiten.edit.short.field"; const labelId = "restarbeiten.edit.short.label";
      assert.equal(submit(fieldId, "move", { x: 7, y: 9 }).success, true);
      assert.equal(submit(fieldId, "resizeWidth", { width: 310 }).newState.width, 310);
      assert.equal(submit(fieldId, "resizeHeight", { height: 65 }).newState.height, 65);
      assert.equal(submit(fieldId, "textMove", { text: { offsetX: 8, offsetY: 6 } }).newState.textOffsetX, 8);
      assert.equal(submit(fieldId, "textResize", { text: { fontSize: 18 } }).newState.fontSize, 18);
      assert.equal(submit(labelId, "setVisibility", { visible: false }).success, true);
      assert.equal(submit(fieldId, "setVisibility", { visible: true }).newState.visible, true);
      assert.equal(refs.get(labelId).classList.contains("bbm-ui-editor-hidden"), true);
      assert.equal(refs.get(fieldId).classList.contains("bbm-ui-editor-hidden"), false);
      assert.ok(host.getM80InteractionStatus().scopeStates.flatMap((scope) => scope.elements).some((state) => state.elementId === labelId), "Unsichtbares Element bleibt im Baumzustand");
      submit(labelId, "setVisibility", { visible: true }); submit(fieldId, "setVisibility", { visible: false });
      assert.equal(refs.get(labelId).classList.contains("bbm-ui-editor-hidden"), false); assert.equal(refs.get(fieldId).classList.contains("bbm-ui-editor-hidden"), true);
      submit(fieldId, "setVisibility", { visible: true });
      assert.equal(submit("restarbeiten.list.table.number", "resizeWidth", { width: 125 }).newState.width, 125);
      assert.equal(submit("restarbeiten.header.root", "resizeHeight", { height: 108 }).newState.height, 108);
      assert.equal(submit("restarbeiten.edit.root", "resizeWidth", { width: 760 }).newState.width, 760);
      assert.equal(submit("restarbeiten.edit.root", "resizeHeight", { height: 300 }).newState.height, 300);
      assert.equal(submit("restarbeiten.header.root", "move", { x: 10 }).errorCode, "electron_operation_not_allowed");

      host.handleM80EditorEvent({ action: "highlightElement", elementId: labelId });
      assert.equal(dom.document.querySelector("[data-bbm-ui-editor-overlay]").style.display, "block");
      let businessExecutions = 0; const button = refs.get("restarbeiten.edit.action.new");
      host.handleM80EditorEvent({ action: "beginTargetSelection" });
      const selected = await dom.document.click(button); if (!selected.stopped) businessExecutions += 1;
      assert.equal(businessExecutions, 0); assert.equal(targetEvents.at(-1).elementId, "restarbeiten.edit.action.new");
      const locked = submit("restarbeiten.edit.action.new", "createRecord", {});
      assert.equal(locked.success, false); assert.equal(locked.errorCode, "electron_operation_locked");

      const valueBefore = refs.get(fieldId).value;
      refs.get(fieldId).dataset.uiEditorFailNextApply = "true";
      const rollback = submit(fieldId, "resizeWidth", { width: 999 }, "controlled-failure");
      assert.equal(rollback.success, false); assert.equal(rollback.rollbackSucceeded, true); assert.equal(refs.get(fieldId).value, valueBefore);
      global.window.dispatchEvent = () => {};
      host.clearM80EditorInteraction();
      assert.equal(dom.document.querySelector("[data-bbm-ui-editor-overlay]"), null);

      host.beginM80PilotRender();
      for (const entry of entries.filter((entry) => entry.id !== fieldId)) host.registerM80Ref(entry.id, refs.get(entry.id));
      host.completeM80PilotRender();
      const missing = submit(fieldId, "resizeWidth", { width: 300 }, "missing-ref");
      assert.equal(missing.success, false); assert.equal(missing.errorCode, "electron_element_not_found");
      host.handleM80EditorEvent({ action: "editorClosed" });
      assert.equal(host.getM80InteractionStatus().selectionMode, false);
    } finally { global.document = old.document; global.window = old.window; global.Element = old.Element; }
  });

  await run("M80 Profil- und Fachdatengrenze: Registry und Transport enthalten keine Fachwerte", () => {
    const combined = JSON.stringify(scopes) + read("src/main/ui-editor/electronUiEditorSession.js");
    assert.doesNotMatch(combined, /Fachwert|responsibleValue|dueDateValue|recordId|rows\s*:/i);
    assert.match(read("src/renderer/ui-editor/m80HostAdapter.js"), /FORBIDDEN_KEYS/);
  });

  await run("M80 PDF-Grenze: BBM bleibt für M81 ausdrücklich nicht angebunden", () => {
    const native = read("../UI-Editor-kit/reference-target-app/src/ReferenceTargetApp.Wpf/UI/Editor/ElectronTargetEditor.cs");
    assert.match(native, /BBM-PDF noch nicht angebunden/); assert.doesNotMatch(native, /ReferenceOrderFactory/);
  });
}

module.exports = { runM80ElectronUiEditorTests };
