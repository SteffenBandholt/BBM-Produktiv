// DEV-only Mini-Kalibrator V1: project_firms UI-Spaltenbreiten.
//
// Wichtig:
// - Dieses Modul ist nur ein UI-Helper. Persistenz erfolgt ausschliesslich ueber
//   vorhandene tableLayouts-IPC Funktionen (window.bbmDb.tableLayouts*).
// - Die aufrufende Stelle (z.B. SettingsView) muss die Sichtbarkeit DEV-only guarden.

const PROJECT_FIRMS_IDENTITY = Object.freeze({
  moduleId: "projektverwaltung",
  tableKey: "project_firms",
  orientation: "portrait",
});

function _normalizeText(value) {
  return String(value == null ? "" : value).trim();
}

function _cloneJson(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function _parsePxNumber(value) {
  const text = _normalizeText(value).toLowerCase();
  const m = text.match(/^(\d+)(?:\.\d+)?px$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function _formatUiWidthPx(n) {
  const value = Math.floor(Number(n));
  if (!Number.isFinite(value) || value <= 0) return "";
  return `${value}px`;
}

function _findColumn(columns, key) {
  return Array.isArray(columns) ? columns.find((col) => String(col?.key || "") === key) || null : null;
}

function _extractUiWidths(columns) {
  const shortName = _findColumn(columns, "shortName");
  const role = _findColumn(columns, "role");
  const active = _findColumn(columns, "active");

  const roleWidthRaw = _normalizeText(role?.uiWidth);
  const rolePx = _parsePxNumber(roleWidthRaw);

  return {
    shortNamePx: _parsePxNumber(_normalizeText(shortName?.uiWidth)),
    // role ist default "1fr" (flex). Im Mini-Kalibrator bleibt das als leeres Feld
    // abbildbar. Beim Speichern wird leer wieder auf "1fr" gesetzt.
    rolePx,
    roleIsFlex: !!roleWidthRaw && roleWidthRaw.toLowerCase().endsWith("fr") && rolePx == null,
    activePx: _parsePxNumber(_normalizeText(active?.uiWidth)),
  };
}

function _applyUiWidths(columns, widths) {
  const next = Array.isArray(columns) ? columns.map((col) => _cloneJson(col)) : [];
  for (const col of next) {
    const key = String(col?.key || "");
    if (key === "shortName") col.uiWidth = _formatUiWidthPx(widths.shortNamePx);
    if (key === "active") col.uiWidth = _formatUiWidthPx(widths.activePx);
    if (key === "role") {
      // Wenn kein Wert gesetzt ist, behalten wir den flex-default.
      col.uiWidth = widths.rolePx ? _formatUiWidthPx(widths.rolePx) : "1fr";
    }
  }
  return next;
}

function _validateWidths(widths) {
  const errors = {};

  const checkFixed = (name, value, { min = 20, max = 600 } = {}) => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n <= 0) {
      errors[name] = "Bitte eine Zahl > 0 eingeben.";
      return;
    }
    if (n < min || n > max) {
      errors[name] = `Bitte zwischen ${min} und ${max} px eingeben.`;
    }
  };

  checkFixed("shortNamePx", widths.shortNamePx, { min: 40, max: 400 });
  checkFixed("activePx", widths.activePx, { min: 30, max: 200 });

  // role darf leer bleiben (flex). Wenn gesetzt, dann plausibel.
  if (widths.rolePx != null && String(widths.rolePx).trim() !== "") {
    checkFixed("rolePx", widths.rolePx, { min: 80, max: 800 });
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function createProjectFirmsMiniCalibratorV1({ api } = {}) {
  const resolvedApi = api || (typeof window !== "undefined" ? window.bbmDb : null) || {};

  const root = document.createElement("div");
  root.dataset.tableCalibrator = "project_firms_v1";
  root.style.display = "grid";
  root.style.gap = "10px";
  root.style.fontFamily = "var(--bbm-font-ui)";

  const title = document.createElement("div");
  title.textContent = "Tabellen-Kalibrator V1";
  title.style.fontWeight = "900";
  title.style.fontSize = "16px";
  title.style.color = "#0f172a";

  const hint = document.createElement("div");
  hint.textContent = "DEV-only. Bearbeitet nur die UI-Spaltenbreiten der Projekt-Firmenliste (project_firms).";
  hint.style.fontSize = "12px";
  hint.style.color = "#64748b";
  hint.style.lineHeight = "1.35";

  const meta = document.createElement("div");
  meta.style.fontSize = "12px";
  meta.style.color = "#334155";
  meta.textContent = "Tabelle: Projekt-Firmenliste | Variante: UI (portrait)";

  const errorBox = document.createElement("div");
  errorBox.style.fontSize = "12px";
  errorBox.style.color = "#b91c1c";
  errorBox.style.minHeight = "16px";

  const form = document.createElement("div");
  form.style.display = "grid";
  form.style.gap = "8px";
  form.style.border = "1px solid #e2e8f0";
  form.style.borderRadius = "10px";
  form.style.padding = "10px";
  form.style.background = "#f8fafc";

  const mkRow = (labelText, input, noteText = "") => {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "220px 140px 1fr";
    row.style.gap = "10px";
    row.style.alignItems = "center";

    const label = document.createElement("div");
    label.textContent = labelText;
    label.style.fontWeight = "800";
    label.style.fontSize = "12px";
    label.style.color = "#0f172a";

    const note = document.createElement("div");
    note.textContent = noteText;
    note.style.fontSize = "12px";
    note.style.color = "#64748b";

    row.append(label, input, note);
    return row;
  };

  const mkNumber = (placeholder = "") => {
    const el = document.createElement("input");
    el.type = "number";
    el.inputMode = "numeric";
    el.min = "1";
    el.step = "1";
    el.placeholder = placeholder;
    el.style.width = "100%";
    el.style.padding = "6px 8px";
    el.style.border = "1px solid #cbd5e1";
    el.style.borderRadius = "8px";
    el.style.fontSize = "12px";
    return el;
  };

  const inpShortName = mkNumber("px");
  const inpRole = mkNumber("leer = flex (1fr)");
  const inpActive = mkNumber("px");

  const readWidthsFromInputs = () => {
    const parseNumOrNull = (value) => {
      const text = _normalizeText(value);
      if (!text) return null;
      const n = Math.floor(Number(text));
      return Number.isFinite(n) ? n : null;
    };
    return {
      shortNamePx: parseNumOrNull(inpShortName.value),
      rolePx: parseNumOrNull(inpRole.value),
      activePx: parseNumOrNull(inpActive.value),
    };
  };

  const state = {
    busy: false,
    loadedColumns: [],
    loadedSource: "default",
  };

  const setBusy = (busy) => {
    state.busy = !!busy;
    inpShortName.disabled = state.busy;
    inpRole.disabled = state.busy;
    inpActive.disabled = state.busy;
    btnSave.disabled = state.busy;
    btnReset.disabled = state.busy;
    btnReload.disabled = state.busy;
  };

  const setError = (text) => {
    errorBox.textContent = _normalizeText(text);
  };

  const btnBar = document.createElement("div");
  btnBar.style.display = "flex";
  btnBar.style.gap = "8px";
  btnBar.style.justifyContent = "flex-end";

  const mkBtn = (text, variant = "normal") => {
    const el = document.createElement("button");
    el.type = "button";
    el.textContent = text;
    el.style.padding = "7px 10px";
    el.style.borderRadius = "10px";
    el.style.fontWeight = "800";
    el.style.fontSize = "12px";
    el.style.border = "1px solid #cbd5e1";
    el.style.background = variant === "primary" ? "#2563eb" : "#fff";
    el.style.color = variant === "primary" ? "#fff" : "#0f172a";
    el.style.cursor = "pointer";
    return el;
  };

  const btnReload = mkBtn("Laden");
  const btnReset = mkBtn("Reset");
  const btnSave = mkBtn("Speichern", "primary");

  const applyToInputs = (columns) => {
    const widths = _extractUiWidths(columns);
    inpShortName.value = widths.shortNamePx != null ? String(widths.shortNamePx) : "";
    inpActive.value = widths.activePx != null ? String(widths.activePx) : "";
    // role: flex bleibt leer, px wird gesetzt.
    inpRole.value = widths.rolePx != null ? String(widths.rolePx) : "";
  };

  const load = async () => {
    if (state.busy) return { ok: false, error: "busy" };
    setError("");
    setBusy(true);
    try {
      if (typeof resolvedApi?.tableLayoutsGetOne !== "function") {
        return { ok: false, error: "Table-Layout-IPC nicht verfügbar." };
      }
      const res = await resolvedApi.tableLayoutsGetOne(PROJECT_FIRMS_IDENTITY);
      if (!res?.ok) return { ok: false, error: res?.error || "Layout konnte nicht geladen werden." };
      const effective = res?.data?.effectiveLayout || res?.data?.defaultLayout || null;
      const cols = Array.isArray(effective?.columns) ? effective.columns : [];
      if (!cols.length) return { ok: false, error: "Keine Spaltendaten gefunden." };
      state.loadedColumns = _cloneJson(cols);
      state.loadedSource = String(res?.data?.source || "default");
      applyToInputs(state.loadedColumns);
      return { ok: true, data: { source: state.loadedSource } };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (state.busy) return { ok: false, error: "busy" };
    setError("");
    const widths = readWidthsFromInputs();
    const validation = _validateWidths(widths);
    if (!validation.ok) {
      setError(Object.values(validation.errors)[0] || "Ungültiger Wert");
      return { ok: false, error: "validation" };
    }

    setBusy(true);
    try {
      if (typeof resolvedApi?.tableLayoutsSave !== "function") {
        return { ok: false, error: "Table-Layout-IPC nicht verfügbar." };
      }
      const base = state.loadedColumns.length ? state.loadedColumns : [];
      const nextColumns = _applyUiWidths(base, widths);
      const res = await resolvedApi.tableLayoutsSave({
        ...PROJECT_FIRMS_IDENTITY,
        layout: {
          columns: nextColumns,
        },
      });
      if (!res?.ok) return { ok: false, error: res?.error || "Speichern fehlgeschlagen." };
      // Nach erfolgreichem Speichern: Werte frisch laden, damit Defaults/Normalization sichtbar werden.
      await load();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (state.busy) return { ok: false, error: "busy" };
    setError("");
    setBusy(true);
    try {
      if (typeof resolvedApi?.tableLayoutsReset !== "function") {
        return { ok: false, error: "Table-Layout-IPC nicht verfügbar." };
      }
      const res = await resolvedApi.tableLayoutsReset(PROJECT_FIRMS_IDENTITY);
      if (!res?.ok) return { ok: false, error: res?.error || "Reset fehlgeschlagen." };
      await load();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    } finally {
      setBusy(false);
    }
  };

  btnReload.addEventListener("click", () => {
    void load().then((res) => {
      if (!res?.ok) setError(res?.error || "Laden fehlgeschlagen.");
    });
  });
  btnSave.addEventListener("click", () => {
    void save().then((res) => {
      if (!res?.ok && res?.error && res.error !== "validation") setError(res?.error);
    });
  });
  btnReset.addEventListener("click", () => {
    void reset().then((res) => {
      if (!res?.ok) setError(res?.error || "Reset fehlgeschlagen.");
    });
  });

  // Sofortiges Feedback bei Eingaben: Fehlermeldung leeren.
  for (const el of [inpShortName, inpRole, inpActive]) {
    el.addEventListener("input", () => setError(""));
  }

  form.append(
    mkRow("Kurzbez. / shortName", inpShortName, "Pixelbreite (z.B. 160)"),
    mkRow("Funktion/Gewerk / role", inpRole, "leer lassen = flexibel (1fr)"),
    mkRow("Aktiv / active", inpActive, "Pixelbreite (z.B. 70)")
  );

  btnBar.append(btnReload, btnReset, btnSave);

  root.append(title, hint, meta, errorBox, form, btnBar);

  return {
    root,
    load,
    save,
    reset,
    identity: PROJECT_FIRMS_IDENTITY,
  };
}

