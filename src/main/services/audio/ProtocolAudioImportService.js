const { initDatabase } = require("../../db/database");
const { throwIfAborted } = require("./audioAbort");

const IMPORT_SPECIAL_TYPE = "audio_import";
const IMPORT_TITLE = "Import";
const DEFAULT_SHORT_TEXT_LIMIT = 100;
const MIN_SHORT_TEXT_LIMIT = 1;
const MAX_SHORT_TEXT_LIMIT = 5000;
const POINT_COMMAND_PATTERN = /(?:neuer|nächster)\s+punkt(?=$|[\s.,!?;:])/giu;

function _cleanPointText(value, { afterCommand = false } = {}) {
  let text = String(value || "");
  if (afterCommand) text = text.replace(/^[\s.,!?;:\-–—]+/u, "");
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
    const segment = _cleanPointText(source.slice(cursor, match.index), {
      afterCommand: cursor > 0,
    });
    if (segment) segments.push(segment);
    cursor = match.index + match[0].length;
  }

  if (!commandFound) return [source];
  const tail = _cleanPointText(source.slice(cursor), { afterCommand: true });
  if (tail) segments.push(tail);
  return segments;
}

function normalizeShortTextLimit(value) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SHORT_TEXT_LIMIT;
  return Math.max(MIN_SHORT_TEXT_LIMIT, Math.min(MAX_SHORT_TEXT_LIMIT, parsed));
}

function splitPointIntoShortAndLongText(pointText, shortTextLimit = DEFAULT_SHORT_TEXT_LIMIT) {
  const text = String(pointText || "").trim();
  if (!text) return null;

  const limit = normalizeShortTextLimit(shortTextLimit);
  const sentenceEnd = /[.!?]+(?:["”')\]]+)?(?=\s|$)/u.exec(text);
  const sentenceLength = sentenceEnd ? sentenceEnd.index + sentenceEnd[0].length : 0;
  const splitAt = sentenceLength > 0 ? sentenceLength : Math.min(limit, text.length);

  return {
    shortText: text.slice(0, splitAt).trimEnd(),
    longText: text.slice(splitAt).trimStart(),
  };
}

function buildImportPoints(transcriptText, shortTextLimit = DEFAULT_SHORT_TEXT_LIMIT) {
  return splitTranscriptIntoPointTexts(transcriptText)
    .map((pointText) => splitPointIntoShortAndLongText(pointText, shortTextLimit))
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

  _loadOpenMeeting({ meetingId, projectId }) {
    const meeting = this.meetingsRepo.getMeetingById(meetingId);
    if (!meeting) throw new Error("Besprechung nicht gefunden");
    if (Number(meeting.is_closed) === 1) {
      throw new Error("Besprechung ist geschlossen - Sprachimport nicht erlaubt");
    }
    if (String(meeting.project_id || "") !== String(projectId || "")) {
      throw new Error("Projektbezug des Sprachimports ist inkonsistent");
    }
    return meeting;
  }

  _resolveShortTextLimit() {
    if (!this.appSettingsRepo || typeof this.appSettingsRepo.appSettingsGetMany !== "function") {
      return DEFAULT_SHORT_TEXT_LIMIT;
    }
    const values = this.appSettingsRepo.appSettingsGetMany(["tops.titleMax"]) || {};
    return normalizeShortTextLimit(values["tops.titleMax"]);
  }

  _createPointsAtomically({ meetingId, projectId, points, signal }) {
    const db = this.dbProvider();
    const transaction = db.transaction(() => {
      throwIfAborted(signal);
      this._loadOpenMeeting({ meetingId, projectId });

      let importTitle = this.topsRepo.findSpecialTopByMeeting({
        meetingId,
        specialType: IMPORT_SPECIAL_TYPE,
      });
      let importTitleCreated = false;

      if (!importTitle) {
        importTitle = this.topsRepo.createTop({
          projectId,
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
          parentTopId: importTitle.id,
          level: 2,
          number: this.topsRepo.getNextNumber(projectId, importTitle.id),
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

  async importFromAudio({ audioImportId, meetingId, projectId, signal = null }) {
    if (!audioImportId) throw new Error("audioImportId required");
    if (!meetingId) throw new Error("meetingId required");
    if (!projectId) throw new Error("projectId required");

    throwIfAborted(signal);
    this._loadOpenMeeting({ meetingId, projectId });
    const audioImport = this.audioImportsRepo.getById(audioImportId);
    if (!audioImport) throw new Error("Audio-Import nicht gefunden");
    if (
      String(audioImport.meeting_id || "") !== String(meetingId) ||
      String(audioImport.project_id || "") !== String(projectId)
    ) {
      throw new Error("Audio-Import gehört nicht zum geöffneten Protokoll");
    }

    const transcription = await this.transcriptionService.transcribe({ audioImportId, signal });
    throwIfAborted(signal);
    const transcriptText = _transcriptTextFromResult(transcription);
    if (!transcriptText) throw new Error("Die Sprachdatei enthält kein verwertbares Transkript.");

    const points = buildImportPoints(transcriptText, this._resolveShortTextLimit());
    if (!points.length) throw new Error("Die Sprachdatei enthält keine verwertbaren Protokollpunkte.");
    throwIfAborted(signal);

    return {
      ...this._createPointsAtomically({ meetingId, projectId, points, signal }),
      pointCount: points.length,
    };
  }
}

function createProtocolAudioImportService(dependencies) {
  return new ProtocolAudioImportService(dependencies);
}

module.exports = {
  IMPORT_SPECIAL_TYPE,
  IMPORT_TITLE,
  DEFAULT_SHORT_TEXT_LIMIT,
  splitTranscriptIntoPointTexts,
  splitPointIntoShortAndLongText,
  buildImportPoints,
  ProtocolAudioImportService,
  createProtocolAudioImportService,
};
