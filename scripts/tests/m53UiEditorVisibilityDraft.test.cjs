const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('ui-editor-kit');
const { createBbmHostAdapter, createMemoryLayoutStateStore, validateM53ChangeRequest, createDefaultLayoutState } = require('../../src/ui-editor/bbm-host-adapter.cjs');
const { _m52 } = require('../../src/main/ipc/uiEditorIpc.js');

const REPO_ROOT = path.resolve(__dirname, '../..');

function test(name, fn) {
  try { fn(); console.log(`ok - ${name}`); } catch (error) { console.error(`not ok - ${name}`); throw error; }
}

test('public ui-editor-kit API is used for LayoutState', () => {
  assert.equal(typeof kit.createLayoutState, 'function');
  assert.equal(typeof kit.validateLayoutState, 'function');
  assert.equal(typeof kit.createMemoryLayoutStateStore, 'function');
  const state = createDefaultLayoutState({ 'bbm.main.header': { visible: false } });
  assert.equal(kit.validateLayoutState(state, { allowedPayloadFields: ['visible'] }).ok, true);
  assert.equal(state.schemaVersion, 1);
  assert.equal(state.elements['bbm.main.header'].visible, false);
});

test('selection and draft validation block unsafe cases', () => {
  assert.equal(validateM53ChangeRequest({ value: false }).blockCode, 'BBM_UI_CHANGE_NO_SELECTION');
  assert.equal(validateM53ChangeRequest({ elementId: 'bbm.main.unknown', value: false }).blockCode, 'BBM_UI_ELEMENT_UNKNOWN');
  assert.equal(validateM53ChangeRequest({ elementId: 'bbm.main.navigation', value: false }).blockCode, 'BBM_UI_CHANGE_ELEMENT_LOCKED');
  assert.equal(validateM53ChangeRequest({ elementId: 'bbm.main.header', value: false }).ok, true);
  assert.equal(validateM53ChangeRequest({ elementId: 'bbm.main.actions', value: true }).ok, true);
  assert.equal(validateM53ChangeRequest({ elementId: 'bbm.main.header', value: 'false' }).blockCode, 'BBM_UI_CHANGE_INVALID_VALUE');
  assert.equal(validateM53ChangeRequest({ elementId: 'bbm.main.header', value: false, width: 100 }).blockCode, 'BBM_UI_CHANGE_UNSUPPORTED_PROPERTY');
  assert.equal(validateM53ChangeRequest({ elementId: 'bbm.main.header', value: false, property: 'width' }).blockCode, 'BBM_UI_CHANGE_UNSUPPORTED_PROPERTY');
});

test('draft is not applied until apply and discard only removes draft', () => {
  _m52.closeUiEditorSession();
  const runtimeOptions = { layoutStore: createMemoryLayoutStateStore() };
  _m52.ensureRuntime({ forceRestart: true, runtimeOptions });
  assert.equal(_m52.createChangeDraft({ visible: false }).blockCode, 'BBM_UI_CHANGE_NO_SELECTION');
  assert.equal(_m52.selectUiEditorElement({ elementId: 'bbm.main.header' }).ok, true);
  const draft = _m52.createChangeDraft({ visible: false });
  assert.equal(draft.ok, true);
  assert.equal(_m52.loadLayoutState({ elementId: 'bbm.main.header' }).visible, true);
  assert.equal(_m52.getChangeDraft().draft.nextValue, false);
  assert.equal(_m52.discardChangeDraft().ok, true);
  assert.equal(_m52.getChangeDraft().draft, null);
  assert.equal(_m52.loadLayoutState({ elementId: 'bbm.main.header' }).visible, true);
});

test('apply validates again and stores session layout state', () => {
  _m52.closeUiEditorSession();
  const runtimeOptions = { layoutStore: createMemoryLayoutStateStore() };
  _m52.ensureRuntime({ forceRestart: true, runtimeOptions });
  _m52.selectUiEditorElement({ elementId: 'bbm.main.header' });
  _m52.createChangeDraft({ visible: false });
  const manipulated = _m52.applyChangeDraft({ elementId: 'bbm.main.header', value: false, uiScope: 'other' });
  assert.equal(manipulated.ok, false);
  assert.equal(manipulated.blockCode, 'BBM_UI_CHANGE_SCOPE_MISMATCH');
  const applied = _m52.applyChangeDraft({});
  assert.equal(applied.ok, true);
  assert.equal(applied.visible, false);
  assert.equal(_m52.loadLayoutState({ elementId: 'bbm.main.header' }).visible, false);
  const adapter = _m52.ensureRuntime().hostAdapter;
  assert.equal(adapter.getRegistry().elements.find((e) => e.elementId === 'bbm.main.header').layoutDefaults.visible, true);
  assert.equal(_m52.applyChangeDraft({}).blockCode, 'BBM_UI_CHANGE_DRAFT_INVALID');
});

test('profile and scope mismatch are blocked in adapter path', () => {
  const adapter = createBbmHostAdapter({ layoutStore: createMemoryLayoutStateStore() });
  assert.equal(adapter.saveLayoutState({ elementId: 'bbm.main.header', layoutScope: 'bad', layoutValue: { visible: false } }).blockCode, 'BBM_UI_CHANGE_SCOPE_MISMATCH');
  assert.equal(adapter.saveLayoutState({ elementId: 'bbm.main.header', layoutProfileId: 'other', layoutValue: { visible: false } }).blockCode, 'BBM_UI_CHANGE_PROFILE_MISMATCH');
  assert.equal(adapter.saveLayoutState({ elementId: 'bbm.main.header', layoutValue: { color: 'red' } }).blockCode, 'BBM_UI_CHANGE_UNSUPPORTED_PROPERTY');
});

test('reset only selected element/profile and reports default visible true', () => {
  const adapter = createBbmHostAdapter({ layoutStore: createMemoryLayoutStateStore() });
  assert.equal(adapter.submitChangeRequest({ elementId: 'bbm.main.header', value: false }).ok, true);
  assert.equal(adapter.submitChangeRequest({ elementId: 'bbm.main.actions', value: false }).ok, true);
  assert.equal(adapter.resetLayoutState({ elementId: 'bbm.main.header' }).visible, true);
  assert.equal(adapter.getElementLayoutState({ elementId: 'bbm.main.header' }).visible, true);
  assert.equal(adapter.getElementLayoutState({ elementId: 'bbm.main.actions' }).visible, false);
  assert.equal(adapter.resetLayoutState({ elementId: 'bbm.main.actions', layoutProfileId: 'other' }).blockCode, 'BBM_UI_CHANGE_PROFILE_MISMATCH');
});

test('security guardrails in M53 touched files', () => {
  const files = [
    'src/main/ipc/uiEditorIpc.js',
    'src/main/preload.js',
    'src/renderer/ui-editor/BbmUiEditorStatusPanel.js',
    'src/ui-editor/bbm-host-adapter.cjs',
  ];
  const source = files.map((file) => fs.readFileSync(path.join(REPO_ROOT, file), 'utf8')).join('\n');
  assert.equal(/querySelectorAll|getElementsBy|MutationObserver|eval\s*\(/.test(source), false);
  assert.equal(/execute\s*[:=]|invokeAny|callMethod|runCommand/.test(source), false);
  assert.equal(/localStorage|indexedDB|migrations|db\./i.test(source), false);
  assert.equal(/\.\.\/\.\.\/node_modules\/ui-editor-kit/.test(source), false);
  assert.match(source, /require\("ui-editor-kit"\)/);
});

console.log('TESTS OK: m53UiEditorVisibilityDraft');
