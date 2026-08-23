import { applyPopupButtonStyle } from "../../ui/popupButtonStyles.js";
import {
  cleanupPopupHandlers,
  createPopupOverlay,
  registerPopupCloseHandlers,
  stylePopupCard,
} from "../../ui/popupCommon.js";
import { OVERLAY_TOP } from "../../ui/zIndex.js";

const TEXT_FIELDS = Object.freeze([
  ["short", "Kurzbezeichnung"],
  ["name", "Name"],
  ["name2", "Namenszusatz"],
  ["street", "Straße"],
  ["zip", "PLZ"],
  ["city", "Ort"],
  ["phone", "Telefon"],
  ["email", "E-Mail"],
  ["gewerk", "Gewerk / Funktion"],
  ["role_code", "Rollencode"],
  ["notes", "Notizen"],
]);

function setStyles(element, styles) {
  Object.assign(element.style, styles);
  return element;
}

function makeField(key, label, value) {
  const wrapper = setStyles(document.createElement("label"), {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    gridColumn: key === "notes" ? "1 / -1" : "auto",
  });
  wrapper.classList.add("bbm-form-field");
  const caption = document.createElement("span");
  caption.textContent = label;
  caption.classList.add("bbm-form-label");
  caption.style.fontSize = "11.5px";
  const control = document.createElement(key === "notes" ? "textarea" : "input");
  control.value = String(value || "");
  control.dataset.firmField = key;
  control.style.minHeight = key === "notes" ? "52px" : "30px";
  control.style.setProperty("padding", "4px 8px", "important");
  control.style.border = "1px solid #cbd5e1";
  control.style.borderRadius = "6px";
  wrapper.append(caption, control);
  return { wrapper, control };
}

function makeCheckbox(label, checked) {
  const wrapper = setStyles(document.createElement("label"), {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  });
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = !!checked;
  wrapper.append(input, document.createTextNode(label));
  return { wrapper, input };
}

