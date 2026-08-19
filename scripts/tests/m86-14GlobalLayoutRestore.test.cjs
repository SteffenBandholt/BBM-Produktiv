"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const {
  createUiScopeFingerprint,
  loadTargetStartupLayout,
} = require("ui-editor-kit");
const {
  createBbmModuleLayoutStorageIdentity,
  resolveBbmModuleLayoutProfileRoot,
} = require("../../src/main/ui-editor/electronUiEditorSession.js");

const ROOT = path.resolve(__dirname, "../..");
const PROTOKOLL_SCOPES = Object.freeze([
  "protokoll.screen.root",
  "protokoll.list.root",
  "protokoll.edit.root",
]);
const RESTARBEITEN_SCOPES = Object.freeze([
  "restarbeiten.header.root",
  "restarbeiten.list.root",
  "restarbeiten.edit.root",
]);

function registration(activeScopes, projectId = "project-a") {
  return {
    applicationId: "bbm-produktiv",
    registryVersion: 19,
    activeScopes: [...activeScopes],
    registryScopes: [],
    projectId,
    projectName: `Projekt ${projectId}`,
    meetingId: `meeting-${projectId}`,
    recordId: `record-${projectId}`,
  };
}

function scope(scopeId, fieldId) {
  return {
    scopeId,
    status: "complete",
    elements: [
      { id: scopeId, parentId: null, scopeId, type: "root", editable: false, allowedOps: [] },
      {
        id: fieldId,
        parentId: scopeId,
        scopeId,
        type: "field",
        editable: true,
        allowedOps: ["move"],
        geometry: { maximumStoredOffset: 2400 },
      },
    ],
  };
}

function profileDocument(moduleScope, fieldId, x) {
  return {
    schemaVersion: 2,
    applicationId: "bbm-produktiv",
    profileId: "standard",
    savedAt: "2026-08-04T12:00:00.000Z",
    scopes: [{
      scopeId: moduleScope.scopeId,
      registryFingerprint: createUiScopeFingerprint(moduleScope),
      layoutState: {
        elements: [
          { elementId: moduleScope.scopeId, scopeId: moduleScope.scopeId },
          { elementId: fieldId, scopeId: moduleScope.scopeId, x, y: 0 },
        ],
      },
      explicitOperations: { [fieldId]: ["move"] },
    }],
  };
}

function writeProfile(root, document) {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "standard.layout-profile.json"), JSON.stringify(document), "utf8");
}

