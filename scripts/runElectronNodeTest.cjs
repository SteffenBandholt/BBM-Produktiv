const fs = require("node:fs");
const path = require("node:path");
const { runGroupedTests } = require("./runGroupedTests.cjs");
const { switchNativeAbi } = require("./nativeDepsAbi.cjs");

function resolveElectronBinary() {
  const candidates = process.platform === "win32"
    ? [
        path.resolve(__dirname, "..", "node_modules", "electron", "dist", "electron.exe"),
        path.resolve(__dirname, "..", "node_modules", ".bin", "electron.cmd"),
      ]
    : [path.resolve(__dirname, "..", "node_modules", ".bin", "electron")];
  const binary = candidates.find((candidate) => fs.existsSync(candidate));
  if (!binary) throw new Error(`Kein Electron-Binary gefunden. Geprüft: ${candidates.join(", ")}`);
  return binary;
}

function runElectronTests({ switchAbi = switchNativeAbi, runGroups = runGroupedTests } = {}) {
  const abiResult = switchAbi("electron");
  if (abiResult !== 0) return abiResult;
  const executable = resolveElectronBinary();
  const result = runGroups({
    executable,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
  });
  return result.exitCode;
}

if (require.main === module) {
  try {
    process.exitCode = runElectronTests();
  } catch (error) {
    process.exitCode = 1;
    console.error(`Fehler im Electron-Testlauf: ${error?.message || error}`);
  }
}

module.exports = { resolveElectronBinary, runElectronTests };
