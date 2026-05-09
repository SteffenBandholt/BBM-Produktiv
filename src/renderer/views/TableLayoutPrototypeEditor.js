import { applyPopupButtonStyle, applyPopupCardStyle } from "../ui/popupButtonStyles.js";

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

function _getPreviewModeConfig(values, mode) {
  const isPdf = mode === "pdf";
  const numberWidth = isPdf ? values.pdfNumberWidth : values.uiNumberWidth;
  const textWidth = isPdf ? values.pdfTextWidth : values.uiTextTrack;
  const metaWidth = isPdf ? values.pdfMetaWidth : values.uiMetaWidth;
  const labelPrefix = isPdf ? "PDF" : "UI";
  return {
    mode,
    isPdf,
    title: `${labelPrefix}-Vorschau mit Testdaten`,
    hint: isPdf
      ? "Registrierte Beispielzeilen aus der Tabellenregistry. PDF-Werte sind eine technische Näherung im Editor, kein echter PDF-Renderer."
      : "Registrierte Beispielzeilen aus der Tabellenregistry. Keine Projekt- oder Besprechungsdaten.",
    note: isPdf
      ? "Diese Vorschau erzeugt kein PDF. Der echte PDF-Test mit Testdaten wird später separat ergänzt."
      : "Diese Vorschau zeigt die UI-Layoutwerte des Editors.",
    numberWidth: String(numberWidth || (isPdf ? DEFAULT_VALUES.pdfNumberWidth : DEFAULT_VALUES.uiNumberWidth)),
    textWidth: String(textWidth || (isPdf ? DEFAULT_VALUES.pdfTextWidth : DEFAULT_VALUES.uiTextTrack)),
    metaWidth: String(metaWidth || (isPdf ? DEFAULT_VALUES.pdfMetaWidth : DEFAULT_VALUES.uiMetaWidth)),
    labelTop: String(values.labelTop || DEFAULT_VALUES.labelTop),
    labelText: String(values.labelText || DEFAULT_VALUES.labelText),
    labelMeta1: String(values.labelMeta1 || DEFAULT_VALUES.labelMeta1),
    labelMeta2: String(values.labelMeta2 || DEFAULT_VALUES.labelMeta2),
    labelMeta3: String(values.labelMeta3 || DEFAULT_VALUES.labelMeta3),
  };
}

function _buildPreviewGridTemplate(cfg) {
  return `${cfg.numberWidth} ${cfg.textWidth} ${cfg.metaWidth}`;
}

function _renderPreviewGridRow(target, rowData, cfg, { header = false } = {}) {
  const row = document.createElement("div");
  row.style.display = "grid";
  row.style.gridTemplateColumns = _buildPreviewGridTemplate(cfg);
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

  if (header) {
    const thTop = makeCell();
    thTop.style.fontWeight = "700";
    thTop.textContent = cfg.labelTop;

    const thText = makeCell();
    thText.style.fontWeight = "700";
    thText.textContent = cfg.labelText;

    const thMeta = makeCell();
    thMeta.style.fontWeight = "700";
    thMeta.style.display = "grid";
    thMeta.style.gap = "2px";
    for (const line of [cfg.labelMeta1, cfg.labelMeta2, cfg.labelMeta3]) {
      const span = document.createElement("div");
      span.textContent = line;
      thMeta.appendChild(span);
    }
    row.append(thTop, thText, thMeta);
    return row;
  }

  const tdTop = makeCell();
  tdTop.textContent = String(rowData.topNumber || "");

  const tdText = makeCell();
  const shortText = document.createElement("div");
  shortText.style.fontWeight = "700";
  shortText.textContent = String(rowData.shortText || "");
  tdText.appendChild(shortText);
  if (rowData.longText) {
    const longText = document.createElement("div");
    longText.style.marginTop = "4px";
    longText.style.color = "#475569";
    longText.textContent = String(rowData.longText);
    tdText.appendChild(longText);
  }

  const tdMeta = makeCell();
  tdMeta.style.display = "grid";
  tdMeta.style.gap = "2px";
  for (const line of [rowData.status, rowData.dueDate || " ", rowData.responsible || " "]) {
    const metaLine = document.createElement("div");
    metaLine.textContent = String(line || "");
    tdMeta.appendChild(metaLine);
  }
  if (rowData.ampelSymbol) {
    const symbol = document.createElement("div");
    symbol.textContent = `Ampel: ${String(rowData.ampelSymbol)}`;
    symbol.style.fontSize = "11px";
    symbol.style.color = "#64748b";
    tdMeta.appendChild(symbol);
  }

  row.append(tdTop, tdText, tdMeta);
  return row;
}

