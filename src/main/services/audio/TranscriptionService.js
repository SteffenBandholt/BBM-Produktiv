function _audioLog(message, extra = null) {
  if (extra && typeof extra === "object") {
    console.info("[AUDIO] Transcribe", message, extra);
    return;
  }
  console.info("[AUDIO] Transcribe", message);
}

const MODEL_SETTING_KEY = "audio.whisper.quality";
const DEFAULT_MODEL_FILE_NAME = "ggml-small.bin";
const MODEL_FILE_BY_QUALITY = Object.freeze({
  fast: "ggml-base.bin",
  balanced: "ggml-small.bin",
  best: "ggml-medium.bin",
  large: "ggml-large.bin",
});

class TranscriptionService {
  constructor({ meetingsRepo, audioImportsRepo, transcriptsRepo, engine, appSettingsRepo }) {
    if (!meetingsRepo) throw new Error("TranscriptionService: meetingsRepo required");
    if (!audioImportsRepo) throw new Error("TranscriptionService: audioImportsRepo required");
    if (!transcriptsRepo) throw new Error("TranscriptionService: transcriptsRepo required");
    if (!engine) throw new Error("TranscriptionService: engine required");

    this.meetingsRepo = meetingsRepo;
    this.audioImportsRepo = audioImportsRepo;
    this.transcriptsRepo = transcriptsRepo;
    this.engine = engine;
    this.appSettingsRepo = appSettingsRepo || null;
  }

  _resolveModelFileName() {
    if (!this.appSettingsRepo || typeof this.appSettingsRepo.appSettingsGetMany !== "function") {
      return DEFAULT_MODEL_FILE_NAME;
    }
    const data = this.appSettingsRepo.appSettingsGetMany([MODEL_SETTING_KEY]) || {};
    const raw = String(data[MODEL_SETTING_KEY] || "").trim().toLowerCase();
    return MODEL_FILE_BY_QUALITY[raw] || DEFAULT_MODEL_FILE_NAME;
  }

  _getModelAvailability(modelFileName) {
    if (!this.engine || typeof this.engine.getModelAvailability !== "function") {
      return null;
    }
    try {
      return this.engine.getModelAvailability(modelFileName);
    } catch (_err) {
      return null;
    }
  }

  _resolveTranscriptionModelFileName(modelFileName) {
    const requestedModelFileName = String(modelFileName || DEFAULT_MODEL_FILE_NAME).trim() ||
      DEFAULT_MODEL_FILE_NAME;
    const requestedAvailability = this._getModelAvailability(requestedModelFileName);
    if (!requestedAvailability || requestedAvailability.available) {
      return requestedModelFileName;
    }

    if (requestedModelFileName === DEFAULT_MODEL_FILE_NAME) {
      throw new Error(`Whisper-Modell nicht verfuegbar: ${DEFAULT_MODEL_FILE_NAME}`);
    }

    const fallbackAvailability = this._getModelAvailability(DEFAULT_MODEL_FILE_NAME);
    if (fallbackAvailability?.available) {
      return DEFAULT_MODEL_FILE_NAME;
    }

    throw new Error(
      `Whisper-Modell nicht verfuegbar: ${requestedModelFileName}; auch ${DEFAULT_MODEL_FILE_NAME} fehlt`
    );
  }

  _loadOpenMeeting(audioImport) {
    const meeting = this.meetingsRepo.getMeetingById(audioImport.meeting_id);
    if (!meeting) throw new Error("Besprechung nicht gefunden");
    if (Number(meeting.is_closed) === 1) {
      throw new Error("Besprechung ist geschlossen - Transkription nicht erlaubt");
    }
    if (String(meeting.project_id || "") !== String(audioImport.project_id || "")) {
      throw new Error("Projektbezug des Audio-Imports ist inkonsistent");
    }
    return meeting;
  }

  async transcribe({ audioImportId, language = "de" }) {
    if (!audioImportId) throw new Error("audioImportId required");

    _audioLog("start", { audioImportId, language });
    const audioImport = this.audioImportsRepo.getById(audioImportId);
    if (!audioImport) throw new Error("Audio-Import nicht gefunden");

    this._loadOpenMeeting(audioImport);
    this.audioImportsRepo.updateStatus({
      audioImportId,
      status: "transcribing",
      errorMessage: null,
    });

    try {
      const requestedModelFileName = this._resolveModelFileName();
      const resolvedModelFileName = this._resolveTranscriptionModelFileName(requestedModelFileName);
      const result = await this.engine.transcribe({
        filePath: audioImport.file_path,
        language,
        modelFileName: resolvedModelFileName,
        audioImport,
      });

      const transcript = this.transcriptsRepo.upsertTranscript({
        audioImportId,
        engine: result.engine || "whisper.cpp",
        language: result.language || null,
        fullText: result.fullText || "",
        segmentsJson: JSON.stringify(Array.isArray(result.segments) ? result.segments : []),
      });

      this.audioImportsRepo.updateStatus({
        audioImportId,
        status: "transcribed",
        errorMessage: null,
      });

      _audioLog("completed", {
        audioImportId,
        engine: result.engine || "whisper.cpp",
        language: result.language || null,
        textLength: String(result.fullText || "").length,
      });

      return {
        transcript,
        stub: false,
        engine: result.engine || "whisper.cpp",
        message: "Lokale Transkription erfolgreich abgeschlossen.",
      };
    } catch (err) {
      this.audioImportsRepo.updateStatus({
        audioImportId,
        status: "failed",
        errorMessage: err?.message || String(err),
      });
      _audioLog("failed", { audioImportId, error: err?.message || String(err) });
      throw err;
    }
  }
}

function createTranscriptionService(deps) {
  return new TranscriptionService(deps);
}

module.exports = {
  TranscriptionService,
  createTranscriptionService,
};
