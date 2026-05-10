import { applyPopupButtonStyle, applyPopupCardStyle } from "../ui/popupButtonStyles.js";
import { validateProtokollTopsEditorValues } from '../../shared/tableLayouts/protokollTopsLayout.js';

const DEFAULT_VALUES = Object.freeze({
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

const DEFAULT_ORIENTATION = "portrait";

function _normalizeOrientation(value) {
  return String(value || "").trim().toLowerCase() === "landscape" ? "landscape" : "portrait";
}

function _normalizeText(value, fallback, maxLen = 64) {
  const text = String(value == null ? "" : value).replace(/[\r\n]+/g, " ").trim();
  if (!text) return fallback;
  if (Number.isFinite(maxLen) && maxLen > 0 && text.length > maxLen) return fallback;
  return text;
}

function _normalizeTrack(value, fallback) {
  const text = _normalizeText(value, fallback, 48);
  return text || fallback;
}

function _cloneJson(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function _sameJson(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function _normalizeId(value) {
  return String(value == null ? "" : value).trim();
}

function _formatText(value, fallback) {
  const text = _normalizeId(value);
  return text || fallback;
}

function _normalizeDefinitionsList(definitions = []) {
  return Array.isArray(definitions)
    ? definitions
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          moduleId: _normalizeId(item.moduleId),
          moduleLabel: _formatText(item.moduleLabel, "Protokoll"),
          moduleDescription: _formatText(item.moduleDescription, ""),
          moduleSupportedOrientations: Array.isArray(item.moduleSupportedOrientations)
            ? item.moduleSupportedOrientations.map((entry) => _normalizeOrientation(entry))
            : ["portrait"],
          tableKey: _normalizeId(item.tableKey),
          tableLabel: _formatText(item.tableLabel, "TOP-Liste"),
          description: _formatText(item.description, ""),
          supportedOrientations: Array.isArray(item.supportedOrientations)
            ? item.supportedOrientations.map((entry) => _normalizeOrientation(entry))
            : ["portrait"],
          columns: Array.isArray(item.columns) ? item.columns.map((column) => _cloneJson(column)) : [],
          editFields: Array.isArray(item.editFields) ? item.editFields.map((field) => ({ ...field })) : [],
          previewData: Array.isArray(item.previewData) ? item.previewData.map((row) => _cloneJson(row)) : [],
          defaultLayout: item.defaultLayout ? _cloneJson(item.defaultLayout) : null,
        }))
        .filter((item) => item.moduleId && item.tableKey)
    : [];
}

function _groupModuleDefinitions(definitions = []) {
  const modules = [];
  const byModule = new Map();
  for (const def of definitions) {
    if (!def?.moduleId) continue;
    let moduleDef = byModule.get(def.moduleId);
    if (!moduleDef) {
      moduleDef = {
        moduleId: def.moduleId,
        moduleLabel: def.moduleLabel || def.moduleId,
        moduleDescription: def.moduleDescription || "",
        moduleSupportedOrientations: Array.isArray(def.moduleSupportedOrientations)
          ? [...def.moduleSupportedOrientations]
          : ["portrait"],
        tables: [],
      };
      byModule.set(def.moduleId, moduleDef);
      modules.push(moduleDef);
    }
    moduleDef.tables.push(def);
  }
  return modules;
}

function _getFirstSupportedTable(moduleDef) {
  if (!moduleDef || !Array.isArray(moduleDef.tables) || !moduleDef.tables.length) return null;
  return moduleDef.tables[0] || null;
}

function _getPreviewValue(state) {
  return _hasDirtyValuesState(state) ? state.editValues : state.loadedValues;
}

function _hasDirtyValuesState(state) {
  return !_sameJson(state.editValues, state.loadedValues);
}

function _getPreviewRows(definition) {
  return Array.isArray(definition?.previewData) ? definition.previewData : [];
}

function _renderPreviewRowCell(node, value) {
  node.textContent = String(value == null ? "" : value);
}

function _cloneColumn(column = {}) {
  return {
    ...column,
    headerLines: Array.isArray(column.headerLines) ? [...column.headerLines] : [],
  };
}

function _cloneColumns(columns = []) {
  return Array.isArray(columns) ? columns.map((column) => _cloneColumn(column)) : [];
}

function _columnFieldKey(columnKey, field) {
  return `${String(columnKey || "").trim()}.${String(field || "").trim()}`;
}

function _normalizeHeaderLinesInput(value, fallbackLines = []) {
  const raw = String(value == null ? "" : value).replace(/\r/g, "");
  if (!raw.length) {
    return [""];
  }
  return raw.split("\n").map((line) => line.trim());
}

function _isDangerousLayoutText(text) {
  const value = String(text == null ? "" : text).trim();
  if (!value) return false;
  if (/[{};]/.test(value)) return true;
  if (/url\s*\(/i.test(value)) return true;
  if (/expression\s*\(/i.test(value)) return true;
  if (/var\s*\(/i.test(value)) return true;
  if (/calc\s*\(/i.test(value)) return true;
  if (/\bjavascript\s*:/i.test(value)) return true;
  return false;
}

function _isAllowedGridTrack(text) {
  const value = String(text == null ? "" : text).trim();
  if (!value || _isDangerousLayoutText(value)) return false;
  if (value === "auto") return true;
  if (/^\d+(?:\.\d+)?(px|mm|ch|fr)$/.test(value)) return true;
  if (/^minmax\(\s*0\s*,\s*\d+(?:\.\d+)?fr\s*\)$/.test(value)) return true;
  if (/^minmax\(\s*\d+(?:\.\d+)?(?:px|mm|ch)\s*,\s*\d+(?:\.\d+)?(?:px|mm|ch|fr)\s*\)$/.test(value)) return true;
  return false;
}

function _isAllowedHeadingText(text) {
  const value = String(text == null ? "" : text).trim();
  if (!value || _isDangerousLayoutText(value)) return false;
  return value.length <= 64;
}

function _normalizeWeight(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return Number(fallback) > 0 ? Number(fallback) : 1;
  return Math.max(1, Math.floor(n));
}

function _normalizeColumnLines(value, fallback = []) {
  if (Array.isArray(value)) {
    const lines = value.map((entry) => String(entry == null ? "" : entry).trim());
    return lines.length ? lines : [""];
  }
  if (typeof value === "string") {
    const lines = value
      .replace(/\r/g, "")
      .split("\n")
      .map((entry) => String(entry == null ? "" : entry).trim());
    return lines.length ? lines : [""];
  }
  if (Array.isArray(fallback)) {
    return fallback.map((entry) => String(entry == null ? "" : entry).trim());
  }
  return [""];
}

function _normalizeTableLayoutColumns(columns = [], fallbackColumns = []) {
  const input = Array.isArray(columns) ? columns : [];
  const fallback = Array.isArray(fallbackColumns) ? fallbackColumns : [];
  const byKey = new Map(input.filter((item) => item && typeof item === "object" && item.key).map((item) => [String(item.key), item]));
  const normalized = [];
  const seen = new Set();

  const addColumn = (src, fb, key) => {
    const from = src && typeof src === "object" ? src : {};
    const fallbackColumn = fb && typeof fb === "object" ? fb : {};
    const normalizedKey = String(from.key || fallbackColumn.key || key || "").trim();
    if (!normalizedKey || seen.has(normalizedKey)) return;
    seen.add(normalizedKey);
    const label = String(from.label ?? fallbackColumn.label ?? normalizedKey).trim();
    const uiWidth = String(from.uiWidth ?? fallbackColumn.uiWidth ?? "1fr").trim();
    const pdfWidth = String(from.pdfWidth ?? fallbackColumn.pdfWidth ?? "auto").trim();
    const headerLines = _normalizeColumnLines(from.headerLines, fallbackColumn.headerLines || [label]);
    normalized.push({
      key: normalizedKey,
      label,
      uiWidth,
      pdfWidth,
      weight: _normalizeWeight(from.weight ?? fallbackColumn.weight ?? 1, 1),
      required: from.required != null ? !!from.required : !!fallbackColumn.required,
      previewValue: String(from.previewValue ?? fallbackColumn.previewValue ?? "").trim(),
      previewField: String(from.previewField || fallbackColumn.previewField || normalizedKey).trim(),
      headerLines,
    });
  };

  for (let i = 0; i < fallback.length; i += 1) {
    const fb = fallback[i];
    if (!fb || typeof fb !== "object") continue;
    addColumn(byKey.get(String(fb.key || "")) || input[i], fb, fb.key || `col_${i}`);
  }

  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const key = String(item.key || "").trim();
    if (!key || seen.has(key)) continue;
    addColumn(item, {}, key);
  }

  return normalized;
}

function _validateTableLayoutColumns(columns = [], fallbackColumns = []) {
  const normalized = _normalizeTableLayoutColumns(columns, fallbackColumns);
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

function _buildTableLayoutOverlayFromColumns(columns = [], orientation = "portrait", extras = {}) {
  const normalizedColumns = _normalizeTableLayoutColumns(columns, extras.fallbackColumns || []);
  return {
    variant: String(orientation || "portrait").trim().toLowerCase() === "landscape" ? "landscape" : "portrait",
    columns: normalizedColumns,
    ...(extras.layoutExtras ? JSON.parse(JSON.stringify(extras.layoutExtras)) : {}),
  };
}

function _buildProtokollTopsColumnsFromLegacy(layout = {}) {
  const uiRootVars = layout?.ui?.rootVars || {};
  const pdfColumns = layout?.pdf?.columns || {};
  const labels = layout?.labels || {};
  const metaLabels = Array.isArray(labels.meta) ? labels.meta : [];
  return _normalizeTableLayoutColumns(
    [
      {
        key: "topNumber",
        label: labels.top || "TOP",
        uiWidth: uiRootVars["--bbm-tops-list-number-col"] || "64px",
        pdfWidth: pdfColumns.number?.width || "23mm",
        weight: 2,
        required: true,
        previewValue: "1",
        headerLines: [labels.top || "TOP"],
      },
      {
        key: "shortText",
        label: labels.text || "Gegenstand",
        uiWidth: uiRootVars["--bbm-tops-list-text-col"] || "minmax(0, 1fr)",
        pdfWidth: pdfColumns.text?.width || "auto",
        weight: 6,
        required: true,
        previewValue: "Beispielthema fuer die Vorschau",
        headerLines: [labels.text || "Gegenstand"],
      },
      {
        key: "meta",
        label: metaLabels[0] || "Status",
        uiWidth: uiRootVars["--bbm-tops-list-meta-col"] || "74px",
        pdfWidth: pdfColumns.meta?.width || "15ch",
        weight: 1,
        required: true,
        previewValue: "offen",
        headerLines: [
          metaLabels[0] || "Status",
          metaLabels[1] || "Fertig bis",
          metaLabels[2] || "verantw",
        ],
      },
    ],
    [
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
    ]
  );
}

function _buildColumnDraft(column = {}, fallback = {}) {
  const fallbackHeaderLines = Array.isArray(fallback.headerLines) ? fallback.headerLines : [];
  const headerLines = _normalizeHeaderLinesInput(column.headerLines?.join?.("\n") ?? "", fallbackHeaderLines);
  const label = String(column.label == null ? "" : column.label).trim();
  return {
    key: String(column.key || fallback.key || "").trim(),
    label,
    uiWidth: String(column.uiWidth == null ? fallback.uiWidth || "" : column.uiWidth).trim(),
    pdfWidth: String(column.pdfWidth == null ? fallback.pdfWidth || "" : column.pdfWidth).trim(),
    weight: String(column.weight == null ? fallback.weight ?? "" : column.weight).trim(),
    required: column.required != null ? !!column.required : !!fallback.required,
    previewValue: String(column.previewValue == null ? fallback.previewValue || "" : column.previewValue).trim(),
    headerLines,
  };
}

function _normalizePreviewRows(definition) {
  return Array.isArray(definition?.previewData) ? definition.previewData.map((row) => ({ ...row })) : [];
}

function _getPreviewModeConfig(mode) {
  const isPdf = mode === "pdf";
  return {
    mode,
    isPdf,
    title: isPdf ? "PDF-Vorschau mit Testdaten" : "UI-Vorschau mit Testdaten",
    hint: isPdf
      ? "Registrierte Beispielzeilen aus der Tabellenregistry. PDF-Werte sind eine technische Näherung im Editor, kein echter PDF-Renderer."
      : "Registrierte Beispielzeilen aus der Tabellenregistry. Keine Projekt- oder Besprechungsdaten.",
    note: isPdf
      ? "Diese Vorschau erzeugt kein PDF. Der echte PDF-Test mit Testdaten wird später separat ergänzt."
      : "Diese Vorschau zeigt die UI-Layoutwerte des Editors.",
  };
}

function _getTableLayoutEditorHints(tableDef = {}) {
  const moduleId = _normalizeId(tableDef?.moduleId);
  const tableKey = _normalizeId(tableDef?.tableKey);

  const genericUiHint =
    "UI-Werte steuern die Spaltenbreiten in der App, wenn die Tabelle produktiv angeschlossen ist.";
  const genericPdfHint =
    "PDF-Werte steuern nur PDF-Spaltenbreiten, wenn ein PDF-Druckpfad für diese Tabelle angeschlossen ist.";
  const genericSaveHint = "Gespeichert wird nur die aktuell gewählte Tabelle; kein globales Layout.";
  const genericResetHint =
    "Reset betrifft nur die aktuell gewählte Kombination aus Modul, Tabelle und Orientierung.";

  if (moduleId === "projektverwaltung" && tableKey === "project_firms") {
    return {
      uiHint: "UI-Breiten wirken auf die Projekt-Firmenliste.",
      pdfHint: "PDF ist für diese Tabelle aktuell nur Vorschau. Ein produktiver PDF-Druck ist noch nicht angeschlossen.",
      saveHint: genericSaveHint,
      resetHint: genericResetHint,
    };
  }

  if (moduleId === "protokoll" && tableKey === "protokoll_tops") {
    return {
      uiHint: "UI- und PDF-Breiten sind produktiv angeschlossen.",
      pdfHint: "PDF-Werte steuern hier den produktiven PDF-Druck.",
      saveHint: genericSaveHint,
      resetHint: genericResetHint,
    };
  }

  return {
    uiHint: genericUiHint,
    pdfHint: genericPdfHint,
    saveHint: genericSaveHint,
    resetHint: genericResetHint,
  };
}

function _buildPreviewGridTemplate(columns = [], mode = "ui") {
  return _cloneColumns(columns)
    .map((column) => {
      const width = mode === "pdf" ? column.pdfWidth : column.uiWidth;
      return String(width || (mode === "pdf" ? "auto" : "1fr")).trim() || (mode === "pdf" ? "auto" : "1fr");
    })
    .join(" ");
}

function _renderPreviewGridRow(rowData, columns, mode, { header = false } = {}) {
  const row = document.createElement("div");
  row.style.display = "grid";
  row.style.gridTemplateColumns = _buildPreviewGridTemplate(columns, mode);
  row.style.alignItems = "start";
  row.style.minWidth = "0";
  row.style.borderBottom = header ? "1px solid rgba(15,23,42,0.12)" : "1px solid rgba(15,23,42,0.08)";
  row.style.background = header ? "#eef2ff" : "#ffffff";
  row.style.color = "#0f172a";
  row.style.overflow = "hidden";

  const baseCellStyles = {
    padding: "8px 10px",
    minWidth: "0",
    wordBreak: "break-word",
    verticalAlign: "top",
  };

  const makeCell = () => {
    const cell = document.createElement("div");
    Object.assign(cell.style, baseCellStyles);
    return cell;
  };

  const renderValue = (cell, value, column) => {
    const normalized = Array.isArray(value) ? value : value == null ? "" : value;
    if (header) {
      cell.style.fontWeight = "700";
      cell.style.display = "grid";
      cell.style.gap = "2px";
      const headerLines = Array.isArray(column?.headerLines) && column.headerLines.length ? column.headerLines : [column?.label || ""];
      for (const line of headerLines) {
        const span = document.createElement("div");
        span.textContent = String(line || "");
        cell.appendChild(span);
      }
      return;
    }

    if (Array.isArray(normalized)) {
      cell.style.display = "grid";
      cell.style.gap = "2px";
      for (const line of normalized) {
        const span = document.createElement("div");
        span.textContent = String(line || "");
        cell.appendChild(span);
      }
      return;
    }

    if (typeof normalized === "object" && normalized != null) {
      cell.textContent = JSON.stringify(normalized);
      return;
    }

    cell.textContent = String(normalized || column?.previewValue || "");
  };

  const sourceRows = header ? columns : rowData;
  if (header) {
    for (const column of columns) {
      const cell = makeCell();
      renderValue(cell, column?.headerLines, column);
      row.appendChild(cell);
    }
    return row;
  }

  for (const column of columns) {
    const cell = makeCell();
    renderValue(cell, rowData?.[column.key] ?? column?.previewValue ?? "", column);
    if (!header && column?.key === "shortText" && rowData?.longText) {
      const longText = document.createElement("div");
      longText.style.marginTop = "4px";
      longText.style.color = "#475569";
      longText.textContent = String(rowData.longText);
      cell.appendChild(longText);
    }
    row.appendChild(cell);
  }

  return row;
}

function _renderPreviewPanel(target, definition, values, mode) {
  if (!target) return;
  target.innerHTML = "";

  const cfg = _getPreviewModeConfig(mode);
  const columns = Array.isArray(values?.columns) && values.columns.length ? values.columns : _cloneColumns(definition?.columns || []);
  const rows = _normalizePreviewRows(definition);

  target.dataset.previewMode = cfg.mode;
  target.style.display = "grid";
  target.style.gap = "8px";
  target.style.minWidth = "0";
  target.style.padding = "10px";
  target.style.border = "1px solid rgba(15,23,42,0.12)";
  target.style.borderRadius = "12px";
  target.style.background = "#fff";

  const panelTitle = document.createElement("div");
  panelTitle.textContent = cfg.title;
  panelTitle.style.fontWeight = "800";

  const panelHint = document.createElement("div");
  panelHint.textContent = cfg.hint;
  panelHint.style.fontSize = "12px";
  panelHint.style.opacity = "0.78";

  const panelSummary = document.createElement("div");
  panelSummary.style.fontSize = "12px";
  panelSummary.style.color = "#475569";
  const summaryParts = [
    `Quelle: ${String(values.source || "default")}`,
    `Testdaten: ${rows.length} Zeilen`,
    `Orientierung: ${String(values.orientation || DEFAULT_ORIENTATION)}`,
    `Spalten: ${columns.length}`,
    `Layout: ${mode === "pdf" ? "PDF" : "UI"}`,
  ];
  panelSummary.textContent = summaryParts.join(" | ");

  const panelNote = document.createElement("div");
  panelNote.textContent = cfg.note;
  panelNote.style.fontSize = "12px";
  panelNote.style.color = mode === "pdf" ? "#7c2d12" : "#334155";
  panelNote.style.opacity = mode === "pdf" ? "0.92" : "0.8";

  const surface = document.createElement("div");
  surface.style.minHeight = "0";
  surface.style.overflow = "auto";
  surface.style.border = "1px solid rgba(15,23,42,0.12)";
  surface.style.borderRadius = "10px";
  surface.style.background = "#fff";
  surface.style.display = "grid";
  surface.style.gap = "0";
  surface.style.minWidth = "0";
  surface.dataset.previewGridColumns = _buildPreviewGridTemplate(columns, mode);

  surface.append(_renderPreviewGridRow(null, columns, mode, { header: true }));
  for (const rowData of rows) {
    surface.append(_renderPreviewGridRow(rowData, columns, mode, { header: false }));
  }

  target.append(panelTitle, panelHint, panelSummary, panelNote, surface);
}

export function extractProtokollTopsEditorValues(layout = {}) {
  const uiRootVars = layout?.ui?.rootVars || {};
  const pdfColumns = layout?.pdf?.columns || {};
  const labels = layout?.labels || {};
  const metaLabels = Array.isArray(labels.meta) ? labels.meta : [];
  const columns = Array.isArray(layout?.columns) && layout.columns.length
    ? _normalizeTableLayoutColumns(layout.columns, [
        {
          key: "topNumber",
          label: DEFAULT_VALUES.labelTop,
          uiWidth: DEFAULT_VALUES.uiNumberWidth,
          pdfWidth: DEFAULT_VALUES.pdfNumberWidth,
          weight: 2,
          required: true,
          previewValue: "1",
          headerLines: [DEFAULT_VALUES.labelTop],
        },
        {
          key: "shortText",
          label: DEFAULT_VALUES.labelText,
          uiWidth: DEFAULT_VALUES.uiTextTrack,
          pdfWidth: DEFAULT_VALUES.pdfTextWidth,
          weight: 6,
          required: true,
          previewValue: "Beispielthema fuer die Vorschau",
          headerLines: [DEFAULT_VALUES.labelText],
        },
        {
          key: "meta",
          label: DEFAULT_VALUES.labelMeta1,
          uiWidth: DEFAULT_VALUES.uiMetaWidth,
          pdfWidth: DEFAULT_VALUES.pdfMetaWidth,
          weight: 1,
          required: true,
          previewValue: "offen",
          headerLines: [DEFAULT_VALUES.labelMeta1, DEFAULT_VALUES.labelMeta2, DEFAULT_VALUES.labelMeta3],
        },
      ])
    : _buildProtokollTopsColumnsFromLegacy(layout);
  return {
    orientation: _normalizeOrientation(layout?.variant || layout?.orientation || DEFAULT_VALUES.orientation),
    uiNumberWidth: _normalizeText(uiRootVars["--bbm-tops-list-number-col"], DEFAULT_VALUES.uiNumberWidth, 32),
    uiTextTrack: _normalizeTrack(uiRootVars["--bbm-tops-list-text-col"], DEFAULT_VALUES.uiTextTrack),
    uiMetaWidth: _normalizeText(uiRootVars["--bbm-tops-list-meta-col"], DEFAULT_VALUES.uiMetaWidth, 32),
    pdfNumberWidth: _normalizeText(pdfColumns.number?.width, DEFAULT_VALUES.pdfNumberWidth, 32),
    pdfTextWidth: _normalizeText(pdfColumns.text?.width, DEFAULT_VALUES.pdfTextWidth, 32),
    pdfMetaWidth: _normalizeText(pdfColumns.meta?.width, DEFAULT_VALUES.pdfMetaWidth, 32),
    labelTop: _normalizeText(labels.top, DEFAULT_VALUES.labelTop, 48),
    labelText: _normalizeText(labels.text, DEFAULT_VALUES.labelText, 64),
    labelMeta1: _normalizeText(metaLabels[0], DEFAULT_VALUES.labelMeta1, 48),
    labelMeta2: _normalizeText(metaLabels[1], DEFAULT_VALUES.labelMeta2, 48),
    labelMeta3: _normalizeText(metaLabels[2], DEFAULT_VALUES.labelMeta3, 48),
    columns,
  };
}

export function buildProtokollTopsLayoutOverlay(values = {}, orientation = "portrait") {
  const validated = validateProtokollTopsEditorValues(values, orientation);
  const normalized = validated.values;
  const labels = {
    top: _normalizeText(normalized.labelTop, DEFAULT_VALUES.labelTop, 48),
    text: _normalizeText(normalized.labelText, DEFAULT_VALUES.labelText, 64),
    meta: [
      _normalizeText(normalized.labelMeta1, DEFAULT_VALUES.labelMeta1, 48),
      _normalizeText(normalized.labelMeta2, DEFAULT_VALUES.labelMeta2, 48),
      _normalizeText(normalized.labelMeta3, DEFAULT_VALUES.labelMeta3, 48),
    ],
  };
  return {
    variant: normalized.orientation,
    columns: normalized.columns,
    labels,
    ui: {
      rootVars: {
        "--bbm-tops-list-number-col": _normalizeText(normalized.uiNumberWidth, DEFAULT_VALUES.uiNumberWidth, 32),
        "--bbm-tops-list-text-col": _normalizeTrack(normalized.uiTextTrack, DEFAULT_VALUES.uiTextTrack),
        "--bbm-tops-list-meta-col": _normalizeText(normalized.uiMetaWidth, DEFAULT_VALUES.uiMetaWidth, 32),
      },
    },
    pdf: {
      columns: {
        number: { key: "top", className: "colNr", width: _normalizeText(normalized.pdfNumberWidth, DEFAULT_VALUES.pdfNumberWidth, 32) },
        text: { key: "text", className: "colText", width: _normalizeText(normalized.pdfTextWidth, DEFAULT_VALUES.pdfTextWidth, 32) },
        meta: { key: "meta", className: "colMeta", width: _normalizeText(normalized.pdfMetaWidth, DEFAULT_VALUES.pdfMetaWidth, 32) },
      },
    },
  };
}

function _createField(labelText, initialValue = "", options = {}) {
  const row = document.createElement("label");
  row.style.display = "grid";
  row.style.gap = "4px";
  row.style.minWidth = "0";

  const label = document.createElement("span");
  label.textContent = labelText;
  label.style.fontSize = "12px";
  label.style.fontWeight = "700";
  label.style.color = "#334155";

  const input = options.multiline ? document.createElement("textarea") : document.createElement("input");
  if (!options.multiline) {
    input.type = options.type || "text";
  }
  input.value = String(initialValue ?? "");
  input.style.width = "100%";
  input.style.boxSizing = "border-box";
  if (options.multiline) {
    input.rows = Number.isFinite(options.rows) && options.rows > 0 ? options.rows : 3;
    input.style.resize = "vertical";
  }

  row.append(label, input);
  return { row, input };
}

function _readFormValues(fields) {
  const read = (key) => String(fields.get(key)?.value ?? "").trim();
  return {
    orientation: read("orientation"),
    uiNumberWidth: read("uiNumberWidth"),
    uiTextTrack: read("uiTextTrack"),
    uiMetaWidth: read("uiMetaWidth"),
    pdfNumberWidth: read("pdfNumberWidth"),
    pdfTextWidth: read("pdfTextWidth"),
    pdfMetaWidth: read("pdfMetaWidth"),
    labelTop: read("labelTop"),
    labelText: read("labelText"),
    labelMeta1: read("labelMeta1"),
    labelMeta2: read("labelMeta2"),
    labelMeta3: read("labelMeta3"),
  };
}

function _validateEditorValues(values, orientation) {
  return validateProtokollTopsEditorValues(values, orientation);
}

function _renderValuesSummary(target, state, definition) {
  if (!target) return;
  const activeValues = _getPreviewValue(state);
  const previewCount = Array.isArray(definition?.previewData) ? definition.previewData.length : 0;
  const dirty = _hasDirtyValuesState(state);
  target.textContent = [
    `Quelle: ${state.source || "default"}`,
    `Layoutwerte: ${dirty ? "ungespeicherte Eingaben" : "gespeicherte Werte"}`,
    `Testdaten: ${previewCount} Zeilen`,
    `Orientierung: ${activeValues.orientation || state.orientation}`,
    `Spaltenbreite UI: ${activeValues.uiNumberWidth} | ${activeValues.uiTextTrack} | ${activeValues.uiMetaWidth}`,
  ].join(" | ");
}

function _syncFields(fields, values) {
  for (const [key, input] of fields.entries()) {
    if (!input) continue;
    if (key === "orientation") {
      input.value = _normalizeOrientation(values.orientation);
      continue;
    }
    input.value = String(values[key] ?? "");
  }
}

export function createTableLayoutPrototypeEditor({ api } = {}) {
  const resolvedApi = api || (typeof window !== "undefined" && window.bbmDb) || {};

  const root = document.createElement("section");
  root.dataset.tableLayoutEditor = "registry-driven";
  root.dataset.layoutMode = "fullscreen";
  root.dataset.tableKey = "";
  root.dataset.moduleId = "";
  root.dataset.orientation = DEFAULT_ORIENTATION;
  root.style.display = "grid";
  root.style.gap = "10px";
  root.style.width = "100%";
  root.style.maxWidth = "none";
  root.style.minWidth = "0";
  root.style.alignSelf = "stretch";

  const fields = new Map();
  const state = {
    isFullscreen: true,
    previewMode: "ui",
    orientation: DEFAULT_ORIENTATION,
    schemaVersion: 1,
    source: "default",
    parseError: "",
    loadedValues: {
      orientation: DEFAULT_ORIENTATION,
      columns: [],
    },
    editValues: {
      orientation: DEFAULT_ORIENTATION,
      columns: [],
    },
    busy: false,
    error: "",
    testResult: "",
    selectedModuleId: "",
    selectedTableKey: "",
    moduleDefinitions: [],
    tableDefinitions: [],
    contextLoading: false,
    contextError: "",
    validationErrors: {},
    validationMessage: "",
    hasValidationErrors: false,
  };
  let fullscreenHost = null;

  const formatSourceLabel = () => {
    if (state.source === "stored") return "gespeichertes Layout";
    if (state.source === "stored-portrait-fallback") return "Fallback (portrait gespeicherte Variante)";
    const tableDef = _getSelectedTableDefinition();
    if (tableDef?.tableKey) return `Standardlayout ${tableDef.tableKey}`;
    return "Standardlayout";
  };

  const head = document.createElement("div");
  applyPopupCardStyle(head);
  head.style.padding = "10px";
  head.style.display = "grid";
  head.style.gap = "6px";

  const headTop = document.createElement("div");
  headTop.style.display = "flex";
  headTop.style.alignItems = "flex-start";
  headTop.style.justifyContent = "space-between";
  headTop.style.gap = "10px";

  const title = document.createElement("div");
  title.textContent = "Tabellenlayouts";
  title.style.fontWeight = "800";

  const titleWrap = document.createElement("div");
  titleWrap.style.display = "grid";
  titleWrap.style.gap = "2px";
  titleWrap.style.minWidth = "0";
  titleWrap.append(title);

  const fullscreenButton = document.createElement("button");
  fullscreenButton.type = "button";
  fullscreenButton.textContent = "Vollbild";
  applyPopupButtonStyle(fullscreenButton);
  fullscreenButton.style.marginLeft = "auto";
  fullscreenButton.style.whiteSpace = "nowrap";

  const hint = document.createElement("div");
  hint.textContent = "Interner Prototyp. Die Orientierung bearbeitet die Layoutvariante und ändert den normalen Druck noch nicht automatisch.";
  hint.style.fontSize = "12px";
  hint.style.opacity = "0.8";

  const targetInfo = document.createElement("div");
  targetInfo.style.fontSize = "12px";
  targetInfo.style.color = "#475569";
  targetInfo.style.display = "grid";
  targetInfo.style.gap = "2px";
  const targetInfoModule = document.createElement("div");
  targetInfoModule.textContent = "Modul: -";
  const targetInfoTable = document.createElement("div");
  targetInfoTable.textContent = "Tabelle: -";
  const targetInfoKey = document.createElement("div");
  targetInfoKey.textContent = "tableKey: -";
  const targetInfoOrientation = document.createElement("div");
  targetInfoOrientation.textContent = `Orientierung: ${DEFAULT_ORIENTATION}`;
  const targetInfoSource = document.createElement("div");
  targetInfoSource.textContent = "Quelle: Standardlayout";
  targetInfo.append(targetInfoModule, targetInfoTable, targetInfoKey, targetInfoOrientation, targetInfoSource);

  headTop.append(titleWrap, fullscreenButton);
  head.append(headTop, hint, targetInfo);

  const contextCard = document.createElement("div");
  applyPopupCardStyle(contextCard);
  contextCard.style.padding = "10px";
  contextCard.style.display = "grid";
  contextCard.style.gap = "8px";

  const contextTitle = document.createElement("div");
  contextTitle.textContent = "Layout-Auswahl";
  contextTitle.style.fontWeight = "800";

  const contextHint = document.createElement("div");
  contextHint.textContent =
    "Modul- und Tabellenliste kommen aus der zentralen Registry. Die Layoutauswahl ist modul- und tabellenbezogen, nicht projektbezogen.";
  contextHint.style.fontSize = "12px";
  contextHint.style.opacity = "0.78";

  const contextGrid = document.createElement("div");
  contextGrid.style.display = "grid";
  contextGrid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  contextGrid.style.gap = "8px";

  const moduleWrap = document.createElement("label");
  moduleWrap.style.display = "grid";
  moduleWrap.style.gap = "4px";
  const moduleLabel = document.createElement("span");
  moduleLabel.textContent = "Modul";
  moduleLabel.style.fontSize = "12px";
  moduleLabel.style.fontWeight = "700";
  moduleLabel.style.color = "#334155";
  const moduleSelect = document.createElement("select");
  moduleSelect.style.width = "100%";
  moduleSelect.style.boxSizing = "border-box";
  moduleWrap.append(moduleLabel, moduleSelect);

  const tableWrap = document.createElement("label");
  tableWrap.style.display = "grid";
  tableWrap.style.gap = "4px";
  const tableLabel = document.createElement("span");
  tableLabel.textContent = "Tabelle";
  tableLabel.style.fontSize = "12px";
  tableLabel.style.fontWeight = "700";
  tableLabel.style.color = "#334155";
  const tableSelect = document.createElement("select");
  tableSelect.style.width = "100%";
  tableSelect.style.boxSizing = "border-box";
  tableWrap.append(tableLabel, tableSelect);

  const tableInfo = document.createElement("div");
  tableInfo.style.fontSize = "12px";
  tableInfo.style.color = "#475569";

  contextGrid.append(moduleWrap, tableWrap);
  contextCard.append(contextTitle, contextHint, contextGrid, tableInfo);

  const toolbar = document.createElement("div");
  toolbar.style.display = "flex";
  toolbar.style.flexWrap = "wrap";
  toolbar.style.gap = "8px";
  toolbar.style.alignItems = "center";

  const orientationWrap = document.createElement("label");
  orientationWrap.style.display = "inline-flex";
  orientationWrap.style.alignItems = "center";
  orientationWrap.style.gap = "6px";
  orientationWrap.style.fontSize = "12px";
  orientationWrap.style.fontWeight = "700";
  orientationWrap.style.color = "#334155";
  orientationWrap.textContent = "Orientierung";
  const orientationSelect = document.createElement("select");
  for (const value of ["portrait", "landscape"]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    orientationSelect.appendChild(option);
  }
  fields.set("orientation", orientationSelect);
  orientationWrap.appendChild(orientationSelect);

  const btnReload = document.createElement("button");
  btnReload.type = "button";
  btnReload.textContent = "Laden";
  applyPopupButtonStyle(btnReload);

  const btnSave = document.createElement("button");
  btnSave.type = "button";
  btnSave.textContent = "Tabelle speichern";
  btnSave.title = "Speichert nur die aktuell gewählte Tabelle; kein globales Layout.";
  applyPopupButtonStyle(btnSave, { variant: "primary" });

  const btnReset = document.createElement("button");
  btnReset.type = "button";
  btnReset.textContent = "Diese Tabelle auf Standard zurücksetzen";
  btnReset.title = "Reset betrifft nur die aktuell gewählte Kombination aus Modul, Tabelle und Orientierung.";
  applyPopupButtonStyle(btnReset);

  const status = document.createElement("div");
  status.style.fontSize = "12px";
  status.style.minHeight = "16px";
  status.style.color = "#475569";

  toolbar.append(orientationWrap, btnReload, btnSave, btnReset, status);

  const actionHint = document.createElement("div");
  actionHint.style.fontSize = "12px";
  actionHint.style.lineHeight = "1.4";
  actionHint.style.opacity = "0.82";
  actionHint.style.color = "#334155";

  const formCard = document.createElement("div");
  applyPopupCardStyle(formCard);
  formCard.style.padding = "10px";
  formCard.style.display = "grid";
  formCard.style.gap = "10px";

  const makeSection = (titleText, hintText) => {
    const box = document.createElement("div");
    box.style.display = "grid";
    box.style.gap = "8px";
    const h = document.createElement("div");
    h.textContent = titleText;
    h.style.fontWeight = "800";
    const t = document.createElement("div");
    t.textContent = hintText;
    t.style.fontSize = "12px";
    t.style.opacity = "0.78";
    box.append(h, t);
    return box;
  };

  const columnsSection = makeSection(
    "Spalten",
    "Der Editor erzeugt die Eingabefelder aus der registrierten Spaltendefinition. UI-Werte steuern die App-Spaltenbreiten, PDF-Werte nur PDF-Breiten in angeschlossenen Druckpfaden."
  );
  columnsSection.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
  columnsSection.style.paddingBottom = "8px";
  const columnsGrid = document.createElement("div");
  columnsGrid.style.display = "grid";
  columnsGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(260px, 1fr))";
  columnsGrid.style.gap = "8px";
  columnsSection.append(columnsGrid);

  const _setFieldValue = (input, value) => {
    if (!input) return;
    input.value = String(value == null ? "" : value);
  };

  const _buildTableColumnsFromFields = (definition) => {
    const fallbackColumns = _cloneColumns(definition?.columns || []);
    const columns = [];
    for (const fallback of fallbackColumns) {
      const baseKey = _normalizeId(fallback.key);
      const headerInput = fields.get(_columnFieldKey(baseKey, "headerLines"));
      const uiWidthInput = fields.get(_columnFieldKey(baseKey, "uiWidth"));
      const pdfWidthInput = fields.get(_columnFieldKey(baseKey, "pdfWidth"));
      const weightInput = fields.get(_columnFieldKey(baseKey, "weight"));
      const previewValueInput = fields.get(_columnFieldKey(baseKey, "previewValue"));
      const headerLines = _normalizeHeaderLinesInput(headerInput?.value, fallback.headerLines);
      const label = String(headerLines[0] ?? "").trim();
      columns.push({
        key: baseKey,
        label,
        uiWidth: String(uiWidthInput?.value ?? "").trim(),
        pdfWidth: String(pdfWidthInput?.value ?? "").trim(),
        weight: String(weightInput?.value ?? "").trim(),
        required: !!fallback.required,
        previewValue: String(previewValueInput?.value ?? "").trim(),
        headerLines,
      });
    }
    return columns;
  };

  const _syncColumnFields = (definition, values = {}) => {
    const valueColumns = Array.isArray(values.columns) ? values.columns : [];
    const byKey = new Map(valueColumns.filter((column) => column && column.key).map((column) => [String(column.key), column]));
    for (const fallback of _cloneColumns(definition?.columns || [])) {
      const baseKey = _normalizeId(fallback.key);
      const column = byKey.get(baseKey) || fallback;
      const headerInput = fields.get(_columnFieldKey(baseKey, "headerLines"));
      const uiWidthInput = fields.get(_columnFieldKey(baseKey, "uiWidth"));
      const pdfWidthInput = fields.get(_columnFieldKey(baseKey, "pdfWidth"));
      const weightInput = fields.get(_columnFieldKey(baseKey, "weight"));
      const previewValueInput = fields.get(_columnFieldKey(baseKey, "previewValue"));
      _setFieldValue(headerInput, Array.isArray(column.headerLines) ? column.headerLines.join("\n") : column.label || fallback.label || "");
      _setFieldValue(uiWidthInput, column.uiWidth || fallback.uiWidth || "");
      _setFieldValue(pdfWidthInput, column.pdfWidth || fallback.pdfWidth || "");
      _setFieldValue(weightInput, column.weight ?? fallback.weight ?? 1);
      _setFieldValue(previewValueInput, column.previewValue || fallback.previewValue || "");
    }
  };

  const _renderColumnEditors = (definition, values = {}) => {
    fields.clear();
    fields.set("orientation", orientationSelect);
    columnsGrid.innerHTML = "";
    const columns = _cloneColumns(definition?.columns || []);
    if (!columns.length) {
      const empty = document.createElement("div");
      empty.style.fontSize = "12px";
      empty.style.color = "#64748b";
      empty.textContent = "Für diese Tabelle sind keine Spalten registriert.";
      columnsGrid.appendChild(empty);
      return;
    }

    for (const column of columns) {
      const card = document.createElement("div");
      card.style.display = "grid";
      card.style.gap = "8px";
      card.style.padding = "10px";
      card.style.border = "1px solid rgba(15,23,42,0.12)";
      card.style.borderRadius = "10px";
      card.style.background = "#fff";
      card.style.minWidth = "0";

      const cardHead = document.createElement("div");
      cardHead.style.display = "flex";
      cardHead.style.justifyContent = "space-between";
      cardHead.style.alignItems = "center";
      cardHead.style.gap = "8px";
      const cardTitle = document.createElement("div");
      cardTitle.style.fontWeight = "800";
      cardTitle.textContent = column.label || column.key || "Spalte";
      const cardMeta = document.createElement("div");
      cardMeta.style.fontSize = "12px";
      cardMeta.style.color = "#64748b";
      cardMeta.textContent = `${column.key}${column.required ? " · Pflicht" : ""}${Number(column.weight) > 0 ? ` · Gewicht ${column.weight}` : ""}`;
      cardHead.append(cardTitle, cardMeta);

      const formGrid = document.createElement("div");
      formGrid.style.display = "grid";
      formGrid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
      formGrid.style.gap = "8px";

      const headerField = _createField(
        "Überschrift",
        Array.isArray(column.headerLines) ? column.headerLines.join("\n") : column.label || "",
        { multiline: true, rows: Math.max(2, Array.isArray(column.headerLines) ? column.headerLines.length : 2) }
      );
      headerField.input.dataset.columnKey = column.key;
      headerField.input.dataset.fieldKey = "headerLines";
      headerField.input.style.minHeight = "72px";
      headerField.input.disabled = !!state.busy;
      fields.set(_columnFieldKey(column.key, "headerLines"), headerField.input);

      const uiWidthField = _createField("UI-Breite", column.uiWidth || "");
      uiWidthField.input.dataset.columnKey = column.key;
      uiWidthField.input.dataset.fieldKey = "uiWidth";
      uiWidthField.input.disabled = !!state.busy;
      fields.set(_columnFieldKey(column.key, "uiWidth"), uiWidthField.input);

      const pdfWidthField = _createField("PDF-Breite", column.pdfWidth || "");
      pdfWidthField.input.dataset.columnKey = column.key;
      pdfWidthField.input.dataset.fieldKey = "pdfWidth";
      pdfWidthField.input.disabled = !!state.busy;
      fields.set(_columnFieldKey(column.key, "pdfWidth"), pdfWidthField.input);

      const weightField = _createField("Gewichtung", column.weight ?? 1);
      weightField.input.type = "number";
      weightField.input.min = "1";
      weightField.input.step = "1";
      weightField.input.dataset.columnKey = column.key;
      weightField.input.dataset.fieldKey = "weight";
      weightField.input.disabled = !!state.busy;
      fields.set(_columnFieldKey(column.key, "weight"), weightField.input);

      const previewField = _createField("Preview-Wert", column.previewValue || "");
      previewField.input.dataset.columnKey = column.key;
      previewField.input.dataset.fieldKey = "previewValue";
      previewField.input.disabled = !!state.busy;
      fields.set(_columnFieldKey(column.key, "previewValue"), previewField.input);

      const handleColumnInput = () => {
        const currentTableDef = _getSelectedTableDefinition();
        state.editValues = {
          orientation: _normalizeOrientation(orientationSelect.value || state.orientation),
          columns: currentTableDef ? _buildTableColumnsFromFields(currentTableDef) : [],
        };
        state.testResult = "";
        state.error = "";
        refreshPreview();
      };
      headerField.input.addEventListener("input", handleColumnInput);
      uiWidthField.input.addEventListener("input", handleColumnInput);
      pdfWidthField.input.addEventListener("input", handleColumnInput);
      weightField.input.addEventListener("input", handleColumnInput);
      previewField.input.addEventListener("input", handleColumnInput);

      formGrid.append(
        headerField.row,
        uiWidthField.row,
        pdfWidthField.row,
        weightField.row,
        previewField.row
      );
      card.append(cardHead, formGrid);
      columnsGrid.appendChild(card);
    }

    _syncColumnFields(definition, values);
  };

  const previewCard = document.createElement("div");
  applyPopupCardStyle(previewCard);
  previewCard.style.padding = "10px";
  previewCard.style.display = "grid";
  previewCard.style.gap = "8px";
  previewCard.style.minHeight = "280px";
  const previewTitle = document.createElement("div");
  previewTitle.textContent = "Editor-Vorschau mit Testdaten";
  previewTitle.style.fontWeight = "800";
  const previewHint = document.createElement("div");
  previewHint.textContent =
    "Registrierte Beispielzeilen aus der Tabellenregistry. Keine Projekt- oder Besprechungsdaten.";
  previewHint.style.fontSize = "12px";
  previewHint.style.opacity = "0.78";
  const previewNote = document.createElement("div");
  previewNote.textContent =
    "Diese Vorschau erzeugt kein PDF. Der echte PDF-Test mit Testdaten wird später separat ergänzt.";
  previewNote.style.fontSize = "12px";
  previewNote.style.color = "#7c2d12";
  previewNote.style.opacity = "0.9";
  const previewSwitchRow = document.createElement("div");
  previewSwitchRow.style.display = "inline-flex";
  previewSwitchRow.style.flexWrap = "wrap";
  previewSwitchRow.style.gap = "6px";
  previewSwitchRow.style.alignItems = "center";

  const previewUiButton = document.createElement("button");
  previewUiButton.type = "button";
  previewUiButton.textContent = "UI-Vorschau";
  applyPopupButtonStyle(previewUiButton);

  const previewPdfButton = document.createElement("button");
  previewPdfButton.type = "button";
  previewPdfButton.textContent = "PDF-Vorschau";
  applyPopupButtonStyle(previewPdfButton);

  const previewPane = document.createElement("div");
  previewPane.style.minWidth = "0";
  previewPane.style.minHeight = "0";
  previewPane.style.overflow = "auto";
  previewPane.style.display = "grid";
  previewPane.style.gap = "8px";

  previewSwitchRow.append(previewUiButton, previewPdfButton);
  previewCard.append(previewTitle, previewHint, previewNote, previewSwitchRow, previewPane);

  const fieldsCard = document.createElement("div");
  applyPopupCardStyle(fieldsCard);
  fieldsCard.style.padding = "10px";
  fieldsCard.style.display = "grid";
  fieldsCard.style.gap = "10px";
  fieldsCard.append(columnsSection);

  root.append(head, contextCard, toolbar, actionHint, fieldsCard, previewCard);
  const attachFullscreenHost = (host) => {
    fullscreenHost = host || null;
    _applyHostFullscreenState();
  };

  const _getHostModal = () => fullscreenHost || root?.closest?.('[data-table-layout-shell="1"]') || null;

  const _applyHostFullscreenState = () => {
    const host = _getHostModal();
    const fullscreen = !!state.isFullscreen;
    root.dataset.layoutMode = fullscreen ? "fullscreen" : "normal";
    fullscreenButton.textContent = fullscreen ? "Normalgröße" : "Vollbild";
    if (!host) return;
    host.dataset.layoutMode = fullscreen ? "fullscreen" : "normal";
    if (fullscreen) {
      host.style.width = "min(98vw, 1920px)";
      host.style.height = "94vh";
      host.style.maxHeight = "94vh";
      host.style.maxWidth = "none";
    } else {
      host.style.width = "min(980px, calc(100vw - 24px))";
      host.style.height = "";
      host.style.maxHeight = "calc(100vh - 24px)";
      host.style.maxWidth = "";
    }
    if (fullscreen) {
      host.style.position = "fixed";
      host.style.inset = "8px";
      host.style.margin = "0";
      host.style.width = "auto";
      host.style.height = "auto";
      host.style.maxHeight = "none";
      host.style.maxWidth = "none";
      host.style.transform = "none";
    } else {
      host.style.position = "";
      host.style.inset = "";
      host.style.margin = "";
      host.style.transform = "";
    }
  };

  const _setFullscreen = (next) => {
    state.isFullscreen = !!next;
    _applyHostFullscreenState();
  };

  const _setPreviewMode = (mode) => {
    state.previewMode = mode === "pdf" ? "pdf" : "ui";
    previewUiButton.dataset.active = state.previewMode === "ui" ? "1" : "0";
    previewPdfButton.dataset.active = state.previewMode === "pdf" ? "1" : "0";
    previewUiButton.setAttribute("aria-pressed", state.previewMode === "ui" ? "true" : "false");
    previewPdfButton.setAttribute("aria-pressed", state.previewMode === "pdf" ? "true" : "false");
    previewUiButton.style.opacity = state.previewMode === "ui" ? "1" : "0.75";
    previewPdfButton.style.opacity = state.previewMode === "pdf" ? "1" : "0.75";
    previewUiButton.style.outline = state.previewMode === "ui" ? "2px solid #2563eb" : "";
    previewPdfButton.style.outline = state.previewMode === "pdf" ? "2px solid #2563eb" : "";
  };

  const _getSelectedModuleDefinition = () =>
    state.moduleDefinitions.find((item) => _normalizeId(item?.moduleId) === _normalizeId(state.selectedModuleId)) || null;

  const _getSelectedTableDefinition = () =>
    state.tableDefinitions.find(
      (item) =>
        _normalizeId(item?.moduleId) === _normalizeId(state.selectedModuleId) &&
        _normalizeId(item?.tableKey) === _normalizeId(state.selectedTableKey)
    ) || null;

  const _renderModuleOptions = () => {
    const defs = Array.isArray(state.moduleDefinitions) ? state.moduleDefinitions : [];
    const current = _normalizeId(state.selectedModuleId) || _normalizeId(defs[0]?.moduleId);
    moduleSelect.innerHTML = "";
    for (const def of defs) {
      const option = document.createElement("option");
      option.value = _normalizeId(def.moduleId);
      option.textContent = _formatText(def.moduleLabel, def.moduleId || "Protokoll");
      moduleSelect.appendChild(option);
    }
    const next = defs.some((def) => _normalizeId(def.moduleId) === current) ? current : _normalizeId(defs[0]?.moduleId);
    moduleSelect.value = next || "";
    state.selectedModuleId = _normalizeId(moduleSelect.value);
    moduleSelect.disabled = !defs.length;
  };

  const _renderTableOptions = () => {
    const moduleId = _normalizeId(state.selectedModuleId);
    const defs = state.tableDefinitions.filter((item) => _normalizeId(item?.moduleId) === moduleId);
    const current = _normalizeId(state.selectedTableKey) || _normalizeId(defs[0]?.tableKey);
    tableSelect.innerHTML = "";
    for (const def of defs) {
      const option = document.createElement("option");
      option.value = _normalizeId(def.tableKey);
      option.textContent = _formatText(def.tableLabel, def.tableKey || "TOP-Liste");
      tableSelect.appendChild(option);
    }
    const next = defs.some((def) => _normalizeId(def.tableKey) === current) ? current : _normalizeId(defs[0]?.tableKey);
    tableSelect.value = next || "";
    state.selectedTableKey = _normalizeId(tableSelect.value);
    tableSelect.disabled = !defs.length;
    const def = _getSelectedTableDefinition();
    tableInfo.textContent = def
      ? `Aktive Tabelle: ${def.tableLabel || "TOP-Liste"} | tableKey: ${def.tableKey}`
      : "Aktive Tabelle: - | tableKey: -";
  };

  const _syncSelectionFromDefinitions = () => {
    const moduleDefs = Array.isArray(state.moduleDefinitions) ? state.moduleDefinitions : [];
    if (!moduleDefs.length) {
      state.selectedModuleId = "";
      state.selectedTableKey = "";
      return;
    }
    if (!moduleDefs.some((item) => _normalizeId(item.moduleId) === _normalizeId(state.selectedModuleId))) {
      state.selectedModuleId = _normalizeId(moduleDefs[0]?.moduleId);
    }
    const moduleDef = _getSelectedModuleDefinition();
    const tableDefs = Array.isArray(moduleDef?.tables) ? moduleDef.tables : [];
    if (!tableDefs.length) {
      state.selectedTableKey = "";
      return;
    }
    if (!tableDefs.some((item) => _normalizeId(item.tableKey) === _normalizeId(state.selectedTableKey))) {
      state.selectedTableKey = _normalizeId(tableDefs[0]?.tableKey);
    }
  };

  const _updateContextStatus = () => {
    const moduleDef = _getSelectedModuleDefinition();
    const tableDef = _getSelectedTableDefinition();
    const hints = _getTableLayoutEditorHints(tableDef || {});
    contextCard.dataset.moduleId = state.selectedModuleId || "";
    contextCard.dataset.tableKey = state.selectedTableKey || "";
    contextCard.dataset.orientation = state.orientation;
    const moduleLabel = moduleDef?.moduleLabel || "-";
    const tableLabel = tableDef?.tableLabel || "-";
    const tableKey = tableDef?.tableKey || "-";
    const sourceLabel = formatSourceLabel();
    targetInfoModule.textContent = `Modul: ${moduleLabel}`;
    targetInfoTable.textContent = `Tabelle: ${tableLabel}`;
    targetInfoKey.textContent = `tableKey: ${tableKey}`;
    targetInfoOrientation.textContent = `Orientierung: ${state.orientation}`;
    targetInfoSource.textContent = `Quelle: ${sourceLabel}`;
    contextHint.textContent =
      [
        "Modul- und Tabellenliste kommen aus der zentralen Registry. Die Layoutauswahl ist modul- und tabellenbezogen, nicht projektbezogen.",
        hints.uiHint,
        hints.pdfHint,
      ].join(" ");
    actionHint.textContent = `${hints.saveHint} ${hints.resetHint}`;
    tableInfo.textContent = [
      `Modul: ${moduleLabel}`,
      `Tabelle: ${tableLabel}`,
      `tableKey: ${tableKey}`,
      `Orientierung: ${state.orientation}`,
      `Quelle: ${sourceLabel}`,
    ].join(" | ");
    return tableInfo.textContent;
  };

  const _updateTestPdfState = (validation = { errors: {} }, tableDef = null) => {
    const errors = validation?.errors || {};
    const columns = Array.isArray(tableDef?.columns) ? tableDef.columns : [];
    const fieldLabelMap = new Map();
    for (const column of columns) {
      const columnLabel = String(column?.label || column?.key || "").trim();
      fieldLabelMap.set(_columnFieldKey(column.key, "headerLines"), `${columnLabel} Überschrift`);
      fieldLabelMap.set(_columnFieldKey(column.key, "uiWidth"), `${columnLabel} UI-Breite`);
      fieldLabelMap.set(_columnFieldKey(column.key, "pdfWidth"), `${columnLabel} PDF-Breite`);
      fieldLabelMap.set(_columnFieldKey(column.key, "weight"), `${columnLabel} Gewichtung`);
      fieldLabelMap.set(_columnFieldKey(column.key, "previewValue"), `${columnLabel} Preview-Wert`);
      fieldLabelMap.set(_columnFieldKey(column.key, "label"), `${columnLabel} Überschrift`);
    }
    const messages = Object.entries(errors).map(([fieldKey, message]) => {
      const label =
        fieldLabelMap.get(fieldKey) ||
        fieldLabelMap.get(fieldKey.replace(/\.headerLines\.\d+$/, ".headerLines")) ||
        fieldKey;
      return `${message}: ${label}`;
    });

    state.validationErrors = errors;
    state.validationMessage = messages.join(" | ");
    state.hasValidationErrors = messages.length > 0;

    for (const [key, input] of fields.entries()) {
      if (!input || key === "orientation") continue;
      const error =
        errors[key] ||
        errors[key.replace(/\.headerLines$/, ".label")] ||
        Object.entries(errors).find(([errorKey]) => errorKey.startsWith(`${key}.headerLines`))?.[1] ||
        "";
      input.dataset.validationError = error ? "1" : "0";
      input.title = error ? error : "";
      input.style.borderColor = error ? "#dc2626" : "";
      input.style.outline = error ? "2px solid rgba(220,38,38,0.35)" : "";
    }

    btnSave.disabled = state.busy || state.hasValidationErrors;
    btnSave.style.opacity = btnSave.disabled ? "0.65" : "1";

    const hasDirty = _hasDirtyValuesState(state);
    const parts = [`Quelle: ${formatSourceLabel()}`];
    if (hasDirty) parts.push("Layoutwerte wurden geaendert.");
    if (state.error && !state.hasValidationErrors) parts.push(state.error);
    if (state.validationMessage) parts.push(state.validationMessage);
    status.textContent = parts.join(" | ");
    status.style.color = state.error || state.hasValidationErrors || hasDirty ? "#b91c1c" : "#475569";
  };

  const loadTableDefinitions = async () => {
    if (typeof resolvedApi?.tableLayoutsListDefinitions !== "function") {
      state.contextError = "Tabellenregistry nicht verfuegbar.";
      state.moduleDefinitions = [];
      state.tableDefinitions = [];
      _renderModuleOptions();
      _renderTableOptions();
      _renderColumnEditors({ columns: [] }, { columns: [] });
      _updateContextStatus();
      _updateTestPdfState();
      return { ok: false, error: state.contextError };
    }
    const res = await resolvedApi.tableLayoutsListDefinitions();
    if (!res?.ok) {
      state.contextError = res?.error || "Tabellenregistry konnte nicht geladen werden.";
      state.moduleDefinitions = [];
      state.tableDefinitions = [];
      _renderModuleOptions();
      _renderTableOptions();
      _renderColumnEditors({ columns: [] }, { columns: [] });
      _updateContextStatus();
      _updateTestPdfState();
      return res;
    }
    const list = _normalizeDefinitionsList(Array.isArray(res.data) ? res.data : []);
    state.tableDefinitions = list;
    state.moduleDefinitions = _groupModuleDefinitions(list);
    _syncSelectionFromDefinitions();
    state.contextError = "";
    _renderModuleOptions();
    _renderTableOptions();
    const tableDef = _getSelectedTableDefinition();
    _renderColumnEditors(tableDef, tableDef?.defaultLayout || { columns: tableDef?.columns || [] });
    _updateContextStatus();
    _updateTestPdfState();
    return res;
  };

  const setBusy = (busy) => {
    state.busy = !!busy;
    orientationSelect.disabled = state.busy;
    btnReload.disabled = state.busy;
    btnSave.disabled = state.busy;
    btnReset.disabled = state.busy;
    moduleSelect.disabled = state.busy;
    tableSelect.disabled = state.busy;
    for (const input of fields.values()) {
      if (!input) continue;
      input.disabled = state.busy;
    }
    btnReload.style.opacity = btnReload.disabled ? "0.65" : "1";
    btnSave.style.opacity = btnSave.disabled ? "0.65" : "1";
    btnReset.style.opacity = btnReset.disabled ? "0.65" : "1";
    moduleSelect.style.opacity = moduleSelect.disabled ? "0.65" : "1";
    tableSelect.style.opacity = tableSelect.disabled ? "0.65" : "1";
    _updateTestPdfState();
  };

  const refreshPreview = () => {
    const tableDef = _getSelectedTableDefinition();
    const activeValues = _getPreviewValue(state);
    const validation = _validateTableLayoutColumns(activeValues?.columns || [], tableDef?.columns || []);
    const previewValues = {
      orientation: _normalizeOrientation(activeValues?.orientation || state.orientation),
      columns: validation.columns,
      source: state.source,
    };
    root.dataset.orientation = state.orientation;
    root.dataset.source = state.source;
    root.dataset.moduleId = state.selectedModuleId || "";
    root.dataset.tableKey = state.selectedTableKey || "";
    targetInfoOrientation.textContent = `Orientierung: ${state.orientation}`;
    targetInfoSource.textContent = `Quelle: ${formatSourceLabel()}`;
    _updateContextStatus();
    _setPreviewMode(state.previewMode);
    _renderPreviewPanel(previewPane, tableDef, previewValues, state.previewMode);
    if (status) {
      const sourceText = formatSourceLabel();
      const parseText = state.parseError ? ` | Parse: ${state.parseError}` : "";
      const errorText = state.error && !validation.isValid ? ` | ${state.error}` : state.error ? ` | ${state.error}` : "";
      status.textContent = `Quelle: ${sourceText}${parseText}${errorText}`;
      status.style.color = state.error || !validation.isValid ? "#b91c1c" : "#475569";
    }
    _updateTestPdfState(validation, tableDef);
  };

  const syncLoadedValues = (layout, meta = {}, tableDef = null) => {
    const definitionColumns = _cloneColumns(tableDef?.columns || []);
    const layoutColumns =
      Array.isArray(layout?.columns) && layout.columns.length
        ? _normalizeTableLayoutColumns(layout.columns, definitionColumns)
        : _normalizeTableLayoutColumns(
            tableDef?.tableKey === "protokoll_tops" ? _buildProtokollTopsColumnsFromLegacy(layout || {}) : [],
            definitionColumns
          );
    const values = {
      orientation: _normalizeOrientation(meta.requestedOrientation || layout?.variant || layout?.orientation || DEFAULT_ORIENTATION),
      columns: layoutColumns.length ? layoutColumns : definitionColumns,
    };
    state.orientation = values.orientation;
    state.schemaVersion = Number(meta.schemaVersion || layout?.schemaVersion || 1) || 1;
    state.source = String(meta.source || "default").trim() || "default";
    state.parseError = String(meta.parseError || layout?.parseError || "").trim();
    state.loadedValues = values;
    state.editValues = _cloneJson(values);
    state.testResult = "";
    orientationSelect.value = values.orientation;
    _renderColumnEditors(tableDef, values);
    refreshPreview();
  };

  const load = async () => {
    if (typeof resolvedApi?.tableLayoutsGetOne !== "function") {
      state.error = "Table-Layout-IPC nicht verfügbar.";
      refreshPreview();
      return { ok: false, error: state.error };
    }
    setBusy(true);
    state.error = "";
    state.contextLoading = true;
    try {
      await loadTableDefinitions();
      _renderModuleOptions();
      _renderTableOptions();
      const requestedOrientation = _normalizeOrientation(orientationSelect.value || state.orientation);
      state.orientation = requestedOrientation;
      const tableDef = _getSelectedTableDefinition();
      if (!tableDef) {
        state.error = state.contextError || "Keine Tabellen-Definition verfuegbar.";
        _renderColumnEditors({ columns: [] }, { columns: [] });
        refreshPreview();
        return { ok: false, error: state.error };
      }
      _renderColumnEditors(tableDef, tableDef.defaultLayout || { columns: tableDef.columns || [] });
      const res = await resolvedApi.tableLayoutsGetOne({
        tableKey: tableDef.tableKey,
        moduleId: tableDef.moduleId,
        orientation: requestedOrientation,
      });
      if (!res?.ok) {
        state.error = res?.error || "Layout konnte nicht geladen werden.";
        syncLoadedValues(tableDef.defaultLayout || { columns: tableDef.columns || [] }, {
          source: "default",
          requestedOrientation,
        }, tableDef);
        refreshPreview();
        return res;
      }
      const data = res.data || {};
      syncLoadedValues(data.effectiveLayout || data.defaultLayout || tableDef.defaultLayout || { columns: tableDef.columns || [] }, {
        ...data,
        requestedOrientation,
      }, tableDef);
      return res;
    } catch (err) {
      state.error = err?.message || String(err);
      const tableDef = _getSelectedTableDefinition();
      if (tableDef) {
        syncLoadedValues(tableDef.defaultLayout || { columns: tableDef.columns || [] }, {
          source: "default",
          requestedOrientation: _normalizeOrientation(orientationSelect.value || state.orientation),
        }, tableDef);
      }
      refreshPreview();
      return { ok: false, error: state.error };
    } finally {
      state.contextLoading = false;
      setBusy(false);
    }
  };

  const save = async () => {
    if (typeof resolvedApi?.tableLayoutsSave !== "function") {
      state.error = "Table-Layout-Save-IPC nicht verfügbar.";
      refreshPreview();
      return { ok: false, error: state.error };
    }
    setBusy(true);
    state.error = "";
    try {
      const tableDef = _getSelectedTableDefinition();
      if (!tableDef) {
        state.error = state.contextError || "Keine Tabellen-Definition verfuegbar.";
        refreshPreview();
        return { ok: false, error: state.error };
      }
      const values = {
        orientation: _normalizeOrientation(orientationSelect.value || state.orientation),
        columns: _buildTableColumnsFromFields(tableDef),
      };
      values.orientation = _normalizeOrientation(orientationSelect.value || values.orientation);
      state.editValues = values;
      state.testResult = "";
      const validation = _validateTableLayoutColumns(values.columns || [], tableDef.columns || []);
      if (!validation.isValid) {
        state.error =
          validation.errors?.[`${validation.columns?.[0]?.key || ""}.uiWidth`] ||
          validation.errors?.[`${validation.columns?.[0]?.key || ""}.pdfWidth`] ||
          validation.errors?.[`${validation.columns?.[0]?.key || ""}.label`] ||
          validation.errors?.[`${validation.columns?.[0]?.key || ""}.headerLines.0`] ||
          Object.values(validation.errors || {})[0] ||
          "Ungültiger Spaltenwert";
        refreshPreview();
        return { ok: false, error: state.error, validationErrors: validation.errors };
      }
      const layout =
        tableDef.tableKey === "protokoll_tops"
          ? buildProtokollTopsLayoutOverlay({ columns: validation.columns }, values.orientation)
          : _buildTableLayoutOverlayFromColumns(validation.columns, values.orientation);
      const res = await resolvedApi.tableLayoutsSave({
        tableKey: tableDef.tableKey,
        moduleId: tableDef.moduleId,
        orientation: values.orientation,
        schemaVersion: state.schemaVersion,
        layout,
      });
      if (!res?.ok) {
        state.error = res?.error || "Layout konnte nicht gespeichert werden.";
        refreshPreview();
        return res;
      }
      const data = res.data || {};
      syncLoadedValues(data.effectiveLayout || data.defaultLayout || {}, data, tableDef);
      state.error = "";
      refreshPreview();
      return res;
    } catch (err) {
      state.error = err?.message || String(err);
      refreshPreview();
      return { ok: false, error: state.error };
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (typeof resolvedApi?.tableLayoutsReset !== "function") {
      state.error = "Table-Layout-Reset-IPC nicht verfügbar.";
      refreshPreview();
      return { ok: false, error: state.error };
    }
    setBusy(true);
    state.error = "";
    try {
      const tableDef = _getSelectedTableDefinition();
      if (!tableDef) {
        state.error = state.contextError || "Keine Tabellen-Definition verfuegbar.";
        refreshPreview();
        return { ok: false, error: state.error };
      }
      const res = await resolvedApi.tableLayoutsReset({
        tableKey: tableDef.tableKey,
        moduleId: tableDef.moduleId,
        orientation: _normalizeOrientation(orientationSelect.value),
      });
      if (!res?.ok) {
        state.error = res?.error || "Layout konnte nicht zurückgesetzt werden.";
        refreshPreview();
        return res;
      }
      state.error = "";
      state.testResult = "";
      await load();
      return res;
    } catch (err) {
      state.error = err?.message || String(err);
      refreshPreview();
      return { ok: false, error: state.error };
    } finally {
      setBusy(false);
    }
  };

  const applyValues = (values = {}) => {
    const tableDef = _getSelectedTableDefinition();
    const orientation = _normalizeOrientation(values.orientation || orientationSelect.value || state.orientation);
    const currentColumns = Array.isArray(state.editValues.columns) && state.editValues.columns.length
      ? _cloneColumns(state.editValues.columns)
      : _cloneColumns(tableDef?.columns || []);
    let next = {
      orientation,
      columns: Array.isArray(values.columns) ? _cloneColumns(values.columns) : _cloneColumns(state.editValues.columns || []),
    };
    if (!Array.isArray(values.columns) && tableDef?.tableKey === "protokoll_tops") {
      const topCol = currentColumns[0] || {};
      const textCol = currentColumns[1] || {};
      const metaCol = currentColumns[2] || {};
      next = {
        orientation,
        columns: [
          {
            key: "topNumber",
            label: String(values.labelTop ?? topCol.label ?? DEFAULT_VALUES.labelTop),
            uiWidth: String(values.uiNumberWidth ?? topCol.uiWidth ?? ""),
            pdfWidth: String(values.pdfNumberWidth ?? topCol.pdfWidth ?? ""),
            weight: 2,
            required: true,
            previewValue: "1",
            headerLines: [String(values.labelTop ?? topCol.headerLines?.[0] ?? topCol.label ?? DEFAULT_VALUES.labelTop)],
          },
          {
            key: "shortText",
            label: String(values.labelText ?? textCol.label ?? DEFAULT_VALUES.labelText),
            uiWidth: String(values.uiTextTrack ?? textCol.uiWidth ?? ""),
            pdfWidth: String(values.pdfTextWidth ?? textCol.pdfWidth ?? ""),
            weight: 6,
            required: true,
            previewValue: "Beispielthema fuer die Vorschau",
            headerLines: [String(values.labelText ?? textCol.headerLines?.[0] ?? textCol.label ?? DEFAULT_VALUES.labelText)],
          },
          {
            key: "meta",
            label: String(values.labelMeta1 ?? metaCol.label ?? DEFAULT_VALUES.labelMeta1),
            uiWidth: String(values.uiMetaWidth ?? metaCol.uiWidth ?? ""),
            pdfWidth: String(values.pdfMetaWidth ?? metaCol.pdfWidth ?? ""),
            weight: 1,
            required: true,
            previewValue: "offen",
            headerLines: [
              String(values.labelMeta1 ?? metaCol.headerLines?.[0] ?? metaCol.label ?? DEFAULT_VALUES.labelMeta1),
              String(values.labelMeta2 ?? metaCol.headerLines?.[1] ?? DEFAULT_VALUES.labelMeta2),
              String(values.labelMeta3 ?? metaCol.headerLines?.[2] ?? DEFAULT_VALUES.labelMeta3),
            ],
          },
        ],
      };
    } else if (!Array.isArray(values.columns) && tableDef?.columns) {
      next = {
        orientation,
        columns: _cloneColumns(tableDef.columns),
      };
    }
    state.orientation = next.orientation;
    state.editValues = next;
    state.testResult = "";
    orientationSelect.value = next.orientation;
    _syncColumnFields(tableDef, next);
    refreshPreview();
  };

  fullscreenButton.addEventListener("click", () => {
    _setFullscreen(!state.isFullscreen);
  });

  previewUiButton.addEventListener("click", () => {
    if (state.previewMode === "ui") return;
    state.previewMode = "ui";
    refreshPreview();
  });
  previewPdfButton.addEventListener("click", () => {
    if (state.previewMode === "pdf") return;
    state.previewMode = "pdf";
    refreshPreview();
  });

  orientationSelect.addEventListener("change", async () => {
    state.orientation = _normalizeOrientation(orientationSelect.value);
    state.editValues.orientation = state.orientation;
    state.testResult = "";
    await load();
  });
  moduleSelect.addEventListener("change", async () => {
    state.selectedModuleId = _normalizeId(moduleSelect.value);
    const moduleDef = _getSelectedModuleDefinition();
    state.selectedTableKey = _normalizeId(_getFirstSupportedTable(moduleDef)?.tableKey);
    state.testResult = "";
    _renderTableOptions();
    refreshPreview();
    await load();
  });
  tableSelect.addEventListener("change", async () => {
    state.selectedTableKey = _normalizeId(tableSelect.value);
    state.testResult = "";
    _renderTableOptions();
    refreshPreview();
    await load();
  });
  btnReload.addEventListener("click", () => load());
  btnSave.addEventListener("click", () => save());
  btnReset.addEventListener("click", () => reset());
  for (const input of fields.values()) {
    if (!input) continue;
    input.addEventListener("input", () => {
      const tableDef = _getSelectedTableDefinition();
      state.editValues = {
        orientation: _normalizeOrientation(orientationSelect.value),
        columns: tableDef ? _buildTableColumnsFromFields(tableDef) : [],
      };
      state.testResult = "";
      state.error = "";
      refreshPreview();
    });
  }

  _renderModuleOptions();
  _renderTableOptions();
  _updateContextStatus();
  _updateTestPdfState();
  _setPreviewMode(state.previewMode);
  _applyHostFullscreenState();
  refreshPreview();

  return {
    root,
    load,
    save,
    reset,
    applyValues,
    attachFullscreenHost,
    getValues() {
      return _cloneJson(state.editValues);
    },
  };
}
