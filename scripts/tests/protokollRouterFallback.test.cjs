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
    assert.equal(styleSource.includes("./styles/tops.css"), true);
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
    assert.equal(headerSource.includes("../../tops/components/TopsHeader.js"), false);
    assert.equal(headerSource.includes("data-bbm-tops-header-v2"), true);
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
    assert.equal(listSource.includes("../../tops/components/TopsList.js"), false);
    assert.equal(listSource.includes("data-bbm-tops-list-v2"), true);
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

  await run("Protokoll Quicklane-Einstieg: TopsScreen nutzt keinen Quicklane-Re-Export mehr", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");

    assert.equal(screenSource.includes("tops/components/TopsQuicklane.js"), false);
    assert.equal(screenSource.includes("_mountQuicklaneIntoWorkbenchGutter"), false);
    assert.equal(screenSource.includes("setTopFilter("), true);
    assert.equal(screenSource.includes("getTopFilter("), true);
  });

  await run("Protokoll Quicklane-Filter sitzt in der rechten Toolbox", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const routerFile = path.join(__dirname, "../../src/renderer/app/Router.js");
    const quicklaneFile = path.join(
      __dirname,
      "../../src/renderer/ui/ProjectContextQuicklane.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const routerSource = fs.readFileSync(routerFile, "utf8");
    const quicklaneSource = fs.readFileSync(quicklaneFile, "utf8");

    assert.equal(screenSource.includes("topFilter"), true);
    assert.equal(screenSource.includes("this.router.context.ui.topFilter"), true);
    assert.equal(screenSource.includes("onTopFilterChange"), true);
    assert.equal(routerSource.includes("onTopFilterChange = null"), true);
    assert.equal(screenSource.includes("_mountQuicklaneIntoWorkbenchGutter"), false);
    assert.equal(screenSource.includes("workbench?.gutter"), false);
    assert.equal(quicklaneSource.includes("TOP-Filter"), true);
    assert.equal(quicklaneSource.includes("top-filter"), true);
    assert.equal(quicklaneSource.includes("onTopFilterChange"), true);
    assert.equal(quicklaneSource.includes("toggleAmpelDisplay"), true);
    assert.equal(quicklaneSource.includes("toggleLongtextDisplay"), true);
    assert.equal(quicklaneSource.includes("ToDo"), true);
    assert.equal(quicklaneSource.includes("Beschluss"), true);
    assert.equal(quicklaneSource.includes("Projektnummer"), false);
    assert.equal(quicklaneSource.includes("Kurzbezeichnung"), false);
    assert.equal(quicklaneSource.includes("Projekt-ID"), false);
    assert.equal(quicklaneSource.includes("Meeting-ID"), false);
    assert.equal(quicklaneSource.includes("contextMeta"), false);
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

  await run("Protokoll Close-Handler: TopsScreen nutzt den Projektkontext-Ruecksprung", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");

    assert.equal(screenSource.includes("_returnAfterClose()"), true);
    assert.equal(screenSource.includes("await this.router.showProjects();"), true);
    assert.equal(screenSource.includes("await this.router.showProjectWorkspace(projectId, projectOptions);"), false);
  });

  await run("Protokoll Delete-Handler: TopsScreen repariert Nummernluecken nach Delete", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");

    assert.equal(screenSource.includes("_getDeleteSelectionCandidateId("), true);
    assert.equal(screenSource.includes("_firstNumberGapFromItems("), true);
    assert.equal(screenSource.includes("_autoFixNumberGapsAfterDelete("), true);
    assert.equal(screenSource.includes("meetingTopsFixNumberGap"), true);
    assert.equal(screenSource.includes("this.commands.deleteSelectedTop();"), true);
    assert.equal(screenSource.includes("this.commands.selectTop(nextTop?.id ?? null);"), true);
    assert.equal(screenSource.includes("this.commands.updateDraft(editorFromTop(nextTop));"), true);
  });

  await run("Protokoll Create-Handler: TopsScreen erlaubt +Titel ohne Auswahl und merkt Create-Kontext", () => {
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const screenSource = fs.readFileSync(screenFile, "utf8");
    const createLevel1Start = screenSource.indexOf("async _handleWorkbenchCreateLevel1()");
    const createChildStart = screenSource.indexOf("async _handleWorkbenchCreateChild()");
    const createLevel1Source = screenSource.slice(createLevel1Start, createChildStart);
    const createChildSource = screenSource.slice(createChildStart);

    assert.equal(screenSource.includes("createParentTopId: null"), true);
    assert.equal(screenSource.includes("_setCreateParentTopId(top?.id ?? null);"), true);
    assert.equal(screenSource.includes("_setCreateParentTopId(createdId);"), true);
    assert.equal(screenSource.includes("_resolveCreateParentTop("), true);
    assert.equal(createLevel1Source.includes("const selectedTop = getSelectedTop(state);"), true);
    assert.equal(createLevel1Source.includes("if (selectedTop) {"), true);
    assert.equal(
      createLevel1Source.includes("const saved = await this._saveActiveDraft({ resetMoveMode: false });"),
      true
    );
    assert.equal(createLevel1Source.includes("if (saved === false) return;"), true);
    assert.equal(createChildSource.includes("const selectedTop = this._resolveCreateParentTop(state);"), true);
    assert.equal(createChildSource.includes("_setCreateParentTopId(selectedTop.id ?? null);"), true);
  });

  await run("Protokoll Blur-Save: TopsScreen verdrahtet Kurztext/Langtext-Blur zum Speichern", () => {
    const sharedEditboxFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/SharedEditboxCore.js"
    );
    const workbenchFile = path.join(__dirname, "../../src/renderer/tops/components/TopsWorkbench.js");
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const sharedEditboxSource = fs.readFileSync(sharedEditboxFile, "utf8");
    const workbenchSource = fs.readFileSync(workbenchFile, "utf8");
    const screenSource = fs.readFileSync(screenFile, "utf8");

    assert.equal(sharedEditboxSource.includes('onTextBlur'), true);
    assert.equal(sharedEditboxSource.includes('addEventListener("blur"'), true);
    assert.equal(workbenchSource.includes("onTextBlur"), true);
    assert.equal(screenSource.includes("_handleWorkbenchTextBlur"), true);
    assert.equal(screenSource.includes("_saveActiveDraft({ resetMoveMode: false })"), true);
    assert.equal(screenSource.includes("this.store.setState({ isWriting: false });"), true);
    assert.equal(screenSource.includes("finally {"), true);
    assert.equal(screenSource.includes("this._syncScreenState();"), true);
  });

  await run("Protokoll Button-Kaskade: TopsScreen unterdrueckt Blur bei Workbench-Buttons", () => {
    const workbenchFile = path.join(__dirname, "../../src/renderer/tops/components/TopsWorkbench.js");
    const screenFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/screens/TopsScreen.js"
    );
    const workbenchSource = fs.readFileSync(workbenchFile, "utf8");
    const screenSource = fs.readFileSync(screenFile, "utf8");

    assert.equal(workbenchSource.includes('addEventListener("pointerdown"'), true);
    assert.equal(workbenchSource.includes('addEventListener("mousedown"'), true);
    assert.equal(screenSource.includes("onButtonPointerDown: () => this._markWorkbenchButtonPointerDown()"), true);
    assert.equal(screenSource.includes("this._suppressNextWorkbenchTextBlur = true;"), true);
    assert.equal(screenSource.includes("if (this._suppressNextWorkbenchTextBlur)"), true);
    assert.equal(screenSource.includes("buildPatchFromDraft(selectedTop, state.editor || {})"), true);
    const createLevel1Start = screenSource.indexOf("async _handleWorkbenchCreateLevel1()");
    const createChildStart = screenSource.indexOf("async _handleWorkbenchCreateChild()");
    const createLevel1Source = screenSource.slice(createLevel1Start, createChildStart);
    assert.equal(
      createLevel1Source.indexOf("const saved = await this._saveActiveDraft({ resetMoveMode: false });") <
        createLevel1Source.indexOf("this.store.setState({ isWriting: true });"),
      true
    );
    assert.equal(
      createLevel1Source.indexOf("this.store.setState({ isWriting: true });") <
        createLevel1Source.indexOf("this.topsRepository.createTop({"),
      true
    );
  });

  await run("Protokoll Move-Mode: TopsList und Styles unterscheiden Schiebling, Ziel und Blockade", () => {
    const listFile = path.join(__dirname, "../../src/renderer/modules/protokoll/TopsList.js");
    const styleFile = path.join(
      __dirname,
      "../../src/renderer/modules/protokoll/styles/tops.css"
    );
    const listSource = fs.readFileSync(listFile, "utf8");
    const styleSource = fs.readFileSync(styleFile, "utf8");

    assert.equal(listSource.includes("dataset.moveState"), true);
    assert.equal(listSource.includes('moveState === "current" || moveState === "blocked"'), true);
    assert.equal(styleSource.includes('[data-move-state="current"]'), true);
    assert.equal(styleSource.includes('[data-move-state="blocked"]'), true);
    assert.equal(styleSource.includes('[data-move-state="target"]:hover'), true);
    assert.equal(styleSource.includes("repeating-linear-gradient"), true);
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
