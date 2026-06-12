const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { isUnexpectedProtokollDiff } = require("./_diffGuardAllowances.cjs");

async function runRestarbeitenV2LegacyReadBridgeTests(run) {
  const bridgePath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2LegacyReadBridge.js");
  const adapterPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2ReadOnlyAdapter.js");
  const routerPath = path.join(__dirname, "../../src/renderer/app/Router.js");

  const source = fs.readFileSync(bridgePath, "utf8");
  assert.equal(source.includes("ipc"), false);
  assert.equal(source.includes("db"), false);
  assert.equal(source.includes("localStorage"), false);
  assert.equal(source.includes("fetch"), false);
  assert.equal(source.includes("window"), false);
  assert.equal(source.includes("src/renderer/modules/restarbeiten/"), false);
  assert.equal(source.includes("src/renderer/modules/protokoll/"), false);
  assert.equal(source.includes("uiInspector"), false);

  const { createRestarbeitenV2LegacyReadBridge } = await importEsmFromFile(bridgePath);
  const { createRestarbeitenV2ReadOnlyAdapter } = await importEsmFromFile(adapterPath);

  assert.equal(typeof createRestarbeitenV2LegacyReadBridge, "function");

  const loadCalls = [];
  const bridge = createRestarbeitenV2LegacyReadBridge({
    loadRestarbeiten: async (projectId) => {
      loadCalls.push(projectId);
      return [
        {
          restarbeit_id: "LEG-100",
          lfd_nr: "R-100",
          title: "Legacy Bridge",
          description: "Haus C",
          location: "Haus C",
          state: "open",
          completion_note: "Meta BR",
          responsible_firm_name: "Firma Bridge",
          due_date: "2026-06-10",
          note: "Bridge Notiz",
          attachments: ["bridge.jpg"],
        },
      ];
    },
  });

  assert.equal(typeof bridge.loadLegacyRestarbeiten, "function");
  await assert.rejects(bridge.loadLegacyRestarbeiten(), /Projektkontext fehlt/);

  const legacyRows = await bridge.loadLegacyRestarbeiten("project-bridge");
  assert.deepEqual(loadCalls, ["project-bridge"]);
  assert.equal(Array.isArray(legacyRows), true);
  assert.equal(legacyRows.length, 1);
  assert.equal(legacyRows[0].restarbeit_id, "LEG-100");
  assert.equal(legacyRows[0].title, "Legacy Bridge");
  assert.equal(legacyRows[0].state, "open");
  assert.equal(legacyRows[0].attachments[0], "bridge.jpg");
  assert.equal(legacyRows[0].kurztext, undefined);

  const adapter = createRestarbeitenV2ReadOnlyAdapter({
    bridge,
  });
  const dtoList = await adapter.listRestarbeitenV2("project-bridge");
  assert.equal(dtoList[0].id, "LEG-100");
  assert.equal(dtoList[0].nummer, "R-100");
  assert.equal(dtoList[0].kurztext, "Legacy Bridge");
  assert.equal(dtoList[0].verortung, "Haus C");
  assert.equal(dtoList[0].status, "offen");
  assert.equal(dtoList[0].meta, "Meta BR");
  assert.equal(dtoList[0].notiz, "Bridge Notiz");
  assert.deepEqual(dtoList[0].fotos, ["bridge.jpg"]);

  const bridge2 = createRestarbeitenV2LegacyReadBridge({
    bridge: {
      listRestarbeiten: async (projectId) => [{ restarbeit_id: projectId, title: "Bridge List" }],
    },
  });
  const legacyRows2 = await bridge2.loadLegacyRestarbeiten("project-bridge-2");
  assert.equal(legacyRows2[0].title, "Bridge List");

  const bridge3 = createRestarbeitenV2LegacyReadBridge({
    api: {
      listRestarbeiten: async (projectId) => [{ restarbeit_id: projectId, title: "API List" }],
    },
  });
  const legacyRows3 = await bridge3.loadLegacyRestarbeiten("project-api");
  assert.equal(legacyRows3[0].title, "API List");

  const bridgeWithoutSource = createRestarbeitenV2LegacyReadBridge();
  await assert.rejects(bridgeWithoutSource.loadLegacyRestarbeiten("project-x"), /nicht angebunden/);

  assert.equal(typeof bridge.createRestarbeitV2, "undefined");
  assert.equal(typeof bridge.updateRestarbeitV2, "undefined");
  assert.equal(typeof bridge.deleteRestarbeitV2, "undefined");
  assert.equal(typeof bridge.saveRestarbeitV2, "undefined");
  assert.equal(typeof bridge.uploadRestarbeitV2Attachment, "undefined");

  const routerSource = fs.readFileSync(routerPath, "utf8");
  assert.equal(routerSource.includes("createRestarbeitenV2LegacyReadBridge"), false);

  const diffFiles = execFileSync("git", ["diff", "--name-only"], {
    cwd: path.join(__dirname, "../.."),
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  assert.equal(diffFiles.some(isUnexpectedProtokollDiff), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);
  const allowedRestarbeitenMainFiles = new Set([
    "src/main/db/database.js",
    "src/main/db/restarbeitenRepo.js",
    "src/main/db/schema.sql",
    "src/main/db/uiEditorLayoutOverridesRepo.js",
    "src/main/ipc/restarbeitenIpc.js",
    "src/main/ipc/uiEditorLayoutOverridesIpc.js",
    "src/main/main.js",
    "src/main/preload.js",
  ]);
  assert.equal(
    diffFiles.some((file) => file.startsWith("src/main/") && !allowedRestarbeitenMainFiles.has(file)),
    false
  );
  assert.equal(diffFiles.some((file) => file.startsWith("src/preload/")), false);

  if (run) {
    run("Restarbeiten V2 Legacy-Lese-Bridge ist importierbar", () => undefined);
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

  runRestarbeitenV2LegacyReadBridgeTests(run).then(() => {
    if (!process.exitCode) console.log("restarbeitenV2LegacyReadBridge.test.cjs passed");
  });
}

module.exports = { runRestarbeitenV2LegacyReadBridgeTests };
