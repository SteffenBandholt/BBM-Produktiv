"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");
const IDS = ["restarbeiten.edit.short.remaining", "restarbeiten.edit.long.remaining"];

class FakeElement {
  constructor(tagName = "DIV", width = 100, height = 24) {
    this.tagName = tagName;
    this.attributes = {};
    this.dataset = {};
    this.className = "";
    this.parentElement = null;
    this.children = [];
    this.isConnected = true;
    this.textContent = "";
    this._rect = { left: 0, top: 0, width, height };
    this.style = {
      setProperty(name, value) { this[name] = value; },
      getPropertyValue(name) { return this[name] || ""; },
    };
    this.classList = {
      contains: (name) => this.className.split(/\s+/).includes(name),
      toggle: (name, active) => {
        const names = new Set(this.className.split(/\s+/).filter(Boolean));
        if (active) names.add(name); else names.delete(name);
        this.className = [...names].join(" ");
      },
    };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); if (name === "data-ui-editor-id") this.dataset.uiEditorId = String(value); }
  getAttribute(name) { return this.attributes[name] || null; }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  getBoundingClientRect() { return { ...this._rect }; }
}

async function runM827RemainingIndicatorTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
  const editScope = registry.listM80RegistryScopes().find((scope) => scope.scopeId === "restarbeiten.edit.root");
  const byId = new Map(editScope.elements.map((entry) => [entry.id, entry]));
  const editboxSource = read("src/renderer/modules/restarbeiten/RestarbeitenEditbox.js");
  const css = read("src/renderer/modules/restarbeiten/styles/restarbeiten.css");

  await run("M82.7 BBM 01: Kurztext-Restzeichenanzeige erlaubt move, textResize und setVisibility", () => assert.deepEqual(byId.get(IDS[0]).allowedOps, ["move", "textResize", "setVisibility"]));
  await run("M82.7 BBM 02: Langtext-Restzeichenanzeige erlaubt move, textResize und setVisibility", () => assert.deepEqual(byId.get(IDS[1]).allowedOps, ["move", "textResize", "setVisibility"]));
  await run("M82.7 BBM 03: Breite und Hoehe bleiben fuer beide Anzeigen gesperrt", () => IDS.forEach((id) => { assert.equal(byId.get(id).allowedOps.includes("resizeWidth"), false); assert.equal(byId.get(id).allowedOps.includes("resizeHeight"), false); }));
  await run("M82.7 BBM 04: produktive CSS-Schriftgroesse ist als Pixelbaseline abgebildet", () => IDS.forEach((id) => assert.equal(byId.get(id).baseline.fontSize, 8.667)));
  await run("M82.7 BBM 05: Schriftgrenzen passen in die vorhandene 30-px-Kopfspalte", () => IDS.forEach((id) => assert.deepEqual([byId.get(id).baseline.minFontSize, byId.get(id).baseline.maxFontSize], [6, 10])));
  await run("M82.7 BBM 06: Verschiebung bleibt innerhalb der vorhandenen Kopfzeile begrenzt", () => IDS.forEach((id) => assert.deepEqual(byId.get(id).geometry, { maximumOffset: 12, maximumStoredOffset: 12 })));
  await run("M82.7 BBM 07: Parent-Zuordnungen bleiben unveraendert", () => { assert.equal(byId.get(IDS[0]).parentId, "restarbeiten.edit.short.headerZone"); assert.equal(byId.get(IDS[1]).parentId, "restarbeiten.edit.long.headerZone"); });
  await run("M82.7 BBM 08: vorhandene Spans werden ohne neuen DOM-Knoten registriert", () => { assert.match(editboxSource, /registerM80Ref\(`\$\{editorGroupId\}\.remaining`, remaining\)/); assert.doesNotMatch(editboxSource.slice(editboxSource.indexOf("registerM80Ref(`${editorGroupId}.remaining`")), /createElement/); });
  await run("M82.7 BBM 09: Zeichenlimits bleiben 87 und 400", () => { assert.match(editboxSource, /maxLength:\s*87/); assert.match(editboxSource, /maxLength:\s*400/); });
  await run("M82.7 BBM 10: Zaehlwert bleibt aus Zeichenlimit minus Textlaenge berechnet", () => assert.match(editboxSource, /const left = Math\.max\(0, maxLength - String\(input\.value \|\| ""\)\.length\);\s*remaining\.textContent = String\(left\);/));
  await run("M82.7 BBM 11: produktives CSS behaelt 6.5pt und die vorhandene Pillenbreite", () => { assert.match(css, /\.bbm-restarbeiten-remaining\s*\{[\s\S]*?min-width:\s*18px;[\s\S]*?font-size:\s*6\.5pt;/); assert.match(css, /grid-template-columns:\s*190px 30px 24px/); });

  const previous = { document: global.document, window: global.window, Element: global.Element };
  global.Element = FakeElement;
  global.document = { querySelector: () => null, createElement: () => new FakeElement(), addEventListener() {}, removeEventListener() {} };
  global.window = {
    getComputedStyle: (element) => ({
      ...element.style,
      width: `${element._rect.width}px`, height: `${element._rect.height}px`,
      paddingLeft: element.style.paddingLeft || "0px", paddingTop: element.style.paddingTop || "0px",
      fontSize: element.style.fontSize || (IDS.includes(element.dataset.uiEditorId) ? "8.667px" : "12px"),
    }),
    dispatchEvent() {},
  };
  refs.resetM80PilotWorkingStatesForDiagnostic();
  refs.beginM80PilotRender();
  const nodes = new Map();
  for (const entry of editScope.elements) {
    const tag = entry.type === "label" ? "SPAN" : entry.type === "field" ? "INPUT" : entry.type === "button" ? "BUTTON" : "DIV";
    const node = new FakeElement(tag, IDS.includes(entry.id) ? 28 : 120, IDS.includes(entry.id) ? 14 : 24);
    if (IDS.includes(entry.id)) node.style.fontSize = "8.667px";
    if (entry.id === IDS[0]) node.textContent = "87";
    if (entry.id === IDS[1]) node.textContent = "400";
    nodes.set(entry.id, node);
    if (entry.parentId) nodes.get(entry.parentId).appendChild(node);
    refs.registerM80Ref(entry.id, node);
  }
  refs.completeM80PilotRender();

  try {
    const topology = refs.snapshotM80Topology();
    const nodeCount = topology.nodes.length;
    const shortNode = nodes.get(IDS[0]);
    const longNode = nodes.get(IDS[1]);
    const shortBefore = refs.snapshotM80State(IDS[0]);
    const dictationBefore = refs.snapshotM80State("restarbeiten.edit.short.dictation");
    const classBefore = refs.snapshotM80State("restarbeiten.edit.class");

    await run("M82.7 BBM 12: reale Refs liefern die produktive Schriftbaseline", () => { assert.equal(shortBefore.fontSize, 8.667); assert.equal(refs.snapshotM80State(IDS[1]).fontSize, 8.667); });
    await run("M82.7 BBM 13: textResize wirkt direkt auf das vorhandene Kurztext-Element", () => { const result = host.handleM80EditorRequest({ action: "submitChange", scopeId: "restarbeiten.edit.root", changeRequest: { changeId: "m827-short-font", elementId: IDS[0], operation: "textResize", payload: { text: { fontSize: 7.667 } }, source: "m82-7-test" } }).changeResult; assert.equal(result.success, true, result.message); assert.equal(shortNode.style.fontSize, "7.667px"); });
    await run("M82.7 BBM 14: move wirkt nur als Transformoffset am Kurztext-Element", () => { const result = host.handleM80EditorRequest({ action: "submitChange", scopeId: "restarbeiten.edit.root", changeRequest: { changeId: "m827-short-move", elementId: IDS[0], operation: "move", payload: { x: -5, y: -1 }, source: "m82-7-test" } }).changeResult; assert.equal(result.success, true, result.message); assert.equal(shortNode.style.translate, "-5px -1px"); });
    await run("M82.7 BBM 15: Sichtbarkeit aus und an wirkt auf dasselbe Element", () => { for (const visible of [false, true]) { const result = host.handleM80EditorRequest({ action: "submitChange", scopeId: "restarbeiten.edit.root", changeRequest: { changeId: `m827-visible-${visible}`, elementId: IDS[0], operation: "setVisibility", payload: { visible }, source: "m82-7-test" } }).changeResult; assert.equal(result.success, true, result.message); assert.equal(refs.snapshotM80State(IDS[0]).visible, visible); } });
    await run("M82.7 BBM 16: Fachtext und Zaehlwert bleiben bei Layoutaenderungen unveraendert", () => { assert.equal(shortNode.textContent, "87"); assert.equal(longNode.textContent, "400"); });
    await run("M82.7 BBM 17: Diktatbutton und Klassensteuerung bleiben geometrisch unveraendert", () => { assert.deepEqual(refs.snapshotM80State("restarbeiten.edit.short.dictation"), dictationBefore); assert.deepEqual(refs.snapshotM80State("restarbeiten.edit.class"), classBefore); });
    await run("M82.7 BBM 18: Undo kann den exakten vorherigen Zustand ueber denselben Apply-Weg herstellen", () => { refs.applyM80State(IDS[0], shortBefore); assert.equal(refs.snapshotM80State(IDS[0]).fontSize, shortBefore.fontSize); assert.equal(refs.snapshotM80State(IDS[0]).x, shortBefore.x); assert.equal(refs.snapshotM80State(IDS[0]).y, shortBefore.y); });
    await run("M82.7 BBM 19: Langtextanzeige nutzt denselben wirksamen HostAdapter-Weg", () => { const result = host.handleM80EditorRequest({ action: "submitChange", scopeId: "restarbeiten.edit.root", changeRequest: { changeId: "m827-long", elementId: IDS[1], operation: "move", payload: { x: -5, y: -1 }, source: "m82-7-test" } }).changeResult; assert.equal(result.success, true, result.message); assert.equal(longNode.style.translate, "-5px -1px"); });
    await run("M82.7 BBM 20: Save-Restore erzeugt nur freigegebene deterministische Requests", () => { const saved = { ...refs.snapshotM80State(IDS[1]), elementId: IDS[1], x: -5, y: -1, fontSize: 7.667, visible: false }; refs.applyM80State(IDS[1], { ...saved, ...byId.get(IDS[1]).baseline }); const requests = host.createM80StartupRequests("restarbeiten.edit.root", saved).map((item) => item.request.operation); assert.deepEqual(requests, ["move", "textResize", "setVisibility"]); });
    await run("M82.7 BBM 21: Reset stellt die deklarierte App-Baseline wieder her", () => { refs.applyM80State(IDS[1], { ...refs.snapshotM80State(IDS[1]), ...byId.get(IDS[1]).baseline }); const reset = refs.snapshotM80State(IDS[1]); assert.equal(reset.x, 0); assert.equal(reset.y, 0); assert.equal(reset.fontSize, 8.667); assert.equal(reset.visible, true); });
    await run("M82.7 BBM 22: alle Layoutschritte behalten den Topologie-Fingerprint", () => assert.equal(refs.compareM80Topology(topology).current.fingerprint, topology.fingerprint));
    await run("M82.7 BBM 23: Registryrefresh erzeugt keine Knoten", () => { refs.completeM80PilotRender(); assert.equal(refs.snapshotM80Topology().nodes.length, nodeCount); assert.equal(refs.compareM80Topology(topology).ok, true); });
    await run("M82.7 BBM 24: Nachbarelemente erhalten weder Transform noch Schriftstil", () => { assert.equal(nodes.get("restarbeiten.edit.short.dictation").style.translate || "", ""); assert.equal(nodes.get("restarbeiten.edit.class").style.fontSize || "", ""); });
    await run("M82.7 BBM 25: keine Scroll- oder Fachoperation wurde freigegeben", () => IDS.forEach((id) => byId.get(id).allowedOps.forEach((operation) => assert.equal(["move", "textResize", "setVisibility"].includes(operation), true))));
    await run("M82.7 BBM 26: Schriftgroessen ausserhalb der CSS-Grenzen werden sicher abgewiesen", () => { const result = host.handleM80EditorRequest({ action: "submitChange", scopeId: "restarbeiten.edit.root", changeRequest: { changeId: "m827-font-limit", elementId: IDS[0], operation: "textResize", payload: { text: { fontSize: 11 } }, source: "m82-7-test" } }).changeResult; assert.equal(result.success, false); assert.equal(result.rollbackSucceeded, true); });
    await run("M82.7 BBM 27: Offset ausserhalb der Kopfzeilengrenze wird sicher abgewiesen", () => { const result = host.handleM80EditorRequest({ action: "submitChange", scopeId: "restarbeiten.edit.root", changeRequest: { changeId: "m827-move-limit", elementId: IDS[0], operation: "move", payload: { x: -13 }, source: "m82-7-test" } }).changeResult; assert.equal(result.success, false); assert.equal(result.rollbackSucceeded, true); });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    global.document = previous.document;
    global.window = previous.window;
    global.Element = previous.Element;
  }
}

module.exports = { runM827RemainingIndicatorTests };
