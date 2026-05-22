const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { importEsmFromFile } = require('./_esmLoader.cjs');

(async function run() {
  const source = fs.readFileSync(path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorTemporaryStyles.js'), 'utf8');
  assert.doesNotMatch(source, /localStorage|ipc|save/i);
  const { createUiInspectorTemporaryStyles } = await importEsmFromFile(path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorTemporaryStyles.js'));
  const styles = createUiInspectorTemporaryStyles();
  const a = { style: { cssText: '', width: '', height: '', marginLeft: '', marginTop: '', visibility: '' } };
  const b = { style: { cssText: 'width:10px;', width: '10px', height: '', marginLeft: '', marginTop: '', visibility: '' } };

  styles.applyDelta(a, 'width', 5, 'a'); assert.equal(a.style.width, '5px');
  styles.applyDelta(a, 'height', 5, 'a'); assert.equal(a.style.height, '5px');
  styles.applyDelta(a, 'marginLeft', 5, 'a'); assert.equal(a.style.marginLeft, '5px');
  styles.applyDelta(a, 'marginTop', 5, 'a'); assert.equal(a.style.marginTop, '5px');
  styles.toggleVisibility(a, 'a'); assert.equal(a.style.visibility, 'hidden');
  styles.toggleVisibility(a, 'a'); assert.equal(a.style.visibility, 'visible');
  assert.ok(styles.getPreviewState('a'));

  styles.applyDelta(b, 'width', 5, 'b');
  styles.resetElement(b, 'b');
  assert.equal(b.style.cssText, 'width:10px;');

  styles.resetAll();
  assert.equal(a.style.cssText, '');
  assert.equal(styles.getPreviewState('a'), null);
  console.log('ok - uiInspectorTemporaryStyles.test');
})();
