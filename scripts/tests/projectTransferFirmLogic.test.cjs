const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const Database = require("better-sqlite3");

function loadTransferModule() {
  const modulePath = path.join(process.cwd(), "src/main/ipc/projectTransferIpc.js");
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === "electron") {
      return {
        ipcMain: { handle() {} },
        app: { getVersion: () => "test", getPath: () => process.cwd() },
        shell: {},
      };
    }
    return originalLoad.apply(this, arguments);
  };
  try {
    delete require.cache[require.resolve(modulePath)];
    return require(modulePath);
  } finally {
    Module._load = originalLoad;
  }
}

async function runProjectTransferFirmLogicTests(run) {
  const transfer = loadTransferModule();

  await run("Firmenlogik 33: neues Transferarchiv enthält Nutzungen und globale Abhängigkeiten", () => {
    const payloads = transfer._buildProjectTransferPayloads({
      project: { id: "p1" },
      data: {
        projectFirms: [{ id: "l1", use_project_participant: 0, use_customer: 1 }],
        globalFirmDependencies: [{ id: "g1" }],
        globalPersonDependencies: [{ id: "u1", firm_id: "g1" }],
        restarbeitenItems: [{ id: "r1", responsible_global_firm_id: "g1" }],
      },
    });
    const byName = new Map(payloads.map((entry) => [entry.name, entry.data]));
    assert.equal(byName.get("data/project_firms.json").project_firms[0].use_customer, 1);
    assert.equal(byName.get("data/global_firm_dependencies.json").firms[0].id, "g1");
    assert.equal(byName.get("data/restarbeiten_items.json").restarbeiten_items[0].responsible_global_firm_id, "g1");
  });

  await run("Firmenlogik 34: Altarchive erhalten deterministische Teilnehmerdefaults", () => {
    const rows = transfer._withLegacyFirmUseDefaults([{ id: "old" }]);
    assert.deepEqual(rows, [
      { id: "old", use_project_participant: 1, use_customer: 0 },
    ]);
    assert.deepEqual(
      transfer._withLegacyFirmUseDefaults([{ id: "new", use_project_participant: 0, use_customer: 1 }]),
      [{ id: "new", use_project_participant: 0, use_customer: 1 }]
    );
    const db = new Database(":memory:");
    try {
      db.exec(
        "CREATE TABLE project_firms (id TEXT PRIMARY KEY, use_project_participant INTEGER NOT NULL DEFAULT 0 CHECK(use_project_participant IN (0,1)), use_customer INTEGER NOT NULL DEFAULT 0 CHECK(use_customer IN (0,1)))"
      );
      db.prepare(
        "INSERT INTO project_firms (id, use_project_participant, use_customer) VALUES (@id, @use_project_participant, @use_customer)"
      ).run(rows[0]);
      assert.deepEqual(db.prepare("SELECT * FROM project_firms").get(), rows[0]);
    } finally {
      db.close();
    }
  });

  await run("Firmenlogik 35: fehlende oder kollidierende globale Abhängigkeit stoppt vor dem Write", () => {
    const db = new Database(":memory:");
    try {
      db.exec("CREATE TABLE firms (id TEXT PRIMARY KEY, name TEXT NOT NULL)");
      db.prepare("INSERT INTO firms (id, name) VALUES ('ok', 'Firma OK'), ('collision', 'Anderer Name')").run();
      assert.doesNotThrow(() =>
        transfer._validateGlobalDependencies(db, {
          projectGlobalFirms: [{ firm_id: "ok" }],
          globalFirmDependencies: [{ id: "ok", name: "Firma OK" }],
        })
      );
      assert.throws(
        () => transfer._validateGlobalDependencies(db, { projectGlobalFirms: [{ firm_id: "missing" }] }),
        /fehlt/
      );
      assert.throws(
        () =>
          transfer._validateGlobalDependencies(db, {
            projectGlobalFirms: [{ firm_id: "collision" }],
            globalFirmDependencies: [{ id: "collision", name: "Archivname" }],
          }),
        /kollidiert/
      );
      assert.throws(
        () =>
          transfer._validateGlobalDependencies(
            db,
            { projectGlobalFirms: [{ firm_id: "ok" }] },
            { requireSnapshots: true }
          ),
        /Snapshot.*fehlt/
      );

      db.exec("CREATE TABLE persons (id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, name TEXT NOT NULL)");
      db.prepare("INSERT INTO persons (id, firm_id, name) VALUES ('person-1', 'ok', 'Zielname')").run();
      assert.throws(
        () =>
          transfer._validateGlobalDependencies(
            db,
            {
              projectCandidates: [{ kind: "global_person", person_id: "person-1" }],
              globalPersonDependencies: [{ id: "person-1", firm_id: "ok", name: "Archivname" }],
            },
            { requireSnapshots: true }
          ),
        /kollidiert/
      );
    } finally {
      db.close();
    }
  });
}

module.exports = { runProjectTransferFirmLogicTests };
