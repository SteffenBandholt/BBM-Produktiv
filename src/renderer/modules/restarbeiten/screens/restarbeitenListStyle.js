const STYLE_ID = "restarbeiten-list-style";

const CSS_TEXT = `
.restarbeiten-editbox{max-width:940px;margin:0 auto;padding:8px;border:1px solid #bfd2d2;border-radius:10px;background:#fff;box-sizing:border-box}
.restarbeiten-editbox__layout{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:8px;align-items:start}
.restarbeiten-editbox__main,.restarbeiten-editbox__meta{display:grid;gap:6px}
.restarbeiten-editbox__field{display:grid;gap:3px}
.restarbeiten-editbox__label{font-size:9px;font-weight:700;line-height:1.15}
.restarbeiten-editbox__control{min-height:24px;padding:3px 6px;border-radius:6px;border:1px solid #cfcfcf;font-size:11px;line-height:1.2}
.restarbeiten-editbox__control--short{min-height:23px;padding-top:2px;padding-bottom:2px}
textarea.restarbeiten-editbox__control{min-height:74px;resize:vertical}
textarea.restarbeiten-editbox__control--long{min-height:74px}
.restarbeiten-editbox__locationGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
.restarbeiten-editbox__locationLabel{font-size:8px;letter-spacing:.01em}
.restarbeiten-editbox__locationControl{min-height:22px;padding:2px 5px;font-size:10px}
.restarbeiten-editbox__metaControl{min-height:23px;padding:2px 5px;font-size:10px}
.restarbeiten-editbox__metaRow{display:grid;gap:6px}
.restarbeiten-editbox__metaRow--triple{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;align-items:end}
.restarbeiten-editbox__metaRow--triple .restarbeiten-editbox__field{align-content:end}
.restarbeiten-editbox__ampelPreview{display:inline-block;padding:0;min-height:0;border:0;background:transparent}
.restarbeiten-editbox__metaDate{min-height:23px;padding:2px 5px;font-size:10px;line-height:1.2;box-sizing:border-box}
.restarbeiten-editbox__classActions{display:flex;align-items:center;gap:6px}
.restarbeiten-editbox__classToggle--compact{width:max-content;min-width:90px;padding:1px 3px;gap:2px}
.restarbeiten-editbox__classToggle--compact .restarbeiten-editbox__classToggleButton{min-height:20px;padding:1px 6px;font-size:10px}
.restarbeiten-editbox__classToggle{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:2px;border:1px solid #cfd8d8;border-radius:999px;background:#f6f8f8}
.restarbeiten-editbox__classToggleButton{min-height:26px;padding:3px 6px;border:1px solid transparent;border-radius:999px;background:transparent;font-size:12px;font-weight:600}
.restarbeiten-editbox__classToggleButton[data-active="1"]{background:#dfeaea;border-color:#87a5a5;font-weight:700}
.restarbeiten-editbox__create{min-height:26px;padding:3px 8px;justify-self:start;border:1px solid #cfcfcf;border-radius:6px;background:#f5f5f5;font-size:12px;font-weight:700}
.restarbeiten-editbox__status{font-size:11px;opacity:.8}
@media (max-width:900px){.restarbeiten-editbox__layout{grid-template-columns:1fr}.restarbeiten-editbox__locationGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}

[data-bbm-restarbeiten-screen="true"]{display:flex;flex-direction:column;height:100%;min-height:0;background:linear-gradient(180deg,#faf7ef,#f3eee3)}
.restarbeiten-header{display:flex;align-items:flex-end;gap:8px;padding:8px 10px;border-bottom:1px solid #bfd2d2;background:linear-gradient(180deg,#d9ead6,#c7e1c1);width:100%;box-sizing:border-box;flex-wrap:wrap}
.restarbeiten-header__filters{display:flex;gap:8px;flex:1;align-items:flex-end;justify-content:space-between;flex-wrap:wrap}
.restarbeiten-header__filter{display:grid;gap:2px;font-size:11px}
.restarbeiten-filterleiste__classFilter{display:inline-grid;grid-template-columns:repeat(3,auto);gap:2px;padding:2px;border:1px solid #b6cdb4;border-radius:999px;background:#f2f8ef;align-self:end}
.restarbeiten-filterleiste__classFilterButton{min-height:22px;padding:1px 8px;border:1px solid transparent;border-radius:999px;background:transparent;font-size:10px;font-weight:700;white-space:nowrap}
.restarbeiten-filterleiste__classFilterButton[data-active="1"]{background:#dbead6;border-color:#86a786}
.restarbeiten-filterleiste__locationFilters{display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:6px;flex:1;min-width:340px}
.restarbeiten-filterleiste__metaFilters{display:grid;grid-template-columns:repeat(3,minmax(110px,150px));gap:6px;justify-content:end}
.restarbeiten-header__actions{display:flex;gap:6px}
@media (max-width:980px){.restarbeiten-filterleiste__locationFilters{grid-template-columns:repeat(2,minmax(120px,1fr));min-width:260px}.restarbeiten-filterleiste__metaFilters{grid-template-columns:repeat(3,minmax(100px,1fr));width:100%}}
[data-bbm-restarbeiten-screen-area="sheet"]{flex:1;min-height:0;overflow:auto;padding:12px 22px 14px}
.restarbeiten-sheet__list{min-height:0}
[data-bbm-restarbeiten-screen-sheet-canvas="true"],[data-bbm-restarbeiten-screen-edit-canvas="true"]{width:100%;max-width:940px;margin:0 auto}
[data-bbm-restarbeiten-screen-sheet-paper="true"]{background:#fff;border:1px solid #dce6f2;border-radius:12px;box-shadow:0 10px 24px rgba(15,23,42,.08);padding:8px 12px 12px}
[data-bbm-restarbeiten-screen-area="edit"]{border-top:1px solid #d9e2ec;background:linear-gradient(180deg,#f8f4ec,#f1ebdf);padding:6px 10px 8px}
.restarbeiten-list{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.restarbeiten-list__row{border:1px solid #dae2ee;border-radius:8px;padding:6px;cursor:pointer}
.restarbeiten-list__row[data-selected="1"]{background:#eef6ff;border-color:#95b8e8}
.restarbeiten-list__rowGrid{display:grid;grid-template-columns:72px minmax(0,1fr) 180px;gap:8px}
.restarbeiten-list__number{font-weight:700}
.restarbeiten-list__date{font-size:8pt}
.restarbeiten-list__shortText,.restarbeiten-list__longText,.restarbeiten-list__locationCompact{font-size:12px;opacity:.88}
.restarbeiten-list__shortText{font-weight:500}
.restarbeiten-list__metaCol{font-size:8pt;display:grid;gap:2px}
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
