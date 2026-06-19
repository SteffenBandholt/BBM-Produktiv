const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const RUNTIME_PATH = path.join(__dirname, "../../src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
const PREVIEW_RUNTIME_BRIDGE_PATH = path.join(__dirname, "../../src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js");
const PANEL_RUNTIME_BRIDGE_PATH = path.join(__dirname, "../../src/renderer/uiEditor/uiEditorKitPanelRuntimeBridge.js");
const HIDDEN_ELEMENTS_RUNTIME_BRIDGE_PATH = path.join(__dirname, "../../src/renderer/uiEditor/uiEditorKitHiddenElementsRuntimeBridge.js");
const DRAG_RUNTIME_BRIDGE_PATH = path.join(__dirname, "../../src/renderer/uiEditor/uiEditorKitDragRuntimeBridge.js");
const BBM_REGISTRY_PATH = path.join(__dirname, "../../src/renderer/uiEditor/bbmUiEditorRegistry.js");
const CORE_SHELL_PATH = path.join(__dirname, "../../src/renderer/app/CoreShell.js");
const HOST_CONTRACT_PATH = path.join(__dirname, "../../src/renderer/editorRuntime/host/bbmEditorHostAdapterContract.js");
const RESTARBEITEN_HOST_ADAPTER_PATH = path.join(
  __dirname,
  "../../src/renderer/modules/restarbeiten/editor/restarbeitenMainUiHostAdapter.js"
);
const CSS_PATH = path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.css");
const PACKAGE_PATH = path.join(__dirname, "../../package.json");
const SWITCH_COMMAND_LAUNCHER_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_LAUNCHER_REFERENZSTAND.md"
);
const SURFACE_GESAMT_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_READONLY_GESAMT_REFERENZSTAND.md"
);
const SURFACE_INTEGRATION_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_READONLY_INTEGRATION_CHECK.md"
);
const SURFACE_NEXT_PHASE_MATRIX_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_NEXT_PHASE_FREIGABEMATRIX.md"
);
const PDF_PLAN_BERATUNG_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_PDF_PLAN_SURFACE_READONLY_BEWERTUNG.md"
);
const SURFACE_POLICY_FREIGABE_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_POLICY_FREIGABEVORLAGE.md"
);
const PLAN_CANVAS_POLICY_REFERENCE_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_POLICY_REFERENZSTAND.md"
);
const PLAN_CANVAS_SICHTPRUEFUNG_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_SICHTPRUEFUNG.md"
);
const SURFACE_PHASE_ABNAHME_REFERENZ_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_READONLY_PHASE_ABNAHME_REFERENZSTAND.md"
);
const SURFACE_SWITCHING_KONZEPT_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_SWITCHING_KONZEPT_OHNE_UMSETZUNG.md"
);
const SURFACE_AUSWAHL_KONTEXT_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_AUSWAHL_KONTEXT_ENTSCHEIDUNG.md"
);
const SURFACE_AUSWAHL_KONTEXT_REFERENZ_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_AUSWAHL_KONTEXT_REFERENZSTAND.md"
);
const SURFACE_AUSWAHL_READONLY_HINT_REFERENZ_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_AUSWAHL_READONLY_KONTEXT_HINWEIS_REFERENZSTAND.md"
);
const UI_EDITOR_FOUNDATIONS_SURFACE_HINT_CHECK_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_GRUNDLAGEN_SURFACE_HINWEIS_ABSCHLUSSCHECK.md"
);
const UI_EDITOR_PANEL_STATUS_LINE_REFERENCE_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_PANEL_BEDIENZUSTAND_STATUSZEILE_REFERENZSTAND.md"
);
const UI_EDITOR_HINT_INFOTEXT_DRAFT_PREVIEW_REFERENCE_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_HINWEIS_INFOTEXT_ENTWURF_PREVIEW_REFERENZSTAND.md"
);
const SURFACE_AUSWAHL_NO_ACTIVE_SWITCH_GUARDRAILS_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_AUSWAHL_KEINE_AKTIVE_UMSCHALTUNG_GUARDRAILS.md"
);
const UI_EDITOR_MISSING_FOUNDATIONS_STOP_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_FEHLENDE_GRUNDLAGEN_STOPP_ENTSCHEIDUNG.md"
);
const UI_EDITOR_FOUNDATIONS_RELEASE_DECISION_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_GRUNDLAGEN_FREIGABEENTSCHEIDUNG.md"
);
const UI_EDITOR_FOUNDATIONS_NEEDS_ANALYSIS_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_GRUNDLAGEN_BEDARFSANALYSE.md"
);
const UI_EDITOR_BAUPLAN_DOC_PATH = path.join(__dirname, "../../docs/EDITOR_BAUPLAN.md");
const UI_EDITOR_TARGET_APP_BINDING_DOC_PATH = path.join(__dirname, "../../docs/ZIEL_APP_ANBINDUNG.md");
const UI_EDITOR_ELEMENT_CATALOG_DOC_PATH = path.join(__dirname, "../../docs/UI_ELEMENT_KATALOG.md");
const UI_EDITOR_BUILD_RULES_DOC_PATH = path.join(__dirname, "../../docs/UI_BAU_UND_PRUEFREGELN.md");
const UI_EDITOR_PDF_DESIGN_DECISION_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md"
);
const SURFACE_FREIGABE_KANDIDAT_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_FREIGABE_KANDIDAT_PDF_PLAN_PAGE_1.md"
);
const PDF_PAGE_SICHTPRUEFUNG_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_SICHTPRUEFUNG.md"
);
const PDF_PAGE_HINT_REFERENCE_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_HINWEIS_REFERENZSTAND.md"
);
const PDF_PAGE_MANUAL_SICHTPRUEFUNG_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_PDF_PLAN_PAGE_1_MANUELLE_SICHTPRUEFUNG.md"
);
const RESTARBEITEN_ZIELROUTE_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_RESTARBEITEN_ZIELROUTE_SICHTPRUEFUNG.md"
);
const PDF_PAGE_ABNAHME_REFERENZ_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_ABNAHME_REFERENZSTAND.md"
);
const PLAN_CANVAS_CANDIDATE_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_FREIGABE_KANDIDAT_PLAN_CANVAS_DEFAULT.md"
);
const SURFACE_INFO_ENTSCHEIDUNG_DOC_PATH = path.join(
  __dirname,
  "../../docs/UI_EDITOR_SURFACE_INFO_VERHALTEN_ENTSCHEIDUNG.md"
);

function createFakeDocument() {
  const createNode = (tag, doc) => {
    const listeners = {};
    const node = {
      tagName: String(tag || "").toUpperCase(),
      ownerDocument: doc,
      children: [],
      parentNode: null,
      parentElement: null,
      attributes: {},
      dataset: {},
      style: {},
      className: "",
      textContent: "",
      disabled: false,
      clientWidth: 640,
      clientHeight: 480,
      offsetWidth: 120,
      offsetHeight: 40,
      appendChild(child) {
        if (child) {
          child.parentNode = this;
          child.parentElement = this;
          this.children.push(child);
        }
        return child;
      },
      append(...children) {
        children.forEach((child) => this.appendChild(child));
      },
      removeChild(child) {
        this.children = this.children.filter((entry) => entry !== child);
        if (child) {
          child.parentNode = null;
          child.parentElement = null;
        }
        return child;
      },
      remove() {
        this.parentElement?.removeChild?.(this);
      },
      setAttribute(name, value) {
        const normalizedName = String(name);
        const normalizedValue = String(value);
        this.attributes[normalizedName] = normalizedValue;
        if (normalizedName.startsWith("data-")) {
          const key = normalizedName
            .slice(5)
            .replace(/-([a-z])/g, (_match, char) => char.toUpperCase());
          this.dataset[key] = normalizedValue;
        }
      },
      getAttribute(name) {
        return Object.hasOwn(this.attributes, String(name)) ? this.attributes[String(name)] : null;
      },
      addEventListener(type, handler) {
        listeners[type] ||= [];
        listeners[type].push(handler);
      },
      removeEventListener(type, handler) {
        if (!listeners[type]) return;
        listeners[type] = listeners[type].filter((entry) => entry !== handler);
      },
      dispatchEvent(event = {}) {
        const normalizedEvent = event;
        normalizedEvent.target ||= this;
        const type = String(normalizedEvent.type || "");
        for (const handler of listeners[type] || []) handler.call(this, normalizedEvent);
        return !normalizedEvent.defaultPrevented;
      },
      closest(selector) {
        let current = this;
        while (current) {
          if (matchesSelector(current, selector)) return current;
          current = current.parentElement || current.parentNode || null;
        }
        return null;
      },
      click() {
        const event = {
          type: "click",
          target: this,
          preventDefault() {
            this.defaultPrevented = true;
          },
          stopPropagation() {
            this.stopped = true;
          },
        };
        for (const handler of listeners.click || []) handler.call(this, event);
      },
      querySelector(selector) {
        return findNode(this, (child) => matchesSelector(child, selector));
      },
      querySelectorAll(selector) {
        const matches = [];
        walk(this, (child) => {
          if (matchesSelector(child, selector)) matches.push(child);
        });
        return matches;
      },
      getBoundingClientRect() {
        return {
          left: Number.parseFloat(this.style.left) || 0,
          top: Number.parseFloat(this.style.top) || 0,
          width: this.offsetWidth,
          height: this.offsetHeight,
        };
      },
    };
    return node;
  };

  const documentListeners = {};
  const doc = {
    createElement(tag) {
      return createNode(tag, doc);
    },
    addEventListener(type, handler) {
      documentListeners[type] ||= [];
      documentListeners[type].push(handler);
    },
    removeEventListener(type, handler) {
      if (!documentListeners[type]) return;
      documentListeners[type] = documentListeners[type].filter((entry) => entry !== handler);
    },
    dispatchEvent(event) {
      const normalizedEvent = event || {};
      const type = String(normalizedEvent.type || "");
      for (const handler of documentListeners[type] || []) handler.call(this, normalizedEvent);
      return !normalizedEvent.defaultPrevented;
    },
    querySelector(selector) {
      return this.documentElement.querySelector(selector);
    },
    querySelectorAll(selector) {
      return this.documentElement.querySelectorAll(selector);
    },
  };
  doc.documentElement = createNode("html", doc);
  doc.head = createNode("head", doc);
  doc.body = createNode("body", doc);
  doc.documentElement.append(doc.head, doc.body);
  return doc;
}

function walk(node, visit) {
  for (const child of node?.children || []) {
    visit(child);
    walk(child, visit);
  }
}

function findNode(node, predicate) {
  let found = null;
  walk(node, (child) => {
    if (!found && predicate(child)) found = child;
  });
  return found;
}

function getCssNumber(source, property) {
  const match = String(source || "").match(new RegExp(`${property}\\s*:\\s*(\\d+)`));
  return match ? Number(match[1]) : null;
}

function isMountedVisibleButton(doc, button) {
  return Boolean(
    button &&
      button.tagName === "BUTTON" &&
      button.parentElement === doc.body &&
      button.textContent === "UI-Editor" &&
      button.id === "uiEditor.launcherButton" &&
      button.disabled !== true &&
      button.getAttribute("data-ui-editor-installed-artifact") === "uiEditor/uiEditorLauncherButton.js" &&
      button.getAttribute("aria-hidden") !== "true"
  );
}

function getStatusText(status) {
  return status?.querySelector?.('[data-ui-editor-status-content="true"]')?.textContent || status?.textContent || "";
}

function getLatestPreviewAction(doc, action) {
  const matches = doc.querySelectorAll(`[data-ui-editor-preview-action="${action}"]`);
  return matches[matches.length - 1] || null;
}

function getLatestPreviewControls(doc) {
  const matches = doc.querySelectorAll('[data-ui-editor-preview-controls="true"]');
  return matches[matches.length - 1] || null;
}

function getPreviewPanel(doc) {
  return doc.querySelector('[data-ui-editor-preview-panel="true"]');
}

function getRenderedText(node) {
  if (!node) return "";
  const ownText = node.textContent || "";
  const childText = (node.children || []).map((child) => getRenderedText(child)).join("");
  return `${ownText}${childText}`;
}

