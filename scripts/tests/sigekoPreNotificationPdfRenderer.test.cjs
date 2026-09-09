"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { REGISTRY, DOCUMENT_TYPE_ID, SCOPE_ID, createSigekoPreNotificationPdfAdapter, buildRegenerationRequest } = require("../../src/main/ui-editor/sigekoPreNotificationPdfAdapter.cjs");
const { persistedRegistryFingerprint } = require("../../src/main/ui-editor/declarativePdfAdapter.cjs");
const clone = value => structuredClone(value);
const contact = name => ({ name, street: "Grüner Weg 3", zip: "01234", city: "München", phone: "0123 456", email: "kontakt@example.test" });
const dataFor = () => ({ mode: "provider", documentTypeId: DOCUMENT_TYPE_ID, projectId: "project-a", documentId: "document-a",
  pdfEditorRegistry: clone(REGISTRY), pdfEditorLayoutState: createSigekoPreNotificationPdfAdapter().getCurrentPdfLayoutState(),
  providerDocument: { kind: DOCUMENT_TYPE_ID, snapshot: { schemaVersion: 1, documentTypeId: DOCUMENT_TYPE_ID, projectId: "project-a", documentId: "document-a",
    form: { address: { street: "Baustraße 7", zip: "00123", city: "Köln" }, authority: { organization: "Amt für Arbeitsschutz", street: "Amtsweg 2", zip: "54321", city: "Düsseldorf" },
      builder: contact("Bauherr GmbH"), thirdParty: null, planning: contact("Planung Müller"), execution: contact("Ausführung Weiß"), buildingType: "Neubau Wohnhaus",
      plannedStart: "2028-02-29", durationMonths: 7, maxWorkers: 0, employerCount: 13, selfEmployedCount: 2, firmsMode: "unknown" } } } });

// This models explicit refs and injected measurements. Actual CSS, fonts and PDF
// geometry are separately asserted by the Windows/Linux Electron acceptance.
class Element {
  constructor(tag = "div") { this.tagName = tag.toUpperCase(); this.children = []; this.parentElement = null; this.attributes = {}; this.style = {}; this.className = ""; this._text = ""; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key] ?? null; }
  appendChild(node) { node.remove(); node.parentElement = this; this.children.push(node); return node; }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  set textContent(text) { this._text = String(text); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(""); }
  matches(selector) {
    if (selector.startsWith(".")) return this.className.split(/\s+/).includes(selector.slice(1));
    const attr = selector.match(/^\[([^=]+)="([^"]+)"\]$/); return !!attr && this.getAttribute(attr[1]) === attr[2];
  }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  getBoundingClientRect() { return this.rect; }
}
const rect = (x, y, width, height) => ({ left: x, top: y, right: x + width, bottom: y + height, width, height });
function mount(body) {
  const root = new Element(); root.className = "printRoot";
  const page = root.appendChild(new Element()); page.className = "page";
  for (const className of ["v2GlobalHeaderBlock", "v2HeaderFull"]) { const node = page.appendChild(new Element()); node.className = className; }
  page.appendChild(body);
  const footer = page.appendChild(new Element()); footer.className = "v2FooterReserveSpacer"; footer.rect = rect(12, 285, 186, 12);
  for (const entry of REGISTRY.elements) {
    const node = entry.kind === "document" ? root : root.querySelector(entry.rendererKey);
    assert.ok(node, entry.id); node.rect = rect(entry.baseline.x, entry.baseline.y, entry.baseline.width, entry.baseline.height);
    node.clientWidth = node.scrollWidth = entry.baseline.width; node.clientHeight = node.scrollHeight = entry.baseline.height;
  }
  return root;
}

