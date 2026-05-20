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

function collectText(node) {
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

function findButtonByText(root, text) {
  return findNodes(
    root,
    (node) => node?.tagName === "BUTTON" && String(node?.textContent || "").trim() === String(text)
  )[0] || null;
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
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 200,
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
    assert.equal(entry.shell.hideSidebar, true);
  });

  await run("Restarbeiten: Workscreen ist ueber Resolver aufloesbar", () => {
    const entry = restarbeitenModule.getRestarbeitenModuleEntry();
    const resolved = screenResolver.resolveModuleWorkScreenFromEntry(entry);
    assert.equal(typeof resolved, "function");
  });


  await run("Restarbeiten: Router wertet hideSidebar nur modulbezogen aus", () => {
    const routerPath = path.join(__dirname, "../../src/renderer/app/Router.js");
    const coreShellPath = path.join(__dirname, "../../src/renderer/app/CoreShell.js");
    const routerSource = fs.readFileSync(routerPath, "utf8");
    const coreShellSource = fs.readFileSync(coreShellPath, "utf8");

    assert.equal(routerSource.includes("moduleEntry?.shell?.hideSidebar === true"), true);
    assert.equal(routerSource.includes("this._setSidebarVisibility(!hideSidebar);"), true);
    assert.equal(routerSource.includes("hideSidebar: false"), true);
    assert.equal(coreShellSource.includes("router.shellLayout = { sidebar, bodyRow };"), true);
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



  await run("ProjectWorkspaceScreen: Restarbeiten-Kachel ist sichtbar, startet korrekt und bleibt eindeutig", async () => {
    const routerCalls = [];
    const screen = new workspaceModule.default({
      router: {
        currentProjectId: "22",
        async openProjectModule(projectId, moduleId, options) {
          routerCalls.push({ projectId, moduleId, options });
          return { ok: true };
        },
        async showProjectFirms(projectId) {
          routerCalls.push({ projectId, moduleId: "projectFirms" });
          return true;
        },
      },
      projectId: "22",
      project: { id: "22", name: "Test" },
      projectModules: [
        { moduleId: "protokoll", label: "Protokoll", description: "Protokoll im aktuellen Projekt öffnen." },
        { moduleId: "restarbeiten", label: "Restarbeiten", description: "Restarbeiten und Mängel im Projekt verwalten" },
        { moduleId: "projectFirms", label: "Firmen im Projekt", description: "Projektbezogene Firmen und Mitarbeiter im aktuellen Projekt öffnen." },
      ],
    });

    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const root = screen.render();
      const allText = collectText(root);
      assert.equal(allText.includes("Restarbeiten"), true);

      const restButtons = findNodes(
        root,
        (node) => node?.tagName === "BUTTON" && node?.textContent === "Restarbeiten"
      );
      const protokollButtons = findNodes(
        root,
        (node) => node?.tagName === "BUTTON" && node?.textContent === "Protokoll"
      );
      const projectFirmsButtons = findNodes(
        root,
        (node) => node?.tagName === "BUTTON" && node?.textContent === "Firmen im Projekt"
      );

      assert.equal(restButtons.length, 1);
      assert.equal(protokollButtons.length, 1);
      assert.equal(projectFirmsButtons.length, 1);

      restButtons[0].click();
      protokollButtons[0].click();
      projectFirmsButtons[0].click();

      const restCall = routerCalls.find((entry) => entry.moduleId === "restarbeiten");
      assert.deepEqual(restCall, {
        projectId: "22",
        moduleId: "restarbeiten",
        options: { project: { id: "22", name: "Test" } },
      });
      assert.equal(routerCalls.filter((entry) => entry.moduleId === "restarbeiten").length, 1);
      assert.equal(routerCalls.some((entry) => entry.moduleId === "protokoll"), true);
      assert.equal(routerCalls.some((entry) => entry.moduleId === "projectFirms"), true);
    } finally {
      globalThis.document = prevDocument;
    }
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
    assert.match(ipc, /restarbeiten:softDeleteItem/);
    assert.match(preload, /restarbeitenSoftDeleteItem/);
    assert.doesNotMatch(ipc, /restarbeiten:archive/);
    assert.doesNotMatch(ipc, /restarbeiten:deleteItem/);
  });

  await run("M14 Screen-UI: Header, Blattstruktur, Verortung 1-4, Fotos einklappbar, Editbox unten", () => {
    const screenPath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js");
    const stylePath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/restarbeitenListStyle.js");
    const content = fs.readFileSync(screenPath, "utf8");
    const styleContent = fs.readFileSync(stylePath, "utf8");

    assert.doesNotMatch(content, /async\s+render\s*\(/);
    assert.match(content, /render\s*\(/);
    assert.match(content, /async\s+load\s*\(/);
    assert.match(content, /Schließen/);
    assert.doesNotMatch(content, /Metaspalten/);
    assert.match(content, /location_level_1/);
    assert.match(content, /location_level_4/);
    assert.match(content, /Keine Restarbeiten für die aktuellen Filter/);
    assert.match(content, /data-bbm-restarbeiten-screen/);
    assert.match(content, /restarbeiten-header__filters/);
    assert.match(content, /restarbeiten-list__attachmentsWrap/);
    assert.match(content, /restarbeiten-list__photosToggle/);
    assert.match(content, /dataset\.expanded/);
    assert.doesNotMatch(content, /tr\.innerHTML|innerHTML\s*=\s*\[/);
    assert.doesNotMatch(content, /Diktat|Archivieren/);
    assert.match(content, /Drucken/);
    assert.match(content, /_printFilteredList/);
    assert.match(styleContent, /restarbeiten-sheet__list/);
  });

  await run("M14 Smoke: RestarbeitenScreen import + render ohne ReferenceError", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
    );
    assert.equal(typeof mod.default, "function");
    const RestarbeitenScreen = mod.default;

    const prevWindow = globalThis.window;
    const prevDocument = globalThis.document;
    globalThis.window = { bbmDb: {} };
    globalThis.document = createFakeDocument();

    try {
      const screen = new RestarbeitenScreen({
        projectId: "p-1",
        router: { async showProjectWorkspace() { return true; } },
      });
      const root = screen.render();
      assert.equal(typeof root, "object");
      assert.equal(String(root["data-bbm-restarbeiten-screen"] || "").includes("true"), true);
      assert.equal(String(screen.listHost?.className || "").includes("restarbeiten-sheet__list"), true);

      const allText = collectText(root);
      assert.equal(allText.includes("Schließen"), true);
      assert.equal(Boolean(findButtonByText(screen.headerHost, "+ Restpunkt")), false);
      assert.equal(allText.includes("Ebene 1") || allText.includes("Haus"), true);
      assert.equal(Boolean(findButtonByText(screen.headerHost, "Metaspalten")), false);

      assert.equal(allText.includes("Alle"), true);
    } finally {
      globalThis.window = prevWindow;
      globalThis.document = prevDocument;
    }
  });


  await run("M23 UI-Nachschaerfung: Header, R/M, Ampel, Typografie und Editbox-Meta", () => {
    const screenPath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js");
    const stylePath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/restarbeitenListStyle.js");
    const vmPath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/viewModel/restarbeitenListItems.js");
    const editboxPath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js");

    const screen = fs.readFileSync(screenPath, "utf8");
    const style = fs.readFileSync(stylePath, "utf8");
    const vm = fs.readFileSync(vmPath, "utf8");
    const editbox = fs.readFileSync(editboxPath, "utf8");

    assert.doesNotMatch(screen, /title\.textContent\s*=\s*"Restarbeiten"/);
    assert.doesNotMatch(screen, /restarbeiten-sheet__title|Arbeitsblatttitel/);
    assert.match(screen, /restarbeiten-header__filters/);
    assert.match(screen, /Schließen/);

    assert.match(vm, /itemClassToken/);
    assert.match(vm, /itemClassLabel/);
    assert.match(vm, /return "M"/);
    assert.match(vm, /return "R"/);
    assert.match(vm, /return "Mangel"/);
    assert.match(vm, /return "Rest"/);
    assert.doesNotMatch(screen, /item\.itemClassLabel/);
    assert.match(screen, /number\.textContent\s*=\s*`\$\{item\.itemClassToken\} \$\{item\.numberLine\}`/);

    assert.match(screen, /statusLine\.className\s*=\s*"restarbeiten-list__ampelLine"/);
    assert.match(screen, /statusLine\.textContent\s*=\s*item\.statusLabel/);
    assert.match(screen, /ampelDot\.dataset\.ampel/);
    assert.match(screen, /restarbeiten-list__ampel--\$\{item\.ampelState\}/);

    assert.match(style, /restarbeiten-list__metaCol\{font-size:8pt/);
    assert.match(style, /restarbeiten-list__date\{font-size:8pt/);
    assert.match(style, /restarbeiten-list__shortText\{font-weight:500/);
    assert.match(style, /restarbeiten-sheet__list\{[^}]*display:flex/);
    assert.match(style, /restarbeiten-sheet__list\{[^}]*justify-content:flex-end/);
    assert.match(style, /restarbeiten-editbox__metaRow--dueDate\{[^}]*align-items:end/);
    assert.match(style, /restarbeiten-editbox__metaRow--status\{[^}]*align-items:end/);
    assert.match(style, /restarbeiten-editbox__metaDate/);
    assert.match(style, /restarbeiten-editbox__topBar\{[^}]*display:flex/);
    assert.match(style, /restarbeiten-editbox__body\{[^}]*display:grid/);
    assert.match(style, /restarbeiten-editbox__rightGroup\{[^}]*display:grid/);
    assert.match(style, /restarbeiten-editbox__rightGroup\{[^}]*justify-content:flex-end/);
    assert.doesNotMatch(style, /calc\(100% - 3cm\)/);
    assert.doesNotMatch(style, /width:60%/);
    assert.doesNotMatch(style, /grid-template-columns:92px 250px/);
    assert.doesNotMatch(style, /max-width:92px/);
    assert.doesNotMatch(style, /width:190px/);
    assert.doesNotMatch(style, /restarbeiten-editbox__ampelPreview\{[^}]*min-height:23px/);
    assert.match(style, /restarbeiten-editbox__ampelPreview\{[^}]*min-height:0/);
    assert.match(style, /restarbeiten-editbox__ampelPreview\{[^}]*padding:0/);
    assert.match(style, /restarbeiten-editbox__ampelPreview\{[^}]*border:0/);
    assert.match(style, /restarbeiten-editbox__ampelPreview\{[^}]*background:transparent/);
    assert.match(style, /restarbeiten-list__ampel\{[^}]*width:10px;[^}]*height:10px/);
    assert.match(style, /restarbeiten-header\{[^}]*border-bottom/);

    assert.match(editbox, /restarbeiten-editbox__metaRow--dueDate/);
    assert.match(editbox, /restarbeiten-editbox__metaRow--status/);
    assert.match(editbox, /createField\(doc, "Status", status\)/);
    assert.match(editbox, /createField\(doc, "Fertig bis", dueDate\)/);
    assert.match(editbox, /createField\(doc, "erledigt am", completedAt\)/);
    assert.match(editbox, /Folgende Maßnahmen sind getroffen:/);
    assert.match(editbox, /aria-label", "Notiz"/);
    assert.match(editbox, /restarbeiten-editbox__metaDate/);
    assert.doesNotMatch(style, /restarbeiten-editbox__metaDate\{[^}]*appearance\s*:\s*none/);
    assert.doesNotMatch(style, /restarbeiten-editbox__metaDate\{[^}]*-webkit-appearance\s*:\s*none/);
    assert.match(editbox, /createField\(doc, "", ampelPreview\)/);
    assert.match(editbox, /ampelPreview\.className\s*=\s*"restarbeiten-editbox__ampelPreview restarbeiten-list__ampel"/);
    assert.match(editbox, /createField\(doc, "Verantwortlich", responsibleProjectFirmId\)/);
    assert.match(editbox, /restarbeiten-editbox__classToggle--compact/);
    assert.match(editbox, /topBar\.className = "restarbeiten-editbox__topBar"/);
    assert.match(editbox, /titleEl\.className = "restarbeiten-editbox__title"/);
    assert.match(editbox, /body\.className = "restarbeiten-editbox__body"/);
    assert.match(editbox, /textRail\.className = "restarbeiten-editbox__textRail"/);
    assert.match(editbox, /shortField\.className = "restarbeiten-editbox__inputSlot restarbeiten-editbox__inputSlot--short"/);
    assert.match(editbox, /longField\.className = "restarbeiten-editbox__inputSlot restarbeiten-editbox__inputSlot--long"/);
    assert.match(editbox, /shortRailRow\.className = "restarbeiten-editbox__railRow restarbeiten-editbox__railRow--short"/);
    assert.match(editbox, /longRailRow\.className = "restarbeiten-editbox__railRow restarbeiten-editbox__railRow--long"/);
    assert.match(editbox, /topBar\.append\(titleEl, classActions\)/);
    assert.match(editbox, /form\.append\(topBar, body, itemClass\)/);
    assert.doesNotMatch(editbox, /textColumn\.append\(\s*classActions,/);
    assert.match(editbox, /const markerField = createField\(doc, "", marker\)/);
    assert.match(editbox, /\+ Restpunkt/);
    assert.match(editbox, /textContent = "Löschen"/);
    assert.match(editbox, /Diesen Restpunkt wirklich löschen\?/);
    assert.match(editbox, /_openDeleteDialog\(/);
    assert.match(editbox, /Abbrechen/);
    assert.doesNotMatch(editbox, /globalThis\.confirm/);
    assert.match(editbox, /deleteBtn\.disabled = true/);
    assert.doesNotMatch(editbox, /textContent\s*=\s*"Speichern"/);
    assert.doesNotMatch(editbox, /restarbeiten-editbox__save/);
    assert.doesNotMatch(editbox, /saveBtn/);
    assert.match(editbox, /setStatus\("Änderungen werden gespeichert …"\)/);
    assert.match(editbox, /setStatus\("Speichern fehlgeschlagen"\)/);

    assert.match(editbox, /form\.addEventListener\("submit",/);
    assert.match(editbox, /event\.preventDefault\(\)/);
    assert.match(editbox, /input\.setAttribute\("list", datalist\.id\)/);
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
    assert.match(ipcSource, /restarbeiten:softDeleteItem/);
    assert.match(preload, /restarbeitenSoftDeleteItem/);

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
      {
        id: "r-9",
        running_number: 9,
        created_at: "2026-05-16",
        location_level_1: "Haus B",
        short_text: "Zweit",
        long_text: "Noch da",
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
        restarbeitenSoftDeleteItem: async (payload) => {
          calls.push({ type: "soft-delete", payload });
          const idx = items.findIndex((item) => String(item.id) === String(payload.id));
          if (idx >= 0) items[idx].deleted_at = "2026-05-18T12:00:00.000Z";
          return { ok: true, item: idx >= 0 ? { ...items[idx] } : null };
        },
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

      assert.equal(screen.listHost.children[0].tagName, "UL");
      assert.equal(screen.selectedItemId, "r-1");
      const row = screen.listHost.children[0].children[0];
      row.dispatchEvent({ type: "click" });
      assert.equal(screen.selectedItemId, "r-1");
      assert.equal(screen.editbox.fields.short_text.value, "Alt");
      assert.equal(screen.sheetArea.scrollTop, 0);

      screen.editbox.fields.short_text.value = "Neu";
      screen.editbox.fields.long_text.value = "Lang 2";
      screen.editbox.fields.item_class.value = "mangel";
      screen.editbox.fields.status.value = "in arbeit";
      await screen.editbox.onSave(screen.editbox.getDraft());

      assert.equal(calls.find((call) => call.type === "update")?.payload.id, "r-1");
      assert.equal(calls.find((call) => call.type === "update")?.payload.patch.short_text, "Neu");

      const deleteBtn = screen.editbox.fields.delete_button;
      assert.equal(Boolean(deleteBtn), true);
      assert.equal(deleteBtn.disabled, false);

      const deleteHandler = deleteBtn._listeners?.click?.[0];
      assert.equal(typeof deleteHandler, "function");
      const deletePromise = deleteHandler.call(deleteBtn, { type: "click", preventDefault() {} });
      await Promise.resolve();
      const deleteDialog =
        screen.editbox.root.querySelector?.(".restarbeiten-editbox__deleteDialog") ||
        findNodes(screen.editbox.root, (n) =>
          String(n?.className || "").includes("restarbeiten-editbox__deleteDialog")
        )[0];
      assert.equal(Boolean(deleteDialog), true);
      assert.match(collectText(deleteDialog), /Diesen Restpunkt wirklich löschen\?/);
      const cancelBtn = findButtonByText(deleteDialog, "Abbrechen");
      const confirmDeleteBtn = findButtonByText(deleteDialog, "Löschen");
      assert.equal(Boolean(cancelBtn), true);
      assert.equal(Boolean(confirmDeleteBtn), true);
      const cancelHandler = cancelBtn._listeners?.click?.[0];
      assert.equal(typeof cancelHandler, "function");
      await cancelHandler.call(cancelBtn, { type: "click", preventDefault() {} });
      await deletePromise;
      assert.equal(calls.some((call) => call.type === "soft-delete"), false);

      const deleteHandler2 = deleteBtn._listeners?.click?.[0];
      assert.equal(typeof deleteHandler2, "function");
      const deletePromise2 = deleteHandler2.call(deleteBtn, { type: "click", preventDefault() {} });
      await Promise.resolve();
      const deleteDialog2 =
        screen.editbox.root.querySelector?.(".restarbeiten-editbox__deleteDialog") ||
        findNodes(screen.editbox.root, (n) =>
          String(n?.className || "").includes("restarbeiten-editbox__deleteDialog")
        )[0];
      assert.match(collectText(deleteDialog2), /Diesen Restpunkt wirklich löschen\?/);
      const confirmDeleteBtn2 = findButtonByText(deleteDialog2, "Löschen");
      assert.equal(Boolean(confirmDeleteBtn2), true);
      const confirmDeleteHandler2 = confirmDeleteBtn2._listeners?.click?.[0];
      assert.equal(typeof confirmDeleteHandler2, "function");
      await confirmDeleteHandler2.call(confirmDeleteBtn2, { type: "click", preventDefault() {} });
      await deletePromise2;
      assert.equal(calls.find((call) => call.type === "soft-delete")?.payload.id, "r-1");
      assert.equal(screen.selectedItemId, "");
      assert.equal(screen.listHost.children[0].tagName, "UL");
      assert.equal(screen.listHost.children[0].children.length >= 1, true);
      assert.match(screen.editHost.children[0].textContent, /Einen Restpunkt auswaehlen oder ueber \+ Restpunkt neu anlegen\./);

      await screen._createRestarbeit();
      assert.equal(calls.find((call) => call.type === "create")?.payload.projectId, "p-1");
      assert.equal(screen.selectedItemId, "r-2");
      assert.equal(screen.sheetArea.scrollTop > 0, true);
      assert.equal(screen.createScrollPending, false);
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
    assert.doesNotMatch(ipc, /restarbeiten:uploadAttachment|uploadAttachment|imageProcessing/i);
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
        restarbeitenSoftDeleteItem: async (payload) => {
          calls.push({ type: "soft-delete", payload });
          const idx = items.findIndex((item) => String(item.id) === String(payload.id));
          if (idx >= 0) items[idx].deleted_at = "2026-05-18T12:00:00.000Z";
          return { ok: true, item: idx >= 0 ? { ...items[idx] } : null };
        },
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

      const row = screen.listHost.children[0].children[0];
      row.dispatchEvent({ type: "click" });
      await new Promise((resolve) => setTimeout(resolve, 0));

      assert.equal(screen.selectedItemId, "r-1");
      assert.equal(screen.listHost.children[0].tagName, "UL");
      assert.equal(screen.editbox?.statusEl?.textContent, "Fotos konnten nicht geladen werden.");
    } finally {
      globalThis.window = prevWindow;
      globalThis.document = prevDocument;
    }
  });

  await run("M7 View/Editbox/Screen: Editbox ohne Fotos, Foto-Logik bleibt erhalten", () => {
    const view = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenAttachmentsView.js"), "utf8");
    const editbox = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js"), "utf8");
    const screen = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"), "utf8");
    const dataSource = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js"), "utf8");

    assert.match(view, /Noch keine Fotos vorhanden\./);
    assert.match(view, /slice\(0, 3\)/);
    assert.match(view, /Hauptfoto/);
    assert.match(editbox, /setAttachments\(attachments\)/);
    assert.doesNotMatch(editbox, /Fotos/);
    assert.match(screen, /listRestarbeitAttachments/);
    assert.match(screen, /_renderAttachmentsPreview|restarbeiten-list__photosToggle/);
    assert.match(screen, /listRestarbeitAttachments/);
    assert.match(dataSource, /setPrimaryRestarbeitAttachment\(/);
    assert.match(dataSource, /importRestarbeitAttachments\(/);
    assert.match(dataSource, /deleteRestarbeitAttachment\(/);
    assert.doesNotMatch(screen, /innerHTML\s*=/);
    assert.doesNotMatch(editbox + view, /Diktat|Druck|Bildbearbeitung/);
    assert.doesNotMatch(screen, /Diktat|Bildbearbeitung/);
    assert.match(screen, /Drucken/);
    assert.match(screen, /_printFilteredList/);
  });


  await run("M10 IPC/Preload: deleteAttachment verdrahtet", () => {
    const ipc = fs.readFileSync(path.join(__dirname, "../../src/main/ipc/restarbeitenIpc.js"), "utf8");
    const preload = fs.readFileSync(path.join(__dirname, "../../src/main/preload.js"), "utf8");
    assert.match(ipc, /restarbeiten:deleteAttachment/);
    assert.match(preload, /restarbeitenDeleteAttachment/);
  });

  await run("M10 DataSource: deleteAttachment normalisiert Antwort", async () => {
    const ds = await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js"));
    const prevWindow = globalThis.window;
    globalThis.window = { bbmDb: { restarbeitenDeleteAttachment: async () => ({ ok: true, attachments: null, warning: "x" }) } };
    try {
      const out = await ds.deleteRestarbeitAttachment("r-1", "a-1");
      assert.equal(Array.isArray(out.attachments), true);
      assert.equal(out.warning, "x");
    } finally { globalThis.window = prevWindow; }
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
      const addButton = findButtonByText(screen.headerHost, "+ Restpunkt");
      assert.equal(Boolean(addButton), false);
      assert.equal(Boolean(findButtonByText(screen.headerHost, "Schließen")), true);
      const allText = collectText(root);
      assert.equal(allText.includes("Alle"), true);
      assert.equal(Boolean(findButtonByText(screen.headerHost, "Metaspalten")), false);

      await screen.load();
      assert.match(screen.listHost.children[0].textContent, /Kein Projektkontext/);
      assert.equal(screen.editHost.children.length, 0);
      assert.notEqual(screen.listHost.children[0].textContent, "Für dieses Projekt sind noch keine Restarbeiten vorhanden.");
    } finally {
      globalThis.window = prevWindow;
      globalThis.document = prevDocument;
    }
  });





  await run("M8 Main-IPC: Import-Handler begrenzt, bricht ab und speichert in Restarbeiten/Fotos", async () => {
    const repoState = { attachments: [], added: [] };
    const stubs = {
      electron: {
        app: { getPath: () => "/downloads" },
        dialog: {
          async showOpenDialog() {
            return {
              canceled: false,
              filePaths: ["/tmp/a.jpg", "/tmp/b.png", "/tmp/c.webp"],
            };
          },
        },
      },
      restarbeitenRepo: {
        listRestarbeitItems: () => [],
        getRestarbeitProjectSettings: () => ({}),
        createRestarbeitItem: () => ({}),
        updateRestarbeitItem: () => ({}),
        setPrimaryRestarbeitAttachment: () => true,
        listRestarbeitAttachments: () => repoState.attachments,
        addRestarbeitAttachment: (payload) => {
          if (!payload?.restarbeit_id) throw new Error("restarbeit_id required");
          if (!payload?.project_id) throw new Error("project_id required");
          if (!payload?.file_path) throw new Error("file_path required");
          repoState.added.push(payload);
          repoState.attachments = [...repoState.attachments, { id: String(repoState.attachments.length + 1), ...payload }];
          return repoState.attachments[repoState.attachments.length - 1];
        },
      },
    };

    const prev = {
      mkdirSync: fs.mkdirSync,
      copyFileSync: fs.copyFileSync,
      statSync: fs.statSync,
      existsSync: fs.existsSync,
    };
    fs.mkdirSync = () => true;
    fs.copyFileSync = () => true;
    fs.statSync = () => ({ size: 11 });
    fs.existsSync = () => false;

    try {
      await withPatchedRestarbeitenIpc(stubs, async (mod) => {
        const handlers = {};
        mod.registerRestarbeitenIpc({ ipcMain: { handle: (name, fn) => { handlers[name] = fn; } } });
        const result = await handlers["restarbeiten:importAttachments"]({}, { restarbeitId: "r1", projectId: "p1" });
        assert.equal(result.ok, true, result.error || JSON.stringify(result));
        assert.equal(result.canceled, false, JSON.stringify(result));
        assert.equal(repoState.added.length, 3, JSON.stringify(repoState.added));
        assert.equal(repoState.added[0]?.restarbeit_id, "r1", JSON.stringify(repoState.added[0] || {}));
        assert.equal(repoState.added[0]?.project_id, "p1", JSON.stringify(repoState.added[0] || {}));
        assert.match(String(repoState.added[0]?.file_path || ""), /Restarbeiten[\\/]Fotos/, JSON.stringify(repoState.added[0] || {}));
        assert.equal(Boolean(repoState.added[0]?.original_file_name), true, JSON.stringify(repoState.added[0] || {}));
        assert.match(String(repoState.added[0]?.mime_type || ""), /^image\/(jpeg|png|webp)$/i, JSON.stringify(repoState.added[0] || {}));

        repoState.attachments = [{ id: "1" }, { id: "2" }];
        repoState.added = [];
        const resultLimited = await handlers["restarbeiten:importAttachments"]({}, { restarbeitId: "r1", projectId: "p1" });
        assert.equal(resultLimited.ok, true, resultLimited.error || JSON.stringify(resultLimited));
        assert.equal(repoState.added.length, 1, JSON.stringify(repoState.added));

        repoState.attachments = [{ id: "1" }];
        repoState.added = [];
        stubs.electron.dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] });
        const canceled = await handlers["restarbeiten:importAttachments"]({}, { restarbeitId: "r1", projectId: "p1" });
        assert.equal(canceled.ok, true, canceled.error || JSON.stringify(canceled));
        assert.equal(canceled.canceled, true, JSON.stringify(canceled));
        assert.equal(repoState.added.length, 0, JSON.stringify(repoState.added));

        repoState.attachments = [{ id: "1" }, { id: "2" }, { id: "3" }];
        const rejected = await handlers["restarbeiten:importAttachments"]({}, { restarbeitId: "r1", projectId: "p1" });
        assert.equal(rejected.ok, false, JSON.stringify(rejected));
        assert.match(String(rejected.error || ""), /Maximal 3 Fotos/, JSON.stringify(rejected));
      });
    } finally {
      fs.mkdirSync = prev.mkdirSync;
      fs.copyFileSync = prev.copyFileSync;
      fs.statSync = prev.statSync;
      fs.existsSync = prev.existsSync;
    }
  });
  await run("M8 IPC/Preload: Import-Endpunkte vorhanden ohne Delete/Image-Processing", () => {
    const ipc = fs.readFileSync(path.join(__dirname, "../../src/main/ipc/restarbeitenIpc.js"), "utf8");
    const preload = fs.readFileSync(path.join(__dirname, "../../src/main/preload.js"), "utf8");
    assert.match(ipc, /restarbeiten:importAttachments/);
    assert.match(preload, /restarbeitenImportAttachments/);
    assert.doesNotMatch(ipc + preload, /imageProcessing/i);
    assert.doesNotMatch(ipc + preload, /uploadAttachment/i);
    assert.doesNotMatch(ipc + preload, /createThumbnail|generateThumbnail|thumbnailer|thumbnailGenerator/i);
  });

  await run("M8 DataSource: importRestarbeitAttachments normalisiert Antwort", async () => {
    const repo = await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js"));
    const prevWindow = globalThis.window;
    globalThis.window = { bbmDb: { restarbeitenImportAttachments: async () => ({ ok: true, canceled: true }) } };
    try {
      const out = await repo.importRestarbeitAttachments("r-1", "p-1");
      assert.equal(out.canceled, true);
      assert.deepEqual(out.attachments, []);
    } finally { globalThis.window = prevWindow; }
  });

  await run("M8 View/Screen: Fotoanzeige bleibt listenseitig, Import-UI nicht in Editbox", () => {
    const view = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenAttachmentsView.js"), "utf8");
    const screen = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"), "utf8");
    const ds = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js"), "utf8");
    assert.match(view, /Foto hinzufügen/);
    assert.match(view, /Maximal 3 Fotos vorhanden\./);
    assert.match(ds, /importRestarbeitAttachments\(/);
    assert.match(screen, /listRestarbeitAttachments/);
    assert.match(screen, /restarbeiten-list__photosToggle|_renderAttachmentsPreview/);
    assert.doesNotMatch(screen, /importRestarbeitAttachments\(/);
    const editbox = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js"), "utf8");
    assert.doesNotMatch(editbox, /Fotos/);
  });


  await run("M11 View/CSS: Landscape-2-Spalten-Layout stabil und modulnah", () => {
    const viewPath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenAttachmentsView.js");
    const stylePath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/restarbeitenAttachmentsStyle.js");
    const view = fs.readFileSync(viewPath, "utf8");
    const styleCode = fs.readFileSync(stylePath, "utf8");

    assert.match(view, /restarbeiten-attachments__grid/);
    assert.match(view, /restarbeiten-attachments__primary/);
    assert.match(view, /restarbeiten-attachments__secondary/);
    assert.match(view, /others\.slice\(0, 2\)/);
    assert.match(view, /restarbeiten-attachments__image/);
    assert.match(view, /Kein Bildpfad vorhanden\./);
    assert.match(view, /Foto hinzufügen/);
    assert.match(view, /Maximal 3 Fotos vorhanden\./);
    assert.match(view, /Foto entfernen/);
    assert.match(view, /Hauptfoto/);
    assert.match(view, /caption\) \|\| normalizeText\(attachment\?\.file_name\) \|\| "Ohne Bezeichnung"/);

    assert.match(styleCode, /grid-template-columns:\s*minmax\(0, 2fr\)\s+minmax\(0, 1fr\)/);
    assert.match(styleCode, /aspect-ratio:\s*16 \/ 9/);
    assert.match(styleCode, /object-fit:\s*cover/);
    assert.match(styleCode, /data-bbm-restarbeiten-attachments-style/);
    assert.match(styleCode, /typeof\s+doc\?\.querySelector\s*===\s*["']function["']/);
    assert.match(styleCode, /function\s+hasInjectedStyle\s*\(/);
    assert.doesNotMatch(view, /import\s+["']\.\/restarbeitenAttachments\.css["']/);

    assert.doesNotMatch(view + styleCode, /gallery|lightbox/i);
    assert.doesNotMatch(view + styleCode, /thumbnail/i);
    assert.doesNotMatch(view + styleCode, /imageProcessing/i);
    assert.doesNotMatch(view + styleCode, /Diktat|Druck|Mail/);
    assert.doesNotMatch(view, /modules\/protokoll\/styles|tops\/styles/i);
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
        restarbeitenSoftDeleteItem: async (payload) => {
          calls.push({ type: "soft-delete", payload });
          const idx = items.findIndex((item) => String(item.id) === String(payload.id));
          if (idx >= 0) items[idx].deleted_at = "2026-05-18T12:00:00.000Z";
          return { ok: true, item: idx >= 0 ? { ...items[idx] } : null };
        },
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

      const row = screen.listHost.children[0].children[0];
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
  await run("M12 ViewModel: Mapping und Ampel-Logik fuer Listenlayout", async () => {
    const vm = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/viewModel/restarbeitenListItems.js")
    );

    const today = new Date("2026-05-16T00:00:00Z");
    const item = vm.toRestarbeitenListItem(
      {
        id: "x",
        running_number: 12,
        created_at: "2026-05-16",
        location_level_1: "Haus A",
        location_level_2: "EG",
        location_level_3: "Raum 01",
        location_level_4: "Fenster 2",
        short_text: "Fenster",
        long_text: "nachstellen",
        item_class: "mangel",
        status: "offen",
        due_date: "2026-05-20",
        responsible_label: "Firma Test",
      },
      today
    );

    assert.equal(item.numberLine, "12");
    assert.equal(item.dateLine, "16.05.2026");
    assert.equal(item.locationLine1, "Haus A / EG");
    assert.equal(item.locationLine2, "Raum 01 / Fenster 2");
    assert.equal(item.workLine1, "Fenster");
    assert.equal(item.workLine2, "nachstellen");
    assert.equal(item.itemClassLabel, "Mangel");
    assert.equal(vm.toRestarbeitenListItem({ item_class: "rest" }, today).itemClassLabel, "Rest");
    assert.equal(item.itemClassToken, "M");
    assert.equal(vm.toRestarbeitenListItem({ item_class: "rest" }, today).itemClassToken, "R");
    assert.equal(item.statusLabel, "offen");
    assert.equal(item.dueDateLabel, "20.05.2026");
    assert.equal(vm.toRestarbeitenListItem({ created_at: "2026-05-17T19:08:44.076Z" }, today).dateLine, "17.05.2026");
    assert.equal(item.responsibleLabel, "Firma Test");
    assert.equal(item.ampelState, "orange");

    assert.equal(vm.getRestarbeitenAmpelState({ due_date: "2026-05-15", status: "offen" }, today), "rot");
    assert.equal(vm.getRestarbeitenAmpelState({ due_date: "2026-05-24", status: "offen" }, today), "orange");
    assert.equal(vm.getRestarbeitenAmpelState({ due_date: "2026-05-30", status: "offen" }, today), "gruen");
    assert.equal(vm.getRestarbeitenAmpelState({ status: "offen" }, today), "neutral");
    assert.equal(vm.getRestarbeitenAmpelState({ due_date: "ungültig", status: "offen" }, today), "neutral");
    assert.equal(vm.getRestarbeitenAmpelState({ due_date: "2026-06-20", status: "verzug" }, today), "rot");
    assert.equal(
      vm.getRestarbeitenAmpelState({ due_date: "2026-05-01", status: "geprueft_erledigt" }, today),
      "gruen"
    );
  });
  await run("M12 Screen/List: Token-Darstellung und Metaspalte ohne Label", async () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"),
      "utf8"
    );
    const styleContent = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/restarbeitenListStyle.js"),
      "utf8"
    );

    assert.match(content, /dataset\.restarbeitId/);
    assert.match(content, /dataset\.selected/);
    assert.match(content, /dataset\.ampel/);
    assert.doesNotMatch(content, /Klasse:/);
    assert.doesNotMatch(content, /Status:/);
    assert.doesNotMatch(content, /Fertig bis:/);
    assert.doesNotMatch(content, /Verantwortlich:/);
    assert.doesNotMatch(content, /Ampel:/);
    assert.match(content, /item\.itemClassToken/);
    assert.match(content, /item\.statusLabel/);
    assert.match(content, /item\.dueDateLabel/);
    assert.match(content, /item\.responsibleLabel/);
    assert.doesNotMatch(content, /innerHTML\s*=/);

    assert.match(styleContent, /restarbeiten-list__ampel--rot/);
    assert.match(styleContent, /restarbeiten-list__ampel--orange/);
    assert.match(styleContent, /restarbeiten-list__ampel--gruen/);
    assert.match(styleContent, /restarbeiten-list__ampel--neutral/);
    assert.match(styleContent, /restarbeiten-list__date\{font-size:8pt/);
    assert.match(styleContent, /restarbeiten-list__shortText,.restarbeiten-list__longText,.restarbeiten-list__locationCompact\{font-size:12px/);
    assert.doesNotMatch(styleContent, /import\s+["'].*\.css["']/);
  });

  await run("M16 Editbox: aktueller Kompakt-Stand mit Autosave und Meta-Layout", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js")
    );
    const doc = createFakeDocument();
    const saveCalls = [];
    const createCalls = [];
    const editbox = new mod.default({
      documentRef: doc,
      onSave: async (draft) => saveCalls.push(draft),
      onCreate: async () => createCalls.push("create"),
    });
    const root = editbox.render();

    assert.equal(String(root.className || "").includes("restarbeiten-editbox"), true);
    assert.equal(String(root.className || "").includes("restarbeiten-editbox--compact"), true);
    assert.equal(Boolean(findNodes(root, (node) => String(node?.className || "").includes("restarbeiten-editbox__main"))[0]), true);
    assert.equal(Boolean(findNodes(root, (node) => String(node?.className || "").includes("restarbeiten-editbox__meta"))[0]), true);
    assert.equal(collectText(root).includes("Fotos"), false);
    assert.equal(collectText(root).includes("RestarbeitenAttachmentsView"), false);
    assert.equal(collectText(root).includes("Speichern"), false);
    assert.equal(typeof editbox.setAttachments, "function");
    editbox.setAttachments([{ id: "a1" }]);

    editbox.setLocationLabels({ level_1_label: "Haus", level_2_label: "Geschoss", level_3_label: "Wohnung", level_4_label: "Raum" });
    assert.equal(collectText(root).includes("Haus"), true);
    assert.equal(collectText(root).includes("Geschoss"), true);
    assert.equal(collectText(root).includes("Wohnung"), true);
    assert.equal(collectText(root).includes("Raum"), true);
    assert.equal(collectText(root).includes("Level 1"), false);

    const fallback = new mod.default({ documentRef: createFakeDocument() });
    const fallbackRoot = fallback.render();
    assert.equal(collectText(fallbackRoot).includes("Ebene 1"), true);
    assert.equal(collectText(fallbackRoot).includes("Ebene 4"), true);

    editbox.setProjectFirms([{ id: "f1", name: "Firma A" }]);
    // Autosave erwartet bewusst eine Item-ID (ohne ID kein Save-Call).
    editbox.setItem({ id: "r1", item_class: "rest", status: "offen", short_text: "Kurz", long_text: "Lang", due_date: "2026-05-16" });

    const legacyEditbox = new mod.default({ documentRef: createFakeDocument() });
    legacyEditbox.render();
    legacyEditbox.setItem({ responsible_project_firm_id: "alt-1", responsible_label: "Alte Firma" });
    legacyEditbox.setProjectFirms([{ id: "f1", name: "Firma A" }]);
    const legacySelect = legacyEditbox.fields.responsible_project_firm_id;
    assert.equal(legacySelect.value, "alt-1");
    const legacyOptions = legacySelect.children || [];
    const legacyOption = legacyOptions.find((option) => String(option?.value || "") === "alt-1");
    assert.equal(Boolean(legacyOption), true);
    assert.equal(legacySelect.value, "alt-1");
    assert.equal(["Alte Firma", "(nicht mehr vorhanden)"].includes(String(legacyOption?.textContent || "")), true);
    const toggleWrap = findNodes(root, (node) => String(node?.className || "").includes("restarbeiten-editbox__classToggle"))[0];
    assert.equal(Boolean(toggleWrap), true);
    const markerButtons = findNodes(root, (node) => node?.tagName === "BUTTON" && (node?.textContent === "Rest" || node?.textContent === "Mangel"));
    assert.equal(markerButtons.length, 2);
    assert.equal(String(markerButtons.find((b) => b.textContent === "Rest")?.dataset?.active || ""), "1");
    markerButtons.find((b) => b.textContent === "Mangel").click();
    assert.equal(String(markerButtons.find((b) => b.textContent === "Mangel")?.dataset?.active || ""), "1");
    assert.equal(String(markerButtons.find((b) => b.textContent === "Rest")?.dataset?.active || ""), "0");
    markerButtons.find((b) => b.textContent === "Rest").click();
    assert.equal(String(markerButtons.find((b) => b.textContent === "Rest")?.dataset?.active || ""), "1");
    assert.equal(String(markerButtons.find((b) => b.textContent === "Mangel")?.dataset?.active || ""), "0");
    markerButtons.find((b) => b.textContent === "Mangel").click();
    const createBtn = findButtonByText(root, "+ Restpunkt");
    assert.equal(Boolean(createBtn), true);
    assert.equal(String(createBtn?.className || "").includes("restarbeiten-editbox__create"), true);
    createBtn.click();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(createCalls.length, 1);
    editbox.fields.status.value = "in arbeit";
    editbox.fields.responsible_project_firm_id.value = "f1";
    const draft = editbox.getDraft();
    assert.equal(draft.item_class, "mangel");
    assert.equal(draft.status, "in arbeit");
    assert.equal(draft.due_date, "2026-05-16");
    assert.equal(draft.responsible_project_firm_id, "f1");

    editbox.fields.short_text.value = "Kurz neu";
    await editbox.flushAutosave();
    assert.equal(saveCalls.length >= 1, true);
    assert.equal(typeof saveCalls[0].short_text, "string");
    assert.equal(typeof saveCalls[0].long_text, "string");
    assert.equal(Object.hasOwn(saveCalls[0], "location_level_1"), true);
    assert.equal(Object.hasOwn(saveCalls[0], "location_level_4"), true);
  });

  await run("M16 Guardrails: Dateiinhalte ohne git-status-Check", () => {
    const editboxContent = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js"),
      "utf8"
    );
    const screenContent = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"),
      "utf8"
    );

    assert.doesNotMatch(editboxContent, /from\s+["'][^"']*protokoll\//i);
    assert.doesNotMatch(screenContent, /from\s+["'][^"']*protokoll\//i);
    assert.doesNotMatch(editboxContent, /Diktat|Druck|Mail/);
    const combinedContent = `${editboxContent}\n${screenContent}`;
    assert.doesNotMatch(combinedContent, /execSync\(\s*["']git status/);
    assert.doesNotMatch(combinedContent, /node:child_process/);
  });

  await run("M31.1 Notiz/Status/Ampel: completion_note leer speicherbar und Legacy-Mapping stabil", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js")
    );
    const vm = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/viewModel/restarbeitenListItems.js")
    );
    const saveCalls = [];
    const editbox = new mod.default({
      documentRef: createFakeDocument(),
      onSave: async (draft) => saveCalls.push(draft),
    });
    const root = editbox.render();

    editbox.setItem({ id: "r1", status: "offen", completion_note: "Alt", completed_at: "" });
    const noteBtn = findNodes(root, (n) => n?.tagName === "BUTTON" && String(n?.className || "").includes("restarbeiten-editbox__noteBtn"))[0];
    assert.equal(Boolean(noteBtn), true);
    noteBtn.click();
    const currentOverlay = () =>
      findNodes(root, (n) => String(n?.className || "").includes("restarbeiten-editbox__noteDialog")).at(-1) || null;
    const currentTextarea = () =>
      findNodes(currentOverlay() || root, (n) => n?.tagName === "TEXTAREA").at(-1) || null;
    const currentButton = (text) =>
      findNodes(currentOverlay() || root, (n) => n?.tagName === "BUTTON" && String(n?.textContent || "").trim() === text).at(-1) || null;

    const textareaA = currentTextarea();
    assert.equal(textareaA.value, "Alt");
    textareaA.value = "";
    currentButton("Übernehmen").click();
    await Promise.resolve();
    await editbox.flushAutosave();
    assert.equal(editbox.getDraft().completion_note, "");
    assert.equal(saveCalls.some((x) => x.completion_note === ""), true);

    editbox.setItem({ id: "r1", status: "offen", completion_note: "Alt" });
    noteBtn.click();
    const textareaB = currentTextarea();
    assert.equal(textareaB.value, "Alt");
    textareaB.value = "Neu";
    currentButton("Abbrechen").click();
    assert.equal(editbox.getDraft().completion_note, "Alt");

    editbox.setItem({ id: "r1", status: "in_arbeit" });
    assert.equal(editbox.fields.status.value, "in arbeit");
    editbox.setItem({ id: "r1", status: "erledigt_gemeldet" });
    assert.equal(editbox.fields.status.value, "erledigt");
    editbox.setItem({ id: "r1", status: "geprueft_erledigt" });
    assert.equal(editbox.fields.status.value, "erledigt");
    editbox.setItem({ id: "r1", status: "geprüft erledigt" });
    assert.equal(editbox.fields.status.value, "erledigt");
    editbox.setItem({ id: "r1", status: "x-unknown" });
    assert.equal(editbox.fields.status.value, "offen");

    const today = new Date(Date.UTC(2026, 4, 18));
    assert.equal(vm.getRestarbeitenAmpelState({ status: "erledigt", due_date: "2026-05-01" }, today), "gruen");
    assert.equal(vm.getRestarbeitenAmpelState({ status: "erledigt_gemeldet", due_date: "2026-05-01" }, today), "gruen");
    assert.equal(vm.getRestarbeitenAmpelState({ status: "geprueft_erledigt", due_date: "2026-05-01" }, today), "gruen");

    editbox.setItem({ id: "r1", status: "offen", completion_note: "Alt", completed_at: "" });
    editbox.fields.status.value = "erledigt";
    editbox.fields.status.dispatchEvent({ type: "change" });
    assert.equal(Boolean(editbox.fields.completed_at.value), true);
    assert.equal(Boolean(findNodes(root, (n) => String(n?.className || "").includes("restarbeiten-editbox__noteDialog"))[0]), true);
    const keepDate = "2026-05-20";
    editbox.setItem({ id: "r1", status: "offen", completion_note: "Alt", completed_at: keepDate });
    editbox.fields.status.value = "erledigt";
    editbox.fields.status.dispatchEvent({ type: "change" });
    assert.equal(editbox.fields.completed_at.value, keepDate);
    editbox.fields.status.value = "offen";
    editbox.fields.status.dispatchEvent({ type: "change" });
    assert.equal(editbox.getDraft().completed_at, keepDate);
    assert.equal(editbox.getDraft().completion_note, "Alt");
  });

  await run("M19 Guardrails: Editbox CSS verdichtet und Filterleiste fachlich geklärt", () => {
    const editboxContent = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js"),
      "utf8"
    );
    const styleContent = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/restarbeitenListStyle.js"),
      "utf8"
    );
    const screenContent = fs.readFileSync(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"),
      "utf8"
    );

    assert.match(editboxContent, /restarbeiten-editbox__classToggle/);
    assert.match(editboxContent, /restarbeiten-editbox__classToggleButton/);
    assert.match(editboxContent, /restarbeiten-editbox__control--short/);
    assert.match(editboxContent, /restarbeiten-editbox__control--long/);
    assert.doesNotMatch(editboxContent, /style\s*=\s*["']/);

    assert.doesNotMatch(styleContent, /\.restarbeiten-editbox__save\{/);
    assert.match(styleContent, /\.restarbeiten-editbox__create\{/);
    assert.match(styleContent, /\.restarbeiten-editbox__classToggle\{/);
    assert.match(styleContent, /\.restarbeiten-editbox__classToggleButton\{/);
    assert.match(styleContent, /\.restarbeiten-editbox__control\{/);
    assert.match(styleContent, /\.restarbeiten-editbox__control--short\{/);
    assert.match(styleContent, /textarea\.restarbeiten-editbox__control--long\{/);

    assert.match(editboxContent, /short_text/);
    assert.match(editboxContent, /long_text/);
    assert.match(editboxContent, /responsible_project_firm_id/);
    assert.match(editboxContent, /location_level_1/);
    assert.match(editboxContent, /location_level_4/);

    assert.match(editboxContent, /itemClass\.value = value === "mangel" \? "mangel" : "rest"/);
    assert.match(screenContent, /restarbeiten-list/);
    assert.doesNotMatch(screenContent, /<table|createElement\("table"\)/);

    // Fachbegriff: die grüne Leiste im Restarbeiten-Modul ist die Filterleiste (Filter + Schließen), nicht der globale Header.
    assert.match(screenContent, /restarbeiten-header__filters/);
    assert.match(screenContent, /btnClose\.textContent = "Schließen"/);
    assert.match(screenContent, /_buildHeader/);

  });

  await run("M28 Filterleiste: links Klassenfilter, Mitte Verortung, rechts Metafilter (nicht globaler Header)", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
    );
    const screen = new mod.default({ projectId: "p-1", router: { showProjectWorkspace() {} } });
    const doc = createFakeDocument();
    globalThis.document = doc;
    screen.render();
    screen.rows = [
      { id: "1", item_class: "mangel", status: "offen", due_date: "2026-05-20", responsible_project_firm_id: "f1", location_level_1: "Haus A" },
      { id: "2", item_class: "rest", status: "in_arbeit", due_date: "2026-05-21", responsible_project_firm_id: "f2", location_level_1: "Haus B" },
    ];
    screen.items = [
      { id: "1", itemClassLabel: "", locationLevel1: "Haus A", locationLevel2: "", locationLevel3: "", locationLevel4: "" },
      { id: "2", itemClassLabel: "Rest", locationLevel1: "Haus B", locationLevel2: "", locationLevel3: "", locationLevel4: "" },
    ];
    screen.projectFirms = [{ id: "f1", name: "Firma 1" }, { id: "f2", name: "Firma 2" }];
    screen._renderHeaderFilters();

    const source = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"), "utf8");
    const styleSource = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/restarbeitenListStyle.js"), "utf8");
    assert.match(source, /item_class/);
    assert.match(source, /responsible_project_firm_id/);
    assert.match(source, /due_date/);
    assert.match(source, /restarbeiten-filterleiste__classFilter/);
    assert.match(source, /restarbeiten-filterleiste__locationGroupA/);
    assert.match(source, /restarbeiten-filterleiste__locationGroupB/);
    assert.match(source, /restarbeiten-filterleiste__metaTopRow/);
    assert.match(source, /restarbeiten-filterleiste__metaResponsibleRow/);
    assert.match(source, /restarbeiten-filterleiste__fieldLabel/);
    assert.match(source, /Status/);
    assert.match(source, /Fertig bis/);
    assert.match(source, /Verantwortlich/);
    assert.doesNotMatch(source, /title\.textContent\s*=\s*["']Restarbeiten["']/);
    assert.doesNotMatch(source, /Haus\s*\/\s*Geschoss|Einheit\s*\/\s*Raum/);
    assert.match(styleSource, /restarbeiten-filterleiste__classFilter\{display:grid;grid-template-columns:1fr/);
    assert.match(styleSource, /restarbeiten-filterleiste__field\{display:inline-flex;align-items:center/);
    assert.match(styleSource, /restarbeiten-filterleiste__locationFilters\{display:grid;grid-template-columns:repeat\(2/);
    assert.match(styleSource, /restarbeiten-filterleiste__metaTopRow\{display:grid;grid-template-columns:repeat\(2/);
    assert.match(styleSource, /restarbeiten-header__actions\{display:flex;gap:6px;margin-left:auto/);

    const statusFilter = findNodes(
      screen.headerFiltersHost,
      (node) => node?.tagName === "SELECT" && node?.dataset?.filterKey === "status"
    )[0];
    const fieldNodes = findNodes(screen.headerFiltersHost, (node) =>
      String(node?.className || "").includes("restarbeiten-filterleiste__field")
    );
    assert.equal(fieldNodes.length >= 7, true);
    const statusOptions = Array.isArray(statusFilter?.children) ? statusFilter.children : [];
    const inArbeitOption = statusOptions.find((opt) => opt.value === "in_arbeit");
    assert.equal(Boolean(inArbeitOption), true);
    assert.equal(inArbeitOption.textContent, "in Arbeit");
    assert.equal(statusOptions.some((opt) => opt.textContent === "in_arbeit"), false);

    screen.filterState.item_class = "mangel";
    assert.deepEqual(screen._getFilteredItems().map((item) => item.id), ["1"]);
    screen.filterState.item_class = "rest";
    assert.deepEqual(screen._getFilteredItems().map((item) => item.id), ["2"]);
    screen.filterState.item_class = "";
    screen.filterState.status = "in_arbeit";
    assert.deepEqual(screen._getFilteredItems().map((item) => item.id), ["2"]);
    screen.filterState.item_class = "";
    screen.filterState.location_level_1 = "Haus A";
    screen.filterState.status = "offen";
    screen.filterState.due_date = "2026-05-20";
    screen.filterState.responsible_project_firm_id = "f1";
    assert.deepEqual(screen._getFilteredItems().map((item) => item.id), ["1"]);

    const getMetaSelect = (filterKey) =>
      findNodes(
        screen.headerFiltersHost,
        (node) => node?.tagName === "SELECT" && node?.dataset?.filterKey === filterKey
      )[0];

    // stale status value wird beim Rendern bereinigt
    screen.filterState.status = "in_arbeit";
    screen.filterState.due_date = "";
    screen.filterState.responsible_project_firm_id = "";
    screen.rows = [
      { id: "3", item_class: "rest", status: "offen", due_date: "2026-05-20", responsible_project_firm_id: "f1", location_level_1: "Haus A" },
    ];
    screen.items = [
      { id: "3", itemClassLabel: "Rest", locationLevel1: "Haus A", locationLevel2: "", locationLevel3: "", locationLevel4: "" },
    ];
    screen.projectFirms = [{ id: "f1", name: "Firma 1" }];
    screen._renderHeaderFilters();
    assert.equal(screen.filterState.status, "");
    assert.equal(getMetaSelect("status")?.value, "");
    assert.deepEqual(screen._getFilteredItems().map((item) => item.id), ["3"]);

    // stale due_date value wird beim Rendern bereinigt
    screen.filterState.due_date = "2026-05-21";
    screen._renderHeaderFilters();
    assert.equal(screen.filterState.due_date, "");
    assert.equal(getMetaSelect("due_date")?.value, "");

    // stale responsible value wird beim Rendern bereinigt
    screen.filterState.responsible_project_firm_id = "f-alt";
    screen._renderHeaderFilters();
    assert.equal(screen.filterState.responsible_project_firm_id, "");
    assert.equal(getMetaSelect("responsible_project_firm_id")?.value, "");

    // row lookup bleibt funktional mit Map-basiertem Zugriff
    screen.rows = [
      { id: "4", item_class: "mangel", status: "offen", due_date: "2026-05-20", responsible_project_firm_id: "f1", location_level_1: "Haus A" },
      { id: "5", item_class: "rest", status: "offen", due_date: "2026-05-20", responsible_project_firm_id: "f2", location_level_1: "Haus A" },
    ];
    screen.items = [
      { id: "4", itemClassLabel: "", locationLevel1: "Haus A", locationLevel2: "", locationLevel3: "", locationLevel4: "" },
      { id: "5", itemClassLabel: "", locationLevel1: "Haus A", locationLevel2: "", locationLevel3: "", locationLevel4: "" },
    ];
    screen.filterState.item_class = "mangel";
    screen.filterState.status = "offen";
    screen.filterState.responsible_project_firm_id = "f1";
    assert.deepEqual(screen._getFilteredItems().map((item) => item.id), ["4"]);

    const getFilteredItemsSource = source.match(/_getFilteredItems\(\)\s*\{[\s\S]*?\n  \}/)?.[0] || "";
    assert.match(getFilteredItemsSource, /rowsById/);
    assert.match(getFilteredItemsSource, /new Map\(/);
    assert.doesNotMatch(getFilteredItemsSource, /this\.rows\.find\(/);
  });


  

  await run("M21 Autosave: setItem/setLocation/setProjectFirms bleiben autosave-sicher", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js")
    );
    const saveCalls = [];
    const editbox = new mod.default({
      documentRef: createFakeDocument(),
      onSave: async (draft) => saveCalls.push(draft),
    });
    editbox.render();
    editbox.setLocationOptions({ location_level_1: ["Haus A"] });
    editbox.setProjectFirms([{ id: "f1", name: "Firma A" }]);
    editbox.setLocationLabels({ level_1_label: "Haus" });
    editbox.setItem({ id: "r1", short_text: "Alt", status: "offen" });
    assert.equal(saveCalls.length, 0);

    const submitState = { prevented: false, stopped: false };
    editbox.form.dispatchEvent({
      type: "submit",
      preventDefault() { submitState.prevented = true; },
      stopPropagation() { submitState.stopped = true; },
    });
    assert.equal(submitState.prevented, true);
    assert.equal(submitState.stopped, true);
    assert.equal(saveCalls.length, 0);

    editbox.fields.short_text.value = "Neu";
    await editbox.flushAutosave();
    assert.equal(saveCalls.length, 1);
    assert.equal(saveCalls[0].short_text, "Neu");

    await editbox.flushAutosave();
    assert.equal(saveCalls.length, 1);

    editbox.fields.status.value = "in arbeit";
    editbox.fields.status.dispatchEvent({ type: "change" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(saveCalls.length, 2);

    editbox.fields.short_text.value = "Neu2";
    editbox.fields.short_text.dispatchEvent({ type: "blur" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(saveCalls.length, 3);
  });

  await run("M21.1 Autosave: pending Draft bleibt trotz setItem waehrend Save erhalten", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js")
    );

    let resolveFirstSave;
    const calls = [];
    let running = 0;
    const editbox = new mod.default({
      documentRef: createFakeDocument(),
      onSave: async (draft) => {
        calls.push(draft);
        running += 1;
        if (running === 1) {
          await new Promise((resolve) => { resolveFirstSave = resolve; });
        }
        running -= 1;
      },
    });

    editbox.render();
    editbox.setItem({ id: "r1", short_text: "Alt", status: "offen" });

    editbox.fields.short_text.value = "Neu 1";
    const firstFlush = editbox.flushAutosave();
    await new Promise((resolve) => setTimeout(resolve, 0));

    editbox.fields.short_text.value = "Neu 2";
    await editbox.flushAutosave();
    editbox.setItem({ id: "r1", short_text: "Neu 1", status: "offen" });

    resolveFirstSave();
    await firstFlush;
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(calls.length, 2);
    assert.equal(calls[0].short_text, "Neu 1");
    assert.equal(calls[1].short_text, "Neu 2");
  });

  await run("M21.1 Autosave: laufender Save plus neue Aenderung fuehrt zu zweitem Save", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js")
    );

    let resolveFirstSave;
    const calls = [];
    const editbox = new mod.default({
      documentRef: createFakeDocument(),
      onSave: async (draft) => {
        calls.push(draft);
        if (calls.length === 1) {
          await new Promise((resolve) => { resolveFirstSave = resolve; });
        }
      },
    });

    editbox.render();
    editbox.setItem({ id: "r1", short_text: "Alt", status: "offen" });

    editbox.fields.short_text.value = "A";
    const firstFlush = editbox.flushAutosave();
    await new Promise((resolve) => setTimeout(resolve, 0));

    editbox.fields.short_text.value = "B";
    await editbox.flushAutosave();

    resolveFirstSave();
    await firstFlush;
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(calls.length, 2);
    assert.equal(calls[0].short_text, "A");
    assert.equal(calls[1].short_text, "B");
  });


  await run("M21.2 Autosave: fehlgeschlagener Draft kann erneut gespeichert werden", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js")
    );

    const saveCalls = [];
    const editbox = new mod.default({
      documentRef: createFakeDocument(),
      onSave: async (draft) => {
        saveCalls.push(draft);
        if (saveCalls.length === 1) {
          throw new Error("transient");
        }
      },
    });

    editbox.render();
    editbox.setItem({ id: "r1", short_text: "Alt", status: "offen" });

    editbox.fields.short_text.value = "Neu";
    await editbox.flushAutosave();

    assert.equal(saveCalls.length, 1);
    assert.equal(saveCalls[0].short_text, "Neu");
    assert.equal(
      String(editbox.statusEl?.textContent || "").includes("fehlgeschlagen") || editbox.pendingDraftKey.length > 0,
      true
    );

    await editbox.flushAutosave();

    assert.equal(saveCalls.length, 2);
    assert.equal(saveCalls[1].short_text, "Neu");
    assert.equal(String(editbox.statusEl?.textContent || ""), "Gespeichert");
    assert.equal(editbox.pendingDraftKey, "");
    assert.equal(editbox.lastSavedDraftKey, editbox._draftKeyFor(saveCalls[1]));
  });


  await run("M20 Verortung: input+datalist, Options-Uebergabe und kompakte Klassen", async () => {
    const editboxPath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenEditbox.js");
    const screenPath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js");
    const stylePath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/restarbeitenListStyle.js");

    const editboxContent = fs.readFileSync(editboxPath, "utf8");
    const screenContent = fs.readFileSync(screenPath, "utf8");
    const styleContent = fs.readFileSync(stylePath, "utf8");

    assert.match(editboxContent, /setLocationOptions\s*\(/);
    assert.match(editboxContent, /createElement\("datalist"\)/);
    assert.match(editboxContent, /input\.setAttribute\("list",\s*datalist\.id\)/);
    assert.doesNotMatch(editboxContent, /innerHTML\s*=/);
    assert.match(editboxContent, /location_level_1/);
    assert.match(editboxContent, /location_level_4/);

    assert.match(screenContent, /_collectLocationOptionsFromRows\s*\(/);
    assert.match(screenContent, /this\.editbox\.setLocationOptions\(this\.locationOptions\)/);
    assert.doesNotMatch(editboxContent, /from\s+["'][^"']*restarbeitenDataSource\.js["']/);

    assert.match(styleContent, /\.restarbeiten-editbox__locationControl\{/);
    assert.match(styleContent, /\.restarbeiten-editbox__metaControl\{/);
    assert.match(styleContent, /\.restarbeiten-editbox__locationLabel\{/);

    const mod = await importEsmFromFile(editboxPath);
    const Editbox = mod.default;
    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();

    try {
      const editbox = new Editbox({ documentRef: globalThis.document });
      editbox.render();
      editbox.setLocationOptions({
        location_level_1: ["Haus 2", "Haus 1", "Haus 1"],
        location_level_2: ["OG", "EG"],
        location_level_3: ["WE 01"],
        location_level_4: ["Bad"],
      });

      const listId = String(editbox.fields.location_level_1.list || "");
      assert.equal(Boolean(listId), true);
      const datalist = (editbox.fields.location_level_1.parentElement?.children || []).find((n) => n?.tagName === "DATALIST");
      assert.equal(Boolean(datalist), true);
      const optionValues = (datalist.children || []).map((n) => n.value);
      assert.deepEqual(optionValues, ["Haus 1", "Haus 2"]);

      editbox.fields.location_level_1.value = "Neues Haus";
      assert.equal(editbox.getDraft().location_level_1, "Neues Haus");

      assert.equal(String(editbox.fields.location_level_1.className).includes("restarbeiten-editbox__locationControl"), true);
      assert.equal(String(editbox.fields.responsible_project_firm_id.className).includes("restarbeiten-editbox__metaControl"), true);
    } finally {
      globalThis.document = prevDocument;
    }

    const screenMod = await importEsmFromFile(screenPath);
    const RestarbeitenScreen = screenMod.default;
    const prevDocument2 = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const screen = new RestarbeitenScreen({ projectId: "p-1", project: { id: "p-1", project_number: "P-100", short: "Kurz", name: "Name" } });
      const options = screen._collectLocationOptionsFromRows([
        { location_level_1: "Haus 2", location_level_2: "OG", location_level_3: "WE 10", location_level_4: "Wohnen" },
        { location_level_1: "Haus 1", location_level_2: "EG", location_level_3: "WE 01", location_level_4: "Bad" },
        { location_level_1: "Haus 1", location_level_2: "EG", location_level_3: "WE 01", location_level_4: "" },
      ]);
      assert.deepEqual(options.location_level_1, ["Haus 1", "Haus 2"]);
      assert.deepEqual(options.location_level_2, ["EG", "OG"]);

      let forwardedOptions = null;
      screen.editHost = globalThis.document.createElement("div");
      screen.effectiveProjectId = "p-1";
      screen.locationOptions = options;
      screen.rows = [{ id: "r-1", location_level_1: "Haus 1" }];
      screen.selectedItemId = "r-1";
      screen.editbox = {
        setLocationLabels() {},
        setLocationOptions(value) { forwardedOptions = value; },
        setItem() {},
        setProjectFirms() {},
        setAttachments() {},
      };
      screen._renderEditbox();
      assert.deepEqual(forwardedOptions, options);
    } finally {
      globalThis.document = prevDocument2;
    }
  });


  await run("M30 Fachregel Begriffe: Restpunkt (RP) statt TOP in Restarbeiten", () => {
    const modelPath = path.join(__dirname, "../../scripts/tests/restarbeitenDataModel.test.cjs");
    const source = fs.readFileSync(modelPath, "utf8");
    assert.equal(source.includes("Restpunkte (RP)"), true);
  });

  await run("M33.10 Restarbeiten-Druck: interne PDF-Vorschau-Payload, deleted_at, keine Fotos, Leerfall", async () => {
    const prevWindow = globalThis.window;
    const prevDocument = globalThis.document;
    const printPdfAndPreviewInternalCalls = [];
    const previewCalls = [];
    const printCalls = [];
    const openRestarbeitenDirCalls = [];
    const statusCalls = [];
    const items = [
      {
        id: "r-1", running_number: 1, item_class: "rest", short_text: "Rest A", long_text: "Lang A",
        location_level_1: "Haus A", location_level_2: "EG", location_level_3: "WE 1", location_level_4: "Bad",
        status: "offen", due_date: "2026-05-30", responsible_label: "Firma A", completed_at: "", completion_note: "",
      },
      {
        id: "r-2", running_number: 2, item_class: "mangel", short_text: "Mangel A", long_text: "Lang M1",
        location_level_1: "Haus B", location_level_2: "OG", location_level_3: "WE 2", location_level_4: "Küche",
        status: "in_arbeit", due_date: "2026-05-20", responsible_label: "Firma B", completed_at: "", completion_note: "Note",
      },
      {
        id: "r-3", running_number: 3, item_class: "mangel", short_text: "Mangel B", long_text: "Lang M2",
        location_level_1: "Haus C", location_level_2: "DG", location_level_3: "WE 3", location_level_4: "Flur",
        status: "offen", due_date: "2026-05-21", responsible_label: "Firma C", completed_at: "", completion_note: "",
        deleted_at: "2026-05-19T10:00:00.000Z",
      },
    ];
    globalThis.window = {
      bbmPrint: {
        printPdf: async (payload) => { printCalls.push(payload); return { ok: true }; },
        printPdfAndPreviewInternal: async (payload) => {
          printPdfAndPreviewInternalCalls.push(payload);
          return { ok: true, filePath: "C:/tmp/Restarbeitenliste.pdf" };
        },
      },
      bbmDb: {
        printOpenHtmlPreview: async (payload) => { previewCalls.push(payload); return { ok: true }; },
        restarbeitenGetProjectSettings: async () => ({ ok: true, settings: { level_1_label: "Gebäude", level_2_label: "Stock", level_3_label: "Bereich", level_4_label: "Zone" } }),
        restarbeitenListByProject: async () => ({ ok: true, items: items.map((i) => ({ ...i })) }),
        projectFirmsListByProject: async () => ({ ok: true, list: [] }),
        restarbeitenListAttachments: async () => ({ ok: true, attachments: [] }),
      },
    };
    globalThis.document = createFakeDocument();

    try {
      const RestarbeitenScreen = (await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"))).default;
      const screen = new RestarbeitenScreen({ projectId: "p-1", project: { id: "p-1", project_number: "P-100", short: "Kurz", name: "Name" } });
      const root = screen.render();
      await screen.load();
      screen.editbox = { setStatus: (msg) => statusCalls.push(msg) };

      const printButtons = findNodes(root, (n) => n?.tagName === "BUTTON" && String(n?.textContent || "").trim() === "Drucken");
      assert.equal(printButtons.length >= 2, true);
      const btnPrint = printButtons[0];
      assert.ok(btnPrint);
      const quicklane = findNodes(root, (n) => n?.["data-bbm-restarbeiten-quicklane"] === "true")[0];
      assert.ok(quicklane);
      const quicklanePreviewBtn = findButtonByText(quicklane, "Vorschau");
      const quicklanePrintBtn = findButtonByText(quicklane, "Drucken");
      assert.ok(quicklanePreviewBtn);
      assert.ok(quicklanePrintBtn);
      assert.match(collectText(quicklane), /Ausgabe/);
      assert.match(collectText(quicklane), /Vorschau/);
      assert.match(collectText(quicklane), /Drucken/);
      assert.doesNotMatch(collectText(quicklane), /E-?Mail/i);
      assert.doesNotMatch(collectText(quicklane), /Foto|Attachment/i);
      assert.equal(findNodes(root, (n) => n?.tagName === "BUTTON" && String(n?.textContent || "").trim() === "+ Restpunkt").length >= 1, true);
      assert.equal(findNodes(screen.editHost, (n) => n?.tagName === "BUTTON" && String(n?.textContent || "").trim() === "Drucken").length, 0);

      screen.filterState.item_class = "mangel";
      screen._renderList();
      await btnPrint.onclick();

      assert.equal(printPdfAndPreviewInternalCalls.length, 1);
      assert.equal(previewCalls.length, 0);
      assert.equal(statusCalls.includes("PDF-Druckvorschau geöffnet."), true);
      assert.equal(printCalls.length, 0);
      assert.equal(printPdfAndPreviewInternalCalls[0].mode, "restarbeiten");
      assert.equal(printPdfAndPreviewInternalCalls[0].projectId, "p-1");
      assert.equal(printPdfAndPreviewInternalCalls[0].devLayoutPreview, false);
      assert.equal(Array.isArray(printPdfAndPreviewInternalCalls[0].restarbeitenRows), true);
      assert.equal(printPdfAndPreviewInternalCalls[0].restarbeitenRows.length, 1);
      assert.equal(printPdfAndPreviewInternalCalls[0].restarbeitenRows[0].running_number, 2);
      assert.equal(printPdfAndPreviewInternalCalls[0].restarbeitenRows[0].item_class, "mangel");
      assert.deepEqual(printPdfAndPreviewInternalCalls[0].restarbeitenLocationLabels, {
        level_1_label: "Gebäude",
        level_2_label: "Stock",
        level_3_label: "Bereich",
        level_4_label: "Zone",
      });
      const row = printPdfAndPreviewInternalCalls[0].restarbeitenRows[0];
      for (const key of ["running_number","item_class","short_text","long_text","location_level_1","location_level_2","location_level_3","location_level_4","status","due_date","responsible_label","completed_at","completion_note"]) {
        assert.equal(Object.prototype.hasOwnProperty.call(row, key), true);
      }
      for (const key of ["attachments", "photos", "file_path", "thumbnail_path"]) {
        assert.equal(Object.prototype.hasOwnProperty.call(row, key), false);
      }

      await quicklanePreviewBtn.onclick();
      await quicklanePrintBtn.onclick();
      assert.equal(openRestarbeitenDirCalls.length, 1);
      assert.equal(openRestarbeitenDirCalls[0].project_number, "P-100");
      assert.equal(openRestarbeitenDirCalls[0].short, "Kurz");
      assert.equal(openRestarbeitenDirCalls[0].name, "Name");
      assert.equal(statusCalls.includes("Ausgabeordner geöffnet."), true);
      assert.equal(printPdfAndPreviewInternalCalls.length, 2);
      for (const payload of printPdfAndPreviewInternalCalls.slice(0, 2)) {
        assert.equal(payload.mode, "restarbeiten");
        assert.equal(payload.devLayoutPreview, false);
        assert.equal(Array.isArray(payload.restarbeitenRows), true);
        assert.equal(payload.restarbeitenRows.length, 1);
      }

      screen.filterState.item_class = "mangel";
      screen.filterState.location_level_1 = "Nicht vorhanden";
      screen._renderList();
      await btnPrint.onclick();
      assert.equal(printPdfAndPreviewInternalCalls.length, 2);
      assert.equal(previewCalls.length, 0);
      assert.equal(printCalls.length, 0);
      assert.equal(statusCalls.includes("Keine Restpunkte für den Druck vorhanden."), true);
    } finally {
      globalThis.window = prevWindow;
      globalThis.document = prevDocument;
    }
  });


  await run("M33.6 Restarbeiten-PDF-Druckvorschau meldet Fehler bei bridge/result/exception", async () => {
    const prevWindow = globalThis.window;
    const prevDocument = globalThis.document;
    const statusCalls = [];

    async function buildScreen(windowMock) {
      globalThis.window = windowMock;
      globalThis.document = createFakeDocument();
      const RestarbeitenScreen = (await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"))).default;
      const screen = new RestarbeitenScreen({ projectId: "p-1", project: { id: "p-1", project_number: "P-100", short: "Kurz", name: "Name" } });
      const root = screen.render();
      await screen.load();
      screen.editbox = { setStatus: (msg) => statusCalls.push(msg) };
      const quicklane = findNodes(root, (n) => n?.["data-bbm-restarbeiten-quicklane"] === "true")[0];
      assert.ok(quicklane);
      const btnPreview = findButtonByText(quicklane, "Vorschau");
      assert.ok(btnPreview);
      return { btnPreview };
    }

    const sharedRows = [
      {
        id: "r-1", running_number: 1, item_class: "rest", short_text: "Rest A", long_text: "Lang A",
        location_level_1: "Haus A", location_level_2: "EG", location_level_3: "WE 1", location_level_4: "Bad",
        status: "offen", due_date: "2026-05-30", responsible_label: "Firma A", completed_at: "", completion_note: "",
      },
    ];
    const baseDb = {
      restarbeitenGetProjectSettings: async () => ({ ok: true, settings: {} }),
      restarbeitenListByProject: async () => ({ ok: true, items: sharedRows.map((i) => ({ ...i })) }),
      projectFirmsListByProject: async () => ({ ok: true, list: [] }),
      restarbeitenListAttachments: async () => ({ ok: true, attachments: [] }),
    };

    try {
      // result ok false
      statusCalls.length = 0;
      let prepared = await buildScreen({ bbmDb: { ...baseDb }, bbmPrint: { printPdfAndPreviewInternal: async () => ({ ok: false, error: "Modul Restarbeiten ist fuer diese Lizenz nicht freigeschaltet." }) } });
      await prepared.btnPreview.onclick();
      assert.equal(statusCalls.includes("PDF-Druckvorschau konnte nicht geöffnet werden: Modul Restarbeiten ist fuer diese Lizenz nicht freigeschaltet."), true);

      // bridge fehlt
      statusCalls.length = 0;
      prepared = await buildScreen({ bbmDb: { ...baseDb }, bbmPrint: {} });
      await prepared.btnPreview.onclick();
      assert.equal(statusCalls.includes("PDF-Druckvorschau ist nicht verfügbar."), true);

      // exception
      statusCalls.length = 0;
      prepared = await buildScreen({ bbmDb: { ...baseDb }, bbmPrint: { printPdfAndPreviewInternal: async () => { throw new Error("kaputt"); } } });
      await prepared.btnPreview.onclick();
      assert.equal(statusCalls.includes("PDF-Druckvorschau konnte nicht geöffnet werden."), true);
    } finally {
      globalThis.window = prevWindow;
      globalThis.document = prevDocument;
    }
  });



  await run("M34.2 Restarbeiten-Ausgabeordner: bridge/result/exception/kein Projekt", async () => {
    const prevWindow = globalThis.window;
    const prevDocument = globalThis.document;
    const statusCalls = [];

    async function buildScreen(windowMock, options = {}) {
      globalThis.window = windowMock;
      globalThis.document = createFakeDocument();
      const RestarbeitenScreen = (await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"))).default;
      const screen = new RestarbeitenScreen({
        projectId: options.projectId ?? "p-1",
        project: options.project ?? { id: "p-1", project_number: "P-100", short: "Kurz", name: "Name" },
      });
      const root = screen.render();
      await screen.load();
      screen.editbox = { setStatus: (msg) => statusCalls.push(msg) };
      const quicklane = findNodes(root, (n) => n?.["data-bbm-restarbeiten-quicklane"] === "true")[0];
      assert.ok(quicklane);
      const btnOpenDir = findButtonByText(quicklane, "Drucken");
      assert.ok(btnOpenDir);
      return { btnOpenDir };
    }

    const sharedRows = [{ id: "r-1", running_number: 1, item_class: "rest", short_text: "Rest A", long_text: "Lang A" }];
    const baseDb = {
      restarbeitenGetProjectSettings: async () => ({ ok: true, settings: {} }),
      restarbeitenListByProject: async () => ({ ok: true, items: sharedRows.map((i) => ({ ...i })) }),
      projectFirmsListByProject: async () => ({ ok: true, list: [] }),
      restarbeitenListAttachments: async () => ({ ok: true, attachments: [] }),
    };

    try {
      statusCalls.length = 0;
      let prepared = await buildScreen({ bbmDb: { ...baseDb, projectsOpenRestarbeitenDir: async () => ({ ok: false, error: "kaputt" }) }, bbmPrint: {} });
      await prepared.btnOpenDir.onclick();
      assert.equal(statusCalls.includes("Ausgabeordner konnte nicht geöffnet werden: kaputt"), true);

      statusCalls.length = 0;
      prepared = await buildScreen({ bbmDb: { ...baseDb }, bbmPrint: {} });
      await prepared.btnOpenDir.onclick();
      assert.equal(statusCalls.includes("Ausgabeordner ist nicht verfügbar."), true);

      statusCalls.length = 0;
      prepared = await buildScreen({ bbmDb: { ...baseDb, projectsOpenRestarbeitenDir: async () => { throw new Error("x"); } }, bbmPrint: {} });
      await prepared.btnOpenDir.onclick();
      assert.equal(statusCalls.includes("Ausgabeordner konnte nicht geöffnet werden."), true);

      statusCalls.length = 0;
      prepared = await buildScreen({ bbmDb: { ...baseDb, projectsOpenRestarbeitenDir: async () => ({ ok: true, dir: "C:/tmp" }) }, bbmPrint: {} }, { project: null });
      await prepared.btnOpenDir.onclick();
      assert.equal(statusCalls.includes("Ausgabeordner ist nicht verfügbar."), true);
    } finally {
      globalThis.window = prevWindow;
      globalThis.document = prevDocument;
    }
  });

  await run("M33.10 Preload-Bridge: printPdfAndPreviewInternal -> print:toPdfAndPreviewInternal", () => {
    const preloadPath = path.join(__dirname, "../../src/main/preload.js");
    const source = fs.readFileSync(preloadPath, "utf8");
    assert.match(source, /printPdfAndPreviewInternal:\s*\(data\)\s*=>\s*ipcRenderer\.invoke\("print:toPdfAndPreviewInternal",\s*data\)/);
    assert.match(source, /projectsOpenRestarbeitenDir:\s*\(data\)\s*=>\s*ipcRenderer\.invoke\("projects:openRestarbeitenDir",\s*data\)/);
  });

  await run("M34.2 IPC projects:openRestarbeitenDir faengt Async-Fehler strukturiert ab", () => {
    const projectsIpcPath = path.join(__dirname, "../../src/main/ipc/projectsIpc.js");
    const source = fs.readFileSync(projectsIpcPath, "utf8");
    assert.match(source, /ipcMain\.handle\("projects:openRestarbeitenDir",\s*async\s*\(_e,\s*data\)\s*=>\s*\{/);
    assert.doesNotMatch(source, /projects:openRestarbeitenDir"[\s\S]*?_runProjectTask\(async\s*\(\)\s*=>/);
    assert.match(source, /fs\.mkdirSync\(dir,\s*\{\s*recursive:\s*true\s*\}\)/);
    assert.match(source, /await\s+shell\.openPath\(dir\)/);
    assert.match(source, /buildStoragePreviewPaths\(/);
    assert.match(source, /restarbeitenDir/);
    assert.match(source, /catch\s*\(err\)\s*\{/);
    assert.match(source, /return\s*\{\s*ok:\s*false,\s*error:\s*err\?\.message\s*\|\|\s*String\(err\),\s*dir\s*\}/);
  });



  await run("M30.1 Guardrails: Create-Pfade bereinigen running_number/deleted_at", () => {
    const dsPath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js");
    const ipcPath = path.join(__dirname, "../../src/main/ipc/restarbeitenIpc.js");
    const repoPath = path.join(__dirname, "../../src/main/db/restarbeitenRepo.js");
    const ds = fs.readFileSync(dsPath, "utf8");
    const ipc = fs.readFileSync(ipcPath, "utf8");
    const repo = fs.readFileSync(repoPath, "utf8");

    assert.match(ds, /delete\s+out\.deleted_at/);
    assert.match(ds, /delete\s+out\.running_number/);
    assert.match(ipc, /delete\s+data\.deleted_at/);
    assert.match(ipc, /delete\s+data\.running_number/);
    assert.match(repo, /const runningNumber = nextRunning;/);
    assert.match(repo, /deleted_at:\s*null/);
    assert.match(ipc, /restarbeiten:softDeleteItem/);
    assert.doesNotMatch(ipc, /restarbeiten:deleteItem/);
  });

}

module.exports = { runRestarbeitenModuleTests };
