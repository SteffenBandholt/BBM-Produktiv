"use strict";

const assert = require("node:assert/strict");
const { runRendererRuntime } = require("./m86-16RealEditorRuntime.test.cjs");

async function runM8619RestarbeitenScopeRegistrationTests(run) {
  await run("M86.19: Restarbeiten-Scope bleibt nach Rerender vollständig, sobald der vorhandene Launcher erneut gebunden wird", () => {
    const result = runRendererRuntime().restarbeitenScopeRegistration;
    assert.deepEqual(result && {
      expectedScopeId: result.expectedScopeId,
      missingElementIdsBefore: result.missingElementIdsBefore,
      missingElementIdsAfter: result.missingElementIdsAfter,
      multiRefsRebound: result.multiRefsRebound,
      blockedWhenIncomplete: result.blockedWhenIncomplete,
      openedWhenComplete: result.openedWhenComplete,
      launcherRegistered: Boolean(result.launcherRegisteredAt),
    }, {
      expectedScopeId: "restarbeiten.header.root",
      missingElementIdsBefore: ["restarbeiten.header.action.openUiEditor"],
      missingElementIdsAfter: [],
      multiRefsRebound: true,
      blockedWhenIncomplete: true,
      openedWhenComplete: true,
      launcherRegistered: true,
    });
  });
}

module.exports = { runM8619RestarbeitenScopeRegistrationTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM8619RestarbeitenScopeRegistrationTests(run).then(() => { if (failed) process.exitCode = 1; });
}
