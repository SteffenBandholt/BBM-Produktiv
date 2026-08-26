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
  assert.match(header, /this\.leftHost/);
  assert.match(header, /this\.centerHost/);
  assert.match(header, /this\.rightHost/);
  assert.match(header, /replaceLeft\(\.\.\.nodes\)/);
  assert.match(header, /replaceCenter\(\.\.\.nodes\)/);
  assert.match(header, /replaceRight\(\.\.\.nodes\)/);
  assert.match(action, /createElement\("button"\)/);
  assert.match(action, /setDisabled\(disabled\)/);

  const neutralFiles = [frame, field, header, action];
  for (const source of neutralFiles) {
    for (const forbidden of ["rechnung", "angebot", "kalkulation", "protokoll", "restarbeiten", "mwst", "menge", "preis", "status", "flags"]) {
      assert.equal(source.toLowerCase().includes(forbidden), false, `fachlicher Begriff im neutralen Core: ${forbidden}`);
    }
  }

  assert.doesNotMatch(styles, /\bmin-(?:width|height)\s*:/i);
  assert.doesNotMatch(styles, /\bmax-(?:width|height)\s*:/i);
  assert.doesNotMatch(styles, /\bclamp\s*\(/i);
  assert.match(styles, /bbm-leistungseditbox-header__group--left/);
  assert.match(styles, /bbm-leistungseditbox-header__group--center/);
  assert.match(styles, /bbm-leistungseditbox-header__group--right/);
  assert.match(styles, /bbm-leistungseditbox-action/);

  assert.match(preview, /PREVIEW_FRAME_ID = "leistungseditbox\.preview\.frame"/);
  assert.match(preview, /position: "absolute"/);
  assert.match(preview, /measure\(\)/);

  assert.match(previewScreen, /LeistungsEditbox · Baustein D/);
  assert.match(previewScreen, /new LeistungsEditboxHeader/);
  assert.match(previewScreen, /new LeistungsEditboxAction/);
  assert.match(previewScreen, /frame\.replaceHeader\(header\.getElement\(\)\)/);
  assert.match(previewScreen, /frame\.replaceContent\(content\)/);

  assert.match(demo, /createLeistungsEditboxPreview/);
  assert.match(demo, /leistungsEditboxPreview\.root/);

  console.log("TESTS OK: LeistungsEditbox Baustein D besitzt neutrale Feld-, Kopf- und Aktionsbausteine; der äußere Rahmen bleibt editorfähig und unbeschränkt.");
}

main();
