"use strict";

const path = require("node:path");
const cp = require("node:child_process");

const SUITES = [
  ["meetingSeries.test.cjs", "runMeetingSeriesTests"],
  ["meetingSeriesTransfer.test.cjs", "runMeetingSeriesTransferTests"],
  ["plannedConstructionStart.test.cjs", "runPlannedConstructionStartTests"],
  ["projectBuilder.test.cjs", "runProjectBuilderTests"],
  ["projectBuilderTransfer.test.cjs", "runProjectBuilderTransferTests"],
  ["projectTransferFirmLogic.test.cjs", "runProjectTransferFirmLogicTests"],
  ["topServiceHierarchy.test.cjs", "runTopServiceHierarchyTests"],
  ["protokollParticipantOwnership.test.cjs", "runProtokollParticipantOwnershipTests"],
  ["moduleIpcRegistration.test.cjs", "runModuleIpcRegistrationTests"],
];

async function run() {
  const results = [];
  for (const [file, exported] of SUITES) {
    const suite = require(path.join(__dirname, "tests", file));
    if (typeof suite[exported] !== "function") {
      throw new Error(`Test export missing: ${file}/${exported}`);
    }
    const before = results.length;
    await suite[exported](async (name, test) => {
      try {
        await test();
        results.push({ file, name, ok: true });
      } catch (error) {
        results.push({ file, name, ok: false });
        console.error(`FAIL ${name}\n${error?.stack || error}`);
      }
    });
    const rows = results.slice(before);
    console.log(`${file}: ${rows.filter((row) => row.ok).length}/${rows.length} passed`);
  }
  const passed = results.filter((row) => row.ok).length;
  console.log(`Meeting-series package: ${passed}/${results.length} passed`);
  process.exitCode = passed === results.length ? 0 : 1;
}

if (process.versions.electron) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  const result = cp.spawnSync(require("electron"), [__filename], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
    stdio: "inherit",
    windowsHide: true,
  });
  process.exitCode = result.status == null ? 1 : result.status;
}
