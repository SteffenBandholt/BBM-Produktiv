export class TopsCommands {
  constructor({ store, repository } = {}) {
    this.store = store;
    this.repository = repository;
  }

  _setState(partial) {
    if (!this.store || typeof this.store.setState !== "function") return null;
    return this.store.setState(partial);
  }

  _getState() {
    if (!this.store || typeof this.store.getState !== "function") return {};
    return this.store.getState() || {};
  }

  async loadTops({ meetingId, projectId } = {}) {
    const meetingKey = meetingId ?? this._getState().meetingId ?? null;
    this._setState({
      isLoading: true,
      error: null,
      meetingId: meetingKey,
      projectId: projectId ?? this._getState().projectId ?? null,
    });

    if (!this.repository || typeof this.repository.loadByMeeting !== "function") {
      this._setState({ isLoading: false, error: "TopsRepository unavailable" });
      return { ok: false, error: "TopsRepository unavailable", meeting: null, list: [] };
    }

    try {
      const res = await this.repository.loadByMeeting(meetingKey);
      const list = Array.isArray(res?.list) ? res.list : [];
      const isReadOnly = Number(res?.meeting?.is_closed) === 1;

      this._setState({
        isLoading: false,
        error: res?.ok ? null : res?.error || "load failed",
        tops: list,
        isReadOnly,
        meetingMeta: res?.meeting || null,
      });
      return res;
    } catch (err) {
      const error = err?.message ? String(err.message) : String(err || "load failed");
      this._setState({ isLoading: false, error });
      return { ok: false, error, meeting: null, list: [] };
    }
  }

  selectTop(topId) {
    this._setState({ selectedTopId: topId ?? null });
    return this._getState().selectedTopId;
  }

  updateDraft(patch = {}) {
    const state = this._getState();
    const current = state.editor && typeof state.editor === "object" ? state.editor : {};
    this._setState({ editor: { ...current, ...(patch || {}) } });
    return this._getState().editor;
  }

  async saveDraft(patch = {}) {
    const state = this._getState();
    const meetingId = state.meetingId ?? null;
    const topId = state.selectedTopId ?? null;
    if (!meetingId || !topId) {
      return { ok: false, error: "meetingId or selectedTopId missing" };
    }
    if (!this.repository || typeof this.repository.saveTop !== "function") {
      return { ok: false, error: "TopsRepository unavailable" };
    }

    const res = await this.repository.saveTop({ meetingId, topId, patch: patch || {} });
    if (res?.ok) this.updateDraft(patch);
    return res;
  }

  async deleteSelectedTop() {
    const state = this._getState();
    const topId = state.selectedTopId ?? null;
    if (!topId) return { ok: false, error: "selectedTopId missing" };
    if (!this.repository || typeof this.repository.deleteTop !== "function") {
      return { ok: false, error: "TopsRepository unavailable" };
    }

    const res = await this.repository.deleteTop(topId);
    if (res?.ok) {
      this._setState({ selectedTopId: null });
    }
    return res;
  }

  toggleMoveMode(forceValue) {
    const current = !!this._getState().isMoveMode;
    const next = typeof forceValue === "boolean" ? forceValue : !current;
    this._setState({ isMoveMode: next });
    return next;
  }
}
