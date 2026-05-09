import { applyPopupButtonStyle, applyPopupCardStyle } from "../ui/popupButtonStyles.js";

const TARGET_LAYOUT = Object.freeze({
  tableKey: "protokoll_tops",
  moduleId: "protokoll",
  moduleLabel: "Protokoll",
  tableLabel: "TOP-Liste",
});

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

function _renderValuesSummary(target, state) {
  if (!target) return;
  target.textContent = JSON.stringify(
    {
      moduleId: state.selectedModuleId,
      tableKey: state.selectedTableKey,
      orientation: state.orientation,
      source: state.source,
      schemaVersion: state.schemaVersion,
      parseError: state.parseError,
      loaded: state.loadedValues ? _cloneJson(state.loadedValues) : null,
      editValues: state.editValues ? _cloneJson(state.editValues) : null,
    },
    null,
    2
  );
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
  root.dataset.tableLayoutEditor = "protokoll_tops";
  root.dataset.tableKey = TARGET_LAYOUT.tableKey;
  root.dataset.moduleId = TARGET_LAYOUT.moduleId;
  root.dataset.orientation = "portrait";
  root.style.display = "grid";
  root.style.gap = "10px";
  root.style.minWidth = "min(820px, calc(100vw - 120px))";
  root.style.maxWidth = "980px";

  const fields = new Map();
  const state = {
    orientation: "portrait",
    schemaVersion: 1,
    source: "default",
    parseError: "",
    loadedValues: extractProtokollTopsEditorValues({ variant: "portrait" }),
    editValues: extractProtokollTopsEditorValues({ variant: "portrait" }),
    busy: false,
    error: "",
    testResult: "",
    selectedModuleId: TARGET_LAYOUT.moduleId,
    selectedTableKey: TARGET_LAYOUT.tableKey,
    moduleDefinitions: [{ moduleId: TARGET_LAYOUT.moduleId, label: TARGET_LAYOUT.moduleLabel }],
    tableDefinitions: [
      { tableKey: TARGET_LAYOUT.tableKey, moduleId: TARGET_LAYOUT.moduleId, label: TARGET_LAYOUT.tableLabel },
    ],
    contextLoading: false,
    contextError: "",
  };

  const formatSourceLabel = () => {
    if (state.source === "stored") return "gespeichertes Layout";
    if (state.source === "stored-portrait-fallback") return "Fallback (portrait gespeicherte Variante)";
    return "Standardlayout protokoll_tops";
  };

  const head = document.createElement("div");
  applyPopupCardStyle(head);
  head.style.padding = "10px";
  head.style.display = "grid";
  head.style.gap = "6px";

  const title = document.createElement("div");
  title.textContent = "Tabellenlayouts / protokoll_tops";
  title.style.fontWeight = "800";

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
  targetInfoModule.textContent = "Modul: Protokoll";
  const targetInfoTable = document.createElement("div");
  targetInfoTable.textContent = "Tabelle: TOP-Liste";
  const targetInfoKey = document.createElement("div");
  targetInfoKey.textContent = "tableKey: protokoll_tops";
  const targetInfoOrientation = document.createElement("div");
  targetInfoOrientation.textContent = "Orientierung: portrait";
  const targetInfoSource = document.createElement("div");
  targetInfoSource.textContent = "Quelle: Standardlayout protokoll_tops";
  targetInfo.append(targetInfoModule, targetInfoTable, targetInfoKey, targetInfoOrientation, targetInfoSource);

  head.append(title, hint, targetInfo);

  const contextCard = document.createElement("div");
  applyPopupCardStyle(contextCard);
  contextCard.style.padding = "10px";
  contextCard.style.display = "grid";
  contextCard.style.gap = "8px";

  const contextTitle = document.createElement("div");
  contextTitle.textContent = "Layout-Auswahl";
  contextTitle.style.fontWeight = "800";

  const contextHint = document.createElement("div");
  contextHint.textContent = "Die Layoutauswahl ist modul- und tabellenbezogen, nicht projektbezogen.";
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

  const testCard = document.createElement("div");
  applyPopupCardStyle(testCard);
  testCard.style.padding = "10px";
  testCard.style.display = "grid";
  testCard.style.gap = "8px";

  const testTitle = document.createElement("div");
  testTitle.textContent = "PDF-Testdruck";
  testTitle.style.fontWeight = "800";

  const testHint = document.createElement("div");
  testHint.textContent = "PDF-Test mit Testdaten wird später separat ergänzt.";
  testHint.style.fontSize = "12px";
  testHint.style.opacity = "0.78";
  testCard.append(testTitle, testHint);

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
  const previewTitle = document.createElement("div");
  previewTitle.textContent = "Werte-Vorschau";
  previewTitle.style.fontWeight = "800";
  const previewHint = document.createElement("div");
  previewHint.textContent = "Keine PDF-Vorschau in diesem Prototyp; nur die gespeicherten Layoutwerte.";
  previewHint.style.fontSize = "12px";
  previewHint.style.opacity = "0.78";
  const preview = document.createElement("pre");
  preview.style.margin = "0";
  preview.style.padding = "8px";
  preview.style.borderRadius = "8px";
  preview.style.border = "1px solid rgba(0,0,0,0.08)";
  preview.style.background = "#f8fafc";
  preview.style.fontSize = "11px";
  preview.style.whiteSpace = "pre-wrap";
  preview.style.wordBreak = "break-word";
  preview.style.minHeight = "220px";
  previewCard.append(previewTitle, previewHint, preview);

  const fieldsCard = document.createElement("div");
  applyPopupCardStyle(fieldsCard);
  fieldsCard.style.padding = "10px";
  fieldsCard.style.display = "grid";
  fieldsCard.style.gap = "10px";
  fieldsCard.append(layoutSection, labelSection);
  layoutSection.append(layoutGrid);
  labelSection.append(labelGrid);

  root.append(head, contextCard, toolbar, fieldsCard, testCard, previewCard);

  const _getSelectedTableDefinition = () => {
    const tableKey = _normalizeId(state.selectedTableKey) || TARGET_LAYOUT.tableKey;
    const moduleId = _normalizeId(state.selectedModuleId) || TARGET_LAYOUT.moduleId;
    return state.tableDefinitions.find((item) => _normalizeId(item?.tableKey) === tableKey && _normalizeId(item?.moduleId) === moduleId) || null;
  };

  const _renderModuleOptions = () => {
    const defs = state.moduleDefinitions.length ? state.moduleDefinitions : [{ moduleId: TARGET_LAYOUT.moduleId, label: TARGET_LAYOUT.moduleLabel }];
    const current = _normalizeId(moduleSelect.value || state.selectedModuleId) || _normalizeId(defs[0]?.moduleId) || TARGET_LAYOUT.moduleId;
    moduleSelect.innerHTML = "";
    for (const def of defs) {
      const option = document.createElement("option");
      option.value = _normalizeId(def.moduleId);
      option.textContent = _formatText(def.label || def.moduleLabel, TARGET_LAYOUT.moduleLabel);
      moduleSelect.appendChild(option);
    }
    moduleSelect.value = defs.some((def) => _normalizeId(def.moduleId) === current) ? current : _normalizeId(defs[0]?.moduleId) || TARGET_LAYOUT.moduleId;
    state.selectedModuleId = _normalizeId(moduleSelect.value) || TARGET_LAYOUT.moduleId;
  };

  const _renderTableOptions = () => {
    const moduleId = _normalizeId(state.selectedModuleId) || TARGET_LAYOUT.moduleId;
    const defs = state.tableDefinitions.filter((item) => _normalizeId(item?.moduleId) === moduleId);
    const tableDefs = defs.length ? defs : [TARGET_LAYOUT];
    const current = _normalizeId(tableSelect.value || state.selectedTableKey) || _normalizeId(tableDefs[0]?.tableKey) || TARGET_LAYOUT.tableKey;
    tableSelect.innerHTML = "";
    for (const def of tableDefs) {
      const option = document.createElement("option");
      option.value = _normalizeId(def.tableKey);
      option.textContent = _formatText(def.label || def.tableLabel, TARGET_LAYOUT.tableLabel);
      tableSelect.appendChild(option);
    }
    tableSelect.value = tableDefs.some((def) => _normalizeId(def.tableKey) === current) ? current : _normalizeId(tableDefs[0]?.tableKey) || TARGET_LAYOUT.tableKey;
    state.selectedTableKey = _normalizeId(tableSelect.value) || TARGET_LAYOUT.tableKey;
    const def = _getSelectedTableDefinition() || TARGET_LAYOUT;
    tableInfo.textContent = `Aktive Tabelle: ${def.label || TARGET_LAYOUT.tableLabel} | tableKey: ${state.selectedTableKey || TARGET_LAYOUT.tableKey}`;
  };

  const _updateContextStatus = () => {
    contextCard.dataset.moduleId = state.selectedModuleId || TARGET_LAYOUT.moduleId;
    contextCard.dataset.tableKey = state.selectedTableKey || TARGET_LAYOUT.tableKey;
    contextCard.dataset.orientation = state.orientation;
    contextHint.textContent = "Die Layoutauswahl ist modul- und tabellenbezogen, nicht projektbezogen.";
    tableInfo.textContent = [
      `Modul: ${TARGET_LAYOUT.moduleLabel}`,
      `Tabelle: ${TARGET_LAYOUT.tableLabel}`,
      `tableKey: ${state.selectedTableKey || TARGET_LAYOUT.tableKey}`,
      `Orientierung: ${state.orientation}`,
      `Quelle: ${formatSourceLabel()}`,
    ].join(" | ");
    return tableInfo.textContent;
  };

  const _hasDirtyValues = () => !_sameJson(state.editValues, state.loadedValues);

  const _updateTestPdfState = () => {
    const hasDirty = _hasDirtyValues();
    testHint.textContent = "PDF-Test mit Testdaten wird später separat ergänzt.";
    status.textContent = hasDirty ? "Bitte erst speichern, dann Layout erneut prüfen." : "";
    status.style.color = hasDirty ? "#b91c1c" : "#475569";
  };

  const loadTableDefinitions = async () => {
    if (typeof resolvedApi?.tableLayoutsListDefinitions !== "function") {
      state.contextError = "Tabellenliste nicht verfügbar.";
      state.tableDefinitions = [TARGET_LAYOUT];
      state.moduleDefinitions = [{ moduleId: TARGET_LAYOUT.moduleId, label: TARGET_LAYOUT.moduleLabel }];
      _renderModuleOptions();
      _renderTableOptions();
      _updateContextStatus();
      _updateTestPdfState();
      return { ok: true, data: state.tableDefinitions };
    }
    const res = await resolvedApi.tableLayoutsListDefinitions();
    if (!res?.ok) {
      state.contextError = res?.error || "Tabellenliste konnte nicht geladen werden.";
      state.tableDefinitions = [TARGET_LAYOUT];
      state.moduleDefinitions = [{ moduleId: TARGET_LAYOUT.moduleId, label: TARGET_LAYOUT.moduleLabel }];
      _renderModuleOptions();
      _renderTableOptions();
      _updateContextStatus();
      _updateTestPdfState();
      return res;
    }
    const list = Array.isArray(res.data) ? res.data : [];
    const matching = list.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        _normalizeId(item?.moduleId) === TARGET_LAYOUT.moduleId &&
        _normalizeId(item?.tableKey) === TARGET_LAYOUT.tableKey
    );
    state.tableDefinitions = matching.length ? matching : [TARGET_LAYOUT];
    state.moduleDefinitions = [{ moduleId: TARGET_LAYOUT.moduleId, label: TARGET_LAYOUT.moduleLabel }];
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
    root.dataset.orientation = state.orientation;
    root.dataset.source = state.source;
    root.dataset.moduleId = state.selectedModuleId || TARGET_LAYOUT.moduleId;
    root.dataset.tableKey = state.selectedTableKey || TARGET_LAYOUT.tableKey;
    targetInfoOrientation.textContent = `Orientierung: ${state.orientation}`;
    targetInfoSource.textContent = `Quelle: ${formatSourceLabel()}`;
    _updateContextStatus();
    _renderValuesSummary(preview, state);
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
      const tableDef = _getSelectedTableDefinition() || TARGET_LAYOUT;
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
      const tableDef = _getSelectedTableDefinition() || TARGET_LAYOUT;
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
      const tableDef = _getSelectedTableDefinition() || TARGET_LAYOUT;
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

  orientationSelect.addEventListener("change", async () => {
    state.orientation = _normalizeOrientation(orientationSelect.value);
    state.editValues.orientation = state.orientation;
    state.testResult = "";
    await load();
  });
  moduleSelect.addEventListener("change", async () => {
    state.selectedModuleId = _normalizeId(moduleSelect.value) || TARGET_LAYOUT.moduleId;
    state.selectedTableKey = TARGET_LAYOUT.tableKey;
    state.testResult = "";
    _renderTableOptions();
    refreshPreview();
    await load();
  });
  tableSelect.addEventListener("change", async () => {
    state.selectedTableKey = _normalizeId(tableSelect.value) || TARGET_LAYOUT.tableKey;
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
  refreshPreview();

  return {
    root,
    load,
    save,
    reset,
    applyValues,
    getValues() {
      return _cloneJson(state.editValues);
    },
  };
}
