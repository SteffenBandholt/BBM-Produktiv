const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const isWindows = process.platform === "win32";
const electronCandidates = isWindows
  ? [
      path.resolve(__dirname, "..", "node_modules", "electron", "dist", "electron.exe"),
      path.resolve(__dirname, "..", "node_modules", ".bin", "electron.cmd"),
    ]
  : [path.resolve(__dirname, "..", "node_modules", ".bin", "electron")];

const electronBinary = electronCandidates.find((candidate) => fs.existsSync(candidate));

if (!electronBinary) {
  console.error("Fehler: Kein Electron-Binary gefunden. Gepruefte Kandidaten:");
  for (const candidate of electronCandidates) {
    console.error(`- ${candidate}`);
  }
  process.exit(1);
}

const testScript = path.resolve(__dirname, "test.cjs");
const useCmdLauncher = isWindows && electronBinary.toLowerCase().endsWith(".cmd");
const spawnCommand = useCmdLauncher ? "cmd.exe" : electronBinary;
const heapFlag = "--max-old-space-size=8192";
const spawnArgs = useCmdLauncher
  ? ["/d", "/s", "/c", `"${electronBinary}" "${heapFlag}" "${testScript}"`]
  : [heapFlag, testScript];

const child = spawnSync(spawnCommand, spawnArgs, {
  env: {
    ...process.env,
    // Der eigentliche Test-Kindprozess startet als Electron-Node-Prozess.
    ELECTRON_RUN_AS_NODE: "1",
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ""}--max-old-space-size=8192`,
  },
  stdio: "inherit",
});

if (child.error) {
  console.error("Fehler: Testlauf mit Electron konnte nicht gestartet werden.");
  console.error(child.error?.message || child.error);
  process.exit(1);
}

process.exit(typeof child.status === "number" ? child.status : 1);
