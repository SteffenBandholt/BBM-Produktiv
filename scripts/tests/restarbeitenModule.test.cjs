const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createFakeDocument() {
  const createNode = (tag, doc) => {
    const node = {
      tagName: String(tag || "").toUpperCase(),
      ownerDocument: doc,
      children: [],
      parentElement: null,
      style: {},
      dataset: {},
      attributes: {},
      className: "",
      textContent: "",
      disabled: false,
      value: "",
      type: "",
      append(...nodes) {
        for (const child of nodes) this.appendChild(child);
      },
      appendChild(child) {
        if (child && typeof child === "object") child.parentElement = this;
        this.children.push(child);
        return child;
      },
      replaceChildren(...nodes) {
        this.children = [];
        this.append(...nodes);
      },
      setAttribute(name, value) {
        const key = String(name);
        const text = String(value);
        this.attributes[key] = text;
        if (key.startsWith("data-")) {
          const dataKey = key.slice(5).replace(/-([a-z])/g, (_match, char) => char.toUpperCase());
          this.dataset[dataKey] = text;
        }
      },
      getAttribute(name) {
        const key = String(name);
        return Object.prototype.hasOwnProperty.call(this.attributes, key) ? this.attributes[key] : null;
      },
      removeAttribute(name) {
        delete this.attributes[String(name)];
      },
      addEventListener(type, handler) {
        this._listeners ||= {};
        this._listeners[type] ||= [];
        this._listeners[type].push(handler);
      },
      click() {
        for (const handler of this._listeners?.click || []) {
          handler.call(this, { type: "click", preventDefault() {} });
        }
      },
    };
    Object.defineProperty(node, "innerHTML", {
      get() {
        return "";
      },
      set() {
        this.children = [];
        this.textContent = "";
      },
    });
    return node;
  };

  const doc = {
    createElement(tag) {
      return createNode(tag, doc);
    },
    createElementNS(_ns, tag) {
      return createNode(tag, doc);
    },
    body: null,
    head: null,
  };
  doc.body = createNode("body", doc);
  doc.head = createNode("head", doc);
  return doc;
}

function collectText(node) {
  if (typeof node === "string") return node;
  const ownText = String(node?.textContent || "");
  const children = Array.isArray(node?.children) ? node.children : [];
  return [ownText, ...children.map((child) => collectText(child))].join(" ");
}

function findNodes(node, predicate, acc = []) {
  if (!node || typeof node !== "object") return acc;
  if (predicate(node)) acc.push(node);
  for (const child of Array.isArray(node?.children) ? node.children : []) {
    findNodes(child, predicate, acc);
  }
  return acc;
}

function collectOptions(node) {
  return findNodes(node, (entry) => entry.tagName === "OPTION").map((entry) => ({
    value: entry.value,
    label: entry.textContent,
  }));
}

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

function buildBbmDbStub() {
  return {
    async restarbeitenListByProject() {
      return {
        ok: true,
        items: [
          {
            id: "ra-1",
            running_number: 7,
            created_at: "2026-06-01",
            item_class: "mangel",
            status: "offen",
            due_date: "2026-06-12",
            responsible_label: "Mueller Trockenbau",
            short_text: "Abdichtung im Bad fehlt",
            long_text: "Abdichtung im Bereich Dusche unvollstaendig.",
            location_level_1: "Haus A",
            location_level_2: "EG",
            location_level_3: "Wohnung 2",
            location_level_4: "Bad",
          },
          {
            id: "ra-2",
            running_number: 12,
            created_at: "2026-06-03",
            item_class: "rest",
            status: "in arbeit",
            due_date: "2026-06-22",
            responsible_label: "AB Bau",
            short_text: "Tuer einstellen",
            long_text: "Druecker schleift.",
            location_level_1: "EG",
            location_level_2: "Flur",
            location_level_3: "",
            location_level_4: "",
          },
        ],
      };
    },
    async restarbeitenGetProjectSettings() {
      return {
        ok: true,
        settings: {
          level_1_label: "Haus",
          level_2_label: "Geschoss",
          level_3_label: "Einheit",
          level_4_label: "Raum",
        },
      };
    },
    async projectFirmsListByProject() {
      return { ok: true, list: [{ id: "firm-1", shortName: "AB Bau" }] };
    },
    async restarbeitenCreateItem() {
      return { ok: true, item: { id: "ra-new" } };
    },
    async restarbeitenUpdateItem() {
      return { ok: true, item: { id: "ra-1" } };
    },
    async restarbeitenSoftDeleteItem() {
      return { ok: true, item: { id: "ra-1" } };
    },
  };
}

