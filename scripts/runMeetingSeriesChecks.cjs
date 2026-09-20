"use strict";
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const SUITES = [
  ["meetingSeries", "runMeetingSeriesTests"], ["meetingSeriesTransfer", "runMeetingSeriesTransferTests"],
  ["meetingSeriesOutput", "runMeetingSeriesOutputTests"],
  ["meetingSeriesUiContract", "runMeetingSeriesUiContractTests"],
  ["meetingSeriesOutputRepoDto", "runMeetingSeriesOutputRepoDtoTests", "meetingSeriesOutput"],
  ["topsCommands", "runTopsCommandsTests"], ["topsScreen.integration", "runTopsScreenIntegrationTests"],
  ["projectBuilder", "runProjectBuilderTests"], ["projectBuilderForm", "runProjectBuilderFormTests"],
  ["projectBuilderTransfer", "runProjectBuilderTransferTests"], ["topServiceHierarchy", "runTopServiceHierarchyTests"],
  ["firmDirectory", "runFirmDirectoryTests"], ["firmDirectoryIpc", "runFirmDirectoryIpcTests"],
  ["projectFirmsActiveFlow", "runProjectFirmsActiveFlowTests"], ["projectFirmsCoreOwnership", "runProjectFirmsCoreOwnershipTests"],
  ["projectFirmsLayout", "runProjectFirmsLayoutTests"],
  ["protokollProjectEntryRouting", "runProtokollProjectEntryRoutingTests"], ["protokollRouterFallback", "runProtokollRouterFallbackTests"],
  ["topsCloseFlow", "runTopsCloseFlowTests"], ["protokollParticipantOwnership", "runProtokollParticipantOwnershipTests"],
  ["protokollMailPayloadOwnership", "runProtokollMailPayloadOwnershipTests"],
  ["protokollMailTransportBoundary", "runProtokollMailTransportBoundaryTests"], ["protokollPdfServiceBoundary", "runProtokollPdfServiceBoundaryTests"],
  ["m83-0ComponentContracts", "runM830ComponentContractTests"],
  ["m80ElectronUiEditor", "runM80ElectronUiEditorTests"],
];
async function run() {
  const selected = process.argv.slice(2);
  const unknown = selected.filter(name => !SUITES.some(([file]) => file === name));
  if (unknown.length) throw new Error("Unknown test suites: " + unknown.join(", "));
  const results = [];
  for (const [file, exported, sourceFile] of SUITES.filter(([file]) => !selected.length || selected.includes(file))) {
    const suite = require(path.join(__dirname, "tests", (sourceFile || file) + ".test.cjs"));
    const before = results.length;
    if (typeof suite[exported] !== "function") throw new Error(`Test export missing: ${file}/${exported}`);
    await suite[exported](async (name, test) => {
      try { await test(); results.push({ suite: file, name, ok: true }); }
      catch (err) { results.push({ suite: file, name, ok: false, error: err.stack || String(err) }); console.error(`FAIL ${name}\n${err.stack || err}`); }
    });
    const rows = results.slice(before); console.log(`${file}: ${rows.filter(row => row.ok).length}/${rows.length} passed`);
  }
  const dir = path.resolve(__dirname, "../output/meeting-series-checks-2026-09-15"); fs.mkdirSync(dir, { recursive: true });
  const resultFile = selected.length ? selected.join("-") + "-results.json" : "results.json";
  fs.writeFileSync(path.join(dir, resultFile), JSON.stringify({ results }, null, 2));
  console.log(`Total ${results.filter(row => row.ok).length}/${results.length}; report ${dir}`);
  process.exitCode = results.every(row => row.ok) ? 0 : 1;
}
if (process.versions.electron) run().catch(err => { console.error(err); process.exitCode = 1; });
else {
  const result = cp.spawnSync(require("electron"), [__filename, ...process.argv.slice(2)], { env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }, stdio: "inherit", windowsHide: true });
  process.exitCode = result.status == null ? 1 : result.status;
}
