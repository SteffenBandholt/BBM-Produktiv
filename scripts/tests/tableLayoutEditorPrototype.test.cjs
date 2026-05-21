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

function findPreviewPanels(root) {
  return findNodesByTag(root, "DIV").filter(
    (node) => node?.dataset?.previewArea === "ui" || node?.dataset?.previewArea === "pdf"
  );
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
        tableKind: "content",
        editorEnabled: true,
        uiAvailable: true,
        pdfAvailable: true,
        uiProductive: true,
        pdfProductive: true,
        supportedOrientations: ["portrait", "landscape"],
        columns: [
          {
            key: "topNumber",
            label: "TOP",
            uiWidth: "64px",
            pdfWidth: "23mm",
            weight: 2,
            required: true,
            previewValue: "1",
            headerLines: ["TOP"],
          },
          {
            key: "shortText",
            label: "Gegenstand",
            uiWidth: "minmax(0, 1fr)",
            pdfWidth: "auto",
            weight: 6,
            required: true,
            previewValue: "Beispielthema fuer die Vorschau",
            headerLines: ["Gegenstand"],
          },
          {
            key: "meta",
            label: "Status",
            uiWidth: "74px",
            pdfWidth: "15ch",
            weight: 1,
            required: true,
            previewValue: "offen",
            headerLines: ["Status", "Fertig bis", "verantw"],
          },
        ],
        defaultLayout: {
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          variant: "portrait",
          columns: [
            {
              key: "topNumber",
              label: "TOP",
              uiWidth: "64px",
              pdfWidth: "23mm",
              weight: 2,
              required: true,
              previewValue: "1",
              headerLines: ["TOP"],
            },
            {
              key: "shortText",
              label: "Gegenstand",
              uiWidth: "minmax(0, 1fr)",
              pdfWidth: "auto",
              weight: 6,
              required: true,
              previewValue: "Beispielthema fuer die Vorschau",
              headerLines: ["Gegenstand"],
            },
            {
              key: "meta",
              label: "Status",
              uiWidth: "74px",
              pdfWidth: "15ch",
              weight: 1,
              required: true,
              previewValue: "offen",
              headerLines: ["Status", "Fertig bis", "verantw"],
            },
          ],
        },
        previewData: [
          {
            topNumber: "1",
            shortText: "Beispielthema fuer die Vorschau",
            meta: ["offen", "12.04.2026", "M. Muster"],
            ampelSymbol: "gelb",
          },
          {
            topNumber: "1.1",
            shortText: "Langtext mit laengerer Beschreibung in einer Unterzeile",
            longText:
              "Dies ist ein laengerer Beispieltext, damit die Editor-Vorschau den Zeilenumbruch und die Innenanzeige testen kann.",
            meta: ["in Bearbeitung", "", "S. Beispiel"],
            ampelSymbol: "gruen",
          },
          {
            topNumber: "2",
            shortText: "Kurzer Eintrag mit knapper Anzeige",
            meta: ["erledigt", "18.04.2026", ""],
            ampelSymbol: "rot",
          },
        ],
      },
      {
        moduleId: "protokoll",
        moduleLabel: "Protokoll",
        tableKey: "protokoll_participants",
        tableLabel: "Teilnehmerliste",
        description: "Teilnehmerliste im Protokollkontext",
        tableKind: "content",
        editorEnabled: true,
        uiAvailable: true,
        pdfAvailable: true,
        uiProductive: false,
        pdfProductive: false,
        supportedOrientations: ["portrait", "landscape"],
        columns: [
          {
            key: "name",
            label: "Name",
            uiWidth: "2fr",
            pdfWidth: "36mm",
            weight: 2,
            required: true,
            previewValue: "Max Muster",
            headerLines: ["Name"],
          },
          {
            key: "function",
            label: "Funktion",
            uiWidth: "2fr",
            pdfWidth: "36mm",
            weight: 2,
            required: true,
            previewValue: "Bauleiter",
            headerLines: ["Funktion"],
          },
          {
            key: "company",
            label: "Firma",
            uiWidth: "1.5fr",
            pdfWidth: "30mm",
            weight: 1,
            required: true,
            previewValue: "Musterbau GmbH",
            headerLines: ["Firma"],
          },
          {
            key: "contact",
            label: "Telefon / E-Mail",
            uiWidth: "2.2fr",
            pdfWidth: "45mm",
            weight: 2,
            required: true,
            previewValue: "0123 456789 / max@muster.de",
            headerLines: ["Telefon / E-Mail"],
          },
          {
            key: "attendance",
            label: "Anwesend / Verteiler",
            uiWidth: "110px",
            pdfWidth: "26mm",
            weight: 1,
            required: true,
            previewValue: "anwesend / verteiler",
            headerLines: ["Anwesend / Verteiler"],
          },
        ],
        defaultLayout: {
          tableKey: "protokoll_participants",
          moduleId: "protokoll",
          variant: "portrait",
          columns: [
            {
              key: "name",
              label: "Name",
              uiWidth: "2fr",
              pdfWidth: "36mm",
              weight: 2,
              required: true,
              previewValue: "Max Muster",
              headerLines: ["Name"],
            },
            {
              key: "function",
              label: "Funktion",
              uiWidth: "2fr",
              pdfWidth: "36mm",
              weight: 2,
              required: true,
              previewValue: "Bauleiter",
              headerLines: ["Funktion"],
            },
            {
              key: "company",
              label: "Firma",
              uiWidth: "1.5fr",
              pdfWidth: "30mm",
              weight: 1,
              required: true,
              previewValue: "Musterbau GmbH",
              headerLines: ["Firma"],
            },
            {
              key: "contact",
              label: "Telefon / E-Mail",
              uiWidth: "2.2fr",
              pdfWidth: "45mm",
              weight: 2,
              required: true,
              previewValue: "0123 456789 / max@muster.de",
              headerLines: ["Telefon / E-Mail"],
            },
            {
              key: "attendance",
              label: "Anwesend / Verteiler",
              uiWidth: "110px",
              pdfWidth: "26mm",
              weight: 1,
              required: true,
              previewValue: "anwesend / verteiler",
              headerLines: ["Anwesend / Verteiler"],
            },
          ],
        },
        previewData: [
          {
            name: "Max Muster",
            function: "Bauleiter",
            company: "Musterbau GmbH",
            contact: ["0123 456789", "max@muster.de"],
            attendance: ["anwesend", "verteiler"],
          },
          {
            name: "Erika Beispiel",
            function: "Projektleitung",
            company: "Beispiel AG",
            contact: ["0456 123456", "erika@beispiel.de"],
            attendance: ["abwesend", "verteiler"],
          },
          {
            name: "Tim Test",
            function: "Architekt",
            company: "Planwerk GmbH",
            contact: ["030 555555", "tim@planwerk.de"],
            attendance: ["anwesend", "verteiler"],
          },
        ],
      },
      {
        moduleId: "projektverwaltung",
        moduleLabel: "Projektverwaltung",
        tableKey: "project_firms",
        tableLabel: "Projekt-Firmenliste",
        description: "Projektbezogene Firmenliste",
        tableKind: "content",
        editorEnabled: true,
        uiAvailable: true,
        pdfAvailable: true,
        uiProductive: true,
        pdfProductive: false,
        supportedOrientations: ["portrait", "landscape"],
        columns: [
          {
            key: "shortName",
            label: "Kurzbez.",
            uiWidth: "160px",
            pdfWidth: "23mm",
            weight: 2,
            required: true,
            previewValue: "AB",
            headerLines: ["Kurzbez."],
          },
          {
            key: "role",
            label: "Funktion/Gewerk",
            uiWidth: "1fr",
            pdfWidth: "auto",
            weight: 6,
            required: true,
            previewValue: "Rohbau",
            headerLines: ["Funktion/Gewerk"],
          },
          {
            key: "active",
            label: "Aktiv",
            uiWidth: "70px",
            pdfWidth: "15mm",
            weight: 1,
            required: true,
            previewValue: "ja",
            headerLines: ["Aktiv"],
          },
        ],
        defaultLayout: {
          tableKey: "project_firms",
          moduleId: "projektverwaltung",
          variant: "portrait",
          columns: [
            {
              key: "shortName",
              label: "Kurzbez.",
              uiWidth: "160px",
              pdfWidth: "23mm",
              weight: 2,
              required: true,
              previewValue: "AB",
              headerLines: ["Kurzbez."],
            },
            {
              key: "role",
              label: "Funktion/Gewerk",
              uiWidth: "1fr",
              pdfWidth: "auto",
              weight: 6,
              required: true,
              previewValue: "Rohbau",
              headerLines: ["Funktion/Gewerk"],
            },
            {
              key: "active",
              label: "Aktiv",
              uiWidth: "70px",
              pdfWidth: "15mm",
              weight: 1,
              required: true,
              previewValue: "ja",
              headerLines: ["Aktiv"],
            },
          ],
        },
        previewData: [
          { shortName: "AB", role: "Rohbau", active: "ja" },
          { shortName: "ME", role: "Elektro mit langem Gewerktext", active: "nein" },
          { shortName: "HK", role: "HLS", active: "ja" },
        ],
      },
    ],
    getOne = async (payload) => {
      const tableDef = Array.isArray(tableDefinitions)
        ? tableDefinitions.find(
            (item) =>
              String(item?.tableKey || "").trim() === String(payload?.tableKey || "").trim() &&
              String(item?.moduleId || "").trim() === String(payload?.moduleId || "").trim()
          )
        : null;
      const effectiveLayout =
        tableDef?.tableKey === "protokoll_tops"
          ? editorMod.buildProtokollTopsLayoutOverlay({}, payload.orientation)
          : tableDef?.defaultLayout
            ? {
                ...JSON.parse(JSON.stringify(tableDef.defaultLayout)),
                variant:
                  String(payload?.orientation || tableDef.defaultLayout.variant || "portrait").trim().toLowerCase() ===
                  "landscape"
                    ? "landscape"
                    : "portrait",
              }
            : {
                variant: String(payload?.orientation || "portrait").trim().toLowerCase() === "landscape" ? "landscape" : "portrait",
                columns: Array.isArray(tableDef?.columns) ? JSON.parse(JSON.stringify(tableDef.columns)) : [],
              };
      return {
        ok: true,
        data: {
          source: "default",
          schemaVersion: 1,
          effectiveLayout,
        },
      };
    },
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

  await run("TableLayoutEditor: gespeicherte Layoutdaten koennen die Registry-Struktur nicht uebersteuern", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();
    const { api } = makeEditorApi({
      getOne: async (payload) => ({
        ok: true,
        data: {
          source: "stored",
          schemaVersion: 1,
          effectiveLayout: {
            variant: payload.orientation,
            columns: [
              {
                key: "topNumber",
                label: "GESPEICHERTES TOP",
                uiWidth: "91px",
                pdfWidth: "33mm",
                weight: 999,
                required: false,
                previewValue: "gespeichert",
                previewField: "storedTop",
                headerLines: ["GESPEICHERTES HEADER"],
              },
              {
                key: "shortText",
                label: "GESPEICHERTER TEXT",
                uiWidth: "minmax(0, 2fr)",
                pdfWidth: "44mm",
                weight: 888,
                required: false,
                previewValue: "gespeichert",
                previewField: "storedText",
                headerLines: ["GESPEICHERTER TEXTKOPF"],
              },
              {
                key: "meta",
                label: "GESPEICHERTE META",
                uiWidth: "88px",
                pdfWidth: "22mm",
                weight: 777,
                required: false,
                previewValue: "gespeichert",
                previewField: "storedMeta",
                headerLines: ["GESPEICHERTE META"],
              },
              {
                key: "legacy_extra",
                label: "ALTE ZUSATZSPALTE",
                uiWidth: "123px",
                pdfWidth: "45mm",
                weight: 1,
                required: false,
                previewValue: "alt",
                previewField: "legacy_extra",
                headerLines: ["ALTE ZUSATZSPALTE"],
              },
            ],
          },
        },
      }),
    });
    global.window = { bbmDb: api };
    try {
      const editor = editorMod.createTableLayoutPrototypeEditor({ api: global.window.bbmDb });
      await editor.load();
      const text = collectText(editor.root);
      const previewPanels = findPreviewPanels(editor.root);
      const uiPanel = previewPanels.find((node) => node?.dataset?.previewArea === "ui");
      const pdfPanel = previewPanels.find((node) => node?.dataset?.previewArea === "pdf");
      const uiSurface = uiPanel?.children?.[4];
      const pdfSurface = pdfPanel?.children?.[4];
      assert.equal(previewPanels.length, 2);
      assert.equal(text.includes("GESPEICHERTES TOP"), false);
      assert.equal(text.includes("GESPEICHERTES TEXT"), false);
      assert.equal(text.includes("GESPEICHERTE META"), false);
      assert.equal(text.includes("ALTE ZUSATZSPALTE"), false);
      assert.equal(text.includes("TOP"), true);
      assert.equal(text.includes("Gegenstand"), true);
      assert.equal(text.includes("Status"), true);
      assert.equal(uiSurface?.dataset?.previewGridColumns, "91px minmax(0, 2fr) 88px");
      assert.equal(pdfSurface?.dataset?.previewGridColumns, "33mm 44mm 22mm");
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
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
        const previewPanels = findPreviewPanels(editor.root);
        const uiPreviewPanel = previewPanels.find((node) => node?.dataset?.previewArea === "ui");
        const pdfPreviewPanel = previewPanels.find((node) => node?.dataset?.previewArea === "pdf");
        const host = createFakeNode("div");
        host.dataset.tableLayoutShell = "1";
        editor.attachFullscreenHost(host);
        const fullscreenToggle = findNodeByText(editor.root, "Normalgröße");
        assert.ok(fullscreenToggle, "fullscreen toggle missing");
        assert.ok(uiPreviewPanel, "UI preview panel missing");
        assert.ok(pdfPreviewPanel, "PDF preview panel missing");
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
      assert.equal(selects[0]?.children?.length, 2);
      assert.equal(selects[0]?.children?.[0]?.value, "protokoll");
      assert.equal(selects[0]?.children?.[0]?.textContent, "Protokoll");
      assert.equal(selects[0]?.children?.[1]?.value, "projektverwaltung");
      assert.equal(selects[0]?.children?.[1]?.textContent, "Projektverwaltung");
      assert.equal(selects[1]?.children?.length, 2);
      assert.equal(selects[1]?.children?.[0]?.value, "protokoll_tops");
      assert.equal(selects[1]?.children?.[0]?.textContent, "TOP-Liste");
      assert.equal(selects[1]?.children?.[1]?.value, "protokoll_participants");
      assert.equal(selects[1]?.children?.[1]?.textContent, "Teilnehmerliste");
      assert.equal(text.includes("Modul: Protokoll"), true);
      assert.equal(text.includes("Projektverwaltung"), true);
      assert.equal(text.includes("Tabelle: TOP-Liste"), true);
      assert.equal(text.includes("tableKey: protokoll_tops"), true);
      assert.equal(text.includes("Orientierung: portrait"), true);
      assert.equal(text.includes("Quelle: Standardlayout protokoll_tops"), true);
      assert.equal(text.includes("Spiegelansicht"), true);
      assert.equal(text.includes("UI-Ansicht"), true);
      assert.equal(text.includes("PDF-Ansicht"), true);
      assert.equal(text.includes("Für diese Tabelle gibt es keine UI-Ansicht."), false);
      assert.equal(text.includes("Für diese Tabelle gibt es keine PDF-Ansicht."), false);
      assert.equal(text.includes("Testdaten: 3 Zeilen"), true);
      assert.equal(text.includes("Beispielthema fuer die Vorschau"), true);
      assert.equal(text.includes("Langtext mit laengerer Beschreibung in einer Unterzeile"), true);
      assert.equal(text.includes("Kurzer Eintrag mit knapper Anzeige"), true);
      assert.equal(
        text.includes("Die Vorschau zeigt links bzw. oben die UI-Ansicht und daneben bzw. darunter die PDF-Ansicht."),
        true
      );
      assert.equal(text.includes("Die UI-Spiegelansicht nutzt die aktuellen sichtbaren Spalten aus der Registry."), true);
      assert.equal(text.includes("Die PDF-Spiegelansicht nutzt die aktuellen Spalten aus der Registry."), true);
      assert.equal(text.includes("Die PDF-Fläche ist eine interne A4-Nähe für die Registry-Spiegelung."), true);
      assert.equal(text.includes("Tabelle speichern"), true);
      assert.equal(text.includes("Diese Tabelle auf Standard zurücksetzen"), true);
      assert.equal(text.includes("Gespeichert wird nur die aktuell gewählte Tabelle; kein globales Layout."), true);
      assert.equal(
        text.includes("Reset betrifft nur die aktuell gewählte Kombination aus Modul, Tabelle und Orientierung."),
        true
      );
      assert.equal(text.includes("Bereich: UI"), true);
      assert.equal(text.includes("Bereich: PDF"), true);
      assert.equal(text.includes("Spalten: 3"), true);
      assert.equal(previewPanels.length, 2);
      assert.equal(uiPreviewPanel?.dataset?.previewArea, "ui");
      assert.equal(pdfPreviewPanel?.dataset?.previewArea, "pdf");
      assert.equal(uiPreviewPanel?.children?.[4]?.dataset?.previewGridColumns != null, true);
        editor.applyValues({
          columns: [
            {
              key: "topNumber",
              label: "TOP",
              uiWidth: "64px",
              pdfWidth: "23mm",
              weight: 2,
              required: true,
              previewValue: "1",
              headerLines: ["TOP"],
            },
            {
              key: "shortText",
              label: "Gegenstand",
              uiWidth: "minmax(0, 1fr)",
              pdfWidth: "auto",
              weight: 6,
              required: true,
              previewValue: "Beispielthema fuer die Vorschau",
              headerLines: ["Gegenstand"],
            },
            {
              key: "meta",
              label: "Status",
              uiWidth: "74px",
              pdfWidth: "15ch",
              weight: 1,
              required: true,
              previewValue: "offen",
              headerLines: ["Status", "Fertig bis", "verantw"],
            },
            {
              key: "legacy_extra",
              label: "Alte Zusatzspalte",
              uiWidth: "90px",
              pdfWidth: "20mm",
              weight: 1,
              required: false,
              previewValue: "Alt",
              headerLines: ["Alte Zusatzspalte"],
            },
          ],
        });
        const mirroredText = collectText(editor.root);
        assert.equal(mirroredText.includes("Alte Zusatzspalte"), false);
        assert.equal(uiPreviewPanel?.children?.[4]?.dataset?.previewGridColumns?.includes("90px"), false);
      selects[1].value = "protokoll_participants";
      selects[1].dispatchEvent({ type: "change" });
      await flushMicrotasks();
      const participantText = collectText(editor.root);
      const participantPanels = findPreviewPanels(editor.root);
      const participantUiPanel = participantPanels.find((node) => node?.dataset?.previewArea === "ui");
      const participantPdfPanel = participantPanels.find((node) => node?.dataset?.previewArea === "pdf");
      assert.equal(selects[1].value, "protokoll_participants");
      assert.equal(participantText.includes("Tabelle: Teilnehmerliste"), true);
      assert.equal(participantText.includes("tableKey: protokoll_participants"), true);
      assert.equal(participantText.includes("UI-Ansicht"), true);
      assert.equal(participantText.includes("PDF-Ansicht"), true);
      assert.equal(participantText.includes("Spalten: 5"), true);
      assert.equal(participantText.includes("Telefon / E-Mail"), true);
      assert.equal(participantText.includes("Anwesend / Verteiler"), true);
      assert.equal(participantText.includes("Aktion"), false);
      assert.equal(participantText.includes("Invited"), false);
      assert.equal(participantText.includes("Aktiv"), false);
      assert.equal(participantPanels.length, 2);
      assert.equal(participantUiPanel?.dataset?.previewArea, "ui");
      assert.equal(participantPdfPanel?.dataset?.previewArea, "pdf");
      assert.equal(participantText.includes("Für diese Tabelle gibt es keine UI-Ansicht."), false);
      assert.equal(participantText.includes("Für diese Tabelle gibt es keine PDF-Ansicht."), false);
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

  await run("TableLayoutEditor: Bedienlisten mit editorEnabled=false erscheinen nicht", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();
    const { api } = makeEditorApi();
    const controlTableDefinition = {
      moduleId: "protokoll",
      moduleLabel: "Protokoll",
      tableKey: "protokoll_internal_controls",
      tableLabel: "Interne Bedienliste",
      description: "Bedienliste",
      tableKind: "control",
      editorEnabled: false,
      uiAvailable: true,
      pdfAvailable: false,
      uiProductive: false,
      pdfProductive: false,
      supportedOrientations: ["portrait", "landscape"],
      columns: [
        {
          key: "status",
          label: "Status",
          uiWidth: "1fr",
          pdfWidth: "1fr",
          weight: 1,
          required: true,
          previewValue: "OK",
          headerLines: ["Status"],
        },
      ],
      defaultLayout: {
        tableKey: "protokoll_internal_controls",
        moduleId: "protokoll",
        variant: "portrait",
        columns: [],
      },
      previewData: [],
    };
    const originalListDefinitions = api.tableLayoutsListDefinitions;
    api.tableLayoutsListDefinitions = async () => {
      const res = await originalListDefinitions();
      if (!res?.ok) return res;
      return { ok: true, data: [...res.data, controlTableDefinition] };
    };
    global.window = { bbmDb: api };
    try {
      const editor = editorMod.createTableLayoutPrototypeEditor({ api: global.window.bbmDb });
      await editor.load();
      const selects = findNodesByTag(editor.root, "SELECT");
      const text = collectText(editor.root);
      assert.equal(selects[0]?.children?.length, 2);
      assert.equal(selects[1]?.children?.length, 2);
      assert.equal(selects[1]?.children?.[0]?.value, "protokoll_tops");
      assert.equal(selects[1]?.children?.[1]?.value, "protokoll_participants");
      assert.equal(text.includes("Teilnehmerliste"), true);
      assert.equal(text.includes("Interne Bedienliste"), false);
      assert.equal(text.includes("protokoll_internal_controls"), false);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("TableLayoutEditor: control surface mit editorEnabled=true erscheint", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();
    const { api } = makeEditorApi();
    const controlTableDefinition = {
      moduleId: "restarbeiten",
      moduleLabel: "Restarbeiten",
      tableKey: "restarbeiten_filter_meta",
      tableLabel: "Filterleiste Meta",
      description: "Meta-Filterleiste",
      tableKind: "control",
      editorEnabled: true,
      uiAvailable: true,
      pdfAvailable: false,
      uiProductive: true,
      pdfProductive: false,
      supportedOrientations: ["portrait", "landscape"],
      columns: [],
      editFields: [
        {
          key: "metaDueWidth",
          label: "Fertig bis",
          path: "ui.rootVars.--bbm-restarbeiten-meta-due-width",
          type: "gridTrack",
          required: true,
        },
      ],
      defaultLayout: {
        tableKey: "restarbeiten_filter_meta",
        moduleId: "restarbeiten",
        variant: "portrait",
        ui: { rootVars: { "--bbm-restarbeiten-meta-due-width": "minmax(0, 1fr)" } },
      },
      previewData: [],
    };
    const originalListDefinitions = api.tableLayoutsListDefinitions;
    api.tableLayoutsListDefinitions = async () => {
      const res = await originalListDefinitions();
      if (!res?.ok) return res;
      return { ok: true, data: [...res.data, controlTableDefinition] };
    };
    global.window = { bbmDb: api };
    try {
      const editor = editorMod.createTableLayoutPrototypeEditor({ api: global.window.bbmDb });
      await editor.load();
      const selects = findNodesByTag(editor.root, "SELECT");
      const text = collectText(editor.root);
      assert.equal(selects[0]?.children?.length, 2);
      assert.equal(selects[1]?.children?.length, 2);
      selects[0].value = "restarbeiten";
      selects[0].dispatchEvent({ type: "change" });
      await flushMicrotasks();
      const refreshedText = collectText(editor.root);
      const refreshedSelects = findNodesByTag(editor.root, "SELECT");
      assert.equal(refreshedSelects[1]?.children?.length, 1);
      assert.equal(refreshedText.includes("Filterleiste Meta"), true);
      assert.equal(refreshedText.includes("restarbeiten_filter_meta"), true);
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

  await run("TableLayoutEditor: project_firms zeigt UI- und PDF-Hinweise", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();
    const { api } = makeEditorApi();
    global.window = { bbmDb: api };
    try {
      const editor = editorMod.createTableLayoutPrototypeEditor({ api: global.window.bbmDb });
      await editor.load();
      const selects = findNodesByTag(editor.root, "SELECT");
      selects[0].value = "projektverwaltung";
      selects[0].dispatchEvent({ type: "change" });
      await flushMicrotasks();

      const text = collectText(editor.root);
      const previewPanels = findPreviewPanels(editor.root);
      assert.equal(selects[0].value, "projektverwaltung");
      assert.equal(selects[1].value, "project_firms");
      assert.equal(text.includes("Tabelle: Projekt-Firmenliste"), true);
      assert.equal(text.includes("tableKey: project_firms"), true);
      assert.equal(text.includes("UI-Breiten wirken auf die Projekt-Firmenliste."), true);
      assert.equal(
        text.includes("PDF ist für diese Tabelle aktuell nur Vorschau. Ein produktiver PDF-Druck ist noch nicht angeschlossen."),
        true
      );
      assert.equal(text.includes("produktiver PDF-Druck ist noch nicht angeschlossen"), true);
      assert.equal(text.includes("Tabelle speichern"), true);
      assert.equal(text.includes("Diese Tabelle auf Standard zurücksetzen"), true);
      assert.equal(text.includes("Gespeichert wird nur die aktuell gewählte Tabelle; kein globales Layout."), true);
      assert.equal(
        text.includes("Reset betrifft nur die aktuell gewählte Kombination aus Modul, Tabelle und Orientierung."),
        true
      );
      assert.equal(text.includes("UI-Ansicht"), true);
      assert.equal(text.includes("PDF-Ansicht"), true);
      assert.equal(previewPanels.length, 2);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("TableLayoutEditor: uiAvailable=false zeigt Hinweis", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();
    const { api } = makeEditorApi();
    const originalListDefinitions = api.tableLayoutsListDefinitions;
    api.tableLayoutsListDefinitions = async () => {
      const res = await originalListDefinitions();
      if (!res?.ok) return res;
      return {
        ok: true,
        data: res.data.map((def) =>
          def.tableKey === "protokoll_participants" ? { ...def, uiAvailable: false } : def
        ),
      };
    };
    global.window = { bbmDb: api };
    try {
      const editor = editorMod.createTableLayoutPrototypeEditor({ api: global.window.bbmDb });
      await editor.load();
      const selects = findNodesByTag(editor.root, "SELECT");
      selects[1].value = "protokoll_participants";
      selects[1].dispatchEvent({ type: "change" });
      await flushMicrotasks();
      const text = collectText(editor.root);
      assert.equal(text.includes("Für diese Tabelle gibt es keine UI-Ansicht."), true);
      assert.equal(text.includes("Für diese Tabelle gibt es keine PDF-Ansicht."), false);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("TableLayoutEditor: pdfAvailable=false zeigt Hinweis", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();
    const { api } = makeEditorApi();
    const originalListDefinitions = api.tableLayoutsListDefinitions;
    api.tableLayoutsListDefinitions = async () => {
      const res = await originalListDefinitions();
      if (!res?.ok) return res;
      return {
        ok: true,
        data: res.data.map((def) => (def.tableKey === "project_firms" ? { ...def, pdfAvailable: false } : def)),
      };
    };
    global.window = { bbmDb: api };
    try {
      const editor = editorMod.createTableLayoutPrototypeEditor({ api: global.window.bbmDb });
      await editor.load();
      const selects = findNodesByTag(editor.root, "SELECT");
      selects[0].value = "projektverwaltung";
      selects[0].dispatchEvent({ type: "change" });
      await flushMicrotasks();
      const text = collectText(editor.root);
      assert.equal(text.includes("Für diese Tabelle gibt es keine PDF-Ansicht."), true);
      assert.equal(text.includes("Für diese Tabelle gibt es keine UI-Ansicht."), false);
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
      const draftText = collectText(editor.root);
      assert.equal(draftText.includes("Bereich: UI"), true);
      assert.equal(draftText.includes("Bereich: PDF"), true);
      assert.equal(draftText.includes("Spalten: 3"), true);
      assert.equal(draftText.includes("Testdaten: 3 Zeilen"), true);
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
      assert.equal(saveCall.payload.layout.labels.text, "Gegenstand");
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

  await run("TableLayoutEditor: ungultige Layoutwerte blockieren Speichern und Reset bleibt moeglich", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocument();
    const { api, calls } = makeEditorApi();
    global.window = { bbmDb: api };
    try {
      const editor = editorMod.createTableLayoutPrototypeEditor({ api: global.window.bbmDb });
      await editor.load();
      editor.applyValues({
        uiNumberWidth: "url(javascript:alert(1))",
        uiTextTrack: "calc(1fr)",
        uiMetaWidth: "74px",
        pdfNumberWidth: "23mm",
        pdfTextWidth: "auto",
        pdfMetaWidth: "15ch",
        labelTop: "",
        labelText: "Gegenstand",
        labelMeta1: "Status",
        labelMeta2: "Fertig bis",
        labelMeta3: "verantw",
      });
      const draftText = collectText(editor.root);
      assert.equal(draftText.includes("Ungültiger Spaltenwert"), true);
      assert.equal(draftText.includes("Überschrift darf nicht leer sein"), false);
      const saveRes = await editor.save();
      assert.equal(saveRes.ok, false);
      assert.equal(calls.filter((item) => item.type === "save").length, 0);

      const resetRes = await editor.reset();
      assert.equal(resetRes.ok, true);
      assert.equal(calls.filter((item) => item.type === "reset").length, 1);
      const afterResetText = collectText(editor.root);
      assert.equal(afterResetText.includes("Ungültiger Spaltenwert"), false);
      assert.equal(afterResetText.includes("Überschrift darf nicht leer sein"), false);
      assert.equal(afterResetText.includes("Bereich: UI"), true);
      assert.equal(afterResetText.includes("Spalten: 3"), true);
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
      const previewPanels = findPreviewPanels(editor.root);
      assert.equal(editor.root.dataset.layoutMode, "fullscreen");
      assert.equal(text.includes("Spiegelansicht"), true);
      assert.equal(text.includes("UI-Ansicht"), true);
      assert.equal(text.includes("PDF-Ansicht"), true);
      assert.equal(findNodeByText(editor.root, "Projekt"), null);
      assert.equal(findNodeByText(editor.root, "Besprechung"), null);
      assert.equal(text.includes("Beispielthema fuer die Vorschau"), true);
      assert.equal(text.includes("Kurzer Eintrag mit knapper Anzeige"), true);
      assert.equal(previewPanels.length, 2);
      assert.equal(previewPanels[0]?.dataset?.previewArea === "ui" || previewPanels[1]?.dataset?.previewArea === "ui", true);
      assert.equal(previewPanels[0]?.dataset?.previewArea === "pdf" || previewPanels[1]?.dataset?.previewArea === "pdf", true);
      assert.equal(findNodeByText(editor.root, "Normalgröße") != null, true);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });
}

module.exports = { runTableLayoutEditorPrototypeTests };
