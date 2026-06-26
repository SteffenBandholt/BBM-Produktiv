import {
  calculateRestarbeitAmpel,
  getMissingRestarbeitRequiredFields,
  getRestarbeitNachpflegeLabel,
  getRestarbeitRequiredFieldSummary,
  getRestarbeitStatusLabel,
  isRestarbeitFachlichVollstaendig,
} from "../domain/restarbeitenRules.js";

function toText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function mapItemClassToken(value) {
  const raw = toText(value).toLowerCase();
  if (raw === "mangel") return "M";
  return "R";
}

function mapItemClassLabel(value) {
  const raw = toText(value).toLowerCase();
  if (raw === "mangel") return "Mangel";
  return "Restarbeit";
}

export function mapRestarbeitenStatusLabel(value) {
  return getRestarbeitStatusLabel(value);
}

function joinLocation(parts = []) {
  const cleaned = parts.map((part) => toText(part)).filter(Boolean);
  return cleaned.length ? cleaned.join(" \u00b7 ") : "Ort/Bereich fehlt";
}

function formatDateDisplay(value, fallback = "\u2014") {
  const text = toText(value);
  if (!text) return fallback;
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return text;
  const [, year, month, day] = match;
  return `${day}.${month}.${year.slice(-2)}`;
}

export function getRestarbeitenAmpelState(row = {}, today = new Date()) {
  return calculateRestarbeitAmpel(row, today);
}

export function toRestarbeitenListItem(row = {}, today = new Date()) {
  const itemClassToken = mapItemClassToken(row.item_class);
  const itemClassLabel = mapItemClassLabel(row.item_class);
  const statusLabel = mapRestarbeitenStatusLabel(row.status);
  const dueDateLabel = formatDateDisplay(row.due_date, "Fertig bis fehlt");
  const responsibleLabel = toText(row.responsible_label, "Verantwortlich fehlt");
  const ampelState = getRestarbeitenAmpelState(row, today);
  const locationLine = joinLocation([
    row.location_level_1,
    row.location_level_2,
    row.location_level_3,
    row.location_level_4,
  ]);
  const shortTextLine = toText(row.short_text, "\u2014");
  const longTextLine = toText(row.long_text, "\u2014");
  const missingRequiredFields = getMissingRestarbeitRequiredFields(row);
  const requiredFieldSummary = getRestarbeitRequiredFieldSummary(row);
  const nachpflegeLabel = getRestarbeitNachpflegeLabel(row);
  const isFachlichVollstaendig = isRestarbeitFachlichVollstaendig(row);

  return {
    id: toText(row.id, ""),
    itemClassToken,
    itemClassLabel,
    statusLabel,
    dueDateLabel,
    responsibleLabel,
    ampelState,
    numberLine: toText(row.running_number) || "\u2014",
    dateLine: formatDateDisplay(row.created_at, "\u2014"),
    locationLine,
    locationLine1: joinLocation([row.location_level_1, row.location_level_2]),
    locationLine2: joinLocation([row.location_level_3, row.location_level_4]),
    locationLevel1: toText(row.location_level_1, ""),
    locationLevel2: toText(row.location_level_2, ""),
    locationLevel3: toText(row.location_level_3, ""),
    locationLevel4: toText(row.location_level_4, ""),
    shortTextLine,
    longTextLine,
    missingRequiredFields,
    requiredFieldSummary,
    nachpflegeLabel,
    isFachlichVollstaendig,
    workLine1: shortTextLine,
    workLine2: longTextLine,
  };
}

export function toRestarbeitenListItems(rows = [], today = new Date()) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => toRestarbeitenListItem(row, today));
}
