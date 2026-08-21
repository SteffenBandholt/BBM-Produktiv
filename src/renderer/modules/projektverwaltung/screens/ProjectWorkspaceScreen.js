import { openProtocolSettingsModal } from "../../protokoll/ProtocolSettingsModal.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function getProjectNumber(project) {
  return normalizeText(
    project?.project_number ?? project?.projectNumber ?? project?.nummer ?? project?.number ?? ""
  );
}

function getProjectName(project) {
  const short = normalizeText(project?.short);
  const name = normalizeText(project?.name ?? project?.project_name ?? project?.title);
  return short || name;
}

function getProjectTitle(project, fallbackProjectId = null) {
  const number = getProjectNumber(project);
  const name = getProjectName(project);
  if (number && name) return `${number} - ${name}`;
  if (number) return number;
  if (name) return name;
  return fallbackProjectId ? `#${fallbackProjectId}` : "Projekt";
}

function projectAddress(project) {
  const street = normalizeText(project?.street);
  const zip = normalizeText(project?.zip);
  const city = normalizeText(project?.city);
  const place = [zip, city].filter(Boolean).join(" ");
  return [street, place].filter(Boolean).join(", ");
}

function setStyles(el, styles = {}) {
  Object.assign(el.style, styles);
  return el;
}

const MODULE_STYLE = Object.freeze({
  protokoll: { color: "#22c55e", icon: "protocol" },
  restarbeiten: { color: "#f59e0b", icon: "rest" },
  projectFirms: { color: "#475569", icon: "firms" },
});

const ICONS = Object.freeze({
  protocol: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="7" width="28" height="34" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><path d="M17 17h14M17 24h14M17 31h9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  rest: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 7 42 39H6L24 7Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M24 18v10M24 34h.01" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  firms: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 40V17h18v23M26 25h14v15M14 23h5M14 29h5M14 35h5M32 31h3M32 36h3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
});

function groupProjectModules(items = []) {
  const groups = [];
  const byModule = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const moduleId = normalizeText(item?.moduleId);
    if (!moduleId) continue;

    if (moduleId === "projectFirms") {
      groups.push({
        moduleId,
        label: "Firmen im Projekt",
        description: item?.description || "Projektbeteiligte und Firmen verwalten.",
        entries: [item],
      });
      continue;
    }

    let group = byModule.get(moduleId);
    if (!group) {
      group = {
        moduleId,
        label: normalizeText(item?.label) || moduleId,
        description: normalizeText(item?.description),
        entries: [],
      };
      byModule.set(moduleId, group);
      groups.push(group);
    }
    group.entries.push(item);
  }

  return groups;
}

export default class ProjectWorkspaceScreen {
  constructor({ router, projectId, project, projectModules } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;
    this.projectModules = Array.isArray(projectModules) ? projectModules : [];
    this.root = null;
    this.hostEl = null;
    this.msgEl = null;
    this.loading = false;
    this.projectMissing = false;
  }

  getAvailableProjectModules() {
    return this.projectModules;
  }

  getProjectDisplayText() {
    return getProjectTitle(this.project, this.projectId || this.router?.currentProjectId || null);
  }

  _setMsg(text) {
    if (this.msgEl) this.msgEl.textContent = String(text || "");
  }

  async _loadProject() {
    if (this.project) return this.project;
    const effectiveProjectId = this.projectId || this.router?.currentProjectId || null;
    if (!effectiveProjectId) return null;

    const api = window.bbmDb || {};
    if (typeof api.projectsList !== "function") {
      this.project = { id: effectiveProjectId };
      return this.project;
    }

    try {
      const res = await api.projectsList();
      if (res?.ok && Array.isArray(res.list)) {
        this.project =
          res.list.find((item) => String(item?.id ?? "") === String(effectiveProjectId)) || null;
        this.projectMissing = !this.project;
      } else {
        this.project = { id: effectiveProjectId };
      }
    } catch (_err) {
      this.project = { id: effectiveProjectId };
    }
    return this.project;
  }

  async showProjectsList() {
    if (typeof this.router?.showProjects !== "function") return false;
    await this.router.showProjects();
    return true;
  }

  async editProject() {
    const projectId = this.projectId || this.router?.currentProjectId || null;
    if (!projectId || typeof this.router?.showProjectForm !== "function") return false;
    await this.router.showProjectForm({ projectId });
    return true;
  }

