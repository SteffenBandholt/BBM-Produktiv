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
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  const screenPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/RestarbeitenV2Screen.js");
  const dummyDataPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2DummyData.js");
  const viewModelPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2ViewModel.js");
  const domPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2Dom.js");
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

  const helperSources = [
    fs.readFileSync(dummyDataPath, "utf8"),
    fs.readFileSync(viewModelPath, "utf8"),
    fs.readFileSync(domPath, "utf8"),
  ];
  for (const helperSource of helperSources) {
    assert.equal(helperSource.includes("ipc"), false);
    assert.equal(helperSource.includes("indexedDB"), false);
    assert.equal(helperSource.includes("localStorage"), false);
    assert.equal(helperSource.includes("autosave"), false);
    assert.equal(helperSource.includes("save"), false);
    assert.equal(helperSource.includes("db"), false);
  }

  const { createRestarbeitenV2Screen } = await importEsmFromFile(screenPath);
  const {
    createInitialRestarbeitenV2DummyItems,
    createNextRestarbeitenV2DummyItem,
  } = await importEsmFromFile(dummyDataPath);
  const {
    findRestarbeitenV2Item,
    getNextSelectedRestarbeitenV2Id,
    getVisibleRestarbeitenV2Items,
    normalizeRestarbeitenV2Filter,
    updateRestarbeitenV2Item,
  } = await importEsmFromFile(viewModelPath);
  const { createRestarbeitenV2Registry } = await importEsmFromFile(registryPath);
  const { validateEditorV2Registry } = await importEsmFromFile(editorRegistryPath);

  assert.equal(typeof createRestarbeitenV2Screen, "function");
  assert.equal(typeof createInitialRestarbeitenV2DummyItems, "function");
  assert.equal(typeof createNextRestarbeitenV2DummyItem, "function");
  assert.equal(typeof findRestarbeitenV2Item, "function");
  assert.equal(typeof getNextSelectedRestarbeitenV2Id, "function");
  assert.equal(typeof getVisibleRestarbeitenV2Items, "function");
  assert.equal(typeof normalizeRestarbeitenV2Filter, "function");
  assert.equal(typeof updateRestarbeitenV2Item, "function");

  const initialDummyItems = createInitialRestarbeitenV2DummyItems();
  assert.equal(initialDummyItems.map((item) => item.id).join(","), "R-001,R-002,R-003");
  assert.equal(normalizeRestarbeitenV2Filter("Alle"), "alle");
  assert.equal(normalizeRestarbeitenV2Filter("offen"), "offen");
  assert.equal(normalizeRestarbeitenV2Filter("Erledigt"), "erledigt");
  assert.equal(normalizeRestarbeitenV2Filter(""), "alle");
  assert.equal(getVisibleRestarbeitenV2Items(initialDummyItems, "alle").map((item) => item.id).join(","), "R-001,R-002,R-003");
  assert.equal(getVisibleRestarbeitenV2Items(initialDummyItems, "offen").map((item) => item.id).join(","), "R-001,R-003");
  assert.equal(getVisibleRestarbeitenV2Items(initialDummyItems, "erledigt").map((item) => item.id).join(","), "R-002");
  assert.equal(getNextSelectedRestarbeitenV2Id(initialDummyItems, "alle", "R-002"), "R-002");
  assert.equal(getNextSelectedRestarbeitenV2Id(initialDummyItems, "offen", "R-002"), "R-001");
  assert.equal(getNextSelectedRestarbeitenV2Id(initialDummyItems, "erledigt", "R-001"), "R-002");
  assert.equal(getNextSelectedRestarbeitenV2Id([], "alle", "R-001"), null);

  const nextDummyItem = createNextRestarbeitenV2DummyItem(initialDummyItems);
  assert.equal(nextDummyItem.id, "R-004");
  const nextDummyItem2 = createNextRestarbeitenV2DummyItem([...initialDummyItems, nextDummyItem]);
  assert.equal(nextDummyItem2.id, "R-005");
  const patchedDummyItems = updateRestarbeitenV2Item(initialDummyItems, "R-002", { shortText: "Geaendert" });
  assert.equal(findRestarbeitenV2Item(patchedDummyItems, "R-001").shortText, "Offene Restarbeit");
  assert.equal(findRestarbeitenV2Item(patchedDummyItems, "R-002").shortText, "Geaendert");
  assert.equal(findRestarbeitenV2Item(patchedDummyItems, "R-003").shortText, "Kontrollpunkt");

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

    const dataSourceCalls = { list: 0, create: 0, update: 0, delete: 0, attachments: 0 };
    const dataSourceRows = [
      {
        restarbeit_id: "R-101",
        number: "R-101",
        title: "Geladene Offen",
        location: "Haus A",
        state: "open",
        completion_note: "Meta geladen",
        note: "Nur DS",
        attachments: ["foto-1.jpg"],
        responsible_firm_id: "f-1",
        responsible_firm_name: "Firma A",
        due_date: "2026-06-01",
        created_at: "2026-05-01",
        updated_at: "2026-05-02",
        completed_at: null,
      },
      {
        restarbeit_id: "R-102",
        lfd_nr: "R-102",
        kurz_text: "Geladene Erledigt",
        lang_text: "Lang geladen",
        ort: "Haus B",
        status: "done",
        note_meta: "Meta 2",
        note: "Nur DS 2",
        photos: [],
      },
    ];
    const dataSource = {
      listRestarbeitenV2(projectId) {
        dataSourceCalls.list += 1;
        assert.equal(projectId, "project-42");
        return Promise.resolve(dataSourceRows);
      },
      createRestarbeitV2() {
        dataSourceCalls.create += 1;
        return Promise.reject(new Error("create should not be called"));
      },
      updateRestarbeitV2() {
        dataSourceCalls.update += 1;
        return Promise.reject(new Error("update should not be called"));
      },
      deleteRestarbeitV2() {
        dataSourceCalls.delete += 1;
        return Promise.reject(new Error("delete should not be called"));
      },
      listRestarbeitV2Attachments() {
        dataSourceCalls.attachments += 1;
        return Promise.reject(new Error("attachments should not be called"));
      },
    };

    const document2 = createFakeDocument();
    globalThis.document = document2;
    globalThis.window = fakeWindow;
    const screenWithDataSource = createRestarbeitenV2Screen({
      registry,
      dataSource,
      projectId: "project-42",
      useDataSource: true,
    });
    const rootWithDataSource = screenWithDataSource.render(document2.body);
    assert.ok(rootWithDataSource);
    assert.equal(screenWithDataSource.getSelectedDummyId(), null);
    assert.equal(hasText(rootWithDataSource, "Daten werden geladen"), true);
    await flush();
    assert.equal(dataSourceCalls.list, 1);
    assert.equal(dataSourceCalls.create, 0);
    assert.equal(dataSourceCalls.update, 0);
    assert.equal(dataSourceCalls.delete, 0);
    assert.equal(dataSourceCalls.attachments, 0);
    assert.equal(screenWithDataSource.getSelectedDummyId(), "R-101");
    assert.equal(screenWithDataSource.getCurrentFilter(), "alle");
    assert.equal(getVisibleIds(rootWithDataSource).join(","), "R-101,R-102");
    assert.equal(hasText(rootWithDataSource, "R-101 / Geladene Offen / Haus A / offen"), true);
    assert.equal(hasText(rootWithDataSource, "R-102 / Geladene Erledigt / Haus B / erledigt"), true);
    assert.equal(hasText(rootWithDataSource, "Ausgew"), true);
    assert.equal(hasText(rootWithDataSource, "Nur lokale DEV-Vorschau - keine Speicherung"), true);

    const dsShortTextInput = getNodeByAttr(rootWithDataSource, "data-restarbeiten-v2-field", "shortText");
    const dsNeuButton = getNodeById(rootWithDataSource, "restarbeitenV2.quicklane.neu");
    const dsFilterOffenButton = getNodeById(rootWithDataSource, "restarbeitenV2.quicklane.filterOffen");
    const dsFilterErledigtButton = getNodeById(rootWithDataSource, "restarbeitenV2.quicklane.filterErledigt");
    assert.ok(dsShortTextInput);
    assert.ok(dsNeuButton);
    assert.ok(dsFilterOffenButton);
    assert.ok(dsFilterErledigtButton);

    dsShortTextInput.value = "Geladene Offen lokal";
    dsShortTextInput.oninput?.({
      target: dsShortTextInput,
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(dataSourceCalls.update, 0);
    assert.equal(hasText(rootWithDataSource, "R-101 / Geladene Offen lokal / Haus A / offen"), true);

    dsNeuButton.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(dataSourceCalls.create, 0);
    assert.equal(screenWithDataSource.getSelectedDummyId(), "R-103");
    assert.equal(getVisibleIds(rootWithDataSource).join(","), "R-101,R-102,R-103");

    dsFilterOffenButton.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(getVisibleIds(rootWithDataSource).join(","), "R-101,R-103");
    assert.equal(screenWithDataSource.getSelectedDummyId(), "R-103");

    dsFilterErledigtButton.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(getVisibleIds(rootWithDataSource).join(","), "R-102");
    assert.equal(screenWithDataSource.getSelectedDummyId(), "R-102");

    const dataSourceMissingProject = {
      listCalls: 0,
      listRestarbeitenV2() {
        dataSourceMissingProject.listCalls += 1;
        return Promise.resolve([]);
      },
    };
    const document3 = createFakeDocument();
    globalThis.document = document3;
    globalThis.window = fakeWindow;
    const screenWithoutProject = createRestarbeitenV2Screen({
      registry,
      dataSource: dataSourceMissingProject,
      useDataSource: true,
    });
    const rootWithoutProject = screenWithoutProject.render(document3.body);
    assert.ok(rootWithoutProject);
    await flush();
    assert.equal(dataSourceMissingProject.listCalls, 0);
    assert.equal(hasText(rootWithoutProject, "Projektkontext fehlt"), true);
    assert.equal(screenWithoutProject.getSelectedDummyId(), null);

    const failingDataSource = {
      listCalls: 0,
      listRestarbeitenV2() {
        failingDataSource.listCalls += 1;
        return Promise.reject(new Error("DS kaputt"));
      },
    };
    const document4 = createFakeDocument();
    globalThis.document = document4;
    globalThis.window = fakeWindow;
    const screenWithError = createRestarbeitenV2Screen({
      registry,
      dataSource: failingDataSource,
      projectId: "project-43",
      useDataSource: true,
    });
    const rootWithError = screenWithError.render(document4.body);
    assert.ok(rootWithError);
    await flush();
    assert.equal(failingDataSource.listCalls, 1);
    assert.equal(hasText(rootWithError, "DataSource-Fehler"), true);
    assert.equal(screenWithError.getSelectedDummyId(), null);

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

