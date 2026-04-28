import {
  createCustomerSetup,
  listCustomers,
  listLicensesByCustomer,
  saveCustomer,
  saveLicense,
} from "../licenseStorageService.js";

const PRODUCT_KEY = "bbm-produktiv";
const PRODUCT_LABEL = "BBM-Produktiv";
const GENERATOR_PRODUCT_KEY = "bbm-protokoll";
const STANDARD_SCOPE_KEYS = Object.freeze(["app", "pdf", "export"]);
const ADDITIONAL_FEATURES = Object.freeze([
  Object.freeze({ key: "mail", label: "Mail" }),
  Object.freeze({ key: "dictate", label: "Dictate", aliases: ["audio"] }),
]);
const MODULE_KEYS = Object.freeze([
  Object.freeze({ key: "protokoll", label: "Protokoll" }),
  Object.freeze({ key: "dummy", label: "Dummy" }),
]);

function toUniqueNormalizedArray(values = []) {
  const seen = new Set();
  const output = [];
  values.forEach((value) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    output.push(normalized);
  });
  return output;
}

function normalizeAdditionalFeatureKey(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "audio") return "dictate";
  return normalized;
}

function normalizeModuleKey(value) {
  return String(value || "").trim().toLowerCase();
}

function parseProductScopeObject(rawValue) {
  const trimmed = String(rawValue || "").trim();
  const fallback = {
    original: {},
    product: PRODUCT_KEY,
    standardumfang: [...STANDARD_SCOPE_KEYS],
    zusatzfunktionen: [],
    module: [],
    raw: "",
  };

  if (!trimmed) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...fallback, raw: trimmed };
    }

    const standardumfang = toUniqueNormalizedArray(parsed.standardumfang || []).filter((key) =>
      STANDARD_SCOPE_KEYS.includes(key)
    );

    const extraKeys = toUniqueNormalizedArray(parsed.zusatzfunktionen || [])
      .map((key) => normalizeAdditionalFeatureKey(key))
      .filter((key) => ADDITIONAL_FEATURES.some((entry) => entry.key === key));

    const moduleKeys = toUniqueNormalizedArray(parsed.module || []).filter((key) =>
      MODULE_KEYS.some((entry) => entry.key === key)
    );

    return {
      original: parsed,
      product: String(parsed.product || "").trim().toLowerCase() || PRODUCT_KEY,
      standardumfang: standardumfang.length ? standardumfang : [...STANDARD_SCOPE_KEYS],
      zusatzfunktionen: extraKeys,
      module: moduleKeys,
      raw: String(parsed.raw || "").trim(),
    };
  } catch (_err) {
    return { ...fallback, raw: trimmed };
  }
}

function formatEntryLabel(key, entries = []) {
  const found = entries.find((entry) => entry.key === String(key || "").trim().toLowerCase());
  return found?.label || String(key || "").trim();
}

export function buildStructuredProductScopeJson(model = {}, previous = {}) {
  const previousObject = previous && typeof previous === "object" && !Array.isArray(previous) ? previous : {};
  const raw = String(previousObject.raw || model.raw || "").trim();
  return {
    ...previousObject,
    product: PRODUCT_KEY,
    standardumfang: [...STANDARD_SCOPE_KEYS],
    zusatzfunktionen: toUniqueNormalizedArray(model.zusatzfunktionen || [])
      .map((key) => normalizeAdditionalFeatureKey(key))
      .filter((key) => ADDITIONAL_FEATURES.some((entry) => entry.key === key)),
    module: toUniqueNormalizedArray(model.module || []).filter((key) => MODULE_KEYS.some((entry) => entry.key === key)),
    ...(raw ? { raw } : {}),
  };
}

export function createDefaultScopeSelection() {
  return {
    raw: "",
    zusatzfunktionen: [],
    module: [],
    previous: {},
  };
}

export function resetScopeSelectionToDefault(selection = {}) {
  selection.raw = "";
  selection.zusatzfunktionen = [];
  selection.module = [];
  selection.previous = {};
  return selection;
}

export function createGeneratedLicenseId(now = new Date()) {
  const part = (value) => String(value).padStart(2, "0");
  return `LIC-${now.getFullYear()}${part(now.getMonth() + 1)}${part(now.getDate())}-${part(now.getHours())}${part(
    now.getMinutes()
  )}${part(now.getSeconds())}`;
}

export function tryGenerateLicenseId(currentValue, now = new Date()) {
  const existing = String(currentValue || "").trim();
  if (existing) {
    return { value: existing, generated: false, reason: "already-set" };
  }
  return { value: createGeneratedLicenseId(now), generated: true, reason: null };
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
  const normalizedTrialDurationDays = normalizeTrialDurationDays(inputs.trial_duration_days, 30);
  const isTestLicense = String(inputs.license_edition || "").trim().toLowerCase() === "test";
  return {
    id: license.id,
    customer_id: customerId,
    license_id: String(inputs.license_id || "").trim() || createGeneratedLicenseId(now),
    product_scope_json: String(inputs.product_scope_json || "").trim(),
    valid_from: String(inputs.valid_from || "").trim(),
    valid_until: isTestLicense ? "" : String(inputs.valid_until || "").trim(),
    trial_duration_days: isTestLicense ? String(normalizedTrialDurationDays) : "",
    license_mode: String(inputs.license_mode || "").trim(),
    machine_id: String(inputs.machine_id || "").trim(),
    license_file_path: valueOf(license, "license_file_path", "licenseFilePath"),
    license_file_created_at: valueOf(license, "license_file_created_at", "licenseFileCreatedAt"),
    notes: String(inputs.notes || "").trim(),
  };
}