export function openFirmEditor({
  api = globalThis.window?.bbmDb,
  origin,
  projectId = null,
  kind = null,
  firm = null,
  title = firm ? "Firma bearbeiten" : "Firma anlegen",
} = {}) {
  return new Promise((resolve) => {
    if (!api?.firmDirectoryCreate || !api?.firmDirectoryUpdate || !api?.firmDirectorySetUses) {
      resolve({ ok: false, error: "Zentrale Firmen-API ist nicht verfügbar." });
      return;
    }

    const overlay = createPopupOverlay({ background: "rgba(15,23,42,.48)", zIndex: OVERLAY_TOP });
    overlay.style.display = "flex";
    overlay.dataset.firmEditor = "shared";
    const card = document.createElement("section");
    card.className = "bbm-popup-standard bbm-popup-dialog";
    stylePopupCard(card, { width: "min(640px, calc(100vw - 24px))", maxHeight: "calc(100vh - 24px)" });
    card.style.setProperty("--bbm-popup-control-height", "30px");
    card.style.setProperty("--bbm-popup-textarea-height", "52px");
    card.style.setProperty("--bbm-popup-button-height", "28px");
    card.style.setProperty("--bbm-popup-label-field-gap", "2px");
    card.style.setProperty("--bbm-popup-dialog-padding-y", "9px");
    card.style.setProperty("--bbm-popup-dialog-padding-x", "14px");
    card.style.setProperty("--bbm-popup-footer-padding-y", "8px");
    card.style.setProperty("--bbm-popup-footer-padding-x", "14px");

    const header = setStyles(document.createElement("header"), {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 14px",
      borderBottom: "1px solid #e2e8f0",
    });
    header.classList.add("bbm-popup-header");
    const heading = document.createElement("h2");
    heading.textContent = title;
    heading.style.margin = "0";
    heading.style.fontSize = "18px";
    heading.style.lineHeight = "1.25";
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "Schließen";
    applyPopupButtonStyle(closeButton, { variant: "neutral" });
    header.append(heading, closeButton);

    const body = setStyles(document.createElement("div"), { padding: "9px 14px", overflow: "auto" });
    body.classList.add("bbm-popup-body");
    const scopeRow = setStyles(document.createElement("label"), {
      display: origin === "invoice" && projectId && !firm ? "flex" : "none",
      flexDirection: "column",
      gap: "2px",
      marginBottom: "7px",
    });
    const scopeCaption = document.createElement("span");
    scopeCaption.textContent = "Ablage";
    scopeCaption.classList.add("bbm-form-label");
    const scope = document.createElement("select");
    for (const [value, label] of [["global_firm", "Zentrale Firma"]]) {
      const entry = document.createElement("option");
      entry.value = value;
      entry.textContent = label;
      scope.appendChild(entry);
    }
    const defaultKind =
      firm?.kind ||
      (origin === "invoice" ? "global_firm" : kind) ||
      (origin === "firms"
        ? "global_firm"
        : "project_firm");
    scope.value = defaultKind;
    scopeRow.append(scopeCaption, scope);
    const fixedKind = defaultKind;
    const scopeInfo = setStyles(document.createElement("div"), {
      display: scopeRow.style.display === "none" ? "block" : "none",
      marginBottom: "7px",
      padding: "5px 8px",
      borderRadius: "6px",
      background: "#f1f5f9",
      fontSize: "12px",
      lineHeight: "1.3",
    });
    scopeInfo.textContent =
      fixedKind === "global_firm"
        ? origin === "invoice" ? "Ablage: Zentrale Firma" : "Scope: Global"
        : `Scope: Lokal${projectId ? ` · Projekt ${projectId}` : ""}`;

    const grid = setStyles(document.createElement("div"), {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "6px 10px",
    });
    const controls = {};
    for (const [key, label] of TEXT_FIELDS) {
      const field = makeField(key, label, firm?.[key]);
      controls[key] = field.control;
      grid.appendChild(field.wrapper);
    }

    const usesRow = setStyles(document.createElement("fieldset"), {
      display: "flex",
      gap: "16px",
      margin: "8px 0 0",
      padding: "6px 9px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
    });
    const legend = document.createElement("legend");
    legend.textContent = "Verwendungen";
    legend.style.fontSize = "12px";
    const defaultParticipant = firm
      ? Number(firm?.uses?.projectParticipant ?? firm?.use_project_participant) === 1
      : origin !== "invoice";
    const defaultCustomer = firm
      ? Number(firm?.uses?.customer ?? firm?.use_customer) === 1
      : origin === "invoice";
    const participant = makeCheckbox("Projektteilnehmer", defaultParticipant);
    const customer = makeCheckbox("Rechnungskunde", defaultCustomer);
    usesRow.append(legend, participant.wrapper, customer.wrapper);

    const message = document.createElement("div");
    message.setAttribute("role", "status");
    message.style.minHeight = "14px";
    message.style.marginTop = "4px";
    message.style.fontSize = "12px";
    message.style.lineHeight = "1.2";
    message.style.color = "#b91c1c";
    body.append(scopeRow, scopeInfo, grid, usesRow, message);

    const footer = setStyles(document.createElement("footer"), {
      display: "flex",
      justifyContent: "flex-end",
      gap: "6px",
      padding: "8px 14px",
      borderTop: "1px solid #e2e8f0",
    });
    footer.classList.add("bbm-popup-footer");
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Abbrechen";
    applyPopupButtonStyle(cancel, { variant: "neutral" });
    const save = document.createElement("button");
    save.type = "button";
    save.textContent = "Speichern";
    applyPopupButtonStyle(save, { variant: "primary" });
    footer.append(cancel, save);
    card.append(header, body, footer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      cleanupPopupHandlers(overlay);
      overlay.remove();
      resolve(result);
    };
    closeButton.onclick = () => finish({ ok: true, canceled: true });
    cancel.onclick = () => finish({ ok: true, canceled: true });
    registerPopupCloseHandlers(overlay, () => finish({ ok: true, canceled: true }));

    save.onclick = async () => {
      const data = Object.fromEntries(TEXT_FIELDS.map(([key]) => [key, controls[key].value.trim()]));
      if (!data.name) {
        message.textContent = "Name ist erforderlich.";
        controls.name.focus();
        return;
      }
      const uses = {
        projectParticipant: participant.input.checked ? 1 : 0,
        customer: customer.input.checked ? 1 : 0,
      };
      save.disabled = true;
      message.textContent = "Speichere …";
      try {
        let response;
        if (!firm) {
          response = await api.firmDirectoryCreate({
            origin,
            kind: scope.value || kind || undefined,
            projectId,
            data,
            uses,
          });
        } else {
          if (typeof api.firmDirectoryCheckUseChange === "function") {
            const preview = await api.firmDirectoryCheckUseChange({ ref: firm.ref, uses });
            if (!preview?.ok || preview?.assessment?.allowed === false) {
              const impacts = preview?.assessment?.impacts || preview?.impacts || [];
              const details = impacts.map((impact) => `${impact.label}: ${impact.count}`).join("; ");
              message.textContent = [preview?.error || "Verwendung kann wegen aktiver Referenzen nicht deaktiviert werden.", details]
                .filter(Boolean)
                .join(" ");
              return;
            }
          }
          response = await api.firmDirectoryUpdate({ ref: firm.ref, patch: data });
          if (response?.ok) {
            response = await api.firmDirectorySetUses({
              ref: firm.ref,
              uses,
              expectedUpdatedAt: response.firm?.updated_at,
            });
          }
        }
        if (!response?.ok) {
          const details = (response?.impacts || []).map((impact) => `${impact.label}: ${impact.count}`).join("; ");
          message.textContent = [response?.error || "Speichern fehlgeschlagen.", details].filter(Boolean).join(" ");
          return;
        }
        finish({ ok: true, canceled: false, firm: response.firm });
      } catch (error) {
        message.textContent = error?.message || String(error);
      } finally {
        save.disabled = false;
      }
    };

    controls.name.focus();
  });
}
