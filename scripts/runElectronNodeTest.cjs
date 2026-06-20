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
const spawnArgs = useCmdLauncher
  ? ["/d", "/s", "/c", `"${electronBinary}" "${testScript}"`]
  : [testScript];
const TEST_HEAP_LIMIT_MB = 8192;

function withMaxOldSpaceSize(nodeOptions = "") {
  const normalized = String(nodeOptions || "").trim();
  const limitFlag = `--max-old-space-size=${TEST_HEAP_LIMIT_MB}`;

  if (!normalized) return limitFlag;

  const parts = normalized.split(/\s+/).filter(Boolean);
  const existingIndex = parts.findIndex((entry) => entry.startsWith("--max-old-space-size="));
  if (existingIndex >= 0) {
    const existingValue = Number(parts[existingIndex].split("=", 2)[1]);
    if (Number.isFinite(existingValue) && existingValue >= TEST_HEAP_LIMIT_MB) {
      return normalized;
    }
    parts[existingIndex] = limitFlag;
    return parts.join(" ");
  }

  parts.push(limitFlag);
  return parts.join(" ");
}

const child = spawnSync(spawnCommand, spawnArgs, {
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    NODE_OPTIONS: withMaxOldSpaceSize(process.env.NODE_OPTIONS),
  },
  stdio: "inherit",
});

if (child.error) {
  console.error("Fehler: Testlauf mit Electron konnte nicht gestartet werden.");
  console.error(child.error?.message || child.error);
  process.exit(1);
}

process.exit(typeof child.status === "number" ? child.status : 1);
