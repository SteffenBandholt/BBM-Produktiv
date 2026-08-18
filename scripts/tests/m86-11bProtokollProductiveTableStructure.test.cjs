"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const CHILD_TARGETS = Object.freeze({
  "protokoll.list.row.level1Toggle": "number",
  "protokoll.list.row.number": "number",
  "protokoll.list.row.createdAt": "number",
  "protokoll.list.row.class": "number",
  "protokoll.list.row.marker": "number",
  "protokoll.list.row.short": "text",
  "protokoll.list.row.long": "text",
  "protokoll.list.row.due": "meta",
  "protokoll.list.row.status": "meta",
  "protokoll.list.row.ampel": "meta",
  "protokoll.list.row.todo": "meta",
  "protokoll.list.row.decision": "meta",
  "protokoll.list.row.responsible": "meta",
});

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = String(tagName).toUpperCase();
    this.nodeName = this.tagName;
    this.children = [];
    this.parentElement = null;
    this.dataset = {};
    this.attributes = {};
    this.className = "";
    this.textContent = "";
    this.hidden = false;
    this.disabled = false;
    this.isConnected = true;
    this._rect = { left: 0, top: 0, width: 120, height: 20 };
    this.style = {
      setProperty(name, value) { this[name] = String(value); },
      getPropertyValue(name) { return this[name] || ""; },
      removeProperty(name) { delete this[name]; },
    };
    this.classList = {
      add: (...names) => {
        const values = new Set(String(this.className).split(/\s+/).filter(Boolean));
        names.forEach((name) => values.add(name));
        this.className = [...values].join(" ");
      },
      contains: (name) => String(this.className).split(/\s+/).includes(name),
      toggle: (name, enabled) => {
        const values = new Set(String(this.className).split(/\s+/).filter(Boolean));
        if (enabled) values.add(name); else values.delete(name);
        this.className = [...values].join(" ");
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
  removeEventListener() {}

  getBoundingClientRect() {
    const { left, top, width, height } = this._rect;
    return { left, top, width, height, right: left + width, bottom: top + height };
  }
}

function computedStyle(element) {
  const rect = element.getBoundingClientRect();
  return {
    ...element.style,
    display: element.style.display || "grid",
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    fontSize: element.style.fontSize || "12px",
    paddingLeft: element.style.paddingLeft || "0px",
    paddingTop: element.style.paddingTop || "0px",
    boxSizing: element.style.boxSizing || "border-box",
  };
}

function hasClass(element, className) {
  return String(element?.className || "").split(/\s+/).includes(className);
}

function findByClass(root, className) {
  if (!root) return null;
  if (hasClass(root, className)) return root;
  for (const child of root.children || []) {
    const match = findByClass(child, className);
    if (match) return match;
  }
  return null;
}

function hasAncestor(element, expectedAncestor) {
  for (let cursor = element; cursor; cursor = cursor.parentElement) {
    if (cursor === expectedAncestor) return true;
  }
  return false;
}

function setRect(element, left, top, width, height) {
  assert.ok(element, `Geometrieziel fehlt: ${left}/${top}/${width}/${height}`);
  element._rect = { left, top, width, height };
}

function inside(inner, outer, label) {
  const child = inner.getBoundingClientRect();
  const parent = outer.getBoundingClientRect();
  assert.ok(child.left >= parent.left, `${label}: links ausserhalb`);
  assert.ok(child.top >= parent.top, `${label}: oben ausserhalb`);
  assert.ok(child.right <= parent.right, `${label}: rechts ausserhalb`);
  assert.ok(child.bottom <= parent.bottom, `${label}: unten ausserhalb`);
}

function ruleFor(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|})\\s*${escaped}\\s*\\{([^}]*)\\}`, "s").exec(css)?.[1] || "";
}

function mediaBlocks(css) {
  const blocks = [];
  let cursor = 0;
  while ((cursor = css.indexOf("@media", cursor)) >= 0) {
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
  return blocks.join("\n");
}

function layoutProductRow(rowElement, rowIndex, css) {
  const rowTop = 120 + rowIndex * 110;
  setRect(rowElement, 100, rowTop, 900, 96);
  const grid = rowElement.children[0];
  setRect(grid, 110, rowTop + 8, 880, 80);
  const [numberColumn, textColumn, metaColumn] = grid.children;
  const gridRule = ruleFor(css, ".bbm-tops-list-row-grid");
  const hasProductGrid = /display:\s*grid/.test(gridRule) &&
    /--bbm-ui-editor-tops-list-number-col/.test(gridRule) &&
    /--bbm-ui-editor-tops-list-text-col/.test(gridRule) &&
    /--bbm-ui-editor-tops-list-meta-col/.test(gridRule);

  if (hasProductGrid) {
    setRect(numberColumn, 110, rowTop + 8, 104, 80);
    setRect(textColumn, 216, rowTop + 8, 560, 80);
    setRect(metaColumn, 778, rowTop + 8, 212, 80);
  } else {
    setRect(numberColumn, 110, rowTop + 8, 104, 20);
    setRect(textColumn, 110, rowTop + 30, 666, 30);
    setRect(metaColumn, 110, rowTop + 62, 212, 80);
  }

  const numberLine = findByClass(numberColumn, "bbm-tops-list-row-number-line");
  const number = findByClass(numberColumn, "bbm-tops-list-row-number-value");
  const createdAt = findByClass(numberColumn, "bbm-tops-list-row-number-date");
  const itemClass = findByClass(numberColumn, "bbm-tops-list-row-class");
  setRect(numberLine, numberColumn._rect.left, numberColumn._rect.top, 96, 16);
  setRect(number, numberColumn._rect.left, numberColumn._rect.top, 44, 14);
  setRect(createdAt, numberColumn._rect.left, numberColumn._rect.top + 18, 76, 13);
  setRect(itemClass, numberColumn._rect.left, numberColumn._rect.top + 34, 44, 13);
  const marker = findByClass(numberColumn, "bbm-tops-list-row-star");
  if (marker) setRect(marker, numberColumn._rect.left + 35, numberColumn._rect.top, 8, 12);

  const shortText = findByClass(textColumn, "bbm-tops-list-row-title");
  const longText = findByClass(textColumn, "bbm-tops-list-row-preview");
  setRect(shortText, textColumn._rect.left, textColumn._rect.top, 400, 18);
  setRect(longText, textColumn._rect.left, textColumn._rect.top + 24, 520, 34);

  const metaLines = metaColumn.children || [];
  metaLines.forEach((line, index) => {
    setRect(line, metaColumn._rect.left, metaColumn._rect.top + index * 22, 200, 18);
    const text = findByClass(line, "bbm-tops-list-row-meta-text");
    if (text) setRect(text, metaColumn._rect.left, metaColumn._rect.top + index * 22, 150, 14);
    const symbol = findByClass(line, "bbm-tops-list-row-ampel") || findByClass(line, "bbm-tops-list-row-meta-symbol");
    if (symbol) setRect(symbol, metaColumn._rect.left + 154, metaColumn._rect.top + index * 22, 14, 14);
  });

  return { rowElement, grid, numberColumn, textColumn, metaColumn };
}

async function runM8611bProtokollProductiveTableStructureTests(run) {
  const protocolCss = read("src/renderer/modules/protokoll/styles/tops.css");
  const listSource = read("src/renderer/modules/protokoll/TopsList.js");
  const screenSource = read("src/renderer/modules/protokoll/screens/TopsScreen.js");
  const restarbeitenSource = read("src/renderer/modules/restarbeiten/RestarbeitenList.js");
  const previous = {
    document: global.document,
    window: global.window,
    Element: global.Element,
    CustomEvent: global.CustomEvent,
  };
  global.Element = FakeElement;
  global.CustomEvent = class { constructor(type) { this.type = type; } };
  global.document = {
    body: new FakeElement("body"),
    createElement: (tag) => new FakeElement(tag),
    querySelector: () => null,
    addEventListener() {},
    removeEventListener() {},
  };
  global.window = {
    getComputedStyle: computedStyle,
    dispatchEvent() {},
    innerWidth: 1200,
    innerHeight: 900,
  };

  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  try {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    const { TopsList } = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/protokoll/TopsList.js"));
    const list = new TopsList({ onLevel1Toggle() {} });
    list.setItems([
      { id: 1, level: 1, isTitle: true, canToggleLevel1: true, number: "1.", createdAt: "03.08.2026", itemClass: "Titel", title: "Titel", showStar: true },
      { id: 2, level: 2, number: "1.1.", createdAt: "03.08.2026", itemClass: "TOP", title: "Kurztext Ampel", preview: "Langtext Ampel", due: "21.08.2026", status: "offen", responsible: "Firma A", ampelColor: "green", showStar: true },
      { id: 3, level: 2, number: "1.2.", createdAt: "03.08.2026", itemClass: "TOP", title: "Kurztext ToDo", preview: "Langtext ToDo", due: "22.08.2026", status: "offen", responsible: "Firma B", isTask: true, showStar: true },
      { id: 4, level: 2, number: "1.3.", createdAt: "03.08.2026", itemClass: "TOP", title: "Kurztext Beschluss", preview: "Langtext Beschluss", due: "23.08.2026", status: "offen", responsible: "Firma C", isDecision: true, showStar: true },
    ]);

    await run("M86.11b 01: produktiver Tabellenkopf benennt die drei verbindlichen Hauptspalten", () => {
      assert.equal(list.table.children.length, 2);
      assert.strictEqual(list.table.children[0], list.header);
      assert.strictEqual(list.table.children[1], list.root);
      assert.deepEqual(list.header.children.map((element) => element.textContent), [
        "Nr.\nDatum",
        "Gegenstand",
        "",
      ]);
      assert.deepEqual(list.headerMeta.children.map((element) => element.textContent), ["Fertig bis", "Status", "Verantw."]);
    });

    const normalRows = list.root.children.slice(1);
    const geometries = normalRows.map((row, index) => layoutProductRow(row, index, protocolCss));

    await run("M86.11b 02: jede normale TOP-Zeile besitzt drei nebeneinanderliegende Spalten innerhalb ihrer Zeile", () => {
      for (const [index, geometry] of geometries.entries()) {
        const left = geometry.numberColumn.getBoundingClientRect();
        const middle = geometry.textColumn.getBoundingClientRect();
        const right = geometry.metaColumn.getBoundingClientRect();
        assert.ok(left.left < middle.left, `Zeile ${index + 1}: links < mitte`);
        assert.ok(middle.left < right.left, `Zeile ${index + 1}: mitte < rechts`);
        assert.ok(left.right <= middle.left + 2, `Zeile ${index + 1}: linke Spalte ueberlappt`);
        assert.ok(middle.right <= right.left + 2, `Zeile ${index + 1}: mittlere Spalte ueberlappt`);
        inside(geometry.numberColumn, geometry.rowElement, `Zeile ${index + 1}/links`);
        inside(geometry.textColumn, geometry.rowElement, `Zeile ${index + 1}/mitte`);
        inside(geometry.metaColumn, geometry.rowElement, `Zeile ${index + 1}/rechts`);
      }
    });

    await run("M86.11b 03: Inhalte liegen vertikal und vollstaendig innerhalb ihrer fachlichen Spalte", () => {
      for (const [index, geometry] of geometries.entries()) {
        const number = findByClass(geometry.numberColumn, "bbm-tops-list-row-number-value");
        const createdAt = findByClass(geometry.numberColumn, "bbm-tops-list-row-number-date");
        const itemClass = findByClass(geometry.numberColumn, "bbm-tops-list-row-class");
        const shortText = findByClass(geometry.textColumn, "bbm-tops-list-row-title");
        const longText = findByClass(geometry.textColumn, "bbm-tops-list-row-preview");
        const [dueLine, statusLine, responsibleLine] = geometry.metaColumn.children;
        const due = findByClass(dueLine, "bbm-tops-list-row-meta-text");
        const status = findByClass(statusLine, "bbm-tops-list-row-meta-text");
        const responsible = findByClass(responsibleLine, "bbm-tops-list-row-meta-text");
        assert.equal(itemClass.textContent, "", `Zeile ${index + 1}/Klassenbezeichnung`);
        assert.equal(itemClass.hidden, true, `Zeile ${index + 1}/Klassenbezeichnung verborgen`);
        for (const [element, owner, label] of [
          [number, geometry.numberColumn, "Nummer"], [createdAt, geometry.numberColumn, "Datum"],
          [shortText, geometry.textColumn, "Kurztext"], [longText, geometry.textColumn, "Langtext"],
          [due, geometry.metaColumn, "Fertig bis"], [status, geometry.metaColumn, "Status"], [responsible, geometry.metaColumn, "Verantwortlich"],
        ]) inside(element, owner, `Zeile ${index + 1}/${label}`);
        assert.ok(number._rect.top < createdAt._rect.top, `Zeile ${index + 1}/links vertikal`);
        assert.ok(shortText._rect.top < longText._rect.top, `Zeile ${index + 1}/Kurztext vor Langtext`);
        assert.ok(due._rect.top < status._rect.top && status._rect.top < responsible._rect.top, `Zeile ${index + 1}/Meta vertikal`);
        assert.ok(geometry.metaColumn._rect.left >= geometry.textColumn._rect.left + geometry.textColumn._rect.width - 2, `Zeile ${index + 1}/Meta rechts`);
      }
    });

    await run("M86.11b 04: jedes Einzelziel besitzt direkte produktive Refs ohne Root- oder Ersatzrahmen", () => {
      const firstGeometry = geometries[0];
      const columns = {
        number: list.root.children.map((row) => row.children[0].children[0]),
        text: list.root.children.map((row) => row.children[0].children[1]),
        meta: list.root.children.map((row) => row.children[0].children[2]),
      };
      for (const [id, columnKey] of Object.entries(CHILD_TARGETS)) {
        const ref = refs.getM80Ref(id);
        assert.ok(ref?.contractTargets?.length > 0, `${id}/targets`);
        assert.ok(ref.contractTargets.every((target) => target !== list.root && target !== list.table), `${id}/fallback`);
        assert.ok(ref.contractTargets.every((target) => columns[columnKey].some((column) => hasAncestor(target, column))), `${id}/Spaltenparent`);
      }
      assert.ok(firstGeometry.numberColumn && firstGeometry.textColumn && firstGeometry.metaColumn);
    });

    await run("M86.11b 05: Produktcode besitzt die Struktur; Responsive-CSS und Editor duerfen sie nicht stapeln oder scrollen", () => {
      const gridRule = ruleFor(protocolCss, ".bbm-tops-list-row-grid");
      const tableRule = ruleFor(protocolCss, ".bbm-tops-list-table");
      const metaRule = ruleFor(protocolCss, ".bbm-tops-list-row-meta");
      assert.match(gridRule, /display:\s*grid/);
      assert.match(gridRule, /--bbm-ui-editor-tops-list-number-col[\s\S]*--bbm-ui-editor-tops-list-text-col[\s\S]*--bbm-ui-editor-tops-list-meta-col/);
      assert.match(metaRule, /display:\s*grid/);
      assert.doesNotMatch(metaRule, /grid-template-columns/);
      assert.match(metaRule, /transform:\s*none/);
      assert.doesNotMatch(tableRule, /overflow-x:\s*(?:auto|scroll)/);
      assert.doesNotMatch(mediaBlocks(protocolCss), /bbm-tops-list-row-grid\s*\{[^}]*grid-template-columns|bbm-tops-list-row-meta\s*\{[^}]*grid-template-columns/s);
      assert.match(listSource, /this\.table\.append\(this\.header, this\.root\)/);
      assert.match(screenSource, /this\.sheetPaper\.appendChild\(this\.topsList\.table\)/);
      assert.match(restarbeitenSource, /row\.append\(numberColumn, contentColumn, metaColumn\)/);
    });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    global.document = previous.document;
    global.window = previous.window;
    global.Element = previous.Element;
    global.CustomEvent = previous.CustomEvent;
  }
}

module.exports = { runM8611bProtokollProductiveTableStructureTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runM8611bProtokollProductiveTableStructureTests(run).then(() => { if (failed) process.exitCode = 1; });
}
