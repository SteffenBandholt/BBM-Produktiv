export function registerCoreShellHeaderBridge({
  router,
  header,
  headerEl,
  applyThemeFromRouterContext,
} = {}) {
  if (!router || !header) return;

  const root = headerEl || header.root || null;

  router.openOutputMail = async () => {
    await header._openMailFileFlow();
  };
  router.openOutputPrint = async () => {
    await header._openPrintFileFlow();
  };
  router.openClosedProtocolSelector = async ({ mode } = {}) => {
    await header._openClosedProtocolSelectorFlow(mode || "view");
  };

  router.refreshHeader = () => {
    if (typeof applyThemeFromRouterContext === "function") {
      applyThemeFromRouterContext();
    }
    const isTopsView = !!router?.context?.ui?.isTopsView;
    if (root) {
      root.style.display = isTopsView ? "none" : "";
    }
    header.refresh();
  };

  window.addEventListener("bbm:header-refresh", () => {
    if (typeof applyThemeFromRouterContext === "function") {
      applyThemeFromRouterContext();
    }
    header.refresh();
  });

  window.addEventListener("bbm:theme-refresh", () => {
    if (typeof applyThemeFromRouterContext === "function") {
      applyThemeFromRouterContext();
    }
    header.refresh();
  });

  window.addEventListener("bbm:sticky-notice", (e) => {
    const msg = e?.detail?.message || "";
    router.context = router.context || {};
    router.context.ui = router.context.ui || {};
    router.context.ui.stickyNotice = msg;
    header.refresh();
  });
}
