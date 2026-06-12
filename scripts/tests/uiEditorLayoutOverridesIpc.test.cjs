const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");

function withPatchedUiEditorLayoutOverridesIpc(stubs, fn) {
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    const fromIpc = String(parent?.filename || "").endsWith(
      path.join("ipc", "uiEditorLayoutOverridesIpc.js")
    );
    if (fromIpc && request === "electron") return stubs.electron;
    if (fromIpc && request === "../db/uiEditorLayoutOverridesRepo") return stubs.repo;
    return originalLoad.apply(this, arguments);
  };

  try {
    const modPath = path.join(process.cwd(), "src/main/ipc/uiEditorLayoutOverridesIpc.js");
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
    listUiEditorLayoutOverrides: [],
    saveUiEditorLayoutOverride: [],
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
        listUiEditorLayoutOverrides(payload) {
          repoCalls.listUiEditorLayoutOverrides.push(payload);
          return [{ scopeId: "restarbeiten.ui.main", elementId: "restarbeiten.root", overrides: { visible: false } }];
        },
        saveUiEditorLayoutOverride(payload) {
          repoCalls.saveUiEditorLayoutOverride.push(payload);
          return { ...payload, saved: true };
        },
      },
    },
  };
}

async function runUiEditorLayoutOverridesIpcTests(run) {
  await run("UI-Editor LayoutOverrides-IPC: registriert get/save Handler", () => {
    const { handlers, stubs } = createDefaultStubs();
    return withPatchedUiEditorLayoutOverridesIpc(stubs, (mod) => {
      mod.registerUiEditorLayoutOverridesIpc();
      assert.equal(typeof handlers.get("uiEditorLayoutOverrides:getMany"), "function");
      assert.equal(typeof handlers.get("uiEditorLayoutOverrides:save"), "function");
    });
  });

  await run("UI-Editor LayoutOverrides-IPC: reicht Payloads sauber an das Repo durch", async () => {
    const { handlers, repoCalls, stubs } = createDefaultStubs();
    return withPatchedUiEditorLayoutOverridesIpc(stubs, async (mod) => {
      mod.registerUiEditorLayoutOverridesIpc();

      const getMany = handlers.get("uiEditorLayoutOverrides:getMany");
      const save = handlers.get("uiEditorLayoutOverrides:save");
      const filter = {
        targetAppId: "bbm",
        moduleId: "restarbeiten",
        scopeId: "restarbeiten.ui.main",
      };
      const payload = {
        ...filter,
        elementId: "restarbeiten.editbox.text.short",
        overrides: { visible: false },
      };

      const manyRes = await getMany({}, filter);
      const saveRes = await save({}, payload);

      assert.equal(manyRes.ok, true);
      assert.equal(saveRes.ok, true);
      assert.equal(manyRes.data[0].overrides.visible, false);
      assert.equal(saveRes.data.saved, true);
      assert.deepEqual(repoCalls.listUiEditorLayoutOverrides, [filter]);
      assert.deepEqual(repoCalls.saveUiEditorLayoutOverride, [payload]);
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

  runUiEditorLayoutOverridesIpcTests(run).then(() => {
    if (!process.exitCode) console.log("uiEditorLayoutOverridesIpc.test.cjs passed");
  }).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runUiEditorLayoutOverridesIpcTests };
