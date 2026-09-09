"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const esm = file => importEsmFromFile(path.resolve(__dirname, "../..", file));
const clone = value => JSON.parse(JSON.stringify(value));
const contact = name => ({ name, street: null, zip: null, city: null, phone: null, email: null });
const assignment = (source = "module", personId = null, data = null) => ({ source, personId, data });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const { AUTHORITY_CATEGORIES, AUTHORITY_FIELDS } = require("../../src/shared/sigeko/authorities.cjs");
const authorityAddress = { street: "Bauweg 1", zip: "12345", city: "Ort" };
const authorityRecord = (id = "authority-1", category = "LABOR_AUTHORITY") => ({ id, category,
  ...Object.fromEntries(AUTHORITY_FIELDS.map(field => [field, `${field} geprüft`])), organization: `Stelle ${id}`, verification_status: "confirmed",
  verified_at: "2026-09-10T12:00:00Z", verification_method: "manual", uncertainty_reason: null, revision: 2,
  created_at: "2026-09-10T11:00:00Z", updated_at: "2026-09-10T12:00:00Z", confirmationIssues: [] });
const authorityOverview = (projectId = "a") => ({ projectId, address: { ...authorityAddress }, status: "red", categories: AUTHORITY_CATEGORIES.map(category => ({
  category, status: category === "EMERGENCY_112" ? "green" : "red", fixedPhone: category === "EMERGENCY_112" ? "112" : category === "POLICE" ? "110" : null,
  assignment: null, candidates: [], proposal: null, issues: category === "EMERGENCY_112" ? [] : [{ code: "ASSIGNMENT_MISSING", message: "Projektkontakt fehlt." }],
})) });

// Control, payload and explicit-ref checks only. Real geometry belongs to the Electron acceptance.
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
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; }
  scrollIntoView(options) { this.scrolled = options; }
  getBoundingClientRect() { return { left: 0, top: 0, right: 320, bottom: 32, width: 320, height: 32 }; }
}

