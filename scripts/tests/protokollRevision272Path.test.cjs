const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

async function runProtokollRevision272PathTests(run) {
  const moduleCatalog = read("src/renderer/app/modules/moduleCatalog.js");
  const router = read("src/renderer/app/Router.js");
  const moduleIndex = read("src/renderer/modules/protokoll/index.js");
  const integrationView = read(
    "src/renderer/modules/protokoll/screens/TopsScreenIntegrationView.js"
  );
  const compatibilityView = read("src/renderer/views/TopsScreen.js");

  await run("Protokoll #272: Modulkatalog und Router nutzen genau den Moduleinstieg", () => {
    assert.equal(moduleCatalog.includes('from "../../modules/protokoll/index.js"'), true);
    assert.equal(router.includes('from "../modules/protokoll/index.js"'), true);
    assert.equal(moduleCatalog.includes("views/TopsScreen.js"), false);
    assert.equal(router.includes("views/TopsScreen.js"), false);
  });

  await run("Protokoll #272: Moduleinstieg fuehrt zum modulnahen Arbeitsscreen", () => {
    assert.equal(
      moduleIndex.includes('import TopsScreen from "./screens/TopsScreenIntegrationView.js"'),
      true
    );
    assert.equal(integrationView.includes('import TopsScreen from "./TopsScreen.js"'), true);
    assert.equal(integrationView.includes("extends TopsScreen"), true);
  });

  await run("Protokoll #272: views/TopsScreen bleibt reiner Kompatibilitaetspfad", () => {
    assert.equal(
      compatibilityView.includes(
        'export { default } from "../modules/protokoll/screens/TopsScreen.js"'
      ),
      true
    );
    assert.equal(compatibilityView.includes("class TopsScreen"), false);
  });
}

module.exports = { runProtokollRevision272PathTests };
