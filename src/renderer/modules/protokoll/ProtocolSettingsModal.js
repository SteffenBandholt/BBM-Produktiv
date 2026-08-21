import { applyPopupButtonStyle } from "../../ui/popupButtonStyles.js";
import { cleanupPopupHandlers, createPopupOverlay } from "../../ui/popupCommon.js";

const KEYS = Object.freeze([
  "pdf.protocolTitle",
  "pdf.footerPlace",
  "pdf.footerDate",
  "pdf.footerName1",
  "pdf.footerName2",
  "pdf.footerRecorder",
  "pdf.footerStreet",
  "pdf.footerZip",
  "pdf.footerCity",
]);

function todayDe() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${now.getFullYear()}`;
}

function text(value) {
  return String(value || "").trim();
}

export async function openProtocolSettingsModal({ projectId } = {}) {
  const effectiveProjectId = text(projectId);
  if (!effectiveProjectId) {
    alert("Bitte zuerst ein Projekt auswählen.");
    return false;
  }

  const api = window.bbmDb || {};
  if (typeof api.projectSettingsGetMany !== "function" || typeof api.projectSettingsSetMany !== "function") {
    alert("Protokoll-Einstellungen sind nicht verfügbar.");
    return false;
  }

  const settingsRes = await api.projectSettingsGetMany({ projectId: effectiveProjectId, keys: KEYS });
  if (!settingsRes?.ok) {
    alert(settingsRes?.error || "Protokoll-Einstellungen konnten nicht geladen werden.");
    return false;
  }

  const data = settingsRes.data || {};
  let profile = {};
  if (typeof api.userProfileGet === "function") {
    try {
      const profileRes = await api.userProfileGet();
      if (profileRes?.ok) profile = profileRes.data || profileRes.profile || {};
    } catch (_e) {}
  }

  const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.35)", zIndex: 9999 });
  overlay.style.display = "flex";
  const modal = document.createElement("div");
  modal.className = "bbm-popup-standard bbm-popup-dialog";
  Object.assign(modal.style, {
    width: "min(760px, calc(100vw - 32px))",
    maxHeight: "calc(100vh - 32px)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  });

  const close = () => {
    try { cleanupPopupHandlers(overlay); } catch (_e) {}
    try { overlay.remove(); } catch (_e) {}
  };

  const head = document.createElement("div");
  head.className = "bbm-popup-header";
  Object.assign(head.style, { display: "flex", alignItems: "center", gap: "10px" });
  const title = document.createElement("div");
  title.textContent = "Protokoll-Einstellungen";
  title.style.fontWeight = "800";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "X";
  applyPopupButtonStyle(closeBtn);
  closeBtn.style.marginLeft = "auto";
  closeBtn.onclick = close;
  head.append(title, closeBtn);

  const body = document.createElement("div");
  body.className = "bbm-popup-body bbm-form-content";
  Object.assign(body.style, { overflow: "auto", display: "grid", gap: "12px" });

  const makeInput = (placeholder = "") => {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.style.width = "100%";
    input.style.boxSizing = "border-box";
    return input;
  };
  const makeRow = (label, field) => {
    const row = document.createElement("div");
    row.className = "bbm-form-field";
    Object.assign(row.style, { display: "grid", gridTemplateColumns: "220px minmax(0, 1fr)", alignItems: "center", gap: "10px" });
    const lab = document.createElement("div");
    lab.className = "bbm-form-label";
    lab.textContent = label;
    row.append(lab, field);
    return row;
  };
  const makeSection = (caption) => {
    const section = document.createElement("div");
    section.className = "bbm-form-card bbm-form-group";
    section.style.display = "grid";
    section.style.gap = "9px";
    const h = document.createElement("div");
    h.textContent = caption;
    h.style.fontWeight = "700";
    section.appendChild(h);
    return section;
  };

  const protocolTitle = makeInput("Protokoll");
  protocolTitle.value = text(data["pdf.protocolTitle"]);
  const protocolSection = makeSection("Protokoll");
  protocolSection.append(makeRow("Bezeichnung des Protokolls", protocolTitle));

  const footerSection = makeSection("Protokoll-Fuß (PDF)");
  const takeUser = document.createElement("button");
  takeUser.type = "button";
  takeUser.textContent = "Nutzerdaten übernehmen";
  applyPopupButtonStyle(takeUser);

  const footerPlace = makeInput("Ort");
  const footerDate = makeInput("dd.mm.yyyy");
  const footerName1 = makeInput("Name 1");
  const footerName2 = makeInput("Name 2");
  const footerRecorder = makeInput("Protokollführer");
  const footerStreet = makeInput("Str./HsNr.");
  const footerZip = makeInput("PLZ");
  const footerCity = makeInput("Ort");

  footerPlace.value = text(data["pdf.footerPlace"]);
  footerDate.value = text(data["pdf.footerDate"]) || todayDe();
  footerName1.value = text(data["pdf.footerName1"]);
  footerName2.value = text(data["pdf.footerName2"]);
  footerRecorder.value = text(data["pdf.footerRecorder"]);
  footerStreet.value = text(data["pdf.footerStreet"]);
  footerZip.value = text(data["pdf.footerZip"]);
  footerCity.value = text(data["pdf.footerCity"]);

  takeUser.onclick = () => {
    footerPlace.value = text(profile.city || profile.user_city);
    footerDate.value = todayDe();
    footerName1.value = text(profile.name1 || profile.user_name1);
    footerName2.value = text(profile.name2 || profile.user_name2);
    footerRecorder.value = text(profile.name1 || profile.user_name1);
    footerStreet.value = text(profile.street || profile.user_street);
    footerZip.value = text(profile.zip || profile.user_zip);
    footerCity.value = text(profile.city || profile.user_city);
  };

  footerSection.append(
    makeRow("Nutzerdaten", takeUser),
    makeRow("Ort (Ort, Datum)", footerPlace),
    makeRow("Datum", footerDate),
    makeRow("Name 1", footerName1),
    makeRow("Name 2", footerName2),
    makeRow("Protokollführer", footerRecorder),
    makeRow("Str./HsNr.", footerStreet),
    makeRow("PLZ", footerZip),
    makeRow("Ort (Adresse)", footerCity),
  );

  body.append(protocolSection, footerSection);

  const footer = document.createElement("div");
  footer.className = "bbm-popup-footer";
  Object.assign(footer.style, { display: "flex", justifyContent: "flex-end", gap: "8px" });
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Abbrechen";
  applyPopupButtonStyle(cancel);
  cancel.onclick = close;
  const save = document.createElement("button");
  save.type = "button";
  save.textContent = "Speichern";
  applyPopupButtonStyle(save, { variant: "primary" });
  save.onclick = async () => {
    const patch = {
      "pdf.protocolTitle": text(protocolTitle.value),
      "pdf.footerPlace": text(footerPlace.value),
      "pdf.footerDate": text(footerDate.value) || todayDe(),
      "pdf.footerName1": text(footerName1.value),
      "pdf.footerName2": text(footerName2.value),
      "pdf.footerRecorder": text(footerRecorder.value),
      "pdf.footerStreet": text(footerStreet.value),
      "pdf.footerZip": text(footerZip.value),
      "pdf.footerCity": text(footerCity.value),
    };
    const res = await api.projectSettingsSetMany({ projectId: effectiveProjectId, patch });
    if (!res?.ok) {
      alert(res?.error || "Protokoll-Einstellungen konnten nicht gespeichert werden.");
      return;
    }
    close();
  };

  footer.append(cancel, save);
  modal.append(head, body, footer);
  overlay.appendChild(modal);
  overlay.addEventListener("mousedown", (event) => {
    if (event.target === overlay) close();
  });
  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  document.body.appendChild(overlay);
  try { overlay.focus(); } catch (_e) {}
  return true;
}
