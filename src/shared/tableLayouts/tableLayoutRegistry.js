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
        supportedOrientations: Object.freeze(["portrait", "landscape"]),
        editFields: Object.freeze([
          Object.freeze({ key: "uiNumberWidth", label: "UI TOP-Spalte" }),
          Object.freeze({ key: "uiTextTrack", label: "UI Text-Spalte" }),
          Object.freeze({ key: "uiMetaWidth", label: "UI Meta-Spalte" }),
          Object.freeze({ key: "pdfNumberWidth", label: "PDF TOP-Spalte" }),
          Object.freeze({ key: "pdfTextWidth", label: "PDF Text-Spalte" }),
          Object.freeze({ key: "pdfMetaWidth", label: "PDF Meta-Spalte" }),
          Object.freeze({ key: "labelTop", label: "Ueberschrift TOP" }),
          Object.freeze({ key: "labelText", label: "Ueberschrift Text" }),
          Object.freeze({ key: "labelMeta1", label: "Ueberschrift Meta 1" }),
          Object.freeze({ key: "labelMeta2", label: "Ueberschrift Meta 2" }),
          Object.freeze({ key: "labelMeta3", label: "Ueberschrift Meta 3" }),
        ]),
        defaultLayoutLoader: _loadProtokollTopsLayout,
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
    supportedOrientations: Array.isArray(tableDef.supportedOrientations)
      ? [...tableDef.supportedOrientations]
      : ["portrait"],
    editFields: Array.isArray(tableDef.editFields)
      ? tableDef.editFields.map((field) => ({ ...field }))
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
      supportedOrientations: Array.isArray(tableDef.supportedOrientations)
        ? [...tableDef.supportedOrientations]
        : ["portrait"],
      editFields: Array.isArray(tableDef.editFields)
        ? tableDef.editFields.map((field) => ({ ...field }))
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
    supportedOrientations: Array.isArray(tableDef.supportedOrientations)
      ? [...tableDef.supportedOrientations]
      : ["portrait"],
    editFields: Array.isArray(tableDef.editFields)
      ? tableDef.editFields.map((field) => ({ ...field }))
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
