const PRINT_MODE_DEFINITIONS = Object.freeze([
  Object.freeze({
    key: "protocol",
    label: "Protokoll",
    dialogLabel: "Protokoll drucken",
  }),
  Object.freeze({
    key: "preview",
    label: "Protokollvorschau",
    dialogLabel: "PDF-Vorschau öffnen",
  }),
  Object.freeze({
    key: "vorabzug",
    label: "Vorabzug",
    dialogLabel: "Vorabzug",
    hidden: true,
  }),
  Object.freeze({
    key: "firms",
    label: "Firmenliste",
    dialogLabel: "Firmenliste",
  }),
  Object.freeze({
    key: "todo",
    label: "ToDo-Liste",
    dialogLabel: "ToDo-Liste",
  }),
  Object.freeze({
    key: "topsAll",
    label: "TOP-Liste",
    dialogLabel: "TOP-Liste",
  }),
  Object.freeze({
    key: "headerTest",
    label: "Kopf-Test",
    dialogLabel: "Kopf-Test",
    hidden: true,
  }),
]);

const PRINT_DIALOG_ACTIONS = Object.freeze([
  Object.freeze({
    key: "protocol-print",
    label: "Protokoll drucken",
    mode: "protocol",
    method: "printClosedMeetingDirect",
    requiresMeeting: true,
    variant: "primary",
  }),
  Object.freeze({
    key: "protocol-preview",
    label: "PDF-Vorschau öffnen",
    mode: "preview",
    method: "printMeetingPreview",
    requiresMeeting: true,
    variant: "primary",
  }),
  Object.freeze({
    key: "firms-preview",
    label: "Firmenliste",
    mode: "firms",
    method: "openFirmsPrintPreview",
    requiresMeeting: false,
    variant: "secondary",
  }),
  Object.freeze({
    key: "todo-preview",
    label: "ToDo-Liste",
    mode: "todo",
    method: "openTodoPrintPreview",
    requiresMeeting: false,
    variant: "secondary",
  }),
  Object.freeze({
    key: "topsAll-preview",
    label: "TOP-Liste",
    mode: "topsAll",
    method: "openTopListAllPreview",
    requiresMeeting: false,
    variant: "secondary",
  }),
]);

const MODE_BY_KEY = new Map(PRINT_MODE_DEFINITIONS.map((item) => [item.key, item]));
const MODE_ALIASES = Object.freeze({
  topsall: "topsAll",
  headertest: "headerTest",
});

function normalizePrintMode(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const normalized = MODE_ALIASES[raw.toLowerCase()] || raw;
  return MODE_BY_KEY.has(normalized) ? normalized : "";
}

function resolvePrintMode(value, { fallback = "protocol" } = {}) {
  const normalized = normalizePrintMode(value);
  if (normalized) return normalized;
  return String(value || "").trim() ? "" : fallback;
}

function isSupportedPrintMode(value) {
  return !!normalizePrintMode(value);
}

function getPrintModeDefinition(value) {
  const normalized = normalizePrintMode(value);
  return normalized ? MODE_BY_KEY.get(normalized) || null : null;
}

function getPrintDialogActions() {
  return PRINT_DIALOG_ACTIONS.map((item) => ({ ...item }));
}

function getVisiblePrintDialogActions() {
  return PRINT_DIALOG_ACTIONS.map((item) => ({ ...item }));
}

export {
  PRINT_MODE_DEFINITIONS,
  PRINT_DIALOG_ACTIONS,
  normalizePrintMode,
  resolvePrintMode,
  isSupportedPrintMode,
  getPrintModeDefinition,
  getPrintDialogActions,
  getVisiblePrintDialogActions,
};
