import {
  normalizeTopLongText,
  normalizeTopShortText,
} from "../../shared/text/topTextPresentation.js";
import { applyProtokollTopsUiLayout } from "../../../shared/tableLayouts/protokollTopsLayout.js";
import {
  beginM83ComponentBinding,
  completeM80PilotRender,
  registerM80MultiRef,
  registerM80Ref,
  registerM80TableColumnRef,
} from "../../ui-editor/m80Refs.js";

const PROTOKOLL_LIST_COLUMN_REFS = Object.freeze([
  Object.freeze({ id: "protokoll.list.column.number", key: "number", headerKey: "headerNumber", widthVariable: "--bbm-ui-editor-tops-list-number-col", initialWidth: 64 }),
  Object.freeze({ id: "protokoll.list.column.text", key: "text", headerKey: "headerText", widthVariable: "--bbm-ui-editor-tops-list-text-col", initialWidth: 650 }),
  Object.freeze({ id: "protokoll.list.column.meta", key: "meta", headerKey: "headerMeta", widthVariable: "--bbm-ui-editor-tops-list-meta-col", initialWidth: 172 }),
]);

function resolveModuleAsset(relativePath) {
  const spec = String(relativePath || "");
  if (!spec) return "";

  try {
    return new URL(spec, import.meta.url).href;
  } catch {
    if (typeof process !== "undefined" && typeof process.cwd === "function") {
      const cwd = String(process.cwd()).replace(/\\/g, "/").replace(/\/+$/, "");
      const baseParts = ["src", "renderer", "modules", "protokoll"];
      const parts = String(spec)
        .replace(/\\/g, "/")
        .split("/")
        .filter((part) => part.length > 0);

      for (const part of parts) {
        if (part === ".") continue;
        if (part === "..") {
          if (baseParts.length) baseParts.pop();
          continue;
        }
        baseParts.push(part);
      }

      return `file:///${cwd}/${baseParts.join("/")}`;
    }
    return spec;
  }
}

const TODO_PNG = resolveModuleAsset("../../assets/todo.png");
const RED_FLAG_PNG = resolveModuleAsset("../../assets/icons/redFlag.png");

export class TopsList {
  constructor({ onRowClick, onLevel1Toggle, onLayoutZoneClick, tableLayout } = {}) {
    this.onRowClick = typeof onRowClick === "function" ? onRowClick : null;
    this.onLevel1Toggle = typeof onLevel1Toggle === "function" ? onLevel1Toggle : null;
    this.onLayoutZoneClick = typeof onLayoutZoneClick === "function" ? onLayoutZoneClick : null;
    this.tableLayout = tableLayout && typeof tableLayout === "object" ? tableLayout : null;
    this.devLayoutMode = {
      enabled: false,
      activeZone: null,
    };
    this._uiEditorRefs = this._createUiEditorRefs();
    this.table = document.createElement("div");
    this.table.className = "bbm-tops-list-table";
    this.table.setAttribute("data-bbm-tops-list-table", "true");
    this.header = this._buildTableHeader();
    this.root = document.createElement("ul");
    this.root.setAttribute("data-bbm-tops-list-v2", "true");
    this.table.append(this.header, this.root);
    applyProtokollTopsUiLayout(this.table, this.tableLayout);
    this._applyDevOnlyLayoutVarsGate();
  }

  _buildTableHeader() {
    const header = document.createElement("div");
    header.className = "bbm-tops-list-table-header";

    const number = document.createElement("div");
    number.className = "bbm-tops-list-table-header-number";
    number.textContent = "Nr. / Datum / Klasse";

    const text = document.createElement("div");
    text.className = "bbm-tops-list-table-header-text";
    text.textContent = "Gegenstand";

    const meta = document.createElement("div");
    meta.className = "bbm-tops-list-table-header-meta";
    const due = document.createElement("div");
    due.textContent = "Fertig bis";
    const status = document.createElement("div");
    status.textContent = "Status";
    const responsible = document.createElement("div");
    responsible.textContent = "Verantw.";
    meta.append(due, status, responsible);
    header.append(number, text, meta);

    this.headerNumber = number;
    this.headerText = text;
    this.headerMeta = meta;
    this.headerDue = due;
    this.headerStatus = status;
    this.headerResponsible = responsible;
    return header;
  }

