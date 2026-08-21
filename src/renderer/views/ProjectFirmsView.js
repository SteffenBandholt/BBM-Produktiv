function text(value) {
  return String(value == null ? "" : value).trim();
}

function firmLabel(firm) {
  const short = text(firm?.short);
  const name = text(firm?.name);
  if (short && name && short !== name) return `${short} · ${name}`;
  return short || name || "(ohne Name)";
}

function firmAddress(firm) {
  const street = text(firm?.street);
  const place = [text(firm?.zip), text(firm?.city)].filter(Boolean).join(" ");
  return [street, place].filter(Boolean).join(", ");
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
    padding: "7px 11px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  });
  return btn;
}

export default class ProjectFirmsView {
  constructor({ router, projectId, returnContext } = {}) {
    this.router = router || null;
    this.projectId = projectId || this.router?.currentProjectId || null;
    this.returnContext = returnContext || null;

    this.root = null;
    this.hostEl = null;
    this.msgEl = null;

    this.allGlobalFirms = [];
    this.projectCandidates = [];
    this.assignedGlobalFirms = [];
    this.legacyLocalFirms = [];
    this.loading = false;
  }

  _setMsg(value) {
    if (this.msgEl) this.msgEl.textContent = text(value);
  }

  async _backToProject() {
    if (typeof this.router?.showProjectWorkspace === "function" && this.projectId) {
      await this.router.showProjectWorkspace(this.projectId);
      return;
    }
    await this.router?.showProjects?.();
  }

  async _openFirmMaster() {
    await this.router?.showFirms?.();
  }

  async _loadData() {
    const api = window.bbmDb || {};
    if (!this.projectId) throw new Error("Projekt fehlt.");

    const [globalRes, projectRes] = await Promise.all([
      typeof api.firmsListGlobal === "function"
        ? api.firmsListGlobal()
        : Promise.resolve({ ok: false, error: "Firmenstamm nicht verfügbar." }),
      typeof api.projectFirmsListFirmCandidatesByProject === "function"
        ? api.projectFirmsListFirmCandidatesByProject(this.projectId)
        : Promise.resolve({ ok: false, error: "Projektfirmen nicht verfügbar." }),
    ]);

    if (!globalRes?.ok) throw new Error(globalRes?.error || "Firmenstamm konnte nicht geladen werden.");
    if (!projectRes?.ok) throw new Error(projectRes?.error || "Projektfirmen konnten nicht geladen werden.");

    this.allGlobalFirms = Array.isArray(globalRes.list) ? globalRes.list : [];
    this.projectCandidates = Array.isArray(projectRes.list) ? projectRes.list : [];
    this.assignedGlobalFirms = this.projectCandidates.filter((item) => item?.kind === "global_firm");
    this.legacyLocalFirms = this.projectCandidates.filter((item) => item?.kind === "project_firm");
  }

  _createFirmCard(firm) {
    const card = style(document.createElement("article"), {
      border: "1px solid #dfe5ec",
      borderRadius: "12px",
      background: "#fff",
      padding: "14px",
      display: "grid",
      gap: "6px",
      minHeight: "116px",
      boxSizing: "border-box",
    });

    const title = style(document.createElement("div"), {
      fontSize: "15px",
      fontWeight: "800",
      color: "#172033",
    });
    title.textContent = firmLabel(firm);

    const address = style(document.createElement("div"), {
      fontSize: "12px",
      color: "#667085",
      minHeight: "18px",
    });
    address.textContent = firmAddress(firm) || "Keine Adresse hinterlegt";

    const meta = style(document.createElement("div"), {
      fontSize: "11.5px",
      color: "#7b8493",
    });
    meta.textContent = [text(firm?.gewerk), text(firm?.email), text(firm?.phone)].filter(Boolean).join(" · ") || "Projektteilnehmer";

    const actions = style(document.createElement("div"), {
      display: "flex",
      gap: "8px",
      marginTop: "5px",
      flexWrap: "wrap",
    });

    const remove = button("Aus Projekt entfernen", { danger: true });
    remove.addEventListener("click", async () => {
      await this._unassignFirm(firm);
    });
    actions.append(remove);

    card.append(title, address, meta, actions);
    return card;
  }

