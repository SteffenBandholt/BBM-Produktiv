const PROTOKOLL_TOPS_EDITOR_DEFAULTS = Object.freeze({
  orientation: "portrait",
  uiNumberWidth: "64px",
  uiTextTrack: "minmax(0, 1fr)",
  uiMetaWidth: "74px",
  pdfNumberWidth: "23mm",
  pdfTextWidth: "auto",
  pdfMetaWidth: "15ch",
  labelTop: "TOP",
  labelText: "Gegenstand",
  labelMeta1: "Status",
  labelMeta2: "Fertig bis",
  labelMeta3: "verantw",
});

export const PROTOKOLL_TOPS_EDIT_FIELDS = Object.freeze([
  Object.freeze({ key: "uiNumberWidth", label: "UI TOP-Spalte", path: "ui.rootVars.--bbm-tops-list-number-col", type: "gridTrack", required: true }),
  Object.freeze({ key: "uiTextTrack", label: "UI Text-Spalte", path: "ui.rootVars.--bbm-tops-list-text-col", type: "gridTrack", required: true }),
  Object.freeze({ key: "uiMetaWidth", label: "UI Meta-Spalte", path: "ui.rootVars.--bbm-tops-list-meta-col", type: "gridTrack", required: true }),
  Object.freeze({ key: "pdfNumberWidth", label: "PDF TOP-Spalte", path: "pdf.columns.number.width", type: "gridTrack", required: true }),
  Object.freeze({ key: "pdfTextWidth", label: "PDF Text-Spalte", path: "pdf.columns.text.width", type: "gridTrack", required: true }),
  Object.freeze({ key: "pdfMetaWidth", label: "PDF Meta-Spalte", path: "pdf.columns.meta.width", type: "gridTrack", required: true }),
  Object.freeze({ key: "labelTop", label: "Überschrift TOP", path: "labels.top", type: "headingText", required: true }),
  Object.freeze({ key: "labelText", label: "Überschrift Text", path: "labels.text", type: "headingText", required: true }),
  Object.freeze({ key: "labelMeta1", label: "Überschrift Meta 1", path: "labels.meta[0]", type: "headingText", required: true }),
  Object.freeze({ key: "labelMeta2", label: "Überschrift Meta 2", path: "labels.meta[1]", type: "headingText", required: true }),
  Object.freeze({ key: "labelMeta3", label: "Überschrift Meta 3", path: "labels.meta[2]", type: "headingText", required: true }),
]);

const PROTOKOLL_TOPS_LAYOUT = Object.freeze({
  tableKey: "protokoll_tops",
  moduleId: "protokoll",
  variant: "portrait",
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
      "--bbm-tops-list-text-col": "minmax(0, 1fr)",
      "--bbm-tops-list-meta-col": "74px",
    }),
    gridTemplateColumns:
      "var(--bbm-tops-list-number-col, 64px) var(--bbm-tops-list-text-col, minmax(0, 1fr)) minmax(50px, var(--bbm-tops-list-meta-col, 74px))",
  }),
  pdf: Object.freeze({
    rootVars: Object.freeze({
      "--bbm-top-col-nr-width": "23mm",
      "--bbm-top-col-text-padding-left": "0",
      "--bbm-top-col-text-padding-right": "1.5mm",
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

function _extractValues(layout = {}) {
  const uiRootVars = layout?.ui?.rootVars || {};
  const pdfColumns = layout?.pdf?.columns || {};
  const labels = layout?.labels || {};
  const metaLabels = Array.isArray(labels.meta) ? labels.meta : [];
  return {
    orientation: _normalizeOrientation(layout?.variant || layout?.orientation || PROTOKOLL_TOPS_EDITOR_DEFAULTS.orientation),
    uiNumberWidth: _normalizeText(uiRootVars["--bbm-tops-list-number-col"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiNumberWidth,
    uiTextTrack: _normalizeText(uiRootVars["--bbm-tops-list-text-col"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiTextTrack,
    uiMetaWidth: _normalizeText(uiRootVars["--bbm-tops-list-meta-col"]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.uiMetaWidth,
    pdfNumberWidth: _normalizeText(pdfColumns.number?.width) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfNumberWidth,
    pdfTextWidth: _normalizeText(pdfColumns.text?.width) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfTextWidth,
    pdfMetaWidth: _normalizeText(pdfColumns.meta?.width) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.pdfMetaWidth,
    labelTop: _normalizeText(labels.top) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelTop,
    labelText: _normalizeText(labels.text) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelText,
    labelMeta1: _normalizeText(metaLabels[0]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelMeta1,
    labelMeta2: _normalizeText(metaLabels[1]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelMeta2,
    labelMeta3: _normalizeText(metaLabels[2]) || PROTOKOLL_TOPS_EDITOR_DEFAULTS.labelMeta3,
  };
}

export function extractProtokollTopsEditorValues(layout = {}) {
  return _extractValues(layout);
}

export function validateProtokollTopsEditorValues(values = {}, orientation = "portrait") {
  const input = {
    ...PROTOKOLL_TOPS_EDITOR_DEFAULTS,
    ...values,
    orientation: _normalizeOrientation(values.orientation || orientation),
  };
  const out = { ...input };
  const errors = {};

  const trackFields = [
    "uiNumberWidth",
    "uiTextTrack",
    "uiMetaWidth",
    "pdfNumberWidth",
    "pdfTextWidth",
    "pdfMetaWidth",
  ];
  for (const key of trackFields) {
    const text = _normalizeText(input[key]);
    if (!_isAllowedGridTrack(text)) {
      out[key] = PROTOKOLL_TOPS_EDITOR_DEFAULTS[key];
      errors[key] = "Ungültiger Spaltenwert";
    } else {
      out[key] = text;
    }
  }

  const headingFields = ["labelTop", "labelText", "labelMeta1", "labelMeta2", "labelMeta3"];
  for (const key of headingFields) {
    const text = _normalizeText(input[key]);
    if (!text) {
      out[key] = PROTOKOLL_TOPS_EDITOR_DEFAULTS[key];
      errors[key] = "Überschrift darf nicht leer sein";
      continue;
    }
    if (!_isAllowedHeadingText(text)) {
      out[key] = PROTOKOLL_TOPS_EDITOR_DEFAULTS[key];
      errors[key] = "Ungültige Überschrift";
      continue;
    }
    out[key] = text;
  }

  return { values: out, errors, isValid: Object.keys(errors).length === 0 };
}

export function buildProtokollTopsLayoutOverlay(values = {}, orientation = "portrait") {
  const validated = validateProtokollTopsEditorValues(values, orientation);
  const normalized = validated.values;
  return {
    variant: normalized.orientation,
    labels: {
      top: normalized.labelTop,
      text: normalized.labelText,
      meta: [normalized.labelMeta1, normalized.labelMeta2, normalized.labelMeta3],
    },
    ui: {
      rootVars: {
        "--bbm-tops-list-number-col": normalized.uiNumberWidth,
        "--bbm-tops-list-text-col": normalized.uiTextTrack,
        "--bbm-tops-list-meta-col": normalized.uiMetaWidth,
      },
    },
    pdf: {
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
