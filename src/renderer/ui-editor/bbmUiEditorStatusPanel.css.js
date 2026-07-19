let installed = false;

export function injectBbmUiEditorStatusPanelStyles() {
  if (installed) return;
  installed = true;
  const style = document.createElement("style");
  style.setAttribute("data-bbm-ui-editor-status-panel-styles", "true");
  style.textContent = `
    .bbm-ui-editor-workspace { padding: 22px; color: #172033; max-width: 1280px; margin: 0 auto; }
    .bbm-ui-editor-panel { color: #172033; }
    .bbm-ui-editor-panel__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
    .bbm-ui-editor-panel h1 { margin: 0; font-size: 28px; }
    .bbm-ui-editor-panel h2 { margin: 0 0 12px; font-size: 17px; }
    .bbm-ui-editor-panel p { margin: 6px 0 0; color: #526070; }
    .bbm-ui-editor-panel__close, .bbm-ui-editor-panel__secondary { border: 1px solid #b9c4d0; background: #fff; color: #172033; border-radius: 8px; padding: 8px 12px; font-weight: 700; cursor: pointer; }
    .bbm-ui-editor-panel__close:hover, .bbm-ui-editor-panel__secondary:hover { background: #eef4fb; }
    .bbm-ui-editor-panel__notice { background: #eef6ff; border: 1px solid #c9ddf3; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; }
    .bbm-ui-editor-panel__error { background: #fff7ed; border: 1px solid #fdba74; color: #9a3412; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; font-weight: 700; }
    .bbm-ui-editor-panel__grid { display: grid; grid-template-columns: minmax(260px, 0.9fr) minmax(300px, 1fr); gap: 14px; align-items: start; margin-bottom: 16px; }
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
    .bbm-ui-editor-layout-console { display: grid; gap: 12px; margin-top: 12px; justify-items: center; }
    .bbm-ui-editor-layout-console__modes { display: grid; grid-template-columns: repeat(3, minmax(72px, 1fr)); gap: 8px; width: 100%; }
    .bbm-ui-editor-layout-console__mode, .bbm-ui-editor-layout-console__pad-button { border: 1px solid #b9c4d0; background: #fff; color: #172033; border-radius: 8px; padding: 8px 10px; font-weight: 800; cursor: pointer; }
    .bbm-ui-editor-layout-console__mode[aria-pressed="true"] { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
    .bbm-ui-editor-layout-console__pad { display: grid; grid-template-columns: repeat(3, 42px); grid-template-areas: ". up ." "left center right" ". down ."; gap: 8px; align-items: center; justify-content: center; }
    .bbm-ui-editor-layout-console__pad-button--up { grid-area: up; }
    .bbm-ui-editor-layout-console__pad-button--left { grid-area: left; }
    .bbm-ui-editor-layout-console__pad-button--center { grid-area: center; }
    .bbm-ui-editor-layout-console__pad-button--right { grid-area: right; }
    .bbm-ui-editor-layout-console__pad-button--down { grid-area: down; }
    .bbm-ui-editor-layout-console__mode:disabled, .bbm-ui-editor-layout-console__pad-button:disabled { opacity: 0.45; cursor: not-allowed; }
    .bbm-ui-editor-test-layout { display: grid; grid-template-columns: minmax(650px, 1fr) minmax(320px, 380px); gap: 16px; align-items: start; }
    .bbm-ui-editor-test-control-panel { position: sticky; top: 16px; align-self: start; display: grid; gap: 14px; }
    .bbm-ui-editor-test-surface { min-height: 360px; border: 1px dashed #f97316; border-radius: 14px; background: #fff7ed; padding: 28px; box-sizing: border-box; overflow: visible; min-width: 0; }
    .bbm-ui-editor-test-surface h2 { margin: 0; color: #9a3412; }
    .bbm-ui-editor-test-surface__hint { max-width: 680px; color: #9a3412; margin-bottom: 24px; }
    .bbm-ui-editor-test-card { width: 300px; min-height: 300px; box-sizing: border-box; border: 3px solid #f97316; border-radius: 14px; background: #ffffff; box-shadow: 0 12px 28px rgba(154, 52, 18, 0.16); padding: 18px; color: #172033; }
    .bbm-ui-editor-test-card h3 { margin: 0 0 10px; display: block; border: 1px solid transparent; border-radius: 8px; padding: 4px 6px; color: #9a3412; font-size: 22px; }
    .bbm-ui-editor-test-card p { margin: 0 0 10px; color: #334155; line-height: 1.45; border: 1px solid transparent; border-radius: 8px; padding: 4px 6px; }
    .bbm-ui-editor-test-card__button-shell, .bbm-ui-editor-test-card__field-shell { display: inline-flex; align-items: center; min-height: 34px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 9px; background: #f8fafc; padding: 7px 10px; margin: 0 8px 8px 0; color: #172033; font-weight: 700; }
    .bbm-ui-editor-test-card__button-shell { border-color: #fb923c; background: #fff7ed; color: #9a3412; }
    .bbm-ui-editor-test-table { margin-top: 18px; width: 420px; border-collapse: collapse; background: #fff; color: #172033; box-shadow: 0 8px 20px rgba(154, 52, 18, 0.10); }
    .bbm-ui-editor-test-table td { border: 1px solid #fed7aa; padding: 8px 10px; }
    @media (max-width: 1100px) { .bbm-ui-editor-panel__grid, .bbm-ui-editor-test-layout { grid-template-columns: 1fr; } .bbm-ui-editor-test-control-panel { position: static; } .bbm-ui-editor-test-surface { overflow-x: auto; } }
  `;
  document.head?.appendChild(style);
}
