const assert = require("node:assert/strict");
const path = require("node:path");
const {
  sanitizeDirName,
  resolveProjectFolderName,
  buildStoragePreviewPaths,
} = require("../src/main/ipc/projectStoragePaths");
const { runTopsStoreTests } = require("./tests/topsStore.test.cjs");
const { runTopsSelectorsTests } = require("./tests/topsSelectors.test.cjs");
const { runTopsCommandsTests } = require("./tests/topsCommands.test.cjs");
const { runTopsActionPolicyTests } = require("./tests/topsActionPolicy.test.cjs");
const { runTopsScreenIntegrationTests } = require("./tests/topsScreen.integration.test.cjs");
const { runTopsDtosTests } = require("./tests/topsDtos.test.cjs");
const { runTopsCloseFlowTests } = require("./tests/topsCloseFlow.test.cjs");
const { runProjectsLifecycleTests } = require("./tests/projectsLifecycle.test.cjs");
const { runProtokollRouterFallbackTests } = require("./tests/protokollRouterFallback.test.cjs");

let failed = false;

function run(name, fn) {
  try {
    const out = fn();
    if (out && typeof out.then === "function") {
      return out
        .then(() => {
          console.log(`ok - ${name}`);
        })
        .catch((err) => {
          failed = true;
          console.error(`not ok - ${name}`);
          console.error(err?.stack || err?.message || err);
        });
    }
    console.log(`ok - ${name}`);
  } catch (err) {
    failed = true;
    console.error(`not ok - ${name}`);
    console.error(err?.stack || err?.message || err);
  }
  return Promise.resolve();
}

async function main() {
  await run("sanitizeDirName ersetzt ungueltige Zeichen", () => {
    const out = sanitizeDirName('A<B>:C"D/E\\F|G?H*');
    assert.equal(out, "A_B__C_D_E_F_G_H_");
  });
  
  await run("resolveProjectFolderName bildet Nummer + Label", () => {
    const out = resolveProjectFolderName({
      project_number: "P-42",
      short: "Rohbau Nord",
    });
    assert.equal(out, "P-42 - Rohbau Nord");
  });

  await run("buildStoragePreviewPaths erzeugt Zielordner", () => {
    const out = buildStoragePreviewPaths({
      baseDir: "C:\\Daten",
      project: { project_number: "12", short: "Test" },
    });
    assert.equal(out.projectFolder, "12 - Test");
    assert.equal(out.protocolsDir, path.join("C:\\Daten", "bbm", "12 - Test", "Protokolle"));
    assert.equal(out.previewDir, path.join("C:\\Daten", "bbm", "12 - Test", "Vorabzug"));
    assert.equal(out.listsDir, path.join("C:\\Daten", "bbm", "12 - Test", "Listen"));
  });

  await runTopsStoreTests(run);
  await runTopsSelectorsTests(run);
  await runTopsDtosTests(run);
  await runTopsCommandsTests(run);
  await runTopsCloseFlowTests(run);
  await runTopsActionPolicyTests(run);
  await runTopsScreenIntegrationTests(run);
  await runProjectsLifecycleTests(run);
  await runProtokollRouterFallbackTests(run);

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log("Alle Tests bestanden.");
  }
}

main().catch((err) => {
  failed = true;
  process.exitCode = 1;
  console.error(err?.stack || err?.message || err);
});
