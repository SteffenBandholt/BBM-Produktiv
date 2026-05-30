const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

function readDoc(relPath) {
  const absPath = path.join(process.cwd(), relPath);
  assert.equal(fs.existsSync(absPath), true, `missing doc file: ${relPath}`);
  return fs.readFileSync(absPath, "utf8");
}

function assertContainsAll(source, relPath, snippets) {
  for (const snippet of snippets) {
    assert.equal(
      source.includes(snippet),
      true,
      `expected ${path.basename(relPath)} to contain: ${snippet}`
    );
  }
}

async function runRestarbeitenV2RegistryRulesTests(run) {
  const conceptPath = "docs/RESTARBEITEN_V2_KONZEPT.md";
  const registryPath = "docs/RESTARBEITEN_V2_REGISTRY.md";
  const modulePath = "docs/UI_EDITOR_V2_MODUL.md";
  const rulesPath = "docs/UI_EDITOR_V2_REGELN.md";
  const zielvertragPath = "docs/RESTARBEITEN_V2_UI_EDITOR_ZIELVERTRAG_PRUEFUNG.md";
  const flowPath = "docs/UI_EDITOR_V2_ABLAUF.md";
  const statusPath = "STATUS.md";

  const concept = readDoc(conceptPath);
  const registry = readDoc(registryPath);
  const moduleDoc = readDoc(modulePath);
  const rules = readDoc(rulesPath);
  const zielvertrag = readDoc(zielvertragPath);
  const flow = readDoc(flowPath);
  const status = readDoc(statusPath);

  assert.equal(fs.existsSync(conceptPath), true);
  assert.equal(fs.existsSync(registryPath), true);
  assert.equal(fs.existsSync(modulePath), true);
  assert.equal(fs.existsSync(rulesPath), true);
  assert.equal(fs.existsSync(zielvertragPath), true);
  assert.equal(fs.existsSync(flowPath), true);
  assert.equal(fs.existsSync(statusPath), true);

  assertContainsAll(concept, conceptPath, [
    "Restarbeiten V2",
    "Header",
    "Quicklane",
    "Main",
    "Footer",
    "Workbench",
    "Uebersicht / Auswahl",
    "Bearbeitung / Details",
    "unten angedockt",
    "hoehenveraenderbar",
    "höhenveränderbar",
    "einklappbar",
    "maximale Tiefe",
    "maximal 6 Gruppen",
    "Editor V2",
    "Registry",
    "Protokoll bleibt unberuehrt",
    "alte Restarbeiten-UI dient hoechstens fachlich als Orientierung",
    "Restarbeiten V2 nutzt den Editor V2 nur ueber Registry",
  ]);

  assertContainsAll(registry, registryPath, [
    "restarbeitenV2.root",
    "restarbeitenV2.header",
    "restarbeitenV2.header.context",
    "restarbeitenV2.header.status",
    "restarbeitenV2.header.filter",
    "restarbeitenV2.quicklane",
    "restarbeitenV2.quicklane.lock",
    "restarbeitenV2.quicklane.neu",
    "restarbeitenV2.quicklane.filterOffen",
    "restarbeitenV2.quicklane.filterErledigt",
    "restarbeitenV2.quicklane.filterAlle",
    "restarbeitenV2.quicklane.foto",
    "restarbeitenV2.quicklane.diktat",
    "restarbeitenV2.main",
    "restarbeitenV2.main.liste",
    "restarbeitenV2.main.nummer",
    "restarbeitenV2.main.textbereich",
    "restarbeitenV2.main.verortung",
    "restarbeitenV2.main.meta",
    "restarbeitenV2.footer",
    "restarbeitenV2.footer.kurztext",
    "restarbeitenV2.footer.langtext",
    "restarbeitenV2.footer.verortung",
    "restarbeitenV2.footer.meta",
    "restarbeitenV2.footer.fotos",
    "restarbeitenV2.footer.notiz",
    "id",
    "label",
    "kind",
    "parentId",
    "editable",
    "ops",
    "selector",
    "frame",
    "field",
    "control",
    "move",
    "resize",
    "hide",
    "minWidth",
    "minHeight",
    "gridEditable",
    "keine alten `data-ui-inspector-id` uebernehmen",
    "keine Restarbeiten-Sonderlogik im Editor",
    "keine Verschachtelung tiefer als 4 Ebenen",
    "alle Parent-IDs muessen existieren",
  ]);

  assertContainsAll(moduleDoc, modulePath, [
    "eigenstaendiges internes UI-Editor-Modul",
    "fachneutral",
    "kennt keine Fachmodule",
    "kennt keine Restarbeiten-Sonderfaelle",
    "kennt keine Protokoll-Sonderfaelle",
    "arbeitet ausschliesslich ueber Registry",
    "Fachmodule liefern Registry-Daten",
    "EditorLab ist nur Testflaeche",
    "Imports aus Restarbeiten / Protokoll / anderen Fachmodulen in `editorV2` sind verboten",
  ]);

  assertContainsAll(rules, rulesPath, [
    "Editor V2 ist ein eigenes System",
    "fachneutral",
    "Registry",
    "Fachmodule nutzen Editor V2 nur ueber Registry",
    "Editor V2 bleibt fachneutral",
    "Fachimports in Editor V2 sind verboten",
    "Rueckgaengig und Wiederholen sind als optionale Komfortfunktion geparkt",
  ]);

  assertContainsAll(zielvertrag, zielvertragPath, [
    "M19.7 Technische Zielrichtung fuer spaetere Registry-Bereinigung",
    "M19.8: Registry-Kategorien technisch vorbereiten und Doku-Guardrail absichern",
    "`restarbeitenV2.quicklane.neu` | gehoert spaeter in separaten Fachmodus",
    "Foto/Upload bleibt keine Editor-Aktion.",
    "Diktat bleibt keine Editor-Aktion.",
    "Editor darf Darstellung aendern, aber keine Fachdaten.",
    "Footer-Eingaben werden spaeter entweder reine Anzeigeelemente oder in separaten Fachmodus verschoben.",
  ]);

  assertContainsAll(flow, flowPath, [
    "M19.8",
    "sichert die Registry-Kategorien aus M19.7 test-/dokumentationsseitig ab",
    "Keine Aktivierung.",
    "Keine Implementierung.",
    "Kein Fachaktions-Fix.",
  ]);

  assertContainsAll(status, statusPath, [
    "M19.8 Registry-Kategorien test-/dokumentationsseitig abgesichert",
    "Keine Produktivaktivierung.",
    "Kein Code-Umbau.",
    "Kein Button-Fix.",
  ]);

  const diffFiles = execFileSync("git", ["diff", "--name-only"], {
    cwd: path.join(__dirname, "../.."),
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/restarbeiten/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/protokoll/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);

  await run("Restarbeiten-V2 Registry-Regeln sind dokumentiert und kompatibel", () => undefined);
}

if (require.main === module) {
  const run = async (name, fn) => {
    try {
      const out = fn();
      if (out && typeof out.then === "function") await out;
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
      process.exitCode = 1;
    }
  };

  runRestarbeitenV2RegistryRulesTests(run).then(() => {
    if (!process.exitCode) console.log("restarbeitenV2RegistryRules.test.cjs passed");
  });
}

module.exports = { runRestarbeitenV2RegistryRulesTests };
