const COLORS = Object.freeze({
  green: "#37a447",
  greenSoft: "#edf8ef",
  text: "#172033",
  muted: "#667085",
  border: "#dfe5ec",
  canvas: "#f5f7fa",
  white: "#ffffff",
});

function setStyles(el, values = {}) {
  Object.assign(el.style, values);
  return el;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function projectLabel(project) {
  const number = normalizeText(project?.project_number ?? project?.projectNumber);
  const short = normalizeText(project?.short);
  const name = normalizeText(project?.name);
  const title = short || name || "Projekt";
  return number ? `${number} - ${title}` : title;
}

function protocolIcon(size = 32) {
  const wrap = document.createElement("span");
  wrap.innerHTML = `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="12" y="7" width="24" height="34" rx="3.5" fill="none" stroke="currentColor" stroke-width="2.7"/>
      <path d="M18 17h12M18 23h12M18 29h8" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/>
      <circle cx="18" cy="35" r="1.7" fill="currentColor"/>
      <path d="M22 35h8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`;
  const svg = wrap.querySelector("svg");
  if (svg) {
    svg.style.width = `${size}px`;
    svg.style.height = `${size}px`;
    svg.style.display = "block";
  }
  return wrap;
}

export default class ProtokollStartScreen {
  constructor({ router } = {}) {
    this.router = router || null;
    this.projects = [];
    this.lastProject = null;
    this.root = null;
    this.contentEl = null;
  }

  _readLastProjectId() {
    try {
      return normalizeText(window.localStorage?.getItem?.("bbm.lastProjectId")) || null;
    } catch (_e) {
      return null;
    }
  }

  async _loadProjects() {
    const api = window.bbmDb || {};
    if (typeof api.projectsList !== "function") {
      this.projects = [];
      this.lastProject = null;
      return;
    }

    try {
      const res = await api.projectsList();
      this.projects = res?.ok && Array.isArray(res.list) ? res.list : [];
    } catch (_e) {
      this.projects = [];
    }

    const lastId = this._readLastProjectId();
    this.lastProject = lastId
      ? this.projects.find((project) => String(project?.id ?? "") === String(lastId)) || null
      : null;
  }

  async _openProject(project) {
    const projectId = project?.id || null;
    if (!projectId) return;
    await this.router?.showProjectWorkspace?.(projectId, { project });
  }

  async _chooseProject() {
    try {
      window.localStorage?.removeItem?.("bbm.startTargetModuleId");
      window.localStorage?.removeItem?.("bbm.protokollStartIntent");
    } catch (_e) {
      // ignore
    }
    await this.router?.showProjects?.();
  }

  async _newProtocol() {
    try {
      window.localStorage?.removeItem?.("bbm.startTargetModuleId");
      window.localStorage?.setItem?.("bbm.protokollStartIntent", "new");
    } catch (_e) {
      // ignore
    }
    await this.router?.showProjects?.();
  }

  _createActionCard({ title, description, actionLabel, onClick, accent = COLORS.green }) {
    const card = setStyles(document.createElement("div"), {
      border: `1px solid ${COLORS.border}`,
      borderRadius: "12px",
      background: COLORS.white,
      padding: "18px",
      minHeight: "150px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: "9px",
      boxShadow: "0 3px 10px rgba(15,23,42,.045)",
    });

    const titleEl = setStyles(document.createElement("div"), {
      fontSize: "15px",
      fontWeight: "800",
      color: COLORS.text,
    });
    titleEl.textContent = title;

    const descEl = setStyles(document.createElement("div"), {
      fontSize: "12px",
      lineHeight: "1.45",
      color: COLORS.muted,
      flex: "1",
    });
    descEl.textContent = description;

    const button = setStyles(document.createElement("button"), {
      alignSelf: "flex-start",
      border: "0",
      borderRadius: "5px",
      background: accent,
      color: "#fff",
      height: "30px",
      padding: "0 13px",
      fontSize: "11px",
      fontWeight: "750",
      cursor: "pointer",
    });
    button.type = "button";
    button.textContent = actionLabel;
    button.addEventListener("click", async () => onClick?.());

    card.append(titleEl, descEl, button);
    return card;
  }

  _renderContent() {
    if (!this.contentEl) return;
    this.contentEl.innerHTML = "";

    const header = setStyles(document.createElement("div"), {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      marginBottom: "20px",
    });

    const iconBox = setStyles(document.createElement("div"), {
      width: "54px",
      height: "54px",
      borderRadius: "11px",
      background: COLORS.green,
      color: "#fff",
      display: "grid",
      placeItems: "center",
      boxShadow: "0 8px 18px rgba(55,164,71,.20)",
    });
    iconBox.append(protocolIcon(34));

    const headerText = document.createElement("div");
    const title = setStyles(document.createElement("h1"), {
      margin: "0",
      fontSize: "25px",
      color: COLORS.text,
      letterSpacing: "-.3px",
    });
    title.textContent = "Protokoll";
    const subtitle = setStyles(document.createElement("div"), {
      marginTop: "5px",
      fontSize: "12.5px",
      color: COLORS.muted,
    });
    subtitle.textContent = "Besprechungsprotokolle projektbezogen erstellen, fortschreiben und wieder öffnen.";
    headerText.append(title, subtitle);
    header.append(iconBox, headerText);

    const grid = setStyles(document.createElement("div"), {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "12px",
    });

    if (this.lastProject) {
      grid.append(
        this._createActionCard({
          title: "Zuletzt verwendet",
          description: projectLabel(this.lastProject),
          actionLabel: "Fortsetzen",
          onClick: async () => this._openProject(this.lastProject),
        })
      );
    } else {
      grid.append(
        this._createActionCard({
          title: "Zuletzt verwendet",
          description: "Noch kein zuletzt verwendetes Projekt vorhanden.",
          actionLabel: "Projekt auswählen",
          onClick: async () => this._chooseProject(),
        })
      );
    }

    grid.append(
      this._createActionCard({
        title: "Projekt auswählen",
        description: "Ein bestehendes Projekt öffnen und dort die vorhandenen Protokolle aufrufen.",
        actionLabel: "Projekt auswählen",
        onClick: async () => this._chooseProject(),
      }),
      this._createActionCard({
        title: "Neues Protokoll",
        description: "Projekt auswählen und anschließend eine neue Besprechung bzw. ein neues Protokoll anlegen.",
        actionLabel: "Neues Protokoll",
        onClick: async () => this._newProtocol(),
      })
    );

    const hint = setStyles(document.createElement("div"), {
      marginTop: "18px",
      border: `1px solid ${COLORS.border}`,
      borderRadius: "10px",
      background: COLORS.greenSoft,
      padding: "11px 13px",
      fontSize: "11.5px",
      lineHeight: "1.45",
      color: "#426249",
    });
    hint.textContent = "Ein Protokoll gehört immer zu einem Projekt. Der Einstieg in das Modul ist davon getrennt: Erst Protokoll wählen, danach den passenden Projektkontext.";

    this.contentEl.append(header, grid, hint);
  }

  render() {
    const root = setStyles(document.createElement("div"), {
      minHeight: "100%",
      boxSizing: "border-box",
      background: COLORS.canvas,
      padding: "24px clamp(20px, 3vw, 42px)",
      overflow: "auto",
    });
    root.setAttribute("data-bbm-protokoll-start", "true");

    const content = setStyles(document.createElement("div"), {
      width: "min(980px, 100%)",
      margin: "0 auto",
    });
    root.append(content);

    this.root = root;
    this.contentEl = content;
    this._renderContent();
    return root;
  }

  async load() {
    await this._loadProjects();
    this._renderContent();
  }
}
