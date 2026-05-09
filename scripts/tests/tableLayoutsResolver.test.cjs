const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

async function withTempTableLayoutsRepo(fn) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-table-layouts-resolver-"));
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

async function runTableLayoutsResolverTests(run) {
  await run("TableLayoutsResolver: Standardlayout wird geliefert", () => {
    return withTempTableLayoutsRepo(async ({ db, repo }) => {
      db.initDatabase();
      const resolved = await repo.getResolvedTableLayout({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "portrait",
      });

      assert.equal(resolved.ok, true);
      assert.equal(resolved.source, "default");
      assert.equal(resolved.effectiveLayout.ui.rootVars["--bbm-tops-list-number-col"], "64px");
      assert.equal(resolved.effectiveLayout.labels.text, "Gegenstand");
    });
  });

  await run("TableLayoutsResolver: gespeicherte Layouts ueberschreiben Standard und bleiben je Orientierung getrennt", () => {
    return withTempTableLayoutsRepo(async ({ db, repo }) => {
      db.initDatabase();

      await repo.saveTableLayout({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "portrait",
        layout: {
          ui: {
            rootVars: {
              "--bbm-tops-list-number-col": "72px",
            },
          },
          labels: {
            text: "Gegenstand P",
          },
        },
      });

      await repo.saveTableLayout({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "landscape",
        layout: {
          ui: {
            rootVars: {
              "--bbm-tops-list-number-col": "88px",
            },
          },
          labels: {
            text: "Gegenstand L",
          },
        },
      });

      const portraitResolved = await repo.getResolvedTableLayout({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "portrait",
      });
      const landscapeResolved = await repo.getResolvedTableLayout({
        tableKey: "protokoll_tops",
        moduleId: "protokoll",
        orientation: "landscape",
      });

      assert.equal(portraitResolved.source, "stored");
      assert.equal(portraitResolved.effectiveLayout.ui.rootVars["--bbm-tops-list-number-col"], "72px");
      assert.equal(portraitResolved.effectiveLayout.labels.text, "Gegenstand P");
      assert.equal(landscapeResolved.source, "stored");
      assert.equal(landscapeResolved.effectiveLayout.ui.rootVars["--bbm-tops-list-number-col"], "88px");
      assert.equal(landscapeResolved.effectiveLayout.labels.text, "Gegenstand L");
    });
  });

  await run("TableLayoutsResolver: kaputte gespeicherte Layoutwerte fallen auf Standard des konkreten Tables zurueck", () => {
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

  await run("TableLayoutsResolver: kaputtes JSON faellt auf Standard zurueck", () => {
    return withTempTableLayoutsRepo(async ({ db, repo }) => {
      const conn = db.initDatabase();
      conn.prepare(
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
      ).run(
        "protokoll_tops",
        "protokoll",
        "portrait",
        "global",
        "",
        1,
        "{not valid json",
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
      assert.notEqual(resolved.parseError, "");
      assert.equal(resolved.effectiveLayout.ui.rootVars["--bbm-tops-list-number-col"], "64px");
    });
  });

  await run("TableLayoutsResolver: unbekannte Tabelle liefert sicheren Fehler", () => {
    return withTempTableLayoutsRepo(async ({ db, repo }) => {
      db.initDatabase();
      const resolved = await repo.getResolvedTableLayout({
        tableKey: "unknown_table",
        moduleId: "fremdmodul",
        orientation: "portrait",
      });

      assert.equal(resolved.ok, false);
      assert.equal(resolved.source, "unknown");
      assert.equal(resolved.effectiveLayout, null);
      assert.match(resolved.error, /Unknown table layout/);
    });
  });
}

module.exports = { runTableLayoutsResolverTests };
