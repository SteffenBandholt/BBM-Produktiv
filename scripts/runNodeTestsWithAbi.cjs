const { runGroupedTests } = require("./runGroupedTests.cjs");
const { switchNativeAbi } = require("./nativeDepsAbi.cjs");

function runNodeTestsWithAbi({ switchAbi = switchNativeAbi, runGroups = runGroupedTests } = {}) {
  let testExitCode = 1;
  let restoreExitCode = 1;
  try {
    const nodeAbiExitCode = switchAbi("node");
    if (nodeAbiExitCode !== 0) return nodeAbiExitCode;
    testExitCode = runGroups({ executable: process.execPath }).exitCode;
  } finally {
    restoreExitCode = switchAbi("electron");
  }
  return testExitCode !== 0 ? testExitCode : restoreExitCode;
}

if (require.main === module) {
  try {
    process.exitCode = runNodeTestsWithAbi();
  } catch (error) {
    process.exitCode = 1;
    console.error(`Fehler im Node-Test-/ABI-Lauf: ${error?.message || error}`);
  }
}

module.exports = { runNodeTestsWithAbi };
