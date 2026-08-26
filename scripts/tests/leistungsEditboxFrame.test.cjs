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
  assert.match(frame, /replaceHeader\(\.\.\.nodes\)/);
  assert.match(frame, /replaceContent\(\.\.\.nodes\)/);

  assert.match(field, /singleline/);
  assert.match(field, /multiline/);
  assert.match(field, /select/);
  assert.match(field, /toggle/);
  assert.match(field, /control\.checked/);
  assert.match(header, /this\.leftHost/);
  assert.match(header, /this\.centerHost/);
  assert.match(header, /this\.rightHost/);
  assert.match(action, /createElement\("button"\)/);
  assert.match(layout, /class LeistungsEditboxRow/);
  assert.match(layout, /class LeistungsEditboxGroup/);
  assert.match(layout, /gridTemplateColumns/);

  const neutralFiles = [frame, field, header, action, layout];
  for (const source of neutralFiles) {
    for (const forbidden of ["rechnung", "angebot", "kalkulation", "protokoll", "restarbeiten", "mwst", "menge", "preis", "status", "flags"]) {
      assert.equal(source.toLowerCase().includes(forbidden), false, `fachlicher Begriff im neutralen Core: ${forbidden}`);
    }
  }

  assert.match(adapter, /class LeistungspositionEditboxAdapter/);
  for (const label of ["Kurztext", "Langtext", "Typ", "Menge", "Einheit", "Einzelpreis", "Brutto", "NEP"]) {
    assert.match(adapter, new RegExp(`label: "${label}"`));
  }
  assert.match(adapter, /showGross = false/);
  assert.match(adapter, /showNep = false/);
  assert.match(adapter, /kind: "toggle"/);
  assert.match(adapter, /getValues\(\)/);
  assert.match(adapter, /shortText:/);
  assert.match(adapter, /longText:/);
  assert.match(adapter, /quantity:/);
  assert.match(adapter, /unitPrice:/);
  assert.match(adapter, /gross:/);
  assert.match(adapter, /nep:/);

  assert.doesNotMatch(styles, /\bmin-(?:width|height)\s*:/i);
  assert.doesNotMatch(styles, /\bmax-(?:width|height)\s*:/i);
  assert.doesNotMatch(styles, /\bclamp\s*\(/i);
  assert.match(styles, /bbm-leistungseditbox-field--toggle/);

  assert.match(preview, /PREVIEW_FRAME_ID = "leistungseditbox\.preview\.frame"/);
  assert.match(preview, /position: "absolute"/);
  assert.match(preview, /measure\(\)/);

  assert.match(previewScreen, /LeistungsEditbox · Baustein G/);
  assert.match(previewScreen, /new LeistungspositionEditboxAdapter/);
  assert.match(previewScreen, /showGross: true/);
  assert.match(previewScreen, /showNep: true/);
  assert.match(previewScreen, /Leistungsposition bearbeiten/);
  assert.match(previewScreen, /frame\.replaceContent\(adapter\.getElement\(\)\)/);

  assert.match(demo, /createLeistungsEditboxPreview/);
  assert.match(demo, /leistungsEditboxPreview\.root/);

  console.log("TESTS OK: LeistungsEditbox Baustein G ergänzt optionale Brutto- und NEP-Merkmale über neutrale Toggle-Felder; der neutrale Core bleibt fachfrei.");
}

main();