function matchesSelector(node, selector) {
  const raw = String(selector || "");
  if (raw === "button") return node.tagName === "BUTTON";
  if (raw.startsWith("link[")) {
    return node.tagName === "LINK" && node.getAttribute("data-ui-editor-launcher-css") === "true";
  }
  if (raw === "[data-ui-editor-launcher-host=\"true\"]") {
    return node.getAttribute("data-ui-editor-launcher-host") === "true";
  }
  if (raw === "[data-ui-inspector-panel=\"true\"]") {
    return node.getAttribute("data-ui-inspector-panel") === "true";
  }
  if (raw === "[data-ui-editor-hover-frame=\"true\"]") {
    return node.getAttribute("data-ui-editor-hover-frame") === "true";
  }
  if (raw === "[data-ui-editor-panel=\"true\"]") {
    return node.getAttribute("data-ui-editor-panel") === "true";
  }
  if (raw === "[data-ui-editor-launcher-status=\"true\"]") {
    return node.getAttribute("data-ui-editor-launcher-status") === "true";
  }
  if (raw === "[data-ui-editor-status-content=\"true\"]") {
    return node.getAttribute("data-ui-editor-status-content") === "true";
  }
  if (raw === "[data-ui-editor-status-header=\"true\"]") {
    return node.getAttribute("data-ui-editor-status-header") === "true";
  }
  if (raw === "[data-ui-editor-status-collapse=\"true\"]") {
    return node.getAttribute("data-ui-editor-status-collapse") === "true";
  }
  if (raw === "[data-ui-editor-status-hide=\"true\"]") {
    return node.getAttribute("data-ui-editor-status-hide") === "true";
  }
  if (raw === "[data-ui-editor-status-reopen=\"true\"]") {
    return node.getAttribute("data-ui-editor-status-reopen") === "true";
  }
  if (raw === "[data-ui-editor-scope-list=\"true\"]") {
    return node.getAttribute("data-ui-editor-scope-list") === "true";
  }
  if (raw === "[data-ui-editor-preview-controls=\"true\"]") {
    return node.getAttribute("data-ui-editor-preview-controls") === "true";
  }
  if (raw === "[data-ui-editor-preview-panel=\"true\"]") {
    return node.getAttribute("data-ui-editor-preview-panel") === "true";
  }
  if (raw === "[data-ui-editor-preview-drag-handle=\"true\"]") {
    return node.getAttribute("data-ui-editor-preview-drag-handle") === "true";
  }
  if (raw === "[data-ui-editor-preview-selected]") {
    return Boolean(node.getAttribute("data-ui-editor-preview-selected"));
  }
  if (raw === "[data-ui-editor-hidden-elements-button=\"true\"]") {
    return node.getAttribute("data-ui-editor-hidden-elements-button") === "true";
  }
  if (raw === "[data-ui-editor-hidden-elements-popover=\"true\"]") {
    return node.getAttribute("data-ui-editor-hidden-elements-popover") === "true";
  }
  if (raw === "[data-ui-editor-hidden-elements-action=\"show\"]") {
    return node.getAttribute("data-ui-editor-hidden-elements-action") === "show";
  }
  if (raw === "[data-ui-editor-hidden-elements-action=\"show-all\"]") {
    return node.getAttribute("data-ui-editor-hidden-elements-action") === "show-all";
  }
  if (raw === "[data-ui-editor-surface-info=\"true\"]") {
    return node.getAttribute("data-ui-editor-surface-info") === "true";
  }
  if (raw === "[data-ui-editor-surface-selection=\"true\"]") {
    return node.getAttribute("data-ui-editor-surface-selection") === "true";
  }
  if (raw === "[data-ui-editor-surface-element-catalog=\"true\"]") {
    return node.getAttribute("data-ui-editor-surface-element-catalog") === "true";
  }
  if (raw === "[data-ui-editor-hint-infotext-draft-preview=\"true\"]") {
    return node.getAttribute("data-ui-editor-hint-infotext-draft-preview") === "true";
  }
  if (raw === "[data-ui-editor-surface-readonly-hint=\"true\"]") {
    return node.getAttribute("data-ui-editor-surface-readonly-hint") === "true";
  }
  if (raw === "[data-ui-editor-id]") {
    return Boolean(node.getAttribute("data-ui-editor-id"));
  }
  const previewActionMatch = raw.match(/^\[data-ui-editor-preview-action="([^"]+)"\]$/);
  if (previewActionMatch) {
    return node.getAttribute("data-ui-editor-preview-action") === previewActionMatch[1];
  }
  const uiEditorIdMatch = raw.match(/^\[data-ui-editor-id="([^"]+)"\]$/);
  if (uiEditorIdMatch) {
    return node.getAttribute("data-ui-editor-id") === uiEditorIdMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  const scopeOptionMatch = raw.match(/^\[data-ui-editor-scope-option="([^"]+)"\]$/);
  if (scopeOptionMatch) {
    return node.getAttribute("data-ui-editor-scope-option") === scopeOptionMatch[1];
  }
  return false;
}

async function loadRuntime() {
  const mod = await importEsmFromFile(RUNTIME_PATH);
  assert.equal(typeof mod.installBbmUiEditorRuntimeLauncher, "function");
  return mod;
}

async function runBbmUiEditorRuntimeLauncherTests(run) {
  await run("BBM UI-Editor-Runtime: bindet installierte Launcher-Artefakte ein", async () => {
    const mod = await loadRuntime();
    assert.equal(mod.INSTALLED_LAUNCHER_SCRIPT_PATH, "../../uiEditor/uiEditorLauncherButton.js");
    assert.equal(mod.INSTALLED_LAUNCHER_CSS_PATH, "../../uiEditor/uiEditorLauncherButton.css");
    assert.equal(typeof mod.getInstalledTargetSelectionArtifact(globalThis)?.createTargetSelectionController, "function");

    const source = fs.readFileSync(RUNTIME_PATH, "utf8");
    const cssSource = fs.readFileSync(CSS_PATH, "utf8");
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf8"));
    assert.equal(source.includes("uiEditor/uiEditorLauncherButton.js"), true);
    assert.equal(source.includes("uiEditor/uiEditorLauncherButton.css"), true);
    assert.equal(source.includes("uiEditor/targetSelection.js"), true);
    assert.equal(source.includes("../../../uiEditor/uiEditorLauncherButton.js"), true);
    assert.equal(source.includes("../../../uiEditor/targetSelection.js"), true);
    assert.equal(source.includes('from "./uiEditorKitPreviewRuntimeBridge.js"'), true);
    assert.equal(source.includes('from "./uiEditorKitPanelRuntimeBridge.js"'), true);
    assert.equal(source.includes('from "./uiEditorKitHiddenElementsRuntimeBridge.js"'), true);
    assert.equal(source.includes('from "ui-editor-kit/runtime/preview"'), false);
    assert.equal(source.includes('from "ui-editor-kit/runtime/panel"'), false);
    assert.equal(source.includes('from "ui-editor-kit/runtime/hidden-elements"'), false);
    assert.equal(source.includes("node_modules/ui-editor-kit/src/runtime/hiddenElements/index.mjs"), false);
    assert.equal(source.includes("buildHiddenElementsPopoverViewModel"), true);
    assert.equal(source.includes("data-ui-editor-hidden-elements-popover"), true);
    assert.equal(source.includes('from "../editorRuntime/preview/index.js"'), false);
    assert.equal(packageJson.build.files.includes("uiEditor/**/*"), true);
    assert.equal(source.includes("scanUiInspectorTargets"), false);
    assert.equal(source.includes("createUiInspectorPanel"), false);
    assert.equal(source.includes("localStorage"), false);
    assert.equal(source.includes("sessionStorage"), false);
    assert.equal(source.includes("MutationObserver"), false);
    assert.equal(source.includes("querySelectorAll"), false);
    assert.equal(cssSource.includes("position: fixed"), true);
    assert.equal(cssSource.includes("inset-inline-end: 24px"), true);
    assert.equal(cssSource.includes("ui-editor-launcher-status"), true);
    assert.equal(cssSource.includes("ui-editor-launcher-status__header"), true);
    assert.equal(cssSource.includes("ui-editor-launcher-status-reopen"), true);
    assert.equal(cssSource.includes('data-ui-editor-panel-collapsed="true"'), true);
    assert.equal(cssSource.includes('data-ui-editor-panel-hidden="true"'), true);
    assert.equal(cssSource.includes("white-space: pre-line"), true);
    assert.equal(cssSource.includes("max-inline-size: 360px"), true);
    assert.equal(cssSource.includes('[data-ui-editor-launcher-active="true"]'), true);
    assert.equal(getCssNumber(cssSource, "z-index") > 12010, true);
  });

  await run("BBM UI-Editor-Runtime: Preview-Runtime-Bridge bleibt renderer-kompatibel und fachfrei", async () => {
    assert.equal(fs.existsSync(PREVIEW_RUNTIME_BRIDGE_PATH), true);
    const bridgeSource = fs.readFileSync(PREVIEW_RUNTIME_BRIDGE_PATH, "utf8");
    assert.equal(
      bridgeSource.includes("../../../node_modules/ui-editor-kit/src/runtime/preview/index.mjs"),
      true
    );
    assert.equal(bridgeSource.includes("ui-editor-kit/runtime/preview"), false);
    assert.equal(bridgeSource.includes("../editorRuntime/preview/index.js"), false);
    for (const forbidden of [
      "bbm",
      "BBM",
      "restarbeiten",
      "Kurztext",
      "editbox",
      "filterbar",
      "localStorage",
      "writeFile",
      "ipc",
      "db",
    ]) {
      assert.equal(bridgeSource.includes(forbidden), false, forbidden);
    }
  });

  await run("BBM UI-Editor-Runtime: Panel-Runtime-Bridge bleibt renderer-kompatibel und fachfrei", async () => {
    assert.equal(fs.existsSync(PANEL_RUNTIME_BRIDGE_PATH), true);
    const bridgeSource = fs.readFileSync(PANEL_RUNTIME_BRIDGE_PATH, "utf8");
    assert.equal(
      bridgeSource.includes("../../../node_modules/ui-editor-kit/src/runtime/panel/index.mjs"),
      true
    );
    assert.equal(bridgeSource.includes("ui-editor-kit/runtime/panel"), false);
    const panelRuntime = await importEsmFromFile(PANEL_RUNTIME_BRIDGE_PATH);
    assert.equal(panelRuntime.PANEL_DRAG_COORDINATE_SYSTEM, "css-pixels");
    assert.equal(typeof panelRuntime.normalizePanelDragInput, "function");
    assert.equal(typeof panelRuntime.buildPanelDragResult, "function");
    assert.equal(typeof panelRuntime.calculatePanelDragPosition, "function");
    for (const forbidden of [
      "bbm",
      "BBM",
      "restarbeiten",
      "Kurztext",
      "editbox",
      "filterbar",
      "localStorage",
      "writeFile",
      "ipc",
      "db",
      "pdf",
      "PDF",
    ]) {
      assert.equal(bridgeSource.includes(forbidden), false, forbidden);
    }
  });

  await run("BBM UI-Editor-Runtime: Hidden-Elements-Runtime-Bridge wird renderer-kompatibel genutzt", async () => {
    assert.equal(fs.existsSync(HIDDEN_ELEMENTS_RUNTIME_BRIDGE_PATH), true);
    const bridgeSource = fs.readFileSync(HIDDEN_ELEMENTS_RUNTIME_BRIDGE_PATH, "utf8");
    const launcherSource = fs.readFileSync(RUNTIME_PATH, "utf8");
    assert.equal(
      bridgeSource.includes("../../../node_modules/ui-editor-kit/src/runtime/hiddenElements/index.mjs"),
      true
    );
    assert.equal(bridgeSource.includes("ui-editor-kit/runtime/hidden-elements"), false);
    assert.equal(launcherSource.includes('from "./uiEditorKitHiddenElementsRuntimeBridge.js"'), true);
    assert.equal(launcherSource.includes('from "ui-editor-kit/runtime/hidden-elements"'), false);
    assert.equal(launcherSource.includes("node_modules/ui-editor-kit/src/runtime/hiddenElements/index.mjs"), false);
    assert.equal(launcherSource.includes("buildHiddenElementsPopoverViewModel"), true);
    for (const forbidden of [
      "localStorage",
      "writeFile",
      "ipcRenderer",
      "ipcMain",
    ]) {
      assert.equal(launcherSource.includes(forbidden), false, forbidden);
    }
  });

  await run("BBM UI-Editor-Runtime: DragRuntime-Bridge bleibt testbar, Launcher nutzt PanelRuntime-Helper", async () => {
    assert.equal(fs.existsSync(DRAG_RUNTIME_BRIDGE_PATH), true);
    const launcherSource = fs.readFileSync(RUNTIME_PATH, "utf8");
    const bridgeSource = fs.readFileSync(DRAG_RUNTIME_BRIDGE_PATH, "utf8");
    assert.equal(
      bridgeSource.trim(),
      'export * from "../../../node_modules/ui-editor-kit/src/runtime/drag/index.mjs";'
    );
    assert.equal(bridgeSource.includes("ui-editor-kit/runtime/drag"), false);
    assert.equal(launcherSource.includes('from "./uiEditorKitDragRuntimeBridge.js"'), false);
    assert.equal(launcherSource.includes("buildDragResult({"), false);
    assert.equal(launcherSource.includes("calculatePanelDragPosition"), true);
    assert.equal(launcherSource.includes("PANEL_DRAG_COORDINATE_SYSTEM"), true);
    assert.equal(launcherSource.includes("ui-editor-kit/runtime/drag"), false);
    assert.equal(launcherSource.includes("node_modules/ui-editor-kit/src/runtime/drag/index.mjs"), false);
    assert.equal(launcherSource.includes("applyDragDelta"), false);
    assert.equal(launcherSource.includes("clampBoundsToConstraints"), false);
    assert.equal(launcherSource.includes("calculatePreviewPanelDragPositionWithRuntime"), true);

    const dragRuntime = await importEsmFromFile(DRAG_RUNTIME_BRIDGE_PATH);
    assert.equal(typeof dragRuntime.applyDragDelta, "function");
    assert.equal(typeof dragRuntime.clampBoundsToConstraints, "function");
    assert.equal(dragRuntime.isSupportedDragCoordinateSystem("css-pixels"), true);
  });

  await run("BBM UI-Editor-Runtime: Panel-ViewModel wird vorbereitend aus Launcher-Daten gebaut", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const target = doc.createElement("div");
    target.setAttribute("data-ui-editor-id", "sample.target");
    const registryElement = {
      id: "sample.target",
      name: "Ziel",
      type: "field",
      role: "content",
      parentId: "sample.root",
      allowedOps: ["inspect", "move", "resize", "hide"],
      lockedOps: ["show"],
      previewTargetMode: "self",
    };
    const state = mod.createLauncherState({
      activeUiScope: "sample.screen",
      registeredElements: [registryElement],
    });
    state.selectedElement = registryElement;
    state.selectedTargetNode = target;
    state.selectedPreviewTargetNode = target;
    state.pendingChangeRequests = [
      { elementId: "sample.target", operation: "move" },
      { elementId: "sample.target", operation: "width" },
    ];
    state.previewMessage = "Aenderungen vorbereitet";

    const viewModel = mod.buildBbmPanelViewModel(state);
    assert.equal(viewModel.title, "Preview");
    assert.equal(viewModel.targetId, "sample.target");
    assert.equal(viewModel.previewTargetId, "sample.target");
    assert.deepEqual(viewModel.allowedOps, ["inspect", "move", "resize", "hide"]);
    assert.deepEqual(viewModel.lockedOps, ["show"]);
    assert.equal(viewModel.pendingChangeSummary.total, 2);
    assert.deepEqual(viewModel.pendingChangeSummary.operations, ["move", "width"]);
    assert.equal(viewModel.statusText, "Aenderungen vorbereitet");
    assert.equal(viewModel.buttons.some((button) => button.id === "move-left" && button.isEnabled), true);
    assert.equal(viewModel.buttons.some((button) => button.id === "show" && button.isEnabled), false);
    assert.equal(viewModel.canDiscard, true);
  });

  await run("BBM UI-Editor-Runtime: SurfaceAdapter-Katalog bleibt read-only testseitig abrufbar", async () => {
    const mod = await loadRuntime();

    assert.equal(typeof mod.buildReadonlySurfaceModelForLauncher, "function");
    assert.equal(typeof mod.buildReadonlySurfaceInfoForLauncher, "function");
    assert.equal(typeof mod.handleReadonlySurfaceSwitchRequestForLauncher, "function");
    assert.equal(typeof mod.buildReadonlySurfaceSwitchResultForLauncher, "function");
    assert.equal(typeof mod.buildReadonlySurfaceSelectionStateForLauncher, "function");
    assert.equal(typeof mod.buildReadonlySurfaceSelectionForLauncher, "function");
    assert.equal(typeof mod.buildReadonlyPdfPlanPage1HintForLauncher, "function");
    assert.equal(
      mod.READONLY_PDF_PLAN_PAGE_1_HINT_TEXT,
      "PDF Plan Seite 1 und Plan Canvas sind nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz."
    );

    const restarbeitenResult = mod.buildReadonlySurfaceModelForLauncher("restarbeiten.ui.main", {
      hostAdapter: {
        getRegistry() {
          return [
            {
              id: "restarbeiten.root",
              name: "Restarbeiten",
              visible: true,
              allowedOps: ["inspect", "hide", "show"],
              lockedOps: [],
            },
          ];
        },
        getCurrentLayoutState() {
          return [];
        },
      },
    });
    assert.equal(restarbeitenResult.ok, true);
    assert.equal(restarbeitenResult.surfaceModel.surfaceId, "restarbeiten.ui.main");
    assert.equal(restarbeitenResult.surfaceModel.surfaceType, "ui-screen");
    const restarbeitenInfo = mod.buildReadonlySurfaceInfoForLauncher("restarbeiten.ui.main", {
      hostAdapter: {
        getRegistry() {
          return [
            {
              id: "restarbeiten.root",
              name: "Restarbeiten",
              visible: true,
              allowedOps: ["inspect", "hide", "show"],
              lockedOps: [],
            },
          ];
        },
        getCurrentLayoutState() {
          return [];
        },
      },
    });
    assert.deepEqual(restarbeitenInfo, {
      surfaceId: "restarbeiten.ui.main",
      surfaceType: "ui-screen",
      elementCount: 1,
    });

    const pdfResult = mod.buildReadonlySurfaceModelForLauncher("pdf.plan.page.1", { pageNumber: 9 });
    assert.equal(pdfResult.ok, true);
    assert.equal(pdfResult.surfaceModel.surfaceId, "pdf.plan.page.1");
    assert.equal(pdfResult.surfaceModel.surfaceType, "pdf-page");
    assert.equal(pdfResult.surfaceModel.coordinateSystem, "pdf-points");
    assert.equal(pdfResult.surfaceModel.pageNumber, 1);
    assert.deepEqual(mod.buildReadonlySurfaceInfoForLauncher("pdf.plan.page.1"), {
      surfaceId: "pdf.plan.page.1",
      surfaceType: "pdf-page",
      elementCount: 0,
    });

    const planResult = mod.buildReadonlySurfaceModelForLauncher("plan.canvas.default");
    assert.equal(planResult.ok, true);
    assert.equal(planResult.surfaceModel.surfaceId, "plan.canvas.default");
    assert.equal(planResult.surfaceModel.surfaceType, "plan");
    assert.equal(planResult.surfaceModel.coordinateSystem, "canvas-pixels");
    assert.deepEqual(mod.buildReadonlySurfaceInfoForLauncher("plan.canvas.default"), {
      surfaceId: "plan.canvas.default",
      surfaceType: "plan",
      elementCount: 0,
    });

    const unknownResult = mod.buildReadonlySurfaceModelForLauncher("pdf.plan.page.2");
    assert.equal(unknownResult.ok, false);
    assert.equal(unknownResult.surfaceModel, null);
    assert.equal(unknownResult.validation.errors[0].code, "UNKNOWN_SURFACE_ADAPTER");
    assert.equal(mod.buildReadonlySurfaceInfoForLauncher("pdf.plan.page.2"), null);

    const launcherAllowedSwitchResult = mod.handleReadonlySurfaceSwitchRequestForLauncher(
      "restarbeiten.ui.main"
    );
    assert.deepEqual(launcherAllowedSwitchResult, {
      handled: true,
      allowed: true,
      readonly: true,
      requestedSurfaceId: "restarbeiten.ui.main",
      resolvedSurfaceId: "restarbeiten.ui.main",
      changed: false,
      reason: "readonly-current-surface",
    });

    const launcherBlockedSwitchResult = mod.handleReadonlySurfaceSwitchRequestForLauncher(
      "pdf.plan.page.1"
    );
    assert.equal(launcherBlockedSwitchResult.allowed, true);
    assert.equal(launcherBlockedSwitchResult.readonly, true);
    assert.equal(launcherBlockedSwitchResult.requestedSurfaceId, "pdf.plan.page.1");
    assert.equal(launcherBlockedSwitchResult.resolvedSurfaceId, "pdf.plan.page.1");
    assert.equal(launcherBlockedSwitchResult.changed, false);
    assert.equal(launcherBlockedSwitchResult.reason, "readonly-current-surface");

    const allowedSwitchResult = mod.buildReadonlySurfaceSwitchResultForLauncher("restarbeiten.ui.main");
    assert.deepEqual(allowedSwitchResult, {
      handled: true,
      allowed: true,
      readonly: true,
      requestedSurfaceId: "restarbeiten.ui.main",
      fromSurfaceId: "restarbeiten.ui.main",
      targetSurfaceId: "restarbeiten.ui.main",
      resolvedSurfaceId: "restarbeiten.ui.main",
      changed: false,
      reason: "readonly-current-surface",
    });

    for (const blockedSurfaceId of ["unknown.surface", "*", "", "   "]) {
      const switchResult = mod.buildReadonlySurfaceSwitchResultForLauncher(blockedSurfaceId);
      assert.equal(switchResult.allowed, false);
      assert.equal(switchResult.readonly, true);
      assert.equal(switchResult.fromSurfaceId, "restarbeiten.ui.main");
      assert.equal(switchResult.targetSurfaceId, String(blockedSurfaceId || "").trim());
      assert.equal(switchResult.resolvedSurfaceId, "restarbeiten.ui.main");
      assert.equal(switchResult.reason, "surface-not-selectable-readonly");
    }

    const selectionModel = mod.buildReadonlySurfaceSelectionForLauncher({
      surfaceIds: [
        "restarbeiten.ui.main",
        "pdf.plan.page.1",
        "plan.canvas.default",
        "unknown.surface",
      ],
      selectedSurfaceId: "pdf.plan.page.1",
    });
    assert.equal(selectionModel.state.selectedSurfaceId, "pdf.plan.page.1");
    assert.equal(selectionModel.state.requestedSurfaceId, "pdf.plan.page.1");
    assert.equal(selectionModel.switchResult.targetSurfaceId, "pdf.plan.page.1");
    assert.equal(selectionModel.switchResult.resolvedSurfaceId, "pdf.plan.page.1");
    assert.equal(selectionModel.switchResult.allowed, true);
    assert.equal(selectionModel.state.readonly, true);
    assert.equal(selectionModel.state.selectionAllowed, true);
    assert.equal(selectionModel.state.blockedSurfaceIds.includes("plan.canvas.default"), false);
    assert.equal(selectionModel.state.blockedSurfaceIds.includes("unknown.surface"), true);
    assert.deepEqual(selectionModel.surfaces.map((surface) => surface.surfaceId), [
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
    ]);
    assert.equal(selectionModel.surfaces[0].label, "Restarbeiten");
    assert.equal(selectionModel.surfaces[0].readonly, true);
    assert.equal(selectionModel.surfaces[1].label, "PDF Plan Seite 1");
    assert.equal(selectionModel.surfaces[1].readonly, true);
    assert.equal(selectionModel.surfaces[2].label, "Plan Canvas");
    assert.equal(selectionModel.surfaces[2].readonly, true);
    assert.deepEqual(mod.buildReadonlyPdfPlanPage1HintForLauncher({
      selectedSurfaceId: "pdf.plan.page.1",
    }), {
      surfaceId: "pdf.plan.page.1",
      text: "PDF Plan Seite 1 und Plan Canvas sind nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.",
      readonly: true,
    });

    for (const blockedSurfaceId of ["unknown.surface", "*", ""]) {
      const selectionState = mod.buildReadonlySurfaceSelectionStateForLauncher({
        selectedSurfaceId: blockedSurfaceId,
        surfaceIds: [
          "restarbeiten.ui.main",
          "pdf.plan.page.1",
          "plan.canvas.default",
          "unknown.surface",
          "*",
        ],
      });
      assert.equal(selectionState.selectedSurfaceId, "restarbeiten.ui.main");
      assert.equal(selectionState.availableSurfaceIds.includes("restarbeiten.ui.main"), true);
      assert.equal(selectionState.availableSurfaceIds.includes("pdf.plan.page.1"), true);
      assert.equal(selectionState.availableSurfaceIds.includes("plan.canvas.default"), true);
      if (blockedSurfaceId) {
        assert.equal(selectionState.blockedSurfaceIds.includes(blockedSurfaceId), true);
      }
    }

    for (const blockedSurfaceId of ["unknown.surface", "*", ""]) {
      const switchedSelectionModel = mod.buildReadonlySurfaceSelectionForLauncher({
        selectedSurfaceId: blockedSurfaceId,
      });
      assert.equal(switchedSelectionModel.switchResult.resolvedSurfaceId, "restarbeiten.ui.main");
      assert.equal(switchedSelectionModel.state.selectedSurfaceId, "restarbeiten.ui.main");
      assert.equal(switchedSelectionModel.surfaces.length, 3);
      assert.equal(switchedSelectionModel.surfaces[0].label, "Restarbeiten");
      assert.equal(switchedSelectionModel.surfaces[1].label, "PDF Plan Seite 1");
      assert.equal(switchedSelectionModel.surfaces[2].label, "Plan Canvas");
    }
  });

  await run("BBM UI-Editor-Runtime: zeigt kompakte read-only Surface-Auswahl, Hinweis und unveraenderte SurfaceInfo", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "sample.screen",
      registryResolver: () => ({
        uiScope: "sample.screen",
        moduleId: "sample",
        elements: [],
      }),
    });

    button.click();

    const source = fs.readFileSync(RUNTIME_PATH, "utf8");
    const renderedText = getRenderedText(doc.body);
    const surfaceSelection = doc.querySelector('[data-ui-editor-surface-selection="true"]');
    const elementCatalog = doc.querySelector('[data-ui-editor-surface-element-catalog="true"]');
    const hintInfotextDraftPreview = doc.querySelector('[data-ui-editor-hint-infotext-draft-preview="true"]');
    const readonlyHint = doc.querySelector('[data-ui-editor-surface-readonly-hint="true"]');
    const surfaceInfo = doc.querySelector('[data-ui-editor-surface-info="true"]');
    assert.equal(source.includes('from "./surfaceAdapters/surfaceAdapterCatalog.js"'), true);
    assert.equal(source.includes('from "./surfaceAdapters/surfaceSelectionModel.js"'), true);
    assert.equal(source.includes('from "./surfaceAdapters/surfaceSelectionState.js"'), true);
    assert.equal(source.includes('from "./surfaceAdapters/surfaceSwitchCommand.js"'), true);
    assert.equal(source.includes('from "./surfaceAdapters/surfaceSwitchModel.js"'), false);
    assert.equal(source.includes('from "./surfaceAdapters/surfacePolicy.js"'), true);
    assert.equal(source.includes("handleReadonlySurfaceSwitchRequestForLauncher"), true);
    assert.equal(source.includes("buildReadonlySurfaceSwitchResultForLauncher"), true);
    assert.equal(source.includes("localStorage"), false);
    assert.equal(source.includes("writeFile"), false);
    assert.equal(source.includes("ipcRenderer"), false);
    assert.equal(source.includes("ipcMain"), false);
    assert.equal(source.includes(".prepare("), false);
    assert.equal(source.includes(".run("), false);
    assert.equal(doc.querySelector('[data-ui-editor-surface-list="true"]'), null);
    assert.equal(doc.querySelector('[data-ui-editor-surface-model="true"]'), null);
    assert.equal(Boolean(surfaceSelection), true);
    assert.equal(surfaceSelection.getAttribute("data-ui-editor-surface-id"), "restarbeiten.ui.main");
    assert.equal(surfaceSelection.getAttribute("data-ui-editor-surface-readonly"), "true");
    assert.equal(surfaceSelection.getAttribute("data-ui-editor-surface-count"), "3");
    assert.equal(renderedText.includes("Restarbeiten"), true);
    assert.equal(renderedText.includes("PDF Plan Seite 1"), true);
    assert.equal(renderedText.includes("Plan Canvas"), true);
    assert.equal(
      renderedText.includes("Surface-Auswahl zeigt nur read-only Kontext. Keine aktive Umschaltung."),
      true
    );
    assert.equal(
      renderedText.includes("Bearbeitung: Restarbeiten | Zusatzkontexte: PDF/Plan read-only | Speichern: nicht aktiv"),
      true
    );
    assert.equal(Boolean(elementCatalog), true);
    assert.equal(renderedText.includes("Elementkatalog"), true);
    for (const required of [
      "Hinweis / Infotext: erlaubt",
      "read-only Kontext: erlaubt",
      "Bearbeitbare Elemente: gesperrt",
      "Drag / Resize: gesperrt",
      "Speichern / Persistenz: gesperrt",
    ]) {
      assert.equal(renderedText.includes(required), true, `Elementkatalog-Text enthaelt ${required} nicht.`);
    }
    assert.equal(Boolean(hintInfotextDraftPreview), true);
    assert.equal(renderedText.includes("Entwurfs-Vorschau"), true);
    for (const required of [
      "Elementart: Hinweis / Infotext",
      "Status: Vorschau, nicht gespeichert",
      "Zielkontext: Restarbeiten",
    ]) {
      assert.equal(renderedText.includes(required), true, `Entwurfs-Vorschau enthaelt ${required} nicht.`);
    }
    assert.equal(hintInfotextDraftPreview.querySelectorAll("button").length, 0);
    assert.equal(hintInfotextDraftPreview.querySelectorAll("input").length, 0);
    assert.equal(hintInfotextDraftPreview.querySelectorAll("select").length, 0);
    assert.equal(Boolean(readonlyHint), true);
    assert.equal(readonlyHint.getAttribute("data-ui-editor-surface-id"), "pdf.plan.page.1");
    assert.equal(
      getRenderedText(readonlyHint),
      "PDF Plan Seite 1 und Plan Canvas sind nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz."
    );
    assert.equal(renderedText.includes("plan.canvas.default"), false);
    assert.equal(Boolean(surfaceInfo), true);
    assert.equal(getRenderedText(surfaceInfo).includes("restarbeiten.ui.main"), true);
    assert.equal(source.includes('const READONLY_SURFACE_INFO_SURFACE_ID = "restarbeiten.ui.main";'), true);
    assert.equal(source.includes('const READONLY_PDF_PLAN_PAGE_1_SURFACE_ID = "pdf.plan.page.1";'), true);
    assert.equal(source.includes("READONLY_PDF_PLAN_PAGE_1_HINT_TEXT"), true);
    assert.equal(source.includes("READONLY_SURFACE_SELECTION_HINT_TEXT"), true);
    assert.equal(source.includes("data-ui-editor-surface-readonly-hint"), true);
  });

  await run("BBM UI-Editor-Runtime: Hidden-Elements-Button-ViewModel bleibt kompakt und neutral", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const target = doc.createElement("div");
    target.setAttribute("data-ui-editor-id", "sample.hidden");
    const registryElement = {
      id: "sample.hidden",
      name: "Ausblendbares Ziel",
      type: "field",
      role: "content",
      parentId: "sample.root",
      allowedOps: ["inspect", "hide", "show"],
      lockedOps: [],
      previewTargetMode: "self",
    };
    const state = mod.createLauncherState({
      activeUiScope: "sample.screen",
      registeredElements: [registryElement],
    });

    const emptyViewModel = mod.buildBbmHiddenElementsButtonViewModel(state);
    assert.deepEqual(emptyViewModel, {
      visible: false,
      enabled: false,
      label: "Ausgeblendete: 0",
      hiddenCount: 0,
    });

    target.style.display = "none";
    state.previewStates.set(target, {
      originalStyle: { transform: "", width: "", height: "", display: "" },
      dx: 0,
      dy: 0,
      widthDelta: 0,
      heightDelta: 0,
      baseWidth: 0,
      baseHeight: 0,
      hidden: true,
    });
    const hiddenViewModel = mod.buildBbmHiddenElementsButtonViewModel(state);
    assert.equal(hiddenViewModel.hiddenCount, 1);
    assert.equal(hiddenViewModel.label, "Ausgeblendete: 1");
    assert.equal(hiddenViewModel.enabled, true);

    const popoverViewModel = mod.buildBbmHiddenElementsPopoverViewModel(state);
    assert.equal(popoverViewModel.title, "Ausgeblendete Elemente");
    assert.deepEqual(popoverViewModel.items, [
      {
        elementId: "sample.hidden",
        label: "Ausblendbares Ziel",
        action: "show",
        enabled: true,
      },
    ]);
    assert.equal(mod.showHiddenPreviewElement(state, "sample.hidden"), true);
    assert.equal(target.style.display, "");
    assert.equal(mod.buildBbmHiddenElementsButtonViewModel(state).hiddenCount, 0);
  });

  await run("BBM UI-Editor-Runtime: Hidden-Elements lesen Layout-State defensiv ohne Schreibweg", async () => {
    const [mod, hostContract] = await Promise.all([
      loadRuntime(),
      importEsmFromFile(HOST_CONTRACT_PATH),
    ]);
    const registry = {
      targetAppId: "sample-app",
      uiScope: "sample.screen",
      moduleId: "sample",
      elements: [
        {
          id: "sample.layout.hidden",
          name: "Layout-hidden Ziel",
          type: "field",
          role: "content",
          parentId: "sample.root",
          allowedOps: ["inspect", "hide", "show"],
          lockedOps: [],
          previewTargetMode: "self",
        },
      ],
    };
    const hostAdapter = hostContract.createInMemoryBbmEditorHostAdapter({
      hostContext: {
        targetAppId: "sample-app",
        moduleId: "sample",
        activeUiScope: "sample.screen",
      },
      registry,
      currentLayoutState: [
        { elementId: "sample.layout.hidden", layoutValue: { visible: false } },
      ],
    });
    const state = mod.createLauncherState({
      activeUiScope: "sample.screen",
      hostAdapter,
    });

    const buttonViewModel = mod.buildBbmHiddenElementsButtonViewModel(state);
    assert.equal(buttonViewModel.hiddenCount, 1);
    assert.equal(buttonViewModel.label, "Ausgeblendete: 1");
    assert.equal(buttonViewModel.enabled, true);

    const popoverViewModel = mod.buildBbmHiddenElementsPopoverViewModel(state);
    assert.deepEqual(popoverViewModel.items, [
      {
        elementId: "sample.layout.hidden",
        label: "Layout-hidden Ziel",
        action: "show",
        enabled: false,
      },
    ]);
    assert.equal(mod.showHiddenPreviewElement(state, "sample.layout.hidden"), false);
    assert.equal(state.pendingChangeRequests.length, 0);
    assert.equal(hostAdapter.submitChangeRequests([]).reason, "PERSISTENCE_DISABLED");
  });

  await run("BBM UI-Editor-Runtime: Hidden-Elements erkennen wiederhergestellte Pilot-Visibility-Overrides", async () => {
    const [mod, adapterModule] = await Promise.all([
      loadRuntime(),
      importEsmFromFile(RESTARBEITEN_HOST_ADAPTER_PATH),
    ]);
    const storedRecord = {
      targetAppId: "bbm",
      moduleId: "restarbeiten",
      scopeId: "restarbeiten.ui.main",
      elementId: "restarbeiten.editbox.text.short",
      overrides: { visible: false },
      source: "ui-editor",
      createdAt: "2026-06-08T22:30:00.000Z",
      updatedAt: "2026-06-08T22:31:00.000Z",
    };
    const storageApi = {
      async list() {
        return {
          ok: true,
          data: [storedRecord],
        };
      },
    };
    const hostAdapter = adapterModule.createRestarbeitenMainUiHostAdapter({ storageApi });
    const restoreResult = await hostAdapter.loadCurrentLayoutState();
    assert.equal(restoreResult.ok, true);
    assert.equal(restoreResult.layoutState[0].elementId, "restarbeiten.editbox.text.short");
    assert.deepEqual(restoreResult.layoutState[0].overrides, { visible: false });
    assert.equal(restoreResult.layoutState[0].visible, false);

    const state = mod.createLauncherState({
      activeUiScope: "restarbeiten.ui.main",
      hostAdapter,
    });
    const buttonViewModel = mod.buildBbmHiddenElementsButtonViewModel(state);
    assert.equal(buttonViewModel.hiddenCount, 1);
    assert.equal(buttonViewModel.label, "Ausgeblendete: 1");
    assert.equal(buttonViewModel.enabled, true);

    const popoverViewModel = mod.buildBbmHiddenElementsPopoverViewModel(state);
    assert.deepEqual(popoverViewModel.items, [
      {
        elementId: "restarbeiten.editbox.text.short",
        label: "Kurztext",
        action: "show",
        enabled: true,
      },
    ]);

    storedRecord.overrides = { visible: true };
    storedRecord.updatedAt = "2026-06-08T22:32:00.000Z";
    const visibleHostAdapter = adapterModule.createRestarbeitenMainUiHostAdapter({ storageApi });
    const visibleRestoreResult = await visibleHostAdapter.loadCurrentLayoutState();
    assert.equal(visibleRestoreResult.ok, true);
    assert.equal(visibleRestoreResult.layoutState[0].visible, true);
    const visibleState = mod.createLauncherState({
      activeUiScope: "restarbeiten.ui.main",
      hostAdapter: visibleHostAdapter,
    });
    assert.equal(mod.buildBbmHiddenElementsButtonViewModel(visibleState).hiddenCount, 0);
    assert.deepEqual(mod.buildBbmHiddenElementsPopoverViewModel(visibleState).items, []);
  });

  await run("BBM UI-Editor-Runtime: gespeicherte Pilot-Hidden-Elements lassen sich persistent einblenden", async () => {
    const [mod, adapterModule] = await Promise.all([
      loadRuntime(),
      importEsmFromFile(RESTARBEITEN_HOST_ADAPTER_PATH),
    ]);
    const savedOverrides = [
      {
        targetAppId: "bbm",
        moduleId: "restarbeiten",
        scopeId: "restarbeiten.ui.main",
        elementId: "restarbeiten.editbox.text.short",
        overrides: { visible: false },
        source: "ui-editor",
        createdAt: "2026-06-08T22:30:00.000Z",
        updatedAt: "2026-06-08T22:31:00.000Z",
      },
    ];
    const storageApi = {
      async list() {
        return { ok: true, data: savedOverrides };
      },
      async save(override) {
        const record = {
          ...override,
          createdAt: override.createdAt || "2026-06-08T22:30:00.000Z",
          updatedAt: "2026-06-08T22:32:00.000Z",
        };
        const index = savedOverrides.findIndex((entry) => entry.elementId === record.elementId);
        if (index >= 0) {
          savedOverrides.splice(index, 1, record);
        } else {
          savedOverrides.push(record);
        }
        return { ok: true, data: record };
      },
    };
    const hostAdapter = adapterModule.createRestarbeitenMainUiHostAdapter({ storageApi });
    await hostAdapter.loadCurrentLayoutState();
    const state = mod.createLauncherState({
      activeUiScope: "restarbeiten.ui.main",
      hostAdapter,
    });

    assert.equal(mod.buildBbmHiddenElementsButtonViewModel(state).hiddenCount, 1);
    assert.equal(mod.buildBbmHiddenElementsPopoverViewModel(state).items[0].enabled, true);

    const showResult = await mod.showHiddenElement(state, "restarbeiten.editbox.text.short");
    assert.equal(showResult, true);
    assert.equal(savedOverrides.length, 1);
    assert.deepEqual(savedOverrides[0].overrides, { visible: true });
    assert.deepEqual(hostAdapter.getCurrentLayoutState()[0].overrides, { visible: true });
    assert.equal(mod.buildBbmHiddenElementsButtonViewModel(state).hiddenCount, 0);
    assert.deepEqual(mod.buildBbmHiddenElementsPopoverViewModel(state).items, []);
    assert.equal(state.pendingChangeRequests.length, 0);
  });

  await run("BBM UI-Editor-Runtime: Hidden-Elements-Popover bietet kompaktes Alle-einblenden fuer Pilot-Overrides", async () => {
    const [mod, adapterModule] = await Promise.all([
      loadRuntime(),
      importEsmFromFile(RESTARBEITEN_HOST_ADAPTER_PATH),
    ]);
    const doc = createFakeDocument();
    const savedOverrides = [
      {
        targetAppId: "bbm",
        moduleId: "restarbeiten",
        scopeId: "restarbeiten.ui.main",
        elementId: "restarbeiten.editbox.text.short",
        overrides: { visible: false },
        source: "ui-editor",
      },
      {
        targetAppId: "bbm",
        moduleId: "restarbeiten",
        scopeId: "restarbeiten.ui.main",
        elementId: "restarbeiten.editbox.text.long",
        overrides: { visible: false },
        source: "ui-editor",
      },
    ];
    const storageApi = {
      async list() {
        return { ok: true, data: savedOverrides };
      },
      async save(override) {
        const record = {
          ...override,
          createdAt: override.createdAt || "2026-06-08T22:30:00.000Z",
          updatedAt: "2026-06-08T22:32:00.000Z",
        };
        const index = savedOverrides.findIndex((entry) => entry.elementId === record.elementId);
        if (index >= 0) {
          savedOverrides.splice(index, 1, record);
        } else {
          savedOverrides.push(record);
        }
        return { ok: true, data: record };
      },
    };
    const hostAdapter = adapterModule.createRestarbeitenMainUiHostAdapter({ storageApi });
    await hostAdapter.loadCurrentLayoutState();
    const state = mod.createLauncherState({
      activeUiScope: "restarbeiten.ui.main",
      hostAdapter,
    });
    state.hiddenElementsPopoverOpen = true;

    mod.renderPreviewPanel(doc, state);
    assert.equal(mod.buildBbmHiddenElementsButtonViewModel(state).hiddenCount, 2);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-hidden-elements-popover="true"]')), true);
    assert.equal(doc.querySelectorAll('[data-ui-editor-hidden-elements-action="show"]').length, 2);
    const showAllButton = doc.querySelector('[data-ui-editor-hidden-elements-action="show-all"]');
    assert.equal(Boolean(showAllButton), true);
    assert.equal(showAllButton.textContent, "Alle einblenden");

    showAllButton.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.deepEqual(savedOverrides.map((entry) => entry.overrides.visible), [true, true]);
    assert.equal(mod.buildBbmHiddenElementsButtonViewModel(state).hiddenCount, 0);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-hidden-elements-popover="true"]')), false);
    assert.equal(state.pendingChangeRequests.length, 0);
  });

  await run("BBM UI-Editor-Runtime: Hidden-Elements deduplizieren und Preview-State gewinnt vor Layout-State", async () => {
    const [mod, hostContract] = await Promise.all([
      loadRuntime(),
      importEsmFromFile(HOST_CONTRACT_PATH),
    ]);
    const doc = createFakeDocument();
    const registry = {
      targetAppId: "sample-app",
      uiScope: "sample.screen",
      moduleId: "sample",
      elements: [
        { id: "sample.layout.first", name: "Erstes Layout-Ziel", type: "field", role: "content", parentId: "sample.root", allowedOps: ["inspect", "hide", "show"], lockedOps: [], previewTargetMode: "self" },
        { id: "sample.layout.second", name: "Zweites Layout-Ziel", type: "field", role: "content", parentId: "sample.root", allowedOps: ["inspect", "hide", "show"], lockedOps: [], previewTargetMode: "self" },
        { id: "sample.preview.third", name: "Preview-Ziel", type: "field", role: "content", parentId: "sample.root", allowedOps: ["inspect", "hide", "show"], lockedOps: [], previewTargetMode: "self" },
      ],
    };
    const hostAdapter = hostContract.createInMemoryBbmEditorHostAdapter({
      hostContext: {
        targetAppId: "sample-app",
        moduleId: "sample",
        activeUiScope: "sample.screen",
      },
      registry,
      currentLayoutState: [
        { elementId: "sample.layout.first", visible: false },
        { elementId: "sample.layout.first", layoutValue: { visible: false } },
        { elementId: "sample.layout.second", visible: true },
        { elementId: "sample.preview.third", visible: true },
      ],
    });
    const state = mod.createLauncherState({
      activeUiScope: "sample.screen",
      hostAdapter,
    });
    state.pendingChangeRequests = [
      { elementId: "sample.layout.first", operation: "visibility", payload: { visible: true } },
      { elementId: "sample.layout.second", operation: "visibility", payload: { visible: false } },
    ];
    const previewTarget = doc.createElement("div");
    previewTarget.setAttribute("data-ui-editor-id", "sample.preview.third");
    state.previewStates.set(previewTarget, {
      originalStyle: { transform: "", width: "", height: "", display: "" },
      dx: 0,
      dy: 0,
      widthDelta: 0,
      heightDelta: 0,
      baseWidth: 0,
      baseHeight: 0,
      hidden: true,
    });

    const buttonViewModel = mod.buildBbmHiddenElementsButtonViewModel(state);
    assert.equal(buttonViewModel.hiddenCount, 2);

    const popoverViewModel = mod.buildBbmHiddenElementsPopoverViewModel(state);
    assert.deepEqual(
      popoverViewModel.items.map((item) => ({
        elementId: item.elementId,
        label: item.label,
        enabled: item.enabled,
      })),
      [
        { elementId: "sample.layout.second", label: "Zweites Layout-Ziel", enabled: false },
        { elementId: "sample.preview.third", label: "Preview-Ziel", enabled: true },
      ]
    );
    assert.equal(popoverViewModel.items.some((item) => item.elementId === "sample.layout.first"), false);
  });

  await run("BBM UI-Editor-Runtime: Launcher ist nur im DEV-Kontext sichtbar", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };

    const hidden = await mod.installBbmUiEditorRuntimeLauncher({ devEnabled: false, doc, win });
    assert.equal(hidden, null);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-launcher-host="true"]')), false);

    const button = await mod.installBbmUiEditorRuntimeLauncher({ devEnabled: true, doc, win, activeUiScope: null });
    assert.equal(Boolean(button), true);
    assert.equal(isMountedVisibleButton(doc, button), true);
    assert.equal(button.className, "ui-editor-launcher-button");
    assert.equal(button.getAttribute("data-ui-editor-active-ui-scope"), "");
    assert.equal(doc.querySelector('[data-ui-editor-launcher-host="true"]'), button);
    assert.equal(doc.querySelector('link[data-ui-editor-launcher-css="true"]').href, "../../uiEditor/uiEditorLauncherButton.css");
  });

  await run("BBM UI-Editor-Runtime: installierter Artifact-Import erzeugt sichtbaren Fake-DOM-Button", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win: globalThis,
      activeUiScope: null,
    });

    assert.equal(isMountedVisibleButton(doc, button), true);
    assert.equal(button.getAttribute("data-ui-editor-launcher-active"), "false");
    assert.equal(doc.body.getAttribute("data-ui-editor-active"), "false");
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-launcher-status="true"]')), false);
    assert.equal(Boolean(doc.querySelector('[data-ui-inspector-panel="true"]')), false);
  });

  await run("BBM UI-Editor-Runtime: Klick toggelt nur neutralen Launcher-State", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const toggles = [];
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: null,
      onToggle: (event) => toggles.push(event),
    });

    assert.equal(button.dataset.uiEditorLauncherActive, "false");
    assert.equal(button.getAttribute("aria-pressed"), "false");
    assert.equal(doc.body.getAttribute("data-ui-editor-active"), "false");

    button.click();
    assert.equal(button.dataset.uiEditorLauncherActive, "true");
    assert.equal(button.getAttribute("data-ui-editor-launcher-active"), "true");
    assert.equal(button.getAttribute("aria-pressed"), "true");
    assert.equal(doc.body.getAttribute("data-ui-editor-active"), "true");
    const activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(Boolean(activeStatus), true);
    assert.equal(
      getStatusText(activeStatus),
      "UI-Editor aktiv\nScope: nicht erkannt\n\nRegistrierte Elemente:\nnicht verfügbar"
    );

    button.click();
    assert.equal(button.dataset.uiEditorLauncherActive, "false");
    assert.equal(button.getAttribute("data-ui-editor-launcher-active"), "false");
    assert.equal(button.getAttribute("aria-pressed"), "false");
    assert.equal(doc.body.getAttribute("data-ui-editor-active"), "false");
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-launcher-status="true"]')), false);

    assert.deepEqual(toggles.map((event) => event.uiEditorLauncherActive), [true, false]);
    assert.deepEqual(toggles.map((event) => event.activeUiScope), [null, null]);
    assert.equal(Boolean(doc.querySelector('[data-ui-inspector-panel="true"]')), false);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-panel="true"]')), false);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-hover-frame="true"]')), false);
  });

  await run("BBM UI-Editor-Runtime: aktiver Status zeigt uebergebenen bekannten Scope", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const toggles = [];
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "protokoll.topsScreen",
      onToggle: (event) => toggles.push(event),
    });

    assert.equal(button.getAttribute("data-ui-editor-active-ui-scope"), "protokoll.topsScreen");
    button.click();

    const activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(Boolean(activeStatus), true);
    assert.equal(
      getStatusText(activeStatus),
      "UI-Editor aktiv\nScope: protokoll.topsScreen\n\nRegistrierte Elemente:\nnicht verfügbar"
    );
    assert.deepEqual(toggles.map((event) => event.activeUiScope), ["protokoll.topsScreen"]);
    assert.equal(Boolean(doc.querySelector('[data-ui-inspector-panel="true"]')), false);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-panel="true"]')), false);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-hover-frame="true"]')), false);
  });

  await run("BBM UI-Editor-Runtime: leerer Scope zeigt nicht erkannt", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "   ",
    });

    button.click();

    const activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(Boolean(activeStatus), true);
    assert.equal(
      getStatusText(activeStatus),
      "UI-Editor aktiv\nScope: nicht erkannt\n\nRegistrierte Elemente:\nnicht verfügbar"
    );
  });

  await run("BBM UI-Editor-Runtime: aktiver Status zeigt registrierte Elementliste rein lesend", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "protokoll.topsScreen",
      registeredElements: [
        { id: "protokoll.root", label: "Root", area: "Protokoll", projectId: "17", text: "Fachdaten" },
        { id: "protokoll.header" },
        { id: "  " },
      ],
    });

    button.click();

    const activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(Boolean(activeStatus), true);
    assert.equal(getStatusText(activeStatus).includes("Registrierte Elemente:"), true);
    assert.equal(getStatusText(activeStatus).includes("* protokoll.root"), true);
    assert.equal(getStatusText(activeStatus).includes("* protokoll.header"), true);
    assert.equal(getStatusText(activeStatus).includes("projectId"), false);
    assert.equal(getStatusText(activeStatus).includes("Fachdaten"), false);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-panel="true"]')), false);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-hover-frame="true"]')), false);
  });

  await run("BBM UI-Editor-Runtime: Helper uebernimmt nur uebergebene Registry-Daten", async () => {
    const mod = await loadRuntime();
    assert.deepEqual(mod.normalizeReadonlyRegisteredElements(null), []);
    assert.deepEqual(mod.normalizeReadonlyRegisteredElements([{ id: "x", value: "Fachdaten", label: "Name" }]), [
      { id: "x", label: "Name", area: "" },
    ]);
    assert.equal(
      mod.getReadonlyRegisteredElementsText([{ id: "x", name: "Element" }]),
      "Registrierte Elemente:\n\n* x (Element)"
    );
    assert.equal(mod.getReadonlyRegisteredElementsText([]), "Registrierte Elemente:\nnicht verfügbar");
  });
  await run("BBM UI-Editor-Runtime: Lesemodus listet Restarbeiten-M1-Scope", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registries = {
      "protokoll.topsScreen": {
        uiScope: "protokoll.topsScreen",
        moduleId: "protokoll",
        elements: [{ id: "protokoll.root", name: "Protokoll", type: "root", role: "layout", parentId: null, allowedOps: ["inspect"], lockedOps: [] }],
      },
      "bbm.demo.editorMove": {
        uiScope: "bbm.demo.editorMove",
        moduleId: "uiEditor",
        elements: [{ id: "bbm.demo.root", name: "Demo", type: "root", role: "layout", parentId: null, allowedOps: ["inspect"], lockedOps: [] }],
      },
      "restarbeiten.screen": {
        uiScope: "restarbeiten.screen",
        moduleId: "restarbeiten",
        elements: [{ id: "restarbeiten.root", name: "Restarbeiten", type: "root", role: "layout", parentId: null, allowedOps: ["inspect"], lockedOps: [] }],
      },
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "protokoll.topsScreen",
      availableUiScopes: [
        { uiScope: "protokoll.topsScreen", moduleId: "protokoll", status: "available" },
        { uiScope: "bbm.demo.editorMove", moduleId: "uiEditor", status: "available" },
        { uiScope: "restarbeiten.screen", moduleId: "restarbeiten", status: "available" },
      ],
      registryResolver: (scopeId) => registries[scopeId] || { ok: false, uiScope: scopeId, elements: [], reason: "unknown" },
    });

    button.click();
    let activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("protokoll.topsScreen"), true);
    assert.equal(getStatusText(activeStatus).includes("* protokoll.topsScreen"), true);
    assert.equal(getStatusText(activeStatus).includes("* bbm.demo.editorMove"), true);
    assert.equal(getStatusText(activeStatus).includes("* restarbeiten.screen"), true);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-scope-list="true"]')), true);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-scope-option="restarbeiten.screen"]')), true);

    const demoScopeButton = doc.querySelector('[data-ui-editor-scope-option="bbm.demo.editorMove"]');
    assert.equal(Boolean(demoScopeButton), true);
    demoScopeButton.click();

    activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Scope: bbm.demo.editorMove"), true);
    assert.equal(getStatusText(activeStatus).includes("Modul: uiEditor"), true);
    assert.equal(getStatusText(activeStatus).includes("Elemente: 1"), true);
    assert.equal(getStatusText(activeStatus).includes("bbm.demo.root"), true);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-panel="true"]')), false);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-hover-frame="true"]')), false);
  });

  await run("BBM UI-Editor-Runtime: Klick auf registrierte Restarbeiten-ID waehlt und markiert Ziel", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registry = {
      uiScope: "restarbeiten.screen",
      moduleId: "restarbeiten",
      elements: [
        { id: "restarbeiten.filterbar", name: "Filterleiste", type: "toolbar", role: "layout", parentId: "restarbeiten.root", allowedOps: ["inspect"], lockedOps: [] },
        { id: "restarbeiten.filterbar.class.defect", name: "Mangel", type: "button", role: "visibility", parentId: "restarbeiten.filterbar", allowedOps: ["inspect"], lockedOps: [] },
        { id: "restarbeiten.record.shortText", name: "Kurztext", type: "label", role: "content", parentId: "restarbeiten.record.contentColumn", allowedOps: ["inspect"], lockedOps: [] },
        { id: "restarbeiten.record.longText", name: "Langtext", type: "label", role: "content", parentId: "restarbeiten.record.contentColumn", allowedOps: ["inspect"], lockedOps: [] },
      ],
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => registry,
    });
    const target = doc.createElement("button");
    target.setAttribute("data-ui-editor-id", "restarbeiten.filterbar.class.defect");
    const nextTarget = doc.createElement("div");
    nextTarget.setAttribute("data-ui-editor-id", "restarbeiten.record.longText");
    doc.body.appendChild(target);
    doc.body.appendChild(nextTarget);

    button.click();
    doc.dispatchEvent({
      type: "click",
      target,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
    });

    const activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.filterbar.class.defect"), true);
    assert.equal(getStatusText(activeStatus).includes("Name: Mangel"), true);
    assert.equal(target.getAttribute("data-ui-editor-selected"), "true");
    assert.equal(target.style.outline.includes("#2563eb"), true);

    doc.dispatchEvent({ type: "click", target: nextTarget });
    assert.equal(target.getAttribute("data-ui-editor-selected"), "false");
    assert.equal(target.style.outline, "");
    assert.equal(nextTarget.getAttribute("data-ui-editor-selected"), "true");
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.record.longText"), true);
    assert.equal(getStatusText(activeStatus).includes("Name: Langtext"), true);
  });

  await run("BBM UI-Editor-Runtime: Klick auf Child findet naechsten data-ui-editor-id-Parent", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => ({
        uiScope: "restarbeiten.screen",
        moduleId: "restarbeiten",
        elements: [{ id: "restarbeiten.record.shortText", name: "Kurztext", type: "label", role: "content", parentId: "restarbeiten.record", allowedOps: ["inspect"], lockedOps: [] }],
      }),
    });
    const parent = doc.createElement("div");
    parent.setAttribute("data-ui-editor-id", "restarbeiten.record.shortText");
    const child = doc.createElement("span");
    parent.appendChild(child);
    doc.body.appendChild(parent);

    button.click();
    doc.dispatchEvent({ type: "click", target: child });

    assert.equal(parent.getAttribute("data-ui-editor-selected"), "true");
    assert.equal(child.getAttribute("data-ui-editor-selected"), null);
    const activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.record.shortText"), true);
  });

  await run("BBM UI-Editor-Runtime: Hover zeigt registriertes Ziel und blockiert Eingabefeld nicht", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => ({
        uiScope: "restarbeiten.screen",
        moduleId: "restarbeiten",
        elements: [
          { id: "restarbeiten.editbox.text.long", name: "Langtext", type: "field", role: "content", parentId: "restarbeiten.editbox", allowedOps: ["inspect"], lockedOps: [] },
        ],
      }),
    });
    const wrapper = doc.createElement("label");
    wrapper.setAttribute("data-ui-editor-id", "restarbeiten.editbox.text.long");
    const textarea = doc.createElement("textarea");
    wrapper.appendChild(textarea);
    doc.body.appendChild(wrapper);

    button.click();
    const event = {
      type: "pointermove",
      target: textarea,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
    };
    doc.dispatchEvent(event);

    const activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Hover: restarbeiten.editbox.text.long"), true);
    assert.equal(wrapper.getAttribute("data-ui-editor-hovered"), "true");
    assert.equal(wrapper.style.outline.includes("dashed"), true);
    assert.equal(event.defaultPrevented, undefined);
  });

  await run("BBM UI-Editor-Runtime: Shift/Alt waehlt DOM- oder Registry-Parent fuer Gruppen", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registry = {
      uiScope: "restarbeiten.screen",
      moduleId: "restarbeiten",
      elements: [
        { id: "restarbeiten.filterbar.group.class", name: "Klasse", type: "group", role: "layout", parentId: "restarbeiten.filterbar", allowedOps: ["inspect"], lockedOps: [] },
        { id: "restarbeiten.filterbar.class.defect", name: "Mangel", type: "button", role: "visibility", parentId: "restarbeiten.filterbar.group.class", allowedOps: ["inspect"], lockedOps: [] },
        { id: "restarbeiten.filterbar.group.location", name: "Verortung", type: "group", role: "layout", parentId: "restarbeiten.filterbar", allowedOps: ["inspect"], lockedOps: [] },
        { id: "restarbeiten.filterbar.location.level1", name: "Verortung L1", type: "field", role: "meta", parentId: "restarbeiten.filterbar.group.location", allowedOps: ["inspect"], lockedOps: [] },
        { id: "restarbeiten.filterbar.group.meta", name: "Meta", type: "group", role: "layout", parentId: "restarbeiten.filterbar", allowedOps: ["inspect"], lockedOps: [] },
        { id: "restarbeiten.filterbar.meta.status", name: "Status", type: "field", role: "status", parentId: "restarbeiten.filterbar.group.meta", allowedOps: ["inspect"], lockedOps: [] },
      ],
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => registry,
    });

    const classGroup = doc.createElement("div");
    classGroup.setAttribute("data-ui-editor-id", "restarbeiten.filterbar.group.class");
    const defect = doc.createElement("button");
    defect.setAttribute("data-ui-editor-id", "restarbeiten.filterbar.class.defect");
    classGroup.appendChild(defect);
    const locationGroup = doc.createElement("div");
    locationGroup.setAttribute("data-ui-editor-id", "restarbeiten.filterbar.group.location");
    const locationField = doc.createElement("select");
    locationField.setAttribute("data-ui-editor-id", "restarbeiten.filterbar.location.level1");
    locationGroup.appendChild(locationField);
    const metaGroup = doc.createElement("div");
    metaGroup.setAttribute("data-ui-editor-id", "restarbeiten.filterbar.group.meta");
    const metaField = doc.createElement("select");
    metaField.setAttribute("data-ui-editor-id", "restarbeiten.filterbar.meta.status");
    metaGroup.appendChild(metaField);
    doc.body.append(classGroup, locationGroup, metaGroup);

    button.click();
    doc.dispatchEvent({ type: "click", target: locationField });
    let activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.filterbar.location.level1"), true);
    assert.equal(locationField.getAttribute("data-ui-editor-selected"), "true");

    doc.dispatchEvent({ type: "click", target: metaField });
    activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.filterbar.meta.status"), true);
    assert.equal(metaField.getAttribute("data-ui-editor-selected"), "true");

    doc.dispatchEvent({ type: "click", target: defect, shiftKey: true });
    activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.filterbar.group.class"), true);
    assert.equal(classGroup.getAttribute("data-ui-editor-selected"), "true");

    doc.dispatchEvent({ type: "click", target: locationField, altKey: true });
    activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.filterbar.group.location"), true);
    assert.equal(locationGroup.getAttribute("data-ui-editor-selected"), "true");

    doc.dispatchEvent({ type: "click", target: metaField, shiftKey: true });
    activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.filterbar.group.meta"), true);
    assert.equal(metaGroup.getAttribute("data-ui-editor-selected"), "true");
  });

  await run("BBM UI-Editor-Runtime: Quicklane-Button und Gruppe sind per Klick auswaehlbar", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registry = {
      uiScope: "restarbeiten.screen",
      moduleId: "restarbeiten",
      elements: [
        { id: "restarbeiten.quicklane", name: "Quicklane", type: "toolbar", role: "layout", parentId: "restarbeiten.root", allowedOps: ["inspect"], lockedOps: [] },
        { id: "restarbeiten.quicklane.group.output", name: "Ausgabe", type: "group", role: "action", parentId: "restarbeiten.quicklane", allowedOps: ["inspect"], lockedOps: [] },
        { id: "restarbeiten.quicklane.output.print", name: "Drucken", type: "button", role: "action", parentId: "restarbeiten.quicklane.group.output", allowedOps: ["inspect"], lockedOps: [] },
      ],
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => registry,
    });

    const quicklane = doc.createElement("section");
    quicklane.setAttribute("data-ui-editor-id", "restarbeiten.quicklane");
    const outputGroup = doc.createElement("div");
    outputGroup.setAttribute("data-ui-editor-id", "restarbeiten.quicklane.group.output");
    const outputButton = doc.createElement("button");
    outputButton.setAttribute("data-ui-editor-id", "restarbeiten.quicklane.output.print");
    outputGroup.appendChild(outputButton);
    quicklane.appendChild(outputGroup);
    doc.body.appendChild(quicklane);

    button.click();
    doc.dispatchEvent({ type: "click", target: outputButton });
    let activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.quicklane.output.print"), true);
    assert.equal(outputButton.getAttribute("data-ui-editor-selected"), "true");

    doc.dispatchEvent({ type: "click", target: outputButton, shiftKey: true });
    activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.quicklane.group.output"), true);
    assert.equal(outputGroup.getAttribute("data-ui-editor-selected"), "true");

    doc.dispatchEvent({ type: "click", target: outputButton, altKey: true });
    activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.quicklane.group.output"), true);
    assert.equal(outputGroup.getAttribute("data-ui-editor-selected"), "true");
  });

  await run("BBM UI-Editor-Runtime: Kurz- und Langtext-Input sind getrennt von ihren Gruppen auswaehlbar", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registry = {
      uiScope: "restarbeiten.screen",
      moduleId: "restarbeiten",
      elements: [
        { id: "restarbeiten.editbox.text.short", name: "Kurztext", type: "field", role: "content", parentId: "restarbeiten.editbox", allowedOps: ["inspect"], lockedOps: [] },
        { id: "restarbeiten.editbox.text.short.input", name: "Kurztext-Eingabe", type: "field", role: "content", parentId: "restarbeiten.editbox.text.short", allowedOps: ["inspect"], lockedOps: [] },
        { id: "restarbeiten.editbox.text.long", name: "Langtext", type: "field", role: "content", parentId: "restarbeiten.editbox", allowedOps: ["inspect"], lockedOps: [] },
        { id: "restarbeiten.editbox.text.long.input", name: "Langtext-Eingabe", type: "field", role: "content", parentId: "restarbeiten.editbox.text.long", allowedOps: ["inspect"], lockedOps: [] },
      ],
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => registry,
    });

    const shortGroup = doc.createElement("div");
    shortGroup.setAttribute("data-ui-editor-id", "restarbeiten.editbox.text.short");
    const shortInput = doc.createElement("input");
    shortInput.setAttribute("data-ui-editor-id", "restarbeiten.editbox.text.short.input");
    shortGroup.appendChild(shortInput);
    const longGroup = doc.createElement("div");
    longGroup.setAttribute("data-ui-editor-id", "restarbeiten.editbox.text.long");
    const longInput = doc.createElement("textarea");
    longInput.setAttribute("data-ui-editor-id", "restarbeiten.editbox.text.long.input");
    longGroup.appendChild(longInput);
    doc.body.append(shortGroup, longGroup);

    button.click();
    doc.dispatchEvent({ type: "click", target: shortInput });
    let activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.editbox.text.short.input"), true);
    assert.equal(shortInput.getAttribute("data-ui-editor-selected"), "true");

    doc.dispatchEvent({ type: "click", target: shortInput, shiftKey: true });
    activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.editbox.text.short"), true);
    assert.equal(shortGroup.getAttribute("data-ui-editor-selected"), "true");

    doc.dispatchEvent({ type: "click", target: longInput });
    activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.editbox.text.long.input"), true);
    assert.equal(longInput.getAttribute("data-ui-editor-selected"), "true");

    doc.dispatchEvent({ type: "click", target: longInput, altKey: true });
    activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: restarbeiten.editbox.text.long"), true);
    assert.equal(longGroup.getAttribute("data-ui-editor-selected"), "true");
  });

  await run("BBM UI-Editor-Runtime: Preview-Bedienung ist im aktiven Auswahlpfad sichtbar", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registry = {
      uiScope: "restarbeiten.screen",
      moduleId: "restarbeiten",
      elements: [
        { id: "restarbeiten.editbox.text.short", name: "Kurztext", type: "field", role: "content", parentId: "restarbeiten.editbox", allowedOps: ["inspect", "move", "resize", "hide", "show"], lockedOps: [] },
      ],
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => registry,
    });
    const target = doc.createElement("div");
    target.setAttribute("data-ui-editor-id", "restarbeiten.editbox.text.short");
    doc.body.appendChild(target);

    button.click();
    let previewPanel = getPreviewPanel(doc);
    assert.equal(Boolean(previewPanel), true);
    assert.equal(getRenderedText(previewPanel).includes("Preview"), true);
    assert.equal(getRenderedText(previewPanel).includes("Kein Element"), true);
    assert.equal(getLatestPreviewAction(doc, "move-left").disabled, true);

    doc.dispatchEvent({ type: "click", target });
    previewPanel = getPreviewPanel(doc);
    const panelText = getRenderedText(previewPanel);
    assert.equal(panelText.includes("Preview"), true);
    assert.equal(panelText.includes("Element-ID: restarbeiten.editbox.text.short"), true);
    assert.equal(panelText.includes("allowedOps: inspect, move, resize, hide, show"), true);
    const controls = getLatestPreviewControls(doc);
    assert.equal(Boolean(controls), true);
    const details = previewPanel.querySelector('[data-ui-editor-preview-selected]');
    assert.equal(details.getAttribute("data-ui-editor-preview-selected"), "restarbeiten.editbox.text.short");
    assert.equal(details.textContent.includes("Element-ID: restarbeiten.editbox.text.short"), true);
    assert.equal(details.textContent.includes("allowedOps: inspect, move, resize, hide, show"), true);
    const hiddenButton = previewPanel.querySelector('[data-ui-editor-hidden-elements-button="true"]');
    assert.equal(Boolean(hiddenButton), true);
    assert.equal(hiddenButton.textContent, "Ausgeblendete: 0");
    assert.equal(hiddenButton.disabled, true);
    assert.equal(hiddenButton.getAttribute("data-ui-editor-hidden-elements-count"), "0");
    assert.equal(getLatestPreviewAction(doc, "move-left").textContent, "Links");
    assert.equal(getLatestPreviewAction(doc, "move-right").textContent, "Rechts");
    assert.equal(getLatestPreviewAction(doc, "move-up").textContent, "Hoch");
    assert.equal(getLatestPreviewAction(doc, "move-down").textContent, "Runter");
    assert.equal(getLatestPreviewAction(doc, "width-plus").textContent, "Breite +");
    assert.equal(getLatestPreviewAction(doc, "width-minus").textContent, "Breite -");
    assert.equal(getLatestPreviewAction(doc, "height-plus").textContent, "Hoehe +");
    assert.equal(getLatestPreviewAction(doc, "height-minus").textContent, "Hoehe -");
    assert.equal(getLatestPreviewAction(doc, "hide").textContent, "Ausblenden");
    assert.equal(getLatestPreviewAction(doc, "show").textContent, "Einblenden");
    assert.equal(getLatestPreviewAction(doc, "reset").textContent, "Reset");
  });

  await run("BBM UI-Editor-Runtime: Restarbeiten-Preview wendet erlaubte Move/Resize/Hide-Operationen temporaer an", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registry = {
      uiScope: "restarbeiten.screen",
      moduleId: "restarbeiten",
      elements: [
        { id: "restarbeiten.editbox.text.short", name: "Kurztext", type: "field", role: "content", parentId: "restarbeiten.editbox", allowedOps: ["inspect", "move", "resize", "hide", "show"], lockedOps: [] },
      ],
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => registry,
    });

    const target = doc.createElement("div");
    target.setAttribute("data-ui-editor-id", "restarbeiten.editbox.text.short");
    target.style.width = "100px";
    target.style.height = "40px";
    doc.body.appendChild(target);

    button.click();
    doc.dispatchEvent({ type: "click", target });

    assert.equal(Boolean(getLatestPreviewControls(doc)), true);
    getLatestPreviewAction(doc, "move-right").click();
    assert.equal(target.style.transform, "translate(5px, 0px)");
    assert.equal(target.getAttribute("data-ui-editor-preview"), "true");

    getLatestPreviewAction(doc, "width-plus").click();
    assert.equal(target.style.width, "105px");

    getLatestPreviewAction(doc, "height-plus").click();
    assert.equal(target.style.height, "45px");

    getLatestPreviewAction(doc, "hide").click();
    assert.equal(target.style.display, "none");
    let hiddenButton = getPreviewPanel(doc).querySelector('[data-ui-editor-hidden-elements-button="true"]');
    assert.equal(hiddenButton.textContent, "Ausgeblendete: 1");
    assert.equal(hiddenButton.disabled, false);
    assert.equal(hiddenButton.getAttribute("data-ui-editor-hidden-elements-count"), "1");
    assert.equal(Boolean(getPreviewPanel(doc).querySelector('[data-ui-editor-hidden-elements-popover="true"]')), false);
    hiddenButton.click();
    let hiddenPopover = getPreviewPanel(doc).querySelector('[data-ui-editor-hidden-elements-popover="true"]');
    assert.equal(Boolean(hiddenPopover), true);
    assert.equal(getRenderedText(hiddenPopover).includes("Ausgeblendete Elemente"), true);
    assert.equal(getRenderedText(hiddenPopover).includes("Kurztext"), true);
    const showHiddenButton = hiddenPopover.querySelector('[data-ui-editor-hidden-elements-action="show"]');
    assert.equal(Boolean(showHiddenButton), true);
    assert.equal(showHiddenButton.disabled, false);
    hiddenButton = getPreviewPanel(doc).querySelector('[data-ui-editor-hidden-elements-button="true"]');
    hiddenButton.click();
    assert.equal(Boolean(getPreviewPanel(doc).querySelector('[data-ui-editor-hidden-elements-popover="true"]')), false);
    hiddenButton = getPreviewPanel(doc).querySelector('[data-ui-editor-hidden-elements-button="true"]');
    hiddenButton.click();
    hiddenPopover = getPreviewPanel(doc).querySelector('[data-ui-editor-hidden-elements-popover="true"]');
    hiddenPopover.querySelector('[data-ui-editor-hidden-elements-action="show"]').click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(target.style.display, "");
    hiddenButton = getPreviewPanel(doc).querySelector('[data-ui-editor-hidden-elements-button="true"]');
    assert.equal(hiddenButton.textContent, "Ausgeblendete: 0");
    assert.equal(hiddenButton.disabled, true);
    assert.equal(Boolean(getPreviewPanel(doc).querySelector('[data-ui-editor-hidden-elements-popover="true"]')), false);

    getLatestPreviewAction(doc, "hide").click();
    assert.equal(target.style.display, "none");
    getLatestPreviewAction(doc, "show").click();
    assert.equal(target.style.display, "");
    hiddenButton = getPreviewPanel(doc).querySelector('[data-ui-editor-hidden-elements-button="true"]');
    assert.equal(hiddenButton.textContent, "Ausgeblendete: 0");
    assert.equal(hiddenButton.disabled, true);
  });

  await run("BBM UI-Editor-Runtime: Preview-Operationen erzeugen deduplizierte ChangeRequests im State", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const target = doc.createElement("input");
    target.setAttribute("data-ui-editor-id", "sample.field.input");
    target.style.width = "100px";
    target.style.height = "30px";
    const registryElement = {
      id: "sample.field.input",
      name: "Eingabe",
      type: "field",
      role: "content",
      parentId: "sample.field",
      allowedOps: ["inspect", "move", "width", "height", "hide", "show"],
      lockedOps: [],
      previewTargetMode: "self",
    };
    const state = mod.createLauncherState({
      activeUiScope: "sample.screen",
      registeredElements: [registryElement],
    });
    state.selectedElement = registryElement;
    state.selectedTargetNode = target;
    state.selectedPreviewTargetNode = target;

    assert.equal(mod.applyPreviewOperation(state, "move", { dx: 5, dy: 0 }), true);
    assert.equal(mod.applyPreviewOperation(state, "move", { dx: 5, dy: 0 }), true);
    assert.equal(state.pendingChangeRequests.length, 1);
    assert.equal(state.pendingChangeRequests[0].operation, "move");
    assert.equal(state.pendingChangeRequests[0].elementId, "sample.field.input");
    assert.equal(state.pendingChangeRequests[0].targetAppId, "bbm");
    assert.equal(state.pendingChangeRequests[0].targetElementId, "sample.field.input");
    assert.equal(state.pendingChangeRequests[0].previewTargetMode, "self");
    assert.equal(state.pendingChangeRequests[0].source, "preview");
    assert.equal(state.pendingChangeRequests[0].persistent, false);
    assert.deepEqual(state.pendingChangeRequests[0].payload, { dx: 10, dy: 0 });
    assert.equal(target.style.transform, "translate(10px, 0px)");

    mod.applyPreviewOperation(state, "resizeWidth", { delta: 5 });
    mod.applyPreviewOperation(state, "resizeHeight", { delta: 5 });
    assert.equal(state.pendingChangeRequests.length, 3);
    assert.deepEqual(state.pendingChangeRequests.find((request) => request.operation === "width").payload, { delta: 5 });
    assert.deepEqual(state.pendingChangeRequests.find((request) => request.operation === "height").payload, { delta: 5 });
    assert.equal(target.style.width, "105px");
    assert.equal(target.style.height, "35px");

    mod.applyPreviewOperation(state, "hide");
    let visibilityRequests = state.pendingChangeRequests.filter((request) => request.operation === "visibility");
    assert.equal(visibilityRequests.length, 1);
    assert.equal(visibilityRequests[0].operation, "visibility");
    assert.equal(visibilityRequests[0].elementId, "sample.field.input");
    assert.equal(visibilityRequests[0].targetElementId, "sample.field.input");
    assert.equal(visibilityRequests[0].targetAppId, "bbm");
    assert.equal(visibilityRequests[0].moduleId, "");
    assert.equal(visibilityRequests[0].scopeId, "sample.screen");
    assert.equal(visibilityRequests[0].source, "preview");
    assert.equal(visibilityRequests[0].persistent, false);
    assert.equal(visibilityRequests[0].previewTargetMode, "self");
    assert.deepEqual(visibilityRequests[0].payload, { visible: false });
    const visibilityChangeId = visibilityRequests[0].changeId;
    assert.equal(target.style.display, "none");

    mod.applyPreviewOperation(state, "show");
    visibilityRequests = state.pendingChangeRequests.filter((request) => request.operation === "visibility");
    assert.equal(visibilityRequests.length, 1);
    assert.equal(visibilityRequests[0].changeId, visibilityChangeId);
    assert.deepEqual(visibilityRequests[0].payload, { visible: true });
    assert.equal(target.style.display, "");

    mod.applyPreviewOperation(state, "hide");
    visibilityRequests = state.pendingChangeRequests.filter((request) => request.operation === "visibility");
    assert.equal(visibilityRequests.length, 1);
    assert.equal(visibilityRequests[0].changeId, visibilityChangeId);
    assert.deepEqual(visibilityRequests[0].payload, { visible: false });
    assert.equal(target.style.display, "none");

    assert.deepEqual(mod.getPendingChangeRequestSummary(state, "sample.field.input").operations.sort(), ["height", "move", "visibility", "width"]);
    mod.resetSelectedPreviewChange(state);
    assert.equal(state.pendingChangeRequests.length, 0);
    assert.equal(target.style.transform, "");
    assert.equal(target.style.width, "100px");
    assert.equal(target.style.height, "30px");

    mod.applyPreviewOperation(state, "move", { dx: 5, dy: 0 });
    assert.equal(state.pendingChangeRequests.length, 1);
    mod.resetAllPreviewChanges(state);
    assert.equal(state.pendingChangeRequests.length, 0);
    assert.equal(target.style.transform, "");
  });

  await run("BBM UI-Editor-Runtime: HostAdapter empfaengt Visibility-ChangeRequests nur als Dry-Run", async () => {
    const [mod, hostContract] = await Promise.all([
      loadRuntime(),
      importEsmFromFile(HOST_CONTRACT_PATH),
    ]);
    const doc = createFakeDocument();
    const pendingSnapshots = [];
    const registry = {
      targetAppId: "sample-app",
      uiScope: "sample.screen",
      moduleId: "sample",
      elements: [
        {
          id: "sample.field.input",
          name: "Eingabe",
          type: "field",
          role: "content",
          parentId: "sample.field",
          allowedOps: ["inspect", "move", "width", "height", "hide", "show"],
          lockedOps: [],
          previewTargetMode: "self",
        },
      ],
    };
    const hostAdapter = hostContract.createInMemoryBbmEditorHostAdapter({
      hostContext: {
        targetAppId: "sample-app",
        moduleId: "sample",
        activeUiScope: "sample.screen",
      },
      registry: registry.elements,
      onPendingChangeRequestsChanged(changeRequests) {
        pendingSnapshots.push(changeRequests);
      },
    });
    const target = doc.createElement("input");
    target.setAttribute("data-ui-editor-id", "sample.field.input");
    target.style.width = "100px";
    target.style.height = "30px";
    const state = mod.createLauncherState({
      activeUiScope: "sample.screen",
      hostAdapter,
    });
    state.selectedElement = registry.elements[0];
    state.selectedTargetNode = target;
    state.selectedPreviewTargetNode = target;

    assert.equal(state.selectedRegistry.targetAppId, "sample-app");
    assert.equal(state.selectedRegistry.moduleId, "sample");
    assert.equal(mod.applyPreviewOperation(state, "hide", {}), true);
    assert.equal(pendingSnapshots.length, 1);
    assert.equal(pendingSnapshots[0].length, 1);
    assert.equal(pendingSnapshots[0][0].operation, "visibility");
    assert.deepEqual(pendingSnapshots[0][0].payload, { visible: false });
    assert.equal(pendingSnapshots[0][0].source, "preview");
    assert.equal(pendingSnapshots[0][0].targetAppId, "sample-app");
    assert.equal(pendingSnapshots[0][0].persistent, false);

    assert.equal(mod.applyPreviewOperation(state, "show", {}), true);
    assert.equal(pendingSnapshots.length, 2);
    assert.equal(pendingSnapshots[1].length, 1);
    assert.equal(pendingSnapshots[1][0].changeId, pendingSnapshots[0][0].changeId);
    assert.equal(pendingSnapshots[1][0].operation, "visibility");
    assert.deepEqual(pendingSnapshots[1][0].payload, { visible: true });
    assert.equal(pendingSnapshots[1][0].source, "preview");
    assert.equal(pendingSnapshots[1][0].persistent, false);

    const dryRunResult = hostAdapter.submitChangeRequests(state.pendingChangeRequests);
    assert.equal(dryRunResult.ok, false);
    assert.equal(dryRunResult.blocked, true);
    assert.equal(dryRunResult.reason, "PERSISTENCE_DISABLED");
    assert.equal(dryRunResult.persistenceDisabled, true);
    assert.equal(dryRunResult.visibilityPersistenceDisabled, true);
    assert.equal(dryRunResult.canPersistVisibility, false);
    assert.equal(dryRunResult.dryRunOnly, true);
    assert.equal(dryRunResult.changeRequests.length, 1);
    assert.equal(dryRunResult.changeRequests[0].operation, "visibility");
    assert.deepEqual(dryRunResult.changeRequests[0].payload, { visible: true });

    const persistentDryRunResult = hostAdapter.submitChangeRequests([
      {
        ...state.pendingChangeRequests[0],
        persistent: true,
        payload: { visible: false },
      },
    ]);
    assert.equal(persistentDryRunResult.ok, false);
    assert.equal(persistentDryRunResult.blocked, true);
    assert.equal(persistentDryRunResult.reason, "INVALID_CHANGE_REQUEST");
    assert.equal(persistentDryRunResult.persistenceDisabled, true);
    assert.equal(persistentDryRunResult.visibilityPersistenceDisabled, true);
    assert.equal(persistentDryRunResult.canPersistVisibility, false);
    assert.equal(persistentDryRunResult.dryRunOnly, true);
    assert.ok(persistentDryRunResult.validation.errors.some((error) => error.code === "SCOPE_NOT_ALLOWED"));
    assert.equal(persistentDryRunResult.changeRequests[0].persistent, true);
    assert.deepEqual(persistentDryRunResult.changeRequests[0].payload, { visible: false });

    mod.resetAllPreviewChanges(state);
    assert.equal(pendingSnapshots[pendingSnapshots.length - 1].length, 0);
  });

  await run("BBM UI-Editor-Runtime: Preview-Panel zeigt vorbereitete Aenderungen und verwirft sie temporaer", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registry = {
      uiScope: "sample.screen",
      moduleId: "sample",
      elements: [
        { id: "sample.target", name: "Ziel", type: "field", role: "content", parentId: "sample.root", allowedOps: ["inspect", "move", "width", "height", "hide", "show"], lockedOps: [], previewTargetMode: "self" },
      ],
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "sample.screen",
      registryResolver: () => registry,
    });
    const target = doc.createElement("div");
    target.setAttribute("data-ui-editor-id", "sample.target");
    target.style.width = "120px";
    target.style.height = "40px";
    doc.body.appendChild(target);

    button.click();
    doc.dispatchEvent({ type: "click", target });
    assert.equal(getRenderedText(getPreviewPanel(doc)).includes("Aenderungen vorbereitet: 0"), true);
    assert.equal(getRenderedText(getPreviewPanel(doc)).includes("Noch nicht gespeichert"), true);

    getLatestPreviewAction(doc, "move-right").click();
    getLatestPreviewAction(doc, "move-right").click();
    getLatestPreviewAction(doc, "width-plus").click();
    getLatestPreviewAction(doc, "height-plus").click();
    getLatestPreviewAction(doc, "hide").click();
    const panelText = getRenderedText(getPreviewPanel(doc));
    assert.equal(panelText.includes("Aenderungen vorbereitet: 4"), true);
    assert.equal(panelText.includes("Operationen aktuelles Element: move / width / height / visibility"), true);
    assert.equal(target.style.transform, "translate(10px, 0px)");
    assert.equal(target.style.width, "125px");
    assert.equal(target.style.height, "45px");
    assert.equal(target.style.display, "none");

    getLatestPreviewAction(doc, "discard-changes").click();
    const discardedPanelText = getRenderedText(getPreviewPanel(doc));
    assert.equal(discardedPanelText.includes("Element-ID: sample.target"), true);
    assert.equal(discardedPanelText.includes("Aenderungen vorbereitet: 0"), true);
    assert.equal(discardedPanelText.includes("Status: Aenderungen verworfen."), true);
    assert.equal(target.getAttribute("data-ui-editor-selected"), "true");
    assert.equal(target.style.transform, "");
    assert.equal(target.style.width, "120px");
    assert.equal(target.style.height, "40px");
    assert.equal(target.style.display, "");
  });

  await run("BBM UI-Editor-Runtime: Editbox-Preview respektiert echte Registry-Granularitaet", async () => {
    const mod = await loadRuntime();
    const registryModule = await importEsmFromFile(BBM_REGISTRY_PATH);
    const realRegistry = registryModule.getBbmUiEditorRegistry("restarbeiten.screen");
    const requiredIds = [
      "restarbeiten.editbox.text.short",
      "restarbeiten.editbox.text.short.label",
      "restarbeiten.editbox.text.short.input",
      "restarbeiten.editbox.text.short.remaining",
      "restarbeiten.editbox.action.new",
      "restarbeiten.editbox.action.delete",
    ];
    const registryElements = requiredIds.map((id) => {
      const element = realRegistry.elements.find((entry) => entry.id === id);
      assert.equal(Boolean(element), true, `${id} exists in real registry`);
      return element;
    });
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registry = {
      uiScope: "restarbeiten.screen",
      moduleId: "restarbeiten",
      elements: registryElements,
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => registry,
    });

    const group = doc.createElement("div");
    group.className = "bbm-restarbeiten-text-field";
    group.setAttribute("data-ui-editor-id", "restarbeiten.editbox.text.short");
    group.style.width = "180px";
    group.style.height = "44px";
    const label = doc.createElement("span");
    label.setAttribute("data-ui-editor-id", "restarbeiten.editbox.text.short.label");
    label.style.width = "72px";
    const input = doc.createElement("input");
    input.setAttribute("data-ui-editor-id", "restarbeiten.editbox.text.short.input");
    input.style.width = "88px";
    input.style.height = "20px";
    const sibling = doc.createElement("span");
    sibling.setAttribute("data-ui-editor-id", "restarbeiten.editbox.text.short.remaining");
    const newButton = doc.createElement("button");
    newButton.setAttribute("data-ui-editor-id", "restarbeiten.editbox.action.new");
    newButton.style.width = "32px";
    newButton.style.height = "20px";
    let newButtonActionCount = 0;
    newButton.addEventListener("click", () => {
      newButtonActionCount += 1;
    });
    const deleteButton = doc.createElement("button");
    deleteButton.setAttribute("data-ui-editor-id", "restarbeiten.editbox.action.delete");
    deleteButton.style.width = "52px";
    deleteButton.style.height = "20px";
    let deleteButtonActionCount = 0;
    deleteButton.addEventListener("click", () => {
      deleteButtonActionCount += 1;
    });
    group.append(label, input, sibling, newButton, deleteButton);
    doc.body.appendChild(group);

    button.click();

    doc.dispatchEvent({ type: "click", target: group });
    let panelText = getRenderedText(getPreviewPanel(doc));
    assert.equal(panelText.includes("editGranularity: container"), true);
    assert.equal(panelText.includes("previewTargetMode: self"), true);
    assert.equal(panelText.includes("affectsContainer: true"), true);
    assert.equal(panelText.includes("allowedOps: inspect, move, resize, width, height, hide, show"), true);
    getLatestPreviewAction(doc, "move-right").click();
    assert.equal(group.style.transform, "translate(5px, 0px)");
    assert.equal(label.style.transform || "", "");
    assert.equal(input.style.transform || "", "");
    assert.equal(newButton.style.transform || "", "");
    getLatestPreviewAction(doc, "width-plus").click();
    assert.equal(group.style.width, "185px");
    assert.equal(label.style.width, "72px");
    assert.equal(input.style.width, "88px");
    getLatestPreviewAction(doc, "height-plus").click();
    assert.equal(group.style.height, "49px");
    assert.equal(input.style.height, "20px");
    getLatestPreviewAction(doc, "reset").click();
    assert.equal(group.style.transform, "");
    assert.equal(group.style.width, "180px");
    assert.equal(group.style.height, "44px");

    doc.dispatchEvent({ type: "click", target: label });
    panelText = getRenderedText(getPreviewPanel(doc));
    assert.equal(panelText.includes("Element-ID: restarbeiten.editbox.text.short.label"), true);
    assert.equal(panelText.includes("Preview-Ziel-ID: restarbeiten.editbox.text.short.label"), true);
    assert.equal(panelText.includes("editGranularity: element"), true);
    assert.equal(panelText.includes("previewTargetMode: self"), true);
    assert.equal(panelText.includes("affectsContainer: false"), true);
    assert.equal(panelText.includes("allowedOps: inspect, move, width, hide, show"), true);
    getLatestPreviewAction(doc, "move-right").click();
    assert.equal(label.style.transform, "translate(5px, 0px)");
    assert.equal(group.style.transform || "", "");
    assert.equal(input.style.transform || "", "");
    getLatestPreviewAction(doc, "width-plus").click();
    assert.equal(label.style.width, "77px");
    assert.equal(input.style.width, "88px");
    getLatestPreviewAction(doc, "hide").click();
    assert.equal(label.style.display, "none");
    assert.equal(input.style.display || "", "");
    assert.equal(sibling.style.display || "", "");
    getLatestPreviewAction(doc, "reset").click();
    assert.equal(label.style.transform, "");
    assert.equal(label.style.width, "72px");
    assert.equal(label.style.display, "");

    doc.dispatchEvent({ type: "click", target: input });
    panelText = getRenderedText(getPreviewPanel(doc));
    assert.equal(panelText.includes("Element-ID: restarbeiten.editbox.text.short.input"), true);
    assert.equal(panelText.includes("Preview-Ziel-ID: restarbeiten.editbox.text.short.input"), true);
    assert.equal(panelText.includes("editGranularity: control"), true);
    assert.equal(panelText.includes("previewTargetMode: self"), true);
    assert.equal(panelText.includes("affectsContainer: false"), true);
    assert.equal(panelText.includes("allowedOps: inspect, move, width, height, hide, show"), true);
    assert.equal(panelText.includes("lockedOps: rename"), true);
    assert.equal(getLatestPreviewAction(doc, "move-right").disabled, false);
    assert.equal(getLatestPreviewAction(doc, "width-plus").disabled, false);
    assert.equal(getLatestPreviewAction(doc, "height-plus").disabled, false);
    getLatestPreviewAction(doc, "move-right").click();
    assert.equal(group.style.transform || "", "");
    assert.equal(label.style.transform, "");
    assert.equal(sibling.style.transform || "", "");
    assert.equal(input.style.transform, "translate(5px, 0px)");
    getLatestPreviewAction(doc, "move-up").click();
    assert.equal(input.style.transform, "translate(5px, -5px)");
    assert.equal(group.style.transform || "", "");
    getLatestPreviewAction(doc, "move-down").click();
    assert.equal(input.style.transform, "translate(5px, 0px)");
    assert.equal(group.style.transform || "", "");
    getLatestPreviewAction(doc, "width-plus").click();
    assert.equal(input.style.width, "93px");
    assert.equal(group.style.width, "180px");
    assert.equal(label.style.width, "72px");
    assert.equal(sibling.style.width || "", "");
    getLatestPreviewAction(doc, "height-plus").click();
    assert.equal(input.style.height, "25px");
    assert.equal(group.style.height, "44px");
    assert.equal(label.style.height || "", "");
    assert.equal(sibling.style.height || "", "");
    getLatestPreviewAction(doc, "hide").click();
    assert.equal(input.style.display, "none");
    assert.equal(group.style.display || "", "");
    assert.equal(label.style.display, "");
    assert.equal(sibling.style.display || "", "");
    getLatestPreviewAction(doc, "show").click();
    assert.equal(input.style.display, "");
    getLatestPreviewAction(doc, "reset").click();
    assert.equal(input.style.transform, "");
    assert.equal(input.style.width, "88px");
    assert.equal(input.style.height, "20px");
    assert.equal(input.style.display, "");

    doc.dispatchEvent({ type: "click", target: newButton });
    panelText = getRenderedText(getPreviewPanel(doc));
    assert.equal(panelText.includes("Element-ID: restarbeiten.editbox.action.new"), true);
    assert.equal(panelText.includes("Preview-Ziel-ID: restarbeiten.editbox.action.new"), true);
    assert.equal(panelText.includes("editGranularity: control"), true);
    assert.equal(panelText.includes("allowedOps: inspect, move, width, height, hide, show"), true);
    getLatestPreviewAction(doc, "move-right").click();
    assert.equal(newButton.style.transform, "translate(5px, 0px)");
    assert.equal(group.style.transform || "", "");
    getLatestPreviewAction(doc, "width-plus").click();
    assert.equal(newButton.style.width, "37px");
    getLatestPreviewAction(doc, "height-plus").click();
    assert.equal(newButton.style.height, "25px");
    getLatestPreviewAction(doc, "hide").click();
    assert.equal(newButton.style.display, "none");
    assert.equal(deleteButton.style.display || "", "");
    assert.equal(newButtonActionCount, 0);
    getLatestPreviewAction(doc, "reset").click();
    assert.equal(newButton.style.transform, "");
    assert.equal(newButton.style.width, "32px");
    assert.equal(newButton.style.height, "20px");
    assert.equal(newButton.style.display, "");

    doc.dispatchEvent({ type: "click", target: deleteButton });
    getLatestPreviewAction(doc, "width-plus").click();
    getLatestPreviewAction(doc, "height-plus").click();
    assert.equal(deleteButton.style.width, "57px");
    assert.equal(deleteButton.style.height, "25px");
    assert.equal(newButton.style.width, "32px");
    assert.equal(deleteButtonActionCount, 0);

    const selectedBeforePanelClick = getRenderedText(getPreviewPanel(doc));
    doc.dispatchEvent({ type: "click", target: getPreviewPanel(doc) });
    getLatestPreviewAction(doc, "reset").click();
    assert.equal(getRenderedText(getPreviewPanel(doc)).includes("Element-ID: restarbeiten.editbox.action.delete"), true);
    assert.equal(selectedBeforePanelClick.includes("Element-ID: restarbeiten.editbox.action.delete"), true);
    assert.equal(deleteButton.style.width, "52px");
    assert.equal(deleteButton.style.height, "20px");

    doc.dispatchEvent({ type: "click", target: input });
    getLatestPreviewAction(doc, "move-right").click();
    getLatestPreviewAction(doc, "width-plus").click();
    getLatestPreviewAction(doc, "height-plus").click();
    getLatestPreviewAction(doc, "hide").click();
    assert.equal(input.style.transform, "translate(5px, 0px)");
    assert.equal(input.style.width, "93px");
    assert.equal(input.style.height, "25px");
    assert.equal(input.style.display, "none");
    button.click();
    assert.equal(input.style.transform, "");
    assert.equal(input.style.width, "88px");
    assert.equal(input.style.height, "20px");
    assert.equal(input.style.display, "");
  });

  await run("BBM UI-Editor-Runtime: Preview-Zielauflösung funktioniert generisch ueber Registry-Parent", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registry = {
      uiScope: "sample.screen",
      moduleId: "sample",
      elements: [
        { id: "sample.form.field", name: "Feld", type: "field", role: "content", parentId: "sample.form", allowedOps: ["inspect", "move", "resize", "hide", "show"], lockedOps: [] },
        { id: "sample.form.field.input", name: "Feld-Eingabe", type: "field", role: "content", parentId: "sample.form.field", allowedOps: ["inspect", "move", "resize", "hide", "show"], lockedOps: [], previewTargetMode: "parent", editGranularity: "control", affectsContainer: true },
      ],
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "sample.screen",
      registryResolver: () => registry,
    });

    const parent = doc.createElement("div");
    parent.className = "sample-field";
    parent.setAttribute("data-ui-editor-id", "sample.form.field");
    parent.style.width = "160px";
    parent.style.height = "36px";
    const input = doc.createElement("input");
    input.setAttribute("data-ui-editor-id", "sample.form.field.input");
    parent.appendChild(input);
    doc.body.appendChild(parent);

    button.click();
    doc.dispatchEvent({ type: "click", target: input });

    const panelText = getRenderedText(getPreviewPanel(doc));
    assert.equal(panelText.includes("Element-ID: sample.form.field.input"), true);
    assert.equal(panelText.includes('Preview-Ziel: div[data-ui-editor-id="sample.form.field"].sample-field(Parent-Preview-Ziel)'), true);

    getLatestPreviewAction(doc, "move-right").click();
    assert.equal(parent.style.transform, "translate(5px, 0px)");
    assert.equal(input.style.transform || "", "");
    getLatestPreviewAction(doc, "width-plus").click();
    assert.equal(parent.style.width, "165px");
    getLatestPreviewAction(doc, "hide").click();
    assert.equal(parent.style.display, "none");
    getLatestPreviewAction(doc, "reset").click();
    assert.equal(parent.style.transform, "");
    assert.equal(parent.style.width, "160px");
    assert.equal(parent.style.display, "");
  });

  await run("BBM UI-Editor-Runtime: Restarbeiten-Preview blockiert nicht erlaubte Operationen", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registry = {
      uiScope: "restarbeiten.screen",
      moduleId: "restarbeiten",
      elements: [
        { id: "restarbeiten.record.shortText", name: "Kurztext", type: "label", role: "content", parentId: "restarbeiten.record.contentColumn", allowedOps: ["inspect"], lockedOps: ["move", "resize"] },
      ],
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => registry,
    });
    const target = doc.createElement("span");
    target.setAttribute("data-ui-editor-id", "restarbeiten.record.shortText");
    target.style.width = "80px";
    doc.body.appendChild(target);

    button.click();
    doc.dispatchEvent({ type: "click", target });

    const moveButton = getLatestPreviewAction(doc, "move-right");
    const resizeButton = getLatestPreviewAction(doc, "width-plus");
    const resetButton = getLatestPreviewAction(doc, "reset");
    assert.equal(moveButton.disabled, true);
    assert.equal(resizeButton.disabled, true);
    assert.equal(resetButton.disabled, true);
    assert.equal(mod.applyPreviewOperation(mod.createLauncherState({
      activeUiScope: "restarbeiten.screen",
      registeredElements: registry.elements,
    }), "move", { dx: 5, dy: 0 }), false);
    moveButton.click();
    resizeButton.click();
    assert.equal(target.style.transform || "", "");
    assert.equal(target.style.width, "80px");
    assert.equal(target.getAttribute("data-ui-editor-preview"), null);
  });

  await run("BBM UI-Editor-Runtime: Operation-Mapping fuer Resize bleibt generisch", async () => {
    const mod = await loadRuntime();
    const resizable = { allowedOps: ["inspect", "resize"], lockedOps: [] };
    assert.equal(mod.isPreviewOperationAllowed(resizable, "resizeWidth"), true);
    assert.equal(mod.isPreviewOperationAllowed(resizable, "resizeHeight"), true);

    const widthOnly = { allowedOps: ["inspect", "width"], lockedOps: [] };
    assert.equal(mod.isPreviewOperationAllowed(widthOnly, "resizeWidth"), true);
    assert.equal(mod.isPreviewOperationAllowed(widthOnly, "resizeHeight"), false);

    const heightOnly = { allowedOps: ["inspect", "height"], lockedOps: [] };
    assert.equal(mod.isPreviewOperationAllowed(heightOnly, "resizeWidth"), false);
    assert.equal(mod.isPreviewOperationAllowed(heightOnly, "resizeHeight"), true);

    const lockedResize = { allowedOps: ["inspect", "resize"], lockedOps: ["resize"] };
    assert.equal(mod.isPreviewOperationAllowed(lockedResize, "resizeWidth"), false);
    assert.equal(mod.isPreviewOperationAllowed(lockedResize, "resizeHeight"), false);

    const explicitSizeWithLockedResize = { allowedOps: ["inspect", "resize", "width", "height"], lockedOps: ["resize"] };
    assert.equal(mod.isPreviewOperationAllowed(explicitSizeWithLockedResize, "resizeWidth"), true);
    assert.equal(mod.isPreviewOperationAllowed(explicitSizeWithLockedResize, "resizeHeight"), true);

    const lockedWidth = { allowedOps: ["inspect", "resize"], lockedOps: ["width"] };
    assert.equal(mod.isPreviewOperationAllowed(lockedWidth, "resizeWidth"), false);
    assert.equal(mod.isPreviewOperationAllowed(lockedWidth, "resizeHeight"), true);

    const lockedHeight = { allowedOps: ["inspect", "resize"], lockedOps: ["height"] };
    assert.equal(mod.isPreviewOperationAllowed(lockedHeight, "resizeWidth"), true);
    assert.equal(mod.isPreviewOperationAllowed(lockedHeight, "resizeHeight"), false);

    const lockedExact = { allowedOps: ["inspect", "resize"], lockedOps: ["resizeWidth", "resizeHeight"] };
    assert.equal(mod.isPreviewOperationAllowed(lockedExact, "resizeWidth"), false);
    assert.equal(mod.isPreviewOperationAllowed(lockedExact, "resizeHeight"), false);
  });

  await run("BBM UI-Editor-Runtime: Reset setzt nur das aktuell ausgewaehlte Preview-Ziel zurueck", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registry = {
      uiScope: "sample.screen",
      moduleId: "sample",
      elements: [
        { id: "sample.first", name: "Erstes Ziel", type: "label", role: "content", parentId: "sample.root", allowedOps: ["inspect", "width"], lockedOps: [], editGranularity: "element", previewTargetMode: "self", affectsContainer: false },
        { id: "sample.second", name: "Zweites Ziel", type: "label", role: "content", parentId: "sample.root", allowedOps: ["inspect", "width"], lockedOps: [], editGranularity: "element", previewTargetMode: "self", affectsContainer: false },
      ],
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "sample.screen",
      registryResolver: () => registry,
    });
    const first = doc.createElement("span");
    first.setAttribute("data-ui-editor-id", "sample.first");
    first.style.width = "100px";
    const second = doc.createElement("span");
    second.setAttribute("data-ui-editor-id", "sample.second");
    second.style.width = "120px";
    doc.body.append(first, second);

    button.click();
    doc.dispatchEvent({ type: "click", target: first });
    getLatestPreviewAction(doc, "width-plus").click();
    assert.equal(first.style.width, "105px");

    doc.dispatchEvent({ type: "click", target: second });
    getLatestPreviewAction(doc, "width-plus").click();
    assert.equal(second.style.width, "125px");

    getLatestPreviewAction(doc, "reset").click();
    assert.equal(first.style.width, "105px");
    assert.equal(second.style.width, "120px");
  });

  await run("BBM UI-Editor-Runtime: Restarbeiten-Preview-Reset und Deaktivieren entfernen alle Preview-Styles", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registry = {
      uiScope: "restarbeiten.screen",
      moduleId: "restarbeiten",
      elements: [
        { id: "restarbeiten.filterbar", name: "Filterleiste", type: "toolbar", role: "layout", parentId: "restarbeiten.root", allowedOps: ["inspect", "move", "resize", "hide", "show"], lockedOps: [] },
      ],
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => registry,
    });
    const target = doc.createElement("div");
    target.setAttribute("data-ui-editor-id", "restarbeiten.filterbar");
    target.style.transform = "scale(1)";
    target.style.width = "120px";
    target.style.height = "30px";
    doc.body.appendChild(target);

    button.click();
    doc.dispatchEvent({ type: "click", target });
    getLatestPreviewAction(doc, "move-right").click();
    getLatestPreviewAction(doc, "width-plus").click();
    getLatestPreviewAction(doc, "hide").click();
    assert.equal(target.style.transform, "scale(1) translate(5px, 0px)");
    assert.equal(target.style.width, "125px");
    assert.equal(target.style.display, "none");

    getLatestPreviewAction(doc, "reset").click();
    assert.equal(target.style.transform, "scale(1)");
    assert.equal(target.style.width, "120px");
    assert.equal(target.style.height, "30px");
    assert.equal(target.style.display, "");
    assert.equal(target.getAttribute("data-ui-editor-preview"), "false");

    getLatestPreviewAction(doc, "move-right").click();
    getLatestPreviewAction(doc, "hide").click();
    assert.equal(target.style.transform, "scale(1) translate(5px, 0px)");
    assert.equal(target.style.display, "none");

    button.click();
    assert.equal(Boolean(getPreviewPanel(doc)), false);
    assert.equal(target.style.transform, "scale(1)");
    assert.equal(target.style.width, "120px");
    assert.equal(target.style.height, "30px");
    assert.equal(target.style.display, "");
    assert.equal(target.getAttribute("data-ui-editor-preview"), "false");
  });

  await run("BBM UI-Editor-Runtime: Preview-Panel ist am Header verschiebbar", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      innerWidth: 420,
      innerHeight: 320,
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "sample.screen",
      registryResolver: () => ({
        uiScope: "sample.screen",
        moduleId: "sample",
        elements: [{ id: "sample.target", name: "Ziel", type: "field", role: "content", parentId: null, allowedOps: ["inspect", "move"], lockedOps: [] }],
      }),
    });
    const target = doc.createElement("div");
    target.setAttribute("data-ui-editor-id", "sample.target");
    doc.body.appendChild(target);

    button.click();
    doc.dispatchEvent({ type: "click", target });

    const panel = getPreviewPanel(doc);
    const header = panel.querySelector('[data-ui-editor-preview-drag-handle="true"]');
    panel.offsetWidth = 180;
    panel.offsetHeight = 120;
    assert.equal(Boolean(header), true);
    assert.equal(header.style.cursor, "move");
    assert.equal(getRenderedText(header).includes("Preview"), true);
    assert.equal(getStatusText(doc.querySelector('[data-ui-editor-launcher-status="true"]')).includes("Auswahl: sample.target"), true);

    const downEvent = {
      type: "mousedown",
      target: header,
      clientX: 20,
      clientY: 20,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
    };
    header.dispatchEvent(downEvent);
    assert.equal(downEvent.defaultPrevented, true);
    assert.equal(downEvent.stopped, true);

    doc.dispatchEvent({
      type: "mousemove",
      target: header,
      clientX: 70,
      clientY: 40,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
    });
    assert.equal(panel.style.position, "fixed");
    assert.equal(panel.style.left, "50px");
    assert.equal(panel.style.top, "152px");
    assert.equal(panel.style.right, "");

    doc.dispatchEvent({ type: "mouseup", target: header });
    doc.dispatchEvent({ type: "mousemove", target: header, clientX: 140, clientY: 140 });
    assert.equal(panel.style.left, "50px");
    assert.equal(panel.style.top, "152px");

    doc.dispatchEvent({ type: "click", target: panel });
    assert.equal(getStatusText(doc.querySelector('[data-ui-editor-launcher-status="true"]')).includes("Auswahl: sample.target"), true);

    getLatestPreviewAction(doc, "move-right").click();
    assert.equal(target.style.transform, "translate(5px, 0px)");
    getLatestPreviewAction(doc, "panel-reset").click();
    assert.equal(panel.style.left, "");
    assert.equal(panel.style.right, "24px");
    assert.equal(panel.style.top, "132px");
    assert.equal(target.style.transform, "translate(5px, 0px)");
  });

  await run("BBM UI-Editor-Runtime: Panel-Drag-Baseline bleibt Launcher-lokal und ohne Persistenz", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      innerWidth: 360,
      innerHeight: 260,
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const registry = {
      uiScope: "sample.screen",
      moduleId: "sample",
      elements: [
        {
          id: "sample.target",
          name: "Ziel",
          type: "field",
          role: "content",
          parentId: "sample.root",
          allowedOps: ["inspect", "move", "hide", "show"],
          lockedOps: [],
          previewTargetMode: "self",
        },
      ],
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "sample.screen",
      registryResolver: () => registry,
    });
    const target = doc.createElement("div");
    target.setAttribute("data-ui-editor-id", "sample.target");
    doc.body.appendChild(target);

    button.click();
    assert.equal(Boolean(getPreviewPanel(doc)), true);
    doc.dispatchEvent({ type: "click", target });

    const panel = getPreviewPanel(doc);
    const header = panel.querySelector('[data-ui-editor-preview-drag-handle="true"]');
    const hiddenButton = doc.querySelector('[data-ui-editor-hidden-elements-button="true"]');
    assert.equal(Boolean(panel), true);
    assert.equal(Boolean(header), true);
    assert.equal(hiddenButton.textContent, "Ausgeblendete: 0");
    assert.equal(hiddenButton.disabled, true);
    panel.offsetWidth = 180;
    panel.offsetHeight = 120;

    header.dispatchEvent({
      type: "mousedown",
      target: header,
      clientX: 10,
      clientY: 10,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
    });
    doc.dispatchEvent({
      type: "mousemove",
      target: header,
      clientX: -200,
      clientY: -200,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
    });
    assert.equal(panel.style.position, "fixed");
    assert.equal(panel.style.left, "16px");
    assert.equal(panel.style.top, "16px");
    assert.equal(panel.style.right, "");

    doc.dispatchEvent({
      type: "mousemove",
      target: header,
      clientX: 900,
      clientY: 900,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
    });
    assert.equal(panel.style.left, "164px");
    assert.equal(panel.style.top, "124px");
    doc.dispatchEvent({ type: "mouseup", target: header });

    getLatestPreviewAction(doc, "hide").click();
    const enabledHiddenButton = doc.querySelector('[data-ui-editor-hidden-elements-button="true"]');
    assert.equal(enabledHiddenButton.textContent, "Ausgeblendete: 1");
    assert.equal(enabledHiddenButton.disabled, false);
    enabledHiddenButton.click();
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-hidden-elements-popover="true"]')), true);

    getLatestPreviewAction(doc, "panel-reset").click();
    assert.equal(panel.style.left, "");
    assert.equal(panel.style.right, "24px");
    assert.equal(panel.style.top, "132px");
    assert.equal(target.style.display, "none");

    button.click();
    assert.equal(Boolean(getPreviewPanel(doc)), false);
    assert.equal(doc.body.getAttribute("data-ui-editor-active"), "false");
    assert.equal(target.style.display, "");
    assert.equal(target.getAttribute("data-ui-editor-preview"), "false");
  });

  await run("BBM UI-Editor-Runtime: Panel-Positionsrechnung nutzt PanelRuntime-Helper-Paritaet", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = { innerWidth: 360, innerHeight: 260 };
    const panel = doc.createElement("div");
    panel._uiEditorPreviewWindow = win;
    panel.offsetWidth = 180;
    panel.offsetHeight = 120;

    assert.deepEqual(mod.calculatePreviewPanelDragPositionWithRuntime(panel, {
      startLeft: 20,
      startTop: 40,
      deltaX: 30,
      deltaY: 10,
    }), { left: 50, top: 50 });
    assert.deepEqual(mod.calculatePreviewPanelDragPositionWithRuntime(panel, {
      startLeft: 80,
      startTop: 70,
      deltaX: -30,
      deltaY: -20,
    }), { left: 50, top: 50 });
    assert.deepEqual(mod.calculatePreviewPanelDragPositionWithRuntime(panel, {
      startLeft: 20,
      startTop: 40,
      deltaX: -200,
      deltaY: -200,
    }), { left: 16, top: 16 });
    assert.deepEqual(mod.calculatePreviewPanelDragPositionWithRuntime(panel, {
      startLeft: 20,
      startTop: 40,
      deltaX: 900,
      deltaY: 900,
    }), { left: 164, top: 124 });
  });

  await run("BBM UI-Editor-Runtime: Erkennungspanel ist verschiebbar und ein-/ausblendbar", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      innerWidth: 320,
      innerHeight: 220,
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => ({ uiScope: "restarbeiten.screen", moduleId: "restarbeiten", elements: [] }),
    });

    button.click();
    const panel = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    const header = doc.querySelector('[data-ui-editor-status-header="true"]');
    const collapse = doc.querySelector('[data-ui-editor-status-collapse="true"]');
    const hide = doc.querySelector('[data-ui-editor-status-hide="true"]');
    const reopen = doc.querySelector('[data-ui-editor-status-reopen="true"]');
    panel.offsetWidth = 200;
    panel.offsetHeight = 100;

    header.dispatchEvent({
      type: "pointerdown",
      target: header,
      clientX: 20,
      clientY: 20,
      preventDefault() {
        this.defaultPrevented = true;
      },
    });
    doc.dispatchEvent({
      type: "pointermove",
      target: header,
      clientX: 900,
      clientY: 900,
      preventDefault() {
        this.defaultPrevented = true;
      },
    });
    doc.dispatchEvent({ type: "pointerup", target: header });

    assert.equal(panel.style.position, "fixed");
    assert.equal(panel.style.left, "112px");
    assert.equal(panel.style.top, "112px");

    collapse.click();
    assert.equal(panel.getAttribute("data-ui-editor-panel-collapsed"), "true");
    assert.equal(doc.querySelector('[data-ui-editor-status-content="true"]').style.display, "none");
    collapse.click();
    assert.equal(panel.getAttribute("data-ui-editor-panel-collapsed"), "false");

    hide.click();
    assert.equal(panel.getAttribute("data-ui-editor-panel-hidden"), "true");
    assert.equal(panel.style.display, "none");
    assert.equal(reopen.style.display, "");
    reopen.click();
    assert.equal(panel.getAttribute("data-ui-editor-panel-hidden"), "false");
    assert.equal(panel.style.display, "");
    assert.equal(reopen.style.display, "none");
  });

  await run("BBM UI-Editor-Runtime: unbekannte oder fehlende data-ui-editor-id wird ignoriert", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => ({
        uiScope: "restarbeiten.screen",
        moduleId: "restarbeiten",
        elements: [{ id: "restarbeiten.filterbar", name: "Filterleiste", type: "toolbar", role: "layout", parentId: "restarbeiten.root", allowedOps: ["inspect"], lockedOps: [] }],
      }),
    });
    const unknown = doc.createElement("div");
    unknown.setAttribute("data-ui-editor-id", "restarbeiten.unknown");
    const withoutId = doc.createElement("div");
    doc.body.append(unknown, withoutId);

    button.click();
    doc.dispatchEvent({ type: "click", target: unknown });
    doc.dispatchEvent({ type: "click", target: withoutId });

    assert.equal(unknown.getAttribute("data-ui-editor-selected"), null);
    assert.equal(withoutId.getAttribute("data-ui-editor-selected"), null);
    const activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: keine"), true);
    assert.equal(getStatusText(activeStatus).includes("restarbeiten.unknown"), false);
  });

  await run("BBM UI-Editor-Runtime: Klickauswahl bleibt auf aktuellen TOPS-Scope begrenzt", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "protokoll.topsScreen",
      registryResolver: () => ({
        uiScope: "protokoll.topsScreen",
        moduleId: "protokoll",
        elements: [{ id: "protokoll.root", name: "Protokoll", type: "root", role: "layout", parentId: null, allowedOps: ["inspect"], lockedOps: [] }],
      }),
    });
    const protokollTarget = doc.createElement("section");
    protokollTarget.setAttribute("data-ui-editor-id", "protokoll.root");
    const restarbeitenTarget = doc.createElement("section");
    restarbeitenTarget.setAttribute("data-ui-editor-id", "restarbeiten.filterbar");
    doc.body.append(protokollTarget, restarbeitenTarget);

    button.click();
    doc.dispatchEvent({ type: "click", target: restarbeitenTarget });
    assert.equal(restarbeitenTarget.getAttribute("data-ui-editor-selected"), null);

    doc.dispatchEvent({ type: "click", target: protokollTarget });
    assert.equal(protokollTarget.getAttribute("data-ui-editor-selected"), "true");
    const activeStatus = doc.querySelector('[data-ui-editor-launcher-status="true"]');
    assert.equal(getStatusText(activeStatus).includes("Auswahl: protokoll.root"), true);
    assert.equal(getStatusText(activeStatus).includes("Name: Protokoll"), true);
    assert.equal(Boolean(getPreviewPanel(doc)), true);
    assert.equal(getLatestPreviewAction(doc, "move-right").disabled, true);
  });

  await run("BBM UI-Editor-Runtime: bleibt ohne Scan, Speicherung und Ziel-App-Aktion", async () => {
    const source = fs.readFileSync(RUNTIME_PATH, "utf8");
    const coreShellSource = fs.readFileSync(CORE_SHELL_PATH, "utf8");
    assert.equal(source.includes("scanUiInspectorTargets"), false);
    assert.equal(source.includes("querySelectorAll"), false);
    assert.equal(source.includes("DOMParser"), false);
    assert.equal(source.includes("innerHTML"), false);
    assert.equal(source.includes("scan"), false);
    assert.equal(source.includes("detect"), false);
    assert.equal(source.includes("autoRegister"), false);
    assert.equal(source.includes("migration"), false);
    assert.equal(source.includes("MutationObserver"), false);
    assert.equal(source.includes("querySelectorAll"), false);
    assert.equal(source.includes("localStorage"), false);
    assert.equal(source.includes("sessionStorage"), false);
    assert.equal(source.includes("ipcRenderer"), false);
    assert.equal(source.includes("writeFile"), false);
    assert.equal(source.includes("showEditorLabV2"), false);
    assert.equal(source.includes("showRestarbeitenV2"), false);
    assert.equal(source.includes("RESTARBEITEN_PREVIEW_SCOPE"), false);
    assert.equal(source.includes("restarbeiten.editbox"), false);
    assert.equal(coreShellSource.includes("showBbmUiEditorDemo"), false);
    assert.equal(coreShellSource.includes("getAvailableUiScopes"), true);
    assert.equal(coreShellSource.includes("registryResolver"), true);
    assert.equal(coreShellSource.includes("resolveActiveHostUiScope"), true);
    assert.equal(coreShellSource.includes('restarbeiten: "restarbeiten.screen"'), true);
    assert.equal(coreShellSource.includes("if (sectionScope) return sectionScope;"), true);
    assert.equal(coreShellSource.includes('return "protokoll.topsScreen"'), true);
    assert.equal(coreShellSource.includes("return getActiveUiScope();"), true);
    assert.equal(
      coreShellSource.indexOf("if (sectionScope) return sectionScope;") <
        coreShellSource.indexOf('return "protokoll.topsScreen"'),
      true
    );
    assert.equal(coreShellSource.includes("activeScopeId: activeUiScope"), true);
    assert.equal(source.includes("getStatusScopeLabel"), true);
    assert.equal(source.includes("activeUiScope"), true);
    assert.equal(source.includes('from "./surfaceAdapters/surfaceSwitchCommand.js"'), true);
    assert.equal(source.includes("handleReadonlySurfaceSwitchRequestForLauncher"), true);
    assert.equal(source.includes('from "./surfaceAdapters/surfaceSwitchModel.js"'), false);
  });

  await run("BBM UI-Editor-Runtime: Launcher-Command-Referenzdokument bleibt vorhanden", async () => {
    assert.equal(fs.existsSync(SWITCH_COMMAND_LAUNCHER_DOC_PATH), true, "Launcher-Command-Referenzdokument fehlt.");
    const docSource = fs.readFileSync(SWITCH_COMMAND_LAUNCHER_DOC_PATH, "utf8");

    for (const required of [
      "Editorpanel im BBM-Launcher",
      "handleReadonlySurfaceSwitchRequestForLauncher(...)",
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "read-only",
      "changed",
      "false",
      "keine echte Umschaltung",
      "Surface-Auswahl",
      "SurfaceInfo",
      "Surface-Auswahl",
      "SurfaceInfo",
      "Surface-Auswahl",
      "SurfaceInfo",
      "kein Drag",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `Launcher-Command-Referenzdokument enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: Gesamt-Referenzdokument bleibt vorhanden", async () => {
    assert.equal(fs.existsSync(SURFACE_GESAMT_DOC_PATH), true, "Gesamt-Referenzdokument fehlt.");
    const docSource = fs.readFileSync(SURFACE_GESAMT_DOC_PATH, "utf8");

    for (const required of [
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "SurfaceSwitchCommand",
      "SurfaceSelectionState",
      "SurfacePolicy",
      "read-only",
      "keine echte Surface-Umschaltung",
      "kein Drag",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `Gesamt-Referenzdokument enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: Integrationsdokument bleibt vorhanden", async () => {
    assert.equal(fs.existsSync(SURFACE_INTEGRATION_DOC_PATH), true, "Integrationsdokument fehlt.");
    const docSource = fs.readFileSync(SURFACE_INTEGRATION_DOC_PATH, "utf8");

    for (const required of [
      "SurfaceRuntime-Bridge",
      "SurfaceAdapterCatalog",
      "SurfacePolicy",
      "SurfaceSelectionModel",
      "SurfaceSelectionState",
      "SurfaceSwitchModel",
      "SurfaceSwitchCommand",
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "read-only",
      "keine echte Surface-Umschaltung",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `Integrationsdokument enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: Freigabematrix bleibt vorhanden", async () => {
    assert.equal(fs.existsSync(SURFACE_NEXT_PHASE_MATRIX_DOC_PATH), true, "Freigabematrix fehlt.");
    const docSource = fs.readFileSync(SURFACE_NEXT_PHASE_MATRIX_DOC_PATH, "utf8");

    for (const required of [
      "Freigabematrix",
      "read-only",
      "keine echte Surface-Umschaltung",
      "kein Drag",
      "keine Persistenz",
      "PDF",
      "Plan",
      "UI-Editor-kit speichert nicht",
      "G75",
    ]) {
      assert.equal(docSource.includes(required), true, `Freigabematrix enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: PDF-Plan-Bewertung bleibt vorhanden", async () => {
    assert.equal(fs.existsSync(PDF_PLAN_BERATUNG_DOC_PATH), true, "PDF-Plan-Bewertungsdokument fehlt.");
    const docSource = fs.readFileSync(PDF_PLAN_BERATUNG_DOC_PATH, "utf8");

    for (const required of [
      "pdf.plan.page.1",
      "plan.canvas.default",
      "restarbeiten.ui.main",
      "read-only",
      "freigegeben",
      "read-only sichtbar",
      "Surface-Auswahl",
      "kein Drag",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `PDF-Plan-Bewertungsdokument enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: Surface-Policy-Freigabevorlage bleibt vorhanden", async () => {
    assert.equal(fs.existsSync(SURFACE_POLICY_FREIGABE_DOC_PATH), true, "Surface-Policy-Freigabevorlage fehlt.");
    const docSource = fs.readFileSync(SURFACE_POLICY_FREIGABE_DOC_PATH, "utf8");

    for (const required of [
      "SurfacePolicy",
      "read-only",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "keine Wildcard",
      "kein Default-true",
      "Surface-Auswahl",
      "SurfaceInfo",
      "UI-Editor-kit speichert nicht",
      "Electron-Sichtpruefung",
    ]) {
      assert.equal(docSource.includes(required), true, `Surface-Policy-Freigabevorlage enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: Surface-Freigabe-Kandidat bleibt vorhanden und ist read-only freigegeben", async () => {
    assert.equal(fs.existsSync(SURFACE_FREIGABE_KANDIDAT_DOC_PATH), true, "Surface-Freigabe-Kandidat fehlt.");
    const docSource = fs.readFileSync(SURFACE_FREIGABE_KANDIDAT_DOC_PATH, "utf8");

    for (const required of [
      "pdf.plan.page.1",
      "plan.canvas.default",
      "restarbeiten.ui.main",
      "read-only",
      "freigegeben",
      "ausw",
      "SurfaceInfo",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "keine Wildcard",
      "kein Default-true",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `Surface-Freigabe-Kandidat enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: Plan-Canvas-Policy-Referenzdokument bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(PLAN_CANVAS_POLICY_REFERENCE_DOC_PATH),
      true,
      "Plan-Canvas-Policy-Referenzdokument fehlt."
    );
    const docSource = fs.readFileSync(PLAN_CANVAS_POLICY_REFERENCE_DOC_PATH, "utf8");

    for (const required of [
      "plan.canvas.default",
      "readable: true",
      "visibleInEditor: true",
      "canDrag: false",
      "canResize: false",
      "canPersist: false",
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "SurfaceInfo bleibt bewusst darauf stehen",
      "Surface-Auswahl",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `Plan-Canvas-Policy-Referenzdokument enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: Plan-Canvas-Sichtpruefungsdokument bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(PLAN_CANVAS_SICHTPRUEFUNG_DOC_PATH),
      true,
      "Plan-Canvas-Sichtpruefungsdokument fehlt."
    );
    const docSource = fs.readFileSync(PLAN_CANVAS_SICHTPRUEFUNG_DOC_PATH, "utf8");

    for (const required of [
      "Plan Canvas",
      "PDF Plan Seite 1",
      "plan.canvas.default",
      "pdf.plan.page.1",
      "restarbeiten.ui.main",
      "read-only sichtbar",
      "Surface-Auswahl",
      "SurfaceInfo",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `Plan-Canvas-Sichtpruefungsdokument enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: Surface-Phase-Abnahmereferenz bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(SURFACE_PHASE_ABNAHME_REFERENZ_DOC_PATH),
      true,
      "Surface-Phase-Abnahmereferenz fehlt."
    );
    const docSource = fs.readFileSync(SURFACE_PHASE_ABNAHME_REFERENZ_DOC_PATH, "utf8");

    for (const required of [
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "PDF Plan Seite 1",
      "Plan Canvas",
      "Start -> Projekte",
      "Nr.: 04-2026 / UI-Polish fuer BBM",
      "keine echte Surface-Umschaltung",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "SurfaceInfo",
      "Sichtpruefungsstand",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `Surface-Phase-Abnahmereferenz enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: Surface-Switching-Konzept bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(SURFACE_SWITCHING_KONZEPT_DOC_PATH),
      true,
      "Surface-Switching-Konzept fehlt."
    );
    const docSource = fs.readFileSync(SURFACE_SWITCHING_KONZEPT_DOC_PATH, "utf8");

    for (const required of [
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "keine echte Surface-Umschaltung",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "keine Wildcard",
      "kein Default-true",
      "UI-Editor-kit speichert nicht",
      "SurfaceInfo",
      "Stop-/Go-Kriterien",
      "Empfohlener naechster Schritt",
    ]) {
      assert.equal(docSource.includes(required), true, `Surface-Switching-Konzept enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: Surface-Auswahl-Kontext bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(SURFACE_AUSWAHL_KONTEXT_DOC_PATH),
      true,
      "Surface-Auswahl-Kontext-Dokument fehlt."
    );
    const docSource = fs.readFileSync(SURFACE_AUSWAHL_KONTEXT_DOC_PATH, "utf8");

    for (const required of [
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "Surface-Auswahl",
      "keine aktive Surface-Umschaltung",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `Surface-Auswahl-Kontext-Dokument enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: Surface-Auswahl-Kontext-Referenz bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(SURFACE_AUSWAHL_KONTEXT_REFERENZ_DOC_PATH),
      true,
      "Surface-Auswahl-Kontext-Referenzdokument fehlt."
    );
    const docSource = fs.readFileSync(SURFACE_AUSWAHL_KONTEXT_REFERENZ_DOC_PATH, "utf8");

    for (const required of [
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "Surface-Auswahl",
      "read-only Sichtbarkeits-/Kontextanzeige",
      "keine aktive Surface-Umschaltung",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(
        docSource.includes(required),
        true,
        `Surface-Auswahl-Kontext-Referenzdokument enthaelt ${required} nicht.`
      );
    }
  });

  await run("BBM UI-Editor-Runtime: Surface-Auswahl read-only Hinweis-Referenz bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(SURFACE_AUSWAHL_READONLY_HINT_REFERENZ_DOC_PATH),
      true,
      "Surface-Auswahl read-only Hinweis-Referenzdokument fehlt."
    );
    const docSource = fs.readFileSync(SURFACE_AUSWAHL_READONLY_HINT_REFERENZ_DOC_PATH, "utf8");

    for (const required of [
      "Surface-Auswahl zeigt nur read-only Kontext. Keine aktive Umschaltung.",
      "restarbeiten.ui.main",
      "SurfaceInfo bleibt `restarbeiten.ui.main`",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "Electron-Sichtpruefung",
    ]) {
      assert.equal(
        docSource.includes(required),
        true,
        `Surface-Auswahl read-only Hinweis-Referenzdokument enthaelt ${required} nicht.`
      );
    }
  });

  await run("BBM UI-Editor-Runtime: Surface-Auswahl bleibt keine aktive Surface-Umschaltung", async () => {
    assert.equal(
      fs.existsSync(SURFACE_AUSWAHL_NO_ACTIVE_SWITCH_GUARDRAILS_DOC_PATH),
      true,
      "Surface-Auswahl-Guardrail-Dokument fehlt."
    );
    const docSource = fs.readFileSync(SURFACE_AUSWAHL_NO_ACTIVE_SWITCH_GUARDRAILS_DOC_PATH, "utf8");

    for (const required of [
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "SurfaceInfo bleibt bewusst `restarbeiten.ui.main`",
      "keine aktive Surface-Umschaltung",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "keine Schreibwege",
      "keine Wildcard",
      "kein Default-true",
      "leere IDs",
    ]) {
      assert.equal(docSource.includes(required), true, `Surface-Auswahl-Guardrail-Dokument enthaelt ${required} nicht.`);
    }

    const runtimeSource = fs.readFileSync(RUNTIME_PATH, "utf8");
    assert.equal(
      runtimeSource.includes('const READONLY_SURFACE_INFO_SURFACE_ID = "restarbeiten.ui.main";'),
      true
    );
    for (const forbidden of [
      "activeSurfaceId",
      "setActiveSurface",
      "activateSurface",
      "selectSurface",
      "localStorage",
      "writeFile",
      "default: true",
      "wildcard",
    ]) {
      assert.equal(runtimeSource.includes(forbidden), false, `Runtime enthaelt gesperrtes Fragment: ${forbidden}`);
    }
  });

  await run("BBM UI-Editor-Runtime: G90-Stopp wegen fehlender UI-Editor-Grundlagen bleibt dokumentiert", async () => {
    assert.equal(
      fs.existsSync(UI_EDITOR_MISSING_FOUNDATIONS_STOP_DOC_PATH),
      true,
      "UI-Editor-Grundlagen-Stopp-Dokument fehlt."
    );
    const docSource = fs.readFileSync(UI_EDITOR_MISSING_FOUNDATIONS_STOP_DOC_PATH, "utf8");

    for (const required of [
      "G90 bleibt gestoppt. Ein sichtbarer UI-Hinweis zur Surface-Auswahl darf erst umgesetzt werden, wenn die laut Projektregeln verpflichtenden UI-Editor-Grundlagen vorhanden oder durch eine ausdrueckliche Entscheidung ersetzt/freigegeben sind.",
      "docs/EDITOR_BAUPLAN.md",
      "docs/UI_ELEMENT_KATALOG.md",
      "docs/UI_BAU_UND_PRUEFREGELN.md",
      "docs/ZIEL_APP_ANBINDUNG.md",
      "docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md",
      "Surface-Auswahl-Hinweis im UI",
      "sichtbare UI-Aenderungen am UI-Editor-Panel",
      "DB-/IPC-Schreibwege",
      "Stop-/Entscheidungsdokumentation",
    ]) {
      assert.equal(
        docSource.includes(required),
        true,
        `UI-Editor-Grundlagen-Stopp-Dokument enthaelt ${required} nicht.`
      );
    }
  });

  await run("BBM UI-Editor-Runtime: G91-Freigabeentscheidung fuer fehlende Grundlagen bleibt dokumentiert", async () => {
    assert.equal(
      fs.existsSync(UI_EDITOR_FOUNDATIONS_RELEASE_DECISION_DOC_PATH),
      true,
      "UI-Editor-Grundlagen-Freigabeentscheidung fehlt."
    );
    const docSource = fs.readFileSync(UI_EDITOR_FOUNDATIONS_RELEASE_DECISION_DOC_PATH, "utf8");

    for (const required of [
      "Option A: Pflichtunterlagen vollstaendig und regulaer erstellen",
      "Option B: Ausdrueckliche Ersatzfreigabe nur fuer den kleinen read-only Hinweis",
      "Option C: G90 dauerhaft verwerfen",
      "Option D: Stopp beibehalten und zunaechst Grundlagen-Bedarfsanalyse erstellen",
      "docs/EDITOR_BAUPLAN.md",
      "docs/UI_ELEMENT_KATALOG.md",
      "docs/UI_BAU_UND_PRUEFREGELN.md",
      "docs/ZIEL_APP_ANBINDUNG.md",
      "docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md",
      "Keine Ersatzfreigabe pauschal erteilen.",
      "Surface-Auswahl zeigt nur read-only Kontext. Keine aktive Umschaltung.",
      "G90 bleibt bis zur Nutzerentscheidung blockiert",
    ]) {
      assert.equal(
        docSource.includes(required),
        true,
        `UI-Editor-Grundlagen-Freigabeentscheidung enthaelt ${required} nicht.`
      );
    }
  });

  await run("BBM UI-Editor-Runtime: Grundlagen Surface-Hinweis Abschlusscheck bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(UI_EDITOR_FOUNDATIONS_SURFACE_HINT_CHECK_DOC_PATH),
      true,
      "Grundlagen Surface-Hinweis Abschlusscheck fehlt."
    );
    const docSource = fs.readFileSync(UI_EDITOR_FOUNDATIONS_SURFACE_HINT_CHECK_DOC_PATH, "utf8");

    for (const required of [
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "Surface-Auswahl zeigt nur read-only Kontext. Keine aktive Umschaltung.",
      "keine aktive Surface-Umschaltung",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
    ]) {
      assert.equal(
        docSource.includes(required),
        true,
        `Grundlagen Surface-Hinweis Abschlusscheck enthaelt ${required} nicht.`
      );
    }
  });

  await run("BBM UI-Editor-Runtime: Panel-Bedienzustand-Statuszeilen-Referenz bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(UI_EDITOR_PANEL_STATUS_LINE_REFERENCE_DOC_PATH),
      true,
      "Panel-Bedienzustand-Statuszeilen-Referenz fehlt."
    );
    const docSource = fs.readFileSync(UI_EDITOR_PANEL_STATUS_LINE_REFERENCE_DOC_PATH, "utf8");

    for (const required of [
      "Bearbeitung: Restarbeiten | Zusatzkontexte: PDF/Plan read-only | Speichern: nicht aktiv",
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "Electron-Sichtpruefung",
    ]) {
      assert.equal(
        docSource.includes(required),
        true,
        `Panel-Bedienzustand-Statuszeilen-Referenz enthaelt ${required} nicht.`
      );
    }
  });

  await run("BBM UI-Editor-Runtime: Hinweis-/Infotext-Entwurfs-Vorschau bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(UI_EDITOR_HINT_INFOTEXT_DRAFT_PREVIEW_REFERENCE_DOC_PATH),
      true,
      "Hinweis-/Infotext-Entwurfs-Vorschau-Referenz fehlt."
    );
    const docSource = fs.readFileSync(UI_EDITOR_HINT_INFOTEXT_DRAFT_PREVIEW_REFERENCE_DOC_PATH, "utf8");

    for (const required of [
      "Entwurfs-Vorschau",
      "Elementart: Hinweis / Infotext",
      "Status: Vorschau, nicht gespeichert",
      "Zielkontext: Restarbeiten",
      "Keine Speicherung",
      "SurfaceInfo-Verhalten",
      "restarbeiten.ui.main",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
    ]) {
      assert.equal(
        docSource.includes(required),
        true,
        `Hinweis-/Infotext-Entwurfs-Vorschau enthaelt ${required} nicht.`
      );
    }
  });

  await run("BBM UI-Editor-Runtime: G92-Bedarfsanalyse fuer fehlende Grundlagen bleibt dokumentiert", async () => {
    assert.equal(
      fs.existsSync(UI_EDITOR_FOUNDATIONS_NEEDS_ANALYSIS_DOC_PATH),
      true,
      "UI-Editor-Grundlagen-Bedarfsanalyse fehlt."
    );
    const docSource = fs.readFileSync(UI_EDITOR_FOUNDATIONS_NEEDS_ANALYSIS_DOC_PATH, "utf8");

    for (const required of [
      "Diese Bedarfsanalyse ersetzt keine der fehlenden Pflichtunterlagen. Sie legt keine Pflichtgrundlage an und erteilt keine Freigabe fuer G90 oder spaetere UI-/PDF-Umsetzungen.",
      "docs/EDITOR_BAUPLAN.md",
      "docs/UI_ELEMENT_KATALOG.md",
      "docs/UI_BAU_UND_PRUEFREGELN.md",
      "docs/ZIEL_APP_ANBINDUNG.md",
      "docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md",
      "Abgrenzung: keine Ersatzfreigabe",
      "Nachtrag Grundlagen 2/3",
      "G90 bleibt",
      "blockiert.",
    ]) {
      assert.equal(
        docSource.includes(required),
        true,
        `UI-Editor-Grundlagen-Bedarfsanalyse enthaelt ${required} nicht.`
      );
    }
  });

  await run("BBM UI-Editor-Runtime: Grundlagen 1/3 bleiben minimal vorhanden", async () => {
    assert.equal(fs.existsSync(UI_EDITOR_BAUPLAN_DOC_PATH), true, "EDITOR_BAUPLAN.md fehlt.");
    assert.equal(
      fs.existsSync(UI_EDITOR_TARGET_APP_BINDING_DOC_PATH),
      true,
      "ZIEL_APP_ANBINDUNG.md fehlt."
    );
    const bauplanSource = fs.readFileSync(UI_EDITOR_BAUPLAN_DOC_PATH, "utf8");
    const targetAppSource = fs.readFileSync(UI_EDITOR_TARGET_APP_BINDING_DOC_PATH, "utf8");

    for (const required of ["restarbeiten.ui.main", "keine Persistenz", "kein Drag", "kein Resize"]) {
      assert.equal(bauplanSource.includes(required), true, `EDITOR_BAUPLAN.md enthaelt ${required} nicht.`);
      assert.equal(targetAppSource.includes(required), true, `ZIEL_APP_ANBINDUNG.md enthaelt ${required} nicht.`);
    }

    assert.equal(
      targetAppSource.includes("UI-Editor-kit speichert nicht"),
      true,
      "ZIEL_APP_ANBINDUNG.md muss festhalten, dass UI-Editor-kit nicht speichert."
    );
  });

  await run("BBM UI-Editor-Runtime: Grundlagen 2/3 bleiben minimal vorhanden", async () => {
    assert.equal(fs.existsSync(UI_EDITOR_ELEMENT_CATALOG_DOC_PATH), true, "UI_ELEMENT_KATALOG.md fehlt.");
    assert.equal(fs.existsSync(UI_EDITOR_BUILD_RULES_DOC_PATH), true, "UI_BAU_UND_PRUEFREGELN.md fehlt.");

    const elementCatalogSource = fs.readFileSync(UI_EDITOR_ELEMENT_CATALOG_DOC_PATH, "utf8");
    const buildRulesSource = fs.readFileSync(UI_EDITOR_BUILD_RULES_DOC_PATH, "utf8");

    for (const required of [
      "restarbeiten.ui.main",
      "keine Wildcard",
      "kein Default-true",
      "keine Persistenz",
      "kein Drag",
      "kein Resize",
    ]) {
      assert.equal(
        elementCatalogSource.includes(required),
        true,
        `UI_ELEMENT_KATALOG.md enthaelt ${required} nicht.`
      );
      assert.equal(
        buildRulesSource.includes(required),
        true,
        `UI_BAU_UND_PRUEFREGELN.md enthaelt ${required} nicht.`
      );
    }

    assert.equal(buildRulesSource.includes("Electron-Sichtpruefung"), true, "Sichtpruefung fehlt.");
    assert.equal(buildRulesSource.includes("npm start"), true, "Sichtpruefungsregel fehlt.");
  });

  await run("BBM UI-Editor-Runtime: Grundlagen 3/3 bleiben minimal vorhanden", async () => {
    assert.equal(
      fs.existsSync(UI_EDITOR_PDF_DESIGN_DECISION_DOC_PATH),
      true,
      "UI_PDF_ENTWURFSENTSCHEIDUNG.md fehlt."
    );

    const pdfDesignDecisionSource = fs.readFileSync(UI_EDITOR_PDF_DESIGN_DECISION_DOC_PATH, "utf8");

    for (const required of [
      "pdf.plan.page.1",
      "plan.canvas.default",
      "pdf-points",
      "canvas-pixels",
      "keine PDF-Bearbeitung",
      "keine Plan-/Canvas-Interaktion",
      "keine Persistenz",
      "kein Drag",
      "kein Resize",
      "restarbeiten.ui.main",
      "Host-/Bestandssurface",
    ]) {
      assert.equal(
        pdfDesignDecisionSource.includes(required),
        true,
        `UI_PDF_ENTWURFSENTSCHEIDUNG.md enthaelt ${required} nicht.`
      );
    }
  });

  await run("BBM UI-Editor-Runtime: PDF-Plan-Sichtpruefungsdokument bleibt vorhanden", async () => {
    assert.equal(fs.existsSync(PDF_PAGE_SICHTPRUEFUNG_DOC_PATH), true, "PDF-Plan-Sichtpruefungsdokument fehlt.");
    const docSource = fs.readFileSync(PDF_PAGE_SICHTPRUEFUNG_DOC_PATH, "utf8");

    for (const required of [
      "Restarbeiten - PDF Plan Seite 1",
      "SurfaceInfo zeigt weiterhin den Hoststand `restarbeiten.ui.main`",
      "PDF Plan Seite 1 und Plan Canvas sind nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.",
      "plan.canvas.default",
      "unbekannte SurfaceIds",
      "keine Bearbeitung",
      "kein Drag",
      "kein Resize",
      "keine Speicher-/Persistenzfunktion sichtbar",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `PDF-Plan-Sichtpruefungsdokument enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: PDF-Plan-Hinweis-Referenzdokument bleibt vorhanden", async () => {
    assert.equal(fs.existsSync(PDF_PAGE_HINT_REFERENCE_DOC_PATH), true, "PDF-Plan-Hinweis-Referenzdokument fehlt.");
    const docSource = fs.readFileSync(PDF_PAGE_HINT_REFERENCE_DOC_PATH, "utf8");

    for (const required of [
      "PDF Plan Seite 1 und Plan Canvas sind nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.",
      "SurfaceInfo zeigt weiterhin `restarbeiten.ui.main`",
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "kein Resize",
      "keine Persistenz",
      "Electron-Sichtpruefung",
    ]) {
      assert.equal(docSource.includes(required), true, `PDF-Plan-Hinweis-Referenzdokument enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: PDF-Plan-manuelle-Sichtpruefung bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(PDF_PAGE_MANUAL_SICHTPRUEFUNG_DOC_PATH),
      true,
      "PDF-Plan-manuelle-Sichtpruefung fehlt."
    );
    const docSource = fs.readFileSync(PDF_PAGE_MANUAL_SICHTPRUEFUNG_DOC_PATH, "utf8");

    for (const required of [
      "Restarbeiten - PDF Plan Seite 1",
      "restarbeiten.ui.main",
      "PDF Plan Seite 1 ist nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.",
      "plan.canvas.default",
      "kein Drag",
      "keine Persistenz",
      "Manuelle Sichtpruefung nicht vollstaendig bestanden / nicht vollstaendig erreichbar",
    ]) {
      assert.equal(docSource.includes(required), true, `PDF-Plan-manuelle-Sichtpruefung enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: Restarbeiten-Zielrouten-Dokument bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(RESTARBEITEN_ZIELROUTE_DOC_PATH),
      true,
      "Restarbeiten-Zielrouten-Dokument fehlt."
    );
    const docSource = fs.readFileSync(RESTARBEITEN_ZIELROUTE_DOC_PATH, "utf8");

    for (const required of [
      "Restarbeiten - PDF Plan Seite 1",
      "restarbeiten.ui.main",
      "PDF Plan Seite 1 ist nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.",
      "kein Drag",
      "keine Persistenz",
      "plan.canvas.default",
      "Manuelle Sichtpruefung bestanden",
    ]) {
      assert.equal(docSource.includes(required), true, `Restarbeiten-Zielrouten-Dokument enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: PDF-Plan-Abnahmereferenz bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(PDF_PAGE_ABNAHME_REFERENZ_DOC_PATH),
      true,
      "PDF-Plan-Abnahmereferenz fehlt."
    );
    const docSource = fs.readFileSync(PDF_PAGE_ABNAHME_REFERENZ_DOC_PATH, "utf8");

    for (const required of [
      "pdf.plan.page.1",
      "restarbeiten.ui.main",
      "Restarbeiten - PDF Plan Seite 1",
      "PDF Plan Seite 1 und Plan Canvas sind nur read-only sichtbar",
      "Start -> Projekte",
      "Nr.: 04-2026 / UI-Polish fuer BBM",
      "plan.canvas.default",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `PDF-Plan-Abnahmereferenz enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: Plan-Canvas-Kandidat bleibt vorhanden", async () => {
    assert.equal(
      fs.existsSync(PLAN_CANVAS_CANDIDATE_DOC_PATH),
      true,
      "Plan-Canvas-Kandidat fehlt."
    );
    const docSource = fs.readFileSync(PLAN_CANVAS_CANDIDATE_DOC_PATH, "utf8");

    for (const required of [
      "plan.canvas.default",
      "pdf.plan.page.1",
      "restarbeiten.ui.main",
      "read-only",
      "auswählbar",
      "read-only Auswahlstand",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "keine Wildcard",
      "kein Default-true",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `Plan-Canvas-Kandidat enthaelt ${required} nicht.`);
    }
  });

  await run("BBM UI-Editor-Runtime: SurfaceInfo-Entscheidungsdokument bleibt vorhanden", async () => {
    assert.equal(fs.existsSync(SURFACE_INFO_ENTSCHEIDUNG_DOC_PATH), true, "SurfaceInfo-Entscheidungsdokument fehlt.");
    const docSource = fs.readFileSync(SURFACE_INFO_ENTSCHEIDUNG_DOC_PATH, "utf8");

    for (const required of [
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "SurfaceInfo",
      "Restarbeiten - PDF Plan Seite 1",
      "Read-only Hinweis",
      "keine echte Surface-Umschaltung",
      "kein Drag",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `SurfaceInfo-Entscheidungsdokument enthaelt ${required} nicht.`);
    }
  });

}

if (require.main === module) {
  const run = async (name, fn) => {
    try {
      const out = fn();
      if (out && typeof out.then === "function") await out;
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
      process.exitCode = 1;
    }
  };

  runBbmUiEditorRuntimeLauncherTests(run).then(() => {
    if (!process.exitCode) console.log("bbmUiEditorRuntimeLauncher.test.cjs passed");
  });
}

module.exports = { runBbmUiEditorRuntimeLauncherTests };
