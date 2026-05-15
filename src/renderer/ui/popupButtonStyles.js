// src/renderer/ui/popupButtonStyles.js

export function applyPopupButtonStyle(btn, { variant = "neutral" } = {}) {
  if (!btn || !btn.style) return;
  btn.style.padding = "var(--bbm-button-padding-y) var(--bbm-button-padding-x)";
  btn.style.borderRadius = "var(--bbm-button-radius)";
  btn.style.fontFamily = "var(--bbm-font-ui)";
  btn.style.fontSize = "var(--bbm-button-font-size)";
  btn.style.fontWeight = "var(--bbm-button-font-weight)";
  btn.style.minHeight = "var(--bbm-button-height)";
  btn.style.lineHeight = "var(--bbm-button-line-height)";
  btn.style.cursor = "pointer";
  btn.style.transition = "background 120ms ease, box-shadow 120ms ease, border-color 120ms ease, color 120ms ease";

  const mappedVariant = variant === "neutral" ? "secondary" : variant;
  if (["primary", "secondary", "danger", "warn", "ghost"].includes(mappedVariant)) {
    btn.dataset.variant = mappedVariant;
  } else {
    delete btn.dataset.variant;
  }
}

export function applyPopupCardStyle(card) {
  if (!card || !card.style) return;
  card.style.border = "1px solid var(--card-border)";
  card.style.borderRadius = "10px";
  card.style.background = "var(--card-bg)";
  card.style.boxShadow = "0 1px 0 rgba(0,0,0,0.05)";
  card.style.color = "var(--text-main)";
}
