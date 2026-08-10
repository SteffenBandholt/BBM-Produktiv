import { applyPopupButtonStyle } from "../../ui/popupButtonStyles.js";
import { cleanupPopupHandlers, createPopupOverlay } from "../../ui/popupCommon.js";

export class MailFlow {
  constructor({ view, router }) {
    this.view = view;
    this.router = router;
  }

  async maybePromptSendAfterClose({ printResults, meeting }) {
    await this.openSendMailAfterClose({ printResults, meeting });
  }

  async openSendMailAfterClose({ printResults, meeting }) {
    const MainHeader = (await import("../../ui/MainHeader.js")).default;
    const headerHelper = new MainHeader({ router: this.router });
    const meetingRef =
      meeting ||
      (typeof this.view.getSelectedClosedMeetingForEmail === "function"
        ? this.view.getSelectedClosedMeetingForEmail()
        : null) || { id: this.view.meetingId };
    const meetingId = meetingRef?.id || this.view.meetingId || null;

    const recOptions = await headerHelper._getMeetingRecipientOptions(meetingId);
    const allRecipients = recOptions.all || [];
    let selectedRecipients = headerHelper._buildInitialRecipientSelection(recOptions);

    const draft = await headerHelper._buildMeetingMailDraft({
      projectId: this.view.projectId || this.router?.currentProjectId,
      meeting: meetingRef,
      mailType: "",
    });

    const attachments = headerHelper._buildMailAttachmentEntries({
      protocol: printResults?.protocol?.filePath || "",
      firms: printResults?.firms?.filePath || "",
      todo: printResults?.todo?.filePath || "",
      tops: printResults?.tops?.filePath || "",
    });

    if (!attachments[0].path) {
      try {
        const lookup = await headerHelper._buildProtocolPdfLookupPayload(
          meetingRef,
          this.view.projectId || this.router?.currentProjectId
        );
        if (lookup && window.bbmPrint?.findStoredProtocolPdf) {
          const found = await window.bbmPrint.findStoredProtocolPdf(lookup);
          if (found?.ok && found?.filePath) attachments[0].path = String(found.filePath || "");
        }
      } catch (_e) {
        // ignore
      }
    }

    const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.45)", zIndex: 13000 });
    overlay.style.display = "flex";

    const card = document.createElement("div");
    card.className = "bbm-popup-standard bbm-popup-dialog";
    card.style.boxShadow = "0 10px 30px rgba(0,0,0,0.28)";
    card.style.width = "min(720px, 94vw)";
    card.style.maxHeight = "100%";
    card.style.display = "grid";
    card.style.gridTemplateRows = "auto 1fr auto";
    card.style.overflow = "hidden";

    const title = document.createElement("div");
    title.className = "bbm-popup-header";
    title.textContent = "Protokoll versenden";
    title.style.fontWeight = "700";
    title.style.fontSize = "16px";

    const content = document.createElement("div");
    content.className = "bbm-popup-body bbm-form-content";
    content.style.display = "grid";
    content.style.gridTemplateColumns = "1fr 1fr";
    content.style.overflow = "auto";

    const recWrap = document.createElement("div");
    recWrap.className = "bbm-form-card bbm-form-content";
    recWrap.style.display = "flex";
    recWrap.style.flexDirection = "column";

    const recTitle = document.createElement("div");
    recTitle.className = "bbm-form-label";
    recTitle.textContent = "Empf\u00e4nger";
    recTitle.style.fontWeight = "700";

    const recActions = document.createElement("div");
    recActions.style.display = "flex";
    recActions.style.flexWrap = "wrap";
    recActions.style.gap = "6px";

