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
  set textContent(value) { this._text = value; for (const node of [...this.children]) this.removeChild(node); }
  get textContent() { return this._text || ""; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  addEventListener(k,fn) { (this.listeners[k] ||= []).push(fn); }
  removeEventListener() {}
  focus() {}
  getBoundingClientRect() { return { left: 0, top: 0, right: 320, bottom: 32, width: 320, height: 32 }; }
}

async function runProjectBuilderFormTests(run) {
  const { default: Field } = await esm("src/renderer/modules/projektverwaltung/screens/ProjectBuilderField.js");
  const refs = await esm("src/renderer/ui-editor/m80Refs.js");
  const { projectBuilderUiEditorContract: contract, BUILDER_SCOPE: scope } = await esm("src/renderer/modules/projektverwaltung/screens/ProjectBuilder.uiEditorContract.js");
  const previous = { document: global.document, window: global.window };
  const globalFirm = { id: "global", name: "Bauherr GmbH", street: "Weg 1", zip: "12345", city: "Ort", ref: { kind: "global_firm", id: "global" } };
  const projectFirm = { id: "local", name: "Projektbauherr", ref: { kind: "project_firm", id: "local", projectId: "p1" } };
  const key = f => JSON.stringify([f.ref.kind, f.id]);
  let calls = [], globalList = [globalFirm], projectList = [projectFirm], error = false, pending;
  global.document = { body: new Element("body"), createElement: tag => new Element(tag), querySelector: () => null };
  global.window = { dispatchEvent() {}, getComputedStyle: el => ({...el.style,fontSize:"12px",paddingLeft:"0px",paddingTop:"0px"}), bbmDb: {
    appIsPackaged: async () => ({ok:true,isPackaged:true}),
    firmDirectoryListAll: async request => { calls.push(request); if (pending) return pending; if (error) return {ok:false,error:"Testfehler"}; return {ok:true,list: request.kind === "global_firm" ? globalList : projectList}; },
  } };
  let field;
  const make = async (projectId = "p1", project = null) => { field?.destroy(); field?.root.remove(); field = new Field({projectId}); document.body.append(field.render()); field.setProject(project); await field.load(); return field; };
  try {
    await run("Bauherr form: existing core directory provides globals and only current project; reads never create an assignment", async () => {
      await make(); assert.deepEqual(calls, [{kind:"global_firm",includeInactive:false},{kind:"project_firm",projectId:"p1",includeInactive:false}]);
      assert.deepEqual(field.patch(), {}); assert.equal(field.validationMessage(), ""); assert.equal(field.firms.size, 2);
      assert.equal(field.input.children.length, 3); assert.match(field.input.children[1].textContent,/Zentral:/); assert.match(field.input.children[2].textContent,/Projekt:/);
    });
    await run("Bauherr form: new project requires explicit existing global selection", async () => {
      calls = []; await make(null); assert.equal(calls.length, 1); assert.equal(field.input.value, ""); assert.match(field.validationMessage(), /Bauherrn/);
      field.input.value = key(globalFirm); field.input.onchange(); assert.equal(field.validationMessage(), ""); assert.deepEqual(field.patch(), {bauherr:{kind:"global_firm",id:"global"}}); assert.match(field.status.textContent,/Weg 1/);
    });
    await run("Bauherr form: persisted global and local references load without implicit writes; changed choice and explicit clear are distinct", async () => {
      await make("p1",{bauherr_firm_kind:"global_firm",bauherr_firm_id:"global"}); assert.equal(field.input.value,key(globalFirm)); assert.deepEqual(field.patch(),{});
      field.input.value = key(projectFirm); field.input.onchange(); assert.deepEqual(field.patch(),{bauherr:{kind:"project_firm",id:"local"}});
      field.setProject({bauherr_firm_kind:"project_firm",bauherr_firm_id:"local"}); assert.deepEqual(field.patch(),{});
      field.input.value=""; field.input.onchange(); assert.deepEqual(field.patch(),{bauherr:null}); assert.equal(field.validationMessage(), "");
    });
    await run("Bauherr form: missing saved source stays visible and unchanged edits preserve reference", async () => {
      await make("p1",{bauherr_firm_kind:"global_firm",bauherr_firm_id:"deleted"});
      assert.equal(field.input.value,JSON.stringify(["global_firm","deleted"])); assert.match(field.status.textContent,/nicht verfügbar/); assert.deepEqual(field.patch(),{}); assert.equal(field.validationMessage(),"");
      field.input.value=JSON.stringify(["global_firm","unknown"]); assert.match(field.validationMessage(),/nicht verfügbar/);
    });
    await run("Bauherr form: inactive and removed firms are excluded; refresh preserves an unsaved choice but invalidates removed source", async () => {
      globalList=[globalFirm,{...globalFirm,id:"inactive",is_active:0},{...globalFirm,id:"trash",is_trashed:1},{...globalFirm,id:"removed",removed_at:"2026-01-01"}];
      await make(); assert.equal(field.firms.size,2); field.input.value=key(globalFirm); globalList=[]; await field.load();
      assert.equal(field.input.value,key(globalFirm)); assert.match(field.validationMessage(),/nicht verfügbar/); assert.match(field.status.textContent,/nicht verfügbar/);
      globalList=[globalFirm]; await field.load(); assert.equal(field.input.value,key(globalFirm)); assert.equal(field.validationMessage(),""); assert.equal(field.input.children.length,3);
    });
    await run("Bauherr form: failed directory load preserves choice and allows explicit retry without silently applying data", async () => {
      await make(); field.input.value=key(projectFirm); error=true; await field.load();
      assert.equal(field.ready,false); assert.equal(field.input.disabled,true); assert.equal(field.refresh.disabled,false); assert.equal(field.input.value,key(projectFirm)); assert.match(field.status.textContent,/Testfehler/); assert.match(field.validationMessage(),/nicht verfügbar/);
      error=false; await field.refresh.onclick(); assert.equal(field.ready,true); assert.equal(field.input.disabled,false); assert.deepEqual(field.patch(),{bauherr:{kind:"project_firm",id:"local"}});
    });
    await run("Bauherr form: saved unavailable reference is preserved even if lookup fails", async () => {
      error=true; await make("p1",{bauherr_firm_kind:"global_firm",bauherr_firm_id:"deleted"});
      assert.deepEqual(field.patch(),{}); assert.equal(field.validationMessage(),""); error=false;
    });
    await run("Bauherr form: seven mounted refs have exact declared attributes and actual parents", async () => {
      await make(); assert.equal(contract.requiredSlots.length,7); assert.equal(refs.validateM83ComponentReferences([contract.componentId]).ok,true);
      for (const slot of contract.slots.filter(s=>s.required)) {
        const ref=refs.getM80Ref(slot.element.id); assert.equal(ref.contractTargets.length,1);
        for (const [name,value] of Object.entries({"inspector-id":slot.element.id,"editor-kind":slot.element.type,"editor-label":slot.element.name,"editor-parent":slot.element.parentId||"","editor-editable":"true","editor-ops":slot.element.allowedOps.join(",")})) assert.equal(ref.element.getAttribute(`data-ui-${name}`),value);
        if (slot.element.parentId) assert.equal(ref.element.parentElement,refs.getM80Ref(slot.element.parentId).element);
        assert.ok(slot.element.lockedOps.includes("modifyDomainData"));
      }
      field.input.value=key(globalFirm); const before=field.patch(); refs.applyM80State(`${scope}.input`,{fontSize:15},"textResize"); assert.deepEqual(field.patch(),before);
    });
    await run("Bauherr form: busy and archived state prevent selection but keep persisted assignment", async () => {
      await make("p1",{bauherr_firm_kind:"global_firm",bauherr_firm_id:"global"}); const count=calls.length;
      field.setBusy(true); assert.equal(field.input.disabled,true); assert.equal(field.refresh.disabled,true); await field.load(); assert.equal(calls.length,count);
      field.setBusy(false); assert.equal(field.input.disabled,false); field.setProject({archived_at:"2026-01-01",bauherr_firm_kind:"global_firm",bauherr_firm_id:"global"}); assert.equal(field.input.disabled,true); assert.deepEqual(field.patch(),{});
    });
    await run("Bauherr form: interrupted initial load restarts when the same instance is reopened", async () => {
      field?.destroy(); field?.root.remove(); let resolve; pending=new Promise(done=>{resolve=done;});
      field=new Field({projectId:"p1"}); document.body.append(field.render()); field.setProject(null); const loading=field.load(); assert.equal(field.loading,true);
      field.destroy(); assert.equal(field.loading,false); pending=null; field.bind();
      for(let i=0;i<12;i++) await Promise.resolve();
      assert.equal(field.ready,true); assert.equal(field.input.disabled,false); assert.equal(field.firms.size,2);
      resolve({ok:true,list:[]}); await loading; assert.equal(field.firms.size,2);
    });
    await run("Bauherr form: deferred development launcher remains registered after closing and reopening the same instance", async () => {
      let resolve; const deferred=new Promise(done=>{resolve=done;}); window.bbmDb.appGetBuildChannel=()=>deferred;
      await make(); const root=field.root; field.destroy(); root.remove(); resolve({ok:true,channel:"DEV"});
      for(let i=0;i<12;i++) await Promise.resolve();
      assert.ok(field.refs[".editor"]); assert.equal(refs.getM80Ref(scope),null);
      document.body.append(root); field.bind();
      assert.equal(refs.getM80Ref(`${scope}.editor`).element,field.refs[".editor"]);
      assert.equal(refs.validateM83ComponentReferences([contract.componentId]).ok,true);
      delete window.bbmDb.appGetBuildChannel;
    });
    await run("Bauherr form: late load after destroy cannot replace reopened form refs or state", async () => {
      await make(); let resolve; pending=new Promise(done=>{resolve=done;}); const old=field; const loading=old.load(); old.destroy(); pending=null;
      await make("p2",{bauherr_firm_kind:"global_firm",bauherr_firm_id:"global"}); const currentRoot=field.root; resolve({ok:true,list:[]}); await loading;
      assert.equal(refs.getM80Ref(scope).element,currentRoot); assert.equal(field.input.value,key(globalFirm)); assert.equal(field.firms.size,2); old.destroy(); assert.equal(refs.getM80Ref(scope).element,currentRoot);
      field.destroy(); assert.equal(refs.getM80Ref(scope),null);
    });
  } finally { field?.destroy(); refs.resetM80PilotWorkingStatesForDiagnostic(); Object.assign(global,previous); }
}
module.exports={runProjectBuilderFormTests};
if(require.main===module) runProjectBuilderFormTests(async(name,check)=>{await check();console.log("PASS",name);}).catch(error=>{console.error(error);process.exitCode=1;});
