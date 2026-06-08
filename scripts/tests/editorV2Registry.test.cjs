const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createFakeDocument() {
  function createNode(tagName, doc) {
    return {
      tagName: String(tagName || "").toUpperCase(),
      ownerDocument: doc,
      children: [],
      parentElement: null,
      textContent: "",
      style: { cssText: "" },
      attributes: {},
      append(...items) {
        for (const item of items) {
          if (item && typeof item === "object") {
            item.parentElement = this;
            item.ownerDocument = doc;
          }
          this.children.push(item);
        }
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      getAttribute(name) {
        return this.attributes[name] ?? null;
      },
      querySelectorAll(selector) {
        const match = String(selector || "").match(/data-ui-v2-id=["']([^"']+)["']/);
        const expectedId = match ? match[1] : "";
        const all = [];
        const walk = (node) => {
          if (!node || typeof node !== "object") return;
          all.push(node);
          for (const child of Array.isArray(node.children) ? node.children : []) {
            walk(child);
          }
        };
        walk(this);
        if (!expectedId) return [];
        return all.filter((node) => node?.getAttribute?.("data-ui-v2-id") === expectedId);
      },
      querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
      },
    };
  }

  const document = {
    createElement(tagName) {
      return createNode(tagName, document);
    },
  };
  document.body = createNode("body", document);
  return document;
}

function makeEntry(overrides = {}) {
  return {
    id: "root",
    label: "Root",
    kind: "frame",
    editable: true,
    ops: "move,resize,hide",
    selector: '[data-ui-v2-id="root"]',
    ...overrides,
  };
}

