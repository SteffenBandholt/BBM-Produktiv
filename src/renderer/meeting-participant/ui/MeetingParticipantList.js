import {
  getMeetingParticipantDisplayLabel,
  normalizeMeetingParticipantList,
} from "../meetingParticipantModel.js";
import { mkEl } from "./dom.js";

export class MeetingParticipantList {
  constructor({
    documentRef,
    onRemove,
    onToggleActive,
    onToggleInvited,
  } = {}) {
    this.documentRef = documentRef || window.document;
    this._onRemove = typeof onRemove === "function" ? onRemove : null;
    this._onToggleActive = typeof onToggleActive === "function" ? onToggleActive : null;
    this._onToggleInvited = typeof onToggleInvited === "function" ? onToggleInvited : null;
    this._participants = [];
    this._readOnly = false;
    this._build();
  }

  _build() {
    const doc = this.documentRef;
    this.root = mkEl(doc, "section", "meeting-participant-list");
    this.root.setAttribute("data-component", "meeting-participant-list");

    const title = mkEl(doc, "div", "meeting-participant-list-title", "Teilnehmerliste");
    this.table = mkEl(doc, "table", "meeting-participant-list-table");
    this.table.style.width = "100%";
    this.table.style.borderCollapse = "collapse";
    this.tableHead = mkEl(doc, "thead", "meeting-participant-list-table-head");
    this.tableHead.innerHTML =
      "<tr>" +
      '<th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Teilnehmer</th>' +
      '<th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Firma</th>' +
      '<th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Funktion</th>' +
      '<th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Kontakt</th>' +
      '<th style="text-align:center;padding:6px;border-bottom:1px solid #ddd;width:80px;">Aktiv</th>' +
      '<th style="text-align:center;padding:6px;border-bottom:1px solid #ddd;width:80px;">Invited</th>' +
      '<th style="text-align:center;padding:6px;border-bottom:1px solid #ddd;width:110px;">Aktion</th>' +
      "</tr>";

    this.tableBody = mkEl(doc, "tbody", "meeting-participant-list-table-body");
    this.table.append(this.tableHead, this.tableBody);

    this.root.append(title, this.table);
    this._render();
  }

  _render() {
    const participants = normalizeMeetingParticipantList(this._participants);
    this.tableBody.innerHTML = "";

    for (const participant of participants) {
      const tr = this.documentRef.createElement("tr");

      const tdName = this.documentRef.createElement("td");
      tdName.style.padding = "6px";
      tdName.style.borderBottom = "1px solid #eee";
      tdName.textContent = getMeetingParticipantDisplayLabel(participant);

      const tdCompany = this.documentRef.createElement("td");
      tdCompany.style.padding = "6px";
      tdCompany.style.borderBottom = "1px solid #eee";
      tdCompany.textContent = participant.companyLabel || "-";

      const tdRole = this.documentRef.createElement("td");
      tdRole.style.padding = "6px";
      tdRole.style.borderBottom = "1px solid #eee";
      tdRole.textContent = participant.role || "-";

      const tdContact = this.documentRef.createElement("td");
      tdContact.style.padding = "6px";
      tdContact.style.borderBottom = "1px solid #eee";
      tdContact.textContent = participant.email || participant.phone || "-";

      const tdActive = this.documentRef.createElement("td");
      tdActive.style.padding = "6px";
      tdActive.style.borderBottom = "1px solid #eee";
      tdActive.style.textAlign = "center";
      const activeCheckbox = this.documentRef.createElement("input");
      activeCheckbox.type = "checkbox";
      activeCheckbox.checked = Boolean(participant.active);
      activeCheckbox.disabled = this._readOnly;
      activeCheckbox.addEventListener("change", () => {
        if (this._onToggleActive) this._onToggleActive(participant, Boolean(activeCheckbox.checked));
      });
      tdActive.appendChild(activeCheckbox);

      const tdInvited = this.documentRef.createElement("td");
      tdInvited.style.padding = "6px";
      tdInvited.style.borderBottom = "1px solid #eee";
      tdInvited.style.textAlign = "center";
      const invitedCheckbox = this.documentRef.createElement("input");
      invitedCheckbox.type = "checkbox";
      invitedCheckbox.checked = Boolean(participant.invited);
      invitedCheckbox.disabled = this._readOnly;
      invitedCheckbox.addEventListener("change", () => {
        if (this._onToggleInvited) this._onToggleInvited(participant, Boolean(invitedCheckbox.checked));
      });
      tdInvited.appendChild(invitedCheckbox);

      const tdAction = this.documentRef.createElement("td");
      tdAction.style.padding = "6px";
      tdAction.style.borderBottom = "1px solid #eee";
      tdAction.style.textAlign = "center";
      const removeBtn = this.documentRef.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "Entfernen";
      removeBtn.disabled = this._readOnly;
      removeBtn.style.opacity = this._readOnly ? "0.55" : "1";
      removeBtn.addEventListener("click", () => {
        if (this._readOnly) return;
        if (this._onRemove) this._onRemove(participant);
      });
      tdAction.appendChild(removeBtn);

      tr.append(tdName, tdCompany, tdRole, tdContact, tdActive, tdInvited, tdAction);
      this.tableBody.appendChild(tr);
    }

    if (!participants.length) {
      const tr = this.documentRef.createElement("tr");
      const td = this.documentRef.createElement("td");
      td.colSpan = 7;
      td.style.padding = "8px 6px";
      td.style.fontSize = "12px";
      td.style.opacity = "0.75";
      td.textContent = "Noch keine Besprechungsteilnehmer ausgewählt.";
      tr.appendChild(td);
      this.tableBody.appendChild(tr);
    }
  }

  getElement() {
    return this.root;
  }

  mount(container) {
    if (!container) return;
    container.appendChild(this.root);
  }

  setReadOnly(readOnly) {
    this._readOnly = Boolean(readOnly);
    this._render();
  }

  setParticipants(participants) {
    this._participants = normalizeMeetingParticipantList(participants);
    this._render();
  }

  onRemove(callback) {
    this._onRemove = typeof callback === "function" ? callback : null;
  }

  onToggleActive(callback) {
    this._onToggleActive = typeof callback === "function" ? callback : null;
  }

  onToggleInvited(callback) {
    this._onToggleInvited = typeof callback === "function" ? callback : null;
  }
}

