const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");
const { checkStorage, launchAcceptance } = require("../runSigekoStorageAcceptance.cjs");
const { createProjectStorageAccess } = require("../../src/main/ipc/projectStoragePaths");
const { createSigekoService } = require("../../src/main/domain/sigeko/SigekoService");

async function runSigekoStorageAcceptanceTests(run) {
  await run("S1.3 Abnahmehilfe: echter Service prueft Temp-Standard und Override ohne Loeschung", async () => {
    const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-s13-helper-"));
    try {
      const opened = [];
      const storage = createProjectStorageAccess({ getProject: (id) => id === "test" ? { project_number: "S13", name: "Äußere Straße" } : null,
        getBaseDir: () => path.join(rootPath, "Ablage"), openPath: async (dir) => { opened.push(dir); return ""; } });
      await checkStorage({ service: createSigekoService({ storage }), projectId: "test", rootPath });
      assert.equal(opened.length, 2);
      assert.notEqual(opened[0], opened[1]);
      for (const dir of opened) assert.ok(fs.statSync(dir).isDirectory());
      assert.deepEqual(fs.readdirSync(rootPath).sort(), ["Ablage", "Projekt-Override"]);
    } finally { fs.rmSync(rootPath, { recursive: true, force: true }); }
  });
  await run("S1.3 Abnahmehilfe: unerwartete Ordner und fehlgeschlagener Explorer ergeben Fehler", async () => {
    for (const fault of ["extra", "explorer"]) {
      const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-s13-negative-"));
      try {
        const storage = createProjectStorageAccess({ getProject: () => ({ name: "Test" }), getBaseDir: () => rootPath,
          openPath: async () => "Explorer nicht verfuegbar" });
        const real = createSigekoService({ storage });
        const service = fault === "extra" ? { ...real, ensureStorageDirectories(input) {
          const result = real.ensureStorageDirectories(input); fs.mkdirSync(path.join(result.moduleDir, "Unerwartet")); return result;
        } } : real;
        await assert.rejects(checkStorage({ service, projectId: "test", rootPath }), fault === "extra" ? /Falsche Zielordner/ : /Explorer nicht verfuegbar/);
      } finally { fs.rmSync(rootPath, { recursive: true, force: true }); }
    }
  });
  await run("S1.3 Abnahmehilfe: ein Befehl startet isolierten Electron-Prozess und meldet PASS mit Loeschhinweis", () => {
    const output = [];
    const rootPath = path.join(os.tmpdir(), "bbm-ui-editor-acceptance-probe");
    const result = launchAcceptance({ platform: "win32", createProfile: () => ({ rootPath }), switchAbi: (abi) => { assert.equal(abi, "electron"); return 0; },
      resolveBinary: () => "electron.exe", log: (line) => output.push(line), errorLog: (line) => output.push(line),
      spawn(binary, args, options) {
        assert.equal(binary, "electron.exe"); assert.ok(args[0].endsWith("runSigekoStorageAcceptance.cjs"));
        assert.equal(args[1], `--bbm-ui-editor-acceptance-root=${rootPath}`);
        assert.equal(options.env.ELECTRON_RUN_AS_NODE, undefined); assert.equal(options.shell, false);
        return { status: 0 };
      } });
    assert.equal(result, 0);
    assert.match(output.join("\n"), /PASS/); assert.match(output.join("\n"), /Remove-Item -LiteralPath/);
    assert.ok(output.some(line => line.includes(rootPath)));
    const pkg = require("../../package.json");
    assert.equal(pkg.scripts["test:sigeko:s1.3:windows"], "node scripts/runSigekoStorageAcceptance.cjs");
  });
  await run("S1.3 Abnahmehilfe: Prozessabbruch und Startfehler ergeben FAIL statt PASS", () => {
    for (const result of [{ status: 1 }, { status: null, signal: "SIGTERM" }, { error: new Error("Startfehler") }]) {
      const output = [];
      const exit = launchAcceptance({ platform: "win32", createProfile: () => ({ rootPath: path.join(os.tmpdir(), "probe") }),
        switchAbi: () => 0, resolveBinary: () => "electron.exe", spawn: () => result, log: x => output.push(x), errorLog: x => output.push(x) });
      assert.equal(exit, 1); assert.match(output.join("\n"), /FAIL/); assert.doesNotMatch(output.join("\n"), /PASS/);
      assert.match(output.join("\n"), /Temp-Ordner bleibt erhalten/);
    }
  });
  await run("S1.3 Abnahmehilfe: anderer Rechner startet keine vermeintliche Windows-Abnahme", () => {
    const out = [];
    assert.equal(launchAcceptance({ platform: "linux", createProfile() { throw new Error("Darf nicht angelegt werden"); }, log: x => out.push(x), errorLog: x => out.push(x) }), 1);
    assert.match(out.join("\n"), /bitte unter Windows/);
  });
  await run("S1.3 Abnahmehilfe: echter DB-Neuaufbau bleibt im validierten Temp-Profil", () => {
    const probe = spawnSync(process.execPath, [__filename, "--worker-probe"], { env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }, encoding: "utf8" });
    assert.equal(probe.status, 0, probe.stdout + probe.stderr);
    assert.match(probe.stdout, /WORKER_PROBE_PASS/);
  });
}

async function workerProbe() {
  const Module = require("node:module");
  const original = Module._load;
  const { createAcceptanceProfile } = require("../runIsolatedUiEditorAcceptance.cjs");
  const profile = createAcceptanceProfile();
  const paths = {};
  const opened = [];
  let exitCode;
  const electron = { app: { isPackaged: false, setPath: (key, value) => { paths[key] = value; },
    getPath(key) { assert.ok(paths[key], `Unerlaubter Profilzugriff ${key}`); return paths[key]; },
    whenReady: async () => {}, exit: code => { exitCode = code; } },
    shell: { openPath: async dir => { assert.ok(fs.statSync(dir).isDirectory()); opened.push(dir); return ""; } } };
  try {
    process.argv.push(`--bbm-ui-editor-acceptance-root=${profile.rootPath}`);
    Module._load = function(name, ...args) { return name === "electron" ? electron : original.call(this, name, ...args); };
    await require("../runSigekoStorageAcceptance.cjs").runElectronAcceptance();
    assert.equal(exitCode, 0); assert.equal(opened.length, 2);
    assert.ok(fs.existsSync(path.join(profile.userDataPath, "app.db")));
    const db = require("../../src/main/db/database").initDatabase();
    assert.equal(db.prepare("SELECT COUNT(*) n FROM projects").get().n, 1);
    assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name = 'meetings'").get(), undefined);
    db.close();
    console.log("WORKER_PROBE_PASS");
  } finally { Module._load = original; fs.rmSync(profile.rootPath, { recursive: true, force: true }); }
}
if (require.main === module && process.argv.includes("--worker-probe")) workerProbe().catch(e => { console.error(e); process.exitCode = 1; });
module.exports = { runSigekoStorageAcceptanceTests };
