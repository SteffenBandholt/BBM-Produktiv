"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { createRegistryFingerprint } = require("ui-editor-kit");
const ROOT = path.resolve(__dirname, "../..");
const esm = file => importEsmFromFile(path.join(ROOT, file));

async function runMeetingSeriesUiContractTests(run) {
  const registry = await esm("src/renderer/ui-editor/m80Registry.js");
  const contracts = registry.listM83ComponentContracts().filter(component => component.componentId.startsWith("bbm.projektverwaltung.meetingSeries"));
  await run("Besprechungsreihen UI: all new slots have full classification, explicit parents and domain locks", () => {
    assert.equal(contracts.length, 2);
    assert.deepEqual(contracts.map(component => component.slots.length), [14, 4]);
    for (const contract of contracts) {
      const ids = new Set(contract.slots.map(slot => slot.element.id));
      for (const slot of contract.slots) {
        const element = slot.element;
        for (const field of ["id", "name", "type", "role", "parentId", "order", "visible", "editable", "allowedOps", "lockedOps", "refKey"]) assert.ok(Object.hasOwn(element, field), element.id + "/" + field);
        if (element.parentId !== null) assert.ok(ids.has(element.parentId), element.id);
        for (const op of ["move", "resizeWidth", "resizeHeight", "setVisibility"]) assert.ok(element.allowedOps.includes(op), element.id);
        for (const op of ["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"]) {
          assert.ok(element.lockedOps.includes(op), element.id); assert.ok(!element.allowedOps.includes(op), element.id);
        }
        assert.equal(element.refKey, element.id);
        const attrs = registry.m80EditorAttributes(element.id);
        assert.equal(attrs["data-ui-editor-kind"], element.type);
        assert.equal(attrs["data-ui-editor-parent"], element.parentId || "");
        assert.equal(attrs["data-ui-editor-ops"], element.allowedOps.join(","));
        if (contract.componentId.endsWith("Entry")) { assert.equal(slot.referenceKind, "multi"); assert.equal(slot.required, false); assert.equal(slot.presence, "whenVisibleInstances"); }
        else assert.equal(slot.required, !element.id.endsWith(".history"));
      }
    }
  });
  await run("Projektübersicht UI: complete explicit component and histories belong only to edit fields", () => {
    const overview = registry.listM83ComponentContracts().find(component => component.componentId === "bbm.projektverwaltung.overview");
    assert.equal(overview.slots.length, 12);
    assert.equal(overview.requiredSlots.length, 5);
    const ids = new Set(overview.slots.map(slot => slot.element.id));
    for (const slot of overview.slots) {
      assert.equal(slot.element.refKey, slot.element.id);
      if (slot.element.parentId) assert.ok(ids.has(slot.element.parentId));
      for (const lock of ["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"]) assert.ok(slot.element.lockedOps.includes(lock));
      if (!slot.required) { assert.equal(slot.referenceKind, "multi"); assert.equal(slot.presence, "whenVisibleInstances"); }
    }
    assert.equal(contracts[1].slots.some(slot => slot.element.actionKind === "openProtocolHistory"), false);
    assert.equal(contracts[0].slots.filter(slot => slot.element.actionKind === "openProtocolHistory").length, 3);
    for (const slot of contracts[0].slots.filter(slot => slot.element.actionKind === "openProtocolHistory")) {
      assert.equal(slot.element.parentId, slot.element.id.replace(/\.history$/, ""));
      assert.equal(slot.required, false); assert.equal(slot.presence, "whenVisibleInstances");
    }
  });
  const { projectCardDetails } = await esm("src/renderer/modules/projektverwaltung/screens/ProjectOverview.js");
  await run("Projektübersicht UI: distinct name/short and partial site addresses contain no placeholders", () => {
    assert.deepEqual(projectCardDetails({ name: "Haus", short: "Haus", street: "Weg 1", city: "Ort" }), { name: "Haus", short: "", number: "", address: "Weg 1\nOrt" });
    assert.deepEqual(projectCardDetails({ name: "Langer Name", short: "LN", zip: "12345" }), { name: "Langer Name", short: "LN", number: "", address: "12345" });
    assert.equal(projectCardDetails({ name: "Haus" }).address, "");
    assert.equal(projectCardDetails({ short: "Kurz", street: "  ", zip: null, city: undefined }).name, "Kurz");
  });
  await run("Projektübersicht UI: compact grid fits four 280 CSS-pixel cards without changing the card contract", () => {
    const source = fs.readFileSync(path.join(ROOT, "src/renderer/modules/projektverwaltung/screens/ProjectOverview.js"), "utf8");
    assert.match(source, /grid-template-columns:repeat\(auto-fill,minmax\(min\(100%,200px\),240px\)\)/);
    assert.match(source, /width:100%;max-width:240px/);
    assert.match(source, /gap:3px;padding:8px/);
    assert.match(source, /font-weight:800;font-size:14px/);
    assert.match(source, /flex-wrap:nowrap;gap:4px/);
    assert.match(source, /justify-content:start/);
    const overview = registry.listM83ComponentContracts().find(component => component.componentId === "bbm.projektverwaltung.overview");
    assert.equal(overview.slots.find(slot => slot.element.id === "projektverwaltung.overview.card").element.baseline.maxWidth, 240);
  });
  const { default: ProjectsScreen } = await esm("src/renderer/modules/projektverwaltung/screens/ProjectsScreen.js");
  await run("Projektübersicht UI: the existing profile store remembers only a valid selected series per project", () => {
    const hadWindow = Object.hasOwn(global, "window");
    const previousWindow = global.window;
    const values = new Map();
    global.window = { localStorage: {
      getItem: key => values.get(key) || null,
      setItem: (key, value) => values.set(key, String(value)),
    } };
    try {
      const original = Object.create(ProjectsScreen.prototype);
      assert.equal(original._lastProjectSeries("project-a"), "");
      original._rememberLastProjectSeries("project-a", "owner");
      original._rememberLastProjectSeries("project-b", "planning");
      original._rememberLastProjectSeries("project-a", "invalid");
      const restarted = Object.create(ProjectsScreen.prototype);
      assert.equal(restarted._lastProjectSeries("project-a"), "owner");
      assert.equal(restarted._lastProjectSeries("project-b"), "planning");
      assert.equal(restarted._lastProjectSeries("project-c"), "");
    } finally {
      if (hadWindow) global.window = previousWindow;
      else delete global.window;
    }
  });
  await run("Besprechungsreihen UI: target manifest agrees with complete productive registry", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "ui-editor-target.json"), "utf8"));
    assert.equal(manifest.registryVersion, registry.BBM_M80_REGISTRY_VERSION);
    assert.equal(manifest.registryFingerprint, createRegistryFingerprint(registry.listM80RegistryScopes()));
    assert.deepEqual(manifest.activeScopes, registry.BBM_M80_ACTIVE_SCOPES);
    for (const contract of contracts) assert.equal(manifest.scopes.find(scope => scope.scopeId === contract.scopeId).elementCount, contract.slots.length);
  });
  const { default: ProjectsHubScreen } = await esm("src/renderer/modules/projektverwaltung/screens/ProjectsHubScreen.js");
  await run("Besprechungsreihen UI: productive project hub preserves licensed Protokoll entry only", () => {
    const hub = Object.create(ProjectsHubScreen.prototype);
    hub.router = { _getProjectWorkspaceModules: () => [
      { moduleId: "protokoll", navigationKey: "meetings", label: "Protokoll" },
      { moduleId: "restarbeiten", navigationKey: "restarbeiten", label: "Restarbeiten" },
    ] };
    assert.deepEqual(hub._getProjectTileModuleActions({ id: "p" }).map(action => action.moduleId), ["protokoll"]);
    hub.router._getProjectWorkspaceModules = () => [];
    assert.deepEqual(hub._getProjectTileModuleActions({ id: "p" }), []);
  });
  const { default: ParticipantsModalsBase } = await esm("src/renderer/ui/ParticipantsModalsBase.js");
  await run("Besprechungsreihen UI: historical participant context never switches to another open meeting", async () => {
    const previousWindow = global.window;
    let requested = 0;
    global.window = { bbmDb: { meetingsListByProject: async () => { requested++; return { ok: true, list: [
      { id: "closed-construction", series_key: "construction", is_closed: 1, meeting_index: 1 },
      { id: "open-owner", series_key: "owner", is_closed: 0, meeting_index: 2 },
    ] }; } } };
    try {
      const modal = Object.create(ParticipantsModalsBase.prototype);
      modal.projectId = "p"; modal.meetingId = "closed-construction"; modal.router = { currentSeriesKey: "construction" };
      await modal._ensureOpenMeetingContext();
      assert.equal(modal.meetingId, "closed-construction"); assert.equal(requested, 0);
    } finally { global.window = previousWindow; }
  });
}
module.exports = { runMeetingSeriesUiContractTests };
