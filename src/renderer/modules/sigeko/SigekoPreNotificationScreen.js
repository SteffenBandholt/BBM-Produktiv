import { beginM83ComponentBinding, completeM80PilotRender, registerM80Ref } from "../../ui-editor/m80Refs.js";
import { PRE_NOTIFICATION_COMPONENT_ID, PRE_NOTIFICATION_SCOPE_ID } from "./SigekoPreNotificationScreen.uiEditorContract.js";

const CONTACT_FIELDS = ["name", "street", "zip", "city", "phone", "email"];
const COUNT_FIELDS = ["duration_months", "max_workers", "employer_count", "self_employed_count"];
const string = value => String(value ?? "");
const normalized = value => string(value).trim() || null;
const id = suffix => PRE_NOTIFICATION_SCOPE_ID + (suffix ? "." + suffix : "");
const STACK = "display:flex;flex-direction:column;gap:8px;min-width:0";
const GRID = "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px;min-width:0";
function node(tag, suffix, content = "") {
  const element = document.createElement(tag); element.textContent = content;
  registerM80Ref(id(suffix), element); return element;
}
function unpack(result) {
  if (!result?.ok) throw Object.assign(new Error(result?.error || "Vorankündigung ist nicht verfügbar."), { code: result?.code });
  return result.data;
}
function contactText(contact, organization = false) {
  if (!contact) return "Noch nicht angegeben.";
  return [contact[organization ? "organization" : "name"], contact.street,
    [contact.zip, contact.city].filter(Boolean).join(" "),
    contact.phone ? `Telefon: ${contact.phone}` : null, contact.email ? `E-Mail: ${contact.email}` : null,
  ].filter(Boolean).join("\n") || "Noch nicht angegeben.";
}

export default class SigekoPreNotificationScreen {
  constructor({ router, projectId, project = null } = {}) {
    this.router = router; this.projectId = projectId || null;
    this.project = project && String(project.id) === String(projectId) ? project : null;
    this.uiEditorScopeId = PRE_NOTIFICATION_SCOPE_ID;
    this.router?._setProjectRuntimeContext?.({ projectId: this.projectId, meetingId: null });
    this.alive = true; this.sequence = 0; this.ready = false; this.loading = false; this.busy = false;
    this.data = null; this.inputs = {}; this.buttons = []; this.snapshot = null; this.conflict = false;
  }

  _label(parent, suffix, content) {
    const element = node("p", suffix, content); element.style.cssText = "margin:0;white-space:pre-line;overflow-wrap:anywhere";
    parent.append(element); return element;
  }
  _button(parent, suffix, label, action) {
    const button = node("button", suffix, label); button.type = "button"; button.className = "bbm-btn";
    button.style.cssText = "max-width:100%;align-self:flex-start;padding:7px 10px;white-space:normal;font:inherit";
    button.onclick = action; parent.append(button); this.buttons.push(button); return button;
  }
  _field(parent, suffix, label, key, kind = "text", choices = null) {
    const group = node("div", suffix); group.style.cssText = STACK + ";gap:3px";
    const caption = node("label", suffix + ".label", label); caption.htmlFor = id(suffix + ".input");
    const input = node(kind === "select" ? "select" : "input", suffix + ".input"); input.id = id(suffix + ".input");
    if (kind !== "select") input.type = kind;
    if (kind === "text") input.maxLength = 4096;
    if (kind === "number") { input.min = key === "duration_months" ? "1" : "0"; input.step = "1"; }
    input.style.cssText = "box-sizing:border-box;width:100%;min-width:0;max-width:100%;min-height:34px;padding:6px;border:1px solid #aab8c7;border-radius:3px;font:inherit";
    for (const [value, title] of choices || []) { const option = document.createElement("option"); option.value = value; option.textContent = title; input.append(option); }
    input.oninput = input.onchange = () => this._refreshEnabled();
    group.append(caption, input); parent.append(group); this.inputs[key] = input; return input;
  }
  _point(parent, suffix, title) {
    const section = node("section", suffix); section.style.cssText = STACK + ";padding-top:12px;border-top:1px solid #d3dce5;scroll-margin-top:100px";
    const heading = node("h3", suffix + ".title", title); heading.style.cssText = "font-size:15px;margin:0;font-weight:600;grid-column:1 / -1";
    section.append(heading); parent.append(section); return section;
  }

