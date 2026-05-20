import { renderPrint } from "./layout/PrintShell.js";
import { computeAmpelColorForTop, computeAmpelMapForTops } from "../../shared/ampel/pdfAmpelRule.js";
import { renderHeaderTestPages } from "./headerTest/HeaderTestPages.js";
import { renderV2GlobalHeader } from "./v2/header/GlobalHeader.js";
import { renderV2FullHeader } from "./v2/header/FullHeader.js";
import { renderV2MiniHeader } from "./v2/header/MiniHeader.js";
import { V2_LAYOUT } from "./v2/v2LayoutConfig.js";
import {
  normalizeTopLongText,
  normalizeTopShortText,
} from "../shared/text/topTextPresentation.js";
import {
  getProtokollTopsLayout,
  extractProtokollTopsEditorValues,
  buildProtokollTopsLayoutOverlay,
} from "../../shared/tableLayouts/protokollTopsLayout.js";
import { normalizePrintMode } from "../../shared/print/printModes.mjs";
import {
  buildAutoLayoutSurfaceDescriptor,
  isDevLayoutBuildChannel,
  isSimpleAutoLayoutTableCandidate,
} from "../layoutTools/autoTableLayout.mjs";
import { getRestarbeitenAmpelState } from "../modules/restarbeiten/viewModel/restarbeitenListItems.js";
import {
  APP_SETTINGS_CHANGED_EVENT,
  LAYOUT_CALIBRATION_SETTING_KEY,
  parseLayoutCalibrationEnabled,
  loadLayoutCalibrationEnabled,
} from "../layoutTools/layoutCalibrationState.js";

const app = document.getElementById("app");
const PROTOKOLL_TOPS_LAYOUT = getProtokollTopsLayout();

function setError(text) {
  if (!app) return;
  app.innerHTML = "";
  const div = document.createElement("div");
  div.textContent = text;
  div.style.padding = "20px";
  div.style.color = "#b00020";
  app.appendChild(div);
}

function _projectLabel(project) {
  if (!project) return "Projekt: -";
  const nr = String(project.project_number || project.projectNumber || "").trim();
  const name = String(project.name || "").trim();
  if (nr && name) return `Projekt: ${nr} - ${name}`;
  if (nr) return `Projekt: ${nr}`;
  if (name) return `Projekt: ${name}`;
  return "Projekt: -";
}

function _docLabel(mode) {
  const normalizedMode = normalizePrintMode(mode);
  if (normalizedMode === "preview" || normalizedMode === "vorabzug") return "Vorabzug";
  if (normalizedMode === "protocol") return "Protokoll";
  if (normalizedMode === "topsAll") return "TOP-Liste";
  if (normalizedMode === "firms") return "Firmenliste";
  if (normalizedMode === "todo") return "ToDo-Liste";
  if (normalizedMode === "restarbeiten") return "Restarbeitenliste";
  if (normalizedMode === "headerTest") return "Kopf-Test";
  return "Dokument";
}

