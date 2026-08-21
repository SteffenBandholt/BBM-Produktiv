import ProjectFirmsBaseView from "./ProjectFirmsBaseView.js";

const PROJECT_USAGE = "project_participant";

function text(value) {
  return String(value == null ? "" : value).trim();
}

function hasProjectUsage(firm) {
  const usages = Array.isArray(firm?.usages) ? firm.usages : [];
  return usages.map((value) => text(value)).includes(PROJECT_USAGE);
}

function firmName(firm) {
  return text(firm?.name) || text(firm?.short) || "(ohne Name)";
}

function firmSecondary(firm) {
  return text(firm?.gewerk) || text(firm?.name2) || "";
}

function personName(person) {
  return [text(person?.first_name), text(person?.last_name)].filter(Boolean).join(" ") || "(ohne Name)";
}

function personRole(person) {
  return text(person?.rolle) || text(person?.funktion) || "";
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
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  });
  return btn;
}

export default class ProjectFirmsView extends ProjectFirmsBaseView {
  constructor(args = {}) {
    super(args);
    this.projectLocalFirms = [];
    this.contactsByKey = new Map();
    this.selectedEntry = null;
  }

  async _loadData() {
    await super._loadData();

    this.projectLocalFirms = (this.projectCandidates || []).filter((item) => item?.kind === "project_firm");
    this.allGlobalFirms = (this.allGlobalFirms || []).filter((firm) => hasProjectUsage(firm));

    const api = window.bbmDb || {};
    this.contactsByKey = new Map();

    const globalLoads = (this.assignedGlobalFirms || []).map(async (firm) => {
      const firmId = text(firm?.id);
      if (!firmId || typeof api.personsListByFirm !== "function") return;
      try {
        const res = await api.personsListByFirm(firmId);
        this.contactsByKey.set(`global:${firmId}`, res?.ok && Array.isArray(res.list) ? res.list : []);
      } catch (_error) {
        this.contactsByKey.set(`global:${firmId}`, []);
      }
    });

    const localLoads = this.projectLocalFirms.map(async (firm) => {
      const firmId = text(firm?.id);
      if (!firmId || typeof api.projectPersonsListByProjectFirm !== "function") return;
      try {
        const res = await api.projectPersonsListByProjectFirm(firmId);
        this.contactsByKey.set(`project:${firmId}`, res?.ok && Array.isArray(res.list) ? res.list : []);
      } catch (_error) {
        this.contactsByKey.set(`project:${firmId}`, []);
      }
    });

    await Promise.all([...globalLoads, ...localLoads]);

    if (this.selectedEntry) {
      const pool = this.selectedEntry.kind === "project" ? this.projectLocalFirms : this.assignedGlobalFirms;
      const current = pool.find((firm) => text(firm?.id) === text(this.selectedEntry?.firm?.id));
      this.selectedEntry = current ? { ...this.selectedEntry, firm: current } : null;
    }
  }

  _makeTypeBadge(kind) {
    const badge = document.createElement("span");
    const isProject = kind === "project";
    badge.textContent = isProject ? "Projekt" : "Firmenstamm";
    style(badge, {
      display: "inline-flex",
      alignItems: "center",
      minHeight: "20px",
      padding: "0 7px",
      borderRadius: "999px",
      background: isProject ? "#f2f4f7" : "#eef4ff",
      color: isProject ? "#475467" : "#175cd3",
      fontSize: "10px",
      fontWeight: "750",
      whiteSpace: "nowrap",
    });
    return badge;
  }

