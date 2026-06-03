const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const UI_EDITOR_DIR = path.join(REPO_ROOT, "uiEditor");
const INSTALLED_REGISTRY_PATH = path.join(UI_EDITOR_DIR, "uiEditorRegistry.js");
const OFFICIAL_BBM_REGISTRY_PATH = path.join(
  REPO_ROOT,
  "src/renderer/uiEditor/bbmUiEditorRegistry.js"
);

const REQUIRED_INSTALLED_ARTIFACTS = [
  "uiEditor/README.md",
  "uiEditor/targetAppRegistry.js",
  "uiEditor/uiEditorRegistry.js",
  "uiEditor/uiEditorRules.md",
  "uiEditor/uiEditorLauncherButton.js",
  "uiEditor/uiEditorLauncherButton.css",
  "uiEditor/tests/uiEditorRegistry.test.cjs",
];

const NEUTRAL_INSTALLED_ARTIFACTS = [
  "uiEditor/targetAppRegistry.js",
  "uiEditor/uiEditorRegistry.js",
  "uiEditor/uiEditorLauncherButton.js",
  "uiEditor/uiEditorLauncherButton.css",
];

const FORBIDDEN_NEUTRALITY_SNIPPETS = [
  "BBM",
  "bbm",
  "projectId",
  "meetingId",
  "topId",
  "databaseId",
  "personId",
  "restarbeit",
  "protokoll",
  "querySelector",
  "querySelectorAll",
  "MutationObserver",
  "detectElements",
  "autoRegister",
  "writeFile",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "better-sqlite3",
  "ipcRenderer",
  "ipcMain",
];

function resolveRepoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function loadInstalledRegistry() {
  delete require.cache[require.resolve(INSTALLED_REGISTRY_PATH)];
  const installed = require(INSTALLED_REGISTRY_PATH);
  assert.equal(Boolean(installed.uiEditorRegistry), true);
  return installed.uiEditorRegistry;
}

function getScopeIdentifier(scope) {
  const scopeKeys = ["id", "uiScope", "uiScopeId", "scopeId", "registryKey", "key"];
  for (const key of scopeKeys) {
    if (typeof scope?.[key] === "string" && scope[key].trim() !== "") {
      return scope[key].trim();
    }
  }

  return null;
}

function findLauncherScope(registry) {
  assert.equal(Array.isArray(registry.uiScopes), true, "uiScopes must be an array");
  return registry.uiScopes.find((scope) => getScopeIdentifier(scope) === "uiEditor.global");
}

function getScopeElements(scope) {
  const elements = scope?.elements;
  if (Array.isArray(elements)) return elements;
  if (elements && typeof elements === "object") return Object.values(elements);
  return [];
}

async function loadBbmRegistry() {
  const mod = await importEsmFromFile(OFFICIAL_BBM_REGISTRY_PATH);
  assert.equal(typeof mod.getAvailableUiScopes, "function");
  assert.equal(typeof mod.getBbmUiEditorRegistry, "function");
  return mod;
}

async function runBbmUiEditorInstalledArtifactsTests(run) {
  await run("BBM UI-Editor-Artefakte: installierte Dateien existieren", () => {
    for (const relativePath of REQUIRED_INSTALLED_ARTIFACTS) {
      assert.equal(fs.existsSync(resolveRepoPath(relativePath)), true, `missing artifact: ${relativePath}`);
    }
  });

  await run("BBM UI-Editor-Artefakte: installierte Registry enthaelt globalen Launcher", () => {
    const registry = loadInstalledRegistry();
    const scope = findLauncherScope(registry);
    assert.equal(Boolean(scope), true, "missing uiEditor.global scope");

    const launcher = getScopeElements(scope).find(
      (element) => element.id === "uiEditor.launcherButton" || element.elementId === "uiEditor.launcherButton"
    );
    assert.equal(Boolean(launcher), true, "missing uiEditor.launcherButton element");
    assert.equal(launcher.type, "button");
    assert.equal(launcher.role, "editor-launcher");
    assert.equal(launcher.area, "overlay");
    assert.equal(Number.isFinite(launcher.position?.x), true, "missing launcher position.x");
    assert.equal(Number.isFinite(launcher.position?.y), true, "missing launcher position.y");
    assert.equal(launcher.editable, true);

    for (const op of ["move", "hide", "show"]) {
      assert.equal(launcher.allowedOps?.includes(op), true, `missing allowed op: ${op}`);
    }

    for (const op of ["delete", "executeTargetAction", "modifyDomainData"]) {
      assert.equal(launcher.lockedOps?.includes(op), true, `missing locked op: ${op}`);
    }
  });

  await run("BBM UI-Editor-Artefakte: Launcher-Artefakte bleiben neutral", () => {
    for (const relativePath of NEUTRAL_INSTALLED_ARTIFACTS) {
      const source = fs.readFileSync(resolveRepoPath(relativePath), "utf8");
      for (const snippet of FORBIDDEN_NEUTRALITY_SNIPPETS) {
        assert.equal(source.includes(snippet), false, `${relativePath} contains forbidden snippet: ${snippet}`);
      }
    }
  });

  await run("BBM UI-Editor-Artefakte: echte BBM-Registry bleibt separat erreichbar", async () => {
    assert.equal(fs.existsSync(OFFICIAL_BBM_REGISTRY_PATH), true);
    const registry = await loadBbmRegistry();
    const scopes = registry.getAvailableUiScopes();
    assert.equal(scopes.some((scope) => scope.uiScope === "protokoll.topsScreen"), true);

    const result = registry.getBbmUiEditorRegistry("protokoll.topsScreen");
    assert.equal(Array.isArray(result.elements), true);
    assert.equal(result.elements.length > 0, true);
    assert.equal(result.elements.some((element) => element.id === "protokoll.root"), true);
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

  runBbmUiEditorInstalledArtifactsTests(run).then(() => {
    if (!process.exitCode) console.log("bbmUiEditorInstalledArtifacts.test.cjs passed");
  });
}

module.exports = { runBbmUiEditorInstalledArtifactsTests };
