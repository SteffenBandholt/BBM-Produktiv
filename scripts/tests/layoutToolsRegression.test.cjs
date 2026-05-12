const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

function _readText(repoRelPath) {
  const abs = path.join(process.cwd(), repoRelPath);
  return fs.readFileSync(abs, "utf8");
}

function _assertDevPdfMarkersAreGated(run) {
  const css = _readText("src/renderer/print/print.css");

  for (const needle of ["[data-dev-pdf-zone]", "[data-dev-pdf-participants-zone]"]) {
    let idx = 0;
    while (true) {
      const hit = css.indexOf(needle, idx);
      if (hit === -1) break;
      const windowStart = Math.max(0, hit - 140);
      const context = css.slice(windowStart, hit + needle.length);
      assert.match(
        context,
        /data-dev-pdf-layout="true"/,
        `DEV pdf marker selector must be gated behind data-dev-pdf-layout="true" (needle=${needle})`
      );
      idx = hit + needle.length;
    }
  }

  // Ensure we still explicitly use non-layout-shifting marker styles (box-shadow/overlay),
  // so accidental "border" markers are unlikely to leak into real PDFs.
  assert.match(css, /box-shadow:\s*inset/i, "DEV marker styles should use inset box-shadow (no layout shift).");
}

function _assertDevPrintPreviewIpcIsDevOnly() {
  const js = _readText("src/main/ipc/printIpc.js");

  // DEV-only: html preview must be blocked in packaged builds.
  assert.match(js, /ipcMain\.handle\(["']print:openHtmlPreview["']/, "print:openHtmlPreview handler must exist.");
  assert.match(js, /print:openHtmlPreview[\s\S]*if\s*\(\s*app\.isPackaged\s*\)/, "Preview must guard app.isPackaged.");

  // DevTools must not open automatically in the normal preview path.
  assert.match(js, /createPrintWindow\(\s*\{\s*show:\s*true,\s*devTools:\s*false\s*\}\s*\)/, "Preview must not open DevTools.");

  // Layout mode must be explicitly flagged to the print renderer.
  assert.match(js, /devLayoutPreview:\s*true/, "Preview must set devLayoutPreview: true.");
  assert.match(
    js,
    /layoutCalibrationEnabled:\s*/s,
    "Preview must forward the layout calibration flag to the print renderer."
  );
  assert.match(
    js,
    /if\s*\(\s*!layoutCalibrationEnabled\s*\)\s*\{\s*return\s*\{\s*ok:\s*false,\s*error:\s*"Layout-Kalibrierung ist deaktiviert\."\s*\}\s*;\s*\}/s,
    "Preview handler must refuse when layout calibration is disabled."
  );
}

function _assertToPdfDoesNotEnableDevLayoutPreview() {
  const js = _readText("src/main/ipc/printIpc.js");
  // Export path must not enable the DEV layout overlay flag.
  // (Markers are guarded behind devLayoutPreview in the print renderer.)
  const idxToPdf = js.indexOf('ipcMain.handle("print:toPdf"');
  assert.ok(idxToPdf !== -1, "print:toPdf handler must exist.");
  const slice = js.slice(idxToPdf, Math.min(js.length, idxToPdf + 2400));
  assert.doesNotMatch(slice, /devLayoutPreview\s*:\s*true/, "print:toPdf must not set devLayoutPreview: true.");
}

async function withTempTableLayoutsRepo(fn) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-layouttools-regress-"));
  const userDataPath = path.join(tmpRoot, "userData");
  fs.mkdirSync(userDataPath, { recursive: true });

  const originalLoad = Module._load;
  Module._load = function patched(request, parent) {
    if (request === "electron" && String(parent?.filename || "").endsWith(path.join("db", "database.js"))) {
      return {
        app: {
          getPath: (name) => (name === "userData" ? userDataPath : ""),
          isPackaged: true,
        },
      };
    }
    // eslint-disable-next-line prefer-rest-params
    return originalLoad.apply(this, arguments);
  };

  try {
    const dbPath = path.join(process.cwd(), "src/main/db/database.js");
    const repoPath = path.join(process.cwd(), "src/main/db/tableLayoutsRepo.js");
    delete require.cache[require.resolve(dbPath)];
    delete require.cache[require.resolve(repoPath)];
    const db = require(dbPath);
    const repo = require(repoPath);
    return await fn({ db, repo, userDataPath, tmpRoot });
  } finally {
    try {
      const dbPath = path.join(process.cwd(), "src/main/db/database.js");
      const db = require(dbPath);
      if (typeof db.closeDatabase === "function") db.closeDatabase();
    } catch (_e) {}
    Module._load = originalLoad;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

async function _assertParticipantsPdfRootVarsPreserved() {
  return withTempTableLayoutsRepo(async ({ db, repo }) => {
    db.initDatabase();

    // Save a TOP UI override (ui.rootVars) for protokoll_tops.
    await repo.saveTableLayout({
      tableKey: "protokoll_tops",
      moduleId: "protokoll",
      orientation: "portrait",
      layout: {
        ui: { rootVars: { "--bbm-tops-list-number-col": "72px" } },
      },
    });

    // Load the current default participants layout, then save a PDF-only override.
    const partDefault = await repo.getEffectiveTableLayout({
      tableKey: "protokoll_participants",
      moduleId: "protokoll",
      orientation: "portrait",
    });
    assert.equal(partDefault.source, "default");

    const nextParticipants = {
      ...partDefault.effectiveLayout,
      // columns are the "source of truth" for PDF widths on most tables.
      columns: partDefault.effectiveLayout.columns.map((c) =>
        String(c?.key || "").trim().toLowerCase() === "name" ? { ...c, pdfWidth: "40mm" } : { ...(c || {}) }
      ),
      pdf: {
        ...(partDefault.effectiveLayout.pdf || {}),
        rootVars: {
          ...((partDefault.effectiveLayout.pdf && partDefault.effectiveLayout.pdf.rootVars) || {}),
          "--bbm-part-col-name-padding-inline": "2mm",
          "--bbm-part-col-name-font-size": "10pt",
        },
      },
    };

    await repo.saveTableLayout({
      tableKey: "protokoll_participants",
      moduleId: "protokoll",
      orientation: "portrait",
      layout: nextParticipants,
    });

    // 1) Participants overrides must survive sanitization (rootVars must be present in the stored layout).
    const storedParticipants = repo.getStoredTableLayout({
      tableKey: "protokoll_participants",
      moduleId: "protokoll",
      orientation: "portrait",
    });
    assert.equal(Boolean(storedParticipants), true);
    assert.equal(
      storedParticipants.layout.pdf.rootVars["--bbm-part-col-name-padding-inline"],
      "2mm",
      "participants pdf.rootVars must be preserved by sanitization"
    );
    assert.equal(storedParticipants.layout.columns.find((c) => c.key === "name").pdfWidth, "40mm");

    // 2) TOP overrides must remain intact and must not contain participants vars (no cross-surface overwrites).
    const storedTops = repo.getStoredTableLayout({
      tableKey: "protokoll_tops",
      moduleId: "protokoll",
      orientation: "portrait",
    });
    assert.equal(storedTops.layout.ui.rootVars["--bbm-tops-list-number-col"], "72px");
    assert.equal(Boolean(storedTops.layout?.pdf?.rootVars?.["--bbm-part-col-name-padding-inline"]), false);

    // 3) Reset is scoped by identity (tableKey+moduleId+orientation); resetting participants must not remove tops.
    const resetParticipants = repo.resetTableLayout({
      tableKey: "protokoll_participants",
      moduleId: "protokoll",
      orientation: "portrait",
    });
    assert.equal(resetParticipants.removed, 1);
    const topsAfter = repo.getStoredTableLayout({
      tableKey: "protokoll_tops",
      moduleId: "protokoll",
      orientation: "portrait",
    });
    assert.equal(Boolean(topsAfter), true, "Reset for participants must not remove protokoll_tops storage.");
  });
}

async function _assertTopsAllUsesProtokollTopsLayout() {
  // "topsAll" is a print mode, but it must still load the same protokoll_tops tableLayout identity.
  const { getPrintData } = require(path.join(process.cwd(), "src/main/print/printData.js"));
  const out = await getPrintData({
    mode: "topsAll",
    projectId: null,
    meetingId: null,
    settingsOverride: null,
    orientation: "portrait",
  });
  assert.equal(out.mode, "topsAll");
  assert.equal(Boolean(out.tableLayouts && out.tableLayouts.protokoll_tops), true, "topsAll must include protokoll_tops tableLayouts payload.");
  assert.equal(out.tableLayouts.protokoll_tops.tableKey, "protokoll_tops");
  assert.equal(out.tableLayouts.protokoll_tops.moduleId, "protokoll");
}

async function runLayoutToolsRegressionTests(run) {
  await run("layoutTools: DEV PDF preview markers sind CSS-seitig gated (keine Leaks ins echte PDF)", () => {
    _assertDevPdfMarkersAreGated(run);
  });

  await run("layoutTools: Print-HTML Vorschau ist DEV-only und oeffnet DevTools nicht automatisch", () => {
    _assertDevPrintPreviewIpcIsDevOnly();
  });

  await run("layoutTools: PDF-Exportpfad setzt devLayoutPreview nicht (keine Marker im echten PDF)", () => {
    _assertToPdfDoesNotEnableDevLayoutPreview();
  });

  await run("layoutTools: protokoll_participants PDF rootVars bleiben getrennt und ueberschreiben protokoll_tops nicht", async () => {
    await _assertParticipantsPdfRootVarsPreserved();
  });

  await run("layoutTools: topsAll nutzt protokoll_tops Layout (gemeinsame TOP-PDF Surface)", async () => {
    await _assertTopsAllUsesProtokollTopsLayout();
  });
}

module.exports = { runLayoutToolsRegressionTests };