  _createFirmRow(firm, kind) {
    const row = document.createElement("button");
    row.type = "button";
    const selected = this.selectedEntry?.kind === kind && text(this.selectedEntry?.firm?.id) === text(firm?.id);
    style(row, {
      width: "100%",
      border: selected ? "1px solid #84adff" : "1px solid transparent",
      borderBottom: "1px solid #edf0f4",
      background: selected ? "#eef4ff" : "#fff",
      padding: "10px 12px",
      display: "grid",
      gridTemplateColumns: "minmax(190px, 1.8fr) minmax(140px, 1fr) auto",
      gap: "12px",
      alignItems: "center",
      textAlign: "left",
      cursor: "pointer",
      color: "#172033",
    });

    const name = style(document.createElement("div"), {
      fontSize: "12.5px",
      fontWeight: "800",
      minWidth: "0",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });
    name.textContent = firmName(firm);

    const secondary = style(document.createElement("div"), {
      fontSize: "11.5px",
      color: "#667085",
      minWidth: "0",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });
    secondary.textContent = firmSecondary(firm) || "–";

    row.append(name, secondary, this._makeTypeBadge(kind));
    row.addEventListener("click", () => {
      this.selectedEntry = { kind, firm };
      this._renderContent();
    });
    return row;
  }

  _createSection(titleText, firms, kind, emptyText) {
    const section = style(document.createElement("section"), {
      background: "#fff",
      border: "1px solid #dfe5ec",
      borderRadius: "12px",
      overflow: "hidden",
    });

    const head = style(document.createElement("div"), {
      padding: "10px 12px",
      borderBottom: "1px solid #e7ebf0",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    });
    const title = style(document.createElement("div"), {
      fontSize: "13px",
      fontWeight: "850",
      color: "#172033",
    });
    title.textContent = titleText;
    const count = style(document.createElement("span"), {
      fontSize: "10.5px",
      color: "#667085",
    });
    count.textContent = `${firms.length}`;
    head.append(title, count);
    section.append(head);

    if (!firms.length) {
      const empty = style(document.createElement("div"), {
        padding: "14px 12px",
        fontSize: "11.5px",
        color: "#98a2b3",
      });
      empty.textContent = emptyText;
      section.append(empty);
      return section;
    }

    for (const firm of firms) section.append(this._createFirmRow(firm, kind));
    return section;
  }