  _renderAssigned(container) {
    container.innerHTML = "";

    if (!this.assignedGlobalFirms.length) {
      const empty = style(document.createElement("div"), {
        border: "1px dashed #cfd7e3",
        borderRadius: "12px",
        padding: "18px",
        color: "#667085",
        fontSize: "12.5px",
        background: "#fff",
      });
      empty.textContent = "Diesem Projekt ist noch keine zentrale Firma zugeordnet.";
      container.append(empty);
      return;
    }

    for (const firm of this.assignedGlobalFirms) container.append(this._createFirmCard(firm));
  }

  _renderLegacy(container) {
    container.innerHTML = "";
    if (!this.legacyLocalFirms.length) {
      container.style.display = "none";
      return;
    }

    container.style.display = "block";
    const box = style(document.createElement("section"), {
      marginTop: "20px",
      border: "1px solid #f3c37a",
      borderRadius: "12px",
      background: "#fffaf0",
      padding: "14px",
    });

    const title = style(document.createElement("div"), {
      fontWeight: "800",
      color: "#8a5200",
      marginBottom: "6px",
    });
    title.textContent = "Altbestand: lokale Projektfirmen";

    const hint = style(document.createElement("div"), {
      fontSize: "12px",
      lineHeight: "1.45",
      color: "#8a6430",
      marginBottom: "10px",
    });
    hint.textContent = "Diese Firmen stammen aus der alten Projekt-Firmenwelt. Sie bleiben sichtbar, werden aber nicht mehr neu angelegt. Die Migration in den zentralen Firmenstamm erfolgt kontrolliert in einem folgenden Schritt.";

    const list = style(document.createElement("div"), {
      display: "grid",
      gap: "7px",
    });
    for (const firm of this.legacyLocalFirms) {
      const row = style(document.createElement("div"), {
        background: "#fff",
        border: "1px solid #f0d8b2",
        borderRadius: "8px",
        padding: "8px 10px",
        fontSize: "12px",
        color: "#5d4930",
      });
      row.textContent = firmLabel(firm);
      list.append(row);
    }

    box.append(title, hint, list);
    container.append(box);
  }

  async _openAssignDialog() {
    const assignedIds = new Set(this.assignedGlobalFirms.map((firm) => String(firm?.id || "")));
    const available = this.allGlobalFirms.filter((firm) => !assignedIds.has(String(firm?.id || "")));

    if (!available.length) {
      alert("Alle Firmen aus dem Firmenstamm sind diesem Projekt bereits zugeordnet.");
      return;
    }

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

    const title = style(document.createElement("div"), {
      fontSize: "18px",
      fontWeight: "850",
      color: "#172033",
    });
    title.textContent = "Firma aus Firmenstamm zuordnen";

    const hint = style(document.createElement("div"), {
      fontSize: "12px",
      color: "#667085",
    });
    hint.textContent = "Die Firma bleibt einmalig im zentralen Firmenstamm. Hier wird nur die Projektzuordnung gespeichert.";

    const select = document.createElement("select");
    style(select, {
      width: "100%",
      minHeight: "40px",
      border: "1px solid #cfd7e3",
      borderRadius: "8px",
      padding: "0 9px",
      fontSize: "13px",
      background: "#fff",
    });
    for (const firm of available) {
      const option = document.createElement("option");
      option.value = String(firm?.id || "");
      option.textContent = firmLabel(firm);
      select.append(option);
    }

    const actions = style(document.createElement("div"), {
      display: "flex",
      justifyContent: "space-between",
      gap: "8px",
      marginTop: "4px",
    });

    const openMaster = button("Firmenstamm öffnen");
    const cancel = button("Abbrechen");
    const assign = button("Zuordnen", { primary: true });

    const close = () => overlay.remove();
    cancel.addEventListener("click", close);
    overlay.addEventListener("mousedown", (event) => {
      if (event.target === overlay) close();
    });
    openMaster.addEventListener("click", async () => {
      close();
      await this._openFirmMaster();
    });
    assign.addEventListener("click", async () => {
      const firmId = text(select.value);
      if (!firmId) return;
      assign.disabled = true;
      const api = window.bbmDb || {};
      const res = await api.projectFirmsAssignGlobalFirm?.({ projectId: this.projectId, firmId });
      if (!res?.ok) {
        assign.disabled = false;
        alert(res?.error || "Firma konnte nicht zugeordnet werden.");
        return;
      }
      close();
      await this.reload();
    });

    const right = style(document.createElement("div"), { display: "flex", gap: "8px" });
    right.append(cancel, assign);
    actions.append(openMaster, right);
    modal.append(title, hint, select, actions);
    overlay.append(modal);
    document.body.append(overlay);
  }

