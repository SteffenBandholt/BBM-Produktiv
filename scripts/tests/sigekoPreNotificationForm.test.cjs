"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { PRE_NOTIFICATION_FIELDS } = require("../../src/shared/sigeko/preNotifications.cjs");
const esm = file => importEsmFromFile(path.resolve(__dirname, "../..", file));
const clone = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const contact = name => ({ name, street: "Kontaktweg 1", zip: "12345", city: "Testort", phone: "0123", email: "kontakt@example.test" });
const defaults = () => ({ ...Object.fromEntries(PRE_NOTIFICATION_FIELDS.map(field => [field, null])), third_party_mode: "none", firms_mode: "unknown" });

// Payloads, state transitions and explicit refs only; geometry is checked by real Electron acceptance.
class Element {
  constructor(tag) {
    this.tagName = tag.toUpperCase(); this.children = []; this.parentElement = null;
    this.attributes = {}; this.dataset = {}; this.value = ""; this.className = "";
    this.style = { setProperty(k, v) { this[k] = v; }, getPropertyValue(k) { return this[k] || ""; }, removeProperty(k) { delete this[k]; } };
    this.classList = { contains: name => this.className.split(/\s+/).includes(name) };
  }
  get isConnected() { return this.tagName === "BODY" || !!this.parentElement?.isConnected; }
  set textContent(value) { this._text = String(value); for (const child of [...this.children]) child.remove(); }
  get textContent() { return this._text || ""; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key] ?? null; }
  append(...nodes) { for (const node of nodes) { node.remove(); node.parentElement = this; this.children.push(node); } }
  appendChild(node) { this.append(node); return node; }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; }
  scrollIntoView(options) { this.scrolled = options; }
  getBoundingClientRect() { return { left: 0, top: 0, right: 320, bottom: 32, width: 320, height: 32 }; }
}

