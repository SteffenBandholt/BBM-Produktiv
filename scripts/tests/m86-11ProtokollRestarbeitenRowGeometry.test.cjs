"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");
const PROTOKOLL_CHILD_IDS = Object.freeze([
  "protokoll.list.row.level1Toggle",
  "protokoll.list.row.number",
  "protokoll.list.row.createdAt",
  "protokoll.list.row.class",
  "protokoll.list.row.marker",
  "protokoll.list.row.short",
  "protokoll.list.row.long",
  "protokoll.list.row.due",
  "protokoll.list.row.status",
  "protokoll.list.row.ampel",
  "protokoll.list.row.todo",
  "protokoll.list.row.decision",
  "protokoll.list.row.responsible",
]);
const PROTOKOLL_COLUMN_IDS = Object.freeze([
  "protokoll.list.column.number",
  "protokoll.list.column.text",
  "protokoll.list.column.meta",
]);
const PROTOKOLL_DATA_CELL_IDS = Object.freeze([
  "protokoll.list.column.number.cells",
  "protokoll.list.column.text.cells",
  "protokoll.list.column.meta.cells",
]);
const PROTOKOLL_HEADER_IDS = Object.freeze([
  "protokoll.list.table.header",
  "protokoll.list.column.number.header",
  "protokoll.list.column.text.header",
  "protokoll.list.column.meta.header",
  "protokoll.list.header.due",
  "protokoll.list.header.status",
  "protokoll.list.header.responsible",
]);

class FakeElement {
  constructor(tagName = "DIV") {
    this.tagName = String(tagName).toUpperCase();
    this.nodeName = this.tagName;
    this.children = [];
    this.parentElement = null;
    this.dataset = {};
    this.attributes = {};
    this.className = "";
    this.textContent = "";
    this.hidden = false;
    this.isConnected = true;
    this._rect = { left: 0, top: 0, width: 120, height: 20 };
    this.style = {
      setProperty(name, value) { this[name] = String(value); },
      getPropertyValue(name) { return this[name] || ""; },
      removeProperty(name) { delete this[name]; },
    };
    this.classList = {
      add: (...names) => {
        const current = new Set(String(this.className).split(/\s+/).filter(Boolean));
        names.forEach((name) => current.add(name));
        this.className = [...current].join(" ");
      },
      contains: (name) => String(this.className).split(/\s+/).includes(name),
      toggle: (name, enabled) => {
        const current = new Set(String(this.className).split(/\s+/).filter(Boolean));
        if (enabled) current.add(name); else current.delete(name);
        this.className = [...current].join(" ");
      },
    };
  }
  append(...nodes) { nodes.forEach((node) => this.appendChild(node)); }
  appendChild(node) {
    if (node && typeof node === "object") node.parentElement = this;
    this.children.push(node);
    return node;
  }
  replaceChildren(...nodes) {
    this.children.forEach((node) => { if (node && typeof node === "object") node.isConnected = false; });
    this.children = [];
    nodes.forEach((node) => this.appendChild(node));
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.startsWith("data-")) {
      const key = name.slice(5).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
      this.dataset[key] = String(value);
    }
  }
  getAttribute(name) { return this.attributes[name] || null; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener() {}
  getBoundingClientRect() {
    const width = Number.parseFloat(this.style.width);
    const height = Number.parseFloat(this.style.height);
    const resolvedWidth = Number.isFinite(width) ? width : this._rect.width;
    const resolvedHeight = Number.isFinite(height) ? height : this._rect.height;
    return {
      left: this._rect.left,
      top: this._rect.top,
      width: resolvedWidth,
      height: resolvedHeight,
      right: this._rect.left + resolvedWidth,
      bottom: this._rect.top + resolvedHeight,
    };
  }
}

function computedStyle(element) {
  const rect = element.getBoundingClientRect();
  return {
    ...element.style,
    display: element.style.display || "grid",
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    paddingLeft: element.style.paddingLeft || "0px",
    paddingTop: element.style.paddingTop || "0px",
    fontSize: element.style.fontSize || "12px",
    boxSizing: element.style.boxSizing || "border-box",
  };
}

function hasClass(element, className) {
  return String(element?.className || "").split(/\s+/).includes(className);
}

function childByClass(parent, className) {
  return Array.from(parent?.children || []).find((element) => hasClass(element, className)) || null;
}

