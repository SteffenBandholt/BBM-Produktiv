const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function runHomeViewTests(run) {
  const homeViewSource = read("src/renderer/views/HomeView.js");

  await run("HomeView: zentrales Icon ist sichtbar verkleinert", () => {
    assert.equal(homeViewSource.includes('bgImg.style.width = "clamp(55px, 7vw, 105px)";'), true);
    assert.equal(homeViewSource.includes('bgImg.style.maxWidth = "17.5%";'), true);
    assert.equal(homeViewSource.includes('bgImg.src = "./assets/icon-BBM.png";'), true);
    assert.equal(homeViewSource.includes("ensureActiveModuleAccess"), true);
  });

  await run("HomeView: letzter Projektstart fragt zuerst den Modulstatus ab", async () => {
    const { default: HomeView } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/views/HomeView.js")
    );

    const calls = [];
    const view = new HomeView({
      router: {
        async ensureActiveModuleAccess(options) {
          calls.push({ type: "ensure", options });
        },
        async showProjects() {
          calls.push({ type: "showProjects" });
        },
        currentView: {
          async openProjectById(projectId) {
            calls.push({ type: "open", projectId });
            return false;
          },
        },
      },
    });
    view.lastProjectId = "17";
    view._loadLastProjectTile = async () => {
      calls.push({ type: "reload" });
    };

    await view._openLastProject();

    assert.deepEqual(calls, [
      { type: "ensure", options: { force: true } },
      { type: "showProjects" },
      { type: "open", projectId: "17" },
      { type: "reload" },
    ]);
  });
}

module.exports = { runHomeViewTests };
