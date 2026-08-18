"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const LIST_IDS = Object.freeze([
  "protokoll.list.row", "protokoll.list.row.level1Toggle", "protokoll.list.row.number", "protokoll.list.row.marker",
  "protokoll.list.row.createdAt", "protokoll.list.row.short", "protokoll.list.row.long", "protokoll.list.row.due",
  "protokoll.list.row.status", "protokoll.list.row.responsible", "protokoll.list.row.ampel", "protokoll.list.row.todo", "protokoll.list.row.decision",
]);

class FakeElement {
  constructor(tagName = "DIV") {
    this.tagName = String(tagName).toUpperCase();
    this.children = []; this.parentElement = null; this.dataset = {}; this.className = ""; this.textContent = "";
    this.style = { setProperty(name, value) { this[name] = String(value); }, removeProperty(name) { delete this[name]; } };
    this.classList = { add: (name) => { this.className = `${this.className} ${name}`.trim(); }, toggle() {} };
  }
  append(...nodes) { nodes.forEach((node) => this.appendChild(node)); }
  appendChild(node) { if (node && typeof node === "object") node.parentElement = this; this.children.push(node); return node; }
  replaceChildren(...nodes) { this.children = []; nodes.forEach((node) => this.appendChild(node)); }
  setAttribute(name, value) { this[name] = String(value); }
  removeAttribute(name) { delete this[name]; }
  addEventListener() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 120, height: 24, right: 120, bottom: 24 }; }
}

function createFakeDocument() {
  return { createElement: (tag) => new FakeElement(tag) };
}

