"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function main() {
  const frame = read("src/renderer/core/leistungseditbox/LeistungsEditboxFrame.js");
  const field = read("src/renderer/core/leistungseditbox/LeistungsEditboxField.js");
  const decimal = read("src/renderer/core/leistungseditbox/LeistungsEditboxDecimalControl.js");
  const header = read("src/renderer/core/leistungseditbox/LeistungsEditboxHeader.js");
  const action = read("src/renderer/core/leistungseditbox/LeistungsEditboxAction.js");
  const layout = read("src/renderer/core/leistungseditbox/LeistungsEditboxLayout.js");
  const adapter = read("src/renderer/shared/leistungsposition/LeistungspositionEditboxAdapter.js");
  const headerAdapter = read("src/renderer/shared/leistungsposition/LeistungspositionEditboxHeaderAdapter.js");
  const preview = read("src/renderer/core/leistungseditbox/LeistungsEditboxPreview.js");
  const previewScreen = read("src/renderer/core/leistungseditbox/LeistungsEditboxPreviewScreen.js");
  const styles = read("src/renderer/core/leistungseditbox/leistungseditbox.css");
  const demo = read("src/renderer/uiEditor/demo/BbmUiEditorDemoScreen.js");

  assert.match(frame, /data-ui-editor-kind", "frame"/);
  assert.match(frame, /data-ui-editor-editable", "true"/);
  assert.match(frame, /inspect,move,resizeWidth,resizeHeight/);
  assert.match(frame, /this\.headerHost/);
  assert.match(frame, /this\.contentHost/);

  assert.match(field, /singleline/);
  assert.match(field, /multiline/);
  assert.match(field, /select/);
  assert.match(field, /toggle/);
  assert.match(decimal, /class LeistungsEditboxDecimalControl/);
  assert.match(decimal, /patternForPlaces/);
  assert.match(decimal, /"0"\.repeat\(places\)/);
  assert.match(decimal, /Weniger Nachkommastellen/);
  assert.match(decimal, /Mehr Nachkommastellen/);

  assert.match(header, /this\.leftHost/);
  assert.match(header, /this\.centerHost/);
  assert.match(header, /this\.rightHost/);
  assert.match(action, /createElement\("button"\)/);
  assert.match(layout, /class LeistungsEditboxRow/);
  assert.match(layout, /class LeistungsEditboxGroup/);

  const neutralFiles = [frame, field, decimal, header, action, layout];
  for (const source of neutralFiles) {
    for (const forbidden of ["rechnung", "angebot", "kalkulation", "protokoll", "restarbeiten", "mwst", "menge", "preis", "status", "flags"]) {
      assert.equal(source.toLowerCase().includes(forbidden), false, `fachlicher Begriff im neutralen Core: ${forbidden}`);
    }
  }

  assert.match(adapter, /class LeistungspositionEditboxAdapter/);
  for (const label of ["Pos.-Nr.", "Kurztext", "Langtext", "Typ", "Zuordnung", "Menge", "Einheit", "Einzelpreis", "Positionsbetrag", "Brutto", "NEP"]) {
    assert.match(adapter, new RegExp(`label: "${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
  assert.doesNotMatch(adapter, /Langtext anzeigen/);
  assert.doesNotMatch(adapter, /showLongText/);
  assert.doesNotMatch(adapter, /updateLongTextPresentation/);
  assert.match(adapter, /const PRICED_TYPES = new Set\(\["standard", "alternative"\]\)/);
  assert.match(adapter, /this\.detailRow\.getElement\(\)\.hidden = !isPriced/);
  assert.match(adapter, /normalizeAlternativeSuffix/);
  assert.match(adapter, /alternativeDisplayNumber/);
  assert.match(adapter, /new LeistungsEditboxDecimalControl/);
  assert.match(adapter, /formatQuantity\(\)/);
  assert.match(adapter, /formatUnitPrice\(\)/);
  assert.match(adapter, /formatPositionAmount/);
  assert.match(adapter, /showPositionAmount = false/);
  assert.doesNotMatch(adapter, /minmax\((?:90|110|140|150)px/);

  assert.match(headerAdapter, /class LeistungspositionEditboxHeaderAdapter/);
  for (const label of ["+ Titel", "+ Position", "Schieben", "Löschen"]) {
    assert.match(headerAdapter, new RegExp(`label: "${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
  assert.match(headerAdapter, /onAddTitle/);
  assert.match(headerAdapter, /onAddPosition/);
  assert.match(headerAdapter, /onMove/);
  assert.match(headerAdapter, /onDelete/);
  assert.match(headerAdapter, /left:/);
  assert.match(headerAdapter, /center:/);
  assert.match(headerAdapter, /right:/);

  assert.doesNotMatch(styles, /\bmin-(?:width|height)\s*:/i);
  assert.doesNotMatch(styles, /\bmax-(?:width|height)\s*:/i);
  assert.doesNotMatch(styles, /\bclamp\s*\(/i);
  assert.match(styles, /bbm-leistungseditbox-decimal__step:focus-visible/);

  assert.match(preview, /PREVIEW_FRAME_ID = "leistungseditbox\.preview\.frame"/);
  assert.match(preview, /position: "absolute"/);
  assert.match(preview, /measure\(\)/);

  assert.match(previewScreen, /LeistungsEditbox · Baustein N/);
  assert.match(previewScreen, /Fachliche Kopfaktionen als wiederverwendbare Callbacks/);
  assert.match(previewScreen, /new LeistungspositionEditboxHeaderAdapter/);
  assert.match(previewScreen, /Kopfaktion:/);
  assert.match(previewScreen, /onAddTitle:/);
  assert.match(previewScreen, /onAddPosition:/);
  assert.match(previewScreen, /onMove:/);
  assert.match(previewScreen, /onDelete:/);
  assert.doesNotMatch(previewScreen, /showLongText:/);
  assert.match(previewScreen, /showPositionAmount: true/);

  assert.match(demo, /createLeistungsEditboxPreview/);
  assert.match(demo, /leistungsEditboxPreview\.root/);

  console.log("TESTS OK: Baustein N entfernt den positionsbezogenen Langtext-Schalter wieder und ersetzt die Platzhalter im Kopf durch + Titel, + Position, Schieben und Löschen als wiederverwendbare Callback-Aktionen.");
}

main();
