const assert = require("node:assert/strict");
const path = require("node:path");
const {
  sanitizeDirName,
  resolveProjectFolderName,
  buildStoragePreviewPaths,
} = require("../src/main/ipc/projectStoragePaths");
const { runTopsStoreTests } = require("./tests/topsStore.test.cjs");
const { runTopsSelectorsTests } = require("./tests/topsSelectors.test.cjs");
const { runTopsCommandsTests } = require("./tests/topsCommands.test.cjs");
const { runTopsActionPolicyTests } = require("./tests/topsActionPolicy.test.cjs");
const { runTopsScreenIntegrationTests } = require("./tests/topsScreen.integration.test.cjs");
const { runProjectFirmsActiveFlowTests } = require("./tests/projectFirmsActiveFlow.test.cjs");
const { runProjectFirmsLayoutTests } = require("./tests/projectFirmsLayout.test.cjs");
const { runTopsDtosTests } = require("./tests/topsDtos.test.cjs");
const { runTopsCloseFlowTests } = require("./tests/topsCloseFlow.test.cjs");
const { runTopServiceHierarchyTests } = require("./tests/topServiceHierarchy.test.cjs");
const { runProtokollRouterFallbackTests } = require("./tests/protokollRouterFallback.test.cjs");
const { runProtokollProjectEntryRoutingTests } = require("./tests/protokollProjectEntryRouting.test.cjs");
const { runProtokollUiEditorElementsTests } = require("./tests/protokollUiEditorElements.test.cjs");
const { runProjektverwaltungModuleTests } = require("./tests/projektverwaltungModule.test.cjs");
const { runRestarbeitenModuleTests } = require("./tests/restarbeitenModule.test.cjs");
const { runRestarbeitenDataModelTests } = require("./tests/restarbeitenDataModel.test.cjs");
const { runUiEditorContractTests } = require("./tests/uiEditorContract.test.cjs");
const { runUiV2EditorV2RulesTests } = require("./tests/uiV2EditorV2Rules.test.cjs");
const { runEditorLabV2Tests } = require("./tests/editorLabV2.test.cjs");
const { runEditorV2RegistryTests } = require("./tests/editorV2Registry.test.cjs");
const { runEditorV2HoverTests } = require("./tests/editorV2Hover.test.cjs");
const { runEditorV2SelectionTests } = require("./tests/editorV2Selection.test.cjs");
const { runEditorV2PreviewTests } = require("./tests/editorV2Preview.test.cjs");
const { runEditorV2PanelTests } = require("./tests/editorV2Panel.test.cjs");
const { runEditorLabV2AccessTests } = require("./tests/editorLabV2Access.test.cjs");
const { runRestarbeitenV2DevAccessTests } = require("./tests/restarbeitenV2DevAccess.test.cjs");
const { runRestarbeitenV2EditorDevTests } = require("./tests/restarbeitenV2EditorDev.test.cjs");
const { runRestarbeitenV2RegistryRulesTests } = require("./tests/restarbeitenV2RegistryRules.test.cjs");
const { runRestarbeitenV2RegistryTests } = require("./tests/restarbeitenV2Registry.test.cjs");
const { runRestarbeitenV2DataContractTests } = require("./tests/restarbeitenV2DataContract.test.cjs");
const { runRestarbeitenV2DataSourceTests } = require("./tests/restarbeitenV2DataSource.test.cjs");
const { runRestarbeitenV2MapperTests } = require("./tests/restarbeitenV2Mapper.test.cjs");
const { runRestarbeitenV2ReadOnlyAdapterTests } = require("./tests/restarbeitenV2ReadOnlyAdapter.test.cjs");
const { runRestarbeitenV2LegacyReadBridgeTests } = require("./tests/restarbeitenV2LegacyReadBridge.test.cjs");
const { runRestarbeitenV2ReadPathInventoryTests } = require("./tests/restarbeitenV2ReadPathInventory.test.cjs");
const { runRestarbeitenV2ReadPathDecisionTests } = require("./tests/restarbeitenV2ReadPathDecision.test.cjs");
const { runRestarbeitenV2ReadOnlyDataSourceFactoryTests } = require("./tests/restarbeitenV2ReadOnlyDataSourceFactory.test.cjs");
const { runRestarbeitenV2ScreenTests } = require("./tests/restarbeitenV2Screen.test.cjs");
const { runHomeViewTests } = require("./tests/homeView.test.cjs");
const { runProjectSettingsIpcTests } = require("./tests/projectSettingsIpc.test.cjs");
const { runSettingsUserProfileSourceTests } = require("./tests/settingsUserProfileSource.test.cjs");
const { runSettingsPrintLayoutTests } = require("./tests/settingsPrintLayout.test.cjs");
const { runTableLayoutEditorPrototypeTests } = require("./tests/tableLayoutEditorPrototype.test.cjs");
const { runPrintUserDataResolverTests } = require("./tests/printUserDataResolver.test.cjs");
const { runPrintOrientationTests } = require("./tests/printOrientation.test.cjs");
const { runPrintModesTests } = require("./tests/printModes.test.cjs");
const { runPrintTableLayoutsTests } = require("./tests/printTableLayouts.test.cjs");
const { runTableLayoutsResolverTests } = require("./tests/tableLayoutsResolver.test.cjs");
const { runTableLayoutsRepoTests } = require("./tests/tableLayoutsRepo.test.cjs");
const { runTableLayoutsIpcTests } = require("./tests/tableLayoutsIpc.test.cjs");
const { runTableLayoutRegistryTests } = require("./tests/tableLayoutRegistry.test.cjs");
const { runLayoutToolsRegressionTests } = require("./tests/layoutToolsRegression.test.cjs");
const { runLayoutToolsAutoDetectionTests } = require("./tests/layoutToolsAutoDetection.test.cjs"); 
const { runSendMailPayloadTests } = require("./tests/sendMailPayload.test.cjs"); 
const { runAusgabeModuleTests } = require("./tests/ausgabeModule.test.cjs"); 
const { runAudioModuleTests } = require("./tests/audioModule.test.cjs");
const { runDictionaryModuleTests } = require("./tests/dictionaryModule.test.cjs");
const { runDrucklayoutModuleTests } = require("./tests/drucklayoutModule.test.cjs");
const { runDistCustomerBuildTests } = require("./tests/distCustomerBuild.test.cjs");
const { runLicenseStorageBootstrapTests } = require("./tests/licenseStorageBootstrap.test.cjs");
const { runLicenseTrialRuntimeTests } = require("./tests/licenseTrialRuntime.test.cjs");
const { runLicenseRequestTests } = require("./tests/licenseRequest.test.cjs");
const { runLicenseDoubleClickImportTests } = require("./tests/licenseDoubleClickImport.test.cjs");
const { runLicenseFeatureGuardTests } = require("./tests/licenseFeatureGuards.test.cjs");
const { runLicenseStandardFeaturesTests } = require("./tests/licenseStandardFeatures.test.cjs");
const { runFeatureGuardEnforcementTests } = require("./tests/featureGuardEnforcement.test.cjs");
const { runLicensePresentationTests } = require("./tests/licensePresentation.test.cjs");
const { runNativeTestRuntimeTests } = require("./tests/nativeTestRuntime.test.cjs");

