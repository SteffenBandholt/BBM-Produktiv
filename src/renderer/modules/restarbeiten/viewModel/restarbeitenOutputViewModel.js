import {
  normalizeRestarbeitStatus,
  toRestarbeitenText,
} from "../domain/restarbeitenRules.js";
import {
  getRestarbeitenAmpelState,
  mapRestarbeitenStatusLabel,
  toRestarbeitenListItem,
} from "./restarbeitenListItems.js";

const AMPEL_LABELS = Object.freeze({
  rot: "rot",
  orange: "orange",
  gruen: "gruen",
  neutral: "neutral",
});

const AMPEL_SORT = Object.freeze({
  rot: 0,
  orange: 1,
  gruen: 2,
  neutral: 3,
});

function toDateSortValue(value) {
  const text = toRestarbeitenText(value);
  if (!text) return Number.MAX_SAFE_INTEGER;
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER - 1;
  return Number(`${match[1]}${match[2]}${match[3]}`);
}

function toNumberSortValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.MAX_SAFE_INTEGER;
}

function compareOutputRows(a, b) {
  const aDone = a.statusKey === "erledigt" ? 1 : 0;
  const bDone = b.statusKey === "erledigt" ? 1 : 0;
  if (aDone !== bDone) return aDone - bDone;

  const aAmpel = AMPEL_SORT[a.ampelState] ?? AMPEL_SORT.neutral;
  const bAmpel = AMPEL_SORT[b.ampelState] ?? AMPEL_SORT.neutral;
  if (aAmpel !== bAmpel) return aAmpel - bAmpel;

  const aDate = toDateSortValue(a.rawDueDate);
  const bDate = toDateSortValue(b.rawDueDate);
  if (aDate !== bDate) return aDate - bDate;

  return toNumberSortValue(a.rawNumber) - toNumberSortValue(b.rawNumber);
}

export function toRestarbeitenOutputRow(row = {}, today = new Date()) {
  const listItem = toRestarbeitenListItem(row, today);
  const statusKey = normalizeRestarbeitStatus(row.status);
  const ampelState = getRestarbeitenAmpelState(row, today);
  const missingLabels = listItem.missingRequiredFields.map((field) => field.label);

  return {
    id: listItem.id,
    number: toRestarbeitenText(row.running_number),
    shortText: toRestarbeitenText(row.short_text),
    location: [
      row.location_level_1,
      row.location_level_2,
      row.location_level_3,
      row.location_level_4,
    ].map((part) => toRestarbeitenText(part)).filter(Boolean).join(" · "),
    responsible: toRestarbeitenText(row.responsible_label),
    dueDate: toRestarbeitenText(row.due_date),
    dueDateLabel: toRestarbeitenText(row.due_date) ? listItem.dueDateLabel : "",
    statusKey,
    statusLabel: mapRestarbeitenStatusLabel(row.status),
    ampelState,
    ampelLabel: AMPEL_LABELS[ampelState] || AMPEL_LABELS.neutral,
    isComplete: listItem.isFachlichVollstaendig,
    incompleteHint: missingLabels.length ? `Unvollstaendig: ${missingLabels.join(", ")}` : "",
    missingRequiredFields: missingLabels,
    isDone: statusKey === "erledigt",
    rawDueDate: row.due_date,
    rawNumber: row.running_number,
  };
}

export function toRestarbeitenOutputRows(rows = [], today = new Date()) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => toRestarbeitenOutputRow(row, today))
    .sort(compareOutputRows);
}
