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
      removeChild(child) {
        const index = this.children.indexOf(child);
        if (index >= 0) this.children.splice(index, 1);
        if (child && typeof child === "object") child.parentElement = null;
        return child;
      },
      remove() {
        this.parentElement?.removeChild?.(this);
      },
      contains(candidate) {
        if (candidate === this) return true;
        return this.children.some((child) => typeof child?.contains === "function" && child.contains(candidate));
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
      removeEventListener(type, handler) {
        const handlers = this._listeners?.[type];
        if (!Array.isArray(handlers)) return;
        this._listeners[type] = handlers.filter((entry) => entry !== handler);
      },
      scrollIntoView(options) {
        this._scrollIntoViewCalls ||= [];
        this._scrollIntoViewCalls.push(options);
      },
      click() {
        for (const handler of this._listeners?.click || []) {
          handler.call(this, { type: "click", preventDefault() {}, stopPropagation() {} });
        }
      },
      dispatchEvent(event) {
        const type = String(event?.type || "");
        for (const handler of this._listeners?.[type] || []) {
          handler.call(this, event);
        }
        return true;
      },
      querySelector(selector) {
        const attributeMatch = String(selector || "").match(/^\[([A-Za-z_][A-Za-z0-9_.:-]*)="((?:\\.|[^"])*)"\]$/u);
        if (!attributeMatch) return null;
        const attributeName = attributeMatch[1];
        const attributeValue = attributeMatch[2].replace(/\\"/gu, '"').replace(/\\\\/gu, "\\");
        return findNodes(this, (entry) => entry.getAttribute?.(attributeName) === attributeValue)[0] || null;
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
    addEventListener(type, handler) {
      this._listeners ||= {};
      this._listeners[type] ||= [];
      this._listeners[type].push(handler);
    },
    removeEventListener(type, handler) {
      const handlers = this._listeners?.[type];
      if (!Array.isArray(handlers)) return;
      this._listeners[type] = handlers.filter((entry) => entry !== handler);
    },
    dispatchEvent(event) {
      const type = String(event?.type || "");
      for (const handler of this._listeners?.[type] || []) {
        handler.call(this, event);
      }
      return true;
    },
    body: null,
    head: null,
  };
  doc.body = createNode("body", doc);
  doc.head = createNode("head", doc);
  doc.querySelector = (...args) => doc.body.querySelector(...args);
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

function findByUiId(node, uiId) {
  return findNodes(node, (entry) => entry.getAttribute?.("data-ui-editor-id") === uiId)[0] || null;
}

function findQuicklaneIcon(node) {
  return findNodes(node, (entry) => entry.getAttribute?.("data-bbm-quicklane-icon") === "true")[0] || null;
}

function nearestUiEditorParentId(node) {
  let current = node?.parentElement || null;
  while (current) {
    const uiId = current.getAttribute?.("data-ui-editor-id");
    if (uiId) return uiId;
    current = current.parentElement || null;
  }
  return null;
}

function collectRegistrySurfaceElements(elements, rootId) {
  const byParent = new Map();
  for (const element of elements) {
    if (!element?.parentId) continue;
    const list = byParent.get(element.parentId) || [];
    list.push(element);
    byParent.set(element.parentId, list);
  }

  const surface = [];
  const pending = [rootId];
  const visited = new Set();
  while (pending.length > 0) {
    const id = pending.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const element = elements.find((entry) => entry.id === id);
    if (element) {
      surface.push(element.id === rootId ? { ...element, parentId: null } : element);
    }
    for (const child of byParent.get(id) || []) {
      pending.push(child.id);
    }
  }
  return surface;
}

function findByText(node, tagName, text) {
  return findNodes(
    node,
    (entry) => entry.tagName === String(tagName || "").toUpperCase() && String(entry.textContent || "") === text
  )[0] || null;
}

function findByData(node, name, value) {
  return findNodes(node, (entry) => entry.getAttribute?.(name) === value)[0] || null;
}

function findControl(node) {
  return findNodes(node, (entry) => ["INPUT", "SELECT", "TEXTAREA"].includes(entry.tagName))[0] || null;
}

function triggerValue(node, value, eventName = "input") {
  const control = findControl(node);
  assert.equal(Boolean(control), true, "missing form control");
  control.value = value;
  for (const handler of control._listeners?.[eventName] || []) {
    handler.call(control, { type: eventName, preventDefault() {} });
  }
  return control;
}

function triggerDirectValue(control, value, eventName = "input") {
  assert.equal(Boolean(control), true, "missing form control");
  control.value = value;
  for (const handler of control._listeners?.[eventName] || []) {
    handler.call(control, { type: eventName, preventDefault() {} });
  }
  return control;
}

function triggerEvent(node, eventName) {
  assert.equal(Boolean(node), true, "missing event target");
  for (const handler of node._listeners?.[eventName] || []) {
    handler.call(node, { type: eventName, preventDefault() {}, stopPropagation() {} });
  }
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
    async restarbeitenListNotes() {
      return { ok: true, notes: [] };
    },
    async restarbeitenCreateNote(data) {
      return {
        ok: true,
        note: {
          id: "note-1",
          restarbeit_id: data?.restarbeitId || "ra-1",
          note_text: data?.noteText || "",
          created_at: "2026-06-05T10:00:00.000Z",
          deleted_at: null,
        },
      };
    },
  };
}

