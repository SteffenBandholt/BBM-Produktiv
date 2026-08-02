"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const BUTTONS = Object.freeze([
  ["protokoll.header.action.endMeeting", "protokoll.header.actions", "btnEndMeeting"],
  ["protokoll.header.action.close", "protokoll.header.actions", "btnClose"],
  ["protokoll.header.action.openUiEditor", "protokoll.header.actions", "uiEditorOpenButton"],
  ["protokoll.edit.header.action.addTitle", "protokoll.edit.header.addActions", "btnL1"],
  ["protokoll.edit.header.action.addTop", "protokoll.edit.header.addActions", "btnChild"],
  ["protokoll.edit.header.action.move", "protokoll.edit.header.primaryActions", "btnMove"],
  ["protokoll.edit.header.action.delete", "protokoll.edit.header.primaryActions", "btnDelete"],
  ["protokoll.edit.short.action.dictation", "protokoll.edit.short.label", "shortDictateButton"],
  ["protokoll.edit.long.action.dictation", "protokoll.edit.long.label", "longDictateButton"],
  ["protokoll.edit.dictation.status.action.undo", "protokoll.edit.dictation.status", "dictationUndoButton"],
  ["protokoll.edit.long.correction.action.open", "protokoll.edit.long.correction", "dictionaryCorrectionButton"],
  ["protokoll.topsScreen.quicklane.pin", "protokoll.topsScreen.quicklane.group.navigation", "group.children[index]"],
  ["protokoll.topsScreen.quicklane.action.project", "protokoll.topsScreen.quicklane.group.navigation", "group.children[index]"],
  ["protokoll.topsScreen.quicklane.action.firms", "protokoll.topsScreen.quicklane.group.navigation", "group.children[index]"],
  ["protokoll.topsScreen.quicklane.action.participants", "protokoll.topsScreen.quicklane.group.navigation", "group.children[index]"],
  ["protokoll.topsScreen.quicklane.action.ampel", "protokoll.topsScreen.quicklane.group.visibility", "group.children[index]"],
  ["protokoll.topsScreen.quicklane.action.longtext", "protokoll.topsScreen.quicklane.group.visibility", "group.children[index]"],
  ["protokoll.topsScreen.quicklane.action.topFilter", "protokoll.topsScreen.quicklane.group.filter", "group.children[index]"],
  ["protokoll.topsScreen.quicklane.action.preview", "protokoll.topsScreen.quicklane.group.output", "group.children[index]"],
  ["protokoll.topsScreen.quicklane.action.print", "protokoll.topsScreen.quicklane.group.output", "group.children[index]"],
  ["protokoll.topsScreen.quicklane.action.mail", "protokoll.topsScreen.quicklane.group.output", "group.children[index]"],
  ["protokoll.topsScreen.quicklane.filter.option.all", "protokoll.topsScreen.quicklane.filter.menu", "menu.children[index]"],
  ["protokoll.topsScreen.quicklane.filter.option.todo", "protokoll.topsScreen.quicklane.filter.menu", "menu.children[index]"],
  ["protokoll.topsScreen.quicklane.filter.option.decision", "protokoll.topsScreen.quicklane.filter.menu", "menu.children[index]"],
]);

class FakeElement {
  constructor(tagName = "DIV") {
    this.tagName = tagName; this.nodeName = tagName; this.parentElement = null; this.children = []; this.dataset = {}; this.attributes = {}; this.isConnected = true;
    this.style = { setProperty(name, value) { this[name] = value; }, getPropertyValue(name) { return this[name] || ""; } };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value); }
  getAttribute(name) { return this.attributes[name] || null; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 120, height: 28, right: 120, bottom: 28 }; }
}