function _normalizeAutoLayoutText(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

function _getAutoLayoutTableHeaderTexts(table) {
  const headerRow = table?.querySelector?.("thead tr");
  if (!headerRow) return [];
  return Array.from(headerRow.querySelectorAll("th"))
    .map((cell) => _normalizeAutoLayoutText(cell?.textContent || ""))
    .filter((text) => text.length > 0);
}

function _getAutoLayoutTableColClasses(table) {
  const cols = Array.from(table?.querySelectorAll?.("colgroup col") || []);
  return cols.map((col) => _normalizeAutoLayoutText(col?.className || ""));
}

function _getAutoLayoutTableColumnCount(table) {
  const headerCount = table?.querySelectorAll?.("thead tr:first-child th")?.length || 0;
  const colCount = table?.querySelectorAll?.("colgroup col")?.length || 0;
  let bodyCount = 0;
  const rows = Array.from(table?.querySelectorAll?.("tbody tr") || []);
  for (const row of rows) {
    const cells = Array.from(row.children || []).filter((cell) => cell?.tagName === "TD" || cell?.tagName === "TH");
    let count = 0;
    for (const cell of cells) {
      const span = Number(cell?.colSpan || 1);
      count += Number.isFinite(span) && span > 0 ? span : 1;
    }
    bodyCount = Math.max(bodyCount, count);
  }
  return Math.max(headerCount, colCount, bodyCount);
}

function _getAutoLayoutTableClassToken(table) {
  const classes = String(table?.className || "")
    .split(/\s+/)
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  for (const token of classes) {
    const lower = token.toLowerCase();
    if (["topsTable", "v2ParticipantsTable", "firmsTable", "firmsCardsTable"].includes(token)) continue;
    if (lower.includes("card")) continue;
    if (lower === "printroot" || lower === "page" || lower === "table") continue;
    return token;
  }
  return "";
}

function _clearDevPdfAutoSelection(root) {
  if (!root?.dataset) return;
  delete root.dataset.devPdfAutoActiveSurfaceKey;
  delete root.dataset.devPdfAutoActiveZone;
  root
    .querySelectorAll?.("[data-dev-pdf-auto-surface]")
    .forEach((table) => (table.dataset.devPdfAutoSurfaceActive = "false"));
  root
    .querySelectorAll?.("[data-dev-pdf-auto-zone]")
    .forEach((node) => (node.dataset.devPdfAutoZoneActive = "false"));
}

function _syncDevPdfAutoSelection(root) {
  if (!root?.dataset) return null;
  const activeSurfaceKey = String(root.dataset.devPdfAutoActiveSurfaceKey || "").trim();
  const activeZone = String(root.dataset.devPdfAutoActiveZone || "").trim();
  const surfaces = Array.from(root.querySelectorAll?.("[data-dev-pdf-auto-surface]") || []);
  let activeSurface = null;

  for (const table of surfaces) {
    const tableKey = String(table?.dataset?.devPdfAutoSurfaceKey || "").trim();
    const isActive = !!activeSurfaceKey && tableKey === activeSurfaceKey;
    table.dataset.devPdfAutoSurfaceActive = isActive ? "true" : "false";
    if (isActive) activeSurface = table;
    const zones = Array.from(table.querySelectorAll?.("[data-dev-pdf-auto-zone]") || []);
    for (const node of zones) {
      const zoneKey = String(node?.dataset?.devPdfAutoZoneKey || "").trim();
      node.dataset.devPdfAutoZoneActive = isActive && zoneKey === activeZone ? "true" : "false";
    }
  }

  return activeSurface;
}

function _decorateAutoLayoutTables(root, runtimeData = null) {
  if (!root) return [];
  const mode = runtimeData?.mode || "preview";
  const tables = Array.from(root.querySelectorAll?.("table") || []);
  const descriptors = [];
  const seenSurfaceCounts = new Map();

  tables.forEach((table, index) => {
    if (!table || !isSimpleAutoLayoutTableCandidate({
      hasTheadTh: !!table.querySelector?.("thead th"),
      hasColgroupCol: !!table.querySelector?.("colgroup col"),
      hasNestedTable: !!table.querySelector?.("table table"),
      hasManualMarkers:
        !!table.querySelector?.("[data-dev-pdf-zone], [data-dev-pdf-participants-zone]") ||
        !!table.closest?.("[data-dev-pdf-zone], [data-dev-pdf-participants-zone]"),
      tableClassName: table.className || "",
    })) {
      return;
    }

    const headerTexts = _getAutoLayoutTableHeaderTexts(table);
    const colClasses = _getAutoLayoutTableColClasses(table);
    const columnCount = _getAutoLayoutTableColumnCount(table);
    const descriptor = buildAutoLayoutSurfaceDescriptor({
      mode,
      tableClassName: _getAutoLayoutTableClassToken(table) || table.className || `table${index + 1}`,
      headerTexts,
      colClasses,
      columnCount,
    });
    if (!descriptor?.zones?.length) return;

    const baseSurfaceKey = String(descriptor.surfaceKey || "").trim();
    const surfaceCount = (seenSurfaceCounts.get(baseSurfaceKey) || 0) + 1;
    seenSurfaceCounts.set(baseSurfaceKey, surfaceCount);
    const surfaceKey = surfaceCount === 1 ? baseSurfaceKey : `${baseSurfaceKey}__${surfaceCount}`;
    const uniqueDescriptor = surfaceKey === baseSurfaceKey ? descriptor : { ...descriptor, surfaceKey };

    table.dataset.devPdfAutoSurface = "true";
    table.dataset.devPdfAutoSurfaceKey = uniqueDescriptor.surfaceKey;
    table.dataset.devPdfAutoSurfaceBaseKey = baseSurfaceKey;
    table.dataset.devPdfAutoSurfaceLabel = uniqueDescriptor.surfaceLabel || "Tabelle";
    table.dataset.devPdfAutoSurfaceIndex = String(index);
    table.dataset.devPdfAutoSurfaceActive = "false";

    const zoneByIndex = new Map(uniqueDescriptor.zones.map((zone) => [zone.index, zone]));
    const zoneKeys = new Set(uniqueDescriptor.zones.map((zone) => zone.key));

    const markCell = (cell, zone, cellIndex) => {
      if (!cell || !zone) return;
      cell.dataset.devPdfAutoZone = "true";
      cell.dataset.devPdfAutoZoneKey = zone.key;
      cell.dataset.devPdfAutoZoneLabel = zone.label;
      cell.dataset.devPdfAutoZoneIndex = String(cellIndex);
      cell.dataset.devPdfAutoZoneSource = zone.source;
    };

    const headerRow = table.querySelector?.("thead tr");
    if (headerRow) {
      Array.from(headerRow.children || []).forEach((cell, cellIndex) => {
        if (!cell || (cell.tagName !== "TH" && cell.tagName !== "TD")) return;
        const zone = zoneByIndex.get(cellIndex) || null;
        markCell(cell, zone, cellIndex);
      });
    }

    const bodyRows = Array.from(table.querySelectorAll?.("tbody tr") || []);
    for (const row of bodyRows) {
      const cells = Array.from(row.children || []).filter((cell) => cell?.tagName === "TD" || cell?.tagName === "TH");
      let columnIndex = 0;
      for (const cell of cells) {
        const span = Math.max(1, Number(cell?.colSpan || 1) || 1);
        const zone = zoneByIndex.get(columnIndex) || null;
        if (span === 1 && zone) {
          markCell(cell, zone, columnIndex);
        }
        columnIndex += span;
      }
    }

    descriptors.push({
      ...uniqueDescriptor,
      columnCount,
      zoneKeys,
      table,
      baseSurfaceKey,
    });
  });

  root._bbmDevPdfAutoLayoutSurfaces = descriptors;
  root._bbmDevPdfAutoLayoutSurfaceMap = new Map(descriptors.map((desc) => [desc.surfaceKey, desc]));
  return descriptors;
}

function _captureAutoLayoutDefaults(root) {
  const surfaces = Array.isArray(root?._bbmDevPdfAutoLayoutSurfaces) ? root._bbmDevPdfAutoLayoutSurfaces : [];
  const defaults = new Map();

  for (const surface of surfaces) {
    const surfaceKey = String(surface?.surfaceKey || "").trim();
    if (!surfaceKey || defaults.has(surfaceKey)) continue;
    const zones = new Map();
    for (const zone of Array.isArray(surface?.zones) ? surface.zones : []) {
      const zoneKey = String(zone?.key || "").trim();
      if (!zoneKey || zones.has(zoneKey)) continue;
      zones.set(zoneKey, {
        widthMm: _readAutoZoneWidthMm(root, surfaceKey, zoneKey),
        insetMm: _readAutoZoneInsetMm(root, surfaceKey, zoneKey),
        fontPt: _readAutoZoneFontPt(root, surfaceKey, zoneKey),
      });
    }
    defaults.set(surfaceKey, {
      surfaceKey,
      zones,
    });
  }

  root._bbmDevPdfAutoLayoutDefaults = defaults;
  return defaults;
}

function _getAutoLayoutDefaults(root, surfaceKey, zoneKey) {
  const defaults = root?._bbmDevPdfAutoLayoutDefaults;
  const surface = defaults instanceof Map ? defaults.get(String(surfaceKey || "").trim()) || null : null;
  const zone = surface?.zones instanceof Map ? surface.zones.get(String(zoneKey || "").trim()) || null : null;
  return zone || {
    widthMm: _readAutoZoneWidthMm(root, surfaceKey, zoneKey),
    insetMm: _readAutoZoneInsetMm(root, surfaceKey, zoneKey),
    fontPt: _readAutoZoneFontPt(root, surfaceKey, zoneKey),
  };
}

function _applyAutoLayoutLayout(root, surfaceKey, layout) {
  const descriptor = _getAutoLayoutSurfaceDescriptor(root, surfaceKey);
  const table = descriptor?.table || null;
  if (!table || !layout) return;

  const columns = Array.isArray(layout?.columns) ? layout.columns : [];
  const rootVars = layout?.pdf?.rootVars || {};
  const zones = Array.isArray(layout?.zones) ? layout.zones : [];

  for (const zone of Array.isArray(descriptor.zones) ? descriptor.zones : []) {
    const zoneKey = String(zone?.key || "").trim();
    if (!zoneKey) continue;
    const col = columns.find((item) => String(item?.key || "").trim() === zoneKey) || null;
    const zoneLayout = zones.find((item) => String(item?.key || "").trim() === zoneKey) || null;
    const widthValue = zoneLayout?.width != null ? zoneLayout.width : col?.pdfWidth ?? null;
    const widthMm = _readAutoLayoutLengthMm(widthValue);
    if (widthMm != null) _applyAutoZoneWidthMm(root, surfaceKey, zoneKey, widthMm);
    const insetSource =
      zoneLayout?.inset != null
        ? zoneLayout.inset
        : rootVars[`--bbm-auto-col-${zoneKey}-padding-inline`];
    const insetMm = _readAutoLayoutLengthMm(insetSource);
    if (insetMm != null) {
      _applyAutoZoneInsetMm(root, surfaceKey, zoneKey, insetMm);
    }
    const fontSource =
      zoneLayout?.font != null
        ? zoneLayout.font
        : rootVars[`--bbm-auto-col-${zoneKey}-font-size`];
    const fontPt = _readAutoLayoutLengthPt(fontSource);
    if (fontPt != null) {
      _applyAutoZoneFontPt(root, surfaceKey, zoneKey, fontPt);
    }
  }
}

async function _loadStoredAutoLayouts(root, runtimeData = null) {
  if (!root || typeof window?.bbmPrint?.tableLayoutsGetOne !== "function") return;
  const orientation = _normalizeOrientation(root?.dataset?.orientation || runtimeData?.orientation || "portrait");
  const surfaces = Array.isArray(root._bbmDevPdfAutoLayoutSurfaces) ? root._bbmDevPdfAutoLayoutSurfaces : [];
  for (const surface of surfaces) {
    const surfaceKey = String(surface?.surfaceKey || "").trim();
    if (!surfaceKey) continue;
    try {
      const res = await window.bbmPrint.tableLayoutsGetOne({
        tableKey: surfaceKey,
        moduleId: "protokoll",
        orientation,
      });
      const layout = res?.ok ? res?.data?.effectiveLayout || res?.data?.storedLayout || null : null;
      if (layout) {
        _applyAutoLayoutLayout(root, surfaceKey, layout);
      }
    } catch (_err) {}
  }
}

function _resolveLayoutCalibrationEnabled(payload = null, fallback = false) {
  if (payload && Object.prototype.hasOwnProperty.call(payload, "layoutCalibrationEnabled")) {
    return parseLayoutCalibrationEnabled(payload.layoutCalibrationEnabled, fallback);
  }
  return fallback;
}

function _buildAutoLayoutOverlayFromDom(root, surfaceKey) {
  const descriptor = _getAutoLayoutSurfaceDescriptor(root, surfaceKey);
  if (!descriptor) return null;
  const columns = [];
  const rootVars = {};
  for (const zone of Array.isArray(descriptor.zones) ? descriptor.zones : []) {
    const zoneKey = String(zone?.key || "").trim();
    if (!zoneKey) continue;
    const label = String(zone?.label || zoneKey).trim() || zoneKey;
    const widthMm = _readAutoZoneWidthMm(root, surfaceKey, zoneKey);
    const insetMm = _readAutoZoneInsetMm(root, surfaceKey, zoneKey);
    const fontPt = _readAutoZoneFontPt(root, surfaceKey, zoneKey);
    columns.push({
      key: zoneKey,
      label,
      uiWidth: "1fr",
      pdfWidth: `${_formatMm(widthMm)}mm`,
      headerLines: [label],
      previewValue: "",
      previewField: zoneKey,
    });
    rootVars[`--bbm-auto-col-${zoneKey}-padding-inline`] = `${_formatMm(insetMm)}mm`;
    rootVars[`--bbm-auto-col-${zoneKey}-font-size`] = `${_formatMm(fontPt)}pt`;
  }
  return {
    variant: _normalizeOrientation(root?.dataset?.orientation || "portrait"),
    columns,
    pdf: {
      rootVars,
    },
  };
}

function _formatExportMm(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

function _formatExportPt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

function _buildTopLayoutExportPayload(root, runtimeData, toolbar) {
  const orientation = toolbar?._orientation || _normalizeOrientation(root?.dataset?.orientation || "portrait");
  const mode = normalizePrintMode(runtimeData?.mode || "protocol");
  const numberWidthMm = _readNumberWidthMm(root);
  const numberInsetMm = _readNumberInsetMm(root);
  const numberFontPt = _formatExportPt(_readNumberFontPt(root));
  const textInsetMm = _readTextInsetMm(root);
  const textFontPt = _readTextFontPt(root);
  const metaWidthMm = _readMetaWidthMm(root);
  const metaInsetMm = _readMetaInsetMm(root);
  const metaFontPt = _pxToPt(_readMetaFontPx(root));

  return {
    surfaceKey: "protokoll_tops",
    tableKey: "protokoll_tops",
    label: "TOP-Liste",
    medium: "pdf",
    mode,
    orientation,
    unit: { width: "mm", inset: "mm", font: "pt" },
    zones: [
      { key: "number", label: "TOP", width: _formatExportMm(numberWidthMm), inset: _formatExportMm(numberInsetMm), font: _formatExportPt(numberFontPt), unit: { width: "mm", inset: "mm", font: "pt" } },
      { key: "text", label: "Gegenstand", width: "rest", inset: _formatExportMm(textInsetMm), font: _formatExportPt(textFontPt), unit: { width: "rest", inset: "mm", font: "pt" } },
      { key: "meta", label: "Status", width: _formatExportMm(metaWidthMm), inset: _formatExportMm(metaInsetMm), font: _formatExportPt(metaFontPt), unit: { width: "mm", inset: "mm", font: "pt" } },
    ],
  };
}

function _buildParticipantsExportPayload(root, runtimeData, toolbar) {
  const orientation = toolbar?._orientation || _normalizeOrientation(root?.dataset?.orientation || "portrait");
  const mode = normalizePrintMode(runtimeData?.mode || "protocol");
  const zones = ["name", "role", "firm", "contact", "marks"].map((zone) => {
    const label =
      zone === "name"
        ? "Name"
        : zone === "role"
          ? "Funktion"
          : zone === "firm"
            ? "Firma"
            : zone === "contact"
              ? "Kontakt"
              : "Anwesend / Verteiler";
    return {
      key: zone,
      label,
      width: _formatExportMm(_readParticipantsZoneWidthMm(root, zone)),
      inset: _formatExportMm(_readParticipantsZoneInsetMm(root, zone)),
      font: _formatExportPt(_readParticipantsZoneFontPt(root, zone)),
      unit: { width: "mm", inset: "mm", font: "pt" },
    };
  });
  return {
    surfaceKey: "protokoll_participants",
    tableKey: "protokoll_participants",
    label: "Teilnehmerliste",
    medium: "pdf",
    mode,
    orientation,
    unit: { width: "mm", inset: "mm", font: "pt" },
    zones,
  };
}

function _buildAutoLayoutExportPayload(root, runtimeData, toolbar, surfaceKey, zoneKey = "") {
  const descriptor = _getAutoLayoutSurfaceDescriptor(root, surfaceKey);
  if (!descriptor) return null;
  const orientation = toolbar?._orientation || _normalizeOrientation(root?.dataset?.orientation || "portrait");
  const mode = normalizePrintMode(runtimeData?.mode || "preview");
  const zones = Array.isArray(descriptor.zones)
    ? descriptor.zones.map((zone) => {
        const key = String(zone?.key || "").trim();
        return {
          key,
          label: String(zone?.label || key || "Spalte").trim() || key,
          width: _formatExportMm(_readAutoZoneWidthMm(root, surfaceKey, key)),
          inset: _formatExportMm(_readAutoZoneInsetMm(root, surfaceKey, key)),
          font: _formatExportPt(_readAutoZoneFontPt(root, surfaceKey, key)),
          unit: { width: "mm", inset: "mm", font: "pt" },
        };
      })
    : [];
  return {
    surfaceKey,
    tableKey: surfaceKey,
    label: String(descriptor.surfaceLabel || "Tabelle").trim() || "Tabelle",
    medium: "pdf",
    mode,
    orientation,
    activeZone: String(zoneKey || "").trim() || undefined,
    unit: { width: "mm", inset: "mm", font: "pt" },
    zones,
  };
}

function _buildDevLayoutExportPayload(root, runtimeData, toolbar) {
  const autoSurfaceKey = String(root?.dataset?.devPdfAutoActiveSurfaceKey || "").trim();
  const autoZoneKey = String(root?.dataset?.devPdfAutoActiveZone || "").trim();
  if (autoSurfaceKey) {
    return _buildAutoLayoutExportPayload(root, runtimeData, toolbar, autoSurfaceKey, autoZoneKey);
  }
  const participantsZone = String(root?.dataset?.devPdfParticipantsActiveZone || "").trim().toLowerCase();
  if (participantsZone) {
    return _buildParticipantsExportPayload(root, runtimeData, toolbar);
  }
  const zone = manualZone;
  if (zone) {
    return _buildTopLayoutExportPayload(root, runtimeData, toolbar);
  }
  return null;
}

async function _showDevLayoutExport(toolbar, payload) {
  if (!payload) {
    if (toolbar?._status) toolbar._status.textContent = "Kein aktives Layout zum Exportieren.";
    return false;
  }
  const json = JSON.stringify(payload, null, 2);
  const snippet = `const layout = ${json};`;
  try {
    if (window?.navigator?.clipboard?.writeText) {
      await window.navigator.clipboard.writeText(snippet);
    }
  } catch (_e) {}
  try {
    if (typeof window?.prompt === "function") {
      window.prompt("DEV Layout Export", snippet);
    }
  } catch (_e) {}
  if (toolbar?._status) {
    toolbar._status.style.color = "#25624f";
    toolbar._status.textContent = "Export erstellt und in die Zwischenablage kopiert.";
  }
  return true;
}

function _setDevPdfLayoutMode(root, toolbar, enabled) {
  if (!root?.dataset) return;
  root.dataset.devPdfLayout = enabled ? "true" : "false";
  if (toolbar) {
    toolbar.hidden = !enabled;
    toolbar.style.display = enabled ? "" : "none";
  }
}

const DEFAULT_V2_PRE_REMARKS_TITLE = "Vorbemerkung:";
const DEFAULT_V2_PRE_REMARKS_TEXT =
  "folgende Punkte gelten als fest vereinbart, Diesen Text anpassen unter Einstellungen - Druckeinstellungen - Vorbemergung";

function _formatDateIso(value) {
  const s = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s || "";
  const [y, m, d] = s.split("-");
  return `${d}.${m}.${y}`;
}

function _normalizeOrientation(value) {
  return String(value || "").trim().toLowerCase() === "landscape" ? "landscape" : "portrait";
}

function _getTopLayout(data) {
  return data?.tableLayouts?.protokoll_tops?.effectiveLayout || PROTOKOLL_TOPS_LAYOUT;
}

function _applyPageOrientationStyle(orientation) {
  const normalized = _normalizeOrientation(orientation);
  let styleEl = document.getElementById("bbm-print-page-orientation");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "bbm-print-page-orientation";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `@page { size: A4 ${normalized}; margin: 0; }`;
  if (document.documentElement?.dataset) {
    document.documentElement.dataset.orientation = normalized;
  }
  if (document.body?.dataset) {
    document.body.dataset.orientation = normalized;
  }
  return normalized;
}

function _buildTopRowData(top, longtextOverride, ampelColor) {
  const rawNum =
    top.topNumberText ??
    top.top_nr ??
    top.displayNumber ??
    top.topNr ??
    top.topNo ??
    top.number ??
    top.nr ??
    "";
  const numText = String(rawNum ?? "").trim();
  const level = Number(top.level ?? top.top_level ?? top.topLevel ?? 1) || 1;
  const createdDate = level === 1
    ? ""
    : _formatDateIso(top.top_created_at ?? top.topCreatedAt ?? top.created_at ?? top.createdAt ?? "");
  const changedDate = _formatDateIso(
    top.updated_at ??
      top.updatedAt ??
      top.changed_at ??
      top.changedAt ??
      top.longtext_changed_at ??
      top.longtextChangedAt ??
      ""
  );
  const isNewTop =
    top.isNewTop ?? (Number(top.is_carried_over ?? top.isCarriedOver ?? 0) !== 1);

  // NEW: carried-over TOP whose longtext was edited later
  const isTouched = Number(top.is_touched ?? top.isTouched ?? 0) === 1;
  const isImportant = Number(top.is_important ?? top.isImportant ?? 0) === 1;

  const isHiddenTop =
    Number(top?.isHiddenTop ?? top?.is_hidden ?? top?.isHidden ?? 0) === 1 ||
    Number(top?.frozen_is_hidden ?? top?.frozenIsHidden ?? 0) === 1;
  const title = normalizeTopShortText(top.title) || "(ohne Bezeichnung)";
  const longtext =
    longtextOverride != null
      ? normalizeTopLongText(longtextOverride)
      : normalizeTopLongText(top.longtext);
  const status = String(top.status || "").trim();
  const due = _formatDateIso(top.due_date || top.dueDate || "");
  const resp = String(top.responsible_label || top.responsibleLabel || "").trim();

  return {
    kind: "top",
    level,
    numText,
    createdDate,
    changedDate,
    isNewTop,
    isTouched, // NEW
    isImportant,
    isHiddenTop,
    title,
    longtext,
    status,
    due,
    resp,
    ampelColor: level === 1 ? null : ampelColor,
  };
}

function _el(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

function _buildTopRowElement(row) {
  if (row.level === 1) {
    const tr = document.createElement("tr");
    tr.className = "topRow lvl1Row";
    if (row.isNewTop) tr.classList.add("isNewTop");

    const td = document.createElement("td");
    td.colSpan = 3;
    td.className = "lvl1Cell";

    const wrap = _el("div", "lvl1Wrap");
    const numBox = _el("div", "nrBox");
    numBox.append(_el("div", "topNumber", row.numText), _el("div", "nrDate", row.createdDate));
    if (row.isHiddenTop) numBox.appendChild(_el("div", "nrHint", "(ausgeblendet)"));
    // Hinweis "(Text geändert ...)" in v2 Druck nicht anzeigen
    // Stern im PDF weggelassen, Flag reicht

    wrap.append(numBox, _el("div", "lvl1Text", row.title));
    td.appendChild(wrap);
    tr.appendChild(td);
    return tr;
  }

  const tr = document.createElement("tr");
  tr.className = "topRow";
  if (row.isNewTop) tr.classList.add("isNewTop");

  const tdNr = _el("td", "colNr");
  const numBox = _el("div", "nrBox");
  numBox.append(_el("div", "topNumber", row.numText), _el("div", "nrDate", row.createdDate));
  if (row.isHiddenTop) numBox.appendChild(_el("div", "nrHint", "(ausgeblendet)"));
  // Hinweis "(Text geändert ...)" in v2 Druck nicht anzeigen
  // Stern im PDF weggelassen, Flag reicht
  tdNr.appendChild(numBox);

  const tdText = _el("td", "colText");
  const txtBlock = _el("div", "txtBlock");
  txtBlock.appendChild(_el("div", "shortText", row.title));

  // CHANGED: add marker class for touched carried-over TOPs
  if (row.longtext) {
    const lt = _el("div", "longText", row.longtext);
    if (!row.isNewTop && row.isTouched) lt.classList.add("isTouched");
    txtBlock.appendChild(lt);
  }

  tdText.appendChild(txtBlock);

  const tdMeta = _el("td", "colMeta");
  const meta3 = _el("div", "meta3");
  const metaLine1 = _el("div", "metaLine meta1");
  metaLine1.appendChild(_el("span", "metaText", row.status));
  if (row.ampelColor) metaLine1.appendChild(_el("span", `ampelDot ${row.ampelColor}`));
  meta3.appendChild(metaLine1);
  meta3.appendChild(_el("div", "metaLine meta2", row.due));
  meta3.appendChild(_el("div", "metaLine meta3", row.resp));
  tdMeta.appendChild(meta3);

  tr.append(tdNr, tdText, tdMeta);
  return tr;
}

function _buildGenericRowElement(row) {
  if (row?.kind === "todoGroup") {
    const tr = document.createElement("tr");
    tr.className = "firmGroupRow todoGroupRow";
    const td = _el("td", "firmGroupCell todoGroupCell", row.title || "");
    td.colSpan = 5;
    tr.appendChild(td);
    return tr;
  }

  if (row?.kind === "todoItem") {
    const tr = document.createElement("tr");
    tr.className = "todoItemRow";
    tr.append(
      _el("td", "", row.position || ""),
      _el("td", "", row.title || ""),
      _el("td", "", row.status || ""),
      _el("td", "", row.due || "")
    );
    const tdAmpel = _el("td", "todoAmpelCell");
    if (row.ampelColor) tdAmpel.appendChild(_el("span", `ampelDot ${row.ampelColor}`));
    tr.appendChild(tdAmpel);
    return tr;
  }

  if (row?.kind === "firmGroup") {
    const tr = document.createElement("tr");
    tr.className = "firmGroupRow";
    const td = _el("td", "firmGroupCell", row.title || "");
    td.colSpan = 1;
    tr.appendChild(td);
    return tr;
  }

  if (row?.kind === "firmCard") {
    const tr = document.createElement("tr");
    tr.className = "firmCardRow";
    const td = _el("td", "firmCardCell");
    td.colSpan = 1;

    const card = _el("div", "firmCard");
    const top = _el("div", "firmTop");
    const left = _el("div", "firmTopLeft");
    const right = _el("div", "firmTopRight");
    left.append(
      _el("div", "firmName", row?.firm?.name || ""),
      _el("div", "firmAddr", row?.firm?.street || ""),
      _el("div", "firmAddr", row?.firm?.zipCity || "")
    );
    right.append(
      _el("div", "firmContact", `Telefon: ${row?.firm?.phone || "-"}`),
      _el("div", "firmContact", `Handy: ${row?.firm?.mobile || "-"}`),
      _el("div", "firmContact", `E-Mail: ${row?.firm?.email || "-"}`)
    );
    top.append(left, right);

    const people = _el("div", "firmPeople");
    const head = _el("div", "firmPeopleHead");
    head.append(
      _el("div", "", "Vorname"),
      _el("div", "", "Nachname"),
      _el("div", "", "Funktion/Rolle"),
      (() => {
        const contactHead = _el("div", "firmPeopleContactHead");
        contactHead.append(
          _el("div", "firmPeopleContactHeadLine", "Telefon"),
          _el("div", "firmPeopleContactHeadLine", "E-Mail")
        );
        return contactHead;
      })()
    );
    people.appendChild(head);

    const list = Array.isArray(row?.firm?.persons) ? row.firm.persons : [];
    if (!list.length) {
      people.appendChild(_el("div", "firmPeopleEmpty", "Keine Mitarbeiter"));
    } else {
      const wrapByChars = (value, maxChars) => {
        const s = String(value || "");
        if (!maxChars || maxChars < 1 || s.length <= maxChars) return s;
        const out = [];
        for (let i = 0; i < s.length; i += maxChars) out.push(s.slice(i, i + maxChars));
        return out.join("\n");
      };
      for (const p of list) {
        const line = _el("div", "firmPeopleRow");
        const contact = _el("div", "firmPeopleContact");
        contact.append(
          _el("div", "firmPeopleContactLine", p?.phone || ""),
          _el("div", "firmPeopleContactLine", p?.email || "")
        );
        line.append(
          _el("div", "", wrapByChars(p?.first_name || "", 10)),
          _el("div", "", wrapByChars(p?.last_name || "", 12)),
          _el("div", "", p?.role_text || ""),
          contact
        );
        people.appendChild(line);
      }
    }

    card.append(top, people);
    td.appendChild(card);
    tr.appendChild(td);
    return tr;
  }

  const tr = document.createElement("tr");
  for (const cell of row.cells) {
    tr.appendChild(_el("td", "", cell));
  }
  return tr;
}

function _buildMeasureRoot() {
  const root = document.createElement("div");
  root.className = "measureRoot printRoot printV2Root";
  document.body.appendChild(root);
  return root;
}

function _applyV2VarsForMeasure(root, data) {
  const pagePadTopMm = Number(data?.v2Layout?.pagePadTopMm);
  const pagePadBottomMm = Number(data?.v2Layout?.pagePadBottomMm);
  const footerReserveMm = Number(data?.v2Layout?.footerReserveMm);
  const pagePadLeftMm = Number(data?.v2Layout?.pagePadLeftMm);
  const pagePadRightMm = Number(data?.v2Layout?.pagePadRightMm);
  const globalLogoBoxHeightMm = Number(data?.v2Layout?.globalLogoBoxHeightMm);
  const globalHeaderHeightMm = Number(data?.v2Layout?.globalHeaderHeightMm);
  root.style.setProperty(
    "--v2-pad-top",
    String(Number.isFinite(pagePadTopMm) ? pagePadTopMm : V2_LAYOUT.page.padTopMm) + "mm"
  );
  root.style.setProperty(
    "--v2-pad-bottom",
    String(Number.isFinite(pagePadBottomMm) ? pagePadBottomMm : V2_LAYOUT.page.padBottomMm) + "mm"
  );
  root.style.setProperty(
    "--v2-footer-reserve",
    String(Number.isFinite(footerReserveMm) ? footerReserveMm : 12) + "mm"
  );
  root.style.setProperty(
    "--v2-pad-left",
    String(Number.isFinite(pagePadLeftMm) ? pagePadLeftMm : V2_LAYOUT.page.padXmm) + "mm"
  );
  root.style.setProperty(
    "--v2-pad-right",
    String(Number.isFinite(pagePadRightMm) ? pagePadRightMm : V2_LAYOUT.page.padXmm) + "mm"
  );
  root.style.setProperty("--v2-pad-x", String(V2_LAYOUT.page.padXmm) + "mm");
  root.style.setProperty("--v2-global-logo-box", String(V2_LAYOUT.global.logoBoxMm) + "mm");
  root.style.setProperty(
    "--v2-global-logo-box-w",
    String(V2_LAYOUT.global.logoBoxWidthMm || V2_LAYOUT.global.logoBoxMm) + "mm"
  );
  root.style.setProperty(
    "--v2-global-logo-box-h",
    String(
      Number.isFinite(globalLogoBoxHeightMm)
        ? globalLogoBoxHeightMm
        : V2_LAYOUT.global.logoBoxHeightMm || V2_LAYOUT.global.logoBoxMm
    ) + "mm"
  );
  root.style.setProperty(
    "--v2-global-height",
    String(Number.isFinite(globalHeaderHeightMm) ? globalHeaderHeightMm : V2_LAYOUT.global.heightMm || 50) + "mm"
  );
  root.style.setProperty("--v2-logo-gap", String(V2_LAYOUT.global.logoGapMm) + "mm");
  root.style.setProperty("--v2-global-gap-logo-line", String(V2_LAYOUT.global.gapLogoToLineMm) + "mm");
  root.style.setProperty("--v2-full-height", String(V2_LAYOUT.full.heightMm) + "mm");
  root.style.setProperty("--v2-full-gap-line1-project", String(V2_LAYOUT.full.gapLine1ToProjectMm) + "mm");
  root.style.setProperty("--v2-full-gap-project-protocol", String(V2_LAYOUT.full.gapProjectToProtocolMm) + "mm");
  root.style.setProperty("--v2-full-project-font", String(V2_LAYOUT.full.projectFontPt) + "pt");
  root.style.setProperty("--v2-full-protocol-font", String(V2_LAYOUT.full.protocolFontPt) + "pt");
  root.style.setProperty("--v2-full-gap-project-line", String(V2_LAYOUT.full.gapProjectToLineMm) + "mm");
  root.style.setProperty("--v2-full-gap-line-body", String(V2_LAYOUT.full.gapLineToBodyMm) + "mm");
  root.style.setProperty("--v2-mini-protocol-font", String(V2_LAYOUT.mini.protocolFontPt) + "pt");
  root.style.setProperty("--v2-mini-gap-text-line", String(V2_LAYOUT.mini.gapTextToLineMm) + "mm");
  root.style.setProperty("--v2-mini-gap-line-body", String(V2_LAYOUT.mini.gapLineToBodyMm) + "mm");
  root.style.setProperty("--v2-line-thickness", String(V2_LAYOUT.global.lineThicknessPx) + "px");
}

function _mmToPx(mm) {
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.left = "-10000px";
  probe.style.top = "-10000px";
  probe.style.width = "100mm";
  probe.style.height = "1px";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const pxPerMm = probe.getBoundingClientRect().width / 100;
  probe.remove();
  const factor = Number.isFinite(pxPerMm) && pxPerMm > 0 ? pxPerMm : 3.78;
  return Math.max(0, Number(mm) || 0) * factor;
}

function _buildPageHeaderForMeasure(projectLabel, docLabel) {
  const header = _el("div", "pageHeader");
  header.appendChild(_el("div", "headerLeft", projectLabel));
  header.appendChild(_el("div", "headerRight", `Dokumenttyp: ${docLabel} | Seite 1 / 1`));
  return header;
}

function _buildTableHeadForMeasure(type, topsLayout) {
  if (type === "firmsCards") return null;
  const thead = document.createElement("thead");
  const tr = document.createElement("tr");
  if (type === "tops") {
    tr.innerHTML = `
      <th class="colNr">${topsLayout.labels.top}</th>
      <th class="colText">${topsLayout.labels.text}</th>
      <th class="colMeta">
        <div class="metaHead">
          <div>${topsLayout.labels.meta[0]}</div>
          <div>${topsLayout.labels.meta[1]}</div>
          <div>${topsLayout.labels.meta[2]}</div>
        </div>
      </th>
    `;
  } else if (type === "firms") {
    tr.innerHTML = `<th>Firma</th><th>Typ</th><th>Aktiv</th>`;
  } else if (type === "todo") {
    tr.innerHTML = `<th>TOP</th><th>Kurztext</th><th>Status</th><th>Fertig bis</th><th>Ampel</th>`;
  }
  thead.appendChild(tr);
  return thead;
}

function _buildColGroup(type, topsLayout) {
  if (type !== "tops") return null;
  const colgroup = document.createElement("colgroup");
  const { number, text, meta } = topsLayout.pdf.columns;
  colgroup.innerHTML = `
    <col class="${number.className}" style="width:${number.width};" />
    <col class="${text.className}" style="width:${text.width};" />
    <col class="${meta.className}" style="width:${meta.width};" />
  `;
  return colgroup;
}

function _buildTopsLegendElement() {
  const wrap = _el("div", "v2TopsLegend");
  wrap.append(
    _el("span", "v2TopsLegendBlue", "neuer TOP"),
    _el("span", "v2TopsLegendBlack", "im Soll / fertig"),
    _el("span", "v2TopsLegendRed", "im Verzug / wichtig")
  );
  return wrap;
}

function _collectProtocolFooterLines(settings) {
  const footerPlace = String(settings?.["pdf.footerPlace"] || "").trim();
  const footerDate = String(settings?.["pdf.footerDate"] || "").trim();
  const footerName1 = String(settings?.["pdf.footerName1"] || "").trim();
  const footerName2 = String(settings?.["pdf.footerName2"] || "").trim();
  const footerRecorder = String(settings?.["pdf.footerRecorder"] || "").trim();
  const footerStreet = String(settings?.["pdf.footerStreet"] || "").trim();
  const footerZip = String(settings?.["pdf.footerZip"] || "").trim();
  const footerCity = String(settings?.["pdf.footerCity"] || "").trim();
  const linePlaceDate = [footerPlace, footerDate].filter((v) => v).join(", ");
  const lineZipCity = [footerZip, footerCity].filter((v) => v).join(" ").trim();
  const lines = [linePlaceDate, footerName1, footerName2, footerRecorder, footerStreet, lineZipCity].filter((v) => v);
  if (lines.length) return lines;
  return ["Keine Angaben - Projekt > Bearbeiten > Einstellungen"];
}

function _buildProtocolFooterElement(data) {
  const mode = String(data?.mode || "").trim().toLowerCase();
  if (!["protocol", "preview", "vorabzug"].includes(mode)) return null;
  const lines = _collectProtocolFooterLines(data?.settings || {});
  if (!lines.length) return null;
  const wrap = _el("div", "v2ProtocolFooter");
  wrap.appendChild(_el("div", "v2ProtocolFooterTitle", "Aufgestellt:"));
  for (const line of lines) wrap.appendChild(_el("div", "v2ProtocolFooterLine", line));
  return wrap;
}

function _resolveInterludeText(data) {
  const settings = data?.settings || {};

  const nextMeeting = data?.nextMeeting || {};
  const enabledRaw = _parseBoolSetting(
    nextMeeting.enabled != null ? nextMeeting.enabled : settings["print.nextMeeting.enabled"],
    false
  );
  if (!enabledRaw) return "";
  const dateRaw = String(nextMeeting.date != null ? nextMeeting.date : settings["print.nextMeeting.date"] || "").trim();
  const timeRaw = String(nextMeeting.time != null ? nextMeeting.time : settings["print.nextMeeting.time"] || "").trim();
  const placeRaw = String(nextMeeting.place != null ? nextMeeting.place : settings["print.nextMeeting.place"] || "").trim();
  const extraRaw = String(nextMeeting.extra != null ? nextMeeting.extra : settings["print.nextMeeting.extra"] || "").trim();

  let weekday = "";
  let dateOut = dateRaw || "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    const d = new Date(`${dateRaw}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      weekday = d.toLocaleDateString("de-DE", { weekday: "long" });
      dateOut = d.toLocaleDateString("de-DE");
    }
  }
  const timeOut = timeRaw || "-";
  let text = "Die nächste Besprechung findet am ";
  if (weekday) text += `${weekday}, den ${dateOut} um ${timeOut} Uhr`;
  else text += `${dateOut} um ${timeOut} Uhr`;
  if (extraRaw) text += ` ${extraRaw}`;
  if (placeRaw) text += ` ${placeRaw}`;
  text += " statt.";
  return text.trim();
}

function _buildTopsTailElement(data) {
  const wrap = _el("div", "v2TopsTail");
  wrap.appendChild(_buildTopsLegendElement());
  const interlude = _resolveInterludeText(data);
  if (interlude) wrap.appendChild(_el("div", "v2TopsInterlude", interlude));
  const footer = _buildProtocolFooterElement(data);
  if (footer) wrap.appendChild(footer);
  return wrap;
}

function _measureTopsTailHeight(data) {
  const root = _buildMeasureRoot();
  const page = _el("div", "page");
  const tail = _buildTopsTailElement(data);
  page.appendChild(tail);
  root.appendChild(page);
  const h = Math.ceil(tail.getBoundingClientRect().height || 0);
  root.remove();
  return h;
}

function _buildParticipantsIntroData(data) {
  const mode = String(data?.mode || "").trim().toLowerCase();
  if (!["protocol", "preview", "vorabzug"].includes(mode)) return null;
  const src = Array.isArray(data?.participants) ? data.participants : [];
  const rows = src.map((p) => {
    const name = String(p?.name || "").trim();
    const role = String(p?.rolle || p?.role || "").trim();
    const firm = String(p?.firm || "").trim();
    const mobileOrFunk = String(p?.handy ?? p?.mobile ?? p?.funk ?? p?.mobil ?? p?.cell ?? "").trim();
    const phoneFallback = String(p?.telefon ?? p?.phone ?? "").trim();
    const phone = mobileOrFunk || phoneFallback;
    const email = String(p?.email || "").trim();
    const isPresent = Number(p?.isPresent ?? p?.is_present ?? 0) === 1;
    const isInDistribution = Number(p?.isInDistribution ?? p?.is_in_distribution ?? 0) === 1;
    return {
      name,
      role,
      firm,
      phone,
      email,
      presentMark: isPresent ? "x" : "-",
      distributionMark: isInDistribution ? "x" : "-",
    };
  });
  return { type: "participants", title: "Teilnehmer", rows };
}

function _buildParticipantsIntroElement(intro) {
  if (!intro || intro.type !== "participants") return null;
  const wrap = _el("section", "v2ParticipantsBlock");
  wrap.appendChild(_el("div", "v2ParticipantsTitle", intro.title || "Teilnehmer"));

  const table = document.createElement("table");
  table.className = "v2ParticipantsTable";

  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  trHead.innerHTML = `
    <th class="v2PartColName">Name</th>
    <th class="v2PartColRole">Funktion</th>
    <th class="v2PartColFirm">Firma</th>
    <th class="v2PartColContact">
      <div class="v2PartContactHead">
        <span>Telefon</span>
        <span>E-Mail</span>
      </div>
    </th>
    <th class="v2PartColMarks">
      <div class="v2PartMarksHead">
        <span>Anwesend</span>
        <span>Verteiler</span>
      </div>
    </th>
  `;
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const rows = Array.isArray(intro.rows) ? intro.rows : [];
  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = _el("td", "v2PartEmpty", "Keine Teilnehmer vorhanden.");
    td.colSpan = 5;
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      const contactTd = _el("td", "v2PartColContact");
      const contactStack = _el("div", "v2PartContactStack");
      contactStack.append(_el("div", "v2PartContactRow", row.phone || "-"), _el("div", "v2PartContactRow", row.email || "-"));
      contactTd.appendChild(contactStack);
      tr.append(_el("td", "v2PartColName", row.name || ""), _el("td", "v2PartColRole", row.role || ""), _el("td", "v2PartColFirm", row.firm || ""));
      tr.appendChild(contactTd);
      const marksTd = _el("td", "v2PartColMarks");
      const marks = _el("div", "v2PartMarks");
      marks.append(_el("div", "v2PartMarkRow", row.presentMark || "-"), _el("div", "v2PartMarkRow", row.distributionMark || "-"));
      marksTd.appendChild(marks);
      tr.appendChild(marksTd);
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

function _parseBoolSetting(v, fallback = false) {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return !!fallback;
  return ["1", "true", "yes", "ja", "on"].includes(s);
}

function _buildPreRemarksData(data) {
  const mode = String(data?.mode || "").trim().toLowerCase();
  if (!["protocol", "preview", "vorabzug"].includes(mode)) return null;
  const settings = data?.settings || {};
  const enabled = _parseBoolSetting(settings["print.preRemarks.enabled"], true);
  if (!enabled) return null;
  const text = String(settings["pdf.preRemarks"] || "").replace(/\r\n?/g, "\n").trim();
  if (!text) {
    return {
      type: "preRemarks",
      title: DEFAULT_V2_PRE_REMARKS_TITLE,
      text: DEFAULT_V2_PRE_REMARKS_TEXT,
    };
  }
  return { type: "preRemarks", title: DEFAULT_V2_PRE_REMARKS_TITLE, text };
}

function _buildPreRemarksElement(preRemarks) {
  if (!preRemarks || preRemarks.type !== "preRemarks") return null;
  const wrap = _el("section", "v2PreRemarksBlock");
  wrap.appendChild(_el("div", "v2PreRemarksTitle", preRemarks.title || DEFAULT_V2_PRE_REMARKS_TITLE));
  const body = _el("div", "v2PreRemarksText", preRemarks.text || "");
  wrap.appendChild(body);
  return wrap;
}

function _measurePreRemarksHeight(ctx, preRemarks) {
  if (!ctx || !preRemarks) return 0;
  const el = _buildPreRemarksElement(preRemarks);
  if (!el) return 0;
  ctx.root.querySelector(".page")?.appendChild(el);
  const rectH = el.getBoundingClientRect().height;
  const style = getComputedStyle(el);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  const h = Math.ceil(rectH + marginTop + marginBottom);
  el.remove();
  return Math.max(0, h);
}

function _measureIntroHeight(ctx, intro) {
  if (!ctx || !intro) return 0;
  const introEl = _buildParticipantsIntroElement(intro);
  if (!introEl) return 0;
  ctx.root.querySelector(".page")?.appendChild(introEl);
  const rectH = introEl.getBoundingClientRect().height;
  const style = getComputedStyle(introEl);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  const h = Math.ceil(rectH + marginTop + marginBottom);
  introEl.remove();
  return Math.max(0, h);
}

function _buildParticipantsIntroPlan({ intro, ctxFirst, ctxNext, firstCap, nextCap }) {
  if (!intro) return { chunks: [], heights: [] };
  const rows = Array.isArray(intro.rows) ? intro.rows : [];
  if (!rows.length) {
    const h = _measureIntroHeight(ctxFirst, intro);
    return { chunks: [intro], heights: [h] };
  }

  const chunks = [];
  const heights = [];
  let idx = 0;
  let pageNo = 0;

  while (idx < rows.length) {
    const cap = pageNo === 0 ? firstCap : nextCap;
    const ctx = pageNo === 0 ? ctxFirst : ctxNext || ctxFirst;
    const chunkRows = [];
    let lastGoodHeight = 0;
    while (idx < rows.length) {
      const candidateRows = chunkRows.concat(rows[idx]);
      const candidateIntro = { ...intro, rows: candidateRows };
      const candidateHeight = _measureIntroHeight(ctx, candidateIntro);
      if (candidateHeight <= cap) {
        chunkRows.push(rows[idx]);
        lastGoodHeight = candidateHeight;
        idx += 1;
        continue;
      }
      if (!chunkRows.length) {
        // Eine einzelne Zeile passt nie in den Intro-Block: trotzdem nicht verlieren.
        chunkRows.push(rows[idx]);
        lastGoodHeight = candidateHeight;
        idx += 1;
      }
      break;
    }
    const chunk = { ...intro, rows: chunkRows };
    chunks.push(chunk);
    heights.push(lastGoodHeight || _measureIntroHeight(ctx, chunk));
    pageNo += 1;
  }

  return { chunks, heights };
}

function _createMeasureContext({ type, projectLabel, docLabel, data, headerKind = "legacy" }) {
  const root = _buildMeasureRoot();
  _applyV2VarsForMeasure(root, data);
  const page = _el("div", "page");
  root.appendChild(page);
  const topsLayout = _getTopLayout(data);

  if (headerKind === "full") {
    const modeLabel = String(data?.printProfile?.documentLabel || "").trim() || docLabel || "Dokument";
    page.appendChild(renderV2GlobalHeader({ data }));
    page.appendChild(renderV2FullHeader({ data, pageNo: 1, totalPages: 2, modeLabel }));
    page.appendChild(_el("div", "v2FullGapLineBody"));
  } else if (headerKind === "mini") {
    const modeLabel = String(data?.printProfile?.documentLabel || "").trim() || docLabel || "Dokument";
    page.appendChild(renderV2MiniHeader({ data, pageNo: 2, totalPages: 2, modeLabel }));
  } else {
    page.appendChild(_buildPageHeaderForMeasure(projectLabel, docLabel));
    page.appendChild(_el("div", "pageHeaderLine"));
  }

  const table = document.createElement("table");
  table.className =
    type === "tops"
      ? "topsTable"
      : type === "firms"
      ? "firmsTable"
      : type === "firmsCards"
      ? "firmsCardsTable"
      : "todoTable";
  const colgroup = _buildColGroup(type, topsLayout);
  if (colgroup) table.appendChild(colgroup);
  const head = _buildTableHeadForMeasure(type, topsLayout);
  if (head) table.appendChild(head);

  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  page.appendChild(table);
  const pageRect = page.getBoundingClientRect();
  const style = getComputedStyle(page);
  const padTop = parseFloat(style.paddingTop) || 0;
  const padBottom = parseFloat(style.paddingBottom) || 0;
  const innerHeight = pageRect.height - padTop - padBottom;
  const tbodyRect = tbody.getBoundingClientRect();
  const contentTop = pageRect.top + padTop;
  const offset = tbodyRect.top - contentTop;
  const footerReserveMm = Number(data?.v2Layout?.footerReserveMm);
  const footerReservePx = _mmToPx(Number.isFinite(footerReserveMm) ? footerReserveMm : 12);
  const maxBodyHeight = Math.max(0, innerHeight - offset - footerReservePx);

  const measureRow = (rowEl) => {
    tbody.innerHTML = "";
    tbody.appendChild(rowEl);
    const rect = rowEl.getBoundingClientRect();
    let longLines = 0;
    let lineHeight = 0;
    const longEl = rowEl.querySelector(".longText");
    if (longEl) {
      lineHeight = parseFloat(getComputedStyle(longEl).lineHeight) || 14;
      const h = longEl.getBoundingClientRect().height;
      longLines = Math.max(1, Math.round(h / lineHeight));
    }
    return { height: rect.height, longLines, lineHeight };
  };

  return {
    root,
    maxBodyHeight,
    measureRow,
    cleanup: () => root.remove(),
  };
}

function _trimToWordBoundary(text) {
  const idx = text.lastIndexOf(" ");
  if (idx > 0) return text.slice(0, idx);
  return text;
}

function _findSplitText(ctx, rowData, maxLines) {
  const text = rowData.longtext || "";
  if (!text) return "";
  let low = 0;
  let high = text.length;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    let cut = text.slice(0, mid);
    cut = _trimToWordBoundary(cut) || cut;
    const lines = ctx.measureRow(_buildTopRowElement({ ...rowData, longtext: cut })).longLines;
    if (lines <= maxLines) {
      best = cut.length;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (best <= 0) return "";
  return text.slice(0, best).trimEnd();
}

function _paginateTops(data) {
  const projectLabel = _projectLabel(data.project);
  const docLabel = _docLabel(data.mode);
  const ctxFirst = _createMeasureContext({ type: "tops", projectLabel, docLabel, data, headerKind: "full" });
  const ctxNext = _createMeasureContext({ type: "tops", projectLabel, docLabel, data, headerKind: "mini" });
  const rowMeasureCtx = ctxNext || ctxFirst;
  const intro = _buildParticipantsIntroData(data);
  const firstCap = ctxFirst.maxBodyHeight;
  const nextCap = ctxNext?.maxBodyHeight || ctxFirst.maxBodyHeight;
  const introPlan = _buildParticipantsIntroPlan({
    intro,
    ctxFirst,
    ctxNext,
    firstCap,
    nextCap,
  });
  const preRemarks = _buildPreRemarksData(data);
  const preRemarksHeight = _measurePreRemarksHeight(ctxNext || ctxFirst, preRemarks);
  let preRemarksPending = !!preRemarks;
  const introChunks = introPlan.chunks;
  const introHeights = introPlan.heights;
  let pageIndex = 0;
  let firstPageBodyHeight = Math.max(0, firstCap - (introHeights[0] || 0));

  const tops = Array.isArray(data.tops) ? data.tops : [];
  const ampelMap = computeAmpelMapForTops({
    tops,
    mode: data.mode,
    meeting: data.meeting,
    settings: data.settings,
    now: new Date(),
  });
  const getAmpelColor = (top) => {
    const topId = top?.id ?? top?.top_id ?? top?.topId ?? null;
    const entry = topId != null ? ampelMap.get(String(topId)) : null;
    if (entry?.show && entry?.color) return entry.color;
    const fallback =
      top?.frozen_ampel_color ??
      top?.frozenAmpelColor ??
      top?.ampel_color ??
      top?.ampelColor ??
      null;
    return fallback ? String(fallback).trim() : null;
  };

  const items = tops.map((t) => {
    const ampelColor = getAmpelColor(t);
    const fullRow = _buildTopRowData(t, null, ampelColor);
    const baseRow = t.longtext ? _buildTopRowData(t, "", ampelColor) : fullRow;
    const fullMeasure = rowMeasureCtx.measureRow(_buildTopRowElement(fullRow));
    const baseMeasure = rowMeasureCtx.measureRow(_buildTopRowElement(baseRow));
    const lineHeight = fullMeasure.lineHeight || baseMeasure.lineHeight || 14;
    return {
      top: t,
      ampelColor,
      fullRow,
      baseRow,
      fullHeight: fullMeasure.height,
      baseHeight: baseMeasure.height,
      longLines: fullMeasure.longLines || 0,
      lineHeight,
    };
  });

  const pages = [];
  let currentPage = {
    header: { projectLabel, docLabel },
    intro: introChunks[0] || null,
    preRemarks: null,
    table: { type: "tops", rows: [] },
  };
  let remaining = firstPageBodyHeight;

  const pushPage = () => {
    pages.push(currentPage);
    pageIndex += 1;
    const cap = pageIndex === 0 ? firstCap : nextCap;
    const introForPage = introChunks[pageIndex] || null;
    const introHeight = introForPage ? introHeights[pageIndex] || 0 : 0;
    currentPage = {
      header: { projectLabel, docLabel },
      intro: introForPage,
      preRemarks: null,
      table: { type: "tops", rows: [] },
    };
    remaining = Math.max(0, cap - introHeight);
  };

  const addRow = (rowData, rowHeight) => {
    currentPage.table.rows.push(rowData);
    remaining -= rowHeight;
  };

  const ensurePreRemarksPlaced = () => {
    if (!preRemarksPending) return;
    while (preRemarksPending) {
      if (currentPage.table.rows.length) return;
      const pageCap = pageIndex === 0 ? firstCap : nextCap;
      if (preRemarksHeight > pageCap) {
        currentPage.preRemarks = preRemarks;
        remaining = Math.max(0, remaining - preRemarksHeight);
        preRemarksPending = false;
        return;
      }
      if (remaining >= preRemarksHeight) {
        currentPage.preRemarks = preRemarks;
        remaining -= preRemarksHeight;
        preRemarksPending = false;
        return;
      }
      pushPage();
    }
  };

  const MIN_LINES_PAGE_END = 3;
  const MIN_LINES_NEXT_PAGE = 3;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const level = item.fullRow.level;
    ensurePreRemarksPlaced();

    if (item.fullHeight <= remaining) {
      addRow(item.fullRow, item.fullHeight);
      continue;
    }

    if (level === 1) {
      if (currentPage.table.rows.length) pushPage();
      addRow(item.fullRow, item.fullHeight);
      continue;
    }

    const minSplitHeight = item.baseHeight + MIN_LINES_PAGE_END * item.lineHeight;
    if (remaining < minSplitHeight) {
      if (currentPage.table.rows.length) pushPage();
    }

    let text = item.fullRow.longtext;
    while (text) {
      const rowData = _buildTopRowData(item.top, text, item.ampelColor);
      const measure = rowMeasureCtx.measureRow(_buildTopRowElement(rowData));
      const rowHeight = measure.height;

      if (rowHeight <= remaining) {
        addRow(rowData, rowHeight);
        break;
      }

      const minHeight = item.baseHeight + MIN_LINES_PAGE_END * item.lineHeight;
      if (remaining < minHeight) {
        if (!currentPage.table.rows.length) {
          addRow(rowData, rowHeight);
          break;
        }
        pushPage();
        continue;
      }

      const allowedLines = Math.max(MIN_LINES_PAGE_END, Math.floor((remaining - item.baseHeight) / item.lineHeight));
      const part1 = _findSplitText(rowMeasureCtx, rowData, allowedLines);
      if (!part1) {
        if (currentPage.table.rows.length) pushPage();
        continue;
      }

      const part1Data = _buildTopRowData(item.top, part1, item.ampelColor);
      const part1Measure = rowMeasureCtx.measureRow(_buildTopRowElement(part1Data));
      const part2Text = text.slice(part1.length).trimStart();
      const part2Data = _buildTopRowData(item.top, part2Text, item.ampelColor);
      const part2Measure = rowMeasureCtx.measureRow(_buildTopRowElement(part2Data));
      if (part1Measure.longLines < MIN_LINES_PAGE_END || part2Measure.longLines < MIN_LINES_NEXT_PAGE) {
        if (!currentPage.table.rows.length) {
          addRow(rowData, rowHeight);
          break;
        }
        pushPage();
        continue;
      }
      const part1Height = part1Measure.height;
      addRow(part1Data, part1Height);
      pushPage();
      text = part2Text;
    }
  }

  ensurePreRemarksPlaced();

  if (currentPage.table.rows.length || currentPage.intro || currentPage.preRemarks) pages.push(currentPage);
  if (!pages.length) {
    pages.push({
      header: { projectLabel, docLabel },
      intro: introChunks[0] || null,
      preRemarks: preRemarksPending ? preRemarks : null,
      table: { type: "tops", rows: [] },
    });
  }

  const tailHeight = _measureTopsTailHeight(data);
  const pageCapAt = (idx) => (idx === 0 ? firstCap : nextCap);
  const introHeightAt = (idx, page) => {
    if (!page?.intro) return 0;
    const cached = introHeights[idx];
    if (Number.isFinite(cached) && cached > 0) return cached;
    const measureCtx = idx === 0 ? ctxFirst : ctxNext || ctxFirst;
    return _measureIntroHeight(measureCtx, page.intro);
  };
  const rowsHeightAt = (page) => {
    const rows = page?.table?.rows || [];
    if (!rows.length) return 0;
    return rows.reduce((sum, row) => {
      const h = rowMeasureCtx.measureRow(_buildTopRowElement(row)).height;
      return sum + h;
    }, 0);
  };
  const findLastTopsIdx = () => {
    for (let i = pages.length - 1; i >= 0; i -= 1) {
      if (String(pages[i]?.table?.type || "") === "tops") return i;
    }
    return -1;
  };
  const makeEmptyTopsPage = () => ({
    header: { projectLabel, docLabel },
    intro: null,
    preRemarks: null,
    table: { type: "tops", rows: [] },
  });

  let lastTopsIdx = findLastTopsIdx();
  while (lastTopsIdx >= 0) {
    const page = pages[lastTopsIdx];
    const cap = pageCapAt(lastTopsIdx);
    const introH = introHeightAt(lastTopsIdx, page);
    const preRemarksH = page?.preRemarks ? preRemarksHeight : 0;
    const usedWithTail = rowsHeightAt(page) + tailHeight;
    const allowed = Math.max(0, cap - introH - preRemarksH);
    if (usedWithTail <= allowed) break;

    if ((page?.table?.rows || []).length === 0) {
      pages.splice(lastTopsIdx + 1, 0, makeEmptyTopsPage());
      break;
    }

    const movedRow = page.table.rows.pop();
    const insertIdx = lastTopsIdx + 1;
    let nextPage = pages[insertIdx];
    if (String(nextPage?.table?.type || "") !== "tops") {
      nextPage = makeEmptyTopsPage();
      pages.splice(insertIdx, 0, nextPage);
    }
    nextPage.table.rows.unshift(movedRow);
    lastTopsIdx = findLastTopsIdx();
  }

  const total = pages.length || 1;
  const interludeText = _resolveInterludeText(data);
  for (let i = pages.length - 1; i >= 0; i -= 1) {
    const p = pages[i];
    if (String(p?.table?.type || "") !== "tops") continue;
    p.topsTail = {
      showLegend: true,
      interludeText,
    };
    break;
  }
  pages.forEach((p, idx) => {
    p.header.pageNo = idx + 1;
    p.header.totalPages = total;
  });

  ctxFirst.cleanup();
  if (ctxNext) ctxNext.cleanup();
  console.log(`[PAGINATION] pages=${pages.length} firstPageRows=${pages[0]?.table?.rows?.length || 0}`);
  return pages;
}

function _paginateGeneric({ rows, type, projectLabel, docLabel, data }) {
  const useV2HeaderPaging = type === "firmsCards" || type === "todo";
  const ctx = useV2HeaderPaging
    ? _createMeasureContext({ type, projectLabel, docLabel, data, headerKind: "full" })
    : _createMeasureContext({ type, projectLabel, docLabel });
  const ctxNext = useV2HeaderPaging
    ? _createMeasureContext({ type, projectLabel, docLabel, data, headerKind: "mini" })
    : null;
  const pages = [];
  let currentPage = { header: { projectLabel, docLabel }, table: { type, rows: [] } };
  let remaining = ctx.maxBodyHeight;
  const heightCache = new Map();
  let pageNo = 1;

  const pushPage = () => {
    pages.push(currentPage);
    currentPage = { header: { projectLabel, docLabel }, table: { type, rows: [] } };
    pageNo += 1;
    remaining = pageNo === 1 ? ctx.maxBodyHeight : ctxNext?.maxBodyHeight || ctx.maxBodyHeight;
  };

  const rowHeightAt = (idx) => {
    if (heightCache.has(idx)) return heightCache.get(idx);
    const rowEl = _buildGenericRowElement(rows[idx]);
    const h = (ctxNext || ctx).measureRow(rowEl).height;
    heightCache.set(idx, h);
    return h;
  };

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const h = rowHeightAt(i);

    // Kategorie-Zeile nie alleine: zusammen mit erster Firmenkachel auf die nächste Seite schieben.
    if (type === "firmsCards" && row?.kind === "firmGroup") {
      const next = rows[i + 1] || null;
      const nextH = next ? rowHeightAt(i + 1) : 0;
      const minBlockHeight = h + (next?.kind === "firmCard" ? nextH : 0);
      if (minBlockHeight > remaining && currentPage.table.rows.length) {
        pushPage();
      }
    }
    // Verantwortlich-Gruppenkopf in ToDo nie alleine am Seitenende.
    if (type === "todo" && row?.kind === "todoGroup") {
      const next = rows[i + 1] || null;
      const nextH = next ? rowHeightAt(i + 1) : 0;
      const minBlockHeight = h + (next ? nextH : 0);
      if (minBlockHeight > remaining && currentPage.table.rows.length) {
        pushPage();
      }
    }

    if (h > remaining && currentPage.table.rows.length) {
      pushPage();
    }
    currentPage.table.rows.push(row);
    remaining -= h;
  }

  if (currentPage.table.rows.length) pages.push(currentPage);
  if (!pages.length) {
    pages.push({ header: { projectLabel, docLabel }, table: { type, rows: [] } });
  }

  const total = pages.length || 1;
  pages.forEach((p, idx) => {
    p.header.pageNo = idx + 1;
    p.header.totalPages = total;
  });

  ctx.cleanup();
  if (ctxNext) ctxNext.cleanup();
  console.log(`[PAGINATION] pages=${pages.length} firstPageRows=${pages[0]?.table?.rows?.length || 0}`);
  return pages;
}

function _buildPages(data) {
  const mode = normalizePrintMode(data.mode || "protocol");
  if (!mode) {
    throw new Error(`Unbekannter Druckmodus: ${String(data?.mode || "").trim() || "-"}`);
  }
  const projectLabel = _projectLabel(data.project);
  const docLabel = _docLabel(mode);

  if (mode === "firms") {
    const rows = [];
    let currentGroup = "";
    for (const f of data.firms || []) {
      const group = String(f?.categoryLabel || "Sonstige").trim() || "Sonstige";
      if (group !== currentGroup) {
        currentGroup = group;
        rows.push({ kind: "firmGroup", title: currentGroup });
      }
      rows.push({
        kind: "firmCard",
        firm: {
          name: String(f?.label || f?.short || f?.name || "").trim(),
          street: String(f?.street || "").trim(),
          zipCity: [String(f?.zip || "").trim(), String(f?.city || "").trim()].filter(Boolean).join(" "),
          phone: String(f?.phone || "").trim(),
          mobile: "",
          email: String(f?.email || "").trim(),
          persons: Array.isArray(f?.persons) ? f.persons : [],
        },
      });
    }
    return _paginateGeneric({ rows, type: "firmsCards", projectLabel, docLabel, data });
  }

  if (mode === "todo") {
    const rows = [];
    let currentGroup = "";
    for (const r of data.todoRows || []) {
      const group = String(r?.responsible_group || "").trim() || "Ohne Verantwortlich";
      if (group !== currentGroup) {
        currentGroup = group;
        rows.push({ kind: "todoGroup", title: currentGroup });
      }
      rows.push({
        kind: "todoItem",
        position: r.position || "",
        title: r.title || "",
        status: r.status || "",
        due: _formatDateIso(r.due_date),
        ampelColor: computeAmpelColorForTop({ top: { status: r.status || "", due_date: r.due_date || "" } }),
      });
    }
    return _paginateGeneric({ rows, type: "todo", projectLabel, docLabel, data });
  }
  if (mode === "restarbeiten") {
    const rows = [];
    for (const r of data.restarbeitenItems || []) {
      const showAmpelInList = data?.showAmpelInList !== false;
      rows.push({
        kind: "restarbeitItem",
        ampelState: getRestarbeitenAmpelState({
          status: r.status || "",
          due_date: r.due_date || "",
        }),
        showAmpelInList,
        cells: [
          r.running_number || "",
          String(r.item_class || "").toLowerCase() === "mangel" ? "M" : "R",
          r.short_text || "",
          r.long_text || "",
          r.location_level_1 || "",
          r.location_level_2 || "",
          r.location_level_3 || "",
          r.location_level_4 || "",
          r.status || "",
          _formatDateIso(r.due_date),
          r.responsible_label || "",
          _formatDateIso(r.completed_at),
          r.completion_note || "",
        ],
      });
    }
    return _paginateGeneric({ rows, type: "restarbeiten", projectLabel, docLabel, data });
  }

  return _paginateTops(data);
}

async function handleInit(payload) {
  try {
    const res = await window.bbmPrint.getData(payload);
    if (!res?.ok) {
      setError(res?.error || "Daten konnten nicht geladen werden.");
      window.bbmPrint.ready({ jobId: payload?.jobId || null, ok: false });
      return;
    }

    const data = res.data || {};
    const topsLayout = _getTopLayout(data);
    // Version/Channel für PDF-Fußnote bereitstellen (falls nicht im Payload enthalten)
    if (!data.appVersion && window.bbmDb?.appGetVersion) {
      try {
        const vRes = await window.bbmDb.appGetVersion();
        if (vRes?.ok) data.appVersion = vRes.version || "";
      } catch (_e) {}
    }
    if (!data.buildChannel && window.bbmDb?.appGetBuildChannel) {
      try {
        const chRes = await window.bbmDb.appGetBuildChannel();
        if (chRes?.ok) data.buildChannel = chRes.channel || "";
      } catch (_e) {}
    }
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (_e) {}
    }

    const normalizedMode = normalizePrintMode(data.mode || "protocol");
    if (!normalizedMode) {
      setError(`Unbekannter Druckmodus: ${String(data?.mode || "").trim() || "-"}`);
      window.bbmPrint.ready({ jobId: payload?.jobId || null, ok: false });
      return;
    }
    data.mode = normalizedMode;

    const orientation = _applyPageOrientationStyle(data.orientation);

    if (data.mode === "headerTest") {
      const root = renderHeaderTestPages({ data, debug: !!payload?.debug });
      if (root?.dataset) root.dataset.orientation = orientation;
      app.innerHTML = "";
      app.appendChild(root);
      window.bbmPrint.ready({ jobId: payload?.jobId || null, ok: true });
      return;
    }

    const pages = _buildPages(data);
    const root = renderPrint({ pages, data });
    root._bbmRuntimeData = data;
    if (root?.dataset) root.dataset.tableLayout = topsLayout.tableKey || "protokoll_tops";
    if (root?.dataset) root.dataset.orientation = orientation;
    const isDevLayoutPreview = !!payload?.devLayoutPreview && isDevLayoutBuildChannel(data.buildChannel);
    const layoutCalibrationEnabled = isDevLayoutPreview
      ? _resolveLayoutCalibrationEnabled(payload, await loadLayoutCalibrationEnabled(window.bbmPrint || {}, false))
      : false;
    if (isDevLayoutPreview && root?.dataset) {
      root.dataset.devPdfLayout = layoutCalibrationEnabled ? "true" : "false";
      root.dataset.devPdfActiveZone = "";
    }
    app.innerHTML = "";
    app.appendChild(root);

    // Ensure stored ToDo table layout is applied to the print root (PDF + preview),
    // so width/inset/font settings take effect for the real output.
    if (typeof window?.bbmPrint?.tableLayoutsGetOne === "function") {
      try {
        const resTodo = await window.bbmPrint.tableLayoutsGetOne({
          tableKey: "print.todo.todoTable",
          moduleId: "protokoll",
          orientation,
        });
        const todoLayout = resTodo?.ok ? resTodo?.data?.effectiveLayout || resTodo?.data?.defaultLayout || null : null;
        if (todoLayout) _applyTodoVarsFromLayout(root, todoLayout);
      } catch (_e) {}
    }

    if (isDevLayoutPreview) {
      // DEV-only: ensure the participants layout is loaded and applied so save/load works
      // even when the print payload did not include tableLayouts for this table yet.
      if (typeof window?.bbmPrint?.tableLayoutsGetOne === "function") {
        try {
          const resPart = await window.bbmPrint.tableLayoutsGetOne({
            tableKey: "protokoll_participants",
            moduleId: "protokoll",
            orientation,
          });
          const layout = resPart?.ok ? resPart?.data?.effectiveLayout || resPart?.data?.defaultLayout || null : null;
          if (layout) _applyParticipantsNameVarsFromLayout(root, layout);
        } catch (_e) {}
      }
      await _enableDevPdfLayoutZones(root, data, layoutCalibrationEnabled);
    }

    if (isDevLayoutPreview && typeof window?.bbmPrint?.appSettingsOnChanged === "function") {
      const onSettingsChanged = async (payloadChanged = {}) => {
        const changed = payloadChanged?.keys || [];
        if (Array.isArray(changed) && changed.length && !changed.includes(LAYOUT_CALIBRATION_SETTING_KEY)) return;
        const enabled = await loadLayoutCalibrationEnabled(window.bbmPrint || {}, false);
        _setDevPdfLayoutMode(root, null, enabled);
        _syncDevPdfLayoutToolbar(document.querySelector(".bbm-dev-pdf-layout-toolbar"), root, data);
      };
      const unsubscribe = window.bbmPrint.appSettingsOnChanged(onSettingsChanged);
      window.addEventListener(APP_SETTINGS_CHANGED_EVENT, onSettingsChanged);
      window.addEventListener("beforeunload", () => {
        try {
          unsubscribe?.();
        } catch (_e) {}
        try {
          window.removeEventListener(APP_SETTINGS_CHANGED_EVENT, onSettingsChanged);
        } catch (_e) {}
      });
    }

    window.bbmPrint.ready({ jobId: payload?.jobId || null, ok: true });
  } catch (err) {
    setError(err?.message || "Daten konnten nicht geladen werden.");
    window.bbmPrint.ready({ jobId: payload?.jobId || null, ok: false });
  }
}