export function buildCustomerEditorPayload({ customer = {}, inputs = {} } = {}) {
  return {
    id: customer.id,
    customer_number: String(inputs.customer_number || "").trim(),
    company_name: String(inputs.company_name || "").trim(),
    contact_person: String(inputs.contact_person || "").trim(),
    email: String(inputs.email || "").trim(),
    phone: String(inputs.phone || "").trim(),
    notes: String(inputs.notes || "").trim(),
  };
}

export function mapLicenseModeToGeneratorBinding(licenseMode) {
  const normalized = String(licenseMode || "").trim().toLowerCase();
  if (normalized === "full") return "machine";
  if (normalized === "machine") return "machine";
  if (normalized === "soft") return "none";
  if (normalized === "none") return "none";
  return "";
}

export function mapLegacyLicenseModeToEditionAndBinding(licenseMode) {
  const normalized = String(licenseMode || "").trim().toLowerCase();
  if (normalized === "full") return { edition: "full", binding: "machine" };
  if (normalized === "machine") return { edition: "full", binding: "machine" };
  if (normalized === "none") return { edition: "test", binding: "none" };
  if (normalized === "soft") return { edition: "test", binding: "none" };
  return { edition: "test", binding: "none" };
}

export function normalizeDateForGenerator(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const date = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return "";
    if (
      date.getUTCFullYear() !== Number(isoMatch[1]) ||
      date.getUTCMonth() + 1 !== Number(isoMatch[2]) ||
      date.getUTCDate() !== Number(isoMatch[3])
    ) {
      return "";
    }
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const deMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!deMatch) return "";
  const day = Number(deMatch[1]);
  const month = Number(deMatch[2]);
  const year = Number(deMatch[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return "";
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return "";
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function normalizeTrialDurationDays(value, fallback = 30) {
  const raw = String(value ?? "").trim();
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  const days = Math.floor(parsed);
  if (days < 1 || days > 365) return fallback;
  return days;
}

export function getLicenseEditionAndBinding(license = {}) {
  const editionRaw = String(valueOf(license, "license_edition", "licenseEdition")).trim().toLowerCase();
  const bindingRaw = String(valueOf(license, "license_binding", "licenseBinding")).trim().toLowerCase();
  const hasEdition = editionRaw === "test" || editionRaw === "full";
  const hasBinding = bindingRaw === "none" || bindingRaw === "machine";
  const legacy = mapLegacyLicenseModeToEditionAndBinding(valueOf(license, "license_mode", "licenseMode"));
  return {
    edition: hasEdition ? editionRaw : legacy.edition,
    binding: hasBinding ? bindingRaw : legacy.binding,
  };
}

export function parseGeneratorFeaturesFromProductScope(rawValue) {
  const trimmed = String(rawValue || "").trim();
  if (!trimmed) return [];

  let parsed = null;
  try {
    parsed = JSON.parse(trimmed);
  } catch (_err) {
    return [];
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];

  const features = new Set();

  toUniqueNormalizedArray(parsed.standardumfang || [])
    .filter((key) => STANDARD_SCOPE_KEYS.includes(key))
    .forEach((key) => features.add(key));

  toUniqueNormalizedArray(parsed.zusatzfunktionen || [])
    .map((key) => normalizeAdditionalFeatureKey(key))
    .filter((key) => ADDITIONAL_FEATURES.some((entry) => entry.key === key))
    .forEach((key) => features.add(key));

  toUniqueNormalizedArray(parsed.module || [])
    .map((key) => normalizeModuleKey(key))
    .filter((key) => MODULE_KEYS.some((entry) => entry.key === key))
    .forEach((key) => features.add(key));

  return [...features];
}

export function buildLicenseGeneratorPayload({ customer = {}, license = {} } = {}) {
  const customerName =
    valueOf(customer, "company_name", "companyName") || valueOf(customer, "customer_number", "customerNumber");
  const licenseId = valueOf(license, "license_id", "licenseId");
  const validFrom = normalizeDateForGenerator(valueOf(license, "valid_from", "validFrom"));
  const validUntil = normalizeDateForGenerator(valueOf(license, "valid_until", "validUntil"));
  const model = getLicenseEditionAndBinding(license);
  const binding = model.binding;
  const edition = model.edition;
  const trialDurationDays = normalizeTrialDurationDays(valueOf(license, "trial_duration_days", "trialDurationDays"), 30);
  const features = parseGeneratorFeaturesFromProductScope(valueOf(license, "product_scope_json", "productScope"));
  const machineId = valueOf(license, "machine_id", "machineId");
  return {
    customerName,
    licenseId,
    product: GENERATOR_PRODUCT_KEY,
    edition,
    binding,
    validFrom,
    validUntil: edition === "test" && binding === "none" ? "" : validUntil,
    ...(edition === "test" && binding === "none" ? { trialDurationDays } : {}),
    maxDevices: 1,
    ...(binding === "machine" && machineId ? { machineId } : {}),
    features,
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

function truncateText(value, maxLen = 280) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length <= maxLen) return raw;
  return `${raw.slice(0, maxLen)} ...`;
}

function tailLines(value, maxLines = 6) {
  const lines = String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return "";
  return lines.slice(-Math.max(1, maxLines)).join(" | ");
}

export function buildCustomerSetupPayload({ customer = {}, license = {}, setupType = "test" } = {}) {
  const normalizedSetupType = String(setupType || "").trim().toLowerCase() === "machine" ? "machine" : "test";
  const licenseFilePath = normalizedSetupType === "test" ? valueOf(license, "license_file_path", "licenseFilePath") : "";
  return {
    customer,
    license,
    setupType: normalizedSetupType,
    licenseFilePath,
  };
}

export function formatProductScopeForList(entry = {}) {
  const fromObject = entry?.productScope;
  if (fromObject && typeof fromObject === "object" && !Array.isArray(fromObject)) {
    const label = buildProductScopeLabel(fromObject);
    if (label) return label;
  }

  const rawJson = String(entry?.product_scope_json || "").trim();
  if (!rawJson) return "-";

  try {
    const parsed = JSON.parse(rawJson);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (String(parsed.raw || "").trim() && !parsed.product && !Array.isArray(parsed.standardumfang) && !Array.isArray(parsed.zusatzfunktionen) && !Array.isArray(parsed.module)) {
        return String(parsed.raw).trim();
      }
      const label = buildProductScopeLabel(parsed);
      if (label) return label;
      if (String(parsed.raw || "").trim()) return String(parsed.raw).trim();
      return "-";
    }
    return rawJson;
  } catch (_err) {
    return rawJson;
  }
}

function buildProductScopeLabel(scope = {}) {
  const parts = [];

  const product = String(scope.product || "").trim().toLowerCase();
  if (product === PRODUCT_KEY) {
    parts.push(PRODUCT_LABEL);
  } else if (product) {
    parts.push(product);
  }

  const standardEntries = toUniqueNormalizedArray(scope.standardumfang || [])
    .filter((key) => STANDARD_SCOPE_KEYS.includes(key))
    .map((key) => ({ app: "App", pdf: "PDF", export: "Export" }[key] || key));
  if (standardEntries.length) {
    parts.push(standardEntries.join(", "));
  }

  const extras = toUniqueNormalizedArray(scope.zusatzfunktionen || [])
    .map((key) => normalizeAdditionalFeatureKey(key))
    .filter((key) => ADDITIONAL_FEATURES.some((entry) => entry.key === key))
    .map((key) => formatEntryLabel(key, ADDITIONAL_FEATURES));
  if (extras.length) {
    parts.push(extras.join(", "));
  }

  const modules = toUniqueNormalizedArray(scope.module || [])
    .filter((key) => MODULE_KEYS.some((entry) => entry.key === key))
    .map((key) => formatEntryLabel(key, MODULE_KEYS));
  if (modules.length) {
    const prefix = modules.length === 1 ? "Modul" : "Module";
    parts.push(`${prefix}: ${modules.join(", ")}`);
  }

  if (!parts.length) return "";
  return parts.join(" | ");
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
    const title = document.createElement("h2");
    title.textContent = "Lizenzverwaltung";

    const header = document.createElement("h3");
    header.textContent = "Kunden";

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
    if (!customers.length) {
      const empty = document.createElement("caption");
      empty.textContent = "Noch keine Kunden gespeichert.";
      table.appendChild(empty);
    }
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

    container.append(title, header, actions, table);
  }

  async _renderCustomerDetail(container) {
    const customer = this.currentCustomer || {};

    const header = document.createElement("h3");
    header.textContent = `Kundendetail: ${customerLabel(customer)}`;

    const message = document.createElement("div");
    message.style.minHeight = "20px";
    message.style.fontSize = "13px";

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
    form.style.gridTemplateColumns = "180px minmax(260px, 1fr)";
    form.style.columnGap = "12px";
    form.style.rowGap = "8px";
    for (const [key, label] of fields) {
      const title = document.createElement("label");
      title.textContent = label;
      title.style.alignSelf = "center";
      const input = key === "notes" ? document.createElement("textarea") : document.createElement("input");
      if (key === "notes") input.rows = 4;
      input.value = valueOf(customer, key, key.replace("_", ""));
      input.style.width = "100%";
      title.htmlFor = `customer-${key}`;
      input.id = `customer-${key}`;
      inputs[key] = input;
      form.append(title, input);
    }

    const customerActions = document.createElement("div");
    customerActions.style.display = "flex";
    customerActions.style.gap = "8px";

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.style.justifyContent = "space-between";
    actions.style.alignItems = "center";

    const licenseSection = document.createElement("div");
    const customerSection = document.createElement("div");
    customerSection.style.display = "grid";
    customerSection.style.gap = "8px";
    customerSection.style.border = "1px solid #ddd";
    customerSection.style.borderRadius = "8px";
    customerSection.style.padding = "12px";
    const customerTitle = document.createElement("h4");
    customerTitle.textContent = "Kundendaten";

    const saveBtn = this._button("Kunde speichern", async () => {
      try {
        const saved = await saveCustomer(
          buildCustomerEditorPayload({
            customer,
            inputs: {
              customer_number: inputs.customer_number.value,
              company_name: inputs.company_name.value,
              contact_person: inputs.contact_person.value,
              email: inputs.email.value,
              phone: inputs.phone.value,
              notes: inputs.notes.value,
            },
          })
        );
        this.currentCustomer = saved;
        newLicenseBtn.disabled = false;
        message.textContent = "Kunde gespeichert.";
        await renderLicenses();
      } catch (err) {
        message.textContent = `Fehler: ${err?.message || err}`;
      }
    });

    const newLicenseBtn = this._button("Neue Lizenz", () => {
      if (!this.currentCustomer?.id) {
        message.textContent = "Bitte zuerst den Kunden speichern.";
        return;
      }
      this.currentView = "license-editor";
      this.currentLicense = null;
      this._render();
    });
    newLicenseBtn.disabled = !this.currentCustomer?.id;

    const backBtn = this._button("Zurueck zur Kundenliste", () => {
      this.currentView = "customers";
      this._render();
    });

    customerActions.append(saveBtn, backBtn);

    const renderLicenses = async () => {
      licenseSection.replaceChildren();
      const title = document.createElement("h4");
      title.textContent = "Lizenzen dieses Kunden";
      licenseSection.appendChild(title);
      licenseSection.style.border = "1px solid #ddd";
      licenseSection.style.borderRadius = "8px";
      licenseSection.style.padding = "12px";
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
      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const tbody = document.createElement("tbody");
      const tr = document.createElement("tr");
      ["Lizenz-ID", "Lizenzart", "Gerätebindung", "Produktumfang", "gueltig von", "gueltig bis", "Aktion"].forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      table.append(thead, tbody);

      for (const record of records) {
        const row = document.createElement("tr");
        const mode = getLicenseEditionAndBinding(record);
        [
          valueOf(record, "license_id", "licenseId") || "-",
          mode.edition === "full" ? "Vollversion" : "Testlizenz",
          mode.binding === "machine" ? "An Machine-ID binden" : "Ohne Gerätebindung",
          formatProductScopeForList(record),
          valueOf(record, "valid_from", "validFrom") || "-",
          valueOf(record, "valid_until", "validUntil") || "-",
        ].forEach((text) => {
          const td = document.createElement("td");
          td.textContent = text;
          row.appendChild(td);
        });
        const actionCell = document.createElement("td");
        const openBtn = this._button("Öffnen", () => {
          this.currentView = "license-editor";
          this.currentLicense = record;
          this._render();
        });
        actionCell.appendChild(openBtn);
        row.appendChild(actionCell);
        tbody.appendChild(row);
      }
      licenseSection.appendChild(table);
    };

    await renderLicenses();
    actions.append(newLicenseBtn);
    customerSection.append(customerTitle, form, customerActions);
    container.append(header, customerSection, licenseSection, actions, message);
  }

  async _renderLicenseEditor(container) {
    const customer = this.currentCustomer;
    const header = document.createElement("h3");
    header.textContent = `Neue Lizenz fuer: ${customerLabel(customer || {})}`;

    const context = document.createElement("div");
    context.textContent = `Kundenkontext: ${customerLabel(customer || {})}`;
    const message = document.createElement("div");
    message.style.minHeight = "20px";
    message.style.fontSize = "13px";
    const generationOutput = document.createElement("div");
    generationOutput.style.fontSize = "12px";
    generationOutput.style.opacity = "0.9";
    const setupOutput = document.createElement("div");
    setupOutput.style.fontSize = "12px";
    setupOutput.style.opacity = "0.9";

    const license = this.currentLicense || {};
    const parsedScope = parseProductScopeObject(valueOf(license, "product_scope_json", "productScope"));

    const fields = [
      ["license_id", "Lizenz-ID"],
      ["valid_from", "gueltig von"],
      ["valid_until", "gueltig bis"],
      ["license_edition", "Lizenztyp"],
      ["license_binding", "Gerätebindung (automatisch)"],
      ["trial_duration_days", "Testzeitraum"],
      ["machine_id", "Machine-ID"],
      ["notes", "Notizen"],
    ];

    const form = document.createElement("div");
    const inputs = { product_scope_json: document.createElement("input") };
    inputs.product_scope_json.type = "hidden";
    form.style.display = "grid";
    form.style.gridTemplateColumns = "minmax(320px, 1fr)";
    form.style.rowGap = "10px";

    const appendFieldRow = (labelText, fieldNode) => {
      const row = document.createElement("div");
      row.style.display = "grid";
      row.style.gap = "6px";
      const title = document.createElement("label");
      title.textContent = labelText;
      title.style.fontWeight = "600";
      row.append(title, fieldNode);
      form.append(row);
      return { title, fieldNode, row };
    };

    const fieldRows = {};

    for (const [key, label] of fields) {
      let input = key === "notes" ? document.createElement("textarea") : document.createElement("input");
      if (key === "license_edition") {
        input = document.createElement("select");
        [
          { value: "test", label: "Testversion" },
          { value: "full", label: "Vollversion" },
        ].forEach((entry) => {
          const option = document.createElement("option");
          option.value = entry.value;
          option.textContent = entry.label;
          input.appendChild(option);
        });
      }
      if (key === "license_binding") {
        input = document.createElement("select");
        [
          { value: "none", label: "Ohne Gerätebindung" },
          { value: "machine", label: "An Machine-ID binden" },
        ].forEach((entry) => {
          const option = document.createElement("option");
          option.value = entry.value;
          option.textContent = entry.label;
          input.appendChild(option);
        });
      }
      if (key === "trial_duration_days") {
        input = document.createElement("div");
        input.style.display = "grid";
        input.style.gap = "8px";
        const trialTitle = document.createElement("div");
        trialTitle.textContent = "Testdauer";
        trialTitle.style.fontWeight = "500";
        const durationSelect = document.createElement("select");
        [
          { value: "14", label: "14 Tage" },
          { value: "30", label: "30 Tage" },
          { value: "60", label: "60 Tage" },
          { value: "90", label: "90 Tage" },
          { value: "custom", label: "Individuell" },
        ].forEach((entry) => {
          const option = document.createElement("option");
          option.value = entry.value;
          option.textContent = entry.label;
          durationSelect.appendChild(option);
        });
        const customRow = document.createElement("div");
        customRow.style.display = "none";
        customRow.style.gridTemplateColumns = "80px minmax(120px, 1fr)";
        customRow.style.gap = "8px";
        const customLabel = document.createElement("div");
        customLabel.textContent = "Tage";
        customLabel.style.alignSelf = "center";
        const customInput = document.createElement("input");
        customInput.type = "number";
        customInput.min = "1";
        customInput.max = "365";
        customInput.step = "1";
        customInput.style.width = "100%";
        customRow.append(customLabel, customInput);
        const trialHint = document.createElement("div");
        trialHint.style.fontSize = "12px";
        trialHint.style.opacity = "0.85";
        trialHint.textContent = "Der Testzeitraum beginnt bei erster Installation / erstem Start.";
        input.append(trialTitle, durationSelect, customRow, trialHint);
        input._durationSelect = durationSelect;
        input._customInput = customInput;
        input._customRow = customRow;
      }
      if (key === "notes") input.rows = 3;
      const currentMode = getLicenseEditionAndBinding(license);
      if (key === "license_edition") input.value = currentMode.edition;
      else if (key === "license_binding") input.value = currentMode.binding;
      else if (key === "trial_duration_days") {
        const initialTrialDays = normalizeTrialDurationDays(
          valueOf(license, "trial_duration_days", "trialDurationDays"),
          30
        );
        if ([14, 30, 60, 90].includes(initialTrialDays)) {
          input._durationSelect.value = String(initialTrialDays);
          input._customInput.value = String(initialTrialDays);
          input._customRow.style.display = "none";
        } else {
          input._durationSelect.value = "custom";
          input._customInput.value = String(initialTrialDays);
          input._customRow.style.display = "grid";
        }
      }
      else input.value = valueOf(license, key, key.replace("_", ""));
      if (key === "valid_from" || key === "valid_until") {
        input.type = "date";
        input.value = normalizeDateForGenerator(input.value);
      }
      input.style.width = "100%";
      input.id = `license-${key}`;
      inputs[key] = input;
      fieldRows[key] = appendFieldRow(label, input);
    }

    const scopeModel = createDefaultScopeSelection();
    scopeModel.raw = parsedScope.raw;
    scopeModel.zusatzfunktionen = [...parsedScope.zusatzfunktionen];
    scopeModel.module = [...parsedScope.module];
    scopeModel.previous = parsedScope.original;
    const zusatzfunktionChecks = new Map();
    const moduleChecks = new Map();

    const standardWrap = document.createElement("div");
    standardWrap.style.display = "grid";
    standardWrap.style.gap = "6px";
    STANDARD_SCOPE_KEYS.forEach((key) => {
      const row = document.createElement("label");
      row.style.display = "flex";
      row.style.gap = "8px";
      row.style.alignItems = "center";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.disabled = true;
      const text = document.createElement("span");
      text.textContent = { app: "App", pdf: "PDF", export: "Export" }[key] || key;
      row.append(checkbox, text);
      standardWrap.appendChild(row);
    });

    const extrasWrap = document.createElement("div");
    extrasWrap.style.display = "grid";
    extrasWrap.style.gap = "6px";

    ADDITIONAL_FEATURES.forEach((entry) => {
      const row = document.createElement("label");
      row.style.display = "flex";
      row.style.gap = "8px";
      row.style.alignItems = "center";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = scopeModel.zusatzfunktionen.includes(entry.key);
      zusatzfunktionChecks.set(entry.key, checkbox);
      checkbox.onchange = () => {
        if (checkbox.checked) {
          if (!scopeModel.zusatzfunktionen.includes(entry.key)) scopeModel.zusatzfunktionen.push(entry.key);
        } else {
          scopeModel.zusatzfunktionen = scopeModel.zusatzfunktionen.filter((item) => item !== entry.key);
        }
        syncScopeJson();
      };
      const text = document.createElement("span");
      text.textContent = entry.label;
      row.append(checkbox, text);
      extrasWrap.appendChild(row);
    });

    const moduleWrap = document.createElement("div");
    moduleWrap.style.display = "grid";
    moduleWrap.style.gap = "6px";

    MODULE_KEYS.forEach((entry) => {
      const row = document.createElement("label");
      row.style.display = "flex";
      row.style.gap = "8px";
      row.style.alignItems = "center";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = scopeModel.module.includes(entry.key);
      moduleChecks.set(entry.key, checkbox);
      checkbox.onchange = () => {
        if (checkbox.checked) {
          if (!scopeModel.module.includes(entry.key)) scopeModel.module.push(entry.key);
        } else {
          scopeModel.module = scopeModel.module.filter((item) => item !== entry.key);
        }
        syncScopeJson();
      };
      const text = document.createElement("span");
      text.textContent = entry.label;
      row.append(checkbox, text);
      moduleWrap.appendChild(row);
    });

    const scopeEditorWrap = document.createElement("div");
    scopeEditorWrap.style.display = "grid";
    scopeEditorWrap.style.gap = "10px";

    const productCard = document.createElement("div");
    productCard.style.border = "1px solid #ddd";
    productCard.style.borderRadius = "8px";
    productCard.style.padding = "10px";
    productCard.style.display = "grid";
    productCard.style.gap = "4px";
    const productTitle = document.createElement("div");
    productTitle.textContent = "Produkt";
    productTitle.style.fontWeight = "600";
    const productHint = document.createElement("div");
    productHint.textContent = PRODUCT_LABEL;
    productCard.append(productTitle, productHint);

    const categoryGrid = document.createElement("div");
    categoryGrid.style.display = "grid";
    categoryGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
    categoryGrid.style.gap = "10px";

    const createCategoryCard = (title, body) => {
      const card = document.createElement("div");
      card.style.border = "1px solid #ddd";
      card.style.borderRadius = "8px";
      card.style.padding = "10px";
      card.style.display = "grid";
      card.style.gap = "8px";
      const heading = document.createElement("div");
      heading.textContent = title;
      heading.style.fontWeight = "600";
      card.append(heading, body);
      return card;
    };

    categoryGrid.append(
      createCategoryCard("Standardumfang", standardWrap),
      createCategoryCard("Zusatzfunktionen", extrasWrap),
      createCategoryCard("Module", moduleWrap)
    );

    scopeEditorWrap.append(productCard, categoryGrid);
    appendFieldRow("Lizenzumfang", scopeEditorWrap);

    if (scopeModel.raw) {
      const legacyHint = document.createElement("div");
      legacyHint.style.fontSize = "12px";
      legacyHint.style.opacity = "0.8";
      legacyHint.textContent = `Bestehender Freitext wird beibehalten: ${scopeModel.raw}`;
      appendFieldRow("Legacy-Hinweis", legacyHint);
    }

    let machineBindingHint = null;
    let machineFlowHint = null;
    let machineSetupHint = null;
    const syncScopeJson = () => {
      inputs.product_scope_json.value = JSON.stringify(buildStructuredProductScopeJson(scopeModel, scopeModel.previous));
    };
    syncScopeJson();
    const syncMachineIdState = () => {
      const binding = String(inputs.license_binding?.value || "none").trim().toLowerCase();
      const isMachine = binding === "machine";
      inputs.machine_id.disabled = !isMachine;
      if (!isMachine) {
        inputs.machine_id.value = "";
      }
    };
    const syncTrialDurationState = () => {
      const selector = inputs.trial_duration_days?._durationSelect;
      const customInput = inputs.trial_duration_days?._customInput;
      const customRow = inputs.trial_duration_days?._customRow;
      if (!selector || !customInput || !customRow) return;
      const isCustom = selector.value === "custom";
      customRow.style.display = isCustom ? "grid" : "none";
      if (!isCustom) {
        customInput.value = selector.value;
      }
    };
    let syncActionButtonsState = () => {};
    const syncEditionUiState = () => {
      const edition = String(inputs.license_edition?.value || "test").trim().toLowerCase();
      const isTestLicense = edition === "test";
      if (isTestLicense) {
        inputs.license_binding.value = "none";
      } else {
        inputs.license_binding.value = "machine";
      }
      inputs.license_binding.disabled = true;
      syncMachineIdState();
      if (fieldRows.valid_from) {
        fieldRows.valid_from.title.textContent = isTestLicense ? "Ausgestellt am (technisch)" : "gueltig von";
        fieldRows.valid_from.title.style.opacity = isTestLicense ? "0.65" : "1";
        fieldRows.valid_from.row.style.display = isTestLicense ? "none" : "";
      }
      if (fieldRows.valid_until) {
        fieldRows.valid_until.row.style.display = isTestLicense ? "none" : "";
      }
      if (fieldRows.trial_duration_days) {
        fieldRows.trial_duration_days.row.style.display = isTestLicense ? "" : "none";
      }
      if (fieldRows.machine_id) {
        fieldRows.machine_id.row.style.display = isTestLicense ? "none" : "";
      }
      if (fieldRows.license_binding) {
        fieldRows.license_binding.row.style.display = "none";
      }
      const showMachineHint = !isTestLicense;
      if (machineBindingHint) {
        machineBindingHint.style.display = showMachineHint ? "" : "none";
        machineBindingHint.style.whiteSpace = showMachineHint ? "pre-line" : "normal";
      }
      if (machineFlowHint) {
        machineFlowHint.style.display = showMachineHint ? "" : "none";
      }
      if (machineSetupHint) {
        machineSetupHint.style.display = showMachineHint ? "" : "none";
      }
      syncActionButtonsState();
    };
    inputs.license_binding?.addEventListener("change", syncMachineIdState);
    inputs.trial_duration_days?._durationSelect?.addEventListener("change", syncTrialDurationState);
    inputs.license_edition?.addEventListener("change", syncEditionUiState);
    inputs.trial_duration_days?._customInput?.addEventListener("change", () => {
      inputs.trial_duration_days._customInput.value = String(
        normalizeTrialDurationDays(inputs.trial_duration_days._customInput.value, 30)
      );
    });
    syncTrialDurationState();
    syncEditionUiState();
    syncMachineIdState();

    const licenseIdHint = document.createElement("div");
    licenseIdHint.textContent =
      "Wenn die Lizenz-ID leer ist, wird beim Erstellen automatisch eine ID erzeugt.";
    licenseIdHint.style.fontSize = "12px";
    machineBindingHint = document.createElement("div");
    machineBindingHint.style.fontSize = "12px";
    machineBindingHint.style.padding = "8px";
    machineBindingHint.style.border = "1px solid #cbd5e1";
    machineBindingHint.style.borderRadius = "6px";
    machineBindingHint.style.background = "#f8fafc";
    machineBindingHint.style.display = "none";
    machineBindingHint.textContent =
      "Gerätegebundene Vollversion:\nImportieren Sie zuerst die Lizenzanforderung des Kunden.\nDanach erzeugen Sie mit „Lizenz erstellen“ die Antwortlizenz.";
    machineFlowHint = document.createElement("div");
    machineFlowHint.style.fontSize = "12px";
    machineFlowHint.style.padding = "8px";
    machineFlowHint.style.border = "1px solid #cbd5e1";
    machineFlowHint.style.borderRadius = "6px";
    machineFlowHint.style.background = "#f8fafc";
    machineFlowHint.style.display = "none";
    machineFlowHint.style.whiteSpace = "pre-line";
    machineFlowHint.textContent =
      "Schritt 1: Machine-Setup erstellen\nSchritt 2: Lizenzanforderung importieren\nSchritt 3: Antwortlizenz erstellen";
    machineSetupHint = document.createElement("div");
    machineSetupHint.style.fontSize = "12px";
    machineSetupHint.style.display = "none";
    machineSetupHint.textContent = "Dieses Setup enthält noch keine fertige Lizenz.";

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    const importRequestBtn = this._button("Lizenzanforderung importieren", async () => {
      const api = window?.bbmDb || {};
      if (typeof api.licenseAdminImportLicenseRequest !== "function") {
        message.textContent = "Lizenzanforderung konnte nicht importiert werden.";
        return;
      }
      const previousMachineId = String(inputs.machine_id?.value || "").trim();
      try {
        const res = await api.licenseAdminImportLicenseRequest();
        if (!res?.ok) {
          if (res?.canceled) return;
          const errorCode = String(res?.error || "").trim().toUpperCase();
          if (errorCode === "INVALID_PRODUCT") {
            message.textContent = "Lizenzanforderung gehört nicht zu diesem Produkt.";
            return;
          }
          if (errorCode === "MISSING_MACHINE_ID") {
            message.textContent = "Lizenzanforderung enthält keine Machine-ID.";
            return;
          }
          message.textContent = "Lizenzanforderung konnte nicht importiert werden.";
          return;
        }
        const request = res?.request || {};
        inputs.machine_id.value = String(request.machineId || "").trim();
        inputs.license_binding.value = "machine";
        inputs.license_edition.value = "full";
        syncEditionUiState();
        syncMachineIdState();
        const infoLines = ["Lizenzanforderung importiert. Machine-ID wurde übernommen."];
        if (previousMachineId && previousMachineId !== inputs.machine_id.value) {
          infoLines.push("Vorhandene Machine-ID wurde durch die importierte Machine-ID ersetzt.");
        }
        if (String(request.customerName || "").trim()) {
          infoLines.push(`Anfrage von: ${request.customerName}`);
        }
        if (String(request.licenseId || "").trim()) {
          infoLines.push(`Anfrage zu Lizenz-ID: ${request.licenseId}`);
        }
        message.textContent = infoLines.join("\n");
      } catch (_err) {
        message.textContent = "Lizenzanforderung konnte nicht importiert werden.";
      }
    });
    const openOutputDirBtn = this._button("Ausgabeordner öffnen", async () => {
      const api = window?.bbmDb || {};
      const outputPath = String(openOutputDirBtn.dataset.outputPath || "").trim();
      if (!outputPath || typeof api.licenseOpenOutputDir !== "function") return;
      try {
        const res = await api.licenseOpenOutputDir({ outputPath });
        if (!res?.ok) {
          message.textContent = `Fehler: ${res?.error || "Ausgabeordner konnte nicht geoeffnet werden."}`;
          return;
        }
      } catch (err) {
        message.textContent = `Fehler: ${err?.message || err || "Ausgabeordner konnte nicht geoeffnet werden."}`;
      }
    });
    openOutputDirBtn.style.display = "none";
    const runSetupBuild = async ({ setupType = "test" } = {}) => {
      const activeLicense = this.currentLicense || license || {};
      const payload = buildCustomerSetupPayload({
        customer: this.currentCustomer || {},
        license: activeLicense,
        setupType,
      });
      if (setupType === "test" && !String(payload.licenseFilePath || "").trim()) {
        message.textContent = "Bitte zuerst die Lizenz erstellen.";
        return;
      }
      createCustomerSetupBtn.disabled = true;
      createMachineSetupBtn.disabled = true;
      try {
        message.textContent = setupType === "machine" ? "Machine-Setup wird erstellt ..." : "Kunden-Setup wird erstellt ...";
        setupOutput.textContent = "";
        const res = await createCustomerSetup(payload);
        if (!res?.ok) {
          const combinedErrorText = `${String(res?.stderr || "")}\n${String(res?.stdout || "")}`.toUpperCase();
          const isFileLockError = combinedErrorText.includes("EBUSY") || combinedErrorText.includes("RESOURCE BUSY OR LOCKED");
          if (isFileLockError) {
            message.textContent =
              "Kunden-Setup konnte nicht erstellt werden, weil eine Build-Datei gesperrt ist. Bitte App schließen und Kunden-Setup manuell über den Build-Befehl erstellen.";
          } else {
            message.textContent = `Fehler: ${res?.error || "Kunden-Setup konnte nicht erstellt werden."}`;
          }
          const diagnostics = [];
          if (res?.outputDir) diagnostics.push(`outputDir: ${res.outputDir}`);
          if (res?.customerSlug) diagnostics.push(`customerSlug: ${res.customerSlug}`);
          if (res?.exitCode !== undefined && res?.exitCode !== null) diagnostics.push(`exitCode: ${res.exitCode}`);
          if (res?.logPath) diagnostics.push(`logPath: ${res.logPath}`);
          if (res?.setupPath || res?.artifactPath) diagnostics.push(`setupPath: ${res.setupPath || res?.artifactPath}`);
          const stdout = truncateText(tailLines(res?.stdout));
          const stderr = truncateText(tailLines(res?.stderr));
          if (stdout) diagnostics.push(`stdout(last): ${stdout}`);
          if (stderr) diagnostics.push(`stderr(last): ${stderr}`);
          setupOutput.textContent = diagnostics.join("\n");
          return;
        }
        message.textContent = setupType === "machine" ? "Machine-Setup wurde erstellt." : "Kunden-Setup wurde erstellt.";
        const outPath = String(res?.setupPath || res?.artifactPath || "").trim();
        const outDir = String(res?.outputDir || "").trim();
        setupOutput.textContent = outPath ? `Ausgabepfad: ${outPath}` : outDir ? `Ausgabepfad: ${outDir}` : "";
        const dirToOpen = outPath || outDir;
        if (dirToOpen) {
          openOutputDirBtn.dataset.outputPath = dirToOpen;
          openOutputDirBtn.style.display = "";
          openOutputDirBtn.disabled = false;
        }
      } catch (err) {
        message.textContent = `Fehler: ${err?.message || err}`;
      } finally {
        createCustomerSetupBtn.disabled = false;
        createMachineSetupBtn.disabled = false;
      }
    };
    const createCustomerSetupBtn = this._button("Kunden-Setup erstellen", async () => runSetupBuild({ setupType: "test" }));
    const createMachineSetupBtn = this._button("Machine-Setup erstellen", async () => runSetupBuild({ setupType: "machine" }));
    createCustomerSetupBtn.disabled = !valueOf(license, "license_file_path", "licenseFilePath");

    const createBtn = this._button("Lizenz erstellen", async () => {
      const previousText = createBtn.textContent;
      createBtn.disabled = true;
      openOutputDirBtn.disabled = true;
      try {
        const activeLicense = this.currentLicense || license || {};
        const payload = buildLicenseEditorPayload({
          license: activeLicense,
          customer,
          inputs: {
            license_id: inputs.license_id.value,
            product_scope_json: inputs.product_scope_json.value,
            valid_from: inputs.valid_from.value,
            valid_until: inputs.valid_until.value,
            license_mode: inputs.license_binding.value === "machine" ? "full" : "soft",
            license_edition: inputs.license_edition.value,
            license_binding: inputs.license_binding.value,
            trial_duration_days:
              String(inputs.license_edition.value || "").trim().toLowerCase() === "test"
                ? String(
                    normalizeTrialDurationDays(
                      inputs.trial_duration_days?._durationSelect?.value === "custom"
                        ? inputs.trial_duration_days?._customInput?.value
                        : inputs.trial_duration_days?._durationSelect?.value,
                      30
                    )
                  )
                : "",
            machine_id: inputs.machine_id.value,
            notes: inputs.notes.value,
          },
        });
        const saved = await saveLicense(payload);
        this.currentLicense = saved;
        createCustomerSetupBtn.disabled = true;
        openOutputDirBtn.style.display = "none";
        openOutputDirBtn.dataset.outputPath = "";
        generationOutput.textContent = "";
        setupOutput.textContent = "";

        const api = window?.bbmDb || {};
        if (typeof api.licenseGenerate !== "function") {
          message.textContent = "Fehler: Lizenz-Generator-IPC ist nicht verfuegbar.";
          return;
        }

        const generatorPayload = buildLicenseGeneratorPayload({
          customer: this.currentCustomer || {},
          license: saved || {},
        });
        if (!generatorPayload.validFrom || !generatorPayload.validUntil) {
          if (generatorPayload.edition === "test" && generatorPayload.binding === "none") {
            // Testlizenz nutzt trialDurationDays statt manuellem validUntil.
          } else {
            message.textContent = "Bitte gültige Datumswerte eintragen.";
            return;
          }
        }
        if (generatorPayload.edition === "test" && generatorPayload.binding === "none" && !generatorPayload.trialDurationDays) {
          message.textContent = "Bitte Testdauer waehlen (1 bis 365 Tage).";
          return;
        }
        if (!generatorPayload.features.length) {
          message.textContent = "Produktumfang enthält keine erzeugbaren Features.";
          return;
        }
        if (generatorPayload.binding === "machine" && !String(generatorPayload.machineId || "").trim()) {
          message.textContent = "Machine-ID ist erforderlich, wenn die Lizenz an ein Gerät gebunden wird.";
          return;
        }

        message.textContent = "Lizenzdatei wird erzeugt ...";
        const res = await api.licenseGenerate(generatorPayload);
        if (!res?.ok) {
          message.textContent = `Fehler: ${res?.error || "Lizenz konnte nicht erzeugt werden."}`;
          return;
        }
        const isMachineResponseLicense =
          generatorPayload.edition === "full" &&
          generatorPayload.binding === "machine" &&
          String(generatorPayload.machineId || "").trim();
        message.textContent = isMachineResponseLicense
          ? "Lizenzdatei wurde erzeugt.\nAntwortlizenz wurde erstellt.\nDiese .bbmlic-Datei an den Kunden zurückgeben."
          : "Lizenzdatei wurde erzeugt.";
        message.style.whiteSpace = "pre-line";
        const outputPath = String(res?.outputPath || "").trim();
        if (outputPath) {
          generationOutput.textContent = `Ausgabepfad: ${outputPath}`;
          const updated = await saveLicense({
            ...(saved || {}),
            license_file_path: outputPath,
            license_file_created_at: new Date().toISOString(),
          });
          this.currentLicense = updated;
          createCustomerSetupBtn.disabled = false;
          openOutputDirBtn.dataset.outputPath = outputPath;
          openOutputDirBtn.style.display = "";
          openOutputDirBtn.disabled = false;
        }
      } catch (err) {
        if (String(err?.message || "") === "CUSTOMER_CONTEXT_REQUIRED") {
          message.textContent = "Fehler: Speichern ohne geoeffneten Kunden ist unmoeglich.";
        } else {
          message.textContent = `Fehler: ${err?.message || err}`;
        }
      } finally {
        createBtn.textContent = previousText;
        syncActionButtonsState();
      }
    });

    syncActionButtonsState = () => {
      const edition = String(inputs.license_edition?.value || "test").trim().toLowerCase();
      const machineId = String(inputs.machine_id?.value || "").trim();
      const isFull = edition === "full";
      const hasMachineId = !!machineId;
      importRequestBtn.style.display = isFull ? "" : "none";
      createMachineSetupBtn.style.display = isFull ? "" : "none";
      createCustomerSetupBtn.style.display = isFull ? "none" : "";
      if (isFull && !hasMachineId) {
        createBtn.disabled = true;
        createBtn.title = "Antwortlizenz erst nach Import einer Machine-ID erstellen.";
      } else {
        createBtn.disabled = false;
        createBtn.title = "";
      }
    };
    inputs.machine_id?.addEventListener("input", syncActionButtonsState);
    inputs.license_edition?.addEventListener("change", syncActionButtonsState);
    syncActionButtonsState();
    syncEditionUiState();

    const backBtn = this._button("Zurueck", () => {
      this.currentLicense = null;
      this.currentView = "customer-detail";
      this._render();
    });

    actions.append(importRequestBtn, createBtn, createCustomerSetupBtn, createMachineSetupBtn, backBtn, openOutputDirBtn);
    container.append(
      header,
      context,
      form,
      licenseIdHint,
      machineBindingHint,
      machineFlowHint,
      machineSetupHint,
      actions,
      message,
      generationOutput,
      setupOutput
    );
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
