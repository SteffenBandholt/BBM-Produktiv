const TOP_FILTER_LABELS = Object.freeze({
  all: "Alle",
  todo: "ToDo",
  decision: "Beschluss",
});

const TOP_FILTER_BADGES = Object.freeze({
  all: "A",
  todo: "T",
  decision: "B",
});

export function normalizeTopFilterMode(value) {
  const raw = String(value || "all").trim().toLowerCase();
  if (raw === "todo" || raw === "task") return "todo";
  if (raw === "decision" || raw === "beschluss") return "decision";
  return "all";
}

export function getTopFilterLabel(value) {
  return TOP_FILTER_LABELS[normalizeTopFilterMode(value)] || TOP_FILTER_LABELS.all;
}

export function getTopFilterBadge(value) {
  return TOP_FILTER_BADGES[normalizeTopFilterMode(value)] || TOP_FILTER_BADGES.all;
}

export function topMatchesFilter(top, value) {
  const filterMode = normalizeTopFilterMode(value);
  if (filterMode === "todo") {
    return Number(top?.is_task ?? top?.isTask) === 1;
  }
  if (filterMode === "decision") {
    return Number(top?.is_decision) === 1;
  }
  return true;
}
