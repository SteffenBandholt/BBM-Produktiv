function toIdOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  return value;
}

function toObject(value) {
  return value && typeof value === "object" ? value : {};
}

export function createLoadByMeetingRequest(input) {
  const meetingId =
    input && typeof input === "object" && !Array.isArray(input)
      ? toIdOrNull(input.meetingId)
      : toIdOrNull(input);
  return { meetingId };
}

export function createSaveTopRequest(input = {}) {
  const src = toObject(input);
  return {
    meetingId: toIdOrNull(src.meetingId),
    topId: toIdOrNull(src.topId),
    patch: toObject(src.patch),
  };
}

export function createCreateTopRequest(input = {}) {
  const src = toObject(input);
  return {
    projectId: toIdOrNull(src.projectId),
    meetingId: toIdOrNull(src.meetingId),
    level: Number(src.level) || 1,
    parentTopId: src.parentTopId ?? null,
    title: String(src.title || ""),
  };
}

export function createMoveTopRequest(input = {}) {
  const src = toObject(input);
  return {
    topId: toIdOrNull(src.topId),
    targetParentId: src.targetParentId ?? null,
  };
}

export function createDeleteTopRequest(input) {
  const topId =
    input && typeof input === "object" && !Array.isArray(input)
      ? toIdOrNull(input.topId)
      : toIdOrNull(input);
  return { topId };
}

export function toApiSaveTopPayload(req = {}) {
  return {
    meetingId: req.meetingId ?? null,
    topId: req.topId ?? null,
    patch: toObject(req.patch),
  };
}

export function toApiCreateTopPayload(req = {}) {
  return {
    projectId: req.projectId ?? null,
    meetingId: req.meetingId ?? null,
    level: Number(req.level) || 1,
    parentTopId: req.parentTopId ?? null,
    title: String(req.title || ""),
  };
}

export function toApiMoveTopPayload(req = {}) {
  return {
    topId: req.topId ?? null,
    targetParentId: req.targetParentId ?? null,
  };
}

export function toApiDeleteTopPayload(req = {}) {
  return {
    topId: req.topId ?? null,
  };
}

export function createLoadByMeetingResult(res) {
  return {
    ok: !!res?.ok,
    meeting: res?.meeting || null,
    list: Array.isArray(res?.list) ? res.list : [],
    error: res?.error || null,
  };
}

export function createMutationResult(res) {
  const src = toObject(res);
  return {
    ...src,
    ok: !!res?.ok,
    top: res?.top || null,
    error: res?.error || null,
  };
}

export function createRepositoryUnavailableResult(message, kind) {
  if (kind === "load") {
    return {
      ok: false,
      meeting: null,
      list: [],
      error: message,
    };
  }
  return {
    ok: false,
    top: null,
    error: message,
  };
}
