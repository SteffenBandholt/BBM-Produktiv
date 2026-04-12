import { applyPopupButtonStyle, applyPopupCardStyle } from "../../ui/popupButtonStyles.js";
import { NumberGapRepairFlow } from "../../modules/protokoll/NumberGapRepairFlow.js";

export class TopsViewDialogs {
  constructor({ view }) {
    this.view = view;
    this.numberGapRepairFlow = new NumberGapRepairFlow({
      view: this.view,
      clearGapPopup: () => this.clearGapPopup(),
    });
  }

  clearGapPopup() {
    if (this.view._gapPopupOverlay && this.view._gapPopupOverlay.parentElement) {
      this.view._gapPopupOverlay.parentElement.removeChild(this.view._gapPopupOverlay);
    }
    this.view._gapPopupOverlay = null;
  }

  async handleNumberGap({ gap, markTopIds, onResolved }) {
    return this.numberGapRepairFlow.handleNumberGap({ gap, markTopIds, onResolved });
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
    return this.openCreateMeetingModal(params);
  }

  openCreateMeetingModal({ dateISO, keyword = "", editParticipants = true } = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.background = "rgba(0,0,0,0.35)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "9999";

      const panel = document.createElement("div");
      panel.style.background = "#fff";
      panel.style.borderRadius = "12px";
      panel.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
      panel.style.width = "min(520px, calc(100vw - 32px))";
      panel.style.padding = "16px";

      const h = document.createElement("div");
      h.textContent = "Neue Besprechung";
      h.style.fontWeight = "700";
      h.style.fontSize = "16px";
      h.style.marginBottom = "12px";
      panel.appendChild(h);

      const row = (labelText, inputEl) => {
        const r = document.createElement("div");
        r.style.display = "flex";
        r.style.flexDirection = "column";
        r.style.gap = "6px";
        r.style.marginBottom = "12px";

        const lab = document.createElement("div");
        lab.textContent = labelText;
        lab.style.fontSize = "12px";
        lab.style.color = "#444";
        r.appendChild(lab);

        r.appendChild(inputEl);
        return r;
      };

      const inpDate = document.createElement("input");
      inpDate.type = "date";
      if (typeof dateISO === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateISO)) inpDate.value = dateISO;
      inpDate.style.padding = "10px 12px";
      inpDate.style.borderRadius = "10px";
      inpDate.style.border = "1px solid rgba(0,0,0,0.2)";
      panel.appendChild(row("Datum der Besprechung", inpDate));

      const inpKw = document.createElement("input");
      inpKw.type = "text";
      inpKw.placeholder = "Schlagwort (optional)";
      inpKw.value = String(keyword || "");
      inpKw.style.padding = "10px 12px";
      inpKw.style.borderRadius = "10px";
      inpKw.style.border = "1px solid rgba(0,0,0,0.2)";
      panel.appendChild(row("Schlagwort", inpKw));

      const chkWrap = document.createElement("label");
      chkWrap.style.display = "flex";
      chkWrap.style.alignItems = "center";
      chkWrap.style.gap = "10px";
      chkWrap.style.margin = "6px 0 14px 0";
      chkWrap.style.userSelect = "none";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = !!editParticipants;

      const chkText = document.createElement("div");
      chkText.textContent = "Teilnehmer nach dem Anlegen öffnen";
      chkText.style.fontSize = "13px";

      chkWrap.appendChild(chk);
      chkWrap.appendChild(chkText);
      panel.appendChild(chkWrap);

      const btnRow = document.createElement("div");
      btnRow.style.display = "flex";
      btnRow.style.justifyContent = "flex-end";
      btnRow.style.gap = "10px";

      const btnCancel = document.createElement("button");
      btnCancel.textContent = "Abbrechen";
      btnCancel.style.padding = "10px 14px";
      btnCancel.style.borderRadius = "10px";
      btnCancel.style.border = "1px solid rgba(0,0,0,0.2)";
      btnCancel.style.background = "#fff";

      const btnOk = document.createElement("button");
      btnOk.textContent = "Übernehmen";
      btnOk.style.padding = "10px 14px";
      btnOk.style.borderRadius = "10px";
      btnOk.style.border = "1px solid rgba(0,0,0,0.2)";
      btnOk.style.background = "#fff";
      btnOk.style.fontWeight = "700";

      btnRow.appendChild(btnCancel);
      btnRow.appendChild(btnOk);
      panel.appendChild(btnRow);

      const cleanup = (res) => {
        try {
          overlay.remove();
        } catch (_e) {
          // ignore
        }
        resolve(res);
      };

      btnCancel.onclick = () => cleanup(null);
      overlay.onclick = (ev) => {
        if (ev.target === overlay) cleanup(null);
      };

      const submit = () => {
        const vDate = String(inpDate.value || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(vDate)) {
          alert("Bitte ein gültiges Datum auswählen.");
          return;
        }
        cleanup({
          dateISO: vDate,
          keyword: String(inpKw.value || "").trim(),
          editParticipants: !!chk.checked,
        });
      };

      btnOk.onclick = submit;
      inpDate.onkeydown = (ev) => {
        if (ev.key === "Enter") submit();
        if (ev.key === "Escape") cleanup(null);
      };
      inpKw.onkeydown = (ev) => {
        if (ev.key === "Enter") submit();
        if (ev.key === "Escape") cleanup(null);
      };

      document.addEventListener("keydown", function escHandler(ev) {
        if (ev.key === "Escape") {
          document.removeEventListener("keydown", escHandler);
          cleanup(null);
        }
      });

      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      setTimeout(() => {
        try {
          inpDate.focus();
        } catch (_e) {
          // ignore
        }
      }, 0);
    });
  }
}
