const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");

function withPatchedUiEditorElementOverridesIpc(stubs, fn) {
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    const fromIpc = String(parent?.filename || "").endsWith(
      path.join("ipc", "uiEditorElementOverridesIpc.js")
    );
    if (fromIpc && request === "electron") return stubs.electron;
    if (fromIpc && request === "../db/uiEditorElementOverridesRepo") return stubs.repo;
    return originalLoad.apply(this, arguments);
  };

  try {
    const modPath = path.join(process.cwd(), "src/main/ipc/uiEditorElementOverridesIpc.js");
    delete require.cache[require.resolve(modPath)];
    const mod = require(modPath);
    return fn(mod);
  } finally {
    Module._load = originalLoad;
  }
}

function createDefaultStubs() {
  const handlers = new Map();
  const repoCalls = {
    listUiEditorElementOverrides: [],
    saveUiEditorElementOverride: [],
  };

  return {
    handlers,
    repoCalls,
    stubs: {
      electron: {
        ipcMain: {
          handle: (channel, handler) => handlers.set(channel, handler),
        },
      },
      repo: {
        listUiEditorElementOverrides(payload) {
          repoCalls.listUiEditorElementOverrides.push(payload);
          return [{ id: "override-1", resultReference: "override-1" }];
        },
        saveUiEditorElementOverride(payload) {
          repoCalls.saveUiEditorElementOverride.push(payload);
          return { id: "override-1", resultReference: "override-1", saved: true };
        },
      },
    },
  };
}

async function runUiEditorElementOverridesIpcTests(run) {
  await run("UI-Editor ElementOverrides-IPC: registriert list/save Handler", () => {
    const { handlers, stubs } = createDefaultStubs();
    return withPatchedUiEditorElementOverridesIpc(stubs, (mod) => {
      mod.registerUiEditorElementOverridesIpc();
      assert.equal(typeof handlers.get("uiEditorElementOverrides:list"), "function");
      assert.equal(typeof handlers.get("uiEditorElementOverrides:save"), "function");
    });
  });

  await run("UI-Editor ElementOverrides-IPC: reicht Payloads sauber an das Repo durch", async () => {
    const { handlers, repoCalls, stubs } = createDefaultStubs();
    return withPatchedUiEditorElementOverridesIpc(stubs, async (mod) => {
      mod.registerUiEditorElementOverridesIpc();

      const list = handlers.get("uiEditorElementOverrides:list");
      const save = handlers.get("uiEditorElementOverrides:save");
      const filter = {
        projectId: "project-42",
        surfaceId: "restarbeiten.ui.main",
      };
      const payload = {
        ...filter,
        elementId: "restarbeiten.hinweisInfotext.text",
        elementType: "Hinweis / Infotext",
        changes: { text: "Erster Entwurf" },
      };

      const listRes = await list({}, filter);
      const saveRes = await save({}, payload);

      assert.equal(listRes.ok, true);
      assert.equal(saveRes.ok, true);
      assert.equal(listRes.data[0].resultReference, "override-1");
      assert.equal(saveRes.data.saved, true);
      assert.deepEqual(repoCalls.listUiEditorElementOverrides, [filter]);
      assert.deepEqual(repoCalls.saveUiEditorElementOverride, [payload]);
    });
  });
}

if (require.main === module) {
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

  runUiEditorElementOverridesIpcTests(run).then(() => {
    if (!process.exitCode) console.log("uiEditorElementOverridesIpc.test.cjs passed");
  }).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runUiEditorElementOverridesIpcTests };
