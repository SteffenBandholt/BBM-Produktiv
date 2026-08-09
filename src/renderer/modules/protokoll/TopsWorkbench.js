import { TopsWorkbench as BaseTopsWorkbench } from "../../tops/components/TopsWorkbench.js";
import { getM80Ref, registerM80Ref } from "../../ui-editor/m80Refs.js";

export class TopsWorkbench extends BaseTopsWorkbench {
  constructor(options = {}) {
    super(options);
    this._registerUiEditorCounterRefs();
  }

  _registerUiEditorCounterRefs() {
    const editbox = this.sharedEditboxCore?.editbox;
    if (!editbox) return;

    if (!getM80Ref("protokoll.edit.short.counter")) {
      registerM80Ref("protokoll.edit.short.counter", editbox.shortCounter);
    }
    if (!getM80Ref("protokoll.edit.long.counter")) {
      registerM80Ref("protokoll.edit.long.counter", editbox.longCounter);
    }
  }

  setState(...args) {
    const result = super.setState(...args);
    this._registerUiEditorCounterRefs();
    return result;
  }
}

export { SharedEditboxCore } from "./SharedEditboxCore.js";
export { WorkbenchMetaColumn } from "./WorkbenchMetaColumn.js";
export { WorkbenchShellFrame } from "./WorkbenchShellFrame.js";
export { WorkbenchActionDraftState } from "./WorkbenchActionDraftState.js";
