const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

async function withTempTableLayoutsRepo(fn) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-table-layouts-"));
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

async function runTableLayoutsRepoTests(run) {
  await run("TableLayoutsRepo: table_layouts Schema wird angelegt", () => {
    return withTempTableLayoutsRepo(({ db }) => {
      const conn = db.initDatabase();
      const row = conn
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'table_layouts'")
        .get();
      assert.equal(Boolean(row), true);
    });
  });

  await run("TableLayoutsRepo: speichert, laedt und setzt pro Orientierung auf Standard zurueck", async () => {
    return withTempTableLayoutsRepo(async ({ db, repo }) => {
      db.initDatabase();

      const saveRes = await repo.saveTableLayout({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "portrait",
        layout: {
          ui: {
            rootVars: {
              "--bbm-tops-list-number-col": "72px",
            },
          },
        },
      });
      assert.equal(saveRes.orientation, "portrait");
      assert.equal(saveRes.effectiveLayout.ui.rootVars["--bbm-tops-list-number-col"], "72px");
      assert.equal(saveRes.effectiveLayout.labels.top, "TOP");

      const storedPortrait = repo.getStoredTableLayout({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "portrait",
      });
      assert.equal(storedPortrait.layout.ui.rootVars["--bbm-tops-list-number-col"], "72px");

      const landscapeEffective = await repo.getEffectiveTableLayout({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "landscape",
      });
      assert.equal(landscapeEffective.orientation, "landscape");
      assert.equal(landscapeEffective.effectiveLayout.ui.rootVars["--bbm-tops-list-number-col"], "72px");

      const resetRes = repo.resetTableLayout({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "portrait",
      });
      assert.equal(resetRes.removed, 1);

      const fallbackAfterReset = await repo.getEffectiveTableLayout({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "portrait",
      });
      assert.equal(fallbackAfterReset.source, "default");
      assert.equal(fallbackAfterReset.effectiveLayout.ui.rootVars["--bbm-tops-list-number-col"], "64px");
    });
  });

  await run("TableLayoutsRepo: verweigert ungultige Layoutwerte beim Speichern", async () => {
    return withTempTableLayoutsRepo(async ({ db, repo }) => {
      db.initDatabase();

      await assert.rejects(
        repo.saveTableLayout({
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          orientation: "portrait",
          layout: {
            ui: {
              rootVars: {
                "--bbm-tops-list-number-col": "url(javascript:alert(1))",
              },
            },
            labels: {
              top: "",
            },
          },
        }),
        /Ungültiger Spaltenwert|Überschrift darf nicht leer sein/
      );
    });
  });

  await run("TableLayoutsRepo: kaputte gespeicherte Layoutwerte fallen auf Standard des konkreten Tables zurueck", async () => {
    return withTempTableLayoutsRepo(async ({ db, repo }) => {
      const conn = db.initDatabase();
      conn
        .prepare(
          `
          INSERT INTO table_layouts (
            table_key,
            module_id,
            orientation,
            scope_type,
            scope_id,
            schema_version,
            layout_json,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        )
        .run(
          "protokoll_tops",
          "protokoll",
          "portrait",
          "global",
          "",
          1,
          JSON.stringify({
            variant: "portrait",
            labels: {
              top: "",
              text: "Gegenstand",
              meta: ["Status", "Fertig bis", "verantw"],
            },
            ui: {
              rootVars: {
                "--bbm-tops-list-number-col": "url(javascript:alert(1))",
                "--bbm-tops-list-text-col": "calc(1fr)",
                "--bbm-tops-list-meta-col": "",
              },
            },
            pdf: {
              columns: {
                number: { width: "23mm" },
                text: { width: "auto" },
                meta: { width: "15ch" },
              },
            },
          }),
          new Date().toISOString(),
          new Date().toISOString()
        );

      const resolved = await repo.getResolvedTableLayout({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "portrait",
      });

      assert.equal(resolved.ok, true);
      assert.equal(resolved.source, "default");
      assert.equal(resolved.effectiveLayout.ui.rootVars["--bbm-tops-list-number-col"], "64px");
      assert.equal(resolved.effectiveLayout.labels.top, "TOP");
    });
  });
}

module.exports = { runTableLayoutsRepoTests };
