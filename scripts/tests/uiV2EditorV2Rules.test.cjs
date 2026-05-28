const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

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

function assertContainsAny(source, relPath, options) {
  assert.equal(
    options.some((snippet) => source.includes(snippet)),
    true,
    `expected ${path.basename(relPath)} to contain one of: ${options.join(" | ")}`
  );
}

async function runUiV2EditorV2RulesTests(run) {
  const architecturePath = "docs/UI_V2_GRUNDARCHITEKTUR.md";
  const rulesPath = "docs/UI_EDITOR_V2_REGELN.md";
  const flowPath = "docs/UI_EDITOR_V2_ABLAUF.md";

  const architecture = readDoc(architecturePath);
  const rules = readDoc(rulesPath);
  const flow = readDoc(flowPath);

  assert.equal(fs.existsSync(architecturePath), true);
  assert.equal(fs.existsSync(rulesPath), true);
  assert.equal(fs.existsSync(flowPath), true);

  assertContainsAll(architecture, architecturePath, [
    "Header",
    "Quicklane",
    "Main",
    "Footer",
    "Workbench",
    "rechts senkrecht",
    "Vorhaengeschloss",
    "Vorhängeschloss",
    "Main = Uebersicht / Auswahl",
    "Footer = Bearbeitung / Details",
    "maximale UI-Tiefe",
    "Ebene 1",
    "Ebene 2",
    "Ebene 3",
    "Ebene 4",
    "maximal 6 Gruppen",
    "frame",
    "field",
    "control",
    "Noto Sans",
    "11 px",
    "12 px",
    "14 px",
    "16 px",
    "18 px",
    "20 px",
    "300",
    "400",
    "600",
    "700",
    "Farbrollen",
    "Text normal",
    "Akzent",
    "Warnung",
    "Fehler",
    "Erfolg",
    "Info",
    "margin",
    "padding",
    "0 / 2 / 4 / 6 / 8 / 10 / 12 / 16 / 20 / 24 px",
    "UI-V2-Standardlayout",
    "Modul-Layouts",
    "Benutzerlayouts",
  ]);

  assertContainsAll(rules, rulesPath, [
    "Editor V2 ist ein eigenes System",
    "Registry",
    "id",
    "label",
    "kind",
    "parentId",
    "editable",
    "ops",
    "move",
    "resize",
    "hide",
    "Eine Auswahl = genau ein Element",
    "Eine Änderung = nur dieses Element",
    "Keine Bearbeitung ohne vorherige Auswahl",
    "Vorschau",
    "Abbrechen",
    "Übernehmen",
    "Speichern",
    "Rückgängig",
    "Wiederholen",
    "mindestens 20 Schritte",
    "PDF",
    "Druck",
    "Bildschirm-UI",
    "Standardlayout",
    "keine DOM-Raterei",
    "keine UI-spezifischen Editor-Sonderfälle",
  ]);

  assertContainsAll(flow, flowPath, [
    "M14.0a",
    "M14.0b",
    "EditorLab",
    "Hover",
    "Markierung",
    "Klickauswahl",
    "temporäres Verschieben",
    "Größe",
    "Registry-Schnittstelle",
    "Restarbeiten V2",
    "Protokoll bleibt unberührt",
    "Tests reichen nicht allein",
    "echte App-Sichtprüfung",
    "kein Commit bei sichtbarem No-Go",
    "kleine Pakete",
    "ein Paket = ein Ziel",
  ]);

  await run("UI-V2 / Editor-V2 Grundregeln sind als Doku vorhanden", () => undefined);
}

if (require.main === module) {
  const run = async (name, fn) => {
    try {
      const out = fn();
      if (out && typeof out.then === "function") {
        await out;
      }
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
      process.exitCode = 1;
    }
  };

  runUiV2EditorV2RulesTests(run).then(() => {
    if (!process.exitCode) {
      console.log("uiV2EditorV2Rules.test.cjs passed");
    }
  });
}

module.exports = { runUiV2EditorV2RulesTests };
