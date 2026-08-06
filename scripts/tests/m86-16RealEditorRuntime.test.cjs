"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const electronBinary = require("electron");

const ROOT = path.resolve(__dirname, "../..");
const RUNNER = path.join(__dirname, "m86-16RealEditorRuntimeRunner.cjs");

function summarizeFailures(failures) {
  const counts = new Map();
  for (const failure of failures) {
    const key = `${failure.reason} | ${failure.operation}`;
    const group = counts.get(key) || { count: 0, elementIds: [], examples: [] };
    group.count += 1;
    group.elementIds.push(failure.elementId);
    if (group.examples.length < 2) group.examples.push({ elementId: failure.elementId, targetIndex: failure.targetIndex, expected: failure.expected, before: failure.before, after: failure.after, targetMeasurements: failure.targetMeasurements });
    counts.set(key, group);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, group]) => ({ key, ...group }));
}

function runRendererRuntime() {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-m8616-"));
  const resultFile = path.join(temporaryRoot, "result.json");
  const host = path.join(temporaryRoot, "host");
  try {
    fs.mkdirSync(host);
    fs.writeFileSync(path.join(host, "package.json"), JSON.stringify({ main: "main.cjs" }), "utf8");
    fs.writeFileSync(path.join(host, "main.cjs"), `require(${JSON.stringify(RUNNER)});\n`, "utf8");
    const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "ELECTRON_RUN_AS_NODE")), BBM_M8616_RESULT_PATH: resultFile };
    const child = spawnSync(electronBinary, [host], { cwd: ROOT, env, encoding: "utf8", timeout: 180000, windowsHide: true });
    const report = fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile, "utf8")) : null;
    assert.equal(child.status, 0, `Chromium-Lauf fehlgeschlagen:\n${child.stderr || child.stdout || "ohne Ausgabe"}`);
    assert.ok(report, "M86.16-Lauf lieferte keinen Bericht.");
    return report;
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

async function runM8616RealEditorRuntimeTests(run) {
  await run("M86.16: vollständige sichtbare Registry reagiert je Modulzyklus im echten Chromium-Renderer", () => {
    const report = runRendererRuntime();
    assert.equal(report?.ok, true, report?.error || "Der Chromium-Bericht ist unvollständig.");
    assert.equal(report.elementCount + report.notCurrentlyVisible.length, report.registryElementCount, JSON.stringify({ unmounted: report.unmounted, notCurrentlyVisible: report.notCurrentlyVisible }, null, 2));
    assert.ok(report.operationCount >= report.elementCount * 8, "Nicht alle Richtungen wurden gemessen.");
    assert.deepEqual(report.unverifiedOperationVectors, [], JSON.stringify({ message: "Mindestens eine freigegebene Richtungsoperation wurde nicht im Renderer gemessen.", unverified: report.unverifiedOperationVectors, unavailable: report.unavailableOperationVectors }, null, 2));
    assert.ok(report.multiRefCount > 0 && report.textOperationCount > 0, "Multi-Ref- oder Textprüfung fehlt.");
    assert.deepEqual(report.protokollAmpelPanelMove && {
      checked: report.protokollAmpelPanelMove.checked,
      failureCount: report.protokollAmpelPanelMove.failureCount,
    }, { checked: true, failureCount: 0 }, "M86.17: Protokoll-Ampel muss ueber den echten ui-editor-panel-Pfad reagieren.");
    assert.deepEqual(report.startupRestoreGuard, {
      checked: true,
      blocked: true,
      errorCode: "geometry_risk_confirmation_required",
      elementId: "restarbeiten.edit.class",
    }, "M86.18: Unsichere Restarbeiten-Altwerte duerfen beim Startup-Restore nicht angewandt werden.");
    assert.deepEqual(report.startupRestoreRollback, {
      checked: true,
      baselinePreserved: true,
      rejected: true,
    }, "M86.18: Der Rollback eines abgewiesenen Restarbeiten-Profils darf keine unbeteiligten Geometrien festschreiben.");
    assert.deepEqual(report.restarbeitenScopeRegistration && {
      checked: report.restarbeitenScopeRegistration.checked,
      expectedScopeId: report.restarbeitenScopeRegistration.expectedScopeId,
      missingElementIdsBefore: report.restarbeitenScopeRegistration.missingElementIdsBefore,
      missingElementIdsAfter: report.restarbeitenScopeRegistration.missingElementIdsAfter,
      multiRefsRebound: report.restarbeitenScopeRegistration.multiRefsRebound,
      blockedWhenIncomplete: report.restarbeitenScopeRegistration.blockedWhenIncomplete,
      openedWhenComplete: report.restarbeitenScopeRegistration.openedWhenComplete,
    }, {
      checked: true,
      expectedScopeId: "restarbeiten.header.root",
      missingElementIdsBefore: ["restarbeiten.header.action.openUiEditor"],
      missingElementIdsAfter: [],
      multiRefsRebound: true,
      blockedWhenIncomplete: true,
      openedWhenComplete: true,
    }, "M86.19: Restarbeiten muss den Launcher-Ref nach einem Shell-Rerender erneut binden und unvollständige Scopes weiter blockieren.");
    for (const moduleId of ["restarbeiten", "protokoll"]) {
      assert.deepEqual(report.persistableGeometry?.[moduleId] && {
        checked: report.persistableGeometry[moduleId].checked,
        violationCount: report.persistableGeometry[moduleId].violationCount,
      }, { checked: true, violationCount: 0 }, `M86.17: ${moduleId} darf keine Werte unterhalb der registrierten Persistenzgrenzen serialisieren.`);
    }
    for (const moduleId of ["restarbeiten", "protokoll"]) {
      assert.deepEqual(report.persistence?.[moduleId] && {
        rerender: report.persistence[moduleId].rerender,
        filter: report.persistence[moduleId].filter,
        newRow: report.persistence[moduleId].newRow,
        projectChange: report.persistence[moduleId].projectChange,
      }, { rerender: true, filter: true, newRow: true, projectChange: true }, `M86.16 persistence proof missing for ${moduleId}.`);
    }
    assert.equal(report.failures.length, 0, JSON.stringify({
      failures: summarizeFailures(report.failures),
      notCurrentlyVisible: report.notCurrentlyVisible,
      unmounted: report.unmounted,
      diagnostics: report.diagnostics,
    }, null, 2));
  });
}

module.exports = { runM8616RealEditorRuntimeTests, runRendererRuntime };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM8616RealEditorRuntimeTests(run).then(() => { if (failed) process.exitCode = 1; });
}
