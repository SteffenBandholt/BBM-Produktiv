"use strict";

const suites = [
  [require("./protocolAudioImportRebuild.test.cjs"), "runProtocolAudioImportRebuildTests"],
  [require("./topsScreen.integration.test.cjs"), "runTopsScreenIntegrationTests"],
  [require("./dictionaryModule.test.cjs"), "runDictionaryModuleTests"],
  [require("./licenseFeatureGuards.test.cjs"), "runLicenseFeatureGuardTests"],
];

let failed = false;

async function run(name, test) {
  try {
    await test();
    console.log(`ok - ${name}`);
  } catch (error) {
    failed = true;
    console.error(`not ok - ${name}`);
    console.error(error?.stack || error?.message || error);
  }
}

async function main() {
  for (const [module, exportName] of suites) {
    await module[exportName](run);
  }
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  process.exitCode = 1;
  console.error(error?.stack || error?.message || error);
});
