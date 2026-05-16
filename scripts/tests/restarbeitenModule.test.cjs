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
    assert.doesNotMatch(content, /Diktat|Druck|Mail|Loeschen|Archivieren/);
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
        restarbeitenListAttachments: async () => ({ ok: true, attachments: [] }),
        restarbeitenSetPrimaryAttachment: async () => ({ ok: true }),
        projectFirmsListByProject: async () => ({
          ok: true,
          list: [
            { id: "f1", name: "Firma A" },
            { id: "f2", name: "Firma B" },
          ],
        }),
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


  await run("M7 IPC/Preload: Attachment-Endpunkte vorhanden ohne Upload/Delete", () => {
    const ipc = fs.readFileSync(path.join(__dirname, "../../src/main/ipc/restarbeitenIpc.js"), "utf8");
    const preload = fs.readFileSync(path.join(__dirname, "../../src/main/preload.js"), "utf8");
    assert.match(ipc, /restarbeiten:listAttachments/);
    assert.match(ipc, /restarbeiten:setPrimaryAttachment/);
    assert.match(preload, /restarbeitenListAttachments/);
    assert.match(preload, /restarbeitenSetPrimaryAttachment/);
    assert.doesNotMatch(ipc, /restarbeiten:deleteAttachment|restarbeiten:uploadAttachment|image/i);
  });

  await run("M7 DataSource: Attachments-Liste/Primary und Bridge-Fehler", async () => {
    const repo = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js")
    );
    const prevWindow = globalThis.window;
    const calls = [];
    globalThis.window = {
      bbmDb: {
        restarbeitenListAttachments: async (payload) => {
          calls.push({ type: "list", payload });
          return { ok: true, attachments: [{ id: "a-1" }] };
        },
        restarbeitenSetPrimaryAttachment: async (payload) => {
          calls.push({ type: "primary", payload });
          return { ok: true };
        },
      },
    };
    try {
      const list = await repo.listRestarbeitAttachments("r-1");
      assert.equal(Array.isArray(list), true);
      await repo.setPrimaryRestarbeitAttachment("r-1", "a-1");
      assert.equal(calls[0].payload.restarbeitId, "r-1");
      assert.equal(calls[1].payload.attachmentId, "a-1");
    } finally {
      globalThis.window = prevWindow;
    }

    globalThis.window = { bbmDb: {} };
    try {
      await assert.rejects(() => repo.listRestarbeitAttachments("r-1"), /restarbeitenListAttachments fehlt/);
    } finally {
      globalThis.window = prevWindow;
    }
  });




  await run("M7 Screen: Attachment-Ladefehler bricht Screen nicht hart ab", async () => {
    const prevWindow = globalThis.window;
    const prevDocument = globalThis.document;
    globalThis.window = {
      bbmDb: {
        restarbeitenGetProjectSettings: async () => ({ ok: true, settings: {} }),
        restarbeitenListByProject: async () => ({
          ok: true,
          items: [{ id: "r-1", running_number: 1, created_at: "2026-05-16", status: "offen", short_text: "A" }],
        }),
        projectFirmsListByProject: async () => ({ ok: true, list: [] }),
        restarbeitenListAttachments: async () => ({ ok: false, error: "kaputt" }),
        restarbeitenSetPrimaryAttachment: async () => ({ ok: true }),
      },
    };
    globalThis.document = createFakeDocument();

    try {
      const Screen = (
        await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"))
      ).default;
      const screen = new Screen({ projectId: "p-1" });
      screen.render();
      await screen.load();

      const row = screen.listHost.children[0].children[1].children[0];
      row.dispatchEvent({ type: "click" });
      await new Promise((resolve) => setTimeout(resolve, 0));

      assert.equal(screen.selectedItemId, "r-1");
      assert.equal(screen.listHost.children[0].tagName, "TABLE");
      assert.equal(screen.editbox?.statusEl?.textContent, "Fotos konnten nicht geladen werden.");
    } finally {
      globalThis.window = prevWindow;
      globalThis.document = prevDocument;
    }
  });

  await run("M7 View/Editbox/Screen: Attachment-Anzeige verdrahtet", () => {
    const view = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenAttachmentsView.js"), "utf8");
    const editbox = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js"), "utf8");
    const screen = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"), "utf8");

    assert.match(view, /Noch keine Fotos vorhanden\./);
    assert.match(view, /slice\(0, 3\)/);
    assert.match(view, /Hauptfoto/);
    assert.match(editbox, /setAttachments\(attachments\)/);
    assert.match(editbox, /onSetPrimaryAttachment/);
    assert.match(screen, /listRestarbeitAttachments/);
    assert.match(screen, /setPrimaryRestarbeitAttachment/);
    assert.doesNotMatch(screen, /innerHTML\s*=/);
    assert.doesNotMatch(editbox + view + screen, /Foto-Hinzufuegen|Loeschen|Diktat|Druck|Mail/);
  });

  await run("M5 Screen: fehlender Projektkontext zeigt nur den Kontext-Hinweis", async () => {
    const prevWindow = globalThis.window;
    const prevDocument = globalThis.document;
    globalThis.window = {
      bbmDb: {
        restarbeitenGetProjectSettings: async () => ({ ok: true, settings: {} }),
        restarbeitenListByProject: async () => ({ ok: true, items: [] }),
        restarbeitenCreateItem: async () => ({ ok: true, item: { id: "x" } }),
        restarbeitenUpdateItem: async () => ({ ok: true, item: { id: "x" } }),
      },
    };
    globalThis.document = createFakeDocument();

    try {
      const screen = new (
        await importEsmFromFile(
          path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
        )
      ).default({});

      const root = screen.render();
      assert.equal(root.children.length >= 3, true);
      assert.match(screen.listHost.children[0].textContent, /Kein Projektkontext/);
      assert.equal(screen.editHost.children.length, 0);
      assert.equal(screen.headerHost.children[0].children[1].disabled, true);

      await screen.load();
      assert.match(screen.listHost.children[0].textContent, /Kein Projektkontext/);
      assert.equal(screen.editHost.children.length, 0);
      assert.notEqual(screen.listHost.children[0].textContent, "Für dieses Projekt sind noch keine Restarbeiten vorhanden.");
    } finally {
      globalThis.window = prevWindow;
      globalThis.document = prevDocument;
    }
  });



  await run("M6 DataSource: listResponsibleProjectFirms nutzt Bridge und normalisiert Antworten", async () => {
    const repo = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js")
    );

    const prevWindow = globalThis.window;
    const calls = [];
    globalThis.window = {
      bbmDb: {
        projectFirmsListByProject: async (projectId) => {
          calls.push(projectId);
          return { ok: true, list: [{ id: "f1", name: "Firma A" }] };
        },
      },
    };

    try {
      const rows = await repo.listResponsibleProjectFirms("p-1");
      assert.equal(Array.isArray(rows), true);
      assert.equal(rows[0].id, "f1");
      assert.equal(calls[0], "p-1");

      globalThis.window.bbmDb.projectFirmsListByProject = async () => ({ ok: true, firms: [{ id: "f2", name: "Firma B" }] });
      const rows2 = await repo.listResponsibleProjectFirms("p-2");
      assert.equal(Array.isArray(rows2), true);
      assert.equal(rows2[0].id, "f2");

      globalThis.window.bbmDb.projectFirmsListByProject = async () => ({ ok: true });
      const rows3 = await repo.listResponsibleProjectFirms("p-3");
      assert.equal(Array.isArray(rows3), true);
      assert.equal(rows3.length, 0);
    } finally {
      globalThis.window = prevWindow;
    }

    const prevWindow2 = globalThis.window;
    globalThis.window = { bbmDb: {} };
    try {
      await assert.rejects(
        () => repo.listResponsibleProjectFirms("p-1"),
        /projectFirmsListByProject fehlt/
      );
    } finally {
      globalThis.window = prevWindow2;
    }
  });

  await run("M6 Editbox: Select, Optionen und Save-Payload inkl. Fallback", async () => {
    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const Editbox = (
        await importEsmFromFile(
          path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js")
        )
      ).default;

      const box = new Editbox({ documentRef: globalThis.document, onSave: async () => {} });
      const root = box.render();
      assert.equal(root.tagName, "SECTION");

      const select = box.fields.responsible_project_firm_id;
      assert.equal(select.tagName, "SELECT");
      assert.equal(select.children[0].textContent, "— keine Auswahl —");

      box.setProjectFirms([
        { id: "f1", name: "Firma A" },
        { id: "f2", name: "Firma B" },
      ]);
      assert.equal(select.children.length >= 3, true);
      assert.equal(select.children[1].textContent, "Firma A");

      box.setItem({ id: "r1", responsible_label: "Altlabel" });
      select.value = "f1";
      const draft = box.getDraft();
      assert.equal(draft.responsible_project_firm_id, "f1");
      assert.equal(draft.responsible_label, "Firma A");

      box.setProjectFirms([{ id: "f2", name: "Firma B" }]);
      box.setItem({ id: "r2", responsible_project_firm_id: "missing", responsible_label: "Legacy Firma" });
      const selectedLegacy = box.fields.responsible_project_firm_id.value;
      assert.equal(selectedLegacy, "missing");
      const legacyDraft = box.getDraft();
      assert.equal(legacyDraft.responsible_label, "Legacy Firma");

      const editboxSource = fs.readFileSync(
        path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js"),
        "utf8"
      );
      assert.doesNotMatch(editboxSource, /Diktat|Druck|Mail/);
    } finally {
      globalThis.document = prevDocument;
    }
  });

  await run("M6 Screen: load laedt Firmen, gibt an Editbox weiter und speichert Firmendaten", async () => {
    const prevWindow = globalThis.window;
    const prevDocument = globalThis.document;
    const calls = [];
    globalThis.document = createFakeDocument();
    const items = [
      { id: "r-1", running_number: 1, created_at: "2026-05-16", item_class: "rest", status: "offen", responsible_label: "Alt" },
    ];
    globalThis.window = {
      bbmDb: {
        restarbeitenGetProjectSettings: async () => ({ ok: true, settings: {} }),
        restarbeitenListByProject: async () => ({ ok: true, items: items.map((i) => ({ ...i })) }),
        restarbeitenListAttachments: async () => ({ ok: true, attachments: [] }),
        restarbeitenSetPrimaryAttachment: async () => ({ ok: true }),
        projectFirmsListByProject: async () => ({ ok: true, list: [{ id: "f1", name: "Firma A" }] }),
        restarbeitenCreateItem: async () => ({ ok: true, item: { id: "r-2" } }),
        restarbeitenUpdateItem: async (payload) => {
          calls.push(payload);
          return { ok: true, item: { id: payload.id, ...payload.patch } };
        },
      },
    };

    try {
      const Screen = (
        await importEsmFromFile(
          path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
        )
      ).default;
      const screen = new Screen({ projectId: "p-1" });
      const root = screen.render();
      assert.equal(typeof screen.load, "function");
      assert.equal(root.children.length >= 3, true);

      await screen.load();
      assert.equal(screen.projectFirms.length, 1);
      assert.equal(screen.editbox.projectFirms[0].id, "f1");

      const row = screen.listHost.children[0].children[1].children[0];
      row.dispatchEvent({ type: "click" });
      screen.editbox.fields.responsible_project_firm_id.value = "f1";
      await screen.editbox.onSave(screen.editbox.getDraft());

      assert.equal(calls.length > 0, true);
      const patch = calls[0].patch || {};
      assert.equal(patch.responsible_project_firm_id, "f1");
      assert.equal(patch.responsible_label, "Firma A");

      const fileContent = fs.readFileSync(
        path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"),
        "utf8"
      );
      assert.doesNotMatch(fileContent, /innerHTML\s*=/);
      assert.doesNotMatch(fileContent, /async\s+render\s*\(/);
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
