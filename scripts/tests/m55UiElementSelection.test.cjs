const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.join(__dirname, "../..");

function read(file) { return fs.readFileSync(path.join(REPO_ROOT, file), "utf8"); }

class TestHTMLElement {
  constructor(name) { this.name = name; this.parentNode = null; this.children = []; this.listeners = new Map(); this.ownerDocument = null; }
  appendChild(child) { child.parentNode = this; child.ownerDocument = child.ownerDocument || this.ownerDocument; this.children.push(child); return child; }
  contains(target) { let node = target; while (node) { if (node === this) return true; node = node.parentNode || null; } return false; }
  addEventListener(type, handler) { const list = this.listeners.get(type) || []; list.push(handler); this.listeners.set(type, list); }
  removeEventListener(type, handler) { const list = this.listeners.get(type) || []; this.listeners.set(type, list.filter((entry) => entry !== handler)); }
  dispatch(type, event) { for (const handler of this.listeners.get(type) || []) handler(event); }
}

function eventFor(target) { return { target, prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } }; }

async function setupRefs() {
  const refs = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js"));
  refs.clearBbmUiElementRefs();
  const doc = { defaultView: { HTMLElement: TestHTMLElement } };
  const shell = new TestHTMLElement("shell");
  const nav = new TestHTMLElement("nav");
  const header = new TestHTMLElement("header");
  const content = new TestHTMLElement("content");
  const panel = new TestHTMLElement("panel");
  for (const node of [shell, nav, header, content, panel]) node.ownerDocument = doc;
  shell.appendChild(nav); shell.appendChild(header); shell.appendChild(content); content.appendChild(panel);
  refs.registerBbmUiElementRef("bbm.main.shell", shell);
  refs.registerBbmUiElementRef("bbm.main.navigation", nav);
  refs.registerBbmUiElementRef("bbm.main.header", header);
  refs.registerBbmUiElementRef("bbm.main.content", content);
  return { refs, shell, nav, header, content, panel };
}

function createHostDrivenController(host) {
  let active = false;
  let hoveredElementId = "";
  let pointerMoveHandler = null;
  let clickHandler = null;
  let interactionRoot = null;
  const calls = { start: 0, stop: 0, destroy: 0, select: 0 };
  function resolveElementId(eventTarget) {
    for (const target of host.listSelectableTargets()) {
      const ref = host.getElementRef(target.elementId);
      if (ref && (ref === eventTarget || ref.contains?.(eventTarget))) return target.elementId;
    }
    return "";
  }
  function publishState() { host.onStateChange({ active, hoveredElementId }); }
  return {
    calls,
    get hoveredElementId() { return hoveredElementId; },
    start() {
      calls.start += 1;
      if (active) return;
      active = true;
      interactionRoot = host.getInteractionRoot();
      pointerMoveHandler = (event) => {
        if (host.isExcludedTarget(event?.target)) return;
        hoveredElementId = resolveElementId(event?.target);
        publishState();
      };
      clickHandler = (event) => {
        if (!hoveredElementId || host.isExcludedTarget(event?.target)) return;
        calls.select += 1;
        event?.preventDefault?.();
        event?.stopPropagation?.();
        host.selectElement(hoveredElementId).then(() => host.onSelection({ elementId: hoveredElementId })).catch((error) => host.onError(error));
      };
      interactionRoot?.addEventListener?.("pointermove", pointerMoveHandler);
      interactionRoot?.addEventListener?.("click", clickHandler);
      publishState();
    },
    stop() {
      calls.stop += 1;
      if (interactionRoot && pointerMoveHandler) interactionRoot.removeEventListener?.("pointermove", pointerMoveHandler);
      if (interactionRoot && clickHandler) interactionRoot.removeEventListener?.("click", clickHandler);
      active = false; hoveredElementId = ""; publishState();
    },
    destroy() { calls.destroy += 1; this.stop(); },
    isActive() { return active; },
  };
}

