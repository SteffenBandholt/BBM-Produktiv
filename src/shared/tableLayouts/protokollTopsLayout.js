const PROTOKOLL_TOPS_EDITOR_DEFAULTS = Object.freeze({
  orientation: "portrait",
  uiNumberWidth: "64px",
  uiNumberInset: "5px",
  uiNumberFontSize: "11px",
  uiTextTrack: "minmax(0, 1fr)",
  uiTextInset: "5px",
  uiTextFontSize: "11px",
  uiMetaWidth: "74px",
  uiMetaInset: "4px",
  uiMetaFontSize: "11px",
  pdfNumberWidth: "23mm",
  pdfTextWidth: "auto",
  pdfMetaWidth: "15ch",
  pdfNumberInset: "1mm",
  pdfNumberFontSize: "8.5pt",
  pdfTextPaddingLeft: "0mm",
  pdfTextPaddingRight: "1.5mm",
  pdfTextFontSize: "9pt",
  pdfMetaInset: "5mm",
  pdfMetaFontSize: "6.5pt",
  labelTop: "TOP",
  labelText: "Gegenstand",
  labelMeta1: "Status",
  labelMeta2: "Fertig bis",
  labelMeta3: "verantw",
});

export const PROTOKOLL_TOPS_EDIT_FIELDS = Object.freeze([
  Object.freeze({ key: "uiNumberWidth", label: "UI TOP-Spalte", path: "ui.rootVars.--bbm-tops-list-number-col", type: "gridTrack", required: true }),
  Object.freeze({ key: "uiNumberInset", label: "UI TOP-Innenabstand", path: "ui.rootVars.--bbm-tops-list-number-padding-inline", type: "gridTrack", required: true }),
  Object.freeze({ key: "uiNumberFontSize", label: "UI TOP-Schrift", path: "ui.rootVars.--bbm-tops-list-number-font-size", type: "gridTrack", required: true }),
  Object.freeze({ key: "uiTextTrack", label: "UI Text-Spalte", path: "ui.rootVars.--bbm-tops-list-text-col", type: "gridTrack", required: true }),
  Object.freeze({ key: "uiTextInset", label: "UI Text-Innenabstand", path: "ui.rootVars.--bbm-tops-list-text-padding-inline", type: "gridTrack", required: true }),
  Object.freeze({ key: "uiTextFontSize", label: "UI Text-Schrift", path: "ui.rootVars.--bbm-tops-list-text-font-size", type: "gridTrack", required: true }),
  Object.freeze({ key: "uiMetaWidth", label: "UI Meta-Spalte", path: "ui.rootVars.--bbm-tops-list-meta-col", type: "gridTrack", required: true }),
  Object.freeze({ key: "uiMetaInset", label: "UI Meta-Innenabstand", path: "ui.rootVars.--bbm-tops-list-meta-padding-inline", type: "gridTrack", required: true }),
  Object.freeze({ key: "uiMetaFontSize", label: "UI Meta-Schrift", path: "ui.rootVars.--bbm-tops-list-meta-font-size", type: "gridTrack", required: true }),
  Object.freeze({ key: "pdfNumberWidth", label: "PDF TOP-Spalte", path: "pdf.columns.number.width", type: "gridTrack", required: true }),
  Object.freeze({ key: "pdfTextWidth", label: "PDF Text-Spalte", path: "pdf.columns.text.width", type: "gridTrack", required: true }),
  Object.freeze({ key: "pdfMetaWidth", label: "PDF Meta-Spalte", path: "pdf.columns.meta.width", type: "gridTrack", required: true }),
  Object.freeze({ key: "labelTop", label: "Überschrift TOP", path: "labels.top", type: "headingText", required: true }),
  Object.freeze({ key: "labelText", label: "Überschrift Text", path: "labels.text", type: "headingText", required: true }),
  Object.freeze({ key: "labelMeta1", label: "Überschrift Meta 1", path: "labels.meta[0]", type: "headingText", required: true }),
  Object.freeze({ key: "labelMeta2", label: "Überschrift Meta 2", path: "labels.meta[1]", type: "headingText", required: true }),
  Object.freeze({ key: "labelMeta3", label: "Überschrift Meta 3", path: "labels.meta[2]", type: "headingText", required: true }),
]);

