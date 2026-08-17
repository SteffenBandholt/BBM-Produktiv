import { addCalendarDays, formatDocumentType } from "../../../../shared/rechnung/invoiceHeaderRules.mjs";
import { calculatePositionTotalCents } from "../../../../shared/rechnung/rechnungPositions.mjs";
import { m80EditorAttributes } from "../../../ui-editor/m80Registry.js";
import { beginM83ComponentBinding, completeM80PilotRender, registerM80Ref } from "../../../ui-editor/m80Refs.js";
import { ensureRechnungenDesignStyles } from "../styles.js";
import { RECHNUNG_COMPONENT_ID, RECHNUNG_SCOPE_ID } from "../RechnungScreen.uiEditorContract.js";

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
function field(labelText, input, className = "") { const wrapper = node("label", `invoice-field${className ? ` ${className}` : ""}`); wrapper.append(node("span", "invoice-field__label", labelText), input); return wrapper; }
function address(value = {}) { const source = value || {}; return [source.companyName || source.name, source.companyName2 || source.name2, source.street, [source.zip, source.city].filter(Boolean).join(" "), source.country].filter(Boolean).join("\n"); }
function customerKey(value = {}) { return `${value.kind || value.ref?.kind}:${value.id || value.ref?.id}`; }

export default class RechnungScreen {
  constructor() { this.invoices = []; this.customers = []; this.projects = []; this.positions = []; this.selectedPositionId = null; this.positionSequence = 0; this.current = null; this.root = null; }

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
    const editor = bind(node("section", "rechnung-live-editor"), "rechnung.editor"); editor.hidden = true;
    const header = bind(node("header", "rechnung-live-editor__header"), "rechnung.editor.header");
    this.title = bind(node("h2", "invoice-page-title", "Rechnung"), "rechnung.editor.title");
    this.status = bind(node("span", "invoice-status invoice-status--draft", "Entwurf"), "rechnung.editor.status");
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
    this.issuerAddress = bind(node("div", "rechnung-live-address"), "rechnung.editor.issuerAddress");
    parties.append(this.customerAddress, this.issuerAddress);
    const service = bind(node("section", "invoice-form-section rechnung-live-service"), "rechnung.editor.servicePeriod");
    this.serviceType = control("select", "rechnung.editor.servicePeriodType"); [["SINGLE_DATE", "Einzelnes Leistungsdatum"], ["MONTH", "Leistungsmonat"], ["RANGE", "Leistungszeitraum"]].forEach(([value, label]) => this.serviceType.append(option(value, label)));
    this.serviceDate = control("input", "rechnung.editor.serviceDate", "date"); this.serviceMonth = control("input", "rechnung.editor.serviceMonth", "month"); this.serviceStart = control("input", "rechnung.editor.serviceStart", "date"); this.serviceEnd = control("input", "rechnung.editor.serviceEnd", "date");
    this.serviceFields = { SINGLE_DATE: field("Leistungsdatum", this.serviceDate), MONTH: field("Leistungsmonat", this.serviceMonth), RANGE_START: field("Leistungszeitraum von", this.serviceStart), RANGE_END: field("Leistungszeitraum bis", this.serviceEnd) };
    service.append(field("Leistungszeitpunkt", this.serviceType), ...Object.values(this.serviceFields));
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
    this.positionShort = control("input", "rechnung.editor.positionShort", "text"); this.positionShort.maxLength = 200;
    this.positionLong = control("textarea", "rechnung.editor.positionLong"); this.positionLong.maxLength = 2000;
    this.positionQuantity = control("input", "rechnung.editor.positionQuantity", "text"); this.positionQuantity.value = "1";
    this.positionUnit = control("input", "rechnung.editor.positionUnit", "text");
    this.positionPrice = control("input", "rechnung.editor.positionPrice", "number"); this.positionPrice.min = "0"; this.positionPrice.step = "0.01";
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
    [this.documentType, this.customer, this.invoiceDate, this.paymentTerm, this.serviceType].forEach((element) => element.addEventListener("change", () => this._syncDerived()));
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
    this._renderList();
  }

  _renderList() {
    this.list.replaceChildren();
    if (!this.invoices.length) { this.list.append(node("div", "invoice-empty", "Noch keine Rechnungen oder Entwürfe vorhanden.")); return; }
    for (const invoice of this.invoices) {
      const card = node("article", "rechnung-live-card");
      const badge = node("span", `invoice-status invoice-status--${invoice.status === "BOOKED" ? "paid" : "draft"}`, invoice.status === "BOOKED" ? "Erstellt / Gebucht" : "Entwurf");
      const heading = node("strong", "rechnung-live-card__title", invoice.invoice_number || "Rechnungs-Nr.: wird bei Buchung vergeben");
      const meta = node("span", "invoice-cell-muted", [invoice.service_reference || "Ohne Leistungsbezug", invoice.invoice_date, invoice.due_date].filter(Boolean).join(" · "));
      const open = node("button", "invoice-button invoice-button--quiet", "Öffnen"); open.type = "button"; open.onclick = () => this._open(invoice);
      card.append(badge, node("div", "rechnung-live-card__body"), open); card.children[1].append(heading, meta); this.list.append(card);
    }
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
    this.reference.value = invoice.service_reference || ""; this.constructionProject.value = invoice.construction_project || ""; this.positions = (invoice.positions || []).map((entry) => ({ ...entry })); this.selectedPositionId = null; this._renderPositions(); this._clearPositionEditor(); this.paymentTerm.value = String(invoice.payment_term_days ?? 8); this.dueDate.value = invoice.due_date || "";
    this.customer.replaceChildren(option("", "Rechnungskunde wählen")); this.customers.forEach((entry) => this.customer.append(option(customerKey(entry), entry.label || entry.name)));
    const selectedCustomerKey = `${invoice.customer_ref_kind || ""}:${invoice.customer_firm_id || ""}`;
    if (invoice.status === "BOOKED" && invoice.customer_snapshot && ![...this.customer.options].some((entry) => entry.value === selectedCustomerKey)) this.customer.append(option(selectedCustomerKey, invoice.customer_snapshot.companyName || "Gebuchter Kunde"));
    this.customer.value = selectedCustomerKey === ":" ? "" : selectedCustomerKey;
    this.project.replaceChildren(option("", "Kein Projekt")); this.projects.forEach((entry) => this.project.append(option(entry.id, entry.name))); this.project.value = invoice.project_id || "";
    this._syncDerived(); this._setBooked(invoice.status === "BOOKED");
  }

  _payload() {
    const customer = this.customers.find((entry) => customerKey(entry) === this.customer.value);
    const [fallbackKind, fallbackId] = this.customer.value.split(":");
    return { source_type: this.source.value, document_type: this.documentType.value, installment_number: this.installmentNumber.value, invoice_date: this.invoiceDate.value, service_period_type: this.serviceType.value, service_date: this.serviceDate.value, service_month: this.serviceMonth.value, service_period_start: this.serviceStart.value, service_period_end: this.serviceEnd.value, customer_ref_kind: customer?.kind || customer?.ref?.kind || fallbackKind || null, customer_firm_id: customer?.id || customer?.ref?.id || fallbackId || null, customer_project_id: customer?.project_id || customer?.ref?.projectId || null, project_id: this.project.value || null, service_reference: this.reference.value, construction_project: this.constructionProject.value, positions: this.positions, payment_term_days: this.paymentTerm.value };
  }

  _clearPositionEditor() { this.selectedPositionId = null; this.positionType.value = "service"; this.positionShort.value = ""; this.positionLong.value = ""; this.positionQuantity.value = "1"; this.positionUnit.value = ""; this.positionPrice.value = ""; this.positionNep.checked = false; this.positionAddButton.textContent = "Position uebernehmen"; }
  _selectPosition(entry) { this.selectedPositionId = entry.id; this.positionType.value = entry.type; this.positionShort.value = entry.short_text || ""; this.positionLong.value = entry.long_text || ""; this.positionQuantity.value = entry.quantity ?? "1"; this.positionUnit.value = entry.unit || ""; this.positionPrice.value = entry.unit_price_cents == null ? "" : (entry.unit_price_cents / 100).toFixed(2); this.positionNep.checked = Boolean(entry.is_nep); this.positionAddButton.textContent = "Position aktualisieren"; }
  _applyPosition() { const shortText = this.positionShort.value.trim(); if (!shortText) return this._error("Kurztext der Position fehlt."); const id = this.selectedPositionId || `invoice-position-${Date.now()}-${++this.positionSequence}`; const entry = { id, type: this.positionType.value, short_text: shortText, long_text: this.positionLong.value.trim(), quantity: this.positionQuantity.value || "0", unit: this.positionUnit.value.trim(), unit_price_cents: Math.round(Number(this.positionPrice.value || 0) * 100), is_nep: this.positionNep.checked }; const index = this.positions.findIndex((item) => item.id === id); if (index < 0) this.positions.push(entry); else this.positions[index] = entry; this._clearPositionEditor(); this._renderPositions(); }
  _deletePosition() { if (!this.selectedPositionId) return; this.positions = this.positions.filter((entry) => entry.id !== this.selectedPositionId); this._clearPositionEditor(); this._renderPositions(); }
  _movePosition(offset) { const index = this.positions.findIndex((entry) => entry.id === this.selectedPositionId); const next = index + offset; if (index < 0 || next < 0 || next >= this.positions.length) return; [this.positions[index], this.positions[next]] = [this.positions[next], this.positions[index]]; this._renderPositions(); }
  _renderPositions() { this.positionsList.replaceChildren(); let total = 0; if (!this.positions.length) this.positionsList.append(node("div", "invoice-empty", "Noch keine Positionen.")); this.positions.forEach((entry, index) => { const row = node("button", `rechnung-live-position${entry.id === this.selectedPositionId ? " is-selected" : ""}`); row.type = "button"; row.onclick = () => { this._selectPosition(entry); this._renderPositions(); }; const amount = calculatePositionTotalCents(entry); if (amount != null) total += amount; row.append(node("span", "rechnung-live-position__number", entry.type === "note" ? "-" : String(index + 1)), node("span", "rechnung-live-position__text", entry.short_text), node("span", "rechnung-live-position__amount", amount == null ? "NEP" : `${(amount / 100).toFixed(2).replace(".", ",")} EUR`)); this.positionsList.append(row); }); this.positionsTotal.textContent = `${(total / 100).toFixed(2).replace(".", ",")} EUR`; }

  _syncDerived() {
    const isPartial = this.documentType.value === "PARTIAL"; this.installmentNumber.closest("label").hidden = !isPartial;
    const type = this.serviceType.value; this.serviceFields.SINGLE_DATE.hidden = type !== "SINGLE_DATE"; this.serviceFields.MONTH.hidden = type !== "MONTH"; this.serviceFields.RANGE_START.hidden = type !== "RANGE"; this.serviceFields.RANGE_END.hidden = type !== "RANGE";
    try { this.dueDate.value = addCalendarDays(this.invoiceDate.value, Number(this.paymentTerm.value)); } catch { this.dueDate.value = ""; }
    this.title.textContent = formatDocumentType({ document_type: this.documentType.value, installment_number: Number(this.installmentNumber.value) || null });
    const customer = this.customers.find((entry) => customerKey(entry) === this.customer.value);
    const customerValue = this.current?.status === "BOOKED" ? this.current.customer_snapshot : customer;
    const issuerValue = this.current?.status === "BOOKED" ? this.current.issuer_snapshot : this.profile ? { companyName: this.profile.name1, companyName2: this.profile.name2, ...this.profile } : null;
    this.customerAddress.textContent = `Rechnungsempfänger\n${address(customerValue) || "Noch kein Kunde gewählt"}`;
    this.issuerAddress.textContent = `Rechnungssteller\n${address(issuerValue) || "Eigene Unternehmensdaten unvollständig"}`;
  }

  _setBooked(booked) {
    this.status.textContent = booked ? "Erstellt / Gebucht" : "Entwurf"; this.status.className = `invoice-status invoice-status--${booked ? "paid" : "draft"}`;
    [this.source, this.documentType, this.installmentNumber, this.customer, this.project, this.invoiceDate, this.serviceType, this.serviceDate, this.serviceMonth, this.serviceStart, this.serviceEnd, this.reference, this.constructionProject, this.paymentTerm, this.positionType, this.positionShort, this.positionLong, this.positionQuantity, this.positionUnit, this.positionPrice, this.positionNep, this.positionAddButton, this.positionDeleteButton, this.positionUpButton, this.positionDownButton].forEach((element) => { element.disabled = booked; });
    this.saveButton.hidden = booked; this.bookButton.hidden = booked; this.deleteButton.hidden = booked;
  }

  async _save() { const result = await api().rechnungUpdateDraft?.(this.current.id, this._payload()); if (!result?.ok) return this._error(result?.error); this.current = result.data; this.message.textContent = "Entwurf gespeichert."; await this._refreshList(); }
  async _delete() { if (!globalThis.window?.confirm?.("Rechnungsentwurf wirklich verwerfen?")) return; const result = await api().rechnungDeleteDraft?.(this.current.id); if (!result?.ok) return this._error(result?.error); await this._refreshList(); this._close(); }
  async _book() { if (!globalThis.window?.confirm?.("Rechnung jetzt verbindlich buchen? Danach ist sie nicht mehr bearbeitbar.")) return; const result = await api().rechnungBookDraft?.(this.current.id, this._payload()); if (!result?.ok) return this._error(result?.error); this.current = result.data; this._open(result.data); this.message.textContent = `Rechnung ${result.data.invoice_number} wurde gebucht.`; await this._refreshList(); }
  async _showPreview() { const result = await api().rechnungPreviewDraft?.(this.current.id, this.current.status === "DRAFT" ? this._payload() : null); if (!result?.ok) return this._error(result?.error); const invoice = result.data; this.previewBody.textContent = [`PROBERECHNUNG · ENTWURF`, formatDocumentType(invoice), invoice.invoice_number ? `Rechnungs-Nr.: ${invoice.invoice_number}` : "Rechnungs-Nr.: wird bei Buchung vergeben", invoice.service_reference || "Ohne Leistungsbezug", `Rechnungsdatum: ${invoice.invoice_date}`, `Fällig am: ${invoice.due_date}`].join("\n"); this.preview.hidden = false; }
  async _refreshList() { const result = await api().rechnungList?.(); if (result?.ok) { this.invoices = result.list || []; this._renderList(); } }
  _close() { this.editor.hidden = true; this.preview.hidden = true; this.overview.hidden = false; this.current = null; }
  _error(message) { this.message.textContent = message || "Aktion fehlgeschlagen."; this.message.dataset.tone = "error"; }
  _overviewMessage(message) { this.list.replaceChildren(node("div", "rechnung-live-message", message || "Aktion fehlgeschlagen.")); }
}
