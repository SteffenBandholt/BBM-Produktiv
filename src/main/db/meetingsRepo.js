// src/main/db/meetingsRepo.js
const { initDatabase } = require("./database");
const { randomUUID } = require("crypto");

function getMeetingById(meetingId) {
  const db = initDatabase();
  return db.prepare(`
    SELECT
      id,
      project_id,
      meeting_index,
      title,
      is_closed,
      pdf_show_ampel,
      todo_snapshot_json,
      next_meeting_enabled,
      next_meeting_option_a_enabled,
      next_meeting_option_b_enabled,
      next_meeting_option_b_text,
      next_meeting_date,
      next_meeting_time,
      next_meeting_place,
      next_meeting_extra,
      created_at,
      updated_at
    FROM meetings
    WHERE id = @id
  `).get({ id: meetingId });
}

function listByProject(projectId) {
  const db = initDatabase();
  return db.prepare(`
    SELECT
      id,
      project_id,
      meeting_index,
      title,
      is_closed,
      pdf_show_ampel,
      todo_snapshot_json,
      next_meeting_enabled,
      next_meeting_option_a_enabled,
      next_meeting_option_b_enabled,
      next_meeting_option_b_text,
      next_meeting_date,
      next_meeting_time,
      next_meeting_place,
      next_meeting_extra,
      created_at,
      updated_at
    FROM meetings
    WHERE project_id = @projectId
    ORDER BY meeting_index ASC
  `).all({ projectId });
}

function getOpenMeetingByProject(projectId) {
  const db = initDatabase();
  return db.prepare(`
    SELECT
      id,
      project_id,
      meeting_index,
      title,
      is_closed,
      pdf_show_ampel,
      todo_snapshot_json,
      next_meeting_enabled,
      next_meeting_option_a_enabled,
      next_meeting_option_b_enabled,
      next_meeting_option_b_text,
      next_meeting_date,
      next_meeting_time,
      next_meeting_place,
      next_meeting_extra,
      created_at,
      updated_at
    FROM meetings
    WHERE project_id = @projectId
      AND is_closed = 0
    ORDER BY meeting_index DESC
    LIMIT 1
  `).get({ projectId });
}

function getLastClosedMeetingByProject(projectId) {
  const db = initDatabase();
  return db.prepare(`
    SELECT
      id,
      project_id,
      meeting_index,
      title,
      is_closed,
      pdf_show_ampel,
      todo_snapshot_json,
      next_meeting_enabled,
      next_meeting_option_a_enabled,
      next_meeting_option_b_enabled,
      next_meeting_option_b_text,
      next_meeting_date,
      next_meeting_time,
      next_meeting_place,
      next_meeting_extra,
      created_at,
      updated_at
    FROM meetings
    WHERE project_id = @projectId
      AND is_closed = 1
    ORDER BY meeting_index DESC
    LIMIT 1
  `).get({ projectId });
}

function getNextMeetingIndex(projectId) {
  const db = initDatabase();
  const row = db.prepare(`
    SELECT COALESCE(MAX(meeting_index), 0) + 1 AS next
    FROM meetings
    WHERE project_id = @projectId
  `).get({ projectId });
  return row.next;
}