async function _enableDevPdfLayoutZones(root, runtimeData = null, layoutCalibrationEnabled = false) {
  if (!root) return;
  const zones = new Set(["number", "text", "meta"]);
  const participantsZones = new Set(["name", "role", "firm", "contact", "marks"]);
  const toolbar = _ensureDevPdfLayoutToolbar();
  _setDevPdfLayoutMode(root, toolbar, !!layoutCalibrationEnabled);

  _decorateAutoLayoutTables(root, runtimeData);
  _captureAutoLayoutDefaults(root);
  await _loadStoredAutoLayouts(root, runtimeData);

  const decorateParticipantsZones = () => {
    const map = [
      { key: "name", selector: ".v2PartColName" },
      { key: "role", selector: ".v2PartColRole" },
      { key: "firm", selector: ".v2PartColFirm" },
      { key: "contact", selector: ".v2PartColContact" },
      { key: "marks", selector: ".v2PartColMarks" },
    ];
    for (const item of map) {
      root.querySelectorAll(item.selector).forEach((node) => {
        if (!node?.dataset) return;
        node.dataset.devPdfParticipantsZone = item.key;
      });
    }
  };

  const syncParticipantsActiveZone = () => {
    const active = String(root?.dataset?.devPdfParticipantsActiveZone || "").trim().toLowerCase();
    root
      .querySelectorAll("[data-dev-pdf-participants-zone]")
      .forEach((node) => (node.dataset.devPdfParticipantsZoneActive = "false"));
    if (!participantsZones.has(active)) return;
    root
      .querySelectorAll(`[data-dev-pdf-participants-zone="${active}"]`)
      .forEach((node) => (node.dataset.devPdfParticipantsZoneActive = "true"));
  };

  const clearManualSelection = () => {
    delete root.dataset.devPdfActiveZone;
    delete root.dataset.devPdfParticipantsActiveZone;
  };

  const onClick = (event) => {
    if (String(root?.dataset?.devPdfLayout || "true").trim() !== "true") return;
    const target = event?.target;
    if (!target || !target.closest) return;

    const participantHit = target.closest("[data-dev-pdf-participants-zone]");
    if (participantHit) {
      const zone = String(participantHit.dataset.devPdfParticipantsZone || "").trim().toLowerCase();
      if (!participantsZones.has(zone)) return;
      clearManualSelection();
      _clearDevPdfAutoSelection(root);
      root.dataset.devPdfParticipantsActiveZone = zone;
      syncParticipantsActiveZone();
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData || root._bbmRuntimeData || null);
      return;
    }

    const autoHit = target.closest("[data-dev-pdf-auto-zone]");
    if (autoHit) {
      const table = autoHit.closest("[data-dev-pdf-auto-surface]");
      const surfaceKey = String(table?.dataset?.devPdfAutoSurfaceKey || "").trim();
      const zoneKey = String(autoHit.dataset.devPdfAutoZoneKey || "").trim();
      if (!surfaceKey || !zoneKey) return;
      clearManualSelection();
      root.dataset.devPdfAutoActiveSurfaceKey = surfaceKey;
      root.dataset.devPdfAutoActiveZone = zoneKey;
      _syncDevPdfAutoSelection(root);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData || root._bbmRuntimeData || null);
      return;
    }

    const hit = target.closest("[data-dev-pdf-zone]");
    if (!hit) return;
    const zone = String(hit.dataset.devPdfZone || "").trim().toLowerCase();
    if (!zones.has(zone)) return;
    clearManualSelection();
    _clearDevPdfAutoSelection(root);
    root.dataset.devPdfActiveZone = zone;
    _syncDevPdfLayoutToolbar(toolbar, root, runtimeData || root._bbmRuntimeData || null);
  };

  root.addEventListener("click", onClick);
  decorateParticipantsZones();
  syncParticipantsActiveZone();
  _syncDevPdfAutoSelection(root);
  _syncDevPdfLayoutToolbar(toolbar, root, runtimeData || root._bbmRuntimeData || null);
  try {
    toolbar._orientation = String(root?.dataset?.orientation || "portrait").trim().toLowerCase() === "landscape"
      ? "landscape"
      : "portrait";
  } catch (_e) {}
}

