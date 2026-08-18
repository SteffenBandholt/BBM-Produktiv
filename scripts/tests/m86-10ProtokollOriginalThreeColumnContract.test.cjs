"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const COLUMN_IDS = Object.freeze([
  "protokoll.list.column.number",
  "protokoll.list.column.text",
  "protokoll.list.column.meta",
]);
const CHILD_IDS = Object.freeze([
  "protokoll.list.row.level1Toggle", "protokoll.list.row.number", "protokoll.list.row.createdAt", "protokoll.list.row.class", "protokoll.list.row.marker",
  "protokoll.list.row.short", "protokoll.list.row.long", "protokoll.list.row.due", "protokoll.list.row.status",
  "protokoll.list.row.ampel", "protokoll.list.row.todo", "protokoll.list.row.decision", "protokoll.list.row.responsible",
]);
const HEADER_IDS = Object.freeze([
  "protokoll.list.column.number.header", "protokoll.list.column.text.header", "protokoll.list.column.meta.header",
  "protokoll.list.header.due", "protokoll.list.header.status", "protokoll.list.header.responsible",
]);
const DATA_CELL_IDS = Object.freeze([
  "protokoll.list.column.number.cells", "protokoll.list.column.text.cells", "protokoll.list.column.meta.cells",
]);
const EDITOR_IDS = Object.freeze(["protokoll.list.row", ...COLUMN_IDS, ...CHILD_IDS]);
const CONTRACT_IDS = Object.freeze([...HEADER_IDS, ...DATA_CELL_IDS, ...EDITOR_IDS]);

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
    const width = Number.parseFloat(this.style.width);
    const height = Number.parseFloat(this.style.height);
    const emptyMeta = this.className.split(/\s+/).includes("bbm-tops-list-row-meta") && this.children.length === 0;
    const resolvedWidth = Number.isFinite(width) ? width : this._rect.width;
    const resolvedHeight = Number.isFinite(height) ? height : emptyMeta ? 0 : this._rect.height;
    return { left: this._rect.left, top: this._rect.top, width: resolvedWidth, height: resolvedHeight, right: this._rect.left + resolvedWidth, bottom: this._rect.top + resolvedHeight };
  }
}

function computedStyle(element) {
  const rect = element.getBoundingClientRect();
  return {
    ...element.style,
    display: element.style.display || "grid",
    width: `${rect.width}px`, height: `${rect.height}px`,
    paddingLeft: element.style.paddingLeft || "0px", paddingTop: element.style.paddingTop || "0px",
    fontSize: element.style.fontSize || "12px", boxSizing: element.style.boxSizing || "border-box",
  };
}

function fullRows({ selectedId = 2 } = {}) {
  return [
    { id: 1, isTitle: true, canToggleLevel1: true, number: "1.", title: "Level 1", showStar: true, meta: [] },
    { id: 2, level: 2, level1TopId: 1, number: "1.1", createdAt: "01.08.2026", title: "Kurz A", preview: "Lang A", meta: ["02.08.2026", "offen", "Firma A"], ampelColor: "green", isSelected: selectedId === 2 },
    { id: 3, level: 2, level1TopId: 1, number: "1.2", createdAt: "01.08.2026", title: "Kurz B", preview: "Lang B", meta: ["03.08.2026", "offen", "Firma B"], isTask: true, isSelected: selectedId === 3 },
    { id: 4, level: 2, level1TopId: 1, number: "1.3", createdAt: "01.08.2026", title: "Kurz C", preview: "Lang C", meta: ["04.08.2026", "offen", "Firma C"], isDecision: true, isSelected: selectedId === 4 },
  ];
}

function submit(host, elementId, operation, payload, changeId, source = "target-app-start") {
  return host.handleM80EditorRequest({
    action: "submitChange", scopeId: "protokoll.list.root",
    changeRequest: { changeId, elementId, operation, payload, source },
  }).changeResult;
}

