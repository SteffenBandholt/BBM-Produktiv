import {
  normalizeTopLongText,
  normalizeTopShortText,
} from "../../shared/text/topTextPresentation.js";
import { applyProtokollTopsUiLayout } from "../../../shared/tableLayouts/protokollTopsLayout.js";
import { completeM80PilotRender, registerM80Ref } from "../../ui-editor/m80Refs.js";

const PROTOKOLL_LIST_COLUMN_REFS = Object.freeze([
  Object.freeze({ id: "protokoll.list.column.number", key: "number", widthVariable: "--bbm-tops-list-number-col", minimumWidth: 40, maximumWidth: 220 }),
  Object.freeze({ id: "protokoll.list.column.text", key: "text", widthVariable: "--bbm-tops-list-text-col", minimumWidth: 180, maximumWidth: 1400 }),
  Object.freeze({ id: "protokoll.list.column.meta", key: "meta", widthVariable: "--bbm-tops-list-meta-col", minimumWidth: 50, maximumWidth: 420 }),
]);

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function readLogicalColumnState(id, element) {
  const rect = element.getBoundingClientRect();
  const style = globalThis.window?.getComputedStyle?.(element) || element.style || {};
  return {
    elementId: id,
    x: 0,
    y: 0,
    width: finite(rect.width, 1),
    height: finite(rect.height, 1),
    textOffsetX: finite(parseFloat(style.paddingLeft)),
    textOffsetY: finite(parseFloat(style.paddingTop)),
    fontSize: finite(parseFloat(style.fontSize), 12),
    visible: true,
    spacing: {},
  };
}

function getAssetBaseUrl() {
  if (typeof window !== "undefined" && window?.location?.href) return window.location.href;
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    const cwdUrl = `file:///${process.cwd().replace(/\\/g, "/").replace(/^\/+/, "")}/`;
    return new URL("./", cwdUrl).href;
  }
  return "file:///";
}

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

const ASSET_BASE_URL = getAssetBaseUrl();
const TODO_PNG = new URL("../../assets/todo.png", ASSET_BASE_URL).href;
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
    this._uiEditorColumnRefs = { number: [], text: [], meta: [] };
    this.root = document.createElement("ul");
    this.root.setAttribute("data-bbm-tops-list-v2", "true");
    applyProtokollTopsUiLayout(this.root, this.tableLayout);
    this._applyDevOnlyLayoutVarsGate();
  }

  setTableLayout(tableLayout) {
    this.tableLayout = tableLayout && typeof tableLayout === "object" ? tableLayout : null;
    applyProtokollTopsUiLayout(this.root, this.tableLayout);
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
    applyProtokollTopsUiLayout(this.root, this.tableLayout);
    this._applyDevOnlyLayoutVarsGate();
  }

  _applyDevOnlyLayoutVarsGate() {
    if (!this.root?.style) return;
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
      this.root.style.removeProperty(key);
    }
  }

  setItems(items = []) {
    if (typeof this.root.replaceChildren === "function") {
      this.root.replaceChildren();
    } else {
      this.root.innerHTML = "";
    }
    const rows = Array.isArray(items) ? items : [];
    this._uiEditorColumnRefs = { number: [], text: [], meta: [] };
    for (const item of rows) {
      this.root.appendChild(this._renderRow(item));
    }
    this._registerUiEditorColumnRefs();
  }

  _registerUiEditorColumnRefs() {
    for (const column of PROTOKOLL_LIST_COLUMN_REFS) {
      const targets = this._uiEditorColumnRefs[column.key] || [];
      const primary = targets[0];
      if (!primary) continue;
      registerM80Ref(column.id, primary, {
        targets,
        read: () => readLogicalColumnState(column.id, primary),
        apply: (state) => {
          const width = Math.min(column.maximumWidth, Math.max(column.minimumWidth, finite(state.width, column.minimumWidth)));
          this.root.style.setProperty(column.widthVariable, `${width}px`);
        },
      });
    }
    completeM80PilotRender();
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
    }

    this._decorateLayoutZone(num, "number");

    const numLabel = document.createElement("span");
    numLabel.className = "bbm-tops-list-row-number-value";
    numLabel.textContent = `${item.number || ""}`;
    numLine.appendChild(numLabel);
    num.appendChild(numLine);

    if (item.showStar) {
      const star = document.createElement("span");
      star.className = "bbm-tops-list-row-star";
      star.textContent = "*";
      numLabel.append(" ", star);
    }

    const createdAt = String(item.createdAt || "").trim();
    if (createdAt && !item.isTitle) {
      const createdAtLine = document.createElement("div");
      createdAtLine.className = "bbm-tops-list-row-number-date";
      createdAtLine.textContent = createdAt;
      num.appendChild(createdAtLine);
    }

    const text = document.createElement("div");
    text.className = "bbm-tops-list-row-text";
    this._decorateLayoutZone(text, "text");

    const title = document.createElement("div");
    title.className = "bbm-tops-list-row-title";
    title.dataset.tone = String(item.titleTone || "black");
    title.dataset.important = item.isImportant ? "true" : "false";
    title.dataset.completed = item.isCompleted ? "true" : "false";
    title.textContent = normalizeTopShortText(item.title);

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
    }

    const meta = document.createElement("div");
    meta.className = "bbm-tops-list-row-meta";
    this._decorateLayoutZone(meta, "meta");
    const statusTokens = new Set(["-", "offen", "in arbeit", "erledigt", "blockiert", "verzug"]);
    for (const line of item.meta || []) {
      const el = document.createElement("div");
      el.className = "bbm-tops-list-row-meta-line";
      const value = String(line || "").trim();
      const normalized = value.toLowerCase();
      const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
      const isDeDate = /^\d{2}\.\d{2}\.\d{4}$/.test(value);
      if (statusTokens.has(normalized)) {
        el.classList.add("bbm-tops-list-row-meta-line-status");
      } else if (!isIsoDate && !isDeDate) {
        el.classList.add("bbm-tops-list-row-meta-line-responsible");
      }
      const text = document.createElement("span");
      text.className = "bbm-tops-list-row-meta-text";
      text.textContent = line;
      el.appendChild(text);
      if (statusTokens.has(normalized)) {
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
        } else if (symbolType === "task") {
          const img = document.createElement("img");
          img.className = "bbm-tops-list-row-meta-symbol";
          img.src = TODO_PNG;
          img.alt = "ToDo";
          img.title = "ToDo";
          img.dataset.symbol = "task";
          ampelSlot.appendChild(img);
        } else if (item.showAmpelInList !== false && item.ampelColor) {
          const dot = document.createElement("span");
          dot.className = "bbm-tops-list-row-ampel";
          dot.dataset.color = String(item.ampelColor || "");
          dot.setAttribute("aria-label", `Ampel ${item.ampelColor}`);
          ampelSlot.appendChild(dot);
        }
        el.appendChild(ampelSlot);
      }
      meta.appendChild(el);
    }

    row.append(num, text, meta);
    this._uiEditorColumnRefs.number.push(num);
    this._uiEditorColumnRefs.text.push(text);
    this._uiEditorColumnRefs.meta.push(meta);
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
