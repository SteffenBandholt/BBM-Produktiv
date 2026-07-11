const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { getBbmUiElementRegistry } = require("../../src/ui-editor/bbm-ui-element-registry.cjs");

const REPO_ROOT = path.join(__dirname, "../..");

function read(file) {
  return fs.readFileSync(path.join(REPO_ROOT, file), "utf8");
}

function createElementFactory() {
  class TestHTMLElement {}
  return {
    TestHTMLElement,
    element(name) {
      const node = new TestHTMLElement();
      node.name = name;
      node.ownerDocument = { defaultView: { HTMLElement: TestHTMLElement } };
      return node;
    },
  };
}

async function runM54UiElementRefsTests(run) {
  await run("M54 Referenzspeicher: bekannte HTMLElement-Refs werden akzeptiert und exakt geliefert", async () => {
    const refs = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js"));
    refs.clearBbmUiElementRefs();
    const { element } = createElementFactory();
    const first = element("content-1");
    const second = element("content-2");

    refs.registerBbmUiElementRef("bbm.main.content", first);
    assert.equal(refs.getBbmUiElementRef("bbm.main.content"), first);
    refs.registerBbmUiElementRef("bbm.main.content", second);
    assert.equal(refs.getBbmUiElementRef("bbm.main.content"), second);

    const status = refs.getBbmUiElementRefStatus();
    assert.deepEqual(status.registeredIds, ["bbm.main.content"]);
    assert.equal(status.count, 1);
    assert.equal(status.expectedCount, 5);
    refs.clearBbmUiElementRefs();
  });

  await run("M54 Referenzspeicher: unbekannte IDs und Nicht-HTMLElement-Werte werden blockiert", async () => {
    const refs = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js"));
    refs.clearBbmUiElementRefs();
    const { element } = createElementFactory();

    assert.throws(() => refs.registerBbmUiElementRef("bbm.main.unknown", element("x")), /BBM_UI_ELEMENT_REF_UNKNOWN/);
    assert.throws(() => refs.registerBbmUiElementRef("bbm.main.content", null), /BBM_UI_ELEMENT_REF_INVALID_ELEMENT/);
    assert.throws(() => refs.registerBbmUiElementRef("bbm.main.content", "#content"), /BBM_UI_ELEMENT_REF_INVALID_ELEMENT/);
    assert.throws(() => refs.registerBbmUiElementRef("bbm.main.content", {}), /BBM_UI_ELEMENT_REF_INVALID_ELEMENT/);
    assert.equal(refs.getBbmUiElementRefStatus().count, 0);
  });

  await run("M54 Referenzspeicher: unregister und clear entfernen Referenzen", async () => {
    const refs = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js"));
    refs.clearBbmUiElementRefs();
    const { element } = createElementFactory();
    refs.registerBbmUiElementRef("bbm.main.shell", element("shell"));
    refs.registerBbmUiElementRef("bbm.main.header", element("header"));
    refs.unregisterBbmUiElementRef("bbm.main.shell");
    assert.equal(refs.getBbmUiElementRef("bbm.main.shell"), null);
    assert.equal(refs.getBbmUiElementRefStatus().count, 1);
    refs.clearBbmUiElementRefs();
    assert.equal(refs.getBbmUiElementRefStatus().count, 0);
  });

  await run("M54 CoreShell: bindet nur vorhandene Variablen und laesst actions transparent ungebunden", () => {
    const coreShell = read("src/renderer/app/CoreShell.js");
    assert.match(coreShell, /bindCoreShellUiElementRefs/);
    assert.match(coreShell, /registerBbmUiElementRef\("bbm\.main\.shell", host\)/);
    assert.match(coreShell, /registerBbmUiElementRef\("bbm\.main\.navigation", sidebar\)/);
    assert.match(coreShell, /registerBbmUiElementRef\("bbm\.main\.header", headerEl\)/);
    assert.match(coreShell, /registerBbmUiElementRef\("bbm\.main\.content", content\)/);
    assert.doesNotMatch(coreShell, /registerBbmUiElementRef\("bbm\.main\.actions"/);
    assert.match(coreShell, /clearBbmUiElementRefs\(\)/);
    assert.match(coreShell, /destroy\(\)/);
    assert.doesNotMatch(coreShell, /querySelector|getElementById|getElementsBy|closest|MutationObserver|data-ui-/);
  });

  await run("M54 Legacy-Isolation: CoreShell startet den alten RuntimeLauncher nicht automatisch parallel", () => {
    const coreShell = read("src/renderer/app/CoreShell.js");
    assert.doesNotMatch(coreShell, /installBbmUiEditorRuntimeLauncher/);
    assert.doesNotMatch(coreShell, /createEditorScopeInspector/);
    assert.doesNotMatch(coreShell, /targetSelection/);
    const navigation = read("src/renderer/app/coreShellNavigation.js");
    assert.match(navigation, /UI-Editor Status/);
    assert.match(navigation, /showUiEditor/);
  });

  await run("M54 Sicherheit: keine DOM-Suche, keine zweite Registry, kein IPC-DOM und Registry bleibt explicit", () => {
    const files = [
      "src/renderer/ui-editor/bbmUiElementRefs.js",
      "src/renderer/app/CoreShell.js",
      "src/renderer/ui-editor/BbmUiEditorStatusPanel.js",
    ];
    const combined = files.map(read).join("\n");
    assert.doesNotMatch(combined, /querySelector|querySelectorAll|getElementsBy|getElementById|closest|MutationObserver|data-ui-Scanning/);
    assert.doesNotMatch(combined, /ipcRenderer|ipcMain|HTMLElement.*send|send.*HTMLElement|invoke\(/);
    assert.doesNotMatch(combined, /BBM_UI_ELEMENTS\s*=|capabilities:\s*Object\.freeze|allowedChanges:/);
    const registry = getBbmUiElementRegistry("bbm.main");
    assert.equal(registry.registryMode, "explicit");
    assert.equal(registry.autoDiscovery, false);
    assert.deepEqual(registry.elements.map((element) => element.elementId), [
      "bbm.main.shell",
      "bbm.main.navigation",
      "bbm.main.header",
      "bbm.main.content",
      "bbm.main.actions",
    ]);
  });

  await run("M54 Statuspanel: zeigt Referenzzahlen und bleibt ohne Legacy-Runtime", () => {
    const panel = read("src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
    assert.match(panel, /UI-Referenzen gebunden/);
    assert.match(panel, /Fehlende Referenzen/);
    assert.doesNotMatch(panel, /installBbmUiEditorRuntimeLauncher|targetSelection|editorV2Core|UiInspectorOverlay/);
  });

  await run("M54 Dokumentation: Referenzabbildung, Lifecycle und Legacy-Pruefung sind dokumentiert", () => {
    const doc = read("docs/M54_EXPLIZITE_UI_ELEMENT_REFERENZEN.md");
    assert.match(doc, /bbm\.main\.shell\s*->\s*host/);
    assert.match(doc, /bbm\.main\.actions\s*->\s*ungebunden/);
    assert.match(doc, /Lifecycle/);
    assert.match(doc, /Legacy-Runtime/);
    assert.match(read("STATUS.md"), /M54/);
    assert.match(read("docs/UI_INSPEKTOR_AUFGABENHEFT.md"), /M54/);
  });
}

if (require.main === module) {
  let failed = false;
  const run = async (name, fn) => {
    try {
      await fn();
      console.log(`ok - ${name}`);
    } catch (error) {
      failed = true;
      console.error(`not ok - ${name}`);
      console.error(error?.stack || error);
    }
  };
  runM54UiElementRefsTests(run).then(() => {
    if (failed) process.exitCode = 1;
  });
}

module.exports = { runM54UiElementRefsTests };
