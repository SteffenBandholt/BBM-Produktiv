export const POSITION_TYPES = Object.freeze({ SERVICE: "service", HEADING: "heading", NOTE: "note" });

const text = (value) => String(value ?? "").trim();

function createPositionId(idFactory) {
  const generated = typeof idFactory === "function"
    ? idFactory()
    : globalThis.crypto?.randomUUID?.();
  return text(generated);
}

function decimal(value, label) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!normalized) return 0;
  if (!/^\d+(?:\.\d{1,4})?$/.test(normalized)) throw new Error(`${label} ist ungÃ¼ltig.`);
  return Number(normalized);
}

function cents(value) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error("Der Einheitspreis ist ungÃ¼ltig.");
  return number;
}

export function calculatePositionTotalCents(position) {
  if (position?.type !== POSITION_TYPES.SERVICE || position?.is_nep) return null;
  return Math.round(decimal(position.quantity, "Die Menge") * cents(position.unit_price_cents));
}

function normalizeParentIds(entries) {
  const ids = new Set(entries.map((entry) => entry.id));
  const parentIds = new Map(entries.map((entry) => [entry.id, ids.has(entry.parent_id) && entry.parent_id !== entry.id ? entry.parent_id : null]));

  for (const entry of entries) {
    const ancestors = new Set([entry.id]);
    let currentId = entry.id;
    while (parentIds.get(currentId)) {
      const parentId = parentIds.get(currentId);
      if (ancestors.has(parentId)) {
        parentIds.set(currentId, null);
        break;
      }
      ancestors.add(parentId);
      currentId = parentId;
    }
  }
  return parentIds;
}

function assignPositionNumbers(entries, parentIds) {
  const childrenByParentId = new Map();
  for (const entry of entries) {
    const parentId = parentIds.get(entry.id);
    if (!childrenByParentId.has(parentId)) childrenByParentId.set(parentId, []);
    childrenByParentId.get(parentId).push(entry);
  }

  const positionNumbers = new Map();
  const roots = childrenByParentId.get(null) || [];
  let rootTitleNumber = 0;
  let rootPositionNumber = 0;
  for (const entry of roots) {
    if (entry.type === POSITION_TYPES.NOTE) continue;
    if (entry.type === POSITION_TYPES.HEADING) positionNumbers.set(entry.id, String(++rootTitleNumber));
    else positionNumbers.set(entry.id, String(++rootPositionNumber).padStart(2, "0"));
  }

  function visit(parentId) {
    const parentNumber = positionNumbers.get(parentId);
    if (!parentNumber) return;
    let siblingNumber = 0;
    for (const entry of childrenByParentId.get(parentId) || []) {
      if (entry.type !== POSITION_TYPES.NOTE) positionNumbers.set(entry.id, `${parentNumber}.${String(++siblingNumber).padStart(2, "0")}`);
      visit(entry.id);
    }
  }
  for (const root of roots) visit(root.id);
  return positionNumbers;
}

export function normalizeInvoicePositions(input = [], { idFactory } = {}) {
  if (!Array.isArray(input)) throw new Error("Rechnungspositionen mÃ¼ssen eine Liste sein.");
  const ids = new Set();
  const entries = input.map((source) => {
    const type = text(source?.type || POSITION_TYPES.SERVICE).toLowerCase();
    if (!Object.values(POSITION_TYPES).includes(type)) throw new Error("Unbekannter Positionstyp.");
    const id = text(source?.id) || createPositionId(idFactory);
    if (!id || ids.has(id)) throw new Error("Jede Rechnungsposition braucht eine eindeutige ID.");
    ids.add(id);
    const shortText = text(source?.short_text);
    if (!shortText) throw new Error("Kurztext der Rechnungsposition fehlt.");
    const base = { id, type, parent_id: text(source?.parent_id) || null, short_text: shortText, long_text: text(source?.long_text) };
    if (type !== POSITION_TYPES.SERVICE) return { ...base, quantity: null, unit: null, unit_price_cents: null, total_cents: null, is_nep: false };
    const position = { ...base, quantity: String(decimal(source?.quantity, "Die Menge")), unit: text(source?.unit), unit_price_cents: cents(source?.unit_price_cents), is_nep: Boolean(source?.is_nep) };
    return { ...position, total_cents: calculatePositionTotalCents(position) };
  });
  const parentIds = normalizeParentIds(entries);
  const positionNumbers = assignPositionNumbers(entries, parentIds);
  return Object.freeze(entries.map((entry) => Object.freeze({
    ...entry,
    parent_id: parentIds.get(entry.id),
    position_number: entry.type === POSITION_TYPES.NOTE ? null : positionNumbers.get(entry.id) || null,
  })));
}
