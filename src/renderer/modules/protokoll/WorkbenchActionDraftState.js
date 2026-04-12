export class WorkbenchActionDraftState {
  constructor({ sharedEditboxCore, metaColumn, root, buttons } = {}) {
    this.sharedEditboxCore = sharedEditboxCore || null;
    this.metaColumn = metaColumn || null;
    this.root = root || null;
    this.buttons = buttons || {};
  }

  getDraft() {
    return {
      ...(this.sharedEditboxCore ? this.sharedEditboxCore.getDraft() : {}),
      ...(this.metaColumn ? this.metaColumn.getDraft() : {}),
    };
  }

  applyActionState(actionsVm = {}) {
    const hasSelection = !!actionsVm?.hasSelection;
    const isReadOnly = !!actionsVm?.isReadOnly;
    const isWriting = !!actionsVm?.isWriting;
    const isMoveMode = !!actionsVm?.isMoveMode;
    const canSave = !!actionsVm?.canSave;
    const canDelete = !!actionsVm?.canDelete;
    const canMove = !!actionsVm?.canMove;
    const canCreateLevel1 = !!actionsVm?.canCreateLevel1;
    const canCreateChild = !!actionsVm?.canCreateChild;

    if (this.buttons.btnL1) this.buttons.btnL1.disabled = isReadOnly || isWriting || !canCreateLevel1;
    if (this.buttons.btnChild) this.buttons.btnChild.disabled = isReadOnly || isWriting || !canCreateChild;
    if (this.buttons.btnMove) this.buttons.btnMove.disabled = isReadOnly || isWriting || !canMove;
    if (this.buttons.btnSave) this.buttons.btnSave.disabled = isReadOnly || isWriting || !canSave;
    if (this.buttons.btnDelete) this.buttons.btnDelete.disabled = isReadOnly || isWriting || !canDelete;

    if (this.root) {
      this.root.dataset.hasSelection = hasSelection ? "true" : "false";
      this.root.dataset.isReadOnly = isReadOnly ? "true" : "false";
      this.root.dataset.isMoveMode = isMoveMode ? "true" : "false";
    }

    if (this.buttons.btnMove) {
      this.buttons.btnMove.textContent = isMoveMode ? "Schieben aktiv" : "Schieben";
    }
  }
}
