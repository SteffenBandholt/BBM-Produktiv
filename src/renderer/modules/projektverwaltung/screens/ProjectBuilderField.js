import { beginM83ComponentBinding, completeM80PilotRender, getM80Ref, registerM80MultiRef, registerM80Ref } from "../../../ui-editor/m80Refs.js";
import { installDevelopmentUiEditorOpenButton } from "../../../app/coreShellNavigation.js";
import { BUILDER_COMPONENT, BUILDER_SCOPE } from "./ProjectBuilder.uiEditorContract.js";

const keyFor = ref => ref ? JSON.stringify([ref.kind, ref.id]) : "";
const active = firm => firm && !firm.removed_at && !firm.is_trashed && firm.is_active !== 0;
const list = response => {
  if (!response?.ok || !Array.isArray(response.list)) throw new Error(response?.error || "Firmenauswahl nicht verfügbar.");
  return response.list;
};

export default class ProjectBuilderField {
  constructor({ projectId = null } = {}) {
    this.projectId = projectId; this.refs = {}; this.firms = new Map();
    this.savedKey = ""; this.ready = false; this.busy = false; this.loading = false;
    this.alive = true; this.sequence = 0;
  }
  render() {
    const make = (tag, suffix, text = "") => {
      const el = document.createElement(tag); el.textContent = text; this.refs[suffix] = el; return el;
    };
    const root = make("section", "");
    root.style.cssText = "box-sizing:border-box;min-width:0;width:100%;display:flex;flex-direction:column;gap:8px;margin-top:12px;padding:12px;border:1px solid #d3dfec;border-radius:8px;overflow-wrap:anywhere";
    const group = make("div", ".group"); group.style.cssText = "min-width:0;display:flex;flex-direction:column;gap:4px";
    const label = make("label", ".label", "Bauherr"); label.htmlFor = `${BUILDER_SCOPE}.input`;
    this.input = make("select", ".input"); this.input.id = label.htmlFor;
    this.input.style.cssText = "box-sizing:border-box;width:100%;min-width:0;max-width:100%;min-height:34px;padding:6px;font:inherit;border:1px solid #afbdcb;border-radius:4px";
    this.input.onchange = () => this._showSelection(); group.append(label, this.input);
    const hint = make("p", ".hint", "Vorhandene Firma auswählen. Neue Firmen zuerst in der Firmenverwaltung anlegen. Die Zuordnung wird mit dem Projekt gespeichert."); hint.style.margin = "0";
    this.status = make("p", ".status", "Firmenauswahl wird geladen …"); this.status.setAttribute("role", "status"); this.status.style.margin = "0";
    this.refresh = make("button", ".refresh", "Firmenauswahl aktualisieren"); this.refresh.type = "button";
    this.refresh.style.cssText = "align-self:flex-start;max-width:100%;white-space:normal;padding:6px 10px";
    this.refresh.onclick = () => this.load();
    root.append(group, hint, this.status, this.refresh); this.root = root;
    this._options(""); this.bind(); this.setBusy(false);
    void installDevelopmentUiEditorOpenButton({ host: root, scopeId: BUILDER_SCOPE }).then(button => {
      if (!button) return;
      this.refs[".editor"] = button;
      if (this.alive && getM80Ref(BUILDER_SCOPE)?.element === root) this.bind();
    });
    return root;
  }
  bind() {
    const reopening = !this.alive;
    this.alive = true;
    beginM83ComponentBinding(BUILDER_COMPONENT);
    for (const [suffix, element] of Object.entries(this.refs)) if (suffix !== ".editor") registerM80Ref(BUILDER_SCOPE + suffix, element);
    const button = this.refs[".editor"];
    registerM80MultiRef(`${BUILDER_SCOPE}.editor`, button ? [button] : [], this.root);
    completeM80PilotRender();
    if (reopening && !this.ready) void this.load();
  }
  destroy() {
    this.alive = false; this.sequence++; this.loading = false;
    if (getM80Ref(BUILDER_SCOPE)?.element === this.root) {
      beginM83ComponentBinding(BUILDER_COMPONENT); completeM80PilotRender();
    }
  }
  setProject(project) {
    this.archived = !!project?.archived_at;
    this.savedKey = project?.bauherr_firm_kind && project?.bauherr_firm_id
      ? keyFor({ kind: project.bauherr_firm_kind, id: project.bauherr_firm_id }) : "";
    this._options(this.savedKey); this._showSelection(); this.setBusy(this.busy);
  }
  _options(selected) {
    this.input.textContent = "";
    const add = (value, text) => { const option = document.createElement("option"); option.value = value; option.textContent = text; this.input.append(option); };
    add("", this.projectId ? "Kein Bauherr zugeordnet" : "Bauherr auswählen …");
    for (const [key, firm] of this.firms) add(key, `${firm.kind === "global_firm" ? "Zentral" : "Projekt"}: ${firm.name || firm.label || "Ohne Name"}${firm.city ? ` – ${firm.city}` : ""}`);
    if (selected && !this.firms.has(selected)) add(selected, "Gespeicherte / gewählte Firma nicht verfügbar");
    this.input.value = selected;
  }
  _showSelection() {
    if (this.error) { this.status.textContent = this.error; return; }
    const key = this.input.value, firm = this.firms.get(key);
    this.status.textContent = !key ? "Noch kein Bauherr zugeordnet."
      : !firm ? "Die zugeordnete Firma ist nicht verfügbar. Bitte Zuordnung prüfen."
      : [firm.name, firm.street, [firm.zip, firm.city].filter(Boolean).join(" "), firm.phone, firm.email].filter(Boolean).join(" · ");
  }
  setBusy(on) {
    this.busy = !!on;
    if (this.input) this.input.disabled = this.busy || this.loading || !this.ready || this.archived;
    if (this.refresh) this.refresh.disabled = this.busy || this.loading;
  }
  async load() {
    if (!this.alive || this.busy || this.loading) return;
    const sequence = ++this.sequence;
    this.loading = true; this.setBusy(this.busy); this.status.textContent = "Firmenauswahl wird geladen …";
    try {
      const api = window.bbmDb;
      const groups = await Promise.all([
        api.firmDirectoryListAll({ kind: "global_firm", includeInactive: false }),
        this.projectId ? api.firmDirectoryListAll({ kind: "project_firm", projectId: this.projectId, includeInactive: false }) : Promise.resolve({ ok: true, list: [] }),
      ]);
      if (!this.alive || sequence !== this.sequence) return;
      const firms = groups.flatMap(list).filter(active);
      this.firms = new Map(firms.map(firm => [keyFor(firm.ref), { ...firm, kind: firm.ref.kind }]));
      this.ready = true; this.error = ""; this._options(this.input.value); this._showSelection();
    } catch (error) {
      if (!this.alive || sequence !== this.sequence) return;
      this.ready = false; this.error = `Firmenauswahl konnte nicht geladen werden: ${error.message} Bitte aktualisieren.`;
      this._showSelection();
    } finally {
      if (this.alive && sequence === this.sequence) { this.loading = false; this.setBusy(this.busy); completeM80PilotRender(); }
    }
  }
  validationMessage() {
    if (!this.projectId && (!this.ready || !this.input.value)) return "Bitte einen Bauherrn aus der Firmenauswahl wählen. Bei Ladefehlern die Auswahl aktualisieren.";
    if (this.input.value !== this.savedKey && (!this.ready || (this.input.value && !this.firms.has(this.input.value)))) return "Die gewählte Bauherrfirma ist nicht verfügbar. Bitte Auswahl aktualisieren und erneut wählen.";
    return "";
  }
  patch() {
    if (this.input.value === this.savedKey) return {};
    if (!this.input.value) return { bauherr: null };
    const [kind, id] = JSON.parse(this.input.value);
    return { bauherr: { kind, id } };
  }
}
