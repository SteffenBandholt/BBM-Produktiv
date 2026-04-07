export function mkEl(doc, tag, className, text) {
  const el = doc.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function toBool(value, fallback = false) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  const text = toText(value).toLowerCase();
  if (!text) return fallback;
  if (["0", "false", "no", "nein", "inactive"].includes(text)) return false;
  if (["1", "true", "yes", "ja", "active"].includes(text)) return true;
  return fallback;
}
