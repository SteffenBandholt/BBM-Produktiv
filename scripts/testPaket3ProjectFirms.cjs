const suites = [
  ["./tests/projectFirmsActiveFlow.test.cjs", "runProjectFirmsActiveFlowTests"],
  ["./tests/projectFirmsCoreOwnership.test.cjs", "runProjectFirmsCoreOwnershipTests"],
  ["./tests/projectFirmsLayout.test.cjs", "runProjectFirmsLayoutTests"],
];

let failed = false;

async function run(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failed = true;
    console.error(`not ok - ${name}`);
    console.error(error?.stack || error?.message || error);
  }
}

async function main() {
  for (const [modulePath, exportName] of suites) {
    const suite = require(modulePath)[exportName];
    if (typeof suite !== "function") {
      throw new Error(`Testexport fehlt: ${modulePath}#${exportName}`);
    }
    await suite(run);
  }
  if (failed) process.exitCode = 1;
  else console.log("Paket 3: alle gezielten Projektfirmen-/Workspace-Tests bestanden.");
}

main().catch((error) => {
  process.exitCode = 1;
  console.error(error?.stack || error?.message || error);
});