async function runM55UiElementSelectionTests(run) {
  await run("M55 Kit-Bridge: Zielaufloesung nutzt Registry-Liste, M54-Refs und Panel-Ausschluss", async () => {
    const { nav, header, content, panel } = await setupRefs();
    const { createBbmKitSelectionHost } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmKitSelectionHost.js"));
    const host = createBbmKitSelectionHost({
      getRegistryElements: () => [
        { elementId: "bbm.main.navigation", label: "Navigation", type: "frame" },
        { elementId: "bbm.main.header", label: "Seitenkopf", type: "frame" },
        { elementId: "bbm.main.content", label: "Inhalt", type: "frame" },
      ],
      getPanelRoot: () => panel,
    });
    assert.deepEqual(host.listSelectableTargets().map((target) => target.elementId), ["bbm.main.navigation", "bbm.main.header", "bbm.main.content"]);
    assert.equal(host.getElementRef("bbm.main.navigation"), nav);
    assert.equal(host.getElementRef("bbm.main.header"), header);
    assert.equal(host.getElementRef("bbm.main.content"), content);
    assert.equal(host.isExcludedTarget(panel), true);
    assert.equal(host.isExcludedTarget(header), false);
  });

  await run("M55 Kit-Bridge: Hover und Klick bleiben auf explizite Refs begrenzt", async () => {
    const { shell, nav, header, panel } = await setupRefs();
    const { createBbmKitSelectionHost } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmKitSelectionHost.js"));
    const selected = [];
    const states = [];
    const host = createBbmKitSelectionHost({
      getRegistryElements: () => [{ elementId: "bbm.main.navigation", label: "Navigation" }, { elementId: "bbm.main.header", label: "Seitenkopf" }],
      selectElement: (elementId) => { selected.push(elementId); },
      getPanelRoot: () => panel,
      onStateChange: (state) => states.push(state),
    });
    const controller = createHostDrivenController(host);
    controller.start(); controller.start();
    assert.equal(shell.listeners.get("pointermove").length, 1);
    assert.equal(shell.listeners.get("click").length, 1);
    shell.dispatch("pointermove", eventFor(nav));
    assert.equal(controller.hoveredElementId, "bbm.main.navigation");
    shell.dispatch("pointermove", eventFor(panel));
    assert.equal(controller.hoveredElementId, "bbm.main.navigation");
    const click = eventFor(nav);
    shell.dispatch("click", click);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(selected, ["bbm.main.navigation"]);
    assert.equal(click.prevented, true);
    shell.dispatch("pointermove", eventFor(header));
    assert.equal(controller.hoveredElementId, "bbm.main.header");
    controller.stop();
    assert.equal(shell.listeners.get("pointermove").length, 0);
    assert.equal(shell.listeners.get("click").length, 0);
    assert.equal(states.at(-1).active, false);
  });

  await run("M55 Sicherheit: alte BBM-Runtime ist nicht produktiv importiert und keine verbotene DOM-Suche", () => {
    const files = ["src/renderer/ui-editor/BbmUiEditorStatusPanel.js", "src/renderer/ui-editor/bbmKitSelectionHost.js"];
    const combined = files.map(read).join("\n");
    assert.doesNotMatch(combined, /createBbmUiElementSelectionController|createBbmUiSelectedOverlay|createBbmUiSelectionOverlay|bbmSelectionController|selectedOverlay/);
    assert.doesNotMatch(combined, /querySelector|querySelectorAll|getElementById|getElementsBy|closest\s*\(|matches\s*\(|MutationObserver|elementsFromPoint|elementFromPoint/);
    assert.doesNotMatch(combined, /targetSelection|editorV2Core|UiInspectorOverlay|BBM_UI_ELEMENTS\s*=|ipcRenderer|ipcMain|HTMLElement.*send|send.*HTMLElement/);
  });

  await run("M55 Dokumentation und Status bleiben historisch nachgezogen", () => {
    assert.match(read("docs/M55_VISUELLE_UI_AUSWAHL_UEBER_EXPLIZITE_REFS.md"), /Zielaufloesung ueber explizite Refs/);
    assert.match(read("STATUS.md"), /M55/);
    assert.match(read("docs/UI_INSPEKTOR_AUFGABENHEFT.md"), /M55/);
  });
}

if (require.main === module) {
  let failed = false;
  const run = async (name, fn) => { try { await fn(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM55UiElementSelectionTests(run).then(() => { if (failed) process.exitCode = 1; });
}

module.exports = { runM55UiElementSelectionTests };