  async _unassignFirm(firm) {
    const api = window.bbmDb || {};
    const firmId = text(firm?.id);
    if (!firmId) return;

    if (typeof api.projectFirmsCanDeactivate === "function") {
      const check = await api.projectFirmsCanDeactivate({ projectId: this.projectId, firmId });
      if (check?.ok && check?.result?.canDeactivate === false) {
        alert(`Firma kann derzeit nicht aus dem Projekt entfernt werden. Es bestehen noch ${Number(check?.result?.count || 0)} Verknüpfung(en).`);
        return;
      }
    }

    if (!confirm(`${firmLabel(firm)} aus diesem Projekt entfernen?\n\nDie Firma bleibt im zentralen Firmenstamm erhalten.`)) return;

    const res = await api.projectFirmsUnassignGlobalFirm?.({ projectId: this.projectId, firmId });
    if (!res?.ok) {
      alert(res?.error || "Projektzuordnung konnte nicht entfernt werden.");
      return;
    }
    await this.reload();
  }

  _renderContent() {
    if (!this.hostEl) return;
    this.hostEl.innerHTML = "";

    const toolbar = style(document.createElement("div"), {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      marginBottom: "14px",
    });
    const assign = button("Firma zuordnen", { primary: true });
    const master = button("Firmenstamm öffnen");
    assign.addEventListener("click", () => this._openAssignDialog());
    master.addEventListener("click", () => this._openFirmMaster());
    toolbar.append(assign, master);

    const title = style(document.createElement("div"), {
      fontSize: "14px",
      fontWeight: "800",
      color: "#172033",
      marginBottom: "8px",
    });
    title.textContent = "Zugeordnete Firmen";

    const grid = style(document.createElement("div"), {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      gap: "10px",
    });
    this._renderAssigned(grid);

    const legacy = document.createElement("div");
    this._renderLegacy(legacy);

    this.hostEl.append(toolbar, title, grid, legacy);
  }

  render() {
    const root = style(document.createElement("div"), {
      minHeight: "100%",
      padding: "18px clamp(16px, 2.5vw, 30px)",
      boxSizing: "border-box",
      background: "#f4f6f9",
      color: "#172033",
    });

    const head = style(document.createElement("div"), {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "14px",
    });
    const back = button("← Projekt");
    back.addEventListener("click", () => this._backToProject());

    const title = style(document.createElement("h2"), {
      margin: "0",
      fontSize: "20px",
      fontWeight: "850",
    });
    title.textContent = "Firmen im Projekt";

    const msg = style(document.createElement("div"), {
      marginLeft: "auto",
      fontSize: "11px",
      color: "#8a94a5",
    });

    head.append(back, title, msg);
    const host = document.createElement("div");
    root.append(head, host);

    this.root = root;
    this.hostEl = host;
    this.msgEl = msg;
    this._renderContent();
    return root;
  }

  async reload() {
    if (this.loading) return;
    this.loading = true;
    this._setMsg("Lade ...");
    try {
      await this._loadData();
      this._renderContent();
    } catch (error) {
      console.error("[ProjectFirmsView] load failed", error);
      alert(error?.message || "Firmen im Projekt konnten nicht geladen werden.");
    } finally {
      this.loading = false;
      this._setMsg("");
    }
  }

  async load() {
    await this.reload();
  }
}
