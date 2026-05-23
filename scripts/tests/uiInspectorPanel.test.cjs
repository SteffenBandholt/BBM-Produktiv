const assert = require('node:assert/strict');
const path = require('node:path');
const { importEsmFromFile } = require('./_esmLoader.cjs');

function createFakeDocument() {
  function createElement(tagName) {
    return {
      tagName: String(tagName || '').toUpperCase(),
      children: [],
      style: {},
      attributes: {},
      parentElement: null,
      textContent: '',
      value: '',
      isConnected: false,
      append(...items) { for (const child of items) { child.parentElement = this; child.isConnected = this.isConnected; this.children.push(child); } },
      replaceChildren(...items) { this.children = []; this.append(...items); },
      removeChild(child) { this.children = this.children.filter((e) => e !== child); child.parentElement = null; child.isConnected = false; },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      getAttribute(name) { return this.attributes[name]; },
    };
  }
  const document = { createElement, body: createElement('body') };
  document.body.isConnected = true;
  document.body.append = (...items) => { for (const item of items) { item.parentElement = document.body; item.isConnected = true; document.body.children.push(item); } };
  return document;
}

function collectText(node) {
  if (!node) return '';
  return [String(node.textContent || ''), ...(node.children || []).map(collectText)].join(' ');
}

(async function run() {
  const { createUiInspectorPanel } = await importEsmFromFile(path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorPanel.js'));
  assert.equal(typeof createUiInspectorPanel, 'function');

  const document = createFakeDocument();
  global.document = document;

  let selectedTargetKey = '';
  const panel = createUiInspectorPanel();
  assert.equal(panel.mount(document.body), true);

  const panelNode = document.body.children.find((c) => c.attributes['data-ui-inspector-panel'] === 'true');
  assert.ok(panelNode);
  assert.equal(panelNode.style.pointerEvents, 'auto');

  assert.equal(panel.render({
    selectedId: 'restarbeiten.editbox.kurztext',
    selectedTargetKey: 'restarbeiten.editbox.kurztext::1',
    controls: ['Breite', 'Höhe', 'Sichtbarkeit'],
    targets: [
      { key: 'restarbeiten.main::1', label: 'Main', level: 0 },
      { key: 'restarbeiten.editbox.kurztext::1', label: 'Kurztext #1', level: 1 },
    ],
    onSelectTargetKey: (key) => { selectedTargetKey = key; },
  }), true);

  const selectNode = panelNode.children.find((c) => c.attributes['data-ui-inspector-target-select'] === 'true');
  assert.ok(selectNode);
  selectNode.value = 'restarbeiten.main::1';
  selectNode.onchange();
  assert.equal(selectedTargetKey, 'restarbeiten.main::1');

  const text = collectText(panelNode);
  assert.match(text, /UI-Inspektor/);
  assert.match(text, /restarbeiten\.editbox\.kurztext/);
  assert.match(text, /Breite/);
  assert.match(text, /Höhe/);
  assert.match(text, /Sichtbarkeit/);
  assert.match(text, /Auswahlmodell – noch keine Layoutänderung\./);
  assert.doesNotMatch(text, /Speichern/);
  assert.doesNotMatch(text, /Anwenden/);

  assert.equal(panel.unmount(), true);
  assert.equal(document.body.children.some((c) => c.attributes['data-ui-inspector-panel'] === 'true'), false);

  console.log('ok - uiInspectorPanel.test');
})();
