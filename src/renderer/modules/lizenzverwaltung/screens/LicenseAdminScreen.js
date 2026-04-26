import { listCustomers, listLicensesByCustomer, saveCustomer, saveLicense } from "../licenseStorageService.js";

export function createGeneratedLicenseId(now = new Date()) {
  const part = (value) => String(value).padStart(2, "0");
  return `LIC-${now.getFullYear()}${part(now.getMonth() + 1)}${part(now.getDate())}-${part(now.getHours())}${part(
    now.getMinutes()
  )}${part(now.getSeconds())}`;
}

export function assertCustomerContext(customer) {
  const customerId = String(customer?.id || "").trim();
  if (!customerId) {
    throw new Error("CUSTOMER_CONTEXT_REQUIRED");
  }
  return customerId;
}


export function buildLicenseEditorPayload({ license = {}, inputs = {}, customer = null, now = new Date() } = {}) {
  const customerId = assertCustomerContext(customer);
  return {
    id: license.id,
    customer_id: customerId,
    license_id: String(inputs.license_id || "").trim() || createGeneratedLicenseId(now),
    product_scope_json: String(inputs.product_scope_json || "").trim(),
    valid_from: String(inputs.valid_from || "").trim(),
    valid_until: String(inputs.valid_until || "").trim(),
    license_mode: String(inputs.license_mode || "").trim(),
    machine_id: String(inputs.machine_id || "").trim(),
    notes: String(inputs.notes || "").trim(),
  };
}
function customerLabel(customer) {
  const number = String(customer?.customer_number || customer?.customerNumber || "-").trim() || "-";
  const company = String(customer?.company_name || customer?.companyName || "-").trim() || "-";
  return `${number} | ${company}`;
}

