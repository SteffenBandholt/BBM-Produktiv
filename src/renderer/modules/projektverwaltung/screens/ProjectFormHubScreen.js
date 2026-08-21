import LegacyProjectFormScreen from "./ProjectFormScreen.js";

function walk(root, predicate) {
  if (!root || typeof root.querySelectorAll !== "function") return [];
  return Array.from(root.querySelectorAll("*"))
    .filter((el) => predicate(el));
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

/**
 * Neutrale Projektformular-Huelle fuer den modularen BBM-Projektkern.
 *
 * Die bestehende Speicher-/IPC-Logik bleibt unveraendert. Die Huelle raeumt
 * nur die fachliche Darstellung auf und macht technische bzw. Protokoll-
 * spezifische Bestandsfunktionen als Uebergang ehrlich sichtbar.
 */
export default class ProjectFormHubScreen extends LegacyProjectFormScreen {
  _decorateNeutralProjectForm(root) {
    if (!root) return root;

    renameExact(root, "Bezeichnung *", "Projektbezeichnung *");
    renameExact(root, "Kurzbez.", "Kurzbezeichnung");
    renameExact(root, "Projektleiter", "Interne Projektleitung");

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

    return root;
  }

  _renameLegacyModuleSettings(buttonRow) {
    if (!buttonRow) return buttonRow;
    const settingsButton = Array.from(buttonRow.querySelectorAll?.("button") || []).find(
      (btn) => String(btn.textContent || "").trim() === "Einstellungen"
    );
    if (settingsButton) {
      settingsButton.textContent = "Protokoll-Einstellungen";
      settingsButton.title =
        "Uebergang: Diese Einstellungen gehoeren fachlich zum Protokollmodul und werden spaeter dorthin verschoben.";
      settingsButton.style.opacity = "0.78";
    }
    return buttonRow;
  }

  _buildFormContent() {
    const root = super._buildFormContent();
    return this._decorateNeutralProjectForm(root);
  }

  _buildPageButtonRow() {
    return this._renameLegacyModuleSettings(super._buildPageButtonRow());
  }

  _buildModalFooter() {
    return this._renameLegacyModuleSettings(super._buildModalFooter());
  }
}
