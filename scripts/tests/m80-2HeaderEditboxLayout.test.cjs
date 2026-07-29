"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

async function runM802HeaderEditboxLayoutTests(run) {
  const registryModule = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const scopes = registryModule.listM80RegistryScopes();
  const complete = scopes.filter((scope) => scope.status === "complete");
  const elements = complete.flatMap((scope) => scope.elements);

  await run("M80.2 Registry: Header, Liste und Editbox sind direkt aktiv; Split ist gesperrt", () => {
    assert.equal(registryModule.BBM_M80_REGISTRY_VERSION, 7);
    assert.deepEqual(registryModule.BBM_M80_ACTIVE_SCOPES, [
      "restarbeiten.header.root",
      "restarbeiten.list.root",
      "restarbeiten.edit.root",
    ]);
    const removedLayout = scopes.find((scope) => scope.scopeId === "restarbeiten.layout.root");
    assert.equal(removedLayout.status, "blocked");
    assert.equal(removedLayout.reason, "M80_2_split_removed");
    assert.equal(elements.some((entry) => entry.id === "restarbeiten.layout.split"), false);
  });

  await run("M80.2 Registry: Header vollständig, Editbox direkt größenfähig und Alt-Kind-IDs stabil", () => {
    const header = complete.find((scope) => scope.scopeId === "restarbeiten.header.root");
    const edit = complete.find((scope) => scope.scopeId === "restarbeiten.edit.root");
    assert.equal(header.elements.length, 31);
    assert.equal(edit.elements.length, 53);
    assert.equal(header.elements.find((entry) => entry.id === "restarbeiten.filterbar").type, "area");
    const nativeTypes = new Set(["root", "area", "group", "fieldGroup", "label", "field", "button", "table", "tableHeader", "tableBody", "tableRow", "tableColumn", "tableHeaderCell", "tableDataCell", "tableViewport", "horizontalScrollArea", "statusIndicator", "componentPart"]);
    const nativeLockedOps = new Set(["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"]);
    for (const entry of elements) {
      assert.ok(nativeTypes.has(entry.type), `${entry.id}: nativer Elementtyp`);
      assert.equal(entry.lockedOps.every((operation) => nativeLockedOps.has(operation)), true, `${entry.id}: native lockedOps`);
    }
    for (const root of [header.elements[0], edit.elements[0]]) {
      assert.ok(root.allowedOps.includes("resizeHeight"));
      assert.ok(root.allowedOps.includes("setVisibility"));
      assert.equal(root.allowedOps.includes("move"), false);
      assert.equal(root.lockedOps.includes("move"), false);
    }
    assert.equal(header.elements[0].allowedOps.includes("resizeWidth"), false);
    assert.equal(edit.elements[0].allowedOps.includes("resizeWidth"), false);
    assert.equal(edit.elements[0].baseline.minWidth, 320);
    assert.equal(edit.elements[0].baseline.minHeight, 190);
    assert.equal(edit.elements[0].baseline.maxHeight, 520);
    for (const id of [
      "restarbeiten.edit.short.field",
      "restarbeiten.edit.long.field",
      "restarbeiten.edit.location.1.field",
      "restarbeiten.edit.location.4.field",
      "restarbeiten.edit.meta.status.field",
      "restarbeiten.edit.meta.due.field",
      "restarbeiten.edit.meta.responsible.field",
    ]) assert.ok(edit.elements.some((entry) => entry.id === id), id);
    for (const fieldGroup of header.elements.filter((entry) => entry.type === "fieldGroup")) {
      const children = header.elements.filter((entry) => entry.parentId === fieldGroup.id);
      assert.ok(children.some((entry) => entry.type === "label"), `${fieldGroup.id}: label`);
      assert.ok(children.some((entry) => entry.type === "field"), `${fieldGroup.id}: field`);
    }
  });

  await run("M80.2 Layoutvertrag: lange Liste scrollt im flexiblen Bereich ohne Overlay-Split", () => {
    const css = read("src/renderer/modules/restarbeiten/styles/restarbeiten.css");
    const screen = read("src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js");
    const diagnostic = read("src/renderer/ui-editor/m80Diagnostic.js");
    assert.match(css, /\.bbm-restarbeiten-screen\s*\{[\s\S]*grid-template-rows:\s*auto minmax\(0, 1fr\)/);
    assert.match(css, /\.bbm-restarbeiten-screen\s*\{[\s\S]*min-height:\s*0;[\s\S]*height:\s*100%;[\s\S]*max-height:\s*100%/);
    assert.match(css, /\.bbm-restarbeiten-workspace\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*column/);
    assert.match(css, /\.bbm-restarbeiten-workspace__list\s*\{[\s\S]*flex:\s*1 1 0;[\s\S]*min-height:\s*180px/);
    assert.match(css, /\.bbm-restarbeiten-workspace__edit\s*\{[\s\S]*max-height:\s*calc\(100% - 180px\);[\s\S]*overflow:\s*auto/);
    assert.match(css, /\.bbm-restarbeiten-main\s*\{[\s\S]*min-height:\s*0;[\s\S]*overflow:\s*auto/);
    assert.doesNotMatch(css, /--bbm-restarbeiten-list-height/);
    assert.match(screen, /registerM80Ref\("restarbeiten\.header\.root", header\)/);
    assert.doesNotMatch(screen, /registerM80SharedVerticalLayout/);
    assert.match(diagnostic, /Array\.from\(\{ length:\s*60 \}/, "Diagnose stellt eine sichtbar lange Liste bereit");
    assert.match(diagnostic, /emitM80RegistryEvent\("registryChanged"\)/, "Diagnose-Hotkey meldet die Registryrevision an den Host");
  });

  await run("M80.2 Sicherheitsgrenze: Header-Fachbuttons bleiben Layoutobjekte", () => {
    const header = complete.find((scope) => scope.scopeId === "restarbeiten.header.root");
    const buttons = header.elements.filter((entry) => entry.type === "button");
    assert.equal(buttons.length, 4);
    for (const button of buttons) {
      assert.ok(button.lockedOps.includes("executeTargetAction"), button.id);
      assert.ok(button.lockedOps.includes("modifyDomainData"), button.id);
      assert.equal(button.allowedOps.includes("executeTargetAction"), false, button.id);
    }
  });
}

module.exports = { runM802HeaderEditboxLayoutTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runM802HeaderEditboxLayoutTests(run).then(() => { if (failed) process.exitCode = 1; });
}
