"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

class FakeElement {
  constructor(rect = {}) {
    this.attributes = new Map();
    this.children = [];
    this.parentElement = null;
    this.isConnected = true;
    this.dataset = {};
    this.className = "";
    this.style = {
      setProperty(name, value) { this[name] = value; },
      getPropertyValue(name) { return this[name] || ""; },
    };
    this._rect = { left: 0, top: 0, width: 320, height: 120, ...rect };
    this.classList = { contains: () => false, toggle: () => {} };
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  removeAttribute(name) { this.attributes.delete(name); }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  replaceChildren(...children) { this.children.forEach((child) => { child.parentElement = null; }); this.children = []; children.forEach((child) => this.appendChild(child)); }
  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
    this.isConnected = false;
  }
  contains(candidate) { return candidate === this || this.children.some((child) => child.contains?.(candidate)); }
  getBoundingClientRect() {
    const width = Number.parseFloat(this.style.width);
    const height = Number.parseFloat(this.style.height);
    const left = Number(this._rect.left);
    const top = Number(this._rect.top);
    const resolvedWidth = Number.isFinite(width) ? width : this._rect.width;
    const resolvedHeight = Number.isFinite(height) ? height : this._rect.height;
    return { left, top, width: resolvedWidth, height: resolvedHeight, right: left + resolvedWidth, bottom: top + resolvedHeight };
  }
}

function walk(root) { return [root, ...root.children.flatMap(walk)]; }
function attributeFromSelector(selector) { return /^\[([^=\]]+)/.exec(selector.trim())?.[1] || ""; }

function createDocument() {
  const body = new FakeElement({ width: 1600, height: 900 });
  const listeners = new Map();
  const matches = (selector) => walk(body).filter((element) => element.getAttribute(attributeFromSelector(selector)) !== null);
  return {
    body,
    listeners,
    createElement: () => new FakeElement(),
    querySelector: (selector) => matches(selector)[0] || null,
    querySelectorAll: (selector) => [...new Set(selector.split(",").flatMap((part) => matches(part)))],
    addEventListener: (type, handler) => listeners.set(type, handler),
    removeEventListener: (type, handler) => { if (listeners.get(type) === handler) listeners.delete(type); },
  };
}

function addTransientMarker(document, attribute, outline, boxShadow, rect = {}) {
  const element = new FakeElement(rect);
  element.setAttribute(attribute, "true");
  element.style.outline = outline;
  element.style.boxShadow = boxShadow;
  document.body.appendChild(element);
  return element;
}

