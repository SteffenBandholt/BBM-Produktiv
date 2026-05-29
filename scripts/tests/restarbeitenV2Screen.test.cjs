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
      value: "",
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
      appendChild(item) {
        this.append(item);
        return item;
      },
      replaceChildren(...items) {
        this.children = [];
        this.append(...items);
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
          for (const child of Array.isArray(node.children) ? node.children : []) {
            walk(child);
          }
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

function getVisibleIds(root) {
  return collectNodes(root, (node) => node?.getAttribute?.("data-restarbeiten-v2-dummy-row") === "true").map((node) =>
    node.getAttribute("data-restarbeiten-v2-dummy-id")
  );
}

function hasText(root, expected) {
  return collectNodes(root, (node) => String(node?.textContent || "").includes(expected)).length > 0;
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
  assert.equal(screenSource.includes("data-ui-inspector-id"), false);

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
  const previousWindow = globalThis.window;
  const accessLog = { localStorage: 0, db: 0 };
  const fakeWindow = {
    localStorage: {
      getItem() {
        accessLog.localStorage += 1;
        return null;
      },
      setItem() {
        accessLog.localStorage += 1;
      },
      removeItem() {
        accessLog.localStorage += 1;
      },
    },
    bbmDb: new Proxy(
      {},
      {
        get() {
          accessLog.db += 1;
          return undefined;
        },
        set() {
          accessLog.db += 1;
          return true;
        },
      }
    ),
  };

  globalThis.document = document;
  globalThis.window = fakeWindow;

  try {
    const screen = createRestarbeitenV2Screen({ registry });
    const root = screen.render(document.body);
    assert.ok(root);
    assert.equal(root.getAttribute("data-ui-v2-id"), "restarbeitenV2.root");
    assert.equal(screen.getSelectedDummyId(), "R-001");
    assert.equal(screen.getCurrentFilter(), "alle");

    const requiredIds = registry.map((entry) => entry.id);
    for (const id of requiredIds) {
      const node = getNodeById(root, id);
      assert.ok(node, `missing node for ${id}`);
    }

    assert.equal(hasText(root, "Nur lokale DEV-Vorschau - keine Speicherung"), true);
    assert.equal(getVisibleIds(root).join(","), "R-001,R-002,R-003");

    const row1 = getNodeByAttr(root, "data-restarbeiten-v2-dummy-id", "R-001");
    const row2 = getNodeByAttr(root, "data-restarbeiten-v2-dummy-id", "R-002");
    const row3 = getNodeByAttr(root, "data-restarbeiten-v2-dummy-id", "R-003");
    assert.ok(row1);
    assert.ok(row2);
    assert.ok(row3);
    assert.equal(row1.getAttribute("data-restarbeiten-v2-selected"), "true");
    assert.equal(row2.getAttribute("data-restarbeiten-v2-selected"), "false");
    assert.equal(row3.getAttribute("data-restarbeiten-v2-selected"), "false");

    const filterAlleButton = getNodeById(root, "restarbeitenV2.quicklane.filterAlle");
    const filterOffenButton = getNodeById(root, "restarbeitenV2.quicklane.filterOffen");
    const filterErledigtButton = getNodeById(root, "restarbeitenV2.quicklane.filterErledigt");
    const neuButton = getNodeById(root, "restarbeitenV2.quicklane.neu");
    assert.ok(filterAlleButton);
    assert.ok(filterOffenButton);
    assert.ok(filterErledigtButton);
    assert.ok(neuButton);
    assert.equal(filterAlleButton.getAttribute("data-restarbeiten-v2-filter-active"), "true");
    assert.equal(filterOffenButton.getAttribute("data-restarbeiten-v2-filter-active"), "false");
    assert.equal(filterErledigtButton.getAttribute("data-restarbeiten-v2-filter-active"), "false");

    filterOffenButton.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(screen.getCurrentFilter(), "offen");
    assert.equal(getVisibleIds(root).join(","), "R-001,R-003");
    assert.equal(screen.getSelectedDummyId(), "R-001");

    const statusSelect = getNodeByAttr(root, "data-restarbeiten-v2-field", "status");
    assert.ok(statusSelect);
    statusSelect.value = "erledigt";
    statusSelect.onchange?.({
      target: statusSelect,
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(screen.getSelectedDummyId(), "R-003");
    assert.equal(getVisibleIds(root).join(","), "R-003");

    filterErledigtButton.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(screen.getCurrentFilter(), "erledigt");
    assert.equal(getVisibleIds(root).join(","), "R-001,R-002");
    assert.equal(screen.getSelectedDummyId(), "R-001");

    filterOffenButton.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(screen.getCurrentFilter(), "offen");
    assert.equal(getVisibleIds(root).join(","), "R-003");
    assert.equal(screen.getSelectedDummyId(), "R-003");

    filterErledigtButton.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(screen.getCurrentFilter(), "erledigt");
    assert.equal(getVisibleIds(root).join(","), "R-001,R-002");
    assert.equal(screen.getSelectedDummyId(), "R-001");

    const currentStatusSelect = getNodeByAttr(root, "data-restarbeiten-v2-field", "status");
    assert.ok(currentStatusSelect);
    currentStatusSelect.value = "erledigt";
    currentStatusSelect.onchange?.({
      target: currentStatusSelect,
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(getVisibleIds(root).join(","), "R-001,R-002");
    assert.equal(screen.getSelectedDummyId(), "R-001");

    filterOffenButton.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(screen.getCurrentFilter(), "offen");
    assert.equal(getVisibleIds(root).join(","), "R-003");
    assert.equal(screen.getSelectedDummyId(), "R-003");

    const row3StatusSelect = getNodeByAttr(root, "data-restarbeiten-v2-field", "status");
    assert.ok(row3StatusSelect);
    row3StatusSelect.value = "erledigt";
    row3StatusSelect.onchange?.({
      target: row3StatusSelect,
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(getVisibleIds(root).join(","), "");
    assert.equal(screen.getSelectedDummyId(), null);

    filterAlleButton.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(screen.getCurrentFilter(), "alle");
    assert.equal(getVisibleIds(root).join(","), "R-001,R-002,R-003");

    neuButton.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });

    const row4 = getNodeByAttr(root, "data-restarbeiten-v2-dummy-id", "R-004");
    assert.ok(row4);
    assert.equal(screen.getCurrentFilter(), "alle");
    assert.equal(screen.getSelectedDummyId(), "R-004");
    assert.equal(getVisibleIds(root).join(","), "R-001,R-002,R-003,R-004");
    assert.equal(hasText(root, "R-004 / Neue Restarbeit / Noch ohne Verortung / offen"), true);

    const newShortTextInput = getNodeByAttr(root, "data-restarbeiten-v2-field", "shortText");
    const newLongTextInput = getNodeByAttr(root, "data-restarbeiten-v2-field", "longText");
    const newLocationInput = getNodeByAttr(root, "data-restarbeiten-v2-field", "location");
    const newStatusSelect = getNodeByAttr(root, "data-restarbeiten-v2-field", "status");
    const newNoteInput = getNodeByAttr(root, "data-restarbeiten-v2-field", "note");
    assert.ok(newShortTextInput);
    assert.ok(newLongTextInput);
    assert.ok(newLocationInput);
    assert.ok(newStatusSelect);
    assert.ok(newNoteInput);
    assert.equal(String(newShortTextInput.value || ""), "Neue Restarbeit");
    assert.equal(String(newLongTextInput.value || ""), "Lokaler DEV-Entwurf ohne Speicherung");
    assert.equal(String(newLocationInput.value || ""), "Noch ohne Verortung");
    assert.equal(String(newStatusSelect.value || ""), "offen");
    assert.equal(String(newNoteInput.value || ""), "Nur lokale Vorschau");

    newShortTextInput.value = "Neue Restarbeit lokal";
    newShortTextInput.oninput?.({
      target: newShortTextInput,
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(hasText(root, "R-004 / Neue Restarbeit lokal / Noch ohne Verortung / offen"), true);
    assert.equal(screen.getSelectedDummyId(), "R-004");

    assert.equal(screenSource.includes("Router"), false);
    assert.equal(screenSource.includes("MainHeader"), false);
    assert.equal(screenSource.includes("ipc"), false);
    assert.equal(screenSource.includes("db"), false);
    assert.equal(screenSource.includes("localStorage"), false);
    assert.equal(accessLog.localStorage, 0);
    assert.equal(accessLog.db, 0);
    assert.equal(typeof fakeWindow.ipcRenderer, "undefined");

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
    globalThis.window = previousWindow;
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






