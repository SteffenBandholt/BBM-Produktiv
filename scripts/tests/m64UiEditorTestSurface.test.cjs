const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { getBbmUiElementRegistry } = require("../../src/ui-editor/bbm-ui-element-registry.cjs");

const REPO_ROOT = path.join(__dirname, "../..");
const PANEL_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
const REFS_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js");

const M64_ELEMENTS = [
  ["bbm.uiEditorTest.workspace", "UI-Editor-Testfläche", "root", null, false, [], ["move", "resize", "hide", "delete"]],
  ["bbm.uiEditorTest.card", "Testkarte", "container", "bbm.uiEditorTest.workspace", true, ["move", "resize"], ["delete"]],
  ["bbm.uiEditorTest.card.title", "Überschrift", "text", "bbm.uiEditorTest.card", true, ["move", "resize"], ["delete", "execute"]],
  ["bbm.uiEditorTest.card.text", "Beispieltext", "text", "bbm.uiEditorTest.card", true, ["move", "resize"], ["delete", "execute"]],
  ["bbm.uiEditorTest.card.button", "Beispielbutton", "action", "bbm.uiEditorTest.card", true, ["move", "resize"], ["execute", "delete"]],
  ["bbm.uiEditorTest.card.input", "Eingabefeld", "field", "bbm.uiEditorTest.card", true, ["move", "resize"], ["write", "submit", "delete"]],
  ["bbm.uiEditorTest.card.select", "Auswahlfeld", "field", "bbm.uiEditorTest.card", true, ["move", "resize"], ["change-data", "submit", "delete"]],
  ["bbm.uiEditorTest.table", "Beispieltabelle", "table", "bbm.uiEditorTest.workspace", true, ["move", "resize"], ["edit-data", "delete"]],
];

class TestNode {
  constructor(tagName) {
    this.nodeType = 1;
    this.tagName = tagName;
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.className = "";
    this.textContent = "";
    this.type = "";
    this.disabled = false;
    this.ownerDocument = null;
    this.style = { setProperty() {}, removeProperty() {} };
  }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  appendChild(child) { child.parentNode = this; child.ownerDocument = child.ownerDocument || this.ownerDocument; this.children.push(child); return child; }
  contains(target) { let node = target; while (node) { if (node === this) return true; node = node.parentNode; } return false; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] || ""; }
  addEventListener() {}
  getBoundingClientRect() { return { width: 300, height: 180, left: 0, top: 0 }; }
  set innerHTML(_value) { this.children = []; }
}

function collectText(node) {
  return [node?.textContent || "", ...(node?.children || []).flatMap(collectText)].join("\n");
}

function findByAttr(node, attr, value) {
  if (node?.attributes?.[attr] === value) return node;
  for (const child of node?.children || []) {
    const found = findByAttr(child, attr, value);
    if (found) return found;
  }
  return null;
}

async function withDom(fn) {
  const oldDocument = global.document;
  const oldWindow = global.window;
  const oldHTMLElement = global.HTMLElement;
  const doc = { defaultView: { HTMLElement: TestNode }, createElement: (tagName) => { const node = new TestNode(tagName); node.ownerDocument = doc; return node; }, head: null };
  doc.head = doc.createElement("head");
  global.document = doc;
  global.window = { bbmDb: {} };
  global.HTMLElement = TestNode;
  try { return await fn({ doc }); }
  finally { global.document = oldDocument; global.window = oldWindow; global.HTMLElement = oldHTMLElement; }
}

async function runM64UiEditorTestSurfaceTests(run) {
  await run("M64 Registry: alle Testflaechen-Elemente sind explizit mit Parent und Operationen registriert", () => {
    const registry = getBbmUiElementRegistry();
    const byId = new Map(registry.elements.map((entry) => [entry.elementId, entry]));
    for (const [elementId, label, type, parentId, editable, allowedOps, lockedOps] of M64_ELEMENTS) {
      const entry = byId.get(elementId);
      assert.ok(entry, `${elementId} fehlt in Registry`);
      assert.equal(entry.label, label);
      assert.equal(entry.type, type);
      assert.equal(entry.parentId, parentId);
      assert.equal(entry.editable, editable);
      assert.deepEqual(entry.allowedOps || [], allowedOps);
      assert.deepEqual(entry.lockedOps || [], lockedOps);
      if (parentId) assert.ok(byId.has(parentId), `Parent fehlt: ${parentId}`);
    }
  });

  await run("M64 Render: alle Testelemente bekommen explizite Metadaten und HTMLElement-Refs", async () => withDom(async () => {
    const { BbmUiEditorStatusPanel } = await importEsmFromFile(PANEL_PATH);
    const refs = await importEsmFromFile(REFS_PATH);
    refs.clearBbmUiElementRefs();
    const panel = new BbmUiEditorStatusPanel({});
    panel.testSurfaceNode = document.createElement("section");
    panel.renderTestSurface();
    for (const [elementId, label, kind, parentId, editable, allowedOps] of M64_ELEMENTS) {
      const node = findByAttr(panel.testSurfaceNode, "data-ui-inspector-id", elementId);
      assert.ok(node, `${elementId} fehlt im Renderbaum`);
      assert.equal(node.getAttribute("data-ui-editor-kind"), kind);
      assert.equal(node.getAttribute("data-ui-editor-label"), label);
      assert.equal(node.getAttribute("data-ui-editor-parent"), parentId || "");
      assert.equal(node.getAttribute("data-ui-editor-editable"), editable ? "true" : "false");
      assert.equal(node.getAttribute("data-ui-editor-ops"), allowedOps.join(","));
      assert.equal(refs.getBbmUiElementRef(elementId), node);
    }
    const renderedText = collectText(panel.testSurfaceNode);
    assert.match(renderedText, /Beispielbutton ohne Fachaktion/);
    assert.match(renderedText, /Eingabefeld-Hülle \(keine Dateneingabe\)/);
    assert.match(renderedText, /Auswahlfeld-Hülle \(keine Datenänderung\)/);
    assert.match(renderedText, /Alpha/);
    refs.clearBbmUiElementRefs();
  }));

  await run("M64 Guardrails: keine echte Eingabe, kein Select, keine Fachaufrufe und keine zweite Registry", () => {
    const panelSource = fs.readFileSync(PANEL_PATH, "utf8");
    assert.doesNotMatch(panelSource, /createNode\("input"\)|createNode\("select"\)|createElement\("input"\)|createElement\("select"\)/);
    assert.doesNotMatch(panelSource, /ipcRenderer|ipcMain|invoke\(|localStorage|querySelector|querySelectorAll|getElementById|getElementsBy|MutationObserver/);
    assert.match(panelSource, /bindTestSurfaceElementRef\("bbm\.uiEditorTest\.card\.button", buttonShell\)/);
    assert.match(panelSource, /bindTestSurfaceElementRef\("bbm\.uiEditorTest\.table", table\)/);
  });
}

if (require.main === module) {
  const run = async (name, fn) => {
    try { const out = fn(); if (out && typeof out.then === "function") await out; console.log(`ok - ${name}`); }
    catch (err) { console.error(`not ok - ${name}`); console.error(err?.stack || err); process.exitCode = 1; }
  };
  runM64UiEditorTestSurfaceTests(run).then(() => { if (!process.exitCode) console.log("m64UiEditorTestSurface.test.cjs passed"); });
}

module.exports = { runM64UiEditorTestSurfaceTests };
