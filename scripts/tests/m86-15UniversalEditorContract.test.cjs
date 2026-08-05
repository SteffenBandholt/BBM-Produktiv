"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const UNIVERSAL_OPS = Object.freeze(["move", "resizeWidth", "resizeHeight", "setVisibility"]);
const TEXT_TYPES = new Set(["button", "field", "label", "tableDataCell", "tableHeaderCell"]);

class FakeElement {
  constructor(tagName = "DIV", { width = 100, height = 24, stylesheetMinHeight = 0 } = {}) {
    this.tagName = String(tagName).toUpperCase();
    this.nodeName = this.tagName;
    this.attributes = {};
    this.dataset = {};
    this.className = "";
    this.children = [];
    this.parentElement = null;
    this.isConnected = true;
    this._width = width;
    this._height = height;
    this._stylesheetMinHeight = stylesheetMinHeight;
    this.style = {
      setProperty(name, value) { this[name] = String(value); },
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

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase())] = String(value);
  }

  getAttribute(name) { return this.attributes[name] ?? null; }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  append(...children) { children.forEach((child) => this.appendChild(child)); }

  getBoundingClientRect() {
    const width = Number.parseFloat(this.style.width) || this._width;
    const requestedHeight = Number.parseFloat(this.style.height) || this._height;
    const inlineMinimum = Number.parseFloat(this.style.minHeight);
    const minimumHeight = Number.isFinite(inlineMinimum) ? inlineMinimum : this._stylesheetMinHeight;
    const height = Math.max(requestedHeight, minimumHeight);
    return { left: 10, top: 20, width, height, right: 10 + width, bottom: 20 + height };
  }
}

function computedStyle(element) {
  const rect = element.getBoundingClientRect();
  return {
    ...element.style,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    minHeight: element.style.minHeight || `${element._stylesheetMinHeight}px`,
    paddingLeft: element.style.paddingLeft || "0px",
    paddingTop: element.style.paddingTop || "0px",
    fontSize: element.style.fontSize || "12px",
    boxSizing: "border-box",
  };
}

function textElement(entry) {
  return TEXT_TYPES.has(entry.type) || entry.hasVisibleText === true;
}

function nextWithinBounds(entry, field, increment) {
  const minimum = Number(entry.baseline?.[`min${field[0].toUpperCase()}${field.slice(1)}`]) || 1;
  const maximum = Number(entry.baseline?.[`max${field[0].toUpperCase()}${field.slice(1)}`]) || minimum + increment;
  return Math.min(maximum, minimum + increment);
}

