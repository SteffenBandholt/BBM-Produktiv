const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runTopsSelectorsTests(run) {
  const mod = await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/protokoll/TopsSelectors.js"));
  const { getSelectedTop, hasSelection, isEditable } = mod;

  await run("TopsSelectors: getSelectedTop findet per id", () => {
    const state = {
      tops: [{ id: 3, title: "A" }, { id: "4", title: "B" }],
      selectedTopId: 4,
    };
    const selected = getSelectedTop(state);
    assert.equal(selected && selected.title, "B");
  });

  await run("TopsSelectors: hasSelection ist false ohne Treffer", () => {
    const state = { tops: [{ id: 1 }], selectedTopId: 9 };
    assert.equal(hasSelection(state), false);
  });

  await run("TopsSelectors: isEditable folgt isReadOnly", () => {
    assert.equal(isEditable({ isReadOnly: false }), true);
    assert.equal(isEditable({ isReadOnly: true }), false);
  });
}

module.exports = { runTopsSelectorsTests };