async function renderRouteScreen({ keepGlobals = false } = {}) {
  const Router = await importEsmFromFile(path.join(__dirname, "../../src/renderer/app/Router.js")).then((mod) => mod.default);
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
    router._setSidebarVisibility = (visible) => {
      router._lastSidebarVisible = visible;
    };
    const opened = await router.openProjectModule("p-1", "restarbeiten", {
      project: { id: "p-1", project_number: "P-1", short: "Test" },
    });
    await flush();
    await flush();
    return {
      root: contentRoot,
      doc,
      quicklaneRoot: findByUiId(contentRoot, "restarbeiten.quicklane"),
      pageTitle: router.context.ui.pageTitle,
      sidebarVisible: router._lastSidebarVisible,
      restoreGlobals() {
        globalThis.document = prevDocument;
        globalThis.window = prevWindow;
      },
    };
  } finally {
    if (!keepGlobals) {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
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
    assert.equal(text.includes("Verortung"), false);
    assert.equal(text.includes("Tuer einstellen"), true);
    assert.equal(text.includes("Kurztext / Gegenstand"), true);
    assert.equal(text.includes("Neu"), true);
    assert.equal(text.includes("Speichern"), false);
    assert.equal(text.includes("Datensatz löschen"), false);
    assert.equal(text.includes("Löschen"), true);
    assert.equal(text.includes("Schließen"), true);
  });

  await run("Restarbeiten: Main/Body rendert M2.1-Tabellenkopf und Datensatzzeilen", async () => {
    const rendered = await renderRouteScreen();
    const text = collectText(rendered.root);
    assert.equal(text.includes("Nr."), true);
    assert.equal(text.includes("Gegenstand"), true);
    assert.equal(text.includes("Fertig bis"), true);
    assert.equal(text.includes("Status"), true);
    assert.equal(text.includes("Verantw."), true);
    assert.equal(text.includes("7"), true);
    assert.equal(text.includes("01.06.26"), true);
    assert.equal(text.includes("Mangel"), true);
    assert.equal(text.includes("12"), true);
    assert.equal(text.includes("03.06.26"), true);
    assert.equal(text.includes("Restarbeit"), true);
    assert.equal(text.includes("Fotos"), true);
    assert.equal(text.includes("Haus A \u00b7 EG \u00b7 Wohnung 2 \u00b7 Bad"), true);
    assert.equal(text.includes("Abdichtung im Bad fehlt"), true);
    assert.equal(text.includes("Abdichtung im Bereich Dusche unvollstaendig."), true);
    assert.equal(text.includes("12.06.26"), true);
    assert.equal(text.includes("offen"), true);
    assert.equal(text.includes("Mueller Trockenbau"), true);
    assert.equal(text.includes("Fertig bis:"), false);
    assert.equal(text.includes("Status:"), false);
    assert.equal(text.includes("Verantwortlich:"), false);
    const listAmpel = findByUiId(rendered.root, "restarbeiten.record.ampel");
    assert.equal(Boolean(listAmpel), true);
    assert.equal(listAmpel.children.length, 0);
    assert.equal(["rot", "gruen", "neutral"].includes(listAmpel.dataset.state), true);
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

  await run("Restarbeiten: UI-Editor-Zielgruppen sind registriert und im DOM markiert", async () => {
    const uiEditor = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/uiEditor/restarbeitenUiElements.js")
    );
    const elements = uiEditor.getRestarbeitenUiEditorElements();
    const ids = new Set(elements.map((element) => element.id));
    const rendered = await renderRouteScreen();
    const expectedTargets = [
      "restarbeiten.filterbar.group.location",
      "restarbeiten.filterbar.group.class",
      "restarbeiten.filterbar.group.meta",
      "restarbeiten.editbox.location",
      "restarbeiten.editbox.meta",
      "restarbeiten.editbox.meta.itemClass",
      "restarbeiten.filterbar.location.level1.label",
      "restarbeiten.filterbar.location.level2.label",
      "restarbeiten.filterbar.location.level3.label",
      "restarbeiten.filterbar.location.level4.label",
      "restarbeiten.filterbar.meta.status.label",
      "restarbeiten.filterbar.meta.dueDate.label",
      "restarbeiten.filterbar.meta.responsible.label",
      "restarbeiten.editbox.text.short",
      "restarbeiten.editbox.text.short.label",
      "restarbeiten.editbox.text.short.input",
      "restarbeiten.editbox.text.long",
      "restarbeiten.editbox.text.long.label",
      "restarbeiten.editbox.text.long.input",
      "restarbeiten.editbox.location.level1.label",
      "restarbeiten.editbox.location.level2.label",
      "restarbeiten.editbox.location.level3.label",
      "restarbeiten.editbox.location.level4.label",
      "restarbeiten.editbox.meta.itemClass.label",
      "restarbeiten.editbox.meta.status.label",
      "restarbeiten.editbox.meta.dueDate.label",
      "restarbeiten.editbox.meta.responsible.label",
      "restarbeiten.record.numberColumn",
      "restarbeiten.record.contentColumn",
      "restarbeiten.record.metaColumn",
      "restarbeiten.record.location",
      "restarbeiten.record.shortText",
      "restarbeiten.record.longText",
      "restarbeiten.record.dueDate",
      "restarbeiten.record.status",
      "restarbeiten.record.responsible",
      "restarbeiten.record.photos",
    ];

    for (const targetId of expectedTargets) {
      assert.equal(ids.has(targetId), true, `${targetId} registry`);
      assert.equal(Boolean(findByUiId(rendered.root, targetId)), true, `${targetId} dom`);
    }
  });

  await run("Restarbeiten: UI-Editor-DOM-Hierarchie folgt den Registry-Parent-IDs", async () => {
    const uiEditor = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/uiEditor/restarbeitenUiElements.js")
    );
    const elements = uiEditor.getRestarbeitenUiEditorElements();
    const byId = new Map(elements.map((element) => [element.id, element]));
    const rendered = await renderRouteScreen();
    const expectedParents = new Map([
      ["restarbeiten.filterbar.group.location", "restarbeiten.filterbar"],
      ["restarbeiten.filterbar.location.level1", "restarbeiten.filterbar.group.location"],
      ["restarbeiten.filterbar.location.level2", "restarbeiten.filterbar.group.location"],
      ["restarbeiten.filterbar.location.level3", "restarbeiten.filterbar.group.location"],
      ["restarbeiten.filterbar.location.level4", "restarbeiten.filterbar.group.location"],
      ["restarbeiten.filterbar.location.level1.label", "restarbeiten.filterbar.location.level1"],
      ["restarbeiten.filterbar.location.level2.label", "restarbeiten.filterbar.location.level2"],
      ["restarbeiten.filterbar.location.level3.label", "restarbeiten.filterbar.location.level3"],
      ["restarbeiten.filterbar.location.level4.label", "restarbeiten.filterbar.location.level4"],
      ["restarbeiten.filterbar.group.class", "restarbeiten.filterbar"],
      ["restarbeiten.filterbar.class.all", "restarbeiten.filterbar.group.class"],
      ["restarbeiten.filterbar.class.rest", "restarbeiten.filterbar.group.class"],
      ["restarbeiten.filterbar.class.defect", "restarbeiten.filterbar.group.class"],
      ["restarbeiten.filterbar.group.meta", "restarbeiten.filterbar"],
      ["restarbeiten.filterbar.meta.status", "restarbeiten.filterbar.group.meta"],
      ["restarbeiten.filterbar.meta.status.label", "restarbeiten.filterbar.meta.status"],
      ["restarbeiten.filterbar.meta.dueDate", "restarbeiten.filterbar.group.meta"],
      ["restarbeiten.filterbar.meta.dueDate.label", "restarbeiten.filterbar.meta.dueDate"],
      ["restarbeiten.filterbar.meta.responsible", "restarbeiten.filterbar.group.meta"],
      ["restarbeiten.filterbar.meta.responsible.label", "restarbeiten.filterbar.meta.responsible"],
      ["restarbeiten.filterbar.actions", "restarbeiten.filterbar"],
      ["restarbeiten.filterbar.action.close", "restarbeiten.filterbar.actions"],
      ["restarbeiten.main.sheet", "restarbeiten.main"],
      ["restarbeiten.main.sheet.paper", "restarbeiten.main.sheet"],
      ["restarbeiten.main.tableHeader", "restarbeiten.main.sheet.paper"],
      ["restarbeiten.main.records", "restarbeiten.main.sheet.paper"],
      ["restarbeiten.record.numberColumn", "restarbeiten.main.records"],
      ["restarbeiten.record.number", "restarbeiten.record.numberColumn"],
      ["restarbeiten.record.createdAt", "restarbeiten.record.numberColumn"],
      ["restarbeiten.record.itemClass", "restarbeiten.record.numberColumn"],
      ["restarbeiten.record.photos", "restarbeiten.record.numberColumn"],
      ["restarbeiten.record.contentColumn", "restarbeiten.main.records"],
      ["restarbeiten.record.location", "restarbeiten.record.contentColumn"],
      ["restarbeiten.record.shortText", "restarbeiten.record.contentColumn"],
      ["restarbeiten.record.longText", "restarbeiten.record.contentColumn"],
      ["restarbeiten.record.metaColumn", "restarbeiten.main.records"],
      ["restarbeiten.record.dueDate", "restarbeiten.record.metaColumn"],
      ["restarbeiten.record.ampel", "restarbeiten.record.metaColumn"],
      ["restarbeiten.record.status", "restarbeiten.record.metaColumn"],
      ["restarbeiten.record.responsible", "restarbeiten.record.metaColumn"],
      ["restarbeiten.editbox.header", "restarbeiten.editbox"],
      ["restarbeiten.editbox.header.currentRecord", "restarbeiten.editbox.header"],
      ["restarbeiten.editbox.text.short", "restarbeiten.editbox"],
      ["restarbeiten.editbox.text.short.label", "restarbeiten.editbox.text.short"],
      ["restarbeiten.editbox.text.short.input", "restarbeiten.editbox.text.short"],
      ["restarbeiten.editbox.text.short.remaining", "restarbeiten.editbox.text.short"],
      ["restarbeiten.editbox.text.short.dictation", "restarbeiten.editbox.text.short"],
      ["restarbeiten.editbox.meta.itemClass", "restarbeiten.editbox.text.short"],
      ["restarbeiten.editbox.meta.itemClass.label", "restarbeiten.editbox.meta.itemClass"],
      ["restarbeiten.editbox.action.new", "restarbeiten.editbox.text.short"],
      ["restarbeiten.editbox.action.delete", "restarbeiten.editbox.text.short"],
      ["restarbeiten.editbox.text.long", "restarbeiten.editbox"],
      ["restarbeiten.editbox.text.long.label", "restarbeiten.editbox.text.long"],
      ["restarbeiten.editbox.text.long.input", "restarbeiten.editbox.text.long"],
      ["restarbeiten.editbox.text.long.remaining", "restarbeiten.editbox.text.long"],
      ["restarbeiten.editbox.text.long.dictation", "restarbeiten.editbox.text.long"],
      ["restarbeiten.editbox.location", "restarbeiten.editbox"],
      ["restarbeiten.editbox.location.level1", "restarbeiten.editbox.location"],
      ["restarbeiten.editbox.location.level1.label", "restarbeiten.editbox.location.level1"],
      ["restarbeiten.editbox.location.level2", "restarbeiten.editbox.location"],
      ["restarbeiten.editbox.location.level2.label", "restarbeiten.editbox.location.level2"],
      ["restarbeiten.editbox.location.level3", "restarbeiten.editbox.location"],
      ["restarbeiten.editbox.location.level3.label", "restarbeiten.editbox.location.level3"],
      ["restarbeiten.editbox.location.level4", "restarbeiten.editbox.location"],
      ["restarbeiten.editbox.location.level4.label", "restarbeiten.editbox.location.level4"],
      ["restarbeiten.editbox.meta", "restarbeiten.editbox"],
      ["restarbeiten.editbox.meta.status", "restarbeiten.editbox.meta"],
      ["restarbeiten.editbox.meta.status.label", "restarbeiten.editbox.meta.status"],
      ["restarbeiten.editbox.meta.dueDate", "restarbeiten.editbox.meta"],
      ["restarbeiten.editbox.meta.dueDate.label", "restarbeiten.editbox.meta.dueDate"],
      ["restarbeiten.editbox.meta.responsible", "restarbeiten.editbox.meta"],
      ["restarbeiten.editbox.meta.responsible.label", "restarbeiten.editbox.meta.responsible"],
      ["restarbeiten.editbox.meta.ampel", "restarbeiten.editbox.meta"],
    ]);

    for (const [targetId, parentId] of expectedParents) {
      const element = byId.get(targetId);
      const node = findByUiId(rendered.root, targetId);
      assert.equal(Boolean(element), true, `${targetId} registry`);
      assert.equal(Boolean(node), true, `${targetId} dom`);
      assert.equal(element.parentId, parentId, `${targetId} registry parent`);
      assert.equal(nearestUiEditorParentId(node), parentId, `${targetId} dom parent`);
    }

    assert.notEqual(nearestUiEditorParentId(findByUiId(rendered.root, "restarbeiten.filterbar.action.close")), "restarbeiten.filterbar.group.meta");
    assert.notEqual(nearestUiEditorParentId(findByUiId(rendered.root, "restarbeiten.filterbar.action.close")), "restarbeiten.filterbar.group.class");
    assert.equal(findByUiId(rendered.root, "restarbeiten.main.records").children.some((child) => child === findByUiId(rendered.root, "restarbeiten.main.tableHeader")), false);
  });

  await run("Restarbeiten: generischer UI-Editor-Target-Contract ist erfuellt", async () => {
    const [uiEditor, targetContract] = await Promise.all([
      importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/uiEditor/restarbeitenUiElements.js")),
      Promise.resolve(require(path.join(__dirname, "../../uiEditor/targetContract.js"))),
    ]);
    const rendered = await renderRouteScreen();
    const elements = uiEditor.getRestarbeitenUiEditorElements();
    const surfaces = [
      {
        surfaceId: "filterbar",
        rootId: "restarbeiten.filterbar",
        root: findByUiId(rendered.root, "restarbeiten.filterbar"),
        elements: collectRegistrySurfaceElements(elements, "restarbeiten.filterbar"),
      },
      {
        surfaceId: "main",
        rootId: "restarbeiten.main",
        root: findByUiId(rendered.root, "restarbeiten.main"),
        elements: collectRegistrySurfaceElements(elements, "restarbeiten.main"),
      },
      {
        surfaceId: "editbox",
        rootId: "restarbeiten.editbox",
        root: findByUiId(rendered.root, "restarbeiten.editbox"),
        elements: collectRegistrySurfaceElements(elements, "restarbeiten.editbox"),
      },
      {
        surfaceId: "quicklane",
        rootId: "restarbeiten.quicklane",
        root: rendered.quicklaneRoot,
        elements: collectRegistrySurfaceElements(elements, "restarbeiten.quicklane"),
      },
    ];
    const result = targetContract.validateTargetSurfaceContracts({
      surfaces,
      targetAttributeName: "data-ui-editor-id",
      allowVirtualElements: true,
    });

    assert.deepEqual(result, {
      ok: true,
      errors: [],
      surfaceResults: surfaces.map((surface) => ({
        surfaceId: surface.surfaceId,
        rootId: surface.rootId,
        ok: true,
        errors: [],
      })),
    });
  });

  await run("Restarbeiten: Quicklane besitzt echte UI-Editor-Gruppen im DOM", async () => {
    const uiEditor = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/uiEditor/restarbeitenUiElements.js")
    );
    const elements = uiEditor.getRestarbeitenUiEditorElements();
    const byId = new Map(elements.map((element) => [element.id, element]));
    const rendered = await renderRouteScreen({ keepGlobals: true });
    const quicklaneRoot = rendered.quicklaneRoot;
    const expectedParents = new Map([
      ["restarbeiten.quicklane.group.navigation", "restarbeiten.quicklane"],
      ["restarbeiten.quicklane.pin", "restarbeiten.quicklane.group.navigation"],
      ["restarbeiten.quicklane.action.project", "restarbeiten.quicklane.group.navigation"],
      ["restarbeiten.quicklane.action.firms", "restarbeiten.quicklane.group.navigation"],
      ["restarbeiten.quicklane.group.visibility", "restarbeiten.quicklane"],
      ["restarbeiten.quicklane.action.ampel", "restarbeiten.quicklane.group.visibility"],
      ["restarbeiten.quicklane.action.longtext", "restarbeiten.quicklane.group.visibility"],
      ["restarbeiten.quicklane.group.output", "restarbeiten.quicklane"],
      ["restarbeiten.quicklane.action.pdfPreview", "restarbeiten.quicklane.group.output"],
      ["restarbeiten.quicklane.output.print", "restarbeiten.quicklane.group.output"],
      ["restarbeiten.quicklane.output.email", "restarbeiten.quicklane.group.output"],
    ]);

    assert.equal(Boolean(quicklaneRoot), true, "quicklane root");
    assert.equal(quicklaneRoot.getAttribute("data-ui-editor-id"), "restarbeiten.quicklane");
    assert.equal(quicklaneRoot.className, "bbm-restarbeiten-quicklane");
    assert.notEqual(quicklaneRoot.style.display, "none");
    assert.notEqual(quicklaneRoot.hidden, true);
    assert.equal(quicklaneRoot.dataset.open, "false");
    assert.equal(quicklaneRoot.dataset.pinned, "false");
    assert.equal(quicklaneRoot.style.position, "fixed");
    assert.equal(quicklaneRoot.style.top, "104px");
    assert.equal(quicklaneRoot.style.right, "0");
    assert.equal(Number(quicklaneRoot.style.zIndex) > 12010, true);
    assert.equal(quicklaneRoot.style.transform, "translateX(46px)");
    assert.equal(findByUiId(rendered.root, "restarbeiten.root").contains(quicklaneRoot), true);
    quicklaneRoot.dispatchEvent({ type: "mouseenter" });
    assert.equal(quicklaneRoot.dataset.open, "true");
    assert.equal(quicklaneRoot.style.transform, "translateX(0)");
    quicklaneRoot.dispatchEvent({ type: "mouseleave" });
    assert.equal(quicklaneRoot.dataset.open, "false");
    assert.equal(quicklaneRoot.style.transform, "translateX(46px)");
    for (const [targetId, parentId] of expectedParents) {
      const element = byId.get(targetId);
      const node = findByUiId(quicklaneRoot, targetId);
      assert.equal(Boolean(element), true, `${targetId} registry`);
      assert.equal(Boolean(node), true, `${targetId} dom`);
      assert.equal(element.parentId, parentId, `${targetId} registry parent`);
      assert.equal(nearestUiEditorParentId(node), parentId, `${targetId} dom parent`);
    }

    const navigationGroup = findByUiId(quicklaneRoot, "restarbeiten.quicklane.group.navigation");
    const visibilityGroup = findByUiId(quicklaneRoot, "restarbeiten.quicklane.group.visibility");
    const outputGroup = findByUiId(quicklaneRoot, "restarbeiten.quicklane.group.output");
    const directIds = (node) => node.children.map((child) => child.getAttribute?.("data-ui-editor-id")).filter(Boolean);
    assert.deepEqual(directIds(navigationGroup), [
      "restarbeiten.quicklane.pin",
      "restarbeiten.quicklane.action.project",
      "restarbeiten.quicklane.action.firms",
    ]);
    assert.deepEqual(directIds(visibilityGroup), [
      "restarbeiten.quicklane.action.ampel",
      "restarbeiten.quicklane.action.longtext",
    ]);
    assert.deepEqual(directIds(outputGroup), [
      "restarbeiten.quicklane.action.pdfPreview",
      "restarbeiten.quicklane.output.print",
      "restarbeiten.quicklane.output.email",
    ]);
    const quicklaneText = collectText(quicklaneRoot);
    for (const label of ["\u{1f4c1}", "\u{1f3e2}", "\u{1f4c4}", "\u{1f5a8}", "\u2709"]) {
      assert.equal(quicklaneText.includes(label), true, `quicklane ${label}`);
    }
    for (const label of ["PIN", "PRJ", "FIR", "DRK", "MAIL"]) {
      assert.equal(quicklaneText.includes(label), false, `quicklane ohne ${label}`);
    }
    const pinButton = findByUiId(quicklaneRoot, "restarbeiten.quicklane.pin");
    const pinIconOpen = findQuicklaneIcon(pinButton);
    assert.equal(Boolean(pinIconOpen), true, "pin icon");
    assert.equal(collectText(pinButton).includes("PIN"), false);
    assert.equal(pinButton.title, "Fixieren");
    assert.equal(pinButton.getAttribute("aria-label"), "Quicklane fixieren");
    pinButton.dispatchEvent({ type: "click", preventDefault() {} });
    const pinnedRoot = findByUiId(rendered.root, "restarbeiten.quicklane");
    const pinnedButton = findByUiId(pinnedRoot, "restarbeiten.quicklane.pin");
    const pinIconClosed = findQuicklaneIcon(pinnedButton);
    assert.notEqual(pinIconClosed.textContent, pinIconOpen.textContent);
    assert.equal(pinnedRoot.dataset.open, "true");
    assert.equal(pinnedRoot.dataset.pinned, "true");
    assert.equal(pinnedButton.title, "Lösen");
    assert.equal(pinnedButton.getAttribute("aria-label"), "Quicklane lösen");
    pinnedButton.dispatchEvent({ type: "click", preventDefault() {} });
    const unpinnedRoot = findByUiId(rendered.root, "restarbeiten.quicklane");
    const unpinnedButton = findByUiId(unpinnedRoot, "restarbeiten.quicklane.pin");
    assert.equal(unpinnedRoot.dataset.open, "false");
    assert.equal(unpinnedRoot.dataset.pinned, "false");
    assert.equal(unpinnedButton.title, "Fixieren");
    assert.equal(unpinnedButton.getAttribute("aria-label"), "Quicklane fixieren");
    const projectAction = findByUiId(quicklaneRoot, "restarbeiten.quicklane.action.project");
    const firmsAction = findByUiId(quicklaneRoot, "restarbeiten.quicklane.action.firms");
    const previewAction = findByUiId(quicklaneRoot, "restarbeiten.quicklane.action.pdfPreview");
    const printAction = findByUiId(quicklaneRoot, "restarbeiten.quicklane.output.print");
    const mailAction = findByUiId(quicklaneRoot, "restarbeiten.quicklane.output.email");
    assert.equal(projectAction.title, "Projekt");
    assert.equal(projectAction.getAttribute("aria-label"), "Projekt");
    assert.equal(firmsAction.title, "Firmen");
    assert.equal(firmsAction.getAttribute("aria-label"), "Firmen");
    assert.equal(previewAction.title, "PDF-Vorschau");
    assert.equal(previewAction.getAttribute("aria-label"), "PDF-Vorschau");
    assert.equal(printAction.title, "Drucken noch nicht verfügbar");
    assert.equal(printAction.getAttribute("aria-label"), "Drucken");
    assert.equal(mailAction.title, "E-Mail noch nicht verfügbar");
    assert.equal(mailAction.getAttribute("aria-label"), "E-Mail");
    for (const action of [pinButton, projectAction, firmsAction, previewAction, printAction, mailAction]) {
      const icon = findQuicklaneIcon(action);
      assert.equal(Boolean(icon), true, `${action.getAttribute("data-ui-editor-id")} icon`);
      assert.equal(icon.className, "bbm-project-context-quicklane-icon");
      assert.equal(icon.style.inlineSize, "20px");
      assert.equal(icon.style.blockSize, "20px");
      assert.equal(icon.style.fontSize, "18px");
    }
    assert.equal(findByUiId(quicklaneRoot, "restarbeiten.quicklane.action.ampel").title, "Ampel an/aus");
    assert.equal(findByUiId(quicklaneRoot, "restarbeiten.quicklane.action.longtext").title, "Langtext an/aus");
    const quicklaneAmpelIcon = findQuicklaneIcon(findByUiId(quicklaneRoot, "restarbeiten.quicklane.action.ampel"));
    assert.equal(quicklaneAmpelIcon.tagName, "IMG");
    assert.equal(String(quicklaneAmpelIcon.src || "").endsWith("assets/icons/ampel-status.svg"), true);
    assert.equal(findQuicklaneIcon(findByUiId(quicklaneRoot, "restarbeiten.quicklane.action.longtext")).children.length, 4);
    assert.equal(printAction.getAttribute("aria-disabled"), "true");
    assert.equal(printAction.tabIndex, -1);
    assert.equal(printAction.onclick, undefined);
    assert.equal(mailAction.getAttribute("aria-disabled"), "true");
    assert.equal(mailAction.tabIndex, -1);
    assert.equal(mailAction.onclick, undefined);
    const cssSource = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/styles/restarbeiten.css"),
      "utf8"
    );
    assert.equal(cssSource.includes(".bbm-restarbeiten-quicklane"), true);
    assert.equal(cssSource.includes("position: fixed"), true);
    assert.equal(cssSource.includes("inset-block-start: 104px"), true);
    assert.equal(cssSource.includes("inset-inline-end: 0"), true);
    assert.equal(cssSource.includes("transform: translateX(46px)"), true);
    assert.equal(cssSource.includes("transform: translateX(0)"), true);
    assert.equal(cssSource.includes('data-open="true"'), true);
    assert.equal(cssSource.includes(".bbm-restarbeiten-ampel__icon"), false);
    rendered.restoreGlobals();
  });

  await run("Restarbeiten: Quicklane-Ampel schaltet auch das Editbox-Ampelsymbol", async () => {
    const rendered = await renderRouteScreen({ keepGlobals: true });
    const initialEditboxAmpel = findByUiId(rendered.root, "restarbeiten.editbox.meta.ampel");
    assert.equal(Boolean(initialEditboxAmpel), true);
    assert.equal(initialEditboxAmpel.hidden, false);
    assert.notEqual(initialEditboxAmpel.style.display, "none");

    findByUiId(rendered.root, "restarbeiten.quicklane.action.ampel").dispatchEvent({
      type: "click",
      preventDefault() {},
    });
    const hiddenEditboxAmpel = findByUiId(rendered.root, "restarbeiten.editbox.meta.ampel");
    assert.equal(hiddenEditboxAmpel.hidden, true);
    assert.equal(hiddenEditboxAmpel.style.display, "none");

    findByUiId(rendered.root, "restarbeiten.quicklane.action.ampel").dispatchEvent({
      type: "click",
      preventDefault() {},
    });
    const visibleEditboxAmpel = findByUiId(rendered.root, "restarbeiten.editbox.meta.ampel");
    assert.equal(visibleEditboxAmpel.hidden, false);
    assert.notEqual(visibleEditboxAmpel.style.display, "none");
    rendered.restoreGlobals();
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
    assert.equal(typeof dataSource.listRestarbeitNotes, "function");
    assert.equal(typeof dataSource.createRestarbeitNote, "function");
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

  await run("Restarbeiten: Filterbar nutzt kleine Wort-Schalter und keine Gruppentitel", async () => {
    const filterbar = await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/RestarbeitenFilterbar.js"));
    const css = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/styles/restarbeiten.css"),
      "utf8"
    );
    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const root = filterbar.buildRestarbeitenFilterbar();
      const text = collectText(root);
      assert.equal(text.includes("Verortung"), false);
      assert.equal(text.includes("Klasse"), false);
      assert.equal(text.includes("Meta"), false);
      assert.equal(Boolean(findByText(root, "button", "Schließen")), true);
      assert.equal(Boolean(findByText(root, "button", "Alle")), true);
      assert.equal(Boolean(findByText(root, "button", "Rest")), true);
      assert.equal(Boolean(findByText(root, "button", "Mangel")), true);
      assert.equal(Boolean(findByText(root, "button", "Restarbeit")), false);
      const close = findByUiId(root, "restarbeiten.filterbar.action.close");
      const actions = findByUiId(root, "restarbeiten.filterbar.actions");
      const responsible = findByUiId(root, "restarbeiten.filterbar.meta.responsible");
      assert.equal(Boolean(close), true);
      assert.equal(Boolean(actions), true);
      assert.equal(Boolean(responsible), true);
      assert.equal(root.children.at(-1), actions);
      assert.equal(actions.children.at(-1), close);
      assert.equal(css.includes('--bbm-rest-font-family: "Noto Sans", Arial, sans-serif;'), true);
      assert.equal(css.includes(".bbm-restarbeiten-screen,\n.bbm-restarbeiten-screen button,\n.bbm-restarbeiten-screen input,\n.bbm-restarbeiten-screen select,\n.bbm-restarbeiten-screen textarea {\n  font-family: var(--bbm-rest-font-family);"), true);
      assert.equal(css.includes(".bbm-restarbeiten-filterbar [data-ui-editor-id=\"restarbeiten.filterbar.group.meta\"] .bbm-restarbeiten-field span,\n.bbm-restarbeiten-filterbar [data-ui-editor-id=\"restarbeiten.filterbar.group.meta\"] .bbm-restarbeiten-field input,\n.bbm-restarbeiten-filterbar [data-ui-editor-id=\"restarbeiten.filterbar.group.meta\"] .bbm-restarbeiten-field select {\n  color: var(--bbm-muted);\n  font-size: 6.5pt;\n  font-weight: 400;\n  line-height: 1.1;"), true);
      assert.equal(css.includes(".bbm-restarbeiten-filter-group {\n  grid-auto-flow: column;\n  grid-auto-columns: minmax(104px, auto);\n  align-items: center;"), true);
      assert.equal(css.includes(".bbm-restarbeiten-filterbar .bbm-restarbeiten-class-toggle {\n  justify-content: center;\n  gap: 0;"), true);
      assert.equal(css.includes(".bbm-restarbeiten-filterbar .bbm-restarbeiten-class-toggle button {\n  display: block;\n  margin: 0;\n  padding: 0;\n  min-height: 0;\n  height: auto;\n  line-height: 0.95;"), true);
    } finally {
      globalThis.document = prevDocument;
    }
  });

  await run("Restarbeiten: Editbox enthaelt M2.2-Aktionen, Klasse und Pflichtfeld", async () => {
    const editbox = await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/RestarbeitenEditbox.js"));
    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const root = editbox.buildRestarbeitenEditbox({
        draft: { item_class: "rest", status: "offen", short_text: "" },
      });
      const text = collectText(root);
      const options = collectOptions(root);
      const header = findByUiId(root, "restarbeiten.editbox.header");
      const currentRecord = findByUiId(root, "restarbeiten.editbox.header.currentRecord");
      const shortField = findByUiId(root, "restarbeiten.editbox.text.short");
      const shortControl = findControl(shortField);
      const longField = findByUiId(root, "restarbeiten.editbox.text.long");
      const longControl = findControl(longField);
      assert.equal(text.includes("Neu"), true);
      assert.equal(text.includes("Speichern"), false);
      assert.equal(text.includes("Nr.: neu in Bearbeitung"), true);
      assert.equal(Boolean(header), true);
      assert.equal(header.children[0], currentRecord);
      assert.equal(header.children.length, 1);
      assert.equal(currentRecord.textContent, "Nr.: neu in Bearbeitung");
      assert.equal(text.includes("Datensatz löschen"), false);
      assert.equal(text.includes("Löschen"), true);
      assert.equal(text.includes("Verortung"), false);
      assert.equal(text.includes("Meta"), false);
      assert.equal(text.includes("Kurztext erforderlich"), true);
      assert.equal(findByText(root, "button", "Löschen").disabled, true);
      const noteButton = findByUiId(root, "restarbeiten.editbox.meta.noteButton");
      assert.equal(noteButton.disabled, true);
      assert.equal(noteButton.title, "Notiz");
      assert.equal(noteButton.getAttribute("aria-label"), "Notiz");
      assert.equal(findNodes(noteButton, (node) => node.getAttribute?.("data-bbm-note-icon") === "edit").length, 1);
      assert.equal(findByText(root, "button", "Notiz"), null);
      assert.equal(Boolean(findByText(root, "button", "Rest")), true);
      assert.equal(Boolean(findByText(root, "button", "Mangel")), true);
      assert.equal(options.some((option) => option.value === "rest" && option.label === "Restarbeit"), false);
      assert.equal(Boolean(findByUiId(root, "restarbeiten.editbox.action.new")), true);
      assert.equal(Boolean(findByUiId(shortField, "restarbeiten.editbox.action.new")), true);
      assert.equal(Boolean(findByUiId(shortField, "restarbeiten.editbox.action.delete")), true);
      assert.equal(Boolean(currentRecord), true);
      assert.equal(Boolean(findByUiId(root, "restarbeiten.editbox.meta.itemClass")), true);
      assert.equal(Boolean(findByUiId(shortField, "restarbeiten.editbox.meta.itemClass")), true);
      assert.equal(Boolean(findByUiId(root, "restarbeiten.editbox.validation.shortText")), true);
      assert.equal(findByUiId(root, "restarbeiten.editbox.location").children.length, 4);
      assert.notEqual(findByUiId(root, "restarbeiten.editbox.meta").children[0], findByUiId(root, "restarbeiten.editbox.meta.itemClass"));
      assert.equal(shortControl.tagName, "INPUT");
      assert.equal(shortControl.getAttribute("data-ui-editor-id"), "restarbeiten.editbox.text.short.input");
      assert.equal(shortControl.getAttribute("maxlength"), "87");
      assert.equal(longControl.tagName, "TEXTAREA");
      assert.equal(longControl.getAttribute("data-ui-editor-id"), "restarbeiten.editbox.text.long.input");
      assert.equal(longControl.getAttribute("maxlength"), "400");
      assert.equal(findByUiId(root, "restarbeiten.editbox.text.short.remaining").textContent, "87");
      assert.equal(findByUiId(root, "restarbeiten.editbox.text.long.remaining").textContent, "400");
      triggerValue(shortField, "abc", "input");
      assert.equal(findByUiId(root, "restarbeiten.editbox.text.short.remaining").textContent, "84");
      triggerValue(longField, "abcd", "input");
      assert.equal(findByUiId(root, "restarbeiten.editbox.text.long.remaining").textContent, "396");
      const shortDictation = findByUiId(root, "restarbeiten.editbox.text.short.dictation");
      assert.equal(Boolean(shortDictation), true);
      assert.equal(shortDictation.parentElement.className, "bbm-restarbeiten-text-label__row");
      assert.equal(shortDictation.getAttribute("data-bbm-dictation-state"), "ready");
      assert.equal(findNodes(shortDictation, (node) => node.getAttribute?.("data-bbm-dictation-icon") === "ready").length, 1);
      assert.equal(findNodes(shortDictation, (node) => node.getAttribute?.("data-bbm-dictation-icon") === "recording").length, 1);
    } finally {
      globalThis.document = prevDocument;
    }
  });

  await run("Restarbeiten: Editbox zeigt bestehenden Datensatz im Header", async () => {
    const editbox = await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/RestarbeitenEditbox.js"));
    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const root = editbox.buildRestarbeitenEditbox({
        draft: { id: "ra-7", running_number: 7, item_class: "rest", status: "offen", short_text: "Pruefen" },
      });
      const header = findByUiId(root, "restarbeiten.editbox.header");
      const currentRecord = findByUiId(root, "restarbeiten.editbox.header.currentRecord");
      const shortField = findByUiId(root, "restarbeiten.editbox.text.short");
      assert.equal(currentRecord.textContent, "Nr.: 7 in Bearbeitung");
      assert.equal(header.children[0], currentRecord);
      assert.equal(header.children.length, 1);
      assert.equal(findByText(shortField, "button", "Neu").textContent, "Neu");
      assert.equal(findByText(shortField, "button", "Speichern"), null);
      assert.equal(findByText(shortField, "button", "Löschen").textContent, "Löschen");
      assert.equal(Boolean(findByUiId(shortField, "restarbeiten.editbox.action.delete")), true);
      const noteButton = findByUiId(root, "restarbeiten.editbox.meta.noteButton");
      assert.equal(noteButton.disabled, false);
      assert.equal(noteButton.title, "Notiz");
      assert.equal(noteButton.getAttribute("aria-label"), "Notiz");
      assert.equal(findByText(root, "button", "Notiz"), null);
    } finally {
      globalThis.document = prevDocument;
    }
  });

  await run("Restarbeiten: Notiz-Popup oeffnet, fuegt Notiz hinzu, bleibt offen und bereitet Druck vor", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
    );
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const doc = createFakeDocument();
    const notes = [];
    const calls = [];
    globalThis.document = doc;
    globalThis.window = {
      bbmDb: {
        ...buildBbmDbStub(),
        async restarbeitenListNotes(payload) {
          calls.push({ type: "listNotes", payload });
          return { ok: true, notes: notes.filter((note) => note.restarbeit_id === payload.restarbeitId) };
        },
        async restarbeitenCreateNote(payload) {
          calls.push({ type: "createNote", payload });
          const note = {
            id: `note-${notes.length + 1}`,
            restarbeit_id: payload.restarbeitId,
            note_text: payload.noteText,
            created_at: "2026-06-05T10:30:00.000Z",
            deleted_at: null,
          };
          notes.unshift(note);
          return { ok: true, note };
        },
      },
      dispatchEvent() {},
    };
    try {
      const screen = new mod.default({ projectId: "p-1", project: { id: "p-1" } });
      screen.items = [
        {
          id: "ra-1",
          running_number: 7,
          item_class: "mangel",
          status: "offen",
          short_text: "Abdichtung pruefen",
          location_level_1: "Haus A",
          location_level_2: "EG",
        },
      ];
      screen._selectItem("ra-1", { render: false });
      const root = screen.render();

      const noteBtn = findByUiId(root, "restarbeiten.editbox.meta.noteButton");
      assert.equal(noteBtn.disabled, false);
      noteBtn.click();
      await flush();
      await flush();

      assert.equal(collectText(doc.body).includes("Notizen zu Nr.: 7"), true);
      assert.equal(collectText(doc.body).includes("Noch keine Notizen vorhanden."), true);
      assert.deepEqual(calls[0], { type: "listNotes", payload: { restarbeitId: "ra-1" } });

      const addBtn = findByData(doc.body, "data-bbm-restarbeiten-note-action", "add");
      assert.equal(addBtn.disabled, true);
      const input = findByData(doc.body, "data-bbm-restarbeiten-note-input", "true");
      triggerDirectValue(input, "Erste Notiz zur Restarbeit", "input");
      assert.equal(addBtn.disabled, false);
      addBtn.click();
      await flush();
      await flush();

      assert.equal(calls.some((call) => call.type === "createNote" && call.payload.noteText === "Erste Notiz zur Restarbeit"), true);
      assert.equal(collectText(doc.body).includes("Erste Notiz zur Restarbeit"), true);
      assert.equal(Boolean(screen.notesOverlay), true);

      findByData(doc.body, "data-bbm-restarbeiten-note-action", "print").click();
      assert.equal(screen._lastRestarbeitNotePrint.status, "prepared");
      assert.equal(screen._lastRestarbeitNotePrint.mode, "restarbeit-note-history");
      assert.equal(screen._lastRestarbeitNotePrint.restarbeitId, "ra-1");
      assert.equal(collectText(doc.body).includes("Druck vorbereitet."), true);

      findByData(doc.body, "data-bbm-restarbeiten-note-action", "close").click();
      assert.equal(screen.notesOverlay, null);
      assert.equal(doc.body.children.length, 0);
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Restarbeiten: Editbox hat keinen Speichern-Button und kann Verantwortlich leeren", async () => {
    const editbox = await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/RestarbeitenEditbox.js"));
    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const patches = [];
      const root = editbox.buildRestarbeitenEditbox({
        draft: {
          id: "ra-1",
          short_text: "",
          responsible_project_firm_id: "firm-1",
          responsible_label: "AB Bau",
        },
        responsibleOptions: [{ value: "firm-1", label: "AB Bau" }],
        onDraftChange: (patch) => patches.push(patch),
      });

      assert.equal(findByText(root, "button", "Speichern"), null);

      triggerValue(findByUiId(root, "restarbeiten.editbox.meta.responsible"), "", "change");
      assert.deepEqual(patches.at(-1), {
        responsible_project_firm_id: "",
        responsible_label: "",
      });
    } finally {
      globalThis.document = prevDocument;
    }
  });

  await run("Restarbeiten: Kurz- und Langtext-Eingabe erzwingen keinen Shell-Neurender", async () => {
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
      let renderCalls = 0;
      const renderShell = screen._renderShell.bind(screen);
      screen._renderShell = () => {
        renderCalls += 1;
        return renderShell();
      };
      screen._autoSaveDraft = async () => {};

      const validation = findByUiId(root, "restarbeiten.editbox.validation.shortText");
      assert.equal(findByText(root, "button", "Speichern"), null);
      assert.equal(validation.textContent, "Kurztext erforderlich");

      triggerValue(findByUiId(root, "restarbeiten.editbox.text.short"), "Neue Restarbeit", "input");
      assert.equal(screen.draft.short_text, "Neue Restarbeit");
      assert.equal(validation.textContent, "");
      assert.equal(renderCalls, 0);

      triggerValue(findByUiId(root, "restarbeiten.editbox.text.long"), "Lange Beschreibung", "input");
      assert.equal(screen.draft.long_text, "Lange Beschreibung");
      assert.equal(renderCalls, 0);

      triggerValue(findByUiId(root, "restarbeiten.editbox.location.level1"), "Haus A", "input");
      assert.equal(screen.draft.location_level_1, "Haus A");
      assert.equal(renderCalls, 0);

      triggerValue(findByUiId(root, "restarbeiten.editbox.meta.status"), "verzug", "change");
      assert.equal(screen.draft.ampelState, "rot");
      assert.equal(renderCalls, 1);
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Restarbeiten: Neu-Button setzt Draft und Auswahl zurueck", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
    );
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    globalThis.document = createFakeDocument();
    globalThis.window = { bbmDb: buildBbmDbStub(), dispatchEvent() {} };
    try {
      const screen = new mod.default({ projectId: "p-1", project: { id: "p-1" } });
      screen.items = [{ id: "ra-1", short_text: "Alt", item_class: "mangel", status: "erledigt" }];
      screen._selectItem("ra-1", { render: false });
      const root = screen.render();
      findByUiId(root, "restarbeiten.editbox.action.new").click();
      assert.equal(screen.selectedId, null);
      assert.equal(screen.draft.id, "");
      assert.equal(screen.draft.item_class, "rest");
      assert.equal(screen.draft.status, "offen");
      assert.equal(screen.draft.due_date, "");
      assert.equal(screen.draft.responsible_project_firm_id, "");
      assert.equal(screen.draft.responsible_label, "");
      assert.equal(screen.draft.short_text, "");
      assert.equal(screen.draft.long_text, "");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Restarbeiten: Draft-Ampel aktualisiert sich bei Status und Fertig-bis", async () => {
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
      triggerValue(findByUiId(root, "restarbeiten.editbox.meta.status"), "verzug", "change");
      assert.equal(screen.draft.ampelState, "rot");
      assert.equal(findByUiId(screen.root, "restarbeiten.editbox.meta.ampel").children[0].dataset.state, "rot");
      assert.equal(
        findByUiId(screen.root, "restarbeiten.editbox.meta.ampel").parentElement,
        findByUiId(screen.root, "restarbeiten.editbox.meta")
      );

      triggerValue(findByUiId(screen.root, "restarbeiten.editbox.meta.status"), "offen", "change");
      const futureDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      triggerValue(findByUiId(screen.root, "restarbeiten.editbox.meta.dueDate"), futureDueDate, "change");
      assert.equal(screen.draft.ampelState, "gruen");
      assert.equal(findByUiId(screen.root, "restarbeiten.editbox.meta.ampel").children[0].dataset.state, "gruen");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Restarbeiten: Auto-Save legt neuen Datensatz erst bei Kurztext-Blur an", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
    );
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const calls = [];
    let rows = [];
    globalThis.document = createFakeDocument();
    globalThis.window = {
      bbmDb: {
        async restarbeitenListByProject() {
          return { ok: true, items: rows };
        },
        async restarbeitenGetProjectSettings() {
          return { ok: true, settings: {} };
        },
        async projectFirmsListByProject() {
          return { ok: true, list: [] };
        },
        async restarbeitenCreateItem(payload) {
          calls.push({ type: "create", payload });
          const item = { ...payload, id: "ra-auto", running_number: 4, created_at: "2026-06-05" };
          rows = [item];
          return { ok: true, item };
        },
        async restarbeitenUpdateItem(payload) {
          calls.push({ type: "update", payload });
          return { ok: true, item: rows.find((row) => row.id === payload.id) };
        },
      },
      dispatchEvent() {},
    };
    try {
      const screen = new mod.default({ projectId: "p-1", project: { id: "p-1" } });
      const root = screen.render();
      const shortControl = triggerValue(findByUiId(root, "restarbeiten.editbox.text.short"), "Automatisch speichern", "input");
      assert.equal(calls.length, 0);
      triggerEvent(shortControl, "blur");
      await flush();
      await flush();
      await flush();
      assert.equal(calls[0].type, "create");
      assert.equal(calls[0].payload.projectId, "p-1");
      assert.equal(Object.prototype.hasOwnProperty.call(calls[0].payload, "running_number"), false);
      assert.equal(screen.selectedId, "ra-auto");
      assert.equal(screen.draft.running_number, 4);
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Restarbeiten: Auto-Save legt ohne Kurztext keinen neuen Datensatz an", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
    );
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const calls = [];
    globalThis.document = createFakeDocument();
    globalThis.window = {
      bbmDb: {
        ...buildBbmDbStub(),
        async restarbeitenCreateItem(payload) {
          calls.push({ type: "create", payload });
          return { ok: true, item: { id: "should-not-exist" } };
        },
      },
      dispatchEvent() {},
    };
    try {
      const screen = new mod.default({ projectId: "p-1", project: { id: "p-1" } });
      const root = screen.render();
      const shortControl = findControl(findByUiId(root, "restarbeiten.editbox.text.short"));
      triggerEvent(shortControl, "blur");
      await flush();
      await flush();
      assert.equal(calls.length, 0);
      assert.equal(screen.draft.id, "");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Restarbeiten: Auto-Save aktualisiert bestehenden Datensatz bei Change", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
    );
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const calls = [];
    let rows = [{ id: "ra-1", item_class: "rest", status: "offen", short_text: "Alt" }];
    globalThis.document = createFakeDocument();
    globalThis.window = {
      bbmDb: {
        async restarbeitenListByProject() {
          return { ok: true, items: rows };
        },
        async restarbeitenGetProjectSettings() {
          return { ok: true, settings: {} };
        },
        async projectFirmsListByProject() {
          return { ok: true, list: [] };
        },
        async restarbeitenUpdateItem(payload) {
          calls.push({ type: "update", payload });
          rows = rows.map((row) => (row.id === payload.id ? { ...row, ...payload.patch } : row));
          return { ok: true, item: rows.find((row) => row.id === payload.id) };
        },
      },
      dispatchEvent() {},
    };
    try {
      const screen = new mod.default({ projectId: "p-1", project: { id: "p-1" } });
      screen.items = rows;
      screen._selectItem("ra-1", { render: false });
      const root = screen.render();
      const statusControl = triggerValue(findByUiId(root, "restarbeiten.editbox.meta.status"), "erledigt", "change");
      triggerEvent(statusControl, "blur");
      await flush();
      await flush();
      await flush();
      assert.equal(calls.length, 1);
      assert.equal(calls[0].type, "update");
      assert.equal(calls[0].payload.id, "ra-1");
      assert.equal(calls[0].payload.patch.status, "erledigt");
      assert.equal(screen.draft.status, "erledigt");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Restarbeiten: Auto-Save speichert Verortung erst bei Blur und nicht doppelt", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
    );
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const calls = [];
    let rows = [{ id: "ra-1", item_class: "rest", status: "offen", short_text: "Alt" }];
    globalThis.document = createFakeDocument();
    globalThis.window = {
      bbmDb: {
        async restarbeitenListByProject() {
          return { ok: true, items: rows };
        },
        async restarbeitenGetProjectSettings() {
          return { ok: true, settings: {} };
        },
        async projectFirmsListByProject() {
          return { ok: true, list: [] };
        },
        async restarbeitenUpdateItem(payload) {
          calls.push({ type: "update", payload });
          rows = rows.map((row) => (row.id === payload.id ? { ...row, ...payload.patch } : row));
          return { ok: true, item: rows.find((row) => row.id === payload.id) };
        },
      },
      dispatchEvent() {},
    };
    try {
      const screen = new mod.default({ projectId: "p-1", project: { id: "p-1" } });
      screen.items = rows;
      screen._selectItem("ra-1", { render: false });
      const root = screen.render();
      const locationControl = triggerValue(findByUiId(root, "restarbeiten.editbox.location.level1"), "Haus A", "input");
      triggerEvent(locationControl, "change");
      assert.equal(calls.length, 0);
      triggerEvent(locationControl, "blur");
      await flush();
      await flush();
      await flush();
      assert.equal(calls.length, 1);
      assert.equal(calls[0].payload.patch.location_level_1, "Haus A");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Restarbeiten: Speichern legt neu an, aktualisiert bestehend und nutzt Soft-Delete", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
    );
    const prevDocument = globalThis.document;
    const prevWindow = globalThis.window;
    const calls = [];
    let rows = [];
    globalThis.document = createFakeDocument();
    globalThis.window = {
      bbmDb: {
        async restarbeitenListByProject() {
          return { ok: true, items: rows };
        },
        async restarbeitenGetProjectSettings() {
          return { ok: true, settings: {} };
        },
        async projectFirmsListByProject() {
          return { ok: true, list: [] };
        },
        async restarbeitenCreateItem(payload) {
          calls.push({ type: "create", payload });
          const item = { ...payload, id: "ra-new", running_number: 1, created_at: "2026-06-05" };
          rows = [item, { id: "ra-other", item_class: "rest", status: "offen", short_text: "Weiterer Datensatz" }];
          return { ok: true, item };
        },
        async restarbeitenUpdateItem(payload) {
          calls.push({ type: "update", payload });
          rows = rows.map((row) => (row.id === payload.id ? { ...row, ...payload.patch } : row));
          return { ok: true, item: rows.find((row) => row.id === payload.id) };
        },
        async restarbeitenSoftDeleteItem(payload) {
          calls.push({ type: "delete", payload });
          rows = rows.filter((row) => row.id !== payload.id);
          return { ok: true, item: { id: payload.id } };
        },
      },
      dispatchEvent() {},
    };
    try {
      const screen = new mod.default({ projectId: "p-1", project: { id: "p-1" } });
      screen.render();
      screen.draft = {
        id: "",
        item_class: "rest",
        status: "offen",
        short_text: "Neue Restarbeit",
        long_text: "",
        due_date: "",
        responsible_project_firm_id: "",
        responsible_label: "",
        running_number: "999",
      };
      await screen._saveDraft();
      assert.equal(calls[0].type, "create");
      assert.equal(calls[0].payload.projectId, "p-1");
      assert.equal(Object.prototype.hasOwnProperty.call(calls[0].payload, "running_number"), false);
      assert.equal(screen.selectedId, "ra-new");
      assert.equal(screen.draft.id, "ra-new");
      const newRecord = findNodes(
        screen.root,
        (node) => node.getAttribute?.("data-bbm-restarbeiten-record-id") === "ra-new"
      )[0];
      assert.deepEqual(newRecord._scrollIntoViewCalls.at(-1), { block: "end", behavior: "smooth" });

      screen.draft.short_text = "Aktualisiert";
      await screen._saveDraft();
      assert.equal(calls[1].type, "update");
      assert.equal(calls[1].payload.id, "ra-new");
      assert.equal(calls[1].payload.patch.short_text, "Aktualisiert");

      await screen._deleteDraft();
      assert.equal(calls[2].type, "delete");
      assert.equal(calls[2].payload.id, "ra-new");
      assert.equal(screen.selectedId, null);
      assert.equal(screen.draft.id, "");
    } finally {
      globalThis.document = prevDocument;
      globalThis.window = prevWindow;
    }
  });

  await run("Restarbeiten: Scrolllogik nutzt keinen globalen Window-Scroll", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"),
      "utf8"
    );
    const css = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/styles/restarbeiten.css"),
      "utf8"
    );
    assert.equal(source.includes("window.scrollTo"), false);
    assert.equal(source.includes("scrollIntoView"), true);
    assert.equal(source.includes("data-bbm-restarbeiten-record-id"), true);
    assert.equal(css.includes("grid-template-rows: 96px minmax(0, 1fr) 250px;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-main {\n  min-height: 0;\n  overflow: auto;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-screen {\n  min-height: calc(100vh - 92px);"), true);
    assert.equal(css.includes(".bbm-restarbeiten-record__number {\n  font-size: 8.5pt;\n  font-weight: 600;\n  line-height: 1.15;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-record__short {\n  font-size: 8.5pt;\n  line-height: 1.35;\n  font-weight: 500;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-record__meta {\n  display: grid;\n  gap: 2px;\n  align-content: start;\n  color: var(--bbm-muted);\n  font-size: 8pt;\n  font-weight: 400;\n  line-height: 1.25;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-record__due {\n  display: inline-flex;\n  gap: 5px;\n  align-items: center;\n  color: var(--bbm-muted);\n  font-size: 8pt;\n  font-weight: 400;\n  line-height: 1.25;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-record__photos"), true);
    assert.equal(css.includes(".bbm-restarbeiten-editbox .bbm-restarbeiten-field input,\n.bbm-restarbeiten-editbox .bbm-restarbeiten-field select,\n.bbm-restarbeiten-editbox .bbm-restarbeiten-field textarea {\n  padding: 3px 5px;\n  font-size: 8pt;\n  line-height: 1.15;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-editbox [data-ui-editor-id=\"restarbeiten.editbox.text.short\"] input {\n  height: 20px;\n  min-height: 20px;\n  padding-top: 1px;\n  padding-bottom: 1px;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-editbox .bbm-restarbeiten-edit-group .bbm-restarbeiten-field input,\n.bbm-restarbeiten-editbox .bbm-restarbeiten-edit-group .bbm-restarbeiten-field select {\n  font-size: 7pt;\n  line-height: 1.15;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-editbox__actions--inline {\n  margin-left: 1.5cm;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-class-field--inline {\n  display: inline-flex;\n  align-items: center;\n  min-width: 0;\n  margin-left: 1.5cm;"), true);
    assert.equal(css.includes("grid-template-columns: minmax(260px, 1fr) 98px 98px;"), true);
    assert.equal(css.includes("gap: 8px 6px;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-editbox .bbm-restarbeiten-edit-group {\n  grid-template-columns: minmax(0, 1fr);\n  align-content: start;\n  gap: 4px;\n  min-height: 0;\n  justify-self: end;\n  width: 96px;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-editbox .bbm-restarbeiten-edit-group .bbm-restarbeiten-field {\n  width: 92px;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-editbox [data-ui-editor-id=\"restarbeiten.editbox.meta.dueDate\"] {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) auto;\n  column-gap: 5px;"), true);
    assert.equal(css.includes(".bbm-restarbeiten-remaining {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 18px;\n  border: 1px solid var(--bbm-line);\n  border-radius: 999px;\n  padding: 0 5px;\n  color: var(--bbm-muted);\n  font-family: var(--bbm-rest-font-family);\n  font-size: 6.5pt;\n  font-weight: 400;\n  line-height: 1.2;"), true);
    assert.equal(css.includes('.bbm-restarbeiten-dictation-button[data-bbm-dictation-state="ready"] [data-bbm-dictation-icon="recording"],'), true);
    assert.equal(css.includes('.bbm-restarbeiten-dictation-button[data-bbm-dictation-state="recording"] [data-bbm-dictation-icon="ready"]'), true);
    assert.equal(css.includes(".bbm-restarbeiten-note {\n  width: 24px;\n  height: 24px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0;"), true);
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

  await run("Restarbeiten: PDF-, Listen- und Editbox-Ampel nutzen das Statussymbol ohne SVG-Asset", () => {
    const listSource = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/RestarbeitenList.js"),
      "utf8"
    );
    const editboxSource = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/RestarbeitenEditbox.js"),
      "utf8"
    );
    const cssSource = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/styles/restarbeiten.css"),
      "utf8"
    );
    const printShellSource = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/print/layout/PrintShell.js"),
      "utf8"
    );

    assert.equal(listSource.includes("ampel-status.svg"), false);
    assert.equal(editboxSource.includes("ampel-status.svg"), false);
    assert.equal(cssSource.includes("bbm-restarbeiten-ampel__icon"), false);
    assert.equal(printShellSource.includes("ampel-status.svg"), false);
    assert.equal(printShellSource.includes("ampelDot"), true);
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
    assert.equal(ids.has("restarbeiten.record.ampel"), true);
    assert.equal(ids.has("restarbeiten.record.photos"), true);
    assert.equal(ids.has("restarbeiten.record.location"), true);
    assert.equal(ids.has("restarbeiten.editbox"), true);
    assert.equal(ids.has("restarbeiten.editbox.header.currentRecord"), true);
    assert.equal(ids.has("restarbeiten.editbox.action.new"), true);
    assert.equal(ids.has("restarbeiten.editbox.action.save"), false);
    assert.equal(ids.has("restarbeiten.editbox.action.delete"), true);
    assert.equal(ids.has("restarbeiten.editbox.meta.itemClass"), true);
    assert.equal(ids.has("restarbeiten.filterbar.actions"), true);
    assert.equal(ids.has("restarbeiten.editbox.text.short.input"), true);
    assert.equal(ids.has("restarbeiten.editbox.text.long.input"), true);
    assert.equal(ids.has("restarbeiten.editbox.text.short.remaining"), true);
    assert.equal(ids.has("restarbeiten.editbox.text.long.remaining"), true);
    assert.equal(ids.has("restarbeiten.quicklane"), true);
    assert.equal(ids.has("restarbeiten.quicklane.group.navigation"), true);
    assert.equal(ids.has("restarbeiten.quicklane.group.visibility"), true);
    assert.equal(ids.has("restarbeiten.quicklane.group.output"), true);
    assert.equal(ids.has("restarbeiten.editbox.validation.shortText"), true);
    assert.equal(ids.has("restarbeiten.editbox.meta.noteButton"), true);

    const photosElement = elements.find((element) => element.id === "restarbeiten.record.photos");
    assert.equal(photosElement.name, "Fotos");
    assert.equal(photosElement.type, "button");
    assert.equal(photosElement.role, "action");
    assert.equal(photosElement.parentId, "restarbeiten.record.numberColumn");
    assert.equal(photosElement.order, 40);
    assert.deepEqual(photosElement.allowedOps, ["inspect"]);
    const deleteElement = elements.find((element) => element.id === "restarbeiten.editbox.action.delete");
    assert.equal(deleteElement.name, "Löschen");
    assert.equal(deleteElement.parentId, "restarbeiten.editbox.text.short");
    assert.equal(elements.find((element) => element.id === "restarbeiten.editbox.action.new").parentId, "restarbeiten.editbox.text.short");
    assert.equal(elements.find((element) => element.id === "restarbeiten.editbox.meta.itemClass").parentId, "restarbeiten.editbox.text.short");
    assert.equal(elements.find((element) => element.id === "restarbeiten.editbox.text.short.input").parentId, "restarbeiten.editbox.text.short");
    assert.equal(elements.find((element) => element.id === "restarbeiten.editbox.text.long.input").parentId, "restarbeiten.editbox.text.long");
    assert.equal(elements.find((element) => element.id === "restarbeiten.editbox.text.short.remaining").parentId, "restarbeiten.editbox.text.short");
    assert.equal(elements.find((element) => element.id === "restarbeiten.editbox.text.long.remaining").parentId, "restarbeiten.editbox.text.long");
    assert.equal(elements.find((element) => element.id === "restarbeiten.filterbar.action.close").parentId, "restarbeiten.filterbar.actions");
    assert.equal(elements.find((element) => element.id === "restarbeiten.record.ampel").parentId, "restarbeiten.record.metaColumn");
    assert.equal(elements.find((element) => element.id === "restarbeiten.editbox.meta.ampel").parentId, "restarbeiten.editbox.meta");
    assert.equal(elements.find((element) => element.id === "restarbeiten.quicklane.pin").parentId, "restarbeiten.quicklane.group.navigation");
    assert.equal(elements.find((element) => element.id === "restarbeiten.quicklane.action.ampel").parentId, "restarbeiten.quicklane.group.visibility");
    assert.equal(elements.find((element) => element.id === "restarbeiten.quicklane.output.print").parentId, "restarbeiten.quicklane.group.output");

    const byId = (id) => elements.find((element) => element.id === id);
    const assertPreviewMeta = (id, editGranularity, previewTargetMode, affectsContainer) => {
      const element = byId(id);
      assert.equal(Boolean(element), true, `${id} exists`);
      assert.equal(element.editGranularity, editGranularity, `${id} editGranularity`);
      assert.equal(element.previewTargetMode, previewTargetMode, `${id} previewTargetMode`);
      assert.equal(element.affectsContainer, affectsContainer, `${id} affectsContainer`);
    };
    const assertLocked = (id, lockedOps) => {
      const element = byId(id);
      for (const op of lockedOps) {
        assert.equal(element.lockedOps.includes(op), true, `${id} locked ${op}`);
        assert.equal(element.allowedOps.includes(op), false, `${id} allowed ${op}`);
      }
    };

    assertPreviewMeta("restarbeiten.editbox.text.short", "container", "self", true);
    assertPreviewMeta("restarbeiten.editbox.text.short.label", "element", "self", false);
    assertPreviewMeta("restarbeiten.editbox.text.short.input", "control", "self", false);
    assertPreviewMeta("restarbeiten.editbox.action.new", "control", "self", false);
    assertPreviewMeta("restarbeiten.editbox.action.delete", "control", "self", false);
    assert.deepEqual(byId("restarbeiten.editbox.text.short.label").allowedOps, ["inspect", "move", "width", "hide", "show"]);
    assert.deepEqual(byId("restarbeiten.editbox.text.short.input").allowedOps, ["inspect", "move", "width", "height", "hide", "show"]);
    assert.deepEqual(byId("restarbeiten.editbox.action.new").allowedOps, ["inspect", "move", "width", "height", "hide", "show"]);
    assert.deepEqual(byId("restarbeiten.editbox.action.delete").allowedOps, ["inspect", "move", "width", "height", "hide", "show"]);
    assert.deepEqual(byId("restarbeiten.editbox.text.short.dictation").allowedOps, ["inspect", "move", "width", "height", "hide", "show"]);
    assert.deepEqual(byId("restarbeiten.editbox.meta.noteButton").allowedOps, ["inspect", "move", "width", "height", "hide", "show"]);
    assertLocked("restarbeiten.editbox.text.short.input", ["rename"]);
    assertLocked("restarbeiten.editbox.action.new", ["resize", "rename"]);
    assertLocked("restarbeiten.editbox.action.delete", ["resize", "rename"]);

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
      "restarbeiten:listNotes",
      "restarbeiten:createNote",
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
      "restarbeitenListNotes",
      "restarbeitenCreateNote",
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