async function runM8615UniversalEditorContractTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const contractModule = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m83ComponentContract.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const components = registry.listM83ComponentContracts();
  const scopes = registry.listM80RegistryScopes().filter((scope) => scope.status === "complete");
  const entries = scopes.flatMap((scope) => scope.elements);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  await run("M86.15 01: zentrale Aufloesung erzwingt den Universalvertrag und explizite Textklassifikation", () => {
    const plain = contractModule.m83Element({ id: "test.root", name: "Test", type: "group", role: "layout", parentId: null, order: 0, allowedOps: [] });
    const button = contractModule.m83DomainButton({ id: "test.button", name: "Testbutton", parentId: "test.root", order: 1, allowedOps: [] });
    UNIVERSAL_OPS.forEach((operation) => assert.ok(plain.allowedOps.includes(operation), operation));
    UNIVERSAL_OPS.forEach((operation) => assert.ok(button.allowedOps.includes(operation), operation));
    assert.equal(plain.hasVisibleText, false);
    assert.equal(button.hasVisibleText, true);
    assert.ok(button.allowedOps.includes("textResize"));
  });

  await run("M86.15 02: alle produktiven Komponentenvertraege werden vollstaendig durchlaufen", () => {
    const componentIds = new Set(components.map((component) => component.componentId));
    for (const componentId of [
      "bbm.restarbeiten.filterbar", "bbm.restarbeiten.quicklane", "bbm.restarbeiten.list", "bbm.restarbeiten.editbox",
      "bbm.restarbeiten.mainHeaderLauncher", "bbm.protokoll.mainHeaderLauncher",
      "bbm.protokoll.screen", "bbm.protokoll.quicklane", "bbm.protokoll.list.shell", "bbm.protokoll.list.columns", "bbm.protokoll.editbox",
    ]) assert.ok(componentIds.has(componentId), componentId);
    assert.ok(entries.length >= 212);
    assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
    assert.deepEqual(
      [...components.flatMap((component) => component.slots.map((slot) => slot.element.id))].sort(),
      [...entries.map((entry) => entry.id)].sort(),
    );
    for (const component of components) {
      for (const slot of component.slots) {
        UNIVERSAL_OPS.forEach((operation) => assert.equal(slot.requirements[operation], true, `${component.componentId}/${slot.slotId}: ${operation}`));
        if (slot.element.hasVisibleText) assert.equal(slot.requirements.textResize, true, `${component.componentId}/${slot.slotId}: textResize`);
      }
    }
    for (const entry of entries) {
      assert.equal(entry.visible, true, `${entry.id}: visible`);
      assert.equal(entry.editable, true, `${entry.id}: editable`);
      assert.equal(typeof entry.hasVisibleText, "boolean", `${entry.id}: hasVisibleText`);
      UNIVERSAL_OPS.forEach((operation) => assert.ok(entry.allowedOps.includes(operation), `${entry.id}: ${operation}`));
      if (textElement(entry)) assert.ok(entry.allowedOps.includes("textResize"), `${entry.id}: textResize`);
      for (const operation of [...UNIVERSAL_OPS, ...(textElement(entry) ? ["textResize"] : [])]) {
        assert.equal(entry.lockedOps.includes(operation), false, `${entry.id}: locked ${operation}`);
        assert.notEqual(entry.operationEffects?.[operation], undefined, `${entry.id}: effect ${operation}`);
      }
      if (entry.parentId) assert.ok(byId.has(entry.parentId), `${entry.id}: parent ${entry.parentId}`);
      assert.ok(entry.refKey, `${entry.id}: direct refKey`);
      assert.ok(Number(entry.baseline?.minWidth) > 0 && Number(entry.baseline?.maxWidth) >= Number(entry.baseline?.minWidth), `${entry.id}: width bounds`);
      assert.ok(Number(entry.baseline?.minHeight) > 0 && Number(entry.baseline?.maxHeight) >= Number(entry.baseline?.minHeight), `${entry.id}: height bounds`);
    }
    for (const id of [
      "restarbeiten.quicklane", "restarbeiten.quicklane.group.navigation", "restarbeiten.quicklane.pin",
      "restarbeiten.quicklane.action.project", "restarbeiten.quicklane.action.firms",
      "restarbeiten.quicklane.group.visibility", "restarbeiten.quicklane.action.ampel", "restarbeiten.quicklane.action.longtext",
      "restarbeiten.quicklane.group.output", "restarbeiten.quicklane.action.pdfPreview",
      "restarbeiten.quicklane.output.print", "restarbeiten.quicklane.output.email",
    ]) assert.ok(byId.has(id), id);
    for (const id of ["restarbeiten.header.action.openUiEditor", "protokoll.header.action.openUiEditor"]) {
      const launcher = byId.get(id);
      assert.ok(launcher, id);
      [...UNIVERSAL_OPS, "textResize"].forEach((operation) => assert.ok(launcher.allowedOps.includes(operation), `${id}: ${operation}`));
    }
    assert.equal(byId.get("protokoll.edit.dictation.status")?.hasVisibleText, true);
    assert.ok(byId.get("protokoll.edit.dictation.status")?.allowedOps.includes("textResize"));
    assert.equal(byId.get("protokoll.list.row.marker")?.hasVisibleText, true);
    assert.ok(byId.get("protokoll.list.row.marker")?.allowedOps.includes("textResize"));
  });

  await run("M86.15 03: jeder Button besitzt Geometrie, Sichtbarkeit und Textgroesse; Fachaktionen bleiben gesperrt", () => {
    const buttons = entries.filter((entry) => entry.type === "button");
    assert.ok(buttons.length >= 30);
    for (const button of buttons) {
      [...UNIVERSAL_OPS, "textResize"].forEach((operation) => assert.ok(button.allowedOps.includes(operation), `${button.id}: ${operation}`));
      if (button.role === "domainActionLayout") {
        for (const lock of ["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"]) assert.ok(button.lockedOps.includes(lock), `${button.id}: ${lock}`);
      }
    }
  });

  await run("M86.15 04: Ampel, ToDo, Beschluss und weitere Symbole sind verschiebbar und skalierbar", () => {
    const symbols = entries.filter((entry) => ["componentPart", "statusIndicator"].includes(entry.type));
    assert.ok(symbols.length >= 7);
    for (const symbol of symbols) UNIVERSAL_OPS.forEach((operation) => assert.ok(symbol.allowedOps.includes(operation), `${symbol.id}: ${operation}`));
    for (const id of ["restarbeiten.edit.meta.ampel", "restarbeiten.record.ampel", "protokoll.edit.ampel", "protokoll.list.row.ampel", "protokoll.list.row.todo", "protokoll.list.row.decision"]) assert.ok(byId.get(id)?.allowedOps.includes("move"), id);
  });

  const previous = { document: global.document, window: global.window, Element: global.Element, CustomEvent: global.CustomEvent };
  global.Element = FakeElement;
  global.CustomEvent = class { constructor(type) { this.type = type; } };
  global.document = { body: new FakeElement("BODY", { width: 1600, height: 900 }), querySelector: () => null };
  global.window = { getComputedStyle: computedStyle, dispatchEvent() {} };
  try {
    await run("M86.15 05: jeder Vertrags-Ref kann alle Grundwerte anwenden und Multi-Refs behalten sie beim Rerender", () => {
      refs.resetM80PilotWorkingStatesForDiagnostic();
      refs.beginM80PilotRender();
      const firstTargets = new Map();
      for (const entry of entries) {
        const options = entry.componentKind === "textarea" ? { height: 72, stylesheetMinHeight: 64 } : {};
        const targets = entry.referenceKind === "multi"
          ? [new FakeElement(entry.type, options), new FakeElement(entry.type, options)]
          : [new FakeElement(entry.type, options)];
        firstTargets.set(entry.id, targets);
        if (entry.referenceKind === "multi") refs.registerM80MultiRef(entry.id, targets, new FakeElement("DIV"), { mountedInstanceCount: targets.length });
        else refs.registerM80Ref(entry.id, targets[0]);
      }
      refs.completeM80PilotRender();

      for (const entry of entries) {
        let state = refs.snapshotM80State(entry.id);
        state = refs.applyM80State(entry.id, { ...state, x: 5, y: 6 }, "move");
        state = refs.applyM80State(entry.id, { ...state, width: nextWithinBounds(entry, "width", 5) }, "resizeWidth");
        state = refs.applyM80State(entry.id, { ...state, height: nextWithinBounds(entry, "height", 5) }, "resizeHeight");
        if (entry.hasVisibleText) {
          const minFontSize = Number(entry.baseline?.minFontSize) || 6;
          const maxFontSize = Number(entry.baseline?.maxFontSize) || 64;
          state = refs.applyM80State(entry.id, { ...state, fontSize: Math.min(maxFontSize, minFontSize + 1) }, "textResize");
        }
        refs.applyM80State(entry.id, { ...state, visible: true }, "setVisibility");
      }

      refs.beginM80PilotRender();
      const rerenderedTargets = new Map();
      for (const entry of entries) {
        const targets = entry.referenceKind === "multi" ? [new FakeElement(entry.type), new FakeElement(entry.type), new FakeElement(entry.type)] : [new FakeElement(entry.type)];
        rerenderedTargets.set(entry.id, targets);
        if (entry.referenceKind === "multi") refs.registerM80MultiRef(entry.id, targets, new FakeElement("DIV"), { mountedInstanceCount: targets.length });
        else refs.registerM80Ref(entry.id, targets[0]);
      }
      refs.completeM80PilotRender();

      for (const entry of entries) {
        const state = refs.snapshotM80State(entry.id);
        assert.equal(state.x, 5, `${entry.id}: x after rerender`);
        assert.equal(state.y, 6, `${entry.id}: y after rerender`);
        rerenderedTargets.get(entry.id).forEach((target) => {
          assert.equal(target.style.translate, "5px 6px", `${entry.id}: target move`);
          assert.ok(Number.parseFloat(target.style.width) > 0, `${entry.id}: target width`);
          assert.ok(Number.parseFloat(target.style.height) > 0, `${entry.id}: target height`);
          if (entry.hasVisibleText) assert.ok(Number.parseFloat(target.style.fontSize) > 0, `${entry.id}: target fontSize`);
        });
      }
    });

    await run("M86.15 06: beide Langtextfelder koennen trotz produktiver CSS-Mindesthoehe flacher und hoeher werden", () => {
      for (const id of ["restarbeiten.edit.long.field", "protokoll.edit.long.field"]) {
        refs.resetM80PilotWorkingStatesForDiagnostic(); refs.beginM80PilotRender();
        const textarea = new FakeElement("TEXTAREA", { width: 500, height: 72, stylesheetMinHeight: 64 });
        refs.registerM80Ref(id, textarea); refs.completeM80PilotRender();
        const initial = refs.snapshotM80State(id);
        const flat = refs.applyM80State(id, { ...initial, height: 28 }, "resizeHeight");
        assert.equal(flat.height, 28, `${id}: flatter`);
        const high = refs.applyM80State(id, { ...flat, height: 140 }, "resizeHeight");
        assert.equal(high.height, 140, `${id}: higher`);
        assert.ok(Number.parseFloat(textarea.style.minHeight) <= 28, `${id}: usable technical minimum`);
      }
    });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    global.document = previous.document; global.window = previous.window; global.Element = previous.Element; global.CustomEvent = previous.CustomEvent;
  }
}

module.exports = { runM8615UniversalEditorContractTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runM8615UniversalEditorContractTests(run).then(() => { if (failed) process.exitCode = 1; }).catch((error) => { process.exitCode = 1; console.error(error?.stack || error); });
}
