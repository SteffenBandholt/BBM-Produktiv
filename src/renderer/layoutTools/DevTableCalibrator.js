// DEV-only helper for table layout calibration.
//
// Goals:
// - Keep calibration UI out of module screens (Protokoll, etc.)
// - Use the existing tableLayouts IPC API (GetOne/Save/Reset/ListDefinitions)
// - Provide a registry-based picker so users don't need to know internal table keys
//
// This module intentionally stays UI-framework-free (plain DOM).

function _clampText(v) {
  return String(v ?? "").trim();
}

function _dispatchTableLayoutChanged(identity = {}) {
  try {
    window.dispatchEvent(
      new CustomEvent("bbm:tableLayoutChanged", {
        detail: {
          moduleId: String(identity.moduleId || "").trim(),
          tableKey: String(identity.tableKey || "").trim(),
          orientation: String(identity.orientation || "portrait").trim(),
        },
      })
    );
  } catch (_err) {
    // ignore
  }
}

function _mkTextInput({ placeholder = "" } = {}) {
  const el = document.createElement("input");
  el.type = "text";
  el.placeholder = placeholder;
  el.style.width = "100%";
  el.style.boxSizing = "border-box";
  el.style.padding = "6px 8px";
  el.style.border = "1px solid rgba(0,0,0,0.18)";
  el.style.borderRadius = "8px";
  el.style.fontSize = "12px";
  el.autocomplete = "off";
  el.spellcheck = false;
  return el;
}

function _mkButton({ label, variant = "neutral", applyPopupButtonStyle }) {
  const el = document.createElement("button");
  el.type = "button";
  el.textContent = label;
  applyPopupButtonStyle(el, { variant });
  return el;
}

function _mkRow({ labelText, cols = [], width = "260px", hintText = "" } = {}) {
  const row = document.createElement("div");
  row.style.display = "grid";
  row.style.gridTemplateColumns = `${width} ${cols.map(() => "1fr").join(" ")}`.trim();
  row.style.gap = "10px";
  row.style.alignItems = "center";

  const label = document.createElement("div");
  label.textContent = labelText;
  label.style.fontWeight = "700";
  label.style.fontSize = "12px";
  label.style.color = "#334155";
  row.appendChild(label);

  for (const node of cols) row.appendChild(node);

  if (hintText) {
    const hint = document.createElement("div");
    hint.textContent = hintText;
    hint.style.fontSize = "12px";
    hint.style.opacity = "0.75";
    // if hints are used, caller should include it as an explicit column
    row.appendChild(hint);
  }

  return row;
}

async function _openRegistryLayoutEditor({ api, openSettingsModal, definition } = {}) {
  const def = definition && typeof definition === "object" ? definition : null;
  const moduleId = String(def?.moduleId || "").trim();
  const tableKey = String(def?.tableKey || "").trim();
  if (!moduleId || !tableKey) return false;
  if (def?.editorEnabled === false) return false;

  const { createTableLayoutPrototypeEditor } = await import("../views/TableLayoutPrototypeEditor.js");
  const editor = createTableLayoutPrototypeEditor({ api });

  const shell = document.createElement("div");
  shell.dataset.tableLayoutShell = "1";
  shell.style.display = "grid";
  shell.style.gap = "8px";
  shell.style.minWidth = "min(1120px, calc(100vw - 80px))";
  shell.style.maxWidth = "min(1600px, calc(100vw - 24px))";

  shell.append(editor.root);
  openSettingsModal({
    title: `Tabellen-Kalibrator (DEV-only) – ${String(def?.tableLabel || tableKey)}`,
    content: [shell],
    closeOnly: true,
  });
  if (typeof editor.attachFullscreenHost === "function") {
    editor.attachFullscreenHost(shell);
  }
  await editor.load({
    moduleId,
    tableKey,
    orientation: "portrait",
  });
  return true;
}

