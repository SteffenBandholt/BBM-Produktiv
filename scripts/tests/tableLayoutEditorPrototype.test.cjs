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
    tableDefinitions = [
      {
        moduleId: "protokoll",
        moduleLabel: "Protokoll",
        tableKey: "protokoll_tops",
        tableLabel: "TOP-Liste",
        description: "Pilotlayout",
        supportedOrientations: ["portrait", "landscape"],
        editFields: [
          { key: "uiNumberWidth", label: "UI TOP-Spalte" },
          { key: "uiTextTrack", label: "UI Text-Spalte" },
        ],
        defaultLayout: {
          tableKey: "protokoll_tops",
          variant: "portrait",
          labels: {
            top: "TOP",
            text: "Gegenstand",
            meta: ["Status", "Fertig bis", "verantw"],
          },
          ui: {
            rootVars: {
              "--bbm-tops-list-number-col": "64px",
              "--bbm-tops-list-text-col": "minmax(0, 1fr)",
              "--bbm-tops-list-meta-col": "74px",
            },
          },
          pdf: {
            columns: {
              number: { width: "23mm" },
              text: { width: "auto" },
              meta: { width: "15ch" },
            },
          },
        },
        previewData: [
          {
            topNumber: "1",
            shortText: "Beispielthema fuer die Vorschau",
            status: "offen",
            dueDate: "12.04.2026",
            responsible: "M. Muster",
            ampelSymbol: "gelb",
          },
          {
            topNumber: "1.1",
            shortText: "Langtext mit laengerer Beschreibung in einer Unterzeile",
            longText:
              "Dies ist ein laengerer Beispieltext, damit die Editor-Vorschau den Zeilenumbruch und die Innenanzeige testen kann.",
            status: "in Bearbeitung",
            dueDate: "",
            responsible: "S. Beispiel",
            ampelSymbol: "gruen",
          },
          {
            topNumber: "2",
            shortText: "Kurzer Eintrag mit knapper Anzeige",
            status: "erledigt",
            dueDate: "18.04.2026",
            responsible: "",
            ampelSymbol: "rot",
          },
        ],
      },
    ],
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
      const previewPanels = findNodesByTag(editor.root, "DIV").filter(
        (node) => node?.dataset?.previewMode === "ui" || node?.dataset?.previewMode === "pdf"
      );
      const previewUiToggle = findNodeByText(editor.root, "UI-Vorschau");
      const previewPdfToggle = findNodeByText(editor.root, "PDF-Vorschau");
      const host = createFakeNode("div");
      host.dataset.tableLayoutShell = "1";
      editor.attachFullscreenHost(host);
      const fullscreenToggle = findNodeByText(editor.root, "Normalgröße");
      assert.ok(fullscreenToggle, "fullscreen toggle missing");
      assert.ok(previewUiToggle, "UI preview toggle missing");
      assert.ok(previewPdfToggle, "PDF preview toggle missing");
      assert.equal(editor.root.dataset.layoutMode, "fullscreen");
      assert.equal(host.dataset.layoutMode, "fullscreen");
      assert.equal(host.style.position, "fixed");
      assert.equal(host.style.inset, "8px");
      assert.equal(calls.filter((item) => item.type === "getOne").length, 1);
      assert.deepEqual(calls.find((item) => item.type === "getOne")?.payload, {
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "portrait",
      });
      assert.equal(selects[0]?.value, "protokoll");
      assert.equal(selects[1]?.value, "protokoll_tops");
      assert.equal(selects[2]?.value, "portrait");
      assert.equal(selects[0]?.children?.length, 1);
      assert.equal(selects[0]?.children?.[0]?.value, "protokoll");
      assert.equal(selects[0]?.children?.[0]?.textContent, "Protokoll");
      assert.equal(selects[1]?.children?.length, 1);
      assert.equal(selects[1]?.children?.[0]?.value, "protokoll_tops");
      assert.equal(selects[1]?.children?.[0]?.textContent, "TOP-Liste");
      assert.equal(text.includes("Modul: Protokoll"), true);
      assert.equal(text.includes("Tabelle: TOP-Liste"), true);
      assert.equal(text.includes("tableKey: protokoll_tops"), true);
      assert.equal(text.includes("Orientierung: portrait"), true);
      assert.equal(text.includes("Quelle: Standardlayout protokoll_tops"), true);
      assert.equal(text.includes("UI-Vorschau mit Testdaten"), true);
      assert.equal(text.includes("PDF-Vorschau mit Testdaten"), false);
      assert.equal(text.includes("Registrierte Beispielzeilen aus der Tabellenregistry"), true);
      assert.equal(text.includes("Beispielthema fuer die Vorschau"), true);
      assert.equal(text.includes("Langtext mit laengerer Beschreibung in einer Unterzeile"), true);
      assert.equal(text.includes("Kurzer Eintrag mit knapper Anzeige"), true);
      assert.equal(text.includes("Keine Projekt- oder Besprechungsdaten."), true);
      assert.equal(text.includes("Diese Vorschau erzeugt kein PDF. Der echte PDF-Test mit Testdaten wird später separat ergänzt."), true);
      assert.equal(text.includes("PDF-Werte sind eine technische Näherung im Editor, kein echter PDF-Renderer."), false);
      assert.equal(text.includes("Spaltenbreite UI: 64px | minmax(0, 1fr) | 74px"), true);
      assert.equal(text.includes("Spaltenbreite PDF: 23mm | auto | 15ch"), false);
      assert.equal(previewPanels.length, 1);
      assert.equal(previewPanels[0]?.dataset?.previewMode, "ui");
      previewPdfToggle.click();
      await flushMicrotasks();
      const previewPanelsAfterSwitch = findNodesByTag(editor.root, "DIV").filter(
        (node) => node?.dataset?.previewMode === "ui" || node?.dataset?.previewMode === "pdf"
      );
      const switchedText = collectText(editor.root);
      assert.equal(previewPanelsAfterSwitch.length, 1);
      assert.equal(previewPanelsAfterSwitch[0]?.dataset?.previewMode, "pdf");
      assert.equal(switchedText.includes("UI-Vorschau mit Testdaten"), false);
      assert.equal(switchedText.includes("PDF-Vorschau mit Testdaten"), true);
      assert.equal(switchedText.includes("PDF-Werte sind eine technische Näherung im Editor, kein echter PDF-Renderer."), true);
      fullscreenToggle.click();
      await flushMicrotasks();
      assert.equal(editor.root.dataset.layoutMode, "normal");
      assert.equal(host.dataset.layoutMode, "normal");
      assert.equal(host.style.position, "");
      assert.equal(findNodeByText(editor.root, "Vollbild") != null, true);
      fullscreenToggle.click();
      await flushMicrotasks();
      assert.equal(editor.root.dataset.layoutMode, "fullscreen");
      assert.equal(host.dataset.layoutMode, "fullscreen");
      assert.equal(host.style.position, "fixed");
      assert.equal(host.style.inset, "8px");
      assert.equal(host.style.maxWidth, "none");
      assert.equal(findNodeByText(editor.root, "Normalgröße") != null, true);
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
      assert.equal(editor.root.dataset.layoutMode, "fullscreen");
      assert.equal(findNodeByText(editor.root, "Normalgröße") != null, true);
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
      assert.equal(selects[0].children[0].textContent, "Protokoll");
      assert.equal(selects[1].children[0].textContent, "TOP-Liste");
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
      const previewPdfToggle = findNodeByText(editor.root, "PDF-Vorschau");
      selects[2].value = "landscape";
      selects[2].dispatchEvent({ type: "change" });
      await flushMicrotasks();
      previewPdfToggle.click();
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
      const draftText = collectText(editor.root);
      assert.equal(draftText.includes("Spaltenbreite UI: 76px | minmax(0, 1.25fr) | 84px"), false);
      assert.equal(draftText.includes("Spaltenbreite PDF: 25mm | auto | 18ch"), true);
      assert.equal(draftText.includes("Gegenstand / Kurztext"), true);
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
      assert.equal(editor.root.dataset.tableKey, "");
      assert.equal(editor.root.dataset.moduleId, "");
      assert.equal(editor.root.dataset.orientation, "portrait");
      assert.equal(text.includes("tableKey: -"), true);
      assert.equal(text.includes("Modul: -"), true);
      assert.equal(text.includes("global"), false);
    } finally {
      global.document = previousDocument;
    }
  });

  await run("TableLayoutEditor: Editor-Vorschau nutzt registrierte Testdaten", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();
    const { api } = makeEditorApi();
    global.window = { bbmDb: api };
    try {
      const editor = editorMod.createTableLayoutPrototypeEditor({ api: global.window.bbmDb });
      await editor.load();
      const text = collectText(editor.root);
      const previewPanels = findNodesByTag(editor.root, "DIV").filter(
        (node) => node?.dataset?.previewMode === "ui" || node?.dataset?.previewMode === "pdf"
      );
      assert.equal(editor.root.dataset.layoutMode, "fullscreen");
      assert.equal(text.includes("UI-Vorschau mit Testdaten"), true);
      assert.equal(text.includes("PDF-Vorschau mit Testdaten"), false);
      assert.equal(findNodeByText(editor.root, "Projekt"), null);
      assert.equal(findNodeByText(editor.root, "Besprechung"), null);
      assert.equal(text.includes("Beispielthema fuer die Vorschau"), true);
      assert.equal(text.includes("Kurzer Eintrag mit knapper Anzeige"), true);
      assert.equal(previewPanels.length, 1);
      assert.equal(previewPanels[0]?.dataset?.previewMode, "ui");
      assert.equal(findNodeByText(editor.root, "Normalgröße") != null, true);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });
}

module.exports = { runTableLayoutEditorPrototypeTests };
