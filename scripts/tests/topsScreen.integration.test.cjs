const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runTopsScreenIntegrationTests(run) {
  const [{ createTopsStore }, { TopsCommands }, vm] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/tops/state/TopsStore.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/tops/domain/TopsCommands.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/protokoll/viewmodel/TopsScreenViewModel.js")),
  ]);

  const { buildWorkbenchState, shouldShowWorkbench, buildListItemsFromState, editorFromTop, buildPatchFromDraft } = vm;

  await run("Tops v2 Integration: Auswahl -> Workbench-State + ReadOnly-Sichtbarkeit", async () => {
    const list = [
      { id: 11, level: 2, title: "A", is_carried_over: 0, parent_top_id: null },
      { id: 22, level: 3, title: "B", is_carried_over: 0, parent_top_id: null },
    ];
    const repository = {
      async loadByMeeting() {
        return { ok: true, meeting: { id: 7, is_closed: 0 }, list };
      },
    };

    const store = createTopsStore({ meetingId: null, tops: [] });
    const commands = new TopsCommands({ store, repository });

    await commands.loadTops({ meetingId: 7, projectId: 3 });

    const wbNoSelection = buildWorkbenchState(store.getState());
    assert.equal(wbNoSelection.hasSelection, false);
    assert.equal(wbNoSelection.canSave, false);
    assert.equal(shouldShowWorkbench(store.getState()), true);

    commands.selectTop(11);
    const selected = store.getState().tops.find((t) => t.id === 11);
    commands.updateDraft(editorFromTop(selected));

    const wbWithSelection = buildWorkbenchState(store.getState());
    assert.equal(wbWithSelection.hasSelection, true);
    assert.equal(wbWithSelection.canSave, true);
    assert.equal(wbWithSelection.canMove, true);
    assert.equal(wbWithSelection.canDelete, true);
    assert.equal(shouldShowWorkbench(store.getState()), true);

    store.setState({ isReadOnly: true });
    const wbReadOnly = buildWorkbenchState(store.getState());
    assert.equal(wbReadOnly.hasSelection, true);
    assert.equal(wbReadOnly.canSave, true);
    assert.equal(wbReadOnly.canMove, false);
    assert.equal(wbReadOnly.canDelete, false);
    assert.equal(shouldShowWorkbench(store.getState()), true);
  });

  await run("Tops v2 Integration: Move-Mode markiert Targets datengetrieben", () => {
    const state = {
      meetingId: 7,
      isMoveMode: true,
      selectedTopId: 100,
      tops: [
        { id: 100, level: 2, title: "Self", displayNumber: 2 },
        { id: 101, level: 3, title: "Valid", displayNumber: 3 },
        { id: 102, level: 4, title: "Invalid", displayNumber: 4 },
      ],
    };

    const rows = buildListItemsFromState(state);
    const byId = new Map(rows.map((r) => [String(r.id), r]));

    assert.equal(byId.get("100").isMoveTarget, false);
    assert.equal(byId.get("101").isMoveTarget, true);
    assert.equal(byId.get("102").isMoveTarget, false);
  });

  await run("Tops v2 Integration: Save/Delete + Reload haelt Zustand konsistent", async () => {
    const db = {
      tops: [
        {
          id: 201,
          level: 2,
          title: "Alpha",
          longtext: "",
          status: "-",
          is_carried_over: 0,
          parent_top_id: null,
        },
      ],
    };

    const repository = {
      async loadByMeeting() {
        return { ok: true, meeting: { id: 12, is_closed: 0 }, list: db.tops.map((t) => ({ ...t })) };
      },
      async saveTop({ topId, patch }) {
        const top = db.tops.find((t) => String(t.id) === String(topId));
        if (!top) return { ok: false, error: "not found" };
        Object.assign(top, patch || {});
        return { ok: true };
      },
      async deleteTop(topId) {
        const id = topId && typeof topId === "object" ? topId.topId : topId;
        db.tops = db.tops.filter((t) => String(t.id) !== String(id));
        return { ok: true };
      },
    };

    const store = createTopsStore({ meetingId: null, tops: [] });
    const commands = new TopsCommands({ store, repository });

    await commands.loadTops({ meetingId: 12, projectId: 99 });
    commands.selectTop(201);

    const selectedBefore = store.getState().tops.find((t) => t.id === 201);
    const patch = buildPatchFromDraft(selectedBefore, { ...editorFromTop(selectedBefore), title: "Beta" });
    assert.deepEqual(patch, { title: "Beta" });

    const saveRes = await commands.saveDraft(patch);
    assert.equal(saveRes.ok, true);

    await commands.loadTops({ meetingId: 12, projectId: 99 });
    const selectedAfterSave = store.getState().tops.find((t) => t.id === 201);
    assert.equal(selectedAfterSave.title, "Beta");

    const delRes = await commands.deleteSelectedTop();
    assert.equal(delRes.ok, true);
    await commands.loadTops({ meetingId: 12, projectId: 99 });

    assert.equal(store.getState().tops.length, 0);
    assert.equal(store.getState().selectedTopId, null);
  });
}

module.exports = { runTopsScreenIntegrationTests };
