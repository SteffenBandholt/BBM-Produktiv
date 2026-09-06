const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
}

async function runRestarbeitenV2Revision273Tests(run) {
  const root = path.join(__dirname, "../..");
  const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

  await run("Restarbeiten V2 #273: kein produktiver Import- oder Runtime-Einstieg", () => {
    const router = read("src/renderer/app/Router.js");
    const navigation = read("src/renderer/app/modules/moduleNavigation.js");
    const v2Directory = path.join(root, "src/renderer/modules/restarbeitenV2");
    const externalImports = walkFiles(path.join(root, "src"))
      .filter((file) => /\.(?:c?js|mjs)$/u.test(file) && !file.startsWith(`${v2Directory}${path.sep}`))
      .filter((file) => /\b(?:from\s+|import\s*\(|require\s*\()\s*["'][^"']*restarbeitenV2\//u.test(fs.readFileSync(file, "utf8")));
    assert.equal(router.includes("RestarbeitenV2Screen"), false);
    assert.equal(router.includes("showRestarbeitenV2"), false);
    assert.equal(navigation.toLowerCase().includes("restarbeitenv2"), false);
    assert.deepEqual(externalImports, []);
    assert.equal(fs.existsSync(path.join(v2Directory, "RestarbeitenV2Screen.js")), false);
  });

  await run("Restarbeiten V2 #273: Bestand ist read-only klassifiziert und bleibt erhalten", () => {
    const assessment = read("docs/RESTARBEITEN_V2_REVISION_273_BEWERTUNG.md");
    assert.equal(assessment.includes("produktiv aktiv: **nein**"), true);
    assert.equal(assessment.includes("isoliert importierbar und getestet: **ja**"), true);
    assert.equal(assessment.includes("in Revision #273 zu löschen: **nein**"), true);
    assert.equal(assessment.includes("schreibend: **nein**"), true);
  });
}

module.exports = { runRestarbeitenV2Revision273Tests };
