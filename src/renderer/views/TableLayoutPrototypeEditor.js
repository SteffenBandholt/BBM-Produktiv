import { applyPopupButtonStyle, applyPopupCardStyle } from "../ui/popupButtonStyles.js";

const TARGET_LAYOUT = Object.freeze({
  tableKey: "protokoll_tops",
  moduleId: "protokoll",
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

export function extractProtokollTopsEditorValues(layout = {}) {
  const uiRootVars = layout?.ui?.rootVars || {};
  const pdfColumns = layout?.pdf?.columns || {};
  const labels = layout?.labels || {};
  const metaLabels = Array.isArray(labels.meta) ? labels.meta : [];
  return {
    orientation: _normalizeOrientation(layout?.variant || layout?.orientation || DEFAULT_VALUES.orientation),
    uiNumberWidth: _normalizeText(
      uiRootVars["--bbm-tops-list-number-col"],
      DEFAULT_VALUES.uiNumberWidth,
      32
    ),
    uiTextTrack: _normalizeTrack(
      uiRootVars["--bbm-tops-list-text-col"],
      DEFAULT_VALUES.uiTextTrack
    ),
    uiMetaWidth: _normalizeText(
      uiRootVars["--bbm-tops-list-meta-col"],
      DEFAULT_VALUES.uiMetaWidth,
      32
    ),
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
  const uiRootVars = {
    "--bbm-tops-list-number-col": _normalizeText(
      normalized.uiNumberWidth,
      DEFAULT_VALUES.uiNumberWidth,
      32
    ),
    "--bbm-tops-list-text-col": _normalizeTrack(
      normalized.uiTextTrack,
      DEFAULT_VALUES.uiTextTrack
    ),
    "--bbm-tops-list-meta-col": _normalizeText(
      normalized.uiMetaWidth,
      DEFAULT_VALUES.uiMetaWidth,
      32
    ),
  };
  const pdfColumns = {
    number: {
      key: "top",
      className: "colNr",
      width: _normalizeText(normalized.pdfNumberWidth, DEFAULT_VALUES.pdfNumberWidth, 32),
    },
    text: {
      key: "text",
      className: "colText",
      width: _normalizeText(normalized.pdfTextWidth, DEFAULT_VALUES.pdfTextWidth, 32),
    },
    meta: {
      key: "meta",
      className: "colMeta",
      width: _normalizeText(normalized.pdfMetaWidth, DEFAULT_VALUES.pdfMetaWidth, 32),
    },
  };

  return {
    variant: normalized.orientation,
    labels,
    ui: {
      rootVars: uiRootVars,
    },
    pdf: {
      columns: pdfColumns,
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
  const summary = {
    target: TARGET_LAYOUT,
    orientation: state.orientation,
    source: state.source || "default",
    schemaVersion: state.schemaVersion || 1,
    parseError: state.parseError || "",
    loaded: state.loadedValues ? _cloneJson(state.loadedValues) : null,
    editValues: state.editValues ? _cloneJson(state.editValues) : null,
  };
  target.textContent = JSON.stringify(summary, null, 2);
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
  hint.textContent = "Interner Prototyp. Keine normale Nutzerfunktion. PDF-Vorschau kommt spaeter.";
  hint.style.fontSize = "12px";
  hint.style.opacity = "0.8";

  const targetInfo = document.createElement("div");
  targetInfo.style.fontSize = "12px";
  targetInfo.style.color = "#475569";
  targetInfo.textContent = "protokoll_tops | moduleId=protokoll";

  head.append(title, hint, targetInfo);

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

  const layoutSection = makeSection(
    "Spaltenwerte",
    "Breiten koennen als CSS-Trackwerte gepflegt werden; Texte bleiben defensiv normalisiert."
  );
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

  const makeRow = (titleText, hintText, children) => {
    const box = document.createElement("div");
    box.style.display = "grid";
    box.style.gap = "8px";
    const headRow = document.createElement("div");
    headRow.textContent = titleText;
    headRow.style.fontWeight = "800";
    const hintRow = document.createElement("div");
    hintRow.textContent = hintText;
    hintRow.style.fontSize = "12px";
    hintRow.style.opacity = "0.78";
    box.append(headRow, hintRow, children);
    return box;
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

  root.append(head, toolbar, fieldsCard, previewCard);

  const setBusy = (busy) => {
    state.busy = !!busy;
    orientationSelect.disabled = state.busy;
    btnReload.disabled = state.busy;
    btnSave.disabled = state.busy;
    btnReset.disabled = state.busy;
    for (const input of fields.values()) {
      if (!input) continue;
      input.disabled = state.busy;
    }
    btnReload.style.opacity = btnReload.disabled ? "0.65" : "1";
    btnSave.style.opacity = btnSave.disabled ? "0.65" : "1";
    btnReset.style.opacity = btnReset.disabled ? "0.65" : "1";
  };

  const refreshPreview = () => {
    _renderValuesSummary(preview, state);
    if (status) {
      const sourceText =
        state.source === "stored"
          ? "gespeichert"
          : state.source === "stored-portrait-fallback"
            ? "portrait-Fallback"
            : state.source === "default"
              ? "Standard"
              : state.source || "unbekannt";
      const parseText = state.parseError ? ` | Parse: ${state.parseError}` : "";
      status.textContent = `Quelle: ${sourceText}${parseText}`;
      status.style.color = state.error ? "#b91c1c" : "#475569";
      if (state.error) {
        status.textContent = state.error;
      }
    }
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
    orientationSelect.value = values.orientation;
    _syncFields(fields, values);
    refreshPreview();
  };

  const load = async () => {
    if (typeof resolvedApi?.tableLayoutsGetOne !== "function") {
      state.error = "Table-Layout-IPC nicht verfuegbar.";
      refreshPreview();
      return { ok: false, error: state.error };
    }
    setBusy(true);
    state.error = "";
    try {
      const requestedOrientation = _normalizeOrientation(orientationSelect.value || state.orientation);
      state.orientation = requestedOrientation;
      const res = await resolvedApi.tableLayoutsGetOne({
        tableKey: TARGET_LAYOUT.tableKey,
        moduleId: TARGET_LAYOUT.moduleId,
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
      setBusy(false);
    }
  };

  const save = async () => {
    if (typeof resolvedApi?.tableLayoutsSave !== "function") {
      state.error = "Table-Layout-Save-IPC nicht verfuegbar.";
      refreshPreview();
      return { ok: false, error: state.error };
    }
    setBusy(true);
    state.error = "";
    try {
      const values = _readFormValues(fields);
      values.orientation = _normalizeOrientation(orientationSelect.value || values.orientation);
      state.editValues = values;
      const res = await resolvedApi.tableLayoutsSave({
        tableKey: TARGET_LAYOUT.tableKey,
        moduleId: TARGET_LAYOUT.moduleId,
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
      state.error = "Table-Layout-Reset-IPC nicht verfuegbar.";
      refreshPreview();
      return { ok: false, error: state.error };
    }
    setBusy(true);
    state.error = "";
    try {
      const res = await resolvedApi.tableLayoutsReset({
        tableKey: TARGET_LAYOUT.tableKey,
        moduleId: TARGET_LAYOUT.moduleId,
        orientation: _normalizeOrientation(orientationSelect.value),
      });
      if (!res?.ok) {
        state.error = res?.error || "Layout konnte nicht zurueckgesetzt werden.";
        refreshPreview();
        return res;
      }
      state.error = "";
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
    orientationSelect.value = next.orientation;
    _syncFields(fields, next);
    refreshPreview();
  };

  orientationSelect.addEventListener("change", async () => {
    state.orientation = _normalizeOrientation(orientationSelect.value);
    state.editValues.orientation = state.orientation;
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
      refreshPreview();
    });
  }

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
