import LegacyProjectFormScreen from "./ProjectFormScreen.js";

function walk(root, predicate) {
  if (!root || typeof root.querySelectorAll !== "function") return [];
  return Array.from(root.querySelectorAll("*")).filter((el) => predicate(el));
}

function findByText(root, text) {
  const target = String(text || "").trim();
  return walk(root, (el) => String(el.textContent || "").trim() === target)[0] || null;
}

function renameExact(root, from, to) {
  const el = findByText(root, from);
  if (el) el.textContent = to;
  return el;
}

function getFieldByLabel(root, labelText) {
  const label = findByText(root, labelText);
  return label?.closest?.(".bbm-form-field") || label?.parentElement || null;
}

function getRowForField(field) {
  return field?.closest?.(".project-form-row") || field?.parentElement || null;
}

function makeFieldFluid(field) {
  if (!field) return;
  field.style.flex = "1 1 0";
  field.style.minWidth = "0";
  field.style.width = "auto";
  field.style.maxWidth = "none";

  const control = field.querySelector?.("input, textarea, select");
  if (!control) return;
  control.style.width = "100%";
  control.style.maxWidth = "100%";
  control.style.minWidth = "0";
  control.style.boxSizing = "border-box";
}

function setGridRow(row, columns) {
  if (!row) return;
  row.style.display = "grid";
  row.style.gridTemplateColumns = columns;
  row.style.columnGap = "12px";
  row.style.rowGap = "8px";
  row.style.alignItems = "end";
  row.style.width = "100%";
}

/**
 * Neutrale Projektformular-Huelle fuer den modularen BBM-Projektkern.
 *
 * Die bestehende Speicher-/IPC-Logik bleibt unveraendert. Die Huelle raeumt
 * nur die fachliche Darstellung auf. Fachmodul-Funktionen gehoeren nicht in
 * dieses Formular und werden hier deshalb ausgeblendet.
 */
export default class ProjectFormHubScreen extends LegacyProjectFormScreen {
  _stabilizeProjectFormLayout(root) {
    const nameField = getFieldByLabel(root, "Projektbezeichnung *");
    const numberField = getFieldByLabel(root, "Projektnummer");
    const shortField = getFieldByLabel(root, "Kurzbezeichnung");
    const streetField = getFieldByLabel(root, "Straße");
    const zipField = getFieldByLabel(root, "PLZ");
    const cityField = getFieldByLabel(root, "Ort");
    const leadField = getFieldByLabel(root, "Interne Projektleitung");
    const phoneField = getFieldByLabel(root, "Telefon");
    const startField = getFieldByLabel(root, "Startdatum");
    const endField = getFieldByLabel(root, "Enddatum");
    const notesField = getFieldByLabel(root, "Notizen");

    [
      nameField,
      numberField,
      shortField,
      streetField,
      zipField,
      cityField,
      leadField,
      phoneField,
      startField,
      endField,
      notesField,
    ].forEach(makeFieldFluid);

    setGridRow(getRowForField(nameField), "minmax(0, 1fr)");
    setGridRow(getRowForField(numberField), "minmax(120px, .34fr) minmax(180px, .66fr)");
    setGridRow(getRowForField(streetField), "minmax(0, 1fr)");
    setGridRow(getRowForField(zipField), "120px minmax(0, 1fr)");
    setGridRow(getRowForField(leadField), "minmax(0, 1fr) minmax(170px, .72fr)");
    setGridRow(getRowForField(startField), "minmax(0, 1fr) minmax(0, 1fr)");
    setGridRow(getRowForField(notesField), "minmax(0, 1fr)");

    const mainForm = root.querySelector?.(".bbm-form-card > div");
    if (mainForm?.style?.gridTemplateColumns) {
      mainForm.style.gridTemplateColumns = "minmax(0, 1fr) 1px minmax(0, 1fr)";
      mainForm.style.columnGap = "18px";
    }

    const separator = mainForm?.children?.[1] || null;
    if (separator) {
      separator.style.height = "100%";
      separator.style.opacity = "0.55";
    }
  }

  _decorateNeutralProjectForm(root) {
    if (!root) return root;

    renameExact(root, "Bezeichnung *", "Projektbezeichnung *");
    renameExact(root, "Kurzbez.", "Kurzbezeichnung");
    renameExact(root, "Projektleiter", "Interne Projektleitung");
    renameExact(root, "PL-Handy", "Telefon");

    const intro = document.createElement("div");
    intro.setAttribute("data-bbm-project-core-hint", "true");
    intro.style.border = "1px solid #dfe5ec";
    intro.style.borderRadius = "9px";
    intro.style.background = "#f8fafc";
    intro.style.padding = "9px 11px";
    intro.style.marginBottom = "10px";
    intro.style.fontSize = "11.5px";
    intro.style.lineHeight = "1.45";
    intro.style.color = "#566274";
    intro.textContent =
      "Hier werden nur gemeinsame Projektstammdaten gepflegt. Firmen/Kunden und Fachmoduldaten wie Protokoll, Restarbeiten oder SiGeKo bleiben getrennt.";

    const firstVisibleChild = Array.from(root.children || []).find(
      (el) => el?.style?.display !== "none"
    );
    if (firstVisibleChild?.nextSibling) {
      root.insertBefore(intro, firstVisibleChild.nextSibling);
    } else {
      root.prepend(intro);
    }

    const storageTitle = findByText(root, "Ablageordner (PDF):");
    const storageCard = storageTitle?.closest?.(".bbm-form-card") || storageTitle?.parentElement || null;
    if (storageCard && !storageCard.closest?.("details[data-bbm-project-storage-details]")) {
      const details = document.createElement("details");
      details.setAttribute("data-bbm-project-storage-details", "true");
      details.style.marginTop = "8px";
      details.style.border = "1px solid #e5e7eb";
      details.style.borderRadius = "8px";
      details.style.background = "#fbfcfd";
      details.style.padding = "7px 9px";
      details.style.boxSizing = "border-box";

      const summary = document.createElement("summary");
      summary.textContent = "Technische Ablage anzeigen";
      summary.style.cursor = "pointer";
      summary.style.fontSize = "11.5px";
      summary.style.fontWeight = "700";
      summary.style.color = "#667085";

      const parent = storageCard.parentElement;
      if (parent) {
        parent.insertBefore(details, storageCard);
        details.append(summary, storageCard);
        storageCard.style.width = "100%";
        storageCard.style.maxWidth = "100%";
        storageCard.style.marginTop = "7px";
      }
    }

    this._stabilizeProjectFormLayout(root);
    return root;
  }

  _removeModuleSettingsButton(buttonRow) {
    if (!buttonRow) return buttonRow;
    const settingsButton = Array.from(buttonRow.querySelectorAll?.("button") || []).find(
      (btn) => ["Einstellungen", "Protokoll-Einstellungen"].includes(String(btn.textContent || "").trim())
    );
    if (settingsButton) settingsButton.remove();
    this.btnSettings = null;
    return buttonRow;
  }

  _buildFormContent() {
    const root = super._buildFormContent();
    return this._decorateNeutralProjectForm(root);
  }

  _buildPageButtonRow() {
    return this._removeModuleSettingsButton(super._buildPageButtonRow());
  }

  _buildModalFooter() {
    return this._removeModuleSettingsButton(super._buildModalFooter());
  }
}
