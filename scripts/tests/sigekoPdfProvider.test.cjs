"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

async function runSigekoPdfProviderTests(run) {
  const { createPdfProviderBridge, isProviderRequest } = require("../../src/main/print/pdfProviderBridge");
  const { createModuleServiceProviderRegistry, PdfDocumentProvider } = require("../../src/main/moduleServiceProviders");
  const { createDeclarativePdfAdapter, persistedRegistryFingerprint } = require("../../src/main/ui-editor/declarativePdfAdapter.cjs");
  const { REGISTRY, DOCUMENT_TYPE_ID, SCOPE_ID } = require("../../src/main/ui-editor/technicalPdfAdapter.cjs");
  const payload = () => ({ mode: "provider", documentTypeId: DOCUMENT_TYPE_ID, providerRequest: {
    moduleId: "sigeko", providerId: DOCUMENT_TYPE_ID, projectId: "project-a", documentId: "document-a",
    data: { title: "Neutraler Titel", body: "Neutraler Inhalt" }, storage: { target: "Unterlagen" },
  } });
  const storage = { resolve: ({ projectId }) => {
    if (projectId !== "project-a") throw Object.assign(new Error("Projekt fehlt"), { code: "PROJECT_NOT_FOUND" });
    return { targets: { Unterlagen: "/fixture/SiGeKo/Unterlagen" } };
  } };
  const adapterFor = () => createDeclarativePdfAdapter({ documentTypeId: DOCUMENT_TYPE_ID, displayName: REGISTRY.displayName, registry: REGISTRY, documentIdentityFields: ["projectId", "documentId"] });
  await run("S1.4a: explicit provider identity and module guard precede content production", async () => {
    const guards = [];
    const bridge = createPdfProviderBridge({ storage, enforce: (moduleId) => guards.push(moduleId) });
    const source = payload();
    const result = await bridge.provide(source);
    assert.deepEqual(guards, ["sigeko"]);
    assert.equal(result.documentId, "document-a");
    assert.equal(result.projectId, "project-a");
    assert.deepEqual(result.providerDocument, source.providerRequest.data);
    assert.equal(isProviderRequest({ providerRequest: {} }), true);
    assert.equal(isProviderRequest({ mode: "protocol" }), false);
    const resolved = bridge.resolve(source);
    resolved.request.data.title = "Mutation";
    assert.equal(source.providerRequest.data.title, "Neutraler Titel");
    assert.equal(bridge.outputDirectory(source), "/fixture/SiGeKo/Unterlagen");
  });
  await run("S1.4a: malformed and mismatched provider contexts never fall back to protocol", () => {
    const bridge = createPdfProviderBridge({ storage, enforce: () => {} });
    const invalid = [ {}, { ...payload(), mode: "protocol" }, { ...payload(), documentTypeId: "protocol" },
      { ...payload(), projectId: "other" }, { ...payload(), documentId: "other" } ];
    for (const field of ["moduleId", "providerId", "projectId", "documentId"]) {
      const source = payload(); delete source.providerRequest[field]; invalid.push(source);
      const empty = payload(); empty.providerRequest[field] = " "; invalid.push(empty);
    }
    for (const source of invalid) assert.throws(() => bridge.resolve(source), { code: "PDF_PROVIDER_REQUEST_INVALID" });
    const unknown = payload(); unknown.providerRequest.providerId = unknown.documentTypeId = "unknown";
    assert.throws(() => bridge.resolve(unknown), { code: "PDF_PROVIDER_UNKNOWN" });
  });
  await run("S1.4a: denied license, missing project and invalid storage reject before provider execution", async () => {
    let calls = 0;
    const registry = createModuleServiceProviderRegistry();
    registry.register(PdfDocumentProvider({ moduleId: "sigeko", type: DOCUMENT_TYPE_ID, provide: () => { calls++; return {}; } }));
    const denied = createPdfProviderBridge({ registry, storage, enforce: () => { throw Object.assign(new Error("Denied"), { code: "DENIED" }); } });
    await assert.rejects(() => denied.provide(payload()), { code: "DENIED" });
    const bridge = createPdfProviderBridge({ registry, storage, enforce: () => {} });
    const missing = payload(); missing.providerRequest.projectId = "missing";
    await assert.rejects(() => bridge.provide(missing), { code: "PROJECT_NOT_FOUND" });
    const invalid = payload(); invalid.providerRequest.storage.target = "../escape";
    await assert.rejects(() => bridge.provide(invalid), { code: "PDF_STORAGE_TARGET_INVALID" });
    assert.equal(calls, 0);
    bridge.resolve(payload()); bridge.outputDirectory(payload()); assert.equal(calls, 0);
    await bridge.provide(payload()); assert.equal(calls, 1);
  });
  await run("S1.4a: bounded technical data rejects missing text and excess single-page input", async () => {
    const bridge = createPdfProviderBridge({ storage, enforce: () => {} });
    for (const data of [{}, { title: "a\nb", body: "Text" }, { title: "a".repeat(81), body: "Text" },
      { title: "Titel", body: "x".repeat(601) }, { title: "Titel", body: Array(11).fill("x").join("\n") }]) {
      const source = payload(); source.providerRequest.data = data;
      await assert.rejects(() => bridge.provide(source), { code: "PDF_PROVIDER_DATA_INVALID" });
    }
  });
  await run("S1.4a: fixed-layout text operations enforce limits atomically and lock domain changes", () => {
    const adapter = adapterFor();
    assert.equal(REGISTRY.layoutModel, "fixed-layout");
    assert.equal(REGISTRY.elements.filter((entry) => entry.kind === "table").length, 0);
    const request = { changeId: "font", scopeId: SCOPE_ID, elementId: `${SCOPE_ID}.title`, operation: "textResize", payload: { text: { fontSize: 15 } } };
    assert.equal(adapter.submitPdfChangeRequest(request).success, true);
    const before = adapter.getCurrentPdfLayoutState().elements;
    assert.equal(before.find((entry) => entry.elementId === request.elementId).fontSize, 15);
    for (const fontSize of [0, -1, 7, 17, null, "12", NaN, Infinity]) {
      assert.equal(adapter.submitPdfChangeRequest({ ...request, payload: { text: { fontSize } } }).success, false);
      assert.deepEqual(adapter.getCurrentPdfLayoutState().elements, before);
    }
    for (const operation of ["setPageBreakRule", "move", "setVisibility", "changeText", "modifyDomainData"]) {
      assert.equal(adapter.submitPdfChangeRequest({ ...request, operation }).success, false);
    }
    const invalid = adapter.getCurrentPdfLayoutState(); invalid.elements.at(-1).fontSize = 1000;
    assert.throws(() => adapter.replaceCurrentPdfLayoutState(invalid), { code: "pdf_layout_incompatible" });
    assert.deepEqual(adapter.getCurrentPdfLayoutState().elements, before);
  });
  await run("S1.4a: common profile restore preserves font size and rejects invalid persisted values", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-s14a-profile-"));
    try {
      const adapter = adapterFor(); const filePath = adapter.configureProfileRoot(root);
      const state = adapter.getCurrentPdfLayoutState(); state.elements.at(-1).fontSize = 13;
      const document = { schemaVersion: 1, documentKind: "pdf-layout-profile", applicationId: "bbm-produktiv", documentType: DOCUMENT_TYPE_ID,
        profileId: "pdf-standard", scopeId: SCOPE_ID, registryFingerprint: persistedRegistryFingerprint(REGISTRY), layoutState: state };
      fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, JSON.stringify(document));
      const reopened = adapterFor(); reopened.configureProfileRoot(root);
      assert.equal(reopened.getPersistedPdfLayoutState().elements.at(-1).fontSize, 13);
      state.elements.at(-1).fontSize = 1000; fs.writeFileSync(filePath, JSON.stringify(document));
      assert.throws(() => reopened.getPersistedPdfLayoutState(), { code: "pdf_profile_invalid" });
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
  await run("S1.4a: registered regeneration keeps explicit project, document, provider and storage context", async () => {
    const { createPdfEditorAdapterResolver } = require("../../src/main/ui-editor/pdfAdapterRegistry.cjs");
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-s14a-registry-"));
    try {
      let received;
      const resolver = createPdfEditorAdapterResolver({ profileBaseRoot: path.join(root, "profiles"), registrationRoot: root,
        regeneratePdf: async (request) => { received = request; return { controlledOutputPath: "/fixture/generated.pdf", pageCount: 1 }; } });
      resolver.activateAcceptedDocumentType(DOCUMENT_TYPE_ID);
      assert.equal(resolver.resolvePrintRegistration({ documentTypeId: DOCUMENT_TYPE_ID }).registration.documentTypeId, DOCUMENT_TYPE_ID);
      assert.equal(resolver.resolvePrintRegistration({ mode: "provider" }), null);
      const source = payload(); const context = { documentTypeId: DOCUMENT_TYPE_ID, projectId: "project-a", documentId: "document-a", providerRequest: source.providerRequest };
      assert.equal(resolver.setActiveDocumentContext(context).ok, true);
      const identity = resolver.getPdfContract().activeDocumentId;
      await resolver.regeneratePdfPreview();
      assert.deepEqual(received.providerRequest, source.providerRequest);
      assert.equal(received.projectId, context.projectId); assert.equal(received.documentId, context.documentId);
      assert.equal(received.mode, "provider"); assert.equal(received.targetDir, "temp");
      resolver.setActiveDocumentContext({ ...context, documentId: "other" });
      assert.notEqual(resolver.getPdfContract().activeDocumentId, identity);
      await assert.rejects(() => resolver.regeneratePdfPreview(), /Providerkontext/);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
  await run("S1.4a: print bridge contains no module implementation or second PDF engine", () => {
    const bridge = fs.readFileSync(path.join(__dirname, "../../src/main/print/pdfProviderBridge.js"), "utf8");
    assert.doesNotMatch(bridge, /sigeko|technicalPdfProvider|printToPDF/);
    const print = fs.readFileSync(path.join(__dirname, "../../src/main/ipc/printIpc.js"), "utf8");
    assert.equal((print.match(/\.printToPDF\(/g) || []).length, 1);
  });
}
module.exports = { runSigekoPdfProviderTests };
