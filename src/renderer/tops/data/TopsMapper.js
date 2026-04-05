export function mapLoadByMeetingResult(res) {
  return {
    ok: !!res?.ok,
    meeting: res?.meeting || null,
    list: Array.isArray(res?.list) ? res.list : [],
    error: res?.error || null,
  };
}

export function mapMutationResult(res) {
  return {
    ok: !!res?.ok,
    top: res?.top || null,
    error: res?.error || null,
    ...res,
  };
}

