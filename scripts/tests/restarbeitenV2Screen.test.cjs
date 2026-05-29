const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createFakeDocument() {
  function createNode(tagName, doc) {
    return {
      tagName: String(tagName || "").toUpperCase(),
      ownerDocument: doc,
      children: [],
      parentElement: null,
      textContent: "",
      style: {},
      attributes: {},
      append(...items) {
        for (const item of items) {
          if (item && typeof item === "object") {
            item.parentElement = this;
            item.ownerDocument = doc;
          }
          this.children.push(item);
        }
      },
      removeChild(item) {
        this.children = this.children.filter((entry) => entry !== item);
        if (item && typeof item === "object") item.parentElement = null;
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      getAttribute(name) {
        return this.attributes[name] ?? null;
      },
      querySelectorAll(selector) {
        const all = [];
        const walk = (node) => {
          if (!node || typeof node !== "object") return;
          all.push(node);
          for (const child of Array.isArray(node.children) ? node.children : []) walk(child);
        };
        walk(this);
        const match = String(selector || "").match(/data-ui-v2-id\s*=\s*["']([^"']+)["']/);
        if (!match) return [];
        return all.filter((node) => node?.getAttribute?.("data-ui-v2-id") === match[1]);
      },
      querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
      },
    };
  }

  const document = {
    createElement(tagName) {
      return createNode(tagName, document);
    },
  };

  document.body = createNode("body", document);
  return document;
}

function collectNodes(node, predicate, acc = []) {
  if (!node || typeof node !== "object") return acc;
  if (predicate(node)) acc.push(node);
  for (const child of Array.isArray(node.children) ? node.children : []) {
    collectNodes(child, predicate, acc);
  }
  return acc;
}

function getNodeById(root, id) {
  return collectNodes(root, (node) => node?.getAttribute?.("data-ui-v2-id") === id)[0] || null;
}

function getNodeByAttr(root, name, value) {
  return collectNodes(root, (node) => node?.getAttribute?.(name) === value)[0] || null;
}

function hasText(root, expected) {
  return collectNodes(root, (node) => String(node?.textContent || "").includes(expected)).length > 0;
}

function getDepthMap(registry) {
  const map = new Map(registry.map((entry) => [entry.id, entry]));
  const depthMemo = new Map();
  function depthOf(id) {
    if (depthMemo.has(id)) return depthMemo.get(id);
    const entry = map.get(id);
    if (!entry?.parentId) {
      depthMemo.set(id, 1);
      return 1;
    }
    const depth = 1 + depthOf(entry.parentId);
    depthMemo.set(id, depth);
    return depth;
  }
  return { depthOf };
}

