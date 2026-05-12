const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function _loadModule() {
  const modulePath = path.join(__dirname, "../../src/renderer/layoutTools/autoTableLayout.mjs");
  return import(pathToFileURL(modulePath).href);
}

async function runLayoutToolsAutoDetectionTests(run) {
  const mod = await _loadModule();

  await run("layout auto detection: build channel is DEV only", () => {
    assert.equal(mod.isDevLayoutBuildChannel("DEV"), true);
    assert.equal(mod.isDevLayoutBuildChannel("dev"), true);
    assert.equal(mod.isDevLayoutBuildChannel("STABLE"), false);
    assert.equal(mod.isDevLayoutBuildChannel(""), false);
  });

  await run("layout auto detection: simple table descriptor uses mode + class", () => {
    const def = mod.buildAutoLayoutSurfaceDescriptor({
      mode: "todo",
      tableClassName: "todoTable",
      headerTexts: ["TOP", "Kurztext", "Status"],
      columnCount: 3,
    });

    assert.equal(def.surfaceKey, "print.todo.todoTable");
    assert.equal(def.surfaceLabel, "Todo Table");
    assert.deepEqual(def.zones.map((zone) => zone.key), ["top", "kurztext", "status"]);
    assert.deepEqual(def.zones.map((zone) => zone.label), ["TOP", "Kurztext", "Status"]);
  });

  await run("layout auto detection: class-based fallback derives stable zone labels", () => {
    const def = mod.buildAutoLayoutSurfaceDescriptor({
      mode: "preview",
      tableClassName: "todoTable",
      headerTexts: ["", ""],
      colClasses: ["todoTitle", "todoStatus"],
      columnCount: 2,
    });

    assert.equal(def.surfaceKey, "print.preview.todoTable");
    assert.deepEqual(def.zones.map((zone) => zone.key), ["todo_title", "todo_status"]);
    assert.deepEqual(def.zones.map((zone) => zone.label), ["Todo Title", "Todo Status"]);
  });

  await run("layout auto detection: candidate filter keeps manual tables out", () => {
    assert.equal(
      mod.isSimpleAutoLayoutTableCandidate({
        hasTheadTh: true,
        hasColgroupCol: false,
        hasNestedTable: false,
        hasManualMarkers: false,
        tableClassName: "todoTable",
      }),
      true
    );
    assert.equal(
      mod.isSimpleAutoLayoutTableCandidate({
        hasTheadTh: true,
        hasColgroupCol: false,
        hasNestedTable: false,
        hasManualMarkers: true,
        tableClassName: "todoTable",
      }),
      false
    );
    assert.equal(
      mod.isSimpleAutoLayoutTableCandidate({
        hasTheadTh: false,
        hasColgroupCol: false,
        hasNestedTable: false,
        hasManualMarkers: false,
        tableClassName: "todoTable",
      }),
      false
    );
  });
}

module.exports = { runLayoutToolsAutoDetectionTests };
