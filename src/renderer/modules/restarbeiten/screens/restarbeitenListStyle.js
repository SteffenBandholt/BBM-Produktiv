const STYLE_ID = "restarbeiten-list-style";

const CSS_TEXT = `
[data-bbm-restarbeiten-screen="true"]{display:flex;flex-direction:column;height:100%;min-height:0;background:linear-gradient(180deg,#faf7ef,#f3eee3)}
.restarbeiten-header{display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid #bfd2d2;background:linear-gradient(180deg,#eaf3f2,#dfeaea);max-width:940px;width:100%;margin:0 auto;box-sizing:border-box}
.restarbeiten-header__filters{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:6px;flex:1}
.restarbeiten-header__filter{display:grid;gap:2px;font-size:11px}
.restarbeiten-header__actions{display:flex;gap:6px}
[data-bbm-restarbeiten-screen-area="sheet"]{flex:1;min-height:0;overflow:auto;padding:12px 22px 14px}
[data-bbm-restarbeiten-screen-sheet-canvas="true"],[data-bbm-restarbeiten-screen-edit-canvas="true"]{width:100%;max-width:940px;margin:0 auto}
[data-bbm-restarbeiten-screen-sheet-paper="true"]{background:#fff;border:1px solid #dce6f2;border-radius:12px;box-shadow:0 10px 24px rgba(15,23,42,.08);padding:8px 12px 12px}
[data-bbm-restarbeiten-screen-area="edit"]{border-top:1px solid #d9e2ec;background:linear-gradient(180deg,#f8f4ec,#f1ebdf);padding:6px 10px 8px}
.restarbeiten-list{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.restarbeiten-list__row{border:1px solid #dae2ee;border-radius:8px;padding:6px;cursor:pointer}
.restarbeiten-list__row[data-selected="1"]{background:#eef6ff;border-color:#95b8e8}
.restarbeiten-list__rowGrid{display:grid;grid-template-columns:72px minmax(0,1fr) 180px;gap:8px}
.restarbeiten-list__number,.restarbeiten-list__shortText{font-weight:700}
.restarbeiten-list__date,.restarbeiten-list__longText,.restarbeiten-list__locationCompact{font-size:12px;opacity:.88}
.restarbeiten-list__metaCol{font-size:12px;display:grid;gap:2px}
.restarbeiten-list__ampelLine{display:inline-flex;align-items:center;gap:6px}
.restarbeiten-list__ampel{display:inline-block;width:10px;height:10px;border-radius:50%;border:1px solid rgba(0,0,0,.2)}
.restarbeiten-list__ampel--rot{background:#d33}
.restarbeiten-list__ampel--orange{background:#f0a000}
.restarbeiten-list__ampel--gruen{background:#1b8a3a}
.restarbeiten-list__ampel--neutral{background:#8a8a8a}
.restarbeiten-list__photosToggle{font-size:11px;padding:2px 6px}
.restarbeiten-list__attachmentsWrap{padding-top:6px;font-size:12px}
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