async function _openProtokollTopsCalibrator({ api, has, openSettingsModal, applyPopupCardStyle, applyPopupButtonStyle } = {}) {
  const identity = Object.freeze({
    moduleId: "protokoll",
    tableKey: "protokoll_tops",
    orientation: "portrait",
  });

  const {
    extractProtokollTopsEditorValues,
    buildProtokollTopsLayoutOverlay,
    validateProtokollTopsEditorValues,
  } = await import("../../shared/tableLayouts/protokollTopsLayout.js");

  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gap = "10px";
  wrap.style.minWidth = "min(860px, calc(100vw - 80px))";
  wrap.style.maxWidth = "980px";

  const head = document.createElement("div");
  head.style.display = "grid";
  head.style.gap = "2px";
  const title = document.createElement("div");
  title.textContent = "Tabellen-Kalibrator (DEV-only) – TOP-Liste";
  title.style.fontWeight = "900";
  const sub = document.createElement("div");
  sub.textContent = "Tabelle: protokoll_tops (UI + PDF). Speichern schreibt Layoutwerte dauerhaft.";
  sub.style.fontSize = "12px";
  sub.style.opacity = "0.8";
  head.append(title, sub);

  const card = document.createElement("div");
  applyPopupCardStyle(card);
  card.style.padding = "10px 12px";
  card.style.display = "grid";
  card.style.gap = "10px";

  const uiNumberWidth = _mkTextInput({ placeholder: "z.B. 64px" });
  const uiMetaWidth = _mkTextInput({ placeholder: "z.B. 74px" });
  const pdfNumberWidth = _mkTextInput({ placeholder: "z.B. 23mm" });
  const pdfMetaWidth = _mkTextInput({ placeholder: "z.B. 15ch" });

  const msg = document.createElement("div");
  msg.style.fontSize = "12px";
  msg.style.minHeight = "18px";
  msg.style.color = "#334155";

  const load = async () => {
    if (!has("tableLayoutsGetOne")) {
      msg.textContent = "tableLayoutsGetOne fehlt.";
      msg.style.color = "#9d1c1c";
      return false;
    }
    const res = await api.tableLayoutsGetOne(identity);
    if (!res?.ok) {
      msg.textContent = res?.error || "Layout konnte nicht geladen werden.";
      msg.style.color = "#9d1c1c";
      return false;
    }
    const layout = res?.data?.effectiveLayout || res?.data?.defaultLayout || null;
    const values = extractProtokollTopsEditorValues(layout || {});
    uiNumberWidth.value = _clampText(values.uiNumberWidth || "");
    uiMetaWidth.value = _clampText(values.uiMetaWidth || "");
    pdfNumberWidth.value = _clampText(values.pdfNumberWidth || "");
    pdfMetaWidth.value = _clampText(values.pdfMetaWidth || "");
    msg.textContent = "Layout geladen.";
    msg.style.color = "#334155";
    return true;
  };

  const apply = async ({ reset = false } = {}) => {
    if (reset) {
      if (!has("tableLayoutsReset")) {
        msg.textContent = "tableLayoutsReset fehlt.";
        msg.style.color = "#9d1c1c";
        return false;
      }
      const resReset = await api.tableLayoutsReset({ ...identity, scopeType: "global" });
      if (!resReset?.ok) {
        msg.textContent = resReset?.error || "Reset fehlgeschlagen.";
        msg.style.color = "#9d1c1c";
        return false;
      }
      _dispatchTableLayoutChanged(identity);
      msg.textContent = "Reset ausgeführt (Defaults aktiv).";
      msg.style.color = "#334155";
      await load();
      return true;
    }

    if (!has("tableLayoutsSave")) {
      msg.textContent = "tableLayoutsSave fehlt.";
      msg.style.color = "#9d1c1c";
      return false;
    }

    const draft = {
      orientation: "portrait",
      uiNumberWidth: _clampText(uiNumberWidth.value),
      uiMetaWidth: _clampText(uiMetaWidth.value),
      pdfNumberWidth: _clampText(pdfNumberWidth.value),
      pdfMetaWidth: _clampText(pdfMetaWidth.value),
    };
    const validated = validateProtokollTopsEditorValues(draft, "portrait");
    if (!validated?.isValid) {
      msg.textContent = "Ungültige Werte. Beispiele: 64px, 23mm, 15ch";
      msg.style.color = "#9d1c1c";
      return false;
    }
    const layout = buildProtokollTopsLayoutOverlay(validated.values, validated.values.orientation);

    const resSave = await api.tableLayoutsSave({
      ...identity,
      scopeType: "global",
      layout,
    });
    if (!resSave?.ok) {
      msg.textContent = resSave?.error || "Speichern fehlgeschlagen.";
      msg.style.color = "#9d1c1c";
      return false;
    }
    _dispatchTableLayoutChanged(identity);
    msg.textContent = "Gespeichert und angewendet.";
    msg.style.color = "#334155";
    return true;
  };

  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.gap = "8px";
  btnRow.style.flexWrap = "wrap";

  const bLoad = _mkButton({ label: "Laden", variant: "neutral", applyPopupButtonStyle });
  bLoad.onclick = async () => void (await load());
  const bApply = _mkButton({ label: "Anwenden (Speichern)", variant: "primary", applyPopupButtonStyle });
  bApply.onclick = async () => void (await apply({ reset: false }));
  const bReset = _mkButton({ label: "Reset (Defaults)", variant: "danger", applyPopupButtonStyle });
  bReset.onclick = async () => void (await apply({ reset: true }));
  btnRow.append(bLoad, bApply, bReset);

  card.append(
    _mkRow({ labelText: "UI: Nummernspalte", cols: [uiNumberWidth, (() => { const h = document.createElement("div"); h.textContent = "z.B. 64px"; h.style.fontSize = "12px"; h.style.opacity = "0.75"; return h; })()], width: "220px" }),
    _mkRow({ labelText: "UI: Metaspalte", cols: [uiMetaWidth, (() => { const h = document.createElement("div"); h.textContent = "z.B. 74px"; h.style.fontSize = "12px"; h.style.opacity = "0.75"; return h; })()], width: "220px" }),
    _mkRow({ labelText: "PDF: Nummernspalte", cols: [pdfNumberWidth, (() => { const h = document.createElement("div"); h.textContent = "z.B. 23mm"; h.style.fontSize = "12px"; h.style.opacity = "0.75"; return h; })()], width: "220px" }),
    _mkRow({ labelText: "PDF: Metaspalte", cols: [pdfMetaWidth, (() => { const h = document.createElement("div"); h.textContent = "z.B. 15ch"; h.style.fontSize = "12px"; h.style.opacity = "0.75"; return h; })()], width: "220px" }),
    btnRow,
    msg
  );

  wrap.append(head, card);
  openSettingsModal({
    title: "Tabellen-Kalibrator (DEV-only)",
    content: [wrap],
    closeOnly: true,
  });

  await load(); 
} 
 
