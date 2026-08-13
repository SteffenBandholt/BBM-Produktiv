"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");

class FakeElement {
  constructor(width = 100, height = 40) {
    this.attributes = {}; this.dataset = {}; this.className = ""; this.parentElement = null; this.isConnected = true; this.children = [];
    this._rect = { left: 0, top: 0, width, height };
    this.style = { setProperty(name, value) { this[name] = value; }, getPropertyValue(name) { return this[name] || ""; } };
    this.classList = { contains: (name) => this.className.split(/\s+/).includes(name), toggle: (name, active) => {
      const names = new Set(this.className.split(/\s+/).filter(Boolean)); if (active) names.add(name); else names.delete(name); this.className = [...names].join(" ");
    } };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] || ""; }
  getBoundingClientRect() {
    const configured = typeof this._widthSource === "function" ? this._widthSource() : NaN;
    return { ...this._rect, width: Number.isFinite(configured) ? configured : parseFloat(this.style.width) || this._rect.width, height: parseFloat(this.style.height) || this._rect.height };
  }
}

async function registerProtocolTable(refs) {
  refs.beginM80PilotRender();
  const root = new FakeElement(900, 700);
  const canvas = new FakeElement(900, 700);
  const paper = new FakeElement(900, 720);
  const table = new FakeElement(886, 680);
  const header = new FakeElement(886, 28);
  const body = new FakeElement(886, 400);
  const widths = [64, 650, 172];
  const variables = ["--bbm-ui-editor-tops-list-number-col", "--bbm-ui-editor-tops-list-text-col", "--bbm-ui-editor-tops-list-meta-col"];
  const ids = ["number", "text", "meta"];
  const headers = widths.map((width) => new FakeElement(width, 28));
  const cells = widths.map((width) => new FakeElement(width, 80));
  headers.forEach((element, index) => { const widthSource = () => {
    const track = table.style[variables[index]] || "";
    const proportional = track.match(/,\s*[0-9.]+fr\)$/);
    if (proportional) {
      const number = parseFloat(table.style[variables[0]]) || headers[0]._rect.width;
      const meta = parseFloat(table.style[variables[2]]) || headers[2]._rect.width;
      return Math.max(180, table._rect.width - number - meta);
    }
    return parseFloat(track) || element._rect.width;
  }; element._widthSource = widthSource; cells[index]._widthSource = widthSource; });
  refs.registerM80Ref("protokoll.list.root", root);
  refs.registerM80Ref("protokoll.list.canvas", canvas);
  refs.registerM80Ref("protokoll.list.paper", paper);
  refs.registerM80TableRef("protokoll.list.table", table, table);
  refs.registerM80Ref("protokoll.list.table.header", header);
  refs.registerM80Ref("protokoll.list.table.body", body);
  ids.forEach((key, index) => refs.registerM80TableColumnRef(`protokoll.list.column.${key}`, headers[index], [cells[index]], table, table, variables[index], widths[index]));
  return { table, headers, cells };
}

