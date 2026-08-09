"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const TARGET_ID = "restarbeiten.edit.short.remaining";

class FakeElement {
  constructor(tagName = "SPAN", baseFontSize = 12) {
    this.tagName = tagName;
    this.attributes = {};
    this.dataset = {};
    this.className = "";
    this.parentElement = null;
    this.children = [];
    this.textContent = "";
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

async function runM8272GenericTextResizeTests(run) {
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const hostAdapter = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
  const previous = { document: global.document, window: global.window, Element: global.Element };
  const target = new FakeElement();
  const computedFontSize = "8.667px";
  global.Element = FakeElement;
  global.document = { querySelector: () => null, createElement: () => new FakeElement(), addEventListener() {}, removeEventListener() {} };
  global.window = {
    getComputedStyle: () => ({ width: "28px", height: "14px", paddingLeft: "0px", paddingTop: "0px", fontSize: computedFontSize }),
    dispatchEvent() {},
  };
  refs.resetM80PilotWorkingStatesForDiagnostic();
  refs.registerM80Ref(TARGET_ID, target);

  try {
    await run("M82.7.2 BBM: unveraenderter Computed Style darf keinen textResize-Erfolg melden", () => {
      const result = hostAdapter.handleM80EditorRequest({
        action: "submitChange",
        scopeId: "restarbeiten.edit.root",
        changeRequest: {
          changeId: "computed-style-blocked",
          elementId: TARGET_ID,
          operation: "textResize",
          payload: { text: { fontSize: 7.667 } },
          source: "m82-7-2-test",
        },
      }).changeResult;
      assert.equal(result.success, false);
      assert.equal(result.errorCode, "text_resize_readback_mismatch");
      assert.equal(result.rollbackSucceeded, true);
      assert.equal(result.previousState.fontSize, 8.667);
      assert.equal(result.newState.fontSize, 8.667);
    });

    await run("M82.7.2 BBM: erwarteter veralteter Istwert wird vor dem Apply abgewiesen", () => {
      const result = hostAdapter.handleM80EditorRequest({
        action: "submitChange", scopeId: "restarbeiten.edit.root",
        changeRequest: { changeId: "stale-value", elementId: TARGET_ID, operation: "textResize",
          payload: { text: { fontSize: 7.667, unit: "dip", expectedCurrentFontSize: 9 } }, source: "m82-7-2-test" },
      }).changeResult;
      assert.equal(result.success, false);
      assert.equal(result.errorCode, "text_resize_expected_value_conflict");
      assert.equal(target.style.fontSize, "8.667px");
    });

    refs.resetM80PilotWorkingStatesForDiagnostic();
    const scopes = registry.listM80RegistryScopes();
    const textEntries = scopes.flatMap((scope) => scope.elements)
      .filter((entry) => entry.allowedOps.includes("textResize"));
    const nodes = new Map();
    for (const entry of scopes.flatMap((scope) => scope.elements)) {
      const base = Number(entry.baseline?.fontSize) || 12;
      nodes.set(entry.id, new FakeElement(entry.type === "field" ? "INPUT" : "SPAN", base));
    }
    for (const entry of scopes.flatMap((scope) => scope.elements)) {
      if (entry.parentId) nodes.get(entry.parentId).appendChild(nodes.get(entry.id));
      refs.registerM80Ref(entry.id, nodes.get(entry.id));
    }
    global.window.getComputedStyle = (element) => ({
      width: `${element._rect.width}px`, height: `${element._rect.height}px`,
      paddingLeft: element.style.paddingLeft || "0px", paddingTop: element.style.paddingTop || "0px",
      fontSize: element._computedOverride || element.style.fontSize || `${element._baseFontSize}px`,
    });

    const topology = refs.snapshotM80Topology();
    const initialStates = new Map(textEntries.map((entry) => [entry.id, refs.snapshotM80State(entry.id)]));
    const values = new Map();
    const submit = (entry, fontSize, suffix, expectedCurrentFontSize = refs.snapshotM80State(entry.id).fontSize) =>
      hostAdapter.handleM80EditorRequest({
        action: "submitChange", scopeId: scopes.find((scope) => scope.elements.some((candidate) => candidate.id === entry.id)).scopeId,
        changeRequest: { changeId: `${suffix}-${entry.id}`, elementId: entry.id, operation: "textResize",
          payload: { text: { fontSize, unit: "dip", expectedCurrentFontSize } }, source: "m82-7-2-inventory" },
      }).changeResult;
    const changeValues = (entry) => {
      const current = initialStates.get(entry.id).fontSize;
      const declaredMinimum = Number(entry.baseline.minFontSize);
      const declaredMaximum = Number(entry.baseline.maxFontSize);
      const minimum = Number.isFinite(declaredMinimum) ? declaredMinimum : 1;
      const maximum = Number.isFinite(declaredMaximum) ? declaredMaximum : 512;
      const lower = Math.round(Math.max(minimum, current - Math.min(1, Math.max(0.1, current - minimum))) * 1000) / 1000;
      const higher = Math.round(Math.min(maximum, lower + Math.min(2, Math.max(0.1, maximum - lower))) * 1000) / 1000;
      const direct = Math.round((lower + Math.min(0.25, (higher - lower) / 2)) * 1000) / 1000;
      assert.ok(lower < current, `${entry.id}: kleinere Schriftgroesse fehlt innerhalb der Registrygrenzen`);
      assert.ok(higher > lower, `${entry.id}: groessere Schriftgroesse fehlt innerhalb der Registrygrenzen`);
      assert.notEqual(direct, higher, `${entry.id}: direkter Zwischenwert fehlt`);
      return { lower, higher, direct };
    };

    await run("M82.7.2/M83.0 BBM: Inventar umfasst alle 140 textResize-Ziele in sechs produktiven Scopes", () => {
      assert.equal(textEntries.length, 140);
      assert.deepEqual(Object.fromEntries(scopes.map((scope) => [scope.scopeId, scope.elements.filter((entry) => entry.allowedOps.includes("textResize")).length]).filter(([, count]) => count)), {
        "restarbeiten.header.root": 27,
        "restarbeiten.list.root": 21,
        "restarbeiten.edit.root": 31,
        "protokoll.screen.root": 19,
        "protokoll.list.root": 19,
        "protokoll.edit.root": 23,
      });
    });
    await run("M82.7.2 BBM: jedes Inventarziel besitzt sichtbaren Ref und lesbaren Computed-Style-Istwert", () => {
      for (const entry of textEntries) {
        assert.equal(refs.getM80ReferenceStatus(entry.id).referenceResolved, true, entry.id);
        assert.equal(nodes.get(entry.id).isConnected, true, entry.id);
        assert.ok(Number.isFinite(initialStates.get(entry.id).fontSize), entry.id);
      }
    });
    await run("M82.7.2/M82.7.5 BBM: kleiner, groesser und direkter DIP-Wert wirken generisch auf alle 139 realen Refs", () => {
      for (const entry of textEntries) {
        const candidates = changeValues(entry);
        const smaller = submit(entry, candidates.lower, "smaller");
        assert.equal(smaller.success, true, `${entry.id}: ${smaller.message}`);
        assert.equal(smaller.textResize.appliedFontSize, candidates.lower, entry.id);
        const larger = submit(entry, candidates.higher, "larger");
        assert.equal(larger.success, true, `${entry.id}: ${larger.message}`);
        const direct = submit(entry, candidates.direct, "direct");
        assert.equal(direct.success, true, `${entry.id}: ${direct.message}`);
        assert.equal(refs.snapshotM80State(entry.id).fontSize, candidates.direct, entry.id);
        values.set(entry.id, candidates);
      }
    });
    await run("M82.7.2 BBM: unveraenderter direkter Istwert bleibt fuer jedes Ziel ohne Erfolg", () => {
      for (const entry of textEntries) {
        const current = refs.snapshotM80State(entry.id).fontSize;
        const result = submit(entry, current, "no-effect", current);
        assert.equal(result.success, false, entry.id);
        assert.equal(result.errorCode, "text_resize_no_effect", entry.id);
        assert.equal(refs.snapshotM80State(entry.id).fontSize, current, entry.id);
      }
    });
    await run("M82.7.2 BBM: Kurz-/Lang-Restzeichen, Restarbeiten- und Protokolltexte nutzen denselben Weg", () => {
      const required = [
        "restarbeiten.edit.short.remaining", "restarbeiten.edit.long.remaining",
        "protokoll.edit.short.counter", "protokoll.edit.long.counter",
        "restarbeiten.edit.short.label", "restarbeiten.edit.long.label", "restarbeiten.edit.meta.status.label",
        "restarbeiten.edit.short.field", "restarbeiten.list.table.subject.header",
        "protokoll.edit.short.label", "protokoll.edit.long.label", "protokoll.edit.short.field",
      ];
      for (const id of required) {
        assert.ok(values.has(id), id);
        assert.equal(refs.snapshotM80State(id).fontSize, values.get(id).direct, id);
      }
    });
    await run("M82.7.2 BBM: Nachbarn, Fachtext, Topologie und Scrollstruktur bleiben unveraendert", () => {
      for (const entry of textEntries) assert.equal(nodes.get(entry.id).textContent, "", entry.id);
      assert.equal(refs.compareM80Topology(topology).ok, true);
      assert.equal(nodes.get("restarbeiten.list.area").style.overflow || "", "");
      assert.equal(nodes.get("protokoll.screen.root").style.overflow || "", "");
    });
    await run("M82.7.2 BBM: Undo und Elementreset stellen den exakten realen Ausgangswert wieder her", () => {
      for (const entry of textEntries) {
        refs.applyM80State(entry.id, initialStates.get(entry.id), "textResize");
        assert.equal(refs.snapshotM80State(entry.id).fontSize, initialStates.get(entry.id).fontSize, entry.id);
      }
    });
    await run("M82.7.2 BBM: Save-/Neustart-Restore erzeugt fuer jedes Ziel genau den freigegebenen textResize-Weg", () => {
      for (const entry of textEntries) {
        const saved = { ...initialStates.get(entry.id), fontSize: values.get(entry.id).direct, elementId: entry.id };
        const scopeId = scopes.find((scope) => scope.elements.some((candidate) => candidate.id === entry.id)).scopeId;
        const requests = hostAdapter.createM80StartupRequests(scopeId, saved).filter((item) => item.request.operation === "textResize");
        assert.equal(requests.length, 1, entry.id);
        const result = hostAdapter.handleM80EditorRequest({ action: "submitChange", scopeId, changeRequest: requests[0].request }).changeResult;
        assert.equal(result.success, true, `${entry.id}: ${result.message}`);
        assert.equal(result.newState.fontSize, values.get(entry.id).direct, entry.id);
      }
    });
    await run("M82.7.2 BBM: Registryrefresh und fachlicher Ref-Rerender bewahren den expliziten Wert ohne Doppelanwendung", () => {
      refs.completeM80PilotRender();
      for (const entry of textEntries) {
        refs.registerM80Ref(entry.id, nodes.get(entry.id));
        assert.equal(refs.snapshotM80State(entry.id).fontSize, values.get(entry.id).direct, entry.id);
      }
      assert.equal(refs.compareM80Topology(topology).ok, true);
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
  runM8272GenericTextResizeTests(async (name, action) => {
    try { await action(); console.log(`OK ${name}`); }
    catch (error) { failed = true; console.error(`FAIL ${name}`); throw error; }
  }).catch((error) => { failed = true; console.error(error); }).finally(() => { if (failed) process.exitCode = 1; });
}

module.exports = { runM8272GenericTextResizeTests };
