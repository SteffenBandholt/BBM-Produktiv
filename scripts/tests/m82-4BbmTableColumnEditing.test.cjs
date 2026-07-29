"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const {
  createUiScopeFingerprint,
  validateTableElementBindings,
  validateTableLayout,
} = require("ui-editor-kit");

const ROOT = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

class FakeElement {
  constructor(width = 100, height = 40) {
    this.attributes = {}; this.dataset = {}; this.className = ""; this.parentElement = null; this.isConnected = true;
    this.children = [];
    this._rect = { left: 0, top: 0, width, height };
    this.style = {
      setProperty(name, value) { this[name] = value; },
      getPropertyValue(name) { return this[name] || ""; },
    };
    this.classList = {
      contains: (name) => this.className.split(/\s+/).includes(name),
      toggle: (name, active) => { const names = new Set(this.className.split(/\s+/).filter(Boolean)); if (active) names.add(name); else names.delete(name); this.className = [...names].join(" "); },
    };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getBoundingClientRect() {
    const configured = typeof this._widthSource === "function" ? this._widthSource() : NaN;
    return { ...this._rect, width: Number.isFinite(configured) ? configured : parseFloat(this.style.width) || this._rect.width, height: parseFloat(this.style.height) || this._rect.height };
  }
}

async function createRuntime(refs, host) {
  const previous = { document: global.document, window: global.window, Element: global.Element };
  global.Element = FakeElement;
  global.document = { querySelector: () => null, createElement: () => new FakeElement(), addEventListener() {}, removeEventListener() {} };
  global.window = {
    getComputedStyle: (element) => ({ ...element.style, width: element.style.width || `${element._rect.width}px`, height: element.style.height || `${element._rect.height}px`, paddingLeft: element.style.paddingLeft || "0px", paddingTop: element.style.paddingTop || "0px", fontSize: element.style.fontSize || "12px" }),
    dispatchEvent() {},
  };
  refs.resetM80PilotWorkingStatesForDiagnostic();
  refs.beginM80PilotRender();

  const root = new FakeElement(900, 700);
  const area = new FakeElement(900, 700);
  const paper = new FakeElement(900, 720);
  const viewport = new FakeElement(600, 680);
  const scrollArea = new FakeElement(600, 680);
  const table = new FakeElement(858, 680);
  const header = new FakeElement(858, 28);
  const body = new FakeElement(858, 400);
  const row = new FakeElement(858, 80);
  const headers = [new FakeElement(82, 28), new FakeElement(560, 28), new FakeElement(172, 28)];
  const cells = [new FakeElement(82, 80), new FakeElement(560, 80), new FakeElement(172, 80)];
  const variables = ["--bbm-restarbeiten-number-column", "--bbm-restarbeiten-subject-column", "--bbm-restarbeiten-meta-column"];
  const minimums = [50, 160, 110];
  headers.forEach((element, index) => {
    element._widthSource = () => {
      const value = table.style[variables[index]];
      if (!value) return element._rect.width;
      if (String(value).startsWith("minmax")) return Math.max(minimums[index], viewport._rect.width - 44 - headers.filter((_item, candidate) => candidate !== index).reduce((sum, other, candidate) => {
        const actualIndex = candidate >= index ? candidate + 1 : candidate;
        const configured = parseFloat(table.style[variables[actualIndex]]);
        return sum + (Number.isFinite(configured) ? configured : other._rect.width);
      }, 0));
      return parseFloat(value);
    };
  });

  refs.registerM80Ref("restarbeiten.list.root", root);
  refs.registerM80Ref("restarbeiten.list.area", area);
  refs.registerM80Ref("restarbeiten.list.paper", paper);
  refs.registerM80Ref("restarbeiten.list.viewport", viewport);
  refs.registerM80Ref("restarbeiten.list.scrollArea", scrollArea);
  refs.registerM80TableRef("restarbeiten.list.table", table, viewport, scrollArea);
  refs.registerM80Ref("restarbeiten.list.table.header", header);
  refs.registerM80Ref("restarbeiten.list.table.body", body);
  refs.registerM80Ref("restarbeiten.list.table.row", row);
  const ids = ["number", "subject", "meta"];
  ids.forEach((key, index) => refs.registerM80TableColumnRef(`restarbeiten.list.table.${key}`, headers[index], [cells[index]], table, viewport, variables[index], headers[index]._rect.width));
  refs.completeM80PilotRender();

  const submit = (elementId, operation, payload, changeId = `${elementId}-${operation}`, source = "target-app-start") => host.handleM80EditorRequest({
    action: "submitChange", scopeId: "restarbeiten.list.root",
    changeRequest: { changeId, elementId, operation, payload, source },
  }).changeResult;
  return { table, viewport, scrollArea, headers, cells, submit, cleanup: () => { refs.resetM80PilotWorkingStatesForDiagnostic(); global.document = previous.document; global.window = previous.window; global.Element = previous.Element; } };
}

async function runM824BbmTableColumnEditingTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
  const scope = registry.listM80RegistryScopes().find((entry) => entry.scopeId === "restarbeiten.list.root");
  const byId = new Map(scope.elements.map((entry) => [entry.id, entry]));
  const tableEntry = byId.get("restarbeiten.list.table");
  const columns = scope.elements.filter((entry) => entry.type === "tableColumn");

