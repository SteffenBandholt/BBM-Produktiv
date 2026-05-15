import { TopsMetaPanel } from "../../tops/components/TopsMetaPanel.js";
import { TopsResponsibleBridge } from "../../tops/components/TopsResponsibleBridge.js";
import { TopsStatusAmpelBridge } from "../../tops/components/TopsStatusAmpelBridge.js";

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
const RED_FLAG_PNG = resolveModuleAsset("../../assets/redFlag.png");

export class WorkbenchMetaColumn {
  constructor({
    flagsWrap,
    loadCompanies,
    loadEmployeesByCompany,
    onChange,
  } = {}) {
    this.flagsWrap = flagsWrap || null;
    this.loadCompanies = typeof loadCompanies === "function" ? loadCompanies : null;
    this.loadEmployeesByCompany =
      typeof loadEmployeesByCompany === "function" ? loadEmployeesByCompany : null;
    this.onChange = typeof onChange === "function" ? onChange : null;

    this.metaPanel = new TopsMetaPanel({
      onChange: () => this._emitChange("meta"),
    });

    this.flagsMetaRow = document.createElement("div");
    this.flagsMetaRow.className = "bbm-tops-meta-flags";
    if (this.flagsWrap) this.flagsMetaRow.appendChild(this.flagsWrap);
    this.metaPanel.root.appendChild(this.flagsMetaRow);
    if (this.flagsWrap) {
      this.flagsWrap.addEventListener("change", () => this._syncMetaSymbols());
      this.flagsWrap.addEventListener("input", () => this._syncMetaSymbols());
    }

    this.metaFields = document.createElement("div");
    this.metaFields.className = "bbm-tops-meta-fields";
    this.metaPanel.root.appendChild(this.metaFields);

    this.statusAmpelBridge = new TopsStatusAmpelBridge({
      metaPanel: this.metaPanel,
      onChange: () => this._emitChange("meta"),
    });

    this.statusRow = document.createElement("div");
    this.statusRow.className = "bbm-tops-meta-row bbm-tops-meta-row-status";
    this.metaFields.appendChild(this.statusRow);

    this.statusCell = document.createElement("div");
    this.statusCell.className = "bbm-tops-meta-cell bbm-tops-meta-status-cell";
    this.statusCell.appendChild(this.statusAmpelBridge.field.statusWrap);
    this.statusRow.appendChild(this.statusCell);

    this.responsibleCell = document.createElement("div");
    this.responsibleCell.className = "bbm-tops-meta-cell bbm-tops-meta-responsible-cell";

    this.responsibleBridge = new TopsResponsibleBridge({
      metaPanel: this.metaPanel,
      loadCompanies: this.loadCompanies,
      loadEmployeesByCompany: this.loadEmployeesByCompany,
      onChange: () => this._emitChange("meta"),
    });
    this.responsibleCell.appendChild(this.responsibleBridge.field.getElement());
    this.statusRow.appendChild(this.responsibleCell);

    this.dueRow = document.createElement("div");
    this.dueRow.className = "bbm-tops-meta-row bbm-tops-meta-row-due";
    this.metaFields.appendChild(this.dueRow);

    this.dueAmpelCell = document.createElement("div");
    this.dueAmpelCell.className = "bbm-tops-meta-cell bbm-tops-meta-due-with-ampel";
    this.dueAmpelCell.appendChild(this.statusAmpelBridge.root);

    this.metaSymbolRow = document.createElement("div");
    this.metaSymbolRow.className = "bbm-tops-meta-symbol-row";

    this.metaSymbolSlot = document.createElement("div");
    this.metaSymbolSlot.className = "bbm-tops-meta-symbol-slot";
    this.metaSymbolRow.appendChild(this.statusAmpelBridge.field.trafficDot);
    this.metaSymbolRow.appendChild(this.metaSymbolSlot);
    this.statusAmpelBridge.field.trafficWrap.appendChild(this.metaSymbolRow);

    this.dueRow.appendChild(this.dueAmpelCell);

    this.root = this.metaPanel.root;
    this._syncMetaSymbols();
  }

  _emitChange(source = "meta") {
    this._syncMetaSymbols();
    if (this.onChange) this.onChange({ draft: this.getDraft(), source });
  }

  _readFlagState(metaValue = null) {
    const result = {
      task: false,
      decision: false,
    };

    const readFromNode = (node) => {
      if (!node) return;
      const flag = String(node?.dataset?.flag || "").trim();
      if (flag === "task" || flag === "decision") {
        result[flag] = Number(node?.checked) === 1 || node?.checked === true;
      }
      const children = node?.children ? Array.from(node.children) : [];
      for (const child of children) readFromNode(child);
    };

    readFromNode(this.flagsWrap);

    if (!result.task && !result.decision) {
      result.task = Number(metaValue?.is_task ?? metaValue?.isTask) === 1;
      result.decision = Number(metaValue?.is_decision ?? metaValue?.isDecision) === 1;
    }

    return result;
  }

  _createMetaSymbol(src, alt, title, symbolKey) {
    const img = document.createElement("img");
    img.className = "bbm-tops-meta-symbol";
    img.src = src;
    img.alt = alt;
    img.title = title;
    img.dataset.symbol = symbolKey;
    return img;
  }

  _syncMetaSymbols(metaValue = null) {
    if (!this.metaSymbolSlot) return;
    const flags = this._readFlagState(metaValue);
    const icons = [];
    if (flags.task) {
      icons.push(this._createMetaSymbol(TODO_PNG, "ToDo", "ToDo", "task"));
    }
    if (flags.decision) {
      icons.push(this._createMetaSymbol(RED_FLAG_PNG, "Beschluss", "Beschluss", "decision"));
    }

    if (typeof this.metaSymbolSlot.replaceChildren === "function") {
      this.metaSymbolSlot.replaceChildren(...icons);
    } else {
      this.metaSymbolSlot.innerHTML = "";
      this.metaSymbolSlot.append(...icons);
    }

    this.metaSymbolSlot.style.display = icons.length ? "inline-flex" : "none";
    this.metaSymbolSlot.dataset.hasSymbols = icons.length ? "true" : "false";
  }

  async initialize() {
    await this.responsibleBridge.initialize();
  }

  getDraft() {
    return this.metaPanel.getValue();
  }

  applyState(metaVm = {}) {
    const metaValue = metaVm?.value || {};
    const metaAccess = metaVm?.access || {};
    const metaDisabled = !!metaAccess?.disabled;
    const responsibleDisabled = !!metaAccess?.responsibleDisabled;

    this.metaPanel.setValue(metaValue);
    this.statusAmpelBridge.applyDraftValue(metaValue);
    this.responsibleBridge.applyDraftValue(metaValue?.responsible_label || "");
    this._syncMetaSymbols(metaValue);

    this.metaPanel.setDisabled(metaDisabled);
    this.statusAmpelBridge.setDisabled(metaDisabled);
    this.responsibleBridge.setDisabled(metaDisabled || responsibleDisabled);
  }
}
