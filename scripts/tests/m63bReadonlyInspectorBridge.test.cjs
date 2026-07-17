const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.join(__dirname, "../..");
const BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmEditorRuntimeInspectorBridge.js");
const PANEL_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js");

function read(file) { return fs.readFileSync(path.join(REPO_ROOT, file), "utf8"); }

const elements = [
  { elementId: "bbm.main.shell", label: "Shell", type: "frame", parentId: null, capabilities: ["select", "layout"], allowedChanges: ["layout.read", "layout.save", "layout.reset"], layoutDefaults: { visible: true } },
  { elementId: "bbm.main.header", label: "Header", type: "header", parentId: "bbm.main.shell", capabilities: ["select", "layout"], allowedChanges: ["layout.read"] },
];

function createSpyInspector() {
  const calls = { applyLayoutChange: 0, submitChangeRequest: 0, save: 0, write: 0, resetLayoutState: 0, clear: 0 };
  return {
    calls,
    inspectorFactory({ hostAdapterFactory }) {
      const host = hostAdapterFactory();
      return {
        getLayoutControlPanel(_scopeId, elementId) {
          const registry = host.getRegistry();
          const selectedElement = registry.find((entry) => entry.id === elementId) || null;
          return {
            ok: Boolean(selectedElement),
            selectedElement: selectedElement && { ...selectedElement, effectiveOps: [...selectedElement.allowedOps] },
            controls: selectedElement ? [{ id: "editor.layout.applySave", label: "Aenderung anwenden/speichern", enabled: true, allowedOps: [...selectedElement.allowedOps] }] : [],
            status: { kind: selectedElement ? "ready" : "blocked" },
            errors: [],
            warnings: [],
          };
        },
        applyLayoutChange() { calls.applyLayoutChange += 1; },
      };
    },
  };
}

class TestNode {
  constructor(tagName) { this.tagName = tagName; this.children = []; this.attributes = {}; this.className = ""; this.hidden = false; this.textContent = ""; this.type = ""; this.disabled = false; }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.children.push(child); return child; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener() {}
  set innerHTML(_value) { this.children = []; }
}
function collectText(node) { return [node?.textContent || "", ...(node?.children || []).flatMap(collectText)].join("\n"); }
function collectTags(node) { return [node?.tagName || "", ...(node?.children || []).flatMap(collectTags)].filter(Boolean); }

