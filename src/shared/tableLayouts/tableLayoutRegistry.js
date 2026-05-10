const fs = require("node:fs");
const path = require("node:path");

let _protokollTopsLayoutPromise = null;

function _cloneJson(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function _normalizeText(value) {
  return String(value == null ? "" : value).trim();
}

function _normalizeTableKind(value) {
  const text = _normalizeText(value).toLowerCase();
  if (text === "control") return "control";
  return "content";
}

function _normalizeBool(value, fallback = false) {
  if (value === null || value === undefined) return !!fallback;
  if (typeof value === "boolean") return value;
  const text = _normalizeText(value).toLowerCase();
  if (!text) return !!fallback;
  if (["1", "true", "yes", "ja", "on"].includes(text)) return true;
  if (["0", "false", "no", "nein", "off"].includes(text)) return false;
  return !!fallback;
}

function _normalizeIdentity(identity = {}) {
  const tableKey = _normalizeText(identity.tableKey);
  const moduleId = _normalizeText(identity.moduleId);
  return { tableKey, moduleId };
}

async function _loadProtokollTopsLayout() {
  if (!_protokollTopsLayoutPromise) {
    const layoutPath = path.join(__dirname, "protokollTopsLayout.js");
    const source = fs.readFileSync(layoutPath, "utf8");
    const encodedSource = Buffer.from(source, "utf8").toString("base64");
    const dataUrl = `data:text/javascript;base64,${encodedSource}`;

    _protokollTopsLayoutPromise = import(dataUrl)
      .then((mod) => {
        if (typeof mod?.getProtokollTopsLayout === "function") {
          return mod.getProtokollTopsLayout();
        }
        return null;
      })
      .catch(() => null);
  }

  const layout = await _protokollTopsLayoutPromise;
  return _cloneJson(layout);
}

const PROTOKOLL_TOPS_PREVIEW_DATA = Object.freeze([
  Object.freeze({
    topNumber: "1",
    shortText: "Beispielthema fuer die Vorschau",
    meta: Object.freeze(["offen", "12.04.2026", "M. Muster"]),
    ampelSymbol: "gelb",
  }),
  Object.freeze({
    topNumber: "1.1",
    shortText: "Langtext mit laengerer Beschreibung in einer Unterzeile",
    longText:
      "Dies ist ein laengerer Beispieltext, damit die Editor-Vorschau den Zeilenumbruch und die Innenanzeige testen kann.",
    meta: Object.freeze(["in Bearbeitung", "", "S. Beispiel"]),
    ampelSymbol: "gruen",
  }),
  Object.freeze({
    topNumber: "2",
    shortText: "Kurzer Eintrag mit knapper Anzeige",
    meta: Object.freeze(["erledigt", "18.04.2026", ""]),
    ampelSymbol: "rot",
  }),
]);

const PROTOKOLL_TOPS_COLUMNS = Object.freeze([
  Object.freeze({
    key: "topNumber",
    label: "TOP",
    uiWidth: "64px",
    pdfWidth: "23mm",
    weight: 2,
    required: true,
    previewValue: "1",
    previewField: "topNumber",
    headerLines: Object.freeze(["TOP"]),
  }),
  Object.freeze({
    key: "shortText",
    label: "Gegenstand",
    uiWidth: "minmax(0, 1fr)",
    pdfWidth: "auto",
    weight: 6,
    required: true,
    previewValue: "Beispielthema fuer die Vorschau",
    previewField: "shortText",
    headerLines: Object.freeze(["Gegenstand"]),
  }),
  Object.freeze({
    key: "meta",
    label: "Status",
    uiWidth: "74px",
    pdfWidth: "15ch",
    weight: 1,
    required: true,
    previewValue: "offen",
    previewField: "meta",
    headerLines: Object.freeze(["Status", "Fertig bis", "verantw"]),
  }),
]);

const PROJECT_FIRMS_PREVIEW_DATA = Object.freeze([
  Object.freeze({
    shortName: "AB",
    role: "Rohbau",
    active: "ja",
  }),
  Object.freeze({
    shortName: "ME",
    role: "Elektro mit langem Gewerktext",
    active: "nein",
  }),
  Object.freeze({
    shortName: "HK",
    role: "HLS",
    active: "ja",
  }),
]);

const PROJECT_FIRMS_COLUMNS = Object.freeze([
  Object.freeze({
    key: "shortName",
    label: "Kurzbez.",
    uiWidth: "160px",
    pdfWidth: "23mm",
    weight: 2,
    required: true,
    previewValue: "AB",
    previewField: "shortName",
    headerLines: Object.freeze(["Kurzbez."]),
  }),
  Object.freeze({
    key: "role",
    label: "Funktion/Gewerk",
    uiWidth: "1fr",
    pdfWidth: "auto",
    weight: 6,
    required: true,
    previewValue: "Rohbau",
    previewField: "role",
    headerLines: Object.freeze(["Funktion/Gewerk"]),
  }),
  Object.freeze({
    key: "active",
    label: "Aktiv",
    uiWidth: "70px",
    pdfWidth: "15mm",
    weight: 1,
    required: true,
    previewValue: "ja",
    previewField: "active",
    headerLines: Object.freeze(["Aktiv"]),
  }),
]);

const PROTOKOLL_PARTICIPANTS_PREVIEW_DATA = Object.freeze([
  Object.freeze({
    name: "Max Muster",
    function: "Bauleiter",
    company: "Musterbau GmbH",
    contact: Object.freeze(["0123 456789", "max@muster.de"]),
    attendance: Object.freeze(["anwesend", "verteiler"]),
  }),
  Object.freeze({
    name: "Erika Beispiel",
    function: "Projektleitung",
    company: "Beispiel AG",
    contact: Object.freeze(["0456 123456", "erika@beispiel.de"]),
    attendance: Object.freeze(["abwesend", "verteiler"]),
  }),
  Object.freeze({
    name: "Tim Test",
    function: "Architekt",
    company: "Planwerk GmbH",
    contact: Object.freeze(["030 555555", "tim@planwerk.de"]),
    attendance: Object.freeze(["anwesend", "verteiler"]),
  }),
]);

const PROTOKOLL_PARTICIPANTS_COLUMNS = Object.freeze([
  Object.freeze({
    key: "name",
    label: "Name",
    uiWidth: "2fr",
    pdfWidth: "36mm",
    weight: 2,
    required: true,
    previewValue: "Max Muster",
    previewField: "name",
    headerLines: Object.freeze(["Name"]),
  }),
  Object.freeze({
    key: "function",
    label: "Funktion",
    uiWidth: "2fr",
    pdfWidth: "36mm",
    weight: 2,
    required: true,
    previewValue: "Bauleiter",
    previewField: "function",
    headerLines: Object.freeze(["Funktion"]),
  }),
  Object.freeze({
    key: "company",
    label: "Firma",
    uiWidth: "1.5fr",
    pdfWidth: "30mm",
    weight: 1,
    required: true,
    previewValue: "Musterbau GmbH",
    previewField: "company",
    headerLines: Object.freeze(["Firma"]),
  }),
  Object.freeze({
    key: "contact",
    label: "Telefon / E-Mail",
    uiWidth: "2.2fr",
    pdfWidth: "45mm",
    weight: 2,
    required: true,
    previewValue: "0123 456789 / max@muster.de",
    previewField: "contact",
    headerLines: Object.freeze(["Telefon / E-Mail"]),
  }),
  Object.freeze({
    key: "attendance",
    label: "Anwesend / Verteiler",
    uiWidth: "110px",
    pdfWidth: "26mm",
    weight: 1,
    required: true,
    previewValue: "anwesend / verteiler",
    previewField: "attendance",
    headerLines: Object.freeze(["Anwesend / Verteiler"]),
  }),
]);

const PROTOKOLL_PARTICIPANTS_DEFAULT_LAYOUT = Object.freeze({
  tableKey: "protokoll_participants",
  moduleId: "protokoll",
  variant: "portrait",
  columns: PROTOKOLL_PARTICIPANTS_COLUMNS,
});

async function _loadProtokollParticipantsLayout() {
  return _cloneJson(PROTOKOLL_PARTICIPANTS_DEFAULT_LAYOUT);
}

const PROJECT_FIRMS_DEFAULT_LAYOUT = Object.freeze({
  tableKey: "project_firms",
  moduleId: "projektverwaltung",
  variant: "portrait",
  columns: PROJECT_FIRMS_COLUMNS,
});

async function _loadProjectFirmsLayout() {
  return _cloneJson(PROJECT_FIRMS_DEFAULT_LAYOUT);
}

const TABLE_LAYOUT_MODULES = Object.freeze([
  Object.freeze({
    moduleId: "protokoll",
    moduleLabel: "Protokoll",
    description: "Protokoll-Layouts fuer interne Tabelleneditoren und Druckpfade.",
    supportedOrientations: Object.freeze(["portrait", "landscape"]),
    tables: Object.freeze([
      Object.freeze({
        tableKey: "protokoll_tops",
        tableLabel: "TOP-Liste",
        description: "Pilotlayout fuer die Protokoll-TOP-Liste.",
        tableKind: "content",
        editorEnabled: true,
        uiAvailable: true,
        pdfAvailable: true,
        uiProductive: true,
        pdfProductive: true,
        supportedOrientations: Object.freeze(["portrait", "landscape"]),
        columns: PROTOKOLL_TOPS_COLUMNS,
        editFields: Object.freeze([
          Object.freeze({
            key: "uiNumberWidth",
            label: "UI TOP-Spalte",
            path: "ui.rootVars.--bbm-tops-list-number-col",
            type: "gridTrack",
            required: true,
          }),
          Object.freeze({
            key: "uiTextTrack",
            label: "UI Text-Spalte",
            path: "ui.rootVars.--bbm-tops-list-text-col",
            type: "gridTrack",
            required: true,
          }),
          Object.freeze({
            key: "uiMetaWidth",
            label: "UI Meta-Spalte",
            path: "ui.rootVars.--bbm-tops-list-meta-col",
            type: "gridTrack",
            required: true,
          }),
          Object.freeze({
            key: "uiMetaInset",
            label: "UI Meta-Innenabstand",
            path: "ui.rootVars.--bbm-tops-list-meta-padding-inline",
            type: "gridTrack",
            required: true,
          }),
          Object.freeze({
            key: "pdfNumberWidth",
            label: "PDF TOP-Spalte",
            path: "pdf.columns.number.width",
            type: "gridTrack",
            required: true,
          }),
          Object.freeze({
            key: "pdfTextWidth",
            label: "PDF Text-Spalte",
            path: "pdf.columns.text.width",
            type: "gridTrack",
            required: true,
          }),
          Object.freeze({
            key: "pdfMetaWidth",
            label: "PDF Meta-Spalte",
            path: "pdf.columns.meta.width",
            type: "gridTrack",
            required: true,
          }),
          Object.freeze({
            key: "labelTop",
            label: "Überschrift TOP",
            path: "labels.top",
            type: "headingText",
            required: true,
          }),
          Object.freeze({
            key: "labelText",
            label: "Überschrift Text",
            path: "labels.text",
            type: "headingText",
            required: true,
          }),
          Object.freeze({
            key: "labelMeta1",
            label: "Überschrift Meta 1",
            path: "labels.meta[0]",
            type: "headingText",
            required: true,
          }),
          Object.freeze({
            key: "labelMeta2",
            label: "Überschrift Meta 2",
            path: "labels.meta[1]",
            type: "headingText",
            required: true,
          }),
          Object.freeze({
            key: "labelMeta3",
            label: "Überschrift Meta 3",
            path: "labels.meta[2]",
            type: "headingText",
            required: true,
          }),
        ]),
        previewData: PROTOKOLL_TOPS_PREVIEW_DATA,
        defaultLayoutLoader: _loadProtokollTopsLayout,
      }),
      Object.freeze({
        tableKey: "protokoll_participants",
        tableLabel: "Teilnehmerliste",
        description: "Teilnehmerliste im Protokollkontext.",
        tableKind: "content",
        editorEnabled: true,
        uiAvailable: true,
        pdfAvailable: true,
        uiProductive: false,
        pdfProductive: false,
        supportedOrientations: Object.freeze(["portrait", "landscape"]),
        columns: PROTOKOLL_PARTICIPANTS_COLUMNS,
        previewData: PROTOKOLL_PARTICIPANTS_PREVIEW_DATA,
        defaultLayoutLoader: _loadProtokollParticipantsLayout,
      }),
    ]),
  }),
  Object.freeze({
    moduleId: "projektverwaltung",
    moduleLabel: "Projektverwaltung",
    description: "Projektbezogene Verwaltungs-Layouts fuer den Tabellenlayout-Editor.",
    supportedOrientations: Object.freeze(["portrait", "landscape"]),
    tables: Object.freeze([
      Object.freeze({
        tableKey: "project_firms",
        tableLabel: "Projekt-Firmenliste",
        description: "Projektbezogene Firmenliste fuer den naechsten Firmenlayout-Pilot.",
        tableKind: "content",
        editorEnabled: true,
        uiAvailable: true,
        pdfAvailable: true,
        uiProductive: true,
        pdfProductive: false,
        supportedOrientations: Object.freeze(["portrait", "landscape"]),
        columns: PROJECT_FIRMS_COLUMNS,
        previewData: PROJECT_FIRMS_PREVIEW_DATA,
        defaultLayoutLoader: _loadProjectFirmsLayout,
      }),
    ]),
  }),
]);

function _cloneModuleTableDefinition(moduleDef, tableDef, defaultLayout = null) {
  return {
    moduleId: moduleDef.moduleId,
    moduleLabel: moduleDef.moduleLabel,
    moduleDescription: moduleDef.description || "",
    moduleSupportedOrientations: Array.isArray(moduleDef.supportedOrientations)
      ? [...moduleDef.supportedOrientations]
      : ["portrait"],
    tableKey: tableDef.tableKey,
    tableLabel: tableDef.tableLabel,
    description: tableDef.description || "",
    tableKind: _normalizeTableKind(tableDef.tableKind),
    editorEnabled: _normalizeBool(tableDef.editorEnabled, true),
    uiAvailable: _normalizeBool(tableDef.uiAvailable, true),
    pdfAvailable: _normalizeBool(tableDef.pdfAvailable, true),
    uiProductive: _normalizeBool(tableDef.uiProductive, true),
    pdfProductive: _normalizeBool(tableDef.pdfProductive, false),
    supportedOrientations: Array.isArray(tableDef.supportedOrientations)
      ? [...tableDef.supportedOrientations]
      : ["portrait"],
    columns: Array.isArray(tableDef.columns)
      ? tableDef.columns.map((column) => ({
          ...column,
          headerLines: Array.isArray(column.headerLines) ? [...column.headerLines] : [],
        }))
      : [],
    editFields: Array.isArray(tableDef.editFields)
      ? tableDef.editFields.map((field) => ({ ...field }))
      : [],
    previewData: Array.isArray(tableDef.previewData)
      ? tableDef.previewData.map((row) => _cloneJson(row))
      : [],
    defaultLayout: _cloneJson(defaultLayout),
  };
}

function _findModuleDefinition(moduleId) {
  const normModuleId = _normalizeText(moduleId);
  return TABLE_LAYOUT_MODULES.find((moduleDef) => _normalizeText(moduleDef.moduleId) === normModuleId) || null;
}

function _findTableDefinition(identity = {}) {
  const norm = _normalizeIdentity(identity);
  const moduleDef = _findModuleDefinition(norm.moduleId);
  if (!moduleDef) return null;
  return (
    moduleDef.tables.find((tableDef) => _normalizeText(tableDef.tableKey) === norm.tableKey) || null
  );
}

function getTableLayoutModuleDefinition(moduleId) {
  const moduleDef = _findModuleDefinition(moduleId);
  if (!moduleDef) return null;
  return {
    moduleId: moduleDef.moduleId,
    moduleLabel: moduleDef.moduleLabel,
    description: moduleDef.description || "",
    supportedOrientations: Array.isArray(moduleDef.supportedOrientations)
      ? [...moduleDef.supportedOrientations]
      : ["portrait"],
    tables: moduleDef.tables.map((tableDef) => ({
      tableKey: tableDef.tableKey,
      tableLabel: tableDef.tableLabel,
      description: tableDef.description || "",
      tableKind: _normalizeTableKind(tableDef.tableKind),
      editorEnabled: _normalizeBool(tableDef.editorEnabled, true),
      uiAvailable: _normalizeBool(tableDef.uiAvailable, true),
      pdfAvailable: _normalizeBool(tableDef.pdfAvailable, true),
      uiProductive: _normalizeBool(tableDef.uiProductive, true),
      pdfProductive: _normalizeBool(tableDef.pdfProductive, false),
      supportedOrientations: Array.isArray(tableDef.supportedOrientations)
        ? [...tableDef.supportedOrientations]
        : ["portrait"],
      columns: Array.isArray(tableDef.columns)
        ? tableDef.columns.map((column) => ({
            ...column,
            headerLines: Array.isArray(column.headerLines) ? [...column.headerLines] : [],
          }))
        : [],
      editFields: Array.isArray(tableDef.editFields)
        ? tableDef.editFields.map((field) => ({ ...field }))
        : [],
      previewData: Array.isArray(tableDef.previewData)
        ? tableDef.previewData.map((row) => _cloneJson(row))
        : [],
    })),
  };
}

function getTableLayoutDefinition(identity = {}) {
  const norm = _normalizeIdentity(identity);
  const moduleDef = _findModuleDefinition(norm.moduleId);
  if (!moduleDef) return null;
  const tableDef = moduleDef.tables.find((item) => _normalizeText(item.tableKey) === norm.tableKey) || null;
  if (!tableDef) return null;
  return {
    moduleId: moduleDef.moduleId,
    moduleLabel: moduleDef.moduleLabel,
    moduleDescription: moduleDef.description || "",
    moduleSupportedOrientations: Array.isArray(moduleDef.supportedOrientations)
      ? [...moduleDef.supportedOrientations]
      : ["portrait"],
    tableKey: tableDef.tableKey,
    tableLabel: tableDef.tableLabel,
    description: tableDef.description || "",
    tableKind: _normalizeTableKind(tableDef.tableKind),
    editorEnabled: _normalizeBool(tableDef.editorEnabled, true),
    uiAvailable: _normalizeBool(tableDef.uiAvailable, true),
    pdfAvailable: _normalizeBool(tableDef.pdfAvailable, true),
    uiProductive: _normalizeBool(tableDef.uiProductive, true),
    pdfProductive: _normalizeBool(tableDef.pdfProductive, false),
    supportedOrientations: Array.isArray(tableDef.supportedOrientations)
      ? [...tableDef.supportedOrientations]
      : ["portrait"],
    columns: Array.isArray(tableDef.columns)
      ? tableDef.columns.map((column) => ({
          ...column,
          headerLines: Array.isArray(column.headerLines) ? [...column.headerLines] : [],
        }))
      : [],
    editFields: Array.isArray(tableDef.editFields)
      ? tableDef.editFields.map((field) => ({ ...field }))
      : [],
    previewData: Array.isArray(tableDef.previewData)
      ? tableDef.previewData.map((row) => _cloneJson(row))
      : [],
    loadStandardLayout: tableDef.defaultLayoutLoader || null,
  };
}

async function listTableLayoutDefinitions() {
  const out = [];
  for (const moduleDef of TABLE_LAYOUT_MODULES) {
    for (const tableDef of moduleDef.tables) {
      let defaultLayout = null;
      try {
        if (typeof tableDef.defaultLayoutLoader === "function") {
          defaultLayout = await tableDef.defaultLayoutLoader();
        } else if (tableDef.defaultLayout) {
          defaultLayout = tableDef.defaultLayout;
        }
      } catch (_err) {
        defaultLayout = null;
      }
      out.push(_cloneModuleTableDefinition(moduleDef, tableDef, defaultLayout));
    }
  }
  return out;
}

function listTableLayoutModules() {
  return TABLE_LAYOUT_MODULES.map((moduleDef) => getTableLayoutModuleDefinition(moduleDef.moduleId));
}

async function loadStandardTableLayout(identity = {}) {
  const definition = getTableLayoutDefinition(identity);
  if (!definition) return null;
  const layout =
    typeof definition.loadStandardLayout === "function"
      ? await definition.loadStandardLayout()
      : null;
  return _cloneJson(layout);
}

module.exports = {
  listTableLayoutModules,
  getTableLayoutDefinition,
  listTableLayoutDefinitions,
  loadStandardTableLayout,
  getTableLayoutModuleDefinition,
};