  async _openProtocolModule(projectId) {
    const effectiveProjectId = projectId || this.projectId || this.router?.currentProjectId || null;
    if (!effectiveProjectId) return false;
    if (typeof this.router?.openProjectModule === "function") {
      const result = await this.router.openProjectModule(effectiveProjectId, "protokoll", {
        project: this.project || null,
      });
      return typeof result === "object" ? !!result?.ok : result !== false;
    }
    if (typeof this.router?.openProjectProtocol === "function") {
      const result = await this.router.openProjectProtocol(effectiveProjectId, {
        project: this.project || null,
      });
      return typeof result === "object" ? !!result?.ok : result !== false;
    }
    return false;
  }

  async openProjectModule(moduleId, navigationKey = "") {
    const normalizedModuleId = normalizeText(moduleId);
    const normalizedNavigationKey = normalizeText(navigationKey);
    const projectId = this.projectId || this.router?.currentProjectId || null;
    if (!projectId) return false;

    if (normalizedModuleId === "projectFirms") {
      if (typeof this.router?.showProjectFirms !== "function") return false;
      await this.router.showProjectFirms(projectId);
      return true;
    }
    if (normalizedModuleId === "protokoll") return await this._openProtocolModule(projectId);
    if (typeof this.router?.openProjectModule !== "function") return false;

    const result = await this.router.openProjectModule(projectId, normalizedModuleId, {
      project: this.project || null,
      navigationKey: normalizedNavigationKey,
    });
    return typeof result === "object" ? !!result?.ok : result !== false;
  }

  _createModuleCard(group) {
    const style = MODULE_STYLE[group.moduleId] || { color: "#2563eb", icon: "protocol" };
    const card = setStyles(document.createElement("div"), {
      background: "#ffffff",
      border: "1px solid #e3e8ef",
      borderRadius: "14px",
      padding: "16px",
      minHeight: "176px",
      boxShadow: "0 5px 18px rgba(15,23,42,0.045)",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    });

    const iconWrap = setStyles(document.createElement("div"), {
      width: "46px",
      height: "46px",
      borderRadius: "12px",
      display: "grid",
      placeItems: "center",
      background: `${style.color}16`,
      color: style.color,
    });
    iconWrap.innerHTML = ICONS[style.icon] || ICONS.protocol;
    const svg = iconWrap.querySelector("svg");
    if (svg) Object.assign(svg.style, { width: "28px", height: "28px" });

    const title = setStyles(document.createElement("div"), {
      fontWeight: "800",
      fontSize: "17px",
      color: "#172033",
    });
    title.textContent = group.label;

    const description = setStyles(document.createElement("div"), {
      fontSize: "12px",
      lineHeight: "1.45",
      color: "#667085",
      flex: "1",
    });
    description.textContent = group.description || "Arbeitsbereich im aktuellen Projekt öffnen.";

    const actions = setStyles(document.createElement("div"), {
      display: "flex",
      gap: "7px",
      flexWrap: "wrap",
      marginTop: "2px",
    });

    group.entries.forEach((entry, index) => {
      const btn = setStyles(document.createElement("button"), {
        border: index === 0 ? "0" : `1px solid ${style.color}55`,
        borderRadius: "8px",
        background: index === 0 ? style.color : "#ffffff",
        color: index === 0 ? "#ffffff" : style.color,
        padding: "7px 11px",
        fontSize: "11.5px",
        fontWeight: "750",
        cursor: "pointer",
      });
      btn.type = "button";
      btn.textContent = index === 0 ? "Öffnen" : normalizeText(entry?.label) || "Unterbereich";
      btn.title = normalizeText(entry?.description);
      btn.addEventListener("click", async () => {
        await this.openProjectModule(entry?.moduleId, entry?.navigationKey);
      });
      actions.appendChild(btn);
    });

    if (group.moduleId === "protokoll") {
      const settings = setStyles(document.createElement("button"), {
        border: `1px solid ${style.color}55`,
        borderRadius: "8px",
        background: "#ffffff",
        color: style.color,
        padding: "7px 11px",
        fontSize: "11.5px",
        fontWeight: "750",
        cursor: "pointer",
      });
      settings.type = "button";
      settings.textContent = "Einstellungen";
      settings.title = "Projektspezifische Protokoll- und PDF-Einstellungen";
      settings.addEventListener("click", async () => {
        await openProtocolSettingsModal({
          projectId: this.projectId || this.router?.currentProjectId || null,
        });
      });
      actions.appendChild(settings);
    }

    card.append(iconWrap, title, description, actions);
    return card;
  }

