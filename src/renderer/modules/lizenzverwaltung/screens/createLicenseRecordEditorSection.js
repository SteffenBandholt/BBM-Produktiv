import {
  LICENSE_MODES,
  LICENSE_RECORD_FIELDS,
  createDefaultLicenseRecord,
  normalizeLicenseRecord,
} from "../licenseRecords.js";
import { listCustomers, listLicenses, saveLicense } from "../licenseStorageService.js";

export function createLicenseRecordEditorSection({ applyPopupCardStyle, applyPopupButtonStyle } = {}) {
  const model = createDefaultLicenseRecord();
  const fieldInputs = new Map();
  let knownCustomers = [];
  const generateLicenseId = () => {
    const now = new Date();
    const part = (value) => String(value).padStart(2, "0");
    const datePart = `${now.getFullYear()}${part(now.getMonth() + 1)}${part(now.getDate())}`;
    const timePart = `${part(now.getHours())}${part(now.getMinutes())}${part(now.getSeconds())}`;
    return `LIC-${datePart}-${timePart}`;
  };

  const card = document.createElement("div");
  if (typeof applyPopupCardStyle === "function") {
    applyPopupCardStyle(card);
  }
  card.style.display = "grid";
  card.style.gap = "10px";

  const title = document.createElement("h3");
  title.textContent = "Lizenzen";
  title.style.margin = "0";

  const hint = document.createElement("p");
  hint.textContent = "vorbereitet, mit dauerhafter Speicherung";
  hint.style.margin = "0";
  hint.style.fontSize = "12px";
  hint.style.opacity = "0.8";

  const form = document.createElement("div");
  form.style.display = "grid";
  form.style.gap = "8px";

  const message = document.createElement("div");
  message.style.fontSize = "12px";
  message.style.padding = "8px";
  message.style.borderRadius = "8px";
  message.style.background = "#f8fafc";
  message.style.border = "1px solid rgba(0,0,0,0.08)";
  message.textContent = "Noch keine Pruefung ausgefuehrt.";

  const listWrap = document.createElement("div");
  listWrap.style.display = "grid";
  listWrap.style.gap = "6px";

  const listTitle = document.createElement("h4");
  listTitle.textContent = "Gespeicherte Lizenzen";
  listTitle.style.margin = "0";
  listTitle.style.fontSize = "13px";

  const listContent = document.createElement("div");
  listContent.style.fontSize = "12px";
  listContent.style.display = "grid";
  listContent.style.gap = "4px";

  const customerHint = document.createElement("div");
  customerHint.style.fontSize = "12px";
  customerHint.style.padding = "8px";
  customerHint.style.borderRadius = "8px";
  customerHint.style.background = "#f8fafc";
  customerHint.style.border = "1px solid rgba(0,0,0,0.08)";

  const getCustomerKey = (customer = {}) =>
    String(customer.id || customer.customerId || customer.customer_id || "");

  const getCustomerNumber = (customer = {}) =>
    String(customer.customerNumber || customer.customer_number || "").trim();

  const getCustomerCompany = (customer = {}) =>
    String(customer.companyName || customer.company_name || "").trim();

  const buildCustomerLabel = (customer = {}) => {
    const customerNumber = getCustomerNumber(customer) || "-";
    const companyName = getCustomerCompany(customer) || "-";
    return `${customerNumber} | ${companyName}`;
  };

  const refreshCustomers = async () => {
    const select = fieldInputs.get("customerNumber");
    if (!select) return;

    const customers = await listCustomers();
    knownCustomers = Array.isArray(customers) ? customers : [];

    select.replaceChildren();
    if (knownCustomers.length < 1) {
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "Bitte zuerst einen Kunden anlegen.";
      select.appendChild(empty);
      select.value = "";
      model.customerId = "";
      model.customer_id = "";
      model.customerNumber = "";
      customerHint.textContent = "Bitte zuerst einen Kunden anlegen.";
      customerHint.style.background = "#fef2f2";
      customerHint.style.borderColor = "rgba(220, 38, 38, 0.35)";
      return;
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Kunden auswaehlen";
    select.appendChild(placeholder);

    knownCustomers.forEach((customer) => {
      const option = document.createElement("option");
      option.value = getCustomerKey(customer);
      option.textContent = buildCustomerLabel(customer);
      select.appendChild(option);
    });

    customerHint.textContent = "Kunde wird ueber customer_id/customerId mit der Lizenz verknuepft.";
    customerHint.style.background = "#f8fafc";
    customerHint.style.borderColor = "rgba(0,0,0,0.08)";
  };

  const refreshRememberedLicenses = async () => {
    const licenses = await listLicenses();
    listContent.replaceChildren();

    if (!Array.isArray(licenses) || licenses.length < 1) {
      listContent.textContent = "Noch keine gespeicherten Lizenzen.";
      return;
    }

    licenses.forEach((entry) => {
      const row = document.createElement("div");
      const customerDisplay =
        String(entry.customerDisplay || "").trim() ||
        [
          String(entry.customerNumber || entry.customer_number || "").trim(),
          String(entry.companyName || entry.company_name || "").trim(),
        ]
          .filter(Boolean)
          .join(" | ") ||
        String(entry.customerId || entry.customer_id || "").trim() ||
        "-";

      row.textContent = `${entry.licenseId || entry.license_id || "-"} | ${customerDisplay} | ${entry.validUntil || entry.valid_until || "-"} | ${entry.licenseMode || entry.license_mode || "-"}`;
      listContent.appendChild(row);
    });
  };

  const updateModelFromInputs = () => {
    for (const field of LICENSE_RECORD_FIELDS) {
      const input = fieldInputs.get(field.key);
      if (!input) continue;

      if (field.key === "productScope") {
        model.productScope = {
          standardumfang: [],
          zusatzfunktionen: [],
          module: [],
          _display: String(input.value || ""),
        };
        continue;
      }

      if (field.key === "customerNumber") {
        const selectedCustomer = knownCustomers.find(
          (entry) => getCustomerKey(entry) === String(input.value || "")
        );
        model.customerId = selectedCustomer ? getCustomerKey(selectedCustomer) : "";
        model.customer_id = model.customerId;
        model.customerNumber = selectedCustomer ? getCustomerNumber(selectedCustomer) : "";
        continue;
      }

      model[field.key] = String(input.value || "");
    }
  };

  const applyModelToInputs = () => {
    for (const field of LICENSE_RECORD_FIELDS) {
      const input = fieldInputs.get(field.key);
      if (!input) continue;

      if (field.key === "productScope") {
        input.value = String(model.productScope?._display || "");
      } else if (field.key === "customerNumber") {
        input.value = String(model.customerId || model.customer_id || "");
      } else {
        input.value = model[field.key] || "";
      }
      input.style.borderColor = "";
    }
  };

  const runValidation = () => {
    updateModelFromInputs();

    if (!String(model.licenseId || "").trim()) {
      model.licenseId = generateLicenseId();
      const licenseIdInput = fieldInputs.get("licenseId");
      if (licenseIdInput) {
        licenseIdInput.value = model.licenseId;
      }
    }

    const normalized = normalizeLicenseRecord(model);
    const hasCustomers = knownCustomers.length > 0;

    const missingRequired = LICENSE_RECORD_FIELDS.filter((field) => {
      if (!field.required) return false;
      if (field.key === "productScope") {
        return !String(model.productScope?._display || "").trim();
      }
      if (field.key === "customerNumber") {
        return !String(normalized.customerId || normalized.customer_id || "").trim();
      }
      return !String(normalized[field.key] || "").trim();
    });

    for (const field of LICENSE_RECORD_FIELDS) {
      const input = fieldInputs.get(field.key);
      if (!input) continue;
      const isMissing = missingRequired.some((entry) => entry.key === field.key);
      input.style.borderColor = isMissing ? "#dc2626" : "";
    }

    if (!hasCustomers) {
      const customerInput = fieldInputs.get("customerNumber");
      if (customerInput) customerInput.style.borderColor = "#dc2626";
      message.textContent = "Bitte zuerst einen Kunden anlegen.";
      message.style.background = "#fef2f2";
      message.style.borderColor = "rgba(220, 38, 38, 0.35)";
      return false;
    }

    if (missingRequired.length > 0) {
      message.textContent = `Pruefung fehlgeschlagen: Pflichtfelder fehlen (${missingRequired
        .map((field) => field.label)
        .join(", ")}).`;
      message.style.background = "#fef2f2";
      message.style.borderColor = "rgba(220, 38, 38, 0.35)";
      return false;
    }

    message.textContent = "Pruefung erfolgreich: Pflichtfelder sind befuellt. Keine Speicherung erfolgt.";
    message.style.background = "#f0fdf4";
    message.style.borderColor = "rgba(34, 197, 94, 0.35)";
    return true;
  };

  LICENSE_RECORD_FIELDS.forEach((field) => {
    const row = document.createElement("label");
    row.style.display = "grid";
    row.style.gap = "4px";

    const label = document.createElement("span");
    label.textContent = field.required ? `${field.label} *` : field.label;
    label.style.fontSize = "12px";
    label.style.fontWeight = "600";

    let input;
    if (field.key === "notes") {
      input = document.createElement("textarea");
      input.rows = 4;
    } else if (field.key === "customerNumber") {
      input = document.createElement("select");
    } else if (field.key === "licenseMode") {
      input = document.createElement("select");
      LICENSE_MODES.forEach((mode) => {
        const option = document.createElement("option");
        option.value = mode.key;
        option.textContent = mode.label;
        input.appendChild(option);
      });
    } else {
      input = document.createElement("input");
      input.type = field.key === "validFrom" || field.key === "validUntil" ? "date" : "text";
    }

    input.style.width = "100%";
    input.style.boxSizing = "border-box";

    row.append(label, input);
    form.appendChild(row);
    fieldInputs.set(field.key, input);
  });

  const buttons = document.createElement("div");
  buttons.style.display = "flex";
  buttons.style.gap = "8px";

  const btnReset = document.createElement("button");
  btnReset.type = "button";
  btnReset.textContent = "Neu / leeren";
  if (typeof applyPopupButtonStyle === "function") applyPopupButtonStyle(btnReset);
  btnReset.onclick = () => {
    Object.assign(model, createDefaultLicenseRecord());
    model.productScope._display = "";
    model.customerId = "";
    model.customer_id = "";
    applyModelToInputs();
    message.textContent = "Formular geleert. Noch ohne Speicherung.";
    message.style.background = "#f8fafc";
    message.style.borderColor = "rgba(0,0,0,0.08)";
  };

  const btnValidate = document.createElement("button");
  btnValidate.type = "button";
  btnValidate.textContent = "Pruefen";
  if (typeof applyPopupButtonStyle === "function") applyPopupButtonStyle(btnValidate);
  btnValidate.onclick = () => {
    runValidation();
  };

  const btnRemember = document.createElement("button");
  btnRemember.type = "button";
  btnRemember.textContent = "Merken";
  if (typeof applyPopupButtonStyle === "function") applyPopupButtonStyle(btnRemember);
  btnRemember.onclick = async () => {
    const isValid = runValidation();
    if (!isValid) return;
    const payload = normalizeLicenseRecord(model);
    const customerId = String(payload.customerId || payload.customer_id || "").trim();
    if (!customerId) {
      message.textContent =
        "Speichern fehlgeschlagen: customer_id/customerId fehlt. Bitte Kunde neu auswaehlen.";
      message.style.background = "#fef2f2";
      message.style.borderColor = "rgba(220, 38, 38, 0.35)";
      const customerInput = fieldInputs.get("customerNumber");
      if (customerInput) customerInput.style.borderColor = "#dc2626";
      return;
    }

    try {
      await saveLicense(payload);
      await refreshRememberedLicenses();
      message.textContent = "Datensatz dauerhaft gespeichert.";
      message.style.background = "#f0fdf4";
      message.style.borderColor = "rgba(34, 197, 94, 0.35)";
    } catch (error) {
      const detail = String(error?.message || error || "").trim() || "Unbekannter Fehler";
      message.textContent = `Speichern fehlgeschlagen: ${detail}`;
      message.style.background = "#fef2f2";
      message.style.borderColor = "rgba(220, 38, 38, 0.35)";
    }
  };

  buttons.append(btnReset, btnValidate, btnRemember);

  applyModelToInputs();
  listWrap.append(listTitle, listContent);
  card.append(title, hint, customerHint, form, buttons, message, listWrap);
  refreshCustomers();
  refreshRememberedLicenses();
  return card;
}
