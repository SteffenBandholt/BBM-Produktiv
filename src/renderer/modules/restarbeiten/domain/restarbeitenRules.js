export const RESTARBEITEN_STATUS_VALUES = Object.freeze(["offen", "in_arbeit", "erledigt"]);

export const RESTARBEITEN_STATUS_OPTIONS = Object.freeze([
  { value: "offen", label: "Offen" },
  { value: "in_arbeit", label: "In Arbeit" },
  { value: "erledigt", label: "Erledigt" },
]);

export const RESTARBEITEN_REQUIRED_FIELDS = Object.freeze([
  { field: "short_text", label: "Kurztext" },
  { field: "location", label: "Ort/Bereich" },
  { field: "status", label: "Status" },
  { field: "responsible", label: "Verantwortlich" },
  { field: "due_date", label: "Fertig bis" },
]);

const DAY_MS = 24 * 60 * 60 * 1000;
const WARNING_DAYS = 10;

export function toRestarbeitenText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function normalizeRestarbeitStatus(value, { defaultForNew = false } = {}) {
  const raw = toRestarbeitenText(value).toLowerCase().replace(/\s+/g, "_");
  if (!raw) return defaultForNew ? "offen" : "";
  return RESTARBEITEN_STATUS_VALUES.includes(raw) ? raw : "";
}

export function isValidRestarbeitStatus(value) {
  return Boolean(normalizeRestarbeitStatus(value));
}

export function getRestarbeitStatusLabel(value) {
  const normalized = normalizeRestarbeitStatus(value);
  if (normalized === "offen") return "offen";
  if (normalized === "in_arbeit") return "in Arbeit";
  if (normalized === "erledigt") return "erledigt";
  return "Status ungueltig";
}

export function canCreateRestarbeitDraft(row = {}) {
  return Boolean(toRestarbeitenText(row.short_text));
}

export function getMissingRestarbeitRequiredFields(row = {}) {
  const missing = [];
  if (!toRestarbeitenText(row.short_text)) missing.push(RESTARBEITEN_REQUIRED_FIELDS[0]);

  const hasLocation = [1, 2, 3, 4].some((level) => toRestarbeitenText(row[`location_level_${level}`]));
  if (!hasLocation) missing.push(RESTARBEITEN_REQUIRED_FIELDS[1]);

  if (!isValidRestarbeitStatus(row.status)) missing.push(RESTARBEITEN_REQUIRED_FIELDS[2]);

  if (!toRestarbeitenText(row.responsible_project_firm_id) && !toRestarbeitenText(row.responsible_label)) {
    missing.push(RESTARBEITEN_REQUIRED_FIELDS[3]);
  }

  if (!toRestarbeitenText(row.due_date)) missing.push(RESTARBEITEN_REQUIRED_FIELDS[4]);
  return missing;
}

export function isRestarbeitFachlichVollstaendig(row = {}) {
  return getMissingRestarbeitRequiredFields(row).length === 0;
}

export function getRestarbeitRequiredFieldSummary(row = {}) {
  const labels = getMissingRestarbeitRequiredFields(row).map((field) => field.label);
  return labels.length ? `Unvollstaendig: ${labels.join(", ")}` : "";
}

function parseDateOnly(value) {
  const text = toRestarbeitenText(value);
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

export function calculateRestarbeitAmpel(row = {}, today = new Date()) {
  const status = normalizeRestarbeitStatus(row.status);
  if (status === "erledigt") return "neutral";
  if (!status) return "neutral";

  const dueDate = parseDateOnly(row.due_date);
  const todayStart = toDayStartUtc(today);
  if (!dueDate || !todayStart) return "neutral";

  const diffDays = Math.round((dueDate.getTime() - todayStart.getTime()) / DAY_MS);
  if (diffDays < 0) return "rot";
  if (diffDays <= WARNING_DAYS) return "orange";
  return "gruen";
}
