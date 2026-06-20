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
// Der Heap muss beim echten Electron-Testprozess per Startargument gesetzt werden,
// nicht erst in dessen Laufzeitumgebung.
const electronHeapFlag = "--max-old-space-size=8192";
const spawnArgs = useCmdLauncher
  ? ["/d", "/s", "/c", `"${electronBinary}" ${electronHeapFlag} "${testScript}"`]
  : [electronHeapFlag, testScript];

const child = spawnSync(spawnCommand, spawnArgs, {
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    NODE_OPTIONS: String(process.env.NODE_OPTIONS || "").trim(),
  },
  stdio: "inherit",
});

if (child.error) {
  console.error("Fehler: Testlauf mit Electron konnte nicht gestartet werden.");
  console.error(child.error?.message || child.error);
  process.exit(1);
}

process.exit(typeof child.status === "number" ? child.status : 1);
