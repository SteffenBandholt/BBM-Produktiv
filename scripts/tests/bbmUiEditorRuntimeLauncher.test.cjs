const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const RUNTIME_PATH = path.join(__dirname, "../../src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
const CORE_SHELL_PATH = path.join(__dirname, "../../src/renderer/app/CoreShell.js");
const MAIN_HEADER_PATH = path.join(__dirname, "../../src/renderer/ui/MainHeader.js");
const INDEX_PATH = path.join(__dirname, "../../src/renderer/index.html");
const LAUNCHER_CSS_PATH = path.join(__dirname, "../../uiEditor/uiEditorLauncherButton.css");

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
    assert.equal(source.includes("uiEditor/uiEditorLauncherButton.js"), true);
    assert.equal(source.includes("uiEditor/uiEditorLauncherButton.css"), true);
    assert.equal(source.includes("scanUiInspectorTargets"), false);
    assert.equal(source.includes("createUiInspectorPanel"), false);
    assert.equal(source.includes("localStorage"), false);
    assert.equal(source.includes("sessionStorage"), false);
    assert.equal(source.includes("MutationObserver"), false);
    assert.equal(source.includes("querySelectorAll"), false);

    const indexSource = fs.readFileSync(INDEX_PATH, "utf8");
    assert.equal(indexSource.includes("../../uiEditor/uiEditorLauncherButton.js"), true);
    const cssSource = fs.readFileSync(LAUNCHER_CSS_PATH, "utf8");
    assert.equal(cssSource.includes("z-index: 13050"), true);
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
    assert.equal(button.id, "uiEditor.launcherButton");
    assert.equal(button.className, "ui-editor-launcher-button");
    assert.equal(button.textContent, "UI-Editor");
    assert.equal(button.textContent.includes("EditorLab V2"), false);
    assert.equal(button.getAttribute("data-ui-editor-installed-artifact"), "uiEditor/uiEditorLauncherButton.js");
    assert.equal(button.getAttribute("data-ui-editor-active-ui-scope"), "");
    assert.equal(doc.querySelector('link[data-ui-editor-launcher-css="true"]').href, "../../uiEditor/uiEditorLauncherButton.css");
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
    button.click();
    assert.equal(button.dataset.uiEditorLauncherActive, "true");
    assert.equal(button.getAttribute("data-ui-editor-launcher-active"), "true");
    button.click();
    assert.equal(button.dataset.uiEditorLauncherActive, "false");
    assert.deepEqual(toggles.map((event) => event.uiEditorLauncherActive), [true, false]);
    assert.deepEqual(toggles.map((event) => event.activeUiScope), [null, null]);
    assert.equal(Boolean(doc.querySelector('[data-ui-inspector-panel="true"]')), false);
  });

  await run("BBM UI-Editor-Runtime: CoreShell nutzt Runtime-Launcher statt alter Scanstatus-Grundlage", () => {
    const coreShellSource = fs.readFileSync(CORE_SHELL_PATH, "utf8");
    const mainHeaderSource = fs.readFileSync(MAIN_HEADER_PATH, "utf8");
    assert.equal(coreShellSource.includes("installBbmUiEditorRuntimeLauncher"), true);
    assert.equal(coreShellSource.includes("activeUiScope: null"), true);
    assert.equal(mainHeaderSource.includes("_isUiEditorRuntimeLauncherEnabled"), true);
    assert.equal(mainHeaderSource.includes("_isUiEditorEnabled() {\n    return false;\n  }"), true);
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
