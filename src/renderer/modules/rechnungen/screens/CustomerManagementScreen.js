const apiDefault = () => globalThis.window?.bbmDb || {};

const node = (tag, className = "", text = "") => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

const input = (type = "text") => {
  const element = node("input", "customer-admin__control");
  element.type = type;
  return element;
};

const field = (label, control, wide = false) => {
  const wrapper = node("label", `customer-admin__field${wide ? " customer-admin__field--wide" : ""}`);
  wrapper.append(node("span", "customer-admin__label", label), control);
  return wrapper;
};

const text = (value) => String(value ?? "").trim();

export function customerDisplayName(customer = {}) {
  return [text(customer.name1), text(customer.name2)].filter(Boolean).join(" · ");
}

export function customerMatchesSearch(customer = {}, query = "") {
  const needle = text(query).toLocaleLowerCase("de-DE");
  if (!needle) return true;
  return [
    customer.customerNumber,
    customer.name1,
    customer.name2,
    customer.city,
    customer.email,
    customer.vatId,
  ].some((value) => text(value).toLocaleLowerCase("de-DE").includes(needle));
}

export default class CustomerManagementScreen {
  constructor({
    apiProvider = apiDefault,
    onClose = () => {},
    confirmFn = (message) => globalThis.window?.confirm?.(message) ?? false,
  } = {}) {
    this.apiProvider = apiProvider;
    this.onClose = onClose;
    this.confirmFn = confirmFn;
    this.customers = [];
    this.current = null;
    this.contacts = [];
    this.currentContact = null;
    this.root = null;
  }

  api() {
    return this.apiProvider() || {};
  }

  render() {
    const root = node("section", "customer-admin");
    root.hidden = true;

    const header = node("header", "customer-admin__header");
    const heading = node("div", "customer-admin__heading");
    heading.append(
      node("h1", "customer-admin__title", "Kunden"),
      node("p", "customer-admin__subtitle", "Rechnungskunden und Ansprechpartner")
    );
    const close = node("button", "invoice-button invoice-button--secondary", "Schließen");
    close.type = "button";
    close.onclick = () => this.close();
    header.append(heading, close);

    const toolbar = node("div", "customer-admin__toolbar");
    this.searchInput = input("search");
    this.searchInput.placeholder = "Kundennr., Name, Ort, E-Mail ...";
    this.searchInput.oninput = () => this._renderList();
    this.includeArchived = input("checkbox");
    this.includeArchived.onchange = () => void this.load({ keepSelection: true });
    const archivedLabel = node("label", "customer-admin__check");
    archivedLabel.append(this.includeArchived, node("span", "", "Archivierte"));
    const createButton = node("button", "invoice-button invoice-button--primary", "Neuer Kunde");
    createButton.type = "button";
    createButton.onclick = () => this._newCustomer();
    toolbar.append(this.searchInput, archivedLabel, createButton);

    const body = node("div", "customer-admin__body");
    this.listPane = node("section", "customer-admin__list-pane");
    this.list = node("div", "customer-admin__list");
    this.listPane.append(this._listHeader(), this.list);

    this.editorPane = node("section", "customer-admin__editor-pane");
    this.editorPane.append(this._customerEditor(), this._contactsEditor());

    body.append(this.listPane, this.editorPane);
    this.message = node("div", "customer-admin__message");
    root.append(header, toolbar, body, this.message);
    this.root = root;
    this._clearCustomerEditor();
    return root;
  }

  _listHeader() {
    const row = node("div", "customer-admin__row customer-admin__row--head");
    ["Kundennr.", "Name", "Ort", "E-Mail", "Status"].forEach((label) => row.append(node("span", "", label)));
    return row;
  }

