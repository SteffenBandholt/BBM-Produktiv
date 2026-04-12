import { applyPopupButtonStyle, applyPopupCardStyle } from "../../ui/popupButtonStyles.js";
import { CreateMeetingModal } from "../../modules/protokoll/CreateMeetingModal.js";

export class TopsViewDialogs {
  constructor({ view }) {
    this.view = view;
    this.createMeetingModal = new CreateMeetingModal({ view: this.view });
  }

  clearGapPopup() {
    if (this.view._gapPopupOverlay && this.view._gapPopupOverlay.parentElement) {
      this.view._gapPopupOverlay.parentElement.removeChild(this.view._gapPopupOverlay);
    }
    this.view._gapPopupOverlay = null;
  }

  buildGapDetailsText(gap) {
    const lvl = Number(gap?.level || 0);
    const missingNumber = gap?.missingNumber ?? "?";
    const lastNumber = gap?.lastNumber ?? "?";
    const parentTopId = gap?.parentTopId ?? null;

    if (!parentTopId) {
      return [
        `Betroffene Ebene: Level ${lvl}`,
        `Bei Level 1 fehlt Nummer ${missingNumber}.`,
        `Vorschlag: Letzten TOP (Nr. ${lastNumber}) in die Lücke setzen.`,
      ];
    }

    const parent = (this.view.items || []).find((t) => String(t.id) === String(parentTopId));
    const parentNum = parent?.displayNumber ?? parent?.number ?? "";
    const parentTitle = parent?.title ? String(parent.title) : "";
    const parentLabel = parent ? `${parentNum ? `${parentNum}. ` : ""}${parentTitle || "TOP"}` : `TOP ${parentTopId}`;

    return [
      `Betroffene Ebene: Level ${lvl}`,
      `Unter TOP ${parentLabel} fehlt Nummer ${missingNumber}.`,
      `Vorschlag: Letzten TOP (Nr. ${lastNumber}) in die Lücke setzen.`,
    ];
  }

  async showNumberGapPopup({ gap, onConfirm, onCancel }) {
    this.clearGapPopup();

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.35)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "20000";
    overlay.tabIndex = -1;

    const card = document.createElement("div");
    card.style.width = "min(560px, 92vw)";
    card.style.maxHeight = "80vh";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.background = "#fff";
    card.style.borderRadius = "10px";
    card.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
    applyPopupCardStyle(card);

    const header = document.createElement("div");
    header.style.padding = "14px 16px 10px 16px";
    header.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
    header.style.fontWeight = "700";
    header.textContent = "Nummernlücke gefunden";

    const content = document.createElement("div");
    content.style.padding = "12px 16px";
    content.style.overflow = "auto";
    content.style.flex = "1 1 auto";
    content.style.lineHeight = "1.4";

    const intro = document.createElement("div");
    intro.textContent = "Das Protokoll kann erst geschlossen werden, wenn die Nummerierung lückenlos ist.";
    intro.style.marginBottom = "8px";
    content.appendChild(intro);

    const lines = this.buildGapDetailsText(gap);
    for (const line of lines) {
      const p = document.createElement("div");
      p.textContent = line;
      p.style.marginBottom = "6px";
      content.appendChild(p);
    }

    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.justifyContent = "flex-end";
    footer.style.gap = "8px";
    footer.style.padding = "10px 16px";
    footer.style.borderTop = "1px solid rgba(0,0,0,0.08)";
    footer.style.background = "rgba(255,255,255,0.98)";

    const btnCancel = document.createElement("button");
    btnCancel.textContent = "Abbrechen";
    applyPopupButtonStyle(btnCancel, { variant: "neutral" });

    const btnOk = document.createElement("button");
    btnOk.textContent = "Letzten TOP in Lücke setzen";
    applyPopupButtonStyle(btnOk, { variant: "primary" });
    const canRepair = !!gap?.lastTopId;
    btnOk.disabled = !canRepair;
    btnOk.style.opacity = canRepair ? "1" : "0.55";

    btnCancel.onclick = () => {
      this.clearGapPopup();
      if (typeof onCancel === "function") onCancel();
    };

