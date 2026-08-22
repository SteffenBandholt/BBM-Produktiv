const RESTARBEITEN_STYLE_TAG = "bbm-restarbeiten-m1-styles";
const RESTARBEITEN_QUICKLANE_FIX_TAG = "bbm-restarbeiten-quicklane-fix-styles";
let RESTARBEITEN_STYLE_HREF = "./styles/restarbeiten.css";
let RESTARBEITEN_QUICKLANE_FIX_HREF = "./styles/restarbeitenQuicklaneFix.css";

try {
  RESTARBEITEN_STYLE_HREF = new URL("./styles/restarbeiten.css", import.meta.url).href;
  RESTARBEITEN_QUICKLANE_FIX_HREF = new URL("./styles/restarbeitenQuicklaneFix.css", import.meta.url).href;
} catch (_err) {
  // Testloader/Data-URL fallback: relative href bleibt im Renderer harmless.
}

function ensureStylesheet(tagName, href) {
  if (
    typeof document.querySelector === "function" &&
    document.querySelector(`link[data-${tagName}="true"]`)
  ) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute(`data-${tagName}`, "true");
  document.head.appendChild(link);
}

export function ensureRestarbeitenStyles() {
  if (typeof document === "undefined" || !document?.head) return;
  ensureStylesheet(RESTARBEITEN_STYLE_TAG, RESTARBEITEN_STYLE_HREF);
  ensureStylesheet(RESTARBEITEN_QUICKLANE_FIX_TAG, RESTARBEITEN_QUICKLANE_FIX_HREF);
}
