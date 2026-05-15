const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { TranscriptionService: MainTranscriptionService } = require("../../src/main/services/audio/TranscriptionService.js");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

function withPatchedElectron(stubs, fn) {
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, _isMain) {
    const fromWhisperEngine = String(parent?.filename || "").endsWith(
      path.join("services", "audio", "engines", "WhisperCppEngine.js")
    );
    if (fromWhisperEngine && request === "electron") {
      return stubs.electron;
    }
    return originalLoad.apply(this, arguments);
  };

  try {
    const modPath = path.join(process.cwd(), "src/main/services/audio/engines/WhisperCppEngine.js");
    delete require.cache[require.resolve(modPath)];
    const mod = require(modPath);
    return fn(mod);
  } finally {
    Module._load = originalLoad;
  }
}

function createTranscriptionHarness({
  settingValue = "",
  availabilityByModel = {},
  transcribeResult = { engine: "whisper.cpp", language: "de", fullText: "ok", segments: [] },
} = {}) {
  const updates = [];
  const transcribeCalls = [];
  const service = new MainTranscriptionService({
    meetingsRepo: {
      getMeetingById() {
        return { id: "m-1", is_closed: 0, project_id: "p-1" };
      },
    },
    audioImportsRepo: {
      getById() {
        return { id: "ai-1", meeting_id: "m-1", project_id: "p-1", file_path: "C:\\audio.wav" };
      },
      updateStatus(payload) {
        updates.push(payload);
      },
    },
    transcriptsRepo: {
      upsertTranscript(payload) {
        return { id: "t-1", ...payload };
      },
    },
    appSettingsRepo: {
      appSettingsGetMany(keys) {
        const out = {};
        if (keys.includes("audio.whisper.quality") && settingValue !== undefined) {
          out["audio.whisper.quality"] = settingValue;
        }
        return out;
      },
    },
    engine: {
      getModelAvailability(modelFileName) {
        const entry = availabilityByModel[modelFileName];
        if (entry) return entry;
        return { available: true, modelPath: `C:\\models\\${modelFileName}`, executablePath: "C:\\whisper.exe" };
      },
      async transcribe(payload) {
        transcribeCalls.push(payload);
        return transcribeResult;
      },
    },
  });

  return { service, updates, transcribeCalls };
}