    btnOk.onclick = async () => {
      if (!gap?.lastTopId) {
        alert("Reparatur nicht möglich: letzter TOP nicht ermittelt");
        return;
      }
      if (typeof onConfirm === "function") await onConfirm();
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.clearGapPopup();
        if (typeof onCancel === "function") onCancel();
      }
    };
    overlay.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      this.clearGapPopup();
      if (typeof onCancel === "function") onCancel();
    });

    footer.append(btnCancel, btnOk);
    card.append(header, content, footer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    try {
      overlay.focus();
    } catch (_e) {
      // ignore
    }

    this.view._gapPopupOverlay = overlay;
  }

  async handleNumberGap({ gap, markTopIds, onResolved }) {
    this.view._setMarkedTopIds(markTopIds || []);
    await this.showNumberGapPopup({
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

        this.clearGapPopup();
        this.view._clearMarkedTopIds();
        await this.view.reloadList(true);
        if (typeof onResolved === "function") await onResolved();
      },
    });
  }

  async openMeetingKeywordPopup() {
    const api = window.bbmDb || {};
    if (typeof api.meetingsUpdateTitle !== "function") {
      alert("Meeting-Update ist nicht verfuegbar.");
      return;
    }

    const parts = this.view._parseMeetingTitleParts();

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.35)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1400";
    overlay.tabIndex = -1;

    const modal = document.createElement("div");
    applyPopupCardStyle(modal);
    modal.style.width = "min(560px, calc(100vw - 24px))";
    modal.style.background = "#fff";
    modal.style.padding = "12px";
    modal.style.display = "grid";
    modal.style.gap = "10px";

    const title = document.createElement("div");
    title.textContent = "Schlagwort bearbeiten";
    title.style.fontWeight = "700";

    const mkReadOnly = (labelText, value) => {
      const row = document.createElement("div");
      row.style.display = "grid";
      row.style.gridTemplateColumns = "170px 1fr";
      row.style.gap = "8px";

      const lab = document.createElement("div");
      lab.textContent = labelText;

      const inp = document.createElement("input");
      inp.type = "text";
      inp.readOnly = true;
      inp.value = String(value || "");
      inp.style.width = "100%";

      row.append(lab, inp);
      return row;
    };

    const rowKeyword = document.createElement("div");
    rowKeyword.style.display = "grid";
    rowKeyword.style.gridTemplateColumns = "170px 1fr";
    rowKeyword.style.gap = "8px";

    const keywordLabel = document.createElement("div");
    keywordLabel.textContent = "Schlagwort";

    const keywordInput = document.createElement("input");
    keywordInput.type = "text";
    keywordInput.value = parts.meetingKeyword || "";
    keywordInput.maxLength = 120;
    keywordInput.style.width = "100%";

    rowKeyword.append(keywordLabel, keywordInput);

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";

    const btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.textContent = "Abbrechen";
    applyPopupButtonStyle(btnCancel);

    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.textContent = "Loeschen";
    applyPopupButtonStyle(btnDelete);

    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.textContent = "Speichern";
    applyPopupButtonStyle(btnSave, { variant: "primary" });

    actions.append(btnCancel, btnDelete, btnSave);

    const close = () => {
      try {
        overlay.remove();
      } catch (_e) {
        // ignore
      }
    };

    const applyKeyword = async (nextKeywordRaw) => {
      const nextKeyword = String(nextKeywordRaw || "").trim();
      const titleValue = parts.meetingDateText
        ? (nextKeyword ? `${parts.meetingDateText} - ${nextKeyword}` : parts.meetingDateText)
        : nextKeyword;

      const res = await api.meetingsUpdateTitle({
        meetingId: this.view.meetingId,
        title: titleValue,
      });

      if (!res?.ok) {
        alert(res?.error || "Schlagwort konnte nicht gespeichert werden.");
        return;
      }

      if (res.meeting) {
        this.view.meetingMeta = res.meeting;
        this.view.isReadOnly = this.view.meetingMeta
          ? Number(this.view.meetingMeta.is_closed) === 1
          : false;
      }

      this.view._updateTopBarProtocolTitle();
      close();
    };

    btnSave.onclick = async () => {
      await applyKeyword(keywordInput.value);
    };

    btnDelete.onclick = async () => {
      await applyKeyword("");
    };

    btnCancel.onclick = () => close();

    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) close();
    });

    overlay.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      close();
    });

    modal.append(
      title,
      mkReadOnly("Besprechungsnummer", parts.meetingIndex),
      mkReadOnly("Datum", parts.meetingDateText),
      rowKeyword,
      actions
    );

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    setTimeout(() => {
      try {
        keywordInput.focus();
        keywordInput.select();
      } catch (_e) {
        // ignore
      }
    }, 0);
  }

  async handleOpenMeetingKeyword() {
    return this.openMeetingKeywordPopup();
  }

  async handleCreateMeeting(params) {
    return this.createMeetingModal.handleCreateMeeting(params);
  }
}
