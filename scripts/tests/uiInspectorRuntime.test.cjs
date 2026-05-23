const assert = require('node:assert/strict');
const path = require('node:path');
const { importEsmFromFile } = require('./_esmLoader.cjs');

function node(id) {
  return {
    getAttribute: (n) => n === 'data-ui-inspector-id' ? id : null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 10, height: 10 }),
  };
}

(async function run() {
  const mod = await importEsmFromFile(path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorRuntime.js'));
  const root = { querySelectorAll: () => [
    node('restarbeiten.editbox.kurztext.label'), node('restarbeiten.main'), node('restarbeiten.filterleiste.verortung.feld'), node('restarbeiten.header'),
    node('restarbeiten.filterleiste.verortung'), node('restarbeiten.filterleiste.klassenfilter.feld'), node('restarbeiten.filterleiste.klassenfilter'),
    node('restarbeiten.filterleiste.verortung.feld'), node('restarbeiten.filterleiste.meta'), node('restarbeiten.liste.metabereich'), node('restarbeiten.liste'),
    node('restarbeiten.filterleiste'), node('restarbeiten.liste.textbereich'), node('restarbeiten.editbox'), node('restarbeiten.editbox.header'),
    node('restarbeiten.editbox.verortung'), node('restarbeiten.editbox.kurztext'), node('restarbeiten.editbox.kurztext.restzeichen'), node('restarbeiten.editbox.langtext'),
    node('restarbeiten.editbox.langtext.label'), node('restarbeiten.editbox.langtext.restzeichen'), node('restarbeiten.editbox.meta'),
  ] };

  const targets = mod.buildTargets(root);
  assert.deepEqual(targets.map((t) => t.id + (t.id.endsWith('.feld') ? ` #${t.instance}` : '')), [
    'restarbeiten.header', 'restarbeiten.main', 'restarbeiten.filterleiste', 'restarbeiten.filterleiste.klassenfilter', 'restarbeiten.filterleiste.klassenfilter.feld #1', 'restarbeiten.filterleiste.verortung', 'restarbeiten.filterleiste.verortung.feld #1', 'restarbeiten.filterleiste.verortung.feld #2', 'restarbeiten.filterleiste.meta', 'restarbeiten.liste', 'restarbeiten.liste.textbereich', 'restarbeiten.liste.metabereich', 'restarbeiten.editbox', 'restarbeiten.editbox.header', 'restarbeiten.editbox.verortung', 'restarbeiten.editbox.kurztext', 'restarbeiten.editbox.kurztext.label', 'restarbeiten.editbox.kurztext.restzeichen', 'restarbeiten.editbox.langtext', 'restarbeiten.editbox.langtext.label', 'restarbeiten.editbox.langtext.restzeichen', 'restarbeiten.editbox.meta',
  ]);
  assert.equal(targets.find((t) => t.id === 'restarbeiten.filterleiste').parentId, 'restarbeiten.main');
  assert.equal(targets.find((t) => t.id === 'restarbeiten.editbox.kurztext.label').level, 2);
  assert.equal(targets.find((t) => t.key.endsWith('::2') && t.id.endsWith('.feld')).label, 'Feld #2');

  let selectedTargetKey = '';
  const fakeOverlay = {
    mount: () => true,
    unmount: () => true,
    refresh: () => true,
    select: (key) => { selectedTargetKey = key; return true; },
    clearSelection: () => true,
    getSelectedId: () => '',
    getSelectedTarget: () => null,
    getTargets: () => [{ key: 'restarbeiten.main::1', id: 'restarbeiten.main', label: 'Main', level: 0 }],
  };
  let panelState = null;
  const fakePanel = {
    mount: () => true,
    unmount: () => true,
    clear: () => true,
    render: (state) => { panelState = state; return true; },
  };

  const runtime = mod.createUiInspectorRuntime({ overlay: fakeOverlay, panel: fakePanel });
  assert.equal(runtime.activateOverlay({ ownerDocument: { body: {} }, querySelectorAll: () => [] }), true);
  assert.equal(typeof panelState.onSelectTargetKey, 'function');
  panelState.onSelectTargetKey('restarbeiten.main::1');
  assert.equal(selectedTargetKey, 'restarbeiten.main::1');

  console.log('ok - uiInspectorRuntime.test');
})();
