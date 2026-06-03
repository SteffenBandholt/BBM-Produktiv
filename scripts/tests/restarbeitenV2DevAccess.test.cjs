const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRestarbeitenV2DevAccessTests(run) {
  const headerPath = path.join(__dirname, "../../src/renderer/ui/MainHeader.js");
  const moduleNavPath = path.join(__dirname, "../../src/renderer/app/modules/moduleNavigation.js");
  const headerSource = fs.readFileSync(headerPath, "utf8");
  const { getActiveProjectModuleNavigation } = await importEsmFromFile(moduleNavPath);

  await run("Restarbeiten V2: MainHeader enthaelt keinen DEV-Headerbutton mehr", () => {
    assert.equal(headerSource.includes('textContent = "Restarbeiten V2"'), false);
    assert.equal(headerSource.includes("showRestarbeitenV2Dev"), false);
    assert.equal(headerSource.includes('data-ui-v2-id", "restarbeitenv2.button"'), false);
    assert.equal(
      getActiveProjectModuleNavigation().some((entry) => String(entry?.moduleId || "").trim() === "restarbeitenv2"),
      false
    );
  });
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

  runRestarbeitenV2DevAccessTests(run).then(() => {
    if (!process.exitCode) console.log("restarbeitenV2DevAccess.test.cjs passed");
  });
}

module.exports = { runRestarbeitenV2DevAccessTests };
