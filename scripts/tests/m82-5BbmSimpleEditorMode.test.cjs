"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");

class FakeElement {
  constructor(width = 180, height = 28) {
    this.attributes = {}; this.dataset = {}; this.className = ""; this.isConnected = true;
    this.children = [];
    this._rect = { left: 0, top: 0, width, height };
    this.style = { setProperty(name, value) { this[name] = value; }, getPropertyValue(name) { return this[name] || ""; } };
    this.classList = { contains: () => false, toggle: () => {} };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  appendChild(value) { this.children.push(value); return value; }
  replaceChildren(...values) { this.children = values; }
  getBoundingClientRect() { const width = typeof this._widthSource === "function" ? this._widthSource() : parseFloat(this.style.width); const left = typeof this._leftSource === "function" ? this._leftSource() : this._rect.left; return { ...this._rect, left, width: Number.isFinite(width) ? width : this._rect.width, height: parseFloat(this.style.height) || this._rect.height }; }
}

async function runM825BbmSimpleEditorModeTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
  const scope = registry.listM80RegistryScopes().find((entry) => entry.scopeId === "restarbeiten.list.root");
  const byId = new Map(scope.elements.map((entry) => [entry.id, entry]));
  const headerIds = ["number", "subject", "meta"].map((name) => `restarbeiten.list.table.${name}.header`);

  await run("M82.5 BBM 01: drei sichtbare Tabellenüberschriften bleiben registriert", () => assert.equal(headerIds.filter((id) => byId.has(id)).length, 3));
  await run("M82.5 BBM 02: jede Überschrift folgt dem universellen Textvertrag", () => headerIds.forEach((id) => assert.deepEqual(byId.get(id).allowedOps, ["move", "resizeWidth", "resizeHeight", "setVisibility", "textResize"])));
  await run("M82.5 BBM 03: Überschriften bleiben Kinder ihrer bestätigten Hauptspalte", () => headerIds.forEach((id) => assert.equal(byId.get(id).parentId, id.slice(0, -".header".length))));
  await run("M82.5 BBM 04: sichtbare Tabellenköpfe sind direkt in der Breite editierbar", () => headerIds.forEach((id) => assert.equal(byId.get(id).allowedOps.includes("resizeWidth"), true)));
  await run("M82.5 BBM 05: drei bestätigte Spaltennamen bleiben unverändert", () => assert.deepEqual(scope.elements.filter((entry) => entry.type === "tableColumn").map((entry) => entry.name), ["Nr. / Datum / Klasse / Fotos", "Gegenstand – Verortung / Kurztext / Langtext", "Fertig bis / Ampel / Status / Verantwortlich"]));

