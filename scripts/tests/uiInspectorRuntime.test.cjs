const assert = require('node:assert/strict');
const path = require('node:path');
const { importEsmFromFile } = require('./_esmLoader.cjs');

(async function run(){
 const { buildTargets, createUiInspectorRuntime } = await importEsmFromFile(path.join(__dirname,'../../src/renderer/uiInspector/UiInspectorRuntime.js'));
 const mk=(id)=>({getAttribute:(n)=>n==='data-ui-inspector-id'?id:null});
 const root={querySelectorAll:()=>[
  mk('restarbeiten.editbox.langtext.restzeichen'),
  mk('restarbeiten.filterleiste.verortung.feld'),
  mk('restarbeiten.editbox.meta'),
  mk('restarbeiten.filterleiste.meta'),
  mk('restarbeiten.main'),
  mk('restarbeiten.filterleiste.verortung'),
  mk('restarbeiten.filterleiste.verortung.feld'),
  mk('restarbeiten.editbox.kurztext.label'),
  mk('restarbeiten.liste.metabereich'),
  mk('restarbeiten.editbox.langtext'),
  mk('restarbeiten.editbox'),
  mk('restarbeiten.filterleiste'),
  mk('restarbeiten.liste.textbereich'),
  mk('restarbeiten.liste'),
  mk('restarbeiten.filterleiste.klassenfilter'),
  mk('restarbeiten.header'),
  mk('restarbeiten.editbox.header'),
  mk('restarbeiten.editbox.verortung'),
  mk('restarbeiten.editbox.kurztext'),
  mk('restarbeiten.editbox.kurztext.restzeichen'),
  mk('restarbeiten.editbox.langtext.label'),
 ]};
 const targets=buildTargets(root);
 assert.equal(targets.length,21);
 assert.deepEqual(targets.map((t)=>t.id), [
  'restarbeiten.header',
  'restarbeiten.main',
  'restarbeiten.filterleiste',
  'restarbeiten.filterleiste.klassenfilter',
  'restarbeiten.filterleiste.verortung',
  'restarbeiten.filterleiste.verortung.feld',
  'restarbeiten.filterleiste.verortung.feld',
  'restarbeiten.filterleiste.meta',
  'restarbeiten.liste',
  'restarbeiten.liste.textbereich',
  'restarbeiten.liste.metabereich',
  'restarbeiten.editbox',
  'restarbeiten.editbox.header',
  'restarbeiten.editbox.verortung',
  'restarbeiten.editbox.kurztext',
  'restarbeiten.editbox.kurztext.label',
  'restarbeiten.editbox.kurztext.restzeichen',
  'restarbeiten.editbox.langtext',
  'restarbeiten.editbox.langtext.label',
  'restarbeiten.editbox.langtext.restzeichen',
  'restarbeiten.editbox.meta',
 ]);
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
