const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function runHomeViewTests(run) {
  const homeViewSource = read("src/renderer/views/HomeView.js");

  await run("HomeView: Verlauf zeigt keine technische Projekt-ID", () => {
    assert.equal(homeViewSource.includes("Zuletzt geöffnetes Projekt #${lastProjectId}"), false);
    assert.equal(homeViewSource.includes('label: this.lastProject ? projectLabel(this.lastProject) : "Noch kein Projekt geöffnet"'), true);
    assert.equal(homeViewSource.includes("ensureActiveModuleAccess"), true);
  });

  await run("HomeView: gespeicherte ID wird zum tatsächlichen Projektnamen aufgelöst", async () => {
    const { default: HomeView } = await importEsmFromFile(path.join(process.cwd(), "src/renderer/views/HomeView.js"));
    const oldWindow = global.window;
    global.window = {
      localStorage: { getItem: () => "project-uuid-17", removeItem: () => assert.fail("known project must stay stored") },
      bbmDb: { projectsList: async () => ({ list: [{ id: "project-uuid-17", project_number: "24-017", short: "Schulbau" }] }) },
    };
    try {
      const view = new HomeView();
      view._renderLastProjectTile = () => {};
      await view._loadLastProjectTile();
      assert.equal(view.lastProjectId, "project-uuid-17");
      assert.equal(view.lastProject.short, "Schulbau");
    } finally {
      global.window = oldWindow;
    }
  });

  await run("HomeView: leere oder veraltete Historie bleibt kundenverständlich leer", async () => {
    const { default: HomeView } = await importEsmFromFile(path.join(process.cwd(), "src/renderer/views/HomeView.js"));
    const oldWindow = global.window;
    let removed = false;
    global.window = {
      localStorage: { getItem: () => "stale-uuid", removeItem: () => { removed = true; } },
      bbmDb: { projectsList: async () => ({ list: [] }) },
    };
    try {
      const view = new HomeView();
      view._renderLastProjectTile = () => {};
      await view._loadLastProjectTile();
      assert.equal(view.lastProjectId, null);
      assert.equal(view.lastProject, null);
      assert.equal(removed, true);
    } finally {
      global.window = oldWindow;
    }
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