  _customerEditor() {
    const section = node("section", "customer-admin__editor");
    const head = node("div", "customer-admin__editor-head");
    const titleWrap = node("div");
    this.editorTitle = node("h2", "customer-admin__editor-title", "Neuer Kunde");
    this.editorMeta = node("span", "customer-admin__meta");
    titleWrap.append(this.editorTitle, this.editorMeta);

    this.saveButton = node("button", "invoice-button invoice-button--primary", "Speichern");
    this.saveButton.type = "button";
    this.saveButton.onclick = () => void this._saveCustomer();
    this.archiveButton = node("button", "invoice-button invoice-button--secondary", "Archivieren");
    this.archiveButton.type = "button";
    this.archiveButton.onclick = () => void this._toggleArchive();
    const actions = node("div", "customer-admin__actions");
    actions.append(this.archiveButton, this.saveButton);
    head.append(titleWrap, actions);

    this.customerInputs = {};
    const grid = node("div", "customer-admin__grid");
    const defs = [
      ["name1", "Firma / Name", "text", true],
      ["name2", "Name 2", "text", true],
      ["street", "Straße", "text", true],
      ["postalCode", "PLZ", "text", false],
      ["city", "Ort", "text", false],
      ["countryCode", "Land", "text", false],
      ["email", "E-Mail", "email", true],
      ["phone", "Telefon", "text", false],
      ["vatId", "USt-IdNr.", "text", false],
      ["defaultPaymentTermDays", "Zahlungsziel Tage", "number", false],
    ];
    for (const [key, label, type, wide] of defs) {
      const control = input(type);
      if (key === "countryCode") control.maxLength = 2;
      if (key === "defaultPaymentTermDays") {
        control.min = "0";
        control.max = "365";
      }
      this.customerInputs[key] = control;
      grid.append(field(label, control, wide));
    }

    const billing = node("details", "customer-admin__billing");
    const summary = node("summary", "customer-admin__section-title", "Abweichende Rechnungsanschrift");
    const billingGrid = node("div", "customer-admin__grid customer-admin__grid--billing");
    const billingDefs = [
      ["billingName1", "Rechnungsname", "text", true],
      ["billingName2", "Rechnungsname 2", "text", true],
      ["billingStreet", "Straße", "text", true],
      ["billingPostalCode", "PLZ", "text", false],
      ["billingCity", "Ort", "text", false],
      ["billingCountryCode", "Land", "text", false],
      ["billingEmail", "Rechnungs-E-Mail", "email", true],
    ];
    for (const [key, label, type, wide] of billingDefs) {
      const control = input(type);
      if (key === "billingCountryCode") control.maxLength = 2;
      this.customerInputs[key] = control;
      billingGrid.append(field(label, control, wide));
    }
    billing.append(summary, billingGrid);

    this.internalNote = node("textarea", "customer-admin__control customer-admin__note");
    this.internalNote.rows = 2;
    this.customerInputs.internalNote = this.internalNote;

    section.append(head, grid, billing, field("Interne Notiz", this.internalNote, true));
    return section;
  }

  _contactsEditor() {
    const section = node("section", "customer-admin__contacts");
    const head = node("div", "customer-admin__contacts-head");
    head.append(node("h3", "customer-admin__section-title", "Ansprechpartner"));
    const newButton = node("button", "invoice-button invoice-button--secondary", "Neu");
    newButton.type = "button";
    newButton.onclick = () => this._newContact();
    head.append(newButton);

    this.contactList = node("div", "customer-admin__contacts-list");

    this.contactInputs = {};
    const grid = node("div", "customer-admin__contact-form");
    const defs = [
      ["firstName", "Vorname", "text"],
      ["lastName", "Nachname", "text"],
      ["position", "Funktion", "text"],
      ["email", "E-Mail", "email"],
      ["phone", "Telefon", "text"],
      ["mobile", "Mobil", "text"],
    ];
    for (const [key, label, type] of defs) {
      const control = input(type);
      this.contactInputs[key] = control;
      grid.append(field(label, control));
    }

    this.contactPrimary = input("checkbox");
    this.contactBilling = input("checkbox");
    this.contactLicense = input("checkbox");
    this.contactActive = input("checkbox");
    this.contactActive.checked = true;
    const flags = node("div", "customer-admin__contact-flags");
    [
      [this.contactPrimary, "Hauptkontakt"],
      [this.contactBilling, "Rechnung"],
      [this.contactLicense, "Lizenz"],
      [this.contactActive, "Aktiv"],
    ].forEach(([control, label]) => {
      const wrapper = node("label", "customer-admin__check");
      wrapper.append(control, node("span", "", label));
      flags.append(wrapper);
    });

    this.contactSaveButton = node("button", "invoice-button invoice-button--secondary", "Kontakt speichern");
    this.contactSaveButton.type = "button";
    this.contactSaveButton.onclick = () => void this._saveContact();
    this.contactDeleteButton = node("button", "invoice-button invoice-button--quiet", "Kontakt entfernen");
    this.contactDeleteButton.type = "button";
    this.contactDeleteButton.onclick = () => void this._deleteContact();
    const actions = node("div", "customer-admin__contact-actions");
    actions.append(this.contactDeleteButton, this.contactSaveButton);

    section.append(head, this.contactList, grid, flags, actions);
    return section;
  }

