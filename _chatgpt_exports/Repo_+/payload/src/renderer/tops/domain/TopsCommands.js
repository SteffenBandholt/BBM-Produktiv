import {
  createLoadByMeetingRequest,
  createSaveTopRequest,
  createDeleteTopRequest,
} from "../data/TopsDtos.js";

// Fachmodul `Protokoll`:
// Screen-nahe Befehle fuer Laden, Draft-Speichern, Loeschen und Bewegungsmodus.
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
    const previousSelectedTopId = this._getState().selectedTopId ?? null;
    const meetingKey = meetingId ?? this._getState().meetingId ?? null;
    const loadReq = createLoadByMeetingRequest({ meetingId: meetingKey });
    this._setState({
      isLoading: true,
      error: null,
      meetingId: loadReq.meetingId,
      projectId: projectId ?? this._getState().projectId ?? null,
    });

    if (!this.repository || typeof this.repository.loadByMeeting !== "function") {
      this._setState({ isLoading: false, error: "TopsRepository unavailable" });
      return { ok: false, error: "TopsRepository unavailable", meeting: null, list: [] };
    }

    try {
      const res = await this.repository.loadByMeeting(loadReq);
      const list = Array.isArray(res?.list) ? res.list : [];
      const isReadOnly = Number(res?.meeting?.is_closed) === 1;
      const selectedStillExists =
        previousSelectedTopId !== null &&
        previousSelectedTopId !== undefined &&
        list.some((top) => String(top?.id) === String(previousSelectedTopId));

      this._setState({
        isLoading: false,
        error: res?.ok ? null : res?.error || "load failed",
        tops: list,
        selectedTopId: selectedStillExists ? previousSelectedTopId : null,
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
    this._setState({ error: null });
    const req = createSaveTopRequest({
      meetingId: state.meetingId ?? null,
      topId: state.selectedTopId ?? null,
      patch: patch || {},
    });
    if (!req.meetingId || !req.topId) {
      const error = "meetingId or selectedTopId missing";
      this._setState({ error });
      return { ok: false, error };
    }
    if (!this.repository || typeof this.repository.saveTop !== "function") {
      const error = "TopsRepository unavailable";
      this._setState({ error });
      return { ok: false, error };
    }

    let res;
    try {
      res = await this.repository.saveTop(req);
    } catch (err) {
      const error = err?.message ? String(err.message) : String(err || "save failed");
      this._setState({ error });
      return { ok: false, error };
    }
    if (!res?.ok) {
      this._setState({ error: res?.error || "save failed" });
      return res;
    }

    const reloadRes = await this.loadTops({
      meetingId: state.meetingId ?? null,
      projectId: state.projectId ?? null,
    });
    if (!reloadRes?.ok) return reloadRes;

    return reloadRes;
  }

  async deleteSelectedTop() {
    const state = this._getState();
    this._setState({ error: null });
    const req = createDeleteTopRequest({ topId: state.selectedTopId ?? null });
    if (!req.topId) {
      const error = "selectedTopId missing";
      this._setState({ error });
      return { ok: false, error };
    }
    if (!this.repository || typeof this.repository.deleteTop !== "function") {
      const error = "TopsRepository unavailable";
      this._setState({ error });
      return { ok: false, error };
    }

    let res;
    try {
      res = await this.repository.deleteTop(req);
    } catch (err) {
      const error = err?.message ? String(err.message) : String(err || "delete failed");
      this._setState({ error });
      return { ok: false, error };
    }
    if (!res?.ok) {
      this._setState({ error: res?.error || "delete failed" });
      return res;
    }

    this._setState({ selectedTopId: null });

    const reloadRes = await this.loadTops({
      meetingId: state.meetingId ?? null,
      projectId: state.projectId ?? null,
    });
    if (!reloadRes?.ok) return reloadRes;

    return reloadRes;
  }

  toggleMoveMode(forceValue) {
    const current = !!this._getState().isMoveMode;
    const next = typeof forceValue === "boolean" ? forceValue : !current;
    this._setState({ isMoveMode: next });
    return next;
  }
}
