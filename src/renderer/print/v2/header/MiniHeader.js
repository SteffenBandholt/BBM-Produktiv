import { headerUtils } from "./headerUtils.js";

export function renderV2MiniHeader({ data, pageNo, totalPages, modeLabel } = {}) {
  const header = headerUtils.el("div", "v2Header v2HeaderMini");
  const invoice = String(data?.mode || "").trim().toLowerCase() === "invoice"
    ? data?.invoice || {}
    : null;
  if (invoice) {
    header.dataset.uiInspectorId = "pdf.bbm.invoice.header";
    header.dataset.uiEditorKind = "header";
    header.dataset.uiEditorLabel = "Rechnungskopf";
    header.dataset.uiEditorParent = "pdf.bbm.invoice.page-template";
    header.dataset.uiEditorEditable = "true";
    header.dataset.uiEditorOps = "setVisibility";
  }
  const settings = data?.settings || {};
  const titleText = headerUtils.resolveHeaderTitle({
    data,
    settings,
    meeting: data?.meeting,
    modeLabel,
  });
  const brandingText = headerUtils.resolveBranding({ data });

  const topRow = headerUtils.el("div", "v2MiniTopRow");
  const invoiceNumber = String(invoice?.invoice_number || "").trim();
  const line1Project = headerUtils.el(
    "div",
    "v2MiniProject",
    invoice ? [invoice.document_type_display || "Rechnung", invoiceNumber].filter(Boolean).join(" ") : headerUtils.projectLabel(data?.project)
  );
  const rightPage = headerUtils.el("div", "v2MiniRight");
  rightPage.append(
    headerUtils.el("span", "v2MiniPageLabel", "Seite "),
    headerUtils.el("span", "v2MiniPageValue", pageNo + " / " + totalPages)
  );
  topRow.append(line1Project, rightPage);

  const line2Protocol = headerUtils.el(
    "div",
    "v2MiniProtocolTitle",
    invoice ? invoice.service_reference || invoice.construction_project || titleText : titleText
  );
  line2Protocol.setAttribute("data-v2", "miniText");
  if (brandingText) {
    line2Protocol.appendChild(
      headerUtils.el("span", "v2MiniDraftNotice", "Vorabzug - nicht freigegeben")
    );
  }

  const line = headerUtils.el("div", "v2Divider v2MiniDivider");
  line.setAttribute("data-v2", "miniLine");

  header.append(topRow, line2Protocol);
  header.append(headerUtils.el("div", "v2MiniGapTextLine"), line, headerUtils.el("div", "v2MiniGapLineBody"));

  return header;
}
