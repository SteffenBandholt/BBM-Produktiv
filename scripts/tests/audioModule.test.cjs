const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function runAudioModuleTests(run) {
  const [{ TranscriptionService }] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/audio/index.js")),
  ]);

  const moduleIndexSource = read("src/renderer/modules/audio/index.js");
  const moduleReadmeSource = read("src/renderer/modules/audio/README.md");
  const serviceSource = read("src/renderer/modules/audio/TranscriptionService.js");
  const legacyServiceSource = read("src/renderer/services/audio/TranscriptionService.js");
  const moduleCatalogSource = read("src/renderer/app/modules/moduleCatalog.js");

  await run("Audio: Modul exportiert TranscriptionService", () => {
    assert.equal(typeof TranscriptionService, "function");
    assert.equal(
      moduleIndexSource.includes('export { TranscriptionService } from "./TranscriptionService.js";'),
      true
    );
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

  await run("Audio: kein Sidebar- oder Modulkatalog-Eintrag", () => {
    assert.equal(moduleCatalogSource.includes("getAudioModuleEntry"), false);
    assert.equal(moduleCatalogSource.includes("AUDIO_MODULE_ID"), false);
    assert.equal(moduleCatalogSource.includes("audio"), false);
  });

  await run("Audio: Doku beschreibt das Renderer-Modul", () => {
    assert.equal(moduleReadmeSource.includes("Audio / Diktat"), true);
    assert.equal(moduleReadmeSource.includes("Main-/IPC-/Whisper-Technik"), true);
    assert.equal(moduleReadmeSource.includes("kein Sidebar-Modul"), true);
  });
}

module.exports = { runAudioModuleTests };