  async open() {
    if (!this.root) return;
    this.root.hidden = false;
    await this.load({ keepSelection: true });
  }

  close() {
    if (this.root) this.root.hidden = true;
    this.onClose();
  }

  async load({ keepSelection = false } = {}) {
    const selectedId = keepSelection ? this.current?.customerId || "" : "";
    const response = await this.api().customerManagementList?.({
      includeArchived: this.includeArchived?.checked === true,
    });
    if (!response?.ok) {
      this._message(response?.error || "Kunden konnten nicht geladen werden.", true);
      return false;
    }
    this.customers = response.list || [];
    this._renderList();
    if (selectedId && this.customers.some((entry) => entry.customerId === selectedId)) {
      await this._selectCustomer(selectedId);
    } else if (!keepSelection) {
      this._clearCustomerEditor();
    }
    return true;
  }

  _renderList() {
    if (!this.list) return;
    this.list.replaceChildren();
    const visible = this.customers.filter((customer) => customerMatchesSearch(customer, this.searchInput?.value));
    if (!visible.length) {
      this.list.append(node("div", "customer-admin__empty", "Keine Kunden gefunden."));
      return;
    }
    for (const customer of visible) {
      const row = node("button", "customer-admin__row customer-admin__row--data");
      row.type = "button";
      row.dataset.selected = String(customer.customerId === this.current?.customerId);
      row.onclick = () => void this._selectCustomer(customer.customerId);
      row.append(
        node("span", "customer-admin__number", customer.customerNumber || ""),
        node("span", "customer-admin__name", customerDisplayName(customer)),
        node("span", "", customer.city || ""),
        node("span", "customer-admin__ellipsis", customer.email || ""),
        node("span", `customer-admin__status customer-admin__status--${String(customer.status || "").toLowerCase()}`, customer.status === "ARCHIVED" ? "Archiv" : "Aktiv")
      );
      this.list.append(row);
    }
  }

  async _selectCustomer(customerId) {
    const response = await this.api().customerManagementGet?.(customerId);
    if (!response?.ok || !response.customer) {
      this._message(response?.error || "Kunde konnte nicht geladen werden.", true);
      return;
    }
    this.current = response.customer;
    this._fillCustomerEditor(this.current);
    await this._loadContacts();
    this._renderList();
    this._message("");
  }

  _newCustomer() {
    this.current = null;
    this.contacts = [];
    this.currentContact = null;
    this._clearCustomerEditor();
    this._renderList();
    this.customerInputs.name1?.focus?.();
  }

