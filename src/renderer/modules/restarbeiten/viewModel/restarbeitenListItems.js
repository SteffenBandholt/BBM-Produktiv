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
  return "Rest";
}

export function mapRestarbeitenStatusLabel(value) {
  const raw = toText(value).toLowerCase();
  const map = {
    offen: "offen",
    in_arbeit: "in Arbeit",
    erledigt_gemeldet: "erledigt gemeldet",
    geprueft_erledigt: "geprüft erledigt",
    zurueckgewiesen: "zurückgewiesen",
    verzug: "Verzug",
  };
  return map[raw] || (raw || "offen");
}

function joinSlash(a, b) {
  const left = toText(a);
  const right = toText(b);
  if (left && right) return `${left} / ${right}`;
  return left || right || "";
}


function formatDateDisplay(value, fallback = "—") {
  const text = toText(value);
  if (!text) return fallback;
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return text;
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
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
  if (status === "erledigt_gemeldet" || status === "geprueft_erledigt" || status === "geprüft erledigt") {
    return "gruen";
  }

  const dueDate = parseDateOnly(row.due_date);
  const todayStart = toDayStartUtc(today);
  if (!dueDate || !todayStart) return "neutral";

  const dueTime = dueDate.getTime();
  const todayTime = todayStart.getTime();
  if (dueTime < todayTime) return "rot";

  const tenDaysAhead = new Date(todayStart);
  tenDaysAhead.setUTCDate(tenDaysAhead.getUTCDate() + 10);
  if (dueTime <= tenDaysAhead.getTime()) return "orange";

  return "gruen";
}

export function toRestarbeitenListItem(row = {}, today = new Date()) {
  const itemClassToken = mapItemClassToken(row.item_class);
  const itemClassLabel = mapItemClassLabel(row.item_class);
  const statusLabel = mapRestarbeitenStatusLabel(row.status);
  const dueDateLabel = formatDateDisplay(row.due_date, "—");
  const responsibleLabel = toText(row.responsible_label, "—");
  const ampelState = getRestarbeitenAmpelState(row, today);

  return {
    id: toText(row.id, ""),
    itemClassToken,
    itemClassLabel,
    statusLabel,
    dueDateLabel,
    responsibleLabel,
    ampelState,
    numberLine: toText(row.running_number) || "—",
    dateLine: formatDateDisplay(row.created_at, "—"),
    locationLine1: joinSlash(row.location_level_1, row.location_level_2) || "—",
    locationLine2: joinSlash(row.location_level_3, row.location_level_4) || "—",
    locationLevel1: toText(row.location_level_1, ""),
    locationLevel2: toText(row.location_level_2, ""),
    locationLevel3: toText(row.location_level_3, ""),
    locationLevel4: toText(row.location_level_4, ""),
    workLine1: toText(row.short_text, "—"),
    workLine2: toText(row.long_text, "—"),
  };
}

export function toRestarbeitenListItems(rows = [], today = new Date()) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => toRestarbeitenListItem(row, today));
}