export const PROTOKOLL_TOPS_COLUMNS = Object.freeze([
  Object.freeze({
    key: "topNumber",
    label: "TOP",
    uiWidth: PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiNumberWidth,
    pdfWidth: PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfNumberWidth,
    weight: 2,
    required: true,
    previewValue: "1",
    previewField: "topNumber",
    headerLines: Object.freeze(["TOP"]),
  }),
  Object.freeze({
    key: "shortText",
    label: "Gegenstand",
    uiWidth: PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiTextTrack,
    pdfWidth: PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextWidth,
    weight: 6,
    required: true,
    previewValue: "Beispielthema fuer die Vorschau",
    previewField: "shortText",
    headerLines: Object.freeze(["Gegenstand"]),
  }),
  Object.freeze({
    key: "meta",
    label: "Status",
    uiWidth: PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiMetaWidth,
    pdfWidth: PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfMetaWidth,
    weight: 1,
    required: true,
    previewValue: "offen",
    previewField: "meta",
    headerLines: Object.freeze(["Status", "Fertig bis", "verantw"]),
  }),
]);

const PROTOKOLL_TOPS_LAYOUT = Object.freeze({
  tableKey: "protokoll_tops",
  moduleId: "protokoll",
  variant: "portrait",
  columns: PROTOKOLL_TOPS_COLUMNS,
  labels: Object.freeze({
    top: "TOP",
    text: "Gegenstand",
    meta: Object.freeze(["Status", "Fertig bis", "verantw"]),
  }),
  logicalFields: Object.freeze([
    Object.freeze({
      key: "topNumber",
      label: "TOP",
      uiState: "visible",
      pdfState: "visible",
      source: "ui number column / pdf number column",
      note: "top number stays the first logical field",
    }),
    Object.freeze({
      key: "shortText",
      label: "Gegenstand / Kurztext",
      uiState: "visible",
      pdfState: "visible",
      source: "ui title / pdf short text",
      note: "main text column stays the central content column",
    }),
    Object.freeze({
      key: "longText",
      label: "Langtext",
      uiState: "inline",
      pdfState: "inline",
      source: "ui preview text / pdf longText block",
      note: "no own column; rendered inside the text column when present",
    }),
    Object.freeze({
      key: "status",
      label: "Status",
      uiState: "meta",
      pdfState: "meta",
      source: "ui meta block / pdf meta cell",
      note: "first meta line in both renderers",
    }),
    Object.freeze({
      key: "dueDate",
      label: "Fertig bis",
      uiState: "meta",
      pdfState: "meta",
      source: "ui meta block / pdf meta cell",
      note: "second meta line in both renderers",
    }),
    Object.freeze({
      key: "responsible",
      label: "Verantwortlich",
      uiState: "meta",
      pdfState: "meta",
      source: "ui meta block / pdf meta cell",
      note: "third meta line in both renderers",
    }),
    Object.freeze({
      key: "ampelSymbol",
      label: "Ampel/Symbol",
      uiState: "meta",
      pdfState: "meta",
      source: "ui symbol slot / pdf dot",
      note: "symbol slot stays inside the meta column",
    }),
  ]),
  notes: Object.freeze([
    "Pilot table for the first central layout definition.",
    "UI and PDF keep the current portrait widths and labels.",
    "Long text stays in the text area and is not a separate column.",
    "No editor UI, database, header, footer, or second PDF logic here.",
  ]),
  ui: Object.freeze({
    rootVars: Object.freeze({
      "--bbm-tops-list-number-col": "64px",
      "--bbm-tops-list-number-padding-inline": "5px",
      "--bbm-tops-list-number-font-size": "11px",
      "--bbm-tops-list-text-col": "minmax(0, 1fr)",
      "--bbm-tops-list-text-padding-inline": "5px",
      "--bbm-tops-list-text-font-size": "11px",
      "--bbm-tops-list-meta-col": "74px",
      "--bbm-tops-list-meta-padding-inline": "4px",
      "--bbm-tops-list-meta-font-size": "11px",
    }),
    gridTemplateColumns:
      "var(--bbm-tops-list-number-col, 64px) var(--bbm-tops-list-text-col, minmax(0, 1fr)) minmax(50px, var(--bbm-tops-list-meta-col, 74px))",
  }),
  pdf: Object.freeze({
    rootVars: Object.freeze({
      "--bbm-top-col-nr-width": "23mm",
      "--bbm-top-col-nr-padding-left": "1mm",
      "--bbm-top-col-nr-font-size": "8.5pt",
      "--bbm-top-col-text-padding-left": "0",
      "--bbm-top-col-text-padding-right": "1.5mm",
      "--bbm-top-col-text-font-size": "9pt",
      "--bbm-top-col-meta-width": "15ch",
      "--bbm-top-col-meta-padding-left": "5mm",
      "--bbm-top-col-meta-font-size": "6.5pt",
      "--bbm-top-col-meta-head-font-size": "8pt",
    }),
    columns: Object.freeze({
      number: Object.freeze({
        key: "top",
        className: "colNr",
        width: "23mm",
        source: "src/renderer/print/print.css .topsTable .colNr",
      }),
      text: Object.freeze({
        key: "text",
        className: "colText",
        width: "auto",
        source: "src/renderer/print/print.css .topsTable .colText",
      }),
      meta: Object.freeze({
        key: "meta",
        className: "colMeta",
        width: "15ch",
        source: "src/renderer/print/print.css .topsTable .colMeta",
      }),
    }),
  }),
});

