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
    this.documents = []; this.documentsLoading = false; this.documentsSequence = 0; this.pdfMessage = "";
    this.workflow = null; this.workflowInputs = {}; this.workflowSequence = 0; this.workflowLoading = false;
    this.mailPreparation = null; this.workflowMessage = "";
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
    this.reloadButton = this._button(actions, "actions.reload", "Neu laden", () => this.reload());
    this.pdfPreviewButton = this._button(actions, "actions.pdfPreview", "PDF-Vorschau", () => this.runPdfAction("preview"));
    this.pdfCreateButton = this._button(actions, "actions.pdfCreate", "PDF erstellen", () => this.runPdfAction("create"));
    this.pdfLayoutButton = this._button(actions, "actions.pdfLayout", "PDF-Layout bearbeiten", () => this.runPdfAction("layout")); root.append(actions);
    this.status = this._label(root, "status", "Vorankündigung wird geladen …"); this.status.setAttribute("role", "status");
    this.readinessView = this._label(root, "readiness", "Angaben werden geprüft …"); this.readinessView.setAttribute("role", "status");
    const pdf = node("section", "pdf"); pdf.style.cssText = STACK + ";box-sizing:border-box;width:100%;padding:8px;background:#f3f6fa;border:1px solid #cbd7e4;border-radius:4px";
    this._label(pdf, "pdf.title", "PDF-Fassungen");
    this.documentSelection = this._field(pdf, "pdf.selection", "Gespeicherte Fassung", "documentSelection", "select");
    // Document selection is view state, never part of the editable form draft.
    delete this.inputs.documentSelection;
    this.documentSelection.oninput = this.documentSelection.onchange = () => { this.workflowLoad = this.loadWorkflow(); };
    this.pdfInfo = this._label(pdf, "pdf.info", "Noch keine PDF-Fassung erstellt.");
    const pdfActions = node("div", "pdf.actions"); pdfActions.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;min-width:0";
    this.pdfOpenButton = this._button(pdfActions, "pdf.actions.open", "Gespeicherte PDF öffnen", () => this.openDocument("main"));
    this.pdfOpenFirmsButton = this._button(pdfActions, "pdf.actions.openFirms", "Firmenanlage öffnen", () => this.openDocument("firms")); pdf.append(pdfActions);
    this.pdfStatus = this._label(pdf, "pdf.status", ""); this.pdfStatus.setAttribute("role", "status");
    this._renderWorkflow(pdf); root.append(pdf);
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
    this.pdfPreviewButton.disabled = this.pdfCreateButton.disabled = this.pdfLayoutButton.disabled = !writable || this.isDirty();
    const selected = this.documents.find(entry => entry.id === this.documentSelection.value);
    this.documentSelection.disabled = !this.alive || this.busy || this.loading || this.documentsLoading || !this.documents.length;
    this.pdfOpenButton.disabled = !selected || this.documentSelection.disabled;
    this.pdfOpenFirmsButton.disabled = this.pdfOpenButton.disabled || !selected?.files.some(file => file.kind === "firms");
    this.pdfInfo.textContent = selected ? `Erstellt am ${this._documentDate(selected)} · ${this._documentName(selected)} · ${selected.files.some(file => file.kind === "firms") ? "mit" : "ohne"} Firmenanlage` : "Noch keine PDF-Fassung erstellt.";
    this.pdfStatus.textContent = [this.isDirty() ? "Bitte Änderungen zuerst speichern." : this.conflict ? "Entwurf inzwischen geändert. Bitte bewusst neu laden." : "", this.pdfMessage].filter(Boolean).join("\n");
    this._refreshWorkflow();
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
    void this.loadDocuments();
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
  _documentDate(entry) { return new Date(entry.createdAt).toLocaleString("de-DE"); }
  _documentName(entry) { return entry.files.find(file => file.kind === "main").projectRelativePath.split("/").pop(); }
  _validateDocument(entry) {
    if (!entry || typeof entry.id !== "string" || !entry.id.trim() || entry.projectId !== this.projectId
      || typeof entry.createdAt !== "string" || !Number.isFinite(Date.parse(entry.createdAt))
      || !Array.isArray(entry.files) || ![1, 2].includes(entry.files.length)
      || entry.files[0]?.kind !== "main" || (entry.files.length === 2 && entry.files[1]?.kind !== "firms")
      || entry.files.some(file => typeof file.projectRelativePath !== "string" || !file.projectRelativePath.endsWith(".pdf"))) {
      throw new Error("PDF-Fassung konnte dem Projekt nicht sicher zugeordnet werden.");
    }
    return entry;
  }
  _setDocuments(documents, preferredId = this.documentSelection.value) {
    if (!Array.isArray(documents)) throw new Error("PDF-Bestand ist nicht verfügbar.");
    documents.forEach(entry => this._validateDocument(entry));
    if (new Set(documents.map(entry => entry.id)).size !== documents.length) throw new Error("PDF-Bestand enthält doppelte Fassungen.");
    this.documents = documents; this.documentSelection.textContent = "";
    for (const entry of documents) {
      const option = document.createElement("option"); option.value = entry.id;
      option.textContent = `${this._documentDate(entry)} · ${this._documentName(entry)}`; this.documentSelection.append(option);
    }
    this.documentSelection.value = documents.some(entry => entry.id === preferredId) ? preferredId : documents[0]?.id || "";
    this.workflowLoad = this.loadWorkflow();
    return !!preferredId && !!documents.length && this.documentSelection.value !== preferredId;
  }
  async loadDocuments() {
    if (!this.alive) return false;
    const sequence = ++this.documentsSequence, projectId = this.projectId;
    const current = () => this.alive && this.projectId === projectId && this.documentsSequence === sequence;
    this.documentsLoading = true; this._refreshEnabled();
    try {
      const data = unpack(await window.bbmDb.sigekoListPreNotificationDocuments({ projectId }));
      if (!current()) return false;
      const replaced = this._setDocuments(data?.documents);
      this.pdfMessage = replaced ? "Bisherige Auswahl nicht mehr vorhanden. Neueste Fassung ausgewählt." : "";
      return true;
    } catch (error) {
      if (current()) this.pdfMessage = "PDF-Bestand konnte nicht geladen werden: " + error.message;
      return false;
    } finally { if (current()) { this.documentsLoading = false; this._refreshEnabled(); } }
  }
  async runPdfAction(action) {
    if (!this._writable() || this.isDirty() || !["preview", "create", "layout"].includes(action)) return false;
    const sequence = ++this.sequence, projectId = this.projectId;
    const current = () => this.alive && this.projectId === projectId && this.sequence === sequence;
    // An older list response must not remove a newly created final document.
    ++this.documentsSequence; this.documentsLoading = false;
    this.busy = true; this.pdfMessage = action === "layout" ? "PDF-Layout wird vorbereitet …" : "PDF wird erstellt …"; this._refreshEnabled();
    try {
      const payload = { projectId, expectedRevision: this.data.record?.revision || 0 };
      const method = { preview: "sigekoPreviewPreNotificationPdf", create: "sigekoCreatePreNotificationPdf", layout: "sigekoPreparePreNotificationPdfEditor" }[action];
      const data = unpack(await window.bbmDb[method](payload));
      if (!current()) return false;
      if (action === "create") {
        const entry = this._validateDocument(data?.document);
        this._setDocuments([entry, ...this.documents.filter(old => old.id !== entry.id)], entry.id);
        this.pdfMessage = "PDF-Fassung erstellt und gespeichert.";
      } else if (action === "layout") {
        const context = data?.context, api = window.uiEditor;
        if (context?.documentTypeId !== "sigeko-vorankuendigung" || context?.projectId !== projectId || !context?.documentId) throw new Error("PDF-Layoutkontext konnte dem Projekt nicht sicher zugeordnet werden.");
        if (typeof api?.preparePdfContext !== "function" || typeof api?.open !== "function") throw new Error("Der separate UI-Editor oder seine sichere Brücke ist nicht verfügbar.");
        const prepared = await api.preparePdfContext(context);
        if (!current()) return false;
        if (!prepared?.ok || prepared.documentTypeId !== context.documentTypeId) throw new Error(prepared?.message || "PDF-Dokumenttyp ist im Layouteditor nicht verfügbar.");
        const guardedApi = { ...api, open: registration => {
          if (!current()) throw new Error("Die Vorankündigung wurde bereits verlassen.");
          return api.open(registration);
        }, sendTargetEvent: event => {
          if (!current()) throw new Error("Die Vorankündigung wurde bereits verlassen.");
          return typeof api.sendTargetEvent === "function" ? api.sendTargetEvent(event) : { ok: false };
        } };
        // The shell catalog imports this screen; load its existing helper only
        // at the user action to avoid a screen/catalog initialization cycle.
        const { openNativeUiEditor } = await import("../../app/coreShellNavigation.js");
        if (!current()) return false;
        const opened = await openNativeUiEditor({ scopeId: PRE_NOTIFICATION_SCOPE_ID, api: guardedApi });
        if (!current()) return false;
        if (!opened?.ok) throw new Error(opened?.message || "Der PDF-Layouteditor konnte nicht geöffnet werden.");
        this.pdfMessage = "Layouteditor geöffnet. Im Editor den Bereich ‚PDF-Ausgabe‘ wählen.";
      } else this.pdfMessage = "PDF-Vorschau geöffnet. Es wurde keine finale Fassung gespeichert.";
      return true;
    } catch (error) {
      if (current()) {
        this.pdfMessage = "PDF-Aktion fehlgeschlagen: " + error.message;
        if (error.code === "PRE_NOTIFICATION_CONFLICT") this.conflict = true;
      }
      return false;
    } finally { if (current()) { this.busy = false; this._refreshEnabled(); completeM80PilotRender(); } }
  }
  async openDocument(kind) {
    const entry = this.documents.find(document => document.id === this.documentSelection.value);
    if (!this.alive || this.busy || this.loading || this.documentsLoading || !entry?.files.some(file => file.kind === kind)) return false;
    const sequence = ++this.sequence, projectId = this.projectId;
    const current = () => this.alive && this.projectId === projectId && this.sequence === sequence;
    this.busy = true; this.pdfMessage = "Gespeicherte Datei wird geöffnet …"; this._refreshEnabled();
    try {
      unpack(await window.bbmDb.sigekoOpenPreNotificationDocumentFile({ projectId, documentId: entry.id, kind }));
      if (!current()) return false;
      this.pdfMessage = kind === "firms" ? "Gespeicherte Firmenanlage geöffnet." : "Gespeicherte PDF geöffnet."; return true;
    } catch (error) { if (current()) this.pdfMessage = "Gespeicherte Datei konnte nicht geöffnet werden: " + error.message; return false; }
    finally { if (current()) { this.busy = false; this._refreshEnabled(); } }
  }
  _workflowField(parent, suffix, label, key, kind = "text") {
    let input;
    if (kind === "multilineText") {
      const group = node("div", suffix); group.style.cssText = STACK + ";gap:3px";
      const caption = node("label", suffix + ".label", label); caption.htmlFor = id(suffix + ".input");
      input = node("textarea", suffix + ".input"); input.id = id(suffix + ".input"); input.rows = 5; input.maxLength = 32768;
      input.style.cssText = "box-sizing:border-box;width:100%;min-width:0;max-width:100%;min-height:100px;padding:6px;font:inherit";
      group.append(caption, input); parent.append(group);
    } else {
      input = this._field(parent, suffix, label, key, kind); delete this.inputs[key];
    }
    input.oninput = input.onchange = () => this._refreshEnabled();
    this.workflowInputs[key] = input; return input;
  }
  _renderWorkflow(parent) {
    const prefix = "pdf.workflow", section = node("section", prefix); section.style.cssText = STACK + ";padding-top:12px;border-top:1px solid #cbd7e4";
    this._label(section, prefix + ".title", "Rücklauf und Outlook");
    this.workflowState = this._label(section, prefix + ".state", "Noch keine PDF-Fassung ausgewählt."); this.workflowState.setAttribute("role", "status");
    this._label(section, prefix + ".hint", "Die Ampel zeigt die bestätigte Outlook-Entwurfsübergabe, keinen tatsächlichen Versand. Das optionale Rücklaufdatum wird erst beim erfolgreichen Öffnen des Unterschrift-Entwurfs gespeichert.");
    const returned = node("div", prefix + ".return"); returned.style.cssText = STACK;
    this.returnInfo = this._label(returned, prefix + ".return.info", "Keine Rücklaufdatei zugeordnet.");
    this.returnImportButton = this._button(returned, prefix + ".return.import", "Unterschriebenes PDF zuordnen", () => this.runWorkflowAction("import"));
    this.returnOpenButton = this._button(returned, prefix + ".return.open", "Unterschriebenes PDF öffnen", () => this.runWorkflowAction("open"));
    this._workflowField(returned, prefix + ".return.due", "Erbetener Rücklauf – optional, gespeichert beim Öffnen des Unterschrift-Entwurfs", "due", "date");
    this.workflowInputs.due.oninput = this.workflowInputs.due.onchange = () => {
      if (this.mailPreparation?.purpose === "signature" && normalized(this.workflowInputs.due.value) !== this.mailPreparation.returnRequestedBy) {
        this._clearMail(); this.workflowMessage = "Rücklaufdatum geändert. Bitte den Unterschrift-Entwurf erneut vorbereiten.";
      }
      this._refreshEnabled();
    };
    section.append(returned);
    const actions = node("div", prefix + ".actions"); actions.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;min-width:0";
    this.signatureMailButton = this._button(actions, prefix + ".actions.signature", "Zur Unterschrift vorbereiten", () => this.prepareMail("signature"));
    this.authorityMailButton = this._button(actions, prefix + ".actions.authority", "An Behörde vorbereiten", () => this.prepareMail("authority")); section.append(actions);
    const mail = node("div", prefix + ".mail"); mail.style.cssText = STACK;
    this.mailPurpose = this._label(mail, prefix + ".mail.purpose", "Kein Mailvorgang vorbereitet.");
    this._workflowField(mail, prefix + ".mail.choice", "Empfänger aus Projektkontakten auswählen", "choice", "select");
    this.addRecipientButton = this._button(mail, prefix + ".mail.addRecipient", "Adresse übernehmen", () => {
      if (!this._workflowWritable() || !this.mailPreparation || !this.workflowInputs.choice.value) return false;
      this.workflowInputs.recipients.value = this._recipients(this.workflowInputs.recipients.value + ";" + this.workflowInputs.choice.value).join("; ");
      this._refreshEnabled(); return true;
    });
    this._workflowField(mail, prefix + ".mail.recipients", "Empfängeradressen – mit Semikolon trennen", "recipients");
    this._workflowField(mail, prefix + ".mail.subject", "Betreff", "subject").maxLength = 1000;
    this._workflowField(mail, prefix + ".mail.body", "Nachricht", "body", "multilineText");
    this.mailAttachments = this._label(mail, prefix + ".mail.attachments", "Keine Anlagen vorbereitet.");
    this.mailOpenButton = this._button(mail, prefix + ".mail.open", "Outlook-Entwurf öffnen", () => this.runWorkflowAction("mail")); section.append(mail);
    this.workflowStatus = this._label(section, prefix + ".status", ""); this.workflowStatus.setAttribute("role", "status"); parent.append(section);
  }
  _clearMail() {
    this.mailPreparation = null;
    for (const key of ["recipients", "subject", "body"]) this.workflowInputs[key].value = "";
    this.workflowInputs.choice.textContent = ""; this.workflowInputs.choice.value = "";
  }
  _workflowAvailable() {
    return this.alive && !this.busy && !this.loading && !this.documentsLoading && !this.workflowLoading
      && this.workflow?.projectId === this.projectId && this.workflow?.documentId === this.documentSelection.value;
  }
  _workflowWritable() { return this._workflowAvailable() && this.workflow.canWrite && !this.project?.archived_at; }
  _refreshWorkflow() {
    if (!this.workflowState) return;
    const available = this._workflowAvailable(), writable = this._workflowWritable(), prepared = !!this.mailPreparation;
    this.returnImportButton.disabled = this.signatureMailButton.disabled = !writable;
    this.returnOpenButton.disabled = !available || !this.workflow?.signedFile;
    this.authorityMailButton.disabled = !writable || !this.workflow?.signedFile;
    this.mailOpenButton.disabled = !writable || !prepared;
    this.addRecipientButton.disabled = !writable || !prepared || !this.workflowInputs.choice.value;
    for (const [key, input] of Object.entries(this.workflowInputs)) input.disabled = !writable || (key !== "due" && !prepared) || (key === "due" && this.mailPreparation?.purpose === "authority");
    const state = this.workflow?.status;
    this.workflowState.textContent = this.workflowLoading ? "Prozessstand wird geladen …" : state === "green" ? "Grün – Outlook-Entwurf an die Behörde geöffnet."
      : state === "orange" ? "Orange – Outlook-Entwurf zur Unterschrift geöffnet." : state === "red" ? "Rot – noch keine Outlook-Übergabe bestätigt."
        : this.documentSelection.value ? "Prozessstand nicht verfügbar." : "Noch keine PDF-Fassung ausgewählt.";
    this.workflowState.style.color = { red: "#a12622", orange: "#885700", green: "#176b3a" }[state] || "inherit";
    this.returnInfo.textContent = this.workflow?.signedFile ? "Zugeordneter Rücklauf: " + this.workflow.signedFile.projectRelativePath.split("/").pop() : "Keine Rücklaufdatei zugeordnet.";
    this.mailPurpose.textContent = prepared ? `Vorbereitet für die ausgewählte Fassung: ${this.mailPreparation.purpose === "signature" ? "zur Unterschrift" : "an die Behörde"}.` : "Kein Mailvorgang vorbereitet.";
    this.mailAttachments.textContent = prepared ? "Anlagen:\n" + this.mailPreparation.attachments.map(file => `${file.name} (${file.byteSize} Bytes)`).join("\n") : "Keine Anlagen vorbereitet.";
    this.workflowStatus.textContent = this.workflowMessage;
  }
  _validateWorkflow(value, documentId) {
    const revision = value?.revision;
    if (value?.projectId !== this.projectId || value?.documentId !== documentId || !["red", "orange", "green"].includes(value?.status)
      || !(revision === null || Number.isSafeInteger(revision) && revision > 0) || typeof value.canWrite !== "boolean"
      || !(value.signedFile === null || value.signedFile?.kind === "signed" && typeof value.signedFile.projectRelativePath === "string" && value.signedFile.projectRelativePath.endsWith(".pdf"))) {
      throw new Error("Rücklaufdaten konnten der ausgewählten Fassung nicht sicher zugeordnet werden.");
    }
    return value;
  }
  async loadWorkflow({ message = "" } = {}) {
    const sequence = ++this.workflowSequence, projectId = this.projectId, documentId = this.documentSelection.value;
    const current = () => this.alive && this.workflowSequence === sequence && this.projectId === projectId && this.documentSelection.value === documentId;
    this.workflow = null; this._clearMail(); this.workflowInputs.due.value = ""; this.workflowMessage = message;
    this.workflowLoading = !!documentId; this._refreshEnabled();
    if (!documentId || !this.alive) return false;
    try {
      const data = unpack(await window.bbmDb.sigekoGetPreNotificationWorkflow({ projectId, documentId }));
      if (!current()) return false;
      this.workflow = this._validateWorkflow(data, documentId); this.workflowInputs.due.value = string(data.returnRequestedBy); return true;
    } catch (error) { if (current()) this.workflowMessage = [message, "Prozessstand konnte nicht geladen werden: " + error.message].filter(Boolean).join("\n"); return false; }
    finally { if (current()) { this.workflowLoading = false; this._refreshEnabled(); } }
  }
  _returnDate() {
    const input = this.workflowInputs.due, value = normalized(input.value);
    if (input.validity?.badInput || value !== null && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) throw new Error("Bitte ein gültiges Rücklaufdatum eingeben.");
    return value;
  }
  _recipients(value) {
    const seen = new Set();
    return string(value).split(/[;,]/).map(entry => entry.trim()).filter(entry => {
      const key = entry.toLowerCase(); if (!entry || seen.has(key)) return false; seen.add(key); return true;
    });
  }
  async _loadRecipientChoices(projectId, current) {
    const api = window.bbmDb, options = [], seen = new Set();
    const add = (email, label) => { const value = string(email).trim(), key = value.toLowerCase(); if (value && !seen.has(key)) { seen.add(key); options.push({ value, label: `${label || value} – ${value}` }); } };
    try {
      const firms = await api.firmDirectoryListProjectParticipants({ projectId, includeInactive: false });
      if (!current()) return;
      if (!firms?.ok || !Array.isArray(firms.list)) throw new Error(firms?.error || "Projektkontakte nicht verfügbar.");
      for (const entry of firms.list) {
        add(entry.email, entry.label || entry.name);
        const persons = await api.firmDirectoryListPersons({ ref: { ...entry.ref, projectId }, forUse: "project_participant" });
        if (!current()) return;
        if (!persons?.ok || !Array.isArray(persons.list)) throw new Error(persons?.error || "Ansprechpartner nicht verfügbar.");
        for (const person of persons.list) add(person.email, `${entry.label || entry.name} / ${person.name || "Ansprechpartner"}`);
      }
    } catch (error) { if (current()) this.workflowMessage += "\nProjektkontakte konnten nicht vollständig geladen werden. Empfänger können frei eingetragen werden: " + error.message; }
    if (!current()) return;
    const select = this.workflowInputs.choice; select.textContent = "";
    for (const item of [{ value: "", label: "Bitte auswählen" }, ...options]) { const option = document.createElement("option"); option.value = item.value; option.textContent = item.label; select.append(option); }
    select.value = "";
  }
  async prepareMail(purpose) {
    if (!this._workflowWritable() || !["signature", "authority"].includes(purpose) || purpose === "authority" && !this.workflow.signedFile) return false;
    let returnRequestedBy;
    try { returnRequestedBy = purpose === "signature" ? this._returnDate() : this.workflow.returnRequestedBy; }
    catch (error) { this.workflowMessage = error.message; this._refreshEnabled(); return false; }
    const projectId = this.projectId, documentId = this.documentSelection.value, generation = this.workflowSequence, sequence = ++this.sequence;
    const current = () => this.alive && this.projectId === projectId && this.documentSelection.value === documentId && this.workflowSequence === generation && this.sequence === sequence;
    this.busy = true; this._clearMail(); this.workflowMessage = "Outlook-Entwurf wird vorbereitet …"; this._refreshEnabled();
    try {
      const data = unpack(await window.bbmDb.sigekoPreparePreNotificationMail({ projectId, documentId, purpose, returnRequestedBy }));
      if (!current()) return false;
      if (data?.projectId !== projectId || data?.documentId !== documentId || data?.purpose !== purpose || data.revision !== this.workflow.revision
        || data.returnRequestedBy !== returnRequestedBy || !Array.isArray(data.recipients) || data.recipients.some(value => typeof value !== "string")
        || typeof data.subject !== "string" || typeof data.body !== "string" || !Array.isArray(data.attachments) || !data.attachments.length
        || data.attachments.some(file => typeof file.name !== "string" || !Number.isSafeInteger(file.byteSize) || file.byteSize < 1)) throw new Error("Mailvorbereitung passt nicht zur ausgewählten Fassung oder zum aktuellen Prozessstand. Bitte erneut laden.");
      this.mailPreparation = data; this.workflowInputs.recipients.value = data.recipients.join("; ");
      this.workflowInputs.subject.value = data.subject; this.workflowInputs.body.value = data.body;
      this.workflowMessage = "Empfänger, Betreff, Nachricht und Anlagen prüfen. Erst ‚Outlook-Entwurf öffnen‘ führt die Übergabe aus.";
      await this._loadRecipientChoices(projectId, current); return current();
    } catch (error) { if (current()) { this._clearMail(); this.workflowMessage = "Mailvorbereitung fehlgeschlagen: " + error.message; } return false; }
    finally { if (this.alive && this.sequence === sequence) { this.busy = false; this._refreshEnabled(); completeM80PilotRender(); } }
  }
  async runWorkflowAction(action) {
    if (!["import", "open", "mail"].includes(action) || !(action === "open" ? this._workflowAvailable() && this.workflow.signedFile : this._workflowWritable()) || action === "mail" && !this.mailPreparation) return false;
    const projectId = this.projectId, documentId = this.documentSelection.value, sequence = ++this.sequence, generation = this.workflowSequence;
    const current = () => this.alive && this.projectId === projectId && this.documentSelection.value === documentId && this.workflowSequence === generation && this.sequence === sequence;
    let reload = false, payload = { projectId, documentId };
    try {
      if (action !== "open") payload.expectedRevision = this.workflow.revision;
      if (action === "mail") {
        const mail = this.mailPreparation, recipients = this._recipients(this.workflowInputs.recipients.value);
        if (mail.documentId !== documentId || mail.projectId !== projectId || mail.revision !== this.workflow.revision) throw new Error("Mailvorbereitung ist nicht mehr aktuell. Bitte erneut vorbereiten.");
        if (!recipients.length || recipients.some(value => !/^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(value))) throw new Error("Bitte gültige Empfängeradressen eintragen.");
        const due = mail.purpose === "signature" ? this._returnDate() : this.workflow.returnRequestedBy;
        if (due !== mail.returnRequestedBy) { this._clearMail(); throw new Error("Rücklaufdatum geändert. Bitte erneut vorbereiten."); }
        payload = { ...payload, purpose: mail.purpose, recipients, subject: this.workflowInputs.subject.value, body: this.workflowInputs.body.value, returnRequestedBy: due };
      }
      this.busy = true; this.workflowMessage = action === "import" ? "Rücklauf-PDF auswählen …" : action === "open" ? "Rücklauf wird geöffnet …" : "Outlook-Entwurf wird geöffnet …"; this._refreshEnabled();
      const method = { import: "sigekoImportPreNotificationSignedReturn", open: "sigekoOpenPreNotificationSignedReturn", mail: "sigekoOpenPreNotificationMailDraft" }[action];
      const data = unpack(await window.bbmDb[method](payload));
      if (!current()) return false;
      if (action === "open") {
        if (data?.opened !== true) throw new Error("Dateiöffnung wurde nicht bestätigt.");
        this.workflowMessage = "Zugeordneter Rücklauf geöffnet.";
      } else if (action === "import" && data?.canceled === true) this.workflowMessage = "Dateiauswahl abgebrochen. Rücklauf unverändert.";
      else {
        if (action === "mail" && (data?.outcome !== "draft-opened" || data?.transport !== "outlook") || action === "import" && data?.canceled !== false) throw new Error("Vorgang wurde nicht bestätigt.");
        this.workflow = this._validateWorkflow(data.workflow, documentId); this.workflowInputs.due.value = string(this.workflow.returnRequestedBy); this._clearMail();
        this.workflowMessage = action === "import" ? "Rücklaufdatei zugeordnet. Der Dateiinhalt wurde nicht auf eine gültige Unterschrift geprüft." : "Outlook-Entwurf mit Anlagen geöffnet. Der tatsächliche Versand erfolgt in Outlook.";
      }
      return true;
    } catch (error) {
      if (current()) {
        this.workflowMessage = "Vorgang fehlgeschlagen: " + error.message;
        if (["SIGEKO_MAIL_OPENED_STATE_UNSAVED", "PRE_NOTIFICATION_WORKFLOW_CONFLICT"].includes(error.code)) {
          this._clearMail(); reload = true;
        }
      }
      return false;
    } finally {
      if (this.alive && this.sequence === sequence) {
        this.busy = false; this._refreshEnabled(); completeM80PilotRender();
        if (reload && current()) await this.loadWorkflow({ message: this.workflowMessage });
      }
    }
  }
  _back(focusSection = null) { return this.router.openProjectModule(this.projectId, "sigeko", { project: this.project, ...(focusSection ? { focusSection } : {}) }); }
  navigate(action) {
    if (!this.alive || this.busy || this.loading) return false;
    if (this.isDirty() && !window.confirm("Ungespeicherte Vorankündigung verwerfen und diese Ansicht verlassen?")) return false;
    return action();
  }
  destroy() { this.alive = false; ++this.sequence; ++this.documentsSequence; ++this.workflowSequence; beginM83ComponentBinding(PRE_NOTIFICATION_COMPONENT_ID); }
}
