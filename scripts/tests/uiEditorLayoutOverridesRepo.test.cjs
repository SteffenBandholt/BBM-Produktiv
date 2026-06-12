const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

async function withTempUiEditorLayoutOverridesRepo(fn) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-ui-editor-layout-overrides-"));
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
    const repoPath = path.join(process.cwd(), "src/main/db/uiEditorLayoutOverridesRepo.js");
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

async function runUiEditorLayoutOverridesRepoTests(run) {
  await run("UI-Editor LayoutOverridesRepo: Schema wird angelegt", () => {
    return withTempUiEditorLayoutOverridesRepo(({ db }) => {
      const conn = db.initDatabase();
      const row = conn
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ui_editor_layout_overrides'")
        .get();
      assert.equal(Boolean(row), true);
    });
  });

  await run("UI-Editor LayoutOverridesRepo: speichert und liest Visibility fuer Pilot-Scope", () => {
    return withTempUiEditorLayoutOverridesRepo(({ db, repo }) => {
      db.initDatabase();

      const savedHidden = repo.saveUiEditorLayoutOverride({
        targetAppId: "bbm",
        moduleId: "restarbeiten",
        scopeId: "restarbeiten.ui.main",
        elementId: "restarbeiten.editbox.text.short",
        overrides: { visible: false },
        source: "ui-editor",
      });

      assert.equal(savedHidden.targetAppId, "bbm");
      assert.equal(savedHidden.moduleId, "restarbeiten");
      assert.equal(savedHidden.scopeId, "restarbeiten.ui.main");
      assert.equal(savedHidden.elementId, "restarbeiten.editbox.text.short");
      assert.deepEqual(savedHidden.overrides, { visible: false });
      assert.equal(savedHidden.source, "ui-editor");
      assert.ok(savedHidden.createdAt);
      assert.ok(savedHidden.updatedAt);

      const loadedHidden = repo.getUiEditorLayoutOverride({
        targetAppId: "bbm",
        moduleId: "restarbeiten",
        scopeId: "restarbeiten.ui.main",
        elementId: "restarbeiten.editbox.text.short",
      });
      assert.deepEqual(loadedHidden.overrides, { visible: false });

      const savedVisible = repo.saveUiEditorLayoutOverride({
        targetAppId: "bbm",
        moduleId: "restarbeiten",
        scopeId: "restarbeiten.ui.main",
        elementId: "restarbeiten.editbox.text.short",
        overrides: { visible: true },
      });
      assert.deepEqual(savedVisible.overrides, { visible: true });

      const list = repo.listUiEditorLayoutOverrides({
        targetAppId: "bbm",
        moduleId: "restarbeiten",
        scopeId: "restarbeiten.ui.main",
      });
      assert.equal(list.length, 1);
      assert.deepEqual(list[0].overrides, { visible: true });
    });
  });

  await run("UI-Editor LayoutOverridesRepo: blockiert andere Scopes und Nicht-Visibility", () => {
    return withTempUiEditorLayoutOverridesRepo(({ db, repo }) => {
      db.initDatabase();

      assert.throws(
        () => repo.saveUiEditorLayoutOverride({
          targetAppId: "bbm",
          moduleId: "protokoll",
          scopeId: "protokoll.topsScreen",
          elementId: "protokoll.root",
          overrides: { visible: false },
        }),
        /UI_EDITOR_LAYOUT_OVERRIDE_SCOPE_NOT_ALLOWED/
      );

      assert.throws(
        () => repo.saveUiEditorLayoutOverride({
          targetAppId: "bbm",
          moduleId: "restarbeiten",
          scopeId: "restarbeiten.ui.main",
          elementId: "restarbeiten.editbox.text.short",
          overrides: { x: 12 },
        }),
        /overrides\.visible required|unsupported override key/
      );

      assert.throws(
        () => repo.saveUiEditorLayoutOverride({
          targetAppId: "bbm",
          moduleId: "restarbeiten",
          scopeId: "restarbeiten.ui.main",
          elementId: "restarbeiten.editbox.text.short",
          overrides: { visible: "false" },
        }),
        /overrides\.visible must be boolean/
      );
    });
  });
}

module.exports = { runUiEditorLayoutOverridesRepoTests };