const GRID_TRACK_ALLOWED_EXACT = new Set(["auto", "1fr"]);

function _normalizeOrientation(value) {
  return String(value == null ? "" : value).trim().toLowerCase() === "landscape" ? "landscape" : "portrait";
}

function _normalizeText(value) {
  return String(value == null ? "" : value).replace(/[\r\n]+/g, " ").trim();
}

function _isDangerousLayoutText(text) {
  return /[;{}<>]/.test(text) || /\b(?:url|expression|var|calc)\s*\(/i.test(text);
}

function _isAllowedGridTrack(text) {
  if (!text || _isDangerousLayoutText(text)) return false;
  if (GRID_TRACK_ALLOWED_EXACT.has(text)) return true;
  if (/^\d+(?:\.\d+)?(?:px|mm|ch)$/.test(text)) return true;
  if (/^\d+(?:\.\d+)?fr$/.test(text)) return true;
  if (/^minmax\(\s*0\s*,\s*\d+(?:\.\d+)?fr\s*\)$/.test(text)) return true;
  if (/^minmax\(\s*\d+(?:\.\d+)?(?:px|mm|ch)\s*,\s*\d+(?:\.\d+)?(?:px|mm|ch|fr)\s*\)$/.test(text)) return true;
  return false;
}

function _isAllowedHeadingText(text) {
  if (!text || _isDangerousLayoutText(text)) return false;
  return text.length <= 64;
}

function _normalizeWeight(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return Number(fallback) > 0 ? Number(fallback) : 1;
  return Math.max(1, Math.floor(n));
}

function _normalizeColumnLines(value, fallback = []) {
  if (Array.isArray(value)) {
    const lines = value.map((entry) => _normalizeText(entry));
    return lines.length ? lines : [""];
  }
  if (typeof value === "string") {
    const lines = value
      .replace(/\r/g, "")
      .split("\n")
      .map((entry) => _normalizeText(entry));
    return lines.length ? lines : [""];
  }
  if (Array.isArray(fallback)) {
    return fallback.map((entry) => _normalizeText(entry));
  }
  return [""];
}

export function normalizeTableLayoutColumns(columns = [], fallbackColumns = []) {
  const input = Array.isArray(columns) ? columns : [];
  const fallback = Array.isArray(fallbackColumns) ? fallbackColumns : [];
  const byKey = new Map(input.filter((item) => item && typeof item === "object" && item.key).map((item) => [String(item.key), item]));
  const normalized = [];
  const seen = new Set();

  const addColumn = (src, fb, key) => {
    const from = src && typeof src === "object" ? src : {};
    const fallbackColumn = fb && typeof fb === "object" ? fb : {};
    const normalizedKey = _normalizeText(from.key || fallbackColumn.key || key);
    if (!normalizedKey || seen.has(normalizedKey)) return;
    seen.add(normalizedKey);
    const label = _normalizeText(from.label ?? fallbackColumn.label ?? normalizedKey);
    const uiWidth = _normalizeText(from.uiWidth ?? fallbackColumn.uiWidth ?? "1fr");
    const pdfWidth = _normalizeText(from.pdfWidth ?? fallbackColumn.pdfWidth ?? "auto");
    const headerLines = _normalizeColumnLines(from.headerLines, fallbackColumn.headerLines || [label]);
    normalized.push(
      Object.freeze({
        key: normalizedKey,
        label,
        uiWidth,
        pdfWidth,
        weight: _normalizeWeight(from.weight ?? fallbackColumn.weight ?? 1, 1),
        required: from.required != null ? !!from.required : !!fallbackColumn.required,
        previewValue: _normalizeText(from.previewValue ?? fallbackColumn.previewValue ?? ""),
        previewField: _normalizeText(from.previewField || fallbackColumn.previewField || normalizedKey),
        headerLines: Object.freeze(headerLines),
      })
    );
  };

  for (let i = 0; i < fallback.length; i += 1) {
    const fb = fallback[i];
    if (!fb || typeof fb !== "object") continue;
    addColumn(byKey.get(String(fb.key || "")) || input[i], fb, fb.key || `col_${i}`);
  }

  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const key = _normalizeText(item.key);
    if (!key || seen.has(key)) continue;
    addColumn(item, {}, key);
  }

  return normalized;
}

