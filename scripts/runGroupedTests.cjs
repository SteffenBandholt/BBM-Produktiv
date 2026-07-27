const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { TEST_GROUPS } = require("./testGroups.cjs");

const DEFAULT_GROUP_TIMEOUT_MS = 10 * 60 * 1000;

function runGroupedTests({
  executable,
  executableArgs = [],
  env = process.env,
  groups = TEST_GROUPS,
  spawnSyncImpl = spawnSync,
  workerScript = path.resolve(__dirname, "test.cjs"),
  stdio = "inherit",
  timeoutMs = DEFAULT_GROUP_TIMEOUT_MS,
  log = console,
} = {}) {
  if (!executable) throw new Error("Testlaufzeit fehlt.");
  const results = [];
  let failed = false;

  groups.forEach((group, index) => {
    const startedAt = Date.now();
    log.log(`\n=== TESTGRUPPE ${index + 1}/${groups.length}: ${group.id} – ${group.label} ===`);
    const child = spawnSyncImpl(executable, [...executableArgs, workerScript, "--group", group.id], {
      env,
      stdio,
      timeout: timeoutMs,
      windowsHide: true,
    });
    const status = typeof child.status === "number" ? child.status : 1;
    const durationMs = Date.now() - startedAt;
    const error = child.error?.message || (child.signal ? `Signal ${child.signal}` : "");
    results.push({ groupId: group.id, pid: child.pid ?? null, status, durationMs, error });
    if (status !== 0 || child.error) {
      failed = true;
      log.error(`=== TESTGRUPPE FEHLGESCHLAGEN: ${group.id} (${durationMs} ms)${error ? ` – ${error}` : ""} ===`);
    } else {
      log.log(`=== TESTGRUPPE OK: ${group.id} (${durationMs} ms) ===`);
    }
  });

  log.log(`\n=== TESTGRUPPEN GESAMT: ${groups.length - results.filter((entry) => entry.status !== 0).length}/${groups.length} erfolgreich ===`);
  return { exitCode: failed ? 1 : 0, results };
}

module.exports = { DEFAULT_GROUP_TIMEOUT_MS, runGroupedTests };
