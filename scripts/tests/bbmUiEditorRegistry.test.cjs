const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REGISTRY_PATH = path.join(
  __dirname,
  "../../src/renderer/uiEditor/bbmUiEditorRegistry.js"
);
const RESTARBEITEN_ELEMENTS_PATH = path.join(
  __dirname,
  "../../src/renderer/modules/restarbeitenV2/uiEditor/restarbeitenUiElements.js"
);
const RESTARBEITEN_SCREEN_PATH = path.join(
  __dirname,
  "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"
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

const RESTARBEITEN_FORBIDDEN_SNIPPETS = [
  "querySelector",
  "DOMParser",
  "innerHTML",
  "scan",
  "detect",
  "autoRegister",
  "migration",
];

const REQUIRED_ELEMENT_FIELDS = [
  "id",
  "name",
  "type",
  "role",
  "parentId",
  "order",
  "visible",
  "editable",
  "allowedOps",
  "lockedOps",
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

function assertRequiredElementFields(elements) {
  for (const element of elements) {
    for (const field of REQUIRED_ELEMENT_FIELDS) {
      assert.equal(Object.prototype.hasOwnProperty.call(element, field), true, `missing ${field} on ${element?.id}`);
    }
  }
}

function assertKnownParents(elements) {
  const ids = new Set(elements.map((element) => element.id));
  for (const element of elements) {
    assert.equal(
      element.parentId === null || ids.has(element.parentId),
      true,
      `unknown parentId ${element.parentId} on ${element.id}`
    );
  }
}

function assertSourceContainsAll(source, snippets) {
  for (const snippet of snippets) {
    assert.equal(source.includes(snippet), true, `missing source snippet: ${snippet}`);
  }
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

  await run("BBM UI-Editor-Registry: listet Protokoll-, Demo- und Restarbeiten-Scope als verfuegbar", async () => {
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
      {
        uiScope: "restarbeiten.screen",
        moduleId: "restarbeiten",
        label: "Restarbeiten",
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

  await run("BBM UI-Editor-Registry: liefert Restarbeiten-Elementliste mit Root und Filterbar", async () => {
    const mod = await loadRegistryModule();
    const registry = mod.getBbmUiEditorRegistry("restarbeiten.screen");
    assert.equal(registry.targetAppId, "bbm-produktiv");
    assert.equal(registry.uiScope, "restarbeiten.screen");
    assert.equal(registry.moduleId, "restarbeiten");
    assert.equal(Array.isArray(registry.elements), true);
    assert.equal(registry.elements.length > 0, true);
    assert.equal(registry.elements.some((element) => element.id === "restarbeiten.screen.root"), true);
    assert.equal(registry.elements.some((element) => element.id === "restarbeiten.screen.filterbar"), true);
  });

  await run("BBM UI-Editor-Registry: Restarbeiten-Elemente haben Pflichtfelder und gueltige Parents", async () => {
    const mod = await loadRegistryModule();
    const elements = mod.getBbmUiEditorRegistry("restarbeiten.screen").elements;
    assertRequiredElementFields(elements);
    assertKnownParents(elements);
  });

  await run("BBM UI-Editor-Registry: Restarbeiten-Filterbar erlaubt reale Gruppen und direkte Buttons", async () => {
    const mod = await loadRegistryModule();
    const elements = mod.getBbmUiEditorRegistry("restarbeiten.screen").elements;
    const byId = new Map(elements.map((element) => [element.id, element]));
    assert.equal(byId.get("restarbeiten.filterbar.group.location")?.parentId, "restarbeiten.screen.filterbar");
    assert.equal(byId.get("restarbeiten.filterbar.group.class")?.parentId, "restarbeiten.screen.filterbar");
    assert.equal(byId.get("restarbeiten.filterbar.group.meta")?.parentId, "restarbeiten.screen.filterbar");
    assert.equal(byId.get("restarbeiten.filterbar.group.close")?.parentId, "restarbeiten.screen.filterbar");
    assert.equal(byId.get("restarbeiten.filterbar.action.class.all")?.type, "button");
    assert.equal(byId.get("restarbeiten.filterbar.action.class.all")?.parentId, "restarbeiten.filterbar.group.class");
    assert.equal(byId.get("restarbeiten.filterbar.action.close")?.type, "button");
    assert.equal(byId.get("restarbeiten.filterbar.action.close")?.parentId, "restarbeiten.filterbar.group.close");
  });

  await run("BBM UI-Editor-Registry: echter Restarbeiten-Code enthaelt Filterbar-Marker", () => {
    const source = fs.readFileSync(RESTARBEITEN_SCREEN_PATH, "utf8");
    assert.equal(source.includes('data-ui-editor-id", "restarbeiten.screen.filterbar"'), true);
  });

  await run("BBM UI-Editor-Registry: echter Restarbeiten-Code nutzt Registry-Parent-Marker", () => {
    const source = fs.readFileSync(RESTARBEITEN_SCREEN_PATH, "utf8");
    assertSourceContainsAll(source, [
      'editorId: "restarbeiten.screen.filterbar"',
      'editorParent: "restarbeiten.screen.root"',
      'editorId: "restarbeiten.filterbar.group.location"',
      'editorId: "restarbeiten.filterbar.group.class"',
      'editorId: "restarbeiten.filterbar.group.meta"',
      'editorParent: "restarbeiten.screen.filterbar"',
      'parent: "restarbeiten.filterbar.group.location"',
      'parent: "restarbeiten.filterbar.group.class"',
      'parent: "restarbeiten.filterbar.group.meta"',
      'parent: "restarbeiten.filterbar.group.close"',
    ]);
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
    assertNoForbiddenFields(mod.getBbmUiEditorRegistry("restarbeiten.screen"));
    assertNoForbiddenFields(mod.getBbmUiEditorRegistry("unbekannt.scope"));
  });

  await run("BBM UI-Editor-Registry: enthaelt keine Datenbank-, Speicher-, Ausfuehrungs- oder DOM-Scanlogik", () => {
    const source = fs.readFileSync(REGISTRY_PATH, "utf8");
    for (const snippet of FORBIDDEN_LOGIC_SNIPPETS) {
      assert.equal(source.includes(snippet), false, `forbidden logic snippet: ${snippet}`);
    }
  });

  await run("BBM UI-Editor-Registry: Restarbeiten-UI-Editor-Dateien enthalten keine verbotenen Fragmente", () => {
    const source = fs.readFileSync(RESTARBEITEN_ELEMENTS_PATH, "utf8");
    for (const snippet of RESTARBEITEN_FORBIDDEN_SNIPPETS) {
      assert.equal(source.includes(snippet), false, `forbidden Restarbeiten snippet: ${snippet}`);
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
