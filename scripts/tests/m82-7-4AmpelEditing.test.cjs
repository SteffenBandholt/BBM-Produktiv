"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const AMPEL_ID = "restarbeiten.edit.meta.ampel";
const VALIDATION_ID = "restarbeiten.edit.validation";

class FakeElement {
  constructor(tagName = "DIV", rect = {}) {
    this.tagName = tagName;
    this.attributes = {};
    this.dataset = {};
    this.className = "";
    this.parentElement = null;
    this.children = [];
    this.hidden = false;
    this.isConnected = true;
    this._rect = { left: 0, top: 0, width: 96, height: 24, ...rect };
    this.style = { setProperty(name, value) { this[name] = value; }, getPropertyValue(name) { return this[name] || ""; } };
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
  append(...children) { children.forEach((child) => { child.parentElement = this; this.children.push(child); }); }
  appendChild(child) { this.append(child); return child; }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  getBoundingClientRect() {
    const width = Number.parseFloat(this.style.width) || this._rect.width;
    const height = Number.parseFloat(this.style.height) || this._rect.height;
    return { left: this._rect.left, top: this._rect.top, width, height, right: this._rect.left + width, bottom: this._rect.top + height };
  }
}

function createDocument() {
  const body = new FakeElement("BODY", { width: 1600, height: 900 });
  return {
    body,
    createElement: (tag) => new FakeElement(tag),
    querySelector: (selector) => selector === "[data-bbm-ui-editor-risk-preview]"
      ? body.children.find((node) => node.getAttribute?.("data-bbm-ui-editor-risk-preview") === "true") || null
      : null,
    addEventListener() {}, removeEventListener() {},
  };
}

function computedStyle(element) {
  const bounds = element.getBoundingClientRect();
  return { ...element.style, display: element.style.display || "", width: `${bounds.width}px`, height: `${bounds.height}px`, paddingLeft: "0px", paddingTop: "0px", fontSize: "12px", boxSizing: "border-box" };
}

function submit(host, operation, payload, changeId, source = "m82-7-4-test") {
  return host.handleM80EditorRequest({ action: "submitChange", scopeId: "restarbeiten.edit.root", changeRequest: { changeId, elementId: AMPEL_ID, operation, payload, source } }).changeResult;
}

async function runM8274AmpelEditingTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
  const scope = registry.listM80RegistryScopes().find((item) => item.scopeId === "restarbeiten.edit.root");
  const byId = new Map(scope.elements.map((entry) => [entry.id, entry]));
  const entry = byId.get(AMPEL_ID);
  const source = fs.readFileSync(path.join(ROOT, "src/renderer/modules/restarbeiten/RestarbeitenEditbox.js"), "utf8");
  const css = fs.readFileSync(path.join(ROOT, "src/renderer/modules/restarbeiten/styles/restarbeiten.css"), "utf8");

