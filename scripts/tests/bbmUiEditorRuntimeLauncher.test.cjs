const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const RUNTIME_PATH = path.join(__dirname, "../../src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
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
      click() {
        const event = {
          type: "click",
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
    };
    return node;
  };

  const doc = {
    createElement(tag) {
      return createNode(tag, doc);
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

    const source = fs.readFileSync(RUNTIME_PATH, "utf8");
    const cssSource = fs.readFileSync(CSS_PATH, "utf8");
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf8"));
    assert.equal(source.includes("uiEditor/uiEditorLauncherButton.js"), true);
    assert.equal(source.includes("uiEditor/uiEditorLauncherButton.css"), true);
    assert.equal(source.includes("../../../uiEditor/uiEditorLauncherButton.js"), true);
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
    assert.equal(activeStatus.textContent, "UI-Editor aktiv");

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

  await run("BBM UI-Editor-Runtime: bleibt ohne Scan, Speicherung und Ziel-App-Aktion", async () => {
    const source = fs.readFileSync(RUNTIME_PATH, "utf8");
    assert.equal(source.includes("scanUiInspectorTargets"), false);
    assert.equal(source.includes("MutationObserver"), false);
    assert.equal(source.includes("querySelectorAll"), false);
    assert.equal(source.includes("localStorage"), false);
    assert.equal(source.includes("sessionStorage"), false);
    assert.equal(source.includes("ipcRenderer"), false);
    assert.equal(source.includes("writeFile"), false);
    assert.equal(source.includes("showEditorLabV2"), false);
    assert.equal(source.includes("showRestarbeitenV2"), false);
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
