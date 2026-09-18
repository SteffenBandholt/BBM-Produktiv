import { addCalendarDays, draftPreviewIdentifier, formatDocumentType } from "../../../../shared/rechnung/invoiceHeaderRules.mjs";
import { calculateInvoiceTotalsCents, calculatePositionInputPriceCents, calculatePositionTotalCents, normalizeInvoicePositions, POSITION_TYPES, PRICE_INPUT_MODES } from "../../../../shared/rechnung/rechnungPositions.mjs";
import { m80EditorAttributes } from "../../../ui-editor/m80Registry.js";
import { beginM83ComponentBinding, completeM80PilotRender, registerM80Ref } from "../../../ui-editor/m80Refs.js";
import { ensureRechnungenDesignStyles } from "../styles.js";
import { RECHNUNG_COMPONENT_ID, RECHNUNG_SCOPE_ID } from "../RechnungScreen.uiEditorContract.js";
import { formatCatalogVatRate } from "../masterDataCatalogFormat.mjs";

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
export function issuerInformation(value = {}) {
  const source = value || {};
  const sourceAddress = source.address || source;
  const sourceBank = source.bank || source;
  const sourceLegal = source.legal || source;
  const vatId = text(source.vatId || source.vat_id);
  const taxNumber = text(source.taxNumber || source.tax_number);
  const iban = text(sourceBank.iban);
  const bic = text(sourceBank.bic);
  const nameLines = [text(source.companyName || source.legalName || source.name), text(source.companyName2 || source.additionalName || source.name2)].filter(Boolean);
  const addressLines = [text(sourceAddress.street), [text(sourceAddress.zip), text(sourceAddress.city)].filter(Boolean).join(" ")].filter(Boolean);
  const register = text(sourceLegal.commercialRegister || source.commercial_register);
  const registerNumber = text(sourceLegal.registerNumber || source.register_number);
  const managingDirector = text(sourceLegal.managingDirector || source.managing_director);
  return Object.freeze({ nameLines, addressLines, taxRow: vatId ? Object.freeze({ label: "USt-IdNr.", value: vatId }) : taxNumber ? Object.freeze({ label: "Steuernr.", value: taxNumber }) : null, bankRows: Object.freeze([...(iban ? [{ label: "IBAN", value: iban }] : []), ...(bic ? [{ label: "BIC", value: bic }] : [])]), footerLines: Object.freeze([[...nameLines, ...addressLines].join(" · "), [vatId && `USt-IdNr. ${vatId}`, taxNumber && `Steuernr. ${taxNumber}`, iban && `IBAN ${iban}`, bic && `BIC ${bic}`].filter(Boolean).join(" · "), [register, registerNumber && `Registernr. ${registerNumber}`, managingDirector && `Geschäftsführer ${managingDirector}`].filter(Boolean).join(" · ")].filter(Boolean)) });
}
function customerKey(value = {}) { return `${value.kind || value.ref?.kind}:${value.id || value.ref?.id}`; }
function money(cents) { return `${(Number(cents || 0) / 100).toFixed(2).replace(".", ",")} EUR`; }
export function formatEuroCents(cents) { return `${GERMAN_EURO_AMOUNT_FORMATTER.format(Number(cents || 0) / 100)} €`; }
function formatDate(value) { const [year, month, day] = String(value || "").split("-"); return year && month && day ? `${day}.${month}.${year}` : ""; }
function formatMonth(value) { const [year, month] = String(value || "").split("-"); const names = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]; return year && names[Number(month) - 1] ? `${names[Number(month) - 1]} ${year}` : ""; }
function text(value) { return String(value || "").trim(); }
export const QUANTITY_DECIMAL_PLACES = Object.freeze([0, 1, 2, 3, 4]);
export const DEFAULT_QUANTITY_DECIMAL_PLACES = 2;
export function normalizeQuantityDecimalPlaces(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && QUANTITY_DECIMAL_PLACES.includes(parsed) ? parsed : DEFAULT_QUANTITY_DECIMAL_PLACES;
}
export function isQuantityInputAllowed(value, decimalPlaces) {
  const places = normalizeQuantityDecimalPlaces(decimalPlaces);
  const input = String(value ?? "");
  if (!input) return true;
  return places === 0 ? /^\d+$/.test(input) : new RegExp(`^\\d+(?:[,.]\\d{0,${places}})?$`).test(input);
}
function formatQuantity(value, decimalPlaces, useGrouping) {
  const places = normalizeQuantityDecimalPlaces(decimalPlaces);
  const parsed = Number(String(value ?? "").trim().replace(",", "."));
  return new Intl.NumberFormat("de-DE", {
    useGrouping,
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  }).format(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
}
export function formatQuantityForInput(value, decimalPlaces) { return formatQuantity(value, decimalPlaces, false); }
export function formatQuantityForDisplay(value, decimalPlaces) { return formatQuantity(value, decimalPlaces, true); }
export function parseInvoiceQuantityInput(value) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,4})?$/.test(normalized)) throw new Error("Bitte eine gueltige Menge mit maximal vier Nachkommastellen eingeben.");
  return String(Number(normalized));
}
export function parseInvoicePriceCents(value) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error("Bitte einen gueltigen Einzelpreis mit maximal zwei Nachkommastellen eingeben.");
  const cents = Math.round(Number(normalized) * 100);
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error("Bitte einen gueltigen Einzelpreis eingeben.");
  return cents;
}
export function resolveInvoicePositionInsertion(positions = [], selectedPositionId = null) {
  const list = Array.isArray(positions) ? positions : [];
  const selectedIndex = list.findIndex((entry) => entry.id === selectedPositionId);
  const selected = selectedIndex >= 0 ? list[selectedIndex] : null;
  const rootTitles = list.filter((entry) => entry.is_title && !entry.parent_id);
  const afterTitle = (title) => {
    let index = list.findIndex((entry) => entry.id === title.id) + 1;
    while (index < list.length && list[index].parent_id === title.id) index += 1;
    return index;
  };
  if (selected) {
    if (selected.is_title && !selected.parent_id) return Object.freeze({ index: afterTitle(selected), parentId: selected.id });
    if (selected.parent_id) return Object.freeze({ index: selectedIndex + 1, parentId: selected.parent_id });
    if (selected.type === POSITION_TYPES.SERVICE && rootTitles.length) return Object.freeze({ blocked: true, reason: "Leistungen ohne Titel koennen nicht mit Titeln gemischt werden." });
    if (selected.type === POSITION_TYPES.SERVICE) return Object.freeze({ index: selectedIndex + 1, parentId: null });
    return Object.freeze({ blocked: true, reason: "Weitere Unterebenen sind nicht freigegeben." });
  }
  if (rootTitles.length) {
    const lastTitle = rootTitles[rootTitles.length - 1];
    return Object.freeze({ index: afterTitle(lastTitle), parentId: lastTitle.id });
  }
  return Object.freeze({ index: list.length, parentId: null });
}
export function insertInvoicePositionCopies(positions, copies, selectedPositionId = null) {
  const target = resolveInvoicePositionInsertion(positions, selectedPositionId);
  if (target.blocked) return Object.freeze({ ok: false, error: target.reason, positions: [...positions] });
  const inserted = copies.map((entry) => ({ ...entry, parent_id: target.parentId }));
  const next = [...positions];
  next.splice(target.index, 0, ...inserted);
  return Object.freeze({ ok: true, positions: next, insertedIds: Object.freeze(inserted.map((entry) => entry.id)), parentId: target.parentId });
}
export function copyCatalogEntryToInvoicePosition(entry, id) {
  return {
    id,
    type: POSITION_TYPES.SERVICE,
    is_title: false,
    parent_id: null,
    short_text: text(entry?.shortText) || "(ohne Bezeichnung)",
    long_text: text(entry?.longText),
    quantity: "1",
    unit: text(entry?.unit),
    unit_price_cents: Number(entry?.unitPriceCents || 0),
    is_nep: false,
    vat_rate_percent: Number(entry?.vatRatePercent ?? 19),
    price_input_mode: PRICE_INPUT_MODES.NET,
    price_input_cents: null,
  };
}
export { draftPreviewIdentifier };

