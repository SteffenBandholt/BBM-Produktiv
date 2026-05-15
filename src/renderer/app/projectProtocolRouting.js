function normalizeProjectProtocolMeetingList(meetings) {
  if (!Array.isArray(meetings)) return [];
  return meetings.filter((item) => item && typeof item === "object");
}

export function resolveProjectProtocolEntry({ projectId, meetings } = {}) {
  const effectiveProjectId = String(projectId || "").trim();
  if (!effectiveProjectId) {
    return {
      ok: false,
      reason: "missing-project",
      target: "blocked",
      projectId: null,
      meetingId: null,
      openMeetingCount: 0,
      openMeetings: [],
    };
  }

  const normalizedMeetings = normalizeProjectProtocolMeetingList(meetings);
  const openMeetings = normalizedMeetings.filter((meeting) => Number(meeting?.is_closed) !== 1);

  if (openMeetings.length === 1) {
    return {
      ok: true,
      reason: "single-open-meeting",
      target: "tops",
      projectId: effectiveProjectId,
      meetingId: openMeetings[0]?.id || null,
      openMeetingCount: 1,
      openMeetings,
    };
  }

  if (openMeetings.length === 0) {
    return {
      ok: true,
      reason: "no-open-meeting",
      target: "meetings",
      projectId: effectiveProjectId,
      meetingId: null,
      openMeetingCount: 0,
      openMeetings,
    };
  }

  return {
    ok: false,
    reason: "multiple-open-meetings",
    target: "meetings",
    projectId: effectiveProjectId,
    meetingId: null,
    openMeetingCount: openMeetings.length,
    openMeetings,
  };
}
