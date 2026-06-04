const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REGISTRY_PATH = path.join(
  __dirname,
  "../../src/renderer/uiEditor/bbmUiEditorRegistry.js"
);

const FORBIDDEN_DATA_FIELDS = [
  "projectId",
  "project",
  "meetingId",
  "meeting",
  "topId",
  "top",
  "databaseId",
  "database",
  "personId",
  "person",
  "date",
  "deadline",
  "value",
  "text",
  "content",
];

const FORBIDDEN_LOGIC_SNIPPETS = [
  "document.",
  "window.",
  "querySelector",
  "querySelectorAll",
  "getElementById",
  "getElementsBy",
  "addEventListener",
  "MutationObserver",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "fetch(",
  "XMLHttpRequest",
  "ipcRenderer",
  "ipcMain",
  "better-sqlite3",
  "sqlite",
  "db.",
  "database.",
  "execute(",
  "eval(",
  "new Function",
  "writeFile",
  "readFile",
];

function assertNoForbiddenFields(value, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenFields(entry, [...pathParts, String(index)]));
    return;
  }

  if (!value || typeof value !== "object") return;

  for (const key of Object.keys(value)) {
    assert.equal(
      FORBIDDEN_DATA_FIELDS.includes(key),
      false,
      `forbidden data field ${key} at ${pathParts.concat(key).join(".")}`
    );
    assertNoForbiddenFields(value[key], [...pathParts, key]);
  }
}

async function loadRegistryModule() {
  const mod = await importEsmFromFile(REGISTRY_PATH);
  assert.equal(typeof mod.getBbmUiEditorTargetInfo, "function");
  assert.equal(typeof mod.getAvailableUiScopes, "function");
  assert.equal(typeof mod.getActiveUiScope, "function");
  assert.equal(typeof mod.getBbmUiEditorRegistry, "function");
  return mod;
}

async function runBbmUiEditorRegistryTests(run) {
  await run("BBM UI-Editor-Registry: exportiert die zentralen Einstiegfunktionen", async () => {
    await loadRegistryModule();
  });

  await run("BBM UI-Editor-Registry: liefert feste Ziel-App-Informationen", async () => {
    const mod = await loadRegistryModule();
    assert.deepEqual(mod.getBbmUiEditorTargetInfo(), {
      targetAppId: "bbm-produktiv",
      targetAppName: "BBM-Produktiv",
      registryVersion: "1.0.0",
    });
  });

  await run("BBM UI-Editor-Registry: listet Protokoll- und Demo-Scope als verfuegbar", async () => {
    const mod = await loadRegistryModule();
    assert.deepEqual(mod.getAvailableUiScopes(), [
      {
        uiScope: "protokoll.topsScreen",
        moduleId: "protokoll",
        label: "Protokoll",
        status: "available",
      },
      {
        uiScope: "bbm.demo.editorMove",
        moduleId: "uiEditor",
        label: "BBM UI-Editor Demo",
        status: "available",
      },
    ]);
  });

  await run("BBM UI-Editor-Registry: aktiver Scope ist Protokoll-Tops", async () => {
    const mod = await loadRegistryModule();
    assert.equal(mod.getActiveUiScope(), "protokoll.topsScreen");
  });

  await run("BBM UI-Editor-Registry: liefert Protokoll-Elemente ueber den zentralen Einstieg", async () => {
    const mod = await loadRegistryModule();
    const registry = mod.getBbmUiEditorRegistry("protokoll.topsScreen");
    assert.equal(registry.targetAppId, "bbm-produktiv");
    assert.equal(registry.uiScope, "protokoll.topsScreen");
    assert.equal(registry.moduleId, "protokoll");
    assert.equal(Array.isArray(registry.elements), true);
    assert.equal(
      registry.elements.some((element) => element.id === "protokoll.root"),
      true,
      "missing protokoll.root"
    );
  });

  await run("BBM UI-Editor-Registry: unbekannter Scope wird sauber abgefangen", async () => {
    const mod = await loadRegistryModule();
    const registry = mod.getBbmUiEditorRegistry("unbekannt.scope");
    assert.equal(registry.ok, false);
    assert.equal(registry.targetAppId, "bbm-produktiv");
    assert.equal(registry.uiScope, "unbekannt.scope");
    assert.deepEqual(registry.elements, []);
    assert.equal(typeof registry.reason, "string");
    assert.equal(registry.reason.length > 0, true);
  });

  await run("BBM UI-Editor-Registry: enthaelt keine Fachdatenfelder", async () => {
    const mod = await loadRegistryModule();
    assertNoForbiddenFields(mod.getBbmUiEditorTargetInfo());
    assertNoForbiddenFields(mod.getAvailableUiScopes());
    assertNoForbiddenFields(mod.getBbmUiEditorRegistry("protokoll.topsScreen"));
    assertNoForbiddenFields(mod.getBbmUiEditorRegistry("unbekannt.scope"));
  });

  await run("BBM UI-Editor-Registry: enthaelt keine Datenbank-, Speicher-, Ausfuehrungs- oder DOM-Scanlogik", () => {
    const source = fs.readFileSync(REGISTRY_PATH, "utf8");
    for (const snippet of FORBIDDEN_LOGIC_SNIPPETS) {
      assert.equal(source.includes(snippet), false, `forbidden logic snippet: ${snippet}`);
    }
  });
}

if (require.main === module) {
  const run = async (name, fn) => {
    try {
      const out = fn();
      if (out && typeof out.then === "function") {
        await out;
      }
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
      process.exitCode = 1;
    }
  };

  runBbmUiEditorRegistryTests(run).then(() => {
    if (!process.exitCode) console.log("bbmUiEditorRegistry.test.cjs passed");
  });
}

module.exports = { runBbmUiEditorRegistryTests };
