export class TranscriptionService {
  constructor(api = window?.bbmDb || {}) {
    this.api = api;
  }

  // Renderer-seitige Zusatzdienst-Bruecke:
  // Diese Klasse kapselt nur den Zugriff auf den technischen Audio-/Whisper-Dienst.
  // UI- und Fachlogik bleiben in den nutzenden Schichten.
  _requireAudioMethod(methodName, errorText = "Audio-Funktionen sind nicht verfuegbar.") {
    const fn = this.api?.[methodName];
    if (typeof fn !== "function") {
      throw new Error(errorText);
    }
    return fn.bind(this.api);
  }

  ensureSuggestionsAvailable() {
    this._requireAudioMethod("audioTranscribe");
    this._requireAudioMethod("audioAnalyze");
    return true;
  }

  async chooseProtocolImportFile() {
    const chooseFile = this._requireAudioMethod(
      "audioChooseProtocolImportFile",
      "Die lokale Dateiauswahl fuer den Audioimport ist nicht verfuegbar."
    );
    return chooseFile();
  }

  async runProtocolImport(payload) {
    return this._requireAudioMethod(
      "audioRunProtocolImport",
      "Der Protokoll-Audioimport ist nicht verfuegbar."
    )(payload);
  }

  async cancelProtocolImport(operationId) {
    return this._requireAudioMethod(
      "audioCancelProtocolImport",
      "Der Protokoll-Audioimport kann nicht abgebrochen werden."
    )({ operationId });
  }

  onProtocolImportProgress(callback) {
    const subscribe = this._requireAudioMethod(
      "audioOnProtocolImportProgress",
      "Die Fortschrittsanzeige des Protokoll-Audioimports ist nicht verfuegbar."
    );
    return subscribe(callback);
  }

  async transcribeBlob({ base64, mimeType, meetingId, projectId }) {
    const transcribeBlob = this._requireAudioMethod(
      "audioTranscribeBlob",
      "Audio-Transkription ist nicht verfuegbar."
    );
    return transcribeBlob({
      base64,
      mimeType,
      meetingId,
      projectId,
    });
  }

  async transcribe({ audioImportId }) {
    this.ensureSuggestionsAvailable();
    return this._requireAudioMethod("audioTranscribe")({ audioImportId });
  }

  async analyze({ audioImportId, processingMode }) {
    return this._requireAudioMethod("audioAnalyze")({ audioImportId, processingMode });
  }
}
