const assert = require('node:assert/strict');
const path = require('node:path');
const { importEsmFromFile } = require('./_esmLoader.cjs');

(async function run() {
  const { createUiInspectorRuntime, buildTargets } = await importEsmFromFile(path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorRuntime.js'));
  const raw = [
    { id:'restarbeiten.filterleiste.verortung.feld', key:'restarbeiten.filterleiste.verortung.feld::2', instance:2, element:{} },
    { id:'restarbeiten.main', key:'restarbeiten.main::1', instance:1, element:{} },
    { id:'restarbeiten.filterleiste', key:'restarbeiten.filterleiste::1', instance:1, element:{} },
    { id:'restarbeiten.filterleiste.verortung', key:'restarbeiten.filterleiste.verortung::1', instance:1, element:{} },
    { id:'restarbeiten.filterleiste.verortung.feld', key:'restarbeiten.filterleiste.verortung.feld::1', instance:1, element:{} },
  ];
  const built = buildTargets(raw);
  assert.equal(built.find((x)=>x.id==='restarbeiten.filterleiste').parentId, 'restarbeiten.main');
  assert.equal(built.find((x)=>x.key.endsWith('::1') && x.id.endsWith('.feld')).label, 'Feld #1');
  assert.equal(built.find((x)=>x.key.endsWith('::2') && x.id.endsWith('.feld')).label, 'Feld #2');
  assert.equal(built.find((x)=>x.id==='restarbeiten.filterleiste.verortung').parentId, 'restarbeiten.filterleiste');

  const panelStates = [];
  const fakePanel = {
    mount: () => true,
    unmount: () => true,
    render(state) { panelStates.push({ kind: 'render', state }); return true; },
    clear(state) { panelStates.push({ kind: 'clear', state }); return true; },
  };
  const markers = [{ id: 'restarbeiten.main', key: 'restarbeiten.main::1', instance: 1, element: {} }];
  let selected = '';
  let selectedKey = '';
  const fakeOverlay = {
    mount: () => true,
    unmount: () => true,
    refresh: () => true,
    getTargets: () => markers,
    getSelectedId: () => selected,
    getSelectedTargetKey: () => selectedKey,
    select(key) {
      const match = markers.find((target) => target.key === key);
      if (!match) return false;
      selected = match.id;
      selectedKey = match.key;
      return true;
    },
    clearSelection() {
      selected = '';
      selectedKey = '';
      return true;
    },
  };
  const runtime = createUiInspectorRuntime({ overlay: fakeOverlay, panel: fakePanel });
  assert.equal(runtime.activateOverlay({ ownerDocument: { body: {} } }), true);

  runtime.overlay.select('restarbeiten.main::1');
  assert.equal(runtime.refreshOverlay(), true);
  assert.equal(panelStates.at(-1).kind, 'render');
  assert.ok(Array.isArray(panelStates.at(-1).state.targets));
  assert.equal(panelStates.at(-1).state.targets.length > 0, true);

  assert.equal(runtime.clearSelection(), true);
  assert.equal(panelStates.at(-1).kind, 'clear');
  assert.equal(Array.isArray(panelStates.at(-1).state.targets), true);
  assert.equal(panelStates.at(-1).state.targets.length > 0, true);

  markers.push({ id: 'restarbeiten.filterleiste', key: 'restarbeiten.filterleiste::1', instance: 1, element: {} });
  assert.equal(runtime.refreshOverlay(), true);
  const latestTargets = panelStates.at(-1).state.targets;
  assert.equal(latestTargets.some((target) => target.id === 'restarbeiten.filterleiste'), true);
  console.log('ok - uiInspectorRuntime.test');
})();