  render() {
    beginM83ComponentBinding(PRE_NOTIFICATION_COMPONENT_ID);
    const root = node("section", ""); this.root = root;
    root.style.cssText = "box-sizing:border-box;max-width:100%;min-width:0;padding:12px;display:flex;flex-direction:column;gap:10px;overflow-wrap:anywhere;font:14px var(--bbm-font-ui,system-ui,sans-serif);color:var(--bbm-text,#1f344a)";
    const header = node("header", "header"); header.style.cssText = STACK;
    const heading = node("h1", "header.title", "SiGeKo – Vorankündigung"); heading.style.cssText = "font-size:20px;margin:0";
    header.append(heading); this.projectLabel = this._label(header, "header.project", "Aktives Projekt wird geladen …"); root.append(header);
    const actions = node("nav", "actions"); actions.setAttribute("aria-label", "Vorankündigung bearbeiten");
    actions.style.cssText = "position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#f3f6fa;border:1px solid #cbd7e4;border-radius:4px;min-width:0";
    this.saveButton = this._button(actions, "actions.save", "Speichern", () => this.save());
    this.saveBackButton = this._button(actions, "actions.saveBack", "Speichern und zurück", () => this.save({ back: true }));
    this.backButton = this._button(actions, "actions.back", "Zurück zu SiGeKo", () => this.navigate(() => this._back()));
    this.reloadButton = this._button(actions, "actions.reload", "Neu laden", () => this.reload()); root.append(actions);
    this.status = this._label(root, "status", "Vorankündigung wird geladen …"); this.status.setAttribute("role", "status");
    this.readinessView = this._label(root, "readiness", "Angaben werden geprüft …"); this.readinessView.setAttribute("role", "status");
    const document = node("article", "document"); document.style.cssText = "box-sizing:border-box;align-self:center;width:100%;max-width:880px;padding:clamp(12px,3vw,28px);background:#fff;border:1px solid #d0dbe6;" + STACK + ";gap:14px";
    const authority = node("section", "authority"); authority.style.cssText = STACK;
    this._label(authority, "authority.title", "An die Arbeitsschutzbehörde"); this.authorityValue = this._label(authority, "authority.value", "Zuständige Behörde noch zu klären.");
    this._button(authority, "authority.edit", "Behördenzuordnung bearbeiten", () => this.navigate(() => this._back("authorities"))); document.append(authority);
    const title = node("h2", "document.title", "Vorankündigung (gem. § 2 (2) BaustellV)"); title.style.cssText = "margin:8px 0;font-size:20px;text-align:center"; document.append(title);
    let point = this._point(document, "p1", "1 Ort der Baustelle"); this.addressValue = this._label(point, "p1.value", "Noch nicht angegeben.");
    this._button(point, "p1.edit", "Projektadresse bearbeiten", () => this.navigate(() => this.router.showProjectForm({ projectId: this.projectId })));
    point = this._point(document, "p2", "2 Name und Anschrift des Bauherrn"); this.builderValue = this._label(point, "p2.value", "Noch nicht angegeben.");
    this._button(point, "p2.edit", "Bauherr im Projekt bearbeiten", () => this.navigate(() => this.router.showProjectForm({ projectId: this.projectId })));
    point = this._point(document, "p3", "3 Art des Bauvorhabens");
    this._field(point, "p3.buildingType", "Art des Bauvorhabens", "building_type_override");
    this.buildingSource = this._label(point, "p3.source", "Lokale Angabe nur für diese Vorankündigung.");
    this.buildingTypeReset = this._button(point, "p3.reset", "Lokale Bauvorhabenangabe zurücksetzen", () => this._resetOverride("building_type_override"));
    point = this._point(document, "p4", "4 Name und Anschrift des verantwortlichen Dritten");
    this._field(point, "p4.mode", "Beauftragter Dritter", "third_party_mode", "select", [["none", "Nicht vorhanden"], ["free", "Freie Eingabe"]]);
    this.thirdPartyGroup = node("div", "p4.contact"); this.thirdPartyGroup.style.cssText = GRID;
    for (const [key, label] of [["name", "Name"], ["street", "Straße / Hausnummer"], ["zip", "Postleitzahl"], ["city", "Ort"], ["phone", "Telefon"], ["email", "E-Mail"]]) this._field(this.thirdPartyGroup, "p4.contact." + key, label, "third_party_" + key);
    point.append(this.thirdPartyGroup);
    point = this._point(document, "p5", "5 Name und Anschrift des Koordinators / der Koordinatoren"); point.style.cssText += ";" + GRID;
    this.roleValues = {};
    for (const [role, label] of [["planning", "Während der Planung der Ausführung"], ["execution", "Während der Ausführung des Bauvorhabens"]]) {
      const group = node("section", "p5." + role); group.style.cssText = STACK;
      this._label(group, "p5." + role + ".title", label); this.roleValues[role] = this._label(group, "p5." + role + ".value", "Noch nicht angegeben."); point.append(group);
    }
    this._button(point, "p5.edit", "SiGeKo-Projektrollen bearbeiten", () => this.navigate(() => this._back("roles"))).style.gridColumn = "1 / -1";
    point = this._point(document, "p6", "6 Voraussichtlicher Beginn und Dauer der Arbeiten");
    this._field(point, "p6.start", "Voraussichtlicher Beginn", "planned_start_override", "date");
    this.startSource = this._label(point, "p6.source", "Baubeginn aus dem Projekt.");
    this.startReset = this._button(point, "p6.reset", "Baubeginn aus Projekt übernehmen", () => this._resetOverride("planned_start_override"));
    this._field(point, "p6.duration", "Voraussichtliche Dauer in ganzen Monaten", "duration_months", "number");
    point = this._point(document, "p7", "7 Voraussichtliche Höchstzahl der Beschäftigten");
    this._field(point, "p7.workers", "Höchstzahl Beschäftigte", "max_workers", "number");
    point = this._point(document, "p8", "8 Zahl der Arbeitgeber und Unternehmer ohne Beschäftigte"); point.style.cssText += ";" + GRID;
    this._field(point, "p8.employers", "Anzahl Arbeitgeber", "employer_count", "number");
    this._field(point, "p8.selfEmployed", "Anzahl Unternehmer ohne Beschäftigte", "self_employed_count", "number");
    point = this._point(document, "p9", "9 Bereits ausgewählte Arbeitgeber und Unternehmer ohne Beschäftigte");
    this._field(point, "p9.firmsMode", "Firmenangabe", "firms_mode", "select", [["unknown", "Noch nicht bekannt"], ["attachment", "Firmenliste im Anhang"]]);
    this.firmsHint = this._label(point, "p9.hint", "");
    this._button(point, "p9.edit", "Projektfirmenliste öffnen", () => this.navigate(() => this.router.showProjectFirms(this.projectId)));
    const signature = node("footer", "signature"); signature.style.cssText = GRID + ";margin-top:24px;padding-top:24px";
    for (const [suffix, label] of [["placeDate", "Ort / Datum – handschriftlich zu ergänzen"], ["signer", "Bauherr / Beauftragter Dritter – Unterschrift"]]) {
      const line = this._label(signature, "signature." + suffix, label); line.style.cssText += ";border-top:1px solid #526475;padding-top:6px";
    }
    document.append(signature); root.append(document); this._refreshEnabled(); completeM80PilotRender(); return root;
  }

