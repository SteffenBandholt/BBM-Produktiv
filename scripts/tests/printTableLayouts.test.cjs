const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createFakeNode(tag) {
  const listeners = new Map();
  const node = {
    tagName: String(tag || "").toUpperCase(),
    children: [],
    dataset: {},
    className: "",
    style: {
      setProperty(name, value) {
        this[String(name)] = String(value);
      },
      removeProperty(name) {
        delete this[String(name)];
      },
    },
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() {
        return false;
      },
    },
    append(...items) {
      for (const item of items) {
        if (item == null) continue;
        this.children.push(item);
      }
    },
    appendChild(item) {
      if (item != null) this.children.push(item);
      return item;
    },
    replaceChildren(...items) {
      this.children = [];
      for (const item of items) {
        if (item != null) this.children.push(item);
      }
    },
    addEventListener(type, handler) {
      const list = listeners.get(type) || [];
      list.push(handler);
      listeners.set(type, list);
    },
    dispatchEvent(evt) {
      const type = String(evt?.type || "");
      const list = listeners.get(type) || [];
      for (const handler of list.slice()) {
        handler.call(this, evt);
      }
      return true;
    },
    setAttribute() {},
    removeAttribute() {},
    querySelectorAll() {
      return [];
    },
  };

  Object.defineProperty(node, "textContent", {
    configurable: true,
    enumerable: true,
    get() {
      return this._text || "";
    },
    set(value) {
      this._text = String(value ?? "");
    },
  });
  Object.defineProperty(node, "innerHTML", {
    configurable: true,
    enumerable: true,
    get() {
      return this._innerHTML || "";
    },
    set(value) {
      this._innerHTML = String(value || "");
      this.children = [];
    },
  });

  return node;
}

function createFakeDocument() {
  const doc = {
    activeElement: null,
    createElement(tag) {
      return createFakeNode(tag);
    },
    createElementNS(_ns, tag) {
      return createFakeNode(tag);
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text ?? ""), children: [] };
    },
    getElementById() {
      return null;
    },
    addEventListener() {},
    removeEventListener() {},
  };
  doc.body = createFakeNode("body");
  doc.head = createFakeNode("head");
  doc.documentElement = createFakeNode("html");
  doc.documentElement.dataset = {};
  return doc;
}

function findNodeByTag(node, tagName) {
  const target = String(tagName || "").toUpperCase();
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findNodeByTag(item, target);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  if (String(node.tagName || "").toUpperCase() === target) return node;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findNodeByTag(child, target);
      if (found) return found;
    }
  }
  return null;
}

