"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const META_IDS = Object.freeze([
  "protokoll.list.row.due",
  "protokoll.list.row.status",
  "protokoll.list.row.ampel",
  "protokoll.list.row.todo",
  "protokoll.list.row.decision",
  "protokoll.list.row.responsible",
]);

class FakeElement {
  constructor(tagName = "DIV", rect = {}) {
    this.tagName = String(tagName).toUpperCase();
    this.children = []; this.parentElement = null; this.dataset = {}; this.attributes = {};
    this.className = ""; this.textContent = ""; this.hidden = false; this.isConnected = true;
    this._rect = { left: 0, top: 0, width: 120, height: 24, ...rect };
    this.style = {
      setProperty(name, value) { this[name] = String(value); },
      getPropertyValue(name) { return this[name] || ""; },
      removeProperty(name) { delete this[name]; },
    };
    this.classList = {
      add: (name) => { this.className = `${this.className} ${name}`.trim(); },
      contains: (name) => this.className.split(/\s+/).includes(name),
      toggle: (name, enabled) => {
        const names = new Set(this.className.split(/\s+/).filter(Boolean));
        if (enabled) names.add(name); else names.delete(name);
        this.className = [...names].join(" ");
      },
    };
  }
  append(...nodes) { nodes.forEach((node) => this.appendChild(node)); }
  appendChild(node) { if (node && typeof node === "object") node.parentElement = this; this.children.push(node); return node; }
  replaceChildren(...nodes) { this.children = []; nodes.forEach((node) => this.appendChild(node)); }
  setAttribute(name, value) { this.attributes[name] = String(value); if (name === "data-ui-editor-id") this.dataset.uiEditorId = String(value); }
  getAttribute(name) { return this.attributes[name] || null; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener() {}
  getBoundingClientRect() {
    const width = Number.parseFloat(this.style.width); const height = Number.parseFloat(this.style.height);
    const resolvedWidth = Number.isFinite(width) ? width : this._rect.width;
    const resolvedHeight = Number.isFinite(height) ? height : this._rect.height;
    return { left: this._rect.left, top: this._rect.top, width: resolvedWidth, height: resolvedHeight, right: this._rect.left + resolvedWidth, bottom: this._rect.top + resolvedHeight };
  }
}

function computedStyle(element) {
  const rect = element.getBoundingClientRect();
  return {
    ...element.style, display: element.style.display || "grid", width: `${rect.width}px`, height: `${rect.height}px`,
    paddingLeft: element.style.paddingLeft || "0px", paddingTop: element.style.paddingTop || "0px",
    fontSize: element.style.fontSize || "12px", boxSizing: element.style.boxSizing || "border-box",
  };
}

function submit(host, elementId, operation, payload, changeId) {
  return host.handleM80EditorRequest({
    action: "submitChange", scopeId: "protokoll.list.root",
    changeRequest: { changeId, elementId, operation, payload, source: "target-app-start" },
  }).changeResult;
}

async function runM869ProtokollMetaTargetContractTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
  const previous = { document: global.document, window: global.window, Element: global.Element, CustomEvent: global.CustomEvent };
  global.Element = FakeElement;
  global.CustomEvent = class { constructor(type) { this.type = type; } };
  global.document = { createElement: (tag) => new FakeElement(tag), querySelector: () => null, addEventListener() {}, removeEventListener() {} };
  global.window = { getComputedStyle: computedStyle, dispatchEvent() {} };