async function runM8622EditorMarkerCleanupTests(run) {
  const hostSource = read("src/renderer/ui-editor/m80HostAdapter.js");
  const refsSource = read("src/renderer/ui-editor/m80Refs.js");
  const bridgeSource = read("src/renderer/ui-editor/m80Bridge.js");

  await run("M86.22 01: Auswahl-, Hover- und Komponentenmarker sind nur transiente Editorzustaende", () => {
    assert.match(refsSource, /data-ui-editor-selected/);
    assert.match(refsSource, /data-ui-editor-hover/);
    assert.match(refsSource, /data-ui-editor-hovered/);
    assert.match(refsSource, /data-ui-editor-component/);
    assert.match(hostSource, /data-bbm-ui-editor-overlay/);
  });

  await run("M86.22 02: Diagnosemarker werden nur fuer eine interaktive Editorsitzung angezeigt", () => {
    assert.match(hostSource, /const risk = \(interactive \|\| unvalidatedStartupRequest\)[\s\S]*if \(risk\?\.hasRisks && !confirmation\)[\s\S]*if \(interactive\) \{\s*pendingGeometryRisks\.set\([\s\S]*renderGeometryRiskPreview\(risk\);\s*\}/);
  });

  await run("M86.22 03: derselbe zentrale Cleanup ist an Start, Close, Modul-, Projekt- und Unload-Lebenszyklus gebunden", () => {
    assert.match(bridgeSource, /installBbmM80EditorBridge[\s\S]*clearM80EditorInteraction\(\)/);
    assert.match(bridgeSource, /bbm:router-context", clearM80EditorInteraction/);
    assert.match(bridgeSource, /beforeunload", clearM80EditorInteraction/);
    assert.match(hostSource, /action === "editorClosed"[\s\S]*clearM80VisualState\(\)/);
    assert.match(hostSource, /export function clearM80EditorInteraction\(\)[\s\S]*clearGeometryRiskPreview\(\); clearM80VisualState\(\)/);
    assert.doesNotMatch(bridgeSource, /restarbeiten\.|protokoll\./);
  });

  const previous = { document: global.document, window: global.window, Element: global.Element };
  const document = createDocument();
  global.document = document;
  global.Element = FakeElement;
  global.window = {
    innerWidth: 1600,
    innerHeight: 900,
    getComputedStyle: (element) => ({
      ...element.style,
      display: element.style.display || "block",
      visibility: element.style.visibility || "visible",
      width: element.style.width || `${element.getBoundingClientRect().width}px`,
      height: element.style.height || `${element.getBoundingClientRect().height}px`,
      paddingLeft: "0px",
      paddingTop: "0px",
      fontSize: element.style.fontSize || "13px",
      boxSizing: "border-box",
    }),
    dispatchEvent() {},
  };

  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));

  try {
    await run("M86.22 04: Editor-Schliessen entfernt Auswahl, Hover, Komponentenrahmen und Diagnoseoverlay", () => {
      const selected = addTransientMarker(document, "data-ui-editor-selected", "2px solid #2563eb", "0 0 0 4px rgb(37 99 235 / 18%)");
      const hovered = addTransientMarker(document, "data-ui-editor-hovered", "1px dashed #0ea5e9", "0 0 0 3px rgb(14 165 233 / 14%)");
      const component = addTransientMarker(document, "data-ui-editor-component", "", "");
      const productive = new FakeElement();
      productive.style.outline = "1px solid #b42318";
      productive.style.border = "1px solid #c8d0dc";
      document.body.appendChild(productive);

      const selectionOverlay = new FakeElement();
      selectionOverlay.setAttribute("data-bbm-ui-editor-overlay", "true");
      const componentFrame = new FakeElement();
      componentFrame.setAttribute("data-selection-level", "Gruppe");
      selectionOverlay.appendChild(componentFrame);
      document.body.appendChild(selectionOverlay);
      const diagnosticOverlay = new FakeElement();
      diagnosticOverlay.setAttribute("data-bbm-ui-editor-risk-preview", "true");
      diagnosticOverlay.appendChild(new FakeElement());
      document.body.appendChild(diagnosticOverlay);

      host.handleM80EditorEvent({ action: "editorClosed", disposition: "saved" });

      assert.equal(document.querySelector("[data-bbm-ui-editor-overlay]"), null);
      assert.equal(document.querySelector("[data-bbm-ui-editor-risk-preview]"), null);
      [selected, hovered, component].forEach((element) => {
        assert.equal(element.getAttribute("data-ui-editor-selected"), null);
        assert.equal(element.getAttribute("data-ui-editor-hovered"), null);
        assert.equal(element.getAttribute("data-ui-editor-component"), null);
      });
      assert.equal(selected.style.outline, "");
      assert.equal(hovered.style.boxShadow, "");
      assert.equal(productive.style.outline, "1px solid #b42318");
      assert.equal(productive.style.border, "1px solid #c8d0dc");
    });

    await run("M86.22 05: normaler Neustart beginnt ohne verwaiste Markierungen", () => {
      const orphan = addTransientMarker(document, "data-ui-editor-hover", "1px dashed #0ea5e9", "0 0 0 3px rgb(14 165 233 / 14%)");
      const diagnosticOverlay = new FakeElement();
      diagnosticOverlay.setAttribute("data-bbm-ui-editor-risk-preview", "true");
      document.body.appendChild(diagnosticOverlay);
      host.clearM80EditorInteraction();
      assert.equal(orphan.getAttribute("data-ui-editor-hover"), null);
      assert.equal(document.querySelector("[data-bbm-ui-editor-risk-preview]"), null);
    });

    await run("M86.22 06: gespeicherte Geometrie bleibt beim Cleanup erhalten", () => {
      refs.resetM80PilotWorkingStatesForDiagnostic();
      refs.beginM80PilotRender();
      const element = new FakeElement({ width: 900, height: 248 });
      element.style.width = "940px";
      element.style.height = "272px";
      element.style.fontSize = "15px";
      element.setAttribute("data-ui-editor-selected", "true");
      document.body.appendChild(element);
      refs.registerM80Ref("restarbeiten.edit.root", element);
      const before = refs.snapshotM80State("restarbeiten.edit.root");
      host.clearM80EditorInteraction();
      const after = refs.snapshotM80State("restarbeiten.edit.root");
      assert.deepEqual({ width: after.width, height: after.height, fontSize: after.fontSize }, { width: before.width, height: before.height, fontSize: before.fontSize });
      const persistedShape = JSON.stringify(after);
      assert.doesNotMatch(persistedShape, /selected|hover|component|outline|border|boxShadow|diagnostic/i);
    });

    await run("M86.22 07: Restarbeiten und Protokoll verwenden denselben ID-neutralen Cleanup-Weg", () => {
      const rest = addTransientMarker(document, "data-ui-editor-selected", "2px solid #2563eb", "0 0 0 4px rgb(37 99 235 / 18%)");
      rest.setAttribute("data-ui-editor-id", "restarbeiten.edit.short.label");
      const protocol = addTransientMarker(document, "data-ui-editor-hovered", "1px dashed #0ea5e9", "0 0 0 3px rgb(14 165 233 / 14%)");
      protocol.setAttribute("data-ui-editor-id", "protokoll.list.row.short");
      host.clearM80EditorInteraction();
      assert.equal(rest.getAttribute("data-ui-editor-selected"), null);
      assert.equal(protocol.getAttribute("data-ui-editor-hovered"), null);
    });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    global.document = previous.document;
    global.window = previous.window;
    global.Element = previous.Element;
  }
}

module.exports = { runM8622EditorMarkerCleanupTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runM8622EditorMarkerCleanupTests(run).then(() => { if (failed) process.exitCode = 1; }).catch((error) => { process.exitCode = 1; console.error(error?.stack || error); });
}
