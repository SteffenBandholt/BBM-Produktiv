import { draftPreviewIdentifier } from "../../../../shared/rechnung/invoiceHeaderRules.mjs";

export const INVOICE_SCOPE_ID = "pdf.bbm.invoice";

export const INVOICE_PDF_COLUMNS = Object.freeze([
  Object.freeze({ key: "number", label: "Pos", widthMm: 14, minMm: 12, maxMm: 28 }),
  Object.freeze({ key: "description", label: "Gegenstand", widthMm: 67, minMm: 50, maxMm: 120 }),
  Object.freeze({ key: "quantity", label: "Menge", widthMm: 20, minMm: 12, maxMm: 28 }),
  Object.freeze({ key: "unit", label: "Einheit", widthMm: 21, minMm: 10, maxMm: 24 }),
  Object.freeze({ key: "unit-price", label: "EP", widthMm: 32, minMm: 18, maxMm: 34 }),
  Object.freeze({ key: "total-price", label: "GP / NEP", widthMm: 32, minMm: 18, maxMm: 34 }),
]);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== null && text !== undefined) node.textContent = text;
  return node;
}

export function markInvoiceEditorElement(node, {
  id,
  kind,
  label,
  parentId = "",
  editable = false,
  operations = [],
} = {}) {
  if (!node) return node;
  node.dataset.uiInspectorId = id;
  node.dataset.uiEditorKind = kind;
  node.dataset.uiEditorLabel = label;
  node.dataset.uiEditorParent = parentId;
  node.dataset.uiEditorEditable = editable ? "true" : "false";
  node.dataset.uiEditorOps = operations.join(",");
  return node;
}

function appendAddress(container, snapshot = {}) {
  const lines = [
    snapshot.companyName,
    snapshot.companyName2,
    snapshot.street,
    [snapshot.zip, snapshot.city].filter(Boolean).join(" "),
  ].filter(Boolean);
  for (const line of lines) container.appendChild(element("div", "", line));
}

function previewIdentifier(invoice = {}) {
  return String(invoice.preview_identifier || "").trim() || draftPreviewIdentifier(invoice.id);
}

export function buildInvoiceFullHeaderContent(invoice = {}) {
  const wrapper = element("div", "invoicePdfFullHeaderContent");
  markInvoiceEditorElement(wrapper, {
    id: `${INVOICE_SCOPE_ID}.header`,
    kind: "header",
    label: "Rechnungs-FullHeader",
    parentId: `${INVOICE_SCOPE_ID}.page-template`,
    editable: true,
    operations: ["setVisibility"],
  });

  const letterhead = element("div", "invoicePdfLetterhead");
  const recipient = element("section", "invoicePdfRecipient");
  markInvoiceEditorElement(recipient, {
    id: `${INVOICE_SCOPE_ID}.recipient`,
    kind: "group",
    label: "Rechnungsempfänger",
    parentId: `${INVOICE_SCOPE_ID}.header`,
    editable: true,
    operations: ["setVisibility"],
  });
  recipient.appendChild(element("div", "invoicePdfRecipientLabel", "Rechnungsempfänger"));
  appendAddress(recipient, invoice.customer_snapshot || {});

  const meta = element("section", "invoicePdfMeta");
  markInvoiceEditorElement(meta, {
    id: `${INVOICE_SCOPE_ID}.meta`,
    kind: "group",
    label: "Rechnungsdaten",
    parentId: `${INVOICE_SCOPE_ID}.header`,
    editable: true,
    operations: ["setVisibility"],
  });
  const issuerAddress = element("div", "invoicePdfIssuerAddress");
  appendAddress(issuerAddress, invoice.issuer_snapshot || {});
  if (invoice.preview === true) {
    meta.appendChild(element("div", "invoicePdfDraftNotice", "Vorabzug - nicht freigegeben"));
  }
  meta.appendChild(issuerAddress);
  for (const [label, value] of [
    ["Rechnungsdatum", invoice.invoice_date_display],
    ["Leistungszeitraum", invoice.service_period_display],
  ]) {
    if (!value) continue;
    const row = element("div", "invoicePdfMetaRow");
    const labelNode = element("span", "invoicePdfMetaLabel", label);
    markInvoiceEditorElement(labelNode, {
      id: `${INVOICE_SCOPE_ID}.meta.label`,
      kind: "label",
      label: "Rechnungsdaten-Bezeichnung",
      parentId: `${INVOICE_SCOPE_ID}.meta`,
    });
    const valueNode = element("span", "invoicePdfMetaValue", value);
    markInvoiceEditorElement(valueNode, {
      id: `${INVOICE_SCOPE_ID}.meta.value`,
      kind: "value",
      label: "Rechnungsdaten-Wert",
      parentId: `${INVOICE_SCOPE_ID}.meta`,
    });
    row.append(labelNode, valueNode);
    meta.appendChild(row);
  }
  letterhead.append(recipient, meta);
  wrapper.appendChild(letterhead);

  const titleBlock = element("div", "invoicePdfTitleBlock");
  const numberText = invoice.preview === true
    ? `Kennung: ${previewIdentifier(invoice)}`
    : invoice.invoice_number
      ? `Rechnungsnummer: ${invoice.invoice_number}`
      : "";
  titleBlock.append(
    element("h1", "invoicePdfTitle", invoice.document_type_display || "Rechnung"),
    element("div", "invoicePdfNumber", numberText)
  );
  wrapper.appendChild(titleBlock);

  const contextValue = String(invoice.construction_project || invoice.service_reference || "").trim();
  if (contextValue) {
    const context = element("div", "invoicePdfContext");
    markInvoiceEditorElement(context, {
      id: `${INVOICE_SCOPE_ID}.context`,
      kind: "group",
      label: "Bauvorhaben / Leistungsbezug",
      parentId: `${INVOICE_SCOPE_ID}.header`,
      editable: true,
      operations: ["setVisibility"],
    });
    context.append(
      element("div", "invoicePdfContextLabel", "Bauvorhaben / Leistungsbezug"),
      element("div", "invoicePdfContextValue", contextValue)
    );
    wrapper.appendChild(context);
  }
  return wrapper;
}