async function runEditorV2RegistryTests(run) {
  const registryPath = path.join(__dirname, "../../src/renderer/uiV2/editorV2/editorV2Registry.js");
  const corePath = path.join(__dirname, "../../src/renderer/uiV2/editorV2/editorV2Core.js");
  const screenPath = path.join(__dirname, "../../src/renderer/uiV2/editorLab/EditorLabScreen.js");
  const labRegistryPath = path.join(__dirname, "../../src/renderer/uiV2/editorLab/editorLabRegistry.js");

  const registrySource = fs.readFileSync(registryPath, "utf8");
  const coreSource = fs.readFileSync(corePath, "utf8");
  assert.equal(registrySource.includes("restarbeiten"), false);
  assert.equal(registrySource.includes("protokoll"), false);
  assert.equal(registrySource.includes("uiInspector"), false);
  assert.equal(coreSource.includes("restarbeiten"), false);
  assert.equal(coreSource.includes("protokoll"), false);
  assert.equal(coreSource.includes("uiInspector"), false);

  const registryModule = await importEsmFromFile(registryPath);
  const coreModule = await importEsmFromFile(corePath);
  const screenModule = await importEsmFromFile(screenPath);
  const labRegistryModule = await importEsmFromFile(labRegistryPath);

  assert.equal(typeof registryModule.normalizeEditorV2Registry, "function");
  assert.equal(typeof registryModule.validateEditorV2Registry, "function");
  assert.equal(typeof registryModule.findRegistryEntryById, "function");
  assert.equal(typeof registryModule.getRegistryEntriesByKind, "function");
  assert.equal(typeof registryModule.resolveRegistryElement, "function");
  assert.equal(typeof registryModule.resolveRegistryElements, "function");
  assert.equal(typeof registryModule.getParentEntry, "function");
  assert.equal(typeof registryModule.getChildEntries, "function");
  assert.equal(typeof registryModule.isAllowedKind, "function");
  assert.equal(typeof registryModule.isAllowedOperation, "function");

  const validRegistry = labRegistryModule.createEditorLabRegistry();
  const validCheck = registryModule.validateEditorV2Registry(validRegistry);
  assert.equal(validCheck.valid, true);
  assert.equal(validCheck.errors.length, 0);

  const normalizedOps = registryModule.normalizeEditorV2Registry([
    makeEntry({ ops: "move,resize,hide" }),
  ]);
  assert.deepEqual(normalizedOps[0].ops, ["move", "resize", "hide"]);

  assert.equal(registryModule.isAllowedKind("frame"), true);
  assert.equal(registryModule.isAllowedKind("field"), true);
  assert.equal(registryModule.isAllowedKind("control"), true);
  assert.equal(registryModule.isAllowedKind("group"), false);

  const invalidKind = registryModule.validateEditorV2Registry([
    makeEntry({ kind: "group" }),
  ]);
  assert.equal(invalidKind.valid, false);
  assert.equal(invalidKind.errors.some((error) => error.code === "INVALID_KIND"), true);

  const missingId = registryModule.validateEditorV2Registry([
    makeEntry({ id: "" }),
  ]);
  assert.equal(missingId.errors.some((error) => error.code === "MISSING_ID"), true);

  const missingLabel = registryModule.validateEditorV2Registry([
    makeEntry({ label: "" }),
  ]);
  assert.equal(missingLabel.errors.some((error) => error.code === "MISSING_LABEL"), true);

  const missingEditable = registryModule.validateEditorV2Registry([
    { id: "root", label: "Root", kind: "frame", ops: "move", selector: '[data-ui-v2-id="root"]' },
  ]);
  assert.equal(missingEditable.errors.some((error) => error.code === "MISSING_EDITABLE"), true);

  const missingSelector = registryModule.validateEditorV2Registry([
    { id: "root", label: "Root", kind: "frame", editable: true, ops: "move" },
  ]);
  assert.equal(missingSelector.errors.some((error) => error.code === "MISSING_SELECTOR_OR_ELEMENTREF"), true);

  const missingParentId = registryModule.validateEditorV2Registry([
    makeEntry({ id: "root", parentId: undefined }),
    makeEntry({ id: "child", label: "Child", kind: "field", editable: true, ops: "move", selector: '[data-ui-v2-id="child"]' }),
  ]);
  assert.equal(missingParentId.errors.some((error) => error.code === "MISSING_PARENT_ID"), true);

  const missingParent = registryModule.validateEditorV2Registry([
    makeEntry({ id: "root" }),
    makeEntry({ id: "child", parentId: "missing", label: "Child", kind: "field", editable: true, ops: "move", selector: '[data-ui-v2-id="child"]' }),
  ]);
  assert.equal(missingParent.errors.some((error) => error.code === "MISSING_PARENT"), true);

  const cycle = registryModule.validateEditorV2Registry([
    makeEntry({ id: "a", parentId: "b", selector: '[data-ui-v2-id="a"]' }),
    makeEntry({ id: "b", parentId: "a", selector: '[data-ui-v2-id="b"]' }),
  ]);
  assert.equal(cycle.errors.some((error) => error.code === "CYCLE"), true);

  const deepRegistry = [
    makeEntry({ id: "root", selector: '[data-ui-v2-id="root"]' }),
    makeEntry({ id: "level2", parentId: "root", selector: '[data-ui-v2-id="level2"]' }),
    makeEntry({ id: "level3", parentId: "level2", selector: '[data-ui-v2-id="level3"]' }),
    makeEntry({ id: "level4", parentId: "level3", selector: '[data-ui-v2-id="level4"]' }),
    makeEntry({ id: "level5", parentId: "level4", selector: '[data-ui-v2-id="level5"]' }),
  ];
  const deepCheck = registryModule.validateEditorV2Registry(deepRegistry);
  assert.equal(deepCheck.errors.some((error) => error.code === "DEPTH_TOO_DEEP"), true);

  const invalidOp = registryModule.validateEditorV2Registry([
    makeEntry({ ops: "move,save" }),
  ]);
  assert.equal(invalidOp.errors.some((error) => error.code === "INVALID_OP" && error.op === "save"), true);

  assert.equal(registryModule.isAllowedOperation(makeEntry(), "move"), true);
  assert.equal(registryModule.isAllowedOperation(makeEntry(), "resize"), true);
  assert.equal(registryModule.isAllowedOperation(makeEntry(), "hide"), true);
  assert.equal(registryModule.isAllowedOperation(makeEntry(), "save"), false);

  const document = createFakeDocument();
  const root = document.body;
  const existing = document.createElement("div");
  existing.setAttribute("data-ui-v2-id", "alpha");
  root.append(existing);

  const resolveRegistry = [
    makeEntry({ id: "alpha", selector: '[data-ui-v2-id="alpha"]' }),
    makeEntry({ id: "beta", selector: '[data-ui-v2-id="beta"]' }),
  ];

  const resolvedElement = registryModule.resolveRegistryElement(root, resolveRegistry[0]);
  assert.equal(resolvedElement, existing);

  const resolvedElements = registryModule.resolveRegistryElements(root, resolveRegistry);
  assert.equal(resolvedElements.length, 2);
  assert.equal(resolvedElements[0].found, true);
  assert.equal(resolvedElements[1].found, false);

  assert.equal(registryModule.findRegistryEntryById(resolveRegistry, "beta").id, "beta");
  assert.equal(
    registryModule.getParentEntry(validRegistry, registryModule.findRegistryEntryById(validRegistry, "editorlab.main.groupA")).id,
    "editorlab.main"
  );
  assert.equal(
    registryModule.getChildEntries(validRegistry, "editorlab.main.groupA").map((entry) => entry.id).sort().join(","),
    "editorlab.main.groupA.buttonA2,editorlab.main.groupA.fieldA1"
  );
  assert.equal(registryModule.getRegistryEntriesByKind(validRegistry, "frame").every((entry) => entry.kind === "frame"), true);

  const core = coreModule.createEditorV2Core({ registry: validRegistry, mode: "frame" });
  assert.equal(core.getRegistryValidation().valid, true);
  const screen = screenModule.createEditorLabScreen({ registry: validRegistry });
  assert.equal(typeof screen.render, "function");

  const diffFiles = execFileSync("git", ["diff", "--name-only"], { cwd: path.join(__dirname, "../.."), encoding: "utf8" })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const allowedProtokollUiDiffs = new Set([
    "src/renderer/modules/protokoll/TopsScreenQuicklane.js",
    "src/renderer/modules/protokoll/screens/TopsScreen.js",
    "src/renderer/modules/protokoll/styles/tops.css",
    "src/renderer/modules/protokoll/uiEditor/protokollUiElements.js",
  ]);
  assert.equal(
    diffFiles.some(
      (file) => file.startsWith("src/renderer/modules/protokoll/") && !allowedProtokollUiDiffs.has(file)
    ),
    false
  );
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);

  await run("Editor V2 Registry-Helfer sind stabil", () => undefined);
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

  runEditorV2RegistryTests(run).then(() => {
    if (!process.exitCode) console.log("editorV2Registry.test.cjs passed");
  });
}

module.exports = { runEditorV2RegistryTests };
