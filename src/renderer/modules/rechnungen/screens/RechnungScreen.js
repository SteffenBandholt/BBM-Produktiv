import { addCalendarDays, draftPreviewIdentifier, formatDocumentType } from "../../../../shared/rechnung/invoiceHeaderRules.mjs";
import { calculateInvoiceTotalsCents, calculatePositionGrossUnitPriceCents, calculatePositionTotalCents, normalizeInvoicePositions, POSITION_TYPES, PRICE_INPUT_MODES } from "../../../../shared/rechnung/rechnungPositions.mjs";
import { DEFAULT_TEXT_LIMITS, evaluateLongText, evaluateShortText, TextLimitSettingsService } from "../../../core/textregeln/index.js";
import { m80EditorAttributes } from "../../../ui-editor/m80Registry.js";
import { beginM83ComponentBinding, completeM80PilotRender, registerM80Ref } from "../../../ui-editor/m80Refs.js";
import { ensureRechnungenDesignStyles } from "../styles.js";
import { RECHNUNG_COMPONENT_ID, RECHNUNG_SCOPE_ID } from "../RechnungScreen.uiEditorContract.js";

const DECIMAL_DECREASE_ICON_URL = new URL("../assets/icons/decimal-decrease.svg", import.meta.url).href;
const DECIMAL_INCREASE_ICON_URL = new URL("../assets/icons/decimal-increase.svg", import.meta.url).href;
const GERMAN_EURO_AMOUNT_FORMATTER = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const api = () => globalThis.window?.bbmDb || {};
const node = (tag, className = "", content = "") => { const element = document.createElement(tag); if (className) element.className = className; if (content) element.textContent = content; return element; };
const option = (value, label) => Object.assign(document.createElement("option"), { value, textContent: label });

