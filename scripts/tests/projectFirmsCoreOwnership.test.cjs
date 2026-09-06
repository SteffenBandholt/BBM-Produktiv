const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function runProjectFirmsCoreOwnershipTests(run) {
  await run("Paket 3: Projektfirmen sind Core-Komposition und kein Fachmodul", () => {
    const core = require(path.join(process.cwd(), "src/main/core/projectFirmsCore.js"));
    assert.equal(typeof core.createProjectFirmsService, "function");
    assert.equal(typeof core.registerCoreProjectFirmsIpc, "function");

    const registry = JSON.parse(read("src/main/module-registry.json"));
    assert.equal(Object.prototype.hasOwnProperty.call(registry.modules || {}, "projectFirms"), false);
    assert.equal((registry.canonicalModuleIds || []).includes("projectFirms"), false);
  });

  await run("Paket 3: Main registriert Projektfirmen im Core-Pfad vor Fachmodul-IPCs", () => {
    const source = read("src/main/main.js");
    assert.match(source, /registerCoreProjectFirmsIpc\(\)/);
    assert.equal(source.includes('require("./ipc/projectFirmsIpc")'), false);
    const coreIndex = source.indexOf("registerCoreProjectFirmsIpc();");
    const fachIndex = source.indexOf("registerActiveModuleIpcs({");
    assert.ok(coreIndex >= 0 && fachIndex > coreIndex);
  });

  await run("Paket 3: Projektworkspace fuehrt Firmen im Projekt als Core-Aktion ohne moduleId", () => {
    const routerSource = read("src/renderer/app/Router.js");
    const workspaceSource = read("src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js");
    assert.equal(routerSource.includes('moduleId: "projectFirms"'), false);
    assert.equal(workspaceSource.includes('normalizedModuleId === "projectFirms"'), false);
    assert.match(workspaceSource, /coreActionId:\s*"projectFirms"/);
    assert.match(workspaceSource, /openCoreProjectAction/);
  });

  await run("Paket 3: Projektfirmen bleiben ohne aktives Fachmodul erreichbar", async () => {
    const source = read("src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js");
    assert.match(source, /DEFAULT_CORE_PROJECT_ACTIONS/);
    assert.match(source, /showProjectFirms/);
    assert.equal(source.includes("isModuleActive"), false);
  });

  await run("Paket 3: bestehende Projektfirmenlogik bleibt singulaer", () => {
    const ipcSource = read("src/main/ipc/projectFirmsIpc.js");
    const coreSource = read("src/main/core/projectFirmsCore.js");
    assert.match(coreSource, /registerProjectFirmsIpc/);
    assert.match(coreSource, /createProjectFirmsService/);
    assert.equal(coreSource.includes("ipcMain.handle"), false);
    assert.equal(coreSource.includes("projectFirmsRepo"), false);
    assert.match(ipcSource, /projectFirms:listByProject/);
  });
}

module.exports = { runProjectFirmsCoreOwnershipTests };
