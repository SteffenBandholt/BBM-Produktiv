const assert = require('node:assert/strict');
const path = require('node:path');
const { importEsmFromFile } = require('./_esmLoader.cjs');

(async function run(){
 const { buildTargets, createUiInspectorRuntime } = await importEsmFromFile(path.join(__dirname,'../../src/renderer/uiInspector/UiInspectorRuntime.js'));
 const mk=(id)=>({getAttribute:(n)=>n==='data-ui-inspector-id'?id:null});
 const root={querySelectorAll:()=>[
  mk('restarbeiten.filterleiste.verortung.feld'),
  mk('restarbeiten.main'),
  mk('restarbeiten.liste.metabereich'),
  mk('restarbeiten.filterleiste'),
  mk('restarbeiten.filterleiste.verortung'),
  mk('restarbeiten.liste.textbereich'),
  mk('restarbeiten.liste'),
  mk('restarbeiten.filterleiste.verortung.feld'),
 ]};
 const targets=buildTargets(root);
 assert.equal(targets.length,8);
 assert.equal(targets[0].id,'restarbeiten.main');
 assert.equal(targets.findIndex((t)=>t.id==='restarbeiten.filterleiste') < targets.findIndex((t)=>t.id==='restarbeiten.filterleiste.verortung'), true);
 assert.equal(targets.findIndex((t)=>t.id==='restarbeiten.filterleiste.verortung') < targets.findIndex((t)=>t.id==='restarbeiten.filterleiste.verortung.feld'), true);
 assert.equal(targets.findIndex((t)=>t.id==='restarbeiten.liste') < targets.findIndex((t)=>t.id==='restarbeiten.liste.textbereich'), true);
 assert.equal(targets.findIndex((t)=>t.id==='restarbeiten.liste') < targets.findIndex((t)=>t.id==='restarbeiten.liste.metabereich'), true);
 const feldTargets = targets.filter((t)=>t.id==='restarbeiten.filterleiste.verortung.feld');
 assert.equal(feldTargets[0].label,'Feld #1');
 assert.equal(feldTargets[1].label,'Feld #2');

 const runtime = createUiInspectorRuntime();
 assert.deepEqual(runtime.getAllowedControlsForSelectedId('restarbeiten.liste.textbereich'), ['Breite', 'Höhe', 'Abstand außen', 'Abstand innen', 'Sichtbarkeit']);
 assert.deepEqual(runtime.getAllowedControlsForSelectedId('restarbeiten.liste.metabereich'), ['Breite', 'Höhe', 'Abstand außen', 'Abstand innen', 'Sichtbarkeit']);
 console.log('ok - uiInspectorRuntime.test');
})();
