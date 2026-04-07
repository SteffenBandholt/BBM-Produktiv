export function mkEl(documentRef, tagName, className = "", text = "") {
  const el = documentRef.createElement(tagName);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}
