"use strict";
const VA_RECIPIENTS_KEY = "sigeko.preNotification.recipients";
function normalizeRecipients(values) {
  if (!Array.isArray(values) || values.length > 100 || values.some(value => typeof value !== "string" || value.length > 320 ||
    !/^[^\s@;,<>]+@[^\s@;,<>]+\.[^\s@;,<>]+$/.test(value))) {
    throw Object.assign(new Error("Bitte gültige E-Mail-Adressen eingeben (mit Semikolon trennen)."), { code: "INVALID_INPUT" });
  }
  return [...new Map(values.map(value => [value.toLowerCase(), value])).values()];
}
function parseRecipientSetting(value) {
  if (value == null) return { revision: 0, recipients: [] };
  try {
    const data = JSON.parse(value);
    if (!data || Object.keys(data).sort().join() !== "recipients,revision" || !Number.isSafeInteger(data.revision) || data.revision < 1) throw new Error();
    normalizeRecipients(data.recipients);
    return data;
  } catch (_) {
    throw Object.assign(new Error("Gespeicherte Vorankündigungsempfänger sind ungültig."), { code: "VA_RECIPIENTS_INVALID" });
  }
}
module.exports = Object.freeze({ VA_RECIPIENTS_KEY, normalizeRecipients, parseRecipientSetting });