async function runSigekoPreNotificationPdfRendererTests(run) {
  const renderer = await importEsmFromFile(path.resolve(__dirname, "../../src/renderer/modules/sigeko/print/PreNotificationPdfContent.js"));
  const { applyBbmPdfEditorLayout } = await importEsmFromFile(path.resolve(__dirname, "../../src/renderer/print/pdfEditorLayout.js"));
  const prior = { document: global.document, getComputedStyle: global.getComputedStyle };
  global.document = { createElement: tag => new Element(tag) };
  global.getComputedStyle = () => ({ paddingLeft: "12", paddingRight: "12", paddingTop: "5" });
  try {
    await run("S5.3b2: VA registry declares exactly eighty stable targets with valid parents and text-only permissions", () => {
      assert.equal(REGISTRY.elements.length, 80); assert.equal(new Set(REGISTRY.elements.map(entry => entry.id)).size, 80);
      assert.equal(REGISTRY.layoutModel, "fixed-layout"); assert.equal(REGISTRY.pageSettings.orientation, "portrait");
      for (const entry of REGISTRY.elements) {
        assert.equal(entry.id.startsWith(SCOPE_ID), true); assert.equal(entry.parentId === null, entry.id === SCOPE_ID);
        if (entry.parentId) assert.ok(REGISTRY.elements.some(parent => parent.id === entry.parentId));
        assert.deepEqual(entry.allowedOps, ["label", "value"].includes(entry.kind) ? ["textResize"] : []);
        assert.equal(entry.editable, entry.allowedOps.length > 0);
        assert.equal(["table", "tableColumn"].includes(entry.kind), false);
        for (const operation of ["move", "resize", "setVisibility", "setPageBreakRule", "changeText", "modifyDomainData", "save", "import", "export"]) assert.ok(entry.lockedOps.includes(operation), `${entry.id}: ${operation}`);
      }
    });
    await run("S5.3b2: rendered VA uses frozen fields with distinct roles counts whole months zero and blank signature", () => {
      const data = dataFor(), before = clone(data); const content = renderer.buildPreNotificationPdfContent(data), root = mount(content.body);
      assert.equal(content.headerMode, "standard"); assert.equal(content.fullHeader, undefined);
      const value = suffix => root.querySelector(`[data-sigeko-va-pdf="${suffix}"]`).textContent;
      assert.equal(value("p5.planning.name"), "Planung Müller"); assert.equal(value("p5.execution.name"), "Ausführung Weiß");
      assert.equal(value("p6.start.value"), "29.02.2028"); assert.equal(value("p6.duration.value"), "7"); assert.equal(value("p6.duration.unit"), "Monate");
      assert.equal(value("p7.value"), "0"); assert.equal(value("p8.employers.value"), "13"); assert.equal(value("p8.selfEmployed.value"), "2");
      assert.equal(value("p1.zip"), "00123"); assert.equal(value("authority.name"), "Amt für Arbeitsschutz");
      assert.equal(value("p4.name"), "Nicht vorhanden"); assert.equal(value("p4.email"), "");
      assert.equal(value("p2.phone"), "Telefon: 0123 456"); assert.equal(value("p2.email"), "E-Mail: kontakt@example.test");
      assert.equal(value("signature.placeDate.blank"), ""); assert.equal(value("signature.signer.blank"), "");
      assert.equal(value("p9.value"), "Noch nicht bekannt"); assert.deepEqual(data, before);
      data.providerDocument.snapshot.form.firmsMode = "attachment";
      const attachment = renderer.buildPreNotificationPdfContent(data).body;
      assert.equal(attachment.querySelector('[data-sigeko-va-pdf="p9.value"]').textContent, "Firmenliste siehe Anlage");
    });
    await run("S5.3b2: existing PDF layout bridge mounts all six declared attributes and exactly one valid parent ref", () => {
      const data = dataFor(), root = mount(renderer.buildPreNotificationPdfContent(data).body);
      applyBbmPdfEditorLayout(root, data);
      for (const entry of REGISTRY.elements) {
        const nodes = entry.kind === "document" ? [root] : root.querySelectorAll(entry.rendererKey); assert.equal(nodes.length, 1);
        const node = nodes[0];
        for (const [key, value] of Object.entries({ "data-ui-inspector-id": entry.id, "data-ui-editor-kind": entry.kind,
          "data-ui-editor-label": entry.name, "data-ui-editor-parent": entry.parentId || "", "data-ui-editor-editable": String(entry.editable), "data-ui-editor-ops": entry.allowedOps.join(",") })) assert.equal(node.getAttribute(key), value);
        if (entry.parentId) { const parent = entry.parentId === SCOPE_ID ? root : root.querySelector(REGISTRY.elements.find(item => item.id === entry.parentId).rendererKey); assert.ok(parent.contains(node)); }
      }
      const text = root.querySelector('[data-sigeko-va-pdf="p3.value"]');
      data.pdfEditorLayoutState.elements.find(entry => entry.elementId === `${SCOPE_ID}.p3.value`).fontSize = 10;
      applyBbmPdfEditorLayout(root, data); assert.equal(text.style.fontSize, "10pt"); assert.equal(text.textContent, "Neubau Wohnhaus");
    });
    await run("S5.3b2: VA renderer rejects absent foreign and mismatched snapshot contracts", () => {
      for (const patch of [data => { data.projectId = "foreign"; }, data => { data.documentId = "foreign"; }, data => { data.mode = "invoice"; },
        data => { data.providerDocument.snapshot.schemaVersion = 2; }, data => { data.pdfEditorRegistry.elements.pop(); }, data => { data.pdfEditorRegistry.scopeId = "foreign"; }]) {
        const data = dataFor(); patch(data); assert.throws(() => renderer.buildPreNotificationPdfContent(data), { code: "PDF_PROVIDER_DATA_INVALID" });
      }
    });
    await run("S5.3b2: overflow guard names the actual field and rejects footer overlap nonfinite bounds and hidden fields", () => {
      for (const change of [node => { node.scrollHeight += 3; }, node => { node.rect.bottom = 288; }, node => { node.rect.width = 0; }, node => { node.rect.top = NaN; }]) {
        const data = dataFor(), root = mount(renderer.buildPreNotificationPdfContent(data).body); renderer.validatePreNotificationPdfLayout(root, data);
        change(root.querySelector('[data-sigeko-va-pdf="p3.value"]'));
        assert.throws(() => renderer.validatePreNotificationPdfLayout(root, data), error => error.code === "PDF_PROVIDER_LAYOUT_OVERFLOW" && error.field === "p3.value" && /Art des Bauvorhabens/.test(error.message));
      }
    });
    await run("S5.3b2: overflow guard rejects duplicate missing and reparented explicit refs", () => {
      for (const change of [root => root.querySelector('[data-sigeko-va-pdf="p3.value"]').remove(),
        root => { const duplicate = new Element(); duplicate.setAttribute("data-sigeko-va-pdf", "p3.value"); root.appendChild(duplicate); },
        root => root.appendChild(root.querySelector('[data-sigeko-va-pdf="p3.value"]'))]) {
        const data = dataFor(), root = mount(renderer.buildPreNotificationPdfContent(data).body); change(root);
        assert.throws(() => renderer.validatePreNotificationPdfLayout(root, data), { code: "PDF_PROVIDER_DATA_INVALID" });
      }
    });
    await run("S5.3b2: VA textResize limits reject atomically and session rollback restores the previous layout", () => {
      const adapter = createSigekoPreNotificationPdfAdapter();
      const request = { changeId: "va-font", scopeId: SCOPE_ID, elementId: `${SCOPE_ID}.p3.value`, operation: "textResize", payload: { text: { fontSize: 10 } } };
      assert.equal(adapter.submitPdfChangeRequest(request).success, true); const changed = adapter.getCurrentPdfLayoutState().elements;
      for (const fontSize of [7, 13, 0, null, "10", Infinity, NaN]) { assert.equal(adapter.submitPdfChangeRequest({ ...request, payload: { text: { fontSize } } }).success, false); assert.deepEqual(adapter.getCurrentPdfLayoutState().elements, changed); }
      for (const operation of ["setVisibility", "move", "resizeHeight", "setPageBreakRule", "changeText", "modifyDomainData"]) assert.equal(adapter.submitPdfChangeRequest({ ...request, operation }).success, false);
      assert.equal(adapter.submitPdfChangeRequest({ ...request, elementId: `${SCOPE_ID}.body` }).success, false);
      const receipt = adapter.preparePdfEditorSessionBaseline(); assert.equal(adapter.getCurrentPdfLayoutState().elements.find(entry => entry.elementId === request.elementId).fontSize, 9);
      assert.equal(adapter.rollbackPdfEditorSessionPreparation(receipt), true); assert.deepEqual(adapter.getCurrentPdfLayoutState().elements, changed);
    });
    await run("S5.3b2: persisted VA font profile restores without accepting geometry or hidden required fields", () => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-va-pdf-profile-"));
      try {
        const adapter = createSigekoPreNotificationPdfAdapter(), filePath = adapter.configureProfileRoot(directory), layoutState = adapter.getCurrentPdfLayoutState();
        const field = layoutState.elements.find(entry => entry.elementId === `${SCOPE_ID}.p3.value`); field.fontSize = 11; field.x = 500; field.visible = false;
        const profile = { schemaVersion: 1, documentKind: "pdf-layout-profile", applicationId: "bbm-produktiv", documentType: DOCUMENT_TYPE_ID,
          profileId: "pdf-standard", scopeId: SCOPE_ID, registryFingerprint: persistedRegistryFingerprint(REGISTRY), layoutState };
        fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, JSON.stringify(profile));
        const reopened = createSigekoPreNotificationPdfAdapter(); reopened.configureProfileRoot(directory);
        const restored = reopened.getPersistedPdfLayoutState().elements.find(entry => entry.elementId === field.elementId);
        assert.equal(restored.fontSize, 11); assert.equal(restored.x, 12); assert.equal(restored.visible, true);
        field.fontSize = 1000; fs.writeFileSync(filePath, JSON.stringify(profile)); assert.throws(() => reopened.getPersistedPdfLayoutState(), { code: "pdf_profile_invalid" });
      } finally { fs.rmSync(directory, { recursive: true, force: true }); }
    });
    await run("S5.3b2: editor regeneration preserves exact captured provider identity and creates only a temporary request", () => {
      const context = { projectId: "project-a", documentId: "document-a", documentTypeId: DOCUMENT_TYPE_ID,
        providerRequest: { moduleId: "sigeko", providerId: DOCUMENT_TYPE_ID, projectId: "project-a", documentId: "document-a", data: { contextId: "captured-id" }, storage: { target: "Unterlagen" } } };
      const result = buildRegenerationRequest(context); assert.deepEqual(result.providerRequest, context.providerRequest); assert.equal(result.targetDir, "temp"); assert.equal(result.mode, "provider");
      result.providerRequest.data.contextId = "changed"; assert.equal(context.providerRequest.data.contextId, "captured-id");
      for (const key of ["projectId", "documentId", "documentTypeId"]) assert.throws(() => buildRegenerationRequest({ ...context, [key]: "other" }), /Vorankündigungskontext/);
      assert.throws(() => buildRegenerationRequest({ ...context, providerRequest: { ...context.providerRequest, moduleId: "rechnung" } }), /Vorankündigungskontext/);
    });
  } finally { global.document = prior.document; global.getComputedStyle = prior.getComputedStyle; }
}
module.exports = { runSigekoPreNotificationPdfRendererTests };
if (require.main === module) void runSigekoPreNotificationPdfRendererTests(async (name, test) => {
  try { await test(); console.log(`ok - ${name}`); } catch (error) { console.error(`not ok - ${name}\n${error.stack}`); process.exitCode = 1; }
});