function _ensureDevPdfLayoutToolbar() {
  let el = document.querySelector(".bbm-dev-pdf-layout-toolbar");
  if (el) return el;

  el = document.createElement("div");
  el.className = "bbm-dev-pdf-layout-toolbar";

  const line1 = document.createElement("div");
  line1.className = "bbm-dev-pdf-layout-toolbar-line1";
  line1.textContent = "TOP-Liste > PDF";

  const line2 = document.createElement("div");
  line2.className = "bbm-dev-pdf-layout-toolbar-line2";
  line2.textContent = "Bereich waehlen";

  const controls = document.createElement("div");
  controls.className = "bbm-dev-pdf-layout-toolbar-controls";

  const insetMinus = document.createElement("button");
  insetMinus.type = "button";
  insetMinus.textContent = "-";
  insetMinus.title = "Innen verringern";

  const insetValue = document.createElement("div");
  insetValue.className = "bbm-dev-pdf-layout-toolbar-value";
  insetValue.textContent = "Innen -";

  const insetPlus = document.createElement("button");
  insetPlus.type = "button";
  insetPlus.textContent = "+";
  insetPlus.title = "Innen erhoehen";

  const fontMinus = document.createElement("button");
  fontMinus.type = "button";
  fontMinus.textContent = "-";
  fontMinus.title = "Schrift verkleinern";

  const fontValue = document.createElement("div");
  fontValue.className = "bbm-dev-pdf-layout-toolbar-value";
  fontValue.textContent = "Schrift -";

  const fontPlus = document.createElement("button");
  fontPlus.type = "button";
  fontPlus.textContent = "+";
  fontPlus.title = "Schrift vergroessern";

  const minus = document.createElement("button");
  minus.type = "button";
  minus.textContent = "-";
  minus.title = "Breite verringern";

  const value = document.createElement("div");
  value.className = "bbm-dev-pdf-layout-toolbar-value";
  value.textContent = "Breite -";

  const plus = document.createElement("button");
  plus.type = "button";
  plus.textContent = "+";
  plus.title = "Breite erhoehen";

  controls.append(insetMinus, insetValue, insetPlus, minus, value, plus, fontMinus, fontValue, fontPlus);

  const actions = document.createElement("div");
  actions.className = "bbm-dev-pdf-layout-toolbar-controls";

  const save = document.createElement("button");
  save.type = "button";
  save.textContent = "Speichern";
  save.title = "Speichert nur die PDF-Meta-Breite (DEV)";

  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "Reset";
  reset.title = "Setzt nur die PDF-Meta-Breite zurueck (DEV)";

  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.textContent = "Export";
  exportBtn.title = "Kopiert den aktuellen DEV-Layout-Snapshot als JSON";

  actions.append(save, reset, exportBtn);

  const status = document.createElement("div");
  status.className = "bbm-dev-pdf-layout-toolbar-line2";
  status.style.color = "#9d1c1c";
  status.style.minHeight = "1.2em";
  status.textContent = "";

  el.append(line1, line2, controls, actions, status);
  document.body.appendChild(el);

  el._line1 = line1;
  el._line2 = line2;
  el._value = value;
  el._insetValue = insetValue;
  el._minus = minus;
  el._plus = plus;
  el._insetMinus = insetMinus;
  el._insetPlus = insetPlus;
  el._fontMinus = fontMinus;
  el._fontPlus = fontPlus;
  el._fontValue = fontValue;
  el._save = save;
  el._reset = reset;
  el._export = exportBtn;
  el._status = status;
  el._metaWidthMm = null;
  el._metaInsetMm = null;
  el._metaFontPx = null;
  el._nrWidthMm = null;
  el._nrInsetMm = null;
  el._nrFontPt = null;
  el._txtInsetMm = null;
  el._txtFontPt = null;
  el._partNameWidthMm = null;
  el._partNameInsetMm = null;
  el._partNameFontPt = null;
  el._defaultTxtPadLeftRaw = null;
  el._defaultTxtPadRightRaw = null;
  el._defaultTxtFontRaw = null;
  el._defaultNrWidthRaw = null;
  el._defaultNrInsetRaw = null;
  el._defaultNrFontRaw = null;
  el._orientation = "portrait";
  el._defaultMetaWidthRaw = null;
  el._defaultMetaInsetRaw = null;
  el._defaultMetaFontSizeRaw = null;

  return el;
}