  await run("M82.4 BBM 01: bestaetigte Restarbeiten-Liste ist UI-Inhaltstabelle", () => assert.equal(tableEntry.role, "contentTable"));
  await run("M82.4 BBM 02: exakt drei bestaetigte Hauptspalten bleiben erhalten", () => assert.deepEqual(columns.map((entry) => entry.name), ["Nr. / Datum / Klasse / Fotos", "Gegenstand – Verortung / Kurztext / Langtext", "Fertig bis / Ampel / Status / Verantwortlich"]));
  await run("M82.4 BBM 03: Tabelle besitzt Viewport und horizontalen Scrollbereich", () => { assert.equal(byId.get("restarbeiten.list.viewport").type, "tableViewport"); assert.equal(byId.get("restarbeiten.list.scrollArea").type, "horizontalScrollArea"); });
  await run("M82.4 BBM 04: Tabellenvertrag ist fachneutral gueltig", () => assert.equal(validateTableLayout(tableEntry.tableLayout).ok, true));
  await run("M82.4 BBM 05: Header und Datenbereiche nutzen dieselbe Breitenquelle", () => assert.equal(validateTableElementBindings(scope.elements).ok, true));
  await run("M82.4 BBM 06: Tabellenkopf, Body, Zeile und Zellen sind direkt registriert", () => ["tableHeader", "tableBody", "tableRow", "tableHeaderCell", "tableDataCell"].forEach((type) => assert.ok(scope.elements.some((entry) => entry.type === type), type)));
  await run("M82.4 BBM 07: bestehende Unterelemente bleiben im Renderer einzeln markiert", () => { const source = read("src/renderer/modules/restarbeiten/RestarbeitenList.js"); assert.match(source, /restarbeiten\.record\.number/); assert.match(source, /restarbeiten\.record\.shortText/); assert.match(source, /restarbeiten\.record\.responsible/); });
  await run("M82.4 BBM 08: keine neue Tabellenansicht wird eingefuehrt", () => assert.match(read("src/renderer/modules/restarbeiten/RestarbeitenMainBody.js"), /buildRestarbeitenList\(options\)/));
  await run("M82.4 BBM 09: Kopf und Datenzeilen verwenden dieselben drei CSS-Variablen", () => { const css = read("src/renderer/modules/restarbeiten/styles/restarbeiten.css"); assert.equal((css.match(/grid-template-columns: var\(--bbm-restarbeiten-number-column\) var\(--bbm-restarbeiten-subject-column\) var\(--bbm-restarbeiten-meta-column\)/g) || []).length, 2); });
  await run("M82.4 BBM 10: sichtbarer Inhaltsbereich begrenzt die Listenbreite", () => assert.match(read("src/renderer/modules/restarbeiten/styles/restarbeiten.css"), /\.bbm-restarbeiten-table-viewport[\s\S]*max-width:\s*100%[\s\S]*overflow:\s*hidden/));
  await run("M82.4 BBM 10a: JavaScript- und WPF-Fingerprint stimmen fuer alle Tabellenrollen ueberein", () => assert.equal(createUiScopeFingerprint(scope), "sha256:caa59d5066b584e6b7a5354156ed269341db52184d1f3f85a645019f92fd8f15"));

