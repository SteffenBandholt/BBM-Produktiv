const ALLOWED_STATUS_VALUES = new Set(["offen", "erledigt"]);
const OPEN_STATUS_ALIASES = new Set(["offen", "open", "todo", "neu"]);
const DONE_STATUS_ALIASES = new Set(["erledigt", "done", "closed", "complete", "completed"]);

function normalizeText(value) {
  return String(value ?? "");
}

function normalizeLegacyText(value) {
  if (value == null) return "";
  return normalizeText(value);
}

function normalizeRestarbeitV2Status(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (OPEN_STATUS_ALIASES.has(normalized)) return "offen";
  if (DONE_STATUS_ALIASES.has(normalized)) return "erledigt";
  return ALLOWED_STATUS_VALUES.has(normalized) ? normalized : "offen";
}

function normalizeRestarbeitV2Fotos(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (entry == null) return "";
      if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean") {
        return String(entry);
      }
      if (typeof entry === "object") {
        return normalizeText(
          entry.file_path ??
            entry.filePath ??
            entry.path ??
            entry.url ??
            entry.src ??
            entry.name ??
            entry.label ??
            ""
        );
      }
      return "";
    })
    .filter((entry) => entry !== "");
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function readFirstPresent(source, keys) {
  for (const key of keys) {
    if (!key) continue;
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] != null) {
      return source[key];
    }
  }
  return undefined;
}

function readStringField(source, keys) {
  const value = readFirstPresent(source, keys);
  return value == null ? "" : normalizeText(value);
}

function readOptionalStringField(source, keys) {
  const value = readFirstPresent(source, keys);
  return value == null ? null : normalizeText(value);
}

function readOptionalDateField(source, keys) {
  const value = readFirstPresent(source, keys);
  return value == null ? null : normalizeText(value);
}

function readFotosField(source) {
  const value = readFirstPresent(source, ["fotos", "attachments", "photos"]);
  return normalizeRestarbeitV2Fotos(value);
}

export function mapLegacyRestarbeitToV2Dto(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    id: readStringField(source, ["id", "restarbeit_id"]),
    nummer: readStringField(source, ["nummer", "number", "lfd_nr"]),
    kurztext: readStringField(source, ["kurztext", "title", "kurz_text", "text"]),
    langtext: readStringField(source, ["langtext", "description", "lang_text"]),
    verortung: readStringField(source, ["verortung", "location", "ort"]),
    status: normalizeRestarbeitV2Status(readFirstPresent(source, ["status", "state"])),
    meta: readStringField(source, ["meta", "completion_note", "note_meta"]),
    notiz: readStringField(source, ["notiz", "note"]),
    fotos: readFotosField(source),
    responsibleFirmId: readOptionalStringField(source, ["responsibleFirmId", "responsible_firm_id"]),
    responsibleFirmName: readStringField(source, ["responsibleFirmName", "responsible_firm_name"]),
    dueDate: readOptionalDateField(source, ["dueDate", "due_date"]),
    createdAt: readOptionalDateField(source, ["createdAt", "created_at"]),
    updatedAt: readOptionalDateField(source, ["updatedAt", "updated_at"]),
    completedAt: readOptionalDateField(source, ["completedAt", "completed_at"]),
  };
}

export function normalizeRestarbeitV2Dto(input) {
  return mapLegacyRestarbeitToV2Dto(input);
}

export function normalizeRestarbeitV2List(input) {
  if (Array.isArray(input)) {
    return input.map((item) => normalizeRestarbeitV2Dto(item));
  }
  if (input && typeof input === "object" && Array.isArray(input.items)) {
    return input.items.map((item) => normalizeRestarbeitV2Dto(item));
  }
  return [];
}

export function createEmptyRestarbeitV2Draft() {
  return {
    kurztext: "",
    langtext: "",
    verortung: "",
    status: "offen",
    meta: "",
    notiz: "",
  };
}

export function normalizeRestarbeitV2Patch(input) {
  const source = input && typeof input === "object" ? input : {};
  const patch = {};
  if ("kurztext" in source) patch.kurztext = normalizeLegacyText(source.kurztext);
  if ("langtext" in source) patch.langtext = normalizeLegacyText(source.langtext);
  if ("verortung" in source) patch.verortung = normalizeLegacyText(source.verortung);
  if ("status" in source) patch.status = normalizeRestarbeitV2Status(source.status);
  if ("meta" in source) patch.meta = normalizeLegacyText(source.meta);
  if ("notiz" in source) patch.notiz = normalizeLegacyText(source.notiz);
  return patch;
}

export {
  normalizeRestarbeitV2Status,
  normalizeRestarbeitV2Fotos,
};