async function withTempPrintData(fn) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-print-table-layouts-"));
  const userDataPath = path.join(tmpRoot, "userData");
  fs.mkdirSync(userDataPath, { recursive: true });

  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === "electron" && String(parent?.filename || "").endsWith(path.join("db", "database.js"))) {
      return {
        app: {
          getPath: (name) => (name === "userData" ? userDataPath : ""),
          isPackaged: true,
        },
      };
    }
    return originalLoad.apply(this, arguments);
  };

  try {
    const dbPath = path.join(process.cwd(), "src/main/db/database.js");
    const printDataPath = path.join(process.cwd(), "src/main/print/printData.js");
    const repoPath = path.join(process.cwd(), "src/main/db/tableLayoutsRepo.js");
    delete require.cache[require.resolve(dbPath)];
    delete require.cache[require.resolve(printDataPath)];
    delete require.cache[require.resolve(repoPath)];
    const db = require(dbPath);
    const repo = require(repoPath);
    const { getPrintData } = require(printDataPath);
    return await fn({ db, repo, getPrintData });
  } finally {
    try {
      const dbPath = path.join(process.cwd(), "src/main/db/database.js");
      const db = require(dbPath);
      if (typeof db.closeDatabase === "function") db.closeDatabase();
    } catch (_e) {}
    Module._load = originalLoad;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

async function runPrintTableLayoutsTests(run) {
  await run("PrintData: protokoll_tops Layout wird als resolved Payload mitgegeben", () => {
    return withTempPrintData(async ({ db, getPrintData }) => {
      db.initDatabase();

      const data = await getPrintData({
        mode: "topsAll",
        orientation: "portrait",
      });

      assert.ok(data.tableLayouts);
      assert.ok(data.tableLayouts.protokoll_tops);
      assert.equal(data.tableLayouts.protokoll_tops.ok, true);
      assert.equal(
        data.tableLayouts.protokoll_tops.effectiveLayout.ui.rootVars["--bbm-tops-list-number-col"],
        "64px"
      );
      assert.equal(data.tableLayouts.protokoll_tops.effectiveLayout.pdf.columns.number.width, "23mm");
      assert.equal(data.tableLayouts.protokoll_tops.effectiveLayout.pdf.columns.text.width, "auto");
      assert.equal(data.tableLayouts.protokoll_tops.effectiveLayout.pdf.columns.meta.width, "15ch");
      assert.equal(data.tableLayouts.protokoll_tops.effectiveLayout.labels.top, "TOP");
      assert.equal(data.tableLayouts.protokoll_tops.source, "default");
    });
  });

  await run("PrintShell: PDF-Druck verwendet gespeicherte PDF-Werte und keine UI-Werte", () => {
    return withTempPrintData(async ({ db, repo, getPrintData }) => {
      db.initDatabase();
      await repo.saveTableLayout({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "portrait",
        layout: {
          ui: {
            rootVars: {
              "--bbm-tops-list-number-col": "72px",
              "--bbm-tops-list-text-col": "minmax(0, 1.2fr)",
              "--bbm-tops-list-meta-col": "84px",
            },
          },
          pdf: {
            columns: {
              number: { width: "25mm" },
              text: { width: "auto" },
              meta: { width: "18ch" },
            },
          },
          labels: {
            top: "TOP",
            text: "Gegenstand",
            meta: ["Status", "Fertig bis", "verantw"],
          },
        },
      });

      const data = await getPrintData({
        mode: "topsAll",
        orientation: "portrait",
      });

      const prevDocument = global.document;
      const prevWindow = global.window;
      const fakeDocument = createFakeDocument();
      global.document = fakeDocument;
      global.window = {
        location: {
          href: "file:///print/",
        },
      };

      try {
        const { renderPrint } = await importEsmFromFile(
          path.join(process.cwd(), "src/renderer/print/layout/PrintShell.js")
        );
        const root = renderPrint({
          data,
          pages: [
            {
              header: { pageNo: 1 },
              table: {
                type: "tops",
                rows: [
                  {
                    level: 1,
                    numText: "1",
                    createdDate: "",
                    title: "Beispiel",
                    status: "offen",
                    due: "",
                    resp: "",
                    ampelColor: null,
                  },
                ],
              },
            },
          ],
        });

        const table = findNodeByTag(root, "table");
        const colgroup = findNodeByTag(table, "colgroup");
        assert.ok(table);
        assert.equal(table.dataset.tableKey, "protokoll_tops");
        assert.equal(table.dataset.layoutVariant, "portrait");
        assert.equal(table.style["--bbm-top-col-nr-width"], "23mm");
        assert.equal(table.style["--bbm-top-col-meta-width"], "15ch");
        assert.equal(table.style["--bbm-tops-list-number-col"], undefined);
        assert.equal(data.tableLayouts.protokoll_tops.effectiveLayout.pdf.columns.number.width, "25mm");
        assert.equal(data.tableLayouts.protokoll_tops.effectiveLayout.pdf.columns.meta.width, "18ch");
        assert.equal(String(colgroup._innerHTML || "").includes("25mm"), true);
        assert.equal(String(colgroup._innerHTML || "").includes("18ch"), true);
        assert.equal(String(colgroup._innerHTML || "").includes("72px"), false);
      } finally {
        global.document = prevDocument;
        global.window = prevWindow;
      }
    });
  });

  await run("PrintShell: fehlender Layout-Payload faellt auf Standard-PDF-Werte zurueck", () => {
    return withTempPrintData(async ({ db, getPrintData }) => {
      db.initDatabase();

      const data = await getPrintData({
        mode: "topsAll",
        orientation: "portrait",
      });
      delete data.tableLayouts.protokoll_tops;

      const prevDocument = global.document;
      const prevWindow = global.window;
      const fakeDocument = createFakeDocument();
      global.document = fakeDocument;
      global.window = {
        location: {
          href: "file:///print/",
        },
      };

      try {
        const { renderPrint } = await importEsmFromFile(
          path.join(process.cwd(), "src/renderer/print/layout/PrintShell.js")
        );
        const root = renderPrint({
          data,
          pages: [
            {
              header: { pageNo: 1 },
              table: {
                type: "tops",
                rows: [
                  {
                    level: 1,
                    numText: "1",
                    createdDate: "",
                    title: "Beispiel",
                    status: "offen",
                    due: "",
                    resp: "",
                    ampelColor: null,
                  },
                ],
              },
            },
          ],
        });

        const table = findNodeByTag(root, "table");
        const colgroup = findNodeByTag(table, "colgroup");
        assert.ok(table);
        assert.equal(table.style["--bbm-top-col-nr-width"], "23mm");
        assert.equal(table.style["--bbm-top-col-meta-width"], "15ch");
        assert.equal(String(colgroup._innerHTML || "").includes("23mm"), true);
        assert.equal(String(colgroup._innerHTML || "").includes("15ch"), true);
      } finally {
        global.document = prevDocument;
        global.window = prevWindow;
      }
    });
  });
}

module.exports = { runPrintTableLayoutsTests };