async function runM63bReadonlyInspectorBridgeTests(run) {
  const { createBbmEditorRuntimeInspectorBridge } = await importEsmFromFile(BRIDGE_PATH);

  await run("M63B Bridge: transformiert nur vorhandene M51-Elemente und behaelt IDs/Parents", () => {
    const spy = createSpyInspector();
    const bridge = createBbmEditorRuntimeInspectorBridge({ registryElements: elements, selectedElement: elements[1], inspectorFactory: spy.inspectorFactory });
    const result = bridge.inspectSelectedElement();
    assert.equal(result.registry.length, elements.length);
    assert.deepEqual(result.registry.map((entry) => entry.id), elements.map((entry) => entry.elementId));
    assert.equal(result.registry[1].parentId, "bbm.main.shell");
    assert.equal(result.registry[1].order, 1);
  });

  await run("M63B Bridge: selectedElement bleibt externe M52-Quelle, Auswahlwechsel und Reset wirken live", () => {
    const spy = createSpyInspector();
    let selectedElement = null;
    const bridge = createBbmEditorRuntimeInspectorBridge({ registryElements: elements, getSelectedElement: () => selectedElement, inspectorFactory: spy.inspectorFactory });
    assert.equal(bridge.inspectSelectedElement().kind, "empty");
    selectedElement = elements[0];
    assert.equal(bridge.inspectSelectedElement().elementId, "bbm.main.shell");
    selectedElement = elements[1];
    assert.equal(bridge.inspectSelectedElement().elementId, "bbm.main.header");
    selectedElement = null;
    assert.equal(bridge.inspectSelectedElement().kind, "empty");
  });

  await run("M63C Bridge: gueltiges Layout-Element bietet Move und Resize", () => {
    const spy = createSpyInspector();
    const bridge = createBbmEditorRuntimeInspectorBridge({ registryElements: elements, selectedElement: elements[1], inspectorFactory: spy.inspectorFactory });
    const result = bridge.inspectSelectedElement();
    assert.equal(result.ok, true);
    assert.equal(result.inspectorStatus, "layout_ready");
    assert.equal(result.inspectorElement.id, "bbm.main.header");
    assert.deepEqual(result.allowedOps, ["move", "resize"]);
    assert.equal(result.controls[0].id, "editor.layout.applySave");
    assert.equal(result.controls[0].enabled, true);
    assert.equal(result.controls[0].m63cStatus, "bereit");
  });

  await run("M63B Bridge: explizites allowedOps uebernimmt genau diese Operation", () => {
    const spy = createSpyInspector();
    const explicit = [{ ...elements[0], allowedOps: ["move"] }];
    const bridge = createBbmEditorRuntimeInspectorBridge({ registryElements: explicit, selectedElement: explicit[0], inspectorFactory: spy.inspectorFactory });
    const result = bridge.inspectSelectedElement();
    assert.deepEqual(result.allowedOps, ["move"]);
    assert.deepEqual(result.registry[0].allowedOps, ["move"]);
  });

  await run("M63B Bridge: unbekannte ID und fehlende role/Pflichtfelder werden blockiert statt geraten", () => {
    const spy = createSpyInspector();
    let bridge = createBbmEditorRuntimeInspectorBridge({ registryElements: elements, selectedElement: { elementId: "bbm.main.unknown" }, inspectorFactory: spy.inspectorFactory });
    assert.equal(bridge.inspectSelectedElement().reason, "UNKNOWN_SELECTED_ELEMENT");
    const custom = [{ elementId: "custom.no.role", label: "Custom", type: "custom", parentId: null, allowedChanges: ["layout.read"] }];
    bridge = createBbmEditorRuntimeInspectorBridge({ registryElements: custom, selectedElement: custom[0], inspectorFactory: spy.inspectorFactory });
    assert.equal(bridge.inspectSelectedElement().kind, "unsupported");
    assert.equal(bridge.inspectSelectedElement().reason, "ROLE_MISSING");
  });

  await run("M63C Statuspanel: zeigt Elementname und kleine Layout-Konsole", async () => {
    const oldDocument = global.document;
    const oldWindow = global.window;
    global.document = { createElement: (tagName) => new TestNode(tagName) };
    global.window = { bbmDb: {} };
    try {
      const { BbmUiEditorStatusPanel } = await importEsmFromFile(PANEL_PATH);
      const panel = new BbmUiEditorStatusPanel({});
      panel.detailsNode = new TestNode("section");
      panel.elements = elements;
      panel.selectedElement = elements[1];
      panel.renderDetails();
      const text = collectText(panel.detailsNode);
      const tags = collectTags(panel.detailsNode);
      assert.match(text, /Header/);
      assert.match(text, /Kleine Schritte fuer Position und Groesse/);
      assert.match(text, /Nach oben/);
      assert.match(text, /Nach links/);
      assert.match(text, /Breiter/);
      assert.match(text, /Hoeher/);
      assert.doesNotMatch(text, /Textgroesse|Textposition|freie Werteingabe:/);
      assert.equal(tags.includes("button"), true);
      assert.equal(tags.includes("input"), false);
      assert.equal(tags.includes("select"), false);
      assert.equal(panel.detailsNode.children[1].children[2].attributes["data-ui-inspector-id"], "ui-editor.layout-console");
    } finally {
      global.document = oldDocument;
      global.window = oldWindow;
    }
  });

  await run("M63C Bridge: Layoutaktionen veraendern nur den ausgewaehlten neutralen Layoutzustand", () => {
    const explicit = [{ ...elements[0], allowedOps: ["move", "resize"] }];
    const bridge = createBbmEditorRuntimeInspectorBridge({ registryElements: explicit, selectedElement: explicit[0] });
    const move = bridge.applySelectedElementLayoutAction("right");
    assert.equal(move.ok, true);
    assert.deepEqual(move.layoutEntry.layoutValue, { x: 8 });
    const resize = bridge.applySelectedElementLayoutAction("higher");
    assert.equal(resize.ok, true);
    assert.deepEqual(resize.layoutEntry.layoutValue, { x: 8, height: 8 });
    const unknown = bridge.applySelectedElementLayoutAction("free-value");
    assert.equal(unknown.ok, false);
    assert.equal(unknown.reason, "UNKNOWN_LAYOUT_ACTION");
  });

  await run("M63C Guardrails: keine direkte Style-/DOM-Suche/IPC/zweite Registry und keine freie Werteingabe", () => {
    const bridgeSource = read("src/renderer/ui-editor/bbmEditorRuntimeInspectorBridge.js");
    const panelSource = read("src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
    const combined = `${bridgeSource}\n${panelSource}`;
    assert.doesNotMatch(combined, /querySelector|querySelectorAll|getElementById|getElementsBy|closest\(|matches\(|elementFromPoint|elementsFromPoint|MutationObserver|localStorage|ipcRenderer|\.style\s*=|createElement\("input"\)|createElement\("select"\)/);
    assert.doesNotMatch(bridgeSource, /let\s+selectedElement|this\.selectedElement|let\s+selectedElementId|this\.selectedElementId/);
  });
}

if (require.main === module) {
  const run = async (name, fn) => {
    try { const out = fn(); if (out && typeof out.then === "function") await out; console.log(`ok - ${name}`); }
    catch (err) { console.error(`not ok - ${name}`); console.error(err?.stack || err); process.exitCode = 1; }
  };
  runM63bReadonlyInspectorBridgeTests(run).then(() => { if (!process.exitCode) console.log("m63bReadonlyInspectorBridge.test.cjs passed"); });
}

module.exports = { runM63bReadonlyInspectorBridgeTests };
