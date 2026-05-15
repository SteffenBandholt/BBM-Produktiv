const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runTopsCommandsTests(run) {
  const [{ TopsCommands }, { createTopsStore }] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/tops/domain/TopsCommands.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/tops/state/TopsStore.js")),
  ]);

  await run("TopsCommands: loadTops schreibt Liste und readOnly", async () => {
    const store = createTopsStore({ meetingId: null, projectId: null });
    const repository = {
      async loadByMeeting(meetingId) {
        const id = meetingId && typeof meetingId === "object" ? meetingId.meetingId : meetingId;
        assert.equal(id, 7);
        return {
          ok: true,
          meeting: { id: 7, is_closed: 1 },
          list: [{ id: 11, title: "TOP 1" }],
        };
      },
    };
    const commands = new TopsCommands({ store, repository });
    const res = await commands.loadTops({ meetingId: 7, projectId: 4 });
    assert.equal(res.ok, true);
    assert.equal(store.getState().isReadOnly, true);
    assert.equal(store.getState().tops.length, 1);
    assert.equal(store.getState().meetingId, 7);
    assert.equal(store.getState().projectId, 4);
  });

  await run("TopsCommands: selectTop/updateDraft/toggleMoveMode", () => {
    const store = createTopsStore({ editor: { title: "Alt" }, isMoveMode: false });
    const commands = new TopsCommands({ store, repository: {} });

    commands.selectTop(22);
    commands.updateDraft({ longtext: "Neu" });
    const moveMode1 = commands.toggleMoveMode();
    const moveMode2 = commands.toggleMoveMode(false);

    assert.equal(store.getState().selectedTopId, 22);
    assert.equal(store.getState().editor.title, "Alt");
    assert.equal(store.getState().editor.longtext, "Neu");
    assert.equal(moveMode1, true);
    assert.equal(moveMode2, false);
  });

  await run("TopsCommands: saveDraft und deleteSelectedTop nutzen Repository", async () => {
    const store = createTopsStore({
      meetingId: 9,
      selectedTopId: 33,
      editor: { title: "A" },
    });

    let savedPayload = null;
    let deletedId = null;
    const reloadedMeetingIds = [];

    const repository = {
      async saveTop(payload) {
        savedPayload = payload;
        return { ok: true };
      },
      async deleteTop(topId) {
        deletedId = topId && typeof topId === "object" ? topId.topId : topId;
        return { ok: true };
      },
      async loadByMeeting(payload) {
        const id = payload && typeof payload === "object" ? payload.meetingId : payload;
        reloadedMeetingIds.push(id);
        const isAfterSaveReload = reloadedMeetingIds.length === 1;
        return {
          ok: true,
          meeting: { id, is_closed: 0 },
          list: isAfterSaveReload ? [{ id: 33, title: "TOP 33" }] : [],
        };
      },
    };

    const commands = new TopsCommands({ store, repository });

    const saveRes = await commands.saveDraft({ title: "B" });
    const delRes = await commands.deleteSelectedTop();

    assert.equal(saveRes.ok, true);
    assert.equal(delRes.ok, true);
    assert.deepEqual(savedPayload, {
      meetingId: 9,
      topId: 33,
      patch: { title: "B" },
    });
    assert.equal(deletedId, 33);
    assert.equal(store.getState().selectedTopId, null);
    assert.deepEqual(reloadedMeetingIds, [9, 9]);
  });

  await run("TopsCommands: saveDraft fuer Kurz- und Langtext haelt Auswahl und bleibt offen", async () => {
    const store = createTopsStore({
      meetingId: 12,
      projectId: 44,
      selectedTopId: 77,
      editor: { title: "Alt", longtext: "Alt" },
    });

    const reloadCalls = [];
    const repository = {
      async saveTop(payload) {
        assert.equal(payload.meetingId, 12);
        assert.equal(payload.topId, 77);
        assert.deepEqual(payload.patch, { title: "Neu", longtext: "Neu lang" });
        return { ok: true };
      },
      async loadByMeeting(payload) {
        const id = payload && typeof payload === "object" ? payload.meetingId : payload;
        reloadCalls.push(id);
        return {
          ok: true,
          meeting: { id, is_closed: 0 },
          list: [
            {
              id: 77,
              title: "Neu",
              longtext: "Neu lang",
            },
          ],
        };
      },
    };

    const commands = new TopsCommands({ store, repository });
    const res = await commands.saveDraft({ title: "Neu", longtext: "Neu lang" });

    assert.equal(res.ok, true);
    assert.equal(store.getState().selectedTopId, 77);
    assert.equal(store.getState().isReadOnly, false);
    assert.equal(store.getState().tops[0].title, "Neu");
    assert.equal(store.getState().tops[0].longtext, "Neu lang");
    assert.deepEqual(reloadCalls, [12]);
  });
}

module.exports = { runTopsCommandsTests };
