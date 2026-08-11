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

  await run("Popup-Standard: aktiviert die freigegebenen Rechnungen- und Produktdialoge", () => {
    const invoices = read("src/renderer/modules/rechnungen/screens/RechnungenDesignScreen.js");
    const project = read("src/renderer/modules/projektverwaltung/screens/ProjectFormScreen.js");
    const print = read("src/renderer/modules/ausgabe/PrintModal.js");
    const settings = read("src/renderer/views/SettingsView.js");
    assert.equal(invoices.includes("bbm-invoice-design bbm-popup-standard"), true);
    assert.equal(invoices.includes('overlay.classList.add("bbm-invoice-design-modal")'), true);
    assert.equal(project.includes('modal.classList.add("bbm-popup-standard", "bbm-popup-dialog")'), true);
    assert.equal((settings.match(/standardForm: true/g) || []).length, 8);
    assert.equal(settings.includes('title: "Profil / Adresse",\n      content: [wrap],\n      standardForm: true'), true);
    assert.equal(settings.includes('title: "Protokoll",\n      content: [wrap],\n      standardForm: true'), true);
    assert.equal(settings.includes('title: "Ausgabe & Druck",\n      content: [wrap],\n      standardForm: true'), true);
    assert.equal(settings.includes('title: "Drucklogos verwalten",\n      content: [wrap],\n      standardForm: true'), true);
    assert.equal(settings.includes('title: "Diktat / Audio",\n      content: [dictationSection.tab],\n      closeOnly: true,\n      standardForm: true'), true);
    assert.equal(settings.includes('title: "Rollenreihenfolge für Firmen",'), true);
    assert.equal(settings.includes('title: "Entwicklung",\n      content: [section],\n      closeOnly: true,\n      standardForm: true'), true);
    assert.equal(settings.includes('title: "Lizenz",\n          content: [this._createLicenseSettingsContent()],\n          closeOnly: true,\n          standardForm: true'), true);
    assert.equal(settings.includes("standardForm = false"), true);
    assert.equal(settings.includes('classList.toggle("bbm-popup-standard", !!standardForm)'), true);
    assert.equal(project.includes('body.classList.add("bbm-popup-body", "bbm-form-content")'), true);
    assert.equal(project.includes('section.classList.add("bbm-form-card", "bbm-form-group")'), true);
    assert.equal(project.includes('createPopupOverlay({ background: "rgba(0,0,0,0.35)", zIndex: 10020 })'), false);
    assert.equal(print.includes('overlay.setAttribute("data-bbm-print-overlay", "main")'), true);
    assert.equal(print.includes('modal.classList.add("bbm-popup-standard", "bbm-popup-dialog")'), true);
    assert.equal(print.includes('content.classList.add("bbm-popup-body", "bbm-form-content")'), true);
    assert.equal(print.includes('modal.style.maxHeight = "100%"'), true);
  });

  await run("Popup-Standard: Protokoll-, Firmen- und Teilnehmerdialoge nutzen die zentrale Opt-in-Basis", () => {
    const projects = read("src/renderer/modules/projektverwaltung/screens/ProjectsScreen.js");
    const firms = read("src/renderer/views/FirmsView.js");
    const projectFirms = read("src/renderer/views/ProjectFirmsView.js");
    const participants = read("src/renderer/ui/ParticipantsModals.js");
    const editorHtml = read("src/renderer/editor.html");
    const editorJs = read("src/renderer/editor.js");

    assert.equal(projects.includes('box.className = "bbm-popup-standard bbm-popup-dialog"'), true);
    assert.equal(projects.includes('body.className = "bbm-popup-body bbm-form-content"'), true);
    assert.equal(projects.includes('dateField.className = "bbm-form-field"'), true);
    assert.equal(projects.includes('inpDate.style.borderRadius = "6px"'), false);

    assert.equal((firms.match(/modal\.className = "bbm-popup-standard bbm-popup-dialog"/g) || []).length, 7);
    assert.equal(firms.includes('editWrap.className = "bbm-form-card"'), true);
    assert.equal(firms.includes('d.className = "bbm-form-label"'), true);

    assert.equal(
      (projectFirms.match(/className = "bbm-popup-standard bbm-popup-dialog"/g) || []).length,
      3
    );
    assert.equal(projectFirms.includes('row.className = "bbm-form-field"'), true);
    assert.equal(projectFirms.includes('localFirmBody.className = "bbm-popup-body bbm-form-content"'), true);
    assert.equal(projectFirms.includes('localPersonBody.className = "bbm-popup-body bbm-form-content"'), true);

    assert.equal(participants.includes('modal.className = "bbm-popup-standard bbm-popup-dialog"'), true);
    assert.equal(participants.includes('modal.style.maxHeight = "100%"'), true);
    assert.equal(participants.includes('list.className = "bbm-form-card"'), true);
    assert.equal(participants.includes('grid.style.gap = "12px"'), false);
    assert.equal(participants.includes('lblPresent.textContent = "Anwesend"'), true);
    assert.equal(participants.includes('cbPresent.setAttribute("aria-label", "Anwesend")'), true);
    assert.equal(participants.includes('controls.style.gridTemplateColumns = "1fr 1fr"'), true);
    assert.equal(participants.includes('controls.style.columnGap = "8px"'), true);
    assert.equal(participants.includes('controls.style.width = "148px"'), true);
    assert.equal(participants.includes('cbPresent.style.placeSelf = "center"'), true);
    assert.equal(participants.includes('cbDistribution.style.placeSelf = "center"'), true);
    assert.equal(participants.includes("flushLeftToDivider: false"), true);
    assert.equal(participants.includes('rightWidth: "166px"'), true);
    assert.equal(participants.includes("dividerOffsetMm: 0"), true);

    assert.equal(editorHtml.includes('href="./ui/styles/popupFormStandard.css"'), true);
    assert.equal(editorJs.includes('card bbm-popup-standard bbm-popup-dialog'), true);
    assert.equal(editorJs.includes('form bbm-popup-body'), true);
  });

  await run("Popup-Standard: Projektformular nutzt zentrale vertikale Abstände ohne lokale Zugabe", () => {
    const project = read("src/renderer/modules/projektverwaltung/screens/ProjectFormScreen.js");
    assert.equal(project.includes('row.classList.add("project-form-row")'), true);
    assert.equal(project.includes('row.style.columnGap = "var(--bbm-form-group-gap)"'), true);
    assert.equal(project.includes('row.style.rowGap = "var(--bbm-form-group-gap)"'), true);
    assert.equal(project.includes('row.classList.add("bbm-form-group")'), false);
    assert.equal(project.includes('row5.style.gap = "1cm"'), false);
    assert.equal(project.includes('storagePreviewWrap.style.marginTop'), false);
    assert.equal(project.includes('leftCol.style.gap = "var(--bbm-form-group-gap)"'), true);
    assert.equal(project.includes('rightCol.style.gap = "var(--bbm-form-group-gap)"'), true);
  });

  await run("Popup-Standard: Import-, Textkorrektur- und Maildialoge nutzen die Opt-in-Basis", () => {
    const projects = read("src/renderer/modules/projektverwaltung/screens/ProjectsScreen.js");
    const firms = read("src/renderer/views/FirmsView.js");
    const editbox = read("src/renderer/modules/protokoll/SharedEditboxCore.js");
    const mailFlow = read("src/renderer/features/mail/MailFlow.js");
    const mainHeader = read("src/renderer/ui/MainHeader.js");
    const popupCommon = read("src/renderer/ui/popupCommon.js");

    assert.equal(projects.includes('exportBox.className = "bbm-form-card bbm-form-group"'), true);
    assert.equal(projects.includes('footer.className = "bbm-popup-footer"'), true);
    assert.equal(projects.includes('createPopupOverlay({ background: "rgba(0,0,0,0.35)", zIndex: 9999 })'), true);

    assert.equal(firms.includes('createModal.className = "bbm-popup-standard bbm-popup-dialog"'), true);
    assert.equal(firms.includes('body.className = "bbm-popup-body bbm-form-content"'), true);
    assert.equal(firms.includes('row.className = "bbm-form-field"'), true);
    assert.equal(firms.includes('i.className = "bbm-import-table-control"'), true);
    assert.equal(firms.includes('i.style.setProperty("min-height", "0", "important")'), true);
    assert.equal((firms.match(/createPopupOverlay\(/g) || []).length, 6);

    assert.equal(editbox.includes('body.className = "bbm-popup-body bbm-form-content"'), true);
    assert.equal(editbox.includes('promptRow.className = "bbm-form-field"'), true);

    assert.equal(mailFlow.includes('card.className = "bbm-popup-standard bbm-popup-dialog"'), true);
    assert.equal(mailFlow.includes('content.className = "bbm-popup-body bbm-form-content"'), true);
    assert.equal(mailFlow.includes('subjectField.className = "bbm-form-field"'), true);
    assert.equal(mailFlow.includes('actions.className = "bbm-popup-footer"'), true);
    assert.equal(mainHeader.includes('root.dataset.bbmMainHeader = "true"'), true);
    assert.equal(popupCommon.includes("const MAIN_HEADER_SELECTOR = '[data-bbm-main-header=\"true\"]'"), true);
    assert.equal(popupCommon.includes('? "app"'), true);
  });

  await run("Popup-Standard: Spezial- und Vorschaupopups nutzen die aktive gemeinsame Basis", () => {
    const help = read("src/renderer/ui/HelpModal.js");
    const print = read("src/renderer/modules/ausgabe/PrintModal.js");
    const selector = read("src/renderer/ui/react/ClosedProtocolSelector.js");
    const dictation = read("src/renderer/features/audio-dictation/DictationController.js");

    assert.equal(
      (help.match(/classList\.add\("bbm-popup-standard", "bbm-popup-dialog"\)/g) || []).length,
      2
    );
    assert.equal(help.includes('body.className = "bbm-popup-body"'), true);
    assert.equal(help.includes('footer.className = "bbm-popup-footer"'), true);
    assert.equal(help.includes('head.style.padding = "12px"'), false);

    assert.equal(
      (print.match(/modal\.classList\.add\("bbm-popup-standard", "bbm-popup-dialog"\)/g) || []).length,
      4
    );
    assert.equal(print.includes('content.className = "bbm-popup-body"'), true);
    assert.equal(print.includes('body.className = "bbm-popup-body bbm-form-content"'), true);
    assert.equal(print.includes('actions.className = "bbm-popup-footer"'), true);
    assert.equal(print.includes('select.style.minHeight = "38px"'), false);
    assert.equal(print.includes("cleanupPopupHandlers(overlay)"), true);

    assert.equal(selector.includes("createPopupOverlay({ background:"), true);
    assert.equal(selector.includes('className: "bbm-popup-standard bbm-popup-dialog"'), true);
    assert.equal(selector.includes('className: "bbm-popup-body bbm-form-content"'), true);
    assert.equal(selector.includes('className: "bbm-popup-footer"'), true);
    assert.equal(selector.includes('overlay.style.position = "fixed"'), false);

    assert.equal(dictation.includes("maybeOfferTermCorrection(target, value, hostEl)"), true);
    assert.equal((dictation.match(/maybeOfferTermCorrection\(/g) || []).length, 1);
  });

  await run("Popup-Standard: Abschlusswelle standardisiert Restarbeiten, MainHeader-Mail und aktive TOP-Dialoge", () => {
    const restarbeiten = read("src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js");
    const mainHeader = read("src/renderer/ui/MainHeader.js");
    const topsDialogs = read("src/renderer/features/dialogs/TopsViewDialogs.js");

    assert.equal(
      restarbeiten.includes('card.className = "bbm-restarbeiten-notes-popup bbm-popup-standard bbm-popup-dialog"'),
      true
    );
    assert.equal(restarbeiten.includes('body.className = "bbm-restarbeiten-notes-popup__body bbm-popup-body bbm-form-content"'), true);
    assert.equal(restarbeiten.includes('footer.className = "bbm-restarbeiten-notes-popup__footer bbm-popup-footer"'), true);

    assert.equal(mainHeader.includes('const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.45)", zIndex: 12600 })'), true);
    assert.equal(mainHeader.includes('card.className = "bbm-popup-standard bbm-popup-dialog"'), true);
    assert.equal(mainHeader.includes('subjectField.className = "bbm-form-field"'), true);
    assert.equal(mainHeader.includes('actions.className = "bbm-popup-footer"'), true);

    assert.equal((topsDialogs.match(/className = "bbm-popup-standard bbm-popup-dialog"/g) || []).length, 2);
    assert.equal((topsDialogs.match(/createPopupOverlay\(/g) || []).length, 2);
    assert.equal(topsDialogs.includes('body.className = "bbm-popup-body bbm-form-content"'), true);
  });

  await run("Popup-Standard: zentrale Dokumentation nennt Zweck, Nutzer und Abschlussstatus", () => {
    const docs = read("docs/BBM_POPUP_FORMULARSTANDARD.md");
    assert.equal(docs.includes("Tokenname"), true);
    assert.equal(docs.includes("Projekt bearbeiten"), true);
    assert.equal(docs.includes("Profil / Adresse"), true);
    assert.equal(docs.includes("vollständig eingeführt"), true);
    assert.equal(docs.includes("keine weitere Massenmigration"), true);
  });
}

module.exports = { runPopupFormStandardTests };
