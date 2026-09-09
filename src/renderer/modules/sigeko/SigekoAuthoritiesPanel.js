import { registerM80Ref, completeM80PilotRender } from "../../ui-editor/m80Refs.js";
import { SIGEKO_AUTHORITY_CATEGORIES as CATEGORIES, SIGEKO_AUTHORITY_INPUTS as FIELDS } from "./SigekoScreen.uiEditorContract.js";

const PREFIX = ".authorities";
const PANEL = "min-width:0;padding:16px;border:1px solid #d3dfec;border-radius:8px;background:#fff;display:flex;flex-direction:column;gap:12px";
const GRID = "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px;min-width:0";
const COLORS = { red: "#a12622", orange: "#885700", green: "#176b3a" };
const STATUS = { red: "Rot – Angaben fehlen", orange: "Orange – Angaben prüfen", green: "Grün – Angaben bestätigt" };
const value = input => String(input?.value ?? "").trim() || null;
const dataOf = result => { if (!result?.ok) throw new Error(result?.error || "Behördendaten nicht verfügbar."); return result.data; };
function node(tag, suffix, content = "") {
  const element = document.createElement(tag); element.textContent = content;
  registerM80Ref("sigeko.screen" + PREFIX + suffix, element);
  if (tag === "p") element.style.cssText = "margin:0;white-space:pre-line;overflow-wrap:anywhere";
  return element;
}
function options(select, rows, selected) {
  select.textContent = "";
  for (const [id, label] of rows) { const option = document.createElement("option"); option.value = id; option.textContent = label; select.append(option); }
  select.value = selected;
}