async function _openProtokollParticipantsCalibrator({ 
  api, 
  has, 
  openSettingsModal, 
  applyPopupCardStyle, 
  applyPopupButtonStyle, 
} = {}) { 
  const identity = Object.freeze({ 
    moduleId: "protokoll", 
    tableKey: "protokoll_participants", 
    orientation: "portrait", 
  }); 
 
  const { validateTableLayoutColumns, buildTableLayoutOverlayFromColumns } = await import( 
    "../../shared/tableLayouts/protokollTopsLayout.js" 
  ); 
 
  const keys = ["name", "function", "company", "contact", "attendance"]; 
 
  const wrap = document.createElement("div"); 
  wrap.style.display = "grid"; 
  wrap.style.gap = "10px"; 
  wrap.style.minWidth = "min(920px, calc(100vw - 80px))"; 
  wrap.style.maxWidth = "1040px"; 
 
  const head = document.createElement("div"); 
  head.style.display = "grid"; 
  head.style.gap = "2px"; 
  const title = document.createElement("div"); 
  title.textContent = "Tabellen-Kalibrator (DEV-only) â€“ Teilnehmerliste (PDF)"; 
  title.style.fontWeight = "900"; 
  const sub = document.createElement("div"); 
  sub.textContent = "Tabelle: protokoll_participants (nur PDF-Breiten). Speichern schreibt Layoutwerte dauerhaft."; 
  sub.style.fontSize = "12px"; 
  sub.style.opacity = "0.8"; 
  head.append(title, sub); 
 
  const card = document.createElement("div"); 
  applyPopupCardStyle(card); 
  card.style.padding = "10px 12px"; 
  card.style.display = "grid"; 
  card.style.gap = "10px"; 
 
  const inputs = new Map(); 
  for (const key of keys) inputs.set(key, _mkTextInput({ placeholder: "z.B. 36mm" })); 
 
  const msg = document.createElement("div"); 
  msg.style.fontSize = "12px"; 
  msg.style.minHeight = "18px"; 
  msg.style.color = "#334155"; 
 
  let lastLoadedColumns = []; 
  let fallbackColumns = []; 
 
  const load = async () => { 
    if (!has("tableLayoutsGetOne")) { 
      msg.textContent = "tableLayoutsGetOne fehlt."; 
      msg.style.color = "#9d1c1c"; 
      return false; 
    } 
    const res = await api.tableLayoutsGetOne(identity); 
    if (!res?.ok) { 
      msg.textContent = res?.error || "Layout konnte nicht geladen werden."; 
      msg.style.color = "#9d1c1c"; 
      return false; 
    } 
    const effective = res?.data?.effectiveLayout || null; 
    const def = res?.data?.defaultLayout || null; 
    lastLoadedColumns = Array.isArray(effective?.columns) 
      ? effective.columns 
      : Array.isArray(def?.columns) 
        ? def.columns 
        : []; 
    fallbackColumns = Array.isArray(def?.columns) ? def.columns : []; 
 
    const byKey = new Map(); 
    for (const col of lastLoadedColumns) byKey.set(String(col?.key || ""), col); 
    for (const key of keys) { 
      const col = byKey.get(key) || {}; 
      const input = inputs.get(key); 
      if (input) input.value = _clampText(col.pdfWidth || ""); 
    } 
    msg.textContent = "Layout geladen."; 
    msg.style.color = "#334155"; 
    return true; 
  }; 
 
  const apply = async ({ reset = false } = {}) => { 
    if (reset) { 
      if (!has("tableLayoutsReset")) { 
        msg.textContent = "tableLayoutsReset fehlt."; 
        msg.style.color = "#9d1c1c"; 
        return false; 
      } 
      const resReset = await api.tableLayoutsReset({ ...identity, scopeType: "global" }); 
      if (!resReset?.ok) { 
        msg.textContent = resReset?.error || "Reset fehlgeschlagen."; 
        msg.style.color = "#9d1c1c"; 
        return false; 
      } 
      _dispatchTableLayoutChanged(identity); 
      msg.textContent = "Reset ausgefÃ¼hrt (Defaults aktiv)."; 
      msg.style.color = "#334155"; 
      await load(); 
      return true; 
    } 
 
    if (!has("tableLayoutsSave")) { 
      msg.textContent = "tableLayoutsSave fehlt."; 
      msg.style.color = "#9d1c1c"; 
      return false; 
    } 
 
    const updated = (Array.isArray(lastLoadedColumns) ? lastLoadedColumns : []).map((c) => ({ ...(c || {}) })); 
    const byKey = new Map(); 
    for (const col of updated) byKey.set(String(col?.key || ""), col); 
    for (const key of keys) { 
      const col = byKey.get(key); 
      if (!col) continue; 
      col.pdfWidth = _clampText(inputs.get(key)?.value || ""); 
    } 
 
    const validated = validateTableLayoutColumns(updated, fallbackColumns); 
    if (!validated?.isValid) { 
      msg.textContent = "UngÃ¼ltige Werte. Beispiele: 36mm, 45mm, 110px"; 
      msg.style.color = "#9d1c1c"; 
      return false; 
    } 
 
    const layout = buildTableLayoutOverlayFromColumns(validated.columns, "portrait", { fallbackColumns }); 
    const resSave = await api.tableLayoutsSave({ ...identity, scopeType: "global", layout }); 
    if (!resSave?.ok) { 
      msg.textContent = resSave?.error || "Speichern fehlgeschlagen."; 
      msg.style.color = "#9d1c1c"; 
      return false; 
    } 
    _dispatchTableLayoutChanged(identity); 
    msg.textContent = "Gespeichert und angewendet."; 
    msg.style.color = "#334155"; 
    return true; 
  }; 
 
  const btnRow = document.createElement("div"); 
  btnRow.style.display = "flex"; 
  btnRow.style.gap = "8px"; 
  btnRow.style.flexWrap = "wrap"; 
  const bLoad = _mkButton({ label: "Laden", variant: "neutral", applyPopupButtonStyle }); 
  bLoad.onclick = async () => void (await load()); 
  const bApply = _mkButton({ label: "Anwenden (Speichern)", variant: "primary", applyPopupButtonStyle }); 
  bApply.onclick = async () => void (await apply({ reset: false })); 
  const bReset = _mkButton({ label: "Reset (Defaults)", variant: "danger", applyPopupButtonStyle }); 
  bReset.onclick = async () => void (await apply({ reset: true })); 
  btnRow.append(bLoad, bApply, bReset); 
 
  const mkHint = (t) => { 
    const h = document.createElement("div"); 
    h.textContent = t; 
    h.style.fontSize = "12px"; 
    h.style.opacity = "0.75"; 
    return h; 
  }; 
 
  card.append( 
    _mkRow({ labelText: "PDF: Name", cols: [inputs.get("name"), mkHint("z.B. 36mm")], width: "220px" }), 
    _mkRow({ labelText: "PDF: Funktion", cols: [inputs.get("function"), mkHint("z.B. 36mm")], width: "220px" }), 
    _mkRow({ labelText: "PDF: Firma", cols: [inputs.get("company"), mkHint("z.B. 30mm")], width: "220px" }), 
    _mkRow({ labelText: "PDF: Telefon / E-Mail", cols: [inputs.get("contact"), mkHint("z.B. 45mm")], width: "220px" }), 
    _mkRow({ labelText: "PDF: Anwesend / Verteiler", cols: [inputs.get("attendance"), mkHint("z.B. 26mm")], width: "220px" }), 
    btnRow, 
    msg 
  ); 
 
  wrap.append(head, card); 
  openSettingsModal({ title: "Tabellen-Kalibrator (DEV-only)", content: [wrap], closeOnly: true }); 
  await load(); 
} 
 
