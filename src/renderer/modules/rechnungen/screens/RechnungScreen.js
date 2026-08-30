import { addCalendarDays, formatDocumentType } from "../../../../shared/rechnung/invoiceHeaderRules.mjs";
import { calculateInvoiceTotalsCents, calculatePositionGrossUnitPriceCents, calculatePositionTotalCents, normalizeInvoicePositions, POSITION_TYPES, PRICE_INPUT_MODES } from "../../../../shared/rechnung/rechnungPositions.mjs";
import { DEFAULT_TEXT_LIMITS, evaluateLongText, evaluateShortText, TextLimitSettingsService } from "../../../core/textregeln/index.js";
import { m80EditorAttributes } from "../../../ui-editor/m80Registry.js";
import { beginM83ComponentBinding, completeM80PilotRender, registerM80Ref } from "../../../ui-editor/m80Refs.js";
import { ensureRechnungenDesignStyles } from "../styles.js";
import { RECHNUNG_COMPONENT_ID, RECHNUNG_SCOPE_ID } from "../RechnungScreen.uiEditorContract.js";

const api = () => globalThis.window?.bbmDb || {};
const node = (tag, className = "", content = "") => { const element = document.createElement(tag); if (className) element.className = className; if (content) element.textContent = content; return element; };
const option = (value, label) => Object.assign(document.createElement("option"), { value, textContent: label });
const plainButton = (label, handler, variant = "secondary") => { const element = node("button", `invoice-button invoice-button--${variant}`, label); element.type = "button"; element.onclick = handler; return element; };

export const MANAGEMENT_FILTERS = Object.freeze([
  Object.freeze({ id: "ALL", label: "Alle" }),
  Object.freeze({ id: "DRAFT", label: "Entwürfe" }),
  Object.freeze({ id: "OPEN", label: "Offen" }),
  Object.freeze({ id: "PARTIALLY_PAID", label: "Teilbezahlt" }),
  Object.freeze({ id: "OVERDUE", label: "Überfällig" }),
  Object.freeze({ id: "PAID", label: "Bezahlt" }),
  Object.freeze({ id: "CANCELLED", label: "Storniert" }),
]);

export function invoiceMatchesManagementFilter(invoice, filterId) {
  if (!invoice || filterId === "ALL") return Boolean(invoice);
  if (filterId === "DRAFT" || filterId === "CANCELLED") return invoice.status === filterId;
  return invoice.status === "BOOKED" && invoice.payment_status === filterId;
}

export function parseEuroToCents(value) {
  let normalized = String(value ?? "").trim().replace(/(?:EUR|€)/gi, "").replace(/\s/g, "");
  if (!normalized) throw new Error("Bitte einen Zahlbetrag eingeben.");
  const validFormat = [
    /^\d+$/,
    /^\d+[,.]\d{1,2}$/,
    /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/,
    /^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/,
  ].some((pattern) => pattern.test(normalized));
  if (!validFormat) throw new Error("Bitte einen gültigen Euro-Betrag eingeben.");
  const comma = normalized.lastIndexOf(",");
  const dot = normalized.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    const decimalSeparator = comma > dot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    normalized = normalized.replaceAll(thousandsSeparator, "");
  }
  const separatorIndex = Math.max(normalized.lastIndexOf(","), normalized.lastIndexOf("."));
  const hasDecimalFraction = separatorIndex >= 0 && normalized.length - separatorIndex - 1 <= 2;
  if (separatorIndex >= 0 && !hasDecimalFraction) normalized = normalized.replace(/[.,]/g, "");
  else if (separatorIndex >= 0) normalized = `${normalized.slice(0, separatorIndex).replace(/[.,]/g, "")}.${normalized.slice(separatorIndex + 1)}`;
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error("Bitte einen gültigen Euro-Betrag eingeben.");
  const [whole, fraction = ""] = normalized.split(".");
  const cents = (Number(whole) * 100) + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error("Der Zahlbetrag muss größer als 0,00 EUR sein.");
  return cents;
}

function bind(element, id) {
  for (const [name, value] of Object.entries(m80EditorAttributes(id))) element.setAttribute(name, value);
  registerM80Ref(id, element);
  return element;
}
function button(label, id, handler, variant = "secondary") { const element = bind(node("button", `invoice-button invoice-button--${variant}`, label), id); element.type = "button"; element.onclick = handler; return element; }
function control(tag, id, type = "") { const element = bind(node(tag, "invoice-control"), id); if (type) element.type = type; return element; }
function field(labelText, input, className = "") { const wrapper = node("label", `invoice-field${className ? ` ${className}` : ""}`); wrapper.append(node("span", "invoice-field__label", labelText), input); return wrapper; }
function address(value = {}) { const source = value || {}; return [source.companyName || source.name, source.companyName2 || source.name2, source.street, [source.zip, source.city].filter(Boolean).join(" "), source.country].filter(Boolean).join("\n"); }
export function issuerInformation(value = {}) { const source = value || {}; const vatId = text(source.vatId || source.vat_id); const taxNumber = text(source.taxNumber || source.tax_number); const iban = text(source.iban); const bic = text(source.bic); const nameLines = [text(source.companyName || source.name), text(source.companyName2 || source.name2)].filter(Boolean); const addressLines = [text(source.street), [text(source.zip), text(source.city)].filter(Boolean).join(" ")].filter(Boolean); const register = text(source.commercialRegister || source.commercial_register); const registerNumber = text(source.registerNumber || source.register_number); const managingDirector = text(source.managingDirector || source.managing_director); return Object.freeze({ nameLines, addressLines, taxRow: vatId ? Object.freeze({ label: "USt-IdNr.", value: vatId }) : taxNumber ? Object.freeze({ label: "Steuernr.", value: taxNumber }) : null, bankRows: Object.freeze([...(iban ? [{ label: "IBAN", value: iban }] : []), ...(bic ? [{ label: "BIC", value: bic }] : [])]), footerLines: Object.freeze([[...nameLines, ...addressLines].join(" · "), [vatId && `USt-IdNr. ${vatId}`, taxNumber && `Steuernr. ${taxNumber}`, iban && `IBAN ${iban}`, bic && `BIC ${bic}`].filter(Boolean).join(" · "), [register, registerNumber && `Registernr. ${registerNumber}`, managingDirector && `Geschäftsführer ${managingDirector}`].filter(Boolean).join(" · ")].filter(Boolean)) }); }
function customerKey(value = {}) { return `${value.kind || value.ref?.kind}:${value.id || value.ref?.id}`; }
function money(cents) { return `${(Number(cents || 0) / 100).toFixed(2).replace(".", ",")} EUR`; }
function price(cents) { return (Number(cents || 0) / 100).toFixed(2); }
function formatDate(value) { const [year, month, day] = String(value || "").split("-"); return year && month && day ? `${day}.${month}.${year}` : ""; }
function formatMonth(value) { const [year, month] = String(value || "").split("-"); const names = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]; return year && names[Number(month) - 1] ? `${names[Number(month) - 1]} ${year}` : ""; }
function text(value) { return String(value || "").trim(); }
export function selectContentOnFocus(element) { element.addEventListener("focus", () => element.select?.()); }
export function draftPreviewIdentifier(draftId) { const compact = String(draftId || "").replace(/[^a-z0-9]/gi, "").toUpperCase(); return `PR-${(compact || "ENTWURF").slice(-6)}`; }

