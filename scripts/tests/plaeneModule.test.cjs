const assert = require("node:assert/strict");
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
      append(...nodes) {
        for (const child of nodes) this.appendChild(child);
      },
      appendChild(child) {
        if (!child || typeof child !== "object") return child;
        if (child.nodeType === 11) {
          for (const fragmentChild of [...child.children]) this.appendChild(fragmentChild);
          child.children = [];
          return child;
        }
        child.parentElement = this;
        this.children.push(child);
        return child;
      },
      replaceChildren(...nodes) {
        this.children = [];
        this.textContent = "";
        this.append(...nodes);
      },
      addEventListener(name, handler) {
        this[`on${String(name)}`] = handler;
      },
      click() {
        if (typeof this.onclick === "function") this.onclick({ type: "click", target: this });
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
    };
    return node;
  };
  const doc = {
    createElement(tag) {
      return createNode(tag, doc);
    },
    createDocumentFragment() {
      const fragment = createNode("#fragment", doc);
      fragment.nodeType = 11;
      return fragment;
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

function findByUiId(node, uiId) {
  return findNodes(node, (entry) => entry.getAttribute?.("data-ui-inspector-id") === uiId)[0] || null;
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

async function withFakeDom(fn, bbmDb = {}) {
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  globalThis.document = createFakeDocument();
  globalThis.window = { bbmDb, dispatchEvent() {} };
  try {
    return await fn(globalThis.document);
  } finally {
    globalThis.document = previousDocument;
    globalThis.window = previousWindow;
  }
}

async function runPlaeneModuleTests(run) {
  const [plaeneModule, screenResolver, navigationModule, catalogModule, screenModule] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/plaene/index.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleEntryScreenResolver.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleNavigation.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleCatalog.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/plaene/screens/PlaeneScreen.js")),
  ]);

  await run("Pläne: Modulentry bleibt im Projektmodul-System erreichbar", () => {
    const entry = plaeneModule.getPlaeneModuleEntry();
    assert.equal(entry.moduleId, "plaene");
    assert.equal(entry.moduleLabel, "Pläne");
    assert.equal(entry.workScreenId, "plaeneWork");
    assert.equal(entry.navigation.project[0].key, "plaene");
    assert.equal(entry.navigation.project[0].label, "Pläne");
    assert.equal(entry.navigation.project[0].section, "plaene");
    assert.equal(entry.shell.hideSidebar, true);
    assert.equal(typeof screenResolver.resolveModuleWorkScreenFromEntry(entry), "function");
  });

  await run("Pläne: aktive Projektmodulnavigation enthält genau einen Pläne-Eintrag", () => {
    const entries = navigationModule.getActiveProjectModuleNavigation();
    const plaeneEntries = entries.filter((entry) => entry.moduleId === "plaene");
    assert.equal(plaeneEntries.length, 1);
    assert.equal(catalogModule.getActiveModuleIds().includes("plaene"), true);
  });

  await run("Pläne: ohne aktives Projekt zeigt die definierte Hinweisansicht", async () => withFakeDom(async () => {
    const screen = new screenModule.default({ projectId: null, project: null });
    const root = screen.render();
    await flush();
    const text = collectText(root);
    assert.equal(text.includes("Kein Projekt ausgewählt."), true);
    assert.equal(text.includes("Öffnen Sie zuerst ein Projekt, um dessen Pläne zu verwalten."), true);
    assert.equal(text.includes("Modul Pläne"), false);
    assert.equal(Boolean(findByUiId(root, "plaene.m1.no-project-notice")), true);
  }));

  await run("Pläne: Zurück ohne aktives Projekt öffnet Projektliste", async () => withFakeDom(async () => {
    const calls = [];
    const screen = new screenModule.default({
      projectId: null,
      project: null,
      router: {
        async showProjects() {
          calls.push(["showProjects"]);
        },
      },
    });
    const root = screen.render();
    await flush();
    const buttons = findNodes(root, (node) => node.tagName === "BUTTON" && node.textContent === "Zurück");
    assert.equal(buttons.length, 1);
    buttons[0].click();
    await flush();
    assert.deepEqual(calls, [["showProjects"]]);
  }));

  await run("Pläne: Zurück mit aktivem Projekt öffnet Projekt-/Modulauswahl ohne Projektkontextänderung", async () => withFakeDom(async () => {
    const calls = [];
    const project = { id: "projekt-a", name: "Projekt A" };
    const screen = new screenModule.default({
      projectId: "projekt-a",
      project,
      router: {
        async showProjectWorkspace(projectId, options) {
          calls.push(["showProjectWorkspace", projectId, options]);
        },
        async showProjects() {
          calls.push(["showProjects"]);
        },
      },
    });
    const root = screen.render();
    await flush();
    const buttons = findNodes(root, (node) => node.tagName === "BUTTON" && node.textContent === "Zurück");
    assert.equal(buttons.length, 1);
    buttons[0].click();
    await flush();
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "showProjectWorkspace");
    assert.equal(calls[0][1], "projekt-a");
    assert.deepEqual(calls[0][2], { project });
  }));

  await run("Pläne: aktives Projekt zeigt ausschließlich übergebene Projektwerte", async () => withFakeDom(async () => {
    const screen = new screenModule.default({
      projectId: "projekt-a",
      project: {
        id: "projekt-a",
        name: "Projekt A",
        buildings: ["Haus A", "Haus B"],
        floors: ["EG", "OG"],
      },
    });
    const root = screen.render();
    await flush();
    const text = collectText(root);
    assert.equal(text.includes("Modul Pläne"), true);
    assert.equal(text.includes("Aktives Projekt: Projekt A"), true);
    assert.equal(text.includes("projekt-a"), true);
    assert.equal(text.includes("Anzahl vorhandener Gebäude 2"), true);
    assert.equal(text.includes("Anzahl vorhandener Geschosse 2"), true);
    assert.equal(text.includes("Die Planordner-Anbindung folgt in Meilenstein M2."), true);
    assert.equal(text.includes("Projekt B"), false);
  }));

  await run("Pläne: Projektwechsel nutzt neue Screen-Props statt alten lokalen Projekt-State", async () => withFakeDom(async () => {
    const screenA = new screenModule.default({
      projectId: "projekt-a",
      project: { id: "projekt-a", name: "Projekt A", buildings: ["Haus A"], floors: ["EG"] },
    });
    const rootA = screenA.render();
    await flush();

    const screenB = new screenModule.default({
      projectId: "projekt-b",
      project: { id: "projekt-b", name: "Projekt B", buildings: ["Haus C", "Haus D"], floors: ["UG", "EG", "OG"] },
    });
    const rootB = screenB.render();
    await flush();

    const textA = collectText(rootA);
    const textB = collectText(rootB);
    assert.equal(textA.includes("Projekt A"), true);
    assert.equal(textB.includes("Projekt B"), true);
    assert.equal(textB.includes("Projekt A"), false);
    assert.equal(textB.includes("projekt-a"), false);
    assert.equal(textB.includes("projekt-b"), true);
    assert.equal(textB.includes("Anzahl vorhandener Gebäude 2"), true);
    assert.equal(textB.includes("Anzahl vorhandener Geschosse 3"), true);
  }));

  await run("Pläne: Projektordner wird nur lesend über vorhandene Storage-Preview bezogen", async () => {
    const calls = [];
    await withFakeDom(async () => {
      const screen = new screenModule.default({
        projectId: "projekt-a",
        project: { id: "projekt-a", name: "Projekt A" },
      });
      const root = screen.render();
      await flush();
      const text = collectText(root);
      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0], { id: "projekt-a", name: "Projekt A" });
      assert.equal(text.includes("Projektordner 100 - Projekt A"), true);
    }, {
      async projectsStoragePreview(project) {
        calls.push(project);
        return { ok: true, projectFolder: "100 - Projekt A" };
      },
    });
  });

  await run("Pläne: keine projektlose Speicherung oder Plandaten-IPC im M1-Screen", async () => {
    const calls = [];
    await withFakeDom(async () => {
      const screen = new screenModule.default({ projectId: null, project: null });
      screen.render();
      await flush();
      assert.equal(calls.length, 0);
    }, {
      async projectsStoragePreview(project) {
        calls.push(project);
        return { ok: true, projectFolder: "soll-nicht-passieren" };
      },
      async plansCreate() {
        throw new Error("plansCreate darf in M1 nicht existieren/benutzt werden");
      },
    });
  });

  await run("Pläne: UI-Editor-Pflichtattribute und Parent-Struktur sind im neuen DOM vorhanden", async () => withFakeDom(async () => {
    const screen = new screenModule.default({
      projectId: "projekt-a",
      project: { id: "projekt-a", name: "Projekt A", buildings: ["Haus A"], floors: ["EG"] },
    });
    const root = screen.render();
    await flush();
    const expected = new Map([
      ["plaene.m1.root", ""],
      ["plaene.m1.header", "plaene.m1.root"],
      ["plaene.m1.title", "plaene.m1.header"],
      ["plaene.m1.active-project", "plaene.m1.header"],
      ["plaene.m1.project-summary", "plaene.m1.root"],
      ["plaene.m1.project-id", "plaene.m1.project-summary"],
      ["plaene.m1.project-folder", "plaene.m1.project-summary"],
      ["plaene.m1.building-count", "plaene.m1.project-summary"],
      ["plaene.m1.floor-count", "plaene.m1.project-summary"],
      ["plaene.m1.next-step-note", "plaene.m1.root"],
    ]);
    for (const [id, parentId] of expected) {
      const node = findByUiId(root, id);
      assert.ok(node, `${id} fehlt`);
      assert.equal(node.getAttribute("data-ui-editor-id"), id);
      assert.equal(node.getAttribute("data-ui-editor-parent"), parentId);
      assert.equal(node.getAttribute("data-ui-editor-editable"), "true");
      assert.equal(node.getAttribute("data-ui-editor-ops"), "inspect,select");
      assert.ok(["frame", "field", "single"].includes(node.getAttribute("data-ui-editor-kind")));
      assert.ok(node.getAttribute("data-ui-editor-label"));
      if (parentId) assert.ok(findByUiId(root, parentId), `${id} Parent fehlt`);
    }
  }));
}

if (require.main === module) {
  const results = [];
  const run = async (name, fn) => {
    try {
      await fn();
      results.push({ name, ok: true });
      console.log(`ok - ${name}`);
    } catch (error) {
      results.push({ name, ok: false });
      console.error(`not ok - ${name}`);
      console.error(error?.stack || error?.message || error);
    }
  };
  runPlaeneModuleTests(run).then(() => {
    if (results.some((result) => !result.ok)) process.exit(1);
  });
}

module.exports = { runPlaeneModuleTests };
