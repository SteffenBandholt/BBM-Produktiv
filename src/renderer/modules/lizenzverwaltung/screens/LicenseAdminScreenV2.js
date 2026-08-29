const BBM_MODULE_LABELS = Object.freeze({
  protokoll: "Protokoll",
  restarbeiten: "Restarbeiten",
  rechnung: "Rechnung",
});

const BBM_FEATURE_LABELS = Object.freeze({
  diktat: "Diktat",
  license_admin: "Lizenzverwaltung",
});

function valueOf(object, ...keys) {
  for (const key of keys) {
    const value = object?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function defaultFullExpiry() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function labelForFirm(firm = {}) {
  const name = String(valueOf(firm, "companyName", "company_name", "name") || "").trim();
  const short = String(valueOf(firm, "customerNumber", "customer_number", "short") || "").trim();
  return [short, name].filter(Boolean).join(" | ") || "(ohne Namen)";
}

function field(label, control) {
  const row = document.createElement("label");
  row.style.display = "grid";
  row.style.gridTemplateColumns = "170px minmax(240px, 1fr)";
  row.style.alignItems = "center";
  row.style.gap = "10px";
  const caption = document.createElement("span");
  caption.textContent = label;
  caption.style.fontSize = "13px";
  caption.style.fontWeight = "600";
  row.append(caption, control);
  return row;
}

function input(type = "text") {
  const element = document.createElement("input");
  element.type = type;
  element.style.width = "100%";
  element.style.boxSizing = "border-box";
  return element;
}

function select(options = []) {
  const element = document.createElement("select");
  element.style.width = "100%";
  for (const [value, label] of options) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    element.appendChild(option);
  }
  return element;
}

function button(label, handler, { primary = false } = {}) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.onclick = handler;
  element.style.padding = "8px 12px";
  element.style.borderRadius = "8px";
  element.style.cursor = "pointer";
  if (primary) element.style.fontWeight = "700";
  return element;
}

function card(title) {
  const root = document.createElement("section");
  root.style.display = "grid";
  root.style.gap = "10px";
  root.style.padding = "14px";
  root.style.border = "1px solid rgba(0,0,0,0.12)";
  root.style.borderRadius = "12px";
  root.style.background = "#fff";
  const heading = document.createElement("h3");
  heading.textContent = title;
  heading.style.margin = "0";
  root.appendChild(heading);
  return root;
}

