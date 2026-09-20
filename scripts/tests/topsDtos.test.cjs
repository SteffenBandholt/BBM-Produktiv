const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runTopsDtosTests(run) {
  const dto = await importEsmFromFile(path.join(__dirname, "../../src/renderer/tops/data/TopsDtos.js"));

  await run("TopsDtos: Request-DTOs normalisieren Input", () => {
    const loadReq = dto.createLoadByMeetingRequest(7);
    assert.deepEqual(loadReq, { meetingId: 7 });

    const saveReq = dto.createSaveTopRequest({ meetingId: "9", topId: 33, patch: null });
    assert.deepEqual(saveReq, { meetingId: "9", topId: 33, patch: {} });

    const delReq = dto.createDeleteTopRequest({ topId: "44" });
    assert.deepEqual(delReq, { topId: "44" });

    const importMoveReq = dto.createMoveImportTopsRequest({
      meetingId: "m-1",
      topIds: ["p-2", null, "p-4", "p-2"],
      targetParentId: "title-1",
    });
    assert.deepEqual(importMoveReq, {
      meetingId: "m-1",
      topIds: ["p-2", "p-4"],
      targetParentId: "title-1",
    });
  });

  await run("TopsDtos: API-Payloads und Result-DTOs sind stabil", () => {
    const savePayload = dto.toApiSaveTopPayload({ meetingId: 1, topId: 2, patch: { title: "A" } });
    assert.deepEqual(savePayload, { meetingId: 1, topId: 2, patch: { title: "A" } });

    const loadResult = dto.createLoadByMeetingResult({ ok: 1, meeting: { id: 5 }, list: null, error: "x" });
    assert.deepEqual(loadResult, { ok: true, meeting: { id: 5 }, list: [], error: "x" });

    const mutResult = dto.createMutationResult({ ok: 0, top: null, error: "bad", detail: 5 });
    assert.equal(mutResult.ok, false);
    assert.equal(mutResult.error, "bad");
    assert.equal(mutResult.detail, 5);

    assert.deepEqual(dto.toApiMoveImportTopsPayload({
      meetingId: "m-1",
      topIds: ["p-2", "p-4"],
      targetParentId: "title-1",
    }), {
      meetingId: "m-1",
      topIds: ["p-2", "p-4"],
      targetParentId: "title-1",
    });
  });
}

module.exports = { runTopsDtosTests };
