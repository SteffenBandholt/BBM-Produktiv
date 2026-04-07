function asText(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function normalizeTopText(value) {
  return asText(value).replace(/\r\n?/g, "\n");
}

// Kurztext wird in der Editbox als einzeiliges Feld gefuehrt.
// Deshalb werden vorhandene Zeilenumbrueche konsistent als Leerzeichen dargestellt.
export function normalizeTopShortText(value) {
  return normalizeTopText(value)
    .replace(/\n+/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// Langtext behaelt manuelle Zeilenumbrueche, normalisiert nur Zeilenende.
export function normalizeTopLongText(value) {
  return normalizeTopText(value);
}

