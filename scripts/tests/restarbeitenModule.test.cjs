const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function withPatchedRestarbeitenIpc(stubs, fn) {
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    const fromRestarbeitenIpc = String(parent?.filename || "").endsWith(path.join("ipc", "restarbeitenIpc.js"));
    if (fromRestarbeitenIpc && request === "electron") return stubs.electron;
    if (fromRestarbeitenIpc && request === "../db/restarbeitenRepo") return stubs.restarbeitenRepo;
    return originalLoad.apply(this, arguments);
  };

  try {
    const modPath = path.join(__dirname, "../../src/main/ipc/restarbeitenIpc.js");
    delete require.cache[require.resolve(modPath)];
    const mod = require(modPath);
    return fn(mod);
  } finally {
    Module._load = originalLoad;
  }
}

function createFakeDocument() {
  const createNode = (tag, doc) => {
    const node = {
      tagName: String(tag || "").toUpperCase(),
      ownerDocument: doc,
      children: [],
      style: {},
      dataset: {},
      className: "",
      textContent: "",
      disabled: false,
      value: "",
      type: "",
      rows: 0,
      append(...nodes) {
        for (const child of nodes) {
          if (child && typeof child === "object") child.parentElement = this;
          this.children.push(child);
        }
      },
      appendChild(nodeChild) {
        if (nodeChild && typeof nodeChild === "object") nodeChild.parentElement = this;
        this.children.push(nodeChild);
        return nodeChild;
      },
      replaceChildren(...nodes) {
        this.children = [...nodes];
        for (const child of this.children) {
          if (child && typeof child === "object") child.parentElement = this;
        }
      },
      setAttribute(name, value) {
        this[String(name)] = String(value);
      },
      addEventListener(type, handler) {
        if (!this._listeners) this._listeners = {};
        if (!this._listeners[type]) this._listeners[type] = [];
        this._listeners[type].push(handler);
      },
      dispatchEvent(event) {
        const evt = event || {};
        const type = String(evt.type || "");
        for (const handler of this._listeners?.[type] || []) {
          handler.call(this, evt);
        }
        return true;
      },
      click() {
        if (typeof this.onclick === "function") this.onclick({ type: "click", preventDefault() {} });
        this.dispatchEvent({ type: "click", preventDefault() {} });
      },
      classList: {
        add() {},
        remove() {},
        toggle() {},
      },
    };
    return node;
  };

  const doc = {
    activeElement: null,
    createElement(tag) {
      return createNode(tag, doc);
    },
    body: null,
    head: null,
  };
  doc.body = createNode("body", doc);
  doc.head = createNode("head", doc);
  return doc;
}

