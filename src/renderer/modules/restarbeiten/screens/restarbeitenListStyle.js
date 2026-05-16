const STYLE_ID = "restarbeiten-list-style";

const CSS_TEXT = `
.restarbeiten-list {
  display: grid;
  gap: 12px;
  justify-items: center;
}

.restarbeiten-sheet__list,
.restarbeiten-list > :first-child,
.restarbeiten-list > :last-child {
  width: min(100%, 980px);
}

.restarbeiten-sheet__list {
  background: #fff;
  border: 1px solid #d8d8d8;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  padding: 10px;
}

.restarbeiten-list__table {
  width: 100%;
  border-collapse: collapse;
}

.restarbeiten-list__table th,
.restarbeiten-list__table td {
  vertical-align: top;
  text-align: left;
  padding: 6px 8px;
}
.restarbeiten-list__photosToggle,
.restarbeiten-list__filterBtn {
  margin-top: 4px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--card-border, #cfcfcf);
  background: #fff;
}

.restarbeiten-list__row {
  border-bottom: 1px solid var(--card-border, #d6d6d6);
  cursor: pointer;
}

.restarbeiten-list__row--selected {
  background: rgba(0, 0, 0, 0.05);
}

.restarbeiten-list__number,
.restarbeiten-list__shortText,
.restarbeiten-list__class,
.restarbeiten-list__status {
  font-weight: 600;
}

.restarbeiten-list__date,
.restarbeiten-list__longText,
.restarbeiten-list__due,
.restarbeiten-list__responsible,
.restarbeiten-list__location {
  opacity: 0.85;
  font-size: 12px;
}
.restarbeiten-list__locationCell {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}
.restarbeiten-list__locationLevel {
  font-size: 12px;
  opacity: 0.9;
}

.restarbeiten-list__meta {
  display: grid;
  gap: 2px;
}

.restarbeiten-list__ampel {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
  margin-right: 6px;
  vertical-align: middle;
}

.restarbeiten-list__ampel--rot { background: #d33; }
.restarbeiten-list__ampel--orange { background: #f0a000; }
.restarbeiten-list__ampel--gruen { background: #1b8a3a; }
.restarbeiten-list__ampel--neutral { background: #8a8a8a; }

.restarbeiten-list__attachmentsRow td {
  padding-top: 0;
  padding-bottom: 10px;
}
.restarbeiten-list__attachmentsWrap {
  border-top: 1px dashed #d8d8d8;
  padding-top: 6px;
}
.restarbeiten-list__attachmentsStrip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.restarbeiten-list__attachmentThumb {
  font-size: 11px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px 6px;
}
`;

export function ensureRestarbeitenListStyle(documentRef = globalThis.document) {
  const doc = documentRef;
  if (!doc?.createElement || !doc?.head) return;
  if (typeof doc.getElementById === "function" && doc.getElementById(STYLE_ID)) return;

  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS_TEXT;
  doc.head.append(style);
}