function valueOf(item, ...keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

export default class LicenseAdminScreen {
  constructor({ onBackToAdminbereich } = {}) {
    this.onBackToAdminbereich = onBackToAdminbereich;
    this.currentCustomer = null;
    this.currentView = "customers";
    this.root = null;
  }

  _button(label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.onclick = onClick;
    return btn;
  }

  async _renderCustomers(container) {
    const header = document.createElement("h3");
    header.textContent = "Kundenliste";

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const body = document.createElement("tbody");
    const hr = document.createElement("tr");
    ["Kundennummer", "Firma / Kundenname", "Ansprechpartner", "E-Mail"].forEach((name) => {
      const th = document.createElement("th");
      th.textContent = name;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.append(thead, body);

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.append(
      this._button("Neuer Kunde", () => {
        this.currentCustomer = null;
        this.currentView = "customer-detail";
        this._render();
      }),
      this._button("Zurueck zum Adminbereich", () => {
        if (typeof this.onBackToAdminbereich === "function") this.onBackToAdminbereich();
      })
    );

    const customers = await listCustomers();
    for (const customer of customers) {
      const row = document.createElement("tr");
      row.style.cursor = "pointer";
      row.onclick = () => {
        this.currentCustomer = customer;
        this.currentView = "customer-detail";
        this._render();
      };
      [
        valueOf(customer, "customer_number", "customerNumber") || "-",
        valueOf(customer, "company_name", "companyName") || "-",
        valueOf(customer, "contact_person", "contactPerson") || "-",
        valueOf(customer, "email") || "-",
      ].forEach((text) => {
        const td = document.createElement("td");
        td.textContent = text;
        row.appendChild(td);
      });
      body.appendChild(row);
    }

    container.append(header, actions, table);
  }

  async _renderCustomerDetail(container) {
    const customer = this.currentCustomer || {};

    const header = document.createElement("h3");
    header.textContent = this.currentCustomer ? `Kundendetail: ${customerLabel(customer)}` : "Neuer Kunde";

    const message = document.createElement("div");

    const fields = [
      ["customer_number", "Kundennummer"],
      ["company_name", "Firma / Kundenname"],
      ["contact_person", "Ansprechpartner"],
      ["email", "E-Mail"],
      ["phone", "Telefon"],
      ["notes", "Notizen"],
    ];

    const inputs = {};
    const form = document.createElement("div");
    form.style.display = "grid";
    form.style.gap = "8px";
    for (const [key, label] of fields) {
      const wrap = document.createElement("label");
      wrap.textContent = label;
      const input = key === "notes" ? document.createElement("textarea") : document.createElement("input");
      input.value = valueOf(customer, key, key.replace("_", ""));
      wrap.appendChild(input);
      inputs[key] = input;
      form.appendChild(wrap);
    }

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";

    const licenseSection = document.createElement("div");

    const saveBtn = this._button("Kunde speichern", async () => {
      try {
        const saved = await saveCustomer({
          id: customer.id,
          customer_number: inputs.customer_number.value,
          company_name: inputs.company_name.value,
          contact_person: inputs.contact_person.value,
          email: inputs.email.value,
          phone: inputs.phone.value,
          notes: inputs.notes.value,
        });
        this.currentCustomer = saved;
        message.textContent = "Kunde gespeichert.";
        await renderLicenses();
      } catch (err) {
        message.textContent = `Fehler: ${err?.message || err}`;
      }
    });

    const newLicenseBtn = this._button("Neue Lizenz", () => {
      this.currentView = "license-editor";
      this._render();
    });

    const backBtn = this._button("Zurueck zur Kundenliste", () => {
      this.currentView = "customers";
      this._render();
    });

    actions.append(saveBtn, newLicenseBtn, backBtn);

    const renderLicenses = async () => {
      licenseSection.replaceChildren();
      const title = document.createElement("h4");
      title.textContent = "Lizenzen dieses Kunden";
      licenseSection.appendChild(title);
      if (!this.currentCustomer?.id) {
        const hint = document.createElement("div");
        hint.textContent = "Lizenzen sind verfuegbar, sobald der Kunde gespeichert wurde.";
        licenseSection.appendChild(hint);
        return;
      }
      const records = await listLicensesByCustomer(this.currentCustomer.id);
      if (!records.length) {
        const empty = document.createElement("div");
        empty.textContent = "Noch keine Lizenz gespeichert.";
        licenseSection.appendChild(empty);
      }
      for (const record of records) {
        const row = document.createElement("button");
        row.type = "button";
        row.textContent = `${valueOf(record, "license_id", "licenseId") || "-"} | ${valueOf(
          record,
          "valid_from",
          "validFrom"
        )} - ${valueOf(record, "valid_until", "validUntil")} | ${valueOf(record, "license_mode", "licenseMode")}`;
        row.onclick = () => {
          this.currentView = "license-editor";
          this.currentLicense = record;
          this._render();
        };
        licenseSection.appendChild(row);
      }
    };

    await renderLicenses();
    container.append(header, form, actions, message, licenseSection);
  }

  async _renderLicenseEditor(container) {
    const customer = this.currentCustomer;
    const context = document.createElement("div");
    context.textContent = `Kunde: ${customerLabel(customer || {})}`;
    const message = document.createElement("div");

    const license = this.currentLicense || {};
    const fields = [
      ["license_id", "Lizenz-ID"],
      ["product_scope_json", "Produktumfang"],
      ["valid_from", "gueltig von"],
      ["valid_until", "gueltig bis"],
      ["license_mode", "Lizenzmodus"],
      ["machine_id", "Machine-ID"],
      ["notes", "Notizen"],
    ];

    const form = document.createElement("div");
    const inputs = {};
    form.style.display = "grid";
    for (const [key, label] of fields) {
      const wrap = document.createElement("label");
      wrap.textContent = label;
      const input = key === "notes" ? document.createElement("textarea") : document.createElement("input");
      input.value = valueOf(license, key, key.replace("_", ""));
      wrap.appendChild(input);
      inputs[key] = input;
      form.appendChild(wrap);
    }

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    const saveBtn = this._button("Merken", async () => {
      try {
        const payload = buildLicenseEditorPayload({
          license,
          customer,
          inputs: {
            license_id: inputs.license_id.value,
            product_scope_json: inputs.product_scope_json.value,
            valid_from: inputs.valid_from.value,
            valid_until: inputs.valid_until.value,
            license_mode: inputs.license_mode.value,
            machine_id: inputs.machine_id.value,
            notes: inputs.notes.value,
          },
        });
        const saved = await saveLicense(payload);
        this.currentLicense = saved;
        message.textContent = "Lizenz gespeichert.";
      } catch (err) {
        if (String(err?.message || "") === "CUSTOMER_CONTEXT_REQUIRED") {
          message.textContent = "Fehler: Speichern ohne geoeffneten Kunden ist unmoeglich.";
        } else {
          message.textContent = `Fehler: ${err?.message || err}`;
        }
      }
    });

    const clearBtn = this._button("Neu / leeren", () => {
      Object.values(inputs).forEach((el) => {
        el.value = "";
      });
      this.currentLicense = null;
      message.textContent = "Formular geleert.";
    });

    const backBtn = this._button("Zurueck zum Kunden", () => {
      this.currentLicense = null;
      this.currentView = "customer-detail";
      this._render();
    });

    actions.append(saveBtn, clearBtn, backBtn);
    container.append(context, form, actions, message);
  }

  async _render() {
    if (!this.root) return;
    this.root.replaceChildren();
    if (this.currentView === "customer-detail") {
      await this._renderCustomerDetail(this.root);
      return;
    }
    if (this.currentView === "license-editor") {
      await this._renderLicenseEditor(this.root);
      return;
    }
    await this._renderCustomers(this.root);
  }

  render() {
    this.root = document.createElement("div");
    this.root.style.display = "grid";
    this.root.style.gap = "10px";
    this._render();
    return this.root;
  }
}
