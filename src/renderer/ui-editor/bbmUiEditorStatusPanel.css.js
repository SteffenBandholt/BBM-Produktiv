let installed = false;

export function injectBbmUiEditorStatusPanelStyles() {
  if (installed) return;
  installed = true;
  const style = document.createElement("style");
  style.setAttribute("data-bbm-ui-editor-status-panel-styles", "true");
  style.textContent = `
    .bbm-ui-editor-panel { padding: 22px; color: #172033; max-width: 1180px; margin: 0 auto; }
    .bbm-ui-editor-panel__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
    .bbm-ui-editor-panel h1 { margin: 0; font-size: 28px; }
    .bbm-ui-editor-panel h2 { margin: 0 0 12px; font-size: 17px; }
    .bbm-ui-editor-panel p { margin: 6px 0 0; color: #526070; }
    .bbm-ui-editor-panel__close, .bbm-ui-editor-panel__secondary { border: 1px solid #b9c4d0; background: #fff; color: #172033; border-radius: 8px; padding: 8px 12px; font-weight: 700; cursor: pointer; }
    .bbm-ui-editor-panel__close:hover, .bbm-ui-editor-panel__secondary:hover { background: #eef4fb; }
    .bbm-ui-editor-panel__notice { background: #eef6ff; border: 1px solid #c9ddf3; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; }
    .bbm-ui-editor-panel__error { background: #fff7ed; border: 1px solid #fdba74; color: #9a3412; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; font-weight: 700; }
    .bbm-ui-editor-panel__grid { display: grid; grid-template-columns: minmax(260px, 0.9fr) minmax(300px, 1fr) minmax(280px, 1fr); gap: 14px; align-items: start; }
    .bbm-ui-editor-card { background: #fff; border: 1px solid #d7dde5; border-radius: 12px; padding: 14px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06); }
    .bbm-ui-editor-status-list { display: grid; gap: 8px; margin: 0; }
    .bbm-ui-editor-status-row { display: grid; grid-template-columns: minmax(130px, 0.9fr) minmax(120px, 1fr); gap: 8px; border-bottom: 1px solid #edf0f4; padding-bottom: 7px; }
    .bbm-ui-editor-status-row dt { color: #526070; font-size: 12px; }
    .bbm-ui-editor-status-row dd { margin: 0; font-weight: 700; overflow-wrap: anywhere; }
    .bbm-ui-editor-elements { display: grid; gap: 8px; }
    .bbm-ui-editor-element { text-align: left; display: grid; gap: 4px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 10px; padding: 10px; cursor: pointer; }
    .bbm-ui-editor-element[aria-pressed="true"] { border-color: #2563eb; background: #eff6ff; }
    .bbm-ui-editor-element span { color: #64748b; font-size: 12px; overflow-wrap: anywhere; }
    .bbm-ui-editor-element em { color: #2563eb; font-size: 12px; font-style: normal; font-weight: 800; }
    .bbm-ui-editor-panel__runtime { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-weight: 700; color: #172033; }
    .bbm-ui-editor-panel__runtime select { border: 1px solid #b9c4d0; border-radius: 8px; padding: 7px 10px; background: #fff; color: #172033; font-weight: 700; }
    .bbm-ui-editor-panel__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .bbm-ui-editor-panel__empty { color: #64748b; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 12px; }
    .bbm-ui-editor-panel__selected-name { font-weight: 800; color: #172033; }
    .bbm-ui-editor-layout-console { display: grid; gap: 12px; margin-top: 12px; }
    .bbm-ui-editor-layout-console__group { border: 1px solid #d7dde5; border-radius: 10px; padding: 10px; background: #f8fafc; }
    .bbm-ui-editor-layout-console__group h3 { margin: 0 0 8px; font-size: 14px; }
    .bbm-ui-editor-layout-console__buttons { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    @media (max-width: 980px) { .bbm-ui-editor-panel__grid { grid-template-columns: 1fr; } }
  `;
  document.head?.appendChild(style);
}