  _renderContent() {
    if (!this.hostEl) return;
    this.hostEl.innerHTML = "";

    if (this.projectMissing) {
      const missing = setStyles(document.createElement("div"), {
        padding: "16px",
        color: "#b42318",
        fontWeight: "700",
      });
      missing.textContent = "Projekt konnte nicht gefunden werden.";
      this.hostEl.appendChild(missing);
      return;
    }

    const project = this.project || {};
    const info = setStyles(document.createElement("div"), {
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      border: "1px solid #e3e8ef",
      borderRadius: "14px",
      padding: "16px 18px",
      marginBottom: "18px",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      gap: "10px 18px",
      alignItems: "start",
    });

    const projectText = document.createElement("div");
    const title = setStyles(document.createElement("div"), {
      fontSize: "22px",
      fontWeight: "850",
      color: "#172033",
      marginBottom: "5px",
    });
    title.textContent = this.getProjectDisplayText();

    const address = setStyles(document.createElement("div"), {
      fontSize: "12px",
      color: "#667085",
      marginBottom: "5px",
    });
    address.textContent = projectAddress(project) || "Keine Projektadresse hinterlegt";

    const meta = setStyles(document.createElement("div"), {
      fontSize: "11px",
      color: "#8a94a5",
    });
    const lead = normalizeText(project?.project_lead);
    const dates = [
      normalizeText(project?.start_date)?.slice(0, 10),
      normalizeText(project?.end_date)?.slice(0, 10),
    ]
      .filter(Boolean)
      .join(" – ");
    meta.textContent =
      [lead ? `Projektleitung: ${lead}` : "", dates ? `Zeitraum: ${dates}` : ""]
        .filter(Boolean)
        .join("   ·   ") || "Projektstammdaten";
    projectText.append(title, address, meta);

    const edit = setStyles(document.createElement("button"), {
      border: "1px solid #d7dee8",
      borderRadius: "8px",
      background: "#ffffff",
      color: "#175cd3",
      padding: "7px 11px",
      fontSize: "11.5px",
      fontWeight: "750",
      cursor: "pointer",
      whiteSpace: "nowrap",
    });
    edit.type = "button";
    edit.textContent = "Projekt bearbeiten";
    edit.onclick = async () => this.editProject();

    info.append(projectText, edit);

    const sectionHead = setStyles(document.createElement("div"), {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      margin: "0 2px 9px",
    });
    const sectionTitle = setStyles(document.createElement("div"), {
      fontSize: "14px",
      fontWeight: "800",
      color: "#172033",
    });
    sectionTitle.textContent = "Arbeitsbereiche";
    const sectionHint = setStyles(document.createElement("div"), {
      fontSize: "11px",
      color: "#8a94a5",
    });
    sectionHint.textContent = "Nur freigeschaltete Bereiche dieses Projekts";
    sectionHead.append(sectionTitle, sectionHint);

    const grid = setStyles(document.createElement("div"), {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "12px",
    });

    const groups = groupProjectModules(this.getAvailableProjectModules());
    if (!groups.length) {
      const empty = setStyles(document.createElement("div"), {
        padding: "14px",
        border: "1px solid #e3e8ef",
        borderRadius: "12px",
        background: "#ffffff",
        color: "#667085",
        fontSize: "12px",
      });
      empty.textContent = "Für dieses Projekt sind keine Arbeitsmodule freigeschaltet.";
      grid.appendChild(empty);
    } else {
      groups.forEach((group) => grid.appendChild(this._createModuleCard(group)));
    }

    this.hostEl.append(info, sectionHead, grid);
  }

  render() {
    const root = setStyles(document.createElement("div"), {
      minHeight: "100%",
      boxSizing: "border-box",
      padding: "18px clamp(16px, 2.5vw, 30px)",
      background: "#f4f6f9",
      color: "#172033",
    });

    const head = setStyles(document.createElement("div"), {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "14px",
    });

    const back = setStyles(document.createElement("button"), {
      border: "1px solid #d7dee8",
      borderRadius: "8px",
      background: "#ffffff",
      color: "#344054",
      padding: "7px 10px",
      fontSize: "11.5px",
      fontWeight: "700",
      cursor: "pointer",
    });
    back.type = "button";
    back.textContent = "← Projekte";
    back.onclick = async () => this.showProjectsList();

    const msg = setStyles(document.createElement("div"), {
      marginLeft: "auto",
      fontSize: "11px",
      color: "#8a94a5",
    });
    head.append(back, msg);

    const host = document.createElement("div");
    root.append(head, host);
    this.root = root;
    this.hostEl = host;
    this.msgEl = msg;
    this._renderContent();
    return root;
  }

  async load() {
    this.loading = true;
    this._setMsg("Lade ...");
    try {
      await this._loadProject();
      this._renderContent();
    } finally {
      this.loading = false;
      this._setMsg("");
    }
  }
}
