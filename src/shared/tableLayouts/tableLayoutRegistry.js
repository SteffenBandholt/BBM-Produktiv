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

const TABLE_LAYOUT_DEFINITIONS = Object.freeze({
  protokoll_tops: Object.freeze({
    tableKey: "protokoll_tops",
    moduleId: "protokoll",
    label: "Protokoll TOP-Liste",
    loadStandardLayout: _loadProtokollTopsLayout,
  }),
});

function getTableLayoutDefinition(identity = {}) {
  const norm = _normalizeIdentity(identity);
  const definition = TABLE_LAYOUT_DEFINITIONS[norm.tableKey];
  if (!definition || definition.moduleId !== norm.moduleId) return null;
  return definition;
}

function listTableLayoutDefinitions() {
  return Object.values(TABLE_LAYOUT_DEFINITIONS).map((definition) => ({
    tableKey: definition.tableKey,
    moduleId: definition.moduleId,
    label: definition.label,
  }));
}

async function loadStandardTableLayout(identity = {}) {
  const definition = getTableLayoutDefinition(identity);
  if (!definition) return null;
  const layout = await definition.loadStandardLayout();
  return _cloneJson(layout);
}

module.exports = {
  getTableLayoutDefinition,
  listTableLayoutDefinitions,
  loadStandardTableLayout,
};
