const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { importEsmFromFile } = require('./_esmLoader.cjs');

function mkEl(id){return {attrs:{'data-ui-inspector-id':id},style:{cssText:'',width:'',height:'',marginLeft:'',marginTop:'',visibility:''},getAttribute(n){return this.attrs[n];}}}

(async function run(){
  const runtimePath = path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorRuntime.js');
  const runtimeSource = fs.readFileSync(runtimePath,'utf8');
  assert.doesNotMatch(runtimeSource,/localStorage|ipc|save/i);
  const { createUiInspectorRuntime } = await importEsmFromFile(runtimePath);

  const target = mkEl('restarbeiten.editbox.kurztext');
  const root = {
    ownerDocument:{body:{}},
    querySelector(sel){
      if (sel.includes('restarbeiten.editbox.kurztext')) return target;
      if (sel.includes('restarbeiten.filterleiste.verortung')) return target;
      return null;
    },
    querySelectorAll(sel){
      if (sel !== '[data-ui-inspector-id]') return [];
      return [
        { getAttribute: () => 'restarbeiten.filterleiste.verortung' },
        { getAttribute: () => 'restarbeiten.editbox.kurztext' },
        { getAttribute: () => 'restarbeiten.editbox.kurztext' },
      ];
    }
  };
  let panelState = null;
  const panel = { mount(){return true;}, unmount(){return true;}, clear(){return true;}, render(s){panelState=s;return true;} };
  const overlay = { sid:'', mount(_r,o){ this.onSelect=o.onSelect; this.onClearSelection=o.onClearSelection; return true;}, unmount(){return true;}, refresh(){return true;}, getSelectedId(){return this.sid;}, clearSelection(){this.sid=''; this.onClearSelection?.(); return true;} };

  const rt = createUiInspectorRuntime({overlay,panel});
  assert.deepEqual(rt.getAllowedControlsForSelectedId('restarbeiten.filterleiste.verortung'), ['Breite', 'Höhe', 'Abstand links', 'Abstand oben', 'Sichtbarkeit']);
  assert.deepEqual(rt.getAllowedControlsForSelectedId('restarbeiten.filterleiste.klassenfilter'), ['Breite', 'Höhe', 'Abstand links', 'Abstand oben', 'Sichtbarkeit']);
  assert.deepEqual(rt.getAllowedControlsForSelectedId('restarbeiten.filterleiste.verortung.feld'), ['Breite', 'Höhe', 'Abstand links', 'Abstand oben', 'Sichtbarkeit']);
  assert.deepEqual(rt.getAllowedControlsForSelectedId('restarbeiten.liste.metabereich'), ['Breite', 'Höhe', 'Abstand links', 'Abstand oben', 'Sichtbarkeit']);
  assert.deepEqual(rt.getAllowedControlsForSelectedId('restarbeiten.liste.textbereich'), ['Breite', 'Höhe', 'Abstand links', 'Abstand oben', 'Sichtbarkeit']);
  assert.equal(rt.activateOverlay(root), true);
  overlay.sid = 'restarbeiten.editbox.kurztext'; overlay.onSelect(overlay.sid);
  assert.deepEqual(panelState.availableTargets, ['restarbeiten.editbox.kurztext', 'restarbeiten.filterleiste.verortung']);
  panelState.onSelectTarget('restarbeiten.filterleiste.verortung');
  assert.equal(panelState.selectedId, 'restarbeiten.filterleiste.verortung');
  panelState.onControl('width.increase');
  assert.equal(target.style.width, '5px');
  panelState.onControl('reset');
  assert.equal(target.style.cssText, '');
  rt.deactivateOverlay();
  assert.equal(target.style.cssText, '');
  console.log('ok - uiInspectorRuntime.test');
})();
