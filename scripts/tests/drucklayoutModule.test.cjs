const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8").replace(/\r\n/g, "\n");
}

async function runDrucklayoutModuleTests(run) {
  const [{ topsLayout }, { renderDrucklayoutTable }, serviceModule, { getInitialLayoutState }] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/drucklayout/layouts/topsLayout.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/drucklayout/DrucklayoutTable.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/drucklayout/DrucklayoutService.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/drucklayout/DrucklayoutLayouts.js")),
  ]);

  await run("Drucklayout: topsLayout enthaelt nr/text/meta", () => {
    assert.equal(!!topsLayout.columns.nr, true);
    assert.equal(!!topsLayout.columns.text, true);
    assert.equal(!!topsLayout.columns.meta, true);
  });

  await run("Drucklayout: Tabelle rendert colgroup und thead", () => {
    global.document = {
      createElement(tag) {
        return {
          tagName: tag,
          style: {},
          className: "",
          children: [],
          append(...nodes) { this.children.push(...nodes); },
          set textContent(v) { this._txt = v; },
        };
      },
    };
    const { colgroup, thead } = renderDrucklayoutTable({ layout: topsLayout, rows: [] });
    assert.equal(colgroup.children[0].className, "dl-col-nr");
    assert.equal(colgroup.children[2].className, "dl-col-meta");
    assert.equal(colgroup.children[0].style.width, "19mm");
    assert.equal(colgroup.children[2].style.width, "40mm");
    assert.equal(thead.tagName, "thead");
  });

  await run("Drucklayout: nur in Entwicklung eingebunden, nicht im Modulkatalog", () => {
    const settingsSource = read("src/renderer/views/SettingsView.js");
    const moduleCatalogSource = read("src/renderer/app/modules/moduleCatalog.js");
    assert.equal(settingsSource.includes("Drucklayout"), true);
    assert.equal(settingsSource.includes("createDrucklayoutDevScreen"), true);
    assert.equal(moduleCatalogSource.includes("drucklayout"), false);
  });


  await run("Drucklayout: Service uebernimmt Matrixwerte und baut Code aus aktuellem Zustand", () => {
    const state = getInitialLayoutState();
    const matrixInputs = {
      nrWidthMm: { value: "22" },
      metaWidthMm: { value: "44" },
      nrPadLeftMm: { value: "1" },
      nrPadRightMm: { value: "2" },
      textPadLeftMm: { value: "0.5" },
      textPadRightMm: { value: "1.5" },
      metaPadLeftMm: { value: "3" },
      metaPadRightMm: { value: "1" },
      level1NrPt: { value: "10" },
      level2To4NrPt: { value: "8.5" },
      shortPt: { value: "8.5" },
      longPt: { value: "7.5" },
      metaPt: { value: "6.5" },
    };
    const next = serviceModule.applyMatrixValuesToState(state, matrixInputs);
    assert.equal(next.columns.nr.widthMm, 22);
    assert.equal(next.columns.meta.widthMm, 44);
    const code = serviceModule.buildCodeValues(next);
    assert.equal(code.includes("widthMm: 22"), true);
    assert.equal(code.includes("widthMm: 44"), true);
  });
  await run("Drucklayout: Screen enthaelt Matrixfelder, Vorschau und Reset", () => {
    const screenSource = read("src/renderer/modules/drucklayout/DrucklayoutScreen.js");
    assert.equal(screenSource.includes("TOP-Nr Breite (mm)"), true);
    assert.equal(screenSource.includes("Meta Breite (mm)"), true);
    assert.equal(screenSource.includes("formatRestWidthLabel"), true);
    assert.equal(screenSource.includes("Vorschau"), true);
    assert.equal(screenSource.includes("Standardwerte"), true);
    assert.equal(screenSource.includes("Codewerte anzeigen"), true);
    assert.equal(screenSource.includes("applyMatrixValuesToState"), true);
    assert.equal(screenSource.includes("Codewerte anzeigen"), true);
    assert.equal(screenSource.includes("code.textContent = buildCodeValues(state)"), true);
  });

  await run("Drucklayout: Renderer nutzt A4 box-sizing border-box", () => {
    const rendererSource = read("src/renderer/modules/drucklayout/DrucklayoutRenderer.js");
    assert.equal(rendererSource.includes('page.style.boxSizing = "border-box";'), true);
  });

  await run("Drucklayout: keine verstreuten fachlichen Spaltenbreiten in CSS", () => {
    const cssSource = read("src/renderer/modules/drucklayout/DrucklayoutCss.js");
    assert.equal(cssSource.includes("19mm"), false);
    assert.equal(cssSource.includes("40mm"), false);
  });
}

module.exports = { runDrucklayoutModuleTests };