export default class RechnungScreen {
  constructor({ router = null } = {}) { this.invoices = []; this.customers = []; this.projects = []; this.positions = []; this.selectedPositionId = null; this.positionCreateParentId = null; this.positionSequence = 0; this.isPositionMoveMode = false; this.hiddenLongTextPositionIds = new Set(); this.catalogPickerSelection = new Set(); this.quantityDecimalPlaces = DEFAULT_QUANTITY_DECIMAL_PLACES; this.current = null; this.root = null; this.router = router; this.draftSaveChain = Promise.resolve(true); }

  render() {
    ensureRechnungenDesignStyles();
    beginM83ComponentBinding(RECHNUNG_COMPONENT_ID);
    const root = bind(node("section", "bbm-invoice-design bbm-popup-standard bbm-rechnung-live"), RECHNUNG_SCOPE_ID);
    root.dataset.invoiceLiveScreen = "step-2";
    const content = bind(node("div", "rechnung-live-content"), "rechnung.screen.content");
    content.append(this._overview(), this._catalog(), this._editor(), this._catalogPicker(), this._preview());
    root.append(content); this.root = root;
    completeM80PilotRender();
    this._setEditorSidebarState(false);
    void this._load();
    return root;
  }

  _overview() {
    const overview = bind(node("section", "rechnung-live-overview"), "rechnung.overview");
    const header = bind(node("header", "invoice-page-header"), "rechnung.overview.header");
    const heading = node("div", "invoice-page-heading");
    heading.append(bind(node("h1", "invoice-page-title", "Rechnungen"), "rechnung.overview.title"), bind(node("p", "invoice-page-subtitle", "Rechnungsgrunddaten und Belegköpfe"), "rechnung.overview.subtitle"));
    header.append(heading, button("Leistungskatalog", "rechnung.overview.catalog", () => void this._openCatalog()), button("Freie Rechnung", "rechnung.overview.new", () => void this._newDraft(), "primary"));
    this.list = bind(node("div", "rechnung-live-list"), "rechnung.overview.list");
    overview.append(header, this.list); this.overview = overview; return overview;
  }

  _editor() {
    return this._sheetEditor();
  }

  _catalogField(label, id, tag = "input") {
    const input = control(tag, id); if (tag === "textarea") input.rows = 3;
    return { input, wrapper: field(label, input) };
  }

  _catalog() {
    const area = bind(node("section", "rechnung-catalog"), "rechnung.catalog"); area.hidden = true;
    const header = bind(node("header", "invoice-page-header"), "rechnung.catalog.header");
    header.append(bind(node("h1", "invoice-page-title", "Leistungskatalog"), "rechnung.catalog.title"), button("Schließen", "rechnung.catalog.close", () => this._closeCatalog()));
    const catalog = bind(node("section", "rechnung-catalog-form"), "rechnung.catalog.form");
    this.catalogSelect = control("select", "rechnung.catalog.select"); this.catalogSelect.onchange = () => this._selectCatalogEntry();
    this.catalogInputs = {}; const catalogGrid = node("div", "rechnung-catalog-grid");
    [["shortText", "Kurztext", "input"], ["longText", "Langtext", "textarea"], ["unit", "Einheit" , "input"], ["unitPrice", "Einzelpreis (EUR)", "input"], ["vatRate", "MwSt.", "input"]].forEach(([key, label, tag]) => { const result = this._catalogField(label, `rechnung.catalog.${key}`, tag); this.catalogInputs[key] = result.input; catalogGrid.append(result.wrapper); });
    this.catalogInputs.vatRate.readOnly = true;
    catalog.append(field("Katalogleistung", this.catalogSelect), catalogGrid, button("Neue Katalogleistung", "rechnung.catalog.create", () => this._newCatalogEntry()), button("Katalogleistung speichern", "rechnung.catalog.save", () => void this._saveCatalogEntry(), "primary"));
    this.catalogMessage = node("div", "rechnung-live-message"); area.append(header, catalog, this.catalogMessage); this.catalog = area; return area;
  }

