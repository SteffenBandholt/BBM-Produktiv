import SigekoAuthoritiesPanel from "./SigekoAuthoritiesPanel.js";
import { beginM83ComponentBinding, completeM80PilotRender, registerM80Ref } from "../../ui-editor/m80Refs.js";
import { SIGEKO_COMPONENT_ID, SIGEKO_SCOPE_ID, SIGEKO_CONTACT_INPUTS } from "./SigekoScreen.uiEditorContract.js";

const KEYS = SIGEKO_CONTACT_INPUTS.map(([key]) => key);
const SOURCES = [["module", "Eigenes SiGeKo-Profil"], ["person", "Zentrale Person"], ["project_person", "Projektperson"], ["free", "Freie Angaben"]];
const GRID = "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px;min-width:0";
const PANEL = "min-width:0;padding:16px;border:1px solid #d3dfec;border-radius:8px;background:#fff;display:flex;flex-direction:column;gap:12px";
const text = value => String(value ?? "");
const normalized = value => text(value).trim() || null;
const active = row => row && !row.removed_at && !row.is_trashed && row.is_active !== 0;
const emptyAssignment = () => ({ source: "module", personId: null, data: null });
function node(tag, id, content = "") {
  const el = document.createElement(tag);
  el.textContent = content;
  registerM80Ref(id, el);
  return el;
}
function options(select, values, selected = "") {
  select.textContent = "";
  for (const [value, label] of values) {
    const option = document.createElement("option"); option.value = value; option.textContent = label;
    select.append(option);
  }
  select.value = selected;
}
function resultData(result) {
  if (!result?.ok) throw new Error(result?.error || "Daten konnten nicht geladen oder gespeichert werden.");
  return result.data;
}
function resultList(result) {
  if (!result?.ok || !Array.isArray(result.list)) throw new Error(result?.error || "Kontaktliste nicht verfügbar.");
  return result.list;
}

export default class SigekoScreen {
  constructor({ router, projectId, project = null, focusSection = null } = {}) {
    this.router = router;
    this.projectId = projectId || null;
    this.project = project && String(project.id) === String(this.projectId) ? project : null;
    this.focusSection = ["roles", "authorities"].includes(focusSection) ? focusSection : null;
    this.uiEditorScopeId = SIGEKO_SCOPE_ID;
    this.router?._setProjectRuntimeContext?.({ projectId: this.projectId, meetingId: null });
    this.alive = true; this.loadSequence = 0; this.readinessSequence = 0;
    this.readinessData = null; this.readinessBusy = false;
    this.profileReady = this.rolesReady = false;
    this.profileBusy = this.rolesBusy = false;
    this.contacts = { person: [], project_person: [] };
    this.contactErrors = {};
    this.inputs = {}; this.roleInputs = {};
  }

  getProjectDisplayText() {
    return this.project
      ? [this.project.project_number || this.project.projectNumber, this.project.name || this.project.short].filter(Boolean).join(" – ")
      : `Projekt ${this.projectId || "nicht ausgewählt"}`;
  }

  _field(parent, suffix, label, kind = "text") {
    const id = SIGEKO_SCOPE_ID + suffix;
    const group = node("div", id); group.style.cssText = "display:flex;flex-direction:column;gap:4px;min-width:0";
    const caption = node("label", id + ".label", label); caption.htmlFor = id + ".input";
    const input = node(kind === "select" ? "select" : kind === "multilineText" ? "textarea" : "input", id + ".input");
    input.id = id + ".input";
    if (!["select", "multilineText"].includes(kind)) input.type = kind;
    if (kind === "multilineText") input.rows = 3;
    if (["text", "multilineText"].includes(kind)) input.maxLength = 4096;
    input.style.cssText = "box-sizing:border-box;min-width:0;max-width:100%;min-height:34px;padding:6px;border:1px solid #afbdcb;border-radius:4px;font:inherit";
    if (kind === "checkbox") input.style.cssText = "align-self:flex-start;width:20px;height:20px";
    group.append(caption, input); parent.append(group);
    return input;
  }

  _button(parent, suffix, label, action) {
    const button = node("button", SIGEKO_SCOPE_ID + suffix, label);
    button.type = "button"; button.className = "bbm-btn";
    button.style.cssText = "align-self:flex-start;padding:8px 12px;max-width:100%;white-space:normal";
    button.onclick = action; parent.append(button); return button;
  }