async function runAudioModuleTests(run) {
  const [{ TranscriptionService, createDictationDevSection }] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/audio/index.js")),
  ]);

  const packageJson = JSON.parse(read("package.json"));
  const moduleIndexSource = read("src/renderer/modules/audio/index.js");
  const moduleReadmeSource = read("src/renderer/modules/audio/README.md");
  const serviceSource = read("src/renderer/modules/audio/TranscriptionService.js");
  const dictationDevUiSource = read("src/renderer/modules/audio/ui/createDictationDevSection.js");
  const licenseEditorSource = read("src/renderer/modules/lizenzverwaltung/screens/createLicenseEditorSection.js");
  const settingsViewSource = read("src/renderer/views/SettingsView.js");
  const legacyServiceSource = read("src/renderer/services/audio/TranscriptionService.js");
  const moduleCatalogSource = read("src/renderer/app/modules/moduleCatalog.js");
  const engineSource = read("src/main/services/audio/engines/WhisperCppEngine.js");

  await run("Audio: Modul exportiert TranscriptionService", () => {
    assert.equal(typeof TranscriptionService, "function");
    assert.equal(
      moduleIndexSource.includes('export { TranscriptionService } from "./TranscriptionService.js";'),
      true
    );
  });

  await run("Audio: Modul exportiert den Diktieren-UI-Baustein", () => {
    assert.equal(typeof createDictationDevSection, "function");
    assert.equal(
      moduleIndexSource.includes('export { createDictationDevSection } from "./ui/createDictationDevSection.js";'),
      true
    );
    assert.equal(dictationDevUiSource.includes('const DEFAULT_WHISPER_QUALITY = "balanced";'), true);
    assert.equal(
      dictationDevUiSource.includes('whisperQuality = DEFAULT_WHISPER_QUALITY'),
      true
    );
    assert.equal(
      dictationDevUiSource.includes('WHISPER_QUALITIES.includes(raw) ? raw : DEFAULT_WHISPER_QUALITY'),
      true
    );
    assert.equal(dictationDevUiSource.includes("Aktuelle Engine: Whisper"), true);
    assert.equal(dictationDevUiSource.includes("Whisper-Modelle"), true);
    assert.equal(dictationDevUiSource.includes("Wörterbuch V1"), true);
    assert.equal(dictationDevUiSource.includes("Global fuer die ganze App"), true);
    assert.equal(settingsViewSource.includes("createDictationDevSection"), true);
  });

  await run("Audio: neue Renderer-Datei enthaelt die Implementierung", () => {
    assert.equal(serviceSource.includes("export class TranscriptionService"), true);
  });

  await run("Audio: alter services/audio-Pfad bleibt nur als Compatibility-Re-Export", () => {
    assert.equal(
      legacyServiceSource.trim(),
      'export { TranscriptionService } from "../../modules/audio/TranscriptionService.js";'
    );
  });

  await run("Audio: Main-Service nutzt small als Default und faellt auf small zurueck", async () => {
    const baseHarness = createTranscriptionHarness({ settingValue: "" });
    await baseHarness.service.transcribe({ audioImportId: "ai-1" });
    assert.equal(baseHarness.transcribeCalls[0].modelFileName, "ggml-small.bin");

    const mappingCases = [
      ["fast", "ggml-base.bin"],
      ["balanced", "ggml-small.bin"],
      ["best", "ggml-medium.bin"],
      ["large", "ggml-large.bin"],
    ];
    for (const [settingValue, expectedModelFileName] of mappingCases) {
      const harness = createTranscriptionHarness({ settingValue });
      await harness.service.transcribe({ audioImportId: "ai-1" });
      assert.equal(harness.transcribeCalls[0].modelFileName, expectedModelFileName);
    }

    const fallbackHarness = createTranscriptionHarness({
      settingValue: "best",
      availabilityByModel: {
        "ggml-medium.bin": { available: false, modelPath: null, executablePath: "C:\\whisper.exe" },
        "ggml-small.bin": { available: true, modelPath: "C:\\models\\ggml-small.bin", executablePath: "C:\\whisper.exe" },
      },
    });
    await fallbackHarness.service.transcribe({ audioImportId: "ai-1" });
    assert.equal(fallbackHarness.transcribeCalls[0].modelFileName, "ggml-small.bin");
  });

  await run("Audio: Main-Service meldet klaren Fehler, wenn auch small fehlt", async () => {
    const harness = createTranscriptionHarness({
      settingValue: "best",
      availabilityByModel: {
        "ggml-medium.bin": { available: false, modelPath: null, executablePath: "C:\\whisper.exe" },
        "ggml-small.bin": { available: false, modelPath: null, executablePath: "C:\\whisper.exe" },
      },
    });

    await assert.rejects(
      harness.service.transcribe({ audioImportId: "ai-1" }),
      /Whisper-Modell nicht verfuegbar: ggml-medium\.bin; auch ggml-small\.bin fehlt/
    );
    assert.equal(harness.transcribeCalls.length, 0);
  });

  await run("Audio: Whisper-Engine sucht Nutzer-Modelle unter userData/audio/models", () => {
    return withPatchedElectron(
      {
        electron: {
          app: {
            isPackaged: false,
            getPath(name) {
              assert.equal(name, "userData");
              return path.join("C:\\Users\\Test\\AppData\\Roaming", "BBM");
            },
          },
        },
      },
      (mod) => {
        const engine = new mod.WhisperCppEngine({ workspaceRoot: "C:\\Repo" });
        const candidates = engine._getModelCandidates("C:\\Repo\\tools\\whisper.exe", "ggml-large.bin");
        assert.equal(
          candidates.includes(path.join("C:\\Users\\Test\\AppData\\Roaming", "BBM", "audio", "models")),
          true
        );
        assert.equal(candidates.includes(path.join("C:\\Repo", "dev", "models")), true);
        assert.equal(candidates.includes(path.join("C:\\Repo", "dev", "models", "whisper")), true);
      }
    );
  });

  await run("Audio: Engine-Quelle behaelt packaged models und userData-Pfad", () => {
    assert.equal(engineSource.includes('getPath("userData")'), true);
    assert.equal(engineSource.includes('path.join(userDataPath, "audio", "models")'), true);
    assert.equal(engineSource.includes('path.join(resourcesRoot, "audio", "models")'), true);
  });

  await run("Audio: kein Sidebar- oder Modulkatalog-Eintrag", () => {
    assert.equal(moduleCatalogSource.includes("getAudioModuleEntry"), false);
    assert.equal(moduleCatalogSource.includes("AUDIO_MODULE_ID"), false);
    assert.equal(moduleCatalogSource.includes("audio"), false);
    assert.equal(moduleCatalogSource.includes("diktieren"), false);
    assert.equal(moduleCatalogSource.includes("dictionary"), false);
  });

  await run("Audio: Doku beschreibt das Renderer-Modul", () => {
    assert.equal(moduleReadmeSource.includes("Audio / Diktat"), true);
    assert.equal(moduleReadmeSource.includes("Main-/IPC-/Whisper-Technik"), true);
    assert.equal(moduleReadmeSource.includes("kein Sidebar-Modul"), true);
    assert.equal(moduleReadmeSource.includes("Diktieren"), true);
  });

  await run("Audio: Produktivbuild packt nur ggml-small.bin als Modell", () => {
    const whisperModelsResource = packageJson.build.extraResources.find((entry) => entry.to === "audio/models");
    assert.equal(Boolean(whisperModelsResource), true);
    assert.deepEqual(whisperModelsResource.filter, ["ggml-small.bin"]);
    const buildText = JSON.stringify(packageJson.build.extraResources);
    assert.equal(buildText.includes("ggml-base.bin"), false);
    assert.equal(buildText.includes("ggml-medium.bin"), false);
    assert.equal(buildText.includes("ggml-large.bin"), false);
    assert.equal(buildText.includes("whisper-cli.exe"), true);
    assert.equal(buildText.includes("ffmpeg.exe"), true);
  });

  await run("Lizenz-Editor zeigt audio fachlich als Dictate", () => {
    assert.equal(licenseEditorSource.includes('const formatLicenseFeatureLabel = formatProductScopeFeatureLabel;'), true);
    assert.equal(licenseEditorSource.includes('formatProductScopeFeatureLabel'), true);
    assert.equal(licenseEditorSource.includes('document.createTextNode(formatLicenseFeatureLabel(feature))'), true);
    assert.equal(
      licenseEditorSource.includes(
        'res.features.map(formatLicenseFeatureLabel).join(", ")'
      ),
      true
    );
  });
}

module.exports = { runAudioModuleTests };
