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
    assert.equal(hasText(root, "Main / Liste"), true);
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
    assert.equal(hasText(root, "Nur lokale DEV-Vorschau - keine Speicherung"), true);
    assert.equal(hasText(root, "Kurztext: Offene Restarbeit"), true);
    assert.equal(hasText(root, "Langtext: Offene Restarbeit im Treppenhaus"), true);
    assert.equal(hasText(root, "Verortung: Treppenhaus"), true);
    assert.equal(hasText(root, "Meta: R-001 / offen"), true);
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

    const neuButton = getNodeById(root, "restarbeitenV2.quicklane.neu");
    assert.ok(neuButton);
    neuButton.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });

    const row4 = getNodeByAttr(root, "data-restarbeiten-v2-dummy-id", "R-004");
    assert.ok(row4);
    assert.equal(screen.getSelectedDummyId(), "R-004");
    assert.equal(row4.getAttribute("data-restarbeiten-v2-selected"), "true");
    assert.equal(row1.getAttribute("data-restarbeiten-v2-selected"), "false");
    assert.equal(row2.getAttribute("data-restarbeiten-v2-selected"), "false");
    assert.equal(row3.getAttribute("data-restarbeiten-v2-selected"), "false");
    assert.equal(hasText(root, "R-004 / Neue Restarbeit / Noch ohne Verortung / offen"), true);
    assert.equal(hasText(root, "Kurztext: Neue Restarbeit"), true);
    assert.equal(hasText(root, "Langtext: Lokaler DEV-Entwurf ohne Speicherung"), true);
    assert.equal(hasText(root, "Verortung: Noch ohne Verortung"), true);
    assert.equal(hasText(root, "Meta: DEV"), true);
    assert.equal(hasText(root, "Notiz: Nur lokale Vorschau"), true);
    assert.equal(hasText(root, "Ausgewählt: R-004"), true);

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
    assert.equal(hasText(root, "Kurztext: Neue Restarbeit lokal"), true);
    assert.equal(screen.getSelectedDummyId(), "R-004");

    neuButton.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });

    const row5 = getNodeByAttr(root, "data-restarbeiten-v2-dummy-id", "R-005");
    assert.ok(row5);
    assert.equal(screen.getSelectedDummyId(), "R-005");
    assert.equal(row5.getAttribute("data-restarbeiten-v2-selected"), "true");
    assert.equal(row4.getAttribute("data-restarbeiten-v2-selected"), "false");
    assert.equal(hasText(root, "R-005 / Neue Restarbeit / Noch ohne Verortung / offen"), true);
    assert.equal(hasText(root, "Kurztext: Neue Restarbeit"), true);
    assert.equal(hasText(root, "Meta: DEV"), true);

    row2.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(screen.getSelectedDummyId(), "R-002");
    assert.equal(row2.getAttribute("data-restarbeiten-v2-selected"), "true");
    assert.equal(row1.getAttribute("data-restarbeiten-v2-selected"), "false");

    const shortTextInput = getNodeByAttr(root, "data-restarbeiten-v2-field", "shortText");
    const longTextInput = getNodeByAttr(root, "data-restarbeiten-v2-field", "longText");
    const locationInput = getNodeByAttr(root, "data-restarbeiten-v2-field", "location");
    const statusSelect = getNodeByAttr(root, "data-restarbeiten-v2-field", "status");
    const noteInput = getNodeByAttr(root, "data-restarbeiten-v2-field", "note");
    assert.ok(shortTextInput);
    assert.ok(longTextInput);
    assert.ok(locationInput);
    assert.ok(statusSelect);
    assert.ok(noteInput);
    assert.equal(String(shortTextInput.value || ""), "Musterpunkt");
    assert.equal(String(longTextInput.value || ""), "Musterpunkt in der Wohnung");
    assert.equal(String(locationInput.value || ""), "Wohnung");
    assert.equal(String(statusSelect.value || ""), "erledigt");

    shortTextInput.value = "Musterpunkt aktualisiert";
    shortTextInput.oninput?.({
      target: shortTextInput,
      preventDefault() {},
      stopPropagation() {},
    });
    longTextInput.value = "Musterpunkt in der Wohnung - aktualisiert";
    longTextInput.oninput?.({
      target: longTextInput,
      preventDefault() {},
      stopPropagation() {},
    });
    locationInput.value = "Wohnung 2. OG";
    locationInput.oninput?.({
      target: locationInput,
      preventDefault() {},
      stopPropagation() {},
    });
    statusSelect.value = "offen";
    statusSelect.onchange?.({
      target: statusSelect,
      preventDefault() {},
      stopPropagation() {},
    });
    noteInput.value = "Nur lokal geaendert";
    noteInput.oninput?.({
      target: noteInput,
      preventDefault() {},
      stopPropagation() {},
    });

    assert.equal(screen.getSelectedDummyId(), "R-002");
    assert.equal(hasText(root, "Kurztext: Musterpunkt aktualisiert"), true);
    assert.equal(hasText(root, "Langtext: Musterpunkt in der Wohnung - aktualisiert"), true);
    assert.equal(hasText(root, "Verortung: Wohnung 2. OG"), true);
    assert.equal(hasText(root, "Meta: R-002 / erledigt"), true);
    assert.equal(hasText(root, "Notiz: Nur lokal geaendert"), true);
    assert.equal(hasText(root, "R-002 / Musterpunkt aktualisiert / Wohnung 2. OG / offen"), true);

    row3.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(screen.getSelectedDummyId(), "R-003");
    assert.equal(row3.getAttribute("data-restarbeiten-v2-selected"), "true");
    assert.equal(hasText(root, "Kurztext: Kontrollpunkt"), true);
    assert.equal(hasText(root, "Verortung: Außenanlage"), true);
    assert.equal(hasText(root, "Meta: R-003 / offen"), true);

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