async function runRestarbeitenV2ScreenTests(run) {
  const screenPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/RestarbeitenV2Screen.js");
  const registryPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2Registry.js");
  const editorRegistryPath = path.join(__dirname, "../../src/renderer/uiV2/editorV2/editorV2Registry.js");

  const screenSource = fs.readFileSync(screenPath, "utf8");
  assert.equal(screenSource.includes("old-restarbeiten"), false);
  assert.equal(screenSource.includes("ipcRenderer"), false);
  assert.equal(screenSource.includes("indexedDB"), false);
  assert.equal(screenSource.includes("localStorage"), false);
  assert.equal(screenSource.includes("autosave"), false);
  assert.equal(screenSource.includes("uiInspector"), false);

  const { createRestarbeitenV2Screen } = await importEsmFromFile(screenPath);
  const { createRestarbeitenV2Registry } = await importEsmFromFile(registryPath);
  const { validateEditorV2Registry } = await importEsmFromFile(editorRegistryPath);

  assert.equal(typeof createRestarbeitenV2Screen, "function");

  const registry = createRestarbeitenV2Registry();
  const validation = validateEditorV2Registry(registry);
  assert.equal(validation.valid, true);
  assert.equal(validation.errors.length, 0);

  const document = createFakeDocument();
  const previousDocument = globalThis.document;
  globalThis.document = document;

  try {
    const screen = createRestarbeitenV2Screen({ registry });
    const root = screen.render(document.body);
    assert.ok(root);
    assert.equal(root.getAttribute("data-ui-v2-id"), "restarbeitenV2.root");

    const requiredIds = registry.map((entry) => entry.id);
    for (const id of requiredIds) {
      const node = getNodeById(root, id);
      assert.ok(node, `missing node for ${id}`);
    }

    for (const entry of registry) {
      const node = getNodeById(root, entry.id);
      assert.equal(node.getAttribute("data-ui-v2-id"), entry.id);
      assert.equal(node.getAttribute("data-ui-v2-kind"), entry.kind);
      assert.equal(node.getAttribute("data-ui-v2-label"), entry.label);
      assert.equal(node.getAttribute("data-ui-v2-editable"), entry.editable ? "true" : "false");
      assert.equal(node.getAttribute("data-ui-v2-ops"), Array.isArray(entry.ops) ? entry.ops.join(",") : "");
      if (entry.parentId) {
        assert.equal(node.getAttribute("data-ui-v2-parent"), entry.parentId);
      } else {
        assert.equal(node.getAttribute("data-ui-v2-parent"), null);
      }
      assert.equal(root.querySelector(entry.selector), node);
    }

    const depthMap = getDepthMap(registry);
    for (const entry of registry) {
      assert.equal(depthMap.depthOf(entry.id) <= 4, true, `depth too deep for ${entry.id}`);
    }

    const quicklane = getNodeById(root, "restarbeitenV2.quicklane");
    assert.ok(quicklane);
    assert.equal(quicklane.style.display, "flex");
    assert.equal(quicklane.style.flexDirection, "column");
    assert.equal(quicklane.style.gridArea, "quicklane");
    assert.equal(quicklane.style.borderLeft, "1px solid rgba(0,0,0,0.12)");

    const footer = getNodeById(root, "restarbeitenV2.footer");
    assert.ok(footer);
    assert.equal(footer.style.gridArea, "footer");

    const main = getNodeById(root, "restarbeitenV2.main");
    assert.ok(main);
    assert.equal(main.style.gridArea, "main");

    const header = getNodeById(root, "restarbeitenV2.header");
    assert.ok(header);
    assert.equal(header.style.gridArea, "header");
    assert.equal(hasText(root, "Restarbeiten V2"), true);
    assert.equal(hasText(root, "Projekt / Bereich / Stand"), true);
    assert.equal(hasText(root, "Offen / Erledigt / Gesamt"), true);
    assert.equal(hasText(root, "Suche / Status / Verortung"), true);
    assert.equal(hasText(root, "Quicklane rechts"), true);
    assert.equal(hasText(root, "Lock / Fixieren"), true);
    assert.equal(hasText(root, "Neu"), true);
    assert.equal(hasText(root, "Offen"), true);
    assert.equal(hasText(root, "Erledigt"), true);
    assert.equal(hasText(root, "Alle"), true);
    assert.equal(hasText(root, "Foto"), true);
    assert.equal(hasText(root, "Diktat"), true);
    assert.equal(hasText(root, "R-001 / Offene Restarbeit / Treppenhaus / offen"), true);
    assert.equal(hasText(root, "R-002 / Musterpunkt / Wohnung / erledigt"), true);
    assert.equal(hasText(root, "R-003 / Kontrollpunkt / Außenanlage / offen"), true);
    assert.equal(hasText(root, "Footer / Workbench"), true);
    assert.equal(hasText(root, "Kurztext"), true);
    assert.equal(hasText(root, "Langtext"), true);
    assert.equal(hasText(root, "Verortung"), true);
    assert.equal(hasText(root, "Meta"), true);
    assert.equal(hasText(root, "Fotos"), true);
    assert.equal(hasText(root, "Notiz"), true);
    assert.equal(hasText(root, "Kurztext: Offene Restarbeit"), true);
    assert.equal(hasText(root, "Langtext: Offene Restarbeit im Treppenhaus"), true);
    assert.equal(hasText(root, "Verortung: Treppenhaus"), true);
    assert.equal(hasText(root, "Meta / Status: offen"), true);
    assert.equal(hasText(root, "Fotos: Keine Fotos"), true);
    assert.equal(hasText(root, "Notiz: Platzhalternotiz"), true);
    const row1 = getNodeByAttr(root, "data-restarbeiten-v2-dummy-id", "R-001");
    const row2 = getNodeByAttr(root, "data-restarbeiten-v2-dummy-id", "R-002");
    const row3 = getNodeByAttr(root, "data-restarbeiten-v2-dummy-id", "R-003");
    assert.ok(row1);
    assert.ok(row2);
    assert.ok(row3);
    assert.equal(row1.getAttribute("data-restarbeiten-v2-selected"), "true");
    assert.equal(row2.getAttribute("data-restarbeiten-v2-selected"), "false");
    assert.equal(row3.getAttribute("data-restarbeiten-v2-selected"), "false");
    row2.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(row2.getAttribute("data-restarbeiten-v2-selected"), "true");
    assert.equal(row1.getAttribute("data-restarbeiten-v2-selected"), "false");
    assert.equal(hasText(root, "Kurztext: Musterpunkt"), true);
    assert.equal(hasText(root, "Langtext: Musterpunkt in der Wohnung"), true);
    assert.equal(hasText(root, "Verortung: Wohnung"), true);
    assert.equal(hasText(root, "Meta / Status: erledigt"), true);
    row3.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(row3.getAttribute("data-restarbeiten-v2-selected"), "true");
    assert.equal(hasText(root, "Kurztext: Kontrollpunkt"), true);
    assert.equal(hasText(root, "Verortung: Außenanlage"), true);
    assert.equal(hasText(root, "Meta / Status: offen"), true);

    assert.equal(screenSource.includes("Router"), false);
    assert.equal(screenSource.includes("MainHeader"), false);
    assert.equal(screenSource.includes("ipc"), false);
    assert.equal(screenSource.includes("db"), false);
    assert.equal(screenSource.includes("localStorage"), false);

    const diffFiles = execFileSync("git", ["diff", "--name-only"], {
      cwd: path.join(__dirname, "../.."),
      encoding: "utf8",
    })
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/restarbeiten/")), false);
    assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/protokoll/")), false);
    assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);
  } finally {
    globalThis.document = previousDocument;
  }

  await run("Restarbeiten V2 Screen-Skeleton rendert die UI-V2-Grundstruktur", () => undefined);
}

if (require.main === module) {
  const run = async (name, fn) => {
    try {
      const out = fn();
      if (out && typeof out.then === "function") await out;
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
      process.exitCode = 1;
    }
  };

  runRestarbeitenV2ScreenTests(run).then(() => {
    if (!process.exitCode) console.log("restarbeitenV2Screen.test.cjs passed");
  });
}

module.exports = { runRestarbeitenV2ScreenTests };
