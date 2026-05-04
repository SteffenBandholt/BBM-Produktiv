const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

function withPatchedProjectsIpc(stubs, fn) {
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    const fromProjectsIpc = String(parent?.filename || "").endsWith(path.join("ipc", "projectsIpc.js"));
    if (fromProjectsIpc && request === "electron") return stubs.electron;
    if (fromProjectsIpc && request === "../db/appSettingsRepo") return stubs.appSettingsRepo;
    if (fromProjectsIpc && request === "../db/projectsRepo") return stubs.projectsRepo;
    if (fromProjectsIpc && request === "../licensing/featureGuard") return stubs.featureGuard;
    return originalLoad.apply(this, arguments);
  };

  try {
    const modPath = path.join(process.cwd(), "src/main/ipc/projectsIpc.js");
    delete require.cache[require.resolve(modPath)];
    const mod = require(modPath);
    return fn(mod);
  } finally {
    Module._load = originalLoad;
  }
}

async function runLicenseFeatureGuardTests(run) {
  const printIpc = read("src/main/ipc/printIpc.js");
  const audioIpc = read("src/main/ipc/audioIpc.js");
  const mainSource = read("src/main/main.js");
  const projectsIpc = read("src/main/ipc/projectsIpc.js");

  await run("License-Guard: PDF-IPC prüft Protokoll-Modul", () => {
    assert.equal(printIpc.includes('_enforceFeature("protokoll");'), true);
  });

  await run("License-Guard: Audio-IPC prüft Diktat-Feature", () => {
    assert.equal(audioIpc.includes("enforceLicensedFeature(LICENSE_FEATURES.DIKTAT);"), true);
  });

  await run("License-Guard: Mail-IPC prüft Protokoll-Modul", () => {
    assert.equal(mainSource.includes('enforceLicensedFeature("protokoll");'), true);
  });

  await run("License-Guard: Projektzugriff ist nicht mehr pauschal an Protokoll gebunden", () => {
    assert.equal(projectsIpc.includes('enforceLicensedFeature("protokoll");'), false);
  });

  await run("License-Guard: Projektzugriff mappt Lizenzfehler als Payload", () => {
    assert.equal(projectsIpc.includes("toLicenseErrorPayload"), true);
    assert.equal(projectsIpc.includes("return toLicenseErrorPayload(err);"), true);
    assert.equal(projectsIpc.includes("_runProjectTask"), true);
  });

  await run("License-Guard: Projektverwaltung laeuft ohne Protokoll-Modul weiter", () => {
    const calls = [];
    return withPatchedProjectsIpc(
      {
        electron: {
          ipcMain: {
            handle(channel, handler) {
              calls.push({ type: "handle", channel, handler });
            },
          },
          app: {
            getPath() {
              return "C:\\Temp";
            },
            getVersion() {
              return "1.5.0";
            },
          },
        },
        appSettingsRepo: {
          appSettingsGetMany(keys) {
            calls.push({ type: "settings", keys });
            return { "pdf.protocolsDir": "C:\\Temp\\Protokolle" };
          },
        },
        projectsRepo: {
          listAll() {
            calls.push({ type: "listAll" });
            return [{ id: "17", name: "Projekt A" }];
          },
          listArchived() {
            calls.push({ type: "listArchived" });
            return [];
          },
          archiveProject(projectId) {
            calls.push({ type: "archive", projectId });
            return { id: projectId };
          },
          unarchiveProject(projectId) {
            calls.push({ type: "unarchive", projectId });
            return { id: projectId };
          },
          deleteForever(projectId) {
            calls.push({ type: "deleteForever", projectId });
          },
          createProject(payload) {
            calls.push({ type: "create", payload });
            return { id: "new", ...payload };
          },
          updateProject(payload) {
            calls.push({ type: "update", payload });
            return { id: payload?.projectId || "17" };
          },
        },
        featureGuard: {
          enforceLicensedFeature() {
            calls.push({ type: "guard" });
          },
          toLicenseErrorPayload(err) {
            return { ok: false, error: err?.message || String(err) };
          },
        },
      },
      (mod) => {
        mod.registerProjectsIpc();
        const listHandler = calls.find((item) => item.type === "handle" && item.channel === "projects:list")
          ?.handler;
        assert.equal(typeof listHandler, "function");
        const result = listHandler();
        assert.deepEqual(result, { ok: true, list: [{ id: "17", name: "Projekt A" }] });
        assert.equal(calls.some((item) => item.type === "guard"), false);
        assert.equal(calls.some((item) => item.type === "listAll"), true);
      }
    );
  });

  await run("License-Guard: moduleAccessState spiegelt freigeschaltete Module aus der Lizenz", async () => {
    const previousWindow = global.window;
    const mod = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/app/modules/moduleAccessState.js")
    );

    global.window = {
      bbmDb: {
        async licenseGetStatus() {
          return { ok: true, valid: true, modules: ["protokoll"] };
        },
      },
    };

    try {
      const activeIds = await mod.refreshCachedActiveModuleAccess({ force: true });
      assert.equal(Array.isArray(activeIds), true);
      assert.equal(mod.isModuleActive("protokoll"), true);
      assert.equal(mod.isModuleActive("audio"), false);

      global.window.bbmDb.licenseGetStatus = async () => ({ ok: true, valid: true, modules: [] });
      const inactiveIds = await mod.refreshCachedActiveModuleAccess({ force: true });
      assert.equal(Array.isArray(inactiveIds), true);
      assert.equal(mod.isModuleActive("protokoll"), false);
    } finally {
      global.window = previousWindow;
    }
  });

  await run("License-Guard: Lizenzfehler werden payload-freundlich gemappt", () => {
    assert.equal(printIpc.includes("return toLicenseErrorPayload(err);"), true);
    assert.equal(mainSource.includes("return toLicenseErrorPayload(err);"), true);
    assert.equal(audioIpc.includes("return toLicenseErrorPayload(err);"), true);
  });
}

module.exports = { runLicenseFeatureGuardTests };
