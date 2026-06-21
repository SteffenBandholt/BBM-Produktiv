const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const assert = require("node:assert/strict");
const {
  sanitizeDirName,
  resolveProjectFolderName,
  buildStoragePreviewPaths,
} = require("../src/main/ipc/projectStoragePaths");

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

const runnerScript = path.resolve(__filename);
const testScript = path.resolve(__dirname, "test.cjs");
const useCmdLauncher = isWindows && electronBinary.toLowerCase().endsWith(".cmd");
const spawnCommand = useCmdLauncher ? "cmd.exe" : electronBinary;

function extractHarnessPlan() {
  const source = fs.readFileSync(testScript, "utf8");
  const requireMap = new Map();
  const requirePattern = /const\s+\{\s*(run[A-Za-z0-9]+Tests)\s*\}\s*=\s*require\("(\.\/tests\/[^"]+)"\);/g;
  for (const match of source.matchAll(requirePattern)) {
    requireMap.set(match[1], match[2]);
  }

  const runEntries = [];
  const runCallPattern = /await\s+(run[A-Za-z0-9]+Tests)\(run\);/g;
  for (const match of source.matchAll(runCallPattern)) {
    const exportName = match[1];
    const modulePath = requireMap.get(exportName);
    if (!modulePath) {
      throw new Error(`Test-Harness-Aufruf ohne passenden Import: ${exportName}`);
    }
    runEntries.push({
      id: exportName,
      label: modulePath.replace("./tests/", ""),
      modulePath,
      exportName,
    });
  }

  const plannedExports = new Set(runEntries.map((entry) => entry.exportName));
  const importedAndExecutedExports = Array.from(requireMap.keys()).filter((exportName) =>
    source.includes(`await ${exportName}(run);`)
  );
  assert.deepEqual(
    plannedExports,
    new Set(importedAndExecutedExports),
    "Test-Harness-Aufrufe konnten nicht vollstaendig abgebildet werden."
  );

  return [
    {
      id: "storagePathInlineTests",
      label: "scripts/test.cjs inline storage path tests",
      kind: "inline-storage-paths",
    },
    ...runEntries,
  ];
}

function buildElectronTestGroups(entries) {
  const maxGroupSize = 8;
  const singleProcessTests = new Set([
    "runTopsScreenIntegrationTests",
    "runBbmUiEditorRuntimeLauncherTests",
    "runProjektverwaltungModuleTests",
    "runRestarbeitenModuleTests",
    "runTableLayoutEditorPrototypeTests",
  ]);
  const groups = [];
  let current = [];

  const flushCurrent = () => {
    if (current.length > 0) {
      groups.push(current);
      current = [];
    }
  };

  for (const entry of entries) {
    if (singleProcessTests.has(entry.id)) {
      flushCurrent();
      groups.push([entry]);
      continue;
    }
    current.push(entry);
    if (current.length >= maxGroupSize) flushCurrent();
  }
  flushCurrent();

  return groups.map((group, index) => ({ index: index + 1, entries: group }));
}

function createRunHarness() {
  let failed = false;

  const run = async (name, fn) => {
    try {
      const out = fn();
      if (out && typeof out.then === "function") await out;
      console.log(`ok - ${name}`);
    } catch (err) {
      failed = true;
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
    }
  };

  return {
    run,
    hasFailed() {
      return failed;
    },
  };
}

