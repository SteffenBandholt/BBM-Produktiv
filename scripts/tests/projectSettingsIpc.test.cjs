const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");

const REPO_ROOT = process.cwd();

function withPatchedProjectSettingsIpc(stubs, fn) {
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    const fromProjectSettingsIpc = String(parent?.filename || "").endsWith(
      path.join("ipc", "projectSettingsIpc.js")
    );
    if (fromProjectSettingsIpc && request === "electron") return stubs.electron;
    if (fromProjectSettingsIpc && request === "../db/projectSettingsRepo") return stubs.projectSettingsRepo;
    return originalLoad.apply(this, arguments);
  };

  try {
    const modPath = path.join(REPO_ROOT, "src/main/ipc/projectSettingsIpc.js");
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
    getMany: [],
    setMany: [],
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
      projectSettingsRepo: {
        getMany(projectId, keys) {
          repoCalls.getMany.push({ projectId, keys });
          return {};
        },
        setMany(projectId, patch) {
          repoCalls.setMany.push({ projectId, patch });
          return { changes: 1 };
        },
      },
    },
  };
}

async function runProjectSettingsIpcTests(run) {
  await run("Projektsettings-IPC: pdf.footerUseUserData ist nicht mehr whitelisted", () => {
    const { stubs } = createDefaultStubs();
    return withPatchedProjectSettingsIpc(stubs, (mod) => {
      assert.equal(mod.PROJECT_PRINT_SETTINGS_KEYS.includes("pdf.footerUseUserData"), false);
    });
  });

  await run("Projektsettings-IPC: getMany filtert pdf.footerUseUserData aus der Anfrage", () => {
    const { handlers, repoCalls, stubs } = createDefaultStubs();
    return withPatchedProjectSettingsIpc(stubs, (mod) => {
      mod.registerProjectSettingsIpc();
      const handler = handlers.get("projectSettings:getMany");
      assert.equal(typeof handler, "function");
      const res = handler(
        {},
        {
          projectId: "p-1",
          keys: ["pdf.protocolTitle", "pdf.footerUseUserData", "pdf.footerCity"],
        }
      );
      assert.equal(res.ok, true);
      assert.deepEqual(repoCalls.getMany, [
        {
          projectId: "p-1",
          keys: ["pdf.protocolTitle", "pdf.footerCity"],
        },
      ]);
    });
  });

  await run("Projektsettings-IPC: setMany ignoriert pdf.footerUseUserData im Patch", () => {
    const { handlers, repoCalls, stubs } = createDefaultStubs();
    return withPatchedProjectSettingsIpc(stubs, (mod) => {
      mod.registerProjectSettingsIpc();
      const handler = handlers.get("projectSettings:setMany");
      assert.equal(typeof handler, "function");
      const res = handler(
        {},
        {
          projectId: "p-2",
          patch: {
            "pdf.protocolTitle": "Titel",
            "pdf.footerUseUserData": "true",
            "pdf.footerPlace": "Ort",
          },
        }
      );
      assert.equal(res.ok, true);
      assert.deepEqual(repoCalls.setMany, [
        {
          projectId: "p-2",
          patch: {
            "pdf.protocolTitle": "Titel",
            "pdf.footerPlace": "Ort",
          },
        },
      ]);
    });
  });
}

module.exports = { runProjectSettingsIpcTests };