  _fillCustomerEditor(customer) {
    for (const [key, control] of Object.entries(this.customerInputs)) {
      const value = customer?.[key];
      control.value = value === null || value === undefined ? "" : String(value);
    }
    this.editorTitle.textContent = customerDisplayName(customer) || "Kunde";
    this.editorMeta.textContent = [customer.customerNumber, customer.status === "ARCHIVED" ? "archiviert" : "aktiv"].filter(Boolean).join(" · ");
    this.archiveButton.hidden = false;
    this.archiveButton.textContent = customer.status === "ARCHIVED" ? "Reaktivieren" : "Archivieren";
    this._newContact();
  }

  _clearCustomerEditor() {
    for (const [key, control] of Object.entries(this.customerInputs || {})) {
      control.value = key === "countryCode" ? "DE" : "";
    }
    this.editorTitle.textContent = "Neuer Kunde";
    this.editorMeta.textContent = "";
    this.archiveButton.hidden = true;
    this.contacts = [];
    this._renderContacts();
    this._newContact();
  }

  _customerPayload() {
    const data = {};
    for (const [key, control] of Object.entries(this.customerInputs)) {
      const value = text(control.value);
      data[key] = key === "defaultPaymentTermDays"
        ? (value === "" ? null : Number(value))
        : (value || null);
    }
    data.countryCode = text(data.countryCode || "DE").toUpperCase();
    if (data.billingCountryCode) data.billingCountryCode = text(data.billingCountryCode).toUpperCase();
    return data;
  }

  _duplicateMessage(candidates = []) {
    return candidates
      .slice(0, 5)
      .map((entry) => `${entry.customerNumber || ""} ${entry.name1 || ""}`.trim())
      .filter(Boolean)
      .join("\n");
  }

  async _saveCustomer() {
    const payload = this._customerPayload();
    if (!payload.name1) return this._message("Firma / Name fehlt.", true);

    let response;
    if (!this.current) {
      response = await this.api().customerManagementCreate?.(payload);
      if (!response?.ok && response?.code === "CUSTOMER_DUPLICATE_REVIEW_REQUIRED") {
        const details = this._duplicateMessage(response.candidates);
        const confirmed = this.confirmFn(`Mögliche Dublette gefunden:\n\n${details}\n\nTrotzdem neuen Kunden anlegen?`);
        if (!confirmed) return this._message("Neuanlage abgebrochen.");
        response = await this.api().customerManagementCreate?.(payload, { confirmCreateDespiteCandidates: true });
      }
    } else {
      response = await this.api().customerManagementUpdate?.(
        this.current.customerId,
        payload,
        { expectedRevision: this.current.revision }
      );
      if (!response?.ok && response?.code === "CUSTOMER_DUPLICATE_REVIEW_REQUIRED") {
        const details = this._duplicateMessage(response.candidates);
        const confirmed = this.confirmFn(`Änderung ähnelt einem anderen Kunden:\n\n${details}\n\nÄnderung trotzdem speichern?`);
        if (!confirmed) return this._message("Änderung abgebrochen.");
        response = await this.api().customerManagementUpdate?.(
          this.current.customerId,
          payload,
          { expectedRevision: this.current.revision, confirmUpdateDespiteCandidates: true }
        );
      }
    }

    if (!response?.ok || !response.customer) {
      return this._message(response?.error || "Kunde konnte nicht gespeichert werden.", true);
    }
    this.current = response.customer;
    await this.load({ keepSelection: true });
    this._message("Kunde gespeichert.");
  }

  async _toggleArchive() {
    if (!this.current) return;
    const archived = this.current.status === "ARCHIVED";
    const confirmed = this.confirmFn(archived ? "Kunden reaktivieren?" : "Kunden archivieren?");
    if (!confirmed) return;
    const response = archived
      ? await this.api().customerManagementReactivate?.(this.current.customerId)
      : await this.api().customerManagementArchive?.(this.current.customerId);
    if (!response?.ok || !response.customer) return this._message(response?.error || "Status konnte nicht geändert werden.", true);
    this.current = response.customer;
    await this.load({ keepSelection: true });
    this._message(archived ? "Kunde reaktiviert." : "Kunde archiviert.");
  }