async function renderRouteScreen() {
  const Router = (await importEsmFromFile(path.join(__dirname, "../../src/renderer/app/Router.js"))).default;
  const prevDocument = globalThis.document;
  const prevWindow = globalThis.window;
  const doc = createFakeDocument();
  const contentRoot = doc.createElement("main");
  globalThis.document = doc;
  globalThis.window = {
    localStorage: { getItem: () => "" },
    bbmDb: buildBbmDbStub(),
    dispatchEvent() {},
    addEventListener() {},
    getComputedStyle: () => ({
      position: "static",
      display: "block",
      visibility: "visible",
      pointerEvents: "auto",
      zIndex: "0",
    }),
  };

  try {
    const router = new Router({ contentRoot });
    router._ensureProjectContextQuicklane = async () => null;
    router._syncProjectContextUi = async () => {};
    router._setSidebarVisibility = (visible) => {
      router._lastSidebarVisible = visible;
    };
    const opened = await router.openProjectModule("p-1", "restarbeiten", {
      project: { id: "p-1", project_number: "P-1", short: "Test" },
    });
    await flush();
    return { root: contentRoot, pageTitle: router.context.ui.pageTitle, sidebarVisible: router._lastSidebarVisible };
  } finally {
    globalThis.document = prevDocument;
    globalThis.window = prevWindow;
  }
}