  _validateData(data) {
    if (String(data?.projectId) !== String(this.projectId) || String(data?.central?.project?.id) !== String(this.projectId)
      || !data.effective || !["red", "orange", "green"].includes(data?.readiness?.status) || !Array.isArray(data.readiness.issues)
      || (data.record && (String(data.record.project_id) !== String(this.projectId) || !Number.isSafeInteger(data.record.revision) || data.record.revision < 1))) {
      throw new Error("Vorankündigungsdaten konnten dem Projekt nicht sicher zugeordnet werden.");
    }
    return data;
  }
  _setData(value) {
    const data = this._validateData(value); this.data = data; this.project = data.central.project;
    const record = data.record || {}, effective = data.effective;
    this.overrides = { building_type_override: record.building_type_override ?? null, planned_start_override: record.planned_start_override ?? null };
    this.displayed = { building_type_override: string(effective.building_type), planned_start_override: string(effective.planned_start) };
    for (const [key, input] of Object.entries(this.inputs)) input.value = Object.hasOwn(this.displayed, key) ? this.displayed[key]
      : string(record[key] ?? (key === "third_party_mode" ? "none" : key === "firms_mode" ? "unknown" : null));
    this.projectLabel.textContent = "Aktives Projekt: " + [this.project.project_number || this.project.projectNumber, this.project.name || this.project.short || this.projectId].filter(Boolean).join(" – ");
    this.addressValue.textContent = [effective.address?.street, [effective.address?.zip, effective.address?.city].filter(Boolean).join(" ")].filter(Boolean).join("\n") || "Noch nicht angegeben.";
    this.builderValue.textContent = contactText(effective.builder);
    for (const role of ["planning", "execution"]) this.roleValues[role].textContent = contactText(effective[role]);
    const authority = effective.authority, snapshot = authority?.assignment?.snapshot;
    this.authorityValue.textContent = snapshot ? contactText(snapshot, true) + (authority.status === "green" ? "\nZuständigkeit bestätigt." : "\nPrüfbedarf – zuständige Behörde noch zu klären.") : "Zuständige Behörde noch zu klären.";
    this.readinessView.textContent = data.readiness.issues.length ? "Fehlende oder zu prüfende Angaben (Entwurf bleibt bearbeitbar):\n" + data.readiness.issues.map(issue => issue.message).join("\n") : "Angaben vollständig. Dies ist ein bearbeitbarer Entwurf.";
    this.readinessView.style.color = { red: "#a12622", orange: "#885700", green: "#176b3a" }[data.readiness.status];
    this.ready = true; this.conflict = false; this.snapshot = this._rawSnapshot();
  }
  _rawSnapshot() {
    return JSON.stringify({ values: Object.fromEntries(Object.entries(this.inputs).map(([key, input]) => [key, { value: string(input.value).trim(), badInput: input.validity?.badInput === true }])), overrides: this.overrides });
  }
  isDirty() { return this.snapshot !== null && this._rawSnapshot() !== this.snapshot; }
  _writable() { return this.alive && this.ready && !this.conflict && String(this.project?.id) === String(this.projectId) && !this.project?.archived_at && !this.busy && !this.loading; }
  _refreshEnabled() {
    if (!this.root) return;
    const writable = this._writable(), free = this.inputs.third_party_mode.value === "free";
    for (const [key, input] of Object.entries(this.inputs)) input.disabled = !writable || (key.startsWith("third_party_") && key !== "third_party_mode" && !free);
    this.thirdPartyGroup.hidden = !free; this.thirdPartyGroup.style.display = free ? "grid" : "none";
    // Router.show assigns currentView only after load resolves. Do not permit a
    // nested local navigation while this screen is still being installed.
    for (const button of this.buttons) button.disabled = this.busy || this.loading;
    this.saveButton.disabled = this.saveBackButton.disabled = this.buildingTypeReset.disabled = this.startReset.disabled = !writable;
    this.reloadButton.disabled = this.busy || this.loading;
    if (this.data) {
      if (this.ready) {
        const issues = this.data.readiness.issues;
        this.readinessView.textContent = (issues.length ? "Stand der gespeicherten Angaben – fehlende oder zu prüfende Angaben:\n" + issues.map(issue => issue.message).join("\n") : "Stand der gespeicherten Angaben: vollständig. Dies ist ein bearbeitbarer Entwurf.")
          + (this.isDirty() ? "\nUngespeicherte Änderungen sind noch nicht geprüft." : "\nDer Entwurf bleibt bearbeitbar.");
      }
      const buildingLocal = this._overrideValue("building_type_override") !== null;
      const startLocal = this._overrideValue("planned_start_override") !== null;
      this.buildingSource.textContent = buildingLocal ? "Lokale Angabe nur für diese Vorankündigung." : this.data.central.building_type ? "Art des Bauvorhabens aus dem Projekt." : "Kein zentraler Bauvorhabenwert vorhanden; bei Bedarf direkt hier ergänzen.";
      this.startSource.textContent = startLocal ? "Lokaler Baubeginn nur für diese Vorankündigung." : "Baubeginn aus dem Projekt: " + (this.data.central.planned_start || "noch nicht angegeben");
      this.firmsHint.textContent = this.inputs.firms_mode.value === "attachment"
        ? `Anlage: die Firmenliste der voraussichtlich beauftragten Nachunternehmer. Aktive Projektfirmen: ${this.data.effective.firms?.length || 0}.`
        : "Bereits ausgewählte Arbeitgeber und Unternehmer sind noch nicht bekannt.";
    }
  }
  _overrideValue(key) { return string(this.inputs[key].value) === this.displayed?.[key] ? this.overrides[key] : normalized(this.inputs[key].value); }
  _resetOverride(key) {
    if (!this._writable()) return;
    const source = key === "planned_start_override" ? this.data.central.planned_start : this.data.central.building_type;
    this.overrides[key] = null; this.displayed[key] = string(source); this.inputs[key].value = string(source); this._refreshEnabled();
  }
  _patch() {
    const patch = { building_type_override: this._overrideValue("building_type_override"), planned_start_override: this._overrideValue("planned_start_override"),
      third_party_mode: this.inputs.third_party_mode.value, firms_mode: this.inputs.firms_mode.value };
    if (!["none", "free"].includes(patch.third_party_mode) || !["unknown", "attachment"].includes(patch.firms_mode)) throw new Error("Bitte eine gültige Formularauswahl treffen.");
    for (const key of COUNT_FIELDS) {
      if (this.inputs[key].validity?.badInput) throw new Error("Bitte eine gültige ganze Zahl eingeben.");
      const value = normalized(this.inputs[key].value);
      if (value === null) patch[key] = null;
      else {
        const number = Number(value);
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < (key === "duration_months" ? 1 : 0)) throw new Error(key === "duration_months" ? "Bitte die Dauer als positive ganze Monatszahl eingeben." : "Bitte Anzahlen als nicht negative ganze Zahlen eingeben.");
        patch[key] = number;
      }
    }
    if (this.inputs.planned_start_override.validity?.badInput) throw new Error("Bitte einen gültigen Baubeginn eingeben.");
    for (const key of CONTACT_FIELDS) patch["third_party_" + key] = patch.third_party_mode === "free" ? normalized(this.inputs["third_party_" + key].value) : null;
    return patch;
  }
  async load() {
    if (!this.alive || this.busy) return false;
    const sequence = ++this.sequence, current = () => this.alive && this.sequence === sequence;
    this.loading = true; this.ready = false; this._refreshEnabled(); this.status.textContent = "Vorankündigung wird geladen …";
    this.readinessView.textContent = "Angaben werden geprüft …"; this.readinessView.style.color = "inherit";
    try {
      const data = unpack(await window.bbmDb.sigekoGetPreNotification({ projectId: this.projectId }));
      if (!current()) return false;
      this._setData(data); this.status.textContent = this.project.archived_at ? "Archiviertes Projekt – Vorankündigung ist schreibgeschützt." : "Entwurf geladen. Änderungen bitte ausdrücklich speichern."; return true;
    } catch (error) {
      if (current()) { this.status.textContent = "Vorankündigung konnte nicht geladen werden: " + error.message; this.readinessView.textContent = "Prüfung nicht verfügbar. Bitte erneut laden."; }
      return false;
    } finally { if (current()) { this.loading = false; this._refreshEnabled(); completeM80PilotRender(); } }
  }
  async reload() {
    if (!this.alive || this.busy || this.loading) return false;
    if (this.isDirty() && !window.confirm("Ungespeicherte Vorankündigung verwerfen und neu laden?")) return false;
    return this.load();
  }
  async save({ back = false } = {}) {
    if (!this._writable()) return false;
    let patch;
    try { patch = this._patch(); } catch (error) { this.status.textContent = "Vorankündigung nicht gespeichert: " + error.message; return false; }
    const sequence = ++this.sequence;
    this.busy = true; this._refreshEnabled(); this.status.textContent = "Vorankündigung wird gespeichert …";
    let saved = false;
    try {
      const data = unpack(await window.bbmDb.sigekoSavePreNotification({ projectId: this.projectId, expectedRevision: this.data.record?.revision || 0, patch }));
      if (!this.alive || sequence !== this.sequence) return false;
      this._setData(data); this.status.textContent = "Vorankündigung gespeichert."; saved = true;
    } catch (error) {
      if (this.alive && sequence === this.sequence) {
        this.status.textContent = "Vorankündigung nicht gespeichert: " + error.message;
        if (error.code === "PRE_NOTIFICATION_CONFLICT") { this.conflict = true; this.status.textContent += " Der Entwurf bleibt erhalten. Bitte bewusst neu laden."; }
      }
    } finally { if (this.alive && sequence === this.sequence) { this.busy = false; this._refreshEnabled(); completeM80PilotRender(); } }
    if (saved && back && this.alive) await this._back();
    return saved;
  }
  _back(focusSection = null) { return this.router.openProjectModule(this.projectId, "sigeko", { project: this.project, ...(focusSection ? { focusSection } : {}) }); }
  navigate(action) {
    if (!this.alive || this.busy || this.loading) return false;
    if (this.isDirty() && !window.confirm("Ungespeicherte Vorankündigung verwerfen und diese Ansicht verlassen?")) return false;
    return action();
  }
  destroy() { this.alive = false; ++this.sequence; beginM83ComponentBinding(PRE_NOTIFICATION_COMPONENT_ID); }
}
