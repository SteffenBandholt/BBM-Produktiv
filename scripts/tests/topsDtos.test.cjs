const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runTopsDtosTests(run) {
  const dto = await importEsmFromFile(path.join(__dirname, "../../src/renderer/tops/data/TopsDtos.js"));
  const { TopsRepository } = await importEsmFromFile(path.join(__dirname, "../../src/renderer/tops/data/TopsRepository.js"));

  await run("TopsDtos: Request-DTOs normalisieren Input", () => {
    const loadReq = dto.createLoadByMeetingRequest(7);
    assert.deepEqual(loadReq, { meetingId: 7 });

    const saveReq = dto.createSaveTopRequest({ meetingId: "9", topId: 33, patch: null });
    assert.deepEqual(saveReq, { meetingId: "9", topId: 33, patch: {} });

    const delReq = dto.createDeleteTopRequest({ meetingId: "9", topId: "44" });
    assert.deepEqual(delReq, { meetingId: "9", topId: "44" });
  });

  await run("TopsDtos: API-Payloads und Result-DTOs sind stabil", () => {
    const savePayload = dto.toApiSaveTopPayload({ meetingId: 1, topId: 2, patch: { title: "A" } });
    assert.deepEqual(savePayload, { meetingId: 1, topId: 2, patch: { title: "A" } });
    assert.deepEqual(dto.toApiDeleteTopPayload({ meetingId: 1, topId: 2 }), { meetingId: 1, topId: 2 });

    const loadResult = dto.createLoadByMeetingResult({ ok: 1, meeting: { id: 5 }, list: null, error: "x" });
    assert.deepEqual(loadResult, { ok: true, meeting: { id: 5 }, list: [], error: "x" });

    const mutResult = dto.createMutationResult({ ok: 0, top: null, error: "bad", detail: 5 });
    assert.equal(mutResult.ok, false);
    assert.equal(mutResult.error, "bad");
    assert.equal(mutResult.detail, 5);
  });

  await run("TopsRepository: Delete nutzt den atomaren Main-Service mit Meetingkontext", async () => {
    let payload = null;
    const repository = new TopsRepository({ api: { topsDelete: async (value) => { payload = value; return { ok: true, renumbered: { topId: "3", toNumber: 2 } }; } } });
    const result = await repository.deleteTop({ meetingId: "m1", topId: "2" });
    assert.deepEqual(payload, { meetingId: "m1", topId: "2" });
    assert.equal(result.ok, true);
    assert.deepEqual(result.renumbered, { topId: "3", toNumber: 2 });
    assert.equal(repository.canDeleteTop(), true);
  });
}

module.exports = { runTopsDtosTests };
