const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRestarbeitenV2ReadOnlyAdapterTests(run) {
  const adapterPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2ReadOnlyAdapter.js");
  const mapperPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2Mapper.js");

  const source = fs.readFileSync(adapterPath, "utf8");
  assert.equal(source.includes("ipc"), false);
  assert.equal(source.includes("db"), false);
  assert.equal(source.includes("localStorage"), false);
  assert.equal(source.includes("fetch"), false);
  assert.equal(source.includes("src/renderer/modules/restarbeiten/"), false);
  assert.equal(source.includes("src/renderer/modules/protokoll/"), false);
  assert.equal(source.includes("uiInspector"), false);

  const {
    createRestarbeitenV2ReadOnlyAdapter,
  } = await importEsmFromFile(adapterPath);
  const {
    normalizeRestarbeitV2Dto,
  } = await importEsmFromFile(mapperPath);

  assert.equal(typeof createRestarbeitenV2ReadOnlyAdapter, "function");

  const legacyCalls = [];
  const adapter = createRestarbeitenV2ReadOnlyAdapter({
    loadLegacyRestarbeiten: async (projectId) => {
      legacyCalls.push(projectId);
      return [
        {
          restarbeit_id: "LEG-1",
          number: "R-201",
          title: "Legacy offen",
          location: "Haus A",
          state: "open",
          completion_note: "Legacy Meta",
          note: "Legacy Notiz",
          attachments: ["a.jpg"],
        },
        {
          restarbeit_id: "LEG-2",
          lfd_nr: "R-202",
          kurz_text: "Legacy erledigt",
          ort: "Wohnung 2",
          status: "done",
        },
      ];
    },
  });

  assert.equal(typeof adapter.listRestarbeitenV2, "function");
  assert.equal(typeof adapter.createRestarbeitV2, "function");
  assert.equal(typeof adapter.updateRestarbeitV2, "function");
  assert.equal(typeof adapter.deleteRestarbeitV2, "function");
  assert.equal(typeof adapter.listRestarbeitV2Attachments, "function");

  await assert.rejects(adapter.listRestarbeitenV2(), /projectId/);

  const dtoList = await adapter.listRestarbeitenV2("project-123");
  assert.deepEqual(legacyCalls, ["project-123"]);
  assert.equal(Array.isArray(dtoList), true);
  assert.equal(dtoList.length, 2);
  assert.equal(dtoList[0].id, "LEG-1");
  assert.equal(dtoList[0].nummer, "R-201");
  assert.equal(dtoList[0].kurztext, "Legacy offen");
  assert.equal(dtoList[0].verortung, "Haus A");
  assert.equal(dtoList[0].status, "offen");
  assert.equal(dtoList[0].meta, "Legacy Meta");
  assert.equal(dtoList[0].notiz, "Legacy Notiz");
  assert.deepEqual(dtoList[0].fotos, ["a.jpg"]);
  assert.equal(dtoList[1].id, "LEG-2");
  assert.equal(dtoList[1].nummer, "R-202");
  assert.equal(dtoList[1].kurztext, "Legacy erledigt");
  assert.equal(dtoList[1].verortung, "Wohnung 2");
  assert.equal(dtoList[1].status, "erledigt");

  assert.equal(normalizeRestarbeitV2Dto({ restarbeit_id: "X", title: "Y" }).id, "X");

  assert.throws(() => adapter.createRestarbeitV2("project-123", {}), /kein Erstellen/);
  assert.throws(() => adapter.updateRestarbeitV2("id-1", {}), /kein Aktualisieren/);
  assert.throws(() => adapter.deleteRestarbeitV2("id-1"), /kein Löschen/);

  const attachments = await adapter.listRestarbeitV2Attachments("id-1");
  assert.deepEqual(attachments, []);

  const diffFiles = execFileSync("git", ["diff", "--name-only"], {
    cwd: path.join(__dirname, "../.."),
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/protokoll/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);
  const allowedRestarbeitenMainFiles = new Set([
    "src/main/db/database.js",
    "src/main/db/restarbeitenRepo.js",
    "src/main/ipc/restarbeitenIpc.js",
    "src/main/preload.js",
  ]);
  assert.equal(
    diffFiles.some((file) => file.startsWith("src/main/") && !allowedRestarbeitenMainFiles.has(file)),
    false
  );
  assert.equal(diffFiles.some((file) => file.startsWith("src/preload/")), false);

  if (run) {
    run("Restarbeiten V2 ReadOnly-Adapter ist importierbar", () => undefined);
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

  runRestarbeitenV2ReadOnlyAdapterTests(run).then(() => {
    if (!process.exitCode) console.log("restarbeitenV2ReadOnlyAdapter.test.cjs passed");
  });
}

module.exports = { runRestarbeitenV2ReadOnlyAdapterTests };