function _renderPreviewPanel(target, definition, values, mode) {
  if (!target) return;
  target.innerHTML = "";

  const cfg = _getPreviewModeConfig(values, mode);
  const rows = _getPreviewRows(definition);

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
  const activeValues = _getPreviewValue({
    ...values,
    editValues: values,
    loadedValues: values,
  });
  const summaryParts = [
    `Quelle: ${String(values.source || "default")}`,
    `Testdaten: ${rows.length} Zeilen`,
    `Orientierung: ${String(activeValues.orientation || values.orientation || DEFAULT_VALUES.orientation)}`,
    `Spaltenbreite ${mode === "pdf" ? "PDF" : "UI"}: ${cfg.numberWidth} | ${cfg.textWidth} | ${cfg.metaWidth}`,
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
  surface.dataset.previewGridColumns = _buildPreviewGridTemplate(cfg);

  surface.append(_renderPreviewGridRow(null, null, cfg, { header: true }));
  for (const rowData of rows) {
    surface.append(_renderPreviewGridRow(null, rowData, cfg, { header: false }));
  }

  target.append(panelTitle, panelHint, panelSummary, panelNote, surface);
}

export function extractProtokollTopsEditorValues(layout = {}) {
  const uiRootVars = layout?.ui?.rootVars || {};
  const pdfColumns = layout?.pdf?.columns || {};
  const labels = layout?.labels || {};
  const metaLabels = Array.isArray(labels.meta) ? labels.meta : [];
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
  };
}