  async _openCatalog() { this.overview.hidden = true; this.catalog.hidden = false; await this._loadCatalog(); }
  _closeCatalog() { this.catalog.hidden = true; this.overview.hidden = false; }
  async _loadCatalog() {
    const [catalog, catalogDefaults] = await Promise.all([api().rechnungCatalogList?.(), api().rechnungCatalogDefaults?.()]);
    if (!catalog?.ok || !catalogDefaults?.ok) return this._catalogError(catalog?.error || catalogDefaults?.error);
    this.catalogEntries = catalog.list || [];
    this.catalogVatRatePercent = catalogDefaults.data?.vatRatePercent;
    this._renderCatalogOptions(); this.catalogMessage.textContent = "";
  }
  _renderCatalogOptions(selectedId = "") { this.catalogSelect.replaceChildren(option("", "Katalogleistung wählen"), ...(this.catalogEntries || []).map((entry) => option(entry.id, entry.shortText))); this.catalogSelect.value = selectedId; this._selectCatalogEntry(); }
  _selectCatalogEntry() { const entry = (this.catalogEntries || []).find((value) => value.id === this.catalogSelect.value); this.catalogInputs.shortText.value = entry?.shortText || ""; this.catalogInputs.longText.value = entry?.longText || ""; this.catalogInputs.unit.value = entry?.unit || ""; this.catalogInputs.unitPrice.value = entry ? (entry.unitPriceCents / 100).toFixed(2).replace(".", ",") : ""; try { this.catalogInputs.vatRate.value = formatCatalogVatRate(entry, this.catalogVatRatePercent); } catch (error) { this.catalogInputs.vatRate.value = ""; this._catalogError(error.message); } }
  _newCatalogEntry() { this.catalogSelect.value = ""; this._selectCatalogEntry(); this.catalogInputs.shortText.focus(); }
  async _saveCatalogEntry() { const price = Number(String(this.catalogInputs.unitPrice.value).replace(",", ".")); if (!Number.isFinite(price) || price < 0) return this._catalogError("Bitte einen gültigen Einzelpreis eingeben."); const entry = { shortText: this.catalogInputs.shortText.value, longText: this.catalogInputs.longText.value, unit: this.catalogInputs.unit.value, unitPriceCents: Math.round(price * 100) }; const id = this.catalogSelect.value; const result = id ? await api().rechnungCatalogUpdate?.(id, entry) : await api().rechnungCatalogCreate?.(entry); if (!result?.ok) return this._catalogError(result?.error); const list = await api().rechnungCatalogList?.(); this.catalogEntries = list?.ok ? list.list || [] : this.catalogEntries; this._renderCatalogOptions(result.entry.id); this.catalogMessage.textContent = "Katalogleistung gespeichert."; }
  _catalogError(message) { this.catalogMessage.textContent = message || "Aktion fehlgeschlagen."; this.catalogMessage.dataset.tone = "error"; }

  _catalogPicker() {
    const picker = bind(node("section", "rechnung-catalog-picker"), "rechnung.catalogPicker");
    picker.hidden = true; picker.setAttribute("role", "dialog"); picker.setAttribute("aria-modal", "true");
    const dialog = node("div", "rechnung-catalog-picker__dialog");
    const header = bind(node("header", "rechnung-catalog-picker__header"), "rechnung.catalogPicker.header");
    header.append(bind(node("h2", "invoice-page-title", "Aus Leistungskatalog"), "rechnung.catalogPicker.title"));
    this.catalogPickerSearch = control("input", "rechnung.catalogPicker.search", "search");
    this.catalogPickerSearch.placeholder = "Kurztext, Langtext oder Einheit";
    this.catalogPickerSearch.addEventListener("input", () => this._renderCatalogPickerResults());
    this.catalogPickerResults = bind(node("div", "rechnung-catalog-picker__results"), "rechnung.catalogPicker.results");
    this.catalogPickerStatus = bind(node("div", "rechnung-catalog-picker__status", "0 Leistungen ausgewählt"), "rechnung.catalogPicker.selectionStatus");
    this.catalogPickerStatus.setAttribute("role", "status");
    const footer = bind(node("footer", "rechnung-catalog-picker__footer"), "rechnung.catalogPicker.footer");
    this.catalogPickerCancel = button("Abbrechen", "rechnung.catalogPicker.cancel", () => this._closeCatalogPicker());
    this.catalogPickerAccept = button("Auswahl übernehmen", "rechnung.catalogPicker.accept", () => this._acceptCatalogSelection(), "primary");
    footer.append(this.catalogPickerCancel, this.catalogPickerAccept);
    dialog.append(header, field("Leistungen suchen", this.catalogPickerSearch), this.catalogPickerResults, this.catalogPickerStatus, footer);
    picker.append(dialog); this.catalogPicker = picker; return picker;
  }

  async _openCatalogPicker() {
    if (!this._isFreeDraft()) return this._error("Katalogleistungen koennen nur in freie Entwuerfe uebernommen werden.");
    const result = await api().rechnungCatalogList?.();
    if (!result?.ok) return this._error(result?.error || "Leistungskatalog konnte nicht geladen werden.");
    this.catalogEntries = result.list || [];
    this.catalogPickerSelection.clear();
    this.catalogPickerSearch.value = "";
    this._renderCatalogPickerResults();
    this.catalogPicker.hidden = false;
    this.catalogPickerSearch.focus?.();
  }

