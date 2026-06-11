const fs = require("node:fs");
const path = require("node:path");

const STANDARD_ROOT = path.resolve("C:\\01_Projekte");
const EXPECTED_DEPENDENCY = "file:../UI-Editor-kit";
const KIT_REPO_RELATIVE = "..\\UI-Editor-kit";
const PREVIEW_RUNTIME_ESM = path.join("src", "runtime", "preview", "index.mjs");
const PREVIEW_RUNTIME_CJS = path.join("src", "runtime", "preview", "index.cjs");

const repoRoot = path.resolve(__dirname, "..");
const kitRepoRoot = path.resolve(repoRoot, "..", "UI-Editor-kit");
const installedKitRoot = path.resolve(repoRoot, "node_modules", "ui-editor-kit");

let hasError = false;

function normalizeCase(value) {
  return String(value || "").toLowerCase();
}

function toDisplayPath(value) {
  return path.normalize(value);
}

function fail(message) {
  hasError = true;
  console.error(`FEHLER: ${message}`);
}

function warn(message) {
  console.warn(`HINWEIS: ${message}`);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

function assertFile(filePath, missingMessage) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    fail(missingMessage);
    return;
  }
  ok(`${toDisplayPath(filePath)} gefunden.`);
}

function assertDirectory(directoryPath, missingMessage) {
  if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
    fail(missingMessage);
    return;
  }
  ok(`${toDisplayPath(directoryPath)} gefunden.`);
}

function readJson(filePath, missingMessage, invalidMessage) {
  if (!fs.existsSync(filePath)) {
    fail(missingMessage);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${invalidMessage}: ${error?.message || error}`);
    return null;
  }
}

function checkRepoRoot() {
  const normalizedRepoRoot = normalizeCase(repoRoot);
  const normalizedStandardRoot = normalizeCase(STANDARD_ROOT);

  if (!normalizedRepoRoot.startsWith(`${normalizedStandardRoot}${path.sep.toLowerCase()}`)) {
    warn(`Dieses Repo liegt nicht unter ${toDisplayPath(STANDARD_ROOT)}.`);
    warn("Bitte beide Repos unter C:\\01_Projekte ablegen, wenn der Standard-Bezugsweg genutzt werden soll.");
    return;
  }

  ok(`Repo liegt unter ${toDisplayPath(STANDARD_ROOT)}.`);
}

function checkSourceKitRepo() {
  assertDirectory(kitRepoRoot, "UI-Editor-kit-Repo fehlt neben diesem Repo. Bitte beide Repos unter C:\\01_Projekte ablegen.");
  assertFile(path.join(kitRepoRoot, "package.json"), "UI-Editor-kit/package.json fehlt neben diesem Repo.");
  assertFile(
    path.join(kitRepoRoot, PREVIEW_RUNTIME_ESM),
    "Preview-Runtime-Export im Kit fehlt: src/runtime/preview/index.mjs."
  );
  assertFile(
    path.join(kitRepoRoot, PREVIEW_RUNTIME_CJS),
    "Preview-Runtime-Export im Kit fehlt: src/runtime/preview/index.cjs."
  );
}

function checkPackageDependency() {
  const packageJsonPath = path.join(repoRoot, "package.json");
  const packageJson = readJson(
    packageJsonPath,
    "BBM-package.json fehlt.",
    "BBM-package.json konnte nicht gelesen werden"
  );

  if (!packageJson) return;

  const dependencyValue = packageJson.dependencies?.["ui-editor-kit"];
  if (dependencyValue !== EXPECTED_DEPENDENCY) {
    fail(
      `package.json enthaelt nicht \"ui-editor-kit\": \"${EXPECTED_DEPENDENCY}\". ` +
        `Bitte npm install ${KIT_REPO_RELATIVE} --save ausfuehren.`
    );
    return;
  }

  ok(`package.json enthaelt \"ui-editor-kit\": \"${EXPECTED_DEPENDENCY}\".`);
}

function checkInstalledKit() {
  assertFile(
    path.join(installedKitRoot, "package.json"),
    "node_modules/ui-editor-kit/package.json fehlt. Bitte npm install ..\\UI-Editor-kit --save ausfuehren."
  );
  assertFile(
    path.join(installedKitRoot, PREVIEW_RUNTIME_ESM),
    "Installierter Preview-Runtime-Export fehlt: node_modules/ui-editor-kit/src/runtime/preview/index.mjs."
  );
  assertFile(
    path.join(installedKitRoot, PREVIEW_RUNTIME_CJS),
    "Installierter Preview-Runtime-Export fehlt: node_modules/ui-editor-kit/src/runtime/preview/index.cjs."
  );
}

function main() {
  console.log("Pruefe lokalen UI-Editor-kit-Bezug...");
  checkRepoRoot();
  checkSourceKitRepo();
  checkPackageDependency();
  checkInstalledKit();

  if (hasError) {
    console.error("Lokaler UI-Editor-kit-Bezug ist nicht vollstaendig eingerichtet.");
    process.exitCode = 1;
    return;
  }

  console.log("Lokaler UI-Editor-kit-Bezug ist korrekt eingerichtet.");
}

main();
