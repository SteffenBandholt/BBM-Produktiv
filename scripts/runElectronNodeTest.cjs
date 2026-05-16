const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const isWindows = process.platform === "win32";
const electronBinary = path.resolve(
  __dirname,
  "..",
  "node_modules",
  ".bin",
  isWindows ? "electron.cmd" : "electron",
);

if (!fs.existsSync(electronBinary)) {
  console.error(`Fehler: Electron-Binary nicht gefunden unter ${electronBinary}`);
  process.exit(1);
}

const testScript = path.resolve(__dirname, "test.cjs");
const child = spawnSync(electronBinary, [testScript], {
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
  },
  stdio: "inherit",
});

if (child.error) {
  console.error("Fehler: Testlauf mit Electron konnte nicht gestartet werden.");
  console.error(child.error?.message || child.error);
  process.exit(1);
}

process.exit(typeof child.status === "number" ? child.status : 1);