async function _openTodoPrintCalibrator({ 
  api, 
  has, 
  openSettingsModal, 
  applyPopupCardStyle, 
  applyPopupButtonStyle, 
} = {}) { 
  const identity = Object.freeze({ 
    moduleId: "protokoll", 
    tableKey: "print.todo.todoTable", 
    orientation: "portrait", 
  }); 
 
  const zones = [ 
    { key: "top", label: "TOP" }, 
    { key: "kurztext", label: "Kurztext" }, 
    { key: "status", label: "Status" }, 
    { key: "fertig_bis", label: "Fertig bis" }, 
    { key: "ampel", label: "Ampel" }, 
  ]; 
 
  const wrap = document.createElement("div"); 
  wrap.style.display = "grid"; 
  wrap.style.gap = "10px"; 
  wrap.style.minWidth = "min(980px, calc(100vw - 80px))"; 
  wrap.style.maxWidth = "1120px"; 
 
  const head = document.createElement("div"); 
  head.style.display = "grid"; 
  head.style.gap = "2px"; 
  const title = document.createElement("div"); 
  title.textContent = "Tabellen-Kalibrator (DEV-only) â€“ ToDo-Liste (PDF)"; 
  title.style.fontWeight = "900"; 
  const sub = document.createElement("div"); 
  sub.textContent = "Tabelle: print.todo.todoTable (nur PDF rootVars). Speichern schreibt Layoutwerte dauerhaft."; 
  sub.style.fontSize = "12px"; 
  sub.style.opacity = "0.8"; 
  head.append(title, sub); 
 
  const card = document.createElement("div"); 
  applyPopupCardStyle(card); 
  card.style.padding = "10px 12px"; 
  card.style.display = "grid"; 
  card.style.gap = "10px"; 
 
  const inputs = new Map(); 
  for (const z of zones) { 
    inputs.set(z.key, { 
      widthEl: _mkTextInput({ placeholder: "z.B. 21mm" }), 
      insetEl: _mkTextInput({ placeholder: "z.B. 1mm" }), 
      fontEl: _mkTextInput({ placeholder: "z.B. 11pt" }), 
    }); 
  } 
 
  const msg = document.createElement("div"); 
  msg.style.fontSize = "12px"; 
  msg.style.minHeight = "18px"; 
  msg.style.color = "#334155"; 
 
  let lastLoadedLayout = null; 
 
  const load = async () => { 
    if (!has("tableLayoutsGetOne")) { 
      msg.textContent = "tableLayoutsGetOne fehlt."; 
      msg.style.color = "#9d1c1c"; 
      return false; 
    } 
    const res = await api.tableLayoutsGetOne(identity); 
    if (!res?.ok) { 
      msg.textContent = res?.error || "Layout konnte nicht geladen werden."; 
      msg.style.color = "#9d1c1c"; 
      return false; 
    } 
    const layout = res?.data?.effectiveLayout || res?.data?.defaultLayout || null; 
    lastLoadedLayout = layout && typeof layout === "object" ? layout : null; 
    const rootVars = layout?.pdf?.rootVars && typeof layout.pdf.rootVars === "object" ? layout.pdf.rootVars : {}; 
 
    for (const z of zones) { 
      const bag = inputs.get(z.key); 
      if (!bag) continue; 
      bag.widthEl.value = _clampText(rootVars[`--bbm-todo-col-${z.key}-width`] || ""); 
      bag.insetEl.value = _clampText(rootVars[`--bbm-todo-col-${z.key}-padding-inline`] || ""); 
      bag.fontEl.value = _clampText(rootVars[`--bbm-todo-col-${z.key}-font-size`] || ""); 
    } 
 
    msg.textContent = "Layout geladen."; 
    msg.style.color = "#334155"; 
    return true; 
  }; 
 
  const apply = async ({ reset = false } = {}) => { 
    if (reset) { 
      if (!has("tableLayoutsReset")) { 
        msg.textContent = "tableLayoutsReset fehlt."; 
        msg.style.color = "#9d1c1c"; 
        return false; 
      } 
      const resReset = await api.tableLayoutsReset({ ...identity, scopeType: "global" }); 
      if (!resReset?.ok) { 
        msg.textContent = resReset?.error || "Reset fehlgeschlagen."; 
        msg.style.color = "#9d1c1c"; 
        return false; 
      } 
      _dispatchTableLayoutChanged(identity); 
      msg.textContent = "Reset ausgefÃ¼hrt (Defaults aktiv)."; 
      msg.style.color = "#334155"; 
      await load(); 
      return true; 
    } 
 
    if (!has("tableLayoutsSave")) { 
      msg.textContent = "tableLayoutsSave fehlt."; 
      msg.style.color = "#9d1c1c"; 
      return false; 
    } 
 
    const pdfRootVars = { ...(lastLoadedLayout?.pdf?.rootVars || {}) }; 
    for (const z of zones) { 
      const bag = inputs.get(z.key); 
      if (!bag) continue; 
      pdfRootVars[`--bbm-todo-col-${z.key}-width`] = _clampText(bag.widthEl.value); 
      pdfRootVars[`--bbm-todo-col-${z.key}-padding-inline`] = _clampText(bag.insetEl.value); 
      pdfRootVars[`--bbm-todo-col-${z.key}-font-size`] = _clampText(bag.fontEl.value); 
    } 
 
    const layout = { variant: "portrait", pdf: { rootVars: pdfRootVars } }; 
    const resSave = await api.tableLayoutsSave({ ...identity, scopeType: "global", layout }); 
    if (!resSave?.ok) { 
      msg.textContent = resSave?.error || "Speichern fehlgeschlagen."; 
      msg.style.color = "#9d1c1c"; 
      return false; 
    } 
    _dispatchTableLayoutChanged(identity); 
    msg.textContent = "Gespeichert und angewendet."; 
    msg.style.color = "#334155"; 
    return true; 
  }; 
 
  const btnRow = document.createElement("div"); 
  btnRow.style.display = "flex"; 
  btnRow.style.gap = "8px"; 
  btnRow.style.flexWrap = "wrap"; 
  const bLoad = _mkButton({ label: "Laden", variant: "neutral", applyPopupButtonStyle }); 
  bLoad.onclick = async () => void (await load()); 
  const bApply = _mkButton({ label: "Anwenden (Speichern)", variant: "primary", applyPopupButtonStyle }); 
  bApply.onclick = async () => void (await apply({ reset: false })); 
  const bReset = _mkButton({ label: "Reset (Defaults)", variant: "danger", applyPopupButtonStyle }); 
  bReset.onclick = async () => void (await apply({ reset: true })); 
  btnRow.append(bLoad, bApply, bReset); 
 
  const grid = document.createElement("div"); 
  grid.style.display = "grid"; 
  grid.style.gap = "10px"; 
  for (const z of zones) { 
    const bag = inputs.get(z.key); 
    if (!bag) continue; 
    grid.appendChild( 
      _mkRow({ 
        labelText: `PDF: ${z.label}`, 
        cols: [bag.widthEl, bag.insetEl, bag.fontEl], 
        width: "220px", 
      }) 
    ); 
  } 
 
  const hints = document.createElement("div"); 
  hints.style.fontSize = "12px"; 
  hints.style.opacity = "0.75"; 
  hints.textContent = "Spalten: Breite (mm), Innenabstand (mm), Schrift (pt). Beispiele: 21mm / 1mm / 11pt"; 
 
  card.append(grid, hints, btnRow, msg); 
  wrap.append(head, card); 
  openSettingsModal({ title: "Tabellen-Kalibrator (DEV-only)", content: [wrap], closeOnly: true }); 
  await load(); 
} 