function createMeeting({ projectId, title }) {
  const db = initDatabase();
  if (!projectId) throw new Error("projectId required");

  const existingOpen = getOpenMeetingByProject(projectId);
  if (existingOpen?.id) return existingOpen;

  const id = randomUUID();
  const meetingIndex = getNextMeetingIndex(projectId);
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO meetings (
        id,
        project_id,
        meeting_index,
        title,
        is_closed,
        pdf_show_ampel,
        todo_snapshot_json,
        next_meeting_enabled,
        next_meeting_date,
        next_meeting_time,
        next_meeting_place,
        next_meeting_extra,
        created_at,
        updated_at
      )
      VALUES (
        @id,
        @projectId,
        @meetingIndex,
        @title,
        0,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        @now,
        @now
      )
    `).run({
      id,
      projectId,
      meetingIndex,
      title: title || null,
      now,
    });
  } catch (err) {
    const msg = String(err?.message || "");
    if (msg.toLowerCase().includes("idx_meetings_one_open_per_project")) {
      const openAfterRace = getOpenMeetingByProject(projectId);
      if (openAfterRace?.id) return openAfterRace;
    }
    throw err;
  }

  return getMeetingById(id);
}

function closeMeeting(meetingId, { pdfShowAmpel, todoSnapshotJson, nextMeeting } = {}) {
  const db = initDatabase();
  if (!meetingId) throw new Error("meetingId required");
  if (nextMeeting == null) {
    const existing = getMeetingById(meetingId);
    if (existing) {
      nextMeeting = {
        enabled: existing.next_meeting_enabled,
        optionAEnabled: existing.next_meeting_option_a_enabled,
        optionBEnabled: existing.next_meeting_option_b_enabled,
        optionBText: existing.next_meeting_option_b_text,
        date: existing.next_meeting_date,
        time: existing.next_meeting_time,
        place: existing.next_meeting_place,
        extra: existing.next_meeting_extra,
      };
    }
  }

  const now = new Date().toISOString();
  const frozenAmpel = pdfShowAmpel === undefined ? null : (pdfShowAmpel ? 1 : 0);
  const snapshotRaw =
    todoSnapshotJson === undefined || todoSnapshotJson === null
      ? null
      : String(todoSnapshotJson);
  const nextMeetingEnabledRaw = nextMeeting?.enabled;
  const nextMeetingEnabled =
    nextMeetingEnabledRaw === undefined || nextMeetingEnabledRaw === null
      ? null
      : (String(nextMeetingEnabledRaw).trim().toLowerCase() === "1" ||
          String(nextMeetingEnabledRaw).trim().toLowerCase() === "true" ||
          String(nextMeetingEnabledRaw).trim().toLowerCase() === "yes" ||
          String(nextMeetingEnabledRaw).trim().toLowerCase() === "ja" ||
          String(nextMeetingEnabledRaw).trim().toLowerCase() === "on")
        ? 1
        : 0;
  const nextMeetingDate =
    nextMeeting?.date === undefined || nextMeeting?.date === null ? null : String(nextMeeting.date).trim();
  const nextMeetingTime =
    nextMeeting?.time === undefined || nextMeeting?.time === null ? null : String(nextMeeting.time).trim();
  const nextMeetingPlace =
    nextMeeting?.place === undefined || nextMeeting?.place === null ? null : String(nextMeeting.place).trim();
  const nextMeetingExtra =
    nextMeeting?.extra === undefined || nextMeeting?.extra === null ? null : String(nextMeeting.extra).trim();
  const parseNextMeetingFlag = (value, fallback) => value === undefined || value === null
    ? fallback
    : (String(value).trim().toLowerCase() === "1" ||
        String(value).trim().toLowerCase() === "true" ||
        String(value).trim().toLowerCase() === "yes" ||
        String(value).trim().toLowerCase() === "ja" ||
        String(value).trim().toLowerCase() === "on") ? 1 : 0;
  const existingMeeting = getMeetingById(meetingId);
  const nextMeetingOptionAEnabled = parseNextMeetingFlag(
    nextMeeting?.optionAEnabled,
    existingMeeting?.next_meeting_option_a_enabled ?? 1
  );
  const nextMeetingOptionBEnabled = parseNextMeetingFlag(
    nextMeeting?.optionBEnabled,
    existingMeeting?.next_meeting_option_b_enabled ?? 0
  );
  const nextMeetingOptionBText = nextMeeting?.optionBText === undefined
    ? existingMeeting?.next_meeting_option_b_text ?? null
    : nextMeeting?.optionBText === null ? null : String(nextMeeting.optionBText);

  const info = db.prepare(`
    UPDATE meetings
    SET
      is_closed = 1,
      updated_at = @now,
      pdf_show_ampel = @pdfShowAmpel,
      todo_snapshot_json = @todoSnapshotJson,
      next_meeting_enabled = @nextMeetingEnabled,
      next_meeting_option_a_enabled = @nextMeetingOptionAEnabled,
      next_meeting_option_b_enabled = @nextMeetingOptionBEnabled,
      next_meeting_option_b_text = @nextMeetingOptionBText,
      next_meeting_date = @nextMeetingDate,
      next_meeting_time = @nextMeetingTime,
      next_meeting_place = @nextMeetingPlace,
      next_meeting_extra = @nextMeetingExtra
    WHERE id = @id AND is_closed = 0
  `).run({
    id: meetingId,
    now,
    pdfShowAmpel: frozenAmpel,
    todoSnapshotJson: snapshotRaw,
    nextMeetingEnabled,
    nextMeetingOptionAEnabled,
    nextMeetingOptionBEnabled,
    nextMeetingOptionBText,
    nextMeetingDate,
    nextMeetingTime,
    nextMeetingPlace,
    nextMeetingExtra,
  });

  return { changed: info.changes, meeting: getMeetingById(meetingId) };
}

function updateNextMeeting({ meetingId, nextMeeting = {} } = {}) {
  const db = initDatabase();
  if (!meetingId) throw new Error("meetingId required");
  const existing = getMeetingById(meetingId);
  if (!existing) throw new Error("Besprechung nicht gefunden");
  if (Number(existing.is_closed) === 1) throw new Error("Besprechung ist geschlossen");

  const flag = (value, fallback) => value === undefined
    ? fallback
    : [true, 1, "1", "true", "yes", "ja", "on"].includes(value);
  const valueOrExisting = (key, column) => nextMeeting[key] === undefined
    ? existing[column]
    : nextMeeting[key] == null ? null : String(nextMeeting[key]).trim();
  const multilineOrExisting = (key, column) => nextMeeting[key] === undefined
    ? existing[column]
    : nextMeeting[key] == null ? null : String(nextMeeting[key]);

  db.prepare(`
    UPDATE meetings SET
      next_meeting_enabled = @enabled,
      next_meeting_option_a_enabled = @optionAEnabled,
      next_meeting_option_b_enabled = @optionBEnabled,
      next_meeting_option_b_text = @optionBText,
      next_meeting_date = @date,
      next_meeting_time = @time,
      next_meeting_place = @place,
      next_meeting_extra = @extra,
      updated_at = @now
    WHERE id = @meetingId
  `).run({
    meetingId,
    enabled: flag(nextMeeting.enabled, existing.next_meeting_enabled) ? 1 : 0,
    optionAEnabled: flag(nextMeeting.optionAEnabled, existing.next_meeting_option_a_enabled ?? 1) ? 1 : 0,
    optionBEnabled: flag(nextMeeting.optionBEnabled, existing.next_meeting_option_b_enabled ?? 0) ? 1 : 0,
    optionBText: multilineOrExisting("optionBText", "next_meeting_option_b_text"),
    date: valueOrExisting("date", "next_meeting_date"),
    time: valueOrExisting("time", "next_meeting_time"),
    place: valueOrExisting("place", "next_meeting_place"),
    extra: valueOrExisting("extra", "next_meeting_extra"),
    now: new Date().toISOString(),
  });
  return getMeetingById(meetingId);
}

function updateMeetingTitle({ meetingId, title }) {
  const db = initDatabase();
  if (!meetingId) throw new Error("meetingId required");
  const now = new Date().toISOString();
  const nextTitle = String(title || "").trim() || null;
  const info = db
    .prepare(`
      UPDATE meetings
      SET
        title = @title,
        updated_at = @now
      WHERE id = @id
    `)
    .run({
      id: meetingId,
      title: nextTitle,
      now,
    });
  return { changed: info.changes, meeting: getMeetingById(meetingId) };
}

module.exports = {
  getMeetingById,
  listByProject,
  getOpenMeetingByProject,
  getLastClosedMeetingByProject,
  createMeeting,
  closeMeeting,
  updateNextMeeting,
  updateMeetingTitle,
};
