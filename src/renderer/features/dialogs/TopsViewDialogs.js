import { applyPopupButtonStyle } from "../../ui/popupButtonStyles.js";
import { cleanupPopupHandlers, createPopupOverlay, stylePopupCard } from "../../ui/popupCommon.js";

export function canSubmitImportMove({ topIds = [], targetParentId = null, submitting = false } = {}) {
  return !submitting && Array.isArray(topIds) && topIds.length > 0 && !!String(targetParentId || "").trim();
}

export function getProtocolAudioImportFileName(filePath) {
  const normalized = String(filePath || "").trim().replace(/\\/g, "/");
  return normalized.split("/").filter(Boolean).pop() || "Audiodatei";
}

export function getProtocolAudioImportPhaseLabel(phase) {
  switch (String(phase || "").trim().toLowerCase()) {
    case "transcription":
      return "Spracherkennung";
    case "parsing":
    case "saving":
    case "completed":
      return "TOPs speichern";
    case "preparing":
    default:
      return "Vorbereitung";
  }
}

export class TopsViewDialogs {
  constructor({ view }) {
    this.view = view;
  }

  openProtocolAudioImportProgress({
    filePath,
    operationId,
    onCancel,
    successDurationMs = 1200,
  } = {}) {
    const activeOperationId = String(operationId || "").trim();
    if (!activeOperationId) throw new Error("operationId required");

    const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.35)", zIndex: 20000 });
    overlay.style.display = "flex";
    overlay.dataset.protocolAudioImportRole = "overlay";
    overlay.dataset.protocolAudioImportOperationId = activeOperationId;

    const card = document.createElement("div");
    card.className = "bbm-popup-standard bbm-popup-dialog";
    card.dataset.protocolAudioImportRole = "dialog";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", `protocol-audio-import-title-${activeOperationId}`);
    stylePopupCard(card, { width: "min(440px, calc(100vw - 24px))", maxHeight: "calc(100vh - 24px)" });

    const header = document.createElement("div");
    header.id = `protocol-audio-import-title-${activeOperationId}`;
    header.className = "bbm-popup-header";
    header.style.fontWeight = "700";
    header.textContent = "Audio wird importiert – bitte warten.";

    const body = document.createElement("div");
    body.className = "bbm-popup-body bbm-form-content";
    body.style.display = "grid";
    body.style.gap = "10px";

    const fileName = document.createElement("div");
    fileName.dataset.protocolAudioImportRole = "file-name";
    fileName.style.overflowWrap = "anywhere";
    fileName.textContent = getProtocolAudioImportFileName(filePath);

    const phase = document.createElement("div");
    phase.dataset.protocolAudioImportRole = "phase";
    phase.style.fontWeight = "600";
    phase.textContent = "Phase: Vorbereitung";

    const progress = document.createElement("progress");
    progress.dataset.protocolAudioImportRole = "progress";
    progress.dataset.progressMode = "indeterminate";
    progress.setAttribute("aria-label", "Audioimport läuft");
    progress.style.inlineSize = "100%";

    const detail = document.createElement("div");
    detail.dataset.protocolAudioImportRole = "detail";
    detail.setAttribute("role", "status");
    detail.setAttribute("aria-live", "polite");
    detail.style.minBlockSize = "1.25em";
    detail.style.color = "var(--bbm-popup-muted, #667085)";
    detail.textContent = "Audiodatei wird vorbereitet";

    const footer = document.createElement("div");
    footer.className = "bbm-popup-footer";
    footer.style.display = "flex";
    footer.style.justifyContent = "flex-end";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.dataset.protocolAudioImportRole = "cancel";
    cancelButton.textContent = "Abbrechen";
    applyPopupButtonStyle(cancelButton, { variant: "neutral" });

