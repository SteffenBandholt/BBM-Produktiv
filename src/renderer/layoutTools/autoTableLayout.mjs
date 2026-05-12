const DEFAULT_MODE_TOKEN = "preview";
const MANUAL_LAYOUT_CLASS_EXCLUDES = new Set([
  "topstable",
  "v2participantstable",
  "firmsstable",
  "firmscardstable",
]);

function _normalizeText(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function _normalizeModeToken(value) {
  const text = _normalizeText(value).toLowerCase();
  return text || DEFAULT_MODE_TOKEN;
}

function _normalizeSurfaceToken(value, fallback = "table") {
  const text = _normalizeText(value);
  if (!text) return fallback;
  const cleaned = text
    .replace(/[\s.-]+/g, "_")
    .replace(/[^\w]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || fallback;
}

function _pickClassToken(className) {
  const classes = _normalizeText(className)
    .split(/\s+/)
    .map((item) => _normalizeText(item))
    .filter(Boolean);
  for (const token of classes) {
    const lower = token.toLowerCase();
    if (MANUAL_LAYOUT_CLASS_EXCLUDES.has(lower)) continue;
    if (lower === "table" || lower === "row" || lower === "cell") continue;
    return token;
  }
  return "";
}

function _humanizeToken(value) {
  const text = _normalizeText(value);
  if (!text) return "";
  return text
    .replace(/[\s._-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
}

function _normalizeZoneKey(value, fallbackIndex) {
  const text = _normalizeText(value);
  const normalized = text
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s.-]+/g, "_")
    .replace(/[^\w]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return normalized || `col_${Number(fallbackIndex) + 1}`;
}

function _dedupeZoneKey(baseKey, seenKeys) {
  let key = baseKey;
  let counter = 2;
  while (seenKeys.has(key)) {
    key = `${baseKey}_${counter}`;
    counter += 1;
  }
  seenKeys.add(key);
  return key;
}

function isDevLayoutBuildChannel(value) {
  return _normalizeText(value).toUpperCase() === "DEV";
}

function isSimpleAutoLayoutTableCandidate({
  hasTheadTh = false,
  hasColgroupCol = false,
  hasNestedTable = false,
  hasManualMarkers = false,
  tableClassName = "",
} = {}) {
  if (hasNestedTable || hasManualMarkers) return false;
  if (!hasTheadTh && !hasColgroupCol) return false;

  const classText = _normalizeText(tableClassName).toLowerCase();
  if (!classText) return true;
  for (const token of MANUAL_LAYOUT_CLASS_EXCLUDES) {
    if (classText.includes(token)) return false;
  }
  if (classText.includes("card")) return false;
  return true;
}

function buildAutoLayoutSurfaceDescriptor({
  mode = DEFAULT_MODE_TOKEN,
  tableClassName = "",
  headerTexts = [],
  colClasses = [],
  columnCount = 0,
} = {}) {
  const modeToken = _normalizeModeToken(mode);
  const classToken = _pickClassToken(tableClassName) || "table";
  const surfaceKey = `print.${modeToken}.${_normalizeSurfaceToken(classToken, "table")}`;

  const zoneCount = Math.max(
    Number(columnCount) || 0,
    Array.isArray(headerTexts) ? headerTexts.length : 0,
    Array.isArray(colClasses) ? colClasses.length : 0
  );
  const zones = [];
  const seenKeys = new Set();
  for (let i = 0; i < zoneCount; i += 1) {
    const headerText = _normalizeText(headerTexts?.[i]);
    const colClassToken = _pickClassToken(colClasses?.[i]) || "";
    const label = headerText || _humanizeToken(colClassToken) || `Spalte ${i + 1}`;
    const key = _dedupeZoneKey(
      _normalizeZoneKey(headerText || colClassToken || `col_${i + 1}`, i),
      seenKeys
    );
    zones.push({
      key,
      label,
      index: i,
      source: headerText ? "th" : colClassToken ? "col" : "index",
    });
  }

  const firstZoneLabel = zones[0]?.label || "Tabelle";
  return {
    surfaceKey,
    surfaceLabel: _humanizeToken(classToken) || _humanizeToken(modeToken) || "Tabelle",
    tableClassToken: classToken,
    firstZoneLabel,
    zones,
  };
}

export {
  buildAutoLayoutSurfaceDescriptor,
  isDevLayoutBuildChannel,
  isSimpleAutoLayoutTableCandidate,
};