  const previous = { document: global.document, window: global.window, Element: global.Element };
  global.Element = FakeElement;
  const body = new FakeElement();
  let riskOverlay = null;
  global.document = {
    body,
    querySelector: (selector) => selector === "[data-bbm-ui-editor-risk-preview]" ? riskOverlay : null,
    createElement: () => { const value = new FakeElement(); const original = value.setAttribute.bind(value); value.setAttribute = (name, entry) => { original(name, entry); if (name === "data-bbm-ui-editor-risk-preview") riskOverlay = value; }; return value; },
    addEventListener() {}, removeEventListener() {},
  };
  global.window = { getComputedStyle: (element) => ({ ...element.style, width: `${element._rect.width}px`, height: `${element._rect.height}px`, paddingLeft: "0px", paddingTop: "0px", fontSize: element.style.fontSize || "12px" }), dispatchEvent() {} };
  refs.resetM80PilotWorkingStatesForDiagnostic();
  refs.beginM80PilotRender();
  const root = new FakeElement(900, 700);
  const table = new FakeElement(718, 680);
  const tableHeaders = [new FakeElement(82, 28), new FakeElement(464, 28), new FakeElement(172, 28)];
  const cells = [new FakeElement(82, 80), new FakeElement(464, 80), new FakeElement(172, 80)];
  const variables = ["--bbm-restarbeiten-number-column", "--bbm-restarbeiten-subject-column", "--bbm-restarbeiten-meta-column"];
  tableHeaders.forEach((element, index) => { element._widthSource = () => parseFloat(table.style[variables[index]]) || element._rect.width; });
  tableHeaders[1]._leftSource = () => tableHeaders[0].getBoundingClientRect().width;
  tableHeaders[2]._leftSource = () => tableHeaders[0].getBoundingClientRect().width + tableHeaders[1].getBoundingClientRect().width;
  cells.forEach((element, index) => { element._widthSource = tableHeaders[index]._widthSource; element._leftSource = tableHeaders[index]._leftSource; });
  refs.registerM80Ref("restarbeiten.list.root", root);
  refs.registerM80TableRef("restarbeiten.list.table", table, table);
  ["number", "subject", "meta"].forEach((key, index) => refs.registerM80TableColumnRef(
    `restarbeiten.list.table.${key}`, tableHeaders[index], [cells[index]], table, table, variables[index], tableHeaders[index]._rect.width));
  const header = tableHeaders[1];
  refs.completeM80PilotRender();
  try {
    await run("M82.5 BBM 06: Direktauswahl markiert die verständliche Überschrift", () => assert.equal(header.attributes["data-ui-inspector-id"], "restarbeiten.list.table.subject.header"));
    const result = host.handleM80EditorRequest({
      action: "submitChange", scopeId: "restarbeiten.list.root",
      changeRequest: { changeId: "m82-5-header-font", elementId: "restarbeiten.list.table.subject.header", operation: "textResize", payload: { text: { fontSize: 18 } }, source: "target-app-start" },
    }).changeResult;
    await run("M82.5 BBM 07: Überschrift nimmt direkte Schriftgröße an", () => { assert.equal(result.success, true); assert.equal(header.style.fontSize, "18px"); });
    await run("M82.5 BBM 08: Schriftänderung verändert keine Spaltenbreite", () => assert.equal(header.getBoundingClientRect().width, 464));
    await run("M82.5 BBM 09: Rücklesung liefert die neue Schriftgröße", () => assert.equal(refs.snapshotM80State("restarbeiten.list.table.subject.header").fontSize, 18));
    await run("M82.5 BBM 10: Änderung enthält keine Fachwerte", () => assert.equal(["recordId", "dueDate", "responsible", "status"].some((key) => key in result.newState), false));
    const request = { changeId: "m82-5-confirmed-width", elementId: "restarbeiten.list.table.subject", operation: "resizeWidth", payload: { width: 369 }, source: "ui-editor-panel" };
    const first = host.handleM80EditorRequest({ action: "submitChange", scopeId: "restarbeiten.list.root", changeRequest: request }).changeResult;
    const confirmed = host.handleM80EditorRequest({
      action: "submitChange", scopeId: "restarbeiten.list.root", changeRequest: request,
      editMode: "free", riskConfirmation: { operationId: first.geometryRisk?.operationId, action: "reflowNeighbors" },
    }).changeResult;
    await run("M82.5 BBM 11: identische Breitenänderung wird nach Risikobestätigung angewandt", () => {
      assert.equal(first.errorCode, "geometry_risk_confirmation_required");
      assert.equal(first.geometryRisk.riskType, "freedSpace");
      assert.equal(confirmed.success, true, JSON.stringify(confirmed));
      assert.equal(confirmed.newState.width, 369);
      assert.equal(refs.snapshotM80State("restarbeiten.list.table.number").width, 82);
      assert.equal(refs.snapshotM80State("restarbeiten.list.table.meta").width, 172);
    });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    global.document = previous.document; global.window = previous.window; global.Element = previous.Element;
  }
}

module.exports = { runM825BbmSimpleEditorModeTests };
