export function normalizeMailTransportPayload(payload = {}) {
  const recipients = Array.isArray(payload?.recipients) ? payload.recipients.filter(Boolean) : [];
  const attachments = Array.isArray(payload?.attachments) ? payload.attachments.filter(Boolean) : [];
  const uniqueAttachments = [];
  const seenAttachments = new Set();
  for (const attachment of attachments) {
    const value = String(attachment || "").trim();
    const key = value.toLowerCase();
    if (!value || seenAttachments.has(key)) continue;
    seenAttachments.add(key);
    uniqueAttachments.push(value);
  }
  return {
    recipients,
    subject: String(payload?.subject || "").trim(),
    body: typeof payload?.body === "string" ? payload.body : String(payload?.body || ""),
    attachments: uniqueAttachments,
    forceMailto: !!payload?.forceMailto,
  };
}

// Gemeinsame technische Transport-Orchestrierung. Fachmodule liefern den fertigen
// Empfaenger-/Betreff-/Text-/Attachment-Payload und behalten ihren Workflow selbst.
export class MailTransportService {
  constructor({ openOutlookDraft, sendMailto, notify, getBlockedMessage, logger } = {}) {
    this.openOutlookDraft = openOutlookDraft;
    this.sendMailto = sendMailto;
    this.notify = typeof notify === "function" ? notify : () => {};
    this.getBlockedMessage =
      typeof getBlockedMessage === "function"
        ? getBlockedMessage
        : (result) => String(result?.error || result?.message || "Mail-Dienst ist nicht freigeschaltet.");
    this.logger = logger || console;
  }

  async send(payload = {}) {
    const mailPayload = normalizeMailTransportPayload(payload);
    if (!mailPayload.forceMailto && typeof this.openOutlookDraft === "function") {
      const opened = await this.openOutlookDraft(mailPayload);
      if (opened?.ok) return opened;
      if (opened?.blocked) {
        this.notify(this.getBlockedMessage(opened.result || opened));
        return opened;
      }
      if (mailPayload.attachments.length) {
        const detail = String(opened?.result?.error || "").trim();
        this.notify(
          `Outlook-Entwurf mit PDF-Anhängen konnte nicht geöffnet werden.${
            detail ? `\n\n${detail}` : ""
          }`
        );
        return { ok: false, attachmentError: true, result: opened?.result || opened };
      }
    }
    try {
      if (typeof this.sendMailto !== "function") throw new Error("mailto-Transport fehlt");
      await this.sendMailto(mailPayload);
      return { ok: true, transport: "mailto" };
    } catch (err) {
      this.logger.error("[mail] mailto fallback failed:", err);
      this.notify("E-Mail konnte nicht geöffnet werden.");
      return { ok: false, error: err?.message || String(err) };
    }
  }
}