export default class SigekoAuthoritiesPanel {
  constructor({ screen }) {
    this.screen = screen; this.alive = true; this.sequence = 0;
    this.ready = false; this.loading = false; this.busy = false;
    this.records = []; this.projectData = null; this.selectedRecord = null;
    this.category = "LABOR_AUTHORITY"; this.inputs = {}; this.overview = {};
    this.newDraftActive = false; this.selectionInitialized = false;
  }
  render() {
    const root = node("section", ""); root.style.cssText = PANEL; this.root = root;
    root.append(node("h2", ".title", "Behörden / Notfall / Versorger"), node("p", ".hint", "Bestandskontakte werden wiederverwendet. Die Projektzuordnung speichert einen eigenen Kontaktstand; spätere Bestandsänderungen können eine erneute Prüfung erfordern. Notruf 112 und Polizeinotruf 110 sind fest."));
    this.status = node("p", ".status", "Behördendaten werden geladen …"); this.status.setAttribute("role", "status"); root.append(this.status);
    const overview = node("div", ".overview"); overview.style.cssText = "display:flex;flex-direction:column;gap:8px;min-width:0";
    for (const [category, key, label] of CATEGORIES) { const row = node("p", `.overview.${key}`, `${label}: wird geprüft …`); row.setAttribute("role", "status"); this.overview[category] = row; overview.append(row); }
    root.append(overview);
    this.refreshButton = this.button(root, ".refresh", "Behörden aktualisieren", () => this.load());
    this.applyButton = this.button(root, ".apply", "Eindeutige Treffer übernehmen", () => this.applyKnown());
    const record = node("section", ".record"); record.style.cssText = PANEL;
    record.append(node("h3", ".record.title", "Bestandskontakt bearbeiten"), node("p", ".record.hint", "Speichern bestätigt keine Prüfung. Quelle, Bezugsgebiet und fachlichen Prüfnachweis dokumentieren, danach den gespeicherten Bestand ausdrücklich bestätigen. Bei Strom und Gas den Netzbetreiber mit Störkontakt erfassen."));
    this.categoryInput = this.field(record, ".category", "Kategorie", "select");
    options(this.categoryInput, CATEGORIES.filter(([key]) => key !== "EMERGENCY_112").map(([key, , label]) => [key, label]), this.category);
    this.categoryInput.onchange = () => this.changeCategory();
    this.contactInput = this.field(record, ".contact", "Bestandskontakt", "select"); this.contactInput.onchange = () => this.changeContact();
    this.newButton = this.button(record, ".new", "Neuen Kontakt anlegen", () => this.newDraft());
    const fields = node("div", ".record.fields"); fields.style.cssText = GRID;
    for (const [key, label, kind] of FIELDS) this.inputs[key] = this.field(fields, `.record.${key}`, label, kind);
    record.append(fields);
    this.saveButton = this.button(record, ".record.save", "Bestand speichern", () => this.saveRecord());
    this.confirmButton = this.button(record, ".record.confirm", "Bestandsprüfung bestätigen", () => this.confirmRecord());
    this.reasonInput = this.field(record, ".record.reason", "Grund für Unsicherheit", "multilineText");
    this.uncertainButton = this.button(record, ".record.uncertain", "Bestand als unsicher markieren", () => this.markUncertain());
    this.recordStatus = node("p", ".record.status", "Kontakt auswählen oder neu anlegen."); this.recordStatus.setAttribute("role", "status"); record.append(this.recordStatus); root.append(record);
    const assignment = node("section", ".assignment"); assignment.style.cssText = PANEL;
    assignment.append(node("h3", ".assignment.title", "Projektzuordnung"));
    this.snapshotView = node("p", ".assignment.snapshot", "Projektkontakt wird geladen …"); assignment.append(this.snapshotView);
    this.assignmentHint = node("p", ".assignment.hint"); assignment.append(this.assignmentHint);
    this.noteInput = this.field(assignment, ".assignment.note", "Projektbezogene Prüfung / Begründung", "multilineText");
    this.assignConfirmButton = this.button(assignment, ".assignment.confirm", "Zuständigkeit bestätigen und zuordnen", () => this.assign("confirmed"));
    this.assignUncertainButton = this.button(assignment, ".assignment.uncertain", "Mit Prüfbedarf zuordnen", () => this.assign("uncertain"));
    root.append(assignment);
    this.recordSnapshot = JSON.stringify(this.draft()); this.contactOptions(); this.showAssignment(); this.refreshEnabled(); return root;
  }
  field(parent, suffix, label, kind) {
    const input = this.screen._field(parent, PREFIX + suffix, label, kind);
    input.oninput = () => { this.refreshEnabled(); completeM80PilotRender(); }; return input;
  }
  button(parent, suffix, label, action) { return this.screen._button(parent, PREFIX + suffix, label, action); }
  draft() { return Object.fromEntries(FIELDS.map(([key]) => [key, value(this.inputs[key])])); }
  recordDirty() { return JSON.stringify(this.draft()) !== this.recordSnapshot; }
  isDirty() { return this.newDraftActive || this.recordDirty() || !!value(this.reasonInput) || !!value(this.noteInput); }
  canDiscard() { return !this.isDirty() || window.confirm("Ungespeicherte Behördeneingaben verwerfen?"); }
  contactOptions() {
    const rows = this.records.filter(row => row.category === this.category);
    const selected = this.selectedRecord?.id || "";
    const choices = [["", this.newDraftActive ? "Neuer Kontakt – noch nicht gespeichert" : "Kontakt auswählen …"], ...rows.map(row => [row.id, row.organization])];
    if (selected && !rows.some(row => row.id === selected)) choices.push([selected, "Gespeicherte Quelle nicht verfügbar"]);
    options(this.contactInput, choices, selected);
  }
  setRecord(record) {
    this.selectedRecord = record || null; this.newDraftActive = false;
    for (const [key] of FIELDS) this.inputs[key].value = record?.[key] || "";
    this.recordSnapshot = JSON.stringify(this.draft()); this.contactOptions(); this.showRecord();
  }
  changeCategory() {
    const next = this.categoryInput.value;
    if (this.busy || !CATEGORIES.some(([key]) => key === next && key !== "EMERGENCY_112") || !this.canDiscard()) { this.categoryInput.value = this.category; return; }
    this.category = next; this.selectionInitialized = true; this.reasonInput.value = this.noteInput.value = ""; this.setRecord(this.assignedRecord()); this.showAssignment(); this.refreshEnabled(); completeM80PilotRender();
  }
  changeContact() {
    const next = this.contactInput.value;
    if (this.busy || !this.canDiscard()) { this.contactInput.value = this.selectedRecord?.id || ""; return; }
    this.selectionInitialized = true; this.reasonInput.value = this.noteInput.value = "";
    this.setRecord(this.records.find(row => row.id === next && row.category === this.category) || null);
    this.showAssignment(); this.refreshEnabled(); completeM80PilotRender();
  }
  newDraft() {
    if (!this.ready || this.busy || !this.projectWritable() || !this.canDiscard()) return;
    this.selectionInitialized = true; this.reasonInput.value = this.noteInput.value = ""; this.setRecord(null); this.newDraftActive = true;
    this.contactOptions(); this.recordStatus.textContent = "Neuer Kontakt. Angaben erfassen und Bestand speichern.";
    this.refreshEnabled(); completeM80PilotRender();
  }
  assignedRecord() {
    const id = this.projectData?.categories.find(row => row.category === this.category)?.assignment?.source_id;
    return this.records.find(row => row.id === id && row.category === this.category) || null;
  }
  showRecord() {
    const row = this.selectedRecord;
    this.recordStatus.textContent = !row ? "Kontakt auswählen oder neu anlegen." : [
      row.verification_status === "confirmed" ? "Bestand bestätigt" : row.verification_status === "uncertain" ? "Bestand unsicher" : "Bestand ungeprüft",
      row.verified_at ? `Prüfdatum: ${row.verified_at}` : "", row.uncertainty_reason,
      ...(row.confirmationIssues || []).map(issue => issue.message),
    ].filter(Boolean).join("\n");
  }
  showAssignment() {
    const entry = this.projectData?.categories.find(row => row.category === this.category), assignment = entry?.assignment;
    this.assignmentHint.textContent = [
      ["HOSPITAL", "ACCIDENT_DOCTOR"].includes(this.category) ? "Nähe und Eignung für diese Baustelle ausdrücklich prüfen und begründen." : "Zuständigkeit für die konkrete Baustellenadresse prüfen und begründen.",
      this.category === "POLICE" ? "Polizeinotruf: 110. Zusätzlich ist die örtlich zuständige Polizeidienststelle erforderlich." : "",
      ...(entry?.issues || []).map(issue => issue.message),
    ].filter(Boolean).join("\n");
    if (!this.projectData) { this.snapshotView.textContent = "Projektkontakt derzeit nicht geprüft. Bitte Behörden aktualisieren."; return; }
    if (!assignment) { this.snapshotView.textContent = "Für diese Kategorie ist noch kein Projektkontakt gespeichert."; return; }
    const snapshot = assignment.snapshot;
    this.snapshotView.textContent = ["Gespeicherter Projektkontakt:", ...FIELDS.map(([key, label]) => `${label}: ${snapshot?.[key] || "–"}`),
      `Bestandsprüfstatus: ${snapshot?.verification_status || "–"}`, `Prüfdatum: ${snapshot?.verified_at || "–"}`,
      snapshot?.uncertainty_reason ? `Unsicherheit: ${snapshot.uncertainty_reason}` : "",
      `Baustellenadresse bei Zuordnung: ${[assignment.address_street, assignment.address_zip, assignment.address_city].filter(Boolean).join(", ")}`,
      `Projektprüfung: ${assignment.assessment_status === "confirmed" ? "bestätigt" : "Prüfbedarf"} – ${assignment.assessment_note}`,
      `Aktueller Status: ${STATUS[entry.status]}`, this.category === "POLICE" ? "Polizeinotruf: 110" : "",
    ].filter(Boolean).join("\n");
  }
  clearStatus(message) {
    this.projectData = null; this.status.textContent = message; this.status.style.color = "inherit";
    for (const [category, , label] of CATEGORIES) { this.overview[category].textContent = `${label}: ${message}`; this.overview[category].style.color = "inherit"; }
    this.showAssignment();
  }
  showProject() {
    this.status.textContent = `${STATUS[this.projectData.status]}. Baustelle: ${Object.values(this.projectData.address).filter(Boolean).join(", ") || "Adresse fehlt"}${this.screen.project?.archived_at ? " – Archiviert: schreibgeschützt." : ""}`;
    this.status.style.color = COLORS[this.projectData.status];
    for (const [category, , label] of CATEGORIES) {
      const entry = this.projectData.categories.find(row => row.category === category);
      this.overview[category].textContent = [label + ": " + STATUS[entry.status], entry.fixedPhone ? `Notruf ${entry.fixedPhone}` : "",
        entry.assignment?.snapshot?.organization, ...(entry.issues || []).map(issue => issue.message), entry.proposal ? "Eindeutiger Treffer zur Sammelübernahme vorhanden." : ""].filter(Boolean).join(" · ");
      this.overview[category].style.color = COLORS[entry.status];
    }
    this.showAssignment();
  }
  projectWritable() {
    return !!this.screen.project && String(this.screen.project.id) === String(this.screen.projectId) && !this.screen.project.archived_at;
  }
  refreshEnabled() {
    if (!this.root) return;
    const disabled = !this.ready || this.loading || this.busy || !this.projectWritable();
    const saved = this.selectedRecord && this.records.some(row => row.id === this.selectedRecord.id && row.revision === this.selectedRecord.revision);
    this.categoryInput.disabled = this.contactInput.disabled = this.busy;
    this.refreshButton.disabled = this.busy;
    this.newButton.disabled = disabled;
    for (const field of [...Object.values(this.inputs), this.reasonInput, this.noteInput]) field.disabled = disabled;
    this.saveButton.disabled = disabled || !value(this.inputs.organization) || (!this.recordDirty() && !this.newDraftActive);
    this.confirmButton.disabled = disabled || !saved || this.recordDirty() || !!this.selectedRecord?.confirmationIssues?.length || this.selectedRecord?.verification_status === "confirmed";
    this.uncertainButton.disabled = disabled || !saved || this.recordDirty() || !value(this.reasonInput);
    this.assignConfirmButton.disabled = this.assignUncertainButton.disabled = disabled || !saved || this.recordDirty() || !value(this.noteInput) || !this.projectData;
    this.applyButton.disabled = disabled || this.isDirty() || !this.projectData?.categories.some(row => row.proposal && !row.assignment);
  }
  async load() {
    if (!this.alive || this.busy) return;
    const sequence = ++this.sequence, current = () => this.alive && sequence === this.sequence;
    this.loading = true; this.ready = false; this.clearStatus("Wird geprüft …"); this.refreshEnabled();
    try {
      const [stock, project] = await Promise.all([window.bbmDb.sigekoListAuthorityRecords(), window.bbmDb.sigekoGetProjectAuthorities({ projectId: this.screen.projectId })]);
      if (!current()) return;
      const records = dataOf(stock), data = dataOf(project);
      if (!Array.isArray(records) || String(data?.projectId) !== String(this.screen.projectId) || !data?.address || !Array.isArray(data.categories)
        || data.categories.length !== CATEGORIES.length || !STATUS[data.status]
        || CATEGORIES.some(([category]) => data.categories.filter(row => row.category === category && STATUS[row.status] && Array.isArray(row.issues)).length !== 1)) throw new Error("Behördendaten konnten nicht zugeordnet werden.");
      this.records = records; this.projectData = data; this.ready = true;
      if (!this.selectionInitialized && !this.isDirty()) { this.setRecord(this.assignedRecord()); this.selectionInitialized = true; }
      const selected = this.selectedRecord && records.find(row => row.id === this.selectedRecord.id && row.category === this.category);
      if (selected && !this.recordDirty()) this.setRecord(selected);
      else this.contactOptions();
      this.showProject();
    } catch (error) { if (current()) this.clearStatus(`Prüfung nicht verfügbar: ${error.message}`); }
    finally { if (current()) { this.loading = false; this.refreshEnabled(); completeM80PilotRender(); } }
  }
  async mutate(action, success) {
    if (!this.alive || !this.ready || this.loading || this.busy || !this.projectWritable()) return;
    this.busy = true; ++this.sequence; this.clearStatus("Änderung wird gespeichert …"); this.refreshEnabled();
    try {
      const data = dataOf(await action());
      if (!this.alive) return;
      success(data);
    } catch (error) { if (this.alive) { this.ready = false; this.clearStatus(`Änderung nicht gespeichert: ${error.message} Bitte aktualisieren.`); } }
    finally {
      this.busy = false;
      if (this.alive) { this.refreshEnabled(); completeM80PilotRender(); void this.screen._loadReadiness(); if (this.ready) void this.load(); }
    }
  }
  saveRecord() {
    if (this.saveButton.disabled) return;
    const selected = this.selectedRecord;
    const payload = selected ? { id: selected.id, expectedRevision: selected.revision, patch: this.draft() } : { patch: { category: this.category, ...this.draft() } };
    return this.mutate(() => window.bbmDb.sigekoSaveAuthorityRecord(payload), record => { this.setRecord(record); this.recordStatus.textContent = "Bestand gespeichert. Prüfung und Projektzuordnung bleiben getrennt."; });
  }
  confirmRecord() {
    if (this.confirmButton.disabled) return;
    const { id, revision } = this.selectedRecord;
    return this.mutate(() => window.bbmDb.sigekoConfirmAuthorityRecord({ id, expectedRevision: revision }), record => this.setRecord(record));
  }
  markUncertain() {
    if (this.uncertainButton.disabled) return;
    const { id, revision } = this.selectedRecord, reason = value(this.reasonInput);
    return this.mutate(() => window.bbmDb.sigekoMarkAuthorityUncertain({ id, expectedRevision: revision, reason }), record => { this.setRecord(record); this.reasonInput.value = ""; });
  }
  assign(status) {
    if (!["confirmed", "uncertain"].includes(status) || this.assignConfirmButton.disabled) return;
    const entry = this.projectData.categories.find(row => row.category === this.category);
    const payload = { projectId: this.screen.projectId, category: this.category, sourceId: this.selectedRecord.id, sourceRevision: this.selectedRecord.revision,
      expectedRevision: entry.assignment?.revision || 0, expectedAddress: { ...this.projectData.address }, status, note: value(this.noteInput) };
    return this.mutate(() => window.bbmDb.sigekoAssignProjectAuthority(payload), () => { this.noteInput.value = ""; });
  }
  applyKnown() {
    if (this.applyButton.disabled) return;
    const payload = { projectId: this.screen.projectId, expectedAddress: { ...this.projectData.address }, selections: this.projectData.categories.filter(row => row.proposal && !row.assignment).map(row => ({ ...row.proposal })) };
    return this.mutate(() => window.bbmDb.sigekoApplyKnownProjectAuthorities(payload), () => {});
  }
  destroy() { this.alive = false; ++this.sequence; }
}
