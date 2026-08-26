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
  const preview = read("src/renderer/core/leistungseditbox/LeistungsEditboxPreview.js");
  const previewScreen = read("src/renderer/core/leistungseditbox/LeistungsEditboxPreviewScreen.js");
  const styles = read("src/renderer/core/leistungseditbox/leistungseditbox.css");
  const demo = read("src/renderer/uiEditor/demo/BbmUiEditorDemoScreen.js");

  assert.match(frame, /data-ui-editor-kind", "frame"/);
  assert.match(frame, /data-ui-editor-editable", "true"/);
  assert.match(frame, /inspect,move,resizeWidth,resizeHeight/);
  assert.match(frame, /ensureLeistungsEditboxStyles\(doc\)/);
  assert.match(frame, /this\.headerHost/);
  assert.match(frame, /this\.contentHost/);
  assert.match(frame, /getHeaderHost\(\)/);
  assert.match(frame, /getContentHost\(\)/);
  assert.match(frame, /replaceHeader\(\.\.\.nodes\)/);
  assert.match(frame, /replaceContent\(\.\.\.nodes\)/);

  for (const forbidden of ["rechnung", "angebot", "kalkulation", "protokoll", "restarbeiten", "mwst", "menge", "preis", "status", "flags"]) {
    assert.equal(frame.toLowerCase().includes(forbidden), false, `fachlicher Begriff im neutralen Frame: ${forbidden}`);
  }

  assert.doesNotMatch(styles, /\bmin-(?:width|height)\s*:/i);
  assert.doesNotMatch(styles, /\bmax-(?:width|height)\s*:/i);
  assert.doesNotMatch(styles, /\bclamp\s*\(/i);
  assert.match(styles, /bbm-leistungseditbox-frame__header/);
  assert.match(styles, /bbm-leistungseditbox-frame__content/);

  assert.match(preview, /PREVIEW_FRAME_ID = "leistungseditbox\.preview\.frame"/);
  assert.match(preview, /width: "520px"/);
  assert.match(preview, /height: "180px"/);
  assert.match(preview, /position: "absolute"/);
  assert.match(preview, /measure\(\)/);

  assert.match(previewScreen, /LeistungsEditbox · Baustein B/);
  assert.match(previewScreen, /frame\.replaceHeader\(header\)/);
  assert.match(previewScreen, /frame\.replaceContent\(content\)/);

  assert.match(demo, /createLeistungsEditboxPreview/);
  assert.match(demo, /leistungsEditboxPreview\.root/);

  console.log("TESTS OK: LeistungsEditbox Baustein B besitzt fachneutralen Kopf- und Inhaltsbereich; der äußere Rahmen bleibt editorfähig und unbeschränkt.");
}

main();
