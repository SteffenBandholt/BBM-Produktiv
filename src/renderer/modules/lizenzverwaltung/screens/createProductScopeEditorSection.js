import { PRODUCT_SCOPE } from "../productScope.js";

const REQUIRED_STANDARD_SCOPE_KEYS = Object.freeze(["app", "pdf", "export"]);

export function createProductScopeEditorSection({ applyPopupCardStyle, applyPopupButtonStyle } = {}) {
  const model = {
    standardumfang: [...REQUIRED_STANDARD_SCOPE_KEYS],
    zusatzfunktionen: PRODUCT_SCOPE.zusatzfunktionen.entries
      .filter((entry) => entry.defaultEnabled)
      .map((entry) => entry.key),
    module: [],
  };

  const optionalFeatureChecks = new Map();
  const message = document.createElement("div");
  message.style.fontSize = "12px";
  message.style.padding = "8px";
  message.style.borderRadius = "8px";
  message.style.background = "#f8fafc";
  message.style.border = "1px solid rgba(0,0,0,0.08)";
  message.textContent = "Noch keine Pruefung ausgefuehrt.";

  const card = document.createElement("div");
  if (typeof applyPopupCardStyle === "function") {
    applyPopupCardStyle(card);
  }
  card.style.display = "grid";
  card.style.gap = "10px";

  const title = document.createElement("h3");
  title.textContent = "Produktumfang";
  title.style.margin = "0";

  const hint = document.createElement("p");
  hint.textContent = "vorbereitet, noch ohne Speicherung";
  hint.style.margin = "0";
  hint.style.fontSize = "12px";
  hint.style.opacity = "0.8";

  const groupsWrap = document.createElement("div");
  groupsWrap.style.display = "grid";
  groupsWrap.style.gap = "12px";

  const renderReadonlyGroup = ({ title: groupTitle, note = "", entries = [] }) => {
    const section = document.createElement("section");
    section.style.display = "grid";
    section.style.gap = "8px";

    const heading = document.createElement("h4");
    heading.textContent = groupTitle;
    heading.style.margin = "0";

    section.appendChild(heading);

    if (note) {
      const noteEl = document.createElement("p");
      noteEl.textContent = note;
      noteEl.style.margin = "0";
      noteEl.style.fontSize = "12px";
      noteEl.style.opacity = "0.8";
      section.appendChild(noteEl);
    }

    entries.forEach((entry) => {
      const row = document.createElement("label");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "8px";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.disabled = true;

      const text = document.createElement("span");
      text.textContent = entry.label;

      row.append(checkbox, text);
      section.appendChild(row);
    });

    return section;
  };

  const renderSelectableGroup = ({ title: groupTitle, entries = [] }) => {
    const section = document.createElement("section");
    section.style.display = "grid";
    section.style.gap = "8px";

    const heading = document.createElement("h4");
    heading.textContent = groupTitle;
    heading.style.margin = "0";
    section.appendChild(heading);

    entries.forEach((entry) => {
      const row = document.createElement("label");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "8px";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = model.zusatzfunktionen.includes(entry.key);
      checkbox.onchange = () => {
        if (checkbox.checked) {
          if (!model.zusatzfunktionen.includes(entry.key)) {
            model.zusatzfunktionen.push(entry.key);
          }
        } else {
          model.zusatzfunktionen = model.zusatzfunktionen.filter((key) => key !== entry.key);
        }
      };
      optionalFeatureChecks.set(entry.key, checkbox);

      const text = document.createElement("span");
      text.textContent = entry.label;

      row.append(checkbox, text);
      section.appendChild(row);
    });

    return section;
  };

  groupsWrap.append(
    renderReadonlyGroup(PRODUCT_SCOPE.standardumfang),
    renderSelectableGroup(PRODUCT_SCOPE.zusatzfunktionen),
    renderReadonlyGroup(PRODUCT_SCOPE.module)
  );

  const runValidation = () => {
    const hasRequiredStandardumfang = REQUIRED_STANDARD_SCOPE_KEYS.every((key) =>
      model.standardumfang.includes(key)
    );

    if (!hasRequiredStandardumfang) {
      message.textContent =
        "Pruefung fehlgeschlagen: Standardumfang muss app, pdf und export enthalten.";
      message.style.background = "#fef2f2";
      message.style.borderColor = "rgba(220, 38, 38, 0.35)";
      return false;
    }

    message.textContent =
      "Pruefung erfolgreich: Standardumfang enthaelt app, pdf, export. Keine Speicherung erfolgt.";
    message.style.background = "#f0fdf4";
    message.style.borderColor = "rgba(34, 197, 94, 0.35)";
    return true;
  };

  const buttons = document.createElement("div");
  buttons.style.display = "flex";
  buttons.style.gap = "8px";

  const btnReset = document.createElement("button");
  btnReset.type = "button";
  btnReset.textContent = "Neu / leeren";
  if (typeof applyPopupButtonStyle === "function") applyPopupButtonStyle(btnReset);
  btnReset.onclick = () => {
    model.standardumfang = [...REQUIRED_STANDARD_SCOPE_KEYS];
    model.zusatzfunktionen = PRODUCT_SCOPE.zusatzfunktionen.entries
      .filter((entry) => entry.defaultEnabled)
      .map((entry) => entry.key);

    optionalFeatureChecks.forEach((checkbox, key) => {
      checkbox.checked = model.zusatzfunktionen.includes(key);
    });

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

  buttons.append(btnReset, btnValidate);
  card.append(title, hint, groupsWrap, buttons, message);
  return card;
}
