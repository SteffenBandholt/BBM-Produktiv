"use strict";

const { randomUUID } = require("crypto");
const { initDatabase } = require("./database");

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function requiredText(value, errorCode) {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new Error(errorCode);
  return normalized;
}

function stableUuid(value, errorCode) {
  const id = value == null || value === "" ? randomUUID() : String(value).trim();
  if (!UUID_PATTERN.test(id)) throw new Error(errorCode);
  return id;
}

function isoDate(value) {
  const normalized = requiredText(value, "billing_order_date_required");
  if (!ISO_DATE_PATTERN.test(normalized)) throw new Error("billing_order_date_invalid");
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) {
    throw new Error("billing_order_date_invalid");
  }
  return normalized;
}

function nullableText(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function positionValues(input, { id, orderId, now }) {
  return {
    id,
    order_id: orderId,
    parent_position_id: nullableText(input.parent_position_id),
    type: requiredText(input.type, "billing_order_position_type_required").toLowerCase(),
    position_number: requiredText(input.position_number, "billing_order_position_number_required"),
    sort_index: Number(input.sort_index),
    short_text: requiredText(input.short_text, "billing_order_position_short_text_required"),
    long_text: String(input.long_text ?? ""),
    quantity: nullableText(input.quantity),
    unit: nullableText(input.unit),
    unit_price_cents: input.unit_price_cents ?? null,
    is_nep: input.is_nep ? 1 : 0,
    vat_rate_percent: input.vat_rate_percent ?? null,
    price_input_mode: nullableText(input.price_input_mode)?.toUpperCase() || null,
    price_input_cents: input.price_input_cents ?? null,
    created_at: now,
    updated_at: now,
  };
}

function amendmentValues(input, { id, orderId, now }) {
  return {
    id,
    order_id: orderId,
    relates_to_order_position_id: stableUuid(
      input.relates_to_order_position_id,
      "billing_order_amendment_origin_id_invalid"
    ),
    short_text: requiredText(input.short_text, "billing_order_amendment_short_text_required"),
    long_text: String(input.long_text ?? ""),
    quantity: nullableText(input.quantity),
    unit: nullableText(input.unit),
    unit_price_cents: input.unit_price_cents ?? null,
    is_nep: input.is_nep ? 1 : 0,
    vat_rate_percent: input.vat_rate_percent ?? null,
    price_input_mode: nullableText(input.price_input_mode)?.toUpperCase() || null,
    price_input_cents: input.price_input_cents ?? null,
    created_at: now,
    updated_at: now,
  };
}

class BillingOrderRepository {
  constructor({ dbProvider = initDatabase, clock = () => new Date().toISOString() } = {}) {
    this.dbProvider = dbProvider;
    this.clock = clock;
  }

  _db() {
    return this.dbProvider();
  }

  get(id) {
    const db = this._db();
    const order = db.prepare("SELECT * FROM billing_orders WHERE id = ?").get(String(id || ""));
    if (!order) return null;
    return {
      ...order,
      positions: db
        .prepare("SELECT * FROM billing_order_positions WHERE order_id = ? ORDER BY sort_index, id")
        .all(order.id),
      amendments: db
        .prepare(`
          SELECT * FROM billing_order_amendments
          WHERE order_id = ?
          ORDER BY CASE WHEN sequence_no IS NULL THEN 1 ELSE 0 END, sequence_no, created_at, id
        `)
        .all(order.id),
    };
  }

  createDraft(input = {}) {
    const db = this._db();
    const now = this.clock();
    const id = stableUuid(input.id, "billing_order_id_invalid");
    db.prepare(`
      INSERT INTO billing_orders (
        id, order_number, order_date, customer_firm_id, project_id,
        service_reference, status, confirmed_at, created_at, updated_at
      ) VALUES (
        @id, @order_number, @order_date, @customer_firm_id, @project_id,
        @service_reference, 'DRAFT', NULL, @created_at, @updated_at
      )
    `).run({
      id,
      order_number: requiredText(input.order_number, "billing_order_number_required"),
      order_date: isoDate(input.order_date),
      customer_firm_id: requiredText(input.customer_firm_id, "billing_order_customer_required"),
      project_id: nullableText(input.project_id),
      service_reference: requiredText(input.service_reference, "billing_order_service_reference_required"),
      created_at: now,
      updated_at: now,
    });
    return this.get(id);
  }

  addPosition(orderId, input = {}) {
    const db = this._db();
    const now = this.clock();
    const normalizedOrderId = stableUuid(orderId, "billing_order_id_invalid");
    const id = stableUuid(input.id, "billing_order_position_id_invalid");
    const values = positionValues(input, { id, orderId: normalizedOrderId, now });
    db.prepare(`
      INSERT INTO billing_order_positions (
        id, order_id, parent_position_id, type, position_number, sort_index,
        short_text, long_text, quantity, unit, unit_price_cents, is_nep,
        vat_rate_percent, price_input_mode, price_input_cents, created_at, updated_at
      ) VALUES (
        @id, @order_id, @parent_position_id, @type, @position_number, @sort_index,
        @short_text, @long_text, @quantity, @unit, @unit_price_cents, @is_nep,
        @vat_rate_percent, @price_input_mode, @price_input_cents, @created_at, @updated_at
      )
    `).run(values);
    return db.prepare("SELECT * FROM billing_order_positions WHERE id = ?").get(id);
  }

  confirmOrder(id) {
    const db = this._db();
    const orderId = stableUuid(id, "billing_order_id_invalid");
    const confirmedAt = this.clock();
    const transaction = db.transaction(() => {
      const result = db.prepare(`
        UPDATE billing_orders
        SET status = 'CONFIRMED', confirmed_at = @confirmed_at, updated_at = @confirmed_at
        WHERE id = @id AND status = 'DRAFT'
      `).run({ id: orderId, confirmed_at: confirmedAt });
      if (result.changes !== 1) throw new Error("billing_order_not_confirmable");
    });
    transaction.immediate();
    return this.get(orderId);
  }

  createDraftAmendment(orderId, input = {}) {
    const db = this._db();
    const now = this.clock();
    const normalizedOrderId = stableUuid(orderId, "billing_order_id_invalid");
    const id = stableUuid(input.id, "billing_order_amendment_id_invalid");
    const values = amendmentValues(input, { id, orderId: normalizedOrderId, now });
    db.prepare(`
      INSERT INTO billing_order_amendments (
        id, order_id, sequence_no, amendment_number, relates_to_order_position_id,
        short_text, long_text, quantity, unit, unit_price_cents, is_nep,
        vat_rate_percent, price_input_mode, price_input_cents, status,
        confirmed_at, created_at, updated_at
      ) VALUES (
        @id, @order_id, NULL, NULL, @relates_to_order_position_id,
        @short_text, @long_text, @quantity, @unit, @unit_price_cents, @is_nep,
        @vat_rate_percent, @price_input_mode, @price_input_cents, 'DRAFT',
        NULL, @created_at, @updated_at
      )
    `).run(values);
    return db.prepare("SELECT * FROM billing_order_amendments WHERE id = ?").get(id);
  }

}

module.exports = { BillingOrderRepository };
