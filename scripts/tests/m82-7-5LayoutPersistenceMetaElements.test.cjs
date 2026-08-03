"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

class FakeElement {
  constructor(tagName = "DIV", width = 100, height = 24) {
    this.tagName = tagName.toUpperCase(); this.attributes = {}; this.dataset = {}; this.className = "";
    this.parentElement = null; this.children = []; this.isConnected = true; this.hidden = false;
    this._rect = { left: 0, top: 0, width, height };
    this.style = { setProperty(name, value) { this[name] = value; }, getPropertyValue(name) { return this[name] || ""; } };
    this.classList = {
      contains: (name) => this.className.split(/\s+/).includes(name),
      toggle: (name, active) => { const names = new Set(this.className.split(/\s+/).filter(Boolean)); if (active) names.add(name); else names.delete(name); this.className = [...names].join(" "); },
    };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); if (name === "data-ui-editor-id") this.dataset.uiEditorId = String(value); }
  getAttribute(name) { return this.attributes[name] || null; }
  addEventListener() {}
  append(...children) { children.forEach((child) => { child.parentElement = this; this.children.push(child); }); }
  appendChild(child) { this.append(child); return child; }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  getBoundingClientRect() {
    const width = Number.parseFloat(this.style.width) || this._rect.width;
    const height = Number.parseFloat(this.style.height) || this._rect.height;
    return { left: this._rect.left, top: this._rect.top, width, height, right: this._rect.left + width, bottom: this._rect.top + height };
  }
}

function computedStyle(element) {
  const rect = element.getBoundingClientRect();
  return { ...element.style, display: element.style.display || "", width: `${rect.width}px`, height: `${rect.height}px`, paddingLeft: element.style.paddingLeft || "0px", paddingTop: element.style.paddingTop || "0px", fontSize: element.style.fontSize || "10.667px", boxSizing: "border-box" };
}

async function runM8275LayoutPersistenceMetaElementsTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
  const listModule = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/restarbeiten/RestarbeitenList.js"));
  const scope = registry.listM80RegistryScopes().find((item) => item.scopeId === "restarbeiten.list.root");
  const byId = new Map(scope.elements.map((entry) => [entry.id, entry]));
  const headerIds = ["restarbeiten.main.tableHeader.dueDate", "restarbeiten.main.tableHeader.status", "restarbeiten.main.tableHeader.responsible"];
  const rowIds = ["restarbeiten.record.dueDate", "restarbeiten.record.ampel", "restarbeiten.record.status", "restarbeiten.record.responsible"];
  const previous = { document: global.document, window: global.window, Element: global.Element, CustomEvent: global.CustomEvent };
  const body = new FakeElement("BODY", 1600, 900);
  global.Element = FakeElement;
  global.CustomEvent = class { constructor(type) { this.type = type; } };
  global.document = { body, createElement: (tag) => new FakeElement(tag), querySelector: () => null, addEventListener() {}, removeEventListener() {} };
  global.window = { getComputedStyle: computedStyle, dispatchEvent() {}, uiEditor: {} };

  try {
    await run("M82.7.5 BBM 01: Registryversion kennzeichnet den erweiterten Vertrag", () => assert.equal(registry.BBM_M80_REGISTRY_VERSION, 17));
    await run("M82.7.5 BBM 02: Listenscope enthaelt den vollstaendigen Komponentenvertrag", () => assert.equal(scope.elements.length, 32));
    await run("M82.7.5 BBM 03: alle bestaetigten stabilen IDs sind exakt registriert", () => [...headerIds, ...rowIds].forEach((id) => assert.ok(byId.has(id), id)));
    await run("M82.7.5 BBM 04: Header-Kinder besitzen den existierenden Meta-Header als Parent", () => headerIds.forEach((id) => assert.equal(byId.get(id).parentId, "restarbeiten.list.table.meta.header")));
    await run("M82.7.5 BBM 05: Zeilenkinder besitzen den existierenden Meta-Datenbereich als Parent", () => rowIds.forEach((id) => assert.equal(byId.get(id).parentId, "restarbeiten.list.table.meta.cells")));
    await run("M82.7.5 BBM 06: Headertexte erlauben nur Move, Textgroesse und Sichtbarkeit", () => headerIds.forEach((id) => assert.deepEqual(byId.get(id).allowedOps, ["move", "textResize", "setVisibility"])));
    await run("M82.7.5 BBM 07: Zeilentexte verwenden denselben generischen Textvertrag", () => [rowIds[0], rowIds[2], rowIds[3]].forEach((id) => assert.deepEqual(byId.get(id).allowedOps, ["move", "textResize", "setVisibility"])));
    await run("M82.7.5 BBM 08: Listenampel bleibt generisch beweglich, skalierbar und sichtbar", () => assert.deepEqual(byId.get(rowIds[1]).allowedOps, ["move", "resizeWidth", "resizeHeight", "setVisibility"]));
    await run("M82.7.5 BBM 09: Baselines und Grenzen sind explizit", () => { assert.deepEqual([byId.get(headerIds[0]).baseline.fontSize, byId.get(headerIds[0]).baseline.minFontSize, byId.get(headerIds[0]).baseline.maxFontSize], [8.667, 6, 24]); assert.deepEqual([byId.get(rowIds[1]).baseline.width, byId.get(rowIds[1]).baseline.height], [12, 12]); });

    const header = listModule.buildRestarbeitenTableHeader();
    const records = listModule.buildRestarbeitenList({ items: [{ id: 1, numberLine: "1", dateLine: "01.01.26", itemClassLabel: "Rest", locationLine: "A", shortTextLine: "Kurz", longTextLine: "Lang", dueDateLabel: "02.01.26", ampelState: "green", statusLabel: "offen", responsibleLabel: "B" }, { id: 2, numberLine: "2", dateLine: "01.01.26", itemClassLabel: "Mangel", locationLine: "C", shortTextLine: "Kurz", longTextLine: "Lang", dueDateLabel: "03.01.26", ampelState: "red", statusLabel: "offen", responsibleLabel: "D" }] });
    await run("M82.7.5 BBM 10: vorhandene Header-DOM-Knoten werden inventarisiert", () => assert.deepEqual(Object.keys(header._m80MetaHeaderParts), ["dueDate", "status", "responsible"]));
    await run("M82.7.5 BBM 11: vorhandene Zeilen-DOM-Knoten werden ohne Wrapper inventarisiert", () => assert.deepEqual(Object.fromEntries(["dueDate", "ampel", "status", "responsible"].map((key) => [key, records._m83ComponentParts[key].length])), { dueDate: 2, ampel: 2, status: 2, responsible: 2 }));
    await run("M82.7.5 BBM 12: Renderer erzeugt keine neue Tabellenansicht", () => { const source = read("src/renderer/modules/restarbeiten/RestarbeitenList.js"); assert.doesNotMatch(source, /m82-7-5|meta-wrapper|editor-wrapper/i); });
    await run("M82.7.5 BBM 13: Header- und Zeileninventar enthalten keine Fachwert-IDs", () => [...Object.values(header._m80MetaHeaderParts), ...Object.values(records._m83ComponentParts).flat()].forEach((element) => assert.doesNotMatch(element.getAttribute("data-ui-editor-id") || "", /\b\d+\b|green|red|offen/)));

    refs.resetM80PilotWorkingStatesForDiagnostic(); refs.beginM80PilotRender();
    const fallback = new FakeElement("DIV", 172, 100);
    const due = [new FakeElement("DIV", 80, 16), new FakeElement("DIV", 80, 16)];
    const ampel = [new FakeElement("SPAN", 12, 12), new FakeElement("SPAN", 12, 12)];
    const status = [new FakeElement("DIV", 60, 16), new FakeElement("DIV", 60, 16)];
    const responsible = [new FakeElement("DIV", 90, 16), new FakeElement("DIV", 90, 16)];
    refs.registerM80MultiRef(rowIds[0], due, fallback);
    refs.registerM80MultiRef(rowIds[1], ampel, fallback);
    refs.registerM80MultiRef(rowIds[2], status, fallback);
    refs.registerM80MultiRef(rowIds[3], responsible, fallback);
    refs.completeM80PilotRender();
    await run("M82.7.5 BBM 14: Fertig-bis-Multiref bindet alle vorhandenen Ziele", () => assert.deepEqual(refs.getM80Ref(rowIds[0]).targets, due));
    await run("M82.7.5 BBM 15: Ampel-Multiref bindet alle vorhandenen Ziele", () => assert.deepEqual(refs.getM80Ref(rowIds[1]).targets, ampel));
    await run("M82.7.5 BBM 16: Status-Multiref bindet alle vorhandenen Ziele", () => assert.deepEqual(refs.getM80Ref(rowIds[2]).targets, status));
    await run("M82.7.5 BBM 17: Verantwortlich-Multiref bindet alle vorhandenen Ziele", () => assert.deepEqual(refs.getM80Ref(rowIds[3]).targets, responsible));
    await run("M82.7.5 BBM 18: direkte Auswahl liefert zuerst das exakte logische Kind", () => assert.equal(refs.getM80IdFromTarget(due[1]), rowIds[0]));
    await run("M82.7.5 BBM 19: allgemeiner Move-Weg wirkt auf alle Wiederholungen", () => { refs.applyM80State(rowIds[0], { ...refs.snapshotM80State(rowIds[0]), x: 5 }, "move"); due.forEach((element) => assert.equal(element.style.translate, "5px 0px")); });
    await run("M82.7.5 BBM 20: allgemeiner textResize-Weg wirkt auf alle Wiederholungen", () => { refs.applyM80State(rowIds[2], { ...refs.snapshotM80State(rowIds[2]), fontSize: 14 }, "textResize"); status.forEach((element) => assert.equal(element.style.fontSize, "14px")); });
    await run("M82.7.5 BBM 21: allgemeiner Sichtbarkeitsweg wirkt auf alle Wiederholungen", () => { refs.applyM80State(rowIds[3], { ...refs.snapshotM80State(rowIds[3]), visible: false }, "setVisibility"); responsible.forEach((element) => assert.equal(element.classList.contains("bbm-ui-editor-hidden"), true)); });
    await run("M82.7.5 BBM 22: Multiref bleibt bei leerer Liste logisch aufgeloest", () => { refs.beginM80PilotRender(); refs.registerM80MultiRef(rowIds[0], [], fallback); refs.completeM80PilotRender(); assert.equal(refs.getM80ReferenceStatus(rowIds[0]).referenceResolved, true); });
    await run("M82.7.5 BBM 23: Fallback-Container wird nicht faelschlich als Kind auswaehlbar", () => assert.equal(refs.getM80IdFromTarget(fallback), null));

    refs.beginM80PilotRender(); refs.registerM80MultiRef(rowIds[0], due, fallback); refs.completeM80PilotRender();
    host.handleM80EditorRequest({ action: "getRegistry" });
    refs.applyM80State(rowIds[0], { ...refs.snapshotM80State(rowIds[0]), x: 10 }, "move");
    await run("M82.7.5 BBM 24: gespeichertes Sitzungsende behaelt die angewendete Aenderung", () => { const result = host.handleM80EditorEvent({ action: "editorClosed", disposition: "saved" }); assert.equal(result.restoredElementCount, 0); assert.equal(refs.snapshotM80State(rowIds[0]).x, 10); });
    host.handleM80EditorRequest({ action: "getRegistry" }); refs.applyM80State(rowIds[0], { ...refs.snapshotM80State(rowIds[0]), x: 15 }, "move");
    await run("M82.7.5 BBM 25: sauberes Sitzungsende behaelt den aktuellen gespeicherten Zustand", () => { host.handleM80EditorEvent({ action: "editorClosed", disposition: "clean" }); assert.equal(refs.snapshotM80State(rowIds[0]).x, 15); });
    host.handleM80EditorRequest({ action: "getRegistry" }); refs.applyM80State(rowIds[0], { ...refs.snapshotM80State(rowIds[0]), x: 20 }, "move");
    await run("M82.7.5 BBM 26: Ohne Speichern stellt exakt die Oeffnungsgrenze wieder her", () => { const result = host.handleM80EditorEvent({ action: "editorClosed", disposition: "discarded" }); assert.ok(result.restoredElementCount > 0); assert.equal(refs.snapshotM80State(rowIds[0]).x, 15); });
    host.handleM80EditorRequest({ action: "getRegistry" }); refs.applyM80State(rowIds[0], { ...refs.snapshotM80State(rowIds[0]), x: 25 }, "move");
    await run("M82.7.5 BBM 27: unbekannter Prozessabbruch verwirft nicht eigenmaechtig", () => { host.handleM80EditorEvent({ action: "editorClosed", disposition: "invalid" }); assert.equal(refs.snapshotM80State(rowIds[0]).x, 25); });
    await run("M82.7.5 BBM 28: Sitzungsgrenze wird nach Close immer geloescht", () => assert.equal(host.getM80InteractionStatus().editorSessionBoundaryElementCount, 0));
    await run("M82.7.5 BBM 29: Rerender wendet den gespeicherten Arbeitszustand auf neue Knoten an", () => { const rerendered = [new FakeElement("DIV", 80, 16), new FakeElement("DIV", 80, 16)]; refs.beginM80PilotRender(); refs.registerM80MultiRef(rowIds[0], rerendered, fallback); refs.completeM80PilotRender(); assert.equal(rerendered[0].style.translate, "25px 0px"); assert.equal(rerendered[1].style.translate, "25px 0px"); });
    await run("M82.7.5 BBM 30: Startup-Restore erzeugt den generischen Delta-Request", () => { const requests = host.createM80StartupRequests("restarbeiten.list.root", { ...refs.snapshotM80State(rowIds[0]), x: 30 }); assert.deepEqual(requests.map((item) => item.request.operation), ["move"]); });
    const sessionSource = read("src/main/ui-editor/electronUiEditorSession.js");
    await run("M82.7.5 BBM 31: natives editorClosed wird nicht vor der Disposal-Kette doppelt weitergereicht", () => assert.match(sessionSource, /if \(action === "editorClosed"\) \{[\s\S]*#disposeSession\("editor_closed", false, message\.payload\);[\s\S]*return;/));
    await run("M82.7.5 BBM 32: zerstoertes Fenster oder WebContents wird beim Close nicht beschrieben", () => {
      const windowGuard = sessionSource.indexOf("if (window && !window.isDestroyed?.())");
      const webContentsAccess = sessionSource.indexOf("const webContents = window.webContents;", windowGuard);
      const webContentsGuard = sessionSource.indexOf("if (webContents && !webContents.isDestroyed?.())", webContentsAccess);
      assert.ok(windowGuard >= 0);
      assert.ok(webContentsAccess > windowGuard);
      assert.ok(webContentsGuard > webContentsAccess);
    });
    await run("M82.7.5 BBM 33: Registry und Multi-Ref-Weg enthalten keine Fachwerte", () => { const source = read("src/renderer/ui-editor/m80Registry.js") + read("src/renderer/ui-editor/m80Refs.js"); assert.doesNotMatch(source, /data-bbm-restarbeiten-record-id|item\.dueDate|item\.responsible|app\.db/); });
    await run("M82.7.5 BBM 34: licensing-Dokumentation behaelt den Schutz-Hash", () => { const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, "docs/licensing.md"))).digest("hex").toUpperCase(); assert.equal(hash, "02AE66A8873C74869539F13F734B7CE43BC63B6EF37DA553A40C27A4F514D784"); });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    global.document = previous.document; global.window = previous.window; global.Element = previous.Element; global.CustomEvent = previous.CustomEvent;
  }
}

module.exports = { runM8275LayoutPersistenceMetaElementsTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM8275LayoutPersistenceMetaElementsTests(run).then(() => { if (failed) process.exitCode = 1; }).catch((error) => { process.exitCode = 1; console.error(error?.stack || error); });
}