export function buildProtokollTopsLayoutOverlay(values = {}, orientation = "portrait") {
  const normalized = {
    ...DEFAULT_VALUES,
    ...values,
    orientation: _normalizeOrientation(values.orientation || orientation),
  };
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

function _createField(labelText, initialValue = "") {
  const row = document.createElement("label");
  row.style.display = "grid";
  row.style.gap = "4px";
  row.style.minWidth = "0";

  const label = document.createElement("span");
  label.textContent = labelText;
  label.style.fontSize = "12px";
  label.style.fontWeight = "700";
  label.style.color = "#334155";

  const input = document.createElement("input");
  input.type = "text";
  input.value = String(initialValue ?? "");
  input.style.width = "100%";
  input.style.boxSizing = "border-box";

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
    loadedValues: extractProtokollTopsEditorValues({ variant: "portrait" }),
    editValues: extractProtokollTopsEditorValues({ variant: "portrait" }),
    busy: false,
    error: "",
    testResult: "",
    selectedModuleId: "",
    selectedTableKey: "",
    moduleDefinitions: [],
    tableDefinitions: [],
    contextLoading: false,
    contextError: "",
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
  btnSave.textContent = "Speichern";
  applyPopupButtonStyle(btnSave, { variant: "primary" });

  const btnReset = document.createElement("button");
  btnReset.type = "button";
  btnReset.textContent = "Auf Standard";
  applyPopupButtonStyle(btnReset);

  const status = document.createElement("div");
  status.style.fontSize = "12px";
  status.style.minHeight = "16px";
  status.style.color = "#475569";

  toolbar.append(orientationWrap, btnReload, btnSave, btnReset, status);

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

  const layoutSection = makeSection("Spaltenwerte", "Breiten koennen als CSS-Trackwerte gepflegt werden; Texte bleiben defensiv normalisiert.");
  layoutSection.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
  layoutSection.style.paddingBottom = "8px";
  const layoutGrid = document.createElement("div");
  layoutGrid.style.display = "grid";
  layoutGrid.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  layoutGrid.style.gap = "8px";

  const labelSection = makeSection("Spaltenüberschriften", "TOP, Kurztext und Meta-Zeilen für die Anzeige.");
  const labelGrid = document.createElement("div");
  labelGrid.style.display = "grid";
  labelGrid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  labelGrid.style.gap = "8px";

  const makeAndRegisterField = (key, labelText, initialValue) => {
    const field = _createField(labelText, initialValue);
    fields.set(key, field.input);
    return field.row;
  };

  layoutGrid.append(
    makeAndRegisterField("uiNumberWidth", "UI TOP-Spalte", DEFAULT_VALUES.uiNumberWidth),
    makeAndRegisterField("uiTextTrack", "UI Text-Spalte", DEFAULT_VALUES.uiTextTrack),
    makeAndRegisterField("uiMetaWidth", "UI Meta-Spalte", DEFAULT_VALUES.uiMetaWidth),
    makeAndRegisterField("pdfNumberWidth", "PDF TOP-Spalte", DEFAULT_VALUES.pdfNumberWidth),
    makeAndRegisterField("pdfTextWidth", "PDF Text-Spalte", DEFAULT_VALUES.pdfTextWidth),
    makeAndRegisterField("pdfMetaWidth", "PDF Meta-Spalte", DEFAULT_VALUES.pdfMetaWidth)
  );
  labelGrid.append(
    makeAndRegisterField("labelTop", "Überschrift TOP", DEFAULT_VALUES.labelTop),
    makeAndRegisterField("labelText", "Überschrift Text", DEFAULT_VALUES.labelText),
    makeAndRegisterField("labelMeta1", "Überschrift Meta 1", DEFAULT_VALUES.labelMeta1),
    makeAndRegisterField("labelMeta2", "Überschrift Meta 2", DEFAULT_VALUES.labelMeta2),
    makeAndRegisterField("labelMeta3", "Überschrift Meta 3", DEFAULT_VALUES.labelMeta3)
  );

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
  fieldsCard.append(layoutSection, labelSection);
  layoutSection.append(layoutGrid);
  labelSection.append(labelGrid);

  root.append(head, contextCard, toolbar, fieldsCard, previewCard);
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
      "Modul- und Tabellenliste kommen aus der zentralen Registry. Die Layoutauswahl ist modul- und tabellenbezogen, nicht projektbezogen.";
    tableInfo.textContent = [
      `Modul: ${moduleLabel}`,
      `Tabelle: ${tableLabel}`,
      `tableKey: ${tableKey}`,
      `Orientierung: ${state.orientation}`,
      `Quelle: ${sourceLabel}`,
    ].join(" | ");
    return tableInfo.textContent;
  };

  const _updateTestPdfState = () => {
    const hasDirty = _hasDirtyValuesState(state);
    status.textContent = hasDirty ? "Bitte erst speichern, dann Layout erneut prüfen." : "";
    status.style.color = hasDirty ? "#b91c1c" : "#475569";
  };

  const loadTableDefinitions = async () => {
    if (typeof resolvedApi?.tableLayoutsListDefinitions !== "function") {
      state.contextError = "Tabellenregistry nicht verfuegbar.";
      state.moduleDefinitions = [];
      state.tableDefinitions = [];
      _renderModuleOptions();
      _renderTableOptions();
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
    root.dataset.orientation = state.orientation;
    root.dataset.source = state.source;
    root.dataset.moduleId = state.selectedModuleId || "";
    root.dataset.tableKey = state.selectedTableKey || "";
    targetInfoOrientation.textContent = `Orientierung: ${state.orientation}`;
    targetInfoSource.textContent = `Quelle: ${formatSourceLabel()}`;
    _updateContextStatus();
    _setPreviewMode(state.previewMode);
    _renderPreviewPanel(previewPane, tableDef, { ...activeValues, source: state.source }, state.previewMode);
    if (status) {
      const sourceText = formatSourceLabel();
      const parseText = state.parseError ? ` | Parse: ${state.parseError}` : "";
      status.textContent = `Quelle: ${sourceText}${parseText}`;
      status.style.color = state.error ? "#b91c1c" : "#475569";
      if (state.error) status.textContent = state.error;
    }
    _updateTestPdfState();
  };

  const syncLoadedValues = (layout, meta = {}) => {
    const values = extractProtokollTopsEditorValues(layout || {});
    state.orientation = _normalizeOrientation(meta.requestedOrientation || values.orientation);
    values.orientation = state.orientation;
    state.schemaVersion = Number(meta.schemaVersion || layout?.schemaVersion || 1) || 1;
    state.source = String(meta.source || "default").trim() || "default";
    state.parseError = String(meta.parseError || layout?.parseError || "").trim();
    state.loadedValues = values;
    state.editValues = _cloneJson(values);
    state.testResult = "";
    orientationSelect.value = values.orientation;
    _syncFields(fields, values);
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
        refreshPreview();
        return { ok: false, error: state.error };
      }
      const res = await resolvedApi.tableLayoutsGetOne({
        tableKey: tableDef.tableKey,
        moduleId: tableDef.moduleId,
        orientation: requestedOrientation,
      });
      if (!res?.ok) {
        state.error = res?.error || "Layout konnte nicht geladen werden.";
        refreshPreview();
        return res;
      }
      const data = res.data || {};
      syncLoadedValues(data.effectiveLayout || data.defaultLayout || {}, {
        ...data,
        requestedOrientation,
      });
      return res;
    } catch (err) {
      state.error = err?.message || String(err);
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
      const values = _readFormValues(fields);
      values.orientation = _normalizeOrientation(orientationSelect.value || values.orientation);
      state.editValues = values;
      state.testResult = "";
      const tableDef = _getSelectedTableDefinition();
      if (!tableDef) {
        state.error = state.contextError || "Keine Tabellen-Definition verfuegbar.";
        refreshPreview();
        return { ok: false, error: state.error };
      }
      const res = await resolvedApi.tableLayoutsSave({
        tableKey: tableDef.tableKey,
        moduleId: tableDef.moduleId,
        orientation: values.orientation,
        schemaVersion: state.schemaVersion,
        layout: buildProtokollTopsLayoutOverlay(values, values.orientation),
      });
      if (!res?.ok) {
        state.error = res?.error || "Layout konnte nicht gespeichert werden.";
        refreshPreview();
        return res;
      }
      const data = res.data || {};
      syncLoadedValues(data.effectiveLayout || data.defaultLayout || {}, data);
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
    const next = {
      ...state.editValues,
      ...values,
      orientation: _normalizeOrientation(values.orientation || orientationSelect.value || state.orientation),
    };
    state.orientation = next.orientation;
    state.editValues = next;
    state.testResult = "";
    orientationSelect.value = next.orientation;
    _syncFields(fields, next);
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
      state.editValues = {
        ...state.editValues,
        ..._readFormValues(fields),
        orientation: _normalizeOrientation(orientationSelect.value),
      };
      state.testResult = "";
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