function _pxPerMm() {
  const measure = document.getElementById("mm-measure");
  if (!measure?.getBoundingClientRect) return 3.78;
  const rect = measure.getBoundingClientRect();
  const px = Number(rect?.height || 0);
  if (!Number.isFinite(px) || px <= 0) return 3.78;
  return px / 100;
}

function _readMetaWidthMm(root) {
  const table = root?.querySelector?.("table.topsTable");
  const col = table?.querySelector?.("colgroup col.colMeta");
  if (!col?.getBoundingClientRect) return 15;
  const rect = col.getBoundingClientRect();
  const px = Number(rect?.width || 0);
  if (!Number.isFinite(px) || px <= 0) return 15;
  return px / _pxPerMm();
}

function _readNumberWidthMm(root) {
  const table = root?.querySelector?.("table.topsTable");
  const col = table?.querySelector?.("colgroup col.colNr");
  if (!col?.getBoundingClientRect) return 23;
  const rect = col.getBoundingClientRect();
  const px = Number(rect?.width || 0);
  if (!Number.isFinite(px) || px <= 0) return 23;
  return px / _pxPerMm();
}

function _readNumberInsetMm(root) {
  const cell =
    root?.querySelector?.("table.topsTable td.colNr") ||
    root?.querySelector?.("table.topsTable th.colNr") ||
    null;
  if (!cell || typeof window?.getComputedStyle !== "function") return null;
  const style = window.getComputedStyle(cell);
  const px = Number(String(style?.paddingLeft || "").replace("px", "").trim());
  if (!Number.isFinite(px) || px < 0) return null;
  return px / _pxPerMm();
}

function _readNumberFontPt(root) {
  const el =
    root?.querySelector?.("table.topsTable .topNumber") ||
    root?.querySelector?.("table.topsTable td.colNr") ||
    root?.querySelector?.("table.topsTable th.colNr") ||
    null;
  if (!el || typeof window?.getComputedStyle !== "function") return null;
  const style = window.getComputedStyle(el);
  const px = Number(String(style?.fontSize || "").replace("px", "").trim());
  if (!Number.isFinite(px) || px <= 0) return null;
  // 1px = 0.75pt (CSS px to pt)
  return px * 0.75;
}

function _readTextInsetMm(root) {
  const cell =
    root?.querySelector?.("table.topsTable td.colText") ||
    root?.querySelector?.("table.topsTable th.colText") ||
    null;
  if (!cell || typeof window?.getComputedStyle !== "function") return null;
  const style = window.getComputedStyle(cell);
  const px = Number(String(style?.paddingLeft || "").replace("px", "").trim());
  if (!Number.isFinite(px) || px < 0) return null;
  return px / _pxPerMm();
}

function _readTextFontPt(root) {
  const el = root?.querySelector?.("table.topsTable .shortText") || root?.querySelector?.("table.topsTable .longText") || null;
  if (!el || typeof window?.getComputedStyle !== "function") return null;
  const style = window.getComputedStyle(el);
  const px = Number(String(style?.fontSize || "").replace("px", "").trim());
  if (!Number.isFinite(px) || px <= 0) return null;
  return px * 0.75;
}

function _readParticipantsNameWidthMm(root) {
  const raw = String(root?.style?.getPropertyValue?.("--bbm-part-col-name-width") || "").trim();
  const mm = _parseMetaWidthMmFromRaw(raw);
  return mm != null ? mm : 34;
}

function _readParticipantsNameInsetMm(root) {
  const raw = String(root?.style?.getPropertyValue?.("--bbm-part-col-name-padding-inline") || "").trim();
  const mm = _parseMetaInsetMmFromRaw(raw);
  return mm != null ? mm : 1.4;
}

function _readParticipantsNameFontPt(root) {
  const raw = String(root?.style?.getPropertyValue?.("--bbm-part-col-name-font-size") || "").trim();
  const pt = _parsePtFromRaw(raw);
  return pt != null ? pt : 9.3;
}

function _participantsColKeyFromZone(zone) {
  const z = String(zone || "").trim().toLowerCase();
  if (z === "marks") return "attendance";
  return z;
}

function _participantsZoneFromColKey(key) {
  const k = String(key || "").trim().toLowerCase();
  if (k === "attendance") return "marks";
  return k;
}

function _participantsVarPrefix(zone) {
  const z = String(zone || "").trim().toLowerCase();
  return z === "marks" ? "marks" : z;
}

function _readParticipantsZoneWidthMm(root, zone) {
  const prefix = _participantsVarPrefix(zone);
  const raw = String(root?.style?.getPropertyValue?.(`--bbm-part-col-${prefix}-width`) || "").trim();
  const mm = _parseMetaWidthMmFromRaw(raw);
  const defaults = { name: 34, role: 35, firm: 30, contact: 55.12, marks: 14.88 };
  return mm != null ? mm : (defaults[String(zone)] ?? 30);
}

function _readParticipantsZoneInsetMm(root, zone) {
  const prefix = _participantsVarPrefix(zone);
  const raw = String(root?.style?.getPropertyValue?.(`--bbm-part-col-${prefix}-padding-inline`) || "").trim();
  const mm = _parseMetaInsetMmFromRaw(raw);
  return mm != null ? mm : 1.4;
}

function _readParticipantsZoneFontPt(root, zone) {
  const prefix = _participantsVarPrefix(zone);
  const raw = String(root?.style?.getPropertyValue?.(`--bbm-part-col-${prefix}-font-size`) || "").trim();
  const pt = _parsePtFromRaw(raw);
  return pt != null ? pt : 9.3;
}

function _readMetaFontPx(root) {
  const cell =
    root?.querySelector?.("table.topsTable td.colMeta") ||
    root?.querySelector?.("table.topsTable th.colMeta") ||
    null;
  if (!cell || typeof window?.getComputedStyle !== "function") return null;
  const style = window.getComputedStyle(cell);
  const px = Number(String(style?.fontSize || "").replace("px", "").trim());
  return Number.isFinite(px) && px > 0 ? px : null;
}

function _extractPdfMetaWidthRawFromData(data) {
  const raw =
    data?.tableLayouts?.protokoll_tops?.effectiveLayout?.pdf?.columns?.meta?.width ||
    data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.columns?.meta?.width ||
    "";
  return String(raw || "").trim();
}

function _extractPdfMetaInsetRawFromData(data) {
  const raw =
    data?.tableLayouts?.protokoll_tops?.effectiveLayout?.pdf?.rootVars?.["--bbm-top-col-meta-padding-left"] ||
    data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-meta-padding-left"] ||
    "";
  return String(raw || "").trim();
}

function _extractPdfMetaWidthRawFromDefaults(data) {
  const raw = data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.columns?.meta?.width || "";
  return String(raw || "").trim();
}

function _extractPdfMetaInsetRawFromDefaults(data) {
  const raw = data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-meta-padding-left"] || "";
  return String(raw || "").trim();
}

function _extractPdfMetaFontSizeRawFromData(data) {
  const raw =
    data?.tableLayouts?.protokoll_tops?.effectiveLayout?.pdf?.rootVars?.["--bbm-top-col-meta-font-size"] ||
    data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-meta-font-size"] ||
    "";
  return String(raw || "").trim();
}

function _extractPdfMetaFontSizeRawFromDefaults(data) {
  const raw = data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-meta-font-size"] || "";
  return String(raw || "").trim();
}

function _extractPdfNumberWidthRawFromData(data) {
  const raw =
    data?.tableLayouts?.protokoll_tops?.effectiveLayout?.pdf?.columns?.number?.width ||
    data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.columns?.number?.width ||
    "";
  return String(raw || "").trim();
}

function _extractPdfNumberWidthRawFromDefaults(data) {
  const raw = data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.columns?.number?.width || "";
  return String(raw || "").trim();
}

function _extractPdfNumberInsetRawFromData(data) {
  const raw =
    data?.tableLayouts?.protokoll_tops?.effectiveLayout?.pdf?.rootVars?.["--bbm-top-col-nr-padding-left"] ||
    data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-nr-padding-left"] ||
    "";
  return String(raw || "").trim();
}

function _extractPdfNumberInsetRawFromDefaults(data) {
  const raw = data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-nr-padding-left"] || "";
  return String(raw || "").trim();
}

function _extractPdfNumberFontSizeRawFromData(data) {
  const raw =
    data?.tableLayouts?.protokoll_tops?.effectiveLayout?.pdf?.rootVars?.["--bbm-top-col-nr-font-size"] ||
    data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-nr-font-size"] ||
    "";
  return String(raw || "").trim();
}

function _extractPdfNumberFontSizeRawFromDefaults(data) {
  const raw = data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-nr-font-size"] || "";
  return String(raw || "").trim();
}

function _extractPdfTextPaddingLeftRawFromData(data) {
  const raw =
    data?.tableLayouts?.protokoll_tops?.effectiveLayout?.pdf?.rootVars?.["--bbm-top-col-text-padding-left"] ||
    data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-text-padding-left"] ||
    "";
  return String(raw || "").trim();
}

function _extractPdfTextPaddingRightRawFromData(data) {
  const raw =
    data?.tableLayouts?.protokoll_tops?.effectiveLayout?.pdf?.rootVars?.["--bbm-top-col-text-padding-right"] ||
    data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-text-padding-right"] ||
    "";
  return String(raw || "").trim();
}

function _extractPdfTextFontSizeRawFromData(data) {
  const raw =
    data?.tableLayouts?.protokoll_tops?.effectiveLayout?.pdf?.rootVars?.["--bbm-top-col-text-font-size"] ||
    data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-text-font-size"] ||
    "";
  return String(raw || "").trim();
}

function _extractPdfTextPaddingLeftRawFromDefaults(data) {
  const raw = data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-text-padding-left"] || "";
  return String(raw || "").trim();
}

function _extractPdfTextPaddingRightRawFromDefaults(data) {
  const raw = data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-text-padding-right"] || "";
  return String(raw || "").trim();
}

function _extractPdfTextFontSizeRawFromDefaults(data) {
  const raw = data?.tableLayouts?.protokoll_tops?.defaultLayout?.pdf?.rootVars?.["--bbm-top-col-text-font-size"] || "";
  return String(raw || "").trim();
}

