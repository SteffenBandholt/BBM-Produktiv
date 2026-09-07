const { PDF_TARGET_OPERATIONS, PDF_TARGET_CONTRACT_VERSION, createPdfRegistryFingerprint } = require("ui-editor-kit");
const { createDeclarativePdfAdapter } = require("./declarativePdfAdapter.cjs");
const { registerPdfEditorAdapter } = require("./pdfAdapterRegistry.cjs");
const DOCUMENT_TYPE_ID = "technical-neutral";
const SCOPE_ID = "pdf.bbm.technical-neutral";
function element(suffix, parent, kind, selector, order, width, height, fontSize) {
  const capabilities = fontSize ? ["textResize"] : [];
  return {
    id: suffix ? `${SCOPE_ID}.${suffix}` : SCOPE_ID, name: ({ page: "Seite", title: "Titel", body: "Text" })[suffix] || "Technisches Dokument", scopeId: SCOPE_ID,
    parentId: parent, kind, role: fontSize ? "content" : "layout", pageArea: suffix === "title" ? "header" : fontSize ? "body" : "document",
    order, visible: true, editable: capabilities.length > 0, capabilities, allowedOps: capabilities,
    lockedOps: [...PDF_TARGET_OPERATIONS.filter(op => !capabilities.includes(op)), "changeText", "modifyDomainData"],
    baseline: { x: fontSize ? 12 : 0, y: suffix === "title" ? 18 : suffix === "body" ? 61 : 0, width, height, visible: true, ...(fontSize ? { fontSize } : {}) },
    layoutBounds: { minX: 0, maxX: 210, minY: 0, maxY: 297, minWidth: 1, maxWidth: 210, minHeight: 1, maxHeight: 297, minFontSize: 8, maxFontSize: 16 },
    refKey: `technical.${suffix || "document"}`, rendererKey: selector,
  };
}
const base = { applicationId: "bbm-produktiv", documentTypeId: DOCUMENT_TYPE_ID, displayName: "Technisches Dokument", scopeId: SCOPE_ID,
  unit: "mm", registryVersion: 1, layoutModel: "fixed-layout",
  pageSettings: { format: "A4", orientation: "portrait", width: 210, height: 297, margins: { top: 10, right: 12, bottom: 10, left: 12 } },
  elements: [element("", null, "document", ".printRoot", 0, 210, 297),
    element("page", SCOPE_ID, "page", ".page", 1, 210, 297),
    element("title", `${SCOPE_ID}.page`, "text", ".providerTitle", 2, 186, 20, 14),
    element("body", `${SCOPE_ID}.page`, "text", ".providerBody", 3, 186, 150, 11)] };
const REGISTRY = { ...base, registryFingerprint: createPdfRegistryFingerprint(base) };
const adapter = createDeclarativePdfAdapter({ applicationId: "bbm-produktiv", documentTypeId: DOCUMENT_TYPE_ID, displayName: "Technisches Dokument", registry: REGISTRY, documentIdentityFields: ["projectId", "documentId"] });
registerPdfEditorAdapter({ documentTypeId: DOCUMENT_TYPE_ID, moduleId: "sigeko", scopeId: SCOPE_ID, profileStorageKey: "module-sigeko-technical", displayName: "Technisches Dokument",
  contractVersion: PDF_TARGET_CONTRACT_VERSION, printModes: [], adapter, builtIn: true,
  buildRegenerationRequest(context) {
    if (!context.providerRequest || context.providerRequest.projectId !== context.projectId ||
        context.providerRequest.documentId !== context.documentId ||
        context.providerRequest.moduleId !== "sigeko" || context.providerRequest.providerId !== DOCUMENT_TYPE_ID) throw new Error("Expliziter Providerkontext fuer Regeneration fehlt.");
    return { mode: "provider", documentTypeId: DOCUMENT_TYPE_ID, projectId: context.projectId, documentId: context.documentId, providerRequest: structuredClone(context.providerRequest), targetDir: "temp", fileName: "Technisches-Dokument-Editor.pdf" };
  },
});
module.exports = { DOCUMENT_TYPE_ID, SCOPE_ID, REGISTRY };
