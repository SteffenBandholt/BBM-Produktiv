const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runThemeAndPrintDefaultsTests(run) {
  const previousDocument = global.document;
  global.document = {
    createElement() {
      return {
        getContext() {
          return {
            _fillStyle: "#000000",
            get fillStyle() { return this._fillStyle; },
            set fillStyle(value) { this._fillStyle = String(value).toUpperCase(); },
          };
        },
      };
    },
  };
  try {
    const { DEFAULT_THEME_SETTINGS, resolveTheme } = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/theme/themes.js")
    );

    await run("Theme: DEV-Istwert ist gemeinsamer Sidebar-Standard", () => {
      assert.equal(DEFAULT_THEME_SETTINGS.sidebarBaseColor, "#696969");
      assert.equal(DEFAULT_THEME_SETTINGS.sidebarTone, 50);
      assert.equal(resolveTheme({}).sidebarBg, "#696969");
      assert.equal(resolveTheme({
        "ui.themeSidebarBaseColor": "",
        "ui.themeSidebarTone": "",
        "defaults.ui.themeSidebarBaseColor": "",
        "defaults.ui.themeSidebarTone": "",
      }).sidebarBg, "#696969");
    });

    await run("Theme: gespeicherte Sidebar-Werte und gueltiger Null-Ton bleiben wirksam", () => {
      assert.equal(resolveTheme({
        "ui.themeSidebarBaseColor": "#123456",
        "ui.themeSidebarTone": "50",
      }).sidebarBg, "#123456");
      assert.equal(resolveTheme({
        "ui.themeSidebarBaseColor": "#696969",
        "ui.themeSidebarTone": "0",
      }).sidebarBg, "#FFFFFF");
    });
  } finally {
    global.document = previousDocument;
  }

  const { PRINT_LAYOUT_DEFAULTS, resolvePrintLayoutSettings } = require("../../src/main/print/printLayoutResolver.js");
  await run("PDF: fehlende Layoutwerte verwenden die Vertragsdefaults", () => {
    assert.deepEqual(PRINT_LAYOUT_DEFAULTS, {
      pagePadLeftMm: 12,
      pagePadRightMm: 12,
      pagePadTopMm: 5,
      pagePadBottomMm: 0,
      footerReserveMm: 12,
    });
    assert.deepEqual(resolvePrintLayoutSettings({}), PRINT_LAYOUT_DEFAULTS);
    assert.deepEqual(resolvePrintLayoutSettings({
      "print.v2.pagePadLeftMm": "",
      "print.v2.pagePadRightMm": "  ",
      "print.v2.pagePadTopMm": null,
      "print.v2.pagePadBottomMm": undefined,
      "print.v2.footerReserveMm": "nicht-numerisch",
    }), PRINT_LAYOUT_DEFAULTS);
  });

  await run("PDF: gespeicherte Seitenwerte einschliesslich Null bleiben wirksam", () => {
    const layout = resolvePrintLayoutSettings({
      "print.v2.pagePadLeftMm": "19",
      "print.v2.pagePadRightMm": "15",
      "print.v2.pagePadTopMm": "3",
      "print.v2.pagePadBottomMm": "18",
      "print.v2.footerReserveMm": "0",
    });
    assert.deepEqual({
      left: layout.pagePadLeftMm,
      right: layout.pagePadRightMm,
      top: layout.pagePadTopMm,
      bottom: layout.pagePadBottomMm,
      footer: layout.footerReserveMm,
    }, { left: 19, right: 15, top: 3, bottom: 18, footer: 0 });
  });
}

module.exports = { runThemeAndPrintDefaultsTests };
