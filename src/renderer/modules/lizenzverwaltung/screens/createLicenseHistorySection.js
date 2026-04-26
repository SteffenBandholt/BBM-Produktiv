import {
  LICENSE_HISTORY_FIELDS,
  createDefaultLicenseHistoryRecord,
  normalizeLicenseHistoryRecord,
} from "../licenseRecords.js";
import { addHistoryEntry, listHistory } from "../licenseStorageService.js";

export function createLicenseHistorySection({ applyPopupCardStyle, applyPopupButtonStyle } = {}) {
  const model = createDefaultLicenseHistoryRecord();
  const fieldInputs = new Map();

  const card = document.createElement("div");
  if (typeof applyPopupCardStyle === "function") {
    applyPopupCardStyle(card);
  }
  card.style.display = "grid";
  card.style.gap = "10px";

  const title = document.createElement("h3");
  title.textContent = "Historie";
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

  const listWrap = document.createElement("div");
  listWrap.style.display = "grid";
  listWrap.style.gap = "6px";

  const listTitle = document.createElement("h4");
  listTitle.textContent = "Gespeicherte Historie";
  listTitle.style.margin = "0";
  listTitle.style.fontSize = "13px";

  const listContent = document.createElement("div");
  listContent.style.fontSize = "12px";
  listContent.style.display = "grid";
  listContent.style.gap = "4px";

  const refreshRememberedHistory = async () => {
    const history = await listHistory();
    listContent.replaceChildren();

    if (!Array.isArray(history) || history.length < 1) {
      listContent.textContent = "Noch keine gespeicherte Historie.";
      return;
    }

    history.forEach((entry) => {
      const row = document.createElement("div");
      row.textContent = `${entry.createdAt || "-"} | ${entry.licenseId || "-"} | ${entry.customer || "-"} | ${entry.validUntil || "-"}`;
      listContent.appendChild(row);
    });
  };

  const updateModelFromInputs = () => {
    for (const field of LICENSE_HISTORY_FIELDS) {
      const input = fieldInputs.get(field.key);
      if (!input) continue;
      model[field.key] = String(input.value || "");
    }
  };

  const applyModelToInputs = () => {
    for (const field of LICENSE_HISTORY_FIELDS) {
      const input = fieldInputs.get(field.key);
      if (!input) continue;
      input.value = model[field.key] || "";
      input.style.borderColor = "";
    }
  };

  const runValidation = () => {
    updateModelFromInputs();
    const normalized = normalizeLicenseHistoryRecord(model);
    const missingRequired = LICENSE_HISTORY_FIELDS.filter(
      (field) => field.required && !String(normalized[field.key] || "").trim()
    );

    for (const field of LICENSE_HISTORY_FIELDS) {
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

  LICENSE_HISTORY_FIELDS.forEach((field) => {
    const row = document.createElement("label");
    row.style.display = "grid";
    row.style.gap = "4px";

    const label = document.createElement("span");
    label.textContent = field.required ? `${field.label} *` : field.label;
    label.style.fontSize = "12px";
    label.style.fontWeight = "600";

    const input = field.key === "notes" ? document.createElement("textarea") : document.createElement("input");
    if (field.key !== "notes") {
      input.type = field.key === "validUntil" ? "date" : "text";
    }
    if (field.key === "notes") {
      input.rows = 4;
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
    Object.assign(model, createDefaultLicenseHistoryRecord());
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

    await addHistoryEntry(model);
    await refreshRememberedHistory();
    message.textContent =
      "Datensatz dauerhaft gespeichert.";
    message.style.background = "#f0fdf4";
    message.style.borderColor = "rgba(34, 197, 94, 0.35)";
  };

  buttons.append(btnReset, btnValidate, btnRemember);

  applyModelToInputs();
  listWrap.append(listTitle, listContent);
  card.append(title, hint, form, buttons, message, listWrap);
  refreshRememberedHistory();
  return card;
}
