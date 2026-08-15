const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");

function loadModule() {
  const modulePath = path.join(process.cwd(), "src/main/ipc/firmDirectoryIpc.js");
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === "electron") return { ipcMain: {} };
    return originalLoad.apply(this, arguments);
  };
  try {
    delete require.cache[require.resolve(modulePath)];
    return require(modulePath);
  } finally {
    Module._load = originalLoad;
  }
}

async function runFirmDirectoryIpcTests(run) {
  await run("Firmenlogik IPC: alle kanonischen Intents sind registriert und Fehler strukturiert", async () => {
    const handlers = new Map();
    const ipcMain = { handle(channel, handler) { handlers.set(channel, handler); } };
    const service = {
      get: (data) => data,
      listAll: () => [],
      listProjectParticipants: () => [],
      listCustomers: () => [],
      listPersons: () => [],
      create: () => ({ id: "created" }),
      update: () => ({ id: "updated" }),
      checkUseChange: () => ({ allowed: true }),
      setUses() {
        const error = new Error("blockiert");
        error.code = "FIRM_USE_BLOCKED";
        error.impacts = [{ code: "open_restarbeiten", count: 1 }];
        throw error;
      },
      prepareLocalToGlobal: () => ({ executable: false }),
    };
    loadModule().registerFirmDirectoryIpc({ ipcMain, service });
    const expected = [
      "get", "listAll", "listProjectParticipants", "listCustomers", "listPersons",
      "create", "update", "checkUseChange", "setUses", "prepareLocalToGlobal",
    ].map((name) => `firmDirectory:${name}`);
    assert.deepEqual([...handlers.keys()], expected);
    assert.deepEqual(await handlers.get("firmDirectory:create")({}, {}), {
      ok: true,
      firm: { id: "created" },
    });
    const blocked = await handlers.get("firmDirectory:setUses")({}, {});
    assert.equal(blocked.ok, false);
    assert.equal(blocked.code, "FIRM_USE_BLOCKED");
    assert.equal(blocked.impacts[0].code, "open_restarbeiten");
  });
}

module.exports = { runFirmDirectoryIpcTests };