  await run("M82.7.4 BBM 01: Ampel erlaubt nur Breite, Hoehe und Sichtbarkeit", () => assert.deepEqual(entry.allowedOps, ["resizeWidth", "resizeHeight", "setVisibility"]));
  await run("M82.7.4 BBM 02: move bleibt gesperrt", () => assert.equal(entry.allowedOps.includes("move"), false));
  await run("M82.7.4 BBM 03: Baseline entspricht dem sichtbaren 12-mal-12-Symbol", () => assert.deepEqual([entry.baseline.width, entry.baseline.height], [12, 12]));
  await run("M82.7.4 BBM 04: Plus und Minus 5 liegen innerhalb der Grenzen", () => assert.deepEqual([entry.baseline.minWidth, entry.baseline.maxWidth, entry.baseline.minHeight, entry.baseline.maxHeight], [7, 48, 7, 48]));
  await run("M82.7.4 BBM 05: Rendercode registriert das vorhandene innere Symbol nach dem Append", () => assert.match(source, /ampelWrap\.appendChild\(ampel\);\s*registerM80Ref\("restarbeiten\.edit\.meta\.ampel", ampel\);/));
  await run("M82.7.4 BBM 06: aeusserer Container wird nicht als Ampel-Ref registriert", () => assert.doesNotMatch(source, /registerM80Ref\("restarbeiten\.edit\.meta\.ampel", ampelWrap\)/));
  await run("M82.7.4 BBM 07: sichtbares Symbol bleibt der vorhandene flexstabile DOM-Knoten", () => assert.match(css, /\.bbm-restarbeiten-ampel\s*\{[\s\S]*?flex:\s*0 0 auto;[\s\S]*?width:\s*12px;[\s\S]*?height:\s*12px;/));

  const previous = { document: global.document, window: global.window, Element: global.Element };
  global.Element = FakeElement;
  global.document = createDocument();
  global.window = { getComputedStyle: computedStyle, dispatchEvent() {} };
  refs.resetM80PilotWorkingStatesForDiagnostic();
  refs.beginM80PilotRender();

  const root = new FakeElement("DIV", { left: -50, top: -50, width: 400, height: 220 });
  const area = new FakeElement("DIV", { left: -40, top: -40, width: 360, height: 180 });
  const meta = new FakeElement("DIV", { left: -20, top: -20, width: 200, height: 100 });
  const outer = new FakeElement("SPAN", { left: 0, top: 0, width: 96, height: 12 });
  const symbol = new FakeElement("SPAN", { left: 0, top: 0, width: 12, height: 12 });
  const validation = new FakeElement("SPAN", { left: 14, top: 0, width: 96, height: 0 });
  const responsible = new FakeElement("SELECT", { left: 100, top: 30, width: 92, height: 20 });
  outer.className = "bbm-restarbeiten-ampel-field";
  symbol.className = "bbm-restarbeiten-ampel";
  validation.className = "bbm-restarbeiten-validation";
  root.append(area); area.append(meta); meta.append(outer, responsible, validation); outer.append(symbol);
  refs.registerM80Ref("restarbeiten.edit.root", root);
  refs.registerM80Ref("restarbeiten.edit.area", area);
  refs.registerM80Ref("restarbeiten.edit.meta", meta);
  refs.registerM80Ref(AMPEL_ID, symbol);
  refs.registerM80Ref("restarbeiten.edit.meta.responsible.field", responsible);
  refs.registerM80Ref(VALIDATION_ID, validation);
  refs.completeM80PilotRender();

  try {
    const baseline = refs.snapshotM80State(AMPEL_ID);
    const outerBefore = outer.getBoundingClientRect();
    const responsibleBefore = refs.snapshotM80State("restarbeiten.edit.meta.responsible.field");
    const topology = refs.snapshotM80Topology();
    await run("M82.7.4 BBM 08: Ref zeigt direkt auf das innere sichtbare Symbol", () => assert.strictEqual(refs.getM80Ref(AMPEL_ID).element, symbol));
    await run("M82.7.4 BBM 09: Ref wird genau einmal aufgeloest", () => assert.equal(refs.listM80Refs().filter((ref) => ref.id === AMPEL_ID).length, 1));
    await run("M82.7.4 BBM 10: refKey und referenceResolved werden korrekt gemeldet", () => assert.deepEqual(refs.getM80ReferenceStatus(AMPEL_ID), { refKey: entry.refKey, referenceResolved: true }));
    await run("M82.7.4 BBM 11: reale Ausgangsbounds sind 12 mal 12 px", () => assert.deepEqual([baseline.width, baseline.height], [12, 12]));
    await run("M82.7.4 BBM 12: Breite plus 5 wirkt auf das Symbol", () => { const result = submit(host, "resizeWidth", { width: 17 }, "width-plus"); assert.equal(result.success, true, result.message); assert.equal(symbol.getBoundingClientRect().width, 17); });
    await run("M82.7.4 BBM 13: Breite minus 5 wirkt innerhalb der Grenzen", () => { assert.equal(submit(host, "resizeWidth", { width: 12 }, "width-minus").success, true); assert.equal(symbol.getBoundingClientRect().width, 12); });
    await run("M82.7.4 BBM 14: Hoehe plus 5 wirkt auf das Symbol", () => { assert.equal(submit(host, "resizeHeight", { height: 17 }, "height-plus").success, true); assert.equal(symbol.getBoundingClientRect().height, 17); });
    await run("M82.7.4 BBM 15: Hoehe minus 5 wirkt innerhalb der Grenzen", () => { assert.equal(submit(host, "resizeHeight", { height: 12 }, "height-minus").success, true); assert.equal(symbol.getBoundingClientRect().height, 12); });
    await run("M82.7.4 BBM 16: Sichtbarkeit aus und an wirkt nur auf das Symbol", () => { assert.equal(submit(host, "setVisibility", { visible: false }, "hide").success, true); assert.equal(refs.snapshotM80State(AMPEL_ID).visible, false); assert.equal(outer.classList.contains("bbm-ui-editor-hidden"), false); assert.equal(submit(host, "setVisibility", { visible: true }, "show").success, true); });
    await run("M82.7.4 BBM 17: Undo stellt den exakten vorherigen Zustand wieder her", () => { submit(host, "resizeWidth", { width: 17 }, "undo-change"); refs.applyM80State(AMPEL_ID, baseline); assert.deepEqual([refs.snapshotM80State(AMPEL_ID).width, refs.snapshotM80State(AMPEL_ID).height], [12, 12]); });
    await run("M82.7.4 BBM 18: Reset stellt die reale Registrybaseline wieder her", () => { submit(host, "resizeHeight", { height: 17 }, "reset-change"); refs.applyM80State(AMPEL_ID, { ...refs.snapshotM80State(AMPEL_ID), ...entry.baseline }); assert.deepEqual([refs.snapshotM80State(AMPEL_ID).width, refs.snapshotM80State(AMPEL_ID).height, refs.snapshotM80State(AMPEL_ID).visible], [12, 12, true]); });
    await run("M82.7.4 BBM 19: Save-Restore erzeugt exakt drei freigegebene Requests", () => { const saved = { ...refs.snapshotM80State(AMPEL_ID), elementId: AMPEL_ID, width: 17, height: 17, visible: false }; const requests = host.createM80StartupRequests("restarbeiten.edit.root", saved); assert.deepEqual(requests.map((item) => item.request.operation), ["resizeWidth", "resizeHeight", "setVisibility"]); for (const item of requests) assert.equal(host.handleM80EditorRequest({ action: "submitChange", scopeId: item.scopeId, changeRequest: item.request }).changeResult.success, true); assert.deepEqual([refs.snapshotM80State(AMPEL_ID).width, refs.snapshotM80State(AMPEL_ID).height, refs.snapshotM80State(AMPEL_ID).visible], [17, 17, false]); });
    await run("M82.7.4 BBM 20: Registryrefresh loest genau den neuen inneren Ref auf und erhaelt den Zustand", () => { refs.beginM80PilotRender(); const newOuter = new FakeElement("SPAN", { width: 96, height: 12 }); const newSymbol = new FakeElement("SPAN", { width: 12, height: 12 }); newOuter.append(newSymbol); refs.registerM80Ref(AMPEL_ID, newSymbol); refs.completeM80PilotRender(); assert.strictEqual(refs.getM80Ref(AMPEL_ID).element, newSymbol); assert.deepEqual([refs.snapshotM80State(AMPEL_ID).width, refs.snapshotM80State(AMPEL_ID).height, refs.snapshotM80State(AMPEL_ID).visible], [17, 17, false]); refs.beginM80PilotRender(); refs.registerM80Ref("restarbeiten.edit.root", root); refs.registerM80Ref("restarbeiten.edit.area", area); refs.registerM80Ref("restarbeiten.edit.meta", meta); refs.registerM80Ref(AMPEL_ID, symbol); refs.registerM80Ref("restarbeiten.edit.meta.responsible.field", responsible); refs.registerM80Ref(VALIDATION_ID, validation); refs.completeM80PilotRender(); });
    await run("M82.7.4 BBM 21: aeusserer Container und Nachbarfeld bleiben unveraendert", () => { assert.deepEqual(outer.getBoundingClientRect(), outerBefore); assert.deepEqual(refs.snapshotM80State("restarbeiten.edit.meta.responsible.field"), responsibleBefore); });
    await run("M82.7.4 BBM 22: Topologie und Scrollstruktur bleiben unveraendert", () => { assert.equal(refs.compareM80Topology(topology).ok, true); assert.equal(root.style.overflow || "", ""); assert.equal(meta.style.overflow || "", ""); });
    await run("M82.7.4 BBM 23: Validierungsnachbar mit Hoehe 0 wird nicht an den Core uebergeben", () => { const geometry = refs.snapshotM80Geometry(); assert.equal(host.collectM80GeometryNeighbors(entry, geometry, geometry).some((item) => item.elementId === VALIDATION_ID), false); });
    await run("M82.7.4 BBM 24: 0-Hoehen-Nachbar blockiert gueltige interaktive Aenderung nicht", () => { refs.applyM80State(AMPEL_ID, { ...refs.snapshotM80State(AMPEL_ID), width: 12, height: 12, visible: true }); const result = submit(host, "resizeWidth", { width: 17 }, "zero-neighbor", "ui-editor-panel"); assert.equal(result.success, true, result.message); });
    await run("M82.7.4 BBM 25: sichtbarer positiver Nachbar wird wieder einbezogen", () => { refs.applyM80State(AMPEL_ID, { ...refs.snapshotM80State(AMPEL_ID), width: 12 }, "resizeWidth"); validation._rect.height = 12; const geometry = refs.snapshotM80Geometry(); assert.equal(host.collectM80GeometryNeighbors(entry, geometry, geometry).some((item) => item.elementId === VALIDATION_ID), true); });
    await run("M82.7.4 BBM 26: detached, display-none, NaN und Infinity sind inaktiv", () => { const candidate = byId.get(VALIDATION_ID); const before = refs.snapshotM80Geometry(); const after = refs.snapshotM80Geometry(); validation.isConnected = false; assert.equal(host.isM80GeometryNeighborActive(candidate, before, after), false); validation.isConnected = true; validation.style.display = "none"; assert.equal(host.isM80GeometryNeighborActive(candidate, before, after), false); validation.style.display = ""; before.set(VALIDATION_ID, { left: 0, top: 0, width: Number.NaN, height: 12 }); assert.equal(host.isM80GeometryNeighborActive(candidate, before, after), false); before.set(VALIDATION_ID, { left: 0, top: 0, width: Number.POSITIVE_INFINITY, height: 12 }); assert.equal(host.isM80GeometryNeighborActive(candidate, before, after), false); });
    await run("M82.7.4 BBM 27: echte sichtbare Kollision bleibt blockiert", () => { refs.applyM80State(AMPEL_ID, { ...refs.snapshotM80State(AMPEL_ID), width: 12 }, "resizeWidth"); const result = submit(host, "resizeWidth", { width: 17 }, "real-collision", "ui-editor-panel"); assert.equal(result.success, false); assert.equal(result.errorCode, "geometry_risk_confirmation_required"); assert.equal(result.geometryRisk.affectedNeighbors.some((item) => item.elementId === VALIDATION_ID && item.overlapBounds), true); assert.equal(refs.snapshotM80State(AMPEL_ID).width, 12); });
    await run("M82.7.4 BBM 28: licensing-Dokumentation hat weiterhin den Schutz-Hash", () => { const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, "docs/licensing.md"))).digest("hex").toUpperCase(); assert.equal(hash, "02AE66A8873C74869539F13F734B7CE43BC63B6EF37DA553A40C27A4F514D784"); });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    global.document = previous.document; global.window = previous.window; global.Element = previous.Element;
  }
}

module.exports = { runM8274AmpelEditingTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM8274AmpelEditingTests(run).then(() => { if (failed) process.exitCode = 1; }).catch((error) => { process.exitCode = 1; console.error(error?.stack || error); });
}
