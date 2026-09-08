"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const esm = file => importEsmFromFile(path.resolve(__dirname, "../..", file));

// Small DOM double for control/payload/ref lifecycle; real layout is checked in Electron.
class Element {
  constructor(tag) {
    this.tagName = tag.toUpperCase(); this.children = []; this.parentElement = null;
    this.attributes = {}; this.dataset = {}; this.value = ""; this.className = ""; this.listeners = {};
    this.style = { setProperty(k,v) { this[k] = v; }, getPropertyValue(k) { return this[k] || ""; }, removeProperty(k) { delete this[k]; } };
    this.classList = { add: (...names) => { this.className += ` ${names.join(" ")}`; }, contains: n => this.className.split(/\s+/).includes(n), toggle() {} };
  }
  get isConnected() { return this.tagName === "BODY" || !!this.parentElement?.isConnected; }
  setAttribute(k,v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] ?? null; }
  append(...nodes) { for (const node of nodes) { node.remove(); node.parentElement = this; this.children.push(node); } }
  appendChild(node) { this.append(node); return node; }
  prepend(node) { this.append(node); this.children.unshift(this.children.pop()); }
  removeChild(node) { this.children = this.children.filter(n => n !== node); node.parentElement = null; }
  remove() { this.parentElement?.removeChild(this); }
  set innerHTML(value) { assert.equal(value, ""); for (const node of [...this.children]) this.removeChild(node); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  addEventListener(k,fn) { (this.listeners[k] ||= []).push(fn); }
  removeEventListener() {}
  focus() {}
  getBoundingClientRect() { return { left: 0, top: 0, right: 320, bottom: 32, width: 320, height: 32 }; }
}