  _closeCatalogPicker() {
    if (!this.catalogPicker) return;
    this.catalogPicker.hidden = true;
    this.catalogPickerSelection.clear();
    this._renderCatalogPickerStatus();
  }

  _renderCatalogPickerStatus() {
    const count = this.catalogPickerSelection.size;
    this.catalogPickerStatus.textContent = `${count} ${count === 1 ? "Leistung" : "Leistungen"} ausgewählt`;
    this.catalogPickerAccept.disabled = count === 0;
  }

  _renderCatalogPickerResults() {
    if (!this.catalogPickerResults) return;
    const query = text(this.catalogPickerSearch?.value).toLocaleLowerCase("de-DE");
    const entries = (this.catalogEntries || []).filter((entry) => !query || [entry.shortText, entry.longText, entry.unit].some((value) => String(value || "").toLocaleLowerCase("de-DE").includes(query)));
    this.catalogPickerResults.replaceChildren();
    if (!entries.length) this.catalogPickerResults.append(node("div", "invoice-empty", "Keine passende Katalogleistung gefunden."));
    for (const entry of entries) {
      const row = node("label", "rechnung-catalog-picker__row");
      const checkbox = node("input"); checkbox.type = "checkbox"; checkbox.checked = this.catalogPickerSelection.has(entry.id);
      checkbox.addEventListener("change", () => { if (checkbox.checked) this.catalogPickerSelection.add(entry.id); else this.catalogPickerSelection.delete(entry.id); this._renderCatalogPickerStatus(); });
      const content = node("span", "rechnung-catalog-picker__row-content");
      content.append(node("strong", "", entry.shortText), node("span", "", [entry.longText, entry.unit, formatEuroCents(entry.unitPriceCents)].filter(Boolean).join(" | ")));
      row.append(checkbox, content); this.catalogPickerResults.append(row);
    }
    this._renderCatalogPickerStatus();
  }

