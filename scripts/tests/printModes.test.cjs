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
      for (const handler of list.slice()) handler.call(this, evt);
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

function collectText(node) {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(collectText).join(" ");
  const own = String(node.textContent || "");
  const childText = Array.isArray(node.children) ? node.children.map(collectText).join(" ") : "";
  return [own, childText].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

async function withTempPrintData(fn) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-print-modes-"));
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
    delete require.cache[require.resolve(dbPath)];
    delete require.cache[require.resolve(printDataPath)];
    const db = require(dbPath);
    const { getPrintData } = require(printDataPath);
    return await fn({ db, getPrintData });
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

async function runPrintModesTests(run) {
  const modes = await importEsmFromFile(path.join(process.cwd(), "src/shared/print/printModes.mjs"));

  await run("Print-Modi: Dialog-Aktionen und Canonical Names sind vorhanden", () => {
    const defs = modes.getVisiblePrintDialogActions();
    const labels = defs.map((item) => item.label);
    const modesList = defs.map((item) => item.mode).filter(Boolean);
    assert.equal(modes.normalizePrintMode("TOPSALL"), "topsAll");
    assert.equal(modes.normalizePrintMode("headerTest"), "headerTest");
    assert.equal(modes.normalizePrintMode("foo"), "");
    assert.equal(labels.includes("Protokoll drucken"), true);
    assert.equal(labels.includes("PDF-Vorschau öffnen"), true);
    assert.equal(labels.includes("Firmenliste"), true);
    assert.equal(labels.includes("ToDo-Liste"), true);
    assert.equal(labels.includes("Top-Liste (alle)"), true);
    assert.equal(labels.includes("Gespeicherte Firmenlisten"), true);
    assert.equal(modesList.includes("protocol"), true);
    assert.equal(modesList.includes("preview"), true);
    assert.equal(modesList.includes("firms"), true);
    assert.equal(modesList.includes("todo"), true);
    assert.equal(modesList.includes("topsAll"), true);
    assert.equal(modesList.includes("headerTest"), false);
    assert.equal(modesList.includes("vorabzug"), false);
  });

  await run("PrintData: angebotene Modi werden akzeptiert", () => {
    return withTempPrintData(async ({ db, getPrintData }) => {
      db.initDatabase();

      for (const mode of ["protocol", "preview", "vorabzug", "firms", "todo", "topsAll"]) {
        const data = await getPrintData({ mode, orientation: "portrait" });
        assert.equal(data.mode, mode);
      }
    });
  });

  await run("PrintData: unbekannter Modus wird abgelehnt", () => {
    return withTempPrintData(async ({ db, getPrintData }) => {
      db.initDatabase();
      await assert.rejects(() => getPrintData({ mode: "foo", orientation: "portrait" }), /Unbekannter Druckmodus/);
    });
  });

  await run("PrintShell: unbekannter Modus wird abgelehnt", async () => {
    const originalWindow = global.window;
    const originalDocument = global.document;
    global.window = { location: { href: "file:///print/" } };
    global.document = createFakeDocument();

    try {
      const { renderPrint } = await importEsmFromFile(
        path.join(process.cwd(), "src/renderer/print/layout/PrintShell.js")
      );
      assert.throws(
        () =>
          renderPrint({
            data: { mode: "foo" },
            pages: [],
          }),
        /Unbekannter Druckmodus/
      );
    } finally {
      global.window = originalWindow;
      global.document = originalDocument;
    }
  });
}

module.exports = { runPrintModesTests };