  setTableLayout(tableLayout) {
    this.tableLayout = tableLayout && typeof tableLayout === "object" ? tableLayout : null;
    applyProtokollTopsUiLayout(this.table, this.tableLayout);
    this._applyDevOnlyLayoutVarsGate();
  }

  setDevLayoutMode(mode = {}) {
    void mode;
    this.devLayoutMode = {
      enabled: false,
      activeZone: null,
    };
    this.root.dataset.devLayoutMode = "false";
    if (this.root?.removeAttribute) {
      this.root.removeAttribute("data-dev-layout-mode");
    }
    applyProtokollTopsUiLayout(this.table, this.tableLayout);
    this._applyDevOnlyLayoutVarsGate();
  }

  _applyDevOnlyLayoutVarsGate() {
    if (!this.table?.style) return;
    if (this.devLayoutMode?.enabled) return;

    const devOnlyVars = [
      "--bbm-tops-list-number-padding-inline",
      "--bbm-tops-list-number-font-size",
      "--bbm-tops-list-text-padding-inline",
      "--bbm-tops-list-text-font-size",
      "--bbm-tops-list-meta-padding-inline",
      "--bbm-tops-list-meta-font-size",
    ];

    for (const key of devOnlyVars) {
      this.table.style.removeProperty(key);
    }
  }

  setItems(items = []) {
    if (typeof this.root.replaceChildren === "function") {
      this.root.replaceChildren();
    } else {
      this.root.innerHTML = "";
    }
    const rows = Array.isArray(items) ? items : [];
    this._uiEditorRefs = this._createUiEditorRefs();
    for (const item of rows) {
      this.root.appendChild(this._renderRow(item));
    }
    this._registerUiEditorColumnRefs();
  }

  _registerUiEditorColumnRefs() {
    beginM83ComponentBinding("bbm.protokoll.list.columns");
    for (const column of PROTOKOLL_LIST_COLUMN_REFS) {
      registerM80TableColumnRef(
        column.id,
        this[column.headerKey],
        this._uiEditorRefs[column.key] || [],
        this.table,
        this.table,
        column.widthVariable,
        column.initialWidth
      );
    }
    registerM80Ref("protokoll.list.header.due", this.headerDue);
    registerM80Ref("protokoll.list.header.status", this.headerStatus);
    registerM80Ref("protokoll.list.header.responsible", this.headerResponsible);
    for (const id of [
      "protokoll.list.row", "protokoll.list.row.level1Toggle", "protokoll.list.row.number", "protokoll.list.row.class", "protokoll.list.row.marker",
      "protokoll.list.row.createdAt", "protokoll.list.row.short", "protokoll.list.row.long", "protokoll.list.row.due",
      "protokoll.list.row.status", "protokoll.list.row.responsible", "protokoll.list.row.ampel", "protokoll.list.row.todo", "protokoll.list.row.decision",
    ]) registerM80MultiRef(id, this._uiEditorRefs[id] || [], this.root, { mountedInstanceCount: (this._uiEditorRefs[id] || []).length });
    completeM80PilotRender();
  }

  _createUiEditorRefs() {
    return {
      number: [], text: [], meta: [],
      "protokoll.list.row": [], "protokoll.list.row.level1Toggle": [], "protokoll.list.row.number": [], "protokoll.list.row.class": [], "protokoll.list.row.marker": [],
      "protokoll.list.row.createdAt": [], "protokoll.list.row.short": [], "protokoll.list.row.long": [], "protokoll.list.row.due": [],
      "protokoll.list.row.status": [], "protokoll.list.row.responsible": [], "protokoll.list.row.ampel": [], "protokoll.list.row.todo": [], "protokoll.list.row.decision": [],
    };
  }

