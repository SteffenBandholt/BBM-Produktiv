import { getSelectedTop } from "../state/TopsSelectors.js";
import {
  isAllowedMoveTarget,
  canCreateChildFromState,
  canDeleteFromState,
  canMoveFromState,
} from "../domain/TopsActionPolicy.js";

export { isAllowedMoveTarget, canCreateChildFromState, canDeleteFromState, canMoveFromState };

export function buildHeaderContext(state, { projectLabel } = {}) {
  const m = state?.meetingMeta || null;
  const parts = [];
  const projectLine = String(projectLabel || "").trim();
  if (projectLine) parts.push(projectLine);

  const meetingNo = String(m?.meeting_number ?? m?.meetingNumber ?? "").trim();
  const meetingDate = String(m?.meeting_date ?? m?.meetingDate ?? "").trim();
  const meetingKeyword = String(m?.keyword || m?.meeting_keyword || "").trim();
  const meetingLine = [meetingNo, meetingDate].filter(Boolean).join(" - ");
  if (meetingLine) parts.push(meetingLine);
  if (meetingKeyword) parts.push(meetingKeyword);

  if (!parts.length) return state?.meetingId ? "Protokoll" : "kein Protokoll aktiv";
  return parts.join(" | ");
}

export function buildListItemsFromState(state) {
  const tops = Array.isArray(state?.tops) ? state.tops : [];
  const selectedId = state?.selectedTopId;
  const selectedTop = getSelectedTop(state);
  const movingTop = state?.isMoveMode ? selectedTop : null;
  const rows = [];

  for (const top of tops) {
    const due = (top?.due_date || top?.dueDate || "").toString().trim();
    const status = (top?.status || "").toString().trim();
    const responsible = (top?.responsible_label || top?.responsibleLabel || "").toString().trim();
    const meta = [];
    if (due) meta.push(`Fertig bis: ${due}`);
    if (status) meta.push(`Status: ${status}`);
    if (responsible) meta.push(`Verantw.: ${responsible}`);

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

  for (const k of ["is_important", "is_hidden", "is_decision"]) {
    const nextVal = Number(draft[k]) === 1 ? 1 : 0;
    const curVal = Number(selectedTop[k]) === 1 ? 1 : 0;
    if (nextVal !== curVal) patch[k] = nextVal;
  }

  return patch;
}

export function shouldShowWorkbench(state) {
  const selectedTop = getSelectedTop(state);
  const hasSelection = !!selectedTop;
  const hasMeeting = !!state?.meetingId;
  if (hasSelection) return true;
  if (!hasMeeting) return false;
  if (state?.isReadOnly) return false;
  return true;
}

export function buildWorkbenchState(state) {
  const selectedTop = getSelectedTop(state);
  return {
    editor: state?.editor || editorFromTop(selectedTop),
    isReadOnly: !!state?.isReadOnly,
    hasSelection: !!selectedTop,
    isMoveMode: !!state?.isMoveMode,
    canSave: !!selectedTop,
    canDelete: canDeleteFromState(state, selectedTop),
    canMove: canMoveFromState(state, selectedTop),
    canCreateChild: canCreateChildFromState(state, selectedTop),
  };
}
