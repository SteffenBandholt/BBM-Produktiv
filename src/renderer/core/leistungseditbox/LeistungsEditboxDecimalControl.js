import { ensureLeistungsEditboxStyles } from "./styles.js";

const DECIMAL_CLASS = "bbm-leistungseditbox-decimal";

function clampPlaces(value, minPlaces, maxPlaces) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return minPlaces;
  return Math.max(minPlaces, Math.min(maxPlaces, Math.round(numeric)));
}

function patternForPlaces(places) {
  return places > 0 ? `0,${"0".repeat(places)}` : "0";
}

export class LeistungsEditboxDecimalControl {
  constructor({
    documentRef,
    value = 2,
    minPlaces = 0,
    maxPlaces = 4,
    onChange = null,
    ariaLabel = "Nachkommastellen",
  } = {}) {
    const doc = documentRef || globalThis.document;
    if (!doc?.createElement) throw new Error("LeistungsEditboxDecimalControl benötigt ein Document.");

    ensureLeistungsEditboxStyles(doc);

    this.minPlaces = Number.isInteger(minPlaces) ? minPlaces : 0;
    this.maxPlaces = Number.isInteger(maxPlaces) ? maxPlaces : 4;
    this.onChange = typeof onChange === "function" ? onChange : null;
    this.value = clampPlaces(value, this.minPlaces, this.maxPlaces);

    this.root = doc.createElement("span");
    this.root.className = DECIMAL_CLASS;
    this.root.setAttribute("role", "group");
    this.root.setAttribute("aria-label", ariaLabel);

    this.decreaseButton = doc.createElement("button");
    this.decreaseButton.type = "button";
    this.decreaseButton.className = `${DECIMAL_CLASS}__step ${DECIMAL_CLASS}__step--decrease`;
    this.decreaseButton.setAttribute("aria-label", "Weniger Nachkommastellen");
    this.decreaseButton.textContent = "‹";

    this.pattern = doc.createElement("span");
    this.pattern.className = `${DECIMAL_CLASS}__pattern`;
    this.pattern.setAttribute("aria-live", "polite");

    this.increaseButton = doc.createElement("button");
    this.increaseButton.type = "button";
    this.increaseButton.className = `${DECIMAL_CLASS}__step ${DECIMAL_CLASS}__step--increase`;
    this.increaseButton.setAttribute("aria-label", "Mehr Nachkommastellen");
    this.increaseButton.textContent = "›";

    this.root.append(this.decreaseButton, this.pattern, this.increaseButton);

    this.decreaseButton.addEventListener("click", () => this.setValue(this.value - 1));
    this.increaseButton.addEventListener("click", () => this.setValue(this.value + 1));

    this.render();
  }

  render() {
    this.pattern.textContent = patternForPlaces(this.value);
    this.decreaseButton.disabled = this.value <= this.minPlaces;
    this.increaseButton.disabled = this.value >= this.maxPlaces;
    this.root.dataset.decimalPlaces = String(this.value);
  }

  getElement() {
    return this.root;
  }

  getValue() {
    return this.value;
  }

  setValue(value, { silent = false } = {}) {
    const next = clampPlaces(value, this.minPlaces, this.maxPlaces);
    if (next === this.value) return;
    this.value = next;
    this.render();
    if (!silent) this.onChange?.(this.value);
  }

  getPattern() {
    return patternForPlaces(this.value);
  }
}

export {
  DECIMAL_CLASS as LEISTUNGSEDITBOX_DECIMAL_CLASS,
  patternForPlaces as leistungsEditboxDecimalPattern,
};
