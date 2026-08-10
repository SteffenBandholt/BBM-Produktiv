"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function createStore(initialState = {}) {
  let state = { ...initialState };
  return {
    getState() {
      return state;
    },
    setState(patch = {}) {
      state = { ...state, ...patch };
      return state;
    },
  };
}

function createFakeDocument() {
  const body = {
    children: [],
    appendChild(node) {
      node.parentElement = this;
      this.children.push(node);
      return node;
    },
    removeChild(node) {
      const index = this.children.indexOf(node);
      if (index >= 0) this.children.splice(index, 1);
      node.parentElement = null;
      return node;
    },
  };

  const doc = {
    body,
    createElement(tagName) {
      return {
        tagName: String(tagName || "").toUpperCase(),
        children: [],
        dataset: {},
        attributes: {},
        style: { cssText: "" },
        disabled: false,
        appendChild(node) {
          node.parentElement = this;
          this.children.push(node);
          return node;
        },
        setAttribute(name, value) {
          this.attributes[name] = String(value);
        },
        getAttribute(name) {
          return this.attributes[name] ?? null;
        },
        addEventListener(type, handler) {
          this.listeners ||= {};
          this.listeners[type] = handler;
        },
        remove() {
          this.parentElement?.removeChild?.(this);
        },
        getBoundingClientRect() {
          return this.rect || { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
        },
      };
    },
    querySelector(selector) {
      if (selector !== "[data-bbm-ui-editor-registry-status]") return null;
      return body.children.find((node) => node.getAttribute?.("data-bbm-ui-editor-registry-status") === "true") || null;
    },
    elementFromPoint(x, y) {
      for (const node of [...body.children].reverse()) {
        const rect = node.getBoundingClientRect?.() || {};
        const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        if (!inside || /pointer-events\s*:\s*none/i.test(node.style?.cssText || "")) continue;
        if (String(node.style?.display || "") === "none") continue;
        return node;
      }
      return null;
    },
  };
  return doc;
}

function place(doc, node, left, top, width = 100, height = 28) {
  node.rect = { left, top, width, height, right: left + width, bottom: top + height };
  doc.body.appendChild(node);
  return node;
}

function assertMidpointHit(doc, target) {
  const rect = target.getBoundingClientRect();
  assert.strictEqual(doc.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2), target);
}

