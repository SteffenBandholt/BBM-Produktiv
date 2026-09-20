"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { TopService } = require("../../src/main/domain/TopService");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createHarness({ failMoveAt = 0 } = {}) {
  const state = {
    meeting: { id: "meeting-1", project_id: "project-1", series_key: "construction", is_closed: 0 },
    writable: true,
    moveAttempts: 0,
    tops: [
      { id: "normal-1", project_id: "project-1", series_key: "construction", parent_top_id: null, level: 1, number: 1, title: "Baustelle", special_type: null },
      { id: "normal-child", project_id: "project-1", series_key: "construction", parent_top_id: "normal-1", level: 2, number: 1, title: "Schon vorhanden", special_type: null },
      { id: "normal-2", project_id: "project-1", series_key: "construction", parent_top_id: null, level: 1, number: 2, title: "Planung", special_type: null },
      { id: "import-root", project_id: "project-1", series_key: "construction", parent_top_id: null, level: 1, number: 0, title: "Umbenannter Aufnahmebereich", special_type: "audio_import" },
      ...[1, 2, 3, 4, 5].map((number) => ({
        id: `import-${number}`,
        project_id: "project-1",
        series_key: "construction",
        parent_top_id: "import-root",
        level: 2,
        number,
        title: `Vollständiger Kurztext ${number}`,
        special_type: null,
        created_at: `2026-09-20T09:00:0${number}.000Z`,
      })),
    ],
    meetingTops: [
      { meeting_id: "meeting-1", top_id: "normal-1", is_carried_over: 1 },
      { meeting_id: "meeting-1", top_id: "normal-child", is_carried_over: 1, longtext: "Bestehender Inhalt" },
      { meeting_id: "meeting-1", top_id: "normal-2", is_carried_over: 0 },
      { meeting_id: "meeting-1", top_id: "import-root", is_carried_over: 0 },
      ...[1, 2, 3, 4, 5].map((number) => ({
        meeting_id: "meeting-1",
        top_id: `import-${number}`,
        is_carried_over: 0,
        status: number % 2 ? "offen" : "erledigt",
        due_date: `2026-10-0${number}`,
        longtext: `Langtext ${number}\n\nZweiter Absatz`,
        responsible_label: `Person ${number}`,
      })),
    ],
  };

  const findTop = (id) => state.tops.find((top) => String(top.id) === String(id)) || null;
  const findMeetingTop = (meetingId, topId) => state.meetingTops.find(
    (row) => String(row.meeting_id) === String(meetingId) && String(row.top_id) === String(topId)
  ) || null;
  const db = {
    transaction(callback) {
      const execute = () => {
        const snapshot = structuredClone(state);
        try {
          return callback();
        } catch (error) {
          Object.keys(state).forEach((key) => delete state[key]);
          Object.assign(state, snapshot);
          throw error;
        }
      };
      execute.immediate = execute;
      return execute;
    },
  };
  const meetingsRepo = {
    getMeetingById: (id) => String(id) === state.meeting.id ? { ...state.meeting } : null,
    getOpenMeetingByProject: (projectId, seriesKey) => (
      state.meeting.is_closed === 0 &&
      String(projectId) === state.meeting.project_id &&
      String(seriesKey || "construction") === state.meeting.series_key
        ? { ...state.meeting }
        : null
    ),
    assertMeetingWritable(id) {
      if (!state.writable || String(id) !== state.meeting.id || Number(state.meeting.is_closed) === 1) {
        throw new Error("Besprechung ist geschlossen oder nicht beschreibbar");
      }
      return { ...state.meeting };
    },
  };
  const topsRepo = {
    getTopById: (id) => {
      const top = findTop(id);
      return top ? { ...top } : null;
    },
    hasChildren: (id) => state.tops.some((top) => String(top.parent_top_id || "") === String(id)),
    getNextNumber(projectId, parentTopId, seriesKey) {
      return Math.max(0, ...state.tops.filter((top) => (
        String(top.project_id) === String(projectId) &&
        String(top.series_key || "construction") === String(seriesKey || "construction") &&
        String(top.parent_top_id || "") === String(parentTopId || "")
      )).map((top) => Number(top.number) || 0)) + 1;
    },
    moveTop({ topId, targetParentId, newLevel, newNumber }) {
      state.moveAttempts += 1;
      if (failMoveAt && state.moveAttempts === failMoveAt) throw new Error("simulierter Transaktionsfehler");
      const top = findTop(topId);
      top.parent_top_id = targetParentId;
      top.level = newLevel;
      top.number = newNumber;
      return { ...top };
    },
  };
  const meetingTopsRepo = { getMeetingTop: (meetingId, topId) => findMeetingTop(meetingId, topId) };
  const service = new TopService({
    topsRepo,
    meetingsRepo,
    meetingTopsRepo,
    dbProvider: () => db,
  });
  return { state, service, findTop, findMeetingTop };
}