  render() {
    beginM83ComponentBinding(SIGEKO_COMPONENT_ID);
    const root = node("section", SIGEKO_SCOPE_ID);
    root.style.cssText = "box-sizing:border-box;min-width:0;max-width:100%;padding:16px;display:flex;flex-direction:column;gap:16px;overflow-wrap:anywhere;font-family:var(--bbm-font-ui,system-ui,sans-serif);color:var(--bbm-text,#1f344a)";
    const header = node("header", "sigeko.screen.header");
    const title = node("h1", "sigeko.screen.title", "SiGeKo"); title.style.cssText = "margin:0 0 8px;font-size:20px";
    this.projectLabel = node("p", "sigeko.screen.project", `Aktives Projekt: ${this.getProjectDisplayText()}`);
    header.append(title, this.projectLabel);
    const nav = node("nav", "sigeko.screen.navigation"); nav.setAttribute("aria-label", "SiGeKo-Navigation");
    nav.style.cssText = "display:flex;flex-wrap:wrap;gap:8px";
    this._button(nav, ".workspace", "Projektarbeitsbereich", () => this._navigate(() => this.router.showProjectWorkspace(this.projectId, { project: this.project })));
    this._button(nav, ".projects", "Projekt wechseln", () => this._navigate(() => this.router.showProjects()));
    this.preNotificationButton = this._button(nav, ".preNotification", "Vorankündigung öffnen", () => this._navigate(() => this.router.openProjectModule(this.projectId, "sigeko", { project: this.project, screen: "preNotification" })));
    this.notice = node("p", "sigeko.screen.notice", "Grunddaten werden geladen …"); this.notice.setAttribute("role", "status");
    const basic = node("section", "sigeko.screen.basic"); basic.style.cssText = "display:flex;flex-direction:column;gap:16px;min-width:0";
    this.basicPanel = basic;
    basic.append(node("h2", "sigeko.screen.basic.title", "Grunddaten"));
    this._renderProfile(basic); this._renderRoles(basic);
    const planned = node("section", "sigeko.screen.planned"); planned.style.cssText = "padding:12px;border:1px solid #d3dfec;border-radius:8px;background:#f5f8fc";
    const plannedTitle = node("h2", "sigeko.screen.planned.title", "Geplante Bereiche – noch nicht umgesetzt"); plannedTitle.style.fontSize = "16px";
    planned.append(plannedTitle, node("p", "sigeko.screen.planned.text", "SiGePlan · Begehungen · Übergabe an Restarbeiten"));
    this.authoritiesPanel = new SigekoAuthoritiesPanel({ screen: this });
    root.append(header, nav, this.notice, this._renderReadiness(), basic, this.authoritiesPanel.render(), planned); this.root = root;
    this._refreshEnabled(); completeM80PilotRender(); return root;
  }

  _renderReadiness() {
    const panel = node("section", "sigeko.screen.readiness"); panel.style.cssText = PANEL;
    panel.append(node("h2", "sigeko.screen.readiness.title", "Projektbereitschaft"));
    this.readinessViews = {};
    for (const [key, title] of [["project", "Projektdaten"], ["authorities", "Behörden / Notfall / Versorger"]]) {
      const group = node("section", `sigeko.screen.readiness.${key}`);
      group.style.cssText = "min-width:0;display:flex;flex-direction:column;gap:6px";
      const heading = node("h3", `sigeko.screen.readiness.${key}.title`, title); heading.style.margin = "0";
      const status = node("p", `sigeko.screen.readiness.${key}.status`, "Wird geprüft …");
      status.setAttribute("role", "status"); status.style.cssText = "margin:0;font-weight:600";
      const issues = node("p", `sigeko.screen.readiness.${key}.issues`);
      issues.style.cssText = "margin:0;white-space:pre-line;overflow-wrap:anywhere";
      group.append(heading, status, issues); panel.append(group);
      this.readinessViews[key] = { status, issues };
    }
    this.readinessWarning = node("p", "sigeko.screen.readiness.warning", "Die Prüfung bezieht sich auf gespeicherte Angaben. Sie können die Grunddaten jederzeit weiterbearbeiten.");
    this.readinessWarning.setAttribute("role", "status"); panel.append(this.readinessWarning);
    this.readinessRefresh = this._button(panel, ".readiness.refresh", "Bereitschaft aktualisieren", () => this._loadReadiness());
    this._button(panel, ".readiness.editProject", "Projektverwaltung öffnen", () => this._navigate(() => this.router.showProjectForm({ projectId: this.projectId })));
    this._button(panel, ".readiness.editRoles", "Profil und Projektrollen bearbeiten", () => this.basicPanel.scrollIntoView({ block: "start", behavior: "smooth" }));
    this._button(panel, ".readiness.editAuthorities", "Behördenkontakte bearbeiten", () => this.authoritiesPanel.root.scrollIntoView({ block: "start", behavior: "smooth" }));
    return panel;
  }