async function runM8610ProtokollOriginalThreeColumnContractTests(run) {
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
    const component = registry.getM83ComponentContract("bbm.protokoll.list.columns");
    const css = read("src/renderer/modules/protokoll/styles/tops.css");
    const source = read("src/renderer/modules/protokoll/TopsList.js");

    await run("M86.10 01: produktiver Zielcode besitzt genau ein unveraendertes Dreispaltenraster ohne responsive Ersatzstapelung", () => {
      assert.match(source, /row\.append\(num, text, meta\)/);
      assert.doesNotMatch(source, /row\.append\((?:text|meta),\s*(?:num|text)|insertBefore|querySelector|MutationObserver/);
      assert.match(css, /\.bbm-tops-list-row-grid\s*\{[\s\S]*?grid-template-columns:\s*var\([\s\S]*?--bbm-tops-list-number-col[\s\S]*?--bbm-tops-list-text-col[\s\S]*?--bbm-tops-list-meta-col/s);
      const compactStart = css.indexOf("@media (max-width: 640px)");
      const compactEnd = css.indexOf("@media (max-height: 520px)", compactStart);
      const compactCss = css.slice(compactStart, compactEnd);
      assert.doesNotMatch(compactCss, /bbm-tops-list-row-grid|bbm-tops-list-row-meta\s*\{/);
    });

    await run("M86.10 02: vollständiger Listenvertrag deklariert echten Tabellenvertrag, drei logische Spalten und 26 direkte Bindungen", () => {
      const table = entries.get("protokoll.list.table");
      assert.equal(table.tableLayout.rowTemplateId, "protokoll.list.row");
      assert.deepEqual(table.tableLayout.columnIds, COLUMN_IDS);
      assert.equal(table.tableLayout.horizontalOverflowMode, "fitViewport");
      assert.equal(component.slots.filter((slot) => CONTRACT_IDS.includes(slot.slotId)).length, 26);
      for (const id of CONTRACT_IDS) {
        const slot = component.slots.find((candidate) => candidate.slotId === id);
        const entry = entries.get(id);
        assert.ok(slot && entry, id);
        assert.equal(slot.referenceKind, HEADER_IDS.includes(id) ? "single" : "multi", id);
        assert.equal(entry.editable, true, id);
        assert.equal(entry.allowedOps.length > 0, true, id);
        assert.ok(entry.baseline?.minWidth > 0 && entry.baseline?.minHeight > 0, id);
      }
      assert.deepEqual(COLUMN_IDS.map((id) => entries.get(id).type), ["tableColumn", "tableColumn", "tableColumn"]);
      assert.ok(COLUMN_IDS.every((id) => entries.get(id).allowedOps.includes("resizeWidth")));
      assert.deepEqual(COLUMN_IDS.map((id) => entries.get(id).tableBinding.widthSourceId), COLUMN_IDS);
      assert.deepEqual(COLUMN_IDS.map((id) => entries.get(id).tableColumnLayout.dataCellTemplateId), DATA_CELL_IDS);
      assert.deepEqual(DATA_CELL_IDS.map((id) => entries.get(id).type), ["tableDataCell", "tableDataCell", "tableDataCell"]);
      assert.deepEqual(entries.get("protokoll.list.row").allowedOps, ["move", "resizeWidth", "resizeHeight", "setVisibility"]);
    });

    await run("M86.10 03: alle Kinder besitzen den fachlich richtigen Spaltenparent und keine Fachoperation", () => {
      const parents = {
        "protokoll.list.column.number.cells": CHILD_IDS.slice(0, 5),
        "protokoll.list.column.text.cells": CHILD_IDS.slice(5, 7),
        "protokoll.list.column.meta.cells": CHILD_IDS.slice(7),
      };
      for (const [parentId, ids] of Object.entries(parents)) for (const id of ids) {
        const entry = entries.get(id);
        assert.equal(entry.parentId, parentId, id);
        assert.equal(entry.allowedOps.some((operation) => /execute|create|delete|domain|status|responsible|due/i.test(operation)), false, id);
      }
    });

    refs.resetM80PilotWorkingStatesForDiagnostic();
    let toggleCount = 0;
    const { TopsList } = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/protokoll/TopsList.js"));
    const list = new TopsList({ onLevel1Toggle() { toggleCount += 1; } });
    list.setItems(fullRows());

    await run("M86.10 04: echte TopsList rendert Level 1 und Unterpunkte mit derselben Reihenfolge Struktur/Text/Meta", () => {
      assert.equal(list.root.children.length, 4);
      for (const rowElement of list.root.children) {
        const grid = rowElement.children[0];
        assert.equal(grid.className, "bbm-tops-list-row-grid"); assert.equal(grid.children.length, 3);
        assert.equal(grid.children[0].className, "bbm-tops-list-row-number");
        assert.equal(grid.children[1].className, "bbm-tops-list-row-text");
        assert.equal(grid.children[2].className, "bbm-tops-list-row-meta");
      }
      const subject = list.root.children[1].children[0].children[1];
      assert.deepEqual(subject.children.map((child) => child.className), ["bbm-tops-list-row-title", "bbm-tops-list-row-preview"]);
      refs.getM80Ref("protokoll.list.row.level1Toggle").contractTargets[0].onclick({ preventDefault() {}, stopPropagation() {} });
      assert.equal(toggleCount, 1);
    });

    await run("M86.10 05: 26 Bindungen lösen direkt auf sichtbare Knoten auf; die leere Level-1-Metazelle wird nie Primärziel", () => {
      assert.equal(refs.validateM83ComponentReferences(["bbm.protokoll.list.columns"]).ok, true);
      for (const id of CONTRACT_IDS) {
        const ref = refs.getM80Ref(id);
        assert.ok(ref?.contractTargets?.length, id);
        assert.ok(ref.contractTargets.every((target) => target !== list.root), `${id}/fallback`);
        if (!COLUMN_IDS.includes(id)) assert.equal(ref.contractTargets[0].getAttribute("data-ui-inspector-id"), id, `${id}/attribute`);
      }
      const meta = refs.getM80Ref("protokoll.list.column.meta");
      assert.ok(meta.element.getBoundingClientRect().height > 0);
      assert.ok(meta.element.children.length > 0);
      for (const id of ["protokoll.list.row.due", "protokoll.list.row.status", "protokoll.list.row.responsible"]) {
        assert.ok(refs.getM80Ref(id).contractTargets.every((target) => target.className === "bbm-tops-list-row-meta-text"), id);
      }
    });

    await run("M86.10 06: Spaltenbreite schreibt nur die gemeinsame CSS-Quelle und verändert weder Inline-Zellenbreiten noch DOM-Reihenfolge", () => {
      const rowsBefore = list.root.children.map((row) => [...row.children[0].children]);
      const metaRef = refs.getM80Ref("protokoll.list.column.meta");
      const initialWidth = refs.snapshotM80State(metaRef.id).width;
      assert.ok(initialWidth > 0, "current column width must be readable before the first editor change");
      const result = submit(host, metaRef.id, "resizeWidth", { width: initialWidth - 10 }, "m86-10-column-width");
      assert.equal(result.success, true, result.message);
      assert.equal(list.table.style["--bbm-ui-editor-tops-list-meta-col"], `${initialWidth - 10}px`);
      assert.equal(list.root.style["--bbm-ui-editor-tops-list-meta-col"], undefined);
      assert.ok(metaRef.contractTargets.every((target) => target.style.width === undefined));
      list.root.children.forEach((row, index) => assert.deepEqual([...row.children[0].children], rowsBefore[index]));
    });

    await run("M86.10 07: erlaubte Multi-Ref-Aenderungen wirken auf alle sichtbaren Instanzen", () => {
      const textIds = ["protokoll.list.row.number", "protokoll.list.row.short", "protokoll.list.row.long", "protokoll.list.row.due", "protokoll.list.row.status", "protokoll.list.row.responsible"];
      for (const [index, id] of textIds.entries()) {
        const result = submit(host, id, "textResize", { text: { fontSize: 13 + index, expectedCurrentFontSize: 12 } }, `m86-10-text-${index}`);
        assert.equal(result.success, true, `${id}: ${result.message}`);
        assert.ok(refs.getM80Ref(id).contractTargets.every((target) => target.style.fontSize === `${13 + index}px`), id);
      }
      const ampel = submit(host, "protokoll.list.row.ampel", "resizeWidth", { width: 18 }, "m86-10-ampel");
      assert.equal(ampel.success, true, ampel.message);
      assert.ok(refs.getM80Ref("protokoll.list.row.ampel").contractTargets.every((target) => target.style.width === "18px"));
      const row = submit(host, "protokoll.list.row", "resizeHeight", { height: 60 }, "m86-10-row-height");
      assert.equal(row.success, true, row.message);
      assert.ok(refs.getM80Ref("protokoll.list.row").contractTargets.every((target) => target.style.height === "60px"));
    });

    await run("M86.10 08: Einklappen, Aufklappen, Filterwechsel, Auswahlwechsel und neuer Datensatz übernehmen gespeicherte Werte beim Rerender", () => {
      list.setItems([{ id: 1, isTitle: true, canToggleLevel1: true, isLevel1Collapsed: true, number: "1.", title: "Level 1", showStar: true, meta: [] }]);
      assert.equal(refs.getM80Ref("protokoll.list.row.short").contractTargets[0].style.fontSize, "14px");
      list.setItems(fullRows({ selectedId: 3 }));
      for (const [id, size] of [["protokoll.list.row.number", 13], ["protokoll.list.row.short", 14], ["protokoll.list.row.long", 15], ["protokoll.list.row.due", 16], ["protokoll.list.row.status", 17], ["protokoll.list.row.responsible", 18]]) {
        assert.ok(refs.getM80Ref(id).contractTargets.every((target) => target.style.fontSize === `${size}px`), `${id}/expand`);
      }
      list.setItems([fullRows({ selectedId: 4 })[3]]);
      assert.equal(list.root.children[0].dataset.isSelected, "true");
      assert.equal(refs.getM80Ref("protokoll.list.row.long").contractTargets[0].style.fontSize, "15px");
      list.setItems([{ id: 99, level: 2, number: "9.9", createdAt: "05.08.2026", title: "Neu", preview: "Neu lang", meta: ["06.08.2026", "offen", "Firma Neu"], ampelColor: "red" }]);
      assert.equal(refs.getM80Ref("protokoll.list.row.number").contractTargets[0].style.fontSize, "13px");
      assert.equal(refs.getM80Ref("protokoll.list.row.ampel").contractTargets[0].style.width, "18px");
      assert.equal(refs.getM80Ref("protokoll.list.row").contractTargets[0].style.height, "60px");
      assert.ok(Number.parseFloat(list.table.style["--bbm-ui-editor-tops-list-meta-col"]) > 0);
    });

    await run("M86.10 09: fehlender Ref oder reale Nullgeometrie blockiert statt auf Root oder Ersatzlayout auszuweichen", () => {
      const missing = submit(host, "protokoll.list.row.todo", "resizeWidth", { width: 20 }, "m86-10-missing-target", "ui-editor-panel");
      assert.equal(missing.success, false); assert.equal(missing.errorCode, "electron_element_not_found");
      const due = refs.getM80Ref("protokoll.list.row.due").contractTargets[0];
      due._rect.width = 0; due._rect.height = 0;
      const geometry = submit(host, "protokoll.list.row.due", "move", { x: 0, y: 0 }, "m86-10-missing-geometry");
      assert.equal(geometry.success, false); assert.equal(geometry.errorCode, "electron_invalid_geometry");
    });

    await run("M86.10 10: Workbench bleibt Kurztext oben sowie Langtext links und Meta rechts ohne responsive Stapelregel", () => {
      assert.match(css, /\.bbm-tops-workbench-editbox\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) clamp\(180px, 22vw, 214px\)[\s\S]*?grid-template-rows:\s*auto minmax\(0, 1fr\)/s);
      assert.match(css, /\.bbm-tops-editbox-short-wrap\s*\{[\s\S]*?grid-column:\s*1 \/ -1[\s\S]*?grid-row:\s*1/s);
      assert.match(css, /\.bbm-tops-editbox-long-wrap\s*\{[\s\S]*?grid-column:\s*1[\s\S]*?grid-row:\s*2/s);
      assert.match(css, /\.editbox-meta-slot\s*\{[\s\S]*?grid-column:\s*2[\s\S]*?grid-row:\s*2/s);
      assert.doesNotMatch(css, /@media[^{}]*\{[^}]*bbm-tops-workbench-editbox[^}]*grid-template-columns/s);
    });

    await run("M86.10 11: Restarbeiten-Vertrag bleibt das unveränderte technische Vorbild mit drei eigenen Spalten", () => {
      const rest = registry.getM83ComponentContract("bbm.restarbeiten.list");
      const restColumns = rest.slots.filter((slot) => slot.element.type === "tableColumn");
      assert.deepEqual(restColumns.map((slot) => slot.slotId), ["restarbeiten.list.table.number", "restarbeiten.list.table.subject", "restarbeiten.list.table.meta"]);
      assert.equal(rest.slots.some((slot) => slot.slotId.startsWith("protokoll.")), false);
      assert.equal(read("src/renderer/modules/restarbeiten/RestarbeitenList.js").includes("row.append(numberColumn, contentColumn, metaColumn)"), true);
    });

    await run("M86.10 12: isolierte Acceptance-Fixture macht Ampel, ToDo und Beschluss sichtbar pruefbar", () => {
      const acceptanceSeeder = read("src/renderer/ui-editor/protokollAcceptanceSeeder.js");
      const childRows = acceptanceSeeder.match(/Object\.freeze\(\{ key: "kind-[^\n]+/g) || [];
      assert.ok(childRows.some((row) => /task: false, decision: false/.test(row)), "Ampel");
      assert.ok(childRows.some((row) => /task: true, decision: false/.test(row)), "ToDo");
      assert.ok(childRows.some((row) => /decision: true/.test(row)), "Beschluss");
    });

    await run("M86.10 13: bedingt ausgeblendete Diktatziele koennen ein gueltiges Startprofil bilden", () => {
      const editScope = registry.listM80RegistryScopes().find((entry) => entry.scopeId === "protokoll.edit.root");
      const editEntries = new Map(editScope.elements.map((entry) => [entry.id, entry]));
      for (const id of ["protokoll.edit.dictation.status", "protokoll.edit.dictation.status.action.undo"]) {
        assert.equal(editEntries.get(id).baseline.minWidth, 1, `${id}/minWidth`);
        assert.equal(editEntries.get(id).baseline.minHeight, 1, `${id}/minHeight`);
      }
    });

    await run("M86.10 14: Startup-Geometrie nutzt bei leerer Liste den echten Tabellenkopf und ergänzt Datenzellen erst beim Rerender", async () => {
      list.setItems([]);
      const emptyColumn = refs.getM80Ref("protokoll.list.column.meta");
      assert.equal(emptyColumn.contractTargets.length, 1);
      assert.strictEqual(emptyColumn.contractTargets[0], list.headerMeta);
      assert.equal(refs.getM80Ref("protokoll.list.column.meta.cells").contractTargets.length, 0);
      assert.equal(await host.waitForM80StartupGeometry([{ request: { elementId: "protokoll.list.column.meta", operation: "resizeWidth" } }], 4), true);
      list.setItems(fullRows());
      assert.ok(refs.getM80Ref("protokoll.list.column.meta").contractTargets.length > 1);
      assert.ok(refs.getM80Ref("protokoll.list.column.meta.cells").contractTargets.length > 0);
    });

    await run("M86.10 15: Verwerfen rollt nur beruehrte Operationen zurueck und schreibt keine unbeteiligte Zeilenhoehe", async () => {
      refs.resetM80PilotWorkingStatesForDiagnostic();
      const discardList = new TopsList();
      discardList.setItems(fullRows());
      const untouchedRow = refs.getM80Ref("protokoll.list.row").contractTargets[0];
      const numberRef = refs.getM80Ref("protokoll.list.row.number");
      const baselineFontSize = refs.snapshotM80State(numberRef.id).fontSize;
      assert.equal(untouchedRow.style.height, undefined);
      host.handleM80EditorRequest({ action: "getRegistry" });
      const changed = host.handleM80EditorRequest({
        action: "submitChange",
        scopeId: "protokoll.list.root",
        changeRequest: {
          changeId: "m86-10-discard-number",
          elementId: numberRef.id,
          operation: "textResize",
          payload: { text: { fontSize: baselineFontSize + 1, expectedCurrentFontSize: baselineFontSize } },
          source: "ui-editor-panel",
        },
      }).changeResult;
      assert.equal(changed.success, true, changed.message);
      const discarded = host.handleM80EditorEvent({ action: "editorClosed", disposition: "discarded" });
      assert.equal(discarded.restoredElementCount, 1);
      assert.equal(refs.snapshotM80State(numberRef.id).fontSize, baselineFontSize);
      assert.equal(untouchedRow.style.height, undefined);
    });
  } finally {
    refs?.resetM80PilotWorkingStatesForDiagnostic?.();
    global.document = previous.document; global.window = previous.window; global.Element = previous.Element; global.CustomEvent = previous.CustomEvent;
  }
}

module.exports = { runM8610ProtokollOriginalThreeColumnContractTests };
if (require.main === module) {
  let failed = false;
  const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM8610ProtokollOriginalThreeColumnContractTests(run).then(() => { if (failed) process.exitCode = 1; });
}
