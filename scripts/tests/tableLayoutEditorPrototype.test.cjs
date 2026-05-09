const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createFakeNode(tag) {
  const listeners = new Map();
  const node = {
    tagName: String(tag || "").toUpperCase(),
    children: [],
    dataset: {},
    value: "",
    checked: false,
    disabled: false,
    type: "",
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
    focus() {},
    click() {
      return this.dispatchEvent({ type: "click" });
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
    addEventListener() {},
    removeEventListener() {},
  };
  doc.body = createFakeNode("body");
  return doc;
}

function collectText(node) {
  if (node == null) return "";
  if (Array.isArray(node)) return node.map(collectText).join(" ");
  if (typeof node === "string") return node;
  const own = String(node.textContent || "");
  const childText = Array.isArray(node.children) ? node.children.map(collectText).join(" ") : "";
  return [own, childText].filter(Boolean).join(" ");
}

function findNodeByText(node, text) {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findNodeByText(item, text);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  if (String(node.textContent || "") === text) return node;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findNodeByText(child, text);
      if (found) return found;
    }
  }
  return null;
}

function findNodesByTag(node, tagName, out = []) {
  const target = String(tagName || "").toUpperCase();
  if (!node) return out;
  if (Array.isArray(node)) {
    for (const item of node) findNodesByTag(item, target, out);
    return out;
  }
  if (typeof node !== "object") return out;
  if (String(node.tagName || "").toUpperCase() === target) out.push(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) findNodesByTag(child, target, out);
  }
  return out;
}

function flushMicrotasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function runTableLayoutEditorPrototypeTests(run) {
  const editorMod = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/views/TableLayoutPrototypeEditor.js")
  );
  const { default: SettingsView } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/views/SettingsView.js")
  );

  const makeEditorApi = ({
    tableDefinitions = [{ tableKey: "protokoll_tops", moduleId: "protokoll", label: "Protokoll TOP-Liste" }],
    getOne = async (payload) => ({
      ok: true,
      data: {
        source: "default",
        schemaVersion: 1,
        effectiveLayout: editorMod.buildProtokollTopsLayoutOverlay({}, payload.orientation),
      },
    }),
    save = async (payload) => ({
      ok: true,
      data: {
        source: "stored",
        schemaVersion: payload.schemaVersion || 1,
        effectiveLayout: payload.layout,
      },
    }),
    reset = async () => ({ ok: true, data: { removed: 1 } }),
    } = {}) => {
    const calls = [];
    return {
      calls,
      api: {
        tableLayoutsListDefinitions: async () => ({ ok: true, data: tableDefinitions }),
        tableLayoutsGetOne: async (payload) => {
          calls.push({ type: "getOne", payload });
          return getOne(payload, calls);
        },
        tableLayoutsSave: async (payload) => {
          calls.push({ type: "save", payload });
          return save(payload, calls);
        },
        tableLayoutsReset: async (payload) => {
          calls.push({ type: "reset", payload });
          return reset(payload, calls);
        },
      },
    };
  };

  await run("TableLayoutEditor: Kernwerte werden defensiv normalisiert", () => {
    const overlay = editorMod.buildProtokollTopsLayoutOverlay(
      {
        orientation: "landscape",
        uiNumberWidth: "72px",
        uiTextTrack: "minmax(0, 1.2fr)",
        uiMetaWidth: "80px",
        pdfNumberWidth: "24mm",
        pdfTextWidth: "auto",
        pdfMetaWidth: "16ch",
        labelTop: "TOP",
        labelText: "Kurztext",
        labelMeta1: "Status",
        labelMeta2: "Fertig bis",
        labelMeta3: "Verantwortlich",
      },
      "portrait"
    );
    assert.equal(overlay.variant, "landscape");
    assert.equal(overlay.ui.rootVars["--bbm-tops-list-number-col"], "72px");
    assert.equal(overlay.ui.rootVars["--bbm-tops-list-text-col"], "minmax(0, 1.2fr)");
    assert.equal(overlay.ui.rootVars["--bbm-tops-list-meta-col"], "80px");
    assert.equal(overlay.pdf.columns.number.width, "24mm");
    assert.equal(overlay.pdf.columns.text.width, "auto");
    assert.equal(overlay.pdf.columns.meta.width, "16ch");
    assert.equal(overlay.labels.meta[2], "Verantwortlich");
  });

  await run("TableLayoutEditor: protokoll_tops portrait zeigt Modul, Tabelle und Standardquelle", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();
    const { api, calls } = makeEditorApi();
    global.window = { bbmDb: api };
    try {
      const editor = editorMod.createTableLayoutPrototypeEditor({ api: global.window.bbmDb });
      await editor.load();
      const text = collectText(editor.root);
      const selects = findNodesByTag(editor.root, "SELECT");
      assert.equal(calls.filter((item) => item.type === "getOne").length, 1);
      assert.deepEqual(calls.find((item) => item.type === "getOne")?.payload, {
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "portrait",
      });
      assert.equal(selects[0]?.value, "protokoll");
      assert.equal(selects[1]?.value, "protokoll_tops");
      assert.equal(selects[2]?.value, "portrait");
      assert.equal(text.includes("Modul: Protokoll"), true);
      assert.equal(text.includes("Tabelle: TOP-Liste"), true);
      assert.equal(text.includes("tableKey: protokoll_tops"), true);
      assert.equal(text.includes("Orientierung: portrait"), true);
      assert.equal(text.includes("Quelle: Standardlayout protokoll_tops"), true);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("TableLayoutEditor: protokoll_tops landscape bleibt getrennte Layoutvariante", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();
    const { api, calls } = makeEditorApi({
      getOne: async (payload) => ({
        ok: true,
        data: {
          source: payload.orientation === "landscape" ? "stored" : "default",
          schemaVersion: 1,
          effectiveLayout: editorMod.buildProtokollTopsLayoutOverlay(
            {
              uiNumberWidth: payload.orientation === "landscape" ? "72px" : "64px",
            },
            payload.orientation
          ),
        },
      }),
    });
    global.window = { bbmDb: api };
    try {
      const editor = editorMod.createTableLayoutPrototypeEditor({ api: global.window.bbmDb });
      await editor.load();
      const selects = findNodesByTag(editor.root, "SELECT");
      selects[2].value = "landscape";
      selects[2].dispatchEvent({ type: "change" });
      await editor.load();
      const text = collectText(editor.root);
      const getOneCalls = calls.filter((item) => item.type === "getOne");
      assert.equal(getOneCalls.length, 3);
      assert.deepEqual(getOneCalls[0].payload, {
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "portrait",
      });
      assert.deepEqual(getOneCalls[1].payload, {
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "landscape",
      });
      assert.deepEqual(getOneCalls[2].payload, {
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "landscape",
      });
      assert.equal(selects[0].value, "protokoll");
      assert.equal(selects[1].value, "protokoll_tops");
      assert.equal(selects[2].value, "landscape");
      assert.equal(text.includes("Orientierung: landscape"), true);
      assert.equal(text.includes("Quelle: Fallback"), false);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("SettingsView: Tabellenlayout-Editor bleibt aus der normalen Startansicht heraus", () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();
    global.window = {};
    try {
      const view = new SettingsView({});
      const root = view.render();
      const text = collectText(root);
      assert.equal(text.includes("Tabellenlayouts"), false);
      assert.equal(text.includes("Gespeichertes Layout im PDF testen"), false);
      assert.equal(text.includes("Entwicklung"), true);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("TableLayoutEditor: load/save/reset nutzt vorhandene IPC-Endpunkte", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();
    const { api, calls } = makeEditorApi({
      getOne: async (payload) => ({
        ok: true,
        data: {
          source: "stored",
          schemaVersion: 3,
          effectiveLayout: {
            variant: payload.orientation,
            labels: {
              top: "TOP",
              text: "Gegenstand",
              meta: ["Status", "Fertig bis", "verantw"],
            },
            ui: {
              rootVars: {
                "--bbm-tops-list-number-col": "70px",
                "--bbm-tops-list-text-col": "minmax(0, 1.1fr)",
                "--bbm-tops-list-meta-col": "78px",
              },
            },
            pdf: {
              columns: {
                number: { width: "24mm" },
                text: { width: "auto" },
                meta: { width: "16ch" },
              },
            },
          },
        },
      }),
      save: async (payload) => ({
        ok: true,
        data: {
          source: "stored",
          effectiveLayout: {
            variant: payload.layout.variant,
            labels: payload.layout.labels,
            ui: payload.layout.ui,
            pdf: payload.layout.pdf,
          },
        },
      }),
      reset: async () => ({ ok: true, data: { removed: 1 } }),
    });
    global.window = { bbmDb: api };
    try {
      const editor = editorMod.createTableLayoutPrototypeEditor({ api: global.window.bbmDb });
      await editor.load();
      const selects = findNodesByTag(editor.root, "SELECT");
      selects[2].value = "landscape";
      selects[2].dispatchEvent({ type: "change" });
      await flushMicrotasks();
      editor.applyValues({
        uiNumberWidth: "76px",
        uiTextTrack: "minmax(0, 1.25fr)",
        uiMetaWidth: "84px",
        pdfNumberWidth: "25mm",
        pdfTextWidth: "auto",
        pdfMetaWidth: "18ch",
        labelText: "Gegenstand / Kurztext",
      });
      const saveRes = await editor.save();
      assert.equal(saveRes.ok, true);
      assert.equal(calls.filter((item) => item.type === "getOne").length >= 1, true);
      assert.deepEqual(calls.find((item) => item.type === "getOne")?.payload, {
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "portrait",
      });
      const saveCall = calls.find((item) => item.type === "save");
      assert.ok(saveCall, "save call missing");
      assert.equal(saveCall.payload.tableKey, "protokoll_tops");
      assert.equal(saveCall.payload.moduleId, "protokoll");
      assert.equal(saveCall.payload.orientation, "landscape");
      assert.equal(saveCall.payload.schemaVersion, 3);
      assert.equal(saveCall.payload.layout.ui.rootVars["--bbm-tops-list-number-col"], "76px");
      assert.equal(saveCall.payload.layout.ui.rootVars["--bbm-tops-list-text-col"], "minmax(0, 1.25fr)");
      assert.equal(saveCall.payload.layout.pdf.columns.meta.width, "18ch");
      assert.equal(saveCall.payload.layout.labels.text, "Gegenstand / Kurztext");
      assert.equal(saveCall.payload.layout.variant, "landscape");

      const resetRes = await editor.reset();
      assert.equal(resetRes.ok, true);
      const resetCall = calls.find((item) => item.type === "reset");
      assert.ok(resetCall, "reset call missing");
      assert.deepEqual(resetCall.payload, {
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "landscape",
      });
      assert.equal(editor.root.dataset.tableKey, "protokoll_tops");
      assert.equal(editor.root.dataset.moduleId, "protokoll");
      assert.equal(editor.root.dataset.orientation, "landscape");
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("TableLayoutEditor: kein globales Standardlayout als Ziel", () => {
    const previousDocument = global.document;
    global.document = createFakeDocument();
    try {
      const editor = editorMod.createTableLayoutPrototypeEditor({ api: {} });
      const text = collectText(editor.root);
      assert.equal(editor.root.dataset.tableKey, "protokoll_tops");
      assert.equal(editor.root.dataset.moduleId, "protokoll");
      assert.equal(editor.root.dataset.orientation, "portrait");
      assert.equal(text.includes("tableKey: protokoll_tops"), true);
      assert.equal(text.includes("Modul: Protokoll"), true);
      assert.equal(text.includes("global"), false);
    } finally {
      global.document = previousDocument;
    }
  });

  await run("TableLayoutEditor: PDF-Test mit Testdaten ist später separat", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();
    const { api } = makeEditorApi();
    global.window = { bbmDb: api };
    try {
      const editor = editorMod.createTableLayoutPrototypeEditor({ api: global.window.bbmDb });
      await editor.load();
      const text = collectText(editor.root);
      assert.equal(text.includes("PDF-Test mit Testdaten wird später separat ergänzt."), true);
      assert.equal(text.includes("Projekt"), false);
      assert.equal(text.includes("Besprechung"), false);
      assert.equal(findNodeByText(editor.root, "Gespeichertes Layout im PDF testen"), null);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });
}

module.exports = { runTableLayoutEditorPrototypeTests };