  async _loadContacts() {
    if (!this.current) {
      this.contacts = [];
      this._renderContacts();
      return;
    }
    const response = await this.api().customerManagementContactsList?.(this.current.customerId, { includeInactive: true });
    this.contacts = response?.ok ? response.list || [] : [];
    this._renderContacts();
  }

  _renderContacts() {
    if (!this.contactList) return;
    this.contactList.replaceChildren();
    if (!this.contacts.length) {
      this.contactList.append(node("div", "customer-admin__empty customer-admin__empty--small", "Keine Ansprechpartner."));
      return;
    }
    for (const contact of this.contacts) {
      const row = node("button", "customer-admin__contact-row");
      row.type = "button";
      row.dataset.selected = String(contact.id === this.currentContact?.id);
      row.onclick = () => this._selectContact(contact);
      const flags = [contact.isPrimary && "Haupt", contact.isBillingContact && "Rechnung", contact.isLicenseContact && "Lizenz", !contact.isActive && "inaktiv"].filter(Boolean).join(" · ");
      row.append(
        node("strong", "", [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "(ohne Name)"),
        node("span", "", contact.position || ""),
        node("span", "customer-admin__ellipsis", contact.email || ""),
        node("span", "customer-admin__contact-tags", flags)
      );
      this.contactList.append(row);
    }
  }

  _selectContact(contact) {
    this.currentContact = contact;
    for (const [key, control] of Object.entries(this.contactInputs)) control.value = contact?.[key] || "";
    this.contactPrimary.checked = contact?.isPrimary === true;
    this.contactBilling.checked = contact?.isBillingContact === true;
    this.contactLicense.checked = contact?.isLicenseContact === true;
    this.contactActive.checked = contact?.isActive !== false;
    this.contactDeleteButton.disabled = false;
    this._renderContacts();
  }

  _newContact() {
    this.currentContact = null;
    for (const control of Object.values(this.contactInputs || {})) control.value = "";
    if (this.contactPrimary) this.contactPrimary.checked = false;
    if (this.contactBilling) this.contactBilling.checked = false;
    if (this.contactLicense) this.contactLicense.checked = false;
    if (this.contactActive) this.contactActive.checked = true;
    if (this.contactDeleteButton) this.contactDeleteButton.disabled = true;
    this._renderContacts();
  }

  _contactPayload() {
    const data = {};
    for (const [key, control] of Object.entries(this.contactInputs)) data[key] = text(control.value) || null;
    data.isPrimary = this.contactPrimary.checked;
    data.isBillingContact = this.contactBilling.checked;
    data.isLicenseContact = this.contactLicense.checked;
    data.isActive = this.contactActive.checked;
    return data;
  }

  async _saveContact() {
    if (!this.current) return this._message("Kunde zuerst speichern.", true);
    const payload = this._contactPayload();
    if (!payload.firstName && !payload.lastName && !payload.email) return this._message("Kontakt benötigt Name oder E-Mail.", true);
    const response = this.currentContact
      ? await this.api().customerManagementContactUpdate?.(this.currentContact.id, payload)
      : await this.api().customerManagementContactCreate?.(this.current.customerId, payload);
    if (!response?.ok || !response.contact) return this._message(response?.error || "Kontakt konnte nicht gespeichert werden.", true);
    await this._loadContacts();
    this._selectContact(response.contact);
    this._message("Kontakt gespeichert.");
  }

  async _deleteContact() {
    if (!this.currentContact) return;
    if (!this.confirmFn("Ansprechpartner entfernen?")) return;
    const response = await this.api().customerManagementContactDelete?.(this.currentContact.id);
    if (!response?.ok) return this._message(response?.error || "Kontakt konnte nicht entfernt werden.", true);
    this._newContact();
    await this._loadContacts();
    this._message("Kontakt entfernt.");
  }

  _message(message, error = false) {
    if (!this.message) return;
    this.message.textContent = message || "";
    this.message.dataset.tone = error ? "error" : "";
  }
}
