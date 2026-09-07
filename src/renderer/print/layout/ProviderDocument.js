import { headerUtils } from "../v2/header/headerUtils.js";

// The provider supplies content slots; PrintShell owns the page, header and footer.
export function buildProviderDocumentContent(data) {
  const content = data?.providerDocument;
  if (data?.mode !== "provider" || typeof content?.title !== "string" || !content.title.trim() ||
      typeof content?.body !== "string" || !content.body.trim()) throw new Error("PDF-Providerdaten fehlen.");
  const title = headerUtils.el("div", "providerTitle", content.title);
  const body = headerUtils.el("div", "providerBody", content.body);
  for (const [node, fontSize, height] of [[title, 14, 20], [body, 11, 150]]) {
    node.style.fontSize = `${fontSize}pt`;
    node.style.height = `${height}mm`;
    node.style.lineHeight = "1.35";
    node.style.whiteSpace = "pre-wrap";
    node.style.overflowWrap = "anywhere";
  }
  return { fullHeader: title, body };
}

// Measure the final DOM after editor styles and fonts, before print:ready.
// A bounded single-page document must fail instead of silently clipping text.
export function validateProviderDocumentLayout(root) {
  const page = root.querySelector(".page");
  const title = root.querySelector(".providerTitle");
  const body = root.querySelector(".providerBody");
  const footer = root.querySelector(".v2FooterReserveSpacer");
  if (!page || !title || !body || !footer || root.querySelectorAll(".page").length !== 1) {
    throw new Error("PDF-Provider-Seitenstruktur ist unvollständig.");
  }
  const pageRect = page.getBoundingClientRect();
  const footerRect = footer.getBoundingClientRect();
  const pageStyle = getComputedStyle(page);
  const left = pageRect.left + Number.parseFloat(pageStyle.paddingLeft);
  const right = pageRect.right - Number.parseFloat(pageStyle.paddingRight);
  const top = pageRect.top + Number.parseFloat(pageStyle.paddingTop);
  for (const node of [title, body]) {
    const rect = node.getBoundingClientRect();
    if (![left, right, top, footerRect.top, rect.left, rect.right, rect.top, rect.bottom].every(Number.isFinite) ||
        !(rect.width > 0 && rect.height > 0) || rect.left < left - 1 || rect.right > right + 1 ||
        rect.top < top - 1 || rect.bottom > footerRect.top + 1 ||
        node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1) {
      throw Object.assign(new Error("PDF-Providerinhalt überschreitet den Einseitenvertrag."), { code: "PDF_PROVIDER_LAYOUT_OVERFLOW" });
    }
  }
  if (title.getBoundingClientRect().bottom > body.getBoundingClientRect().top + 1) {
    throw Object.assign(new Error("PDF-Providertitel überlagert den Inhalt."), { code: "PDF_PROVIDER_LAYOUT_OVERFLOW" });
  }
  return root;
}
