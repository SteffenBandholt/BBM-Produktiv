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
      --btn-secondary-bg: #ffffff;
      --btn-secondary-border: #d4dbe6;
      --btn-secondary-text: #0f172a;
      --btn-secondary-hover-bg: #fbfdff;
      --btn-secondary-hover-border: #b7c7dd;
      --btn-secondary-active-bg: #f2f7fc;
      --btn-ghost-bg: transparent;
      --btn-ghost-border: transparent;
      --btn-ghost-text: #475569;
      --btn-ghost-hover-bg: rgba(37, 99, 235, 0.06);
      --btn-ghost-hover-border: transparent;
      --btn-primary-bg: #1d6fd1;
      --btn-primary-text: #ffffff;
      --btn-primary-hover-bg: #1a63b9;
      --btn-primary-border: #1d6fd1;
      --btn-danger-bg: #be3535;
      --btn-danger-text: #ffffff;
      --btn-danger-hover-bg: #aa2c2c;
      --btn-danger-border: #be3535;
      --btn-warn-bg: #d98b11;
      --btn-warn-text: #ffffff;
      --btn-warn-hover-bg: #c77d0f;
      --btn-warn-border: #d98b11;
      --btn-focus-ring: rgba(29, 111, 209, 0.22);
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
      padding: 4px 8px;
      border-radius: var(--btn-radius);
      border: 1px solid var(--btn-secondary-border);
      background: var(--btn-secondary-bg);
      color: var(--btn-secondary-text);
      font-size: 12.5px;
      font-weight: 500;
      min-height: 28px;
      line-height: 1.15;
      cursor: pointer;
      transition: background 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
    }
    button:hover:not(:disabled) {
      background: var(--btn-secondary-hover-bg);
      border-color: var(--btn-secondary-hover-border);
    }
    button:active:not(:disabled) {
      background: var(--btn-secondary-active-bg);
    }
    button:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px var(--btn-focus-ring);
    }
    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    button:not([data-variant]),
    button[data-variant="secondary"] {
      background: var(--btn-secondary-bg);
      border-color: var(--btn-secondary-border);
      color: var(--btn-secondary-text);
    }
    button:not([data-variant]):hover:not(:disabled),
    button[data-variant="secondary"]:hover:not(:disabled) {
      background: var(--btn-secondary-hover-bg);
      border-color: var(--btn-secondary-hover-border);
    }
    button:not([data-variant]):active:not(:disabled),
    button[data-variant="secondary"]:active:not(:disabled) {
      background: var(--btn-secondary-active-bg);
    }
    button[data-variant="ghost"] {
      background: var(--btn-ghost-bg);
      border-color: var(--btn-ghost-border);
      color: var(--btn-ghost-text);
    }
    button[data-variant="ghost"]:hover:not(:disabled) {
      background: var(--btn-ghost-hover-bg);
      border-color: var(--btn-ghost-hover-border);
    }
    button[data-variant="ghost"]:active:not(:disabled) {
      background: rgba(37, 99, 235, 0.12);
    }
    button[data-variant="primary"] {
      background: var(--btn-primary-bg);
      border-color: var(--btn-primary-border);
      color: var(--btn-primary-text);
    }
    button[data-variant="primary"]:hover:not(:disabled) {
      background: var(--btn-primary-hover-bg);
      border-color: var(--btn-primary-hover-bg);
    }
    button[data-variant="danger"] {
      background: var(--btn-danger-bg);
      border-color: var(--btn-danger-border);
      color: var(--btn-danger-text);
    }
    button[data-variant="danger"]:hover:not(:disabled) {
      background: var(--btn-danger-hover-bg);
      border-color: var(--btn-danger-hover-bg);
    }
    button[data-variant="warn"] {
      background: var(--btn-warn-bg);
      border-color: var(--btn-warn-border);
      color: var(--btn-warn-text);
    }
    button[data-variant="warn"]:hover:not(:disabled) {
      background: var(--btn-warn-hover-bg);
      border-color: var(--btn-warn-hover-bg);
    }
  `;
  document.head.appendChild(themeStyle);
}