  const runtime = await createRuntime(refs, host);
  try {
    await run("M82.4 BBM 11: Laufzeit meldet Viewport und Ueberlauf", () => { const state = refs.snapshotM80State("restarbeiten.list.table"); assert.equal(state.table.viewportWidth, 600); assert.ok(state.table.overflow > 250); });
    await run("M82.4 BBM 11a: Spaltenauswahl meldet dieselbe Tabellengeometrie", () => { const state = refs.snapshotM80State("restarbeiten.list.table.subject"); assert.equal(state.table.viewportWidth, 600); assert.ok(state.table.tableWidth > state.table.viewportWidth); assert.ok(state.table.overflow > 250); });
    await run("M82.4 BBM 12: exakte Breite schaltet die Spalte kontrolliert auf fest", () => { const result = runtime.submit("restarbeiten.list.table.subject", "resizeWidth", { width: 420 }); assert.equal(result.success, true); assert.equal(result.newState.width, 420); assert.equal(result.newState.table.widthMode, "fixed"); });
    await run("M82.4 BBM 13: Kopfbreite stammt aus derselben CSS-Quelle", () => assert.equal(runtime.table.style["--bbm-restarbeiten-subject-column"], "420px"));
    await run("M82.4 BBM 14: Wortumbruch gilt fuer Kopf und Datenbereich", () => { const result = runtime.submit("restarbeiten.list.table.subject", "setColumnWrapMode", { table: { wrapMode: "wordWrap" } }); assert.equal(result.success, true); assert.equal(runtime.headers[1].style.overflowWrap, "break-word"); assert.equal(runtime.cells[1].style.overflowWrap, "break-word"); });
    await run("M82.4 BBM 15: Ellipsis gilt fuer Kopf, Datenbereich und sichtbare Unterelemente", () => { const line = new FakeElement(); runtime.cells[1].children.push(line); runtime.submit("restarbeiten.list.table.subject", "setColumnOverflowMode", { table: { overflowMode: "ellipsis" } }); assert.equal(runtime.headers[1].style.textOverflow, "ellipsis"); assert.equal(runtime.cells[1].style.textOverflow, "ellipsis"); assert.equal(line.style.textOverflow, "ellipsis"); });
    await run("M82.4 BBM 16: Fit ohne bestaetigte Vorschau wird abgewiesen", () => assert.equal(runtime.submit("restarbeiten.list.table", "fitTableToViewport", { table: { strategy: "fit" } }).errorCode, "electron_editor_message_invalid"));
    await run("M82.4 BBM 17: Fit mit bestaetigter Vorschau begrenzt auf den Viewport", () => { runtime.submit("restarbeiten.list.table.subject", "resetTableColumn", { table: {} }); const result = runtime.submit("restarbeiten.list.table", "fitTableToViewport", { table: { strategy: "fit", previewAccepted: true } }); assert.equal(result.success, true); assert.ok(result.newState.table.overflow <= 0.5); });
    await run("M82.4 BBM 18: flexible Hauptspalte traegt den Fit vor festen Spalten", () => { assert.equal(refs.snapshotM80State("restarbeiten.list.table.number").width, 82); assert.equal(refs.snapshotM80State("restarbeiten.list.table.meta").width, 172); });
    await run("M82.4 BBM 19: horizontaler Scrollmodus bleibt explizit steuerbar", () => { const result = runtime.submit("restarbeiten.list.table", "setHorizontalOverflowMode", { table: { horizontalOverflowMode: "scroll" } }); assert.equal(result.success, true); assert.equal(runtime.scrollArea.style.overflowX, "scroll"); });
    await run("M82.4 BBM 20: ungueltiger Modus wird ohne Zustandsaenderung abgewiesen", () => { const before = refs.snapshotM80State("restarbeiten.list.table.subject"); const result = runtime.submit("restarbeiten.list.table.subject", "setColumnWidthMode", { table: { widthMode: "domain" } }); assert.equal(result.success, false); assert.deepEqual(refs.snapshotM80State("restarbeiten.list.table.subject").table, before.table); });
    await run("M82.4 BBM 21: Spaltenreset stellt Breiten- und Textmodus wieder her", () => { const result = runtime.submit("restarbeiten.list.table.subject", "resetTableColumn", { table: {} }); assert.equal(result.success, true); assert.equal(result.newState.table.widthMode, "proportional"); assert.equal(result.newState.table.wrapMode, "wordWrap"); assert.equal(result.newState.table.overflowMode, "clip"); });
    await run("M82.4 BBM 22: Tabellenreset stellt alle drei Spalten und Tabellenmodi wieder her", () => { const result = runtime.submit("restarbeiten.list.table", "resetTable", { table: {} }); assert.equal(result.success, true); assert.equal(result.affectedStates.length, 3); assert.equal(result.newState.table.horizontalOverflowMode, "auto"); assert.equal(result.newState.table.rowHeightMode, "bounded"); });
    await run("M82.4 BBM 22a: interaktiver Tabellenreset vertraut der validierten Ziel-App-Baseline", () => { runtime.table._rect.width = 1224; const result = runtime.submit("restarbeiten.list.table", "resetTable", { table: {} }, "interactive-table-reset", "ui-editor-panel"); assert.equal(result.success, true); assert.equal(result.errorCode, null); assert.equal(result.affectedStates.length, 3); assert.equal(refs.snapshotM80State("restarbeiten.list.table.subject").table.wrapMode, "wordWrap"); });
    await run("M82.4 BBM 22b: interaktiver Fit nutzt die bestaetigte Tabellenvorschau", () => { runtime.table._rect.width = 1224; const result = runtime.submit("restarbeiten.list.table", "fitTableToViewport", { table: { strategy: "fitViewport", previewAccepted: true } }, "interactive-table-fit", "ui-editor-panel"); assert.equal(result.success, true); assert.equal(result.errorCode, null); assert.ok(result.newState.table.overflow <= 0.5); });
    await run("M82.4 BBM 23: Start-Restore erzeugt nur explizite Tabellenmodus-Requests", () => { const requests = host.createM80StartupRequests("restarbeiten.list.root", { elementId: "restarbeiten.list.table.subject", width: 360, table: { tableId: "restarbeiten.list.table", columnId: "restarbeiten.list.table.subject", widthMode: "fixed", wrapMode: "ellipsis", overflowMode: "ellipsis" } }); assert.ok(requests.some((item) => item.request.operation === "resizeWidth")); assert.ok(requests.some((item) => item.request.operation === "setColumnWrapMode")); assert.ok(requests.some((item) => item.request.operation === "setColumnOverflowMode")); });
    await run("M82.4 BBM 24: Tabellenpayload enthaelt keine Fachwertfelder", () => {
      const keys = [];
      const visit = (value) => { if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === "object") Object.entries(value).forEach(([key, nested]) => { keys.push(key); visit(nested); }); };
      visit(tableEntry.tableLayout);
      assert.equal(keys.some((key) => ["recordId", "domainData", "businessData", "dueDateValue", "responsibleValue", "photos", "rows", "values"].includes(key)), false);
    });
  } finally {
    runtime.cleanup();
  }
}

module.exports = { runM824BbmTableColumnEditingTests };
