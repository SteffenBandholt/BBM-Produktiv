const RECHNUNGEN_DESIGN_STYLE_TAG = "bbm-rechnungen-design-styles";
let RECHNUNGEN_DESIGN_STYLE_HREF = "./styles/rechnungenDesign.css";

try {
  RECHNUNGEN_DESIGN_STYLE_HREF = new URL("./styles/rechnungenDesign.css", import.meta.url).href;
} catch (_error) {
  // Testloader/Data-URL fallback: relativer Pfad bleibt im Renderer harmlos.
}

export function ensureRechnungenDesignStyles() {
  if (typeof document === "undefined" || !document?.head) return;
  if (document.querySelector?.(`link[data-${RECHNUNGEN_DESIGN_STYLE_TAG}="true"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = RECHNUNGEN_DESIGN_STYLE_HREF;
  link.setAttribute(`data-${RECHNUNGEN_DESIGN_STYLE_TAG}`, "true");
  document.head.appendChild(link);
}
