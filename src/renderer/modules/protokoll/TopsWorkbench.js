import { TopsWorkbench as BaseTopsWorkbench } from "../../tops/components/TopsWorkbench.js";
import { getM80Ref, registerM80Ref } from "../../ui-editor/m80Refs.js";

export class TopsWorkbench extends BaseTopsWorkbench {
  constructor(options = {}) {
    super(options);
    this._installUiEditorCounterBinding();
  }

  _installUiEditorCounterBinding() {
    const sharedEditboxCore = this.sharedEditboxCore;
    const editbox = sharedEditboxCore?.editbox;
    if (!sharedEditboxCore || !editbox) return;

    const registerCounters = () => {
      if (!getM80Ref("protokoll.edit.short.counter")) {
        registerM80Ref("protokoll.edit.short.counter", editbox.shortCounter);
      }
      if (!getM80Ref("protokoll.edit.long.counter")) {
        registerM80Ref("protokoll.edit.long.counter", editbox.longCounter);
      }
    };

    Object.defineProperty(this, "sharedEditboxCore", {
      configurable: true,
      enumerable: true,
      get() {
        registerCounters();
        return sharedEditboxCore;
      },
    });
  }
}

export { SharedEditboxCore } from "./SharedEditboxCore.js";
export { WorkbenchMetaColumn } from "./WorkbenchMetaColumn.js";
export { WorkbenchShellFrame } from "./WorkbenchShellFrame.js";
export { WorkbenchActionDraftState } from "./WorkbenchActionDraftState.js";
