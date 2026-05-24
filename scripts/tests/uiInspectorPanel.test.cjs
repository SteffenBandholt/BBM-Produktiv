const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { importEsmFromFile } = require('./_esmLoader.cjs');

function createFakeElement(tagName, document) {
  return {
    tagName: String(tagName || '').toUpperCase(),
    children: [],
    style: { cssText: '' },
    attributes: {},
    parentElement: null,
    ownerDocument: document,
    textContent: '',
    isConnected: false,
    onclick: null,
    append(...items) {
      for (const child of items) {
        if (child && typeof child === 'object') {
          child.parentElement = this;
          child.ownerDocument = this.ownerDocument;
          child.isConnected = this.isConnected;
        }
        this.children.push(child);
      }
    },
    replaceChildren(...items) {
      this.children = [];
      this.append(...items);
    },
    removeChild(child) {
      this.children = this.children.filter((entry) => entry !== child);
      if (child && typeof child === 'object') {
        child.parentElement = null;
        child.isConnected = false;
      }
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return this.attributes[name];
    },
    click() {
      this.onclick?.({
        preventDefault() {},
        stopPropagation() {},
        stopImmediatePropagation() {},
      });
    },
  };
}

function createFakeDocument() {
  const document = {
    createElement(tag) {
      return createFakeElement(tag, document);
    },
    body: null,
  };

  document.body = createFakeElement('body', document);
  document.body.isConnected = true;
  document.body.append = (...items) => {
    for (const item of items) {
      if (item && typeof item === 'object') {
        item.parentElement = document.body;
        item.ownerDocument = document;
        item.isConnected = true;
      }
      document.body.children.push(item);
    }
  };
  return document;
}

function collectText(node) {
  if (!node) return '';
  return [String(node.textContent || ''), ...(node.children || []).map(collectText)].join(' ');
}

function findNodes(node, predicate, acc = []) {
  if (!node || typeof node !== 'object') return acc;
  if (predicate(node)) acc.push(node);
  for (const child of Array.isArray(node.children) ? node.children : []) {
    findNodes(child, predicate, acc);
  }
  return acc;
}

function findButtonByText(root, text) {
  return (
    findNodes(root, (node) => node?.tagName === 'BUTTON' && String(node?.textContent || '').trim() === String(text))[0] ||
    null
  );
}

