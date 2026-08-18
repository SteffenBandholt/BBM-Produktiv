import { TOPS_META_STATUS_OPTIONS } from "../../tops/components/TopsMetaPanel.js";

const PRIMARY_FILTER_OPTIONS = Object.freeze([
  Object.freeze({ mode: "all", label: "Alle", badge: "A", group: "primary", contractKey: "all" }),
  Object.freeze({ mode: "important", label: "Wichtig", badge: "!", group: "primary", contractKey: "important" }),
  Object.freeze({ mode: "todo", label: "ToDo", badge: "T", group: "primary", contractKey: "todo" }),
  Object.freeze({ mode: "decision", label: "Beschluss", badge: "B", group: "primary", contractKey: "decision" }),
]);

const STATUS_CONTRACT_KEYS = Object.freeze({
  offen: "open",
  "in arbeit": "inProgress",
  erledigt: "done",
  blockiert: "blocked",
  verzug: "overdue",
});

const STATUS_BADGES = Object.freeze({
  offen: "O",
  "in arbeit": "I",
  erledigt: "E",
  blockiert: "B",
  verzug: "V",
});

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function statusLabel(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

const STATUS_FILTER_OPTIONS = Object.freeze(
  TOPS_META_STATUS_OPTIONS
    .map((option) => normalizeStatus(option?.value))
    .filter((status) => status && status !== "-")
    .map((status) => Object.freeze({
      mode: `status:${status}`,
      label: statusLabel(status),
      badge: STATUS_BADGES[status] || statusLabel(status).charAt(0),
      group: "status",
      contractKey: `status.${STATUS_CONTRACT_KEYS[status] || status.replace(/[^a-z0-9]+/g, "-")}`,
    }))
);

export const TOP_FILTER_OPTIONS = Object.freeze([
  ...PRIMARY_FILTER_OPTIONS,
  ...STATUS_FILTER_OPTIONS,
]);

const FILTER_OPTIONS_BY_MODE = new Map(TOP_FILTER_OPTIONS.map((option) => [option.mode, option]));

export function normalizeTopFilterMode(value) {
  const raw = String(value || "all").trim().toLowerCase();
  if (raw === "important" || raw === "wichtig") return "important";
  if (raw === "todo" || raw === "task") return "todo";
  if (raw === "decision" || raw === "beschluss") return "decision";
  const status = normalizeStatus(raw.startsWith("status:") ? raw.slice(7) : raw);
  const statusMode = `status:${status}`;
  if (FILTER_OPTIONS_BY_MODE.has(statusMode)) return statusMode;
  return "all";
}

export function getTopFilterLabel(value) {
  return FILTER_OPTIONS_BY_MODE.get(normalizeTopFilterMode(value))?.label || "Alle";
}

export function getTopFilterBadge(value) {
  return FILTER_OPTIONS_BY_MODE.get(normalizeTopFilterMode(value))?.badge || "A";
}

export function getTopFilterContractKey(value) {
  return FILTER_OPTIONS_BY_MODE.get(normalizeTopFilterMode(value))?.contractKey || "all";
}

export function topMatchesFilter(top, value) {
  const filterMode = normalizeTopFilterMode(value);
  if (filterMode === "todo") {
    return Number(top?.is_task ?? top?.isTask) === 1;
  }
  if (filterMode === "important") {
    return Number(top?.is_important ?? top?.isImportant) === 1;
  }
  if (filterMode === "decision") {
    return Number(top?.is_decision ?? top?.isDecision) === 1;
  }
  if (filterMode.startsWith("status:")) {
    return normalizeStatus(top?.status) === filterMode.slice(7);
  }
  return true;
}
