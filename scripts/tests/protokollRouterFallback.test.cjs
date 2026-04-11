const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function runProtokollRouterFallbackTests(run) {
  await run("Protokoll Router-Fallback: showTops nutzt keinen Altpfad unter views", () => {
    const routerFile = path.join(__dirname, "../../src/renderer/app/Router.js");
    const source = fs.readFileSync(routerFile, "utf8");

    assert.equal(source.includes('../views/TopsScreen.js'), false);
    assert.equal(
      source.includes("resolveActiveModuleScreen(PROTOKOLL_MODULE_ID, PROTOKOLL_WORK_SCREEN_ID) ||"),
      true
    );
    assert.equal(source.includes("ProtokollTopsScreen"), true);
  });

  await run("Protokoll Style-Einstieg: TopsScreen nutzt eine modulnahe Style-Datei", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const styleFile = path.join(__dirname, "../../src/renderer/modules/protokoll/styles.js");
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const styleSource = fs.readFileSync(styleFile, "utf8");

    assert.equal(screenSource.includes("tops/styles/tops.css"), false);
    assert.equal(screenSource.includes('from "../styles.js"'), true);
    assert.equal(styleSource.includes("tops/styles/tops.css"), true);
  });

  await run("Protokoll Header-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const headerFile = path.join(__dirname, "../../src/renderer/modules/protokoll/TopsHeader.js");
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const headerSource = fs.readFileSync(headerFile, "utf8");

    assert.equal(screenSource.includes("tops/components/TopsHeader.js"), false);
    assert.equal(screenSource.includes('from "../TopsHeader.js"'), true);
    assert.equal(headerSource.includes("tops/components/TopsHeader.js"), true);
  });

  await run("Protokoll Listen-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const listFile = path.join(__dirname, "../../src/renderer/modules/protokoll/TopsList.js");
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const listSource = fs.readFileSync(listFile, "utf8");

    assert.equal(screenSource.includes("tops/components/TopsList.js"), false);
    assert.equal(screenSource.includes('from "../TopsList.js"'), true);
    assert.equal(listSource.includes("tops/components/TopsList.js"), true);
  });
}

module.exports = { runProtokollRouterFallbackTests };