async function runInlineStoragePathTests(run) {
  await run("sanitizeDirName ersetzt ungueltige Zeichen", () => {
    const out = sanitizeDirName('A<B>:C"D/E\\F|G?H*');
    assert.equal(out, "A_B__C_D_E_F_G_H_");
  });

  await run("resolveProjectFolderName bildet Nummer + Label", () => {
    const out = resolveProjectFolderName({
      project_number: "P-42",
      short: "Rohbau Nord",
    });
    assert.equal(out, "P-42 - Rohbau Nord");
  });

  await run("buildStoragePreviewPaths erzeugt Zielordner", () => {
    const out = buildStoragePreviewPaths({
      baseDir: "C:\\Daten",
      project: { project_number: "12", short: "Test" },
    });
    assert.equal(out.projectFolder, "12 - Test");
    assert.equal(out.protocolsDir, path.join("C:\\Daten", "bbm", "12 - Test", "Protokolle"));
    assert.equal(out.previewDir, path.join("C:\\Daten", "bbm", "12 - Test", "Vorabzug"));
    assert.equal(out.listsDir, path.join("C:\\Daten", "bbm", "12 - Test", "Listen"));
    assert.equal(out.restarbeitenDir, path.join("C:\\Daten", "bbm", "12 - Test", "Restarbeiten"));
  });
}

function prepareLegacyGlobalsForEntry(entry) {
  if (entry.id !== "runAusgabeModuleTests" || typeof globalThis.document !== "undefined") return;
  globalThis.document = { title: "BBM" };
}

async function runGroup(groupIndex) {
  const entries = extractHarnessPlan();
  const groups = buildElectronTestGroups(entries);
  const group = groups[groupIndex - 1];
  if (!group) {
    console.error(`Fehler: Testgruppe ${groupIndex} existiert nicht.`);
    process.exit(1);
  }

  console.log(`\n[Electron-Testgruppe ${group.index}/${groups.length}] ${group.entries.length} Eintraege`);
  for (const entry of group.entries) {
    console.log(`- ${entry.label}`);
  }

  const harness = createRunHarness();
  for (const entry of group.entries) {
    if (entry.kind === "inline-storage-paths") {
      await runInlineStoragePathTests(harness.run);
      continue;
    }
    prepareLegacyGlobalsForEntry(entry);
    const testModule = require(path.resolve(__dirname, entry.modulePath));
    const testRunner = testModule[entry.exportName];
    if (typeof testRunner !== "function") {
      throw new Error(`Test-Export fehlt: ${entry.exportName} aus ${entry.modulePath}`);
    }
    await testRunner(harness.run);
  }

  if (harness.hasFailed()) {
    process.exitCode = 1;
  } else {
    console.log(`[Electron-Testgruppe ${group.index}/${groups.length}] bestanden`);
  }
}

function runAllGroups() {
  const entries = extractHarnessPlan();
  const groups = buildElectronTestGroups(entries);

  const plannedIds = groups.flatMap((group) => group.entries.map((entry) => entry.id));
  assert.deepEqual(
    plannedIds,
    entries.map((entry) => entry.id),
    "Electron-Testgruppen decken den Test-Harness nicht vollstaendig ab."
  );

  // Electron 30/V8 bleibt im Node-Modus effektiv um ca. 4 GB Heap begrenzt.
  // Deshalb laeuft die unveraenderte Testsuite in mehreren frischen
  // ELECTRON_RUN_AS_NODE-Prozessen statt in einem grossen Sammelprozess.
  console.log(`Starte npm test in ${groups.length} getrennten Electron-Testprozessen.`);
  console.log(`Abgedeckte Testeintraege: ${plannedIds.length}`);

  for (const group of groups) {
    const spawnArgs = useCmdLauncher
      ? ["/d", "/s", "/c", `"${electronBinary}" "${runnerScript}" --run-group ${group.index}`]
      : [runnerScript, "--run-group", String(group.index)];

    const child = spawnSync(spawnCommand, spawnArgs, {
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

    const status = typeof child.status === "number" ? child.status : 1;
    if (status !== 0) {
      console.error(`Electron-Testgruppe ${group.index}/${groups.length} fehlgeschlagen.`);
      process.exit(status);
    }
  }

  console.log("Alle Tests bestanden.");
}

const groupArgIndex = process.argv.indexOf("--run-group");
if (groupArgIndex !== -1) {
  runGroup(Number(process.argv[groupArgIndex + 1])).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exit(1);
  });
} else {
  runAllGroups();
}
