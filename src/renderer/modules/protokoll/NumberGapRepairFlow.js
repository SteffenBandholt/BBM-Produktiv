import { NumberGapRepairPopup } from "./NumberGapRepairPopup.js";

export class NumberGapRepairFlow {
  constructor({ view, clearGapPopup } = {}) {
    this.view = view;
    this.popup = new NumberGapRepairPopup({
      view: this.view,
      clearGapPopup: typeof clearGapPopup === "function" ? clearGapPopup : null,
    });
  }

  async handleNumberGap({ gap, markTopIds, onResolved }) {
    this.view._setMarkedTopIds(markTopIds || []);
    await this.popup.showNumberGapPopup({
      gap,
      onCancel: () => {
        this.view._clearMarkedTopIds();
      },
      onConfirm: async () => {
        const fixRes = await window.bbmDb.meetingTopsFixNumberGap({
          meetingId: this.view.meetingId,
          level: gap?.level,
          parentTopId: gap?.parentTopId ?? null,
          fromTopId: gap?.lastTopId,
          toNumber: gap?.missingNumber,
        });

        if (!fixRes?.ok) {
          alert(fixRes?.error || fixRes?.errorCode || "Reparatur fehlgeschlagen");
          return;
        }

        this.popup._hidePopup();
        this.view._clearMarkedTopIds();
        await this.view.reloadList(true);
        if (typeof onResolved === "function") await onResolved();
      },
    });
  }
}
