const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

async function withTempPrintData(fn) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-print-table-layouts-"));
  const userDataPath = path.join(tmpRoot, "userData");
  fs.mkdirSync(userDataPath, { recursive: true });

  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === "electron" && String(parent?.filename || "").endsWith(path.join("db", "database.js"))) {
      return {
        app: {
          getPath: (name) => (name === "userData" ? userDataPath : ""),
          isPackaged: true,
        },
      };
    }
    return originalLoad.apply(this, arguments);
  };

  try {
    const dbPath = path.join(process.cwd(), "src/main/db/database.js");
    const printDataPath = path.join(process.cwd(), "src/main/print/printData.js");
    delete require.cache[require.resolve(dbPath)];
    delete require.cache[require.resolve(printDataPath)];
    const db = require(dbPath);
    const { getPrintData } = require(printDataPath);
    return await fn({ db, getPrintData });
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

async function runPrintTableLayoutsTests(run) {
  await run("PrintData: protokoll_tops Layout wird als resolved Payload mitgegeben", () => {
    return withTempPrintData(async ({ db, getPrintData }) => {
      db.initDatabase();

      const data = await getPrintData({
        mode: "topsAll",
        orientation: "portrait",
      });

      assert.ok(data.tableLayouts);
      assert.ok(data.tableLayouts.protokoll_tops);
      assert.equal(data.tableLayouts.protokoll_tops.ok, true);
      assert.equal(
        data.tableLayouts.protokoll_tops.effectiveLayout.ui.rootVars["--bbm-tops-list-number-col"],
        "64px"
      );
      assert.equal(data.tableLayouts.protokoll_tops.source, "default");
    });
  });
}

module.exports = { runPrintTableLayoutsTests };
