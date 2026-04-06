// src/renderer/utils/ampelLogic.js
import { computeAmpelColorForTop } from "../../shared/ampel/pdfAmpelRule.js";

function toLocalDateOnly(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function computeSingleAmpel(top, today) {
  return (
    computeAmpelColorForTop({
      top: {
        status: String(top?.status || "").trim(),
        due_date: top?.due_date ?? top?.dueDate ?? null,
      },
      childrenColors: [],
      now: today || toLocalDateOnly(new Date()),
    }) || null
  );
}

function getId(top) {
  return top?.id ?? top?.top_id ?? null;
}

export function createAmpelComputer(allTops, now = new Date(), overridesById = null) {
  const list = Array.isArray(allTops) ? allTops : [];
  const byId = new Map();
  for (const t of list) {
    const id = getId(t);
    if (!id) continue;
    byId.set(String(id), t);
  }

  const today = toLocalDateOnly(now) || toLocalDateOnly(new Date());
  const cache = new Map();

  const resolveTop = (idOrTop) => {
    if (!idOrTop) return null;
    if (typeof idOrTop === "object") return idOrTop;
    return byId.get(String(idOrTop)) || null;
  };

  const resolveById = (id) => {
    if (!id) return null;
    if (overridesById && overridesById.has(String(id))) return overridesById.get(String(id));
    return byId.get(String(id)) || null;
  };

  const computeForId = (id) => {
    const key = String(id);
    if (cache.has(key)) return cache.get(key);

    const t = resolveById(key);
    if (!t) {
      cache.set(key, null);
      return null;
    }

    const color = computeSingleAmpel(t, today);
    cache.set(key, color);
    return color;
  };

  return (topOrId) => {
    const t = resolveTop(topOrId);
    const id = getId(t) || topOrId;
    if (!id) return null;
    return computeForId(id);
  };
}
