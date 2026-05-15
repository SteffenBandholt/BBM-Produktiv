export function mkNavBtn({ buttonsByKey, runNavSafe }, key, label, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.style.display = "flex";
  b.style.alignItems = "center";
  b.style.width = "100%";
  b.style.boxSizing = "border-box";
  b.style.padding = "10px 10px";
  b.style.borderRadius = "8px";
  b.style.cursor = "pointer";
  b.style.background = "transparent";
  b.style.border = "1px solid rgba(226, 232, 240, 0.28)";
  b.style.boxShadow = "none";
  b.style.appearance = "none";
  b.style.color = "var(--sidebar-text)";
  b.style.textAlign = "left";
  b.style.transition = "background 120ms ease, border-color 120ms ease";
  b.onmouseenter = () => {
    if (b.disabled || b.dataset.active === "true") return;
    b.style.background = "var(--sidebar-hover-bg)";
  };
  b.onmouseleave = () => {
    if (b.disabled || b.dataset.active === "true") return;
    b.style.background = "transparent";
  };
  b.onclick = runNavSafe(onClick);

  buttonsByKey.set(key, b);
  return b;
}

export function mkActionBtn(runNavSafe, label, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.style.display = "flex";
  b.style.alignItems = "center";
  b.style.width = "100%";
  b.style.boxSizing = "border-box";
  b.style.padding = "10px 10px";
  b.style.borderRadius = "8px";
  b.style.cursor = "pointer";
  b.style.background = "transparent";
  b.style.border = "1px solid rgba(226, 232, 240, 0.28)";
  b.style.boxShadow = "none";
  b.style.appearance = "none";
  b.style.color = "var(--sidebar-text)";
  b.style.textAlign = "left";
  b.style.transition = "background 120ms ease, border-color 120ms ease";
  b.onmouseenter = () => {
    if (b.disabled) return;
    b.style.background = "var(--sidebar-hover-bg)";
  };
  b.onmouseleave = () => {
    if (b.disabled) return;
    b.style.background = "transparent";
  };
  b.onclick = runNavSafe(onClick);
  return b;
}

export function setBtnEnabled(btn, enabled, titleWhenDisabled) {
  if (!btn) return;
  const isEnabled = !!enabled;
  btn.disabled = !isEnabled;
  btn.style.opacity = isEnabled ? "1" : "0.55";
  btn.style.cursor = isEnabled ? "pointer" : "not-allowed";
  btn.title = isEnabled ? "" : (titleWhenDisabled || "");
}

export function appendButtonGroup(container, buttons) {
  if (!container || !Array.isArray(buttons) || buttons.length === 0) return;
  container.append(...buttons.filter(Boolean));
}

export function createScreenRouteButton({ buttonsByKey, runNavSafe }, { key, label, onClick, getPayload, onMissingContext } = {}) {
  return mkNavBtn({ buttonsByKey, runNavSafe }, key, label, async () => {
    const payload = typeof getPayload === "function" ? (getPayload() || {}) : {};
    if (payload.missingContext) {
      if (typeof onMissingContext === "function") {
        await onMissingContext();
      }
      return;
    }
    if (typeof onClick === "function") {
      await onClick(payload);
    }
  });
}