let failed = false;

function run(name, fn) {
  try {
    const out = fn();
    if (out && typeof out.then === "function") {
      return out
        .then(() => {
          console.log(`ok - ${name}`);
        })
        .catch((err) => {
          failed = true;
          console.error(`not ok - ${name}`);
          console.error(err?.stack || err?.message || err);
        });
    }
    console.log(`ok - ${name}`);
  } catch (err) {
    failed = true;
    console.error(`not ok - ${name}`);
    console.error(err?.stack || err?.message || err);
  }
  return Promise.resolve();
}

async function main() {
  await run("sanitizeDirName ersetzt ungueltige Zeichen", () => {
    const out = sanitizeDirName('A<B>:C"D/E\\F|G?H*');
    assert.equal(out, "A_B__C_D_E_F_G_H_");
  });
  
  await run("resolveProjectFolderName bildet Nummer + Label", () => {
    const out = resolveProjectFolderName({
      project_number: "P-42",
      short: "Rohbau Nord",
    });
    assert.equal(out, "P-42 - Rohbau Nord");
  });

  await run("buildStoragePreviewPaths erzeugt Zielordner", () => {
    const out = buildStoragePreviewPaths({
      baseDir: "C:\\Daten",
      project: { project_number: "12", short: "Test" },
    });
    assert.equal(out.projectFolder, "12 - Test");
    assert.equal(out.protocolsDir, path.join("C:\\Daten", "bbm", "12 - Test", "Protokolle"));
    assert.equal(out.previewDir, path.join("C:\\Daten", "bbm", "12 - Test", "Vorabzug"));
    assert.equal(out.listsDir, path.join("C:\\Daten", "bbm", "12 - Test", "Listen"));
    assert.equal(out.restarbeitenDir, path.join("C:\\Daten", "bbm", "12 - Test", "Restarbeiten"));
  });

  await runTopsStoreTests(run);
  await runTopsSelectorsTests(run);
  await runTopsDtosTests(run);
  await runTopsCommandsTests(run);
  await runTopsCloseFlowTests(run);
  await runTopServiceHierarchyTests(run);
  await runTopsActionPolicyTests(run);
  await runTopsScreenIntegrationTests(run);
  await runProjectFirmsActiveFlowTests(run);
  await runProjectFirmsLayoutTests(run);
  await runProtokollRouterFallbackTests(run);
  await runProtokollProjectEntryRoutingTests(run);
  await runProtokollUiEditorElementsTests(run);
  await runProjektverwaltungModuleTests(run);
  await runRestarbeitenModuleTests(run);
  await runRestarbeitenDataModelTests(run);
  await runUiEditorContractTests(run);
  await runUiV2EditorV2RulesTests(run);
  await runEditorLabV2Tests(run);
  await runEditorV2RegistryTests(run);
  await runEditorV2HoverTests(run);
  await runEditorV2SelectionTests(run);
  await runEditorV2PreviewTests(run);
  await runEditorV2PanelTests(run);
  await runEditorLabV2AccessTests(run);
  await runRestarbeitenV2DevAccessTests(run);
  await runRestarbeitenV2EditorDevTests(run);
  await runRestarbeitenV2RegistryRulesTests(run);
  await runRestarbeitenV2RegistryTests(run);
  await runRestarbeitenV2DataContractTests(run);
  await runRestarbeitenV2DataSourceTests(run);
  await runRestarbeitenV2MapperTests(run);
  await runRestarbeitenV2ReadOnlyAdapterTests(run);
  await runRestarbeitenV2LegacyReadBridgeTests(run);
  await runRestarbeitenV2ReadPathInventoryTests(run);
  await runRestarbeitenV2ReadPathDecisionTests(run);
  await runRestarbeitenV2ReadOnlyDataSourceFactoryTests(run);
  await runRestarbeitenV2ScreenTests(run);
  await runHomeViewTests(run);
  await runProjectSettingsIpcTests(run);
  await runSettingsUserProfileSourceTests(run);
  await runSettingsPrintLayoutTests(run);
  await runTableLayoutEditorPrototypeTests(run);
  await runPrintUserDataResolverTests(run);
  await runPrintOrientationTests(run);
  await runPrintModesTests(run);
  await runPrintTableLayoutsTests(run);
  await runTableLayoutsResolverTests(run);
  await runTableLayoutsRepoTests(run);
  await runTableLayoutsIpcTests(run);
  await runTableLayoutRegistryTests(run);
  await runLayoutToolsRegressionTests(run);
  await runLayoutToolsAutoDetectionTests(run);
  await runSendMailPayloadTests(run);
  await runAusgabeModuleTests(run);
  await runAudioModuleTests(run);
  await runDictionaryModuleTests(run);
  await runDrucklayoutModuleTests(run);
  await runDistCustomerBuildTests(run);
  await runLicenseTrialRuntimeTests(run); 
  await runLicenseStorageBootstrapTests(run); 
  await runLicenseRequestTests(run); 
  await runLicenseDoubleClickImportTests(run); 
  await runLicenseFeatureGuardTests(run); 
  await runLicenseStandardFeaturesTests(run); 
  await runFeatureGuardEnforcementTests(run); 
  await runLicensePresentationTests(run); 
  await runNativeTestRuntimeTests(run);

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log("Alle Tests bestanden.");
  }
}

main().catch((err) => {
  failed = true;
  process.exitCode = 1;
  console.error(err?.stack || err?.message || err);
});
