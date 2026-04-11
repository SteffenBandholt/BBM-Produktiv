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

  await run("Protokoll Workbench-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const workbenchFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/TopsWorkbench.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const workbenchSource = fs.readFileSync(workbenchFile, "utf8");

    assert.equal(screenSource.includes("tops/components/TopsWorkbench.js"), false);
    assert.equal(screenSource.includes('from "../TopsWorkbench.js"'), true);
    assert.equal(workbenchSource.includes("tops/components/TopsWorkbench.js"), true);
  });

  await run("Protokoll Quicklane-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const quicklaneFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/TopsQuicklane.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const quicklaneSource = fs.readFileSync(quicklaneFile, "utf8");

    assert.equal(screenSource.includes("tops/components/TopsQuicklane.js"), false);
    assert.equal(screenSource.includes('from "../TopsQuicklane.js"'), true);
    assert.equal(quicklaneSource.includes("tops/components/TopsQuicklane.js"), true);
  });

  await run("Protokoll Commands-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const commandsFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/TopsCommands.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const commandsSource = fs.readFileSync(commandsFile, "utf8");

    assert.equal(screenSource.includes("tops/domain/TopsCommands.js"), false);
    assert.equal(screenSource.includes('from "../TopsCommands.js"'), true);
    assert.equal(commandsSource.includes("tops/domain/TopsCommands.js"), true);
  });

  await run("Protokoll CloseFlow-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const closeFlowFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/TopsCloseFlow.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const closeFlowSource = fs.readFileSync(closeFlowFile, "utf8");

    assert.equal(screenSource.includes("tops/domain/TopsCloseFlow.js"), false);
    assert.equal(screenSource.includes('from "../TopsCloseFlow.js"'), true);
    assert.equal(closeFlowSource.includes("tops/domain/TopsCloseFlow.js"), true);
  });

  await run("Protokoll Repository-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const repositoryFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/TopsRepository.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const repositorySource = fs.readFileSync(repositoryFile, "utf8");

    assert.equal(screenSource.includes("tops/data/TopsRepository.js"), false);
    assert.equal(screenSource.includes('from "../TopsRepository.js"'), true);
    assert.equal(repositorySource.includes("tops/data/TopsRepository.js"), true);
  });

  await run(
    "Protokoll AssigneeDataSource-Einstieg: TopsScreen nutzt einen modulnahen Re-Export",
    () => {
      const screenFile = path.join(
        __dirname,
        "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
      );
      const assigneeDataSourceFile = path.join(
        __dirname,
        "../../src/renderer/modules/protokoll/TopsAssigneeDataSource.js"
      );
      const screenSource = fs.readFileSync(screenFile, "utf8");
      const assigneeDataSourceSource = fs.readFileSync(assigneeDataSourceFile, "utf8");

      assert.equal(screenSource.includes("tops/data/TopsAssigneeDataSource.js"), false);
      assert.equal(screenSource.includes('from "../TopsAssigneeDataSource.js"'), true);
      assert.equal(
        assigneeDataSourceSource.includes("tops/data/TopsAssigneeDataSource.js"),
        true
      );
    }
  );

  await run("Protokoll Store-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const storeFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/createTopsStore.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const storeSource = fs.readFileSync(storeFile, "utf8");

    assert.equal(screenSource.includes("tops/state/TopsStore.js"), false);
    assert.equal(screenSource.includes('from "../createTopsStore.js"'), true);
    assert.equal(storeSource.includes("tops/state/TopsStore.js"), true);
  });

  await run("Protokoll Selector-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const selectorsFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/TopsSelectors.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const selectorsSource = fs.readFileSync(selectorsFile, "utf8");

    assert.equal(screenSource.includes("tops/state/TopsSelectors.js"), false);
    assert.equal(screenSource.includes('from "../TopsSelectors.js"'), true);
    assert.equal(selectorsSource.includes("tops/state/TopsSelectors.js"), true);
  });

  await run("Protokoll ViewDialogs-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const viewDialogsFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/TopsViewDialogs.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const viewDialogsSource = fs.readFileSync(viewDialogsFile, "utf8");

    assert.equal(screenSource.includes("features/dialogs/TopsViewDialogs.js"), false);
    assert.equal(screenSource.includes('from "../TopsViewDialogs.js"'), true);
    assert.equal(viewDialogsSource.includes("features/dialogs/TopsViewDialogs.js"), true);
  });
}

module.exports = { runProtokollRouterFallbackTests };
