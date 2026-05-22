const assert = require('node:assert/strict');
const {
  createUiInspectorRegistry,
  LAYOUT_ELEMENT_KINDS,
  SETTING_KINDS,
} = require('../../src/shared/uiInspector');

function createBaseMap(overrides = {}) {
  return {
    id: ' map.a ',
    label: ' Map A ',
    elements: [
      { id: ' area.main ', kind: LAYOUT_ELEMENT_KINDS.AREA, label: ' Area Main ' },
      {
        id: ' container.main ',
        kind: LAYOUT_ELEMENT_KINDS.CONTAINER,
        label: ' Container Main ',
        parentId: ' area.main ',
      },
      {
        id: ' field.name ',
        kind: LAYOUT_ELEMENT_KINDS.FIELD,
        label: ' Field Name ',
        parentId: ' container.main ',
        settings: [
          {
            id: ' width.name ',
            kind: SETTING_KINDS.FIELD_WIDTH,
            label: ' Field Width ',
            defaultValue: 160,
          },
        ],
      },
    ],
    ...overrides,
  };
}

function run() {
  const registry = createUiInspectorRegistry();

  const initial = registry.registerMap(createBaseMap());
  assert.equal(initial.id, 'map.a', 'registerMap() should normalize map id');
  assert.equal(initial.label, 'Map A', 'registerMap() should normalize map label');
  assert.equal(initial.elements[0].id, 'area.main', 'registerMap() should normalize element ids');
  assert.equal(
    initial.elements[2].settings[0].id,
    'width.name',
    'registerMap() should normalize setting ids'
  );

  const listed = registry.listMaps();
  assert.equal(listed.length, 1, 'listMaps() should return registered map');
  assert.equal(listed[0].id, 'map.a', 'listMaps() should contain normalized id');

  const found = registry.getMap(' map.a ');
  assert.equal(found?.label, 'Map A', 'getMap() should find map by normalized id');

  assert.throws(() => registry.registerMap({ label: 'Missing id', elements: [] }), /map id must not be empty/i);

  assert.throws(
    () => registry.registerMap(createBaseMap({ elements: [{ id: '', kind: LAYOUT_ELEMENT_KINDS.AREA }] })),
    /element id.*must not be empty/i
  );

  assert.throws(
    () => registry.registerMap(createBaseMap({ elements: [{ id: 'x', kind: 'bad-kind' }] })),
    /element kind/i
  );

  assert.throws(
    () =>
      registry.registerMap(
        createBaseMap({
          elements: [
            { id: 'dup', kind: LAYOUT_ELEMENT_KINDS.AREA, label: 'A' },
            { id: 'dup', kind: LAYOUT_ELEMENT_KINDS.FIELD, label: 'B' },
          ],
        })
      ),
    /duplicate element id/i
  );

  assert.throws(
    () =>
      registry.registerMap(
        createBaseMap({
          elements: [
            {
              id: 'el1',
              kind: LAYOUT_ELEMENT_KINDS.AREA,
              label: 'A',
              settings: [{ id: 's1', kind: 'invalid' }],
            },
          ],
        })
      ),
    /setting kind/i
  );

  assert.throws(
    () =>
      registry.registerMap(
        createBaseMap({
          elements: [{ id: 'el1', kind: LAYOUT_ELEMENT_KINDS.AREA, label: 'A', parentId: 'unknown' }],
        })
      ),
    /parentId.*does not reference a known element/i
  );

  registry.registerMap(createBaseMap({ id: 'map.a', label: 'Map A newer' }));
  assert.equal(
    registry.getMap('map.a')?.label,
    'Map A newer',
    'duplicate id should be overwritten by latest map'
  );

  console.log('uiInspectorRegistry.test.cjs passed');
}

run();