// Public: build the DEV-only "Tabellen" card content for Settings > Entwicklung 
export async function buildDevTableCalibratorCard({ 
  api, 
  has, 
  applyPopupCardStyle,
  applyPopupButtonStyle,
  openSettingsModal,
} = {}) {
  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gap = "8px";

  const quick = document.createElement("div");
  quick.style.display = "flex";
  quick.style.gap = "8px";
  quick.style.flexWrap = "wrap";

  const bTops = _mkButton({ label: "TOP-Liste (protokoll_tops)", variant: "primary", applyPopupButtonStyle });
  bTops.onclick = async () => void (await _openProtokollTopsCalibrator({ api, has, openSettingsModal, applyPopupCardStyle, applyPopupButtonStyle }));
  const bTopsAll = _mkButton({ label: "TOP-Liste alle (topsAll) – nutzt protokoll_tops", variant: "neutral", applyPopupButtonStyle });
  bTopsAll.onclick = async () => void (await _openProtokollTopsCalibrator({ api, has, openSettingsModal, applyPopupCardStyle, applyPopupButtonStyle }));

  const bParticipants = _mkButton({ label: "Teilnehmerliste (protokoll_participants)", variant: "neutral", applyPopupButtonStyle }); 
  bParticipants.onclick = async () => 
    void (await _openProtokollParticipantsCalibrator({ api, has, openSettingsModal, applyPopupCardStyle, applyPopupButtonStyle })); 
 
  const bTodo = _mkButton({ label: "ToDo-Liste (print.todo.todoTable)", variant: "neutral", applyPopupButtonStyle }); 
  bTodo.onclick = async () => 
    void (await _openTodoPrintCalibrator({ api, has, openSettingsModal, applyPopupCardStyle, applyPopupButtonStyle })); 
 
  quick.append(bTops, bTopsAll, bParticipants, bTodo); 

  const head = document.createElement("div");
  head.textContent = "Registrierte Tabellen (aus der Registry):";
  head.style.fontSize = "12px";
  head.style.fontWeight = "800";
  head.style.opacity = "0.9";

  const search = _mkTextInput({ placeholder: "Tabelle suchen (Name oder tableKey)..." });
  const list = document.createElement("div");
  list.style.display = "grid";
  list.style.gap = "6px";

  let defs = [];
  const render = () => {
    const q = String(search.value || "").trim().toLowerCase();
    list.replaceChildren();
    const items = Array.isArray(defs) ? defs : [];
    const filtered = q
      ? items.filter((d) => {
          const t = `${d.moduleLabel || d.moduleId || ""} ${d.tableLabel || ""} ${d.tableKey || ""}`.toLowerCase();
          return t.includes(q);
        })
      : items;

    for (const def of filtered.slice(0, 80)) {
      const row = document.createElement("button");
      row.type = "button";
      row.style.textAlign = "left";
      row.style.padding = "8px 10px";
      row.style.borderRadius = "10px";
      row.style.border = "1px solid rgba(0,0,0,0.12)";
      row.style.background = "rgba(255,255,255,0.65)";
      row.style.cursor = "pointer";
      row.style.display = "grid";
      row.style.gap = "2px";

      const line1 = document.createElement("div");
      line1.textContent = `${String(def.moduleLabel || def.moduleId || "Modul")}: ${String(def.tableLabel || def.tableKey)}`;
      line1.style.fontWeight = "800";
      line1.style.fontSize = "12px";

      const line2 = document.createElement("div");
      line2.textContent = `tableKey: ${String(def.tableKey)} | moduleId: ${String(def.moduleId)} | UI: ${def.uiAvailable ? "ja" : "nein"} | PDF: ${def.pdfAvailable ? "ja" : "nein"}`;
      line2.style.fontSize = "12px";
      line2.style.opacity = "0.78";

      row.append(line1, line2);
      row.onclick = async () => {
        // For now, keep "Tops" as dedicated pilot calibrator.
        if (def.moduleId === "protokoll" && def.tableKey === "protokoll_tops") {
          await _openProtokollTopsCalibrator({ api, has, openSettingsModal, applyPopupCardStyle, applyPopupButtonStyle });
          return;
        }
        if (def.moduleId === "protokoll" && def.tableKey === "protokoll_participants") { 
          await _openProtokollParticipantsCalibrator({ api, has, openSettingsModal, applyPopupCardStyle, applyPopupButtonStyle }); 
          return; 
        } 
        if (def.moduleId === "protokoll" && def.tableKey === "print.todo.todoTable") { 
          await _openTodoPrintCalibrator({ api, has, openSettingsModal, applyPopupCardStyle, applyPopupButtonStyle }); 
          return; 
        } 
        if (def?.editorEnabled !== false) {
          const opened = await _openRegistryLayoutEditor({ api, openSettingsModal, definition: def });
          if (opened) return;
        }
        // Keep the block for layouts that are not editor-enabled yet.
        const info = document.createElement("div"); 
        info.textContent = `Nicht fuer den Layout-Kalibrator freigeschaltet: moduleId=${def.moduleId}, tableKey=${def.tableKey}`; 
        info.style.fontSize = "12px"; 
        info.style.opacity = "0.85";
        openSettingsModal({ title: "Tabellen-Kalibrator (DEV-only)", content: [info], closeOnly: true });
      };
      list.appendChild(row);
    }
  };

  search.addEventListener("input", () => render());

  if (has("tableLayoutsListDefinitions")) {
    try {
      const res = await api.tableLayoutsListDefinitions();
      defs = res?.ok && Array.isArray(res.data) ? res.data : [];
    } catch (_err) {
      defs = [];
    }
  }
  render();

  wrap.append(quick, head, search, list);
  return wrap;
}