async function runM8614GlobalLayoutRestoreTests(run) {
  const baseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-m8614-layout-"));
  try {
    await run("M86.14 01: Projekt- und Datensatzkennungen sind kein Bestandteil des Layoutschluessels", () => {
      const a = createBbmModuleLayoutStorageIdentity(registration(PROTOKOLL_SCOPES, "a"));
      const b = createBbmModuleLayoutStorageIdentity(registration(PROTOKOLL_SCOPES, "b"));
      const c = createBbmModuleLayoutStorageIdentity(registration(PROTOKOLL_SCOPES, "c-new"));
      assert.equal(a.layoutStorageKey, b.layoutStorageKey);
      assert.equal(b.layoutStorageKey, c.layoutStorageKey);
      assert.doesNotMatch(a.layoutStorageKey, /project|meeting|record|c-new/i);
      assert.equal(a.moduleId, "protokoll");
      assert.equal(a.registryVersion, 19);
      assert.match(a.registryFingerprint, /^sha256:[a-f0-9]{64}$/);
    });

    await run("M86.14 02: Save und Restore verwenden dieselbe zentrale Modulwurzel", () => {
      const input = registration(PROTOKOLL_SCOPES);
      const saveRoot = resolveBbmModuleLayoutProfileRoot(baseRoot, input);
      const restoreRoot = resolveBbmModuleLayoutProfileRoot(baseRoot, { ...input });
      assert.equal(saveRoot.profileRoot, restoreRoot.profileRoot);
      assert.equal(saveRoot.identity.layoutStorageKey, restoreRoot.identity.layoutStorageKey);
      assert.equal(path.dirname(saveRoot.profileRoot), path.resolve(baseRoot));
    });

    await run("M86.14 03: Protokoll und Restarbeiten besitzen getrennte globale Modullayouts", () => {
      const protocol = resolveBbmModuleLayoutProfileRoot(baseRoot, registration(PROTOKOLL_SCOPES));
      const remaining = resolveBbmModuleLayoutProfileRoot(baseRoot, registration(RESTARBEITEN_SCOPES));
      assert.notEqual(protocol.identity.layoutStorageKey, remaining.identity.layoutStorageKey);
      assert.notEqual(protocol.profileRoot, remaining.profileRoot);
      assert.equal(remaining.identity.moduleId, "restarbeiten");
    });

    await run("M86.14 04: Beide Modullayouts ueberleben einen vollstaendigen Loader-Neustart", () => {
      const protocolScope = scope(PROTOKOLL_SCOPES[0], "protokoll.test.field");
      const remainingScope = scope(RESTARBEITEN_SCOPES[0], "restarbeiten.test.field");
      const protocolRoot = resolveBbmModuleLayoutProfileRoot(baseRoot, registration(PROTOKOLL_SCOPES)).profileRoot;
      const remainingRoot = resolveBbmModuleLayoutProfileRoot(baseRoot, registration(RESTARBEITEN_SCOPES)).profileRoot;
      writeProfile(protocolRoot, profileDocument(protocolScope, "protokoll.test.field", 11));
      writeProfile(remainingRoot, profileDocument(remainingScope, "restarbeiten.test.field", 22));

      const protocolFile = path.join(protocolRoot, "standard.layout-profile.json");
      const remainingFile = path.join(remainingRoot, "standard.layout-profile.json");
      assert.equal(fs.existsSync(protocolFile), true);
      assert.equal(fs.existsSync(remainingFile), true);
      const protocolDocument = JSON.parse(fs.readFileSync(protocolFile, "utf8"));
      const remainingDocument = JSON.parse(fs.readFileSync(remainingFile, "utf8"));
      assert.equal(protocolDocument.scopes[0].scopeId, protocolScope.scopeId);
      assert.equal(remainingDocument.scopes[0].scopeId, remainingScope.scopeId);
      assert.equal(protocolDocument.scopes[0].registryFingerprint, createUiScopeFingerprint(protocolScope));
      assert.equal(remainingDocument.scopes[0].registryFingerprint, createUiScopeFingerprint(remainingScope));

      const protocolRestart = loadTargetStartupLayout({ profileRoot: protocolRoot, applicationId: "bbm-produktiv", activeScopes: [protocolScope.scopeId], registryScopes: [protocolScope] });
      const remainingRestart = loadTargetStartupLayout({ profileRoot: remainingRoot, applicationId: "bbm-produktiv", activeScopes: [remainingScope.scopeId], registryScopes: [remainingScope] });
      assert.equal(protocolRestart.ok, true);
      assert.equal(remainingRestart.ok, true);
      assert.equal(protocolRestart.found, true);
      assert.equal(remainingRestart.found, true);
      assert.equal(protocolRestart.scopes[0].elements[1].x, 11);
      assert.equal(remainingRestart.scopes[0].elements[1].x, 22);
    });

    await run("M86.14 05: Ein inkompatibler Scope-Fingerprint bleibt blockiert", () => {
      const protocolScope = scope(PROTOKOLL_SCOPES[1], "protokoll.invalid.field");
      const profileRoot = resolveBbmModuleLayoutProfileRoot(baseRoot, registration(PROTOKOLL_SCOPES)).profileRoot;
      const document = profileDocument(protocolScope, "protokoll.invalid.field", 33);
      document.scopes[0].registryFingerprint = `sha256:${"0".repeat(64)}`;
      writeProfile(profileRoot, document);
      const blocked = loadTargetStartupLayout({ profileRoot, applicationId: "bbm-produktiv", activeScopes: [protocolScope.scopeId], registryScopes: [protocolScope] });
      assert.equal(blocked.ok, false);
      assert.equal(blocked.state, "incompatible");
      assert.equal(blocked.code, "incompatible_registry");
    });

    await run("M86.14 06: Der Renderer verwaltet den einmaligen Start-Restore getrennt je Modul", async () => {
      const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
      assert.equal(host.createM80StartupRestoreKey(PROTOKOLL_SCOPES), "module-protokoll");
      assert.equal(host.createM80StartupRestoreKey(RESTARBEITEN_SCOPES), "module-restarbeiten");
    });

    await run("M86.14 07: Neu gerenderte Multi-Refs behalten den gespeicherten Working State", async () => {
      const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
      const previous = { window: global.window, CustomEvent: global.CustomEvent };
      const element = () => ({
        attributes: {}, dataset: {}, className: "", children: [], isConnected: true,
        style: { setProperty(name, value) { this[name] = value; }, getPropertyValue(name) { return this[name] || ""; } },
        classList: { contains() { return false; }, toggle() {} },
        setAttribute(name, value) { this.attributes[name] = String(value); },
        getAttribute(name) { return this.attributes[name] || null; },
        getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 20 }; },
      });
      global.window = { getComputedStyle: (target) => ({ ...target.style, width: "100px", height: "20px", fontSize: "10px", paddingLeft: "0px", paddingTop: "0px", boxSizing: "border-box" }), dispatchEvent() {} };
      global.CustomEvent = class { constructor(type) { this.type = type; } };
      try {
        const id = "restarbeiten.record.dueDate";
        const fallback = element();
        refs.resetM80PilotWorkingStatesForDiagnostic();
        refs.beginM80PilotRender();
        const first = [element(), element()];
        refs.registerM80MultiRef(id, first, fallback);
        refs.completeM80PilotRender();
        refs.applyM80State(id, { ...refs.snapshotM80State(id), x: 17 }, "move");
        refs.beginM80PilotRender();
        const next = [element(), element(), element()];
        refs.registerM80MultiRef(id, next, fallback);
        refs.completeM80PilotRender();
        next.forEach((target) => assert.equal(target.style.translate, "17px 0px"));
      } finally {
        refs.resetM80PilotWorkingStatesForDiagnostic();
        global.window = previous.window;
        global.CustomEvent = previous.CustomEvent;
      }
    });
  } finally {
    fs.rmSync(baseRoot, { recursive: true, force: true });
  }
}

module.exports = { runM8614GlobalLayoutRestoreTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runM8614GlobalLayoutRestoreTests(run).then(() => { if (failed) process.exitCode = 1; });
}
