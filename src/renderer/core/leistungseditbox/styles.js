const STYLE_MARKER = "data-bbm-leistungseditbox-styles";

export function ensureLeistungsEditboxStyles(documentRef = globalThis.document) {
  const doc = documentRef;
  if (!doc?.head?.appendChild || !doc?.createElement) return null;

  const existing = doc.querySelector?.(`link[${STYLE_MARKER}="true"]`);
  if (existing) return existing;

  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("./leistungseditbox.css", import.meta.url).href;
  link.setAttribute(STYLE_MARKER, "true");
  doc.head.appendChild(link);
  return link;
}

export { STYLE_MARKER };
