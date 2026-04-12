const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runTopsRepositoryTests(run) {
  const mod = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/modules/protokoll/TopsRepository.js")
  );
  const { TopsRepository } = mod;

  await run("TopsRepository: loadByMeeting delegiert an die API", async () => {
    let seenMeetingId = null;
    const repo = new TopsRepository({
      api: {
        async topsListByMeeting(meetingId) {
          seenMeetingId = meetingId;
          return { ok: true, meeting: { id: meetingId, is_closed: 0 }, list: [{ id: 1 }] };
        },
      },
    });

    const res = await repo.loadByMeeting({ meetingId: 7 });
    assert.equal(seenMeetingId, 7);
    assert.equal(res.ok, true);
    assert.deepEqual(res.list, [{ id: 1 }]);
    assert.deepEqual(res.meeting, { id: 7, is_closed: 0 });
  });

  await run("TopsRepository: deleteTop meldet fehlende API sauber", async () => {
    const repo = new TopsRepository({ api: {} });
    const res = await repo.deleteTop({ topId: 9 });
    assert.equal(res.ok, false);
    assert.equal(res.error, "topsMarkTrashed unavailable");
    assert.equal(res.top, null);
  });
}

module.exports = { runTopsRepositoryTests };
