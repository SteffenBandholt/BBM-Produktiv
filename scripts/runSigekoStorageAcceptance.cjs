#!/usr/bin/env node
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { createAcceptanceProfile, createSanitizedEnvironment } = require("./runIsolatedUiEditorAcceptance.cjs");
const { ACCEPTANCE_SWITCH, configureUiEditorAcceptanceProfile, isPathInside } = require("../src/main/startup/uiEditorAcceptanceProfile");

// Nur Abnahme: alle Pfade kommen aus dem unveraenderten produktiven Service.
async function checkStorage({ service, projectId, rootPath }) {
  const expectedNames = ["Unterlagen", "SiGePläne", "Zeichnungen", "Berichte"].sort();
  for (const override of [false, true]) {
    const input = { projectId, ...(override ? { baseDir: path.join(rootPath, "Projekt-Override") } : {}) };
    const preview = service.getStoragePaths(input);
    assert.ok(isPathInside(rootPath, preview.moduleDir), "Ziel liegt ausserhalb des Testprofils");
    assert.equal(fs.existsSync(preview.moduleDir), false, "Vorschau hat bereits Ordner erzeugt");
    assert.deepEqual(Object.keys(preview.targets).sort(), expectedNames);
    for (const name of expectedNames) {
      assert.equal(preview.targets[name], path.join(preview.moduleDir, name));
    }
    assert.deepEqual(service.ensureStorageDirectories(input), preview, "Anlage weicht von Vorschau ab");
    assert.deepEqual(fs.readdirSync(preview.moduleDir).sort(), expectedNames, "Falsche Zielordner");
    for (const dir of Object.values(preview.targets)) assert.ok(fs.statSync(dir).isDirectory());
    const sentinel = path.join(preview.targets.Unterlagen, "S1.3-Testdatei.txt");
    fs.writeFileSync(sentinel, "Temporäre S1.3-Abnahme – Bestand bleibt erhalten.", "utf8");
    assert.deepEqual(service.ensureStorageDirectories(input), preview);
    assert.equal(fs.readFileSync(sentinel, "utf8"), "Temporäre S1.3-Abnahme – Bestand bleibt erhalten.");
    const opened = await service.openStorageDirectory({ ...input, target: "SiGePläne" });
    assert.equal(opened.dir, preview.targets.SiGePläne, "Explorer-Ziel weicht von Vorschau ab");
    console.log(`[S1.3] ${override ? "Override" : "Standard"}: ${preview.moduleDir}`);
    console.log(`[S1.3] Explorer: ${opened.dir}`);
  }
}

async function runElectronAcceptance() {
  const { app } = require("electron");
  try {
    // Vor jedem DB-Import: vorhandenes validiertes Temp-Profil aktivieren.
    const profile = configureUiEditorAcceptanceProfile({ electronApp: app });
    assert.equal(profile.enabled, true, "Isoliertes Abnahmeprofil erforderlich");
    await app.whenReady();
    const { configureDatabaseMigrations, initDatabase } = require("../src/main/db/database");
    configureDatabaseMigrations({ valid: true, license: { modules: ["sigeko"] } }, { allowLegacyImport: false });
    const db = initDatabase();
    assert.ok(isPathInside(profile.rootPath, db.name), "DB liegt ausserhalb des Testprofils");
    const project = require("../src/main/db/projectsRepo").createProject({ project_number: "S13", name: "SiGeKo Abnahme – Äußere Straße" });
    require("../src/main/db/appSettingsRepo").appSettingsSetMany({ "pdf.protocolsDir": path.join(profile.rootPath, "Ablage") });
    const { createSigekoService } = require("../src/main/domain/sigeko/SigekoService");
    await checkStorage({ service: createSigekoService(), projectId: project.id, rootPath: profile.rootPath });
    app.exit(0);
  } catch (error) {
    console.error(`[S1.3] FAIL: ${error?.stack || error}`);
    app.exit(1);
  }
}

function launchAcceptance({ platform = process.platform, createProfile = createAcceptanceProfile,
  switchAbi = require("./nativeDepsAbi.cjs").switchNativeAbi,
  resolveBinary = require("./runElectronNodeTest.cjs").resolveElectronBinary,
  spawn = spawnSync, log = console.log, errorLog = console.error } = {}) {
  let rootPath = "(noch nicht angelegt)";
  try {
    if (platform !== "win32") throw new Error("Diese praktische Explorer-Abnahme bitte unter Windows ausfuehren.");
    const profile = createProfile();
    rootPath = profile.rootPath;
    log(`[S1.3] Temp-Ordner: ${rootPath}`);
    if (switchAbi("electron") !== 0) throw new Error("Electron-Abhaengigkeiten konnten nicht vorbereitet werden.");
    const result = spawn(resolveBinary(), [__filename, `${ACCEPTANCE_SWITCH}${rootPath}`], {
      cwd: path.resolve(__dirname, ".."), env: createSanitizedEnvironment(), stdio: "inherit", shell: false,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Abnahmeprozess fehlgeschlagen (Exit ${result.status}, Signal ${result.signal || "keins"}).`);
    log("[S1.3] PASS – Standard und Override geprueft; Explorer-Aufrufe erfolgreich.");
    log("[S1.3] Bitte die vier Ordner im geoeffneten Explorer noch visuell kontrollieren.");
    return 0;
  } catch (error) {
    errorLog(`[S1.3] FAIL – ${error?.message || error}`);
    return 1;
  } finally {
    log(`[S1.3] Temp-Ordner bleibt erhalten: ${rootPath}`);
    if (rootPath !== "(noch nicht angelegt)") {
      log(`[S1.3] Nach Kontrolle Explorer schliessen; anschliessend in PowerShell loeschen:\nRemove-Item -LiteralPath '${rootPath.replace(/'/g, "''")}' -Recurse -Force`);
    }
  }
}

if (require.main === module) {
  if (process.versions.electron) void runElectronAcceptance();
  else process.exitCode = launchAcceptance();
}
module.exports = { checkStorage, launchAcceptance, runElectronAcceptance };
