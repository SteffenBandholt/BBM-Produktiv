const STYLE_ID = "restarbeiten-list-style";

const CSS_TEXT = `
.restarbeiten-editbox{max-width:940px;margin:0 auto;padding:8px;border:1px solid #bfd2d2;border-radius:10px;background:#fff;box-sizing:border-box}
.restarbeiten-editbox{outline:1px solid rgba(59,130,246,.22)}
.restarbeiten-editbox__layout{display:flex;flex-direction:column;gap:8px}
.restarbeiten-editbox__topBar{display:flex;align-items:center;justify-content:flex-start;gap:8px;min-height:22px;outline:1px solid rgba(244,114,182,.45)}
.restarbeiten-editbox__title{font-size:11px;font-weight:700;line-height:1.1;white-space:nowrap}
.restarbeiten-editbox__topBar .restarbeiten-editbox__classActions--top{margin:0 auto 2px}
.restarbeiten-editbox__body{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:18px;outline:1px solid rgba(34,197,94,.35)}
.restarbeiten-editbox__main{display:grid;grid-template-columns:84px minmax(0,1fr);align-items:start;gap:10px;min-width:0;outline:1px solid rgba(239,68,68,.35)}
.restarbeiten-editbox__textRail{display:grid;gap:8px;width:84px;flex:0 0 84px;align-content:start;outline:1px solid rgba(248,113,113,.5)}
.restarbeiten-editbox__railRow{display:flex;align-items:center;gap:5px;min-height:22px}
.restarbeiten-editbox__railLabel{font-size:9px;font-weight:700;line-height:1.1;min-width:0}
.restarbeiten-editbox__railCounter{font-size:9px;line-height:1.1;opacity:.82;min-width:18px;text-align:left}

.restarbeiten-editbox__inputSlot{display:block;width:100%;min-width:0}
.restarbeiten-editbox__inputSlot .restarbeiten-editbox__control{width:100%;box-sizing:border-box}
.restarbeiten-editbox__rightGroup{display:grid;grid-template-columns:auto auto;align-items:start;justify-content:flex-end;gap:12px;flex:0 0 auto;width:max-content;min-width:0;outline:1px solid rgba(16,185,129,.35)}
.restarbeiten-editbox__textColumn,.restarbeiten-editbox__meta{display:grid;gap:5px;width:max-content}
.restarbeiten-editbox__textColumn{justify-items:start;flex:1 1 auto;width:100%;max-width:none}
.restarbeiten-editbox__textColumn{outline:1px solid rgba(245,158,11,.35)}
.restarbeiten-editbox__meta{justify-items:start;outline:1px solid rgba(168,85,247,.35)}
.restarbeiten-editbox__field{display:grid;gap:3px}
.restarbeiten-editbox__label{font-size:9px;font-weight:700;line-height:1.15}
.restarbeiten-editbox__control{min-height:24px;padding:3px 6px;border-radius:6px;border:1px solid #cfcfcf;font-size:11px;line-height:1.2}
.restarbeiten-editbox__control--short{min-height:23px;padding-top:2px;padding-bottom:2px}
textarea.restarbeiten-editbox__control{min-height:74px;resize:vertical}
textarea.restarbeiten-editbox__control--long{min-height:74px}
.restarbeiten-editbox__locationGrid{display:grid;grid-template-columns:1fr;gap:3px;width:max-content;max-width:none;justify-self:start;outline:1px solid rgba(14,165,233,.35)}
.restarbeiten-editbox__locationLabel{font-size:7px;line-height:1.05;letter-spacing:0}
.restarbeiten-editbox__locationControl{min-height:18px;padding:0 3px;font-size:8px;line-height:1.05}
.restarbeiten-editbox__metaControl{min-height:18px;padding:0 3px;font-size:8px;line-height:1.05}
.restarbeiten-editbox__metaRow{display:grid;gap:4px;width:max-content;outline:1px solid rgba(251,191,36,.25)}
.restarbeiten-editbox__metaRow--dueDate{grid-template-columns:max-content 14px;align-items:end;justify-items:start}
.restarbeiten-editbox__metaRow--status{grid-template-columns:max-content;align-items:end;justify-items:start}
.restarbeiten-editbox__metaRow--completedAt{grid-template-columns:max-content max-content;align-items:end;justify-items:start}
.restarbeiten-editbox__metaRow--dueDate .restarbeiten-editbox__field,.restarbeiten-editbox__metaRow--status .restarbeiten-editbox__field{align-content:end}
.restarbeiten-editbox__metaRow--completedAt .restarbeiten-editbox__field{align-content:end}
.restarbeiten-editbox__statusField,.restarbeiten-editbox__dueDateField,.restarbeiten-editbox__responsibleField{justify-self:start}
.restarbeiten-editbox__statusField,.restarbeiten-editbox__responsibleField{width:auto;max-width:none}
.restarbeiten-editbox__dueDateField{width:auto;max-width:none}
.restarbeiten-editbox__dueDateField .restarbeiten-editbox__metaDate{width:auto;max-width:none}
.restarbeiten-editbox__ampelField{justify-self:end}
.restarbeiten-editbox__ampelPreview{display:inline-block;padding:0;min-height:0;border:0;background:transparent}
.restarbeiten-editbox__metaDate{min-height:18px;padding:0 3px;font-size:8px;line-height:1.05;box-sizing:border-box}
.restarbeiten-editbox__classActions{display:flex;align-items:center;gap:4px}
.restarbeiten-editbox__classActions--top{justify-self:center;justify-content:center;width:max-content;margin:0 auto 2px}
.restarbeiten-editbox__classActions--right{justify-self:end;justify-content:flex-end;width:100%}
.restarbeiten-editbox__classToggleWrap{justify-self:end}
.restarbeiten-editbox__classToggle--compact{width:max-content;min-width:0;padding:0;gap:6px}
.restarbeiten-editbox__classToggle{display:flex;align-items:center;gap:6px;padding:0;border:0;background:transparent}
.restarbeiten-editbox__classToggleButton{min-height:18px;padding:0 7px;border:1px solid #cfcfcf;border-radius:6px;background:#fff;font-size:8px;line-height:1.05;font-weight:600;color:#1f2937;cursor:pointer}
.restarbeiten-editbox__classToggleButton[data-active="1"]{color:#0066ff;font-weight:700;border-color:#0066ff}
.restarbeiten-editbox__classToggleButton:focus-visible{outline:1px solid #0066ff;outline-offset:2px}
.restarbeiten-editbox__create{min-height:18px;padding:0 6px;justify-self:start;border:1px solid #cfcfcf;border-radius:6px;background:#f5f5f5;font-size:8px;font-weight:700}
.restarbeiten-editbox__create--right{justify-self:end}
.restarbeiten-editbox__status{font-size:8px;opacity:.8}
.restarbeiten-editbox__noteBtn{min-height:18px;padding:0 6px;border:1px solid #cfcfcf;border-radius:6px;background:#fff;font-size:10px;line-height:1}
.restarbeiten-editbox__noteDialog{position:fixed;inset:0;display:grid;place-items:center;background:rgba(15,23,42,.24);z-index:9999}
.restarbeiten-editbox__noteDialog>div{background:#fff;border:1px solid #cfcfcf;border-radius:8px;padding:10px;display:grid;gap:8px;min-width:280px;max-width:420px}
.restarbeiten-editbox__noteDialog textarea{min-height:110px}
.restarbeiten-editbox__noteDialog div:last-child{display:flex;justify-content:flex-end;gap:6px}
@media (max-width:900px){.restarbeiten-editbox__body{display:grid;grid-template-columns:1fr}.restarbeiten-editbox__rightGroup{display:grid;grid-template-columns:1fr;width:100%}.restarbeiten-editbox__main{display:grid;grid-template-columns:1fr;max-width:none;width:100%}.restarbeiten-editbox__locationGrid{grid-template-columns:repeat(2,minmax(0,1fr));max-width:none;width:100%}}

[data-bbm-restarbeiten-screen="true"]{display:flex;flex-direction:column;height:100%;min-height:0;background:linear-gradient(180deg,#faf7ef,#f3eee3)}
.restarbeiten-header{display:none}
.restarbeiten-header__left{display:grid;gap:2px;min-width:0}
.restarbeiten-header__title{font-size:14px;font-weight:600;line-height:1.1;letter-spacing:.01em}
.restarbeiten-header__context{font-size:9.5px;font-weight:500;line-height:1.2;opacity:.8}
.restarbeiten-header__actions{display:flex;gap:6px;margin-left:auto;align-self:flex-start}
.restarbeiten-workarea{display:flex;flex:1;min-height:0;align-items:stretch;position:relative}
.restarbeiten-workarea__content{display:flex;flex-direction:column;flex:1;min-width:0;min-height:0}
.restarbeiten-listHeader{position:sticky;top:0;z-index:2;min-height:108px;padding:8px 22px 10px;background:linear-gradient(180deg,rgba(250,247,239,.98),rgba(243,238,227,.98));border-bottom:1px solid rgba(191,210,210,.8);outline:1px solid rgba(96,165,250,.38);outline-offset:-1px}
.restarbeiten-listHeader__grid{display:grid;width:100%;max-width:940px;margin:0 auto;grid-template-columns:minmax(240px,1.55fr) minmax(110px,.45fr) minmax(270px,1.35fr) auto;grid-template-rows:auto auto;gap:8px;align-items:start}
.restarbeiten-listHeader__panel{display:grid;gap:5px;padding:6px 8px;border:1px solid #d6dfdf;border-radius:10px;background:rgba(255,255,255,.72);box-sizing:border-box;outline:1px solid transparent;outline-offset:0}
.restarbeiten-listHeader__panel--location{outline-color:rgba(34,197,94,.42);margin-left:-20px;width:calc(100% + 20px);padding:2px 6px 2px;align-self:end}
.restarbeiten-listHeader__panel--class{outline-color:rgba(168,85,247,.42);padding:2px 6px 2px;align-self:end}
.restarbeiten-listHeader__panel--meta{outline-color:rgba(249,115,22,.42);background:rgba(255,243,224,.82);margin-left:0;width:max-content;justify-self:end;padding:2px 4px 2px;align-self:end;grid-column:3 / span 2;grid-row:2}
.restarbeiten-listHeader__panel--close{grid-column:4;grid-row:1}
.restarbeiten-listHeader__label{font-size:10px;font-weight:600;line-height:1.1;letter-spacing:.02em;color:#47515c}
.restarbeiten-listHeader__content{display:grid;gap:3px;align-items:start}
.restarbeiten-listHeader__panel--class .restarbeiten-listHeader__content{min-height:0;gap:1px}
.restarbeiten-listHeader__panel--meta .restarbeiten-listHeader__content{min-height:0;gap:1px}
.restarbeiten-listHeader__panel--close{display:flex;align-items:flex-start;justify-content:flex-end;padding:0;box-sizing:border-box;background:transparent;border:0;box-shadow:none;outline:1px solid rgba(236,72,153,.42);outline-offset:-1px}
.restarbeiten-listHeader__closePanel{padding:6px 0 0;box-sizing:border-box}
.restarbeiten-listHeader__closeButton{appearance:none;-webkit-appearance:none;display:inline-flex;align-items:center;justify-content:center;min-height:24px;padding:3px 10px;border:1px solid #d6dfdf;border-radius:8px;background:#fff;box-shadow:0 1px 0 rgba(15,23,42,.04);font-size:10px;font-weight:600;color:#253041}
.restarbeiten-listHeader__closeButton:hover{background:#f8fbff;border-color:#b8cce0}
.restarbeiten-listHeader__closeButton:focus-visible{outline:2px solid #8bb7ff;outline-offset:1px}
.restarbeiten-filterleiste__field{display:grid;width:100%;min-width:0;gap:1px;font-size:10px;white-space:nowrap;overflow:hidden}
.restarbeiten-filterleiste__fieldLabel{font-size:8px;font-weight:600;line-height:1;opacity:.86;overflow:hidden;text-overflow:clip}
.restarbeiten-filterleiste__field select{display:block;width:100%;min-height:18px;padding:0 4px;font-size:9px;max-width:100%;box-sizing:border-box;border:1px solid #d6dddd;border-radius:6px;background:#fff;overflow:hidden;text-overflow:clip}
.restarbeiten-filterleiste__metaFilters > .restarbeiten-filterleiste__field:nth-child(1){background:#eef6ff;box-shadow:inset 0 0 0 1px rgba(59,130,246,.18)}
.restarbeiten-filterleiste__metaFilters > .restarbeiten-filterleiste__field:nth-child(2){background:#fff4e8;box-shadow:inset 0 0 0 1px rgba(249,115,22,.18)}
.restarbeiten-filterleiste__metaFilters > .restarbeiten-filterleiste__field:nth-child(3){background:#eff9ef;box-shadow:inset 0 0 0 1px rgba(34,197,94,.18)}
.restarbeiten-filterleiste__metaFilters > .restarbeiten-filterleiste__field:nth-child(4){background:#f4efff;box-shadow:inset 0 0 0 1px rgba(168,85,247,.18)}
.restarbeiten-filterleiste__classFilter{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px;align-self:stretch;min-width:0}
.restarbeiten-filterleiste__classFilterButton{min-height:18px;padding:1px 6px;border:1px solid #d6dddd;border-radius:999px;background:#fff;font-size:9px;font-weight:600;white-space:nowrap;text-align:center;color:#253041}
.restarbeiten-filterleiste__classFilterButton[data-active="1"]{background:#dbead6;border-color:#86a786;color:#1f4d2f}
.restarbeiten-filterleiste__locationFilters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:2px;min-width:0;align-items:end}
.restarbeiten-filterleiste__locationGroupA,.restarbeiten-filterleiste__locationGroupB{display:contents}
.restarbeiten-filterleiste__metaFilters{display:grid;width:max-content;box-sizing:border-box;padding-left:0;grid-template-columns:80px 70px 110px 96px;gap:4px;justify-content:end;min-width:0;align-items:end;background:rgba(255,252,245,.72);outline:1px dashed rgba(245,158,11,.34);outline-offset:-1px}
@media (max-width:980px){.restarbeiten-listHeader__grid{grid-template-columns:1fr}.restarbeiten-listHeader__panel--class .restarbeiten-listHeader__content,.restarbeiten-listHeader__panel--meta .restarbeiten-listHeader__content{min-height:0}.restarbeiten-filterleiste__locationFilters{grid-template-columns:1fr}.restarbeiten-filterleiste__metaFilters{grid-template-columns:1fr 1fr}.restarbeiten-header__actions{margin-left:0}}
[data-bbm-restarbeiten-screen-area="sheet"]{flex:1;min-height:0;overflow:auto;padding:12px 22px 14px}
.restarbeiten-sheet__list{min-height:100%;display:flex;flex-direction:column;justify-content:flex-end}
[data-bbm-restarbeiten-screen-sheet-canvas="true"],[data-bbm-restarbeiten-screen-edit-canvas="true"]{width:100%;max-width:940px;margin:0 auto}
[data-bbm-restarbeiten-screen-sheet-paper="true"]{background:#fff;border:1px solid #dce6f2;border-radius:12px;box-shadow:0 10px 24px rgba(15,23,42,.08);padding:8px 12px 12px}
.restarbeiten-workarea > [data-bbm-restarbeiten-quicklane="true"]{position:absolute;top:86px;right:12px;z-index:12;width:56px;min-height:0;border-left:0;background:transparent;padding:0;display:flex;flex-direction:column;align-items:center;gap:8px;overflow:visible;transition:width 180ms ease-out,opacity 180ms ease-out}
.restarbeiten-workarea > [data-bbm-restarbeiten-quicklane="true"][data-open="1"]{width:56px}
.restarbeiten-quicklane__pinRow{display:flex;justify-content:flex-end;width:100%}
.restarbeiten-quicklane__pinButton{display:inline-flex;align-items:center;justify-content:center;min-width:24px;min-height:24px;padding:0;border:0;background:transparent;box-shadow:none;appearance:none;-webkit-appearance:none;cursor:pointer}
.restarbeiten-quicklane__iconStack{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
.restarbeiten-quicklane__iconButton{display:inline-flex;align-items:center;justify-content:center;min-width:24px;min-height:24px;padding:0;border:0;outline:0;background:transparent;box-shadow:none;appearance:none;-webkit-appearance:none;cursor:pointer;transition:transform 140ms ease-out,opacity 140ms ease-out}
.restarbeiten-quicklane__iconButton::-moz-focus-inner{border:0;padding:0}
.restarbeiten-quicklane__iconButton:hover{transform:translateY(-1px)}
.restarbeiten-quicklane__icon{display:inline-flex;align-items:center;justify-content:center;font-size:22px;line-height:1}
.restarbeiten-quicklane__ampelIcon{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;width:14px;height:20px}
.restarbeiten-quicklane__ampelLamp{display:block;width:6px;height:6px;border-radius:999px;background:#a1a1aa;box-shadow:none;opacity:.35}
.restarbeiten-quicklane__ampelIcon[data-enabled="0"] .restarbeiten-quicklane__ampelLamp--top{background:#ef4444;opacity:1;box-shadow:0 0 8px rgba(239,68,68,.7)}
.restarbeiten-quicklane__ampelIcon[data-enabled="0"] .restarbeiten-quicklane__ampelLamp--mid{background:#fbbf24;opacity:.4}
.restarbeiten-quicklane__ampelIcon[data-enabled="0"] .restarbeiten-quicklane__ampelLamp--bottom{background:#22c55e;opacity:.25}
.restarbeiten-quicklane__ampelIcon[data-enabled="1"] .restarbeiten-quicklane__ampelLamp--top{background:#ef4444;opacity:.35}
.restarbeiten-quicklane__ampelIcon[data-enabled="1"] .restarbeiten-quicklane__ampelLamp--mid{background:#fbbf24;opacity:.6}
.restarbeiten-quicklane__ampelIcon[data-enabled="1"] .restarbeiten-quicklane__ampelLamp--bottom{background:#22c55e;opacity:1;box-shadow:0 0 8px rgba(34,197,94,.8)}
.restarbeiten-quicklane__pinButton .restarbeiten-quicklane__icon{font-size:18px}
.restarbeiten-quicklane__iconButton[aria-label="Ampel an/aus"] .restarbeiten-quicklane__icon{font-size:21px}
.restarbeiten-workarea > [data-bbm-restarbeiten-quicklane="true"][data-open="0"] .restarbeiten-quicklane__iconStack{opacity:0;pointer-events:none;transform:translateY(-2px);transition:opacity 180ms ease-out,transform 180ms ease-out}
[data-bbm-restarbeiten-quicklane="true"] .restarbeiten-quicklane__longtextIcon{display:inline-flex;flex-direction:column;justify-content:space-between;align-items:center;width:18px;height:18px}
[data-bbm-restarbeiten-quicklane="true"] .restarbeiten-quicklane__longtextLine{display:block;width:18px;height:2px;border-radius:999px;background:#3d4a5c;transition:opacity 140ms ease-out,width 140ms ease-out,background 140ms ease-out}
[data-bbm-restarbeiten-quicklane="true"] .restarbeiten-quicklane__longtextIcon[data-enabled="0"] .restarbeiten-quicklane__longtextLine{opacity:.45}
[data-bbm-restarbeiten-quicklane="true"] .restarbeiten-quicklane__longtextIcon[data-enabled="1"] .restarbeiten-quicklane__longtextLine{opacity:1}
[data-bbm-restarbeiten-quicklane="true"] .restarbeiten-quicklane__iconButton[data-active="true"]{background:#eef7ff;border-color:#b6d4ff;color:#0b4db4}
[data-bbm-restarbeiten-quicklane="true"] .restarbeiten-quicklane__iconButton[data-active="false"]{background:#ffffff;border-color:#d8d8d8;color:#222}
[data-pinned="1"]{color:#0b4db4}
[data-bbm-restarbeiten-screen="true"][data-ampel-visible="0"] .restarbeiten-list__ampel,
[data-bbm-restarbeiten-screen="true"][data-ampel-visible="0"] .restarbeiten-editbox__ampelPreview{display:none !important}
.restarbeiten-list__ampelToggle{display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;background:transparent;box-shadow:none;appearance:none;-webkit-appearance:none;cursor:pointer}
.restarbeiten-list__ampelSwitchIcon{display:inline-flex;align-items:center;justify-content:center;font-size:12px;line-height:1;opacity:.9}
.restarbeiten-list__ampelToggle[data-enabled="0"] .restarbeiten-list__ampelSwitchIcon{filter:grayscale(1);opacity:.55}
.restarbeiten-editbox__ampelToggle{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:0;border:0;background:transparent;box-shadow:none;appearance:none;-webkit-appearance:none;cursor:pointer}
.restarbeiten-editbox__ampelSwitchIcon{display:inline-flex;align-items:center;justify-content:center;font-size:12px;line-height:1;opacity:.9}
.restarbeiten-editbox__ampelToggle[data-enabled="0"] .restarbeiten-editbox__ampelSwitchIcon{filter:grayscale(1);opacity:.55}
.restarbeiten-editbox__ampelToggle[data-enabled="0"] .restarbeiten-editbox__ampelPreview{opacity:.45}
[data-bbm-restarbeiten-screen-area="edit"]{border-top:1px solid #d9e2ec;background:linear-gradient(180deg,#f8f4ec,#f1ebdf);padding:6px 10px 8px}
@media (max-width:1160px){.restarbeiten-workarea{flex-direction:column}.restarbeiten-workarea > [data-bbm-restarbeiten-quicklane="true"]{position:absolute;top:86px;right:12px;left:auto;width:56px}}
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
