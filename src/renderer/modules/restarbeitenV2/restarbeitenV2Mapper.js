const ALLOWED_STATUS_VALUES = new Set(["offen", "erledigt"]);

function normalizeStatus(value) {
  const normalized = String(value || "").toLowerCase();
  return ALLOWED_STATUS_VALUES.has(normalized) ? normalized : "offen";
}

function normalizeText(value) {
  return String(value ?? "");
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.slice();
  if (value == null) return [];
  return [value];
}

export function normalizeRestarbeitV2Dto(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    id: normalizeText(source.id),
    nummer: normalizeText(source.nummer),
    kurztext: normalizeText(source.kurztext),
    langtext: normalizeText(source.langtext),
    verortung: normalizeText(source.verortung),
    status: normalizeStatus(source.status),
    meta: normalizeText(source.meta),
    notiz: normalizeText(source.notiz),
    fotos: normalizeArray(source.fotos),
    responsibleFirmId: source.responsibleFirmId == null ? null : normalizeText(source.responsibleFirmId),
    responsibleFirmName: normalizeText(source.responsibleFirmName),
    dueDate: source.dueDate == null ? null : normalizeText(source.dueDate),
    createdAt: source.createdAt == null ? null : normalizeText(source.createdAt),
    updatedAt: source.updatedAt == null ? null : normalizeText(source.updatedAt),
    completedAt: source.completedAt == null ? null : normalizeText(source.completedAt),
  };
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
  if ("kurztext" in source) patch.kurztext = normalizeText(source.kurztext);
  if ("langtext" in source) patch.langtext = normalizeText(source.langtext);
  if ("verortung" in source) patch.verortung = normalizeText(source.verortung);
  if ("status" in source) patch.status = normalizeStatus(source.status);
  if ("meta" in source) patch.meta = normalizeText(source.meta);
  if ("notiz" in source) patch.notiz = normalizeText(source.notiz);
  return patch;
}