  _renderDetails(container) {
    container.innerHTML = "";
    if (!this.selectedEntry) {
      const empty = style(document.createElement("div"), {
        border: "1px dashed #cfd7e3",
        borderRadius: "12px",
        padding: "22px",
        color: "#667085",
        fontSize: "12px",
        lineHeight: "1.5",
        background: "#fff",
      });
      empty.innerHTML = "<strong>Firma auswählen</strong><br>Details und Ansprechpartner erscheinen hier.";
      container.append(empty);
      return;
    }

    const { kind, firm } = this.selectedEntry;
    const card = style(document.createElement("section"), {
      border: "1px solid #dfe5ec",
      borderRadius: "12px",
      background: "#fff",
      padding: "14px",
      display: "grid",
      gap: "10px",
    });

    const titleRow = style(document.createElement("div"), {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "10px",
    });
    const title = style(document.createElement("div"), {
      fontSize: "16px",
      fontWeight: "850",
      color: "#172033",
    });
    title.textContent = firmName(firm);
    titleRow.append(title, this._makeTypeBadge(kind));

    const addressParts = [text(firm?.street), [text(firm?.zip), text(firm?.city)].filter(Boolean).join(" ")].filter(Boolean);
    const details = style(document.createElement("div"), {
      fontSize: "11.5px",
      color: "#667085",
      lineHeight: "1.55",
    });
    const detailLines = [
      firmSecondary(firm),
      addressParts.join(", "),
      text(firm?.email),
      text(firm?.phone),
    ].filter(Boolean);
    details.textContent = detailLines.join(" · ") || "Keine weiteren Firmendaten hinterlegt";

    const divider = style(document.createElement("div"), { borderTop: "1px solid #edf0f4" });
    const contactTitle = style(document.createElement("div"), {
      fontSize: "12px",
      fontWeight: "850",
      color: "#344054",
    });
    contactTitle.textContent = "Ansprechpartner";

    card.append(titleRow, details, divider, contactTitle);

    const key = `${kind}:${text(firm?.id)}`;
    const contacts = this.contactsByKey.get(key) || [];
    if (!contacts.length) {
      const none = style(document.createElement("div"), {
        fontSize: "11px",
        color: "#98a2b3",
      });
      none.textContent = "Keine Ansprechpartner hinterlegt";
      card.append(none);
    } else {
      const list = style(document.createElement("div"), { display: "grid", gap: "5px" });
      for (const person of contacts) {
        const row = style(document.createElement("div"), {
          background: "#f8fafc",
          border: "1px solid #edf0f4",
          borderRadius: "8px",
          padding: "7px 8px",
          display: "grid",
          gap: "2px",
        });
        const top = style(document.createElement("div"), { display: "flex", gap: "6px", flexWrap: "wrap" });
        const name = style(document.createElement("span"), { fontSize: "11.5px", fontWeight: "800" });
        name.textContent = personName(person);
        top.append(name);
        const role = personRole(person);
        if (role) {
          const roleEl = style(document.createElement("span"), { fontSize: "10.5px", color: "#667085" });
          roleEl.textContent = role;
          top.append(roleEl);
        }
        row.append(top);
        const contact = [text(person?.email), text(person?.phone)].filter(Boolean).join(" · ");
        if (contact) {
          const c = style(document.createElement("div"), { fontSize: "10.5px", color: "#667085", overflowWrap: "anywhere" });
          c.textContent = contact;
          row.append(c);
        }
        list.append(row);
      }
      card.append(list);
    }

    const actions = style(document.createElement("div"), {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      marginTop: "4px",
      paddingTop: "10px",
      borderTop: "1px solid #edf0f4",
    });

    if (kind === "global") {
      const remove = button("Zuordnung entfernen", { danger: true });
      remove.addEventListener("click", async () => {
        await this._unassignFirm(firm);
        this.selectedEntry = null;
      });
      actions.append(remove);
    } else {
      const edit = button("Bearbeiten");
      edit.addEventListener("click", () => this._openProjectFirmEditor(firm));
      const remove = button("Projektfirma löschen", { danger: true });
      remove.addEventListener("click", async () => this._deleteProjectFirm(firm));
      actions.append(edit, remove);
    }

    card.append(actions);
    container.append(card);
  }