function parseScope(raw) {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw || "{}") : raw || {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

export default class LicenseAdminScreenV2 {
  constructor({ onBackToAdminbereich } = {}) {
    this.onBackToAdminbereich = onBackToAdminbereich;
    this.root = null;
    this.currentCustomer = null;
    this.globalFirms = [];
    this.licenseCustomers = [];
    this.products = [];
    this.customerInputs = {};
    this.licenseInputs = {};
    this.moduleInputs = new Map();
    this.featureInputs = new Map();
    this.message = null;
    this.licenseList = null;
  }

  _api() {
    const api = globalThis?.window?.bbmDb;
    if (!api) throw new Error("BBM-Schnittstelle nicht verfügbar.");
    return api;
  }

  _setMessage(text, isError = false) {
    if (!this.message) return;
    this.message.textContent = String(text || "");
    this.message.style.color = isError ? "#b91c1c" : "#166534";
  }

  async _loadBaseData() {
    const api = this._api();
    const [firmResult, licenseCustomers, products, keyStatus] = await Promise.all([
      api.firmDirectoryListAll({ kind: "global" }),
      api.licenseAdminListLicenseCustomers(),
      api.licenseAdminListProducts(),
      api.licenseAdminKeyStatus(),
    ]);
    if (!firmResult?.ok) throw new Error(firmResult?.error || "Firmen konnten nicht geladen werden.");
    this.globalFirms = Array.isArray(firmResult.list) ? firmResult.list : [];
    this.licenseCustomers = Array.isArray(licenseCustomers) ? licenseCustomers : [];
    this.products = Array.isArray(products) ? products : [];
    return keyStatus;
  }

  _customerPayloadFromFirm(firm = {}) {
    return {
      id: String(firm.id || "").trim(),
      customer_number: String(valueOf(firm, "customer_number", "customerNumber", "short") || "").trim(),
      company_name: String(valueOf(firm, "company_name", "companyName", "name") || "").trim(),
      company_name2: String(valueOf(firm, "company_name2", "companyName2", "name2") || "").trim(),
      street: String(firm.street || "").trim(),
      zip: String(firm.zip || "").trim(),
      city: String(firm.city || "").trim(),
      trade: String(valueOf(firm, "trade", "gewerk") || "").trim(),
      contact_person: String(valueOf(firm, "contact_person", "contactPerson") || "").trim(),
      email: String(firm.email || "").trim(),
      phone: String(firm.phone || "").trim(),
      notes: String(firm.notes || "").trim(),
    };
  }

  _readCustomerForm() {
    const out = {};
    for (const [key, element] of Object.entries(this.customerInputs)) out[key] = String(element.value || "").trim();
    if (this.currentCustomer?.id) out.id = this.currentCustomer.id;
    return out;
  }

  _fillCustomerForm(customer = null) {
    const values = this._customerPayloadFromFirm(customer || {});
    for (const [key, element] of Object.entries(this.customerInputs)) element.value = values[key] || "";
  }

  _buildCustomerSection() {
    const section = card("Kunde");
    const hint = document.createElement("div");
    hint.textContent = "Bestehende BBM-Firma auswählen oder einen neuen Kunden anlegen. Die Firma wird nicht doppelt gespeichert.";
    hint.style.fontSize = "12px";
    hint.style.color = "#475569";

    const search = input("search");
    search.placeholder = "Firma suchen …";
    const chooser = select([["", "— Kunde auswählen —"]]);

    const refillChooser = () => {
      const query = String(search.value || "").trim().toLowerCase();
      chooser.replaceChildren();
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "— Kunde auswählen —";
      chooser.appendChild(empty);
      this.globalFirms
        .filter((firm) => !query || labelForFirm(firm).toLowerCase().includes(query))
        .forEach((firm) => {
          const option = document.createElement("option");
          option.value = firm.id;
          option.textContent = labelForFirm(firm);
          chooser.appendChild(option);
        });
    };
    search.addEventListener("input", refillChooser);
    chooser.addEventListener("change", () => {
      const firm = this.globalFirms.find((entry) => String(entry.id) === String(chooser.value)) || null;
      this.currentCustomer = firm;
      this._fillCustomerForm(firm);
      this._refreshLicenseList();
    });

    const fields = [
      ["customer_number", "Kundennummer", "text"],
      ["company_name", "Firma / Kundenname", "text"],
      ["company_name2", "Zusatz", "text"],
      ["street", "Straße", "text"],
      ["zip", "PLZ", "text"],
      ["city", "Ort", "text"],
      ["trade", "Branche / Gewerk", "text"],
      ["contact_person", "Ansprechpartner", "text"],
      ["email", "E-Mail", "email"],
      ["phone", "Telefon", "text"],
    ];
    for (const [key, label, type] of fields) {
      const control = input(type);
      this.customerInputs[key] = control;
      section.appendChild(field(label, control));
    }
    const notes = document.createElement("textarea");
    notes.rows = 3;
    notes.style.width = "100%";
    notes.style.boxSizing = "border-box";
    this.customerInputs.notes = notes;
    section.appendChild(field("Notiz", notes));

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.style.flexWrap = "wrap";
    actions.append(
      button("Neu", () => {
        this.currentCustomer = null;
        chooser.value = "";
        this._fillCustomerForm(null);
        this._refreshLicenseList();
      }),
      button("Kunde speichern", async () => {
        try {
          const payload = this._readCustomerForm();
          if (!payload.company_name) throw new Error("Firma / Kundenname fehlt.");
          const saved = await this._api().licenseAdminSaveLicenseCustomer(payload);
          this.currentCustomer = saved;
          await this._reloadCustomers();
          this._fillCustomerForm(saved);
          this._setMessage("Kunde gespeichert und als Lizenzkunde geführt.");
          await this._refreshLicenseList();
        } catch (error) {
          this._setMessage(error?.message || error, true);
        }
      }, { primary: true })
    );

    section.prepend(hint, field("Suche", search), field("Vorhandene Firma", chooser));
    section.appendChild(actions);
    this.customerChooser = chooser;
    this.customerSearch = search;
    refillChooser();
    return section;
  }

  async _reloadCustomers() {
    const api = this._api();
    const [firmResult, licenseCustomers] = await Promise.all([
      api.firmDirectoryListAll({ kind: "global" }),
      api.licenseAdminListLicenseCustomers(),
    ]);
    this.globalFirms = Array.isArray(firmResult?.list) ? firmResult.list : [];
    this.licenseCustomers = Array.isArray(licenseCustomers) ? licenseCustomers : [];
    if (this.customerSearch) this.customerSearch.dispatchEvent(new Event("input"));
    if (this.currentCustomer?.id && this.customerChooser) this.customerChooser.value = this.currentCustomer.id;
  }

  _selectedProduct() {
    const key = String(this.licenseInputs.product?.value || "bbm").trim().toLowerCase();
    return this.products.find((entry) => entry.product === key) || this.products[0] || {
      product: "bbm",
      label: "BBM",
      moduleIds: ["protokoll", "restarbeiten", "rechnung"],
      featureIds: ["diktat"],
    };
  }

  _renderProductOptions() {
    const product = this._selectedProduct();
    const moduleWrap = this.moduleWrap;
    const featureWrap = this.featureWrap;
    if (!moduleWrap || !featureWrap) return;
    moduleWrap.replaceChildren();
    featureWrap.replaceChildren();
    this.moduleInputs.clear();
    this.featureInputs.clear();

    for (const moduleId of product.moduleIds || []) {
      const label = document.createElement("label");
      label.style.display = "inline-flex";
      label.style.gap = "6px";
      label.style.alignItems = "center";
      label.style.marginRight = "14px";
      const checkbox = input("checkbox");
      checkbox.style.width = "auto";
      checkbox.checked = true;
      label.append(checkbox, document.createTextNode(BBM_MODULE_LABELS[moduleId] || moduleId));
      moduleWrap.appendChild(label);
      this.moduleInputs.set(moduleId, checkbox);
    }

    for (const featureId of product.featureIds || []) {
      if (featureId === "license_admin") continue;
      const label = document.createElement("label");
      label.style.display = "inline-flex";
      label.style.gap = "6px";
      label.style.alignItems = "center";
      label.style.marginRight = "14px";
      const checkbox = input("checkbox");
      checkbox.style.width = "auto";
      checkbox.checked = false;
      label.append(checkbox, document.createTextNode(BBM_FEATURE_LABELS[featureId] || featureId));
      featureWrap.appendChild(label);
      this.featureInputs.set(featureId, checkbox);
    }
  }

  _syncEdition() {
    const test = this.licenseInputs.edition.value === "test";
    this.licenseInputs.trialDays.disabled = !test;
    this.licenseInputs.validUntil.disabled = test;
    this.licenseInputs.binding.disabled = test;
    if (test) this.licenseInputs.binding.value = "none";
    this.licenseInputs.machineId.disabled = test || this.licenseInputs.binding.value !== "machine";
  }

  _buildLicenseSection() {
    const section = card("Neue Lizenz");
    const productOptions = (this.products.length ? this.products : [{ product: "bbm", label: "BBM" }])
      .map((entry) => [entry.product, entry.label || entry.product]);
    const product = select(productOptions);
    const edition = select([["test", "Test"], ["full", "Vollversion"]]);
    const binding = select([["none", "Nein"], ["machine", "Ja"]]);
    const validUntil = input("date");
    validUntil.value = defaultFullExpiry();
    const trialDays = input("number");
    trialDays.min = "1";
    trialDays.value = "30";
    const maxDevices = input("number");
    maxDevices.min = "1";
    maxDevices.value = "1";
    const machineId = input("text");
    machineId.placeholder = "Nur bei Gerätebindung";
    const notes = document.createElement("textarea");
    notes.rows = 3;
    notes.style.width = "100%";
    notes.style.boxSizing = "border-box";

    this.licenseInputs = { product, edition, binding, validUntil, trialDays, maxDevices, machineId, notes };
    product.addEventListener("change", () => this._renderProductOptions());
    edition.addEventListener("change", () => this._syncEdition());
    binding.addEventListener("change", () => this._syncEdition());

    this.moduleWrap = document.createElement("div");
    this.featureWrap = document.createElement("div");
    this.moduleWrap.style.padding = "6px 0";
    this.featureWrap.style.padding = "6px 0";

    section.append(
      field("Produkt", product),
      field("Lizenzart", edition),
      field("Testdauer (Tage)", trialDays),
      field("Gültig bis", validUntil),
      field("Gerätebindung", binding),
      field("Machine-ID", machineId),
      field("Anzahl Geräte", maxDevices),
      field("Module", this.moduleWrap),
      field("Zusatzfunktionen", this.featureWrap),
      field("Notiz", notes)
    );

    const create = button("Lizenz erstellen", async () => this._issueLicense(), { primary: true });
    section.appendChild(create);
    this._renderProductOptions();
    this._syncEdition();
    return section;
  }

  async _ensureCurrentLicenseCustomer() {
    if (!this.currentCustomer?.id) throw new Error("Bitte zuerst einen Kunden auswählen oder anlegen.");
    const already = this.licenseCustomers.some((entry) => String(entry.id) === String(this.currentCustomer.id));
    if (already) return this.licenseCustomers.find((entry) => String(entry.id) === String(this.currentCustomer.id));
    const saved = await this._api().licenseAdminSaveLicenseCustomer(this._customerPayloadFromFirm(this.currentCustomer));
    this.currentCustomer = saved;
    await this._reloadCustomers();
    return saved;
  }

  async _issueLicense() {
    try {
      this._setMessage("Lizenz wird erstellt …");
      const customer = await this._ensureCurrentLicenseCustomer();
      const product = this._selectedProduct();
      const edition = this.licenseInputs.edition.value;
      const binding = edition === "test" ? "none" : this.licenseInputs.binding.value;
      const modules = [...this.moduleInputs.entries()].filter(([, control]) => control.checked).map(([key]) => key);
      const features = [...this.featureInputs.entries()].filter(([, control]) => control.checked).map(([key]) => key);
      if (!modules.length) throw new Error("Mindestens ein Modul muss ausgewählt sein.");
      const maxDevices = Math.max(1, Number(this.licenseInputs.maxDevices.value || 1));
      const validUntil = edition === "full" ? this.licenseInputs.validUntil.value : "";
      const trialDurationDays = edition === "test" ? Math.max(1, Number(this.licenseInputs.trialDays.value || 30)) : null;
      const machineId = binding === "machine" ? String(this.licenseInputs.machineId.value || "").trim() : "";
      if (edition === "full" && !validUntil) throw new Error("Bitte ein Ablaufdatum angeben.");
      if (binding === "machine" && !machineId) throw new Error("Für die Gerätebindung fehlt die Machine-ID.");

      const scope = {
        product: product.product,
        module: modules,
        zusatzfunktionen: features,
        maxDevices,
      };
      const savedRecord = await this._api().licenseAdminSaveLicenseRecord({
        customer_id: customer.id,
        product_scope_json: JSON.stringify(scope),
        valid_from: todayIso(),
        valid_until: validUntil,
        trial_duration_days: trialDurationDays,
        license_edition: edition,
        license_binding: binding,
        machine_id: machineId,
        notes: String(this.licenseInputs.notes.value || "").trim(),
      });

      const result = await this._api().licenseAdminIssue({
        product: product.product,
        customerName: String(valueOf(customer, "companyName", "company_name", "name") || "").trim(),
        licenseId: String(valueOf(savedRecord, "licenseId", "license_id") || "").trim(),
        edition,
        binding,
        validUntil,
        trialDurationDays,
        machineId,
        maxDevices,
        modules,
        features,
        notes: String(this.licenseInputs.notes.value || "").trim(),
      });

      await this._api().licenseAdminSaveLicenseRecord({
        ...savedRecord,
        license_file_path: result.outputPath,
        license_file_created_at: new Date().toISOString(),
      });
      await this._api().licenseAdminAddLicenseHistoryEntry({
        license_record_id: savedRecord.id,
        generated_at: new Date().toISOString(),
        product_scope_json: JSON.stringify(scope),
        valid_until: validUntil,
        output_path: result.outputPath,
        notes: String(this.licenseInputs.notes.value || "").trim(),
      });

      this._setMessage(`Lizenz erstellt: ${result.outputPath}`);
      await this._refreshLicenseList();
    } catch (error) {
      const code = String(error?.message || error || "");
      if (code.includes("LICENSE_PRIVATE_KEY_NOT_CONFIGURED")) {
        this._setMessage("Der private Signaturschlüssel ist auf diesem Rechner noch nicht für die Lizenzverwaltung eingerichtet.", true);
      } else {
        this._setMessage(code || "Lizenz konnte nicht erstellt werden.", true);
      }
    }
  }

  _buildLicenseListSection() {
    const section = card("Lizenzen des Kunden");
    this.licenseList = document.createElement("div");
    this.licenseList.style.display = "grid";
    this.licenseList.style.gap = "6px";
    section.appendChild(this.licenseList);
    return section;
  }

  async _refreshLicenseList() {
    if (!this.licenseList) return;
    this.licenseList.replaceChildren();
    if (!this.currentCustomer?.id) {
      this.licenseList.textContent = "Noch kein Kunde ausgewählt.";
      return;
    }
    try {
      const licenses = await this._api().licenseAdminListLicenseRecordsByCustomer(this.currentCustomer.id);
      if (!licenses.length) {
        this.licenseList.textContent = "Für diesen Kunden gibt es noch keine Lizenz.";
        return;
      }
      for (const license of licenses) {
        const scope = parseScope(valueOf(license, "product_scope_json", "productScope"));
        const row = document.createElement("div");
        row.style.padding = "8px 10px";
        row.style.border = "1px solid rgba(0,0,0,0.08)";
        row.style.borderRadius = "8px";
        const modules = Array.isArray(scope.module) ? scope.module.map((key) => BBM_MODULE_LABELS[key] || key).join(", ") : "-";
        const edition = String(valueOf(license, "licenseEdition", "license_edition") || "");
        const until = String(valueOf(license, "valid_until", "validUntil") || "");
        row.textContent = `${valueOf(license, "licenseId", "license_id") || "-"} | ${edition === "test" ? "Test" : "Vollversion"} | ${modules}${until ? ` | bis ${until}` : ""}`;
        this.licenseList.appendChild(row);
      }
    } catch (error) {
      this.licenseList.textContent = `Fehler: ${error?.message || error}`;
    }
  }

  async _render() {
    this.root.replaceChildren();
    const title = document.createElement("h2");
    title.textContent = "Lizenzen";
    title.style.margin = "0";

    const keyInfo = document.createElement("div");
    keyInfo.style.fontSize = "12px";
    keyInfo.style.color = "#475569";

    this.message = document.createElement("div");
    this.message.style.minHeight = "20px";
    this.message.style.fontSize = "13px";

    try {
      const keyStatus = await this._loadBaseData();
      keyInfo.textContent = keyStatus?.configured
        ? "Signaturdienst ist bereit."
        : "Signaturdienst: privater Schlüssel auf diesem Rechner nicht eingerichtet.";

      const actions = document.createElement("div");
      if (typeof this.onBackToAdminbereich === "function") {
        actions.appendChild(button("Zurück", () => this.onBackToAdminbereich()));
      }

      this.root.append(title, keyInfo, actions, this._buildCustomerSection(), this._buildLicenseSection(), this._buildLicenseListSection(), this.message);
      await this._refreshLicenseList();
    } catch (error) {
      this.root.append(title, keyInfo, this.message);
      this._setMessage(error?.message || error, true);
    }
  }

  render() {
    this.root = document.createElement("div");
    this.root.style.display = "grid";
    this.root.style.gap = "12px";
    this.root.style.maxWidth = "980px";
    this.root.style.margin = "0 auto";
    this._render();
    return this.root;
  }
}
