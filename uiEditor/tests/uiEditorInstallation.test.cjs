#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const TARGET_APP_ROOT = path.resolve(__dirname, "../..");

const REQUIRED_FILES = Object.freeze([
  "docs/ui-editor/EDITOR_BAUPLAN.md",
  "docs/ui-editor/UI_ELEMENT_KATALOG.md",
  "docs/ui-editor/UI_BAU_UND_PRUEFREGELN.md",
  "docs/ui-editor/ZIEL_APP_ANBINDUNG.md",
  "docs/ui-editor/UI_EDITOR_VERTRAG.md",
  "docs/ui-editor/UI_PDF_ENTWURFSENTSCHEIDUNG.md",
  "codex/AGENTS_UI_EDITOR_BLOCK.md",
  "codex/CODEX_STARTREGEL_UI_PDF.md",
  "scripts/ui-editor-contract-check.cjs",
  "uiEditor/README.md",
  "uiEditor/uiEditorRules.md",
  "uiEditor/INSTALLATION_STATUS.md",
  "uiEditor/uiEditorRegistry.js",
  "uiEditor/targetAppRegistry.js",
  "uiEditor/targetSelection.js",
  "uiEditor/targetContract.js",
  "uiEditor/uiEditorLauncherButton.js",
  "uiEditor/uiEditorLauncherButton.css",
  "uiEditor/tests/uiEditorRegistry.test.cjs",
]);

const INSTALLATION_STATUS_REQUIREMENTS = Object.freeze([
  "UI-Editor-Regelpaket installiert",
  "Nur Regelpaket und Pruefinfrastruktur installiert",
  "Keine bestehende UI analysiert",
  "Keine bestehende UI gescannt",
  "Keine automatische UI-Elementliste erzeugt",
  "Keine bestehende UI migriert",
  "Keine Ziel-App-UI geaendert",
  "Keine Elemente automatisch erkannt",
  "Keine Elemente automatisch registriert",
  "Vertragscheck vorhanden",
  "Entwurfsentscheidungspflicht aktiv",
  "Fachlogik und Fachdaten bleiben in der Ziel-App",
]);

const UI_EDITOR_RULE_REQUIREMENTS = Object.freeze([
  "Ziel-App-Regelpaket-Bootstrap",
  "Kein UI-Scan",
  "Keine automatische Bestandserkennung",
  "Keine automatische Elementerkennung",
  "Keine automatische Migration",
  "Keine automatische Freigabe",
  "explizit registrieren",
  "Fachlogik und Fachdaten bleiben in der Ziel-App",
]);

function resolveTargetPath(relativePath) {
  return path.join(TARGET_APP_ROOT, relativePath);
}

function readTargetFile(relativePath) {
  return fs.readFileSync(resolveTargetPath(relativePath), "utf8");
}

function assertFileExists(relativePath) {
  assert.equal(fs.existsSync(resolveTargetPath(relativePath)), true, "Pflichtdatei fehlt: " + relativePath);
}

function assertIncludesAll(relativePath, fragments) {
  const content = readTargetFile(relativePath);
  fragments.forEach((fragment) => {
    assert.equal(content.includes(fragment), true, relativePath + " enthaelt nicht: " + fragment);
  });
}

function assertAgentsMarkers() {
  assertFileExists("AGENTS.md");

  const content = readTargetFile("AGENTS.md");
  const startIndex = content.indexOf("<!-- UI-EDITOR-KIT:START -->");
  const endIndex = content.indexOf("<!-- UI-EDITOR-KIT:END -->");

  assert.notEqual(startIndex, -1, "AGENTS.md enthaelt den UI-Editor-Startmarker nicht.");
  assert.notEqual(endIndex, -1, "AGENTS.md enthaelt den UI-Editor-Endmarker nicht.");
  assert.equal(startIndex < endIndex, true, "AGENTS.md Marker stehen in falscher Reihenfolge.");
}

REQUIRED_FILES.forEach(assertFileExists);
assertAgentsMarkers();
assertIncludesAll("uiEditor/INSTALLATION_STATUS.md", INSTALLATION_STATUS_REQUIREMENTS);
assertIncludesAll("uiEditor/uiEditorRules.md", UI_EDITOR_RULE_REQUIREMENTS);

const targetSelection = readTargetFile("uiEditor/targetSelection.js");
const targetContract = readTargetFile("uiEditor/targetContract.js");
[
  "createTargetSelectionController",
  "createTargetSelectionPanelController",
  "DEFAULT_TARGET_ATTRIBUTE_NAME",
  "HOVERED_TARGET_ATTRIBUTE_NAME",
  "SELECTED_TARGET_ATTRIBUTE_NAME",
  "data-ui-editor-id",
  "data-ui-editor-hovered",
  "data-ui-editor-panel-collapsed",
  "data-ui-editor-panel-hidden",
  "closest",
].forEach((fragment) => {
  assert.equal(targetSelection.includes(fragment), true, "targetSelection enthaelt nicht: " + fragment);
});
[
  "validateTargetContract",
  "ERROR_CODES",
  ["D", "OM_TARGET_MISSING"].join(""),
  "PARENT_ID_UNKNOWN",
  ["D", "OM_PARENT_MISMATCH"].join(""),
  ["GROUP_WITHOUT_D", "OM_WRAPPER"].join(""),
  "FIELD_NOT_INSIDE_GROUP",
  "uiEditorTargetContractArtifact",
  "data-ui-editor-id",
].forEach((fragment) => {
  assert.equal(targetContract.includes(fragment), true, "targetContract enthaelt nicht: " + fragment);
});
[
  ["query", "SelectorAll"].join(""),
  ["local", "Storage"].join(""),
  ["session", "Storage"].join(""),
  "ipc",
  "preload",
  "sqlite",
  "postgres",
  "mysql",
  ["B", "BM"].join(""),
  ["Rest", "arbeiten"].join(""),
  ["Proto", "koll"].join(""),
].forEach((fragment) => {
  assert.equal(targetSelection.includes(fragment), false, "targetSelection enthaelt verbotenen Text: " + fragment);
  assert.equal(targetContract.includes(fragment), false, "targetContract enthaelt verbotenen Text: " + fragment);
});

console.log("TESTS OK: uiEditorInstallation");
