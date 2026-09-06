const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function status(modules) {
  return { valid: true, license: { modules } };
}

async function runModuleIpcRegistrationTests(run) {
  await run("Paket 4: nur aktive Fachmodule registrieren eigene IPCs", () => {
    const { registerActiveModuleIpcs } = require(path.join(process.cwd(), "src/main/moduleIpcRegistry.js"));
    const handlers = new Map();
    const calls = [];
    const ipcMain = { handle: (channel, listener) => handlers.set(channel, listener) };
    const registrars = {
      protokoll: ({ ipcMain: guarded }) => {
        calls.push("protokoll");
        guarded.handle("protokoll:test", () => "ok");
      },
      restarbeiten: () => calls.push("restarbeiten"),
      rechnung: () => calls.push("rechnung"),
    };

    const result = registerActiveModuleIpcs({
      licenseStatus: status(["protokoll"]),
      getLicenseStatus: () => status(["protokoll"]),
      ipcMain,
      registrars,
    });

    assert.deepEqual(calls, ["protokoll"]);
    assert.deepEqual(result.registeredModuleIds, ["protokoll"]);
    assert.deepEqual([...handlers.keys()], ["protokoll:test"]);
  });

  await run("Paket 4: Registrar wird ueber den Moduldeskriptor aufgeloest", () => {
    const registryPath = path.join(process.cwd(), "src/main/module-registry.json");
    const registry = require(registryPath);
    const original = registry.modules.protokoll.ipcRegistrar;
    registry.modules.protokoll.ipcRegistrar = "protokoll-adapter";
    delete require.cache[path.join(process.cwd(), "src/main/moduleIpcRegistry.js")];
    const { registerActiveModuleIpcs } = require(path.join(process.cwd(), "src/main/moduleIpcRegistry.js"));
    const calls = [];
    try {
      registerActiveModuleIpcs({
        licenseStatus: status(["protokoll"]),
        getLicenseStatus: () => status(["protokoll"]),
        ipcMain: { handle() {} },
        registrars: { "protokoll-adapter": () => calls.push("adapter") },
      });
      assert.deepEqual(calls, ["adapter"]);
    } finally {
      registry.modules.protokoll.ipcRegistrar = original;
      delete require.cache[path.join(process.cwd(), "src/main/moduleIpcRegistry.js")];
    }
  });

  await run("Paket 4: registrierter Fach-IPC prueft die aktuelle Modulfreigabe erneut", async () => {
    const { createGuardedIpcMain } = require(path.join(process.cwd(), "src/main/moduleIpcRegistry.js"));
    const handlers = new Map();
    let currentStatus = status(["rechnung"]);
    const guarded = createGuardedIpcMain({
      ipcMain: { handle: (channel, listener) => handlers.set(channel, listener) },
      moduleId: "rechnung",
      getLicenseStatus: () => currentStatus,
    });
    guarded.handle("rechnung:test", async () => ({ ok: true }));

    assert.deepEqual(await handlers.get("rechnung:test")({}, {}), { ok: true });
    currentStatus = status([]);
    assert.throws(() => handlers.get("rechnung:test")({}, {}), /MODULE_NOT_ACTIVE:rechnung/);
  });

  await run("Paket 4: Main enthaelt keine statische Fach-IPC-Einzelregistrierung", () => {
    const main = read("src/main/main.js");
    assert.equal(main.includes('require("./ipc/meetingsIpc")'), false);
    assert.equal(main.includes('require("./ipc/topsIpc")'), false);
    assert.match(main, /registerProjectParticipantsIpc\(\)/);
    assert.equal(main.includes('require("./ipc/restarbeitenIpc")'), false);
    assert.equal(main.includes('require("./ipc/rechnungIpc")'), false);
    assert.equal(main.includes("registerRechnungIpc({ ipcMain })"), false);
    assert.match(main, /registrars:\s*moduleIpcRegistrars/);
  });

  await run("Paket 4: jedes installierte Fachmodul besitzt einen kleinen Registrar", () => {
    const registry = JSON.parse(read("src/main/module-registry.json"));
    const registrarCatalog = require(path.join(process.cwd(), "src/main/moduleIpcRegistrars.js"));
    for (const definition of Object.values(registry.modules)) {
      assert.equal(typeof registrarCatalog[definition.ipcRegistrar], "function");
      const source = read(`src/main/modules/${definition.ipcRegistrar}/registerIpc.js`);
      assert.match(source, /function registerIpc/);
      assert.equal(source.includes("ipcMain.handle"), false);
    }
  });

  await run("Paket 4: Registrar-Katalog enthaelt keine Fachmodul-Sonderliste", () => {
    const source = read("src/main/moduleIpcRegistrars.js");
    assert.match(source, /getModuleIds\(\)\.map/);
    assert.match(source, /modules\/\$\{registrarKey\}\/registerIpc/);
    assert.equal(source.includes("protokoll:"), false);
    assert.equal(source.includes("restarbeiten:"), false);
    assert.equal(source.includes("rechnung:"), false);
  });

  await run("Paket 4: Preload-Fachzugriffe bleiben durch nicht registrierte oder geguardete Handler begrenzt", () => {
    const preload = read("src/main/preload.js");
    assert.match(preload, /rechnung:defaults/);
    assert.match(preload, /restarbeiten:listByProject/);
    const registrySource = read("src/main/moduleIpcRegistry.js");
    assert.match(registrySource, /resolveActiveModuleIds/);
    assert.match(registrySource, /createGuardedIpcMain/);
    assert.match(registrySource, /MODULE_NOT_ACTIVE/);
  });
}

module.exports = { runModuleIpcRegistrationTests };
