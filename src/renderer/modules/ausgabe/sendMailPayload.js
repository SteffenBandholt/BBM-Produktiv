const MAX_MAILTO_LENGTH = 1800;

function normalizeAddressList(value) {
  const list = Array.isArray(value) ? value : [];
  const out = [];
  const seen = new Set();
  for (const item of list) {
    const text = String(item || "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function appendAttachmentHint(body, attachments) {
  const text = String(body || "");
  const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  if (!files.length) return text;
  if (text.includes("PDF-Datei f\u00fcr den Versand:") || text.includes("Anhaenge fuer den Versand:")) {
    return text;
  }
  const suffix = `\n\n---\nAnhaenge fuer den Versand:\n${files.join("\n")}`;
  return `${text}${suffix}`;
}

function buildMailtoUrl(payload = {}) {
  const to = normalizeAddressList(payload?.to);
  const cc = normalizeAddressList(payload?.cc);
  const bcc = normalizeAddressList(payload?.bcc);
  const subject = String(payload?.subject || "").trim();
  const attachments = normalizeAddressList(payload?.attachments);

  if (!to.length) {
    return { ok: false, error: "E-Mail-Empfaenger fehlt" };
  }

  const body = appendAttachmentHint(payload?.body || "", attachments);
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  if (cc.length) params.push(`cc=${encodeURIComponent(cc.join(","))}`);
  if (bcc.length) params.push(`bcc=${encodeURIComponent(bcc.join(","))}`);

  const toPart = to.join(",");
  const query = params.length ? `?${params.join("&")}` : "";
  const mailto = `mailto:${encodeURIComponent(toPart)}${query}`;

  if (mailto.length > MAX_MAILTO_LENGTH) {
    return {
      ok: false,
      error: "E-Mail-Inhalt ist zu lang fuer mailto",
      mailto,
    };
  }

  return {
    ok: true,
    mailto,
    to,
    cc,
    bcc,
    subject,
    body,
    attachments,
  };
}

function openMailtoUrl(mailto) {
  if (typeof window === "undefined" || !window) {
    return { ok: false, error: "Browser-Fenster nicht verfuegbar" };
  }

  try {
    if (window.location && typeof window.location.assign === "function") {
      window.location.assign(mailto);
      return { ok: true, mailto };
    }
    if (window.location) {
      window.location.href = mailto;
      return { ok: true, mailto };
    }
    if (typeof window.open === "function") {
      const opened = window.open(mailto, "_self");
      if (opened !== false) return { ok: true, mailto };
    }
    return { ok: false, error: "Browser-Location nicht verfuegbar", mailto };
  } catch (err) {
    return {
      ok: false,
      error: err?.message || "E-Mail konnte nicht geoeffnet werden",
      mailto,
    };
  }
}

// Technischer mailto-Fallback:
// fachlicher Betreff/Text kommt aus den nutzenden Schichten,
// hier wird nur der Transport-URI gebaut und sicher geoeffnet.
export function sendMailPayload(payload) {
  const built = buildMailtoUrl(payload);
  if (!built?.ok) {
    return built;
  }
  const opened = openMailtoUrl(built.mailto);
  if (!opened?.ok) return opened;
  return { ok: true, mailto: built.mailto };
}

export { buildMailtoUrl, appendAttachmentHint, normalizeAddressList, openMailtoUrl, MAX_MAILTO_LENGTH };
