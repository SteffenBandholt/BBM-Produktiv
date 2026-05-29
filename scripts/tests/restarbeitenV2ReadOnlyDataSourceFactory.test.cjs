const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRestarbeitenV2ReadOnlyDataSourceFactoryTests(run) {
  const factoryPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2ReadOnlyDataSourceFactory.js");
  const screenPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/RestarbeitenV2Screen.js");
  const routerPath = path.join(__dirname, "../../src/renderer/app/Router.js");

  const source = fs.readFileSync(factoryPath, "utf8");
  const screenSource = fs.readFileSync(screenPath, "utf8");
  const routerSource = fs.readFileSync(routerPath, "utf8");
  assert.equal(source.includes("ipc"), false);
  assert.equal(source.includes("db"), false);
  assert.equal(source.includes("localStorage"), false);
  assert.equal(source.includes("fetch"), false);
  assert.equal(source.includes("window"), false);
  assert.equal(source.includes("src/renderer/modules/restarbeiten/"), false);
  assert.equal(source.includes("src/main/"), false);
  assert.equal(source.includes("src/preload/"), false);
  assert.equal(screenSource.includes("createRestarbeitenV2ReadOnlyDataSourceFactory"), false);
  assert.equal(routerSource.includes("createRestarbeitenV2ReadOnlyDataSourceFactory"), true);

  const {
    createRestarbeitenV2ReadOnlyDataSourceFactory,
    createRestarbeitenV2ReadOnlyDataSource,
  } = await importEsmFromFile(factoryPath);

  assert.equal(typeof createRestarbeitenV2ReadOnlyDataSourceFactory, "function");
  assert.equal(typeof createRestarbeitenV2ReadOnlyDataSource, "function");

  const legacyCalls = [];
  const dataSource = createRestarbeitenV2ReadOnlyDataSource({
    loadRestarbeiten: async (projectId) => {
      legacyCalls.push(projectId);
      return [
        {
          restarbeit_id: "LEG-1",
          lfd_nr: "R-301",
          title: "Factory offen",
          description: "Haus X",
          location: "Haus X",
          state: "open",
          completion_note: "Factory Meta",
          note: "Factory Notiz",
          photos: ["f-1.jpg"],
        },
        {
          restarbeit_id: "LEG-2",
          number: "R-302",
          kurztext: "Factory erledigt",
          ort: "Wohnung 7",
          status: "done",
        },
      ];
    },
  });

  assert.equal(typeof dataSource.listRestarbeitenV2, "function");
  assert.equal(typeof dataSource.createRestarbeitV2, "function");
  assert.equal(typeof dataSource.updateRestarbeitV2, "function");
  assert.equal(typeof dataSource.deleteRestarbeitV2, "function");
  assert.equal(typeof dataSource.listRestarbeitV2Attachments, "function");

  const list = await dataSource.listRestarbeitenV2("project-factory");
  assert.deepEqual(legacyCalls, ["project-factory"]);
  assert.equal(Array.isArray(list), true);
  assert.equal(list.length, 2);
  assert.equal(list[0].id, "LEG-1");
  assert.equal(list[0].nummer, "R-301");
  assert.equal(list[0].kurztext, "Factory offen");
  assert.equal(list[0].verortung, "Haus X");
  assert.equal(list[0].status, "offen");
  assert.equal(list[0].meta, "Factory Meta");
  assert.equal(list[0].notiz, "Factory Notiz");
  assert.deepEqual(list[0].fotos, ["f-1.jpg"]);
  assert.equal(list[1].id, "LEG-2");
  assert.equal(list[1].nummer, "R-302");
  assert.equal(list[1].kurztext, "Factory erledigt");
  assert.equal(list[1].verortung, "Wohnung 7");
  assert.equal(list[1].status, "erledigt");

  await assert.rejects(dataSource.listRestarbeitenV2(), /projectId/);
  await assert.rejects(createRestarbeitenV2ReadOnlyDataSourceFactory().createRestarbeitenV2ReadOnlyDataSource().listRestarbeitenV2("project-x"), /nicht angebunden|keine Lesebridge/);

  assert.throws(() => dataSource.createRestarbeitV2("project-factory", {}), /kein Erstellen/);
  assert.throws(() => dataSource.updateRestarbeitV2("id-1", {}), /kein Aktualisieren/);
  assert.throws(() => dataSource.deleteRestarbeitV2("id-1"), /kein L.+schen/);
  assert.deepEqual(await dataSource.listRestarbeitV2Attachments("id-1"), []);

  const factory = createRestarbeitenV2ReadOnlyDataSourceFactory({
    bridge: {
      listRestarbeiten: async (projectId) => [{ restarbeit_id: projectId, title: "Bridge Factory" }],
    },
  });
  const bridgeDataSource = factory.createRestarbeitenV2ReadOnlyDataSource();
  const bridgeList = await bridgeDataSource.listRestarbeitenV2("project-bridge");
  assert.equal(bridgeList[0].id, "project-bridge");
  assert.equal(bridgeList[0].kurztext, "Bridge Factory");

  const apiFactory = createRestarbeitenV2ReadOnlyDataSourceFactory({
    api: {
      listRestarbeiten: async (projectId) => [{ restarbeit_id: projectId, title: "API Factory" }],
    },
  });
  const apiList = await apiFactory.createRestarbeitenV2ReadOnlyDataSource().listRestarbeitenV2("project-api");
  assert.equal(apiList[0].id, "project-api");
  assert.equal(apiList[0].kurztext, "API Factory");

  const emptyFactory = createRestarbeitenV2ReadOnlyDataSourceFactory();
  await assert.rejects(emptyFactory.createRestarbeitenV2ReadOnlyDataSource().listRestarbeitenV2("project-none"), /nicht angebunden|keine Lesebridge/);

  const diffFiles = execFileSync("git", ["diff", "--name-only"], {
    cwd: path.join(__dirname, "../.."),
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/restarbeiten/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/protokoll/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/main/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/preload/")), false);

  if (run) {
    run("Restarbeiten V2 ReadOnly-DataSource-Factory ist importierbar", () => undefined);
  }
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

  runRestarbeitenV2ReadOnlyDataSourceFactoryTests(run).then(() => {
    if (!process.exitCode) console.log("restarbeitenV2ReadOnlyDataSourceFactory.test.cjs passed");
  });
}

module.exports = { runRestarbeitenV2ReadOnlyDataSourceFactoryTests };
