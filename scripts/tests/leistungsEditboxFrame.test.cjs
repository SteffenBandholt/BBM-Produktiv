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
  assert.match(decimal, /minPlaces = 0/);
  assert.match(decimal, /maxPlaces = 4/);

  assert.match(header, /this\.leftHost/);
  assert.match(header, /this\.centerHost/);
  assert.match(header, /this\.rightHost/);
  assert.match(action, /createElement\("button"\)/);
  assert.match(layout, /class LeistungsEditboxRow/);
  assert.match(layout, /class LeistungsEditboxGroup/);
  assert.match(layout, /gridTemplateColumns/);

  const neutralFiles = [frame, field, decimal, header, action, layout];
  for (const source of neutralFiles) {
    for (const forbidden of ["rechnung", "angebot", "kalkulation", "protokoll", "restarbeiten", "mwst", "menge", "preis", "status", "flags"]) {
      assert.equal(source.toLowerCase().includes(forbidden), false, `fachlicher Begriff im neutralen Core: ${forbidden}`);
    }
  }

  assert.match(adapter, /class LeistungspositionEditboxAdapter/);
  for (const label of ["Pos.-Nr.", "Kurztext", "Langtext", "Typ", "Zuordnung", "Menge", "Einheit", "Einzelpreis", "Brutto", "NEP"]) {
    assert.match(adapter, new RegExp(`label: "${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
  for (const typeLabel of ["Standard", "Alternative", "Hinweis", "Text"]) {
    assert.match(adapter, new RegExp(`label: "${typeLabel}"`));
  }
  assert.match(adapter, /normalizeAlternativeSuffix/);
  assert.match(adapter, /alternativeDisplayNumber/);
  assert.match(adapter, /Alternativposition zu Pos\./);
  assert.match(adapter, /fields\.positionNumber\.getControl\(\)\.readOnly = true/);
  assert.match(adapter, /new LeistungsEditboxDecimalControl/);
  assert.match(adapter, /quantityDecimalPlaces \?\? 2/);
  assert.match(adapter, /minPlaces: 0/);
  assert.match(adapter, /maxPlaces: 4/);
  assert.match(adapter, /formatQuantity\(\)/);
  assert.match(adapter, /Intl\.NumberFormat\("de-DE"/);
  assert.match(adapter, /quantityDecimalPlaces:/);
  assert.match(adapter, /alternativeOf:/);
  assert.match(adapter, /alternativeSuffix:/);
  assert.match(adapter, /showGross = false/);
  assert.match(adapter, /showNep = false/);

  assert.doesNotMatch(styles, /\bmin-(?:width|height)\s*:/i);
  assert.doesNotMatch(styles, /\bmax-(?:width|height)\s*:/i);
  assert.doesNotMatch(styles, /\bclamp\s*\(/i);
  assert.match(styles, /bbm-leistungseditbox-field--toggle/);
  assert.match(styles, /bbm-leistungseditbox-decimal/);
  assert.match(styles, /border-radius: 999px/);

  assert.match(preview, /PREVIEW_FRAME_ID = "leistungseditbox\.preview\.frame"/);
  assert.match(preview, /position: "absolute"/);
  assert.match(preview, /measure\(\)/);

  assert.match(previewScreen, /LeistungsEditbox · Baustein I/);
  assert.match(previewScreen, /quantityDecimalPlaces: 2/);
  assert.match(previewScreen, /new LeistungspositionEditboxAdapter/);
  assert.match(previewScreen, /basePositionNumber: "21"/);
  assert.match(previewScreen, /type: "alternative"/);
  assert.match(previewScreen, /showGross: true/);
  assert.match(previewScreen, /showNep: true/);

  assert.match(demo, /createLeistungsEditboxPreview/);
  assert.match(demo, /leistungsEditboxPreview\.root/);

  console.log("TESTS OK: LeistungsEditbox Baustein I zeigt die Mengenpräzision als kompaktes Formatbild 0/0,0/0,00/0,000/0,0000 und formatiert die Menge unmittelbar passend dazu.");
}

main();
