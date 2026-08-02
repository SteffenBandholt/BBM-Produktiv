"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const uiEditorKit = require("ui-editor-kit");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");
const sha256 = (relativePath) => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, relativePath))).digest("hex").toUpperCase();

class FakeElement {
  constructor(tagName = "DIV", width = 600, height = 300) {
    this.tagName = tagName; this.attributes = {}; this.dataset = {}; this.className = ""; this.parentElement = null; this.children = []; this.isConnected = true;
    this._rect = { left: 0, top: 0, width, height }; this.scrollWidth = width; this.scrollHeight = height;
    this.style = { setProperty(name, value) { this[name] = value; }, getPropertyValue(name) { return this[name] || ""; } };
    this.classList = { contains: (name) => this.className.split(/\s+/).includes(name), toggle: (name, active) => { const names = new Set(this.className.split(/\s+/).filter(Boolean)); if (active) names.add(name); else names.delete(name); this.className = [...names].join(" "); } };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); if (name === "data-ui-editor-id") this.dataset.uiEditorId = String(value); }
  getAttribute(name) { return this.attributes[name] || null; }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  getBoundingClientRect() { return { ...this._rect, width: parseFloat(this.style.width) || this._rect.width, height: parseFloat(this.style.height) || this._rect.height }; }
}

