const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8").replace(/\r\n/g, "\n");
}

async function runAusgabeModuleTests(run) {
  const [{ PrintModal, sendMailPayload }, { default: MainHeader }] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/ausgabe/index.js")),
    importEsmFromFile(path.join(process.cwd(), "src/renderer/ui/MainHeader.js")),
  ]);

  const moduleIndexSource = read("src/renderer/modules/ausgabe/index.js");
  const moduleReadmeSource = read("src/renderer/modules/ausgabe/README.md");
  const printModalSource = read("src/renderer/modules/ausgabe/PrintModal.js");
  const printAppSource = read("src/renderer/print/printApp.js");
  const printIpcSource = read("src/main/ipc/printIpc.js");
  const printPreloadSource = read("src/main/preload/printPreload.js");
  const printCssSource = read("src/renderer/print/print.css");
  const printShellSource = read("src/renderer/print/layout/PrintShell.js");
  const layoutCalibrationStateSource = read("src/renderer/layoutTools/layoutCalibrationState.js");
  const settingsViewSource = read("src/renderer/views/SettingsView.js");
  const routerSource = read("src/renderer/app/Router.js");
  const preloadSource = read("src/main/preload.js");
  const settingsIpcSource = read("src/main/ipc/settingsIpc.js");
  const printV2CssSource = read("src/renderer/print/v2/v2.css");
  const closedProtocolSelectorSource = read("src/renderer/ui/react/ClosedProtocolSelector.js");
  const sendMailSource = read("src/renderer/modules/ausgabe/sendMailPayload.js");
  const legacyPrintModalSource = read("src/renderer/ui/PrintModal.js");
  const legacySendMailSource = read("src/renderer/services/mail/sendMailPayload.js");
  const moduleCatalogSource = read("src/renderer/app/modules/moduleCatalog.js");
  const mainHeaderSource = read("src/renderer/ui/MainHeader.js");
  const mailFlowSource = read("src/renderer/features/mail/MailFlow.js");
  const mainSource = read("src/main/main.js");

  await run("Ausgabe: Modul exportiert PrintModal und sendMailPayload", () => {
    assert.equal(typeof PrintModal, "function");
    assert.equal(typeof sendMailPayload, "function");
    assert.equal(moduleIndexSource.includes('export { default as PrintModal } from "./PrintModal.js";'), true);
    assert.equal(moduleIndexSource.includes('export { sendMailPayload } from "./sendMailPayload.js";'), true);
  });

  await run("Ausgabe: neue Renderer-Dateien enthalten die Implementierung", () => {
    assert.equal(printModalSource.includes("export default class PrintModal"), true);
    assert.equal(sendMailSource.includes("export function sendMailPayload"), true);
  });

  await run("Ausgabe: alte Pfade bleiben nur als Compatibility-Re-Exports", () => {
    assert.equal(
      legacyPrintModalSource.trim(),
      'export { default } from "../modules/ausgabe/PrintModal.js";'
    );
    assert.equal(
      legacySendMailSource.trim(),
      'export { sendMailPayload } from "../../modules/ausgabe/sendMailPayload.js";'
    );
  });

  await run("Ausgabe: kein Sidebar- oder Modulkatalog-Eintrag", () => {
    assert.equal(moduleCatalogSource.includes("getAusgabeModuleEntry"), false);
    assert.equal(moduleCatalogSource.includes("AUSGABE_MODULE_ID"), false);
    assert.equal(moduleCatalogSource.includes("ausgabe"), false);
  });

  await run("Ausgabe: Doku beschreibt das Renderer-Modul", () => {
    assert.equal(moduleReadmeSource.includes("Ausgabe / Drucken / E-Mail"), true);
    assert.equal(moduleReadmeSource.includes("Main-Prozess"), true);
    assert.equal(moduleReadmeSource.includes("kein Sidebar-Modul"), true);
  });

  await run("Ausgabe: Print-Dialog nutzt klare Nutzertexte", () => {
    assert.equal(printModalSource.includes("Protokoll drucken"), true);
    assert.equal(printModalSource.includes("PDF-Vorschau"), true);
    assert.equal(printModalSource.includes("Firmenliste"), true);
    assert.equal(printModalSource.includes("ToDo-Liste"), true);
    assert.equal(printModalSource.includes("TOP-Liste"), true);
    assert.equal(printModalSource.includes("Gespeicherte Firmenlisten"), true);
    assert.equal(printModalSource.includes("Weitere Ausgaben"), true);
    assert.equal(
      printModalSource.includes("Nur abgeschlossene Besprechungen"),
      true
    );
    assert.equal(printModalSource.includes("PDF-Ablageordner:"), true);
    assert.equal(
      printModalSource.includes("abgeschlossene Besprechung"),
      true
    );
    assert.equal(printModalSource.includes("printClosedMeetingDirect"), true);
    assert.equal(printModalSource.includes("openTodoPrintPreview"), true);
    assert.equal(mainHeaderSource.includes('_openStoredProjectPdfSelectionPopup({ projectId: state.projectId, kind: "topsall" })'), true);
    assert.equal(printModalSource.includes("openFirmsPrintPreview"), true);
    assert.equal(printModalSource.includes("openStoredFirmsPdfSelection"), true);
    assert.equal(printModalSource.includes("_selectTodoResponsibleFilter"), true);
    assert.equal(printModalSource.includes("ToDo-Liste drucken"), true);
    assert.equal(printModalSource.includes("Optional einen Verantwortlichen wählen"), true);
    assert.equal(printAppSource.includes("Unbekannter Druckmodus"), true);
    assert.equal(printIpcSource.includes("Unbekannter Druckmodus"), true);
    assert.equal(printModalSource.includes("printMeetingPreview"), true);
    assert.equal(printModalSource.includes("layoutCalibrationEnabled"), false);
    assert.equal(printModalSource.includes("openHtmlPreview("), false);
    assert.equal(printAppSource.includes("_readAutoZoneWidthMm"), true);
    assert.equal(printAppSource.includes("_applyAutoZoneWidthMm"), true);
    assert.equal(printAppSource.includes("_applyAutoZoneInsetMm"), true);
    assert.equal(printAppSource.includes("_applyAutoZoneFontPt"), true);
    assert.equal(printAppSource.includes("_captureAutoLayoutDefaults"), true);
    assert.equal(printAppSource.includes("_loadStoredAutoLayouts"), true);
    assert.equal(printAppSource.includes("_buildAutoLayoutOverlayFromDom"), true);
    assert.equal(printAppSource.includes("_buildDevLayoutExportPayload"), true);
    assert.equal(printAppSource.includes("_showDevLayoutExport"), true);
    assert.equal(printAppSource.includes("loadLayoutCalibrationEnabled"), true);
    assert.equal(printAppSource.includes("parseLayoutCalibrationEnabled"), true);
    assert.equal(printAppSource.includes("LAYOUT_CALIBRATION_SETTING_KEY"), true);
    assert.equal(printAppSource.includes("window.bbmPrint.appSettingsOnChanged"), true);
    assert.equal(printAppSource.includes("_resolveLayoutCalibrationEnabled"), true);
    assert.equal(printAppSource.includes("root.dataset.devPdfLayout = layoutCalibrationEnabled ? \"true\" : \"false\";"), true);
    assert.equal(printAppSource.includes("Export"), true);
    assert.equal(printAppSource.includes("toolbar._autoState = toolbar._autoState || {};"), true);
    assert.equal(printAppSource.includes("Layoutmodus: AN"), false);
    assert.equal(settingsViewSource.includes("Layout-Kalibrierung aktivieren"), false);
    assert.equal(settingsViewSource.includes("dev.layoutCalibrationEnabled"), false);
    assert.equal(routerSource.includes("dev.layoutCalibrationEnabled"), true);
    assert.equal(preloadSource.includes("appSettingsOnChanged"), true);
    assert.equal(printPreloadSource.includes("appSettingsGetMany"), true);
    assert.equal(printPreloadSource.includes("appSettingsOnChanged"), true);
    assert.equal(settingsIpcSource.includes("app-settings:changed"), true);
    assert.equal(printIpcSource.includes("layoutCalibrationEnabled"), true);
    assert.equal(layoutCalibrationStateSource.includes("bbm:layout-calibration-changed"), true);
  });

  await run("Ausgabe: Drucken startet mit Druckart-Auswahl", async () => {
    const header = new MainHeader({ router: { currentProjectId: "17", currentMeetingId: "m1" } });
    const calls = [];
    header._ensureProtocolOutputEnabled = async () => true;
    header._setPrintOpen = () => {};
    header._setMailOpen = () => {};
    header._openPrintTypeSelectorFlow = async () => {
      calls.push("chooser");
    };

    await header._openPrintFileFlow();

    assert.deepEqual(calls, ["chooser"]);
  });

  await run("Ausgabe: Druckart-Auswahl reicht jede PDF-Art an den gespeicherten Projektbestand weiter", async () => {
    const calls = [];
    const header = new MainHeader({ router: { currentProjectId: "17", currentMeetingId: "m1" } });
    header._openStoredProjectPdfSelectionPopup = async (args) => {
      calls.push(args);
    };

    await header._handlePrintTypeSelection({ id: "protocol-print" }, { projectId: "17" });
    await header._handlePrintTypeSelection({ id: "firms-preview" }, { projectId: "17" });
    await header._handlePrintTypeSelection({ id: "todo-preview" }, { projectId: "17" });
    await header._handlePrintTypeSelection({ id: "topsAll-preview" }, { projectId: "17" });

    assert.deepEqual(calls, [
      { projectId: "17", kind: "protocol" },
      { projectId: "17", kind: "firms" },
      { projectId: "17", kind: "todo" },
      { projectId: "17", kind: "topsall" },
    ]);
  });

  await run("Ausgabe: Drucken zeigt nur gespeicherte PDF-Arten und keine laufende Vorschau", () => {
    const header = new MainHeader({
      router: {
        currentProjectId: "17",
        currentMeetingId: null,
        openMeetingPrintPreview: async () => {},
        openFirmsPrintPreview: async () => {},
        openTodoPrintPreview: async () => {},
        openTopListAllPrintPreview: async () => {},
      },
    });
    header._setPrintOpen = () => {};
    header._setMailOpen = () => {};

    const items = header._buildPrintTypeSelectionItems({ projectId: "17", meetingId: null });
    const byId = Object.fromEntries(items.map((item) => [item.id, item]));

    assert.deepEqual(items.map((item) => item.label), ["Protokoll", "Firmenliste", "ToDo-Liste", "TOP-Liste"]);
    assert.equal(byId["protocol-print"]?.disabled, false);
    assert.equal(byId["protocol-preview"], undefined);
    assert.equal(byId["todo-preview"]?.disabled, false);
    assert.equal(byId["topsAll-preview"]?.disabled, false);
    assert.equal(byId["firms-preview"]?.disabled, false);
  });

  await run("Ausgabe: Gespeicherte PDF-Auswahl zeigt nur Besprechungsfassungen", () => {
    const header = new MainHeader({ router: { currentProjectId: "17" } });
    const validProtocol = {
      fileName: "4711_Baustelle_Nordfluegel_#13-2026-05-07.pdf",
      filePath: "C:/pdf/valid-protocol.pdf",
    };
    const validFirms = {
      fileName: "4711 - Baustelle - Firmenliste - Stand #13 - 07.05.2026.pdf",
      filePath: "C:/pdf/valid-firms.pdf",
    };
    const invalidPreview = {
      fileName: "BBM 04-2026 UI-Polish für BBM Firmenliste.pdf",
      filePath: "C:/pdf/invalid-preview.pdf",
    };
    const invalidWithoutDate = {
      fileName: "4711 - Baustelle - TOP-Liste - Stand #13.pdf",
      filePath: "C:/pdf/invalid-without-date.pdf",
    };

    assert.deepEqual(
      header
        ._filterStoredMeetingPdfFiles([validProtocol, invalidPreview, validFirms, invalidWithoutDate])
        .map((item) => item.filePath),
      ["C:/pdf/valid-protocol.pdf", "C:/pdf/valid-firms.pdf"],
    );
    assert.equal(
      header._formatStoredProjectPdfListEntry(
        validProtocol,
        "protocol",
        [{ meeting_index: 13, title: "#13 - Nordflügel" }],
      ),
      "#13 - 07.05.2026 - Nordflügel",
    );
  });

  await run("Ausgabe: Gespeicherte PDF-Auswahl wird vor dem Oeffnen der Vorschau geschlossen", () => {
    assert.match(
      mainHeaderSource,
      /btn\.onclick = async \(\) => \{[\s\S]*?cleanup\(\);[\s\S]*?resolve\(\);[\s\S]*?openExistingPdfPreview\(/,
    );
  });

  await run("Ausgabe: Druckart-Auswahl akzeptiert Projektkontext aus router.context", () => {
    const header = new MainHeader({
      router: {
        context: { projectId: "17" },
        currentMeetingId: null,
        openMeetingPrintPreview: async () => {},
        openFirmsPrintPreview: async () => {},
        openTodoPrintPreview: async () => {},
        openTopListAllPrintPreview: async () => {},
      },
    });
    header._setPrintOpen = () => {};
    header._setMailOpen = () => {};

    const items = header._buildPrintTypeSelectionItems({ projectId: null, meetingId: null });
    const byId = Object.fromEntries(items.map((item) => [item.id, item]));

    assert.equal(byId["topsAll-preview"]?.disabled, false);
    assert.equal(byId["todo-preview"]?.disabled, false);
    assert.equal(mainHeaderSource.includes("this.router?.context?.projectId"), true);
  });

  await run("Ausgabe: PDF zeigt das TOP-Anlagedatum nicht auf Level 1", () => {
    assert.equal(printAppSource.includes("const createdDate = level === 1"), true);
    assert.equal(printAppSource.includes('? ""'), true);
    assert.equal(printAppSource.includes("_formatDateIso("), true);
    assert.equal(
      printModalSource.includes('const createdDate = isLevel1 ? "" : this._fmtDateYYYYMMDD(createdAtRaw);'),
      true
    );
  });

  await run("Ausgabe: wichtiger Level-1-Titel nutzt die vorhandene rote PDF-Farblogik", () => {
    assert.match(
      printAppSource,
      /const isImportant = Number\(top\.is_important \?\? top\.isImportant \?\? 0\) === 1;/
    );
    assert.match(
      read("src/renderer/print/layout/PrintShell.js"),
      /if \(row\.level === 1\)[\s\S]*?if \(row\.isImportant\) tr\.classList\.add\("isImportant"\);[\s\S]*?_applyImportantPrintColor\(topNumberEl, lvl1TextEl\);/
    );
    assert.match(
      printCssSource,
      /\.lvl1Row\.isImportant \.topNumber,[\s\S]*?\.lvl1Text\.isImportant \{\s*color: #c62828 !important;/
    );
  });

  await run("Ausgabe: Level-1-Titel reicht vorhandene ToDo- und Beschlusskennzeichnungen in das PDF durch", () => {
    assert.match(
      printAppSource,
      /const isTask = Number\(top\.is_task \?\? top\.isTask \?\? 0\) === 1;/
    );
    assert.match(
      printAppSource,
      /const isDecision = Number\(top\.is_decision \?\? top\.isDecision \?\? 0\) === 1;/
    );
    assert.equal(printAppSource.includes("appendProtocolTitleMarker(wrap, row);"), true);
    assert.equal(printShellSource.includes('new URL("../../assets/todo.png", import.meta.url).href'), true);
    assert.equal(printShellSource.includes('new URL("../../assets/redFlag.png", import.meta.url).href'), true);
    assert.match(printShellSource, /\.\.\.\(row\?\.isDecision \? \["decision"\] : \[\]\)/);
    assert.match(printShellSource, /\.\.\.\(row\?\.isTask \? \["task"\] : \[\]\)/);
    assert.equal(printShellSource.includes("appendProtocolTitleMarker(wrap, row);"), true);
    assert.equal(printCssSource.includes(".lvl1Marker img"), true);
    assert.match(printCssSource, /\.lvl1Text\s*\{[\s\S]*?margin-right: auto;/);
  });

  await run("Ausgabe: PDF-Schriftgrößen sind auf die neuen TOP-Werte gesetzt", () => {
    assert.equal(printCssSource.includes("--bbm-top-short-font-size: 8.5pt;"), true);
    assert.equal(printCssSource.includes("--bbm-top-long-font-size: 8.5pt;"), true);
    assert.equal(
      printCssSource.includes(".topsTable .shortText {\n  font-weight: 500;\n  font-size: 9pt;") ||
        printCssSource.includes(".topsTable .shortText {\n  font-weight: 500;\n  font-size: var(--bbm-top-col-text-font-size, 9pt);"),
      true
    );
    assert.equal(
      printCssSource.includes(".topsTable .longText {\n  margin-top: 2mm;\n  font-weight: 500;\n  font-size: 9pt;") ||
        printCssSource.includes(".topsTable .longText {\n  margin-top: 2mm;\n  font-weight: 500;\n  font-size: var(--bbm-top-col-text-font-size, 9pt);"),
      true
    );
    assert.equal(printCssSource.includes(".topsTable .colMeta {"), true);
    assert.equal(printCssSource.includes("font-size: 6.5pt;"), true);
    assert.equal(printCssSource.includes(".lvl1Row .topNumber {\n  font-size: 10pt;"), true);
    assert.equal(
      printCssSource.includes(".topNumber {\n  font-weight: 650;\n  font-size: 8.5pt;") ||
        printCssSource.includes(".topNumber {\n  font-weight: 650;\n  font-size: var(--bbm-top-col-nr-font-size, 8.5pt);"),
      true
    );
    assert.equal(printCssSource.includes(".topsTable thead .colNr,\n.topsTable thead .colText {\n  font-size: 10pt;"), true);
    assert.equal(printCssSource.includes(".topsTable thead .colMeta,\n.topsTable thead .metaHead,\n.topsTable thead .metaHead > div {\n  font-size: 8pt;"), true);
    assert.equal(printModalSource.includes(".colNr .nr {\n      font-weight: 400;\n      font-size: 8.5pt;"), true);
    assert.equal(printModalSource.includes("tr.lvl1 .short { font-weight: 650; }"), true);
    assert.equal(printModalSource.includes(".short {\n      font-weight: 500;\n      font-size: 8.5pt;"), true);
    assert.equal(printModalSource.includes("tr:not(.lvl1) .short {\n      font-size: 9pt;"), true);
    assert.equal(printModalSource.includes(".long {\n      margin-top: 1.2mm;\n      font-weight: 500;\n      font-size: 8.5pt;"), true);
    assert.equal(printModalSource.includes("tr:not(.lvl1) .long {\n      font-size: 9pt;"), true);
    assert.equal(printModalSource.includes(".colMeta { font-size: 6.5pt; color: #222; }"), true);
    assert.equal(printModalSource.includes(".hdr th.metaHdr {\n      font-weight: 400;\n      font-size: 8pt;"), true);
    assert.equal(printModalSource.includes(".footerBlock {\n      margin-top: 10mm;\n      font-size: 10pt;\n      font-weight: 500;"), true);
    assert.equal(printModalSource.includes(".footerTitle {\n      font-weight: 500;"), true);
    assert.equal(printModalSource.includes(".bbm-next-meeting-inline {\n      margin-top: 15mm;\n      font-size: 10pt;\n      font-weight: 500;"), true);
    assert.equal(printV2CssSource.includes(".printV2Root .v2MiniTopRow {"), true);
    assert.equal(printV2CssSource.includes(".printV2Root .v2MiniProject {\n  font-weight: 700;\n  font-size: 9pt;"), true);
    assert.equal(printV2CssSource.includes(".printV2Root .v2MiniRight {\n  font-size: 8pt;\n  font-weight: 400;"), true);
    assert.equal(printV2CssSource.includes(".printV2Root .v2MiniProtocolTitle {\n  font-size: 9pt;"), true);
    assert.equal(printV2CssSource.includes(".printV2Root .v2MiniDraftNotice {\n  position: absolute;"), true);
    assert.equal(printV2CssSource.includes("font-size: 10pt;"), true);
    assert.equal(printV2CssSource.includes(".printV2Root .v2Page {\n  font-size: 8pt;"), true);
    assert.equal(printV2CssSource.includes(".printV2Root .v2ProtocolFooterTitle {\n  font-weight: 600;"), true);
  });

  await run("Ausgabe: Legacy-PDF-Logo-Pfad ist nicht mehr aktiv", () => {
    assert.equal(printModalSource.includes("pdf.userLogo"), false);
  });

  await run("Ausgabe: Header fallt bei Lizenzblock nicht auf mailto zurueck", async () => {
    const originalWindow = global.window;
    const originalDocument = global.document;
    const originalAlert = global.alert;
    const alerts = [];
    const fallbackCalls = [];
    const draftCalls = [];

    global.window = {
      localStorage: {
        getItem() {
          return "";
        },
      },
      location: {
        href: "",
        assign(url) {
          this.href = url;
        },
      },
      bbmDb: {
        licenseGetStatus: async () => ({ ok: true, valid: true, modules: ["protokoll"] }),
      },
      bbmMail: {
        createOutlookDraft: async () => {
          draftCalls.push("draft");
          return {
            ok: false,
            blocked: true,
            licenseError: true,
            code: "FEATURE_NOT_ALLOWED",
            reason: "protokoll",
            error: "Modul Protokoll ist fuer diese Lizenz nicht freigeschaltet.",
          };
        },
      },
    };
    global.document = { title: "BBM" };
    global.alert = (msg) => alerts.push(String(msg || ""));

    try {
      const header = new MainHeader({ router: { currentProjectId: "17" } });
      header._sendMailtoFallback = () => {
        fallbackCalls.push("mailto");
      };

      const res = await header._dispatchMailTransport({
        recipients: ["test@example.de"],
        subject: "Betreff",
        body: "Hallo",
        attachments: ["A.pdf"],
      });

      assert.equal(res?.blocked, true);
      assert.equal(draftCalls.length, 1);
      assert.equal(fallbackCalls.length, 0);
      assert.equal(global.window.location.href, "");
      assert.equal(alerts.some((text) => text.includes("nicht freigeschaltet")), true);
    } finally {
      global.window = originalWindow;
      global.document = originalDocument;
      global.alert = originalAlert;
    }
  });

  await run("Ausgabe: Header blockiert den Mail-Dialog bei deaktiviertem Protokoll", async () => {
    const originalWindow = global.window;
    const originalDocument = global.document;
    const originalAlert = global.alert;
    const alerts = [];
    const fallbackCalls = [];
    const draftCalls = [];

    global.window = {
      localStorage: {
        getItem() {
          return "";
        },
      },
      location: {
        href: "",
        assign(url) {
          this.href = url;
        },
      },
      bbmDb: {
        licenseGetStatus: async () => ({ ok: true, valid: true, modules: [] }),
      },
      bbmMail: {
        createOutlookDraft: async () => {
          draftCalls.push("draft");
          return { ok: true };
        },
      },
    };
    global.document = { title: "BBM" };
    global.alert = (msg) => alerts.push(String(msg || ""));

    try {
      const header = new MainHeader({ router: { currentProjectId: "17" } });
      header._sendMailtoFallback = () => {
        fallbackCalls.push("mailto");
      };

      const res = await header._openMailClient("", {
        recipients: ["test@example.de"],
        subject: "Betreff",
        body: "Hallo",
        attachments: ["A.pdf"],
      });

      assert.equal(res?.blocked, true);
      assert.equal(draftCalls.length, 0);
      assert.equal(fallbackCalls.length, 0);
      assert.equal(global.window.location.href, "");
      assert.equal(alerts.some((text) => text.includes("nicht freigeschaltet")), true);
    } finally {
      global.window = originalWindow;
      global.document = originalDocument;
      global.alert = originalAlert;
    }
  });

  await run("Ausgabe: Header laesst den normalen Outlook-Weg unveraendert", async () => {
    const originalWindow = global.window;
    const originalDocument = global.document;
    const originalAlert = global.alert;
    const alerts = [];
    const fallbackCalls = [];
    const draftCalls = [];

    global.window = {
      localStorage: {
        getItem() {
          return "";
        },
      },
      location: {
        href: "",
        assign(url) {
          this.href = url;
        },
      },
      bbmDb: {
        licenseGetStatus: async () => ({ ok: true, valid: true, modules: ["protokoll"] }),
      },
      bbmMail: {
        createOutlookDraft: async () => {
          draftCalls.push("draft");
          return { ok: true };
        },
      },
    };
    global.document = { title: "BBM" };
    global.alert = (msg) => alerts.push(String(msg || ""));

    try {
      const header = new MainHeader({ router: { currentProjectId: "17" } });
      header._sendMailtoFallback = () => {
        fallbackCalls.push("mailto");
      };

      const res = await header._dispatchMailTransport({
        recipients: ["test@example.de"],
        subject: "Betreff",
        body: "Hallo",
        attachments: ["A.pdf"],
      });

      assert.equal(res?.ok, true);
      assert.equal(res?.result?.ok, true);
      assert.equal(draftCalls.length, 1);
      assert.equal(fallbackCalls.length, 0);
      assert.equal(global.window.location.href, "");
      assert.equal(alerts.length, 0);
    } finally {
      global.window = originalWindow;
      global.document = originalDocument;
      global.alert = originalAlert;
    }
  });

  await run("Ausgabe: Attachment-Fehler faellt nicht auf einen Pfadtext-mailto-Entwurf zurueck", async () => {
    const originalWindow = global.window;
    const originalDocument = global.document;
    const originalAlert = global.alert;
    const alerts = [];
    const fallbackCalls = [];

    global.window = {
      localStorage: { getItem() { return ""; } },
      location: { href: "", assign(url) { this.href = url; } },
      bbmDb: {
        licenseGetStatus: async () => ({ ok: true, valid: true, modules: ["protokoll"] }),
      },
      bbmMail: {
        createOutlookDraft: async () => ({ ok: false, error: "Outlook COM blockiert" }),
      },
    };
    global.document = { title: "BBM" };
    global.alert = (msg) => alerts.push(String(msg || ""));

    try {
      const header = new MainHeader({ router: { currentProjectId: "17" } });
      header._sendMailtoFallback = () => fallbackCalls.push("mailto");

      const res = await header._dispatchMailTransport({
        recipients: ["test@example.de"],
        subject: "Betreff",
        body: "Hallo",
        attachments: ["A.pdf", "B.pdf"],
      });

      assert.equal(res?.ok, false);
      assert.equal(res?.attachmentError, true);
      assert.equal(fallbackCalls.length, 0);
      assert.equal(alerts.some((text) => text.includes("PDF-Anhängen")), true);
      assert.equal(alerts.some((text) => text.includes("Outlook COM blockiert")), true);
    } finally {
      global.window = originalWindow;
      global.document = originalDocument;
      global.alert = originalAlert;
    }
  });

  await run("Ausgabe: bestehender Outlook-COM-Weg fuegt alle ausgewaehlten Dateien als echte Anhaenge an", () => {
    assert.equal(mainSource.includes("$mail.Attachments.Add($att)"), true);
    assert.equal(mainSource.includes('"-AttachmentsBase64"'), true);
    assert.equal(mainHeaderSource.includes("if (mailPayload.attachments.length)"), true);
    assert.equal(mailFlowSource.includes("if (!result?.ok) return;"), true);
    assert.equal(mailFlowSource.includes("closeOverlay();\n        await this.view._enterIdleAfterClose();"), true);
  });

  await run("Ausgabe: PrintModal gibt blockierten Lizenzfehler strukturiert zurueck", async () => {
    const originalWindow = global.window;
    const originalDocument = global.document;
    const originalAlert = global.alert;
    const alerts = [];

    global.window = {
      bbmDb: {
        licenseGetStatus: async () => ({ ok: true, valid: true, modules: ["protokoll"] }),
        appSettingsGetMany: async () => ({ ok: true, data: { "pdf.protocolsDir": "C:\\Temp\\Protokolle" } }),
        topsListByMeeting: async () => ({
          ok: true,
          meeting: {
            id: "m1",
            is_closed: 1,
            project_id: "17",
            meeting_index: "3",
          },
          list: [],
        }),
        meetingParticipantsList: async () => ({ ok: true, list: [] }),
      },
      bbmPrint: {
        printPdf: async () => ({
          ok: false,
          blocked: true,
          licenseError: true,
          code: "FEATURE_NOT_ALLOWED",
          reason: "protokoll",
          error: "Modul Protokoll ist fuer diese Lizenz nicht freigeschaltet.",
        }),
      },
    };
    global.document = { title: "BBM" };
    global.alert = (msg) => alerts.push(String(msg || ""));

    try {
      const modal = new PrintModal({
        router: {
          currentProjectId: "17",
          context: { settings: {} },
          ensureAppSettingsLoaded: async () => {},
        },
      });

      const res = await modal.printClosedMeetingDirect({ projectId: "17", meetingId: "m1" });

      assert.equal(res?.blocked, true);
      assert.equal(res?.licenseError, true);
      assert.equal(res?.code, "FEATURE_NOT_ALLOWED");
      assert.equal(alerts.some((text) => text.includes("nicht freigeschaltet")), true);
    } finally {
      global.window = originalWindow;
      global.document = originalDocument;
      global.alert = originalAlert;
    }
  });

  await run("Ausgabe: direkter ToDo-Abschlussdruck laeuft ohne sichtbare Verantwortlichenauswahl", async () => {
    const modal = new PrintModal({ router: {} });
    let selectionCalls = 0;
    let printPayload = null;
    modal._selectTodoResponsibleFilter = async () => {
      selectionCalls += 1;
      return "responsible:17";
    };
    modal._printProjectListPdf = async (payload) => {
      printPayload = payload;
      return { ok: true, filePath: "C:/tmp/todo.pdf" };
    };

    const result = await modal.printTodoDirect({ projectId: "17", meetingId: "m18" });

    assert.equal(result.ok, true);
    assert.equal(selectionCalls, 0);
    assert.equal(printPayload.mode, "todo");
    assert.equal(printPayload.meetingId, "m18");
    assert.equal(printPayload.preview, false);
    assert.equal(printPayload.todoResponsibleFilter, "all");

    await modal.openTodoPrintPreview({ projectId: "17" });
    assert.equal(selectionCalls, 1);
    assert.equal(printPayload.preview, true);
    assert.equal(printPayload.todoResponsibleFilter, "responsible:17");
  });

  await run("Ausgabe: Abschlusslisten werden pro Protokollstand eindeutig benannt und gespeichert", async () => {
    const originalWindow = global.window;
    const originalAlert = global.alert;
    const printCalls = [];
    global.alert = () => {};
    global.window = {
      bbmDb: {
        async topsListByMeeting(meetingId) {
          assert.equal(meetingId, "m18");
          return { ok: true, meeting: { id: meetingId, meeting_index: 18, meeting_date: "2026-08-16" } };
        },
      },
      bbmPrint: {
        async printPdf(payload) {
          printCalls.push(payload);
          return { ok: true, filePath: "C:/pdf/firm.pdf" };
        },
      },
    };
    try {
      const modal = new PrintModal({ router: { currentMeetingId: "m18", context: { settings: {} }, ensureAppSettingsLoaded: async () => {} } });
      modal._resolveProtocolsDir = async ({ settings }) => ({ settings, dir: "C:/pdf" });
      modal._getProjectInfo = async () => ({ number: "4711", short: "Baustelle" });
      modal._setMsg = () => {};
      modal._applyState = () => {};

      const result = await modal.printFirmsDirect({ projectId: "p1", meetingId: "m18" });

      assert.equal(result?.ok, true);
      assert.equal(printCalls.length, 1);
      assert.equal(printCalls[0].meetingId, "m18");
      assert.equal(printCalls[0].fileName, "4711 - Baustelle - Firmenliste - Stand #18 - 16.08.2026.pdf");
      assert.equal(printCalls[0].overwrite, true);
      assert.equal(printCalls[0].silent, true);
    } finally {
      global.window = originalWindow;
      global.alert = originalAlert;
    }
  });

  await run("Ausgabe: MainHeader-Blocklogik ist im Renderer sichtbar", () => {
    assert.equal(mainHeaderSource.includes("_ensureProtocolOutputEnabled"), true);
    assert.equal(mainHeaderSource.includes("blocked: true"), true);
    assert.equal(mainHeaderSource.includes("getBlockedTransportMessage"), true);
    assert.equal(mainHeaderSource.includes("_openPrintTypeSelectorFlow"), true);
    assert.equal(mainHeaderSource.includes('mode: "output"'), true);
    assert.equal(mainHeaderSource.includes("getVisiblePrintDialogActions"), true);
    assert.equal(closedProtocolSelectorSource.includes("Druckart wählen"), true);
    assert.equal(closedProtocolSelectorSource.includes("Wähle zuerst die gewünschte Ausgabeart."), true);
    assert.equal(closedProtocolSelectorSource.includes("Schliessen"), false);
    assert.match(closedProtocolSelectorSource, /onClick:\s*\(\) => setCurrentId\(item\.id\)/);
    assert.match(closedProtocolSelectorSource, /onDoubleClick:\s*\(\) => submitActiveItem\(item\)/);
    assert.equal(closedProtocolSelectorSource.includes("Weiter"), true);
    assert.equal(closedProtocolSelectorSource.includes("Abbrechen"), true);
  });
}

module.exports = { runAusgabeModuleTests };
