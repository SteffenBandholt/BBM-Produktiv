const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRestarbeitenV2MapperTests(run) {
  const mapperPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2Mapper.js");
  const screenPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/RestarbeitenV2Screen.js");

  const source = fs.readFileSync(mapperPath, "utf8");
  assert.equal(source.includes("ipcRenderer"), false);
  assert.equal(source.includes("indexedDB"), false);
  assert.equal(source.includes("localStorage"), false);
  assert.equal(source.includes("document."), false);
  assert.equal(source.includes("window."), false);
  assert.equal(source.includes("src/renderer/modules/restarbeiten/"), false);
  assert.equal(source.includes("src/renderer/modules/protokoll/"), false);
  assert.equal(source.includes("uiInspector"), false);

  const screenSource = fs.readFileSync(screenPath, "utf8");
  assert.equal(screenSource.includes("normalizeRestarbeitV2List"), true);

  const {
    normalizeRestarbeitV2Dto,
    normalizeRestarbeitV2List,
    createEmptyRestarbeitV2Draft,
    normalizeRestarbeitV2Patch,
    normalizeRestarbeitV2Status,
    normalizeRestarbeitV2Fotos,
    mapLegacyRestarbeitToV2Dto,
  } = await importEsmFromFile(mapperPath);

  assert.equal(typeof normalizeRestarbeitV2Dto, "function");
  assert.equal(typeof normalizeRestarbeitV2List, "function");
  assert.equal(typeof createEmptyRestarbeitV2Draft, "function");
  assert.equal(typeof normalizeRestarbeitV2Patch, "function");
  assert.equal(typeof normalizeRestarbeitV2Status, "function");
  assert.equal(typeof normalizeRestarbeitV2Fotos, "function");
  assert.equal(typeof mapLegacyRestarbeitToV2Dto, "function");

  const standardDto = normalizeRestarbeitV2Dto({
    id: "r-1",
    nummer: "R-001",
    kurztext: "Kurz",
    langtext: "Lang",
    verortung: "Haus A",
    status: "erledigt",
    meta: "M",
    notiz: "N",
    fotos: ["a", "b"],
    responsibleFirmId: "f-1",
    responsibleFirmName: "Firma A",
    dueDate: "2026-05-29",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-02",
    completedAt: "2026-05-03",
  });
  assert.deepEqual(Object.keys(standardDto).sort(), [
    "completedAt",
    "createdAt",
    "dueDate",
    "fotos",
    "id",
    "kurztext",
    "langtext",
    "meta",
    "notiz",
    "nummer",
    "responsibleFirmId",
    "responsibleFirmName",
    "status",
    "updatedAt",
    "verortung",
  ]);
  assert.equal(standardDto.id, "r-1");
  assert.equal(standardDto.status, "erledigt");
  assert.deepEqual(standardDto.fotos, ["a", "b"]);

  const legacyDto = mapLegacyRestarbeitToV2Dto({
    restarbeit_id: "legacy-1",
    lfd_nr: "R-003",
    title: "Legacy Kurz",
    kurz_text: "Kurztext",
    description: "Langtext",
    lang_text: "Langtext 2",
    ort: "Raum 1",
    state: "completed",
    completion_note: "Meta alt",
    note_meta: "Meta neu",
    note: "Notiz alt",
    attachments: [{ path: "foto-1.jpg" }],
    responsible_firm_id: "f-legacy",
    responsible_firm_name: "Firma Legacy",
    due_date: "2026-06-01",
    created_at: "2026-05-01",
    updated_at: "2026-05-02",
    completed_at: "2026-05-03",
  });
  assert.equal(legacyDto.id, "legacy-1");
  assert.equal(legacyDto.nummer, "R-003");
  assert.equal(legacyDto.kurztext, "Legacy Kurz");
  assert.equal(legacyDto.langtext, "Langtext");
  assert.equal(legacyDto.verortung, "Raum 1");
  assert.equal(legacyDto.status, "erledigt");
  assert.equal(legacyDto.meta, "Meta alt");
  assert.equal(legacyDto.notiz, "Notiz alt");
  assert.deepEqual(legacyDto.fotos, ["foto-1.jpg"]);
  assert.equal(legacyDto.responsibleFirmId, "f-legacy");
  assert.equal(legacyDto.responsibleFirmName, "Firma Legacy");
  assert.equal(legacyDto.dueDate, "2026-06-01");
  assert.equal(legacyDto.createdAt, "2026-05-01");
  assert.equal(legacyDto.updatedAt, "2026-05-02");
  assert.equal(legacyDto.completedAt, "2026-05-03");

  const numberDto = normalizeRestarbeitV2Dto({
    restarbeit_id: "legacy-2",
    number: "R-002",
    title: "Legacy Nummer",
  });
  assert.equal(numberDto.nummer, "R-002");

  assert.equal(normalizeRestarbeitV2Status("open"), "offen");
  assert.equal(normalizeRestarbeitV2Status("todo"), "offen");
  assert.equal(normalizeRestarbeitV2Status("neu"), "offen");
  assert.equal(normalizeRestarbeitV2Status("done"), "erledigt");
  assert.equal(normalizeRestarbeitV2Status("closed"), "erledigt");
  assert.equal(normalizeRestarbeitV2Status("completed"), "erledigt");
  assert.equal(normalizeRestarbeitV2Status("erledigt"), "erledigt");
  assert.equal(normalizeRestarbeitV2Status("unbekannt"), "offen");
  assert.equal(normalizeRestarbeitV2Status(null), "offen");

  assert.deepEqual(normalizeRestarbeitV2Fotos(null), []);
  assert.deepEqual(normalizeRestarbeitV2Fotos(undefined), []);
  assert.deepEqual(normalizeRestarbeitV2Fotos(["a", { path: "b" }, null]), ["a", "b"]);
  assert.deepEqual(normalizeRestarbeitV2Fotos("x"), []);

  const listFromArray = normalizeRestarbeitV2List([legacyDto, { id: "x", status: "todo" }]);
  assert.equal(Array.isArray(listFromArray), true);
  assert.equal(listFromArray.length, 2);
  assert.equal(listFromArray[1].status, "offen");
  assert.deepEqual(normalizeRestarbeitV2List({}), []);

  const draft = createEmptyRestarbeitV2Draft();
  assert.deepEqual(Object.keys(draft).sort(), ["kurztext", "langtext", "meta", "notiz", "status", "verortung"]);
  assert.equal(draft.status, "offen");

  const patch = normalizeRestarbeitV2Patch({
    kurztext: "K",
    langtext: "L",
    verortung: "V",
    status: "done",
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
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/restarbeiten/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/protokoll/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);

  if (run) {
    run("Restarbeiten V2 Mapper ist robust normalisiert", () => undefined);
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

  runRestarbeitenV2MapperTests(run).then(() => {
    if (!process.exitCode) console.log("restarbeitenV2Mapper.test.cjs passed");
  });
}

module.exports = { runRestarbeitenV2MapperTests };
