export const POSITION_TYPES = Object.freeze({ SERVICE: "service", HEADING: "heading", NOTE: "note" });
export const DEFAULT_VAT_RATE_PERCENT = 19;
export const PRICE_INPUT_MODES = Object.freeze({ NET: "NET", GROSS: "GROSS" });

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

function vatRatePercent(value) {
  if (value == null || String(value).trim() === "") return DEFAULT_VAT_RATE_PERCENT;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 100) throw new Error("Der Mehrwertsteuersatz ist ungültig.");
  return number;
}

function priceInputMode(value) {
  const mode = text(value).toUpperCase() || PRICE_INPUT_MODES.NET;
  if (!Object.values(PRICE_INPUT_MODES).includes(mode)) throw new Error("Der Preiseingabemodus ist ungültig.");
  return mode;
}

function normalizeAlternativeSuffix(value) {
  const suffix = text(value || "a").toLowerCase();
  return /^[a-z]$/.test(suffix) ? suffix : "a";
}

function netFromGrossCents(grossCents, ratePercent) {
  return Math.round(cents(grossCents) * 100 / (100 + ratePercent));
}

function grossFromNetCents(netCents, ratePercent) {
  return cents(netCents) + Math.round(cents(netCents) * ratePercent / 100);
}

export function calculatePositionInputPriceCents(position) {
  if (position?.type !== POSITION_TYPES.SERVICE) return null;
  if (priceInputMode(position?.price_input_mode) === PRICE_INPUT_MODES.GROSS) return cents(position?.price_input_cents ?? position?.unit_price_cents);
  return cents(position?.unit_price_cents);
}

export function calculatePositionGrossUnitPriceCents(position) {
  if (position?.type !== POSITION_TYPES.SERVICE) return null;
  const ratePercent = vatRatePercent(position?.vat_rate_percent);
  if (priceInputMode(position?.price_input_mode) === PRICE_INPUT_MODES.GROSS) return calculatePositionInputPriceCents(position);
  return grossFromNetCents(position?.unit_price_cents, ratePercent);
}

export function calculatePositionTotalCents(position) {
  if (position?.type !== POSITION_TYPES.SERVICE || position?.is_nep) return null;
  if (priceInputMode(position?.price_input_mode) === PRICE_INPUT_MODES.GROSS) {
    const grossTotalCents = Math.round(decimal(position.quantity, "Die Menge") * calculatePositionInputPriceCents(position));
    return netFromGrossCents(grossTotalCents, vatRatePercent(position?.vat_rate_percent));
  }
  return Math.round(decimal(position.quantity, "Die Menge") * cents(position.unit_price_cents));
}

export function calculatePositionVatCents(position) {
  const netCents = calculatePositionTotalCents(position);
  if (netCents == null) return null;
  if (priceInputMode(position?.price_input_mode) === PRICE_INPUT_MODES.GROSS) {
    const grossTotalCents = Math.round(decimal(position.quantity, "Die Menge") * calculatePositionInputPriceCents(position));
    return grossTotalCents - netCents;
  }
  return Math.round(netCents * vatRatePercent(position?.vat_rate_percent) / 100);
}

export function calculateInvoiceTotalsCents(positions = []) {
  let net_cents = 0;
  let vat_cents = 0;
  for (const position of positions) {
    const positionNetCents = calculatePositionTotalCents(position);
    if (positionNetCents == null) continue;
    net_cents += positionNetCents;
    vat_cents += calculatePositionVatCents(position) || 0;
  }
  return Object.freeze({ net_cents, vat_cents, gross_cents: net_cents + vat_cents });
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

function assignAlternativeNumbers(entries, positionNumbers) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  for (const entry of entries) {
    if (entry.type !== POSITION_TYPES.SERVICE || !entry.alternative_of) continue;
    const mother = byId.get(entry.alternative_of);
    const motherNumber = mother ? positionNumbers.get(mother.id) : null;
    if (!motherNumber) continue;
    positionNumbers.set(entry.id, `${motherNumber}${normalizeAlternativeSuffix(entry.alternative_suffix)}`);
  }
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
    if (entry.type !== POSITION_TYPES.SERVICE && !entry.is_title) continue;
    if (entry.is_title) positionNumbers.set(entry.id, String(++rootTitleNumber));
    else if (!entry.alternative_of) positionNumbers.set(entry.id, String(++rootPositionNumber).padStart(2, "0"));
  }

  function visit(parentId) {
    const parentNumber = positionNumbers.get(parentId);
    if (!parentNumber) return;
    let siblingNumber = 0;
    for (const entry of childrenByParentId.get(parentId) || []) {
      if (entry.type === POSITION_TYPES.SERVICE && !entry.alternative_of) {
        positionNumbers.set(entry.id, `${parentNumber}.${String(++siblingNumber).padStart(2, "0")}`);
      }
      visit(entry.id);
    }
  }
  for (const root of roots) visit(root.id);
  assignAlternativeNumbers(entries, positionNumbers);
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
    const isTitle = type === POSITION_TYPES.HEADING && source?.is_title !== false;
    const base = {
      id,
      type,
      is_title: isTitle,
      parent_id: text(source?.parent_id) || null,
      short_text: shortText,
      long_text: text(source?.long_text),
      alternative_of: type === POSITION_TYPES.SERVICE ? text(source?.alternative_of) || null : null,
      alternative_suffix: type === POSITION_TYPES.SERVICE && text(source?.alternative_of)
        ? normalizeAlternativeSuffix(source?.alternative_suffix)
        : null,
    };
    if (type !== POSITION_TYPES.SERVICE) return { ...base, quantity: null, unit: null, unit_price_cents: null, total_cents: null, is_nep: false, vat_rate_percent: null, price_input_mode: null, price_input_cents: null };
    const vat_rate_percent = vatRatePercent(source?.vat_rate_percent);
    const price_input_mode = priceInputMode(source?.price_input_mode);
    const price_input_cents = price_input_mode === PRICE_INPUT_MODES.GROSS ? cents(source?.price_input_cents ?? source?.unit_price_cents) : null;
    const position = { ...base, quantity: String(decimal(source?.quantity, "Die Menge")), unit: text(source?.unit), unit_price_cents: price_input_mode === PRICE_INPUT_MODES.GROSS ? netFromGrossCents(price_input_cents, vat_rate_percent) : cents(source?.unit_price_cents), is_nep: Boolean(source?.is_nep), vat_rate_percent, price_input_mode, price_input_cents };
    return { ...position, total_cents: calculatePositionTotalCents(position) };
  });
  const parentIds = normalizeParentIds(entries);
  const positionNumbers = assignPositionNumbers(entries, parentIds);
  return Object.freeze(entries.map((entry) => Object.freeze({
    ...entry,
    parent_id: parentIds.get(entry.id),
    position_number: entry.type === POSITION_TYPES.SERVICE || entry.is_title ? positionNumbers.get(entry.id) || null : null,
  })));
}