(async function run() {
  const panelPath = path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorPanel.js');
  const panelSource = fs.readFileSync(panelPath, 'utf8');
  assert.doesNotMatch(panelSource, /Speichern|Anwenden|Übernehmen|Persistieren/);
  assert.match(panelSource, /Bereichstyp/);
  assert.match(panelSource, /Reset ausgewählt/);
  assert.match(panelSource, /Alles zurücksetzen/);

  const { createUiInspectorPanel } = await importEsmFromFile(panelPath);
  assert.equal(typeof createUiInspectorPanel, 'function');

  const document = createFakeDocument();
  const previousDocument = globalThis.document;
  globalThis.document = document;

  try {
    const panel = createUiInspectorPanel();
    assert.equal(panel.mount(document.body), true);

    const panelNode = document.body.children.find((c) => c.attributes['data-ui-inspector-panel'] === 'true');
    assert.ok(panelNode);
    assert.equal(panelNode.style.pointerEvents, 'auto');

    assert.equal(
      panel.render({
        selectedId: 'restarbeiten.filterleiste.verortung',
        selectedKind: 'Gruppe',
        controls: [
          { label: 'Breite', key: 'width', kind: 'delta', step: 5 },
          { label: 'Höhe', key: 'height', kind: 'delta', step: 5 },
          { label: 'Position X', key: 'translateX', kind: 'delta', step: 5 },
          { label: 'Position Y', key: 'translateY', kind: 'delta', step: 5 },
          { label: 'Abstand außen oben', key: 'marginTop', kind: 'delta', step: 5 },
          { label: 'Abstand innen links', key: 'paddingLeft', kind: 'delta', step: 5 },
          { label: 'Sichtbarkeit', key: 'visibility', kind: 'toggle' },
        ],
        note: 'Temporäre Vorschau – keine Speicherung.',
        actions: {},
      }),
      true
    );

    const text = collectText(panelNode);
    assert.match(text, /UI-Inspektor/);
    assert.match(text, /Ausgewählter Bereich: restarbeiten\.filterleiste\.verortung/);
    assert.match(text, /Bereichstyp: Gruppe/);
    assert.match(text, /Temporäre Vorschau – keine Speicherung\./);
    assert.doesNotMatch(text, /Speichern/);
    assert.doesNotMatch(text, /Anwenden/);
    assert.doesNotMatch(text, /Übernehmen/);
    assert.doesNotMatch(text, /Persistieren/);

    assert.ok(findButtonByText(panelNode, 'Breite -5'));
    assert.ok(findButtonByText(panelNode, 'Breite +5'));
    assert.ok(findButtonByText(panelNode, 'Höhe -5'));
    assert.ok(findButtonByText(panelNode, 'Höhe +5'));
    assert.ok(findButtonByText(panelNode, 'Position X -5'));
    assert.ok(findButtonByText(panelNode, 'Position X +5'));
    assert.ok(findButtonByText(panelNode, 'Position Y -5'));
    assert.ok(findButtonByText(panelNode, 'Position Y +5'));
    assert.ok(findButtonByText(panelNode, 'Abstand außen oben -5'));
    assert.ok(findButtonByText(panelNode, 'Abstand innen links +5'));
    assert.ok(findButtonByText(panelNode, 'Sichtbarkeit umschalten'));
    assert.ok(findButtonByText(panelNode, 'Reset ausgewählt'));
    assert.ok(findButtonByText(panelNode, 'Alles zurücksetzen'));

    assert.equal(
      panel.render({
        selectedId: 'restarbeiten.editbox.kurztext',
        selectedKind: 'Feld',
        controls: [
          { label: 'Breite', key: 'width', kind: 'delta', step: 5 },
          { label: 'Höhe', key: 'height', kind: 'delta', step: 5 },
          { label: 'Position X', key: 'translateX', kind: 'delta', step: 5 },
          { label: 'Position Y', key: 'translateY', kind: 'delta', step: 5 },
          { label: 'Schriftgröße', key: 'fontSize', kind: 'delta', step: 1 },
          { label: 'Abstand außen links', key: 'marginLeft', kind: 'delta', step: 5 },
          { label: 'Abstand außen oben', key: 'marginTop', kind: 'delta', step: 5 },
          { label: 'Sichtbarkeit', key: 'visibility', kind: 'toggle' },
        ],
        note: 'Temporäre Vorschau – keine Speicherung.',
        actions: {},
      }),
      true
    );

    const fieldText = collectText(panelNode);
    assert.match(fieldText, /Bereichstyp: Feld/);
    assert.ok(findButtonByText(panelNode, 'Schriftgröße -1'));
    assert.ok(findButtonByText(panelNode, 'Schriftgröße +1'));
    assert.ok(findButtonByText(panelNode, 'Abstand außen links +5'));
    assert.ok(findButtonByText(panelNode, 'Reset ausgewählt'));

    assert.equal(panel.unmount(), true);
    assert.equal(document.body.children.some((c) => c.attributes['data-ui-inspector-panel'] === 'true'), false);

    const runtimeDocument = createFakeDocument();
    globalThis.document = runtimeDocument;
    const { createUiInspectorRuntime } = await importEsmFromFile(path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorRuntime.js'));
    const runtime = createUiInspectorRuntime();
    const rootNodes = [
      {
        getAttribute: (n) => (n === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.verortung' : null),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 200 }),
        style: {
          cssText:
            'width: 300px; height: 200px; margin-top: 4px; margin-right: 6px; margin-bottom: 8px; margin-left: 10px; padding-top: 1px; padding-right: 2px; padding-bottom: 3px; padding-left: 4px;',
        },
      },
      {
        getAttribute: (n) => (n === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.verortung.feld' : null),
        getBoundingClientRect: () => ({ left: 20, top: 20, width: 100, height: 40 }),
        style: { cssText: 'width: 100px; height: 40px; margin-top: 3px; margin-left: 2px; font-size: 12px;' },
      },
    ];
    const root = {
      ownerDocument: runtimeDocument,
      querySelectorAll: (sel) => (sel === '[data-ui-inspector-id]' ? rootNodes : []),
    };
    assert.equal(runtime.activateOverlay(root), true);
    assert.equal(runtime.overlay.select('restarbeiten.filterleiste.verortung'), true);
    assert.equal(runtime.refreshOverlay(), true);
    const mountedPanel = runtimeDocument.body.children.find((c) => c.attributes['data-ui-inspector-panel'] === 'true');
    assert.ok(mountedPanel);
    assert.match(collectText(mountedPanel), /restarbeiten\.filterleiste\.verortung/);
    assert.match(collectText(mountedPanel), /Bereichstyp: Gruppe/);
    assert.match(collectText(mountedPanel), /Position X \+5/);
    assert.match(collectText(mountedPanel), /Position Y \+5/);
    assert.match(collectText(mountedPanel), /Temporäre Vorschau – keine Speicherung\./);
    assert.doesNotMatch(collectText(mountedPanel), /Speichern|Anwenden|Übernehmen|Persistieren/);
    assert.equal(runtime.deactivateOverlay(), true);
    assert.equal(runtimeDocument.body.children.some((c) => c.attributes['data-ui-inspector-panel'] === 'true'), false);

    console.log('ok - uiInspectorPanel.test');
  } finally {
    globalThis.document = previousDocument;
  }
})();