  async _loadReadiness() {
    if (!this.alive) return;
    const sequence = ++this.readinessSequence;
    const current = () => this.alive && sequence === this.readinessSequence;
    this.readinessData = null; this.readinessBusy = true; this.readinessRefresh.disabled = true;
    for (const view of Object.values(this.readinessViews)) {
      view.status.textContent = "Wird geprüft …"; view.status.style.color = "inherit"; view.issues.textContent = "";
    }
    this.readinessWarning.textContent = "Gespeicherte Angaben werden geprüft. Die Grunddaten bleiben bearbeitbar.";
    try {
      const data = resultData(await window.bbmDb.sigekoGetReadiness({ projectId: this.projectId }));
      if (!current()) return;
      if (String(data?.projectId) !== String(this.projectId) || !["red", "green"].includes(data?.projectData?.status)
        || !["red", "orange", "green"].includes(data?.authorities?.status)
        || !Array.isArray(data.projectData.issues) || !Array.isArray(data.authorities.issues)) {
        throw new Error("Bereitschaftsdaten konnten nicht zugeordnet werden.");
      }
      this.readinessData = data;
      for (const [key, area] of [["project", data.projectData], ["authorities", data.authorities]]) {
        const view = this.readinessViews[key];
        view.status.textContent = area.status === "green" ? "Grün – Angaben vollständig."
          : area.status === "orange" ? "Orange – Angaben prüfen."
          : key === "authorities" && area.available === false ? "Rot – noch nicht erfasst." : "Rot – Angaben fehlen.";
        view.status.style.color = { red: "#a12622", orange: "#885700", green: "#176b3a" }[area.status];
        view.issues.textContent = area.issues.map(issue => issue.message).join("\n") || "Keine fehlenden Angaben.";
      }
      this.readinessWarning.textContent = "Stand der gespeicherten Angaben; ungespeicherte Eingaben sind nicht berücksichtigt. Fehlende oder ungeprüfte Angaben sind ein Hinweis und sperren die Grunddatenpflege nicht.";
    } catch (error) {
      if (!current()) return;
      for (const view of Object.values(this.readinessViews)) { view.status.textContent = "Prüfung nicht verfügbar."; view.status.style.color = "inherit"; view.issues.textContent = ""; }
      this.readinessWarning.textContent = `Bereitschaft konnte nicht geprüft werden: ${error.message} Bitte erneut aktualisieren. Die Grunddaten bleiben bearbeitbar.`;
    } finally {
      if (current()) { this.readinessBusy = false; this.readinessRefresh.disabled = false; completeM80PilotRender(); }
    }
  }

  _renderProfile(parent) {
    const panel = node("section", "sigeko.screen.profile"); panel.style.cssText = PANEL;
    panel.append(node("h3", "sigeko.screen.profile.title", "Eigenes SiGeKo-Profil"), node("p", "sigeko.screen.profile.hint", "Einmal hinterlegen, in allen SiGeKo-Projekten verwenden. Änderungen gelten für jede Zuordnung zum eigenen Profil. Das Logo bleibt eine Verknüpfung zur gewählten lokalen Datei."));
    const fields = node("div", "sigeko.screen.profile.fields"); fields.style.cssText = GRID;
    for (const [key, label] of SIGEKO_CONTACT_INPUTS) this.inputs[key] = this._field(fields, `.profile.${key}`, label);
    this.logoInput = this._field(fields, ".profile.logo", "Logo auswählen (PNG oder JPEG)", "file");
    this.logoInput.accept = ".png,.jpg,.jpeg";
    this.logoInput.onchange = () => {
      const file = this.logoInput.files?.[0];
      if (!file) return;
      if (!file.path || !/\.(png|jpe?g)$/i.test(file.path)) {
        this.profileStatus.textContent = "Bitte eine lokale PNG- oder JPEG-Datei auswählen.";
      } else { this.logoPath = file.path; this._showLogo(); this.profileStatus.textContent = "Logo ausgewählt. Bitte Profil speichern."; }
      this.logoInput.value = "";
    };
    panel.append(fields);
    this.logoLabel = node("p", "sigeko.screen.profile.logoPath", "Kein Logo ausgewählt."); panel.append(this.logoLabel);
    this.logoClear = this._button(panel, ".profile.logoClear", "Logo entfernen", () => { this.logoPath = null; this._showLogo(); this.profileStatus.textContent = "Logo-Verknüpfung entfernt. Bitte Profil speichern."; });
    this.profileSave = this._button(panel, ".profile.save", "Profil speichern", () => this._saveProfile());
    this.profileStatus = node("p", "sigeko.screen.profile.status"); this.profileStatus.setAttribute("role", "status"); panel.append(this.profileStatus);
    parent.append(panel);
  }

