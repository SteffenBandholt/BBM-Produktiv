"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const SHORT = "restarbeiten.edit.short.remaining";
const LONG = "restarbeiten.edit.long.remaining";

class FakeElement {
  constructor(tagName = "SPAN", baseFontSize = 12) {
    this.tagName = tagName;
    this.attributes = {};
    this.dataset = {};
    this.className = "";
    this.parentElement = null;
    this.children = [];
    this.textContent = "Fachwert";
    this._baseFontSize = baseFontSize;
    this._rect = { left: 0, top: 0, width: 120, height: 24 };
    this.isConnected = true;
    this.style = {};
    this.classList = {
      contains: (name) => this.className.split(/\s+/).includes(name),
      toggle: (name, active) => {
        const names = new Set(this.className.split(/\s+/).filter(Boolean));
        if (active) names.add(name); else names.delete(name);
        this.className = [...names].join(" ");
      },
    };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] || null; }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  getBoundingClientRect() { return { ...this._rect }; }
}

async function runM8273TextResizeCurrentValueTests(run) {
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
  const previous = { document: global.document, window: global.window, Element: global.Element };
  const scopes = registry.listM80RegistryScopes();
  const entries = scopes.flatMap((scope) => scope.elements);
  const nodes = new Map(entries.map((entry) => [entry.id, new FakeElement(entry.type === "field" ? "INPUT" : "SPAN", Number(entry.baseline?.fontSize) || 12)]));
  global.Element = FakeElement;
  global.document = { querySelector: () => null, createElement: () => new FakeElement(), addEventListener() {}, removeEventListener() {} };
  global.window = {
    getComputedStyle: (element) => ({
      width: `${element._rect.width}px`, height: `${element._rect.height}px`,
      paddingLeft: element.style.paddingLeft || "0px", paddingTop: element.style.paddingTop || "0px",
      fontSize: element.style.fontSize || `${element._baseFontSize}px`,
    }),
    dispatchEvent() {},
  };
  refs.resetM80PilotWorkingStatesForDiagnostic();
  for (const entry of entries) {
    if (entry.parentId) nodes.get(entry.parentId)?.appendChild(nodes.get(entry.id));
    refs.registerM80Ref(entry.id, nodes.get(entry.id));
  }
  const scopeIdFor = (id) => scopes.find((scope) => scope.elements.some((entry) => entry.id === id)).scopeId;
  const currentFromPayload = (id) => host.handleM80EditorRequest({ action: "getLayoutState" }).scopeStates
    .find((scope) => scope.scopeId === scopeIdFor(id)).elements.find((entry) => entry.elementId === id);
  const resize = (id, fontSize, changeId) => host.handleM80EditorRequest({
    action: "submitChange", scopeId: scopeIdFor(id),
    changeRequest: { changeId, elementId: id, operation: "textResize",
      payload: { text: { fontSize, unit: "dip", expectedCurrentFontSize: currentFromPayload(id).fontSize } }, source: "m82-7-3-real-payload" },
  }).changeResult;

  try {
    await run("M82.7.3 BBM 01: npm start baut den aktuellen Manager vor start:raw", () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
      assert.equal(pkg.scripts.start, "npm run fix:electron-deps && npm run prepare:ui-editor && npm run start:raw");
    });
    await run("M82.7.3 BBM 02: bestehender Prepare-Weg publiziert aus dem lokalen UI-Editor-kit", () => {
      const source = fs.readFileSync(path.join(ROOT, "scripts/prepareUiEditorManager.cjs"), "utf8");
      assert.match(source, /UI-Editor-kit/);
      assert.match(source, /dotnet[\s\S]*publish/);
      assert.match(source, /ui-editor-manager/);
    });
    await run("M82.7.3 BBM 03: Restzeichen Kurztext liefert den realen Computed-Style-Istwert", () => assert.equal(currentFromPayload(SHORT).fontSize, 8.667));
    await run("M82.7.3 BBM 04: Restzeichen Langtext liefert den realen Computed-Style-Istwert", () => assert.equal(currentFromPayload(LONG).fontSize, 8.667));
    await run("M82.7.3 BBM 05: normale Bezeichnung nutzt denselben Istwert-Payload", () => {
      const state = currentFromPayload("restarbeiten.edit.short.label");
      assert.equal(state.fontSize, Number.parseFloat(global.window.getComputedStyle(nodes.get(state.elementId)).fontSize));
    });
    await run("M82.7.3 BBM 06: Feld nutzt denselben Istwert-Payload", () => {
      const state = currentFromPayload("restarbeiten.edit.short.field");
      assert.equal(state.fontSize, Number.parseFloat(global.window.getComputedStyle(nodes.get(state.elementId)).fontSize));
    });

    const baseline = currentFromPayload(SHORT);
    await run("M82.7.3 BBM 07: Kleiner veraendert reales Element und Ruecklesewert sichtbar", () => {
      const result = resize(SHORT, 7.667, "m8273-smaller");
      assert.equal(result.success, true, result.message);
      assert.equal(nodes.get(SHORT).style.fontSize, "7.667px");
      assert.equal(currentFromPayload(SHORT).fontSize, 7.667);
    });
    await run("M82.7.3 BBM 08: Groesser berechnet vom bestaetigten Istwert", () => {
      const result = resize(SHORT, 8.667, "m8273-larger");
      assert.equal(result.success, true, result.message);
      assert.equal(result.textResize.previousFontSize, 7.667);
      assert.equal(result.textResize.appliedFontSize, 8.667);
    });
    await run("M82.7.3 BBM 09: direkte Eingabe verwendet denselben Vertrag", () => {
      const result = resize(SHORT, 9.25, "m8273-direct");
      assert.equal(result.success, true, result.message);
      assert.equal(result.textResize.unit, "dip");
      assert.equal(currentFromPayload(SHORT).fontSize, 9.25);
    });
    await run("M82.7.3 BBM 10: Editor-Payload stimmt nach Apply mit getComputedStyle ueberein", () => {
      assert.equal(currentFromPayload(SHORT).fontSize, Number.parseFloat(global.window.getComputedStyle(nodes.get(SHORT)).fontSize));
    });
    await run("M82.7.3 BBM 11: Undo- und Reset-Readback stellen den realen Baselinewert bereit", () => {
      refs.applyM80State(SHORT, baseline, "textResize");
      assert.equal(currentFromPayload(SHORT).fontSize, 8.667);
    });
    await run("M82.7.3 BBM 12: Verschieben und Sichtbarkeit lassen den Schrift-Istwert unveraendert", () => {
      const before = currentFromPayload(SHORT).fontSize;
      const moved = host.handleM80EditorRequest({ action: "submitChange", scopeId: scopeIdFor(SHORT), changeRequest: { changeId: "m8273-move", elementId: SHORT, operation: "move", payload: { x: 4, y: -2 }, source: "m82-7-3-real-payload" } }).changeResult;
      assert.equal(moved.success, true, moved.message);
      const hidden = host.handleM80EditorRequest({ action: "submitChange", scopeId: scopeIdFor(SHORT), changeRequest: { changeId: "m8273-hide", elementId: SHORT, operation: "setVisibility", payload: { visible: false }, source: "m82-7-3-real-payload" } }).changeResult;
      assert.equal(hidden.success, true, hidden.message);
      assert.equal(currentFromPayload(SHORT).fontSize, before);
      assert.equal(currentFromPayload(SHORT).visible, false);
    });
    await run("M82.7.3 BBM 13: Fachwerte, Topologie und Scrollstruktur bleiben unveraendert", () => {
      assert.equal(nodes.get(SHORT).textContent, "Fachwert");
      const topology = refs.snapshotM80Topology();
      assert.equal(refs.compareM80Topology(topology).ok, true);
      assert.equal(nodes.get("restarbeiten.list.area").style.overflow || "", "");
    });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    global.document = previous.document;
    global.window = previous.window;
    global.Element = previous.Element;
  }
}

if (require.main === module) {
  let failed = false;
  runM8273TextResizeCurrentValueTests(async (name, action) => {
    try { await action(); console.log(`OK ${name}`); }
    catch (error) { failed = true; console.error(`FAIL ${name}`); throw error; }
  }).catch((error) => { failed = true; console.error(error); }).finally(() => { if (failed) process.exitCode = 1; });
}

module.exports = { runM8273TextResizeCurrentValueTests };
