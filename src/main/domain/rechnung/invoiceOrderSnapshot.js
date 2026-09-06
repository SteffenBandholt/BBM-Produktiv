"use strict";

const { randomUUID } = require("node:crypto");
const { isDeepStrictEqual } = require("node:util");

const LOCKED_HEADER_FIELDS = Object.freeze([
  "source_type", "source_order_id", "source_order_number", "source_order_date",
  "customer_ref_kind", "customer_firm_id", "customer_project_id", "project_id",
  "service_reference", "document_type", "installment_number",
  "order_binding_state", "order_snapshot_at", "order_snapshot_json",
]);

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function assertOrderSnapshotInput(current, input = {}) {
  if (current.order_binding_state === "LEGACY_UNRESOLVED") fail("invoice_order_binding_legacy_unresolved");
  if (current.order_binding_state !== "BOUND") {
    if (input.source_type === "FROM_ORDER" && current.source_type !== "FROM_ORDER") fail("invoice_order_requires_snapshot_creation");
    for (const key of ["order_binding_state", "order_snapshot_at", "order_snapshot_json"]) {
      if (Object.hasOwn(input, key) && input[key] !== current[key]) fail("invoice_order_snapshot_immutable");
    }
    return;
  }
  if (!current.order_snapshot_at || !current.order_snapshot_json) fail("invoice_order_snapshot_missing");
  const snapshot = JSON.parse(current.order_snapshot_json);
  const storedPositions = current.positions || JSON.parse(current.positions_json);
  if (snapshot.order.id !== current.source_order_id || !isDeepStrictEqual(snapshot.positions, storedPositions)) fail("invoice_order_snapshot_invalid");
  for (const key of LOCKED_HEADER_FIELDS) {
    const value = key === "installment_number" && input[key] === "" ? null : input[key];
    if (Object.hasOwn(input, key) && !isDeepStrictEqual(value, current[key])) fail("invoice_order_snapshot_immutable");
  }
  if (Object.hasOwn(input, "positions") && !isDeepStrictEqual(input.positions, storedPositions)) fail("invoice_order_snapshot_immutable");
  if (Object.hasOwn(input, "positions_json") && input.positions_json !== current.positions_json) fail("invoice_order_snapshot_immutable");
}

function createOrderSnapshot(order, positionRules) {
  if (order?.order_binding_state === "LEGACY_UNRESOLVED") fail("invoice_order_binding_legacy_unresolved");
  if (order?.status !== "CONFIRMED") fail("invoice_order_source_not_confirmed");
  const ids = new Map(order.positions.map(p => [p.id, randomUUID()]));
  const positions = order.positions.map(p => {
    const entry = {
      id: ids.get(p.id), position_origin: "CONTRACT", source_order_id: order.id,
      source_order_position_id: p.id, source_parent_position_id: p.parent_position_id,
      parent_id: p.parent_position_id ? ids.get(p.parent_position_id) : null,
      type: p.type, is_title: p.type === "heading", position_number: p.position_number,
      sort_index: p.sort_index, short_text: p.short_text, long_text: p.long_text,
      quantity: p.quantity, unit: p.unit, unit_price_cents: p.unit_price_cents,
      is_nep: p.is_nep, vat_rate_percent: p.vat_rate_percent,
      price_input_mode: p.price_input_mode, price_input_cents: p.price_input_cents,
    };
    if (p.parent_position_id && !entry.parent_id) fail("invoice_order_snapshot_parent_invalid");
    return { ...entry, total_cents: positionRules.calculatePositionTotalCents(entry) };
  });
  const origins = new Map(order.positions.map(p => [p.id, p]));
  const confirmed = (order.amendments || []).filter(a => a.status === "CONFIRMED");
  const sequences = new Set();
  const amendmentIds = new Set();
  let sortIndex = order.positions.reduce((max, p) => Math.max(max, p.sort_index), -1);
  for (const a of [...confirmed].sort((left, right) => left.sequence_no - right.sequence_no)) {
    const origin = origins.get(a.relates_to_order_position_id);
    if (a.order_id !== order.id || !origin || origin.order_id !== order.id || origin.type !== "service") fail("invoice_order_amendment_origin_invalid");
    if (!Number.isSafeInteger(a.sequence_no) || a.sequence_no < 1 || sequences.has(a.sequence_no)
      || a.amendment_number !== `N ${String(a.sequence_no).padStart(2, "0")}`) fail("invoice_order_amendment_number_invalid");
    if (typeof a.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(a.id)
      || amendmentIds.has(a.id)) fail("invoice_order_amendment_id_invalid");
    sequences.add(a.sequence_no);
    amendmentIds.add(a.id);
    if (!Number.isSafeInteger(++sortIndex)) fail("invoice_order_amendment_sort_invalid");
    const entry = {
      id: randomUUID(), position_origin: "AMENDMENT", source_order_id: order.id,
      source_order_amendment_id: a.id, relates_to_order_position_id: origin.id,
      relates_to_position_number: origin.position_number,
      sequence_no: a.sequence_no, amendment_number: a.amendment_number,
      parent_id: null, type: "service", is_title: false,
      position_number: a.amendment_number, sort_index: sortIndex,
      short_text: a.short_text, long_text: a.long_text,
      quantity: a.quantity, unit: a.unit, unit_price_cents: a.unit_price_cents,
      is_nep: a.is_nep, vat_rate_percent: a.vat_rate_percent,
      price_input_mode: a.price_input_mode, price_input_cents: a.price_input_cents,
    };
    positions.push({ ...entry, total_cents: positionRules.calculatePositionTotalCents(entry) });
  }
  const { positions: _positions, amendments: _amendments, ...head } = order;
  return { version: 1, order: head, positions };
}

module.exports = { assertOrderSnapshotInput, createOrderSnapshot };