    const mkRecAction = (label, handler) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      applyPopupButtonStyle(btn, { variant: "neutral" });
      btn.onclick = handler;
      return btn;
    };

    const applyRecipientSelection = (list) => {
      selectedRecipients = [...list];
      Array.from(recList.querySelectorAll("input[type=checkbox]")).forEach((cb) => {
        cb.checked = selectedRecipients.includes(cb.value);
      });
    };

    recActions.append(
      mkRecAction("Alle", () => applyRecipientSelection(allRecipients)),
      mkRecAction("Keine", () => applyRecipientSelection([]))
    );

    const recList = document.createElement("div");
    recList.style.display = "flex";
    recList.style.flexDirection = "column";
    recList.style.gap = "4px";
    recList.style.maxHeight = "220px";
    recList.style.overflow = "auto";

    const mkRecRow = (email) => {
      const row = document.createElement("label");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "6px";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = email;
      cb.checked = selectedRecipients.includes(email);
      cb.onchange = () => {
        if (cb.checked) {
          if (!selectedRecipients.includes(email)) selectedRecipients.push(email);
        } else {
          selectedRecipients = selectedRecipients.filter((x) => x !== email);
        }
      };
      const text = document.createElement("span");
      text.textContent = email;
      row.append(cb, text);
      return row;
    };

    const uniqueAll = Array.from(new Set(allRecipients));
    if (uniqueAll.length) {
      uniqueAll.forEach((mail) => recList.appendChild(mkRecRow(mail)));
    } else {
      const hint = document.createElement("div");
      hint.textContent = "Keine Empf\u00e4nger gefunden.";
      hint.style.opacity = "0.7";
      recList.appendChild(hint);
    }

    recWrap.append(recTitle, recActions, recList);

    const attWrap = document.createElement("div");
    attWrap.className = "bbm-form-card bbm-form-content";
    attWrap.style.display = "flex";
    attWrap.style.flexDirection = "column";

    const attTitle = document.createElement("div");
    attTitle.className = "bbm-form-label";
    attTitle.textContent = "Anh\u00e4nge";
    attTitle.style.fontWeight = "700";

    const attList = document.createElement("div");
    attList.style.display = "flex";
    attList.style.flexDirection = "column";
    attList.style.gap = "6px";

    attachments.forEach((att) => {
      const row = document.createElement("label");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "6px";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = true;
      cb.onchange = () => {
        att.selected = cb.checked;
      };
      att.selected = true;
      const text = document.createElement("span");
      text.textContent = att.label + (att.path ? "" : " (Pfad fehlt)");
      row.append(cb, text);
      attList.appendChild(row);
    });

    attWrap.append(attTitle, attList);

    const subjectLabel = document.createElement("div");
    subjectLabel.className = "bbm-form-label";
    subjectLabel.textContent = "Betreff";
    subjectLabel.style.fontWeight = "700";

    const subjectInput = document.createElement("input");
    subjectInput.type = "text";
    subjectInput.value = draft.subject;
    subjectInput.style.width = "100%";
    subjectInput.style.maxWidth = "100%";
    subjectInput.style.boxSizing = "border-box";

    const bodyLabel = document.createElement("div");
    bodyLabel.className = "bbm-form-label";
    bodyLabel.textContent = "Mailtext";
    bodyLabel.style.fontWeight = "700";

    const bodyInput = document.createElement("textarea");
    bodyInput.value = draft.body;
    bodyInput.style.width = "100%";
    bodyInput.style.maxWidth = "100%";
    bodyInput.style.boxSizing = "border-box";
    bodyInput.rows = 8;

    const subjectField = document.createElement("div");
    subjectField.className = "bbm-form-field";
    subjectField.style.display = "grid";
    subjectField.style.gridColumn = "1 / -1";
    subjectField.append(subjectLabel, subjectInput);

    const bodyField = document.createElement("div");
    bodyField.className = "bbm-form-field";
    bodyField.style.display = "grid";
    bodyField.style.gridColumn = "1 / -1";
    bodyField.append(bodyLabel, bodyInput);

    content.append(recWrap, attWrap);
    content.append(subjectField, bodyField);
    content.style.gridTemplateColumns = "1fr 1fr";
    content.style.gridTemplateRows = "auto auto auto auto";
    content.style.gridAutoFlow = "row";

    const actions = document.createElement("div");
    actions.className = "bbm-popup-footer";
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "var(--bbm-popup-footer-gap)";

    const btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.textContent = "Abbrechen";
    applyPopupButtonStyle(btnCancel, { variant: "neutral" });

    const btnSend = document.createElement("button");
    btnSend.type = "button";
    btnSend.textContent = "Mit Outlook / Mailprogramm \u00f6ffnen";
    applyPopupButtonStyle(btnSend, { variant: "primary" });

    const closeOverlay = () => {
      try {
        cleanupPopupHandlers(overlay);
        overlay.remove();
      } catch (_e) {
        // ignore
      }
    };

    const collectAttachments = () => attachments.filter((a) => a.selected && a.path).map((a) => a.path);

    btnSend.onclick = async () => {
      btnSend.disabled = true;
      try {
        await headerHelper._openMailClient("", {
          recipients: selectedRecipients,
          subject: subjectInput.value,
          body: bodyInput.value,
          attachments: collectAttachments(),
          meeting: meetingRef,
        });
      } catch (err) {
        console.error("[tops] send mail failed:", err);
      } finally {
        closeOverlay();
        await this.view._enterIdleAfterClose();
      }
    };

    btnCancel.onclick = async () => {
      closeOverlay();
      await this.view._enterIdleAfterClose();
    };

    actions.append(btnCancel, btnSend);

    card.append(title, content, actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    try {
      overlay.focus();
    } catch (_e) {
      // ignore
    }
  }
}
