const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRestarbeitenV2DataSourceTests(run) {
  const dataSourcePath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2DataSource.js");
  const mapperPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2Mapper.js");

  const dataSourceSource = fs.readFileSync(dataSourcePath, "utf8");
  assert.equal(dataSourceSource.includes("ipcRenderer"), false);
  assert.equal(dataSourceSource.includes("indexedDB"), false);
  assert.equal(dataSourceSource.includes("localStorage"), false);
  assert.equal(dataSourceSource.includes("fetch("), false);
  assert.equal(dataSourceSource.includes("src/renderer/modules/restarbeiten/"), false);

  const mapperSource = fs.readFileSync(mapperPath, "utf8");
  assert.equal(mapperSource.includes("ipcRenderer"), false);
  assert.equal(mapperSource.includes("indexedDB"), false);
  assert.equal(mapperSource.includes("localStorage"), false);
  assert.equal(mapperSource.includes("src/renderer/modules/restarbeiten/"), false);

  const { createRestarbeitenV2DataSource } = await importEsmFromFile(dataSourcePath);
  const {
    normalizeRestarbeitV2Dto,
    normalizeRestarbeitV2List,
    createEmptyRestarbeitV2Draft,
    normalizeRestarbeitV2Patch,
  } = await importEsmFromFile(mapperPath);
  const { createRestarbeitenV2FakeDataSource, createRestarbeitenV2ReadOnlyDataSource } = await importEsmFromFile(dataSourcePath);

  assert.equal(typeof createRestarbeitenV2DataSource, "function");
  assert.equal(typeof createRestarbeitenV2FakeDataSource, "function");
  assert.equal(typeof createRestarbeitenV2ReadOnlyDataSource, "function");
  const dataSource = createRestarbeitenV2DataSource();
  assert.equal(typeof dataSource.listRestarbeitenV2, "function");
  assert.equal(typeof dataSource.createRestarbeitV2, "function");
  assert.equal(typeof dataSource.updateRestarbeitV2, "function");
  assert.equal(typeof dataSource.deleteRestarbeitV2, "function");
  assert.equal(typeof dataSource.listRestarbeitV2Attachments, "function");

  const listPromise = dataSource.listRestarbeitenV2("project-1");
  const createPromise = dataSource.createRestarbeitV2("project-1", {});
  const updatePromise = dataSource.updateRestarbeitV2("r-1", {});
  const deletePromise = dataSource.deleteRestarbeitV2("r-1");
  const attachmentsPromise = dataSource.listRestarbeitV2Attachments("r-1");

  for (const promise of [listPromise, createPromise, updatePromise, deletePromise, attachmentsPromise]) {
    assert.equal(typeof promise?.then, "function");
  }

  await assert.rejects(dataSource.listRestarbeitenV2(), /projectId fehlt|noch nicht angebunden/);
  await assert.rejects(listPromise, /noch nicht angebunden/);
  await assert.rejects(createPromise, /noch nicht angebunden/);
  await assert.rejects(updatePromise, /noch nicht angebunden/);
  await assert.rejects(deletePromise, /noch nicht angebunden/);
  await assert.rejects(attachmentsPromise, /noch nicht angebunden/);

  const fakeDataSource = createRestarbeitenV2FakeDataSource();
  const fakeList = await fakeDataSource.listRestarbeitenV2("dev-restarbeiten-v2");
  assert.equal(Array.isArray(fakeList), true);
  assert.equal(fakeList.length, 3);
  assert.equal(fakeList[0].id, "DS-001");
  assert.equal(fakeList[0].status, "offen");
  assert.equal(fakeList[1].id, "DS-002");
  assert.equal(fakeList[1].status, "erledigt");
  assert.equal(fakeList[2].id, "DS-003");
  assert.equal(fakeList[2].status, "offen");
  const fakeCreatePromise = fakeDataSource.createRestarbeitV2("x", {});
  const fakeUpdatePromise = fakeDataSource.updateRestarbeitV2("x", {});
  const fakeDeletePromise = fakeDataSource.deleteRestarbeitV2("x");
  const fakeAttachmentsPromise = fakeDataSource.listRestarbeitV2Attachments("x");
  assert.equal(typeof fakeCreatePromise?.then, "function");
  assert.equal(typeof fakeUpdatePromise?.then, "function");
  assert.equal(typeof fakeDeletePromise?.then, "function");
  assert.equal(typeof fakeAttachmentsPromise?.then, "function");
  await assert.rejects(fakeCreatePromise, /fake create nicht verfuegbar|noch nicht angebunden/);
  await assert.rejects(fakeUpdatePromise, /fake update nicht verfuegbar|noch nicht angebunden/);
  await assert.rejects(fakeDeletePromise, /fake delete nicht verfuegbar|noch nicht angebunden/);
  assert.deepEqual(await fakeAttachmentsPromise, []);

  const readOnlyDataSource = createRestarbeitenV2ReadOnlyDataSource({
    loadLegacyRestarbeiten: async (projectId) => [{ restarbeit_id: projectId, title: "RO" }],
  });
  const roList = await readOnlyDataSource.listRestarbeitenV2("project-ro");
  assert.equal(roList[0].id, "project-ro");
  assert.equal(roList[0].kurztext, "RO");
  assert.throws(() => readOnlyDataSource.createRestarbeitV2("project-ro", {}), /kein Erstellen/);

  const dto = normalizeRestarbeitV2Dto({
    id: "r-1",
    nummer: "R-001",
    kurztext: "Kurz",
    langtext: "Lang",
    verortung: "Haus A",
    status: "unbekannt",
    meta: "DEV",
    notiz: "Notiz",
    fotos: ["f1"],
    responsibleFirmId: "f-1",
    responsibleFirmName: "Firma A",
    dueDate: "2026-05-29",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-02",
    completedAt: null,
  });
  assert.equal(dto.id, "r-1");
  assert.equal(dto.nummer, "R-001");
  assert.equal(dto.kurztext, "Kurz");
  assert.equal(dto.langtext, "Lang");
  assert.equal(dto.verortung, "Haus A");
  assert.equal(dto.status, "offen");
  assert.equal(dto.meta, "DEV");
  assert.equal(dto.notiz, "Notiz");
  assert.deepEqual(dto.fotos, ["f1"]);
  assert.equal(dto.responsibleFirmId, "f-1");
  assert.equal(dto.responsibleFirmName, "Firma A");
  assert.equal(dto.dueDate, "2026-05-29");
  assert.equal(dto.createdAt, "2026-05-01");
  assert.equal(dto.updatedAt, "2026-05-02");
  assert.equal(dto.completedAt, null);

  const list = normalizeRestarbeitV2List([dto, { id: "r-2", status: "erledigt" }]);
  assert.equal(Array.isArray(list), true);
  assert.equal(list.length, 2);
  assert.equal(list[1].status, "erledigt");

  const draft = createEmptyRestarbeitV2Draft();
  assert.equal(draft.kurztext, "");
  assert.equal(draft.langtext, "");
  assert.equal(draft.verortung, "");
  assert.equal(draft.status, "offen");
  assert.equal(draft.meta, "");
  assert.equal(draft.notiz, "");

  const patch = normalizeRestarbeitV2Patch({
    kurztext: "Neu",
    langtext: "Lang",
    verortung: "Ort",
    status: "erledigt",
    meta: "M",
    notiz: "N",
    ignored: "x",
  });
  assert.deepEqual(Object.keys(patch).sort(), ["kurztext", "langtext", "meta", "notiz", "status", "verortung"]);
  assert.equal(patch.status, "erledigt");
  assert.equal(patch.ignored, undefined);

  const diffFiles = execFileSync("git", ["diff", "--name-only"], {
    cwd: path.join(__dirname, "../.."),
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/protokoll/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);

  if (run) {
    run("Restarbeiten V2 DataSource-Stub ist dokumentiert und importierbar", () => undefined);
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

  runRestarbeitenV2DataSourceTests(run).then(() => {
    if (!process.exitCode) console.log("restarbeitenV2DataSource.test.cjs passed");
  });
}

module.exports = { runRestarbeitenV2DataSourceTests };