export default class RechnungScreen {
  constructor({ textLimitSettingsService = null } = {}) { this.invoices = []; this.customers = []; this.projects = []; this.positions = []; this.selectedPositionId = null; this.positionCreateParentId = null; this.positionSequence = 0; this.positionIsTitle = false; this.isPositionMoveMode = false; this.managementFilter = "ALL"; this.paymentInvoice = null; this.paymentEditingId = null; this.current = null; this.root = null; this.draftSaveChain = Promise.resolve(true); this.textLimitSettingsService = textLimitSettingsService || new TextLimitSettingsService(); this.textLimits = { ...DEFAULT_TEXT_LIMITS }; this._textLimitUnsubscribe = null; }

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
    this.filterBar = node("nav", "rechnung-management-filters"); this.filterBar.setAttribute("aria-label", "Rechnungsansicht");
    this.filterButtons = new Map();
    MANAGEMENT_FILTERS.forEach(({ id, label }) => {
      const filterButton = plainButton(label, () => this._setManagementFilter(id), id === "ALL" ? "primary" : "quiet");
      filterButton.dataset.filter = id; filterButton.setAttribute("aria-pressed", String(id === "ALL"));
      this.filterButtons.set(id, filterButton); this.filterBar.append(filterButton);
    });
    this.paymentPanel = this._paymentManagementPanel();
    this.devSequencePanel = node("section", "invoice-form-section rechnung-dev-sequence"); this.devSequencePanel.hidden = true;
    const devHead = node("div", "invoice-form-section__head");
    devHead.append(node("h2", "invoice-form-section__title", "DEV · Rechnungsnummernkreis"), node("span", "invoice-design-chip", "Nur Entwicklung"));
    const devControls = node("div", "rechnung-dev-sequence__controls");
    this.devSequenceKey = node("input", "invoice-control"); this.devSequenceKey.type = "text"; this.devSequenceKey.inputMode = "numeric"; this.devSequenceKey.maxLength = 4; this.devSequenceKey.value = String(new Date().getFullYear());
    this.devSequenceValue = node("strong", "rechnung-dev-sequence__value", "–");
    this.devSequenceResetButton = node("button", "invoice-button invoice-button--secondary", "Rechnungsnummern zurücksetzen"); this.devSequenceResetButton.type = "button";
    this.devSequenceStatus = node("div", "rechnung-live-message"); this.devSequenceStatus.setAttribute("role", "status");
    devControls.append(field("Nummernkreis", this.devSequenceKey), field("Aktueller Zähler", this.devSequenceValue), this.devSequenceResetButton);
    this.devSequencePanel.append(devHead, devControls, this.devSequenceStatus);
    this.devSequenceKey.addEventListener("change", () => void this._refreshDevNumberSequence());
    this.devSequenceResetButton.addEventListener("click", () => void this._resetDevNumberSequence());
    this.list = bind(node("div", "rechnung-live-list"), "rechnung.overview.list");
    overview.append(header, this.filterBar, this.paymentPanel, this.list, this.devSequencePanel); this.overview = overview; return overview;
  }

  _paymentManagementPanel() {
    const panel = node("section", "invoice-form-section rechnung-payment-management"); panel.hidden = true;
    const header = node("header", "rechnung-payment-management__header");
    const heading = node("div", "rechnung-payment-management__heading");
    this.paymentPanelTitle = node("h2", "invoice-form-section__title", "Zahlungen");
    this.paymentPanelSubtitle = node("p", "invoice-page-subtitle");
    heading.append(this.paymentPanelTitle, this.paymentPanelSubtitle);
    header.append(heading, plainButton("Schließen", () => this._closePaymentManagement(), "quiet"));
    this.paymentSummaryView = node("div", "rechnung-payment-management__summary");
    this.paymentGrossValue = node("strong", "invoice-amount", money(0));
    this.paymentPaidValue = node("strong", "invoice-amount", money(0));
    this.paymentOpenValue = node("strong", "invoice-amount", money(0));
    [["Brutto", this.paymentGrossValue], ["Bezahlt", this.paymentPaidValue], ["Offen", this.paymentOpenValue]].forEach(([label, value]) => {
      const item = node("div", "rechnung-payment-management__summary-item"); item.append(node("span", "invoice-cell-muted", label), value); this.paymentSummaryView.append(item);
    });
    const form = node("div", "rechnung-payment-management__form");
    this.paymentDate = node("input", "invoice-control"); this.paymentDate.type = "date";
    this.paymentAmount = node("input", "invoice-control"); this.paymentAmount.type = "text"; this.paymentAmount.inputMode = "decimal"; this.paymentAmount.placeholder = "0,00";
    this.paymentNote = node("input", "invoice-control"); this.paymentNote.type = "text"; this.paymentNote.maxLength = 500; this.paymentNote.placeholder = "optional";
    this.paymentSaveButton = plainButton("Zahlung speichern", () => void this._savePayment(), "primary");
    this.paymentCancelButton = plainButton("Eingabe leeren", () => this._resetPaymentForm(), "quiet");
    const actions = node("div", "rechnung-payment-management__form-actions"); actions.append(this.paymentCancelButton, this.paymentSaveButton);
    form.append(field("Zahlungsdatum", this.paymentDate), field("Zahlbetrag in EUR", this.paymentAmount), field("Notiz / Verwendungszweck", this.paymentNote, "invoice-field--wide"), actions);
    this.paymentMessage = node("div", "rechnung-live-message"); this.paymentMessage.setAttribute("role", "status");
    this.paymentList = node("div", "rechnung-payment-management__list");
    panel.append(header, this.paymentSummaryView, form, this.paymentMessage, this.paymentList);
    return panel;
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
    this.positionVatRate = bind(node("span", "rechnung-live-position-editor__vat-rate", "MwSt. 19 %"), "rechnung.editor.positionVatRate");
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
    const metaRow = (id, label) => { const row = bind(node("div", "rechnung-sheet__issuer-meta__row"), id); const value = node("span", "rechnung-sheet__issuer-meta-value"); row.append(node("span", "rechnung-sheet__issuer-meta-label", label), node("span", "rechnung-sheet__issuer-meta-colon", ":"), value); return { row, value }; };
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
    this.positionQuantity = control("input", "rechnung.editor.positionQuantity", "text"); this.positionQuantity.value = "1";
    this.positionUnit = control("input", "rechnung.editor.positionUnit", "text");
    this.positionPrice = control("input", "rechnung.editor.positionPrice", "number"); this.positionPrice.min = "0"; this.positionPrice.step = "0.01";
    this.positionVatRate = bind(node("span", "rechnung-live-position-editor__vat-rate", "MwSt. 19 %"), "rechnung.editor.positionVatRate");
    this.positionPriceGross = control("input", "rechnung.editor.positionPriceGross", "checkbox");
    this.positionNep = control("input", "rechnung.editor.positionNep", "checkbox");
    this.positionType.replaceChildren(option("service", "Leistungspos."), option("heading", "Text"), option("note", "Hinweis"));
    const positionActions = bind(node("div", "rechnung-live-position-editor__actions"), "rechnung.editor.positionActions");
    this.positionCreateTitleButton = button("+Titel", "rechnung.editor.positionCreateTitle", () => this._createTitle());
    this.positionCreateButton = button("+Position", "rechnung.editor.positionCreate", () => this._createPosition());
    this.positionMoveButton = button("Schieben", "rechnung.editor.positionMove", () => this._togglePositionMove());
    this.positionDeleteButton = button("Löschen", "rechnung.editor.positionDelete", () => this._deletePosition());
    this.positionMoveRootButton = node("button", "invoice-button invoice-button--secondary rechnung-live-position-editor__move-root", "Auf Ebene 0 verschieben"); this.positionMoveRootButton.type = "button"; this.positionMoveRootButton.onclick = () => this._moveSelectedPositionToRoot(); this.positionMoveRootButton.hidden = true;
    positionActions.append(this.positionCreateTitleButton, this.positionCreateButton, node("span", "rechnung-live-position-editor__action-spacer"), this.positionMoveButton, this.positionDeleteButton, this.positionMoveRootButton);
    this.positionTypeField = field("Typ", this.positionType); this.positionQuantityField = field("Menge", this.positionQuantity); this.positionUnitField = field("Einheit", this.positionUnit); this.positionPriceField = field("Einzelpreis netto", this.positionPrice); this.positionPriceLabel = this.positionPriceField.firstElementChild || this.positionPriceField.children?.[0]; this.positionVatRateField = field("MwSt.", this.positionVatRate); this.positionPriceGrossField = field("Brutto", this.positionPriceGross); this.positionNepField = field("NEP", this.positionNep);
    this.positionShortRemaining = bind(node("span", "rechnung-live-position-editor__remaining"), "rechnung.editor.positionShortRemaining"); this.positionLongRemaining = bind(node("span", "rechnung-live-position-editor__remaining"), "rechnung.editor.positionLongRemaining");
    const positionShortField = field("Kurztext", this.positionShort, "invoice-field--wide"); const positionLongField = field("Langtext", this.positionLong, "invoice-field--wide");
    (positionShortField.firstElementChild || positionShortField.children?.[0])?.append(this.positionShortRemaining); (positionLongField.firstElementChild || positionLongField.children?.[0])?.append(this.positionLongRemaining);
    this._updatePositionTextCounters();
    positionEditor.append(node("h3", "rechnung-sheet__position-title", "Position bearbeiten"), positionActions, this.positionTypeField, positionShortField, positionLongField, this.positionQuantityField, this.positionUnitField, this.positionPriceField, this.positionVatRateField, this.positionPriceGrossField, this.positionNepField);
    positions.append(this.positionsList);

    const payment = bind(node("section", "rechnung-sheet__payment"), "rechnung.editor.payment");
    this.paymentTerm = control("input", "rechnung.editor.paymentTermDays", "number"); this.paymentTerm.min = "0"; this.paymentTerm.max = "3650";
    this.dueDate = control("input", "rechnung.editor.dueDate", "date"); this.dueDate.readOnly = true;
    const totals = node("div", "rechnung-sheet__totals");
    this.positionsTotal = bind(node("strong", "rechnung-sheet__amount", "0,00 EUR"), "rechnung.editor.positions.total");
    this.invoiceVat = node("strong", "rechnung-sheet__amount", "0,00 EUR");
    this.invoiceTotal = node("strong", "rechnung-sheet__grand-amount", "0,00 EUR");
    this.invoiceVatLabel = node("span", "rechnung-sheet__total-label", "19 % MwSt.");
    totals.append(node("span", "rechnung-sheet__total-label", "Summe Netto"), this.positionsTotal, this.invoiceVatLabel, this.invoiceVat, node("strong", "rechnung-sheet__grand-label", "Summe Brutto"), this.invoiceTotal);
    this.paymentText = node("p", "rechnung-sheet__payment-text");
    payment.append(totals, field("Zahlungsziel in Tagen", this.paymentTerm), field("Fällig am", this.dueDate), this.paymentText);
    this.issuerFooter = bind(node("footer", "rechnung-sheet__issuer-footer"), "rechnung.editor.issuerFooter");
    body.append(this.headContent, positions, payment, this.issuerFooter);
    this.message = bind(node("div", "rechnung-live-message"), "rechnung.editor.validation"); this.message.setAttribute("role", "status");
    const footer = bind(node("footer", "rechnung-live-editor__footer rechnung-action-rail"), "rechnung.editor.footer"); footer.append(node("span", "rechnung-sheet__application-note", "Anwendungsaktionen – nicht Teil der Rechnung"));
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
    [this.positionQuantity, this.positionUnit, this.positionPrice].forEach((element) => element.addEventListener("input", () => this._syncSelectedPositionFromEditor()));
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
    const listManagement = api().rechnungListManagement || api().rechnungList;
    const [invoices, customers, projects, profile] = await Promise.all([listManagement?.(), api().rechnungListCustomers?.(), api().rechnungListProjects?.(), api().userProfileGet?.()]);
    this.invoices = invoices?.ok ? invoices.list || [] : [];
    this.customers = customers?.ok ? customers.list || [] : [];
    this.projects = projects?.ok ? projects.list || [] : [];
    this.profile = profile?.ok ? profile.profile || profile.data || null : null;
    await this._loadTextLimits(); this._bindTextLimitSettings();
    this._renderList();
    await this._loadDevNumberSequenceTool();
  }

  async _loadDevNumberSequenceTool() {
    if (!this.devSequencePanel || typeof api().appIsPackaged !== "function") return false;
    try {
      const runtime = await api().appIsPackaged();
      if (runtime?.ok !== true || runtime.isPackaged !== false) return false;
      this.devSequencePanel.hidden = false;
      await this._refreshDevNumberSequence();
      return true;
    } catch (_error) {
      return false;
    }
  }

  _devNumberSequenceKey() {
    const sequenceKey = String(this.devSequenceKey?.value || "").trim();
    if (!/^\d{4}$/.test(sequenceKey)) throw new Error("Bitte einen vierstelligen Nummernkreis eingeben.");
    return sequenceKey;
  }

  async _refreshDevNumberSequence() {
    try {
      const sequenceKey = this._devNumberSequenceKey();
      const result = await api().rechnungDevNumberSequenceGet?.(sequenceKey);
      if (!result?.ok) throw new Error(result?.error || "Nummernkreis konnte nicht geladen werden.");
      this.devSequenceValue.textContent = String(result.data?.last_value ?? 0);
      this.devSequenceStatus.textContent = "";
      this.devSequenceStatus.dataset.tone = "";
      return true;
    } catch (error) {
      if (this.devSequenceValue) this.devSequenceValue.textContent = "–";
      if (this.devSequenceStatus) { this.devSequenceStatus.textContent = error?.message || "Nummernkreis konnte nicht geladen werden."; this.devSequenceStatus.dataset.tone = "error"; }
      return false;
    }
  }

  async _resetDevNumberSequence() {
    let sequenceKey;
    try { sequenceKey = this._devNumberSequenceKey(); }
    catch (error) { this.devSequenceStatus.textContent = error.message; this.devSequenceStatus.dataset.tone = "error"; return false; }
    const confirmed = globalThis.window?.confirm?.(`Rechnungsnummernkreis ${sequenceKey} wirklich zurücksetzen?\n\nVorhandene Rechnungen werden nicht gelöscht. Der Vorgang wird abgelehnt, wenn vorhandene Rechnungsnummern mit einem Neustart kollidieren würden.`);
    if (!confirmed) return false;
    this.devSequenceResetButton.disabled = true;
    try {
      const result = await api().rechnungDevNumberSequenceReset?.(sequenceKey);
      if (!result?.ok) throw new Error(result?.error || "Nummernkreis konnte nicht zurückgesetzt werden.");
      this.devSequenceValue.textContent = String(result.data?.last_value ?? 0);
      this.devSequenceStatus.textContent = `Rechnungsnummernkreis ${sequenceKey} wurde zurückgesetzt.`;
      this.devSequenceStatus.dataset.tone = "";
      return true;
    } catch (error) {
      this.devSequenceStatus.textContent = error?.message || "Nummernkreis konnte nicht zurückgesetzt werden.";
      this.devSequenceStatus.dataset.tone = "error";
      return false;
    } finally {
      this.devSequenceResetButton.disabled = false;
    }
  }

  _renderList() {
    this.list.replaceChildren();
    this._syncManagementFilterButtons();
    const visibleInvoices = this.invoices.filter((invoice) => invoiceMatchesManagementFilter(invoice, this.managementFilter));
    if (this.invoices.length && !visibleInvoices.length) { this.list.append(node("div", "invoice-empty", "Keine Rechnungen in dieser Ansicht.")); return; }
    if (!this.invoices.length) { this.list.append(node("div", "invoice-empty", "Noch keine Rechnungen oder Entwürfe vorhanden.")); return; }
    const draftCounts = new Map();
    this.invoices.filter((invoice) => invoice.status === "DRAFT").forEach((invoice) => {
      const key = this._draftIdentity(invoice);
      draftCounts.set(key, (draftCounts.get(key) || 0) + 1);
    });
    for (const invoice of visibleInvoices) {
      const card = node("article", "rechnung-live-card");
      const badge = node("span", `invoice-status invoice-status--${invoice.status === "BOOKED" ? "paid" : "draft"}`, invoice.status === "BOOKED" ? "Erstellt / Gebucht" : "Entwurf");
      const documentStatus = this._documentStatus(invoice); badge.className = `invoice-status ${documentStatus.className}`; badge.textContent = documentStatus.label;
      const body = node("div", "rechnung-live-card__body");
      if (invoice.status !== "DRAFT") {
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
      card.append(badge, body, open, this._managementDetails(invoice)); this.list.append(card);
    }
  }

  _setManagementFilter(filterId) {
    if (!MANAGEMENT_FILTERS.some((entry) => entry.id === filterId)) return false;
    this.managementFilter = filterId; this._renderList(); return true;
  }

  _syncManagementFilterButtons() {
    this.filterButtons?.forEach((filterButton, filterId) => {
      const active = filterId === this.managementFilter;
      const definition = MANAGEMENT_FILTERS.find((entry) => entry.id === filterId);
      const count = this.invoices.filter((invoice) => invoiceMatchesManagementFilter(invoice, filterId)).length;
      filterButton.textContent = `${definition?.label || filterId} (${count})`;
      filterButton.setAttribute("aria-pressed", String(active));
      filterButton.className = `invoice-button invoice-button--${active ? "primary" : "quiet"}`;
    });
  }

  _managementDetails(invoice) {
    const details = node("div", "rechnung-management-card__details");
    const values = [
      ["Kennung / Nummer", invoice.status === "DRAFT" ? draftPreviewIdentifier(invoice.id) : invoice.invoice_number || "–", "rechnung-management-card__identity"],
      ["Datum", formatDate(invoice.invoice_date) || "–"],
      ["Kunde", this._invoiceCustomerLabel(invoice) || "Kein Kunde"],
      ["Art", formatDocumentType(invoice)],
      ["Brutto", money(invoice.gross_cents)],
      ["Bezahlt", money(invoice.paid_cents)],
      ["Offen", money(invoice.open_cents)],
      ["Fälligkeit", formatDate(invoice.due_date) || "–"],
    ];
    values.forEach(([label, value, className = ""]) => {
      const item = node("div", `rechnung-management-card__item${className ? ` ${className}` : ""}`);
      item.append(node("span", "rechnung-management-card__label", label), node("strong", "rechnung-management-card__value", value)); details.append(item);
    });
    const documentStatus = this._documentStatus(invoice); const paymentStatus = this._paymentStatus(invoice);
    const statuses = node("div", "rechnung-management-card__statuses");
    statuses.append(node("span", `invoice-status ${documentStatus.className}`, documentStatus.label), node("span", `invoice-status ${paymentStatus.className}`, paymentStatus.label));
    details.append(statuses);
    if (invoice.status === "BOOKED") details.append(plainButton("Zahlungen", () => void this._openPaymentManagement(invoice), "secondary"));
    return details;
  }

  _documentStatus(invoice) {
    if (invoice.status === "DRAFT") return { label: "Entwurf", className: "invoice-status--draft" };
    if (invoice.status === "CANCELLED") return { label: "Storniert", className: "invoice-status--cancelled" };
    return { label: "Gebucht", className: "invoice-status--open" };
  }

  _paymentStatus(invoice) {
    return ({
      OPEN: { label: "Offen", className: "invoice-status--open" },
      PARTIALLY_PAID: { label: "Teilbezahlt", className: "invoice-status--partial" },
      OVERDUE: { label: "Überfällig", className: "invoice-status--due" },
      PAID: { label: "Bezahlt", className: "invoice-status--paid" },
    })[invoice.payment_status] || { label: invoice.status === "DRAFT" ? "Noch nicht gebucht" : "Kein Zahlungsstatus", className: "invoice-status--draft" };
  }

  _invoiceCustomerLabel(invoice) {
    const snapshot = invoice.customer_snapshot || {};
    const customer = this.customers.find((entry) => customerKey(entry) === `${invoice.customer_ref_kind || ""}:${invoice.customer_firm_id || ""}`);
    return text(snapshot.companyName || snapshot.name || customer?.label || customer?.name || invoice.legacy_customer?.name);
  }

  async _openPaymentManagement(invoice) {
    if (invoice?.status !== "BOOKED") return false;
    this.paymentInvoice = invoice; this.paymentPanel.hidden = false;
    this.paymentPanelTitle.textContent = `Zahlungen · ${invoice.invoice_number || "Gebuchte Rechnung"}`;
    this.paymentPanelSubtitle.textContent = this._invoiceCustomerLabel(invoice) || "Ohne Kundenbezeichnung";
    this._syncPaymentSummary(); this._resetPaymentForm();
    return this._reloadPayments();
  }

  _closePaymentManagement() {
    if (this.paymentPanel) this.paymentPanel.hidden = true;
    this.paymentInvoice = null; this.paymentEditingId = null;
  }

  _syncPaymentSummary() {
    if (!this.paymentInvoice) return;
    this.paymentGrossValue.textContent = money(this.paymentInvoice.gross_cents);
    this.paymentPaidValue.textContent = money(this.paymentInvoice.paid_cents);
    this.paymentOpenValue.textContent = money(this.paymentInvoice.open_cents);
  }

  _resetPaymentForm() {
    this.paymentEditingId = null;
    if (this.paymentDate) this.paymentDate.value = new Date().toISOString().slice(0, 10);
    if (this.paymentAmount) this.paymentAmount.value = this.paymentInvoice?.open_cents > 0 ? price(this.paymentInvoice.open_cents).replace(".", ",") : "";
    if (this.paymentNote) this.paymentNote.value = "";
    if (this.paymentSaveButton) this.paymentSaveButton.textContent = "Zahlung speichern";
    if (this.paymentCancelButton) this.paymentCancelButton.textContent = "Eingabe leeren";
    if (this.paymentMessage) { this.paymentMessage.textContent = ""; this.paymentMessage.dataset.tone = ""; }
  }

  _editPayment(payment) {
    this.paymentEditingId = payment.id;
    this.paymentDate.value = payment.payment_date || "";
    this.paymentAmount.value = price(payment.amount_cents).replace(".", ",");
    this.paymentNote.value = payment.note || "";
    this.paymentSaveButton.textContent = "Korrektur speichern";
    this.paymentCancelButton.textContent = "Korrektur abbrechen";
    this.paymentMessage.textContent = "Bestehende Zahlung wird korrigiert.";
    this.paymentMessage.dataset.tone = "";
    this.paymentAmount.focus?.();
  }

  async _reloadPayments() {
    if (!this.paymentInvoice) return false;
    const result = await api().rechnungListPayments?.(this.paymentInvoice.id);
    if (!result?.ok) { this._paymentError(result?.error || "Zahlungen konnten nicht geladen werden."); return false; }
    this._renderPaymentList(result.list || []); return true;
  }

  _renderPaymentList(payments) {
    this.paymentList.replaceChildren();
    if (!payments.length) { this.paymentList.append(node("div", "invoice-empty", "Noch keine Zahlungen erfasst.")); return; }
    payments.forEach((payment) => {
      const row = node("div", "rechnung-payment-management__row");
      const description = node("div", "rechnung-payment-management__row-description");
      description.append(node("strong", "invoice-amount", money(payment.amount_cents)), node("span", "invoice-cell-muted", [formatDate(payment.payment_date), payment.note].filter(Boolean).join(" · ")));
      row.append(description, plainButton("Korrigieren", () => this._editPayment(payment), "quiet")); this.paymentList.append(row);
    });
  }

  async _savePayment() {
    if (this.paymentInvoice?.status !== "BOOKED") { this._paymentError("Zahlungen können nur für gebuchte Rechnungen erfasst werden."); return false; }
    let amountCents;
    try { amountCents = parseEuroToCents(this.paymentAmount.value); }
    catch (error) { this._paymentError(error?.message); return false; }
    const payment = { payment_date: this.paymentDate.value, amount_cents: amountCents, note: this.paymentNote.value };
    this.paymentSaveButton.disabled = true;
    try {
      const result = this.paymentEditingId
        ? await api().rechnungCorrectPayment?.(this.paymentInvoice.id, this.paymentEditingId, payment)
        : await api().rechnungRecordPayment?.(this.paymentInvoice.id, payment);
      if (!result?.ok) { this._paymentError(result?.error || "Zahlung konnte nicht gespeichert werden."); return false; }
      const invoiceId = this.paymentInvoice.id;
      await this._refreshList();
      this.paymentInvoice = this.invoices.find((invoice) => invoice.id === invoiceId) || this.paymentInvoice;
      this._syncPaymentSummary(); this._resetPaymentForm(); await this._reloadPayments();
      this.paymentMessage.textContent = "Zahlung wurde gespeichert; Summen und Status sind aktualisiert.";
      return true;
    } finally { this.paymentSaveButton.disabled = false; }
  }

  _paymentError(message) {
    this.paymentMessage.textContent = message || "Zahlungsaktion fehlgeschlagen.";
    this.paymentMessage.dataset.tone = "error";
  }

  _draftCustomerLabel(invoice) {
    return this._invoiceCustomerLabel(invoice);
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
    await this._refreshList(); this._open(this.invoices.find((invoice) => invoice.id === result.data.id) || result.data);
  }

  _open(invoice) {
    this._closePaymentManagement();
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
    if (this.headContent) { this.headContent.hidden = false; this._syncHeadToggle(); } this._syncDerived(); this._setBooked(invoice.status !== "DRAFT");
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
  _clearPositionEditor() { this.selectedPositionId = null; this.positionIsTitle = false; this.positionType.value = POSITION_TYPES.SERVICE; this.positionShort.value = ""; this.positionLong.value = ""; this.positionQuantity.value = "1"; this.positionUnit.value = ""; this.positionPrice.value = ""; this.positionVatRate.textContent = "MwSt. 19 %"; this.positionPriceGross.checked = false; this.positionNep.checked = false; this._updatePositionTextCounters(); this._syncPositionEditorFields(); this._syncPositionActions(); }
  _selectPosition(entry, { setCreateContext = true } = {}) { this.selectedPositionId = entry.id; this.positionIsTitle = Boolean(entry.is_title); this.positionType.value = entry.type; this.positionShort.value = entry.short_text || ""; this.positionLong.value = entry.long_text || ""; this.positionQuantity.value = entry.quantity ?? "1"; this.positionUnit.value = entry.unit || ""; this.positionPriceGross.checked = entry.price_input_mode === PRICE_INPUT_MODES.GROSS; this.positionPrice.value = entry.unit_price_cents == null ? "" : price(this.positionPriceGross.checked ? calculatePositionGrossUnitPriceCents(entry) : entry.unit_price_cents); this.positionVatRate.textContent = `MwSt. ${entry.vat_rate_percent == null ? 19 : entry.vat_rate_percent} %`; this.positionNep.checked = Boolean(entry.is_nep); if (setCreateContext) this._setPositionCreateParentId(entry.id); this._updatePositionTextCounters(); this._syncPositionEditorFields(); this._syncPositionActions(); }
  _updatePositionTextCounters() { const shortEvaluation = evaluateShortText(this.positionShort?.value, { limit: this.textLimits.shortText }); const longEvaluation = evaluateLongText(this.positionLong?.value, { limit: this.textLimits.longText }); if (this.positionShortRemaining) { this.positionShortRemaining.textContent = String(shortEvaluation.remaining); this.positionShortRemaining.dataset.level = shortEvaluation.level; } if (this.positionLongRemaining) { this.positionLongRemaining.textContent = String(longEvaluation.remaining); this.positionLongRemaining.dataset.level = longEvaluation.level; } }
  _applyTextLimits(limits = {}) { this.textLimits = { shortText: Number(limits.shortText) || DEFAULT_TEXT_LIMITS.shortText, longText: Number(limits.longText) || DEFAULT_TEXT_LIMITS.longText }; if (this.positionShort) this.positionShort.maxLength = this.textLimits.shortText; if (this.positionLong) this.positionLong.maxLength = this.textLimits.longText; this._updatePositionTextCounters(); }
  async _loadTextLimits() { const limits = await this.textLimitSettingsService.load(); this._applyTextLimits(limits); return limits; }
  _bindTextLimitSettings() { if (this._textLimitUnsubscribe) return; this._textLimitUnsubscribe = this.textLimitSettingsService.subscribe((limits) => this._applyTextLimits(limits)); }
  _syncPositionEditorFields() { const isTitle = this.positionIsTitle; const isService = !isTitle && this.positionType.value === POSITION_TYPES.SERVICE; if (this.positionType) this.positionType.disabled = isTitle; [this.positionTypeField, this.positionQuantityField, this.positionUnitField].filter(Boolean).forEach((fieldNode) => { fieldNode.hidden = isTitle; }); [this.positionPriceField, this.positionVatRateField, this.positionPriceGrossField, this.positionNepField].filter(Boolean).forEach((fieldNode) => { fieldNode.hidden = !isService; }); if (this.positionPriceLabel) this.positionPriceLabel.textContent = `Einzelpreis ${this.positionPriceGross.checked ? "brutto" : "netto"}`; }
  _togglePositionPriceInputMode() { const existing = this._getSelectedPosition(); if (!existing || existing.type !== POSITION_TYPES.SERVICE || !this._isFreeDraft()) return; this.positionPrice.value = price(this.positionPriceGross.checked ? calculatePositionGrossUnitPriceCents(existing) : existing.unit_price_cents); this._syncSelectedPositionFromEditor(); }
  _syncPositionActions() { const isFreeDraft = this._isFreeDraft(); const selected = this._getSelectedPosition(); if (this.positionCreateTitleButton) this.positionCreateTitleButton.disabled = !isFreeDraft; if (this.positionCreateButton) this.positionCreateButton.disabled = !isFreeDraft; if (this.positionMoveButton) { this.positionMoveButton.disabled = !isFreeDraft || !selected || Boolean(selected.is_title); this.positionMoveButton.textContent = this.isPositionMoveMode ? "Schieben beenden" : "Schieben"; } if (this.positionMoveRootButton) this.positionMoveRootButton.hidden = !this.isPositionMoveMode; if (this.positionsList) this.positionsList.classList.toggle("is-move-mode", this.isPositionMoveMode); }
  _createTitle() { if (!this._isFreeDraft()) return this._error("Titel sind nur in freien Entwuerfen verfuegbar."); this._createPositionEntry({ type: POSITION_TYPES.HEADING, is_title: true, parent_id: null }); }
  _createPosition() { if (!this._isFreeDraft()) return this._error("Positionen sind nur in freien Entwuerfen verfuegbar."); const target = this._resolvePositionCreateParent(); if (target.blocked) return this._error("Weitere Unterebenen werden erst ab Meilenstein 3 freigegeben."); this._createPositionEntry({ type: POSITION_TYPES.SERVICE, is_title: false, parent_id: target.parentId }); }
  _createPositionEntry({ type, is_title, parent_id }) { const id = this._nextPositionId(); this.positions.push({ id, type, is_title, parent_id, short_text: "(ohne Bezeichnung)", long_text: "", quantity: "1", unit: "", unit_price_cents: 0, is_nep: false, vat_rate_percent: is_title ? null : 19, price_input_mode: is_title ? null : PRICE_INPUT_MODES.NET, price_input_cents: null }); this._normalizePositions(); const created = this.positions.find((entry) => entry.id === id); this._setPositionCreateParentId(parent_id); this._selectPosition(created, { setCreateContext: false }); this._renderPositions(); void this._queueDraftSave(); this.positionShort.focus?.(); }
  _syncSelectedPositionFromEditor() { const existing = this._getSelectedPosition(); if (!existing || !this._isFreeDraft()) return; try { const isTitle = Boolean(this.positionIsTitle); const type = isTitle ? POSITION_TYPES.HEADING : this.positionType.value; const priceInputCents = Math.round(Number(this.positionPrice.value || 0) * 100); const price_input_mode = this.positionPriceGross.checked ? PRICE_INPUT_MODES.GROSS : PRICE_INPUT_MODES.NET; const entry = { ...existing, id: existing.id, type, is_title: isTitle, parent_id: existing.parent_id || null, short_text: this.positionShort.value.trim() || "(ohne Bezeichnung)", long_text: this.positionLong.value.trim(), quantity: isTitle ? null : this.positionQuantity.value || "0", unit: isTitle ? null : this.positionUnit.value.trim(), unit_price_cents: isTitle ? null : priceInputCents, is_nep: isTitle ? false : this.positionNep.checked, vat_rate_percent: type === POSITION_TYPES.SERVICE ? existing.vat_rate_percent : null, price_input_mode: type === POSITION_TYPES.SERVICE ? price_input_mode : null, price_input_cents: type === POSITION_TYPES.SERVICE && price_input_mode === PRICE_INPUT_MODES.GROSS ? priceInputCents : null }; const next = [...this.positions]; next[next.findIndex((item) => item.id === entry.id)] = entry; this.positions = [...normalizeInvoicePositions(next, { idFactory: () => this._nextPositionId() })]; this._renderPositions(); this._syncPositionEditorFields(); void this._queueDraftSave(); } catch (error) { this._error(error?.message); } }
  _applyPosition() { const shortText = this.positionShort.value.trim(); if (!shortText) return this._error("Kurztext der Position fehlt."); const existing = this._getSelectedPosition(); const id = existing?.id || this._nextPositionId(); const isTitle = Boolean(this.positionIsTitle); const type = isTitle ? POSITION_TYPES.HEADING : this.positionType.value; const entry = { ...(existing || {}), id, type, is_title: isTitle, parent_id: existing?.parent_id || null, short_text: shortText, long_text: this.positionLong.value.trim(), quantity: isTitle ? null : this.positionQuantity.value || "0", unit: isTitle ? null : this.positionUnit.value.trim(), unit_price_cents: isTitle ? null : Math.round(Number(this.positionPrice.value || 0) * 100), is_nep: isTitle ? false : this.positionNep.checked, vat_rate_percent: type === POSITION_TYPES.SERVICE ? this.positionVatRate.value : null }; const index = this.positions.findIndex((item) => item.id === id); if (index < 0) this.positions.push(entry); else this.positions[index] = entry; this._normalizePositions(); const updated = this.positions.find((item) => item.id === id); this._selectPosition(updated, { setCreateContext: false }); this._renderPositions(); }
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
      if (entry.type === POSITION_TYPES.SERVICE) { const pricing = node("div", "rechnung-lv-position__pricing"); pricing.append(node("span", "", [entry.quantity, entry.unit].filter(Boolean).join(" ") || "0"), node("span", "", money(entry.unit_price_cents)), node("strong", "", entry.is_nep ? "NEP" : money(amount))); row.append(pricing); }
      this.positionsList.append(row);
    });
    const totals = calculateInvoiceTotalsCents(orderedPositions); const vatRates = [...new Set(orderedPositions.filter((entry) => calculatePositionTotalCents(entry) != null).map((entry) => entry.vat_rate_percent))]; this.positionsTotal.textContent = money(totals.net_cents); this.invoiceVatLabel.textContent = vatRates.length === 1 ? `${vatRates[0]} % MwSt.` : "MwSt."; this.invoiceVat.textContent = money(totals.vat_cents); this.invoiceTotal.textContent = money(totals.gross_cents);
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
    const cancelled = this.current?.status === "CANCELLED";
    this.status.textContent = cancelled ? "Storniert" : booked ? "Erstellt / Gebucht" : "Entwurf"; this.status.className = `invoice-status invoice-status--${cancelled ? "cancelled" : booked ? "paid" : "draft"}`;
    [this.source, this.documentType, this.installmentNumber, this.customer, this.project, this.invoiceDate, this.serviceType, this.serviceDate, this.serviceMonth, this.serviceStart, this.serviceEnd, this.reference, this.constructionProject, this.introText, this.paymentTerm, this.positionType, this.positionShort, this.positionLong, this.positionQuantity, this.positionUnit, this.positionPrice, this.positionPriceGross, this.positionNep, this.positionDeleteButton, this.positionCreateTitleButton, this.positionCreateButton, this.positionMoveButton, this.positionMoveRootButton].filter(Boolean).forEach((element) => { element.disabled = booked; });
    if (this.customerPickerButton) this.customerPickerButton.disabled = booked;
    if (this.servicePeriodToggle) this.servicePeriodToggle.disabled = booked;
    this.bookButton.hidden = booked; this.deleteButton.hidden = booked;
    this._syncPositionActions();
  }

  _queueDraftSave() { if (this.current?.status !== "DRAFT" || typeof api().rechnungUpdateDraft !== "function") return Promise.resolve(true); const id = this.current.id; const payload = this._payload(); this.draftSaveChain = this.draftSaveChain.catch(() => false).then(async () => { const result = await api().rechnungUpdateDraft(id, payload); if (!result?.ok) { this._error(result?.error); return false; } if (this.current?.id === id) this.current = result.data; await this._refreshList(); return true; }); return this.draftSaveChain; }
  async _delete() { if (!globalThis.window?.confirm?.("Rechnungsentwurf wirklich verwerfen?")) return; const result = await api().rechnungDeleteDraft?.(this.current.id); if (!result?.ok) return this._error(result?.error); await this._refreshList(); this._close(); }
  async _book() { if ((await this.draftSaveChain) === false) return; if (!globalThis.window?.confirm?.("Rechnung jetzt verbindlich buchen? Danach ist sie nicht mehr bearbeitbar.")) return; const result = await api().rechnungBookDraft?.(this.current.id, this._payload()); if (!result?.ok) return this._error(result?.error); this.current = result.data; this._open(result.data); this.message.textContent = `Rechnung ${result.data.invoice_number} wurde gebucht.`; await this._refreshList(); }
  async _showPreview() { if ((await this.draftSaveChain) === false) return; const result = await api().rechnungPreviewDraft?.(this.current.id, this.current.status === "DRAFT" ? this._payload() : null); if (!result?.ok) return this._error(result?.error); const invoice = result.data; const draftLines = invoice.status === "DRAFT" ? [`Kennung: ${draftPreviewIdentifier(invoice.id)}`, "Diese Kennung ist keine Rechnungsnummer."] : []; this.previewBody.textContent = [`PROBERECHNUNG${invoice.status === "DRAFT" ? " · ENTWURF" : ""}`, ...draftLines, formatDocumentType(invoice), invoice.invoice_number ? `Rechnungs-Nr.: ${invoice.invoice_number}` : "Rechnungs-Nr.: wird erst bei Buchung vergeben", invoice.service_reference || "Ohne Leistungsbezug", `Rechnungsdatum: ${invoice.invoice_date}`, `Fällig am: ${invoice.due_date}`].join("\n"); this.preview.hidden = false; }
  async _refreshList() { const listManagement = api().rechnungListManagement || api().rechnungList; const result = await listManagement?.(); if (result?.ok) { this.invoices = result.list || []; this._renderList(); } }
  _close() { this.editor.hidden = true; this.preview.hidden = true; this.overview.hidden = false; this.current = null; }
  destroy() { this._textLimitUnsubscribe?.(); this._textLimitUnsubscribe = null; }
  _error(message) { this.message.textContent = message || "Aktion fehlgeschlagen."; this.message.dataset.tone = "error"; }
  _overviewMessage(message) { this.list.replaceChildren(node("div", "rechnung-live-message", message || "Aktion fehlgeschlagen.")); }
}
