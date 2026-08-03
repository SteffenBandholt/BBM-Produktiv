"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function createFakeButtonDocument() {
  const makeNode = () => ({
    children: [], style: {}, attributes: {}, textContent: "", type: "", className: "", disabled: false,
    appendChild(child) { this.children.push(child); return child; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name] || null; },
    addEventListener(type, listener) { this.listeners ||= {}; this.listeners[type] = listener; },
    querySelector(selector) {
      return this.children.find((child) => selector === '[data-bbm-development-ui-editor-open="true"]' && child.getAttribute?.("data-bbm-development-ui-editor-open") === "true") || null;
    },
  });
  return { createElement: () => makeNode() };
}

async function runM863EditorStartMetaRepairTests(run) {
  await run("M86.3 Sidebar: Restarbeiten nutzt den bestehenden modulgebundenen Sidebar-Lebenszyklus", () => {
    assert.match(read("src/renderer/modules/restarbeiten/index.js"), /hideSidebar:\s*true/);
    const router = read("src/renderer/app/Router.js");
    assert.match(router, /this\._setSidebarVisibility\(!hideSidebar\)/);
    assert.match(router, /sidebar\.style\.display\s*=\s*isVisible\s*\?\s*"flex"\s*:\s*"none"/);
  });

  await run("M86.3 Editorstart: gemeinsamer DEV-Launcher öffnet nach Registry-Refresh und aktiviert den expliziten Scope", async () => {
    const navigation = await importEsmFromFile(path.join(ROOT, "src/renderer/app/coreShellNavigation.js"));
    assert.equal(await navigation.isDevelopmentUiEditorBuild({ api: { appGetBuildChannel: async () => ({ ok: true, channel: "DEV" }) } }), true);
    assert.equal(await navigation.isDevelopmentUiEditorBuild({ api: { appGetBuildChannel: async () => ({ ok: true, channel: "STABLE" }) } }), false);

    const doc = createFakeButtonDocument();
    const host = doc.createElement("div");
    const button = await navigation.installDevelopmentUiEditorOpenButton({
      host, scopeId: "protokoll.screen.root", doc,
      buildApi: { appGetBuildChannel: async () => ({ ok: true, channel: "DEV" }) },
    });
    assert.equal(button.textContent, "UI-Editor öffnen");
    assert.equal(button.getAttribute("data-bbm-development-ui-editor-open"), "true");
    assert.equal(typeof button.listeners.click, "function");
    const hidden = await navigation.installDevelopmentUiEditorOpenButton({
      host: doc.createElement("div"), scopeId: "restarbeiten.header.root", doc,
      buildApi: { appGetBuildChannel: async () => ({ ok: true, channel: "STABLE" }) },
    });
    assert.equal(hidden, null);

    const source = read("src/renderer/app/coreShellNavigation.js");
    assert.ok(source.indexOf("const result = await api.open(registration);") < source.indexOf('action: "scopeChanged"'));
    assert.match(source, /scopeId:\s*activeScopeId/);
  });

  await run("M86.3 Module: der gemeinsame Header nutzt die expliziten Entwicklungs-Scopes", () => {
    const protokollHeader = read("src/renderer/modules/protokoll/TopsHeader.js");
    const restarbeitenHeader = read("src/renderer/modules/restarbeiten/RestarbeitenFilterbar.js");
    const mainHeader = read("src/renderer/ui/MainHeader.js");
    const router = read("src/renderer/app/Router.js");
    const navigation = read("src/renderer/app/coreShellNavigation.js");
    const protokollScreen = read("src/renderer/modules/protokoll/screens/TopsScreen.js");
    const restarbeitenScreen = read("src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js");
    assert.doesNotMatch(protokollHeader, /installDevelopmentUiEditorOpenButton/);
    assert.doesNotMatch(restarbeitenHeader, /installDevelopmentUiEditorOpenButton/);
    assert.match(mainHeader, /installDevelopmentUiEditorOpenButton/);
    assert.match(mainHeader, /this\.elDevControls/);
    assert.match(mainHeader, /_syncDevelopmentUiEditorLauncher\(\)/);
    assert.match(router, /context\.ui\.uiEditorScopeId\s*=\s*String\(v\?\.uiEditorScopeId/);
    assert.doesNotMatch(navigation, /key:\s*"uiEditor"/);
    assert.match(protokollScreen, /uiEditorScopeId\s*=\s*"protokoll\.screen\.root"/);
    assert.match(restarbeitenScreen, /uiEditorScopeId\s*=\s*"restarbeiten\.header\.root"/);
    assert.doesNotMatch(protokollHeader, /data-ui-editor-id.*UI-Editor/);
    assert.doesNotMatch(restarbeitenHeader, /data-ui-editor-id.*UI-Editor/);
  });

  await run("M86.3 Workbench: die rechte Meta-Spalte bleibt in der bestehenden Editbox-Geometrie", () => {
    const css = read("src/renderer/modules/protokoll/styles/tops.css");
    assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) clamp\(180px, 22vw, 214px\)/);
    assert.doesNotMatch(css, /@media \(max-width: 640px\)[\s\S]*?\.bbm-tops-workbench-body\s*\{\s*grid-template-columns:\s*1fr/s);
  });

  await run("M86.3.1 Erreichbarkeit: Statushinweis blockiert keine Ziel-App und wird entfernt", () => {
    const navigation = read("src/renderer/app/coreShellNavigation.js");
    assert.match(navigation, /data-bbm-ui-editor-registry-status/);
    assert.match(navigation, /pointer-events:none/);
    assert.match(navigation, /state !== "checking"/);
    assert.match(navigation, /status\.remove\?\.\(\)/);
  });

  await run("M86.3.1 Erreichbarkeit: kurzer Viewport komprimiert nur die bestehende Quicklane", () => {
    const css = read("src/renderer/modules/protokoll/styles/tops.css");
    assert.match(css, /@media \(max-width: 1100px\)[\s\S]*?\[data-bbm-tops-screen="true"\]\s*\{[\s\S]*?padding-inline-end:\s*64px/s);
    assert.match(css, /\.bbm-tops-screen-quicklane\s*\{[\s\S]*?inset-block-start:\s*102px/s);
    assert.match(css, /\.bbm-tops-screen-quicklane:focus-within/);
    assert.match(css, /@media \(max-height: 520px\)[\s\S]*?inset-block-start:\s*72px[\s\S]*?\.bbm-tops-screen-quicklane__button\s*\{[\s\S]*?inline-size:\s*28px[\s\S]*?block-size:\s*28px/s);
    assert.match(css, /@media \(max-height: 420px\)[\s\S]*?inset-block-start:\s*69px[\s\S]*?inset-block-end:\s*0[\s\S]*?\.bbm-tops-screen-quicklane__button\s*\{[\s\S]*?inline-size:\s*22px[\s\S]*?block-size:\s*22px/s);
    assert.doesNotMatch(css, /\.bbm-tops-screen-quicklane[^{]*\{[^}]*overflow-y:\s*(auto|scroll)/s);
  });

  await run("M86.3.1 Erreichbarkeit: Liste bleibt einziger aktiver Protokoll-Scrollbesitzer", () => {
    const css = read("src/renderer/modules/protokoll/styles/tops.css");
    assert.match(css, /\[data-bbm-tops-screen-area="sheet"\]\s*\{[\s\S]*?min-height:\s*0[\s\S]*?overflow:\s*auto/s);
    assert.match(css, /\[data-bbm-tops-screen-area="edit"\]\s*\{[\s\S]*?flex:\s*0 0 auto/s);
    assert.doesNotMatch(css, /\.bbm-tops-workbench\s*\{[^}]*overflow-y:\s*(auto|scroll)/s);
  });

  await run("M86.3.1 Restarbeiten-Acceptance blendet die Shell-Sidebar ueber den vorhandenen Router aus", () => {
    const diagnostic = read("src/renderer/ui-editor/m80Diagnostic.js");
    assert.match(diagnostic, /if \(module === "protokoll"\)[\s\S]*?router\._setSidebarVisibility\?\.\(false\)/s);
  });
}

if (require.main === module) {
  runM863EditorStartMetaRepairTests(async (_name, fn) => fn()).then(() => {
    if (!process.exitCode) console.log("m86-3EditorStartMetaRepair.test.cjs passed");
  }).catch((error) => { console.error(error); process.exitCode = 1; });
}

module.exports = { runM863EditorStartMetaRepairTests };
