const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");

function withPatchedTableLayoutsIpc(stubs, fn) {
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    const fromTableLayoutsIpc = String(parent?.filename || "").endsWith(
      path.join("ipc", "tableLayoutsIpc.js")
    );
    if (fromTableLayoutsIpc && request === "electron") return stubs.electron;
    if (fromTableLayoutsIpc && request === "../db/tableLayoutsRepo") return stubs.tableLayoutsRepo;
    if (fromTableLayoutsIpc && request === "../../shared/tableLayouts/tableLayoutRegistry") {
      return stubs.tableLayoutRegistry;
    }
    return originalLoad.apply(this, arguments);
  };

  try {
    const modPath = path.join(process.cwd(), "src/main/ipc/tableLayoutsIpc.js");
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
    listTableLayouts: [],
    getEffectiveTableLayout: [],
    saveTableLayout: [],
    resetTableLayout: [],
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
      tableLayoutsRepo: {
        listTableLayouts(payload) {
          repoCalls.listTableLayouts.push(payload);
          return [{ tableKey: "protokoll_tops" }];
        },
        async getEffectiveTableLayout(payload) {
          repoCalls.getEffectiveTableLayout.push(payload);
          return { ok: true, payload };
        },
        async saveTableLayout(payload) {
          repoCalls.saveTableLayout.push(payload);
          return { saved: true, payload };
        },
        resetTableLayout(payload) {
          repoCalls.resetTableLayout.push(payload);
          return { removed: 1, payload };
        },
      },
      tableLayoutRegistry: {
        async listTableLayoutDefinitions() {
          return [
            {
              moduleId: "protokoll",
              moduleLabel: "Protokoll",
              tableKey: "protokoll_tops",
              tableLabel: "TOP-Liste",
              description: "Pilotlayout",
              supportedOrientations: ["portrait", "landscape"],
              editFields: [{ key: "uiNumberWidth", label: "UI TOP-Spalte" }],
              previewData: [{ topNumber: "1", shortText: "Beispielthema", status: "offen" }],
              defaultLayout: { tableKey: "protokoll_tops", variant: "portrait" },
            },
          ];
        },
      },
    },
  };
}

async function runTableLayoutsIpcTests(run) {
  await run("TableLayouts-IPC: registriert get/save/reset Handler", () => {
    const { handlers, stubs } = createDefaultStubs();
    return withPatchedTableLayoutsIpc(stubs, (mod) => {
      mod.registerTableLayoutsIpc();
      assert.equal(typeof handlers.get("tableLayouts:getMany"), "function");
      assert.equal(typeof handlers.get("tableLayouts:listDefinitions"), "function");
      assert.equal(typeof handlers.get("tableLayouts:getOne"), "function");
      assert.equal(typeof handlers.get("tableLayouts:save"), "function");
      assert.equal(typeof handlers.get("tableLayouts:reset"), "function");
    });
  });

  await run("TableLayouts-IPC: reicht Payloads sauber an das Repo durch", async () => {
    const { handlers, repoCalls, stubs } = createDefaultStubs();
    return withPatchedTableLayoutsIpc(stubs, async (mod) => {
      mod.registerTableLayoutsIpc();

      const getMany = handlers.get("tableLayouts:getMany");
      const listDefinitions = handlers.get("tableLayouts:listDefinitions");
      const getOne = handlers.get("tableLayouts:getOne");
      const save = handlers.get("tableLayouts:save");
      const reset = handlers.get("tableLayouts:reset");

      const manyRes = await getMany({}, { tableKey: "protokoll_tops" });
      const defsRes = await listDefinitions({}, {});
      const oneRes = await getOne(
        {},
        {
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          orientation: "landscape",
        }
      );
      const saveRes = await save(
        {},
        {
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          orientation: "portrait",
          layout: { labels: { text: "Gegenstand" } },
        }
      );
      const resetRes = await reset(
        {},
        {
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          orientation: "portrait",
        }
      );

      assert.equal(manyRes.ok, true);
      assert.equal(defsRes.ok, true);
      assert.equal(oneRes.ok, true);
      assert.equal(saveRes.ok, true);
      assert.equal(resetRes.ok, true);
      assert.equal(defsRes.data[0].moduleId, "protokoll");
      assert.equal(defsRes.data[0].moduleLabel, "Protokoll");
      assert.equal(defsRes.data[0].tableKey, "protokoll_tops");
      assert.equal(defsRes.data[0].tableLabel, "TOP-Liste");
      assert.equal(Array.isArray(defsRes.data[0].previewData), true);
      assert.equal(defsRes.data[0].previewData[0].topNumber, "1");
      assert.equal(defsRes.data[0].defaultLayout.variant, "portrait");
      assert.deepEqual(repoCalls.listTableLayouts, [{ tableKey: "protokoll_tops" }]);
      assert.deepEqual(repoCalls.getEffectiveTableLayout, [
        {
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          orientation: "landscape",
        },
      ]);
      assert.deepEqual(repoCalls.saveTableLayout, [
        {
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          orientation: "portrait",
          layout: { labels: { text: "Gegenstand" } },
        },
      ]);
      assert.deepEqual(repoCalls.resetTableLayout, [
        {
          tableKey: "protokoll_tops",
          moduleId: "protokoll",
          orientation: "portrait",
        },
      ]);
    });
  });
}

module.exports = { runTableLayoutsIpcTests };