export function buildInvoiceMiniHeaderContent(invoice = {}) {
  const invoiceDate = String(invoice.invoice_date_display || "").trim();
  const reference = String(invoice.construction_project || invoice.service_reference || "").trim() || "Rechnung";
  const numberLine = invoice.preview === true
    ? `Kennung: ${previewIdentifier(invoice)}${invoiceDate ? ` vom ${invoiceDate}` : ""}`
    : `Rechnungsnummer: ${String(invoice.invoice_number || "–").trim()}${invoiceDate ? ` vom ${invoiceDate}` : ""}`;
  return Object.freeze({
    primaryText: reference,
    secondaryText: numberLine,
    draftNotice: invoice.preview === true ? "Vorabzug - nicht freigegeben" : "",
    editor: Object.freeze({
      id: `${INVOICE_SCOPE_ID}.mini-header`,
      kind: "header",
      label: "Rechnungs-MiniHeader",
      parentId: `${INVOICE_SCOPE_ID}.page-template`,
      editable: true,
      operations: Object.freeze(["setVisibility"]),
    }),
  });
}

export function buildInvoiceBodyIntro(invoice = {}) {
  if (!invoice.intro_text) return null;
  const intro = element("div", "invoicePdfIntro", invoice.intro_text);
  markInvoiceEditorElement(intro, {
    id: `${INVOICE_SCOPE_ID}.intro`,
    kind: "text",
    label: "Einleitung",
    parentId: `${INVOICE_SCOPE_ID}.body`,
    editable: true,
    operations: ["setVisibility"],
  });
  return intro;
}

export function buildInvoiceTableHead() {
  const thead = document.createElement("thead");
  const row = document.createElement("tr");
  row.className = "invoicePdfTableHeadRow";
  for (const column of INVOICE_PDF_COLUMNS) {
    const visibleLabel = column.key === "total-price" ? "GP" : column.label;
    const cell = element("th", `invoicePdfCol invoicePdfCol--${column.key}`, visibleLabel);
    cell.dataset.invoiceColumn = column.key;
    markInvoiceEditorElement(cell, {
      id: `${INVOICE_SCOPE_ID}.positions.column.${column.key}`,
      kind: "tableColumn",
      label: column.label,
      parentId: `${INVOICE_SCOPE_ID}.positions`,
      editable: true,
      operations: ["resizeWidth"],
    });
    row.appendChild(cell);
  }
  thead.appendChild(row);
  return thead;
}

export function buildInvoiceColGroup() {
  const colgroup = document.createElement("colgroup");
  for (const column of INVOICE_PDF_COLUMNS) {
    const col = document.createElement("col");
    col.className = `invoicePdfCol invoicePdfCol--${column.key}`;
    col.dataset.invoiceColumn = column.key;
    col.dataset.minWidthMm = String(column.minMm);
    col.dataset.maxWidthMm = String(column.maxMm);
    col.style.width = `${column.widthMm}mm`;
    colgroup.appendChild(col);
  }
  return colgroup;
}

