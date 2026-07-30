const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_GROUPS } = require("../testGroups.cjs");
const { runGroupedTests } = require("../runGroupedTests.cjs");
const { commandForAbi } = require("../nativeDepsAbi.cjs");
const { runElectronTests } = require("../runElectronNodeTest.cjs");
const { runNodeTestsWithAbi } = require("../runNodeTestsWithAbi.cjs");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runTestHarnessOrchestrationTests(run) {
  await run("Testharness: alle bisherigen Suite-Einstiege sind genau einmal gruppiert", () => {
    const suites = TEST_GROUPS.flatMap((group) => group.suites.map(([moduleName, exportName]) => `${moduleName}#${exportName}`));
    assert.equal(TEST_GROUPS.length, 8);
    assert.equal(suites.length, 108, "108 Suite-Einstiege einschließlich Entwicklungs-Lizenz sowie M82.4 bis M82.7");
    assert.equal(new Set(suites).size, suites.length);
    for (const suite of suites) assert.equal(fs.existsSync(path.resolve(__dirname, suite.split("#")[0])), true, suite);
    assert.equal(TEST_GROUPS.filter((group) => group.includeStoragePathTests).length, 1);
  });

  await run("Testharness: ESM-Modulgraph wird pro Datei wiederverwendet", async () => {
    const fixturePath = path.resolve(__dirname, "fixtures", "esmLoaderProbe.mjs");
    const firstImport = await importEsmFromFile(fixturePath);
    const secondImport = await importEsmFromFile(fixturePath);
    assert.strictEqual(secondImport, firstImport);
    assert.strictEqual(secondImport.marker, firstImport.marker);
  });

  await run("Testharness: Gruppen laufen vollständig und ein Gruppenfehler setzt den Gesamtfehler", () => {
    const calls = [];
    const groups = [
      { id: "eins", label: "Eins" },
      { id: "zwei", label: "Zwei" },
      { id: "drei", label: "Drei" },
    ];
    const result = runGroupedTests({
      executable: process.execPath,
      groups,
      log: { log() {}, error() {} },
      spawnSyncImpl: (_command, args) => {
        const groupId = args.at(-1);
        calls.push(groupId);
        return { pid: calls.length + 1000, status: groupId === "zwei" ? 7 : 0 };
      },
    });
    assert.deepEqual(calls, ["eins", "zwei", "drei"]);
    assert.equal(result.exitCode, 1);
    assert.deepEqual(result.results.map((entry) => entry.status), [0, 7, 0]);
  });

  await run("Testharness: synchron beendete Testgruppe hinterlässt keinen Child-Prozess", () => {
    const result = runGroupedTests({
      executable: process.execPath,
      executableArgs: [],
      groups: [{ id: "probe", label: "Probe" }],
      workerScript: path.resolve(__dirname, "fixtures", "testGroupProbe.cjs"),
      stdio: "pipe",
    });
    assert.equal(result.exitCode, 0);
    const pid = result.results[0].pid;
    assert.ok(Number.isInteger(pid));
    assert.throws(() => process.kill(pid, 0));
  });

  await run("ABI: Node- und Electron-Kommandos verwenden die koordinierte Rebuild-Strategie", () => {
    const node = commandForAbi("node", { env: { npm_execpath: __filename } });
    assert.equal(node.command, process.execPath);
    assert.equal(node.args[0], __filename);
    assert.deepEqual(node.args.slice(1, 3), ["rebuild", "better-sqlite3"]);
    assert.ok(node.args.includes("--runtime=node"));
    const electron = commandForAbi("electron", { platform: "win32", env: {} });
    assert.equal(electron.command, process.execPath);
    assert.match(electron.args[0], /electron-builder[\\/]cli\.js$/);
    assert.deepEqual(electron.args.slice(1), ["install-app-deps"]);
  });

  await run("ABI: Node-Test stellt Electron nach Erfolg und Testfehler wieder her", () => {
    for (const testExitCode of [0, 9]) {
      const calls = [];
      const exitCode = runNodeTestsWithAbi({
        switchAbi: (target) => { calls.push(target); return 0; },
        runGroups: () => ({ exitCode: testExitCode }),
      });
      assert.deepEqual(calls, ["node", "electron"]);
      assert.equal(exitCode, testExitCode);
    }
  });

  await run("ABI: Wiederherstellung läuft auch bei fehlgeschlagenem Node-Rebuild", () => {
    const calls = [];
    const exitCode = runNodeTestsWithAbi({
      switchAbi: (target) => { calls.push(target); return target === "node" ? 6 : 0; },
      runGroups: () => { throw new Error("darf nicht laufen"); },
    });
    assert.deepEqual(calls, ["node", "electron"]);
    assert.equal(exitCode, 6);
  });

  await run("ABI: Electron-Test schaltet vor der ersten Gruppe auf Electron", () => {
    const calls = [];
    const exitCode = runElectronTests({
      switchAbi: (target) => { calls.push(target); return 0; },
      runGroups: () => { calls.push("tests"); return { exitCode: 0 }; },
    });
    assert.deepEqual(calls, ["electron", "tests"]);
    assert.equal(exitCode, 0);
  });

  await run("ABI: Pack stellt Electron-ABI vor dem Builder sicher", () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "..", "package.json"), "utf8"));
    assert.match(pkg.scripts.pack, /^npm run fix:electron-deps && /);
    assert.equal(pkg.scripts["test:node"], "node scripts/runNodeTestsWithAbi.cjs");
    assert.equal(pkg.build.npmRebuild, false, "electron-builder darf keinen zweiten unkoordinierten Rebuild starten");
  });
}

module.exports = { runTestHarnessOrchestrationTests };
