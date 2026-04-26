import { CUSTOMER_RECORD_FIELDS, LICENSE_RECORD_FIELDS } from "../licenseRecords.js";

function buildSectionCard({ title, hint = "", actionLabel = "", onClick = null }) {
  const card = document.createElement("section");
  card.style.border = "1px solid var(--card-border)";
  card.style.borderRadius = "10px";
  card.style.padding = "12px";
  card.style.background = "var(--card-bg)";
  card.style.minHeight = "90px";
  card.style.display = "grid";
  card.style.gap = "8px";

  const heading = document.createElement("h3");
  heading.textContent = title;
  heading.style.margin = "0";
  heading.style.fontSize = "16px";

  const hintEl = document.createElement("p");
  hintEl.textContent = hint || "Platzhalter";
  hintEl.style.margin = "0";
  hintEl.style.fontSize = "12px";
  hintEl.style.opacity = "0.75";

  card.append(heading, hintEl);

  if (actionLabel) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = actionLabel;
    btn.style.justifySelf = "start";
    btn.onclick = () => {
      if (typeof onClick === "function") onClick();
    };
    card.appendChild(btn);
  }

  return card;
}

function buildPreparedFieldHint(fields) {
  return `Vorbereitete Felder: ${fields.map((field) => field.label).join(", ")}.`;
}

export default class LicenseAdminScreen {
  constructor({ onOpenLicenseEditor, onOpenCustomerEditor, onOpenLicenseRecordEditor } = {}) {
    this.onOpenLicenseEditor = onOpenLicenseEditor;
    this.onOpenCustomerEditor = onOpenCustomerEditor;
    this.onOpenLicenseRecordEditor = onOpenLicenseRecordEditor;
  }

  render() {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gap = "12px";

    const title = document.createElement("h2");
    title.textContent = "Lizenzverwaltung";
    title.style.margin = "0";

    const adminHint = document.createElement("p");
    adminHint.textContent = "Admin-/Mutter-App-Modul";
    adminHint.style.margin = "0";

    const rolloutHint = document.createElement("p");
    rolloutHint.textContent = "Umsetzung erfolgt schrittweise";
    rolloutHint.style.margin = "0";
    rolloutHint.style.opacity = "0.85";

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
    grid.style.gap = "10px";

    grid.append(
      buildSectionCard({
        title: "Lizenz erstellen / bearbeiten",
        hint: "Bestehende Lizenz-UI aus SettingsView.",
        actionLabel: "Oeffnen",
        onClick: this.onOpenLicenseEditor,
      }),
      buildSectionCard({
        title: "Kunden",
        hint: buildPreparedFieldHint(CUSTOMER_RECORD_FIELDS),
        actionLabel: "Oeffnen",
        onClick: this.onOpenCustomerEditor,
      }),
      buildSectionCard({
        title: "Lizenzen",
        hint: buildPreparedFieldHint(LICENSE_RECORD_FIELDS),
        actionLabel: "Oeffnen",
        onClick: this.onOpenLicenseRecordEditor,
      }),
      buildSectionCard({ title: "Produktumfang" }),
      buildSectionCard({ title: "Historie" })
    );

    root.append(title, adminHint, rolloutHint, grid);
    return root;
  }
}
