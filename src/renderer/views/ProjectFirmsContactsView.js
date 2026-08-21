import ProjectFirmsView from "./ProjectFirmsView.js";

function text(value) {
  return String(value == null ? "" : value).trim();
}

function personName(person) {
  return [text(person?.first_name), text(person?.last_name)].filter(Boolean).join(" ") || "(ohne Name)";
}

function style(el, values = {}) {
  Object.assign(el.style, values);
  return el;
}

function button(label, { primary = false, danger = false } = {}) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  style(btn, {
    border: danger ? "1px solid #dc2626" : primary ? "1px solid #2563eb" : "1px solid #d0d7e2",
    borderRadius: "8px",
    background: danger ? "#fff" : primary ? "#2563eb" : "#fff",
    color: danger ? "#b91c1c" : primary ? "#fff" : "#344054",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  });
  return btn;
}

export default class ProjectFirmsContactsView extends ProjectFirmsView {
  _renderDetails(container) {
    super._renderDetails(container);

    if (this.selectedEntry?.kind !== "project") return;
    const firm = this.selectedEntry?.firm || null;
    if (!firm) return;

    const card = container.querySelector("section");
    if (!card) return;

    const contacts = this.contactsByKey.get(`project:${text(firm?.id)}`) || [];
    const children = Array.from(card.children || []);
    const contactTitle = children.find((el) => text(el?.textContent) === "Ansprechpartner") || null;
    const actions = children[children.length - 1] || null;

    if (contactTitle) {
      const titleRow = style(document.createElement("div"), {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
      });
      const titleCopy = style(document.createElement("div"), {
        fontSize: "12px",
        fontWeight: "850",
        color: "#344054",
      });
      titleCopy.textContent = "Ansprechpartner";
      const add = button("+ Ansprechpartner");
      add.addEventListener("click", () => this._openProjectPersonEditor(firm));
      titleRow.append(titleCopy, add);
      card.replaceChild(titleRow, contactTitle);
    }

    if (!contacts.length) return;

    const updatedChildren = Array.from(card.children || []);
    const contactList = updatedChildren.find((el) => {
      if (el === actions) return false;
      const directRows = Array.from(el?.children || []);
      return directRows.length === contacts.length && directRows.every((row) => row?.tagName === "DIV");
    });
    if (!contactList) return;

    const rows = Array.from(contactList.children || []);
    rows.forEach((row, index) => {
      const person = contacts[index];
      if (!person) return;
      row.style.gridTemplateColumns = "minmax(0, 1fr) auto";
      row.style.alignItems = "center";

      const content = document.createElement("div");
      while (row.firstChild) content.append(row.firstChild);
      const edit = button("Bearbeiten");
      edit.addEventListener("click", () => this._openProjectPersonEditor(firm, person));
      row.append(content, edit);
    });
  }

  async _openProjectPersonEditor(firm, person = null) {
    const api = window.bbmDb || {};
    const editing = !!person;

    const overlay = style(document.createElement("div"), {
      position: "fixed",
      inset: "0",
      background: "rgba(15,23,42,.38)",
      display: "grid",
      placeItems: "center",
      zIndex: "10000",
      padding: "20px",
    });

    const modal = style(document.createElement("div"), {
      width: "min(560px, calc(100vw - 40px))",
      maxHeight: "calc(100vh - 40px)",
      overflow: "auto",
      background: "#fff",
      borderRadius: "14px",
      boxShadow: "0 22px 60px rgba(15,23,42,.22)",
      padding: "18px",
      display: "grid",
      gap: "12px",
    });

    const title = style(document.createElement("div"), {
      fontSize: "18px",
      fontWeight: "850",
      color: "#172033",
    });
    title.textContent = editing ? "Ansprechpartner bearbeiten" : "Ansprechpartner anlegen";

    const hint = style(document.createElement("div"), {
      fontSize: "11.5px",
      color: "#667085",
      lineHeight: "1.4",
    });
    hint.textContent = `Gehört nur zur Projektfirma „${text(firm?.name) || text(firm?.short) || "Projektfirma"}“ in diesem Projekt.`;

    const grid = style(document.createElement("div"), {
      display: "grid",
      gridTemplateColumns: "130px minmax(0, 1fr)",
      gap: "8px 10px",
      alignItems: "center",
    });

    const fields = {};
    const defs = [
      ["firstName", "Vorname", person?.first_name],
      ["lastName", "Nachname", person?.last_name],
      ["funktion", "Funktion", person?.funktion || person?.rolle],
      ["email", "E-Mail", person?.email],
      ["phone", "Telefon", person?.phone],
    ];

    for (const [key, labelText, initial] of defs) {
      const label = style(document.createElement("label"), {
        fontSize: "11.5px",
        color: "#475467",
        fontWeight: "700",
      });
      label.textContent = labelText;
      const input = document.createElement("input");
      input.value = text(initial);
      style(input, {
        width: "100%",
        minHeight: "36px",
        border: "1px solid #cfd7e3",
        borderRadius: "8px",
        padding: "0 9px",
        boxSizing: "border-box",
        fontSize: "12px",
      });
      fields[key] = input;
      grid.append(label, input);
    }

    const actions = style(document.createElement("div"), {
      display: "flex",
      justifyContent: "space-between",
      gap: "8px",
      flexWrap: "wrap",
    });
    const left = document.createElement("div");
    const right = style(document.createElement("div"), { display: "flex", gap: "8px" });
    const cancel = button("Abbrechen");
    const save = button("Speichern", { primary: true });
    right.append(cancel, save);

    let remove = null;
    if (editing) {
      remove = button("Löschen", { danger: true });
      left.append(remove);
    }
    actions.append(left, right);

    modal.append(title, hint, grid, actions);
    overlay.append(modal);
    document.body.append(overlay);

    const close = () => overlay.remove();
    cancel.addEventListener("click", close);
    overlay.addEventListener("mousedown", (event) => {
      if (event.target === overlay) close();
    });

    save.addEventListener("click", async () => {
      const firstName = text(fields.firstName.value);
      const lastName = text(fields.lastName.value);
      if (!firstName && !lastName) {
        alert("Bitte mindestens Vor- oder Nachname eintragen.");
        fields.firstName.focus();
        return;
      }

      save.disabled = true;
      const funktion = text(fields.funktion.value);
      const payload = {
        firstName,
        lastName,
        funktion,
        email: text(fields.email.value),
        phone: text(fields.phone.value),
        rolle: funktion,
        notes: text(person?.notes),
      };

      const res = editing
        ? await api.projectPersonsUpdate?.({
            projectPersonId: person.id,
            patch: {
              first_name: payload.firstName,
              last_name: payload.lastName,
              funktion: payload.funktion,
              email: payload.email,
              phone: payload.phone,
              rolle: payload.rolle,
              notes: payload.notes,
            },
          })
        : await api.projectPersonsCreate?.({
            projectFirmId: firm.id,
            ...payload,
          });

      if (!res?.ok) {
        save.disabled = false;
        alert(res?.error || "Ansprechpartner konnte nicht gespeichert werden.");
        return;
      }

      close();
      await this.reload();
    });

    remove?.addEventListener("click", async () => {
      if (!confirm(`${personName(person)} wirklich löschen?`)) return;
      remove.disabled = true;
      const res = await api.projectPersonsDelete?.(person.id);
      if (!res?.ok) {
        remove.disabled = false;
        alert(res?.error || "Ansprechpartner konnte nicht gelöscht werden.");
        return;
      }
      close();
      await this.reload();
    });

    setTimeout(() => fields.firstName.focus(), 0);
  }
}
