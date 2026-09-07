const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const vm = require("node:vm");
const { buildStoragePreviewPaths, buildModuleStoragePaths, createProjectStorageAccess } = require("../../src/main/ipc/projectStoragePaths");
const { createSigekoService } = require("../../src/main/domain/sigeko/SigekoService");
const names = ["Unterlagen", "SiGePläne", "Zeichnungen", "Berichte"];
const project = { id: "p", project_number: "42", short: "Äußere Straße" };
const input = { moduleId: "sigeko", projectId: "p" };
function fixture(overrides = {}) {
  return createProjectStorageAccess({ getProject: (id) => id === "p" ? project : null, getBaseDir: () => path.resolve(os.tmpdir(), "BBM-Test"), ...overrides });
}
async function runSigekoStorageTargetsTests(run) {
  await run("S1.3: Standard und Unicode folgen unveraenderten zentralen Projektpfaden", () => {
    const baseDir = path.resolve(os.tmpdir(), "Büro");
    const old = buildStoragePreviewPaths({ baseDir, project });
    const actual = buildModuleStoragePaths({ moduleId: "sigeko", baseDir, project });
    assert.equal(actual.moduleDir, path.join(path.dirname(old.protocolsDir), "SiGeKo"));
    assert.deepEqual(Object.keys(actual.targets), names);
    for (const name of names) assert.equal(actual.targets[name], path.join(actual.moduleDir, name));
    assert.deepEqual(Object.keys(old), ["baseDir", "projectFolder", "protocolsDir", "previewDir", "listsDir", "restarbeitenDir"]);
    assert.deepEqual(actual, buildModuleStoragePaths({ moduleId: "sigeko", baseDir, project }));
  });
  await run("S1.3: bestehender Basis-Override gilt aufrufbezogen ohne Settings-Schreibzugriff", () => {
    let defaultReads = 0;
    const storage = fixture({ getBaseDir() { defaultReads++; return path.resolve(os.tmpdir(), "Standard"); } });
    const override = path.resolve(os.tmpdir(), "Projekt-Override");
    const overridden = storage.resolve({ ...input, baseDir: override });
    assert.equal(defaultReads, 0);
    assert.equal(overridden.baseDir, override);
    assert.equal(storage.resolve(input).baseDir, path.resolve(os.tmpdir(), "Standard"));
    assert.equal(defaultReads, 1);
    assert.throws(() => storage.resolve({ ...input, baseDir: "" }), { code: "INVALID_STORAGE_PATH" });
  });
  await run("S1.3: Windows-Laufwerk und UNC erhalten exakte Unicode-Zielnamen", () => {
    for (const baseDir of ["C:\\Ablage", "\\\\Server\\Freigabe\\Büro"]) {
      const actual = buildModuleStoragePaths({ moduleId: "sigeko", baseDir, project, pathApi: path.win32 });
      assert.equal(actual.targets.SiGePläne, path.win32.join(baseDir, "bbm", "42 - Äußere Straße", "SiGeKo", "SiGePläne"));
    }
  });
  await run("S1.3: ungueltige Basis und reservierte Projektpfade werden vor Dateizugriff abgewiesen", () => {
    for (const baseDir of ["relativ", "\\Ablage", "C:relativ", "\\\\Bad?Server\\Share\\A", "C:\\Bad?", "C:\\CON", "C:\\dir.", "C:\\A\\..\\B", "C:\\A\u0000B"]) {
      assert.throws(() => buildModuleStoragePaths({ moduleId: "sigeko", baseDir, project, pathApi: path.win32 }), { code: "INVALID_STORAGE_PATH" });
    }
    for (const name of ["CON", "NUL.txt", "LPT1", "Projekt.", ".."]) {
      assert.throws(() => buildModuleStoragePaths({ moduleId: "sigeko", baseDir: "C:\\Ablage", project: { name }, pathApi: path.win32 }), { code: "INVALID_STORAGE_PATH" });
    }
    const safe = buildModuleStoragePaths({ moduleId: "sigeko", baseDir: "C:\\Ablage", project: { name: "A<B>:C" }, pathApi: path.win32 });
    assert.equal(safe.projectFolder, "A_B__C");
  });
  await run("S1.3: Vorschau schreibt nichts, Anlage erzeugt genau vier Ordner und erhaelt Bestand", () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-s13-"));
    try {
      const storage = fixture({ getBaseDir: () => baseDir });
      const preview = storage.resolve(input);
      assert.equal(fs.existsSync(preview.moduleDir), false);
      assert.deepEqual(storage.ensure(input), preview);
      assert.deepEqual(fs.readdirSync(preview.moduleDir).sort(), [...names].sort());
      const file = path.join(preview.targets.Unterlagen, "Bestand.txt");
      fs.writeFileSync(file, "bleibt");
      assert.deepEqual(storage.ensure(input), preview);
      assert.equal(fs.readFileSync(file, "utf8"), "bleibt");
      assert.deepEqual(fs.readdirSync(path.dirname(preview.moduleDir)), ["SiGeKo"]);
    } finally { fs.rmSync(baseDir, { recursive: true, force: true }); }
  });
  await run("S1.3: fehlende Rechte und Datei statt Ordner bleiben konkrete Systemfehler", () => {
    for (const operation of ["mkdirSync", "accessSync"]) {
      const error = Object.assign(new Error("Zugriff verweigert"), { code: "EACCES", path: "denied" });
      const storage = fixture({ fs: { mkdirSync() {}, accessSync() {}, [operation]() { throw error; } } });
      assert.throws(() => storage.ensure(input), (actual) => actual === error);
    }
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-s13-file-"));
    try {
      const storage = fixture({ getBaseDir: () => baseDir });
      const p = storage.resolve(input);
      fs.mkdirSync(p.moduleDir, { recursive: true });
      fs.writeFileSync(p.targets.Unterlagen, "Datei");
      assert.throws(() => storage.ensure(input), (e) => ["EEXIST", "ENOTDIR"].includes(e.code));
    } finally { fs.rmSync(baseDir, { recursive: true, force: true }); }
  });
  await run("S1.3: Oeffnen adressiert exakt den aufgeloesten Ordner und meldet Shellfehler", async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-s13-open-"));
    try {
      const opened = [];
      const storage = fixture({ getBaseDir: () => baseDir, openPath: async (dir) => { opened.push(dir); return ""; } });
      const expected = storage.resolve(input).targets.SiGePläne;
      assert.deepEqual(await storage.open({ ...input, target: "SiGePläne" }), { dir: expected });
      assert.deepEqual(opened, [expected]);
      assert.ok(fs.statSync(expected).isDirectory());
      for (const target of ["../", "constructor", "toString", "PDF", ""]) {
        await assert.rejects(storage.open({ ...input, target }), { code: "INVALID_STORAGE_TARGET" });
      }
      assert.equal(opened.length, 1);
      const broken = fixture({ getBaseDir: () => baseDir, openPath: async () => "Explorer fehlgeschlagen" });
      await assert.rejects(broken.open({ ...input, target: "SiGePläne" }), { code: "STORAGE_OPEN_FAILED", path: expected });
    } finally { fs.rmSync(baseDir, { recursive: true, force: true }); }
  });
  await run("S1.3: fehlendes Projekt wird abgewiesen und Service erzwingt SiGeKo-Ziel", () => {
    const storage = fixture();
    assert.throws(() => storage.resolve({ moduleId: "sigeko" }), { code: "PROJECT_REQUIRED" });
    assert.throws(() => storage.resolve({ ...input, projectId: "fremd" }), { code: "PROJECT_NOT_FOUND" });
    assert.throws(() => storage.resolve({ ...input, moduleId: "constructor" }), { code: "INVALID_STORAGE_MODULE" });
    const service = createSigekoService({ storage });
    assert.deepEqual(service.getStoragePaths({ ...input, moduleId: "rechnung" }), storage.resolve(input));
  });
  await run("S1.3: produktive Settings-/Projektadapter nutzen zentrale APIs und Downloads-Fallback", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../../src/main/ipc/projectStoragePaths.js"), "utf8");
    let settings = {};
    const reads = [];
    const context = { module: { exports: {} }, require(name) {
      if (name === "../db/projectsRepo") return { getById(id) { reads.push(id); return project; } };
      if (name === "../db/appSettingsRepo") return { appSettingsGetMany(keys) { assert.deepEqual(Array.from(keys), ["pdf.protocolsDir"]); return settings; } };
      if (name === "electron") return { app: { getPath(key) { assert.equal(key, "downloads"); return path.resolve(os.tmpdir(), "Downloads"); } } };
      return require(name);
    } };
    vm.runInNewContext(source, context);
    const storage = context.module.exports.createProjectStorageAccess();
    assert.equal(storage.resolve(input).baseDir, path.resolve(os.tmpdir(), "Downloads"));
    settings = { "pdf.protocolsDir": path.resolve(os.tmpdir(), "Zentral") };
    assert.equal(storage.resolve(input).baseDir, settings["pdf.protocolsDir"]);
    assert.deepEqual(reads, ["p", "p"]);
  });
  await run("S1.3: echter Preload delegiert Speicheroperationen, IPC erhaelt Fehlercode und Pfad", async () => {
    const { registerSigekoIpc } = require("../../src/main/ipc/sigekoIpc");
    const handlers = new Map();
    const calls = [];
    const service = Object.fromEntries(["getStoragePaths", "ensureStorageDirectories", "openStorageDirectory"].map((name) => [name, (payload) => { calls.push([name, payload]); return { marker: name }; }]));
    registerSigekoIpc({ ipcMain: { handle: (name, fn) => handlers.set(name, fn) }, service });
    const exposed = {};
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, "../../src/main/preload.js"), "utf8"), { require() { return {
      contextBridge: { exposeInMainWorld: (name, api) => { exposed[name] = api; } },
      ipcRenderer: { invoke: (name, payload) => handlers.get(name)({}, payload) },
    }; } });
    for (const [api, operation] of [["sigekoGetStoragePaths", "getStoragePaths"], ["sigekoEnsureStorageDirectories", "ensureStorageDirectories"], ["sigekoOpenStorageDirectory", "openStorageDirectory"]]) {
      assert.deepEqual(await exposed.bbmDb[api](input), { ok: true, data: { marker: operation } });
      assert.deepEqual(calls.at(-1), [operation, input]);
    }
    service.ensureStorageDirectories = () => { throw Object.assign(new Error("Keine Rechte"), { code: "EACCES", path: "/denied" }); };
    assert.deepEqual(await exposed.bbmDb.sigekoEnsureStorageDirectories(input), { ok: false, error: "Keine Rechte", code: "EACCES", path: "/denied" });
  });
  await run("S1.3: Modulguard sperrt alle Speicherzugriffe nach Freigabeentzug ohne Protokoll", async () => {
    const { registerActiveModuleIpcs } = require("../../src/main/moduleIpcRegistry");
    let status = { valid: true, license: { modules: ["sigeko"] } };
    const handlers = new Map();
    const result = registerActiveModuleIpcs({ licenseStatus: status, getLicenseStatus: () => status, ipcMain: { handle: (name, fn) => handlers.set(name, fn) }, registrars: require("../../src/main/moduleIpcRegistrars") });
    assert.deepEqual(result.registeredModuleIds, ["sigeko"]);
    status = { valid: true, license: { modules: [] } };
    for (const name of ["getStoragePaths", "ensureStorageDirectories", "openStorageDirectory"]) {
      assert.throws(() => handlers.get(`sigeko:${name}`)({}, input), { code: "MODULE_NOT_ACTIVE" });
    }
  });
}
module.exports = { runSigekoStorageTargetsTests };
