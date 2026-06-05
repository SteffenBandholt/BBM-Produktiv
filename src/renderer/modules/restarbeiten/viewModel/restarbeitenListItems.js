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
  const raw = toText(value).toLowerCase();
  const map = {
    offen: "offen",
    "in arbeit": "in Arbeit",
    in_arbeit: "in Arbeit",
    erledigt: "erledigt",
    verzug: "Verzug",
  };
  return map[raw] || "offen";
}

function joinLocation(parts = []) {
  const cleaned = parts.map((part) => toText(part)).filter(Boolean);
  return cleaned.length ? cleaned.join(" \u00b7 ") : "\u2014";
}

function formatDateDisplay(value, fallback = "\u2014") {
  const text = toText(value);
  if (!text) return fallback;
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return text;
  const [, year, month, day] = match;
  return `${day}.${month}.${year.slice(-2)}`;
}

function parseDateOnly(value) {
  const text = toText(value);
  if (!text) return null;
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ) {
      return parsed;
    }
    return null;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

function toDayStartUtc(dateLike = new Date()) {
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function getRestarbeitenAmpelState(row = {}, today = new Date()) {
  const status = toText(row.status).toLowerCase();
  if (status === "verzug") return "rot";
  if (status === "erledigt") return "gruen";

  const dueDate = parseDateOnly(row.due_date);
  const todayStart = toDayStartUtc(today);
  if (!todayStart) return "neutral";

  if (dueDate && dueDate.getTime() < todayStart.getTime()) return "rot";

  if (status === "offen" || status === "in arbeit" || status === "in_arbeit") {
    return dueDate ? "gruen" : "neutral";
  }

  return "neutral";
}

export function toRestarbeitenListItem(row = {}, today = new Date()) {
  const itemClassToken = mapItemClassToken(row.item_class);
  const itemClassLabel = mapItemClassLabel(row.item_class);
  const statusLabel = mapRestarbeitenStatusLabel(row.status);
  const dueDateLabel = formatDateDisplay(row.due_date, "\u2014");
  const responsibleLabel = toText(row.responsible_label, "\u2014");
  const ampelState = getRestarbeitenAmpelState(row, today);
  const locationLine = joinLocation([
    row.location_level_1,
    row.location_level_2,
    row.location_level_3,
    row.location_level_4,
  ]);
  const shortTextLine = toText(row.short_text, "\u2014");
  const longTextLine = toText(row.long_text, "\u2014");

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
    workLine1: shortTextLine,
    workLine2: longTextLine,
  };
}

export function toRestarbeitenListItems(rows = [], today = new Date()) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => toRestarbeitenListItem(row, today));
}
