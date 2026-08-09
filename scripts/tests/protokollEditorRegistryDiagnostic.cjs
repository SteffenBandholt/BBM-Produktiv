"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const electronBinary = require("electron");

const ROOT = path.resolve(__dirname, "../..");
const RUNNER = path.join(__dirname, "protokollEditorRegistryDiagnosticRunner.mjs");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-protokoll-registry-diagnostic-"));
const resultFile = path.join(temporaryRoot, "result.json");
const host = path.join(temporaryRoot, "host");

try {
  fs.mkdirSync(host);
  fs.writeFileSync(path.join(host, "package.json"), JSON.stringify({ main: "main.cjs" }), "utf8");
  fs.writeFileSync(path.join(host, "main.cjs"), `import(${JSON.stringify(RUNNER.replace(/\\/g, "/"))});\n`, "utf8");
  const env = {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "ELECTRON_RUN_AS_NODE")),
    BBM_PROTOKOLL_REGISTRY_DIAGNOSTIC_RESULT: resultFile,
  };
  const child = spawnSync(electronBinary, [host], {
    cwd: ROOT,
    env,
    encoding: "utf8",
    timeout: 120000,
    windowsHide: true,
  });
  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);
  if (!fs.existsSync(resultFile)) {
    process.exitCode = child.status || 1;
  } else {
    const result = JSON.parse(fs.readFileSync(resultFile, "utf8"));
    console.log("\n=== PROTOKOLL UI-EDITOR REGISTRYDIAGNOSE ===");
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = child.status || 0;
  }
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
