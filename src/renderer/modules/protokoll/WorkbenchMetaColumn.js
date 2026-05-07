import { TopsMetaPanel } from "../../tops/components/TopsMetaPanel.js";
import { TopsResponsibleBridge } from "../../tops/components/TopsResponsibleBridge.js";
import { TopsStatusAmpelBridge } from "../../tops/components/TopsStatusAmpelBridge.js";

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
    this.dueRow.appendChild(this.dueAmpelCell);

    this.root = this.metaPanel.root;
  }

  _emitChange(source = "meta") {
    if (this.onChange) this.onChange({ draft: this.getDraft(), source });
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

    this.metaPanel.setDisabled(metaDisabled);
    this.statusAmpelBridge.setDisabled(metaDisabled);
    this.responsibleBridge.setDisabled(metaDisabled || responsibleDisabled);
  }
}
