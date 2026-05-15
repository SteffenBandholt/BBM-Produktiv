export function createCoreShellNavigationRuntime({ header, getUpdateContextButtons } = {}) {
  const buttonsByKey = new Map();

  const setActive = (key) => {
    for (const [k, btn] of buttonsByKey.entries()) {
      const active = k === key;
      btn.dataset.active = active ? "true" : "false";
      btn.style.background = active ? "var(--sidebar-active-bg)" : "transparent";
      btn.style.border = active
        ? "1px solid var(--sidebar-active-bg)"
        : "1px solid rgba(226, 232, 240, 0.28)";
      btn.style.boxShadow = "none";
      btn.style.color = "var(--sidebar-text)";
      btn.style.fontWeight = active ? "700" : "400";
    }
  };

  const runNavSafe = (fn) => {
    return async () => {
      try {
        await fn();
      } catch (e) {
        console.error("[nav] failed:", e);
        alert(e?.message || String(e) || "Navigation fehlgeschlagen");
      } finally {
        header?.refresh?.();
        const updateContextButtons =
          typeof getUpdateContextButtons === "function" ? getUpdateContextButtons() : null;
        if (typeof updateContextButtons === "function") {
          updateContextButtons();
        }
      }
    };
  };

  return { buttonsByKey, setActive, runNavSafe };
}