export function validateTableLayoutColumns(columns = [], fallbackColumns = []) {
  const normalized = normalizeTableLayoutColumns(columns, fallbackColumns);
  const errors = {};
  const values = normalized.map((column) => ({ ...column, headerLines: [...(column.headerLines || [])] }));
  for (const column of values) {
    if (!_isAllowedGridTrack(String(column.uiWidth || "").trim())) {
      errors[`${column.key}.uiWidth`] = "Ungültiger Spaltenwert";
    }
    if (!_isAllowedGridTrack(String(column.pdfWidth || "").trim())) {
      errors[`${column.key}.pdfWidth`] = "Ungültiger Spaltenwert";
    }
    if (!_isAllowedHeadingText(String(column.label || "").trim())) {
      errors[`${column.key}.label`] = String(column.label || "").trim() ? "Ungültige Überschrift" : "Überschrift darf nicht leer sein";
    }
    const lines = Array.isArray(column.headerLines) ? column.headerLines : [];
    for (let i = 0; i < lines.length; i += 1) {
      const line = String(lines[i] || "").trim();
      if (!line) {
        errors[`${column.key}.headerLines.${i}`] = "Überschrift darf nicht leer sein";
      } else if (!_isAllowedHeadingText(line)) {
        errors[`${column.key}.headerLines.${i}`] = "Ungültige Überschrift";
      }
    }
  }
  return { columns: values, errors, isValid: Object.keys(errors).length === 0 };
}

export function buildTableLayoutOverlayFromColumns(columns = [], orientation = "portrait", extras = {}) {
  const normalizedColumns = normalizeTableLayoutColumns(columns, extras.fallbackColumns || []);
  return {
    variant: _normalizeOrientation(orientation),
    columns: normalizedColumns,
    ...(extras.layoutExtras ? JSON.parse(JSON.stringify(extras.layoutExtras)) : {}),
  };
}

