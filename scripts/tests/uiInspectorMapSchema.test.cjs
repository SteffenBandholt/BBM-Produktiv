const assert = require('node:assert/strict');
const {
  normalizeUiInspectorMap,
  LAYOUT_ELEMENT_KINDS,
  SETTING_KINDS,
} = require('../../src/shared/uiInspector');

function run() {
  const normalized = normalizeUiInspectorMap({
    id: '  map.rest  ',
    label: '  Test Map  ',
    version: '  1  ',
    elements: [
      {
        id: '  root  ',
        kind: LAYOUT_ELEMENT_KINDS.AREA,
        label: '  Root  ',
      },
      {
        id: '  child  ',
        kind: LAYOUT_ELEMENT_KINDS.CONTAINER,
        label: '  Child  ',
        parentId: ' root ',
        settings: [
          {
            id: '  width.main  ',
            kind: SETTING_KINDS.WIDTH,
            label: '  Width  ',
            defaultValue: 100,
          },
        ],
      },
      {
        id: '  field.a  ',
        kind: LAYOUT_ELEMENT_KINDS.FIELD,
        label: '  Field A  ',
        parentId: ' child ',
      },
    ],
  });

  assert.equal(normalized.id, 'map.rest');
  assert.equal(normalized.label, 'Test Map');
  assert.equal(normalized.version, '1');
  assert.equal(normalized.elements[0].id, 'root');
  assert.equal(normalized.elements[1].parentId, 'root');
  assert.equal(normalized.elements[1].settings[0].id, 'width.main');
  assert.equal(normalized.elements[1].settings[0].label, 'Width');

  assert.throws(() => normalizeUiInspectorMap({ label: 'Missing id', elements: [] }), /map id must not be empty/i);

  assert.throws(
    () =>
      normalizeUiInspectorMap({
        id: 'map.a',
        label: 'Map A',
        elements: [{ kind: LAYOUT_ELEMENT_KINDS.AREA, label: 'X' }],
      }),
    /element id.*must not be empty/i
  );

  assert.throws(
    () =>
      normalizeUiInspectorMap({
        id: 'map.a',
        label: 'Map A',
        elements: [{ id: 'el1', kind: 'invalid-kind', label: 'X' }],
      }),
    /element kind/i
  );

  assert.throws(
    () =>
      normalizeUiInspectorMap({
        id: 'map.a',
        label: 'Map A',
        elements: [
          { id: 'dup', kind: LAYOUT_ELEMENT_KINDS.AREA, label: 'A' },
          { id: 'dup', kind: LAYOUT_ELEMENT_KINDS.FIELD, label: 'B' },
        ],
      }),
    /duplicate element id/i
  );

  assert.throws(
    () =>
      normalizeUiInspectorMap({
        id: 'map.a',
        label: 'Map A',
        elements: [
          {
            id: 'el1',
            kind: LAYOUT_ELEMENT_KINDS.AREA,
            label: 'X',
            settings: [{ id: 's1', kind: 'bad-kind', label: 'Bad' }],
          },
        ],
      }),
    /setting kind/i
  );

  assert.throws(
    () =>
      normalizeUiInspectorMap({
        id: 'map.a',
        label: 'Map A',
        elements: [
          { id: 'el1', kind: LAYOUT_ELEMENT_KINDS.AREA, label: 'A', parentId: 'unknown' },
        ],
      }),
    /parentId.*does not reference a known element/i
  );

  console.log('uiInspectorMapSchema.test.cjs passed');
}

run();
