const RESTARBEITEN_ATTACHMENTS_STYLE_ATTR = "data-bbm-restarbeiten-attachments-style";

const RESTARBEITEN_ATTACHMENTS_STYLE_TEXT = `
.restarbeiten-attachments {
  display: grid;
  gap: 8px;
}

.restarbeiten-attachments__actions {
  display: grid;
  gap: 6px;
}

.restarbeiten-attachments__grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 10px;
  align-items: stretch;
}

.restarbeiten-attachments__primary,
.restarbeiten-attachments__secondary {
  min-width: 0;
}

.restarbeiten-attachments__secondary {
  display: grid;
  gap: 8px;
  grid-auto-rows: 1fr;
}

.restarbeiten-attachments__card {
  border: 1px solid var(--card-border, #cfcfcf);
  border-radius: 10px;
  padding: 8px;
  display: grid;
  gap: 6px;
}

.restarbeiten-attachments__card--primary {
  border: 2px solid #3b82f6;
}

.restarbeiten-attachments__imageFrame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.05);
}

.restarbeiten-attachments__imageFallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 8px;
}

.restarbeiten-attachments__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.restarbeiten-attachments__caption,
.restarbeiten-attachments__meta {
  margin: 0;
}
`;

function hasInjectedStyle(doc) {
  if (typeof doc?.querySelector === "function") {
    return !!doc.querySelector(`style[${RESTARBEITEN_ATTACHMENTS_STYLE_ATTR}="true"]`);
  }

  const children = Array.from(doc?.head?.children || []);
  return children.some((node) => {
    if (!node) return false;
    if (typeof node.getAttribute === "function") {
      return node.getAttribute(RESTARBEITEN_ATTACHMENTS_STYLE_ATTR) === "true";
    }
    return node[RESTARBEITEN_ATTACHMENTS_STYLE_ATTR] === "true";
  });
}

export function ensureRestarbeitenAttachmentsStyle(documentRef = globalThis.document) {
  const doc = documentRef || globalThis.document;
  if (!doc?.head || typeof doc.createElement !== "function") return;
  if (hasInjectedStyle(doc)) return;

  const style = doc.createElement("style");
  if (typeof style.setAttribute === "function") {
    style.setAttribute(RESTARBEITEN_ATTACHMENTS_STYLE_ATTR, "true");
  } else {
    style[RESTARBEITEN_ATTACHMENTS_STYLE_ATTR] = "true";
  }
  style.textContent = RESTARBEITEN_ATTACHMENTS_STYLE_TEXT;

  if (typeof doc.head.appendChild === "function") {
    doc.head.appendChild(style);
  } else if (typeof doc.head.append === "function") {
    doc.head.append(style);
  }
}
