const POPUP_FORM_STANDARD_STYLE_TAG = "bbm-popup-form-standard-styles";
let popupFormStandardHref = "./styles/popupFormStandard.css";

try {
  popupFormStandardHref = new URL("./styles/popupFormStandard.css", import.meta.url).href;
} catch (_error) {
  // Testloader/Data-URL-Fallback: Der relative Pfad bleibt im Renderer harmlos.
}

export function ensurePopupFormStandardStyles() {
  if (typeof document === "undefined" || !document?.head) return;
  if (document.querySelector?.(`link[data-${POPUP_FORM_STANDARD_STYLE_TAG}="true"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = popupFormStandardHref;
  link.setAttribute(`data-${POPUP_FORM_STANDARD_STYLE_TAG}`, "true");
  document.head.appendChild(link);
}