async function runM826TopScreenModuleClosureTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
  const listScope = registry.listM80RegistryScopes().find((scope) => scope.scopeId === "restarbeiten.list.root");
  const byId = new Map(listScope.elements.map((entry) => [entry.id, entry]));
  const mainBody = read("src/renderer/modules/restarbeiten/RestarbeitenMainBody.js");
  const css = read("src/renderer/modules/restarbeiten/styles/restarbeiten.css");
  const screen = read("src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js");

  await run("M82.6 BBM 01: Tabellen-Viewport ist aus dem DOM-Aufbau entfernt", () => assert.doesNotMatch(mainBody, /bbm-restarbeiten-table-viewport/));
  await run("M82.6 BBM 02: Tabellen-ScrollArea ist aus dem DOM-Aufbau entfernt", () => assert.doesNotMatch(mainBody, /bbm-restarbeiten-table-scroll-area/));
  await run("M82.6 BBM 03: Tabelle haengt wieder direkt unter dem Listenblatt", () => assert.match(mainBody, /paper\.appendChild\(table\)/));
  await run("M82.6 BBM 04: Registry enthaelt keinen Editor-Viewport", () => assert.equal(byId.has("restarbeiten.list.viewport"), false));
  await run("M82.6 BBM 05: Registry enthaelt keinen Editor-Scrollbereich", () => assert.equal(byId.has("restarbeiten.list.scrollArea"), false));
  await run("M82.6 BBM 06: logisches Tabellenziel nutzt vorhandenes Listenblatt als Parent", () => assert.equal(byId.get("restarbeiten.list.table").parentId, "restarbeiten.list.paper"));
  await run("M82.6 BBM 07: Tabellenmetadaten verlangen keinen Wrapper", () => { assert.equal(byId.get("restarbeiten.list.table").tableLayout.parentId, "restarbeiten.list.paper"); assert.notEqual(byId.get("restarbeiten.list.table").tableLayout.requiresDedicatedWrapper, true); });
  await run("M82.6 BBM 08: BBM gibt keinen horizontalen Scrollmodus frei", () => assert.equal(byId.get("restarbeiten.list.table").allowedOps.includes("setHorizontalOverflowMode"), false));
  await run("M82.6 BBM 09: Tabellenmetadaten bleiben auf vorhandene Breite eingepasst", () => assert.equal(byId.get("restarbeiten.list.table").tableLayout.horizontalOverflowMode, "fitViewport"));
  await run("M82.6 BBM 10: alte Overflow-Regeln sind entfernt", () => assert.doesNotMatch(css, /bbm-restarbeiten-table-(viewport|scroll-area)/));
  await run("M82.6 BBM 11: nur die vorhandene Mitte scrollt vertikal", () => assert.match(css, /\.bbm-restarbeiten-main\s*\{[\s\S]*?overflow-x:\s*hidden;[\s\S]*?overflow-y:\s*auto;/));
  await run("M82.6 BBM 12: TopScreen behaelt Kopf, Liste und Editbox", () => ["bbm-restarbeiten-header", "bbm-restarbeiten-workspace__list", "bbm-restarbeiten-workspace__edit"].forEach((name) => assert.match(screen, new RegExp(name))));
  await run("M82.6 BBM 13: A4-nahe Listenblattbreite bleibt 900 px", () => assert.match(css, /\.bbm-restarbeiten-paper\s*\{[\s\S]*?width:\s*min\(100%,\s*900px\)/));
  await run("M82.6 BBM 14: Protokoll-TopsScreen blieb bytegleich", () => assert.equal(sha256("src/renderer/views/TopsScreen.js"), "0826FDC88D2D454D384F0D64CC6678AC356E2BFD73041B9336E89266EF57D1B3"));
  await run("M82.6 BBM 15: Protokoll-TopScreen-CSS blieb bytegleich", () => assert.equal(sha256("src/renderer/tops/styles/tops.css"), "93863CA66367BF145DD4E5E50F78811A784BFE8AE70BBE50996249306DF084CB"));
  await run("M82.6 BBM 16: Protokoll besitzt weiterhin genau den mittleren Sheet-Scrollbereich", () => { const protocolCss = read("src/renderer/tops/styles/tops.css"); assert.match(protocolCss, /\[data-bbm-tops-screen-area="sheet"\][\s\S]*?overflow:\s*auto/); assert.match(protocolCss, /\[data-bbm-tops-screen-area="edit"\][\s\S]*?flex:\s*0 0 auto/); });

  const protocolScopes = registry.listM80RegistryScopes().filter((scope) => scope.scopeId.startsWith("protokoll."));
  const protocolEntries = protocolScopes.flatMap((scope) => scope.elements);
  const protocolById = new Map(protocolEntries.map((entry) => [entry.id, entry]));
  const protocolScreen = read("src/renderer/modules/protokoll/screens/TopsScreen.js");
  const protocolList = read("src/renderer/modules/protokoll/TopsList.js");
  const protocolQuicklane = read("src/renderer/modules/protokoll/TopsScreenQuicklane.js");
  const protocolLayout = read("src/shared/tableLayouts/protokollTopsLayout.js");
  await run("M82.6 BBM 17: BBM erzeugt drei vollstaendige produktive Protokoll-Scopes", () => assert.deepEqual(protocolScopes.map((scope) => [scope.scopeId, scope.status]), [["protokoll.screen.root", "complete"], ["protokoll.list.root", "complete"], ["protokoll.edit.root", "complete"]]));
  await run("M82.6 BBM 18: alter blockierter Protokoll-Platzhalter ist entfernt", () => assert.equal(registry.listM80RegistryScopes().some((scope) => scope.scopeId === "bbm.protokoll"), false));
  await run("M82.6 BBM 19: Protokoll-Registry besitzt Label, Feld und echte Gruppe", () => { assert.equal(protocolById.get("protokoll.edit.short.label").type, "label"); assert.equal(protocolById.get("protokoll.edit.short.field").type, "field"); assert.equal(protocolById.get("protokoll.edit.short").type, "fieldGroup"); });
  await run("M82.6 BBM 20: alle Protokoll-Parents sind explizit registriert", () => protocolEntries.forEach((entry) => { if (entry.parentId) assert.equal(protocolById.has(entry.parentId), true, `${entry.id} -> ${entry.parentId}`); }));
  await run("M82.6 BBM 21: Fachaktionen bleiben fuer Ausfuehrung und Daten gesperrt", () => protocolEntries.filter((entry) => entry.actionKind).forEach((entry) => { assert.equal(entry.lockedOps.includes("executeTargetAction"), true); assert.equal(entry.lockedOps.includes("modifyDomainData"), true); }));
  await run("M82.6 BBM 22: UI-Attribute werden vollstaendig aus BBM-Registry erzeugt", () => assert.deepEqual(Object.keys(registry.m80EditorAttributes("protokoll.edit.short.field")).sort(), ["data-ui-editor-editable", "data-ui-editor-kind", "data-ui-editor-label", "data-ui-editor-ops", "data-ui-editor-parent", "data-ui-inspector-id"]));
  await run("M82.6 BBM 23: produktiver Screen registriert nur vorhandene Objekt-Refs", () => { const block = protocolScreen.slice(protocolScreen.indexOf("  _registerUiEditorRefs() {"), protocolScreen.indexOf("  _buildProtocolScreenRegions() {")); assert.match(block, /registerM80Ref\("protokoll\.edit\.short\.field", editbox\.shortInput\)/); assert.doesNotMatch(block, /createElement|appendChild|insertBefore|querySelector/); });
  await run("M82.6 BBM 24: logische Listenspalten und wiederkehrende Teile verwenden vorhandene Multi-Refs", () => { assert.match(protocolList, /registerM80MultiRef\(column\.id, targets, this\.root/); assert.match(protocolList, /registerM80MultiRef\(id, this\._uiEditorRefs\[id\] \|\| \[\], this\.root/); assert.match(protocolList, /this\.root\.style\.setProperty\(column\.widthVariable/); assert.doesNotMatch(protocolList.slice(protocolList.indexOf("_registerUiEditorColumnRefs()"), protocolList.indexOf("_renderRow(")), /createElement|appendChild|insertBefore|querySelector/); });
  await run("M82.6 BBM 25: Quicklane nutzt ihre vorhandenen stabilen IDs", () => { assert.match(protocolQuicklane, /protokoll\.topsScreen\.quicklane\.group\.navigation/); assert.match(protocolQuicklane, /registerM80Ref\(buttonId, group\.children\[index\]\)/); });
  await run("M82.6 BBM 26: vorhandener Protokoll-Tabellenvertrag bleibt die Breitenquelle", () => { assert.match(protocolLayout, /tableKey:\s*"protokoll_tops"/); assert.match(protocolLayout, /PROTOKOLL_TOPS_COLUMNS[\s\S]*?key:\s*"topNumber"[\s\S]*?key:\s*"shortText"[\s\S]*?key:\s*"meta"/); assert.match(protocolList, /--bbm-tops-list-number-col/); assert.match(protocolList, /--bbm-tops-list-text-col/); assert.match(protocolList, /--bbm-tops-list-meta-col/); });
  await run("M82.6 BBM 27: TopScreen-Reihenfolge bleibt Kopf, Liste, Editbox, Quicklane", () => assert.match(protocolScreen, /root\.append\(this\.header\.root, sheetArea, editArea, this\.quicklane\.root\)/));

  const previous = { document: global.document, window: global.window, Element: global.Element };
  global.Element = FakeElement;
  global.document = { querySelector: () => null, createElement: () => new FakeElement(), addEventListener() {}, removeEventListener() {} };
  global.window = { getComputedStyle: (element) => ({ ...element.style, width: element.style.width || `${element._rect.width}px`, height: element.style.height || `${element._rect.height}px`, paddingLeft: element.style.paddingLeft || "0px", paddingTop: element.style.paddingTop || "0px", fontSize: element.style.fontSize || "12px" }), dispatchEvent() {} };
  refs.resetM80PilotWorkingStatesForDiagnostic();
  refs.beginM80PilotRender();
  const root = new FakeElement("MAIN", 900, 700);
  const area = root.appendChild(new FakeElement("SECTION", 900, 700));
  const paper = area.appendChild(new FakeElement("DIV", 900, 720));
  const table = paper.appendChild(new FakeElement("DIV", 858, 680));
  const header = table.appendChild(new FakeElement("DIV", 858, 28));
  const body = table.appendChild(new FakeElement("DIV", 858, 500));
  refs.registerM80Ref("restarbeiten.list.root", root);
  refs.registerM80Ref("restarbeiten.list.area", area);
  refs.registerM80Ref("restarbeiten.list.paper", paper);
  refs.registerM80TableRef("restarbeiten.list.table", table, table);
  refs.registerM80Ref("restarbeiten.list.table.header", header);
  refs.registerM80Ref("restarbeiten.list.table.body", body);
  refs.completeM80PilotRender();
  try {
    const baseline = refs.snapshotM80Topology();
    await run("M82.6 BBM 28: Electron-Fingerprint erfasst Tag, ID, Parent und Reihenfolge", () => { assert.match(baseline.fingerprint, /^sha256:[0-9a-f]{64}$/); assert.deepEqual(baseline.nodes.find((node) => node.stableId === "restarbeiten.list.table"), { kind: "DIV", stableId: "restarbeiten.list.table", parentId: "restarbeiten.list.paper", order: 0 }); });
    await run("M82.6 BBM 29: Registryabruf ist topologieneutral", () => { host.handleM80EditorRequest({ action: "getRegistry" }); assert.equal(refs.compareM80Topology(baseline).ok, true); });
    await run("M82.6 BBM 30: Layoutabruf ist topologieneutral", () => { host.handleM80EditorRequest({ action: "getLayoutState" }); assert.equal(refs.compareM80Topology(baseline).ok, true); });
    await run("M82.6 BBM 31: Registryrefresh ohne DOM-Umbau bleibt topologieneutral", () => { refs.completeM80PilotRender(); assert.equal(refs.compareM80Topology(baseline).ok, true); });
    await run("M82.6 BBM 32: erlaubte Layoutaenderung erzeugt keinen Knoten", () => { const result = host.handleM80EditorRequest({ action: "submitChange", scopeId: "restarbeiten.list.root", changeRequest: { changeId: "m826-height", elementId: "restarbeiten.list.table", operation: "resizeHeight", payload: { height: 640 }, source: "target-app-start" } }).changeResult; assert.equal(result.success, true); assert.equal(refs.compareM80Topology(baseline).ok, true); });
    await run("M82.6 BBM 33: Hoehenaenderung veraendert weder Display noch Overflow", () => { assert.equal(table.style.display || "", ""); assert.equal(table.style.overflow || "", ""); assert.equal(table.style.overflowX || "", ""); });
    await run("M82.6 BBM 34: unerlaubte Parent-Aenderung wird erkannt", () => { body.parentElement = paper; assert.equal(refs.compareM80Topology(baseline).errorCode, "target_ui_topology_changed"); body.parentElement = table; });
    await run("M82.6 BBM 35: Wiederherstellung liefert erneut denselben Fingerprint", () => assert.equal(refs.compareM80Topology(baseline).ok, true));
    await run("M82.6 BBM 36: BBM-Registry bleibt explizit und ohne DOM-Scan", () => assert.doesNotMatch(read("src/renderer/ui-editor/m80Registry.js"), /querySelector|querySelectorAll|MutationObserver/));
    await run("M82.6 BBM 37: Fachliches Neu-Rendern friert keine gemessene Baseline-Geometrie ein", () => {
      refs.resetM80PilotWorkingStatesForDiagnostic();
      refs.beginM80PilotRender();
      const firstTable = new FakeElement("DIV", 700, 300);
      refs.registerM80TableRef("restarbeiten.list.table", firstTable, firstTable);
      refs.completeM80PilotRender();
      refs.beginM80PilotRender();
      const rerenderedTable = new FakeElement("DIV", 820, 500);
      refs.registerM80TableRef("restarbeiten.list.table", rerenderedTable, rerenderedTable);
      refs.completeM80PilotRender();
      assert.equal(refs.snapshotM80State("restarbeiten.list.table").height, 500);
    });
    await run("M82.6 BBM 38: Ausdrueckliche Editor-Geometrie bleibt ueber ein Neu-Rendern erhalten", () => {
      const edited = refs.applyM80State("restarbeiten.list.table", {
        ...refs.snapshotM80State("restarbeiten.list.table"),
        height: 420,
      });
      assert.equal(edited.height, 420);
      refs.beginM80PilotRender();
      const rerenderedTable = new FakeElement("DIV", 860, 600);
      refs.registerM80TableRef("restarbeiten.list.table", rerenderedTable, rerenderedTable);
      refs.completeM80PilotRender();
      assert.equal(refs.snapshotM80State("restarbeiten.list.table").height, 420);
    });

    refs.resetM80PilotWorkingStatesForDiagnostic();
    refs.beginM80PilotRender();
    const protocolNodes = new Map();
    for (const scope of protocolScopes) {
      for (const entry of scope.elements) {
        const tag = entry.type === "field" ? "INPUT" : entry.type === "label" ? "SPAN" : entry.type === "button" ? "BUTTON" : "DIV";
        const node = new FakeElement(tag, entry.type === "field" ? 260 : 420, entry.type === "root" ? 300 : 48);
        protocolNodes.set(entry.id, node);
        if (entry.parentId) protocolNodes.get(entry.parentId).appendChild(node);
        refs.registerM80Ref(entry.id, node);
      }
    }
    const secondaryColumnCell = new FakeElement("DIV", 180, 48);
    refs.registerM80Ref("protokoll.list.column.text", protocolNodes.get("protokoll.list.column.text"), { targets: [secondaryColumnCell] });
    refs.completeM80PilotRender();
    const protocolBaseline = refs.snapshotM80Topology();
    await run("M82.6 BBM 39: nur die drei gemounteten Protokoll-Scopes werden aktiv", () => assert.deepEqual(host.createM80RegistrationDescriptor().activeScopes, ["protokoll.screen.root", "protokoll.list.root", "protokoll.edit.root"]));
    await run("M82.6 BBM 40: alle Protokoll-Refs sind fuer den Editor aufgeloest", () => host.createM80RegistrationDescriptor().registryScopes.filter((scope) => scope.scopeId.startsWith("protokoll.")).forEach((scope) => assert.equal(scope.status, "complete", scope.scopeId)));
    await run("M82.6 BBM 40a: nicht gemountete Referenzmodule bleiben ohne Laufzeitbaseline blockiert", () => {
      const inactiveScopes = host.createM80RegistrationDescriptor().registryScopes.filter((scope) => scope.scopeId.startsWith("restarbeiten."));
      assert.equal(inactiveScopes.length >= 3, true);
      inactiveScopes.slice(0, 3).forEach((scope) => {
        assert.equal(scope.status, "blocked", scope.scopeId);
        assert.deepEqual(scope.expectedElementIds, [], scope.scopeId);
        assert.deepEqual(scope.elements, [], scope.scopeId);
      });
    });
    await run("M82.6 BBM 40b: produktive Protokoll-Registrierung besteht den Electron-Preflight", () => {
      const descriptor = host.createM80RegistrationDescriptor();
      const contract = uiEditorKit.createElectronTargetContract({
        applicationId: descriptor.applicationId,
        displayName: descriptor.displayName,
        appVersion: "1.5.0-test",
        registryVersion: descriptor.registryVersion,
        registryFingerprint: uiEditorKit.createRegistryFingerprint(descriptor.registryScopes),
        registryStatus: descriptor.registryStatus,
        activeScopes: descriptor.activeScopes,
        profileRoot: "C:\\temp\\bbm-m826-test",
        supportedOperations: descriptor.supportedOperations,
        transportProtocolVersion: uiEditorKit.LOCAL_TARGET_PROTOCOL_VERSION,
        sessionId: "m826-test",
        processId: process.pid,
        pdfCapability: "unavailable",
        pdfContract: null,
      });
      const validation = uiEditorKit.validateRegistrationSnapshot({ contract, registryScopes: descriptor.registryScopes });
      assert.equal(validation.ok, true, JSON.stringify(validation.errors));
    });
    await run("M82.6 BBM 40c: Zielmanifest akzeptiert den deklarierten aktiven Modul-Satz", () => {
      const descriptor = host.createM80RegistrationDescriptor();
      const profileRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-m826-module-manifest-"));
      try {
        const { ElectronUiEditorSessionController } = require("../../src/main/ui-editor/electronUiEditorSession.js");
        const controller = new ElectronUiEditorSessionController({
          app: { getAppPath: () => ROOT, getVersion: () => "1.5.0", getPath: () => profileRoot },
          ipcMain: { handle() {} }, getMainWindow: () => null, profileRootResolver: () => profileRoot,
        });
        const loaded = controller.loadStartupLayout(descriptor);
        assert.equal(loaded.code === "registry_incompatible", false, loaded.message);
      } finally {
        fs.rmSync(profileRoot, { recursive: true, force: true });
      }
    });
    await run("M82.6 BBM 41: Mehrfach-Ref selektiert dieselbe logische Spalte ohne Wrapper", () => assert.deepEqual(refs.getM80IdsFromTarget(secondaryColumnCell), ["protokoll.list.column.text"]));
    const labelBefore = refs.snapshotM80State("protokoll.edit.short.label");
    await run("M82.6 BBM 42: Protokoll-Bezeichnung erlaubt direkte Schriftgroesse", () => { const result = host.handleM80EditorRequest({ action: "submitChange", scopeId: "protokoll.edit.root", changeRequest: { changeId: "protocol-font", elementId: "protokoll.edit.short.label", operation: "textResize", payload: { text: { fontSize: 13 } }, source: "target-app-start" } }).changeResult; assert.equal(result.success, true); assert.equal(result.newState.fontSize, 13); });
    await run("M82.6 BBM 43: Undo stellt den vorherigen Labelzustand wieder her", () => { refs.applyM80State("protokoll.edit.short.label", labelBefore); assert.equal(refs.snapshotM80State("protokoll.edit.short.label").fontSize, labelBefore.fontSize); });
    await run("M82.6 BBM 44: Protokoll-Feld erlaubt direkte Breite", () => { const result = host.handleM80EditorRequest({ action: "submitChange", scopeId: "protokoll.edit.root", changeRequest: { changeId: "protocol-width", elementId: "protokoll.edit.short.field", operation: "resizeWidth", payload: { width: 300 }, source: "target-app-start" } }).changeResult; assert.equal(result.success, true); assert.equal(result.newState.width, 300); });
    await run("M82.6 BBM 45: vorhandene Gruppe erlaubt direkte Position", () => { const result = host.handleM80EditorRequest({ action: "submitChange", scopeId: "protokoll.edit.root", changeRequest: { changeId: "protocol-move", elementId: "protokoll.edit.short", operation: "move", payload: { x: 5, y: 1 }, source: "target-app-start" } }).changeResult; assert.equal(result.success, true); assert.equal(result.newState.x, 5); assert.equal(result.newState.y, 1); });
    await run("M82.6 BBM 46: Protokoll-Registryrefresh bleibt topologieneutral", () => { refs.completeM80PilotRender(); assert.equal(refs.compareM80Topology(protocolBaseline).ok, true); });
    await run("M82.6 BBM 47: Protokoll-Editieren und Undo veraendern keine Topologie", () => assert.equal(refs.compareM80Topology(protocolBaseline).ok, true));
    await run("M82.6 BBM 48: Startprofil erzeugt deterministische Restore-Operationen", () => { const requests = host.createM80StartupRequests("protokoll.edit.root", { ...refs.snapshotM80State("protokoll.edit.short.field"), elementId: "protokoll.edit.short.field", width: 320 }); assert.equal(requests.some((item) => item.request.operation === "resizeWidth"), true); });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    global.document = previous.document; global.window = previous.window; global.Element = previous.Element;
  }
}

module.exports = { runM826TopScreenModuleClosureTests };
