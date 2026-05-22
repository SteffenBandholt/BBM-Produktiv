const assert = require('node:assert/strict');
const { createUiInspectorRegistry } = require('../../src/shared/uiInspector');

function run() {
  const registry = createUiInspectorRegistry();

  const initial = registry.registerMap({ id: ' map.a ', label: 'Map A' });
  assert.equal(initial.id, 'map.a', 'registerMap() should normalize id');

  const listed = registry.listMaps();
  assert.equal(listed.length, 1, 'listMaps() should return registered map');
  assert.equal(listed[0].id, 'map.a', 'listMaps() should contain normalized id');

  const found = registry.getMap(' map.a ');
  assert.equal(found?.label, 'Map A', 'getMap() should find map by normalized id');

  assert.throws(
    () => registry.registerMap({ label: 'Missing id' }),
    /map id must not be empty/i,
    'registerMap() should reject maps without id'
  );

  registry.registerMap({ id: 'map.a', label: 'Map A newer' });
  assert.equal(
    registry.getMap('map.a')?.label,
    'Map A newer',
    'duplicate id should be overwritten by latest map'
  );

  console.log('uiInspectorRegistry.test.cjs passed');
}

run();
