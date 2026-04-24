function normalizeAddressList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function appendAttachmentHint(body, attachments) {
  const text = String(body || "");
  const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  if (!files.length) return text;
  if (text.includes("PDF-Datei f\u00fcr den Versand:") || text.includes("Anhaenge fuer den Versand:")) {
    return text;
  }
  return `${text}\n\n---\nAnhaenge fuer den Versand:\n${files.join("\n")}`;
}

// Technischer mailto-Fallback:
// fachlicher Betreff/Text kommt aus den nutzenden Schichten,
// hier wird nur der Transport-URI gebaut.
export function sendMailPayload(payload) {
  const to = normalizeAddressList(payload?.to);
  const cc = normalizeAddressList(payload?.cc);
  const bcc = normalizeAddressList(payload?.bcc);
  const subject = String(payload?.subject || "").trim();
  const attachments = Array.isArray(payload?.attachments) ? payload.attachments.filter(Boolean) : [];
  const body = appendAttachmentHint(payload?.body || "", attachments);

  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  if (cc.length) params.push(`cc=${encodeURIComponent(cc.join(","))}`);
  if (bcc.length) params.push(`bcc=${encodeURIComponent(bcc.join(","))}`);

  const toPart = to.length ? to.join(",") : "";
  const query = params.length ? `?${params.join("&")}` : "";
  const mailto = `mailto:${encodeURIComponent(toPart)}${query}`;

  window.location.href = mailto;
}
