#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("../../scripts/tests/_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const INSTALLED_REGISTRY_PATH = path.resolve(__dirname, "../uiEditorRegistry.js");
const OFFICIAL_BBM_REGISTRY_RELATIVE_PATH = "src/renderer/uiEditor/bbmUiEditorRegistry.js";
const OFFICIAL_BBM_REGISTRY_PATH = path.resolve(
  REPO_ROOT,
  OFFICIAL_BBM_REGISTRY_RELATIVE_PATH
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

async function loadInstalledRegistry() {
  const installed = require(INSTALLED_REGISTRY_PATH);
  assert.equal(typeof installed.getInstalledUiEditorRegistryInfo, "function");
  assert.equal(typeof installed.getOfficialBbmUiEditorRegistryPath, "function");
  assert.equal(typeof installed.loadBbmUiEditorRegistry, "function");
  assert.equal(Boolean(installed.uiEditorRegistry), true);
  return installed;
}

async function loadOfficialBbmRegistry() {
  return importEsmFromFile(OFFICIAL_BBM_REGISTRY_PATH);
}

async function runInstalledUiEditorRegistryTests(run) {
  await run("Installierte UI-Editor-Registry: Einstieg existiert", () => {
    assert.equal(fs.existsSync(INSTALLED_REGISTRY_PATH), true);
  });

  await run("Installierte UI-Editor-Registry: verweist auf den offiziellen BBM-Registry-Pfad", async () => {
    const installed = await loadInstalledRegistry();
    const info = installed.getInstalledUiEditorRegistryInfo();
    assert.equal(info.officialBbmRegistryPath, OFFICIAL_BBM_REGISTRY_RELATIVE_PATH);
    assert.equal(installed.BBM_UI_EDITOR_REGISTRY_RELATIVE_PATH, OFFICIAL_BBM_REGISTRY_RELATIVE_PATH);
    assert.equal(installed.getOfficialBbmUiEditorRegistryPath(REPO_ROOT), OFFICIAL_BBM_REGISTRY_PATH);
    assert.equal(fs.existsSync(installed.getOfficialBbmUiEditorRegistryPath(REPO_ROOT)), true);
  });

  await run("Installierte UI-Editor-Registry: erzeugt keine doppelte aktive Beispiel-Registry", async () => {
    const installed = await loadInstalledRegistry();
    const info = installed.getInstalledUiEditorRegistryInfo();
    assert.equal(info.createsOwnRegistry, false);
    assert.equal(info.activeExampleScope, false);
    assert.equal(Array.isArray(installed.uiEditorRegistry.uiScopes), true);
    assert.equal(
      installed.uiEditorRegistry.uiScopes.some((scope) => scope.uiScopeId === "example-ui-scope"),
      false
    );
  });

  await run("Installierte UI-Editor-Registry: Quelltext nutzt keinen aktiven example-ui-scope", () => {
    const source = fs.readFileSync(INSTALLED_REGISTRY_PATH, "utf8");
    assert.equal(source.includes("example-ui-scope"), false);
    assert.equal(source.includes(OFFICIAL_BBM_REGISTRY_RELATIVE_PATH), true);
  });

  await run("Installierte UI-Editor-Registry: echte BBM-Registry ist erreichbar", async () => {
    const installed = await loadInstalledRegistry();
    const registry = await installed.loadBbmUiEditorRegistry(importEsmFromFile, { repoRoot: REPO_ROOT });
    assert.equal(typeof registry.getAvailableUiScopes, "function");
    assert.equal(typeof registry.getBbmUiEditorRegistry, "function");
  });

  await run("BBM UI-Editor-Registry: getAvailableUiScopes enthaelt protokoll.topsScreen", async () => {
    const registry = await loadOfficialBbmRegistry();
    const scopes = registry.getAvailableUiScopes();
    assert.equal(scopes.some((scope) => scope.uiScope === "protokoll.topsScreen"), true);
  });

  await run("BBM UI-Editor-Registry: getBbmUiEditorRegistry liefert Protokoll-Elemente", async () => {
    const registry = await loadOfficialBbmRegistry();
    const result = registry.getBbmUiEditorRegistry("protokoll.topsScreen");
    assert.equal(Array.isArray(result.elements), true);
    assert.equal(result.elements.length > 0, true);
    assert.equal(result.elements.some((element) => element.id === "protokoll.root"), true);
  });

  await run("UI-Editor-Registry: enthaelt keine Fachdatenfelder", async () => {
    const installed = await loadInstalledRegistry();
    const registry = await loadOfficialBbmRegistry();
    assertNoForbiddenFields(installed.getInstalledUiEditorRegistryInfo());
    assertNoForbiddenFields(installed.uiEditorRegistry);
    assertNoForbiddenFields(registry.getAvailableUiScopes());
    assertNoForbiddenFields(registry.getBbmUiEditorRegistry("protokoll.topsScreen"));
  });

  await run("UI-Editor-Registry: enthaelt keine Datenbank-, Speicher-, Ausfuehrungs- oder DOM-Scanlogik", () => {
    const installedSource = fs.readFileSync(INSTALLED_REGISTRY_PATH, "utf8");
    const officialSource = fs.readFileSync(OFFICIAL_BBM_REGISTRY_PATH, "utf8");
    for (const snippet of FORBIDDEN_LOGIC_SNIPPETS) {
      assert.equal(installedSource.includes(snippet), false, `installed forbidden logic snippet: ${snippet}`);
      assert.equal(officialSource.includes(snippet), false, `official forbidden logic snippet: ${snippet}`);
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

  runInstalledUiEditorRegistryTests(run).then(() => {
    if (!process.exitCode) console.log("uiEditorRegistry.test.cjs passed");
  });
}

module.exports = { runInstalledUiEditorRegistryTests };
