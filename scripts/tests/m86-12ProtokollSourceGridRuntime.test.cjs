"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const PROBE_MARKER = "M8612_GRID_RUNTIME=";

function createStyleTarget() {
  const values = new Map();
  return {
    dataset: {},
    style: {
      setProperty(name, value) { values.set(name, String(value)); },
      getPropertyValue(name) { return values.get(name) || ""; },
      removeProperty(name) { values.delete(name); },
    },
  };
}

function styleValues(target) {
  return Object.fromEntries([
    "--bbm-tops-list-number-col",
    "--bbm-tops-list-text-col",
    "--bbm-tops-list-meta-col",
    "--bbm-tops-list-grid-columns",
  ].map((name) => [name, target.style.getPropertyValue(name)]));
}

async function runChromiumProbe() {
  const { app, BrowserWindow } = require("electron");
  app.commandLine.appendSwitch("disable-gpu");
  app.setPath("userData", process.env.BBM_M8612_GRID_USER_DATA || path.join(os.tmpdir(), `bbm-m8612-grid-runtime-${process.pid}`));
  try {
    await app.whenReady();
    const css = fs.readFileSync(path.join(ROOT, "src/renderer/modules/protokoll/styles/tops.css"), "utf8")
      .replace(/<\/style/gi, "<\\/style");
    const profiles = JSON.parse(process.env.BBM_M8612_GRID_PROFILES || "[]");
    const win = new BrowserWindow({
      show: false,
      width: 1100,
      height: 700,
      webPreferences: { sandbox: true, contextIsolation: true },
    });
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
      <div id="table" class="bbm-tops-list-table" style="width:900px">
        <div id="header" class="bbm-tops-list-table-header">
          <div class="bbm-tops-list-table-header-number">Nr.<br>Datum</div>
          <div class="bbm-tops-list-table-header-text">Gegenstand</div>
          <div class="bbm-tops-list-table-header-meta">Fertig bis / Status / Verantw.</div>
        </div>
        <div id="row" class="bbm-tops-list-row-grid">
          <div class="bbm-tops-list-row-number">1.<br>03.08.2026</div>
          <div class="bbm-tops-list-row-text" style="width:1000px"><div id="rowTitle" class="bbm-tops-list-row-title" style="width:1000px">Kurztext</div><div id="rowPreview" class="bbm-tops-list-row-preview" style="width:1000px">Langtext</div></div>
          <div class="bbm-tops-list-row-meta">09.08.2026<br>offen<br>Steffen</div>
        </div>
      </div>
    </body></html>`;
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const result = await win.webContents.executeJavaScript(`(() => {
      const profiles = ${JSON.stringify(profiles)};
      const table = document.getElementById("table");
      const measure = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { left: rect.left, right: rect.right, width: rect.width, display: style.display, gridTemplateColumns: style.gridTemplateColumns };
      };
      const snapshot = (profile) => {
        for (const [name, value] of Object.entries(profile)) table.style.setProperty(name, value);
        const header = document.getElementById("header");
        const row = document.getElementById("row");
        return {
          header: { grid: measure(header), cells: [...header.children].map(measure) },
          row: { grid: measure(row), cells: [...row.children].map(measure), content: measure(document.getElementById("rowTitle")), preview: measure(document.getElementById("rowPreview")) },
        };
      };
      return profiles.map(snapshot);
    })()`);
    console.log(`${PROBE_MARKER}${JSON.stringify(result)}`);
    win.destroy();
    app.quit();
  } catch (error) {
    console.error(error?.stack || error);
    app.exit(1);
  }
}

function executeChromiumProbe(profiles) {
  const { resolveElectronBinary } = require("../runElectronNodeTest.cjs");
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-m8612-grid-runtime-"));
  const env = {
    ...process.env,
    BBM_M8612_GRID_RUNTIME_PROBE: "1",
    BBM_M8612_GRID_PROFILES: JSON.stringify(profiles),
    BBM_M8612_GRID_USER_DATA: userData,
  };
  delete env.ELECTRON_RUN_AS_NODE;
  let child;
  try {
    child = spawnSync(resolveElectronBinary(), [__filename], {
      cwd: ROOT,
      env,
      encoding: "utf8",
      windowsHide: true,
      timeout: 45_000,
    });
  } finally {
    fs.rmSync(userData, { recursive: true, force: true });
  }
  assert.equal(child.status, 0, `Chromium-Probe fehlgeschlagen:\n${child.stderr || child.stdout}`);
  const line = String(child.stdout || "").split(/\r?\n/).find((entry) => entry.startsWith(PROBE_MARKER));
  assert.ok(line, `Chromium-Probe ohne Ergebnis:\n${child.stdout}\n${child.stderr}`);
  return JSON.parse(line.slice(PROBE_MARKER.length));
}

function assertThreeColumns(snapshot, label) {
  for (const area of ["header", "row"]) {
    const { grid, cells } = snapshot[area];
    assert.equal(grid.display, "grid", `${label}/${area}: display`);
    assert.notEqual(grid.gridTemplateColumns, "none", `${label}/${area}: gridTemplateColumns`);
    assert.equal(cells.length, 3, `${label}/${area}: Zellen`);
    assert.ok(cells[0].left < cells[1].left && cells[1].left < cells[2].left, `${label}/${area}: drei X-Positionen`);
    assert.ok(cells[0].right <= cells[1].left + 2, `${label}/${area}: links ohne Ueberlagerung`);
    assert.ok(cells[1].right <= cells[2].left + 2, `${label}/${area}: mitte ohne Ueberlagerung`);
    assert.ok(cells[2].right <= grid.right + 0.6, `${label}/${area}: letzte Spalte bleibt im Tabellenrand`);
    if (area === "row") {
      assert.ok(snapshot.row.content.width <= cells[1].width + 0.6, `${label}/${area}: gespeicherte Inhaltsbreite bleibt im Track`);
      assert.ok(snapshot.row.content.width >= cells[1].width - 40, `${label}/${area}: Inhalt verwendet die wirksame Trackbreite abzueglich Innenabstand`);
      assert.ok(snapshot.row.content.right <= cells[1].right + 0.6, `${label}/${area}: Inhalt ragt nicht in Meta`);
      assert.ok(snapshot.row.preview.width <= cells[1].width + 0.6, `${label}/${area}: Langtextbreite bleibt im Track`);
      assert.ok(snapshot.row.preview.right <= cells[1].right + 0.6, `${label}/${area}: Langtext ragt nicht in Meta`);
    }
  }
}

async function runM8612ProtokollSourceGridRuntimeTests(run) {
  const { applyProtokollTopsUiLayout } = await importEsmFromFile(path.join(ROOT, "src/shared/tableLayouts/protokollTopsLayout.js"));

  const normalTarget = createStyleTarget();
  applyProtokollTopsUiLayout(normalTarget, {
    tableKey: "protokoll_tops",
    variant: "portrait",
    ui: { rootVars: {
      "--bbm-tops-list-number-col": "65px",
      "--bbm-tops-list-text-col": "minmax(0, 1fr)",
      "--bbm-tops-list-meta-col": "75px",
    } },
  });

  const validTarget = createStyleTarget();
  applyProtokollTopsUiLayout(validTarget, {
    tableKey: "protokoll_tops",
    variant: "portrait",
    ui: { rootVars: {
      "--bbm-tops-list-number-col": "81px",
      "--bbm-tops-list-text-col": "minmax(0, 1.4fr)",
      "--bbm-tops-list-meta-col": "140px",
    } },
  });

  await run("M86.12 01: normale gespeicherte Source-Werte bleiben vollstaendige gueltige Tracks", () => {
    assert.deepEqual(styleValues(normalTarget), {
      "--bbm-tops-list-number-col": "65px",
      "--bbm-tops-list-text-col": "minmax(0, 1fr)",
      "--bbm-tops-list-meta-col": "75px",
      "--bbm-tops-list-grid-columns": "minmax(48px, var(--bbm-tops-list-number-col, 13fr)) var(--bbm-tops-list-text-col, minmax(0, 65fr)) minmax(96px, var(--bbm-tops-list-meta-col, 22fr))",
    });
  });

  await run("M86.12 02: einheitenlose Zahlen werden normiert und ungueltige Alttracks abgewiesen", () => {
    const invalidTarget = createStyleTarget();
    applyProtokollTopsUiLayout(invalidTarget, {
      tableKey: "protokoll_tops",
      variant: "portrait",
      ui: {
        rootVars: {
          "--bbm-tops-list-number-col": 72,
          "--bbm-tops-list-text-col": "minmax(0, minmax(0, 1fr))",
          "--bbm-tops-list-meta-col": "calc(100% - 1px)",
        },
        gridTemplateColumns: "minmax(48px, 72px) minmax(0, minmax(0, 1fr)) 140px",
      },
    });
    assert.deepEqual(styleValues(invalidTarget), {
      "--bbm-tops-list-number-col": "72px",
      "--bbm-tops-list-text-col": "65fr",
      "--bbm-tops-list-meta-col": "22fr",
      "--bbm-tops-list-grid-columns": "minmax(48px, var(--bbm-tops-list-number-col, 13fr)) var(--bbm-tops-list-text-col, minmax(0, 65fr)) minmax(96px, var(--bbm-tops-list-meta-col, 22fr))",
    });
  });

  await run("M86.12 03: Chromium berechnet im normalen Profil drei getrennte Header- und Zeilenspalten", () => {
    const [normal, valid] = executeChromiumProbe([styleValues(normalTarget), styleValues(validTarget)]);
    assertThreeColumns(normal, "normal");
    assertThreeColumns(valid, "gespeichert");
    for (const area of ["header", "row"]) {
      assert.ok(Math.abs(valid[area].cells[0].width - 81) < 0.6, `${area}: gespeicherte linke Breite`);
      assert.ok(Math.abs(valid[area].cells[2].width - 140) < 0.6, `${area}: gespeicherte rechte Breite`);
    }
  });
}

if (process.env.BBM_M8612_GRID_RUNTIME_PROBE === "1") {
  void runChromiumProbe();
} else {
  module.exports = { runM8612ProtokollSourceGridRuntimeTests };
  if (require.main === module) {
    let failed = false;
    const run = async (name, test) => {
      try { await test(); console.log(`ok - ${name}`); }
      catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
    };
    runM8612ProtokollSourceGridRuntimeTests(run).then(() => { if (failed) process.exitCode = 1; });
  }
}