function _parseMetaWidthMmFromRaw(raw) {
  const text = String(raw || "").trim();
  const mmMatch = text.match(/^(\d+(?:\.\d+)?)mm$/i);
  if (mmMatch) {
    const value = Number(mmMatch[1]);
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

function _parseMetaInsetMmFromRaw(raw) {
  const text = String(raw || "").trim();
  const mmMatch = text.match(/^(\d+(?:\.\d+)?)mm$/i);
  if (mmMatch) {
    const value = Number(mmMatch[1]);
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

function _parseFontPxFromRaw(raw) {
  const text = String(raw || "").trim();
  const pxMatch = text.match(/^(\d+(?:\.\d+)?)px$/i);
  if (pxMatch) {
    const value = Number(pxMatch[1]);
    return Number.isFinite(value) ? value : null;
  }
  const ptMatch = text.match(/^(\d+(?:\.\d+)?)pt$/i);
  if (ptMatch) {
    const pt = Number(ptMatch[1]);
    if (!Number.isFinite(pt)) return null;
    // 1pt = 1/72in, 1px = 1/96in => px = pt * 96/72 = pt * 4/3
    return pt * (4 / 3);
  }
  return null;
}

function _parsePtFromRaw(raw) {
  const text = String(raw || "").trim();
  const ptMatch = text.match(/^(\d+(?:\.\d+)?)pt$/i);
  if (ptMatch) {
    const value = Number(ptMatch[1]);
    return Number.isFinite(value) ? value : null;
  }
  const pxMatch = text.match(/^(\d+(?:\.\d+)?)px$/i);
  if (pxMatch) {
    const px = Number(pxMatch[1]);
    return Number.isFinite(px) ? px * 0.75 : null;
  }
  return null;
}

function _applyMetaFontPx(root, px) {
  const nextPx = Math.max(6, Math.min(22, Math.round(Number(px))));
  const tables = root?.querySelectorAll?.("table.topsTable") || [];
  for (const table of tables) {
    if (table?.style?.setProperty) {
      table.style.setProperty("--bbm-top-col-meta-font-size", `${nextPx}px`);
    }
  }
  return nextPx;
}

function _applyMetaInsetMm(root, mm) {
  const nextMm = Math.max(0, Math.min(20, Math.round(Number(mm) * 2) / 2));
  // The PDF layout vars are applied to the table element via applyProtokollTopsPdfLayout(table,...).
  // Updating the root would be overridden by the table's inline vars, so we set it on the tables.
  const tables = root?.querySelectorAll?.("table.topsTable") || [];
  for (const table of tables) {
    if (table?.style?.setProperty) {
      table.style.setProperty("--bbm-top-col-meta-padding-left", `${nextMm}mm`);
    }
  }
  return nextMm;
}

function _formatMm(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return Math.abs(n - Math.round(n)) < 0.001 ? String(Math.round(n)) : n.toFixed(1);
}

function _applyMetaWidthMm(root, mm) {
  const nextMm = Math.max(8, Math.min(40, Math.round(Number(mm) * 10) / 10));
  const tables = root?.querySelectorAll?.("table.topsTable") || [];
  for (const table of tables) {
    const col = table.querySelector?.("colgroup col.colMeta");
    if (col?.style) {
      col.style.width = `${nextMm}mm`;
    }
  }
  return nextMm;
}

function _applyNumberWidthMm(root, mm) {
  const nextMm = Math.max(12, Math.min(60, Math.round(Number(mm) * 10) / 10));
  const tables = root?.querySelectorAll?.("table.topsTable") || [];
  for (const table of tables) {
    const col = table.querySelector?.("colgroup col.colNr");
    if (col?.style) {
      col.style.width = `${nextMm}mm`;
    }
  }
  return nextMm;
}

function _applyNumberInsetMm(root, mm) {
  const nextMm = Math.max(0, Math.min(10, Math.round(Number(mm) * 2) / 2));
  const tables = root?.querySelectorAll?.("table.topsTable") || [];
  for (const table of tables) {
    if (table?.style?.setProperty) {
      table.style.setProperty("--bbm-top-col-nr-padding-left", `${nextMm}mm`);
    }
  }
  return nextMm;
}

function _applyNumberFontPt(root, pt) {
  const nextPt = Math.max(6, Math.min(16, Math.round(Number(pt) * 2) / 2));
  const tables = root?.querySelectorAll?.("table.topsTable") || [];
  for (const table of tables) {
    if (table?.style?.setProperty) {
      table.style.setProperty("--bbm-top-col-nr-font-size", `${nextPt}pt`);
    }

    // Keep date/hint readable but slightly smaller than the main number.
    const secondaryPt = Math.max(5, Math.round((nextPt - 1.5) * 2) / 2);
    const secondary = table.querySelectorAll?.(".nrDate, .nrHint") || [];
    for (const el of secondary) {
      if (el?.style) el.style.fontSize = `${secondaryPt}pt`;
    }
  }
  return nextPt;
}

function _pxToMm(px) {
  const value = Number(px);
  if (!Number.isFinite(value)) return null;
  return value * 25.4 / 96;
}

function _pxToPt(px) {
  const value = Number(px);
  if (!Number.isFinite(value)) return null;
  return value * 0.75;
}

function _readAutoLayoutLengthMm(raw) {
  if (Number.isFinite(raw)) return Number(raw);
  const text = String(raw || "").trim();
  const mmMatch = text.match(/^(-?\d+(?:\.\d+)?)mm$/i);
  if (mmMatch) {
    const value = Number(mmMatch[1]);
    return Number.isFinite(value) ? value : null;
  }
  const ptMatch = text.match(/^(-?\d+(?:\.\d+)?)pt$/i);
  if (ptMatch) {
    const value = Number(ptMatch[1]);
    return Number.isFinite(value) ? value * (25.4 / 72) : null;
  }
  const pxMatch = text.match(/^(-?\d+(?:\.\d+)?)px$/i);
  if (pxMatch) {
    return _pxToMm(Number(pxMatch[1]));
  }
  return null;
}

function _readAutoLayoutLengthPt(raw) {
  if (Number.isFinite(raw)) return Number(raw);
  const text = String(raw || "").trim();
  const ptMatch = text.match(/^(-?\d+(?:\.\d+)?)pt$/i);
  if (ptMatch) {
    const value = Number(ptMatch[1]);
    return Number.isFinite(value) ? value : null;
  }
  const pxMatch = text.match(/^(-?\d+(?:\.\d+)?)px$/i);
  if (pxMatch) {
    return _pxToPt(Number(pxMatch[1]));
  }
  const mmMatch = text.match(/^(-?\d+(?:\.\d+)?)mm$/i);
  if (mmMatch) {
    const value = Number(mmMatch[1]);
    return Number.isFinite(value) ? value * (72 / 25.4) : null;
  }
  return null;
}

function _getAutoLayoutSurfaceDescriptor(root, surfaceKey) {
  const key = String(surfaceKey || "").trim();
  if (!key || !root?._bbmDevPdfAutoLayoutSurfaceMap) return null;
  return root._bbmDevPdfAutoLayoutSurfaceMap.get(key) || null;
}

function _getAutoLayoutZoneNodes(root, surfaceKey, zoneKey) {
  const descriptor = _getAutoLayoutSurfaceDescriptor(root, surfaceKey);
  const table = descriptor?.table || null;
  if (!table) return [];
  const key = String(zoneKey || "").trim();
  if (!key) return [];
  return Array.from(table.querySelectorAll?.("[data-dev-pdf-auto-zone]") || []).filter((node) => {
    return String(node?.dataset?.devPdfAutoZoneKey || "").trim() === key;
  });
}

function _getAutoLayoutZoneIndex(root, surfaceKey, zoneKey) {
  const descriptor = _getAutoLayoutSurfaceDescriptor(root, surfaceKey);
  const key = String(zoneKey || "").trim();
  if (!descriptor || !key) return -1;
  const zone = Array.isArray(descriptor.zones)
    ? descriptor.zones.find((item) => String(item?.key || "").trim() === key)
    : null;
  return Number.isFinite(Number(zone?.index)) ? Number(zone.index) : -1;
}

function _getAutoLayoutZoneCol(root, surfaceKey, zoneKey) {
  const descriptor = _getAutoLayoutSurfaceDescriptor(root, surfaceKey);
  const table = descriptor?.table || null;
  const index = _getAutoLayoutZoneIndex(root, surfaceKey, zoneKey);
  if (!table || index < 0) return null;
  return Array.from(table.querySelectorAll?.("colgroup col") || [])[index] || null;
}

function _readAutoZoneWidthMm(root, surfaceKey, zoneKey) {
  const nodes = _getAutoLayoutZoneNodes(root, surfaceKey, zoneKey);
  const first = nodes[0] || null;
  const inlineWidth = _readAutoLayoutLengthMm(first?.style?.width || first?.getAttribute?.("width") || "");
  if (inlineWidth != null) return inlineWidth;
  const col = _getAutoLayoutZoneCol(root, surfaceKey, zoneKey);
  const colWidth = _readAutoLayoutLengthMm(col?.style?.width || col?.getAttribute?.("width") || "");
  if (colWidth != null) return colWidth;
  const rectWidth = Number(first?.getBoundingClientRect?.().width || 0);
  if (Number.isFinite(rectWidth) && rectWidth > 0) return _pxToMm(rectWidth);
  return 18;
}

function _readAutoZoneInsetMm(root, surfaceKey, zoneKey) {
  const nodes = _getAutoLayoutZoneNodes(root, surfaceKey, zoneKey);
  const first = nodes[0] || null;
  const computed = first && typeof window?.getComputedStyle === "function" ? window.getComputedStyle(first) : null;
  const inlineInset = _readAutoLayoutLengthMm(first?.style?.paddingLeft || computed?.paddingLeft || "");
  if (inlineInset != null) return inlineInset;
  return 1;
}

function _readAutoZoneFontPt(root, surfaceKey, zoneKey) {
  const nodes = _getAutoLayoutZoneNodes(root, surfaceKey, zoneKey);
  const first = nodes[0] || null;
  const computed = first && typeof window?.getComputedStyle === "function" ? window.getComputedStyle(first) : null;
  const inlineFont = _readAutoLayoutLengthPt(first?.style?.fontSize || computed?.fontSize || "");
  if (inlineFont != null) return inlineFont;
  return 9;
}

function _applyAutoZoneWidthMm(root, surfaceKey, zoneKey, mm) {
  const nextMm = Math.max(6, Math.min(120, Math.round(Number(mm) * 1) / 1));
  const nodes = _getAutoLayoutZoneNodes(root, surfaceKey, zoneKey);
  for (const node of nodes) {
    if (!node?.style) continue;
    node.style.width = `${nextMm}mm`;
    node.style.minWidth = `${nextMm}mm`;
    node.style.maxWidth = `${nextMm}mm`;
  }
  const col = _getAutoLayoutZoneCol(root, surfaceKey, zoneKey);
  if (col?.style) {
    col.style.width = `${nextMm}mm`;
    col.style.minWidth = `${nextMm}mm`;
    col.style.maxWidth = `${nextMm}mm`;
  }
  return nextMm;
}

function _applyAutoZoneInsetMm(root, surfaceKey, zoneKey, mm) {
  const nextMm = Math.max(0, Math.min(10, Math.round(Number(mm) * 2) / 2));
  const nodes = _getAutoLayoutZoneNodes(root, surfaceKey, zoneKey);
  for (const node of nodes) {
    if (!node?.style) continue;
    node.style.paddingLeft = `${nextMm}mm`;
    node.style.paddingRight = `${nextMm}mm`;
  }
  return nextMm;
}

function _applyAutoZoneFontPt(root, surfaceKey, zoneKey, pt) {
  const nextPt = Math.max(6, Math.min(16, Math.round(Number(pt) * 2) / 2));
  const nodes = _getAutoLayoutZoneNodes(root, surfaceKey, zoneKey);
  for (const node of nodes) {
    if (!node?.style) continue;
    node.style.fontSize = `${nextPt}pt`;
  }
  return nextPt;
}

function _applyTextInsetMm(root, mm) {
  const nextMm = Math.max(0, Math.min(10, Math.round(Number(mm) * 2) / 2));
  _applyTextPaddingMm(root, nextMm, nextMm);
  return nextMm;
}

function _applyTextPaddingMm(root, leftMm, rightMm) {
  const l = Math.max(0, Math.min(10, Math.round(Number(leftMm) * 2) / 2));
  const r = Math.max(0, Math.min(10, Math.round(Number(rightMm) * 2) / 2));
  const tables = root?.querySelectorAll?.("table.topsTable") || [];
  for (const table of tables) {
    if (table?.style?.setProperty) {
      table.style.setProperty("--bbm-top-col-text-padding-left", `${l}mm`);
      table.style.setProperty("--bbm-top-col-text-padding-right", `${r}mm`);
    }
  }
  return { leftMm: l, rightMm: r };
}

function _applyTextFontPt(root, pt) {
  const nextPt = Math.max(6, Math.min(16, Math.round(Number(pt) * 2) / 2));
  const tables = root?.querySelectorAll?.("table.topsTable") || [];
  for (const table of tables) {
    const els = table.querySelectorAll?.(".shortText, .longText") || [];
    for (const el of els) {
      if (el?.style) el.style.fontSize = `${nextPt}pt`;
    }
  }
  return nextPt;
}

function _applyParticipantsNameWidthMm(root, mm) {
  const next = Math.max(20, Math.min(70, Math.round(Number(mm) * 2) / 2));
  if (root?.style?.setProperty) root.style.setProperty("--bbm-part-col-name-width", `${_formatMm(next)}mm`);
  return next;
}

function _applyParticipantsNameInsetMm(root, mm) {
  const next = Math.max(0, Math.min(6, Math.round(Number(mm) * 2) / 2));
  if (root?.style?.setProperty) root.style.setProperty("--bbm-part-col-name-padding-inline", `${_formatMm(next)}mm`);
  return next;
}

function _applyParticipantsNameFontPt(root, pt) {
  const next = Math.max(7, Math.min(14, Math.round(Number(pt) * 2) / 2));
  if (root?.style?.setProperty) root.style.setProperty("--bbm-part-col-name-font-size", `${_formatMm(next)}pt`);
  return next;
}

function _applyParticipantsZoneWidthMm(root, zone, mm) {
  const z = String(zone || "").trim().toLowerCase();
  const prefix = _participantsVarPrefix(z);
  const maxByZone = z === "marks" ? 30 : 90;
  const next = Math.max(10, Math.min(maxByZone, Math.round(Number(mm) * 2) / 2));
  if (root?.style?.setProperty) root.style.setProperty(`--bbm-part-col-${prefix}-width`, `${_formatMm(next)}mm`);
  return next;
}

function _applyParticipantsZoneInsetMm(root, zone, mm) {
  const z = String(zone || "").trim().toLowerCase();
  const prefix = _participantsVarPrefix(z);
  const next = Math.max(0, Math.min(6, Math.round(Number(mm) * 2) / 2));
  if (root?.style?.setProperty) root.style.setProperty(`--bbm-part-col-${prefix}-padding-inline`, `${_formatMm(next)}mm`);
  return next;
}

function _applyParticipantsZoneFontPt(root, zone, pt) {
  const z = String(zone || "").trim().toLowerCase();
  const prefix = _participantsVarPrefix(z);
  const next = Math.max(7, Math.min(14, Math.round(Number(pt) * 2) / 2));
  if (root?.style?.setProperty) root.style.setProperty(`--bbm-part-col-${prefix}-font-size`, `${_formatMm(next)}pt`);
  return next;
}

function _applyParticipantsNameVarsFromLayout(root, layout) {
  if (!root?.style) return;
  const cols = Array.isArray(layout?.columns) ? layout.columns : [];
  const rootVars = layout?.pdf?.rootVars || {};
  const zones = ["name", "role", "firm", "contact", "marks"];
  for (const zone of zones) {
    const colKey = _participantsColKeyFromZone(zone);
    const col = cols.find((c) => String(c?.key || "").trim().toLowerCase() === colKey) || null;
    const widthMm = _parseMetaWidthMmFromRaw(col?.pdfWidth);
    if (widthMm != null) {
      const prefix = _participantsVarPrefix(zone);
      root.style.setProperty(`--bbm-part-col-${prefix}-width`, `${_formatMm(widthMm)}mm`);
    }
    const insetMm = _parseMetaInsetMmFromRaw(rootVars[`--bbm-part-col-${_participantsVarPrefix(zone)}-padding-inline`]);
    if (insetMm != null) {
      root.style.setProperty(`--bbm-part-col-${_participantsVarPrefix(zone)}-padding-inline`, `${_formatMm(insetMm)}mm`);
    }
    const fontPt = _parsePtFromRaw(rootVars[`--bbm-part-col-${_participantsVarPrefix(zone)}-font-size`]);
    if (fontPt != null) {
      root.style.setProperty(`--bbm-part-col-${_participantsVarPrefix(zone)}-font-size`, `${_formatMm(fontPt)}pt`);
    }
  }
}

function _applyTodoVarsFromLayout(root, layout) {
  if (!root?.style) return;
  const rootVars = layout?.pdf?.rootVars || {};
  if (!rootVars || typeof rootVars !== "object") return;
  for (const [key, value] of Object.entries(rootVars)) {
    if (!key || typeof key !== "string") continue;
    if (value == null) continue;
    root.style.setProperty(key, String(value));
  }
}

function _syncDevPdfLayoutToolbar(toolbar, root, runtimeData = null) {
  if (!toolbar) return;
  const enabled = String(root?.dataset?.devPdfLayout || "true").trim() === "true";
  toolbar.hidden = !enabled;
  toolbar.style.display = enabled ? "" : "none";
  if (!enabled) {
    toolbar._export.disabled = true;
    toolbar._export.onclick = null;
    toolbar._save.disabled = true;
    toolbar._reset.disabled = true;
    toolbar._minus.disabled = true;
    toolbar._plus.disabled = true;
    toolbar._insetMinus.disabled = true;
    toolbar._insetPlus.disabled = true;
    if (toolbar._fontMinus) toolbar._fontMinus.disabled = true;
    if (toolbar._fontPlus) toolbar._fontPlus.disabled = true;
    return;
  }
  const participantsZone = String(root?.dataset?.devPdfParticipantsActiveZone || "").trim().toLowerCase();
  const participantsLabel =
    participantsZone === "name"
      ? "Name"
      : participantsZone === "role"
        ? "Funktion"
        : participantsZone === "firm"
          ? "Firma"
          : participantsZone === "contact"
            ? "Kontakt"
            : participantsZone === "marks"
              ? "Anwesend / Verteiler"
              : "";
  const isParticipants = !!participantsLabel;
  const isParticipantsName = participantsZone === "name";
  const autoSurfaceKey = String(root?.dataset?.devPdfAutoActiveSurfaceKey || "").trim();
  const autoZoneKey = String(root?.dataset?.devPdfAutoActiveZone || "").trim();
  const autoSurfaceMap = root && root._bbmDevPdfAutoLayoutSurfaceMap ? root._bbmDevPdfAutoLayoutSurfaceMap : null;
  const autoSurface = autoSurfaceKey && autoSurfaceMap
    ? autoSurfaceMap.get(autoSurfaceKey) || null
    : null;
  const autoZone = autoSurfaceKey && autoZoneKey
    ? (Array.isArray(autoSurface?.zones) ? autoSurface.zones : []).find((zone) => String(zone?.key || "").trim() === autoZoneKey) || null
    : null;
  const isAutoSurface = !!autoSurface && !!autoZone;
  const manualZone = String(root?.dataset?.devPdfActiveZone || "").trim().toLowerCase();
  const hasExportableSelection = isParticipants || isAutoSurface || !!manualZone;

  toolbar._export.disabled = !hasExportableSelection;
  toolbar._export.onclick = hasExportableSelection
    ? async () => {
        await _showDevLayoutExport(toolbar, _buildDevLayoutExportPayload(root, runtimeData, toolbar));
      }
    : null;

  if (isParticipants) {
    if (toolbar._line1) toolbar._line1.textContent = "Teilnehmerliste > PDF";
    toolbar._line2.textContent = `Teilnehmerliste > ${participantsLabel}`;
    // Participants: all zones are live + persistable; values stay separated per column key.
    toolbar._save.disabled = false;
    toolbar._reset.disabled = false;
    toolbar._minus.disabled = false;
    toolbar._plus.disabled = false;
    toolbar._insetMinus.disabled = false;
    toolbar._insetPlus.disabled = false;
    toolbar._fontMinus.disabled = false;
    toolbar._fontPlus.disabled = false;

    toolbar._participantsState = toolbar._participantsState || {};
    const zoneKey = participantsZone;
    const state = toolbar._participantsState[zoneKey] || { widthMm: null, insetMm: null, fontPt: null };
    toolbar._participantsState[zoneKey] = state;

    if (state.widthMm == null) state.widthMm = _readParticipantsZoneWidthMm(root, zoneKey);
    if (state.insetMm == null) state.insetMm = _readParticipantsZoneInsetMm(root, zoneKey);
    if (state.fontPt == null) state.fontPt = _readParticipantsZoneFontPt(root, zoneKey);

    toolbar._value.textContent = `Breite ${Math.round(Number(state.widthMm || 0))} mm`;
    toolbar._insetValue.textContent = `Innen ${_formatMm(state.insetMm)} mm`;
    if (toolbar._fontValue) toolbar._fontValue.textContent = `Schrift ${_formatMm(state.fontPt)} pt`;

    toolbar._minus.onclick = () => {
      const current = state.widthMm == null ? _readParticipantsZoneWidthMm(root, zoneKey) : state.widthMm;
      state.widthMm = _applyParticipantsZoneWidthMm(root, zoneKey, current - 1);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    toolbar._plus.onclick = () => {
      const current = state.widthMm == null ? _readParticipantsZoneWidthMm(root, zoneKey) : state.widthMm;
      state.widthMm = _applyParticipantsZoneWidthMm(root, zoneKey, current + 1);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    toolbar._insetMinus.onclick = () => {
      const current = state.insetMm == null ? 1.4 : state.insetMm;
      state.insetMm = _applyParticipantsZoneInsetMm(root, zoneKey, current - 0.5);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    toolbar._insetPlus.onclick = () => {
      const current = state.insetMm == null ? 1.4 : state.insetMm;
      state.insetMm = _applyParticipantsZoneInsetMm(root, zoneKey, current + 0.5);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    if (toolbar._fontMinus) {
      toolbar._fontMinus.onclick = () => {
        const current = state.fontPt == null ? 9.3 : state.fontPt;
        state.fontPt = _applyParticipantsZoneFontPt(root, zoneKey, current - 0.5);
        _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
      };
    }
    if (toolbar._fontPlus) {
      toolbar._fontPlus.onclick = () => {
        const current = state.fontPt == null ? 9.3 : state.fontPt;
        state.fontPt = _applyParticipantsZoneFontPt(root, zoneKey, current + 0.5);
        _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
      };
    }

    toolbar._save.onclick = async () => {
      toolbar._status.textContent = "";
      try {
        if (root?.dataset?.devPdfLayout !== "true") return;
        if (typeof window?.bbmPrint?.tableLayoutsSave !== "function") {
          toolbar._status.textContent = "Speichern nicht verfuegbar.";
          return;
        }
        const widthMm = state.widthMm == null ? _readParticipantsZoneWidthMm(root, zoneKey) : state.widthMm;
        const insetMm = state.insetMm == null ? _readParticipantsZoneInsetMm(root, zoneKey) : state.insetMm;
        const fontPt = state.fontPt == null ? _readParticipantsZoneFontPt(root, zoneKey) : state.fontPt;

        const resLayout = await window.bbmPrint.tableLayoutsGetOne({
          tableKey: "protokoll_participants",
          moduleId: "protokoll",
          orientation: toolbar._orientation || "portrait",
        });
        const effective = resLayout?.data?.effectiveLayout || resLayout?.data?.defaultLayout || {};
        const nextColumns = Array.isArray(effective?.columns) ? effective.columns.map((col) => ({ ...(col || {}) })) : [];
        const targetKey = _participantsColKeyFromZone(zoneKey);
        for (let i = 0; i < nextColumns.length; i += 1) {
          const col = nextColumns[i] || {};
          if (String(col.key || "").trim().toLowerCase() !== String(targetKey).toLowerCase()) continue;
          nextColumns[i] = { ...col, pdfWidth: `${Math.round(Number(widthMm || 0))}mm` };
          break;
        }
        const prefix = _participantsVarPrefix(zoneKey);
        const nextRootVars = {
          ...((effective?.pdf && effective.pdf.rootVars) || {}),
          [`--bbm-part-col-${prefix}-padding-inline`]: `${_formatMm(insetMm)}mm`,
          [`--bbm-part-col-${prefix}-font-size`]: `${_formatMm(fontPt)}pt`,
        };
        const next = {
          ...(effective || {}),
          variant: toolbar._orientation || effective?.variant || "portrait",
          columns: nextColumns.length ? nextColumns : effective?.columns,
          pdf: {
            ...(effective?.pdf || {}),
            rootVars: nextRootVars,
          },
        };
        const res = await window.bbmPrint.tableLayoutsSave({
          tableKey: "protokoll_participants",
          moduleId: "protokoll",
          orientation: toolbar._orientation || "portrait",
          layout: next,
        });
        if (!res?.ok) {
          toolbar._status.textContent = res?.error || "Speichern fehlgeschlagen.";
          return;
        }
        toolbar._status.style.color = "#25624f";
        toolbar._status.textContent = "Gespeichert.";
      } catch (err) {
        toolbar._status.textContent = err?.message || String(err) || "Speichern fehlgeschlagen.";
      }
    };

    toolbar._reset.onclick = async () => {
      toolbar._status.textContent = "";
      try {
        if (root?.dataset?.devPdfLayout !== "true") return;
        if (typeof window?.bbmPrint?.tableLayoutsSave !== "function" || typeof window?.bbmPrint?.tableLayoutsGetOne !== "function") {
          toolbar._status.textContent = "Reset nicht verfuegbar.";
          return;
        }
        const resLayout = await window.bbmPrint.tableLayoutsGetOne({
          tableKey: "protokoll_participants",
          moduleId: "protokoll",
          orientation: toolbar._orientation || "portrait",
        });
        const effective = resLayout?.data?.effectiveLayout || resLayout?.data?.defaultLayout || {};
        const defaults = resLayout?.data?.defaultLayout || {};
        const targetKey = _participantsColKeyFromZone(zoneKey);
        const defaultCols = Array.isArray(defaults?.columns) ? defaults.columns : [];
        const defaultCol = defaultCols.find((c) => String(c?.key || "").trim().toLowerCase() === String(targetKey).toLowerCase()) || null;
        const defaultPdfWidth = String(defaultCol?.pdfWidth || "").trim();

        const nextColumns = Array.isArray(effective?.columns) ? effective.columns.map((col) => ({ ...(col || {}) })) : [];
        for (let i = 0; i < nextColumns.length; i += 1) {
          const col = nextColumns[i] || {};
          if (String(col.key || "").trim().toLowerCase() !== String(targetKey).toLowerCase()) continue;
          nextColumns[i] = { ...col, pdfWidth: defaultPdfWidth || col.pdfWidth };
          break;
        }
        const prefix = _participantsVarPrefix(zoneKey);
        const nextRootVars = { ...((effective?.pdf && effective.pdf.rootVars) || {}) };
        delete nextRootVars[`--bbm-part-col-${prefix}-padding-inline`];
        delete nextRootVars[`--bbm-part-col-${prefix}-font-size`];
        delete nextRootVars[`--bbm-part-col-${prefix}-width`];

        const next = {
          ...(effective || {}),
          variant: toolbar._orientation || effective?.variant || "portrait",
          columns: nextColumns.length ? nextColumns : effective?.columns,
          pdf: {
            ...(effective?.pdf || {}),
            rootVars: nextRootVars,
          },
        };
        const res = await window.bbmPrint.tableLayoutsSave({
          tableKey: "protokoll_participants",
          moduleId: "protokoll",
          orientation: toolbar._orientation || "portrait",
          layout: next,
        });
        if (!res?.ok) {
          toolbar._status.textContent = res?.error || "Reset fehlgeschlagen.";
          return;
        }
        toolbar._status.style.color = "#25624f";
        toolbar._status.textContent = "Zurueckgesetzt.";

        if (root?.style?.removeProperty) {
          root.style.removeProperty(`--bbm-part-col-${prefix}-padding-inline`);
          root.style.removeProperty(`--bbm-part-col-${prefix}-font-size`);
          root.style.removeProperty(`--bbm-part-col-${prefix}-width`);
        }
        state.widthMm = null;
        state.insetMm = null;
        state.fontPt = null;
        _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
      } catch (err) {
        toolbar._status.textContent = err?.message || String(err) || "Reset fehlgeschlagen.";
      }
    };
    return;
  }

  if (isAutoSurface) {
    const surfaceLabel = String(autoSurface?.surfaceLabel || "Tabelle").trim();
    const zoneLabel = String(autoZone?.label || "Spalte").trim();
    if (toolbar._line1) toolbar._line1.textContent = `${surfaceLabel} > PDF`;
    toolbar._line2.textContent = `${surfaceLabel} > ${zoneLabel}`;
    toolbar._save.disabled = true;
    toolbar._reset.disabled = true;
    toolbar._minus.disabled = false;
    toolbar._plus.disabled = false;
    toolbar._insetMinus.disabled = false;
    toolbar._insetPlus.disabled = false;
    toolbar._fontMinus.disabled = false;
    toolbar._fontPlus.disabled = false;

    toolbar._autoState = toolbar._autoState || {};
    const stateKey = `${autoSurfaceKey}::${autoZoneKey}`;
    const state = toolbar._autoState[stateKey] || { widthMm: null, insetMm: null, fontPt: null };
    toolbar._autoState[stateKey] = state;

    if (state.widthMm == null) state.widthMm = _readAutoZoneWidthMm(root, autoSurfaceKey, autoZoneKey);
    if (state.insetMm == null) state.insetMm = _readAutoZoneInsetMm(root, autoSurfaceKey, autoZoneKey);
    if (state.fontPt == null) state.fontPt = _readAutoZoneFontPt(root, autoSurfaceKey, autoZoneKey);

    toolbar._value.textContent = `Breite ${Math.round(Number(state.widthMm || 0))} mm`;
    toolbar._insetValue.textContent = `Innen ${_formatMm(state.insetMm)} mm`;
    if (toolbar._fontValue) toolbar._fontValue.textContent = `Schrift ${_formatMm(state.fontPt)} pt`;
    toolbar._save.onclick = null;
    toolbar._save.disabled = false;
    toolbar._reset.disabled = false;
    toolbar._save.onclick = async () => {
      toolbar._status.textContent = "";
      try {
        if (root?.dataset?.devPdfLayout !== "true") return;
        if (typeof window?.bbmPrint?.tableLayoutsSave !== "function") {
          toolbar._status.textContent = "Speichern nicht verfuegbar.";
          return;
        }
        const layout = _buildAutoLayoutOverlayFromDom(root, autoSurfaceKey);
        if (!layout) {
          toolbar._status.textContent = "Auto-Layout nicht verfuegbar.";
          return;
        }
        const res = await window.bbmPrint.tableLayoutsSave({
          tableKey: autoSurfaceKey,
          moduleId: "protokoll",
          orientation: toolbar._orientation || "portrait",
          layout,
        });
        if (!res?.ok) {
          toolbar._status.textContent = res?.error || "Speichern fehlgeschlagen.";
          return;
        }
        toolbar._status.style.color = "#25624f";
        toolbar._status.textContent = "Gespeichert.";
      } catch (err) {
        toolbar._status.textContent = err?.message || String(err) || "Speichern fehlgeschlagen.";
      }
    };
    toolbar._reset.onclick = async () => {
      toolbar._status.textContent = "";
      try {
        if (root?.dataset?.devPdfLayout !== "true") return;
        if (typeof window?.bbmPrint?.tableLayoutsSave !== "function") {
          toolbar._status.textContent = "Reset nicht verfuegbar.";
          return;
        }
        const defaults = _getAutoLayoutDefaults(root, autoSurfaceKey, autoZoneKey);
        _applyAutoZoneWidthMm(root, autoSurfaceKey, autoZoneKey, defaults.widthMm);
        _applyAutoZoneInsetMm(root, autoSurfaceKey, autoZoneKey, defaults.insetMm);
        _applyAutoZoneFontPt(root, autoSurfaceKey, autoZoneKey, defaults.fontPt);
        const layout = _buildAutoLayoutOverlayFromDom(root, autoSurfaceKey);
        if (!layout) {
          toolbar._status.textContent = "Auto-Layout nicht verfuegbar.";
          return;
        }
        const res = await window.bbmPrint.tableLayoutsSave({
          tableKey: autoSurfaceKey,
          moduleId: "protokoll",
          orientation: toolbar._orientation || "portrait",
          layout,
        });
        if (!res?.ok) {
          toolbar._status.textContent = res?.error || "Reset fehlgeschlagen.";
          return;
        }
        state.widthMm = defaults.widthMm;
        state.insetMm = defaults.insetMm;
        state.fontPt = defaults.fontPt;
        toolbar._status.style.color = "#25624f";
        toolbar._status.textContent = "Zurueckgesetzt.";
        _syncDevPdfAutoSelection(root);
        _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
      } catch (err) {
        toolbar._status.textContent = err?.message || String(err) || "Reset fehlgeschlagen.";
      }
    };
    toolbar._minus.onclick = () => {
      const current = state.widthMm == null ? _readAutoZoneWidthMm(root, autoSurfaceKey, autoZoneKey) : state.widthMm;
      state.widthMm = _applyAutoZoneWidthMm(root, autoSurfaceKey, autoZoneKey, current - 1);
      _syncDevPdfAutoSelection(root);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    toolbar._plus.onclick = () => {
      const current = state.widthMm == null ? _readAutoZoneWidthMm(root, autoSurfaceKey, autoZoneKey) : state.widthMm;
      state.widthMm = _applyAutoZoneWidthMm(root, autoSurfaceKey, autoZoneKey, current + 1);
      _syncDevPdfAutoSelection(root);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    toolbar._insetMinus.onclick = () => {
      const current = state.insetMm == null ? _readAutoZoneInsetMm(root, autoSurfaceKey, autoZoneKey) : state.insetMm;
      state.insetMm = _applyAutoZoneInsetMm(root, autoSurfaceKey, autoZoneKey, current - 0.5);
      _syncDevPdfAutoSelection(root);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    toolbar._insetPlus.onclick = () => {
      const current = state.insetMm == null ? _readAutoZoneInsetMm(root, autoSurfaceKey, autoZoneKey) : state.insetMm;
      state.insetMm = _applyAutoZoneInsetMm(root, autoSurfaceKey, autoZoneKey, current + 0.5);
      _syncDevPdfAutoSelection(root);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    if (toolbar._fontMinus) {
      toolbar._fontMinus.onclick = () => {
        const current = state.fontPt == null ? _readAutoZoneFontPt(root, autoSurfaceKey, autoZoneKey) : state.fontPt;
        state.fontPt = _applyAutoZoneFontPt(root, autoSurfaceKey, autoZoneKey, current - 0.5);
        _syncDevPdfAutoSelection(root);
        _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
      };
    }
    if (toolbar._fontPlus) {
      toolbar._fontPlus.onclick = () => {
        const current = state.fontPt == null ? _readAutoZoneFontPt(root, autoSurfaceKey, autoZoneKey) : state.fontPt;
        state.fontPt = _applyAutoZoneFontPt(root, autoSurfaceKey, autoZoneKey, current + 0.5);
        _syncDevPdfAutoSelection(root);
        _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
      };
    }
    return;
  }

  const zone = String(root?.dataset?.devPdfActiveZone || "").trim().toLowerCase();
  const zoneLabel = zone === "meta" ? "Metablock" : zone === "text" ? "Textblock" : zone === "number" ? "Nummernblock" : "";
  if (toolbar._line1) toolbar._line1.textContent = "TOP-Liste > PDF";
  toolbar._line2.textContent = zoneLabel ? `TOP-Liste > PDF > ${zoneLabel}` : "TOP-Liste > PDF | Bereich waehlen";

  const isMeta = zone === "meta";
  const isNumber = zone === "number";
  const isText = zone === "text";
  toolbar._minus.disabled = !isMeta;
  toolbar._plus.disabled = !isMeta;
  toolbar._insetMinus.disabled = !isMeta;
  toolbar._insetPlus.disabled = !isMeta;
  toolbar._fontMinus.disabled = !isMeta;
  toolbar._fontPlus.disabled = !isMeta;
  // Save/Reset only for Meta for now (Nummernblock is live-only in this milestone).
  toolbar._save.disabled = !isMeta;
  toolbar._reset.disabled = !isMeta;

  // Reuse the same controls for Nummernblock, but without persistence buttons.
  if (isNumber) {
    toolbar._minus.disabled = false;
    toolbar._plus.disabled = false;
    toolbar._insetMinus.disabled = false;
    toolbar._insetPlus.disabled = false;
    toolbar._fontMinus.disabled = false;
    toolbar._fontPlus.disabled = false;
  }

  // Textblock: width is "rest area" and must not be directly adjustable.
  if (isText) {
    toolbar._minus.disabled = true;
    toolbar._plus.disabled = true;
    toolbar._insetMinus.disabled = false;
    toolbar._insetPlus.disabled = false;
    toolbar._fontMinus.disabled = false;
    toolbar._fontPlus.disabled = false;
    toolbar._save.disabled = true;
    toolbar._reset.disabled = true;
  }

  if (!isMeta && !isNumber && !isText) {
    toolbar._value.textContent = "Breite -";
    toolbar._insetValue.textContent = "Innen -";
    if (toolbar._fontValue) toolbar._fontValue.textContent = "Schrift -";
    toolbar._export.disabled = true;
    toolbar._export.onclick = null;
    toolbar._metaWidthMm = null;
    toolbar._metaInsetMm = null;
    toolbar._metaFontPx = null;
    toolbar._nrWidthMm = null;
    toolbar._nrInsetMm = null;
    toolbar._nrFontPt = null;
    toolbar._txtInsetMm = null;
    toolbar._txtFontPt = null;
    toolbar._minus.onclick = null;
    toolbar._plus.onclick = null;
    toolbar._insetMinus.onclick = null;
    toolbar._insetPlus.onclick = null;
    if (toolbar._fontMinus) toolbar._fontMinus.onclick = null;
    if (toolbar._fontPlus) toolbar._fontPlus.onclick = null;
    return;
  }

  if (isNumber) {
    toolbar._save.disabled = false;
    toolbar._reset.disabled = false;
    if (toolbar._nrWidthMm == null) {
      toolbar._nrWidthMm = _readNumberWidthMm(root);
    }
    if (toolbar._nrInsetMm == null) {
      const insetRaw = runtimeData ? _extractPdfNumberInsetRawFromData(runtimeData) : "";
      const defaultInsetRaw = runtimeData ? _extractPdfNumberInsetRawFromDefaults(runtimeData) : "";
      toolbar._defaultNrInsetRaw = toolbar._defaultNrInsetRaw || defaultInsetRaw || null;
      const insetMmFromLayout = _parseMetaInsetMmFromRaw(insetRaw);
      const inset = insetMmFromLayout != null ? insetMmFromLayout : _readNumberInsetMm(root);
      toolbar._nrInsetMm = inset != null ? inset : 1;
      toolbar._nrInsetMm = _applyNumberInsetMm(root, toolbar._nrInsetMm);
    }
    if (toolbar._nrFontPt == null) {
      const fontRaw = runtimeData ? _extractPdfNumberFontSizeRawFromData(runtimeData) : "";
      const defaultFontRaw = runtimeData ? _extractPdfNumberFontSizeRawFromDefaults(runtimeData) : "";
      toolbar._defaultNrFontRaw = toolbar._defaultNrFontRaw || defaultFontRaw || null;
      const ptFromLayout = _parsePtFromRaw(fontRaw);
      const pt = ptFromLayout != null ? ptFromLayout : _readNumberFontPt(root);
      toolbar._nrFontPt = pt != null ? pt : 10;
      toolbar._nrFontPt = _applyNumberFontPt(root, toolbar._nrFontPt);
    }
    if (toolbar._defaultNrWidthRaw == null) {
      const defaultWidthRaw = runtimeData ? _extractPdfNumberWidthRawFromDefaults(runtimeData) : "";
      toolbar._defaultNrWidthRaw = defaultWidthRaw || null;
    }

    toolbar._value.textContent = `Breite ${Math.round(Number(toolbar._nrWidthMm || 23))} mm`;
    toolbar._insetValue.textContent = `Innen ${_formatMm(toolbar._nrInsetMm)} mm`;
    if (toolbar._fontValue) toolbar._fontValue.textContent = `Schrift ${_formatMm(toolbar._nrFontPt)} pt`;

    toolbar._minus.onclick = () => {
      const current = toolbar._nrWidthMm == null ? _readNumberWidthMm(root) : toolbar._nrWidthMm;
      toolbar._nrWidthMm = _applyNumberWidthMm(root, current - 1);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    toolbar._plus.onclick = () => {
      const current = toolbar._nrWidthMm == null ? _readNumberWidthMm(root) : toolbar._nrWidthMm;
      toolbar._nrWidthMm = _applyNumberWidthMm(root, current + 1);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    toolbar._insetMinus.onclick = () => {
      const current = toolbar._nrInsetMm == null ? 1 : toolbar._nrInsetMm;
      toolbar._nrInsetMm = _applyNumberInsetMm(root, current - 0.5);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    toolbar._insetPlus.onclick = () => {
      const current = toolbar._nrInsetMm == null ? 1 : toolbar._nrInsetMm;
      toolbar._nrInsetMm = _applyNumberInsetMm(root, current + 0.5);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    if (toolbar._fontMinus) {
      toolbar._fontMinus.onclick = () => {
        const current = toolbar._nrFontPt == null ? (_readNumberFontPt(root) || 10) : toolbar._nrFontPt;
        toolbar._nrFontPt = _applyNumberFontPt(root, current - 0.5);
        _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
      };
    }
    if (toolbar._fontPlus) {
      toolbar._fontPlus.onclick = () => {
        const current = toolbar._nrFontPt == null ? (_readNumberFontPt(root) || 10) : toolbar._nrFontPt;
        toolbar._nrFontPt = _applyNumberFontPt(root, current + 0.5);
        _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
      };
    }

    toolbar._save.onclick = async () => {
      toolbar._status.textContent = "";
      try {
        if (root?.dataset?.devPdfLayout !== "true") return;
        if (typeof window?.bbmPrint?.tableLayoutsSave !== "function") {
          toolbar._status.textContent = "Speichern nicht verfuegbar.";
          return;
        }
        // DEV-only persistence for the TOP PDF pilot:
        // Important: for protokoll_tops, PDF widths are reconstructed from columns[].pdfWidth during sanitization.
        // Therefore, saving a PDF width override must also update the corresponding columns[] entry.
        const widthMm = toolbar._nrWidthMm == null ? _readNumberWidthMm(root) : toolbar._nrWidthMm;
        const insetMm = toolbar._nrInsetMm == null ? (_readNumberInsetMm(root) || 1) : toolbar._nrInsetMm;
        const fontPt = toolbar._nrFontPt == null ? (_readNumberFontPt(root) || 10) : toolbar._nrFontPt;

        const resLayout = await window.bbmPrint.tableLayoutsGetOne({
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          orientation: toolbar._orientation || "portrait",
        });
        const effective = resLayout?.data?.effectiveLayout || resLayout?.data?.defaultLayout || {};
        const extracted = extractProtokollTopsEditorValues(effective || {});

        const nextPdfNumberWidth = `${Math.round(Number(widthMm || 23))}mm`;
        const nextPdfNumberInset = `${_formatMm(insetMm)}mm`;
        const nextPdfNumberFontSize = `${_formatMm(fontPt)}pt`;

        const nextColumns = Array.isArray(extracted?.columns)
          ? extracted.columns.map((col) => ({ ...(col || {}) }))
          : [];
        for (let i = 0; i < nextColumns.length; i += 1) {
          const col = nextColumns[i] || {};
          if (String(col.key || "").trim().toLowerCase() !== "topnumber") continue;
          nextColumns[i] = {
            ...col,
            pdfWidth: nextPdfNumberWidth,
          };
          break;
        }

        const next = buildProtokollTopsLayoutOverlay(
          {
            ...extracted,
            columns: nextColumns.length ? nextColumns : extracted?.columns,
            pdfNumberWidth: nextPdfNumberWidth,
            pdfNumberInset: nextPdfNumberInset,
            pdfNumberFontSize: nextPdfNumberFontSize,
          },
          extracted?.orientation || toolbar._orientation || "portrait"
        );

        const res = await window.bbmPrint.tableLayoutsSave({
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          orientation: toolbar._orientation || "portrait",
          layout: next,
        });
        if (!res?.ok) {
          toolbar._status.textContent = res?.error || "Speichern fehlgeschlagen.";
          return;
        }
        toolbar._status.style.color = "#25624f";
        toolbar._status.textContent = "Gespeichert.";
      } catch (err) {
        toolbar._status.textContent = err?.message || String(err) || "Speichern fehlgeschlagen.";
      }
    };

    toolbar._reset.onclick = async () => {
      toolbar._status.textContent = "";
      try {
        if (root?.dataset?.devPdfLayout !== "true") return;
        if (typeof window?.bbmPrint?.tableLayoutsReset !== "function") {
          toolbar._status.textContent = "Reset nicht verfuegbar.";
          return;
        }
        // DEV-only reset for the TOP PDF pilot: resets the stored override for the same tableLayouts identity.
        const res = await window.bbmPrint.tableLayoutsReset({
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          orientation: toolbar._orientation || "portrait",
        });
        if (!res?.ok) {
          toolbar._status.textContent = res?.error || "Reset fehlgeschlagen.";
          return;
        }
        toolbar._status.style.color = "#25624f";
        toolbar._status.textContent = "Zurueckgesetzt.";

        const widthFromDefault = _parseMetaWidthMmFromRaw(toolbar._defaultNrWidthRaw);
        toolbar._nrWidthMm = widthFromDefault != null ? widthFromDefault : 23;
        toolbar._nrWidthMm = _applyNumberWidthMm(root, toolbar._nrWidthMm);

        const insetFromDefault = _parseMetaInsetMmFromRaw(toolbar._defaultNrInsetRaw);
        toolbar._nrInsetMm = insetFromDefault != null ? insetFromDefault : 1;
        toolbar._nrInsetMm = _applyNumberInsetMm(root, toolbar._nrInsetMm);

        const fontFromDefault = _parsePtFromRaw(toolbar._defaultNrFontRaw);
        toolbar._nrFontPt = fontFromDefault != null ? fontFromDefault : 10;
        toolbar._nrFontPt = _applyNumberFontPt(root, toolbar._nrFontPt);

        _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
      } catch (err) {
        toolbar._status.textContent = err?.message || String(err) || "Reset fehlgeschlagen.";
      }
    };

    return;
  }

  if (isText) {
    toolbar._value.textContent = "Breite Restbereich";
    toolbar._save.disabled = false;
    toolbar._reset.disabled = false;

    if (toolbar._txtInsetMm == null) {
      const leftRaw = runtimeData ? _extractPdfTextPaddingLeftRawFromData(runtimeData) : "";
      const rightRaw = runtimeData ? _extractPdfTextPaddingRightRawFromData(runtimeData) : "";
      const defaultLeftRaw = runtimeData ? _extractPdfTextPaddingLeftRawFromDefaults(runtimeData) : "";
      const defaultRightRaw = runtimeData ? _extractPdfTextPaddingRightRawFromDefaults(runtimeData) : "";
      toolbar._defaultTxtPadLeftRaw = toolbar._defaultTxtPadLeftRaw || defaultLeftRaw || null;
      toolbar._defaultTxtPadRightRaw = toolbar._defaultTxtPadRightRaw || defaultRightRaw || null;

      // UI control is a single value; we apply symmetrically. Read left as source of truth.
      const leftMmFromLayout = _parseMetaInsetMmFromRaw(leftRaw);
      const rightMmFromLayout = _parseMetaInsetMmFromRaw(rightRaw);
      const insetFromLayout = leftMmFromLayout != null ? leftMmFromLayout : rightMmFromLayout;
      const inset = insetFromLayout != null ? insetFromLayout : _readTextInsetMm(root);
      toolbar._txtInsetMm = inset != null ? inset : 0;
      toolbar._txtInsetMm = _applyTextInsetMm(root, toolbar._txtInsetMm);
    }
    if (toolbar._txtFontPt == null) {
      const fontRaw = runtimeData ? _extractPdfTextFontSizeRawFromData(runtimeData) : "";
      const defaultFontRaw = runtimeData ? _extractPdfTextFontSizeRawFromDefaults(runtimeData) : "";
      toolbar._defaultTxtFontRaw = toolbar._defaultTxtFontRaw || defaultFontRaw || null;
      const ptFromLayout = _parsePtFromRaw(fontRaw);
      const pt = ptFromLayout != null ? ptFromLayout : _readTextFontPt(root);
      toolbar._txtFontPt = pt != null ? pt : 9;
      toolbar._txtFontPt = _applyTextFontPt(root, toolbar._txtFontPt);
    }

    toolbar._insetValue.textContent = `Innen ${_formatMm(toolbar._txtInsetMm)} mm`;
    if (toolbar._fontValue) toolbar._fontValue.textContent = `Schrift ${_formatMm(toolbar._txtFontPt)} pt`;

    toolbar._minus.onclick = null;
    toolbar._plus.onclick = null;
    toolbar._insetMinus.onclick = () => {
      const current = toolbar._txtInsetMm == null ? 0 : toolbar._txtInsetMm;
      toolbar._txtInsetMm = _applyTextInsetMm(root, current - 0.5);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    toolbar._insetPlus.onclick = () => {
      const current = toolbar._txtInsetMm == null ? 0 : toolbar._txtInsetMm;
      toolbar._txtInsetMm = _applyTextInsetMm(root, current + 0.5);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
    if (toolbar._fontMinus) {
      toolbar._fontMinus.onclick = () => {
        const current = toolbar._txtFontPt == null ? (_readTextFontPt(root) || 9) : toolbar._txtFontPt;
        toolbar._txtFontPt = _applyTextFontPt(root, current - 0.5);
        _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
      };
    }
    if (toolbar._fontPlus) {
      toolbar._fontPlus.onclick = () => {
        const current = toolbar._txtFontPt == null ? (_readTextFontPt(root) || 9) : toolbar._txtFontPt;
        toolbar._txtFontPt = _applyTextFontPt(root, current + 0.5);
        _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
      };
    }

    toolbar._save.onclick = async () => {
      toolbar._status.textContent = "";
      try {
        if (root?.dataset?.devPdfLayout !== "true") return;
        if (typeof window?.bbmPrint?.tableLayoutsSave !== "function") {
          toolbar._status.textContent = "Speichern nicht verfuegbar.";
          return;
        }
        const insetMm = toolbar._txtInsetMm == null ? (_readTextInsetMm(root) || 0) : toolbar._txtInsetMm;
        const fontPt = toolbar._txtFontPt == null ? (_readTextFontPt(root) || 9) : toolbar._txtFontPt;

        const resLayout = await window.bbmPrint.tableLayoutsGetOne({
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          orientation: toolbar._orientation || "portrait",
        });
        const effective = resLayout?.data?.effectiveLayout || resLayout?.data?.defaultLayout || {};
        const extracted = extractProtokollTopsEditorValues(effective || {});

        const nextPdfTextPaddingLeft = `${_formatMm(insetMm)}mm`;
        const nextPdfTextPaddingRight = `${_formatMm(insetMm)}mm`;
        const nextPdfTextFontSize = `${_formatMm(fontPt)}pt`;

        const next = buildProtokollTopsLayoutOverlay(
          {
            ...extracted,
            pdfTextPaddingLeft: nextPdfTextPaddingLeft,
            pdfTextPaddingRight: nextPdfTextPaddingRight,
            pdfTextFontSize: nextPdfTextFontSize,
          },
          extracted?.orientation || toolbar._orientation || "portrait"
        );

        const res = await window.bbmPrint.tableLayoutsSave({
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          orientation: toolbar._orientation || "portrait",
          layout: next,
        });
        if (!res?.ok) {
          toolbar._status.textContent = res?.error || "Speichern fehlgeschlagen.";
          return;
        }
        toolbar._status.style.color = "#25624f";
        toolbar._status.textContent = "Gespeichert.";
      } catch (err) {
        toolbar._status.textContent = err?.message || String(err) || "Speichern fehlgeschlagen.";
      }
    };

    toolbar._reset.onclick = async () => {
      toolbar._status.textContent = "";
      try {
        if (root?.dataset?.devPdfLayout !== "true") return;
        if (typeof window?.bbmPrint?.tableLayoutsReset !== "function") {
          toolbar._status.textContent = "Reset nicht verfuegbar.";
          return;
        }
        const res = await window.bbmPrint.tableLayoutsReset({
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          orientation: toolbar._orientation || "portrait",
        });
        if (!res?.ok) {
          toolbar._status.textContent = res?.error || "Reset fehlgeschlagen.";
          return;
        }
        toolbar._status.style.color = "#25624f";
        toolbar._status.textContent = "Zurueckgesetzt.";

        const leftFromDefault = _parseMetaInsetMmFromRaw(toolbar._defaultTxtPadLeftRaw);
        const rightFromDefault = _parseMetaInsetMmFromRaw(toolbar._defaultTxtPadRightRaw);
        const leftMm = leftFromDefault != null ? leftFromDefault : 0;
        const rightMm = rightFromDefault != null ? rightFromDefault : 1.5;
        _applyTextPaddingMm(root, leftMm, rightMm);
        toolbar._txtInsetMm = leftMm;

        const fontFromDefault = _parsePtFromRaw(toolbar._defaultTxtFontRaw);
        toolbar._txtFontPt = fontFromDefault != null ? fontFromDefault : 9;
        toolbar._txtFontPt = _applyTextFontPt(root, toolbar._txtFontPt);

        _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
      } catch (err) {
        toolbar._status.textContent = err?.message || String(err) || "Reset fehlgeschlagen.";
      }
    };

    return;
  }

  if (toolbar._metaWidthMm == null) {
    const effectiveRaw = runtimeData ? _extractPdfMetaWidthRawFromData(runtimeData) : "";
    const defaultRaw = runtimeData ? _extractPdfMetaWidthRawFromDefaults(runtimeData) : "";
    toolbar._defaultMetaWidthRaw = toolbar._defaultMetaWidthRaw || defaultRaw || null;
    const mmFromLayout = _parseMetaWidthMmFromRaw(effectiveRaw);
    toolbar._metaWidthMm = mmFromLayout != null ? mmFromLayout : _readMetaWidthMm(root);
  }
  if (toolbar._metaInsetMm == null) {
    const insetRaw = runtimeData ? _extractPdfMetaInsetRawFromData(runtimeData) : "";
    const defaultInsetRaw = runtimeData ? _extractPdfMetaInsetRawFromDefaults(runtimeData) : "";
    toolbar._defaultMetaInsetRaw = toolbar._defaultMetaInsetRaw || defaultInsetRaw || null;
    const mmFromLayout = _parseMetaInsetMmFromRaw(insetRaw);
    toolbar._metaInsetMm = mmFromLayout != null ? mmFromLayout : 5;
    toolbar._metaInsetMm = _applyMetaInsetMm(root, toolbar._metaInsetMm);
  }
  if (toolbar._metaFontPx == null) {
    const fontRaw = runtimeData ? _extractPdfMetaFontSizeRawFromData(runtimeData) : "";
    const defaultFontRaw = runtimeData ? _extractPdfMetaFontSizeRawFromDefaults(runtimeData) : "";
    toolbar._defaultMetaFontSizeRaw = toolbar._defaultMetaFontSizeRaw || defaultFontRaw || null;
    const pxFromLayout = _parseFontPxFromRaw(fontRaw);
    toolbar._metaFontPx = pxFromLayout != null ? pxFromLayout : (_readMetaFontPx(root) || 9);
    toolbar._metaFontPx = _applyMetaFontPx(root, toolbar._metaFontPx);
  }
  const display = Math.round(Number(toolbar._metaWidthMm || 15));
  toolbar._value.textContent = `Breite ${display} mm`;
  toolbar._insetValue.textContent = `Innen ${_formatMm(toolbar._metaInsetMm)} mm`;
  if (toolbar._fontValue) toolbar._fontValue.textContent = `Schrift ${Math.round(Number(toolbar._metaFontPx || 9))} px`;

  toolbar._minus.onclick = () => {
    const current = toolbar._metaWidthMm == null ? _readMetaWidthMm(root) : toolbar._metaWidthMm;
    toolbar._metaWidthMm = _applyMetaWidthMm(root, current - 1);
    _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
  };
  toolbar._plus.onclick = () => {
    const current = toolbar._metaWidthMm == null ? _readMetaWidthMm(root) : toolbar._metaWidthMm;
    toolbar._metaWidthMm = _applyMetaWidthMm(root, current + 1);
    _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
  };

  toolbar._insetMinus.onclick = () => {
    const current = toolbar._metaInsetMm == null ? 5 : toolbar._metaInsetMm;
    toolbar._metaInsetMm = _applyMetaInsetMm(root, current - 1);
    _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
  };
  toolbar._insetPlus.onclick = () => {
    const current = toolbar._metaInsetMm == null ? 5 : toolbar._metaInsetMm;
    toolbar._metaInsetMm = _applyMetaInsetMm(root, current + 1);
    _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
  };

  if (toolbar._fontMinus) {
    toolbar._fontMinus.onclick = () => {
      const current = toolbar._metaFontPx == null ? (_readMetaFontPx(root) || 9) : toolbar._metaFontPx;
      toolbar._metaFontPx = _applyMetaFontPx(root, current - 1);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
  }
  if (toolbar._fontPlus) {
    toolbar._fontPlus.onclick = () => {
      const current = toolbar._metaFontPx == null ? (_readMetaFontPx(root) || 9) : toolbar._metaFontPx;
      toolbar._metaFontPx = _applyMetaFontPx(root, current + 1);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    };
  }

  toolbar._save.onclick = async () => {
    toolbar._status.textContent = "";
    try {
      if (root?.dataset?.devPdfLayout !== "true") return;
      if (typeof window?.bbmPrint?.tableLayoutsSave !== "function") {
        toolbar._status.textContent = "Speichern nicht verfuegbar.";
        return;
      }
      const widthMm = toolbar._metaWidthMm == null ? _readMetaWidthMm(root) : toolbar._metaWidthMm;
      const resLayout = await window.bbmPrint.tableLayoutsGetOne({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: toolbar._orientation || "portrait",
      });
      const effective = resLayout?.data?.effectiveLayout || resLayout?.data?.defaultLayout || {};
      const extracted = extractProtokollTopsEditorValues(effective || {});
      const nextPdfMetaWidth = `${Math.round(Number(widthMm || 15))}mm`;
      const insetMm = toolbar._metaInsetMm == null ? 5 : toolbar._metaInsetMm;
      const nextPdfMetaInset = `${_formatMm(insetMm)}mm`;
      const fontPx = toolbar._metaFontPx == null ? (_readMetaFontPx(root) || 9) : toolbar._metaFontPx;
      const nextPdfMetaFontSize = `${Math.round(Number(fontPx) || 9)}px`;

      const nextColumns = Array.isArray(extracted?.columns)
        ? extracted.columns.map((col) => ({ ...(col || {}) }))
        : [];
      for (let i = 0; i < nextColumns.length; i += 1) {
        const col = nextColumns[i] || {};
        if (String(col.key || "").trim().toLowerCase() !== "meta") continue;
        nextColumns[i] = {
          ...col,
          pdfWidth: nextPdfMetaWidth,
        };
        break;
      }
      const next = buildProtokollTopsLayoutOverlay(
        {
          ...extracted,
          columns: nextColumns.length ? nextColumns : extracted?.columns,
          pdfMetaWidth: nextPdfMetaWidth,
          pdfMetaInset: nextPdfMetaInset,
          pdfMetaFontSize: nextPdfMetaFontSize,
        },
        extracted?.orientation || toolbar._orientation || "portrait"
      );
      const res = await window.bbmPrint.tableLayoutsSave({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: toolbar._orientation || "portrait",
        layout: next,
      });
      if (!res?.ok) {
        toolbar._status.textContent = res?.error || "Speichern fehlgeschlagen.";
        return;
      }
      toolbar._status.style.color = "#25624f";
      toolbar._status.textContent = "Gespeichert.";
    } catch (err) {
      toolbar._status.textContent = err?.message || String(err) || "Speichern fehlgeschlagen.";
    }
  };

  toolbar._reset.onclick = async () => {
    toolbar._status.textContent = "";
    try {
      if (root?.dataset?.devPdfLayout !== "true") return;
      if (typeof window?.bbmPrint?.tableLayoutsReset !== "function") {
        toolbar._status.textContent = "Reset nicht verfuegbar.";
        return;
      }
      const res = await window.bbmPrint.tableLayoutsReset({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: toolbar._orientation || "portrait",
      });
      if (!res?.ok) {
        toolbar._status.textContent = res?.error || "Reset fehlgeschlagen.";
        return;
      }
      toolbar._status.style.color = "#25624f";
      toolbar._status.textContent = "Zurueckgesetzt.";
      // Apply standard values again (no reload, just restore visually).
      // Note: the saved override could have been the only value we saw in effectiveLayout,
      // so defaults must come from defaultLayout.
      const mmFromDefault = _parseMetaWidthMmFromRaw(toolbar._defaultMetaWidthRaw);
      toolbar._metaWidthMm = mmFromDefault != null ? mmFromDefault : 15;
      toolbar._metaWidthMm = _applyMetaWidthMm(root, toolbar._metaWidthMm);
      const insetFromDefault = _parseMetaInsetMmFromRaw(toolbar._defaultMetaInsetRaw);
      toolbar._metaInsetMm = insetFromDefault != null ? insetFromDefault : 5;
      toolbar._metaInsetMm = _applyMetaInsetMm(root, toolbar._metaInsetMm);
      const fontFromDefault = _parseFontPxFromRaw(toolbar._defaultMetaFontSizeRaw);
      toolbar._metaFontPx = fontFromDefault != null ? fontFromDefault : (_readMetaFontPx(root) || 9);
      toolbar._metaFontPx = _applyMetaFontPx(root, toolbar._metaFontPx);
      _syncDevPdfLayoutToolbar(toolbar, root, runtimeData);
    } catch (err) {
      toolbar._status.textContent = err?.message || String(err) || "Reset fehlgeschlagen.";
    }
  };
}

window.bbmPrint.onInit((payload) => {
  handleInit(payload);
});
