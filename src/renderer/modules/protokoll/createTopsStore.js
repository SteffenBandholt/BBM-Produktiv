// TOPS-V2 state shape (minimal, bewusst klein):
// {
//   projectId: number|null,
//   meetingId: number|null,
//   tops: Array<object>,
//   selectedTopId: number|string|null,
//   editor: object,
//   isReadOnly: boolean,
//   isMoveMode: boolean,
//   isLoading: boolean,
//   isWriting: boolean,
//   error: string|null
// }

export function createTopsStore(initialState = {}) {
  const baseState = {
    projectId: null,
    meetingId: null,
    tops: [],
    selectedTopId: null,
    editor: {},
    isReadOnly: false,
    isMoveMode: false,
    isLoading: false,
    isWriting: false,
    error: null,
    ...initialState,
  };

  let state = { ...baseState };
  const listeners = new Set();

  const getState = () => state;

  const setState = (partial) => {
    if (!partial || typeof partial !== "object") return state;
    const next = { ...state, ...partial };
    if (next === state) return state;
    state = next;
    for (const listener of listeners) {
      try {
        listener(state);
      } catch (_e) {
        // Listener errors must not break store updates.
      }
    }
    return state;
  };

  const subscribe = (listener) => {
    if (typeof listener !== "function") return () => {};
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const reset = () => {
    state = { ...baseState };
    for (const listener of listeners) {
      try {
        listener(state);
      } catch (_e) {
        // Listener errors must not break store updates.
      }
    }
    return state;
  };

  return { getState, setState, subscribe, reset };
}
