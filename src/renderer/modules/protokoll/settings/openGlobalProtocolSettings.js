import { applyPopupCardStyle } from "../../../ui/popupButtonStyles.js";
import { PROTOKOLL_GLOBAL_SETTING_KEYS } from "./ProtokollSettingsContract.js";

const EDITABLE_GLOBAL_KEYS = Object.freeze([
  "pdf.protocolTitle",
  "pdf.preRemarks",
  "print.preRemarks.enabled",
]);

export async function openGlobalProtocolSettings({ host } = {}) {
  if (!host) return false;

  const api = window.bbmDb || {};
  const wrap = document.createElement("div");
  wrap.classList.add("bbm-form-content");
  wrap.style.display = "grid";
  wrap.style.gap = "10px";
  wrap.style.minWidth = "min(620px, calc(100vw - 80px))";

  const info = document.createElement("div");
  info.style.fontSize = "12px";
  info.style.opacity = "0.85";
  info.textContent = "Protokollspezifische Einstellungen.";
  wrap.append(info);

  const inputs = new Map();
  host._settingsInputs = inputs;

  const renderField = (field) => {
    const row = document.createElement("label");
    row.classList.add("bbm-form-field");
    row.style.display = "grid";
    row.style.gap = "4px";

    const label = document.createElement("span");
    label.classList.add("bbm-form-label");
    label.textContent = field.label || field.key;
    label.style.fontSize = "12px";

    let input;
    if (field.type === "checkbox") {
      input = document.createElement("input");
      input.type = "checkbox";
      const box = document.createElement("span");
      box.style.display = "inline-flex";
      box.style.alignItems = "center";
      box.style.gap = "8px";
      box.append(input, document.createTextNode(field.checkboxLabel || "Aktiv"));
      row.append(label, box);
    } else {
      input = field.multiline
        ? document.createElement("textarea")
        : document.createElement("input");
      input.style.width = "100%";
      if (input.tagName === "TEXTAREA") input.rows = field.rows || 5;
      row.append(label, input);
    }
    inputs.set(field.key, input);
    return row;
  };

  const titleCard = document.createElement("div");
  applyPopupCardStyle(titleCard);
  titleCard.classList.add("bbm-form-group");
  titleCard.style.padding = "10px";
  titleCard.style.display = "grid";
  titleCard.style.gap = "8px";
  const titleHeading = document.createElement("div");
  titleHeading.textContent = "Protokollbezeichnung / Protokolltitel";
  titleHeading.style.fontWeight = "800";
  const titleHint = document.createElement("div");
  titleHint.textContent = "Protokolltitel und sichtbare Bezeichnung.";
  titleHint.style.fontSize = "12px";
  titleHint.style.opacity = "0.78";
  titleCard.append(titleHeading, titleHint);
  titleCard.append(renderField({ key: "pdf.protocolTitle", label: "Protokolltitel" }));

  const remarksCard = document.createElement("div");
  applyPopupCardStyle(remarksCard);
  remarksCard.classList.add("bbm-form-group");
  remarksCard.style.padding = "10px";
  remarksCard.style.display = "grid";
  remarksCard.style.gap = "8px";
  const remarksHeading = document.createElement("div");
  remarksHeading.textContent = "Vorbemerkung";
  remarksHeading.style.fontWeight = "800";
  const remarksHint = document.createElement("div");
  remarksHint.textContent = "Hinweistext fuer das Protokoll und die optionale Ausgabe.";
  remarksHint.style.fontSize = "12px";
  remarksHint.style.opacity = "0.78";
  remarksCard.append(remarksHeading, remarksHint);
  remarksCard.append(
    renderField({
      key: "pdf.preRemarks",
      label: "Vorbemerkung",
      multiline: true,
      rows: 5,
    }),
    renderField({
      key: "print.preRemarks.enabled",
      label: "Vorbemerkung in der Ausgabe drucken",
      type: "checkbox",
      checkboxLabel: "Aktiv",
    })
  );
  wrap.append(titleCard, remarksCard);

  if (typeof api.appSettingsGetMany === "function") {
    const res = await api.appSettingsGetMany(EDITABLE_GLOBAL_KEYS);
    if (res?.ok) {
      const data = res.data || {};
      for (const [key, input] of inputs.entries()) {
        if (!input) continue;
        const value = data[key];
        if (input.type === "checkbox") {
          input.checked = host._parseBool(value, false);
        } else if (key === "pdf.preRemarks") {
          input.value = host._normalizePdfPreRemarks(value);
        } else {
          input.value = String(value ?? "");
        }
      }
    }
  }

  host.inpPdfProtocolTitle = inputs.get("pdf.protocolTitle") || null;
  host.pdfPreRemarks = host._normalizePdfPreRemarks(inputs.get("pdf.preRemarks")?.value || "");
  host.pdfPreRemarksEnabled = host._parseBool(
    inputs.get("print.preRemarks.enabled")?.checked,
    false
  );

  host._openSettingsModal({
    title: "Protokoll",
    content: [wrap],
    standardForm: true,
    saveFn: async () => {
      if (typeof api.appSettingsSetMany !== "function") return false;

      const protocolTitle = host._normalizeUserText(inputs.get("pdf.protocolTitle")?.value, 80);
      const preRemarks = host._normalizePdfPreRemarks(inputs.get("pdf.preRemarks")?.value);
      const preRemarksEnabled = host._parseBool(
        inputs.get("print.preRemarks.enabled")?.checked,
        false
      );
      const payload = {
        "pdf.protocolTitle": protocolTitle,
        "pdf.preRemarks": preRemarks,
        "print.preRemarks.enabled": preRemarksEnabled ? "true" : "false",
        ...host._buildTouchedPayloadFromValues({
          "pdf.protocolTitle": protocolTitle,
          "pdf.preRemarks": preRemarks,
        }),
        ...host._buildTouchedPayloadForKeys(["print.preRemarks.enabled"]),
      };

      const res = await api.appSettingsSetMany(payload);
      if (!res?.ok) {
        alert(res?.error || "Speichern fehlgeschlagen");
        return false;
      }

      host.pdfPreRemarks = preRemarks;
      host.pdfPreRemarksEnabled = preRemarksEnabled;
      if (host.router?.context) {
        host.router.context.settings = {
          ...(host.router.context.settings || {}),
          "pdf.protocolTitle": protocolTitle,
          "pdf.preRemarks": preRemarks,
          "print.preRemarks.enabled": preRemarksEnabled ? "true" : "false",
        };
      }
      host._setMsg("Gespeichert");
      return true;
    },
    closeOnly: false,
  });

  return true;
}

export function getProtokollGlobalSettingKeys() {
  return [...PROTOKOLL_GLOBAL_SETTING_KEYS];
}