async function runRestarbeitenModuleTests(run) {
  const [restarbeitenModule, screenResolver, workspaceModule] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/index.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleEntryScreenResolver.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js")),
  ]);

  await run("Restarbeiten: Modulentry bleibt erreichbar", () => {
    const entry = restarbeitenModule.getRestarbeitenModuleEntry();
    assert.equal(entry.moduleId, "restarbeiten");
    assert.equal(entry.moduleLabel, "Restarbeiten");
    assert.equal(entry.workScreenId, "restarbeitenWork");
    assert.equal(entry.navigation.project[0].key, "restarbeiten");
    assert.equal(entry.shell.hideSidebar, true);
    assert.equal(typeof screenResolver.resolveModuleWorkScreenFromEntry(entry), "function");
  });

  await run("Restarbeiten: Projektkachel ruft Modulroute auf", async () => {
    const calls = [];
    const screen = new workspaceModule.default({
      router: {
        currentProjectId: "22",
        async openProjectModule(projectId, moduleId, options) {
          calls.push({ projectId, moduleId, options });
          return { ok: true };
        },
      },
      projectId: "22",
      project: { id: "22", name: "Test" },
    });

    assert.equal(await screen.openProjectModule("restarbeiten"), true);
    const call = calls.find((entry) => entry.moduleId === "restarbeiten");
    assert.equal(call.projectId, "22");
    assert.equal(call.options.project.id, "22");
  });

  await run("Restarbeiten: aktive Route zeigt den M1-Screen statt Platzhalter", async () => {
    const rendered = await renderRouteScreen();
    const text = collectText(rendered.root);
    assert.equal(rendered.pageTitle, "Restarbeiten");
    assert.equal(rendered.sidebarVisible, false);
    assert.equal(text.includes("Restarbeitenliste wird neu aufgebaut."), false);
    assert.equal(text.includes("Verortung"), true);
    assert.equal(text.includes("Tuer einstellen"), true);
    assert.equal(text.includes("Kurztext / Gegenstand"), true);
    assert.equal(text.includes("Datensatz l"), true);
  });

  await run("Restarbeiten: Main/Body rendert M2.1-Tabellenkopf und Datensatzzeilen", async () => {
    const rendered = await renderRouteScreen();
    const text = collectText(rendered.root);
    assert.equal(text.includes("Nr."), true);
    assert.equal(text.includes("Gegenstand"), true);
    assert.equal(text.includes("Fertig bis"), true);
    assert.equal(text.includes("Status"), true);
    assert.equal(text.includes("Verantw."), true);
    assert.equal(text.includes("Ampel"), false);
    assert.equal(text.includes("7"), true);
    assert.equal(text.includes("01.06.26"), true);
    assert.equal(text.includes("Mangel"), true);
    assert.equal(text.includes("12"), true);
    assert.equal(text.includes("03.06.26"), true);
    assert.equal(text.includes("Restarbeit"), true);
    assert.equal(text.includes("Haus A \u00b7 EG \u00b7 Wohnung 2 \u00b7 Bad"), true);
    assert.equal(text.includes("Abdichtung im Bad fehlt"), true);
    assert.equal(text.includes("Abdichtung im Bereich Dusche unvollstaendig."), true);
    assert.equal(text.includes("12.06.26"), true);
    assert.equal(text.includes("offen"), true);
    assert.equal(text.includes("Mueller Trockenbau"), true);
    assert.equal(text.includes("Fertig bis:"), false);
    assert.equal(text.includes("Status:"), false);
    assert.equal(text.includes("Verantwortlich:"), false);
  });

  await run("Restarbeiten: Screen stellt Quicklane-Methoden und M1-Bereiche bereit", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
    );
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    globalThis.document = createFakeDocument();
    globalThis.window = { bbmDb: buildBbmDbStub(), dispatchEvent() {} };
    try {
      const screen = new mod.default({ projectId: "p-1", project: { id: "p-1" } });
      const root = screen.render();
      await flush();
      assert.equal(root.getAttribute("data-ui-editor-id"), "restarbeiten.root");
      assert.equal(typeof screen.toggleAmpelDisplay, "function");
      assert.equal(typeof screen.toggleLongtextDisplay, "function");
      assert.equal(typeof screen.openRestarbeitenPreview, "function");
      assert.equal(typeof screen.openRestarbeitenOutput, "function");
      assert.equal(findNodes(root, (node) => node.getAttribute?.("data-ui-editor-id") === "restarbeiten.filterbar").length, 1);
      assert.equal(findNodes(root, (node) => node.getAttribute?.("data-ui-editor-id") === "restarbeiten.main").length, 1);
      assert.equal(findNodes(root, (node) => node.getAttribute?.("data-ui-editor-id") === "restarbeiten.editbox").length, 1);
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Restarbeiten: Datenzugang bleibt importierbar", async () => {
    const dataSource = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js")
    );
    const viewModel = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/viewModel/restarbeitenListItems.js")
    );
    assert.equal(typeof dataSource.listRestarbeitenByProject, "function");
    assert.equal(typeof dataSource.getRestarbeitenProjectSettings, "function");
    assert.equal(typeof dataSource.listRestarbeitAttachments, "function");
    assert.equal(typeof dataSource.listResponsibleProjectFirms, "function");
    assert.equal(typeof dataSource.softDeleteRestarbeitItem, "function");
    assert.equal(typeof viewModel.toRestarbeitenListItems, "function");
    const [rest, emptyLocation] = viewModel.toRestarbeitenListItems([
      { id: "r", item_class: "rest", running_number: 1, location_level_1: "EG", location_level_2: "Flur" },
      { id: "e", item_class: "mangel", running_number: 2 },
    ]);
    assert.equal(rest.itemClassLabel, "Restarbeit");
    assert.equal(rest.locationLine, "EG \u00b7 Flur");
    assert.equal(emptyLocation.locationLine, "\u2014");
  });

  await run("Restarbeiten: Statusauswahlen enthalten die verbindlichen Werte", async () => {
    const [filterbar, editbox] = await Promise.all([
      importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/RestarbeitenFilterbar.js")),
      importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/RestarbeitenEditbox.js")),
    ]);
    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const filterOptions = collectOptions(filterbar.buildRestarbeitenFilterbar());
      const editOptions = collectOptions(editbox.buildRestarbeitenEditbox());
      for (const expected of [
        { value: "offen", label: "Offen" },
        { value: "in arbeit", label: "In Arbeit" },
        { value: "erledigt", label: "Erledigt" },
        { value: "verzug", label: "Verzug" },
      ]) {
        assert.equal(filterOptions.some((option) => option.value === expected.value && option.label === expected.label), true, `filter ${expected.value}`);
        assert.equal(editOptions.some((option) => option.value === expected.value && option.label === expected.label), true, `editbox ${expected.value}`);
      }
    } finally {
      globalThis.document = prevDocument;
    }
  });

  await run("Restarbeiten: Ampellogik nutzt keine Orange-Regel", async () => {
    const viewModel = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/viewModel/restarbeitenListItems.js")
    );
    const today = new Date(Date.UTC(2026, 5, 5));
    const cases = [
      [{ status: "verzug" }, "rot"],
      [{ status: "erledigt" }, "gruen"],
      [{ status: "offen" }, "neutral"],
      [{ status: "offen", due_date: "2026-06-05" }, "gruen"],
      [{ status: "offen", due_date: "2026-06-20" }, "gruen"],
      [{ status: "offen", due_date: "2026-06-04" }, "rot"],
      [{ status: "in arbeit" }, "neutral"],
      [{ status: "in arbeit", due_date: "2026-06-20" }, "gruen"],
      [{ status: "in arbeit", due_date: "2026-06-04" }, "rot"],
      [{ status: "in_arbeit", due_date: "2026-06-20" }, "gruen"],
    ];
    const states = cases.map(([row, expected]) => {
      const actual = viewModel.getRestarbeitenAmpelState(row, today);
      assert.equal(actual, expected, JSON.stringify(row));
      return actual;
    });
    assert.equal(states.includes("orange"), false);
    assert.equal(viewModel.mapRestarbeitenStatusLabel("geprueft_erledigt"), "offen");
    assert.equal(viewModel.mapRestarbeitenStatusLabel("zurueckgewiesen"), "offen");
    assert.equal(viewModel.getRestarbeitenAmpelState({ status: "geprueft_erledigt" }, today), "neutral");
    assert.equal(viewModel.getRestarbeitenAmpelState({ status: "zurueckgewiesen" }, today), "neutral");
  });

  await run("Restarbeiten: UI-Editor-Elementliste fuer M1 ist gueltig", async () => {
    const uiEditor = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/uiEditor/restarbeitenUiElements.js")
    );
    const elements = uiEditor.getRestarbeitenUiEditorElements();
    const ids = new Set(elements.map((element) => element.id));
    assert.equal(uiEditor.RESTARBEITEN_UI_EDITOR_SCOPE, "restarbeiten.screen");
    assert.equal(Array.isArray(elements), true);
    assert.equal(ids.has("restarbeiten.root"), true);
    assert.equal(ids.has("restarbeiten.filterbar"), true);
    assert.equal(ids.has("restarbeiten.main"), true);
    assert.equal(ids.has("restarbeiten.main.tableHeader"), true);
    assert.equal(ids.has("restarbeiten.main.tableHeader.number"), true);
    assert.equal(ids.has("restarbeiten.main.tableHeader.subject"), true);
    assert.equal(ids.has("restarbeiten.main.tableHeader.dueDate"), true);
    assert.equal(ids.has("restarbeiten.main.tableHeader.status"), true);
    assert.equal(ids.has("restarbeiten.main.tableHeader.responsible"), true);
    assert.equal(ids.has("restarbeiten.record.itemClass"), true);
    assert.equal(ids.has("restarbeiten.record.location"), true);
    assert.equal(ids.has("restarbeiten.editbox"), true);
    assert.equal(ids.has("restarbeiten.quicklane"), true);
    assert.equal(ids.has("restarbeiten.editbox.meta.noteButton"), true);

    for (const element of elements) {
      for (const field of ["id", "name", "type", "role", "parentId", "order", "visible", "editable", "allowedOps", "lockedOps"]) {
        assert.equal(Object.prototype.hasOwnProperty.call(element, field), true, `${element.id}.${field}`);
      }
      assert.equal(element.parentId === null || ids.has(element.parentId), true, `${element.id} parent`);
      assert.equal(Array.isArray(element.allowedOps), true, `${element.id} allowedOps`);
      assert.equal(Array.isArray(element.lockedOps), true, `${element.id} lockedOps`);
      for (const forbidden of ["save", "delete", "upload", "import", "export", "execute"]) {
        assert.equal(element.allowedOps.includes(forbidden), false, `${element.id} forbidden op ${forbidden}`);
      }
    }
  });

  await run("Restarbeiten: UI-Editor-Datei bleibt frei von Scan- und Speicherlogik", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/uiEditor/restarbeitenUiElements.js"),
      "utf8"
    );
    for (const snippet of ["querySelector", "DOMParser", "innerHTML", "scan", "detect", "autoRegister", "migration", "localStorage", "ipcMain", "ipcRenderer", "database"]) {
      assert.equal(source.includes(snippet), false, snippet);
    }
  });

  await run("Restarbeiten: IPC und Preload behalten vorhandene Wege", () => {
    const ipcPath = path.join(__dirname, "../../src/main/ipc/restarbeitenIpc.js");
    const preloadPath = path.join(__dirname, "../../src/main/preload.js");
    const ipc = fs.readFileSync(ipcPath, "utf8");
    const preload = fs.readFileSync(preloadPath, "utf8");

    for (const channel of [
      "restarbeiten:listByProject",
      "restarbeiten:getProjectSettings",
      "restarbeiten:createItem",
      "restarbeiten:updateItem",
      "restarbeiten:softDeleteItem",
      "restarbeiten:listAttachments",
    ]) {
      assert.equal(ipc.includes(channel), true, channel);
    }
    for (const preloadName of [
      "restarbeitenListByProject",
      "restarbeitenGetProjectSettings",
      "restarbeitenCreateItem",
      "restarbeitenUpdateItem",
      "restarbeitenSoftDeleteItem",
      "restarbeitenListAttachments",
    ]) {
      assert.equal(preload.includes(preloadName), true, preloadName);
    }
  });

  await run("Restarbeiten: alter Screen-Dateisatz bleibt entfernt", () => {
    const deletedFiles = [
      "Restarbeiten" + "Edit" + "box.js",
      "RestarbeitenQuick" + "lane.js",
      "RestarbeitenAttachments" + "View.js",
      "restarbeitenListStyle.js",
      "restarbeitenAttachmentsStyle.js",
    ];
    for (const fileName of deletedFiles) {
      assert.equal(
        fs.existsSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens", fileName)),
        false,
        fileName
      );
    }
  });
}

if (require.main === module) {
  let failed = false;

  function run(name, fn) {
    try {
      const out = fn();
      if (out && typeof out.then === "function") {
        return out
          .then(() => {
            console.log(`ok - ${name}`);
          })
          .catch((err) => {
            failed = true;
            console.error(`not ok - ${name}`);
            console.error(err?.stack || err?.message || err);
          });
      }
      console.log(`ok - ${name}`);
    } catch (err) {
      failed = true;
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
    }
    return Promise.resolve();
  }

  runRestarbeitenModuleTests(run)
    .then(() => {
      if (failed) process.exitCode = 1;
    })
    .catch((err) => {
      failed = true;
      process.exitCode = 1;
      console.error(err?.stack || err?.message || err);
    });
}

module.exports = { runRestarbeitenModuleTests };
