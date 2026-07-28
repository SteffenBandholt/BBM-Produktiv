"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { createRegistryFingerprint } = require("ui-editor-kit");

const ROOT = path.resolve(__dirname, "../..");

async function runM82AppStarterPackageTests(run) {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "ui-editor-target.json"), "utf8"));
  const ownership = JSON.parse(fs.readFileSync(path.join(ROOT, ".ui-editor-kit", "starter-installation.json"), "utf8"));

  await run("M82 BBM: existing-app, Electron und vorhandener Adapter sind ehrlich deklariert", () => {
    assert.equal(manifest.schemaVersion, 2);
    assert.equal(manifest.starterPackageVersion, "1.0.0");
    assert.equal(manifest.applicationId, "bbm-produktiv");
    assert.equal(manifest.framework, "electron");
    assert.equal(manifest.integrationMode, "existing-app");
    assert.equal(manifest.contractVersion, "1.2");
    assert.equal(manifest.adapterVersion, "1.2");
    assert.equal(manifest.registryStatus, "incomplete");
  });

  await run("M82 BBM: vorhandene Registry und Bridge bleiben einzige produktfuehrende Integration", () => {
    assert.ok(fs.existsSync(path.join(ROOT, "src/main/ui-editor/electronUiEditorSession.js")));
    assert.ok(fs.existsSync(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js")));
    assert.ok(fs.existsSync(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js")));
    assert.deepEqual(ownership.files.map((entry) => entry.relativePath).sort(), [
      ".ui-editor-kit/starter-installation.json",
      "ui-editor-target.json",
    ]);
    assert.equal(ownership.productName, "App-Starterpaket");
  });

  await run("M82 BBM: Registryversion und Fingerprint stimmen mit der expliziten M80.2-Registry ueberein", async () => {
    const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
    assert.equal(manifest.registryVersion, registry.BBM_M80_REGISTRY_VERSION);
    assert.equal(manifest.registryFingerprint, createRegistryFingerprint(registry.listM80RegistryScopes()));
    assert.deepEqual(manifest.activeScopes, registry.BBM_M80_ACTIVE_SCOPES);
  });

  await run("M82 BBM: drei Restarbeiten-Scopes sind vollstaendig und andere Bereiche bleiben blockiert", () => {
    const byId = new Map(manifest.scopes.map((scope) => [scope.scopeId, scope]));
    assert.equal(byId.get("restarbeiten.header.root").status, "complete");
    assert.equal(byId.get("restarbeiten.header.root").elementCount, 31);
    assert.equal(byId.get("restarbeiten.list.root").status, "complete");
    assert.equal(byId.get("restarbeiten.list.root").elementCount, 7);
    assert.equal(byId.get("restarbeiten.edit.root").status, "complete");
    assert.equal(byId.get("restarbeiten.edit.root").elementCount, 53);
    assert.equal(byId.get("bbm.remaining").status, "blocked");
    assert.equal(byId.get("bbm.remaining").reason, "registration_inventory_pending");
  });

  await run("M82 BBM: PDF-Pilot und Profil-Recovery sind verfuegbar", () => {
    const pdf = manifest.scopes.find((scope) => scope.scopeId === "pdf.bbm.protocol");
    assert.equal(manifest.pdfCapability, "available");
    assert.equal(pdf.status, "complete");
    assert.equal(pdf.elementCount, 28);
    assert.ok(fs.existsSync(path.join(ROOT, "src/main/ui-editor/bbmPdfAdapter.cjs")));
    const session = fs.readFileSync(path.join(ROOT, "src/main/ui-editor/electronUiEditorSession.js"), "utf8");
    assert.match(session, /PROFILE_INCOMPATIBLE/);
    assert.match(session, /PROFILE_USER_CANCELLED/);
  });

  await run("M82 BBM: UI-Editor-Start und Registry-Refresh bleiben unveraendert fuehrend", () => {
    const navigation = fs.readFileSync(path.join(ROOT, "src/renderer/app/coreShellNavigation.js"), "utf8");
    const main = fs.readFileSync(path.join(ROOT, "src/main/main.js"), "utf8");
    const session = fs.readFileSync(path.join(ROOT, "src/main/ui-editor/electronUiEditorSession.js"), "utf8");
    assert.match(navigation, /UI-Editor öffnen/);
    assert.match(navigation, /createM80RegistrationDescriptor/);
    assert.match(main, /--open-ui-editor/);
    assert.match(main, /openNativeUiEditor/);
    for (const event of ["registryChanged", "registryStatusChanged", "scopeAdded", "scopeChanged", "scopeRemoved"]) assert.match(session, new RegExp(event));
  });

  await run("M82 BBM: Manifest enthaelt keine Fach- oder Kundendaten", () => {
    const text = JSON.stringify(manifest);
    for (const forbidden of ["domainData", "businessData", "customerData", "database", "records", "rows", "values"]) assert.equal(text.includes(forbidden), false, forbidden);
  });
}

module.exports = { runM82AppStarterPackageTests };