    footer.appendChild(cancelButton);
    body.append(fileName, phase, progress, detail);
    card.append(header, body, footer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    let state = "running";
    let closed = false;
    let lastProgress = { phase: "preparing", message: "Audiodatei wird vorbereitet" };

    const close = () => {
      if (closed) return;
      closed = true;
      state = "closed";
      cleanupPopupHandlers(overlay);
      overlay.remove();
    };
    const renderRunningProgress = () => {
      header.textContent = "Audio wird importiert – bitte warten.";
      phase.textContent = `Phase: ${getProtocolAudioImportPhaseLabel(lastProgress.phase)}`;
      detail.textContent = String(lastProgress.message || "");
      progress.hidden = false;
      cancelButton.hidden = false;
      cancelButton.disabled = false;
      cancelButton.textContent = "Abbrechen";
    };
    const showCanceling = () => {
      if (closed || state === "success" || state === "error") return false;
      state = "canceling";
      phase.textContent = "Import wird abgebrochen …";
      detail.textContent = "Der laufende Audioimport wird gezielt beendet.";
      progress.hidden = false;
      cancelButton.disabled = true;
      return true;
    };
    const restoreAfterCancelFailure = (message) => {
      if (closed || state !== "canceling") return false;
      state = "running";
      renderRunningProgress();
      detail.textContent = String(message || "Der Audioimport konnte nicht abgebrochen werden.");
      return true;
    };

    cancelButton.onclick = async () => {
      if (!showCanceling()) return;
      try {
        const canceled = typeof onCancel === "function"
          ? await onCancel(activeOperationId)
          : false;
        if (canceled !== true) restoreAfterCancelFailure("Der Audioimport konnte nicht abgebrochen werden.");
      } catch (error) {
        restoreAfterCancelFailure(error?.message || "Der Audioimport konnte nicht abgebrochen werden.");
      }
    };

    const controller = {
      update(progressEvent = {}) {
        if (closed || state !== "running") return false;
        if (String(progressEvent?.operationId || "") !== activeOperationId) return false;
        lastProgress = {
          phase: String(progressEvent?.phase || lastProgress.phase || "preparing"),
          message: String(progressEvent?.message || ""),
        };
        renderRunningProgress();
        return true;
      },
      showCanceling,
      restoreAfterCancelFailure,
      showError(message) {
        if (closed) return false;
        state = "error";
        header.textContent = "Audioimport fehlgeschlagen";
        phase.textContent = "Fehler";
        detail.textContent = String(message || "Der Audioimport konnte nicht abgeschlossen werden.");
        progress.hidden = true;
        cancelButton.hidden = false;
        cancelButton.disabled = false;
        cancelButton.textContent = "Schließen";
        cancelButton.onclick = close;
        return true;
      },
      async showSuccess(pointCount) {
        if (closed) return false;
        state = "success";
        const count = Math.max(0, Number(pointCount) || 0);
        header.textContent = "Audioimport abgeschlossen";
        phase.textContent = `${count} TOPs importiert`;
        detail.textContent = "";
        progress.hidden = true;
        cancelButton.hidden = true;
        await new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(successDurationMs) || 0)));
        close();
        return true;
      },
      close,
      isOpen: () => !closed,
      getState: () => state,
    };

    try {
      cancelButton.focus();
    } catch (_error) {
      // Dialog remains usable without programmatic focus.
    }
    return controller;
  }

  openImportMovePopup({ points = [], targets = [], selectedTopId = null } = {}) {
    return new Promise((resolve) => {
      const sourcePoints = Array.isArray(points) ? points : [];
      const targetTitles = Array.isArray(targets) ? targets : [];
      const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.35)", zIndex: 20000 });
      overlay.style.display = "flex";
      overlay.dataset.importMoveRole = "overlay";

      const card = document.createElement("div");
      card.className = "bbm-popup-standard bbm-popup-dialog";
      card.dataset.importMoveRole = "dialog";
      stylePopupCard(card, { width: "min(720px, calc(100vw - 24px))", maxHeight: "min(720px, calc(100vh - 24px))" });

      const header = document.createElement("div");
      header.className = "bbm-popup-header";
      header.style.fontWeight = "700";
      header.textContent = "Import-TOPs verschieben";

      const body = document.createElement("div");
      body.className = "bbm-popup-body bbm-form-content";
      body.style.display = "grid";
      body.style.gap = "10px";
      body.style.minHeight = "0";

      const intro = document.createElement("div");
      intro.textContent = "Import-TOPs auswählen und gemeinsam an einen normalen Titel anhängen.";
      body.appendChild(intro);

      const longtextToggle = document.createElement("label");
      longtextToggle.style.display = "flex";
      longtextToggle.style.alignItems = "center";
      longtextToggle.style.gap = "8px";
      longtextToggle.style.width = "fit-content";

      const longtextCheckbox = document.createElement("input");
      longtextCheckbox.type = "checkbox";
      longtextCheckbox.dataset.importMoveRole = "longtext-toggle";
      const longtextLabel = document.createElement("span");
      longtextLabel.textContent = "Langtexte einblenden";
      longtextToggle.append(longtextCheckbox, longtextLabel);
      body.appendChild(longtextToggle);

      const list = document.createElement("div");
      list.dataset.importMoveRole = "point-list";
      list.style.display = "grid";
      list.style.gap = "6px";
      list.style.maxHeight = "300px";
      list.style.overflowY = "auto";
      list.style.padding = "2px";

      const checkboxes = [];
      const longtexts = [];
      for (const point of sourcePoints) {
        const row = document.createElement("label");
        row.dataset.importMovePointId = String(point?.id ?? "");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "auto minmax(0, 1fr)";
        row.style.alignItems = "start";
        row.style.gap = "8px";
        row.style.padding = "8px 10px";
        row.style.border = "1px solid #d8dee6";
        row.style.borderRadius = "8px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = String(point?.id ?? "");
        checkbox.checked = String(point?.id ?? "") === String(selectedTopId ?? "");
        checkbox.dataset.importMoveRole = "point-checkbox";
        checkboxes.push(checkbox);

        const text = document.createElement("div");
        text.style.minWidth = "0";

        const shorttext = document.createElement("div");
        shorttext.style.whiteSpace = "pre-wrap";
        shorttext.style.overflowWrap = "anywhere";
        shorttext.textContent = String(point?.title || "(ohne Bezeichnung)");
        text.appendChild(shorttext);

        const longtext = document.createElement("div");
        longtext.dataset.importMoveRole = "point-longtext";
        longtext.style.display = "none";
        longtext.style.whiteSpace = "pre-wrap";
        longtext.style.overflowWrap = "anywhere";
        longtext.style.marginTop = "6px";
        longtext.style.color = "#475569";
        longtext.textContent = String(point?.longtext || "");
        text.appendChild(longtext);
        longtexts.push(longtext);

        row.append(checkbox, text);
        list.appendChild(row);
      }
      body.appendChild(list);

      const targetLabel = document.createElement("label");
      targetLabel.className = "bbm-form-field";
      targetLabel.style.display = "grid";
      targetLabel.style.gap = "6px";
      const targetCaption = document.createElement("span");
      targetCaption.className = "bbm-form-label";
      targetCaption.textContent = "Zieltitel";
      const targetSelect = document.createElement("select");
      targetSelect.dataset.importMoveRole = "target";
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "Zieltitel auswählen …";
      targetSelect.appendChild(emptyOption);
      for (const target of targetTitles) {
        const option = document.createElement("option");
        option.value = String(target?.id ?? "");
        const number = String(target?.displayNumber || target?.number || "").trim();
        option.textContent = `${number ? `${number}. ` : ""}${String(target?.title || "(ohne Bezeichnung)")}`;
        targetSelect.appendChild(option);
      }
      targetLabel.append(targetCaption, targetSelect);
      body.appendChild(targetLabel);

      const footer = document.createElement("div");
      footer.className = "bbm-popup-footer";
      footer.style.display = "flex";
      footer.style.justifyContent = "flex-end";

      const btnCancel = document.createElement("button");
      btnCancel.type = "button";
      btnCancel.textContent = "Abbrechen";
      btnCancel.dataset.importMoveRole = "cancel";
      applyPopupButtonStyle(btnCancel, { variant: "neutral" });

      const btnMove = document.createElement("button");
      btnMove.type = "button";
      btnMove.textContent = "Verschieben";
      btnMove.dataset.importMoveRole = "submit";
      applyPopupButtonStyle(btnMove, { variant: "primary" });

      let closed = false;
      let submitting = false;
      const selectedIds = () => checkboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
      const updateSubmitState = () => {
        btnMove.disabled = !canSubmitImportMove({
          topIds: selectedIds(),
          targetParentId: targetSelect.value,
          submitting,
        });
      };
      const close = (result) => {
        if (closed) return;
        closed = true;
        cleanupPopupHandlers(overlay);
        overlay.remove();
        resolve(result);
      };

      for (const checkbox of checkboxes) checkbox.addEventListener("change", updateSubmitState);
      targetSelect.addEventListener("change", updateSubmitState);
      longtextCheckbox.addEventListener("change", () => {
        for (const longtext of longtexts) {
          longtext.style.display = longtextCheckbox.checked && longtext.textContent ? "block" : "none";
        }
      });

      btnCancel.onclick = () => close(null);
      btnMove.onclick = () => {
        if (btnMove.disabled || submitting) return;
        submitting = true;
        updateSubmitState();
        close({
          topIds: selectedIds(),
          targetParentId: String(targetSelect.value || ""),
        });
      };
      overlay.addEventListener("mousedown", (event) => {
        if (event.target === overlay && !submitting) close(null);
      });
      overlay.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || submitting) return;
        event.preventDefault();
        close(null);
      });

      footer.append(btnCancel, btnMove);
      card.append(header, body, footer);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      updateSubmitState();
      setTimeout(() => {
        try {
          targetSelect.focus();
        } catch (_error) {
          // Dialog remains usable without programmatic focus.
        }
      }, 0);
    });
  }

  clearGapPopup() {
    if (this.view._gapPopupOverlay && this.view._gapPopupOverlay.parentElement) {
      cleanupPopupHandlers(this.view._gapPopupOverlay);
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

    const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.35)", zIndex: 20000 });
    overlay.style.display = "flex";

    const card = document.createElement("div");
    card.className = "bbm-popup-standard bbm-popup-dialog";
    stylePopupCard(card, { width: "min(560px, 92vw)", maxHeight: "100%" });
    card.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";

    const header = document.createElement("div");
    header.className = "bbm-popup-header";
    header.style.fontWeight = "700";
    header.textContent = "Nummernlücke gefunden";

    const content = document.createElement("div");
    content.className = "bbm-popup-body bbm-form-content";
    content.style.display = "grid";
    content.style.flex = "1 1 auto";
    content.style.lineHeight = "1.4";

    const intro = document.createElement("div");
    intro.textContent = "Das Protokoll kann erst geschlossen werden, wenn die Nummerierung lückenlos ist.";
    content.appendChild(intro);

    const lines = this.buildGapDetailsText(gap);
    for (const line of lines) {
      const p = document.createElement("div");
      p.textContent = line;
      content.appendChild(p);
    }

    const footer = document.createElement("div");
    footer.className = "bbm-popup-footer";
    footer.style.display = "flex";
    footer.style.justifyContent = "flex-end";

    const btnCancel = document.createElement("button");
    btnCancel.textContent = "Abbrechen";
    applyPopupButtonStyle(btnCancel, { variant: "neutral" });

    const btnOk = document.createElement("button");
    btnOk.textContent = "Letzten TOP in Lücke setzen";
    applyPopupButtonStyle(btnOk, { variant: "primary" });
    const canRepair = !!gap?.lastTopId;
    btnOk.disabled = !canRepair;

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

    const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.35)", zIndex: 1400 });
    overlay.style.display = "flex";

    const modal = document.createElement("div");
    modal.className = "bbm-popup-standard bbm-popup-dialog";
    stylePopupCard(modal, { width: "min(560px, calc(100vw - 24px))", maxHeight: "100%" });

    const title = document.createElement("div");
    title.className = "bbm-popup-header";
    title.textContent = "Schlagwort bearbeiten";
    title.style.fontWeight = "700";

    const mkReadOnly = (labelText, value) => {
      const row = document.createElement("div");
      row.className = "bbm-form-field";
      row.style.display = "grid";
      row.style.gridTemplateColumns = "170px 1fr";

      const lab = document.createElement("div");
      lab.className = "bbm-form-label";
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
    rowKeyword.className = "bbm-form-field";
    rowKeyword.style.display = "grid";
    rowKeyword.style.gridTemplateColumns = "170px 1fr";

    const keywordLabel = document.createElement("div");
    keywordLabel.className = "bbm-form-label";
    keywordLabel.textContent = "Schlagwort";

    const keywordInput = document.createElement("input");
    keywordInput.type = "text";
    keywordInput.value = parts.meetingKeyword || "";
    keywordInput.maxLength = 120;
    keywordInput.style.width = "100%";

    rowKeyword.append(keywordLabel, keywordInput);

    const actions = document.createElement("div");
    actions.className = "bbm-popup-footer";
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";

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
        cleanupPopupHandlers(overlay);
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

    const body = document.createElement("div");
    body.className = "bbm-popup-body bbm-form-content";
    body.style.display = "grid";
    body.style.flex = "1 1 auto";
    body.append(
      mkReadOnly("Besprechungsnummer", parts.meetingIndex),
      mkReadOnly("Datum", parts.meetingDateText),
      rowKeyword
    );
    modal.append(title, body, actions);

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