function bind(element, id) {
  for (const [name, value] of Object.entries(m80EditorAttributes(id))) element.setAttribute(name, value);
  registerM80Ref(id, element);
  return element;
}
function button(label, id, handler, variant = "secondary") { const element = bind(node("button", `invoice-button invoice-button--${variant}`, label), id); element.type = "button"; element.onclick = handler; return element; }
function decimalIcon(src) { const element = node("img"); element.src = src; element.style.display = "block"; element.style.pointerEvents = "none"; element.setAttribute("alt", ""); element.setAttribute("aria-hidden", "true"); element.setAttribute("draggable", "false"); return element; }
function control(tag, id, type = "") { const element = bind(node(tag, "invoice-control"), id); if (type) element.type = type; return element; }
function field(labelText, input, className = "") {
  const wrapper = node("label", `invoice-field${className ? ` ${className}` : ""}`);
  const fieldId = String(input?.getAttribute?.("data-ui-inspector-id") || "").trim();
  const labelElement = fieldId
    ? bind(node("span", "invoice-field__label", labelText), `${fieldId}.label`)
    : node("span", "invoice-field__label", labelText);
  wrapper.append(labelElement, input);
  return wrapper;
}
function address(value = {}) { const source = value || {}; return [source.companyName || source.name, source.companyName2 || source.name2, source.street, [source.zip, source.city].filter(Boolean).join(" "), source.country].filter(Boolean).join("\n"); }
export function issuerInformation(value = {}) { const source = value || {}; const vatId = text(source.vatId || source.vat_id); const taxNumber = text(source.taxNumber || source.tax_number); const iban = text(source.iban); const bic = text(source.bic); const nameLines = [text(source.companyName || source.name), text(source.companyName2 || source.name2)].filter(Boolean); const addressLines = [text(source.street), [text(source.zip), text(source.city)].filter(Boolean).join(" ")].filter(Boolean); const register = text(source.commercialRegister || source.commercial_register); const registerNumber = text(source.registerNumber || source.register_number); const managingDirector = text(source.managingDirector || source.managing_director); return Object.freeze({ nameLines, addressLines, taxRow: vatId ? Object.freeze({ label: "USt-IdNr.", value: vatId }) : taxNumber ? Object.freeze({ label: "Steuernr.", value: taxNumber }) : null, bankRows: Object.freeze([...(iban ? [{ label: "IBAN", value: iban }] : []), ...(bic ? [{ label: "BIC", value: bic }] : [])]), footerLines: Object.freeze([[...nameLines, ...addressLines].join(" · "), [vatId && `USt-IdNr. ${vatId}`, taxNumber && `Steuernr. ${taxNumber}`, iban && `IBAN ${iban}`, bic && `BIC ${bic}`].filter(Boolean).join(" · "), [register, registerNumber && `Registernr. ${registerNumber}`, managingDirector && `Geschäftsführer ${managingDirector}`].filter(Boolean).join(" · ")].filter(Boolean)) }); }
function customerKey(value = {}) { return `${value.kind || value.ref?.kind}:${value.id || value.ref?.id}`; }
function money(cents) { return `${(Number(cents || 0) / 100).toFixed(2).replace(".", ",")} EUR`; }
export function formatEuroCents(cents) { return `${GERMAN_EURO_AMOUNT_FORMATTER.format(Number(cents || 0) / 100)} €`; }
function price(cents) { return (Number(cents || 0) / 100).toFixed(2); }
function formatDate(value) { const [year, month, day] = String(value || "").split("-"); return year && month && day ? `${day}.${month}.${year}` : ""; }
function formatMonth(value) { const [year, month] = String(value || "").split("-"); const names = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]; return year && names[Number(month) - 1] ? `${names[Number(month) - 1]} ${year}` : ""; }
function text(value) { return String(value || "").trim(); }
export const QUANTITY_DECIMAL_PLACES = Object.freeze([0, 1, 2, 3, 4]);
export function normalizeQuantityDecimalPlaces(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && QUANTITY_DECIMAL_PLACES.includes(parsed) ? parsed : QUANTITY_DECIMAL_PLACES.at(-1);
}
export function isQuantityInputAllowed(value, decimalPlaces) {
  const places = normalizeQuantityDecimalPlaces(decimalPlaces);
  const input = String(value ?? "");
  if (!input) return true;
  return places === 0 ? /^\d+$/.test(input) : new RegExp(`^\\d+(?:[,.]\\d{0,${places}})?$`).test(input);
}
function isCompleteQuantityInput(value, decimalPlaces) {
  const places = normalizeQuantityDecimalPlaces(decimalPlaces);
  const input = String(value ?? "");
  return places === 0 ? /^\d+$/.test(input) : new RegExp(`^\\d+(?:[,.]\\d{1,${places}})?$`).test(input);
}
export function formatQuantityForInput(value, decimalPlaces) {
  const places = normalizeQuantityDecimalPlaces(decimalPlaces);
  const parsed = Number(String(value ?? "").trim().replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return "0";
  let formatted = parsed.toFixed(places);
  if (formatted.includes(".")) formatted = formatted.replace(/0+$/, "").replace(/\.$/, "");
  return formatted.replace(".", ",");
}
export function selectContentOnFocus(element) { element.addEventListener("focus", () => element.select?.()); }
export { draftPreviewIdentifier };

export default class RechnungScreen {
  constructor({ textLimitSettingsService = null } = {}) { this.invoices = []; this.customers = []; this.projects = []; this.positions = []; this.selectedPositionId = null; this.positionCreateParentId = null; this.positionSequence = 0; this.positionIsTitle = false; this.isPositionMoveMode = false; this.quantityDecimalPlaces = 4; this._lastValidQuantityInput = "1"; this._quantityInputSourceValue = "1"; this.current = null; this.root = null; this.draftSaveChain = Promise.resolve(true); this.textLimitSettingsService = textLimitSettingsService || new TextLimitSettingsService(); this.textLimits = { ...DEFAULT_TEXT_LIMITS }; this._textLimitUnsubscribe = null; }

  render() {
    ensureRechnungenDesignStyles();
    beginM83ComponentBinding(RECHNUNG_COMPONENT_ID);
    const root = bind(node("section", "bbm-invoice-design bbm-popup-standard bbm-rechnung-live"), RECHNUNG_SCOPE_ID);
    root.dataset.invoiceLiveScreen = "step-2";
    const content = bind(node("div", "rechnung-live-content"), "rechnung.screen.content");
    content.append(this._overview(), this._editor(), this._preview());
    root.append(content); this.root = root;
    completeM80PilotRender();
    void this._load();
    return root;
  }

  _overview() {
    const overview = bind(node("section", "rechnung-live-overview"), "rechnung.overview");
    const header = bind(node("header", "invoice-page-header"), "rechnung.overview.header");
    const heading = node("div", "invoice-page-heading");
    heading.append(bind(node("h1", "invoice-page-title", "Rechnungen"), "rechnung.overview.title"), bind(node("p", "invoice-page-subtitle", "Rechnungsgrunddaten und Belegköpfe"), "rechnung.overview.subtitle"));
    header.append(heading, button("Freie Rechnung", "rechnung.overview.new", () => void this._newDraft(), "primary"));
    this.list = bind(node("div", "rechnung-live-list"), "rechnung.overview.list");
    overview.append(header, this.list); this.overview = overview; return overview;
  }

  _editor() {
    return this._sheetEditor();
  }

  _legacyFormEditor() {
    const editor = bind(node("section", "rechnung-live-editor"), "rechnung.editor"); editor.hidden = true;
    const header = bind(node("header", "rechnung-live-editor__header"), "rechnung.editor.header");
    this.title = bind(node("h2", "invoice-page-title", "Rechnung"), "rechnung.editor.title");
    this.status = bind(node("span", "invoice-status invoice-status--draft", "Entwurf"), "rechnung.editor.status");
    this.headToggleButton = button("Kopf", "rechnung.editor.headToggle", () => this._toggleHead(), "secondary");
    this.headToggleButton = button("Kopf", "rechnung.editor.headToggle", () => this._toggleHead(), "secondary");
    header.append(this.title, this.status);
    const body = bind(node("div", "rechnung-live-editor__body"), "rechnung.editor.body");
    const basic = bind(node("section", "invoice-form-section invoice-form-grid"), "rechnung.editor.basic");
    this.source = control("select", "rechnung.editor.source"); this.source.append(option("FREE", "Freie Rechnung"), option("FROM_ORDER", "Rechnung aus Auftrag")); this.source.value = "FREE";
    this.documentType = control("select", "rechnung.editor.documentType"); [["INVOICE", "Rechnung"], ["PARTIAL", "Abschlagsrechnung"], ["FINAL", "Schlussrechnung"], ["HOURLY", "Stundenlohnrechnung"]].forEach(([value, label]) => this.documentType.append(option(value, label)));
    this.installmentNumber = control("input", "rechnung.editor.installmentNumber", "number"); this.installmentNumber.min = "1";
    this.invoiceNumber = control("input", "rechnung.editor.invoiceNumber", "text"); this.invoiceNumber.readOnly = true;
    this.customer = control("select", "rechnung.editor.customer"); this.project = control("select", "rechnung.editor.project");
    this.invoiceDate = control("input", "rechnung.editor.invoiceDate", "date");
    basic.append(field("Herkunft", this.source), field("Belegart", this.documentType), field("Abschlagsnummer", this.installmentNumber), field("Rechnungsnummer", this.invoiceNumber), field("Rechnungskunde", this.customer, "invoice-field--wide"), field("Projekt (optional)", this.project), field("Rechnungsdatum", this.invoiceDate));
    const parties = bind(node("section", "rechnung-live-parties"), "rechnung.editor.parties");
    this.customerAddress = bind(node("div", "rechnung-live-address"), "rechnung.editor.customerAddress");
    const legacyIssuerAddress = node("div", "rechnung-live-address");
    parties.append(this.customerAddress, legacyIssuerAddress);
    const service = bind(node("section", "invoice-form-section rechnung-live-service"), "rechnung.editor.servicePeriod");
    this.serviceType = control("select", "rechnung.editor.servicePeriodType"); [["SINGLE_DATE", "Einzelnes Leistungsdatum"], ["MONTH", "Leistungsmonat"], ["RANGE", "Leistungszeitraum"]].forEach(([value, label]) => this.serviceType.append(option(value, label)));
    this.serviceDate = control("input", "rechnung.editor.serviceDate", "date"); this.serviceMonth = control("input", "rechnung.editor.serviceMonth", "month"); this.serviceStart = control("input", "rechnung.editor.serviceStart", "date"); this.serviceEnd = control("input", "rechnung.editor.serviceEnd", "date");
    this.serviceFields = { SINGLE_DATE: field("Leistungsdatum", this.serviceDate), MONTH: field("Leistungsmonat", this.serviceMonth), RANGE_START: field("Leistungszeitraum von", this.serviceStart), RANGE_END: field("Leistungszeitraum bis", this.serviceEnd) };
    this.servicePeriodToggle = button("Leistungszeitraum festlegen", "rechnung.editor.servicePeriodToggle", () => this._toggleServicePeriodEditor(), "quiet");
    service.append(this.servicePeriodToggle, field("Leistungszeitpunkt", this.serviceType), ...Object.values(this.serviceFields));
    this.reference = control("input", "rechnung.editor.reference", "text"); this.reference.maxLength = 500;
    const referenceField = field("Bauvorhaben / Leistungsbezug", this.reference, "invoice-field--wide rechnung-live-reference");
    this.constructionProject = control("input", "rechnung.editor.constructionProject", "text"); this.constructionProject.maxLength = 200;
    const constructionField = field("Bauvorhaben", this.constructionProject, "invoice-field--wide rechnung-live-reference");
    const positions = bind(node("section", "invoice-form-section rechnung-live-positions"), "rechnung.editor.positions");
    const positionsHead = node("div", "invoice-form-section__head"); positionsHead.append(node("h3", "invoice-form-section__title", "Rechnungspositionen"));
    this.positionsTotal = bind(node("strong", "rechnung-live-positions__total", "0,00 EUR"), "rechnung.editor.positions.total"); positionsHead.append(this.positionsTotal);
    this.positionsList = bind(node("div", "rechnung-live-positions__list"), "rechnung.editor.positions.list");
    const positionEditor = bind(node("div", "rechnung-live-position-editor"), "rechnung.editor.positionEditor");
    this.positionType = control("select", "rechnung.editor.positionType"); [["service", "Leistung"], ["heading", "Ueberschrift"], ["note", "Hinweis"]].forEach(([value, label]) => this.positionType.append(option(value, label)));
    this.positionShort = control("input", "rechnung.editor.positionShort", "text"); this.positionShort.maxLength = this.textLimits.shortText;
    this.positionLong = control("textarea", "rechnung.editor.positionLong"); this.positionLong.maxLength = this.textLimits.longText;
    this.positionQuantity = control("input", "rechnung.editor.positionQuantity", "text"); this.positionQuantity.value = "1";
    this.positionUnit = control("input", "rechnung.editor.positionUnit", "text");
    this.positionPrice = control("input", "rechnung.editor.positionPrice", "number"); this.positionPrice.min = "0"; this.positionPrice.step = "0.01";
    this.positionVatRate = bind(node("span", "rechnung-live-position-editor__vat-rate", "19 %"), "rechnung.editor.positionVatRate");
    this.positionPriceGross = control("input", "rechnung.editor.positionPriceGross", "checkbox");
    this.positionNep = control("input", "rechnung.editor.positionNep", "checkbox");
    const positionActions = node("div", "rechnung-live-position-editor__actions");
    this.positionAddButton = button("Position uebernehmen", "rechnung.editor.positionApply", () => this._applyPosition(), "primary");
    this.positionDeleteButton = button("Loeschen", "rechnung.editor.positionDelete", () => this._deletePosition());
    this.positionUpButton = button("Nach oben", "rechnung.editor.positionUp", () => this._movePosition(-1));
    this.positionDownButton = button("Nach unten", "rechnung.editor.positionDown", () => this._movePosition(1));
    positionActions.append(this.positionDeleteButton, this.positionUpButton, this.positionDownButton, this.positionAddButton);
    positionEditor.append(field("Typ", this.positionType), field("Kurztext", this.positionShort, "invoice-field--wide"), field("Langtext", this.positionLong, "invoice-field--wide"), field("Menge", this.positionQuantity), field("Einheit", this.positionUnit), field("Einzelpreis EUR", this.positionPrice), field("NEP", this.positionNep), positionActions);
    positions.append(positionsHead, this.positionsList, positionEditor);
    const payment = bind(node("section", "invoice-form-section rechnung-live-payment"), "rechnung.editor.payment");
    this.paymentTerm = control("input", "rechnung.editor.paymentTermDays", "number"); this.paymentTerm.min = "0"; this.paymentTerm.max = "3650";
    this.dueDate = control("input", "rechnung.editor.dueDate", "date"); this.dueDate.readOnly = true;
    payment.append(field("Zahlungsziel (Kalendertage)", this.paymentTerm), field("Fällig am", this.dueDate));
    body.append(basic, parties, service, referenceField, constructionField, positions, payment);
    this.message = bind(node("div", "rechnung-live-message"), "rechnung.editor.validation"); this.message.setAttribute("role", "status");
    const footer = bind(node("footer", "rechnung-live-editor__footer"), "rechnung.editor.footer");
    this.deleteButton = button("Entwurf verwerfen", "rechnung.editor.delete", () => void this._delete(), "secondary");
    this.closeButton = button("Schließen", "rechnung.editor.close", () => this._close());
    this.previewButton = button("Proberechnung", "rechnung.editor.preview", () => void this._showPreview());
    this.saveButton = button("Speichern", "rechnung.editor.save", () => void this._save(), "primary");
    this.bookButton = button("Rechnung buchen", "rechnung.editor.book", () => void this._book(), "primary");
    footer.append(this.deleteButton, node("span", "rechnung-live-footer-spacer"), this.closeButton, this.previewButton, this.saveButton, this.bookButton);
    editor.append(header, body, this.message, footer); this.editor = editor;
    [this.documentType, this.customer, this.invoiceDate, this.paymentTerm, this.serviceType].forEach((element) => element.addEventListener("change", () => { this._syncDerived(); this._updatePaymentText(); }));
    return editor;
  }

  _sheetEditor() {
    const editor = bind(node("section", "rechnung-live-editor"), "rechnung.editor"); editor.hidden = true;
    const header = bind(node("header", "rechnung-live-editor__header rechnung-action-rail"), "rechnung.editor.header");
    this.status = bind(node("span", "invoice-status invoice-status--draft", "Entwurf"), "rechnung.editor.status");
    this.headToggleButton = button("Kopf", "rechnung.editor.headToggle", () => this._toggleHead(), "secondary");
    this.deleteButton = button("Entwurf verwerfen", "rechnung.editor.delete", () => void this._delete(), "secondary");
    this.closeButton = button("Schließen", "rechnung.editor.close", () => this._close());
    this.previewButton = button("Proberechnung", "rechnung.editor.preview", () => void this._showPreview());
    this.bookButton = button("Rechnung buchen", "rechnung.editor.book", () => void this._book(), "primary");
    header.append(this.status, this.headToggleButton, node("span", "rechnung-live-footer-spacer"), this.deleteButton, this.closeButton, this.previewButton, this.bookButton);
    const headerCanvas = bind(node("div", "rechnung-screen__header-canvas"), "rechnung.editor.headerCanvas"); headerCanvas.append(header);

    const sheetArea = bind(node("section", "rechnung-screen__sheet-area"), "rechnung.editor.sheetArea");
    const sheetCanvas = bind(node("div", "rechnung-screen__sheet-canvas"), "rechnung.editor.sheetCanvas");
    const body = bind(node("article", "rechnung-live-editor__body rechnung-sheet"), "rechnung.editor.body");
    this.headContent = node("section", "rechnung-sheet__head-content");
    const recipient = node("section", "rechnung-sheet__recipient");
    this.customer = node("select", "invoice-control"); this.customer.hidden = true;
    this.customerPickerButton = button("Rechnungsempfänger wählen", "rechnung.editor.customerPicker", () => { this.customer.hidden = !this.customer.hidden; if (!this.customer.hidden) this.customer.focus(); }, "quiet");
    this.customer.addEventListener("change", () => { this.customer.hidden = true; this._syncDerived(); void this._queueDraftSave(); });
    this.customerAddress = bind(node("div", "rechnung-sheet__address"), "rechnung.editor.customerAddress");
    recipient.append(this.customerPickerButton, this.customer, this.customerAddress);

    const sheetHead = node("header", "rechnung-sheet__head");
    const letterHead = node("section", "rechnung-sheet__letterhead");
    const issuer = bind(node("section", "rechnung-sheet__issuer"), "rechnung.editor.parties");
    this.issuerBlock = bind(node("section", "rechnung-sheet__issuer-address"), "rechnung.editor.issuerBlock");
    const issuerNames = node("div", "rechnung-sheet__issuer-names");
    this.issuerName1 = bind(node("div", "rechnung-sheet__issuer-names__line"), "rechnung.editor.issuerName1");
    this.issuerName2 = bind(node("div", "rechnung-sheet__issuer-names__line"), "rechnung.editor.issuerName2");
    const issuerAddressLines = node("div", "rechnung-sheet__issuer-address-lines");
    this.issuerStreet = bind(node("div", "rechnung-sheet__issuer-address-lines__line"), "rechnung.editor.issuerStreet");
    this.issuerCity = bind(node("div", "rechnung-sheet__issuer-address-lines__line"), "rechnung.editor.issuerCity");
    issuerNames.append(this.issuerName1, this.issuerName2); issuerAddressLines.append(this.issuerStreet, this.issuerCity); this.issuerBlock.append(issuerNames, issuerAddressLines);
    this.invoiceMetaBlock = bind(node("section", "rechnung-sheet__issuer-meta"), "rechnung.editor.invoiceMetaBlock");
    const metaRow = (id, label) => {
      const row = bind(node("div", "rechnung-sheet__issuer-meta__row"), id);
      const labelElement = bind(node("span", "rechnung-sheet__issuer-meta-label", label), `${id}.label`);
      const value = node("span", "rechnung-sheet__issuer-meta-value");
      row.append(labelElement, node("span", "rechnung-sheet__issuer-meta-colon", ":"), value);
      return { row, value };
    };
    const invoiceDateDisplay = metaRow("rechnung.editor.invoiceDateDisplay", "Rechnungsdatum"); const servicePeriodDisplay = metaRow("rechnung.editor.servicePeriodDisplay", "Leistungszeitraum");
    this.invoiceDateDisplay = invoiceDateDisplay.row; this.invoiceDateDisplayValue = invoiceDateDisplay.value; this.servicePeriodDisplay = servicePeriodDisplay.row; this.servicePeriodDisplayValue = servicePeriodDisplay.value;
    this.invoiceMetaBlock.append(this.invoiceDateDisplay, this.servicePeriodDisplay);
    issuer.append(this.issuerBlock, this.invoiceMetaBlock);
    const facts = bind(node("section", "rechnung-sheet__facts"), "rechnung.editor.basic");
    this.documentType = control("select", "rechnung.editor.documentType"); [["INVOICE", "Rechnung"], ["PARTIAL", "Abschlagsrechnung"], ["FINAL", "Schlussrechnung"], ["HOURLY", "Stundenlohnrechnung"]].forEach(([value, label]) => this.documentType.append(option(value, label)));
    this.installmentNumber = control("input", "rechnung.editor.installmentNumber", "number"); this.installmentNumber.min = "1";
    this.invoiceDate = control("input", "rechnung.editor.invoiceDate", "date");
    facts.append(field("Belegart", this.documentType, "rechnung-sheet__document-type"), field("Abschlagsnummer", this.installmentNumber, "rechnung-sheet__installment-number"), field("Rechnungsdatum", this.invoiceDate)); facts.hidden = true;
    const service = bind(node("section", "rechnung-sheet__service"), "rechnung.editor.servicePeriod"); this.servicePeriodContainer = service;
    this.serviceType = control("select", "rechnung.editor.servicePeriodType"); [["SINGLE_DATE", "Leistungsdatum"], ["MONTH", "Leistungsmonat"], ["RANGE", "Leistungszeitraum"]].forEach(([value, label]) => this.serviceType.append(option(value, label)));
    this.serviceDate = control("input", "rechnung.editor.serviceDate", "date"); this.serviceMonth = control("input", "rechnung.editor.serviceMonth", "month"); this.serviceStart = control("input", "rechnung.editor.serviceStart", "date"); this.serviceEnd = control("input", "rechnung.editor.serviceEnd", "date");
    this.serviceFields = { SINGLE_DATE: field("Leistungsdatum", this.serviceDate), MONTH: field("Leistungsmonat", this.serviceMonth), RANGE_START: field("Zeitraum von", this.serviceStart), RANGE_END: field("Zeitraum bis", this.serviceEnd) };
    this.servicePeriodToggle = button("Leistungszeitraum festlegen", "rechnung.editor.servicePeriodToggle", () => this._toggleServicePeriodEditor(), "quiet");
    service.append(this.servicePeriodToggle, field("Leistungszeitpunkt", this.serviceType), ...Object.values(this.serviceFields)); service.hidden = true;
    const issuerColumn = node("section", "rechnung-sheet__issuer-column"); issuerColumn.append(issuer, facts, service);
    letterHead.append(recipient, issuerColumn);
    const titleBlock = node("section", "rechnung-sheet__title-block");
    this.title = bind(node("h1", "rechnung-sheet__title", "Rechnung"), "rechnung.editor.title");
    this.invoiceNumber = control("input", "rechnung.editor.invoiceNumber", "text"); this.invoiceNumber.readOnly = true;
    titleBlock.append(this.title, field("Rechnungsnummer", this.invoiceNumber, "rechnung-sheet__number"));
    sheetHead.append(letterHead, titleBlock);

    const details = node("section", "rechnung-sheet__details");
    const context = node("div", "rechnung-sheet__context");
    this.reference = control("input", "rechnung.editor.reference", "text"); this.reference.maxLength = 500;
    this.constructionProject = control("input", "rechnung.editor.constructionProject", "text"); this.constructionProject.maxLength = 200;
    this.project = control("select", "rechnung.editor.project");
    this.source = control("select", "rechnung.editor.source"); this.source.append(option("FREE", "Freie Rechnung"), option("FROM_ORDER", "Rechnung aus Auftrag")); this.source.value = "FREE";
    context.append(field("Bauvorhaben / Leistungsbezug", this.reference, "invoice-field--wide"), field("Bauvorhaben", this.constructionProject), field("Projektbezug", this.project), field("Herkunft", this.source));
    this.introText = control("textarea", "rechnung.editor.introText"); this.introText.maxLength = 4000; this.introText.placeholder = "Optionaler Einleitungstext";
    details.append(context, field("Freitext", this.introText, "invoice-field--wide rechnung-sheet__intro"));
    this.headContent.append(sheetHead, details);

    const positions = bind(node("section", "rechnung-live-positions rechnung-sheet__positions"), "rechnung.editor.positions");
    this.positionsList = bind(node("div", "rechnung-live-positions__list rechnung-lv-list"), "rechnung.editor.positions.list");
    const positionEditor = bind(node("section", "rechnung-live-position-editor rechnung-sheet__position-editor"), "rechnung.editor.positionEditor");
    this.positionType = control("select", "rechnung.editor.positionType"); [["service", "Leistung"], ["heading", "Überschrift"], ["note", "Hinweis"]].forEach(([value, label]) => this.positionType.append(option(value, label)));
    this.positionShort = control("input", "rechnung.editor.positionShort", "text"); this.positionShort.maxLength = 200;
    this.positionLong = control("textarea", "rechnung.editor.positionLong"); this.positionLong.maxLength = 2000;
    this.positionQuantity = control("input", "rechnung.editor.positionQuantity", "text"); this.positionQuantity.value = "1"; this.positionQuantity.inputMode = "decimal"; this.positionQuantity.className += " rechnung-live-position-editor__quantity";
    this.positionUnit = control("input", "rechnung.editor.positionUnit", "text");
    this.positionPrice = control("input", "rechnung.editor.positionPrice", "number"); this.positionPrice.min = "0"; this.positionPrice.step = "0.01";
    this.positionVatRate = bind(node("span", "rechnung-live-position-editor__vat-rate", "19 %"), "rechnung.editor.positionVatRate");
    this.positionPriceGross = control("input", "rechnung.editor.positionPriceGross", "checkbox");
    this.positionNep = control("input", "rechnung.editor.positionNep", "checkbox");
    this.positionType.replaceChildren(option("service", "Leistungspos."), option("heading", "Text"), option("note", "Hinweis"));
    const positionActions = bind(node("div", "rechnung-live-position-editor__actions"), "rechnung.editor.positionActions");
    this.positionCreateTitleButton = button("+Titel", "rechnung.editor.positionCreateTitle", () => this._createTitle());
    this.positionCreateButton = button("+Position", "rechnung.editor.positionCreate", () => this._createPosition());
    this.positionMoveButton = button("Schieben", "rechnung.editor.positionMove", () => this._togglePositionMove());
    this.positionDeleteButton = button("Löschen", "rechnung.editor.positionDelete", () => this._deletePosition());
    this.positionMoveRootButton = bind(
      node("button", "invoice-button invoice-button--secondary rechnung-live-position-editor__move-root", "Auf Ebene 0 verschieben"),
      "rechnung.editor.positionMoveRoot"
    );
    this.positionMoveRootButton.type = "button";
    this.positionMoveRootButton.onclick = () => this._moveSelectedPositionToRoot();
    this.positionMoveRootButton.hidden = true;
    positionActions.append(this.positionCreateTitleButton, this.positionCreateButton, node("span", "rechnung-live-position-editor__action-spacer"), this.positionMoveButton, this.positionDeleteButton, this.positionMoveRootButton);
    this.positionTypeField = field("Typ", this.positionType); this.positionQuantityField = field("Menge", this.positionQuantity); this.positionUnitField = field("Einheit", this.positionUnit); this.positionPriceField = field("Einzelpreis netto", this.positionPrice); this.positionPriceLabel = this.positionPriceField.firstElementChild || this.positionPriceField.children?.[0]; this.positionVatRateField = field("", this.positionVatRate, "rechnung-live-position-editor__vat-field"); this.positionVatRateLabel = this.positionVatRateField.firstElementChild || this.positionVatRateField.children?.[0]; this.positionVatRateLabel.hidden = true; this.positionVatRateLabel.style.display = "none"; this.positionPriceGrossField = field("Brutto", this.positionPriceGross, "rechnung-live-position-editor__gross-field"); this.positionNepField = field("NEP", this.positionNep, "rechnung-live-position-editor__nep-field");
    this.positionQuantityBlock = bind(node("div", "rechnung-live-position-editor__quantity-block"), "rechnung.editor.positionQuantityBlock");
    this.positionQuantityDecimals = bind(node("div", "rechnung-live-position-editor__decimal-stepper"), "rechnung.editor.positionQuantityDecimals");
    const quantityDecimalsLabel = bind(node("span", "rechnung-live-position-editor__decimal-label", "Nachkommastellen"), "rechnung.editor.positionQuantityDecimals.label");
    this.positionQuantityDecimalsDecrease = button("", "rechnung.editor.positionQuantityDecimals.decrease", () => this._setQuantityDecimalPlaces(this.quantityDecimalPlaces - 1));
    this.positionQuantityDecimalsDecrease.setAttribute("aria-label", "Nachkommastellen verringern");
    this.positionQuantityDecimalsDecrease.setAttribute("title", "Nachkommastellen verringern");
    this.positionQuantityDecimalsDecrease.append(decimalIcon(DECIMAL_DECREASE_ICON_URL));
    this.positionQuantityDecimalsValue = bind(node("output", "rechnung-live-position-editor__decimal-value", String(this.quantityDecimalPlaces)), "rechnung.editor.positionQuantityDecimals.value");
    this.positionQuantityDecimalsValue.setAttribute("aria-live", "polite");
    this.positionQuantityDecimalsIncrease = button("", "rechnung.editor.positionQuantityDecimals.increase", () => this._setQuantityDecimalPlaces(this.quantityDecimalPlaces + 1));
    this.positionQuantityDecimalsIncrease.setAttribute("aria-label", "Nachkommastellen erhöhen");
    this.positionQuantityDecimalsIncrease.setAttribute("title", "Nachkommastellen erhöhen");
    this.positionQuantityDecimalsIncrease.append(decimalIcon(DECIMAL_INCREASE_ICON_URL));
    this.positionQuantityDecimals.append(quantityDecimalsLabel, this.positionQuantityDecimalsDecrease, this.positionQuantityDecimalsValue, this.positionQuantityDecimalsIncrease);
    this.positionQuantityBlock.append(this.positionQuantityDecimals, this.positionQuantityField);
    this.positionShortRemaining = bind(node("span", "rechnung-live-position-editor__remaining"), "rechnung.editor.positionShortRemaining"); this.positionLongRemaining = bind(node("span", "rechnung-live-position-editor__remaining"), "rechnung.editor.positionLongRemaining");
    const positionShortField = field("Kurztext", this.positionShort, "invoice-field--wide"); const positionLongField = field("Langtext", this.positionLong, "invoice-field--wide");
    (positionShortField.firstElementChild || positionShortField.children?.[0])?.append(this.positionShortRemaining); (positionLongField.firstElementChild || positionLongField.children?.[0])?.append(this.positionLongRemaining);
    this._updatePositionTextCounters();
    const positionEditorTitle = bind(
      node("h3", "rechnung-sheet__position-title", "Position bearbeiten"),
      "rechnung.editor.positionEditor.title.label"
    );
    const editboxTotals = bind(node("aside", "rechnung-live-position-editor__totals"), "rechnung.editor.editboxTotals");
    const editboxTotalsTitle = bind(node("h4", "rechnung-live-position-editor__totals-title", "Gesamtbetrag"), "rechnung.editor.editboxTotals.title");
    const editboxNetLabel = bind(node("span", "rechnung-live-position-editor__totals-label", "Netto"), "rechnung.editor.editboxTotals.netLabel");
    this.editboxNetTotal = bind(node("strong", "rechnung-live-position-editor__totals-value", "0,00 €"), "rechnung.editor.editboxTotals.netValue");
    this.editboxVatLabel = bind(node("span", "rechnung-live-position-editor__totals-label", "19 % MwSt."), "rechnung.editor.editboxTotals.vatLabel");
    this.editboxVatTotal = bind(node("strong", "rechnung-live-position-editor__totals-value", "0,00 €"), "rechnung.editor.editboxTotals.vatValue");
    const editboxGrossLabel = bind(node("span", "rechnung-live-position-editor__totals-label rechnung-live-position-editor__totals-label--gross", "Brutto"), "rechnung.editor.editboxTotals.grossLabel");
    this.editboxGrossTotal = bind(node("strong", "rechnung-live-position-editor__totals-value rechnung-live-position-editor__totals-value--gross", "0,00 €"), "rechnung.editor.editboxTotals.grossValue");
    editboxTotals.append(editboxTotalsTitle, editboxNetLabel, this.editboxNetTotal, this.editboxVatLabel, this.editboxVatTotal, editboxGrossLabel, this.editboxGrossTotal);
    positionEditor.append(positionEditorTitle, positionActions, this.positionTypeField, positionShortField, positionLongField, this.positionQuantityBlock, this.positionUnitField, this.positionPriceField, this.positionVatRateField, this.positionPriceGrossField, this.positionNepField, editboxTotals);
    this._syncQuantityDecimalStepperState();
    positions.append(this.positionsList);

    const payment = bind(node("section", "rechnung-sheet__payment"), "rechnung.editor.payment");
    this.paymentTerm = control("input", "rechnung.editor.paymentTermDays", "number"); this.paymentTerm.min = "0"; this.paymentTerm.max = "3650";
    this.dueDate = control("input", "rechnung.editor.dueDate", "date"); this.dueDate.readOnly = true;
    const totals = node("div", "rechnung-sheet__totals");
    this.positionsTotal = bind(node("strong", "rechnung-sheet__amount", "0,00 EUR"), "rechnung.editor.positions.total");
    this.invoiceVat = bind(
      node("strong", "rechnung-sheet__amount", "0,00 EUR"),
      "rechnung.editor.invoiceVat"
    );
    this.invoiceTotal = bind(
      node("strong", "rechnung-sheet__grand-amount", "0,00 EUR"),
      "rechnung.editor.invoiceTotal"
    );
    this.invoiceVatLabel = bind(
      node("span", "rechnung-sheet__total-label", "19 % MwSt."),
      "rechnung.editor.invoiceVat.label"
    );
    const netTotalLabel = bind(
      node("span", "rechnung-sheet__total-label", "Summe Netto"),
      "rechnung.editor.positions.total.label"
    );
    const grossTotalLabel = bind(
      node("strong", "rechnung-sheet__grand-label", "Summe Brutto"),
      "rechnung.editor.invoiceTotal.label"
    );
    totals.append(netTotalLabel, this.positionsTotal, this.invoiceVatLabel, this.invoiceVat, grossTotalLabel, this.invoiceTotal);
    this.paymentText = bind(
      node("p", "rechnung-sheet__payment-text"),
      "rechnung.editor.paymentText"
    );
    payment.append(totals, field("Zahlungsziel in Tagen", this.paymentTerm), field("Fällig am", this.dueDate), this.paymentText);
    this.issuerFooter = bind(node("footer", "rechnung-sheet__issuer-footer"), "rechnung.editor.issuerFooter");
    body.append(this.headContent, positions, payment, this.issuerFooter);
    this.message = bind(node("div", "rechnung-live-message"), "rechnung.editor.validation"); this.message.setAttribute("role", "status");
    const footer = bind(node("footer", "rechnung-live-editor__footer rechnung-action-rail"), "rechnung.editor.footer");
    footer.append(bind(
      node("span", "rechnung-sheet__application-note", "Anwendungsaktionen – nicht Teil der Rechnung"),
      "rechnung.editor.footer.label"
    ));
    sheetCanvas.append(body); sheetArea.append(sheetCanvas);
    const editArea = bind(node("section", "rechnung-screen__edit-area"), "rechnung.editor.editArea");
    const editCanvas = bind(node("div", "rechnung-screen__edit-canvas"), "rechnung.editor.editCanvas"); editCanvas.append(positionEditor); editArea.append(editCanvas);
    editor.append(headerCanvas, sheetArea, editArea, this.message, footer); this.editor = editor;
    const syncAndSave = () => { this._syncDerived(); this._updatePaymentText(); this._syncPositionActions(); void this._queueDraftSave(); };
    [this.source, this.documentType, this.installmentNumber, this.invoiceDate, this.serviceType, this.serviceDate, this.serviceMonth, this.serviceStart, this.serviceEnd, this.reference, this.constructionProject, this.project, this.introText, this.paymentTerm].forEach((element) => {
      element.addEventListener("change", syncAndSave);
      element.addEventListener("input", syncAndSave);
    });
    [this.positionType, this.positionNep].forEach((element) => element.addEventListener("change", () => this._syncSelectedPositionFromEditor()));
    this.positionPriceGross.addEventListener("change", () => this._togglePositionPriceInputMode());
    [this.positionShort, this.positionLong].forEach((element) => element.addEventListener("input", () => { this._updatePositionTextCounters(); this._syncSelectedPositionFromEditor(); }));
    this.positionQuantity.addEventListener("input", () => this._handlePositionQuantityInput());
    this.positionQuantity.addEventListener("blur", () => this._commitPositionQuantityInput());
    [this.positionUnit, this.positionPrice].forEach((element) => element.addEventListener("input", () => this._syncSelectedPositionFromEditor()));
    [this.positionShort, this.positionLong, this.positionQuantity, this.positionUnit, this.positionPrice].forEach(selectContentOnFocus);
    return editor;
  }

  _preview() {
    const preview = bind(node("section", "rechnung-live-preview"), "rechnung.preview"); preview.hidden = true;
    const card = node("div", "rechnung-live-preview__card");
    const title = bind(node("h2", "invoice-page-title", "Proberechnung / Entwurf"), "rechnung.preview.title");
    this.previewBody = bind(node("div", "rechnung-live-preview__body"), "rechnung.preview.body");
    card.append(title, this.previewBody, button("Vorschau schließen", "rechnung.preview.close", () => { preview.hidden = true; }, "secondary"));
    preview.append(card); this.preview = preview; return preview;
  }

  async _load() {
    const [invoices, customers, projects, profile] = await Promise.all([api().rechnungList?.(), api().rechnungListCustomers?.(), api().rechnungListProjects?.(), api().userProfileGet?.()]);
    this.invoices = invoices?.ok ? invoices.list || [] : [];
    this.customers = customers?.ok ? customers.list || [] : [];
    this.projects = projects?.ok ? projects.list || [] : [];
    this.profile = profile?.ok ? profile.profile || profile.data || null : null;
    await this._loadTextLimits(); this._bindTextLimitSettings();
    this._renderList();
  }

  _renderList() {
    this.list.replaceChildren();
    if (!this.invoices.length) { this.list.append(node("div", "invoice-empty", "Noch keine Rechnungen oder Entwürfe vorhanden.")); return; }
    const draftCounts = new Map();
    this.invoices.filter((invoice) => invoice.status === "DRAFT").forEach((invoice) => {
      const key = this._draftIdentity(invoice);
      draftCounts.set(key, (draftCounts.get(key) || 0) + 1);
    });
    for (const invoice of this.invoices) {
      const card = node("article", "rechnung-live-card");
      const badge = node("span", `invoice-status invoice-status--${invoice.status === "BOOKED" ? "paid" : "draft"}`, invoice.status === "BOOKED" ? "Erstellt / Gebucht" : "Entwurf");
      const body = node("div", "rechnung-live-card__body");
      if (invoice.status === "BOOKED") {
        body.append(
          node("strong", "rechnung-live-card__title", invoice.invoice_number || "Rechnungs-Nr.: wird bei Buchung vergeben"),
          node("span", "invoice-cell-muted", [invoice.service_reference || "Ohne Leistungsbezug", invoice.invoice_date, invoice.due_date].filter(Boolean).join(" · "))
        );
      } else {
        const customer = this._draftCustomerLabel(invoice);
        const context = this._draftContext(invoice);
        const date = formatDate(invoice.invoice_date);
        const detail = customer || context ? [context, date].filter(Boolean).join(" · ") : "";
        body.append(node("strong", "rechnung-live-card__title", customer || context ? "Entwurf" : date ? `Entwurf vom ${date}` : "Entwurf"));
        if (customer) body.append(node("span", "invoice-customer", customer));
        if (detail) body.append(node("span", "invoice-cell-muted", detail));
        const firstPosition = this._firstPositionShortText(invoice);
        if (draftCounts.get(this._draftIdentity(invoice)) > 1 && firstPosition) body.append(node("span", "invoice-cell-muted", `1. Pos.: ${firstPosition}`));
      }
      const open = node("button", "invoice-button invoice-button--quiet", "Öffnen"); open.type = "button"; open.onclick = () => this._open(invoice);
      card.append(badge, body, open); this.list.append(card);
    }
  }

  _draftCustomerLabel(invoice) {
    const snapshot = invoice.customer_snapshot || {};
    const customer = this.customers.find((entry) => customerKey(entry) === `${invoice.customer_ref_kind || ""}:${invoice.customer_firm_id || ""}`);
    return text(snapshot.companyName || snapshot.name || customer?.label || customer?.name || invoice.legacy_customer?.name);
  }

  _draftContext(invoice) {
    return [...new Set([text(invoice.construction_project), text(invoice.service_reference)].filter(Boolean))].join(" · ");
  }

  _draftIdentity(invoice) {
    return [this._draftCustomerLabel(invoice), this._draftContext(invoice), text(invoice.invoice_date)].join("\u0001");
  }

  _firstPositionShortText(invoice) {
    return (invoice.positions || []).map((entry) => text(entry?.short_text)).find(Boolean) || "";
  }

  async _newDraft() {
    const defaults = await api().rechnungDefaults?.();
    const result = await api().rechnungCreateDraft?.({ ...(defaults?.data || {}), service_date: (defaults?.data || {}).invoice_date });
    if (!result?.ok) return this._overviewMessage(result?.error);
    this.invoices.unshift(result.data); this._renderList(); this._open(result.data);
  }

  _open(invoice) {
    this.current = invoice; this.overview.hidden = true; this.editor.hidden = false; this.message.textContent = "";
    this.source.value = invoice.source_type || "FREE"; this.documentType.value = invoice.document_type || "INVOICE"; this.installmentNumber.value = invoice.installment_number || "";
    this.invoiceNumber.value = invoice.invoice_number || "wird bei Buchung vergeben"; this.invoiceDate.value = invoice.invoice_date || "";
    this.serviceType.value = invoice.service_period_type || "SINGLE_DATE"; this.serviceDate.value = invoice.service_date || ""; this.serviceMonth.value = invoice.service_period_start?.slice(0, 7) || ""; this.serviceStart.value = invoice.service_period_start || ""; this.serviceEnd.value = invoice.service_period_end || "";
    this.reference.value = invoice.service_reference || ""; this.constructionProject.value = invoice.construction_project || ""; if (this.introText) this.introText.value = invoice.intro_text || ""; this.positions = (invoice.positions || []).map((entry) => ({ ...entry })); this._normalizePositions(); this.selectedPositionId = null; this._setPositionCreateParentId(null); this.isPositionMoveMode = false; this._renderPositions(); this._clearPositionEditor(); this.paymentTerm.value = String(invoice.payment_term_days ?? 8); this.dueDate.value = invoice.due_date || "";
    this.customer.replaceChildren(option("", "Rechnungskunde wählen")); this.customers.forEach((entry) => this.customer.append(option(customerKey(entry), entry.label || entry.name)));
    const selectedCustomerKey = `${invoice.customer_ref_kind || ""}:${invoice.customer_firm_id || ""}`;
    if (invoice.status === "BOOKED" && invoice.customer_snapshot && ![...this.customer.options].some((entry) => entry.value === selectedCustomerKey)) this.customer.append(option(selectedCustomerKey, invoice.customer_snapshot.companyName || "Gebuchter Kunde"));
    if (invoice.status === "DRAFT" && invoice.customer_ref_kind === "project_firm" && ![...this.customer.options].some((entry) => entry.value === selectedCustomerKey)) this.customer.append(option(selectedCustomerKey, `${invoice.legacy_customer?.name || "Unaufgelöster Kunde"} · Altverweis`));
    this.customer.value = selectedCustomerKey === ":" ? "" : selectedCustomerKey;
    this.project.replaceChildren(option("", "Kein Projekt")); this.projects.forEach((entry) => this.project.append(option(entry.id, entry.name))); this.project.value = invoice.project_id || "";
    this._isServicePeriodEditing = false; this.servicePeriodContainer?.classList.toggle("is-editing", false);
    if (this.headContent) { this.headContent.hidden = false; this._syncHeadToggle(); } this._syncDerived(); this._setBooked(invoice.status === "BOOKED");
  }

  _payload() {
    const customer = this.customers.find((entry) => customerKey(entry) === this.customer.value);
    const [fallbackKind, fallbackId] = this.customer.value.split(":");
    const preservesLegacyRef = fallbackKind === "project_firm" && this.current?.customer_ref_kind === "project_firm" && fallbackId === this.current?.customer_firm_id;
    return { source_type: this.source.value, document_type: this.documentType.value, installment_number: this.installmentNumber.value, invoice_date: this.invoiceDate.value, service_period_type: this.serviceType.value, service_date: this.serviceDate.value, service_month: this.serviceMonth.value, service_period_start: this.serviceStart.value, service_period_end: this.serviceEnd.value, customer_ref_kind: customer?.kind || customer?.ref?.kind || fallbackKind || null, customer_firm_id: customer?.id || customer?.ref?.id || fallbackId || null, customer_project_id: customer?.project_id || customer?.ref?.projectId || (preservesLegacyRef ? this.current.customer_project_id : null), project_id: this.project.value || null, service_reference: this.reference.value, construction_project: this.constructionProject.value, intro_text: this.introText.value, positions: this.positions, payment_term_days: this.paymentTerm.value };
  }

  _toggleHead() { if (!this.headContent) return; this.headContent.hidden = !this.headContent.hidden; this._syncHeadToggle(); }
  _syncHeadToggle() { if (!this.headContent || !this.headToggleButton) return; this.headToggleButton.textContent = this.headContent.hidden ? "Kopf einblenden" : "Kopf ausblenden"; this.headToggleButton.setAttribute("aria-pressed", String(!this.headContent.hidden)); }

  _nextPositionId() { return `invoice-position-${Date.now()}-${++this.positionSequence}`; }
  _normalizePositions() { this.positions = [...normalizeInvoicePositions(this.positions, { idFactory: () => this._nextPositionId() })]; }
  _setPositionCreateParentId(positionId) { this.positionCreateParentId = positionId || null; }
  _getSelectedPosition() { return this.positions.find((entry) => entry.id === this.selectedPositionId) || null; }
  _isFreeDraft() { return this.current?.status === "DRAFT" && this.source?.value === "FREE"; }
  _resolvePositionCreateParent() {
    const context = this.positions.find((entry) => entry.id === this.positionCreateParentId) || null;
    if (!context) return { parentId: null };
    if (context.is_title && !context.parent_id) return { parentId: context.id };
    if (context.parent_id) return { blocked: true };
    return { parentId: null };
  }
  _orderedPositions() {
    const children = new Map();
    for (const entry of this.positions) { const parentId = entry.parent_id || null; if (!children.has(parentId)) children.set(parentId, []); children.get(parentId).push(entry); }
    const ordered = [];
    const visit = (entry) => { ordered.push(entry); for (const child of children.get(entry.id) || []) visit(child); };
    for (const root of children.get(null) || []) visit(root);
    return ordered;
  }
  _positionDepth(entry) { let depth = 0; let current = entry; const seen = new Set(); while (current?.parent_id && !seen.has(current.parent_id)) { seen.add(current.parent_id); current = this.positions.find((item) => item.id === current.parent_id) || null; depth += 1; } return depth; }
  _clearPositionEditor() { this.selectedPositionId = null; this.positionIsTitle = false; this.positionType.value = POSITION_TYPES.SERVICE; this.positionShort.value = ""; this.positionLong.value = ""; this._quantityInputSourceValue = "1"; this.positionQuantity.value = formatQuantityForInput(this._quantityInputSourceValue, this.quantityDecimalPlaces); this._lastValidQuantityInput = this.positionQuantity.value; this.positionUnit.value = ""; this.positionPrice.value = ""; this.positionVatRate.textContent = "19 %"; this.positionPriceGross.checked = false; this.positionNep.checked = false; this._updatePositionTextCounters(); this._syncPositionEditorFields(); this._syncPositionActions(); this._syncQuantityDecimalStepperState(); }
  _selectPosition(entry, { setCreateContext = true } = {}) { this.selectedPositionId = entry.id; this.positionIsTitle = Boolean(entry.is_title); this.positionType.value = entry.type; this.positionShort.value = entry.short_text || ""; this.positionLong.value = entry.long_text || ""; this._quantityInputSourceValue = String(entry.quantity ?? "1"); this.positionQuantity.value = formatQuantityForInput(this._quantityInputSourceValue, this.quantityDecimalPlaces); this._lastValidQuantityInput = this.positionQuantity.value; this.positionUnit.value = entry.unit || ""; this.positionPriceGross.checked = entry.price_input_mode === PRICE_INPUT_MODES.GROSS; this.positionPrice.value = entry.unit_price_cents == null ? "" : price(this.positionPriceGross.checked ? calculatePositionGrossUnitPriceCents(entry) : entry.unit_price_cents); this.positionVatRate.textContent = `${entry.vat_rate_percent == null ? 19 : entry.vat_rate_percent} %`; this.positionNep.checked = Boolean(entry.is_nep); if (setCreateContext) this._setPositionCreateParentId(entry.id); this._updatePositionTextCounters(); this._syncPositionEditorFields(); this._syncPositionActions(); this._syncQuantityDecimalStepperState(); }
  _updatePositionTextCounters() { const shortEvaluation = evaluateShortText(this.positionShort?.value, { limit: this.textLimits.shortText }); const longEvaluation = evaluateLongText(this.positionLong?.value, { limit: this.textLimits.longText }); if (this.positionShortRemaining) { this.positionShortRemaining.textContent = String(shortEvaluation.remaining); this.positionShortRemaining.dataset.level = shortEvaluation.level; } if (this.positionLongRemaining) { this.positionLongRemaining.textContent = String(longEvaluation.remaining); this.positionLongRemaining.dataset.level = longEvaluation.level; } }
  _applyTextLimits(limits = {}) { this.textLimits = { shortText: Number(limits.shortText) || DEFAULT_TEXT_LIMITS.shortText, longText: Number(limits.longText) || DEFAULT_TEXT_LIMITS.longText }; if (this.positionShort) this.positionShort.maxLength = this.textLimits.shortText; if (this.positionLong) this.positionLong.maxLength = this.textLimits.longText; this._updatePositionTextCounters(); }
  async _loadTextLimits() { const limits = await this.textLimitSettingsService.load(); this._applyTextLimits(limits); return limits; }
  _bindTextLimitSettings() { if (this._textLimitUnsubscribe) return; this._textLimitUnsubscribe = this.textLimitSettingsService.subscribe((limits) => this._applyTextLimits(limits)); }
  _setQuantityDecimalPlaces(value) { const numeric = Number(value); const next = Number.isInteger(numeric) ? Math.max(0, Math.min(4, numeric)) : this.quantityDecimalPlaces; if (next === this.quantityDecimalPlaces) { this._syncQuantityDecimalStepperState(); return; } this.quantityDecimalPlaces = next; if (this.positionQuantity) { this.positionQuantity.value = formatQuantityForInput(this._quantityInputSourceValue ?? this.positionQuantity.value, next); this._lastValidQuantityInput = this.positionQuantity.value; } this._syncQuantityDecimalStepperState(); this._syncSelectedPositionFromEditor(); }
  _syncQuantityDecimalStepperState() { const places = normalizeQuantityDecimalPlaces(this.quantityDecimalPlaces); this.quantityDecimalPlaces = places; if (this.positionQuantityDecimalsValue) this.positionQuantityDecimalsValue.textContent = String(places); if (this.positionQuantity) { this.positionQuantity.inputMode = "decimal"; this.positionQuantity.setAttribute?.("aria-label", `Menge mit bis zu ${places} Nachkommastellen`); this.positionQuantity.setAttribute?.("pattern", places === 0 ? "[0-9]+" : `[0-9]+([,.][0-9]{0,${places}})?`); } const booked = this.current?.status === "BOOKED"; if (this.positionQuantityDecimalsDecrease) this.positionQuantityDecimalsDecrease.disabled = booked || places === 0; if (this.positionQuantityDecimalsIncrease) this.positionQuantityDecimalsIncrease.disabled = booked || places === 4; }
  _handlePositionQuantityInput() { const value = this.positionQuantity?.value ?? ""; if (!isQuantityInputAllowed(value, this.quantityDecimalPlaces)) { this.positionQuantity.value = this._lastValidQuantityInput; return; } this._lastValidQuantityInput = value; if (isCompleteQuantityInput(value, this.quantityDecimalPlaces)) { this._quantityInputSourceValue = value; this._syncSelectedPositionFromEditor(); } }
  _commitPositionQuantityInput() { if (!this.positionQuantity) return; this.positionQuantity.value = formatQuantityForInput(this.positionQuantity.value || "0", this.quantityDecimalPlaces); this._lastValidQuantityInput = this.positionQuantity.value; this._quantityInputSourceValue = this.positionQuantity.value; this._syncSelectedPositionFromEditor(); }
  _syncPositionEditorFields() { const isTitle = this.positionIsTitle; const isService = !isTitle && this.positionType.value === POSITION_TYPES.SERVICE; if (this.positionType) this.positionType.disabled = isTitle; [this.positionTypeField, this.positionQuantityBlock || this.positionQuantityField, this.positionUnitField].filter(Boolean).forEach((fieldNode) => { fieldNode.hidden = isTitle; }); [this.positionPriceField, this.positionVatRateField, this.positionPriceGrossField, this.positionNepField].filter(Boolean).forEach((fieldNode) => { fieldNode.hidden = !isService; }); if (this.positionPriceLabel) this.positionPriceLabel.textContent = `Einzelpreis ${this.positionPriceGross.checked ? "brutto" : "netto"}`; }
  _togglePositionPriceInputMode() { const existing = this._getSelectedPosition(); if (!existing || existing.type !== POSITION_TYPES.SERVICE || !this._isFreeDraft()) return; this.positionPrice.value = price(this.positionPriceGross.checked ? calculatePositionGrossUnitPriceCents(existing) : existing.unit_price_cents); this._syncSelectedPositionFromEditor(); }
  _syncPositionActions() { const isFreeDraft = this._isFreeDraft(); const selected = this._getSelectedPosition(); if (this.positionCreateTitleButton) this.positionCreateTitleButton.disabled = !isFreeDraft; if (this.positionCreateButton) this.positionCreateButton.disabled = !isFreeDraft; if (this.positionMoveButton) { this.positionMoveButton.disabled = !isFreeDraft || !selected || Boolean(selected.is_title); this.positionMoveButton.textContent = this.isPositionMoveMode ? "Schieben beenden" : "Schieben"; } if (this.positionMoveRootButton) this.positionMoveRootButton.hidden = !this.isPositionMoveMode; if (this.positionsList) this.positionsList.classList.toggle("is-move-mode", this.isPositionMoveMode); }
  _createTitle() { if (!this._isFreeDraft()) return this._error("Titel sind nur in freien Entwuerfen verfuegbar."); this._createPositionEntry({ type: POSITION_TYPES.HEADING, is_title: true, parent_id: null }); }
  _createPosition() { if (!this._isFreeDraft()) return this._error("Positionen sind nur in freien Entwuerfen verfuegbar."); const target = this._resolvePositionCreateParent(); if (target.blocked) return this._error("Weitere Unterebenen werden erst ab Meilenstein 3 freigegeben."); this._createPositionEntry({ type: POSITION_TYPES.SERVICE, is_title: false, parent_id: target.parentId }); }
  _createPositionEntry({ type, is_title, parent_id }) { const id = this._nextPositionId(); this.positions.push({ id, type, is_title, parent_id, short_text: "(ohne Bezeichnung)", long_text: "", quantity: "1", unit: "", unit_price_cents: 0, is_nep: false, vat_rate_percent: is_title ? null : 19, price_input_mode: is_title ? null : PRICE_INPUT_MODES.NET, price_input_cents: null }); this._normalizePositions(); const created = this.positions.find((entry) => entry.id === id); this._setPositionCreateParentId(parent_id); this._selectPosition(created, { setCreateContext: false }); this._renderPositions(); void this._queueDraftSave(); this.positionShort.focus?.(); }
  _syncSelectedPositionFromEditor() { const existing = this._getSelectedPosition(); if (!existing || !this._isFreeDraft()) return; try { const isTitle = Boolean(this.positionIsTitle); const type = isTitle ? POSITION_TYPES.HEADING : this.positionType.value; const priceInputCents = Math.round(Number(this.positionPrice.value || 0) * 100); const price_input_mode = this.positionPriceGross.checked ? PRICE_INPUT_MODES.GROSS : PRICE_INPUT_MODES.NET; const entry = { id: existing.id, type, is_title: isTitle, parent_id: existing.parent_id || null, short_text: this.positionShort.value.trim() || "(ohne Bezeichnung)", long_text: this.positionLong.value.trim(), quantity: isTitle ? null : this.positionQuantity.value || "0", unit: isTitle ? null : this.positionUnit.value.trim(), unit_price_cents: isTitle ? null : priceInputCents, is_nep: isTitle ? false : this.positionNep.checked, vat_rate_percent: type === POSITION_TYPES.SERVICE ? existing.vat_rate_percent : null, price_input_mode: type === POSITION_TYPES.SERVICE ? price_input_mode : null, price_input_cents: type === POSITION_TYPES.SERVICE && price_input_mode === PRICE_INPUT_MODES.GROSS ? priceInputCents : null }; const next = [...this.positions]; next[next.findIndex((item) => item.id === entry.id)] = entry; this.positions = [...normalizeInvoicePositions(next, { idFactory: () => this._nextPositionId() })]; this._renderPositions(); this._syncPositionEditorFields(); void this._queueDraftSave(); } catch (error) { this._error(error?.message); } }
  _applyPosition() { const shortText = this.positionShort.value.trim(); if (!shortText) return this._error("Kurztext der Position fehlt."); const existing = this._getSelectedPosition(); const id = existing?.id || this._nextPositionId(); const isTitle = Boolean(this.positionIsTitle); const type = isTitle ? POSITION_TYPES.HEADING : this.positionType.value; const entry = { id, type, is_title: isTitle, parent_id: existing?.parent_id || null, short_text: shortText, long_text: this.positionLong.value.trim(), quantity: isTitle ? null : this.positionQuantity.value || "0", unit: isTitle ? null : this.positionUnit.value.trim(), unit_price_cents: isTitle ? null : Math.round(Number(this.positionPrice.value || 0) * 100), is_nep: isTitle ? false : this.positionNep.checked, vat_rate_percent: type === POSITION_TYPES.SERVICE ? this.positionVatRate.value : null }; const index = this.positions.findIndex((item) => item.id === id); if (index < 0) this.positions.push(entry); else this.positions[index] = entry; this._normalizePositions(); const updated = this.positions.find((item) => item.id === id); this._selectPosition(updated, { setCreateContext: false }); this._renderPositions(); }
  _deletePosition() { const selected = this._getSelectedPosition(); if (!selected) return; if (this.positions.some((entry) => entry.parent_id === selected.id)) return this._error("Titel mit Unterpositionen koennen nicht geloescht werden."); this.positions = this.positions.filter((entry) => entry.id !== selected.id); this._setPositionCreateParentId(null); this._clearPositionEditor(); this._renderPositions(); void this._queueDraftSave(); }
  _togglePositionMove() { const selected = this._getSelectedPosition(); if (!this._isFreeDraft() || !selected || selected.is_title) return; this.isPositionMoveMode = !this.isPositionMoveMode; this._syncPositionActions(); this._renderPositions(); }
  _isPositionDescendant(entryId, ancestorId) { let current = this.positions.find((entry) => entry.id === entryId) || null; const seen = new Set(); while (current?.parent_id && !seen.has(current.parent_id)) { if (current.parent_id === ancestorId) return true; seen.add(current.parent_id); current = this.positions.find((entry) => entry.id === current.parent_id) || null; } return false; }
  _isPositionMoveTarget(target, moving = this._getSelectedPosition()) { if (!moving || moving.id === target.id || moving.is_title || this._isPositionDescendant(target.id, moving.id)) return false; if (target.is_title && !target.parent_id) return true; return (target.parent_id || null) === (moving.parent_id || null); }
  _handlePositionRowClick(entry) { if (this.isPositionMoveMode) { if (this._isPositionMoveTarget(entry)) this._moveSelectedPositionTo(entry); return; } this._selectPosition(entry); this._renderPositions(); }
  _moveSelectedPositionTo(target) { const moving = this._getSelectedPosition(); if (!this._isPositionMoveTarget(target, moving)) return; const next = this.positions.filter((entry) => entry.id !== moving.id); const moved = { ...moving, parent_id: target.is_title ? target.id : target.parent_id || null }; let index; if (target.is_title) { index = next.reduce((last, entry, currentIndex) => entry.parent_id === target.id ? currentIndex + 1 : last, next.findIndex((entry) => entry.id === target.id) + 1); } else index = next.findIndex((entry) => entry.id === target.id); next.splice(index < 0 ? next.length : index, 0, moved); this.positions = next; this._normalizePositions(); this.isPositionMoveMode = false; this._setPositionCreateParentId(moved.parent_id); this._selectPosition(this.positions.find((entry) => entry.id === moved.id), { setCreateContext: false }); this._renderPositions(); void this._queueDraftSave(); }
  _moveSelectedPositionToRoot() { const moving = this._getSelectedPosition(); if (!moving || moving.is_title || !moving.parent_id || !this._isFreeDraft()) return; const next = this.positions.filter((entry) => entry.id !== moving.id); const moved = { ...moving, parent_id: null }; const firstTitleIndex = next.findIndex((entry) => entry.is_title && !entry.parent_id); next.splice(firstTitleIndex < 0 ? next.length : firstTitleIndex, 0, moved); this.positions = next; this._normalizePositions(); this.isPositionMoveMode = false; this._setPositionCreateParentId(null); this._selectPosition(this.positions.find((entry) => entry.id === moved.id), { setCreateContext: false }); this._renderPositions(); void this._queueDraftSave(); }
  _renderPositions() { return this._renderLvPositions(); }

  _legacyRenderPositions() { this.positionsList.replaceChildren(); let total = 0; if (!this.positions.length) this.positionsList.append(node("div", "invoice-empty", "Noch keine Positionen.")); this.positions.forEach((entry, index) => { const row = node("button", `rechnung-live-position${entry.id === this.selectedPositionId ? " is-selected" : ""}`); row.type = "button"; row.onclick = () => { this._selectPosition(entry); this._renderPositions(); }; const amount = calculatePositionTotalCents(entry); if (amount != null) total += amount; row.append(node("span", "rechnung-live-position__number", entry.type === "note" ? "-" : String(index + 1)), node("span", "rechnung-live-position__text", entry.short_text), node("span", "rechnung-live-position__amount", amount == null ? "NEP" : `${(amount / 100).toFixed(2).replace(".", ",")} EUR`)); this.positionsList.append(row); }); this.positionsTotal.textContent = `${(total / 100).toFixed(2).replace(".", ",")} EUR`; }

  _renderLvPositions() {
    this.positionsList.replaceChildren();
    const orderedPositions = this._orderedPositions();
    if (!orderedPositions.length) this.positionsList.append(node("div", "invoice-empty", "Noch keine Positionen."));
    if (orderedPositions.some((entry) => entry.type === POSITION_TYPES.SERVICE)) {
      const pricingHead = node("div", "rechnung-lv-list__pricing-head");
      pricingHead.append(node("span", "", "Pos. / Gegenstand"), node("span", "", "Menge / Einheit"), node("span", "", "EP"), node("strong", "", "GP"));
      this.positionsList.append(pricingHead);
    }
    orderedPositions.forEach((entry) => {
      const depth = this._positionDepth(entry); const isMoveTarget = this.isPositionMoveMode && this._isPositionMoveTarget(entry);
      const row = node("article", `rechnung-lv-position${entry.id === this.selectedPositionId ? " is-selected" : ""}${entry.is_title ? " is-title" : ""}${isMoveTarget ? " is-move-target" : ""} is-depth-${Math.min(depth, 4)}`);
      const select = node("button", "rechnung-lv-position__select"); select.type = "button"; select.onclick = () => this._handlePositionRowClick(entry);
      const amount = calculatePositionTotalCents(entry);
      select.append(node("span", "rechnung-lv-position__number", entry.type === POSITION_TYPES.NOTE ? "Hinweis" : entry.type === POSITION_TYPES.HEADING && !entry.is_title ? "Text" : entry.position_number || ""), node("strong", "rechnung-lv-position__short", entry.short_text)); row.append(select);
      if (entry.long_text) row.append(node("p", "rechnung-lv-position__long", entry.long_text));
      if (entry.type === POSITION_TYPES.SERVICE) {
        const quantity = entry.quantity === null || entry.quantity === undefined || entry.quantity === "" ? "" : formatQuantityForInput(entry.quantity, this.quantityDecimalPlaces);
        const pricing = node("div", "rechnung-lv-position__pricing");
        pricing.append(node("span", "", [quantity, entry.unit].filter(Boolean).join(" ") || "0"), node("span", "", money(entry.unit_price_cents)), node("strong", "", entry.is_nep ? "NEP" : money(amount)));
        row.append(pricing);
      }
      this.positionsList.append(row);
    });
    const totals = calculateInvoiceTotalsCents(orderedPositions); const vatRates = [...new Set(orderedPositions.filter((entry) => calculatePositionTotalCents(entry) != null).map((entry) => entry.vat_rate_percent))]; const vatLabel = vatRates.length === 1 ? `${vatRates[0]} % MwSt.` : "MwSt."; this.positionsTotal.textContent = money(totals.net_cents); this.invoiceVatLabel.textContent = vatLabel; this.invoiceVat.textContent = money(totals.vat_cents); this.invoiceTotal.textContent = money(totals.gross_cents); if (this.editboxNetTotal) this.editboxNetTotal.textContent = formatEuroCents(totals.net_cents); if (this.editboxVatLabel) this.editboxVatLabel.textContent = vatLabel; if (this.editboxVatTotal) this.editboxVatTotal.textContent = formatEuroCents(totals.vat_cents); if (this.editboxGrossTotal) this.editboxGrossTotal.textContent = formatEuroCents(totals.gross_cents);
  }

  _syncDerived() {
    const isPartial = this.documentType.value === "PARTIAL"; this.installmentNumber.closest("label").hidden = !isPartial;
    const type = this.serviceType.value; this.serviceFields.SINGLE_DATE.hidden = type !== "SINGLE_DATE"; this.serviceFields.MONTH.hidden = type !== "MONTH"; this.serviceFields.RANGE_START.hidden = type !== "RANGE"; this.serviceFields.RANGE_END.hidden = type !== "RANGE";
    try { this.dueDate.value = addCalendarDays(this.invoiceDate.value, Number(this.paymentTerm.value)); } catch { this.dueDate.value = ""; }
    this.title.textContent = formatDocumentType({ document_type: this.documentType.value, installment_number: Number(this.installmentNumber.value) || null });
    const customer = this.customers.find((entry) => customerKey(entry) === this.customer.value);
    const customerValue = this.current?.status === "BOOKED" ? this.current.customer_snapshot : customer || this.current?.legacy_customer;
    const issuerValue = this.current?.status === "BOOKED" ? this.current.issuer_snapshot : this.profile ? { companyName: this.profile.name1, companyName2: this.profile.name2, ...this.profile } : null;
    this.customerAddress.textContent = address(customerValue);
    this._renderIssuerInformation(issuerValue);
    this._renderIssuerMeta();
    this._renderIssuerFooter(issuerValue);
  }

  _renderIssuerInformation(value) { const information = issuerInformation(value); if (!this.issuerBlock) return; const fallback = !information.nameLines.length && !information.addressLines.length ? "Eigene Unternehmensdaten unvollständig" : ""; [[this.issuerName1, information.nameLines[0] || fallback], [this.issuerName2, information.nameLines[1] || ""], [this.issuerStreet, information.addressLines[0] || ""], [this.issuerCity, information.addressLines[1] || ""]].forEach(([element, content]) => { if (element) element.textContent = content; }); }
  _renderIssuerMeta() { const rows = [[this.invoiceDateDisplay, this.invoiceDateDisplayValue, formatDate(this.invoiceDate?.value)], [this.servicePeriodDisplay, this.servicePeriodDisplayValue, this._formatServicePeriod()]]; rows.forEach(([row, valueElement, value]) => { if (!row || !valueElement) return; row.hidden = !value; valueElement.textContent = value; }); }
  _renderIssuerFooter(value) { if (!this.issuerFooter) return; const lines = issuerInformation(value).footerLines; this.issuerFooter.hidden = !lines.length; if (!this.issuerFooter.replaceChildren) { this.issuerFooter.textContent = lines.join("\n"); return; } this.issuerFooter.replaceChildren(...lines.map((line) => node("div", "rechnung-sheet__issuer-footer__line", line))); }
  _syncServicePeriodToggle() { if (!this.servicePeriodToggle) return; if (this._isServicePeriodEditing) { this.servicePeriodToggle.textContent = "Leistungszeitraum schließen"; return; } this.servicePeriodToggle.replaceChildren(node("span", "rechnung-sheet__issuer-meta-label", "Leistungszeitraum"), node("span", "rechnung-sheet__issuer-meta-colon", ":"), node("span", "rechnung-sheet__issuer-meta-value", this._formatServicePeriod() || "festlegen")); }

  _formatServicePeriod() {
    if (this.serviceType.value === "MONTH") return formatMonth(this.serviceMonth.value);
    if (this.serviceType.value === "RANGE") return [formatDate(this.serviceStart.value), formatDate(this.serviceEnd.value)].filter(Boolean).join(" – ");
    return formatDate(this.serviceDate.value);
  }

  _toggleServicePeriodEditor() {
    this._isServicePeriodEditing = !this._isServicePeriodEditing;
    this.servicePeriodToggle.parentElement?.classList.toggle("is-editing", this._isServicePeriodEditing);
    this._syncDerived();
  }

  _updatePaymentText() {
    if (!this.paymentText) return;
    this.paymentText.textContent = this.dueDate.value ? `Bitte überweisen Sie den Rechnungsbetrag innerhalb von ${this.paymentTerm.value || 0} Tagen, fällig am ${this.dueDate.value}.` : `Bitte überweisen Sie den Rechnungsbetrag innerhalb von ${this.paymentTerm.value || 0} Tagen.`;
  }

  _setBooked(booked) {
    this._updatePaymentText();
    this.status.textContent = booked ? "Erstellt / Gebucht" : "Entwurf"; this.status.className = `invoice-status invoice-status--${booked ? "paid" : "draft"}`;
    [this.source, this.documentType, this.installmentNumber, this.customer, this.project, this.invoiceDate, this.serviceType, this.serviceDate, this.serviceMonth, this.serviceStart, this.serviceEnd, this.reference, this.constructionProject, this.introText, this.paymentTerm, this.positionType, this.positionShort, this.positionLong, this.positionQuantity, this.positionUnit, this.positionPrice, this.positionPriceGross, this.positionNep, this.positionDeleteButton, this.positionCreateTitleButton, this.positionCreateButton, this.positionMoveButton, this.positionMoveRootButton].filter(Boolean).forEach((element) => { element.disabled = booked; });
    this._syncQuantityDecimalStepperState();
    if (this.customerPickerButton) this.customerPickerButton.disabled = booked;
    if (this.servicePeriodToggle) this.servicePeriodToggle.disabled = booked;
    this.bookButton.hidden = booked; this.deleteButton.hidden = booked;
    if (this.previewButton) {
      this.previewButton.textContent = !booked
        ? "Proberechnung"
        : this.current?.pdf_finalization_status === "READY"
          ? "PDF öffnen"
          : "PDF erneut erzeugen";
    }
    this._syncPositionActions();
  }

  _queueDraftSave() { if (this.current?.status !== "DRAFT" || typeof api().rechnungUpdateDraft !== "function") return Promise.resolve(true); const id = this.current.id; const payload = this._payload(); this.draftSaveChain = this.draftSaveChain.catch(() => false).then(async () => { const result = await api().rechnungUpdateDraft(id, payload); if (!result?.ok) { this._error(result?.error); return false; } if (this.current?.id === id) this.current = result.data; await this._refreshList(); return true; }); return this.draftSaveChain; }
  async _delete() { if (!globalThis.window?.confirm?.("Rechnungsentwurf wirklich verwerfen?")) return; const result = await api().rechnungDeleteDraft?.(this.current.id); if (!result?.ok) return this._error(result?.error); await this._refreshList(); this._close(); }
  async _book() { if ((await this.draftSaveChain) === false) return; if (!globalThis.window?.confirm?.("Rechnung jetzt verbindlich buchen? Danach ist sie nicht mehr bearbeitbar.")) return; const result = await api().rechnungBookDraft?.(this.current.id, this._payload()); if (!result?.ok) { if (result?.data?.status === "BOOKED") { this.current = result.data; this._open(result.data); await this._refreshList(); } return this._error(result?.error); } this.current = result.data; this._open(result.data); this.message.textContent = `Rechnung ${result.data.invoice_number} wurde gebucht und als finale PDF abgelegt.`; await this._refreshList(); }
  async _showPreview() { if ((await this.draftSaveChain) === false) return; if (this.current?.status === "BOOKED") { let invoice = this.current; if (invoice.pdf_finalization_status !== "READY") { const finalized = await api().rechnungFinalizePdf?.(invoice.id); if (!finalized?.ok) return this._error(finalized?.error); invoice = finalized.data; this.current = invoice; this._open(invoice); await this._refreshList(); } const opened = await api().rechnungOpenPdf?.(invoice.id); if (!opened?.ok) return this._error(opened?.error); this.message.textContent = `Finale PDF der Rechnung ${invoice.invoice_number} wurde geöffnet.`; return; } const result = await api().rechnungPreviewDraft?.(this.current.id, this._payload()); if (!result?.ok) return this._error(result?.error); const invoice = result.data; const identifier = invoice.preview_identifier || draftPreviewIdentifier(invoice.id); const draftLines = [`Kennung: ${identifier}`, "Diese Kennung ist keine Rechnungsnummer."]; this.previewBody.textContent = ["PROBERECHNUNG · ENTWURF", ...draftLines, formatDocumentType(invoice), "Rechnungs-Nr.: wird erst bei Buchung vergeben", invoice.service_reference || "Ohne Leistungsbezug", `Rechnungsdatum: ${invoice.invoice_date}`, `Fällig am: ${invoice.due_date}`].join("\n"); const printPreview = globalThis.window?.bbmPrint?.printPdfAndPreviewInternal; if (typeof printPreview !== "function") return this._error("PDF-Vorschau ist nicht verfügbar."); const pdf = await printPreview({ mode: "invoice", documentTypeId: "invoice", invoiceId: invoice.id, invoicePreview: true, orientation: "portrait", targetDir: "temp", fileName: `Proberechnung-${identifier}.pdf`, overwrite: true, previewTitle: `Proberechnung ${identifier}` }); if (!pdf?.ok) return this._error(pdf?.error); this.preview.hidden = false; this.message.textContent = `Proberechnung ${identifier} wurde geöffnet.`; }
  async _refreshList() { const result = await api().rechnungList?.(); if (result?.ok) { this.invoices = result.list || []; this._renderList(); } }
  _close() { this.editor.hidden = true; this.preview.hidden = true; this.overview.hidden = false; this.current = null; }
  destroy() { this._textLimitUnsubscribe?.(); this._textLimitUnsubscribe = null; }
  _error(message) { this.message.textContent = message || "Aktion fehlgeschlagen."; this.message.dataset.tone = "error"; }
  _overviewMessage(message) { this.list.replaceChildren(node("div", "rechnung-live-message", message || "Aktion fehlgeschlagen.")); }
}
