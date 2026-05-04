export function injectCoreShellBaseStyles() {
  const existing = document.querySelector('style[data-bbm-core-shell-styles="true"]');
  if (existing) return;

  const themeStyle = document.createElement("style");
  themeStyle.setAttribute("data-bbm-core-shell-styles", "true");
  themeStyle.textContent = `
    :root {
      --bbm-font-ui: "Noto Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --bbm-button-height: 28px;
      --bbm-button-height-sm: 24px;
      --bbm-button-radius: 8px;
      --bbm-button-padding-x: 10px;
      --bbm-button-padding-y: 4px;
      --bbm-button-padding-x-sm: 8px;
      --bbm-button-padding-y-sm: 3px;
      --bbm-button-font-size: 12.5px;
      --bbm-button-font-size-sm: 12px;
      --bbm-button-font-weight: 500;
      --bbm-button-line-height: 1.15;
      --bbm-button-text: #0f172a;
      --bbm-button-bg: #ffffff;
      --bbm-button-border: #d4dbe6;
      --bbm-button-bg-hover: #fbfdff;
      --bbm-button-border-hover: #b7c7dd;
      --bbm-button-bg-active: #f2f7fc;
      --bbm-button-disabled-opacity: 0.55;
      --bbm-button-focus-ring: rgba(29, 111, 209, 0.22);
      --bbm-button-primary-bg: #1d6fd1;
      --bbm-button-primary-bg-hover: #1a63b9;
      --bbm-button-primary-border: #1d6fd1;
      --bbm-button-primary-text: #ffffff;
      --bbm-button-danger-bg: #be3535;
      --bbm-button-danger-bg-hover: #aa2c2c;
      --bbm-button-danger-border: #be3535;
      --bbm-button-danger-text: #ffffff;
      --bbm-button-ghost-bg: transparent;
      --bbm-button-ghost-bg-hover: rgba(37, 99, 235, 0.06);
      --bbm-button-ghost-border: transparent;
      --bbm-button-ghost-text: #475569;
      --bbm-button-warn-bg: #d98b11;
      --bbm-button-warn-bg-hover: #c77d0f;
      --bbm-button-warn-border: #d98b11;
      --bbm-button-warn-text: #ffffff;
      --btn-radius: var(--bbm-button-radius);
      --btn-secondary-bg: var(--bbm-button-bg);
      --btn-secondary-border: var(--bbm-button-border);
      --btn-secondary-text: var(--bbm-button-text);
      --btn-secondary-hover-bg: var(--bbm-button-bg-hover);
      --btn-secondary-hover-border: var(--bbm-button-border-hover);
      --btn-secondary-active-bg: var(--bbm-button-bg-active);
      --btn-ghost-bg: var(--bbm-button-ghost-bg);
      --btn-ghost-border: var(--bbm-button-ghost-border);
      --btn-ghost-text: var(--bbm-button-ghost-text);
      --btn-ghost-hover-bg: var(--bbm-button-ghost-bg-hover);
      --btn-ghost-hover-border: var(--bbm-button-ghost-border);
      --btn-primary-bg: var(--bbm-button-primary-bg);
      --btn-primary-text: var(--bbm-button-primary-text);
      --btn-primary-hover-bg: var(--bbm-button-primary-bg-hover);
      --btn-primary-border: var(--bbm-button-primary-border);
      --btn-danger-bg: var(--bbm-button-danger-bg);
      --btn-danger-text: var(--bbm-button-danger-text);
      --btn-danger-hover-bg: var(--bbm-button-danger-bg-hover);
      --btn-danger-border: var(--bbm-button-danger-border);
      --btn-warn-bg: var(--bbm-button-warn-bg);
      --btn-warn-text: var(--bbm-button-warn-text);
      --btn-warn-hover-bg: var(--bbm-button-warn-bg-hover);
      --btn-warn-border: var(--bbm-button-warn-border);
      --btn-focus-ring: var(--bbm-button-focus-ring);
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
      padding: var(--bbm-button-padding-y) var(--bbm-button-padding-x);
      border-radius: var(--bbm-button-radius);
      border: 1px solid var(--bbm-button-border);
      background: var(--bbm-button-bg);
      color: var(--bbm-button-text);
      font-size: var(--bbm-button-font-size);
      font-weight: var(--bbm-button-font-weight);
      min-height: var(--bbm-button-height);
      line-height: var(--bbm-button-line-height);
      cursor: pointer;
      transition: background 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
    }
    button:hover:not(:disabled) {
      background: var(--bbm-button-bg-hover);
      border-color: var(--bbm-button-border-hover);
    }
    button:active:not(:disabled) {
      background: var(--bbm-button-bg-active);
    }
    button:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px var(--bbm-button-focus-ring);
    }
    button:disabled {
      opacity: var(--bbm-button-disabled-opacity);
      cursor: not-allowed;
    }
    button[data-size="sm"] {
      padding: var(--bbm-button-padding-y-sm) var(--bbm-button-padding-x-sm);
      min-height: var(--bbm-button-height-sm);
      font-size: var(--bbm-button-font-size-sm);
    }
    button:not([data-variant]),
    button[data-variant="secondary"] {
      background: var(--bbm-button-bg);
      border-color: var(--bbm-button-border);
      color: var(--bbm-button-text);
    }
    button:not([data-variant]):hover:not(:disabled),
    button[data-variant="secondary"]:hover:not(:disabled) {
      background: var(--bbm-button-bg-hover);
      border-color: var(--bbm-button-border-hover);
    }
    button:not([data-variant]):active:not(:disabled),
    button[data-variant="secondary"]:active:not(:disabled) {
      background: var(--bbm-button-bg-active);
    }
    button[data-variant="ghost"] {
      background: var(--bbm-button-ghost-bg);
      border-color: var(--bbm-button-ghost-border);
      color: var(--bbm-button-ghost-text);
    }
    button[data-variant="ghost"]:hover:not(:disabled) {
      background: var(--bbm-button-ghost-bg-hover);
      border-color: var(--bbm-button-ghost-border);
    }
    button[data-variant="ghost"]:active:not(:disabled) {
      background: rgba(37, 99, 235, 0.12);
    }
    button[data-variant="primary"] {
      background: var(--bbm-button-primary-bg);
      border-color: var(--bbm-button-primary-border);
      color: var(--bbm-button-primary-text);
    }
    button[data-variant="primary"]:hover:not(:disabled) {
      background: var(--bbm-button-primary-bg-hover);
      border-color: var(--bbm-button-primary-bg-hover);
    }
    button[data-variant="danger"] {
      background: var(--bbm-button-danger-bg);
      border-color: var(--bbm-button-danger-border);
      color: var(--bbm-button-danger-text);
    }
    button[data-variant="danger"]:hover:not(:disabled) {
      background: var(--bbm-button-danger-bg-hover);
      border-color: var(--bbm-button-danger-bg-hover);
    }
    button[data-variant="warn"] {
      background: var(--bbm-button-warn-bg);
      border-color: var(--bbm-button-warn-border);
      color: var(--bbm-button-warn-text);
    }
    button[data-variant="warn"]:hover:not(:disabled) {
      background: var(--bbm-button-warn-bg-hover);
      border-color: var(--bbm-button-warn-bg-hover);
    }
  `;
  document.head.appendChild(themeStyle);
}
