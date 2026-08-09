import { TopsWorkbench as BaseTopsWorkbench } from "../../tops/components/TopsWorkbench.js";
import { getM80Ref, registerM80Ref } from "../../ui-editor/m80Refs.js";

export class TopsWorkbench extends BaseTopsWorkbench {
  constructor(options = {}) {
    super(options);
    this._installUiEditorCounterBinding();
  }

  _installUiEditorCounterBinding() {
    const root = this.root;
    const editbox = this.sharedEditboxCore?.editbox;
    if (!root || !editbox) return;

    const registerCounters = () => {
      if (!getM80Ref("protokoll.edit.short.counter")) {
        registerM80Ref("protokoll.edit.short.counter", editbox.shortCounter);
      }
      if (!getM80Ref("protokoll.edit.long.counter")) {
        registerM80Ref("protokoll.edit.long.counter", editbox.longCounter);
      }
    };

    Object.defineProperty(this, "root", {
      configurable: true,
      enumerable: true,
      get() {
        registerCounters();
        return root;
      },
    });
  }
}

export { SharedEditboxCore } from "./SharedEditboxCore.js";
export { WorkbenchMetaColumn } from "./WorkbenchMetaColumn.js";
export { WorkbenchShellFrame } from "./WorkbenchShellFrame.js";
export { WorkbenchActionDraftState } from "./WorkbenchActionDraftState.js";