async function runSigekoGrunddatenFormTests(run) {
  const { default: Screen } = await esm("src/renderer/modules/sigeko/SigekoScreen.js");
  const refs = await esm("src/renderer/ui-editor/m80Refs.js");
  const { sigekoScreenUiEditorContract: contract } = await esm("src/renderer/modules/sigeko/SigekoScreen.uiEditorContract.js");
  const previous = { window: global.window, document: global.document };
  const screens = [];
  let form, profile, data, writes, api, navigations, confirmResult, stock, authorityData, authorityWrites;
  const legacyCalls = [];
  const makeData = (id = "a", extension = null) => ({ project: { id, name: `Projekt ${id}`, project_number: id.toUpperCase() }, sigekoProject: extension, planning: null, execution: null });
  const readiness = (id = "a", status = "red") => ({ projectId: id,
    projectData: { status, issues: status === "red" ? [{ code: "BUILDER_MISSING", message: "Bauherr: Zuordnung fehlt.", action: "project" }] : [] },
    authorities: { status: "red", available: true, issues: [{ code: "ASSIGNMENT_MISSING", message: "Arbeitsschutzbehörde: Projektkontakt fehlt.", action: "authorities" }] } });
  const mount = (id = "a") => {
    const screen = new Screen({ projectId: id, router: { _setProjectRuntimeContext() {}, showProjects() { navigations.push("projects"); }, showProjectForm(payload) { navigations.push(payload); }, showProjectWorkspace(projectId) { navigations.push(projectId); } } });
    document.body.append(screen.render()); screens.push(screen); return screen;
  };
  const reset = async ({ id = "a", extension = null, archived = false, overrides = {}, records = [], projectAuthorities = null } = {}) => {
    for (const screen of screens.splice(0)) { screen.destroy(); screen.root.remove(); }
    refs.resetM80PilotWorkingStatesForDiagnostic();
    profile = { ...contact("Steffen"), logo_path: "C:\\Logos\\sigeko.png" }; data = makeData(id, extension);
    if (archived) data.project.archived_at = "2026-01-01";
    writes = { profile: [], roles: [] }; navigations = []; confirmResult = false;
    stock = clone(records); authorityData = clone(projectAuthorities || authorityOverview(id)); authorityWrites = { save: [], confirm: [], uncertain: [], assign: [], apply: [] };
    api = {
      sigekoListAuthorityRecords: async () => ({ ok: true, data: clone(stock) }),
      sigekoGetProjectAuthorities: async ({ projectId }) => ({ ok: true, data: { ...clone(authorityData), projectId } }),
      sigekoSaveAuthorityRecord: async payload => {
        authorityWrites.save.push(clone(payload)); const old = stock.find(record => record.id === payload.id);
        const saved = { ...(old || authorityRecord("new-record", payload.patch.category)), ...payload.patch,
          verification_status: "unverified", verified_at: null, verification_method: null, revision: (old?.revision || 0) + 1 };
        stock = [...stock.filter(record => record.id !== saved.id), saved]; return { ok: true, data: clone(saved) };
      },
      sigekoConfirmAuthorityRecord: async payload => {
        authorityWrites.confirm.push(clone(payload)); const saved = stock.find(record => record.id === payload.id);
        Object.assign(saved, { verification_status: "confirmed", revision: saved.revision + 1 }); return { ok: true, data: clone(saved) };
      },
      sigekoMarkAuthorityUncertain: async payload => {
        authorityWrites.uncertain.push(clone(payload)); const saved = stock.find(record => record.id === payload.id);
        Object.assign(saved, { verification_status: "uncertain", uncertainty_reason: payload.reason, revision: saved.revision + 1 }); return { ok: true, data: clone(saved) };
      },
      sigekoAssignProjectAuthority: async payload => {
        authorityWrites.assign.push(clone(payload)); const selected = stock.find(record => record.id === payload.sourceId);
        const entry = authorityData.categories.find(entry => entry.category === payload.category);
        entry.status = payload.status === "uncertain" || selected.verification_status !== "confirmed" ? "orange" : "green";
        entry.issues = entry.status === "orange" ? [{ code: "SOURCE_UNCONFIRMED", message: "Quelle ist noch nicht bestätigt." }] : [];
        entry.assignment = { id: "assignment-1", revision: (entry.assignment?.revision || 0) + 1, source_id: selected.id, source_revision: selected.revision,
          snapshot: clone(selected), assessment_status: payload.status, assessment_note: payload.note };
        return { ok: true, data: clone(authorityData) };
      },
      sigekoApplyKnownProjectAuthorities: async payload => { authorityWrites.apply.push(clone(payload)); return { ok: true, data: clone(authorityData) }; },
      sigekoGetReadiness: async ({ projectId }) => ({ ok: true, data: readiness(projectId) }),
      sigekoGetCoordinatorProfile: async () => ({ ok: true, data: clone(profile) }),
      sigekoGetProjectData: async () => ({ ok: true, data: clone(data) }),
      sigekoSaveCoordinatorProfile: async payload => { writes.profile.push(clone(payload)); return { ok: true, data: { ...profile, ...payload.patch } }; },
      sigekoSaveProjectData: async payload => { writes.roles.push(clone(payload)); return { ok: true, data: clone(data) }; },
      firmsListGlobal: async () => { legacyCalls.push("firmsListGlobal"); throw new Error("Protokoll API unavailable"); },
      personsListByFirm: async () => { legacyCalls.push("personsListByFirm"); throw new Error("Protokoll API unavailable"); },
      firmDirectoryListAll: async payload => {
        assert.equal(payload.projectId, id); assert.equal(payload.includeInactive, false);
        return { ok: true, list: payload.kind === "global_firm"
          ? [{ ref: { kind: "global_firm", id: "firm" }, name: "Zentralfirma" }, { ref: { kind: "global_firm", id: "removed" }, removed_at: "2025-01-01" }]
          : [{ ref: { kind: "project_firm", id: "project-firm", projectId: id }, name: "Projektfirma" }] };
      },
      firmDirectoryListPersons: async ({ ref }) => {
        assert.ok(ref && ["firm", "project-firm"].includes(ref.id));
        return { ok: true, list: ref.kind === "global_firm"
          ? [{ id: "central-1", first_name: "Clara", last_name: "Plan" }, { id: "inactive", name: "Inaktiv", is_active: 0 }]
          : [{ id: "project-person-1", name: "Erik Bau" }, { id: "trashed", name: "Papierkorb", is_trashed: 1 }] };
      },
      ...overrides,
    };
    global.window.bbmDb = api;
    form = mount(id); await form.load(); return form;
  };
  const source = (role, value) => { form.roleInputs[role].source.value = value; form.roleInputs[role].source.onchange(); };
  const panelReady = async options => { await reset(options); await form.authoritiesPanel.load(); return form.authoritiesPanel; };
  const selectRecord = async (panel, id = "authority-1") => { panel.contactInput.value = id; await panel.contactInput.onchange(); };
  const input = (element, value) => { element.value = value; element.oninput(); };
  const settle = () => new Promise(resolve => setImmediate(resolve));
  global.document = { body: new Element("body"), createElement: tag => new Element(tag), querySelector: () => null };
  global.window = { dispatchEvent() {}, confirm: () => confirmResult, getComputedStyle: el => ({ ...el.style, fontSize: "12px", paddingLeft: "0px", paddingTop: "0px" }) };
  try {
    await run("S2.4: opening an unassigned project loads defaults without any writes", async () => {
      await reset();
      assert.equal(form.inputs.name.value, "Steffen"); assert.equal(form.roleInputs.planning.source.value, "module");
      assert.equal(form.sameInput.checked, true); assert.equal(form.roleInputs.execution.source.disabled, true);
      assert.equal(form.roleInputs.planning.inputs.name.disabled, true); assert.equal(form.profileSave.disabled, false); assert.equal(form.rolesSave.disabled, false);
      assert.deepEqual(writes, { profile: [], roles: [] });
      assert.deepEqual(legacyCalls, []); assert.deepEqual(form.contacts.person.map(row => row.id), ["central-1"]); assert.deepEqual(form.contacts.project_person.map(row => row.id), ["project-person-1"]);
      assert.equal(form.contacts.person[0].label, "Clara Plan – Zentralfirma");
    });
    await run("S2.4: profile save sends only module data and preserves unsaved project roles", async () => {
      await reset(); source("planning", "free"); form.roleInputs.planning.inputs.name.value = "Entwurf fremder Planer";
      form.inputs.name.value = "  Eigenes Büro  "; form.inputs.street.value = "  ";
      await form.profileSave.onclick();
      assert.deepEqual(writes.profile, [{ patch: { ...contact("Eigenes Büro"), logo_path: "C:\\Logos\\sigeko.png" } }]);
      assert.deepEqual(writes.roles, []); assert.equal(form.roleInputs.planning.inputs.name.value, "Entwurf fremder Planer");
      assert.equal(form.inputs.name.value, "Eigenes Büro"); assert.match(form.profileStatus.textContent, /Profil gespeichert/);
    });
    await run("S2.4: free planning and own execution stay separate and do not save a profile draft", async () => {
      await reset(); form.inputs.name.value = "Nicht speichern"; source("planning", "free");
      form.roleInputs.planning.inputs.name.value = "  Andere Planung  "; form.roleInputs.planning.inputs.phone.value = "0123";
      form.sameInput.checked = false; form.sameInput.onchange();
      await form.rolesSave.onclick();
      // The unchanged module assignment can be omitted: S2.3 supplies its established default.
      assert.deepEqual(writes.roles, [{ projectId: "a", executionSameAsPlanning: false, planning: assignment("free", null, { ...contact("Andere Planung"), phone: "0123" }) }]);
      assert.deepEqual(writes.profile, []); assert.equal(form.inputs.name.value, "Nicht speichern");
    });
    await run("S2.4: execution like planning never sends stale execution fields", async () => {
      await reset({ extension: { planning: assignment(), executionSameAsPlanning: false, execution: assignment("free", null, contact("Alte Ausführung")) } });
      form.sameInput.checked = true; form.sameInput.onchange();
      assert.equal(form.roleInputs.execution.inputs.name.disabled, true); await form.rolesSave.onclick();
      assert.deepEqual(writes.roles, [{ projectId: "a", executionSameAsPlanning: true }]);
    });
    await run("S2.4: central and project contacts send their distinct selected reference IDs", async () => {
      await reset(); source("planning", "person"); form.roleInputs.planning.contact.value = "central-1";
      form.sameInput.checked = false; form.sameInput.onchange(); source("execution", "project_person"); form.roleInputs.execution.contact.value = "project-person-1";
      form.roleInputs.planning.inputs.name.value = "Inaktiver Freitext";
      await form.rolesSave.onclick();
      assert.deepEqual(writes.roles, [{ projectId: "a", executionSameAsPlanning: false, planning: assignment("person", "central-1"), execution: assignment("project_person", "project-person-1") }]);
      assert.deepEqual(writes.profile, []);
    });
    await run("S2.4: rejected contact selection keeps the draft and enables retry", async () => {
      await reset(); source("planning", "person");
      api.sigekoSaveProjectData = async payload => { writes.roles.push(payload); return { ok: false, error: "Person nicht verfügbar", code: "PERSON_NOT_FOUND" }; };
      await form.rolesSave.onclick();
      assert.deepEqual(writes.roles[0].planning, assignment("person")); assert.match(form.rolesStatus.textContent, /nicht gespeichert: Person nicht verfügbar/);
      assert.equal(form.roleInputs.planning.source.value, "person"); assert.equal(form.rolesSave.disabled, false); assert.equal(form.roleInputs.planning.contact.disabled, false);
    });
    await run("S2.4: unavailable saved contact remains visible and an unchanged reference is omitted", async () => {
      await reset({ extension: { planning: assignment("person", "deleted-1"), executionSameAsPlanning: true, execution: null } });
      data.planning = { assignment: assignment("person", "deleted-1"), values: null, sourceMissing: true };
      await form.load();
      assert.equal(form.roleInputs.planning.contact.value, "deleted-1"); assert.match(form.roleInputs.planning.contact.children.at(-1).textContent, /nicht verfügbar/);
      assert.match(form.roleInputs.planning.resolved.textContent, /Quelle nicht verfügbar/);
      await form.rolesSave.onclick(); assert.deepEqual(writes.roles, [{ projectId: "a", executionSameAsPlanning: true }]);
    });
    await run("S2.4: a failed contact list is explicit while other sources remain usable", async () => {
      await reset({ overrides: { firmDirectoryListAll: async ({ kind }) => kind === "global_firm" ? { ok: false, error: "Kontaktzugriff fehlgeschlagen" } : { ok: true, list: [{ ref: { kind: "project_firm", id: "project-firm", projectId: "a" }, name: "Projektfirma" }] } } });
      assert.equal(form.rolesReady, true); assert.match(form.rolesStatus.textContent, /Kontaktliste konnte nicht geladen/);
      source("planning", "person"); assert.match(form.roleInputs.planning.contact.children[0].textContent, /konnte nicht geladen/);
      source("planning", "project_person"); assert.equal(form.roleInputs.planning.contact.children[1].value, "project-person-1");
      assert.deepEqual(writes, { profile: [], roles: [] });
    });
    await run("S2.4: failed profile save retains every draft including logo and restores controls", async () => {
      await reset(); form.inputs.name.value = "Entwurf"; form.inputs.email.value = "entwurf@example.test";
      form.logoInput.files = [{ path: "C:\\Logos\\neues.jpg" }]; form.logoInput.onchange();
      api.sigekoSaveCoordinatorProfile = async () => { throw new Error("Dateisystem nicht verfügbar"); };
      await form.profileSave.onclick();
      assert.equal(form.inputs.name.value, "Entwurf"); assert.equal(form.inputs.email.value, "entwurf@example.test"); assert.equal(form.logoPath, "C:\\Logos\\neues.jpg");
      assert.match(form.profileStatus.textContent, /Profil nicht gespeichert: Dateisystem/); assert.equal(form.profileSave.disabled, false); assert.equal(form.logoInput.disabled, false);
      form.logoInput.files = [{ path: "C:\\Logos\\ungueltig.svg" }]; form.logoInput.onchange(); assert.equal(form.logoPath, "C:\\Logos\\neues.jpg");
      form.logoClear.onclick(); assert.equal(form.logoPath, null); assert.deepEqual(writes.roles, []);
    });
    await run("S2.4: each pending save blocks duplicate writes and navigation", async () => {
      await reset(); const profileGate = deferred(), rolesGate = deferred();
      api.sigekoSaveCoordinatorProfile = async payload => { writes.profile.push(payload); return profileGate.promise; };
      const profileSave = form.profileSave.onclick(); await form.profileSave.onclick();
      assert.equal(form.profileSave.disabled, true); assert.equal(writes.profile.length, 1);
      refs.getM80Ref("sigeko.screen.projects").element.onclick(); assert.deepEqual(navigations, []);
      profileGate.resolve({ ok: true, data: clone(profile) }); await profileSave;
      api.sigekoSaveProjectData = async payload => { writes.roles.push(payload); return rolesGate.promise; };
      const rolesSave = form.rolesSave.onclick(); await form.rolesSave.onclick();
      assert.equal(form.rolesSave.disabled, true); assert.equal(writes.roles.length, 1);
      refs.getM80Ref("sigeko.screen.workspace").element.onclick(); assert.deepEqual(navigations, []);
      rolesGate.resolve({ ok: true, data: clone(data) }); await rolesSave; assert.equal(form.rolesSave.disabled, false);
    });
    await run("S2.4: archived projects prohibit role writes while the shared profile remains editable", async () => {
      await reset({ archived: true });
      assert.equal(form.rolesSave.disabled, true); assert.equal(form.sameInput.disabled, true); assert.equal(form.roleInputs.planning.source.disabled, true);
      assert.match(form.rolesStatus.textContent, /schreibgeschützt/); await form.rolesSave.onclick(); assert.deepEqual(writes.roles, []);
      assert.equal(form.profileSave.disabled, false); form.inputs.name.value = "Modulprofil"; await form.profileSave.onclick(); assert.equal(writes.profile.length, 1);
    });
    await run("S2.4: failed loads cannot enable saves for unverified data", async () => {
      await reset({ overrides: { sigekoGetCoordinatorProfile: async () => ({ ok: false, error: "Profil offline" }), sigekoGetProjectData: async () => ({ ok: false, error: "Projekt offline" }), projectsList: async () => ({ ok: true, list: [] }) } });
      assert.equal(form.profileSave.disabled, true); assert.equal(form.rolesSave.disabled, true);
      assert.match(form.profileStatus.textContent, /Profil offline/); assert.match(form.rolesStatus.textContent, /Projekt offline/);
      await form.profileSave.onclick(); await form.rolesSave.onclick(); assert.deepEqual(writes, { profile: [], roles: [] });
    });
    await run("S2.4: dirty navigation requires discard and never performs an implicit save", async () => {
      await reset(); form.inputs.name.value = "Ungespeichert";
      refs.getM80Ref("sigeko.screen.projects").element.onclick(); assert.deepEqual(navigations, []);
      confirmResult = true; refs.getM80Ref("sigeko.screen.projects").element.onclick(); assert.deepEqual(navigations, ["projects"]);
      assert.deepEqual(writes, { profile: [], roles: [] });
    });
    await run("S2.4: delayed load responses after project switch cannot mutate the current view or its refs", async () => {
      await reset(); const old = form, oldLabel = old.projectLabel.textContent, gate = deferred();
      api.sigekoGetCoordinatorProfile = () => gate.promise; api.sigekoGetProjectData = () => gate.promise;
      const pending = old.load(); await new Promise(resolve => setImmediate(resolve));
      old.destroy(); old.root.remove(); const newData = makeData("b");
      api.sigekoGetCoordinatorProfile = async () => ({ ok: true, data: { ...contact("Neues Profil"), logo_path: null } });
      api.sigekoGetProjectData = async () => ({ ok: true, data: newData });
      api.firmDirectoryListAll = async () => ({ ok: true, list: [] });
      form = mount("b"); await form.load();
      gate.resolve({ ok: true, data: { ...makeData("a"), name: "Verspätetes Profil" } }); await pending;
      assert.equal(form.project.id, "b"); assert.equal(form.inputs.name.value, "Neues Profil"); assert.equal(old.projectLabel.textContent, oldLabel);
      assert.equal(refs.getM80Ref("sigeko.screen").element, form.root); assert.equal(refs.validateM83ComponentReferences([contract.componentId]).ok, true);
    });
    await run("S2.4: delayed save after destroy leaves a replacement screen and its refs intact", async () => {
      await reset(); const old = form, gate = deferred();
      api.sigekoSaveCoordinatorProfile = () => gate.promise;
      old.inputs.name.value = "Alter Entwurf"; const pending = old.profileSave.onclick();
      old.destroy(); old.root.remove(); form = mount(); await form.load();
      gate.resolve({ ok: true, data: { ...contact("Späte Antwort"), logo_path: null } }); await pending;
      assert.equal(form.inputs.name.value, "Steffen"); assert.equal(old.inputs.name.value, "Alter Entwurf");
      assert.equal(refs.getM80Ref("sigeko.screen.profile.name.input").element, form.inputs.name);
    });
    await run("SiGeKo: all 206 slots have exact mounted attributes, valid parents and domain locks", async () => {
      await reset(); assert.equal(contract.slots.length, 206); assert.deepEqual(contract.requiredSlots, contract.slots.map(slot => slot.slotId));
      assert.equal(refs.validateM83ComponentReferences([contract.componentId]).ok, true);
      for (const slot of contract.slots) {
        const entry = slot.element, ref = refs.getM80Ref(entry.id); assert.equal(ref.contractTargets.length, 1);
        for (const [key, value] of Object.entries({ "inspector-id": entry.id, "editor-kind": entry.type, "editor-label": entry.name, "editor-parent": entry.parentId || "", "editor-editable": "true", "editor-ops": entry.allowedOps.join(",") })) assert.equal(ref.element.getAttribute(`data-ui-${key}`), value, `${entry.id} ${key}`);
        if (entry.parentId) assert.equal(ref.element.parentElement, refs.getM80Ref(entry.parentId).element, entry.id);
        for (const operation of ["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"]) assert.ok(entry.lockedOps.includes(operation), `${entry.id} ${operation}`);
      }
    });
    await run("S2.4: editor font and geometry changes cannot alter role values or call either save", async () => {
      await reset(); source("planning", "free"); form.roleInputs.planning.inputs.name.value = "Fachinhalt";
      const profileBefore = form._profileDraft(), rolesBefore = form._rolesDraft();
      refs.applyM80State("sigeko.screen.profile.name.input", { fontSize: 17 }, "textResize");
      refs.applyM80State("sigeko.screen.planning", { x: 8, y: 6 }, "move");
      refs.applyM80State("sigeko.screen.roles.save", { width: 220 }, "resizeWidth");
      assert.equal(form.inputs.name.style.fontSize, "17px"); assert.equal(form.rolesSave.style.width, "220px");
      assert.deepEqual(form._profileDraft(), profileBefore); assert.deepEqual(form._rolesDraft(), rolesBefore); assert.deepEqual(writes, { profile: [], roles: [] });
    });
    await run("S3: red readiness shows concrete project and authority issues without blocking editing", async () => {
      await reset();
      assert.equal(form.readinessViews.project.status.textContent, "Rot – Angaben fehlen.");
      assert.match(form.readinessViews.project.issues.textContent, /Bauherr/);
      assert.equal(form.readinessViews.authorities.status.textContent, "Rot – Angaben fehlen.");
      assert.match(form.readinessViews.authorities.issues.textContent, /Projektkontakt fehlt/);
      assert.match(form.readinessWarning.textContent, /ungespeicherte Eingaben/);
      assert.equal(form.profileSave.disabled, false); assert.equal(form.rolesSave.disabled, false);
      assert.deepEqual(writes, { profile: [], roles: [] });
    });
    await run("S3: refresh reads saved readiness and preserves both unsaved drafts", async () => {
      await reset(); source("planning", "free"); form.roleInputs.planning.inputs.name.value = "Rollenentwurf";
      form.inputs.name.value = "Profilentwurf"; const before = [form._profileDraft(), form._rolesDraft()];
      api.sigekoGetReadiness = async payload => { assert.deepEqual(payload, { projectId: "a" }); return { ok: true, data: readiness("a", "green") }; };
      await form.readinessRefresh.onclick();
      assert.equal(form.readinessViews.project.status.textContent, "Grün – Angaben vollständig.");
      assert.deepEqual([form._profileDraft(), form._rolesDraft()], before); assert.deepEqual(writes, { profile: [], roles: [] });
    });
    await run("S3: successful profile and role saves each refresh persisted readiness", async () => {
      await reset(); let reads = 0;
      api.sigekoGetReadiness = async () => { reads++; return { ok: true, data: readiness("a", "green") }; };
      await form.profileSave.onclick(); assert.equal(reads, 1);
      await form.rolesSave.onclick(); assert.equal(reads, 2); assert.equal(form.readinessData.projectData.status, "green");
    });
    await run("S3: failed readiness clears prior green and allows retry and domain editing", async () => {
      await reset(); api.sigekoGetReadiness = async () => ({ ok: true, data: readiness("a", "green") }); await form._loadReadiness();
      api.sigekoGetReadiness = async () => ({ ok: false, error: "SQLite nicht erreichbar" }); await form._loadReadiness();
      assert.equal(form.readinessData, null); assert.equal(form.readinessViews.project.status.textContent, "Prüfung nicht verfügbar.");
      assert.match(form.readinessWarning.textContent, /SQLite nicht erreichbar/); assert.equal(form.readinessRefresh.disabled, false);
      assert.equal(form.rolesSave.disabled, false); assert.equal(form.profileSave.disabled, false);
      api.sigekoGetReadiness = async () => ({ ok: true, data: readiness() }); await form._loadReadiness();
      assert.equal(form.readinessData.projectData.status, "red");
    });
    await run("S3: readiness failure after successful save does not report an unsaved profile", async () => {
      await reset(); api.sigekoGetReadiness = async () => { throw new Error("Lesefehler"); };
      await form.profileSave.onclick(); assert.equal(writes.profile.length, 1);
      assert.equal(form.profileStatus.textContent, "Profil gespeichert."); assert.match(form.readinessWarning.textContent, /Lesefehler/);
    });
    await run("S3: late readiness responses cannot replace newer results or restore stale green", async () => {
      await reset(); const gate = deferred(); api.sigekoGetReadiness = () => gate.promise;
      const pending = form._loadReadiness(); assert.equal(form.readinessData, null); assert.equal(form.readinessRefresh.disabled, true);
      api.sigekoGetReadiness = async () => ({ ok: true, data: readiness() }); await form._loadReadiness();
      gate.resolve({ ok: true, data: readiness("a", "green") }); await pending;
      assert.equal(form.readinessData.projectData.status, "red"); assert.equal(form.readinessRefresh.disabled, false);
    });
    await run("S3: departed project readiness cannot update its replacement screen or refs", async () => {
      await reset(); const old = form, gate = deferred(); api.sigekoGetReadiness = () => gate.promise;
      const pending = old._loadReadiness(); old.destroy(); old.root.remove();
      api.sigekoGetReadiness = async () => ({ ok: true, data: readiness("b") }); form = mount("b"); await form._loadReadiness();
      gate.resolve({ ok: true, data: readiness("a", "green") }); await pending;
      assert.equal(form.readinessData.projectId, "b"); assert.equal(old.readinessData, null);
      assert.equal(refs.getM80Ref("sigeko.screen.readiness.project.status").element, form.readinessViews.project.status);
    });
    await run("S3: pending readiness never delays loaded forms, completed saves or navigation", async () => {
      const gate = deferred(); await reset({ overrides: { sigekoGetReadiness: () => gate.promise } });
      assert.equal(form.readinessBusy, true); assert.equal(form.profileSave.disabled, false); assert.equal(form.rolesSave.disabled, false);
      await form.profileSave.onclick(); assert.equal(form.profileBusy, false); assert.equal(form.profileSave.disabled, false);
      await form.rolesSave.onclick(); assert.equal(form.rolesBusy, false); assert.equal(form.rolesSave.disabled, false);
      refs.getM80Ref("sigeko.screen.readiness.editProject").element.onclick(); assert.deepEqual(navigations, [{ projectId: "a" }]);
      gate.resolve({ ok: true, data: readiness() }); await new Promise(resolve => setImmediate(resolve));
      assert.equal(form.readinessBusy, false); assert.deepEqual(writes.profile.length, 1); assert.deepEqual(writes.roles.length, 1);
    });
    await run("S3: wrong-project or malformed readiness is unavailable rather than green", async () => {
      await reset();
      for (const data of [readiness("b", "green"), { ...readiness(), projectData: { status: "green", issues: null } }]) {
        api.sigekoGetReadiness = async () => ({ ok: true, data }); await form._loadReadiness();
        assert.equal(form.readinessData, null); assert.equal(form.readinessViews.project.status.textContent, "Prüfung nicht verfügbar.");
      }
    });
    await run("S3: remediation opens the current central project and honors unsaved changes", async () => {
      await reset(); const edit = refs.getM80Ref("sigeko.screen.readiness.editProject").element;
      edit.onclick(); assert.deepEqual(navigations, [{ projectId: "a" }]);
      form.inputs.name.value = "Entwurf"; edit.onclick(); assert.equal(navigations.length, 1);
      confirmResult = true; edit.onclick(); assert.equal(navigations.length, 2);
      refs.getM80Ref("sigeko.screen.readiness.editRoles").element.onclick();
      assert.equal(form.basicPanel.scrolled.block, "start"); assert.equal(form.inputs.name.value, "Entwurf");
      assert.deepEqual(writes, { profile: [], roles: [] });
    });
    await run("S4.3: overview keeps all eight categories and immutable emergency numbers separate from editable stock", async () => {
      const panel = await panelReady();
      assert.equal(panel.categoryInput.children.length, 7); assert.ok(panel.categoryInput.children.every(option => option.value !== "EMERGENCY_112"));
      for (const suffix of ["labor", "hospital", "doctor", "water", "electricity", "gas", "emergency", "police"]) {
        assert.ok(refs.getM80Ref(`sigeko.screen.authorities.overview.${suffix}`).element.textContent);
      }
      assert.match(refs.getM80Ref("sigeko.screen.authorities.overview.emergency").element.textContent, /112/);
      assert.match(refs.getM80Ref("sigeko.screen.authorities.overview.police").element.textContent, /110/);
      assert.equal(panel.applyButton.disabled, true); assert.equal(panel.confirmButton.disabled, true);
      assert.deepEqual(authorityWrites, { save: [], confirm: [], uncertain: [], assign: [], apply: [] });
      refs.getM80Ref("sigeko.screen.readiness.editAuthorities").element.onclick();
      assert.equal(refs.getM80Ref("sigeko.screen.authorities").element.scrolled.block, "start");
    });
    await run("S4.3: saving stock confirming its verification and assigning a project contact are separate writes", async () => {
      const panel = await panelReady({ records: [authorityRecord()] }); await selectRecord(panel);
      input(panel.inputs.organization, "Gespeicherte neue Stelle"); await panel.saveButton.onclick(); await settle();
      assert.equal(authorityWrites.save.length, 1); assert.equal(authorityWrites.save[0].id, "authority-1");
      assert.equal(authorityWrites.save[0].expectedRevision, 2); assert.equal(authorityWrites.save[0].patch.organization, "Gespeicherte neue Stelle");
      assert.equal(authorityWrites.confirm.length, 0); assert.equal(authorityWrites.assign.length, 0);
      assert.equal(panel.selectedRecord.verification_status, "unverified");
      await panel.confirmButton.onclick(); await settle(); assert.deepEqual(authorityWrites.confirm, [{ id: "authority-1", expectedRevision: 3 }]);
      assert.equal(authorityWrites.assign.length, 0); input(panel.noteInput, "Zuständigkeit für diese Baustelle geprüft");
      await panel.assignConfirmButton.onclick(); await settle(); assert.equal(authorityWrites.assign.length, 1);
      assert.deepEqual(authorityWrites.assign[0], { projectId: "a", category: "LABOR_AUTHORITY", sourceId: "authority-1", sourceRevision: 4,
        expectedRevision: 0, expectedAddress: authorityAddress, status: "confirmed", note: "Zuständigkeit für diese Baustelle geprüft" });
      assert.deepEqual(writes, { profile: [], roles: [] });
    });
    await run("S4.3: unsaved visible stock values block confirmation uncertainty and both project assignments", async () => {
      const panel = await panelReady({ records: [authorityRecord()] }); await selectRecord(panel);
      input(panel.noteInput, "Geprüfte Zuständigkeit"); input(panel.reasonInput, "Quelle unklar"); input(panel.inputs.phone, "Ungespeicherte Nummer");
      for (const button of [panel.confirmButton, panel.uncertainButton, panel.assignConfirmButton, panel.assignUncertainButton]) {
        assert.equal(button.disabled, true); await button.onclick();
      }
      assert.deepEqual(authorityWrites, { save: [], confirm: [], uncertain: [], assign: [], apply: [] });
      assert.equal(panel.inputs.phone.value, "Ungespeicherte Nummer");
    });
    await run("S4.3: successful assignment preserves calculated orange for an unconfirmed source", async () => {
      const row = { ...authorityRecord(), verification_status: "unverified", verified_at: null, verification_method: null };
      const panel = await panelReady({ records: [row] }); await selectRecord(panel); input(panel.noteInput, "Projektbeurteilung dokumentiert");
      await panel.assignConfirmButton.onclick(); await settle(); assert.equal(authorityWrites.assign.length, 1);
      assert.equal(panel.projectData.categories.find(entry => entry.category === "LABOR_AUTHORITY").status, "orange");
      assert.match(refs.getM80Ref("sigeko.screen.authorities.overview.labor").element.textContent, /Orange|Prüfbedarf/i);
      assert.equal(authorityWrites.confirm.length, 0);
    });
    await run("S4.3: batch action sends only offered missing proposals and never invents replacements", async () => {
      const overview = authorityOverview(); const proposal = { category: "WATER", sourceId: "water-1", sourceRevision: 3, expectedRevision: 0 };
      overview.categories.find(entry => entry.category === "WATER").proposal = proposal;
      overview.categories.find(entry => entry.category === "GAS").candidates = [authorityRecord("gas-1", "GAS")];
      const panel = await panelReady({ projectAuthorities: overview, records: [authorityRecord()] }); await selectRecord(panel);
      assert.equal(panel.applyButton.disabled, false);
      input(panel.inputs.organization, "Noch nicht gespeicherter sichtbarer Bestand");
      assert.equal(panel.applyButton.disabled, true); await panel.applyButton.onclick(); assert.deepEqual(authorityWrites.apply, []);
      confirmResult = true; await selectRecord(panel); assert.equal(panel.applyButton.disabled, false);
      for (const note of [panel.reasonInput, panel.noteInput]) {
        input(note, "Ungespeicherte Beurteilung"); assert.equal(panel.applyButton.disabled, true);
        await panel.applyButton.onclick(); assert.deepEqual(authorityWrites.apply, []);
        input(note, ""); assert.equal(panel.applyButton.disabled, false);
      }
      await panel.newButton.onclick(); assert.equal(panel.applyButton.disabled, true);
      await panel.applyButton.onclick(); assert.deepEqual(authorityWrites.apply, []);
      confirmResult = true; await selectRecord(panel); assert.equal(panel.applyButton.disabled, false);
      await panel.applyButton.onclick(); assert.deepEqual(authorityWrites.apply, [{ projectId: "a", expectedAddress: authorityAddress, selections: [proposal] }]);
      assert.deepEqual(authorityWrites.assign, []);
    });
    await run("S4.3: missing source still displays the saved project snapshot and its concrete warning", async () => {
      const overview = authorityOverview(); const entry = overview.categories.find(entry => entry.category === "LABOR_AUTHORITY");
      Object.assign(entry, { status: "orange", assignment: { revision: 4, source_id: "deleted", source_revision: 2,
        snapshot: { ...authorityRecord("deleted"), organization: "Historische Behörde", phone: "040 11122", source: "Archivquelle" },
        assessment_note: "Früher geprüft", assessment_status: "confirmed" }, issues: [{ code: "SOURCE_MISSING", message: "Quelle fehlt im lokalen Bestand." }] });
      const panel = await panelReady({ projectAuthorities: overview });
      const snapshot = refs.getM80Ref("sigeko.screen.authorities.assignment.snapshot").element.textContent;
      assert.match(snapshot, /Historische Behörde/); assert.match(snapshot, /040 11122/); assert.match(snapshot, /Archivquelle/);
      assert.match(refs.getM80Ref("sigeko.screen.authorities.overview.labor").element.textContent, /Quelle fehlt/);
      assert.equal(panel.assignConfirmButton.disabled, true); assert.deepEqual(authorityWrites.assign, []);
    });
    await run("S4.3: refresh and foreign profile or role saves retain stock drafts and both review notes", async () => {
      const panel = await panelReady({ records: [authorityRecord()] }); await selectRecord(panel);
      input(panel.inputs.organization, "Bestandsentwurf"); input(panel.reasonInput, "Unsicherheitsentwurf"); input(panel.noteInput, "Prüfnotizentwurf");
      form.inputs.name.value = "Profilentwurf"; source("planning", "free"); form.roleInputs.planning.inputs.name.value = "Rollenentwurf";
      await panel.refreshButton.onclick();
      assert.equal(form.inputs.name.value, "Profilentwurf"); assert.equal(form.roleInputs.planning.inputs.name.value, "Rollenentwurf");
      await form.profileSave.onclick(); await form.rolesSave.onclick();
      assert.equal(panel.inputs.organization.value, "Bestandsentwurf"); assert.equal(panel.reasonInput.value, "Unsicherheitsentwurf"); assert.equal(panel.noteInput.value, "Prüfnotizentwurf");
      assert.equal(panel.isDirty(), true); assert.deepEqual(authorityWrites, { save: [], confirm: [], uncertain: [], assign: [], apply: [] });
    });
    await run("S4.3: category contact new and navigation changes require deliberate draft discard", async () => {
      const panel = await panelReady({ records: [authorityRecord(), authorityRecord("authority-2")] }); await selectRecord(panel);
      input(panel.inputs.organization, "Nicht verwerfen");
      panel.categoryInput.value = "WATER"; await panel.categoryInput.onchange(); assert.equal(panel.categoryInput.value, "LABOR_AUTHORITY");
      panel.contactInput.value = "authority-2"; await panel.contactInput.onchange(); assert.equal(panel.contactInput.value, "authority-1");
      await panel.newButton.onclick(); assert.equal(panel.inputs.organization.value, "Nicht verwerfen");
      refs.getM80Ref("sigeko.screen.projects").element.onclick(); assert.deepEqual(navigations, []);
      confirmResult = true; panel.contactInput.value = "authority-2"; await panel.contactInput.onchange();
      assert.equal(panel.inputs.organization.value, "Stelle authority-2");
      input(panel.noteInput, "Nur eine ungespeicherte Prüfnotiz"); confirmResult = false;
      await panel.newButton.onclick(); assert.equal(panel.contactInput.value, "authority-2");
      confirmResult = true; await panel.newButton.onclick(); assert.equal(panel.selectedRecord, null); assert.equal(panel.inputs.organization.value, "");
      assert.deepEqual(authorityWrites, { save: [], confirm: [], uncertain: [], assign: [], apply: [] });
    });
    await run("S4.3: pending authority writes prevent duplicate actions and navigation while preserving foreign drafts", async () => {
      const panel = await panelReady({ records: [authorityRecord()] }); await selectRecord(panel); const gate = deferred();
      input(panel.inputs.organization, "Speicherentwurf"); form.inputs.name.value = "Fremder Entwurf";
      api.sigekoSaveAuthorityRecord = payload => { authorityWrites.save.push(clone(payload)); return gate.promise; };
      const pending = panel.saveButton.onclick(); await panel.saveButton.onclick();
      assert.equal(authorityWrites.save.length, 1); assert.equal(panel.busy, true);
      confirmResult = true; refs.getM80Ref("sigeko.screen.projects").element.onclick(); assert.deepEqual(navigations, []);
      gate.resolve({ ok: false, error: "Revision wurde inzwischen geändert", code: "AUTHORITY_CONFLICT" }); await pending;
      assert.equal(panel.inputs.organization.value, "Speicherentwurf"); assert.equal(form.inputs.name.value, "Fremder Entwurf");
      assert.equal(panel.saveButton.disabled, true); assert.equal(panel.busy, false);
      await panel.refreshButton.onclick(); assert.equal(panel.inputs.organization.value, "Speicherentwurf"); assert.equal(panel.saveButton.disabled, false);
    });
    await run("S4.3: failed refresh clears previous green while retaining drafts and enabling retry", async () => {
      const overview = authorityOverview(); overview.status = "green"; for (const entry of overview.categories) { entry.status = "green"; entry.issues = []; }
      const panel = await panelReady({ projectAuthorities: overview, records: [authorityRecord()] }); await selectRecord(panel);
      input(panel.inputs.organization, "Behalten"); api.sigekoGetProjectAuthorities = async () => ({ ok: false, error: "Behörden offline" });
      await panel.load(); assert.equal(panel.projectData, null); assert.equal(panel.inputs.organization.value, "Behalten");
      assert.doesNotMatch(refs.getM80Ref("sigeko.screen.authorities.overview.labor").element.textContent, /Grün/);
      assert.equal(panel.assignConfirmButton.disabled, true); assert.equal(panel.refreshButton.disabled, false);
      assert.equal(form.profileSave.disabled, false); assert.equal(form.rolesSave.disabled, false);
    });
    await run("S4.3: late authority responses cannot overwrite a newer result or replacement screen refs", async () => {
      const panel = await panelReady(); const gate = deferred(); api.sigekoGetProjectAuthorities = () => gate.promise;
      const pending = panel.load(); api.sigekoGetProjectAuthorities = async () => ({ ok: true, data: authorityOverview() }); await panel.load();
      const green = authorityOverview(); green.status = "green"; gate.resolve({ ok: true, data: green }); await pending;
      assert.equal(panel.projectData.status, "red");
      const destroyedGate = deferred(); api.sigekoGetProjectAuthorities = () => destroyedGate.promise; const departed = panel.load();
      form.destroy(); form.root.remove(); api.sigekoGetProjectAuthorities = async () => ({ ok: true, data: authorityOverview("b") });
      form = mount("b"); await form.authoritiesPanel.load(); destroyedGate.resolve({ ok: true, data: green }); await departed;
      assert.equal(form.authoritiesPanel.projectData.projectId, "b");
      assert.equal(refs.getM80Ref("sigeko.screen.authorities.category.input").element, form.authoritiesPanel.categoryInput);
    });
    await run("S4.3: hung authority reads do not delay profile roles saves or clean navigation", async () => {
      const gate = deferred(); await reset({ overrides: { sigekoGetProjectAuthorities: () => gate.promise, sigekoListAuthorityRecords: () => gate.promise } });
      assert.equal(form.authoritiesPanel.loading, true); assert.equal(form.profileSave.disabled, false); assert.equal(form.rolesSave.disabled, false);
      await form.profileSave.onclick(); await form.rolesSave.onclick();
      assert.equal(form.profileBusy, false); assert.equal(form.rolesBusy, false);
      refs.getM80Ref("sigeko.screen.projects").element.onclick(); assert.deepEqual(navigations, ["projects"]);
      gate.resolve({ ok: false, error: "Abgebrochene Abfrage" }); await new Promise(resolve => setImmediate(resolve));
    });
    await run("S4.3: delayed authority save after destruction leaves the replacement form untouched", async () => {
      const old = await panelReady({ records: [authorityRecord()] }); await selectRecord(old); const gate = deferred();
      input(old.inputs.organization, "Alter Speicherentwurf"); api.sigekoSaveAuthorityRecord = () => gate.promise;
      const pending = old.saveButton.onclick(); form.destroy(); form.root.remove();
      form = mount(); await form.load(); await form.authoritiesPanel.load();
      gate.resolve({ ok: true, data: { ...authorityRecord(), organization: "Späte Speicherantwort", revision: 3 } }); await pending;
      assert.notEqual(form.authoritiesPanel.inputs.organization.value, "Späte Speicherantwort");
      assert.equal(refs.getM80Ref("sigeko.screen.authorities.record.organization.input").element, form.authoritiesPanel.inputs.organization);
      assert.equal(old.inputs.organization.value, "Alter Speicherentwurf");
    });
    await run("S4.3: archived project controls reject every authority mutation with loaded records", async () => {
      const panel = await panelReady({ archived: true, records: [authorityRecord()] }); await selectRecord(panel);
      for (const button of [panel.saveButton, panel.confirmButton, panel.uncertainButton, panel.assignConfirmButton, panel.assignUncertainButton, panel.applyButton, panel.newButton]) {
        assert.equal(button.disabled, true); await button.onclick();
      }
      assert.deepEqual(authorityWrites, { save: [], confirm: [], uncertain: [], assign: [], apply: [] });
      assert.equal(form.profileSave.disabled, false);
    });
    await run("S4.3: fast authority reads cannot enable stock writes before delayed project archive state is known", async () => {
      for (const delayed of ["project", "contacts"]) for (const archived of [false, true]) {
        await reset({ records: [authorityRecord()] }); form.destroy(); form.root.remove();
        const gate = deferred(); const savedContactApi = api.firmDirectoryListAll;
        const loadedProject = makeData(); if (archived) loadedProject.project.archived_at = "2026-09-01";
        api.sigekoGetProjectData = delayed === "project" ? () => gate.promise : async () => ({ ok: true, data: loadedProject });
        if (delayed === "contacts") api.firmDirectoryListAll = async payload => { await gate.promise; return savedContactApi(payload); };
        form = mount(); const pending = form.load(); await settle(); const panel = form.authoritiesPanel;
        assert.equal(form.project, null); assert.equal(panel.ready, true); assert.equal(panel.projectData.projectId, "a");
        assert.equal(form.profileReady, true); assert.equal(form.profileSave.disabled, false, `${delayed}: loaded profile remains editable`);
        await selectRecord(panel); input(panel.inputs.organization, "Noch gesperrter Entwurf");
        for (const button of [panel.saveButton, panel.confirmButton, panel.uncertainButton, panel.assignConfirmButton, panel.assignUncertainButton, panel.applyButton, panel.newButton]) {
          assert.equal(button.disabled, true, `${delayed}: project authorization pending`); await button.onclick();
        }
        assert.deepEqual(authorityWrites, { save: [], confirm: [], uncertain: [], assign: [], apply: [] });
        gate.resolve(delayed === "project" ? { ok: true, data: loadedProject } : undefined); await pending;
        assert.equal(form.project.id, "a"); assert.equal(panel.saveButton.disabled, archived);
        assert.equal(panel.inputs.organization.disabled, archived); assert.equal(form.profileSave.disabled, false);
        assert.deepEqual(authorityWrites, { save: [], confirm: [], uncertain: [], assign: [], apply: [] });
      }
    });
    await run("S4.3: editor styling cannot change authority drafts or invoke domain actions", async () => {
      const panel = await panelReady({ records: [authorityRecord()] }); await selectRecord(panel); input(panel.inputs.organization, "Fachentwurf"); input(panel.noteInput, "Fachnotiz");
      refs.applyM80State("sigeko.screen.authorities.record.organization.input", { fontSize: 18 }, "textResize");
      refs.applyM80State("sigeko.screen.authorities.record.save", { width: 230 }, "resizeWidth");
      assert.equal(panel.inputs.organization.value, "Fachentwurf"); assert.equal(panel.noteInput.value, "Fachnotiz");
      assert.equal(panel.inputs.organization.style.fontSize, "18px"); assert.equal(panel.saveButton.style.width, "230px");
      assert.deepEqual(authorityWrites, { save: [], confirm: [], uncertain: [], assign: [], apply: [] });
    });
  } finally {
    for (const screen of screens) { screen.destroy(); screen.root.remove(); }
    refs.resetM80PilotWorkingStatesForDiagnostic(); Object.assign(global, previous);
  }
}
module.exports = { runSigekoGrunddatenFormTests };
if (require.main === module) runSigekoGrunddatenFormTests(async (name, check) => { await check(); console.log("PASS", name); }).catch(error => { console.error(error); process.exitCode = 1; });