function _legacyToProtokollColumns(layout = {}) {
  const uiRootVars = layout?.ui?.rootVars || {};
  const pdfColumns = layout?.pdf?.columns || {};
  const labels = layout?.labels || {};
  const metaLabels = Array.isArray(labels.meta) ? labels.meta : [];
  return normalizeTableLayoutColumns(
    [
      {
        ...PROTOKOLL_TOPS_COLUMNS[0],
        uiWidth: uiRootVars["--bbm-tops-list-number-col"] || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiNumberWidth,
        pdfWidth: pdfColumns.number?.width || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfNumberWidth,
        label: labels.top || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelTop,
        headerLines: [labels.top || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelTop],
      },
      {
        ...PROTOKOLL_TOPS_COLUMNS[1],
        uiWidth: uiRootVars["--bbm-tops-list-text-col"] || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiTextTrack,
        pdfWidth: pdfColumns.text?.width || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextWidth,
        label: labels.text || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelText,
        headerLines: [labels.text || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelText],
      },
      {
        ...PROTOKOLL_TOPS_COLUMNS[2],
        uiWidth: uiRootVars["--bbm-tops-list-meta-col"] || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiMetaWidth,
        pdfWidth: pdfColumns.meta?.width || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfMetaWidth,
        label: metaLabels[0] || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelMeta1,
        headerLines: [
          metaLabels[0] || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelMeta1,
          metaLabels[1] || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelMeta2,
          metaLabels[2] || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelMeta3,
        ],
      },
    ],
    PROTOKOLL_TOPS_COLUMNS
  );
}

export function buildProtokollTopsColumnsFromLegacy(layout = {}) {
  return _legacyToProtokollColumns(layout);
}

