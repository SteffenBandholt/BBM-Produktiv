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
  const printCssSource = read("src/renderer/print/print.css");
  const printV2CssSource = read("src/renderer/print/v2/v2.css");
  const sendMailSource = read("src/renderer/modules/ausgabe/sendMailPayload.js");
  const legacyPrintModalSource = read("src/renderer/ui/PrintModal.js");
  const legacySendMailSource = read("src/renderer/services/mail/sendMailPayload.js");
  const moduleCatalogSource = read("src/renderer/app/modules/moduleCatalog.js");
  const mainHeaderSource = read("src/renderer/ui/MainHeader.js");

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
    assert.equal(
      printModalSource.includes("Nur abgeschlossene Besprechungen"),
      true
    );
    assert.equal(printModalSource.includes("PDF-Ablageordner:"), true);
    assert.equal(
      printModalSource.includes("abgeschlossene Besprechung"),
      true
    );
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

  await run("Ausgabe: PDF-Schriftgrößen sind auf die neuen TOP-Werte gesetzt", () => {
    assert.equal(printCssSource.includes("--bbm-top-short-font-size: 8.5pt;"), true);
    assert.equal(printCssSource.includes("--bbm-top-long-font-size: 8.5pt;"), true);
    assert.equal(printCssSource.includes(".topsTable .shortText {\n  font-weight: 500;\n  font-size: 9pt;"), true);
    assert.equal(printCssSource.includes(".topsTable .longText {\n  margin-top: 2mm;\n  font-weight: 500;\n  font-size: 9pt;"), true);
    assert.equal(printCssSource.includes(".topsTable .colMeta {"), true);
    assert.equal(printCssSource.includes("font-size: 6.5pt;"), true);
    assert.equal(printCssSource.includes(".lvl1Row .topNumber {\n  font-size: 10pt;"), true);
    assert.equal(printCssSource.includes(".topNumber {\n  font-weight: 650;\n  font-size: 8.5pt;"), true);
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
    assert.equal(printV2CssSource.includes(".printV2Root .v2ProtocolFooterTitle {\n  font-weight: 500;"), true);
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

  await run("Ausgabe: MainHeader-Blocklogik ist im Renderer sichtbar", () => {
    assert.equal(mainHeaderSource.includes("_ensureProtocolOutputEnabled"), true);
    assert.equal(mainHeaderSource.includes("blocked: true"), true);
    assert.equal(mainHeaderSource.includes("getBlockedTransportMessage"), true);
  });
}

module.exports = { runAusgabeModuleTests };
