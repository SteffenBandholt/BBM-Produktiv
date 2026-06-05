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

function findByUiId(node, uiId) {
  return findNodes(node, (entry) => entry.getAttribute?.("data-ui-editor-id") === uiId)[0] || null;
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
    assert.equal(text.includes("Neu"), true);
    assert.equal(text.includes("Speichern"), true);
    assert.equal(text.includes("Datensatz löschen"), true);
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
      assert.equal(text.includes("Neu"), true);
      assert.equal(text.includes("Speichern"), true);
      assert.equal(text.includes("Nr.: neu in Bearbeitung"), true);
      assert.equal(Boolean(header), true);
      assert.equal(header.children[0], currentRecord);
      assert.equal(currentRecord.textContent, "Nr.: neu in Bearbeitung");
      assert.equal(text.includes("Datensatz löschen"), true);
      assert.equal(text.includes("Kurztext erforderlich"), true);
      assert.equal(findByText(root, "button", "Speichern").disabled, true);
      assert.equal(findByText(root, "button", "Datensatz löschen").disabled, true);
      assert.equal(findByText(root, "button", "Notiz").disabled, true);
      assert.equal(options.some((option) => option.value === "rest" && option.label === "Restarbeit"), true);
      assert.equal(options.some((option) => option.value === "mangel" && option.label === "Mangel"), true);
      assert.equal(Boolean(findByUiId(root, "restarbeiten.editbox.action.new")), true);
      assert.equal(Boolean(currentRecord), true);
      assert.equal(Boolean(findByUiId(root, "restarbeiten.editbox.meta.itemClass")), true);
      assert.equal(Boolean(findByUiId(root, "restarbeiten.editbox.validation.shortText")), true);
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
      assert.equal(currentRecord.textContent, "Nr.: 7 in Bearbeitung");
      assert.equal(header.children[0], currentRecord);
      assert.equal(findByText(header.children[1], "button", "Neu").textContent, "Neu");
      assert.equal(findByText(header.children[1], "button", "Speichern").textContent, "Speichern");
      assert.equal(Boolean(findByUiId(header.children[1], "restarbeiten.editbox.action.delete")), true);
      assert.equal(findByText(root, "button", "Notiz").disabled, false);
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

      const noteBtn = findByText(root, "button", "Notiz");
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

  await run("Restarbeiten: Editbox speichert nicht ohne Kurztext und kann Verantwortlich leeren", async () => {
    const editbox = await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/RestarbeitenEditbox.js"));
    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      let saveCalls = 0;
      const patches = [];
      const root = editbox.buildRestarbeitenEditbox({
        draft: {
          id: "ra-1",
          short_text: "",
          responsible_project_firm_id: "firm-1",
          responsible_label: "AB Bau",
        },
        responsibleOptions: [{ value: "firm-1", label: "AB Bau" }],
        onSave: () => {
          saveCalls += 1;
        },
        onDraftChange: (patch) => patches.push(patch),
      });

      findByText(root, "button", "Speichern").click();
      assert.equal(saveCalls, 0);

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

      const saveBtn = findByText(root, "button", "Speichern");
      const validation = findByUiId(root, "restarbeiten.editbox.validation.shortText");
      assert.equal(saveBtn.disabled, true);
      assert.equal(validation.textContent, "Kurztext erforderlich");

      triggerValue(findByUiId(root, "restarbeiten.editbox.text.short"), "Neue Restarbeit", "input");
      assert.equal(screen.draft.short_text, "Neue Restarbeit");
      assert.equal(saveBtn.disabled, false);
      assert.equal(validation.textContent, "");
      assert.equal(renderCalls, 0);

      triggerValue(findByUiId(root, "restarbeiten.editbox.text.long"), "Lange Beschreibung", "input");
      assert.equal(screen.draft.long_text, "Lange Beschreibung");
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

      triggerValue(findByUiId(screen.root, "restarbeiten.editbox.meta.status"), "offen", "change");
      triggerValue(findByUiId(screen.root, "restarbeiten.editbox.meta.dueDate"), "2026-06-20", "change");
      assert.equal(screen.draft.ampelState, "gruen");
      assert.equal(findByUiId(screen.root, "restarbeiten.editbox.meta.ampel").children[0].dataset.state, "gruen");
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
    assert.equal(source.includes("window.scrollTo"), false);
    assert.equal(source.includes("scrollIntoView"), true);
    assert.equal(source.includes("data-bbm-restarbeiten-record-id"), true);
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
    assert.equal(ids.has("restarbeiten.editbox.header.currentRecord"), true);
    assert.equal(ids.has("restarbeiten.editbox.action.new"), true);
    assert.equal(ids.has("restarbeiten.editbox.action.save"), true);
    assert.equal(ids.has("restarbeiten.editbox.action.delete"), true);
    assert.equal(ids.has("restarbeiten.editbox.meta.itemClass"), true);
    assert.equal(ids.has("restarbeiten.quicklane"), true);
    assert.equal(ids.has("restarbeiten.editbox.validation.shortText"), true);
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
