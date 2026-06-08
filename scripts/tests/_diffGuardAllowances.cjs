const ALLOWED_PROTOKOLL_UI_DIFFS = new Set([
  "src/renderer/modules/protokoll/TopsScreenQuicklane.js",
  "src/renderer/modules/protokoll/screens/TopsScreen.js",
  "src/renderer/modules/protokoll/styles/tops.css",
  "src/renderer/modules/protokoll/uiEditor/protokollUiElements.js",
]);

function isUnexpectedProtokollDiff(file) {
  return String(file || "").startsWith("src/renderer/modules/protokoll/") && !ALLOWED_PROTOKOLL_UI_DIFFS.has(file);
}

module.exports = {
  ALLOWED_PROTOKOLL_UI_DIFFS,
  isUnexpectedProtokollDiff,
};