async function runM868ProtokollFullContractTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const listComponent = registry.getM83ComponentContract("bbm.protokoll.list.columns");
  const entries = new Map(registry.listM80RegistryScopes().find((scope) => scope.scopeId === "protokoll.list.root").elements.map((entry) => [entry.id, entry]));

  await run("M86.8 01: jeder bekannte sichtbare Listenbestandteil besitzt stabilen Multi-Ref-Vertrag ohne Fachwerte", () => {
    for (const id of LIST_IDS) {
      const slot = listComponent.slots.find((candidate) => candidate.slotId === id);
      const entry = entries.get(id);
      assert.ok(slot, `missing slot ${id}`); assert.ok(entry, `missing entry ${id}`);
      assert.equal(slot.referenceKind, "multi", id); assert.equal(slot.requirements.directSelection, entry.editable, id);
      assert.equal(entries.has(entry.parentId), true, `${id} parent`);
      assert.ok(entry.baseline && entry.baseline.minWidth > 0 && entry.baseline.minHeight > 0, `${id} baseline`);
      assert.doesNotMatch(entry.id, /(?:^|\.)\d{4,}(?:\.|$)|recordId|databaseId/i, id);
    }
  });

  await run("M86.8 02: Renderer sammelt nur bekannte direkte Teile, registriert sie als Multi-Refs und behält sie beim Rerender", () => {
    const source = read("src/renderer/modules/protokoll/TopsList.js");
    assert.match(source, /this\._uiEditorRefs\s*=\s*this\._createUiEditorRefs\(\)/);
    assert.match(source, /registerM80TableColumnRef\([\s\S]*?column\.id,[\s\S]*?this\._uiEditorRefs\[column\.key\] \|\| \[\],[\s\S]*?this\.table/s);
    for (const id of LIST_IDS) assert.match(source, new RegExp(`"${id.replace(/\./g, "\\.")}"`), id);
    assert.doesNotMatch(source, /querySelector|querySelectorAll|MutationObserver|data-ui-editor-id.*item\.id/);
  });

  await run("M86.8 02a: reale TopsList bindet alle sichtbaren Wiederholungsziele direkt und erneuert sie beim Rerender", async () => {
    const previous = { document: global.document, window: global.window, Element: global.Element };
    const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
    const { TopsList } = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/protokoll/TopsList.js"));
    global.document = createFakeDocument(); global.Element = FakeElement;
    global.window = { getComputedStyle: () => ({ paddingLeft: "0px", paddingTop: "0px", fontSize: "12px" }) };
    try {
      refs.resetM80PilotWorkingStatesForDiagnostic();
      const list = new TopsList({ onLevel1Toggle() {} });
      list.setItems([
        { id: 1, isTitle: true, canToggleLevel1: true, number: "1.", title: "Titel", showStar: true, meta: [] },
        { id: 2, number: "1.1", createdAt: "01.08.2026", title: "Kurz", preview: "Lang", meta: ["02.08.2026", "offen", "Firma A"], ampelColor: "green" },
        { id: 3, number: "1.2", title: "Aufgabe", meta: ["03.08.2026", "offen", "Firma B"], isTask: true },
        { id: 4, number: "1.3", title: "Beschluss", meta: ["04.08.2026", "offen", "Firma C"], isDecision: true },
      ]);
      assert.equal(refs.validateM83ComponentReferences(["bbm.protokoll.list.columns"]).ok, true);
      for (const id of LIST_IDS) {
        const ref = refs.getM80Ref(id);
        assert.ok(ref?.contractTargets?.length, `${id} has visible direct target`);
        assert.ok(ref.contractTargets.every((target) => target !== list.root), `${id} does not fall back to the list root`);
      }
      const short = refs.getM80Ref("protokoll.list.row.short");
      refs.applyM80State(short.id, { ...refs.snapshotM80State(short.id), x: 3 }, "move");
      list.setItems([{ id: 5, number: "2.1", createdAt: "05.08.2026", title: "Neu", preview: "Neu lang", meta: ["06.08.2026", "offen", "Firma D"], ampelColor: "red" }]);
      const rerenderedShort = refs.getM80Ref("protokoll.list.row.short");
      assert.equal(rerenderedShort.contractTargets.length, 1);
      assert.equal(rerenderedShort.contractTargets[0].style.translate, "3px 0px");
    } finally {
      refs.resetM80PilotWorkingStatesForDiagnostic();
      global.document = previous.document; global.window = previous.window; global.Element = previous.Element;
    }
  });

  await run("M86.8 03: Workbench-Vertrag und bestehender Meta-Slot erzwingen Kurztext oberhalb von Langtext und Meta", () => {
    const contract = registry.getM83ComponentContract("bbm.protokoll.editbox");
    const text = contract.slots.find((slot) => slot.slotId === "protokoll.edit.text").element;
    const meta = contract.slots.find((slot) => slot.slotId === "protokoll.edit.meta").element;
    assert.equal(meta.parentId, "protokoll.edit.text"); assert.equal(text.preserveTarget, true);
    assert.deepEqual(text.layoutStructure.shortAbove, ["protokoll.edit.long", "protokoll.edit.meta"]);
    assert.deepEqual(text.layoutStructure.sideBySide, ["protokoll.edit.long", "protokoll.edit.meta"]);
    const workbench = read("src/renderer/tops/components/TopsWorkbench.js");
    const css = read("src/renderer/modules/protokoll/styles/tops.css");
    assert.match(workbench, /editbox\.metaCol\.appendChild\(this\.metaColumn\.root\)/);
    assert.match(css, /\.bbm-tops-workbench-editbox\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) clamp\(180px, 22vw, 214px\)/);
    assert.match(css, /\.bbm-tops-editbox-short-wrap\s*\{[\s\S]*?grid-column:\s*1 \/ -1[\s\S]*?grid-row:\s*1/s);
    assert.match(css, /\.bbm-tops-editbox-long-wrap\s*\{[\s\S]*?grid-column:\s*1[\s\S]*?grid-row:\s*2/s);
    assert.match(css, /\.editbox-meta-slot\s*\{[\s\S]*?grid-column:\s*2[\s\S]*?grid-row:\s*2/s);
  });

  await run("M86.8 04: Editbox-Ampel nutzt den vorhandenen Symbolref und die normale Textgroessenoperation", () => {
    const contract = registry.getM83ComponentContract("bbm.protokoll.editbox");
    const ampel = contract.slots.find((slot) => slot.slotId === "protokoll.edit.ampel").element;
    const screen = read("src/renderer/modules/protokoll/screens/TopsScreen.js");
    const css = read("src/renderer/modules/protokoll/styles/tops.css");
    assert.equal(ampel.type, "statusIndicator");
    assert.equal(ampel.hasVisibleText, true);
    assert.ok(ampel.allowedOps.includes("textResize"));
    assert.match(screen, /registerM80Ref\("protokoll\.edit\.ampel", status\.trafficDot\)/);
    assert.match(css, /\.bbm-tops-meta-due-with-ampel \.status-ampel-dot\s*\{[\s\S]*?width:\s*1em;[\s\S]*?height:\s*1em;[\s\S]*?font-size:\s*15px;/);
  });
}

module.exports = { runM868ProtokollFullContractTests };
if (require.main === module) {
  let failed = false;
  const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM868ProtokollFullContractTests(run).then(() => { if (failed) process.exitCode = 1; });
}
