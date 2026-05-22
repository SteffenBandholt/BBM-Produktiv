const assert = require('node:assert/strict');
const { createUiInspectorCore } = require('../../src/shared/uiInspector');

function run() {
  const core = createUiInspectorCore();

  assert.equal(core.isActive(), false, 'core should start inactive');

  core.activate();
  assert.equal(core.isActive(), true, 'activate() should switch core to active');

  core.deactivate();
  assert.equal(core.isActive(), false, 'deactivate() should switch core to inactive');

  core.selectElement(' area.main ');
  assert.equal(
    core.getState().selectedElementId,
    'area.main',
    'selectElement() should normalize and set selection'
  );

  core.clearSelection();
  assert.equal(core.getState().selectedElementId, null, 'clearSelection() should clear selection');

  console.log('uiInspectorCore.test.cjs passed');
}

run();
