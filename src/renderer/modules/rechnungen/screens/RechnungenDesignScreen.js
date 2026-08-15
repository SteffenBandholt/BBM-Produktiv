import {
  cleanupPopupHandlers,
  createPopupOverlay,
  registerPopupCloseHandlers,
  stylePopupCard,
} from "../../../ui/popupCommon.js";
import { OVERLAY_TOP } from "../../../ui/zIndex.js";
import {
  INVOICE_DESIGN_FORM,
  INVOICE_DESIGN_POSITIONS,
  INVOICE_DESIGN_ROWS,
} from "../demoData.js";
import { ensureRechnungenDesignStyles } from "../styles.js";
import { openFirmEditor } from "../../../features/firms/openFirmEditor.js";

function node(tag, className = "", text = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function button(label, variant = "secondary") {
  const element = node("button", `invoice-button invoice-button--${variant}`, label);
  element.type = "button";
  element.dataset.variant = `invoice-${variant}`;
  return element;
}

function option(value, label = value) {
  const element = document.createElement("option");
  element.value = value;
  element.textContent = label;
  return element;
}

function field({ label, control, className = "" }) {
  const wrapper = node("label", `invoice-field${className ? ` ${className}` : ""}`);
  wrapper.append(node("span", "invoice-field__label", label), control);
  return wrapper;
}

function textInput({ value = "", placeholder = "", type = "text", disabled = false } = {}) {
  const input = node("input", "invoice-control");
  input.type = type;
  input.value = value;
  input.placeholder = placeholder;
  input.disabled = disabled;
  return input;
}

function selectInput(values, selected) {
  const select = node("select", "invoice-control");
  values.forEach((value) => select.append(option(value)));
  select.value = selected;
  return select;
}

function statusBadge(row) {
  const badge = node("span", `invoice-status invoice-status--${row.statusTone}`, row.status);
  badge.setAttribute("aria-label", `Status ${row.status}`);
  return badge;
}

export default class RechnungenDesignScreen {
  constructor({ router } = {}) {
    this.router = router || null;
    this.root = null;
    this.overlay = null;
    this.searchTerm = "";
    this.statusFilter = "Alle Status";
    this.tableBody = null;
    this.resultCount = null;
    this.designMessage = null;
    this.projectId = router?.currentProjectId || router?.projectId || null;
  }

  async _loadCustomerOptions(select, selectedKey = "") {
    const api = globalThis.window?.bbmDb;
    if (!select || typeof api?.firmDirectoryListCustomers !== "function") return;
    const response = await api.firmDirectoryListCustomers({ projectId: this.projectId || undefined });
    if (!response?.ok) {
      this._setDialogMessage(response?.error || "Kunden konnten nicht geladen werden.");
      return;
    }
    select.replaceChildren(option("", "Kunde auswählen"));
    for (const firm of response.list || []) {
      select.append(option(firm.key, `${firm.label}${firm.kind === "project_firm" ? " · Projekt" : " · Global"}`));
    }
    if (selectedKey && [...select.options].some((entry) => entry.value === selectedKey)) select.value = selectedKey;
  }

  render() {
    ensureRechnungenDesignStyles();
    const root = node("section", "bbm-invoice-design bbm-popup-standard");
    root.setAttribute("data-invoice-design-screen", "overview");

    const header = node("header", "invoice-page-header");
    const heading = node("div", "invoice-page-heading");
    heading.append(
      node("div", "invoice-eyebrow", "DEV · UI-DESIGNREFERENZ"),
      node("h1", "invoice-page-title", "Rechnungen"),
      node("p", "invoice-page-subtitle", "Statische Referenzfläche für eine kompakte BBM-Designsprache – ohne Fachlogik oder Speicherung.")
    );
    const headerActions = node("div", "invoice-page-actions");
    const helpButton = button("Designwerte", "quiet");
    helpButton.onclick = () => this._showMessage("Alle Maße und Farben stammen aus dem zentralen BBM Popup- und Formularstandard.");
    const newButton = button("+ Neue Rechnung", "primary");
    newButton.setAttribute("data-invoice-action", "open-editor");
    newButton.onclick = () => this.openEditor();
    headerActions.append(helpButton, newButton);
    header.append(heading, headerActions);

    const toolbar = node("div", "invoice-toolbar");
    const searchWrap = node("label", "invoice-search");
    searchWrap.append(node("span", "invoice-search__icon", "⌕"));
    const search = textInput({ placeholder: "Rechnungsnummer, Kunde oder Projekt suchen" });
    search.setAttribute("aria-label", "Rechnungen suchen");
    search.oninput = () => {
      this.searchTerm = search.value;
      this._renderRows();
    };
    searchWrap.append(search);

    const status = selectInput(["Alle Status", "Entwurf", "Offen", "Fällig", "Bezahlt"], "Alle Status");
    status.setAttribute("aria-label", "Nach Status filtern");
    status.onchange = () => {
      this.statusFilter = status.value;
      this._renderRows();
    };
    const month = selectInput(["August 2026", "Juli 2026", "Juni 2026"], "August 2026");
    month.setAttribute("aria-label", "Zeitraum wählen");
    const exportButton = button("Export", "secondary");
    exportButton.disabled = true;
    exportButton.title = "Im Design-Dummy nicht verfügbar";
    toolbar.append(searchWrap, status, month, exportButton);

    const metrics = node("div", "invoice-metrics");
    [
      ["Umsatz August", "16.333,94 €", "+ 8,4 % zum Vormonat", "positive"],
      ["Offene Beträge", "16.333,94 €", "2 Rechnungen", "neutral"],
      ["Überfällig", "7.925,40 €", "1 Rechnung", "warning"],
      ["Entwürfe", "1", "noch nicht versendet", "neutral"],
    ].forEach(([label, value, hint, tone]) => {
      const card = node("article", `invoice-metric invoice-metric--${tone}`);
      card.append(
        node("div", "invoice-metric__label", label),
        node("strong", "invoice-metric__value", value),
        node("div", "invoice-metric__hint", hint)
      );
      metrics.append(card);
    });

    const listCard = node("section", "invoice-list-card");
    const listHeader = node("div", "invoice-list-header");
    const listTitle = node("div");
    listTitle.append(node("h2", "invoice-section-title", "Rechnungsübersicht"));
    this.resultCount = node("div", "invoice-section-note");
    listTitle.append(this.resultCount);
    const compactAction = button("Ansicht", "quiet");
    compactAction.onclick = () => this._showMessage("Kompakte Tabellenansicht ist aktiv.");
    listHeader.append(listTitle, compactAction);

    const tableScroll = node("div", "invoice-table-scroll");
    const table = node("table", "invoice-table");
    const thead = node("thead");
    const headRow = node("tr");
    ["Rechnung", "Kunde / Projekt", "Datum", "Fällig", "Betrag", "Status", ""].forEach((label) => {
      const th = node("th", "", label);
      th.scope = "col";
      headRow.append(th);
    });
    thead.append(headRow);
    this.tableBody = node("tbody");
    table.append(thead, this.tableBody);
    tableScroll.append(table);
    listCard.append(listHeader, tableScroll);

    this.designMessage = node("div", "invoice-design-message");
    this.designMessage.setAttribute("role", "status");
    this.designMessage.setAttribute("aria-live", "polite");
    root.append(header, toolbar, metrics, listCard, this.designMessage);
    this.root = root;
    this._renderRows();
    return root;
  }

  _filteredRows() {
    const term = String(this.searchTerm || "").trim().toLocaleLowerCase("de");
    return INVOICE_DESIGN_ROWS.filter((row) => {
      const matchesStatus = this.statusFilter === "Alle Status" || row.status === this.statusFilter;
      const haystack = `${row.number} ${row.customer} ${row.project}`.toLocaleLowerCase("de");
      return matchesStatus && (!term || haystack.includes(term));
    });
  }

  _renderRows() {
    if (!this.tableBody) return;
    this.tableBody.replaceChildren();
    const rows = this._filteredRows();
    this.resultCount.textContent = `${rows.length} von ${INVOICE_DESIGN_ROWS.length} Dummy-Rechnungen`;

    rows.forEach((row) => {
      const tr = node("tr");
      const invoiceCell = node("td");
      invoiceCell.append(node("strong", "invoice-number", row.number), node("span", "invoice-cell-muted", "Leistungsrechnung"));
      const customerCell = node("td");
      customerCell.append(node("strong", "invoice-customer", row.customer), node("span", "invoice-cell-muted", row.project));
      const amountCell = node("td", "invoice-amount", row.amount);
      const actionCell = node("td", "invoice-row-action");
      const editButton = button("Bearbeiten", "quiet");
      editButton.setAttribute("aria-label", `${row.number} bearbeiten`);
      editButton.onclick = () => this.openEditor(row);
      actionCell.append(editButton);
      tr.append(
        invoiceCell,
        customerCell,
        node("td", "", row.date),
        node("td", "", row.dueDate),
        amountCell,
        (() => { const td = node("td"); td.append(statusBadge(row)); return td; })(),
        actionCell
      );
      this.tableBody.append(tr);
    });

    if (!rows.length) {
      const tr = node("tr");
      const td = node("td", "invoice-empty", "Keine Dummy-Rechnung entspricht dem Filter.");
      td.colSpan = 7;
      tr.append(td);
      this.tableBody.append(tr);
    }
  }

  _showMessage(message) {
    if (this.designMessage) this.designMessage.textContent = message;
  }

  openEditor(row = INVOICE_DESIGN_ROWS[0]) {
    this.closeEditor();
    ensureRechnungenDesignStyles();
    const overlay = createPopupOverlay({ background: "rgba(15, 23, 42, 0.48)", zIndex: OVERLAY_TOP });
    overlay.classList.add("bbm-invoice-design-modal");
    overlay.setAttribute("data-invoice-design-state", "editor-open");
    overlay.style.display = "flex";

    const modal = node("section", "invoice-dialog bbm-popup-standard bbm-popup-dialog");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "invoice-dialog-title");
    stylePopupCard(modal, {
      width: "min(1080px, calc(100vw - 32px))",
      maxHeight: "calc(100% - 8px)",
    });

    const modalHeader = node("header", "invoice-dialog__header");
    const modalHeading = node("div", "invoice-dialog__heading");
    const titleLine = node("div", "invoice-dialog__title-line");
    const title = node("h2", "invoice-dialog__title", "Rechnung bearbeiten");
    title.id = "invoice-dialog-title";
    titleLine.append(title, node("span", "invoice-design-chip", "DESIGN-DUMMY"));
    modalHeading.append(titleLine, node("p", "invoice-dialog__subtitle", `${row.number} · ${row.customer}`));
    const closeButton = button("×", "icon");
    closeButton.setAttribute("aria-label", "Dialog schließen");
    closeButton.onclick = () => this.closeEditor();
    modalHeader.append(modalHeading, closeButton);

    const body = node("div", "invoice-dialog__body");
    const formCard = node("section", "invoice-form-section");
    formCard.append(node("h3", "invoice-form-section__title", "Rechnungsdaten"));
    const formGrid = node("div", "invoice-form-grid");
    const customerSelect = selectInput([], "");
    const customerControl = node("div", "invoice-customer-control");
    customerControl.appendChild(customerSelect);
    const createCustomer = button("+ Kunde", "quiet");
    createCustomer.onclick = async () => {
      const created = await openFirmEditor({
        origin: "invoice",
        projectId: this.projectId,
        title: "Rechnungskunde anlegen",
      });
      if (created?.ok && !created.canceled) {
        await this._loadCustomerOptions(customerSelect, created.firm?.key || "");
      }
    };
    customerControl.appendChild(createCustomer);
    formGrid.append(
      field({ label: "Rechnungsnummer", control: textInput({ value: INVOICE_DESIGN_FORM.number }) }),
      field({ label: "Kunde", control: customerControl }),
      field({ label: "Projekt", control: selectInput(["Erweiterung Werkhalle 3", "Quartier Am Stadtpark", "Verwaltungsbau Hafenstraße"], INVOICE_DESIGN_FORM.project) }),
      field({ label: "Rechnungsdatum", control: textInput({ value: INVOICE_DESIGN_FORM.invoiceDate, type: "date" }) }),
      field({ label: "Leistungszeitraum von", control: textInput({ value: INVOICE_DESIGN_FORM.serviceFrom, type: "date" }) }),
      field({ label: "Leistungszeitraum bis", control: textInput({ value: INVOICE_DESIGN_FORM.serviceTo, type: "date" }) }),
      field({ label: "Zahlungsziel", control: selectInput(["7 Tage netto", "14 Tage netto", "30 Tage netto"], INVOICE_DESIGN_FORM.paymentTerm) }),
      field({ label: "Buchungsstatus", control: textInput({ value: "Nicht gebucht (Design-Dummy)", disabled: true }) }),
      field({ label: "Betreff", className: "invoice-field--wide", control: textInput({ value: INVOICE_DESIGN_FORM.subject }) })
    );
    formCard.append(formGrid);
    this._loadCustomerOptions(customerSelect).catch((error) =>
      this._setDialogMessage(error?.message || String(error))
    );

    const lowerGrid = node("div", "invoice-dialog__lower-grid");
    const positionsCard = node("section", "invoice-form-section invoice-form-section--positions");
    const positionsHead = node("div", "invoice-form-section__head");
    positionsHead.append(
      node("h3", "invoice-form-section__title", "Positionen"),
      (() => { const b = button("+ Position", "quiet"); b.onclick = () => this._setDialogMessage("Nur als Gestaltungselement vorhanden – keine Position wurde angelegt."); return b; })()
    );
    const positionsScroll = node("div", "invoice-positions-scroll");
    const positionsTable = node("table", "invoice-positions-table");
    const positionsHeader = node("tr");
    ["Pos.", "Leistung", "Menge", "Einzelpreis", "Gesamt"].forEach((label) => positionsHeader.append(node("th", "", label)));
    const positionsThead = node("thead");
    positionsThead.append(positionsHeader);
    const positionsBody = node("tbody");
    INVOICE_DESIGN_POSITIONS.forEach((position) => {
      const tr = node("tr");
      tr.append(
        node("td", "", position.number),
        node("td", "invoice-position-description", position.description),
        node("td", "invoice-numeric", position.quantity),
        node("td", "invoice-numeric", position.unitPrice),
        node("td", "invoice-numeric invoice-position-total", position.total)
      );
      positionsBody.append(tr);
    });
    positionsTable.append(positionsThead, positionsBody);
    positionsScroll.append(positionsTable);
    positionsCard.append(positionsHead, positionsScroll);

    const totalsCard = node("aside", "invoice-totals-card");
    totalsCard.append(node("h3", "invoice-form-section__title", "Summen"));
    [["Netto", INVOICE_DESIGN_FORM.subtotal], ["USt. 19 %", INVOICE_DESIGN_FORM.tax]].forEach(([label, value]) => {
      const line = node("div", "invoice-total-line");
      line.append(node("span", "", label), node("strong", "", value));
      totalsCard.append(line);
    });
    const grandTotal = node("div", "invoice-total-line invoice-total-line--grand");
    grandTotal.append(node("span", "", "Rechnungsbetrag"), node("strong", "", INVOICE_DESIGN_FORM.total));
    totalsCard.append(grandTotal, node("p", "invoice-total-note", "Statische Designwerte · keine Berechnung"));
    lowerGrid.append(positionsCard, totalsCard);

    const noteArea = node("textarea", "invoice-control invoice-textarea");
    noteArea.rows = 3;
    noteArea.placeholder = "Interne Notiz für die weitere Bearbeitung …";
    const noteCard = node("section", "invoice-form-section");
    noteCard.append(field({ label: "Notizen", control: noteArea }));
    body.append(formCard, lowerGrid, noteCard);

    const footer = node("footer", "invoice-dialog__footer");
    const liveMessage = node("div", "invoice-dialog__message", "Nur Design-Dummy – Änderungen werden nicht gespeichert.");
    liveMessage.setAttribute("role", "status");
    liveMessage.setAttribute("aria-live", "polite");
    const footerActions = node("div", "invoice-dialog__actions");
    const cancelButton = button("Abbrechen", "secondary");
    cancelButton.onclick = () => this.closeEditor();
    const pdfButton = button("PDF", "secondary");
    pdfButton.onclick = () => this._setDialogMessage("PDF ist im Design-Dummy bewusst ohne Funktion.");
    const saveButton = button("Speichern", "primary");
    saveButton.onclick = () => this._setDialogMessage("Keine Speicherung: Das Modul verwendet ausschließlich lokale Dummy-Daten.");
    footerActions.append(cancelButton, pdfButton, saveButton);
    footer.append(liveMessage, footerActions);

    modal.append(modalHeader, body, footer);
    overlay.append(modal);
    document.body.append(overlay);
    registerPopupCloseHandlers(overlay, () => this.closeEditor());
    this.overlay = overlay;
    this.dialogMessage = liveMessage;
    closeButton.focus();
  }

  _setDialogMessage(message) {
    if (this.dialogMessage) this.dialogMessage.textContent = message;
  }

  closeEditor() {
    if (!this.overlay) return;
    cleanupPopupHandlers(this.overlay);
    this.overlay.remove();
    this.overlay = null;
    this.dialogMessage = null;
  }

  destroy() {
    this.closeEditor();
    this.root = null;
  }
}
