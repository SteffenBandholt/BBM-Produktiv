import { applyPopupButtonStyle, applyPopupCardStyle } from "../../ui/popupButtonStyles.js";

export class MeetingKeywordPopup {
  constructor({ view }) {
    this.view = view;
  }

  buildMeetingKeywordParts() {
    const parts = this.view._parseMeetingTitleParts();
    return {
      meetingIndex: parts.meetingIndex || "",
      meetingDateText: parts.meetingDateText || "",
      meetingKeyword: parts.meetingKeyword || "",
    };
  }

  async openMeetingKeywordPopup() {
    const api = window.bbmDb || {};
    if (typeof api.meetingsUpdateTitle !== "function") {
      alert("Meeting-Update ist nicht verfuegbar.");
      return;
    }

    const parts = this.buildMeetingKeywordParts();

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
}
