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
      onChange: () => this._emitChange(),
    });

    this.flagsMetaRow = document.createElement("div");
    this.flagsMetaRow.className = "bbm-tops-meta-flags";
    if (this.flagsWrap) this.flagsMetaRow.appendChild(this.flagsWrap);
    this.metaPanel.root.appendChild(this.flagsMetaRow);

    this.statusAmpelBridge = new TopsStatusAmpelBridge({
      metaPanel: this.metaPanel,
      onChange: () => this._emitChange(),
    });
    this.statusAmpelBridge.mount();

    this.responsibleBridge = new TopsResponsibleBridge({
      metaPanel: this.metaPanel,
      loadCompanies: this.loadCompanies,
      loadEmployeesByCompany: this.loadEmployeesByCompany,
      onChange: () => this._emitChange(),
    });
    this.responsibleBridge.mount();

    this.root = this.metaPanel.root;
  }

  _emitChange() {
    if (this.onChange) this.onChange(this.getDraft());
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
