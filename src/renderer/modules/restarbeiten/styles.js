const RESTARBEITEN_STYLE_TAG = "bbm-restarbeiten-m1-styles";
let RESTARBEITEN_STYLE_HREF = "./styles/restarbeiten.css";

try {
  RESTARBEITEN_STYLE_HREF = new URL("./styles/restarbeiten.css", import.meta.url).href;
} catch (_err) {
  // Testloader/Data-URL fallback: relative href bleibt im Renderer harmless.
}

export function ensureRestarbeitenStyles() {
  if (typeof document === "undefined" || !document?.head) return;
  if (
    typeof document.querySelector === "function" &&
    document.querySelector(`link[data-${RESTARBEITEN_STYLE_TAG}="true"]`)
  ) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = RESTARBEITEN_STYLE_HREF;
  link.setAttribute(`data-${RESTARBEITEN_STYLE_TAG}`, "true");
  document.head.appendChild(link);
}