async function runPlannedStartFormTests(run) {
  const { default: Form } = await esm("src/renderer/modules/projektverwaltung/screens/ProjectFormHubScreen.js");
  const refs = await esm("src/renderer/ui-editor/m80Refs.js");
  const { createM80RegistrationDescriptor } = await esm("src/renderer/ui-editor/m80HostAdapter.js");
  const { projectPlannedStartUiEditorContract: contract, PLANNED_START_SCOPE: scope } = await esm("src/renderer/modules/projektverwaltung/screens/ProjectPlannedStart.uiEditorContract.js");
  const previous = { document: global.document, window: global.window, alert: global.alert };
  let writes = [], list = [], failure = false;
  global.document = { body: new Element("body"), createElement: tag => new Element(tag), querySelector: () => null };
  global.window = { dispatchEvent() {}, getComputedStyle: el => ({ ...el.style, fontSize: "12px", paddingLeft: "0px", paddingTop: "0px" }),
    bbmDb: { appIsPackaged: async () => ({ ok: true, isPackaged: true }), projectsList: async () => ({ ok: true, list }),
      projectsCreate: async payload => { writes.push(payload); return { ok: !failure, project: { id: "new" } }; },
      projectsUpdate: async payload => { writes.push(payload); return { ok: !failure }; } } };
  global.alert = () => {};
  const router = { async showProjects() {} };
  const make = async options => { const form = new Form({ router, mode: "modal", ...options }); await form.openModal(); await form.load(); return form; };
  let form;
  try {
    await run("S2.2: new form starts empty and sends independent dates through existing create", async () => {
      form = await make(); assert.equal(form.inpPlannedStart.type, "date"); assert.equal(form.inpPlannedStart.value, "");
      form.inpName.value = "Projekt"; form.inpStart.value = "2026-01-01"; form.inpEnd.value = "2027-12-31"; form.inpPlannedStart.value = "2026-09-08";
      await form._save(); assert.equal(writes.at(-1).geplanter_baubeginn, "2026-09-08"); assert.equal(writes.at(-1).start_date, "2026-01-01"); assert.equal(writes.at(-1).end_date, "2027-12-31");
      assert.equal(refs.getM80Ref(scope), null);
    });
    await run("S2.2: old form does not infer construction start and preserves all other fields", async () => {
      list = [{ id: "old", name: "Alt", project_number: "44", short: "Kurz", street: "Weg", zip: "12345", city: "Ort", project_lead: "PL", project_lead_phone: "0123", start_date: "2001-02-03", end_date: "2030-04-05", notes: "Erhalten" }];
      form = await make({ projectId: "old" }); assert.equal(form.inpPlannedStart.value, "");
      const before = form._collectPayload(); form.inpPlannedStart.value = "2026-10-11"; await form._save();
      assert.deepEqual(writes.at(-1), { projectId: "old", patch: { ...before, geplanter_baubeginn: "2026-10-11" } });
    });
    await run("S2.2: load edit and explicit clear use the same nullable payload", async () => {
      list[0].geplanter_baubeginn = "2026-10-11"; form = await make({ projectId: "old" });
      assert.equal(form.inpPlannedStart.value, "2026-10-11"); form.inpPlannedStart.value = ""; await form._save();
      assert.equal(writes.at(-1).patch.geplanter_baubeginn, null); assert.equal(writes.at(-1).patch.start_date, "2001-02-03");
    });
    await run("S2.2: cancel and busy never write; Enter uses existing save", async () => {
      form = await make({ projectId: "old" }); const count = writes.length;
      form._setBusy(true); assert.equal(form.inpPlannedStart.disabled, true); await form._save(); assert.equal(writes.length, count);
      form._setBusy(false); assert.equal(form.inpPlannedStart.disabled, false);
      let saves = 0; const save = form._save; form._save = () => { saves++; };
      form.inpPlannedStart.listeners.keydown[0]({ key: "Enter", target: form.inpPlannedStart, preventDefault() {} }); assert.equal(saves, 1); form._save = save;
      form.inpPlannedStart.value = "2029-01-01"; form._handleModalClose(); assert.equal(writes.length, count); assert.equal(refs.getM80Ref(scope), null);
    });
    await run("S2.2: failed save keeps date and re-enables the form", async () => {
      form = await make({ projectId: "old" }); failure = true; form.inpPlannedStart.value = "2028-02-03";
      await form._save(); failure = false; assert.equal(form.inpPlannedStart.value, "2028-02-03"); assert.equal(form.inpPlannedStart.disabled, false); assert.ok(form.overlayEl);
    });
    await run("S2.2: complete new component has exact mounted refs attributes and parents", () => {
      assert.equal(contract.slots.length, 5); assert.equal(contract.requiredSlots.length, 4);
      assert.equal(refs.validateM83ComponentReferences([contract.componentId]).ok, true);
      for (const slot of contract.slots.filter(s => s.required)) {
        const ref = refs.getM80Ref(slot.element.id); assert.equal(ref.contractTargets.length, 1);
        for (const [key, value] of Object.entries({ "inspector-id": slot.element.id, "editor-kind": slot.element.type, "editor-label": slot.element.name, "editor-parent": slot.element.parentId || "", "editor-editable": "true", "editor-ops": slot.element.allowedOps.join(",") })) assert.equal(ref.element.getAttribute(`data-ui-${key}`), value);
        if (slot.element.parentId) assert.equal(ref.element.parentElement, refs.getM80Ref(slot.element.parentId).element);
        assert.ok(slot.element.lockedOps.includes("modifyDomainData"));
      }
      assert.deepEqual(createM80RegistrationDescriptor().activeScopes, [scope]);
    });
    await run("S2.2: layout change does not change dates or write projects", () => {
      const count = writes.length, payload = form._collectPayload();
      refs.applyM80State(`${scope}.input`, { fontSize: 15 }, "textResize");
      assert.deepEqual(form._collectPayload(), payload); assert.equal(writes.length, count);
    });
    await run("S2.2: reopening rebinds only owned refs and closing restores underlying scope", async () => {
      const other = new Element("div"); document.body.append(other); refs.registerM80Ref("sigeko.screen", other);
      const originalRoot = form.root; form._closeModal(); assert.equal(refs.getM80Ref(scope), null); assert.equal(refs.getM80Ref("sigeko.screen").element, other);
      await form.openModal(); assert.equal(form.root, originalRoot); assert.equal(refs.validateM83ComponentReferences([contract.componentId]).ok, true);
      assert.deepEqual(createM80RegistrationDescriptor().activeScopes, [scope]); form.destroy(); assert.equal(refs.getM80Ref(scope), null);
    });
    await run("S2.2: page mode uses the same control and destroy clears its scope", () => {
      form = new Form({ router }); document.body.append(form.render()); form._fill(list[0]);
      assert.equal(form.inpPlannedStart.value, "2026-10-11"); assert.equal(form._collectPayload().geplanter_baubeginn, "2026-10-11"); form.destroy(); assert.equal(refs.getM80Ref(scope), null);
    });
  } finally { form?.destroy(); refs.resetM80PilotWorkingStatesForDiagnostic(); Object.assign(global, previous); }
}
module.exports = { runPlannedStartFormTests };
if (require.main === module) runPlannedStartFormTests(async (name, check) => { await check(); console.log("PASS", name); }).catch(err => { console.error(err); process.exitCode = 1; });
