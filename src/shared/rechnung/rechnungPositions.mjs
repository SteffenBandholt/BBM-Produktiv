export const POSITION_TYPES = Object.freeze({ SERVICE: "service", HEADING: "heading", NOTE: "note" });

const text = (value) => String(value ?? "").trim();

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

export function normalizeInvoicePositions(input = [], { idFactory } = {}) {
  if (!Array.isArray(input)) throw new Error("Rechnungspositionen mÃ¼ssen eine Liste sein.");
  const ids = new Set();
  let number = 0;
  return Object.freeze(input.map((source) => {
    const type = text(source?.type || POSITION_TYPES.SERVICE).toLowerCase();
    if (!Object.values(POSITION_TYPES).includes(type)) throw new Error("Unbekannter Positionstyp.");
    const id = text(source?.id) || text(idFactory?.());
    if (!id || ids.has(id)) throw new Error("Jede Rechnungsposition braucht eine eindeutige ID.");
    ids.add(id);
    const shortText = text(source?.short_text);
    if (!shortText) throw new Error("Kurztext der Rechnungsposition fehlt.");
    const base = { id, type, position_number: type === POSITION_TYPES.NOTE ? null : ++number, short_text: shortText, long_text: text(source?.long_text) };
    if (type !== POSITION_TYPES.SERVICE) return Object.freeze({ ...base, quantity: null, unit: null, unit_price_cents: null, total_cents: null, is_nep: false });
    const position = { ...base, quantity: String(decimal(source?.quantity, "Die Menge")), unit: text(source?.unit), unit_price_cents: cents(source?.unit_price_cents), is_nep: Boolean(source?.is_nep) };
    return Object.freeze({ ...position, total_cents: calculatePositionTotalCents(position) });
  }));
}