async function runM867ProtokollButtonContractTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const entries = new Map(registry.listM80RegistryScopes().filter((scope) => scope.scopeId.startsWith("protokoll.")).flatMap((scope) => scope.elements.map((entry) => [entry.id, entry])));
  const screenSource = read("src/renderer/modules/protokoll/screens/TopsScreen.js");
  const quicklaneSource = read("src/renderer/modules/protokoll/TopsScreenQuicklane.js");

  await run("M86.7 01: jedes bekannte sichtbare Protokoll-Buttonziel ist einzeln, begrenzt und parent-korrekt deklariert", () => {
    assert.equal(new Set(BUTTONS.map(([id]) => id)).size, BUTTONS.length);
    for (const [id, parentId] of BUTTONS) {
      const entry = entries.get(id);
      assert.ok(entry, `missing contract ${id}`);
      assert.equal(entry.type, "button", id);
      assert.equal(entry.parentId, parentId, id);
      assert.equal(entries.has(parentId), true, `${id} -> ${parentId}`);
      assert.equal(entry.editable, true, id);
      assert.deepEqual(entry.allowedOps, ["move", "resizeWidth", "resizeHeight", "setVisibility"], id);
      assert.equal(entry.baseline.minWidth > 0 && entry.baseline.maxWidth >= entry.baseline.minWidth, true, id);
      assert.equal(entry.baseline.minHeight > 0 && entry.baseline.maxHeight >= entry.baseline.minHeight, true, id);
      for (const locked of ["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"]) assert.equal(entry.lockedOps.includes(locked), true, `${id}: ${locked}`);
    }
  });

  await run("M86.7 02: produktive Bindungen verwenden nur die echten vorhandenen Button-Refs, ohne Wrapper oder DOM-Suche", () => {
    for (const [id, , ref] of BUTTONS.filter(([id]) => !id.includes("quicklane") && id !== "protokoll.header.action.openUiEditor")) {
      assert.match(screenSource, new RegExp(`registerM80Ref\\("${id.replace(/\\./g, "\\\\.")}", [^\\n]*${ref}`), id);
    }
    assert.match(quicklaneSource, /registerM80Ref\(buttonId, group\.children\[index\]\)/);
    assert.match(quicklaneSource, /registerM80Ref\(`protokoll\.topsScreen\.quicklane\.filter\.option\.\$\{option\.mode\}`, menu\.children\[index\]\)/);
    assert.doesNotMatch(screenSource.slice(screenSource.indexOf("  _registerUiEditorRefs() {"), screenSource.indexOf("  _buildProtocolScreenRegions() {")), /createElement|appendChild|insertBefore|querySelector/);
  });

  await run("M86.7 03: DEV-Button ist bedingt, Release bleibt ohne unvollständigen Slot und DEV-Ref ist direkt", () => {
    const slot = registry.getM83ComponentContract("bbm.protokoll.screen").slots.find((entry) => entry.slotId === "protokoll.header.action.openUiEditor");
    assert.deepEqual({ required: slot.required, referenceKind: slot.referenceKind, presence: slot.presence, directSelection: slot.requirements.directSelection }, { required: false, referenceKind: "multi", presence: "whenVisibleInstances", directSelection: true });
    assert.match(read("src/renderer/modules/protokoll/TopsHeader.js"), /this\.uiEditorOpenButtonReady = installDevelopmentUiEditorOpenButton/);
    assert.match(screenSource, /registerM80Ref\("protokoll\.header\.action\.openUiEditor", button\)/);
    assert.match(screenSource, /registerM80MultiRef\("protokoll\.header\.action\.openUiEditor", header\.uiEditorOpenButton \? \[header\.uiEditorOpenButton\] : \[\], header\.actionsWrap\)/);
    assert.match(quicklaneSource, /registerM80MultiRef\("protokoll\.topsScreen\.quicklane\.filter\.menu", \[\], this\.root\)/);
  });

  const previous = { document: global.document, window: global.window, Element: global.Element, CustomEvent: global.CustomEvent };
  global.Element = FakeElement;
  global.CustomEvent = class { constructor(type) { this.type = type; } };
  global.document = { createElement: (tag) => new FakeElement(tag), querySelector: () => null };
  global.window = { getComputedStyle: () => ({ width: "120px", height: "28px", paddingLeft: "0px", paddingTop: "0px", fontSize: "12px", boxSizing: "border-box" }), dispatchEvent() {} };
  try {
    await run("M86.7 04: jeder Button ist direkt selektierbar; doppelte IDs und fehlende Pflicht-Refs bleiben blockiert", () => {
      refs.resetM80PilotWorkingStatesForDiagnostic(); refs.beginM80PilotRender();
      const targets = new Map();
      for (const [id, entry] of entries) {
        if (entry.type !== "button" || id === "protokoll.header.action.openUiEditor" || id.includes("quicklane.filter.")) continue;
        const target = new FakeElement("BUTTON"); targets.set(id, target); refs.registerM80Ref(id, target);
        assert.equal(refs.getM80IdFromTarget(target), id, id);
      }
      assert.throws(() => refs.registerM80Ref("protokoll.header.action.close", new FakeElement("BUTTON")), (error) => error.code === "component_single_ref_duplicate");
      assert.throws(() => refs.validateM83ComponentReferences(["bbm.protokoll.screen"]), (error) => error.code === "component_reference_contract_invalid" && error.details.some((entry) => entry.code === "component_slot_reference_missing" && entry.slotId === "protokoll.header"));
    });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic(); global.document = previous.document; global.window = previous.window; global.Element = previous.Element; global.CustomEvent = previous.CustomEvent;
  }
}

module.exports = { runM867ProtokollButtonContractTests };
if (require.main === module) {
  let failed = false;
  const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM867ProtokollButtonContractTests(run).then(() => { if (failed) process.exitCode = 1; }).catch((error) => { process.exitCode = 1; console.error(error?.stack || error); });
}
