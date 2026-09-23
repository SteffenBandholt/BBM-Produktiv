const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function runRechnungEditboxRestoredTests(run) {
  const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

  await run("Rechnung Shared Editbox 01: Rechnung nutzt wieder gemeinsames Binding", () => {
    const moduleSource = read("src/renderer/modules/rechnungen/index.js");
    assert.match(moduleSource, /RechnungLeistungsEditboxBinding/);
    assert.match(moduleSource, /_installLeistungsEditboxBinding/);
    assert.match(moduleSource, /_mountBeforeUiEditorComplete/);
    assert.match(moduleSource, /leistungsEditboxBinding\.showPosition/);
  });

  await run("Rechnung Shared Editbox 02: Binding basiert auf gemeinsamem Protokoll-Unterbau", () => {
    const binding = read("src/renderer/modules/rechnungen/RechnungLeistungsEditboxBinding.js");
    assert.match(binding, /SharedEditboxCore/);
    assert.match(binding, /WorkbenchShellFrame/);
    assert.match(binding, /Exakt derselbe wiederverwendbare Workbench-\/Editbox-Unterbau wie im Protokoll/);
    assert.doesNotMatch(binding, /class Rechnung.*EditboxCore/);
  });

  await run("Rechnung Shared Editbox 03: keine parallele Inline-Rechnungsbox im RechnungScreen", () => {
    const source = read("src/renderer/modules/rechnungen/screens/RechnungScreen.js");
    assert.doesNotMatch(source, /rechnung\.editor\.positionEditor/);
    assert.doesNotMatch(source, /rechnung\.editor\.editArea/);
    assert.doesNotMatch(source, /_syncSelectedPositionFromEditbox/);
    assert.doesNotMatch(source, /editboxNetTotal/);
    assert.match(source, /_mountBeforeUiEditorComplete/);
  });

  await run("Rechnung Shared Editbox 04: eigener Komponentenvertrag beschreibt nur Adapterziele", () => {
    const contract = read("src/renderer/modules/rechnungen/RechnungLeistungsEditbox.uiEditorContract.js");
    assert.match(contract, /RECHNUNG_LEISTUNGSEDITBOX_COMPONENT_ID/);
    assert.match(contract, /rechnung\.editor\.leistungsEditbox\.workbench/);
    assert.match(contract, /rechnung\.editor\.leistungsEditbox\.content/);
    assert.match(contract, /rechnung\.editor\.leistungsEditbox\.moduleArea/);
    assert.doesNotMatch(contract, /rechnung\.editor\.positionEditor/);
  });

  await run("Rechnung Shared Editbox 05: Bruttoeingabe bleibt verlustfrei ueber price_input_cents", () => {
    const binding = read("src/renderer/modules/rechnungen/RechnungLeistungsEditboxBinding.js");
    const moduleSource = read("src/renderer/modules/rechnungen/index.js");
    assert.match(binding, /position\?\.price_input_cents \?\? position\?\.unit_price_cents/);
    assert.match(moduleSource, /next\.price_input_cents = gross \? inputCents : null/);
  });

  await run("Rechnung Shared Editbox 06: BOOKED und FROM_ORDER bleiben gegen Editbox-Aenderung geschuetzt", () => {
    const moduleSource = read("src/renderer/modules/rechnungen/index.js");
    assert.match(moduleSource, /_showSelectedPositionInLeistungsEditbox\(\)[\s\S]*!this\._isFreeDraft\(\)/);
    assert.match(moduleSource, /_applyLeistungsEditboxChange\(positionId, values = \{\}\)[\s\S]*if \(!this\._isFreeDraft\(\)\) return/);
  });

  await run("Rechnung Shared Editbox 07: heutige Customer- und Kataloglogik bleibt erhalten", () => {
    const source = read("src/renderer/modules/rechnungen/screens/RechnungScreen.js");
    assert.match(source, /CustomerManagementScreen/);
    assert.match(source, /rechnung\.overview\.customers/);
    assert.match(source, /customer_id:\s*customerId/);
    assert.match(source, /_openCatalogFromCustomerManagement/);
    assert.match(source, /catalogReturnTarget/);
  });

  await run("Rechnung Shared Editbox 08: gemeinsame Box besitzt eigene Styles statt Rechnungs-Inline-CSS", () => {
    const sharedCss = read("src/renderer/modules/rechnungen/styles/rechnungLeistungsEditbox.css");
    const invoiceCss = read("src/renderer/modules/rechnungen/styles/rechnungenDesign.css");
    assert.match(sharedCss, /\.rechnung-leistungseditbox-host/);
    assert.match(sharedCss, /\.rechnung-shared-editbox-core/);
    assert.doesNotMatch(invoiceCss, /Rechnungs-Editbox: wiederhergestellte kompakte Positionsbearbeitung/);
    assert.doesNotMatch(invoiceCss, /\.rechnung-live-position-editor/);
  });
}

module.exports = { runRechnungEditboxRestoredTests };
