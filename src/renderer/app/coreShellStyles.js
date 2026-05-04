export function injectCoreShellBaseStyles() {
  const existing = document.querySelector('style[data-bbm-core-shell-styles="true"]');
  if (existing) return;

  const themeStyle = document.createElement("style");
  themeStyle.setAttribute("data-bbm-core-shell-styles", "true");
  themeStyle.textContent = `
    :root {
      --bbm-font-ui: "Noto Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --header-bg: #D6ECFF;
      --header-text: #0F172A;
      --sidebar-bg: #0F172A;
      --sidebar-hover-bg: #172554;
      --sidebar-active-bg: #1D4ED8;
      --sidebar-active-indicator: #93C5FD;
      --sidebar-text: #E2E8F0;
      --main-bg: #F8FAFC;
      --card-bg: #FFFFFF;
      --card-border: #E2E8F0;
      --text-main: #0F172A;
      --btn-radius: 8px;
      --btn-outline-color: #1565c0;
      --btn-outline-bg: #ffffff;
      --btn-outline-hover-bg: #f1f6ff;
      --btn-primary-bg: #1976d2;
      --btn-primary-text: #ffffff;
      --btn-danger-bg: #c62828;
      --btn-danger-text: #ffffff;
      --btn-warn-bg: #f59e0b;
      --btn-warn-text: #ffffff;
      --btn-focus-ring: rgba(25, 118, 210, 0.35);
    }
    html,
    body,
    #content {
      font-family: var(--bbm-font-ui);
    }
    button,
    input,
    textarea,
    select,
    optgroup {
      font-family: inherit;
    }
    button {
      padding: 6px 10px;
      border-radius: var(--btn-radius);
      border: 1px solid var(--btn-outline-color);
      background: var(--btn-outline-bg);
      color: var(--btn-outline-color);
      font-weight: 600;
      min-height: 30px;
      cursor: pointer;
      transition: background 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
    }
    button:hover:not(:disabled) {
      background: var(--btn-outline-hover-bg);
      box-shadow: 0 1px 0 rgba(0,0,0,0.08);
    }
    button:active:not(:disabled) {
      box-shadow: inset 0 1px 0 rgba(0,0,0,0.12);
    }
    button:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px var(--btn-focus-ring);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    button[data-variant="primary"] {
      background: var(--btn-primary-bg);
      border-color: var(--btn-primary-bg);
      color: var(--btn-primary-text);
    }
    button[data-variant="primary"]:hover:not(:disabled) {
      filter: brightness(0.95);
    }
    button[data-variant="danger"] {
      background: var(--btn-danger-bg);
      border-color: var(--btn-danger-bg);
      color: var(--btn-danger-text);
    }
    button[data-variant="danger"]:hover:not(:disabled) {
      filter: brightness(0.95);
    }
    button[data-variant="warn"] {
      background: var(--btn-warn-bg);
      border-color: var(--btn-warn-bg);
      color: var(--btn-warn-text);
    }
    button[data-variant="warn"]:hover:not(:disabled) {
      filter: brightness(0.95);
    }
  `;
  document.head.appendChild(themeStyle);
}
