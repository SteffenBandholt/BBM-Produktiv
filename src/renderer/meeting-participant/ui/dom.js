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

