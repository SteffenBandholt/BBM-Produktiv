const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.join(__dirname, "../..");

function read(file) { return fs.readFileSync(path.join(REPO_ROOT, file), "utf8"); }
function exists(file) { return fs.existsSync(path.join(REPO_ROOT, file)); }
function listFiles(dir) {
  const root = path.join(REPO_ROOT, dir);
  const out = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    if (entry.isDirectory()) out.push(...listFiles(rel));
    else out.push(rel.replace(/\\/g, "/"));
  }
  return out;
}

function productionUiEditorText() {
  return listFiles("src/renderer/ui-editor").filter((file) => file.endsWith(".js")).map(read).join("\n");
}

async function runM62BbmSelectionLegacyCleanupTests(run) {
  await run("M62 Legacy-Dateien der alten BBM-Auswahlruntime sind geloescht", () => {
    assert.equal(exists("src/renderer/ui-editor/bbmUiElementSelection.js"), false);
    assert.equal(exists("src/renderer/ui-editor/bbmUiSelectionOverlay.js"), false);
    assert.equal(exists("src/renderer/ui-editor/bbmUiSelectedOverlay.js"), false);
  });

  await run("M62 Produktivcode importiert keine alte BBM-Auswahlruntime und enthaelt nur Kit-Controller", () => {
    const panel = read("src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
    assert.match(panel, /createBbmKitSelectionHost/);
    assert.match(panel, /createSelectionController/);
    assert.match(panel, /selection-runtime\.browser\.mjs/);
    assert.match(panel, /selectionRuntimeLabel\(\)\s*{\s*return "UI-Editor-kit";/);
    assert.doesNotMatch(panel, /switchSelectionRuntime|bbmSelectionController|createBbmUiElementSelectionController|createBbmUiSelectedOverlay|selectedOverlay|syncSelectedOverlay|syncHoverWithSelection/);
    const combined = productionUiEditorText();
    assert.doesNotMatch(combined, /data-bbm-ui-selection-hover-frame|data-bbm-ui-selected-frame/);
  });

  await run("M62 Tests pruefen M55/M56-Vertraege ueber Kit-Bridge statt Legacy-Module", () => {
    const m55 = read("scripts/tests/m55UiElementSelection.test.cjs");
    const m56 = read("scripts/tests/m56PersistentSelectionFrame.test.cjs");
    assert.match(m55, /createBbmKitSelectionHost/);
    assert.match(m56, /createFakeKitSelectionController/);
    assert.doesNotMatch(m55 + m56, /importEsmFromFile\([^\n]+bbmUiElementSelection|importEsmFromFile\([^\n]+bbmUiSelectedOverlay|data-bbm-ui-selection-hover-frame|data-bbm-ui-selected-frame/);
  });

  await run("M62 Sicherheit: keine verbotene DOM-Suche, neue Registry, neue Auswahlhaltung oder Persistenz", () => {
    const combined = [
      "src/renderer/ui-editor/BbmUiEditorStatusPanel.js",
      "src/renderer/ui-editor/bbmKitSelectionHost.js",
      "src/renderer/ui-editor/bbmUiElementRefs.js",
    ].map(read).join("\n");
    for (const forbidden of ["querySelector", "querySelectorAll", "getElementById", "getElementsBy", ".closest", ".matches", "MutationObserver", "elementFromPoint", "elementsFromPoint", "localStorage", "ipcRenderer"]) {
      assert.equal(combined.includes(forbidden), false, `${forbidden} darf in M62 nicht vorkommen`);
    }
    assert.doesNotMatch(combined, /new Map\(\).*selected|selectedElementId\s*=|BBM_UI_ELEMENTS\s*=/s);
  });
}

module.exports = { runM62BbmSelectionLegacyCleanupTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, fn) => { try { await fn(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM62BbmSelectionLegacyCleanupTests(run).then(() => { if (failed) process.exitCode = 1; });
}