async function runProtocolImportMultiMoveTests(run) {
  const screenModule = await importEsmFromFile(path.join(
    __dirname,
    "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
  ));
  const dialogsModule = await importEsmFromFile(path.join(
    __dirname,
    "../../src/renderer/features/dialogs/TopsViewDialogs.js"
  ));
  const { resolveImportMoveContext } = screenModule;
  const { canSubmitImportMove } = dialogsModule;

  await run("Import-Mehrfachverschieben: Kontext wird nur ueber special_type erkannt", () => {
    const { state, findTop } = createHarness();
    const context = resolveImportMoveContext(state.tops, findTop("import-3"));
    assert.equal(context.importRoot.id, "import-root");
    assert.deepEqual(context.points.map((top) => top.id), ["import-1", "import-2", "import-3", "import-4", "import-5"]);
    assert.deepEqual(context.targets.map((top) => top.id), ["normal-1", "normal-2"]);
    assert.equal(resolveImportMoveContext(state.tops, findTop("normal-child")), null);
    const nested = { ...findTop("import-3"), id: "nested-import", parent_top_id: "import-3", level: 3 };
    assert.equal(resolveImportMoveContext([...state.tops, nested], nested), null);
  });

  await run("Import-Mehrfachverschieben: Dialogfreigabe verlangt Auswahl und gueltiges Ziel", () => {
    assert.equal(canSubmitImportMove({ topIds: [], targetParentId: "normal-1" }), false);
    assert.equal(canSubmitImportMove({ topIds: ["import-2"], targetParentId: null }), false);
    assert.equal(canSubmitImportMove({ topIds: ["import-2"], targetParentId: "normal-1" }), true);
    assert.equal(canSubmitImportMove({ topIds: ["import-2"], targetParentId: "normal-1", submitting: true }), false);
  });

  await run("Import-Mehrfachverschieben: nicht benachbarte Punkte bleiben geordnet und inhaltlich unveraendert", () => {
    const { state, service, findTop, findMeetingTop } = createHarness();
    const contentsBefore = ["import-2", "import-4", "import-5"].map((id) => structuredClone(findMeetingTop("meeting-1", id)));
    const result = service.moveImportTops({ meetingId: "meeting-1", topIds: ["import-5", "import-2", "import-4"], targetParentId: "normal-1" });
    assert.deepEqual(result.movedTopIds, ["import-2", "import-4", "import-5"]);
    assert.deepEqual(["import-2", "import-4", "import-5"].map((id) => findTop(id).number), [2, 3, 4]);
    assert.ok(["import-2", "import-4", "import-5"].every((id) => findTop(id).parent_top_id === "normal-1"));
    assert.deepEqual(["import-1", "import-3"].map((id) => findTop(id).parent_top_id), ["import-root", "import-root"]);
    assert.equal(findTop("import-root").special_type, "audio_import");
    assert.deepEqual(["import-2", "import-4", "import-5"].map((id) => findMeetingTop("meeting-1", id)), contentsBefore);
    const reopened = createHarness();
    reopened.state.tops = structuredClone(state.tops);
    reopened.state.meetingTops = structuredClone(state.meetingTops);
    assert.deepEqual(["import-2", "import-4", "import-5"].map((id) => reopened.findTop(id).parent_top_id), ["normal-1", "normal-1", "normal-1"]);
  });

  await run("Import-Mehrfachverschieben: Abbruch im Dialog loest keine Mutation aus", async () => {
    const { state, findTop } = createHarness();
    let moveCalls = 0;
    let normalMoveToggles = 0;
    const screen = {
      store: { getState: () => ({ tops: state.tops, selectedTopId: findTop("import-3").id, meetingId: "meeting-1", isWriting: false, isMoveMode: false }) },
      dialogs: {
        async openImportMovePopup(args) {
          assert.equal(args.selectedTopId, "import-3");
          assert.deepEqual(args.points.map((top) => top.id), ["import-1", "import-2", "import-3", "import-4", "import-5"]);
          return null;
        },
      },
      commands: { toggleMoveMode: () => { normalMoveToggles += 1; } },
      topsRepository: { moveImportTops: async () => { moveCalls += 1; } },
      _saveActiveDraft: async () => true,
    };
    await screenModule.default.prototype._handleWorkbenchToggleMove.call(screen);
    assert.equal(moveCalls, 0);
    assert.equal(normalMoveToggles, 0);
  });

  await run("Import-Mehrfachverschieben: bestaetigte Auswahl nutzt Batch-IPC und laedt die Auswahl neu", async () => {
    const { state, findTop } = createHarness();
    const screenState = {
      tops: state.tops,
      selectedTopId: findTop("import-3").id,
      meetingId: "meeting-1",
      isWriting: false,
      isReadOnly: false,
      isMoveMode: false,
      error: null,
    };
    let request = null;
    let reloadArgs = null;
    const screen = {
      store: {
        getState: () => screenState,
        setState: (patch) => Object.assign(screenState, patch),
      },
      dialogs: {
        openImportMovePopup: async () => ({
          topIds: ["import-2", "import-4"],
          targetParentId: "normal-2",
        }),
      },
      commands: { toggleMoveMode: () => assert.fail("normaler Move-Modus darf nicht starten") },
      topsRepository: {
        moveImportTops: async (payload) => {
          request = payload;
          return { ok: true, movedTopIds: ["import-2", "import-4"] };
        },
      },
      _saveActiveDraft: async () => true,
      _reloadTops: async (args) => { reloadArgs = args; },
      _syncScreenState: () => {},
    };
    await screenModule.default.prototype._handleWorkbenchToggleMove.call(screen);
    assert.deepEqual(request, {
      meetingId: "meeting-1",
      topIds: ["import-2", "import-4"],
      targetParentId: "normal-2",
    });
    assert.deepEqual(reloadArgs, { keepSelection: true, selectTopId: "import-3" });
    assert.equal(screenState.isWriting, false);
    assert.equal(screenState.error, null);
  });

  await run("Import-Mehrfachverschieben: fehlende Schreibberechtigung bleibt folgenlos", () => {
    const blocked = createHarness();
    blocked.state.writable = false;
    assert.throws(() => blocked.service.moveImportTops({ meetingId: "meeting-1", topIds: ["import-2"], targetParentId: "normal-1" }), /nicht beschreibbar/);
    assert.equal(blocked.findTop("import-2").parent_top_id, "import-root");
  });

  await run("Import-Mehrfachverschieben: geschlossenes Meeting und ungueltiges Ziel bleiben folgenlos", () => {
    const closed = createHarness();
    closed.state.meeting.is_closed = 1;
    assert.throws(() => closed.service.moveImportTops({ meetingId: "meeting-1", topIds: ["import-2"], targetParentId: "normal-1" }), /geschlossen/);
    assert.equal(closed.findTop("import-2").parent_top_id, "import-root");
    const invalid = createHarness();
    assert.throws(() => invalid.service.moveImportTops({ meetingId: "meeting-1", topIds: ["import-2"], targetParentId: "import-root" }), /Zieltitel/);
    assert.equal(invalid.findTop("import-2").parent_top_id, "import-root");
  });

  await run("Import-Mehrfachverschieben: Transaktionsfehler rollt alle Punkte zurueck", () => {
    const { service, findTop } = createHarness({ failMoveAt: 2 });
    assert.throws(() => service.moveImportTops({ meetingId: "meeting-1", topIds: ["import-2", "import-4", "import-5"], targetParentId: "normal-1" }), /Transaktionsfehler/);
    assert.deepEqual(["import-2", "import-4", "import-5"].map((id) => findTop(id).parent_top_id), ["import-root", "import-root", "import-root"]);
  });

  await run("Import-Mehrfachverschieben: Doppelausfuehrung wird durch erneute Quellpruefung abgewiesen", () => {
    const { service, findTop } = createHarness();
    const payload = { meetingId: "meeting-1", topIds: ["import-2", "import-4"], targetParentId: "normal-1" };
    service.moveImportTops(payload);
    assert.throws(() => service.moveImportTops(payload), /Import-Bereich/);
    assert.deepEqual([findTop("import-2").number, findTop("import-4").number], [2, 3]);
  });

  await run("Import-Mehrfachverschieben: normales Einzelverschieben nutzt unveraendert moveTop", () => {
    const { service, findTop } = createHarness();
    const moved = service.moveTop({ topId: "import-1", targetParentId: "normal-2" });
    assert.equal(moved.id, "import-1");
    assert.equal(findTop("import-1").parent_top_id, "normal-2");
  });
}

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try {
      await test();
      console.log(`ok - ${name}`);
    } catch (error) {
      failed = true;
      console.error(`not ok - ${name}`);
      console.error(error?.stack || error);
    }
  };
  runProtocolImportMultiMoveTests(run).then(() => {
    if (failed) process.exitCode = 1;
  });
}

module.exports = { runProtocolImportMultiMoveTests };
