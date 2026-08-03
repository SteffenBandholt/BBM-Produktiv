const ALLOWED_PROTOKOLL_UI_DIFFS = new Set([
  "src/renderer/modules/protokoll/TopsScreenQuicklane.js",
  "src/renderer/modules/protokoll/TopsList.js",
  "src/renderer/modules/protokoll/TopsList.uiEditorContract.js",
  "src/renderer/modules/protokoll/TopsHeader.js",
  "src/renderer/modules/protokoll/TopsWorkbench.uiEditorContract.js",
  "src/renderer/modules/protokoll/WorkbenchShellFrame.js",
  "src/renderer/modules/protokoll/screens/TopsScreen.js",
  "src/renderer/modules/protokoll/screens/TopsScreen.uiEditorContract.js",
  "src/renderer/modules/protokoll/styles/tops.css",
  "src/renderer/modules/protokoll/uiEditor/protokollUiElements.js",
  "src/renderer/modules/protokoll/viewmodel/TopsScreenViewModel.js",
]);

function isUnexpectedProtokollDiff(file) {
  return String(file || "").startsWith("src/renderer/modules/protokoll/") && !ALLOWED_PROTOKOLL_UI_DIFFS.has(file);
}

module.exports = {
  ALLOWED_PROTOKOLL_UI_DIFFS,
  isUnexpectedProtokollDiff,
};
