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
    const closeFlowFile = path.join(__dirname, "../../src/renderer/modules/protokoll/TopsCloseFlow.js");
    const legacyCloseFlowFile = path.join(__dirname, "../../src/renderer/tops/domain/TopsCloseFlow.js");
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const closeFlowSource = fs.readFileSync(closeFlowFile, "utf8");
    const legacyCloseFlowSource = fs.readFileSync(legacyCloseFlowFile, "utf8");

    assert.equal(screenSource.includes('from "../TopsCloseFlow.js"'), true);
    assert.equal(closeFlowSource.includes("features/mail/MailFlow.js"), true);
    assert.equal(closeFlowSource.includes("run()"), true);
    assert.equal(legacyCloseFlowSource.includes('from "../../modules/protokoll/TopsCloseFlow.js"'), true);
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

  await run("Protokoll HeaderState-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const headerStateFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/buildHeaderState.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const headerStateSource = fs.readFileSync(headerStateFile, "utf8");

    assert.equal(screenSource.includes("buildHeaderState,\n"), false);
    assert.equal(screenSource.includes('from "../buildHeaderState.js"'), true);
    assert.equal(headerStateSource.includes("viewmodel/TopsScreenViewModel.js"), true);
  });

  await run(
    "Protokoll ListItemsFromState-Einstieg: TopsScreen nutzt einen modulnahen Re-Export",
    () => {
      const screenFile = path.join(
        __dirname,
        "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
      );
      const listItemsFile = path.join(
        __dirname,
        "../../src/renderer/modules/protokoll/buildListItemsFromState.js"
      );
      const screenSource = fs.readFileSync(screenFile, "utf8");
      const listItemsSource = fs.readFileSync(listItemsFile, "utf8");

      assert.equal(screenSource.includes("buildListItemsFromState,\n"), false);
      assert.equal(screenSource.includes('from "../buildListItemsFromState.js"'), true);
      assert.equal(listItemsSource.includes("viewmodel/TopsScreenViewModel.js"), true);
    }
  );

  await run("Protokoll editorFromTop-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const editorFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/editorFromTop.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const editorSource = fs.readFileSync(editorFile, "utf8");

    assert.equal(screenSource.includes('from "../editorFromTop.js"'), true);
    assert.equal(editorSource.includes("viewmodel/TopsScreenViewModel.js"), true);
  });

  await run(
    "Protokoll buildPatchFromDraft-Einstieg: TopsScreen nutzt einen modulnahen Re-Export",
    () => {
      const screenFile = path.join(
        __dirname,
        "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
      );
      const patchFile = path.join(
        __dirname,
        "../../src/renderer/modules/protokoll/buildPatchFromDraft.js"
      );
      const screenSource = fs.readFileSync(screenFile, "utf8");
      const patchSource = fs.readFileSync(patchFile, "utf8");

      assert.equal(screenSource.includes('from "../buildPatchFromDraft.js"'), true);
      assert.equal(patchSource.includes("viewmodel/TopsScreenViewModel.js"), true);
    }
  );

  await run(
    "Protokoll canCreateChildFromState-Einstieg: TopsScreen nutzt einen modulnahen Re-Export",
    () => {
      const screenFile = path.join(
        __dirname,
        "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
      );
      const createChildFile = path.join(
        __dirname,
        "../../src/renderer/modules/protokoll/canCreateChildFromState.js"
      );
      const screenSource = fs.readFileSync(screenFile, "utf8");
      const createChildSource = fs.readFileSync(createChildFile, "utf8");

      assert.equal(screenSource.includes('from "../canCreateChildFromState.js"'), true);
      assert.equal(createChildSource.includes("viewmodel/TopsScreenViewModel.js"), true);
    }
  );

  await run("Protokoll canDeleteFromState-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const deleteFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/canDeleteFromState.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const deleteSource = fs.readFileSync(deleteFile, "utf8");

    assert.equal(screenSource.includes('from "../canDeleteFromState.js"'), true);
    assert.equal(deleteSource.includes("viewmodel/TopsScreenViewModel.js"), true);
  });

  await run("Protokoll canMoveFromState-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const moveFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/canMoveFromState.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const moveSource = fs.readFileSync(moveFile, "utf8");

    assert.equal(screenSource.includes('from "../canMoveFromState.js"'), true);
    assert.equal(moveSource.includes("viewmodel/TopsScreenViewModel.js"), true);
  });

  await run("Protokoll shouldShowWorkbench-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const workbenchFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/shouldShowWorkbench.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const workbenchSource = fs.readFileSync(workbenchFile, "utf8");

    assert.equal(screenSource.includes('from "../shouldShowWorkbench.js"'), true);
    assert.equal(workbenchSource.includes("viewmodel/TopsScreenViewModel.js"), true);
  });

  await run("Protokoll buildWorkbenchVm-Einstieg: TopsScreen nutzt einen modulnahen Re-Export", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const vmFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/buildWorkbenchVm.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const vmSource = fs.readFileSync(vmFile, "utf8");

    assert.equal(screenSource.includes('from "../buildWorkbenchVm.js"'), true);
    assert.equal(vmSource.includes("viewmodel/TopsWorkbenchViewModel.js"), true);
  });

  await run("Protokoll Screen-Entmischung: TopsScreen nutzt keine direkten tiefen Altpfade", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");

    assert.equal(screenSource.includes("viewmodel/TopsScreenViewModel.js"), false);
    assert.equal(screenSource.includes("tops/components/"), false);
    assert.equal(screenSource.includes("tops/domain/"), false);
    assert.equal(screenSource.includes("tops/data/"), false);
    assert.equal(screenSource.includes("tops/state/"), false);
    assert.equal(screenSource.includes("features/dialogs/"), false);
  });

  await run("Protokoll ViewModel-Entmischung: TopsScreenViewModel nutzt keinen direkten Selector-Altpfad", () => {
    const vmFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/viewmodel/TopsScreenViewModel.js"
    );
    const selectorsFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/TopsSelectors.js"
    );
    const vmSource = fs.readFileSync(vmFile, "utf8");
    const selectorsSource = fs.readFileSync(selectorsFile, "utf8");

    assert.equal(vmSource.includes("tops/state/TopsSelectors.js"), false);
    assert.equal(vmSource.includes('from "../TopsSelectors.js"'), true);
    assert.equal(selectorsSource.includes("tops/state/TopsSelectors.js"), true);
  });

  await run("Protokoll ViewModel-Entmischung: TopsScreenViewModel nutzt keine direkte ActionPolicy", () => {
    const vmFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/viewmodel/TopsScreenViewModel.js"
    );
    const policyFile = path.join(__dirname, "../../src/renderer/modules/protokoll/TopsActionPolicy.js");
    const vmSource = fs.readFileSync(vmFile, "utf8");
    const policySource = fs.readFileSync(policyFile, "utf8");

    assert.equal(vmSource.includes("tops/domain/TopsActionPolicy.js"), false);
    assert.equal(vmSource.includes('from "../TopsActionPolicy.js"'), true);
    assert.equal(policySource.includes("tops/domain/TopsActionPolicy.js"), true);
  });

  await run("Protokoll ViewModel-Entmischung: TopsScreenViewModel nutzt keinen direkten Ampel-Altpfad", () => {
    const vmFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/viewmodel/TopsScreenViewModel.js"
    );
    const ampelFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/computeAmpelColorForTop.js"
    );
    const vmSource = fs.readFileSync(vmFile, "utf8");
    const ampelSource = fs.readFileSync(ampelFile, "utf8");

    assert.equal(vmSource.includes("shared/ampel/pdfAmpelRule.js"), false);
    assert.equal(vmSource.includes('from "../computeAmpelColorForTop.js"'), true);
    assert.equal(ampelSource.includes("shared/ampel/pdfAmpelRule.js"), true);
  });

  await run("Protokoll ViewModel-Entmischung: TopsScreenViewModel nutzt keinen direkten Text-Altpfad", () => {
    const vmFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/viewmodel/TopsScreenViewModel.js"
    );
    const textFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/topTextPresentation.js"
    );
    const vmSource = fs.readFileSync(vmFile, "utf8");
    const textSource = fs.readFileSync(textFile, "utf8");

    assert.equal(vmSource.includes("shared/text/topTextPresentation.js"), false);
    assert.equal(vmSource.includes('from "../topTextPresentation.js"'), true);
    assert.equal(textSource.includes("shared/text/topTextPresentation.js"), true);
  });
}

module.exports = { runProtokollRouterFallbackTests };