  try {
    const scope = registry.listM80RegistryScopes().find((entry) => entry.scopeId === "protokoll.list.root");
    const entries = new Map(scope.elements.map((entry) => [entry.id, entry]));
    const source = fs.readFileSync(path.join(ROOT, "src/renderer/modules/protokoll/TopsList.js"), "utf8");
    const css = fs.readFileSync(path.join(ROOT, "src/renderer/modules/protokoll/styles/tops.css"), "utf8");

    await run("M86.9 01: Die historische TOP-Zeile bleibt ein dreispaltiges Grid mit rechter Meta-Spalte", () => {
      assert.match(css, /\.bbm-tops-list-row-grid\s*\{[\s\S]*?grid-template-columns:\s*var\([\s\S]*?--bbm-tops-list-meta-col/s);
      assert.match(css, /\.bbm-tops-list-row-meta\s*\{[\s\S]*?display:\s*grid/s);
      assert.match(css, /\.bbm-tops-list-row-meta-line\s*\{[\s\S]*?display:\s*flex/s);
      assert.doesNotMatch(css, /\.bbm-tops-list-row-meta-line\s*\{[^}]*grid-template-columns/s);
    });
    await run("M86.9 02: Der Renderer referenziert sichtbare Metawerte, nicht ihre Layoutzeilen", () => {
      assert.match(source, /this\._uiEditorRefs\[line\.refId\]\.push\(text\);/);
      assert.doesNotMatch(source, /this\._uiEditorRefs\[line\.refId\]\.push\(el\);/);
    });
    await run("M86.9 03: Meta-Kinder haben stabile Parents, Bounds und ausschließlich sichere Einzeloperationen", () => {
      for (const id of META_IDS) {
        const entry = entries.get(id);
        assert.ok(entry, id); assert.equal(entry.parentId, "protokoll.list.column.meta.cells", id);
        assert.equal(entry.referenceKind, "multi", id);
        assert.ok(entry.baseline && entry.baseline.minWidth > 0 && entry.baseline.minHeight > 0, id);
        for (const operation of entry.allowedOps) assert.equal(entry.operationEffects[operation], "elementOnly", `${id}/${operation}`);
        assert.equal(entry.allowedOps.some((operation) => /(?:display|grid|flex|order|parent)/i.test(operation)), false, id);
      }
    });

    refs.resetM80PilotWorkingStatesForDiagnostic();
    const { TopsList } = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/protokoll/TopsList.js"));
    const list = new TopsList({ onLevel1Toggle() {} });
    list.setItems([
      { id: 1, number: "1.1", createdAt: "01.08.2026", title: "Kurz A", preview: "Lang A", meta: ["02.08.2026", "offen", "Firma A"], ampelColor: "green" },
      { id: 2, number: "1.2", title: "Kurz B", preview: "Lang B", meta: ["03.08.2026", "offen", "Firma B"], metaSymbolType: "task" },
      { id: 3, number: "1.3", title: "Kurz C", preview: "Lang C", meta: ["04.08.2026", "offen", "Firma C"], metaSymbolType: "decision" },
    ]);

    await run("M86.9 04: Alle sichtbaren Meta-Ziele lösen direkt auf ihren echten sichtbaren Knoten auf", () => {
      assert.equal(refs.validateM83ComponentReferences(["bbm.protokoll.list.columns"]).ok, true);
      for (const id of META_IDS) {
        const ref = refs.getM80Ref(id);
        assert.ok(ref?.contractTargets?.length, `${id} targets`);
        assert.ok(ref.contractTargets.every((target) => target !== list.root), `${id} root fallback`);
      }
      for (const id of ["protokoll.list.row.due", "protokoll.list.row.status", "protokoll.list.row.responsible"]) {
        const targets = refs.getM80Ref(id).contractTargets;
        assert.ok(targets.every((target) => target.className === "bbm-tops-list-row-meta-text"), id);
        assert.ok(targets.every((target) => target.parentElement?.className.includes("bbm-tops-list-row-meta-line")), id);
        assert.ok(targets.every((target) => refs.getM80IdFromTarget(target) === id), id);
      }
      for (const id of ["protokoll.list.row.ampel", "protokoll.list.row.todo", "protokoll.list.row.decision"]) {
        assert.ok(refs.getM80Ref(id).contractTargets.every((target) => target.parentElement?.className === "bbm-tops-list-row-meta-ampel-slot"), id);
      }
    });

    await run("M86.9 05: Apply aendert nur das selektierte sichtbare Metakind und niemals Grid, Flex, Reihenfolge oder Parent", () => {
      const due = refs.getM80Ref("protokoll.list.row.due");
      const line = due.contractTargets[0].parentElement;
      const meta = line.parentElement;
      const before = { lineClass: line.className, metaClass: meta.className, lineChildren: [...line.children], metaChildren: [...meta.children] };
      const move = submit(host, due.id, "move", { x: 5, y: -5 }, "m86-9-move");
      assert.equal(move.success, true, move.message);
      const textResize = submit(host, due.id, "textResize", { text: { fontSize: 14, expectedCurrentFontSize: 12 } }, "m86-9-text");
      assert.equal(textResize.success, true, textResize.message);
      assert.equal(due.contractTargets[0].style.translate, "5px -5px");
      assert.equal(due.contractTargets[0].style.fontSize, "14px");
      assert.deepEqual([...line.children], before.lineChildren); assert.deepEqual([...meta.children], before.metaChildren);
      assert.equal(line.className, before.lineClass); assert.equal(meta.className, before.metaClass);
      for (const element of [due.contractTargets[0], line, meta]) {
        for (const property of ["display", "flexDirection", "gridTemplateColumns", "order"]) assert.equal(element.style[property], undefined, property);
      }
    });

    await run("M86.9 06: Rerender übernimmt nur den erlaubten Zielzustand auf neue sichtbare Metawerte", () => {
      list.setItems([{ id: 4, number: "2.1", title: "Neu", preview: "Neu lang", meta: ["05.08.2026", "offen", "Firma D"], ampelColor: "red" }]);
      const due = refs.getM80Ref("protokoll.list.row.due").contractTargets[0];
      assert.equal(due.className, "bbm-tops-list-row-meta-text");
      assert.equal(due.style.translate, "5px -5px"); assert.equal(due.style.fontSize, "14px");
      assert.equal(due.parentElement.style.translate, undefined);
    });

    await run("M86.9 07: Fehlende Zielgeometrie blockiert die Apply-Kette statt eine Ersatzgeometrie zu erfinden", () => {
      const due = refs.getM80Ref("protokoll.list.row.due").contractTargets[0];
      due._rect.width = 0; due._rect.height = 0;
      const result = submit(host, "protokoll.list.row.due", "move", { x: 0, y: 0 }, "m86-9-missing-geometry");
      assert.equal(result.success, false); assert.equal(result.errorCode, "electron_invalid_geometry");
    });
  } finally {
    refs?.resetM80PilotWorkingStatesForDiagnostic?.();
    global.document = previous.document; global.window = previous.window; global.Element = previous.Element; global.CustomEvent = previous.CustomEvent;
  }
}

module.exports = { runM869ProtokollMetaTargetContractTests };
if (require.main === module) {
  let failed = false;
  const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM869ProtokollMetaTargetContractTests(run).then(() => { if (failed) process.exitCode = 1; });
}
