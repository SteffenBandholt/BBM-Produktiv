import TopsView from "../../views/TopsView.js";

// LEGACY-BOUNDARY: kapselt den verbleibenden Legacy-Close-/Output-Flow.
// TOPS-V2: TopsScreen kennt TopsView nicht mehr direkt.
// REMOVE-IN-PHASE-X: durch vollstaendigen v2-CloseFlow ersetzen.
export class TopsCloseFlow {
  constructor(options = {}) {
    this.legacyView = new TopsView(options);
  }

  setContext({ projectId, meetingId, meetingMeta, isReadOnly } = {}) {
    if (!this.legacyView) return;
    this.legacyView.projectId = projectId ?? this.legacyView.projectId ?? null;
    this.legacyView.meetingId = meetingId ?? this.legacyView.meetingId ?? null;
    this.legacyView.meetingMeta = meetingMeta || null;
    this.legacyView.isReadOnly = !!isReadOnly;
  }

  async run() {
    if (typeof this.legacyView?._runCloseMeetingOutputFlow !== "function") return;
    await this.legacyView._runCloseMeetingOutputFlow();
  }

  async destroy() {
    if (typeof this.legacyView?.destroy === "function") {
      await this.legacyView.destroy();
    }
  }
}