function _extractValues(layout = {}) {
  const columns = Array.isArray(layout?.columns) && layout.columns.length ? layout.columns : _legacyToProtokollColumns(layout);
  const topCol = columns[0] || PROTOKOLL_TOPS_COLUMNS[0];
  const textCol = columns[1] || PROTOKOLL_TOPS_COLUMNS[1];
  const metaCol = columns[2] || PROTOKOLL_TOPS_COLUMNS[2];
  const metaLabels = Array.isArray(metaCol.headerLines) ? metaCol.headerLines : [metaCol.label];
  return {
    orientation: _normalizeOrientation(layout?.variant || layout?.orientation || PROTOKOLL_TOPS_EDITOR_DEFAULTS.orientation),
    uiNumberWidth: _normalizeText(topCol.uiWidth) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiNumberWidth,
    uiNumberInset: _normalizeText(layout?.ui?.rootVars?.["--bbm-tops-list-number-padding-inline"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiNumberInset,
    uiNumberFontSize: _normalizeText(layout?.ui?.rootVars?.["--bbm-tops-list-number-font-size"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiNumberFontSize,
    uiTextTrack: _normalizeText(textCol.uiWidth) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiTextTrack,
    uiTextInset: _normalizeText(layout?.ui?.rootVars?.["--bbm-tops-list-text-padding-inline"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiTextInset,
    uiTextFontSize: _normalizeText(layout?.ui?.rootVars?.["--bbm-tops-list-text-font-size"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiTextFontSize,
    uiMetaWidth: _normalizeText(metaCol.uiWidth) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiMetaWidth,
    uiMetaInset: _normalizeText(layout?.ui?.rootVars?.["--bbm-tops-list-meta-padding-inline"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiMetaInset,
    uiMetaFontSize: _normalizeText(layout?.ui?.rootVars?.["--bbm-tops-list-meta-font-size"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiMetaFontSize,
    pdfNumberWidth: _normalizeText(topCol.pdfWidth) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfNumberWidth,
    pdfTextWidth: _normalizeText(textCol.pdfWidth) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextWidth,
    pdfMetaWidth: _normalizeText(metaCol.pdfWidth) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfMetaWidth,
    pdfNumberInset:
      _normalizeText(layout?.pdf?.rootVars?.["--bbm-top-col-nr-padding-left"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfNumberInset,
    pdfNumberFontSize:
      _normalizeText(layout?.pdf?.rootVars?.["--bbm-top-col-nr-font-size"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfNumberFontSize,
    pdfTextPaddingLeft:
      _normalizeText(layout?.pdf?.rootVars?.["--bbm-top-col-text-padding-left"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextPaddingLeft,
    pdfTextPaddingRight:
      _normalizeText(layout?.pdf?.rootVars?.["--bbm-top-col-text-padding-right"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextPaddingRight,
    pdfTextFontSize:
      _normalizeText(layout?.pdf?.rootVars?.["--bbm-top-col-text-font-size"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextFontSize,
    pdfMetaInset:
      _normalizeText(layout?.pdf?.rootVars?.["--bbm-top-col-meta-padding-left"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfMetaInset,
    pdfMetaFontSize:
      _normalizeText(layout?.pdf?.rootVars?.["--bbm-top-col-meta-font-size"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfMetaFontSize,
    labelTop: _normalizeText(topCol.label) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelTop,
    labelText: _normalizeText(textCol.label) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelText,
    labelMeta1: _normalizeText(metaLabels[0]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelMeta1,
    labelMeta2: _normalizeText(metaLabels[1]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelMeta2,
    labelMeta3: _normalizeText(metaLabels[2]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelMeta3,
    columns,
  };
}

export function extractProtokollTopsEditorValues(layout = {}) {
  return _extractValues(layout);
}

export function validateProtokollTopsEditorValues(values = {}, orientation = "portrait") {
  const columns = Array.isArray(values?.columns) && values.columns.length
    ? values.columns
    : _legacyToProtokollColumns({
        variant: values?.orientation || orientation,
        ui: {
          rootVars: {
            "--bbm-tops-list-number-col": values?.uiNumberWidth || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiNumberWidth,
            "--bbm-tops-list-number-padding-inline": values?.uiNumberInset || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiNumberInset,
            "--bbm-tops-list-number-font-size": values?.uiNumberFontSize || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiNumberFontSize,
            "--bbm-tops-list-text-col": values?.uiTextTrack || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiTextTrack,
            "--bbm-tops-list-text-padding-inline": values?.uiTextInset || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiTextInset,
            "--bbm-tops-list-text-font-size": values?.uiTextFontSize || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiTextFontSize,
            "--bbm-tops-list-meta-col": values?.uiMetaWidth || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiMetaWidth,
            "--bbm-tops-list-meta-padding-inline": values?.uiMetaInset || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiMetaInset,
            "--bbm-tops-list-meta-font-size": values?.uiMetaFontSize || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiMetaFontSize,
          },
        },
        pdf: {
          rootVars: {
            "--bbm-top-col-nr-padding-left": values?.pdfNumberInset || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfNumberInset,
            "--bbm-top-col-nr-font-size": values?.pdfNumberFontSize || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfNumberFontSize,
            "--bbm-top-col-text-padding-left": values?.pdfTextPaddingLeft || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextPaddingLeft,
            "--bbm-top-col-text-padding-right": values?.pdfTextPaddingRight || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextPaddingRight,
            "--bbm-top-col-text-font-size": values?.pdfTextFontSize || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextFontSize,
            "--bbm-top-col-meta-padding-left": values?.pdfMetaInset || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfMetaInset,
            "--bbm-top-col-meta-font-size": values?.pdfMetaFontSize || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfMetaFontSize,
          },
          columns: {
            number: { width: values?.pdfNumberWidth || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfNumberWidth },
            text: { width: values?.pdfTextWidth || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextWidth },
            meta: { width: values?.pdfMetaWidth || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfMetaWidth },
          },
        },
        labels: {
          top: values?.labelTop || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelTop,
          text: values?.labelText || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelText,
          meta: [values?.labelMeta1 || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelMeta1, values?.labelMeta2 || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelMeta2, values?.labelMeta3 || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelMeta3],
        },
      });
  const validation = validateTableLayoutColumns(columns, PROTOKOLL_TOPS_COLUMNS);
  const normalizedColumns = validation.columns;
  const topCol = normalizedColumns[0] || PROTOKOLL_TOPS_COLUMNS[0];
  const textCol = normalizedColumns[1] || PROTOKOLL_TOPS_COLUMNS[1];
  const metaCol = normalizedColumns[2] || PROTOKOLL_TOPS_COLUMNS[2];
  return {
    values: {
      orientation: _normalizeOrientation(values.orientation || orientation),
      uiNumberWidth: topCol.uiWidth,
      uiNumberInset: _normalizeText(values.uiNumberInset) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiNumberInset,
      uiNumberFontSize: _normalizeText(values.uiNumberFontSize) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiNumberFontSize,
      uiTextTrack: textCol.uiWidth,
      uiTextInset: _normalizeText(values.uiTextInset) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiTextInset,
      uiTextFontSize: _normalizeText(values.uiTextFontSize) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiTextFontSize,
      uiMetaWidth: metaCol.uiWidth,
      uiMetaInset: _normalizeText(values.uiMetaInset) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiMetaInset,
      uiMetaFontSize: _normalizeText(values.uiMetaFontSize) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiMetaFontSize,
      pdfNumberWidth: topCol.pdfWidth,
      pdfTextWidth: textCol.pdfWidth,
      pdfMetaWidth: metaCol.pdfWidth,
      pdfNumberInset: _normalizeText(values.pdfNumberInset) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfNumberInset,
      pdfNumberFontSize: _normalizeText(values.pdfNumberFontSize) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfNumberFontSize,
      pdfTextPaddingLeft: _normalizeText(values.pdfTextPaddingLeft) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextPaddingLeft,
      pdfTextPaddingRight: _normalizeText(values.pdfTextPaddingRight) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextPaddingRight,
      pdfTextFontSize: _normalizeText(values.pdfTextFontSize) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextFontSize,
      pdfMetaInset: _normalizeText(values.pdfMetaInset) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfMetaInset,
      pdfMetaFontSize: _normalizeText(values.pdfMetaFontSize) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfMetaFontSize,
      labelTop: topCol.label,
      labelText: textCol.label,
      labelMeta1: metaCol.headerLines[0] || metaCol.label,
      labelMeta2: metaCol.headerLines[1] || "",
      labelMeta3: metaCol.headerLines[2] || "",
      columns: normalizedColumns,
    },
    errors: validation.errors,
    isValid: validation.isValid,
  };
}

export function buildProtokollTopsLayoutOverlay(values = {}, orientation = "portrait") {
  const validated = validateProtokollTopsEditorValues(values, orientation);
  const normalized = validated.values;
  return {
    variant: normalized.orientation,
    columns: normalized.columns,
    labels: {
      top: normalized.labelTop,
      text: normalized.labelText,
      meta: [normalized.labelMeta1, normalized.labelMeta2, normalized.labelMeta3],
    },
    ui: {
      // Important: do not keep the default "gridTemplateColumns" in the effective layout,
      // otherwise live column width vars (e.g. number/meta width) won't have any effect.
      // Setting this to null overwrites the default during merge and makes applyProtokollTopsUiLayout
      // fall back to the var-based grid template.
      gridTemplateColumns: null,
      rootVars: {
        "--bbm-tops-list-number-col": normalized.uiNumberWidth,
        "--bbm-tops-list-number-padding-inline": normalized.uiNumberInset,
        "--bbm-tops-list-number-font-size": normalized.uiNumberFontSize,
        "--bbm-tops-list-text-col": normalized.uiTextTrack,
        "--bbm-tops-list-text-padding-inline": normalized.uiTextInset,
        "--bbm-tops-list-text-font-size": normalized.uiTextFontSize,
        "--bbm-tops-list-meta-col": normalized.uiMetaWidth,
        "--bbm-tops-list-meta-padding-inline": normalized.uiMetaInset,
        "--bbm-tops-list-meta-font-size": normalized.uiMetaFontSize,
      },
    },
    pdf: {
      rootVars: {
        "--bbm-top-col-nr-padding-left": normalized.pdfNumberInset,
        "--bbm-top-col-nr-font-size": normalized.pdfNumberFontSize,
        "--bbm-top-col-text-padding-left": normalized.pdfTextPaddingLeft,
        "--bbm-top-col-text-padding-right": normalized.pdfTextPaddingRight,
        "--bbm-top-col-text-font-size": normalized.pdfTextFontSize,
        "--bbm-top-col-meta-padding-left": normalized.pdfMetaInset,
        "--bbm-top-col-meta-font-size": normalized.pdfMetaFontSize,
      },
      columns: {
        number: { key: "top", className: "colNr", width: normalized.pdfNumberWidth },
        text: { key: "text", className: "colText", width: normalized.pdfTextWidth },
        meta: { key: "meta", className: "colMeta", width: normalized.pdfMetaWidth },
      },
    },
  };
}

export function sanitizeProtokollTopsLayout(layout = {}, orientation = "portrait") {
  const extracted = _extractValues(layout);
  const validated = validateProtokollTopsEditorValues(extracted, orientation);
  return buildProtokollTopsLayoutOverlay(validated.values, validated.values.orientation);
}

function _resolveLayout(layoutOverride) {
  if (!layoutOverride || typeof layoutOverride !== "object") {
    return PROTOKOLL_TOPS_LAYOUT;
  }
  return {
    ...PROTOKOLL_TOPS_LAYOUT,
    ...layoutOverride,
    labels: layoutOverride.labels || PROTOKOLL_TOPS_LAYOUT.labels,
    logicalFields: layoutOverride.logicalFields || PROTOKOLL_TOPS_LAYOUT.logicalFields,
    notes: layoutOverride.notes || PROTOKOLL_TOPS_LAYOUT.notes,
    ui: layoutOverride.ui || PROTOKOLL_TOPS_LAYOUT.ui,
    pdf: layoutOverride.pdf || PROTOKOLL_TOPS_LAYOUT.pdf,
  };
}

export function getProtokollTopsLayout() {
  return PROTOKOLL_TOPS_LAYOUT;
}

export function applyProtokollTopsUiLayout(target, layoutOverride) {
  if (!target?.style?.setProperty) return;
  const layout = _resolveLayout(layoutOverride);
  target.dataset.tableKey = layout.tableKey;
  target.dataset.layoutVariant = layout.variant;
  const uiLayout = layout.ui || PROTOKOLL_TOPS_LAYOUT.ui;
  for (const [key, value] of Object.entries(uiLayout.rootVars || {})) {
    target.style.setProperty(key, value);
  }
  if (typeof uiLayout.gridTemplateColumns === "string" && uiLayout.gridTemplateColumns.trim()) {
    target.style.setProperty("--bbm-tops-list-grid-columns", uiLayout.gridTemplateColumns.trim());
  } else {
    target.style.removeProperty?.("--bbm-tops-list-grid-columns");
  }
}

export function applyProtokollTopsPdfLayout(target, layoutOverride) {
  if (!target?.style?.setProperty) return;
  const layout = _resolveLayout(layoutOverride);
  target.dataset.tableKey = layout.tableKey;
  target.dataset.layoutVariant = layout.variant;
  const pdfLayout = layout.pdf || PROTOKOLL_TOPS_LAYOUT.pdf;
  for (const [key, value] of Object.entries(pdfLayout.rootVars || {})) {
    target.style.setProperty(key, value);
  }
}