async function runRestarbeitenModuleTests(run) {
  const [restarbeitenModule, screenResolver, workspaceModule] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/index.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleEntryScreenResolver.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js")),
  ]);

  await run("Restarbeiten: Modulentry hat erwartete Struktur", () => {
    const entry = restarbeitenModule.getRestarbeitenModuleEntry();
    assert.equal(entry.moduleId, "restarbeiten");
    assert.equal(entry.moduleLabel, "Restarbeiten");
    assert.equal(entry.workScreenId, "restarbeitenWork");
    assert.equal(entry.navigation.project[0].key, "restarbeiten");
  });

  await run("Restarbeiten: Workscreen ist ueber Resolver aufloesbar", () => {
    const entry = restarbeitenModule.getRestarbeitenModuleEntry();
    const resolved = screenResolver.resolveModuleWorkScreenFromEntry(entry);
    assert.equal(typeof resolved, "function");
  });

  await run("ProjectWorkspaceScreen: Restarbeiten wird als Modul geoeffnet", async () => {
    const calls = [];
    const screen = new workspaceModule.default({
      router: {
        currentProjectId: "22",
        async showProjectFirms(projectId) {
          calls.push({ type: "firms", projectId });
        },
        async openProjectModule(projectId, moduleId, options) {
          calls.push({ type: "module", projectId, moduleId, options });
          return { ok: true };
        },
      },
      projectId: "22",
      project: { id: "22", name: "Test" },
    });

    assert.equal(await screen.openProjectModule("restarbeiten"), true);
    const restCall = calls.find((c) => c.type === "module" && c.moduleId === "restarbeiten");
    assert.equal(restCall.options.project.id, "22");
  });

  await run("M4 IPC/Preload: Restarbeiten-Lesewege vorhanden, keine Schreibwege", () => {
    const ipcPath = path.join(__dirname, "../../src/main/ipc/restarbeitenIpc.js");
    const mainPath = path.join(__dirname, "../../src/main/main.js");
    const preloadPath = path.join(__dirname, "../../src/main/preload.js");
    const ipc = fs.readFileSync(ipcPath, "utf8");
    const main = fs.readFileSync(mainPath, "utf8");
    const preload = fs.readFileSync(preloadPath, "utf8");

    assert.match(ipc, /restarbeiten:listByProject/);
    assert.match(ipc, /restarbeiten:getProjectSettings/);
    assert.match(main, /registerRestarbeitenIpc/);
    assert.match(preload, /restarbeitenListByProject/);
    assert.match(preload, /restarbeitenGetProjectSettings/);
    assert.match(preload, /restarbeitenCreateItem/);
    assert.match(preload, /restarbeitenUpdateItem/);
    assert.doesNotMatch(ipc, /restarbeiten:delete|restarbeiten:archive|restarbeiten:attachment/);
  });

  await run("M4 Screen-Grenzen: sync render, load-Methode, 4 Spalten, kein innerHTML-Datenbau", () => {
    const screenPath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js");
    const content = fs.readFileSync(screenPath, "utf8");

    assert.doesNotMatch(content, /async\s+render\s*\(/);
    assert.match(content, /render\s*\(/);
    assert.match(content, /async\s+load\s*\(/);
    assert.match(content, /\+ Restarbeit/);
    assert.match(content, /Restarbeiten werden geladen/);
    assert.match(content, /Restarbeiten vorhanden/);
    assert.match(content, /Nr\. \/ Datum/);
    assert.match(content, /Verortung/);
    assert.match(content, /Restarbeit/);
    assert.match(content, /Status/);
    assert.doesNotMatch(content, /tr\.innerHTML|innerHTML\s*=\s*\[/);
    assert.doesNotMatch(content, /Diktat|Foto|Druck|Mail|Loeschen|Archivieren/);
  });

  await run("M5 Repo/IPC/Preload/DataSource: Create und Update sind verdrahtet", async () => {
    const repo = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js")
    );
    const ipcSource = fs.readFileSync(path.join(__dirname, "../../src/main/ipc/restarbeitenIpc.js"), "utf8");
    const preload = fs.readFileSync(path.join(__dirname, "../../src/main/preload.js"), "utf8");

    assert.match(ipcSource, /restarbeiten:createItem/);
    assert.match(ipcSource, /restarbeiten:updateItem/);
    assert.match(preload, /restarbeitenCreateItem/);
    assert.match(preload, /restarbeitenUpdateItem/);

    const calls = [];
    const prevWindow = globalThis.window;
    globalThis.window = {
      bbmDb: {
        restarbeitenCreateItem: async (payload) => {
          calls.push({ type: "create", payload });
          return { ok: true, item: { id: "new-1", project_id: payload.projectId, short_text: payload.short_text || "" } };
        },
        restarbeitenUpdateItem: async (payload) => {
          calls.push({ type: "update", payload });
          return { ok: true, item: { id: payload.id, short_text: payload.patch.short_text || "" } };
        },
        restarbeitenListByProject: async () => ({ ok: true, items: [] }),
        restarbeitenGetProjectSettings: async () => ({ ok: true, settings: {} }),
      },
    };

    try {
      const created = await repo.createRestarbeitItem("p-1", { short_text: "Neu", item_class: "mangel" });
      const updated = await repo.updateRestarbeitItem("new-1", { short_text: "Neu 2", status: "unbekannt" });
      assert.equal(created.id, "new-1");
      assert.equal(updated.id, "new-1");
      assert.equal(calls[0].type, "create");
      assert.equal(calls[0].payload.projectId, "p-1");
      assert.equal(calls[1].type, "update");
      assert.equal(calls[1].payload.id, "new-1");
      assert.equal(calls[1].payload.patch.short_text, "Neu 2");
    } finally {
      globalThis.window = prevWindow;
    }
  });

  await run("M5 Screen: Neu, Auswahl, Editbox, Speichern", async () => {
    const prevWindow = globalThis.window;
    const prevDocument = globalThis.document;
    const calls = [];
    const items = [
      {
        id: "r-1",
        running_number: 1,
        created_at: "2026-05-16",
        location_level_1: "Haus A",
        short_text: "Alt",
        long_text: "Lang",
        item_class: "rest",
        status: "offen",
      },
    ];
    globalThis.window = {
      bbmDb: {
        restarbeitenGetProjectSettings: async () => ({ ok: true, settings: { level_1_label: "Haus" } }),
        restarbeitenListByProject: async () => ({ ok: true, items: items.map((item) => ({ ...item })) }),
        restarbeitenCreateItem: async (payload) => {
          calls.push({ type: "create", payload });
          const created = {
            id: "r-2",
            running_number: 2,
            created_at: "2026-05-16",
            short_text: "",
            long_text: "",
            item_class: "rest",
            status: "offen",
          };
          items.push(created);
          return {
            ok: true,
            item: { ...created },
          };
        },
        restarbeitenUpdateItem: async (payload) => {
          calls.push({ type: "update", payload });
          const target = items.find((item) => String(item.id) === String(payload.id));
          if (target) Object.assign(target, payload.patch || {});
          return { ok: true, item: { id: payload.id, ...payload.patch } };
        },
      },
    };
    const fakeDoc = createFakeDocument();
    globalThis.document = fakeDoc;

    try {
      const screen = new (
        await importEsmFromFile(
          path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
        )
      ).default({
        projectId: "p-1",
      });

      const root = screen.render();
      assert.equal(root.children.length >= 3, true);
      await screen.load();

      assert.equal(screen.listHost.children[0].tagName, "TABLE");
      const row = screen.listHost.children[0].children[1].children[0];
      row.dispatchEvent({ type: "click" });
      assert.equal(screen.selectedItemId, "r-1");
      assert.equal(screen.editbox.fields.short_text.value, "Alt");

      screen.editbox.fields.short_text.value = "Neu";
      screen.editbox.fields.long_text.value = "Lang 2";
      screen.editbox.fields.item_class.value = "mangel";
      screen.editbox.fields.status.value = "in_arbeit";
      await screen.editbox.onSave(screen.editbox.getDraft());

      assert.equal(calls.find((call) => call.type === "update")?.payload.id, "r-1");
      assert.equal(calls.find((call) => call.type === "update")?.payload.patch.short_text, "Neu");

      await screen._createRestarbeit();
      assert.equal(calls.find((call) => call.type === "create")?.payload.projectId, "p-1");
      assert.equal(screen.selectedItemId, "r-2");
    } finally {
      globalThis.window = prevWindow;
      globalThis.document = prevDocument;
    }
  });

  await run("M4 ViewModel: Mapping fuer Anzeigezeilen", async () => {
    const vm = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/viewModel/restarbeitenListItems.js")
    );

    const item = vm.toRestarbeitenListItem({
      id: "x",
      running_number: 1,
      created_at: "2026-05-16",
      location_level_1: "Haus A",
      location_level_2: "EG",
      short_text: "Fenster",
      long_text: "nachstellen",
      item_class: "mangel",
      status: "geprueft_erledigt",
      due_date: "2026-05-20",
      responsible_label: "Firma Test",
    });

    assert.equal(item.numberLine, "#1");
    assert.equal(item.locationLine1, "Haus A / EG");
    assert.equal(item.workLine2, "nachstellen");
    assert.match(item.statusLine1, /Mangel/);
    assert.match(item.statusLine1, /gepr[üu]ft erledigt/);
    assert.equal(item.statusLine2, "2026-05-20");
    assert.equal(item.statusLine3, "Firma Test");

    const fallback = vm.toRestarbeitenListItem({ item_class: "rest", status: "in_arbeit" });
    assert.match(fallback.statusLine1, /Rest/);
    assert.match(fallback.statusLine1, /in Arbeit/);
    assert.equal(fallback.statusLine3, "—");
    assert.equal(JSON.stringify(fallback).includes("undefined"), false);
  });
}

module.exports = { runRestarbeitenModuleTests };
