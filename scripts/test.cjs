const assert = require("node:assert/strict");
const path = require("node:path");
const { findTestGroup } = require("./testGroups.cjs");

let failed = false;
let peakHeapUsed = 0;
let peakRss = 0;

function recordMemory() {
  const memory = process.memoryUsage();
  peakHeapUsed = Math.max(peakHeapUsed, memory.heapUsed);
  peakRss = Math.max(peakRss, memory.rss);
}

function run(name, fn) {
  try {
    const out = fn();
    if (out && typeof out.then === "function") {
      return out
        .then(() => console.log(`ok - ${name}`))
        .catch((error) => {
          failed = true;
          console.error(`not ok - ${name}`);
          console.error(error?.stack || error?.message || error);
        })
        .finally(recordMemory);
    }
    console.log(`ok - ${name}`);
  } catch (error) {
    failed = true;
    console.error(`not ok - ${name}`);
    console.error(error?.stack || error?.message || error);
  }
  recordMemory();
  return Promise.resolve();
}

async function runStoragePathTests() {
  const {
    sanitizeDirName,
    resolveProjectFolderName,
    buildStoragePreviewPaths,
  } = require("../src/main/ipc/projectStoragePaths");

  await run("sanitizeDirName ersetzt ungueltige Zeichen", () => {
    assert.equal(sanitizeDirName('A<B>:C"D/E\\F|G?H*'), "A_B__C_D_E_F_G_H_");
  });
  await run("resolveProjectFolderName bildet Nummer + Label", () => {
    assert.equal(resolveProjectFolderName({ project_number: "P-42", short: "Rohbau Nord" }), "P-42 - Rohbau Nord");
  });
  await run("buildStoragePreviewPaths erzeugt Zielordner", () => {
    const out = buildStoragePreviewPaths({ baseDir: "C:\\Daten", project: { project_number: "12", short: "Test" } });
    assert.equal(out.projectFolder, "12 - Test");
    assert.equal(out.protocolsDir, path.join("C:\\Daten", "bbm", "12 - Test", "Protokolle"));
    assert.equal(out.previewDir, path.join("C:\\Daten", "bbm", "12 - Test", "Vorabzug"));
    assert.equal(out.listsDir, path.join("C:\\Daten", "bbm", "12 - Test", "Listen"));
    assert.equal(out.restarbeitenDir, path.join("C:\\Daten", "bbm", "12 - Test", "Restarbeiten"));
  });
}

async function main() {
  const groupFlag = process.argv.indexOf("--group");
  const groupId = groupFlag >= 0 ? process.argv[groupFlag + 1] : "";
  const group = findTestGroup(groupId);
  if (!group) throw new Error(`Unbekannte oder fehlende Testgruppe: ${groupId || "<leer>"}`);

  console.log(`[test-group] START ${group.id} – ${group.label}`);
  recordMemory();
  if (group.includeStoragePathTests) await runStoragePathTests();
  for (const [moduleName, exportName] of group.suites) {
    const modulePath = path.resolve(__dirname, "tests", moduleName);
    const suite = require(modulePath)[exportName];
    if (typeof suite !== "function") throw new Error(`Testexport fehlt: ${moduleName}#${exportName}`);
    await suite(run);
    recordMemory();
  }

  const toMiB = (value) => (value / 1024 / 1024).toFixed(1);
  console.log(`[test-group] ENDE ${group.id} – heapMax=${toMiB(peakHeapUsed)} MiB rssMax=${toMiB(peakRss)} MiB`);
  if (failed) process.exitCode = 1;
  else console.log(`Alle Tests der Gruppe ${group.id} bestanden.`);
}

main().catch((error) => {
  process.exitCode = 1;
  console.error(error?.stack || error?.message || error);
});
