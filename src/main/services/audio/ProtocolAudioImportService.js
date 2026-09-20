const { initDatabase } = require("../../db/database");
const { throwIfAborted } = require("./audioAbort");

const IMPORT_SPECIAL_TYPE = "audio_import";
const IMPORT_TITLE = "Import";
const POINT_COMMAND_PATTERN = /(?:neuer|nächster)\s+punkt(?=$|[^\p{L}\p{N}_])/giu;
const PARAGRAPH_COMMAND_PATTERN = /absatz(?=$|[^\p{L}\p{N}_])/giu;

function _cleanMarkerSegment(value, { afterMarker = false, beforeMarker = false } = {}) {
  let text = String(value || "");
  if (afterMarker) text = text.replace(/^[\s\p{P}\p{S}]+/u, "");
  if (beforeMarker) text = text.replace(/[\s,;:\-–—\u0028\u005B{«‹„“"']+$/u, "");
  return text.trim();
}

function splitTranscriptIntoPointTexts(transcriptText) {
  const source = String(transcriptText || "").trim();
  if (!source) return [];

  const segments = [];
  let cursor = 0;
  let commandFound = false;
  POINT_COMMAND_PATTERN.lastIndex = 0;

  for (let match = POINT_COMMAND_PATTERN.exec(source); match; match = POINT_COMMAND_PATTERN.exec(source)) {
    const previous = match.index > 0 ? source[match.index - 1] : "";
    if (previous && /[\p{L}\p{N}_]/u.test(previous)) continue;
    commandFound = true;
    const segment = _cleanMarkerSegment(source.slice(cursor, match.index), {
      afterMarker: cursor > 0,
      beforeMarker: true,
    });
    if (segment) segments.push(segment);
    cursor = match.index + match[0].length;
  }

  if (!commandFound) return [source];
  const tail = _cleanMarkerSegment(source.slice(cursor), { afterMarker: true });
  if (tail) segments.push(tail);
  return segments;
}

function splitPointIntoShortAndLongText(pointText) {
  const text = String(pointText || "").trim();
  if (!text) return null;

  const segments = [];
  let cursor = 0;
  let markerFound = false;
  PARAGRAPH_COMMAND_PATTERN.lastIndex = 0;

  for (
    let match = PARAGRAPH_COMMAND_PATTERN.exec(text);
    match;
    match = PARAGRAPH_COMMAND_PATTERN.exec(text)
  ) {
    const previous = match.index > 0 ? text[match.index - 1] : "";
    if (previous && /[\p{L}\p{N}_]/u.test(previous)) continue;
    markerFound = true;
    segments.push(_cleanMarkerSegment(text.slice(cursor, match.index), {
      afterMarker: cursor > 0,
      beforeMarker: true,
    }));
    cursor = match.index + match[0].length;
  }

  if (!markerFound) {
    return { shortText: text, longText: "" };
  }

  segments.push(_cleanMarkerSegment(text.slice(cursor), { afterMarker: true }));
  let shortText = segments.shift() || "";
  if (!shortText) {
    const firstContentIndex = segments.findIndex((segment) => segment);
    if (firstContentIndex >= 0) {
      shortText = segments[firstContentIndex];
      segments.splice(0, firstContentIndex + 1);
    }
  }

  return {
    shortText,
    longText: segments.join("\n\n").trim(),
  };
}

function buildImportPoints(transcriptText) {
  return splitTranscriptIntoPointTexts(transcriptText)
    .map((pointText) => splitPointIntoShortAndLongText(pointText))
    .filter((point) => point?.shortText);
}

function _transcriptTextFromResult(result) {
  return String(
    result?.transcript?.full_text ??
    result?.transcript?.fullText ??
    result?.full_text ??
    result?.fullText ??
    result?.transcriptText ??
    result?.text ??
    ""
  ).trim();
}

class ProtocolAudioImportService {
  constructor({
    meetingsRepo,
    topsRepo,
    meetingTopsRepo,
    audioImportsRepo,
    transcriptionService,
    appSettingsRepo = null,
    dbProvider = initDatabase,
  }) {
    if (!meetingsRepo) throw new Error("ProtocolAudioImportService: meetingsRepo required");
    if (!topsRepo) throw new Error("ProtocolAudioImportService: topsRepo required");
    if (!meetingTopsRepo) throw new Error("ProtocolAudioImportService: meetingTopsRepo required");
    if (!audioImportsRepo) throw new Error("ProtocolAudioImportService: audioImportsRepo required");
    if (!transcriptionService) throw new Error("ProtocolAudioImportService: transcriptionService required");
    if (typeof dbProvider !== "function") throw new Error("ProtocolAudioImportService: dbProvider required");

    this.meetingsRepo = meetingsRepo;
    this.topsRepo = topsRepo;
    this.meetingTopsRepo = meetingTopsRepo;
    this.audioImportsRepo = audioImportsRepo;
    this.transcriptionService = transcriptionService;
    this.appSettingsRepo = appSettingsRepo;
    this.dbProvider = dbProvider;
  }

  _loadWritableMeeting({ meetingId, projectId }) {
    const meeting = this.meetingsRepo.assertMeetingWritable
      ? this.meetingsRepo.assertMeetingWritable(meetingId)
      : this.meetingsRepo.getMeetingById(meetingId);
    if (!meeting || Number(meeting.is_closed) === 1) {
      throw new Error("Besprechung ist geschlossen - Sprachimport nicht erlaubt");
    }
    if (String(meeting.project_id || "") !== String(projectId || "")) {
      throw new Error("Projektbezug des Sprachimports ist inkonsistent");
    }
    return meeting;
  }

  _createPointsAtomically({ meetingId, projectId, points, signal }) {
    const db = this.dbProvider();
    const transaction = db.transaction(() => {
      throwIfAborted(signal);
      const meeting = this._loadWritableMeeting({ meetingId, projectId });
      const seriesKey = meeting.series_key;

      let importTitle = this.topsRepo.findSpecialTopByMeeting({
        meetingId,
        specialType: IMPORT_SPECIAL_TYPE,
      });
      let importTitleCreated = false;

      if (!importTitle) {
        importTitle = this.topsRepo.createTop({
          projectId,
          seriesKey,
          parentTopId: null,
          level: 1,
          number: 0,
          title: IMPORT_TITLE,
          specialType: IMPORT_SPECIAL_TYPE,
        });
        this.meetingTopsRepo.attachTopToMeeting({
          meetingId,
          topId: importTitle.id,
          status: "offen",
          dueDate: null,
          longtext: null,
          isCarriedOver: false,
        });
        importTitleCreated = true;
      } else if (String(importTitle.title || "") !== IMPORT_TITLE) {
        importTitle = this.topsRepo.updateTitle({ topId: importTitle.id, title: IMPORT_TITLE });
      }

      const createdTopIds = [];
      const dueDate = new Date().toISOString().slice(0, 10);
      for (const point of points) {
        throwIfAborted(signal);
        const created = this.topsRepo.createTop({
          projectId,
          seriesKey,
          parentTopId: importTitle.id,
          level: 2,
          number: this.topsRepo.getNextNumber(projectId, importTitle.id, seriesKey),
          title: point.shortText,
        });
        this.meetingTopsRepo.attachTopToMeeting({
          meetingId,
          topId: created.id,
          status: "offen",
          dueDate,
          longtext: point.longText || null,
          isCarriedOver: false,
        });
        createdTopIds.push(created.id);
      }

      return {
        importTitleId: importTitle.id,
        importTitleCreated,
        createdTopIds,
        firstCreatedTopId: createdTopIds[0] || null,
      };
    });
    return transaction();
  }

  async importFromAudio({ audioImportId, meetingId, projectId, signal = null, onProgress = null }) {
    if (!audioImportId) throw new Error("audioImportId required");
    if (!meetingId) throw new Error("meetingId required");
    if (!projectId) throw new Error("projectId required");

    throwIfAborted(signal);
    this._loadWritableMeeting({ meetingId, projectId });
    const audioImport = this.audioImportsRepo.getById(audioImportId);
    if (!audioImport) throw new Error("Audio-Import nicht gefunden");
    if (
      String(audioImport.meeting_id || "") !== String(meetingId) ||
      String(audioImport.project_id || "") !== String(projectId)
    ) {
      throw new Error("Audio-Import gehört nicht zum geöffneten Protokoll");
    }

    onProgress?.({ phase: "transcription", percent: 15, message: "Transkription läuft" });
    const transcription = await this.transcriptionService.transcribe({ audioImportId, signal });
    throwIfAborted(signal);
    const transcriptText = _transcriptTextFromResult(transcription);
    if (!transcriptText) throw new Error("Die Sprachdatei enthält kein verwertbares Transkript.");

    onProgress?.({ phase: "parsing", percent: 80, message: "Protokollpunkte werden vorbereitet" });
    const points = buildImportPoints(transcriptText);
    if (!points.length) throw new Error("Die Sprachdatei enthält keine verwertbaren Protokollpunkte.");
    throwIfAborted(signal);

    onProgress?.({ phase: "saving", percent: 92, message: "Protokollpunkte werden gespeichert" });
    const created = this._createPointsAtomically({ meetingId, projectId, points, signal });
    onProgress?.({ phase: "completed", percent: 100, message: "Import abgeschlossen" });
    return { ...created, pointCount: points.length };
  }
}

function createProtocolAudioImportService(dependencies) {
  return new ProtocolAudioImportService(dependencies);
}

module.exports = {
  IMPORT_SPECIAL_TYPE,
  IMPORT_TITLE,
  splitTranscriptIntoPointTexts,
  splitPointIntoShortAndLongText,
  buildImportPoints,
  ProtocolAudioImportService,
  createProtocolAudioImportService,
};