async function runM864GlobalClickBlockerTests(run) {
  const TopsScreen = (await importEsmFromFile(
    path.join(ROOT, "src/renderer/modules/protokoll/screens/TopsScreen.js")
  )).default;
  const navigation = await importEsmFromFile(path.join(ROOT, "src/renderer/app/coreShellNavigation.js"));
  const popupCommon = await importEsmFromFile(path.join(ROOT, "src/renderer/ui/popupCommon.js"));

  await run("M86.4 Protokoll: Loeschen synchronisiert die UI nach Ende des Schreibzustands", async () => {
    const deletedTop = {
      id: 101,
      meeting_id: 21,
      level: 2,
      number: 6,
      title: "M86 Klicktest",
      longtext: "",
      status: "-",
      is_carried_over: 0,
      is_hidden: 0,
      parent_top_id: 10,
    };
    const nextTop = {
      id: 102,
      meeting_id: 21,
      level: 2,
      number: 7,
      title: "Naechster TOP",
      longtext: "",
      status: "-",
      is_carried_over: 0,
      is_hidden: 0,
      parent_top_id: 10,
    };
    const store = createStore({
      projectId: 7,
      meetingId: 21,
      tops: [deletedTop, nextTop],
      selectedTopId: deletedTop.id,
      editor: { title: deletedTop.title, longtext: "", status: "-" },
      isReadOnly: false,
      isWriting: false,
      isMoveMode: true,
    });
    const coreTargets = ["Protokoll beenden", "Schliessen", "+Titel", "+TOP", "Schieben", "Papierkorb"]
      .map((label) => ({ label, disabled: false }));
    const syncStates = [];
    const screen = {
      store,
      commands: {
        async saveDraft() {
          return { ok: true };
        },
        async deleteSelectedTop() {
          store.setState({ tops: [nextTop], selectedTopId: null });
          return { ok: true };
        },
        selectTop(topId) {
          store.setState({ selectedTopId: topId ?? null });
        },
        updateDraft(editor) {
          store.setState({ editor: editor || {} });
        },
        toggleMoveMode(forceValue) {
          store.setState({ isMoveMode: !!forceValue });
        },
      },
      _getDeleteSelectionCandidateId: TopsScreen.prototype._getDeleteSelectionCandidateId,
      async _autoFixNumberGapsAfterDelete() {
        return true;
      },
      _setCreateParentTopId(topId) {
        store.setState({ createParentTopId: topId ?? null });
      },
      _syncScreenState() {
        const busy = !!store.getState().isWriting;
        syncStates.push(busy);
        for (const target of coreTargets) target.disabled = busy;
      },
    };

    await TopsScreen.prototype._handleWorkbenchDelete.call(screen);

    assert.equal(store.getState().isWriting, false);
    assert.equal(store.getState().selectedTopId, nextTop.id);
    assert.equal(store.getState().isMoveMode, false);
    assert.deepEqual(syncStates, [true, false], "die letzte UI-Synchronisierung muss im freigegebenen Zustand laufen");
    for (const target of coreTargets) assert.equal(target.disabled, false, target.label);
  });

  await run("M86.4 Hit-Test: Registry-Hinweis blockiert keinen Kernbutton und wird entfernt", async () => {
    const previousDocument = globalThis.document;
    const previousWindow = globalThis.window;
    const previousSetTimeout = globalThis.setTimeout;
    const doc = createFakeDocument();
    const removalCallbacks = [];
    const coreTargets = [
      place(doc, doc.createElement("button"), 10, 10),
      place(doc, doc.createElement("button"), 120, 10),
      place(doc, doc.createElement("button"), 230, 10),
      place(doc, doc.createElement("button"), 340, 10),
      place(doc, doc.createElement("div"), 10, 60, 430, 32),
    ];
    globalThis.document = doc;
    globalThis.window = { document: doc };
    globalThis.setTimeout = (callback) => {
      removalCallbacks.push(callback);
      return removalCallbacks.length;
    };

    try {
      const result = await navigation.openNativeUiEditor({
        api: {
          async open() {
            return { ok: true, registryRefreshStatus: "current" };
          },
        },
      });
      assert.equal(result.ok, true);
      const status = doc.querySelector("[data-bbm-ui-editor-registry-status]");
      assert.ok(status);
      assert.match(status.style.cssText, /pointer-events:none/);
      for (const target of coreTargets) assertMidpointHit(doc, target);
      assert.equal(removalCallbacks.length, 1);
      removalCallbacks[0]();
      assert.equal(doc.querySelector("[data-bbm-ui-editor-registry-status]"), null);
    } finally {
      globalThis.document = previousDocument;
      globalThis.window = previousWindow;
      globalThis.setTimeout = previousSetTimeout;
    }
  });

  await run("M86.4 Dialogschutz: ein nicht geoeffneter Backdrop ist weder sichtbar noch im Dokument", () => {
    const previousDocument = globalThis.document;
    const doc = createFakeDocument();
    globalThis.document = doc;
    try {
      const overlay = popupCommon.createPopupOverlay();
      assert.equal(overlay.dataset.bbmPopupOverlay, "1");
      assert.equal(overlay.style.display, "none");
      assert.equal(doc.body.children.includes(overlay), false);
      const screenSource = read("src/renderer/modules/protokoll/screens/TopsScreen.js");
      assert.doesNotMatch(screenSource, /\.inert\s*=|setAttribute\(\s*["']inert["']/);
    } finally {
      globalThis.document = previousDocument;
    }
  });

  await run("M86.4 Protokoll-Popups: gemeinsame Flaeche beginnt unter der realen Header-Unterkante", () => {
    const previousDocument = globalThis.document;
    const previousWindow = globalThis.window;
    const doc = createFakeDocument();
    const resizeHandlers = [];
    const header = doc.createElement("header");
    header.rect = { left: 0, top: 0, width: 940, height: 58, right: 940, bottom: 58 };
    doc.querySelector = (selector) =>
      selector === '[data-bbm-tops-screen="true"] [data-bbm-tops-header-v2="true"]'
        ? header
        : null;
    globalThis.document = doc;
    globalThis.window = {
      innerHeight: 500,
      addEventListener(type, handler) {
        if (type === "resize") resizeHandlers.push(handler);
      },
      removeEventListener() {},
    };

    try {
      const overlay = popupCommon.createPopupOverlay();
      assert.equal(overlay.dataset.bbmPopupViewport, "protokoll");
      assert.equal(overlay.style.top, "58px");
      assert.equal(overlay.style.height, "calc(100vh - 58px)");
      assert.equal(overlay.style.padding, "8px 12px");
      assert.equal(overlay.style.overflow, "auto");
      assert.equal(overlay.style.alignItems, "safe center");

      header.rect = { left: 0, top: 0, width: 940, height: 72, right: 940, bottom: 72 };
      assert.equal(resizeHandlers.length, 1);
      resizeHandlers[0]();
      assert.equal(overlay.style.top, "72px");
      assert.equal(overlay.style.height, "calc(100vh - 72px)");

      const mainHeader = doc.createElement("div");
      mainHeader.rect = { left: 0, top: 0, width: 940, height: 60, right: 940, bottom: 60 };
      doc.querySelector = (selector) =>
        selector === '[data-bbm-main-header="true"]' ? mainHeader : null;
      popupCommon.syncPopupOverlayViewport(overlay);
      assert.equal(overlay.dataset.bbmPopupViewport, "app");
      assert.equal(overlay.style.top, "60px");
      assert.equal(overlay.style.height, "calc(100vh - 60px)");
      assert.equal(overlay.style.padding, "8px 12px");

      doc.querySelector = () => null;
      popupCommon.syncPopupOverlayViewport(overlay);
      assert.equal(overlay.dataset.bbmPopupViewport, "window");
      assert.equal(overlay.style.top, "0");
      assert.equal(overlay.style.height, "100vh");
      assert.equal(overlay.style.padding, "12px");
    } finally {
      globalThis.document = previousDocument;
      globalThis.window = previousWindow;
    }
  });

  await run("M86.4 Editorfokus: der gemeinsame DEV-Launcher gibt seinen Button nach dem Start wieder frei", async () => {
    const doc = createFakeDocument();
    const host = doc.createElement("div");
    let editorOpened = 0;
    const button = await navigation.installDevelopmentUiEditorOpenButton({
      host,
      scopeId: "",
      doc,
      buildApi: { appGetBuildChannel: async () => ({ ok: true, channel: "DEV" }) },
      uiEditorApi: {
        async open() {
          editorOpened += 1;
          return { ok: true, registryRefreshStatus: "current" };
        },
        async sendTargetEvent() {
          return { ok: true };
        },
      },
    });

    await button.listeners.click();

    assert.equal(editorOpened, 1);
    assert.equal(button.disabled, false);
  });

  await run("M86.4 Start- und Modulguard: zwei Acceptance-Laeufe und Restarbeiten bleiben abgesichert", () => {
    const acceptanceRunner = read("scripts/runIsolatedUiEditorAcceptance.cjs");
    const restarbeitenModule = read("src/renderer/modules/restarbeiten/index.js");
    const restarbeitenFilterbar = read("src/renderer/modules/restarbeiten/RestarbeitenFilterbar.js");
    const restarbeitenScreen = read("src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js");
    const mainHeader = read("src/renderer/ui/MainHeader.js");
    assert.match(acceptanceRunner, /async function runAcceptance\(\{ runs = 2,/);
    assert.match(acceptanceRunner, /if \(runs !== 2\) throw new Error\("UI_EDITOR_ACCEPTANCE_REQUIRES_TWO_RUNS"\)/);
    assert.match(restarbeitenModule, /hideSidebar:\s*true/);
    assert.match(restarbeitenScreen, /uiEditorScopeId\s*=\s*"restarbeiten\.header\.root"/);
    assert.match(mainHeader, /installDevelopmentUiEditorOpenButton/);
    assert.doesNotMatch(`${restarbeitenModule}\n${restarbeitenFilterbar}`, /\.inert\s*=|pointer-events\s*:\s*none/);
    assert.doesNotMatch(mainHeader, /\.inert\s*=/);
  });
}

if (require.main === module) {
  runM864GlobalClickBlockerTests(async (_name, fn) => fn()).then(() => {
    if (!process.exitCode) console.log("m86-4GlobalClickBlocker.test.cjs passed");
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { runM864GlobalClickBlockerTests };