  _renderRow(item = {}) {
    const rowEl = document.createElement("li");
    rowEl.className = "bbm-tops-list-row";
    const moveState =
      String(item.moveState || "").trim() ||
      (item.isMoveMode ? (item.isMoveTarget ? "target" : "blocked") : "normal");
    rowEl.dataset.topId = String(item.id || "");
    rowEl.dataset.topLevel = String(item.level || 1);
    rowEl.dataset.isSelected = item.isSelected ? "true" : "false";
    rowEl.dataset.isMoveMode = item.isMoveMode ? "true" : "false";
    rowEl.dataset.moveState = moveState;
    rowEl.dataset.visualState = String(item.visualState || "carried");
    rowEl.dataset.titleTone = String(item.titleTone || "black");
    rowEl.dataset.isImportant = item.isImportant ? "true" : "false";
    rowEl.dataset.isCompleted = item.isCompleted ? "true" : "false";
    rowEl.dataset.isLevel1 = item.isTitle ? "true" : "false";
    rowEl.dataset.level1Collapsed = item.isTitle && item.isLevel1Collapsed ? "true" : "false";
    rowEl.dataset.level1TopId = String(item.level1TopId || "");
    rowEl.dataset.isMoveTarget =
      item.isMoveTarget === null || item.isMoveTarget === undefined
        ? "none"
        : item.isMoveTarget
          ? "true"
          : "false";

    const row = document.createElement("div");
    row.className = "bbm-tops-list-row-grid";

    const num = document.createElement("div");
    num.className = "bbm-tops-list-row-number";

    const numLine = document.createElement("div");
    numLine.className = "bbm-tops-list-row-number-line";

    if (item.isTitle && this.onLevel1Toggle) {
      const collapseButton = document.createElement("button");
      collapseButton.type = "button";
      collapseButton.className = "bbm-tops-list-row-collapse-toggle";
      collapseButton.dataset.collapsed = item.isLevel1Collapsed ? "true" : "false";
      collapseButton.textContent = item.isLevel1Collapsed ? "\u25B8" : "\u25BE";
      collapseButton.disabled = !!item.isMoveMode || !item.canToggleLevel1;
      collapseButton.title = item.isLevel1Collapsed ? "Aufklappen" : "Einklappen";
      collapseButton.setAttribute("aria-label", item.isLevel1Collapsed ? "Aufklappen" : "Einklappen");
      collapseButton.setAttribute("aria-expanded", item.isLevel1Collapsed ? "false" : "true");
      collapseButton.onclick = (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        if (collapseButton.disabled) return;
        if (this.onLevel1Toggle) this.onLevel1Toggle(item);
      };
      numLine.appendChild(collapseButton);
      this._uiEditorRefs["protokoll.list.row.level1Toggle"].push(collapseButton);
    }

    this._decorateLayoutZone(num, "number");

    const numLabel = document.createElement("span");
    numLabel.className = "bbm-tops-list-row-number-value";
    numLabel.textContent = `${item.number || ""}`;
    numLine.appendChild(numLabel);
    this._uiEditorRefs["protokoll.list.row.number"].push(numLabel);
    num.appendChild(numLine);

    if (item.showStar) {
      const star = document.createElement("span");
      star.className = "bbm-tops-list-row-star";
      star.textContent = "*";
      numLabel.append(" ", star);
      this._uiEditorRefs["protokoll.list.row.marker"].push(star);
    }

    const createdAt = String(item.createdAt || "").trim();
    if (createdAt) {
      const createdAtLine = document.createElement("div");
      createdAtLine.className = "bbm-tops-list-row-number-date";
      createdAtLine.textContent = createdAt;
      num.appendChild(createdAtLine);
      this._uiEditorRefs["protokoll.list.row.createdAt"].push(createdAtLine);
    }

    const itemClass = document.createElement("div");
    itemClass.className = "bbm-tops-list-row-class";
    itemClass.textContent = String(item.itemClass || (item.isTitle ? "Titel" : "TOP"));
    num.appendChild(itemClass);
    this._uiEditorRefs["protokoll.list.row.class"].push(itemClass);

    const text = document.createElement("div");
    text.className = "bbm-tops-list-row-text";
    this._decorateLayoutZone(text, "text");

    const title = document.createElement("div");
    title.className = "bbm-tops-list-row-title";
    title.dataset.tone = String(item.titleTone || "black");
    title.dataset.important = item.isImportant ? "true" : "false";
    title.dataset.completed = item.isCompleted ? "true" : "false";
    title.textContent = normalizeTopShortText(item.title);
    this._uiEditorRefs["protokoll.list.row.short"].push(title);

    const preview = document.createElement("div");
    preview.className = "bbm-tops-list-row-preview";
    const previewText = normalizeTopLongText(item.preview);
    preview.textContent = previewText;
    preview.dataset.hasPreview = previewText ? "true" : "false";
    preview.dataset.important = item.isImportant ? "true" : "false";
    preview.dataset.completed = item.isCompleted ? "true" : "false";

    text.append(title);
    if (item.showLongtextInList !== false && previewText) {
      text.append(preview);
      this._uiEditorRefs["protokoll.list.row.long"].push(preview);
    }

    const meta = document.createElement("div");
    meta.className = "bbm-tops-list-row-meta";
    this._decorateLayoutZone(meta, "meta");
    const legacyMeta = Array.isArray(item.meta) ? item.meta : [];
    const metaLines = [
      { refId: "protokoll.list.row.due", value: item.due ?? legacyMeta[0] ?? "", kind: "due" },
      { refId: "protokoll.list.row.status", value: item.status ?? legacyMeta[1] ?? "", kind: "status" },
      { refId: "protokoll.list.row.responsible", value: item.responsible ?? legacyMeta[2] ?? "", kind: "responsible" },
    ];
    for (const line of metaLines) {
      const value = String(line.value || "").trim();
      if (!value) continue;
      const el = document.createElement("div");
      el.className = "bbm-tops-list-row-meta-line";
      if (line.kind === "status") {
        el.classList.add("bbm-tops-list-row-meta-line-status");
      } else if (line.kind === "responsible") {
        el.classList.add("bbm-tops-list-row-meta-line-responsible");
      }
      const text = document.createElement("span");
      text.className = "bbm-tops-list-row-meta-text";
      text.textContent = value;
      el.appendChild(text);
      // The editor must select the actual visible value, never the enclosing
      // meta line.  The line keeps the historical list layout (including a
      // possible status symbol); its text child is the independently editable
      // target for due date, status and responsible party.
      this._uiEditorRefs[line.refId].push(text);
      if (line.kind === "status") {
        const ampelSlot = document.createElement("span");
        ampelSlot.className = "bbm-tops-list-row-meta-ampel-slot";
        const symbolType = String(item.metaSymbolType || "");
        if (symbolType === "decision") {
          const img = document.createElement("img");
          img.className = "bbm-tops-list-row-meta-symbol";
          img.src = RED_FLAG_PNG;
          img.alt = "Beschluss";
          img.title = "Beschluss";
          img.dataset.symbol = "decision";
          ampelSlot.appendChild(img);
          this._uiEditorRefs["protokoll.list.row.decision"].push(img);
        } else if (symbolType === "task") {
          const img = document.createElement("img");
          img.className = "bbm-tops-list-row-meta-symbol";
          img.src = TODO_PNG;
          img.alt = "ToDo";
          img.title = "ToDo";
          img.dataset.symbol = "task";
          ampelSlot.appendChild(img);
          this._uiEditorRefs["protokoll.list.row.todo"].push(img);
        } else if (item.showAmpelInList !== false && item.ampelColor) {
          const dot = document.createElement("span");
          dot.className = "bbm-tops-list-row-ampel";
          dot.dataset.color = String(item.ampelColor || "");
          dot.setAttribute("aria-label", `Ampel ${item.ampelColor}`);
          ampelSlot.appendChild(dot);
          this._uiEditorRefs["protokoll.list.row.ampel"].push(dot);
        }
        el.appendChild(ampelSlot);
      }
      meta.appendChild(el);
    }

    row.append(num, text, meta);
    this._uiEditorRefs.number.push(num);
    this._uiEditorRefs.text.push(text);
    this._uiEditorRefs.meta.push(meta);
    this._uiEditorRefs["protokoll.list.row"].push(rowEl);
    rowEl.appendChild(row);

    rowEl.onclick = async () => {
      if (moveState === "current" || moveState === "blocked") return;
      if (this.onRowClick) await this.onRowClick(item);
    };

    return rowEl;
  }

  _decorateLayoutZone(zoneEl, zoneKey) {
    void zoneEl;
    void zoneKey;
  }
}