  _renderRoles(parent) {
    const roles = node("section", "sigeko.screen.roles"); roles.style.cssText = PANEL;
    roles.append(node("h3", "sigeko.screen.roles.title", "SiGeKo im Projekt"), node("p", "sigeko.screen.roles.hint", "Planung und Ausführung können unterschiedliche Personen übernehmen. Freie Angaben werden nur in diesem Projekt gespeichert. Inaktive Eingaben gehören nicht zur gewählten Zuordnung."));
    const panels = node("div", "sigeko.screen.roles.panels"); panels.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,350px),1fr));gap:16px;min-width:0";
    for (const [role, title] of [["planning", "Planung"], ["execution", "Ausführung"]]) {
      const panel = node("section", `sigeko.screen.${role}`); panel.style.cssText = PANEL;
      panel.append(node("h4", `sigeko.screen.${role}.title`, title));
      if (role === "execution") {
        this.sameInput = this._field(panel, ".execution.same", "Ausführung wie Planung", "checkbox");
        this.sameInput.checked = true; this.sameInput.onchange = () => this._refreshEnabled();
      }
      const source = this._field(panel, `.${role}.source`, "Zuordnung aus", "select"); options(source, SOURCES, "module");
      const contact = this._field(panel, `.${role}.contact`, "Person", "select");
      const free = node("div", `sigeko.screen.${role}.free`); free.style.cssText = GRID;
      const inputs = {};
      for (const [key, label] of SIGEKO_CONTACT_INPUTS) inputs[key] = this._field(free, `.${role}.free.${key}`, label);
      panel.append(free);
      const resolved = node("p", `sigeko.screen.${role}.resolved`, "Noch keine Projektzuordnung gespeichert."); panel.append(resolved);
      this.roleInputs[role] = { source, contact, inputs, resolved };
      source.onchange = () => { this._contactOptions(role); this._refreshEnabled(); };
      panels.append(panel);
    }
    roles.append(panels);
    this.rolesSave = this._button(roles, ".roles.save", "Projektrollen speichern", () => this._saveRoles());
    this.rolesStatus = node("p", "sigeko.screen.roles.status"); this.rolesStatus.setAttribute("role", "status"); roles.append(this.rolesStatus);
    parent.append(roles);
  }

  _showLogo() { this.logoLabel.textContent = this.logoPath ? `Gewähltes Logo: ${this.logoPath}` : "Kein Logo ausgewählt."; }
  _profileDraft() { return { ...Object.fromEntries(KEYS.map(key => [key, normalized(this.inputs[key].value)])), logo_path: this.logoPath || null }; }
  _roleDraft(role) {
    const input = this.roleInputs[role]; const source = input.source.value;
    return { source, personId: ["person", "project_person"].includes(source) ? input.contact.value || null : null,
      data: source === "free" ? Object.fromEntries(KEYS.map(key => [key, normalized(input.inputs[key].value)])) : null };
  }
  _rolesDraft() { return { planning: this._roleDraft("planning"), executionSameAsPlanning: this.sameInput.checked, execution: this.sameInput.checked ? null : this._roleDraft("execution") }; }
  _navigate(action) {
    if (this.profileBusy || this.rolesBusy || this.authoritiesPanel?.busy) return;
    const dirty = (this.profileReady && JSON.stringify(this._profileDraft()) !== this.profileSnapshot)
      || (this.rolesReady && JSON.stringify(this._rolesDraft()) !== this.rolesSnapshot) || this.authoritiesPanel?.isDirty();
    if (dirty && !window.confirm("Ungespeicherte SiGeKo-Eingaben verwerfen und diese Ansicht verlassen?")) return;
    return action();
  }
  _contactOptions(role, selected = "") {
    const input = this.roleInputs[role], source = input.source.value;
    const list = this.contacts[source] || [];
    const values = [["", this.contactErrors[source] ? "Kontaktliste konnte nicht geladen werden" : list.length ? "Person auswählen …" : "Keine Personen verfügbar"], ...list.map(row => [row.id, row.label])];
    if (selected && !list.some(row => row.id === selected)) values.push([selected, "Gespeicherte Person nicht verfügbar"]);
    options(input.contact, values, selected);
  }
  _refreshEnabled() {
    this.authoritiesPanel?.refreshEnabled();
    const profileDisabled = !this.profileReady || this.profileBusy;
    for (const input of [...Object.values(this.inputs), this.logoInput, this.logoClear, this.profileSave]) input.disabled = profileDisabled;
    const disabled = !this.rolesReady || this.rolesBusy || !!this.project?.archived_at;
    this.rolesSave.disabled = this.sameInput.disabled = disabled;
    for (const [role, input] of Object.entries(this.roleInputs)) {
      const inherited = role === "execution" && this.sameInput.checked;
      input.source.disabled = disabled || inherited;
      input.contact.disabled = disabled || inherited || !["person", "project_person"].includes(input.source.value);
      for (const field of Object.values(input.inputs)) field.disabled = disabled || inherited || input.source.value !== "free";
    }
  }
  _setProfile(profile) {
    this.profile = profile;
    for (const key of KEYS) this.inputs[key].value = text(profile?.[key]);
    this.logoPath = profile?.logo_path || null; this._showLogo(); this.profileSnapshot = JSON.stringify(this._profileDraft());
  }
  _setProjectData(data) {
    if (!data?.project || String(data.project.id) !== String(this.projectId)) throw new Error("Projektzuordnung konnte nicht geladen werden.");
    this.project = data.project; this.projectData = data;
    this.sameInput.checked = data.sigekoProject?.executionSameAsPlanning ?? true;
    for (const role of ["planning", "execution"]) {
      const value = data.sigekoProject?.[role] || emptyAssignment(), input = this.roleInputs[role];
      input.source.value = value.source; this._contactOptions(role, value.personId || "");
      for (const key of KEYS) input.inputs[key].value = text(value.data?.[key]);
    }
    this._showResolved(); this.rolesSnapshot = JSON.stringify(this._rolesDraft());
    this.projectLabel.textContent = `Aktives Projekt: ${this.getProjectDisplayText()}`;
  }
  _showResolved() {
    for (const role of ["planning", "execution"]) {
      const resolved = this.projectData?.[role];
      const summary = !resolved ? "Noch keine Projektzuordnung gespeichert." : resolved.sourceMissing
        ? "Gespeicherte Quelle nicht verfügbar. Bitte Zuordnung prüfen."
        : `Gespeichert${resolved.inheritedFromPlanning ? " – wie Planung" : ""}: ${[resolved.values?.name, resolved.values?.street, [resolved.values?.zip, resolved.values?.city].filter(Boolean).join(" "), resolved.values?.phone, resolved.values?.email].filter(Boolean).join(" · ") || "Angaben noch leer"}`;
      this.roleInputs[role].resolved.textContent = summary;
    }
  }

  async _loadContacts(source) {
    const api = window.bbmDb;
    const firms = resultList(await api.firmDirectoryListAll({ kind: source === "person" ? "global_firm" : "project_firm", projectId: this.projectId, includeInactive: false })).filter(active);
    const groups = await Promise.all(firms.map(async firm => {
      const persons = resultList(await api.firmDirectoryListPersons({ ref: firm.ref }));
      return persons.filter(active).map(person => ({ id: person.id, label: [person.name || [person.first_name, person.last_name].filter(Boolean).join(" "), firm.name].filter(Boolean).join(" – ") }));
    }));
    return groups.flat().sort((a, b) => a.label.localeCompare(b.label, "de"));
  }
  async load() {
    if (this.focusSection) {
      const target = this.focusSection === "authorities" ? this.authoritiesPanel?.root : this.basicPanel;
      target?.scrollIntoView?.({ block: "start" }); this.focusSection = null;
    }
    void this._loadReadiness();
    void this.authoritiesPanel.load();
    const sequence = ++this.loadSequence;
    const current = () => this.alive && sequence === this.loadSequence;
    const profile = (async () => {
      try { const data = resultData(await window.bbmDb.sigekoGetCoordinatorProfile()); if (!current()) return; this._setProfile(data); this.profileReady = true; }
      catch (error) { if (current()) this.profileStatus.textContent = `Profil konnte nicht geladen werden: ${error.message}`; }
      if (current()) { this._refreshEnabled(); completeM80PilotRender(); }
    })();
    const roles = (async () => {
      const contacts = await Promise.allSettled([this._loadContacts("person"), this._loadContacts("project_person")]);
      if (!current()) return;
      contacts.forEach((result, index) => { const source = index ? "project_person" : "person"; if (result.status === "fulfilled") this.contacts[source] = result.value; else this.contactErrors[source] = true; });
      try {
        const data = resultData(await window.bbmDb.sigekoGetProjectData({ projectId: this.projectId }));
        if (!current()) return;
        this._setProjectData(data); this.rolesReady = true;
        this.rolesStatus.textContent = this.project.archived_at ? "Archiviertes Projekt: Rollenzuordnungen sind schreibgeschützt." : Object.keys(this.contactErrors).length ? "Mindestens eine Kontaktliste konnte nicht geladen werden. Ansicht zum erneuten Laden wieder öffnen." : "";
        this.notice.textContent = "Grunddaten verfügbar. Profil und Projektrollen werden getrennt gespeichert.";
      } catch (error) {
        if (!current()) return;
        this.rolesStatus.textContent = `Projektrollen konnten nicht geladen werden: ${error.message}`;
        this.notice.textContent = "Das aktive Projekt konnte nicht geladen werden. Bitte über die Projektauswahl erneut öffnen.";
        // Existing entry remains usable when only the basic-data request fails.
        if (!this.project) try {
          const projects = resultList(await window.bbmDb.projectsList());
          if (!current()) return;
          this.project = projects.find(item => String(item.id) === String(this.projectId)) || null;
          this.projectLabel.textContent = `Aktives Projekt: ${this.getProjectDisplayText()}`;
        } catch (_error) { /* The visible load error remains authoritative. */ }
      }
      if (current()) { this._refreshEnabled(); completeM80PilotRender(); }
    })();
    await Promise.all([profile, roles]);
    if (current()) { this._refreshEnabled(); completeM80PilotRender(); }
  }
  async _saveProfile() {
    if (!this.alive || !this.profileReady || this.profileBusy) return;
    this.profileBusy = true; this._refreshEnabled(); this.profileStatus.textContent = "Profil wird gespeichert …";
    try {
      const profile = resultData(await window.bbmDb.sigekoSaveCoordinatorProfile({ patch: this._profileDraft() }));
      if (!this.alive) return;
      this._setProfile(profile); this.profileStatus.textContent = "Profil gespeichert.";
      // Update saved module references without overwriting unsaved role inputs.
      for (const role of ["planning", "execution"]) {
        const resolved = this.projectData?.[role];
        if (resolved?.assignment.source === "module") { resolved.values = profile; resolved.sourceMissing = !profile; }
      }
      this._showResolved();
      void this._loadReadiness();
    } catch (error) { if (this.alive) this.profileStatus.textContent = `Profil nicht gespeichert: ${error.message}`; }
    finally { this.profileBusy = false; if (this.alive) { this._refreshEnabled(); completeM80PilotRender(); } }
  }
  async _saveRoles() {
    if (!this.alive || !this.rolesReady || this.rolesBusy || this.project?.archived_at) return;
    const draft = this._rolesDraft(), saved = this.projectData.sigekoProject;
    const payload = { projectId: this.projectId, executionSameAsPlanning: draft.executionSameAsPlanning };
    // Omit unchanged assignments, including deleted/missing references; the service preserves them.
    for (const role of ["planning", "execution"]) {
      if (role === "execution" && draft.executionSameAsPlanning) continue;
      if (JSON.stringify(draft[role]) !== JSON.stringify(saved?.[role] || emptyAssignment())) payload[role] = draft[role];
    }
    this.rolesBusy = true; this._refreshEnabled(); this.rolesStatus.textContent = "Projektrollen werden gespeichert …";
    try {
      const data = resultData(await window.bbmDb.sigekoSaveProjectData(payload));
      if (!this.alive) return;
      this._setProjectData(data); this.rolesStatus.textContent = "Projektrollen gespeichert.";
      void this._loadReadiness();
    } catch (error) { if (this.alive) this.rolesStatus.textContent = `Projektrollen nicht gespeichert: ${error.message}`; }
    finally { this.rolesBusy = false; if (this.alive) { this._refreshEnabled(); completeM80PilotRender(); } }
  }

  destroy() { this.authoritiesPanel?.destroy(); this.alive = false; ++this.loadSequence; ++this.readinessSequence; beginM83ComponentBinding(SIGEKO_COMPONENT_ID); }
}
