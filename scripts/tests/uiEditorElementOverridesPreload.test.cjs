const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");

function withPatchedPreloadElectron(stubs, fn) {
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === "electron" && String(parent?.filename || "").endsWith(path.join("main", "preload.js"))) {
      return stubs.electron;
    }
    return originalLoad.apply(this, arguments);
  };

  try {
    const modPath = path.join(process.cwd(), "src/main/preload.js");
    delete require.cache[require.resolve(modPath)];
    return fn(require(modPath));
  } finally {
    Module._load = originalLoad;
  }
}

async function runUiEditorElementOverridesPreloadTests(run) {
  await run("UI-Editor ElementOverrides-Preload: exponiert save/get API und nutzt die erwarteten IPC-Kanaele", async () => {
    const exposed = {};
    const invokeCalls = [];
    const stubs = {
      electron: {
        contextBridge: {
          exposeInMainWorld(name, api) {
            exposed[name] = api;
          },
        },
        ipcRenderer: {
          invoke(channel, payload) {
            invokeCalls.push({ channel, payload });
            return Promise.resolve({ ok: true, channel, payload });
          },
          on() {},
          removeListener() {},
        },
      },
    };

    withPatchedPreloadElectron(stubs, () => undefined);

    assert.equal(typeof exposed.bbmDb.uiEditorGetElementOverrides, "function");
    assert.equal(typeof exposed.bbmDb.uiEditorSaveElementOverride, "function");

    const listResult = await exposed.bbmDb.uiEditorGetElementOverrides({
      projectId: "project-42",
      surfaceId: "restarbeiten.ui.main",
    });
    const saveResult = await exposed.bbmDb.uiEditorSaveElementOverride({
      projectId: "project-42",
      surfaceId: "restarbeiten.ui.main",
      elementId: "restarbeiten.hinweisInfotext.text",
      elementType: "Hinweis / Infotext",
      changes: { text: "Vorschau" },
    });

    assert.equal(listResult.ok, true);
    assert.equal(saveResult.ok, true);
    assert.equal(invokeCalls[0].channel, "uiEditorElementOverrides:list");
    assert.equal(invokeCalls[1].channel, "uiEditorElementOverrides:save");
    assert.deepEqual(invokeCalls[0].payload, {
      projectId: "project-42",
      surfaceId: "restarbeiten.ui.main",
    });
    assert.deepEqual(invokeCalls[1].payload, {
      projectId: "project-42",
      surfaceId: "restarbeiten.ui.main",
      elementId: "restarbeiten.hinweisInfotext.text",
      elementType: "Hinweis / Infotext",
      changes: { text: "Vorschau" },
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

  runUiEditorElementOverridesPreloadTests(run).then(() => {
    if (!process.exitCode) console.log("uiEditorElementOverridesPreload.test.cjs passed");
  }).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runUiEditorElementOverridesPreloadTests };
