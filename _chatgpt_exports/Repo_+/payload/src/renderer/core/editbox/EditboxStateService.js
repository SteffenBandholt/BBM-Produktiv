export const EDITBOX_STATE = Object.freeze({
  EMPTY: "empty",
  NORMAL: "normal",
  READ_ONLY: "read-only",
  DISABLED: "disabled",
  BUSY: "busy",
});

export class EditboxStateService {
  normalize(state) {
    const raw = String(state || "").trim().toLowerCase();
    switch (raw) {
      case EDITBOX_STATE.EMPTY:
        return EDITBOX_STATE.EMPTY;
      case EDITBOX_STATE.READ_ONLY:
      case "readonly":
        return EDITBOX_STATE.READ_ONLY;
      case EDITBOX_STATE.DISABLED:
        return EDITBOX_STATE.DISABLED;
      case EDITBOX_STATE.BUSY:
        return EDITBOX_STATE.BUSY;
      case EDITBOX_STATE.NORMAL:
      default:
        return EDITBOX_STATE.NORMAL;
    }
  }

  resolveControlState(state) {
    const mode = this.normalize(state);
    return {
      mode,
      isEmpty: mode === EDITBOX_STATE.EMPTY,
      isReadOnly: mode === EDITBOX_STATE.READ_ONLY,
      isDisabled: mode === EDITBOX_STATE.DISABLED || mode === EDITBOX_STATE.BUSY,
      isBusy: mode === EDITBOX_STATE.BUSY,
    };
  }
}

