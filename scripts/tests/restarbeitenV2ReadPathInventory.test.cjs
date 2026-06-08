const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { isUnexpectedProtokollDiff } = require("./_diffGuardAllowances.cjs");

async function runRestarbeitenV2ReadPathInventoryTests(run) {
  const docPath = path.join(__dirname, "../../docs/RESTARBEITEN_V2_LESEWEGE_INVENTAR.md");
  const ablPath = path.join(__dirname, "../../docs/UI_EDITOR_V2_ABLAUF.md");
  const source = fs.readFileSync(docPath, "utf8");
  const abl = fs.readFileSync(ablPath, "utf8");

  assert.equal(source.includes("Dieses Dokument ist nur ein Inventar"), true);
  assert.equal(source.includes("Gefundene bestehende Lesewege"), true);
  assert.equal(source.includes("Reine Lesewege"), true);
  assert.equal(source.includes("Nicht geeignete Wege"), true);
  assert.equal(source.includes("Kandidaten fuer M16.9"), true);
  assert.equal(source.includes("Grenze fuer spaetere Anbindung"), true);
  assert.equal(source.includes("NO-GO-Regeln"), true);
  assert.equal(source.includes("RestarbeitenV2LegacyReadBridge"), true);
  assert.equal(source.includes("ReadOnly-Adapter"), true);
  assert.equal(source.includes("Mapper"), true);
  assert.equal(source.includes("Keine Schreibfunktion in der ReadOnly-Kette"), true);

  assert.equal(abl.includes("M16.7: Restarbeiten V2 Legacy-Lese-Bridge vorbereiten"), true);
  assert.equal(abl.includes("M16.8: Restarbeiten V2 bestehende Lesewege inventarisieren"), true);

  const diffFiles = execFileSync("git", ["diff", "--name-only", "--", "docs/RESTARBEITEN_V2_LESEWEGE_INVENTAR.md", "docs/UI_EDITOR_V2_ABLAUF.md", "scripts/test.cjs", "scripts/tests/restarbeitenV2ReadPathInventory.test.cjs"], {
    cwd: path.join(__dirname, "../.."),
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  assert.equal(diffFiles.some((file) => file.startsWith("src/main/")), false);
  assert.equal(diffFiles.some(isUnexpectedProtokollDiff), false);

  if (run) {
    run("Restarbeiten V2 Lesewege-Inventar ist dokumentiert", () => undefined);
  }
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

  runRestarbeitenV2ReadPathInventoryTests(run).then(() => {
    if (!process.exitCode) console.log("restarbeitenV2ReadPathInventory.test.cjs passed");
  });
}

module.exports = { runRestarbeitenV2ReadPathInventoryTests };
