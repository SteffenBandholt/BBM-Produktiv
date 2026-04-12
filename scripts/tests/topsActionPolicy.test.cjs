const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runTopsActionPolicyTests(run) {
  const mod = await importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/protokoll/TopsActionPolicy.js"));
  const {
    hasChildren,
    isBlue,
    isAllowedMoveTarget,
    canCreateChild,
    canDelete,
    canMove,
    canCreateChildFromState,
    canDeleteFromState,
    canMoveFromState,
  } = mod;

  await run("TopsActionPolicy: hasChildren/isBlue", () => {
    const tops = [{ id: 1 }, { id: 2, parent_top_id: 1 }];
    assert.equal(hasChildren(tops, 1), true);
    assert.equal(hasChildren(tops, 2), false);
    assert.equal(isBlue({ is_carried_over: 0 }), true);
    assert.equal(isBlue({ is_carried_over: 1 }), false);
  });

  await run("TopsActionPolicy: isAllowedMoveTarget", () => {
    const movingTop = { id: 1 };
    assert.equal(isAllowedMoveTarget({ id: 1, level: 2 }, movingTop), false);
    assert.equal(isAllowedMoveTarget({ id: 2, level: 0 }, movingTop), false);
    assert.equal(isAllowedMoveTarget({ id: 2, level: 4 }, movingTop), false);
    assert.equal(isAllowedMoveTarget({ id: 2, level: 2 }, movingTop), true);
  });

  await run("TopsActionPolicy: canCreateChild/canDelete/canMove", () => {
    const tops = [{ id: 9 }, { id: 10, parent_top_id: 9 }];
    const selectedTop = { id: 9, level: 2, is_carried_over: 0 };

    assert.equal(canCreateChild({ isReadOnly: false, selectedTop }), true);
    assert.equal(canCreateChild({ isReadOnly: true, selectedTop }), false);
    assert.equal(canCreateChild({ isReadOnly: false, selectedTop: { id: 11, level: 4 } }), false);

    assert.equal(canDelete({ isReadOnly: false, selectedTop, tops }), false);
    assert.equal(canMove({ isReadOnly: false, selectedTop, tops }), false);

    const topsNoChild = [{ id: 9 }];
    assert.equal(canDelete({ isReadOnly: false, selectedTop, tops: topsNoChild }), true);
    assert.equal(canMove({ isReadOnly: false, selectedTop, tops: topsNoChild }), true);
  });

  await run("TopsActionPolicy: state-wrapper behalten Verhalten", () => {
    const state = {
      isReadOnly: false,
      tops: [{ id: 1 }, { id: 2, parent_top_id: 1 }],
    };
    const selectedTop = { id: 1, level: 2, is_carried_over: 0 };
    assert.equal(canCreateChildFromState(state, selectedTop), true);
    assert.equal(canDeleteFromState(state, selectedTop), false);
    assert.equal(canMoveFromState(state, selectedTop), false);
  });
}

module.exports = { runTopsActionPolicyTests };
