import { EditboxShell } from "../../../core/editbox/index.js";
import { ResponsibleField } from "../../../core/responsible/ResponsibleField.js";
import { StatusAmpelField } from "../../../core/status-ampel/StatusAmpelField.js";

const RESTARBEITEN_STATUS_OPTIONS = Object.freeze([
  { value: "offen", label: "Offen" },
  { value: "in-arbeit", label: "In Arbeit" },
  { value: "blockiert", label: "Blockiert" },
  { value: "erledigt", label: "Erledigt" },
]);

const RESTARBEITEN_RESPONSIBLE_OPTIONS = Object.freeze([
  { value: "", label: "Nicht zugeordnet" },
  { value: "projektleitung", label: "Projektleitung" },
  { value: "bauleitung", label: "Bauleitung" },
  { value: "fachplanung", label: "Fachplanung" },
]);

function mkEl(doc, tag, className, text) {
  const el = doc.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function createEmptyRestarbeitenDraft() {
  return {
    summary: "",
    details: "",
    flags: {
      important: false,
      task: true,
    },
    responsible: "",
    status: "offen",
    dueDate: "",
    trafficLight: "none",
  };
}

function buildEditboxValueFromDraft(draft = {}) {
  return {
    shortText: String(draft.summary || ""),
    longText: String(draft.details || ""),
    flags: {
      hidden: false,
      important: Boolean(draft.flags?.important),
      task: Boolean(draft.flags?.task),
      decision: false,
    },
  };
}

function buildDraftSummary(draft = {}) {
  const summary = String(draft.summary || "").trim() || "Ohne Kurztext";
  const status = String(draft.status || "offen");
  const responsible = String(draft.responsible || "").trim() || "Nicht zugeordnet";
  const dueDate = String(draft.dueDate || "").trim() || "ohne Termin";
  return `${summary} | ${status} | ${responsible} | ${dueDate}`;
}

export class RestarbeitenWorkbench {
  constructor() {
    this._draft = createEmptyRestarbeitenDraft();
    this._buildWorkbenchShell();
    this._buildSharedEditboxCore();
    this._buildRestarbeitenMetaColumn();
    this._buildRestarbeitenActionBar();
    this._assembleWorkbench();
    this._bindEvents();
    this._applyDraftToUi();
  }

  _buildWorkbenchShell() {
    this.root = document.createElement("section");
    this.root.className = "bbm-restarbeiten-workbench";
    this.root.setAttribute("data-component", "restarbeiten-workbench");
    this.root.style.display = "flex";
    this.root.style.flexDirection = "column";
    this.root.style.gap = "16px";
    this.root.style.padding = "16px";
    this.root.style.border = "1px solid #dbe4f0";
    this.root.style.borderRadius = "12px";
    this.root.style.background = "#ffffff";

    this.header = document.createElement("div");
    this.header.style.display = "flex";
    this.header.style.justifyContent = "space-between";
    this.header.style.alignItems = "flex-start";
    this.header.style.gap = "12px";

    const titleWrap = document.createElement("div");
    this.titleEl = mkEl(document, "div", null, "Restarbeiten bearbeiten");
    this.titleEl.style.fontSize = "18px";
    this.titleEl.style.fontWeight = "700";
    this.subtitleEl = mkEl(
      document,
      "div",
      null,
      "Eigenstaendige Restarbeiten-Workbench auf gemeinsamem Bearbeitungskern."
    );
    this.subtitleEl.style.fontSize = "13px";
    this.subtitleEl.style.color = "#526277";
    titleWrap.append(this.titleEl, this.subtitleEl);

    this.stateHintEl = mkEl(document, "div", null, "Noch nicht produktiv angebunden");
    this.stateHintEl.style.padding = "6px 10px";
    this.stateHintEl.style.borderRadius = "999px";
    this.stateHintEl.style.background = "#eef5ff";
    this.stateHintEl.style.color = "#154a91";
    this.stateHintEl.style.fontSize = "12px";
    this.stateHintEl.style.fontWeight = "600";

    this.header.append(titleWrap, this.stateHintEl);

    this.body = document.createElement("div");
    this.body.style.display = "grid";
    this.body.style.gridTemplateColumns = "minmax(0, 1fr) 280px";
    this.body.style.gap = "16px";

    this.metaCol = document.createElement("aside");
    this.metaCol.style.display = "flex";
    this.metaCol.style.flexDirection = "column";
    this.metaCol.style.gap = "12px";
    this.metaCol.style.padding = "12px";
    this.metaCol.style.borderRadius = "10px";
    this.metaCol.style.background = "#f8fbff";
    this.metaCol.style.border = "1px solid #d9e6f5";

    this.footer = document.createElement("div");
    this.footer.style.display = "flex";
    this.footer.style.justifyContent = "space-between";
    this.footer.style.alignItems = "center";
    this.footer.style.gap = "12px";
    this.footer.style.flexWrap = "wrap";

    this.summaryEl = mkEl(document, "div", null, "");
    this.summaryEl.style.fontSize = "12px";
    this.summaryEl.style.color = "#526277";
  }

  _buildSharedEditboxCore() {
    this.editbox = new EditboxShell();
    this.editbox.setVisibleFlags(["important", "task"]);
    this.editbox.setCounterFormatter((evaluation) => String(evaluation?.remaining ?? ""));
    this.editbox.setLimits({ shortText: 90, longText: 4000 });
    this.editboxRoot = this.editbox.getElement();
    this.editboxRoot.style.minHeight = "320px";
    this.editboxRoot.style.borderRadius = "10px";
    this.editboxRoot.style.background = "#fbfdff";
    this.editboxRoot.style.padding = "12px";
    this.editboxRoot.style.border = "1px solid #d9e6f5";

    const flagTaskLabel = this.editbox.flagInputs?.task?.parentElement?.querySelector("span");
    const flagImportantLabel = this.editbox.flagInputs?.important?.parentElement?.querySelector("span");
    if (flagTaskLabel) flagTaskLabel.textContent = "Offene Arbeit";
    if (flagImportantLabel) flagImportantLabel.textContent = "Wichtig";
  }

  _buildRestarbeitenMetaColumn() {
    const metaTitle = mkEl(document, "div", null, "Arbeitsdaten");
    metaTitle.style.fontSize = "14px";
    metaTitle.style.fontWeight = "700";

    this.statusField = new StatusAmpelField({
      labels: {
        status: "Arbeitsstand",
        dueDate: "Bis",
        trafficLight: "Ampel",
      },
    });
    this.statusField.setStatusOptions(RESTARBEITEN_STATUS_OPTIONS);

    this.responsibleField = new ResponsibleField({
      label: "Zustaendig",
    });
    this.responsibleField.setOptions(RESTARBEITEN_RESPONSIBLE_OPTIONS);

    this.metaCol.append(
      metaTitle,
      this.statusField.getElement(),
      this.responsibleField.getElement()
    );
  }

  _buildRestarbeitenActionBar() {
    this.actions = document.createElement("div");
    this.actions.style.display = "flex";
    this.actions.style.gap = "8px";
    this.actions.style.flexWrap = "wrap";

    this.btnRemember = document.createElement("button");
    this.btnRemember.type = "button";
    this.btnRemember.textContent = "Entwurf merken";
    this.btnRemember.dataset.variant = "primary";

    this.btnReset = document.createElement("button");
    this.btnReset.type = "button";
    this.btnReset.textContent = "Zuruecksetzen";

    this.localStateEl = mkEl(document, "div", null, "Noch kein lokaler Entwurf gespeichert.");
    this.localStateEl.style.fontSize = "12px";
    this.localStateEl.style.color = "#526277";

    this.actions.append(this.btnRemember, this.btnReset);
    this.footer.append(this.actions, this.summaryEl, this.localStateEl);
  }

  _assembleWorkbench() {
    this.body.append(this.editboxRoot, this.metaCol);
    this.root.append(this.header, this.body, this.footer);
  }

  _bindEvents() {
    this.editboxRoot.addEventListener("input", () => this._syncDraftFromUi());
    this.editboxRoot.addEventListener("change", () => this._syncDraftFromUi());
    this.statusField.statusSelect.addEventListener("change", () => this._syncDraftFromUi());
    this.statusField.dueInput.addEventListener("change", () => this._syncDraftFromUi());
    this.responsibleField.selectEl.addEventListener("change", () => this._syncDraftFromUi());

    this.btnRemember.addEventListener("click", () => {
      this._syncDraftFromUi();
      this.localStateEl.textContent = `Lokaler Entwurf gespeichert: ${buildDraftSummary(this._draft)}`;
    });

    this.btnReset.addEventListener("click", () => {
      this._draft = createEmptyRestarbeitenDraft();
      this.localStateEl.textContent = "Entwurf auf Startzustand zurueckgesetzt.";
      this._applyDraftToUi();
    });
  }

  _syncDraftFromUi() {
    const editValue = this.editbox.getValue();
    const metaValue = this.statusField.getValue();
    this._draft = {
      summary: String(editValue.shortText || ""),
      details: String(editValue.longText || ""),
      flags: {
        important: Boolean(editValue.flags?.important),
        task: Boolean(editValue.flags?.task),
      },
      responsible: this.responsibleField.getValue(),
      status: String(metaValue.status || "offen"),
      dueDate: String(metaValue.dueDate || ""),
      trafficLight: String(metaValue.trafficLight || "none"),
    };
    this._refreshSummary();
  }

  _applyDraftToUi() {
    this.editbox.setValue(buildEditboxValueFromDraft(this._draft));
    this.statusField.setValue({
      status: this._draft.status,
      dueDate: this._draft.dueDate,
      trafficLight: this._draft.trafficLight,
    });
    this.responsibleField.setValue(this._draft.responsible);
    this._refreshSummary();
  }

  _refreshSummary() {
    this.summaryEl.textContent = `Aktueller Entwurf: ${buildDraftSummary(this._draft)}`;
  }

  getElement() {
    return this.root;
  }

  getDraft() {
    return {
      ...this._draft,
      flags: {
        ...this._draft.flags,
      },
    };
  }
}
