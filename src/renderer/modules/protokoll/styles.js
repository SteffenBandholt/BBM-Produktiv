const TOPS_V2_STYLE_TAG = "bbm-tops-v2-styles";
let TOPS_V2_STYLE_HREF = "./styles/tops.css";

try {
  TOPS_V2_STYLE_HREF = new URL("./styles/tops.css", import.meta.url).href;
} catch (_err) {
  // Testloader/Data-URL fallback: relative href bleibt fuer den Renderer harmless.
}

export function ensureProtokollModuleStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[data-${TOPS_V2_STYLE_TAG}="true"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = TOPS_V2_STYLE_HREF;
  link.setAttribute(`data-${TOPS_V2_STYLE_TAG}`, "true");
  document.head.appendChild(link);
}
