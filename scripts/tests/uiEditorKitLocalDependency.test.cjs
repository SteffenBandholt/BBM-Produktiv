const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const CHECK_SCRIPT_PATH = path.join(REPO_ROOT, "scripts", "checkUiEditorKitDependency.cjs");
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, "package.json");
const DOC_PATH = path.join(REPO_ROOT, "docs", "UI_EDITOR_KIT_LOKALER_BEZUGSWEG.md");

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

async function runUiEditorKitLocalDependencyTests(run) {
  await run("UI-Editor-kit lokaler Bezug: Checkskript existiert", () => {
    assert.equal(fs.existsSync(CHECK_SCRIPT_PATH), true);
  });

  await run("UI-Editor-kit lokaler Bezug: package.json nutzt lokale File-Dependency", () => {
    const packageJson = JSON.parse(readText(PACKAGE_JSON_PATH));
    assert.equal(packageJson.dependencies?.["ui-editor-kit"], "file:../UI-Editor-kit");
    assert.equal(packageJson.scripts?.["check:ui-editor-kit"], "node scripts/checkUiEditorKitDependency.cjs");
  });

  await run("UI-Editor-kit lokaler Bezug: Doku beschreibt Standardpfad und Konsumenten", () => {
    const doc = readText(DOC_PATH);
    assert.equal(doc.includes("C:\\01_Projekte"), true);
    assert.equal(doc.includes("npm install ..\\UI-Editor-kit --save"), true);
    assert.equal(doc.includes("\"ui-editor-kit\": \"file:../UI-Editor-kit\""), true);
    assert.equal(doc.includes("Weitere Konsumenten-Repos"), true);
    assert.equal(doc.includes("C:\\01_Projekte\\<repo-name>"), true);
  });
}

if (require.main === module) {
  let failed = false;
  const run = async (name, fn) => {
    try {
      await fn();
      console.log(`ok - ${name}`);
    } catch (error) {
      failed = true;
      console.error(`not ok - ${name}`);
      console.error(error?.stack || error?.message || error);
    }
  };

  runUiEditorKitLocalDependencyTests(run).then(() => {
    if (failed) process.exitCode = 1;
  });
}

module.exports = { runUiEditorKitLocalDependencyTests };
