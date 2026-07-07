const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const RUNTIME_PATH = path.join(__dirname, "../../src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
const CORE_SHELL_PATH = path.join(__dirname, "../../src/renderer/app/CoreShell.js");
const CSS_PATH = path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.css");
const PACKAGE_PATH = path.join(__dirname, "../../package.json");

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
  if (raw === "[data-ui-editor-layout-controls=\"true\"]") {
    return node.getAttribute("data-ui-editor-layout-controls") === "true";
  }
  if (raw === "[data-ui-editor-layout-selected=\"true\"]") {
    return node.getAttribute("data-ui-editor-layout-selected") === "true";
  }
  if (raw === "[data-ui-editor-layout-message=\"true\"]") {
    return node.getAttribute("data-ui-editor-layout-message") === "true";
  }
  if (raw === "[data-ui-editor-layout-operation=\"true\"]") {
    return node.getAttribute("data-ui-editor-layout-operation") === "true";
  }
  if (raw === "[data-ui-editor-layout-state=\"true\"]") {
    return node.getAttribute("data-ui-editor-layout-state") === "true";
  }
  if (raw === "[data-ui-editor-id]") {
    return Boolean(node.getAttribute("data-ui-editor-id"));
  }
  const layoutActionMatch = raw.match(/^\[data-ui-editor-layout-action="([^"]+)"\]$/);
  if (layoutActionMatch) {
    return node.getAttribute("data-ui-editor-layout-action") === layoutActionMatch[1];
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
    assert.equal(cssSource.includes("ui-editor-layout-control"), true);
    assert.equal(cssSource.includes('data-ui-editor-panel-collapsed="true"'), true);
    assert.equal(cssSource.includes('data-ui-editor-panel-hidden="true"'), true);
    assert.equal(cssSource.includes("white-space: pre-line"), true);
    assert.equal(cssSource.includes("max-inline-size: 360px"), true);
    assert.equal(cssSource.includes('[data-ui-editor-launcher-active="true"]'), true);
    assert.equal(getCssNumber(cssSource, "z-index") > 12010, true);
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

  await run("BBM UI-Editor-Runtime: sichtbare Layoutbedienung zeigt Auswahl und Save/Load/Reset", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const calls = [];
    const layoutInspector = {
      getLayoutControlPanel(scopeId, elementId) {
        calls.push(["panel", scopeId, elementId]);
        return {
          ok: true,
          elementId,
          selectedElement: { id: elementId, name: "Kurztext" },
          currentLayoutEntry: null,
          controls: [
            {
              id: "editor.layout.applySave",
              enabled: true,
              allowedOps: ["move", "resize"],
            },
            { id: "editor.layout.loadSaved", enabled: true, allowedOps: [] },
            { id: "editor.layout.resetDefault", enabled: true, allowedOps: [] },
          ],
          status: { kind: "ready", message: "Standardzustand ist aktiv.", reason: null },
        };
      },
      applyLayoutChange(scopeId, request) {
        calls.push(["apply", scopeId, request]);
        return {
          ok: true,
          status: { kind: "success", message: "Aenderung wurde angewendet und gespeichert.", reason: null },
          layoutEntry: { elementId: request.elementId, operation: request.operation, layoutValue: request.payload },
        };
      },
      loadLayoutState(scopeId, request) {
        calls.push(["load", scopeId, request]);
        return {
          ok: true,
          status: { kind: "success", message: "Gespeicherter Layoutzustand wurde geladen.", reason: null },
          currentLayoutEntry: { elementId: request.elementId, operation: "move", layoutValue: { x: 0, y: 0 } },
        };
      },
      resetLayoutState(scopeId, request) {
        calls.push(["reset", scopeId, request]);
        return {
          ok: true,
          status: { kind: "success", message: "Standardzustand wurde wiederhergestellt.", reason: null },
          layoutState: [],
        };
      },
    };
    const registry = {
      uiScope: "restarbeiten.screen",
      moduleId: "restarbeiten",
      elements: [
        { id: "restarbeiten.editbox.text.short", name: "Kurztext", type: "field", role: "content", parentId: "restarbeiten.editbox", allowedOps: ["inspect", "move"], lockedOps: [] },
      ],
    };
    const button = await mod.installBbmUiEditorRuntimeLauncher({
      devEnabled: true,
      doc,
      win,
      activeUiScope: "restarbeiten.screen",
      registryResolver: () => registry,
      layoutInspector,
      layoutScopeResolver: (uiScope) => uiScope === "restarbeiten.screen" ? "restarbeiten.ui.main" : null,
    });
    const target = doc.createElement("input");
    target.setAttribute("data-ui-editor-id", "restarbeiten.editbox.text.short");
    doc.body.appendChild(target);

    button.click();
    doc.dispatchEvent({ type: "click", target });

    let panel = doc.querySelector('[data-ui-editor-layout-controls="true"]');
    assert.equal(Boolean(panel), true);
    assert.equal(doc.querySelector('[data-ui-editor-layout-selected="true"]').textContent.includes("restarbeiten.editbox.text.short"), true);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-layout-action="applySave"]')), true);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-layout-action="loadSaved"]')), true);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-layout-action="resetDefault"]')), true);

    doc.querySelector('[data-ui-editor-layout-action="applySave"]').click();
    assert.deepEqual(calls.find((call) => call[0] === "apply"), [
      "apply",
      "restarbeiten.ui.main",
      {
        elementId: "restarbeiten.editbox.text.short",
        operation: "move",
        payload: { x: 0, y: 0 },
      },
    ]);
    assert.equal(getStatusText(doc.querySelector('[data-ui-editor-launcher-status="true"]')).includes("Layout: Aenderung wurde angewendet"), true);

    doc.querySelector('[data-ui-editor-layout-action="loadSaved"]').click();
    assert.ok(calls.some((call) => call[0] === "load" && call[1] === "restarbeiten.ui.main"));
    assert.equal(getStatusText(doc.querySelector('[data-ui-editor-launcher-status="true"]')).includes("Layout: Gespeicherter Layoutzustand wurde geladen."), true);

    doc.querySelector('[data-ui-editor-layout-action="resetDefault"]').click();
    assert.ok(calls.some((call) => call[0] === "reset" && call[1] === "restarbeiten.ui.main"));
    assert.equal(getStatusText(doc.querySelector('[data-ui-editor-launcher-status="true"]')).includes("Layout: Standardzustand wurde wiederhergestellt."), true);
    panel = doc.querySelector('[data-ui-editor-layout-controls="true"]');
    assert.equal(Boolean(panel), true);
  });

  await run("BBM UI-Editor-Runtime: Layoutbedienung blockiert nicht registrierte Layoutziele sichtbar", async () => {
    const mod = await loadRuntime();
    const doc = createFakeDocument();
    const win = {
      uiEditorLauncherButtonArtifact: require(path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.js")),
    };
    const layoutInspector = {
      getLayoutControlPanel(_scopeId, elementId) {
        return {
          ok: false,
          elementId,
          selectedElement: null,
          currentLayoutEntry: null,
          controls: [],
          status: {
            kind: "blocked",
            message: "Aktion blockiert: Element ist nicht registriert.",
            reason: "ELEMENT_UNKNOWN",
          },
        };
      },
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
          { id: "restarbeiten.only.visible", name: "Nur sichtbar", type: "field", role: "content", parentId: "restarbeiten.root", allowedOps: ["inspect"], lockedOps: [] },
        ],
      }),
      layoutInspector,
      layoutScopeResolver: () => "restarbeiten.ui.main",
    });
    const target = doc.createElement("div");
    target.setAttribute("data-ui-editor-id", "restarbeiten.only.visible");
    doc.body.appendChild(target);

    button.click();
    doc.dispatchEvent({ type: "click", target });

    assert.equal(doc.querySelector('[data-ui-editor-layout-message="true"]').textContent.includes("blockiert"), true);
    assert.equal(Boolean(doc.querySelector('[data-ui-editor-layout-action="applySave"]')), false);
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
    assert.equal(getStatusText(activeStatus).includes("* protokoll.root (Root · Protokoll)"), true);
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
    assert.equal(getStatusText(activeStatus).includes("Verfuegbare Scopes:"), true);
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
    assert.equal(source.includes("layoutInspector"), true);
    assert.equal(source.includes("layoutScopeResolver"), true);
    assert.equal(coreShellSource.includes("createEditorScopeInspector"), true);
    assert.equal(coreShellSource.includes('"restarbeiten.screen": "restarbeiten.ui.main"'), true);
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
