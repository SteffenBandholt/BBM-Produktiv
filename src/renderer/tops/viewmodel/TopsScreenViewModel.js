import { getSelectedTop } from "../state/TopsSelectors.js";
import {
  isAllowedMoveTarget,
  canCreateChildFromState,
  canDeleteFromState,
  canMoveFromState,
} from "../domain/TopsActionPolicy.js";
import { computeAmpelColorForTop } from "../../../shared/ampel/pdfAmpelRule.js";

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

export function buildListItemsFromState(state) {
  const tops = Array.isArray(state?.tops) ? state.tops : [];
  const selectedId = state?.selectedTopId;
  const selectedTop = getSelectedTop(state);
  const movingTop = state?.isMoveMode ? selectedTop : null;
  const rows = [];

  for (const top of tops) {
    const visual = getTopVisualState(top);
    const due = (top?.due_date || top?.dueDate || "").toString().trim();
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
    if (due) meta.push(due);
    if (status) meta.push(status);
    if (responsible) meta.push(responsible);

    let isMoveTarget = null;
    if (state?.isMoveMode && movingTop) {
      isMoveTarget = isAllowedMoveTarget(top, movingTop);
    }

    rows.push({
      id: top?.id,
      level: Number(top?.level) || 1,
      title: String(top?.title || ""),
      number: `${top?.displayNumber ?? top?.number ?? ""}.`,
      preview: String(top?.longtext || ""),
      meta,
      isSelected: String(top?.id) === String(selectedId ?? ""),
      isMoveMode: !!state?.isMoveMode,
      isMoveTarget,
      visualState: visual.visualState,
      showStar: visual.showStar,
      showChangedMarker: visual.showChangedMarker,
      changedMarkerText: visual.changedMarkerText,
      titleTone: visual.titleTone,
      ampelColor,
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
    title: String(top.title || ""),
    longtext: String(top.longtext || ""),
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

  const title = String(draft.title || "");
  if (title !== String(selectedTop.title || "")) patch.title = title;

  const longtext = String(draft.longtext || "");
  if (longtext !== String(selectedTop.longtext || "")) patch.longtext = longtext;

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

export function shouldShowWorkbench(state) {
  const hasMeeting = !!state?.meetingId;
  if (!hasMeeting) return false;
  return !state?.isReadOnly;
}