  async _openProjectFirmEditor(firm = null) {
    const api = window.bbmDb || {};
    const editing = !!firm;

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
      width: "min(620px, calc(100vw - 40px))",
      maxHeight: "calc(100vh - 40px)",
      overflow: "auto",
      background: "#fff",
      borderRadius: "14px",
      boxShadow: "0 22px 60px rgba(15,23,42,.22)",
      padding: "18px",
      display: "grid",
      gap: "12px",
    });
    const title = style(document.createElement("div"), { fontSize: "18px", fontWeight: "850" });
    title.textContent = editing ? "Projektfirma bearbeiten" : "Projektfirma anlegen";
    const hint = style(document.createElement("div"), { fontSize: "11.5px", color: "#667085" });
    hint.textContent = "Diese Firma gilt nur in diesem Projekt und erscheint nicht im zentralen Firmenstamm.";

    const grid = style(document.createElement("div"), {
      display: "grid",
      gridTemplateColumns: "150px minmax(0, 1fr)",
      gap: "8px 10px",
      alignItems: "center",
    });

    const fields = {};
    const defs = [
      ["name", "Name 1", firm?.name],
      ["name2", "Name 2", firm?.name2],
      ["short", "Kurzbezeichnung", firm?.short],
      ["gewerk", "Funktion / Gewerk", firm?.gewerk],
      ["street", "Straße", firm?.street],
      ["zip", "PLZ", firm?.zip],
      ["city", "Ort", firm?.city],
      ["email", "E-Mail", firm?.email],
      ["phone", "Telefon", firm?.phone],
    ];
    for (const [key, labelText, initial] of defs) {
      const label = style(document.createElement("label"), { fontSize: "11.5px", color: "#475467", fontWeight: "700" });
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

    const actions = style(document.createElement("div"), { display: "flex", justifyContent: "flex-end", gap: "8px" });
    const cancel = button("Abbrechen");
    const save = button("Speichern", { primary: true });
    actions.append(cancel, save);
    modal.append(title, hint, grid, actions);
    overlay.append(modal);
    document.body.append(overlay);

    const close = () => overlay.remove();
    cancel.addEventListener("click", close);
    overlay.addEventListener("mousedown", (event) => { if (event.target === overlay) close(); });
    save.addEventListener("click", async () => {
      const name = text(fields.name.value);
      if (!name) {
        alert("Name 1 ist Pflicht.");
        fields.name.focus();
        return;
      }
      save.disabled = true;
      const payload = {
        projectId: this.projectId,
        short: text(fields.short.value),
        name,
        name2: text(fields.name2.value),
        street: text(fields.street.value),
        zip: text(fields.zip.value),
        city: text(fields.city.value),
        phone: text(fields.phone.value),
        email: text(fields.email.value),
        gewerk: text(fields.gewerk.value),
        role_code: text(firm?.role_code) || "60",
        notes: text(firm?.notes),
      };

      const res = editing && typeof api.projectFirmsUpdate === "function"
        ? await api.projectFirmsUpdate({ projectFirmId: firm.id, patch: payload })
        : await api.projectFirmsCreate?.(payload);
      if (!res?.ok) {
        save.disabled = false;
        alert(res?.error || "Projektfirma konnte nicht gespeichert werden.");
        return;
      }
      close();
      this.selectedEntry = null;
      await this.reload();
    });
    setTimeout(() => fields.name.focus(), 0);
  }

  async _deleteProjectFirm(firm) {
    const api = window.bbmDb || {};
    if (!confirm(`${firmName(firm)} wirklich aus diesem Projekt löschen?`)) return;
    const res = await api.projectFirmsDelete?.(firm?.id);
    if (!res?.ok) {
      alert(res?.error || "Projektfirma konnte nicht gelöscht werden.");
      return;
    }
    this.selectedEntry = null;
    await this.reload();
  }

  _renderContent() {
    if (!this.hostEl) return;
    this.hostEl.innerHTML = "";

    const intro = style(document.createElement("div"), {
      fontSize: "12px",
      color: "#667085",
      marginBottom: "12px",
    });
    intro.textContent = "Projektfirmen gelten nur hier. Firmen aus dem Firmenstamm können zusätzlich zugeordnet werden.";

    const toolbar = style(document.createElement("div"), {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      marginBottom: "14px",
    });
    const addLocal = button("+ Projektfirma anlegen", { primary: true });
    addLocal.addEventListener("click", () => this._openProjectFirmEditor());
    const assignGlobal = button("Aus Firmenstamm zuordnen");
    assignGlobal.addEventListener("click", () => this._openAssignDialog());
    toolbar.append(addLocal, assignGlobal);

    const layout = style(document.createElement("div"), {
      display: "grid",
      gridTemplateColumns: "minmax(520px, 1.65fr) minmax(300px, .85fr)",
      gap: "14px",
      alignItems: "start",
    });

    const lists = style(document.createElement("div"), { display: "grid", gap: "12px", minWidth: "0" });
    lists.append(
      this._createSection("Projektfirmen", this.projectLocalFirms, "project", "Noch keine reine Projektfirma angelegt."),
      this._createSection("Firmen aus dem Firmenstamm", this.assignedGlobalFirms, "global", "Noch keine Firma aus dem Firmenstamm zugeordnet.")
    );

    const detail = document.createElement("div");
    this._renderDetails(detail);
    layout.append(lists, detail);

    this.hostEl.append(intro, toolbar, layout);
  }
}
