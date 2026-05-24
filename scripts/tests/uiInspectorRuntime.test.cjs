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
  console.log('ok - uiInspectorRuntime.test');
})();
