const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function walkFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(fullPath));
    else files.push(fullPath);
  }
  return files;
}

async function runRestarbeitenPreviewArtifactTests(run) {
  const repositoryRoot = path.join(__dirname, "../..");
  const removedPath = path.join(
    repositoryRoot,
    "src/renderer/modules/restarbeiten/RestarbeitenOutputPreview.js"
  );

  await run("Restarbeiten Preview-Artefakt: historische Datei ist entfernt", () => {
    assert.equal(fs.existsSync(removedPath), false);
  });

  await run("Restarbeiten Preview-Artefakt: kein Code referenziert die entfernte Datei", () => {
    const references = walkFiles(path.join(repositoryRoot, "src"))
      .filter((file) => /\.(?:c?js|mjs)$/u.test(file))
      .filter((file) => fs.readFileSync(file, "utf8").includes("RestarbeitenOutputPreview"));
    assert.deepEqual(references, []);
  });

  await run("Restarbeiten Preview-Artefakt: PDF-Vertrag dokumentiert die Entfernung", () => {
    const contract = fs.readFileSync(path.join(repositoryRoot, "docs/PDF_SATZVERTRAG_V2.md"), "utf8");
    assert.equal(contract.includes("entfernte historische HTML-Alternative"), true);
    assert.equal(contract.includes("war kein Produktweg und keine PDF-Paginierungsquelle"), true);
  });
}

module.exports = { runRestarbeitenPreviewArtifactTests };
