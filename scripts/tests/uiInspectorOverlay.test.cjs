const assert = require('node:assert/strict');
const { createUiInspectorOverlay } = require('../../src/renderer/uiInspector/UiInspectorOverlay');

function createFakeDom() {
  const bodyChildren = [];
  const nodes = [];

  function createElement(tagName) {
    const node = {
      tagName: String(tagName || '').toUpperCase(),
      children: [],
      style: {},
      attributes: {},
      isConnected: false,
      parentElement: null,
      textContent: '',
      append(...items) {
        for (const child of items) {
          child.parentElement = this;
          child.isConnected = this.isConnected;
          this.children.push(child);
        }
      },
      replaceChildren(...items) {
        this.children = [];
        this.append(...items);
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      getAttribute(name) {
        return this.attributes[name];
      },
      removeChild(child) {
        this.children = this.children.filter((entry) => entry !== child);
        child.parentElement = null;
        child.isConnected = false;
      },
    };
    nodes.push(node);
    return node;
  }

  const document = {
    body: createElement('body'),
    createElement,
  };
  document.body.isConnected = true;
  document.body.append = (...items) => {
    for (const item of items) {
      item.parentElement = document.body;
      item.isConnected = true;
      bodyChildren.push(item);
      document.body.children.push(item);
    }
  };

  return { document, nodes, bodyChildren };
}

function createInspectableRoot(document) {
  const nodeA = {
    ownerDocument: document,
    getAttribute(name) {
      if (name === 'data-ui-inspector-id') return 'restarbeiten.header';
      return null;
    },
    getBoundingClientRect() {
      return { left: 10, top: 20, width: 100, height: 40 };
    },
  };
  const nodeB = {
    ownerDocument: document,
    getAttribute(name) {
      if (name === 'data-ui-inspector-id') return 'restarbeiten.liste';
      return null;
    },
    getBoundingClientRect() {
      return { left: 30, top: 80, width: 200, height: 120 };
    },
  };
  return {
    ownerDocument: document,
    classList: { add() {}, remove() {} },
    querySelectorAll(selector) {
      if (selector === '[data-ui-inspector-id]') return [nodeA, nodeB];
      return [];
    },
  };
}

(function run() {
  assert.equal(typeof createUiInspectorOverlay, 'function');

  const { document } = createFakeDom();
  const overlay = createUiInspectorOverlay();
  const root = createInspectableRoot(document);

  assert.equal(overlay.mount(root), true);
  const overlayRoot = document.body.children[0];
  assert.equal(overlayRoot.style.pointerEvents, 'none');
  assert.equal(overlayRoot.children.length, 2);

  const frame = overlayRoot.children[0];
  assert.equal(frame.attributes['data-ui-inspector-overlay-frame'], 'restarbeiten.header');
  assert.equal(frame.children[0].textContent, 'restarbeiten.header');

  assert.equal(overlay.refresh(), true);
  assert.equal(overlayRoot.children.length, 2);

  assert.equal(overlay.unmount(), true);
  assert.equal(document.body.children.length, 0);

  console.log('ok - uiInspectorOverlay.test');
})();
