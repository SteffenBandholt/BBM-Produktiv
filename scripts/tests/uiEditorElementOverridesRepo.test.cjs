const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const { spawnSync } = require("node:child_process");

function rerunWithElectronNodeIfNeeded() {
  if (process.versions.electron || process.env.BBM_UI_EDITOR_ELEMENT_OVERRIDES_REPO_ELECTRON_NODE === "1") {
    return false;
  }
  const isWindows = process.platform === "win32";
  const electronCandidates = isWindows
    ? [
        path.resolve(process.cwd(), "node_modules", "electron", "dist", "electron.exe"),
        path.resolve(process.cwd(), "node_modules", ".bin", "electron.cmd"),
      ]
    : [path.resolve(process.cwd(), "node_modules", ".bin", "electron")];
  const electronBinary = electronCandidates.find((candidate) => fs.existsSync(candidate));
  if (!electronBinary) return false;

  const useCmdLauncher = isWindows && electronBinary.toLowerCase().endsWith(".cmd");
  const child = spawnSync(
    useCmdLauncher ? "cmd.exe" : electronBinary,
    useCmdLauncher
      ? ["/d", "/s", "/c", `"${electronBinary}" "${__filename}"`]
      : [__filename],
    {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        BBM_UI_EDITOR_ELEMENT_OVERRIDES_REPO_ELECTRON_NODE: "1",
      },
      stdio: "inherit",
    }
  );
  if (child.error) {
    console.error(child.error?.message || child.error);
    process.exit(1);
  }
  process.exit(typeof child.status === "number" ? child.status : 1);
  return true;
}

async function withTempUiEditorElementOverridesRepo(fn) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-ui-editor-element-overrides-"));
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
    const repoPath = path.join(process.cwd(), "src/main/db/uiEditorElementOverridesRepo.js");
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

