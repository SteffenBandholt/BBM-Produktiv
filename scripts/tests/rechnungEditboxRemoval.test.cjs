"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");
const REMOVED_IDS = Object.freeze([
  "rechnung.editor.editToggle",
  "rechnung.editor.editArea",
  "rechnung.editor.editCanvas",
  "rechnung.editor.positionEditor",
  "rechnung.editor.positionEditor.title.label",
  "rechnung.editor.positionType",
  "rechnung.editor.positionType.label",
  "rechnung.editor.positionShort",
  "rechnung.editor.positionShort.label",
  "rechnung.editor.positionShortRemaining",
  "rechnung.editor.positionLong",
  "rechnung.editor.positionLong.label",
  "rechnung.editor.positionLongRemaining",
  "rechnung.editor.positionQuantityBlock",
  "rechnung.editor.positionQuantityDecimals",
  "rechnung.editor.positionQuantityDecimals.label",
  "rechnung.editor.positionQuantityDecimals.decrease",
  "rechnung.editor.positionQuantityDecimals.value",
  "rechnung.editor.positionQuantityDecimals.increase",
  "rechnung.editor.positionQuantity",
  "rechnung.editor.positionQuantity.label",
  "rechnung.editor.positionUnit",
  "rechnung.editor.positionUnit.label",
  "rechnung.editor.positionPrice",
  "rechnung.editor.positionPrice.label",
  "rechnung.editor.positionVatRate",
  "rechnung.editor.positionVatRate.label",
  "rechnung.editor.positionPriceGross",
  "rechnung.editor.positionPriceGross.label",
  "rechnung.editor.positionNep",
  "rechnung.editor.positionNep.label",
  "rechnung.editor.positionActions",
  "rechnung.editor.positionCreateTitle",
  "rechnung.editor.positionCreate",
  "rechnung.editor.positionMove",
  "rechnung.editor.positionDelete",
  "rechnung.editor.positionMoveRoot",
  "rechnung.editor.editboxTotals",
  "rechnung.editor.editboxTotals.title",
  "rechnung.editor.editboxTotals.netLabel",
  "rechnung.editor.editboxTotals.netValue",
  "rechnung.editor.editboxTotals.vatLabel",
  "rechnung.editor.editboxTotals.vatValue",
  "rechnung.editor.editboxTotals.grossLabel",
  "rechnung.editor.editboxTotals.grossValue",
]);

async function runRechnungEditboxRemovalTests(run) {
  await run("Alte RechnungsEditbox ist aus Komponente, DOM-Bau und CSS entfernt", () => {
    const componentPath = path.join(ROOT, "src/renderer/modules/rechnungen/components/RechnungsEditbox.js");
    assert.equal(fs.existsSync(componentPath), false);
    const screen = read("src/renderer/modules/rechnungen/screens/RechnungScreen.js");
    const css = read("src/renderer/modules/rechnungen/styles/rechnungenDesign.css");
    for (const token of ["RechnungsEditbox", "rechnungsEditbox", "editboxToggleButton", "_toggleEditbox", "_syncEditboxToggle", "refreshOverlayClearance", "positionEditor", "editArea", "editCanvas"]) {
      assert.equal(screen.includes(token), false, `Screen-Rest: ${token}`);
    }
    for (const selector of ["rechnung-screen__edit-area", "rechnung-screen__edit-canvas", "rechnung-editbox-workbench", "rechnung-editbox-shell", "rechnung-live-position-editor", "rechnung-editbox-overlay-clearance"]) {
      assert.equal(css.includes(selector), false, `CSS-Rest: ${selector}`);
    }
  });

  await run("Rechnungsscope besitzt exakt 87 gueltige Ziele ohne alte Editbox-IDs", async () => {
    const contract = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/rechnungen/RechnungScreen.uiEditorContract.js"));
    const elements = contract.rechnungUiEditorContract.slots.map((slot) => slot.element);
    const byId = new Map(elements.map((entry) => [entry.id, entry]));
    assert.equal(elements.length, 87);
    assert.equal(new Set(elements.map((entry) => entry.id)).size, 87);
    assert.deepEqual(REMOVED_IDS.filter((id) => byId.has(id)), []);
    for (const entry of elements) {
      if (entry.parentId !== null) assert.ok(byId.has(entry.parentId), `${entry.id}: Parent fehlt (${entry.parentId})`);
    }
    assert.deepEqual(elements.filter((entry) => entry.type === "button").map((entry) => entry.id), [
      "rechnung.overview.new",
      "rechnung.editor.headToggle",
      "rechnung.editor.customerPicker",
      "rechnung.editor.servicePeriodToggle",
      "rechnung.editor.preview",
      "rechnung.editor.book",
      "rechnung.editor.delete",
      "rechnung.editor.close",
      "rechnung.preview.close",
    ]);
  });

  await run("HostAdapter, Refs, Session und Acceptance enthalten keine Editbox-Sonderpfade mehr", () => {
    const host = read("src/renderer/ui-editor/m80HostAdapter.js");
    const refs = read("src/renderer/ui-editor/m80Refs.js");
    const session = read("src/main/ui-editor/electronUiEditorSession.js");
    const main = read("src/main/main.js");
    const acceptance = read("src/renderer/ui-editor/rechnungAcceptancePilot.js");
    assert.doesNotMatch(host, /submitM80LayoutChange|rechnung-editbox-toggle/);
    assert.doesNotMatch(refs, /readM80GenericState|applyM80GenericState/);
    assert.doesNotMatch(session, /RECHNUNG_WORKBENCH|m86-31-rechnung-workbench|applyRechnungWorkbenchProfileMigration/);
    assert.doesNotMatch(main, /rechnung-editbox-outer-acceptance|RechnungEditboxProductAcceptance/);
    assert.doesNotMatch(acceptance, /measureEditbox|toggleEditbox|changeShortText|reopenEditbox|refreshOverlayClearance/);
  });
}

module.exports = { runRechnungEditboxRemovalTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runRechnungEditboxRemovalTests(run).then(() => { if (failed) process.exitCode = 1; });
}
