const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function ipcFixture({ isPackaged = false } = {}) {
  const handlers = new Map();
  const calls = [];
  const service = {
    defaults: () => ({}), list: () => [], get: () => null, createDraft: () => null,
    updateDraft: () => null, deleteDraft: () => true, previewDraft: () => null, bookDraft: () => null,
    listPayments(invoiceId) { calls.push(["listPayments", invoiceId]); return [{ id: "payment-1" }]; },
    recordPayment(invoiceId, payment) { calls.push(["recordPayment", invoiceId, payment]); return { id: "payment-2" }; },
    correctPayment(invoiceId, paymentId, payment) { calls.push(["correctPayment", invoiceId, paymentId, payment]); return { id: paymentId }; },
    paymentSummary(invoiceId) { calls.push(["paymentSummary", invoiceId]); return { invoice_id: invoiceId, payment_status: "OPEN" }; },
    getDevNumberSequence(sequenceKey) { calls.push(["getDevNumberSequence", sequenceKey]); return { sequence_key: sequenceKey, last_value: 17 }; },
    resetDevNumberSequence(sequenceKey) { calls.push(["resetDevNumberSequence", sequenceKey]); return { sequence_key: sequenceKey, last_value: 0 }; },
  };
  const ipcMain = { handle(channel, handler) { handlers.set(channel, handler); } };
  const { registerRechnungIpc } = require(path.join(process.cwd(), "src/main/ipc/rechnungIpc.js"));
  registerRechnungIpc({
    ipcMain,
    app: { isPackaged },
    service,
    firmDirectory: { listCustomers: () => [] },
    projectRepository: { listAll: () => [] },
  });
  const invoke = (channel, payload = {}) => handlers.get(channel)({}, payload);
  return { handlers, calls, invoke };
}

async function runRechnungIpcTests(run) {
  await run("Rechnung R3.1 IPC: Zahlungsfunktionen besitzen einen schmalen Preload-Vertrag", async () => {
    const env = ipcFixture();
    assert.deepEqual((await env.invoke("rechnung:listPayments", { invoiceId: "invoice-1" })).list, [{ id: "payment-1" }]);
    assert.deepEqual((await env.invoke("rechnung:recordPayment", { invoiceId: "invoice-1", payment: { amount_cents: 100 } })).data, { id: "payment-2" });
    assert.deepEqual((await env.invoke("rechnung:correctPayment", { invoiceId: "invoice-1", paymentId: "payment-1", payment: { amount_cents: 200 } })).data, { id: "payment-1" });
    assert.deepEqual((await env.invoke("rechnung:paymentSummary", { invoiceId: "invoice-1" })).data, { invoice_id: "invoice-1", payment_status: "OPEN" });
    assert.deepEqual(env.calls.slice(0, 4).map((entry) => entry[0]), ["listPayments", "recordPayment", "correctPayment", "paymentSummary"]);

    const preload = fs.readFileSync(path.join(process.cwd(), "src/main/preload.js"), "utf8");
    for (const token of ["rechnungListPayments", "rechnungRecordPayment", "rechnungCorrectPayment", "rechnungPaymentSummary", "rechnungDevNumberSequenceGet", "rechnungDevNumberSequenceReset"]) {
      assert.equal(preload.includes(token), true, token);
    }
  });

  await run("Rechnung R3.1 IPC: DEV-Nummernkreis ist ungepackt nutzbar", async () => {
    const env = ipcFixture({ isPackaged: false });
    assert.deepEqual(await env.invoke("rechnung:devNumberSequenceGet", { sequenceKey: "2026" }), { ok: true, data: { sequence_key: "2026", last_value: 17 } });
    assert.deepEqual(await env.invoke("rechnung:devNumberSequenceReset", { sequenceKey: "2026" }), { ok: true, data: { sequence_key: "2026", last_value: 0 } });
    assert.deepEqual(env.calls.map((entry) => entry[0]), ["getDevNumberSequence", "resetDevNumberSequence"]);
  });

  await run("Rechnung R3.1 IPC: DEV-Reset ist im gepackten Backend gesperrt und erreicht den Service nicht", async () => {
    const env = ipcFixture({ isPackaged: true });
    for (const channel of ["rechnung:devNumberSequenceGet", "rechnung:devNumberSequenceReset"]) {
      const result = await env.invoke(channel, { sequenceKey: "2026" });
      assert.equal(result.ok, false);
      assert.equal(result.code, "DEV_ONLY");
      assert.match(result.error, /ungepackten Entwicklermodus/);
    }
    assert.deepEqual(env.calls, []);
  });
}

module.exports = { runRechnungIpcTests };