async function runUiEditorElementOverridesRepoTests(run) {
  await run("UI-Editor ElementOverridesRepo: Schema wird angelegt", () => {
    return withTempUiEditorElementOverridesRepo(({ db }) => {
      const conn = db.initDatabase();
      const row = conn
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ui_editor_element_overrides'")
        .get();
      assert.equal(Boolean(row), true);
    });
  });

  await run("UI-Editor ElementOverridesRepo: speichert und ueberschreibt denselben Element-Override", () => {
    return withTempUiEditorElementOverridesRepo(({ db, repo }) => {
      db.initDatabase();

      const savedOne = repo.saveUiEditorElementOverride({
        projectId: "project-42",
        surfaceId: "restarbeiten.ui.main",
        elementId: "restarbeiten.hinweisInfotext.text",
        elementType: "Hinweis / Infotext",
        changes: { text: "Erster Entwurf", visible: true, order: 1 },
      });
      assert.equal(savedOne.projectId, "project-42");
      assert.equal(savedOne.surfaceId, "restarbeiten.ui.main");
      assert.equal(savedOne.elementId, "restarbeiten.hinweisInfotext.text");
      assert.equal(savedOne.elementType, "Hinweis / Infotext");
      assert.deepEqual(savedOne.changes, { text: "Erster Entwurf", visible: true, order: 1 });
      assert.ok(savedOne.id);
      assert.equal(savedOne.resultReference, savedOne.id);
      assert.ok(savedOne.createdAt);
      assert.ok(savedOne.updatedAt);

      const savedTwo = repo.saveUiEditorElementOverride({
        projectId: "project-42",
        surfaceId: "restarbeiten.ui.main",
        elementId: "restarbeiten.hinweisInfotext.text",
        elementType: "label",
        changes: { text: "Zweiter Entwurf", visible: false },
      });
      assert.equal(savedTwo.id, savedOne.id);
      assert.equal(savedTwo.resultReference, savedOne.id);
      assert.deepEqual(savedTwo.changes, { text: "Zweiter Entwurf", visible: false });

      const loaded = repo.getUiEditorElementOverride({
        projectId: "project-42",
        surfaceId: "restarbeiten.ui.main",
        elementId: "restarbeiten.hinweisInfotext.text",
      });
      assert.equal(loaded.id, savedOne.id);
      assert.deepEqual(loaded.changes, { text: "Zweiter Entwurf", visible: false });

      const list = repo.listUiEditorElementOverrides({
        projectId: "project-42",
        surfaceId: "restarbeiten.ui.main",
      });
      assert.equal(list.length, 1);
      assert.equal(list[0].id, savedOne.id);
    });
  });

  await run("UI-Editor ElementOverridesRepo: blockiert ungueltige Payloads und Allowlist-Verstoesse", () => {
    return withTempUiEditorElementOverridesRepo(({ db, repo }) => {
      db.initDatabase();

      for (const payload of [
        {},
        {
          surfaceId: "restarbeiten.ui.main",
          elementId: "restarbeiten.hinweisInfotext.text",
          elementType: "Hinweis / Infotext",
          changes: { text: "A" },
        },
        {
          projectId: "project-42",
          elementId: "restarbeiten.hinweisInfotext.text",
          elementType: "Hinweis / Infotext",
          changes: { text: "A" },
        },
        {
          projectId: "project-42",
          surfaceId: "restarbeiten.ui.main",
          elementType: "Hinweis / Infotext",
          changes: { text: "A" },
        },
        {
          projectId: "project-42",
          surfaceId: "restarbeiten.ui.main",
          elementId: "restarbeiten.hinweisInfotext.text",
          changes: { text: "A" },
        },
      ]) {
        assert.throws(() => repo.saveUiEditorElementOverride(payload), /projectId required|surfaceId required|elementId required|elementType required|changes required/);
      }

      assert.throws(
        () => repo.saveUiEditorElementOverride({
          projectId: "project-42",
          surfaceId: "unknown.surface",
          elementId: "restarbeiten.hinweisInfotext.text",
          elementType: "Hinweis / Infotext",
          changes: { text: "A" },
        }),
        /surfaceId not allowed/
      );

      assert.throws(
        () => repo.saveUiEditorElementOverride({
          projectId: "project-42",
          surfaceId: "restarbeiten.ui.main",
          elementId: "restarbeiten.hinweisInfotext.text",
          elementType: "unbekannt",
          changes: { text: "A" },
        }),
        /elementType not allowed/
      );

      assert.throws(
        () => repo.saveUiEditorElementOverride({
          projectId: "project-42",
          surfaceId: "restarbeiten.ui.main",
          elementId: "restarbeiten.hinweisInfotext.text",
          elementType: "Hinweis / Infotext",
          changes: {},
        }),
        /changes required/
      );

      assert.throws(
        () => repo.saveUiEditorElementOverride({
          projectId: "project-42",
          surfaceId: "restarbeiten.ui.main",
          elementId: "restarbeiten.hinweisInfotext.text",
          elementType: "Hinweis / Infotext",
          changes: { noteText: "A" },
        }),
        /noteText/
      );

      assert.throws(
        () => repo.saveUiEditorElementOverride({
          projectId: "project-42",
          surfaceId: "restarbeiten.ui.main",
          elementId: "restarbeiten.hinweisInfotext.text",
          elementType: "Hinweis / Infotext",
          changes: { restarbeitId: "ra-1" },
        }),
        /restarbeitId/
      );

      assert.throws(
        () => repo.saveUiEditorElementOverride({
          projectId: "project-42",
          surfaceId: "restarbeiten.ui.main",
          elementId: "restarbeiten.hinweisInfotext.text",
          elementType: "Hinweis / Infotext",
          changes: { unknown: "x" },
        }),
        /unsupported change key/
      );
    });
  });
}

if (require.main === module) {
  rerunWithElectronNodeIfNeeded();

  const run = async (name, fn) => {
    try {
      const out = fn();
      if (out && typeof out.then === "function") await out;
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
      process.exitCode = 1;
    }
  };

  runUiEditorElementOverridesRepoTests(run).then(() => {
    if (!process.exitCode) console.log("uiEditorElementOverridesRepo.test.cjs passed");
  }).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runUiEditorElementOverridesRepoTests };
