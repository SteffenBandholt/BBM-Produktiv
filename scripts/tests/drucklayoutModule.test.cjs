const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8").replace(/\r\n/g, "\n");
}

async function runDrucklayoutModuleTests(run) {
  const [{ topsLayout }, { renderDrucklayoutTable }] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/drucklayout/layouts/topsLayout.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/drucklayout/DrucklayoutTable.js")),
  ]);

  await run("Drucklayout: topsLayout enthaelt nr/text/meta", () => {
    assert.equal(!!topsLayout.columns.nr, true);
    assert.equal(!!topsLayout.columns.text, true);
    assert.equal(!!topsLayout.columns.meta, true);
  });

  await run("Drucklayout: Tabelle rendert colgroup mit festen nr/meta-Spalten", () => {
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
    const { colgroup } = renderDrucklayoutTable({ layout: topsLayout, rows: [] });
    assert.equal(colgroup.children[0].className, "dl-col-nr");
    assert.equal(colgroup.children[2].className, "dl-col-meta");
    assert.equal(colgroup.children[0].style.width, "19mm");
    assert.equal(colgroup.children[2].style.width, "40mm");
  });

  await run("Drucklayout: nur in Entwicklung eingebunden, nicht im Modulkatalog", () => {
    const settingsSource = read("src/renderer/views/SettingsView.js");
    const moduleCatalogSource = read("src/renderer/app/modules/moduleCatalog.js");
    assert.equal(settingsSource.includes("Drucklayout"), true);
    assert.equal(settingsSource.includes("createDrucklayoutDevScreen"), true);
    assert.equal(moduleCatalogSource.includes("drucklayout"), false);
  });

  await run("Drucklayout: Screen rendert TOP-Beispieltabelle und Codewerte", () => {
    const screenSource = read("src/renderer/modules/drucklayout/DrucklayoutScreen.js");
    assert.equal(screenSource.includes("TOP-Liste / Protokoll") || screenSource.includes("createTopsSampleRows"), true);
    assert.equal(screenSource.includes("Codewerte anzeigen"), true);
  });

  await run("Drucklayout: keine verstreuten fachlichen Spaltenbreiten in CSS", () => {
    const cssSource = read("src/renderer/modules/drucklayout/DrucklayoutCss.js");
    assert.equal(cssSource.includes("19mm"), false);
    assert.equal(cssSource.includes("40mm"), false);
  });
}

module.exports = { runDrucklayoutModuleTests };