function specialRow(row, className, label = "") {
  const tr = document.createElement("tr");
  tr.className = className;
  tr.dataset.invoiceSourceId = String(row.sourceId || "");
  const cell = element("td", "invoicePdfSpecialCell");
  cell.colSpan = INVOICE_PDF_COLUMNS.length;
  if (label) cell.appendChild(element("div", "invoicePdfSpecialLabel", label));
  const titleLine = element("div", "invoicePdfTextShort");
  if (row.number) titleLine.appendChild(element("span", "invoicePdfSpecialNumber", row.number));
  titleLine.appendChild(element("span", "", row.shortText || ""));
  cell.appendChild(titleLine);
  if (row.longText) cell.appendChild(element("div", "invoicePdfTextLong", row.longText));
  tr.appendChild(cell);
  return tr;
}

export function buildInvoiceRow(row = {}) {
  if (row.kind === "invoiceTitle") return specialRow(row, "invoicePdfTitleRow");
  if (row.kind === "invoiceText") return specialRow(row, "invoicePdfTextRow");
  if (row.kind === "invoiceNote") return specialRow(row, "invoicePdfNoteRow", "Hinweis");

  const tr = document.createElement("tr");
  tr.className = "invoicePdfPositionRow";
  tr.dataset.invoiceSourceId = String(row.sourceId || "");
  const description = element("td", "invoicePdfCol invoicePdfCol--description");
  description.dataset.invoiceColumn = "description";
  description.appendChild(element("div", "invoicePdfPositionShort", row.description || ""));
  if (row.longText) description.appendChild(element("div", "invoicePdfPositionLong", row.longText));
  for (const [key, value] of [
    ["number", row.number],
    ["description", description],
    ["quantity", row.quantity],
    ["unit", row.unit],
    ["unit-price", row.unitPrice],
    ["total-price", row.totalPrice],
  ]) {
    const cell = value && value.nodeType === 1
      ? value
      : element("td", `invoicePdfCol invoicePdfCol--${key}`);
    if (!(value && value.nodeType === 1)) {
      cell.appendChild(element("span", "invoicePdfPositionValue", value || ""));
    }
    cell.dataset.invoiceColumn = key;
    tr.appendChild(cell);
  }
  return tr;
}

export function buildInvoiceTail(invoice = {}) {
  const wrapper = element("div", "invoicePdfTail");
  const totals = element("section", "invoicePdfTotals");
  markInvoiceEditorElement(totals, {
    id: `${INVOICE_SCOPE_ID}.totals`,
    kind: "group",
    label: "Rechnungssummen",
    parentId: `${INVOICE_SCOPE_ID}.body`,
    editable: true,
    operations: ["setVisibility"],
  });
  const addTotal = (label, value, emphasized = false) => {
    const row = element("div", `invoicePdfTotalRow${emphasized ? " is-emphasized" : ""}`);
    row.append(element("span", "", label), element("span", "", value || "0,00 EUR"));
    totals.appendChild(row);
  };
  addTotal("Nettosumme", invoice.totals_display?.net);
  for (const tax of invoice.vat_totals_display || []) addTotal(`${tax.rate_display} MwSt.`, tax.vat);
  addTotal("Rechnungsbetrag", invoice.totals_display?.gross, true);
  wrapper.appendChild(totals);

  const payment = element("div", "invoicePdfPayment", `Zahlbar bis ${invoice.due_date_display || "–"} ohne Abzug.`);
  markInvoiceEditorElement(payment, {
    id: `${INVOICE_SCOPE_ID}.payment`,
    kind: "text",
    label: "Zahlungstext",
    parentId: `${INVOICE_SCOPE_ID}.body`,
    editable: true,
    operations: ["setVisibility"],
  });
  wrapper.appendChild(payment);

  return wrapper;
}

export function buildInvoicePageFooter(invoice = {}) {
  const issuer = invoice.issuer_snapshot || {};
  const footer = element("div", "invoicePdfFooter");
  markInvoiceEditorElement(footer, {
    id: `${INVOICE_SCOPE_ID}.footer`,
    kind: "footer",
    label: "Aussteller-Fuß",
    parentId: `${INVOICE_SCOPE_ID}.page-template`,
    editable: true,
    operations: ["setVisibility"],
  });
  const issuerAddress = [
    issuer.companyName,
    issuer.companyName2,
    issuer.street,
    [issuer.zip, issuer.city].filter(Boolean).join(" "),
  ].filter(Boolean);
  if (issuerAddress.length) footer.appendChild(element("div", "invoicePdfFooterAddress", issuerAddress.join(" · ")));
  const legal = [
    issuer.vatId ? `USt-IdNr. ${issuer.vatId}` : "",
    issuer.taxNumber ? `Steuernr. ${issuer.taxNumber}` : "",
    issuer.iban ? `IBAN ${issuer.iban}` : "",
    issuer.bic ? `BIC ${issuer.bic}` : "",
  ].filter(Boolean);
  if (legal.length) footer.appendChild(element("div", "invoicePdfFooterBank", legal.join(" · ")));
  return footer;
}
