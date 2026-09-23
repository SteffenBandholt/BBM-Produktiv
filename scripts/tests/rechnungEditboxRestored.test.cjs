const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function runRechnungEditboxRestoredTests(run) {
  await run("Rechnung Editbox 01: aktuelle Rechnung enthaelt feste Positions-Editbox", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/renderer/modules/rechnungen/screens/RechnungScreen.js"),
      "utf8"
    );
    for (const token of [
      "rechnung.editor.editArea",
      "rechnung.editor.editCanvas",
      "rechnung.editor.positionEditor",
      "rechnung.editor.positionShort",
      "rechnung.editor.positionLong",
      "rechnung.editor.positionQuantity",
      "rechnung.editor.positionPrice",
      "rechnung.editor.positionNep",
      "rechnung.editor.editboxTotals",
    ]) {
      assert.match(source, new RegExp(token.replaceAll(".", "\\.")));
    }
    assert.match(source, /_syncSelectedPositionFromEditbox/);
    assert.match(source, /_setQuantityDecimalPlaces/);
    assert.match(source, /_togglePositionPriceInputMode/);
  });

  await run("Rechnung Editbox 02: zentrale customerId-Logik bleibt erhalten", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/renderer/modules/rechnungen/screens/RechnungScreen.js"),
      "utf8"
    );
    assert.match(source, /customer_id:\s*customerId/);
    assert.match(source, /customer_ref_kind:\s*null/);
    assert.match(source, /CustomerManagementScreen/);
    assert.doesNotMatch(source, /const \[fallbackKind, fallbackId\]/);
  });

  await run("Rechnung Editbox 03: gebuchte und gebundene Rechnungen sperren Editbox", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/renderer/modules/rechnungen/screens/RechnungScreen.js"),
      "utf8"
    );
    assert.match(source, /editboxLocked = booked \|\| this\.current\?\.order_binding_state === "BOUND"/);
    assert.match(source, /!this\._isFreeDraft\(\)/);
  });

  await run("Rechnung Editbox 04: Editbox-Summen nutzen vorhandene Rechnungsberechnung", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/renderer/modules/rechnungen/screens/RechnungScreen.js"),
      "utf8"
    );
    assert.match(source, /calculateInvoiceTotalsCents\(orderedPositions\)/);
    assert.match(source, /editboxNetTotal\.textContent = formatEuroCents\(totals\.net_cents\)/);
    assert.match(source, /editboxGrossTotal\.textContent = formatEuroCents\(totals\.gross_cents\)/);
  });

  await run("Rechnung Editbox 05: Leistungskatalog bleibt aus Übersicht und Kundenansicht erreichbar", () => {
    const invoiceSource = fs.readFileSync(
      path.join(process.cwd(), "src/renderer/modules/rechnungen/screens/RechnungScreen.js"),
      "utf8"
    );
    const customerSource = fs.readFileSync(
      path.join(process.cwd(), "src/renderer/modules/rechnungen/screens/CustomerManagementScreen.js"),
      "utf8"
    );
    assert.match(invoiceSource, /button\("Leistungskatalog", "rechnung\.overview\.catalog"/);
    assert.match(invoiceSource, /_openCatalogFromCustomerManagement/);
    assert.match(customerSource, /"Leistungskatalog"/);
    assert.match(customerSource, /onOpenCatalog/);
  });

  await run("Rechnung Editbox 06: UI-Vertrag kennt Editbox und Kundenaktion", () => {
    const contract = fs.readFileSync(
      path.join(process.cwd(), "src/renderer/modules/rechnungen/RechnungScreen.uiEditorContract.js"),
      "utf8"
    );
    assert.match(contract, /rechnung\.overview\.customers/);
    assert.match(contract, /rechnung\.editor\.editArea/);
    assert.match(contract, /rechnung\.editor\.positionEditor/);
    assert.match(contract, /rechnung\.editor\.editboxTotals/);
  });

  await run("Rechnung Editbox 07: kompakte Editbox-Geometrie ist vorhanden", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src/renderer/modules/rechnungen/styles/rechnungenDesign.css"),
      "utf8"
    );
    assert.match(css, /Rechnungs-Editbox: wiederhergestellte kompakte Positionsbearbeitung/);
    assert.match(css, /\.rechnung-screen__edit-area/);
    assert.match(css, /\.rechnung-live-position-editor__totals/);
    assert.match(css, /grid-template-columns:\s*minmax\(126px/);
  });
}

module.exports = { runRechnungEditboxRestoredTests };
