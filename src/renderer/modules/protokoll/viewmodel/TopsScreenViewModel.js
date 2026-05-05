import { getSelectedTop } from "../TopsSelectors.js";
import {
  isAllowedMoveTarget,
  canCreateChildFromState,
  canDeleteFromState,
  canMoveFromState,
} from "../TopsActionPolicy.js";
import {
  normalizeTopLongText,
  normalizeTopShortText,
} from "../topTextPresentation.js";
import { computeAmpelColorForTop } from "../computeAmpelColorForTop.js";
import { normalizeTopFilterMode, topMatchesFilter } from "../topFilterMode.js";

export { isAllowedMoveTarget, canCreateChildFromState, canDeleteFromState, canMoveFromState };

function cleanString(value) {
  return String(value ?? "").trim();
}

function normalizeMeetingNumber(rawValue) {
  const raw = cleanString(rawValue).replace(/^#\s*/, "");
  if (!raw) return "";
  if (/^\d+(?:\.0+)?$/.test(raw)) {
    return `#${Math.trunc(Number(raw))}`;
  }
  return `#${raw}`;
}

function formatDateToDdMmYyyy(rawValue) {
  const raw = cleanString(rawValue);
  if (!raw) return "";
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) return raw;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

function toIdKey(value) {
  return String(value ?? "").trim();
}

function toIdSet(value) {
  if (value instanceof Set) {
    return new Set(Array.from(value, (entry) => toIdKey(entry)).filter(Boolean));
  }

  if (Array.isArray(value)) {
    return new Set(value.map((entry) => toIdKey(entry)).filter(Boolean));
  }

  return new Set();
}

export function buildTopHierarchyIndex(tops = []) {
  const rows = Array.isArray(tops) ? tops : [];
  const index = new Map();
  let currentLevel1Id = null;

  for (const top of rows) {
    const topId = toIdKey(top?.id);
    if (!topId) continue;

    const level = Number(top?.level) || 1;
    const isLevel1 = level <= 1;
    if (isLevel1) {
      currentLevel1Id = topId;
    }

    index.set(topId, {
      id: topId,
      level,
      isLevel1,
      level1TopId: isLevel1 ? topId : currentLevel1Id,
    });
  }

  return index;
}

export function resolveVisibleSelectionForCollapsedFamilies(state = {}, collapsedLevel1Ids = null) {
  const selectedId = toIdKey(state?.selectedTopId);
  if (!selectedId) return null;

  const collapsed = toIdSet(collapsedLevel1Ids ?? state?.collapsedLevel1Ids);
  if (!collapsed.size) return null;

  const hierarchy = buildTopHierarchyIndex(state?.tops || []);
  const selectedInfo = hierarchy.get(selectedId) || null;
  if (!selectedInfo || selectedInfo.isLevel1) return null;

  const familyId = toIdKey(selectedInfo.level1TopId);
  if (!familyId || !collapsed.has(familyId)) return null;

  return familyId;
}

function parseMeetingTitle(titleValue) {
  const title = cleanString(titleValue);
  if (!title) return { meetingNo: "", meetingDate: "", keyword: "" };

  const noWithHash = title.match(/^#\s*(\d+)\b/);
  const noBeforeDate = title.match(/^(\d+)\s+(?=\d{2}\.\d{2}\.\d{4}\b)/);
  const meetingNo = noWithHash ? `#${noWithHash[1]}` : noBeforeDate ? `#${noBeforeDate[1]}` : "";

  const withoutNo = title
    .replace(/^#\s*\d+\s*-?\s*/, "")
    .replace(/^\d+\s+(?=\d{2}\.\d{2}\.\d{4}\b)/, "")
    .trim();

  const dateMatch = withoutNo.match(/(\d{2}\.\d{2}\.\d{4})/);
  const meetingDate = dateMatch ? dateMatch[1] : "";

  let keyword = "";
  if (dateMatch) {
    const after = withoutNo.slice(withoutNo.indexOf(dateMatch[1]) + dateMatch[1].length);
    keyword = cleanString(after.replace(/^\s*-\s*/, ""));
  } else {
    keyword = cleanString(withoutNo);
  }

  return {
    meetingNo: cleanString(meetingNo),
    meetingDate: cleanString(meetingDate),
    keyword: cleanString(keyword),
  };
}

export function buildHeaderState(state) {
  const meetingId = state?.meetingId ?? null;
  const meetingMeta = state?.meetingMeta || null;

  const titleParts = parseMeetingTitle(meetingMeta?.title || "");

  const meetingNo = normalizeMeetingNumber(
    meetingMeta?.meeting_number ??
      meetingMeta?.meetingNumber ??
      meetingMeta?.meeting_index ??
      meetingMeta?.meetingIndex ??
      titleParts.meetingNo
  );

  const meetingDate = formatDateToDdMmYyyy(
    meetingMeta?.meeting_date ??
      meetingMeta?.meetingDate ??
      meetingMeta?.date ??
      meetingMeta?.created_at ??
      meetingMeta?.createdAt ??
      titleParts.meetingDate
  );

  let keywordLine = cleanString(
    meetingMeta?.keyword ?? meetingMeta?.meeting_keyword ?? meetingMeta?.meetingKeyword ?? titleParts.keyword
  );

  let titleLine = "kein Protokoll aktiv";
  if (meetingId) {
    const meetingLine = [meetingNo, meetingDate].filter(Boolean).join(" - ");
    titleLine = meetingLine ? `Protokoll ${meetingLine}` : "Protokoll";
  } else {
    keywordLine = "";
  }

  const isReadOnly = Number(meetingMeta?.is_closed) === 1 || !!state?.isReadOnly;

  if (isReadOnly && titleLine && titleLine !== "kein Protokoll aktiv") {
    titleLine = `${titleLine} READ ONLY!`;
  }

  const contextLine = cleanString(
    state?.headerContext ??
      state?.projectLabel ??
      meetingMeta?.context_label ??
      meetingMeta?.contextLabel ??
      meetingMeta?.work_context ??
      meetingMeta?.workContext ??
      ""
  );

  return {
    meetingId,
    meetingNo,
    meetingDate,
    titleLine,
    keywordLine,
    contextLine,
    isReadOnly,
  };
}

export function getTopVisualState(top) {
  const isCarriedOver = Number(top?.is_carried_over ?? top?.isCarriedOver) === 1;
  const isTouched =
    Number(top?.is_touched ?? top?.isTouched ?? top?.frozen_is_touched ?? top?.frozenIsTouched) === 1;

  const visualState = !isCarriedOver ? "new" : isTouched ? "carriedChanged" : "carried";

  return {
    visualState,
    showStar: visualState === "new",
    showChangedMarker: visualState === "carriedChanged",
    changedMarkerText: "Text geändert",
    titleTone: visualState === "new" ? "blue" : "black",
  };
}

export function buildListItemsFromState(state, options = {}) {
  const tops = Array.isArray(state?.tops) ? state.tops : [];
  const selectedId = state?.selectedTopId;
  const selectedTop = getSelectedTop(state);
  const movingTop = state?.isMoveMode ? selectedTop : null;
  const rows = [];
  const filterMode = normalizeTopFilterMode(state?.topFilter);
  const showAmpelInList = state?.showAmpelInList !== false;
  const showLongtextInList = state?.showLongtextInList === true;
  const collapsedLevel1Ids = toIdSet(options?.collapsedLevel1Ids ?? state?.collapsedLevel1Ids);
  const hierarchy = buildTopHierarchyIndex(tops);

  for (const top of tops) {
    if (!topMatchesFilter(top, filterMode)) continue;
    const visual = getTopVisualState(top);
    const level = Number(top?.level) || 1;
    const isTitle = level <= 1;
    const topId = toIdKey(top?.id);
    const hierarchyInfo = hierarchy.get(topId) || {
      id: topId,
      level,
      isLevel1: isTitle,
      level1TopId: isTitle ? topId : null,
    };
    const level1TopId = toIdKey(hierarchyInfo.level1TopId);
    if (!isTitle && level1TopId && collapsedLevel1Ids.has(level1TopId)) continue;
    const due = (top?.due_date || top?.dueDate || "").toString().trim();
    const dueDisplay = formatDateToDdMmYyyy(due);
    const createdAtRaw =
      top?.created_at ?? top?.createdAt ?? top?.top_created_at ?? top?.topCreatedAt ?? "";
    const createdAt = !isTitle ? formatDateToDdMmYyyy(createdAtRaw) : "";
    const status = (top?.status || "").toString().trim();
    const ampelColor =
      computeAmpelColorForTop({
        top: {
          status,
          due_date: due || null,
        },
        childrenColors: [],
        now: new Date(),
      }) || null;
    const responsible = (top?.responsible_label || top?.responsibleLabel || "").toString().trim();
    const meta = [];
    if (dueDisplay) meta.push(dueDisplay);
    else if (due) meta.push(due);
    if (status) meta.push(status);
    if (responsible) meta.push(responsible);

    let isMoveTarget = null;
    let moveState = "normal";
    if (state?.isMoveMode && movingTop) {
      if (String(top?.id ?? "") === String(movingTop?.id ?? "")) {
        moveState = "current";
        isMoveTarget = false;
      } else if (isAllowedMoveTarget(top, movingTop, tops)) {
        moveState = "target";
        isMoveTarget = true;
      } else {
        moveState = "blocked";
        isMoveTarget = false;
      }
    }

    rows.push({
      id: top?.id,
      level,
      isTitle,
      level1TopId: level1TopId || null,
      isLevel1Collapsed: isTitle ? collapsedLevel1Ids.has(topId) : false,
      canToggleLevel1: isTitle && !state?.isMoveMode,
      title: normalizeTopShortText(top?.title),
      number: `${top?.displayNumber ?? top?.number ?? ""}.`,
      preview: showLongtextInList ? normalizeTopLongText(top?.longtext) : "",
      createdAt,
      meta,
      isSelected: String(top?.id) === String(selectedId ?? ""),
      isMoveMode: !!state?.isMoveMode,
      isMoveTarget,
      moveState,
      visualState: visual.visualState,
      showStar: visual.showStar,
      showChangedMarker: visual.showChangedMarker,
      changedMarkerText: visual.changedMarkerText,
      titleTone: visual.titleTone,
      ampelColor: showAmpelInList ? ampelColor : null,
      showAmpelInList,
      showLongtextInList,
      raw: top,
    });
  }

  return rows;
}

export function editorFromTop(top) {
  if (!top) {
    return {
      title: "",
      longtext: "",
      due_date: null,
      status: "-",
      responsible_label: "",
      is_important: 0,
      is_hidden: 0,
      is_task: 0,
      is_decision: 0,
    };
  }

  return {
    title: normalizeTopShortText(top.title),
    longtext: normalizeTopLongText(top.longtext),
    due_date: top.due_date || top.dueDate || null,
    status: String(top.status || "-"),
    responsible_label: String(top.responsible_label || top.responsibleLabel || ""),
    is_important: Number(top.is_important) === 1 ? 1 : 0,
    is_hidden: Number(top.is_hidden) === 1 ? 1 : 0,
    is_task: Number(top.is_task ?? top.isTask) === 1 ? 1 : 0,
    is_decision: Number(top.is_decision) === 1 ? 1 : 0,
  };
}

export function buildPatchFromDraft(selectedTop, draft) {
  if (!selectedTop || !draft) return {};
  const patch = {};

  const title = normalizeTopShortText(draft.title);
  if (title !== normalizeTopShortText(selectedTop.title)) patch.title = title;

  const longtext = normalizeTopLongText(draft.longtext);
  if (longtext !== normalizeTopLongText(selectedTop.longtext)) patch.longtext = longtext;

  const dueDate = (draft.due_date || null) || null;
  const selectedDue = (selectedTop.due_date || selectedTop.dueDate || null) || null;
  if (dueDate !== selectedDue) patch.due_date = dueDate;

  const status = String(draft.status || "-");
  if (status !== String(selectedTop.status || "-")) patch.status = status;

  const responsibleLabel = String(draft.responsible_label || "");
  if (responsibleLabel !== String(selectedTop.responsible_label || selectedTop.responsibleLabel || "")) {
    patch.responsible_label = responsibleLabel;
  }

  for (const k of ["is_important", "is_hidden", "is_task", "is_decision"]) {
    const nextVal = Number(draft[k]) === 1 ? 1 : 0;
    const curVal = Number(selectedTop[k]) === 1 ? 1 : 0;
    if (nextVal !== curVal) patch[k] = nextVal;
  }

  return patch;
}

export function buildWorkbenchState(state) {
  const selectedTop = getSelectedTop(state);
  const isWriting = !!state?.isWriting;

  return {
    hasSelection: !!selectedTop,
    canSave: !!selectedTop,
    canMove: canMoveFromState(state, selectedTop) && !isWriting,
    canDelete: canDeleteFromState(state, selectedTop) && !isWriting,
  };
}

export function shouldShowWorkbench(state) {
  const hasMeeting = !!state?.meetingId;
  if (!hasMeeting) return false;
  return true;
}
