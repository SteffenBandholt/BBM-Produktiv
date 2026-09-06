const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runModuleRoutingNavigationTests(run) {
  const runtime = await importEsmFromFile(
    path.join(process.cwd(), "src/renderer/app/modules/moduleRouteRuntime.js")
  );

  await run("Paket 2: aktives Modulset ist Schnittmenge aus Produkt/Build und Lizenz", () => {
    assert.deepEqual(
      runtime.deriveActiveModuleIds(
        ["protokoll", "restarbeiten", "rechnung"],
        ["rechnung", "sigeko", "rechnung", "protokoll"]
      ),
      ["rechnung", "protokoll"]
    );
  });

  await run("Paket 2: global/project/hybrid werden generisch nach Kontext unterschieden", () => {
    assert.equal(runtime.moduleSupportsScope({ moduleType: "global" }, "global"), true);
    assert.equal(runtime.moduleSupportsScope({ moduleType: "global" }, "project"), false);
    assert.equal(runtime.moduleSupportsScope({ moduleType: "project" }, "project"), true);
    assert.equal(runtime.moduleSupportsScope({ moduleType: "project" }, "global"), false);
    assert.equal(runtime.moduleSupportsScope({ moduleType: "hybrid" }, "global"), true);
    assert.equal(runtime.moduleSupportsScope({ moduleType: "hybrid" }, "project"), true);
  });

  await run("Paket 2: Navigation wird nur aus uebergebenem aktivem Deskriptor-Katalog erzeugt", () => {
    class ScreenA {}
    class ScreenB {}
    const activeCatalog = [
      {
        moduleId: "a",
        moduleType: "hybrid",
        screens: { work: ScreenA },
        navigation: {
          global: [{ key: "a-global", label: "A", workScreenId: "work" }],
          project: [{ key: "a-project", label: "A Projekt", workScreenId: "work" }],
        },
      },
    ];
    const inactiveDescriptor = {
      moduleId: "b",
      moduleType: "global",
      screens: { work: ScreenB },
      navigation: { global: [{ key: "b", label: "B", workScreenId: "work" }] },
    };
    assert.deepEqual(
      runtime.deriveModuleNavigationByScope(activeCatalog, "global").map((entry) => entry.moduleId),
      ["a"]
    );
    assert.equal(
      runtime.deriveModuleNavigationByScope([...activeCatalog, inactiveDescriptor], "global").some((entry) => entry.moduleId === "b"),
      true
    );
  });

  await run("Paket 2: generischer Oeffner startet globale und hybride Module ohne Projekt", async () => {
    class GlobalScreen { constructor(args) { this.args = args; } }
    const calls = [];
    const descriptor = {
      moduleId: "demo",
      moduleType: "hybrid",
      screens: { work: GlobalScreen },
      navigation: { global: [{ key: "demo", label: "Demo", workScreenId: "work", section: "demo" }] },
    };
    const opened = await runtime.openModuleEntry({
      moduleEntry: descriptor,
      scope: "global",
      navigationKey: "demo",
      router: { name: "router" },
      show: async (screen, options) => calls.push({ screen, options }),
    });
    assert.equal(opened, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].screen.args.moduleId, "demo");
    assert.equal(calls[0].options.section, "demo");
  });

  await run("Paket 2: Projektmodule und Hybridmodule verlangen beim Projekteinstieg Projektkontext", async () => {
    class ProjectScreen { constructor(args) { this.args = args; } }
    const descriptor = {
      moduleId: "demo-project",
      moduleType: "hybrid",
      screens: { work: ProjectScreen },
      navigation: { project: [{ key: "demo", label: "Demo", workScreenId: "work" }] },
    };
    let shown = false;
    assert.equal(await runtime.openModuleEntry({ moduleEntry: descriptor, scope: "project", show: async () => { shown = true; } }), false);
    assert.equal(shown, false);
    assert.equal(await runtime.openModuleEntry({ moduleEntry: descriptor, scope: "project", projectId: "17", project: { id: "17" }, show: async (screen) => { shown = screen.args.projectId === "17"; } }), true);
    assert.equal(shown, true);
  });

  await run("Paket 2: Moduladapter ersetzt Fachsonderfall im generischen Core-Oeffner", async () => {
    const calls = [];
    const descriptor = {
      moduleId: "adapter-module",
      moduleType: "project",
      navigation: { project: [] },
      routing: {
        project: async ({ projectId, options }) => {
          calls.push({ projectId, options });
          return { ok: true, target: "adapter" };
        },
      },
    };
    const result = await runtime.openModuleEntry({
      moduleEntry: descriptor,
      scope: "project",
      projectId: "42",
      options: { marker: true },
    });
    assert.deepEqual(result, { ok: true, target: "adapter" });
    assert.deepEqual(calls, [{ projectId: "42", options: { marker: true } }]);
  });

  await run("Paket 2: Core-Router enthaelt keinen Modul-ID-Sonderfall fuer Rechnung oder Protokoll-Einstieg", () => {
    const routerSource = fs.readFileSync(path.join(process.cwd(), "src/renderer/app/Router.js"), "utf8");
    const projectStart = routerSource.indexOf("async openProjectModule(");
    const globalStart = routerSource.indexOf("async openGlobalModule(");
    const workspaceStart = routerSource.indexOf("_getProjectWorkspaceModules()", globalStart);
    assert.ok(projectStart >= 0 && globalStart > projectStart && workspaceStart > globalStart);
    const genericRoutingBlock = routerSource.slice(projectStart, workspaceStart);
    assert.equal(genericRoutingBlock.includes("normalizedModuleId === PROTOKOLL_MODULE_ID"), false);
    assert.equal(genericRoutingBlock.includes('moduleId === "rechnung"'), false);
    assert.match(genericRoutingBlock, /openModuleEntry/);
  });

  await run("Paket 2: Rechnung deklariert globale und projektbezogene Navigation als Hybridmodul", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/renderer/modules/rechnungen/index.js"), "utf8");
    assert.match(source, /moduleType:\s*"hybrid"/);
    assert.match(source, /global:\s*Object\.freeze\(\[buildRechnungNavigationEntry\(\)\]\)/);
    assert.match(source, /project:\s*Object\.freeze\(\[buildRechnungNavigationEntry\(\)\]\)/);
  });

  await run("Paket 2: Navigation konsumiert den gecachten aktiven Katalog statt statischem Produktkatalog", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/renderer/app/modules/moduleNavigation.js"), "utf8");
    assert.match(source, /getCachedActiveModuleCatalog/);
    assert.equal(source.includes("getActiveModuleCatalog"), false);
  });
}

module.exports = { runModuleRoutingNavigationTests };
