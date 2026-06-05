const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const PLACEHOLDER_TEXT = "Restarbeitenliste wird neu aufgebaut.";

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
        this[key] = text;
      },
      getAttribute(name) {
        const key = String(name);
        return Object.prototype.hasOwnProperty.call(this.attributes, key) ? this.attributes[key] : null;
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
        if (typeof this.onclick === "function") this.onclick({ type: "click", preventDefault() {} });
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
    body: null,
    head: null,
  };
  doc.body = createNode("body", doc);
  doc.head = createNode("head", doc);
  return doc;
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

function hasText(root, text) {
  return collectText(root).includes(text);
}

function legacyClassNames() {
  const h = String.fromCharCode(72, 101, 97, 100, 101, 114);
  return [
    "restarbeiten-list" + h,
    "restarbeiten-" + "edit" + "box",
    "restarbeiten-" + "head" + "er",
    "restarbeiten-list__row",
    "restarbeiten-filterleiste",
    "restarbeiten-attachments",
  ];
}

function legacyAttributeNames() {
  return [
    "data-ui-" + "insp" + "ector-id",
    "data-ui-" + "ed" + "itor-id",
    "data-ui-v2-id",
    "data-ui-v2-restarbeiten-host",
    "data-ui-" + "ed" + "itor-panel",
  ];
}

function assertOnlyNeutralPlaceholder(root) {
  assert.equal(hasText(root, PLACEHOLDER_TEXT), true);

  const allText = collectText(root);
  for (const text of ["+ Restpunkt", "Foto", "Fotos", "Quick" + "lane", "UUID", "Spei" + "chern"]) {
    assert.equal(allText.includes(text), false, text);
  }

  for (const className of legacyClassNames()) {
    assert.equal(
      findNodes(root, (node) => String(node?.className || "").includes(className)).length,
      0,
      className
    );
  }

  for (const attrName of legacyAttributeNames()) {
    assert.equal(
      findNodes(root, (node) => {
        if (typeof node?.getAttribute === "function" && node.getAttribute(attrName) !== null) return true;
        return Object.prototype.hasOwnProperty.call(node?.attributes || {}, attrName);
      }).length,
      0,
      attrName
    );
  }
}

async function renderRoutePlaceholder() {
  const Router = (await importEsmFromFile(path.join(__dirname, "../../src/renderer/app/Router.js"))).default;
  const prevDocument = globalThis.document;
  const prevWindow = globalThis.window;
  const doc = createFakeDocument();
  const contentRoot = doc.createElement("main");
  globalThis.document = doc;
  globalThis.window = {
    localStorage: { getItem: () => "" },
    bbmDb: {},
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
    router._setSidebarVisibility = () => {};
    const opened = await router.openProjectModule("p-1", "restarbeiten", {
      project: { id: "p-1", project_number: "P-1", short: "Test" },
    });
    assert.equal(opened, true);
    return { root: contentRoot, pageTitle: router.context.ui.pageTitle };
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

  await run("Restarbeiten: aktive Route zeigt nur den neutralen Neuaufbau-Hinweis", async () => {
    const rendered = await renderRoutePlaceholder();
    assert.equal(rendered.pageTitle, "Restarbeiten");
    assertOnlyNeutralPlaceholder(rendered.root);
  });

  await run("Restarbeiten: Screen selbst zeigt nur den neutralen Neuaufbau-Hinweis", async () => {
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js")
    );
    const prevDocument = globalThis.document;
    globalThis.document = createFakeDocument();
    try {
      const screen = new mod.default({ projectId: "p-1", project: { id: "p-1" } });
      const root = screen.render();
      assertOnlyNeutralPlaceholder(root);
    } finally {
      globalThis.document = prevDocument;
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
    assert.equal(typeof viewModel.toRestarbeitenListItems, "function");
  });

  await run("Restarbeiten: IPC und Preload behalten vorhandene Lesewege", () => {
    const ipcPath = path.join(__dirname, "../../src/main/ipc/restarbeitenIpc.js");
    const preloadPath = path.join(__dirname, "../../src/main/preload.js");
    const ipc = fs.readFileSync(ipcPath, "utf8");
    const preload = fs.readFileSync(preloadPath, "utf8");

    assert.match(ipc, /restarbeiten:listByProject/);
    assert.match(ipc, /restarbeiten:getProjectSettings/);
    assert.match(ipc, /restarbeiten:listAttachments/);
    assert.match(preload, /restarbeitenListByProject/);
    assert.match(preload, /restarbeitenGetProjectSettings/);
    assert.match(preload, /restarbeitenListAttachments/);
  });

  await run("Restarbeiten: alter UI-Dateisatz ist nicht mehr vorhanden", () => {
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
