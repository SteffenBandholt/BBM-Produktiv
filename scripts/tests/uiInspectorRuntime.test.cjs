const assert = require('node:assert/strict');
const path = require('node:path');
const { importEsmFromFile } = require('./_esmLoader.cjs');

(async function run(){
 const { buildTargets } = await importEsmFromFile(path.join(__dirname,'../../src/renderer/uiInspector/UiInspectorRuntime.js'));
 const mk=(id)=>({getAttribute:(n)=>n==='data-ui-inspector-id'?id:null});
 const root={querySelectorAll:()=>[mk('restarbeiten.filterleiste.verortung'),mk('restarbeiten.filterleiste.verortung.feld'),mk('restarbeiten.filterleiste.verortung.feld')]};
 const targets=buildTargets(root);
 assert.equal(targets.length,3);
 assert.equal(targets[0].id,'restarbeiten.filterleiste.verortung');
 assert.equal(targets[1].label,'Feld #1');
 assert.equal(targets[2].label,'Feld #2');
 assert.equal(targets[2].key,'restarbeiten.filterleiste.verortung.feld::2');
 assert.equal(targets[2].parentId,'restarbeiten.filterleiste.verortung');
 console.log('ok - uiInspectorRuntime.test');
})();
