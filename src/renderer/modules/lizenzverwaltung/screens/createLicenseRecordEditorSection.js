import {
  LICENSE_MODES,
  LICENSE_RECORD_FIELDS,
  createDefaultLicenseRecord,
  normalizeLicenseRecord,
} from "../licenseRecords.js";
import { listLicenses, saveLicense } from "../licenseStorageService.js";

export function createLicenseRecordEditorSection({ applyPopupCardStyle, applyPopupButtonStyle } = {}) {
  const model = createDefaultLicenseRecord();
  const fieldInputs = new Map();

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
  hint.textContent = "vorbereitet, noch ohne Speicherung";
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

      model[field.key] = String(input.value || "");
    }
  };

  const applyModelToInputs = () => {
    for (const field of LICENSE_RECORD_FIELDS) {
      const input = fieldInputs.get(field.key);
      if (!input) continue;

      if (field.key === "productScope") {
        input.value = String(model.productScope?._display || "");
      } else {
        input.value = model[field.key] || "";
      }
      input.style.borderColor = "";
    }
  };

  const runValidation = () => {
    updateModelFromInputs();
    const normalized = normalizeLicenseRecord(model);

    const missingRequired = LICENSE_RECORD_FIELDS.filter((field) => {
      if (!field.required) return false;
      if (field.key === "productScope") {
        return !String(model.productScope?._display || "").trim();
      }
      return !String(normalized[field.key] || "").trim();
    });

    for (const field of LICENSE_RECORD_FIELDS) {
      const input = fieldInputs.get(field.key);
      if (!input) continue;
      const isMissing = missingRequired.some((entry) => entry.key === field.key);
      input.style.borderColor = isMissing ? "#dc2626" : "";
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

  const memoryListWrap = document.createElement("div");
  memoryListWrap.style.display = "grid";
  memoryListWrap.style.gap = "6px";

  const memoryListTitle = document.createElement("h4");
  memoryListTitle.textContent = "Temporär gemerkte Lizenzen";
  memoryListTitle.style.margin = "0";
  memoryListTitle.style.fontSize = "13px";

  const memoryList = document.createElement("ul");
  memoryList.style.margin = "0";
  memoryList.style.paddingLeft = "18px";
  memoryList.style.display = "grid";
  memoryList.style.gap = "4px";

  const renderLicenseList = (licenses) => {
    memoryList.innerHTML = "";
    if (!Array.isArray(licenses) || licenses.length === 0) {
      const empty = document.createElement("li");
      empty.textContent = "Noch keine temporär gemerkten Lizenzen.";
      memoryList.appendChild(empty);
      return;
    }

    licenses.forEach((entry) => {
      const item = document.createElement("li");
      item.textContent = `${entry.licenseId || "—"} | ${entry.customerNumber || "—"} | ${
        entry.validUntil || "—"
      } | ${entry.licenseMode || "—"}`;
      memoryList.appendChild(item);
    });
  };

  const refreshLicenseList = async () => {
    const licenses = await listLicenses();
    renderLicenseList(licenses);
  };

  const btnReset = document.createElement("button");
  btnReset.type = "button";
  btnReset.textContent = "Neu / leeren";
  if (typeof applyPopupButtonStyle === "function") applyPopupButtonStyle(btnReset);
  btnReset.onclick = () => {
    Object.assign(model, createDefaultLicenseRecord());
    model.productScope._display = "";
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

    await saveLicense(model);
    await refreshLicenseList();
    message.textContent =
      "Datensatz temporaer gemerkt, noch keine dauerhafte Speicherung (nur In-Memory-Storage-Service).";
    message.style.background = "#f0fdf4";
    message.style.borderColor = "rgba(34, 197, 94, 0.35)";
  };

  buttons.append(btnReset, btnValidate, btnRemember);
  memoryListWrap.append(memoryListTitle, memoryList);

  applyModelToInputs();
  void refreshLicenseList();
  card.append(title, hint, form, buttons, memoryListWrap, message);
  return card;
}
