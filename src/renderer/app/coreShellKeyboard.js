export function registerCoreShellKeyboardHandling() {
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== "Escape") return;

    const overlays = Array.from(document.querySelectorAll("div")).filter((el) => {
      if (!el || !el.style) return false;
      if (el.style.display === "none") return false;
      if (el.style.position !== "fixed") return false;
      const z = Number(el.style.zIndex || 0);
      return Number.isFinite(z) && z >= 9999;
    });

    if (!overlays.length) return;
    const top = overlays[overlays.length - 1];
    const buttons = Array.from(top.querySelectorAll("button"));
    if (!buttons.length) return;

    const isEscape = e.key === "Escape";
    const preferred = isEscape
      ? ["abbrechen", "schlieÃŸen", "close", "cancel", "Ã—", "âœ•"]
      : ["speichern", "lÃ¶schen", "ok", "Ã¼bernehmen", "zuordnen"];

    const findBtn = () => {
      for (const label of preferred) {
        const btn = buttons.find((b) =>
          (b.textContent || "").toLowerCase().includes(label)
        );
        if (btn) return btn;
      }
      return null;
    };

    const btn = findBtn();
    if (!btn || btn.disabled) return;

    e.preventDefault();
    btn.click();
  });
}