async function runK17BbmTableBoundaryAcceptanceTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
  const scope = registry.listM80RegistryScopes().find((entry) => entry.scopeId === "protokoll.list.root");
  const tableEntry = scope.elements.find((entry) => entry.id === "protokoll.list.table");

  await run("K17 BBM-UI deklariert die reale Protokolltabelle als feste gekoppelte Spaltengrenze", () => {
    assert.equal(tableEntry.tableLayout.boundaryResizePolicy, "adjacentPreserveTotal");
    assert.ok(tableEntry.allowedOps.includes("resizeColumnBoundary"));
    assert.deepEqual(tableEntry.tableLayout.columnIds, ["protokoll.list.column.number", "protokoll.list.column.text", "protokoll.list.column.meta"]);
    assert.deepEqual(tableEntry.tableLayout.columns.map((column) => column.displayName), ["Nr. / Datum", "Gegenstand", "Meta rechts"]);
  });

  const previous = { document: global.document, window: global.window, Element: global.Element };
  global.Element = FakeElement;
  global.document = { querySelector: () => null, createElement: () => new FakeElement(), addEventListener() {}, removeEventListener() {} };
  global.window = { getComputedStyle: (element) => ({ ...element.style, width: element.style.width || `${element._rect.width}px`, height: element.style.height || `${element._rect.height}px`, paddingLeft: "0px", paddingTop: "0px", fontSize: "12px" }), dispatchEvent() {} };
  refs.resetM80PilotWorkingStatesForDiagnostic();
  try {
    const runtime = await registerProtocolTable(refs);
    let activeRuntime = runtime;
    const submit = (delta, id = `boundary-${delta}`) => host.handleM80EditorRequest({ action: "submitChange", scopeId: "protokoll.list.root", changeRequest: {
      changeId: id, elementId: "protokoll.list.table", operation: "resizeColumnBoundary", source: "ui-editor-panel",
      payload: { table: { leftColumnId: "protokoll.list.column.text", rightColumnId: "protokoll.list.column.meta", delta } },
    } }).changeResult;

    await run("K17 BBM-UI aktiviert die deklarierte Baseline als einzige reale Trackquelle", () => {
      assert.equal(runtime.table.style["--bbm-ui-editor-tops-list-number-col"], "64px");
      assert.equal(runtime.table.style["--bbm-ui-editor-tops-list-text-col"], "minmax(180px, 650fr)");
      assert.equal(runtime.table.style["--bbm-ui-editor-tops-list-meta-col"], "172px");
      const text = refs.snapshotM80State("protokoll.list.column.text");
      assert.equal(text.width, 650);
      assert.equal(text.table.logicalWidth, 650);
      assert.equal(text.table.effectiveWidth, 650);
      assert.equal(text.table.headerWidth, 650);
      assert.deepEqual(text.table.dataCellWidths, [650]);
      assert.deepEqual(text.table.dataContentWidths, [650]);
      assert.equal(text.table.runtimeWidthValid, true);
    });

    await run("K17 BBM-UI kappt gespeicherte Inhaltsbreiten generisch am wirksamen Datenzellen-Track", () => {
      const content = new FakeElement(420, 28);
      refs.registerM80MultiRef("protokoll.list.row.long", [content], runtime.cells[1], { mountedInstanceCount: 1 });
      refs.applyM80State("protokoll.list.row.long", { ...refs.snapshotM80State("protokoll.list.row.long"), width: 1000 }, "resizeWidth");
      assert.equal(content.style.width, "min(1000px, 100%)");
      assert.equal(content.style["max-width"], "100%");
    });

    await run("K17 BBM-UI verschiebt Gegenstand/Meta in genau einer atomaren Operation", () => {
      const result = submit(20);
      assert.equal(result.success, true, result.message);
      assert.deepEqual(result.affectedStates.map((entry) => entry.elementId), ["protokoll.list.column.text", "protokoll.list.column.meta"]);
      assert.equal(refs.snapshotM80State("protokoll.list.column.number").width, 64);
      assert.equal(refs.snapshotM80State("protokoll.list.column.text").width, 670);
      assert.equal(refs.snapshotM80State("protokoll.list.column.meta").width, 152);
      assert.equal(["number", "text", "meta"].reduce((sum, key) => sum + refs.snapshotM80State(`protokoll.list.column.${key}`).width, 0), 886);
      assert.equal(runtime.table.style["--bbm-ui-editor-tops-list-text-col"], "minmax(180px, 670fr)");
      assert.equal(runtime.table.style["--bbm-ui-editor-tops-list-meta-col"], "152px");
      assert.equal(runtime.table.style["--bbm-ui-editor-tops-list-number-col"], "64px");
    });

    await run("K17 BBM-UI hält die Metaspalte nach einer Grenzänderung auch im kleineren sichtbaren Bereich", () => {
      runtime.table._rect.width = 600;
      assert.equal(refs.snapshotM80State("protokoll.list.column.number").width, 64);
      assert.equal(refs.snapshotM80State("protokoll.list.column.text").width, 670);
      assert.equal(refs.snapshotM80State("protokoll.list.column.meta").width, 152);
      assert.equal(runtime.headers[0].getBoundingClientRect().width, 64);
      assert.equal(runtime.headers[1].getBoundingClientRect().width, 384);
      assert.equal(runtime.headers[2].getBoundingClientRect().width, 152);
      assert.equal(runtime.headers.reduce((sum, header) => sum + header.getBoundingClientRect().width, 0), 600);
      const effective = refs.snapshotM80State("protokoll.list.column.text");
      assert.equal(effective.width, 670);
      assert.equal(effective.table.effectiveWidth, 384);
      assert.deepEqual(effective.table.dataCellWidths, [384]);
      assert.equal(effective.table.runtimeWidthValid, true);
      runtime.table._rect.width = 886;
    });

    await run("K17 BBM-UI weist eine Mindestbreitenverletzung ohne Teilzustand ab", () => {
      const before = refs.captureM80WorkingStates();
      const result = submit(57, "boundary-invalid");
      assert.equal(result.success, false);
      assert.equal(refs.snapshotM80State("protokoll.list.column.text").width, 670);
      assert.equal(refs.snapshotM80State("protokoll.list.column.meta").width, 152);
      assert.deepEqual(refs.captureM80WorkingStates(), before);
    });

    await run("K17 BBM-UI behaelt beide Spaltenbreiten nach realem Rerender", async () => {
      const rerender = await registerProtocolTable(refs);
      activeRuntime = rerender;
      assert.equal(rerender.table.style["--bbm-ui-editor-tops-list-text-col"], "minmax(180px, 670fr)");
      assert.equal(rerender.table.style["--bbm-ui-editor-tops-list-meta-col"], "152px");
    });

    await run("K17 BBM-UI erzeugt fuer den Neustart die vorhandenen Breiten-Requests", async () => {
      const savedText = refs.snapshotM80State("protokoll.list.column.text");
      const savedMeta = refs.snapshotM80State("protokoll.list.column.meta");
      refs.resetM80PilotWorkingStatesForDiagnostic();
      activeRuntime = await registerProtocolTable(refs);
      const requests = [
        ...host.createM80StartupRequests("protokoll.list.root", savedText, { [savedText.elementId]: ["resizeWidth", "setColumnWidthMode"] }, true),
        ...host.createM80StartupRequests("protokoll.list.root", savedMeta, { [savedMeta.elementId]: ["resizeWidth", "setColumnWidthMode"] }, true),
      ];
      assert.equal(requests.filter((entry) => entry.request.operation === "resizeWidth").length, 2);
      assert.equal(requests.filter((entry) => entry.request.operation === "setColumnWidthMode").length, 1);
    });

    await run("K17 BBM-UI setzt die vollständige Tabelle auf ihre responsive Originaldarstellung zurück", () => {
      const changed = host.handleM80EditorRequest({ action: "submitChange", scopeId: "protokoll.list.root", changeRequest: {
        changeId: "before-table-original", elementId: "protokoll.list.table", operation: "resizeColumnBoundary", source: "ui-editor-panel",
        payload: { table: { leftColumnId: "protokoll.list.column.text", rightColumnId: "protokoll.list.column.meta", delta: 20 } },
      } }).changeResult;
      assert.equal(changed.success, true, changed.message);
      const result = host.handleM80EditorRequest({ action: "submitChange", scopeId: "protokoll.list.root", changeRequest: {
        changeId: "table-original", elementId: "protokoll.list.table", operation: "resetTable", source: "ui-editor-panel",
        payload: { table: {} },
      } }).changeResult;
      assert.equal(result.success, true, result.message);
      assert.equal(result.affectedStates.length, 3);
      assert.equal(activeRuntime.table.style["--bbm-ui-editor-tops-list-number-col"], "64px");
      assert.equal(activeRuntime.table.style["--bbm-ui-editor-tops-list-text-col"], "minmax(180px, 650fr)");
      assert.equal(activeRuntime.table.style["--bbm-ui-editor-tops-list-meta-col"], "172px");
    });

    await run("K17 BBM-UI hat im Gegenstands-Innenwrapper keine konkurrierende Zeichenbreite", () => {
      const css = require("node:fs").readFileSync(path.join(ROOT, "src/renderer/modules/protokoll/styles/tops.css"), "utf8");
      assert.doesNotMatch(css, /bbm-tops-list-row-(?:preview|text)[\s\S]{0,260}max-inline-size:\s*(?:107ch|min\(100%,\s*var\(--bbm-top-long-measure\)\)|var\(--bbm-top-long-measure\))/);
      assert.match(css, /\.bbm-tops-list-row-title\s*\{[^}]*max-inline-size:\s*100%/s);
      assert.match(css, /\.bbm-tops-list-row:not\(\[data-top-level="1"\]\)\s+\.bbm-tops-list-row-title\s*\{[^}]*max-inline-size:\s*100%/s);
      assert.match(css, /\.bbm-tops-list-row-text\s*\{[^}]*width:\s*100%[^}]*box-sizing:\s*border-box/s);
      const refsSource = require("node:fs").readFileSync(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"), "utf8");
      assert.match(refsSource, /function isTableDataCellContent\(entry\)/);
      assert.match(refsSource, /constrainedByTableTrack \? `min\(\$\{px\(contentWidth\)\}, 100%\)`/);
    });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    global.document = previous.document; global.window = previous.window; global.Element = previous.Element;
  }
}

module.exports = { runK17BbmTableBoundaryAcceptanceTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runK17BbmTableBoundaryAcceptanceTests(run).then(() => { if (failed) process.exitCode = 1; });
}
