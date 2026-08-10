const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

async function runPopupFormStandardTests(run) {
  await run("Popup-Standard: dokumentiert die freigegebenen Rechnungen-Tokens zentral", () => {
    const css = read("src/renderer/ui/styles/popupFormStandard.css");
    [
      "--bbm-popup-control-height: 32px",
      "--bbm-popup-button-height: 30px",
      "--bbm-popup-control-radius: 8px",
      "--bbm-popup-card-radius: 12px",
      "--bbm-popup-dialog-radius: 14px",
      "--bbm-popup-label-font-size: 11.5px",
      "--bbm-popup-control-font-size: 13px",
      "--bbm-popup-label-field-gap: 4px",
      "--bbm-popup-group-gap: 10px",
      "--bbm-popup-card-padding: 14px",
      "--bbm-popup-dialog-padding-y: 12px",
      "--bbm-popup-dialog-padding-x: 16px",
      "--bbm-popup-canvas: #f3f5f8",
      "--bbm-popup-text: #172033",
      "--bbm-popup-primary: #235a9f",
      "--bbm-popup-border: #d7dee8",
      "--bbm-popup-focus: #2563eb",
      "--bbm-popup-placeholder: #98a2b3",
      "--bbm-popup-disabled-bg: #f1f3f6",
    ].forEach((token) => assert.equal(css.includes(token), true, token));
  });

  await run("Popup-Standard: bleibt opt-in und deckt Controls, Karten sowie Header/Footer ab", () => {
    const css = read("src/renderer/ui/styles/popupFormStandard.css");
    [
      ".bbm-popup-standard.bbm-popup-dialog",
      ".bbm-popup-standard .bbm-popup-header",
      ".bbm-popup-standard .bbm-popup-body",
      ".bbm-popup-standard .bbm-popup-footer",
      ".bbm-popup-standard .bbm-form-card",
      ".bbm-popup-standard .bbm-form-field",
      ".bbm-popup-standard .bbm-form-label",
      "input:not([type=\"checkbox\"])",
      ":not(.invoice-control)",
      "select:not(.invoice-control),",
      "textarea",
      "::placeholder",
      ":focus-visible",
      ":disabled",
    ].forEach((selector) => assert.equal(css.includes(selector), true, selector));
    assert.equal(css.includes("body input"), false);
  });

  await run("Popup-Standard: wird einmal zentral durch die CoreShell geladen", () => {
    const shell = read("src/renderer/app/CoreShell.js");
    const loader = read("src/renderer/ui/popupFormStyles.js");
    assert.equal(shell.includes('import { ensurePopupFormStandardStyles } from "../ui/popupFormStyles.js"'), true);
    assert.equal(shell.includes("ensurePopupFormStandardStyles();"), true);
    assert.equal(loader.includes("popupFormStandard.css"), true);
    assert.equal(loader.includes('POPUP_FORM_STANDARD_STYLE_TAG = "bbm-popup-form-standard-styles"'), true);
    assert.equal(loader.includes("link.setAttribute(`data-${POPUP_FORM_STANDARD_STYLE_TAG}`"), true);
  });

  await run("Popup-Standard: aktiviert nur Rechnungen, Projekt und zwei Settings-Piloten", () => {
    const invoices = read("src/renderer/modules/rechnungen/screens/RechnungenDesignScreen.js");
    const project = read("src/renderer/modules/projektverwaltung/screens/ProjectFormScreen.js");
    const settings = read("src/renderer/views/SettingsView.js");
    assert.equal(invoices.includes("bbm-invoice-design bbm-popup-standard"), true);
    assert.equal(invoices.includes('overlay.classList.add("bbm-invoice-design-modal")'), true);
    assert.equal(project.includes('modal.classList.add("bbm-popup-standard", "bbm-popup-dialog")'), true);
    assert.equal((settings.match(/standardForm: true/g) || []).length, 2);
    assert.equal(settings.includes('title: "Profil / Adresse",\n      content: [wrap],\n      standardForm: true'), true);
    assert.equal(settings.includes('title: "Protokoll",\n      content: [wrap],\n      standardForm: true'), true);
    assert.equal(settings.includes("standardForm = false"), true);
    assert.equal(settings.includes('classList.toggle("bbm-popup-standard", !!standardForm)'), true);
  });

  await run("Popup-Standard: zentrale Dokumentation nennt Zweck, Nutzer und Pilotgrenze", () => {
    const docs = read("docs/BBM_POPUP_FORMULARSTANDARD.md");
    assert.equal(docs.includes("Tokenname"), true);
    assert.equal(docs.includes("Projekt bearbeiten"), true);
    assert.equal(docs.includes("Profil / Adresse"), true);
    assert.equal(docs.includes("keine Massenmigration"), true);
  });
}

module.exports = { runPopupFormStandardTests };