function setRect(element, left, top, width, height) {
  assert.ok(element, `Geometrieziel fehlt: ${left}/${top}/${width}/${height}`);
  element._rect = { left, top, width, height };
}

function cssRule(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|})\\s*${escaped}\\s*\\{([^}]*)\\}`, "s").exec(css);
  return match?.[1] || "";
}

function atRuleBlocks(css, atRule = "@media") {
  const blocks = [];
  let cursor = 0;
  while ((cursor = css.indexOf(atRule, cursor)) >= 0) {
    const open = css.indexOf("{", cursor);
    if (open < 0) break;
    let depth = 1;
    let end = open + 1;
    while (end < css.length && depth > 0) {
      if (css[end] === "{") depth += 1;
      else if (css[end] === "}") depth -= 1;
      end += 1;
    }
    blocks.push(css.slice(cursor, end));
    cursor = end;
  }
  return blocks;
}

function layoutProtocolRow(rowElement, css) {
  const row = { left: 100, top: 100, width: 900, height: 96 };
  setRect(rowElement, row.left, row.top, row.width, row.height);
  const grid = rowElement.children[0];
  setRect(grid, 110, 108, 880, 80);
  const [numberColumn, textColumn, metaColumn] = grid.children;
  const rowRule = cssRule(css, ".bbm-tops-list-row-grid");
  const isThreeColumnGrid = /display:\s*grid/.test(rowRule) && /grid-template-columns:/.test(rowRule);
  if (isThreeColumnGrid) {
    setRect(numberColumn, 110, 108, 104, 80);
    setRect(textColumn, 226, 108, 552, 80);
    setRect(metaColumn, 790, 108, 200, 80);
  } else {
    setRect(numberColumn, 110, 108, 104, 24);
    setRect(textColumn, 110, 136, 668, 40);
    setRect(metaColumn, 110, 180, 200, 54);
  }

  const numberRule = cssRule(css, ".bbm-tops-list-row-number");
  const numberVertical = /flex-direction:\s*column/.test(numberRule) || /display:\s*grid/.test(numberRule);
  const numberLine = childByClass(numberColumn, "bbm-tops-list-row-number-line");
  const date = childByClass(numberColumn, "bbm-tops-list-row-number-date");
  const itemClass = childByClass(numberColumn, "bbm-tops-list-row-class");
  const number = childByClass(numberLine, "bbm-tops-list-row-number-value");
  setRect(numberLine, numberColumn._rect.left, numberColumn._rect.top, 72, 16);
  setRect(number, numberColumn._rect.left, numberColumn._rect.top, 34, 14);
  setRect(date, numberVertical ? numberColumn._rect.left : numberColumn._rect.left + 38, numberVertical ? numberColumn._rect.top + 18 : numberColumn._rect.top, 74, 13);
  setRect(itemClass, numberVertical ? numberColumn._rect.left : numberColumn._rect.left + 116, numberVertical ? numberColumn._rect.top + 34 : numberColumn._rect.top, 38, 13);

  const shortText = childByClass(textColumn, "bbm-tops-list-row-title");
  const longText = childByClass(textColumn, "bbm-tops-list-row-preview");
  setRect(shortText, textColumn._rect.left, textColumn._rect.top, 280, 18);
  setRect(longText, textColumn._rect.left, textColumn._rect.top + 24, 480, 34);

  const metaRule = cssRule(css, ".bbm-tops-list-row-meta");
  const lineRule = cssRule(css, ".bbm-tops-list-row-meta-line");
  const metaVertical = /display:\s*grid/.test(metaRule) && !/grid-template-columns:/.test(metaRule) &&
    /display:\s*(?:flex|grid)/.test(lineRule);
  Array.from(metaColumn.children).forEach((line, index) => {
    const left = metaVertical ? metaColumn._rect.left : metaColumn._rect.left + index * 62;
    const top = metaVertical ? metaColumn._rect.top + index * 20 : metaColumn._rect.top;
    setRect(line, left, top, metaVertical ? 180 : 58, 16);
    const text = childByClass(line, "bbm-tops-list-row-meta-text");
    if (text) setRect(text, left, top, 92, 14);
    const slot = childByClass(line, "bbm-tops-list-row-meta-ampel-slot");
    if (slot) {
      setRect(slot, left + 98, top, 14, 14);
      if (slot.children[0]) setRect(slot.children[0], left + 98, top, 14, 14);
    }
  });
  return { rowElement, grid, numberColumn, textColumn, metaColumn };
}

function layoutRestarbeitenRow(rowElement, css) {
  const rowRule = cssRule(css, ".bbm-restarbeiten-record");
  const sideBySide = /display:\s*grid/.test(rowRule) && /grid-template-columns:/.test(rowRule);
  setRect(rowElement, 100, 230, 900, 96);
  const [numberColumn, textColumn, metaColumn] = rowElement.children;
  if (sideBySide) {
    setRect(numberColumn, 110, 239, 104, 78);
    setRect(textColumn, 226, 239, 552, 78);
    setRect(metaColumn, 790, 239, 200, 78);
  } else {
    setRect(numberColumn, 110, 239, 104, 24);
    setRect(textColumn, 110, 267, 668, 38);
    setRect(metaColumn, 110, 309, 200, 54);
  }
  const metaRule = cssRule(css, ".bbm-restarbeiten-record__meta");
  const vertical = /display:\s*grid/.test(metaRule) && !/grid-template-columns:/.test(metaRule);
  Array.from(numberColumn.children).forEach((element, index) => setRect(element, numberColumn._rect.left, numberColumn._rect.top + index * 16, 82, 13));
  Array.from(textColumn.children).forEach((element, index) => setRect(element, textColumn._rect.left, textColumn._rect.top + index * 20, 420, index === 2 ? 28 : 16));
  Array.from(metaColumn.children).forEach((element, index) => setRect(element, vertical ? metaColumn._rect.left : metaColumn._rect.left + index * 48, vertical ? metaColumn._rect.top + index * 18 : metaColumn._rect.top, 92, 14));
  return { rowElement, numberColumn, textColumn, metaColumn };
}

function assertApproximatelySameX(elements, label, tolerance = 1) {
  const values = elements.map((element) => element.getBoundingClientRect().left);
  assert.ok(Math.max(...values) - Math.min(...values) <= tolerance, `${label}: ${values.join(", ")}`);
}

function assertInside(inner, outer, label) {
  const child = inner.getBoundingClientRect();
  const parent = outer.getBoundingClientRect();
  assert.ok(child.left >= parent.left && child.right <= parent.right && child.top >= parent.top && child.bottom <= parent.bottom, label);
}

async function runM8611ProtokollRestarbeitenRowGeometryTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const viewModel = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/protokoll/viewmodel/TopsScreenViewModel.js"));
  const protocolCss = read("src/renderer/modules/protokoll/styles/tops.css");
  const protocolListSource = read("src/renderer/modules/protokoll/TopsList.js");
  const restarbeitenCss = read("src/renderer/modules/restarbeiten/styles/restarbeiten.css");
  const scope = registry.listM80RegistryScopes().find((entry) => entry.scopeId === "protokoll.list.root");
  const entries = new Map(scope.elements.map((entry) => [entry.id, entry]));

  await run("M86.11 01: Vertrag besitzt echten Header, Body, Zeilenvorlage, drei Spalten und jedes sichtbare Einzelziel", () => {
    for (const id of [...PROTOKOLL_HEADER_IDS, "protokoll.list.table.body", "protokoll.list.row", ...PROTOKOLL_COLUMN_IDS, ...PROTOKOLL_DATA_CELL_IDS, ...PROTOKOLL_CHILD_IDS]) {
      assert.ok(entries.has(id), id);
    }
    const table = entries.get("protokoll.list.table");
    assert.equal(table.tableLayout.rowTemplateId, "protokoll.list.row");
    assert.deepEqual(table.tableLayout.columnIds, PROTOKOLL_COLUMN_IDS);
    assert.deepEqual(PROTOKOLL_COLUMN_IDS.map((id) => entries.get(id).parentId), Array(3).fill("protokoll.list.table"));
    assert.deepEqual(PROTOKOLL_DATA_CELL_IDS.map((id, index) => entries.get(id).parentId), PROTOKOLL_COLUMN_IDS);
    assert.deepEqual(PROTOKOLL_COLUMN_IDS.map((id) => entries.get(id).tableColumnLayout.dataCellTemplateId), PROTOKOLL_DATA_CELL_IDS);
    assert.deepEqual(PROTOKOLL_COLUMN_IDS.map((id) => entries.get(id).tableBinding.widthSourceId), PROTOKOLL_COLUMN_IDS);
    assert.equal(entries.get("protokoll.list.row").parentId, "protokoll.list.table.body");
    const childParents = {
      "protokoll.list.column.number.cells": PROTOKOLL_CHILD_IDS.slice(0, 5),
      "protokoll.list.column.text.cells": PROTOKOLL_CHILD_IDS.slice(5, 7),
      "protokoll.list.column.meta.cells": PROTOKOLL_CHILD_IDS.slice(7),
    };
    for (const [parentId, ids] of Object.entries(childParents)) for (const id of ids) {
      const entry = entries.get(id);
      assert.equal(entry.parentId, parentId, id);
      assert.equal(entry.referenceKind, "multi", id);
      assert.ok(entry.baseline?.minWidth > 0 && entry.baseline?.minHeight > 0, id);
    }
    const cssFontBaselines = {
      "protokoll.list.row.level1Toggle": 10.667,
      "protokoll.list.row.number": 11.333,
      "protokoll.list.row.createdAt": 8.667,
      "protokoll.list.row.class": 8.667,
      "protokoll.list.row.short": 11.333,
      "protokoll.list.row.long": 11.333,
      "protokoll.list.row.due": 10.667,
      "protokoll.list.row.status": 10.667,
      "protokoll.list.row.responsible": 10.667,
    };
    for (const [id, expected] of Object.entries(cssFontBaselines)) assert.equal(entries.get(id).baseline.fontSize, expected, id);
  });

  await run("M86.11 02: vorhandene Level-Klassifikation liefert Titel/TOP und vorhandenes Anlagedatum fuer beide Klassen", () => {
    const rows = viewModel.buildListItemsFromState({
      tops: [
        { id: 1, level: 1, displayNumber: 1, title: "Titel", created_at: "2026-08-01T10:00:00.000Z" },
        { id: 2, level: 2, displayNumber: 1.1, title: "TOP", created_at: "2026-08-02T10:00:00.000Z" },
      ],
    });
    assert.deepEqual(rows.map((row) => row.itemClass), ["Titel", "TOP"]);
    assert.deepEqual(rows.map((row) => row.createdAt), ["01.08.2026", "02.08.2026"]);
    assert.match(protocolListSource, /const TODO_PNG = resolveModuleAsset\("\.\.\/\.\.\/assets\/todo\.png"\)/);
    assert.match(protocolListSource, /const RED_FLAG_PNG = resolveModuleAsset\("\.\.\/\.\.\/assets\/icons\/redFlag\.png"\)/);
  });

  const previous = { document: global.document, window: global.window, Element: global.Element, CustomEvent: global.CustomEvent };
  global.Element = FakeElement;
  global.CustomEvent = class { constructor(type) { this.type = type; } };
  global.document = {
    body: new FakeElement("body"),
    createElement: (tag) => new FakeElement(tag),
    querySelector: () => null,
    addEventListener() {},
    removeEventListener() {},
  };
  global.window = { getComputedStyle: computedStyle, dispatchEvent() {}, innerWidth: 1200, innerHeight: 900 };

  try {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    const { TopsList } = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/protokoll/TopsList.js"));
    const { buildRestarbeitenList } = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/restarbeiten/RestarbeitenList.js"));
    const list = new TopsList({ onLevel1Toggle() {} });
    list.setItems([{
      id: 11,
      level: 2,
      number: "1.1.",
      createdAt: "01.08.2026",
      itemClass: "TOP",
      title: "Kurztext",
      preview: "Langtext unter dem Kurztext",
      meta: ["08.08.2026", "offen", "Firma A"],
      ampelColor: "green",
      showStar: true,
    }]);
    const restRecords = buildRestarbeitenList({ items: [{
      id: 21,
      numberLine: "1",
      dateLine: "01.08.2026",
      itemClassLabel: "Restarbeit",
      locationLine: "Bereich A",
      shortTextLine: "Kurztext",
      longTextLine: "Langtext",
      dueDateLabel: "08.08.2026",
      ampelState: "gruen",
      statusLabel: "offen",
      responsibleLabel: "Firma A",
    }] });

    await run("M86.11 03: echte Protokollkomponente besitzt denselben Table-Header-Body-Zeilenaufbau wie Restarbeiten", () => {
      assert.ok(list.table, "Tabellencontainer");
      assert.strictEqual(list.table.children[0], list.header);
      assert.strictEqual(list.table.children[1], list.root);
      assert.equal(list.header.children.length, 3);
      assert.equal(list.root.children.length, 1);
      assert.equal(list.root.children[0].children[0].children.length, 3);
      assert.equal(restRecords.children[0].children.length, 3);
      assert.equal(refs.validateM83ComponentReferences(["bbm.protokoll.list.columns"]).ok, true);
      for (const id of ["protokoll.list.row.class", ...PROTOKOLL_COLUMN_IDS, ...PROTOKOLL_DATA_CELL_IDS]) {
        const ref = refs.getM80Ref(id);
        assert.ok(ref?.contractTargets?.length, id);
        assert.ok(ref.contractTargets.every((target) => target !== list.root && target !== list.table), `${id}/fallback`);
      }
    });

    const protocolGeometry = layoutProtocolRow(list.root.children[0], protocolCss);
    const restGeometry = layoutRestarbeitenRow(restRecords.children[0], restarbeitenCss);

    await run("M86.11 04: beide produktiven DOMs besitzen dieselbe logische Dreispaltenanordnung", () => {
      const protocolLefts = [protocolGeometry.numberColumn, protocolGeometry.textColumn, protocolGeometry.metaColumn].map((element) => element.getBoundingClientRect().left);
      const restLefts = [restGeometry.numberColumn, restGeometry.textColumn, restGeometry.metaColumn].map((element) => element.getBoundingClientRect().left);
      assert.ok(protocolLefts[0] < protocolLefts[1] && protocolLefts[1] < protocolLefts[2], protocolLefts.join("/"));
      assert.ok(restLefts[0] < restLefts[1] && restLefts[1] < restLefts[2], restLefts.join("/"));
      assert.deepEqual(protocolGeometry.grid.children.map((element) => element.className), [
        "bbm-tops-list-row-number", "bbm-tops-list-row-text", "bbm-tops-list-row-meta",
      ]);
    });

    await run("M86.11 05: Nummer und Datum stehen untereinander; die Klassenbezeichnung bleibt unsichtbar", () => {
      const number = refs.getM80Ref("protokoll.list.row.number").element;
      const date = refs.getM80Ref("protokoll.list.row.createdAt").element;
      const itemClass = refs.getM80Ref("protokoll.list.row.class").element;
      assertApproximatelySameX([number, date], "linke Spalte");
      assert.ok(number.getBoundingClientRect().top < date.getBoundingClientRect().top);
      assert.equal(itemClass.textContent, "");
      assert.equal(itemClass.hidden, true);
    });

    await run("M86.11 06: Kurztext und Langtext stehen am selben x und Kurztext liegt oben", () => {
      const shortText = refs.getM80Ref("protokoll.list.row.short").element;
      const longText = refs.getM80Ref("protokoll.list.row.long").element;
      assertApproximatelySameX([shortText, longText], "Gegenstandsspalte");
      assert.ok(shortText.getBoundingClientRect().top < longText.getBoundingClientRect().top);
    });

    await run("M86.11 07: Fertig bis, Status und Verantwortlich stehen am selben x und streng untereinander", () => {
      const due = refs.getM80Ref("protokoll.list.row.due").element;
      const status = refs.getM80Ref("protokoll.list.row.status").element;
      const responsible = refs.getM80Ref("protokoll.list.row.responsible").element;
      assertApproximatelySameX([due, status, responsible], "Metaspalte");
      assert.ok(due.getBoundingClientRect().top < status.getBoundingClientRect().top);
      assert.ok(status.getBoundingClientRect().top < responsible.getBoundingClientRect().top);
      assert.equal(refs.getM80Ref("protokoll.list.row.ampel").element.parentElement.parentElement, status.parentElement);
    });

    await run("M86.11 08: alle Einzelziele liegen in derselben TOP-Zeile und Meta niemals unter dem Gegenstand", () => {
      const row = protocolGeometry.rowElement;
      for (const id of ["protokoll.list.row.number", "protokoll.list.row.createdAt", "protokoll.list.row.short", "protokoll.list.row.long", "protokoll.list.row.due", "protokoll.list.row.status", "protokoll.list.row.responsible", "protokoll.list.row.ampel"]) {
        assertInside(refs.getM80Ref(id).element, row, id);
      }
      const subject = protocolGeometry.textColumn.getBoundingClientRect();
      for (const id of ["protokoll.list.row.due", "protokoll.list.row.status", "protokoll.list.row.responsible"]) {
        const rect = refs.getM80Ref(id).element.getBoundingClientRect();
        assert.ok(rect.left >= subject.right, `${id} liegt nicht rechts vom Gegenstand`);
        assert.ok(rect.top < subject.bottom, `${id} liegt unter dem Gegenstandscontainer`);
      }
    });

    await run("M86.11 09: CSS kann Meta weder horizontal noch per Responsive-Ersatz unter den Gegenstand verschieben", () => {
      const metaRule = cssRule(protocolCss, ".bbm-tops-list-row-meta");
      const metaLineRule = cssRule(protocolCss, ".bbm-tops-list-row-meta-line");
      assert.match(metaRule, /display:\s*grid/);
      assert.doesNotMatch(metaRule, /grid-template-columns/);
      assert.match(metaLineRule, /display:\s*flex/);
      assert.doesNotMatch(metaLineRule, /grid-template-columns/);
      const mediaRules = atRuleBlocks(protocolCss).join("\n");
      assert.doesNotMatch(mediaRules, /bbm-tops-list-row-grid\s*\{[^}]*grid-template-columns|bbm-tops-list-row-meta\s*\{[^}]*grid-template-columns/s);
    });

    await run("M86.11 10: Markierung nutzt nur sichtbare Multi-Refs und niemals den Listen-Root als Ersatzrahmen", async () => {
      const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
      assert.equal(host.highlightM80Element("protokoll.list.row.long"), true);

      list.root.style.overflowY = "auto";
      setRect(list.root, 100, 100, 900, 96);
      const longRef = refs.getM80Ref("protokoll.list.row.long");
      setRect(longRef.contractTargets[0], 226, 500, 480, 34);
      assert.throws(
        () => host.highlightM80Element("protokoll.list.row.long"),
        (error) => error?.code === "electron_invalid_geometry"
      );

      list.setItems([{ id: 12, level: 2, number: "1.2.", itemClass: "TOP", title: "Ohne bedingte Ziele" }]);
      for (const id of ["protokoll.list.row.long", "protokoll.list.row.ampel", "protokoll.list.row.todo", "protokoll.list.row.decision"]) {
        const ref = refs.getM80Ref(id);
        assert.equal(ref.contractTargets.length, 0, id);
        assert.notStrictEqual(ref.element, ref.contractTargets[0], id);
        assert.throws(
          () => host.highlightM80Element(id),
          (error) => error?.code === "electron_invalid_geometry",
          id
        );
      }
    });

    await run("M86.11 11: gespeicherte Werte warten bei ausgeblendeten bedingten Multi-Refs auf den naechsten sichtbaren Rerender", async () => {
      const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
      const hiddenRef = refs.getM80Ref("protokoll.list.row.long");
      assert.equal(hiddenRef.contractTargets.length, 0);
      const hiddenState = refs.snapshotM80State("protokoll.list.row.long");
      const currentFontSize = Number(hiddenState.fontSize);
      const startupFontSize = currentFontSize >= 48 ? currentFontSize - 1 : currentFontSize + 1;
      const restored = refs.applyM80State(
        "protokoll.list.row.long",
        { ...hiddenState, fontSize: startupFontSize },
        "textResize"
      );
      assert.equal(restored.fontSize, startupFontSize);

      list.setItems([{ id: 13, level: 2, number: "1.3.", itemClass: "TOP", title: "Wieder sichtbar", preview: "Gespeicherter Langtext" }]);
      const visibleRef = refs.getM80Ref("protokoll.list.row.long");
      assert.equal(visibleRef.contractTargets.length, 1);
      assert.equal(visibleRef.contractTargets[0].style.fontSize, `${startupFontSize}px`);

      list.setItems([{ id: 14, level: 2, number: "1.4.", itemClass: "TOP", title: "Wieder ausgeblendet" }]);
      const interactive = host.handleM80EditorRequest({
        action: "submitChange",
        scopeId: "protokoll.list.root",
        changeRequest: {
          changeId: "m86-11-hidden-interactive-longtext",
          elementId: "protokoll.list.row.long",
          operation: "textResize",
          payload: { text: { fontSize: 12 } },
          source: "ui-editor-panel",
        },
      }).changeResult;
      assert.equal(interactive.success, false);
      assert.equal(interactive.errorCode, "electron_element_not_found");
    });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    global.document = previous.document;
    global.window = previous.window;
    global.Element = previous.Element;
    global.CustomEvent = previous.CustomEvent;
  }
}

module.exports = { runM8611ProtokollRestarbeitenRowGeometryTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runM8611ProtokollRestarbeitenRowGeometryTests(run).then(() => { if (failed) process.exitCode = 1; });
}
