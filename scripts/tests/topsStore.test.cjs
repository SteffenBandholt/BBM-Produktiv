const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runTopsStoreTests(run) {
  const mod = await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/protokoll/createTopsStore.js"));
  const { createTopsStore } = mod;

  await run("TopsStore: getState liefert Initialzustand", () => {
    const store = createTopsStore({ meetingId: 12, tops: [{ id: 1 }] });
    assert.equal(store.getState().meetingId, 12);
    assert.equal(Array.isArray(store.getState().tops), true);
    assert.equal(store.getState().tops.length, 1);
  });

  await run("TopsStore: setState merged partiell", () => {
    const store = createTopsStore({ editor: { title: "Alt" }, isMoveMode: false });
    store.setState({ isMoveMode: true });
    const state = store.getState();
    assert.equal(state.isMoveMode, true);
    assert.equal(state.editor.title, "Alt");
  });

  await run("TopsStore: subscribe reagiert und unsubscribe stoppt", () => {
    const store = createTopsStore({ selectedTopId: null });
    let calls = 0;
    const un = store.subscribe((state) => {
      calls += 1;
      assert.equal(state.selectedTopId, 99);
    });

    store.setState({ selectedTopId: 99 });
    assert.equal(calls, 1);
    un();
    store.setState({ selectedTopId: null });
    assert.equal(calls, 1);
  });

  await run("TopsStore: reset setzt Basiszustand", () => {
    const store = createTopsStore({ meetingId: 8, isReadOnly: true });
    store.setState({ meetingId: 9, isReadOnly: false });
    store.reset();
    assert.equal(store.getState().meetingId, 8);
    assert.equal(store.getState().isReadOnly, true);
  });
}

module.exports = { runTopsStoreTests };
