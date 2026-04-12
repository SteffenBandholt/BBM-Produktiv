const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runTopsDtosTests(run) {
  const dto = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/modules/protokoll/TopsDtos.js")
  );
  const mapper = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/modules/protokoll/TopsMapper.js")
  );

  await run("TopsDtos: Request-DTOs normalisieren Input", () => {
    const loadReq = dto.createLoadByMeetingRequest(7);
    assert.deepEqual(loadReq, { meetingId: 7 });

    const saveReq = dto.createSaveTopRequest({ meetingId: "9", topId: 33, patch: null });
    assert.deepEqual(saveReq, { meetingId: "9", topId: 33, patch: {} });

    const delReq = dto.createDeleteTopRequest({ topId: "44" });
    assert.deepEqual(delReq, { topId: "44" });
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
  });

  await run("TopsMapper: Mapping delegiert an TopsDtos", () => {
    assert.deepEqual(mapper.mapLoadByMeetingResult({ ok: 1, meeting: { id: 5 }, list: null }), {
      ok: true,
      meeting: { id: 5 },
      list: [],
      error: null,
    });

    assert.deepEqual(mapper.mapMutationResult({ ok: 0, top: null, error: "bad" }), {
      ok: false,
      top: null,
      error: "bad",
    });
  });
}

module.exports = { runTopsDtosTests };