async function runSigekoPreNotificationFormTests(run) {
  const { default: Screen } = await esm("src/renderer/modules/sigeko/SigekoPreNotificationScreen.js");
  const refs = await esm("src/renderer/ui-editor/m80Refs.js");
  const host = await esm("src/renderer/ui-editor/m80HostAdapter.js");
  const { bindDevelopmentUiEditorOpenButtonRef } = await esm("src/renderer/app/coreShellNavigation.js");
  const { sigekoPreNotificationUiEditorContract: contract } = await esm("src/renderer/modules/sigeko/SigekoPreNotificationScreen.uiEditorContract.js");
  const previous = { window: global.window, document: global.document };
  const screens = [];
  let form, data, api, writes, reads, navigations, confirmations, confirmResult, pdfCalls, documents;
  const pdfDocument = (id = "document-a", firms = false, projectId = "a") => ({ id, projectId, createdAt: "2026-09-10T12:00:00Z", files: ["main", ...(firms ? ["firms"] : [])].map(kind => ({ kind, projectRelativePath: `SiGeKo/Unterlagen/${id}-${kind}.pdf`, sha256: "a".repeat(64), byteSize: 100 })) });
  const makeData = (id = "a", patch = null, archived = false) => {
    const record = patch === null ? null : { ...defaults(), id: `va-${id}`, project_id: id, revision: 3,
      created_at: "2026-09-10T10:00:00Z", updated_at: "2026-09-10T11:00:00Z", ...patch };
    const values = record || defaults();
    const project = { id, name: `Projekt ${id}`, street: "Bauweg 12", zip: "12345", city: "Testort",
      geplanter_baubeginn: "2027-03-04", end_date: "2031-12-31", archived_at: archived ? "2026-09-10" : null };
    const address = { street: project.street, zip: project.zip, city: project.city };
    const builder = { ref: { kind: "global_firm", id: "builder" }, firm: contact("Bauherr"), sourceMissing: false };
    const planning = { assignment: { source: "module" }, values: contact("Planung"), sourceMissing: false };
    const execution = { assignment: { source: "free" }, values: contact("Ausführung"), sourceMissing: false };
    const authority = { category: "LABOR_AUTHORITY", status: "orange", assignment: { snapshot: { organization: "Arbeitsschutzamt", ...contact("Behörde") } },
      issues: [{ code: "SOURCE_CHANGED", message: "Behördenquelle prüfen." }] };
    return { projectId: id, record, central: { project, address, builder, building_type: null, planned_start: project.geplanter_baubeginn,
      planning, execution, authority }, effective: { address, builder: builder.firm, planning: planning.values, execution: execution.values, authority,
      building_type: values.building_type_override, planned_start: values.planned_start_override || project.geplanter_baubeginn,
      duration_months: values.duration_months, max_workers: values.max_workers, employer_count: values.employer_count, self_employed_count: values.self_employed_count,
      third_party: values.third_party_mode === "free" ? Object.fromEntries(Object.keys(contact("")).map(field => [field, values[`third_party_${field}`]])) : null,
      firms_mode: values.firms_mode, firms: [{ id: "firm-a", name: "Projektfirma A" }] },
      readiness: { status: "red", issues: [{ code: "FIELD_MISSING", field: "duration_months", message: "Manuelle Dauer fehlt.", action: "preNotification", status: "red" }] } };
  };
  const mount = (id = "a", project = data.central.project) => {
    const screen = new Screen({ projectId: id, project, router: {
      openProjectModule: (...args) => { navigations.push(["module", ...args]); },
      showProjectForm: payload => { navigations.push(["project", payload]); },
      showProjectFirms: id => { navigations.push(["firms", id]); },
    } });
    document.body.append(screen.render()); screens.push(screen); return screen;
  };
  const reset = async ({ id = "a", patch = null, archived = false, overrides = {} } = {}) => {
    for (const screen of screens.splice(0)) { screen.destroy(); screen.root.remove(); }
    refs.resetM80PilotWorkingStatesForDiagnostic();
    data = makeData(id, patch, archived); writes = []; reads = []; navigations = []; confirmations = []; confirmResult = false;
    pdfCalls = []; documents = []; delete global.window.uiEditor;
    api = {
      sigekoListPreNotificationDocuments: async () => ({ ok: true, data: { documents: clone(documents) } }),
      sigekoPreviewPreNotificationPdf: async payload => { pdfCalls.push(["preview", clone(payload)]); return { ok: true, data: {} }; },
      sigekoCreatePreNotificationPdf: async payload => { pdfCalls.push(["create", clone(payload)]); const document = pdfDocument(); documents.unshift(document); return { ok: true, data: { document } }; },
      sigekoOpenPreNotificationDocumentFile: async payload => { pdfCalls.push(["open", clone(payload)]); return { ok: true, data: {} }; },
      sigekoPreparePreNotificationPdfEditor: async payload => { pdfCalls.push(["layout", clone(payload)]); return { ok: true, data: { context: { projectId: id, documentId: "context-a", documentTypeId: "sigeko-vorankuendigung" } } }; },
      sigekoGetPreNotification: async payload => { reads.push(clone(payload)); return { ok: true, data: clone(data) }; },
      sigekoSavePreNotification: async payload => {
        writes.push(clone(payload));
        const next = { ...(data.record || defaults()), ...payload.patch, revision: (data.record?.revision || 0) + 1 };
        if (next.third_party_mode === "none") for (const field of Object.keys(contact(""))) next[`third_party_${field}`] = null;
        data = makeData(id, next, archived); return { ok: true, data: clone(data) };
      }, ...overrides,
    };
    global.window.bbmDb = api;
    form = mount(id); await form.load(); return form;
  };
  const input = (field, value) => { const element = form.inputs[field]; element.value = value; element.oninput?.(); };
  const select = (field, value) => { const element = form.inputs[field]; element.value = value; element.onchange?.(); };
  const target = id => refs.getM80Ref(`sigeko.preNotification.${id}`).element;
  const draft = () => Object.fromEntries(Object.entries(form.inputs).map(([key, el]) => [key, el.value]));
  global.document = { body: new Element("body"), createElement: tag => new Element(tag), querySelector: () => null };
  global.window = { dispatchEvent() {}, confirm: message => { confirmations.push(message); return confirmResult; },
    getComputedStyle: el => ({ ...el.style, fontSize: "12px", paddingLeft: "0px", paddingTop: "0px" }) };
  try {
    await run("S5.2: opening the document resolves central values without creating or saving a draft", async () => {
      await reset(); assert.equal(form.ready, true); assert.equal(form.data.record, null); assert.equal(form.isDirty(), false);
      assert.equal(form.inputs.planned_start_override.value, "2027-03-04"); assert.equal(form.inputs.duration_months.value, "");
      assert.equal(form.inputs.building_type_override.value, ""); assert.equal(form.saveButton.disabled, false);
      assert.match(form.readinessView.textContent, /Dauer/); assert.deepEqual(writes, []);
      assert.ok(reads.every(payload => payload.projectId === "a"));
    });
    await run("S5.2: saving another field preserves the inherited planned start as a null override", async () => {
      await reset(); input("building_type_override", "  Umbau  "); await form.saveButton.onclick();
      assert.equal(writes.length, 1); assert.equal(writes[0].projectId, "a"); assert.equal(writes[0].expectedRevision, 0);
      assert.equal(writes[0].patch.building_type_override, "Umbau"); assert.equal(writes[0].patch.planned_start_override, null);
      assert.equal(writes[0].patch.duration_months, null); assert.equal(form.isDirty(), false);
      for (const key of ["builder", "planning", "execution", "address", "authority", "id", "revision"]) assert.equal(Object.hasOwn(writes[0].patch, key), false);
    });
    await run("S5.2: explicit start override and reset affect only the draft until successfully saved", async () => {
      await reset({ patch: { planned_start_override: "2028-02-29" } });
      assert.equal(form.inputs.planned_start_override.value, "2028-02-29");
      target("p6.reset").onclick(); assert.equal(form.inputs.planned_start_override.value, "2027-03-04");
      assert.equal(data.record.planned_start_override, "2028-02-29"); assert.equal(form.isDirty(), true);
      await form.save(); assert.equal(writes[0].patch.planned_start_override, null);
      input("planned_start_override", "2029-05-06"); await form.save();
      assert.equal(writes[1].patch.planned_start_override, "2029-05-06");
    });
    await run("S5.2: manual duration and both point-eight counts serialize as distinct integers with empty values null", async () => {
      await reset(); input("duration_months", "5"); input("max_workers", "0"); input("employer_count", "11"); input("self_employed_count", "3");
      await form.save(); assert.equal(writes[0].patch.duration_months, 5); assert.equal(writes[0].patch.max_workers, 0);
      assert.equal(writes[0].patch.employer_count, 11); assert.equal(writes[0].patch.self_employed_count, 3);
      input("duration_months", ""); input("employer_count", ""); input("self_employed_count", "0"); await form.save();
      assert.equal(writes[1].patch.duration_months, null); assert.equal(writes[1].patch.employer_count, null); assert.equal(writes[1].patch.self_employed_count, 0);
    });
    await run("S5.2: invalid numeric drafts remain visible and never become successful zero or truncated values", async () => {
      for (const [field, value] of [["duration_months", "0"], ["duration_months", "1.5"], ["max_workers", "-1"], ["employer_count", "2.7"], ["self_employed_count", "invalid"]]) {
        await reset(); input(field, value); const before = draft(); await form.save();
        assert.deepEqual(draft(), before); assert.equal(form.isDirty(), true); assert.equal(writes.length, 0);
        assert.equal(form.saveButton.disabled, false);
      }
    });
    await run("S5.2: third-party mode has two choices and preserves an unsaved free contact when toggled", async () => {
      await reset(); assert.deepEqual(form.inputs.third_party_mode.children.map(option => option.value), ["none", "free"]);
      select("third_party_mode", "free"); input("third_party_name", "Dritter Entwurf"); input("third_party_email", "dritter@example.test");
      select("third_party_mode", "none"); assert.equal(form.inputs.third_party_name.disabled, true);
      select("third_party_mode", "free"); assert.equal(form.inputs.third_party_name.value, "Dritter Entwurf");
      assert.equal(form.inputs.third_party_email.value, "dritter@example.test"); assert.deepEqual(writes, []);
      await form.save(); assert.equal(writes[0].patch.third_party_name, "Dritter Entwurf");
    });
    await run("S5.2: removing a saved third party clears contacts only after save and sends no contradictory hidden values", async () => {
      await reset({ patch: { third_party_mode: "free", third_party_name: "Gespeicherter Dritter", third_party_phone: "123" } });
      select("third_party_mode", "none"); assert.equal(data.record.third_party_name, "Gespeicherter Dritter");
      await form.save(); assert.equal(writes[0].patch.third_party_mode, "none");
      for (const field of Object.keys(contact(""))) assert.ok(writes[0].patch[`third_party_${field}`] == null);
      assert.equal(data.record.third_party_name, null); select("third_party_mode", "free"); assert.equal(form.inputs.third_party_name.value, "");
    });
    await run("S5.2: firms mode offers only unknown or attachment and backend rejection preserves the choice", async () => {
      await reset(); assert.deepEqual(form.inputs.firms_mode.children.map(option => option.value), ["unknown", "attachment"]);
      select("firms_mode", "attachment"); api.sigekoSavePreNotification = async payload => { writes.push(payload); return { ok: false, code: "FIRMS_ATTACHMENT_EMPTY", error: "Keine aktiven Projektfirmen vorhanden." }; };
      await form.save({ back: true }); assert.equal(writes[0].patch.firms_mode, "attachment");
      assert.equal(form.inputs.firms_mode.value, "attachment"); assert.equal(form.isDirty(), true); assert.deepEqual(navigations, []);
      assert.match(form.status.textContent, /Projektfirmen/);
    });
    await run("S5.2: save-and-back navigates once only after a successful save", async () => {
      await reset(); input("building_type_override", "Neubau"); const gate = deferred();
      api.sigekoSavePreNotification = payload => { writes.push(payload); return gate.promise; };
      const pending = form.saveBackButton.onclick(); assert.deepEqual(navigations, []); assert.equal(form.busy, true);
      gate.resolve({ ok: true, data: makeData("a", { building_type_override: "Neubau", revision: 1 }) }); await pending;
      assert.equal(navigations.length, 1); assert.equal(navigations[0][0], "module"); assert.equal(navigations[0][1], "a");
      assert.equal(navigations[0][2], "sigeko");
    });
    await run("S5.2: dirty navigation cancellation preserves the full draft without saving", async () => {
      await reset(); input("building_type_override", "Ungespeichert"); select("third_party_mode", "free"); input("third_party_name", "Kontaktentwurf");
      const before = draft(); await form.backButton.onclick();
      assert.deepEqual(navigations, []); assert.deepEqual(writes, []); assert.deepEqual(draft(), before); assert.equal(confirmations.length, 1);
      confirmResult = true; await form.backButton.onclick(); assert.equal(navigations.length, 1); assert.deepEqual(writes, []);
    });
    await run("S5.2: reload requires explicit draft discard and cancellation performs no replacement read", async () => {
      await reset({ patch: { building_type_override: "Gespeichert" } }); input("building_type_override", "Lokaler Entwurf");
      const before = draft(), count = reads.length; data = makeData("a", { building_type_override: "Neu auf Platte", revision: 9 });
      await form.reload(); assert.deepEqual(draft(), before); assert.equal(reads.length, count);
      confirmResult = true; await form.reload(); assert.equal(form.inputs.building_type_override.value, "Neu auf Platte");
      assert.equal(form.data.record.revision, 9); assert.equal(form.isDirty(), false); assert.deepEqual(writes, []);
    });
    await run("S5.2: CAS conflict retains the old revision and every input until deliberate reload", async () => {
      await reset({ patch: { duration_months: 4 } }); input("duration_months", "8"); const before = draft();
      api.sigekoSavePreNotification = async payload => { writes.push(payload); return { ok: false, code: "PRE_NOTIFICATION_CONFLICT", error: "Vorankündigung inzwischen geändert. Bitte neu laden." }; };
      await form.save({ back: true }); assert.equal(writes[0].expectedRevision, 3); assert.equal(form.data.record.revision, 3);
      assert.deepEqual(draft(), before); assert.equal(form.isDirty(), true); assert.deepEqual(navigations, []);
      assert.match(form.status.textContent, /geändert/);
      data = makeData("a", { duration_months: 12, revision: 4 }); await form.reload(); assert.deepEqual(draft(), before);
      confirmResult = true; await form.reload(); assert.equal(form.data.record.revision, 4); assert.equal(form.inputs.duration_months.value, "12");
    });
    await run("S5.2: a pending save blocks duplicate writes reload and navigation", async () => {
      await reset(); input("duration_months", "6"); const gate = deferred();
      api.sigekoSavePreNotification = payload => { writes.push(payload); return gate.promise; };
      const pending = form.save(); const count = reads.length;
      await form.save(); await form.reload(); await form.backButton.onclick();
      assert.equal(writes.length, 1); assert.equal(reads.length, count); assert.deepEqual(navigations, []);
      assert.equal(form.saveButton.disabled, true); assert.equal(form.inputs.duration_months.disabled, true);
      gate.resolve({ ok: true, data: makeData("a", { duration_months: 6, revision: 1 }) }); await pending;
      assert.equal(form.busy, false); assert.equal(form.saveButton.disabled, false);
    });
    await run("S5.2: failed loading cannot retain old green readiness or permit saving stale data", async () => {
      await reset(); api.sigekoGetPreNotification = async () => ({ ok: false, code: "SQLITE_ERROR", error: "Datenbank nicht erreichbar" });
      await form.load(); assert.equal(form.ready, false); assert.equal(form.saveButton.disabled, true);
      assert.match(form.status.textContent, /Datenbank/); await form.save(); assert.deepEqual(writes, []);
      api.sigekoGetPreNotification = async () => ({ ok: true, data: clone(data) }); await form.load(); assert.equal(form.ready, true);
    });
    await run("S5.2: newer load wins over an older response and its revision cannot be replaced", async () => {
      await reset(); const gate = deferred(); api.sigekoGetPreNotification = () => gate.promise; const old = form.load();
      api.sigekoGetPreNotification = async () => ({ ok: true, data: makeData("a", { duration_months: 12, revision: 7 }) }); await form.load();
      gate.resolve({ ok: true, data: makeData("a", { duration_months: 1, revision: 2 }) }); await old;
      assert.equal(form.data.record.revision, 7); assert.equal(form.inputs.duration_months.value, "12"); assert.equal(form.ready, true);
    });
    await run("S5.2: destroyed screen ignores delayed reads and leaves replacement project refs intact", async () => {
      await reset(); const old = form, gate = deferred(); api.sigekoGetPreNotification = () => gate.promise; const pending = old.load();
      old.destroy(); old.root.remove(); data = makeData("b", { duration_months: 15 });
      api.sigekoGetPreNotification = async () => ({ ok: true, data: clone(data) }); form = mount("b"); await form.load();
      gate.resolve({ ok: true, data: makeData("a", { duration_months: 2 }) }); await pending;
      assert.equal(form.data.projectId, "b"); assert.equal(form.inputs.duration_months.value, "15");
      assert.equal(refs.getM80Ref("sigeko.preNotification").element, form.root);
    });
    await run("S5.2: destroyed screen cannot navigate or overwrite replacement inputs after delayed save-and-back", async () => {
      await reset(); input("duration_months", "7"); const old = form, gate = deferred();
      api.sigekoSavePreNotification = payload => { writes.push(payload); return gate.promise; }; const pending = old.save({ back: true });
      old.destroy(); old.root.remove(); data = makeData("b", { duration_months: 18 }); form = mount("b"); await form.load();
      gate.resolve({ ok: true, data: makeData("a", { duration_months: 7 }) }); await pending;
      assert.equal(form.data.projectId, "b"); assert.equal(form.inputs.duration_months.value, "18"); assert.deepEqual(navigations, []);
      assert.equal(refs.validateM83ComponentReferences([contract.componentId]).ok, true);
    });
    await run("S5.2: missing and mismatched project responses never enable mutation", async () => {
      for (const foreign of [null, makeData("b"), { ...makeData("a"), central: { ...makeData("a").central, project: { id: "b" } } }]) {
        await reset({ overrides: { sigekoGetPreNotification: async () => ({ ok: true, data: foreign }) } });
        assert.equal(form.ready, false); assert.equal(form.saveButton.disabled, true); await form.save(); assert.deepEqual(writes, []);
      }
      await reset({ patch: { duration_months: 4 } }); input("duration_months", "8"); const before = draft();
      api.sigekoSavePreNotification = async () => ({ ok: true, data: makeData("b", { duration_months: 99 }) });
      await form.save({ back: true }); assert.deepEqual(draft(), before); assert.deepEqual(navigations, []);
      assert.equal(form.data.projectId, "a");
    });
    await run("S5.2: archived project remains readable and all mutation paths are disabled", async () => {
      await reset({ archived: true, patch: { duration_months: 7 } });
      assert.equal(form.inputs.duration_months.value, "7"); assert.equal(form.saveButton.disabled, true); assert.equal(form.saveBackButton.disabled, true);
      assert.equal(form.inputs.duration_months.disabled, true); await form.save(); await form.save({ back: true }); assert.deepEqual(writes, []);
      await form.backButton.onclick(); assert.equal(navigations.length, 1);
    });
    await run("S5.2: revoked license and transport failures preserve the draft and never navigate", async () => {
      for (const failure of [{ code: "MODULE_NOT_ACTIVE", error: "SiGeKo nicht freigeschaltet" }, { code: "PROJECT_ARCHIVED", error: "Projekt archiviert" }]) {
        await reset(); input("building_type_override", "Entwurf behalten"); const before = draft();
        api.sigekoSavePreNotification = async () => { throw Object.assign(new Error(failure.error), { code: failure.code }); };
        await form.save({ back: true }); assert.deepEqual(draft(), before); assert.equal(form.isDirty(), true); assert.deepEqual(navigations, []);
        assert.match(form.status.textContent, new RegExp(failure.error)); assert.equal(form.busy, false);
      }
    });
    await run("S5.3b2: dirty drafts disable every new PDF action without autosave and saving restores them", async () => {
      await reset(); input("duration_months", "9"); const before = draft();
      for (const action of ["preview", "create", "layout"]) assert.equal(await form.runPdfAction(action), false);
      assert.ok([form.pdfPreviewButton, form.pdfCreateButton, form.pdfLayoutButton].every(button => button.disabled));
      assert.match(form.pdfStatus.textContent, /zuerst speichern/); assert.deepEqual(pdfCalls, []); assert.deepEqual(writes, []); assert.deepEqual(draft(), before);
      await form.save(); assert.ok([form.pdfPreviewButton, form.pdfCreateButton, form.pdfLayoutButton].every(button => !button.disabled));
      await form.runPdfAction("preview"); assert.deepEqual(pdfCalls, [["preview", { projectId: "a", expectedRevision: 1 }]]); assert.equal(writes.length, 1);
    });
    await run("S5.3b2: initial preview uses revision zero without creating a draft or a final version", async () => {
      await reset(); assert.equal(await form.pdfPreviewButton.onclick(), true);
      assert.deepEqual(pdfCalls, [["preview", { projectId: "a", expectedRevision: 0 }]]); assert.deepEqual(writes, []);
      assert.deepEqual(form.documents, []); assert.equal(form.data.record, null); assert.match(form.pdfStatus.textContent, /keine finale/);
    });
    await run("S5.3b2: pending PDF blocks duplicate jobs edits saves reload and local navigation", async () => {
      await reset(); const gate = deferred(); api.sigekoPreviewPreNotificationPdf = payload => { pdfCalls.push(payload); return gate.promise; };
      const pending = form.runPdfAction("preview"), count = reads.length;
      assert.equal(form.busy, true); assert.ok(Object.values(form.inputs).every(element => element.disabled));
      await form.runPdfAction("create"); await form.runPdfAction("layout"); await form.save(); await form.reload(); await form.backButton.onclick();
      assert.equal(pdfCalls.length, 1); assert.deepEqual(writes, []); assert.equal(reads.length, count); assert.deepEqual(navigations, []);
      gate.resolve({ ok: true, data: {} }); assert.equal(await pending, true); assert.equal(form.busy, false);
    });
    await run("S5.3b2: final creation selects only the successful new version and defeats an older list response", async () => {
      await reset(); documents = [pdfDocument("old", true)]; await form.loadDocuments();
      const list = deferred(); api.sigekoListPreNotificationDocuments = () => list.promise; const listing = form.loadDocuments();
      const create = deferred(); api.sigekoCreatePreNotificationPdf = () => create.promise; const creating = form.runPdfAction("create");
      assert.deepEqual(form.documents.map(entry => entry.id), ["old"]);
      create.resolve({ ok: true, data: { document: pdfDocument("new") } }); assert.equal(await creating, true);
      list.resolve({ ok: true, data: { documents: [] } }); await listing;
      assert.deepEqual(form.documents.map(entry => entry.id), ["new", "old"]); assert.equal(form.documentSelection.value, "new");
      assert.equal(form.pdfOpenFirmsButton.disabled, true); assert.deepEqual(writes, []);
    });
    await run("S5.3b2: version selection preserves dirty fields and sends identities for stored main and firms files", async () => {
      await reset(); documents = [pdfDocument("new"), pdfDocument("old", true)]; await form.loadDocuments();
      input("duration_months", "12"); const before = draft(); form.documentSelection.value = "old"; form.documentSelection.onchange();
      assert.equal(form.pdfOpenFirmsButton.disabled, false); await form.pdfOpenButton.onclick(); await form.pdfOpenFirmsButton.onclick();
      assert.deepEqual(pdfCalls, [["open", { projectId: "a", documentId: "old", kind: "main" }], ["open", { projectId: "a", documentId: "old", kind: "firms" }]]);
      assert.deepEqual(draft(), before); assert.deepEqual(writes, []); assert.deepEqual(confirmations, []);
      await form.loadDocuments(); assert.equal(form.documentSelection.value, "old");
      documents = [pdfDocument("new")]; await form.loadDocuments(); assert.equal(form.documentSelection.value, "new"); assert.match(form.pdfStatus.textContent, /nicht mehr vorhanden/);
    });
    await run("S5.3b2: document list loading and failure cannot erase or block an editable form", async () => {
      await reset(); input("duration_months", "12"); const before = draft(), list = deferred();
      api.sigekoListPreNotificationDocuments = () => list.promise; const pending = form.loadDocuments();
      assert.equal(form.saveButton.disabled, false); assert.equal(form.inputs.duration_months.disabled, false); assert.equal(form.documentSelection.disabled, true);
      list.resolve({ ok: false, code: "SQLITE_ERROR", error: "Bestand nicht erreichbar" }); assert.equal(await pending, false);
      assert.deepEqual(draft(), before); assert.equal(form.ready, true); assert.equal(form.isDirty(), true); assert.match(form.pdfStatus.textContent, /Bestand nicht erreichbar/);
      api.sigekoListPreNotificationDocuments = async () => ({ ok: true, data: { documents: [pdfDocument("foreign", false, "b")] } });
      assert.equal(await form.loadDocuments(), false); assert.deepEqual(form.documents, []); assert.deepEqual(draft(), before);
    });
    await run("S5.3b2: archived projects open stored versions but reject all new output", async () => {
      await reset({ archived: true }); documents = [pdfDocument("old", true)]; await form.loadDocuments();
      for (const action of ["preview", "create", "layout"]) assert.equal(await form.runPdfAction(action), false);
      assert.ok([form.pdfPreviewButton, form.pdfCreateButton, form.pdfLayoutButton].every(button => button.disabled));
      assert.equal(await form.openDocument("main"), true); assert.equal(await form.openDocument("firms"), true);
      assert.equal(pdfCalls.length, 2); assert.ok(pdfCalls.every(([action]) => action === "open")); assert.deepEqual(writes, []);
    });
    await run("S5.3b2: PDF conflicts lock new output until reload while ordinary failure remains retryable", async () => {
      await reset({ patch: { duration_months: 4 } }); const before = draft();
      api.sigekoCreatePreNotificationPdf = async () => ({ ok: false, code: "PDF_OVERFLOW", error: "Feld passt nicht" });
      assert.equal(await form.runPdfAction("create"), false); assert.equal(form.pdfCreateButton.disabled, false); assert.match(form.pdfStatus.textContent, /Feld passt nicht/);
      api.sigekoCreatePreNotificationPdf = async () => ({ ok: false, code: "PRE_NOTIFICATION_CONFLICT", error: "Entwurf inzwischen geändert" });
      assert.equal(await form.runPdfAction("create"), false); assert.equal(form.conflict, true); assert.equal(form.pdfPreviewButton.disabled, true);
      assert.deepEqual(draft(), before); assert.equal(form.data.record.revision, 3); await form.reload(); assert.equal(form.conflict, false);
    });
    await run("S5.3b2: destroyed screens ignore pending creation and document list responses", async () => {
      await reset(); const list = deferred(), create = deferred(); api.sigekoListPreNotificationDocuments = () => list.promise;
      const listing = form.loadDocuments(); api.sigekoCreatePreNotificationPdf = () => create.promise; const creating = form.runPdfAction("create");
      form.destroy(); create.resolve({ ok: true, data: { document: pdfDocument("late") } }); list.resolve({ ok: true, data: { documents: [pdfDocument("late")] } });
      assert.equal(await creating, false); assert.equal(await listing, false); assert.deepEqual(form.documents, []);
    });
    await run("S5.3b2: layout prepares the document type before opening the existing editor and activating its scope", async () => {
      await reset(); const calls = [];
      const launcher = new Element("button"); target("header").append(launcher); bindDevelopmentUiEditorOpenButtonRef({ scopeId: "sigeko.preNotification", button: launcher });
      window.uiEditor = { preparePdfContext: async context => { calls.push(["prepare", context]); return { ok: true, documentTypeId: context.documentTypeId }; },
        open: async registration => { calls.push(["open", registration.activeScopes]); return { ok: true }; },
        sendTargetEvent: async event => { calls.push([event.action, event.scopeId]); return { ok: true }; } };
      assert.equal(await form.runPdfAction("layout"), true);
      assert.deepEqual(calls.map(([action]) => action), ["prepare", "open", "scopeChanged"]);
      assert.equal(calls[0][1].documentTypeId, "sigeko-vorankuendigung"); assert.equal(calls[0][1].meetingId, undefined);
      assert.deepEqual(calls[1][1], ["sigeko.preNotification"]); assert.equal(calls[2][1], "sigeko.preNotification"); assert.deepEqual(writes, []);
      assert.match(form.pdfStatus.textContent, /PDF-Ausgabe/);
    });
    await run("S5.3b2: failed prepare and a destroyed pending prepare cannot open a native editor", async () => {
      await reset(); let opened = 0;
      window.uiEditor = { preparePdfContext: async () => ({ ok: false, message: "Dokumenttyp fehlt" }), open: async () => { ++opened; return { ok: true }; } };
      assert.equal(await form.runPdfAction("layout"), false); assert.equal(opened, 0); assert.match(form.pdfStatus.textContent, /Dokumenttyp fehlt/);
      const gate = deferred(); window.uiEditor.preparePdfContext = () => gate.promise;
      const pending = form.runPdfAction("layout"); await new Promise(resolve => setImmediate(resolve)); form.destroy();
      gate.resolve({ ok: true, documentTypeId: "sigeko-vorankuendigung" }); assert.equal(await pending, false); assert.equal(opened, 0);
    });
    await run("S5.3b2: all thirteen added refs match approved attributes and forbid domain execution", async () => {
      await reset(); assert.equal(contract.slots.length, 111);
      const design = fs.readFileSync(path.resolve(__dirname, "../../docs/SIGEKO_S5_3B2_UI_ENTWURF.md"), "utf8");
      const rows = design.split("\n").filter(line => /^\| `sigeko\.preNotification/.test(line)).map(line => line.split("|").slice(1, -1).map(value => value.trim().replaceAll("`", "")));
      assert.equal(rows.length, 13); assert.deepEqual(contract.slots.slice(98).map(slot => slot.element.id), rows.map(row => row[0]));
      for (const slot of contract.slots.slice(98)) {
        const entry = slot.element, element = refs.getM80Ref(entry.id).element, row = rows.find(row => row[0] === entry.id);
        assert.deepEqual(["inspector-id", "editor-kind", "editor-label", "editor-parent", "editor-editable", "editor-ops"].map(key => element.getAttribute(`data-ui-${key}`)), row);
        assert.equal(element.parentElement, refs.getM80Ref(entry.parentId).element); assert.equal(slot.referenceKind, "single");
        for (const op of ["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"]) assert.ok(entry.lockedOps.includes(op));
      }
      assert.equal(form.documentSelection.tagName, "SELECT"); assert.equal(refs.validateM83ComponentReferences([contract.componentId]).ok, true);
      refs.applyM80State("sigeko.preNotification.actions.pdfCreate", { fontSize: 16 }, "textResize");
      assert.equal(form.pdfCreateButton.style.fontSize, "16px"); assert.deepEqual(pdfCalls, []); assert.deepEqual(writes, []);
    });
    await run("S5.2: all 98 slots match the approved design exact DOM attributes parents and domain locks", async () => {
      await reset(); assert.equal(contract.slots.slice(0, 98).length, 98); assert.deepEqual(contract.requiredSlots, contract.slots.map(slot => slot.slotId));
      assert.equal(refs.validateM83ComponentReferences([contract.componentId]).ok, true);
      const launcher = new Element("button"); target("header").append(launcher);
      bindDevelopmentUiEditorOpenButtonRef({ scopeId: "sigeko.preNotification", button: launcher });
      const registration = host.createM80RegistrationDescriptor();
      assert.deepEqual(registration.activeScopes, ["sigeko.preNotification"]);
      assert.equal(registration.layoutStorageKey, "module-sigeko-prenotification");
      const design = fs.readFileSync(path.resolve(__dirname, "../../docs/SIGEKO_S5_2_UI_ENTWURF.md"), "utf8");
      const declared = design.split("\n").filter(line => /^\| \d+ \| sigeko\.preNotification/.test(line)).map(line => line.split("|").slice(1, -1).map(value => value.trim()));
      const normal = declared.filter(parts => parts[1] !== "sigeko.preNotification.header.action.openUiEditor");
      assert.equal(normal.length, 98); assert.deepEqual(contract.slots.slice(0, 98).map(slot => slot.element.id), normal.map(parts => parts[1]));
      for (const slot of contract.slots.slice(0, 98)) {
        const entry = slot.element, ref = refs.getM80Ref(entry.id), expected = normal.find(parts => parts[1] === entry.id);
        assert.equal(ref.contractTargets.length, 1); assert.equal(slot.referenceKind, "single");
        for (const [key, value] of Object.entries({ "inspector-id": entry.id, "editor-kind": entry.type, "editor-label": entry.name,
          "editor-parent": entry.parentId || "", "editor-editable": "true", "editor-ops": entry.allowedOps.join(",") })) {
          assert.equal(ref.element.getAttribute(`data-ui-${key}`), value, `${entry.id} ${key}`);
        }
        assert.deepEqual([entry.type, entry.name, entry.parentId || '""', String(entry.editable), entry.allowedOps.join(",")], expected.slice(2));
        if (entry.parentId) assert.equal(ref.element.parentElement, refs.getM80Ref(entry.parentId).element, entry.id);
        for (const operation of ["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"]) assert.ok(entry.lockedOps.includes(operation));
      }
    });
    await run("S5.2: editor geometry and font changes affect no field values saved records or domain calls", async () => {
      await reset(); input("duration_months", "8"); input("building_type_override", "Fachinhalt"); const before = draft(), saved = clone(data);
      refs.applyM80State("sigeko.preNotification.p6.duration.input", { fontSize: 18 }, "textResize");
      refs.applyM80State("sigeko.preNotification.actions.save", { width: 230 }, "resizeWidth");
      assert.equal(form.inputs.duration_months.style.fontSize, "18px"); assert.equal(form.saveButton.style.width, "230px");
      assert.deepEqual(draft(), before); assert.deepEqual(data, saved); assert.deepEqual(writes, []); assert.deepEqual(navigations, []);
    });
    await run("S5.2: pending initial load blocks navigation and replacement reload until the project is known", async () => {
      await reset(); const gate = deferred(); api.sigekoGetPreNotification = () => gate.promise;
      const pending = form.load(); const count = reads.length;
      assert.equal(form.loading, true); assert.equal(form.backButton.disabled, true); assert.equal(form.reloadButton.disabled, true);
      await form.backButton.onclick(); await form.reload(); assert.deepEqual(navigations, []); assert.equal(reads.length, count);
      gate.resolve({ ok: true, data: clone(data) }); await pending;
      assert.equal(form.backButton.disabled, false); assert.equal(form.reloadButton.disabled, false);
    });
    await run("S5.2: native invalid empty numeric input is dirty and cannot bypass navigation discard confirmation", async () => {
      await reset(); const numeric = form.inputs.duration_months;
      numeric.value = ""; numeric.validity = { badInput: true }; numeric.oninput();
      assert.equal(form.isDirty(), true); await form.backButton.onclick(); assert.equal(confirmations.length, 1);
      assert.deepEqual(navigations, []); assert.equal(numeric.validity.badInput, true); assert.deepEqual(writes, []);
    });
  } finally {
    for (const screen of screens) { screen.destroy(); screen.root.remove(); }
    refs.resetM80PilotWorkingStatesForDiagnostic(); global.window = previous.window; global.document = previous.document;
  }
}

module.exports = { runSigekoPreNotificationFormTests };
if (require.main === module) runSigekoPreNotificationFormTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
