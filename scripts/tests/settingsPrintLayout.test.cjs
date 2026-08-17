const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

function createFakeNode(tagName) {
  return {
    tagName: String(tagName || "").toUpperCase(),
    children: [],
    style: {},
    classList: { add() {} },
    append(...items) {
      for (const item of items) if (item !== null && item !== undefined) this.children.push(item);
    },
    focus() { this.focused = true; },
  };
}

function createFakeDocument() {
  return { createElement(tagName) { return createFakeNode(tagName); } };
}

async function runSettingsPrintLayoutTests(run) {
  const { default: SettingsView } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/views/SettingsView.js")
  );
  const settingsSource = read("src/renderer/views/SettingsView.js");

  await run("SettingsView: Print-Layout-Felder sind numerisch konfiguriert", () => {
    assert.equal(settingsSource.includes('field.type === "number"'), true);
    assert.equal(settingsSource.includes('inputMode = "numeric"'), true);
    assert.equal(settingsSource.includes('inp.type = "number"'), true);
    assert.equal(settingsSource.includes('inp.min = String(limits.min);'), true);
    assert.equal(settingsSource.includes('inp.max = String(limits.max);'), true);
    assert.equal(settingsSource.includes('inp.step = String(limits.step);'), true);
    assert.equal(settingsSource.includes("print.v2.pagePadTopMm"), true);
    assert.equal(settingsSource.includes("print.v2.pagePadLeftMm"), true);
    assert.equal(settingsSource.includes("print.v2.pagePadRightMm"), true);
    assert.equal(settingsSource.includes("print.v2.pagePadBottomMm"), true);
    assert.equal(settingsSource.includes("print.v2.footerReserveMm"), true);
  });

  await run("SettingsView: Drucklayout zeigt einen sichtbaren Standardwerte-Reset", () => {
    assert.equal(settingsSource.includes("Standardwerte wiederherstellen"), true);
    assert.equal(settingsSource.includes("_resetPrintLayoutFields"), true);
  });

  await run("SettingsView: Print-Layout-Werte werden auf gueltige mm-Werte normalisiert", () => {
    const view = new SettingsView({});
    assert.equal(view._normalizePrintLayoutMmValue("3.7", "print.v2.pagePadTopMm"), "4");
    assert.equal(view._normalizePrintLayoutMmValue("999", "print.v2.pagePadLeftMm"), "30");
    assert.equal(view._normalizePrintLayoutMmValue("-5", "print.v2.pagePadBottomMm"), "0");
    assert.equal(view._normalizePrintLayoutMmValue("abc", "print.v2.footerReserveMm"), "12");
    assert.equal(view._normalizePrintLayoutMmValue("17", "print.v2.footerReserveMm"), "17");
    assert.equal(view._isPrintLayoutMmKey("print.v2.pagePadRightMm"), true);
    assert.equal(view._isPrintLayoutMmKey("pdf.protocolTitle"), false);
  });

  await run("SettingsView: Standardwerte setzen nur die Drucklayout-Felder", () => {
    const view = new SettingsView({});
    const inputs = new Map([
      ["print.v2.pagePadTopMm", { value: "9" }],
      ["print.v2.pagePadLeftMm", { value: "8" }],
      ["print.v2.pagePadRightMm", { value: "7" }],
      ["print.v2.pagePadBottomMm", { value: "6" }],
      ["print.v2.footerReserveMm", { value: "5" }],
      ["pdf.protocolTitle", { value: "Bleibt unveraendert" }],
    ]);
    view._settingsInputs = inputs;

    view._resetPrintLayoutFields();

    assert.deepEqual(
      {
        top: inputs.get("print.v2.pagePadTopMm").value,
        left: inputs.get("print.v2.pagePadLeftMm").value,
        right: inputs.get("print.v2.pagePadRightMm").value,
        bottom: inputs.get("print.v2.pagePadBottomMm").value,
        reserve: inputs.get("print.v2.footerReserveMm").value,
        title: inputs.get("pdf.protocolTitle").value,
      },
      {
        top: "5",
        left: "12",
        right: "12",
        bottom: "0",
        reserve: "12",
        title: "Bleibt unveraendert",
      }
    );
  });

  await run("SettingsView: Vorbemerkung behaelt fuenf Eingabezeilen und 500 Zeichen", () => {
    const view = new SettingsView({});
    assert.equal(view._normalizePdfPreRemarks("x".repeat(500)).length, 500);
    assert.equal(view._normalizePdfPreRemarks("x".repeat(501)).length, 500);
    assert.equal(view._normalizePdfPreRemarks("1\n2\n3\n4\n5\n6"), "1\n2\n3\n4\n5");
    assert.equal(settingsSource.includes("max 500 Zeichen in 5 Zeilen"), true);
    assert.equal(settingsSource.includes("ta.maxLength = 500"), true);
  });

  await run("SettingsView: Rechnungs-Zahlungsziel lädt, speichert und validiert ganze Kalendertage", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    const opens = [];
    const saves = [];
    global.document = createFakeDocument();
    global.window = {
      bbmDb: {
        appSettingsGetMany: async () => ({ ok: true, data: { "invoice.paymentTermDays": "" } }),
        appSettingsSetMany: async (payload) => {
          saves.push(payload);
          return { ok: true };
        },
      },
    };
    try {
      const view = new SettingsView({ router: { context: { settings: {} } } });
      view._openSettingsModal = (payload) => opens.push(payload);
      await view._createInvoiceSettingsContent();

      assert.equal(opens.length, 1);
      assert.equal(opens[0].title, "Rechnungen");
      const input = opens[0].content[0].children[1].children[2].children[1];
      assert.deepEqual([input.type, input.min, input.max, input.step, input.value], ["number", "0", "3650", "1", "8"]);

      for (const [value, expected] of [["8", "8"], ["14", "14"], ["0", "0"]]) {
        input.value = value;
        assert.equal(await opens[0].saveFn(), true);
        assert.equal(saves.at(-1)["invoice.paymentTermDays"], expected);
      }
      for (const invalid of ["-1", "3651", "abc"]) {
        input.value = invalid;
        assert.equal(await opens[0].saveFn(), false);
        assert.equal(saves.length, 3);
      }
      assert.equal(view._parseInvoicePaymentTermDays("14"), "14");
      assert.equal(view._parseInvoicePaymentTermDays("0"), "0");
      assert.equal(view._parseInvoicePaymentTermDays(""), null);
      assert.equal(read("src/main/ipc/settingsIpc.js").includes('"invoice.paymentTermDays"'), true);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });
}

module.exports = { runSettingsPrintLayoutTests };
