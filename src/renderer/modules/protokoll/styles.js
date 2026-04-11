const TOPS_V2_STYLE_TAG = "bbm-tops-v2-styles";
const TOPS_V2_STYLE_HREF = new URL("../../tops/styles/tops.css", import.meta.url).href;

export function ensureProtokollModuleStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[data-${TOPS_V2_STYLE_TAG}="true"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = TOPS_V2_STYLE_HREF;
  link.setAttribute(`data-${TOPS_V2_STYLE_TAG}`, "true");
  document.head.appendChild(link);
}
