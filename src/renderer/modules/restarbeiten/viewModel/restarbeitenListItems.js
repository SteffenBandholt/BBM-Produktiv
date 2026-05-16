function toText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function mapItemClass(value) {
  const raw = toText(value).toLowerCase();
  if (raw === "mangel") return "Mangel";
  return "Rest";
}

function mapStatus(value) {
  const raw = toText(value).toLowerCase();
  const map = {
    offen: "offen",
    in_arbeit: "in Arbeit",
    erledigt_gemeldet: "erledigt gemeldet",
    geprueft_erledigt: "gepr\u00fcft erledigt",
    zurueckgewiesen: "zur\u00fcckgewiesen",
  };
  return map[raw] || (raw || "offen");
}

function joinSlash(a, b) {
  const left = toText(a);
  const right = toText(b);
  if (left && right) return `${left} / ${right}`;
  return left || right || "";
}

export function toRestarbeitenListItem(row = {}) {
  return {
    id: toText(row.id, ""),
    numberLine: toText(row.running_number) ? `#${toText(row.running_number)}` : "—",
    dateLine: toText(row.created_at, "—"),
    locationLine1: joinSlash(row.location_level_1, row.location_level_2) || "—",
    locationLine2: joinSlash(row.location_level_3, row.location_level_4) || "—",
    workLine1: toText(row.short_text, "—"),
    workLine2: toText(row.long_text, "—"),
    statusLine1: `${mapItemClass(row.item_class)} · ${mapStatus(row.status)} · Ampel: —`,
    statusLine2: toText(row.due_date, "—"),
    statusLine3: toText(row.responsible_label, "—"),
  };
}

export function toRestarbeitenListItems(rows = []) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => toRestarbeitenListItem(row));
}