  _acceptCatalogSelection() {
    if (!this._isFreeDraft()) return this._error("Katalogleistungen koennen nur in freie Entwuerfe uebernommen werden.");
    const selected = (this.catalogEntries || []).filter((entry) => this.catalogPickerSelection.has(entry.id));
    if (!selected.length) return;
    const copies = selected.map((entry) => copyCatalogEntryToInvoicePosition(entry, this._nextPositionId()));
    const insertion = insertInvoicePositionCopies(this.positions, copies, this.selectedPositionId);
    if (!insertion.ok) return this._error(insertion.error);
    this.positions = insertion.positions;
    this._normalizePositions();
    this._selectPosition(this.positions.find((entry) => entry.id === insertion.insertedIds[insertion.insertedIds.length - 1]), { setCreateContext: false });
    this._setPositionCreateParentId(insertion.parentId);
    this._closeCatalogPicker();
    this._renderPositions();
    void this._queueDraftSave();
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

    const sheetArea = bind(node("section", "rechnung-screen__sheet-area"), "rechnung.editor.sheetArea"); this.sheetArea = sheetArea;
    const sheetCanvas = bind(node("div", "rechnung-screen__sheet-canvas"), "rechnung.editor.sheetCanvas"); this.sheetCanvas = sheetCanvas;
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
    context.append(field("Bauvorhaben", this.constructionProject, "rechnung-sheet__construction-project"), field("Betreff", this.reference, "invoice-field--wide"), field("Projektbezug", this.project, "rechnung-sheet__project-reference"), field("Herkunft", this.source, "rechnung-sheet__source"));
    this.introText = control("textarea", "rechnung.editor.introText"); this.introText.maxLength = 4000; this.introText.placeholder = "Optionaler Einleitungstext";
    details.append(context, field("Freitext", this.introText, "invoice-field--wide rechnung-sheet__intro"));
    this.headContent.append(sheetHead, details);

    const positions = bind(node("section", "rechnung-live-positions rechnung-sheet__positions"), "rechnung.editor.positions");
    const positionToolbar = bind(node("div", "rechnung-position-toolbar"), "rechnung.editor.positionToolbar");
    this.positionCreateTitleButton = button("Titel anlegen", "rechnung.editor.positionCreateTitle", () => this._createTitle());
    this.positionCreateButton = button("Freie Position", "rechnung.editor.positionCreateFree", () => this._createPosition());
    this.positionCatalogButton = button("Aus Leistungskatalog", "rechnung.editor.positionCatalogOpen", () => void this._openCatalogPicker());
    this.positionMoveButton = button("Position verschieben", "rechnung.editor.positionMove", () => this._togglePositionMove());
    this.positionDeleteButton = button("Position löschen", "rechnung.editor.positionDelete", () => this._deletePosition());
    positionToolbar.append(this.positionCreateTitleButton, this.positionCreateButton, this.positionCatalogButton, this.positionMoveButton, this.positionDeleteButton);
    this.positionsList = bind(node("div", "rechnung-live-positions__list rechnung-lv-list"), "rechnung.editor.positions.list");
    const positionDetails = bind(node("section", "rechnung-position-details"), "rechnung.editor.positionDetails");
    this.positionDetailsTitle = bind(node("h3", "rechnung-position-details__title", "Positionsdetails"), "rechnung.editor.positionDetails.title");
    this.positionLongToggleButton = button("Langtext ausblenden", "rechnung.editor.positionLongToggle", () => this._toggleSelectedLongText(), "quiet");
    const detailsHeader = node("header", "rechnung-position-details__header"); detailsHeader.append(this.positionDetailsTitle, this.positionLongToggleButton);
    this.positionShort = control("input", "rechnung.editor.positionShort", "text");
    this.positionLong = control("textarea", "rechnung.editor.positionLong"); this.positionLong.rows = 4;
    this.positionQuantity = control("input", "rechnung.editor.positionQuantity", "text"); this.positionQuantity.inputMode = "decimal";
    this.positionUnit = control("input", "rechnung.editor.positionUnit", "text");
    this.positionPrice = control("input", "rechnung.editor.positionPrice", "text"); this.positionPrice.inputMode = "decimal";
    this.positionVatRate = control("input", "rechnung.editor.positionVatRate", "text"); this.positionVatRate.readOnly = true;
    this.positionNep = control("input", "rechnung.editor.positionNep", "checkbox");
    this.positionDetailFields = {
      short: field("Kurztext", this.positionShort, "invoice-field--wide"),
      long: field("Langtext", this.positionLong, "invoice-field--wide"),
      quantity: field("Menge", this.positionQuantity),
      unit: field("Einheit", this.positionUnit),
      price: field("Einzelpreis (EUR)", this.positionPrice),
      vat: field("Mehrwertsteuer", this.positionVatRate),
      nep: field("NEP", this.positionNep, "rechnung-position-details__nep"),
    };
    const detailsGrid = node("div", "rechnung-position-details__grid"); detailsGrid.append(...Object.values(this.positionDetailFields));
    positionDetails.append(detailsHeader, detailsGrid); this.positionDetails = positionDetails;
    const updatePosition = () => this._updateSelectedPositionFromDetails();
    [this.positionShort, this.positionLong, this.positionUnit].forEach((element) => { element.addEventListener("input", updatePosition); element.addEventListener("change", updatePosition); });
    [this.positionQuantity, this.positionPrice, this.positionNep].forEach((element) => element.addEventListener("change", updatePosition));
    positions.append(positionToolbar, this.positionsList, positionDetails);

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
    editor.append(headerCanvas, sheetArea, this.message, footer); this.editor = editor;
    const syncAndSave = () => { this._syncDerived(); this._updatePaymentText(); void this._queueDraftSave(); };
    [this.source, this.documentType, this.installmentNumber, this.invoiceDate, this.serviceType, this.serviceDate, this.serviceMonth, this.serviceStart, this.serviceEnd, this.reference, this.constructionProject, this.project, this.introText, this.paymentTerm].forEach((element) => {
      element.addEventListener("change", syncAndSave);
      element.addEventListener("input", syncAndSave);
    });
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
    const [invoices, customers, projects, organization] = await Promise.all([api().rechnungList?.(), api().rechnungListCustomers?.(), api().rechnungListProjects?.(), api().ownOrganizationGet?.()]);
    this.invoices = invoices?.ok ? invoices.list || [] : [];
    this.customers = customers?.ok ? customers.list || [] : [];
    this.projects = projects?.ok ? projects.list || [] : [];
    this.ownOrganization = organization?.ok ? organization.organization || null : null;
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
    this._closeCatalogPicker(); this.hiddenLongTextPositionIds.clear();
    this._setEditorSidebarState(true);
    this.source.value = invoice.source_type || "FREE"; this.documentType.value = invoice.document_type || "INVOICE"; this.installmentNumber.value = invoice.installment_number || "";
    this.invoiceNumber.value = invoice.invoice_number || "wird bei Buchung vergeben"; this.invoiceDate.value = invoice.invoice_date || "";
    this.serviceType.value = invoice.service_period_type || "SINGLE_DATE"; this.serviceDate.value = invoice.service_date || ""; this.serviceMonth.value = invoice.service_period_start?.slice(0, 7) || ""; this.serviceStart.value = invoice.service_period_start || ""; this.serviceEnd.value = invoice.service_period_end || "";
    this.reference.value = invoice.service_reference || ""; this.constructionProject.value = invoice.construction_project || ""; if (this.introText) this.introText.value = invoice.intro_text || ""; this.positions = (invoice.positions || []).map((entry) => ({ ...entry })); this._normalizePositions(); this._clearPositionSelection(); this._renderPositions(); this.paymentTerm.value = String(invoice.payment_term_days ?? 8); this.dueDate.value = invoice.due_date || "";
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
  _normalizePositions() { if (this.current?.order_binding_state === "BOUND") return; this.positions = [...normalizeInvoicePositions(this.positions, { idFactory: () => this._nextPositionId() })]; }
  _setPositionCreateParentId(positionId) { this.positionCreateParentId = positionId || null; }
  _getSelectedPosition() { return this.positions.find((entry) => entry.id === this.selectedPositionId) || null; }
  _isFreeDraft() { return this.current?.status === "DRAFT" && this.current?.order_binding_state !== "BOUND" && this.source?.value === "FREE"; }
  _resolvePositionCreateParent() {
    return resolveInvoicePositionInsertion(this.positions, this.selectedPositionId);
  }
  _orderedPositions() {
    if (this.current?.order_binding_state === "BOUND") return [...this.positions];
    const children = new Map();
    for (const entry of this.positions) { const parentId = entry.parent_id || null; if (!children.has(parentId)) children.set(parentId, []); children.get(parentId).push(entry); }
    const ordered = [];
    const visit = (entry) => { ordered.push(entry); for (const child of children.get(entry.id) || []) visit(child); };
    for (const root of children.get(null) || []) visit(root);
    return ordered;
  }
  _positionDepth(entry) { let depth = 0; let current = entry; const seen = new Set(); while (current?.parent_id && !seen.has(current.parent_id)) { seen.add(current.parent_id); current = this.positions.find((item) => item.id === current.parent_id) || null; depth += 1; } return depth; }
  _clearPositionSelection() { this.selectedPositionId = null; this._setPositionCreateParentId(null); this.isPositionMoveMode = false; }
  _selectPosition(entry, { setCreateContext = true } = {}) { if (!entry) return; this.selectedPositionId = entry.id; if (setCreateContext) this._setPositionCreateParentId(entry.id); }
  _createTitle() {
    if (!this._isFreeDraft()) return this._error("Titel sind nur in freien Entwuerfen verfuegbar.");
    if (this.positions.some((entry) => entry.type === POSITION_TYPES.SERVICE && !entry.parent_id)) return this._error("Ein Titel kann nicht angelegt werden, solange Leistungen ohne Titel vorhanden sind.");
    this._createPositionEntry({ type: POSITION_TYPES.HEADING, is_title: true, parent_id: null });
  }
  _createPosition() {
    if (!this._isFreeDraft()) return this._error("Positionen sind nur in freien Entwuerfen verfuegbar.");
    this._createPositionEntry({ type: POSITION_TYPES.SERVICE, is_title: false, parent_id: null });
  }
  _createPositionEntry({ type, is_title }) {
    const id = this._nextPositionId();
    const entry = { id, type, is_title, parent_id: null, short_text: is_title ? "(neuer Titel)" : "(ohne Bezeichnung)", long_text: "", quantity: "1", unit: "", unit_price_cents: 0, is_nep: false, vat_rate_percent: is_title ? null : 19, price_input_mode: is_title ? null : PRICE_INPUT_MODES.NET, price_input_cents: null };
    if (is_title) this.positions = [...this.positions, entry];
    else {
      const insertion = insertInvoicePositionCopies(this.positions, [entry], this.selectedPositionId);
      if (!insertion.ok) return this._error(insertion.error);
      this.positions = insertion.positions;
      this._setPositionCreateParentId(insertion.parentId);
    }
    this._normalizePositions();
    const created = this.positions.find((position) => position.id === id);
    this._selectPosition(created, { setCreateContext: false });
    this._renderPositions();
    void this._queueDraftSave();
  }
  _deletePosition() { if (!this._isFreeDraft()) return; const selected = this._getSelectedPosition(); if (!selected) return; if (this.positions.some((entry) => entry.parent_id === selected.id)) return this._error("Titel mit Unterpositionen koennen nicht geloescht werden."); this.positions = this.positions.filter((entry) => entry.id !== selected.id); this._clearPositionSelection(); this._renderPositions(); void this._queueDraftSave(); }
  _togglePositionMove() { const selected = this._getSelectedPosition(); if (!this._isFreeDraft() || !selected || selected.is_title) return; this.isPositionMoveMode = !this.isPositionMoveMode; this._renderPositions(); }
  _isPositionDescendant(entryId, ancestorId) { let current = this.positions.find((entry) => entry.id === entryId) || null; const seen = new Set(); while (current?.parent_id && !seen.has(current.parent_id)) { if (current.parent_id === ancestorId) return true; seen.add(current.parent_id); current = this.positions.find((entry) => entry.id === current.parent_id) || null; } return false; }
  _isPositionMoveTarget(target, moving = this._getSelectedPosition()) { if (!moving || moving.id === target.id || moving.is_title || this._isPositionDescendant(target.id, moving.id)) return false; if (target.is_title && !target.parent_id) return true; return (target.parent_id || null) === (moving.parent_id || null); }
  _handlePositionRowClick(entry) { if (this.isPositionMoveMode) { if (this._isPositionMoveTarget(entry)) this._moveSelectedPositionTo(entry); return; } this._selectPosition(entry); this._renderPositions(); }
  _moveSelectedPositionTo(target) { const moving = this._getSelectedPosition(); if (!this._isFreeDraft() || !this._isPositionMoveTarget(target, moving)) return; const next = this.positions.filter((entry) => entry.id !== moving.id); const moved = { ...moving, parent_id: target.is_title ? target.id : target.parent_id || null }; let index; if (target.is_title) { index = next.reduce((last, entry, currentIndex) => entry.parent_id === target.id ? currentIndex + 1 : last, next.findIndex((entry) => entry.id === target.id) + 1); } else index = next.findIndex((entry) => entry.id === target.id); next.splice(index < 0 ? next.length : index, 0, moved); this.positions = next; this._normalizePositions(); this.isPositionMoveMode = false; this._setPositionCreateParentId(moved.parent_id); this._selectPosition(this.positions.find((entry) => entry.id === moved.id), { setCreateContext: false }); this._renderPositions(); void this._queueDraftSave(); }
  _moveSelectedPositionToRoot() { const moving = this._getSelectedPosition(); if (!moving || moving.is_title || !moving.parent_id || !this._isFreeDraft()) return; if (this.positions.some((entry) => entry.is_title && !entry.parent_id)) return this._error("Leistungen ohne Titel koennen nicht mit Titeln gemischt werden."); const next = this.positions.filter((entry) => entry.id !== moving.id); const moved = { ...moving, parent_id: null }; next.push(moved); this.positions = next; this._normalizePositions(); this.isPositionMoveMode = false; this._setPositionCreateParentId(null); this._selectPosition(this.positions.find((entry) => entry.id === moved.id), { setCreateContext: false }); this._renderPositions(); void this._queueDraftSave(); }
  _toggleSelectedLongText() {
    const selected = this._getSelectedPosition();
    if (!selected) return;
    if (this.hiddenLongTextPositionIds.has(selected.id)) this.hiddenLongTextPositionIds.delete(selected.id);
    else this.hiddenLongTextPositionIds.add(selected.id);
    this._renderPositions();
  }

  _updateSelectedPositionFromDetails() {
    const selected = this._getSelectedPosition();
    if (!selected || !this._isFreeDraft()) return;
    try {
      const shortText = text(this.positionShort.value);
      if (!shortText) throw new Error("Bitte einen Kurztext eingeben.");
      const updated = { ...selected, short_text: shortText, long_text: this.positionLong.value };
      if (selected.type === POSITION_TYPES.SERVICE) {
        updated.quantity = parseInvoiceQuantityInput(this.positionQuantity.value);
        updated.unit = this.positionUnit.value;
        const priceCents = parseInvoicePriceCents(this.positionPrice.value);
        updated.is_nep = Boolean(this.positionNep.checked);
        if (selected.price_input_mode === PRICE_INPUT_MODES.GROSS) updated.price_input_cents = priceCents;
        else updated.unit_price_cents = priceCents;
      }
      const next = this.positions.map((entry) => entry.id === selected.id ? updated : entry);
      this.positions = [...normalizeInvoicePositions(next, { idFactory: () => this._nextPositionId() })];
      if (this.message) { this.message.textContent = ""; this.message.dataset.tone = ""; }
      this._renderPositions();
      void this._queueDraftSave();
    } catch (error) {
      this._error(error?.message || "Position konnte nicht geaendert werden.");
    }
  }

  _syncPositionDetails() {
    if (!this.positionDetails) return;
    const selected = this._getSelectedPosition();
    this.positionDetails.hidden = !selected;
    if (!selected) return;
    const isService = selected.type === POSITION_TYPES.SERVICE;
    this.positionDetailsTitle.textContent = `${selected.is_title ? "Titel" : "Position"} ${selected.position_number || ""} bearbeiten`.trim();
    this.positionShort.value = selected.short_text || "";
    this.positionLong.value = selected.long_text || "";
    this.positionQuantity.value = isService ? formatQuantityForInput(selected.quantity, this.quantityDecimalPlaces) : "";
    this.positionUnit.value = isService ? selected.unit || "" : "";
    this.positionPrice.value = isService ? (calculatePositionInputPriceCents(selected) / 100).toFixed(2).replace(".", ",") : "";
    this.positionVatRate.value = isService ? `${selected.vat_rate_percent ?? 19} %` : "";
    this.positionNep.checked = isService && Boolean(selected.is_nep);
    for (const key of ["quantity", "unit", "price", "vat", "nep"]) this.positionDetailFields[key].hidden = !isService;
    const editable = this._isFreeDraft();
    [this.positionShort, this.positionLong, this.positionQuantity, this.positionUnit, this.positionPrice, this.positionNep].forEach((element) => { element.disabled = !editable; });
    this.positionLongToggleButton.disabled = !selected.long_text;
    this.positionLongToggleButton.textContent = this.hiddenLongTextPositionIds.has(selected.id) ? "Langtext einblenden" : "Langtext ausblenden";
  }

  _syncPositionControls() {
    const selected = this._getSelectedPosition();
    const editable = this._isFreeDraft();
    if (this.positionCreateTitleButton) this.positionCreateTitleButton.disabled = !editable;
    if (this.positionCreateButton) this.positionCreateButton.disabled = !editable;
    if (this.positionCatalogButton) this.positionCatalogButton.disabled = !editable;
    if (this.positionDeleteButton) this.positionDeleteButton.disabled = !editable || !selected;
    if (this.positionMoveButton) {
      this.positionMoveButton.disabled = !editable || !selected || selected.is_title;
      this.positionMoveButton.textContent = this.isPositionMoveMode ? "Verschieben abbrechen" : "Position verschieben";
      this.positionMoveButton.setAttribute("aria-pressed", String(this.isPositionMoveMode));
    }
  }

  _renderPositions() { this._renderLvPositions(); this._syncPositionDetails(); this._syncPositionControls(); }

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
      select.append(node("span", "rechnung-lv-position__number", entry.position_origin === "CONTRACT" ? entry.position_number : entry.type === POSITION_TYPES.NOTE ? "Hinweis" : entry.type === POSITION_TYPES.HEADING && !entry.is_title ? "Text" : entry.position_number || ""), node("strong", "rechnung-lv-position__short", entry.short_text)); row.append(select);
      if (entry.long_text && !this.hiddenLongTextPositionIds.has(entry.id)) row.append(node("p", "rechnung-lv-position__long", entry.long_text));
      if (entry.type === POSITION_TYPES.SERVICE) {
        const quantity = entry.quantity === null || entry.quantity === undefined || entry.quantity === "" ? "" : formatQuantityForDisplay(entry.quantity, this.quantityDecimalPlaces);
        const pricing = node("div", "rechnung-lv-position__pricing");
        pricing.append(node("span", "", [quantity, entry.unit].filter(Boolean).join(" ") || "0"), node("span", "", formatEuroCents(entry.unit_price_cents)), node("strong", "", entry.is_nep ? "NEP" : formatEuroCents(amount)));
        row.append(pricing);
      }
      this.positionsList.append(row);
    });
    const totals = calculateInvoiceTotalsCents(orderedPositions); const vatRates = [...new Set(orderedPositions.filter((entry) => calculatePositionTotalCents(entry) != null).map((entry) => entry.vat_rate_percent))]; const vatLabel = vatRates.length === 1 ? `${vatRates[0]} % MwSt.` : "MwSt."; this.positionsTotal.textContent = money(totals.net_cents); this.invoiceVatLabel.textContent = vatLabel; this.invoiceVat.textContent = money(totals.vat_cents); this.invoiceTotal.textContent = money(totals.gross_cents);
  }

  _syncDerived() {
    const isPartial = this.documentType.value === "PARTIAL"; this.installmentNumber.closest("label").hidden = !isPartial;
    const type = this.serviceType.value; this.serviceFields.SINGLE_DATE.hidden = type !== "SINGLE_DATE"; this.serviceFields.MONTH.hidden = type !== "MONTH"; this.serviceFields.RANGE_START.hidden = type !== "RANGE"; this.serviceFields.RANGE_END.hidden = type !== "RANGE";
    try { this.dueDate.value = addCalendarDays(this.invoiceDate.value, Number(this.paymentTerm.value)); } catch { this.dueDate.value = ""; }
    this.title.textContent = formatDocumentType({ document_type: this.documentType.value, installment_number: Number(this.installmentNumber.value) || null });
    const customer = this.customers.find((entry) => customerKey(entry) === this.customer.value);
    const customerValue = this.current?.status === "BOOKED" ? this.current.customer_snapshot : customer || this.current?.legacy_customer;
    const issuerValue = this.current?.status === "BOOKED" ? this.current.issuer_snapshot : this.ownOrganization;
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
    [this.source, this.documentType, this.installmentNumber, this.customer, this.project, this.invoiceDate, this.serviceType, this.serviceDate, this.serviceMonth, this.serviceStart, this.serviceEnd, this.reference, this.constructionProject, this.introText, this.paymentTerm].filter(Boolean).forEach((element) => { element.disabled = booked; });
    if (this.current?.order_binding_state === "BOUND") [this.source, this.documentType, this.installmentNumber, this.customer, this.project, this.reference].filter(Boolean).forEach(element => { element.disabled = true; });
    if (this.customerPickerButton) this.customerPickerButton.disabled = booked || this.current?.order_binding_state === "BOUND";
    if (this.servicePeriodToggle) this.servicePeriodToggle.disabled = booked;
    this.bookButton.hidden = booked; this.deleteButton.hidden = booked;
    if (this.previewButton) {
      this.previewButton.textContent = !booked
        ? "Proberechnung"
        : this.current?.pdf_finalization_status === "READY"
          ? "PDF öffnen"
          : "PDF erneut erzeugen";
    }
    this._syncPositionDetails(); this._syncPositionControls();
  }

  _queueDraftSave() { if (this.current?.status !== "DRAFT" || typeof api().rechnungUpdateDraft !== "function") return Promise.resolve(true); const id = this.current.id; const payload = this._payload(); this.draftSaveChain = this.draftSaveChain.catch(() => false).then(async () => { const result = await api().rechnungUpdateDraft(id, payload); if (!result?.ok) { this._error(result?.error); return false; } if (this.current?.id === id) this.current = result.data; await this._refreshList(); return true; }); return this.draftSaveChain; }
  async _delete() { if (!globalThis.window?.confirm?.("Rechnungsentwurf wirklich verwerfen?")) return; const result = await api().rechnungDeleteDraft?.(this.current.id); if (!result?.ok) return this._error(result?.error); await this._refreshList(); this._close(); }
  async _book() { if ((await this.draftSaveChain) === false) return; if (!globalThis.window?.confirm?.("Rechnung jetzt verbindlich buchen? Danach ist sie nicht mehr bearbeitbar.")) return; const result = await api().rechnungBookDraft?.(this.current.id, this._payload()); if (!result?.ok) { if (result?.data?.status === "BOOKED") { this.current = result.data; this._open(result.data); await this._refreshList(); } return this._error(result?.error); } this.current = result.data; this._open(result.data); this.message.textContent = `Rechnung ${result.data.invoice_number} wurde gebucht und als finale PDF abgelegt.`; await this._refreshList(); }
  async _showPreview() { if ((await this.draftSaveChain) === false) return; if (this.current?.status === "BOOKED") { let invoice = this.current; if (invoice.pdf_finalization_status !== "READY") { const finalized = await api().rechnungFinalizePdf?.(invoice.id); if (!finalized?.ok) return this._error(finalized?.error); invoice = finalized.data; this.current = invoice; this._open(invoice); await this._refreshList(); } const opened = await api().rechnungOpenPdf?.(invoice.id); if (!opened?.ok) return this._error(opened?.error); this.message.textContent = `Finale PDF der Rechnung ${invoice.invoice_number} wurde geöffnet.`; return; } const result = await api().rechnungPreviewDraft?.(this.current.id, this._payload()); if (!result?.ok) return this._error(result?.error); const invoice = result.data; const identifier = invoice.preview_identifier || draftPreviewIdentifier(invoice.id); const draftLines = [`Kennung: ${identifier}`, "Diese Kennung ist keine Rechnungsnummer."]; this.previewBody.textContent = ["PROBERECHNUNG · ENTWURF", ...draftLines, formatDocumentType(invoice), "Rechnungs-Nr.: wird erst bei Buchung vergeben", invoice.service_reference || "Ohne Leistungsbezug", `Rechnungsdatum: ${invoice.invoice_date}`, `Fällig am: ${invoice.due_date}`].join("\n"); const printPreview = globalThis.window?.bbmPrint?.printPdfAndPreviewInternal; if (typeof printPreview !== "function") return this._error("PDF-Vorschau ist nicht verfügbar."); const pdf = await printPreview({ mode: "invoice", documentTypeId: "invoice", invoiceId: invoice.id, invoicePreview: true, orientation: "portrait", targetDir: "temp", fileName: `Proberechnung-${identifier}.pdf`, overwrite: true, previewTitle: `Proberechnung ${identifier}` }); if (!pdf?.ok) return this._error(pdf?.error); this.preview.hidden = false; this.message.textContent = `Proberechnung ${identifier} wurde geöffnet.`; }
  async _refreshList() { const result = await api().rechnungList?.(); if (result?.ok) { this.invoices = result.list || []; this._renderList(); } }
  _setEditorSidebarState(editorOpen) { this.router?._setSidebarVisibility?.(!editorOpen); }
  _close() { this._closeCatalogPicker(); this.editor.hidden = true; this.preview.hidden = true; this.overview.hidden = false; this.current = null; this._clearPositionSelection(); this._setEditorSidebarState(false); }
  destroy() { this._setEditorSidebarState(false); }
  _error(message) { this.message.textContent = message || "Aktion fehlgeschlagen."; this.message.dataset.tone = "error"; }
  _overviewMessage(message) { this.list.replaceChildren(node("div", "rechnung-live-message", message || "Aktion fehlgeschlagen.")); }
}
